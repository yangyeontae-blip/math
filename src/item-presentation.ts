import {WEAPONS,OUTFITS,RIDES,PETS,huntingPower,type Save} from './rules';
import {itemRarity} from './item-rarity';
import {itemIcon,type ItemIconKind} from './item-icons';
import {uiIcon} from './ui-icons';

type EquipmentKind=Exclude<ItemIconKind,'potion'>;
const catalog={weapon:WEAPONS,outfit:OUTFITS,ride:RIDES,pet:PETS};
export function itemSlotAttributes(kind:EquipmentKind,id:number){
  return `data-slot-rarity="${itemRarity(kind,id,catalog[kind][id].price).id}"`;
}
export function itemSlotArt(kind:EquipmentKind,id:number,level=0,active=false){
  return `${itemIcon(kind,id)}${level>0?`<span class="equipment-upgrade" aria-label="강화 ${level}단계">+${level}</span>`:''}${active?`<span class="equipment-worn" aria-label="장착 중">${uiIcon('shield')}</span>`:''}`;
}
function difference(label:string,value:number,current:number,digits=0){
  const delta=Number((value-current).toFixed(digits)),sign=delta>0?'up':delta<0?'down':'same';
  return `<span class="equipment-delta ${sign}" title="현재 장비 대비 ${label} ${delta>0?'+':''}${delta}">${label} ${delta===0?'—':`${delta>0?'↑':'↓'}${Math.abs(delta).toFixed(digits)}`}</span>`;
}
/** Presentation only. Each comparison uses the actual equipped level and existing rule formulas. */
export function itemComparison(s:Save,kind:EquipmentKind,id:number){
  if(s[kind]===id)return '<span class="equipment-current">현재 장비</span>';
  let text='';
  if(kind==='weapon'){
    const item=WEAPONS[id],current=WEAPONS[s.weapon];
    text=difference('공격',huntingPower({...s,weapon:id}),huntingPower(s))+difference('보상 베리',item.bonus,current.bonus);
  }else if(kind==='outfit'){
    const item=OUTFITS[id],current=OUTFITS[s.outfit];
    text=difference('길 베리',item.berryBonus,current.berryBonus)+difference('경험치',item.xpBonus,current.xpBonus)+difference('통과 베리',item.clearBonus,current.clearBonus);
  }else if(kind==='ride')text=difference('속도',RIDES[id].speed,s.ride>=0?RIDES[s.ride].speed:1,2);
  else text=difference('탐색',PETS[id].radius,s.pet>=0?PETS[s.pet].radius:0,1);
  return `<span class="equipment-comparison" aria-label="현재 장비 대비">${text}</span>`;
}
export function itemCardMeta(s:Save,kind:EquipmentKind,id:number,owned:boolean,source=''){
  const active=s[kind]===id;
  const status=active?'장착 중':owned?'보유 중':source?'보상 장비':'구매 가능';
  return `<span class="equipment-status ${active?'equipped':''}">${active?uiIcon('shield'):''}${status}</span><span class="equipment-price">${uiIcon(source?'lock':'berry')}${source||`${catalog[kind][id].price.toLocaleString()}베리`}</span>${itemComparison(s,kind,id)}`;
}
