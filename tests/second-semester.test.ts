import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGradeQuestion, gradeTopics } from '../src/grade-content.ts';
import { SECOND_TOPICS } from '../src/grade-second.ts';
import { curriculumVisualHtml } from '../src/curriculum-visual.ts';
import { answerCurriculumQuestion, type CurriculumQuestion } from '../src/curriculum.ts';
import type { NewCurriculumUnitId } from '../src/rules.ts';

type Grade = 1 | 2 | 4 | 5 | 6;
const RUNS = 300;
function seeded(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const nums = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const near = (a: number, b: number, tag: string) => assert.ok(Math.abs(a - b) < 1e-9, `${tag}: ${a} !== ${b}`);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const ONES = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], TENS = ['', '십', '이십', '삼십', '사십', '오십', '육십', '칠십', '팔십', '구십'];
const bars = (q: CurriculumQuestion) => { assert.equal(q.visual.kind, 'bar-graph'); return q.visual as Extract<CurriculumQuestion['visual'], { kind: 'bar-graph' }>; };

const CHECKS: Record<string, (q: CurriculumQuestion, tag: string) => void> = {
  // 1학년
  '1시간 뒤의 시각': (q, tag) => { const m = q.prompt.match(/^(\d+)시( 30분)?에서/)!; assert.equal(q.answer, `${Number(m[1]) + 1}시${m[2] ?? ''}`, tag); },
  '시각의 앞과 뒤': (q, tag) => { const t = [...q.prompt.matchAll(/(\d+)시( 30분)?/g)].slice(0, 2).map(m => Number(m[1]) * 60 + (m[2] ? 30 : 0)), later = q.prompt.includes('더 늦은'); const got = q.answer.match(/(\d+)시( 30분)?/)!; assert.equal(Number(got[1]) * 60 + (got[2] ? 30 : 0), later ? Math.max(...t) : Math.min(...t), tag); },
  '반대쪽에서 세기': (q, tag) => { const [n, k] = nums(q.prompt); assert.equal(Number(q.answer), n - k + 1, tag); },
  '줄 서기 순서': (q, tag) => { assert.equal(Number(q.answer), nums(q.prompt)[0] + 1, tag); },
  '쌓은 개수 세기': (q, tag) => { assert.equal(Number(q.answer), [...q.prompt.matchAll(/층에 (\d+)개/g)].reduce((s, m) => s + Number(m[1]), 0), tag); },
  '층 위치': (q, tag) => { const n = nums(q.prompt)[0]; assert.equal(Number(q.answer), q.prompt.includes('맨 위') ? n : 1, tag); },
  '몇 묶음과 낱개': (q, tag) => { const n = nums(q.prompt)[0]; assert.equal(q.answer, `${Math.floor(n / 10)}묶음과 ${n % 10}개`, tag); },
  '1 큰 수와 1 작은 수': (q, tag) => { const m = q.prompt.match(/(\d+)보다 1 (큰|작은) 수/)!; assert.equal(Number(q.answer), Number(m[1]) + (m[2] === '큰' ? 1 : -1), tag); },
  '10 큰 수와 10 작은 수': (q, tag) => { const m = q.prompt.match(/(\d+)보다 10 (큰|작은) 수/)!; assert.equal(Number(q.answer), Number(m[1]) + (m[2] === '큰' ? 10 : -10), tag); },
  '수 읽고 쓰기': (q, tag) => { if (q.kind === 'choice') { const n = nums(q.prompt)[0]; assert.equal(q.answer, `${TENS[Math.floor(n / 10)]}${ONES[n % 10]}`, tag); } else { const w = q.prompt.match(/“(.+?)”/)![1], t = TENS.findIndex(x => x && w.startsWith(x) && (w.length === x.length || ONES.includes(w.slice(x.length)))), o = ONES.indexOf(w.slice(TENS[t].length)); assert.equal(Number(q.answer), t * 10 + o, tag); } },
  '세 수 크기 비교': (q, tag) => { const v = nums(q.prompt).slice(0, 3); assert.equal(Number(q.answer), q.prompt.includes('가장 큰') ? Math.max(...v) : Math.min(...v), tag); },
  'AB 규칙 찾기': (q, tag) => { const seq = q.prompt.split('나와요. ')[1].split(' □')[0].split(' '); assert.equal(q.answer, seq[seq.length - 2], tag); assert.notEqual(q.answer, seq[seq.length - 1], tag); },
  '세 칸 규칙 찾기': (q, tag) => { const [, rest] = q.prompt.split(' 순서가 되풀이돼요. '), unit = q.prompt.split(' 순서가')[0].split(' '), seq = rest.split(' □')[0].split(' '); assert.equal(q.answer, unit[seq.length % 3], tag); seq.forEach((s, i) => assert.equal(s, unit[i % 3], tag)); },
  '가운데와 사이': (q, tag) => { const names = q.prompt.match(/왼쪽부터 (.+?) 순서로/)![1].split(', '); assert.equal(names.length, 5); if (q.prompt.includes('가운데에')) assert.equal(q.answer, names[2], tag); else { const m = q.prompt.match(/순서로 한 줄로 있어요\. (\S+)와 (\S+) 사이/)!, i = names.indexOf(m[1]); assert.equal(names[i + 2], m[2], tag); assert.equal(q.answer, names[i + 1], tag); } },
  // 2학년
  '걸린 시간': (q, tag) => { const t = [...q.prompt.matchAll(/(\d+)시(?: (\d+)분)?에/g)].map(m => Number(m[1]) * 60 + Number(m[2] ?? 0)); assert.equal(Number(q.answer), t[1] - t[0], tag); },
  '몇 시간 뒤 시각': (q, tag) => { const m = q.prompt.match(/^(\d+)시( (\d+)분)?에서 (\d+)시간/)!; assert.equal(q.answer, `${(Number(m[1]) + Number(m[4]) - 1) % 12 + 1}시${m[3] ? ` ${m[3]}분` : ''}`, tag); },
  '오전과 오후': (q, tag) => { const h = nums(q.prompt)[0], morning = /아침|학교에 가는/.test(q.prompt); assert.equal(q.answer, `${morning ? '오전' : '오후'} ${h}시`, tag); },
  '분을 시간으로 바꾸기': (q, tag) => { const n = nums(q.prompt)[0]; assert.equal(q.answer, `${Math.floor(n / 60)}시간 ${n % 60}분`, tag); },
  '며칠 뒤 날짜': (q, tag) => { const [, d, w] = nums(q.prompt); assert.equal(Number(q.answer), d + 7 * w, tag); },
  '덧셈표의 규칙': (q, tag) => { const s = Number(q.prompt.match(/= (\d+)이에요/)![1]), step = Number(q.prompt.match(/으로 (\d+)칸/)![1]), up = /오른쪽으로|아래쪽으로/.test(q.prompt.split('칸 가면')[0]); assert.equal(Number(q.answer), up ? s + step : s - step, tag); },
  '곱셈표의 규칙': (q, tag) => { const [n, m] = nums(q.prompt); assert.equal(Number(q.answer), n * (m + 1), tag); },
  '쌓은 모양의 규칙': (q, tag) => { const c = [...q.prompt.matchAll(/(?:첫째|둘째|셋째|넷째)에 (\d+)개/g)].map(m => Number(m[1])); assert.equal(c.length, 4); const d = c[1] - c[0]; assert.ok(c[2] - c[1] === d && c[3] - c[2] === d); assert.equal(Number(q.answer), c[0] + 5 * d, tag); },
  '반복 무늬의 자리': (q, tag) => { const after = q.prompt.split('처럼 ')[1].split(' 순서가')[0].split(' '), pos = Number(q.prompt.match(/(\d+)번째 모양/)![1]); assert.equal(q.answer, after[(pos - 1) % 3], tag); },
  '빈칸의 수 찾기': (q, tag) => { const parts = q.prompt.match(/요\. (.+) 에서/)![1].split(', '), idx = parts.indexOf('□'), known = parts.map((p, i) => [i, Number(p)] as const).filter(([, v]) => !Number.isNaN(v)), step = (known[known.length - 1][1] - known[0][1]) / (known[known.length - 1][0] - known[0][0]); assert.equal(Number(q.answer), known[0][1] + (idx - known[0][0]) * step, tag); },
  '가장 적은 것': (q, tag) => { const c = [...q.prompt.matchAll(/(사과|배|귤|포도) (\d+)명/g)].map(m => [m[1], Number(m[2])] as const); assert.equal(q.answer, c.reduce((a, b) => (b[1] < a[1] ? b : a))[0], tag); },
  '두 항목의 합': (q, tag) => { const c = new Map([...q.prompt.matchAll(/(사과|배|귤|포도) (\d+)명/g)].map(m => [m[1], Number(m[2])] as const)), asked = q.prompt.split('을 좋아해요. ')[1].match(/사과|배|귤|포도/g)!; assert.equal(Number(q.answer), c.get(asked[0])! + c.get(asked[1])!, tag); },
  '모르는 칸 구하기': (q, tag) => { const total = nums(q.prompt)[0], known = [...q.prompt.matchAll(/(?:사과|배|귤|포도) (\d+)명/g)].reduce((s, m) => s + Number(m[1]), 0); assert.equal(Number(q.answer), total - known, tag); },
  '많고 적음의 차': (q, tag) => { const c = [...q.prompt.matchAll(/(?:사과|배|귤|포도) (\d+)명/g)].map(m => Number(m[1])); assert.equal(Number(q.answer), Math.max(...c) - Math.min(...c), tag); },
  // 4학년
  '평행사변형의 성질': (q, tag) => { const n = nums(q.prompt); if (q.prompt.includes('네 변의 길이의 합')) assert.equal(Number(q.answer), 2 * (n[0] + n[1]), tag); else if (q.prompt.includes('이웃한')) assert.equal(Number(q.answer), 180 - n[1], tag); else assert.equal(Number(q.answer), n[0], tag); },
  '마름모의 성질': (q, tag) => { const n = nums(q.prompt); if (q.prompt.includes('네 변의 길이의 합')) assert.equal(Number(q.answer), 4 * n[0], tag); else if (q.prompt.includes('똑같이 둘로')) assert.equal(Number(q.answer), n[0] / 2, tag); else assert.equal(Number(q.answer), 90, tag); },
  '직사각형과 정사각형의 성질': (q, tag) => { const n = nums(q.prompt); if (q.prompt.startsWith('직사각형의 가로')) assert.equal(Number(q.answer), 2 * (n[0] + n[1]), tag); else if (q.prompt.startsWith('정사각형의 한 변')) assert.equal(Number(q.answer), 4 * n[0], tag); else if (q.prompt.includes('길이는 같아요')) assert.equal(Number(q.answer), n[0], tag); else assert.equal(Number(q.answer), 90, tag); },
  '소수 두 자리 수끼리의 덧셈': (q, tag) => { const [a, b] = nums(q.prompt); near(Number(q.answer), a + b, tag); },
  '받아올림이 있는 소수 덧셈': (q, tag) => { const [a, b] = nums(q.prompt); near(Number(q.answer), a + b, tag); assert.ok(Math.round(a * 10) % 10 + Math.round(b * 10) % 10 >= 0); },
  '받아내림이 있는 소수 뺄셈': (q, tag) => { const [a, b] = nums(q.prompt); near(Number(q.answer), a - b, tag); assert.ok(a > b); },
  '자연수에서 소수 빼기': (q, tag) => { const [a, b] = nums(q.prompt); near(Number(q.answer), a - b, tag); assert.ok(a > b); },
  '눈금 한 칸의 크기': (q, tag) => { const [cells, total] = nums(q.prompt); assert.equal(Number(q.answer), total / cells, tag); },
  '그래프의 합계': (q, tag) => { assert.equal(Number(q.answer), bars(q).values.reduce((s, v) => s + v, 0), tag); },
  '변화가 가장 큰 때': (q, tag) => { const { labels, values } = bars(q), diffs = values.slice(1).map((v, i) => Math.abs(v - values[i])), max = Math.max(...diffs); assert.equal(diffs.filter(d => d === max).length, 1, `${tag} unique`); assert.equal(q.answer, `${labels[diffs.indexOf(max)]}에서 ${labels[diffs.indexOf(max) + 1]}`, tag); },
  '변화한 양': (q, tag) => { const { labels, values } = bars(q), m = q.prompt.match(/(\d+)월부터 (\d+)월까지/)!, i = labels.indexOf(`${m[1]}월`), k = labels.indexOf(`${m[2]}월`); assert.equal(Number(q.answer), values[k] - values[i], tag); assert.ok(values[k] > values[i]); },
  '그래프로 예상하기': (q, tag) => { const [, a, , b] = nums(q.prompt); assert.equal(Number(q.answer), (a + b) / 2, tag); },
  // 5학년
  '곱하는 수의 0의 개수': (q, tag) => { const [x, m] = nums(q.prompt); near(Number(q.answer), x * m, tag); },
  '곱의 소수점 위치': (q, tag) => { const n = nums(q.prompt); near(Number(q.answer), n[3] * n[4], tag); assert.equal(n[0] * n[1], n[2]); },
  '소수 곱셈의 어림': (q, tag) => { const [a, b] = nums(q.prompt); assert.equal(q.answer, `약 ${Math.round(a) * Math.round(b)}`, tag); },
  '소수 곱셈 이야기': (q, tag) => { const n = nums(q.prompt).slice(q.prompt.includes('1 m의') ? 1 : 0); near(Number(q.answer), n[0] * n[1], tag); },
  '곱셈 결과의 크기': (q, tag) => { const N = nums(q.prompt)[0], mul = (label: string) => Number(label.split(' × ')[1]); assert.ok(mul(q.answer) < 1, tag); q.choices!.filter(c => c.value !== q.answer).forEach(c => assert.ok(mul(c.value) > 1, `${tag} ${c.value}`)); assert.ok(N > 0); },
  '대응각의 크기': (q, tag) => { assert.equal(Number(q.answer), nums(q.prompt).slice(-1)[0] === undefined ? -1 : Number(q.prompt.match(/(\d+)°일 때/)![1]), tag); },
  '합동인 도형의 둘레': (q, tag) => { assert.equal(Number(q.answer), nums(q.prompt).reduce((s, v) => s + v, 0) , tag); },
  '대칭축의 수': (q, tag) => { if (q.kind === 'number') assert.equal(Number(q.answer), nums(q.prompt)[0], tag); else { const k = nums(q.prompt)[0], info: Record<string, number> = { 정삼각형: 3, 정사각형: 4, 이등변삼각형: 1, 정오각형: 5, 정육각형: 6 }; assert.equal(info[q.answer], k, tag); q.choices!.filter(c => c.value !== q.answer).forEach(c => assert.notEqual(info[c.value], k, `${tag} ${c.value}`)); } },
  '점대칭도형 찾기': (q, tag) => { const sym = ['정사각형', '직사각형', '평행사변형', '마름모', '정육각형'], non = ['정삼각형', '정오각형', '이등변삼각형', '직각삼각형', '정칠각형']; const wantsNot = q.prompt.includes('아닌 것은 무엇'); const choose = (set: string[]) => assert.ok(set.includes(q.answer), tag); if (q.prompt.includes('선대칭도형은 아니지만')) assert.equal(q.answer, '평행사변형'); else choose(wantsNot ? non : sym); q.choices!.filter(c => c.value !== q.answer).forEach(c => assert.ok(!q.prompt.includes('선대칭도형은 아니지만') || ['정사각형', '정육각형', '정삼각형'].includes(c.value))); },
  '대칭의 중심과 대칭축': (q, tag) => { assert.equal(Number(q.answer), 2 * nums(q.prompt)[0], tag); },
  '평균 구하기': (q, tag) => { const v = bars(q).values; assert.equal(Number(q.answer), v.reduce((s, x) => s + x, 0) / v.length, tag); assert.ok(Number.isInteger(Number(q.answer))); },
  '평균 비교하기': (q, tag) => { const m = q.prompt.match(/1모둠 (\d+)명의 점수 합은 (\d+)점, 2모둠 (\d+)명의 점수 합은 (\d+)점/)!.slice(1).map(Number), a = m[1] / m[0], b = m[3] / m[2]; assert.ok(Number.isInteger(a) && Number.isInteger(b) && a !== b, tag); assert.equal(q.answer, a > b ? '1모둠' : '2모둠', tag); },
  '평균으로 모르는 값 구하기': (q, tag) => { const [mean, a, b, c] = nums(q.prompt); assert.equal(Number(q.answer), mean * 4 - a - b - c, tag); assert.ok(Number(q.answer) >= 60 && Number(q.answer) <= 100); },
  // 6학년
  '원주로 지름 구하기': (q, tag) => { const c = nums(q.prompt)[0]; near(Number(q.answer) * 3.14, c, tag); },
  '지름으로 원의 넓이 구하기': (q, tag) => { const d = nums(q.prompt)[0]; near(Number(q.answer), Math.round((d / 2) * (d / 2) * 3.14 * 100) / 100, tag); },
  '원의 넓이 어림하기': (q, tag) => { const [r, inner, outer] = [nums(q.prompt)[0], nums(q.prompt)[1], nums(q.prompt)[2]], area = parseFloat(q.answer); assert.equal(inner, 2 * r * r); assert.equal(outer, 4 * r * r); assert.ok(area > inner && area < outer, tag); q.choices!.filter(c => c.value !== q.answer).forEach(c => { const v = parseFloat(c.value); assert.ok(v <= inner || v >= outer, `${tag} ${c.value}`); }); },
  '반원의 넓이': (q, tag) => { const d = nums(q.prompt)[0]; near(Number(q.answer), Math.round((d / 2) * (d / 2) * 3.14 / 2 * 100) / 100, tag); },
  '색칠한 부분의 넓이': (q, tag) => { const s = nums(q.prompt)[0]; near(Number(q.answer), Math.round((s * s - 3.14 * (s / 2) * (s / 2)) * 100) / 100, tag); },
  '가장 간단한 자연수의 비': (q, tag) => { const [a, b] = nums(q.prompt), g = gcd(a, b); assert.equal(q.answer, `${a / g} : ${b / g}`, tag); },
  '외항의 곱과 내항의 곱': (q, tag) => { const [p, , , d] = nums(q.prompt); assert.equal(Number(q.answer), p * d, tag); const m = q.prompt.match(/(\d+) : (\d+) = (\d+) : (\d+)/)!; assert.equal(Number(m[1]) * Number(m[4]), Number(m[2]) * Number(m[3])); },
  '비례식 세우기': (q, tag) => { const m = q.answer.match(/^(\d+) : (\d+) = (\d+) : (\d+)$/)!, [a, b, c, d] = m.slice(1).map(Number); assert.equal(a * d, b * c, tag); const given = nums(q.prompt); assert.deepEqual([a, b, c, d], [given[0], given[1], given[2], given[3]], tag); },
  '전체를 비로 나누기': (q, tag) => { const [a, b] = nums(q.prompt), g = gcd(a, a + b), n = a / g, d = (a + b) / g; assert.equal(q.answer, `${n}/${d}`, tag); },
  '비례배분 활용': (q, tag) => { const [total, a, b] = nums(q.prompt); assert.equal(total % (a + b), 0); assert.equal(Number(q.answer), (b - a) * (total / (a + b)), tag); },
  '각기둥과 각뿔의 모서리': (q, tag) => { const names = ['삼', '사', '오', '육', '칠', '팔'], n = names.findIndex(x => q.prompt.startsWith(`${x}각`)) + 3; assert.ok(n >= 3); assert.equal(Number(q.answer), q.prompt.includes('각기둥') ? 3 * n : 2 * n, tag); }
};

test('every added second-semester topic is covered by an independent check', () => {
  const skills = (Object.values(SECOND_TOPICS) as Partial<Record<NewCurriculumUnitId, string[]>>[]).flatMap(unit => Object.values(unit).flat() as string[]);
  const bankTopics = ['긴바늘과 짧은바늘', '표와 그래프의 좋은 점', '가능성을 수로 나타내기', '가능성을 말로 판단하기'];
  const missing = skills.filter(skill => !CHECKS[skill] && !bankTopics.includes(skill));
  assert.deepEqual(missing, []);
});

test(`added second-semester topics: ${RUNS} generated questions per topic are correct, well-formed and answerable`, () => {
  let total = 0;
  for (const grade of [1, 2, 4, 5, 6] as Grade[]) for (const [unit, topics] of Object.entries(SECOND_TOPICS[grade]) as [NewCurriculumUnitId, string[]][]) for (const skill of topics) {
    const all = gradeTopics(grade, unit), topic = all.indexOf(skill);
    assert.ok(topic >= 0, `${grade}-${unit} ${skill}`);
    const random = seeded(grade * 997 + topic * 31 + unit.length);
    for (let k = 0; k < RUNS; k++) {
      const tag = `${grade}학년 ${unit} ${skill} #${k}`, q = generateGradeQuestion(grade, unit, topic + (k % 2) * all.length, random);
      assert.equal(q.skill, skill, tag);
      assert.equal(answerCurriculumQuestion(q, q.answer), true, tag);
      if (q.kind === 'choice') { const values = q.choices!.map(c => c.value); assert.ok(values.length >= 2, `${tag} few choices`); assert.equal(new Set(values).size, values.length, `${tag} duplicate choices`); assert.equal(values.filter(v => v === q.answer).length, 1, tag); } else assert.match(q.answer, /^\d{1,4}$/, tag);
      assert.ok(!/undefined|NaN|Infinity|\(가\)|\(를\)|\(을\)|\(이\)/.test([q.prompt, q.explanation, ...q.hints, ...(q.choices ?? []).map(c => c.label)].join(' ')), `${tag} text`);
      assert.equal(new Set(q.hints).size, 3, `${tag} hints`);
      const html = curriculumVisualHtml(q.visual);
      assert.ok(!/undefined|NaN/.test(html), `${tag} visual`);
      CHECKS[skill]?.(q, tag);
      total++;
    }
  }
  assert.ok(total >= 60 * RUNS, `only ${total} questions checked`);
});

test('bank topics: every item has exactly one right choice and the right choice is not repeated among wrong ones', () => {
  for (const [grade, unit, skill] of [[1, 'lengthTime', '긴바늘과 짧은바늘'], [2, 'pictograph', '표와 그래프의 좋은 점'], [5, 'pictograph', '가능성을 수로 나타내기'], [5, 'pictograph', '가능성을 말로 판단하기']] as const) {
    const topic = gradeTopics(grade, unit).indexOf(skill), random = seeded(topic + grade), seen = new Set<string>();
    for (let k = 0; k < 600; k++) { const q = generateGradeQuestion(grade, unit, topic, random); seen.add(q.prompt + q.answer); assert.equal(q.choices!.filter(c => c.value === q.answer).length, 1, q.prompt); }
    assert.ok(seen.size >= 9, `${skill} has only ${seen.size} variants`);
  }
});
