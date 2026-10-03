import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curriculumActivityHtml, pizzaSliceClip } from '../src/curriculum-activity.ts';
import { generateCurriculumQuestion } from '../src/curriculum.ts';

const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

test('fraction meaning missions render one clickable pizza slice per equal part', () => {
  for (let sample = 0; sample < 80; sample++) {
    const question = generateCurriculumQuestion('fraction', 0, seeded(sample + 1));
    const html = curriculumActivityHtml(question);
    assert.ok(html.includes('data-math-activity="pizza"'));
    assert.equal((html.match(/data-pizza-slice=/g) ?? []).length, question.visual.kind === 'fraction' ? question.visual.denominator : 0);
    assert.ok(html.includes(`data-denominator="${question.visual.kind === 'fraction' ? question.visual.denominator : 0}"`));
  }
});

test('circle length missions render an adjustable measuring station with a safe range', () => {
  for (const mission of [3, 4, 6, 7]) {
    const question = generateCurriculumQuestion('circle', mission, seeded(100 + mission));
    const html = curriculumActivityHtml(question);
    assert.ok(html.includes('data-math-activity="circle"'));
    assert.ok(html.includes('data-circle-adjust="-1"'));
    assert.ok(html.includes('data-circle-adjust="1"'));
    assert.ok(Number(html.match(/data-circle-max="(\d+)"/)![1]) >= Number(question.answer));
  }
});

test('pizza slice polygons are valid and distinct', () => {
  const clips = Array.from({ length: 8 }, (_, index) => pizzaSliceClip(index, 8));
  assert.equal(new Set(clips).size, 8);
  clips.forEach(clip => assert.match(clip, /^polygon\(50% 50%,.+\)$/));
});

test('unrelated curriculum questions keep the regular question interface', () => {
  assert.equal(curriculumActivityHtml(generateCurriculumQuestion('measurement', 0, seeded(9))), '');
  assert.equal(curriculumActivityHtml(generateCurriculumQuestion('fraction', 1, seeded(10))), '');
});
