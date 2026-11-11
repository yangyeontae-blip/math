import {normalizedPartyCode,type PartyDestination} from './party-lobby';
import {parsePlazaProfile,type PlazaProfile,type PlazaPose} from './plaza-protocol';
import {validPartyLesson,type PartyLesson,type PartyQuestion,type PartyReward} from './forest-party';
import {parseChatMessage,type PlazaChatMessage} from './plaza-social';
export type PartyMember={id:string;presenceId?:string;profile:PlazaProfile;grade:number;pose:PlazaPose;here:boolean;online:boolean;role:'operator'|'player'};
export type PartyState={lobby?:{destination:PartyDestination|null;revision:number;choices:PartyDestination[];ready:string[]};code:string;leader:string|null;self:string;members:PartyMember[];run:{id:string;config:PartyLesson;completed:number[];done:boolean;question:PartyQuestion|null}|null;rewards:PartyReward[]};
type Hooks={profile:()=>{profile:PlazaProfile;grade:number;openStages:Record<string,number>;operatorToken:string;chatIdentity:string;preferredForest?:string}|null;state:(s:PartyState)=>void;pose:(id:string,pose:PlazaPose,here:boolean)=>void;message:(text:string)=>void;chat:(id:string,m:PlazaChatMessage)=>void;status:(connected:boolean)=>void};
const KEY='berry-forest-party-session-v1';
export class ForestPartyClient{
 private invitation='';private lastPose='';private attempt=0;
 private socket:WebSocket|null=null;private session:{code:string;token:string}|null=null;private retryAt=0;private openAt=0;private lastPing=0;private lastPong=0;private lastProfile='';private profileAt=0;private create=false;private stopped=false;public connected=false;
 constructor(private endpoint:string,private hooks:Hooks){try{const v=JSON.parse(localStorage.getItem(KEY)??'null');if(v&&/^[A-Z0-9]{8}$/.test(v.code)&&/^[a-f0-9]{64}$/.test(v.token))this.session=v;}catch{}}
 get credentials(){return this.connected&&this.session?{code:this.session.code,token:this.session.token}:null;}
 get code(){return this.session?.code??'';}
 join(code:string,create=false,invitation=''){this.close();this.invitation=invitation;this.lastPose='';this.attempt=0;this.session={code:normalizedPartyCode(code),token:''};this.create=create;this.stopped=false;this.retryAt=0;this.tick();}
 leave(){this.send({type:'leave'});this.close();this.session=null;try{localStorage.removeItem(KEY);}catch{}this.hooks.status(false);}
 send(message:unknown){if(this.socket?.readyState===1)try{this.socket.send(JSON.stringify(message));return true;}catch{}return false;}
 tick(pose?:PlazaPose,here=false){const now=Date.now();if(this.stopped||!this.session||!this.hooks.profile()||document.hidden)return;if(!this.socket&&now>=this.retryAt){this.connect();return;}if(this.socket?.readyState===0&&now-this.openAt>15000){this.close();this.retryAt=now+5000;return;}if(this.socket?.readyState===1){if(now-this.lastPong>35000){this.close();this.retryAt=now+3000;return;}if(now-this.lastPing>10000){this.socket.send('ping');this.lastPing=now;}const profile=this.hooks.profile();if(this.connected&&profile){const signature=JSON.stringify(profile);if(signature!==this.lastProfile&&now-this.profileAt>=1200){this.profileAt=now;this.lastProfile=signature;this.send({type:'profile',...profile});}}if(this.connected&&pose){const signature=JSON.stringify([here,here?pose:null]);if(signature!==this.lastPose&&this.send({type:'pose',pose,here}))this.lastPose=signature;}}}
 private close(){const ws=this.socket;this.socket=null;this.connected=false;this.lastPose='';if(ws){ws.onopen=ws.onclose=ws.onerror=ws.onmessage=null;try{ws.close(1000,'disconnected');}catch{}}}
 private connect(){const session=this.session!,profile=this.hooks.profile();if(!profile)return;const url=new URL(this.endpoint);url.pathname='/party/connect';url.search='?code='+session.code+(this.create?'&create=1':'');this.openAt=Date.now();let ws:WebSocket;try{ws=new WebSocket(url.href);}catch{this.retryAt=Date.now()+5000;return;}this.socket=ws;
  ws.onopen=()=>{if(this.socket!==ws)return;this.lastPing=this.lastPong=Date.now();this.profileAt=Date.now();this.lastProfile=JSON.stringify(profile);this.send({type:'join',...profile,lobbyV1:true,...(this.invitation?{invitation:this.invitation}:{}),...(session.token?{token:session.token}:{})});};
  ws.onmessage=e=>{if(this.socket!==ws)return;if(e.data==='pong'){this.lastPong=Date.now();return;}if(typeof e.data!=='string'||e.data.length>200000)return;let m:any;try{m=JSON.parse(e.data);}catch{return;}
   if(m.type==='joined'&&/^[a-f0-9]{64}$/.test(m.token)){session.token=m.token;this.invitation='';this.attempt=0;this.create=false;this.connected=true;try{localStorage.setItem(KEY,JSON.stringify(session));}catch{}this.hooks.status(true);return;}
   if(m.type==='error'&&!this.connected){this.close();this.stopped=true;this.hooks.status(false);}
   if(m.type==='error'||m.type==='answer-result'){this.hooks.message(String(m.message??'연결을 확인해 주세요.'));return;}
   if(m.type==='pose'&&typeof m.id==='string'&&m.pose&&[m.pose.x,m.pose.y,m.pose.z,m.pose.angle].every(Number.isFinite)){this.hooks.pose(m.id,m.pose,m.here===true);return;}
   if(m.type==='chat'){const message=parseChatMessage(m.message);if(message&&typeof m.playerId==='string')this.hooks.chat(m.playerId,message);return;}
   if(m.type==='party'&&m.code===session.code&&typeof m.self==='string'&&Array.isArray(m.members)&&m.members.length<=4&&Array.isArray(m.rewards)&&m.rewards.length<1000&&(!m.run||validPartyLesson(m.run.config))){const members=m.members.filter((p:any)=>p&&/^[a-f0-9-]{36}$/.test(p.id)&&parsePlazaProfile(p.profile,p.role==='operator')&&p.pose&&[p.pose.x,p.pose.y,p.pose.z,p.pose.angle].every(Number.isFinite));if(members.length!==m.members.length)return;this.hooks.state({...m,members});}
  };
  const failed=()=>{if(this.socket!==ws)return;this.close();this.hooks.status(false);this.retryAt=Date.now()+Math.min(30000,2000*2**Math.min(this.attempt++,4));};ws.onerror=failed;ws.onclose=failed;
 }
 stop(){this.stopped=true;this.close();}
}
