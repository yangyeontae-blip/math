import { generateGradeQuestion } from '../../src/grade-content';
// 사용법: npx tsx scripts/review/visuals.ts <학년> — 문제 유형마다 그림 종류와 예시를 보여 줘요.
const g = Number(process.argv[2]);
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const seen = new Map<string, string>();
for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 40; k++) {
  const q: any = generateGradeQuestion(g as any, u, m, rnd), v = q.visual;
  const key = q.skill + '|' + v.kind;
  if (!seen.has(key)) seen.set(key, `${q.skill} [${v.kind}${v.shape ? ':' + v.shape : ''}] ${Array.isArray(v.rows) ? v.rows.map((r: any) => r.label + '=' + r.icons).join(',') : v.values ? v.values.join(',') + (v.labels ? ' ' + v.labels.join('/') : '') : ''} || ${q.prompt.slice(0, 60)}`);
}
for (const v of seen.values()) console.log(v);
