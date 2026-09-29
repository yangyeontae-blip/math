import './style.css';
import './garden.css';
import type { World, AvatarPreview } from './world';
import { newSave, validateSave, CHARACTERS, MONSTERS, OUTFITS, PETS, POTIONS, RIDES, WEAPONS, HAIRSTYLES, FACES, WEAPON_UPGRADES, OUTFIT_UPGRADES, Encounter, grantReward, rewardFor, potionEffects, buy, upgrade, buyRide, dismount, buyPet, unequipPet, buyLook, buyPotion, usePotion, applyTeacherCode, collectBerry, finishHunt, fellTree, treeDamage, canEnter, monsterBattleRounds, recordWrongAnswer, recordCorrectAnswer, STAGE_STORIES, journeyFor, multiplicationUsesStory, startMultiplicationFinal, answerMultiplicationFinal, type ForestKind, type Save } from './rules';
import { STAGES, stageMonsters, stageBerries, berryValue, clearBonus } from './stages';
import { Sound } from './audio';
import { RESCUES, FLOWERS, gardenOf, rescueSheep, plantFlower } from './garden';
import { EXPEDITION_TITLES, expeditionBerryReward, expeditionLayout, expeditionUnlocked, startExpedition, collectExpeditionStar, defeatExpeditionMonster, canFinishExpedition, finishExpedition, selectExpeditionTitle } from './expedition';
import { parseLocalRanks, updateLocalRanks } from './ranking';
import { getGlobalPlayerId, loadGlobalRanks, syncGlobalRank, type GlobalRank } from './global-ranking';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const root = $('#game');
root.innerHTML = `<div id="world" aria-label="베리숲 3D 마을"></div><div id="hud" hidden>
  <header class="topbar"><div class="player-card"><span class="level-badge" id="level">1</span><div><strong id="nickname"></strong><div class="xp-track"><div id="xp-fill"></div></div><small id="xp-text"></small></div></div><div class="brand-mini">베리숲 <span>모험학교</span></div><div class="top-actions"><span class="wallet">🍓 <b id="berries">0</b><span>베리</span></span><button id="inventory" class="icon-button" aria-label="내 인벤토리">🎒</button><button id="stage-map" class="icon-button" aria-label="사냥터 지도">🗺</button><button id="settings" class="icon-button" aria-label="설정과 저장">⚙</button></div></header>
  <aside class="quest-card"><button id="quest-toggle" class="quest-toggle" aria-expanded="true" aria-controls="quest-body"><span>✿ 오늘의 작은 모험</span><span class="quest-chevron" aria-hidden="true">⌃</span></button><div id="quest-body" class="quest-body"><strong id="quest-title">베리숲에 오신 걸 환영해요</strong><div id="quest-list"></div><button id="codex-open" class="text-button codex-open">📖 모험 발견 도감</button></div></aside>
  <div class="location-pill">❋ 베리숲 마을 <span>평화로운 오후</span></div>
  <div class="equipment-card"><span id="weapon-name"></span><small id="weapon-effect"></small></div>
  <div class="controls-help"><kbd>W A S D</kbd> 이동 <kbd>Space</kbd> 점프 <kbd>E</kbd> 대화 <kbd>F</kbd> 휘두르기</div>
  <button id="interact" class="interaction" hidden></button>
  <div id="touch-controls"><div id="joystick" role="group" aria-label="이동 조이스틱"><span id="stick"></span></div><div class="touch-actions"><button id="touch-talk">대화</button><button id="touch-attack">나무 베기</button><button id="touch-jump">점프 ↟</button></div></div>
</div><div id="start-screen" class="start-layer"></div><dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status" aria-live="polite"></div><input type="file" id="import-file" accept="application/json,.json" hidden>`;

let world: World, AvatarPreviewRuntime: typeof AvatarPreview;
const audio = new Sound(), STORAGE = 'berry-forest-save-v1', RANKING_STORAGE = 'berry-forest-local-expedition-ranking-v1';
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
let selected = 0, pendingImport: Save | null = null, toastTimer: ReturnType<typeof setTimeout>, modalOpener: HTMLElement | null = null;
let battle: { encounter: Encounter; id: string; kind: 'normal' | 'expMonster' | 'expGate' | 'multiplicationGate'; round: number; goalRounds?: number; score: number; result: ReturnType<typeof grantReward> | null; newTitle?: number; story?: boolean } | null = null;
let storageError = false, sessionExpired = false, sessionElapsed = 0, sessionCorrect = 0, sessionWrong = 0;
const OUTFIT_ICONS = ['🌿', '🌈', '🍃', '☁️', '🌸', '🌟', '🌙', '👑', '🍓', '🐥', '🐰', '🌰', '🐱', '🐑', '🐸', '🧚', '🌻', '🐝', '🍑', '✴️'];
try { const raw = localStorage.getItem(STORAGE); if (raw) saved = validateSave(JSON.parse(raw)); } catch { storageError = true; }

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
function petEffectBadges(id: number) { const item = PETS[id]; return `<div class="stat-chips"><span class="stat-chip pet-range">🍓 ${item.radius}칸 안의 베리 발견</span><span class="stat-chip pet-move">🐾 직접 달려가 한 번만 수집</span></div>`; }
function itemColor(color: number) { return `#${color.toString(16).padStart(6, '0')}`; }
function toast(message: string) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function persist() {
  if (!state) return;
  if (!world.inRoom) { const p = world.player.position; state.position = { x: p.x, z: p.z }; }
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); if (!state.teacherMode) localStorage.setItem(RANKING_STORAGE, JSON.stringify(updateLocalRanks(parseLocalRanks(localStorage.getItem(RANKING_STORAGE)), state.nickname, state.expedition.completed))); saved = structuredClone(state); } catch { if (!storageError) toast('자동 저장 공간이 부족해요. 설정에서 저장 파일을 내려받아 주세요.'); storageError = true; }
}
function refresh() {
  if (!state) return; const s = state, journey = journeyFor(s), forestName = s.forest === 'multiplication' ? '곱셈의 숲' : '나눗셈의 숲';
  const activeTitle = s.expedition.selectedTitle ? EXPEDITION_TITLES[s.expedition.selectedTitle].name : s.multiplicationCompleted ? '곱셈숲 탐험가' : '';
  $('#level').textContent = `${s.level}`; $('#nickname').textContent = `${s.nickname}${activeTitle ? ` · ${activeTitle}` : ''}${s.teacherMode ? ' · 선생님' : ''}`; $('#berries').textContent = s.berries.toLocaleString();
  $('#xp-fill').style.width = `${s.xp / (s.level * 40) * 100}%`; $('#xp-text').textContent = `경험치 ${s.xp} / ${s.level * 40}`;
  $('#weapon-name').textContent = `${WEAPONS[s.weapon].icon} ${WEAPONS[s.weapon].name} +${s.weapons[s.weapon]} · ${OUTFITS[s.outfit].name}`;
  $('#weapon-effect').textContent = equipmentEffectText(s);
  const expedition = s.forest === 'division' ? s.expedition.active : null;
  $('.location-pill').innerHTML = world?.inRoom ? '⌂ 나의 집 <span>가구를 눌러 꾸며요</span>' : journey.stage ? `${s.forest === 'multiplication' ? '🌻' : '❋'} ${journey.stage}단계 사냥터 <span>${expedition?.stage === journey.stage ? '✦ 별빛 재탐험' : `${forestName} · ${STAGES[journey.stage - 1].name}`}</span>` : '❋ 베리숲 마을 <span>평화로운 오후</span>';
  const tasks = [[s.tutorial.collected, '길 위의 베리 줍기'], [s.tutorial.battle, '계산으로 몬스터 만나기'], [s.tutorial.shop, '강지후·오지후 상점 구경']];
  const expeditionHere = expedition?.stage === journey.stage && !world?.inRoom;
  const stage = journey.stage, map = journey.maps[stage];
  const goals: [boolean, string][] = expeditionHere
    ? [[expedition.stars.length === 3, `별빛 표식 ${expedition.stars.length} / 3`], [expedition.monsters.length === 2, `별빛 대련 ${expedition.monsters.length} / 2`], [false, '출구에서 이야기 문제 풀기']]
    : stage && !world?.inRoom
      ? [[map.cleared, `${s.forest === 'multiplication' ? '곱셈' : '나눗셈'} 대련 ${map.monsters.length} / ${stageMonsters(stage).length}`], [map.berries.length === stageBerries(stage).length, `숲 베리 ${map.berries.length} / ${stageBerries(stage).length}`], [map.cleared, map.cleared ? (stage === 10 && s.forest === 'multiplication' ? '출구의 구구단 햇살문 풀기' : '출구에서 다음 숲으로 가기') : STAGE_STORIES[stage - 1]]]
      : tasks as [boolean, string][];
  $('#quest-list').innerHTML = goals.map(([done, label]) => `<div class="quest ${done ? 'done' : ''}"><span>${done ? '✓' : '○'}</span>${label}</div>`).join('');
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
function closeModal() { preview?.dispose(); preview = null; $('#modal').classList.remove('shop-modal'); ($('#modal') as HTMLDialogElement).close(); if (world!) { world.setPaused(!state); world.clearInput(); } if (modalOpener?.isConnected && !modalOpener.closest('[hidden]')) modalOpener.focus(); }
function openModal(html: string, cls = '') {
  preview?.dispose(); preview = null; if (world!) { world.setPaused(true); world.clearInput(); }
  const dialog = $('#modal') as HTMLDialogElement; if (!dialog.open) modalOpener = document.activeElement as HTMLElement;
  dialog.className = cls; $('#modal-content').innerHTML = html; if (!dialog.open) dialog.showModal();
  $('#modal-content').querySelectorAll<HTMLElement>('[data-close]').forEach(el => el.onclick = () => { if (battle) exitBattle(); else closeModal(); });
}
function title(kicker: string, name: string) { return `<div class="modal-heading"><div><span class="eyebrow">${kicker}</span><h2>${name}</h2></div><button class="close" data-close aria-label="닫기">×</button></div>`; }
($('#modal') as HTMLDialogElement).addEventListener('cancel', e => { e.preventDefault(); if (battle) exitBattle(); else closeModal(); });

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
  $('#start-screen').innerHTML = `<section class="welcome-card"><div class="logo-mark">✿</div><span class="eyebrow">작은 모험, 자라는 생각</span><h1>베리숲<br><span>모험학교</span></h1><p class="intro">베리를 줍고, 곱셈과 나눗셈을 풀고.<br>나만의 모습으로 두 숲을 여행해요.</p><div id="start-avatar" class="start-avatar"></div><div class="character-picker" role="group" aria-label="캐릭터 선택">${CHARACTERS.map((c, i) => `<button class="character-choice ${i === selected ? 'selected' : ''}" data-character="${i}" aria-pressed="${i === selected}"><span class="character-dot" style="--hair:#${c.hair.toString(16)};--skin:#${c.skin.toString(16)}">${['✿', '●', '☾', '✦'][i]}</span>${c.name}</button>`).join('')}</div><p id="character-desc" class="subtle">${CHARACTERS[selected].desc} · 능력은 모두 같아요</p><label class="name-label" for="nickname-input">모험가의 이름</label><input id="nickname-input" maxlength="10" placeholder="닉네임을 적어 주세요" autocomplete="off"><p id="start-error" class="error" role="alert"></p><button class="primary start-button" id="new-game">${saved ? '새 모험 시작' : '숲으로 출발하기'} <span>→</span></button>${saved ? `<button class="secondary wide" id="continue">${escape(saved.nickname)} · Lv.${saved.level} 이어하기</button>` : ''}<button class="text-button" id="start-import">저장 파일 불러오기</button><small class="save-note">이 기기와 브라우저에 모험이 저장돼요</small></section><div class="start-world-caption"><span>❋</span> 오늘도, 새로운 모험이 기다려요</div>`;
  void showStartPreview(selected);
  document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(b => b.onclick = () => { selected = Number(b.dataset.character); document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(x => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); }); $('#character-desc').textContent = `${CHARACTERS[selected].desc} · 능력은 모두 같아요`; void showStartPreview(selected); });
  $('#new-game').onclick = () => {
    const nickname = $('#nickname-input') as HTMLInputElement; let next: Save;
    try { next = newSave(nickname.value, selected); } catch (e) { $('#start-error').textContent = (e as Error).message; nickname.focus(); return; }
    if (saved) confirmAction('새 모험을 시작할까요?', '현재 저장된 모험이 새 모험으로 바뀌어요. 먼저 저장 파일을 내려받을 수도 있어요.', () => begin(next, true), true); else begin(next, true);
  };
  $('#nickname-input').onkeydown = e => { if (e.key === 'Enter') $('#new-game').click(); };
  if (saved) $('#continue').onclick = () => begin(structuredClone(saved!), false);
  $('#start-import').onclick = () => ($('#import-file') as HTMLInputElement).click();
  if (storageError) $('#start-error').textContent = '이전 저장을 읽지 못했어요. 저장 파일을 불러오거나 새 모험을 시작할 수 있어요.';
}
async function begin(s: Save, fresh: boolean) {
  const launch = document.querySelector<HTMLButtonElement>('#new-game, #continue'); if (launch) { launch.disabled = true; launch.textContent = '숲을 준비하고 있어요…'; }
  try { await loadWorld(); } catch { $('#start-error').textContent = '3D 숲을 열지 못했어요. 최신 Chrome 또는 Edge에서 다시 시도해 주세요.'; if (launch) launch.disabled = false; return; }
  sessionExpired = false; sessionElapsed = 0; sessionCorrect = 0; sessionWrong = 0;
  closeModal(); startPreviewRequest++; startPreview?.dispose(); startPreview = null; state = s; preview?.dispose(); preview = null; $('#start-screen').hidden = true; $('#hud').hidden = false;
  world.restore(s); world.setActive(true); audio.music = s.settings.music; audio.effects = s.settings.sound; audio.start(); refresh(); persist();
  if (fresh) openGuide(); else toast(`${s.nickname}, 다시 만나 반가워요!`);
}
function showSessionSummary() {
  if (!state) return; sessionExpired = false; world.setPaused(true); world.clearInput(); persist();
  const mins = Math.floor(sessionElapsed / 60), secs = sessionElapsed % 60;
  openModal(title('오늘의 모험 정리', '오늘도 한 뼘 자랐어요!') + `<div class="arena-intro"><div class="arena-symbol">🌟</div><p>함께한 시간 <b>${mins}분 ${secs}초</b><br>맞힌 문제 <b>${sessionCorrect}개</b> · 다시 도전한 문제 <b>${sessionWrong}개</b><br>지금까지 모은 틀린 문제 <b>${state.learning.wrongQuestions.length}개</b></p><p class="note">모험과 학습 기록은 이 브라우저에 저장했어요.</p><button class="secondary wide" id="session-review">틀린 문제 다시 보기</button><button class="primary wide" id="session-finish">오늘은 여기까지</button></div>`);
  $('#session-review').onclick = () => openReview();
  $('#session-finish').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
function openGuide() {
  openModal(title('마을 대장 · 연태쌤', '베리숲에 온 걸 환영해요!') + `<div class="guide-content"><p>나는 연태쌤이야. 모험의 문에서 <strong>나눗셈의 숲</strong>과 <strong>곱셈의 숲</strong> 중 하나를 골라 보렴. 각 숲의 친구들을 모두 만나면 다음 길이 열린단다.</p><ol><li><b>🍓 스테이지 베리</b><span>한 번 모은 베리는 그 숲의 그 사냥터에서 다시 나타나지 않아. 다른 숲과 새 단계에는 새로운 베리가 있어!</span></li><li><b>🌳 베리나무</b><span>나무 가까이에서 F 또는 나무 베기를 눌러 보렴. 다 베면 2~4베리가 나오고, 좋은 무기일수록 빨라!</span></li><li><b>🌿 두 가지 계산 모험</b><span>나눗셈은 몇십과 몇백을 나누고, 곱셈은 구구단부터 두 자리 수 곱셈까지 배워요.</span></li><li><b>✨ 마을 상점과 인벤토리</b><span>강지후의 무기, 오지후의 옷, 나현이의 라이딩, 윤준의 펫을 모아 봐. 가영이에게는 헤어와 성형을 바꿀 수 있어.</span></li></ol><p class="note">키보드는 WASD·방향키 이동, Space 점프, E 대화, F 나무 베기예요.<br>휴대폰과 태블릿은 화면 아래 조이스틱과 버튼을 사용해요.</p><button class="primary wide" data-close>좋아, 모험을 떠나자!</button></div>`);
}
async function loadWorld() {
  if (world!) return;
  try {
    const module = await import('./world'); AvatarPreviewRuntime = module.AvatarPreview; world = new module.World($('#world'));
    world.onCollect = id => { if (!state) return; const value = collectBerry(state, id); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🍓 베리 +${value}`); };
    world.onStar = id => { if (!state || !collectExpeditionStar(state, id)) return; audio.play('berry'); refresh(); persist(); toast(`✦ 별빛 표식 ${state.expedition.active!.stars.length} / 3`); };
    world.onJump = () => audio.play('jump'); world.onRescue = () => toast('폭신한 길로 돌아왔어요. 다시 가 볼까요?');
    world.onNear = (name, id) => { $('#interact').hidden = !name; $('#interact').textContent = name ? id?.startsWith('tree') ? `${name} · F로 휘두르기` : `${name} · 대화하기 E` : ''; $('#touch-talk').textContent = name?.includes('슬라임') || name?.includes('요정') || name?.includes('토끼') || name?.includes('정령') ? '대련' : '대화'; };
    world.onAttack = id => { if (!state) return; if (!id) { audio.play('swing'); return; } const result = world.hitTree(id, treeDamage(state)); if (!result) return; audio.play('chop'); if (!result.fell) { toast(`통통! 나무가 흔들렸어요 · ${result.remaining}만큼 남았어요`); return; } const reward = (2 + Math.floor(Math.random() * 3)) as 2 | 3 | 4, value = fellTree(state, Number(id.slice(4)), reward); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🌳 나무를 베었어요! 🍓 +${value}베리`); };
    world.onInteract = id => { if (!state) return; const journey = journeyFor(state); if (id.startsWith('tree')) world.attack(); else if (id === 'guide') openGuide(); else if (id === 'weapon' || id === 'outfit') openShop(id); else if (id === 'ride') openInventory('ride'); else if (id === 'pet') openPetShop(); else if (id === 'potion') openPotionShop(); else if (id === 'beauty') openBeauty(); else if (id === 'arena') openArena(); else if (id === 'journey') openStageMap(); else if (id === 'room') { world.enterRoom(state); refresh(); persist(); toast('나의 포근한 방에 도착했어요. 문으로 가면 마을로 돌아가요!'); } else if (id === 'roomDecor') openRoom(); else if (id === 'roomExit') { state.position = { x: 0, z: 8 }; world.loadStage(state, true); refresh(); persist(); toast('베리숲 마을로 돌아왔어요!'); } else if (id === 'village') switchStage(0); else if (id === 'next') openNextGate(); else if (id.startsWith('expMonster')) { const monsterId = Number(id.slice('expMonster'.length)), monster = stageMonsters(state.journey.stage)[monsterId]; if (state.forest === 'division' && state.expedition.active && monster) startBattle(monster.type, false, id); } else if (id.startsWith('monster')) { const huntId = Number(id.slice(7)); startBattle(stageMonsters(journey.stage)[huntId].type, false, id); } };
  } catch (e) {
    root.innerHTML = `<div class="fallback"><h1>숲을 그리지 못했어요</h1><p>3D 화면을 지원하는 최신 Chrome 또는 Edge에서 열어 주세요. 브라우저의 그래픽 가속이 켜져 있는지도 확인해 주세요.</p><button onclick="location.reload()">다시 열기</button></div>`; throw e;
  }
}
$('#interact').onclick = () => world.interact(); $('#touch-talk').onclick = () => world.interact(); $('#touch-attack').onpointerdown = e => { e.preventDefault(); world.attack(); }; $('#touch-jump').onpointerdown = e => { e.preventDefault(); world.jump(); };
const joystick = $('#joystick'); let pointerId: number | null = null;
function moveJoystick(e: PointerEvent) { if (e.pointerId !== pointerId) return; const r = joystick.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width * .32), z = (e.clientY - r.top - r.height / 2) / (r.height * .32); const n = Math.hypot(x, z); if (n > 1) { x /= n; z /= n; } world.moveStick(x, z); $('#stick').style.transform = `translate(${x * 30}px, ${z * 30}px)`; }
joystick.onpointerdown = e => { pointerId = e.pointerId; joystick.setPointerCapture(e.pointerId); moveJoystick(e); }; joystick.onpointermove = moveJoystick;
const resetJoystick = () => { pointerId = null; world.moveStick(0, 0); $('#stick').style.transform = ''; }; joystick.onpointerup = resetJoystick; joystick.onpointercancel = resetJoystick; joystick.onlostpointercapture = resetJoystick;

function openArena() {
  if (!state) return;
  openModal(title('신비의 대련장', '다섯 번의 작은 도전') + `<div class="arena-intro"><div class="arena-symbol">✦</div><p>몬스터 5마리와 차례로 나눗셈 대련을 해요.<br>시간제한 없이, 천천히 생각해도 괜찮아요.</p><div class="stat-row"><div><small>나의 최고 점수</small><strong>${state.best}점</strong></div><div><small>지금 무기의 점수 배율</small><strong>×${(WEAPONS[state.weapon].multiplier + state.weapons[state.weapon] * .1).toFixed(1)}</strong></div></div><p class="note">도중에 쉬어도 이미 얻은 베리와 경험치는 그대로예요.</p><button class="primary wide" id="arena-start">대련 시작하기</button></div>`);
  $('#arena-start').onclick = () => startBattle(Math.floor(Math.random() * MONSTERS.length), true, 'arena');
}
function openStageMap(forest?: ForestKind) {
  if (!state) return; const s = state;
  if (!forest) {
    const divisionDone = s.journey.maps.slice(1).filter(m => m.cleared).length, multiplicationDone = s.multiplicationJourney.maps.slice(1).filter(m => m.cleared).length;
    openModal(title('연태쌤의 모험 지도', '어느 숲으로 떠날까요?') + `<p class="shop-explainer">두 숲은 베리·레벨·장비를 함께 사용하고, 통과 기록과 보상은 따로 저장돼요.</p><div class="forest-choice"><button class="forest-card division" data-forest="division"><span>🌿</span><strong>나눗셈의 숲</strong><small>몇십과 몇백을 똑같이 나누어요</small><b>${divisionDone} / 10단계 통과</b></button><button class="forest-card multiplication" data-forest="multiplication"><span>🌻</span><strong>곱셈의 숲</strong><small>구구단부터 두 자리 수 곱셈까지</small><b>${multiplicationDone} / 10단계 통과</b></button></div>${expeditionUnlocked(s) ? '<button id="map-expedition" class="secondary wide">✦ 나눗셈 숲 별빛 재탐험과 칭호</button>' : ''}`);
    document.querySelectorAll<HTMLButtonElement>('[data-forest]').forEach(button => button.onclick = () => openStageMap(button.dataset.forest as ForestKind));
    const exp = document.querySelector<HTMLButtonElement>('#map-expedition'); if (exp) exp.onclick = openExpeditionBoard;
    return;
  }
  const journey = journeyFor(s, forest), isMultiplication = forest === 'multiplication';
  openModal(title(isMultiplication ? '해바라기 곱셈 지도' : '나눗셈 모험 지도', '10개의 사냥터') + `<button id="forest-back" class="text-button">← 다른 숲 고르기</button><p class="shop-explainer">${isMultiplication ? '따뜻한 햇살길에서 구구단부터 두 자리 수 곱셈까지 차근차근 만나 봐요.' : '새 사냥터일수록 나눗셈이 조금씩 어려워져요.'} 한 단계의 몬스터를 모두 만나면 다음 길이 열려요.</p><div class="stage-grid ${isMultiplication ? 'multiplication-map' : ''}">${STAGES.map((stage, i) => { const step = i + 1, progress = journey.maps[step], open = canEnter(s, step, forest), complete = progress.cleared; const range = isMultiplication ? multiplicationStageLabel(step) : STAGE_STORIES[i]; return `<button class="stage-card ${complete ? 'cleared' : ''}" data-stage="${step}" ${open ? '' : 'disabled'}><span class="stage-number">${complete ? '✓' : step}</span><strong>${isMultiplication ? '🌻 ' : ''}${stage.name}</strong><small>${range}</small><small>${open ? complete ? '통과 완료 · 다시 탐험' : `${progress.monsters.length} / ${stageMonsters(step).length} 친구와 만나기` : '앞 단계를 먼저 통과해요'}</small></button>`; }).join('')}</div>`);
  $('#forest-back').onclick = () => openStageMap();
  document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b => b.onclick = () => switchStage(Number(b.dataset.stage), forest));
}
function multiplicationStageLabel(stage: number) {
  if (stage === 1) return '2~5끼리 곱하기'; if (stage === 2) return '2~9 구구단'; if (stage === 3) return '몇십 × 2~5'; if (stage === 4) return '몇십 × 2~9'; if (stage === 5) return '두 자리 수 × 2~4 · 받아올림 없음'; if (stage === 6) return '두 자리 수 × 2~4 · 받아올림'; if (stage <= 8) return '11~79 × 2~6 · 받아올림'; return '11~99 × 2~9 · 복습 문제도 만나요';
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
function switchStage(stage: number, forest: ForestKind = state?.forest ?? 'division') {
  if (!state || !canEnter(state, stage, forest)) return; state.forest = forest; journeyFor(state).stage = stage; state.position = stage === 0 ? { x: 0, z: 8 } : { x: 0, z: 26 }; world.loadStage(state, true); closeModal(); refresh(); persist(); toast(stage ? `${forest === 'multiplication' ? '곱셈의 숲' : '나눗셈의 숲'} ${stage}단계 · ${STAGES[stage - 1].name}에 도착했어요!` : '베리숲 마을로 돌아왔어요.');
}
function openNextGate() {
  if (!state) return; const journey = journeyFor(state), stage = journey.stage, map = journey.maps[stage], total = stageMonsters(stage).length;
  if (state.forest === 'division' && state.expedition.active?.stage === stage) { if (!canFinishExpedition(state)) { const active = state.expedition.active; toast(`표식 ${3 - active.stars.length}개와 대련 ${2 - active.monsters.length}번을 더 마쳐요.`); return; } startExpeditionGate(); return; }
  if (!map.cleared) { toast(`사냥터 친구 ${total - map.monsters.length}명을 더 만나야 해요.`); return; }
  if (stage === 10 && state.forest === 'multiplication') { if (state.multiplicationCompleted) { openModal(title('해바라기 편지', '곱셈의 숲을 모두 밝혔어요!') + '<div class="arena-intro"><div class="arena-symbol">🌻</div><p>이미 곱셈숲 탐험가 칭호와 구구단 해바라기 화분을 받았어요.<br>방 꾸미기에서 화분을 눌러 놓아 보세요!</p><button class="primary wide" data-close>숲에서 더 놀기</button></div>'); } else startMultiplicationGate(); return; }
  if (stage === 10) { openModal(title('연태쌤의 축하', '열 개의 사냥터를 모두 통과했어요!') + `<div class="arena-intro"><div class="arena-symbol">🌈</div><p>베리숲의 모든 길을 걸으며 나눗셈 친구들을 만났어요.<br>대단해요! 다음 업데이트도 기대해 주세요.<br>이제 별빛 재탐험도 시작할 수 있어요!</p><button id="celebrate-expedition" class="primary wide">✦ 별빛 재탐험 시작하기</button><button class="secondary wide" data-close>숲에서 더 놀기</button></div>`); $('#celebrate-expedition').onclick = openExpeditionBoard; return; }
  switchStage(stage + 1, state.forest);
}
function startBattle(monster: number, arena: boolean, id: string) {
  if (!state) return; const journey = journeyFor(state), operation = !arena && state.forest === 'multiplication' ? 'multiplication' : 'division', cleared = journey.maps.slice(1).filter(map => map.cleared).length, difficultyStage = arena ? Math.min(10, cleared + 1) : journey.stage; const huntId = id.startsWith('monster') ? Number(id.slice(7)) : -1; battle = { encounter: new Encounter(monster, arena, state.level, undefined, difficultyStage, state.settings.maxDividend, operation, state.settings.multiplicationRange), id, kind: id.startsWith('expMonster') ? 'expMonster' : 'normal', round: 1, goalRounds: monsterBattleRounds(monster, arena), score: 0, result: null, story: operation === 'multiplication' && multiplicationUsesStory(huntId) }; renderBattle();
}
function startMultiplicationGate() {
  if (!state) return; const gate = startMultiplicationFinal(state); if (!gate) return;
  const encounter = new Encounter(0, false, state.level, undefined, 10, state.settings.maxDividend, gate.step === 0 ? 'multiplication' : 'division', state.settings.multiplicationRange);
  encounter.question = gate.step === 0 ? { dividend: gate.left, divisor: gate.right, answer: gate.left * gate.right, operation: 'multiplication' } : { dividend: gate.left * gate.right, divisor: gate.right, answer: gate.left, operation: 'division' };
  battle = { encounter, id: 'multiplicationGate', kind: 'multiplicationGate', round: gate.step + 1, score: 0, result: null }; renderBattle(); persist();
}
function startExpeditionGate() {
  if (!state?.expedition.active || !canFinishExpedition(state)) return;
  const active = state.expedition.active, encounter = new Encounter(0, false, state.level, undefined, active.stage, state.settings.maxDividend);
  encounter.question = { ...active.gateQuestion };
  battle = { encounter, id: 'expGate', kind: 'expGate', round: 1, score: 0, result: null }; renderBattle();
}
function renderBattle() {
  if (!battle || !state) return; const b = battle, e = b.encounter, m = MONSTERS[e.monster], q = e.question, reward = rewardFor(state, e.monster, e.arena), multiplication = q.operation === 'multiplication', symbol = multiplication ? '×' : '÷', operationName = multiplication ? '곱셈' : '나눗셈';
  const story = b.story && multiplication ? `<p class="expedition-story">해바라기 씨앗이 한 봉지에 ${q.dividend}개씩 들어 있어요. ${q.divisor}봉지에는 모두 몇 개가 있을까요?</p>` : '';
  const linked = b.kind === 'multiplicationGate' && state.multiplicationFinal?.step === 1 ? `<div class="linked-equation">방금 푼 식: <b>${state.multiplicationFinal.left} × ${state.multiplicationFinal.right} = ${state.multiplicationFinal.left * state.multiplicationFinal.right}</b></div>` : '';
  const challenge = !e.arena && (b.goalRounds ?? 1) > 1;
  openModal(title(e.arena ? `신비의 대련장 · ${b.round} / 5` : b.kind === 'multiplicationGate' ? '구구단 햇살문' : challenge ? `연속 수학 대련 · ${b.round} / ${b.goalRounds}` : `숲속 친구와 ${operationName}`, m.name) + `<div class="battle-top"><span>${multiplication ? '🌻' : '🌱'} ${e.arena ? `이번 도전 ${b.score}점` : challenge ? `${b.goalRounds}문제를 모두 풀면 통과해요` : `${e.stage ? `${e.stage}단계 난이도` : '마을 연습 문제'} · 천천히 생각해요`}</span><span>🍓 ${reward.berries} · 경험치 ${reward.xp}</span></div><div class="monster-portrait ${multiplication ? 'multiplication-portrait' : ''}" id="monster-portrait" style="--monster-color:#${m.color.toString(16).padStart(6, '0')}"><span class="battle-spark one">✦</span><span class="battle-spark two">✦</span><div class="monster-icon" aria-hidden="true">${b.kind === 'multiplicationGate' ? '🌻' : m.icon}</div><div class="monster-speech"><strong>${b.kind === 'multiplicationGate' ? '햇살문의 안내자' : m.name}</strong><span>${challenge ? `문제 ${b.round}/${b.goalRounds} · 끝까지 같이 풀어 봐!` : `${operationName}으로 힘을 보여 줘!`}</span></div></div>${linked}${story}<div class="question" aria-label="${q.dividend} ${multiplication ? '곱하기' : '나누기'} ${q.divisor}"><b>${q.dividend}</b><span>${symbol}</span><b>${q.divisor}</b><span>=</span><input id="answer" aria-label="${operationName}의 답" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="?" readonly></div><p class="answer-message" id="answer-message" role="status">${multiplication ? '모두 몇 개가 될까요?' : '몇씩 나누어 줄 수 있을까요?'}</p><div id="hint" hidden></div><div class="number-pad" aria-label="숫자판">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '지우기', 0, '확인'].map(n => `<button data-number="${n}" class="${n === '확인' ? 'primary' : ''}">${n}</button>`).join('')}</div><div class="battle-footer"><button id="show-hint" class="text-button">💡 힌트 보기</button><button class="text-button" data-close>잠깐 쉬기</button></div><div id="battle-result" hidden></div>`, 'battle-modal');
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
  $('#show-hint').onclick = showHint; $('#answer').focus();
}
function showHint() {
  if (!battle) return; const q = battle.encounter.question;
  $('#hint').hidden = false;
  if (q.operation === 'multiplication') {
    if (q.dividend < 10) {
      $('#hint').innerHTML = `<p><b>${q.dividend}개씩 ${q.divisor}줄</b>로 놓아 볼게요.</p><div class="multiplication-array" style="--columns:${q.dividend}">${Array.from({ length: q.answer }, () => '<i></i>').join('')}</div><b>${q.dividend} + ${q.dividend} + ${q.dividend}${q.divisor > 3 ? ' + …' : ''} = ${q.answer}</b><p>${q.dividend} × ${q.divisor} = ${q.answer}</p>`;
    } else {
      const tens = Math.floor(q.dividend / 10) * 10, ones = q.dividend % 10;
      $('#hint').innerHTML = `<p>${q.dividend}을 <b>${tens}</b>과 <b>${ones}</b>으로 나누어 곱해요.</p><div class="split-hint"><span>${tens} × ${q.divisor} = ${tens * q.divisor}</span><span>${ones} × ${q.divisor} = ${ones * q.divisor}</span></div><b>${tens * q.divisor} + ${ones * q.divisor} = ${q.answer}</b><p>${q.dividend} × ${q.divisor} = ${q.answer}</p>`;
    }
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
  const input = $('#answer') as HTMLInputElement;
  if (key === '지우기') input.value = input.value.slice(0, -1); else if (key === '확인') submitAnswer(); else if (/^\d$/.test(key) && input.value.length < 3) input.value += key;
}
window.addEventListener('keydown', e => { if (!battle || battle.encounter.solved || !($('#modal') as HTMLDialogElement).open) return; if (/^\d$/.test(e.key)) { e.preventDefault(); enterAnswer(e.key); } else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); enterAnswer('지우기'); } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); enterAnswer('확인'); } });
function submitAnswer() {
  if (!battle || !state) return; const b = battle, input = $('#answer') as HTMLInputElement;
  if (!input.value) { $('#answer-message').textContent = '숫자판이나 키보드로 답을 적어 주세요.'; return; }
  const outcome = b.encounter.answer(input.value);
  if (outcome === 'ignored') return;
  if (outcome === 'wrong') { recordWrongAnswer(state, b.encounter.question); sessionWrong++; audio.play('wrong'); persist(); $('#answer-message').textContent = '괜찮아요! 묶음을 살펴보고 다시 풀어 볼까요?'; input.value = ''; showHint(); return; }
  sessionCorrect++; recordCorrectAnswer(state, b.encounter.monster); state.discoveries.outfits.includes(state.outfit) || state.discoveries.outfits.push(state.outfit); if (state.pet >= 0 && !state.discoveries.pets.includes(state.pet)) state.discoveries.pets.push(state.pet);
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
  const clearReward = (b.result as ReturnType<typeof grantReward> & { clearReward?: number }).clearReward ?? 0;
  if (b.kind === 'multiplicationGate') {
    $('#battle-result').innerHTML = `<div class="reward-banner multiplication-reward"><strong>🌻 곱셈의 숲 완전 정복!</strong><p>「곱셈숲 탐험가」 칭호를 얻었어요.</p><p>나의 방에 놓을 수 있는 <b>구구단 해바라기 화분</b>도 받았어요!</p><p>두 식이 서로 도와주는 곱셈과 나눗셈의 짝을 찾아냈어요.</p></div><button class="primary wide" id="next-battle">마을로 돌아가기 →</button>`;
    $('#next-battle').onclick = nextBattle; $('#next-battle').focus(); return;
  }
  if (b.kind !== 'normal') {
    $('#battle-result').innerHTML = `<div class="reward-banner"><strong>${b.kind === 'expGate' ? '🌟 별빛 원정 완수!' : '✦ 별빛 대련 성공!'}</strong><p>${b.kind === 'expGate' ? `🍓 완주 보상 +${b.result.berries}베리! 원정 ${state.expedition.completed}번을 완료했어요. ${b.newTitle && b.newTitle > 0 ? `새 칭호 「${EXPEDITION_TITLES[b.newTitle].name}」도 얻었어요!` : '다음 원정도 바로 떠날 수 있어요.'}` : `대련 ${state.expedition.active?.monsters.length ?? 2} / 2 · 출구까지 가 볼까요?`}</p><p>${b.kind === 'expGate' ? '별빛 원정의 새 완주 보상만 받아요. 예전에 받은 사냥터 보상은 다시 받지 않아요.' : '출구 문제까지 풀면 원정 완주 베리를 받아요.'}</p></div><button class="primary wide" id="next-battle">${b.kind === 'expGate' ? '다음 원정 고르기 →' : '숲으로 돌아가기'}</button>`;
    $('#next-battle').onclick = nextBattle; $('#next-battle').focus(); return;
  }
  $('#battle-result').innerHTML = `<div class="reward-banner"><strong>${b.encounter.question.operation === 'multiplication' ? '🌻 멋진 곱셈!' : '✨ 멋진 나눗셈!'}</strong><p>🍓 +${b.result.berries}베리 · 경험치 +${b.result.xp}${b.encounter.arena ? ` · +${b.result.score}점` : ''}</p>${!b.encounter.arena && clearReward ? `<p class="level-up">사냥터 통과! 추가 +${clearReward}베리와 다음 길을 받았어요.</p>` : ''}${b.result.levels ? `<p class="level-up">레벨 ${state.level}! 선물 ${b.result.levels * 20}베리도 받았어요.</p>` : ''}${b.result.milestones.map(gift => `<p class="level-easter-egg">🎁 비밀 선물 발견! 레벨 ${gift.level} 달성 · ${gift.berries.toLocaleString()}베리를 받았어요!</p>`).join('')}</div><button class="primary wide" id="next-battle">${b.encounter.arena ? b.round < 5 ? '다음 친구 만나기 →' : '대련 결과 보기' : '숲으로 돌아가기'}</button>`;
  $('#next-battle').onclick = nextBattle; $('#next-battle').focus();
}
function nextBattle() {
  if (!battle || !state || !battle.encounter.solved) return;
  if (sessionExpired) { battle = null; showSessionSummary(); return; }
  if (battle.kind === 'multiplicationGate') { battle = null; switchStage(0, 'multiplication'); openModal(title('해바라기 편지', '곱셈의 숲을 모두 밝혔어요!') + '<div class="arena-intro"><div class="arena-symbol">🌻</div><p>곱셈숲 탐험가가 된 것을 축하해요!<br>새 해바라기 화분은 나의 방에서 눌러 설치할 수 있어요.</p><button class="primary wide" data-close>마을에서 계속 놀기</button></div>'); return; }
  if (battle.kind === 'expGate') { battle = null; switchStage(0); openExpeditionBoard(); return; }
  if (!battle.encounter.arena) { battle = null; closeModal(); return; }
  if (battle.round === 5) { const score = battle.score; battle = null; openModal(title('오늘도 한 뼘 자랐어요', '대련을 마쳤어요!') + `<div class="arena-intro"><div class="arena-symbol">🏆</div><h3>${score}점</h3><p>다섯 친구와의 나눗셈 대련 성공!<br>나의 최고 기록은 ${state.best}점이에요.</p><button class="primary wide" data-close>마을로 돌아가기</button></div>`); return; }
  const previous = battle.encounter.question, difficultyStage = battle.encounter.stage; battle.round++; battle.encounter = new Encounter(Math.floor(Math.random() * MONSTERS.length), true, state.level, previous, difficultyStage, state.settings.maxDividend); battle.result = null; battle.story = battle.round % 3 === 0; renderBattle();
}
function continueFriendBattle() {
  if (!battle || !state || !battle.encounter.solved || battle.round >= (battle.goalRounds ?? 1)) return;
  const previous = battle.encounter.question, operation = previous.operation ?? 'division'; battle.round++;
  battle.encounter = new Encounter(battle.encounter.monster, false, state.level, previous, battle.encounter.stage, state.settings.maxDividend, operation, state.settings.multiplicationRange); battle.result = null; renderBattle();
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
    const ownedIds = tab === 'outfit' ? Object.keys(s.outfits).map(Number) : tab === 'pet' ? Object.keys(s.pets).map(Number) : RIDES.map((_, id) => id);
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

const FURNITURE = ['🍄 버섯 의자', '🪴 새싹 화분', '🧸 곰 인형', '🪟 둥근 창문', '🛏 구름 침대', '📚 모험 책장', '🕯 별빛 조명', '🧺 베리 바구니', '🌻 구구단 해바라기 화분'];
function furnitureUnlocked(s: Save, id: number) { if (id === 8) return s.teacherMode || s.multiplicationCompleted; const progress = s.discoveries.monsters.length + s.discoveries.pets.length + s.journey.maps.slice(1).filter(m => m.cleared).length + s.multiplicationJourney.maps.slice(1).filter(m => m.cleared).length; return id < Math.min(8, progress); }
function openRoom() {
  if (!state) return;
  const placed = state.room.furniture, unlockedFurniture = FURNITURE.filter((_, id) => furnitureUnlocked(state!, id)).length;
  openModal(title('나만의 작은 방', '모험가의 포근한 집') + `<p class="shop-explainer">가구를 누르면 왼쪽의 진짜 3D 방에 바로 놓여요. 한 번 더 누르면 치워져요. 놓은 가구는 자동 저장돼요.</p><p class="room-status">지금 방에 놓인 가구 ${placed.length}개 · 발견한 가구 ${unlockedFurniture}개</p><div class="item-grid room-items">${FURNITURE.map((item, id) => { const unlocked = furnitureUnlocked(state!, id); return `<button class="item-card ${placed.includes(id) ? 'selected' : ''}" data-furniture="${id}" ${unlocked ? '' : 'disabled'}><span class="item-swatch">${item.split(' ')[0]}</span><strong>${item.split(' ').slice(1).join(' ')}</strong><small>${placed.includes(id) ? '방에 놓였어요 · 다시 누르면 치워요' : unlocked ? '발견했어요 · 누르면 방에 놓여요' : id === 8 ? '곱셈의 숲 10단계와 햇살문을 통과하면 받아요' : '친구를 더 만나면 열려요'}</small></button>`; }).join('')}</div><button class="primary wide" data-close>3D 방 둘러보기</button>`, 'room-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-furniture]').forEach(button => button.onclick = () => { const id = Number(button.dataset.furniture); if (!furnitureUnlocked(state!, id)) return; const list = state!.room.furniture; const removing = list.includes(id); state!.room.furniture = removing ? list.filter(x => x !== id) : [...list, id]; world.updateRoomFurniture(state!); persist(); openRoom(); toast(`${FURNITURE[id]} ${removing ? '치웠어요' : '방에 놓았어요'}!`); });
}
function openNotebook() {
  if (!state) return; const seenM = state.discoveries.monsters, seenP = state.discoveries.pets, seenO = state.discoveries.outfits;
  openModal(title('모험 발견 기록', '숲속 도감') + `<div class="codex-list"><h3>🌱 몬스터 친구 ${seenM.length}/${MONSTERS.length}</h3><p>${MONSTERS.map((m, i) => `${seenM.includes(i) ? m.icon : '❔'} ${seenM.includes(i) ? m.name : '아직 못 만났어요'}`).join('　')}</p><h3>🐾 펫 친구 ${seenP.length}/${PETS.length}</h3><p>${PETS.map((p, i) => `${seenP.includes(i) ? p.icon : '❔'} ${seenP.includes(i) ? p.name : '아직 못 만났어요'}`).join('　')}</p><h3>👗 옷 ${seenO.length}/${OUTFITS.length}</h3><p>${OUTFITS.map((o, i) => `${seenO.includes(i) ? OUTFIT_ICONS[i] : '❔'} ${seenO.includes(i) ? o.name : '아직 못 발견했어요'}`).join('　')}</p></div><button class="secondary wide" id="review-wrong">틀린 문제 다시 풀기 (${state.learning.wrongQuestions.length})</button>`);
  $('#review-wrong').onclick = () => openReview();
}
function openReview(index = 0) {
  if (!state) return; const items = state.learning.wrongQuestions;
  if (!items.length) { openModal(title('계산 복습', '아직 다시 풀 문제가 없어요') + '<p>문제를 틀려도 괜찮아요. 모험 중 틀린 곱셈과 나눗셈은 여기에 차곡차곡 모여요!</p>'); return; }
  const q = items[index % items.length], multiplication = q.operation === 'multiplication', symbol = multiplication ? '×' : '÷';
  openModal(title(`틀린 문제 복습 · ${index + 1}/${items.length}`, '이번에는 풀 수 있어요!') + `<span class="operation-badge">${multiplication ? '🌻 곱셈' : '🌿 나눗셈'}</span><div class="question"><b>${q.dividend}</b><span>${symbol}</span><b>${q.divisor}</b><span>=</span><input id="review-answer" inputmode="numeric" maxlength="3" aria-label="답"></div><p id="review-message" class="answer-message">천천히 생각해 보세요. 베리나 경험치는 걸리지 않아요.</p><button class="secondary wide" id="review-hint">💡 ${multiplication ? `${q.dividend}을 ${q.divisor}번 더해 봐요` : `${q.divisor} × □ = ${q.dividend} 를 생각해 봐요`}</button><button class="primary wide" id="review-check">답 확인하기</button><button class="text-button wide" id="review-next">다른 문제 보기</button>`);
  $('#review-hint').onclick = () => { $('#review-message').textContent = multiplication ? `${q.dividend}씩 ${q.divisor}묶음이면 ${q.dividend} × ${q.divisor} = ${q.answer}예요.` : `${q.divisor}를 몇 번 더하면 ${q.dividend}이 될까요? ${q.divisor} × ${q.answer} = ${q.dividend}`; };
  $('#review-check').onclick = () => { const answer = ($('#review-answer') as HTMLInputElement).value; $('#review-message').textContent = Number(answer) === q.answer ? '맞았어요! 다시 풀어낸 용기가 멋져요. 🌟' : '괜찮아요. 힌트를 보고 한 번 더 생각해 봐요.'; if (Number(answer) === q.answer) { state!.learning.wrongQuestions = items.filter((_, i) => i !== index); persist(); } };
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
  if (state) persist(); const s = state ?? saved; if (!s) return; const url = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = '베리숲-모험저장.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('모험 저장 파일을 내려받았어요.');
}
function confirmAction(heading: string, description: string, action: () => void, backup = false) {
  openModal(title('모험 기록', heading) + `<p>${description}</p>${backup ? '<button class="secondary wide" id="backup">현재 모험 내려받기</button>' : ''}<div class="confirm-row"><button class="secondary" data-close>취소</button><button class="primary" id="confirm-action">확인</button></div>`);
  if (backup) $('#backup').onclick = exportSave; $('#confirm-action').onclick = action;
}
function openSettings() {
  if (!state) return; persist();
  openModal(title('나의 모험 수첩', '설정과 저장') + `<div class="settings-list"><label><span>배경음악<small>잔잔한 숲속 멜로디</small></span><input id="music-toggle" type="checkbox" ${state.settings.music ? 'checked' : ''}></label><label><span>효과음<small>베리와 정답 알림</small></span><input id="sound-toggle" type="checkbox" ${state.settings.sound ? 'checked' : ''}></label><label><span>가벼운 화면<small>그림자를 줄여 태블릿에서 부드럽게</small></span><input id="quality-toggle" type="checkbox" ${state.settings.lowQuality ? 'checked' : ''}></label></div><div class="teacher-code ${state.teacherMode ? 'enabled' : ''}"><div><strong>🧑‍🏫 교사용 코드</strong><small>${state.teacherMode ? '선생님 모드 활성화됨 · 아래에서 수업 범위를 정할 수 있어요' : '수업 시연용 코드를 입력하세요'}</small></div><div class="teacher-input"><input id="teacher-code" type="password" autocomplete="off" placeholder="교사용 코드"><button id="teacher-unlock" class="secondary">입력</button></div><p class="error" id="teacher-error" role="alert"></p></div>${state.teacherMode ? `<div class="settings-list teacher-options"><label><span>나눗셈 문제 범위<small>자동은 지금 스테이지의 난이도를 따라요</small></span><select id="question-range"><option value="0" ${state.settings.maxDividend === 0 ? 'selected' : ''}>스테이지에 맞추기</option><option value="90" ${state.settings.maxDividend === 90 ? 'selected' : ''}>몇십까지만</option><option value="180" ${state.settings.maxDividend === 180 ? 'selected' : ''}>몇백까지 허용</option></select></label><label><span>곱셈 문제 범위<small>구구단만을 고르면 어느 단계에서도 한 자리 수끼리 곱해요</small></span><select id="multiplication-range"><option value="stage" ${state.settings.multiplicationRange === 'stage' ? 'selected' : ''}>단계에 맞추기</option><option value="tables" ${state.settings.multiplicationRange === 'tables' ? 'selected' : ''}>구구단만</option></select></label><label><span>한 번의 수업 시간<small>시간이 끝나면 진행 중인 문제 뒤에 요약해요</small></span><select id="session-limit">${[0, 10, 15, 20, 30, 45, 60].map(n => `<option value="${n}" ${state!.settings.sessionMinutes === n ? 'selected' : ''}>${n ? `${n}분` : '시간 제한 없음'}</option>`).join('')}</select></label><button id="notebook" class="secondary">📖 학습 요약과 틀린 문제 복습</button></div>` : ''}<p class="note">자동 저장은 이 기기와 브라우저에만 남아요. 선생님 설정도 이 기기에서만 적용됩니다. ${storageError ? '<br>자동 저장을 사용할 수 없어요. 꼭 저장 파일을 내려받아 주세요.' : ''}</p><div class="settings-buttons"><button id="export" class="secondary">저장 파일 내려받기</button><button id="import" class="secondary">저장 파일 불러오기</button><button id="help" class="secondary">조작 방법 보기</button><button id="return-title" class="secondary">처음 화면으로</button></div>`);
  for (const [id, key] of [['music', 'music'], ['sound', 'sound'], ['quality', 'lowQuality']] as const) $<HTMLInputElement>(`#${id}-toggle`).onchange = e => { state!.settings[key] = (e.target as HTMLInputElement).checked; refresh(); if (key === 'lowQuality') world.quality(state!.settings.lowQuality); persist(); };
  const range = document.querySelector<HTMLSelectElement>('#question-range'); if (range) range.onchange = () => { state!.settings.maxDividend = Number(range.value) as 0 | 90 | 180; persist(); };
  const multiplicationRange = document.querySelector<HTMLSelectElement>('#multiplication-range'); if (multiplicationRange) multiplicationRange.onchange = () => { state!.settings.multiplicationRange = multiplicationRange.value as 'stage' | 'tables'; persist(); };
  const limit = document.querySelector<HTMLSelectElement>('#session-limit'); if (limit) limit.onchange = () => { state!.settings.sessionMinutes = Number(limit.value); sessionExpired = false; persist(); };
  const notebook = document.querySelector<HTMLButtonElement>('#notebook'); if (notebook) notebook.onclick = openNotebook;
  $('#export').onclick = exportSave; $('#import').onclick = () => $<HTMLInputElement>('#import-file').click(); $('#help').onclick = openGuide;
  const unlock = () => { try { const msg = applyTeacherCode(state!, $<HTMLInputElement>('#teacher-code').value.trim()); audio.play('level'); syncAvatar(); refresh(); persist(); openSettings(); toast(msg); } catch (e) { $('#teacher-error').textContent = (e as Error).message; } }; $('#teacher-unlock').onclick = unlock; $<HTMLInputElement>('#teacher-code').onkeydown = e => { if (e.key === 'Enter') unlock(); };
  $('#return-title').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
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
  if (state && world.active && !document.hidden && (!($('#modal') as HTMLDialogElement).open || battle)) {
    sessionElapsed++; state.learning.elapsedSeconds++;
    const limit = state.settings.sessionMinutes * 60;
    if (limit > 0 && sessionElapsed >= limit && !sessionExpired) { sessionExpired = true; if (!battle) showSessionSummary(); else toast('수업 시간이 다 되었어요. 지금 문제를 마치면 오늘 기록을 보여줄게요.'); }
  }
  if (state) $('#weapon-effect').textContent = equipmentEffectText(state);
  const potionStatus = document.querySelector<HTMLElement>('#potion-status');
  if (state && potionStatus) { const effect = potionEffects(state); potionStatus.innerHTML = `지금 효과<br>${effect.berrySeconds ? `🍓 베리 ${effect.berryMultiplier}배 · ${buffTime(effect.berrySeconds)} 남음` : '🍓 베리 효과 없음'}<br>${effect.xpSeconds ? `🧪 경험치 ${effect.xpMultiplier}배 · ${buffTime(effect.xpSeconds)} 남음` : '🧪 경험치 효과 없음'}`; }
  persist();
}, 1000); window.addEventListener('pagehide', persist); document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

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
