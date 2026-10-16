import { journeyFor, operationsForGrade, type Save, type SchoolGrade } from './rules';

export const FIELD_FORESTS = ['subtraction', 'multiplication', 'division'] as const;
export type FieldForest = typeof FIELD_FORESTS[number];
export interface ForestWork { done: number[]; values: number[][]; drafts: string[] }
export type ForestActivities = Record<FieldForest, ForestWork>;
export const FIELD_SPOTS = [{ x: 0, z: 17 }, { x: 0, z: 6 }, { x: 0, z: -6 }];
export const FIELD_INFO = {
  subtraction: { icon: '🌿', title: '가시덩굴 오솔길', place: '가시 길', verb: '가시 걷기', ending: '가시를 정리한 길 끝에 초록 쉼터가 열렸어요!', intro: '정해진 수만큼 가시를 직접 골라 걷고 남은 수를 알아보세요. 세 길을 정리하면 숲속 쉼터로 이어져요.' },
  multiplication: { icon: '🌼', title: '꽃발판 정원', place: '꽃 발판', verb: '꽃 줄 심기', ending: '같은 수의 꽃이 모여 꽃발판 정원과 꽃문이 완성됐어요!', intro: '한 줄에 같은 수의 꽃을 심어 발판을 만들어요. 줄마다 꽃을 심고 전체 꽃 수를 알아보세요.' },
  division: { icon: '💧', title: '물방울 나눔 수로', place: '나눔 수로', verb: '물 나누기', ending: '모든 수로에 물이 똑같이 흘러 숲속 물레방아에 물이 도착했어요!', intro: '한정된 물을 여러 수로에 똑같이 보내요. 세 수로를 완성하면 숲속 물레방아에 물이 도착해요.' },
} as const;
export function emptyForestActivities(): ForestActivities {
  const empty = (): ForestWork => ({ done: [], values: [[], [], []], drafts: ['', '', ''] });
  return { subtraction: empty(), multiplication: empty(), division: { ...empty(), values: [Array(3).fill(0), Array(4).fill(0), Array(5).fill(0)] } };
}
export function fieldSpec(forest: FieldForest, grade: SchoolGrade, step: number) {
  const pair = forest === 'subtraction'
    ? (grade === 1 ? [[7, 2], [9, 3], [8, 4]] : grade === 2 ? [[12, 5], [15, 7], [18, 9]] : [[18, 7], [24, 9], [30, 12]])[step]
    : forest === 'multiplication' ? [[2, 3], [3, 4], [4, grade === 2 ? 3 : 5]][step]
    : (grade <= 3 ? [[12, 3], [16, 4], [20, 5]] : [[18, 3], [24, 4], [30, 5]])[step];
  if (!pair) throw new Error('없는 숲 활동이에요.');
  const [a, b] = pair, answer = forest === 'subtraction' ? a - b : forest === 'multiplication' ? a * b : a / b;
  const equation = forest === 'multiplication' ? `${b} × ${a}` : `${a} ${forest === 'subtraction' ? '−' : '÷'} ${b}`;
  const prompt = forest === 'subtraction' ? `가시 ${a}개 중 ${b}개를 걷으면 남는 가시는 몇 개일까요?`
    : forest === 'multiplication' ? `한 줄에 꽃 ${b}송이씩 ${a}줄을 심으면 꽃은 모두 몇 송이일까요?`
    : `물 ${a}컵을 수로 ${b}개에 똑같이 보내면 한 수로에 몇 컵씩 갈까요?`;
  return { a, b, answer, equation, prompt };
}
export function fieldHere(s: Save): s is Save & { forest: FieldForest } {
  return FIELD_FORESTS.includes(s.forest as FieldForest) && operationsForGrade(s.grade).includes(s.forest) && journeyFor(s).stage === 1 && !s.room.inside && !s.expedition.active;
}
export function fieldReady(forest: FieldForest, grade: SchoolGrade, step: number, values: number[]) {
  const { a, b } = fieldSpec(forest, grade, step);
  return forest === 'subtraction' ? values.length === b : forest === 'multiplication' ? values.length === a : values.length === b && values.every(n => n === a / b);
}
export function changeForestWork(s: Save, step: number, slot: number, delta = 1) {
  if (!fieldHere(s) || !Number.isInteger(step) || step < 0 || step > 2 || !Number.isInteger(slot) || ![1, -1].includes(delta)) return false;
  const forest = s.forest, work = s.forestActivities[forest];
  if (step !== work.done.length) return false;
  const { a, b } = fieldSpec(forest, s.grade, step), values = work.values[step];
  if (forest === 'division') {
    const total = values.reduce((sum, n) => sum + n, 0);
    if (slot === -1) { if (delta !== 1 || total + b > a) return false; values.forEach((_, i) => values[i]++); }
    else { if (slot < 0 || slot >= b || values[slot] + delta < 0 || total + delta > a) return false; values[slot] += delta; }
  } else {
    if (slot < 0 || slot >= a) return false;
    const index = values.indexOf(slot); if (index < 0) values.push(slot); else values.splice(index, 1);
  }
  return true;
}
export function finishForestWork(s: Save, step: number) {
  if (!fieldHere(s) || !Number.isInteger(step) || step < 0 || step > 2) return false;
  const work = s.forestActivities[s.forest], spec = fieldSpec(s.forest, s.grade, step);
  if (step !== work.done.length || !fieldReady(s.forest, s.grade, step, work.values[step]) || !/^\d{1,3}$/.test(work.drafts[step]) || Number(work.drafts[step]) !== spec.answer) return false;
  work.done.push(step); return true;
}
export function validForestActivities(value: unknown, grade: SchoolGrade): value is ForestActivities {
  if (!value || typeof value !== 'object') return false;
  const data = value as ForestActivities, int = (n: unknown, max: number) => Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= max;
  return FIELD_FORESTS.every(forest => {
    const w = data[forest];
    if (!w || !Array.isArray(w.done) || w.done.length > 3 || !w.done.every((n, i) => n === i)
      || !Array.isArray(w.values) || w.values.length !== 3 || !Array.isArray(w.drafts) || w.drafts.length !== 3 || !w.drafts.every(v => typeof v === 'string' && /^\d{0,3}$/.test(v))) return false;
    return w.values.every((values, step) => {
      if (!Array.isArray(values)) return false;
      const { a, b, answer } = fieldSpec(forest, grade, step);
      const valid = forest === 'division' ? values.length === b && values.every(n => int(n, a)) && values.reduce((sum, n) => sum + n, 0) <= a
        : values.length <= a && values.every(n => int(n, a - 1)) && new Set(values).size === values.length;
      return valid && (step <= w.done.length || (forest === 'division' ? values.every(n => n === 0) : values.length === 0))
        && (!w.done.includes(step) || (fieldReady(forest, grade, step, values) && Number(w.drafts[step]) === answer));
    });
  });
}
