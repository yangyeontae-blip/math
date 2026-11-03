import {DurableObject} from 'cloudflare:workers';
import {PLAZA_VERSION,PLAZA_ROOM,PLAZA_CAPACITY,parsePlazaProfile,parsePlazaPose,isPlazaEmote} from '../src/plaza-protocol.ts';
const ORIGINS=new Set(['https://yangyeontae-blip.github.io','https://berry-forest-school.yangyeontae.chatgpt.site','capacitor://localhost','ionic://localhost','https://localhost','http://localhost']);
export function allowedPlazaOrigin(origin){return ORIGINS.has(origin)||/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin??'');}
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,version:PLAZA_VERSION,room:PLAZA_ROOM,capacity:PLAZA_CAPACITY});
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
  super(ctx,env);this.ctx=ctx;
  ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
 }
 sessions(){return this.ctx.getWebSockets().map(ws=>[ws,ws.deserializeAttachment()]).filter(([ws,s])=>s&&ws.readyState===WebSocket.OPEN);}
 public(s){return {id:s.id,profile:s.profile,pose:s.pose};}
 send(ws,value){try{ws.send(JSON.stringify(value));return true;}catch{return false;}}
 broadcast(value,except){for(const [ws,s] of this.sessions())if(s.joined&&ws!==except)this.send(ws,value);}
 prune(now=Date.now()){
  for(const [ws,s] of this.sessions()){
   const auto=this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime()??0;
   if(!s.joined&&now-s.seen>5000||now-Math.max(s.seen,auto)>40000){if(s.joined)this.broadcast({type:'leave',id:s.id},ws);try{ws.close(1001,'inactive');}catch{}}
  }
 }
 async fetch(){
  this.prune();if(this.sessions().length>=PLAZA_CAPACITY){const [client,server]=Object.values(new WebSocketPair());server.accept();server.send(JSON.stringify({type:'error',code:'full'}));server.close(1013,'full');return new Response(null,{status:101,webSocket:client});}
  const [client,server]=Object.values(new WebSocketPair()),now=Date.now();
  this.ctx.acceptWebSocket(server);
  server.serializeAttachment({id:crypto.randomUUID(),joined:false,seen:now,pose:{x:0,y:0,z:8,angle:0},seq:-1,moveAt:now,window:now,hits:0,emoteAt:0,profileAt:0});
  this.send(server,{type:'hello',version:PLAZA_VERSION});
  return new Response(null,{status:101,webSocket:client});
 }
 webSocketMessage(ws,raw){
  const s=ws.deserializeAttachment();if(!s)return;
  const now=Date.now();this.prune(now);
  if(typeof raw!=='string'||raw.length>4096){ws.close(1009,'message_size');return;}
  if(now-s.window>=1000){s.window=now;s.hits=0;}s.hits++;
  if(s.hits>16){ws.close(1008,'rate_limit');return;}s.seen=now;
  let m;try{m=JSON.parse(raw);}catch{ws.close(1008,'invalid_message');return;}
  if(!m||typeof m!=='object'){ws.close(1008,'invalid_message');return;}
  if(m.type==='join'&&!s.joined){
   const profile=parsePlazaProfile(m.profile),pose=parsePlazaPose(m.pose);
   if(!profile||!pose){this.send(ws,{type:'error',code:'profile'});ws.close(1008,'profile');return;}
   s.joined=true;s.profile=profile;s.pose=pose;s.moveAt=now;s.profileAt=now;
   ws.serializeAttachment(s);
   this.send(ws,{type:'welcome',id:s.id,room:PLAZA_ROOM,players:this.sessions().filter(([other,a])=>other!==ws&&a.joined).map(([,a])=>this.public(a))});
   this.broadcast({type:'upsert',player:this.public(s)},ws);return;
  }
  if(!s.joined){ws.close(1008,'join_required');return;}
  if(m.type==='pose'){
   const pose=parsePlazaPose(m.pose);
   if(!pose||!Number.isSafeInteger(m.seq)||m.seq<0||m.seq>1e9){ws.close(1008,'pose');return;}
   if(m.seq<=s.seq)return;
   const travel=Math.hypot(pose.x-s.pose.x,pose.z-s.pose.z),seconds=Math.min(2,Math.max(0,(now-s.moveAt)/1000));
   // The fastest existing mount with Wind Step remains within this generous limit.
   if(travel>seconds*72+2){this.send(ws,{type:'correction',pose:s.pose});return;}
   s.pose=pose;s.seq=m.seq;s.moveAt=now;ws.serializeAttachment(s);
   this.broadcast({type:'pose',id:s.id,pose},ws);return;
  }
  if(m.type==='profile'&&now-s.profileAt>=1000){
   const profile=parsePlazaProfile(m.profile);if(!profile){this.send(ws,{type:'error',code:'profile'});return;}
   s.profile=profile;s.profileAt=now;ws.serializeAttachment(s);this.broadcast({type:'upsert',player:this.public(s)},ws);return;
  }
  if(m.type==='emote'&&isPlazaEmote(m.emote)&&now-s.emoteAt>=3000){s.emoteAt=now;ws.serializeAttachment(s);this.broadcast({type:'emote',id:s.id,emote:m.emote});return;}
  if(m.type==='sync'){this.send(ws,{type:'snapshot',players:this.sessions().filter(([other,a])=>other!==ws&&a.joined).map(([,a])=>this.public(a))});}
  ws.serializeAttachment(s);
 }
 webSocketClose(ws,code,reason){const s=ws.deserializeAttachment();if(s?.joined)this.broadcast({type:'leave',id:s.id},ws);try{ws.close(code===1005?1000:code,reason);}catch{}}
 webSocketError(ws){this.webSocketClose(ws,1011,'connection');}
}
