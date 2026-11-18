import assert from 'node:assert/strict';
import test from 'node:test';
import { newSave, validateSave } from '../src/rules.ts';
import { CAST_COST, COMPLETE_BERRIES, DAILY_CASTS, MATH_CARDS, TIERS, castLine, castsLeft, claimCompletion, exchangeCard, fishingOf, rollCard, rollTier } from '../src/fishing.ts';
import { titleAvailable, titleDefinition } from '../src/titles.ts';

const seq = (...values: number[]) => { let i = 0; return () => values[i++] ?? 0; };
const rich = () => { const s = newSave('베리', 0, 3); s.berries = 100_000; return s; };

test('24 cards in 4 tiers (12/7/4/1) and odds that add up to 100%', () => {
  const count = (t: string) => MATH_CARDS.filter(c => c.tier === t).length;
  assert.deepEqual([count('common'), count('rare'), count('hero'), count('legend')], [12, 7, 4, 1]);
  assert.equal(Object.values(TIERS).reduce((sum, t) => sum + t.weight, 0), 100);
  assert.equal(new Set(MATH_CARDS.map(c => c.id)).size, 24);
  assert.ok(TIERS.common.weight > TIERS.rare.weight && TIERS.rare.weight > TIERS.hero.weight && TIERS.hero.weight > TIERS.legend.weight);
});

test('rolls pick the tier first, then a card inside it', () => {
  assert.equal(rollTier(() => 0), 'common');
  assert.equal(rollTier(() => .75), 'rare');
  assert.equal(rollTier(() => .95), 'hero');
  assert.equal(rollTier(() => .995), 'legend');
  assert.equal(rollCard(seq(.995, 0)).id, 'gauss');
});

test('casting costs berries, is limited to 10 a day, and resets the next day', () => {
  const s = rich();
  for (let i = 0; i < DAILY_CASTS; i++) castLine(s, '2026-11-18', seq(0, 0));
  assert.equal(s.berries, 100_000 - CAST_COST * DAILY_CASTS);
  assert.equal(castsLeft(s, '2026-11-18'), 0);
  assert.throws(() => castLine(s, '2026-11-18'), /내일 다시/);
  assert.equal(castsLeft(s, '2026-11-19'), DAILY_CASTS);
  castLine(s, '2026-11-19', seq(0, 0));
  const poor = newSave('나루', 1, 3); poor.berries = 10;
  assert.throws(() => castLine(poor, '2026-11-18'), /베리가 필요해요/);
  assert.equal(poor.berries, 10);
});

test('duplicates become pieces and pieces buy a missing card', () => {
  const s = rich();
  const first = castLine(s, 'd', seq(0, 0)), again = castLine(s, 'd', seq(0, 0));
  assert.equal(first.fresh, true); assert.equal(again.fresh, false); assert.equal(again.pieces, TIERS.common.piece);
  assert.throws(() => exchangeCard(s, first.card.id), /이미 가진/);
  assert.throws(() => exchangeCard(s, 'gauss'), /조각이/);
  fishingOf(s).pieces = 150;
  assert.equal(exchangeCard(s, 'gauss').name, '가우스');
  assert.equal(fishingOf(s).pieces, 0);
});

test('completing all 24 gives berries and the title once', () => {
  const s = rich(), before = s.berries;
  assert.equal(claimCompletion(s), false);
  for (const c of MATH_CARDS) fishingOf(s).cards[c.id] = 1;
  assert.equal(claimCompletion(s), true);
  assert.equal(s.berries, before + COMPLETE_BERRIES);
  assert.equal(claimCompletion(s), false);
  assert.equal(titleAvailable(s, titleDefinition('math-friend')!), true);
});

test('saves without fishing load with an empty fishing state; broken fishing data is rejected', () => {
  const s = newSave('베리', 0, 3) as unknown as Record<string, unknown>; delete s.fishing;
  assert.deepEqual(validateSave(s).fishing, { day: '', casts: 0, cards: {}, pieces: 0, completed: false });
  assert.throws(() => validateSave({ ...newSave('베리', 0, 3), fishing: { day: '', casts: 99, cards: {}, pieces: 0, completed: false } }));
  assert.throws(() => validateSave({ ...newSave('베리', 0, 3), fishing: { day: '', casts: 0, cards: { nobody: 1 }, pieces: 0, completed: false } }));
});
