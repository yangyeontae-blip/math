import type { Save } from './rules';

export interface DailyState { date: string; progress: number[]; claimed: boolean[]; allClaimed: boolean; streak: number; lastStamp: string }
export const DAILY_MISSIONS = [
  { kind: 'correct', icon: '✏️', label: '문제 5개 맞히기', goal: 5, reward: 60 },
  { kind: 'monster', icon: '⚔️', label: '몬스터 3마리 대련하기', goal: 3, reward: 80 },
  { kind: 'berry', icon: '🍓', label: '베리 15개 줍기', goal: 15, reward: 50 },
] as const;
export type DailyKind = typeof DAILY_MISSIONS[number]['kind'];
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
  const d = ensureDaily(s, today), i = DAILY_MISSIONS.findIndex(m => m.kind === kind);
  d.progress[i] = Math.min(DAILY_MISSIONS[i].goal, d.progress[i] + amount);
}
export function dailyReady(s: Save, today = todayKey()) {
  const d = ensureDaily(s, today);
  return DAILY_MISSIONS.some((m, i) => d.progress[i] >= m.goal && !d.claimed[i]);
}
export function dailyStampsShown(streak: number) { return streak === 0 ? 0 : ((streak - 1) % DAILY_STAMPS) + 1; }

export function claimDaily(s: Save, index: number, today = todayKey()) {
  const d = ensureDaily(s, today), mission = DAILY_MISSIONS[index];
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
