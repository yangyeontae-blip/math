import { generateGradeQuestion } from '../../src/grade-content';
import { generateCurriculumQuestion, curriculumWrongFeedback } from '../../src/curriculum';
// 오답을 골랐을 때 나오는 말을 종류별로 보여 줘요.
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const seen = new Map<string, string>();
for (const g of [1, 2, 3, 4, 5, 6]) for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 6; k++) {
  const q: any = g === 3 ? generateCurriculumQuestion(u, m % 10, rnd) : generateGradeQuestion(g as any, u, m, rnd);
  const wrong = q.kind === 'choice' ? q.choices.find((c: any) => c.value !== q.answer)?.value : String(Number(q.answer) + 1);
  if (wrong === undefined) continue;
  const fb = curriculumWrongFeedback(q, wrong);
  const key = q.visual.kind + '|' + fb.replace(/[\d.,/]+/g, '#').replace(/“[^”]*”/g, '“…”').slice(0, 60);
  if (!seen.has(key)) seen.set(key, `g${g} ${q.skill} [${q.visual.kind}] ${q.prompt.slice(0, 50)} → ${wrong}\n      ${fb}`);
}
for (const v of seen.values()) console.log(v);
console.log(seen.size);
