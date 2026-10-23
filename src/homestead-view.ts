import { homeRecommendation, requestChecklist } from './home-guidance';
import { showHomeEditor } from './home-editor';
import { HOME_ITEMS, HOME_REQUESTS, STARTER_BLUEPRINTS, blueprintIds, availableHome, objectCells, layoutError, craftHome, placeHome, storeHome, requestReady, claimHomeMemory } from './homestead';
import { syncDiscoveries } from './exploration';
import type { Save } from './rules';
import './homestead.css';
export interface HomeHooks { open(html:string):void; save():void; changed():void; enter():void; leave():void; full():boolean; paywall():void; notebook():void; back():void; react():void }
export const homeHeading=(name:string)=>`<div class="modal-heading"><div><span class="eyebrow">탐험해서 만드는 나의 집</span><h2>${name}</h2></div><button class="close" data-close aria-label="닫기">×</button></div>`;
export function memoryPicture(id:number,label:string){return `<svg class="home-picture" viewBox="0 0 200 100" role="img" aria-label="${label}"><rect width="200" height="100" rx="12" fill="${['#e5f0d2','#e4edde','#f6ead0','#ecf0cb','#f5dfeb','#d6f0f5'][id%6]}"/><circle cx="160" cy="23" r="12" fill="#ffdc8a"/><path d="M0 80 Q60 40 110 75 T200 60 V100 H0Z" fill="#94bf85"/><path d="M60 100 Q110 70 110 50" stroke="#ead5a5" stroke-width="13" fill="none"/><path d="M32 70 V43 M155 79 V50" stroke="#957153" stroke-width="6"/><circle cx="32" cy="36" r="20" fill="#75a87b"/><circle cx="155" cy="43" r="16" fill="#adbd7c"/><rect x="80" y="58" width="46" height="8" rx="3" fill="#a77d57"/><path d="M86 66 V80 M119 66 V80" stroke="#a77d57" stroke-width="4"/><text x="99" y="45" text-anchor="middle" font-size="25">${HOME_REQUESTS[id%6].icon}</text></svg>`;}
export function showHomestead(s:Save,hooks:HomeHooks){showHomeEditor(s,hooks);}
export function showHomeRequests(s:Save,hooks:HomeHooks){
  const recommendation=homeRecommendation(s,hooks.full());
  const card=(id:number)=>{
    const q=HOME_REQUESTS[id],done=s.homestead.memories.includes(id),ready=requestReady(s,id);
    const checklist=requestChecklist(s,id,hooks.full()).map(item=>`<li>${item.placed?'✓':'○'} ${item.kind===undefined?item.names:HOME_ITEMS[item.kind].name}${item.placed?' 준비 완료':item.kind===undefined?' · 숲에서 도안을 열어요':` <button class="secondary" data-home-prepare="${item.kind}">${availableHome(s,item.kind)>0?'배치하러 가기':'만들고 놓기'}</button>`}</li>`).join('');
    return `<article>${memoryPicture(id,done?q.memory:q.title)}<h3>${q.icon} ${q.title}</h3>${done?`<b>✓ ${q.memory}</b><p>${q.line}</p>`:`<ul class="request-checklist">${checklist}</ul>${ready?`<button class="primary wide" data-home-memory="${id}">부탁 완료하고 추억 받기</button>`:''}`}</article>`;
  };
  const next='id' in recommendation?recommendation.id:undefined;
  hooks.open(homeHeading('주민 부탁과 추억 그림')+`<p>완성한 추억은 시설을 보관해도 남아요.</p><section class="home-recommendation" aria-label="지금 할 수 있는 부탁"><span class="eyebrow">다음 작은 즐거움</span><h3>${recommendation.label}</h3>${next===undefined?`<button id="home-recommend-free" class="primary wide">${recommendation.action==='discover'?'숲의 도안 찾기':'정원 꾸미기'}</button>`:card(next)}</section><details class="home-other-requests"><summary>다른 부탁과 모은 추억 보기</summary><div class="home-memories">${HOME_REQUESTS.map((_,id)=>id===next?'':card(id)).join('')}</div></details><button id="home-request-back" class="secondary wide">이전 메뉴</button><button class="text-button wide" data-close>마을로 돌아가기</button>`);
  document.getElementById('home-request-back')!.onclick=hooks.back;
  const free=document.getElementById('home-recommend-free');if(free)free.onclick=()=>recommendation.action==='discover'?hooks.notebook():showHomestead(s,hooks);
  document.querySelectorAll<HTMLButtonElement>('[data-home-prepare]').forEach(b=>b.onclick=()=>showHomeEditor(s,hooks,Number(b.dataset.homePrepare)));
  document.querySelectorAll<HTMLButtonElement>('[data-home-memory]').forEach(b=>b.onclick=()=>{if(claimHomeMemory(s,Number(b.dataset.homeMemory))){hooks.save();hooks.changed();hooks.react();showHomeRequests(s,hooks);}});
}
