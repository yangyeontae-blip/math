import { ACADEMY_SKILLS, skillInfo, isSkill, emptyAcademy, saveAcademy, migrateAcademy, syncCareerRankSkills, selectJob, advanceJob, recordCareerTrial, careerSkills, equipCareerSkill, type SkillId, type JobId } from './academy';
import { HUNTING_ZONES } from './hunting';
import { grantHuntingReward, huntingPower, huntingRewardFor } from './rules';
import { renderCareerSchool, renderCareerJournal, renderCombatHud, renderSkillIcon, renderTrainingSettings, type CareerSchoolView, type CareerSkillView, type CareerJournalTab, type CareerTrainingMode, type CareerCombatView } from './career-ui';
import './career.css';
import type { Save } from './rules';
import type { World } from './world';

type Hooks={state:()=>Save|null;world:()=>World;persist:()=>void;stored:()=>boolean;refresh:()=>void;open:(html:string,cls?:string)=>void;close:()=>void;toast:(s:string)=>void;enterSchool:()=>void;learning:()=>void;plaza:()=>void};
const JOBS=[
 {id:'knight' as const,name:'숲의 기사',subtitle:'묵직한 검과 든든한 방패',description:'가까운 적을 함께 공격하고 숲의 힘으로 버텨요.',names:['새싹 모험가','기사','수호기사','고대숲 기사']},
 {id:'mage' as const,name:'별빛 마법사',subtitle:'별과 꽃에 담긴 마법',description:'멀리서 마법을 쏘고 여러 적을 얼리거나 함께 공격해요.',names:['새싹 모험가','마법사','마도사','별빛 현자']},
 {id:'ranger' as const,name:'바람 궁수',subtitle:'빠른 화살과 자유로운 발걸음',description:'거리를 유지하며 관통 화살과 덩굴 덫을 사용해요.',names:['새싹 모험가','궁수','레인저','폭풍의 궁수']},
];
const LEVELS=[10,30,60];
const JOB_SKILLS:Record<JobId,SkillId[]>={knight:['crescent','charge','roots','guardian'],mage:['starbolt','frost','vortex','starfall'],ranger:['arrow','pierce','trap','storm']};
const validJob=(id:unknown):id is JobId=>JOBS.some(j=>j.id===id);
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Connects school, training and hunting to the same saved career. */
export function mountCareer(h:Hooks){
 document.documentElement.style.setProperty('--career-skill-atlas',`url("${new URL(import.meta.env.BASE_URL+'art/skill-sigils-v1.webp',document.baseURI).href}")`);
 document.documentElement.style.setProperty('--career-expanded-skill-atlas',`url("${new URL(import.meta.env.BASE_URL+'art/skill-sigils-expanded-v1.webp',document.baseURI).href}")`);
 const hud=document.createElement('div');hud.id='career-hud';hud.hidden=true;document.querySelector('#hud')!.append(hud);
 const bar=document.createElement('div');bar.id='academy-skills';bar.className='academy-bar career-exploration-bar';bar.hidden=true;document.querySelector('#hud')!.append(bar);
 const status=document.createElement('div');status.className='academy-status';document.querySelector('#hud')!.append(status);
 let selectedSlot=0,mode:CareerTrainingMode='single',journal:CareerJournalTab='career',held=false,attackPointer:number|null=null,notice='',current:'school'|'journal'|'practice'|'lesson'|null=null;
 let trial:{job:JobId;rank:1|2|3;skill?:SkillId}|null=null,practiceSkill:SkillId|undefined,completed=false,skillKey='',saveBlocked=false;
 let trainingSetup:Parameters<World['enterTraining']>[1]|null=null;
 const credited=new Set<string>();
 const skillVM=(id:SkillId):CareerSkillView=>{const s=h.state()!,a=skillInfo(id),available=careerSkills(s.career,s.level).includes(id);return {id,name:a.name,description:a.description,iconIndex:ACADEMY_SKILLS.findIndex(x=>x.id===id),unlocked:available,cooldown:a.cooldown,practiced:s.career.practiced.includes(id),requirement:id==='shield'||id==='wind'||id==='lantern'?'학교에서 배워요':'직업을 선택하고 전직 수련을 마쳐요'};};
 function vm():CareerSchoolView{
  const s=h.state()!,c=s.career,job=c.job,rank=job?c.ranks[job]:0,next=Math.min(3,rank+1),canTrial=!!job&&rank<3&&s.level>=LEVELS[rank];
  const list=ACADEMY_SKILLS.filter(a=>!a.job||!job||a.job===job);
  return {level:s.level,job,rank,jobs:JOBS.map(j=>({...j,rankName:j.names[c.ranks[j.id]]})),skills:list.map(a=>skillVM(a.id)),slots:c.loadouts[job??'novice'],selectedSlot,canChooseJob:s.level>=10,canAdvance:canTrial&&c.trials[job!]>=next,nextRankName:job&&rank<3?JOBS.find(j=>j.id===job)!.names[next]:undefined,advanceRequirement:!job?'레벨 10부터 직업을 골라 수련할 수 있어요.':rank===3?'모든 전직을 마쳤어요!':s.level<LEVELS[rank]?`레벨 ${LEVELS[rank]}에 다음 수련이 열려요.`:'수련 마당에서 다음 전직 실습을 마쳐요.',trialAvailable:canTrial,trialJob:job??undefined,trialRank:next,trainingMode:mode,notice};
 }
 // Event delegation stays attached to the dialog even when its content changes.
 document.querySelector('#modal-content')!.addEventListener('click',onAction);
 function showSchool(){if(!h.state())return;current='school';h.open(renderCareerSchool(vm())+'<button id="academy-walk" class="secondary wide" data-career-action="walk-school">배움의 홀에서 걸어 보기</button>','academy-modal');}
 function showRecords(tab:CareerJournalTab='career'){
  const s=h.state();if(!s)return;current='journal';journal=tab;const c=s.career;
  h.open(renderCareerJournal({tab,school:vm(),careerRows:[{label:'현재 직업',value:jobName()},{label:'레벨',value:s.level},...JOBS.map(j=>({label:j.name+' 전직',value:c.ranks[j.id]+' / 3차'}))],huntingRows:[{label:'누적 처치',value:c.stats.defeats},...HUNTING_ZONES.map((z,i)=>({label:z.name,value:c.stats.byZone[i]+'마리'})),{label:'사냥으로 얻은 베리',value:c.stats.totalBerries??0},{label:'사냥으로 얻은 경험치',value:c.stats.totalXp??0}],huntingNote:'수련장의 표적은 사냥 기록과 보상에 포함되지 않아요.'})+'<button class="secondary wide" data-career-action="learning-records">학습 기록 이어서 보기</button>','academy-modal');
 }
 function showPractice(){if(!h.state())return;current='practice';h.open('<section class="career-sheet"><header class="career-heading"><small>베리숲 모험학교</small><h2>수련 마당</h2><p>공격과 방어를 직접 시험해요. 연습은 언제든 다시 할 수 있어요.</p></header>'+renderTrainingSettings(mode)+'<div class="career-job-grid">'+JOBS.map(j=>`<button data-career-action="try-job" data-job="${j.id}">${j.name} 체험</button>`).join('')+'</div><button class="secondary wide" data-career-action="open-school">직업·스킬 고르기</button><button class="text-button wide" data-career-action="close">게임으로 돌아가기</button></section>','academy-modal');}
 function showLesson(id:SkillId){const s=h.state();if(!s)return;const a=skillInfo(id);current='lesson';h.open(`<section class="career-sheet"><div class="career-heading">${renderSkillIcon(id,ACADEMY_SKILLS.findIndex(x=>x.id===id))}<h2>${a.name}</h2><p>${a.description}</p><p>${a.trial}</p></div><button id="academy-learn" class="primary wide" data-career-action="learn-skill" data-skill="${id}">${s.career.learned.includes(id)?'수련 마당에서 연습하기':'스킬 배우기'}</button><button data-career-action="open-school" class="secondary wide">이전 메뉴</button></section>`,'academy-modal');}
 function jobName(){const c=h.state()?.career;if(!c?.job)return '새싹 모험가';return JOBS.find(j=>j.id===c.job)!.names[c.ranks[c.job]];}
 function configure(){const s=h.state();if(!s)return;h.world().configureCombat({job:s.career.job,learned:careerSkills(s.career,s.level),loadout:s.career.loadouts[s.career.job??'novice']});}
 function store(){h.persist();configure();h.refresh();render();}
 function mirror(){const s=h.state();if(!s)return;saveAcademy(localStorage,{...emptyAcademy(s),learned:s.career.learned,practiced:s.career.practiced});}
 function begin(fresh=false){const s=h.state();if(!s)return;credited.clear();trial=null;practiceSkill=undefined;completed=false;saveBlocked=false;skillKey='';notice='';held=false;
  if(fresh)s.career.legacyImported=true;else migrateAcademy(localStorage,s,s.career);syncCareerRankSkills(s.career);configure();
  h.world().onHuntEvent=e=>{
   if(e.type==='defeat'){
    if(h.world().trainingStatus||e.practice||credited.has(e.id))return;credited.add(e.id);const reward=grantHuntingReward(s,e.zone,e.enemyType);h.persist();
    if(!h.stored()){saveBlocked=true;h.world().setPaused(true);h.toast('사냥 보상을 저장하지 못했어요. 저장 공간을 확인하고 다시 저장해 주세요.');}
    else {configure();h.refresh();h.toast(`🍓 +${reward.berries} · 경험치 +${reward.xp}${reward.levels?' · 레벨 업!':''}`);}
   }else if(e.type==='retreat')h.toast('잠깐 쉬었다 다시 시작해요. 보상은 그대로예요.');
  };mirror();
 }
 function startTraining(job?:JobId,rank?:1|2|3,id?:SkillId){
  const s=h.state();if(!s)return;if(!h.world().inAcademy)h.enterSchool();const useJob=job??s.career.job??'knight';
  const ids=id?[id]:rank?JOB_SKILLS[useJob].slice(rank===1?0:rank,rank===1?2:rank+1):s.career.loadouts[s.career.job??'novice'].filter((x):x is SkillId=>!!x);
  trial=rank?{job:useJob,rank}:null;practiceSkill=id;completed=false;
  const skills=ids.length?ids:ACADEMY_SKILLS.filter(a=>['shield','wind','lantern'].includes(a.id)).map(a=>a.id);
  const practiceMode=skills.some(x=>x==='shield'||x==='guardian')?'attacking':skills.some(x=>x==='pierce'||x==='frost'||x==='roots')?'multi':mode;
  trainingSetup={job:useJob,mode:practiceMode,skills,trialRank:rank,skill:id};h.close();h.world().enterTraining(s,trainingSetup);render();h.refresh();
 }
 function exitTraining(){const s=h.state();if(!s)return;held=false;h.world().exitTraining(s);trial=null;practiceSkill=undefined;configure();h.refresh();render();}
 function showHunting(){const s=h.state();if(!s)return;h.open(`<section class="career-sheet"><header class="career-heading"><small>왼쪽 위 숲길</small><h2>가시덩굴 숲</h2><p>몬스터의 공격 표시를 보고 피하면서 사냥해요. 쓰러져도 가진 것은 잃지 않아요.</p><p class="career-notice">레벨 ${s.level} · 현재 사냥 공격력 ${Math.round(huntingPower(s)).toLocaleString()}<br>레벨이 오르면 기본 공격과 모든 공격 스킬이 함께 강해져요.</p></header><div class="career-training-modes">${HUNTING_ZONES.map((z,i)=>`<button data-career-action="enter-hunting" data-zone="${i}" ${s.level<z.level?'disabled':''}><strong>${z.name}</strong><small>권장 레벨 ${z.level} · 기본 베리 ${z.berries} · 경험치 ${z.xp}</small><small>${s.level<z.level?'권장 레벨부터 입장해요.':`지금 받을 보상: 베리 ${huntingRewardFor(s,i).berries} · 경험치 ${huntingRewardFor(s,i).xp}${huntingRewardFor(s,i).multiplier<1?' · 쉬운 구역·오늘 처치 수에 따른 감소 적용':''}`}</small></button>`).join('')}</div><button class="text-button wide" data-career-action="close">게임으로 돌아가기</button></section>`,'academy-modal');}
 function enterHunting(zone=0){const s=h.state();if(!s)return;if(s.expedition.active){h.toast('진행 중인 원정을 마친 뒤 사냥터에 가요.');return;}if(!HUNTING_ZONES[zone]||s.level<HUNTING_ZONES[zone].level){h.toast('레벨을 올리면 열리는 사냥 구역이에요.');return;}if(h.world().trainingStatus)exitTraining();if(!h.world().inHunting)h.plaza();s.career.location={kind:'hunting',zone};configure();h.close();h.world().enterHunting(s,zone);h.refresh();h.persist();render();h.toast('가시덩굴 숲 · F 또는 공격 버튼으로 사냥해요.');}
 function exitHunting(){const s=h.state();if(!s)return;held=false;s.career.location=null;h.world().exitHunting(s);configure();h.refresh();h.persist();render();}
 function cast(id:SkillId){const s=h.state();if(!s||document.querySelector<HTMLDialogElement>('#modal')!.open)return;const world=h.world();if(skillInfo(id).job&&!world.huntingStatus){h.toast('공격 스킬은 사냥터와 수련 마당에서 사용해요.');return;}const allowed=world.trainingStatus||careerSkills(s.career,s.level).includes(id);if(!allowed)return;if(world.useSkill(id,world.trainingStatus?ACADEMY_SKILLS.map(a=>a.id):careerSkills(s.career,s.level)))render();}
 function onAction(event:Event){const b=(event.target as HTMLElement).closest<HTMLElement>('[data-career-action]');if(!b)return;const s=h.state();if(!s)return;const action=b.dataset.careerAction,id=b.dataset.skill,job=b.dataset.job;
  const dialog=document.querySelector<HTMLDialogElement>('#modal')!,scroll=dialog.scrollTop;
  const reopen=()=>{current==='journal'?showRecords(journal):showSchool();dialog.scrollTop=scroll;};
  if(action==='choose-job'&&validJob(job)){if(!h.world().inAcademy)h.enterSchool();if(!h.world().inAcademy)return;selectJob(s.career,job,s.level);notice='전직 수련을 마치면 직업 스킬을 사용할 수 있어요.';store();showSchool();}
  else if(action==='start-trial'&&validJob(job)){const rank=Number(b.dataset.rank);if(rank>=1&&rank<=3&&s.level>=LEVELS[rank-1])startTraining(job,rank as 1|2|3);}
  else if(action==='advance-job'&&s.career.job){if(!h.world().inAcademy)h.enterSchool();if(advanceJob(s.career,s.career.job,s.level)){for(const id of JOB_SKILLS[s.career.job].filter(x=>s.career.learned.includes(x)))if(!s.career.practiced.includes(id))s.career.practiced.push(id);}notice=jobName()+'로 전직했어요!';mirror();store();showSchool();}
  else if(action==='select-slot'){selectedSlot=Math.max(0,Math.min(3,Number(b.dataset.slot)));reopen();}
  else if(action==='equip-skill'&&isSkill(id)){equipCareerSkill(s.career,selectedSlot,id,s.level);store();reopen();}
  else if(action==='unequip-skill'){s.career.loadouts[s.career.job??'novice'][Number(b.dataset.slot)]=null;store();reopen();}
  else if(action==='lesson'&&isSkill(id))showLesson(id);
  else if(action==='learn-skill'&&isSkill(id)){if(!h.world().inAcademy){h.close();h.enterSchool();}if(['shield','wind','lantern'].includes(id)&&!s.career.learned.includes(id))s.career.learned.push(id);const slots=s.career.loadouts[s.career.job??'novice'];if(!slots.includes(id)&&slots.includes(null))slots[slots.indexOf(null)]=id;mirror();store();startTraining(undefined,undefined,id);}
  else if(action==='practice-skill'&&isSkill(id))startTraining(undefined,undefined,id);
  else if(action==='training-mode'&&['single','multi','attacking'].includes(b.dataset.mode!)){mode=b.dataset.mode as CareerTrainingMode;current==='practice'?showPractice():reopen();dialog.scrollTop=scroll;}
  else if(action==='start-training')startTraining();
  else if(action==='try-job'&&validJob(job)){if(!h.world().inAcademy)h.enterSchool();h.close();trainingSetup={job,mode,skills:JOB_SKILLS[job]};h.world().enterTraining(s,trainingSetup);trial=null;practiceSkill=undefined;completed=false;h.refresh();render();}
  else if(action==='journal-tab')showRecords(b.dataset.tab as CareerJournalTab);
  else if(action==='open-school')showSchool();
  else if(action==='walk-school'){h.close();if(!h.world().inAcademy)h.enterSchool();}
  else if(action==='learning-records')h.learning();
  else if(action==='close')h.close();
  else if(action==='enter-hunting')enterHunting(Number(b.dataset.zone));
  else if(action==='exit-combat'){h.world().trainingStatus?exitTraining():exitHunting();}
  else if(action==='reset-training'&&trainingSetup){held=false;completed=false;h.world().enterTraining(s,{...trainingSetup,skills:[...trainingSetup.skills]});h.refresh();render();}
  else if(action==='retry-save'){h.persist();if(h.stored()){saveBlocked=false;h.world().setPaused(false);h.toast('저장했어요. 사냥을 계속해요.');render();}}
 }
 bar.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-cast-skill]');if(b&&isSkill(b.dataset.castSkill))cast(b.dataset.castSkill);else if((e.target as HTMLElement).closest('#academy-open'))showSchool();});
 hud.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-career-action]');if(b?.dataset.careerAction==='cast-skill'){const slot=Number(b.dataset.slot),s=h.state();const id=h.world().trainingStatus?trainingSlots()[slot]:s?.career.loadouts[s.career.job??'novice'][slot];if(id)cast(id);}else onAction(e);});
 hud.addEventListener('pointerdown',e=>{if((e.target as HTMLElement).closest('[data-career-action="attack"]')&&attackPointer===null){e.preventDefault();attackPointer=e.pointerId;held=true;hud.setPointerCapture(e.pointerId);h.world().huntAttack();}});
 const releaseAttack=(e:Event)=>{if((e as PointerEvent).pointerId===attackPointer){held=false;attackPointer=null;}};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])hud.addEventListener(event,releaseAttack);
 window.addEventListener('blur',()=>{held=false;attackPointer=null;});
 window.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)||document.querySelector<HTMLDialogElement>('#modal')!.open)return;const slot=Number(e.key)-1,s=h.state();if(s&&slot>=0&&slot<4){const id=h.world().trainingStatus?trainingSlots()[slot]:s.career.loadouts[s.career.job??'novice'][slot];if(id){e.preventDefault();cast(id);}}});
 function trainingSlots(){const world=h.world();return (world.trainingSkills??ACADEMY_SKILLS.map(a=>a.id)).slice(0,4);}
 function updateHud(view:CareerCombatView,key:string,menu:string){
  if(hud.dataset.layout!==key){hud.dataset.layout=key;hud.innerHTML=renderCombatHud(view)+menu;return;}
  const health=(selector:string,hp:number,max:number)=>{const el=hud.querySelector(selector);if(!el)return;el.querySelector('b')!.textContent=`${Math.ceil(hp)} / ${Math.ceil(max)}`;const track=el.querySelector<HTMLElement>('[role="meter"]')!;track.setAttribute('aria-valuenow',String(Math.ceil(hp)));track.setAttribute('aria-valuemax',String(Math.ceil(max)));track.querySelector<HTMLElement>('i')!.style.width=`${Math.max(0,Math.min(100,hp/max*100))}%`;};
  health('.career-hp',view.hp,view.maxHp);if(view.target)health('.career-target-hp',view.target.hp,view.target.maxHp);
  const message=hud.querySelector('.career-combat-status');if(message&&message.textContent!==view.status)message.textContent=view.status??'';
  hud.querySelectorAll<HTMLButtonElement>('[data-career-action="cast-skill"]').forEach((b,i)=>{const skill=view.skills[i],remaining=skill?.remaining??0;b.disabled=!skill||!skill.unlocked||remaining>0;b.classList.toggle('is-active',!!skill?.active);b.classList.toggle('is-cooling',remaining>0);b.style.setProperty('--cooldown-angle',`${Math.min(360,remaining/(skill?.cooldown||1)*360)}deg`);let counter=b.querySelector<HTMLElement>('.career-cooldown');if(remaining>0){if(!counter){counter=document.createElement('b');counter.className='career-cooldown';b.append(counter);}counter.textContent=String(Math.ceil(remaining));}else counter?.remove();});
 }
 function render(){const s=h.state();if(!s){bar.hidden=hud.hidden=true;return;}const w=h.world();if(!w?.active){bar.hidden=hud.hidden=true;return;}const snap=w.huntingStatus,training=w.trainingStatus;hud.hidden=!snap;bar.hidden=!!snap;document.querySelector('#hud')!.classList.toggle('has-career-combat',!!snap);
  if(snap){const slots=training?trainingSlots():s.career.loadouts[s.career.job??'novice'];const target=snap.enemies.find(e=>e.id===snap.targetId);const text=training?`${completed?'✦ 수련 성공! · ':''}맞힌 횟수 ${training.hits} · 피해 ${Math.round(training.damage)}`:saveBlocked?'저장 실패 · 다시 저장해 주세요.':snap.safe?'야영지 · 체력을 회복해요.':'적을 누르면 공격 대상을 바꿀 수 있어요.';
   updateHud({hp:snap.playerHp,maxHp:snap.maxHp,target:target?{name:({melee:'덩굴 통통이',charge:'가시 돌진이',ranged:'씨앗 마법이'}[target.type]),hp:target.hp,maxHp:target.maxHp}:null,skills:slots.map(id=>id?{...skillVM(id),unlocked:true,remaining:w.skillState(id).cooldown,active:w.skillState(id).active}:null),status:text,training:!!training},slots.join('|')+'|'+target?.id+'|'+!!training+'|'+saveBlocked,`<div class="career-combat-menu"><button data-career-action="exit-combat">${training?'수련 마치기':'광장으로 돌아가기'}</button>${training?'<button data-career-action="reset-training">처음부터 연습</button>':''}${saveBlocked?'<button data-career-action="retry-save">다시 저장</button>':''}</div>`);
   if(training?.complete&&!completed){completed=true;if(trial)recordCareerTrial(s.career,trial.job,trial.rank);if(practiceSkill&&s.career.learned.includes(practiceSkill)&&!s.career.practiced.includes(practiceSkill))s.career.practiced.push(practiceSkill);mirror();h.persist();h.toast(trial?'전직 수련을 마쳤어요! 학교에서 전직하세요.':'✦ 수련 완료! 모험 기록에 남겼어요.');}
  }else{
   const slots=s.career.loadouts[s.career.job??'novice'];const key=slots.join('|')+s.career.learned.join('|');if(skillKey!==key){skillKey=key;bar.innerHTML=slots.map((id,i)=>`<button ${id?`data-cast-skill="${id}"`:''} ${!id?'disabled':''}><kbd>${i+1}</kbd>${id?renderSkillIcon(id,ACADEMY_SKILLS.findIndex(a=>a.id===id)):'<span>＋</span>'}<small>${id?skillInfo(id).name:'빈 칸'}</small><span class="academy-cooldown"></span></button>`).join('')+'<button id="academy-open" class="academy-menu-button" aria-label="모험학교와 스킬 안내">🏛<small>학교</small></button>';}
   for(const b of bar.querySelectorAll<HTMLButtonElement>('[data-cast-skill]')){const id=b.dataset.castSkill as SkillId,st=w.skillState(id);b.disabled=st.cooldown>0||w.paused;b.classList.toggle('is-active',st.active);b.querySelector('.academy-cooldown')!.textContent=st.active?'사용 중':st.cooldown?st.cooldown+'초':'준비됨';}
  }status.textContent='';
 }
 setInterval(()=>{if(held&&h.state()&&!document.hidden&&!h.world().paused)h.world().huntAttack();},90);setInterval(render,300);
 return {begin,render,showSchool,showRecords,showPractice,showLesson,showHunting,enterHunting,exitHunting,exitTraining,cast,configure,jobName};
}
