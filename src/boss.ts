import { request, getGlobalPlayerId } from './global-ranking';

// 우리 반 협동 보스: 같은 반 코드를 쓰는 친구들의 정답 수가 이번 주 보스의 체력을 함께 깎아요.
// 서버에는 반 코드, 기기 번호, 정답 수만 보내요(이름은 보내지 않아요). 서버가 아직 준비되지 않아도 게임은 그대로 돼요.
export const BOSS_KEY = 'berry-forest-boss-v1';
export const BOSS_REWARD = 100, BOSS_MIN_HITS_FOR_REWARD = 10;
const BOSSES = [
  { icon: '🐉', name: '심술 용' }, { icon: '👻', name: '장난 유령' }, { icon: '🦑', name: '먹물 문어' }, { icon: '🐲', name: '구름 드래곤' },
  { icon: '🦖', name: '쿵쿵 공룡' }, { icon: '🐙', name: '엉킨 낙지' }, { icon: '🦇', name: '밤안개 박쥐' }, { icon: '🐊', name: '진흙 악어' },
] as const;

type Store = Pick<Storage, 'getItem' | 'setItem'>;
export interface BossLocal { week: string; damage: number; classCode: string; claimedWeek: string }
export interface BossSummary { week: string; classCode: string; members: number; damage: number; maxHp: number; defeated: boolean; mine: number }

/** ISO 주차(예: 2026-W40). worker/index.js의 isoWeekKey와 같은 규칙이에요. */
export function isoWeek(now = Date.now()): string {
  const date = new Date(now), day = (date.getUTCDay() + 6) % 7;
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 3));
  const jan4 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((thursday.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
export function bossOfWeek(week: string) {
  const [year, number] = week.split('-W').map(Number);
  return BOSSES[((year ?? 0) * 53 + (number ?? 0)) % BOSSES.length];
}
export function normalizeClassCode(value: string): string | null {
  const code = value.trim().toLowerCase();
  return /^[0-9a-z가-힣]{2,12}$/.test(code) ? code : null;
}

function load(storage: Store): Partial<BossLocal> { try { const value = JSON.parse(storage.getItem(BOSS_KEY) ?? '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; } }
function save(storage: Store, value: BossLocal) { try { storage.setItem(BOSS_KEY, JSON.stringify(value)); } catch { /* 저장 공간이 없어도 게임은 계속돼요 */ } }

/** 이번 주 내 정답 수와 반 코드. 주가 바뀌면 정답 수는 0부터 다시 시작해요. */
export function readBoss(storage: Store, now = Date.now()): BossLocal {
  const stored = load(storage), week = isoWeek(now);
  const damage = stored.week === week && Number.isSafeInteger(stored.damage) && stored.damage! >= 0 ? stored.damage! : 0;
  return { week, damage, classCode: typeof stored.classCode === 'string' && normalizeClassCode(stored.classCode) ? stored.classCode : '', claimedWeek: typeof stored.claimedWeek === 'string' ? stored.claimedWeek : '' };
}
export function addBossDamage(storage: Store, amount = 1, now = Date.now()): BossLocal {
  const local = readBoss(storage, now); local.damage = Math.min(100_000, local.damage + amount); save(storage, local); return local;
}
export function setClassCode(storage: Store, code: string, now = Date.now()): string | null {
  const normalized = code.trim() === '' ? '' : normalizeClassCode(code);
  if (normalized === null) return null;
  const local = readBoss(storage, now); local.classCode = normalized; save(storage, local); return normalized;
}

export function parseBossSummary(value: unknown): BossSummary | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>, ok = (n: unknown, max: number) => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= max;
  if (typeof v.week !== 'string' || typeof v.classCode !== 'string' || !ok(v.members, 10_000) || !ok(v.damage, 10_000_000) || !ok(v.maxHp, 10_000_000) || !ok(v.mine, 100_000) || typeof v.defeated !== 'boolean') return null;
  return { week: v.week, classCode: v.classCode, members: v.members as number, damage: v.damage as number, maxHp: v.maxHp as number, defeated: v.defeated, mine: v.mine as number };
}

/** 내 정답 수를 서버에 올리고 반 전체 현황을 받아와요. 서버가 준비되지 않았으면 null이에요. */
export async function syncBoss(storage: Store, now = Date.now()): Promise<BossSummary | null> {
  const local = readBoss(storage, now); if (!local.classCode) return null;
  const playerId = getGlobalPlayerId(storage as Storage), code = encodeURIComponent(local.classCode);
  try {
    if (local.damage > 0) return parseBossSummary(await request('/api/boss', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ classCode: local.classCode, playerId, damage: local.damage }) }));
    return parseBossSummary(await request(`/api/boss?class=${code}&player_id=${encodeURIComponent(playerId)}`));
  } catch { return null; }
}

/** 보스를 물리친 주에 한 번만, 10번 이상 정답으로 참여한 친구에게 보상을 줘요. 받을 베리 수(없으면 0)를 돌려줘요. */
export function claimBossReward(storage: Store, summary: BossSummary | null, now = Date.now()): number {
  const local = readBoss(storage, now);
  if (!summary?.defeated || summary.week !== local.week || local.claimedWeek === local.week || local.damage < BOSS_MIN_HITS_FOR_REWARD) return 0;
  local.claimedWeek = local.week; save(storage, local); return BOSS_REWARD;
}
