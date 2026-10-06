import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADDITION_RULES, SUBTRACTION_RULES, Encounter, OPERATIONS, PRACTICE_STAGES, additionFits, additionHasCarry, finishHunt, journeyFor,
  newSave, pickAdditionQuestion, pickSubtractionQuestion, practiceQuestion, recordWrongAnswer, subtractionFits, subtractionHasBorrow, validateSave,
  type Operation, type PracticeTier, type Question,
} from '../src/rules.ts';
import { stageMonsters } from '../src/stages.ts';
import { generateReviewQuestion } from '../src/curriculum.ts';

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const sample = (make: () => Question, count = 300) => Array.from({ length: count }, make);

test('carry and borrow helpers detect every column', () => {
  assert.equal(additionHasCarry(45, 32), false); assert.equal(additionHasCarry(45, 37), true); assert.equal(additionHasCarry(95, 15), true); assert.equal(additionHasCarry(250, 360), true); assert.equal(additionHasCarry(123, 456), false);
  assert.equal(subtractionHasBorrow(47, 5), false); assert.equal(subtractionHasBorrow(42, 7), true); assert.equal(subtractionHasBorrow(150, 67), true); assert.equal(subtractionHasBorrow(987, 654), false);
});

test('addition stages follow their rule, have the right answer and never repeat back to back', () => {
  for (let stage = 1; stage <= 10; stage++) {
    const rule = ADDITION_RULES[stage - 1]; let previous: Question | undefined;
    for (let i = 0; i < 300; i++) {
      const q = pickAdditionQuestion(stage, previous); previous = q;
      assert.equal(q.operation, 'addition'); assert.equal(q.answer, q.dividend + q.divisor); assert.ok(additionFits(stage, q.dividend, q.divisor), `stage ${stage}: ${q.dividend}+${q.divisor}`);
      assert.ok(q.answer >= rule.sum[0] && q.answer <= rule.sum[1] && q.answer <= 999);
      if (rule.carry !== null) assert.equal(additionHasCarry(q.dividend, q.divisor), rule.carry);
    }
  }
});

test('subtraction stages follow their rule and never go below one', () => {
  for (let stage = 1; stage <= 10; stage++) {
    const rule = SUBTRACTION_RULES[stage - 1]; let previous: Question | undefined;
    for (let i = 0; i < 300; i++) {
      const q = pickSubtractionQuestion(stage, previous); previous = q;
      assert.equal(q.operation, 'subtraction'); assert.equal(q.answer, q.dividend - q.divisor); assert.ok(q.answer >= 1, `stage ${stage}: ${q.dividend}-${q.divisor}`);
      assert.ok(subtractionFits(stage, q.dividend, q.divisor));
      if (rule.borrow !== null) assert.equal(subtractionHasBorrow(q.dividend, q.divisor), rule.borrow);
    }
  }
});

test('addition and subtraction ladders get harder from stage to stage', () => {
  const addition = [1, 2, 3, 5, 7, 8, 10].map(stage => mean(sample(() => pickAdditionQuestion(stage)).map(q => q.answer)));
  const subtraction = [1, 3, 5, 7, 8, 10].map(stage => mean(sample(() => pickSubtractionQuestion(stage)).map(q => q.dividend)));
  for (const values of [addition, subtraction]) for (let i = 1; i < values.length; i++) assert.ok(values[i] > values[i - 1], `ladder should rise: ${values.join(', ')}`);
});

test('every operation gives three practice levels with correct answers that get harder', () => {
  const size = (q: Question) => q.operation === 'division' ? q.dividend + (q.remainder ? 500 : 0) : q.operation === 'multiplication' ? q.answer : q.dividend;
  for (const operation of OPERATIONS) {
    const means = ([0, 1, 2] as PracticeTier[]).map(tier => {
      const questions = sample(() => practiceQuestion(operation, tier, undefined, 5));
      for (const q of questions) {
        assert.equal(q.operation, operation);
        const expected = operation === 'addition' ? q.dividend + q.divisor : operation === 'subtraction' ? q.dividend - q.divisor : operation === 'multiplication' ? q.dividend * q.divisor : Math.floor(q.dividend / q.divisor);
        assert.equal(q.answer, expected); if (operation === 'division') assert.equal(q.remainder ?? 0, q.dividend % q.divisor);
      }
      return mean(questions.map(size));
    });
    assert.ok(means[0] < means[1] && means[1] < means[2], `${operation} tiers should rise: ${means.join(', ')}`);
  }
  assert.deepEqual(PRACTICE_STAGES.multiplication, [1, 2, 7]);
});

test('hard division practice includes remainders and easy multiplication stays within the 2 to 5 times tables', () => {
  assert.ok(sample(() => practiceQuestion('division', 2, undefined, 5)).every(q => (q.remainder ?? 0) > 0));
  assert.ok(sample(() => practiceQuestion('multiplication', 0)).every(q => q.dividend <= 5 && q.divisor <= 5));
});

test('an encounter built with a practice choice asks that operation and accepts only its answer', () => {
  for (const operation of OPERATIONS as readonly Operation[]) {
    const encounter = new Encounter(0, true, 5, undefined, 3, 0, 'division', 'stage', { operation, tier: 1 });
    assert.equal(encounter.question.operation, operation);
    assert.equal(encounter.answer('9999'), 'wrong');
    assert.equal(encounter.answer(String(encounter.question.answer) + (encounter.question.remainder ? `R${encounter.question.remainder}` : '')), 'correct');
  }
});

test('review questions exist for addition and subtraction and save validation accepts them', () => {
  const s = newSave('복습', 0);
  for (const unit of ['addition', 'subtraction'] as const) {
    const q = generateReviewQuestion(unit); assert.equal(q.unit, unit); assert.ok(/^\d+$/.test(q.answer));
  }
  recordWrongAnswer(s, { dividend: 45, divisor: 38, answer: 83, operation: 'addition' }); recordWrongAnswer(s, { dividend: 71, divisor: 38, answer: 33, operation: 'subtraction' });
  assert.equal(validateSave(JSON.parse(JSON.stringify(s))).learning.wrongQuestions.length, 2);
  s.learning.wrongQuestions[0].answer = 1; assert.throws(() => validateSave(JSON.parse(JSON.stringify(s))));
});

test('version 10 saves gain empty addition and subtraction forests and default practice settings', () => {
  const s = newSave('옛이야기', 0) as unknown as Record<string, unknown>; const old = JSON.parse(JSON.stringify(s));
  old.version = 10; delete old.additionJourney; delete old.subtractionJourney; delete old.additionCompleted; delete old.subtractionCompleted;
  delete old.settings.practice; delete old.curriculum.units.addition; delete old.curriculum.units.subtraction;
  const migrated = validateSave(old);
  assert.equal(migrated.version, 13); assert.equal(migrated.additionCompleted, false); assert.equal(migrated.subtractionCompleted, false);
  assert.equal(migrated.additionJourney.maps.length, 11); assert.deepEqual(migrated.settings.practice, { operation: 'auto', tier: 1, skipPicker: false });
  assert.ok(migrated.curriculum.units.addition && migrated.curriculum.units.subtraction);
});

test('practice settings and forest completion flags are validated', () => {
  const s = newSave('검사', 0);
  for (const bad of [{ operation: 'power', tier: 1, skipPicker: false }, { operation: 'auto', tier: 3, skipPicker: false }, { operation: 'auto', tier: 1, skipPicker: 'no' }]) {
    const copy = JSON.parse(JSON.stringify(s)); copy.settings.practice = bad; assert.throws(() => validateSave(copy));
  }
  const early = JSON.parse(JSON.stringify(s)); early.additionCompleted = true; assert.throws(() => validateSave(early));
  const forest = JSON.parse(JSON.stringify(s)); forest.forest = 'subtraction'; assert.equal(validateSave(forest).forest, 'subtraction');
});

test('clearing the tenth map of the addition forest pays the completion gift once and keeps the save valid', () => {
  const s = newSave('완주', 0); s.forest = 'addition'; let gifts = 0, total = 0;
  for (let stage = 1; stage <= 10; stage++) {
    journeyFor(s).stage = stage;
    stageMonsters(stage).forEach((_, id) => { const result = finishHunt(s, id)!; gifts += result.completionReward > 0 ? 1 : 0; total += result.completionReward; });
  }
  assert.equal(s.additionCompleted, true); assert.equal(gifts, 1); assert.equal(total, 1500); assert.equal(s.subtractionCompleted, false); assert.equal(s.journey.maps[10].cleared, false);
  journeyFor(s).stage = 0; s.position = { x: 0, z: 8 };
  assert.equal(validateSave(JSON.parse(JSON.stringify(s))).additionCompleted, true);
});
