import { generateGradeQuestion } from '../../src/grade-content';
const units = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'] as const;
let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const flags = new Map<string, string>();
const add = (k: string, ex: string) => { if (!flags.has(k)) flags.set(k, ex); };
for (const g of [1, 2] as const) for (const u of units) for (let m = 0; m < 20; m++) for (let k = 0; k < 150; k++) {
  const q: any = generateGradeQuestion(g, u, m, rnd);
  const tag = `g${g} ${u}#${m % 10} ${q.skill}`;
  const labels: string[] = q.kind === 'choice' ? q.choices.map((c: any) => c.label) : [];
  if (q.kind === 'choice') {
    if (!labels.includes(q.answer)) add('answer-not-in-choices ' + tag, q.prompt);
    if (new Set(labels).size !== labels.length) add('dup-choices ' + tag, q.prompt + ' ' + labels);
    if (labels.length < 2) add('few-choices ' + tag, q.prompt);
    if (q.prompt.includes(q.answer) && q.answer.length >= 2) add('leak ' + tag, `${q.prompt} => ${q.answer}`);
    if (g === 1 && labels.some(l => /^\d+$/.test(l) && Number(l) > 100)) add('big-number-choice ' + tag, q.prompt + ' ' + labels);
    if (labels.some(l => /(?:^| )0분/.test(l) || /시 0분/.test(l))) add('zero-min ' + tag, labels.join('/'));
    if (labels.some(l => /(^|\D)-\d/.test(l))) add('negative-choice ' + tag, labels.join('/'));
  } else {
    if (!/^\d+$/.test(q.answer)) add('answer-format ' + tag, q.prompt + ' => ' + q.answer);
  }
  const text = q.prompt + ' ' + q.explanation + ' ' + (q.hints ?? []).join(' ');
  if (/시 0분/.test(text)) add('zero-min-text ' + tag, text.slice(0, 120));
  if (/undefined|NaN|\[object/.test(text)) add('bad-text ' + tag, text.slice(0, 120));
  if (/\d(가|이)\s?(있|모두)/.test(q.prompt) === false && /([0-9])이가|이이에요/.test(text)) add('particle ' + tag, text.slice(0, 120));
  if ((q.hints ?? []).length < 3) add('few-hints ' + tag, q.prompt);
  if (q.hints && new Set(q.hints).size !== q.hints.length) add('dup-hints ' + tag, q.prompt);
  if (q.explanation && q.prompt.endsWith('?') === false && false) add('x', '');
  if (q.visual.kind === 'pictograph') for (const r of q.visual.rows) if (r.icons > 30 || r.icons < 0) add('icon-count ' + tag, `${r.label}=${r.icons}`);
}
for (const [k, v] of flags) console.log(k, '|', v);
console.log('flag kinds:', flags.size);
