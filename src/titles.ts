import {operatorAccess} from './operator-access';
import type {Save} from './rules';

export const EXPEDITION_TITLES = [
  { name: '모험가', need: 0 },
  { name: '첫 발자국', need: 1 },
  { name: '숲길 길잡이', need: 3 },
  { name: '반짝임 수집가', need: 5 },
  { name: '별사탕 해결사', need: 7 },
  { name: '별빛 탐험가', need: 10 },
  { name: '달빛 개척자', need: 15 },
  { name: '해바라기 수호대', need: 20 },
  { name: '베리숲 수호자', need: 30 },
  { name: '두 숲의 전설', need: 50 },
  { name: '영원한 별빛 영웅', need: 100 },
] as const;


export type TitleId = 'math-friend'|'level-50'|'level-100'|'level-300'|'level-500'|'level-1000'|'level-2000'|'ppojjaki'|'multiplication'|`grade-${number}`|`expedition-${number}`|'rich-1m'|'rich-10m'|'rich-100m';
export type TitleStyle = 'leaf'|'star'|'divine'|'pet'|'study'|'explorer'|'wealth';
export type TitleDefinition = {id:TitleId;name:string;style:TitleStyle;icon:string;requirement:string;level?:number;grade?:number;expeditions?:number;berries?:number};
export const TITLES:readonly TitleDefinition[] = [
 {id:'level-50',name:'베리숲 지킴이',style:'leaf',icon:'🍃',requirement:'레벨 50 달성',level:50},
 {id:'level-100',name:'베리숲의 전설',style:'star',icon:'✦',requirement:'레벨 100 달성',level:100},
 {id:'level-300',name:'베리숲 신',style:'divine',icon:'✧',requirement:'레벨 300 달성',level:300},
 {id:'level-500',name:'베리숲 정령',style:'divine',icon:'🧚',requirement:'레벨 500 달성',level:500},
 {id:'level-1000',name:'베리숲 회장',style:'star',icon:'♛',requirement:'레벨 1,000 달성',level:1000},
 {id:'level-2000',name:'베리의 숲 VIP',style:'divine',icon:'💎',requirement:'레벨 2,000 달성',level:2000},
 {id:'ppojjaki',name:'뽀짝이의 수호자',style:'pet',icon:'🐾',requirement:'귀염둥이 뽀짝이와 동행 중'},
 ...EXPEDITION_TITLES.map((t,i)=>({id:('expedition-'+i) as TitleId,name:t.name,style:'explorer' as const,icon:'🌿',requirement:'원정 '+t.need+'회 완수',expeditions:t.need})),
 ...Array.from({length:6},(_,i)=>({id:('grade-'+(i+1)) as TitleId,name:(i+1)+'학년 수학 탐험가',style:'study' as const,icon:'📚',requirement:(i+1)+'학년 학습 졸업 보상 받기',grade:i+1})),
 {id:'multiplication',name:'곱셈숲 탐험가',style:'study',icon:'✖',requirement:'곱셈숲 완수'},
 {id:'math-friend',name:'수학자의 벗',style:'study',icon:'✦',requirement:'수학자 카드 24장 모두 모으기'},
 {id:'rich-1m',name:'백만장자',style:'wealth',icon:'🪙',requirement:'베리 1,000,000개 모으기',berries:1_000_000},
 {id:'rich-10m',name:'천만장자',style:'wealth',icon:'🪙',requirement:'베리 10,000,000개 모으기',berries:10_000_000},
 {id:'rich-100m',name:'억만장자',style:'wealth',icon:'🪙',requirement:'베리 100,000,000개 모으기',berries:100_000_000},
];
export function titleDefinition(id:unknown){return typeof id==='string'?TITLES.find(t=>t.id===id):undefined;}
export function titleAvailable(s:Save,t:TitleDefinition){
 if(operatorAccess())return true;
 if(t.level)return s.level>=t.level;
 if(t.berries)return s.berries>=t.berries;
 if(t.grade)return s.grade===t.grade&&!!s.curriculum?.graduationClaimed;
 if(t.expeditions!==undefined)return (s.expedition?.completed??-1)>=t.expeditions;
 if(t.id==='math-friend')return !!s.fishing?.completed;
 return t.id==='ppojjaki'?s.pet===20:!!s.multiplicationCompleted;
}
export function migratedTitle(s:Save):TitleId|null{
 const selected=s.expedition?.selectedTitle;
 if(selected>0){const t=titleDefinition('expedition-'+selected);if(t&&titleAvailable(s,t))return t.id;}
 if(s.pet===20)return 'ppojjaki';
 for(const id of ['level-2000','level-1000','level-500','level-300','level-100','level-50',('grade-'+s.grade),'multiplication']){
  const t=titleDefinition(id);if(t&&titleAvailable(s,t))return t.id;
 }
 return null;
}
export function activeTitle(s:Save){const t=titleDefinition(s.selectedTitleId);return t&&titleAvailable(s,t)?t:null;}
/** One equipped, earned title grants one bonus. Merely owning titles never stacks effects. */
export function titleEffect(s:Save){
 const t=activeTitle(s);
 if(!t||t.id==='expedition-0')return {attack:1,berries:1,label:'칭호 능력 효과 없음'};
 const bonus=t.style==='explorer'?Math.min(.15,(t.expeditions??0)*.005):t.style==='wealth'?({'rich-1m':.05,'rich-10m':.1,'rich-100m':.15} as Record<string,number>)[t.id]??.05:t.style==='divine'?.15:t.style==='star'?.1:.05;
 return {attack:1+bonus,berries:1+bonus,label:`사냥 공격력·사냥 베리 +${Math.round(bonus*100)}%`};
}
export function selectTitle(s:Save,id:TitleId|null){
 const t=titleDefinition(id);
 if(id!==null&&(!t||!titleAvailable(s,t)))throw Error('아직 사용할 수 없는 칭호예요.');
 s.selectedTitleId=id;if(t?.id.startsWith('expedition-')&&s.expedition.completed>=(t.expeditions??0))s.expedition.selectedTitle=Number(t.id.slice(11));
}
export type TitleTheme = 'leaf'|'astral'|'divine'|'spirit'|'royal'|'pet'|'study'|'explorer'|'scholar'|'wealth'|'vip';
export function titleTheme(t:TitleDefinition):TitleTheme {
 if(t.id==='level-2000')return 'vip';
 if(t.id==='level-1000')return 'royal';
 if(t.id==='level-500')return 'spirit';
 if(t.id==='math-friend')return 'scholar';
 return t.style==='star'?'astral':t.style;
}
export function titleThemeLabel(t:TitleDefinition){return {
 leaf:'생명의 잎사귀와 초록빛 수호진',astral:'보라·금빛 별자리와 유성',divine:'무지개빛 성환과 빛의 날개',
 spirit:'민트빛 정령불과 달빛 고리',royal:'황금 왕관과 로열 별빛',pet:'살구빛 발자국과 꽃잎',
 study:'푸른 지혜의 문양',wealth:'황금 동전과 산딸기 보석',vip:'산딸기 보석 왕관과 금빛 리본',explorer:'황금 나침반과 숲빛 궤적',scholar:'오로라 책갈피와 지혜의 별',
 }[titleTheme(t)];}
function titleCrest(t:TitleDefinition){
 const shapes:Record<TitleTheme,string>={
  leaf:'<path d="M19 4C8 3 3 9 6 16s14 3 13-12Z"/><path d="m6 20 9-11m-6 7-1-5m5 1 4 1"/>',
  astral:'<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/><path d="m20 3 .7 1.8L22 5.5l-1.3.7L20 8l-.7-1.8-1.3-.7 1.3-.7Z"/>',
  divine:'<ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-24 12 12)"/><path d="m12 3 3.3 9L12 21l-3.3-9Z"/><circle cx="12" cy="12" r="2"/>',
  spirit:'<path d="M12 3c-1 5-6 7-6 12a6 6 0 0 0 12 0c0-3-1-5-3-7 0 4-2 5-3 3s-1-5 0-8Z"/><path d="M10 19c-2-3 1-5 2-6 0 3 3 3 2 6"/>',
  royal:'<path d="m3 7 4 4 5-7 5 7 4-4-2 12H5Z"/><path d="M5 16h14M9 12v2m6-2v2"/><circle cx="3" cy="6" r="1"/><circle cx="12" cy="3" r="1"/><circle cx="21" cy="6" r="1"/>',
  pet:'<ellipse cx="5" cy="9" rx="2" ry="3"/><ellipse cx="10" cy="5.5" rx="2" ry="3"/><ellipse cx="15.5" cy="6" rx="2" ry="3"/><ellipse cx="20" cy="10" rx="2" ry="3"/><path d="M7 15c2-5 7-5 10 0 5 6-1 7-5 5-4 2-10 0-5-5Z"/>',
  study:'<path d="M12 6C8 3 5 4 3 5v14c4-2 6-1 9 1 3-2 5-3 9-1V5c-2-1-5-2-9 1Zm0 0v14M6 8l3 1M6 12l3 1m6-4 3-1m-3 5 3-1"/>',
  explorer:'<circle cx="12" cy="12" r="9"/><path d="m16 7-2 7-7 3 3-7Z"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2"/>',
  vip:'<path d="M6 4h12l4 5-10 12L2 9Z"/><path d="M2 9h20M9 4l3 5 3-5M7.5 9 12 21l4.5-12"/>',
  wealth:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M12 8.5c-2 0-3 1-3 2.2 0 2.6 3 2.6 3 4.8m0-7c1.6 0 2.6.7 2.9 1.8M12 15.5c-1.4 0-2.6-.6-3-1.6M12 6.8v1.7m0 7v1.7"/>',
  scholar:'<path d="M12 9c-4-3-7-3-10-2v13c4-1 7 0 10 2 3-2 6-3 10-2V7c-3-1-6-1-10 2Zm0 0v13"/><path d="m12 1 1.2 3.2 3.3 1.3-3.3 1.2L12 10l-1.2-3.3-3.3-1.2 3.3-1.3Z"/>',
 };
 return '<svg class="title-crest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">'+shapes[titleTheme(t)]+'</svg>';
}
export function renderTitle(t:TitleDefinition|null){
 return t?'<span class="chosen-title title-'+t.style+'" data-title-id="'+t.id+'" data-title-theme="'+titleTheme(t)+'"><b aria-hidden="true">'+titleCrest(t)+'</b><span class="title-word">'+t.name+'</span><i class="title-sparks" aria-hidden="true">'+Array.from({length:6},(_,i)=>'<i style="--spark:'+i+'">✦</i>').join('')+'</i></span>':'<span class="title-empty">칭호 없음</span>';
}
