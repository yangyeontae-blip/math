// 광장·상점거리 거래: 베리와 무기·옷·펫·탈것을 서로 주고받아요.
// 서버는 두 사람의 제안과 확정만 전달하고, 받는 쪽과 주는 쪽이 같은 규칙(이 파일)으로 각자 저장에 반영해요.
// 수수료: 내가 보내는 것의 가치(베리 + 상점 가격)의 1%를 베리로 내요(0보다 크면 최소 1베리).
import { OUTFITS, PETS, RIDES, WEAPONS, type Save } from './rules';

export type TradeItemKind = 'weapon' | 'outfit' | 'pet' | 'ride';
export type TradeItem = { kind: TradeItemKind; id: number; level: number };
export type TradeOffer = { berries: number; items: TradeItem[] };

export const TRADE_FEE_RATE = 0.01;
export const TRADE_MAX_ITEMS = 8;
export const TRADE_MAX_BERRIES = 100_000_000;
export const EMPTY_OFFER: TradeOffer = { berries: 0, items: [] };
const KINDS: TradeItemKind[] = ['weapon', 'outfit', 'pet', 'ride'];
const CATALOG = { weapon: WEAPONS, outfit: OUTFITS, pet: PETS, ride: RIDES } as const;
const KIND_NAMES: Record<TradeItemKind, string> = { weapon: '무기', outfit: '옷', pet: '펫', ride: '탈것' };

/** 서버와 클라이언트가 함께 쓰는 모양 검사예요. 값이 이상하면 null. */
export function parseTradeOffer(value: unknown): TradeOffer | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<TradeOffer>;
  if (!Number.isSafeInteger(v.berries) || v.berries! < 0 || v.berries! > TRADE_MAX_BERRIES) return null;
  if (!Array.isArray(v.items) || v.items.length > TRADE_MAX_ITEMS) return null;
  const items: TradeItem[] = [], seen = new Set<string>();
  for (const raw of v.items) {
    const item = raw as Partial<TradeItem>;
    if (!item || !KINDS.includes(item.kind as TradeItemKind) || !Number.isSafeInteger(item.id) || item.id! < 0 || item.id! >= CATALOG[item.kind as TradeItemKind].length) return null;
    if (!Number.isSafeInteger(item.level) || item.level! < 0 || item.level! > 20) return null;
    const key = item.kind + ':' + item.id;
    if (seen.has(key)) return null;
    seen.add(key); items.push({ kind: item.kind as TradeItemKind, id: item.id!, level: item.level! });
  }
  return { berries: v.berries!, items };
}

export function itemName(item: Pick<TradeItem, 'kind' | 'id'>) { return CATALOG[item.kind][item.id]?.name ?? KIND_NAMES[item.kind]; }
export function itemKindName(kind: TradeItemKind) { return KIND_NAMES[kind]; }
export function offerValue(offer: TradeOffer) { return offer.berries + offer.items.reduce((sum, item) => sum + (CATALOG[item.kind][item.id]?.price ?? 0), 0); }
export function tradeFee(offer: TradeOffer) { const value = offerValue(offer); return value > 0 ? Math.max(1, Math.ceil(value * TRADE_FEE_RATE)) : 0; }

function owned(s: Save, kind: TradeItemKind, id: number) {
  return kind === 'weapon' ? s.weapons[id] !== undefined : kind === 'outfit' ? s.outfits[id] !== undefined : kind === 'pet' ? !!s.pets[id] : !!s.rides[id];
}
function equipped(s: Save, kind: TradeItemKind, id: number) {
  return kind === 'weapon' ? s.weapon === id : kind === 'outfit' ? s.outfit === id : kind === 'pet' ? s.pet === id : s.ride === id;
}

/** 내가 내놓을 수 있는 것: 가지고 있고, 지금 쓰고 있지 않고, 처음 받은 기본 장비(0번)가 아닌 것. */
export function tradableItems(s: Save): TradeItem[] {
  const list: TradeItem[] = [];
  for (const kind of KINDS) CATALOG[kind].forEach((_, id) => {
    if (id === 0 || !owned(s, kind, id) || equipped(s, kind, id)) return;
    list.push({ kind, id, level: kind === 'weapon' ? s.weapons[id] : kind === 'outfit' ? s.outfits[id] : 0 });
  });
  return list;
}

/** 확정하기 전에 내 제안이 지금 저장과 맞는지 확인해요. 문제가 있으면 아이에게 보여 줄 문장을 돌려줘요. */
export function checkOwnOffer(s: Save, offer: TradeOffer): string | null {
  const fee = tradeFee(offer);
  if (offer.berries + fee > s.berries) return `베리가 모자라요. 보낼 베리 ${offer.berries.toLocaleString()} + 수수료 ${fee.toLocaleString()}베리가 필요해요.`;
  for (const item of offer.items) {
    if (item.id === 0 || !owned(s, item.kind, item.id)) return `${itemName(item)}을(를) 가지고 있지 않아요.`;
    if (equipped(s, item.kind, item.id)) return `${itemName(item)}은(는) 지금 쓰고 있어서 보낼 수 없어요. 다른 것으로 바꿔 끼운 뒤 다시 골라 주세요.`;
  }
  return null;
}

/** 거래 완료: 내가 준 것을 빼고(수수료 포함) 받은 것을 넣어요. 같은 거래를 두 번 반영하지 않도록 거래 번호는 부르는 쪽에서 기억해요. */
export function applyTrade(s: Save, gave: TradeOffer, got: TradeOffer) {
  const fee = tradeFee(gave);
  s.berries = Math.max(0, s.berries - gave.berries - fee) + got.berries;
  for (const item of gave.items) {
    if (equipped(s, item.kind, item.id)) continue;
    if (item.kind === 'weapon') delete s.weapons[item.id];
    else if (item.kind === 'outfit') delete s.outfits[item.id];
    else if (item.kind === 'pet') delete s.pets[item.id];
    else delete s.rides[item.id];
  }
  for (const item of got.items) {
    if (item.kind === 'weapon') s.weapons[item.id] = Math.max(s.weapons[item.id] ?? 0, Math.min(10, item.level));
    else if (item.kind === 'outfit') { s.outfits[item.id] = Math.max(s.outfits[item.id] ?? 0, Math.min(10, item.level)); if (!s.discoveries.outfits.includes(item.id)) s.discoveries.outfits.push(item.id); }
    else if (item.kind === 'pet') { s.pets[item.id] = true; if (!s.discoveries.pets.includes(item.id)) s.discoveries.pets.push(item.id); }
    else s.rides[item.id] = true;
  }
  return { fee };
}
