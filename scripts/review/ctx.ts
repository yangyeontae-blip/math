// 사용법: npx tsx scripts/review/ctx.ts <학년> <단원> <미션> <찾을 글자> — 해당 글자가 들어간 문제를 통째로 보여 줘요.
import { generateGradeQuestion } from '../../src/grade-content';
import { generateCurriculumQuestion } from '../../src/curriculum';
const [g, u, m, needle] = [Number(process.argv[2]), process.argv[3], Number(process.argv[4]), process.argv[5] ?? ''];
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 400; i++) {
  const q: any = g === 3 ? generateCurriculumQuestion(u as any, m, rnd) : generateGradeQuestion(g as any, u as any, m, rnd);
  const text = JSON.stringify(q);
  if (text.includes(needle)) { console.log(JSON.stringify({ prompt: q.prompt, answer: q.answer, choices: q.choices?.map((c: any) => c.label), hints: q.hints, explanation: q.explanation }, null, 1)); break; }
}
