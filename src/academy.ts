export type JobId = 'knight' | 'mage' | 'ranger';
export type SkillId = 'shield' | 'wind' | 'lantern' | 'crescent' | 'charge' | 'roots' | 'guardian' | 'starbolt' | 'frost' | 'vortex' | 'starfall' | 'arrow' | 'pierce' | 'trap' | 'storm';
export const ACADEMY_KEY='berry-forest-academy-v1';
const COMMON_SKILLS = [
 {id:'shield',key:'1',icon:'🌿',name:'잎새 방패',subtitle:'숲의 숨결을 두르다',description:'6초 동안 받는 피해를 절반으로 줄여요.',lesson:'잎사귀를 몸 주위에 펼쳐 공격을 막아요. 몬스터의 공격 표시를 보고 방패를 펼쳐 보세요.',trial:'방패를 펼치고 수련실에서 3초 동안 유지해 보세요.',duration:6,cooldown:20,color:'#77b38a'},
 {id:'wind',key:'2',icon:'🪽',name:'바람 걸음',subtitle:'한 줄기 바람처럼',description:'5초 동안 걸음이 1.6배 빨라져요. 벽과 물은 그대로 조심해야 해요.',lesson:'숲의 바람을 발끝에 모아 빠르게 달려요. 방향을 정한 뒤 사용하고, 움직이며 바람의 길을 느껴 보세요.',trial:'바람 걸음을 쓰고 수련실에서 3걸음 이상 이동해 보세요.',duration:5,cooldown:12,color:'#79bed3'},
 {id:'lantern',key:'3',icon:'🏮',name:'길잡이 등불',subtitle:'다음 발견을 비추다',description:'15초 동안 현재 숲의 발견 장소나 다음 탐험 대상으로 길을 안내해요.',lesson:'등불은 정답 대신 길을 알려줘요. 숲에서는 발견 장소·몬스터·출구를, 학교에서는 배움의 서가를 찾아가요.',trial:'등불을 켜고 안내를 따라 배움의 서가 가까이 가 보세요.',duration:15,cooldown:20,color:'#dbb968'},
] as const;
export const JOB_INFO = [
 {id:'knight',name:'숲 기사',icon:'🛡️',color:'#74a882',description:'가까이에서 친구를 지키는 든든한 기사'},
 {id:'mage',name:'별빛 마법사',icon:'✨',color:'#ab8cc6',description:'별과 서리의 힘으로 여러 적을 다루는 마법사'},
 {id:'ranger',name:'바람 궁수',icon:'🏹',color:'#6eb8b2',description:'거리를 두고 활과 덫을 사용하는 궁수'},
] as const;
export interface SkillDefinition {id:SkillId;key:string;icon:string;name:string;subtitle:string;description:string;lesson:string;trial:string;duration:number;cooldown:number;color:string;job:JobId|null;rank:0|1|2|3;power:number}
const combatSkill=(id:SkillId,job:JobId,rank:1|2|3,name:string,icon:string,power:number,cooldown:number,duration:number,description:string):SkillDefinition=>({id,job,rank,name,icon,power,cooldown,duration,key:String(rank+1),subtitle:JOB_INFO.find(j=>j.id===job)!.name,description,lesson:description,trial:'수련실에서 이 스킬을 사용해 허수아비를 맞혀 보세요.',color:JOB_INFO.find(j=>j.id===job)!.color});
export const ACADEMY_SKILLS:readonly SkillDefinition[]=[
 ...COMMON_SKILLS.map(s=>({...s,job:null,rank:0 as const,power:0,...(s.id==='shield'?{duration:6,description:'6초 동안 받는 피해를 절반으로 줄여요.'}:s.id==='lantern'?{cooldown:20}:{})})),
 combatSkill('crescent','knight',1,'초승달 베기','🌙',1.8,5,.4,'앞쪽 적에게 공격력의 1.8배 피해를 줘요.'),
 combatSkill('charge','knight',1,'방패 돌진','🛡️',1.2,8,.4,'앞쪽 적에게 1.2배 피해를 주고 밀어내요.'),
 combatSkill('roots','knight',2,'뿌리 강타','🌳',2.2,12,2,'주변 적에게 2.2배 피해를 주고 2초 동안 묶어요.'),
 combatSkill('guardian','knight',3,'숲의 수호','🌿',0,30,8,'8초 동안 피해를 40% 줄이고 기본 공격을 30% 강화해요.'),
 combatSkill('starbolt','mage',1,'별빛 탄환','⭐',1.8,4,.4,'앞쪽 적 하나에게 별빛으로 1.8배 피해를 줘요.'),
 combatSkill('frost','mage',1,'서리꽃','❄️',1.2,9,2,'주변 적에게 1.2배 피해를 주고 2초 동안 얼려요.'),
 combatSkill('vortex','mage',2,'불꽃 소용돌이','🌀',3,14,4,'4초 동안 주변 적에게 총 3배의 피해를 줘요.'),
 combatSkill('starfall','mage',3,'별비','🌠',4,30,3,'3초 동안 주변에 별비가 내려 총 4배의 피해를 줘요.'),
 combatSkill('arrow','ranger',1,'바람 화살','🏹',1.6,4,.4,'앞쪽 적 하나에게 1.6배 피해를 줘요.'),
 combatSkill('pierce','ranger',1,'관통 사격','➶',1.5,7,.4,'일직선의 적 최대 셋에게 1.5배 피해를 줘요.'),
 combatSkill('trap','ranger',2,'덩굴 덫','🪴',1,12,3,'다가온 적에게 1배 피해를 주고 주변 적을 3초 동안 묶어요.'),
 combatSkill('storm','ranger',3,'폭풍 화살','🍃',4,25,2,'2초 동안 주변 적에게 총 4배 피해를 줘요.'),
];
export type CareerRank=0|1|2|3;
export type SkillLoadout=[SkillId|null,SkillId|null,SkillId|null,SkillId|null];
export type CareerProgress={version:1;location:{kind:'hunting';zone:number}|null;job:JobId|null;ranks:Record<JobId,CareerRank>;trials:Record<JobId,CareerRank>;learned:SkillId[];practiced:SkillId[];loadouts:Record<'novice'|JobId,SkillLoadout>;stats:{defeats:number;byZone:[number,number,number,number];totalBerries:number;totalXp:number;seen:string[]};daily:{date:string;counts:[number,number,number,number]};legacyImported:boolean};
export const isJob=(id:unknown):id is JobId=>JOB_INFO.some(j=>j.id===id);
export function emptyCareer():CareerProgress{return {version:1,location:null,job:null,ranks:{knight:0,mage:0,ranger:0},trials:{knight:0,mage:0,ranger:0},learned:[],practiced:[],loadouts:{novice:[null,null,null,null],knight:[null,null,null,null],mage:[null,null,null,null],ranger:[null,null,null,null]},stats:{defeats:0,byZone:[0,0,0,0],totalBerries:0,totalXp:0,seen:[]},daily:{date:'',counts:[0,0,0,0]},legacyImported:false};}
export function careerSkills(p:CareerProgress,level:number):SkillId[]{return p.learned.filter(id=>{const s=skillInfo(id);return !s.job||level>=[0,10,30,60][s.rank]&&p.job===s.job&&p.ranks[s.job]>=s.rank;});}
export function selectJob(p:CareerProgress,job:JobId|null,level:number){if(!Number.isFinite(level)||job!==null&&(!isJob(job)||level<10)||p.job===job)return false;p.job=job;return true;}
export function learnCareerSkill(p:CareerProgress,id:SkillId,level:number){const s=skillInfo(id);if(!s||s.job&&(p.job!==s.job||level<10||p.ranks[s.job]<s.rank))return false;return learnSkill(p,id);}
export function recordCareerTrial(p:CareerProgress,job:JobId,rank:CareerRank){if(!isJob(job)||p.job!==job||rank!==p.ranks[job]+1||rank>3||p.trials[job]>=rank)return false;p.trials[job]=rank;return true;}
export function advanceJob(p:CareerProgress,job:JobId,level:number){if(!isJob(job)||!Number.isFinite(level))return false;const rank=p.ranks[job]+1;if(p.job!==job||rank>3||level<[0,10,30,60][rank]||p.trials[job]<rank)return false;p.ranks[job]=rank as CareerRank;for(const s of ACADEMY_SKILLS)if(s.job===job&&s.rank<=rank)learnSkill(p,s.id);if(rank===1){learnSkill(p,'shield');learnSkill(p,'wind');}const allowed=careerSkills(p,level);if(rank===1||!p.loadouts[job].some(Boolean)){const ids=[...allowed.filter(id=>skillInfo(id).job===job),...allowed.filter(id=>!skillInfo(id).job)];p.loadouts[job]=[ids[0]??null,ids[1]??null,ids[2]??null,ids[3]??null];}return true;}
export function equipCareerSkill(p:CareerProgress,slot:number,id:SkillId|null,level:number){if(!Number.isInteger(slot)||slot<0||slot>3||id!==null&&!careerSkills(p,level).includes(id))return false;const slots=p.loadouts[p.job??'novice'];if(id!==null&&slots.some((s,i)=>s===id&&i!==slot))return false;slots[slot]=id;return true;}
export function validCareer(value:unknown):value is CareerProgress{const p=value as CareerProgress;const integer=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=1e9;const counts=(x:unknown):x is number[]=>Array.isArray(x)&&x.length===4&&x.every(integer);if(!p||p.location!==null&&(!p.location||p.location.kind!=='hunting'||!Number.isInteger(p.location.zone)||p.location.zone<0||p.location.zone>3)||!p.stats||!integer(p.stats.totalBerries)||!integer(p.stats.totalXp)||!Array.isArray(p.stats.seen)||p.stats.seen.some(id=>!['melee','charge','ranged'].includes(id))||new Set(p.stats.seen).size!==p.stats.seen.length||p.version!==1||p.job!==null&&!isJob(p.job)||!p.ranks||!p.trials||!p.loadouts||!Array.isArray(p.learned)||p.learned.some(id=>!isSkill(id))||new Set(p.learned).size!==p.learned.length||!Array.isArray(p.practiced)||p.practiced.some(id=>!p.learned.includes(id))||new Set(p.practiced).size!==p.practiced.length||typeof p.legacyImported!=='boolean'||!p.stats||!integer(p.stats.defeats)||!counts(p.stats.byZone)||p.stats.byZone.reduce((a,b)=>a+b,0)!==p.stats.defeats||!p.daily||typeof p.daily.date!=='string'||p.daily.date!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(p.daily.date)||!counts(p.daily.counts))return false;for(const job of ['knight','mage','ranger'] as const){if(![0,1,2,3].includes(p.ranks[job])||![0,1,2,3].includes(p.trials[job])||p.ranks[job]>p.trials[job])return false;}for(const job of ['novice','knight','mage','ranger'] as const){const slots=p.loadouts[job];if(!Array.isArray(slots)||slots.length!==4||slots.some(id=>id!==null&&(!isSkill(id)||!p.learned.includes(id)||skillInfo(id).job!==null&&skillInfo(id).job!==job))||new Set(slots.filter(Boolean)).size!==slots.filter(Boolean).length)return false;}return true;}
export type AcademyProgress={version:1;owner:string;learned:SkillId[];practiced:SkillId[]};
type Profile={nickname:string;grade:number;character:number};
type Store=Pick<Storage,'getItem'|'setItem'>;
export const skillInfo=(id:SkillId)=>ACADEMY_SKILLS.find(s=>s.id===id)!;
export const isSkill=(id:unknown):id is SkillId=>ACADEMY_SKILLS.some(s=>s.id===id);
const owner=(p:Profile)=>JSON.stringify([p.nickname,p.grade,p.character]);
export const emptyAcademy=(p:Profile):AcademyProgress=>({version:1,owner:owner(p),learned:[],practiced:[]});
export function readAcademy(store:Store,p:Profile):AcademyProgress{
 try{const x=JSON.parse(store.getItem(ACADEMY_KEY)||'null');if(x?.version!==1||x.owner!==owner(p)||!Array.isArray(x.learned)||!Array.isArray(x.practiced)||x.learned.some((id:unknown)=>!isSkill(id))||x.practiced.some((id:unknown)=>!isSkill(id)||!x.learned.includes(id)))return emptyAcademy(p);return {...x,learned:[...new Set<SkillId>(x.learned)],practiced:[...new Set<SkillId>(x.practiced)]};}catch{return emptyAcademy(p);}
}
export function saveAcademy(store:Store,p:AcademyProgress):boolean{try{store.setItem(ACADEMY_KEY,JSON.stringify(p));return true;}catch{return false;}}
export function learnSkill(p:Pick<AcademyProgress,'learned'>,id:SkillId):boolean{if(!isSkill(id)||p.learned.includes(id))return false;p.learned.push(id);return true;}
export function practiceSkill(p:Pick<AcademyProgress,'learned'|'practiced'>,id:SkillId):boolean{if(!p.learned.includes(id)||p.practiced.includes(id))return false;p.practiced.push(id);return true;}
/** Caller saves the integrated game first; the legacy source is intentionally never removed. */
export function migrateAcademy(store:Store,profile:Profile,p:CareerProgress):boolean{if(p.legacyImported)return false;let raw:unknown;try{raw=JSON.parse(store.getItem(ACADEMY_KEY)||'null');}catch{return false;}if(!raw||typeof raw!=='object'||(raw as AcademyProgress).owner!==owner(profile))return false;const old=readAcademy(store,profile);if((raw as AcademyProgress).version!==1||!Array.isArray((raw as AcademyProgress).learned)||old.learned.length!==(new Set((raw as AcademyProgress).learned)).size||!Array.isArray((raw as AcademyProgress).practiced)||(raw as AcademyProgress).practiced.some(id=>!isSkill(id)||!(raw as AcademyProgress).learned.includes(id)))return false;for(const id of old.learned)if(!skillInfo(id).job)learnSkill(p,id);for(const id of old.practiced)if(!skillInfo(id).job)practiceSkill(p,id);if(!p.loadouts.novice.some(Boolean))p.loadouts.novice=[p.learned.includes('shield')?'shield':null,p.learned.includes('wind')?'wind':null,p.learned.includes('lantern')?'lantern':null,null];p.legacyImported=true;return true;}
/** Simulation seconds only: modal pauses, hidden pages and wall-clock changes never spend skill time. */
export class SkillRuntime{
 private until:Partial<Record<SkillId,number>>={};private ready:Partial<Record<SkillId,number>>={};
 active(id:SkillId,now:number){return (this.until[id]??0)>now;}
 remaining(id:SkillId,now:number){return Math.max(0,(this.ready[id]??0)-now);}
 use(id:SkillId,now:number,learned:readonly SkillId[]){if(!Number.isFinite(now)||!learned.includes(id)||this.remaining(id,now)>0)return false;const s=skillInfo(id);this.until[id]=now+s.duration;this.ready[id]=now+s.cooldown;return true;}
 clear(){this.until={};}
 reset(){this.until={};this.ready={};}
}
export function trialComplete(id:SkillId,elapsed:number,distance:number,nearBook:boolean){return id==='shield'?elapsed>=3:id==='wind'?distance>=3:nearBook;}
export function academyHtml(p:AcademyProgress,tab:'learn'|'records'='learn'){
 return `<section class="academy-sheet"><div class="academy-heading"><small>THE BERRYFOREST ACADEMY</small><h3>${tab==='records'?'모험가의 수련 기록':'나만의 모험 스킬을 배워요'}</h3><p>배우고 · 연습하고 · 숲에서 써 보세요</p></div><div class="academy-cards">${ACADEMY_SKILLS.map(s=>`<article class="academy-card ${p.learned.includes(s.id)?'is-learned':''}" style="--skill-color:${s.color}"><span class="academy-sigil">${s.icon}</span><small>${s.subtitle}</small><h4>${s.name}</h4><p>${s.description}</p><span class="academy-badge">${p.practiced.includes(s.id)?'✦ 수련 완료':p.learned.includes(s.id)?'✓ 배움 완료':'입문 스킬'}</span><button class="${p.learned.includes(s.id)?'secondary':'primary'} wide" data-academy-lesson="${s.id}">${p.learned.includes(s.id)?'설명과 수련 보기':'스킬 배우기'}</button></article>`).join('')}</div><p class="academy-note">스킬은 베리 없이 배워요. 수련을 쉬어도 손해가 없고, 배움 기록은 이 기기에 저장돼요. 학교에서 종료하면 중앙 광장에서 이어해요.</p><button id="academy-walk" class="primary wide">배움의 홀에서 걸어 보기</button><button class="text-button wide" data-close>닫기</button></section>`;
}
