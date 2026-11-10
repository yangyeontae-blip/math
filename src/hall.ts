import {isBlockedNickname} from './nickname';import {sha256Hex} from './sha256';
export type HallMetric='level'|'berries';
export type HallReport={id:string;nickname:string;level:number;berries:number;eligible:boolean};
export type HallEntry={nickname:string;level:number;berries:number;rank:number;updatedAt:number};
export type HallBoard={metric:HallMetric;entries:HallEntry[];mine:HallEntry|null;updatedAt:number};
export const hallId=(id:string)=>sha256Hex('berry-hall:'+id);
/** 명예의 전당에 보여 주는 최대 인원. 서버가 옛 버전이면 50명만 와도 그대로 보여요. */
export const HALL_BOARD_SIZE=200;
/** 내 기록이 목록에 없을 때 아이가 이유를 알 수 있게 알려 줘요. */
export function hallMissingReason(nickname:string,excluded:boolean):string{
 if(excluded)return '운영자와 수업 시연 캐릭터는 순위에서 제외돼요.';
 if(isBlockedNickname(nickname))return '지금 닉네임은 명예의 전당에 올릴 수 없어요. 상점거리의 비밀상인에게 닉네임을 바꾸면 올라가요.';
 return '아직 내 기록이 올라가지 않았어요. 숲이나 광장을 잠깐 돌아다닌 뒤 새로고침해 주세요.';
}
export function validHallReport(v:unknown):v is HallReport{const r=v as HallReport;return !!r&&typeof r.id==='string'&&/^[a-f0-9-]{36}$/.test(r.id)&&typeof r.nickname==='string'&&r.nickname===r.nickname.trim()&&[...r.nickname].length>=1&&[...r.nickname].length<=10&&!/[<>\u0000-\u001f\u007f]/.test(r.nickname)&&!isBlockedNickname(r.nickname)&&Number.isSafeInteger(r.level)&&r.level>=1&&r.level<=100000&&Number.isSafeInteger(r.berries)&&r.berries>=0&&r.berries<=1e9&&typeof r.eligible==='boolean';}
