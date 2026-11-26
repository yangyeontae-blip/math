// 광장 연못 낚시 · 수학자 카드. 베리를 내고 낚싯대를 던지면 수학자 카드 한 장을 낚아요.
// 등급을 먼저 뽑고(보통 70% · 희귀 22% · 영웅 7% · 전설 1%) 그 등급 안에서 고르게 한 장을 골라요.
// 겹친 카드는 조각이 되고, 조각으로 아직 없는 카드를 바꿀 수 있어 운이 나빠도 반드시 모을 수 있어요.
import type { Save } from './rules';

export type CardTier = 'common' | 'rare' | 'hero' | 'legend';
export type MathCard = { id: string; name: string; tier: CardTier; era: string; deed: string; story: string; emblem: string; portrait: boolean };
export type FishingState = { day: string; casts: number; cards: Record<string, number>; pieces: number; completed: boolean; tierClaimed?: CardTier[] };

export const CAST_COST = 50;
export const DAILY_CASTS = 10;
export const COMPLETE_BERRIES = 5000;
export const COMPLETE_TITLE = '수학자의 벗';
// berries: 낚을 때마다 돌려받는 베리(2026-11-26). 평균 약 40베리라 한 번 50베리보다 조금 적어요.
export const TIERS: Record<CardTier, { name: string; weight: number; piece: number; exchange: number; color: string; berries: number }> = {
  common: { name: '보통', weight: 70, piece: 1, exchange: 10, color: '#6d7a63', berries: 15 },
  rare: { name: '희귀', weight: 22, piece: 3, exchange: 25, color: '#2f6fb0', berries: 50 },
  hero: { name: '영웅', weight: 7, piece: 8, exchange: 60, color: '#8a46b0', berries: 150 },
  legend: { name: '전설', weight: 1, piece: 20, exchange: 150, color: '#b07a12', berries: 800 },
};
/** 한 등급의 카드를 모두 모으면 한 번씩 받는 보상(전설은 24장 완성 보상으로 대신해요). */
export const TIER_SETS: { tier: CardTier; berries: number; titleId: 'fish-common' | 'fish-rare' | 'fish-hero'; title: string }[] = [
  { tier: 'common', berries: 1000, titleId: 'fish-common', title: '연못 낚시꾼' },
  { tier: 'rare', berries: 3000, titleId: 'fish-rare', title: '반짝 물결 낚시꾼' },
  { tier: 'hero', berries: 6000, titleId: 'fish-hero', title: '수학자 낚시 명인' },
];
/** 열 번에 한 번쯤 카드와 함께 낚이는 보물. */
export const TREASURE_CHANCE = 0.1;
export type Treasure = { kind: 'pouch'; berries: number } | { kind: 'pieces'; pieces: number } | { kind: 'potion'; potion: number };
export const TREASURES: { weight: number; make: () => Treasure; label: string }[] = [
  { weight: 50, make: () => ({ kind: 'pouch', berries: 200 }), label: '베리 주머니 200베리' },
  { weight: 35, make: () => ({ kind: 'pieces', pieces: 5 }), label: '카드 조각 5개' },
  { weight: 15, make: () => ({ kind: 'potion', potion: 0 }), label: '달콤 베리물약 1병' },
];
const TIER_ORDER: CardTier[] = ['common', 'rare', 'hero', 'legend'];

// emblem: 초상화가 없을 때 쓰는 상징 그림 이름(fishing-view.ts의 SVG). portrait: public/art/mathematicians/<id>.webp가 있으면 true.
export const MATH_CARDS: MathCard[] = [
  { id: 'thales', name: '탈레스', tier: 'common', era: '고대 그리스 · 기원전 600년쯤', deed: '그림자 길이로 피라미드 높이를 쟀어요.', story: '막대의 그림자와 피라미드의 그림자를 비교하면 직접 올라가지 않아도 높이를 알 수 있다는 걸 보여 줬어요. 닮은 도형을 이용한 거예요.', emblem: 'pyramid', portrait: true },
  { id: 'euclid', name: '유클리드', tier: 'common', era: '고대 그리스 · 기원전 300년쯤', deed: '도형 공부의 교과서 「원론」을 썼어요.', story: '점, 선, 면에서 시작해 차근차근 도형의 성질을 증명했어요. 2000년 넘게 전 세계에서 수학 교과서로 쓰였어요.', emblem: 'compass', portrait: true },
  { id: 'archimedes', name: '아르키메데스', tier: 'common', era: '고대 그리스 · 기원전 250년쯤', deed: '"유레카!" 물에 잠긴 만큼 부피를 알아냈어요.', story: '목욕탕에서 물이 넘치는 것을 보고 왕관의 부피를 재는 방법을 떠올렸어요. 원의 넓이를 구하는 방법도 연구했어요.', emblem: 'circle', portrait: true },
  { id: 'eratosthenes', name: '에라토스테네스', tier: 'common', era: '고대 그리스 · 기원전 240년쯤', deed: '소수를 걸러 내는 "체"를 만들었어요.', story: '수를 늘어놓고 2의 배수, 3의 배수…를 지워 가면 소수만 남아요. 그림자로 지구 둘레를 잰 사람이기도 해요.', emblem: 'sieve', portrait: true },
  { id: 'fibonacci', name: '피보나치', tier: 'common', era: '이탈리아 · 1200년쯤', deed: '1, 1, 2, 3, 5, 8… 피보나치 수열을 알렸어요.', story: '앞의 두 수를 더해 다음 수를 만드는 수열이에요. 해바라기 씨나 솔방울 무늬에서도 찾을 수 있어요. 유럽에 아라비아 숫자를 널리 알렸어요.', emblem: 'spiral', portrait: true },
  { id: 'alkhwarizmi', name: '알콰리즈미', tier: 'common', era: '페르시아 · 800년쯤', deed: '방정식 푸는 법을 정리해 "대수학"을 열었어요.', story: '그의 책 이름에서 대수학(algebra)이라는 말이, 그의 이름에서 알고리즘(algorithm)이라는 말이 나왔어요.', emblem: 'balance', portrait: true },
  { id: 'brahmagupta', name: '브라마굽타', tier: 'common', era: '인도 · 628년', deed: '0을 하나의 수로 계산하는 규칙을 썼어요.', story: '어떤 수에 0을 더하거나 빼도 그대로라는 규칙, 음수 계산 규칙을 처음으로 정리했어요. 초상화는 남아 있지 않아요.', emblem: 'zero', portrait: false },
  { id: 'descartes', name: '데카르트', tier: 'common', era: '프랑스 · 1600년대', deed: '가로·세로 좌표로 점의 위치를 나타냈어요.', story: '천장의 파리를 보다가 "위치를 두 수로 나타낼 수 있겠다"고 생각했다는 이야기가 있어요. 그래서 좌표를 "데카르트 좌표"라고 해요.', emblem: 'grid', portrait: true },
  { id: 'pascal', name: '파스칼', tier: 'common', era: '프랑스 · 1600년대', deed: '19살에 톱니바퀴 계산기를 만들었어요.', story: '세금 계산으로 바쁜 아버지를 돕고 싶어 덧셈 뺄셈을 하는 기계를 만들었어요. 수를 삼각형으로 쌓는 "파스칼의 삼각형"도 유명해요.', emblem: 'triangle', portrait: true },
  { id: 'fermat', name: '페르마', tier: 'common', era: '프랑스 · 1600년대', deed: '350년 동안 아무도 못 푼 수수께끼를 남겼어요.', story: '책 여백에 "놀라운 증명을 찾았지만 여백이 좁아 적지 않는다"고 써 두었어요. 이 문제는 1994년에야 풀렸어요.', emblem: 'note', portrait: true },
  { id: 'napier', name: '네이피어', tier: 'common', era: '스코틀랜드 · 1600년쯤', deed: '곱셈을 쉽게 해 주는 "네이피어 막대"를 만들었어요.', story: '구구단이 적힌 막대를 나란히 놓으면 큰 수의 곱셈을 덧셈처럼 할 수 있어요. 로그도 발명했어요.', emblem: 'rods', portrait: true },
  { id: 'hong-jeongha', name: '홍정하', tier: 'common', era: '조선 · 1700년대', deed: '조선의 수학책 「구일집」을 썼어요.', story: '중국에서 온 수학자와 문제를 겨뤄 이긴 이야기가 전해져요. 방정식과 넓이 문제를 산가지로 풀었어요. 초상화는 남아 있지 않아요.', emblem: 'sticks', portrait: false },
  { id: 'pythagoras', name: '피타고라스', tier: 'rare', era: '고대 그리스 · 기원전 530년쯤', deed: '직각삼각형 세 변의 비밀을 밝혔어요.', story: '직각삼각형에서 짧은 두 변으로 만든 정사각형 넓이를 더하면 가장 긴 변으로 만든 정사각형 넓이와 같아요. 음악의 화음과 수의 관계도 연구했어요.', emblem: 'right', portrait: true },
  { id: 'hypatia', name: '히파티아', tier: 'rare', era: '이집트 알렉산드리아 · 400년쯤', deed: '기록이 남은 첫 여성 수학자예요.', story: '알렉산드리아에서 수학과 천문학을 가르쳤고 원뿔을 자른 곡선을 연구했어요. 믿을 만한 초상화는 남아 있지 않아요.', emblem: 'cone', portrait: false },
  { id: 'euler', name: '오일러', tier: 'rare', era: '스위스 · 1700년대', deed: '다리 일곱 개를 한 번씩 건너는 문제를 풀었어요.', story: '"쾨니히스베르크 다리 문제"를 점과 선으로 바꿔 생각하면서 그래프 이론이 시작됐어요. 눈이 보이지 않게 된 뒤에도 연구를 계속했어요.', emblem: 'bridges', portrait: true },
  { id: 'newton', name: '뉴턴', tier: 'rare', era: '영국 · 1600년대', deed: '떨어지는 사과에서 만유인력을 떠올렸어요.', story: '움직임이 어떻게 변하는지 계산하는 "미적분"을 만들어 행성의 움직임까지 설명했어요.', emblem: 'apple', portrait: true },
  { id: 'leibniz', name: '라이프니츠', tier: 'rare', era: '독일 · 1600년대', deed: '0과 1만 쓰는 이진법을 연구했어요.', story: '컴퓨터가 쓰는 0과 1의 수 체계를 정리했어요. 뉴턴과 따로 미적분을 만들었고, 지금 쓰는 미적분 기호도 그가 만들었어요.', emblem: 'binary', portrait: true },
  { id: 'choi-seokjeong', name: '최석정', tier: 'rare', era: '조선 · 1700년쯤', deed: '「구수략」에 특별한 마방진을 남겼어요.', story: '가로, 세로, 대각선의 합이 모두 같은 마방진을 연구했어요. 그가 만든 9차 마방진은 세계적으로도 앞선 것이었어요. 초상화는 남아 있지 않아요.', emblem: 'magic', portrait: false },
  { id: 'lovelace', name: '에이다 러브레이스', tier: 'rare', era: '영국 · 1800년대', deed: '세계 최초의 컴퓨터 프로그램을 썼어요.', story: '아직 만들어지지 않은 계산 기계를 위해 순서대로 계산하는 방법을 적었어요. 그래서 첫 프로그래머라고 불려요.', emblem: 'gear', portrait: true },
  { id: 'ramanujan', name: '라마누잔', tier: 'hero', era: '인도 · 1900년쯤', deed: '혼자 공부해 놀라운 공식 3900개를 남겼어요.', story: '1729를 보고 "두 세제곱수의 합으로 두 가지 방법으로 나타낼 수 있는 가장 작은 수"라고 바로 말한 이야기가 유명해요.', emblem: 'infinity', portrait: true },
  { id: 'noether', name: '에미 뇌터', tier: 'hero', era: '독일 · 1900년대', deed: '대칭과 보존 법칙의 관계를 밝혔어요.', story: '여자라서 강의를 못 하게 했던 시절에도 연구를 이어 갔어요. 아인슈타인이 "가장 중요한 여성 수학자"라고 했어요.', emblem: 'symmetry', portrait: true },
  { id: 'germain', name: '소피 제르맹', tier: 'hero', era: '프랑스 · 1800년쯤', deed: '남자 이름으로 편지를 써서 수학을 공부했어요.', story: '여자는 대학에 갈 수 없던 시절, 가명으로 가우스와 편지를 주고받으며 페르마의 문제를 연구했어요.', emblem: 'letter', portrait: true },
  { id: 'riemann', name: '리만', tier: 'hero', era: '독일 · 1800년대', deed: '소수의 비밀을 담은 "리만 가설"을 남겼어요.', story: '소수가 어떻게 흩어져 있는지에 대한 질문으로, 지금도 풀리지 않은 수학 최고의 수수께끼예요.', emblem: 'wave', portrait: true },
  { id: 'gauss', name: '가우스', tier: 'legend', era: '독일 · 1777–1855', deed: '1부터 100까지 더한 값을 순식간에 구했어요.', story: '어린 시절, 1+100, 2+99…처럼 짝을 지으면 101이 50번이라 5050이라는 것을 바로 알아냈어요. "수학의 왕자"라고 불려요.', emblem: 'sum', portrait: true },
];

export const emptyFishing = (): FishingState => ({ day: '', casts: 0, cards: {}, pieces: 0, completed: false });

export function validFishing(v: unknown): v is FishingState {
  if (!v || typeof v !== 'object') return false;
  const f = v as FishingState, ids = new Set(MATH_CARDS.map(c => c.id));
  return typeof f.day === 'string' && f.day.length <= 10 && Number.isSafeInteger(f.casts) && f.casts >= 0 && f.casts <= DAILY_CASTS
    && Number.isSafeInteger(f.pieces) && f.pieces >= 0 && f.pieces <= 1_000_000 && typeof f.completed === 'boolean'
    && !!f.cards && typeof f.cards === 'object' && Object.entries(f.cards).every(([id, n]) => ids.has(id) && Number.isSafeInteger(n) && n >= 1 && n <= 100_000)
    && (f.tierClaimed === undefined || Array.isArray(f.tierClaimed) && f.tierClaimed.length <= TIER_SETS.length && f.tierClaimed.every(t => TIER_SETS.some(set => set.tier === t)) && new Set(f.tierClaimed).size === f.tierClaimed.length);
}

export function fishingOf(s: Save): FishingState { return (s as Save & { fishing?: FishingState }).fishing ??= emptyFishing(); }
export function castsLeft(s: Save, today: string) { const f = fishingOf(s); return f.day === today ? DAILY_CASTS - f.casts : DAILY_CASTS; }
export function ownedCount(s: Save) { return MATH_CARDS.filter(c => fishingOf(s).cards[c.id]).length; }

export function rollTier(random: () => number): CardTier {
  let roll = random() * 100;
  for (const tier of TIER_ORDER) { roll -= TIERS[tier].weight; if (roll < 0) return tier; }
  return 'common';
}
export function rollCard(random: () => number): MathCard {
  const tier = rollTier(random), pool = MATH_CARDS.filter(c => c.tier === tier);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export type CastResult = { card: MathCard; fresh: boolean; pieces: number; berries: number; treasure: Treasure | null };
export function rollTreasure(random: () => number): Treasure | null {
  if (random() >= TREASURE_CHANCE) return null;
  let roll = random() * TREASURES.reduce((sum, t) => sum + t.weight, 0);
  for (const t of TREASURES) { roll -= t.weight; if (roll < 0) return t.make(); }
  return TREASURES[0].make();
}
export function treasureLabel(t: Treasure) { return t.kind === 'pouch' ? `베리 주머니 +${t.berries}베리` : t.kind === 'pieces' ? `카드 조각 +${t.pieces}개` : '달콤 베리물약 1병'; }
/** 낚싯대 던지기: 베리와 오늘 횟수를 확인하고, 결과를 저장 객체에 바로 반영해요. 문제가 있으면 아이에게 보여 줄 문장으로 오류를 던져요. */
export function castLine(s: Save, today: string, random: () => number = Math.random): CastResult {
  const f = fishingOf(s);
  if (f.day !== today) { f.day = today; f.casts = 0; }
  if (f.casts >= DAILY_CASTS) throw new Error(`오늘은 ${DAILY_CASTS}번 모두 낚았어요. 내일 다시 와요!`);
  if (s.berries < CAST_COST) throw new Error(`낚싯대를 던지려면 ${CAST_COST}베리가 필요해요. 수학숲에서 문제를 풀면 베리를 모을 수 있어요.`);
  s.berries -= CAST_COST; f.casts += 1;
  const card = rollCard(random), fresh = !f.cards[card.id];
  f.cards[card.id] = (f.cards[card.id] ?? 0) + 1;
  const pieces = fresh ? 0 : TIERS[card.tier].piece;
  f.pieces += pieces;
  const berries = TIERS[card.tier].berries;
  s.berries = Math.min(1e9, s.berries + berries);
  const treasure = rollTreasure(random);
  if (treasure?.kind === 'pouch') s.berries = Math.min(1e9, s.berries + treasure.berries);
  else if (treasure?.kind === 'pieces') f.pieces = Math.min(1_000_000, f.pieces + treasure.pieces);
  else if (treasure?.kind === 'potion') {
    // 물약 칸이 가득(99병)이면 같은 값의 베리로 바꿔 줘요.
    if ((s.potions.stock[treasure.potion] ?? 0) < 99) s.potions.stock[treasure.potion] = (s.potions.stock[treasure.potion] ?? 0) + 1;
    else s.berries = Math.min(1e9, s.berries + 140);
  }
  return { card, fresh, pieces, berries, treasure };
}

/** 조각으로 아직 없는 카드를 받아요. */
export function exchangeCard(s: Save, id: string): MathCard {
  const f = fishingOf(s), card = MATH_CARDS.find(c => c.id === id);
  if (!card) throw new Error('없는 카드예요.');
  if (f.cards[id]) throw new Error('이미 가진 카드예요.');
  const cost = TIERS[card.tier].exchange;
  if (f.pieces < cost) throw new Error(`조각이 ${cost - f.pieces}개 더 필요해요.`);
  f.pieces -= cost; f.cards[id] = 1;
  return card;
}

export function tierComplete(s: Save, tier: CardTier) { const f = fishingOf(s); return MATH_CARDS.filter(c => c.tier === tier).every(c => f.cards[c.id]); }
export function tierClaimed(s: Save, tier: CardTier) { return !!fishingOf(s).tierClaimed?.includes(tier); }
/** 한 등급을 다 모으면 한 번만 베리와 칭호를 받아요. */
export function claimTierSet(s: Save, tier: CardTier) {
  const set = TIER_SETS.find(t => t.tier === tier), f = fishingOf(s);
  if (!set || tierClaimed(s, tier) || !tierComplete(s, tier)) return null;
  (f.tierClaimed ??= []).push(tier); s.berries = Math.min(1e9, s.berries + set.berries);
  return set;
}

/** 24장을 다 모으면 한 번만 보상을 받아요: 칭호, 황금 낚싯대 장식, 5,000베리. */
export function claimCompletion(s: Save): boolean {
  const f = fishingOf(s);
  if (f.completed || ownedCount(s) < MATH_CARDS.length) return false;
  f.completed = true; s.berries += COMPLETE_BERRIES;
  return true;
}
