// 마을 사람들과 이야기할 때 나오는 말풍선: 이름표, 한 글자씩 나오는 글, ▼ 표시.
// 화면 모양만 다루고, 이야기가 끝나면 원래 열리던 창(상점·지도 등)을 그대로 이어서 열어요.

const GREETINGS: Record<string, string[]> = {
  guide: ['어서 와, 모험가야! 오늘도 수학 숲을 걸어 볼까?', '모르는 건 언제든 물어봐. 천천히 해도 괜찮아!'],
  weapon: ['어서 와! 반짝이는 무기를 구경해 볼래?', '튼튼한 무기가 있으면 나무 베기도 척척이야.'],
  outfit: ['오늘은 어떤 옷이 마음에 들어?', '새 옷을 입으면 기분도 새로워질 거야.'],
  ride: ['같이 달려 볼까? 멋진 탈것이 기다리고 있어!', '바람처럼 달리면 마을 구경이 훨씬 빨라져.'],
  pet: ['귀여운 친구들이 널 기다리고 있었어!', '마음에 드는 친구를 골라 함께 모험해 봐.'],
  potion: ['어서 와! 힘이 나는 물약이 있어.', '물약은 사서 쓰면 잠깐 동안 힘이 나.'],
  beauty: ['새로운 모습으로 바꿔 볼까? 두근두근!', '머리 모양을 바꾸면 분위기가 확 달라져.'],
  arena: ['용기가 나면 대련장으로 들어와 봐!', '다섯 번의 작은 도전이 기다리고 있어.'],
  journey: ['어느 지역으로 모험을 떠날까? 지도를 펼쳐 볼게.', '한 걸음씩 가다 보면 어느새 끝에 와 있을 거야.'],
  unit: ['여기는 마을 게시판이야. 오늘의 소식을 볼래?'],
  next: ['다음 단계로 가는 문이야. 준비됐니?']
};

export function greetingFor(id: string, random: () => number = Math.random): string | null {
  const lines = GREETINGS[id];
  return lines ? lines[Math.min(lines.length - 1, Math.floor(random() * lines.length))] : null;
}

let active: { el: HTMLElement; timer: number; text: string; shown: number; onDone: () => void; off: () => void } | null = null;

export function bubbleOpen() { return !!active; }

/** 말풍선을 보여 줘요. 한 번 누르면 글이 다 나오고, 한 번 더 누르면 닫혀서 onDone이 불려요. */
export function showBubble(name: string, text: string, onDone: () => void, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  if (!reducedMotion) state.timer = window.setInterval(() => { state.shown += 1; draw(); if (state.shown >= text.length) window.clearInterval(state.timer); }, 34);
}

export function closeBubble(runDone: boolean) {
  const a = active; if (!a) return;
  active = null; window.clearInterval(a.timer); a.off(); a.el.remove();
  if (runDone) a.onDone();
}
