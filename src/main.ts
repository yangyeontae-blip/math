import { ACADEMY_SKILLS, academyHtml, emptyAcademy, isSkill, learnSkill, practiceSkill, readAcademy, saveAcademy, skillInfo, type AcademyProgress, type SkillId } from './academy';
import './academy.css';
import { SafeSaveStore } from './save-storage';
import { readLearningRecords, recordResolution, resetLearningRecords } from './learning-records';
import { ConceptPractice, conceptLabel } from './concept-practice';
import './save-status.css';
import { showFeedback } from './feedback-view';
import { homeRecommendation } from './home-guidance';
import { showHomeEditor } from './home-editor';
import { HintProgress, earlyCalculationHint } from './battle-hints';
import './world-map.css';
import { worldMap } from './world-map';
import { adventureFocus, HUB_DESTINATIONS, savedGardenPosition, MenuHistory } from './navigation';
import './salon.css';
import { VILLAGE_NOTICES, noticeListHtml, noticeDetailHtml } from './notices';
import './notices.css';
import { showHomestead, showHomeRequests, homeHeading, type HomeHooks } from './homestead-view';
import { HOME_ITEMS, HOME_REQUESTS } from './homestead';
import { HOME_VISITORS, pickVisitorLine } from './home-experience';
import { showDiscoveryMap, showDiscovery } from './discovery-view';
import { syncDiscoveries, discoveryHere, discoveryId } from './exploration';
import { FIELD_INFO, fieldHere, type FieldForest } from './forest-activities';
import { showForestWork } from './forest-activity-view';
import './forest-trail.css';
import { trailHere, trailPair, trailGoal, collectTrailSeed, moveTrailBundle, lightTrailLamp } from './forest-trail';
import './style.css';
import { NEUTRAL_TITLE, titleLeaksAnswer } from './leak-guard';
import './garden.css';
import { curriculumVisualHtml } from './curriculum-visual';
import { curriculumActivityHtml } from './curriculum-activity';
import { mathTextHtml } from './math-format';
import { VILLAGE_THEMES, villageThemeId } from './villages';
import { dailyMissions, DAILY_STAMPS, DAILY_ALL_CLEAR_BONUS, claimDaily, dailyReady, dailyStampsShown, ensureDaily } from './daily';
import type { World, AvatarPreview, GuideKind } from './world';
import { formatScaled, operationsForGrade, battleMode, type CurriculumMistake, newSave, validateSave, CHARACTERS, MONSTERS, OUTFITS, PETS, POTIONS, RIDES, WEAPONS, HAIRSTYLES, FACES, WEAPON_UPGRADES, OUTFIT_UPGRADES, ROOM_GRID_COLUMNS, ROOM_GRID_ROWS, HERO_BREAD_PET_ID, Encounter, grantReward, rewardFor, battleRewardReason, potionEffects, buy, upgrade, buyRide, dismount, buyPet, unequipPet, buyLook, buyPotion, usePotion, applyTeacherCode, collectBerry, finishHunt, fellTree, treeDamage, canEnter, monsterBattleRounds, recordWrongAnswer, recordCorrectAnswer, STAGE_STORIES, journeyFor, multiplicationUsesStory, startMultiplicationFinal, answerMultiplicationFinal, questionAnswerText, curriculumUnitComplete, canStartCurriculumMission, recordCurriculumAttempt, completeCurriculumMission, curriculumGraduationAvailable, claimCurriculumGraduation, addRoomFurniture, removeRoomFurniture, placeRoomFurniture, roomFurniturePosition, defaultRoomFurniturePosition, OPERATIONS, NEW_CURRICULUM_UNITS, OPERATION_INFO, PRACTICE_TIER_NAMES, type CurriculumUnitId, type NewCurriculumUnitId, type ForestKind, type Operation, type PracticeTier, type SchoolGrade, practiceQuestion, type Save } from './rules';
import { gradeRegions, gradeMissions, generateGradeQuestion, type GradeRegion } from './grade-content';
import { STAGES, stageMonsters, stageBerries, berryValue, clearBonus } from './stages';
import { Sound } from './audio';
import { ambienceDelay, ambienceEnabled, ambienceLabel, applyAmbience, currentAmbience, lineContext, randomizeAmbience, setAmbience } from './ambience';
import { RESCUES, FLOWERS, gardenOf, rescueSheep, plantFlower } from './garden';
import { EXPEDITION_TITLES, expeditionBerryReward, expeditionLayout, expeditionUnlocked, startExpedition, collectExpeditionStar, defeatExpeditionMonster, canFinishExpedition, finishExpedition, selectExpeditionTitle } from './expedition';
import { parseLocalRanks, updateLocalRanks } from './ranking';
import { getGlobalPlayerId, loadGlobalRanks, syncGlobalRank, type GlobalRank } from './global-ranking';
import { markBackup, shouldRemindBackup } from './backup';
import { adaptiveEnabled, setAdaptive } from './adaptive';
import { buildReport, reportHtml } from './report';
import { addBossDamage, bossOfWeek, claimBossReward, readBoss, setClassCode, syncBoss, type BossSummary } from './boss';
import { bubbleOpen, closeBubble, greetingFor, showBubble } from './bubble';
import { speak, speechSupported, stopSpeech, autoReadEnabled, setAutoRead } from './speech';
import { voiceControls } from './speech-controls';
import { STORY_CHAPTERS, startStory, findStoryClue, solveStory, finishStory, storyHere } from './story';
import { activitySpec, newActivity, adjustActivity, activitySolved } from './story-activities';
import { PET_TRICKS, petFriend, strokePet, walkWithPet, type PetReaction } from './pet-care';
import { VILLAGE_PROJECTS, RECOVERY_STEPS, workSpec, designOptions, changeDesign, redesignProject, moveFruit, recommendAdventure, beginProject, projectSpec, adjustProject, finishProject, recoveryQuestions, markRecovered, calculationRecoveryQuestion } from './adventure';
import type { Question } from './rules';
import { j as josa } from './grade-helpers';
import { rematchHunt } from './rules';
import './adventure.css';
import './navigation.css';
import { toolSpec, toolHtml, adjustTool } from './learning-tools';

const CLIENT_BUILD = '2026-10-21.2';
document.documentElement.dataset.clientBuild = CLIENT_BUILD;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const root = $('#game');
const COPYRIGHT_OWNER = '양연태';
const COPYRIGHT_YEAR = 2026;
root.innerHTML = `<div id="world" aria-label="베리숲 3D 마을"></div><div id="hud" hidden>
  <header class="topbar"><div class="player-card"><span class="level-badge" id="level">1</span><div><strong id="nickname"></strong><div class="xp-track"><div id="xp-fill"></div></div><small id="xp-text"></small><span id="save-status" class="save-status" role="status" aria-live="polite">✓ 저장됨</span></div></div><div class="brand-mini">베리숲 <span>모험학교</span></div><div class="top-actions"><span class="wallet">🍓 <b id="berries">0</b><span>베리</span></span><button id="inventory" class="icon-button" aria-label="내 가방">🎒</button><button id="stage-map" class="icon-button" aria-label="지도">🗺</button><button id="settings" class="icon-button" aria-label="설정과 저장">⚙</button></div></header>
  <aside class="quest-card"><button id="quest-toggle" class="quest-toggle" aria-expanded="true" aria-controls="quest-body"><span>🌿 지금 할 일</span><span class="quest-chevron" aria-hidden="true">⌃</span><span class="quest-peek" id="quest-peek"></span></button><div id="quest-body" class="quest-body"><strong id="quest-title">베리숲에 오신 걸 환영해요</strong><div id="quest-list"></div><button id="daily-open" class="text-button codex-open daily-open">📅 오늘의 미션<i class="daily-dot" aria-hidden="true"></i></button><button id="boss-open" class="text-button codex-open">🐉 우리 반 협동 보스</button><button id="codex-open" class="text-button codex-open">📖 모험 도감</button></div></aside>
  <div class="location-pill">❋ 베리숲 마을 <span>평화로운 오후</span></div>
  <div class="equipment-card"><span id="weapon-name"></span><small id="weapon-effect"></small></div>
  <div class="controls-help"><kbd>W A S D</kbd> 이동 <kbd>Space</kbd> 점프 <kbd>E</kbd> 대화 <kbd>F</kbd> 휘두르기</div>
  <button id="interact" class="interaction" hidden></button>
  <div id="touch-controls"><div id="joystick" role="group" aria-label="이동 조이스틱"><span id="stick"></span></div><div class="touch-actions"><button id="touch-talk">대화</button><button id="touch-attack" hidden>휘두르기</button><button id="touch-jump">점프 ↟</button></div></div>
</div><div id="start-screen" class="start-layer"></div><dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status" aria-live="polite"></div><input type="file" id="import-file" accept="application/json,.json" hidden>`;

let nearNpcName = '';
let academyProgress:AcademyProgress|null=null;
const academyBar=document.createElement('div');academyBar.className='academy-bar';academyBar.id='academy-skills';academyBar.hidden=true;$('#hud').append(academyBar);
const academyStatus=document.createElement('div');academyStatus.className='academy-status';academyStatus.setAttribute('role','status');$('#hud').append(academyStatus);
function renderAcademyBar(){
  if(!state||!world||!world.active||!academyProgress){academyBar.hidden=true;academyStatus.textContent='';return;}
  academyBar.hidden=false;
  if(!academyBar.children.length){
    academyBar.innerHTML=ACADEMY_SKILLS.map(s=>`<button data-cast-skill="${s.id}"><kbd>${s.key}</kbd><span class="skill-icon" aria-hidden="true"></span><small>${s.name}</small><span class="academy-cooldown"></span></button>`).join('')+'<button class="academy-menu-button" id="academy-open" aria-label="모험학교와 스킬 안내">🏛<small>학교</small></button>';
    academyBar.querySelectorAll<HTMLButtonElement>('[data-cast-skill]').forEach(b=>b.onclick=()=>{if(isSkill(b.dataset.castSkill))castAcademySkill(b.dataset.castSkill);});$('#academy-open').onclick=()=>openAcademyMenu();
  }
  for(const s of ACADEMY_SKILLS){const unlocked=academyProgress.learned.includes(s.id),status=world.skillState(s.id),b=academyBar.querySelector<HTMLButtonElement>(`[data-cast-skill="${s.id}"]`)!;b.disabled=!unlocked||status.cooldown>0||world.paused;b.classList.toggle('is-active',status.active);b.setAttribute('aria-label',s.name+(unlocked?status.cooldown?' 다시 사용까지 '+status.cooldown+'초':' 사용':' 학교에서 배우기'));b.querySelector('.skill-icon')!.textContent=unlocked?s.icon:'🔒';b.querySelector('.academy-cooldown')!.textContent=!unlocked?'학교에서 배우기':status.active?'사용 중':status.cooldown?status.cooldown+'초':'준비됨';}
  academyStatus.textContent=world.trialSkill?skillInfo(world.trialSkill).trial:'';
}
setInterval(renderAcademyBar,300);
function keepAcademy(){if(academyProgress&&!saveAcademy(localStorage,academyProgress))toast('스킬 기록 저장에 실패했어요. 브라우저 저장 공간을 확인해 주세요.');}
function enterAcademy(){
 if(!state)return;if(state.expedition.active){toast('진행 중인 원정을 마친 뒤 학교에 들러 주세요.');return;}
 persist();if(journeyFor(state).stage!==0||world.inRoom||world.inHomestead||world.inMarket)switchStage(0);
 world.enterAcademy(state);closeModal();refresh();persist();toast('배움의 홀에 오신 걸 환영해요. 선생님과 배움의 서가에서 스킬을 배워 보세요.');
}
function leaveAcademy(){if(!state)return;persist();world.loadStage(state,true);closeModal();refresh();persist();toast('배운 스킬과 함께 숲으로 떠나 볼까요?');}
function openAcademyMenu(records=false){
 if(!state||!academyProgress)return;openModal(title('모험학교 · 배움의 홀','배우고 연습하는 나의 스킬')+academyHtml(academyProgress,records?'records':'learn'),'academy-modal');
 document.querySelectorAll<HTMLButtonElement>('[data-academy-lesson]').forEach(b=>b.onclick=()=>{if(isSkill(b.dataset.academyLesson))openAcademyLesson(b.dataset.academyLesson);});
 $('#academy-walk').onclick=()=>{if(world.inAcademy)closeModal();else enterAcademy();};
}
function openAcademyLesson(id:SkillId){
 if(!academyProgress)return;const s=skillInfo(id),learned=academyProgress.learned.includes(id);
 openModal(title('모험학교 · 입문 수업',s.name)+`<section class="academy-lesson"><div class="academy-sigil" style="--skill-color:${s.color}">${s.icon}</div><h3>${s.subtitle}</h3><p>${s.lesson}</p><p class="academy-trial">${s.trial}</p><p>키보드 <kbd>${s.key}</kbd> 또는 화면 아래 스킬 버튼으로 사용해요.<br>지속 ${s.duration}초 · 다시 사용까지 ${s.cooldown}초</p><button id="academy-learn" class="primary wide">${learned?'수련실에서 연습하기':'이 스킬 배우기'}</button><button id="academy-lesson-back" class="secondary wide">← 스킬 목록</button></section>`,'academy-modal');
 $('#academy-learn').onclick=()=>{if(!academyProgress)return;if(!world.inAcademy){enterAcademy();openAcademyLesson(id);return;}if(learnSkill(academyProgress,id)){keepAcademy();audio.play('level');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)world.celebrate();toast(`${s.name}${id==='shield'?'를':'을'} 배웠어요! 화면 아래 스킬 버튼을 눌러 보세요.`);}closeModal();refresh();renderAcademyBar();};
 $('#academy-lesson-back').onclick=()=>openAcademyMenu();
}
function castAcademySkill(id:SkillId){if(!state||!academyProgress||($('#modal') as HTMLDialogElement).open)return;if(!academyProgress.learned.includes(id)){toast('모험학교에서 먼저 배워 보세요.');return;}if(world.useSkill(id,academyProgress.learned)){audio.play('correct');toast(`${skillInfo(id).icon} ${skillInfo(id).name}!`);renderAcademyBar();}}
window.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)||!state||($('#modal') as HTMLDialogElement).open)return;const skill=ACADEMY_SKILLS.find(s=>s.key===e.key);if(skill){e.preventDefault();castAcademySkill(skill.id);}});

const todayButton = document.createElement('button'); todayButton.id = 'today-adventure'; todayButton.className = 'adventure-launch';
$('.quest-card').prepend(todayButton); todayButton.onclick = openTodayAdventure;
const villageButton = document.createElement('button'); villageButton.id = 'village-projects'; villageButton.className = 'text-button codex-open'; villageButton.textContent = '🌷 우리 마을 만들기';
$('#codex-open').before(villageButton); villageButton.onclick = openVillageProjects;
const adventureMenu = document.createElement('button'); adventureMenu.id = 'adventure-menu'; adventureMenu.className = 'secondary wide'; adventureMenu.textContent = '🧭 지도'; $('.quest-card').append(adventureMenu);
for (const id of ['daily-open', 'codex-open', 'village-projects']) document.getElementById(id)!.hidden = true;
const feedbackButton = document.createElement('button'); feedbackButton.id = 'feedback-open'; feedbackButton.className = 'secondary wide main-feedback'; feedbackButton.textContent = '✉ 의견 보내기'; $('.quest-card').append(feedbackButton); feedbackButton.onclick = openFeedback;
const trailOpen = document.createElement('button'); trailOpen.id = 'forest-trail-open'; trailOpen.hidden = true; root.append(trailOpen);
trailOpen.onclick = openForestExploration;
function openForestExploration() {
  if (!state) return;
  const allowed = operationsForGrade(state.grade);
  openModal(title('숲마다 다른 현장 탐험', '내 손으로 바꾸는 네 숲') + `<p>각 숲의 1단계에서 세 장소를 차례로 바꿔요. 하던 곳은 저절로 기억돼요.</p><div class="adventure-menu-grid">${allowed.map(forest => {
    const done = forest === 'addition' ? state!.forestTrail.lit.length : state!.forestActivities[forest].done.length;
    const name = forest === 'addition' ? '✦ 빛씨앗 오솔길' : `${FIELD_INFO[forest].icon} ${FIELD_INFO[forest].title}`;
    return `<button data-field-enter="${forest}">${name}<small>${FOREST_INFO[forest].name} · 완성 ${done}/3</small></button>`;
  }).join('')}</div><p class="note">1학년: 덧셈·뺄셈 · 2학년부터 곱셈 · 3학년부터 나눗셈</p><button class="text-button wide" data-close>숲으로 돌아가기</button>`, 'adventure-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-field-enter]').forEach(button => button.onclick = () => {
    if (!state) return; const forest = button.dataset.fieldEnter as ForestKind;
    if (!operationsForGrade(state.grade).includes(forest) || !canEnter(state,1,forest)) return;
    if (state.expedition.active) { toast('진행 중인 별빛 원정을 마친 뒤 현장 탐험을 시작해요.'); return; }
    if (forest === 'addition') {
      openModal(title('덧셈숲 1단계', '✦ 빛씨앗 오솔길') + '<p>흩어진 빛씨앗 두 묶음을 찾아 나무 등불에서 합쳐 보세요. 등불 세 곳을 밝히면 길과 큰 나무에 빛이 돌아와요.</p><button id="trail-go" class="primary wide">빛씨앗 찾으러 가기</button><button class="text-button wide" data-close>돌아가기</button>', 'trail-modal');
      $('#trail-go').onclick = () => { if (!state) return; if (!trailHere(state)) switchStage(1,'addition'); else closeModal(); const goal=trailGoal(state); world.guideTo(goal.guide); toast(goal.label); }; return;
    }
    const info = FIELD_INFO[forest as FieldForest];
    openModal(title(`${FOREST_INFO[forest].name} 1단계`, `${info.icon} ${info.title}`) + `<p>${info.intro}</p><p>시간제한과 실패 손실 없이 이어서 할 수 있어요.</p><button id="field-go" class="primary wide">${info.verb} 하러 가기</button><button class="text-button wide" data-close>돌아가기</button>`, 'trail-modal');
    $('#field-go').onclick = () => { if (!state) return; if (!fieldHere(state) || state.forest !== forest) switchStage(1,forest); else closeModal(); world.guideTo('forestWork'); toast(`${info.title} · 안내를 따라 첫 장소로 걸어가요.`); };
  });
}
const homeMenuButton = document.createElement('button'); homeMenuButton.id='homestead-open'; homeMenuButton.hidden=true;root.append(homeMenuButton);homeMenuButton.onclick=openHomestead;
const discoveryMenuButton = document.createElement('button'); discoveryMenuButton.id='discovery-open'; discoveryMenuButton.hidden=true;root.append(discoveryMenuButton);discoveryMenuButton.onclick=openDiscoveryMap;
adventureMenu.onclick = openNavigation;
const menuHistory = new MenuHistory();
let menuPending = false;
let keepingMenus = false;
function visitFromMenu(travel: () => void, render: () => void) {
  keepingMenus = true;
  try { travel(); } finally { keepingMenus = false; }
  render();
}
function rememberMenu(key: string, render: () => void) { menuHistory.enter(key, render); menuPending = true; }
function previousMenu() { if (!menuHistory.back()) closeModal(); }
function navPage(heading: string, body: string, actions: Record<string, () => void>) {
  if (!menuPending) rememberMenu(`page:${heading}`, () => navPage(heading, body, actions));
  openModal(title('베리숲 모험학교', heading) + body + '<div class="nav-close-row"><button class="text-button wide" data-close>게임으로 돌아가기</button></div>', 'navigation-modal');
  // 클릭 이벤트를 넘기지 않아요. openBeauty처럼 첫 인자를 다른 뜻으로 받는 함수가 이벤트를 받으면 창이 열리지 않았어요.
  document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(b => b.onclick = () => actions[b.dataset.nav!]?.());
}
const navButton = (id: string, text: string, detail = '') => `<button data-nav="${id}">${text}${detail ? `<small>${detail}</small>` : ''}</button>`;
function openNavigation() {
  if (!state) return;
  rememberMenu('map', openNavigation);
  navPage('베리숲 모험 지도','<div class="destination-grid">'+HUB_DESTINATIONS.map(d=>`<button class="destination-card" data-nav="${d.id}"><span class="destination-icon" aria-hidden="true">${d.icon}</span><strong>${d.title}</strong><small>${d.detail}</small></button>`).join('')+'</div><details class="map-overview"><summary>섬 전체 지도 보기</summary>'+worldMap(state,world.inMarket)+'</details>'+'<div class="nav-links">'+navButton('today','오늘의 모험')+navButton('academy','🏛 모험학교 · 스킬 배우기')+navButton('notice','운영자 소식')+navButton('book','모험 수첩')+navButton('guide','조작 안내')+'</div>',{today:openTodayAdventure,back:closeModal,explore:openAdventureMap,home:openHomeHub,shops:openShopStreet,school:()=>switchStage(0),addition:()=>openStageMap('addition'),subtraction:()=>openStageMap('subtraction'),multiplication:()=>openStageMap('multiplication'),division:()=>openStageMap('division'),academy:enterAcademy,notice:openNoticeBoard,book:openAdventureBook,guide:openGuide});
}
function openAdventureMap() {
  if (!state) return;
  rememberMenu('adventure', openAdventureMap);
  navPage('숲으로 모험', '<p class="nav-breadcrumb">지도 / 숲으로 모험</p><div class="nav-intro"><h3>발견한 만큼, 나의 집도 자라요</h3><p>숲을 고르고 열린 단계를 탐험해요. 발자국 끝의 장소를 되살리면 추억과 도안이 쌓여요.</p></div><div class="nav-list">' + operationsForGrade(state.grade).map(f => navButton(f,`${FOREST_INFO[f].icon} ${FOREST_INFO[f].name}`,`열린 단계 ${Array.from({length:10},(_,i)=>i+1).filter(n=>canEnter(state!,n,f)).length} · 발견 ${state!.exploration.solved.filter(id=>id.startsWith(f+':')).length}/10`)).join('') + '</div><div class="nav-links">' + navButton('subjects',`📚 ${state.grade}학년 단원 지도`) + navButton('stories','✉️ 이야기 의뢰') + navButton('back','← 전체 지도') + '</div>', {...Object.fromEntries(operationsForGrade(state.grade).map(f=>[f,()=>openStageMap(f)])), subjects:()=>openStageMap(), stories:openStoryBoard, back:openNavigation});
}
function enterHomeGarden() {
  if (!state) return false;
  if (state.expedition.active) { toast('진행 중인 원정을 마친 뒤 나의 집에 들어와요.'); return false; }
  if (world.inRoom) { state.room.inside=false; world.loadStage(state); }
  persist(); world.enterHomestead(state, world.inHomestead); refresh(); persist(); return true;
}
function enterMyRoom() {
  if (!state || !enterHomeGarden()) return;
  persist(); state.homestead.inside=false; world.enterRoom(state); closeModal(); refresh(); persist();
  toast('나의 집이에요. 문을 나가면 내 정원으로 돌아가요.');
}
function openHomeHub() {
  if (!state) return;
  rememberMenu('home', openHomeHub);
  navPage('나의 집', '<p>방을 꾸미고, 정원에서 놀고, 찾아온 주민을 만나요.</p><div class="nav-list">' + navButton('room','🏠 방','모은 가구로 내 방 꾸미기') + navButton('garden','🌿 정원','걷기 · 꾸미기 · 목장과 화단') + navButton('residents','💌 주민','부탁을 들어주고 추억 모으기') + '</div>', {room:()=>{if(enterHomeGarden()){state!.homestead.inside=false;world.enterRoom(state!);refresh();persist();openRoom();}},garden:openGardenHub,residents:openResidents});
}
function openGardenHub() {
  if (!state) return;
  rememberMenu('garden-hub', openGardenHub);
  navPage('나의 집 · 정원', '<p>내가 꾸민 정원에서 쉬어 가요.</p><div class="nav-list">' + navButton('walk','🌿 정원에서 걷기') + navButton('design','📐 정원 꾸미기','만들기 · 배치 · 회전 · 보관') + navButton('projects','🌷 정원 만들기 놀이','꽃밭 · 산책길 · 나눔 식탁') + navButton('meadow','🐑 목장과 작은 화단','구조한 양과 꽃 돌보기') + '</div>', {walk:()=>{if(enterHomeGarden())closeModal();},design:()=>{if(enterHomeGarden())openHomestead();},projects:()=>{if(enterHomeGarden())openVillageProjects();},meadow:()=>{visitFromMenu(()=>switchStage(0),openGarden);}});
}
function openResidents() {
  if (!state) return;
  rememberMenu('residents', openResidents);
  showHomeRequests(state, homesteadHooks());
}
function enterShopStreet() {
  if(!state)return;if(state.expedition.active){toast('진행 중인 원정을 마친 뒤 상점거리에 가요.');return;}
  switchStage(0);world.enterMarket(state);closeModal();refresh();persist();toast('상점거리에 왔어요. 아래쪽 길로 나가면 중앙 광장이에요.');
}
function openPlazaWelcome() {
  navPage('연태쌤의 마을 안내','<p>모험은 이 광장에서 시작해요. 원하는 길을 골라 자유롭게 다녀와요. 수학 시합을 하고 싶으면 분수 오른쪽의 신비를 만나요.</p><div class="nav-list">'+navButton('shops','← 왼쪽 · 상점거리','의상실, 미용실, 펫 가게와 모험 도구')+navButton('home','오른쪽 · 나의 집 →','내가 꾸민 집과 정원')+navButton('explore','↓ 아래쪽 · 숲으로 모험','내 학년에 맞는 숲과 단원 고르기')+navButton('academy','🏛 모험학교 · 스킬 배우기')+navButton('notice','운영자 소식')+'</div>',{shops:enterShopStreet,home:()=>{if(enterHomeGarden())closeModal();},explore:openAdventureMap,academy:enterAcademy,notice:openNoticeBoard});
}
function openShopStreet() {
  rememberMenu('shops', openShopStreet);
  navPage('상점거리', '<div class="nav-intro"><h3>모험가의 취향을 골라요</h3><p>옷, 꾸미기, 펫, 탈것, 무기, 물약 가게가 모여 있어요. 여기서 바로 구경해도 좋아요.</p></div><div class="nav-list">' + navButton('outfit','👗 옷') + navButton('beauty','✨ 헤어와 얼굴 꾸미기') + navButton('pet','🐾 펫') + navButton('ride','🦄 탈것') + navButton('weapon','🪄 무기') + navButton('potion','🧪 물약') + '</div><div class="nav-links">'+navButton('walk','상점거리로 이동')+navButton('plaza','중앙 광장으로 돌아가기')+navButton('back','← 전체 지도')+'</div>', {outfit:()=>openShop('outfit'),beauty:openBeauty,pet:openPetShop,ride:openRideShop,weapon:()=>openShop('weapon'),potion:openPotionShop,walk:enterShopStreet,plaza:()=>switchStage(0),back:openNavigation});
}
function openAdventureBook(tab: 'discover' | 'collection' | 'learning' = 'discover') {
  if (!state) return;
  rememberMenu('book', () => openAdventureBook(tab));
  if (tab === 'discover') showDiscoveryMap(state, discoveryHooks());
  else if (tab === 'learning') renderLearningNotebook();
  else {
    const s = state, entries = [
      {title:'몬스터 친구', seen:s.discoveries.monsters, items:MONSTERS, icons:MONSTERS.map(m=>m.icon)},
      {title:'펫 친구', seen:s.discoveries.pets, items:PETS, icons:PETS.map(p=>p.icon)},
      {title:'옷', seen:s.discoveries.outfits, items:OUTFITS, icons:OUTFIT_ICONS},
    ];
    openModal(title('모험 수첩', '친구·아이템') + '<div class="codex-list">' + entries.map(e=>`<section><h3>${e.title} ${e.seen.length}/${e.items.length}</h3><p>${e.items.map((item,i)=>e.seen.includes(i)?`${e.icons[i]} ${item.name}`:'❔ 아직 못 만났어요').join('　')}</p></section>`).join('') + '</div>');
  }
  const tabs = document.createElement('nav'); tabs.className = 'nav-tabs notebook-tabs'; tabs.setAttribute('aria-label','모험 수첩 분류');
  tabs.innerHTML = ([['discover','발견·추억'],['collection','친구·아이템'],['learning','학습 기록']] as const).map(([id,name])=>`<button class="secondary" data-book-tab="${id}" aria-pressed="${id===tab}">${name}</button>`).join('');
  $('.modal-heading').after(tabs);
  tabs.querySelectorAll<HTMLButtonElement>('[data-book-tab]').forEach(b=>b.onclick=()=>openAdventureBook(b.dataset.bookTab as typeof tab));
  const links = document.createElement('div'); links.className='nav-links'; links.innerHTML=navButton('today','오늘의 모험')+navButton('extra','더 놀기')+navButton('help','도움말'); $('#modal-content').append(links);
  links.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(b=>b.onclick=()=>({today:openTodayAdventure,extra:openExtraActivities,help:openGuide}[b.dataset.nav as 'today'|'extra'|'help'])());
}
function openExtraActivities() {
  navPage('더 놀기','<p>모험 중간에 언제든 해 볼 수 있는 놀이예요.</p><div class="nav-list">'+navButton('arena','✦ 신비의 수학 시합','중앙 광장 분수 오른쪽에서 만나요')+navButton('expedition','🌟 별빛 원정과 기록')+navButton('boss','🤝 협동 보스')+'</div>',{arena:openArena,expedition:openExpeditionBoard,boss:()=>void openBoss()});
}
/** 가까이 있는 대상에 맞는 버튼 이름. 대화 버튼 하나로 줍기·밝히기·싸우기를 모두 해요. */
function actionVerb(id: string | null): string {
  if(id==='academyGate')return '들어가기';if(id==='academyExit')return '나가기';if(id==='academyBook'||id==='academyTeacher')return '배우기';if(id==='academyPractice')return '연습하기';if(id==='academyRecords')return '기록 보기';
  if (!id) return '대화';
  if (/^(weapon|outfit|pet|ride|beauty|potion)$/.test(id)) return '구경하기';
  if (/^(monster|expMonster)/.test(id)) return '싸우기';
  if (id.startsWith('trailSeed')) return '줍기';
  if (id.startsWith('trailLamp')) return '밝히기';
  if (id.startsWith('tree')) return '베기';
  if (/^(storyClue|discovery|forestWork|storyPuzzle|villageProject)/.test(id)) return '살펴보기';
  if (/^(homeExit|roomExit)/.test(id)) return '나가기';
  if (/^(homesteadGate|room$|journey|next|village$|shopStreet)/.test(id)) return '들어가기';
  return '대화';
}
function beginFirstAdventure() {
  if (!state) return;
  openAdventureMap();
}
let continuingDiscovery = '';
function renderCurrentFocus() {
  if (!state) return;
  const s=state, kind=adventureFocus(s), stage=journeyFor(s).stage;
  let label='', action:()=>void=openAdventureMap, button='열기';
  const guide=(target:GuideKind)=>()=>{closeModal();world.guideTo(target);};
  if(world.inAcademy){label=academyProgress?.learned.length===3?'배운 스킬을 써 보고 수련 기록 남기기':academyProgress?.learned.length?'새 스킬을 배우거나 수련해 보기':'배움의 서가에서 첫 모험 스킬 배우기';action=()=>openAcademyMenu();button='스킬 수업';}
  else if(kind==='story') {label=s.story.active!.solved?'이야기 의뢰 마무리하기':'이야기의 다음 단서 찾기';action=resumeAdventure;}
  else if(kind==='project'){label='함께 만들던 정원 이어 가기';action=()=>{if(enterHomeGarden())renderVillageProject();};}
  else if(kind==='room'){label='모은 가구로 내 방 꾸미기';action=openRoom;}
  else if(kind==='craft'){label='꽃이나 벤치 놓고 주민 초대하기';action=()=>{if(enterHomeGarden())openHomestead();};}
  else if(kind==='visit'){const next=homeRecommendation(s,true);label=next.label;button=next.action==='design'?'준비하기':next.action==='request'?'부탁 보기':next.action==='discover'?'숲으로':'꾸미기';action=()=>{if(next.action==='design'){showHomeEditor(s,homesteadHooks(),next.kind);}else if(next.action==='request'){showHomeRequests(s,homesteadHooks());}else if(next.action==='discover'){openAdventureMap();}else openHomestead();};}
  else if(kind==='expedition'){label='진행 중인 별빛 원정 이어 가기';action=resumeAdventure;}
  else if(kind==='discover'){
    label='발자국을 따라 숨은 장소 찾기';action=guide('discovery');button='길 안내';
    if(stage===1&&trailHere(s)){const g=trailGoal(s);label=g.label;action=guide(g.guide);}
    else if(stage===1&&fieldHere(s)){label=`${FIELD_INFO[s.forest].title} · ${s.forestActivities[s.forest].done.length+1}번째 장소`;action=guide('forestWork');}
  } else if(kind==='explore'){if(continuingDiscovery===`${s.forest}:${stage}`){const cleared=journeyFor(s).maps[stage].cleared;label=cleared?'다음 숲으로 이어 가기':'이 숲의 몬스터 친구 만나기';action=guide(cleared?'next':'monster');button='길 안내';}else{label='숲을 되살렸어요 · 마을에 놓아 볼까요?';action=openReturnChoice;button='고르기';}}
  else if(world.inMarket){label='상점을 구경하고 중앙 광장으로 돌아가기';action=()=>{closeModal();world.guideTo('shop');};button='가게 안내';}
  else if(!academyProgress?.learned.length){label='모험학교에서 나만의 첫 스킬 배우기';action=enterAcademy;button='학교로';}
  else {label='중앙 광장 · 왼쪽 상점거리 / 오른쪽 나의 집 / 아래 모험';action=beginFirstAdventure;button='모험 선택';}
  $('#quest-peek').textContent=label;
  $('#quest-list').innerHTML=`<div class="quest"><span>${escape(label)}</span><button class="quest-guide" id="focus-action">${button}</button></div>`;
  $('#focus-action').onclick=action;
  const ongoing = !!(s.expedition.active || s.story.active || s.adventure.active || stage);
  todayButton.textContent = ongoing ? '▶ 하던 모험 계속하기' : '🧭 오늘의 모험';
  todayButton.title = ongoing ? label : '추천 모험 하나와 오늘의 미션 보기';
  todayButton.onclick = ongoing ? resumeAdventure : openTodayAdventure;
}
function resumeAdventure() {
  if (!state || battle || storyActivityOpen || curriculumRun) return;
  const s = state;
  if (s.expedition.active) { beginExpedition(); return; }
  if (s.story.active) {
    const a = s.story.active;
    if (a.solved) { if (world.inRoom || world.inHomestead || journeyFor(s).stage !== 0) switchStage(0); openStoryBoard(); return; }
    if (!storyHere(s) || world.inRoom || world.inHomestead) switchStage(STORY_CHAPTERS[a.chapter].stage,a.forest); else closeModal();
    world.guideTo(a.found.length === 3 ? 'storyPuzzle' : 'storyClue'); return;
  }
  if (s.adventure.active) { if (enterHomeGarden()) renderVillageProject(); return; }
  if (journeyFor(s).stage) {
    if (world.inHomestead || world.inRoom) { s.room.inside=false; s.homestead.inside=false; world.restore(s); refresh(); persist(); }
    closeModal();
    const stage = journeyFor(s).stage;
    world.guideTo(journeyFor(s).maps[stage].cleared ? 'next' : s.exploration.solved.includes(discoveryId(s.forest,stage)) ? 'monster' : stage===1 && trailHere(s) ? trailGoal(s).guide : stage===1 && fieldHere(s) ? 'forestWork' : 'discovery');
  }
}
function openReturnChoice() {
  navPage('숲에 변화가 생겼어요','<p>지금 마을로 돌아가 꾸며도 되고, 이 숲에서 더 탐험해도 좋아요.</p><div class="nav-list">'+navButton('home','🏡 나의 집에서 만들기')+navButton('continue','🌳 이 숲에서 계속 탐험')+'</div>',{home:openHomeHub,continue:()=>{closeModal();if(state){continuingDiscovery=`${state.forest}:${journeyFor(state).stage}`;refresh();}if(state)world.guideTo(journeyFor(state).maps[journeyFor(state).stage].cleared?'next':'monster');}});
}
let storyActivityOpen = false;
const plazaReturn=document.createElement('button');plazaReturn.id='plaza-return';plazaReturn.className='secondary';plazaReturn.textContent='← 중앙 광장';plazaReturn.hidden=true;$('#stage-map').after(plazaReturn);plazaReturn.onclick=()=>switchStage(0);
const petCareButton = document.createElement('button'); petCareButton.id = 'pet-care-open'; petCareButton.className = 'text-button'; petCareButton.textContent = '🐾 내 펫과 놀기'; petCareButton.hidden = true; $('#codex-open').before(petCareButton); petCareButton.onclick = () => { if (state && state.pet >= 0) openPetCare(state.pet); };
const storyPanel = document.createElement('section'); storyPanel.id = 'story-activity'; storyPanel.hidden = true;
storyPanel.setAttribute('aria-label', '숲속 수학 놀이'); root.append(storyPanel);
let world: World, AvatarPreviewRuntime: typeof AvatarPreview;
const audio = new Sound(), STORAGE = 'berry-forest-save-v1', RANKING_STORAGE = 'berry-forest-local-expedition-ranking-v1';
let ambienceTimer: ReturnType<typeof setTimeout> | undefined;
const refreshAmbience = (change = false) => {
  const scene = change ? randomizeAmbience() : currentAmbience();
  const applied = applyAmbience(root, $('#hud'), scene);
  if (world) world.setWeather(ambienceEnabled() ? applied : null);
  audio.setMood(ambienceEnabled() ? applied.mood : 'day');
  const location = document.querySelector<HTMLElement>('.location-pill');
  if (location) location.dataset.ambience = ambienceEnabled() ? ambienceLabel(applied) : '';
};
const scheduleAmbience = () => {
  if (ambienceTimer) clearTimeout(ambienceTimer);
  ambienceTimer = setTimeout(() => { if (state) refreshAmbience(true); scheduleAmbience(); }, ambienceDelay());
};
const startAmbienceCycle = () => { randomizeAmbience(); refreshAmbience(); scheduleAmbience(); };
const stopAmbienceCycle = () => { if (ambienceTimer) clearTimeout(ambienceTimer); ambienceTimer = undefined; };
const expeditionButton = document.createElement('button');
expeditionButton.id = 'expedition'; expeditionButton.className = 'secondary garden-entry'; expeditionButton.textContent = '✦ 별빛 원정';
$('#quest-list').after(expeditionButton); expeditionButton.onclick = () => openExpeditionBoard();
const questCard = $('.quest-card');
function setQuestCollapsed(collapsed: boolean) {
  questCard.classList.toggle('is-collapsed', collapsed);
  $('#quest-toggle').setAttribute('aria-expanded', String(!collapsed));
  $('#quest-body').hidden = collapsed;
}
setQuestCollapsed(matchMedia('(max-height: 500px), (max-width: 600px)').matches); // 휴대폰에서는 접어 두고 목표 한 줄만 보여요.
$('#quest-toggle').onclick = () => setQuestCollapsed(!questCard.classList.contains('is-collapsed'));
let state: Save | null = null, saved: Save | null = null, preview: AvatarPreview | null = null, startPreview: AvatarPreview | null = null;
let startPreviewRequest = 0, startPortraits: string[] | null = null;
let selected = 0, selectedGrade: SchoolGrade = 3, pendingImport: Save | null = null, toastTimer: ReturnType<typeof setTimeout>, modalOpener: HTMLElement | null = null;
let battle: { encounter: Encounter; id: string; kind: 'normal' | 'expMonster' | 'expGate' | 'multiplicationGate'; round: number; goalRounds?: number; score: number; result: ReturnType<typeof grantReward> | null; newTitle?: number; story?: boolean; missedCurrent?: boolean; hintUsed?: boolean; hint?: HintProgress; hintQuestion?: unknown; adaptiveTier?: PracticeTier; practice?: { operation: Operation; tier: PracticeTier } } | null = null;
type CurriculumModule = typeof import('./curriculum');
type CurriculumQuestion = import('./curriculum').CurriculumQuestion;
let curriculumModulePromise: Promise<CurriculumModule> | null = null;
let curriculumRun: { unit: CurriculumUnitId; mission: number; question: CurriculumQuestion; index: number; total: number; wrong: number; hints: number; hintLevel: number; seenQuestions: Set<string>; missedCurrent?: boolean; answered?: boolean; graduation?: boolean; review?: boolean; story?: boolean; shadow?: CurriculumMistake; recoveryQuestions?: CurriculumQuestion[]; recoveryTarget?: CurriculumMistake; originalCalculation?: Question } | null = null;
// 틀린 개념마다 마을에 나타나는 "그림자 몬스터"(최대 3마리). 다시 풀면 사라지고 작은 베리를 줘요.
let shadowList: CurriculumMistake[] = [], shadowToastShown = false;
const SHADOW_REWARD = 15;
function syncShadows() {
  if (state?.homestead.inside) return;
  if (!world!) return;
  shadowList = state ? state.curriculum.wrongSkills.slice(0, 3) : [];
  world.setShadows(shadowList.map((mistake, i) => ({ id: `shadow${i}`, name: `그림자 몬스터 · ${curriculumRegions().find(region => region.id === mistake.unit)?.name ?? '수학'} 다시 만나기`, type: Math.max(0, curriculumRegions().findIndex(region => region.id === mistake.unit)) % 8 })));
  if (shadowList.length && world.stage === 0 && !world.inRoom && !shadowToastShown) { shadowToastShown = true; setTimeout(() => toast('🌑 마을에 그림자 몬스터가 나타났어요! 다시 풀면 사라져요.'), 2200); }
}
let combo = 0; // 처음에 바로 맞힌 문제가 이어진 수(표시와 소리만 바뀌고 보상은 그대로예요)
let storageError = false, sessionExpired = false, sessionElapsed = 0, sessionCorrect = 0, sessionWrong = 0;
const OUTFIT_ICONS = ['🌿', '🌈', '🍃', '☁️', '🌸', '🌟', '🌙', '👑', '🍓', '🐥', '🐰', '🌰', '🐱', '🐑', '🐸', '🧚', '🌻', '🐝', '🍑', '✴️', '🛡️', '🫖', '🧑‍🚀', '🍰', '🐇', '👑'];
type CurriculumRegion = GradeRegion;
const GRADE3_SEMESTER1: CurriculumRegion[] = [
  { id: 'addition', icon: '🍎', name: '사과 덧셈숲', short: '세 자리 수의 덧셈과 받아올림', className: 'addition', semester: '1학기' },
  { id: 'subtraction', icon: '🍂', name: '낙엽 뺄셈숲', short: '세 자리 수의 뺄셈과 받아내림', className: 'subtraction', semester: '1학기' },
  { id: 'plane', icon: '📐', name: '반듯반듯 도형마을', short: '선분·직선·각·직각과 여러 가지 도형', className: 'plane', semester: '1학기' },
  { id: 'division', icon: '🌿', name: '베리 나눗셈숲', short: '똑같이 나누기와 곱셈으로 몫 찾기', className: 'division', semester: '공통' },
  { id: 'multiplication', icon: '🌻', name: '해바라기 곱셈숲', short: '곱셈의 원리부터 여러 자리 곱셈까지', className: 'multiplication', semester: '공통' },
  { id: 'lengthTime', icon: '🕰️', name: '똑딱 길이시간마을', short: 'mm·km와 초, 시간의 계산', className: 'length-time', semester: '1학기' },
  { id: 'fractionDecimal', icon: '🔟', name: '열칸 분수소수마을', short: '분수와 소수의 뜻과 크기 비교', className: 'fraction-decimal', semester: '1학기' },
];
const GRADE3_SEMESTER2: CurriculumRegion[] = [
  { id: 'multiplication', icon: '🌻', name: '해바라기 곱셈숲', short: '세 자리 수×한 자리 수와 두 자리 수×두 자리 수', className: 'multiplication' },
  { id: 'division', icon: '🌿', name: '베리 나눗셈숲', short: '두·세 자리 수를 나누고 나머지 찾기', className: 'division' },
  { id: 'circle', icon: '🌙', name: '달빛 원의 정원', short: '중심·반지름·지름과 컴퍼스', className: 'circle' },
  { id: 'fraction', icon: '🍰', name: '조각케이크 분수섬', short: '분수만큼, 대분수와 크기 비교', className: 'fraction' },
  { id: 'measurement', icon: '⚖️', name: '물방울 저울마을', short: 'L·mL와 kg·g·t, 어림과 계산', className: 'measurement' },
  { id: 'pictograph', icon: '🔭', name: '별빛 그림그래프 관측소', short: '자료를 그림그래프로 읽고 나타내기', className: 'pictograph' },
].map(region => ({ ...region, semester: region.id === 'multiplication' || region.id === 'division' ? '공통' : '2학기' } as CurriculumRegion));
function curriculumRegionSets(grade: SchoolGrade = state?.grade ?? saved?.grade ?? 3) {
  return gradeRegions(grade) ?? { first: GRADE3_SEMESTER1, second: GRADE3_SEMESTER2 };
}
function curriculumRegions(grade: SchoolGrade = state?.grade ?? saved?.grade ?? 3): CurriculumRegion[] {
  const sets = curriculumRegionSets(grade);
  return [...new Map([...sets.first, ...sets.second].map(region => [region.id, region])).values()];
}
const FOREST_INFO: Record<ForestKind, { name: string; icon: string; op: string; title: string; intro: string; stages: (step: number) => string }> = {
  division: { name: '나눗셈의 숲', icon: '🌿', op: '나눗셈', title: '베리 나눗셈 지도', intro: '몇십 나눗셈에서 시작해 세 자리 수와 나머지까지 배워요.', stages: step => divisionStageLabel(step) },
  multiplication: { name: '곱셈의 숲', icon: '🌻', op: '곱셈', title: '해바라기 곱셈 지도', intro: '구구단부터 세 자리 수×한 자리 수와 두 자리 수×두 자리 수까지 차근차근 만나요.', stages: step => multiplicationStageLabel(step) },
  addition: { name: '덧셈의 숲', icon: '🍎', op: '덧셈', title: '사과 덧셈 지도', intro: '쉬운 덧셈부터 세 자리 수 덧셈까지 차근차근 배워요.', stages: step => ['덧셈 준비 · 받아올림 없음', '덧셈 준비 · 받아올림', '두 자리 + 한 자리', '두 자리 + 한 자리 · 받아올림', '두 자리 + 두 자리', '두 자리 + 두 자리 · 받아올림', '합이 100 이상인 덧셈', '세 자리 + 두 자리', '세 자리 + 두 자리 · 받아올림', '세 자리 + 세 자리 종합'][step - 1] },
  subtraction: { name: '뺄셈의 숲', icon: '🍂', op: '뺄셈', title: '낙엽 뺄셈 지도', intro: '쉬운 뺄셈부터 세 자리 수 뺄셈까지 차근차근 배워요.', stages: step => ['뺄셈 준비 · 받아내림 없음', '뺄셈 준비 · 받아내림', '두 자리 − 한 자리', '두 자리 − 한 자리 · 받아내림', '두 자리 − 두 자리', '두 자리 − 두 자리 · 받아내림', '100 몇 − 두 자리', '세 자리 − 두 자리', '세 자리 − 두 자리 · 받아내림', '세 자리 − 세 자리 종합'][step - 1] },
};
const curriculumName = (unit: CurriculumUnitId) => curriculumRegions().find(region => region.id === unit)?.name ?? unit;
const loadCurriculum = () => curriculumModulePromise ??= import('./curriculum');
const saveStore = new SafeSaveStore<Save>(() => localStorage, STORAGE, validateSave);
saved = saveStore.load(); storageError = saveStore.status === 'error';
function renderSaveStatus() {
  const el = document.querySelector<HTMLElement>('#save-status'); if (!el) return;
  const label = saveStore.status === 'error' ? '⚠ 저장 실패 · 설정에서 파일 보관' : saveStore.status === 'recovered' ? '↩ 정상 기록 복구됨' : '✓ 저장됨';
  if (el.textContent !== label) el.textContent = label;
  el.dataset.state = saveStore.status;
}
function recordLearningResolution(unit: CurriculumUnitId, missed: boolean, helped: boolean) { try { recordResolution(localStorage, unit, missed, helped); } catch { /* Supplemental record is optional. */ } }
function currentLearningRecords() { try { return readLearningRecords(localStorage); } catch { return undefined; } }
renderSaveStatus();
selectedGrade = saved?.grade ?? 3;

function escape(s: string) { return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!); }
function buffTime(seconds: number) { const minutes = Math.floor(seconds / 60), rest = seconds % 60; return minutes ? `${minutes}분 ${rest.toString().padStart(2, '0')}초` : `${rest}초`; }
function equipmentEffectText(s: Save, now = Date.now()) {
  const effect = potionEffects(s, now), potion = `${effect.berrySeconds ? ` · 🍓×${effect.berryMultiplier} ${buffTime(effect.berrySeconds)}` : ''}${effect.xpSeconds ? ` · 🧪경험×${effect.xpMultiplier} ${buffTime(effect.xpSeconds)}` : ''}`;
  return `시합 ×${(WEAPONS[s.weapon].multiplier + s.weapons[s.weapon] * .1).toFixed(1)} · 나무 힘 ${treeDamage(s)} · ${s.ride >= 0 ? `${RIDES[s.ride].icon} 속도 ×${RIDES[s.ride].speed}` : `옷: ${OUTFITS[s.outfit].effect}`}${s.pet >= 0 ? ` · ${PETS[s.pet].icon} 펫` : ''}${potion}`;
}
function weaponExplanation(id: number, level = 0) { const item = WEAPONS[id], power = item.treePower + level; return `몬스터 1마리를 이길 때마다 기본 보상에 ${item.bonus}베리를 더 받아요.<br>시합장에서는 문제를 맞혀 받는 기본 점수가 ${(item.multiplier + level * .1).toFixed(1)}배가 돼요.<br>베리나무에 한 번 휘두르면 힘 ${power}만큼 깎여서 약 ${Math.ceil(7 / power)}번이면 벨 수 있어요.`; }
function outfitEffectBadges(id: number) {
  const item = OUTFITS[id], badges: string[] = [];
  if (item.berryBonus) badges.push(`<span class="stat-chip berry">🍓 길 베리 +${item.berryBonus}</span>`);
  if (item.xpBonus) badges.push(`<span class="stat-chip xp">✦ 몬스터 경험치 +${item.xpBonus}</span>`);
  if (item.clearBonus) badges.push(`<span class="stat-chip clear">🏁 단계 통과 +${item.clearBonus}베리</span>`);
  if (!badges.length) badges.push('<span class="stat-chip basic">🌿 편안한 기본 의상</span>');
  return `<div class="stat-chips">${badges.join('')}</div>`;
}
function rideEffectBadges(id: number) { const item = RIDES[id]; return `<div class="stat-chips"><span class="stat-chip speed">➜ 걷기보다 ${item.speed}배 빠름</span><span class="stat-chip ${item.flying ? 'fly' : 'ground'}">${item.flying ? '🪽 물과 장애물 위로 비행' : '🐾 땅 위를 빠르게 달림'}</span></div>`; }
function petEffectBadges(id: number) { const item = PETS[id]; return `<div class="stat-chips"><span class="stat-chip pet-range">🍓 ${item.radius}칸 안의 베리 발견</span><span class="stat-chip pet-move">🐾 직접 가서 한 번만 수집</span>${item.flying ? '<span class="stat-chip pet-fly">🪽 땅 위를 둥실 날아서 따라와요</span>' : ''}${id === HERO_BREAD_PET_ID ? '<span class="stat-chip pet-hero">✨ 캐릭터 주위에 황금빛 광채</span><span class="stat-chip pet-hero">👑 현재 가장 넓은 수집 범위</span>' : ''}</div>`; }
function itemColor(color: number) { return `#${color.toString(16).padStart(6, '0')}`; }
function toast(message: string) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2400); }
function persist() {
  if (!state) return;
  if (world.inHomestead) { const p = world.player.position; state.homestead.position = savedGardenPosition(p.x, p.z); }
  if (!world.inRoom && !world.inHomestead && !world.inMarket && !world.inAcademy) { const p = world.player.position; state.position = { x: p.x, z: p.z }; }
  const written = saveStore.write(state);
  if (written) {
    saved = structuredClone(state);
    if (!state.teacherMode) { try { const raw = JSON.stringify(updateLocalRanks(parseLocalRanks(localStorage.getItem(RANKING_STORAGE)), state.nickname, state.expedition.completed)); if (localStorage.getItem(RANKING_STORAGE) !== raw) localStorage.setItem(RANKING_STORAGE, raw); } catch { /* Rank storage cannot invalidate the game save. */ } }
  }
  if (saveStore.status === 'error' && !storageError) toast('자동 저장에 실패했어요. 설정에서 저장 파일을 내려받아 주세요.');
  storageError = saveStore.status === 'error'; renderSaveStatus();
}
function refresh() {
  if (!state) return; syncDiscoveries(state); const s = state, journey = journeyFor(s), forestName = FOREST_INFO[s.forest].name;
  audio.setScene(journey.stage === 0 || s.homestead.inside || s.room.inside ? 'village' : s.forest); // 숲마다 다른 배경음악
  const suggested = recommendAdventure(s, curriculumRegions(), () => true);
  todayButton.textContent = world?.inHomestead ? '🏡 마을 꾸미기' : `🧭 ${suggested.title}`; todayButton.title = '오늘의 모험 하나 추천받기';
  petCareButton.hidden = s.pet < 0;plazaReturn.hidden=!world?.inMarket&&!world?.inAcademy;
  const activeTitle = s.curriculum.graduationClaimed ? `${s.grade}학년 수학 탐험가` : s.expedition.selectedTitle ? EXPEDITION_TITLES[s.expedition.selectedTitle].name : s.multiplicationCompleted ? '곱셈숲 탐험가' : '';
  $('#level').textContent = `${s.level}`; $('#nickname').textContent = `${s.nickname}${activeTitle ? ` · ${activeTitle}` : ''}${s.teacherMode ? ' · 선생님' : ''}`; $('#berries').textContent = s.berries.toLocaleString();
  $('#xp-fill').style.width = `${s.xp / (s.level * 40) * 100}%`; $('#xp-text').textContent = `경험치 ${s.xp} / ${s.level * 40}`;
  $('#weapon-name').textContent = `${WEAPONS[s.weapon].icon} ${WEAPONS[s.weapon].name} +${s.weapons[s.weapon]} · ${OUTFITS[s.outfit].name}`;
  $('#weapon-effect').textContent = equipmentEffectText(s);
  const expedition = s.forest === 'division' ? s.expedition.active : null;
  $('.location-pill').innerHTML = world?.inAcademy ? '🏛 모험학교 <span>배움의 홀 · 스킬과 수련</span>' : world?.inMarket ? '🛍️ 상점거리 <span>여섯 가게 · 몬스터 없는 쉼터</span>' : world?.inHomestead ? '🏡 나의 집 <span>직접 만든 정원 · 주민과 펫의 쉼터</span>' : world?.inRoom ? '⌂ 나의 집 <span>가구를 눌러 꾸며요</span>' : journey.stage ? `${s.forest === 'division' ? '❋' : FOREST_INFO[s.forest].icon} ${journey.stage}단계 숲 <span>${expedition?.stage === journey.stage ? '✦ 별빛 원정' : `${forestName} · ${STAGES[journey.stage - 1].name}`}</span>` : '🌿 중앙 광장 <span>선생님과 만나는 모험의 출발점</span>';
  expeditionButton.hidden = true;
  renderCurrentFocus();renderAcademyBar();
  audio.music = s.settings.music; audio.effects = s.settings.sound;
}
function syncAvatar() { if (state) { world.setAvatar(state.character, state.outfit, state.weapon, state.outfits[state.outfit], state.weapons[state.weapon], state.ride, state.pet, state.hairstyle, state.face); world.dressPet(state.pet >= 0 && !!state.petFriends[state.pet]?.accessory); } }
function openGarden() {
  if (!state) return;
  rememberMenu('meadow', openGarden);
  if (!state) return;
  const s = state, garden = gardenOf(s), seeds = garden.rescued - garden.flowers.filter(f => f >= 0).length;
  openModal(title('목장주인 가현이의 부탁', '구름양 돌봄 목장') + `<p>양들을 똑같이 나눠 우리로 데려다주면 가현이가 꽃씨를 선물해 줘요. 꽃은 기다리지 않아도 바로 피어나요!</p><p class="garden-progress">🐑 구출 ${garden.rescued} / 3 · 🌱 받은 꽃씨 ${seeds}개</p><div class="flower-plots">${garden.flowers.map((f, i) => `<button class="flower-plot" data-plot="${i}" aria-label="${i + 1}번 화단 ${f < 0 ? '꽃 심기' : '꽃 바꾸기'}"><span>${f < 0 ? '🌱' : FLOWERS[f]}</span>${f < 0 ? '꽃 심기' : '꽃 바꾸기'}</button>`).join('')}</div><p id="garden-message" role="status">${garden.rescued === 3 ? '🏅 가현이의 구름양 지킴이! 세 가지 구출을 모두 해냈어요.' : '가현이와 첫 번째 구출부터 차근차근 도전해요.'}</p><button id="rescue-start" class="primary wide">${garden.rescued < 3 ? `🐑 가현이의 부탁: ${RESCUES[garden.rescued].name}` : '🐑 다시 나눠 보기 (연습)'}</button>`, 'garden-modal');
  $('#rescue-start').onclick = () => openRescue(garden.rescued < 3 ? garden.rescued : 0);
  document.querySelectorAll<HTMLButtonElement>('[data-plot]').forEach(button => button.onclick = () => {
    const slot = Number(button.dataset.plot);
    if (garden.flowers[slot] < 0 && !seeds) { $('#garden-message').textContent = '양들을 구하면 꽃씨를 받을 수 있어요! 아래 구출 버튼을 눌러 주세요.'; return; }
    openModal(title('내가 고르는 꽃', `${slot + 1}번 화단 꾸미기`) + `<p>좋아하는 꽃을 골라요. 나중에 무료로 바꿀 수도 있어요.</p><div class="flower-plots">${FLOWERS.map((flower, i) => `<button class="flower-plot" data-flower="${i}"><span>${flower}</span>${['튤립', '해바라기', '벚꽃'][i]}</button>`).join('')}</div><button id="garden-back" class="secondary wide">화단으로 돌아가기</button>`, 'garden-modal');
    $('#garden-back').onclick = openGarden;
    document.querySelectorAll<HTMLButtonElement>('[data-flower]').forEach(b => b.onclick = () => { if (plantFlower(s, slot, Number(b.dataset.flower))) { persist(); audio.play('berry'); openGarden(); } });
  });
}
function openRescue(round: number) {
  if (!state) return;
  rememberMenu('rescue', () => openRescue(round));
  if (!state) return;
  const s = state, quest = RESCUES[round], pens = Array<number>(quest.groups).fill(0);
  openModal(title('구름양 구출 작전', quest.name) + `<p>${quest.story}</p><p class="garden-progress">양 ${quest.total}마리 ÷ 우리 ${quest.groups}개 = 우리마다 몇 마리?</p><div id="sheep-meadow" class="sheep-meadow" aria-label="남은 양"></div><p>우리의 <b>한 마리 데려오기</b>를 눌러요. 잘못 넣으면 돌려보낼 수 있어요.</p><div class="sheep-pens">${pens.map((_, i) => `<section class="sheep-pen"><h3>${i + 1}번 우리 <span id="pen-count-${i}"></span></h3><div id="pen-sheep-${i}" class="pen-flock"></div><button data-add="${i}" class="secondary">한 마리 데려오기</button><button data-undo="${i}" class="text-button">한 마리 돌려보내기</button></section>`).join('')}</div><p id="rescue-message" role="status" aria-live="polite">모든 우리에 같은 수의 양을 넣어 주세요.</p><button id="rescue-check" class="primary wide">모두 집에 도착했나요?</button><button id="rescue-hint" class="text-button">💡 도움이 필요해요</button><button id="rescue-back" class="text-button">← 목장주인 가현이에게 돌아가기</button>`, 'garden-modal');
  const draw = () => {
    const remaining = quest.total - pens.reduce((a, b) => a + b, 0);
    $('#sheep-meadow').textContent = `${'🐑'.repeat(remaining)} ${remaining ? `남은 양 ${remaining}마리` : '모두 우리에 들어갔어요!'}`;
    pens.forEach((n, i) => { $(`#pen-count-${i}`).textContent = `${n}마리`; $(`#pen-sheep-${i}`).textContent = '🐑'.repeat(n); });
    document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach(b => b.disabled = remaining === 0);
    document.querySelectorAll<HTMLButtonElement>('[data-undo]').forEach(b => b.disabled = pens[Number(b.dataset.undo)] === 0);
  };
  document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach(b => b.onclick = () => { if (pens.reduce((a, n) => a + n, 0) < quest.total) pens[Number(b.dataset.add)]++; draw(); });
  document.querySelectorAll<HTMLButtonElement>('[data-undo]').forEach(b => b.onclick = () => { const i = Number(b.dataset.undo); if (pens[i]) pens[i]--; draw(); });
  $('#rescue-hint').onclick = () => { $('#rescue-message').textContent = `우리 ${quest.groups}개에 한 마리씩 차례대로 넣어 보세요. 한 바퀴 돌 때마다 ${quest.groups}마리가 집에 가요!`; };
  $('#rescue-back').onclick = openGarden;
  $('#rescue-check').onclick = () => {
    if (!pens.every(n => n === quest.total / quest.groups)) { $('#rescue-message').textContent = pens.reduce((a, n) => a + n, 0) < quest.total ? '아직 들판에 양이 남아 있어요. 모두 집으로 데려가 볼까요?' : '양들이 들어간 수가 달라요. 많은 우리에서 적은 우리로 옮겨 보세요!'; return; }
    const rewarded = rescueSheep(s, round, pens); persist(); audio.play('level'); world.celebrate();
    openModal(title('모두 무사히 돌아왔어요!', '가현이의 구출 성공!') + `<div class="rescue-success">🐑 🌷 🐑</div><p class="garden-progress">${quest.total} ÷ ${quest.groups} = ${quest.total / quest.groups}</p><p>우리마다 ${quest.total / quest.groups}마리씩! ${rewarded ? '고마운 가현이가 꽃씨 1개를 선물했어요.' : '다시 한번 똑같이 나누는 데 성공했어요! 연습에서는 꽃씨를 더 받지 않아요.'}</p><button id="rescue-reward" class="primary wide">가현이의 목장으로 가기 🌱</button>`, 'garden-modal');
    $('#rescue-reward').onclick = openGarden;
  };
  draw();
}
function closeModal() { if (!keepingMenus) menuHistory.clear(); menuPending = false; audio.setBattle(false); stopSpeech(); preview?.dispose(); preview = null; curriculumRun = null; $('#modal').classList.remove('shop-modal'); ($('#modal') as HTMLDialogElement).close(); if (world!) { world.setPaused(!state); world.clearInput(); } if (modalOpener?.isConnected && !modalOpener.closest('[hidden]')) modalOpener.focus(); }
function openModal(html: string, cls = '') {
  preview?.dispose(); preview = null; if (world!) { world.setPaused(true); world.clearInput(); }
  const dialog = $('#modal') as HTMLDialogElement; if (!dialog.open) modalOpener = document.activeElement as HTMLElement;
  const tracked = menuPending, parent = tracked ? (menuHistory.hasParent ? previousMenu : null) : menuHistory.current;
  menuPending = false;
  dialog.className = cls; $('#modal-content').innerHTML = `<div class="modal-navigation"><button id="modal-back" type="button" class="secondary" ${!battle && !parent ? 'hidden' : ''}>${battle ? '게임으로 돌아가기' : '← 이전 메뉴'}</button></div>`+html; if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  $('#modal-back').onclick=()=>{if(battle){exitBattle();return;}if(parent)parent();else closeModal();};
  $('#modal-content').querySelectorAll<HTMLElement>('[data-close]').forEach(el => {
    if (el.classList.contains('close')) el.setAttribute('aria-label','게임으로 돌아가기');
    else if (/돌아가기|^닫기$|^뒤로가기$/.test(el.textContent ?? '')) el.textContent='게임으로 돌아가기';
    el.onclick = () => { if (battle) exitBattle(); else closeModal(); };
  });
}
function title(kicker: string, name: string) { return `<div class="modal-heading"><div><span class="eyebrow">${kicker}</span><h2>${name}</h2></div><button class="close" data-close aria-label="닫기">×</button></div>`; }
($('#modal') as HTMLDialogElement).addEventListener('cancel', e => { e.preventDefault(); if (battle) exitBattle(); else closeModal(); });

function openFeedback() { showFeedback(openModal, title, closeModal); }

function openCopyrightNotice() {
  openModal(title('저작권과 이용 안내', '베리숲을 즐겁고 안전하게 이용해요') + `<div class="legal-notice">
    <p class="legal-owner">© ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER}. <b>베리숲 모험학교</b>. All rights reserved.</p>
    <section><span aria-hidden="true">🌿</span><div><strong>등장인물의 이름은 가명이에요</strong><p>게임에 등장하는 모든 인물의 이름은 가명이며, 실제 인물을 가리키지 않습니다. 저작권자 표시는 제작자 명의입니다.</p></div></section>
    <section><span aria-hidden="true">🏫</span><div><strong>이렇게 이용해도 돼요</strong><p>공식 게임 링크를 학생·보호자·다른 선생님에게 공유하고, 비영리 수업과 가정에서 직접 플레이할 수 있어요.</p></div></section>
    <section><span aria-hidden="true">🚫</span><div><strong>무단 복제는 안 돼요</strong><p>소스 코드, 문제와 글, 그래픽과 음악을 허락 없이 복사·수정·재배포·재호스팅하거나 상업적으로 이용할 수 없어요. 저작권 표시를 삭제해서도 안 돼요.</p></div></section>
    <section><span aria-hidden="true">🧩</span><div><strong>외부 기술은 각각의 조건을 따라요</strong><p>Three.js 등 외부 오픈소스 구성 요소는 각 제작자의 라이선스가 적용됩니다. 이 안내는 법률이 보장하는 정당한 이용을 제한하지 않습니다.</p></div></section>
    <p class="note">다른 사이트에 게임을 복사해 올리거나 자료를 활용하고 싶다면 제작자의 서면 허락을 먼저 받아 주세요.</p>
    <button class="primary wide" data-close>확인했어요</button>
  </div>`, 'legal-modal');
}

async function showStartPreview(index: number) {
  const request = ++startPreviewRequest, target = $('#start-avatar');
  if (!startPreview) target.innerHTML = '<span class="start-preview-loading">3D 캐릭터를 불러오는 중…</span>';
  try {
    const module = await import('./world');
    if (request !== startPreviewRequest || $('#start-screen').hidden) return;
    AvatarPreviewRuntime = module.AvatarPreview;
    if (!startPreview) { target.textContent = ''; startPreview = new module.AvatarPreview(target); }
    startPreview.show(index, 0, 0, 0, 0, CHARACTERS[index].style);
    try {
      startPortraits ??= module.characterPortraits();
      document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach((button, i) => {
        if (button.querySelector('.character-thumb')) return;
        const portrait = document.createElement('img'); portrait.className = 'character-thumb'; portrait.alt = '';
        portrait.src = startPortraits![i]; button.prepend(portrait);
      });
    } catch { /* Character names and the large animated 3D preview remain available. */ }
  } catch {
    if (request === startPreviewRequest) target.innerHTML = '<span class="start-preview-loading">3D 미리보기를 표시할 수 없어요. 그래픽 가속을 켜고 새로고침해 주세요.</span>';
  }
}
function showStart() {
  stopAmbienceCycle(); if (world!) { world.setActive(false); } startPreviewRequest++; startPreview?.dispose(); startPreview = null; $('#hud').hidden = true; $('#start-screen').hidden = false;
  $('#start-screen').innerHTML = `<section class="welcome-card"><div class="logo-mark">✿</div><span class="eyebrow">작은 모험, 자라는 생각</span><h1>베리숲<br><span>모험학교</span></h1><p class="intro">숲에서 발견하고, 나만의 마을을 꾸며요.<br>수학으로 숲의 작은 약속을 풀어 보세요.</p><label class="name-label grade-label">몇 학년 모험을 떠날까요?</label><div class="grade-picker" role="radiogroup" aria-label="학년 선택">${([1,2,3,4,5,6] as SchoolGrade[]).map(grade => `<button type="button" data-grade="${grade}" role="radio" aria-checked="${selectedGrade === grade}" class="${selectedGrade === grade ? 'selected' : ''}">${grade}<small>학년</small></button>`).join('')}</div><div id="start-avatar" class="start-avatar"></div><div class="character-picker" role="group" aria-label="캐릭터 선택">${CHARACTERS.map((c, i) => `<button class="character-choice ${i === selected ? 'selected' : ''}" data-character="${i}" aria-pressed="${i === selected}"><span class="character-dot" style="--hair:#${c.hair.toString(16)};--skin:#${c.skin.toString(16)}">${['✿', '●', '☾', '✦'][i]}</span>${c.name}</button>`).join('')}</div><p id="character-desc" class="subtle">${CHARACTERS[selected].desc} · 능력은 모두 같아요</p><label class="name-label" for="nickname-input">모험가의 이름</label><input id="nickname-input" maxlength="10" placeholder="닉네임을 적어 주세요" autocomplete="off"><p id="start-error" class="error" role="alert"></p><button class="primary start-button" id="new-game">${saved ? '새 모험 시작' : '숲으로 출발하기'} <span>→</span></button>${saved ? `<button class="secondary wide" id="continue">${escape(saved.nickname)} · ${saved.grade}학년 · Lv.${saved.level} 이어하기</button>` : ''}<button class="secondary wide main-feedback" id="start-feedback">✉ 의견 보내기</button><button class="text-button" id="start-import">저장 파일 불러오기</button><small class="save-note">이 기기와 브라우저에 모험이 저장돼요</small><button class="legal-link" id="start-legal">© ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER} · 저작권과 이용 안내</button></section><div class="start-world-caption"><span>❋</span> 오늘도, 새로운 모험이 기다려요</div>`;
  void showStartPreview(selected);
  document.querySelectorAll<HTMLButtonElement>('[data-grade]').forEach(button => button.onclick = () => { selectedGrade = Number(button.dataset.grade) as SchoolGrade; document.querySelectorAll<HTMLButtonElement>('[data-grade]').forEach(item => { const on = item === button; item.classList.toggle('selected', on); item.setAttribute('aria-checked', String(on)); }); });
  document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(b => b.onclick = () => { selected = Number(b.dataset.character); document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(x => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); }); $('#character-desc').textContent = `${CHARACTERS[selected].desc} · 능력은 모두 같아요`; void showStartPreview(selected); });
  $('#new-game').onclick = () => {
    const nickname = $('#nickname-input') as HTMLInputElement; let next: Save;
    try { next = newSave(nickname.value, selected, selectedGrade); } catch (e) { $('#start-error').textContent = (e as Error).message; nickname.focus(); return; }
    if (saved) confirmAction('새 모험을 시작할까요?', '현재 저장된 모험이 새 모험으로 바뀌어요. 먼저 저장 파일을 내려받을 수도 있어요.', () => begin(next, true), true); else begin(next, true);
  };
  $('#nickname-input').onkeydown = e => { if (e.key === 'Enter') $('#new-game').click(); };
  // 태블릿·휴대폰 화면 키보드가 올라오면 '숲으로 출발하기' 버튼이 가려지지 않게 화면을 끌어올려요.
  $('#nickname-input').onfocus = () => { for (const delay of [350, 700]) setTimeout(() => $('#new-game').scrollIntoView({ block: 'center', behavior: 'smooth' }), delay); };
  if (saved) $('#continue').onclick = () => begin(structuredClone(saved!), false);
  $('#start-import').onclick = () => ($('#import-file') as HTMLInputElement).click();
  $('#start-legal').onclick = openCopyrightNotice; $('#start-feedback').onclick = openFeedback;
  if (saveStore.status === 'recovered') $('#start-error').textContent = '이전 저장이 손상되어 직전 정상 기록을 찾았어요. 이어하기로 복구할 수 있어요.';
  if (storageError) $('#start-error').textContent = '이전 저장을 읽지 못했어요. 저장 파일을 불러오거나 새 모험을 시작할 수 있어요.';
}
async function begin(s: Save, fresh: boolean, imported = false) {
  const launch = document.querySelector<HTMLButtonElement>('#new-game, #continue'); if (launch) { launch.disabled = true; launch.textContent = '숲을 준비하고 있어요…'; }
  try { await loadWorld(); } catch { $('#start-error').textContent = '3D 숲을 열지 못했어요. 최신 Chrome 또는 Edge에서 다시 시도해 주세요.'; if (launch) launch.disabled = false; return; }
  if (fresh || imported || saveStore.status === 'recovered') { try { resetLearningRecords(localStorage); } catch { /* optional history */ } }
  adaptiveLevels.clear();
  sessionExpired = false; sessionElapsed = 0; sessionCorrect = 0; sessionWrong = 0;
  closeModal(); startPreviewRequest++; startPreview?.dispose(); startPreview = null; state = s; preview?.dispose(); preview = null; $('#start-screen').hidden = true; $('#hud').hidden = false;
  academyProgress=fresh?emptyAcademy(s):readAcademy(localStorage,s);if(fresh)keepAcademy();world.resetSkills();world.onAcademyTrial=id=>{if(academyProgress&&practiceSkill(academyProgress,id)){keepAcademy();audio.play('level');toast(`✦ ${skillInfo(id).name} 수련 완료! 기록실에 추억을 남겼어요.`);renderAcademyBar();}};
  world.restore(s); world.dressPet(s.pet >= 0 && !!s.petFriends[s.pet]?.accessory); world.setActive(true); audio.music = s.settings.music; audio.effects = s.settings.sound; startAmbienceCycle(); audio.start(); refresh(); persist();
  if (fresh) {
    try { localStorage.setItem('berry-forest-navigation-intro','2026-10'); } catch { /* Optional guide preference only. */ }
    switchStage(0); world.guideTo('guide'); toast('중앙 광장에 왔어요! 선생님을 만나고, 왼쪽 상점거리 · 오른쪽 나의 집 · 아래쪽 모험 길을 골라요.');
  } else {
    // 이어하기에서는 안내 창을 띄우지 않아요. 도움말은 모험 수첩에 있어요.
  }
  if (!fresh && shouldRemindBackup(localStorage, s.level)) setTimeout(() => toast('💾 설정(⚙)에서 저장 파일을 내려받아 두면 기기를 바꿔도 모험을 지킬 수 있어요.'), 3500);
}
function showSessionSummary() {
  if (!state) return; sessionExpired = false; world.setPaused(true); world.clearInput(); persist();
  const mins = Math.floor(sessionElapsed / 60), secs = sessionElapsed % 60;
  const insight = learningInsight(state);
  openModal(title('오늘의 모험 정리', '오늘도 한 뼘 자랐어요!') + `<div class="arena-intro"><div class="arena-symbol">🌟</div><p>함께한 시간 <b>${mins}분 ${secs}초</b><br>맞힌 문제 <b>${sessionCorrect}개</b> · 다시 도전한 문제 <b>${sessionWrong}개</b></p><div class="learning-insight"><p><b>👍 잘 이해한 내용</b>${escape(insight.strong)}</p><p><b>🌱 다시 연습할 내용</b>${escape(insight.review)}</p><p><b>🧭 추천 임무</b>${escape(insight.recommend)}</p></div><p class="note">점수보다 어떤 생각이 자랐는지를 먼저 보여 줘요.</p><button class="secondary wide" id="session-review">학습 기록과 복습 보기</button><button class="primary wide" id="session-finish">오늘은 여기까지</button></div>`);
  $('#session-review').onclick = () => openNotebook();
  $('#session-finish').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
function learningInsight(s: Save) {
  const attempted = curriculumRegions().map(region => { const p = s.curriculum.units[region.id], total = p.correct + p.wrong; return { name: region.name, total, rate: total ? p.correct / total : -1 }; }).filter(item => item.total > 0);
  const strong = attempted.filter(item => item.total >= 3 && item.rate >= .8).sort((a, b) => b.rate - a.rate)[0]?.name ?? '조금 더 풀면 잘 이해한 내용을 찾을 수 있어요';
  const needs = attempted.filter(item => item.rate < .8).sort((a, b) => a.rate - b.rate)[0];
  const next = curriculumRegions().find(region => !curriculumUnitComplete(s, region.id));
  return { strong, review: needs?.name ?? '틀린 문제 기록이 쌓이면 알려 줄게요', recommend: next ? `${next.name}의 다음 열린 단계` : `${s.grade}학년 졸업 모험 다시 도전하기` };
}
const GRADE_OVERVIEW: Record<SchoolGrade, string> = {
  1: '9까지와 100까지의 수, 모으기와 가르기, 덧셈과 뺄셈, 여러 가지 모양, 시계, 규칙 찾기',
  2: '네 자리 수, 덧셈과 뺄셈, 곱셈구구, 길이 재기, 시각과 시간, 여러 가지 도형, 규칙 찾기, 표와 그래프',
  3: '계산, 도형, 길이와 시간, 분수와 소수, 원, 측정, 그림그래프',
  4: '큰 수, 곱셈과 나눗셈, 각도, 분수와 소수의 덧셈·뺄셈, 삼각형·사각형·다각형, 규칙, 막대·꺾은선그래프',
  5: '약수와 배수, 혼합 계산, 분수와 소수의 계산, 합동과 대칭, 둘레와 넓이, 평균과 가능성',
  6: '분수와 소수의 나눗셈, 비와 비율, 비례식, 원의 넓이, 입체도형, 띠그래프와 원그래프'
};
function openTodayAdventure() {
  if (!state || storyActivityOpen || battle || curriculumRun) return;
  rememberMenu('today', openTodayAdventure);
  const choice = recommendAdventure(state, curriculumRegions(), () => true);
  openModal(title('🧭 오늘의 모험 하나', choice.title) + `<div class="adventure-intro"><span aria-hidden="true">${choice.kind === 'project' ? '🌷' : choice.kind === 'review' || choice.kind === 'calculation' ? '🌱' : '🧭'}</span><p>${escape(choice.detail)}</p><p class="note">다른 모험을 골라도 괜찮아요. 쉬었다 와도 기록은 남아요.</p></div><button id="adventure-go" class="primary wide">${choice.kind === 'guide' ? '길 안내 시작하기' : '이 모험 해 보기'} →</button><button id="adventure-help" class="secondary wide">이동과 조작 방법 보기</button><button class="text-button wide" data-close>자유롭게 둘러볼게요</button>`, 'adventure-modal');
  $('#adventure-help').onclick = openGuide;
  const choices = document.createElement('div'); choices.className='nav-links';
  choices.innerHTML='<button id="adventure-choose" class="secondary">다른 모험 고르기</button><button id="adventure-daily" class="secondary">오늘의 미션·보상</button>';
  $('#adventure-go').after(choices);
  $('#adventure-choose').onclick=openAdventureMap; $('#adventure-daily').onclick=openDaily;
  $('#adventure-go').onclick = () => {
    if (!state) return;
    if (choice.kind === 'guide') {
      closeModal(); let name = world.guideTo(choice.guide);
      if (!name && !world.inRoom && journeyFor(state).stage > 0) { switchStage(0); name = world.guideTo(choice.guide); }
      toast(name ? `🧭 ${name}까지 화살표를 따라가요!` : '가까운 친구를 만나거나 지도를 열어 모험을 골라요.');
    } else if (choice.kind === 'story') openStoryBoard();
    else if (choice.kind === 'review' && choice.unit) void startCurriculumReview(choice.unit);
    else if (choice.kind === 'calculation') openReview();
    else if (choice.kind === 'project') openVillageProjects();
    else if (choice.kind === 'expedition') openExpeditionBoard();
    else if (choice.kind === 'region' && choice.unit) {
      if (NEW_CURRICULUM_UNITS.includes(choice.unit as NewCurriculumUnitId)) void openCurriculumUnit(choice.unit as NewCurriculumUnitId);
      else openStageMap(choice.unit as ForestKind);
    }
    if (choice.kind === 'guide' && matchMedia('(max-width: 600px)').matches) setQuestCollapsed(true);
  };
}
function openVillageProjects() {
  if (!state) return;
  rememberMenu('projects', openVillageProjects);
  if (!state) return;
  const s = state, blocked = !!s.expedition.active || !!s.story.active;
  openModal(title('🌷 수학으로 달라지는 숲', '정원 만들기 놀이') + `<p>직접 세고, 길이를 맞추고, 똑같이 나누면 마을에 새 장소가 생겨요.</p>${blocked ? '<p class="note">진행 중인 편지나 별빛 원정을 마친 뒤 마을 만들기를 시작해요.</p>' : ''}<div class="village-project-list">${VILLAGE_PROJECTS.map((project, id) => {
    const done = s.adventure.completed.includes(id), active = s.adventure.active?.project === id, available = id === s.adventure.completed.length;
    return `<section class="village-project-card"><span>${project.icon}</span><div><strong>${project.name}</strong><small>${done ? project.result : active ? '만들던 모습이 저장되어 있어요' : available ? '지금 함께 만들 수 있어요' : '앞의 장소를 먼저 완성해요'}</small></div><button data-project="${id}" ${!done && (blocked || !available) ? 'disabled' : ''}>${done ? '다시 꾸미기' : active ? '이어 하기' : '만들기'}</button></section>`;
  }).join('')}</div><button class="text-button wide" data-close>마을로 돌아가기</button>`, 'adventure-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-project]').forEach(button => button.onclick = () => {
    const id = Number(button.dataset.project); if (!state) return;
    if (state.adventure.completed.includes(id)) {
      if (state.expedition.active || state.story.active) { toast('진행 중인 모험을 마친 뒤 마을에서 구경해요.'); return; }
      if (state.adventure.active) { toast('만들던 장소를 먼저 마쳐 주세요.'); return; }
      if (!redesignProject(state, id)) return; if(!enterHomeGarden()) return; persist(); renderVillageProject(); return;
    }
    if (blocked || (!state.adventure.active && !beginProject(state, id))) return;
    if (!enterHomeGarden()) return;
    persist(); renderVillageProject();
  });
}
function renderVillageProject(message = '', hint = false) {
  if (!state?.adventure.active) return;
  const work = state.adventure.active, project = VILLAGE_PROJECTS[work.project], spec = workSpec(work), sum = work.values.reduce((a, b) => a + b, 0);
  const focused = document.activeElement?.id;
  const focusedDesign = (document.activeElement as HTMLElement)?.dataset.design, focusedValue = (document.activeElement as HTMLElement)?.dataset.value;
  const focusedFlower = (document.activeElement as HTMLElement)?.dataset.flowerCell, focusedBasket = (document.activeElement as HTMLElement)?.dataset.fruitBasket;
  const visual = work.project === 0 ? `<div class="project-grid" style="--columns:${spec.columns}" aria-label="${spec.rows}줄에 ${spec.columns}칸인 꽃밭">${Array.from({ length: spec.target }, (_, i) => `<button data-flower-cell="${i}" aria-label="${i + 1}번째 꽃 자리까지 심기" class="${i < sum ? 'filled' : ''}">${i < sum ? ['🌷', '🌼', '🪻'][work.design.color] : '·'}</button>`).join('')}</div>`
    : work.project === 1 ? `<div class="project-path ${work.design.curved ? 'curved' : 'straight'}" role="img" aria-label="${sum}개로 만든 길 ${sum * spec.step}미터">${Array.from({ length: Math.min(sum, spec.max) }, () => '<span>🪨</span>').join('') || '🌱'}<strong>만든 길 ${sum * spec.step} m</strong></div>`
    : `<div class="project-baskets">${work.values.map((n, i) => `<div><button data-fruit-basket="${i}" draggable="${n > 0}" aria-label="${i + 1}번 바구니 선택 또는 과일 놓기"><b>${i + 1}번 바구니</b><p>${'🍎'.repeat(n) || '🧺'}</p></button></div>`).join('')}</div>`;
  const designControls = work.project === 0 ? `<fieldset class="design-options"><legend>꽃밭 모양</legend>${designOptions(0, work.grade).map(rows => `<button data-design="rows" data-value="${rows}" aria-pressed="${work.design.rows === rows}">${rows}줄 · ${spec.target / rows}칸</button>`).join('')}<div>${['분홍 꽃', '노란 꽃', '보라 꽃'].map((color, id) => `<button data-design="color" data-value="${id}" aria-pressed="${work.design.color === id}">${color}</button>`).join('')}</div></fieldset>`
    : work.project === 1 ? `<fieldset class="design-options"><legend>길 모양 · 길이와 돌 수는 같아요</legend>${[false, true].map(curved => `<button data-design="curved" data-value="${curved}" aria-pressed="${work.design.curved === curved}">${curved ? '굽은 길' : '곧은 길'}</button>`).join('')}</fieldset>`
    : `<fieldset class="design-options"><legend>바구니 수</legend>${designOptions(2, work.grade).map(count => `<button data-design="baskets" data-value="${count}" aria-pressed="${work.design.baskets === count}">${count}개</button>`).join('')}</fieldset><button id="fruit-source" draggable="true">🍎 남은 과일 ${spec.max - sum}개 · 선택하기</button><p class="note">과일이나 바구니를 선택하고 다른 바구니를 누르면 하나를 옮겨요. 끌어 놓거나 아래 ＋·− 버튼을 써도 돼요.</p>`;
  openModal(title(`${project.icon} 우리 마을 만들기`, project.name) + `<p class="project-task">${spec.task}</p>${designControls}${work.project === 0 ? '<p class="note">꽃 자리를 눌러 그 자리까지 심거나, 꽃을 끌어 놓아 보세요. 아래 ＋·−로 한 송이씩 세어도 좋아요.</p><button id="flower-source" draggable="true">🌱 꽃 선택하기</button>' : ''}${visual}<div class="project-controls">${work.values.map((value, i) => `<section><label>${spec.groups > 1 ? `${i + 1}번 바구니` : '필요한 수'}<output>${value}${spec.unit}</output></label><div><button id="project-minus-${i}" data-project-group="${i}" data-project-direction="-1" aria-label="${i + 1}번 수 1 줄이기" ${value === 0 ? 'disabled' : ''}>−</button><button id="project-plus-${i}" data-project-group="${i}" data-project-direction="1" aria-label="${i + 1}번 수 1 늘리기" ${value >= spec.max || spec.groups > 1 && sum >= spec.max ? 'disabled' : ''}>＋</button></div></section>`).join('')}</div>${spec.groups > 1 ? `<p>남은 과일 ${spec.max - sum}개</p>` : ''}<p class="project-feedback" role="status">${message || '더하고 덜어내며 생각해요. 중간 모습도 바로 저장돼요.'}</p>${hint ? `<p class="recovery-help">💡 ${spec.hint}</p>` : ''}<button id="project-check" class="primary wide">이렇게 완성하기</button><button id="project-hint" class="text-button wide">💡 다른 방법으로 생각하기</button><button id="project-back" class="text-button wide">저장하고 다음에 이어 하기</button>`, 'adventure-modal');
  const flowerSource = document.querySelector<HTMLButtonElement>('#flower-source'); if (flowerSource) { flowerSource.onclick = () => { $('.project-feedback').textContent = '꽃을 놓을 자리를 골라요.'; }; flowerSource.ondragstart = e => { e.dataTransfer?.setData('text/plain', 'flower'); }; }
  const updateProject = () => { if (!state) return; persist(); world.updateStoryVillage(state); renderVillageProject('', hint); };
  document.querySelectorAll<HTMLButtonElement>('[data-design]').forEach(b => b.onclick = () => { if (state && changeDesign(state, b.dataset.design as 'rows' | 'color' | 'curved' | 'baskets', b.dataset.design === 'curved' ? b.dataset.value === 'true' : Number(b.dataset.value))) updateProject(); });
  document.querySelectorAll<HTMLButtonElement>('[data-flower-cell]').forEach(b => {
    const plant = () => { if (!state?.adventure.active) return; const target = Number(b.dataset.flowerCell) + 1; while (state.adventure.active.values[0] !== target) if (!adjustProject(state, 0, state.adventure.active.values[0] < target ? 1 : -1)) break; audio.play('berry'); updateProject(); };
    b.onclick = plant; b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); plant(); };
  });
  let selectedFruit = -2;
  const chooseFruit = (from: number) => {
    if (from >= 0 && !work.values[from]) { selectedFruit = -2; $('.project-feedback').textContent = '남은 과일이나 과일이 있는 바구니를 먼저 골라요.'; return; }
    selectedFruit = from; $('.project-feedback').textContent = from === -2 ? '남은 과일이나 과일이 있는 바구니를 골라요.' : from === -1 ? '남은 과일 하나를 놓을 바구니를 골라요.' : `${from + 1}번에서 옮길 바구니를 골라요.`;
  };
  const source = document.querySelector<HTMLButtonElement>('#fruit-source');
  if (source) { source.onclick = () => chooseFruit(-1); source.ondragstart = e => { selectedFruit = -1; e.dataTransfer?.setData('text/plain', 'fruit'); }; }
  document.querySelectorAll<HTMLButtonElement>('[data-fruit-basket]').forEach(b => {
    const to = Number(b.dataset.fruitBasket);
    const place = () => { if (!state) return; const moved = selectedFruit === -1 ? adjustProject(state, to, 1) : moveFruit(state, selectedFruit, to); if (moved) { audio.play('berry'); updateProject(); } else chooseFruit(to); };
    b.onclick = () => { if (selectedFruit === -2) chooseFruit(to); else if (selectedFruit === to) chooseFruit(-2); else place(); };
    b.ondragstart = e => { chooseFruit(to); e.dataTransfer?.setData('text/plain', 'fruit'); };
    b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); place(); };
  });
  document.querySelectorAll<HTMLButtonElement>('[data-project-group]').forEach(button => button.onclick = () => { if (!state || !adjustProject(state, Number(button.dataset.projectGroup), Number(button.dataset.projectDirection))) return; audio.play(work.project === 1 ? 'chop' : 'berry'); updateProject(); });
  $('#project-hint').onclick = () => renderVillageProject('', true);
  $('#project-back').onclick = openVillageProjects;
  $('#project-check').onclick = () => {
    if (!state) return;
    if (!finishProject(state)) { renderVillageProject(work.project === 2 ? '모든 바구니의 양과 남은 과일을 비교해요. 하나씩 옮겨도 좋아요.' : work.project === 1 ? '만든 길의 길이가 목표와 같은지 확인해요.' : '꽃밭의 모든 칸에 한 송이씩 놓을 수 있는 수인지 다시 세어 봐요.', hint); return; }
    persist(); refresh(); world.updateStoryVillage(state); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) world.celebrate(); audio.play('level');
    openModal(title('🌟 우리가 바꾼 마을', project.name + ' 완성!') + `<div class="adventure-intro"><span>${project.icon}</span><p>${spec.explanation}</p><p>${project.result}</p></div><button id="project-look" class="primary wide">달라진 장소 보러 가기 →</button><button id="project-more" class="secondary wide">다음 마을 만들기 보기</button>`, 'adventure-modal');
    $('#project-look').onclick = () => { closeModal(); world.guideTo(`villageProject${work.project}` as GuideKind); };
    $('#project-more').onclick = openVillageProjects;
  };
  if (focused) document.getElementById(focused)?.focus();
  else if (focusedDesign) document.querySelector<HTMLElement>(`[data-design="${focusedDesign}"][data-value="${focusedValue}"]`)?.focus();
  else if (focusedFlower !== undefined) document.querySelector<HTMLElement>(`[data-flower-cell="${focusedFlower}"]`)?.focus();
  else if (focusedBasket !== undefined) document.querySelector<HTMLElement>(`[data-fruit-basket="${focusedBasket}"]`)?.focus();
}
function openGuide() {
  if (!state) return;
  rememberMenu('help', openGuide);
  navPage('도움말', '<div class="nav-intro"><h3>세 곳만 기억하세요</h3><p>숲에서 발견하고, 나의 집을 꾸미고, 상점에서 취향을 골라요.</p></div><div class="nav-section"><h3>어디에 있나요?</h3><p>이야기 의뢰 → <b>숲으로 모험</b><br>방·정원·주민 → <b>나의 집</b><br>오늘의 미션 → <b>오늘의 모험</b><br>발견·친구·학습 기록 → <b>모험 수첩</b><br>운영자 소식 → <b>광장 입구 공지판</b></p><p>PC: 방향키 또는 WASD로 이동, E로 대화, Space로 점프해요.<br>휴대폰: 왼쪽 조이스틱으로 이동하고 가까이 가서 대화 버튼을 눌러요.</p></div><button class="primary wide" data-nav="map">지도 펼치기</button>',{map:openNavigation});
}
async function loadWorld() {
  if (world!) return;
  try {
    const module = await import('./world'); AvatarPreviewRuntime = module.AvatarPreview; world = new module.World($('#world'));
    world.onCollect = id => { if (!state) return; const value = collectBerry(state, id); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🍓 베리 +${value}`); };
    world.onStar = id => { if (!state || !collectExpeditionStar(state, id)) return; audio.play('berry'); refresh(); persist(); toast(`✦ 별빛 표식 ${state.expedition.active!.stars.length} / 3`); };
    world.onPetWalk = distance => { if (state && walkWithPet(state, distance)) { persist(); const friend = petFriend(state); if ([3, 8, 12].includes(friend.bond)) toast(`🐾 펫과 더 친해졌어요! 인벤토리에서 새 재주와 목걸이를 확인해요.`); } };
    world.onStageLoaded = () => syncShadows();
    world.onJump = () => audio.play('jump'); world.onRescue = () => toast('폭신한 길로 돌아왔어요. 다시 가 볼까요?');
    world.onNear = (name, id) => { nearNpcName = name || nearNpcName; $('#interact').hidden = !name; const verb = actionVerb(id); $('#interact').textContent = name ? id?.startsWith('tree') ? `${name} · F로 휘두르기` : `${name} · ${verb} E` : ''; $('#touch-talk').textContent = verb; $('#touch-attack').hidden = !id?.startsWith('tree'); };
    world.onAttack = id => { if (!state) return; if (!id) { audio.play('swing'); return; } const result = world.hitTree(id, treeDamage(state)); if (!result) return; audio.play('chop'); if (!result.fell) { toast(`통통! 나무가 흔들렸어요 · ${result.remaining}만큼 남았어요`); return; } const reward = (2 + Math.floor(Math.random() * 3)) as 2 | 3 | 4, value = fellTree(state, Number(id.slice(4)), reward); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🌳 나무를 베었어요! 🍓 +${value}베리`); };
    world.onInteract = id => { if (!state || bubbleOpen()) return; if (id === 'storyFriend') { openModal(title('편지 친구 · 솜이', '네 편지를 받고 찾아왔어!') + '<p>흩어진 편지를 모아 줘서 고마워. 이제 마을에서 자주 만나자! 호수 다리와 별빛 쉼터도 함께 구경하고 싶어.</p><button class="primary wide" data-close>또 만나!</button>'); return; } const line = greetingFor(id, Math.random, lineContext()); if (line) { world.setPaused(true); world.clearInput(); showBubble(nearNpcName || '마을 친구', line, () => { world.setPaused(!state); world.clearInput(); handleInteract(id); }, index => audio.talk(index)); return; } handleInteract(id); };
    const handleInteract = (id: string) => { if (!state) return; if(id==='academyGate'){enterAcademy();return;}if(id==='academyExit'){leaveAcademy();return;}if(id==='academyTeacher'||id==='academyBook'||id==='academyPractice'){openAcademyMenu();return;}if(id==='academyRecords'){openAcademyMenu(true);return;} const journey = journeyFor(state); if (id === 'homesteadGate') {if(enterHomeGarden())closeModal();} else if (id === 'homeEditor') openHomestead(); else if (id === 'shopStreet') enterShopStreet(); else if(id==='marketExit') switchStage(0); else if (id === 'homeExit') leaveHomestead(); else if (id.startsWith('homeVisitor')) openHomeVisitor(Number(id.slice(11))); else if (id.startsWith('homeObject')) interactHomeObject(Number(id.slice(10))); else if (id === 'discovery') openCurrentDiscovery(); else if (id.startsWith('forestWork')) openForestWork(Number(id.slice(10))); else if (id.startsWith('trailSeed')) { if (collectTrailSeed(state, Number(id.slice(9)))) { persist(); world.refreshForestTrail(state); refresh(); audio.play('berry'); toast(`✦ 빛씨앗 묶음 ${state.forestTrail.seeds.length}/6 · 나무 등불로 가져가요!`); } } else if (id.startsWith('trailLamp')) openTrailLamp(Number(id.slice(9))); else if (id.startsWith('tree')) world.attack(); else if (id.startsWith('villageProject')) openVillageProjects(); else if (id === 'storyMailbox') openStoryBoard(); else if (id.startsWith('storyClue')) collectStoryClue(Number(id.slice('storyClue'.length))); else if (id === 'storyPuzzle') void startStoryQuestion(); else if (id === 'guide') openPlazaWelcome(); else if (id === 'shepherd') openGarden(); else if (id === 'weapon' || id === 'outfit') openShop(id); else if (id === 'ride') openRideShop(); else if (id === 'pet') openPetShop(); else if (id === 'potion') openPotionShop(); else if (id === 'beauty') openBeauty(); else if (id === 'arena') openArena(); else if (id === 'journey') openAdventureMap(); else if (id === 'room') enterMyRoom(); else if (id === 'roomDecor') openRoom(); else if (id === 'roomExit') { state.room.inside=false; world.enterHomestead(state,true); closeModal(); refresh(); persist(); toast('내 정원으로 돌아왔어요!'); } else if (id === 'village') switchStage(0); else if (id === 'noticeBoard') openNoticeBoard(); else if (id === 'unit') openVillageBoard(); else if (id === 'next') openNextGate(); else if (id.startsWith('expMonster')) { const monsterId = Number(id.slice('expMonster'.length)), monster = stageMonsters(state.journey.stage)[monsterId]; if (state.forest === 'division' && state.expedition.active && monster) startBattle(monster.type, false, id); } else if (id.startsWith('shadow')) { const mistake = shadowList[Number(id.slice(6))]; if (mistake) void startCurriculumReview(mistake.unit, mistake); } else if (id.startsWith('monster')) { const huntId = Number(id.slice(7)); beginHuntBattle(stageMonsters(journey.stage)[huntId].type, id); } };
  } catch (e) {
    root.innerHTML = `<div class="fallback"><h1>숲을 그리지 못했어요</h1><p>3D 화면을 지원하는 최신 Chrome 또는 Edge에서 열어 주세요. 브라우저의 그래픽 가속이 켜져 있는지도 확인해 주세요.</p><button onclick="location.reload()">다시 열기</button></div>`; throw e;
  }
}
$('#interact').onclick = () => world.interact(); $('#touch-talk').onclick = () => world.interact(); $('#touch-attack').onpointerdown = e => { e.preventDefault(); world.attack(); }; $('#touch-jump').onpointerdown = e => { e.preventDefault(); world.jump(); };
function openStoryBoard() {
  if (!state) return;
  rememberMenu('stories', openStoryBoard);
  if (!state) return;
  const s = state, active = s.story.active;
  const cards = STORY_CHAPTERS.map((chapter, id) => {
    const done = s.story.completed.includes(id), unlocked = canEnter(s, chapter.stage, s.forest);
    return `<div class="story-chapter"><span class="story-chapter-icon">${chapter.icon}</span><div><strong>${chapter.title}</strong><small>${s.forest === 'division' ? '나눗셈' : s.forest === 'multiplication' ? '곱셈' : s.forest === 'addition' ? '덧셈' : '뺄셈'}숲 ${chapter.stage}단계 · ${done ? '다시 보기 (보상 없음)' : unlocked ? `첫 완주 선물: ${chapter.gift}` : `${chapter.stage}단계를 먼저 열어 주세요`}</small></div><button data-story-start="${id}" ${!unlocked || !!active || !!s.expedition.active ? 'disabled' : ''}>${done ? '다시 보기' : '시작'}</button></div>`;
  }).join('');
  const progress = active ? `<p class="story-progress"><b>${STORY_CHAPTERS[active.chapter].title}</b> · 단서 ${active.found.length}/3${active.solved ? ' · 문제 해결!' : ''}<br>${s.expedition.active ? '별빛 원정을 마치면 편지 모험을 이어갈 수 있어요.' : '다른 곳에 가거나 새로고침해도 여기부터 이어져요.'}</p><button id="story-continue" class="primary wide" ${s.expedition.active ? 'disabled' : ''}>${active.solved ? '편지 전하고 이야기 마치기' : `${active.forest === 'division' ? '나눗셈' : active.forest === 'multiplication' ? '곱셈' : active.forest === 'addition' ? '덧셈' : '뺄셈'}숲 ${STORY_CHAPTERS[active.chapter].stage}단계로 가기`}</button>` : '';
  openModal(title('숲으로 모험 / 이야기 의뢰', '숲 친구들의 부탁') + `<p class="shop-explainer">안전한 길의 단서 3개를 찾아 수학 문제를 풀어요. 틀려도 괜찮고, 시간제한도 없어요. 선물은 내 방에 놓는 장식이에요.</p>${progress}<div class="story-chapters">${cards}</div><button class="text-button wide" data-close>다음에 할게요</button>`, 'story-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-story-start]').forEach(button => button.onclick = () => {
    const chapter = Number(button.dataset.storyStart);
    if(world.inHomestead||world.inRoom||journeyFor(s).stage!==0) switchStage(0);
    if (!startStory(s, chapter)) return;
    persist(); refresh(); switchStage(STORY_CHAPTERS[chapter].stage, s.forest);
    toast(`✉️ ${STORY_CHAPTERS[chapter].title} 시작! 길 위 첫 단서를 찾아요.`);
  });
  const continueButton = document.querySelector<HTMLButtonElement>('#story-continue');
  if (continueButton) continueButton.onclick = () => {
    const a = s.story.active; if (!a) return;
    if (a.solved) {
      if(world.inHomestead||world.inRoom||journeyFor(s).stage!==0) switchStage(0);
      const result = finishStory(s); if (!result) return;
      persist(); refresh(); world.updateStoryVillage(s); world.celebrate(); audio.play('level');
      openModal(title('✉️ 편지가 도착했어요!', STORY_CHAPTERS[result.chapter].title) + `<div class="arena-intro"><div class="arena-symbol">${STORY_CHAPTERS[result.chapter].icon}</div><p>${STORY_CHAPTERS[result.chapter].ending}</p><p class="story-progress">${['광장에 편지 친구 솜이가 찾아왔어요. 가까이 가서 인사해 보세요!', '마을 동쪽 호수에 다리와 물레방아가 생겼어요. 다리를 걸어서 건너 보세요!', '마을 서쪽에 별빛 나무와 작은 쉼터가 생겼어요. 펫과 함께 쉬어 가세요!'][result.chapter]}</p><p>${result.first ? `첫 완주 선물 「${result.gift}」을 받았어요. 내 방에서 눌러 설치할 수 있어요. 방이 가득 차 있어도 소유 목록에 보관돼요.` : '다시 함께해 줘서 고마워요! 선물은 처음 한 번만 받아요.'}</p><button class="primary wide" data-close>달라진 마을 구경하기</button></div>`);
    } else switchStage(STORY_CHAPTERS[a.chapter].stage, a.forest);
  };
}
function collectStoryClue(clue: number) {
  if (!state || !findStoryClue(state, clue)) return;
  const chapter = state.story.active!.chapter, count = state.story.active!.found.length;
  world.refreshStoryObjects(state); audio.play('berry'); refresh(); persist();
  openModal(title(`✉️ 단서 ${count}/3`, STORY_CHAPTERS[chapter].title) + `<div class="arena-intro"><div class="arena-symbol">${STORY_CHAPTERS[chapter].icon}</div><p>${STORY_CHAPTERS[chapter].clues[clue]}</p><button class="primary wide" data-close>${count === 3 ? '반짝이는 문제판 살펴보기' : '다음 단서 찾기'}</button></div>`);
}
async function startStoryQuestion() {
  if (!state || !storyHere(state) || state.story.active?.found.length !== 3 || state.story.active.solved) return;
  state.story.active.activity ??= newActivity(state.story.active.chapter, state.grade);
  storyActivityOpen = true; root.classList.add('is-story-activity'); storyPanel.hidden = false;
  world.beginStoryActivity(state); renderStoryActivityPanel(); persist(); $('#craft-title').focus();
}
function renderStoryActivityPanel(message = '') {
  if (!state?.story.active?.activity) return;
  const active = state.story.active, activity = active.activity!, spec = activitySpec(active.chapter, activity.grade);
  const focused = document.activeElement?.id, sum = activity.values.reduce((a, b) => a + b, 0);
  storyPanel.innerHTML = `<div class="craft-heading"><div><small>✉️ ${STORY_CHAPTERS[active.chapter].title}</small><h2 id="craft-title" tabindex="-1">${spec.title}</h2></div><button id="craft-close" aria-label="놀이 저장하고 닫기">✕</button></div><p class="craft-task">${spec.task}</p>${active.solved ? `<p class="craft-success" role="status">✨ ${spec.explanation}</p><button id="craft-done" class="primary wide">놀이 마치고 이야기 의뢰로 →</button>` : `<p class="craft-supply">${spec.kind === 'water' ? `지금 ${sum} ${spec.unit} · 목표 ${spec.target} ${spec.unit}` : `남은 ${spec.kind === 'bridge' ? '판자' : '케이크'} ${spec.total - sum}${spec.unit}`}</p><div class="craft-groups" style="--groups:${spec.groups}">${activity.values.map((value, i) => `<div class="craft-group"><b>${spec.kind === 'water' ? '물통' : `${i + 1}번 ${spec.kind === 'bridge' ? '기둥' : '친구'}`}</b><strong>${value}<small>${spec.unit}</small></strong><div><button id="craft-minus${i}" data-craft-group="${i}" data-craft-direction="-1" aria-label="${i + 1}번에서 ${spec.step}${spec.unit} 빼기" ${value === 0 ? 'disabled' : ''}>−</button><button id="craft-plus${i}" data-craft-group="${i}" data-craft-direction="1" aria-label="${i + 1}번에 ${spec.step}${spec.unit} 더하기" ${sum >= spec.total ? 'disabled' : ''}>+</button></div></div>`).join('')}</div><p class="craft-feedback" role="status">${message || '버튼을 누르면 지도 위 모습이 바로 바뀌어요.'}</p><div class="craft-actions"><button id="craft-hint" class="secondary">💡 도움말</button><button id="craft-check" class="primary">이렇게 완성!</button></div>${activity.hints ? `<p class="craft-hint">${spec.hint}</p>` : ''}`}`;
  $('#craft-close').onclick = closeStoryActivity;
  storyPanel.querySelectorAll<HTMLButtonElement>('[data-craft-group]').forEach(button => button.onclick = () => {
    if (active.solved || !adjustActivity(activity, active.chapter, Number(button.dataset.craftGroup), Number(button.dataset.craftDirection))) return;
    world.renderStoryActivity(state!); renderStoryActivityPanel(); persist();
  });
  if (active.solved) $('#craft-done').onclick = () => { const expired = sessionExpired; closeStoryActivity(); if (!expired && state) { world.guideTo('village'); toast('마을 우체통에 편지를 전하면 마을이 달라져요!'); } };
  else {
    $('#craft-hint').onclick = () => { activity.hints = Math.min(100000, activity.hints + 1); renderStoryActivityPanel(); persist(); };
    $('#craft-check').onclick = () => {
      if (!state || active.solved) return;
      if (!activitySolved(activity, active.chapter)) {
        if (activity.mistakes === 0) { state.learning.wrong++; sessionWrong++; }
        activity.mistakes = Math.min(100000, activity.mistakes + 1); audio.play('wrong');
        renderStoryActivityPanel(spec.kind === 'water' ? '물높이를 목표 눈금과 비교해요. 더하거나 덜어낼 수 있어요.' : '모두 같은 양인지, 남은 것이 없는지 살펴봐요. − 버튼으로 옮길 수 있어요.'); persist(); return;
      }
      if (!solveStory(state)) return;
      state.learning.correct++; sessionCorrect++; audio.play('correct');
      world.renderStoryActivity(state); world.refreshStoryObjects(state); renderStoryActivityPanel(); refresh(); persist();
    };
  }
  if (focused?.startsWith('craft-')) document.getElementById(focused)?.focus();
}
function closeStoryActivity() {
  storyActivityOpen = false; storyPanel.hidden = true; root.classList.remove('is-story-activity');
  world.endStoryActivity(); if (state) world.refreshStoryObjects(state); persist();
  if (sessionExpired) showSessionSummary();
}
window.addEventListener('keydown', e => { if (storyActivityOpen && e.key === 'Escape') { e.preventDefault(); closeStoryActivity(); } });
const joystick = $('#joystick'); let pointerId: number | null = null;
function moveJoystick(e: PointerEvent) { if (e.pointerId !== pointerId) return; const r = joystick.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width * .32), z = (e.clientY - r.top - r.height / 2) / (r.height * .32); const n = Math.hypot(x, z); if (n > 1) { x /= n; z /= n; } world.moveStick(x, z); $('#stick').style.transform = `translate(${x * 30}px, ${z * 30}px)`; }
joystick.onpointerdown = e => { pointerId = e.pointerId; joystick.setPointerCapture(e.pointerId); moveJoystick(e); }; joystick.onpointermove = moveJoystick;
const resetJoystick = () => { pointerId = null; world.moveStick(0, 0); $('#stick').style.transform = ''; }; joystick.onpointerup = resetJoystick; joystick.onpointercancel = resetJoystick; joystick.onlostpointercapture = resetJoystick;

const PRACTICE_TIER_TEXT: Record<Operation, readonly [string, string, string]> = {
  addition: ['한 자리 수끼리 더해요', '두 자리 + 한 자리, 받아올림', '두 자리 + 두 자리, 합이 100 이상'],
  subtraction: ['한 자리 수끼리 빼요', '두 자리 − 한 자리, 받아내림', '100 몇에서 두 자리 수를 빼요'],
  multiplication: ['2~5단 곱셈', '구구단 2~9단 전체', '두 자리 × 한 자리, 받아올림'],
  division: ['몇십을 똑같이 나눠요', '두 자리 수를 똑같이 나눠요', '나머지가 있는 나눗셈'],
};
function practiceNote(choice: Save['settings']['practice']) {
  if (choice.operation === 'auto') return '마을 시합장에서도 현재 선택한 숲의 계산과 단계에 맞춰 문제가 나와요.';
  if (adaptiveEnabled()) return `${OPERATION_INFO[choice.operation].name} · ✨ 자동 조절 — 받아올림·받아내림·나머지·소수 등 개념별로 3번 연속 맞히면 어렵게, 2번 틀리면 쉽게 조절해요. ${PRACTICE_TIER_NAMES[choice.tier]}부터 시작해요.`;
  return `${OPERATION_INFO[choice.operation].name} · ${PRACTICE_TIER_NAMES[choice.tier]} — ${PRACTICE_TIER_TEXT[choice.operation][choice.tier]}`;
}
// 자동 조절 중인 계산별 현재 단계(이번 접속 동안만 기억해요). 켜져 있지 않으면 고른 단계를 그대로 써요.
const adaptiveLevels = new ConceptPractice();
const preparedAdaptive = new WeakSet<Encounter>();
function practiceFor(practice?: { operation: Operation; tier: PracticeTier }) { return practice; }
function prepareAdaptiveQuestion() {
  if (!battle?.practice || !state || !adaptiveEnabled() || preparedAdaptive.has(battle.encounter)) return;
  const p = battle.practice;
  const chosen = adaptiveLevels.choose(p.operation, p.tier, tier => practiceQuestion(p.operation, tier, battle!.encounter.question, state!.level, state!.grade));
  battle.encounter.question = chosen.question;
  // Reward eligibility must use the difficulty actually served, not the original picker.
  battle.adaptiveTier = chosen.tier; preparedAdaptive.add(battle.encounter);
}
function recordAdaptive(correct: boolean) {
  if (!battle?.practice || !adaptiveEnabled()) return;
  const { key, before, after } = adaptiveLevels.record(battle.encounter.question, (battle.adaptiveTier ?? battle.practice.tier), correct);
  if (after.tier > before.tier) toast(`✨ ${conceptLabel(key)}를 잘하고 있어요! 이 개념을 조금 더 어렵게 풀어 봐요.`);
  else if (after.tier < before.tier) toast(`🌿 ${conceptLabel(key)}를 한 단계 쉽게 연습해요. 다른 개념의 단계는 그대로예요.`);
}
function practicePickerHtml() {
  const choice = state!.settings.practice, ops: [string, string, string][] = [['auto', '🎲', '자동'], ...operationsForGrade(state!.grade).map(op => [op, OPERATION_INFO[op].icon, OPERATION_INFO[op].name] as [string, string, string])];
  return `<div class="practice-picker"><p class="practice-title">마을 시합장에서 어떤 계산을 연습할까요?</p><div class="practice-chips" role="radiogroup" aria-label="연습할 계산">${ops.map(([id, icon, name]) => `<button type="button" class="practice-chip ${choice.operation === id ? 'selected' : ''}" data-practice-op="${id}" role="radio" aria-checked="${choice.operation === id}"><span aria-hidden="true">${icon}</span>${name}</button>`).join('')}</div><div class="practice-tiers" ${choice.operation === 'auto' ? 'hidden' : ''}><p class="practice-title">난이도는요?</p><div class="practice-chips" role="radiogroup" aria-label="난이도">${PRACTICE_TIER_NAMES.map((name, tier) => `<button type="button" class="practice-chip tier ${!adaptiveEnabled() && choice.tier === tier ? 'selected' : ''}" data-practice-tier="${tier}" role="radio" aria-checked="${!adaptiveEnabled() && choice.tier === tier}">${['🌱', '🌿', '🌳'][tier]} ${name}</button>`).join('')}<button type="button" class="practice-chip tier ${adaptiveEnabled() ? 'selected' : ''}" data-practice-adaptive role="radio" aria-checked="${adaptiveEnabled()}">✨ 자동</button></div></div><p class="practice-note" id="practice-note">${practiceNote(choice)}</p><p class="practice-note">힌트를 보고 푼 시합은 통과하지만 베리·경험치·점수는 받지 않아요.${state!.grade >= 3 ? " 100보다 작은 덧셈·뺄셈도 보상 없는 연습이에요." : ""}</p></div>`;
}
function bindPracticePicker(root: ParentNode) {
  if (!state) return;
  const sync = () => {
    const choice = state!.settings.practice;
    root.querySelectorAll<HTMLButtonElement>('[data-practice-op]').forEach(button => { const on = button.dataset.practiceOp === choice.operation; button.classList.toggle('selected', on); button.setAttribute('aria-checked', String(on)); });
    root.querySelectorAll<HTMLButtonElement>('[data-practice-tier]').forEach(button => { const on = !adaptiveEnabled() && Number(button.dataset.practiceTier) === choice.tier; button.classList.toggle('selected', on); button.setAttribute('aria-checked', String(on)); });
    root.querySelectorAll<HTMLButtonElement>('[data-practice-adaptive]').forEach(button => { button.classList.toggle('selected', adaptiveEnabled()); button.setAttribute('aria-checked', String(adaptiveEnabled())); });
    const tiers = root.querySelector<HTMLElement>('.practice-tiers'); if (tiers) tiers.hidden = choice.operation === 'auto';
    const note = root.querySelector<HTMLElement>('#practice-note'); if (note) note.textContent = practiceNote(choice);
  };
  root.querySelectorAll<HTMLButtonElement>('[data-practice-op]').forEach(button => button.onclick = () => { const op = button.dataset.practiceOp as Operation | 'auto'; if (op !== 'auto' && !operationsForGrade(state!.grade).includes(op)) return; state!.settings.practice.operation = op; sync(); persist(); });
  root.querySelectorAll<HTMLButtonElement>('[data-practice-tier]').forEach(button => button.onclick = () => { setAdaptive(false); adaptiveLevels.clear(); state!.settings.practice.tier = Number(button.dataset.practiceTier) as PracticeTier; sync(); persist(); });
  root.querySelectorAll<HTMLButtonElement>('[data-practice-adaptive]').forEach(button => button.onclick = () => { setAdaptive(true); adaptiveLevels.clear(); sync(); });
}
function beginHuntBattle(monster: number, id: string) {
  if (!state || !operationsForGrade(state.grade).includes(state.forest)) return;
  startBattle(monster, false, id);
}
function openVillageBoard() { if (!state) return; if (state.hub) void openCurriculumUnit(state.hub); else openStageMap(state.forest); }
function openNoticeBoard() {
  if (!state) return;
  rememberMenu('notices', openNoticeBoard);
  if (!state) return;
  const show = (id?: string) => {
    const notice = VILLAGE_NOTICES.find(n => n.id === id);
    openModal(title('마을 광장', '운영자 소식') + (notice ? noticeDetailHtml(notice) : noticeListHtml()), 'notice-modal');
    document.querySelectorAll<HTMLButtonElement>('[data-notice]').forEach(button => button.onclick = () => show(button.dataset.notice));
    const back = document.getElementById('notice-back');
    if (back) back.onclick = () => { show(); Array.from(document.querySelectorAll<HTMLButtonElement>('[data-notice]')).find(b => b.dataset.notice === id)?.focus(); };
    if (notice) $('#notice-title').focus();
    else document.querySelector<HTMLButtonElement>('[data-notice]')?.focus();
    $('#modal-content').scrollTop = 0; $('#modal').scrollTop = 0;
  };
  show();
}
function openArena() {
  if (!state) return;
  rememberMenu('arena', openArena);
  if (!state) return;
  openModal(title('신비의 시합장', '다섯 번의 작은 도전') + `<div class="arena-intro"><div class="arena-symbol">✦</div><p>몬스터 5마리와 차례로 수학 시합을 해요.<br>시간제한 없이, 천천히 생각해도 괜찮아요.</p>${practicePickerHtml()}<div class="stat-row"><div><small>나의 최고 점수</small><strong>${state.best}점</strong></div><div><small>지금 무기의 점수 배율</small><strong>×${(WEAPONS[state.weapon].multiplier + state.weapons[state.weapon] * .1).toFixed(1)}</strong></div></div><p class="note">도중에 쉬어도 이미 얻은 베리와 경험치는 그대로예요.</p><button class="primary wide" id="arena-start">시합 시작하기</button></div>`);
  bindPracticePicker($('#modal-content'));
  $('#arena-start').onclick = () => startBattle(Math.floor(Math.random() * MONSTERS.length), true, 'arena');
}
let mapSemester: 1 | 2 = 1;
function openStageMap(forest?: ForestKind) {
  if (!state) return;
  rememberMenu('stages', () => openStageMap(forest));
  if (!state) return; const s = state;
  if (!forest) {
    const isForest = (unit: CurriculumUnitId) => OPERATIONS.includes(unit as Operation);
    const progress = (unit: CurriculumUnitId) => isForest(unit) ? `${journeyFor(s, unit as ForestKind).maps.slice(1).filter(m => m.cleared).length} / 10단계` : `${s.curriculum.units[unit].completedMissions.length} / 10단계`;
    const stampCount = (unit: CurriculumUnitId) => isForest(unit) ? journeyFor(s, unit as ForestKind).maps.slice(1).filter(m => m.cleared).length : s.curriculum.units[unit].completedMissions.length;
    const stampRow = (unit: CurriculumUnitId) => { const n = Math.min(10, stampCount(unit)); return `<i class="stamp-row" aria-hidden="true">${Array.from({ length: 10 }, (_, k) => `<u class="${k < n ? "on" : ""}"></u>`).join("")}</i>`; };
    const card = (region: CurriculumRegion) => {
      const complete = curriculumUnitComplete(s, region.id), focus = s.settings.focusUnit === region.id;
      const action = isForest(region.id) ? `data-forest="${region.id}"` : `data-curriculum-unit="${region.id}"`;
      return `<button class="forest-card curriculum-region ${region.className} ${complete ? 'complete' : ''} ${focus ? 'focus-unit' : ''}" ${action}><span>${region.icon}</span><strong>${region.name}</strong><small>${region.short}</small>${stampRow(region.id)}<i class="region-progress" style="--region-progress:${Math.min(10, stampCount(region.id)) * 10}%" aria-hidden="true"></i><b>${complete ? '✓ 단원 완료' : progress(region.id)}${focus ? ' · 오늘의 단원' : ''}</b></button>`;
    };
    const sets = curriculumRegionSets(s.grade);
    const visibleRegions = mapSemester === 1 ? sets.first : sets.second;
    const nextRegion = visibleRegions.find(region => !curriculumUnitComplete(s, region.id)) ?? visibleRegions[0];
    const graduateReady = curriculumGraduationAvailable(s) || s.teacherMode;
    openModal(title('연태쌤의 수학 모험 지도', `${s.grade}학년 수학 · 1학기와 2학기`) + `<p class="shop-explainer">지역마다 10단계예요. 베리와 레벨은 어느 지역에서나 함께 써요.</p><button id="map-continue" class="primary wide map-continue">▶ 이어서 모험하기 · ${nextRegion.name}</button><div class="semester-tabs" role="group" aria-label="학기 선택"><button data-semester="1" class="${mapSemester === 1 ? 'active' : ''}" aria-pressed="${mapSemester === 1}">🌱 1학기</button><button data-semester="2" class="${mapSemester === 2 ? 'active' : ''}" aria-pressed="${mapSemester === 2}">🍁 2학기</button></div><h3 class="semester-heading">${mapSemester === 1 ? '🌱' : '🍁'} ${s.grade}학년 ${mapSemester}학기 모험</h3><div class="curriculum-overview">${visibleRegions.map(card).join('')}</div>${graduateReady ? `<button id="graduation-start" class="primary wide graduation-entry">🎓 ${s.curriculum.graduationClaimed ? `${s.grade}학년 졸업 모험 다시 하기` : `${s.grade}학년 졸업 모험 시작하기`}</button>` : `<p class="graduation-lock">🔒 모든 수학 지역을 통과하면 ${s.grade}학년 졸업 모험이 열려요.</p>`}${s.grade >= 3 && expeditionUnlocked(s) ? '<button id="map-expedition" class="secondary wide">✦ 나눗셈 숲 별빛 원정과 칭호</button>' : ''}`);
    const openRegion = (id: CurriculumUnitId) => { if (isForest(id)) openStageMap(id as ForestKind); else void openCurriculumUnit(id as NewCurriculumUnitId); };
    $('#map-continue').onclick = () => openRegion(nextRegion.id);
    document.querySelectorAll<HTMLButtonElement>('[data-semester]').forEach(button => button.onclick = () => { mapSemester = Number(button.dataset.semester) as 1 | 2; openStageMap(); });
    document.querySelectorAll<HTMLButtonElement>('[data-forest]').forEach(button => button.onclick = () => openStageMap(button.dataset.forest as ForestKind));
    document.querySelectorAll<HTMLButtonElement>('[data-curriculum-unit]').forEach(button => button.onclick = () => void openCurriculumUnit(button.dataset.curriculumUnit as NewCurriculumUnitId));
    const graduation = document.querySelector<HTMLButtonElement>('#graduation-start'); if (graduation) graduation.onclick = () => void startGraduationAdventure();
    const exp = document.querySelector<HTMLButtonElement>('#map-expedition'); if (exp) exp.onclick = openExpeditionBoard;
    return;
  }
  if (!operationsForGrade(s.grade).includes(forest)) { toast('이 학년에서 배우는 계산 숲을 골라 주세요.'); return; }
  const journey = journeyFor(s, forest), info = FOREST_INFO[forest], region = curriculumRegions().find(item => item.id === forest);
  openModal(title(region?.name ?? info.title, '단계와 발견') + `<div class="nav-tabs"><button id="forest-discoveries" class="secondary">🗺 발견 장소</button><button id="forest-story" class="secondary">✉️ 이야기 의뢰</button></div><div class="map-nav"><button id="forest-back" class="text-button">← 수학 모험 지도로 돌아가기</button><button id="forest-village" class="secondary">🏡 중앙 광장으로 돌아가기</button></div><p class="shop-explainer">${region?.short ?? info.intro} 한 단계의 몬스터를 모두 만나면 다음 길이 열려요.</p><div class="stage-grid ${forest}-map">${STAGES.map((stage, i) => { const step = i + 1, progress = journey.maps[step], open = canEnter(s, step, forest), complete = progress.cleared; const range = operationStageLabel(s.grade, forest, step); return `<button class="stage-card ${complete ? 'cleared' : ''}" data-stage="${step}" ${open ? '' : 'disabled'}><span class="stage-number">${complete ? '✓' : step}</span><strong>${info.icon} ${stage.name}</strong><small>${range}</small><small>${open ? complete ? '통과 완료 · 다시 탐험' : `${progress.monsters.length} / ${stageMonsters(step).length} 친구와 만나기` : '앞 단계를 먼저 통과해요'}</small></button>`; }).join('')}</div>`);
  $('#forest-back').onclick = openAdventureMap;
  $('#forest-discoveries').onclick = () => { if(state) showDiscoveryMap(state,discoveryHooks(),forest); };
  $('#forest-story').onclick = () => { if(!state)return; if(state.forest!==forest){if(state.story.active||state.expedition.active){toast('진행 중인 모험을 먼저 이어 주세요.');return;}switchStage(0,forest);}openStoryBoard(); };
  $('#forest-village').onclick = () => switchStage(0, forest);
  document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b => b.onclick = () => switchStage(Number(b.dataset.stage), forest));
}
function operationStageLabel(grade: SchoolGrade, operation: ForestKind, stage: number) {
  if (grade === 3) return operation === 'addition' || operation === 'subtraction' ? `세 자리 수 ${OPERATION_INFO[operation].name}` : FOREST_INFO[operation].stages(stage);
  if (grade === 1) return operation === 'addition' ? `합이 ${stage < 4 ? 10 : 20}까지인 덧셈` : `${stage < 4 ? 10 : 20}까지의 뺄셈`;
  if (grade === 2) return operation === 'multiplication' ? `${Math.min(9, Math.max(2, stage + 1))}단 중심 구구단` : `두 자리 수 ${OPERATION_INFO[operation].name} · ${stage < 5 ? '기초' : '받아올림·받아내림'}`;
  if (operation === 'division') return `${Math.min(50, 10 + stage * 4)} 이하의 두 자리 수로 나누기${stage >= 7 ? ' · 나머지' : ''}`;
  if (operation === 'multiplication') return stage < 5 ? '두 자리 수 × 한 자리 수' : stage === 5 ? '세 자리 수 × 한 자리 수' : '두 자리 수 × 두 자리 수';
  return grade >= 5 ? `큰 수와 소수 ${OPERATION_INFO[operation].name}` : `네 자리 수 ${OPERATION_INFO[operation].name}`;
}
function multiplicationStageLabel(stage: number) {
  if (stage === 1) return '2~5끼리 곱하기'; if (stage === 2) return '2~9 구구단'; if (stage === 3) return '몇십 × 2~5'; if (stage === 4) return '몇십 × 2~9'; if (stage === 5) return '두 자리 수 × 2~4 · 어느 자리에도 받아올림 없음'; if (stage === 6) return '11~49 × 2~4 · 받아올림'; if (stage === 7) return '11~59 × 2~5 · 받아올림'; if (stage === 8) return '11~79 × 2~6 · 받아올림'; if (stage === 9) return '100~299 × 2~6'; return '11~49 × 11~19 · 부분곱으로 풀기';
}
function divisionStageLabel(stage: number) {
  if (stage === 1) return '몫 한 자리 · 몇십 ÷ 한 자리 수';
  if (stage === 2) return '몫 12까지 · 몇십 ÷ 한 자리 수';
  if (stage === 3) return '두 자리 수 ÷ 한 자리 수 · 몫 20까지';
  if (stage === 4) return '두 자리 수 ÷ 한 자리 수 · 몫 30까지';
  if (stage === 5) return '100~299 ÷ 한 자리 수 · 몫 두 자리';
  if (stage === 6) return '100~499 ÷ 한 자리 수 · 몫 150까지';
  if (stage === 7) return '두 자리 수 ÷ 한 자리 수 · 작은 나머지';
  if (stage === 8) return '100~299 ÷ 한 자리 수 · 나머지';
  if (stage === 9) return '100~599 ÷ 한 자리 수 · 나머지';
  return '세 자리 수 나눗셈 · 몫 250까지 종합';
}

const CURRICULUM_GIFTS: Record<NewCurriculumUnitId, string> = {
  plane: '📐 반듯반듯 도형 액자', lengthTime: '🕰️ 똑딱 숲시계', fractionDecimal: '🔟 열칸 무지개 러그',
  circle: '🌙 달빛 컴퍼스 장식', fraction: '🍰 조각케이크 쿠션', measurement: '⚖️ 물방울 저울', pictograph: '📊 별빛 그래프판', triangle: '',
};
function curriculumStars(stars: number) { return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`; }
async function openCurriculumUnit(unit: NewCurriculumUnitId) {
  if (!state) return;
  rememberMenu('unit', () => { void openCurriculumUnit(unit); });
  const request = menuHistory.version;
  openModal(title('수학 지역을 준비하고 있어요', curriculumName(unit)) + '<p class="curriculum-loading">작은 교구와 문제를 꺼내는 중…</p>');
  const module = await loadCurriculum();
  if (!state || !menuHistory.isCurrent('unit', request)) return;
  rememberMenu('unit', () => { void openCurriculumUnit(unit); });
  const progress = state.curriculum.units[unit], missions = gradeMissions(state.grade, unit) ?? module.CURRICULUM_MISSIONS[unit], region = curriculumRegions().find(item => item.id === unit)!;
  const cards = missions.map((mission, id) => {
    const unlocked = canStartCurriculumMission(state!, unit, id), complete = progress.completedMissions.includes(id), stars = progress.stars[id];
    const type = mission.kind === 'concept' ? '개념 체험' : mission.kind === 'practice' ? '연습 임무' : mission.kind === 'story' ? '이야기 임무' : '단원 수호자';
    return `<button class="stage-card curriculum-stage-card ${complete ? 'cleared' : ''}" data-mission="${id}" ${unlocked ? '' : 'disabled'}><span class="stage-number">${complete ? '✓' : unlocked ? id + 1 : '🔒'}</span><strong>${mission.name}</strong><small>${type} · ${mission.skill}</small><small>${mission.description}</small><b>${complete ? curriculumStars(stars) : unlocked ? '시작하기' : '앞 단계 먼저'}</b></button>`;
  }).join('');
  openModal(title(`${region.icon} ${state.grade}학년 수학 · 10단계 지도`, region.name) + `<div class="map-nav"><button id="curriculum-back" class="text-button">← ${state.grade}학년 수학 지도로 돌아가기</button><button id="curriculum-village" class="secondary">🏡 ${VILLAGE_THEMES[unit].name} 가기</button></div><div class="unit-progress"><span>${region.icon}</span><div><strong>${progress.completedMissions.length} / 10단계 완료</strong><small>앞 단계를 통과하면 다음 길이 열려요. 별은 도전 기록이에요.</small></div><b>${curriculumStars(progress.stars.reduce((sum, n) => sum + n, 0) ? Math.min(3, Math.round(progress.stars.reduce((sum, n) => sum + n, 0) / Math.max(1, progress.completedMissions.length))) : 0)}</b></div><div class="stage-grid curriculum-stage-map">${cards}</div>${progress.rewardClaimed ? `<p class="unit-gift">🎁 ${CURRICULUM_GIFTS[unit] ? `지역 완주 선물: ${josa(CURRICULUM_GIFTS[unit], '을를')} 내 방에서 사용할 수 있어요.` : '지역 완주 선물: 베리를 받았어요.'}</p>` : ''}`, `curriculum-modal ${unit}-region`);
  $('#curriculum-back').onclick = () => openStageMap();
  $('#curriculum-village').onclick = () => switchStage(0, state!.forest, unit);
  document.querySelectorAll<HTMLButtonElement>('[data-mission]').forEach(button => button.onclick = () => void startCurriculumMission(unit, Number(button.dataset.mission)));
}

function curriculumQuestionVisual(question: CurriculumQuestion) { return curriculumVisualHtml(question.visual); }

const GUARDIAN_BLUEPRINTS: Record<NewCurriculumUnitId, number[]> = {
  plane: [0, 1, 2, 3, 5, 7], lengthTime: [0, 1, 2, 4, 5, 7], fractionDecimal: [0, 1, 2, 4, 6, 7],
  circle: [0, 1, 3, 4, 5, 7], fraction: [0, 2, 3, 4, 5, 7], measurement: [0, 1, 3, 4, 5, 7], pictograph: [0, 1, 2, 4, 5, 7], triangle: [0, 1, 2, 4, 5, 7],
};
function curriculumQuestionFor(module: CurriculumModule, unit: NewCurriculumUnitId, mission: number) {
  return state && state.grade !== 3
    ? generateGradeQuestion(state.grade as Exclude<SchoolGrade, 3>, unit, mission)
    : module.generateCurriculumQuestion(unit, mission);
}
function guardianQuestion(module: CurriculumModule, unit: NewCurriculumUnitId, index: number) {
  if (state && state.grade !== 3) return generateGradeQuestion(state.grade as Exclude<SchoolGrade, 3>, unit, index % 9);
  const blueprint = GUARDIAN_BLUEPRINTS[unit];
  return module.generateCurriculumQuestion(unit, blueprint[index % blueprint.length]);
}
function curriculumQuestionKey(question: CurriculumQuestion) { return `${question.unit}|${question.skill}|${question.prompt}|${question.detail ?? ''}|${question.answer}`; }
function freshCurriculumQuestion(factory: () => CurriculumQuestion, seen: Set<string>) {
  let question = factory();
  for (let attempt = 0; attempt < 16 && seen.has(curriculumQuestionKey(question)); attempt++) question = factory();
  seen.add(curriculumQuestionKey(question)); return question;
}
function nextCurriculumQuestion(module: CurriculumModule, run: NonNullable<typeof curriculumRun>) {
  const order = curriculumRegions().map(region => region.id);
  if (run.graduation) {
    const unit = order[run.index % order.length];
    return freshCurriculumQuestion(() => state?.grade !== 3 && NEW_CURRICULUM_UNITS.includes(unit as NewCurriculumUnitId)
      ? generateGradeQuestion(state!.grade as Exclude<SchoolGrade, 3>, unit as NewCurriculumUnitId, run.index % 9)
      : module.generateReviewQuestion(unit,Math.random,state?.grade??3), run.seenQuestions);
  }
  if (run.review && run.recoveryQuestions) return run.recoveryQuestions[run.index];
  if (run.review) return freshCurriculumQuestion(() => module.generateReviewQuestion(run.unit,Math.random,state?.grade??3), run.seenQuestions);
  const unit = run.unit as NewCurriculumUnitId;
  if (run.mission === 9) return freshCurriculumQuestion(() => guardianQuestion(module, unit, run.index), run.seenQuestions);
  const position = order.indexOf(unit), completedEarlier = state ? order.slice(0, position).filter(previous => curriculumUnitComplete(state!, previous)) : [];
  if (state?.settings.spiralReview && run.mission >= 3 && completedEarlier.length && Math.random() < .2) {
    const previous = completedEarlier[Math.floor(Math.random() * completedEarlier.length)];
    return freshCurriculumQuestion(() => state!.grade !== 3 && NEW_CURRICULUM_UNITS.includes(previous as NewCurriculumUnitId)
      ? generateGradeQuestion(state!.grade as Exclude<SchoolGrade, 3>, previous as NewCurriculumUnitId, Math.min(8, run.mission))
      : module.generateReviewQuestion(previous,Math.random,state?.grade??3), run.seenQuestions);
  }
  return freshCurriculumQuestion(() => curriculumQuestionFor(module, unit, run.mission), run.seenQuestions);
}

async function startCurriculumMission(unit: NewCurriculumUnitId, mission: number) {
  if (!state || !canStartCurriculumMission(state, unit, mission)) return;
  const module = await loadCurriculum(), total = mission === 9 ? 6 : 4;
  const question = mission === 9 ? guardianQuestion(module, unit, 0) : curriculumQuestionFor(module, unit, mission);
  const run = { unit, mission, question, index: 0, total, wrong: 0, hints: 0, hintLevel: 0, seenQuestions: new Set([curriculumQuestionKey(question)]) } satisfies NonNullable<typeof curriculumRun>;
  curriculumRun = run; renderCurriculumQuestion();
}

async function startGraduationAdventure() {
  if (!state || (!state.teacherMode && !curriculumGraduationAvailable(state))) return;
  const module = await loadCurriculum();
  const firstUnit = curriculumRegions()[0].id;
  const question = NEW_CURRICULUM_UNITS.includes(firstUnit as NewCurriculumUnitId) && state.grade !== 3
    ? generateGradeQuestion(state.grade as Exclude<SchoolGrade, 3>, firstUnit as NewCurriculumUnitId, 0)
    : module.generateReviewQuestion(firstUnit,Math.random,state?.grade??3);
  const run = { unit: 'addition' as CurriculumUnitId, mission: 0, question, index: 0, total: 11, wrong: 0, hints: 0, hintLevel: 0, seenQuestions: new Set([curriculumQuestionKey(question)]), graduation: true } satisfies NonNullable<typeof curriculumRun>;
  curriculumRun = run; renderCurriculumQuestion();
}

async function startCurriculumReview(unit: CurriculumUnitId, shadow?: CurriculumMistake) {
  if (!state) return;
  const owner = state, module = await loadCurriculum(); if (state !== owner) return;
  const mistake = shadow ?? state.curriculum.wrongSkills.find(item => item.unit === unit), mission = mistake?.mission ?? 0;
  if (!mistake || !NEW_CURRICULUM_UNITS.includes(unit as NewCurriculumUnitId)) { openReview(); return; }
  const questions = recoveryQuestions(mistake, index => curriculumQuestionFor(module, unit as NewCurriculumUnitId, index));
  if (!questions.length) { toast('이 개념의 복습 문제를 준비하지 못했어요. 기록은 그대로 남겨 두었어요.'); return; }
  const savedTool = state.adventure.tool;
  if (savedTool?.key === `concept:${unit}:${mistake.skill}`) questions[0] = structuredClone(savedTool.question);
  const question = questions[0];
  const run = { unit, mission, question, index: 0, total: 3, wrong: 0, hints: 0, hintLevel: 0, seenQuestions: new Set([curriculumQuestionKey(question)]), review: true, shadow, recoveryQuestions: questions, recoveryTarget: mistake } satisfies NonNullable<typeof curriculumRun>;
  curriculumRun = run; renderCurriculumQuestion();
}

function startCalculationRecovery(original: Question) {
  if (!state || !operationsForGrade(state.grade).includes(original.operation ?? 'division')) return;
  const operation = original.operation ?? 'division', stage = Math.max(1, journeyFor(state, operation).stage);
  let previous = original;
  const questions = Array.from({ length: 3 }, (_, phase) => {
    if (phase) previous = new Encounter(0, false, state!.level, previous, stage, state!.settings.maxDividend, operation, state!.settings.multiplicationRange, undefined, state!.grade).question;
    return calculationRecoveryQuestion(previous, phase);
  });
  if (state.adventure.tool?.key === `calculation:${JSON.stringify(original)}`) questions[0] = structuredClone(state.adventure.tool.question);
  curriculumRun = { unit: operation, mission: 0, question: questions[0], index: 0, total: 3, wrong: 0, hints: 0, hintLevel: 0, seenQuestions: new Set(), review: true, recoveryQuestions: questions, originalCalculation: original };
  renderCurriculumQuestion();
}

function renderCurriculumQuestion() {
  if (!curriculumRun || !state) return;
  const run = curriculumRun, q = run.question, region = curriculumRegions().find(item => item.id === q.unit)!, missionName = run.story ? `${STORY_CHAPTERS[state.story.active!.chapter].title} · 편지 속 문제` : run.graduation ? `${state.grade}학년 졸업 모험` : run.review ? '다시 연습하기' : curriculumName(run.unit);
  const answers = q.kind === 'choice'
    ? `<div class="curriculum-answers">${q.choices!.map(choice => `<button data-curriculum-answer="${escape(choice.value)}">${mathTextHtml(choice.label)}</button>`).join('')}</div>`
    : `<div class="curriculum-number"><input id="curriculum-answer" inputmode="numeric" maxlength="4" readonly aria-label="답"><div class="number-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '지우기', 0, '확인'].map(n => `<button data-curriculum-number="${n}" class="${n === '확인' ? 'primary' : ''}">${n}</button>`).join('')}</div></div>`;
  const activity = curriculumActivityHtml(q);
  openModal(title(`${region.icon} ${missionName} · ${run.index + 1}/${run.total}`, titleLeaksAnswer(q) ? NEUTRAL_TITLE : q.skill) + `<div class="curriculum-question-card"><div class="curriculum-step"><span>${run.index + 1}</span>${Array.from({ length: run.total }, (_, id) => `<i class="${id < run.index ? 'done' : id === run.index ? 'now' : ''}"></i>`).join('')}</div><h3>${mathTextHtml(q.prompt)}</h3>${q.detail ? `<p class="question-detail">${mathTextHtml(q.detail)}</p>` : ''}${run.review && run.index === 0 && toolSpec(q) ? "" : activity || curriculumQuestionVisual(q)}<div id="learning-tool-slot"></div>${answers}<p id="curriculum-message" class="answer-message" role="status">${activity ? '활동판을 직접 움직여 답을 만들어 보세요. 틀려도 잃는 것은 없어요.' : '천천히 보고 답을 골라요. 틀려도 잃는 것은 없어요.'}</p><div id="curriculum-hint" class="curriculum-hint" hidden></div>${speechSupported() ? '<button id="curriculum-read" class="text-button wide" aria-label="문제 읽어주기">🔊 문제 읽어주기</button>' : ''}<button id="curriculum-hint-button" class="text-button wide">💡 단계별 힌트 보기</button><button class="text-button wide" data-close>잠깐 쉬기</button><div id="curriculum-result" hidden></div></div>`, 'curriculum-play-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-answer]').forEach(button => button.onclick = () => submitCurriculumAnswer(button.dataset.curriculumAnswer!));
  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-number]').forEach(button => button.onclick = () => enterCurriculumNumber(button.dataset.curriculumNumber!));
  setupCurriculumActivity();
  if (run.review && run.index === 0) setupLearningTool();
  if (run.review) {
    $('.curriculum-question-card').insertAdjacentHTML('afterbegin', `<div class="recovery-path" aria-label="재도전 ${run.index + 1}단계">${RECOVERY_STEPS.map((step, index) => `<span class="${index === run.index ? 'current' : index < run.index ? 'done' : ''}">${index < run.index ? '✓' : index + 1} ${step}</span>`).join('')}</div>${run.index === 0 ? `<p class="recovery-help">🧩 ${mathTextHtml(q.hints[0])}</p>` : ''}`);
    if (run.index === 0) { run.hints++; state.curriculum.units[q.unit].hints++; persist(); }
    if (run.index === 0 && !toolSpec(q) && Number.isInteger(Number(q.answer)) && Number(q.answer) >= 0 && Number(q.answer) <= 30 && ['array', 'groups', 'pictograph', 'scene'].includes(q.visual.kind)) {
      $('#curriculum-message').insertAdjacentHTML('beforebegin', '<section class="recovery-counting"><p>그림을 보며 셈돌을 하나씩 놓아 세어 보세요.</p><div id="recovery-stones" role="status" aria-live="polite">셈돌 0개</div><div><button id="recovery-remove" class="secondary" disabled>한 개 치우기</button><button id="recovery-add" class="secondary">셈돌 하나 놓기</button></div></section>');
      let stones = 0;
      const drawStones = () => { $('#recovery-stones').textContent = `${'🟡'.repeat(stones)} 셈돌 ${stones}개`; ($('#recovery-remove') as HTMLButtonElement).disabled = stones === 0; ($('#recovery-add') as HTMLButtonElement).disabled = stones === 30; };
      $('#recovery-add').onclick = () => { stones = Math.min(30, stones + 1); drawStones(); };
      $('#recovery-remove').onclick = () => { stones = Math.max(0, stones - 1); drawStones(); };
    }
  }
  $('#curriculum-hint-button').onclick = showCurriculumHint;
  const readText = () => [q.prompt, q.detail, q.kind === 'choice' ? `보기. ${q.choices!.map(choice => choice.label).join('. ')}` : ''].filter(Boolean).join('. ');
  const readButton = document.querySelector<HTMLButtonElement>('#curriculum-read');
  if(readButton)voiceControls(readButton.parentElement!);
  if (readButton) readButton.onclick = () => { readButton.textContent = '🔊 읽는 중…'; if (!speak(readText(), () => { readButton.textContent = '🔊 문제 읽어주기'; })) readButton.textContent = '🔊 문제 읽어주기'; };
  if (readButton && autoReadEnabled()) readButton.click();
}

function setupLearningTool() {
  if (!state || !curriculumRun || curriculumRun.answered) return;
  const run = curriculumRun, q = run.question, spec = toolSpec(q); if (!spec) return;
  const key = run.originalCalculation ? `calculation:${JSON.stringify(run.originalCalculation)}` : `concept:${q.unit}:${run.recoveryTarget?.skill ?? q.skill}`;
  if (state.adventure.tool?.key !== key) state.adventure.tool = { key, question: structuredClone(q), values: spec.limits.map(() => 0) };
  const tool = state.adventure.tool; persist();
  const slot = $('#learning-tool-slot'); slot.innerHTML = toolHtml(tool);
  const update = (group: number, delta: number) => {
    if (curriculumRun !== run || run.answered || !state || !adjustTool(tool, group, delta)) return;
    const focused = document.activeElement as HTMLElement | null, index = focused ? [...slot.querySelectorAll('button,input')].indexOf(focused) : -1;
    persist(); setupLearningTool(); (slot.querySelectorAll<HTMLElement>('button,input')[index])?.focus();
  };
  slot.querySelectorAll<HTMLButtonElement>('[data-tool-group]').forEach(b => b.onclick = () => update(Number(b.dataset.toolGroup), Number(b.dataset.toolDelta)));
  slot.querySelectorAll<HTMLButtonElement>('[data-tool-cell]').forEach(b => b.onclick = () => {
    const group = Number(b.dataset.toolCell), position = Number(b.dataset.toolPosition), target = position < tool.values[group] ? position : position + 1;
    while (tool.values[group] !== target) if (!adjustTool(tool, group, target > tool.values[group] ? 1 : -1)) break;
    persist(); setupLearningTool();
    slot.querySelector<HTMLElement>(`[data-tool-cell="${group}"][data-tool-position="${position}"]`)?.focus();
  });
  slot.querySelectorAll<HTMLInputElement>('[data-tool-range]').forEach(input => input.oninput = () => {
    const group = Number(input.dataset.toolRange), target = Number(input.value);
    while (tool.values[group] !== target) if (!adjustTool(tool, group, target > tool.values[group] ? 1 : -1)) break;
    persist(); setupLearningTool(); slot.querySelector<HTMLInputElement>(`[data-tool-range="${group}"]`)?.focus();
  });
  const source = slot.querySelector<HTMLButtonElement>('#tool-source'); let selected = false;
  if (source) { source.onclick = () => { selected = true; $('#tool-status').textContent = '물건 하나를 놓을 묶음을 골라요.'; }; source.ondragstart = e => { selected = true; e.dataTransfer?.setData('text/plain', 'counter'); }; }
  slot.querySelectorAll<HTMLButtonElement>('[data-tool-drop]').forEach(b => { b.onclick = () => { if (selected) update(Number(b.dataset.toolDrop), 1); else if (source) source.click(); }; b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); if (selected) update(Number(b.dataset.toolDrop), 1); }; });
}

function setupCurriculumActivity() {
  const pizza = document.querySelector<HTMLElement>('[data-math-activity="pizza"]');
  if (pizza) {
    const denominator = Number(pizza.dataset.denominator), selected = new Set<number>();
    const count = pizza.querySelector<HTMLElement>('[data-pizza-count]')!, submit = pizza.querySelector<HTMLButtonElement>('[data-pizza-submit]')!;
    pizza.querySelectorAll<HTMLButtonElement>('[data-pizza-slice]').forEach(button => button.onclick = () => {
      const id = Number(button.dataset.pizzaSlice);
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      button.classList.toggle('selected', selected.has(id)); button.setAttribute('aria-pressed', String(selected.has(id)));
      count.textContent = String(selected.size); submit.disabled = selected.size === 0;
    });
    submit.onclick = () => void submitCurriculumAnswer(`${selected.size}/${denominator}`);
  }
  const circle = document.querySelector<HTMLElement>('[data-math-activity="circle"]');
  if (circle) {
    const max = Number(circle.dataset.circleMax), unit = circle.dataset.circleUnit ?? 'cm'; let value = 0;
    const output = circle.querySelector<HTMLOutputElement>('[data-circle-value]')!, tape = circle.querySelector<HTMLElement>('[data-circle-tape]')!, submit = circle.querySelector<HTMLButtonElement>('[data-circle-submit]')!;
    const render = () => { output.value = `${value} ${unit}`; output.textContent = output.value; tape.style.width = `${value / max * 100}%`; submit.disabled = value === 0; };
    circle.querySelectorAll<HTMLButtonElement>('[data-circle-adjust]').forEach(button => button.onclick = () => { value = Math.max(0, Math.min(max, value + Number(button.dataset.circleAdjust))); render(); });
    submit.onclick = () => { const input = document.querySelector<HTMLInputElement>('#curriculum-answer'); if (input) input.value = String(value); void submitCurriculumAnswer(String(value)); };
    render();
  }
}

function enterCurriculumNumber(key: string) {
  if (!curriculumRun || curriculumRun.question.kind !== 'number') return;
  const input = document.querySelector<HTMLInputElement>('#curriculum-answer'); if (!input || input.disabled) return;
  if (key === '지우기') input.value = input.value.slice(0, -1);
  else if (key === '확인') { if (input.value) submitCurriculumAnswer(input.value); else $('#curriculum-message').textContent = '숫자를 먼저 적어 주세요.'; }
  else if (/^\d$/.test(key) && input.value.length < 4) input.value += key;
}

function showCurriculumHint() {
  if (!curriculumRun || !state || curriculumRun.hintLevel >= 3) return;
  const run = curriculumRun, hint = $('#curriculum-hint');
  run.hintLevel++; run.hints++; state.curriculum.units[run.question.unit].hints++;
  hint.hidden = false; hint.insertAdjacentHTML('beforeend', `<p><b>힌트 ${run.hintLevel}</b> ${mathTextHtml(run.question.hints[run.hintLevel - 1])}</p>`);
  $('#curriculum-hint-button').textContent = run.hintLevel === 3 ? '힌트를 모두 살펴봤어요' : `💡 다음 힌트 보기 (${run.hintLevel}/3)`;
  if (run.hintLevel === 3) ($('#curriculum-hint-button') as HTMLButtonElement).disabled = true;
  persist();
}

async function submitCurriculumAnswer(value: string) {
  if (!curriculumRun || !state) return;
  const run = curriculumRun, owner = state, q = run.question, module = await loadCurriculum();
  if (curriculumRun !== run || state !== owner || run.answered) return;
  if (!module.answerCurriculumQuestion(q, value)) {
    if (!run.missedCurrent) {
      run.missedCurrent = true; run.wrong++; sessionWrong++; state.learning.wrong++;
      recordCurriculumAttempt(state, q.unit, false, run.mission, run.recoveryTarget?.skill ?? q.skill);
    }
    $('#curriculum-message').innerHTML = mathTextHtml(module.curriculumWrongFeedback(q, value));
    document.querySelectorAll<HTMLButtonElement>('[data-curriculum-answer]').forEach(button => { if (button.dataset.curriculumAnswer === value) button.classList.add('wrong'); });
    audio.play('wrong'); persist(); return;
  }
  sessionCorrect++;
  run.answered = true;
  recordLearningResolution(q.unit, !!run.missedCurrent, run.hintLevel > 0);
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('.learning-tool button,.learning-tool input').forEach(b => b.disabled = true);
  if (run.review && run.index === 0) state.adventure.tool = null;
  if (!run.missedCurrent) { state.learning.correct++; recordCurriculumAttempt(state, q.unit, true, run.mission, q.skill); if (!run.review && !run.story && run.hintLevel === 0) addBossDamage(localStorage); }
  if (run.story) { solveStory(state); world.refreshStoryObjects(state); refresh(); }
  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-answer],[data-curriculum-number],[data-pizza-slice],[data-pizza-submit],[data-circle-adjust],[data-circle-submit]').forEach(button => { button.disabled = true; if (button.dataset.curriculumAnswer === value) button.classList.add('correct'); });
  const input = document.querySelector<HTMLInputElement>('#curriculum-answer'); if (input) input.disabled = true;
  const numberEntry = document.querySelector<HTMLElement>('.curriculum-number');
  if (numberEntry) numberEntry.hidden = true;
  $('#curriculum-hint-button').hidden = true; $('#curriculum-message').textContent = '정답이에요! 정말 잘 풀었어요.';
  const result = $('#curriculum-result'); result.hidden = false;
  result.innerHTML = `<div class="curriculum-explanation"><strong>🌟 이렇게 생각해요</strong><p>${mathTextHtml(q.explanation)}</p></div><button id="curriculum-next" class="primary wide">${run.story ? '이야기 의뢰로 돌아가기 ✉️' : run.index + 1 < run.total ? '다음 문제 →' : run.review ? '복습 마치기' : run.graduation ? '졸업 모험 마치기 🎓' : '임무 완료하기 ✨'}</button>`;
  const recoveryFinished = run.review && run.index + 1 === run.total;
  if (recoveryFinished) {
    if (run.recoveryTarget) markRecovered(state, run.recoveryTarget.unit, run.recoveryTarget.skill);
    if (run.originalCalculation) {
      const original = run.originalCalculation;
      state.learning.wrongQuestions = state.learning.wrongQuestions.filter(item => !((item.operation ?? 'division') === (original.operation ?? 'division') && item.dividend === original.dividend && item.divisor === original.divisor && item.answer === original.answer && JSON.stringify(item.places) === JSON.stringify(original.places) && item.remainder === original.remainder));
      markRecovered(state, run.unit, q.skill);
    }
    if (!run.shadow) syncShadows();
    refresh();
  }
  if (run.shadow && recoveryFinished) {
    const defeated = run.shadow, waiting = shadowList.some(item => item.unit === defeated.unit && item.skill === defeated.skill);
    state.curriculum.wrongSkills = state.curriculum.wrongSkills.filter(item => !(item.unit === defeated.unit && item.skill === defeated.skill));
    syncShadows();
    if (waiting && run.hints === 0) { state.berries += SHADOW_REWARD; refresh(); toast(`🌟 그림자 몬스터를 물리쳤어요! 🍓 +${SHADOW_REWARD}`); }
  }
  audio.play('correct'); persist(); $('#curriculum-next').onclick = finishCurriculumQuestion;
}

async function finishCurriculumQuestion() {
  if (!curriculumRun || !state) return;
  if (curriculumRun.story) { curriculumRun = null; if (sessionExpired) showSessionSummary(); else { closeModal(); toast('✉️ 이제 마을 우체통에 편지를 전해 주세요!'); } return; }
  if (sessionExpired) { curriculumRun = null; showSessionSummary(); return; }
  const run = curriculumRun, module = await loadCurriculum();
  if (run.index + 1 < run.total) {
    run.index++; run.hintLevel = 0; run.missedCurrent = false; run.answered = false; run.question = nextCurriculumQuestion(module, run); renderCurriculumQuestion(); return;
  }
  curriculumRun = null;
  if (run.review) {
    openModal(title('다시 해낸 용기', '세 걸음 재도전 성공!') + '<div class="arena-intro"><div class="arena-symbol">🌟</div><p>도움을 받아 살펴보고, 다른 문제에도 방법을 써 봤어요.<br>모험 도감에 다시 해낸 개념을 남겼어요!</p><button class="primary wide" id="review-return">학습 기록으로 돌아가기</button></div>');
    $('#review-return').onclick = run.shadow ? closeModal : openNotebook;
    if (run.shadow) $('#review-return').textContent = '마을로 돌아가기'; return;
  }
  if (run.graduation) {
    const reward = claimCurriculumGraduation(state); persist(); refresh(); world.celebrate(); audio.play('level');
    openModal(title('연태쌤의 졸업 편지', `${state.grade}학년 수학 탐험가!`) + `<div class="arena-intro graduation-success"><div class="arena-symbol">🎓</div><p>1학기와 2학기의 계산, 도형, 측정, 분수, 자료 단원을 모두 연결했어요.</p><p><b>「${state.grade}학년 수학 탐험가」 칭호</b>와 수료장을 받았어요.${reward ? `<br>완주 선물 🍓 ${reward.toLocaleString()}베리도 받았어요!` : '<br>완주 선물은 처음 한 번만 받아요.'}</p><button class="primary wide" data-close>마을로 돌아가기</button></div>`); return;
  }
  const stars = run.wrong === 0 && run.hints === 0 ? 3 : run.wrong <= 1 && run.hints <= 2 ? 2 : 1;
  const complete = completeCurriculumMission(state, run.unit as NewCurriculumUnitId, run.mission, stars), gift = complete.unitRewarded ? CURRICULUM_GIFTS[run.unit as NewCurriculumUnitId] : '';
  persist(); refresh(); world.celebrate(); audio.play('level');
  openModal(title(`${curriculumStars(stars)} 임무 완료`, curriculumName(run.unit)) + `<div class="arena-intro"><div class="arena-symbol">${curriculumRegions().find(item => item.id === run.unit)!.icon}</div><p>문제 ${run.total}개를 끝까지 풀었어요.<br>${complete.berries ? `첫 통과 보상으로 🍓 ${complete.berries}베리를 받았어요.` : '한 번 더 연습했어요! 실력이 더 단단해졌어요.'}</p>${gift ? `<p class="unit-gift">🎁 단원 완주! ${josa(gift, '을를')} 내 방에서 사용할 수 있어요.</p>` : ''}<button class="primary wide" id="mission-return">다음 임무 보기 →</button></div>`);
  $('#mission-return').onclick = () => void openCurriculumUnit(run.unit as NewCurriculumUnitId);
}
function rankList(ranks: GlobalRank[]) {
  if (!ranks.length) return '<p class="note">아직 등록된 원정 기록이 없어요. 첫 번째 별빛 탐험가가 되어 보세요!</p>';
  return `<ol class="local-ranking">${ranks.map(rank => `<li class="${rank.isMine ? 'mine' : ''}"><b>${rank.rank}</b><span>${escape(rank.nickname)}${rank.isMine ? ' <small>나</small>' : ''}</span><strong>✦ ${rank.completed}회</strong></li>`).join('')}</ol>`;
}
async function loadGlobalRankingPanel(s: Save) {
  const panel = document.querySelector<HTMLElement>('#global-ranking-panel'); if (!panel) return;
  try {
    const playerId = getGlobalPlayerId();
    const ranks = s.teacherMode ? await loadGlobalRanks(playerId) : await syncGlobalRank(localStorage, playerId, s.nickname, s.expedition.completed);
    const current = document.querySelector<HTMLElement>('#global-ranking-panel'); if (current) current.innerHTML = rankList(ranks);
  } catch {
    const current = document.querySelector<HTMLElement>('#global-ranking-panel');
    if (current) current.innerHTML = '<p class="ranking-unavailable">🌧️ 전체 랭킹을 불러오지 못했어요.<br>인터넷을 확인하고 게시판을 다시 열어 주세요.</p>';
  }
}
function openExpeditionBoard() {
  if (!state) return;
  rememberMenu('expeditions', openExpeditionBoard);
  if (!state) return;
  if (!expeditionUnlocked(state)) { toast('나눗셈숲 10단계를 통과하면 별빛 원정이 열려요.'); return; }
  const s = state, mission = s.expedition.active, next = expeditionLayout(s.expedition.completed);
  const localRanks = parseLocalRanks(localStorage.getItem(RANKING_STORAGE)), ranking = localRanks.length ? `<ol class="local-ranking">${localRanks.map((rank, id) => `<li class="${rank.nickname === s.nickname ? 'mine' : ''}"><b>${id + 1}</b><span>${escape(rank.nickname)}</span><strong>✦ ${rank.completed}회</strong></li>`).join('')}</ol>` : '<p class="note">첫 원정을 완수하면 이곳에 기록돼요.</p>';
  const rewardStage = mission?.stage ?? next.stage;
  openModal(title('연태쌤의 별빛 게시판', '별빛 원정') + `<p>10개의 숲을 새로운 목표로 다시 걸어요. 언제든 다시 도전할 수 있고, 틀려도 손해가 없어요.</p><p class="expedition-note">이번 원정: <b>${mission ? `${mission.stage}단계 · ${STAGES[mission.stage - 1].name}` : `${next.stage}단계 · ${STAGES[next.stage - 1].name}`}</b><br>별빛 표식 3개 · 몬스터 시합 2번 · 출구의 이야기 문제 1개<br><small>완주하면 🍓 ${expeditionBerryReward(rewardStage)}베리!</small></p>${mission ? `<p>지금까지 표식 ${mission.stars.length}/3 · 시합 ${mission.monsters.length}/2</p>` : ''}<button id="expedition-start" class="primary wide">${mission ? '진행 중인 원정 이어가기' : '새 원정 떠나기'} →</button><h3 class="title-heading">🏅 나의 칭호 · 원정 ${s.expedition.completed}번 완수</h3><div class="title-list">${EXPEDITION_TITLES.map((item, id) => `<button data-title="${id}" class="secondary ${s.expedition.selectedTitle === id ? 'selected' : ''}" ${s.expedition.completed < item.need ? 'disabled' : ''}>${s.expedition.completed < item.need ? '🔒' : '✦'} ${item.name}<small>${item.need}번 완수${s.expedition.selectedTitle === id ? ' · 표시 중' : ''}</small></button>`).join('')}</div><h3 class="title-heading">🏆 별빛 원정 랭킹</h3><div class="ranking-tabs" role="tablist"><button class="active" data-rank-tab="global" role="tab" aria-selected="true">🌍 전체 랭킹</button><button data-rank-tab="local" role="tab" aria-selected="false">📱 이 기기</button></div><section id="global-ranking-panel" role="tabpanel"><p class="ranking-loading">✨ 전체 탐험가 기록을 불러오는 중…</p></section><section id="local-ranking-panel" role="tabpanel" hidden><p class="ranking-note">같은 브라우저에서 플레이한 닉네임별 최고 기록이에요.</p>${ranking}</section><p class="ranking-note">전체 랭킹에는 닉네임과 별빛 원정 완료 횟수만 올라가요. 선생님 모드 기록은 제외돼요.</p>`);
  $('#expedition-start').onclick = beginExpedition;
  document.querySelectorAll<HTMLButtonElement>('[data-title]').forEach(b => b.onclick = () => { if (selectExpeditionTitle(s, Number(b.dataset.title))) { refresh(); persist(); openExpeditionBoard(); } });
  document.querySelectorAll<HTMLButtonElement>('[data-rank-tab]').forEach(button => button.onclick = () => {
    const global = button.dataset.rankTab === 'global';
    document.querySelectorAll<HTMLButtonElement>('[data-rank-tab]').forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-selected', String(selected)); });
    $('#global-ranking-panel').hidden = !global; $('#local-ranking-panel').hidden = global;
  });
  void loadGlobalRankingPanel(s);
}
function beginExpedition() {
  if (!state) return;
  if (!expeditionUnlocked(state)) { toast('나눗셈숲 10단계를 통과하면 별빛 원정이 열려요.'); return; }
  state.forest = 'division';
  const resumeHere = !!state.expedition.active && state.expedition.active.stage === state.journey.stage && !world.inRoom;
  if (!startExpedition(state)) return;
  world.loadStage(state, !resumeHere); closeModal(); refresh(); persist(); toast('✦ 별빛 원정이 시작됐어요! 표식을 찾아보세요.');
}
function switchStage(stage: number, forest: ForestKind = state?.forest ?? 'division', hub?: NewCurriculumUnitId) {
  if (!state || !canEnter(state, stage, forest)) return; state.homestead.inside=false; state.forest = forest; state.hub = stage === 0 ? hub : undefined; journeyFor(state).stage = stage; state.position = stage === 0 ? { x: 0, z: 8 } : { x: 0, z: 26 }; world.loadStage(state, true); closeModal(); refresh(); persist(); toast(stage ? `${FOREST_INFO[forest].name} ${stage}단계 · ${STAGES[stage - 1].name}에 도착했어요!` : '중앙 광장에 도착했어요.');
}
function openNextGate() {
  if (!state) return; const journey = journeyFor(state), stage = journey.stage, map = journey.maps[stage], total = stageMonsters(stage).length;
  if (state.forest === 'division' && state.expedition.active?.stage === stage) { if (!canFinishExpedition(state)) { const active = state.expedition.active; toast(`표식 ${3 - active.stars.length}개와 시합 ${2 - active.monsters.length}번을 더 마쳐요.`); return; } startExpeditionGate(); return; }
  if (!map.cleared) { toast(`숲 친구 ${total - map.monsters.length}명을 더 만나야 해요.`); return; }
  if (stage === 10 && state.forest === 'multiplication') { if (state.multiplicationCompleted) { openModal(title('해바라기 편지', '곱셈의 숲을 모두 밝혔어요!') + '<div class="arena-intro"><div class="arena-symbol">🌻</div><p>이미 곱셈숲 탐험가 칭호와 구구단 해바라기 화분을 받았어요.<br>방 꾸미기에서 화분을 눌러 놓아 보세요!</p><button class="primary wide" data-close>숲에서 더 놀기</button></div>'); } else startMultiplicationGate(); return; }
  if (stage === 10 && (state.forest === 'addition' || state.forest === 'subtraction')) { const info = FOREST_INFO[state.forest]; openModal(title('연태쌤의 축하', `${info.name}을 모두 통과했어요!`) + `<div class="arena-intro"><div class="arena-symbol">${info.icon}</div><p>${state.grade}학년 ${info.op} 모험 10단계를 차근차근 익혔어요.<br>정말 대단해요! 더 연습하고 싶으면 마을 시합장에서 난이도를 골라 보세요.</p><button class="primary wide" data-close>숲에서 더 놀기</button></div>`); return; }
  if (stage === 10) { openModal(title('연태쌤의 축하', '열 단계를 모두 통과했어요!') + `<div class="arena-intro"><div class="arena-symbol">🌈</div><p>베리숲의 모든 길을 걸으며 나눗셈 친구들을 만났어요.<br>정말 대단해요!<br>이제 별빛 원정도 시작할 수 있어요!</p><button id="celebrate-expedition" class="primary wide">✦ 별빛 원정 시작하기</button><button class="secondary wide" data-close>숲에서 더 놀기</button></div>`); $('#celebrate-expedition').onclick = openExpeditionBoard; return; }
  switchStage(stage + 1, state.forest);
}
function startBattle(monster: number, arena: boolean, id: string) {
  if (!state || (!arena && !operationsForGrade(state.grade).includes(state.forest))) return;
  const { operation, practice } = battleMode(state, arena), journey = journeyFor(state, operation);
  const cleared = journey.maps.slice(1).filter(map => map.cleared).length, difficultyStage = arena ? Math.min(10, cleared + 1) : journey.stage;
  const huntId = id.startsWith('monster') ? Number(id.slice(7)) : -1;
  battle = { encounter: new Encounter(monster, arena, state.level, undefined, difficultyStage, state.settings.maxDividend, operation, state.settings.multiplicationRange, practiceFor(practice), state.grade), id, practice, kind: id.startsWith('expMonster') ? 'expMonster' : 'normal', round: 1, goalRounds: isForestBoss(huntId, journey.stage) && !arena ? 5 : monsterBattleRounds(monster, arena), score: 0, result: null, story: multiplicationUsesStory(huntId) }; renderBattle();
}
/** 각 숲 10단계의 마지막 몬스터는 크고 다섯 문제를 내는 숲의 대왕이에요. */
function isForestBoss(huntId: number, stage: number) { return stage === 10 && huntId === stageMonsters(10).length - 1; }
function startMultiplicationGate() {
  if (!state) return; const gate = startMultiplicationFinal(state); if (!gate) return;
  const encounter = new Encounter(0, false, state.level, undefined, 10, state.settings.maxDividend, gate.step === 0 ? 'multiplication' : 'division', state.settings.multiplicationRange, undefined, state.grade);
  encounter.question = gate.step === 0 ? { dividend: gate.left, divisor: gate.right, answer: gate.left * gate.right, operation: 'multiplication' } : { dividend: gate.left * gate.right, divisor: gate.right, answer: gate.left, operation: 'division' };
  battle = { encounter, id: 'multiplicationGate', kind: 'multiplicationGate', round: gate.step + 1, score: 0, result: null }; renderBattle(); persist();
}
function startExpeditionGate() {
  if (!state?.expedition.active || !canFinishExpedition(state)) return;
  const active = state.expedition.active, encounter = new Encounter(0, false, state.level, undefined, active.stage, state.settings.maxDividend, 'division', state.settings.multiplicationRange, undefined, state.grade);
  encounter.question = { ...active.gateQuestion };
  battle = { encounter, id: 'expGate', kind: 'expGate', round: 1, score: 0, result: null }; renderBattle();
}
function renderBattle() {
  prepareAdaptiveQuestion();
  if (!battle || !state) return; const b = battle, e = b.encounter, m = MONSTERS[e.monster], q = e.question, rewardReason = battleRewardReason(state, q, !!b.hintUsed, b.practice?.operation === q.operation ? (b.adaptiveTier ?? b.practice?.tier) : undefined), reward = rewardFor(state, e.monster, e.arena, Date.now(), !rewardReason), op = q.operation ?? 'division', info = OPERATION_INFO[op], multiplication = op === 'multiplication', symbol = info.symbol, operationName = info.name;
  const dp = q.places, da = dp ? formatScaled(q.dividend, dp[0]) : String(q.dividend), db = dp ? formatScaled(q.divisor, dp[1]) : String(q.divisor);
  const story = !b.story ? '' : dp ? `<p class="expedition-story">${decimalStory(op, da, db)}</p>` : op === 'addition'
    ? `<p class="expedition-story">사과 바구니에 사과가 ${q.dividend}개, 다른 바구니에 ${q.divisor}개 있어요. 모두 합하면 몇 개일까요?</p>`
    : op === 'subtraction'
    ? `<p class="expedition-story">낙엽 ${q.dividend}장 중에서 ${q.divisor}장을 주워 담았어요. 남은 낙엽은 몇 장일까요?</p>`
    : multiplication
    ? `<p class="expedition-story">해바라기 씨앗이 한 봉지에 ${q.dividend}개씩 들어 있어요. ${q.divisor}봉지에는 모두 몇 개가 있을까요?</p>`
    : q.remainder
      ? `<p class="expedition-story">베리 ${q.dividend}개를 한 바구니에 ${q.divisor}개씩 담아요. 가득 찬 바구니 수와 남는 베리를 찾아보세요.</p>`
      : `<p class="expedition-story">베리 ${q.dividend}개를 친구 ${q.divisor}명에게 똑같이 나누어 주면 한 명이 몇 개씩 받을까요?</p>`;
  const linked = b.kind === 'multiplicationGate' && state.multiplicationFinal?.step === 1 ? `<div class="linked-equation">방금 푼 식: <b>${state.multiplicationFinal.left} × ${state.multiplicationFinal.right} = ${state.multiplicationFinal.left * state.multiplicationFinal.right}</b></div>` : '';
  const challenge = !e.arena && (b.goalRounds ?? 1) > 1;
  const questionMarkup = q.remainder
    ? `<div class="question remainder-question" aria-label="${q.dividend} 나누기 ${q.divisor}의 몫과 나머지"><b>${q.dividend}</b><span>÷</span><b>${q.divisor}</b><span>=</span><label>몫<input id="answer" class="active" data-answer-part="answer" aria-label="몫" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="?" readonly></label><label>나머지<input id="remainder" data-answer-part="remainder" aria-label="나머지" inputmode="numeric" autocomplete="off" maxlength="1" placeholder="?" readonly></label></div>`
    : `<div class="question" aria-label="${da} ${info.aria} ${db}"><b>${da}</b><span>${symbol}</span><b>${db}</b><span>=</span><input id="answer" class="active" data-answer-part="answer" aria-label="${operationName}의 답" inputmode="${dp ? 'decimal' : 'numeric'}" autocomplete="off" maxlength="${dp ? 6 : 4}" placeholder="?" readonly></div>`;
  openModal(title(e.arena ? `신비의 시합장 · ${b.round} / 5` : b.kind === 'multiplicationGate' ? '구구단 햇살문' : challenge ? `${b.goalRounds === 5 ? '👑 숲의 대왕 시합' : '연속 수학 시합'} · ${b.round} / ${b.goalRounds}` : `숲속 친구와 ${operationName}`, m.name) + `<div class="battle-top"><span>${info.icon} ${e.arena ? `이번 도전 ${b.score}점` : challenge ? `${b.goalRounds}문제를 모두 풀면 통과해요` : `${e.stage ? `${e.stage}단계 난이도` : '마을 연습 문제'} · 천천히 생각해요`}</span><span id="battle-reward">${rewardReason === 'hint' ? '힌트 연습 · 베리와 경험치 없음' : rewardReason === 'easy' ? '쉬운 계산 연습 · 베리와 경험치 없음' : `🍓 ${reward.berries} · 경험치 ${reward.xp}`}</span></div><div class="monster-portrait ${multiplication ? 'multiplication-portrait' : ''}" id="monster-portrait" style="--monster-color:#${m.color.toString(16).padStart(6, '0')}"><span class="battle-spark one">✦</span><span class="battle-spark two">✦</span><div class="monster-icon" aria-hidden="true">${b.kind === 'multiplicationGate' ? '🌻' : m.icon}</div><div class="monster-speech"><strong>${b.kind === 'multiplicationGate' ? '햇살문의 안내자' : m.name}</strong><span>${challenge ? `문제 ${b.round}/${b.goalRounds} · 끝까지 같이 풀어 봐!` : `${operationName}으로 힘을 보여 줘!`}</span></div></div>${linked}${story}${questionMarkup}<p class="answer-message" id="answer-message" role="status">${q.remainder ? '몫과 나머지를 차례로 적어 볼까요?' : info.ask}</p><div id="hint" hidden></div><div class="number-pad" aria-label="숫자판">${(dp ? [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '지우기'] : [1, 2, 3, 4, 5, 6, 7, 8, 9, '지우기', 0, '확인']).map(n => `<button data-number="${n}" class="${n === '확인' ? 'primary' : ''}" ${n === '.' ? 'aria-label="소수점"' : ''}>${n}</button>`).join('')}${dp ? '<button data-number="확인" class="primary" style="grid-column:1/-1">확인</button>' : ''}</div><div class="battle-footer"><button id="show-hint" class="text-button">💡 힌트 보기</button><button class="text-button" data-close>잠깐 쉬기</button></div><div id="battle-result" hidden></div>`, 'battle-modal');
  if (b.kind === 'multiplicationGate') {
    $('.modal-heading .eyebrow').textContent = `곱셈의 숲 마지막 문 · ${b.round}/2`;
    $('.modal-heading h2').textContent = b.round === 1 ? '곱셈으로 햇살을 밝혀요' : '나눗셈으로 짝을 찾아요';
    $('.battle-top').innerHTML = '<span>🌻 두 식은 서로 이어져 있어요</span><span>틀려도 다시 풀 수 있어요</span>';
  } else if (b.kind !== 'normal') {
    $('.modal-heading .eyebrow').textContent = b.kind === 'expGate' ? '별빛 원정 출구' : '별빛 원정 시합';
    $('.modal-heading h2').textContent = b.kind === 'expGate' ? '마지막 이야기 문제' : m.name;
    $('.battle-top').innerHTML = b.kind === 'expGate' ? `<span>✦ 천천히 풀어도 괜찮아요</span><span>완수 보상 🍓 ${expeditionBerryReward(state.expedition.active?.stage ?? 1)}베리</span>` : '<span>✦ 천천히 풀어도 괜찮아요</span><span>원정 시합 표식을 채워요</span>';
    if (b.kind === 'expGate') {
      $('.monster-icon').textContent = '🌟'; $('.monster-speech strong').textContent = '별빛 친구의 부탁';
      $('.monster-speech span').textContent = '이야기를 읽고 답을 찾아 주세요!';
      const kind = state.expedition.active?.storyKind ?? 0;
      const story = kind === 0 ? `별사탕 ${q.dividend}개를 친구 ${q.divisor}명에게 똑같이 나누어 주면 한 명이 몇 개씩 받을까요?` : `별사탕 ${q.dividend}개를 한 봉지에 ${q.divisor}개씩 담으면 봉지가 몇 개 필요할까요?`;
      $('.question').insertAdjacentHTML('beforebegin', `<p class="expedition-story">${story}</p>`);
    }
  }
  document.querySelectorAll<HTMLButtonElement>('[data-number]').forEach(button => button.onclick = () => enterAnswer(button.dataset.number!));
  document.querySelectorAll<HTMLInputElement>('[data-answer-part]').forEach(input => input.onclick = () => { document.querySelectorAll<HTMLInputElement>('[data-answer-part]').forEach(item => item.classList.toggle('active', item === input)); });
  audio.setBattle(true); // 시합 중에는 빠른 시합 음악
  if (challenge) $('#monster-portrait').insertAdjacentHTML('beforeend', heartsMarkup(b.goalRounds! - b.round + 1, b.goalRounds!));
  if (b.hintQuestion !== q) { b.hint = new HintProgress(); b.hintQuestion = q; }
  $('#show-hint').onclick = () => showHint(); if (b.hint?.stage) showHint(false); $('#answer').focus();
}
/** 여러 문제 시합: 남은 문제를 하트로 보여 주고, 마지막 문제를 맞혀야 몬스터가 쓰러져요. */
function heartsMarkup(left: number, total: number) { return `<div class="monster-hearts" id="monster-hearts" aria-label="남은 문제 ${left}개">${'❤️'.repeat(left)}${'🤍'.repeat(total - left)}</div>`; }
function loseHeart() { const hearts = document.querySelector('#monster-hearts'); if (hearts && battle) hearts.outerHTML = heartsMarkup((battle.goalRounds ?? 1) - battle.round, battle.goalRounds ?? 1); }
/** 정답으로 몬스터를 맞히면 흔들리고 글자가 튀어 올라요. 연속 정답일수록 소리가 높아져요. */
function hitMonster(streak: number) {
  audio.hit(streak); const portrait = document.querySelector<HTMLElement>('#monster-portrait'); if (!portrait) return;
  portrait.classList.remove('hit'); void portrait.offsetWidth; portrait.classList.add('hit');
  const pop = document.createElement('span'); pop.className = 'hit-pop'; pop.textContent = streak >= 2 ? `🔥 ${streak}연속!` : '✦ 맞았어요!'; portrait.append(pop); setTimeout(() => pop.remove(), 1000);
}
const DECIMAL_STORIES = {
  addition: (a: string, b: string) => `리본이 ${a} m와 ${b} m 있어요. 모두 합하면 몇 m일까요?`,
  subtraction: (a: string, b: string) => `끈 ${a} m에서 ${b} m를 잘라 썼어요. 남은 끈은 몇 m일까요?`,
  multiplication: (a: string, b: string) => `한 상자에 사과가 ${a} kg씩 들어 있어요. ${b}상자에는 모두 몇 kg일까요?`,
  division: (a: string, b: string) => b.includes('.') ? `주스 ${a} L를 ${b} L씩 컵에 나누어 담아요. 컵은 몇 개 필요할까요?` : `주스 ${a} L를 ${b}명에게 똑같이 나누어 주면 한 명이 몇 L씩 받을까요?`,
} as const;
function decimalStory(op: Operation, a: string, b: string) { return DECIMAL_STORIES[op](a, b); }
function decimalHint(q: { dividend: number; divisor: number; answer: number; operation?: Operation; places?: readonly [number, number, number] }) {
  const p = q.places!, a = formatScaled(q.dividend, p[0]), b = formatScaled(q.divisor, p[1]), r = formatScaled(q.answer, p[2]), sign = q.operation === 'addition' ? '+' : q.operation === 'subtraction' ? '−' : q.operation === 'multiplication' ? '×' : '÷';
  if (q.operation === 'addition' || q.operation === 'subtraction') {
    const unit = p[0] === 1 ? '0.1' : '0.01';
    return `<p>소수점의 자리를 맞추어 ${unit}이 몇 개인지로 생각해요.</p><div class="split-hint"><span>${unit}이 ${q.dividend}개 ${sign} ${q.divisor}개</span><span>= ${unit}이 ${q.answer}개</span></div><b>${a} ${sign} ${b} = ${r}</b>`;
  }
  if (q.operation === 'multiplication') return `<p>소수점을 빼고 자연수처럼 곱한 뒤, 소수점 아래 자리 수만큼 소수점을 다시 찍어요.</p><div class="split-hint"><span>${q.dividend} × ${q.divisor} = ${q.answer}</span><span>소수점 아래 ${p[2]}자리</span></div><b>${a} × ${b} = ${r}</b>`;
  if (p[1] > 0) return `<p>나누는 수와 나누어지는 수에 똑같이 10을 곱해 자연수로 만들어요.</p><div class="split-hint"><span>${q.dividend} ÷ ${q.divisor} = ${q.answer}</span></div><b>${a} ÷ ${b} = ${r}</b>`;
  return `<p>소수점을 빼고 자연수처럼 나눈 뒤, 몫에 소수점을 맞추어 찍어요.</p><div class="split-hint"><span>${q.dividend} ÷ ${q.divisor} = ${q.answer}</span><span>소수점 아래 ${p[2]}자리</span></div><b>${a} ÷ ${b} = ${r}</b>`;
}
function arithmeticHint(q: { dividend: number; divisor: number; answer: number; operation?: Operation }) {
  const add = q.operation === 'addition', a = q.dividend, b = q.divisor, sign = add ? '+' : '−';
  if (b < 10) return `<p><b>${a}</b>에서 <b>${b}</b>만큼 ${add ? '이어서' : '거꾸로'} 세어 봐요.</p><div class="split-hint"><span>${a} → ${q.answer}</span></div><b>${a} ${sign} ${b} = ${q.answer}</b>`;
  const parts = [Math.floor(b / 100) * 100, Math.floor(b % 100 / 10) * 10, b % 10].filter(Boolean); let current = a;
  const steps = parts.map(part => { const next = add ? current + part : current - part, text = `${current} ${sign} ${part} = ${next}`; current = next; return `<span>${text}</span>`; });
  return `<p>${b}를 <b>${parts.join(', ')}</b>으로 나누어 차례로 ${add ? '더해' : '빼'} 봐요.</p><div class="split-hint">${steps.join('')}</div><b>${a} ${sign} ${b} = ${q.answer}</b>`;
}
function showHint(advance = true) {
  if (!battle) return;
  const q=battle.encounter.question;
  if(advance){battle.hintUsed=true;$('#battle-reward').textContent='힌트 연습 · 베리와 경험치 없음';$('#answer-message').textContent='힌트를 보며 풀어도 통과할 수 있어요. 이번 시합의 베리와 경험치는 받지 않아요.';}
  if(battle.hintQuestion!==q){battle.hintQuestion=q;battle.hint=new HintProgress();}
  const progress=battle.hint??=new HintProgress(),stage=advance?progress.next():progress.first();
  const hint=$('#hint');hint.hidden=false;
  if(stage===3)showFullHint();else hint.innerHTML=earlyCalculationHint(q,stage);
  hint.insertAdjacentHTML('afterbegin',`<p class="hint-step" role="status">도움 ${stage}/3 · ${['생각하는 방법','일부 풀이','전체 풀이와 정답'][stage-1]}</p>`);
  const button=$<HTMLButtonElement>('#show-hint');button.textContent=stage===3?'전체 풀이를 보고 있어요':'💡 도움 더 보기';button.disabled=stage===3;
}
function showFullHint() {
  if(!battle)return;const q=battle.encounter.question;
  $('#hint').hidden=false;
  if (q.places) { $('#hint').innerHTML = decimalHint(q); return; }
  if (q.operation === 'addition' || q.operation === 'subtraction') { $('#hint').innerHTML = arithmeticHint(q); return; }
  if (q.operation === 'multiplication') {
    if (q.dividend < 10) {
      $('#hint').innerHTML = `<p><b>${q.dividend}개씩 ${q.divisor}줄</b>로 놓아 볼게요.</p><div class="multiplication-array" style="--columns:${q.dividend}">${Array.from({ length: q.answer }, () => '<i></i>').join('')}</div><b>${q.dividend} + ${q.dividend} + ${q.dividend}${q.divisor > 3 ? ' + …' : ''} = ${q.answer}</b><p>${q.dividend} × ${q.divisor} = ${q.answer}</p>`;
    } else if (q.divisor >= 10) {
      const tens = Math.floor(q.divisor / 10) * 10, ones = q.divisor % 10;
      $('#hint').innerHTML = `<p>${q.divisor}을 <b>${tens}</b>과 <b>${ones}</b>으로 나누어 곱해요.</p><div class="split-hint"><span>${q.dividend} × ${tens} = ${q.dividend * tens}</span><span>${q.dividend} × ${ones} = ${q.dividend * ones}</span></div><b>${q.dividend * tens} + ${q.dividend * ones} = ${q.answer}</b><p>${q.dividend} × ${q.divisor} = ${q.answer}</p>`;
    } else {
      const hundreds = Math.floor(q.dividend / 100) * 100, tens = Math.floor((q.dividend % 100) / 10) * 10, ones = q.dividend % 10;
      const parts = [hundreds, tens, ones].filter(Boolean);
      $('#hint').innerHTML = `<p>${q.dividend}을 <b>${parts.join(', ')}</b>으로 나누어 곱해요.</p><div class="split-hint">${parts.map(part => `<span>${part} × ${q.divisor} = ${part * q.divisor}</span>`).join('')}</div><b>${parts.map(part => part * q.divisor).join(' + ')} = ${q.answer}</b><p>${q.dividend} × ${q.divisor} = ${q.answer}</p>`;
    }
    return;
  }
  if (q.remainder) {
    const shared = q.divisor * q.answer;
    $('#hint').innerHTML = `<p>${q.dividend}개에서 ${q.divisor}개씩 묶어 보세요.</p><div class="split-hint"><span>${q.divisor} × ${q.answer} = ${shared}</span><span>${q.dividend} − ${shared} = ${q.remainder}</span></div><b>몫 ${q.answer} · 나머지 ${q.remainder}</b><p>나머지는 나누는 수 ${q.divisor}보다 작아야 해요.</p>`;
    return;
  }
  if (battle.kind === 'expGate' && state?.expedition.active?.storyKind === 1) {
    const shown = Math.min(q.answer, 8);
    $('#hint').innerHTML = `<p>${q.dividend}개를 한 봉지에 ${q.divisor}개씩 담아요. 봉지는 몇 개일까요?</p><div class="groups">${Array.from({ length: shown }, () => `<div class="group"><span>${Array.from({ length: q.divisor }, () => '<i></i>').join('')}</span><small>한 봉지</small></div>`).join('')}</div>${q.answer > shown ? '<small>… 봉지가 더 필요해요</small>' : ''}<b>${q.divisor} × □ = ${q.dividend}</b>`;
    return;
  }
  const dots = Math.min(q.answer, 12), more = q.answer > dots ? `<small>… 모두 ${q.answer}개</small>` : '<small>한 묶음</small>';
  $('#hint').innerHTML = `<p>${q.dividend}개를 ${q.divisor}묶음에 똑같이 나눠요.</p><div class="groups">${Array.from({ length: q.divisor }, () => `<div class="group"><span>${Array.from({ length: dots }, () => '<i></i>').join('')}</span>${more}</div>`).join('')}</div><b>${q.divisor} × □ = ${q.dividend}</b><p>한 묶음의 개수를 곱셈으로 확인해 보세요.</p>`;
}
function enterAnswer(key: string) {
  if (!battle || battle.encounter.solved) return;
  const input = (document.querySelector<HTMLInputElement>('[data-answer-part].active') ?? $('#answer')) as HTMLInputElement;
  if (key === '지우기') input.value = input.value.slice(0, -1); else if (key === '확인') submitAnswer(); else if (/^\d$/.test(key) && input.value.length < input.maxLength) input.value += key;
  else if (key === '.' && battle.encounter.question.places && input.value && !input.value.includes('.') && input.value.length < input.maxLength - 1) input.value += '.';
}
window.addEventListener('keydown', e => {
  if (!($('#modal') as HTMLDialogElement).open) return;
  if (curriculumRun?.question.kind === 'number') {
    if (/^\d$/.test(e.key)) { e.preventDefault(); enterCurriculumNumber(e.key); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); enterCurriculumNumber('지우기'); }
    else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); enterCurriculumNumber('확인'); }
    return;
  }
  if (!battle || battle.encounter.solved) return;
  if (/^[\d.]$/.test(e.key)) { e.preventDefault(); enterAnswer(e.key); } else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); enterAnswer('지우기'); } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); enterAnswer('확인'); }
});
function submitAnswer() {
  if (!battle || !state) return; const b = battle, input = $('#answer') as HTMLInputElement;
  const remainderInput = document.querySelector<HTMLInputElement>('#remainder');
  if (!input.value || (b.encounter.question.remainder && !remainderInput?.value)) { $('#answer-message').textContent = b.encounter.question.remainder ? '몫과 나머지를 모두 적어 주세요.' : '숫자판이나 키보드로 답을 적어 주세요.'; return; }
  const submitted = b.encounter.question.remainder ? `${input.value}R${remainderInput!.value}` : input.value;
  const outcome = b.encounter.answer(submitted);
  if (outcome === 'ignored') return;
  if (outcome === 'wrong') { if (!b.missedCurrent) { b.missedCurrent = true; recordAdaptive(false); recordWrongAnswer(state, b.encounter.question); recordCurriculumAttempt(state, b.encounter.question.operation ?? 'division', false); sessionWrong++; } combo = 0; audio.play('wrong'); persist(); $('#answer-message').textContent = '괜찮아요! 묶음을 살펴보고 다시 풀어 볼까요?'; input.value = ''; if (remainderInput) remainderInput.value = ''; showHint(false); return; }
  recordLearningResolution(b.encounter.question.operation ?? 'division', !!b.missedCurrent, !!b.hintUsed);
  sessionCorrect++; combo = b.missedCurrent ? 0 : combo + 1; hitMonster(combo); recordCorrectAnswer(state, b.encounter.monster, !b.missedCurrent && !b.hintUsed); if (!b.missedCurrent) { recordCurriculumAttempt(state, b.encounter.question.operation ?? 'division', true); if (!b.hintUsed) { addBossDamage(localStorage); recordAdaptive(true); } } state.discoveries.outfits.includes(state.outfit) || state.discoveries.outfits.push(state.outfit); if (state.pet >= 0 && !state.discoveries.pets.includes(state.pet)) state.discoveries.pets.push(state.pet);
  if (!b.encounter.arena && !['multiplicationGate', 'expGate'].includes(b.kind) && b.round < (b.goalRounds ?? 1)) {
    audio.play('correct'); world.celebrate(); persist();
    $('#answer-message').textContent = combo >= 2 ? `🔥 ${combo}문제 연속 정답! 다음 문제도 함께 풀어요.` : '정답이에요! 다음 문제도 함께 풀어요.'; loseHeart(); $('.number-pad').hidden = true; $('.battle-footer').hidden = true; $('#hint').hidden = true; $('#battle-result').hidden = false;
    $('#battle-result').innerHTML = `<div class="reward-banner"><strong>✨ ${b.round}번째 문제 성공!</strong><p>${MONSTERS[b.encounter.monster].name} 친구와 ${b.goalRounds! - b.round}문제를 더 풀면 보상을 받아요.</p></div><button class="primary wide" id="next-battle">다음 문제 풀기 →</button>`;
    $('#next-battle').onclick = continueFriendBattle; $('#next-battle').focus(); return;
  }
  if (b.kind === 'multiplicationGate') {
    const gate = answerMultiplicationFinal(state, b.encounter.question.answer);
    if (!gate.correct) return;
    if (!gate.complete) { persist(); battle = null; toast('첫 번째 식을 풀었어요! 이어지는 나눗셈을 만나 봐요.'); startMultiplicationGate(); return; }
    b.result = { berries: 0, xp: 0, score: 0, levels: 0, milestones: [] };
  } else if (b.kind === 'expMonster') {
    if (!defeatExpeditionMonster(state, Number(b.id.slice('expMonster'.length)))) return;
    b.result = { berries: 0, xp: 0, score: 0, levels: 0, milestones: [] };
  } else if (b.kind === 'expGate') {
    const completed = finishExpedition(state, b.encounter.question.answer);
    if (!completed) return;
    b.newTitle = completed.newTitle;
    b.result = { berries: completed.berries, xp: 0, score: 0, levels: 0, milestones: [] };
  } else {
    const rewardEligible = !battleRewardReason(state, b.encounter.question, !!b.hintUsed, b.practice?.operation === b.encounter.question.operation ? (b.adaptiveTier ?? b.practice?.tier) : undefined);
    b.result = b.encounter.arena ? grantReward(state, b.encounter.monster, true, Date.now(), rewardEligible) : (finishHunt(state, Number(b.id.slice(7)), rewardEligible) ?? rematchHunt(state, Number(b.id.slice(7)), rewardEligible));
  }
  if (!b.result) return;
  b.score += b.result.score;
  if (b.encounter.arena) state.best = Math.max(state.best, b.score); else if (b.kind === 'normal' || b.kind === 'expMonster') world.defeat(b.id);
  audio.setBattle(false); audio.play(b.result.levels ? 'level' : 'victory'); world.celebrate(); persist(); refresh();
  $('#answer-message').textContent = '정답이에요! 정말 잘했어요!'; $('#monster-portrait').classList.add('defeated');
  $('.number-pad').hidden = true; $('.battle-footer').hidden = true; $('#hint').hidden = true;
  $('#battle-result').hidden = false;
  const clearReward = (b.result as ReturnType<typeof grantReward> & { clearReward?: number }).clearReward ?? 0, completionReward = (b.result as ReturnType<typeof grantReward> & { completionReward?: number }).completionReward ?? 0;
  const rewardReason = battleRewardReason(state, b.encounter.question, !!b.hintUsed, b.practice?.operation === b.encounter.question.operation ? (b.adaptiveTier ?? b.practice?.tier) : undefined);
  const practiceMessage = rewardReason === 'hint' ? '힌트를 보며 푼 시합이라 이번 베리·경험치·점수는 없어요. 통과 기록은 남아요.' : rewardReason === 'easy' ? '지금 학년보다 쉬운 계산은 보상 없는 연습이에요. 더 어려운 문제에 도전해 보세요.' : '';
  if (b.kind === 'multiplicationGate') {
    $('#battle-result').innerHTML = `<div class="reward-banner multiplication-reward"><strong>🌻 곱셈의 숲 완전 정복!</strong><p>「곱셈숲 탐험가」 칭호를 얻었어요.</p><p>나의 방에 놓을 수 있는 <b>구구단 해바라기 화분</b>도 받았어요!</p><p>두 식이 서로 도와주는 곱셈과 나눗셈의 짝을 찾아냈어요.</p></div><button class="primary wide" id="next-battle">마을로 돌아가기 →</button>`;
    $('#next-battle').onclick = nextBattle; $('#next-battle').focus(); return;
  }
  if (b.kind !== 'normal') {
    $('#battle-result').innerHTML = `<div class="reward-banner"><strong>${b.kind === 'expGate' ? '🌟 별빛 원정 완수!' : '✦ 별빛 시합 성공!'}</strong><p>${b.kind === 'expGate' ? `🍓 완주 보상 +${b.result.berries}베리! 원정 ${state.expedition.completed}번을 완료했어요. ${b.newTitle && b.newTitle > 0 ? `새 칭호 「${EXPEDITION_TITLES[b.newTitle].name}」도 얻었어요!` : '다음 원정도 바로 떠날 수 있어요.'}` : `시합 ${state.expedition.active?.monsters.length ?? 2} / 2 · 출구까지 가 볼까요?`}</p><p>${b.kind === 'expGate' ? '원정을 끝까지 해냈어요! 다음 원정도 떠나 볼까요?' : '출구 문제까지 풀면 원정 완주 베리를 받아요.'}</p></div><button class="primary wide" id="next-battle">${b.kind === 'expGate' ? '다음 원정 고르기 →' : '숲으로 돌아가기'}</button>`;
    $('#next-battle').onclick = nextBattle; $('#next-battle').focus(); return;
  }
  $('#battle-result').innerHTML = `<div class="reward-banner"><strong>${OPERATION_INFO[b.encounter.question.operation ?? 'division'].icon} 멋진 ${OPERATION_INFO[b.encounter.question.operation ?? 'division'].name}!</strong><p>🍓 +${b.result.berries}베리 · 경험치 +${b.result.xp}${b.encounter.arena ? ` · +${b.result.score}점` : ''}</p>${practiceMessage ? `<p class="note">${practiceMessage}</p>` : ''}${!b.encounter.arena && clearReward ? `<p class="level-up">단계 통과! 추가 +${clearReward}베리와 다음 길을 받았어요.</p>` : ''}${completionReward ? `<p class="level-up">🎉 ${FOREST_INFO[state.forest].name} 완주 선물 +${completionReward}베리!</p>` : ''}${b.result.levels ? `<p class="level-up">레벨 ${state.level}! 선물 ${b.result.levels * 20}베리도 받았어요.</p>` : ''}${b.result.milestones.map(gift => `<p class="level-easter-egg">🎁 비밀 선물 발견! 레벨 ${gift.level} 달성 · ${gift.berries.toLocaleString()}베리를 받았어요!</p>`).join('')}</div><button class="primary wide" id="next-battle">${b.encounter.arena ? b.round < 5 ? '다음 친구 만나기 →' : '시합 결과 보기' : '숲으로 돌아가기'}</button>`;
  $('#next-battle').onclick = nextBattle; $('#next-battle').focus();
}
function nextBattle() {
  if (!battle || !state || !battle.encounter.solved) return;
  if (sessionExpired) { battle = null; showSessionSummary(); return; }
  if (battle.kind === 'multiplicationGate') { battle = null; switchStage(0, 'multiplication'); openModal(title('해바라기 편지', '곱셈의 숲을 모두 밝혔어요!') + '<div class="arena-intro"><div class="arena-symbol">🌻</div><p>곱셈숲 탐험가가 된 것을 축하해요!<br>새 해바라기 화분은 나의 방에서 눌러 설치할 수 있어요.</p><button class="primary wide" data-close>마을에서 계속 놀기</button></div>'); return; }
  if (battle.kind === 'expGate') { battle = null; switchStage(0); openExpeditionBoard(); return; }
  if (!battle.encounter.arena) { battle = null; closeModal(); return; }
  if (battle.round === 5) { const score = battle.score; battle = null; openModal(title('오늘도 한 뼘 자랐어요', '시합을 마쳤어요!') + `<div class="arena-intro"><div class="arena-symbol">🏆</div><h3>${score}점</h3><p>다섯 친구와의 수학 시합 성공!<br>나의 최고 기록은 ${state.best}점이에요.</p><button class="primary wide" data-close>마을로 돌아가기</button></div>`); return; }
  const previous = battle.encounter.question, difficultyStage = battle.encounter.stage; battle.round++; battle.encounter = new Encounter(Math.floor(Math.random() * MONSTERS.length), true, state.level, previous, difficultyStage, state.settings.maxDividend, previous.operation ?? battleMode(state, true).operation, state.settings.multiplicationRange, practiceFor(battle.practice), state.grade); battle.result = null; battle.missedCurrent = false; battle.hintUsed = false; battle.story = battle.round % 3 === 0; renderBattle();
}
function continueFriendBattle() {
  if (!battle || !state || !battle.encounter.solved || battle.round >= (battle.goalRounds ?? 1)) return;
  const previous = battle.encounter.question, operation = previous.operation ?? 'division'; battle.round++;
  battle.encounter = new Encounter(battle.encounter.monster, false, state.level, previous, battle.encounter.stage, state.settings.maxDividend, operation, state.settings.multiplicationRange, practiceFor(battle.practice), state.grade); battle.result = null; battle.missedCurrent = false; renderBattle();
}
function exitBattle() { if (battle?.encounter.arena) toast(`시합 ${battle.score}점 · 받은 보상은 저장했어요.`); battle = null; persist(); if (sessionExpired) { showSessionSummary(); return; } closeModal(); }

function openShop(kind: 'weapon' | 'outfit', selectedId?: number) {
  if (!state) return;
  rememberMenu(`shop:${kind}`, () => openShop(kind, selectedId));
  state.tutorial.shop = true; refresh(); persist();
  const s = state, items = kind === 'weapon' ? WEAPONS : OUTFITS, owned = kind === 'weapon' ? s.weapons : s.outfits;
  const id = selectedId ?? s[kind], item = items[id], level = owned[id], wearing = s[kind] === id;
  const cards = items.map((it, i) => {
    const itemLevel = owned[i], hasItem = itemLevel !== undefined, active = s[kind] === i;
    const status = active ? (kind === 'weapon' ? '✓ 지금 들고 있어요' : '✓ 지금 입고 있어요') : hasItem ? (kind === 'outfit' ? `보유 · 꾸밈 ${itemLevel}/2` : `보유 · 강화 +${itemLevel}`) : `🍓 ${it.price.toLocaleString()}베리`;
    return `<button class="item-card ${i === id ? 'selected' : ''} ${active ? 'is-active' : ''}" data-item="${i}" aria-pressed="${i === id}"><span class="item-swatch" style="--item-color:${itemColor(it.color)}">${kind === 'weapon' ? WEAPONS[i].icon : OUTFIT_ICONS[i]}</span><strong>${it.name}</strong><small>${status}</small></button>`;
  }).join('');
  const effect = kind === 'weapon' ? `<p>${weaponExplanation(id, level ?? 0)}</p>` : `${outfitEffectBadges(id)}<p><b>${OUTFITS[id].desc}</b><br>${OUTFITS[id].effect}</p>`;
  const maxLevel = kind === 'weapon' ? 3 : 2, upgradeCosts = kind === 'weapon' ? WEAPON_UPGRADES : OUTFIT_UPGRADES;
  openModal(title(kind === 'weapon' ? '강지후의 무기 상점' : '오지후의 의상 상점', kind === 'weapon' ? `반짝이는 무기 ${WEAPONS.length}종` : `입혀 보고 고르는 의상 ${OUTFITS.length}벌`) + `<p class="shop-explainer">${kind === 'weapon' ? '무기는 몬스터 보상, 시합장 점수, 나무를 베는 횟수를 바꿔요.' : '옷을 누르면 내 캐릭터에게 입힌 3D 모습을 먼저 볼 수 있어요. 효과는 아래 색깔표에서 확인해요.'} <b>🍓 ${s.berries.toLocaleString()}베리</b></p><div class="shop-layout"><div class="item-grid">${cards}</div><div class="item-detail ${kind}-detail"><div id="shop-avatar" class="preview-stage" style="--item-color:${itemColor(item.color)}"></div><span class="preview-tag">360° 천천히 보기</span><h3>${item.name}${level !== undefined ? ` <small class="level-mark">+${level}</small>` : ''}</h3>${effect}<button class="primary wide" id="buy-item" ${wearing ? 'disabled' : ''}>${wearing ? (kind === 'weapon' ? '지금 들고 있어요' : '지금 입고 있어요') : level !== undefined ? (kind === 'weapon' ? '이 무기 들기' : '이 옷 입기') : `${item.price.toLocaleString()}베리로 구매하고 ${kind === 'weapon' ? '들기' : '입기'}`}</button>${level !== undefined ? `<button class="secondary wide" id="upgrade-item" ${level >= maxLevel ? 'disabled' : ''}>${level >= maxLevel ? '최고 꾸밈 단계예요 ✦' : `꾸밈 강화 ${level + 1}단계 · ${upgradeCosts[level].toLocaleString()}베리`}</button><small class="upgrade-note">${kind === 'weapon' ? '강화할 때마다 시합장 점수 배율이 0.1 늘고, 나무 힘이 1 늘어요.' : '강화하면 자수와 반짝이는 장식이 더해져요. 베리·경험치 효과는 그대로예요.'}</small>` : ''}<p class="error" id="shop-error" role="alert"></p></div></div>`, `shop-modal ${kind}-shop`);
  preview = new AvatarPreviewRuntime($('#shop-avatar')); preview.show(s.character, kind === 'outfit' ? id : s.outfit, kind === 'weapon' ? id : s.weapon, kind === 'outfit' ? level ?? 0 : s.outfits[s.outfit], kind === 'weapon' ? level ?? 0 : s.weapons[s.weapon]);
  document.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b => b.onclick = () => openShop(kind, Number(b.dataset.item)));
  $('#buy-item').onclick = () => shopAction(() => buy(s, kind, id), kind, id);
  if ($('#upgrade-item')) $('#upgrade-item').onclick = () => shopAction(() => upgrade(s, kind, id), kind, id);
}
function shopAction(action: () => string, kind: 'weapon' | 'outfit', id: number) { try { const msg = action(); if (kind === 'outfit' && !state!.discoveries.outfits.includes(id)) state!.discoveries.outfits.push(id); audio.play('buy'); syncAvatar(); refresh(); persist(); openShop(kind, id); toast(msg); } catch (e) { $('#shop-error').textContent = (e as Error).message; } }

function openInventory(tab: 'weapon' | 'outfit' | 'ride' | 'pet' = 'weapon', selectedId?: number, mode: 'bag' | 'shop' = 'bag') {
  if (!state) return;
  if (mode === 'shop' && tab !== 'ride') return;
  rememberMenu(mode === 'shop' ? 'ride-shop' : 'inventory', () => openInventory(tab, selectedId, mode));
  const s = state;
  const tabs = mode === 'shop' ? '<p>탈것을 골라 미리 타 보세요. 구매한 탈것은 가방에도 보관돼요.</p>' : `<div class="inventory-tabs"><button data-inventory-tab="weapon" class="${tab === 'weapon' ? 'active' : ''}">⚔ 무기</button><button data-inventory-tab="outfit" class="${tab === 'outfit' ? 'active' : ''}">👗 옷</button><button data-inventory-tab="ride" class="${tab === 'ride' ? 'active' : ''}" aria-label="탈것">🪽 탈것</button><button data-inventory-tab="pet" class="${tab === 'pet' ? 'active' : ''}">🐾 펫</button></div>`;
  const summary = `<p class="inventory-summary"><span>무기 ${Object.keys(s.weapons).length} · 옷 ${Object.keys(s.outfits).length} · 탈것 ${Object.keys(s.rides).length} · 펫 ${Object.keys(s.pets).length}</span><b>🍓 ${s.berries.toLocaleString()}베리</b></p>`;
  if (tab === 'weapon') {
    const ownedIds = Object.keys(s.weapons).map(Number).sort((a, b) => a === s.weapon ? -1 : b === s.weapon ? 1 : a - b);
    const id = selectedId !== undefined && ownedIds.includes(selectedId) ? selectedId : s.weapon;
    const item = WEAPONS[id];
    const cards = ownedIds.map(itemId => { const weapon = WEAPONS[itemId], active = s.weapon === itemId; return `<button class="collection-card ${itemId === id ? 'selected' : ''} ${active ? 'active' : ''}" data-collection-item="${itemId}" aria-pressed="${itemId === id}"><span class="collection-icon" style="--item-color:${itemColor(weapon.color)}">${weapon.icon}</span><strong>${weapon.name} +${s.weapons[itemId]}</strong><small>${active ? '장착 중' : '보유 중'}</small></button>`; }).join('');
    openModal(title('나의 가방', '내가 모은 무기') + `${tabs}${summary}<div class="collection-showcase"><div class="collection-picker" role="list">${cards}</div><section class="collection-detail"><div id="collection-preview" class="collection-preview" style="--item-color:${itemColor(item.color)}"></div><span class="preview-tag">3D로 무기 보기</span><h3>${item.icon} ${item.name} +${s.weapons[id]}</h3><p>몬스터를 이기면 기본 보상에 베리 ${item.bonus}개를 더 받아요.<br>시합장 점수는 ${(item.multiplier + s.weapons[id] * .1).toFixed(1)}배가 돼요.<br>나무는 약 ${Math.ceil(7 / (item.treePower + s.weapons[id]))}번 때리면 벨 수 있어요.</p><button class="primary wide" id="collection-action" ${s.weapon === id ? 'disabled' : ''}>${s.weapon === id ? '지금 장착 중이에요' : '이 무기 장착하기'}</button></section></div>`, 'inventory-modal collection-modal weapon-collection');
    preview = new AvatarPreviewRuntime($('#collection-preview'));
    preview.show(s.character, s.outfit, id, s.outfits[s.outfit], s.weapons[id], s.hairstyle, s.face);
    document.querySelectorAll<HTMLButtonElement>('[data-collection-item]').forEach(button => button.onclick = () => openInventory('weapon', Number(button.dataset.collectionItem)));
    $('#collection-action').onclick = () => { s.weapon = id; audio.play('buy'); syncAvatar(); refresh(); persist(); openInventory('weapon', id); toast('새 무기를 장착했어요!'); };
  } else {
    const ownedIds = tab === 'outfit' ? Object.keys(s.outfits).map(Number) : tab === 'pet' ? Object.keys(s.pets).map(Number) : (mode === 'shop' ? RIDES.map((_, id) => id) : Object.keys(s.rides).map(Number)).sort((a, b) => RIDES[a].price - RIDES[b].price);
    const current = tab === 'outfit' ? s.outfit : tab === 'ride' ? s.ride : s.pet;
    const id = selectedId !== undefined && ownedIds.includes(selectedId) ? selectedId : current >= 0 && ownedIds.includes(current) ? current : ownedIds[0] ?? -1;
    if (id < 0) {
      const pet = tab === 'pet';
      openModal(title('나의 가방', pet ? '나의 펫 친구들' : '나의 탈것') + `${tabs}${summary}<div class="collection-empty"><span>${pet ? '🐾' : '🪽'}</span><strong>아직 ${pet ? '함께하는 펫' : '보유한 탈것'}이 없어요</strong><p>${pet ? '윤준이의 펫 상점에서 친구를 만나요.' : '나현이의 라이딩 상점에서 탈것을 골라요.'}</p><button id="collection-shop" class="primary">${pet ? '펫' : '라이딩'} 상점 구경하기</button></div>`, 'inventory-modal collection-modal');
      $('#collection-shop').onclick = pet ? () => openPetShop() : openRideShop;
    } else {
      const cards = ownedIds.map(itemId => {
        const item = tab === 'outfit' ? OUTFITS[itemId] : tab === 'ride' ? RIDES[itemId] : PETS[itemId], active = current === itemId, owned = tab !== 'ride' || !!s.rides[itemId];
        const icon = tab === 'outfit' ? OUTFIT_ICONS[itemId] : tab === 'ride' ? RIDES[itemId].icon : PETS[itemId].icon;
        const label = active ? (tab === 'outfit' ? '입는 중' : tab === 'ride' ? '타는 중' : '함께하는 중') : owned ? '보유 중' : `🍓 ${item.price.toLocaleString()}`;
        return `<button class="collection-card ${itemId === id ? 'selected' : ''} ${active ? 'active' : ''} ${owned ? '' : 'locked'}" data-collection-item="${itemId}" aria-pressed="${itemId === id}"><span class="collection-icon" style="--item-color:${itemColor(item.color)}">${icon}</span><strong>${item.name}</strong><small>${label}</small></button>`;
      }).join('');
      const item = tab === 'outfit' ? OUTFITS[id] : tab === 'ride' ? RIDES[id] : PETS[id], active = current === id, owned = tab === 'outfit' || tab === 'pet' || !!s.rides[id];
      const detail = tab === 'outfit'
        ? `${outfitEffectBadges(id)}<p><b>${OUTFITS[id].desc}</b><br>${OUTFITS[id].effect}<br><span class="decoration-copy">꾸밈 강화 ${s.outfits[id]}/2단계 · 능력 효과는 강화해도 그대로예요.</span></p>`
        : tab === 'ride'
          ? `${rideEffectBadges(id)}<p><b>${RIDES[id].desc}</b><br>${RIDES[id].flying ? '점프하면 둥실 떠오르고, 물과 낮은 장애물을 안전하게 지나가요.' : '땅 위에서 통통 움직이며 숲길을 빠르게 달려요.'}</p>`
          : `${petEffectBadges(id)}<p><b>${PETS[id].desc}</b><br>탈것을 타고 있어도 뒤따라오며, 베리를 찾으면 직접 달려가 먹어요.</p><button id="pet-friend-detail" class="secondary wide">🐾 이름 짓기 · 쓰다듬기 · 재주</button>`;
      const actionText = active ? (tab === 'outfit' ? '지금 입고 있어요' : tab === 'ride' ? '지금 타고 있어요' : '지금 함께하고 있어요') : owned ? (tab === 'outfit' ? '이 옷 입기' : tab === 'ride' ? '이 탈것 타기' : '이 펫과 함께하기') : `${item.price.toLocaleString()}베리로 구매하고 타기`;
      const restButton = tab === 'ride' ? `<button class="text-button wide" id="collection-rest" ${s.ride < 0 ? 'disabled' : ''}>👟 탈것에서 내려 걷기</button>` : tab === 'pet' ? `<button class="text-button wide" id="collection-rest" ${s.pet < 0 ? 'disabled' : ''}>🏡 펫을 집에서 쉬게 하기</button>` : '';
      const heading = tab === 'outfit' ? '나의 의상실' : tab === 'ride' ? mode === 'shop' ? '나현이의 라이딩 상점' : '나의 탈것' : '나의 펫 친구들';
      openModal(title(mode === 'shop' ? '상점거리 · 탈것 구매' : '나의 가방', heading) + `${tabs}${summary}<div class="collection-showcase"><div class="collection-picker" role="list">${cards}</div><section class="collection-detail"><div id="collection-preview" class="collection-preview" style="--item-color:${itemColor(item.color)}"></div><span class="preview-tag">3D로 천천히 보기</span><h3>${item.name}</h3>${detail}<button class="primary wide" id="collection-action" ${active ? 'disabled' : ''}>${actionText}</button>${restButton}<p class="error" id="inventory-error" role="alert"></p></section></div>${mode === 'bag' && tab === 'ride' ? '<button id="collection-shop" class="secondary wide">라이딩 상점 구경하기</button>' : ''}`, `inventory-modal collection-modal ${tab}-collection`);
      preview = new AvatarPreviewRuntime($('#collection-preview'));
      if (tab === 'outfit') preview.show(s.character, id, s.weapon, s.outfits[id], s.weapons[s.weapon], s.hairstyle, s.face);
      if (tab === 'ride') preview.showRide(id, s.character, s.outfit, s.weapon, s.outfits[s.outfit], s.weapons[s.weapon], s.hairstyle, s.face);
      if (tab === 'pet') preview.showPet(id);
      if (tab === 'pet') $('#pet-friend-detail').onclick = () => openPetCare(id);
      document.querySelectorAll<HTMLButtonElement>('[data-collection-item]').forEach(button => button.onclick = () => openInventory(tab, Number(button.dataset.collectionItem), mode));
      $('#collection-action').onclick = () => { try { let msg = ''; if (tab === 'outfit') { s.outfit = id; msg = `${OUTFITS[id].name}을(를) 입었어요!`; } else if (tab === 'ride') msg = buyRide(s, id); else msg = buyPet(s, id); audio.play('buy'); syncAvatar(); refresh(); persist(); openInventory(tab, id, mode); toast(msg); } catch (e) { $('#inventory-error').textContent = (e as Error).message; } };
      const rest = document.querySelector<HTMLButtonElement>('#collection-rest'); if (rest) rest.onclick = () => { const msg = tab === 'ride' ? dismount(s) : unequipPet(s); syncAvatar(); refresh(); persist(); openInventory(tab, id, mode); toast(msg); };
      const shop = document.querySelector<HTMLButtonElement>('#collection-shop'); if (shop) shop.onclick = openRideShop;
    }
  }
  document.querySelectorAll<HTMLButtonElement>('[data-inventory-tab]').forEach(button => button.onclick = () => openInventory(button.dataset.inventoryTab as 'weapon' | 'outfit' | 'ride' | 'pet'));
}
function openRideShop() { openInventory('ride', undefined, 'shop'); }

function openPetCare(id: number) {
  if (!state) return;
  rememberMenu('pet-care', () => openPetCare(id));
  if (!state || !state.pets[id]) return;
  const s = state, friend = petFriend(s, id), active = s.pet === id;
  openModal(title('🐾 나의 펫 친구', friend.name || PETS[id].name) + `<div id="pet-care-preview" class="collection-preview"></div><p class="pet-bond">친밀도 ${friend.bond}/30 · ${friend.bond < 3 ? '서로 알아가는 사이' : friend.bond < 12 ? '함께 걷는 친구' : '마음이 통하는 친구'}<span style="--bond:${friend.bond / 30 * 100}%"></span></p><p class="note">함께 걸으면 친밀도가 올라요. 쉬는 동안에는 줄어들지 않아요.<br>3: 앉기 · 8: 빙글빙글 · 12: 꽃 목걸이</p><label class="pet-name-label">우리 펫 이름 <input id="pet-friend-name" maxlength="10" value="${escape(friend.name)}" placeholder="${escape(PETS[id].name)}"></label><button id="pet-name-save" class="secondary wide">이름 저장</button><div class="pet-tricks">${PET_TRICKS.map(trick => `<button data-pet-trick="${trick.action}" ${!active || friend.bond < trick.bond ? 'disabled' : ''}>${trick.bond > friend.bond ? `🔒 친밀도 ${trick.bond}` : trick.name}</button>`).join('')}<button data-pet-trick="sleep" ${active ? '' : 'disabled'}>잠깐 쉬기</button></div>${!active ? '<p class="note">인벤토리에서 이 펫과 함께하기를 누르면 같이 놀 수 있어요.</p>' : '<p class="note">재주를 누르면 숲에서 직접 보여 줘요. 움직이면 다시 따라와요.</p>'}<button id="pet-ribbon" class="secondary wide" ${friend.bond < 12 ? 'disabled' : ''}>${friend.bond < 12 ? '🔒 친밀도 12에 꽃 목걸이' : friend.accessory ? '꽃 목걸이 벗기' : '꽃 목걸이 입히기'}</button><button class="text-button wide" data-close>숲으로 돌아가기</button>`, 'pet-care-modal');
  preview = new AvatarPreviewRuntime($('#pet-care-preview')); preview.showPet(id);
  $('#pet-name-save').onclick = () => { friend.name = ($('#pet-friend-name') as HTMLInputElement).value.trim().replace(/[\u0000-\u001f<>]/g, '').slice(0, 10); persist(); toast('펫 이름을 저장했어요!'); openPetCare(id); };
  $('#pet-ribbon').onclick = () => { if (friend.bond < 12) return; friend.accessory = !friend.accessory; if (active) world.dressPet(friend.accessory); persist(); openPetCare(id); };
  document.querySelectorAll<HTMLButtonElement>('[data-pet-trick]').forEach(button => button.onclick = () => {
    if (!active) return;
    const reaction = button.dataset.petTrick as PetReaction;
    if (reaction === 'happy') strokePet(s);
    persist(); closeModal(); world.reactPet(reaction); toast(`${friend.name || PETS[id].name}${reaction === 'happy' ? '에게 마음을 전했어요! 🩷' : reaction === 'sleep' ? '가 포근하게 쉬어요.' : '의 재주를 보세요!'} · 친밀도 ${friend.bond}/30`);
  });
}

const FURNITURE = ['🍄 버섯 의자', '🪴 새싹 화분', '🧸 곰 인형', '🪟 둥근 창문', '🛏 구름 침대', '📚 모험 책장', '🕯 별빛 조명', '🧺 베리 바구니', '🌻 구구단 해바라기 화분', '🌙 달빛 컴퍼스 장식', '🍰 조각케이크 쿠션', '⚖️ 물방울 저울', '📊 별빛 그래프판', '🎓 학년 수학 수료장', '📐 반듯반듯 도형 액자', '🕰️ 똑딱 숲시계', '🔟 열칸 무지개 러그', '✉️ 숲 편지 액자', '💧 반짝 호수 유리병', '🌟 별빛 나무 장식'];
let selectedRoomFurniture: number | null = null;
const furnitureIcon = (id: number) => FURNITURE[id].split(' ')[0];
const furnitureName = (id: number) => FURNITURE[id].split(' ').slice(1).join(' ');
function furnitureUnlocked(s: Save, id: number) {
  if (id >= 17 && id <= 19) return s.story.completed.includes(id - 17);
  if (id === 8) return s.teacherMode || s.multiplicationCompleted;
  if (id >= 9 && id <= 12) return s.teacherMode || s.curriculum.units[(['circle', 'fraction', 'measurement', 'pictograph'] as NewCurriculumUnitId[])[id - 9]].rewardClaimed;
  if (id === 13) return s.teacherMode || s.curriculum.graduationClaimed;
  if (id >= 14 && id <= 16) return s.teacherMode || s.curriculum.units[(['plane', 'lengthTime', 'fractionDecimal'] as NewCurriculumUnitId[])[id - 14]].rewardClaimed;
  const progress = s.discoveries.monsters.length + s.discoveries.pets.length + s.journey.maps.slice(1).filter(m => m.cleared).length + s.multiplicationJourney.maps.slice(1).filter(m => m.cleared).length; return id < Math.min(8, progress);
}
function openRoom() {
  if (!state) return;
  rememberMenu('room', openRoom);
  if (!state) return;
  const placed = state.room.furniture, unlockedFurniture = FURNITURE.filter((_, id) => furnitureUnlocked(state!, id)).length;
  if (selectedRoomFurniture !== null && !furnitureUnlocked(state, selectedRoomFurniture)) selectedRoomFurniture = null;
  const furnitureCards = FURNITURE.map((item, id) => {
    const unlocked = furnitureUnlocked(state!, id);
    if(!unlocked)return '';
    return `<button class="item-card ${selectedRoomFurniture===id ? 'selected' : ''}" data-furniture="${id}" aria-pressed="${selectedRoomFurniture===id}"><span class="item-swatch">${item.split(' ')[0]}</span><strong>${item.split(' ').slice(1).join(' ')}</strong><small>${placed.includes(id) ? '방에 놓인 가구 · 눌러서 옮기기' : '보관 중 · 눌러서 놓기'}</small></button>`;
  }).join('');
  const cells = Array.from({ length: ROOM_GRID_COLUMNS * ROOM_GRID_ROWS }, (_, index) => {
    const column = index % ROOM_GRID_COLUMNS, row = Math.floor(index / ROOM_GRID_COLUMNS);
    const occupant = placed.find(id => { const p = roomFurniturePosition(state!, id); return p.column === column && p.row === row; });
    const selected = occupant !== undefined && occupant === selectedRoomFurniture;
    return `<button class="room-layout-cell ${occupant === undefined ? 'empty' : 'filled'} ${selected ? 'selected' : ''}" data-room-column="${column}" data-room-row="${row}" ${occupant === undefined ? '' : `data-room-occupant="${occupant}" draggable="true"`} aria-label="${occupant === undefined ? `${row + 1}번째 줄 ${column + 1}번째 빈 자리` : `${FURNITURE[occupant]}${selected ? ', 선택됨' : ''}`}">${occupant === undefined ? '<span class="room-empty-dot">＋</span>' : `<span class="room-cell-icon">${furnitureIcon(occupant)}</span><small>${furnitureName(occupant)}</small>`}</button>`;
  }).join('');
  const chosen = selectedRoomFurniture === null ? '먼저 아래에서 가구를 골라요' : `${FURNITURE[selectedRoomFurniture]} · 원하는 칸을 눌러요`;
  openModal(title('① 가구 고르기 → ② 빈칸 누르기', '내 방 꾸미기') + `<section class="room-placement"><div class="room-layout-header"><strong role="status">${chosen}</strong></div><div class="room-layout-board" role="grid" aria-label="내 방 가구 배치판">${cells}</div><p class="room-save-note">✓ 바로 저장돼요 · 놓인 가구를 눌러 선택할 수도 있어요.</p><h3>내 가구 ${unlockedFurniture}개</h3><div class="room-easy-catalog">${furnitureCards || '<p>모험에서 친구를 만나면 가구를 발견해요.</p>'}</div><button id="room-store-selected" class="secondary wide" ${selectedRoomFurniture!==null&&placed.includes(selectedRoomFurniture)?'':'disabled'}>선택한 가구 보관하기</button></section><details class="room-furniture-drawer"><summary>더 세밀하게 옮기기 · 자동 정리</summary><p>다른 가구가 있는 칸으로 옮기면 두 가구의 자리가 바뀌어요.</p><div class="room-move-pad"><button data-room-move="up">▲ 위</button><button data-room-move="left">◀ 왼쪽</button><button data-room-move="down">▼ 아래</button><button data-room-move="right">▶ 오른쪽</button></div><button class="text-button wide" id="room-auto-arrange" ${placed.length?'':'disabled'}>가구 자동 정리</button></details><button class="primary wide" data-close>완성! 방 둘러보기</button>`, 'room-modal');
  const moveFurniture = (id: number, column: number, row: number, message = '새 자리로 옮겼어요!') => {
    if(!placed.includes(id)){
      if(placed.some(other=>{const p=roomFurniturePosition(state!,other);return p.column===column&&p.row===row;})){toast('＋가 있는 빈자리를 눌러 주세요.');return;}
      if(!furnitureUnlocked(state!,id)||!addRoomFurniture(state!,id)){toast('방이 가득 찼어요. 가구 하나를 보관하면 놓을 수 있어요.');return;}
    }
    if (!placeRoomFurniture(state!, id, column, row)) return;
    selectedRoomFurniture = id; world.updateRoomFurniture(state!); persist(); openRoom(); toast(`${FURNITURE[id]} ${message}`);
  };
  document.querySelectorAll<HTMLButtonElement>('[data-room-select]').forEach(button => button.onclick = () => { selectedRoomFurniture = Number(button.dataset.roomSelect); openRoom(); });
  document.querySelectorAll<HTMLButtonElement>('[data-room-column]').forEach(cell => {
    cell.onclick = () => { const occupant = cell.dataset.roomOccupant === undefined ? null : Number(cell.dataset.roomOccupant); if (occupant !== null && (selectedRoomFurniture === null || selectedRoomFurniture === occupant)) { selectedRoomFurniture = occupant; openRoom(); return; } if(selectedRoomFurniture===null){toast('먼저 놓을 가구를 골라 주세요.');return;} moveFurniture(selectedRoomFurniture, Number(cell.dataset.roomColumn), Number(cell.dataset.roomRow)); };
    cell.ondragstart = event => { const id = Number(cell.dataset.roomOccupant); if (!Number.isInteger(id)) { event.preventDefault(); return; } selectedRoomFurniture = id; event.dataTransfer?.setData('text/plain', String(id)); cell.classList.add('dragging'); };
    cell.ondragend = () => cell.classList.remove('dragging');
    cell.ondragover = event => { event.preventDefault(); cell.classList.add('drag-target'); };
    cell.ondragleave = () => cell.classList.remove('drag-target');
    cell.ondrop = event => { event.preventDefault(); const id = Number(event.dataTransfer?.getData('text/plain')); cell.classList.remove('drag-target'); if (Number.isInteger(id)) moveFurniture(id, Number(cell.dataset.roomColumn), Number(cell.dataset.roomRow)); };
  });
  document.querySelectorAll<HTMLButtonElement>('[data-room-move]').forEach(button => button.onclick = () => {
    if (selectedRoomFurniture === null || !placed.includes(selectedRoomFurniture)) return;
    const p = roomFurniturePosition(state!, selectedRoomFurniture), direction = button.dataset.roomMove;
    const column = Math.max(0, Math.min(ROOM_GRID_COLUMNS - 1, p.column + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0)));
    const row = Math.max(0, Math.min(ROOM_GRID_ROWS - 1, p.row + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0)));
    if (column === p.column && row === p.row) { toast('방 끝이에요. 다른 방향으로 옮겨 보세요!'); return; }
    moveFurniture(selectedRoomFurniture, column, row, '한 칸 옮겼어요!');
  });
  $('#room-auto-arrange').onclick = () => { placed.forEach((id, index) => { state!.room.positions[String(id)] = defaultRoomFurniturePosition(index); }); world.updateRoomFurniture(state!); persist(); openRoom(); toast('가구를 차례대로 반듯하게 정리했어요!'); };
  document.querySelectorAll<HTMLButtonElement>('[data-furniture]').forEach(button => button.onclick = () => {
    const id = Number(button.dataset.furniture); if (!furnitureUnlocked(state!, id)) return;
    selectedRoomFurniture = id; openRoom();
  });
  $('#room-store-selected').onclick=()=>{if(selectedRoomFurniture===null)return;removeRoomFurniture(state!,selectedRoomFurniture);selectedRoomFurniture=null;world.updateRoomFurniture(state!);persist();openRoom();toast('가구를 보관했어요. 다시 골라 놓을 수 있어요.');};
}
function openNotebook() { openAdventureBook('learning'); }
function renderLearningNotebook() {
  if (!state) return;
  const insight = learningInsight(state);
  const learningRows = curriculumRegions().map(region => { const p = state!.curriculum.units[region.id], total = p.correct + p.wrong, rate = total ? Math.round(p.correct / total * 100) : 0; return `<div><span>${region.icon}</span><strong>${region.name}</strong><small>${total ? `정답 ${rate}% · ${total}번 도전` : '아직 학습 기록이 없어요'}</small></div>`; }).join('');
  openModal(title('모험 수첩', '학습 기록') + `<div class="learning-insight notebook-insight"><p><b>👍 잘 이해한 내용</b>${escape(insight.strong)}</p><p><b>🌱 다시 연습할 내용</b>${escape(insight.review)}</p><p><b>🧭 추천 임무</b>${escape(insight.recommend)}</p></div><div class="unit-learning-list">${learningRows}</div><button class="secondary wide" id="review-wrong">곱셈·나눗셈 다시 풀기 (${state.learning.wrongQuestions.length})</button><button class="secondary wide" id="review-curriculum" ${state.curriculum.wrongSkills.length ? '' : 'disabled'}>단원 개념 다시 연습하기 (${state.curriculum.wrongSkills.length})</button><button class="secondary wide" id="open-report">📄 학습 리포트 보기·인쇄</button>`);
  if (state.adventure.recovered.length) $('.notebook-insight').insertAdjacentHTML('afterend', `<section class="recovered-concepts"><h3>🌟 내가 다시 해낸 것</h3><ul>${state.adventure.recovered.slice(0, 8).map(key => `<li>${escape(key.slice(key.indexOf(':') + 1))}</li>`).join('')}</ul></section>`);
  $('#review-wrong').textContent = `계산 세 걸음 재도전 (${state.learning.wrongQuestions.length})`;
  $('#open-report').onclick = openReport;
  $('#review-wrong').onclick = () => openReview();
  $('#review-curriculum').onclick = () => { const mistake = state!.curriculum.wrongSkills[0]; if (mistake) void startCurriculumReview(mistake.unit); };
}
function openReport() {
  if (!state) return;
  rememberMenu('report', openReport);
  if (!state) return;
  const html = reportHtml(buildReport(state, curriculumRegions(), new Date(), currentLearningRecords()));
  openModal(title('학습 리포트', '선생님·보호자와 함께 봐요') + `<div class="report-preview">${html}</div><button class="primary wide" id="report-print">🖨 인쇄하기</button><button class="text-button wide" id="report-back">학습 기록으로 돌아가기</button>`, 'report-modal');
  $('#report-back').onclick = openNotebook;
  $('#report-print').onclick = () => {
    document.querySelector('#print-report')?.remove();
    const sheet = document.createElement('div'); sheet.id = 'print-report'; sheet.innerHTML = html; document.body.append(sheet);
    window.addEventListener('afterprint', () => sheet.remove(), { once: true }); window.print();
  };
}
function openReview(index = 0) {
  if (!state) return;
  const items = state.learning.wrongQuestions.filter(q => operationsForGrade(state!.grade).includes(q.operation ?? 'division'));
  if (!items.length) { openModal(title('계산 복습', '아직 다시 풀 문제가 없어요') + '<p>모험 중 다시 볼 계산이 여기에 모여요.</p>'); return; }
  startCalculationRecovery(items[index % items.length]);
}
function openPetShop(selectedId?: number) {
  if (!state) return;
  rememberMenu('pet-shop', () => openPetShop(selectedId));

  if (!state) return; const s = state, id = selectedId ?? (s.pet >= 0 ? s.pet : 0), pet = PETS[id], owned = !!s.pets[id], active = s.pet === id;
  const cards = PETS.map((item, itemId) => { const hasPet = !!s.pets[itemId], withPlayer = s.pet === itemId; return `<button class="collection-card ${itemId === id ? 'selected' : ''} ${withPlayer ? 'active' : ''}" data-shop-pet="${itemId}" aria-pressed="${itemId === id}"><span class="collection-icon" style="--item-color:${itemColor(item.color)}">${item.icon}</span><strong>${item.name}</strong><small>${withPlayer ? '함께하는 중' : hasPet ? '보유 중' : `🍓 ${item.price.toLocaleString()}`}</small></button>`; }).join('');
  openModal(title('윤준의 펫 상점', `3D로 만나 보는 ${PETS.length}마리 친구`) + `<p class="shop-explainer">친구를 눌러 앞·옆모습과 장식을 천천히 살펴보세요. 펫은 탈것 중에도 베리를 찾아 직접 달려가요. <b>🍓 ${s.berries.toLocaleString()}베리</b></p><div class="collection-showcase"><div class="collection-picker" role="list">${cards}</div><section class="collection-detail"><div id="collection-preview" class="collection-preview pet-preview" style="--item-color:${itemColor(pet.color)}"></div><span class="preview-tag">살랑살랑 3D 미리 보기</span><h3>${pet.icon} ${pet.name}</h3>${petEffectBadges(id)}<p><b>${pet.desc}</b><br>플레이어와 같은 베리를 동시에 먹어도 보상은 한 번만 받아요.</p><button class="primary wide" id="buy-pet" ${active ? 'disabled' : ''}>${active ? '지금 함께하고 있어요' : owned ? '이 펫과 함께하기' : `${pet.price.toLocaleString()}베리로 친구 되기`}</button><p class="error" id="pet-error" role="alert"></p></section></div>`, 'inventory-modal collection-modal pet-shop');
  preview = new AvatarPreviewRuntime($('#collection-preview')); preview.showPet(id);
  document.querySelectorAll<HTMLButtonElement>('[data-shop-pet]').forEach(button => button.onclick = () => openPetShop(Number(button.dataset.shopPet)));
  $('#buy-pet').onclick = () => { try { const msg = buyPet(s, id); if (!s.discoveries.pets.includes(id)) s.discoveries.pets.push(id); audio.play('buy'); syncAvatar(); refresh(); persist(); openPetShop(id); toast(msg); } catch (e) { $('#pet-error').textContent = (e as Error).message; } };
}

function openPotionShop() {
  if (!state) return;
  rememberMenu('potions', openPotionShop);

  if (!state) return; const s = state;
  const effect = potionEffects(s), active = `${effect.berrySeconds ? `🍓 베리 ${effect.berryMultiplier}배 · ${buffTime(effect.berrySeconds)} 남음` : '🍓 베리 효과 없음'}<br>${effect.xpSeconds ? `🧪 경험치 ${effect.xpMultiplier}배 · ${buffTime(effect.xpSeconds)} 남음` : '🧪 경험치 효과 없음'}`;
  openModal(title('박준우의 물약 상점', '시간 동안 힘이 나는 물약') + `<p class="shop-explainer">물약은 산 뒤 <b>사용하기</b>를 누른 순간부터 시간이 줄어요. 문제를 풀거나 메뉴를 보는 동안에도 시간이 흘러요. <b>🍓 ${s.berries.toLocaleString()}베리</b></p><p class="note" id="potion-status">지금 효과<br>${active}</p><div class="inventory-list">${POTIONS.map((potion, id) => `<article class="inventory-item"><span class="inventory-icon potion-icon">${potion.icon}</span><div><strong>${potion.name}</strong><small>${potion.desc}<br>가방에 ${s.potions.stock[id]}개</small></div><div class="potion-actions"><button class="primary" data-buy-potion="${id}">🍓 ${potion.price}</button><button class="secondary" data-use-potion="${id}" ${s.potions.stock[id] ? '' : 'disabled'}>사용하기</button></div></article>`).join('')}</div><p class="error" id="potion-error" role="alert"></p>`, 'inventory-modal potion-shop');
  document.querySelectorAll<HTMLButtonElement>('[data-buy-potion]').forEach(button => button.onclick = () => { try { const msg = buyPotion(s, Number(button.dataset.buyPotion)); audio.play('buy'); refresh(); persist(); openPotionShop(); toast(msg); } catch (e) { $('#potion-error').textContent = (e as Error).message; } });
  document.querySelectorAll<HTMLButtonElement>('[data-use-potion]').forEach(button => button.onclick = () => { try { const msg = usePotion(s, Number(button.dataset.usePotion)); audio.play('level'); refresh(); persist(); openPotionShop(); toast(msg); } catch (e) { $('#potion-error').textContent = (e as Error).message; } });
}

function openBeauty(kind: 'hairstyle' | 'face' = 'hairstyle', selectedId?: number) {
  if (!state) return;
  rememberMenu('beauty', () => openBeauty(kind, selectedId));

  if (!state) return;
  const s = state, items = kind === 'hairstyle' ? HAIRSTYLES : FACES, owned = kind === 'hairstyle' ? s.hairstyles : s.faces, id = selectedId ?? s[kind];
  const descriptions = kind === 'hairstyle' ? ['내 캐릭터의 편안한 기본 스타일', '리본으로 묶은 사랑스러운 양갈래', '얼굴을 감싸는 산뜻한 단발', '폭신하게 볼륨을 살린 웨이브', '별빛을 닮은 경쾌한 포니테일', '구름처럼 둥근 두 개의 번', '꽃을 곁들인 발랄한 땋은머리', '동글동글 포근한 꿀벌 번', '살구빛 분위기의 부드러운 웨이브', '햇살 장식으로 완성한 특별한 머리'] : ['따뜻하게 웃는 해맑은 표정', '맑은 빛을 담은 커다란 눈', '자신감이 느껴지는 또렷한 눈썹', '장난기 가득한 고양이 미소', '반짝이는 별을 담은 눈', '나른하고 편안한 달빛 표정', '귀여운 앞니가 보이는 미소', '설렘을 담은 하트 모양 눈', '번개처럼 힘찬 모험가의 눈', '무지개를 닮은 환한 미소', '햇살처럼 포근한 초승달 눈', '꿀방울처럼 달콤한 반짝임', '해바라기처럼 밝게 빛나는 눈', '별숲을 지키는 용기 있는 눈'];
  openModal(title('가영이의 스타일 살롱', '오늘은 어떤 모습으로 떠날까요?') + `<div class="salon-banner"><div><small>✦ BERRY FOREST STYLE SALON ✦</small><strong>내 취향을 골라, 나다운 반짝임</strong><small>모든 스타일을 직접 골라요 · 보유한 모습은 무료로 다시 착용</small></div><b class="salon-balance">🍓 ${s.berries.toLocaleString()}베리</b></div><div class="salon-tabs" role="group" aria-label="꾸미기 종류"><button data-beauty-tab="hairstyle" class="${kind === 'hairstyle' ? 'active' : ''}" aria-pressed="${kind === 'hairstyle'}">💇 헤어 컬렉션</button><button data-beauty-tab="face" class="${kind === 'face' ? 'active' : ''}" aria-pressed="${kind === 'face'}">✨ 얼굴 컬렉션</button></div><div class="salon-layout"><section class="salon-catalog"><h3 class="salon-ribbon">${kind === 'hairstyle' ? 'HAIR · 헤어' : 'FACE · 얼굴'} COLLECTION</h3><div class="salon-cards">${items.map((item, i) => `<button class="salon-card" data-look="${i}" aria-pressed="${id === i}">${s[kind] === i ? '<span class="salon-equipped">✓ 착용 중</span>' : ''}<span class="salon-portrait"><img data-salon-image="${i}" alt="${item.name} 미리 보기"></span><strong>${item.name}</strong><small>${owned[i] ? s[kind] === i ? '지금 나의 스타일' : '보유 · 무료 착용' : `🍓 ${item.price.toLocaleString()}베리`}</small></button>`).join('')}</div></section><aside class="salon-mirror" aria-label="선택한 스타일 미리 보기"><div id="shop-avatar" class="salon-stage"></div><h3 tabindex="-1">${items[id].name}</h3><p class="salon-description">${descriptions[id]}</p><button id="buy-look" class="primary wide" ${s[kind] === id ? 'disabled' : ''}>${s[kind] === id ? '✓ 지금 나의 스타일' : owned[id] ? '이 스타일로 바꾸기' : `🍓 ${items[id].price.toLocaleString()}베리로 구매·착용`}</button><p class="salon-note">미리 보기만으로 베리는 사용되지 않아요.<br>능력은 그대로, 개성은 마음껏!</p><p class="error" id="beauty-error" role="alert"></p></aside></div>`, 'shop-modal salon-modal');
  preview = new AvatarPreviewRuntime($('#shop-avatar'));
  items.forEach((_, i) => { const image = document.querySelector<HTMLImageElement>(`[data-salon-image="${i}"]`)!; image.src = preview!.salonPortrait(s.character, s.outfit, kind === 'hairstyle' ? i : s.hairstyle, kind === 'face' ? i : s.face); });
  preview.showSalon(s.character, s.outfit, kind === 'hairstyle' ? id : s.hairstyle, kind === 'face' ? id : s.face);
  document.querySelectorAll<HTMLButtonElement>('[data-beauty-tab]').forEach(button => button.onclick = () => openBeauty(button.dataset.beautyTab as 'hairstyle' | 'face'));
  document.querySelectorAll<HTMLButtonElement>('[data-look]').forEach(button => button.onclick = () => { const top = $('#modal').scrollTop; openBeauty(kind, Number(button.dataset.look)); if (matchMedia('(max-width: 680px)').matches) { const mirror = document.querySelector<HTMLElement>('.salon-mirror')!; $('#modal').scrollTop = mirror.offsetTop - 12; mirror.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true }); } else { $('#modal').scrollTop = top; document.querySelector<HTMLButtonElement>(`[data-look="${button.dataset.look}"]`)?.focus({ preventScroll: true }); } });
  $('#buy-look').onclick = () => { try { const msg = buyLook(s, kind, id); audio.play('buy'); syncAvatar(); refresh(); persist(); openBeauty(kind, id); toast(msg); } catch (e) { $('#beauty-error').textContent = (e as Error).message; } };
}

function exportSave() {
  if (state) persist(); const s = state ?? saved; if (!s) return; const url = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = '베리숲-모험저장.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); markBackup(localStorage); toast('모험 저장 파일을 내려받았어요.');
}
function confirmAction(heading: string, description: string, action: () => void, backup = false) {
  openModal(title('모험 기록', heading) + `<p>${description}</p>${backup ? '<button class="secondary wide" id="backup">현재 모험 내려받기</button>' : ''}<div class="confirm-row"><button class="secondary" data-close>취소</button><button class="primary" id="confirm-action">확인</button></div>`);
  if (backup) $('#backup').onclick = exportSave; $('#confirm-action').onclick = action;
}
function openSettings() {
  if (!state) return;
  rememberMenu('settings', openSettings);
  if (!state) return; persist();
  const focusOptions = [{ id: 'all', name: '모든 단원 자유 선택' }, ...curriculumRegions().map(region => ({ id: region.id, name: `${region.icon} ${region.name}` }))];
  const teacherOptions = state.teacherMode ? `<div class="settings-list teacher-options">
    <label><span>오늘 집중할 단원<small>모험 지도에서 오늘의 단원으로 표시해요</small></span><select id="focus-unit">${focusOptions.map(option => `<option value="${option.id}" ${state!.settings.focusUnit === option.id ? 'selected' : ''}>${option.name}</option>`).join('')}</select></label>
    <label><span>이전 단원 복습<small>새 임무 문제의 약 20%에 이전 단원을 섞어요</small></span><input id="spiral-toggle" type="checkbox" ${state.settings.spiralReview ? 'checked' : ''}></label>
    ${operationsForGrade(state.grade).includes('division') ? `<label><span>나눗셈 문제 범위<small>자동은 지금 스테이지의 난이도를 따라요</small></span><select id="question-range"><option value="0" ${state.settings.maxDividend === 0 ? 'selected' : ''}>스테이지에 맞추기</option><option value="90" ${state.settings.maxDividend === 90 ? 'selected' : ''}>두 자리 수까지만</option><option value="180" ${state.settings.maxDividend === 180 ? 'selected' : ''}>180까지 허용</option></select></label>` : ''}
    ${operationsForGrade(state.grade).includes('multiplication') ? `<label><span>곱셈 문제 범위<small>구구단만을 고르면 어느 단계에서도 한 자리 수끼리 곱해요</small></span><select id="multiplication-range"><option value="stage" ${state.settings.multiplicationRange === 'stage' ? 'selected' : ''}>단계에 맞추기</option><option value="tables" ${state.settings.multiplicationRange === 'tables' ? 'selected' : ''}>구구단만</option></select></label>` : ''}
    <label><span>한 번의 수업 시간<small>시간이 끝나면 진행 중인 문제 뒤에 요약해요</small></span><select id="session-limit">${[0, 10, 15, 20, 30, 45, 60].map(n => `<option value="${n}" ${state!.settings.sessionMinutes === n ? 'selected' : ''}>${n ? `${n}분` : '시간 제한 없음'}</option>`).join('')}</select></label>
    <button id="notebook" class="secondary">📖 학습 요약과 틀린 문제 복습</button></div>` : '';
  openModal(title('설정', '소리·화면·저장·교사용') + `<div class="settings-list"><label><span>배경음악<small>잔잔한 숲속 멜로디</small></span><input id="music-toggle" type="checkbox" ${state.settings.music ? 'checked' : ''}></label><label><span>효과음<small>베리와 정답 알림</small></span><input id="sound-toggle" type="checkbox" ${state.settings.sound ? 'checked' : ''}></label><label><span>계절과 날씨 이벤트<small>실제 시각과 관계없이 낙엽·눈·보슬비가 숲 안에 나타나요. 화면은 어두워지지 않아요</small></span><input id="ambience-toggle" type="checkbox" ${ambienceEnabled() ? 'checked' : ''}></label><label><span>가벼운 화면<small>그림자를 줄여 휴대폰과 태블릿에서 부드럽게</small></span><input id="quality-toggle" type="checkbox" ${state.settings.lowQuality ? 'checked' : ''}></label>${speechSupported() ? `<label><span>문제 읽어주기<small>새 문제가 나오면 소리 내어 읽어 줘요</small></span><input id="speech-toggle" type="checkbox" ${autoReadEnabled() ? 'checked' : ''}></label>` : ''}</div><div class="teacher-code ${state.teacherMode ? 'enabled' : ''}"><div><strong>🧑‍🏫 교사용 코드</strong><small>${state.teacherMode ? '선생님 모드 활성화됨 · 아래에서 수업 단원과 범위를 정할 수 있어요' : '수업 시연용 코드를 입력하세요'}</small></div><div class="teacher-input"><input id="teacher-code" type="password" autocomplete="off" placeholder="교사용 코드"><button id="teacher-unlock" class="secondary">입력</button></div><p class="error" id="teacher-error" role="alert"></p></div>${teacherOptions}<p class="note">자동 저장은 이 기기와 브라우저에만 남아요. 선생님 설정도 이 기기에서만 적용됩니다. ${storageError ? '<br>자동 저장을 사용할 수 없어요. 꼭 저장 파일을 내려받아 주세요.' : ''}</p><div class="settings-buttons"><button id="export" class="secondary">저장 파일 내려받기</button><button id="restore-checkpoint" class="secondary">직전 정상 기록 복구</button><button id="import" class="secondary">저장 파일 불러오기</button><button id="help" class="secondary">조작 방법 보기</button><button id="copyright-notice" class="secondary">© 저작권·이용 안내</button><button id="return-title" class="secondary">처음 화면으로</button></div>`);
  for (const [id, key] of [['music', 'music'], ['sound', 'sound'], ['quality', 'lowQuality']] as const) $<HTMLInputElement>(`#${id}-toggle`).onchange = e => { state!.settings[key] = (e.target as HTMLInputElement).checked; refresh(); if (key === 'lowQuality') { world.quality(state!.settings.lowQuality); world.setWeather(null); refreshAmbience(); } persist(); };
  $<HTMLInputElement>('#ambience-toggle').onchange = e => { setAmbience((e.target as HTMLInputElement).checked); refreshAmbience(); };
  const speechToggle = document.querySelector<HTMLInputElement>('#speech-toggle'); if (speechToggle) speechToggle.onchange = () => { setAutoRead(speechToggle.checked); if (!speechToggle.checked) stopSpeech(); };
  voiceControls($('.settings-list'),true);
  const range = document.querySelector<HTMLSelectElement>('#question-range'); if (range) range.onchange = () => { state!.settings.maxDividend = Number(range.value) as 0 | 90 | 180; persist(); };
  const multiplicationRange = document.querySelector<HTMLSelectElement>('#multiplication-range'); if (multiplicationRange) multiplicationRange.onchange = () => { state!.settings.multiplicationRange = multiplicationRange.value as 'stage' | 'tables'; persist(); };
  const focusUnit = document.querySelector<HTMLSelectElement>('#focus-unit'); if (focusUnit) focusUnit.onchange = () => { state!.settings.focusUnit = focusUnit.value as Save['settings']['focusUnit']; persist(); };
  const spiral = document.querySelector<HTMLInputElement>('#spiral-toggle'); if (spiral) spiral.onchange = () => { state!.settings.spiralReview = spiral.checked; persist(); };
  const limit = document.querySelector<HTMLSelectElement>('#session-limit'); if (limit) limit.onchange = () => { state!.settings.sessionMinutes = Number(limit.value); sessionExpired = false; persist(); };
  const notebook = document.querySelector<HTMLButtonElement>('#notebook'); if (notebook) notebook.onclick = openNotebook;
  $('#restore-checkpoint').onclick = () => {
    const checkpoint = saveStore.checkpoint();
    if (!checkpoint) { toast('복구할 정상 기록이 아직 없어요. 저장 파일을 불러올 수 있어요.'); return; }
    confirmAction('직전 정상 기록으로 돌아갈까요?', `${escape(checkpoint.nickname)} · 레벨 ${checkpoint.level}. 최근 진행 일부가 되돌아갈 수 있어요. 현재 모험을 먼저 내려받을 수 있어요.`, () => begin(checkpoint, false, true), true);
  };
  $('#export').onclick = exportSave; $('#import').onclick = () => $<HTMLInputElement>('#import-file').click(); $('#help').onclick = openGuide; $('#copyright-notice').onclick = openCopyrightNotice;
  const unlock = () => { try { const msg = applyTeacherCode(state!, $<HTMLInputElement>('#teacher-code').value.trim()); audio.play('level'); syncAvatar(); refresh(); persist(); openSettings(); toast(msg); } catch (e) { $('#teacher-error').textContent = (e as Error).message; } }; $('#teacher-unlock').onclick = unlock; $<HTMLInputElement>('#teacher-code').onkeydown = e => { if (e.key === 'Enter') unlock(); };
  $('#return-title').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
function openDaily() {
  if (!state) return;
  rememberMenu('daily', openDaily);
  if (!state) return; const s = state, d = ensureDaily(s), shown = dailyStampsShown(d.streak);
  const rows = dailyMissions(d.date).map((m, i) => { const done = d.progress[i] >= m.goal, claimed = d.claimed[i];
    return `<li class="daily-row ${claimed ? 'claimed' : done ? 'done' : ''}"><span class="daily-icon">${m.icon}</span><div><b>${m.label}</b><div class="daily-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${m.goal}" aria-valuenow="${d.progress[i]}"><i style="width:${Math.round(d.progress[i] / m.goal * 100)}%"></i></div><small>${d.progress[i]} / ${m.goal}</small></div><button class="primary" data-daily="${i}" ${done && !claimed ? '' : 'disabled'}>${claimed ? '받았어요' : `🍓 ${m.reward}`}</button></li>`; }).join('');
  const stamps = Array.from({ length: DAILY_STAMPS }, (_, i) => `<span class="daily-stamp ${i < shown ? 'on' : ''}">${i === DAILY_STAMPS - 1 ? '🎁' : i < shown ? '⭐' : '☆'}</span>`).join('');
  openModal(title('오늘의 미션', '하루 5분 모험') + `<p>미션을 완수하고 보상을 받아요! 하루가 지나면 새 미션이 열려요.</p><ul class="daily-list">${rows}</ul><p class="expedition-note">3개를 모두 받으면 보너스 🍓 ${DAILY_ALL_CLEAR_BONUS}!</p><h3 class="title-heading">📅 연속 출석 도장 · ${d.streak}일째</h3><div class="daily-stamps">${stamps}</div><p class="note">매일 한 번 이상 미션 보상을 받으면 도장이 찍혀요. 하루 쉬어도 괜찮아요, 다시 1일부터 모으면 돼요. 7일째 선물은 베리 물약이에요!</p>`);
  document.querySelectorAll<HTMLButtonElement>('[data-daily]').forEach(b => b.onclick = () => {
    try { const r = claimDaily(s, Number(b.dataset.daily)); audio.play(r.allClear || r.potion ? 'level' : 'buy'); refresh(); persist(); openDaily(); toast(`🍓 ${r.berries}베리를 받았어요!${r.stamp ? ` ⭐ ${r.streak}일째 출석 도장!` : ''}${r.potion ? ' 🧪 7일 선물 물약도 받았어요!' : ''}${r.allClear ? ' 🎉 오늘 미션 완료!' : ''}`); } catch (e) { toast((e as Error).message); }
  });
}
function bossBody(summary: BossSummary | null, unavailable = false) {
  const local = readBoss(localStorage), boss = bossOfWeek(local.week);
  if (!local.classCode) return `<div class="boss-card"><div class="boss-icon">${boss.icon}</div><h3>이번 주 보스 · ${boss.name}</h3><p>같은 반 친구들과 같은 <b>반 코드</b>를 쓰면 정답 하나하나가 보스의 체력을 함께 깎아요. 선생님이 알려 준 반 코드를 적어 보세요.</p></div>`;
  const hp = summary ? Math.max(0, summary.maxHp - summary.damage) : null, percent = summary ? Math.round(Math.min(1, summary.damage / summary.maxHp) * 100) : 0;
  const status = summary ? (summary.defeated ? `<p class="boss-win">🎉 우리 반이 ${boss.name}을 물리쳤어요!</p>` : `<p>친구 ${summary.members}명이 함께하고 있어요 · 남은 체력 <b>${hp}</b></p>`) : `<p class="note">${unavailable ? '협동 보스 서버가 아직 준비되지 않았어요. 정답 수는 이 기기에 모아 두고 있어요.' : '반 현황을 불러오는 중이에요…'}</p>`;
  return `<div class="boss-card"><div class="boss-icon">${boss.icon}</div><h3>이번 주 보스 · ${boss.name}</h3><div class="boss-hp" role="progressbar" aria-label="보스 체력" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${100 - percent}"><i style="width:${100 - percent}%"></i></div>${status}<p class="boss-mine">나의 이번 주 정답 <b>${local.damage}</b>개 · 반 코드 <b>${escape(local.classCode)}</b></p></div>`;
}
async function openBoss() {
  if (!state) return;
  const draw = (summary: BossSummary | null, unavailable = false) => {
    rememberMenu('boss', () => { void openBoss(); });
    openModal(title('우리 반 협동 보스', '정답이 모두 힘이 돼요') + bossBody(summary, unavailable) + `<label class="boss-code"><span>반 코드<small>2~12자의 글자·숫자 · 같은 반은 같은 코드를 써요</small></span><input id="boss-class-code" maxlength="12" autocomplete="off" value="${escape(readBoss(localStorage).classCode)}" placeholder="예: 3반"></label><p id="boss-error" class="error" role="alert"></p><button class="primary wide" id="boss-save">반 코드 저장하고 새로고침</button><button class="text-button wide" data-close>닫기</button>`, 'boss-modal');
    $('#boss-save').onclick = () => { const code = ($('#boss-class-code') as HTMLInputElement).value; if (setClassCode(localStorage, code) === null) { $('#boss-error').textContent = '반 코드는 2~12자의 글자나 숫자로 적어 주세요.'; return; } void openBoss(); };
  };
  draw(null);
  const summary = await syncBoss(localStorage);
  if (!($('#modal') as HTMLDialogElement).open || !document.querySelector('.boss-modal')) return;
  draw(summary, !summary && !!readBoss(localStorage).classCode);
  const reward = claimBossReward(localStorage, summary);
  if (reward && state) { state.berries += reward; audio.play('level'); refresh(); persist(); toast(`🎉 보스 격파 선물 🍓 ${reward}베리를 받았어요!`); }
}
$('#boss-open').onclick = () => { void openBoss(); };
$('#daily-open').onclick = openDaily;
$('#settings').onclick = openSettings;
$('#stage-map').onclick = openNavigation;
$('#inventory').onclick = () => openInventory();
$('#codex-open').onclick = openNotebook;
$<HTMLInputElement>('#import-file').onchange = async e => {
  const input = e.target as HTMLInputElement, file = input.files?.[0]; input.value = ''; if (!file) return;
  try { if (file.size > 100000) throw new Error('파일이 너무 커요. 베리숲 저장 파일을 골라 주세요.'); pendingImport = validateSave(JSON.parse(await file.text()));
    confirmAction('저장된 모험을 불러올까요?', `${escape(pendingImport.nickname)} · 레벨 ${pendingImport.level}의 모험으로 바뀌어요. 현재 모험은 덮어쓰게 됩니다.`, () => { const incoming = pendingImport!; pendingImport = null; begin(incoming, false, true); }, !!(state ?? saved));
  } catch (error) { toast(error instanceof SyntaxError ? '베리숲 저장 파일이 아니에요. 다른 파일을 골라 주세요.' : (error as Error).message); }
};
let saveTick = 0;
setInterval(() => {
  if (state && world.active && !document.hidden && (!($('#modal') as HTMLDialogElement).open || battle || curriculumRun)) {
    sessionElapsed++; state.learning.elapsedSeconds++;
    const limit = state.settings.sessionMinutes * 60;
    if (limit > 0 && sessionElapsed >= limit && !sessionExpired) { sessionExpired = true; if (!battle && !curriculumRun && !storyActivityOpen) showSessionSummary(); else toast('수업 시간이 다 되었어요. 지금 문제를 마치면 오늘 기록을 보여줄게요.'); }
  }
  if (state) { $('#weapon-effect').textContent = equipmentEffectText(state); $('#daily-open').classList.toggle('ready', dailyReady(state)); }
  const potionStatus = document.querySelector<HTMLElement>('#potion-status');
  if (state && potionStatus) { const effect = potionEffects(state); potionStatus.innerHTML = `지금 효과<br>${effect.berrySeconds ? `🍓 베리 ${effect.berryMultiplier}배 · ${buffTime(effect.berrySeconds)} 남음` : '🍓 베리 효과 없음'}<br>${effect.xpSeconds ? `🧪 경험치 ${effect.xpMultiplier}배 · ${buffTime(effect.xpSeconds)} 남음` : '🧪 경험치 효과 없음'}`; }
  if (!document.hidden && ++saveTick % 5 === 0) persist();
}, 1000); window.addEventListener('pagehide', persist); document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  const registerWorker = () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* 오프라인 기능만 빠지고 게임은 그대로 동작해요 */ }); };
  if (document.readyState === 'complete') registerWorker(); else window.addEventListener('load', registerWorker);
}

if ((import.meta as unknown as { env?: { DEV?: boolean; VITE_BROWSER_TEST?: string } }).env?.DEV || import.meta.env.VITE_BROWSER_TEST === '1') {
  const devApi = { openArena, beginHuntBattle, openStageMap, openSettings, openDaily, openInventory, openShop, openPetShop, openGuide, openNotebook, openRoom, openCurriculumUnit, switchStage, refresh, getState: () => state, begin, openReport, persist, openHomestead, enterHomeGarden, closeModal, testBattleQuestion: () => battle ? ({ answer: formatScaled(battle.encounter.question.answer, battle.encounter.question.places?.[2] ?? 0), remainder: battle.encounter.question.remainder }) : null, testHomeEditor: () => { if (state) showHomeEditor(state, homesteadHooks(), 0); } };
  Object.assign(window, { __berry: devApi }); void import('./dev-audit').then(module => module.installAudit(devApi as never));
}

// Optional browser agent access uses the same visible settings flow and state.
const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: unknown) => Promise<void> | void } }).modelContext;
const lifecycle = new AbortController();
if (context?.registerTool) {
  for (const tool of [
    { name: 'read_adventure_status', description: 'Read the current Berry Forest character, level, berries and arena best score.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('Expected an empty object'); return state ? { nickname: state.nickname, level: state.level, berries: state.berries, best: state.best } : { started: false }; } },
    { name: 'open_adventure_settings', description: 'Open the visible settings and save-file panel for an active adventure.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('Expected an empty object'); if (!state || battle) throw new Error('Start an adventure and finish the encounter first'); openSettings(); return { opened: true }; } },
  ]) { try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional API unavailable. */ } }
}
window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
showStart();

function openTrailLamp(lamp: number) {
  if (!state || !trailHere(state) || !Number.isInteger(lamp) || lamp < 0 || lamp > 2) return;
  const s = state, t = s.forestTrail;
  if (t.lit.includes(lamp)) { openModal(title('빛씨앗 오솔길', t.lit.length === 3 ? '우리 손으로 숲을 밝혔어요!' : '나무 등불이 환하게 빛나요') + `<p>${t.lit.length === 3 ? '세 나무 등불과 오솔길 끝의 큰 나무가 빛나고 있어요. 숲을 걸으며 달라진 모습을 구경해요!' : '다음 빛씨앗 묶음을 찾아 오솔길을 이어 볼까요?'}</p><button class="primary wide" data-close>숲 구경하기</button>`, 'trail-modal'); return; }
  if (lamp !== t.lit.length) { toast(`${t.lit.length + 1}번 나무 등불부터 차례로 밝혀요.`); return; }
  const [a, b] = trailPair(s.grade, lamp), prompt = `빛씨앗 ${a}개와 ${b}개를 합치면 모두 몇 개일까요?`;
  const dots = (count: number) => s.grade === 1 ? `<span aria-label="빛씨앗 ${count}개">${'✦ '.repeat(count)}</span>` : '';
  openModal(title(`빛씨앗 오솔길 · ${lamp + 1}/3`, '두 묶음의 빛으로 나무를 밝혀요') + `<p class="trail-intro">흩어진 빛을 모으면 어두운 오솔길이 환해져요. ${lamp === 0 ? '이 활동은 자유롭게 쉬었다가 이어 할 수 있어요.' : '다음 나무까지 빛을 이어 주세요.'}</p><p id="trail-prompt">${prompt}</p><div class="trail-bundles">${[a, b].map((count, side) => `<button class="secondary" data-trail-side="${side}"><b>${side ? '오른쪽' : '왼쪽'} 묶음 · ${count}개</b>${dots(count)}<span data-trail-action="${side}"></span></button>`).join('')}</div><div id="trail-bowl" class="trail-bowl" role="status" aria-live="polite"></div><label class="trail-answer">${a} + ${b} = ?<input id="trail-answer" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" aria-label="합친 빛씨앗의 수"></label><div class="trail-keypad">${['1','2','3','4','5','6','7','8','9','지우기','0','←'].map(key => `<button class="secondary" data-trail-key="${key}" aria-label="${key}">${key}</button>`).join('')}</div><button id="trail-check" class="primary wide">빛 합치고 나무 밝히기</button><p id="trail-status" class="trail-status" role="status" aria-live="polite"></p><button id="trail-hint" class="secondary wide">💡 도움말</button>${speechSupported() ? '<button id="trail-read" class="text-button wide">🔊 문제 읽어주기</button>' : ''}<button class="text-button wide" data-close>숲으로 돌아가기</button>`, 'trail-modal');
  const input = $('#trail-answer') as HTMLInputElement; input.value = t.drafts[lamp];
  const draw = () => {
    document.querySelectorAll<HTMLButtonElement>('[data-trail-side]').forEach(button => {
      const side = Number(button.dataset.trailSide), found = t.seeds.includes(lamp * 2 + side), placed = !!(t.placed[lamp] & (1 << side));
      button.disabled = !found; button.setAttribute('aria-pressed', String(placed));
      button.querySelector('[data-trail-action]')!.textContent = !found ? '숲에서 먼저 찾아요' : placed ? '그릇에 놓았어요 · 다시 누르면 꺼내기' : '눌러서 빛 그릇에 놓기';
    });
    const placed = t.placed[lamp]; $('#trail-bowl').textContent = !placed ? '빛 그릇 · 두 묶음을 옮겨 보세요' : placed === 3 ? '✦ 두 묶음이 모였어요. 모두 몇 개인지 답해 주세요.' : '✦ 한 묶음을 놓았어요. 나머지 묶음도 놓아 볼까요?';
  };
  const saveDraft = () => { input.value = input.value.replace(/[^0-9]/g, '').slice(0, 3); t.drafts[lamp] = input.value; persist(); };
  input.oninput = saveDraft;
  document.querySelectorAll<HTMLButtonElement>('[data-trail-key]').forEach(button => button.onclick = () => { const key = button.dataset.trailKey!; input.value = key === '지우기' ? '' : key === '←' ? input.value.slice(0, -1) : (input.value + key).slice(0, 3); saveDraft(); });
  document.querySelectorAll<HTMLButtonElement>('[data-trail-side]').forEach(button => button.onclick = () => { if (moveTrailBundle(s, lamp, Number(button.dataset.trailSide))) { persist(); draw(); audio.play('berry'); } });
  $('#trail-hint').onclick = () => { $('#trail-status').textContent = s.grade === 1 ? `첫 묶음 ${a}개에서 시작해 두 번째 묶음의 별을 하나씩 이어 세어 보세요.` : '각 묶음의 십과 일을 살펴보세요. 일끼리 더해 열 개가 되면 십 하나로 묶을 수 있어요.'; };
  if (speechSupported()) $('#trail-read').onclick = () => { speak(prompt); };
  if(speechSupported())voiceControls($('#trail-read').parentElement!);
  $('#trail-check').onclick = () => {
    if (state !== s || !trailHere(s) || t.lit.includes(lamp)) return;
    saveDraft();
    if (t.placed[lamp] !== 3) { $('#trail-status').textContent = '숲에서 찾은 두 묶음을 먼저 빛 그릇에 놓아 주세요.'; return; }
    if (!lightTrailLamp(s, lamp)) { $('#trail-status').textContent = '두 묶음을 함께 세어 볼까요? 빛씨앗은 그대로 있으니 다시 해 봐요.'; audio.play('wrong'); return; }
    persist(); world.refreshForestTrail(s); refresh(); audio.play('correct');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) world.celebrate();
    openModal(title('빛씨앗 오솔길', lamp === 2 ? '숲에 빛이 돌아왔어요!' : `${lamp + 1}번 나무 등불이 켜졌어요!`) + `<p>${a} + ${b} = ${a + b}. 모은 빛으로 ${lamp === 2 ? '오솔길 끝의 큰 나무까지 환하게 밝혔어요!' : '길이 밝아졌어요. 다음 빛씨앗을 찾아볼까요?'}</p><button class="primary wide" data-close>빛나는 숲으로 돌아가기</button>`, 'trail-modal');
  };
  input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); $('#trail-check').click(); } };
  draw(); if (autoReadEnabled()) speak(prompt);
}

function openForestWork(step: number) {
  if (!state || !fieldHere(state)) return; const s = state;
  showForestWork(s,step, {
    open: html => openModal(html,'trail-modal'), save: persist,
    changed: () => { world.refreshForestWork(s); refresh(); }, sound: kind => audio.play(kind),
    celebrate: () => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) world.celebrate(); },
    active: () => state === s,
  });
}

function homesteadHooks(): HomeHooks { return {
  open:html=>{rememberMenu(html.includes('data-home-editor')?'home-editor':'residents',html.includes('data-home-editor')?openHomestead:openResidents);openModal(html,html.includes('data-home-editor')?'homestead-modal home-editor-modal':'homestead-modal');},save:persist,changed:()=>{if(state&&world.inHomestead)world.enterHomestead(state,true);refresh();},
  enter:()=>{if(!state)return;if(world.inRoom||state.expedition.active){toast('방이나 진행 중인 원정을 마치고 나의 집에 들어와요.');return;}persist();world.enterHomestead(state);closeModal();refresh();persist();toast('나의 집에 왔어요! 꾸미기 책상과 주민에게 다가가 보세요.');},
  leave:leaveHomestead,full:()=>true,paywall:()=>toast('모든 도안을 무료로 즐길 수 있어요.'),notebook:openAdventureMap,back:previousMenu,
  react:()=>{audio.play('level');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)world.celebrate();},
}; }
function openHomestead(){if(state){rememberMenu('home-editor',openHomestead);syncDiscoveries(state);showHomestead(state,homesteadHooks());}}
function leaveHomestead(){if(!state)return;persist();state.homestead.inside=false;state.room.inside=false;switchStage(0);toast('마을 중앙 광장으로 돌아왔어요!');}
const lastVisitorLines=new Map<number,string>();
function openHomeVisitor(index=0){if(!state)return;const line=pickVisitorLine(state,index===0,lastVisitorLines.get(index));lastVisitorLines.set(index,line);openModal(homeHeading(escape(HOME_VISITORS[index]||'마을 주민'))+`<p class="visitor-speech">${escape(line)}</p><button id="home-visitor-requests" class="secondary wide">주민 부탁과 추억 보기</button><button class="primary wide" data-close>함께 더 둘러보기</button>`,'homestead-modal');$('#home-visitor-requests').onclick=openResidents;}
function interactHomeObject(uid:number){if(!state)return;const object=state.homestead.objects.find(o=>o.uid===uid);if(!object)return;const item=HOME_ITEMS[object.kind];if(object.kind===15&&state.pet>=0){world.reactPet('happy');audio.play('berry');}openModal(homeHeading(`${item.icon} ${item.name}`)+`<p>${object.kind===15?state.pet>=0?'함께 온 펫 친구가 놀이터에서 신나게 재주를 부려요!':'펫 친구와 함께 오면 놀이터에서 재주를 볼 수 있어요.':object.kind===18?'벤치에서 잠깐 쉬며 내가 만든 정원을 둘러봐요.':object.kind===17?'직접 만든 물레방아가 물을 따라 돌아가요.':'내가 배치한 시설이에요. 주민들이 찾아와 함께 즐겨요.'}</p><button id="home-object-design" class="primary wide">꾸미기 책상에서 옮기거나 꾸미기</button><button id="home-object-requests" class="secondary wide">주민 부탁과 추억</button><button class="text-button wide" data-close>정원에서 더 놀기</button>`,'homestead-modal');$('#home-object-design').onclick=openHomestead;$('#home-object-requests').onclick=()=>{openResidents();};}
function discoveryHooks(){const s=state!;return {open:(html:string)=>openModal(html,'homestead-modal'),save:persist,changed:()=>{world.refreshDiscovery(s);refresh();},
 travel:(forest:ForestKind,stage:number)=>{if(!state||state.expedition.active){toast('진행 중인 원정을 마친 뒤 찾아가요.');return;}if(state.forest!==forest||journeyFor(state).stage!==stage||world.inHomestead||world.inRoom)switchStage(stage,forest);else closeModal();world.guideTo('discovery');toast('발자국과 표지판을 따라 숨은 장소를 찾아요.');},
 field:()=>{closeModal();world.guideTo(s.forest==='addition'?trailGoal(s).guide:'forestWork');},home:openHomeHub,
 react:()=>{audio.play('correct');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)world.celebrate();},active:()=>state===s,
};}
function openDiscoveryMap(){openAdventureBook('discover');}
function openCurrentDiscovery(){if(state)showDiscovery(state,discoveryHooks());}
