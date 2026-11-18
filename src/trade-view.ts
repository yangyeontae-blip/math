// 거래 창: 광장·상점거리 친구 목록의 "거래하기"로 시작해요.
// 두 사람이 모두 "확정"을 눌러야 끝나고, 한쪽이 제안을 바꾸면 확정이 풀려요.
import type { PlazaPlayer } from './plaza-protocol';
import type { TradeMessage } from './plaza-client';
import type { Save } from './rules';
import { EMPTY_OFFER, applyTrade, checkOwnOffer, itemKindName, itemName, parseTradeOffer, tradableItems, tradeFee, type TradeOffer } from './trade';

type Send = (message: { type: 'trade-request' | 'trade-reply' | 'trade-offer' | 'trade-lock' | 'trade-cancel'; [key: string]: unknown }) => boolean;
type Hooks = { state: () => Save | null; send: Send; open: (html: string, cls?: string) => void; close: () => void; persist: () => void; refresh: () => void; toast: (text: string) => void };

const esc = (text: string) => text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const n = (value: number) => value.toLocaleString('ko-KR');
const REASONS: Record<string, string> = { declined: '상대가 거래를 거절했어요.', cancelled: '거래가 취소됐어요. 아무것도 오가지 않았어요.', gone: '상대가 자리를 떠나 거래가 끝났어요. 아무것도 오가지 않았어요.', busy: '지금은 둘 중 한 명이 다른 거래 중이에요. 잠시 뒤 다시 신청해 주세요.', expired: '5분 동안 끝나지 않아 거래가 닫혔어요. 아무것도 오가지 않았어요.' };

export function offerText(offer: TradeOffer) {
  const parts = [...(offer.berries ? [`${n(offer.berries)}베리`] : []), ...offer.items.map(item => `${itemKindName(item.kind)} · ${itemName(item)}${item.level ? ` +${item.level}` : ''}`)];
  return parts.length ? parts : ['아직 아무것도 올리지 않았어요'];
}

export function mountTrade(h: Hooks) {
  let current: { id: string; partner: string; mine: TradeOffer; theirs: TradeOffer; myLock: boolean; theirLock: boolean } | null = null;
  let draft: TradeOffer = EMPTY_OFFER, sendTimer: ReturnType<typeof setTimeout> | undefined;
  const applied = new Set<string>();
  const el = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);

  function readDraft(): TradeOffer {
    const berries = Math.max(0, Math.floor(Number(el<HTMLInputElement>('#trade-berries')?.value) || 0));
    const items = [...document.querySelectorAll<HTMLInputElement>('[data-trade-item]:checked')].map(box => JSON.parse(box.dataset.tradeItem!));
    return parseTradeOffer({ berries, items }) ?? EMPTY_OFFER;
  }
  function updateLive() {
    const s = h.state(); if (!s || !current) return;
    const fee = tradeFee(draft), problem = checkOwnOffer(s, draft);
    const feeEl = el('#trade-fee'); if (feeEl) feeEl.textContent = `수수료 ${n(fee)}베리 (보내는 것 가치의 1%) · 내 베리 ${n(s.berries)}`;
    const err = el('#trade-error'); if (err) err.textContent = problem ?? '';
    const theirs = el('#trade-theirs'); if (theirs) theirs.innerHTML = offerText(current.theirs).map(t => `<li>${esc(t)}</li>`).join('');
    const lockState = el('#trade-locks'); if (lockState) lockState.textContent = `${current.myLock ? '나: 확정함' : '나: 고르는 중'} · ${current.theirLock ? `${current.partner}: 확정함` : `${current.partner}: 고르는 중`}`;
    const lock = el<HTMLButtonElement>('#trade-lock'); if (lock) { lock.disabled = !!problem || current.myLock; lock.textContent = current.myLock ? '상대의 확정을 기다려요' : '이대로 확정'; }
    document.querySelectorAll<HTMLInputElement>('#trade-mine input').forEach(input => input.disabled = current!.myLock);
  }
  function render(s: Save) {
    if (!current) return;
    const items = tradableItems(s);
    h.open(`<div class="trade-sheet"><header><small>광장 거래</small><h2>${esc(current.partner)}와(과) 거래</h2><p>두 사람 모두 확정하면 바로 주고받아요. 한쪽이 바꾸면 확정이 다시 풀려요.</p></header>
      <div class="trade-columns"><section id="trade-mine"><h3>내가 줄 것</h3><label class="trade-berries">베리 <input id="trade-berries" type="number" inputmode="numeric" min="0" step="1" value="${draft.berries}"></label>
      <div class="trade-items">${items.length ? items.map(item => `<label><input type="checkbox" data-trade-item='${JSON.stringify(item)}' ${draft.items.some(d => d.kind === item.kind && d.id === item.id) ? 'checked' : ''}><span>${esc(itemKindName(item.kind))}</span>${esc(itemName(item))}${item.level ? ` +${item.level}` : ''}</label>`).join('') : '<p class="trade-empty">보낼 수 있는 물건이 없어요. 지금 쓰고 있는 장비와 기본 장비는 보낼 수 없어요.</p>'}</div>
      <p id="trade-fee" class="trade-fee"></p><p id="trade-error" class="error" role="alert"></p></section>
      <section><h3>받을 것</h3><ul id="trade-theirs" class="trade-theirs"></ul></section></div>
      <p id="trade-locks" class="trade-locks" role="status" aria-live="polite"></p>
      <div class="trade-actions"><button id="trade-lock" class="primary">이대로 확정</button><button id="trade-cancel" class="secondary">거래 취소</button></div></div>`, 'trade-modal');
    const changed = () => { draft = readDraft(); updateLive(); if (sendTimer) clearTimeout(sendTimer); sendTimer = setTimeout(() => { if (current) h.send({ type: 'trade-offer', tradeId: current.id, offer: draft }); }, 250); };
    el('#trade-mine')!.addEventListener('input', changed);
    el<HTMLButtonElement>('#trade-lock')!.onclick = () => { const st = h.state(); if (!current || !st) return; draft = readDraft(); const problem = checkOwnOffer(st, draft); if (problem) { updateLive(); return; } if (sendTimer) clearTimeout(sendTimer); h.send({ type: 'trade-offer', tradeId: current.id, offer: draft }); h.send({ type: 'trade-lock', tradeId: current.id }); };
    el<HTMLButtonElement>('#trade-cancel')!.onclick = () => { if (current) h.send({ type: 'trade-cancel', tradeId: current.id }); };
    updateLive();
  }

  return {
    start(peer: PlazaPlayer) {
      if (!h.send({ type: 'trade-request', to: peer.id })) { h.toast('광장에 연결된 뒤 거래할 수 있어요.'); return; }
      h.toast(`${peer.profile.nickname}에게 거래를 신청했어요.`);
    },
    receive(m: TradeMessage) {
      const s = h.state(); if (!s) return;
      if (m.type === 'trade-invite') {
        const id = String(m.tradeId), from = esc(String((m.from as { nickname?: string })?.nickname ?? '친구'));
        h.open(`<div class="trade-sheet"><header><small>광장 거래</small><h2>${from}이(가) 거래를 신청했어요</h2><p>베리와 무기·옷·펫·탈것을 주고받을 수 있어요. 보내는 쪽이 가치의 1%를 수수료로 내요.</p></header><div class="trade-actions"><button id="trade-accept" class="primary">거래 창 열기</button><button id="trade-decline" class="secondary">괜찮아요</button></div></div>`, 'trade-modal');
        el<HTMLButtonElement>('#trade-accept')!.onclick = () => h.send({ type: 'trade-reply', tradeId: id, accept: true });
        el<HTMLButtonElement>('#trade-decline')!.onclick = () => { h.send({ type: 'trade-reply', tradeId: id, accept: false }); h.close(); };
        return;
      }
      if (m.type === 'trade-pending') { h.toast(`${String((m.to as { nickname?: string })?.nickname ?? '친구')}의 대답을 기다려요.`); return; }
      if (m.type === 'trade-state') {
        const mine = parseTradeOffer(m.mine) ?? EMPTY_OFFER, theirs = parseTradeOffer(m.theirs) ?? EMPTY_OFFER, id = String(m.tradeId);
        const fresh = current?.id !== id;
        current = { id, partner: String((m.partner as { nickname?: string })?.nickname ?? '친구'), mine, theirs, myLock: m.myLock === true, theirLock: m.theirLock === true };
        if (fresh || !el('#trade-mine')) { draft = mine; render(s); } else updateLive();
        return;
      }
      if (m.type === 'trade-done') {
        const id = String(m.tradeId), gave = parseTradeOffer(m.gave), got = parseTradeOffer(m.got);
        if (!gave || !got || applied.has(id)) return;
        applied.add(id);
        const { fee } = applyTrade(s, gave, got);
        h.persist(); h.refresh(); current = null; h.close();
        h.toast(`거래 완료! ${got.berries || got.items.length ? `받은 것: ${offerText(got).join(', ')}` : '보내기만 했어요'}${fee ? ` · 수수료 ${n(fee)}베리` : ''}`);
        return;
      }
      if (m.type === 'trade-closed') {
        if (!m.tradeId || current?.id === m.tradeId) { if (current) h.close(); current = null; }
        h.toast(REASONS[String(m.reason)] ?? '거래가 끝났어요.');
      }
    },
  };
}
