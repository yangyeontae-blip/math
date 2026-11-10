// Passwords, tokens and recovery codes are never logged or stored in plaintext.
import {validateSave, newSave} from '../src/rules.ts';
const ORIGINS=new Set(['https://yangyeontae-blip.github.io','https://berry-forest-school.yangyeontae.chatgpt.site']);
const enc=new TextEncoder(),MAX_BYTES=524288,SESSION_MS=8*60*60*1000;
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
export function accountName(v){return typeof v==='string'&&/^[a-zA-Z][a-zA-Z0-9_]{3,23}$/.test(v)?v.toLowerCase():null;}
export function accountPassword(v){return typeof v==='string'&&v.length>=10&&v.length<=128&&!/[\u0000-\u001f]/.test(v);}
export async function passwordHash(password,salt,pepper){
 const secret=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const input=await crypto.subtle.sign('HMAC',secret,enc.encode(password));
 const key=await crypto.subtle.importKey('raw',input,'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-512',salt:enc.encode(salt),iterations:100000},key,256));
}
function same(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
export function accountSave(raw){const s=validateSave(raw),keys=Object.keys(newSave('구름',0));return Object.fromEntries(keys.map(k=>[k,s[k]]));}
async function readBody(request){const reader=request.body?.getReader();if(!reader)throw Error('body');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw Error('size');}chunks.push(value);}const bytes=new Uint8Array(size);let n=0;for(const v of chunks){bytes.set(v,n);n+=v.length;}return JSON.parse(new TextDecoder().decode(bytes));}
export async function handleAccounts(request,env){
 const origin=request.headers.get('origin')||'',allowed=ORIGINS.has(origin)||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin',...(allowed?{'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'Authorization, Content-Type'}:{})};
 const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
 if(!allowed)return reply({error:'허용되지 않은 요청이에요.'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청이에요.'},405);
 if(!env.DB||typeof env.ACCOUNT_PEPPER!=='string'||env.ACCOUNT_PEPPER.length<32)return reply({error:'모험 보관함을 준비 중이에요. 이 기기의 이어하기는 그대로 사용할 수 있어요.'},503);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'요청 형식을 확인해 주세요.'},415);
 const action=new URL(request.url).pathname.split('/').at(-1);
 if(!['register','login','recover','load','save','logout'].includes(action))return reply({error:'지원하지 않는 요청이에요.'},404);
 let body;try{body=await readBody(request);}catch{return reply({error:'내용을 읽지 못했어요.'},400);}
 try{
  const now=Date.now(),bucket=Math.floor(now/600000),ip=request.headers.get('cf-connecting-ip')||'unknown';
  // Shared atomic D1 limits survive isolate restarts. Store a rotating keyed digest, never raw IP.
  const rateKey=await digest(env.ACCOUNT_PEPPER+':'+bucket+':'+ip);
  const auth=['register','login','recover'].includes(action),cap=auth?60:600;
  const hit=await env.DB.prepare('INSERT INTO account_limits (key,bucket,hits) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET hits=hits+1 WHERE hits < ? RETURNING hits').bind((auth?'auth:':'save:')+rateKey,bucket,cap).first();
  if(!hit)return reply({error:'잠시 쉬었다 다시 시도해 주세요.'},429);
  await env.DB.prepare('DELETE FROM account_limits WHERE bucket < ?').bind(bucket-1).run();
  await env.DB.prepare('DELETE FROM adventure_sessions WHERE expires_at < ?').bind(now).run();
  if(auth){
   const name=accountName(body.username);
   if(!name||!accountPassword(body.password))return reply({error:'아이디는 영문자로 시작하는 영문·숫자·밑줄 4~24자, 비밀번호는 10~128자로 적어 주세요.'},400);
   // Account-target limit also prevents attacks across multiple source addresses.
   const target=await digest(env.ACCOUNT_PEPPER+':'+bucket+':'+name);
   if(!await env.DB.prepare('INSERT INTO account_limits (key,bucket,hits) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET hits=hits+1 WHERE hits < 8 RETURNING hits').bind('target:'+target,bucket).first())return reply({error:'입력 시도가 많아요. 10분 뒤 다시 시도해 주세요.'},429);
   const row=await env.DB.prepare('SELECT * FROM adventure_accounts WHERE username=?').bind(name).first();
   if(action==='register'){
    if(body.consent!==true)return reply({error:'게임 기록을 온라인에 보관하는 데 동의해 주세요.'},400);
    if(row)return reply({error:'이 아이디는 사용할 수 없어요. 다른 아이디를 골라 주세요.'},409);
    const salt=random(),recovery=random(),hash=await passwordHash(body.password,salt,env.ACCOUNT_PEPPER);
    const result=await env.DB.prepare('INSERT OR IGNORE INTO adventure_accounts (username,password_hash,salt,recovery_hash,revision,updated_at) VALUES (?, ?, ?, ?, 0, ?)').bind(name,hash,salt,await digest(recovery),now).run();
    if(!result.meta?.changes)return reply({error:'이 아이디는 사용할 수 없어요.'},409);
    const token=random();await env.DB.prepare('INSERT INTO adventure_sessions (token_hash,username,expires_at,credential_version) VALUES (?, ?, ?, ?)').bind(await digest(token),name,now+SESSION_MS,salt).run();
    return reply({ok:true,username:name,token,recoveryCode:recovery,expiresAt:now+SESSION_MS});
   }
   if(action==='recover'){
    const code=typeof body.recoveryCode==='string'?body.recoveryCode.replace(/[\s-]/g,'').toLowerCase():'';
    if(!row||!same(await digest(code),row.recovery_hash))return reply({error:'아이디와 복구코드를 확인해 주세요.'},401);
    const salt=random(),recovery=random(),hash=await passwordHash(body.password,salt,env.ACCOUNT_PEPPER);
    // CAS prevents two simultaneous recovery requests reusing the old code.
    const result=await env.DB.prepare('UPDATE adventure_accounts SET password_hash=?,salt=?,recovery_hash=? WHERE username=? AND recovery_hash=?').bind(hash,salt,await digest(recovery),name,row.recovery_hash).run();
    if(!result.meta?.changes)return reply({error:'복구코드를 다시 확인해 주세요.'},401);
    await env.DB.prepare('DELETE FROM adventure_sessions WHERE username=?').bind(name).run();
    return reply({ok:true,recoveryCode:recovery});
   }
   const hash=await passwordHash(body.password,row?.salt||'missing-account-padding',env.ACCOUNT_PEPPER);
   if(!row||!same(hash,row.password_hash))return reply({error:'아이디 또는 비밀번호를 확인해 주세요.'},401);
   const token=random();await env.DB.prepare('INSERT INTO adventure_sessions (token_hash,username,expires_at,credential_version) VALUES (?, ?, ?, ?)').bind(await digest(token),name,now+SESSION_MS,row.salt).run();return reply({ok:true,username:name,token,expiresAt:now+SESSION_MS});
  }
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'다시 로그인해 주세요.'},401);
  const hash=await digest(token),session=await env.DB.prepare('SELECT s.username FROM adventure_sessions s JOIN adventure_accounts a ON a.username=s.username AND a.salt=s.credential_version WHERE s.token_hash=? AND s.expires_at>?').bind(hash,now).first();
  if(!session)return reply({error:'로그인 시간이 끝났어요. 이 기기 기록은 남아 있어요.'},401);
  if(action==='logout'){await env.DB.prepare('DELETE FROM adventure_sessions WHERE token_hash=?').bind(hash).run();return reply({ok:true});}
  const row=await env.DB.prepare('SELECT snapshot,revision,updated_at FROM adventure_accounts WHERE username=?').bind(session.username).first();
  if(action==='load')return reply({ok:true,snapshot:row.snapshot?JSON.parse(row.snapshot):null,revision:row.revision,updatedAt:row.updated_at});
  if(!Number.isSafeInteger(body.revision)||body.revision<0)return reply({error:'보관 버전을 확인해 주세요.'},400);
  let save;try{save=accountSave(body.snapshot);}catch{return reply({error:'게임 기록 형식을 확인해 주세요. 기기의 기록은 그대로 남아 있어요.'},400);}
  const raw=JSON.stringify(save);if(enc.encode(raw).length>MAX_BYTES-1024)return reply({error:'기록이 너무 커요. 파일로 보관해 주세요.'},413);
  const result=await env.DB.prepare('UPDATE adventure_accounts SET previous_snapshot=snapshot,snapshot=?,revision=revision+1,updated_at=? WHERE username=? AND revision=?').bind(raw,now,session.username,body.revision).run();
  if(!result.meta?.changes)return reply({error:'다른 기기에서 새 기록을 보관했어요. 두 기록을 비교해 주세요.',conflict:true},409);
  return reply({ok:true,revision:body.revision+1,updatedAt:now});
 }catch{return reply({error:'보관함에 연결하지 못했어요. 기기 기록은 그대로예요. 잠시 후 다시 시도해 주세요.'},503);}
}
