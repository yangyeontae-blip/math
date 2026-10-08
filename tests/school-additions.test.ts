import assert from 'node:assert/strict';
import test from 'node:test';
import { generateGradeQuestion, gradeTopics } from '../src/grade-content.ts';
import { curriculumVisualHtml } from '../src/curriculum-visual.ts';
import { Encounter } from '../src/rules.ts';

function seeded(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const collect = (grade: 1 | 2 | 4 | 6, unit: 'plane' | 'pictograph' | 'measurement', skill: string, filter: (prompt: string) => boolean, count: number, seed = 1) => {
  const r = seeded(seed), found: ReturnType<typeof generateGradeQuestion>[] = [];
  for (let i = 0; i < 6000 && found.length < count; i++) { const q = generateGradeQuestion(grade, unit, i % 9, r); if (q.skill === skill && filter(q.prompt)) found.push(q); }
  assert.ok(found.length >= count, `${grade}학년 ${skill}: ${found.length}개만 찾았어요`);
  return found;
};

test('added variants sit on the topic they are named after', () => {
  assert.equal(gradeTopics(1, 'pictograph')[2], '수의 순서');
  assert.equal(gradeTopics(1, 'pictograph')[3], '수 비교');
  assert.equal(gradeTopics(2, 'plane')[8], '곱셈구구');
  assert.equal(gradeTopics(4, 'measurement')[0], '소수의 자릿값');
  assert.equal(gradeTopics(4, 'measurement')[5], '소수 세 자리 수');
  assert.equal(gradeTopics(6, 'measurement')[7], '쌓기나무 위·앞·옆');
});

test('grade 1 number-chart blanks and inequality signs are correct', () => {
  for (const q of collect(1, 'pictograph', '수의 순서', p => p.includes('□'), 60)) {
    const seq = q.prompt.includes('아래로') ? q.prompt.split('위에서부터 ')[1].split('일 때')[0].split(', ') : q.prompt.split('? ')[1].split(' ');
    const step = q.prompt.includes('아래로') ? 10 : 1, hole = seq.indexOf('□'), known = seq.findIndex(v => v !== '□');
    assert.equal(Number(q.answer), Number(seq[known]) + (hole - known) * step, q.prompt);
  }
  for (const q of collect(1, 'pictograph', '수 비교', p => p.includes('부등호'), 60)) {
    const [a, b] = nums(q.prompt); assert.equal(q.answer, a > b ? '>' : '<', q.prompt);
    assert.deepEqual(q.choices?.map(c => c.label).sort(), ['<', '>']);
  }
});

test('grade 2 times-table questions: word problems, equations and blanks', () => {
  const r = seeded(7); let words = 0, equations = 0, blanks = 0;
  for (let i = 0; i < 600; i++) {
    const q = generateGradeQuestion(2, 'plane', 8, r); if (q.skill !== '곱셈구구') continue;
    const n = nums(q.prompt);
    if (q.prompt.includes('□ 안에')) { blanks++; const m = q.prompt.match(/(?:(\d) × □|□ × (\d)) = (\d+)/)!; assert.equal(Number(q.answer) * Number(m[1] ?? m[2]), Number(m[3]), q.prompt); }
    else if (q.kind === 'number') { words++; assert.equal(Number(q.answer), n[0] * n[1], q.prompt); }
    else { equations++; const [each, groups] = nums(q.prompt); assert.equal(q.answer, `${each} × ${groups} = ${each * groups}`, q.prompt); assert.equal(new Set(q.choices!.map(c => c.label)).size, q.choices!.length); }
    assert.ok(!/[가-힣]\d+[가-힣]*\s*$/.test('') && !/undefined|NaN/.test(q.prompt + q.explanation));
  }
  assert.ok(words > 30 && equations > 30 && blanks > 30, JSON.stringify({ words, equations, blanks }));
});

test('grade 4 decimal reading and writing is consistent', () => {
  const DIGIT = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const say = (text: string) => { const [w, f] = text.split('.'); return `${DIGIT[Number(w)]}점 ${[...f].map(c => DIGIT[Number(c)]).join('')}`; };
  let reads = 0, writes = 0, places = 0;
  const r = seeded(3);
  for (let i = 0; i < 4000; i++) {
    const q = generateGradeQuestion(4, 'measurement', i % 2 ? 5 : 0, r);
    if (/을 바르게 읽은 것은/.test(q.prompt)) { reads++; assert.equal(q.answer, say(q.prompt.split('을 바르게')[0])); }
    else if (/을 수로 바르게 쓴 것은/.test(q.prompt)) { writes++; const spoken = q.prompt.match(/“(.+?)”/)![1]; assert.equal(say(q.answer), spoken); }
    else if (/소수 몇째 자리 숫자이고/.test(q.prompt)) {
      places++; const text = q.prompt.match(/^(\d\.\d+)에서/)![1], digit = q.prompt.match(/에서 (\d)/)![1], idx = text.split('.')[1].indexOf(digit) + 1;
      assert.equal(text.split(digit).length, 2, 'digit must appear once in the whole number');
      assert.ok(q.answer.startsWith(['', '소수 첫째', '소수 둘째', '소수 셋째'][idx]), q.prompt);
    }
  }
  assert.ok(reads > 50 && writes > 50 && places > 50, JSON.stringify({ reads, writes, places }));
});

test('grade 6 stacked-cube questions with empty cells have a single right answer and draw empty cells', () => {
  let counted = 0;
  for (const q of collect(6, 'measurement', '쌓기나무 위·앞·옆', p => p.includes('빈칸은'), 80, 9)) {
    const v = q.visual as { kind: 'stack-grid'; heights: number[][] }; assert.equal(v.kind, 'stack-grid');
    const flat = v.heights.flat();
    if (/층에 놓인/.test(q.prompt)) { const layer = Number(q.prompt.match(/(\d)층에 놓인/)![1]); assert.equal(Number(q.answer), flat.filter(h => h >= layer).length); }
    else if (q.prompt.includes('모두 몇 개')) { counted++; assert.equal(Number(q.answer), flat.reduce((a, b) => a + b, 0)); }
    else { const prof = v.heights[0].map((_, x) => Math.max(...v.heights.map(row => row[x]))).join('-'); assert.equal(q.answer, prof); assert.equal((q.choices ?? []).filter(c => c.label === prof).length, 1); }
    assert.match(curriculumVisualHtml(q.visual), /stack-grid/);
  }
  assert.ok(counted > 5);
});

test('grade 3 late multiplication fights include two-digit multipliers such as 40 x 30 and 35 x 25', () => {
  let seen = 0;
  for (let i = 0; i < 3000; i++) {
    const encounter = new Encounter(0, false, 1, undefined, 10, 0, 'multiplication', 'stage', undefined, 3), q = encounter.question;
    assert.equal(q.answer, q.dividend * q.divisor); assert.ok(q.answer <= 9999);
    assert.equal(encounter.answer(String(q.answer)), 'correct');
    if (q.divisor >= 20) { seen++; assert.ok(q.dividend >= 11 && q.answer <= 2400); }
  }
  assert.ok(seen > 600, `two-digit multiplier fights: ${seen}`);
  for (let i = 0; i < 500; i++) assert.ok(new Encounter(0, false, 1, undefined, 5, 0, 'multiplication', 'stage', undefined, 3).question.divisor <= 19);
});
