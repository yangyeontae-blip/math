import {sha256Hex} from '../src/sha256.ts';
import {presenceIdFromHash} from '../src/forest-room.ts';
import {DurableObject} from 'cloudflare:workers';
import {parsePlazaProfile,PLAZA_ROOM} from '../src/plaza-protocol.ts';
import {PARTY_SIZE,PARTY_REWARD_TTL,validPartyLesson,createPartyRun,publicPartyQuestion,answerPartyQuestion,advancePartyQuestion,partyRewards} from '../src/forest-party.ts';
import {normalizeChat} from '../src/plaza-social.ts';
export class ForestParty extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;this.data=null;ctx.blockConcurrencyWhile(async()=>{this.data=await ctx.storage.get('party')??null;});ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));}
 sockets(){return this.ctx.getWebSockets().filter(ws=>ws.readyState===WebSocket.OPEN).map(ws=>[ws,ws.deserializeAttachment()]).filter(([,a])=>a);}
 send(ws,value){try{ws.send(JSON.stringify(value));}catch{}}
 error(ws,message){this.send(ws,{type:'error',message});}
 member(id){return this.data?.members.find(m=>m.id===id);}
 prune(){const now=Date.now();for(const [ws,a] of this.sockets()){const auto=this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime()??0;if(!a.memberId&&now-a.seen>5000||now-Math.max(a.seen,auto)>40000)try{ws.close(1001,'inactive');}catch{}}const live=new Set(this.sockets().map(([,a])=>a.memberId));if(this.data){this.data.members=this.data.members.filter(m=>live.has(m.id)||now-(m.offlineAt??now)<5*60000);const ids=new Set(this.data.members.map(m=>m.id));this.data.rewards=this.data.rewards.filter(r=>ids.has(r.memberId)&&r.expiresAt>now);if(!ids.has(this.data.leader))this.data.leader=this.data.members[0]?.id??null;}}
 async persist(){this.data.updated=Date.now();await this.ctx.storage.put('party',this.data);await this.ctx.storage.setAlarm(Date.now()+60000);}
 snapshot(id){const d=this.data,online=new Set(this.sockets().map(([,s])=>s.memberId));return {type:'party',code:d.code,leader:d.leader,self:id,members:d.members.map(m=>({id:m.id,presenceId:m.presenceId,profile:m.profile,grade:m.grade,pose:m.pose,here:m.here,role:m.role,online:online.has(m.id)})),run:d.run?{id:d.run.id,config:d.run.config,completed:d.run.completed,done:d.run.done,question:d.run.done?null:publicPartyQuestion(d.run)}:null,rewards:d.rewards.filter(r=>r.memberId===id&&r.expiresAt>Date.now())};}
 broadcast(){for(const [ws,a] of this.sockets())if(a.memberId)this.send(ws,this.snapshot(a.memberId));}
 async fetch(request){this.prune();const u=new URL(request.url),code=u.searchParams.get('code');if(!/^[A-Z0-9]{8}$/.test(code??''))return new Response('잘못된 파티 코드',{status:400});
  if(!this.data){if(u.searchParams.get('create')!=='1')return new Response('없는 파티 코드',{status:404});this.data={code,created:Date.now(),updated:Date.now(),leader:null,members:[],run:null,rewards:[]};await this.persist();}
  if(this.sockets().length>=PARTY_SIZE+2)return new Response('파티가 가득 찼어요',{status:429});
  const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);server.serializeAttachment({seen:Date.now(),window:Date.now(),hits:0,memberId:null});return new Response(null,{status:101,webSocket:client});
 }
 async operator(token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return false;const response=await this.env.PLAZA.get(this.env.PLAZA.idFromName(PLAZA_ROOM)).fetch('https://plaza.internal/operator/session',{headers:{Authorization:'Bearer '+token}});if(!response.ok)return 0;const data=await response.json();return Number.isSafeInteger(data.expiresAt)?data.expiresAt:0;}
 async webSocketMessage(ws,raw){const a=ws.deserializeAttachment();if(!a)return;const now=Date.now();if(typeof raw!=='string'||raw.length>12000){ws.close(1009,'size');return;}if(now-a.window>1000){a.window=now;a.hits=0;}if(++a.hits>24){ws.close(1008,'rate');return;}a.seen=now;ws.serializeAttachment(a);let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
  if(m.type==='join'&&!a.memberId){const operatorUntil=await this.operator(m.operatorToken),role=operatorUntil>now?'operator':'player',profile=parsePlazaProfile(m.profile,role==='operator');if(!profile||!Number.isInteger(m.grade)||m.grade<1||m.grade>6||!m.openStages||['addition','subtraction','multiplication','division'].some(k=>!Number.isInteger(m.openStages[k])||m.openStages[k]<0||m.openStages[k]>10)){this.error(ws,'프로필과 학년을 확인해 주세요.');return;}
   const live=new Set(this.sockets().map(([,x])=>x.memberId));this.data.members=this.data.members.filter(x=>live.has(x.id)||now-(x.offlineAt??now)<5*60000);let member=typeof m.token==='string'?this.data.members.find(x=>x.token===m.token):null;
   if(!member){if(m.token){this.error(ws,'재접속 시간이 지났어요. 파티 코드를 다시 입력해 주세요.');return;}if(this.data.members.length>=PARTY_SIZE){this.error(ws,'파티는 최대 네 명이에요.');return;}member={id:crypto.randomUUID(),token:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),profile,grade:m.grade,openStages:m.openStages,pose:{x:0,y:0,z:26,angle:0},here:false,role,offlineAt:null};this.data.members.push(member);}
   for(const [old,b] of this.sockets())if(old!==ws&&b.memberId===member.id)try{old.close(1000,'reconnected');}catch{}
   Object.assign(member,{profile,grade:m.grade,openStages:m.openStages,role,operatorUntil,offlineAt:null,presenceId:typeof m.chatIdentity==='string'&&/^[a-f0-9-]{36}$/.test(m.chatIdentity)?presenceIdFromHash(sha256Hex('plaza-chat:'+m.chatIdentity)):member.id});a.memberId=member.id;ws.serializeAttachment(a);if(!this.member(this.data.leader))this.data.leader=member.id;
   await this.persist();this.send(ws,{type:'joined',token:member.token});this.broadcast();return;
  }
  const member=this.member(a.memberId);if(!member)return;if(member.role==='operator'&&member.operatorUntil<=now){member.role='player';if(!parsePlazaProfile(member.profile))member.profile.selectedTitleId=null;}
  if(m.type==='profile'){if(now-(a.profileAt??0)<1000)return;a.profileAt=now;ws.serializeAttachment(a);const operatorUntil=await this.operator(m.operatorToken),role=operatorUntil>now?'operator':'player',profile=parsePlazaProfile(m.profile,role==='operator');if(!profile)return;if(Number.isInteger(m.grade)&&m.grade>=1&&m.grade<=6&&m.openStages&&['addition','subtraction','multiplication','division'].every(k=>Number.isInteger(m.openStages[k])&&m.openStages[k]>=0&&m.openStages[k]<=10)){if(this.data.run&&!this.data.run.done&&m.grade!==this.data.run.config.grade){this.error(ws,'학년이 다른 기록을 불러올 때는 파티를 나간 뒤 다시 참가해 주세요.');return;}member.grade=m.grade;member.openStages=m.openStages;}Object.assign(member,{profile,role,operatorUntil});await this.persist();this.broadcast();return;}
  if(m.type==='pose'){const p=m.pose;if(!p||![p.x,p.y,p.z,p.angle].every(Number.isFinite))return;member.pose={x:Math.max(-50,Math.min(50,p.x)),y:Math.max(0,Math.min(10,p.y)),z:Math.max(-50,Math.min(50,p.z)),angle:Math.atan2(Math.sin(p.angle),Math.cos(p.angle))};member.here=m.here===true;for(const [other,b] of this.sockets())if(b.memberId&&other!==ws)this.send(other,{type:'pose',id:member.id,pose:member.pose,here:member.here});return;}
  if(m.type==='sync'){this.send(ws,this.snapshot(member.id));return;}
  if(m.type==='start'){this.prune();
   if(member.id!==this.data.leader){this.error(ws,'파티장이 모험을 시작해요.');return;}if(!validPartyLesson(m.config)||m.config.grade!==member.grade){this.error(ws,'수학숲 설정을 확인해 주세요.');return;}
   if(this.data.members.some(x=>x.grade!==m.config.grade||x.openStages[m.config.forest]<m.config.stage)){this.error(ws,'모든 친구가 같은 학년이며 이 단계를 열어야 함께 시작할 수 있어요.');return;}
   this.data.rewards=this.data.rewards.filter(x=>x.expiresAt>now);if(this.data.rewards.length){this.error(ws,'친구의 직전 보상 저장을 기다려 주세요.');return;}
   if(this.data.run&&!this.data.run.done){this.error(ws,'진행 중인 파티 모험을 먼저 마쳐요.');return;}
   this.data.run=createPartyRun({...m.config,level:member.profile.level});await this.persist();this.broadcast();return;
  }
  if(m.type==='answer'){
   const r=this.data.run;if(!r||!member.here)return;if(now-(a.answerAt??0)<300)return;a.answerAt=now;ws.serializeAttachment(a);
   const result=answerPartyQuestion(r,member.id,m.questionId,m.value);if(!result.accepted)return;
   if(!result.correct){await this.persist();this.send(ws,{type:'answer-result',correct:false,message:'조금만 더 생각해 봐요. 틀려도 손해가 없어요.'});return;}
   if(result.defeated){const active=this.sockets().map(([,x])=>x.memberId).filter(id=>this.member(id)?.here);this.data.rewards.push(...partyRewards(r,[...new Set(active)],now));}
   await this.persist();this.broadcast();return;
  }
  if(m.type==='next'){const r=this.data.run;if(!r||!member.here)return;if(advancePartyQuestion(r,m.questionId)){await this.persist();this.broadcast();}return;}
  if(m.type==='reward-ack'){const before=this.data.rewards.length;this.data.rewards=this.data.rewards.filter(r=>r.memberId!==member.id||r.id!==m.id);if(before!==this.data.rewards.length)await this.persist();return;}
  if(m.type==='chat'){const text=normalizeChat(m.text);if(!text||now-(a.chatAt??0)<3000)return;a.chatAt=now;ws.serializeAttachment(a);for(const [other,b] of this.sockets())if(b.memberId)this.send(other,{type:'chat',playerId:member.id,message:{id:crypto.randomUUID(),senderId:member.id.replaceAll('-','').padEnd(64,'0'),nickname:member.profile.nickname,text,operator:member.role==='operator',sentAt:now}});return;}
  if(m.type==='leave'){this.data.members=this.data.members.filter(x=>x.id!==member.id);this.data.rewards=this.data.rewards.filter(x=>x.memberId!==member.id);if(this.data.leader===member.id)this.data.leader=this.data.members[0]?.id??null;await this.persist();ws.close(1000,'left');this.broadcast();}
 }
 async webSocketClose(ws){const a=ws.deserializeAttachment(),member=this.member(a?.memberId);if(member&&!this.sockets().some(([other,b])=>other!==ws&&b.memberId===member.id)){member.here=false;member.offlineAt=Date.now();if(member.id===this.data.leader){const next=this.data.members.find(x=>x.id!==member.id&&this.sockets().some(([other,b])=>other!==ws&&b.memberId===x.id));if(next)this.data.leader=next.id;}await this.persist();this.broadcast();}}
 async webSocketError(ws){await this.webSocketClose(ws);}
 async alarm(){if(!this.data)return;this.prune();const now=Date.now();this.data.rewards=this.data.rewards.filter(r=>r.expiresAt>now);if(!this.sockets().length&&now-this.data.updated>PARTY_REWARD_TTL){await this.ctx.storage.deleteAll();this.data=null;return;}await this.ctx.storage.put('party',this.data);await this.ctx.storage.setAlarm(now+60000);}
}
