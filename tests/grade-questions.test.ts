import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCurriculumQuestion } from '../src/curriculum.ts';
import { curriculumVisualHtml } from '../src/curriculum-visual.ts';
import { generateGradeQuestion, gradeMissions, gradeTopics } from '../src/grade-content.ts';
import { j } from '../src/grade-helpers.ts';
import { NEW_CURRICULUM_UNITS, newUnitsForGrade } from '../src/rules.ts';

const grades = [1, 2, 4, 5, 6] as const;
function seeded(seed: number) { let state = seed >>> 0; return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296); }
const SAMPLES = 250;
/** 같은 주제를 쉬운 단계 또는 도전 단계(주제 수만큼 뒤의 단계)로 무작위로 만들어, 두 경우 모두 정답을 검증해요. */
const gq = (grade: (typeof grades)[number], unit: (typeof NEW_CURRICULUM_UNITS)[number], topic: number, random: () => number) => generateGradeQuestion(grade, unit, topic + (random() < .5 ? gradeTopics(grade, unit).length : 0), random);

test('every grade, unit and topic builds well-formed questions with a single correct answer', () => {
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) for (let topic = 0; topic < gradeTopics(grade, unit).length; topic++) {
    const random = seeded(grade * 1000 + topic * 37 + unit.length);
    for (let sample = 0; sample < SAMPLES; sample++) {
      const mission = topic + (sample % 2) * gradeTopics(grade, unit).length, tag = `${grade}-${unit}-${mission}#${sample}`;
      const q = generateGradeQuestion(grade, unit, mission, random);
      const text = [q.prompt, q.explanation, q.detail ?? '', ...(q.choices ?? []).map(c => c.label), ...q.hints].join(' ');
      assert.ok(!/undefined|NaN|Infinity|null/.test(text), `${tag}: ${text}`);
      assert.ok(q.prompt.length > 5, tag);
      assert.equal(new Set(q.hints).size, 3, `${tag} hints`);
      q.hints.forEach(h => assert.ok(h.length > 4, `${tag} short hint`));
      assert.equal(answerCurriculumQuestion(q, q.answer), true, tag);
      if (q.kind === 'choice') {
        const values = q.choices!.map(c => c.value);
        assert.ok(values.length >= 2 && values.length <= 4, `${tag} choice count ${values.length}`);
        assert.equal(new Set(values).size, values.length, `${tag} duplicate choices ${values}`);
        assert.equal(values.filter(v => v === q.answer).length, 1, `${tag} answer count`);
      } else assert.match(q.answer, /^\d{1,4}$/, `${tag} number answer ${q.answer}`);
      const html = curriculumVisualHtml(q.visual);
      assert.ok((q.visual.kind === 'none' ? html === '' : html.includes('curriculum-visual')) && !/undefined|NaN/.test(html), `${tag} visual`);
    }
  }
});

test('missions 0-4 of a region cover five different kinds of question (no more one-template regions)', () => {
  const skeleton = (prompt: string) => prompt.replace(/\d/g, '#');
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) {
    const random = seeded(grade * 31 + unit.length);
    const count = gradeTopics(grade, unit).length, perTopic = Array.from({ length: count }, (_, topic) => new Set(Array.from({ length: 60 }, () => skeleton(generateGradeQuestion(grade, unit, topic, random).prompt))));
    for (let a = 0; a < count; a++) for (let b = a + 1; b < count; b++) {
      const overlap = [...perTopic[a]].filter(x => perTopic[b].has(x));
      assert.ok(overlap.length < Math.min(perTopic[a].size, perTopic[b].size), `${grade}학년 ${unit}: 주제 ${a + 1}과 ${b + 1}의 문제가 같아요 (${overlap.join('|')})`);
    }
  }
});

test('each mission skill matches the topic of the question it asks', () => {
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) {
    const missions = gradeMissions(grade, unit)!;
    for (let mission = 0; mission < 10; mission++) assert.equal(generateGradeQuestion(grade, unit, mission, seeded(mission + 5)).skill, missions[mission].skill, `${grade}-${unit}-${mission}`);
  }
});

test('spot checks: answers match an independent calculation', () => {
  const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  for (let i = 0; i < 200; i++) {
    const random = seeded(i + 99);
    let q = gq(5, 'plane', 3, random); let [a, b] = nums(q.prompt); assert.equal(Number(q.answer), gcd(a, b), q.prompt);
    q = gq(5, 'plane', 4, random); [a, b] = nums(q.prompt); assert.equal(Number(q.answer), a / gcd(a, b) * b, q.prompt);
    q = gq(5, 'measurement', 2, random); const [w, h] = nums(q.prompt); assert.equal(Number(q.answer), w * h / 2);
    q = gq(5, 'measurement', 3, random); const [x, y, z] = nums(q.prompt); assert.equal(Number(q.answer), (x + y) * z / 2);
    q = gq(4, 'triangle', 0, random); const angles = q.prompt.match(/(\d+)°, (\d+)°, (\d+)°/)!.slice(1).map(Number); assert.equal(angles.reduce((s, v) => s + v, 0), 180);
    assert.equal(q.answer, angles.some(v => v === 90) ? '직각삼각형' : angles.some(v => v > 90) ? '둔각삼각형' : '예각삼각형');
    q = gq(4, 'circle', 4, random); if (q.kind === 'number' && q.prompt.includes('대각선')) { const n = ['삼각형', '사각형', '오각형', '육각형', '칠각형', '팔각형', '구각형'].findIndex(name => q.prompt.startsWith(name)) + 3; assert.ok(n >= 4, q.prompt); assert.equal(Number(q.answer), q.prompt.includes('한 꼭짓점에서 그을 수 있는 대각선은 몇 개') ? n - 3 : n * (n - 3) / 2, q.prompt); }
    q = gq(6, 'pictograph', 2, random); const [total, percent] = nums(q.prompt); assert.equal(Number(q.answer), total * percent / 100);
    q = gq(2, 'lengthTime', 1, random); const [hours, minutes] = nums(q.prompt); assert.equal(Number(q.answer), hours * 60 + minutes);
  }
});

test('graph and transformation pictures never print the hidden answer', () => {
  for (let i = 0; i < 120; i++) {
    const random = seeded(i + 7);
    for (const [grade, unit, mission] of [[4, 'pictograph', 0], [4, 'pictograph', 1], [6, 'pictograph', 0]] as const) {
      const q = generateGradeQuestion(grade, unit, mission, random), html = curriculumVisualHtml(q.visual);
      assert.ok(html.includes('>?<'), `${grade}-${unit}-${mission}`);
    }
  }
});

test('grade 4 teaches plane-figure movement and grade 5 teaches ranges and rounding, as in the 2022 standards', () => {
  const random = seeded(3);
  const g4 = [0, 1, 2].map(m => generateGradeQuestion(4, 'fractionDecimal', m, random).prompt);
  assert.match(g4[0], /밀/); assert.match(g4[1], /뒤집/); assert.match(g4[2], /돌렸/);
  const g5 = Array.from({ length: 200 }, () => gq(5, 'lengthTime', 4, random).prompt).join(' ');
  assert.match(g5, /올림|버림|반올림/);
  assert.doesNotMatch(Array.from({ length: 100 }, (_, i) => generateGradeQuestion(4, 'measurement', i % 10, random).prompt).join(' '), /반올림/);
});

test('Korean particles after numbers follow the final-consonant rule', () => {
  const pairs: Record<string, '은는' | '이가' | '을를' | '와과'> = { 은: '은는', 는: '은는', 이: '이가', 가: '이가', 을: '을를', 를: '을를', 와: '와과', 과: '와과' };
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) for (let mission = 0; mission < 10; mission++) {
    const random = seeded(grade * 7 + mission);
    for (let sample = 0; sample < 80; sample++) {
      const q = generateGradeQuestion(grade, unit, mission, random);
      for (const text of [q.prompt, q.explanation, ...q.hints, ...(q.choices ?? []).map(c => c.label)]) {
        for (const m of text.matchAll(/((?:\d+\/)?\d+(?:\.\d+)?)(와|과|은|는|이|가|을|를)(?![가-힣])/g)) {
          assert.equal(m[2], j(m[1], pairs[m[2]]).slice(m[1].length), `${grade}-${unit}-${mission}: "${m[0]}" in ${text}`);
        }
      }
    }
  }
});

test('the topic list of every region matches its question generators and each topic builds on its own', () => {
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) {
    const topics = gradeTopics(grade, unit);
    assert.ok(topics.length >= 5 && topics.length <= 10, `${grade}-${unit}`);
    assert.equal(new Set(topics).size, topics.length, `${grade}-${unit} duplicate topic`);
    topics.forEach((topic, index) => assert.equal(generateGradeQuestion(grade, unit, index, seeded(index + 3)).skill, topic, `${grade}-${unit}-${index}`));
  }
});

test('added 5th/6th grade topics: answers match an independent calculation', () => {
  const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const frac = (text: string) => { const m = text.match(/^(?:(\d+) )?(\d+)\/(\d+)$/); return m ? (Number(m[1] ?? 0) * Number(m[3]) + Number(m[2])) / Number(m[3]) : Number(text.replace(/,/g, '')); };
  for (let i = 0; i < 300; i++) {
    const random = seeded(i + 1234);
    let q = gq(5, 'plane', 5, random); const [a, b] = nums(q.prompt); assert.ok(Number(q.answer) % a === 0 && Number(q.answer) % b === 0, q.prompt);
    q.choices!.filter(c => c.value !== q.answer).forEach(c => assert.ok(Number(c.value) % a !== 0 || Number(c.value) % b !== 0, `${q.prompt} wrong ${c.value}`));
    q = gq(5, 'fraction', 5, random); const [n1, d1, n2, d2] = nums(q.prompt); assert.equal(frac(q.answer), Math.max(n1 / d1, n2 / d2));
    q = gq(5, 'fraction', 7, random); const [fn, fd, dv] = nums(q.prompt); assert.equal(frac(q.answer), Math.max(fn / fd, dv));
    q = gq(5, 'fraction', 8, random); const [x, y] = nums(q.prompt); assert.ok(Math.abs(frac(q.answer) - x / y) < 1e-9, q.prompt);
    q = gq(5, 'fraction', 6, random); { const m = q.prompt.match(/^(\d+) (\d+)\/(\d+) ([+−]) (\d+) (\d+)\/(\d+)/)!, v1 = Number(m[1]) + Number(m[2]) / Number(m[3]), v2 = Number(m[5]) + Number(m[6]) / Number(m[7]); assert.ok(Math.abs(frac(q.answer) - (m[4] === '+' ? v1 + v2 : v1 - v2)) < 1e-9, q.prompt); assert.ok(frac(q.answer) > 0); }
    q = gq(5, 'measurement', 6, random); { const [p, r2] = nums(q.prompt); assert.equal(Number(q.answer), p * r2 / 2); }
    q = gq(6, 'plane', 5, random); { const [a1, b1, c1, d2] = nums(q.prompt); assert.ok(Math.abs(frac(q.answer) - (a1 / b1) / (c1 / d2)) < 1e-9, q.prompt); }
    q = gq(6, 'plane', 6, random); { const [w, nn, dd, mm] = nums(q.prompt); assert.ok(Math.abs(frac(q.answer) - (w + nn / dd) / mm) < 1e-9, q.prompt); }
    q = gq(6, 'lengthTime', 5, random); { const [p, r2] = nums(q.prompt); assert.ok(Math.abs(Number(q.answer) - p / r2) < 1e-9, q.prompt); }
    q = gq(6, 'fractionDecimal', 6, random); { const [price, pct] = nums(q.prompt); assert.equal(Number(q.answer), price * pct / 100); }
    q = gq(6, 'measurement', 7, random); { const [w, d, l] = nums(q.prompt); const asked = q.prompt.includes('위에서') ? w * d : q.prompt.includes('앞에서') ? w * l : d * l; assert.equal(Number(q.answer), asked); }
  }
});

test('challenge missions (steps after every topic was met once) use larger numbers where numbers matter', () => {
  const biggest = (prompt: string) => Math.max(0, ...(prompt.match(/\d+(?:\.\d+)?/g) ?? []).map(Number));
  const random = seeded(4242);
  let harder = 0;
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) {
    const count = gradeTopics(grade, unit).length;
    for (let topic = 0; topic < count; topic++) {
      let easy = 0, hard = 0;
      for (let k = 0; k < 120; k++) { easy += biggest(generateGradeQuestion(grade, unit, topic, random).prompt); hard += biggest(generateGradeQuestion(grade, unit, topic + count, random).prompt); }
      if (hard > easy * 1.05) harder++;
    }
  }
  assert.ok(harder >= 80, `only ${harder} topics get harder numbers in challenge missions`);
});

test('added 1st/2nd/4th grade topics: answers match an independent calculation', () => {
  const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  for (let i = 0; i < 300; i++) {
    const random = seeded(i + 777);
    let q = gq(4, 'plane', 5, random); { const [a, b] = nums(q.prompt), rd = (n: number) => Math.round(n / 100) * 100; assert.equal(Number(q.answer), q.prompt.includes('+') ? rd(a) + rd(b) : rd(a) - rd(b), q.prompt); }
    q = gq(4, 'fractionDecimal', 5, random); { const m = q.prompt.match(/가로 (\d+)칸, 세로 (\d+)칸\)에 있어요. 이 점을 (오른쪽|왼쪽)으로 (\d+)칸, (위쪽|아래쪽)으로 (\d+)칸/)!; const x = Number(m[1]) + (m[3] === '오른쪽' ? 1 : -1) * Number(m[4]), y = Number(m[2]) + (m[5] === '위쪽' ? 1 : -1) * Number(m[6]); assert.equal(q.answer, `(${x}, ${y})`, q.prompt); assert.ok(x >= 1 && y >= 1); }
    q = gq(4, 'fractionDecimal', 6, random); if (q.kind === 'number') { if (q.prompt.includes('홀수')) { const n = Number(q.prompt.match(/1부터 (\d+)까지 홀수/)![1]); assert.equal(Number(q.answer), ((n + 1) / 2) ** 2); } else if (q.prompt.includes('9 ×')) { const ones = q.prompt.match(/9 × (1+)의 결과/)![1]; assert.equal(Number(q.answer), Number('9'.repeat(ones.length))); } else { const n = Number(q.prompt.match(/1부터 (\d+)까지 모두 더하면/)![1]); assert.equal(Number(q.answer), n * (n + 1) / 2); } } else { const asked = q.prompt.match(/(1+) × \1의 결과/)![1]; assert.ok(!q.prompt.includes(`${asked} × ${asked} =`), 'the pattern question must not show its own answer'); const n = asked.length, up = [...Array(n).keys()].map(k => k + 1), v = up.concat(up.slice(0, -1).reverse()).join(''); assert.equal(q.answer.replace(/,/g, ''), v); }
    q = gq(4, 'triangle', 1, random); if (q.prompt.includes('크기가 다른 한 각')) { const top = nums(q.prompt)[0]; assert.equal(Number(q.answer), (180 - top) / 2); }
    q = gq(4, 'circle', 5, random); if (q.kind === 'number' && q.prompt.includes('변의 길이의 합')) { const s = nums(q.prompt)[0], n = ['정삼각형', '정사각형', '정오각형', '정육각형'].findIndex(name => q.prompt.includes(name)) + 3; assert.equal(Number(q.answer), s * n); }
    q = gq(4, 'measurement', 5, random); if (q.prompt.includes('0.001이')) assert.equal(Number(q.answer), Number(nums(q.prompt)[1]) / 1000);
    q = gq(2, 'plane', 6, random); { const [a, b] = nums(q.prompt); assert.equal(Number(q.answer), q.prompt.includes('+ □') ? b - a : b + a, q.prompt); }
    q = gq(2, 'plane', 7, random); { const [a, b, c] = nums(q.prompt); assert.equal(a + b, c, q.prompt); assert.equal(Number(q.answer), b, q.prompt); }
    q = gq(1, 'fractionDecimal', 6, random); { const [x, y, z] = nums(q.prompt); if (q.prompt.includes(' + ') && q.prompt.indexOf(' + ') < q.prompt.indexOf('이면')) { assert.equal(x + y, z); assert.equal(Number(q.answer), x); } else { assert.equal(x - y, z); assert.equal(Number(q.answer), x); } }
  }
});

test('grade 3 recap missions now also ask seconds-clock reading and shape building', async () => {
  const { generateCurriculumQuestion } = await import('../src/curriculum.ts');
  const random = seeded(8);
  const seen = new Map<string, number>();
  for (let i = 0; i < 400; i++) for (const unit of ['lengthTime', 'plane'] as const) {
    const q = generateCurriculumQuestion(unit, 8, random);
    seen.set(q.skill, (seen.get(q.skill) ?? 0) + 1);
    if (q.skill === '초 단위 시각 읽기') {
      const v = q.visual as { kind: string; clock?: boolean; values: number[] };
      assert.ok(v.kind === 'length-time' && v.clock && v.values.length === 3, 'clock visual with a second hand');
      const [hour, minute, second] = v.values;
      assert.equal(q.answer, `${hour}시 ${minute}분 ${second}초`); assert.equal(new Set(q.choices!.map(c => c.value)).size, q.choices!.length);
      assert.ok(!/[0-9]시|바늘/.test(q.prompt), 'prompt must not give away the time');
    }
  }
  assert.ok((seen.get('초 단위 시각 읽기') ?? 0) > 40 && (seen.get('도형으로 모양 만들기') ?? 0) > 40, JSON.stringify([...seen]));
});

test('grade 3 (original curriculum) questions are well-formed and use correct Korean particles', async () => {
  const { generateCurriculumQuestion } = await import('../src/curriculum.ts');
  const pairs: Record<string, '은는' | '이가' | '을를' | '와과'> = { 은: '은는', 는: '은는', 이: '이가', 가: '이가', 을: '을를', 를: '을를', 와: '와과', 과: '와과' };
  for (const unit of newUnitsForGrade(3)) for (let mission = 0; mission < 10; mission++) {
    const random = seeded(unit.length * 100 + mission);
    for (let sample = 0; sample < 300; sample++) {
      const q = generateCurriculumQuestion(unit, mission, random), tag = `${unit}-${mission}`;
      const text = [q.prompt, q.explanation, q.detail ?? '', ...q.hints, ...(q.choices ?? []).map(c => c.label)].join(' ');
      assert.ok(!/undefined|NaN|Infinity|null/.test(text), `${tag}: ${text}`);
      assert.equal(new Set(q.hints).size, 3, `${tag} hints: ${q.prompt}`);
      assert.equal(answerCurriculumQuestion(q, q.answer), true, tag);
      if (q.kind === 'choice') { const values = q.choices!.map(c => c.value); assert.equal(new Set(values).size, values.length, `${tag} ${q.prompt}`); assert.equal(values.filter(v => v === q.answer).length, 1, tag); assert.ok(values.length >= 2, tag); }
      else assert.match(q.answer, /^\d{1,4}$/, tag);
      for (const t of [q.prompt, q.explanation, ...q.hints]) for (const m of t.matchAll(/((?:\d+\/)?\d+(?:\.\d+)?)(와|과|은|는|이|가|을|를)(?![가-힣])/g)) assert.equal(m[2], j(m[1], pairs[m[2]]).slice(m[1].length), `${tag}: "${m[0]}" in ${t}`);
    }
  }
});

test('every topic keeps a minimum variety of distinct questions (picture and answer included)', async () => {
  const { generateCurriculumQuestion } = await import('../src/curriculum.ts');
  const random = seeded(2024), key = (q: { prompt: string; detail?: string; visual: unknown; answer: string }) => [q.prompt, q.detail ?? '', JSON.stringify(q.visual), q.answer].join('|');
  const low: string[] = [];
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) for (let topic = 0; topic < gradeTopics(grade, unit).length; topic++) {
    const seen = new Set<string>();
    for (let k = 0; k < 1500; k++) seen.add(key(generateGradeQuestion(grade, unit, topic, random)));
    if (seen.size < 9) low.push(`${grade}학년 ${unit} ${gradeTopics(grade, unit)[topic]} (${seen.size}종)`);
  }
  for (const unit of newUnitsForGrade(3)) for (let mission = 0; mission < 8; mission++) {
    const seen = new Set<string>();
    for (let k = 0; k < 1500; k++) seen.add(key(generateCurriculumQuestion(unit, mission, random)));
    if (seen.size < 9) low.push(`3학년 ${unit} 단계${mission + 1} (${seen.size}종)`);
  }
  assert.deepEqual(low, []);
});

test('question variants added for repetitive topics are correct', () => {
  const SIDES = ['위쪽', '아래쪽', '왼쪽', '오른쪽'], opposite: Record<string, string> = { 위쪽: '아래쪽', 아래쪽: '위쪽', 왼쪽: '오른쪽', 오른쪽: '왼쪽' };
  const cw: Record<string, string> = { 위쪽: '오른쪽', 오른쪽: '아래쪽', 아래쪽: '왼쪽', 왼쪽: '위쪽' }, ccw: Record<string, string> = { 위쪽: '왼쪽', 왼쪽: '아래쪽', 아래쪽: '오른쪽', 오른쪽: '위쪽' };
  const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const seen = new Set<string>();
  for (let i = 0; i < 1500; i++) {
    const random = seeded(i + 31);
    let q = gq(4, 'fractionDecimal', 1, random);
    { const m = q.prompt.match(/도형을 (오른쪽|왼쪽|위쪽|아래쪽)(?:으로|로) 뒤집었어요\. 원래 (위쪽|아래쪽|왼쪽|오른쪽)에 있던/); if (m) { const horizontal = m[1] === '오른쪽' || m[1] === '왼쪽', swaps = horizontal ? ['왼쪽', '오른쪽'].includes(m[2]) : ['위쪽', '아래쪽'].includes(m[2]); assert.equal(q.answer, swaps ? opposite[m[2]] : m[2], q.prompt); seen.add(swaps ? 'flip-swap' : 'flip-same'); } }
    q = gq(4, 'fractionDecimal', 2, random);
    { const m = q.prompt.match(/도형을 (시계 방향으로 90°|시계 반대 방향으로 90°|180°) 돌렸어요\. 원래 (위쪽|아래쪽|왼쪽|오른쪽)에 있던/); if (m) { const expected = m[1].startsWith('시계 방향') ? cw[m[2]] : m[1].startsWith('시계 반대') ? ccw[m[2]] : opposite[m[2]]; assert.equal(q.answer, expected, q.prompt); seen.add('rotate'); } }
    q = gq(6, 'measurement', 0, random);
    { const m = q.prompt.match(/^(삼각|사각|오각|육각|칠각|팔각)(기둥|뿔)의 (꼭짓점|모서리|면)/); if (m) { const n = ['삼각', '사각', '오각', '육각', '칠각', '팔각'].indexOf(m[1]) + 3, expected = m[2] === '기둥' ? { 꼭짓점: 2 * n, 모서리: 3 * n, 면: n + 2 }[m[3]]! : { 꼭짓점: n + 1, 모서리: 2 * n, 면: n + 1 }[m[3]]!; assert.equal(Number(q.answer), expected, q.prompt); seen.add('prism'); } }
    q = gq(5, 'plane', 4, random); { const [a, b] = nums(q.prompt); const gcd = (x: number, y: number): number => y ? gcd(y, x % y) : x; assert.equal(Number(q.answer), a / gcd(a, b) * b, q.prompt); }
    q = gq(5, 'fraction', 1, random);
    { const m = q.prompt.match(/분모 (\d+)(?:으로|로) 통분하면 (\d+)\/(\d+)(?:과|와) □\/(\d+)이에요/); if (m) { const [n1d1] = [q.prompt.match(/^(\d+)\/(\d+)(?:과|와) (\d+)\/(\d+)(?:을|를)/)!]; const L = Number(m[1]), d1 = Number(n1d1[2]), n2 = Number(n1d1[3]), d2 = Number(n1d1[4]); assert.equal(L % d1 + L % d2, 0); assert.equal(Number(q.answer), n2 * (L / d2)); seen.add('common-denominator'); } else if (q.prompt.includes('될 수 없는')) { const d = nums(q.prompt), L = d[0] * d[1] / (function g(x: number, y: number): number { return y ? g(y, x % y) : x; })(d[0], d[1]); assert.ok(Number(q.answer) % d[0] !== 0 || Number(q.answer) % d[1] !== 0, q.prompt); q.choices!.filter(c => c.value !== q.answer).forEach(c => assert.equal(Number(c.value) % L, 0)); seen.add('not-common'); } }
    q = gq(6, 'circle', 4, random);
    { const m = q.prompt.match(/지름이 (\d+) cm인 원 모양 피자의 넓이/); if (m) { const r = Number(m[1]) / 2; assert.ok(Math.abs(Number(q.answer) - r * r * 3.14) < 1e-6, q.prompt); seen.add('pizza'); } const h = q.prompt.match(/반지름이 (\d+) cm인 원을 반으로 잘랐어요/); if (h) { const r = Number(h[1]); assert.ok(Math.abs(Number(q.answer) - r * r * 3.14 / 2) < 1e-6, q.prompt); seen.add('half'); } const p = q.prompt.match(/지름이 (\d+) cm인 원 모양 접시의 둘레/); if (p) { assert.ok(Math.abs(Number(q.answer) - Number(p[1]) * 3.14) < 1e-6, q.prompt); seen.add('plate'); } }
    q = gq(6, 'pictograph', 5, random);
    { const table: Record<string, string> = { '주사위를 던질 때 3 이하의 눈이 나올 가능성': '1/2', '주사위를 던질 때 6의 약수의 눈이 나올 가능성': '2/3', '1부터 4까지 적힌 카드에서 짝수를 뽑을 가능성': '1/2', '1부터 5까지 적힌 카드에서 3의 배수를 뽑을 가능성': '1/5', '1부터 10까지 적힌 카드에서 5의 배수를 뽑을 가능성': '1/5', '빨간 공 1개와 파란 공 1개가 든 주머니에서 빨간 공을 꺼낼 가능성': '1/2', '주사위를 던질 때 1부터 6 사이의 눈이 나올 가능성': '1', '주사위를 던질 때 0의 눈이 나올 가능성': '0' }; const stem = Object.keys(table).find(k => q.prompt.startsWith(k)); if (stem) { assert.equal(q.answer, table[stem], q.prompt); seen.add('prob'); } }
    q = gq(4, 'plane', 0, random);
    { const m = q.prompt.match(/^(\d+)만 (\d+)천을 수로/); if (m) { assert.equal(q.answer.replace(/,/g, ''), String(Number(m[1]) * 10000 + Number(m[2]) * 1000)); seen.add('man'); } }
    q = gq(4, 'plane', 1, random);
    { const m = q.prompt.match(/^(\d+)억 (\d+)천만을 수로/); if (m) { assert.equal(q.answer.replace(/,/g, ''), String(Number(m[1]) * 100000000 + Number(m[2]) * 10000000)); seen.add('eok'); } }
    q = gq(4, 'lengthTime', 0, random);
    { const m = q.prompt.match(/^(\d+)°인 각과 (\d+)°인 각을 이어 붙이면/); if (m) { assert.equal(Number(q.answer), Number(m[1]) + Number(m[2])); seen.add('angle-sum'); } const n = q.prompt.match(/^(직각 90°|평각 180°)에서 (\d+)°를 빼면/); if (n) { assert.equal(Number(q.answer), (n[1].startsWith('직각') ? 90 : 180) - Number(n[2])); seen.add('angle-sub'); } }
    q = gq(5, 'circle', 1, random);
    { const m = q.prompt.match(/(삼각형|사각형) (\S+)(?:와|과) (?:삼각형|사각형) (\S+)(?:이|가) 합동이고 점 (.+)의 대응점이 차례로 (.+)이에요\. (점|변|각) (\S+)의 대응/); if (m) { const A = m[4].split(', '), B = m[5].split(', '), what = m[7]; if (m[6] === '점') assert.equal(q.answer, B[A.indexOf(what)]); else if (m[6] === '각') assert.equal(q.answer, `각 ${B[A.indexOf(what)]}`); else { const i = A.indexOf(what[0]), next = A.indexOf(what[1]); assert.equal(next, (i + 1) % A.length); assert.equal(q.answer, `변 ${B[i]}${B[next]}`); } seen.add('corresponding'); } }
  }
  for (const kind of ['flip-swap', 'flip-same', 'rotate', 'prism', 'common-denominator', 'not-common', 'pizza', 'half', 'plate', 'prob', 'man', 'eok', 'angle-sum', 'angle-sub', 'corresponding']) assert.ok(seen.has(kind), `variant ${kind} was never generated`);
  void SIDES;
});
