import {plazaDeviceIdentity} from './plaza-operator';
import type {PlazaPlayer} from './plaza-protocol';
import {ForestPartyClient,type PartyState} from './forest-party-client';
import {claimPartyReward} from './forest-party-rewards';
import {plazaProfile} from './plaza-identity';
import {canEnter,journeyFor,OPERATION_INFO,type Save} from './rules';
import type {PartyLesson} from './forest-party';
import {normalizedPartyCode,type PartyInvitation} from './party-lobby';
import type {World} from './world';
import {PLAZA_ENDPOINT} from './plaza-endpoint';
import './forest-party.css';

type Hooks={
 state:()=>Save|null;world:()=>World|undefined;host:HTMLElement;
 open:(html:string,cls?:string)=>void;close:()=>void;persist:()=>void;
 stored:()=>boolean;refresh:()=>void;toast:(message:string)=>void;
 enter:(config:PartyLesson)=>void;operatorToken:()=>string;
 publicPeers:()=>PlazaPlayer[];
 invite:(peerId:string,code:string,token:string)=>boolean;declineInvite:(invite:PartyInvitation)=>void;
};
const esc=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const destinationName=(c:{forest:keyof typeof OPERATION_INFO;stage:number})=>OPERATION_INFO[c.forest].name+'숲 '+c.stage+'단계';

export function mountForestParty(h:Hooks){
 let state:PartyState|null=null,connected=false,opened=false,notice='',saveNotice='',entered='',renderKey='',renderedQuestion='';
 let view:'lobby'|'question'='lobby',pendingPeer:PlazaPlayer|null=null,invitation:PartyInvitation|null=null;
 let chatLines:string[]=[];
 const defeated=new Set<string>();
 const button=document.createElement('button');
 button.id='party-open';button.textContent='🤝 친구와 모험';button.setAttribute('aria-label','친구와 모험');
 h.host.querySelector('.display-controls')!.append(button);
 const questionButton=document.createElement('button');
 questionButton.id='party-question-open';questionButton.className='party-question-open';questionButton.hidden=true;
 h.host.append(questionButton);
 const inviteBanner=document.createElement('section');
 inviteBanner.className='party-invite-banner';inviteBanner.hidden=true;inviteBanner.setAttribute('aria-label','친구의 모험 초대');
 h.host.append(inviteBanner);
 const endpoint=(import.meta.env.VITE_PLAZA_URL as string|undefined)||PLAZA_ENDPOINT;

 function profile(){
  const s=h.state(),p=s&&(plazaProfile(s)??plazaProfile({...s,selectedTitleId:null}));
  if(!s||!p)return null;
  return {profile:p,grade:s.grade,preferredForest:s.forest,operatorToken:h.operatorToken(),chatIdentity:plazaDeviceIdentity(),
   openStages:Object.fromEntries(['addition','subtraction','multiplication','division'].map(f=>[f,Array.from({length:10},(_,i)=>i+1).filter(n=>canEnter(s,n,f as Save['forest'])).at(-1)??0]))};
 }
 function here(){
  const s=h.state(),w=h.world(),c=state?.run?.config;
  return !!s&&!!w&&!!c&&!document.hidden&&w.active&&!w.inHunting&&!w.inAcademy&&!w.inAstralStudy&&!w.inRoom&&!w.inHomestead&&s.forest===c.forest&&s.grade===c.grade&&journeyFor(s).stage===c.stage;
 }
 const client=new ForestPartyClient(endpoint,{
  profile,
  status:value=>{
   connected=value;
   if(!value&&h.world()?.partyScene)h.world()?.clearPlazaPlayers();
   notice=!value&&client.code?'연결을 다시 확인하고 있어요. 연결되면 친구들과 이어서 모험해요.':'';
   render();
  },
  state:next=>{
   state=next;notice='';
   const s=h.state();if(!s)return;
   if(next.run&&next.run.id!==entered){
    entered=next.run.id;defeated.clear();
    if(canEnter(s,next.run.config.stage,next.run.config.forest)&&s.grade===next.run.config.grade){
     opened=false;h.enter(next.run.config);
     if(h.world()?.forestPresenceOnline)for(const peer of h.publicPeers())h.world()?.upsertPlazaPlayer(peer);
    }
   }
   saveNotice='';
   for(const reward of next.rewards){
    const result=claimPartyReward(s,reward);
    if(!result.accepted){saveNotice='이 학년과 단계에서 다시 연결하면 보상을 확인할 수 있어요.';continue;}
    h.persist();
    if(h.stored()){
     client.send({type:'reward-ack',id:reward.id});
     if(!result.duplicate)h.toast('친구 모험 완료! 베리 +'+result.berries+' · 경험치 +'+result.xp);
    }else saveNotice='보상을 아직 저장하지 못했어요. 다시 저장을 눌러 주세요.';
   }
   h.refresh();syncPeers();
   if(here())for(const id of next.run?.completed??[]){
    const key=next.run!.id+':'+id;
    if(!defeated.has(key)){defeated.add(key);h.world()?.defeat('monster'+id);}
   }
   if(pendingPeer&&client.credentials){const peer=pendingPeer;pendingPeer=null;sendInvite(peer);}
   render();
  },
  pose:(id,pose,inRun)=>{const peer=state?.members.find(m=>m.id===id);if(peer){peer.pose=pose;peer.here=inRun;syncPeers();}},
  message:text=>{notice=text;render();},
  chat:(id,message)=>{
   chatLines=[...chatLines,message.nickname+': '+message.text].slice(-20);
   if(here())h.world()?.showPlazaSpeech(id===state?.self?null:h.world()?.forestPresenceOnline?state?.members.find(m=>m.id===id)?.presenceId??id:id,message);
   const log=document.querySelector('.party-chat-log');
   if(log){log.innerHTML=chatLines.map(x=>'<li>'+esc(x)+'</li>').join('');log.scrollTop=log.scrollHeight;}
  },
 });

 function syncPeers(){
  const w=h.world();if(!w)return;
  const active=here()&&connected&&!w.forestPresenceOnline;
  if(w.partyScene!==active){w.clearPlazaPlayers();w.partyScene=active;if(w.forestPresenceOnline)for(const peer of h.publicPeers())w.upsertPlazaPlayer(peer);}
  if(!active)return;
  const visible=new Set<string>();
  for(const m of state?.members??[])if(m.id!==state?.self&&m.online&&m.here){visible.add(m.id);w.upsertPlazaPlayer({id:m.id,profile:m.profile,pose:m.pose,role:m.role});}
  for(const m of state?.members??[])if(m.id!==state?.self&&!visible.has(m.id))w.removePlazaPlayer(m.id);
 }
 function show(next:'lobby'|'question'='lobby'){view=next;opened=true;renderKey='';render();}
 function close(){opened=false;h.close();}
 function create(){
  notice='친구 모험을 만들고 있어요.';
  client.join(crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),true);
  render();
 }
 function sendInvite(peer:PlazaPlayer){
  const credentials=client.credentials;
  if(!credentials){notice='연결을 확인한 뒤 다시 초대해 주세요.';render();return;}
  if(!h.invite(peer.id,credentials.code,credentials.token)){notice='광장이나 같은 수학숲에서 친구들과 만나기를 켜 주세요.';render();}
 }
 function invitePeer(peer:PlazaPlayer){
  if(peer.party?.grade!==h.state()?.grade){h.toast('같은 학년 친구와 함께 모험할 수 있어요.');return;}
  show();
  if(state?.run&&!state.run.done){notice='지금 모험을 마친 뒤 친구를 초대해 주세요.';render();return;}
  if(client.credentials)sendInvite(peer);
  else {pendingPeer=peer;create();}
 }
 function renderInvitation(){
  if(invitation&&invitation.expiresAt<=Date.now())invitation=null;
  inviteBanner.hidden=!invitation;
  if(!invitation)return;
  const modal=document.querySelector<HTMLDialogElement>('#modal');
  const inModal=modal?.open===true;
  const container=inModal?modal!:h.host;
  if(inviteBanner.parentElement!==container)container.append(inviteBanner);
  inviteBanner.dataset.compact=String(inModal);
  const current=invitation;
  if(inviteBanner.dataset.id===current.id)return;
  inviteBanner.dataset.id=current.id;
  inviteBanner.dataset.expanded='false';
  inviteBanner.innerHTML='<button class="secondary party-invite-peek" data-invite-show>친구 모험 초대</button><div class="party-invite-body"><p><b>'+esc(current.nickname)+'</b>님과 수학숲을 모험할까요?</p><div><button class="primary" data-invite-accept>함께하기</button><button class="secondary" data-invite-decline>다음에</button></div></div>';
  inviteBanner.querySelector<HTMLButtonElement>('[data-invite-show]')!.onclick=()=>{inviteBanner.dataset.expanded='true';};
  inviteBanner.querySelector<HTMLButtonElement>('[data-invite-accept]')!.onclick=()=>{
   if(current.expiresAt<=Date.now()){invitation=null;renderInvitation();h.toast('초대 시간이 지났어요. 다시 초대받아 주세요.');return;}
   if(state||client.credentials){h.toast('현재 친구 모험에서 나간 뒤 초대를 받아 주세요.');return;}
   invitation=null;renderInvitation();show();
   notice='친구의 모험에 참가하고 있어요.';client.join(current.code,false,current.id);render();
  };
  inviteBanner.querySelector<HTMLButtonElement>('[data-invite-decline]')!.onclick=()=>{h.declineInvite(current);invitation=null;renderInvitation();};
 }
 function friendsHtml(){
  const grade=h.state()?.grade,memberIds=new Set(state?.members.map(m=>m.presenceId));
  const peers=h.publicPeers().filter(p=>!memberIds.has(p.id)).sort((a,b)=>Number(b.party?.grade===grade)-Number(a.party?.grade===grade));
  if(!peers.length)return '<p class="note">광장이나 같은 수학숲에서 만난 친구가 여기에 보여요. 다른 곳의 친구는 코드로 찾을 수 있어요.</p>';
  return '<ul class="party-nearby">'+peers.map(p=>{
   const eligible=p.party?.invites&&p.party.grade===grade;
   const reason=!p.party?'게임을 새로 열면 초대할 수 있어요':p.party.grade!==grade?'같은 학년 친구와 함께할 수 있어요':'함께 모험 초대';
   return '<li><span><button class="party-friend-name" data-invite-peer="'+p.id+'" '+(!eligible?'disabled':'')+'>'+esc(p.profile.nickname)+'</button><small>Lv. '+p.profile.level+(p.party?' · '+p.party.grade+'학년':'')+'</small></span><button class="secondary" data-invite-peer="'+p.id+'" '+(!eligible?'disabled':'')+'>'+reason+'</button></li>';
  }).join('')+'</ul>';
 }
 function codeHtml(){
  const code=state?.code??'';
  return '<details class="party-code-details"><summary>코드로 친구 찾기</summary>'+
   (code?'<strong class="party-code" aria-label="친구 초대 코드">'+code.slice(0,4)+' '+code.slice(4)+'</strong><button class="secondary wide" id="party-copy-code">초대 코드 복사</button>':
   '<form class="party-join" id="party-join-form"><input id="party-code-input" aria-label="친구 초대 코드" autocomplete="off" maxlength="16" placeholder="예: ABCD EFGH"><button class="secondary" type="button" id="party-paste-code">코드 붙여넣기</button><button class="secondary" type="submit">친구 찾기</button></form>')+'</details>';
 }
 function chatHtml(){
  return '<details class="party-chat-details"><summary>친구들과 이야기</summary><ul class="party-chat-log" aria-live="polite">'+chatLines.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><form class="party-chat-form" id="party-chat-form"><input id="party-chat-input" aria-label="친구들과 대화" maxlength="100" autocomplete="off" placeholder="친구들에게 말하기"><button class="secondary" type="submit">보내기</button></form></details>';
 }
 function lobbyHtml(){
  if(!state)return '<p class="party-intro">친구를 초대하고 같은 수학숲으로 함께 떠나요.</p>'+friendsHtml()+'<button class="primary wide" id="party-create">친구 모험 만들기</button>'+codeHtml()+(client.code?'<button class="text-button wide" id="party-leave">연결 취소</button>':'');
  const lobby=state.lobby,leader=state.self===state.leader,online=state.members.filter(m=>m.online);
  const ready=new Set(lobby?.ready??[]),waiting=online.filter(m=>!ready.has(m.id));
  const destination=lobby?.destination;
  const reason=!connected?'친구 모험 서버에 다시 연결하고 있어요.':online.length<2?'친구가 한 명 더 오면 함께 출발할 수 있어요.':!destination?'함께 입장할 수 있는 숲을 확인해 주세요.':waiting.length?'친구 '+waiting.length+'명이 준비 중이에요.':'모두 준비됐어요!';
  const memberCards=Array.from({length:4},(_,i)=>{const m=state!.members[i];return m?'<li class="'+(ready.has(m.id)?'is-ready':'')+'"><span aria-hidden="true">'+(m.id===state!.leader?'👑':'🌱')+'</span><b>'+esc(m.profile.nickname)+'</b><small>'+(!m.online?'잠시 자리 비움':ready.has(m.id)?'준비 완료':'준비 중')+'</small></li>':'<li class="is-empty"><span aria-hidden="true">＋</span><b>친구 자리</b><small>최대 네 명이 함께해요</small></li>';}).join('');
  const options=lobby?.choices??[];
  let html='<p class="party-steps">친구 초대 → 함께 갈 숲 → 함께 출발</p><ul class="party-members">'+memberCards+'</ul>';
  if(state.run&&!state.run.done)return html+'<p class="party-destination">'+destinationName(state.run.config)+'에서 모험 중이에요.</p><button class="primary wide" id="party-return">친구들이 있는 숲으로 돌아가기</button>'+chatHtml()+'<button class="text-button wide" id="party-leave">모험 나가기</button>';
  html+='<section class="party-destination"><small>함께 갈 수학숲</small><strong>'+ (destination?destinationName(destination):'친구들과 갈 숲을 찾고 있어요')+'</strong>';
  if(leader&&options.length)html+='<details><summary>다른 숲 고르기</summary><label>모두 입장할 수 있는 숲<select id="party-destination">'+options.map(c=>'<option value="'+c.forest+':'+c.stage+'" '+(c.forest===destination?.forest&&c.stage===destination.stage?'selected':'')+'>'+destinationName(c)+'</option>').join('')+'</select></label></details>';
  html+='</section><p class="party-readiness" role="status">'+reason+'</p>';
  if(!leader&&!ready.has(state.self))html+='<button class="primary wide" id="party-ready">이 숲으로 갈게요 · 준비 완료</button>';
  if(leader)html+='<button class="primary wide" id="party-start" '+(!connected||online.length<2||!destination||waiting.length?'disabled':'')+'>함께 출발</button>';
  else if(ready.has(state.self))html+='<p class="note">준비됐어요. 모험을 만든 친구가 함께 출발을 눌러요.</p>';
  html+='<details class="party-friend-details"><summary>친구 더 초대하기</summary>'+friendsHtml()+'</details>'+codeHtml()+chatHtml()+'<button class="text-button wide" id="party-leave">모험 나가기</button>';
  return html;
 }
 function questionHtml(){
  const run=state?.run,q=run?.question;if(!run||!q)return lobbyHtml();
  const solver=state?.members.find(m=>m.id===q.solverId)?.profile.nickname;
  return '<section class="party-question"><small>'+destinationName(run.config)+' · 몬스터 '+(q.monster+1)+' · '+q.round+'/'+q.rounds+'문제</small><h3>'+esc(q.prompt)+'</h3>'+
   (q.solved?'<p class="party-notice">'+(solver?esc(solver)+'님이 맞혔어요!':'정답이에요!')+' 함께 앞으로 가요.</p><button class="primary wide" id="party-next">함께 다음 문제 →</button>':
   '<form class="party-answer-row" id="party-answer-form"><input id="party-answer" inputmode="decimal" autocomplete="off" maxlength="24" aria-label="함께 풀 문제 답"><button class="primary" type="submit">답 확인</button>'+(q.remainder?'<button class="secondary" type="button" id="party-remainder">나머지 R</button>':'')+'</form>')+
   '<p class="note">한 친구가 맞히면 함께 진행해요. 내가 직접 맞힌 문제는 내 학습 기록에 남아요.</p></section>'+chatHtml()+'<button class="text-button wide" id="party-manage">함께하는 친구 보기</button>';
 }
 function render(){
  const run=state?.run;
  button.textContent=state?'🤝 친구와 모험 '+state.members.length+'/4':'🤝 친구와 모험';
  button.setAttribute('aria-label',button.textContent);
  questionButton.hidden=!here()||!connected;
  questionButton.textContent=run?.done?'🌟 친구 모험 완료': '🤝 함께 모험 · '+(run?.completed.length??0)+'마리 완료';
  if(!opened||!h.state())return;
  const modal=document.querySelector<HTMLDialogElement>('#modal')!;
  if(modal.open&&!document.querySelector('.forest-party-sheet')&&renderKey){opened=false;return;}
  const key=JSON.stringify([state,notice,saveNotice,connected,view,h.publicPeers().map(p=>[p.id,p.profile.nickname,p.party])],(k,v)=>k==='pose'?undefined:v);
  if(key===renderKey)return;renderKey=key;
  const drafts=new Map<string,{value:string;start:number|null;end:number|null}>();
  document.querySelectorAll<HTMLInputElement>('.forest-party-sheet input').forEach(input=>{if(input.id==='party-answer'&&renderedQuestion!==state?.run?.question?.id)return;drafts.set(input.id,{value:input.value,start:input.selectionStart,end:input.selectionEnd});});
  const expanded=[...document.querySelectorAll<HTMLDetailsElement>('.forest-party-sheet details[open]')].map(d=>d.className);
  const focused=document.activeElement?.id;const scroll=modal.scrollTop;
  const html=view==='question'?questionHtml():lobbyHtml();
  h.open('<section class="forest-party-sheet"><button class="close" id="party-close" aria-label="닫기">×</button><header class="party-heading"><small>초대하고 함께 떠나요</small><h2>친구와 모험</h2></header>'+html+(notice?'<p class="party-notice" role="status">'+esc(notice)+'</p>':'')+(saveNotice?'<p class="party-notice party-save-notice" role="status">'+esc(saveNotice)+'</p><button class="secondary wide" id="party-retry">다시 저장</button>':'')+'</section>','inventory-modal');
  for(const [id,draft] of drafts){const input=document.getElementById(id) as HTMLInputElement|null;if(input){input.value=draft.value;if(id===focused){input.focus({preventScroll:true});input.setSelectionRange(draft.start,draft.end);}}}
  document.querySelectorAll<HTMLDetailsElement>('.forest-party-sheet details').forEach(d=>{d.open=expanded.includes(d.className);});
  renderedQuestion=state?.run?.question?.id??'';modal.scrollTop=scroll;bindEvents();
 }
 function bindEvents(){
  const on=(id:string,fn:()=>void)=>{const b=document.getElementById(id);if(b)b.onclick=fn;};
  on('party-close',close);on('party-create',create);
  on('party-leave',()=>{client.leave();state=null;entered='';pendingPeer=null;notice='';h.world()?.clearPlazaPlayers();if(h.world())h.world()!.partyScene=false;syncPeers();close();});
  on('party-start',()=>client.send({type:'start'}));
  on('party-ready',()=>client.send({type:'ready',revision:state?.lobby?.revision}));
  on('party-next',()=>client.send({type:'next',questionId:state?.run?.question?.id}));
  on('party-return',()=>{if(state?.run)h.enter(state.run.config);close();});
  on('party-manage',()=>show('lobby'));
  on('party-retry',()=>{h.persist();client.send({type:'sync'});});
  on('party-remainder',()=>{const input=document.querySelector<HTMLInputElement>('#party-answer')!;if(!input.value.includes('R'))input.value+='R';input.focus();});
  on('party-paste-code',()=>{void navigator.clipboard?.readText().then(text=>{const input=document.querySelector<HTMLInputElement>('#party-code-input');if(input)input.value=normalizedPartyCode(text);}).catch(()=>h.toast('코드 칸을 길게 눌러 붙여넣을 수 있어요.'));});
  on('party-copy-code',()=>{if(state)void navigator.clipboard?.writeText(state.code).then(()=>h.toast('초대 코드를 복사했어요.')).catch(()=>h.toast('보이는 코드를 친구에게 알려 주세요.'));});
  const select=document.querySelector<HTMLSelectElement>('#party-destination');
  if(select)select.onchange=()=>{const [forest,stage]=select.value.split(':');client.send({type:'destination',destination:{forest,stage:Number(stage),grade:h.state()?.grade}});};
  document.querySelectorAll<HTMLButtonElement>('[data-invite-peer]').forEach(b=>b.onclick=()=>{const peer=h.publicPeers().find(p=>p.id===b.dataset.invitePeer);if(peer)invitePeer(peer);});
  const join=document.querySelector<HTMLFormElement>('#party-join-form');
  if(join)join.onsubmit=e=>{e.preventDefault();const code=normalizedPartyCode(document.querySelector<HTMLInputElement>('#party-code-input')!.value);if(!/^[A-Z0-9]{8}$/.test(code)){notice='친구에게 받은 8자리 코드를 확인해 주세요.';render();return;}notice='친구를 찾고 있어요.';client.join(code);render();};
  const answer=document.querySelector<HTMLFormElement>('#party-answer-form');
  if(answer)answer.onsubmit=e=>{e.preventDefault();client.send({type:'answer',questionId:state?.run?.question?.id,value:document.querySelector<HTMLInputElement>('#party-answer')!.value});};
  const chat=document.querySelector<HTMLFormElement>('#party-chat-form');
  if(chat)chat.onsubmit=e=>{e.preventDefault();const input=document.querySelector<HTMLInputElement>('#party-chat-input')!;if(input.value.trim()){client.send({type:'chat',text:input.value});input.value='';}};
 }
 document.querySelector('#modal')?.addEventListener('close',()=>{opened=false;});
 button.onclick=()=>show();questionButton.onclick=()=>show(runDone()?'lobby':'question');
 function runDone(){return state?.run?.done===true;}
 const timer=setInterval(()=>{
  const s=h.state(),w=h.world();if(!s||!w)return;
  const p=w.player.position;
  client.tick({x:p.x,y:p.y,z:p.z,angle:w.player.rotation.y},here());
  syncPeers();renderInvitation();render();
 },200);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){const w=h.world();if(w){const p=w.player.position;client.send({type:'pose',pose:{x:p.x,y:p.y,z:p.z,angle:w.player.rotation.y},here:false});}}
  syncPeers();
 });
 window.addEventListener('pagehide',()=>{clearInterval(timer);client.stop();});
 return {show:()=>show(),invitePeer,receiveInvite:(value:PartyInvitation)=>{if(!invitation||invitation.expiresAt<=Date.now()){invitation=value;inviteBanner.dataset.id='';renderInvitation();}},
  inviteStatus:(message:string)=>{notice=message;h.toast(message);render();},
  interceptBattle:()=>{if(!here()||!connected)return false;show('question');return true;},sync:syncPeers};
}
