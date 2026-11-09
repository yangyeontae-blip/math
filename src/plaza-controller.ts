import {journeyFor} from './rules';
import {bindOperatorAccess} from './operator-access';
import {mountPlazaChat} from './plaza-chat-view';
import {PlazaOperator,plazaDeviceIdentity} from './plaza-operator';
import type {Save} from './rules';
import type {World} from './world';
import {PlazaClient,type PlazaConnection} from './plaza-client';
import {plazaProfile} from './plaza-identity';
import {PLAZA_ENDPOINT} from './plaza-endpoint';
import {PLAZA_EMOTES,profileTitles,type PlazaEmote} from './plaza-protocol';
export function mountPlaza(h:{state:()=>Save|null;world:()=>World|undefined;host:HTMLElement}){
 const tools=document.createElement('section');tools.className='plaza-tools';tools.hidden=true;tools.setAttribute('aria-label','친구들과 함께하는 광장');
 const status=document.createElement('button');status.id='plaza-status';status.className='plaza-status';status.textContent='🌐 광장 연결 중';status.setAttribute('aria-expanded','false');
 const panel=document.createElement('div');panel.className='plaza-panel';panel.hidden=true;
 const heading=document.createElement('strong');heading.textContent='함께하는 중앙광장';
 const note=document.createElement('p');note.textContent='광장에서는 레벨·별명·칭호·외형이 친구들에게 보여요.';
 const count=document.createElement('p');count.className='plaza-count';
 const emotes=document.createElement('div');emotes.className='plaza-emotes';
 const roster=document.createElement('ul');roster.className='plaza-roster';
 const toggle=document.createElement('button');toggle.className='plaza-toggle';
 const close=document.createElement('button');close.textContent='닫기';close.className='plaza-close';
 panel.append(heading,note,count,emotes,roster,toggle,close);tools.append(status,panel);h.host.append(tools);
 let enabled=true;try{enabled=localStorage.getItem('berry-plaza-enabled-v1')!=='off';}catch{}
 let connection:PlazaConnection='offline',memberCount=0,emoteAt=0,lastRoster='',forestScene=false;const buttons:HTMLButtonElement[]=[];
 const endpoint=(import.meta.env.VITE_PLAZA_URL as string|undefined)||PLAZA_ENDPOINT;
 const auth=new PlazaOperator(endpoint),identity=plazaDeviceIdentity();bindOperatorAccess(()=>auth.active);let ownRole:'operator'|'player'='player',roleUntil=0;
 const badge=document.createElement('span');badge.id='operator-title';badge.className='operator-title';badge.textContent='운영자';badge.hidden=true;h.host.querySelector('.career-badges')?.append(badge);
 let chat:ReturnType<typeof mountPlazaChat>|undefined;
 const client=new PlazaClient(endpoint,{
  status:(value,total)=>{connection=value;memberCount=total;render();},
  player:p=>h.world()?.upsertPlazaPlayer(p),leave:id=>h.world()?.removePlazaPlayer(id),clear:()=>{if(!h.world()?.partyScene)h.world()?.clearPlazaPlayers();},
  emote:(id,value)=>h.world()?.plazaEmote(id,value),
  social:(ready,role,until,verified)=>{if(verified&&role==='player')auth.invalidate();ownRole=auth.active?'operator':role;roleUntil=auth.active?auth.expiresAt:until;badge.hidden=ownRole!=='operator';chat?.refresh();},
  chat:(messages,replace)=>chat?.messages(messages,replace),
  speech:(playerId,message)=>{if(chat?.allowsSpeech(message))h.world()?.showPlazaSpeech(playerId,message);},
  removed:id=>{chat?.removed(id);h.world()?.clearPlazaSpeech({messageId:id});},chatStatus:until=>chat?.status(until),chatError:reason=>chat?.error(reason),mutes:records=>chat?.mutes(records),
 });
 chat=mountPlazaChat(tools,()=>client,focused=>h.world()?.setTextInputFocus(focused),senderId=>h.world()?.clearPlazaSpeech({senderId}));
 auth.validate().then(()=>{ownRole=auth.active?'operator':'player';roleUntil=auth.expiresAt;badge.hidden=ownRole!=='operator';sync();});
 function render(){
  const labels={offline:enabled?'🌿 혼자 모험 중':'🌿 혼자 다니기',connecting:'🌐 광장 연결 중',online:'🌐 '+(forestScene?'함께하는 수학숲':'함께하는 광장')+' · '+memberCount+'명',retrying:'🌐 광장 다시 연결 중',nickname:'🌿 별명을 확인해 주세요',full:'🌐 광장이 가득 찼어요'};
  status.textContent=labels[connection];status.dataset.connection=connection;
  count.textContent=connection==='full'?'같은 광장에 잠시 후 다시 연결할게요. 혼자 모험은 계속할 수 있어요.':connection==='online'?memberCount+'명이 같은 광장에 있어요.':connection==='nickname'?'친구에게 보여 줄 별명을 다른 이름으로 바꾸면 다시 연결돼요.':connection==='retrying'?'연결되면 친구들이 다시 보여요. 모험은 계속할 수 있어요.':!endpoint?'광장 서버를 연결하는 중이에요.':'광장에 들어오면 친구들이 보여요.';
  toggle.textContent=enabled?'혼자 다니기':'친구들과 만나기';buttons.forEach(b=>b.disabled=connection!=='online');
  if(panel.hidden)return;
  const me=h.state(),others=client.players,signature=JSON.stringify([me?.nickname,me?.level,others.map(p=>[p.id,p.profile])]);
  if(signature===lastRoster)return;lastRoster=signature;roster.replaceChildren();
  if(me){const li=document.createElement('li');li.textContent='Lv. '+me.level+' '+me.nickname+' · 나';roster.append(li);}
  for(const p of others){const li=document.createElement('li'),name=document.createElement('strong'),title=document.createElement('span');name.textContent=`Lv. ${p.profile.level} ${p.profile.nickname}`;title.textContent=profileTitles(p.profile).title;li.append(name,title);roster.append(li);}
 }
 status.onclick=()=>{chat?.hide();panel.hidden=!panel.hidden;status.setAttribute('aria-expanded',String(!panel.hidden));lastRoster='';render();};
 close.onclick=()=>{panel.hidden=true;status.setAttribute('aria-expanded','false');};
 toggle.onclick=()=>{chat?.hide();enabled=!enabled;try{localStorage.setItem('berry-plaza-enabled-v1',enabled?'on':'off');}catch{}sync();};
 for(const [key,label] of Object.entries(PLAZA_EMOTES)){const button=document.createElement('button');button.textContent=label;button.dataset.plazaEmote=key;button.onclick=()=>{if(Date.now()-emoteAt<3000)return;if(client.emote(key as PlazaEmote)){h.world()?.selfPlazaEmote(key as PlazaEmote);emoteAt=Date.now();}};buttons.push(button);emotes.append(button);}
 function sync(){
  const world=h.world(),s=h.state();if(!world||!s){tools.hidden=true;chat?.hide();client.stop();return;}
  const profile=plazaProfile(s);if(roleUntil&&roleUntil<=Date.now()){ownRole='player';badge.hidden=true;}world.setPlazaIdentity(profile,ownRole);client.configure(identity,auth.token);
  const scene=world.isPublicForest?{grade:s.grade,forest:s.forest,stage:journeyFor(s).stage}:null;const here=world.isPublicPlaza||!!scene;if(forestScene!==!!scene){forestScene=!!scene;render();}world.forestPresenceOnline=!!scene&&connection==='online';heading.textContent=scene?'함께하는 수학숲':'함께하는 중앙광장';note.textContent=scene?'같은 학년·같은 숲·같은 단계의 친구들을 만나요. 진행 공유는 파티에서 시작해요.':'광장에서는 레벨·별명·칭호·외형이 친구들에게 보여요.';tools.hidden=!here;if(!here){chat?.hide();panel.hidden=true;status.setAttribute('aria-expanded','false');}
  const p=world.player.position;
  client.sync(here&&enabled&&!document.hidden,profile,{x:p.x,y:p.y,z:p.z,angle:world.player.rotation.y},Date.now(),scene);
 }
 const timer=setInterval(sync,200);
 const visibility=()=>sync();const stop=()=>client.stop();
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',stop);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close.click();});
 render();
 return {sync,players:()=>client.players,authenticate:async(code:string)=>{await auth.authenticate(code);ownRole='operator';roleUntil=auth.expiresAt;badge.hidden=false;client.configure(identity,auth.token);sync();},operatorActive:()=>auth.active,operatorToken:()=>auth.token,logout:async()=>{await auth.logout();client.configure(identity,'');ownRole='player';badge.hidden=true;sync();},stop:()=>{clearInterval(timer);chat?.stop();badge.remove();client.stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);tools.remove();}};
}
