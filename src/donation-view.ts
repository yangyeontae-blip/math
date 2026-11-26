// 광장 '작은 기부함' 화면(2026-11-26): 모두의 합계 · 내가 낸 베리 · 꾸밈 목표 · 베리 내기.
import type { Save } from './rules';
import { DONATION_GOALS, DONATION_MAX, DONATION_PRESETS, applyDonation, donationDaysLeft, donationError, donationOf, donationOpen, fetchDonationTotal, goalsReached, sendDonation, type DonationTotal } from './donation';
import './storybook-paper.css';
import './donation.css';

type Hooks = { open: (html: string, cls?: string) => void; close: () => void; persist: () => void; refresh: () => void; toast: (m: string) => void; total: (t: DonationTotal) => void };
const n = (v: number) => v.toLocaleString('ko-KR');
const pending = { amount: 0, requestId: '', busy: false };
let lastTotal: DonationTotal | null = null;

export function showDonation(s: Save, h: Hooks, message = '') {
  const mine = donationOf(s), total = lastTotal, reached = total ? goalsReached(total.total) : 0;
  const next = total ? DONATION_GOALS.find(g => total.total < g.at) : undefined;
  const prev = total ? [...DONATION_GOALS].reverse().find(g => total.total >= g.at)?.at ?? 0 : 0;
  const percent = total && next ? Math.min(100, Math.round((total.total - prev) / (next.at - prev) * 100)) : 100;
  const berry = import.meta.env.BASE_URL + 'art/berry-watercolor-160.webp', open = donationOpen(), days = donationDaysLeft();
  const period = open ? `<p class="donation-period">🎄 크리스마스(12월 25일)까지 열려요 · ${days <= 1 ? '오늘이 마지막 날!' : `${days}일 남았어요`}</p>` : '<p class="donation-period is-closed">🎄 기부함은 크리스마스까지 열렸어요. 함께 모아 줘서 고마워요!</p>';
  const totalHtml = total
    ? `<span>모두 함께 모은 베리</span><strong>${n(total.total)}</strong><small>${n(total.gifts)}번의 마음이 모였어요</small>`
    : '<span>모두 함께 모은 베리</span><strong>…</strong><small>기부함을 열어 보는 중이에요</small>';
  const nextHtml = !total ? '' : `<div class="donation-next">${next
    ? `<p>다음 꾸밈까지 <b>${n(next.at - total.total)}베리</b> · ${next.label}</p><span class="donation-bar" aria-hidden="true"><i style="width:${percent}%"></i></span>`
    : '<p><b>모든 꾸밈을 다 열었어요! 고마워요.</b></p>'}</div>`;
  const goals = DONATION_GOALS.map((g, i) => `<li class="${i < reached ? 'is-done' : ''}"><b>${i < reached ? '✦' : '○'} ${n(g.at)}베리</b><span>${g.label}</span></li>`).join('');
  const presets = DONATION_PRESETS.map(v => `<button class="secondary" data-donate="${v}" ${v > s.berries || pending.busy ? 'disabled' : ''}>${n(v)}베리</button>`).join('');
  h.open(`<section class="sb-paper donation-paper">
    <header class="donation-head"><img src="${berry}" alt="" aria-hidden="true" width="72" height="72"><div><small>중앙 광장</small><h2>작은 기부함</h2><p>베리를 조금씩 모아 광장을 함께 꾸며요. 모두가 낸 베리가 한곳에 모여요.</p></div></header>
    ${period}
    <div class="donation-total" role="status" aria-live="polite">${totalHtml}</div>
    ${nextHtml}
    <ul class="donation-goals">${goals}</ul>
    <p class="sb-note donation-mine">내 베리 <b>${n(s.berries)}</b> · 내가 낸 베리 <b>${n(mine.given)}</b>(${n(mine.gifts)}번)</p>
    ${message}
    ${open ? `<div class="donation-presets">${presets}</div>
    <label class="donation-custom"><span>직접 쓰기</span><input id="donation-amount" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="1~${n(Math.min(DONATION_MAX, Math.max(1, s.berries)))}"><button class="primary" id="donation-send" ${pending.busy ? 'disabled' : ''}>${pending.busy ? '넣는 중…' : '넣기'}</button></label>` : ''}
    <p class="donation-small">한 번에 ${n(DONATION_MAX)}베리까지 낼 수 있어요. 낸 베리는 돌려받을 수 없어요. 이름은 기록하지 않아요.</p>
    <button class="sb-back" data-close>기부함 떠나기</button>
  </section>`, 'donation-modal');
  const input = document.querySelector<HTMLInputElement>('#donation-amount');
  if (input) input.oninput = () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); };
  const give = async (amount: number) => {
    if (pending.busy) return;
    const error = donationError(s, amount);
    if (error) { showDonation(s, h, `<p class="error" role="alert">${error}</p>`); return; }
    // 같은 금액으로 다시 누르면 같은 요청 번호를 써서 두 번 더해지지 않게 해요.
    if (pending.amount !== amount || !pending.requestId) { pending.amount = amount; pending.requestId = crypto.randomUUID(); }
    pending.busy = true; showDonation(s, h);
    try {
      lastTotal = await sendDonation(amount, pending.requestId);
      applyDonation(s, amount); pending.amount = 0; pending.requestId = '';
      h.persist(); h.refresh(); h.total(lastTotal);
      h.toast(`🍓 ${n(amount)}베리를 기부함에 넣었어요! 고마워요.`);
      pending.busy = false; showDonation(s, h, '<p class="donation-thanks">짤랑! 기부함에 베리가 쏙 들어갔어요.</p>');
    } catch (e) { pending.busy = false; showDonation(s, h, `<p class="error" role="alert">${(e as Error).message} 베리는 그대로예요.</p>`); }
  };
  document.querySelectorAll<HTMLButtonElement>('[data-donate]').forEach(b => b.onclick = () => void give(Number(b.dataset.donate)));
  const send = document.querySelector<HTMLButtonElement>('#donation-send');
  if (send && input) send.onclick = () => void give(Number(input.value || 0));
  if (!total) void fetchDonationTotal().then(t => { lastTotal = t; h.total(t); if (document.querySelector('.donation-paper')) showDonation(s, h, message); })
    .catch(e => { const box = document.querySelector('.donation-total small'); if (box) box.textContent = (e as Error).message; });
}

/** 광장에 들어올 때 꾸밈 단계를 맞추려고 합계만 조용히 읽어요. 실패하면 아무것도 바꾸지 않아요. */
export async function loadDonationTotal() { try { lastTotal = await fetchDonationTotal(); return lastTotal; } catch { return null; } }
