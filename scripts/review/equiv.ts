import { generateGradeQuestion } from '../../src/grade-content';
import { generateCurriculumQuestion } from '../../src/curriculum';
// 보기 중에 값이 같은 것(예: 1/2과 2/4, 0.5와 0.50)이 둘 이상 있는 문제를 찾아요.
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 123; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const parse = (s: string): number | null => {
  const t = s.replace(/,/g, '').trim(); let m: RegExpMatchArray | null;
  if ((m = t.match(/^(\d+) (\d+)\/(\d+)$/))) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  if ((m = t.match(/^(\d+)\/(\d+)$/))) return Number(m[1]) / Number(m[2]);
  if ((m = t.match(/^(\d+(?:\.\d+)?)(%|°| ?[a-zA-Z²³]+| ?배)?$/))) return Number(m[1]);
  return null;
};
const found = new Map<string, string>();
for (const g of [1, 2, 3, 4, 5, 6]) for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 80; k++) {
  const q: any = g === 3 ? generateCurriculumQuestion(u, m % 10, rnd) : generateGradeQuestion(g as any, u, m, rnd);
  if (q.kind !== 'choice') continue;
  const vals = q.choices.map((c: any) => parse(c.label)); if (vals.some((v: any) => v === null)) continue;
  const key = vals.map((v: number) => Math.round(v * 1e6)); if (new Set(key).size !== key.length) { const k2 = `g${g} ${q.skill}`; if (!found.has(k2)) found.set(k2, `${q.prompt} :: ${q.choices.map((c: any) => c.label).join(' / ')}`); }
}
for (const [k, v] of found) console.log(k, '|', v);
console.log('equivalent-choice kinds:', found.size);
