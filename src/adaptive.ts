import type { PracticeTier } from './rules';

// 계산 대련의 "자동 조절": 연속 정답이면 한 단계 어렵게, 연속 오답이면 한 단계 쉽게.
// 아이가 직접 고른 경우에만 켜지고(기본은 꺼짐), 저장 파일은 바꾸지 않아요.
export interface AdaptiveLevel { tier: PracticeTier; streak: number; misses: number }
export const ADAPT_UP_STREAK = 3, ADAPT_DOWN_MISSES = 2;
const KEY = 'berry-forest-adaptive-practice-v1';

export const startLevel = (tier: PracticeTier): AdaptiveLevel => ({ tier, streak: 0, misses: 0 });

/** 한 문제의 결과(처음 시도 기준)를 반영한 새 단계를 돌려줘요. 단계가 바뀌면 연속 기록은 0부터 다시 시작해요. */
export function adaptiveRecord(level: AdaptiveLevel, correct: boolean): AdaptiveLevel {
  if (correct) {
    const streak = level.streak + 1;
    return streak >= ADAPT_UP_STREAK && level.tier < 2 ? { tier: (level.tier + 1) as PracticeTier, streak: 0, misses: 0 } : { tier: level.tier, streak: Math.min(streak, ADAPT_UP_STREAK), misses: 0 };
  }
  const misses = level.misses + 1;
  return misses >= ADAPT_DOWN_MISSES && level.tier > 0 ? { tier: (level.tier - 1) as PracticeTier, streak: 0, misses: 0 } : { tier: level.tier, streak: 0, misses: Math.min(misses, ADAPT_DOWN_MISSES) };
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;
export function adaptiveEnabled(storage: Store = localStorage): boolean { try { return storage.getItem(KEY) === '1'; } catch { return false; } }
export function setAdaptive(on: boolean, storage: Store = localStorage) { try { storage.setItem(KEY, on ? '1' : '0'); } catch { /* 저장 공간이 없어도 이번 세션에는 쓸 수 있어요 */ } }
