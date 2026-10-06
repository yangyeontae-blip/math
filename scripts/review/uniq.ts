import { generateGradeQuestion } from '../../src/grade-content';
const g = Number(process.argv[2]) as 1 | 2;
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const seen = new Map<string, string>();
for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 120; k++) {
  const q: any = generateGradeQuestion(g, u, m, rnd);
  const key = q.skill + '|' + q.prompt.replace(/\d+/g, '#').replace(/[가-힣]+(?=\s*(앞|뒤))/g, 'X');
  if (!seen.has(key)) seen.set(key, `${q.skill}| ${q.prompt} | ${q.kind === 'choice' ? q.choices.map((c: any) => c.label).join('/') : 'N'} => ${q.answer} | ${q.explanation}`);
}
console.log(seen.size);
for (const v of seen.values()) console.log(v);
