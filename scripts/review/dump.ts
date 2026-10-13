import { generateGradeQuestion } from '../../src/grade-content';
const g = Number(process.argv[2]) as 1 | 2; const filter = process.argv[3] ?? '';
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 11 + g; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const u of units) for (let m = 0; m < 10; m++) for (let k = 0; k < 3; k++) {
  const q: any = generateGradeQuestion(g, u, m, rnd);
  const vv = q.visual, v = vv.kind === 'scene' ? `[scene:${vv.items.map((i: any) => i.icon + (i.label ?? '')).join(' ')}]` : vv.kind === 'none' ? '[none]' : `[${vv.kind}${vv.shape ? ':' + vv.shape : ''}${vv.end ? ':' + vv.end : ''}${Array.isArray(vv.rows) ? ':' + vv.rows.map((r: any) => r.label + '=' + r.icons).join(',') + ':' + vv.unitLabel : ''}]`;
  const line = `${u[0]}${m} ${q.skill}|${q.prompt} ${v}|${q.kind === 'choice' ? q.choices.map((c: any) => c.label).join('/') : 'N'}=>${q.answer}|${q.explanation}`;
  if (!filter || line.includes(filter)) console.log(line);
}
