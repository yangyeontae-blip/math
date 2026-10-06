import assert from 'node:assert/strict';
import test from 'node:test';
import { generateGradeQuestion } from '../src/grade-content.ts';
import { generateCurriculumQuestion } from '../src/curriculum.ts';
import { curriculumVisualHtml } from '../src/curriculum-visual.ts';
import { titleLeaksAnswer } from '../src/leak-guard.ts';

const UNITS = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
function seeded(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function* allQuestions(perMission = 40) {
  const rnd = seeded(2026);
  for (const grade of [1, 2, 3, 4, 5, 6] as const) for (const unit of UNITS) for (let m = 0; m < 20; m++) for (let i = 0; i < perMission; i++) {
    yield { grade, unit, m, q: grade === 3 ? generateCurriculumQuestion(unit, m % 10, rnd) : generateGradeQuestion(grade, unit, m, rnd) };
  }
}

test('no known wording or particle slips appear in any grade', () => {
  for (const { grade, unit, m, q } of allQuestions()) {
    const text = [q.prompt, q.explanation, ...q.hints, ...(q.choices ?? []).map(c => c.label)].join(' ');
    const tag = `g${grade} ${unit}#${m} ${q.skill}`;
    assert.ok(!/몇 일|시 0\d?분/.test(text), `${tag}: ${text.slice(0, 120)}`);
    assert.ok(!/[036]로 나눈/.test(text) && !/%p/.test(text), `${tag}: ${text.slice(0, 120)}`);
    assert.ok(!/undefined|NaN|\[object/.test(text), tag);
    assert.ok(!/ - /.test(q.explanation), `${tag}: hyphen used as minus: ${q.explanation}`);
  }
});

test('titles never give away the answer in the first hint', () => {
  for (const { grade, unit, m, q } of allQuestions(15)) {
    if (!titleLeaksAnswer(q)) continue;
    assert.ok(!q.hints[0].includes(q.skill), `g${grade} ${unit}#${m}: ${q.hints[0]}`);
  }
});

test('grade 1-2 clock questions draw a real clock that matches the correct answer', () => {
  const rnd = seeded(5);
  for (const [grade, skill] of [[1, '몇 시'], [1, '몇 시 30분'], [2, '몇 시 몇 분']] as const) {
    let seen = 0;
    for (let i = 0; i < 400 && seen < 40; i++) {
      const q = generateGradeQuestion(grade, 'lengthTime', i % 10, rnd);
      if (q.skill !== skill) continue; seen++;
      const v = q.visual as { kind: string; clock?: boolean; values: number[] };
      assert.ok(v.kind === 'length-time' && v.clock, `${grade}/${skill} needs a clock`);
      assert.match(curriculumVisualHtml(q.visual), /clock-visual/);
      const [h, m] = v.values;
      assert.equal(q.answer, m === 0 ? `${h}시` : `${h}시 ${m}분`);
      assert.ok(!/\d시/.test(q.prompt), 'the prompt must not state the time');
    }
    assert.ok(seen >= 20, `${skill} seen ${seen}`);
  }
});

test('grade 4 quadrilateral clues never have two correct options', () => {
  const rnd = seeded(11);
  const satisfies: Record<string, string[]> = {
    '평행한 변이 한 쌍이라도 있는 사각형': ['사다리꼴', '평행사변형', '마름모', '직사각형', '정사각형'],
    '마주 보는 두 쌍의 변이 서로 평행한 사각형': ['평행사변형', '마름모', '직사각형', '정사각형'],
    '네 변의 길이가 모두 같은 사각형': ['마름모', '정사각형'],
    '네 각이 모두 직각인 사각형': ['직사각형', '정사각형'],
    '네 각이 모두 직각이고 네 변의 길이가 모두 같은 사각형': ['정사각형']
  };
  let checked = 0;
  for (let i = 0; i < 4000; i++) {
    const q = generateGradeQuestion(4, 'circle', 1 + (i % 9), rnd);
    for (const [clue, names] of Object.entries(satisfies)) {
      if (!q.prompt.startsWith(clue)) continue; checked++;
      const valid = (q.choices ?? []).filter(c => names.includes(c.label));
      assert.equal(valid.length, 1, `${q.prompt}: ${(q.choices ?? []).map(c => c.label)}`);
    }
  }
  assert.ok(checked > 50, `checked ${checked}`);
});

test('grade 5 group scores are never negative and grade 3 graph questions never ask about ties', () => {
  const rnd = seeded(19);
  for (let i = 0; i < 600; i++) {
    const q = generateGradeQuestion(5, 'pictograph', 4 + (i % 6), rnd);
    if (q.skill !== '자료 해석') continue;
    assert.ok(!/-\d/.test(q.prompt), q.prompt);
  }
  for (let i = 0; i < 600; i++) {
    const q = generateCurriculumQuestion('pictograph', 6, rnd);
    assert.notEqual(q.answer, '같아요', q.prompt);
  }
});
