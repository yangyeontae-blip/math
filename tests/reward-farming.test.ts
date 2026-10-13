import assert from 'node:assert/strict';
import test from 'node:test';
import { battleRewardReason, finishHunt, grantReward, newSave, rewardFor } from '../src/rules';

test('grade three can practice small sums without farming berries or experience', () => {
  const third = newSave('연습', 0, 3);
  const second = newSave('연습', 0, 2);
  const easy = { dividend: 42, divisor: 8, answer: 50, operation: 'addition' as const };
  const gradeLevel = { dividend: 85, divisor: 27, answer: 112, operation: 'addition' as const };
  assert.equal(battleRewardReason(third, easy, false), 'easy');
  assert.equal(battleRewardReason(second, easy, false), null);
  assert.equal(battleRewardReason(third, gradeLevel, false), null);
  assert.equal(battleRewardReason(third, gradeLevel, true), 'hint');
  assert.equal(battleRewardReason(third, gradeLevel, false, 0), 'easy');
  assert.equal(battleRewardReason(third, gradeLevel, false, 1), 'easy');
  assert.equal(battleRewardReason(third, gradeLevel, false, 2), null);
});

test('hint-assisted or easy battles have zero repeatable rewards but still allow progress', () => {
  const save = newSave('연습', 0, 3);
  const before = { berries: save.berries, xp: save.xp };
  assert.deepEqual(rewardFor(save, 0, true, Date.now(), false), { berries: 0, xp: 0, score: 0 });
  const arena = grantReward(save, 0, true, Date.now(), false);
  assert.equal(arena.berries, 0); assert.equal(arena.xp, 0); assert.equal(arena.score, 0);
  assert.equal(save.berries, before.berries); assert.equal(save.xp, before.xp);
  save.forest = 'addition'; save.additionJourney.stage = 1;
  const hunt = finishHunt(save, 0, false);
  assert.equal(hunt?.berries, 0); assert.equal(hunt?.xp, 0);
  assert.deepEqual(save.additionJourney.maps[1].monsters, [0]);
  assert.equal(finishHunt(save, 0, false), null);
});
