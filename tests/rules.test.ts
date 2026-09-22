import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questionPool, newSave, validateSave, buy, upgrade, grantReward, rewardFor, Encounter, WEAPONS, MONSTERS, collectBerry, finishHunt, fellTree, treeDamage, canEnter } from '../src/rules.ts';
import { stageBerries, stageMonsters, stageTrees, clearBonus, berryValue } from '../src/stages.ts';

test('every question follows the curriculum; two-digit quotients begin at level 4', () => {
  for (const level of [1, 2, 3, 4, 10, 100]) {
    const pool = questionPool(level); assert.ok(pool.length > 0);
    for (const q of pool) { assert.ok(q.dividend >= 10 && q.dividend <= (level < 4 ? 90 : level < 7 ? 120 : 180) && q.dividend % 10 === 0); assert.ok(q.divisor >= 2 && q.divisor <= 9); assert.equal(q.divisor * q.answer, q.dividend); if (level < 4) assert.ok(q.answer < 10); }
    if (level >= 4) assert.ok(pool.some(q => q.answer >= 10));
    if (level >= 7) assert.ok(pool.some(q => q.dividend > 90));
  }
});
test('all weapons and upgrades give the documented rewards for every monster', () => {
  const s = newSave('베리', 0);
  WEAPONS.forEach((w, wi) => { s.weapon = wi; for (let u = 0; u <= 3; u++) { s.weapons[wi] = u; MONSTERS.forEach((m, mi) => { assert.deepEqual(rewardFor(s, mi, true), { berries: m.berry + w.bonus, xp: m.xp, score: Math.round(m.score * (w.multiplier + u * .1)) }); assert.equal(rewardFor(s, mi, false).score, 0); }); } });
});
test('wrong and repeated answers never produce a second victory', () => {
  const encounter = new Encounter(0, true, 1); assert.equal(encounter.answer('99'), 'wrong'); assert.equal(encounter.solved, false);
  assert.equal(encounter.answer(String(encounter.question.answer)), 'correct'); assert.equal(encounter.answer(String(encounter.question.answer)), 'ignored'); assert.equal(encounter.answer('99'), 'ignored');
});
test('purchases, equipment and upgrades cannot spend more than the balance', () => {
  const s = newSave('봄', 1); const before = structuredClone(s); assert.throws(() => buy(s, 'weapon', 1)); assert.deepEqual(s, before); assert.throws(() => upgrade(s, 'outfit', 2));
  s.berries = 1000; buy(s, 'weapon', 1); assert.equal(s.berries, 920); assert.equal(s.weapon, 1); buy(s, 'weapon', 0); buy(s, 'weapon', 1); assert.equal(s.berries, 920);
  for (let i = 0; i < 3; i++) upgrade(s, 'weapon', 1); assert.equal(s.weapons[1], 3); assert.equal(s.berries, 500); assert.throws(() => upgrade(s, 'weapon', 1)); assert.equal(s.berries, 500);
  buy(s, 'outfit', 7); upgrade(s, 'outfit', 7); upgrade(s, 'outfit', 7); assert.equal(s.berries, 110); assert.equal(s.outfits[7], 2); assert.throws(() => upgrade(s, 'outfit', 7));
});
test('outfit combat effects never change the division or arena score rule', () => {
  const s = newSave('옷', 2), before = rewardFor(s, 3, true); s.berries = 1000; buy(s, 'outfit', 7); upgrade(s, 'outfit', 7); upgrade(s, 'outfit', 7); const after = rewardFor(s, 3, true); assert.equal(after.score, before.score); assert.equal(after.berries, before.berries); assert.equal(after.xp, before.xp + 2);
});
test('level-up threshold, remaining XP and 20 berry gift', () => {
  const s = newSave('성장', 3); for (let i = 0; i < 4; i++) grantReward(s, 0, true); assert.equal(s.level, 2); assert.equal(s.xp, 0); assert.equal(s.berries, 52); assert.equal(s.tutorial.battle, true);
  for (let i = 0; i < 4; i++) grantReward(s, 3, false); assert.equal(s.level, 3); assert.equal(s.xp, 0); assert.equal(s.berries, 132);
});
test('save round-trip preserves state and rejects corrupted, unsafe or invalid files', () => {
  const s = newSave('모험가', 3); s.berries = 500; buy(s, 'outfit', 4); upgrade(s, 'outfit', 4); assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
  for (const bad of [null, {}, { ...s, version: 99 }, { ...s, berries: -1 }, { ...s, xp: 10000 }, { ...s, weapon: 3 }, { ...s, position: { x: Infinity, z: 0 } }, { ...s, outfits: { 0: 0, 4: 9 } }, { ...s, settings: {} }]) assert.throws(() => validateSave(bad));
  assert.throws(() => newSave(' ', 0)); assert.throws(() => newSave('12345678901', 0)); assert.throws(() => newSave('봄', 4));
});
test('stages have fixed, non-refilling berries and unlock only after all hunts', () => {
  const s = newSave('여행', 0); assert.equal(canEnter(s, 1), true); assert.equal(canEnter(s, 2), false);
  const first = collectBerry(s, 0); assert.equal(first, berryValue(0)); assert.equal(collectBerry(s, 0), 0); assert.equal(s.journey.maps[0].berries.length, 1);
  s.journey.stage = 1; assert.equal(stageBerries(1).length > stageBerries(0).length, true);
  for (let id = 0; id < stageMonsters(1).length; id++) assert.ok(finishHunt(s, id));
  assert.equal(s.journey.maps[1].cleared, true); assert.equal(canEnter(s, 2), true);
  assert.equal(finishHunt(s, 0), null); assert.ok(s.berries >= clearBonus(1));
});
test('outfit effects boost rewards but do not make problems or weapons optional', () => {
  const s = newSave('꽃', 0); s.berries = 1000; buy(s, 'outfit', 7); assert.equal(rewardFor(s, 0, false).xp, MONSTERS[0].xp + 2);
  const before = s.berries; s.journey.stage = 1; collectBerry(s, 0); assert.equal(s.berries - before, berryValue(1));
  const encounter = new Encounter(0, false, 1); assert.equal(encounter.answer(String(encounter.question.answer)), 'correct');
});
test('trees give only 1 or 2 berries once and stronger weapons cut faster', () => {
  const s = newSave('나무', 0); assert.ok(stageTrees(0).length > 0); assert.equal(treeDamage(s), 1);
  assert.equal(fellTree(s, 0, 2), 2); assert.equal(s.berries, 2); assert.equal(fellTree(s, 0, 2), 0); assert.equal(s.berries, 2);
  s.berries = 5000; buy(s, 'weapon', WEAPONS.length - 1); assert.equal(treeDamage(s), WEAPONS.at(-1)!.treePower); upgrade(s, 'weapon', WEAPONS.length - 1); assert.equal(treeDamage(s), WEAPONS.at(-1)!.treePower + 1);
  assert.equal(fellTree(s, 999, 1), 0); assert.equal(fellTree(s, 1, 3 as 1), 0);
});
test('version 2 saves migrate with untouched tree progress', () => {
  const old = structuredClone(newSave('예전', 0)) as unknown as Record<string, unknown>; old.version = 2;
  const journey = old.journey as { maps: Array<Record<string, unknown>> }; journey.maps.forEach(m => delete m.trees);
  const migrated = validateSave(old); assert.equal(migrated.version, 3); assert.deepEqual(migrated.journey.maps[0].trees, []);
});
