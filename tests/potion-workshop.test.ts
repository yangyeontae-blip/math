import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, buyPotion, brewPotion, grantReward, rewardFor, mathLevelBerries, grantMathQuestionXp, MONSTERS, POTIONS } from '../src/rules.ts';
import { WORKSHOP_MAX_ORBS, SHOP_BOOST_DAILY_LIMIT, WORKSHOP_RECIPES, WORKSHOP_ONLY_POTIONS, shopBoostRemaining } from '../src/potion-workshop.ts';

const now = new Date(2026, 10, 21, 12).getTime();

test('math monster berries grow with level by four per round', () => {
  const s = newSave('수학왕', 0); s.level = 60;
  assert.equal(mathLevelBerries(60), 240); assert.equal(mathLevelBerries(500, 3), 6000);
  assert.equal(rewardFor(s, 0, true, now).berries, MONSTERS[0].berry + 240);
  assert.equal(rewardFor(s, 8, false, now).berries, MONSTERS[8].berry + 2 + 240 * MONSTERS[8].rounds);
  assert.equal(rewardFor(s, 8, false, now, false).berries, 0);
  assert.equal(mathLevelBerries(Number.NaN), 4); assert.equal(mathLevelBerries(10 ** 9), 400000);
});

test('strong boost potions are workshop-only and weak ones are limited per day', () => {
  const s = newSave('물약', 0); s.berries = 100_000;
  for (const id of WORKSHOP_ONLY_POTIONS) { assert.throws(() => buyPotion(s, id, now), /공방/); assert.equal(s.potions.stock[id], 0); }
  for (let i = 0; i < SHOP_BOOST_DAILY_LIMIT; i++) buyPotion(s, i % 2 ? 4 : 0, now);
  assert.equal(shopBoostRemaining(s, now), 0);
  const before = s.berries; assert.throws(() => buyPotion(s, 0, now), /하루/); assert.equal(s.berries, before);
  buyPotion(s, 6, now); buyPotion(s, 8, now); // 회복 보급품은 제한이 없어요.
  assert.equal(shopBoostRemaining(s, now + 86_400_000), SHOP_BOOST_DAILY_LIMIT);
  buyPotion(s, 4, now + 86_400_000);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});

test('correct math answers fill wisdom orbs that brew potions without berries', () => {
  const s = newSave('공방', 0);
  grantReward(s, 8, false, now); assert.equal(s.workshop!.orbs, MONSTERS[8].rounds);
  grantReward(s, 0, true, now, false); assert.equal(s.workshop!.orbs, MONSTERS[8].rounds); // 힌트·쉬운 문제는 구슬이 없어요.
  grantMathQuestionXp(s); assert.equal(s.workshop!.orbs, MONSTERS[8].rounds + 1);
  const recipe = WORKSHOP_RECIPES.find(r => r.id === 5)!;
  assert.throws(() => brewPotion(s, 5), /지혜 구슬/); assert.equal(s.potions.stock[5], 0);
  s.workshop!.orbs = recipe.orbs + 1; const berries = s.berries;
  brewPotion(s, 5); assert.equal(s.potions.stock[5], 1); assert.equal(s.workshop!.orbs, 1); assert.equal(s.workshop!.brewed, 1); assert.equal(s.berries, berries);
  assert.throws(() => brewPotion(s, 6)); assert.throws(() => brewPotion(s, 99));
  for (let i = 0; i < 200; i++) grantMathQuestionXp(s);
  assert.equal(s.workshop!.orbs, WORKSHOP_MAX_ORBS);
  assert.ok(WORKSHOP_RECIPES.every(r => POTIONS[r.id] && (POTIONS[r.id].kind === 'berry' || POTIONS[r.id].kind === 'xp')));
});

test('older saves without a workshop load with an empty one and bad workshop data is rejected', () => {
  const s = newSave('예전', 0); const old = JSON.parse(JSON.stringify(s)); delete old.workshop;
  const loaded = validateSave(old); assert.deepEqual(loaded.workshop, { orbs: 0, date: '', bought: 0, brewed: 0 });
  const bad = JSON.parse(JSON.stringify(s)); bad.workshop.orbs = WORKSHOP_MAX_ORBS + 1;
  assert.throws(() => validateSave(bad));
});
