import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEW_CURRICULUM_UNITS, canStartCurriculumMission, claimCurriculumGraduation,
  completeCurriculumMission, curriculumGraduationAvailable, curriculumUnitComplete,
  newSave, recordCurriculumAttempt, validateSave,
} from '../src/rules.ts';
import { CURRICULUM_MISSIONS, answerCurriculumQuestion, generateCurriculumQuestion, generateReviewQuestion } from '../src/curriculum.ts';
import { stageMonsters } from '../src/stages.ts';

test('all four new regions have nine missions and generate self-consistent questions', () => {
  for (const unit of NEW_CURRICULUM_UNITS) {
    assert.equal(CURRICULUM_MISSIONS[unit].length, 9);
    for (let mission = 0; mission < 9; mission++) {
      for (let sample = 0; sample < 80; sample++) {
        const question = generateCurriculumQuestion(unit, mission);
        assert.equal(question.unit, unit);
        assert.ok(question.prompt.length > 5);
        assert.equal(question.hints.length, 3);
        assert.equal(answerCurriculumQuestion(question, question.answer), true);
        assert.equal(answerCurriculumQuestion(question, `${question.answer}x`), false);
        if (question.kind === 'number') assert.match(question.answer, /^\d{1,4}$/);
        else assert.ok(question.choices?.some(choice => choice.value === question.answer));
      }
    }
  }
});

test('mixed review covers all six curriculum regions', () => {
  for (const unit of ['multiplication', 'division', ...NEW_CURRICULUM_UNITS] as const) {
    for (let sample = 0; sample < 100; sample++) {
      const question = generateReviewQuestion(unit);
      assert.equal(question.unit, unit);
      assert.equal(answerCurriculumQuestion(question, question.answer), true);
      if (unit === 'division') assert.ok(question.choices?.some(choice => choice.value === question.answer));
    }
  }
});

test('concept missions vary their representations instead of repeating one answer pattern', () => {
  const circleSteps = new Set<string>(), fractionClasses = new Set<string>(), fractionDirections = new Set<string>();
  const weightUnits = new Set<string>(), capacityKinds = new Set<string>(), graphIcons = new Set<string>();
  for (let sample = 0; sample < 400; sample++) {
    circleSteps.add(generateCurriculumQuestion('circle', 5).answer);
    fractionClasses.add(generateCurriculumQuestion('fraction', 3).answer);
    fractionDirections.add(generateCurriculumQuestion('fraction', 4).prompt.includes('대분수로') ? 'to-mixed' : 'to-improper');
    weightUnits.add(generateCurriculumQuestion('measurement', 1).answer);
    capacityKinds.add(generateCurriculumQuestion('measurement', 3).kind);
    const graph = generateCurriculumQuestion('pictograph', 1).visual;
    if (graph.kind === 'pictograph') graphIcons.add(graph.icon);
  }
  assert.deepEqual(circleSteps, new Set(['중심 정하기', '반지름만큼 벌리기', '중심에 고정하기']));
  assert.deepEqual(fractionClasses, new Set(['진분수', '가분수', '자연수']));
  assert.deepEqual(fractionDirections, new Set(['to-mixed', 'to-improper']));
  assert.deepEqual(weightUnits, new Set(['g', 'kg', 't']));
  assert.deepEqual(capacityKinds, new Set(['number', 'choice']));
  assert.equal(graphIcons.size, 3);
});

test('missions unlock in order, keep the best stars and never duplicate berry rewards', () => {
  const save = newSave('단원', 0), unit = 'circle' as const;
  assert.equal(canStartCurriculumMission(save, unit, 0), true);
  assert.equal(canStartCurriculumMission(save, unit, 1), false);
  const first = completeCurriculumMission(save, unit, 0, 2);
  assert.deepEqual(first, { firstCompletion: true, unitCompleted: false, unitRewarded: false, berries: 30 });
  assert.equal(canStartCurriculumMission(save, unit, 1), true);
  assert.equal(completeCurriculumMission(save, unit, 0, 3).berries, 0);
  assert.equal(save.curriculum.units.circle.stars[0], 3);
  for (let mission = 1; mission < 9; mission++) completeCurriculumMission(save, unit, mission, 1);
  assert.equal(curriculumUnitComplete(save, unit), true);
  assert.equal(save.curriculum.units.circle.rewardClaimed, true);
  assert.equal(save.berries, 750);
  assert.equal(completeCurriculumMission(save, unit, 8, 3).berries, 0);
  assert.equal(save.berries, 750);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))), save);
});

test('the graduation gift unlocks after all six regions and is paid once', () => {
  const save = newSave('졸업', 1);
  for (const journey of [save.journey, save.multiplicationJourney]) {
    for (let stage = 1; stage <= 10; stage++) {
      journey.maps[stage].monsters = stageMonsters(stage).map((_, id) => id);
      journey.maps[stage].cleared = true;
    }
  }
  save.multiplicationCompleted = true; save.multiplicationRewardClaimed = true;
  for (const unit of NEW_CURRICULUM_UNITS) for (let mission = 0; mission < 9; mission++) completeCurriculumMission(save, unit, mission, 3);
  assert.equal(curriculumGraduationAvailable(save), true);
  const before = save.berries;
  assert.equal(claimCurriculumGraduation(save), 1500);
  assert.equal(save.berries, before + 1500);
  assert.equal(claimCurriculumGraduation(save), 0);
  assert.equal(save.berries, before + 1500);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))), save);
});

test('unit attempts keep local strengths, hints and one review tag per skill', () => {
  const save = newSave('기록', 2);
  recordCurriculumAttempt(save, 'fraction', false, 2, '분수만큼');
  recordCurriculumAttempt(save, 'fraction', false, 2, '분수만큼');
  recordCurriculumAttempt(save, 'fraction', true, 2, '분수만큼', true);
  assert.equal(save.curriculum.units.fraction.correct, 1);
  assert.equal(save.curriculum.units.fraction.wrong, 2);
  assert.equal(save.curriculum.units.fraction.hints, 1);
  assert.deepEqual(save.curriculum.wrongSkills, [{ unit: 'fraction', mission: 2, skill: '분수만큼' }]);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))), save);
});

test('version 9 saves inherit an empty curriculum without losing previous progress', () => {
  const old = structuredClone(newSave('이어하기', 3)) as unknown as Record<string, unknown>;
  old.version = 9; delete old.curriculum;
  const settings = old.settings as Record<string, unknown>; delete settings.focusUnit; delete settings.spiralReview;
  const restored = validateSave(old);
  assert.equal(restored.version, 10);
  assert.equal(restored.settings.focusUnit, 'all');
  assert.equal(restored.settings.spiralReview, true);
  assert.ok(NEW_CURRICULUM_UNITS.every(unit => restored.curriculum.units[unit].completedMissions.length === 0));
});
