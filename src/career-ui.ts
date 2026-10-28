/** Pure presentation: the caller owns learning, equipment, combat and persistence. */
export type CareerJobId = 'knight'|'mage'|'ranger';
export type CareerJournalTab = 'career'|'skills'|'hunting';
export type CareerTrainingMode = 'single'|'multi'|'attacking';
export type CareerSkillView = {
 id:string;name:string;description:string;iconIndex:number;unlocked:boolean;
 cooldown?:number;remaining?:number;active?:boolean;requirement?:string;practiced?:boolean;
};
export type CareerJobView = {id:CareerJobId;name:string;subtitle:string;description:string;rankName?:string};
export type CareerSchoolView = {
 level:number;job:CareerJobId|null;rank:number;jobs:readonly CareerJobView[];skills:readonly CareerSkillView[];
 slots:readonly (string|null)[];selectedSlot?:number;canChooseJob?:boolean;canAdvance?:boolean;
 nextRankName?:string;advanceRequirement?:string;trialAvailable?:boolean;trialJob?:CareerJobId;trialRank?:number;
 trainingMode?:CareerTrainingMode;notice?:string;
};
export type CareerRecordRow = {label:string;value:string|number};
export type CareerJournalView = {
 tab:CareerJournalTab;school:CareerSchoolView;careerRows?:readonly CareerRecordRow[];
 huntingRows?:readonly CareerRecordRow[];huntingNote?:string;
};
export type CareerCombatView = {
 hp:number;maxHp:number;target?:{name:string;hp:number;maxHp:number}|null;
 skills:readonly (CareerSkillView|null)[];attackReady?:boolean;status?:string;training?:boolean;
};
const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const attr=(v:unknown)=>escape(v);
const percent=(value:number,max:number)=>Number.isFinite(value)&&Number.isFinite(max)&&max>0?Math.max(0,Math.min(100,value/max*100)):0;
const count=(value:number)=>Math.max(0,Math.ceil(Number.isFinite(value)?value:0));

// A vector sigil remains legible while the optional painted atlas is loading.
const sigils=[
 '<path d="M24 8 38 14v12c0 10-14 16-14 16S10 36 10 26V14Z"/><path d="m17 25 5 5 10-13"/>',
 '<path d="M8 18h22c12 0 12-12 3-12M8 26h29c9 0 9 13 0 13M12 34h12"/>',
 '<path d="M17 16h14l4 23H13Z"/><path d="M20 16V9h8v7M18 40h12M19 23l5 8 5-8"/>',
 '<path d="m11 38 25-25 4-5-6 2-25 25Z"/><path d="m9 28 12 12M7 12c15-7 33 4 31 19"/>',
 '<path d="M8 26h15l-3-9 20 9-20 10 3-9M12 17h9M7 35h9"/>',
 '<path d="M24 8v31M24 21 13 13M24 25l12-13M24 33 12 42M24 33l12 9M17 8l-4 5-6-1M33 8l3 5 6-1"/>',
 '<path d="M24 5 40 13v13c0 10-16 18-16 18S8 36 8 26V13Z"/><path d="m24 13 3 8 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1Z"/>',
 '<path d="m24 7 4 12 13 5-13 4-4 13-5-13-12-4 12-5Z"/><path d="M8 39 16 31M32 16l8-8"/>',
 '<path d="M24 6v36M8 15l32 18M8 33l32-18M19 10l5 5 5-5M19 38l5-5 5 5M9 22l7-1-1-7M39 26l-7 1 1 7"/>',
 '<path d="M14 16c16-17 33 2 23 17C23 50 3 33 11 21c8-13 25-4 19 6-5 8-14 1-8-4"/>',
 '<path d="m29 7 3 8 9 1-7 6 2 9-7-5-8 5 2-9-7-6 10-1Z"/><path d="M9 24 4 35M18 32l-6 12M26 36l-3 8"/>',
 '<path d="M15 8c23 4 23 28 0 32l9-16Z"/><path d="M8 24h33M34 18l7 6-7 6"/>',
 '<path d="M7 18h33M33 12l7 6-7 6M7 32h33M33 26l7 6-7 6M21 9v30"/>',
 '<path d="M8 35c3-16 29-16 32 0L24 42Z"/><path d="m13 31-4-9M35 31l4-9M24 9v18M18 15l6-6 6 6"/>',
 '<path d="M9 12h30M7 21h28M12 30h22M19 39h9M30 9 18 23l11-1-10 19"/>',
];
// Painted cells remain tied to skill IDs when new skills are inserted into a job's list.
const paintedSkillIds=['shield','wind','lantern','crescent','charge','roots','guardian','starbolt','frost','vortex','starfall','arrow','pierce','trap','storm'];
const jobSigils:Record<string,string>={knight:'crescent',mage:'starbolt',ranger:'arrow',attack:'crescent'};
// Broad, original silhouettes also read at the compact 20–24px icon size.
const extraSigils:Record<string,string>={
 acornRush:'<path d="M14 22c0 14 10 19 10 19s10-5 10-19Z" fill="currentColor" fill-opacity=".16"/><path d="M12 22c0-7 6-11 12-11s12 4 12 11ZM24 11l3-5M17 17l4 4 5-5 5 5M5 28h5M7 35h7"/>',
 vinePull:'<path d="M12 39c16 0 26-10 24-20-2-9-12-10-16-3-4 6 2 12 7 8"/><path d="M16 31c-10 0-12-7-12-7 11-2 15 3 12 7ZM30 35c9 0 13-8 13-8-11-1-15 3-13 8Z" fill="currentColor" fill-opacity=".22"/><path d="m19 37-7 2 3-7"/>',
 dawnSlash:'<path d="m10 39 27-29-5 14Z" fill="currentColor" fill-opacity=".24"/><path d="m8 30 10 10M9 17h5M17 7l3 5M30 5l-1 5M39 29l5 1M37 38l4 4M8 24a13 13 0 0 1 17-13"/>',
 leafOrb:'<circle cx="24" cy="25" r="14"/><path d="M17 30c-2-10 5-13 14-13 1 10-4 16-14 13Zm0 0 10-10" fill="currentColor" fill-opacity=".18"/><path d="m10 5 1 4 4 1-4 1-1 4-1-4-4-1 4-1ZM39 7v7M36 10h6"/>',
 thunderChain:'<path d="m26 7-13 19h10l-3 15 15-21H24Z" fill="currentColor" fill-opacity=".2"/><path d="M14 12a6 6 0 1 0-4 11M34 36a6 6 0 1 0 4-11M8 29l4 5M36 14l4 5"/>',
 comet:'<path d="m12 27 21-20-5 16L43 10 29 32"/><circle cx="18" cy="32" r="10" fill="currentColor" fill-opacity=".2"/><path d="M13 31a5 5 0 0 1 6-4M6 15l8-8M32 42l8-8"/>',
 tripleShot:'<path d="M24 42V7M24 7l-6 7M24 7l6 7M24 37 7 16M7 16l-1 9M7 16l9 2M24 37l17-21M41 16l1 9M41 16l-9 2"/>',
 galeShot:'<path d="M6 25h35m-7-7 7 7-7 7M9 17c2-10 18-12 23-3M16 36c12 8 26-2 25-13M8 33c-4 0-5 7 0 7M23 8c-5-5-12 1-8 6"/>',
 moonArrow:'<path d="M24 7C6 8 4 34 22 40 14 31 16 15 24 7Z" fill="currentColor" fill-opacity=".24"/><path d="m18 34 24-24M31 10h11v11M26 33l-5-5M32 27l-5-5"/>',
};
export function renderSkillIcon(id:string,index:number,label=''){
 const custom=Object.hasOwn(extraSigils,id)?extraSigils[id]:undefined;
 const paintedId=Object.hasOwn(jobSigils,id)?jobSigils[id]:id,knownIndex=paintedSkillIds.indexOf(paintedId);
 const legacyIndex=Number.isInteger(index)&&index>=0&&index<paintedSkillIds.length?index:-1;
 const i=custom?-1:knownIndex>=0?knownIndex:legacyIndex,vector=custom||sigils[i>=0?i:0];
 const position=i>=0?` style="--sigil-x:${(i%5)*25}%;--sigil-y:${Math.floor(i/5)*50}%"`:'';
 return `<span class="career-sigil${i<0?' is-vector':''}" data-skill-icon="${attr(id)}"${position} aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${vector}</svg>${i>=0?'<span class="career-painted-sigil"></span>':''}</span>${label?`<span class="career-skill-name">${escape(label)}</span>`:''}`;
}
function skillCards(vm:CareerSchoolView){
 return `<div class="career-skill-list">${vm.skills.map(s=>{
  const slot=vm.slots.indexOf(s.id), learnable=['shield','wind','lantern'].includes(s.id);
  return `<article class="career-skill-card${s.unlocked?'':' is-locked'}">${renderSkillIcon(s.id,s.iconIndex)}<div><h4>${escape(s.name)}</h4><p>${escape(s.description)}</p><small>${s.unlocked?`${s.cooldown?`다시 사용 ${count(s.cooldown)}초 · `:''}${s.practiced?'수련 완료':'배움 완료'}`:escape(s.requirement||'다음 전직에서 배워요')}</small></div><button type="button" data-career-action="${s.unlocked?'equip-skill':'lesson'}" data-skill="${attr(s.id)}" ${!s.unlocked&&!learnable?'disabled':''}>${slot>=0?`${slot+1}번에 장착됨`:s.unlocked?`${(vm.selectedSlot??0)+1}번에 넣기` :learnable?'배우기':'아직 잠김'}</button>${s.unlocked?`<button type="button" class="career-practice-link" data-career-action="practice-skill" data-skill="${attr(s.id)}">${s.practiced?'다시 연습':'수련하기'}</button>`:''}</article>`;
 }).join('')}</div>`;
}
function loadout(vm:CareerSchoolView){
 return `<section class="career-loadout"><h3>가져갈 스킬 네 개</h3><p>바꿀 칸을 누르고 아래에서 스킬을 골라요.</p><div class="career-slots">${Array.from({length:4},(_,i)=>{
  const skill=vm.skills.find(s=>s.id===vm.slots[i]);
  return `<div><button type="button" class="career-slot${(vm.selectedSlot??0)===i?' is-selected':''}" data-career-action="select-slot" data-slot="${i}" aria-pressed="${(vm.selectedSlot??0)===i}"><b>${i+1}</b>${skill?renderSkillIcon(skill.id,skill.iconIndex,skill.name):'<span class="career-empty-slot">＋</span><span>빈 칸</span>'}</button>${skill?`<button type="button" class="career-slot-clear" data-career-action="unequip-skill" data-slot="${i}" aria-label="${i+1}번 ${attr(skill.name)} 빼기">빼기</button>`:''}</div>`;
 }).join('')}</div></section>`;
}
export function renderCareerSchool(vm:CareerSchoolView){
 const current=vm.jobs.find(j=>j.id===vm.job);
 return `<section class="career-sheet"><header class="career-heading"><small>베리숲 모험학교 · 직업과 스킬</small><h2>${current?escape(current.rankName||current.name):'어떤 모험가가 되고 싶나요?'}</h2><p>레벨 ${count(vm.level)} · ${current?escape(current.subtitle):'검과 방패, 별빛 마법, 숲의 활을 만나 보세요.'}</p></header>${vm.notice?`<p class="career-notice" role="status">${escape(vm.notice)}</p>`:''}<div class="career-job-grid">${vm.jobs.map((job,i)=>`<article class="career-job-card${vm.job===job.id?' is-selected':''}">${renderSkillIcon(job.id,[3,7,11][i]??3)}<h3>${escape(job.name)}</h3><strong>${escape(job.subtitle)}</strong><p>${escape(job.description)}</p><button type="button" data-career-action="choose-job" data-job="${job.id}" ${!vm.canChooseJob?'disabled':''}>${vm.job===job.id?'나의 직업':vm.canChooseJob?'이 직업 고르기':'레벨 10에 선택해요'}</button></article>`).join('')}</div><section class="career-advancement"><h3>한 걸음씩 자라는 모험가</h3><ol>${[10,30,60].map((level,i)=>`<li class="${vm.rank>i?'is-complete':''}"><b>${level}</b><span>${i+1}차 전직${vm.rank>i?' 완료':''}</span></li>`).join('')}</ol>${vm.nextRankName?`<p>다음 목표: <strong>${escape(vm.nextRankName)}</strong></p>`:''}${vm.advanceRequirement?`<p>${escape(vm.advanceRequirement)}</p>`:''}${vm.trialAvailable?`<button type="button" data-career-action="start-trial" data-job="${attr(vm.trialJob||vm.job)}" data-rank="${count(vm.trialRank||vm.rank+1)}">전직 수련 시작</button>`:''}${vm.canAdvance?'<button type="button" class="career-primary" data-career-action="advance-job">다음 직업으로 전직하기</button>':''}</section>${loadout(vm)}<section><h3>나의 스킬</h3>${skillCards(vm)}</section>${renderTrainingSettings(vm.trainingMode||'single')}<button type="button" class="career-return" data-career-action="close">게임으로 돌아가기</button></section>`;
}
export function renderTrainingSettings(mode:CareerTrainingMode){
 const modes=[['single','한 마리','움직임과 거리를 익혀요.'],['multi','여러 마리','함께 맞히는 기술을 연습해요.'],['attacking','공격하는 허수아비','피하고 막는 타이밍을 익혀요.']] as const;
 return `<section class="career-training"><h3>내가 고르는 수련</h3><div class="career-training-modes">${modes.map(([id,name,note])=>`<button type="button" data-career-action="training-mode" data-mode="${id}" aria-pressed="${mode===id}" class="${mode===id?'is-selected':''}"><strong>${name}</strong><small>${note}</small></button>`).join('')}</div><button type="button" class="career-primary" data-career-action="start-training" data-mode="${mode}">이 수련으로 연습하기</button></section>`;
}
const rows=(data:readonly CareerRecordRow[])=>`<dl class="career-record-rows">${data.map(r=>`<div><dt>${escape(r.label)}</dt><dd>${escape(r.value)}</dd></div>`).join('')}</dl>`;
export function renderCareerJournal(vm:CareerJournalView){
 return `<section class="career-sheet"><header class="career-heading"><small>모험 수첩</small><h2>나의 모험 기록</h2></header><nav class="career-journal-tabs" aria-label="모험 기록">${([['career','직업'],['skills','스킬·수련'],['hunting','사냥 기록']] as const).map(([id,name])=>`<button type="button" data-career-action="journal-tab" data-tab="${id}" aria-pressed="${vm.tab===id}" class="${vm.tab===id?'is-selected':''}">${name}</button>`).join('')}</nav>${vm.tab==='career'?`${rows(vm.careerRows||[])}<button type="button" class="career-primary" data-career-action="open-school">학교에서 직업 살펴보기</button>`:vm.tab==='skills'?`${loadout(vm.school)}${skillCards(vm.school)}${renderTrainingSettings(vm.school.trainingMode||'single')}`:`${rows(vm.huntingRows||[])}<p class="career-note">${escape(vm.huntingNote||'숲에서 직접 만난 몬스터의 기록이에요.')}</p>`}<button type="button" class="career-return" data-career-action="close">게임으로 돌아가기</button></section>`;
}
export function renderCombatHud(vm:CareerCombatView){
 return `<div class="career-combat" aria-label="${vm.training?'수련':'사냥'} 조작"><div class="career-vitals"><div class="career-hp"><span>나의 체력</span><b>${count(vm.hp)} / ${count(vm.maxHp)}</b><div class="career-health-track" role="meter" aria-label="나의 체력" aria-valuemin="0" aria-valuemax="${count(vm.maxHp)}" aria-valuenow="${count(vm.hp)}"><i style="width:${percent(vm.hp,vm.maxHp)}%"></i></div></div>${vm.target?`<div class="career-target-hp"><span>${escape(vm.target.name)}</span><b>${count(vm.target.hp)} / ${count(vm.target.maxHp)}</b><div class="career-health-track" role="meter" aria-label="${attr(vm.target.name)} 체력" aria-valuemin="0" aria-valuemax="${count(vm.target.maxHp)}" aria-valuenow="${count(vm.target.hp)}"><i style="width:${percent(vm.target.hp,vm.target.maxHp)}%"></i></div></div>`:''}${vm.status?`<p class="career-combat-status">${escape(vm.status)}</p>`:''}</div><div class="career-skill-controls">${Array.from({length:4},(_,i)=>{
  const s=vm.skills[i],remaining=s?.remaining||0;
  return `<button type="button" class="career-combat-skill${s?.active?' is-active':''}${remaining>0?' is-cooling':''}" data-career-action="cast-skill" style="--cooldown-angle:${Math.min(360,remaining/(s?.cooldown||1)*360)}deg" data-slot="${i}" ${s?`data-cast-skill="${attr(s.id)}"`:''} ${!s||!s.unlocked||remaining>0?'disabled':''} aria-label="${i+1}번 ${s?attr(s.name):'빈 스킬 칸'}${remaining>0?`, ${count(remaining)}초 뒤 사용`:''}"><kbd>${i+1}</kbd>${s?renderSkillIcon(s.id,s.iconIndex,s.name):'<span class="career-empty-slot">＋</span><span>빈 칸</span>'}${remaining>0?`<b class="career-cooldown">${count(remaining)}</b>`:''}</button>`;
 }).join('')}</div><button type="button" class="career-attack" data-career-action="attack" aria-label="일반 공격${vm.attackReady===false?' 준비 중':''}">${renderSkillIcon('attack',3)}<span>공격</span><kbd>F</kbd></button></div>`;
}
