import './style.css';
import { World, AvatarPreview } from './world';
import { newSave, validateSave, CHARACTERS, MONSTERS, OUTFITS, RIDES, WEAPONS, WEAPON_UPGRADES, OUTFIT_UPGRADES, Encounter, grantReward, rewardFor, buy, upgrade, buyRide, dismount, enableTeacherMode, collectBerry, finishHunt, fellTree, treeDamage, canEnter, type Save } from './rules';
import { STAGES, stageMonsters, stageBerries, berryValue, clearBonus } from './stages';
import { Sound } from './audio';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const root = $('#game');
root.innerHTML = `<div id="world" aria-label="베리숲 3D 마을"></div><div id="hud" hidden>
  <header class="topbar"><div class="player-card"><span class="level-badge" id="level">1</span><div><strong id="nickname"></strong><div class="xp-track"><div id="xp-fill"></div></div><small id="xp-text"></small></div></div><div class="brand-mini">베리숲 <span>모험학교</span></div><div class="top-actions"><span class="wallet">🍓 <b id="berries">0</b><span>베리</span></span><button id="inventory" class="icon-button" aria-label="내 인벤토리">🎒</button><button id="stage-map" class="icon-button" aria-label="사냥터 지도">🗺</button><button id="settings" class="icon-button" aria-label="설정과 저장">⚙</button></div></header>
  <aside class="quest-card"><span class="eyebrow">오늘의 작은 모험</span><strong id="quest-title">베리숲에 오신 걸 환영해요</strong><div id="quest-list"></div></aside>
  <div class="location-pill">❋ 베리숲 마을 <span>평화로운 오후</span></div>
  <div class="equipment-card"><span id="weapon-name"></span><small id="weapon-effect"></small></div>
  <div class="controls-help"><kbd>W A S D</kbd> 이동 <kbd>Space</kbd> 점프 <kbd>E</kbd> 대화 <kbd>F</kbd> 휘두르기</div>
  <button id="interact" class="interaction" hidden></button>
  <div id="touch-controls"><div id="joystick" role="group" aria-label="이동 조이스틱"><span id="stick"></span></div><div class="touch-actions"><button id="touch-talk">대화</button><button id="touch-attack">휘두르기</button><button id="touch-jump">점프 ↟</button></div></div>
</div><div id="start-screen" class="start-layer"></div><dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status" aria-live="polite"></div><input type="file" id="import-file" accept="application/json,.json" hidden>`;

let world: World;
try { world = new World($('#world')); } catch { root.innerHTML = `<div class="fallback"><h1>숲을 그리지 못했어요</h1><p>3D 화면을 지원하는 최신 Chrome 또는 Edge에서 열어 주세요. 브라우저의 그래픽 가속이 켜져 있는지도 확인해 주세요.</p><button onclick="location.reload()">다시 열기</button></div>`; throw new Error('WebGL renderer unavailable'); }
const audio = new Sound(), STORAGE = 'berry-forest-save-v1';
let state: Save | null = null, saved: Save | null = null, preview: AvatarPreview | null = null;
let selected = 0, pendingImport: Save | null = null, toastTimer: ReturnType<typeof setTimeout>, modalOpener: HTMLElement | null = null;
let battle: { encounter: Encounter; id: string; round: number; score: number; result: ReturnType<typeof grantReward> | null } | null = null;
let storageError = false;
const OUTFIT_ICONS = ['🌿', '🌈', '🍃', '☁️', '🌸', '🌟', '🌙', '👑', '🍓', '🐥', '🐰', '🌰', '🐱', '🐑', '🐸', '🧚'];
try { const raw = localStorage.getItem(STORAGE); if (raw) saved = validateSave(JSON.parse(raw)); } catch { storageError = true; }

function escape(s: string) { return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!); }
function toast(message: string) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function persist() {
  if (!state) return;
  const p = world.player.position; state.position = { x: p.x, z: p.z };
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); saved = structuredClone(state); } catch { if (!storageError) toast('자동 저장 공간이 부족해요. 설정에서 저장 파일을 내려받아 주세요.'); storageError = true; }
}
function refresh() {
  if (!state) return; const s = state;
  $('#level').textContent = `${s.level}`; $('#nickname').textContent = `${s.nickname}${s.teacherMode ? ' · 선생님' : ''}`; $('#berries').textContent = s.berries.toLocaleString();
  $('#xp-fill').style.width = `${s.xp / (s.level * 40) * 100}%`; $('#xp-text').textContent = `경험치 ${s.xp} / ${s.level * 40}`;
  $('#weapon-name').textContent = `${WEAPONS[s.weapon].icon} ${WEAPONS[s.weapon].name} +${s.weapons[s.weapon]} · ${OUTFITS[s.outfit].name}`;
  $('#weapon-effect').textContent = `대련 ×${(WEAPONS[s.weapon].multiplier + s.weapons[s.weapon] * .1).toFixed(1)} · 나무 힘 ${treeDamage(s)} · ${s.ride >= 0 ? `${RIDES[s.ride].icon} 속도 ×${RIDES[s.ride].speed}` : `옷: ${OUTFITS[s.outfit].effect}`}`;
  const tasks = [[s.tutorial.collected, '길 위의 베리 줍기'], [s.tutorial.battle, '나눗셈으로 몬스터 만나기'], [s.tutorial.shop, '강지후·오지후 상점 구경']];
  $('#quest-list').innerHTML = tasks.map(([done, label]) => `<div class="quest ${done ? 'done' : ''}"><span>${done ? '✓' : '○'}</span>${label}</div>`).join('');
  $('#quest-title').textContent = s.journey.stage ? `${s.journey.stage}단계 · ${STAGES[s.journey.stage - 1].name}` : tasks.every(t => t[0]) ? '모험의 문으로 사냥터에 떠나요!' : '숲과 친해지는 세 가지 방법';
  audio.music = s.settings.music; audio.effects = s.settings.sound;
}
function syncAvatar() { if (state) world.setAvatar(state.character, state.outfit, state.weapon, state.outfits[state.outfit], state.weapons[state.weapon], state.ride); }
function closeModal() { preview?.dispose(); preview = null; $('#modal').classList.remove('shop-modal'); ($('#modal') as HTMLDialogElement).close(); if (world) { world.paused = !state; world.clearInput(); } if (modalOpener?.isConnected && !modalOpener.closest('[hidden]')) modalOpener.focus(); }
function openModal(html: string, cls = '') {
  preview?.dispose(); preview = null; world.paused = true; world.clearInput();
  const dialog = $('#modal') as HTMLDialogElement; if (!dialog.open) modalOpener = document.activeElement as HTMLElement;
  dialog.className = cls; $('#modal-content').innerHTML = html; if (!dialog.open) dialog.showModal();
  $('#modal-content').querySelectorAll<HTMLElement>('[data-close]').forEach(el => el.onclick = () => { if (battle) exitBattle(); else closeModal(); });
}
function title(kicker: string, name: string) { return `<div class="modal-heading"><div><span class="eyebrow">${kicker}</span><h2>${name}</h2></div><button class="close" data-close aria-label="닫기">×</button></div>`; }
($('#modal') as HTMLDialogElement).addEventListener('cancel', e => { e.preventDefault(); if (battle) exitBattle(); else closeModal(); });

function showStart() {
  world.active = false; world.paused = true; $('#hud').hidden = true; $('#start-screen').hidden = false;
  $('#start-screen').innerHTML = `<section class="welcome-card"><div class="logo-mark">✿</div><span class="eyebrow">작은 모험, 자라는 생각</span><h1>베리숲<br><span>모험학교</span></h1><p class="intro">베리를 줍고, 나눗셈을 풀고.<br>나만의 모습으로 숲을 여행해요.</p><div id="start-avatar" class="start-avatar"></div><div class="character-picker" role="group" aria-label="캐릭터 선택">${CHARACTERS.map((c, i) => `<button class="character-choice ${i === selected ? 'selected' : ''}" data-character="${i}" aria-pressed="${i === selected}"><span class="character-dot" style="--hair:#${c.hair.toString(16)};--skin:#${c.skin.toString(16)}">${['✿', '●', '☾', '✦'][i]}</span>${c.name}</button>`).join('')}</div><p id="character-desc" class="subtle">${CHARACTERS[selected].desc} · 능력은 모두 같아요</p><label class="name-label" for="nickname-input">모험가의 이름</label><input id="nickname-input" maxlength="10" placeholder="닉네임을 적어 주세요" autocomplete="off"><p id="start-error" class="error" role="alert"></p><button class="primary start-button" id="new-game">${saved ? '새 모험 시작' : '숲으로 출발하기'} <span>→</span></button>${saved ? `<button class="secondary wide" id="continue">${escape(saved.nickname)} · Lv.${saved.level} 이어하기</button>` : ''}<button class="text-button" id="start-import">저장 파일 불러오기</button><small class="save-note">이 기기와 브라우저에 모험이 저장돼요</small></section><div class="start-world-caption"><span>❋</span> 오늘도, 새로운 모험이 기다려요</div>`;
  preview?.dispose(); preview = new AvatarPreview($('#start-avatar')); preview.show(selected, 0, 0);
  document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(b => b.onclick = () => { selected = Number(b.dataset.character); document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(x => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); }); $('#character-desc').textContent = `${CHARACTERS[selected].desc} · 능력은 모두 같아요`; preview?.show(selected, 0, 0); });
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
function begin(s: Save, fresh: boolean) {
  closeModal(); state = s; preview?.dispose(); preview = null; $('#start-screen').hidden = true; $('#hud').hidden = false;
  world.restore(s); world.active = true; world.paused = false; audio.music = s.settings.music; audio.effects = s.settings.sound; audio.start(); refresh(); persist();
  if (fresh) openGuide(); else toast(`${s.nickname}, 다시 만나 반가워요!`);
}
function openGuide() {
  openModal(title('마을 대장 · 연태쌤', '베리숲에 온 걸 환영해요!') + `<div class="guide-content"><p>나는 연태쌤이야. 사냥터의 <strong>나눗셈 친구들</strong>을 모두 만나면 다음 길이 열린단다.</p><ol><li><b>🍓 스테이지 베리</b><span>한 번 모은 베리는 그 사냥터에서 다시 나타나지 않아. 더 많은 베리는 새 사냥터에 있어!</span></li><li><b>🌳 베리나무</b><span>나무 가까이에서 F 또는 휘두르기를 눌러 보렴. 다 베면 1~2베리가 나오고, 좋은 무기일수록 빨라!</span></li><li><b>🌱 사냥터 몬스터</b><span>몬스터를 모두 물리치면 스테이지 보너스와 다음 문을 받아.</span></li><li><b>✨ 마을 상점과 인벤토리</b><span>강지후의 무기, 오지후의 옷, 나현이의 라이딩을 모아 🎒 인벤토리에서 바꿔 봐.</span></li></ol><p class="note">키보드는 WASD·방향키 이동, Space 점프, E 대화, F 휘두르기예요.<br>태블릿은 화면 아래 조이스틱과 버튼을 사용해요.</p><button class="primary wide" data-close>좋아, 모험을 떠나자!</button></div>`);
}

world.onCollect = id => { if (!state) return; const value = collectBerry(state, id); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🍓 베리 +${value}`); };
world.onJump = () => audio.play('jump'); world.onRescue = () => toast('폭신한 길로 돌아왔어요. 다시 가 볼까요?');
world.onNear = (name, id) => { $('#interact').hidden = !name; $('#interact').textContent = name ? id?.startsWith('tree') ? `${name} · F로 휘두르기` : `${name} · 대화하기 E` : ''; $('#touch-talk').textContent = name?.includes('슬라임') || name?.includes('요정') || name?.includes('토끼') || name?.includes('정령') ? '대련' : '대화'; };
world.onAttack = id => { if (!state) return; if (!id) { audio.play('swing'); return; } const result = world.hitTree(id, treeDamage(state)); if (!result) return; audio.play('chop'); if (!result.fell) { toast(`통통! 나무가 흔들렸어요 · ${result.remaining}만큼 남았어요`); return; } const reward = (Math.random() < .5 ? 1 : 2) as 1 | 2, value = fellTree(state, Number(id.slice(4)), reward); if (!value) return; audio.play('berry'); refresh(); persist(); toast(`🌳 나무를 베었어요! 🍓 +${value}베리`); };
world.onInteract = id => { if (!state) return; if (id.startsWith('tree')) world.attack(); else if (id === 'guide') openGuide(); else if (id === 'weapon' || id === 'outfit') openShop(id); else if (id === 'ride') openInventory('ride'); else if (id === 'arena') openArena(); else if (id === 'journey') openStageMap(); else if (id === 'home') switchStage(0); else if (id === 'next') openNextGate(); else { const huntId = Number(id.slice(7)); startBattle(stageMonsters(state.journey.stage)[huntId].type, false, id); } };
$('#interact').onclick = () => world.interact(); $('#touch-talk').onclick = () => world.interact(); $('#touch-attack').onpointerdown = e => { e.preventDefault(); world.attack(); }; $('#touch-jump').onpointerdown = e => { e.preventDefault(); world.jump(); };
const joystick = $('#joystick'); let pointerId: number | null = null;
function moveJoystick(e: PointerEvent) { if (e.pointerId !== pointerId) return; const r = joystick.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width * .32), z = (e.clientY - r.top - r.height / 2) / (r.height * .32); const n = Math.hypot(x, z); if (n > 1) { x /= n; z /= n; } world.moveStick(x, z); $('#stick').style.transform = `translate(${x * 30}px, ${z * 30}px)`; }
joystick.onpointerdown = e => { pointerId = e.pointerId; joystick.setPointerCapture(e.pointerId); moveJoystick(e); }; joystick.onpointermove = moveJoystick;
const resetJoystick = () => { pointerId = null; world.moveStick(0, 0); $('#stick').style.transform = ''; }; joystick.onpointerup = resetJoystick; joystick.onpointercancel = resetJoystick; joystick.onlostpointercapture = resetJoystick;

function openArena() {
  if (!state) return;
  openModal(title('별솔의 대련장', '다섯 번의 작은 도전') + `<div class="arena-intro"><div class="arena-symbol">✦</div><p>몬스터 5마리와 차례로 나눗셈 대련을 해요.<br>시간제한 없이, 천천히 생각해도 괜찮아요.</p><div class="stat-row"><div><small>나의 최고 점수</small><strong>${state.best}점</strong></div><div><small>지금 무기의 점수 배율</small><strong>×${(WEAPONS[state.weapon].multiplier + state.weapons[state.weapon] * .1).toFixed(1)}</strong></div></div><p class="note">도중에 쉬어도 이미 얻은 베리와 경험치는 그대로예요.</p><button class="primary wide" id="arena-start">대련 시작하기</button></div>`);
  $('#arena-start').onclick = () => startBattle(Math.floor(Math.random() * 4), true, 'arena');
}
function openStageMap() {
  if (!state) return; const s = state;
  openModal(title('연태쌤의 모험 지도', '10개의 사냥터') + `<p class="shop-explainer">새 사냥터일수록 베리와 몬스터 사냥 보상이 커져요. 한 스테이지의 몬스터를 모두 물리치면 다음 길이 열립니다.</p><div class="stage-grid">${STAGES.map((stage, i) => { const step = i + 1, progress = s.journey.maps[step], open = canEnter(s, step), complete = progress.cleared; return `<button class="stage-card ${complete ? 'cleared' : ''}" data-stage="${step}" ${open ? '' : 'disabled'}><span class="stage-number">${complete ? '✓' : step}</span><strong>${stage.name}</strong><small>${open ? complete ? '통과 완료 · 다시 탐험' : `${progress.monsters.length} / ${stageMonsters(step).length} 사냥` : '앞 스테이지를 통과해요'}</small></button>`; }).join('')}</div>`);
  document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b => b.onclick = () => switchStage(Number(b.dataset.stage)));
}
function switchStage(stage: number) {
  if (!state || !canEnter(state, stage)) return; state.journey.stage = stage; state.position = stage === 0 ? { x: 0, z: 8 } : { x: 0, z: 26 }; world.loadStage(state, true); closeModal(); refresh(); persist(); toast(stage ? `${stage}단계 · ${STAGES[stage - 1].name}에 도착했어요!` : '베리숲 마을로 돌아왔어요.');
}
function openNextGate() {
  if (!state) return; const stage = state.journey.stage, map = state.journey.maps[stage], total = stageMonsters(stage).length;
  if (!map.cleared) { toast(`사냥터 친구 ${total - map.monsters.length}명을 더 만나야 해요.`); return; }
  if (stage === 10) { openModal(title('연태쌤의 축하', '열 개의 사냥터를 모두 통과했어요!') + `<div class="arena-intro"><div class="arena-symbol">🌈</div><p>베리숲의 모든 길을 걸으며 나눗셈 친구들을 만났어요.<br>언제든 사냥터를 다시 탐험해 보세요!</p><button class="primary wide" data-close>신나는 모험 계속하기</button></div>`); return; }
  switchStage(stage + 1);
}
function startBattle(monster: number, arena: boolean, id: string) {
  if (!state) return; battle = { encounter: new Encounter(monster, arena, state.level), id, round: 1, score: 0, result: null }; renderBattle();
}
function renderBattle() {
  if (!battle || !state) return; const b = battle, e = b.encounter, m = MONSTERS[e.monster], q = e.question, reward = rewardFor(state, e.monster, e.arena);
  openModal(title(e.arena ? `별솔의 대련장 · ${b.round} / 5` : '숲속 친구와 나눗셈', m.name) + `<div class="battle-top"><span>🌱 ${e.arena ? `이번 도전 ${b.score}점` : '천천히 생각해도 괜찮아'}</span><span>🍓 ${reward.berries} · 경험치 ${reward.xp}</span></div><div class="monster-portrait" id="monster-portrait" style="--monster-color:#${m.color.toString(16).padStart(6, '0')}"><span class="battle-spark one">✦</span><span class="battle-spark two">✦</span><div class="monster-icon" aria-hidden="true">${m.icon}</div><div class="monster-speech"><strong>${m.name}</strong><span>나눗셈으로 힘을 보여 줘!</span></div></div><div class="question" aria-label="${q.dividend} 나누기 ${q.divisor}"><b>${q.dividend}</b><span>÷</span><b>${q.divisor}</b><span>=</span><input id="answer" aria-label="나눗셈의 답" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="?" readonly></div><p class="answer-message" id="answer-message" role="status">몇씩 나누어 줄 수 있을까요?</p><div id="hint" hidden></div><div class="number-pad" aria-label="숫자판">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '지우기', 0, '확인'].map(n => `<button data-number="${n}" class="${n === '확인' ? 'primary' : ''}">${n}</button>`).join('')}</div><div class="battle-footer"><button id="show-hint" class="text-button">💡 힌트 보기</button><button class="text-button" data-close>잠깐 쉬기</button></div><div id="battle-result" hidden></div>`, 'battle-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-number]').forEach(button => button.onclick = () => enterAnswer(button.dataset.number!));
  $('#show-hint').onclick = showHint; $('#answer').focus();
}
function showHint() {
  if (!battle) return; const q = battle.encounter.question;
  $('#hint').hidden = false;
  const dots = Math.min(q.answer, 12), more = q.answer > dots ? `<small>… 모두 ${q.answer}개</small>` : '<small>한 묶음</small>';
  $('#hint').innerHTML = `<p>${q.dividend}개를 ${q.divisor}묶음에 똑같이 나눠요.</p><div class="groups">${Array.from({ length: q.divisor }, () => `<div class="group"><span>${Array.from({ length: dots }, () => '<i></i>').join('')}</span>${more}</div>`).join('')}</div><b>${q.divisor} × □ = ${q.dividend}</b><p>한 묶음의 개수를 곱셈으로 확인해 보세요.</p>`;
}
function enterAnswer(key: string) {
  if (!battle || battle.encounter.solved) return;
  const input = $('#answer') as HTMLInputElement;
  if (key === '지우기') input.value = input.value.slice(0, -1); else if (key === '확인') submitAnswer(); else if (/^\d$/.test(key) && input.value.length < 2) input.value += key;
}
window.addEventListener('keydown', e => { if (!battle || battle.encounter.solved || !($('#modal') as HTMLDialogElement).open) return; if (/^\d$/.test(e.key)) { e.preventDefault(); enterAnswer(e.key); } else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); enterAnswer('지우기'); } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); enterAnswer('확인'); } });
function submitAnswer() {
  if (!battle || !state) return; const b = battle, input = $('#answer') as HTMLInputElement;
  if (!input.value) { $('#answer-message').textContent = '숫자판이나 키보드로 답을 적어 주세요.'; return; }
  const outcome = b.encounter.answer(input.value);
  if (outcome === 'ignored') return;
  if (outcome === 'wrong') { audio.play('wrong'); $('#answer-message').textContent = '괜찮아요! 묶음을 살펴보고 다시 풀어 볼까요?'; input.value = ''; showHint(); return; }
  b.result = b.encounter.arena ? grantReward(state, b.encounter.monster, true) : finishHunt(state, Number(b.id.slice(7)));
  if (!b.result) return;
  b.score += b.result.score;
  if (b.encounter.arena) state.best = Math.max(state.best, b.score); else world.defeat(b.id);
  audio.play(b.result.levels ? 'level' : 'correct'); world.celebrate(); persist(); refresh();
  $('#answer-message').textContent = '정답이에요! 정말 잘했어요!'; $('#monster-portrait').classList.add('defeated');
  $('.number-pad').hidden = true; $('.battle-footer').hidden = true; $('#hint').hidden = true;
  $('#battle-result').hidden = false;
  const clearReward = (b.result as ReturnType<typeof grantReward> & { clearReward?: number }).clearReward ?? 0;
  $('#battle-result').innerHTML = `<div class="reward-banner"><strong>✨ 멋진 나눗셈!</strong><p>🍓 +${b.result.berries}베리 · 경험치 +${b.result.xp}${b.encounter.arena ? ` · +${b.result.score}점` : ''}</p>${!b.encounter.arena && clearReward ? `<p class="level-up">사냥터 통과! 추가 +${clearReward}베리와 다음 길을 받았어요.</p>` : ''}${b.result.levels ? `<p class="level-up">레벨 ${state.level}! 선물 ${b.result.levels * 20}베리도 받았어요.</p>` : ''}</div><button class="primary wide" id="next-battle">${b.encounter.arena ? b.round < 5 ? '다음 친구 만나기 →' : '대련 결과 보기' : '숲으로 돌아가기'}</button>`;
  $('#next-battle').onclick = nextBattle; $('#next-battle').focus();
}
function nextBattle() {
  if (!battle || !state || !battle.encounter.solved) return;
  if (!battle.encounter.arena) { battle = null; closeModal(); return; }
  if (battle.round === 5) { const score = battle.score; battle = null; openModal(title('오늘도 한 뼘 자랐어요', '대련을 마쳤어요!') + `<div class="arena-intro"><div class="arena-symbol">🏆</div><h3>${score}점</h3><p>다섯 친구와의 나눗셈 대련 성공!<br>나의 최고 기록은 ${state.best}점이에요.</p><button class="primary wide" data-close>마을로 돌아가기</button></div>`); return; }
  const previous = battle.encounter.question; battle.round++; battle.encounter = new Encounter(Math.floor(Math.random() * 4), true, state.level, previous); battle.result = null; renderBattle();
}
function exitBattle() { if (battle?.encounter.arena) toast(`대련 ${battle.score}점 · 받은 보상은 저장했어요.`); battle = null; persist(); closeModal(); }

function openShop(kind: 'weapon' | 'outfit', selectedId?: number) {
  if (!state) return; state.tutorial.shop = true; refresh(); persist(); const s = state, items = kind === 'weapon' ? WEAPONS : OUTFITS, owned = kind === 'weapon' ? s.weapons : s.outfits; const id = selectedId ?? s[kind], item = items[id], level = owned[id];
  openModal(title(kind === 'weapon' ? '강지후의 무기 상점' : '오지후의 의상 상점', kind === 'weapon' ? `반짝이는 무기 ${WEAPONS.length}종` : `오늘의 귀여운 옷 ${OUTFITS.length}벌`) + `<p class="shop-explainer">${kind === 'weapon' ? '무기에 따라 보상·대련 점수·나무 베는 힘이 달라져요.' : '의상마다 베리, 경험치, 스테이지 완료 보너스가 달라져요.'} <b>🍓 ${s.berries}베리</b></p><div class="shop-layout"><div class="item-grid">${items.map((it, i) => `<button class="item-card ${i === id ? 'selected' : ''}" data-item="${i}" aria-pressed="${i === id}"><span class="item-swatch" style="--item-color:#${it.color.toString(16).padStart(6, '0')}">${kind === 'weapon' ? WEAPONS[i].icon : OUTFIT_ICONS[i]}</span><strong>${it.name}</strong><small>${Object.hasOwn(owned, i) ? s[kind] === i ? '✓ 입고 있어요'.replace('입고', kind === 'weapon' ? '들고' : '입고') : `보유 · +${owned[i]}` : `🍓 ${it.price}베리`}</small></button>`).join('')}</div><div class="item-detail"><div id="shop-avatar"></div><span class="preview-tag">미리 보기</span><h3>${item.name}${level !== undefined ? ` +${level}` : ''}</h3><p>${kind === 'weapon' ? `몬스터 보상 베리 +${WEAPONS[id].bonus}<br>대련 점수 ×${(WEAPONS[id].multiplier + (level ?? 0) * .1).toFixed(1)}<br><b>나무 베기 힘 ${WEAPONS[id].treePower + (level ?? 0)} · 약 ${Math.ceil(7 / (WEAPONS[id].treePower + (level ?? 0)))}번</b>` : `${OUTFITS[id].desc}<br><b>귀여운 효과: ${OUTFITS[id].effect}</b>`}</p><button class="primary wide" id="buy-item" ${s[kind] === id ? 'disabled' : ''}>${s[kind] === id ? '지금 장착 중' : level !== undefined ? '장착하기' : `${item.price}베리로 구매·장착`}</button>${level !== undefined ? `<button class="secondary wide" id="upgrade-item" ${level >= (kind === 'weapon' ? 3 : 2) ? 'disabled' : ''}>${level >= (kind === 'weapon' ? 3 : 2) ? '최고 단계예요 ✦' : `강화하기 · ${(kind === 'weapon' ? WEAPON_UPGRADES : OUTFIT_UPGRADES)[level]}베리`}</button><small class="upgrade-note">${kind === 'weapon' ? '강화마다 대련 점수 +0.1 · 나무 힘 +1' : '강화하면 자수와 반짝임이 더해져요'}</small>` : ''}<p class="error" id="shop-error" role="alert"></p></div></div>`, 'shop-modal');
  preview = new AvatarPreview($('#shop-avatar')); preview.show(s.character, kind === 'outfit' ? id : s.outfit, kind === 'weapon' ? id : s.weapon, kind === 'outfit' ? level ?? 0 : s.outfits[s.outfit], kind === 'weapon' ? level ?? 0 : s.weapons[s.weapon]);
  document.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b => b.onclick = () => openShop(kind, Number(b.dataset.item)));
  $('#buy-item').onclick = () => shopAction(() => buy(s, kind, id), kind, id);
  if ($('#upgrade-item')) $('#upgrade-item').onclick = () => shopAction(() => upgrade(s, kind, id), kind, id);
}
function shopAction(action: () => string, kind: 'weapon' | 'outfit', id: number) { try { const msg = action(); audio.play('buy'); syncAvatar(); refresh(); persist(); openShop(kind, id); toast(msg); } catch (e) { $('#shop-error').textContent = (e as Error).message; } }

function openInventory(tab: 'weapon' | 'outfit' | 'ride' = 'weapon') {
  if (!state) return; const s = state;
  const tabs = `<div class="inventory-tabs"><button data-inventory-tab="weapon" class="${tab === 'weapon' ? 'active' : ''}">⚔ 무기</button><button data-inventory-tab="outfit" class="${tab === 'outfit' ? 'active' : ''}">👗 옷</button><button data-inventory-tab="ride" class="${tab === 'ride' ? 'active' : ''}">🪽 라이딩</button></div>`;
  let cards = '';
  if (tab === 'weapon') cards = Object.keys(s.weapons).map(Number).map(id => { const item = WEAPONS[id]; return `<article class="inventory-item ${s.weapon === id ? 'equipped' : ''}"><span class="inventory-icon" style="--item-color:#${item.color.toString(16).padStart(6, '0')}">${item.icon}</span><div><strong>${item.name} +${s.weapons[id]}</strong><small>보상 +${item.bonus} · 점수 ×${(item.multiplier + s.weapons[id] * .1).toFixed(1)} · 나무 힘 ${item.treePower + s.weapons[id]}</small></div><button class="${s.weapon === id ? 'equipped-button' : 'secondary'}" data-equip="weapon" data-id="${id}" ${s.weapon === id ? 'disabled' : ''}>${s.weapon === id ? '장착 중' : '장착'}</button></article>`; }).join('');
  if (tab === 'outfit') cards = Object.keys(s.outfits).map(Number).map(id => { const item = OUTFITS[id]; return `<article class="inventory-item ${s.outfit === id ? 'equipped' : ''}"><span class="inventory-icon" style="--item-color:#${item.color.toString(16).padStart(6, '0')}">${OUTFIT_ICONS[id]}</span><div><strong>${item.name} +${s.outfits[id]}</strong><small>${item.desc} · ${item.effect}</small></div><button class="${s.outfit === id ? 'equipped-button' : 'secondary'}" data-equip="outfit" data-id="${id}" ${s.outfit === id ? 'disabled' : ''}>${s.outfit === id ? '입는 중' : '입기'}</button></article>`; }).join('');
  if (tab === 'ride') cards = `<article class="inventory-item ${s.ride === -1 ? 'equipped' : ''}"><span class="inventory-icon walk">👟</span><div><strong>두 발로 산책하기</strong><small>숲길을 천천히 걸으며 둘러봐요</small></div><button class="${s.ride === -1 ? 'equipped-button' : 'secondary'}" data-dismount ${s.ride === -1 ? 'disabled' : ''}>${s.ride === -1 ? '걷는 중' : '내리기'}</button></article>` + RIDES.map((ride, id) => { const owned = !!s.rides[id], active = s.ride === id; return `<article class="inventory-item ${active ? 'equipped' : ''} ${owned ? '' : 'locked'}"><span class="inventory-icon" style="--item-color:#${ride.color.toString(16).padStart(6, '0')}">${ride.icon}</span><div><strong>${ride.name}</strong><small>${ride.desc}<br>이동 속도 ×${ride.speed}${ride.flying ? ' · ✨ 비행 가능' : ' · 지상형'}</small></div><button class="${active ? 'equipped-button' : owned ? 'secondary' : 'primary'}" data-ride="${id}" ${active ? 'disabled' : ''}>${active ? '타는 중' : owned ? '타기' : `🍓 ${ride.price.toLocaleString()}`}</button></article>`; }).join('');
  openModal(title('나의 인벤토리', tab === 'ride' ? '라이딩 마구간' : '내가 모은 장비') + `${tabs}<p class="inventory-summary">보유 무기 ${Object.keys(s.weapons).length}개 · 옷 ${Object.keys(s.outfits).length}벌 · 라이딩 ${Object.keys(s.rides).length}마리 <b>🍓 ${s.berries.toLocaleString()}</b></p><div class="inventory-list">${cards}</div>${tab === 'ride' ? '<p class="note">5,000베리 이상의 비행 라이딩은 물과 낮은 장애물 위를 자유롭게 날 수 있어요.</p>' : ''}<p class="error" id="inventory-error" role="alert"></p>`, 'inventory-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-inventory-tab]').forEach(button => button.onclick = () => openInventory(button.dataset.inventoryTab as 'weapon' | 'outfit' | 'ride'));
  document.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(button => button.onclick = () => { const kind = button.dataset.equip as 'weapon' | 'outfit', id = Number(button.dataset.id); s[kind] = id; audio.play('buy'); syncAvatar(); refresh(); persist(); openInventory(tab); toast(kind === 'weapon' ? '새 무기를 장착했어요!' : '새 옷으로 갈아입었어요!'); });
  document.querySelectorAll<HTMLButtonElement>('[data-ride]').forEach(button => button.onclick = () => { try { const msg = buyRide(s, Number(button.dataset.ride)); audio.play('buy'); syncAvatar(); refresh(); persist(); openInventory('ride'); toast(msg); } catch (e) { $('#inventory-error').textContent = (e as Error).message; } });
  const off = document.querySelector<HTMLButtonElement>('[data-dismount]'); if (off) off.onclick = () => { const msg = dismount(s); syncAvatar(); refresh(); persist(); openInventory('ride'); toast(msg); };
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
  openModal(title('나의 모험 수첩', '설정과 저장') + `<div class="settings-list"><label><span>배경음악<small>잔잔한 숲속 멜로디</small></span><input id="music-toggle" type="checkbox" ${state.settings.music ? 'checked' : ''}></label><label><span>효과음<small>베리와 정답 알림</small></span><input id="sound-toggle" type="checkbox" ${state.settings.sound ? 'checked' : ''}></label><label><span>가벼운 화면<small>그림자를 줄여 태블릿에서 부드럽게</small></span><input id="quality-toggle" type="checkbox" ${state.settings.lowQuality ? 'checked' : ''}></label></div><div class="teacher-code ${state.teacherMode ? 'enabled' : ''}"><div><strong>🧑‍🏫 선생님 모드</strong><small>${state.teacherMode ? '활성화됨 · 모든 장비와 스테이지 사용 가능' : '수업 시연용 암호코드를 입력하세요'}</small></div>${state.teacherMode ? '<span>ON</span>' : '<div class="teacher-input"><input id="teacher-code" type="password" autocomplete="off" placeholder="암호코드"><button id="teacher-unlock" class="secondary">열기</button></div>'}<p class="error" id="teacher-error" role="alert"></p></div><p class="note">이 브라우저에 자동 저장돼요. 다른 기기에서는 저장 파일을 불러와 이어 할 수 있어요.${storageError ? '<br>자동 저장을 사용할 수 없어요. 꼭 저장 파일을 내려받아 주세요.' : ''}</p><div class="settings-buttons"><button id="export" class="secondary">저장 파일 내려받기</button><button id="import" class="secondary">저장 파일 불러오기</button><button id="help" class="secondary">조작 방법 보기</button><button id="return-title" class="secondary">처음 화면으로</button></div>`);
  for (const [id, key] of [['music', 'music'], ['sound', 'sound'], ['quality', 'lowQuality']] as const) $<HTMLInputElement>(`#${id}-toggle`).onchange = e => { state!.settings[key] = (e.target as HTMLInputElement).checked; refresh(); if (key === 'lowQuality') world.quality(state!.settings.lowQuality); persist(); };
  $('#export').onclick = exportSave; $('#import').onclick = () => $<HTMLInputElement>('#import-file').click(); $('#help').onclick = openGuide;
  if (!state.teacherMode) { const unlock = () => { try { const msg = enableTeacherMode(state!, $<HTMLInputElement>('#teacher-code').value); audio.play('level'); refresh(); persist(); openSettings(); toast(msg); } catch (e) { $('#teacher-error').textContent = (e as Error).message; } }; $('#teacher-unlock').onclick = unlock; $<HTMLInputElement>('#teacher-code').onkeydown = e => { if (e.key === 'Enter') unlock(); }; }
  $('#return-title').onclick = () => { persist(); closeModal(); state = null; audio.music = false; showStart(); };
}
$('#settings').onclick = openSettings;
$('#stage-map').onclick = openStageMap;
$('#inventory').onclick = () => openInventory();
$<HTMLInputElement>('#import-file').onchange = async e => {
  const input = e.target as HTMLInputElement, file = input.files?.[0]; input.value = ''; if (!file) return;
  try { if (file.size > 100000) throw new Error('파일이 너무 커요. 베리숲 저장 파일을 골라 주세요.'); pendingImport = validateSave(JSON.parse(await file.text()));
    confirmAction('저장된 모험을 불러올까요?', `${escape(pendingImport.nickname)} · 레벨 ${pendingImport.level}의 모험으로 바뀌어요. 현재 모험은 덮어쓰게 됩니다.`, () => { const incoming = pendingImport!; pendingImport = null; begin(incoming, false); }, !!(state ?? saved));
  } catch (error) { toast(error instanceof SyntaxError ? '올바른 JSON 저장 파일이 아니에요.' : (error as Error).message); }
};
setInterval(persist, 4000); window.addEventListener('pagehide', persist); document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

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
