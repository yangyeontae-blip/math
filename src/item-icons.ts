import {ITEM_ICON_PATHS} from './item-icon-paths';
export type ItemIconKind=keyof typeof ITEM_ICON_PATHS;
/** Decorative artwork accompanies the existing item name and never changes catalogue/save data. */
export function itemIcon(kind:ItemIconKind,id:number){
 const path=Number.isInteger(id)&&id>=0?ITEM_ICON_PATHS[kind]?.[id]:undefined;
 if(!path)return '';
 const legacy=path.includes('/skyward-')||path.includes('/dawn-');
 return `<img class="catalog-item-icon${legacy?' skyward-item-icon':''}${path.includes('/dawn-')?' dawn-item-icon':''}" src="${import.meta.env?.BASE_URL??'./'}${path}" alt="" aria-hidden="true" width="64" height="64" decoding="async" draggable="false" data-item-icon-kind="${kind}" data-item-icon-id="${id}">`;
}
