import { generateGradeQuestion } from '../../src/grade-content';
import { generateCurriculumQuestion } from '../../src/curriculum';
// 사용법: npx tsx scripts/review/uniq.ts <학년> — 숫자를 지운 문제 문장을 중복 없이 모두 보여 줘요.
const g = Number(process.argv[2]);
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const seen = new Map<string, string>();
for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 120; k++) {
  const q: any = g === 3 ? generateCurriculumQuestion(u, m % 10, rnd) : generateGradeQuestion(g as any, u, m, rnd);
  const key = q.skill + '|' + q.prompt.replace(/[\d.,]+/g, '#');
  if (!seen.has(key)) seen.set(key, `${q.skill}| ${q.prompt} | ${q.kind === 'choice' ? q.choices.map((c: any) => c.label).join('/') : 'N'} => ${q.answer} | H1: ${q.hints?.[0]} | H3: ${q.hints?.[2]} | ${q.explanation}`);
}
console.log(seen.size);
for (const v of seen.values()) console.log(v);
