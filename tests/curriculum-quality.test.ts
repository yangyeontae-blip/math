import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCurriculumQuestion, type CurriculumQuestion } from '../src/curriculum.ts';
import { curriculumVisualHtml } from '../src/curriculum-visual.ts';

const SAMPLES = 400;
function seeded(seed: number) { let state = seed; return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296); }
function each(unit: 'circle' | 'fraction', callback: (question: CurriculumQuestion, mission: number) => void) {
  const random = seeded(unit === 'circle' ? 7 : 11);
  for (let mission = 0; mission < 10; mission++) for (let sample = 0; sample < SAMPLES; sample++) callback(generateCurriculumQuestion(unit, mission, random), mission);
}
const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;
const num = (value: string) => Number(value);

test('choices contain the answer once, are unique and the answer position is spread out', () => {
  for (const unit of ['circle', 'fraction'] as const) {
    const positions = new Map<string, number[]>();
    each(unit, (question, mission) => {
      if (question.kind !== 'choice') return;
      const values = question.choices!.map(choice => choice.value);
      assert.equal(new Set(values).size, values.length);
      assert.equal(values.filter(value => value === question.answer).length, 1);
      const key = `${mission}:${values.length}`, slots = positions.get(key) ?? Array(values.length).fill(0);
      slots[values.indexOf(question.answer)]++; positions.set(key, slots);
    });
    for (const [key, slots] of positions) {
      const total = slots.reduce((a, b) => a + b, 0);
      slots.forEach((n, slot) => assert.ok(n / total > .15, `${unit} ${key} puts the answer in slot ${slot} only ${n}/${total} times`));
    }
  }
});

test('every question has three different, non-empty hints', () => {
  for (const unit of ['circle', 'fraction'] as const) each(unit, question => {
    assert.equal(new Set(question.hints).size, 3);
    question.hints.forEach(hint => assert.ok(hint.length > 4));
  });
});

test('first-semester activity regions render useful pictures and valid answers', () => {
  for (const unit of ['plane', 'lengthTime', 'fractionDecimal'] as const) {
    for (let mission = 0; mission < 10; mission++) {
      for (let sample = 0; sample < 80; sample++) {
        const question = generateCurriculumQuestion(unit, mission, seeded(mission * 1000 + sample + 31));
        const html = curriculumVisualHtml(question.visual);
        assert.ok(html.includes('curriculum-visual'));
        assert.ok(!html.includes('undefined'));
        assert.ok(question.answer.length > 0);
        if (question.kind === 'choice') assert.equal(question.choices!.filter(choice => choice.value === question.answer).length, 1);
        else assert.match(question.answer, /^\d{1,4}$/);
      }
    }
  }
});

test('circle number questions use realistic units and double or halve correctly', () => {
  const seenUnits = new Set<string>();
  each('circle', (question, mission) => {
    if (![3, 4, 6, 7].includes(mission)) return;
    const match = question.prompt.match(/(\d+) (cm|m)/)!, value = num(match[1]), unit = match[2];
    assert.ok(value >= 2 && value <= 18);
    assert.equal(question.visual.kind === 'circle' && question.visual.unit, unit);
    seenUnits.add(`${mission}:${unit}`);
    if (mission === 3 || mission === 6) assert.equal(question.answer, String(value * 2));
    else { assert.equal(value % 2, 0); assert.equal(question.answer, String(value / 2)); }
    assert.equal(question.kind, 'number');
  });
  assert.deepEqual([...seenUnits].sort(), ['3:cm', '4:cm', '6:m', '7:m']);
});

test('circle pictures never print the answer', () => {
  each('circle', (question, mission) => {
    const html = curriculumVisualHtml(question.visual);
    if (question.kind === 'choice') assert.ok(!html.includes(question.answer.replace(/→.*/, '')), `mission ${mission + 1} picture shows "${question.answer}"`);
    else {
      const unit = question.visual.kind === 'circle' ? question.visual.unit : 'cm';
      assert.ok(!html.includes(`>${question.answer} ${unit}<`), `mission ${mission + 1} picture shows the answer ${question.answer}`);
      assert.ok(html.includes('?'));
    }
  });
});

test('circle length pictures name the known and unknown measurements clearly', () => {
  const radiusQuestion = generateCurriculumQuestion('circle', 3, seeded(101));
  const diameterQuestion = generateCurriculumQuestion('circle', 4, seeded(202));
  const radiusHtml = curriculumVisualHtml(radiusQuestion.visual);
  const diameterHtml = curriculumVisualHtml(diameterQuestion.visual);

  assert.match(radiusHtml, /반지름 \d+ cm/);
  assert.ok(radiusHtml.includes('지름 ?'));
  assert.match(diameterHtml, /지름 \d+ cm/);
  assert.ok(diameterHtml.includes('반지름 ?'));
  assert.ok(radiusHtml.includes('circle-dimension'));
  assert.ok(diameterHtml.includes('circle-dimension'));
});

test('fraction questions are valid and their answers match an independent calculation', () => {
  const kinds = new Set<string>();
  each('fraction', question => {
    const prompt = question.prompt;
    if (prompt.includes('부분으로 똑같이 나누고')) {
      kinds.add('meaning');
      const [, d, n] = prompt.match(/(\d+)부분으로 똑같이 나누고 그중 (\d+)부분/)!.map(Number); assert.ok(n >= 1 && n < d);
      assert.equal(question.answer, `${n}/${d}`);
    } else if (prompt.includes('바르게 읽은')) {
      kinds.add('reading');
      const [, n, d] = prompt.match(/^(\d+)\/(\d+)을 바르게/)!.map(Number); assert.ok(n >= 1 && n < d);
      assert.equal(question.answer, `${d}분의 ${n}`);
    } else if (/개 중 \d+\/\d+/.test(prompt)) {
      kinds.add('quantity');
      const [, total, n, d] = prompt.match(/(\d+)개 중 (\d+)\/(\d+)/)!.map(Number);
      assert.ok(n >= 1 && n < d); assert.equal(total % d, 0); assert.ok(total <= 30 && total / d >= 2);
      const part = (total / d) * n;
      assert.equal(question.answer, String(prompt.includes('남은') ? total - part : part));
      assert.ok(question.visual.kind === 'fraction' && question.visual.groups === total / d);
    } else if (prompt.includes('진분수일까요')) {
      kinds.add('proper');
      const [, n, d] = prompt.match(/^(\d+)\/(\d+)은 진분수/)!.map(Number); assert.ok(n >= 1 && d >= 2);
      assert.equal(question.answer, n < d ? '진분수' : '가분수');
    } else if (prompt.includes('대분수로') || prompt.includes('가분수로')) {
      kinds.add('conversion');
      const toMixed = prompt.match(/^(\d+)\/(\d+)을 대분수로/);
      if (toMixed) { const n = num(toMixed[1]), d = num(toMixed[2]); assert.notEqual(n % d, 0); assert.equal(question.answer, `${Math.floor(n / d)} ${n % d}/${d}`); }
      else { const [, w, r, d] = prompt.match(/^(\d+) (\d+)\/(\d+)을 가분수로/)!.map(Number); assert.ok(r >= 1 && r < d); assert.equal(question.answer, `${w * d + r}/${d}`); }
    } else {
      kinds.add('compare');
      const [, a, b, c, d] = prompt.match(/^(\d+)\/(\d+)과 (\d+)\/(\d+) 중 더 큰/)!.map(Number);
      assert.ok(a >= 1 && a < b && c >= 1 && c < d); assert.ok(b >= 3 && d >= 3);
      assert.notEqual(a * d, c * b); assert.equal(question.choices!.length, 2);
      assert.equal(question.answer, a * d > c * b ? `${a}/${b}` : `${c}/${d}`);
    }
  });
  assert.deepEqual([...kinds].sort(), ['compare', 'conversion', 'meaning', 'proper', 'quantity', 'reading']);
});

test('fraction pictures draw exactly the fractions in the question', () => {
  each('fraction', question => {
    const visual = question.visual; assert.equal(visual.kind, 'fraction'); if (visual.kind !== 'fraction') return;
    const html = curriculumVisualHtml(visual), { numerator, denominator, groups, compare } = visual;
    if (groups) {
      assert.equal(count(html, /class="frac-box( on)?"/g), denominator); assert.equal(count(html, /class="frac-box on"/g), numerator);
      assert.equal(count(html, /●/g), denominator * groups);
      return;
    }
    const wholes = (n: number, d: number) => Math.max(1, Math.ceil(n / d));
    const expectedBars = wholes(numerator, denominator) + (compare ? wholes(compare.numerator, compare.denominator) : 0);
    assert.equal(count(html, /class="frac-bar"/g), expectedBars);
    assert.equal(count(html, /<i class="filled">/g), numerator + (compare?.numerator ?? 0));
    assert.equal(count(html, /<i class="/g), wholes(numerator, denominator) * denominator + (compare ? wholes(compare.numerator, compare.denominator) * compare.denominator : 0));
    for (const cells of html.matchAll(/--cells:(\d+)/g)) assert.ok([denominator, compare?.denominator].includes(num(cells[1])));
  });
});
