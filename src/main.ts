import './style.css';
import { NEUTRAL_TITLE, titleLeaksAnswer } from './leak-guard';
import './garden.css';
import { curriculumVisualHtml } from './curriculum-visual';
import { curriculumActivityHtml } from './curriculum-activity';
import { mathTextHtml } from './math-format';
import { VILLAGE_THEMES, villageThemeId } from './villages';
import { DAILY_MISSIONS, DAILY_STAMPS, DAILY_ALL_CLEAR_BONUS, claimDaily, dailyReady, dailyStampsShown, ensureDaily } from './daily';
import type { World, AvatarPreview, GuideKind } from './world';
import { formatScaled, type CurriculumMistake, newSave, validateSave, CHARACTERS, MONSTERS, OUTFITS, PETS, POTIONS, RIDES, WEAPONS, HAIRSTYLES, FACES, WEAPON_UPGRADES, OUTFIT_UPGRADES, ROOM_GRID_COLUMNS, ROOM_GRID_ROWS, HERO_BREAD_PET_ID, Encounter, grantReward, rewardFor, potionEffects, buy, upgrade, buyRide, dismount, buyPet, unequipPet, buyLook, buyPotion, usePotion, applyTeacherCode, collectBerry, finishHunt, fellTree, treeDamage, canEnter, monsterBattleRounds, recordWrongAnswer, recordCorrectAnswer, STAGE_STORIES, journeyFor, multiplicationUsesStory, startMultiplicationFinal, answerMultiplicationFinal, questionAnswerText, curriculumUnitComplete, canStartCurriculumMission, recordCurriculumAttempt, completeCurriculumMission, curriculumGraduationAvailable, claimCurriculumGraduation, addRoomFurniture, removeRoomFurniture, placeRoomFurniture, roomFurniturePosition, defaultRoomFurniturePosition, OPERATIONS, NEW_CURRICULUM_UNITS, OPERATION_INFO, PRACTICE_TIER_NAMES, type CurriculumUnitId, type NewCurriculumUnitId, type ForestKind, type Operation, type PracticeTier, type SchoolGrade, type Save } from './rules';
import { gradeRegions, gradeMissions, generateGradeQuestion, type GradeRegion } from './grade-content';
import { STAGES, stageMonsters, stageBerries, berryValue, clearBonus } from './stages';
import { Sound, moodForHour } from './audio';
import { ambienceEnabled, applyAmbience, lineContext, setAmbience } from './ambience';
import { RESCUES, FLOWERS, gardenOf, rescueSheep, plantFlower } from './garden';
import { EXPEDITION_TITLES, expeditionBerryReward, expeditionLayout, expeditionUnlocked, startExpedition, collectExpeditionStar, defeatExpeditionMonster, canFinishExpedition, finishExpedition, selectExpeditionTitle } from './expedition';
import { parseLocalRanks, updateLocalRanks } from './ranking';
import { getGlobalPlayerId, loadGlobalRanks, syncGlobalRank, type GlobalRank } from './global-ranking';
import { markBackup, shouldRemindBackup } from './backup';
import { adaptiveEnabled, adaptiveRecord, setAdaptive, startLevel, type AdaptiveLevel } from './adaptive';
import { buildReport, reportHtml } from './report';
import { addBossDamage, bossOfWeek, claimBossReward, readBoss, setClassCode, syncBoss, type BossSummary } from './boss';
import { bubbleOpen, closeBubble, greetingFor, showBubble } from './bubble';
import { speak, speechSupported, stopSpeech, autoReadEnabled, setAutoRead } from './speech';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const root = $('#game');
const COPYRIGHT_OWNER = '양연태';
const COPYRIGHT_YEAR = 2026;
root.innerHTML = `<div id="world" aria-label="베리숲 3D 마을"></div><div id="hud" hidden>
  <header class="topbar"><div class="player-card"><span class="level-badge" id="level">1</span><div><strong id="nickname"></strong><div class="xp-track"><div id="xp-fill"></div></div><small id="xp-text"></small></div></div><div class="brand-mini">베리숲 <span>모험학교</span></div><div class="top-actions"><span class="wallet">🍓 <b id="berries">0</b><span>베리</span></span><button id="inventory" class="icon-button" aria-label="내 인벤토리">🎒</button><button id="stage-map" class="icon-button" aria-label="사냥터 지도">🗺</button><button id="settings" class="icon-button" aria-label="설정과 저장">⚙</button></div></header>
  <aside class="quest-card"><button id="quest-toggle" class="quest-toggle" aria-expanded="true" aria-controls="quest-body"><span>✿ 오늘의 작은 모험</span><span class="quest-chevron" aria-hidden="true">⌃</span></button><div id="quest-body" class="quest-body"><strong id="quest-title">베리숲에 오신 걸 환영해요</strong><div id="quest-list"></div><button id="daily-open" class="text-button codex-open daily-open">📅 오늘의 미션<i class="daily-dot" aria-hidden="true"></i></button><button id="boss-open" class="text-button codex-open">🐉 우리 반 협동 보스</button><button id="codex-open" class="text-button codex-open">📖 모험 발견 도감</button></div></aside>
  <div class="location-pill">❋ 베리숲 마을 <span>평화로운 오후</span></div>
  <div class="equipment-card"><span id="weapon-name"></span><small id="weapon-effect"></small></div>
  <div class="controls-help"><kbd>W A S D</kbd> 이동 <kbd>Space</kbd> 점프 <kbd>E</kbd> 대화 <kbd>F</kbd> 휘두르기</div>
  <button id="interact" class="interaction" hidden></button>
  <div id="touch-controls"><div id="joystick" role="group" aria-label="이동 조이스틱"><span id="stick"></span></div><div class="touch-actions"><button id="touch-talk">대화</button><button id="touch-attack">나무 베기</button><button id="touch-jump">점프 ↟</button></div></div>
</div><div id="start-screen" class="start-layer"></div><dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status" aria-live="polite"></div><input type="file" id="import-file" accept="application/json,.json" hidden>`;

let nearNpcName = '';
let world: World, AvatarPreviewRuntime: typeof AvatarPreview;
const audio = new Sound(), STORAGE = 'berry-forest-save-v1', RANKING_STORAGE = 'berry-forest-local-expedition-ranking-v1';
const refreshAmbience = () => { audio.setMood(moodForHour(new Date().getHours())); applyAmbience(root, $('#hud')); };
setInterval(refreshAmbience, 300000);
const gardenButton = document.createElement('button');
gardenButton.id = 'garden'; gardenButton.className = 'secondary garden-entry';
gardenButton.textContent = '🐑 구름양 구출 · 내 화단';
$('#quest-list').after(gardenButton); gardenButton.onclick = () => openGarden();
const expeditionButton = document.createElement('button');
expeditionButton.id = 'expedition'; expeditionButton.className = 'secondary garden-entry'; expeditionButton.textContent = '✦ 별빛 재탐험';
gardenButton.after(expeditionButton); expeditionButton.onclick = () => openExpeditionBoard();
const questCard = $('.quest-card');
function setQuestCollapsed(collapsed: boolean) {
  questCard.classList.toggle('is-collapsed', collapsed);
  $('#quest-toggle').setAttribute('aria-expanded', String(!collapsed));
  $('#quest-body').hidden = collapsed;
}
setQuestCollapsed(matchMedia('(max-width: 600px), (max-height: 500px)').matches);
$('#quest-toggle').onclick = () => setQuestCollapsed(!questCard.classList.contains('is-collapsed'));
let state: Save | null = null, saved: Save | null = null, preview: AvatarPreview | null = null, startPreview: AvatarPreview | null = null;
let startPreviewRequest = 0, startPortraits: string[] | null = null;
let selected = 0, selectedGrade: SchoolGrade = 3, pendingImport: Save | null = null, toastTimer: ReturnType<typeof setTimeout>, modalOpener: HTMLElement | null = null;
let battle: { encounter: Encounter; id: string; kind: 'normal' | 'expMonster' | 'expGate' | 'multiplicationGate'; round: number; goalRounds?: number; score: number; result: ReturnType<typeof grantReward> | null; newTitle?: number; story?: boolean; missedCurrent?: boolean; practice?: { operation: Operation; tier: PracticeTier } } | null = null;
type CurriculumModule = typeof import('./curriculum');
type CurriculumQuestion = import('./curriculum').CurriculumQuestion;
let curriculumModulePromise: Promise<CurriculumModule> | null = null;
let curriculumRun: { unit: CurriculumUnitId; mission: number; question: CurriculumQuestion; index: number; total: number; wrong: number; hints: number; hintLevel: number; seenQuestions: Set<string>; missedCurrent?: boolean; graduation?: boolean; review?: boolean; shadow?: CurriculumMistake } | null = null;
// 틀린 개념마다 마을에 나타나는 "그림자 몬스터"(최대 3마리). 다시 풀면 사라지고 작은 베리를 줘요.
let shadowList: CurriculumMistake[] = [], shadowToastShown = false;
const SHADOW_REWARD = 15;
function syncShadows() {
  if (!world!) return;
  shadowList = state ? state.curriculum.wrongSkills.slice(0, 3) : [];
  world.setShadows(shadowList.map((mistake, i) => ({ id: `shadow${i}`, name: `그림자 몬스터 · ${curriculumRegions().find(region => region.id === mistake.unit)?.name ?? '수학'} 다시 만나기`, type: Math.max(0, curriculumRegions().findIndex(region => region.id === mistake.unit)) % 8 })));
  if (shadowList.length && world.stage === 0 && !world.inRoom && !shadowToastShown) { shadowToastShown = true; setTimeout(() => toast('🌑 마을에 그림자 몬스터가 나타났어요! 다시 풀면 사라져요.'), 2200); }
}
let storageError = false, sessionExpired = false, sessionElapsed = 0, sessionCorrect = 0, sessionWrong = 0;
const OUTFIT_ICONS = ['🌿', '🌈', '🍃', '☁️', '🌸', '🌟', '🌙', '👑', '🍓', '🐥', '🐰', '🌰', '🐱', '🐑', '🐸', '🧚', '🌻', '🐝', '🍑', '✴️', '🛡️'];
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
  addition: { name: '덧셈의 숲', icon: '🍎', op: '덧셈', title: '사과 덧셈 지도', intro: '기초 덧셈에서 시작해 3학년 1학기의 세 자리 수 덧셈까지 배워요.', stages: step => ['덧셈 준비 · 받아올림 없음', '덧셈 준비 · 받아올림', '두 자리 + 한 자리', '두 자리 + 한 자리 · 받아올림', '두 자리 + 두 자리', '두 자리 + 두 자리 · 받아올림', '합이 100 이상인 덧셈', '세 자리 + 두 자리', '세 자리 + 두 자리 · 받아올림', '세 자리 + 세 자리 종합'][step - 1] },
  subtraction: { name: '뺄셈의 숲', icon: '🍂', op: '뺄셈', title: '낙엽 뺄셈 지도', intro: '기초 뺄셈에서 시작해 3학년 1학기의 세 자리 수 뺄셈까지 배워요.', stages: step => ['뺄셈 준비 · 받아내림 없음', '뺄셈 준비 · 받아내림', '두 자리 − 한 자리', '두 자리 − 한 자리 · 받아내림', '두 자리 − 두 자리', '두 자리 − 두 자리 · 받아내림', '100 몇 − 두 자리', '세 자리 − 두 자리', '세 자리 − 두 자리 · 받아내림', '세 자리 − 세 자리 종합'][step - 1] },
};
const curriculumName = (unit: CurriculumUnitId) => curriculumRegions().find(region => region.id === unit)?.name ?? unit;
const loadCurriculum = () => curriculumModulePromise ??= import('./curriculum');
try { const raw = localStorage.getItem(STORAGE); if (raw) saved = validateSave(JSON.parse(raw)); } catch { storageError = true; }
selectedGrade = saved?.grade ?? 3;

function escape(s: string) { return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!); }
function buffTime(seconds: number) { const minutes = Math.floor(seconds / 60), rest = seconds % 60; return minutes ? `${minutes}분 ${rest.toString().padStart(2, '0')}초` : `${rest}초`; }
function equipmentEffectText(s: Save, now = Date.now()) {
  const effect = potionEffects(s, now), potion = `${effect.berrySeconds ? ` · 🍓×${effect.berryMultiplier} ${buffTime(effect.berrySeconds)}` : ''}${effect.xpSeconds ? ` · 🧪경험×${effect.xpMultiplier} ${buffTime(effect.xpSeconds)}` : ''}`;
  return `대련 ×${(WEAPONS[s.weapon].multiplier + s.weapons[s.weapon] * .1).toFixed(1)} · 나무 힘 ${treeDamage(s)} · ${s.ride >= 0 ? `${RIDES[s.ride].icon} 속도 ×${RIDES[s.ride].speed}` : `옷: ${OUTFITS[s.outfit].effect}`}${s.pet >= 0 ? ` · ${PETS[s.pet].icon} 펫` : ''}${potion}`;
}
function weaponExplanation(id: number, level = 0) { const item = WEAPONS[id], power = item.treePower + level; return `몬스터 1마리를 이길 때마다 기본 보상에 ${item.bonus}베리를 더 받아요.<br>대련장에서는 문제를 맞혀 받는 기본 점수가 ${(item.multiplier + level * .1).toFixed(1)}배가 돼요.<br>베리나무에 한 번 휘두르면 힘 ${power}만큼 깎여서 약 ${Math.ceil(7 / power)}번이면 벨 수 있어요.`; }
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
function toast(message: string) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function persist() {
  if (!state) return;
  if (!world.inRoom) { const p = world.player.position; state.position = { x: p.x, z: p.z }; }
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); if (!state.teacherMode) localStorage.setItem(RANKING_STORAGE, JSON.stringify(updateLocalRanks(parseLocalRanks(localStorage.getItem(RANKING_STORAGE)), state.nickname, state.expedition.completed))); saved = structuredClone(state); } catch { if (!storageError) toast('자동 저장 공간이 부족해요. 설정에서 저장 파일을 내려받아 주세요.'); storageError = true; }
}
function refresh() {
  if (!state) return; const s = state, journey = journeyFor(s), forestName = FOREST_INFO[s.forest].name;
  const activeTitle = s.curriculum.graduationClaimed ? `${s.grade}학년 수학 탐험가` : s.expedition.selectedTitle ? EXPEDITION_TITLES[s.expedition.selectedTitle].name : s.multiplicationCompleted ? '곱셈숲 탐험가' : '';
  $('#level').textContent = `${s.level}`; $('#nickname').textContent = `${s.nickname}${activeTitle ? ` · ${activeTitle}` : ''}${s.teacherMode ? ' · 선생님' : ''}`; $('#berries').textContent = s.berries.toLocaleString();
  $('#xp-fill').style.width = `${s.xp / (s.level * 40) * 100}%`; $('#xp-text').textContent = `경험치 ${s.xp} / ${s.level * 40}`;
  $('#weapon-name').textContent = `${WEAPONS[s.weapon].icon} ${WEAPONS[s.weapon].name} +${s.weapons[s.weapon]} · ${OUTFITS[s.outfit].name}`;
  $('#weapon-effect').textContent = equipmentEffectText(s);
  const expedition = s.forest === 'division' ? s.expedition.active : null;
  $('.location-pill').innerHTML = world?.inRoom ? '⌂ 나의 집 <span>가구를 눌러 꾸며요</span>' : journey.stage ? `${s.forest === 'division' ? '❋' : FOREST_INFO[s.forest].icon} ${journey.stage}단계 사냥터 <span>${expedition?.stage === journey.stage ? '✦ 별빛 재탐험' : `${forestName} · ${STAGES[journey.stage - 1].name}`}</span>` : `${VILLAGE_THEMES[villageThemeId(s)].icon} ${VILLAGE_THEMES[villageThemeId(s)].name} <span>${VILLAGE_THEMES[villageThemeId(s)].blurb}</span>`;
  const tasks: [boolean, string, GuideKind][] = [[s.tutorial.collected, '길 위의 베리 줍기', 'berry'], [s.tutorial.battle, '계산으로 몬스터 만나기', 'monster'], [s.tutorial.shop, '강지후·오지후 상점 구경', 'shop']];
  const expeditionHere = expedition?.stage === journey.stage && !world?.inRoom;
  const stage = journey.stage, map = journey.maps[stage];
  const goals: [boolean, string, GuideKind | null][] = expeditionHere
    ? [[expedition.stars.length === 3, `별빛 표식 ${expedition.stars.length} / 3`, 'star'], [expedition.monsters.length === 2, `별빛 대련 ${expedition.monsters.length} / 2`, 'expMonster'], [false, '출구에서 이야기 문제 풀기', canFinishExpedition(s) ? 'next' : null]]
    : stage && !world?.inRoom
      ? [[map.cleared, `${FOREST_INFO[s.forest].op} 대련 ${map.monsters.length} / ${stageMonsters(stage).length}`, 'monster'], [map.berries.length === stageBerries(stage).length, `숲 베리 ${map.berries.length} / ${stageBerries(stage).length}`, 'berry'], [false, map.cleared ? (stage === 10 && s.forest === 'multiplication' ? '출구의 구구단 햇살문 풀기' : '출구에서 다음 숲으로 가기') : STAGE_STORIES[stage - 1], map.cleared ? 'next' : null]]
      : world?.inRoom ? [[false, '방의 문으로 나가 마을로 돌아가기', 'roomExit']] : tasks.every(task => task[0]) ? [[false, `모험의 문에서 ${forestName} 고르기`, 'journey']] : tasks;
  $('#quest-list').innerHTML = goals.map(([done, label, guide]) => `<div class="quest ${done ? 'done' : ''}"><span>${done ? '✓' : '○'}</span><span>${label}</span>${done || !guide ? '' : `<button class="quest-guide" data-guide="${guide}" aria-label="${escape(label)} 위치 안내">안내</button>`}</div>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-guide]').forEach(button => button.onclick = () => {
    const name = world.guideTo(button.dataset.guide as GuideKind);
    toast(name ? `🧭 ${name} 방향을 알려줄게요!` : '지금 안내할 대상을 찾지 못했어요. 목표를 다시 확인해 주세요.');
  });
  $('#quest-title').textContent = expeditionHere ? `✦ ${journey.stage}단계 별빛 원정` : journey.stage ? `${forestName} ${journey.stage}단계 · ${STAGES[journey.stage - 1].name}` : tasks.every(t => t[0]) ? `모험의 문에서 ${forestName}을 골라요!` : '숲과 친해지는 세 가지 방법';
  expeditionButton.hidden = s.forest !== 'division' || !expeditionUnlocked(s);
  audio.music = s.settings.music; audio.effects = s.settings.sound;
}
function syncAvatar() { if (state) world.setAvatar(state.character, state.outfit, state.weapon, state.outfits[state.outfit], state.weapons[state.weapon], state.ride, state.pet, state.hairstyle, state.face); }
function openGarden() {
  if (!state) return;
  const s = state, garden = gardenOf(s), seeds = garden.rescued - garden.flowers.filter(f => f >= 0).length;
  openModal(title('구름양의 선물', '나의 작은 화단') + `<p>양들을 똑같이 나눠 집에 데려다주면 꽃씨를 받아요. 꽃은 기다리지 않아도 바로 피어나요!</p><p class="garden-progress">🐑 구출 ${garden.rescued} / 3 · 🌱 남은 꽃씨 ${seeds}개</p><div class="flower-plots">${garden.flowers.map((f, i) => `<button class="flower-plot" data-plot="${i}" aria-label="${i + 1}번 화단 ${f < 0 ? '꽃 심기' : '꽃 바꾸기'}"><span>${f < 0 ? '🌱' : FLOWERS[f]}</span>${f < 0 ? '꽃 심기' : '꽃 바꾸기'}</button>`).join('')}</div><p id="garden-message" role="status">${garden.rescued === 3 ? '🏅 구름양 지킴이! 세 가지 구출을 모두 해냈어요.' : '첫 번째 구출부터 차근차근 도전해요.'}</p><button id="rescue-start" class="primary wide">${garden.rescued < 3 ? `🐑 ${RESCUES[garden.rescued].name} 구하러 가기` : '🐑 다시 나눠 보기 (연습)'}</button>`, 'garden-modal');
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
  const s = state, quest = RESCUES[round], pens = Array<number>(quest.groups).fill(0);
  openModal(title('구름양 구출 작전', quest.name) + `<p>${quest.story}</p><p class="garden-progress">양 ${quest.total}마리 ÷ 우리 ${quest.groups}개 = 우리마다 몇 마리?</p><div id="sheep-meadow" class="sheep-meadow" aria-label="남은 양"></div><p>우리의 <b>한 마리 데려오기</b>를 눌러요. 잘못 넣으면 돌려보낼 수 있어요.</p><div class="sheep-pens">${pens.map((_, i) => `<section class="sheep-pen"><h3>${i + 1}번 우리 <span id="pen-count-${i}"></span></h3><div id="pen-sheep-${i}" class="pen-flock"></div><button data-add="${i}" class="secondary">한 마리 데려오기</button><button data-undo="${i}" class="text-button">한 마리 돌려보내기</button></section>`).join('')}</div><p id="rescue-message" role="status" aria-live="polite">모든 우리에 같은 수의 양을 넣어 주세요.</p><button id="rescue-check" class="primary wide">모두 집에 도착했나요?</button><button id="rescue-hint" class="text-button">💡 도움이 필요해요</button><button id="rescue-back" class="text-button">화단으로 돌아가기</button>`, 'garden-modal');
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
    openModal(title('모두 무사히 돌아왔어요!', '구출 성공!') + `<div class="rescue-success">🐑 🌷 🐑</div><p class="garden-progress">${quest.total} ÷ ${quest.groups} = ${quest.total / quest.groups}</p><p>우리마다 ${quest.total / quest.groups}마리씩! ${rewarded ? '고마운 양들이 꽃씨 1개를 선물했어요.' : '다시 한번 똑같이 나누는 데 성공했어요! 연습에서는 꽃씨를 더 받지 않아요.'}</p><button id="rescue-reward" class="primary wide">내 화단으로 가기 🌱</button>`, 'garden-modal');
    $('#rescue-reward').onclick = openGarden;
  };
  draw();
}
function closeModal() { stopSpeech(); preview?.dispose(); preview = null; curriculumRun = null; $('#modal').classList.remove('shop-modal'); ($('#modal') as HTMLDialogElement).close(); if (world!) { world.setPaused(!state); world.clearInput(); } if (modalOpener?.isConnected && !modalOpener.closest('[hidden]')) modalOpener.focus(); }
function openModal(html: string, cls = '') {
  preview?.dispose(); preview = null; if (world!) { world.setPaused(true); world.clearInput(); }
  const dialog = $('#modal') as HTMLDialogElement; if (!dialog.open) modalOpener = document.activeElement as HTMLElement;
  dialog.className = cls; $('#modal-content').innerHTML = html; if (!dialog.open) dialog.showModal();
  $('#modal-content').querySelectorAll<HTMLElement>('[data-close]').forEach(el => el.onclick = () => { if (battle) exitBattle(); else closeModal(); });
}
function title(kicker: string, name: string) { return `<div class="modal-heading"><div><span class="eyebrow">${kicker}</span><h2>${name}</h2></div><button class="close" data-close aria-label="닫기">×</button></div>`; }
($('#modal') as HTMLDialogElement).addEventListener('cancel', e => { e.preventDefault(); if (battle) exitBattle(); else closeModal(); });

function openCopyrightNotice() {
  openModal(title('저작권과 이용 안내', '베리숲을 즐겁고 안전하게 이용해요') + `<div class="legal-notice">
    <p class="legal-owner">© ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER}. <b>베리숲 모험학교</b>. All rights reserved.</p>
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
  if (world!) { world.setActive(false); } startPreviewRequest++; startPreview?.dispose(); startPreview = null; $('#hud').hidden = true; $('#start-screen').hidden = false;
  $('#start-screen').innerHTML = `<section class="welcome-card"><div class="logo-mark">✿</div><span class="eyebrow">작은 모험, 자라는 생각</span><h1>베리숲<br><span>모험학교</span></h1><p class="intro">베리를 줍고 선택한 학년의 수학을 배우며,<br>1·2학기 모험 지역을 자유롭게 여행해요.</p><label class="name-label grade-label">몇 학년 모험을 떠날까요?</label><div class="grade-picker" role="radiogroup" aria-label="학년 선택">${([1,2,3,4,5,6] as SchoolGrade[]).map(grade => `<button type="button" data-grade="${grade}" role="radio" aria-checked="${selectedGrade === grade}" class="${selectedGrade === grade ? 'selected' : ''}">${grade}<small>학년</small></button>`).join('')}</div><div id="start-avatar" class="start-avatar"></div><div class="character-picker" role="group" aria-label="캐릭터 선택">${CHARACTERS.map((c, i) => `<button class="character-choice ${i === selected ? 'selected' : ''}" data-character="${i}" aria-pressed="${i === selected}"><span class="character-dot" style="--hair:#${c.hair.toString(16)};--skin:#${c.skin.toString(16)}">${['✿', '●', '☾', '✦'][i]}</span>${c.name}</button>`).join('')}</div><p id="character-desc" class="subtle">${CHARACTERS[selected].desc} · 능력은 모두 같아요</p><label class="name-label" for="nickname-input">모험가의 이름</label><input id="nickname-input" maxlength="10" placeholder="닉네임을 적어 주세요" autocomplete="off"><p id="start-error" class="error" role="alert"></p><button class="primary start-button" id="new-game">${saved ? '새 모험 시작' : '숲으로 출발하기'} <span>→</span></button>${saved ? `<button class="secondary wide" id="continue">${escape(saved.nickname)} · ${saved.grade}학년 · Lv.${saved.level} 이어하기</button>` : ''}<button class="text-button" id="start-import">저장 파일 불러오기</button><small class="save-note">이 기기와 브라우저에 모험이 저장돼요</small><button class="legal-link" id="start-legal">© ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER} · 저작권과 이용 안내</button></section><div class="start-world-caption"><span>❋</span> 오늘도, 새로운 모험이 기다려요</div>`;
  void showStartPreview(selected);
  document.querySelectorAll<HTMLButtonElement>('[data-grade]').forEach(button => button.onclick = () => { selectedGrade = Number(button.dataset.grade) as SchoolGrade; document.querySelectorAll<HTMLButtonElement>('[data-grade]').forEach(item => { const on = item === button; item.classList.toggle('selected', on); item.setAttribute('aria-checked', String(on)); }); });
  document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(b => b.onclick = () => { selected = Number(b.dataset.character); document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(x => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); }); $('#character-desc').textContent = `${CHARACTERS[selected].desc} · 능력은 모두 같아요`; void showStartPreview(selected); });
  $('#new-game').onclick = () => {
    const nickname = $('#nickname-input') as HTMLInputElement; let next: Save;
    try { next = newSave(nickname.value, selected, selectedGrade); } catch (e) { $('#start-error').textContent = (e as Error).message; nickname.focus(); return; }
    if (saved) confirmAction('새 모험을 시작할까요?', '현재 저장된 모험이 새 모험으로 바뀌어요. 먼저 저장 파일을 내려받을 수도 있어요.', () => begin(next, true), true); else begin(next, true);
  };
  $('#nickname-input').onkeydown = e => { if (e.key === 'Enter') $('#new-game').click(); };
  if (saved) $('#continue').onclick = () => begin(structuredClone(saved!), false);
  $('#start-import').onclick = () => ($('#import-file') as HTMLInputElement).click();
  $('#start-legal').onclick = openCopyrightNotice;
  if (storageError) $('#start-error').textContent = '이전 저장을 읽지 못했어요. 저장 파일을 불러오거나 새 모험을 시작할 수 있어요.';
}
async function begin(s: Save, fresh: boolean) {
  const launch = document.querySelector<HTMLButtonElement>('#new-game, #continue'); if (launch) { launch.disabled = true; launch.textContent = '숲을 준비하고 있어요…'; }
  try { await loadWorld(); } catch { $('#start-error').textContent = '3D 숲을 열지 못했어요. 최신 Chrome 또는 Edge에서 다시 시도해 주세요.'; if (launch) launch.disabled = false; return; }
  sessionExpired = false; sessionElapsed = 0; sessionCorrect = 0; sessionWrong = 0;
  closeModal(); startPreviewRequest++; startPreview?.dispose(); startPreview = null; state = s; preview?.dispose(); preview = null; $('#start-screen').hidden = true; $('#hud').hidden = false;
  world.restore(s); world.setActive(true); audio.music = s.settings.music; audio.effects = s.settings.sound; refreshAmbience(); audio.start(); refresh(); persist();
  if (fresh) openGuide(); else toast(`${s.nickname}, 다시 만나 반가워요!`);
  if (!fresh && shouldRemindBackup(localStorage, s.level)) setTimeout(() => toast('💾 설정(⚙)에서 저장 파일을 내려받아 두면 기기를 바꿔도 모험을 지킬 수 있어요.'), 3500);
}
function showSessionSummary() {
  if (!state) return; sessionExpired = false; world.setPaused(true); world.clearInput(); persist();
  const mins = Math.floor(sessionElapsed / 60), secs = sessionElapsed % 60;
  const insight = learningInsight(state);
  openModal(title('오늘의 모험 정리', '오늘도 한 뼘 자랐어요!') + `<div class="arena-intro"><div class="arena-symbol">🌟</div><p>함께한 시간 <b>${mins}분 ${secs}초</b><br>맞힌 문제 <b>${sessionCorrect}개</b> · 다시 도전한 문제 <b>${sessionWrong}개</b></p><div class="learning-insight"><p><b>👍 잘 이해한 내용</b>${escape(insight.strong)}</p><p><b>🌱 다시 연습할 내용</b>${escape(insight.review)}</p><p><b>🧭 추천 임무</b>${escape(insight.recommend)}</p></div><p class="note">점수보다 어떤 생각이 자랐는지를 먼저 보여 줘요. 기록은 이 브라우저에 저장했어요.</p><button class="secondary wide" id="session-review">학습 기록과 복습 보기</button><button class="primary wide" id="session-finish">오늘은 여기까지</button></div>`);
  $('#session-review').onclick = () => openNotebook();
  $('#session-finish').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
function learningInsight(s: Save) {
  const attempted = curriculumRegions().map(region => { const p = s.curriculum.units[region.id], total = p.correct + p.wrong; return { name: region.name, total, rate: total ? p.correct / total : -1 }; }).filter(item => item.total > 0);
  const strong = attempted.length ? [...attempted].sort((a, b) => b.rate - a.rate)[0].name : '처음 만난 문제를 차분히 살펴보는 힘';
  const needs = attempted.filter(item => item.rate < .8).sort((a, b) => a.rate - b.rate)[0];
  const next = curriculumRegions().find(region => !curriculumUnitComplete(s, region.id));
  return { strong, review: needs?.name ?? '아직 꼭 다시 연습해야 할 단원이 없어요', recommend: next ? `${next.name}의 다음 열린 단계` : `${s.grade}학년 졸업 모험 다시 도전하기` };
}
const GRADE_OVERVIEW: Record<SchoolGrade, string> = {
  1: '9까지와 100까지의 수, 모으기와 가르기, 덧셈과 뺄셈, 여러 가지 모양, 시계, 규칙 찾기',
  2: '네 자리 수, 덧셈과 뺄셈, 곱셈구구, 길이 재기, 시각과 시간, 여러 가지 도형, 규칙 찾기, 표와 그래프',
  3: '계산, 도형, 길이와 시간, 분수와 소수, 원, 측정, 그림그래프',
  4: '큰 수, 곱셈과 나눗셈, 각도, 분수와 소수의 덧셈·뺄셈, 삼각형·사각형·다각형, 규칙, 막대·꺾은선그래프',
  5: '약수와 배수, 혼합 계산, 분수와 소수의 계산, 합동과 대칭, 둘레와 넓이, 평균과 가능성',
  6: '분수와 소수의 나눗셈, 비와 비율, 비례식, 원의 넓이, 입체도형, 띠그래프와 원그래프'
};
function openGuide() {
  openModal(title('마을 대장 · 연태쌤', '베리숲에 온 걸 환영해요!') + `<div class="guide-content"><p>나는 연태쌤이야. 모험의 문에서 <strong>${state!.grade}학년 1·2학기 수학 지역</strong>을 골라 보렴. 모든 지역에는 차근차근 열리는 10개의 모험 단계가 있단다.</p><ol><li><b>🍓 스테이지 베리</b><span>한 번 모은 베리는 같은 사냥터에서 다시 나타나지 않아. 다른 숲과 새 단계에는 새로운 베리가 있어!</span></li><li><b>🌳 베리나무</b><span>나무 가까이에서 F 또는 나무 베기를 눌러 보렴. 다 베면 2~4베리가 나오고, 좋은 무기일수록 빨라!</span></li><li><b>🗺 ${state!.grade}학년 수학 지도</b><span>${GRADE_OVERVIEW[state!.grade]} 단원을 그림과 이야기로 배워요.</span></li><li><b>✨ 마을 상점과 인벤토리</b><span>강지후의 무기, 오지후의 옷, 나현이의 라이딩, 윤준의 펫을 모아 봐. 가영이에게는 헤어와 성형을 바꿀 수 있어.</span></li></ol><p class="note">키보드는 WASD·방향키 이동, Space 점프, E 대화, F 나무 베기예요.<br>휴대폰과 태블릿은 화면 아래 조이스틱과 버튼을 사용해요.</p><button class="primary wide" data-close>좋아, 모험을 떠나자!</button></div>`);
}
async function loadWorld() {
  if (world!) return;
  try {
    const module = await import('./world'); AvatarPreviewRuntime = module.AvatarPreview; world = new module.World($('#world'));
    world.onCollect = id => { if (!state) return; const value = collectBerry(state, id); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🍓 베리 +${value}`); };
    world.onStar = id => { if (!state || !collectExpeditionStar(state, id)) return; audio.play('berry'); refresh(); persist(); toast(`✦ 별빛 표식 ${state.expedition.active!.stars.length} / 3`); };
    world.onStageLoaded = () => syncShadows();
    world.onJump = () => audio.play('jump'); world.onRescue = () => toast('폭신한 길로 돌아왔어요. 다시 가 볼까요?');
    world.onNear = (name, id) => { nearNpcName = name || nearNpcName; $('#interact').hidden = !name; $('#interact').textContent = name ? id?.startsWith('tree') ? `${name} · F로 휘두르기` : `${name} · 대화하기 E` : ''; $('#touch-talk').textContent = name?.includes('그림자') || name?.includes('슬라임') || name?.includes('요정') || name?.includes('토끼') || name?.includes('정령') ? '대련' : '대화'; };
    world.onAttack = id => { if (!state) return; if (!id) { audio.play('swing'); return; } const result = world.hitTree(id, treeDamage(state)); if (!result) return; audio.play('chop'); if (!result.fell) { toast(`통통! 나무가 흔들렸어요 · ${result.remaining}만큼 남았어요`); return; } const reward = (2 + Math.floor(Math.random() * 3)) as 2 | 3 | 4, value = fellTree(state, Number(id.slice(4)), reward); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🌳 나무를 베었어요! 🍓 +${value}베리`); };
    world.onInteract = id => { if (!state || bubbleOpen()) return; const line = greetingFor(id, Math.random, lineContext()); if (line) { world.setPaused(true); world.clearInput(); showBubble(nearNpcName || '마을 친구', line, () => { world.setPaused(!state); world.clearInput(); handleInteract(id); }, index => audio.talk(index)); return; } handleInteract(id); };
    const handleInteract = (id: string) => { if (!state) return; const journey = journeyFor(state); if (id.startsWith('tree')) world.attack(); else if (id === 'guide') openGuide(); else if (id === 'weapon' || id === 'outfit') openShop(id); else if (id === 'ride') openInventory('ride'); else if (id === 'pet') openPetShop(); else if (id === 'potion') openPotionShop(); else if (id === 'beauty') openBeauty(); else if (id === 'arena') openArena(); else if (id === 'journey') openStageMap(); else if (id === 'room') { world.enterRoom(state); refresh(); persist(); toast('나의 포근한 방에 도착했어요. 문으로 가면 마을로 돌아가요!'); } else if (id === 'roomDecor') openRoom(); else if (id === 'roomExit') { state.position = { x: 0, z: 8 }; world.loadStage(state, true); refresh(); persist(); toast('베리숲 마을로 돌아왔어요!'); } else if (id === 'village') switchStage(0); else if (id === 'unit') openVillageBoard(); else if (id === 'next') openNextGate(); else if (id.startsWith('expMonster')) { const monsterId = Number(id.slice('expMonster'.length)), monster = stageMonsters(state.journey.stage)[monsterId]; if (state.forest === 'division' && state.expedition.active && monster) startBattle(monster.type, false, id); } else if (id.startsWith('shadow')) { const mistake = shadowList[Number(id.slice(6))]; if (mistake) void startCurriculumReview(mistake.unit, mistake); } else if (id.startsWith('monster')) { const huntId = Number(id.slice(7)); beginHuntBattle(stageMonsters(journey.stage)[huntId].type, id); } };
  } catch (e) {
    root.innerHTML = `<div class="fallback"><h1>숲을 그리지 못했어요</h1><p>3D 화면을 지원하는 최신 Chrome 또는 Edge에서 열어 주세요. 브라우저의 그래픽 가속이 켜져 있는지도 확인해 주세요.</p><button onclick="location.reload()">다시 열기</button></div>`; throw e;
  }
}
$('#interact').onclick = () => world.interact(); $('#touch-talk').onclick = () => world.interact(); $('#touch-attack').onpointerdown = e => { e.preventDefault(); world.attack(); }; $('#touch-jump').onpointerdown = e => { e.preventDefault(); world.jump(); };
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
  if (choice.operation === 'auto') return '자동: 지금 있는 숲의 단계에 맞춰 문제가 나와요.';
  if (adaptiveEnabled()) return `${OPERATION_INFO[choice.operation].name} · ✨ 자동 조절 — 연속 3번 맞히면 한 단계 어려워지고, 2번 틀리면 한 단계 쉬워져요. ${PRACTICE_TIER_NAMES[choice.tier]}부터 시작해요.`;
  return `${OPERATION_INFO[choice.operation].name} · ${PRACTICE_TIER_NAMES[choice.tier]} — ${PRACTICE_TIER_TEXT[choice.operation][choice.tier]}`;
}
// 자동 조절 중인 계산별 현재 단계(이번 접속 동안만 기억해요). 켜져 있지 않으면 고른 단계를 그대로 써요.
const adaptiveLevels = new Map<Operation, AdaptiveLevel>();
function practiceFor(practice?: { operation: Operation; tier: PracticeTier }) {
  if (!practice || !adaptiveEnabled()) return practice;
  const level = adaptiveLevels.get(practice.operation) ?? startLevel(practice.tier); adaptiveLevels.set(practice.operation, level);
  return { operation: practice.operation, tier: level.tier };
}
function recordAdaptive(correct: boolean) {
  if (!battle?.practice || !adaptiveEnabled()) return;
  const before = adaptiveLevels.get(battle.practice.operation) ?? startLevel(battle.practice.tier), after = adaptiveRecord(before, correct);
  adaptiveLevels.set(battle.practice.operation, after);
  if (after.tier > before.tier) toast('✨ 잘하고 있어요! 조금 더 어려운 문제로 올라가 볼까요?');
  else if (after.tier < before.tier) toast('🌿 천천히 해도 괜찮아요. 한 단계 쉬운 문제로 바꿨어요.');
}
function practicePickerHtml() {
  const choice = state!.settings.practice, ops: [string, string, string][] = [['auto', '🎲', '자동'], ...OPERATIONS.map(op => [op, OPERATION_INFO[op].icon, OPERATION_INFO[op].name] as [string, string, string])];
  return `<div class="practice-picker"><p class="practice-title">어떤 계산을 연습할까요?</p><div class="practice-chips" role="radiogroup" aria-label="연습할 계산">${ops.map(([id, icon, name]) => `<button type="button" class="practice-chip ${choice.operation === id ? 'selected' : ''}" data-practice-op="${id}" role="radio" aria-checked="${choice.operation === id}"><span aria-hidden="true">${icon}</span>${name}</button>`).join('')}</div><div class="practice-tiers" ${choice.operation === 'auto' ? 'hidden' : ''}><p class="practice-title">난이도는요?</p><div class="practice-chips" role="radiogroup" aria-label="난이도">${PRACTICE_TIER_NAMES.map((name, tier) => `<button type="button" class="practice-chip tier ${!adaptiveEnabled() && choice.tier === tier ? 'selected' : ''}" data-practice-tier="${tier}" role="radio" aria-checked="${!adaptiveEnabled() && choice.tier === tier}">${['🌱', '🌿', '🌳'][tier]} ${name}</button>`).join('')}<button type="button" class="practice-chip tier ${adaptiveEnabled() ? 'selected' : ''}" data-practice-adaptive role="radio" aria-checked="${adaptiveEnabled()}">✨ 자동</button></div></div><p class="practice-note" id="practice-note">${practiceNote(choice)}</p></div>`;
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
  root.querySelectorAll<HTMLButtonElement>('[data-practice-op]').forEach(button => button.onclick = () => { state!.settings.practice.operation = button.dataset.practiceOp as Operation | 'auto'; sync(); persist(); });
  root.querySelectorAll<HTMLButtonElement>('[data-practice-tier]').forEach(button => button.onclick = () => { setAdaptive(false); adaptiveLevels.clear(); state!.settings.practice.tier = Number(button.dataset.practiceTier) as PracticeTier; sync(); persist(); });
  root.querySelectorAll<HTMLButtonElement>('[data-practice-adaptive]').forEach(button => button.onclick = () => { setAdaptive(true); adaptiveLevels.clear(); sync(); });
}
let practiceChosenIn: string | null = null;
function beginHuntBattle(monster: number, id: string) {
  if (!state) return;
  const saved = state.settings.practice;
  // 대련장에서 골라 둔 다른 계산이 숲의 몬스터에게 몰래 따라오지 않게, 숲이 바뀐 것 같으면 그 숲의 계산(자동)으로 되돌리고 다시 물어요.
  if (saved.operation !== 'auto' && saved.operation !== state.forest && practiceChosenIn !== state.forest && !id.startsWith('expMonster')) { saved.operation = 'auto'; saved.skipPicker = false; persist(); }
  if (state.settings.practice.skipPicker) { startBattle(monster, false, id); return; }
  openModal(title('대련 준비', '무엇을 연습할까요?') + `${practicePickerHtml()}<label class="practice-skip"><input type="checkbox" id="practice-skip"> 다음부터는 묻지 않고 이 방식으로 바로 시작해요 <small>(설정에서 다시 바꿀 수 있어요)</small></label><button class="primary wide" id="practice-go">대련 시작하기 →</button>`);
  bindPracticePicker($('#modal-content'));
  $('#practice-go').onclick = () => { state!.settings.practice.skipPicker = $<HTMLInputElement>('#practice-skip').checked; practiceChosenIn = state!.forest; persist(); startBattle(monster, false, id); };
}
function openVillageBoard() { if (!state) return; if (state.hub) void openCurriculumUnit(state.hub); else openStageMap(state.forest); }
function openArena() {
  if (!state) return;
  openModal(title('신비의 대련장', '다섯 번의 작은 도전') + `<div class="arena-intro"><div class="arena-symbol">✦</div><p>몬스터 5마리와 차례로 수학 대련을 해요.<br>시간제한 없이, 천천히 생각해도 괜찮아요.</p>${practicePickerHtml()}<div class="stat-row"><div><small>나의 최고 점수</small><strong>${state.best}점</strong></div><div><small>지금 무기의 점수 배율</small><strong>×${(WEAPONS[state.weapon].multiplier + state.weapons[state.weapon] * .1).toFixed(1)}</strong></div></div><p class="note">도중에 쉬어도 이미 얻은 베리와 경험치는 그대로예요.</p><button class="primary wide" id="arena-start">대련 시작하기</button></div>`);
  bindPracticePicker($('#modal-content'));
  $('#arena-start').onclick = () => startBattle(Math.floor(Math.random() * MONSTERS.length), true, 'arena');
}
function openStageMap(forest?: ForestKind) {
  if (!state) return; const s = state;
  if (!forest) {
    const isForest = (unit: CurriculumUnitId) => OPERATIONS.includes(unit as Operation);
    const progress = (unit: CurriculumUnitId) => isForest(unit) ? `${journeyFor(s, unit as ForestKind).maps.slice(1).filter(m => m.cleared).length} / 10단계` : `${s.curriculum.units[unit].completedMissions.length} / 10단계`;
    const stampCount = (unit: CurriculumUnitId) => isForest(unit) ? journeyFor(s, unit as ForestKind).maps.slice(1).filter(m => m.cleared).length : s.curriculum.units[unit].completedMissions.length;
    const stampRow = (unit: CurriculumUnitId) => { const n = Math.min(10, stampCount(unit)); return `<i class="stamp-row" aria-hidden="true">${Array.from({ length: 10 }, (_, k) => `<u class="${k < n ? "on" : ""}"></u>`).join("")}</i>`; };
    const card = (region: CurriculumRegion) => {
      const complete = curriculumUnitComplete(s, region.id), focus = s.settings.focusUnit === region.id;
      const action = isForest(region.id) ? `data-forest="${region.id}"` : `data-curriculum-unit="${region.id}"`;
      return `<button class="forest-card curriculum-region ${region.className} ${complete ? 'complete' : ''} ${focus ? 'focus-unit' : ''}" ${action}><span>${region.icon}</span><strong>${region.name}</strong><small>${region.short}</small>${stampRow(region.id)}<b>${complete ? '✓ 단원 완료' : progress(region.id)}${focus ? ' · 오늘의 단원' : ''}</b></button>`;
    };
    const sets = curriculumRegionSets(s.grade), firstCards = sets.first.map(card).join(''), secondCards = sets.second.map(card).join('');
    const graduateReady = curriculumGraduationAvailable(s) || s.teacherMode;
    openModal(title('연태쌤의 수학 모험 지도', `${s.grade}학년 수학 · 1학기와 2학기`) + `<p class="shop-explainer">모든 지역은 10단계예요. 베리·레벨·장비는 함께 사용하고, 학습 기록은 지역별로 따로 저장돼요.</p><h3 class="semester-heading">🌱 ${s.grade}학년 1학기 모험</h3><div class="curriculum-overview">${firstCards}</div><h3 class="semester-heading">🍁 ${s.grade}학년 2학기 모험</h3><div class="curriculum-overview">${secondCards}</div>${graduateReady ? `<button id="graduation-start" class="primary wide graduation-entry">🎓 ${s.curriculum.graduationClaimed ? `${s.grade}학년 졸업 모험 다시 하기` : `${s.grade}학년 졸업 모험 시작하기`}</button>` : `<p class="graduation-lock">🔒 모든 수학 지역을 통과하면 ${s.grade}학년 졸업 모험이 열려요.</p>`}${s.grade >= 3 && expeditionUnlocked(s) ? '<button id="map-expedition" class="secondary wide">✦ 나눗셈 숲 별빛 재탐험과 칭호</button>' : ''}`);
    document.querySelectorAll<HTMLButtonElement>('[data-forest]').forEach(button => button.onclick = () => openStageMap(button.dataset.forest as ForestKind));
    document.querySelectorAll<HTMLButtonElement>('[data-curriculum-unit]').forEach(button => button.onclick = () => void openCurriculumUnit(button.dataset.curriculumUnit as NewCurriculumUnitId));
    const graduation = document.querySelector<HTMLButtonElement>('#graduation-start'); if (graduation) graduation.onclick = () => void startGraduationAdventure();
    const exp = document.querySelector<HTMLButtonElement>('#map-expedition'); if (exp) exp.onclick = openExpeditionBoard;
    return;
  }
  const journey = journeyFor(s, forest), info = FOREST_INFO[forest], region = curriculumRegions().find(item => item.id === forest);
  openModal(title(region?.name ?? info.title, '10개의 사냥터') + `<div class="map-nav"><button id="forest-back" class="text-button">← 수학 모험 지도로 돌아가기</button><button id="forest-village" class="secondary">🏡 ${VILLAGE_THEMES[forest].name} 가기</button></div><p class="shop-explainer">${region?.short ?? info.intro} 한 단계의 몬스터를 모두 만나면 다음 길이 열려요.</p><div class="stage-grid ${forest}-map">${STAGES.map((stage, i) => { const step = i + 1, progress = journey.maps[step], open = canEnter(s, step, forest), complete = progress.cleared; const range = operationStageLabel(s.grade, forest, step); return `<button class="stage-card ${complete ? 'cleared' : ''}" data-stage="${step}" ${open ? '' : 'disabled'}><span class="stage-number">${complete ? '✓' : step}</span><strong>${info.icon} ${stage.name}</strong><small>${range}</small><small>${open ? complete ? '통과 완료 · 다시 탐험' : `${progress.monsters.length} / ${stageMonsters(step).length} 친구와 만나기` : '앞 단계를 먼저 통과해요'}</small></button>`; }).join('')}</div>`);
  $('#forest-back').onclick = () => openStageMap();
  $('#forest-village').onclick = () => switchStage(0, forest);
  document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b => b.onclick = () => switchStage(Number(b.dataset.stage), forest));
}
function operationStageLabel(grade: SchoolGrade, operation: ForestKind, stage: number) {
  if (grade === 3) return FOREST_INFO[operation].stages(stage);
  if (grade === 1) return operation === 'addition' ? `합이 ${stage < 4 ? 10 : 20}까지인 덧셈` : `${stage < 4 ? 10 : 20}까지의 뺄셈`;
  if (grade === 2) return operation === 'multiplication' ? `${Math.min(9, Math.max(2, stage + 1))}단 중심 구구단` : `두 자리 수 ${OPERATION_INFO[operation].name} · ${stage < 5 ? '기초' : '받아올림·받아내림'}`;
  if (operation === 'division') return `${Math.min(50, 10 + stage * 4)} 이하의 두 자리 수로 나누기${stage >= 7 ? ' · 나머지' : ''}`;
  if (operation === 'multiplication') return stage < 5 ? '두 자리 수의 곱셈' : '두 자리 수 × 두 자리 수';
  return `${grade}학년 큰 수 ${OPERATION_INFO[operation].name} 연산 감각`;
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
  circle: '🌙 달빛 컴퍼스 장식', fraction: '🍰 조각케이크 쿠션', measurement: '⚖️ 물방울 저울', pictograph: '📊 별빛 그래프판',
};
function curriculumStars(stars: number) { return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`; }
async function openCurriculumUnit(unit: NewCurriculumUnitId) {
  if (!state) return;
  openModal(title('수학 지역을 준비하고 있어요', curriculumName(unit)) + '<p class="curriculum-loading">작은 교구와 문제를 꺼내는 중…</p>');
  const module = await loadCurriculum();
  if (!state) return;
  const progress = state.curriculum.units[unit], missions = gradeMissions(state.grade, unit) ?? module.CURRICULUM_MISSIONS[unit], region = curriculumRegions().find(item => item.id === unit)!;
  const cards = missions.map((mission, id) => {
    const unlocked = canStartCurriculumMission(state!, unit, id), complete = progress.completedMissions.includes(id), stars = progress.stars[id];
    const type = mission.kind === 'concept' ? '개념 체험' : mission.kind === 'practice' ? '연습 임무' : mission.kind === 'story' ? '이야기 임무' : '단원 수호자';
    return `<button class="stage-card curriculum-stage-card ${complete ? 'cleared' : ''}" data-mission="${id}" ${unlocked ? '' : 'disabled'}><span class="stage-number">${complete ? '✓' : unlocked ? id + 1 : '🔒'}</span><strong>${mission.name}</strong><small>${type} · ${mission.skill}</small><small>${mission.description}</small><b>${complete ? curriculumStars(stars) : unlocked ? '시작하기' : '앞 단계 먼저'}</b></button>`;
  }).join('');
  openModal(title(`${region.icon} ${state.grade}학년 수학 · 10단계 지도`, region.name) + `<div class="map-nav"><button id="curriculum-back" class="text-button">← ${state.grade}학년 수학 지도로 돌아가기</button><button id="curriculum-village" class="secondary">🏡 ${VILLAGE_THEMES[unit].name} 가기</button></div><div class="unit-progress"><span>${region.icon}</span><div><strong>${progress.completedMissions.length} / 10단계 완료</strong><small>앞 단계를 통과하면 다음 길이 열려요. 별은 도전 기록이에요.</small></div><b>${curriculumStars(progress.stars.reduce((sum, n) => sum + n, 0) ? Math.min(3, Math.round(progress.stars.reduce((sum, n) => sum + n, 0) / Math.max(1, progress.completedMissions.length))) : 0)}</b></div><div class="stage-grid curriculum-stage-map">${cards}</div>${progress.rewardClaimed ? `<p class="unit-gift">🎁 지역 완주 선물: ${CURRICULUM_GIFTS[unit]}을 내 방에서 사용할 수 있어요.</p>` : ''}`, `curriculum-modal ${unit}-region`);
  $('#curriculum-back').onclick = () => openStageMap();
  $('#curriculum-village').onclick = () => switchStage(0, state!.forest, unit);
  document.querySelectorAll<HTMLButtonElement>('[data-mission]').forEach(button => button.onclick = () => void startCurriculumMission(unit, Number(button.dataset.mission)));
}

function curriculumQuestionVisual(question: CurriculumQuestion) { return curriculumVisualHtml(question.visual); }

const GUARDIAN_BLUEPRINTS: Record<NewCurriculumUnitId, number[]> = {
  plane: [0, 1, 2, 3, 5, 7], lengthTime: [0, 1, 2, 4, 5, 7], fractionDecimal: [0, 1, 2, 4, 6, 7],
  circle: [0, 1, 3, 4, 5, 7], fraction: [0, 2, 3, 4, 5, 7], measurement: [0, 1, 3, 4, 5, 7], pictograph: [0, 1, 2, 4, 5, 7],
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
      : module.generateReviewQuestion(unit), run.seenQuestions);
  }
  if (run.review) return freshCurriculumQuestion(() => module.generateReviewQuestion(run.unit), run.seenQuestions);
  const unit = run.unit as NewCurriculumUnitId;
  if (run.mission === 9) return freshCurriculumQuestion(() => guardianQuestion(module, unit, run.index), run.seenQuestions);
  const position = order.indexOf(unit), completedEarlier = state ? order.slice(0, position).filter(previous => curriculumUnitComplete(state!, previous)) : [];
  if (state?.settings.spiralReview && run.mission >= 3 && completedEarlier.length && Math.random() < .2) {
    const previous = completedEarlier[Math.floor(Math.random() * completedEarlier.length)];
    return freshCurriculumQuestion(() => state!.grade !== 3 && NEW_CURRICULUM_UNITS.includes(previous as NewCurriculumUnitId)
      ? generateGradeQuestion(state!.grade as Exclude<SchoolGrade, 3>, previous as NewCurriculumUnitId, Math.min(8, run.mission))
      : module.generateReviewQuestion(previous), run.seenQuestions);
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
    : module.generateReviewQuestion(firstUnit);
  const run = { unit: 'addition' as CurriculumUnitId, mission: 0, question, index: 0, total: 11, wrong: 0, hints: 0, hintLevel: 0, seenQuestions: new Set([curriculumQuestionKey(question)]), graduation: true } satisfies NonNullable<typeof curriculumRun>;
  curriculumRun = run; renderCurriculumQuestion();
}

async function startCurriculumReview(unit: CurriculumUnitId, shadow?: CurriculumMistake) {
  if (!state) return;
  const module = await loadCurriculum(), mistake = shadow ?? state.curriculum.wrongSkills.find(item => item.unit === unit), mission = mistake?.mission ?? 0;
  const question = NEW_CURRICULUM_UNITS.includes(unit as NewCurriculumUnitId) ? curriculumQuestionFor(module, unit as NewCurriculumUnitId, Math.min(8, mission)) : module.generateReviewQuestion(unit);
  const run = { unit, mission, question, index: 0, total: 1, wrong: 0, hints: 0, hintLevel: 0, seenQuestions: new Set([curriculumQuestionKey(question)]), review: true, shadow } satisfies NonNullable<typeof curriculumRun>;
  curriculumRun = run; renderCurriculumQuestion();
}

function renderCurriculumQuestion() {
  if (!curriculumRun || !state) return;
  const run = curriculumRun, q = run.question, region = curriculumRegions().find(item => item.id === q.unit)!, missionName = run.graduation ? `${state.grade}학년 졸업 모험` : run.review ? '다시 연습하기' : curriculumName(run.unit);
  const answers = q.kind === 'choice'
    ? `<div class="curriculum-answers">${q.choices!.map(choice => `<button data-curriculum-answer="${escape(choice.value)}">${mathTextHtml(choice.label)}</button>`).join('')}</div>`
    : `<div class="curriculum-number"><input id="curriculum-answer" inputmode="numeric" maxlength="4" readonly aria-label="답"><div class="number-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '지우기', 0, '확인'].map(n => `<button data-curriculum-number="${n}" class="${n === '확인' ? 'primary' : ''}">${n}</button>`).join('')}</div></div>`;
  const activity = curriculumActivityHtml(q);
  openModal(title(`${region.icon} ${missionName} · ${run.index + 1}/${run.total}`, titleLeaksAnswer(q) ? NEUTRAL_TITLE : q.skill) + `<div class="curriculum-question-card"><div class="curriculum-step"><span>${run.index + 1}</span>${Array.from({ length: run.total }, (_, id) => `<i class="${id < run.index ? 'done' : id === run.index ? 'now' : ''}"></i>`).join('')}</div>${activity || curriculumQuestionVisual(q)}${q.detail ? `<p class="question-detail">${mathTextHtml(q.detail)}</p>` : ''}<h3>${mathTextHtml(q.prompt)}</h3>${answers}<p id="curriculum-message" class="answer-message" role="status">${activity ? '활동판을 직접 움직여 답을 만들어 보세요. 틀려도 잃는 것은 없어요.' : '천천히 보고 답을 골라요. 틀려도 잃는 것은 없어요.'}</p><div id="curriculum-hint" class="curriculum-hint" hidden></div>${speechSupported() ? '<button id="curriculum-read" class="text-button wide" aria-label="문제 읽어주기">🔊 문제 읽어주기</button>' : ''}<button id="curriculum-hint-button" class="text-button wide">💡 단계별 힌트 보기</button><button class="text-button wide" data-close>잠깐 쉬기</button><div id="curriculum-result" hidden></div></div>`, 'curriculum-play-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-answer]').forEach(button => button.onclick = () => submitCurriculumAnswer(button.dataset.curriculumAnswer!));
  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-number]').forEach(button => button.onclick = () => enterCurriculumNumber(button.dataset.curriculumNumber!));
  setupCurriculumActivity();
  $('#curriculum-hint-button').onclick = showCurriculumHint;
  const readText = () => [q.prompt, q.detail, q.kind === 'choice' ? `보기. ${q.choices!.map(choice => choice.label).join('. ')}` : ''].filter(Boolean).join('. ');
  const readButton = document.querySelector<HTMLButtonElement>('#curriculum-read');
  if (readButton) readButton.onclick = () => { readButton.textContent = '🔊 읽는 중…'; if (!speak(readText(), () => { readButton.textContent = '🔊 문제 읽어주기'; })) readButton.textContent = '🔊 문제 읽어주기'; };
  if (readButton && autoReadEnabled()) readButton.click();
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
  const module = await loadCurriculum(), run = curriculumRun, q = run.question;
  if (!module.answerCurriculumQuestion(q, value)) {
    if (!run.missedCurrent) {
      run.missedCurrent = true; run.wrong++; sessionWrong++; state.learning.wrong++;
      recordCurriculumAttempt(state, q.unit, false, run.mission, q.skill);
    }
    $('#curriculum-message').innerHTML = mathTextHtml(module.curriculumWrongFeedback(q, value));
    document.querySelectorAll<HTMLButtonElement>('[data-curriculum-answer]').forEach(button => { if (button.dataset.curriculumAnswer === value) button.classList.add('wrong'); });
    audio.play('wrong'); persist(); return;
  }
  sessionCorrect++;
  if (!run.missedCurrent) { state.learning.correct++; recordCurriculumAttempt(state, q.unit, true, run.mission, q.skill); if (!run.review) addBossDamage(localStorage); }
  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-answer],[data-curriculum-number],[data-pizza-slice],[data-pizza-submit],[data-circle-adjust],[data-circle-submit]').forEach(button => { button.disabled = true; if (button.dataset.curriculumAnswer === value) button.classList.add('correct'); });
  const input = document.querySelector<HTMLInputElement>('#curriculum-answer'); if (input) input.disabled = true;
  $('#curriculum-hint-button').hidden = true; $('#curriculum-message').textContent = '정답이에요! 정말 잘 풀었어요.';
  const result = $('#curriculum-result'); result.hidden = false;
  result.innerHTML = `<div class="curriculum-explanation"><strong>🌟 이렇게 생각해요</strong><p>${mathTextHtml(q.explanation)}</p></div><button id="curriculum-next" class="primary wide">${run.index + 1 < run.total ? '다음 문제 →' : run.review ? '복습 마치기' : run.graduation ? '졸업 모험 마치기 🎓' : '임무 완료하기 ✨'}</button>`;
  if (run.review) state.curriculum.wrongSkills = state.curriculum.wrongSkills.filter(item => !(item.unit === q.unit && item.skill === q.skill));
  if (run.review && !run.shadow) syncShadows();
  if (run.shadow) {
    const defeated = run.shadow, waiting = shadowList.some(item => item.unit === defeated.unit && item.skill === defeated.skill);
    state.curriculum.wrongSkills = state.curriculum.wrongSkills.filter(item => !(item.unit === defeated.unit && item.skill === defeated.skill));
    syncShadows();
    if (waiting) { state.berries += SHADOW_REWARD; refresh(); toast(`🌟 그림자 몬스터를 물리쳤어요! 🍓 +${SHADOW_REWARD}`); }
  }
  audio.play('correct'); persist(); $('#curriculum-next').onclick = finishCurriculumQuestion;
}

async function finishCurriculumQuestion() {
  if (!curriculumRun || !state) return;
  if (sessionExpired) { curriculumRun = null; showSessionSummary(); return; }
  const run = curriculumRun, module = await loadCurriculum();
  if (run.index + 1 < run.total) {
    run.index++; run.hintLevel = 0; run.missedCurrent = false; run.question = nextCurriculumQuestion(module, run); renderCurriculumQuestion(); return;
  }
  curriculumRun = null;
  if (run.review) {
    openModal(title('다시 해낸 용기', '복습을 마쳤어요!') + '<div class="arena-intro"><div class="arena-symbol">🌟</div><p>같은 종류의 문제를 다시 풀어냈어요.<br>틀린 문제는 실력을 키우는 보물 지도예요.</p><button class="primary wide" id="review-return">학습 기록으로 돌아가기</button></div>');
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
  openModal(title(`${curriculumStars(stars)} 임무 완료`, curriculumName(run.unit)) + `<div class="arena-intro"><div class="arena-symbol">${curriculumRegions().find(item => item.id === run.unit)!.icon}</div><p>문제 ${run.total}개를 끝까지 풀었어요.<br>${complete.berries ? `첫 통과 보상으로 🍓 ${complete.berries}베리를 받았어요.` : '전에 통과한 임무라 베리 보상은 다시 받지 않아요.'}</p>${gift ? `<p class="unit-gift">🎁 단원 완주! ${gift}을 내 방에서 사용할 수 있어요.</p>` : ''}<button class="primary wide" id="mission-return">다음 임무 보기 →</button></div>`);
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
  if (!state || !expeditionUnlocked(state)) return;
  const s = state, mission = s.expedition.active, next = expeditionLayout(s.expedition.completed);
  const localRanks = parseLocalRanks(localStorage.getItem(RANKING_STORAGE)), ranking = localRanks.length ? `<ol class="local-ranking">${localRanks.map((rank, id) => `<li class="${rank.nickname === s.nickname ? 'mine' : ''}"><b>${id + 1}</b><span>${escape(rank.nickname)}</span><strong>✦ ${rank.completed}회</strong></li>`).join('')}</ol>` : '<p class="note">첫 원정을 완수하면 이곳에 기록돼요.</p>';
  const rewardStage = mission?.stage ?? next.stage;
  openModal(title('연태쌤의 별빛 게시판', '별빛 재탐험') + `<p>10개의 숲을 새로운 목표로 다시 걸어요. 언제든 다시 도전할 수 있고, 틀려도 손해가 없어요.</p><p class="expedition-note">이번 원정: <b>${mission ? `${mission.stage}단계 · ${STAGES[mission.stage - 1].name}` : `${next.stage}단계 · ${STAGES[next.stage - 1].name}`}</b><br>별빛 표식 3개 · 몬스터 대련 2번 · 출구의 이야기 문제 1개<br><small>완주하면 🍓 ${expeditionBerryReward(rewardStage)}베리! 예전에 받은 사냥터 보상은 다시 받지 않아요.</small></p>${mission ? `<p>지금까지 표식 ${mission.stars.length}/3 · 대련 ${mission.monsters.length}/2</p>` : ''}<button id="expedition-start" class="primary wide">${mission ? '진행 중인 원정 이어가기' : '새 원정 떠나기'} →</button><h3 class="title-heading">🏅 나의 칭호 · 원정 ${s.expedition.completed}번 완수</h3><div class="title-list">${EXPEDITION_TITLES.map((item, id) => `<button data-title="${id}" class="secondary ${s.expedition.selectedTitle === id ? 'selected' : ''}" ${s.expedition.completed < item.need ? 'disabled' : ''}>${s.expedition.completed < item.need ? '🔒' : '✦'} ${item.name}<small>${item.need}번 완수${s.expedition.selectedTitle === id ? ' · 표시 중' : ''}</small></button>`).join('')}</div><h3 class="title-heading">🏆 별빛 재탐험 랭킹</h3><div class="ranking-tabs" role="tablist"><button class="active" data-rank-tab="global" role="tab" aria-selected="true">🌍 전체 랭킹</button><button data-rank-tab="local" role="tab" aria-selected="false">📱 이 기기</button></div><section id="global-ranking-panel" role="tabpanel"><p class="ranking-loading">✨ 전체 탐험가 기록을 불러오는 중…</p></section><section id="local-ranking-panel" role="tabpanel" hidden><p class="ranking-note">같은 브라우저에서 플레이한 닉네임별 최고 기록이에요.</p>${ranking}</section><p class="ranking-note">전체 랭킹에는 닉네임과 별빛 재탐험 완료 횟수만 올라가요. 선생님 모드 기록은 제외돼요.</p>`);
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
  state.forest = 'division';
  const resumeHere = !!state.expedition.active && state.expedition.active.stage === state.journey.stage && !world.inRoom;
  if (!startExpedition(state)) return;
  world.loadStage(state, !resumeHere); closeModal(); refresh(); persist(); toast('✦ 별빛 원정이 시작됐어요! 표식을 찾아보세요.');
}
function switchStage(stage: number, forest: ForestKind = state?.forest ?? 'division', hub?: NewCurriculumUnitId) {
  if (!state || !canEnter(state, stage, forest)) return; state.forest = forest; state.hub = stage === 0 ? hub : undefined; journeyFor(state).stage = stage; state.position = stage === 0 ? { x: 0, z: 8 } : { x: 0, z: 26 }; world.loadStage(state, true); closeModal(); refresh(); persist(); toast(stage ? `${FOREST_INFO[forest].name} ${stage}단계 · ${STAGES[stage - 1].name}에 도착했어요!` : `${VILLAGE_THEMES[villageThemeId(state)].name}에 도착했어요.`);
}
function openNextGate() {
  if (!state) return; const journey = journeyFor(state), stage = journey.stage, map = journey.maps[stage], total = stageMonsters(stage).length;
  if (state.forest === 'division' && state.expedition.active?.stage === stage) { if (!canFinishExpedition(state)) { const active = state.expedition.active; toast(`표식 ${3 - active.stars.length}개와 대련 ${2 - active.monsters.length}번을 더 마쳐요.`); return; } startExpeditionGate(); return; }
  if (!map.cleared) { toast(`사냥터 친구 ${total - map.monsters.length}명을 더 만나야 해요.`); return; }
  if (stage === 10 && state.forest === 'multiplication') { if (state.multiplicationCompleted) { openModal(title('해바라기 편지', '곱셈의 숲을 모두 밝혔어요!') + '<div class="arena-intro"><div class="arena-symbol">🌻</div><p>이미 곱셈숲 탐험가 칭호와 구구단 해바라기 화분을 받았어요.<br>방 꾸미기에서 화분을 눌러 놓아 보세요!</p><button class="primary wide" data-close>숲에서 더 놀기</button></div>'); } else startMultiplicationGate(); return; }
  if (stage === 10 && (state.forest === 'addition' || state.forest === 'subtraction')) { const info = FOREST_INFO[state.forest]; openModal(title('연태쌤의 축하', `${info.name}을 모두 통과했어요!`) + `<div class="arena-intro"><div class="arena-symbol">${info.icon}</div><p>${state.grade}학년 ${info.op} 모험 10단계를 차근차근 익혔어요.<br>정말 대단해요! 더 연습하고 싶으면 대련에서 난이도를 골라 보세요.</p><button class="primary wide" data-close>숲에서 더 놀기</button></div>`); return; }
  if (stage === 10) { openModal(title('연태쌤의 축하', '열 개의 사냥터를 모두 통과했어요!') + `<div class="arena-intro"><div class="arena-symbol">🌈</div><p>베리숲의 모든 길을 걸으며 나눗셈 친구들을 만났어요.<br>대단해요! 다음 업데이트도 기대해 주세요.<br>이제 별빛 재탐험도 시작할 수 있어요!</p><button id="celebrate-expedition" class="primary wide">✦ 별빛 재탐험 시작하기</button><button class="secondary wide" data-close>숲에서 더 놀기</button></div>`); $('#celebrate-expedition').onclick = openExpeditionBoard; return; }
  switchStage(stage + 1, state.forest);
}
function startBattle(monster: number, arena: boolean, id: string) {
  if (!state) return; const choice = state.settings.practice, practice = choice.operation === 'auto' || id.startsWith('expMonster') ? undefined : { operation: choice.operation, tier: choice.tier }, journey = arena ? state.journey : journeyFor(state), operation: Operation = arena ? 'division' : state.forest, cleared = journey.maps.slice(1).filter(map => map.cleared).length, difficultyStage = arena ? Math.min(10, cleared + 1) : journey.stage; const huntId = id.startsWith('monster') ? Number(id.slice(7)) : -1; battle = { encounter: new Encounter(monster, arena, state.level, undefined, difficultyStage, state.settings.maxDividend, operation, state.settings.multiplicationRange, practiceFor(practice), state.grade), id, practice, kind: id.startsWith('expMonster') ? 'expMonster' : 'normal', round: 1, goalRounds: monsterBattleRounds(monster, arena), score: 0, result: null, story: multiplicationUsesStory(huntId) }; renderBattle();
}
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
  if (!battle || !state) return; const b = battle, e = b.encounter, m = MONSTERS[e.monster], q = e.question, reward = rewardFor(state, e.monster, e.arena), op = q.operation ?? 'division', info = OPERATION_INFO[op], multiplication = op === 'multiplication', symbol = info.symbol, operationName = info.name;
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
  openModal(title(e.arena ? `신비의 대련장 · ${b.round} / 5` : b.kind === 'multiplicationGate' ? '구구단 햇살문' : challenge ? `연속 수학 대련 · ${b.round} / ${b.goalRounds}` : `숲속 친구와 ${operationName}`, m.name) + `<div class="battle-top"><span>${info.icon} ${e.arena ? `이번 도전 ${b.score}점` : challenge ? `${b.goalRounds}문제를 모두 풀면 통과해요` : `${e.stage ? `${e.stage}단계 난이도` : '마을 연습 문제'} · 천천히 생각해요`}</span><span>🍓 ${reward.berries} · 경험치 ${reward.xp}</span></div><div class="monster-portrait ${multiplication ? 'multiplication-portrait' : ''}" id="monster-portrait" style="--monster-color:#${m.color.toString(16).padStart(6, '0')}"><span class="battle-spark one">✦</span><span class="battle-spark two">✦</span><div class="monster-icon" aria-hidden="true">${b.kind === 'multiplicationGate' ? '🌻' : m.icon}</div><div class="monster-speech"><strong>${b.kind === 'multiplicationGate' ? '햇살문의 안내자' : m.name}</strong><span>${challenge ? `문제 ${b.round}/${b.goalRounds} · 끝까지 같이 풀어 봐!` : `${operationName}으로 힘을 보여 줘!`}</span></div></div>${linked}${story}${questionMarkup}<p class="answer-message" id="answer-message" role="status">${q.remainder ? '몫과 나머지를 차례로 적어 볼까요?' : info.ask}</p><div id="hint" hidden></div><div class="number-pad" aria-label="숫자판">${(dp ? [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '지우기'] : [1, 2, 3, 4, 5, 6, 7, 8, 9, '지우기', 0, '확인']).map(n => `<button data-number="${n}" class="${n === '확인' ? 'primary' : ''}" ${n === '.' ? 'aria-label="소수점"' : ''}>${n}</button>`).join('')}${dp ? '<button data-number="확인" class="primary" style="grid-column:1/-1">확인</button>' : ''}</div><div class="battle-footer"><button id="show-hint" class="text-button">💡 힌트 보기</button><button class="text-button" data-close>잠깐 쉬기</button></div><div id="battle-result" hidden></div>`, 'battle-modal');
  if (b.kind === 'multiplicationGate') {
    $('.modal-heading .eyebrow').textContent = `곱셈의 숲 마지막 문 · ${b.round}/2`;
    $('.modal-heading h2').textContent = b.round === 1 ? '곱셈으로 햇살을 밝혀요' : '나눗셈으로 짝을 찾아요';
    $('.battle-top').innerHTML = '<span>🌻 두 식은 서로 이어져 있어요</span><span>틀려도 다시 풀 수 있어요</span>';
  } else if (b.kind !== 'normal') {
    $('.modal-heading .eyebrow').textContent = b.kind === 'expGate' ? '별빛 원정 출구' : '별빛 원정 대련';
    $('.modal-heading h2').textContent = b.kind === 'expGate' ? '마지막 이야기 문제' : m.name;
    $('.battle-top').innerHTML = b.kind === 'expGate' ? `<span>✦ 천천히 풀어도 괜찮아요</span><span>완수 보상 🍓 ${expeditionBerryReward(state.expedition.active?.stage ?? 1)}베리</span>` : '<span>✦ 천천히 풀어도 괜찮아요</span><span>원정 대련 표식을 채워요</span>';
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
  $('#show-hint').onclick = showHint; $('#answer').focus();
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
function showHint() {
  if (!battle) return; const q = battle.encounter.question;
  $('#hint').hidden = false;
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
  if (outcome === 'wrong') { if (!b.missedCurrent) { b.missedCurrent = true; recordAdaptive(false); recordWrongAnswer(state, b.encounter.question); recordCurriculumAttempt(state, b.encounter.question.operation ?? 'division', false); sessionWrong++; } audio.play('wrong'); persist(); $('#answer-message').textContent = '괜찮아요! 묶음을 살펴보고 다시 풀어 볼까요?'; input.value = ''; if (remainderInput) remainderInput.value = ''; showHint(); return; }
  sessionCorrect++; recordCorrectAnswer(state, b.encounter.monster, !b.missedCurrent); if (!b.missedCurrent) { recordCurriculumAttempt(state, b.encounter.question.operation ?? 'division', true); addBossDamage(localStorage); recordAdaptive(true); } state.discoveries.outfits.includes(state.outfit) || state.discoveries.outfits.push(state.outfit); if (state.pet >= 0 && !state.discoveries.pets.includes(state.pet)) state.discoveries.pets.push(state.pet);
  if (!b.encounter.arena && !['multiplicationGate', 'expGate'].includes(b.kind) && b.round < (b.goalRounds ?? 1)) {
    audio.play('correct'); world.celebrate(); persist();
    $('#answer-message').textContent = '정답이에요! 다음 문제도 함께 풀어요.'; $('#monster-portrait').classList.add('defeated'); $('.number-pad').hidden = true; $('.battle-footer').hidden = true; $('#hint').hidden = true; $('#battle-result').hidden = false;
    $('#battle-result').innerHTML = `<div class="reward-banner"><strong>✨ ${b.round}번째 문제 성공!</strong><p>${MONSTERS[b.encounter.monster].name} 친구와 ${b.goalRounds! - b.round}문제를 더 풀면 보상을 받아요.</p><p>중간 문제에서는 베리가 먼저 나가지 않아 중복 보상이 생기지 않아요.</p></div><button class="primary wide" id="next-battle">다음 문제 풀기 →</button>`;
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
  } else b.result = b.encounter.arena ? grantReward(state, b.encounter.monster, true) : finishHunt(state, Number(b.id.slice(7)));
  if (!b.result) return;
  b.score += b.result.score;
  if (b.encounter.arena) state.best = Math.max(state.best, b.score); else if (b.kind === 'normal' || b.kind === 'expMonster') world.defeat(b.id);
  audio.play(b.result.levels ? 'level' : 'correct'); world.celebrate(); persist(); refresh();
  $('#answer-message').textContent = '정답이에요! 정말 잘했어요!'; $('#monster-portrait').classList.add('defeated');
  $('.number-pad').hidden = true; $('.battle-footer').hidden = true; $('#hint').hidden = true;
  $('#battle-result').hidden = false;
  const clearReward = (b.result as ReturnType<typeof grantReward> & { clearReward?: number }).clearReward ?? 0, completionReward = (b.result as ReturnType<typeof grantReward> & { completionReward?: number }).completionReward ?? 0;
  if (b.kind === 'multiplicationGate') {
    $('#battle-result').innerHTML = `<div class="reward-banner multiplication-reward"><strong>🌻 곱셈의 숲 완전 정복!</strong><p>「곱셈숲 탐험가」 칭호를 얻었어요.</p><p>나의 방에 놓을 수 있는 <b>구구단 해바라기 화분</b>도 받았어요!</p><p>두 식이 서로 도와주는 곱셈과 나눗셈의 짝을 찾아냈어요.</p></div><button class="primary wide" id="next-battle">마을로 돌아가기 →</button>`;
    $('#next-battle').onclick = nextBattle; $('#next-battle').focus(); return;
  }
  if (b.kind !== 'normal') {
    $('#battle-result').innerHTML = `<div class="reward-banner"><strong>${b.kind === 'expGate' ? '🌟 별빛 원정 완수!' : '✦ 별빛 대련 성공!'}</strong><p>${b.kind === 'expGate' ? `🍓 완주 보상 +${b.result.berries}베리! 원정 ${state.expedition.completed}번을 완료했어요. ${b.newTitle && b.newTitle > 0 ? `새 칭호 「${EXPEDITION_TITLES[b.newTitle].name}」도 얻었어요!` : '다음 원정도 바로 떠날 수 있어요.'}` : `대련 ${state.expedition.active?.monsters.length ?? 2} / 2 · 출구까지 가 볼까요?`}</p><p>${b.kind === 'expGate' ? '별빛 원정의 새 완주 보상만 받아요. 예전에 받은 사냥터 보상은 다시 받지 않아요.' : '출구 문제까지 풀면 원정 완주 베리를 받아요.'}</p></div><button class="primary wide" id="next-battle">${b.kind === 'expGate' ? '다음 원정 고르기 →' : '숲으로 돌아가기'}</button>`;
    $('#next-battle').onclick = nextBattle; $('#next-battle').focus(); return;
  }
  $('#battle-result').innerHTML = `<div class="reward-banner"><strong>${OPERATION_INFO[b.encounter.question.operation ?? 'division'].icon} 멋진 ${OPERATION_INFO[b.encounter.question.operation ?? 'division'].name}!</strong><p>🍓 +${b.result.berries}베리 · 경험치 +${b.result.xp}${b.encounter.arena ? ` · +${b.result.score}점` : ''}</p>${!b.encounter.arena && clearReward ? `<p class="level-up">사냥터 통과! 추가 +${clearReward}베리와 다음 길을 받았어요.</p>` : ''}${completionReward ? `<p class="level-up">🎉 ${FOREST_INFO[state.forest].name} 완주 선물 +${completionReward}베리!</p>` : ''}${b.result.levels ? `<p class="level-up">레벨 ${state.level}! 선물 ${b.result.levels * 20}베리도 받았어요.</p>` : ''}${b.result.milestones.map(gift => `<p class="level-easter-egg">🎁 비밀 선물 발견! 레벨 ${gift.level} 달성 · ${gift.berries.toLocaleString()}베리를 받았어요!</p>`).join('')}</div><button class="primary wide" id="next-battle">${b.encounter.arena ? b.round < 5 ? '다음 친구 만나기 →' : '대련 결과 보기' : '숲으로 돌아가기'}</button>`;
  $('#next-battle').onclick = nextBattle; $('#next-battle').focus();
}
function nextBattle() {
  if (!battle || !state || !battle.encounter.solved) return;
  if (sessionExpired) { battle = null; showSessionSummary(); return; }
  if (battle.kind === 'multiplicationGate') { battle = null; switchStage(0, 'multiplication'); openModal(title('해바라기 편지', '곱셈의 숲을 모두 밝혔어요!') + '<div class="arena-intro"><div class="arena-symbol">🌻</div><p>곱셈숲 탐험가가 된 것을 축하해요!<br>새 해바라기 화분은 나의 방에서 눌러 설치할 수 있어요.</p><button class="primary wide" data-close>마을에서 계속 놀기</button></div>'); return; }
  if (battle.kind === 'expGate') { battle = null; switchStage(0); openExpeditionBoard(); return; }
  if (!battle.encounter.arena) { battle = null; closeModal(); return; }
  if (battle.round === 5) { const score = battle.score; battle = null; openModal(title('오늘도 한 뼘 자랐어요', '대련을 마쳤어요!') + `<div class="arena-intro"><div class="arena-symbol">🏆</div><h3>${score}점</h3><p>다섯 친구와의 수학 대련 성공!<br>나의 최고 기록은 ${state.best}점이에요.</p><button class="primary wide" data-close>마을로 돌아가기</button></div>`); return; }
  const previous = battle.encounter.question, difficultyStage = battle.encounter.stage; battle.round++; battle.encounter = new Encounter(Math.floor(Math.random() * MONSTERS.length), true, state.level, previous, difficultyStage, state.settings.maxDividend, 'division', state.settings.multiplicationRange, practiceFor(battle.practice), state.grade); battle.result = null; battle.missedCurrent = false; battle.story = battle.round % 3 === 0; renderBattle();
}
function continueFriendBattle() {
  if (!battle || !state || !battle.encounter.solved || battle.round >= (battle.goalRounds ?? 1)) return;
  const previous = battle.encounter.question, operation = previous.operation ?? 'division'; battle.round++;
  battle.encounter = new Encounter(battle.encounter.monster, false, state.level, previous, battle.encounter.stage, state.settings.maxDividend, operation, state.settings.multiplicationRange, practiceFor(battle.practice), state.grade); battle.result = null; battle.missedCurrent = false; renderBattle();
}
function exitBattle() { if (battle?.encounter.arena) toast(`대련 ${battle.score}점 · 받은 보상은 저장했어요.`); battle = null; persist(); if (sessionExpired) { showSessionSummary(); return; } closeModal(); }

function openShop(kind: 'weapon' | 'outfit', selectedId?: number) {
  if (!state) return;
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
  openModal(title(kind === 'weapon' ? '강지후의 무기 상점' : '오지후의 의상 상점', kind === 'weapon' ? `반짝이는 무기 ${WEAPONS.length}종` : `입혀 보고 고르는 의상 ${OUTFITS.length}벌`) + `<p class="shop-explainer">${kind === 'weapon' ? '무기는 몬스터 보상, 대련장 점수, 나무를 베는 횟수를 바꿔요.' : '옷을 누르면 내 캐릭터에게 입힌 3D 모습을 먼저 볼 수 있어요. 효과는 아래 색깔표에서 확인해요.'} <b>🍓 ${s.berries.toLocaleString()}베리</b></p><div class="shop-layout"><div class="item-grid">${cards}</div><div class="item-detail ${kind}-detail"><div id="shop-avatar" class="preview-stage" style="--item-color:${itemColor(item.color)}"></div><span class="preview-tag">360° 천천히 보기</span><h3>${item.name}${level !== undefined ? ` <small class="level-mark">+${level}</small>` : ''}</h3>${effect}<button class="primary wide" id="buy-item" ${wearing ? 'disabled' : ''}>${wearing ? (kind === 'weapon' ? '지금 들고 있어요' : '지금 입고 있어요') : level !== undefined ? (kind === 'weapon' ? '이 무기 들기' : '이 옷 입기') : `${item.price.toLocaleString()}베리로 구매하고 ${kind === 'weapon' ? '들기' : '입기'}`}</button>${level !== undefined ? `<button class="secondary wide" id="upgrade-item" ${level >= maxLevel ? 'disabled' : ''}>${level >= maxLevel ? '최고 꾸밈 단계예요 ✦' : `꾸밈 강화 ${level + 1}단계 · ${upgradeCosts[level].toLocaleString()}베리`}</button><small class="upgrade-note">${kind === 'weapon' ? '강화할 때마다 대련장 점수 배율이 0.1 늘고, 나무 힘이 1 늘어요.' : '강화하면 자수와 반짝이는 장식이 더해져요. 베리·경험치 효과는 그대로예요.'}</small>` : ''}<p class="error" id="shop-error" role="alert"></p></div></div>`, `shop-modal ${kind}-shop`);
  preview = new AvatarPreviewRuntime($('#shop-avatar')); preview.show(s.character, kind === 'outfit' ? id : s.outfit, kind === 'weapon' ? id : s.weapon, kind === 'outfit' ? level ?? 0 : s.outfits[s.outfit], kind === 'weapon' ? level ?? 0 : s.weapons[s.weapon]);
  document.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b => b.onclick = () => openShop(kind, Number(b.dataset.item)));
  $('#buy-item').onclick = () => shopAction(() => buy(s, kind, id), kind, id);
  if ($('#upgrade-item')) $('#upgrade-item').onclick = () => shopAction(() => upgrade(s, kind, id), kind, id);
}
function shopAction(action: () => string, kind: 'weapon' | 'outfit', id: number) { try { const msg = action(); if (kind === 'outfit' && !state!.discoveries.outfits.includes(id)) state!.discoveries.outfits.push(id); audio.play('buy'); syncAvatar(); refresh(); persist(); openShop(kind, id); toast(msg); } catch (e) { $('#shop-error').textContent = (e as Error).message; } }

function openInventory(tab: 'weapon' | 'outfit' | 'ride' | 'pet' = 'weapon', selectedId?: number) {
  if (!state) return;
  const s = state;
  const tabs = `<div class="inventory-tabs"><button data-inventory-tab="weapon" class="${tab === 'weapon' ? 'active' : ''}">⚔ 무기</button><button data-inventory-tab="outfit" class="${tab === 'outfit' ? 'active' : ''}">👗 옷</button><button data-inventory-tab="ride" class="${tab === 'ride' ? 'active' : ''}" aria-label="라이딩">🪽 탈것</button><button data-inventory-tab="pet" class="${tab === 'pet' ? 'active' : ''}">🐾 펫</button></div>`;
  const summary = `<p class="inventory-summary"><span>무기 ${Object.keys(s.weapons).length} · 옷 ${Object.keys(s.outfits).length} · 라이딩 ${Object.keys(s.rides).length} · 펫 ${Object.keys(s.pets).length}</span><b>🍓 ${s.berries.toLocaleString()}베리</b></p>`;
  if (tab === 'weapon') {
    const cards = Object.keys(s.weapons).map(Number).map(id => { const item = WEAPONS[id]; return `<article class="inventory-item ${s.weapon === id ? 'equipped' : ''}"><span class="inventory-icon" style="--item-color:${itemColor(item.color)}">${item.icon}</span><div><strong>${item.name} +${s.weapons[id]}</strong><small>몬스터마다 베리 +${item.bonus} · 대련장 점수 ${(item.multiplier + s.weapons[id] * .1).toFixed(1)}배 · 나무를 약 ${Math.ceil(7 / (item.treePower + s.weapons[id]))}번 때리면 성공</small></div><button class="${s.weapon === id ? 'equipped-button' : 'secondary'}" data-equip="weapon" data-id="${id}" ${s.weapon === id ? 'disabled' : ''}>${s.weapon === id ? '장착 중' : '장착'}</button></article>`; }).join('');
    openModal(title('나의 인벤토리', '내가 모은 무기') + `${tabs}${summary}<div class="inventory-list">${cards}</div>`, 'inventory-modal');
    document.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(button => button.onclick = () => { s.weapon = Number(button.dataset.id); audio.play('buy'); syncAvatar(); refresh(); persist(); openInventory('weapon'); toast('새 무기를 장착했어요!'); });
  } else {
    const ownedIds = tab === 'outfit' ? Object.keys(s.outfits).map(Number) : tab === 'pet' ? Object.keys(s.pets).map(Number) : RIDES.map((_, id) => id).sort((a, b) => RIDES[a].price - RIDES[b].price);
    const current = tab === 'outfit' ? s.outfit : tab === 'ride' ? s.ride : s.pet;
    const id = selectedId !== undefined && ownedIds.includes(selectedId) ? selectedId : current >= 0 && ownedIds.includes(current) ? current : ownedIds[0] ?? -1;
    if (id < 0) {
      openModal(title('나의 인벤토리', '나의 펫 친구들') + `${tabs}${summary}<div class="collection-empty"><span>🐾</span><strong>아직 함께하는 펫이 없어요</strong><p>마을의 윤준에게 가면 베리를 찾아주는 귀여운 친구를 만날 수 있어요.</p></div>`, 'inventory-modal collection-modal');
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
          : `${petEffectBadges(id)}<p><b>${PETS[id].desc}</b><br>라이딩을 타고 있어도 뒤따라오며, 베리를 찾으면 직접 달려가 먹어요.</p>`;
      const actionText = active ? (tab === 'outfit' ? '지금 입고 있어요' : tab === 'ride' ? '지금 타고 있어요' : '지금 함께하고 있어요') : owned ? (tab === 'outfit' ? '이 옷 입기' : tab === 'ride' ? '이 라이딩 타기' : '이 펫과 함께하기') : `${item.price.toLocaleString()}베리로 구매하고 타기`;
      const restButton = tab === 'ride' ? `<button class="text-button wide" id="collection-rest" ${s.ride < 0 ? 'disabled' : ''}>👟 라이딩에서 내려 걷기</button>` : tab === 'pet' ? `<button class="text-button wide" id="collection-rest" ${s.pet < 0 ? 'disabled' : ''}>🏡 펫을 집에서 쉬게 하기</button>` : '';
      const heading = tab === 'outfit' ? '나의 의상실' : tab === 'ride' ? '나현이의 라이딩 마구간' : '나의 펫 친구들';
      openModal(title('나의 인벤토리', heading) + `${tabs}${summary}<div class="collection-showcase"><div class="collection-picker" role="list">${cards}</div><section class="collection-detail"><div id="collection-preview" class="collection-preview" style="--item-color:${itemColor(item.color)}"></div><span class="preview-tag">3D로 천천히 보기</span><h3>${item.name}</h3>${detail}<button class="primary wide" id="collection-action" ${active ? 'disabled' : ''}>${actionText}</button>${restButton}<p class="error" id="inventory-error" role="alert"></p></section></div>`, `inventory-modal collection-modal ${tab}-collection`);
      preview = new AvatarPreviewRuntime($('#collection-preview'));
      if (tab === 'outfit') preview.show(s.character, id, s.weapon, s.outfits[id], s.weapons[s.weapon], s.hairstyle, s.face);
      if (tab === 'ride') preview.showRide(id, s.character, s.outfit, s.weapon, s.outfits[s.outfit], s.weapons[s.weapon], s.hairstyle, s.face);
      if (tab === 'pet') preview.showPet(id);
      document.querySelectorAll<HTMLButtonElement>('[data-collection-item]').forEach(button => button.onclick = () => openInventory(tab, Number(button.dataset.collectionItem)));
      $('#collection-action').onclick = () => { try { let msg = ''; if (tab === 'outfit') { s.outfit = id; msg = `${OUTFITS[id].name}을(를) 입었어요!`; } else if (tab === 'ride') msg = buyRide(s, id); else msg = buyPet(s, id); audio.play('buy'); syncAvatar(); refresh(); persist(); openInventory(tab, id); toast(msg); } catch (e) { $('#inventory-error').textContent = (e as Error).message; } };
      const rest = document.querySelector<HTMLButtonElement>('#collection-rest'); if (rest) rest.onclick = () => { const msg = tab === 'ride' ? dismount(s) : unequipPet(s); syncAvatar(); refresh(); persist(); openInventory(tab, id); toast(msg); };
    }
  }
  document.querySelectorAll<HTMLButtonElement>('[data-inventory-tab]').forEach(button => button.onclick = () => openInventory(button.dataset.inventoryTab as 'weapon' | 'outfit' | 'ride' | 'pet'));
}

const FURNITURE = ['🍄 버섯 의자', '🪴 새싹 화분', '🧸 곰 인형', '🪟 둥근 창문', '🛏 구름 침대', '📚 모험 책장', '🕯 별빛 조명', '🧺 베리 바구니', '🌻 구구단 해바라기 화분', '🌙 달빛 컴퍼스 장식', '🍰 조각케이크 쿠션', '⚖️ 물방울 저울', '📊 별빛 그래프판', '🎓 학년 수학 수료장', '📐 반듯반듯 도형 액자', '🕰️ 똑딱 숲시계', '🔟 열칸 무지개 러그'];
let selectedRoomFurniture: number | null = null;
const furnitureIcon = (id: number) => FURNITURE[id].split(' ')[0];
const furnitureName = (id: number) => FURNITURE[id].split(' ').slice(1).join(' ');
function furnitureUnlocked(s: Save, id: number) {
  if (id === 8) return s.teacherMode || s.multiplicationCompleted;
  if (id >= 9 && id <= 12) return s.teacherMode || s.curriculum.units[(['circle', 'fraction', 'measurement', 'pictograph'] as NewCurriculumUnitId[])[id - 9]].rewardClaimed;
  if (id === 13) return s.teacherMode || s.curriculum.graduationClaimed;
  if (id >= 14 && id <= 16) return s.teacherMode || s.curriculum.units[(['plane', 'lengthTime', 'fractionDecimal'] as NewCurriculumUnitId[])[id - 14]].rewardClaimed;
  const progress = s.discoveries.monsters.length + s.discoveries.pets.length + s.journey.maps.slice(1).filter(m => m.cleared).length + s.multiplicationJourney.maps.slice(1).filter(m => m.cleared).length; return id < Math.min(8, progress);
}
function openRoom() {
  if (!state) return;
  const placed = state.room.furniture, unlockedFurniture = FURNITURE.filter((_, id) => furnitureUnlocked(state!, id)).length;
  if (selectedRoomFurniture === null || !placed.includes(selectedRoomFurniture)) selectedRoomFurniture = placed[0] ?? null;
  const rewardUnits: Partial<Record<number, NewCurriculumUnitId>> = { 9: 'circle', 10: 'fraction', 11: 'measurement', 12: 'pictograph', 14: 'plane', 15: 'lengthTime', 16: 'fractionDecimal' };
  const furnitureCards = FURNITURE.map((item, id) => {
    const unlocked = furnitureUnlocked(state!, id), rewardUnit = rewardUnits[id];
    const lockedText = id === 8 ? '곱셈의 숲 10단계와 햇살문을 통과하면 받아요' : id === 13 ? `모든 ${state?.grade ?? 3}학년 수학 지역과 졸업 모험을 통과하면 받아요` : rewardUnit ? `${curriculumName(rewardUnit)}을 완주하면 받아요` : '친구를 더 만나면 열려요';
    return `<button class="item-card ${placed.includes(id) ? 'selected' : ''}" data-furniture="${id}" ${unlocked ? '' : 'disabled'}><span class="item-swatch">${item.split(' ')[0]}</span><strong>${item.split(' ').slice(1).join(' ')}</strong><small>${placed.includes(id) ? '방에 놓였어요 · 다시 누르면 치워요' : unlocked ? '발견했어요 · 누르면 방에 놓여요' : lockedText}</small></button>`;
  }).join('');
  const picker = placed.length ? `<div class="room-furniture-picker" role="list" aria-label="옮길 가구 고르기">${placed.map(id => `<button data-room-select="${id}" class="${selectedRoomFurniture === id ? 'selected' : ''}" aria-pressed="${selectedRoomFurniture === id}"><span>${furnitureIcon(id)}</span>${furnitureName(id)}</button>`).join('')}</div>` : '<p class="room-empty-message">아래에서 발견한 가구를 먼저 방에 놓아 보세요.</p>';
  const cells = Array.from({ length: ROOM_GRID_COLUMNS * ROOM_GRID_ROWS }, (_, index) => {
    const column = index % ROOM_GRID_COLUMNS, row = Math.floor(index / ROOM_GRID_COLUMNS);
    const occupant = placed.find(id => { const p = roomFurniturePosition(state!, id); return p.column === column && p.row === row; });
    const selected = occupant !== undefined && occupant === selectedRoomFurniture;
    return `<button class="room-layout-cell ${occupant === undefined ? 'empty' : 'filled'} ${selected ? 'selected' : ''}" data-room-column="${column}" data-room-row="${row}" ${occupant === undefined ? '' : `data-room-occupant="${occupant}" draggable="true"`} aria-label="${occupant === undefined ? `${row + 1}번째 줄 ${column + 1}번째 빈 자리` : `${FURNITURE[occupant]}${selected ? ', 선택됨' : ''}`}">${occupant === undefined ? '<span class="room-empty-dot">＋</span>' : `<span class="room-cell-icon">${furnitureIcon(occupant)}</span><small>${furnitureName(occupant)}</small>`}</button>`;
  }).join('');
  const chosen = selectedRoomFurniture === null ? '옮길 가구를 골라 주세요' : `${FURNITURE[selectedRoomFurniture]}을(를) 옮기는 중`;
  openModal(title('나만의 작은 방', '가구를 내 마음대로 배치해요') + `<p class="shop-explainer"><b>① 가구 고르기 → ② 방의 원하는 칸 누르기</b><br>다른 가구가 있는 칸을 누르면 두 가구가 자리를 바꿔요. PC에서는 가구를 끌어서 옮길 수도 있어요.</p><section class="room-placement"><h3>🖐 옮길 가구 고르기</h3>${picker}<div class="room-layout-header"><strong>${chosen}</strong><button class="text-button" id="room-auto-arrange" ${placed.length ? '' : 'disabled'}>자동 정리</button></div><div class="room-layout-board" role="grid" aria-label="내 방 가구 배치판">${cells}</div><div class="room-move-pad" aria-label="선택한 가구 한 칸 옮기기"><button data-room-move="up" aria-label="위로 한 칸">▲<small>위</small></button><button data-room-move="left" aria-label="왼쪽으로 한 칸">◀<small>왼쪽</small></button><button data-room-move="down" aria-label="아래로 한 칸">▼<small>아래</small></button><button data-room-move="right" aria-label="오른쪽으로 한 칸">▶<small>오른쪽</small></button></div><p class="room-save-note">✓ 옮긴 위치는 바로 자동 저장되고 실제 3D 방에도 그대로 보여요.</p></section><p class="room-status">지금 방에 놓인 가구 ${placed.length}개 · 발견한 가구 ${unlockedFurniture}개</p><details class="room-furniture-drawer"><summary>가구 놓기·치우기 (${unlockedFurniture}개 발견)</summary><div class="item-grid room-items">${furnitureCards}</div></details><button class="primary wide" data-close>완성된 3D 방 둘러보기</button>`, 'room-modal');
  const moveFurniture = (id: number, column: number, row: number, message = '새 자리로 옮겼어요!') => {
    if (!placeRoomFurniture(state!, id, column, row)) return;
    selectedRoomFurniture = id; world.updateRoomFurniture(state!); persist(); openRoom(); toast(`${FURNITURE[id]} ${message}`);
  };
  document.querySelectorAll<HTMLButtonElement>('[data-room-select]').forEach(button => button.onclick = () => { selectedRoomFurniture = Number(button.dataset.roomSelect); openRoom(); });
  document.querySelectorAll<HTMLButtonElement>('[data-room-column]').forEach(cell => {
    cell.onclick = () => { const occupant = cell.dataset.roomOccupant === undefined ? null : Number(cell.dataset.roomOccupant); if (selectedRoomFurniture === null) { if (occupant !== null) { selectedRoomFurniture = occupant; openRoom(); } return; } moveFurniture(selectedRoomFurniture, Number(cell.dataset.roomColumn), Number(cell.dataset.roomRow)); };
    cell.ondragstart = event => { const id = Number(cell.dataset.roomOccupant); if (!Number.isInteger(id)) { event.preventDefault(); return; } selectedRoomFurniture = id; event.dataTransfer?.setData('text/plain', String(id)); cell.classList.add('dragging'); };
    cell.ondragend = () => cell.classList.remove('dragging');
    cell.ondragover = event => { event.preventDefault(); cell.classList.add('drag-target'); };
    cell.ondragleave = () => cell.classList.remove('drag-target');
    cell.ondrop = event => { event.preventDefault(); const id = Number(event.dataTransfer?.getData('text/plain')); cell.classList.remove('drag-target'); if (Number.isInteger(id)) moveFurniture(id, Number(cell.dataset.roomColumn), Number(cell.dataset.roomRow)); };
  });
  document.querySelectorAll<HTMLButtonElement>('[data-room-move]').forEach(button => button.onclick = () => {
    if (selectedRoomFurniture === null) return;
    const p = roomFurniturePosition(state!, selectedRoomFurniture), direction = button.dataset.roomMove;
    const column = Math.max(0, Math.min(ROOM_GRID_COLUMNS - 1, p.column + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0)));
    const row = Math.max(0, Math.min(ROOM_GRID_ROWS - 1, p.row + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0)));
    if (column === p.column && row === p.row) { toast('방 끝이에요. 다른 방향으로 옮겨 보세요!'); return; }
    moveFurniture(selectedRoomFurniture, column, row, '한 칸 옮겼어요!');
  });
  $('#room-auto-arrange').onclick = () => { placed.forEach((id, index) => { state!.room.positions[String(id)] = defaultRoomFurniturePosition(index); }); world.updateRoomFurniture(state!); persist(); openRoom(); toast('가구를 차례대로 반듯하게 정리했어요!'); };
  document.querySelectorAll<HTMLButtonElement>('[data-furniture]').forEach(button => button.onclick = () => {
    const id = Number(button.dataset.furniture); if (!furnitureUnlocked(state!, id)) return;
    const removing = state!.room.furniture.includes(id); if (removing) { removeRoomFurniture(state!, id); if (selectedRoomFurniture === id) selectedRoomFurniture = state!.room.furniture[0] ?? null; } else { addRoomFurniture(state!, id); selectedRoomFurniture = id; }
    world.updateRoomFurniture(state!); persist(); openRoom(); toast(`${FURNITURE[id]} ${removing ? '방에서 치웠어요' : '빈 자리에 놓았어요'}!`);
  });
}
function openNotebook() {
  if (!state) return; const seenM = state.discoveries.monsters, seenP = state.discoveries.pets, seenO = state.discoveries.outfits;
  const insight = learningInsight(state);
  const learningRows = curriculumRegions().map(region => { const p = state!.curriculum.units[region.id], total = p.correct + p.wrong, rate = total ? Math.round(p.correct / total * 100) : 0; return `<div><span>${region.icon}</span><strong>${region.name}</strong><small>${total ? `정답 ${rate}% · ${total}번 도전` : '아직 학습 기록이 없어요'}</small></div>`; }).join('');
  openModal(title('모험 발견 기록', '도감과 학습 수첩') + `<div class="learning-insight notebook-insight"><p><b>👍 잘 이해한 내용</b>${escape(insight.strong)}</p><p><b>🌱 다시 연습할 내용</b>${escape(insight.review)}</p><p><b>🧭 추천 임무</b>${escape(insight.recommend)}</p></div><div class="unit-learning-list">${learningRows}</div><div class="codex-list"><h3>🌱 몬스터 친구 ${seenM.length}/${MONSTERS.length}</h3><p>${MONSTERS.map((m, i) => `${seenM.includes(i) ? m.icon : '❔'} ${seenM.includes(i) ? m.name : '아직 못 만났어요'}`).join('　')}</p><h3>🐾 펫 친구 ${seenP.length}/${PETS.length}</h3><p>${PETS.map((p, i) => `${seenP.includes(i) ? p.icon : '❔'} ${seenP.includes(i) ? p.name : '아직 못 만났어요'}`).join('　')}</p><h3>👗 옷 ${seenO.length}/${OUTFITS.length}</h3><p>${OUTFITS.map((o, i) => `${seenO.includes(i) ? OUTFIT_ICONS[i] : '❔'} ${seenO.includes(i) ? o.name : '아직 못 발견했어요'}`).join('　')}</p></div><button class="secondary wide" id="review-wrong">곱셈·나눗셈 다시 풀기 (${state.learning.wrongQuestions.length})</button><button class="secondary wide" id="review-curriculum" ${state.curriculum.wrongSkills.length ? '' : 'disabled'}>단원 개념 다시 연습하기 (${state.curriculum.wrongSkills.length})</button><button class="secondary wide" id="open-report">📄 학습 리포트 보기·인쇄</button>`);
  $('#open-report').onclick = openReport;
  $('#review-wrong').onclick = () => openReview();
  $('#review-curriculum').onclick = () => { const mistake = state!.curriculum.wrongSkills[0]; if (mistake) void startCurriculumReview(mistake.unit); };
}
function openReport() {
  if (!state) return;
  const html = reportHtml(buildReport(state, curriculumRegions()));
  openModal(title('학습 리포트', '선생님·보호자와 함께 봐요') + `<div class="report-preview">${html}</div><button class="primary wide" id="report-print">🖨 인쇄하기</button><button class="text-button wide" id="report-back">학습 기록으로 돌아가기</button>`, 'report-modal');
  $('#report-back').onclick = openNotebook;
  $('#report-print').onclick = () => {
    document.querySelector('#print-report')?.remove();
    const sheet = document.createElement('div'); sheet.id = 'print-report'; sheet.innerHTML = html; document.body.append(sheet);
    window.addEventListener('afterprint', () => sheet.remove(), { once: true }); window.print();
  };
}
function openReview(index = 0) {
  if (!state) return; const items = state.learning.wrongQuestions;
  if (!items.length) { openModal(title('계산 복습', '아직 다시 풀 문제가 없어요') + '<p>문제를 틀려도 괜찮아요. 모험 중 틀린 덧셈·뺄셈·곱셈·나눗셈은 여기에 차곡차곡 모여요!</p>'); return; }
  const q = items[index % items.length], op = q.operation ?? 'division', info = OPERATION_INFO[op], multiplication = op === 'multiplication', symbol = info.symbol, simple = op === 'addition' || op === 'subtraction';
  const answerFields = q.remainder ? `<label>몫<input id="review-answer" inputmode="numeric" maxlength="3" aria-label="몫"></label><label>나머지<input id="review-remainder" inputmode="numeric" maxlength="1" aria-label="나머지"></label>` : `<input id="review-answer" inputmode="numeric" maxlength="4" aria-label="답">`;
  openModal(title(`틀린 문제 복습 · ${index + 1}/${items.length}`, '이번에는 풀 수 있어요!') + `<span class="operation-badge">${info.icon} ${info.name}</span><div class="question ${q.remainder ? 'remainder-question' : ''}"><b>${q.dividend}</b><span>${symbol}</span><b>${q.divisor}</b><span>=</span>${answerFields}</div><p id="review-message" class="answer-message">천천히 생각해 보세요. 베리나 경험치는 걸리지 않아요.</p><button class="secondary wide" id="review-hint">💡 ${simple ? '자리값을 나누어 차례로 계산해 봐요' : multiplication ? '자리값을 나누어 곱해 봐요' : q.remainder ? '곱셈으로 몫을 찾고 남은 수를 세어요' : `${q.divisor} × □ = ${q.dividend} 를 생각해 봐요`}</button><button class="primary wide" id="review-check">답 확인하기</button><button class="text-button wide" id="review-next">다른 문제 보기</button>`);
  $('#review-hint').onclick = () => { $('#review-message').textContent = simple ? `${q.dividend} ${symbol} ${q.divisor} = ${q.answer}예요.` : multiplication ? `${q.dividend} × ${q.divisor} = ${q.answer}예요.` : q.remainder ? `${q.divisor} × ${q.answer} + ${q.remainder} = ${q.dividend}이에요.` : `${q.divisor}를 몇 번 더하면 ${q.dividend}이 될까요? ${q.divisor} × ${q.answer} = ${q.dividend}`; };
  $('#review-check').onclick = () => { const answer = ($('#review-answer') as HTMLInputElement).value, remainder = document.querySelector<HTMLInputElement>('#review-remainder')?.value, submitted = q.remainder ? `${answer}R${remainder}` : answer, correct = submitted === questionAnswerText(q); $('#review-message').textContent = correct ? '맞았어요! 다시 풀어낸 용기가 멋져요. 🌟' : '괜찮아요. 힌트를 보고 한 번 더 생각해 봐요.'; if (correct) { state!.learning.wrongQuestions = items.filter((_, i) => i !== index); persist(); } };
  $('#review-next').onclick = () => openReview((index + 1) % items.length);
}

function openPetShop(selectedId?: number) {
  if (!state) return; const s = state, id = selectedId ?? (s.pet >= 0 ? s.pet : 0), pet = PETS[id], owned = !!s.pets[id], active = s.pet === id;
  const cards = PETS.map((item, itemId) => { const hasPet = !!s.pets[itemId], withPlayer = s.pet === itemId; return `<button class="collection-card ${itemId === id ? 'selected' : ''} ${withPlayer ? 'active' : ''}" data-shop-pet="${itemId}" aria-pressed="${itemId === id}"><span class="collection-icon" style="--item-color:${itemColor(item.color)}">${item.icon}</span><strong>${item.name}</strong><small>${withPlayer ? '함께하는 중' : hasPet ? '보유 중' : `🍓 ${item.price.toLocaleString()}`}</small></button>`; }).join('');
  openModal(title('윤준의 펫 상점', `3D로 만나 보는 ${PETS.length}마리 친구`) + `<p class="shop-explainer">친구를 눌러 앞·옆모습과 장식을 천천히 살펴보세요. 펫은 라이딩 중에도 베리를 찾아 직접 달려가요. <b>🍓 ${s.berries.toLocaleString()}베리</b></p><div class="collection-showcase"><div class="collection-picker" role="list">${cards}</div><section class="collection-detail"><div id="collection-preview" class="collection-preview pet-preview" style="--item-color:${itemColor(pet.color)}"></div><span class="preview-tag">살랑살랑 3D 미리 보기</span><h3>${pet.icon} ${pet.name}</h3>${petEffectBadges(id)}<p><b>${pet.desc}</b><br>플레이어와 같은 베리를 동시에 먹어도 보상은 한 번만 받아요.</p><button class="primary wide" id="buy-pet" ${active ? 'disabled' : ''}>${active ? '지금 함께하고 있어요' : owned ? '이 펫과 함께하기' : `${pet.price.toLocaleString()}베리로 친구 되기`}</button><p class="error" id="pet-error" role="alert"></p></section></div>`, 'inventory-modal collection-modal pet-shop');
  preview = new AvatarPreviewRuntime($('#collection-preview')); preview.showPet(id);
  document.querySelectorAll<HTMLButtonElement>('[data-shop-pet]').forEach(button => button.onclick = () => openPetShop(Number(button.dataset.shopPet)));
  $('#buy-pet').onclick = () => { try { const msg = buyPet(s, id); if (!s.discoveries.pets.includes(id)) s.discoveries.pets.push(id); audio.play('buy'); syncAvatar(); refresh(); persist(); openPetShop(id); toast(msg); } catch (e) { $('#pet-error').textContent = (e as Error).message; } };
}

function openPotionShop() {
  if (!state) return; const s = state;
  const effect = potionEffects(s), active = `${effect.berrySeconds ? `🍓 베리 ${effect.berryMultiplier}배 · ${buffTime(effect.berrySeconds)} 남음` : '🍓 베리 효과 없음'}<br>${effect.xpSeconds ? `🧪 경험치 ${effect.xpMultiplier}배 · ${buffTime(effect.xpSeconds)} 남음` : '🧪 경험치 효과 없음'}`;
  openModal(title('박준우의 물약 상점', '시간 동안 힘이 나는 물약') + `<p class="shop-explainer">물약은 산 뒤 <b>사용하기</b>를 누른 순간부터 시간이 줄어요. 문제를 풀거나 메뉴를 보는 동안에도 시간이 흘러요. <b>🍓 ${s.berries.toLocaleString()}베리</b></p><p class="note" id="potion-status">지금 효과<br>${active}</p><div class="inventory-list">${POTIONS.map((potion, id) => `<article class="inventory-item"><span class="inventory-icon potion-icon">${potion.icon}</span><div><strong>${potion.name}</strong><small>${potion.desc}<br>가방에 ${s.potions.stock[id]}개</small></div><div class="potion-actions"><button class="primary" data-buy-potion="${id}">🍓 ${potion.price}</button><button class="secondary" data-use-potion="${id}" ${s.potions.stock[id] ? '' : 'disabled'}>사용하기</button></div></article>`).join('')}</div><p class="error" id="potion-error" role="alert"></p>`, 'inventory-modal potion-shop');
  document.querySelectorAll<HTMLButtonElement>('[data-buy-potion]').forEach(button => button.onclick = () => { try { const msg = buyPotion(s, Number(button.dataset.buyPotion)); audio.play('buy'); refresh(); persist(); openPotionShop(); toast(msg); } catch (e) { $('#potion-error').textContent = (e as Error).message; } });
  document.querySelectorAll<HTMLButtonElement>('[data-use-potion]').forEach(button => button.onclick = () => { try { const msg = usePotion(s, Number(button.dataset.usePotion)); audio.play('level'); refresh(); persist(); openPotionShop(); toast(msg); } catch (e) { $('#potion-error').textContent = (e as Error).message; } });
}

function openBeauty(kind: 'hairstyle' | 'face' = 'hairstyle', selectedId?: number) {
  if (!state) return; const s = state, items = kind === 'hairstyle' ? HAIRSTYLES : FACES, owned = kind === 'hairstyle' ? s.hairstyles : s.faces, id = selectedId ?? s[kind];
  openModal(title('가영이의 꾸밈방', '헤어스타일과 성형') + `<div class="inventory-tabs"><button data-beauty-tab="hairstyle" class="${kind === 'hairstyle' ? 'active' : ''}">💇 헤어</button><button data-beauty-tab="face" class="${kind === 'face' ? 'active' : ''}">✨ 얼굴</button></div><p class="shop-explainer">구매한 스타일은 언제든 무료로 다시 바꿀 수 있어요. <b>🍓 ${s.berries.toLocaleString()}베리</b></p><div class="shop-layout"><div class="item-grid">${items.map((item, i) => `<button class="item-card ${id === i ? 'selected' : ''}" data-look="${i}"><span class="item-swatch">${item.icon}</span><strong>${item.name}</strong><small>${owned[i] ? s[kind] === i ? '✓ 지금 모습' : '보유 중' : `🍓 ${item.price}베리`}</small></button>`).join('')}</div><div class="item-detail"><div id="shop-avatar"></div><span class="preview-tag">미리 보기</span><h3>${items[id].name}</h3><button id="buy-look" class="primary wide" ${s[kind] === id ? 'disabled' : ''}>${s[kind] === id ? '지금 모습이에요' : owned[id] ? '이 모습으로 바꾸기' : `${items[id].price}베리로 구매`}</button><p class="error" id="beauty-error" role="alert"></p></div></div>`, 'shop-modal');
  preview = new AvatarPreviewRuntime($('#shop-avatar')); preview.show(s.character, s.outfit, s.weapon, s.outfits[s.outfit], s.weapons[s.weapon], kind === 'hairstyle' ? id : s.hairstyle, kind === 'face' ? id : s.face);
  document.querySelectorAll<HTMLButtonElement>('[data-beauty-tab]').forEach(button => button.onclick = () => openBeauty(button.dataset.beautyTab as 'hairstyle' | 'face'));
  document.querySelectorAll<HTMLButtonElement>('[data-look]').forEach(button => button.onclick = () => openBeauty(kind, Number(button.dataset.look)));
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
  if (!state) return; persist();
  const focusOptions = [{ id: 'all', name: '모든 단원 자유 선택' }, ...curriculumRegions().map(region => ({ id: region.id, name: `${region.icon} ${region.name}` }))];
  const teacherOptions = state.teacherMode ? `<div class="settings-list teacher-options">
    <label><span>오늘 집중할 단원<small>모험 지도에서 오늘의 단원으로 표시해요</small></span><select id="focus-unit">${focusOptions.map(option => `<option value="${option.id}" ${state!.settings.focusUnit === option.id ? 'selected' : ''}>${option.name}</option>`).join('')}</select></label>
    <label><span>이전 단원 복습<small>새 임무 문제의 약 20%에 이전 단원을 섞어요</small></span><input id="spiral-toggle" type="checkbox" ${state.settings.spiralReview ? 'checked' : ''}></label>
    <label><span>나눗셈 문제 범위<small>자동은 지금 스테이지의 난이도를 따라요</small></span><select id="question-range"><option value="0" ${state.settings.maxDividend === 0 ? 'selected' : ''}>스테이지에 맞추기</option><option value="90" ${state.settings.maxDividend === 90 ? 'selected' : ''}>두 자리 수까지만</option><option value="180" ${state.settings.maxDividend === 180 ? 'selected' : ''}>180까지 허용</option></select></label>
    <label><span>곱셈 문제 범위<small>구구단만을 고르면 어느 단계에서도 한 자리 수끼리 곱해요</small></span><select id="multiplication-range"><option value="stage" ${state.settings.multiplicationRange === 'stage' ? 'selected' : ''}>단계에 맞추기</option><option value="tables" ${state.settings.multiplicationRange === 'tables' ? 'selected' : ''}>구구단만</option></select></label>
    <label><span>한 번의 수업 시간<small>시간이 끝나면 진행 중인 문제 뒤에 요약해요</small></span><select id="session-limit">${[0, 10, 15, 20, 30, 45, 60].map(n => `<option value="${n}" ${state!.settings.sessionMinutes === n ? 'selected' : ''}>${n ? `${n}분` : '시간 제한 없음'}</option>`).join('')}</select></label>
    <button id="notebook" class="secondary">📖 학습 요약과 틀린 문제 복습</button></div>` : '';
  openModal(title('나의 모험 수첩', '설정과 저장') + `<div class="settings-list"><label><span>배경음악<small>잔잔한 숲속 멜로디</small></span><input id="music-toggle" type="checkbox" ${state.settings.music ? 'checked' : ''}></label><label><span>효과음<small>베리와 정답 알림</small></span><input id="sound-toggle" type="checkbox" ${state.settings.sound ? 'checked' : ''}></label><label><span>시간대와 날씨<small>저녁·밤에는 하늘이 어두워지고 가끔 비가 와요</small></span><input id="ambience-toggle" type="checkbox" ${ambienceEnabled() ? 'checked' : ''}></label><label><span>가벼운 화면<small>그림자를 줄여 휴대폰과 태블릿에서 부드럽게</small></span><input id="quality-toggle" type="checkbox" ${state.settings.lowQuality ? 'checked' : ''}></label>${speechSupported() ? `<label><span>문제 읽어주기<small>새 문제가 나오면 소리 내어 읽어 줘요</small></span><input id="speech-toggle" type="checkbox" ${autoReadEnabled() ? 'checked' : ''}></label>` : ''}</div><div class="settings-practice"><h3 class="title-heading">🎯 대련 연습 방식</h3>${practicePickerHtml()}<label class="practice-skip"><input type="checkbox" id="practice-skip-setting" ${state.settings.practice.skipPicker ? 'checked' : ''}> 사냥터에서 선택 화면 없이 바로 시작해요</label></div><div class="teacher-code ${state.teacherMode ? 'enabled' : ''}"><div><strong>🧑‍🏫 교사용 코드</strong><small>${state.teacherMode ? '선생님 모드 활성화됨 · 아래에서 수업 단원과 범위를 정할 수 있어요' : '수업 시연용 코드를 입력하세요'}</small></div><div class="teacher-input"><input id="teacher-code" type="password" autocomplete="off" placeholder="교사용 코드"><button id="teacher-unlock" class="secondary">입력</button></div><p class="error" id="teacher-error" role="alert"></p></div>${teacherOptions}<p class="note">자동 저장은 이 기기와 브라우저에만 남아요. 선생님 설정도 이 기기에서만 적용됩니다. ${storageError ? '<br>자동 저장을 사용할 수 없어요. 꼭 저장 파일을 내려받아 주세요.' : ''}</p><div class="settings-buttons"><button id="export" class="secondary">저장 파일 내려받기</button><button id="import" class="secondary">저장 파일 불러오기</button><button id="help" class="secondary">조작 방법 보기</button><button id="copyright-notice" class="secondary">© 저작권·이용 안내</button><button id="return-title" class="secondary">처음 화면으로</button></div>`);
  for (const [id, key] of [['music', 'music'], ['sound', 'sound'], ['quality', 'lowQuality']] as const) $<HTMLInputElement>(`#${id}-toggle`).onchange = e => { state!.settings[key] = (e.target as HTMLInputElement).checked; refresh(); if (key === 'lowQuality') world.quality(state!.settings.lowQuality); persist(); };
  $<HTMLInputElement>('#ambience-toggle').onchange = e => { setAmbience((e.target as HTMLInputElement).checked); refreshAmbience(); };
  const speechToggle = document.querySelector<HTMLInputElement>('#speech-toggle'); if (speechToggle) speechToggle.onchange = () => { setAutoRead(speechToggle.checked); if (!speechToggle.checked) stopSpeech(); };
  bindPracticePicker($('#modal-content')); $<HTMLInputElement>('#practice-skip-setting').onchange = e => { state!.settings.practice.skipPicker = (e.target as HTMLInputElement).checked; persist(); };
  const range = document.querySelector<HTMLSelectElement>('#question-range'); if (range) range.onchange = () => { state!.settings.maxDividend = Number(range.value) as 0 | 90 | 180; persist(); };
  const multiplicationRange = document.querySelector<HTMLSelectElement>('#multiplication-range'); if (multiplicationRange) multiplicationRange.onchange = () => { state!.settings.multiplicationRange = multiplicationRange.value as 'stage' | 'tables'; persist(); };
  const focusUnit = document.querySelector<HTMLSelectElement>('#focus-unit'); if (focusUnit) focusUnit.onchange = () => { state!.settings.focusUnit = focusUnit.value as Save['settings']['focusUnit']; persist(); };
  const spiral = document.querySelector<HTMLInputElement>('#spiral-toggle'); if (spiral) spiral.onchange = () => { state!.settings.spiralReview = spiral.checked; persist(); };
  const limit = document.querySelector<HTMLSelectElement>('#session-limit'); if (limit) limit.onchange = () => { state!.settings.sessionMinutes = Number(limit.value); sessionExpired = false; persist(); };
  const notebook = document.querySelector<HTMLButtonElement>('#notebook'); if (notebook) notebook.onclick = openNotebook;
  $('#export').onclick = exportSave; $('#import').onclick = () => $<HTMLInputElement>('#import-file').click(); $('#help').onclick = openGuide; $('#copyright-notice').onclick = openCopyrightNotice;
  const unlock = () => { try { const msg = applyTeacherCode(state!, $<HTMLInputElement>('#teacher-code').value.trim()); audio.play('level'); syncAvatar(); refresh(); persist(); openSettings(); toast(msg); } catch (e) { $('#teacher-error').textContent = (e as Error).message; } }; $('#teacher-unlock').onclick = unlock; $<HTMLInputElement>('#teacher-code').onkeydown = e => { if (e.key === 'Enter') unlock(); };
  $('#return-title').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
function openDaily() {
  if (!state) return; const s = state, d = ensureDaily(s), shown = dailyStampsShown(d.streak);
  const rows = DAILY_MISSIONS.map((m, i) => { const done = d.progress[i] >= m.goal, claimed = d.claimed[i];
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
$('#stage-map').onclick = () => openStageMap();
$('#inventory').onclick = () => openInventory();
$('#codex-open').onclick = openNotebook;
$<HTMLInputElement>('#import-file').onchange = async e => {
  const input = e.target as HTMLInputElement, file = input.files?.[0]; input.value = ''; if (!file) return;
  try { if (file.size > 100000) throw new Error('파일이 너무 커요. 베리숲 저장 파일을 골라 주세요.'); pendingImport = validateSave(JSON.parse(await file.text()));
    confirmAction('저장된 모험을 불러올까요?', `${escape(pendingImport.nickname)} · 레벨 ${pendingImport.level}의 모험으로 바뀌어요. 현재 모험은 덮어쓰게 됩니다.`, () => { const incoming = pendingImport!; pendingImport = null; begin(incoming, false); }, !!(state ?? saved));
  } catch (error) { toast(error instanceof SyntaxError ? '올바른 JSON 저장 파일이 아니에요.' : (error as Error).message); }
};
setInterval(() => {
  if (state && world.active && !document.hidden && (!($('#modal') as HTMLDialogElement).open || battle || curriculumRun)) {
    sessionElapsed++; state.learning.elapsedSeconds++;
    const limit = state.settings.sessionMinutes * 60;
    if (limit > 0 && sessionElapsed >= limit && !sessionExpired) { sessionExpired = true; if (!battle && !curriculumRun) showSessionSummary(); else toast('수업 시간이 다 되었어요. 지금 문제를 마치면 오늘 기록을 보여줄게요.'); }
  }
  if (state) { $('#weapon-effect').textContent = equipmentEffectText(state); $('#daily-open').classList.toggle('ready', dailyReady(state)); }
  const potionStatus = document.querySelector<HTMLElement>('#potion-status');
  if (state && potionStatus) { const effect = potionEffects(state); potionStatus.innerHTML = `지금 효과<br>${effect.berrySeconds ? `🍓 베리 ${effect.berryMultiplier}배 · ${buffTime(effect.berrySeconds)} 남음` : '🍓 베리 효과 없음'}<br>${effect.xpSeconds ? `🧪 경험치 ${effect.xpMultiplier}배 · ${buffTime(effect.xpSeconds)} 남음` : '🧪 경험치 효과 없음'}`; }
  persist();
}, 1000); window.addEventListener('pagehide', persist); document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  const registerWorker = () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* 오프라인 기능만 빠지고 게임은 그대로 동작해요 */ }); };
  if (document.readyState === 'complete') registerWorker(); else window.addEventListener('load', registerWorker);
}

if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
  const devApi = { openArena, beginHuntBattle, openStageMap, openSettings, openDaily, openInventory, openShop, openPetShop, openGuide, openNotebook, openRoom, openCurriculumUnit, switchStage, refresh, getState: () => state };
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
