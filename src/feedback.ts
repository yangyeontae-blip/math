export const FEEDBACK_CATEGORIES = ['개선 제안', '오류 제보', '좋았던 점'] as const;
export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];
export type FeedbackPayload = { category: FeedbackCategory; message: string; consent: boolean; requestId: string };

export function feedbackError(category: string, message: string, consent: boolean): string {
  if (!(FEEDBACK_CATEGORIES as readonly string[]).includes(category)) return '의견 종류를 골라 주세요.';
  if (message.trim().length < 5 || message.trim().length > 1000) return '의견은 5~1,000자로 적어 주세요.';
  if (!consent) return '운영자에게 의견을 보내는 데 동의해 주세요.';
  return '';
}

export async function sendFeedback(payload: FeedbackPayload, fetcher: typeof fetch = fetch): Promise<void> {
  const error = feedbackError(payload.category, payload.message, payload.consent);
  if (error) throw new Error(error);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetcher('https://berry-forest-school.yangyeontae.chatgpt.site/api/feedback', {
      method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category: payload.category, message: payload.message.trim(), consent: payload.consent, requestId: payload.requestId }), signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true) {
      throw new Error(response.status === 429 ? '의견을 연달아 보냈어요. 10분 뒤 다시 보내 주세요.'
        : response.status === 503 || response.status === 404 ? '의견 받기를 준비 중이에요. 작성한 글은 이 화면에서 유지돼요.'
        : '전송을 확인하지 못했어요. 작성한 글을 유지했으니 다시 시도해 주세요.');
    }
  } catch (error) {
    if (error instanceof TypeError || (error as Error).name === 'AbortError') throw new Error('연결이 불안정해 전송을 확인하지 못했어요. 같은 글로 다시 시도해 주세요.');
    throw error;
  } finally { clearTimeout(timer); }
}
