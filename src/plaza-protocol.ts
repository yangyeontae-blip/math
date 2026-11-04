import {isBlockedNickname} from './nickname';
export const PLAZA_VERSION = 1;
export const PLAZA_ROOM = 'central-plaza-v1';
export const PLAZA_CAPACITY = 128;
export const AVATAR_LIMITS = {character:4,outfit:29,weapon:36,hairstyle:10,face:14,pet:21,ride:19} as const;
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
 job:keyof typeof JOB_TITLES; rank:number; achievement:number; gradeTitle:number; multiplicationTitle:boolean;
}
export interface PlazaPose {x:number;y:number;z:number;angle:number}
export interface PlazaPlayer {id:string;profile:PlazaProfile;pose:PlazaPose}
const integer=(v:unknown,lo:number,hi:number):v is number=>Number.isSafeInteger(v)&&Number(v)>=lo&&Number(v)<=hi;
export function parsePlazaProfile(value:unknown):PlazaProfile|null {
 if(!value||typeof value!=='object')return null;
 const p=value as Record<string,unknown>;
 if(typeof p.nickname!=='string'||p.nickname!==p.nickname.trim()||![...p.nickname].length||[...p.nickname].length>10||/[\u0000-\u001f\u007f<>]/.test(p.nickname)||isBlockedNickname(p.nickname)||!integer(p.level,1,100000))return null;
 if(typeof p.job!=='string'||!Object.hasOwn(JOB_TITLES,p.job)||!integer(p.rank,0,3)||!integer(p.achievement,0,ADVENTURE_TITLES.length-1)||!integer(p.gradeTitle,0,6)||typeof p.multiplicationTitle!=='boolean'||!integer(p.outfitLevel,0,3)||!integer(p.weaponLevel,0,3))return null;
 const result={nickname:p.nickname,level:p.level,job:p.job,rank:p.rank,achievement:p.achievement,gradeTitle:p.gradeTitle,multiplicationTitle:p.multiplicationTitle,outfitLevel:p.outfitLevel,weaponLevel:p.weaponLevel} as PlazaProfile;
 for(const [key,count] of Object.entries(AVATAR_LIMITS)){const id=p[key],min=key==='pet'||key==='ride'?-1:0;if(!integer(id,min,count-1))return null;(result as unknown as Record<string,unknown>)[key]=id;}
 return result;
}
export function profileTitles(p:PlazaProfile) {
 const job=JOB_TITLES[p.job][p.rank];
 const special=p.pet===20?'뽀짝이의 수호자':p.gradeTitle?p.gradeTitle+'학년 수학 탐험가':p.achievement?ADVENTURE_TITLES[p.achievement]:p.multiplicationTitle?'곱셈숲 탐험가':'';
 return {nickname:p.nickname,title:job+(special?' · '+special:''),legendary:p.pet===20};
}
export function parsePlazaPose(value:unknown):PlazaPose|null {
 if(!value||typeof value!=='object')return null;const p=value as PlazaPose;
 if(![p.x,p.y,p.z,p.angle].every(Number.isFinite))return null;
 return {x:Math.max(-23.4,Math.min(23.4,p.x)),y:Math.max(0,Math.min(7,p.y)),z:Math.max(-18.4,Math.min(18.4,p.z)),angle:Math.atan2(Math.sin(p.angle),Math.cos(p.angle))};
}
export function parsePlazaPlayer(value:unknown):PlazaPlayer|null {
 if(!value||typeof value!=='object')return null;const v=value as PlazaPlayer,profile=parsePlazaProfile(v.profile),pose=parsePlazaPose(v.pose);
 return typeof v.id==='string'&&/^[a-f0-9-]{36}$/.test(v.id)&&profile&&pose?{id:v.id,profile,pose}:null;
}
export function isPlazaEmote(value:unknown):value is PlazaEmote{return typeof value==='string'&&Object.hasOwn(PLAZA_EMOTES,value);}
