import {uiLabel} from './ui-icons';
import type {PartyInvitation} from './party-lobby';
import type {PlazaPlayer} from './plaza-protocol';
import {journeyFor} from './rules';
import {bindOperatorAccess} from './operator-access';
import {mountPlazaChat} from './plaza-chat-view';
import {PlazaOperator,plazaDeviceIdentity} from './plaza-operator';
import type {Save} from './rules';
import type {World} from './world';
import {PlazaClient,type PlazaConnection,type TradeMessage} from './plaza-client';
import {plazaProfile} from './plaza-identity';
import {PLAZA_ENDPOINT} from './plaza-endpoint';
import {PLAZA_EMOTES,profileTitles,type PlazaEmote} from './plaza-protocol';
import {formatClassCode,makeClassCode,normalizeClassRoomCode,readClassRoom,writeClassRoom} from './class-room';
export function mountPlaza(h:{state:()=>Save|null;world:()=>World|undefined;host:HTMLElement;invite?:(peer:PlazaPlayer)=>void;invitation?:(invite:PartyInvitation)=>void;inviteStatus?:(message:string)=>void;trade?:(message:TradeMessage)=>void;tradeWith?:(peer:PlazaPlayer)=>void}){
 const tools=document.createElement('section');tools.className='plaza-tools';tools.hidden=true;tools.setAttribute('aria-label','친구들과 함께하는 광장');
 const status=document.createElement('button');status.id='plaza-status';status.className='plaza-status';status.innerHTML=uiLabel('🌐 광장 연결 중');status.setAttribute('aria-expanded','false');
 const panel=document.createElement('div');panel.className='plaza-panel';panel.hidden=true;
 const heading=document.createElement('strong');heading.textContent='함께하는 중앙광장';
 const note=document.createElement('p');note.textContent='광장에서는 레벨·별명·칭호·외형이 친구들에게 보여요.';
 const count=document.createElement('p');count.className='plaza-count';
 const emotes=document.createElement('div');emotes.className='plaza-emotes';
 const roster=document.createElement('ul');roster.className='plaza-roster';
 const toggle=document.createElement('button');toggle.className='plaza-toggle';
 const close=document.createElement('button');close.textContent='닫기';close.className='plaza-close';
 const classBox=document.createElement('div');classBox.className='plaza-class';
 panel.append(heading,note,classBox,count,emotes,roster,toggle,close);tools.append(status,panel);h.host.append(tools);
 let enabled=true;try{enabled=localStorage.getItem('berry-plaza-enabled-v1')!=='off';}catch{}
 let classCode=readClassRoom(localStorage),classMessage='',madeCode='';
 let connection:PlazaConnection='offline',memberCount=0,emoteAt=0,lastRoster='',forestScene=false;const buttons:HTMLButtonElement[]=[];
 const endpoint=(import.meta.env.VITE_PLAZA_URL as string|undefined)||PLAZA_ENDPOINT;
 const auth=new PlazaOperator(endpoint),identity=plazaDeviceIdentity();bindOperatorAccess(()=>auth.active);let ownRole:'operator'|'player'='player',roleUntil=0;
 const badge=document.createElement('span');badge.id='operator-title';badge.className='operator-title';badge.textContent='운영자';badge.hidden=true;h.host.querySelector('.career-badges')?.append(badge);
 let chat:ReturnType<typeof mountPlazaChat>|undefined;
 const client=new PlazaClient(endpoint,{
  invitation:invite=>h.invitation?.(invite),inviteStatus:message=>h.inviteStatus?.(message),trade:message=>h.trade?.(message),
  status:(value,total)=>{connection=value;memberCount=total;render();},
  player:p=>h.world()?.upsertPlazaPlayer(p),leave:id=>h.world()?.removePlazaPlayer(id),clear:()=>{if(!h.world()?.partyScene)h.world()?.clearPlazaPlayers();},
  emote:(id,value)=>h.world()?.plazaEmote(id,value),
  social:(ready,role,until,verified)=>{if(verified&&role==='player')auth.invalidate();ownRole=auth.active?'operator':role;roleUntil=auth.active?auth.expiresAt:until;badge.hidden=ownRole!=='operator';chat?.refresh();},
  chat:(messages,replace)=>chat?.messages(messages,replace),
  speech:(playerId,message)=>{if(chat?.allowsSpeech(message))h.world()?.showPlazaSpeech(playerId,message);},
  removed:id=>{chat?.removed(id);h.world()?.clearPlazaSpeech({messageId:id});},chatStatus:until=>chat?.status(until),chatError:reason=>chat?.error(reason),mutes:records=>chat?.mutes(records),
 });
 chat=mountPlazaChat(tools,()=>client,focused=>h.world()?.setTextInputFocus(focused),senderId=>h.world()?.clearPlazaSpeech({senderId}));
 client.setClassRoom(classCode);
 function renderClass(){
  const teacher=!!h.state()?.teacherMode;classBox.replaceChildren();
  const title=document.createElement('b');title.textContent=classCode?'우리 반 광장 · '+formatClassCode(classCode):'우리 반 광장';classBox.append(title);
  const tip=document.createElement('p');tip.textContent=classCode?'같은 반 코드를 넣은 친구들만 광장에서 만나요. 수학숲·상점거리는 모두와 함께예요.':'선생님이 알려 준 반 코드를 넣으면 우리 반 친구들끼리만 광장에서 만나요.';classBox.append(tip);
  if(madeCode){const big=document.createElement('p');big.className='plaza-class-made';big.textContent='새 반 코드: '+formatClassCode(madeCode)+' · 칠판에 적어 주세요';classBox.append(big);}
  if(classCode){const leave=document.createElement('button');leave.className='plaza-class-leave';leave.textContent='모두의 광장으로 나가기';leave.onclick=()=>setClass(null);classBox.append(leave);}
  else{const row=document.createElement('div');row.className='plaza-class-row';const input=document.createElement('input');input.id='plaza-class-code';input.maxLength=8;input.autocomplete='off';input.placeholder='반 코드 7글자';input.setAttribute('aria-label','반 코드');const join=document.createElement('button');join.className='plaza-class-join';join.textContent='들어가기';const go=()=>{const code=normalizeClassRoomCode(input.value);if(!code){classMessage='반 코드가 맞지 않아요. 선생님이 알려 준 7글자를 다시 확인해 주세요.';renderClass();return;}setClass(code);};join.onclick=go;input.onkeydown=e=>{if(e.key==='Enter')go();};input.onfocus=()=>h.world()?.setTextInputFocus(true);input.onblur=()=>h.world()?.setTextInputFocus(false);row.append(input,join);classBox.append(row);}
  if(teacher){const make=document.createElement('button');make.className='plaza-class-make';make.textContent='선생님: 새 반 코드 만들기';make.onclick=()=>{madeCode=makeClassCode();setClass(madeCode);};classBox.append(make);}
  if(classMessage){const m=document.createElement('p');m.className='plaza-class-error';m.setAttribute('role','alert');m.textContent=classMessage;classBox.append(m);}
 }
 function setClass(code:string|null){classCode=code;classMessage='';if(!code)madeCode='';writeClassRoom(localStorage,code);client.setClassRoom(code);lastRoster='';render();renderClass();sync();}
 auth.validate().then(()=>{ownRole=auth.active?'operator':'player';roleUntil=auth.expiresAt;badge.hidden=ownRole!=='operator';sync();});
 function render(){
  const labels={offline:enabled?'🌿 혼자 모험 중':'🌿 혼자 다니기',connecting:'🌐 광장 연결 중',online:'🌐 '+(forestScene?'함께하는 수학숲':classCode?'우리 반 광장':'함께하는 광장')+' · '+memberCount+'명',retrying:'🌐 광장 다시 연결 중',nickname:'🌿 별명을 확인해 주세요',full:'🌐 광장이 가득 찼어요'};
  status.innerHTML=uiLabel(labels[connection]);status.dataset.connection=connection;status.dataset.count=connection==='online'?String(memberCount):'';
  count.textContent=connection==='full'?'같은 광장에 잠시 후 다시 연결할게요. 혼자 모험은 계속할 수 있어요.':connection==='online'?memberCount+'명이 같은 광장에 있어요.':connection==='nickname'?'친구에게 보여 줄 별명을 다른 이름으로 바꾸면 다시 연결돼요.':connection==='retrying'?'광장 연결이 끊겼어요. 인터넷을 확인해 주세요. 자동으로 다시 연결해요.':!endpoint?'광장 서버가 준비 중이에요. 잠시 후 친구들과 만나기를 눌러 주세요.':'광장에 들어오면 친구들이 보여요.';
  toggle.textContent=enabled?'혼자 다니기':'친구들과 만나기';buttons.forEach(b=>b.disabled=connection!=='online');
  if(panel.hidden)return;
  const me=h.state(),others=client.players,signature=JSON.stringify([me?.nickname,me?.level,me?.grade,others.map(p=>[p.id,p.profile,p.party])]);
  if(signature===lastRoster)return;lastRoster=signature;roster.replaceChildren();
  if(me){const li=document.createElement('li');li.textContent='Lv. '+me.level+' '+me.nickname+' · 나';roster.append(li);}
  for(const p of others.sort((a,b)=>Number(b.party?.grade===me?.grade)-Number(a.party?.grade===me?.grade))){const li=document.createElement('li'),name=document.createElement('button'),title=document.createElement('span');name.textContent=`Lv. ${p.profile.level} ${p.profile.nickname}`;name.className='plaza-friend-name';name.disabled=!p.party?.invites||p.party.grade!==me?.grade;name.onclick=()=>{panel.hidden=true;h.invite?.(p);};title.textContent=profileTitles(p.profile).title;li.append(name,title);
   if(p.party){const invite=document.createElement('button');invite.className='plaza-friend-invite';invite.textContent=p.party.grade===me?.grade?'함께 모험 초대':p.party.grade+'학년 · 같은 학년만 가능';invite.disabled=p.party.grade!==me?.grade;invite.onclick=()=>{panel.hidden=true;h.invite?.(p);};li.append(invite);}
   if(!forestScene&&h.tradeWith){const trade=document.createElement('button');trade.className='plaza-friend-invite plaza-trade';trade.textContent='거래하기';trade.onclick=()=>{panel.hidden=true;h.tradeWith?.(p);};li.append(trade);}roster.append(li);}
 }
 status.onclick=()=>{chat?.hide();panel.hidden=!panel.hidden;status.setAttribute('aria-expanded',String(!panel.hidden));lastRoster='';render();renderClass();};
 close.onclick=()=>{panel.hidden=true;status.setAttribute('aria-expanded','false');};
 toggle.onclick=()=>{chat?.hide();enabled=!enabled;try{localStorage.setItem('berry-plaza-enabled-v1',enabled?'on':'off');}catch{}sync();};
 for(const [key,label] of Object.entries(PLAZA_EMOTES)){const button=document.createElement('button');button.innerHTML=uiLabel(label);button.dataset.plazaEmote=key;button.onclick=()=>{if(Date.now()-emoteAt<3000)return;if(client.emote(key as PlazaEmote)){h.world()?.selfPlazaEmote(key as PlazaEmote);emoteAt=Date.now();}};buttons.push(button);emotes.append(button);}
 function sync(){
  const world=h.world(),s=h.state();if(!world||!s){tools.hidden=true;chat?.hide();client.stop();return;}
  const profile=plazaProfile(s);if(roleUntil&&roleUntil<=Date.now()){ownRole='player';badge.hidden=true;}world.setPlazaIdentity(profile,ownRole);client.configure(identity,auth.token);client.setGrade(s.grade);
  const scene=world.isPublicForest?{grade:s.grade,forest:s.forest,stage:journeyFor(s).stage}:null;const market=!scene&&world.isPublicMarket;const here=world.isPublicPlaza||market||!!scene;if(forestScene!==!!scene){forestScene=!!scene;render();}world.forestPresenceOnline=!!scene&&connection==='online';heading.textContent=scene?'함께하는 수학숲':market?'함께하는 상점거리':classCode?'우리 반 광장':'함께하는 중앙광장';classBox.hidden=!!scene||market;note.textContent=scene?'같은 학년·같은 숲·같은 단계의 친구들을 만나요. 진행 공유는 친구와 모험에서 시작해요.':'광장에서는 레벨·별명·칭호·외형이 친구들에게 보여요.';tools.hidden=!here;if(!here){chat?.hide();panel.hidden=true;status.setAttribute('aria-expanded','false');}
  const p=world.player.position;
  client.sync(here&&enabled&&!document.hidden,profile,{x:p.x,y:p.y,z:p.z,angle:world.player.rotation.y},Date.now(),scene,market);
 }
 const timer=setInterval(sync,200);
 const visibility=()=>sync();const stop=()=>client.stop();
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',stop);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close.click();});
 render();
 return {sync,trade:(message:Parameters<PlazaClient['trade']>[0])=>client.trade(message),declineInvite:(invite:PartyInvitation)=>client.declineInvite(invite),invite:(targetId:string,code:string,token:string)=>client.invite(targetId,code,token),players:()=>client.players,authenticate:async(code:string)=>{await auth.authenticate(code);ownRole='operator';roleUntil=auth.expiresAt;badge.hidden=false;client.configure(identity,auth.token);sync();},operatorActive:()=>auth.active,operatorToken:()=>auth.token,logout:async()=>{await auth.logout();client.configure(identity,'');ownRole='player';badge.hidden=true;sync();},stop:()=>{clearInterval(timer);chat?.stop();badge.remove();client.stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);tools.remove();}};
}
