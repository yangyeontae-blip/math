// 마을 사람들과 이야기할 때 나오는 말풍선: 이름표, 한 글자씩 나오는 글, ▼ 표시.
// 화면 모양만 다루고, 이야기가 끝나면 원래 열리던 창(상점·지도 등)을 그대로 이어서 열어요.

import { pickLine, type LineContext } from './npc-lines';

let lastLine = '';
export function greetingFor(id: string, random: () => number = Math.random, context: LineContext = {}): string | null {
  const line = pickLine(id, random, context, lastLine); if (line) lastLine = line; return line;
}

let active: { el: HTMLElement; timer: number; text: string; shown: number; onDone: () => void; off: () => void } | null = null;

export function bubbleOpen() { return !!active; }

/** 말풍선을 보여 줘요. 한 번 누르면 글이 다 나오고, 한 번 더 누르면 닫혀서 onDone이 불려요. */
export function showBubble(name: string, text: string, onDone: () => void, onTick: (index: number) => void = () => {}, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches) {
  closeBubble(false);
  const el = document.createElement('div');
  el.className = 'talk-bubble'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `${name}의 말`);
  el.innerHTML = '<span class="talk-name"></span><p class="talk-text" aria-live="polite"></p><i class="talk-next" aria-hidden="true">▼</i>';
  (el.querySelector('.talk-name') as HTMLElement).textContent = name;
  const out = el.querySelector('.talk-text') as HTMLElement;
  document.body.appendChild(el);
  const state = { el, timer: 0, text, shown: reducedMotion ? text.length : 0, onDone, off: () => {} };
  const draw = () => { out.textContent = text.slice(0, state.shown); el.classList.toggle('finished', state.shown >= text.length); };
  const advance = () => {
    if (state.shown < text.length) { state.shown = text.length; window.clearInterval(state.timer); draw(); return; }
    closeBubble(true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (e.key === 'Escape') { state.shown = text.length; closeBubble(true); } else advance(); }
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); advance(); });
  window.addEventListener('keydown', onKey, true);
  state.off = () => window.removeEventListener('keydown', onKey, true);
  active = state; draw();
  if (!reducedMotion) state.timer = window.setInterval(() => { state.shown += 1; draw(); if (text[state.shown - 1] && text[state.shown - 1] !== ' ' && state.shown % 2 === 0) onTick(state.shown); if (state.shown >= text.length) window.clearInterval(state.timer); }, 34);
}

export function closeBubble(runDone: boolean) {
  const a = active; if (!a) return;
  active = null; window.clearInterval(a.timer); a.off(); a.el.remove();
  if (runDone) a.onDone();
}
