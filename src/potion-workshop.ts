import type {Save} from './rules';
import {todayKey} from './daily';

/** 2026-11-21 물약 공방: 수학 정답으로 지혜 구슬을 모아 강한 물약을 만들어요. */
export type PotionWorkshop={orbs:number;date:string;bought:number;brewed:number};
export const WORKSHOP_MAX_ORBS=60;
/** 상점에서 베리로 사는 약한 배수 물약(달콤 베리물약·포근 공부물약)의 하루 합계 한도예요. */
export const SHOP_BOOST_DAILY_LIMIT=3;
/** 물약 번호 → 필요한 지혜 구슬 수. 상점 판매 물약도 공방에서 만들 수 있어요. */
export const WORKSHOP_RECIPES=[
 {id:0,orbs:3},{id:4,orbs:4},{id:1,orbs:6},{id:2,orbs:6},{id:3,orbs:6},{id:5,orbs:8},
] as const;
/** 강한 배수 물약은 공방에서만 만들어요. */
export const WORKSHOP_ONLY_POTIONS:readonly number[]=[1,2,3,5];
export const SHOP_LIMITED_POTIONS:readonly number[]=[0,4];

export const emptyPotionWorkshop=():PotionWorkshop=>({orbs:0,date:'',bought:0,brewed:0});
export function validPotionWorkshop(v:unknown):v is PotionWorkshop{
 const w=v as PotionWorkshop;
 return !!w&&typeof w==='object'&&Number.isInteger(w.orbs)&&w.orbs>=0&&w.orbs<=WORKSHOP_MAX_ORBS
  &&typeof w.date==='string'&&(w.date===''||/^\d{4}-\d{2}-\d{2}$/.test(w.date))
  &&Number.isInteger(w.bought)&&w.bought>=0&&w.bought<=1000
  &&Number.isSafeInteger(w.brewed)&&w.brewed>=0&&w.brewed<=1e9;
}
export function potionWorkshopOf(s:Save){return s.workshop??(s.workshop=emptyPotionWorkshop());}
/** 힌트 없이 맞힌 수학 정답만 구슬을 채워요. 가득 차면 더 쌓이지 않아요. */
export function chargePotionWorkshop(s:Save,amount=1){
 const w=potionWorkshopOf(s),add=Math.max(0,Math.floor(Number.isFinite(amount)?amount:0));
 w.orbs=Math.min(WORKSHOP_MAX_ORBS,w.orbs+add);
}
export function shopBoostBoughtToday(s:Save,now=Date.now()){const w=s.workshop;return w&&w.date===todayKey(new Date(now))?w.bought:0;}
export function shopBoostRemaining(s:Save,now=Date.now()){return Math.max(0,SHOP_BOOST_DAILY_LIMIT-shopBoostBoughtToday(s,now));}
export function recordShopBoost(s:Save,now=Date.now()){
 const w=potionWorkshopOf(s),date=todayKey(new Date(now));
 if(w.date!==date){w.date=date;w.bought=0;}
 w.bought=Math.min(1000,w.bought+1);
}
export function workshopRecipe(id:number){return WORKSHOP_RECIPES.find(r=>r.id===id);}
