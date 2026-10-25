export type SkillId = 'shield' | 'wind' | 'lantern';
export const ACADEMY_KEY='berry-forest-academy-v1';
export const ACADEMY_SKILLS = [
 {id:'shield',key:'1',icon:'🌿',name:'잎새 방패',subtitle:'숲의 숨결을 두르다',description:'8초 동안 6걸음 안의 몬스터 움직임을 멈춰요. 문제를 풀거나 보상받는 방법은 그대로예요.',lesson:'잎사귀를 몸 주위에 펼쳐, 가까운 몬스터가 잠시 쉬게 해요. 몬스터 곁에서 주변을 차분히 살펴볼 때 사용해 보세요.',trial:'방패를 펼치고 수련실에서 3초 동안 유지해 보세요.',duration:8,cooldown:20,color:'#77b38a'},
 {id:'wind',key:'2',icon:'🪽',name:'바람 걸음',subtitle:'한 줄기 바람처럼',description:'5초 동안 걸음이 1.6배 빨라져요. 벽과 물은 그대로 조심해야 해요.',lesson:'숲의 바람을 발끝에 모아 빠르게 달려요. 방향을 정한 뒤 사용하고, 움직이며 바람의 길을 느껴 보세요.',trial:'바람 걸음을 쓰고 수련실에서 3걸음 이상 이동해 보세요.',duration:5,cooldown:12,color:'#79bed3'},
 {id:'lantern',key:'3',icon:'🏮',name:'길잡이 등불',subtitle:'다음 발견을 비추다',description:'15초 동안 현재 숲의 발견 장소나 다음 탐험 대상으로 길을 안내해요.',lesson:'등불은 정답 대신 길을 알려줘요. 숲에서는 발견 장소·몬스터·출구를, 학교에서는 배움의 서가를 찾아가요.',trial:'등불을 켜고 안내를 따라 배움의 서가 가까이 가 보세요.',duration:15,cooldown:25,color:'#dbb968'},
] as const;
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
export function learnSkill(p:AcademyProgress,id:SkillId):boolean{if(p.learned.includes(id))return false;p.learned.push(id);return true;}
export function practiceSkill(p:AcademyProgress,id:SkillId):boolean{if(!p.learned.includes(id)||p.practiced.includes(id))return false;p.practiced.push(id);return true;}
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