import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Encounter, WEAPONS, OUTFITS, RIDES, PETS, HAIRSTYLES, FACES,
  answerMultiplicationFinal, applyTeacherCode, canEnter, collectBerry,
  finishHunt, journeyFor, multiplicationHasCarrying,
  multiplicationQuestionPool, multiplicationUsesStory, newSave, pickMultiplicationQuestion,
  startMultiplicationFinal, validateSave,
} from '../src/rules.ts';
import { stageBerries, stageMonsters } from '../src/stages.ts';

test('all multiplication stage pools follow the fixed curriculum', () => {
  for (let stage = 1; stage <= 10; stage++) {
    const pool = multiplicationQuestionPool(stage); assert.ok(pool.length > 0);
    for (const q of pool) {
      assert.equal(q.operation, 'multiplication'); assert.equal(q.answer, q.dividend * q.divisor);
      assert.ok(q.answer <= 9801); assert.ok(q.divisor >= 2 && q.divisor <= 99);
      if (stage === 1) { assert.ok(q.dividend <= 5); assert.ok(q.divisor <= 5); }
      if (stage === 2) { assert.ok(q.dividend <= 9); }
      if (stage === 3) { assert.equal(q.dividend % 10, 0); assert.ok(q.divisor <= 5); }
      if (stage === 4) assert.equal(q.dividend % 10, 0);
      if (stage === 5) assert.equal(multiplicationHasCarrying(q.dividend, q.divisor), false);
      if (stage >= 6 && stage <= 8) assert.equal(multiplicationHasCarrying(q.dividend, q.divisor), true);
      if (stage === 9) { assert.ok(q.dividend >= 100 && q.dividend <= 299); assert.ok(q.divisor >= 2 && q.divisor <= 6); }
      if (stage === 10) { assert.ok(q.dividend >= 11 && q.dividend <= 49); assert.ok(q.divisor >= 11 && q.divisor <= 19); }
    }
  }
  const review = multiplicationQuestionPool(10, false, true);
  assert.ok(review.every(q => q.dividend <= 9 && q.divisor <= 9));
  assert.ok(multiplicationQuestionPool(10, true).every(q => q.dividend <= 9));
  assert.equal(multiplicationHasCarrying(12, 3), false);
  assert.equal(multiplicationHasCarrying(42, 3), true);
  assert.equal(multiplicationHasCarrying(28, 3), true);
});

test('pickers and encounters accept four-digit multiplication answers', () => {
  for (let i = 0; i < 100; i++) assert.equal(pickMultiplicationQuestion(10).operation, 'multiplication');
  const encounter = new Encounter(0, false, 1, undefined, 10, 0, 'multiplication');
  encounter.question = { dividend: 299, divisor: 6, answer: 1794, operation: 'multiplication' };
  assert.equal(encounter.answer('179'), 'wrong'); assert.equal(encounter.answer('1794'), 'correct'); assert.equal(encounter.answer('1794'), 'ignored');
});

test('late stages mix about 30 percent review questions and every third monster tells a story', () => {
  let reviews = 0;
  for (let i = 0; i < 2_000; i++) if (pickMultiplicationQuestion(10).dividend <= 9) reviews++;
  assert.ok(reviews >= 480 && reviews <= 720, `review count was ${reviews}`);
  assert.deepEqual(Array.from({ length: 9 }, (_, id) => multiplicationUsesStory(id)), [false, false, true, false, false, true, false, false, true]);
});

test('the two forests keep progress and every reward separate', () => {
  const s = newSave('두숲', 0); s.forest = 'multiplication'; s.multiplicationJourney.stage = 1;
  const firstBerry = collectBerry(s, 0); assert.ok(firstBerry > 0); assert.equal(s.journey.maps[1].berries.length, 0); assert.deepEqual(s.multiplicationJourney.maps[1].berries, [0]);
  for (let id = 0; id < stageMonsters(1).length; id++) assert.ok(finishHunt(s, id));
  assert.equal(s.multiplicationJourney.maps[1].cleared, true); assert.equal(s.journey.maps[1].cleared, false); assert.equal(canEnter(s, 2, 'multiplication'), true); assert.equal(canEnter(s, 2, 'division'), false);
  assert.equal(collectBerry(s, 0), 0);
  s.forest = 'division'; s.journey.stage = 1; assert.equal(collectBerry(s, 0), firstBerry); assert.equal(stageBerries(1).length > 0, true);
  assert.equal(journeyFor(s), s.journey); assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});

test('the linked final gate survives reload and grants its gift only once', () => {
  const s = newSave('햇살문', 0); s.forest = 'multiplication'; s.multiplicationJourney.stage = 10;
  s.multiplicationJourney.maps.forEach((map, stage) => { if (stage > 0) { map.monsters = stageMonsters(stage).map((_, id) => id); map.cleared = true; } });
  const gate = startMultiplicationFinal(s)!; assert.equal(gate.step, 0);
  assert.equal(answerMultiplicationFinal(s, gate.left * gate.right + 1).correct, false);
  assert.deepEqual(answerMultiplicationFinal(s, gate.left * gate.right), { correct: true, complete: false, reward: false });
  const restored = validateSave(JSON.parse(JSON.stringify(s))); assert.equal(restored.multiplicationFinal?.step, 1);
  const result = answerMultiplicationFinal(restored, gate.left); assert.deepEqual(result, { correct: true, complete: true, reward: true });
  assert.equal(restored.multiplicationCompleted, true); assert.equal(restored.multiplicationRewardClaimed, true);
  const practice = startMultiplicationFinal(restored)!; answerMultiplicationFinal(restored, practice.left * practice.right);
  assert.deepEqual(answerMultiplicationFinal(restored, practice.left), { correct: true, complete: true, reward: false });
  restored.room.furniture = [8]; assert.deepEqual(validateSave(JSON.parse(JSON.stringify(restored))), restored);
});

test('version 7 saves become division progress and teacher mode previews everything', () => {
  const old = structuredClone(newSave('예전숲', 0)) as unknown as Record<string, unknown>; old.version = 7;
  delete old.forest; delete old.multiplicationJourney; delete old.multiplicationFinal; delete old.multiplicationCompleted; delete old.multiplicationRewardClaimed; delete old.potions;
  const settings = old.settings as Record<string, unknown>; delete settings.multiplicationRange;
  const migrated = validateSave(old); assert.equal(migrated.version, 11); assert.equal(migrated.forest, 'division'); assert.equal(migrated.multiplicationJourney.maps[1].cleared, false);
  assert.deepEqual(migrated.potions, { stock: [0, 0, 0], berryMultiplier: 1, berryUntil: 0, xpMultiplier: 1, xpUntil: 0 });
  applyTeacherCode(migrated, 'teacher');
  assert.equal(canEnter(migrated, 10, 'multiplication'), true); assert.equal(migrated.multiplicationCompleted, true); assert.equal(migrated.multiplicationRewardClaimed, true);
  assert.equal(Object.keys(migrated.weapons).length, WEAPONS.length); assert.equal(Object.keys(migrated.outfits).length, OUTFITS.length); assert.equal(Object.keys(migrated.rides).length, RIDES.length); assert.equal(Object.keys(migrated.pets).length, PETS.length); assert.equal(Object.keys(migrated.hairstyles).length, HAIRSTYLES.length); assert.equal(Object.keys(migrated.faces).length, FACES.length);
});
