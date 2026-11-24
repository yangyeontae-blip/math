import {ITEM_ICON_PATHS} from './item-icon-paths';
export type ItemIconKind=keyof typeof ITEM_ICON_PATHS;
const PAINTED=new Set<string>(['weapon','outfit','ride','pet','potion']);
/** Decorative artwork accompanies the existing item name and never changes catalogue/save data. */
export function itemIcon(kind:ItemIconKind,id:number){
 const old=Number.isInteger(id)&&id>=0?ITEM_ICON_PATHS[kind]?.[id]:undefined;
 if(!old)return '';
 // 2026-11-24 무기·옷·탈것·펫·물약은 Codex 수채화 아이콘(berry-items-v3)으로 바꿨다.
 const path=PAINTED.has(kind)?`art/berry-items-v3/${kind}-${id}.webp`:old;
 const legacy=old.includes('/skyward-')||old.includes('/dawn-');
 return `<img class="catalog-item-icon${legacy?' skyward-item-icon':''}${old.includes('/dawn-')?' dawn-item-icon':''}" src="${import.meta.env?.BASE_URL??'./'}${path}" alt="" aria-hidden="true" width="64" height="64" decoding="async" draggable="false" data-item-icon-kind="${kind}" data-item-icon-id="${id}">`;
}
