import { isBlockedNickname } from './nickname';

export type GlobalRank = { rank: number; nickname: string; completed: number; isMine: boolean };

// 랭킹 서버를 다른 곳으로 옮기면 빌드 때 VITE_RANKING_API=https://새-주소 로 지정해요(워커의 allowedOrigins에도 게임 주소를 넣어야 해요).
const API_ORIGIN = (import.meta.env?.VITE_RANKING_API as string | undefined)?.replace(/\/+$/, '') || 'https://berry-forest-school.yangyeontae.chatgpt.site';
const PLAYER_ID_KEY = 'berry-forest-global-player-id-v1';
const SYNC_KEY = 'berry-forest-global-rank-synced-v1';

function apiUrl(path: string) {
  const sameSite = typeof location !== 'undefined' && location.origin === API_ORIGIN;
  return `${sameSite ? '' : API_ORIGIN}${path}`;
}

function freshPlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `berry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export function getGlobalPlayerId(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const saved = storage.getItem(PLAYER_ID_KEY);
  if (saved && /^[a-zA-Z0-9-]{16,64}$/.test(saved)) return saved;
  const created = freshPlayerId(); storage.setItem(PLAYER_ID_KEY, created); return created;
}

export function parseGlobalRanks(value: unknown): GlobalRank[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { rankings?: unknown }).rankings)) return [];
  return (value as { rankings: unknown[] }).rankings.filter((item): item is GlobalRank => {
    if (!item || typeof item !== 'object') return false;
    const rank = item as GlobalRank;
    return Number.isSafeInteger(rank.rank) && rank.rank >= 1 && rank.rank <= 50
      && typeof rank.nickname === 'string' && [...rank.nickname].length >= 1 && [...rank.nickname].length <= 10
      && Number.isSafeInteger(rank.completed) && rank.completed >= 0 && rank.completed <= 100_000
      && typeof rank.isMine === 'boolean';
  }).slice(0, 50);
}

export async function request(path: string, init?: RequestInit) {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(apiUrl(path), { ...init, signal: controller.signal });
    if (!response.ok) throw new Error('전체 랭킹 서버가 잠시 쉬고 있어요.');
    return await response.json() as unknown;
  } finally { clearTimeout(timeout); }
}

export async function loadGlobalRanks(playerId: string) {
  return parseGlobalRanks(await request(`/api/rankings?player_id=${encodeURIComponent(playerId)}`));
}

export async function syncGlobalRank(storage: Pick<Storage, 'getItem' | 'setItem'>, playerId: string, nickname: string, completed: number) {
  const signature = JSON.stringify([nickname.trim(), completed]);
  if (completed > 0 && !isBlockedNickname(nickname) && storage.getItem(SYNC_KEY) !== signature) {
    await request('/api/rankings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ playerId, nickname, completed }) });
    storage.setItem(SYNC_KEY, signature);
  }
  return loadGlobalRanks(playerId);
}
