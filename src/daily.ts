import type { Save } from './rules';

export interface DailyState { date: string; progress: number[]; claimed: boolean[]; allClaimed: boolean; streak: number; lastStamp: string }
export type DailyKind = 'correct' | 'monster' | 'berry';
export interface DailyMission { kind: DailyKind; icon: string; label: string; goal: number; reward: number }
/** 미션 세 칸(정답·시합·베리)은 그대로 두고, 날짜마다 목표 개수와 보상이 바뀌어요. */
const VARIANTS: Record<DailyKind, Omit<DailyMission, 'kind'>[]> = {
  correct: [{ icon: '✏️', label: '문제 5개 맞히기', goal: 5, reward: 60 }, { icon: '🧠', label: '문제 8개 맞히기', goal: 8, reward: 80 }, { icon: '🌟', label: '문제 10개 맞히기', goal: 10, reward: 100 }],
  monster: [{ icon: '⚔️', label: '몬스터 2마리와 시합하기', goal: 2, reward: 60 }, { icon: '⚔️', label: '몬스터 3마리와 시합하기', goal: 3, reward: 80 }, { icon: '👑', label: '몬스터 5마리와 시합하기', goal: 5, reward: 120 }],
  berry: [{ icon: '🍓', label: '베리 10개 줍기', goal: 10, reward: 40 }, { icon: '🍓', label: '베리 15개 줍기', goal: 15, reward: 50 }, { icon: '🧺', label: '베리 25개 줍기', goal: 25, reward: 80 }],
};
const KINDS: DailyKind[] = ['correct', 'monster', 'berry'];
export function dailyMissions(date: string): DailyMission[] {
  if (!date) return KINDS.map(kind => ({ kind, ...VARIANTS[kind][0] }));
  const pick = (kind: DailyKind) => { let h = 2166136261; for (const c of date + kind) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return (h >>> 7) % 3; };
  return KINDS.map(kind => ({ kind, ...VARIANTS[kind][pick(kind)] }));
}
/** 저장 검증용: 칸마다 목표가 될 수 있는 가장 작은 값과 큰 값(날짜별 목표가 바뀌어도 하던 저장이 거절되지 않게). */
export const DAILY_GOAL_LIMITS = KINDS.map(kind => ({ min: Math.min(...VARIANTS[kind].map(v => v.goal)), max: Math.max(...VARIANTS[kind].map(v => v.goal)) }));
/** 날짜가 정해지지 않았을 때의 기본 미션(칸 수 확인용). */
export const DAILY_MISSIONS = dailyMissions('');
export const DAILY_ALL_CLEAR_BONUS = 100;
export const DAILY_STAMPS = 7;
export const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function todayKey(now = new Date()) { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
function previousDay(key: string) { const [y, m, d] = key.split('-').map(Number); return todayKey(new Date(y, m - 1, d - 1)); }
export function emptyDaily(): DailyState { return { date: '', progress: DAILY_MISSIONS.map(() => 0), claimed: DAILY_MISSIONS.map(() => false), allClaimed: false, streak: 0, lastStamp: '' }; }

export function ensureDaily(s: Save, today = todayKey()): DailyState {
  const d = s.daily ??= emptyDaily();
  if (d.date !== today) { d.date = today; d.progress = DAILY_MISSIONS.map(() => 0); d.claimed = DAILY_MISSIONS.map(() => false); d.allClaimed = false; }
  return d;
}
export function recordDaily(s: Save, kind: DailyKind, amount = 1, today = todayKey()) {
  const d = ensureDaily(s, today), missions = dailyMissions(d.date), i = missions.findIndex(m => m.kind === kind);
  d.progress[i] = Math.min(missions[i].goal, d.progress[i] + amount);
}
export function dailyReady(s: Save, today = todayKey()) {
  const d = ensureDaily(s, today);
  return dailyMissions(d.date).some((m, i) => d.progress[i] >= m.goal && !d.claimed[i]);
}
export function dailyStampsShown(streak: number) { return streak === 0 ? 0 : ((streak - 1) % DAILY_STAMPS) + 1; }

export function claimDaily(s: Save, index: number, today = todayKey()) {
  const d = ensureDaily(s, today), mission = dailyMissions(d.date)[index];
  if (!mission || d.claimed[index] || d.progress[index] < mission.goal) throw new Error('아직 받을 수 없는 보상이에요.');
  d.claimed[index] = true;
  let berries = mission.reward, stamp = false, potion = false, allClear = false;
  if (d.lastStamp !== today) {
    d.streak = d.lastStamp === previousDay(today) ? d.streak + 1 : 1; d.lastStamp = today; stamp = true;
    berries += 20 * dailyStampsShown(d.streak);
    if (d.streak % DAILY_STAMPS === 0 && s.potions.stock[0] < 99) { s.potions.stock[0]++; potion = true; }
  }
  if (!d.allClaimed && d.claimed.every(Boolean)) { d.allClaimed = true; berries += DAILY_ALL_CLEAR_BONUS; allClear = true; }
  s.berries += berries;
  return { berries, stamp, potion, allClear, streak: d.streak };
}
