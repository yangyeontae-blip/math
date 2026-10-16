import test from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, type SchoolGrade } from '../src/rules';
import { beginProject, adjustProject, finishProject, projectSpec, recommendAdventure, validAdventure, recoveryQuestions, markRecovered, calculationRecoveryQuestion, transferQuestion } from '../src/adventure';
import { generateGradeQuestion } from '../src/grade-content';
import { generateCurriculumQuestion, answerCurriculumQuestion } from '../src/curriculum';

test('version 16 migrates to 18 without losing progress, purchases, wrong answers or pet friendships', () => {
  const current = newSave('모험가', 0), old = JSON.parse(JSON.stringify(current));
  old.version = 16; delete old.adventure; old.berries = 345; old.story.completed = [0]; old.tutorial.collected = true;
  const restored = validateSave(old);
  assert.equal(restored.version, 19); assert.equal(restored.berries, 345); assert.deepEqual(restored.story.completed, [0]);
  assert.equal(restored.tutorial.collected, true); assert.deepEqual(restored.adventure.completed, []); assert.equal(restored.adventure.designs.length, 3); assert.equal(restored.adventure.tool, null);
});

test('projects work for every grade, retain partial work, and cannot grant repeat currency', () => {
  for (let grade = 1; grade <= 6; grade++) {
    let s = newSave('모험가', 0, grade as SchoolGrade); s.berries = 120;
    assert.equal(beginProject(s, 1), false);
    for (let id = 0; id < 3; id++) {
      assert.equal(beginProject(s, id), true); assert.equal(finishProject(s), false);
      assert.equal(adjustProject(s, 0, -1), false); assert.equal(adjustProject(s, .5, 1), false);
      assert.equal(adjustProject(s, 0, 1), true);
      s = validateSave(JSON.parse(JSON.stringify(s))); assert.equal(s.adventure.active!.values[0], 1);
      const spec = projectSpec(id, s.grade);
      for (let group = 0; group < spec.groups; group++) while (s.adventure.active!.values[group] < spec.target) assert.equal(adjustProject(s, group, 1), true);
      assert.equal(finishProject(s), true); assert.equal(finishProject(s), false); assert.equal(beginProject(s, id), false);
      assert.equal(s.berries, 120); assert.equal(s.xp, 0);
    }
    assert.deepEqual(validateSave(s).adventure.completed, [0, 1, 2]);
  }
});

test('unequal baskets, excess flowers and short paths cannot finish; corrupt saves are rejected', () => {
  const s = newSave('모험가', 0); beginProject(s, 0);
  s.adventure.active!.values[0] = projectSpec(0, 3).target + 1; assert.equal(finishProject(s), false);
  s.adventure.active!.values[0] = -1; assert.equal(validAdventure(s.adventure), false); assert.throws(() => validateSave(s));
  s.adventure.active!.values[0] = Infinity; assert.equal(validAdventure(s.adventure), false);
  s.adventure.active = null; s.adventure.completed = [1]; assert.throws(() => validateSave(s));
  s.adventure.completed = [0, 1]; beginProject(s, 2); s.adventure.active!.values = [5, 4, 3];
  assert.equal(finishProject(s), false); assert.equal(adjustProject(s, 0, 1), false);
});

test('recommendations preserve ongoing activities, honor locked units and follow onboarding', () => {
  const s = newSave('모험가', 0), regions = [{ id: 'plane' as const, name: '도형' }, { id: 'fraction' as const, name: '분수' }];
  assert.equal(recommendAdventure(s, regions).kind, 'guide');
  s.tutorial = { collected: true, battle: true, shop: true };
  s.curriculum.wrongSkills = [{ unit: 'fraction', skill: '분수', mission: 0 }];
  assert.equal(recommendAdventure(s, regions, () => false).kind, 'project');
  assert.equal(recommendAdventure(s, regions).kind, 'review');
  beginProject(s, 0); assert.equal(recommendAdventure(s, regions).kind, 'project');
  s.room.inside = true; assert.deepEqual(recommendAdventure(s, regions).kind, 'guide');
});

test('all grade recovery sequences keep the recorded concept and only clear it after completion', () => {
  for (const grade of [1, 2, 3, 4, 5, 6] as const) {
    const unit = 'plane', factory = (mission: number) => grade === 3 ? generateCurriculumQuestion(unit, mission) : generateGradeQuestion(grade, unit, mission);
    const original = factory(0), mistake = { unit, mission: 0, skill: original.skill } as const;
    const s = newSave('모험가', 0, grade); s.curriculum.wrongSkills = [mistake];
    const questions = recoveryQuestions(mistake, factory);
    assert.equal(questions.length, 3);
    questions.forEach(q => { assert.equal(q.skill, original.skill); assert.equal(q.unit, unit); assert.equal(answerCurriculumQuestion(q, q.answer), true); });
    assert.equal(s.curriculum.wrongSkills.length, 1);
    markRecovered(s, unit, original.skill); markRecovered(s, unit, original.skill);
    assert.equal(s.curriculum.wrongSkills.length, 0); assert.equal(s.adventure.recovered.length, 1);
    assert.deepEqual(validateSave(s).adventure.recovered, s.adventure.recovered);
  }
});

test('missing recovery concept does not silently substitute another skill', () => {
  const result = recoveryQuestions({ unit: 'plane', mission: 0, skill: '없는 개념' }, () => generateCurriculumQuestion('plane', 0));
  assert.deepEqual(result, []);
});

test('transfer questions preserve their solution and do not rewrite a different numerical task', () => {
  const original = generateGradeQuestion(1, 'plane', 0), next = transferQuestion(original);
  assert.equal(next.answer, original.answer); assert.deepEqual(next.choices, original.choices);
  assert.match(next.prompt, /축제/); assert.notEqual(next.prompt, original.prompt);
  const other = { ...original, answer: '999' };
  assert.equal(transferQuestion(other).prompt, other.prompt);
});

test('calculation recovery handles decimals and remainders with exact answer choices', () => {
  for (const q of [
    { dividend: 45, divisor: 12, answer: 57, operation: 'addition' as const, places: [1, 1, 1] as const },
    { dividend: 17, divisor: 5, answer: 3, remainder: 2, operation: 'division' as const },
    { dividend: 8, divisor: 3, answer: 24, operation: 'multiplication' as const },
  ]) for (let phase = 0; phase < 3; phase++) {
    const question = calculationRecoveryQuestion(q, phase);
    assert.equal(question.choices!.filter(choice => choice.value === question.answer).length, 1);
    assert.equal(new Set(question.choices!.map(choice => choice.value)).size, 3);
    if (phase === 2) assert.match(question.prompt, /리본|과일/);
  }
});
