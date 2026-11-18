import assert from 'node:assert/strict';
import test from 'node:test';
import { newSave, WEAPONS, PETS } from '../src/rules.ts';
import { applyTrade, checkOwnOffer, parseTradeOffer, tradableItems, tradeFee } from '../src/trade.ts';

const save = () => { const s = newSave('베리', 0, 3); s.berries = 10_000; s.weapons[2] = 4; s.pets[3] = true; return s; };

test('offers are validated: integers, known items, no duplicates, at most 8 items', () => {
  assert.deepEqual(parseTradeOffer({ berries: 100, items: [{ kind: 'weapon', id: 2, level: 4 }] }), { berries: 100, items: [{ kind: 'weapon', id: 2, level: 4 }] });
  assert.equal(parseTradeOffer({ berries: -1, items: [] }), null);
  assert.equal(parseTradeOffer({ berries: 1.5, items: [] }), null);
  assert.equal(parseTradeOffer({ berries: 0, items: [{ kind: 'weapon', id: 9999, level: 0 }] }), null);
  assert.equal(parseTradeOffer({ berries: 0, items: [{ kind: 'sword', id: 1, level: 0 }] }), null);
  assert.equal(parseTradeOffer({ berries: 0, items: [{ kind: 'pet', id: 3, level: 0 }, { kind: 'pet', id: 3, level: 0 }] }), null);
  assert.equal(parseTradeOffer({ berries: 0, items: Array.from({ length: 9 }, (_, i) => ({ kind: 'weapon', id: i + 1, level: 0 })) }), null);
});

test('the fee is 1% of what you send (berries + shop price), at least 1 berry', () => {
  assert.equal(tradeFee({ berries: 0, items: [] }), 0);
  assert.equal(tradeFee({ berries: 50, items: [] }), 1);
  assert.equal(tradeFee({ berries: 1000, items: [] }), 10);
  assert.equal(tradeFee({ berries: 0, items: [{ kind: 'weapon', id: 2, level: 0 }] }), Math.max(1, Math.ceil(WEAPONS[2].price * 0.01)));
});

test('only owned, unequipped, non-starter items can be offered', () => {
  const s = save();
  const list = tradableItems(s);
  assert.ok(list.some(i => i.kind === 'weapon' && i.id === 2 && i.level === 4));
  assert.ok(!list.some(i => i.id === 0));
  s.weapon = 2;
  assert.ok(!tradableItems(s).some(i => i.kind === 'weapon' && i.id === 2));
  assert.match(checkOwnOffer(s, { berries: 0, items: [{ kind: 'weapon', id: 2, level: 4 }] })!, /쓰고 있어서/);
  assert.match(checkOwnOffer(s, { berries: 10_000, items: [] })!, /베리가 모자라요/);
  assert.equal(checkOwnOffer(save(), { berries: 5_000, items: [{ kind: 'pet', id: 3, level: 0 }] }), null);
});

test('applying a trade moves berries and items and charges the sender fee once', () => {
  const a = save(), b = newSave('나루', 1, 3); b.berries = 500;
  const gave = { berries: 1_000, items: [{ kind: 'pet' as const, id: 3, level: 0 }] }, got = { berries: 200, items: [] };
  const fee = tradeFee(gave);
  applyTrade(a, gave, got);
  assert.equal(a.berries, 10_000 - 1_000 - fee + 200);
  assert.equal(a.pets[3], undefined);
  applyTrade(b, got, gave);
  assert.equal(b.berries, 500 - 200 - tradeFee(got) + 1_000);
  assert.equal(b.pets[3], true);
  assert.ok(b.discoveries.pets.includes(3));
  assert.equal(PETS[3].name.length > 0, true);
});
