import type { Save } from './rules';
import { FIELD_INFO, fieldHere, fieldSpec, fieldReady, changeForestWork, finishForestWork } from './forest-activities';
import { speak, stopSpeech, speechSupported, autoReadEnabled } from './speech';

interface Hooks { open(html: string): void; save(): void; changed(): void; sound(kind: 'berry' | 'wrong' | 'correct'): void; celebrate(): void; active(): boolean }
export function showForestWork(s: Save, step: number, hooks: Hooks) {
  if (!fieldHere(s) || !Number.isInteger(step) || step < 0 || step > 2) return;
  const forest = s.forest, info = FIELD_INFO[forest], work = s.forestActivities[forest], spec = fieldSpec(forest, s.grade, step), { a, b } = spec;
  const header = (text: string) => `<div class="modal-heading"><div><span class="eyebrow">${info.icon} ${info.title} · ${step + 1}/3</span><h2>${text}</h2></div><button class="close" data-close aria-label="닫기">×</button></div>`;
  if (work.done.includes(step)) { hooks.open(header('내 손으로 바꾼 숲이에요!') + `<p>${work.done.length === 3 ? info.ending : '이곳을 완성했어요. 다음 장소로 걸어가 탐험을 이어 보세요.'}</p><button class="primary wide" data-close>달라진 숲 구경하기</button>`); return; }
  if (step !== work.done.length) { hooks.open(header('앞 장소부터 차례로 해 봐요') + `<p>${work.done.length + 1}번째 ${info.place}에서 모험을 이어 갈 수 있어요.</p><button class="primary wide" data-close>숲으로 돌아가기</button>`); return; }
  const controls = forest === 'subtraction' ? `<p>가시를 누르면 걷고, 다시 누르면 되돌릴 수 있어요.</p><div class="field-thorns">${Array.from({ length: a }, (_, i) => `<button class="secondary" data-field-slot="${i}" aria-label="${i + 1}번 가시" aria-pressed="false">🌿</button>`).join('')}</div>`
    : forest === 'multiplication' ? `<p>줄을 하나씩 눌러 같은 수의 꽃을 심어요. 다시 누르면 거둘 수 있어요.</p><div class="field-rows">${Array.from({ length: a }, (_, i) => `<button class="secondary" data-field-slot="${i}" aria-pressed="false"><span>${i + 1}번째 줄 · ${b}칸</span><span class="field-row-flowers"></span></button>`).join('')}</div>`
    : `<p>물 한 컵씩 보내고 되돌릴 수 있어요. 물은 처음의 ${a}컵 안에서만 움직여요.</p><button class="secondary wide" data-field-lap>모든 수로에 한 컵씩 보내기</button><div class="field-channels">${Array.from({ length: b }, (_, i) => `<section><h3>${i + 1}번 수로</h3><div class="field-water" id="field-water-${i}" aria-hidden="true"></div><p id="field-count-${i}"></p><button class="secondary" data-field-slot="${i}" data-field-delta="1" aria-label="${i + 1}번 수로에 한 컵 보내기">＋ 한 컵</button><button class="secondary" data-field-slot="${i}" data-field-delta="-1" aria-label="${i + 1}번 수로에서 한 컵 되돌리기">− 한 컵</button></section>`).join('')}</div>`;
  hooks.open(header(info.verb) + `<p class="trail-intro">${info.intro}</p><p>${spec.prompt}</p><div id="field-controls">${controls}</div><p id="field-progress" role="status" aria-live="polite"></p><label class="trail-answer">${spec.equation} = ?<input id="field-answer" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="${forest === 'subtraction' ? '남은 가시의 수' : forest === 'multiplication' ? '전체 꽃의 수' : '한 수로의 물 컵 수'}"></label><div class="trail-keypad">${['1','2','3','4','5','6','7','8','9','지우기','0','←'].map(key => `<button class="secondary" data-field-key="${key}">${key}</button>`).join('')}</div><button id="field-check" class="primary wide">${info.verb} 완성하기</button><p class="trail-status" id="field-status" role="status" aria-live="polite"></p><button id="field-hint" class="secondary wide">💡 도움말</button>${speechSupported() ? '<button id="field-read" class="text-button wide">🔊 문제 읽어주기</button>' : ''}<button class="text-button wide" data-close>숲으로 돌아가기</button>`);
  const $ = (id: string) => document.getElementById(id)!, input = $('field-answer') as HTMLInputElement;
  input.value = work.drafts[step];
  const draw = () => {
    const values = work.values[step], total = values.reduce((sum, n) => sum + n, 0);
    document.querySelectorAll<HTMLButtonElement>('[data-field-slot]').forEach(button => {
      const slot = Number(button.dataset.fieldSlot);
      if (forest === 'division') button.disabled = Number(button.dataset.fieldDelta) < 0 ? values[slot] === 0 : total === a;
      else { const selected = values.includes(slot); button.setAttribute('aria-pressed', String(selected));
        if (forest === 'subtraction') button.textContent = selected ? '🍃' : '🌿';
        else button.querySelector('.field-row-flowers')!.textContent = (selected ? '🌼 ' : '· ').repeat(b);
      }
    });
    if (forest === 'division') {
      values.forEach((count, i) => { $(`field-count-${i}`).textContent = `물 ${count}컵`; $(`field-water-${i}`).style.setProperty('--water', `${Math.min(100, count / (a / b) * 80)}%`); });
      ($('field-controls').querySelector('[data-field-lap]') as HTMLButtonElement).disabled = total + b > a;
    }
    $('field-progress').textContent = forest === 'subtraction' ? `걷은 가시 ${values.length}개 · 목표 ${b}개`
      : forest === 'multiplication' ? `꽃을 심은 줄 ${values.length}/${a}줄 · 한 줄에 ${b}송이씩`
      : `남은 물 ${a - total}컵 · 모든 수로에 같은 양이 가도록 나눠요.`;
  };
  const active = () => hooks.active() && fieldHere(s) && s.forest === forest && !work.done.includes(step);
  const saveDraft = () => { if (!active()) return; input.value = input.value.replace(/[^0-9]/g, '').slice(0,3); work.drafts[step] = input.value; hooks.save(); };
  const change = (slot: number, delta: number) => { if (active() && changeForestWork(s, step, slot, delta)) { hooks.save(); hooks.changed(); hooks.sound('berry'); draw(); } };
  input.oninput = saveDraft;
  document.querySelectorAll<HTMLButtonElement>('[data-field-slot]').forEach(button => button.onclick = () => change(Number(button.dataset.fieldSlot), Number(button.dataset.fieldDelta ?? 1)));
  document.querySelector<HTMLButtonElement>('[data-field-lap]')?.addEventListener('click', () => change(-1, 1));
  document.querySelectorAll<HTMLButtonElement>('[data-field-key]').forEach(button => button.onclick = () => { if (!active()) return; const key = button.dataset.fieldKey!; input.value = key === '지우기' ? '' : key === '←' ? input.value.slice(0,-1) : (input.value + key).slice(0,3); saveDraft(); });
  $('field-hint').onclick = () => { $('field-status').textContent = forest === 'subtraction' ? `먼저 ${b}개를 골라 걷고, 남은 가시를 한 개씩 세어 보세요.` : forest === 'multiplication' ? `${b}송이씩 ${a}번 더해 보세요. 줄마다 꽃 수가 같아요.` : '한 수로에만 많이 보내지 말고, 모든 수로에 한 컵씩 차례로 보내 보세요. 남는 물이 없어야 해요.'; };
  if (speechSupported()) $('field-read').onclick = () => { speak(spec.prompt); };
  $('field-check').onclick = () => {
    if (!active()) return; saveDraft();
    if (!fieldReady(forest, s.grade, step, work.values[step])) { $('field-status').textContent = forest === 'subtraction' ? `가시를 ${b}개만 걷어 주세요. 너무 많이 걷었으면 다시 눌러 되돌려요.` : forest === 'multiplication' ? `한 줄에 ${b}송이씩 모든 줄에 꽃을 심어 주세요.` : '남은 물 없이 모든 수로에 같은 양이 가도록 옮겨 주세요. 더 보낸 물은 되돌릴 수 있어요.'; return; }
    if (!finishForestWork(s, step)) { $('field-status').textContent = '조작한 모습을 다시 살펴보고 답해 보세요. 지금까지 한 활동은 그대로 남아요.'; hooks.sound('wrong'); return; }
    hooks.save(); hooks.changed(); hooks.sound('correct'); hooks.celebrate(); stopSpeech();
    hooks.open(header(step === 2 ? '우리 손으로 숲을 완성했어요!' : `${step + 1}번째 ${info.place} 완성!`) + `<p>${spec.equation} = ${spec.answer}.</p><p>${step === 2 ? info.ending : '숲에 변화가 생겼어요. 다음 장소까지 걸어가 볼까요?'}</p><button class="primary wide" data-close>달라진 숲 구경하기</button>`);
  };
  input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); $('field-check').click(); } };
  draw(); if (autoReadEnabled()) speak(spec.prompt);
}
