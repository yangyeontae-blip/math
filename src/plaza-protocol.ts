import {titleDefinition,type TitleId} from './titles';
import {isBlockedNickname} from './nickname';
export const PLAZA_VERSION = 1;
export const PLAZA_ROOM = 'central-plaza-v1';
export const PLAZA_CAPACITY = 128;
export const PLAZA_AVATAR_CATALOG=3;
export const AVATAR_LIMITS = {character:4,outfit:32,weapon:39,hairstyle:13,face:17,pet:24,ride:24} as const;
export const JOB_TITLES = {
 novice:['새싹 모험가','새싹 모험가','새싹 모험가','새싹 모험가'],
 knight:['새싹 모험가','기사','수호기사','고대숲 기사'],
 mage:['새싹 모험가','마법사','마도사','별빛 현자'],
 ranger:['새싹 모험가','궁수','레인저','폭풍의 궁수'],
} as const;
export const ADVENTURE_TITLES = ['모험가','첫 발자국','숲길 길잡이','반짝임 수집가','별사탕 해결사','별빛 탐험가','달빛 개척자','해바라기 수호대','베리숲 수호자','두 숲의 전설','영원한 별빛 영웅'] as const;
export const PLAZA_EMOTES = {wave:'안녕! 👋',heart:'반가워! 💛',cheer:'멋지다! ✨',play:'함께 놀자! 🌿'} as const;
export type PlazaEmote = keyof typeof PLAZA_EMOTES;
export interface PlazaProfile {
 nickname:string; level:number; character:number; outfit:number; weapon:number;
 outfitLevel:number; weaponLevel:number; hairstyle:number; face:number; pet:number; ride:number;
 job:keyof typeof JOB_TITLES; rank:number; achievement:number; gradeTitle:number; multiplicationTitle:boolean; selectedTitleId?:TitleId|null;
}
/** Older web/app clients keep seeing the same friend, with a similar legacy model. */
export function compatiblePlazaProfile(p:PlazaProfile,catalog:number|undefined) {
 if (catalog === PLAZA_AVATAR_CATALOG) return p;
 const classicLook = p.hairstyle < 10 && p.face < 14;
 const classicGear = p.weapon < 36 && p.outfit < 29 && p.pet < 21 && p.ride < 19;
 if (classicLook && (catalog === 2 || classicGear)) return p;
 const look = { ...p, hairstyle: p.hairstyle < 10 ? p.hairstyle : 0, face: p.face < 14 ? p.face : 0 };
 if (catalog === 2 || classicGear) return look;
 return { ...look, weapon:p.weapon<36?p.weapon:33+p.weapon-36, outfit:p.outfit<29?p.outfit:26+p.outfit-29, pet:p.pet<21?p.pet:([1,0,12][p.pet-21]??-1), ride:p.ride<19?p.ride:([1,3,7,17,6][p.ride-19]??-1) };
}
export const PLAZA_TITLE_CATALOG=2;
export function compatibleTitleProfile(p:PlazaProfile,catalog=1):PlazaProfile{const legacy=catalog<2&&(p.selectedTitleId==='level-500'||p.selectedTitleId==='level-1000')?{...p,selectedTitleId:'level-300' as TitleId}:p;return catalog<2&&!parsePlazaProfile(legacy)?{...legacy,selectedTitleId:null}:legacy;}
export function forestLevelTitle(level:number) {
 if(level>=1000)return '베리숲 회장';
 if(level>=500)return '베리숲 정령';
 if (level >= 300) return '베리숲 신';
 if (level >= 100) return '베리숲의 전설';
 if (level >= 50) return '베리숲 지킴이';
 return '';
}
export interface PlazaPose {x:number;y:number;z:number;angle:number}
export interface PlazaPlayer {id:string;profile:PlazaProfile;pose:PlazaPose;role?:'player'|'operator'}
const integer=(v:unknown,lo:number,hi:number):v is number=>Number.isSafeInteger(v)&&Number(v)>=lo&&Number(v)<=hi;
export function parsePlazaProfile(value:unknown,operator=false):PlazaProfile|null {
 if(!value||typeof value!=='object')return null;
 const p=value as Record<string,unknown>;
 if(typeof p.nickname!=='string'||p.nickname!==p.nickname.trim()||![...p.nickname].length||[...p.nickname].length>10||/[\u0000-\u001f\u007f<>]/.test(p.nickname)||isBlockedNickname(p.nickname)||!integer(p.level,1,100000))return null;
 if(typeof p.job!=='string'||!Object.hasOwn(JOB_TITLES,p.job)||!integer(p.rank,0,3)||!integer(p.achievement,0,ADVENTURE_TITLES.length-1)||!integer(p.gradeTitle,0,6)||typeof p.multiplicationTitle!=='boolean'||!integer(p.outfitLevel,0,3)||!integer(p.weaponLevel,0,3))return null;
 const result={nickname:p.nickname,level:p.level,job:p.job,rank:p.rank,achievement:p.achievement,gradeTitle:p.gradeTitle,multiplicationTitle:p.multiplicationTitle,outfitLevel:p.outfitLevel,weaponLevel:p.weaponLevel} as PlazaProfile;
 for(const [key,count] of Object.entries(AVATAR_LIMITS)){const id=p[key],min=key==='pet'||key==='ride'?-1:0;if(!integer(id,min,count-1))return null;(result as unknown as Record<string,unknown>)[key]=id;}
 if(p.selectedTitleId!==undefined){const t=titleDefinition(p.selectedTitleId);if(p.selectedTitleId!==null&&!t)return null;if(!operator&&(t?.level&&Number(p.level)<t.level||t?.id==='ppojjaki'&&p.pet!==20||t?.grade&&p.gradeTitle!==t.grade||t?.id==='multiplication'&&!p.multiplicationTitle))return null;result.selectedTitleId=p.selectedTitleId as TitleId|null;}
 return result;
}
export function profileTitles(p:PlazaProfile) {
 const legacy=p.pet===20?'ppojjaki':p.achievement?'expedition-'+p.achievement:p.level>=1000?'level-1000':p.level>=500?'level-500':p.level>=300?'level-300':p.level>=100?'level-100':p.level>=50?'level-50':p.gradeTitle?'grade-'+p.gradeTitle:p.multiplicationTitle?'multiplication':null;
 const definition=titleDefinition(p.selectedTitleId===undefined?legacy:p.selectedTitleId);
 return {nickname:p.nickname,title:definition?.name??'',legendary:definition?.id==='ppojjaki',definition:definition??null};
}
export function parsePlazaPose(value:unknown,forest=false):PlazaPose|null {
 if(!value||typeof value!=='object')return null;const p=value as PlazaPose;
 if(![p.x,p.y,p.z,p.angle].every(Number.isFinite))return null;
 return {x:Math.max(forest?-48:-23.4,Math.min(forest?48:23.4,p.x)),y:Math.max(0,Math.min(7,p.y)),z:Math.max(forest?-45:-18.4,Math.min(forest?45:18.4,p.z)),angle:Math.atan2(Math.sin(p.angle),Math.cos(p.angle))};
}
export function parsePlazaPlayer(value:unknown,forest=false):PlazaPlayer|null {
 if(!value||typeof value!=='object')return null;const v=value as PlazaPlayer,profile=parsePlazaProfile(v.profile,v.role==='operator'),pose=parsePlazaPose(v.pose,forest);
 return typeof v.id==='string'&&/^[a-f0-9-]{36}$/.test(v.id)&&profile&&pose?{id:v.id,profile,pose,...(v.role==='operator'?{role:'operator' as const}:{})}:null;
}
export function isPlazaEmote(value:unknown):value is PlazaEmote{return typeof value==='string'&&Object.hasOwn(PLAZA_EMOTES,value);}
