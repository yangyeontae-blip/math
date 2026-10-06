import { generateGradeQuestion } from '../../src/grade-content';
import { generateCurriculumQuestion } from '../../src/curriculum';
import { ye } from '../../src/grade-helpers';
// 사용법: npx tsx scripts/review/scan.ts [학년들, 예: 3,4,5,6]
const grades = (process.argv[2] ?? '1,2,3,4,5,6').split(',').map(Number);
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const flags = new Map<string, string>();
const add = (k: string, ex: string) => { if (!flags.has(k)) flags.set(k, ex); };
const gen = (g: number, u: any, m: number): any => g === 3 ? generateCurriculumQuestion(u, m % 10, rnd) : generateGradeQuestion(g as any, u, m, rnd);
for (const g of grades) for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 120; k++) {
  let q: any; try { q = gen(g, u, m); } catch (e) { add(`throw g${g} ${u}#${m}`, String(e)); continue; }
  const tag = `g${g} ${u}#${m % 10} ${q.skill}`;
  const labels: string[] = q.kind === 'choice' ? q.choices.map((c: any) => c.label) : [];
  const text = q.prompt + ' ' + q.explanation + ' ' + (q.hints ?? []).join(' ');
  if (q.kind === 'choice') {
    if (!q.choices.some((c: any) => c.value === q.answer)) add('answer-not-in-choices ' + tag, q.prompt);
    if (new Set(labels).size !== labels.length) add('dup-choices ' + tag, q.prompt + ' ' + labels);
    if (labels.length < 2) add('few-choices ' + tag, q.prompt);
    if (labels.some(l => /(^|\D)-\d/.test(l))) add('negative-choice ' + tag, labels.join('/'));
  } else if (!/^\d+(\.\d+)?$/.test(q.answer)) add('answer-format ' + tag, q.prompt + ' => ' + q.answer);
  if (/시 0분/.test(text)) add('zero-min ' + tag, text.slice(0, 120));
  if (/undefined|NaN|\[object|Infinity/.test(text)) add('bad-text ' + tag, text.slice(0, 120));
  for (const m of text.matchAll(/(\d+(?: \d+)?\/\d+|[\d.]+)(이에요|예요)/g)) if (ye(m[1]) !== m[2]) add('particle-ye ' + tag, m[0] + ' in ' + text.slice(0, 100));
  if (/이이에요|가가 |를를|은은/.test(text)) add('particle ' + tag, text.slice(0, 140));
  if ((q.hints ?? []).length < 3) add('few-hints ' + tag, q.prompt);
  if (q.hints && new Set(q.hints).size !== q.hints.length) add('dup-hints ' + tag, q.prompt);
  // 1단계 힌트가 곧바로 정답을 말해 주는지 (숫자 정답이 2글자 이상일 때)
  const first = (q.hints ?? [])[0] ?? '';
  if (q.kind === 'number' && String(q.answer).length >= 2 && new RegExp(`(^|\D)${String(q.answer).replace('.', '\.')}(\D|$)`).test(first) && !q.prompt.includes(q.answer)) add('hint1-leaks-answer ' + tag, `${first} => ${q.answer}`);
  if (q.kind === 'choice' && q.answer.length >= 2 && first.includes(q.answer) && !q.prompt.includes(q.answer)) add('hint1-leaks-choice ' + tag, `${first} => ${q.answer}`);
  if (q.kind === 'choice' && q.answer.length >= 2 && q.prompt.includes(q.answer)) add('prompt-leaks-choice ' + tag, `${q.prompt} => ${q.answer}`);
  if (q.visual?.kind === 'pictograph') for (const r of q.visual.rows) if (r.icons > 30 || r.icons < 0) add('icon-count ' + tag, `${r.label}=${r.icons}`);
}
for (const [k, v] of flags) console.log(k, '|', v);
console.log('flag kinds:', flags.size);
