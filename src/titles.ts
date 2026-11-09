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


export type TitleId = 'level-50'|'level-100'|'level-300'|'ppojjaki'|'multiplication'|`grade-${number}`|`expedition-${number}`;
export type TitleStyle = 'leaf'|'star'|'divine'|'pet'|'study'|'explorer';
export type TitleDefinition = {id:TitleId;name:string;style:TitleStyle;icon:string;requirement:string;level?:number;grade?:number;expeditions?:number};
export const TITLES:readonly TitleDefinition[] = [
 {id:'level-50',name:'베리숲 지킴이',style:'leaf',icon:'🍃',requirement:'레벨 50 달성',level:50},
 {id:'level-100',name:'베리숲의 전설',style:'star',icon:'✦',requirement:'레벨 100 달성',level:100},
 {id:'level-300',name:'베리숲 신',style:'divine',icon:'✧',requirement:'레벨 300 달성',level:300},
 {id:'ppojjaki',name:'뽀짝이의 수호자',style:'pet',icon:'🐾',requirement:'귀염둥이 뽀짝이와 동행 중'},
 ...EXPEDITION_TITLES.map((t,i)=>({id:('expedition-'+i) as TitleId,name:t.name,style:'explorer' as const,icon:'🌿',requirement:'원정 '+t.need+'회 완수',expeditions:t.need})),
 ...Array.from({length:6},(_,i)=>({id:('grade-'+(i+1)) as TitleId,name:(i+1)+'학년 수학 탐험가',style:'study' as const,icon:'📚',requirement:(i+1)+'학년 학습 졸업 보상 받기',grade:i+1})),
 {id:'multiplication',name:'곱셈숲 탐험가',style:'study',icon:'✖',requirement:'곱셈숲 완수'},
];
export function titleDefinition(id:unknown){return typeof id==='string'?TITLES.find(t=>t.id===id):undefined;}
export function titleAvailable(s:Save,t:TitleDefinition){
 if(t.level)return s.level>=t.level;
 if(t.grade)return s.grade===t.grade&&!!s.curriculum?.graduationClaimed;
 if(t.expeditions!==undefined)return (s.expedition?.completed??-1)>=t.expeditions;
 return t.id==='ppojjaki'?s.pet===20:!!s.multiplicationCompleted;
}
export function migratedTitle(s:Save):TitleId|null{
 const selected=s.expedition?.selectedTitle;
 if(selected>0){const t=titleDefinition('expedition-'+selected);if(t&&titleAvailable(s,t))return t.id;}
 if(s.pet===20)return 'ppojjaki';
 for(const id of ['level-300','level-100','level-50',('grade-'+s.grade),'multiplication']){
  const t=titleDefinition(id);if(t&&titleAvailable(s,t))return t.id;
 }
 return null;
}
export function activeTitle(s:Save){const t=titleDefinition(s.selectedTitleId);return t&&titleAvailable(s,t)?t:null;}
export function selectTitle(s:Save,id:TitleId|null){
 const t=titleDefinition(id);
 if(id!==null&&(!t||!titleAvailable(s,t)))throw Error('아직 사용할 수 없는 칭호예요.');
 s.selectedTitleId=id;
}
export function renderTitle(t:TitleDefinition|null){
 return t?'<span class="chosen-title title-'+t.style+'" data-title-id="'+t.id+'"><b aria-hidden="true">'+t.icon+'</b><span>'+t.name+'</span><i class="title-sparks" aria-hidden="true">'+Array.from({length:6},(_,i)=>'<i style="--spark:'+i+'">✦</i>').join('')+'</i></span>':'<span class="title-empty">칭호 없음</span>';
}
