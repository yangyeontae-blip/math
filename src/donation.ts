// 광장 작은 기부함(2026-11-26): 아이들이 베리를 내고, 모두 함께 얼마나 모았는지 본다.
// 서버에는 금액과 요청 번호만 간다(이름·저장 기록은 보내지 않음). 서버가 받기 전에는 베리를 빼지 않는다.
import type { Save } from './rules';

const API_ORIGIN = ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_RANKING_API || 'https://berry-forest.yangyeontae.workers.dev').replace(/\/+$/, '');
export const DONATION_URL = API_ORIGIN + '/api/donation';
export const DONATION_MAX = 100_000;
export const DONATION_PRESETS = [10, 100, 1_000, 10_000];
/** 모두의 합계가 이만큼 모이면 기부함 둘레가 하나씩 꾸며져요. */
export const DONATION_GOALS = [
  { at: 10_000, label: '기부함 둘레에 꽃이 피어요' },
  { at: 100_000, label: '반딧불 등불 두 개가 켜져요' },
  { at: 1_000_000, label: '무지개 깃발이 올라가요' },
  { at: 10_000_000, label: '베리 나무 화관이 생겨요' },
] as const;
export type DonationTotal = { total: number; gifts: number };

export const donationOf = (s: Save) => (s.donation ??= { given: 0, gifts: 0 });
export const goalsReached = (total: number) => DONATION_GOALS.filter(g => total >= g.at).length;
export function donationError(s: Save, amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 1) return '낼 베리를 1베리 이상 골라 주세요.';
  if (amount > DONATION_MAX) return `한 번에 ${DONATION_MAX.toLocaleString('ko-KR')}베리까지 낼 수 있어요.`;
  if (amount > s.berries) return `베리가 ${(amount - s.berries).toLocaleString('ko-KR')}개 모자라요.`;
  return '';
}
/** 서버가 받은 뒤에만 부른다: 베리를 빼고 내 기록에 더한다. */
export function applyDonation(s: Save, amount: number) {
  const d = donationOf(s); s.berries -= amount; d.given = Math.min(1e12, d.given + amount); d.gifts = Math.min(1e9, d.gifts + 1);
}
const parseTotal = (v: unknown): DonationTotal | null => {
  const o = v as Partial<DonationTotal> | null;
  return o && Number.isSafeInteger(o.total) && Number.isSafeInteger(o.gifts) && o.total! >= 0 && o.gifts! >= 0 ? { total: o.total!, gifts: o.gifts! } : null;
};
async function call(init: RequestInit | undefined, fetcher: typeof fetch): Promise<DonationTotal> {
  let response: Response;
  try { response = await fetcher(DONATION_URL, { cache: 'no-store', ...init }); } catch { throw new Error('기부함에 연결하지 못했어요. 인터넷을 확인하고 다시 해 봐요.'); }
  const body = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error || (response.status === 404 || response.status === 503 ? '기부함을 준비하는 중이에요.' : '기부함이 잠시 쉬고 있어요.'));
  const total = parseTotal(body);
  if (!total) throw new Error('기부함 소식을 읽지 못했어요.');
  return total;
}
export const fetchDonationTotal = (fetcher: typeof fetch = fetch) => call(undefined, fetcher);
export const sendDonation = (amount: number, requestId: string, fetcher: typeof fetch = fetch) =>
  call({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount, requestId }) }, fetcher);
