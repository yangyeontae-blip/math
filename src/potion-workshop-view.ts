import {POTIONS,brewPotion,mathLevelBerries,type Save} from './rules';
import {WORKSHOP_RECIPES,WORKSHOP_MAX_ORBS,SHOP_BOOST_DAILY_LIMIT,potionWorkshopOf,shopBoostRemaining} from './potion-workshop';
import {itemIcon} from './item-icons';

type WorkshopHost={open:(html:string,cls?:string)=>void;persist:()=>void;refresh:()=>void;toast:(text:string)=>void;toShop:()=>void;toMath:()=>void};

/** 손그림 수채화 느낌의 가마솥 그림(오리지널 SVG). */
const CAULDRON_ART=`<svg class="pw-cauldron" viewBox="0 0 160 120" aria-hidden="true">
 <defs><radialGradient id="pwGlow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#bff3e1"/><stop offset="1" stop-color="#8fd6be" stop-opacity="0"/></radialGradient>
 <linearGradient id="pwCopper" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e3a47c"/><stop offset="1" stop-color="#a9684a"/></linearGradient></defs>
 <ellipse cx="80" cy="44" rx="58" ry="30" fill="url(#pwGlow)"/>
 <path class="pw-steam" d="M64 40c-8-10 6-14 0-24M84 36c-6-10 8-14 2-26M100 40c-6-8 6-12 0-20" fill="none" stroke="#8fd6be" stroke-width="5" stroke-linecap="round"/>
 <path d="M30 104h100l-8 10H38z" fill="#a69f8c"/><rect x="66" y="96" width="28" height="10" rx="3" fill="#f3b25e"/>
 <path d="M34 54h92c0 30-16 46-46 46S34 84 34 54z" fill="url(#pwCopper)" stroke="#654b3e" stroke-width="3"/>
 <ellipse cx="80" cy="54" rx="48" ry="10" fill="#8fd6be" stroke="#654b3e" stroke-width="3"/>
 <circle cx="66" cy="52" r="4" fill="#d9fbef"/><circle cx="92" cy="55" r="3" fill="#d9fbef"/>
 <path d="M30 60c-8 0-8 12 0 12M130 60c8 0 8 12 0 12" fill="none" stroke="#654b3e" stroke-width="4" stroke-linecap="round"/>
</svg>`;

function orbJar(orbs:number){
 const filled=Math.round(orbs/WORKSHOP_MAX_ORBS*20);
 return '<div class="pw-orbs" role="img" aria-label="지혜 구슬 '+orbs+' / '+WORKSHOP_MAX_ORBS+'">'+Array.from({length:20},(_,i)=>'<i class="'+(i<filled?'on':'')+'"></i>').join('')+'</div>';
}

export function showPotionWorkshop(s:Save,h:WorkshopHost){
 const show=()=>{
  const w=potionWorkshopOf(s),left=shopBoostRemaining(s);
  const cards=WORKSHOP_RECIPES.map(({id,orbs})=>{const p=POTIONS[id];if(p.kind!=='berry'&&p.kind!=='xp')return '';const ready=w.orbs>=orbs&&s.potions.stock[id]<99;
   return '<article class="pw-recipe'+(ready?' ready':'')+'"><span class="pw-recipe-icon">'+itemIcon('potion',id)+'</span><div><strong>'+p.name+'</strong><small>'+(p.kind==='berry'?'🍓 베리 ':'🧪 경험치 ')+p.multiplier+'배 · '+p.durationMinutes+'분</small><small>가방에 '+s.potions.stock[id]+'개</small></div><button class="pw-brew" data-brew="'+id+'" '+(ready?'':'disabled')+'><b>✦ '+orbs+'</b>만들기</button></article>';}).join('');
  h.open('<section class="potion-workshop"><div class="pw-paper"><header class="pw-head"><div><small>상점거리 · 숲속 물약 공방</small><h2>보글보글 물약 공방</h2><p>수학 문제를 맞히면 <b>지혜 구슬</b>이 모여요. 구슬을 가마솥에 넣으면 베리 없이 물약을 만들 수 있어요.</p></div>'+CAULDRON_ART+'</header>'
   +'<div class="pw-jar"><div><strong>✦ 지혜 구슬 '+w.orbs+' / '+WORKSHOP_MAX_ORBS+'</strong><small>힌트 없이 맞힌 정답 한 판마다 1개 · 가득 차면 더 모이지 않아요</small></div>'+orbJar(w.orbs)+'</div>'
   +'<div class="pw-recipes">'+cards+'</div>'
   +'<p class="pw-note">강한 물약(3배·4배·긴 시간)은 공방에서만 만들어요. 물약 가게의 베리·경험치 물약은 하루 '+SHOP_BOOST_DAILY_LIMIT+'병까지 살 수 있어요(오늘 남은 수: '+left+'). 지금 레벨에서는 수학 몬스터 한 판마다 베리 +'+mathLevelBerries(s.level).toLocaleString()+'도 함께 받아요.</p>'
   +'<div class="pw-actions"><button class="primary" data-pw="math">🌳 수학숲에서 구슬 모으기</button><button class="secondary" data-pw="shop">🧪 물약 가게 가기</button><button class="secondary" data-close>게임으로 돌아가기</button></div></div></section>','potion-workshop-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-brew]').forEach(b=>b.onclick=()=>{try{const msg=brewPotion(s,Number(b.dataset.brew));h.persist();h.refresh();h.toast(msg);show();}catch(e){h.toast((e as Error).message);}});
  document.querySelector<HTMLButtonElement>('[data-pw="math"]')!.onclick=()=>h.toMath();
  document.querySelector<HTMLButtonElement>('[data-pw="shop"]')!.onclick=()=>h.toShop();
 };
 show();
}
