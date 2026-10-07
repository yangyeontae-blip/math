import { generateGradeQuestion } from '../../src/grade-content';
import { generateCurriculumQuestion } from '../../src/curriculum';
// 숫자 정답이 문제 문장에 그대로 적혀 있는 경우를 찾아요. (예: "자의 눈금이 16을 가리켜요. 길이는 몇 cm?")
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 77; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const found = new Map<string, string>();
for (const g of [1, 2, 3, 4, 5, 6]) for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 60; k++) {
  const q: any = g === 3 ? generateCurriculumQuestion(u, m % 10, rnd) : generateGradeQuestion(g as any, u, m, rnd);
  if (q.kind !== 'number') continue;
  const re = new RegExp(`(^|[^\d.,])${String(q.answer).replace('.', '\.')}([^\d.,]|$)`);
  if (String(q.answer).length >= 2 && re.test(q.prompt)) { const key = `g${g} ${q.skill}`; if (!found.has(key)) found.set(key, `${q.prompt} => ${q.answer}`); }
}
for (const [k, v] of found) console.log(k, '|', v);
