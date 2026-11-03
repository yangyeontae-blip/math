import {PLAZA_VERSION,PLAZA_ROOM,PLAZA_CAPACITY,parsePlazaPlayer,parsePlazaPose,isPlazaEmote,type PlazaProfile,type PlazaPose,type PlazaPlayer,type PlazaEmote} from './plaza-protocol';
export type PlazaConnection='offline'|'connecting'|'online'|'retrying'|'nickname'|'full';
type Hooks={status:(status:PlazaConnection,count:number)=>void;player:(player:PlazaPlayer)=>void;leave:(id:string)=>void;clear:()=>void;emote:(id:string,emote:PlazaEmote)=>void};
export class PlazaClient {
 private socket:WebSocket|null=null;private active=false;private profile:PlazaProfile|null=null;private pose:PlazaPose={x:0,y:0,z:8,angle:0};
 private peers=new Map<string,PlazaPlayer>();private selfId='';private seq=0;private retryAt=0;private attempt=0;private lastSent='';private lastProfile='';private profileAt=0;private lastPing=0;private lastPong=0;private openedAt=0;
 constructor(private endpoint:string,private hooks:Hooks,private createSocket:(url:string)=>WebSocket=url=>new WebSocket(url)){}
 get players(){return [...this.peers.values()];}
 get connected(){return !!this.selfId&&this.socket?.readyState===1;}
 sync(active:boolean,profile:PlazaProfile|null,pose:PlazaPose,now=Date.now()){
  this.profile=profile;this.pose=pose;
  if(!active||!profile||!this.endpoint){this.active=false;this.disconnect();this.hooks.status(!profile&&active?'nickname':'offline',0);return;}
  this.active=true;
  if(!this.socket){if(now>=this.retryAt)this.connect(now);return;}
  if(this.socket.readyState!==1){if(now-this.openedAt>12000)this.fail(this.socket);return;}
  if(!this.selfId){if(now-this.openedAt>12000)this.fail(this.socket);return;}
  const signature=JSON.stringify(profile);
  if(signature!==this.lastProfile&&now-this.profileAt>=1200){this.send({type:'profile',profile});this.lastProfile=signature;this.profileAt=now;}
  const position=JSON.stringify(pose);
  if(position!==this.lastSent){this.send({type:'pose',seq:++this.seq,pose});this.lastSent=position;}
  if(now-this.lastPing>=10000){this.socket.send('ping');this.lastPing=now;}
  if(now-this.lastPong>30000)this.fail(this.socket);
 }
 private send(value:unknown){try{this.socket?.send(JSON.stringify(value));}catch{if(this.socket)this.fail(this.socket);}}
 private connect(now:number){
  let url:URL;try{url=new URL(this.endpoint);if(!['wss:','ws:'].includes(url.protocol))throw Error();url.pathname='/connect';url.search='?v='+PLAZA_VERSION;}catch{this.hooks.status('offline',0);this.retryAt=now+60000;return;}
  this.openedAt=now;this.hooks.status(this.attempt?'retrying':'connecting',0);
  let socket:WebSocket;try{socket=this.createSocket(url.href);}catch{this.retryAt=now+5000;return;}this.socket=socket;
  socket.onopen=()=>{if(this.socket!==socket)return;this.lastPong=Date.now();this.lastPing=Date.now();this.profileAt=Date.now();this.lastProfile=JSON.stringify(this.profile);this.lastSent=JSON.stringify(this.pose);this.send({type:'join',profile:this.profile,pose:this.pose});};
  socket.onmessage=e=>{if(this.socket===socket)this.receive(e.data);};
  socket.onclose=()=>{if(this.socket===socket)this.fail(socket);};
  socket.onerror=()=>{if(this.socket===socket)this.fail(socket);};
 }
 private receive(raw:unknown){
  if(raw==='pong'){this.lastPong=Date.now();return;}
  if(typeof raw!=='string'||raw.length>200000)return;let m:any;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
  if(m.type==='welcome'&&m.room===PLAZA_ROOM&&typeof m.id==='string'&&/^[a-f0-9-]{36}$/.test(m.id)&&Array.isArray(m.players)&&m.players.length<=PLAZA_CAPACITY){
   this.selfId=m.id;this.attempt=0;this.seq=0;this.lastPong=Date.now();this.peers.clear();this.hooks.clear();
   for(const item of m.players){const p=parsePlazaPlayer(item);if(p&&p.id!==this.selfId){this.peers.set(p.id,p);this.hooks.player(p);}}this.report();return;
  }
  if(m.type==='correction'){this.lastSent='';return;}
  if(m.type==='error'&&(m.code==='full'||m.code==='profile')){this.retryAt=Date.now()+(m.code==='full'?15000:60000);this.disconnect();this.hooks.status(m.code==='full'?'full':'nickname',0);return;}
  if(!this.selfId)return;
  if(m.type==='upsert'){const p=parsePlazaPlayer(m.player);if(p&&p.id!==this.selfId&&this.peers.size<PLAZA_CAPACITY){this.peers.set(p.id,p);this.hooks.player(p);this.report();}}
  if(m.type==='pose'&&typeof m.id==='string'){const old=this.peers.get(m.id),pose=parsePlazaPose(m.pose);if(old&&pose){old.pose=pose;this.hooks.player(old);}}
  if(m.type==='leave'&&typeof m.id==='string'){if(this.peers.delete(m.id)){this.hooks.leave(m.id);this.report();}}
  if(m.type==='emote'&&typeof m.id==='string'&&isPlazaEmote(m.emote))this.hooks.emote(m.id,m.emote);
  if(m.type==='error'&&m.code==='profile'){this.hooks.status('nickname',0);this.retryAt=Date.now()+60000;this.disconnect();}
 }
 private report(){this.hooks.status('online',this.peers.size+1);}
 private fail(socket:WebSocket){if(this.socket!==socket)return;this.disconnect();if(this.active){this.retryAt=Date.now()+Math.min(15000,1000*2**Math.min(this.attempt++,4));this.hooks.status('retrying',0);}}
 private disconnect(){const s=this.socket;this.socket=null;this.selfId='';this.lastSent='';this.lastProfile='';this.peers.clear();this.hooks.clear();if(s){s.onopen=s.onmessage=s.onerror=s.onclose=null;try{s.close(1000,'left_plaza');}catch{}}}
 emote(emote:PlazaEmote){if(!this.connected)return false;this.send({type:'emote',emote});return true;}
 stop(){this.active=false;this.disconnect();this.hooks.status('offline',0);}
}
