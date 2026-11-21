// 연못 낚시터 화면: 낚싯대 던지기 → 카드 뒤집기 → 수학자 소개(초상 사진·업적) → 도감 24칸 · 조각 교환 · 완성 보상.
import type { Save } from './rules';
import { CAST_COST, COMPLETE_BERRIES, COMPLETE_TITLE, DAILY_CASTS, MATH_CARDS, TIERS, castLine, castsLeft, claimCompletion, exchangeCard, fishingOf, ownedCount, type MathCard } from './fishing';
import { PORTRAIT_CREDITS } from './mathematician-portraits';
import { todayKey } from './daily';
import './storybook-paper.css';
import './fishing-paper.css';

type Hooks = { open: (html: string, cls?: string) => void; close: () => void; persist: () => void; stored: () => boolean; refresh: () => void; toast: (text: string) => void; trophy: (on: boolean) => void };
const esc = (text: string) => text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const n = (v: number) => v.toLocaleString('ko-KR');
const TIER_BADGE: Record<keyof typeof TIERS, number> = { common: 1, rare: 3, hero: 4, legend: 5 };

// 초상화가 없는 수학자를 위한 상징 그림(선화). 업적과 연결된 모양이에요.
const EMBLEMS: Record<string, string> = {
  zero: '<circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="7"/><path d="M30 78h40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  sticks: '<g stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M28 24v52M40 24v52M52 24v52"/><path d="M64 34h20M64 50h20M64 66h20"/></g>',
  cone: '<path d="M50 16L24 80h52z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><ellipse cx="50" cy="80" rx="26" ry="8" fill="none" stroke="currentColor" stroke-width="4"/><ellipse cx="50" cy="52" rx="14" ry="5" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="4 3"/>',
  magic: '<g fill="none" stroke="currentColor" stroke-width="3"><rect x="22" y="22" width="56" height="56" rx="4"/><path d="M40.7 22v56M59.3 22v56M22 40.7h56M22 59.3h56"/></g><g font-size="13" font-weight="700" fill="currentColor" text-anchor="middle"><text x="31" y="36">2</text><text x="50" y="36">7</text><text x="69" y="36">6</text><text x="31" y="55">9</text><text x="50" y="55">5</text><text x="69" y="55">1</text><text x="31" y="74">4</text><text x="50" y="74">3</text><text x="69" y="74">8</text></g>',
};

function portraitHtml(card: MathCard, size: 'big' | 'small') {
  if (card.portrait) return `<img class="math-card-photo ${size}" src="${import.meta.env.BASE_URL}art/mathematicians/${card.id}.webp" alt="${esc(card.name)} 초상" loading="lazy" width="240" height="300">`;
  return `<svg class="math-card-photo ${size} is-emblem" viewBox="0 0 100 100" role="img" aria-label="${esc(card.name)} 상징 그림">${EMBLEMS[card.emblem] ?? EMBLEMS.zero}</svg>`;
}
function cardFace(card: MathCard, extra = '') {
  const tier = TIERS[card.tier];
  return `<article class="math-card tier-${card.tier}" style="--tier:${tier.color}"><span class="math-card-tier">${tier.name}</span>${portraitHtml(card, 'big')}<h3>${esc(card.name)}</h3><small>${esc(card.era)}</small><p class="math-card-deed">${esc(card.deed)}</p>${extra}</article>`;
}
function detailHtml(card: MathCard) {
  const credit = PORTRAIT_CREDITS[card.id];
  return `${cardFace(card)}<p class="math-card-story">${esc(card.story)}</p><p class="math-card-credit">${card.portrait && credit ? `그림: ${esc(credit.artist)} · ${esc(credit.license)} · 위키미디어 공용` : '믿을 만한 초상화가 남아 있지 않아 업적을 상징하는 그림으로 보여 줘요.'}</p>`;
}

export function showFishing(s: Save, h: Hooks, view: 'dock' | 'book' = 'dock', message = '') {
  const f = fishingOf(s), today = todayKey(), left = castsLeft(s, today), owned = ownedCount(s);
  const tierCounts = (Object.keys(TIERS) as (keyof typeof TIERS)[]).map(t => `${TIERS[t].name} ${MATH_CARDS.filter(c => c.tier === t && f.cards[c.id]).length}/${MATH_CARDS.filter(c => c.tier === t).length}`).join(' · ');
  // 2026-11-21 지브리풍 연못 테마(Codex 시안): 연못 배너 · 하늘색 리본 탭 · 낚싯대 버튼 · 등급 배지 카드.
  const art = import.meta.env.BASE_URL + 'art/fishing-dock/';
  const tabs = `<nav class="sb-ribbon fishing-tabs"><img src="${art}ribbon.webp" alt="" aria-hidden="true"><button class="sb-chip" data-fish-view="dock" aria-pressed="${view === 'dock'}"><img src="${art}icon-rod.webp" alt="">낚시하기</button><button class="sb-chip" data-fish-view="book" aria-pressed="${view === 'book'}"><img src="${art}icon-book.webp" alt="">수학자 도감 ${owned}/${MATH_CARDS.length}</button></nav>`;
  const head = `<header class="sb-hero fishing-head"><img src="${art}hero.webp" alt="" decoding="async"><div class="sb-hero-text"><small>광장 연못 낚시터</small><h2>수학자 카드 낚시</h2><p>${CAST_COST}베리로 낚싯대를 던지면 수학자 카드 한 장을 낚아요. 하루 ${DAILY_CASTS}번 · 높은 등급일수록 드물어요.</p></div></header>`;
  const status = `<p class="sb-note fishing-status"><b>오늘 남은 낚시 ${left}/${DAILY_CASTS}</b> · 베리 ${n(s.berries)} · 조각 ${n(f.pieces)}개<br>${tierCounts}</p>`;
  const done = owned >= MATH_CARDS.length;
  const reward = done ? (f.completed ? `<p class="fishing-complete">✦ 칭호 「${COMPLETE_TITLE}」와 황금 낚싯대를 받았어요.</p>` : `<button class="primary wide" id="fish-claim">24장 완성 보상 받기 · 칭호 + 황금 낚싯대 + ${n(COMPLETE_BERRIES)}베리</button>`) : '';
  let body = '';
  if (view === 'dock') {
    body = `${message}<button class="primary wide fishing-cast sb-cast" id="fish-cast" ${left <= 0 || s.berries < CAST_COST ? 'disabled' : ''}><img src="${art}icon-rod.webp" alt="" aria-hidden="true"><span>낚싯대 던지기 · ${CAST_COST}베리</span><img src="${art}icon-bobber.webp" alt="" aria-hidden="true"></button>${left <= 0 ? '<p class="note">오늘 낚시는 끝났어요. 내일 다시 와요!</p>' : s.berries < CAST_COST ? `<p class="note">베리가 ${CAST_COST - s.berries}개 모자라요. 수학숲에서 문제를 풀면 베리를 모을 수 있어요.</p>` : ''}
      <ul class="fishing-odds sb-cards">${(Object.keys(TIERS) as (keyof typeof TIERS)[]).map(t => { const got = MATH_CARDS.filter(c => c.tier === t && f.cards[c.id]).length, all = MATH_CARDS.filter(c => c.tier === t).length; return `<li class="sb-card fish-tier" style="--tier:${TIERS[t].color}"><img class="sb-emblem" src="${art}tier-${TIER_BADGE[t]}.webp" alt="" aria-hidden="true"><span class="sb-card-body"><strong>${TIERS[t].name}</strong><span class="fish-bar" aria-hidden="true"><i style="width:${all ? Math.round(got / all * 100) : 0}%"></i></span><small>${TIERS[t].weight}% · 겹치면 조각 ${TIERS[t].piece}개 · 교환 ${TIERS[t].exchange}조각</small></span><span class="fish-got"><img src="${art}card-back.webp" alt="" aria-hidden="true"><b>${got}/${all}</b></span></li>`; }).join('')}</ul>`;
  } else {
    body = `<div class="math-card-grid">${MATH_CARDS.map(card => f.cards[card.id]
      ? `<button class="math-card-slot tier-${card.tier}" style="--tier:${TIERS[card.tier].color}" data-fish-card="${card.id}">${portraitHtml(card, 'small')}<b>${esc(card.name)}</b><small>${TIERS[card.tier].name}${f.cards[card.id] > 1 ? ` · ${f.cards[card.id]}장` : ''}</small></button>`
      : `<button class="math-card-slot is-missing" style="--tier:${TIERS[card.tier].color}" data-fish-exchange="${card.id}" ${f.pieces < TIERS[card.tier].exchange ? 'aria-disabled="true"' : ''}><span class="math-card-unknown" aria-hidden="true">?</span><b>아직 못 만났어요</b><small>${TIERS[card.tier].name} · 조각 ${TIERS[card.tier].exchange}개로 교환</small></button>`).join('')}</div>`;
  }
  h.open('<section class="sb-paper fishing-paper">' + head + tabs + status + reward + '<div class="fish-body">' + body + '</div><button class="sb-back" data-close>낚시터 떠나기</button></section>', 'fishing-modal');
  document.querySelectorAll<HTMLButtonElement>('[data-fish-view]').forEach(b => b.onclick = () => showFishing(s, h, b.dataset.fishView as 'dock' | 'book'));
  const save = () => { h.persist(); if (!h.stored()) { h.toast('저장하지 못했어요. 저장 파일을 내려받아 주세요.'); } h.refresh(); };
  document.querySelector<HTMLButtonElement>('#fish-cast')?.addEventListener('click', () => {
    let result;
    try { result = castLine(s, today); } catch (error) { showFishing(s, h, 'dock', `<p class="error" role="alert">${esc((error as Error).message)}</p>`); return; }
    save();
    const tag = result.fresh ? '<p class="math-card-new">새 카드!</p>' : `<p class="math-card-dup">이미 있는 카드 · 조각 +${result.pieces}</p>`;
    showFishing(s, h, 'dock', `<div class="fishing-catch tier-${result.card.tier}">${detailHtml(result.card)}${tag}</div>`);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-fish-card]').forEach(b => b.onclick = () => {
    const card = MATH_CARDS.find(c => c.id === b.dataset.fishCard)!;
    h.open(`<div class="fishing-catch">${detailHtml(card)}</div><button class="secondary wide" id="fish-back">도감으로</button>`, 'fishing-modal');
    document.querySelector<HTMLButtonElement>('#fish-back')!.onclick = () => showFishing(s, h, 'book');
  });
  document.querySelectorAll<HTMLButtonElement>('[data-fish-exchange]').forEach(b => b.onclick = () => {
    try { const card = exchangeCard(s, b.dataset.fishExchange!); save(); h.toast(`조각으로 ${card.name} 카드를 받았어요!`); showFishing(s, h, 'book'); }
    catch (error) { h.toast((error as Error).message); }
  });
  document.querySelector<HTMLButtonElement>('#fish-claim')?.addEventListener('click', () => {
    if (!claimCompletion(s)) return;
    s.selectedTitleId ??= 'math-friend';
    save(); h.trophy(true);
    h.toast(`수학자 카드 24장 완성! 칭호 「${COMPLETE_TITLE}」, 황금 낚싯대, ${n(COMPLETE_BERRIES)}베리를 받았어요.`);
    showFishing(s, h, 'book');
  });
}
