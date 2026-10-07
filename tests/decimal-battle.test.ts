import test from 'node:test';
import assert from 'node:assert/strict';
import { Encounter, formatScaled, newSave, practiceQuestion, questionAnswerText, recordWrongAnswer, validateSave, type Operation, type Question, type SchoolGrade } from '../src/rules.ts';

const OPS: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
const sample = (operation: Operation, grade: SchoolGrade, count = 600) => Array.from({ length: count }, () => practiceQuestion(operation, 2, undefined, 3, grade));
const value = (n: number, places: number) => n / 10 ** places;

test('formatScaled puts the decimal point back without trailing zeros', () => {
  assert.equal(formatScaled(25, 1), '2.5');
  assert.equal(formatScaled(5, 1), '0.5');
  assert.equal(formatScaled(120, 2), '1.2');
  assert.equal(formatScaled(7, 2), '0.07');
  assert.equal(formatScaled(300, 2), '3');
  assert.equal(formatScaled(12, 0), '12');
});

test('grades 1-4 never get decimal battle questions', () => {
  for (const grade of [1, 2, 3, 4] as SchoolGrade[]) for (const op of OPS) if (grade >= 4 || op !== 'division') for (const q of sample(op, grade, 200)) assert.equal(q.places, undefined, `${grade}-${op}`);
});

test('grade 5 mixes decimals into addition, subtraction and multiplication but not division', () => {
  for (const op of ['addition', 'subtraction', 'multiplication'] as const) {
    const decimals = sample(op, 5).filter(q => q.places);
    assert.ok(decimals.length > 120, `${op}: only ${decimals.length}/600 are decimal`);
  }
  for (const q of sample('division', 5, 300)) assert.equal(q.places, undefined);
});

test('grade 6 also divides decimals', () => {
  const decimals = sample('division', 6).filter(q => q.places);
  assert.ok(decimals.length > 120, `${decimals.length}/600`);
});

test('every decimal question is exactly right and answerable', () => {
  const kinds = new Set<string>();
  for (const grade of [5, 6] as SchoolGrade[]) for (const op of OPS) for (const q of sample(op, grade)) {
    if (!q.places) continue;
    const [pa, pb, pr] = q.places, a = value(q.dividend, pa), b = value(q.divisor, pb), r = value(q.answer, pr);
    kinds.add(`${grade}-${op}-${pa}${pb}${pr}`);
    const expected = op === 'addition' ? a + b : op === 'subtraction' ? a - b : op === 'multiplication' ? a * b : a / b;
    assert.ok(Math.abs(expected - r) < 1e-9, `${a} ${op} ${b} should be ${expected}, got ${r}`);
    assert.ok(q.dividend > 0 && q.divisor > 0 && q.answer > 0 && Number.isInteger(q.dividend) && Number.isInteger(q.divisor) && Number.isInteger(q.answer));
    if (op === 'subtraction') assert.ok(q.dividend > q.divisor);
    assert.ok(r < 1000 && a < 1000, 'answers must fit the input box');
    assert.match(questionAnswerText(q), /^\d{1,3}(\.\d{1,2})?$/);
    const encounter = new Encounter(0, false, 3, undefined, 4, 0, op, 'stage', undefined, grade);
    encounter.question = q;
    assert.equal(encounter.answer('0'), 'wrong');
    assert.equal(encounter.answer(`${questionAnswerText(q)}9`), 'wrong');
    assert.equal(encounter.answer(`${r}.1.2`), 'wrong');
    assert.equal(encounter.answer(questionAnswerText(q)), 'correct');
  }
  for (const expected of ['5-addition-111', '5-addition-222', '5-subtraction-111', '5-subtraction-222', '5-multiplication-101', '5-multiplication-202', '5-multiplication-112', '6-division-101', '6-division-202', '6-division-110']) assert.ok(kinds.has(expected), `missing kind ${expected}; saw ${[...kinds].sort().join(', ')}`);
});

test('a decimal answer is accepted with or without trailing zeros but not when off by a hundredth', () => {
  const q: Question = { dividend: 25, divisor: 15, answer: 40, operation: 'addition', places: [1, 1, 1] };
  const encounter = new Encounter(0, false, 3, undefined, 4, 0, 'addition', 'stage', undefined, 5);
  encounter.question = q;
  assert.equal(encounter.answer('4.01'), 'wrong');
  assert.equal(encounter.answer('3.9'), 'wrong');
  assert.equal(encounter.answer('4.00'), 'correct');
  const again = new Encounter(0, false, 3, undefined, 4, 0, 'addition', 'stage', undefined, 5);
  again.question = q; assert.equal(again.answer('4'), 'correct');
});

test('wrong decimal answers count as wrong but are not saved into the notebook, so the save file stays valid', () => {
  const save = newSave('소수', 0, 6);
  const q: Question = { dividend: 18, divisor: 6, answer: 3, operation: 'division', places: [1, 1, 0] };
  const before = save.learning.wrongQuestions.length;
  recordWrongAnswer(save, q);
  assert.equal(save.learning.wrong, 1);
  assert.equal(save.learning.wrongQuestions.length, before);
  assert.equal(validateSave(JSON.parse(JSON.stringify(save))).grade, 6);
});
