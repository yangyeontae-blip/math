// 광장 우체통의 규칙(화면 없이 시험할 수 있는 부분).
import type { FeedbackCategory } from './feedback';

export const POSTBOX_KINDS: { id: string; icon: string; label: string; category: FeedbackCategory; hint: string }[] = [
  { id: 'bug', icon: 'bug', label: '고장 났어요', category: '오류 제보', hint: '어디서 무엇을 하다가 이상했는지 적어 주세요.' },
  { id: 'idea', icon: 'idea', label: '이렇게 바꿔 주세요', category: '개선 제안', hint: '있으면 좋겠는 것, 바꾸고 싶은 것을 적어 주세요.' },
  { id: 'love', icon: 'heart', label: '좋았어요', category: '좋았던 점', hint: '재미있었던 것, 고마운 마음을 적어 주세요.' },
];
export const POSTBOX_REWARD = 50;
const REWARD_KEY = 'berry-forest-postbox-reward-v1';

/** 하루 첫 편지에만 베리를 준다. 날짜는 이 기기에만 적는다(편지 도배 막기). */
export function postboxRewardToday(storage: Pick<Storage, 'getItem' | 'setItem'>, now = new Date()): boolean {
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  try { if (storage.getItem(REWARD_KEY) === day) return false; storage.setItem(REWARD_KEY, day); return true; } catch { return false; }
}

