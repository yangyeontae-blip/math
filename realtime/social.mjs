import {CHAT_TTL,CHAT_LIMIT,CHAT_INTERVAL,OPERATOR_SESSION_TTL,normalizeChat,validChatIdentity} from '../src/plaza-social.ts';
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
const sha=async text=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const same=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
export class PlazaSocial {
 constructor(ctx,env,room,clock=()=>Date.now()){this.ctx=ctx;this.env=env;this.room=room;this.now=clock;}
 async schedule(at){const current=await this.ctx.storage.getAlarm();if(current===null||current<=this.now()||current>at)await this.ctx.storage.setAlarm(at);}
 async history(){const now=this.now(),recent=await this.ctx.storage.transaction(async tx=>{const all=await tx.get('chat:history')??[],recent=all.filter(m=>m.sentAt+CHAT_TTL>now).slice(-CHAT_LIMIT);if(recent.length!==all.length)await tx.put('chat:history',recent);return recent;});if(recent.length)await this.schedule(recent[0].sentAt+CHAT_TTL);return recent;}
 async session(raw){if(typeof raw!=='string'||!/^[a-f0-9]{64}$/.test(raw))return null;const key='auth:session:'+await sha(raw),data=await this.ctx.storage.get(key);if(!data||data.expiresAt<=this.now()){if(data)await this.ctx.storage.delete(key);return null;}return {key,...data};}
 async http(request){const now=this.now(),bearer=request.headers.get('authorization')?.replace(/^Bearer /,'');
  if(request.method==='GET'){const session=await this.session(bearer);return session?json({ok:true,role:'operator',expiresAt:session.expiresAt}):json({ok:false,error:'authentication'},401);}
  if(request.method==='DELETE'){const session=await this.session(bearer);if(session){await this.ctx.storage.delete(session.key);this.demote(session.key);}return json({ok:true});}
  if(request.method!=='POST')return json({error:'method'},405);
  const expected=this.env.OPERATOR_CODE_HASH;if(typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected))return json({error:'not_ready'},503);
  const ipKey='auth:fail:'+await sha(request.headers.get('cf-connecting-ip')??'local');
  let code;try{if(Number(request.headers.get('content-length'))>512)return json({error:'authentication'},400);const raw=await request.text();if(raw.length>512)return json({error:'authentication'},400);code=JSON.parse(raw).code;}catch{return json({error:'authentication'},400);}
  const valid=typeof code==='string'&&code.length<=128&&same(await sha(code),expected),raw=token(),key='auth:session:'+await sha(raw),expiresAt=now+OPERATOR_SESSION_TTL;
  const result=await this.ctx.storage.transaction(async tx=>{const fail=await tx.get(ipKey);if(fail?.until>now&&fail.count>=5)return {error:'rate',retryAt:fail.until,status:429};
   if(!valid){const count=fail?.until>now?fail.count+1:1,until=fail?.until>now?fail.until:now+15*60*1000;await tx.put(ipKey,{count,until});return {error:'authentication',retryAt:until,status:401};}
   const sessions=await tx.list({prefix:'auth:session:'});if([...sessions.values()].filter(s=>s.expiresAt>now).length>=32)return {error:'session_limit',status:429};await tx.delete(ipKey);await tx.put(key,{expiresAt});return {ok:true};});
  if(result.error){if(result.retryAt)await this.schedule(result.retryAt);return json({error:result.error,...(result.retryAt?{retryAt:result.retryAt}:{})},result.status);}await this.schedule(expiresAt);return json({ok:true,role:'operator',token:raw,expiresAt});
 }
 demote(key){for(const [ws,s] of this.room.sessions()){if(s.authSession!==key)continue;s.operatorUntil=0;s.authSession=null;ws.serializeAttachment(s);this.room.send(ws,{type:'role',role:'player',expiresAt:0});this.room.broadcast({type:'role-player',id:s.id,role:'player'});}}
 async prepare(s,m){s.chatEnabled=validChatIdentity(m.chatIdentity);s.chatSender=await sha('plaza-chat:'+(s.chatEnabled?m.chatIdentity:s.id));const session=await this.session(m.operatorToken);s.authSession=session?.key??null;s.operatorUntil=session?.expiresAt??0;return s;}
 role(s){return s.operatorUntil>this.now()?'operator':'player';}
 async operator(ws,s){const auth=s.authSession&&await this.ctx.storage.get(s.authSession);if(!auth||auth.expiresAt<=this.now()){if(s.authSession)this.demote(s.authSession);this.room.send(ws,{type:'chat-error',reason:'permission'});return false;}return true;}
 async welcome(ws,s){if(!s.chatEnabled)return;this.room.send(ws,{type:'chat-history',messages:await this.history()});const muted=await this.ctx.storage.get('chat:mute:'+s.chatSender);this.room.send(ws,{type:'chat-status',mutedUntil:muted?.until>this.now()?muted.until:0});if(this.role(s)==='operator')await this.sendMutes(ws);}
 async sendMutes(ws){const records=await this.ctx.storage.list({prefix:'chat:mute:'});this.room.send(ws,{type:'chat-mutes',mutes:[...records.entries()].filter(([,m])=>m.until>this.now()).map(([key,m])=>({senderId:key.slice(10),nickname:m.nickname,until:m.until}))});}
 async handle(ws,s,m){
  if(m.type==='chat'){
   if(!s.chatEnabled){this.room.send(ws,{type:'chat-error',reason:'not_ready'});return true;}const text=normalizeChat(m.text);if(text===null){this.room.send(ws,{type:'chat-error',reason:'content'});return true;}const now=this.now();
   const result=await this.ctx.storage.transaction(async tx=>{const mute=await tx.get('chat:mute:'+s.chatSender);if(mute?.until>now)return {error:'muted',until:mute.until};const last=await tx.get('chat:last:'+s.chatSender);if(last&&now-last.at<CHAT_INTERVAL)return {error:'rate'};if(last?.text===text&&now-last.at<30000)return {error:'repeat'};
    const message={id:crypto.randomUUID(),senderId:s.chatSender,nickname:s.profile.nickname,text,operator:this.role(s)==='operator',sentAt:now};const history=(await tx.get('chat:history')??[]).filter(x=>x.sentAt+CHAT_TTL>now);history.push(message);await tx.put('chat:history',history.slice(-CHAT_LIMIT));await tx.put('chat:last:'+s.chatSender,{at:now,text,until:now+CHAT_TTL});return {message};});
   if(result.error)this.room.send(ws,{type:'chat-error',reason:result.error,mutedUntil:result.until??0});else{this.room.broadcast({type:'chat-message',message:result.message,playerId:s.id});await this.schedule(now+CHAT_TTL);}return true;
  }
  if(m.type==='chat-delete'||m.type==='chat-mute'||m.type==='chat-unmute'||m.type==='chat-mutes'){
   if(!await this.operator(ws,s))return true;
   if(m.type==='chat-mutes'){await this.sendMutes(ws);return true;}
   if(m.type==='chat-delete'){const found=await this.ctx.storage.transaction(async tx=>{const history=await tx.get('chat:history')??[];if(typeof m.messageId!=='string'||!history.some(x=>x.id===m.messageId))return false;await tx.put('chat:history',history.filter(x=>x.id!==m.messageId));return true;});if(found)this.room.broadcast({type:'chat-removed',messageId:m.messageId});else this.room.send(ws,{type:'chat-error',reason:'missing'});return true;}
   if(typeof m.senderId!=='string'||!/^[a-f0-9]{64}$/.test(m.senderId)){this.room.send(ws,{type:'chat-error',reason:'missing'});return true;}
   const key='chat:mute:'+m.senderId;
   if(m.type==='chat-mute'){
    if(![600,3600].includes(m.seconds)){this.room.send(ws,{type:'chat-error',reason:'duration'});return true;}
    const history=await this.history(),author=history.findLast(x=>x.senderId===m.senderId),peers=this.room.sessions();if(!author){this.room.send(ws,{type:'chat-error',reason:'missing'});return true;}
    if(peers.some(([,p])=>p.chatSender===m.senderId&&this.role(p)==='operator')){this.room.send(ws,{type:'chat-error',reason:'operator'});return true;}
    const until=this.now()+m.seconds*1000;await this.ctx.storage.put(key,{nickname:author.nickname,until});await this.schedule(until);for(const [other,p] of peers)if(p.chatSender===m.senderId)this.room.send(other,{type:'chat-status',mutedUntil:until});
   }else {await this.ctx.storage.delete(key);for(const [other,p] of this.room.sessions())if(p.chatSender===m.senderId)this.room.send(other,{type:'chat-status',mutedUntil:0});}
   await this.sendMutes(ws);return true;
  }
  return false;
 }
 async alarm(){const now=this.now();await this.history();const next=[];for(const prefix of ['auth:session:','auth:fail:','chat:mute:','chat:last:']){const records=await this.ctx.storage.list({prefix});for(const [key,value] of records){const at=value.expiresAt??value.until;if(at<=now){await this.ctx.storage.delete(key);if(prefix==='auth:session:')this.demote(key);}else next.push(at);}}const messages=await this.history();if(messages.length)next.push(messages[0].sentAt+CHAT_TTL);if(next.length)await this.schedule(Math.min(...next));}
}