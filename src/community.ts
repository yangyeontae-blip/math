import type {Save,ForestKind} from './rules';
import {operationsForGrade} from './rules';
import './community.css';
type Kind='guild'|'duel';
type Room={kind:Kind;code:string;name?:string;you:string;members:{id:string;nickname:string;leader:boolean;score:number;ready:boolean}[];grade?:number;forest?:ForestKind;phase?:string;round?:number;rounds?:number;question?:{id:string;prompt:string;remainder:boolean}|null;answer?:string;result?:string;winner?:string|null};
const FOREST_INFO={addition:{name:'덧셈숲'},subtraction:{name:'뺄셈숲'},multiplication:{name:'곱셈숲'},division:{name:'나눗셈숲'}};
type Hooks={state:()=>Save|null;open:(html:string)=>void;toast:(message:string)=>void};
const KEY='berry-forest-community-v1',endpoint=import.meta.env.VITE_COMMUNITY_URL||'https://berry-forest-school.yangyeontae.chatgpt.site/api/community';
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Identity={token:string;guild:string;duel:string};
function identity():Identity{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&/^[a-f0-9]{64}$/.test(s.token))return {token:s.token,guild:/^[A-Z2-9]{8}$/.test(s.guild??'')?s.guild:'',duel:/^[A-Z2-9]{8}$/.test(s.duel??'')?s.duel:''};}catch{}return {token:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),guild:'',duel:''};}

/** Only explicit invitations share a nickname. No game save or learning record is uploaded. */
export function mountCommunity(h:Hooks){
 const id=identity();let kind:Kind='guild',room:Room|null=null,busy=false,message='',timer:ReturnType<typeof setTimeout>|null=null,generation=0,question='';
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(id));return true;}catch{h.toast('모임 연결을 이 기기에 저장하지 못했어요. 저장 공간을 확인해 주세요.');return false;}};
 const present=()=>!!document.querySelector('#modal[open] [data-community-sheet]');
 function stop(){if(timer)clearTimeout(timer);timer=null;}
 async function call(action:string,extra:Record<string,unknown>={}){
  if(busy){if(action==='state')return;const current=generation;await new Promise<void>(resolve=>setTimeout(resolve,80));if(current!==generation)return;return call(action,extra);}
  if(action==='create'&&room)return;const s=h.state();if(!s)return;busy=true;let repaint=action!=='state';const previous=JSON.stringify(room),ticket=generation,selected=kind,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   if(!save())return;
   const response=await fetch(endpoint+'/'+selected,{method:'POST',credentials:'omit',headers:{'content-type':'application/json',authorization:'Bearer '+id.token},body:JSON.stringify({action,code:id[selected],nickname:s.nickname,grade:s.grade,forest:s.forest,...extra}),signal:controller.signal});
   let value:{room?:Room|null;error?:string};try{value=await response.json();}catch{throw Error('모임 서버 응답을 확인할 수 없어요.');}
   if(ticket!==generation)return;
   if(!response.ok){if(action==='state'&&(response.status===404||response.status===403)){id[selected]='';room=null;save();}throw Error(value.error||'연결을 확인하고 다시 해요.');}
   room=value.room??null;repaint||=!!message||previous!==JSON.stringify(room);if(room)id[selected]=room.code;if(action==='leave')id[selected]='';save();message='';
  }catch(error){if(ticket===generation){repaint=true;message=(error as Error).name==='AbortError'?'연결을 기다리는 중이에요. 다시 눌러 주세요.':(error as Error).message;}}
  finally{clearTimeout(timeout);if(ticket===generation){busy=false;if(present()&&repaint)render();schedule();}}
 }
 function schedule(){stop();if(present()&&id[kind])timer=setTimeout(()=>{if(!present()){stop();return;}if(document.activeElement?.matches('#duel-answer')){void call('state');}else void call('state');},2500);}
 function render(reset=false){
  if(!h.state())return;const typing=document.activeElement as HTMLInputElement|null,answer=typing?.id==='duel-answer'?typing.value:'',selection=typing?.selectionStart??null,sameQuestion=question===(room?.question?.id??'');
  question=room?.question?.id??'';const scroll=reset?0:document.querySelector<HTMLDialogElement>('#modal')?.scrollTop??0;
  let html='<section class="community-sheet" data-community-sheet><header><small>초대 코드로 함께 만나요</small><h2>길드와 친구 대전</h2></header><nav class="community-tabs"><button data-community-tab="guild" aria-pressed="'+(kind==='guild')+'">🌿 길드</button><button data-community-tab="duel" aria-pressed="'+(kind==='duel')+'">⚔ 친구 대전</button></nav>'+(message?'<p class="community-notice" role="status">'+esc(message)+'</p>':'');
  if(!room){
   html+='<p>'+ (kind==='guild'?'최대 24명의 길드 친구가 모여요. 길드 이름에는 실명·학교·연락처를 쓰지 마세요.':'같은 문제로 겨루는 2인 수학 대전이에요. 두 친구가 준비하면 5문제를 풀어요. 먼저 맞히면 1점, 틀려도 가진 것은 잃지 않아요. 시간제한과 보상은 없어요.')+'</p>';
   if(kind==='guild')html+='<form id="community-create"><label>길드 이름<input id="guild-name" maxlength="12" required autocomplete="off"></label><button class="primary" '+(busy?'disabled':'')+'>새 길드 만들기</button></form>';
   else html+='<form id="community-create"><label>함께 풀 계산 숲<select id="duel-forest">'+operationsForGrade(h.state()!.grade).map(f=>'<option value="'+f+'">'+esc(FOREST_INFO[f].name)+'</option>').join('')+'</select></label><p>만드는 친구의 '+h.state()!.grade+'학년 문제로 함께 겨뤄요.</p><button class="primary" '+(busy?'disabled':'')+'>새 대전 만들기</button></form>';
   html+='<form id="community-join"><label>친구의 8자리 초대 코드<input id="community-code" maxlength="8" minlength="8" required autocomplete="off" autocapitalize="characters"></label><button class="secondary" '+(busy?'disabled':'')+'>코드로 참가하기</button></form>';
   if(id[kind])html+='<button data-community-action="state">이전 모임 다시 연결</button><button data-community-forget>이 기기의 연결 지우기</button>';
  }else{
   html+='<h3>'+esc(room.name||'친구 수학 대전')+'</h3><p>친구에게 이 코드를 알려 주세요.</p><strong class="community-code" aria-label="모임 초대 코드">'+esc(room.code)+'</strong><ul class="community-members">'+room.members.map(m=>'<li><b>'+esc(m.nickname)+(m.id===room!.you?' (나)':'')+(m.leader&&kind==='guild'?' 👑':'')+'</b><span>'+(kind==='duel'?m.score+'점'+(room!.phase==='waiting'?(m.ready?' · 준비 완료':' · 준비 중'):''):'길드 친구')+'</span>'+(kind==='guild'&&room!.members.find(m=>m.id===room!.you)?.leader&&m.id!==room!.you?'<div><button data-community-action="transfer" data-target="'+esc(m.id)+'">길드장 넘기기</button><button data-community-action="kick" data-target="'+esc(m.id)+'">길드에서 내보내기</button></div>':'')+'</li>').join('')+'</ul>';
   if(kind==='duel'){
    html+='<p>'+room.grade+'학년 · '+esc(FOREST_INFO[room.forest!]?.name||'계산 숲')+'</p>';
    if(room.phase==='waiting')html+='<p>두 친구가 모두 준비하면 시작해요.</p><button class="primary wide" data-community-action="ready" '+(room.members.find(m=>m.id===room!.you)?.ready?'disabled':'')+'>준비 완료</button>';
    else if(room.phase==='cancelled')html+='<p>친구가 나가서 대전을 마쳤어요. 가진 것은 그대로예요.</p>';
    else{
     html+='<p class="community-round">'+room.round+' / 5 문제</p>';
     if(room.phase==='playing')html+='<div class="community-question">'+esc(room.question?.prompt)+'</div><form id="community-answer"><label>내 답'+(room.question?.remainder?' (나머지가 있으면 “몫 나머지”)':'')+'<input id="duel-answer" maxlength="24" inputmode="decimal" autocomplete="off" required></label><button class="primary" '+(busy?'disabled':'')+'>답 보내기</button></form><p>각 문제에 한 번씩 답해요. 틀리면 친구의 도전을 기다려요.</p>';
     else html+='<p class="community-result">'+esc(room.result)+'</p><p>정답: '+esc(room.answer)+'</p>';
     if(room.phase==='finished')html+='<h3>'+(room.winner==='draw'?'함께 비겼어요!':room.winner===room.you?'대전에서 이겼어요!':'친구가 이겼어요!')+'</h3><p>베리·장비·수학숲 진도는 그대로예요. 새 코드로 다시 겨뤄요.</p>';
    }
   }
   html+='<button class="secondary wide" data-community-action="leave">'+(kind==='guild'?'길드 나가기':'대전 나가기')+'</button>';
  }
  html+='<p class="note">모임에는 별명과 게임 안 선택만 전해요. 이 기기의 모임 연결을 지우면 길드장 권한을 되찾을 수 없어요. 먼저 다른 친구에게 길드장을 넘겨 주세요.</p><button class="secondary wide" data-close>게임으로 돌아가기</button></section>';
  h.open(html);
  const dialog=document.querySelector<HTMLDialogElement>('#modal');if(dialog)dialog.scrollTop=scroll;
  document.querySelectorAll<HTMLButtonElement>('[data-community-tab]').forEach(b=>b.onclick=()=>show(b.dataset.communityTab as Kind));
  document.querySelectorAll<HTMLButtonElement>('[data-community-action]').forEach(b=>{b.disabled=busy||b.disabled;b.onclick=()=>void call(b.dataset.communityAction!,{target:b.dataset.target});});
  const create=document.querySelector<HTMLFormElement>('#community-create');if(create)create.onsubmit=e=>{e.preventDefault();void call('create',kind==='guild'?{name:document.querySelector<HTMLInputElement>('#guild-name')!.value}:{forest:document.querySelector<HTMLSelectElement>('#duel-forest')!.value});};
  const join=document.querySelector<HTMLFormElement>('#community-join');if(join)join.onsubmit=e=>{e.preventDefault();void call('join',{code:document.querySelector<HTMLInputElement>('#community-code')!.value.trim().toUpperCase()});};
  const form=document.querySelector<HTMLFormElement>('#community-answer');if(form)form.onsubmit=e=>{e.preventDefault();void call('answer',{questionId:room?.question?.id,answer:document.querySelector<HTMLInputElement>('#duel-answer')!.value});};
  const forget=document.querySelector<HTMLButtonElement>('[data-community-forget]');if(forget)forget.onclick=()=>{id[kind]='';room=null;save();render();};
  if(typing?.id==='duel-answer'&&sameQuestion){const input=document.querySelector<HTMLInputElement>('#duel-answer');if(input){input.value=answer;input.focus();if(selection!==null)input.setSelectionRange(selection,selection);}}
 }
 function show(selected:Kind='guild'){generation++;stop();busy=false;kind=selected;room=null;message='';render(true);if(id[kind])void call('state');}
 return {show};
}
