import { FEEDBACK_CATEGORIES, feedbackError, sendFeedback, type FeedbackCategory } from './feedback';
import './feedback.css';

// 의견 초안은 메모리에만 둔다. 게임 저장·학습 기록과 섞거나 자동 전송하지 않는다.
const draft = { category: FEEDBACK_CATEGORIES[0] as FeedbackCategory, message: '', consent: false, requestId: '', sent: false, busy: false, result: '' };
let revision = 0;
let refreshActive = () => {};
export function showFeedback(open: (html: string, cls?: string) => void, heading: (kicker: string, name: string) => string, back: () => void) {
  const version = ++revision;
  open(heading('운영자에게 의견 보내기', '함께 베리숲을 다듬어요') + `<form id="feedback-form" class="feedback-form">
    <p>불편했던 점이나 바라는 기능을 알려 주세요. 보내주신 글은 공개 게시판 대신 운영자 메일로 전달돼요.</p>
    <p class="note">이름·학교·학급·연락처는 적지 마세요. 닉네임·학습 기록·저장 파일은 첨부하지 않아요. 답장 기능은 없어요.</p>
    <label for="feedback-category">어떤 의견인가요?</label><select id="feedback-category">${FEEDBACK_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select>
    <label for="feedback-message">보내실 내용</label><textarea id="feedback-message" minlength="5" maxlength="1000" rows="6" placeholder="어느 화면에서 어떤 점이 불편했는지 알려 주세요." required></textarea>
    <small id="feedback-count">0 / 1,000자</small>
    <label class="feedback-consent"><input id="feedback-consent" type="checkbox" required><span>작성한 의견과 분류를 운영자 이메일로 보내는 데 동의합니다. 보호자와 함께 확인해 주세요.</span></label>
    <p class="note">전송할 때만 메일 발송 서비스(Resend)를 통해 전달됩니다. 초안은 창을 닫았다 다시 열어도 유지되지만, 게임 새로고침·종료 시 사라집니다.</p>
    <p id="feedback-result" role="status" aria-live="polite"></p><button id="feedback-submit" class="primary wide" type="submit">의견 보내기</button>
  </form>`, 'feedback-modal');
  document.querySelector<HTMLButtonElement>('#modal-back')!.onclick = back;
  const form = document.querySelector<HTMLFormElement>('#feedback-form')!;
  const category = form.querySelector<HTMLSelectElement>('#feedback-category')!;
  const message = form.querySelector<HTMLTextAreaElement>('#feedback-message')!;
  const consent = form.querySelector<HTMLInputElement>('#feedback-consent')!;
  const submit = form.querySelector<HTMLButtonElement>('#feedback-submit')!;
  const result = form.querySelector<HTMLElement>('#feedback-result')!;
  category.value = draft.category; message.value = draft.message; consent.checked = draft.consent;
  const render = () => {
    form.querySelector('#feedback-count')!.textContent = `${message.value.length} / 1,000자`;
    category.disabled = message.disabled = consent.disabled = draft.busy;
    submit.disabled = draft.busy || draft.sent;
    submit.textContent = draft.busy ? '보내는 중…' : draft.sent ? '의견을 보냈어요' : '의견 보내기';
    result.textContent = draft.result;
  };
  refreshActive = () => { if (version === revision && form.isConnected) { message.value = draft.message; consent.checked = draft.consent; render(); } };
  const edit = () => {
    draft.category = category.value as FeedbackCategory; draft.message = message.value; draft.consent = consent.checked;
    draft.requestId = ''; draft.sent = false; draft.result = ''; render();
  };
  category.onchange = consent.onchange = edit; message.oninput = edit;
  form.onsubmit = async event => {
    event.preventDefault(); if (draft.busy || draft.sent) return;
    const error = feedbackError(draft.category, draft.message, draft.consent);
    if (error) { draft.result = error; render(); return; }
    draft.requestId ||= crypto.randomUUID(); draft.busy = true; draft.result = ''; render();
    try {
      await sendFeedback({ category: draft.category, message: draft.message, consent: draft.consent, requestId: draft.requestId });
      draft.sent = true; draft.message = ''; draft.consent = false; draft.result = '고맙습니다! 의견을 메일 발송 서비스에 전달했어요.';
    } catch (error) { draft.result = (error as Error).message; }
    finally { draft.busy = false; refreshActive(); }
  };
  render(); message.focus();
}
