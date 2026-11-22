import {POTIONS,brewPotion,mathLevelBerries,type Save} from './rules';
import {WORKSHOP_RECIPES,WORKSHOP_MAX_ORBS,SHOP_BOOST_DAILY_LIMIT,potionWorkshopOf,shopBoostRemaining} from './potion-workshop';

type WorkshopHost={open:(html:string,cls?:string)=>void;persist:()=>void;refresh:()=>void;toast:(text:string)=>void;toShop:()=>void;toMath:()=>void};

/** 2026-11-22 Codex 시안: 약초와 물약병이 놓인 공방 안 · 지혜 구슬 유리병 · 레시피 카드 · 구리 가마솥 만들기 버튼. */
export function showPotionWorkshop(s:Save,h:WorkshopHost){
 const art=(import.meta.env?.BASE_URL??'./')+'art/workshop/';
 const show=()=>{
  const w=potionWorkshopOf(s),left=shopBoostRemaining(s);
  const cards=WORKSHOP_RECIPES.map(({id,orbs})=>{const p=POTIONS[id];if(p.kind!=='berry'&&p.kind!=='xp')return '';const ready=w.orbs>=orbs&&s.potions.stock[id]<99;
   return '<article class="pw-recipe'+(ready?' ready':'')+'"><img class="pw-bottle" src="'+art+'potion-'+id+'.webp" alt="" aria-hidden="true" decoding="async"><div class="pw-recipe-body"><strong>'+p.name+'</strong><span class="pw-chips"><span>'+(p.kind==='berry'?'🍓 베리':'✨ 경험치')+' ×'+p.multiplier+'</span><span>⏳ '+p.durationMinutes+'분</span></span><small>가방에 '+s.potions.stock[id]+'개</small></div><button class="pw-brew" data-brew="'+id+'" '+(ready?'':'disabled')+' aria-label="'+p.name+' 만들기 · 지혜 구슬 '+orbs+'개"><img src="'+art+'orb.webp" alt=""><b>'+orbs+'</b></button></article>';}).join('');
  const filled=Math.round(w.orbs/WORKSHOP_MAX_ORBS*12);
  h.open('<section class="potion-workshop">'
   +'<header class="pw-hero"><img src="'+art+'hero.webp" alt="" decoding="async"><div class="pw-hero-text"><small>상점거리 · 숲속 물약 공방</small><h2>보글보글 물약 공방</h2></div></header>'
   +'<div class="pw-jar"><img class="pw-jar-art" src="'+art+'orb-jar.webp" alt="" aria-hidden="true"><div><strong>지혜 구슬 '+w.orbs+' / '+WORKSHOP_MAX_ORBS+'</strong><span class="pw-orbs" role="img" aria-label="지혜 구슬 '+w.orbs+' / '+WORKSHOP_MAX_ORBS+'">'+Array.from({length:12},(_,i)=>'<i'+(i<filled?' class="on"':'')+'></i>').join('')+'</span><small>힌트 없이 맞힌 수학 정답 한 판마다 1개씩 모여요</small></div></div>'
   +'<div class="pw-recipes">'+cards+'</div>'
   +'<p class="pw-note">강한 물약(3배·4배·긴 시간)은 공방에서만 만들어요. 물약 가게의 베리·경험치 물약은 하루 '+SHOP_BOOST_DAILY_LIMIT+'병까지(오늘 '+left+'병 남음). 지금 레벨에서는 수학 몬스터 한 판마다 베리 +'+mathLevelBerries(s.level).toLocaleString()+'도 함께 받아요.</p>'
   +'<div class="pw-actions"><button class="pw-go-math" data-pw="math">🌳 수학숲에서 구슬 모으기</button><button class="pw-go-shop" data-pw="shop">🧪 물약 가게</button></div>'
   +'<button class="pw-close" data-close>게임으로 돌아가기</button></section>','potion-workshop-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-brew]').forEach(b=>b.onclick=()=>{try{const msg=brewPotion(s,Number(b.dataset.brew));h.persist();h.refresh();h.toast(msg);show();}catch(e){h.toast((e as Error).message);}});
  document.querySelector<HTMLButtonElement>('[data-pw="math"]')!.onclick=()=>h.toMath();
  document.querySelector<HTMLButtonElement>('[data-pw="shop"]')!.onclick=()=>h.toShop();
 };
 show();
}
