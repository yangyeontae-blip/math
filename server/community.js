import {isBlockedNickname} from '../src/nickname.ts';
import {operationsForGrade,questionAnswerText} from '../src/rules.ts';
import {createPartyRun,publicPartyQuestion,answerPartyQuestion} from '../src/forest-party.ts';

const ORIGINS=new Set(['https://yangyeontae-blip.github.io','https://berry-forest-school.vercel.app','https://berry-forest-school.yangyeontae.chatgpt.site','https://localhost','http://localhost','capacitor://localhost']);
const enc=new TextEncoder();
const reads=new Map();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
const name=(v,max=10)=>typeof v==='string'&&v===v.trim()&&[...v].length>0&&[...v].length<=max&&!/[\u0000-\u001f\u007f<>]/.test(v)&&!isBlockedNickname(v)?v:null;
class CommunityError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const fail=(message,status)=>{throw new CommunityError(message,status);};
async function body(request){const reader=request.body?.getReader();if(!reader)fail('요청을 확인해 주세요.');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();fail('요청이 너무 커요.',413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.byteLength;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('요청을 확인해 주세요.');}}
function publicRoom(r,me){
 const members=r.members.map(m=>({id:m.id,nickname:m.nickname,leader:r.leader===m.id,score:r.scores?.[m.id]??0,ready:r.ready?.includes(m.id)??false}));
 if(r.kind==='guild')return {kind:'guild',code:r.code,name:r.name,members,you:me};
 return {kind:'duel',code:r.code,members,you:me,grade:r.grade,forest:r.forest,phase:r.phase,round:r.round,rounds:5,question:r.run?publicPartyQuestion(r.run):null,...(r.phase==='result'||r.phase==='finished'?{answer:questionAnswerText(r.run.question),result:r.result}:{}),winner:r.phase==='finished'?members[0].score===members[1].score?'draw':members.reduce((a,b)=>a.score>b.score?a:b).id:null};
}
function nextRound(r){r.round++;r.phase='playing';r.answered=[];r.run=createPartyRun({forest:r.forest,grade:r.grade,level:10,stage:1});}
function transition(r,now){if(r.kind==='duel'&&r.phase==='result'&&now>=r.nextAt){if(r.round>=5)r.phase='finished';else nextRound(r);}}
function changeRoom(r,b,me,now){
 transition(r,now);const member=r.members.find(m=>m.id===me);
 if(b.action==='join'){
  if(member)return;
  if(r.kind==='duel'&&(r.members.length>=2||r.phase!=='waiting'))fail('이미 시작했거나 자리가 가득 찼어요.',409);
  if(r.members.length>=(r.kind==='guild'?24:2))fail('자리가 가득 찼어요.',409);
  const nickname=name(b.nickname);if(!nickname)fail('별명을 확인해 주세요.');r.members.push({id:me,nickname});if(r.kind==='duel')r.scores[me]=0;return;
 }
 if(!member)fail('먼저 초대 코드로 참가해 주세요.',403);
 if(b.action==='state')return;
 if(b.action==='leave'){
  if(r.kind==='guild'&&r.leader===me&&r.members.length>1)fail('길드장을 친구에게 넘긴 뒤 나가요.');
  r.members=r.members.filter(m=>m.id!==me);if(r.kind==='duel')r.phase='cancelled';return;
 }
 if(r.kind==='guild'){
  if(r.leader!==me)fail('길드장만 할 수 있어요.',403);
  const target=r.members.find(m=>m.id===b.target);if(!target||target.id===me)fail('다른 길드 친구를 골라요.');
  if(b.action==='transfer')r.leader=target.id;
  else if(b.action==='kick')r.members=r.members.filter(m=>m.id!==target.id);
  else fail('지원하지 않는 요청이에요.');return;
 }
 if(b.action==='ready'){
  if(r.phase!=='waiting')return;if(!r.ready.includes(me))r.ready.push(me);
  if(r.members.length===2&&r.members.every(m=>r.ready.includes(m.id)))nextRound(r);return;
 }
 if(b.action!=='answer')fail('지원하지 않는 요청이에요.');
 if(r.phase!=='playing'||b.questionId!==r.run.questionId||r.answered.includes(me))fail('다음 문제를 기다려요.',409);
 if(typeof b.answer!=='string'||b.answer.length>24)fail('답을 확인해 주세요.');
 if(now-(r.lastAnswer?.[me]??0)<500)fail('천천히 생각하고 다시 답해요.',429);
 r.lastAnswer??={};r.lastAnswer[me]=now;r.answered.push(me);
 const result=answerPartyQuestion(r.run,me,r.run.questionId,b.answer);
 if(result.correct){r.scores[me]++;r.result=member.nickname+'의 정답!';r.phase='result';r.nextAt=now+2200;}
 else if(r.answered.length===2){r.result='둘 다 다시 배운 문제예요. 다음 문제에 도전해요.';r.phase='result';r.nextAt=now+2200;}
}
async function limited(DB,key,bucket,max){const row=await DB.prepare('INSERT INTO community_limits (key,bucket,hits) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN bucket=excluded.bucket THEN hits+1 ELSE 1 END,bucket=excluded.bucket RETURNING hits').bind(key,bucket).first();return row.hits>max;}

/** Independent room records; revision checks serialize simultaneous answers and guild membership changes. */
export async function handleCommunity(request,env,now=Date.now()){
 const origin=request.headers.get('origin')??'',allowed=ORIGINS.has(origin)||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin',...(allowed?{'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'Authorization, Content-Type'}:{})};
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(!allowed)return reply({error:'허용되지 않은 요청이에요.'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청이에요.'},405);
 if(!env.DB)return reply({error:'친구 모임 서버를 준비하고 있어요.'},503);
 try{
  if(!request.headers.get('content-type')?.startsWith('application/json'))fail('요청 형식을 확인해 주세요.',415);
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token??''))fail('이 기기의 친구 모임 연결을 확인해 주세요.',401);
  const me=await hash('community:'+token),b=await body(request),kind=new URL(request.url).pathname.endsWith('/guild')?'guild':'duel';
  if(!b||typeof b!=='object')fail('요청을 확인해 주세요.');
  const bucket=Math.floor(now/300000);
  if(b.action==='state'){const previous=reads.get(me),n=previous?.bucket===bucket?previous.hits+1:1;reads.set(me,{bucket,hits:n});if(reads.size>2048)for(const [key,value]of reads)if(value.bucket!==bucket)reads.delete(key);if(n>240)fail('잠시 후 다시 해요.',429);}
  else if(await limited(env.DB,'member:'+me,bucket,240))fail('잠시 후 다시 해요.',429);
  if(b.action==='create'){
   const ip=await hash((request.headers.get('cf-connecting-ip')??'local')+Math.floor(now/3600000));if(await limited(env.DB,'create:'+ip,Math.floor(now/3600000),10))fail('모임을 너무 빠르게 만들었어요. 잠시 후 다시 해요.',429);
   const nickname=name(b.nickname);if(!nickname)fail('별명을 확인해 주세요.');
   const guildName=kind==='guild'?name(b.name,12):null;if(kind==='guild'&&!guildName)fail('길드 이름은 1~12자예요. 실명·학교·연락처는 쓰지 마세요.');
   if(kind==='duel'&&(!Number.isInteger(b.grade)||b.grade<1||b.grade>6||!operationsForGrade(b.grade).includes(b.forest)))fail('함께 풀 학년과 계산 숲을 골라요.');
   await env.DB.prepare('DELETE FROM community_rooms WHERE expires_at>0 AND expires_at<?').bind(now).run();
   await env.DB.prepare("DELETE FROM community_limits WHERE (key LIKE 'member:%' AND bucket<?) OR (key LIKE 'create:%' AND bucket<?)").bind(bucket-24,Math.floor(now/3600000)-2).run();
   const total=await env.DB.prepare('SELECT COUNT(*) AS total FROM community_rooms').bind().first();if(total.total>=2000)fail('모임 자리가 가득해요. 잠시 후 다시 해요.',429);
   const room={kind,code:code(),members:[{id:me,nickname}],leader:me,name:guildName,...(kind==='duel'?{grade:b.grade,forest:b.forest,phase:'waiting',round:0,ready:[],scores:{[me]:0},answered:[],run:null}:{})};
   await env.DB.prepare('INSERT INTO community_rooms (id,kind,payload,revision,expires_at) VALUES (?,?,?,0,?)').bind(kind+':'+room.code,kind,JSON.stringify(room),kind==='duel'?now+20*60000:0).run();
   return reply({room:publicRoom(room,me)});
  }
  if(typeof b.code!=='string'||!/^[A-Z2-9]{8}$/.test(b.code))fail('친구의 8자리 초대 코드를 확인해 주세요.');
  const id=kind+':'+b.code;
  for(let attempt=0;attempt<5;attempt++){
   const row=await env.DB.prepare('SELECT payload,revision,expires_at FROM community_rooms WHERE id=?').bind(id).first();if(!row||row.expires_at>0&&row.expires_at<=now)fail('이 모임을 찾을 수 없어요. 새 코드로 다시 만나요.',404);
   const r=JSON.parse(row.payload);changeRoom(r,b,me,now);const payload=JSON.stringify(r),expires=r.kind==='duel'&&row.expires_at<now+15*60000?now+20*60000:row.expires_at;
   if(payload===row.payload&&expires===row.expires_at)return reply({room:publicRoom(r,me)});
   const result=await env.DB.prepare('UPDATE community_rooms SET payload=?,expires_at=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,expires,id,row.revision).run();
   if(!result.meta.changes)continue;
   if(r.members.length===0)await env.DB.prepare('DELETE FROM community_rooms WHERE id=? AND revision=?').bind(id,row.revision+1).run();
   return reply({room:b.action==='leave'?null:publicRoom(r,me)});
  }
  fail('친구의 기록과 맞추는 중이에요. 한 번 더 눌러 주세요.',409);
 }catch(error){return reply({error:error instanceof CommunityError?error.message:'친구 모임 서버가 잠시 쉬고 있어요. 기록은 그대로예요.'},error instanceof CommunityError?error.status:503);}
}
