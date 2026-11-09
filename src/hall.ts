import {isBlockedNickname} from './nickname';import {sha256Hex} from './sha256';
export type HallMetric='level'|'berries';
export type HallReport={id:string;nickname:string;level:number;berries:number;eligible:boolean};
export type HallEntry={nickname:string;level:number;berries:number;rank:number;updatedAt:number};
export type HallBoard={metric:HallMetric;entries:HallEntry[];mine:HallEntry|null;updatedAt:number};
export const hallId=(id:string)=>sha256Hex('berry-hall:'+id);
export function validHallReport(v:unknown):v is HallReport{const r=v as HallReport;return !!r&&typeof r.id==='string'&&/^[a-f0-9-]{36}$/.test(r.id)&&typeof r.nickname==='string'&&r.nickname===r.nickname.trim()&&[...r.nickname].length>=1&&[...r.nickname].length<=10&&!/[<>\u0000-\u001f\u007f]/.test(r.nickname)&&!isBlockedNickname(r.nickname)&&Number.isSafeInteger(r.level)&&r.level>=1&&r.level<=100000&&Number.isSafeInteger(r.berries)&&r.berries>=0&&r.berries<=1e9&&typeof r.eligible==='boolean';}
