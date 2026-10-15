import type { SchoolGrade } from './rules';

export type StoryActivityKind = 'bridge' | 'water' | 'cake';
export interface StoryActivity {
  kind: StoryActivityKind;
  grade: SchoolGrade;
  values: number[];
  hints: number;
  mistakes: number;
}
export interface StoryActivitySpec {
  kind: StoryActivityKind; title: string; task: string; groups: number; target: number;
  total: number; step: number; unit: string; hint: string; explanation: string;
}

export function activitySpec(chapter: number, grade: SchoolGrade): StoryActivitySpec {
  if (chapter === 0) {
    const groups = grade === 1 ? 2 : grade === 2 ? 3 : 4;
    const target = [3, 4, 6, 8, 9, 12][grade - 1], total = groups * target;
    return { kind: 'bridge', title: '편지 배달 다리', groups, target, total, step: 1, unit: '개',
      task: `판자 ${total}개를 다리 기둥 ${groups}곳에 똑같이 나누어 놓아요. 남는 판자가 없어야 해요.`,
      hint: '기둥마다 한 개씩 돌아가며 놓아 보세요. 어느 한 곳만 높아지지 않게 해요.',
      explanation: `${total}개를 ${groups}곳에 똑같이 나누면 한 곳에 ${target}개예요. ${groups} × ${target} = ${total}!` };
  }
  if (chapter === 1) {
    const step = grade <= 2 ? 1 : 250, target = grade <= 2 ? 6 : grade <= 4 ? 1500 : 2250;
    return { kind: 'water', title: '호수 물레방아', groups: 1, target, total: target + step * 3, step, unit: grade <= 2 ? '컵' : 'mL',
      task: grade <= 2 ? '물통에 물 6컵을 모아 물레방아를 돌려요. 한 번에 한 컵씩 넣거나 덜어낼 수 있어요.' : `물통에 정확히 ${target === 1500 ? '1 L 500 mL' : '2 L 250 mL'}를 채워요. 작은 컵 한 개는 250 mL예요.`,
      hint: grade <= 2 ? '컵을 넣을 때마다 하나, 둘 세어 보세요. 목표 눈금과 물높이를 비교해요.' : '1 L는 1000 mL예요. 컵 4개를 넣으면 1000 mL가 돼요. 목표까지 얼마나 더 필요할까요?',
      explanation: grade <= 2 ? '작은 컵 6개를 모아 물레방아가 돌기 시작했어요!' : `${step} mL × ${target / step} = ${target} mL예요. 물레방아가 돌기 시작했어요!` };
  }
  const groups = grade <= 2 ? 2 : 3, target = grade <= 2 ? 2 : grade <= 4 ? 2 : 3, total = groups * target;
  return { kind: 'cake', title: '별빛 나눔 잔치', groups, target, total, step: 1, unit: '조각',
    task: grade <= 2 ? `똑같은 케이크 ${total}조각을 친구 ${groups}명에게 똑같이 나누어 주세요.` : `케이크 한 개를 똑같이 ${total}조각으로 잘랐어요. 친구 ${groups}명에게 각각 케이크의 1/${groups}씩 나누어 주세요.`,
    hint: '가운데 남은 조각을 살펴보고 친구에게 한 조각씩 돌아가며 나누어 주세요. 모두 같은 양이어야 해요.',
    explanation: grade <= 2 ? `친구마다 ${target}조각씩 받았어요!` : `한 조각은 1/${total}이에요. ${target}조각은 ${target}/${total} = 1/${groups}이므로 친구마다 같은 양을 받았어요!` };
}
export function newActivity(chapter: number, grade: SchoolGrade): StoryActivity {
  const spec = activitySpec(chapter, grade);
  return { kind: spec.kind, grade, values: Array(spec.groups).fill(0), hints: 0, mistakes: 0 };
}
export function adjustActivity(activity: StoryActivity, chapter: number, group: number, direction: number): boolean {
  const spec = activitySpec(chapter, activity.grade);
  if (!Number.isInteger(group) || group < 0 || group >= spec.groups || ![-1, 1].includes(direction)) return false;
  const next = activity.values[group] + direction * spec.step;
  if (next < 0 || activity.values.reduce((a, b) => a + b, 0) + direction * spec.step > spec.total) return false;
  activity.values[group] = next; return true;
}
export function activitySolved(activity: StoryActivity, chapter: number): boolean {
  const spec = activitySpec(chapter, activity.grade);
  return activity.kind === spec.kind && activity.values.length === spec.groups && activity.values.every(value => value === spec.target);
}
export function validActivity(value: unknown, chapter: number): value is StoryActivity {
  if (!value || typeof value !== 'object') return false;
  const a = value as StoryActivity;
  if (!Number.isInteger(a.grade) || a.grade < 1 || a.grade > 6) return false;
  const spec = activitySpec(chapter, a.grade);
  return a.kind === spec.kind && Array.isArray(a.values) && a.values.length === spec.groups && a.values.every(v => Number.isSafeInteger(v) && v >= 0 && v % spec.step === 0) && a.values.reduce((x, y) => x + y, 0) <= spec.total && [a.hints, a.mistakes].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 100000);
}
