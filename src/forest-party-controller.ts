import {plazaDeviceIdentity} from './plaza-operator';
import type {PlazaPlayer} from './plaza-protocol';
import {ForestPartyClient,type PartyState} from './forest-party-client';
import {claimPartyReward} from './forest-party-rewards';
import {plazaProfile} from './plaza-identity';
import {canEnter,journeyFor,operationsForGrade,OPERATION_INFO,type Save} from './rules';
import type {PartyLesson} from './forest-party';
import type {World} from './world';
import {PLAZA_ENDPOINT} from './plaza-endpoint';
import './forest-party.css';
type Hooks={state:()=>Save|null;world:()=>World|undefined;host:HTMLElement;open:(html:string,cls?:string)=>void;close:()=>void;persist:()=>void;stored:()=>boolean;refresh:()=>void;toast:(s:string)=>void;enter:(c:PartyLesson)=>void;operatorToken:()=>string;publicPeers:()=>PlazaPlayer[]};
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function mountForestParty(h:Hooks){
 let state:PartyState|null=null,connected=false,opened=false,notice='',entered='',renderKey='',chatLines:string[]=[];const defeated=new Set<string>();
 const button=document.createElement('button');button.id='party-open';button.textContent='🤝 파티';button.setAttribute('aria-label','친구와 숲 파티');h.host.querySelector('.display-controls')!.append(button);
 const questionButton=document.createElement('button');questionButton.id='party-question-open';questionButton.className='party-question-open';questionButton.hidden=true;questionButton.textContent='🤝 파티 문제 함께 풀기';h.host.append(questionButton);
 const endpoint=(import.meta.env.VITE_PLAZA_URL as string|undefined)||PLAZA_ENDPOINT;
 function profile(){const s=h.state(),p=s&&(plazaProfile(s)??plazaProfile({...s,selectedTitleId:null}));if(!s||!p)return null;return {profile:p,grade:s.grade,operatorToken:h.operatorToken(),chatIdentity:plazaDeviceIdentity(),openStages:Object.fromEntries(['addition','subtraction','multiplication','division'].map(f=>[f,Array.from({length:10},(_,i)=>i+1).filter(n=>canEnter(s,n,f as Save['forest'])).at(-1)??0]))};}
 function here(){const s=h.state(),w=h.world(),c=state?.run?.config;return !!s&&!!w&&!!c&&!document.hidden&&w.active&&!w.inHunting&&!w.inAcademy&&!w.inAstralStudy&&!w.inRoom&&!w.inHomestead&&s.forest===c.forest&&s.grade===c.grade&&journeyFor(s).stage===c.stage;}
 const client=new ForestPartyClient(endpoint,{profile,
  status:value=>{connected=value;if(!value){if(h.world()?.partyScene)h.world()?.clearPlazaPlayers();notice=client.code?'연결을 다시 시도하고 있어요. 혼자 모험과 저장은 계속할 수 있어요.':'';}render(true);},
  state:next=>{state=next;notice='';const s=h.state();if(!s)return;
   if(next.run&&next.run.id!==entered){entered=next.run.id;defeated.clear();if(canEnter(s,next.run.config.stage,next.run.config.forest)&&s.grade===next.run.config.grade){h.enter(next.run.config);if(h.world()?.forestPresenceOnline)for(const peer of h.publicPeers())h.world()?.upsertPlazaPlayer(peer);opened=false;}}
   for(const reward of next.rewards){const result=claimPartyReward(s,reward);if(!result.accepted){notice='파티 보상을 받으려면 해당 학년·단계에서 다시 연결해 주세요.';continue;}h.persist();if(h.stored()){client.send({type:'reward-ack',id:reward.id});if(!result.duplicate)h.toast('🤝 파티 완료! 베리 +'+result.berries+' · 경험치 +'+result.xp);}else notice='보상을 아직 저장하지 못했어요. 아래 다시 저장을 눌러 주세요.';}
   h.refresh();syncPeers();if(here())for(const id of next.run?.completed??[]){const key=next.run!.id+':'+id;if(!defeated.has(key)){defeated.add(key);h.world()?.defeat('monster'+id);}}render(true);
  },
  pose:(id,pose,inRun)=>{const peer=state?.members.find(m=>m.id===id);if(peer){peer.pose=pose;peer.here=inRun;syncPeers();}},
  message:text=>{notice=text;render(true);},
  chat:(id,message)=>{chatLines.push(message.nickname+': '+message.text);chatLines=chatLines.slice(-20);if(here())h.world()?.showPlazaSpeech(id===state?.self?null:h.world()?.forestPresenceOnline?state?.members.find(m=>m.id===id)?.presenceId??id:id,message);const log=document.querySelector('.party-chat-log');if(log){log.innerHTML=chatLines.map(x=>'<li>'+esc(x)+'</li>').join('');log.scrollTop=log.scrollHeight;}},
 });
 function syncPeers(){const w=h.world();if(!w)return;const active=here()&&connected&&!w.forestPresenceOnline;if(w.partyScene!==active){w.clearPlazaPlayers();w.partyScene=active;if(w.forestPresenceOnline)for(const peer of h.publicPeers())w.upsertPlazaPlayer(peer);}if(!active)return;const visible=new Set<string>();for(const m of state?.members??[])if(m.id!==state?.self&&m.online&&m.here){visible.add(m.id);w.upsertPlazaPlayer({id:m.id,profile:m.profile,pose:m.pose,role:m.role});}for(const m of state?.members??[])if(m.id!==state?.self&&!visible.has(m.id))w.removePlazaPlayer(m.id);}
 function show(){opened=true;renderKey='';render(true);}
 function close(){opened=false;h.close();}
 function render(force=false){questionButton.hidden=!here()||!connected;questionButton.textContent=state?.run?.done?'🤝 파티 모험 완료 · 다음 숲':'🤝 파티 문제 함께 풀기';button.textContent=state?'🤝 '+state.members.length+'/4':'🤝 파티';if(!opened||!h.state())return;const modal=document.querySelector<HTMLDialogElement>('#modal')!;if(modal.open&&!document.querySelector('.forest-party-sheet')&&renderKey){opened=false;return;}
 const key=JSON.stringify([state?.run?.question?.id,state?.run?.question?.solved,state?.run?.done,state?.members.map(m=>[m.id,m.online]),notice,connected]);if(!force&&key===renderKey)return;renderKey=key;
 const s=h.state()!,run=state?.run,q=run?.question;const current=journeyFor(s).stage;
 let body='';if(!state){body='<p>초대 코드로 최대 네 명이 같은 수학숲에서 만나요. 같은 학년과 열린 단계에서 정답·몬스터 진행을 공유해요.</p><div class="party-actions"><button class="primary" id="party-create">새 파티 만들기</button></div><form class="party-join" id="party-join-form"><input id="party-code-input" aria-label="파티 초대 코드" autocomplete="off" maxlength="8" placeholder="친구의 8자리 코드"><button class="secondary" type="submit">참가하기</button></form>'+(client.code?'<p class="party-notice">'+esc(client.code)+' · 연결을 확인하고 있어요.</p><button class="secondary" id="party-leave">연결 취소</button>':'');}
 else{body='<strong class="party-code" aria-label="파티 초대 코드">'+state.code+'</strong><p class="note">코드를 친구에게 알려 주세요. 꺼진 친구의 자리는 5분간 유지돼요.</p><ul class="party-members">'+state.members.map(m=>'<li>'+esc(m.profile.nickname)+(m.id===state!.leader?' 👑':'')+'<small>'+m.grade+'학년 · '+(m.online?'접속 중':'잠시 자리 비움')+'</small></li>').join('')+'</ul>';
 if(run&&!run.done&&q){body+='<section class="party-question"><small>'+OPERATION_INFO[run.config.forest].name+'숲 '+run.config.stage+'단계 · 몬스터 '+(q.monster+1)+' · '+q.round+'/'+q.rounds+'문제</small><h3>'+esc(q.prompt)+'</h3><p>'+esc(q.monsterName)+'와 파티가 함께 시합해요.</p>'+(q.solved?'<p class="party-notice">정답이에요! 친구들의 진행에도 반영됐어요.</p><button class="primary wide" id="party-next">함께 다음 문제로 →</button>':'<form class="party-answer-row" id="party-answer-form"><input id="party-answer" inputmode="decimal" autocomplete="off" maxlength="24" aria-label="파티 문제 답"><button class="primary" type="submit">답 확인</button>'+(q.remainder?'<button class="secondary party-word" type="button" id="party-remainder">나머지 R</button>':'')+'</form>')+'<p class="note">한 친구가 정답을 맞히면 함께 진행해요. 보상은 몬스터 완료 때 함께 받으며, 내 학습 정답 수는 내가 직접 맞힌 문제만 기록해요.</p></section>';
 if(!here())body+='<button class="secondary wide" id="party-return">파티가 있는 숲으로 돌아가기</button>';}
 else body+=(run?.done?'<p class="party-notice">🌟 이 숲의 몬스터를 모두 만났어요! 파티장이 다음 열린 숲에서 다시 시작할 수 있어요.</p>':'<p>각자 수학숲으로 이동한 뒤 파티장이 시작해요.</p>')+(state.self===state.leader?'<button class="primary wide" id="party-start" '+(!(current>0&&!s.hub&&!s.world2.location&&!s.astralStudy.location)?'disabled':'')+'>지금 있는 수학숲 '+(current||'')+'단계로 함께 시작</button>':'<p class="note">파티장이 모험을 시작하면 같은 수학숲으로 이동해요.</p>');
 body+='<ul class="party-chat-log" aria-live="polite">'+chatLines.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><form class="party-chat-form" id="party-chat-form"><input id="party-chat-input" aria-label="파티 대화" maxlength="100" autocomplete="off" placeholder="친구들에게 말하기"><button class="secondary" type="submit">보내기</button></form><button class="text-button wide" id="party-leave">파티 나가기</button>';}
 h.open('<section class="forest-party-sheet"><button class="close" id="party-close" aria-label="닫기">×</button><header class="party-heading"><small>함께 걷는 수학 모험</small><h2>친구와 숲 파티</h2></header>'+body+(notice?'<p class="party-notice" role="status">'+esc(notice)+'</p><button class="secondary wide" id="party-retry">다시 연결·저장 확인</button>':'')+'</section>','inventory-modal');
 const on=(id:string,fn:()=>void)=>{const b=document.getElementById(id);if(b)b.onclick=fn;};on('party-close',close);on('party-create',()=>{client.join(crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),true);notice='파티를 만들고 있어요.';render(true);});
 const join=document.querySelector<HTMLFormElement>('#party-join-form');if(join)join.onsubmit=e=>{e.preventDefault();const code=(document.querySelector<HTMLInputElement>('#party-code-input')!.value).trim().toUpperCase();if(!/^[A-Z0-9]{8}$/.test(code)){notice='친구가 알려 준 8자리 코드를 입력해 주세요.';render(true);return;}client.join(code);notice='친구의 파티에 연결하고 있어요.';render(true);};
 on('party-leave',()=>{client.leave();state=null;entered='';h.world()?.clearPlazaPlayers();if(h.world())h.world()!.partyScene=false;close();});
 on('party-start',()=>client.send({type:'start',config:{forest:s.forest,stage:journeyFor(s).stage,grade:s.grade,level:s.level}}));
 on('party-next',()=>client.send({type:'next',questionId:q?.id}));on('party-return',()=>{if(run)h.enter(run.config);close();});
 on('party-retry',()=>{h.persist();client.send({type:'sync'});});on('party-remainder',()=>{const input=document.querySelector<HTMLInputElement>('#party-answer')!;if(!input.value.includes('R'))input.value+='R';input.focus();});
 const answer=document.querySelector<HTMLFormElement>('#party-answer-form');if(answer)answer.onsubmit=e=>{e.preventDefault();client.send({type:'answer',questionId:q?.id,value:document.querySelector<HTMLInputElement>('#party-answer')!.value});};
 const chat=document.querySelector<HTMLFormElement>('#party-chat-form');if(chat)chat.onsubmit=e=>{e.preventDefault();const input=document.querySelector<HTMLInputElement>('#party-chat-input')!;if(input.value.trim()){client.send({type:'chat',text:input.value});input.value='';}};
 }
 document.querySelector('#modal')?.addEventListener('close',()=>{opened=false;});
 button.onclick=show;questionButton.onclick=show;
 const timer=setInterval(()=>{const s=h.state(),w=h.world();if(!s||!w)return;const p=w.player.position;client.tick({x:p.x,y:p.y,z:p.z,angle:w.player.rotation.y},here());syncPeers();questionButton.hidden=!here()||!connected;},200);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){const w=h.world();if(w){const p=w.player.position;client.send({type:'pose',pose:{x:p.x,y:p.y,z:p.z,angle:w.player.rotation.y},here:false});}}syncPeers();});
 window.addEventListener('pagehide',()=>{clearInterval(timer);client.stop();});
 return {show,interceptBattle:()=>{if(!here()||!connected)return false;show();return true;},sync:syncPeers};
}
