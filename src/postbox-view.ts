// 광장 '베리숲 우체통': 아이들이 고장·바람·좋았던 점을 편지로 보낸다(2026-11-23, Codex 수채화 시안).
// 보내는 길은 기존 의견 보내기(/api/feedback)와 같다. 이름·저장 기록은 함께 보내지 않는다.
import { feedbackError, sendFeedback } from './feedback';
import { POSTBOX_KINDS, POSTBOX_REWARD } from './postbox';
import './postbox.css';

type Hooks = { open: (html: string, cls?: string) => void; close: () => void; toast: (m: string) => void; reward: (berries: number) => void };
const draft = { kind: 'bug', message: '', consent: false, requestId: '', busy: false };

export function showPostbox(h: Hooks) {
  const art = import.meta.env.BASE_URL + 'art/postbox/';
  const kind = () => POSTBOX_KINDS.find(k => k.id === draft.kind) ?? POSTBOX_KINDS[0];
  h.open(`<section class="postbox-letter" style="--paper:url('${art}paper.webp')">
    <button class="postbox-close" data-postbox-close aria-label="우체통 닫기">×</button>
    <header><img class="postbox-envelope" src="${art}envelope.webp" alt="" aria-hidden="true"><div><span class="postbox-kicker">베리숲 우체통</span><h2>베리숲을 만든 선생님께 편지 쓰기</h2></div><img class="postbox-stamp" src="${art}stamp.webp" alt="" aria-hidden="true"></header>
    <div class="postbox-kinds" role="radiogroup" aria-label="어떤 편지인가요?">${POSTBOX_KINDS.map(k => `<button type="button" role="radio" class="postbox-kind postbox-kind-${k.id}" data-kind="${k.id}" aria-checked="${k.id === draft.kind}"><img src="${art}${k.icon}.webp" alt="" aria-hidden="true"><span>${k.label}</span></button>`).join('')}</div>
    <label class="postbox-write"><span class="sr-only">편지 내용</span><textarea id="postbox-message" maxlength="1000" rows="6" placeholder="${kind().hint}"></textarea><small id="postbox-count">0 / 1000</small></label>
    <p class="postbox-lock"><img src="${art}seal.webp" alt="" aria-hidden="true">이름·학교·반·전화번호는 쓰지 마세요. 편지는 선생님 메일로만 가고, 친구들에게는 보이지 않아요.</p>
    <label class="postbox-consent"><input type="checkbox" id="postbox-consent"><span>편지를 베리숲 선생님께 보내도 좋아요. (보호자와 함께 확인해 주세요)</span></label>
    <p id="postbox-result" role="status" aria-live="polite"></p>
    <button class="postbox-send" id="postbox-send" type="button"><img src="${art}plane.webp" alt="" aria-hidden="true">편지 보내기</button>
  </section>`, 'postbox-modal');
  const root = document.querySelector<HTMLElement>('.postbox-letter')!;
  const message = root.querySelector<HTMLTextAreaElement>('#postbox-message')!, consent = root.querySelector<HTMLInputElement>('#postbox-consent')!;
  const send = root.querySelector<HTMLButtonElement>('#postbox-send')!, result = root.querySelector<HTMLElement>('#postbox-result')!;
  message.value = draft.message; consent.checked = draft.consent;
  const render = () => {
    root.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.kind === draft.kind)));
    message.placeholder = kind().hint; root.querySelector('#postbox-count')!.textContent = `${message.value.length} / 1000`;
    send.disabled = draft.busy; send.lastChild!.textContent = draft.busy ? '날아가는 중…' : '편지 보내기';
  };
  root.querySelector<HTMLButtonElement>('[data-postbox-close]')!.onclick = h.close;
  root.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(b => b.onclick = () => { draft.kind = b.dataset.kind!; draft.requestId = ''; render(); });
  message.oninput = () => { draft.message = message.value; draft.requestId = ''; result.textContent = ''; render(); };
  consent.onchange = () => { draft.consent = consent.checked; };
  send.onclick = async () => {
    if (draft.busy) return;
    const error = feedbackError(kind().category, draft.message, draft.consent);
    if (error) { result.textContent = error.replace('운영자에게 의견을 보내는 데', '편지를 보내는 데').replace('의견은', '편지는'); return; }
    draft.requestId ||= crypto.randomUUID(); draft.busy = true; result.textContent = ''; render();
    try {
      await sendFeedback({ category: kind().category, message: draft.message, consent: true, requestId: draft.requestId });
      draft.message = ''; draft.consent = false; draft.requestId = '';
      root.classList.add('postbox-flying');
      setTimeout(() => { h.close(); h.reward(POSTBOX_REWARD); }, 900);
    } catch (e) { result.textContent = (e as Error).message.replace('의견', '편지'); }
    finally { draft.busy = false; if (root.isConnected) render(); }
  };
  render(); message.focus();
}
