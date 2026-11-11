import {handlePartyInvite} from './party-invites.mjs';
import {HallOfFame} from './hall.mjs';
import {hallResponseLimit} from '../src/hall.ts';
import {parseForestRoom,forestRoomKey,presenceIdFromHash} from '../src/forest-room.ts';
export {ForestParty} from './party.mjs';
import {PlazaSocial} from './social.mjs';
import {DurableObject} from 'cloudflare:workers';
import {PLAZA_VERSION,PLAZA_ROOM,PLAZA_CAPACITY,PLAZA_AVATAR_CATALOG,PLAZA_TITLE_CATALOG,compatibleTitleProfile,compatiblePlazaProfile,parsePlazaProfile,parsePlazaPose,isPlazaEmote} from '../src/plaza-protocol.ts';
const ORIGINS=new Set(['https://yangyeontae-blip.github.io','https://berry-forest-school.yangyeontae.chatgpt.site','capacitor://localhost','ionic://localhost','https://localhost','http://localhost']);
export function allowedPlazaOrigin(origin){return ORIGINS.has(origin)||/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin??'');}
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/hall'){const origin=request.headers.get('origin');if(!allowedPlazaOrigin(origin))return json({error:'origin'},403);const cors={'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Authorization, Content-Type'};if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});const r=await env.PLAZA.get(env.PLAZA.idFromName(PLAZA_ROOM)).fetch(request);const headers=new Headers(r.headers);for(const [k,v]of Object.entries(cors))headers.set(k,v);return new Response(r.body,{status:r.status,headers});}
  if(url.pathname==='/forest/connect'){if(!allowedPlazaOrigin(request.headers.get('origin')))return json({error:'origin'},403);if(request.method!=='GET'||request.headers.get('upgrade')?.toLowerCase()!=='websocket')return json({error:'websocket_required'},426);if(url.searchParams.get('v')!==String(PLAZA_VERSION))return json({error:'update_required'},409);const scene=parseForestRoom(url);if(!scene)return json({error:'forest'},400);return env.PLAZA.get(env.PLAZA.idFromName(forestRoomKey(scene))).fetch(request);}
  if(url.pathname==='/party/connect'){if(!allowedPlazaOrigin(request.headers.get('origin')))return json({error:'origin'},403);if(request.method!=='GET'||request.headers.get('upgrade')?.toLowerCase()!=='websocket')return json({error:'websocket_required'},426);const code=url.searchParams.get('code');if(!/^[A-Z0-9]{8}$/.test(code??''))return json({error:'code'},400);return env.PARTIES.get(env.PARTIES.idFromName(code)).fetch(request);}
  if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,version:PLAZA_VERSION,room:PLAZA_ROOM,capacity:PLAZA_CAPACITY});
  if(url.pathname==='/operator/session'){
   const origin=request.headers.get('origin');if(!allowedPlazaOrigin(origin))return json({error:'origin'},403);
   const cors={'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET, POST, DELETE, OPTIONS','access-control-allow-headers':'Authorization, Content-Type'};
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
   const result=await env.PLAZA.get(env.PLAZA.idFromName(PLAZA_ROOM)).fetch(request);const headers=new Headers(result.headers);for(const [key,value] of Object.entries(cors))headers.set(key,value);return new Response(result.body,{status:result.status,headers});
  }
  if(url.pathname!=='/connect')return json({error:'not_found'},404);
  if(!allowedPlazaOrigin(request.headers.get('origin')))return json({error:'origin'},403);
  if(request.method!=='GET'||request.headers.get('upgrade')?.toLowerCase()!=='websocket')return json({error:'websocket_required'},426);
  if(url.searchParams.get('v')!==String(PLAZA_VERSION))return json({error:'update_required'},409);
  // One fixed object for every origin, device and profile. No per-user rooms or channels.
  return env.PLAZA.get(env.PLAZA.idFromName(PLAZA_ROOM)).fetch(request);
 }
};
export class SharedPlaza extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;this.pendingPoses=new Map();this.poseTimer=null;this.lastPrune=0;this.social=new PlazaSocial(ctx,env,this);
  ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
 }
 sessions(){return this.ctx.getWebSockets().map(ws=>[ws,ws.deserializeAttachment()]).filter(([ws,s])=>s&&ws.readyState===WebSocket.OPEN);}
 public(s,catalog=PLAZA_AVATAR_CATALOG,titleSelection=true,titleCatalog=PLAZA_TITLE_CATALOG){const profile={...compatibleTitleProfile(compatiblePlazaProfile(s.profile,catalog),titleCatalog)};if(!titleSelection)delete profile.selectedTitleId;return {id:s.id,profile,pose:s.pose,role:this.social.role(s),...(s.partyInvites?{party:{grade:s.grade,invites:true}}:{})};}
 send(ws,value){try{ws.send(JSON.stringify(value));return true;}catch{return false;}}
 broadcast(value,except){const variants=new Map();for(const [ws,s] of this.sessions())if(s.joined&&ws!==except){try{const key=(s.avatarCatalog??1)+':'+!!s.titleSelection+':'+(s.titleCatalog??1);if(!variants.has(key)){const message=value.type==='upsert'?{...value,player:{...value.player,profile:{...compatibleTitleProfile(compatiblePlazaProfile(value.player.profile,s.avatarCatalog??1),s.titleCatalog??1)}}}:value;if(message.type==='upsert'&&!s.titleSelection)delete message.player.profile.selectedTitleId;variants.set(key,JSON.stringify(message));}ws.send(variants.get(key));}catch{}}}
 queuePose(s){this.pendingPoses.set(s.id,{id:s.id,pose:s.pose});if(this.poseTimer===null)this.poseTimer=setTimeout(()=>this.flushPoses(),100);}
 flushPoses(){this.poseTimer=null;const sessions=this.sessions(),alive=new Set(sessions.filter(([,s])=>s.joined).map(([,s])=>s.id));const players=[...this.pendingPoses.values()].filter(p=>alive.has(p.id));this.pendingPoses.clear();if(!players.length)return;const raw=JSON.stringify({type:'poses',players}),legacy=players.map(p=>[p.id,JSON.stringify({type:'pose',...p})]);for(const [ws,s] of sessions){if(!s.joined)continue;try{if(s.batchedPoses)ws.send(raw);else for(const [id,value] of legacy)if(id!==s.id)ws.send(value);}catch{}}}

 prune(now=Date.now(),force=false){
  if(!force&&now-this.lastPrune<1000)return;this.lastPrune=now;
  for(const [ws,s] of this.sessions()){
   const auto=this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime()??0;
   if(!s.joined&&now-s.seen>5000||now-Math.max(s.seen,auto)>40000){if(s.joined)this.broadcast({type:'leave',id:s.id},ws);try{ws.close(1001,'inactive');}catch{}}
  }
 }
 async fetch(request){
  if(new URL(request.url).pathname==='/hall'){const hall=new HallOfFame(this.ctx.storage);if(request.method==='GET'){const u=new URL(request.url),by=u.searchParams.get('by')==='berries'?'berries':'level',me=u.searchParams.get('me')??'';const limit=hallResponseLimit(u.searchParams.get('limit'));if(limit===null)return json({error:'limit'},400);const board=await hall.board(by,/^[a-f0-9]{64}$/.test(me)?me:'');return json({...board,entries:board.entries.slice(0,limit)});}if(request.method!=='POST')return json({error:'method'},405);if(Number(request.headers.get('content-length'))>2048)return json({error:'size'},413);let report;try{const raw=await request.text();if(raw.length>2048)return json({error:'size'},413);report=JSON.parse(raw);}catch{return json({error:'body'},400);}const token=request.headers.get('authorization')?.replace(/^Bearer /,''),operator=!!await this.social.session(token),result=await hall.report(report,operator);return json(result,result.ok?200:result.error==='full'?429:400);}
  if(new URL(request.url).pathname==='/operator/verify-key'){const key=request.headers.get('x-auth-session');if(!/^auth:session:[a-f0-9]{64}$/.test(key??''))return json({error:'authentication'},401);const session=await this.ctx.storage.get(key);return session?.expiresAt>Date.now()?json({ok:true,expiresAt:session.expiresAt}):json({error:'authentication'},401);}
  if(new URL(request.url).pathname==='/operator/session')return this.social.http(request);
  this.prune(Date.now(),true);if(this.sessions().length>=PLAZA_CAPACITY){const [client,server]=Object.values(new WebSocketPair());server.accept();server.send(JSON.stringify({type:'error',code:'full'}));server.close(1013,'full');return new Response(null,{status:101,webSocket:client});}
  const [client,server]=Object.values(new WebSocketPair()),now=Date.now();
  this.ctx.acceptWebSocket(server);
  server.serializeAttachment({id:crypto.randomUUID(),forestRoom:new URL(request.url).pathname==='/forest/connect',joined:false,seen:now,pose:{x:0,y:0,z:8,angle:0},seq:-1,moveAt:now,window:now,hits:0,emoteAt:0,profileAt:0});
  this.send(server,{type:'hello',version:PLAZA_VERSION});
  return new Response(null,{status:101,webSocket:client});
 }
 async webSocketMessage(ws,raw){
  const s=ws.deserializeAttachment();if(!s)return;
  const now=Date.now();this.prune(now);if(ws.readyState!==WebSocket.OPEN)return;
  if(typeof raw!=='string'||raw.length>4096){ws.close(1009,'message_size');return;}
  if(now-s.window>=1000){s.window=now;s.hits=0;}s.hits++;
  if(s.hits>16){ws.close(1008,'rate_limit');return;}s.seen=now;ws.serializeAttachment(s);
  let m;try{m=JSON.parse(raw);}catch{ws.close(1008,'invalid_message');return;}
  if(!m||typeof m!=='object'){ws.close(1008,'invalid_message');return;}
  if(m.type==='join'&&!s.joined){
   if(s.joining)return;s.joining=true;ws.serializeAttachment(s);
   await this.social.prepare(s,m);const profile=parsePlazaProfile(m.profile,this.social.role(s)==='operator'),pose=parsePlazaPose(m.pose,!!s.forestRoom);
   if(!profile||!pose){this.send(ws,{type:'error',code:'profile'});ws.close(1008,'profile');return;}
   if(s.forestRoom&&s.chatEnabled){s.id=presenceIdFromHash(s.chatSender);for(const [old,other] of this.sessions())if(old!==ws&&other.joined&&other.id===s.id)try{old.close(1000,'reconnected');}catch{}}s.joined=true;s.joining=false;s.profile=profile;s.pose=pose;s.moveAt=now;s.profileAt=now;s.batchedPoses=m.batchedPoses===true;s.partyInvites=m.partyInvites===true&&Number.isInteger(m.grade)&&m.grade>=1&&m.grade<=6&&s.chatEnabled;s.grade=s.partyInvites?m.grade:null;s.titleSelection=m.titleSelection===true;s.titleCatalog=m.titleCatalog===PLAZA_TITLE_CATALOG?PLAZA_TITLE_CATALOG:1;s.avatarCatalog=m.salonCatalog===true||m.avatarCatalog===PLAZA_AVATAR_CATALOG?PLAZA_AVATAR_CATALOG:m.avatarCatalog===2?2:1;
   ws.serializeAttachment(s);
   this.send(ws,{type:'welcome',id:s.id,room:PLAZA_ROOM,role:this.social.role(s),operatorUntil:s.operatorUntil,features:{partyInvites:true,chat:!!s.chatEnabled,operator:true,titleSelection:true,titleCatalog:PLAZA_TITLE_CATALOG,avatarCatalog:PLAZA_AVATAR_CATALOG},players:this.sessions().filter(([other,a])=>other!==ws&&a.joined).map(([,a])=>this.public(a,s.avatarCatalog??1,!!s.titleSelection,s.titleCatalog??1)).slice(0,s.batchedPoses?PLAZA_CAPACITY-1:63)});
   this.broadcast({type:'upsert',player:this.public(s)},ws);await this.social.welcome(ws,s);return;
  }
  if(!s.joined){ws.close(1008,'join_required');return;}
  if(m.type==='party-invite'||m.type==='party-invite-reply'){await handlePartyInvite(this,ws,s,m);return;}
  if(typeof m.type==='string'&&m.type.startsWith('chat')&&await this.social.handle(ws,s,m))return;
  if(m.type==='pose'){
   const pose=parsePlazaPose(m.pose,!!s.forestRoom);
   if(!pose||!Number.isSafeInteger(m.seq)||m.seq<0||m.seq>1e9){ws.close(1008,'pose');return;}
   if(m.seq<=s.seq)return;
   const travel=Math.hypot(pose.x-s.pose.x,pose.z-s.pose.z),seconds=Math.min(2,Math.max(0,(now-s.moveAt)/1000));
   // The fastest existing mount with Wind Step remains within this generous limit.
   if(travel>seconds*72+2){this.send(ws,{type:'correction',pose:s.pose});return;}
   s.pose=pose;s.seq=m.seq;s.moveAt=now;ws.serializeAttachment(s);
   this.queuePose(s);return;
  }
  if(m.type==='profile'&&now-s.profileAt>=1000){
   const profile=parsePlazaProfile(m.profile,this.social.role(s)==='operator');if(!profile){this.send(ws,{type:'error',code:'profile'});return;}
   s.profile=profile;if(s.partyInvites&&Number.isInteger(m.grade)&&m.grade>=1&&m.grade<=6)s.grade=m.grade;s.profileAt=now;ws.serializeAttachment(s);this.broadcast({type:'upsert',player:this.public(s)},ws);return;
  }
  if(m.type==='emote'&&isPlazaEmote(m.emote)&&now-s.emoteAt>=3000){s.emoteAt=now;ws.serializeAttachment(s);this.broadcast({type:'emote',id:s.id,emote:m.emote});return;}
  if(m.type==='sync'){this.send(ws,{type:'snapshot',players:this.sessions().filter(([other,a])=>other!==ws&&a.joined).map(([,a])=>this.public(a,s.avatarCatalog??1,!!s.titleSelection,s.titleCatalog??1))});}
  ws.serializeAttachment(s);
 }
 webSocketClose(ws,code,reason){const s=ws.deserializeAttachment();if(s)this.pendingPoses.delete(s.id);if(s?.joined)this.broadcast({type:'leave',id:s.id},ws);try{ws.close(code===1005?1000:code,reason);}catch{}}
 async alarm(){await this.social.alarm();}
 webSocketError(ws){this.webSocketClose(ws,1011,'connection');}
}
