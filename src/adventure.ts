import { validTool, type LearningTool } from './learning-tools';
import { formatScaled, operationsForGrade, questionAnswerText, type Question, type CurriculumMistake, type CurriculumUnitId, type Save, type SchoolGrade } from './rules';
import type { CurriculumQuestion } from './curriculum';

export const VILLAGE_PROJECTS = [
  { name: '우리 마을 꽃밭', icon: '🌷', result: '줄과 칸을 맞춘 꽃밭이 마을 남쪽에 피었어요.' },
  { name: '숲 친구 산책길', icon: '🪨', result: '일정한 간격의 디딤돌 길이 꽃밭 옆에 생겼어요.' },
  { name: '함께 나누는 축제', icon: '🧺', result: '친구들이 함께 쓰는 나눔 식탁이 마을에 생겼어요.' },
] as const;
export interface VillageDesign { grade: SchoolGrade; rows: number; color: number; curved: boolean; baskets: number }
export interface VillageWork { project: number; grade: SchoolGrade; values: number[]; design: VillageDesign; editing: boolean }
export function defaultDesign(grade: SchoolGrade): VillageDesign { return { grade, rows: projectSpec(0, grade).rows, color: 0, curved: true, baskets: projectSpec(2, grade).groups }; }
export function designOptions(project: number, grade: SchoolGrade) {
  const spec = projectSpec(project, grade), total = project === 0 ? spec.target : spec.max;
  return Array.from({ length: project === 0 ? 6 : 4 }, (_, i) => i + 1).filter(n => total % n === 0 && (project === 0 ? total / n <= 12 : n >= 2 && (grade > 2 || n === 2)));
}
export function workSpec(work: VillageWork) {
  const spec = projectSpec(work.project, work.grade);
  if (work.project === 0) { spec.rows = work.design.rows; spec.columns = spec.target / spec.rows; spec.task = `꽃 ${spec.target}송이로 ${spec.rows}줄의 꽃밭을 만들어요. 한 줄의 칸을 세며 꽃을 놓아 보세요.`; spec.explanation = `${spec.rows}줄에 ${spec.columns}송이씩, 모두 ${spec.target}송이로 꽃밭을 만들었어요.`; }
  if (work.project === 2) { spec.groups = work.design.baskets; spec.target = spec.max / spec.groups; spec.task = `과일 ${spec.max}개를 ${spec.groups}개의 바구니에 똑같이 나누어요. 남는 과일이 없어야 해요.`; spec.explanation = `${spec.groups}개의 바구니에 ${spec.target}개씩 똑같이 나누었어요.`; }
  return spec;
}
export function redesignProject(s: Save, id: number) {
  if (!s.adventure.completed.includes(id) || s.adventure.active) return false;
  const design = structuredClone(s.adventure.designs[id]), work: VillageWork = { project: id, grade: design.grade, design, editing: true, values: [] };
  const spec = workSpec(work); work.values = Array(spec.groups).fill(spec.target); s.adventure.active = work; return true;
}
export function changeDesign(s: Save, field: 'rows' | 'color' | 'curved' | 'baskets', value: number | boolean) {
  const work = s.adventure.active; if (!work) return false;
  if (field === 'rows' && work.project === 0 && typeof value === 'number' && designOptions(0, work.grade).includes(value)) work.design.rows = value;
  else if (field === 'color' && work.project === 0 && Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 2) work.design.color = Number(value);
  else if (field === 'curved' && work.project === 1 && typeof value === 'boolean') work.design.curved = value;
  else if (field === 'baskets' && work.project === 2 && typeof value === 'number' && designOptions(2, work.grade).includes(value)) {
    const old = work.values, count = value, total = old.reduce((a, b) => a + b, 0);
    work.design.baskets = count; work.values = Array(count).fill(0);
    // Preserve every fruit when changing the number of baskets, without solving the distribution.
    for (let i = 0; i < total; i++) work.values[0]++;
  } else return false;
  return true;
}
export function moveFruit(s: Save, from: number, to: number) {
  const w = s.adventure.active;
  if (!w || w.project !== 2 || from === to || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= w.values.length || to >= w.values.length || w.values[from] === 0) return false;
  w.values[from]--; w.values[to]++; return true;
}
export interface AdventureProgress { completed: number[]; active: VillageWork | null; recovered: string[]; designs: VillageDesign[]; tool: LearningTool | null }
export const emptyAdventure = (grade: SchoolGrade = 3): AdventureProgress => ({ completed: [], active: null, recovered: [], designs: Array.from({ length: 3 }, () => defaultDesign(grade)), tool: null });

export function projectSpec(project: number, grade: SchoolGrade) {
  if (project === 0) {
    const rows = grade <= 2 ? 2 : grade <= 4 ? 3 : 4, columns = grade === 1 ? 3 : grade <= 3 ? 4 : grade <= 5 ? 5 : 6;
    return { rows, columns, groups: 1, target: rows * columns, max: rows * columns + 6, step: 1, unit: '송이',
      task: `${rows}줄에 한 줄마다 ${columns}송이씩 꽃을 심어요. 꽃이 모두 몇 송이 필요할까요?`,
      hint: '한 줄씩 꽃을 세고, 다음 줄까지 이어서 세어 보세요. 같은 수를 여러 번 더해도 좋아요.',
      explanation: `${rows}줄에 ${columns}송이씩이므로 모두 ${rows * columns}송이예요.` };
  }
  if (project === 1) {
    const target = grade <= 2 ? 8 : grade <= 4 ? 6 : grade === 5 ? 12 : 20;
    const step = grade <= 2 ? 1 : grade <= 4 ? 2 : grade === 5 ? 1.5 : .75;
    return { rows: 1, columns: target, groups: 1, target, max: target + 6, step, unit: '개',
      task: `길의 길이는 ${target * step} m예요. 디딤돌 한 개로 ${step} m를 이어요. 빈틈없이 이으려면 몇 개가 필요할까요?`,
      hint: `디딤돌을 하나 더할 때 길이 ${step} m 길어져요. 만든 길이와 목표 길이를 비교해요.`,
      explanation: `${target}개를 이어 ${target * step} m 길을 완성했어요.` };
  }
  const groups = grade <= 2 ? 2 : grade <= 4 ? 3 : 4, target = grade <= 2 ? 3 : grade <= 4 ? 4 : 5;
  return { rows: groups, columns: target, groups, target, max: target * groups, step: 1, unit: '개',
    task: `축제 과일 ${groups * target}개를 ${groups}개의 바구니에 똑같이 나누어요. 남는 과일이 없어야 해요.`,
    hint: '바구니마다 하나씩 돌아가며 넣어요. 너무 많으면 − 버튼으로 되돌릴 수 있어요.',
    explanation: `${groups}개의 바구니에 ${target}개씩 나누었어요. 모두 같은 양이에요!` };
}
export function beginProject(s: Save, project: number) {
  if (!Number.isInteger(project) || project < 0 || project >= VILLAGE_PROJECTS.length || s.adventure.active || s.adventure.completed.includes(project)) return false;
  if (project > 0 && !s.adventure.completed.includes(project - 1)) return false;
  const spec = projectSpec(project, s.grade);
  s.adventure.active = { project, grade: s.grade, values: Array(spec.groups).fill(0), design: structuredClone(s.adventure.designs[project]), editing: false }; return true;
}
export function adjustProject(s: Save, group: number, direction: number) {
  const work = s.adventure.active; if (!work || !Number.isInteger(group) || group < 0 || group >= work.values.length || ![-1, 1].includes(direction)) return false;
  const spec = workSpec(work), next = work.values[group] + direction;
  if (next < 0 || next > spec.max || (spec.groups > 1 && work.values.reduce((a, b) => a + b, 0) + direction > spec.max)) return false;
  work.values[group] = next; return true;
}
export function finishProject(s: Save) {
  const work = s.adventure.active; if (!work) return false;
  const spec = workSpec(work);
  if (work.values.length !== spec.groups || !work.values.every(value => value === spec.target)) return false;
  if (!s.adventure.completed.includes(work.project)) s.adventure.completed.push(work.project);
  s.adventure.designs[work.project] = structuredClone(work.design);
  s.adventure.active = null; return true;
}
export function validAdventure(value: unknown): value is AdventureProgress {
  if (!value || typeof value !== 'object') return false;
  const a = value as AdventureProgress;
  if (!Array.isArray(a.completed) || a.completed.length > 3 || a.completed.some((id, index) => id !== index)) return false;
  if (!Array.isArray(a.recovered) || a.recovered.length > 30 || new Set(a.recovered).size !== a.recovered.length || a.recovered.some(key => typeof key !== 'string' || key.length < 1 || key.length > 160)) return false;
  if (!Array.isArray(a.designs) || a.designs.length !== 3 || !a.designs.every(validDesign) || (a.tool !== null && !validTool(a.tool))) return false;
  if (a.active === null) return true;
  const work = a.active;
  if (!work || !Number.isInteger(work.project) || (!work.editing && work.project !== a.completed.length) || (work.editing && !a.completed.includes(work.project)) || work.project < 0 || work.project > 2 || !Number.isInteger(work.grade) || work.grade < 1 || work.grade > 6) return false;
  if (!validDesign(work.design) || work.design.grade !== work.grade || typeof work.editing !== 'boolean') return false;
  const spec = workSpec(work);
  return Array.isArray(work.values) && work.values.length === spec.groups && work.values.every(v => Number.isSafeInteger(v) && v >= 0 && v <= spec.max) && (spec.groups === 1 || work.values.reduce((x, y) => x + y, 0) <= spec.max);
}

export type AdventureChoice = { kind: 'guide'; guide: 'berry' | 'monster' | 'shop' | 'roomExit' | 'village' | 'next'; title: string; detail: string }
  | { kind: 'story' | 'review' | 'calculation' | 'project' | 'region' | 'expedition'; title: string; detail: string; unit?: CurriculumUnitId };
/** 진행 중인 활동을 우선하고, 현재 이용할 수 있는 다음 한 걸음을 고릅니다. */
export function recommendAdventure(s: Save, regions: readonly { id: CurriculumUnitId; name: string }[], allowed: (id: string) => boolean = () => true): AdventureChoice {
  if (s.room.inside) return { kind: 'guide', guide: 'roomExit', title: '마을로 나가 볼까요?', detail: '방의 문까지 길을 안내할게요.' };
  if (s.expedition.active) return { kind: 'expedition', title: '이어 하던 별빛 원정', detail: '진행 중인 원정을 먼저 이어 가요.' };
  if (s.story.active) return { kind: 'story', title: '이어 하던 숲속 편지', detail: '모아 둔 단서에서 계속할 수 있어요.' };
  if (s.adventure.active) return { kind: 'project', title: VILLAGE_PROJECTS[s.adventure.active.project].name, detail: '만들던 모습이 저장되어 있어요. 이어서 완성해요.' };
  if (!s.tutorial.collected) return { kind: 'guide', guide: 'berry', title: '첫걸음 · 베리 하나 줍기', detail: '방향키나 조이스틱으로 걸어가요. 안내 화살표를 따라가 보세요.' };
  if (!s.tutorial.battle) return { kind: 'guide', guide: 'monster', title: '숲 친구와 첫 수학 시합', detail: '친구 가까이에서 대화해요. 틀려도 모험은 계속할 수 있어요.' };
  if (!s.tutorial.shop) return { kind: 'guide', guide: 'shop', title: '내 모험가를 꾸며 볼까요?', detail: '상점을 구경해요. 구매하지 않고 돌아와도 괜찮아요.' };
  const mistake = s.curriculum.wrongSkills.find(m => regions.some(r => r.id === m.unit) && allowed(m.unit));
  if (mistake) return { kind: 'review', unit: mistake.unit, title: `${mistake.skill} 다시 만나기`, detail: '도움받기 → 다시 풀기 → 새 문제에 적용하기, 세 걸음으로 도전해요.' };
  if (s.learning.wrongQuestions.some(q => operationsForGrade(s.grade).includes(q.operation ?? 'division'))) return { kind: 'calculation', title: '다시 풀면 달라지는 계산', detail: '그림과 함께 계산을 살피고, 다른 상황에도 써 봐요.' };
  if (s.adventure.completed.length < 3) return { kind: 'project', title: VILLAGE_PROJECTS[s.adventure.completed.length].name, detail: '수학으로 마을에 오래 남을 새 장소를 만들어요.' };
  const next = regions.find(r => allowed(r.id) && s.curriculum.units[r.id].completedMissions.length < 10);
  if (next) return { kind: 'region', unit: next.id, title: `${next.name}의 다음 모험`, detail: '열린 단계에서 새로운 개념을 만나 봐요.' };
  return { kind: 'story', title: '숲속 편지를 다시 펼쳐요', detail: '마을 친구와 함께했던 이야기를 다시 만나요.' };
}

export const RECOVERY_STEPS = ['도움받아 살펴보기', '다른 문제 풀어 보기', '새 상황에 적용하기'] as const;
export function transferQuestion(question: CurriculumQuestion): CurriculumQuestion {
  const q = structuredClone(question), v = q.visual;
  if (v.kind === 'array' && Number(q.answer) === v.rows * v.columns) q.prompt = `축제 꽃을 ${v.rows}줄에 한 줄마다 ${v.columns}송이씩 심어요. 모두 몇 송이일까요?`;
  else if (v.kind === 'fraction' && v.compare && /더 큰/.test(q.prompt)) q.prompt = `같은 크기의 축제 케이크에서 한 접시에는 ${v.numerator}/${v.denominator}, 다른 접시에는 ${v.compare.numerator}/${v.compare.denominator}만큼 담았어요. 더 많이 담은 쪽의 분수는 무엇일까요?`;
  else if (v.kind === 'fraction' && !v.compare && q.answer === `${v.numerator}/${v.denominator}`) q.prompt = `축제 케이크를 똑같이 ${v.denominator}조각으로 나누고 ${v.numerator}조각을 접시에 담았어요. 전체 케이크의 얼마를 담았나요?`;
  else if (v.kind === 'circle' && v.focus === 'given-radius' && Number(q.answer) === v.radius * 2) q.prompt = `둥근 꽃밭의 반지름은 ${v.radius} ${v.unit ?? 'cm'}예요. 중심을 지나 꽃밭 끝에서 끝까지 이을 리본은 몇 ${v.unit ?? 'cm'}가 필요할까요?`;
  else if (v.kind === 'circle' && v.focus === 'given-diameter' && Number(q.answer) === v.radius) q.prompt = `둥근 축제 장식의 지름은 ${v.radius * 2} ${v.unit ?? 'cm'}예요. 중심에서 가장자리까지의 길이는 몇 ${v.unit ?? 'cm'}일까요?`;
  else if (v.kind === 'pictograph' && Number(q.answer) === v.rows.reduce((sum, row) => sum + row.icons * v.value, 0)) q.prompt = `숲 축제에 가져갈 물건을 그림으로 나타냈어요. ${v.icon} 하나는 ${v.value}${v.unitLabel}예요. 그림 속 물건은 모두 몇 ${v.unitLabel}일까요?`;
  return q;
}
/** 문제의 개념을 유지합니다. 일치하는 변형이 없으면 원문으로 돌아가 다른 개념을 지웠다고 기록하지 않습니다. */
export function recoveryQuestions(mistake: CurriculumMistake, factory: (mission: number) => CurriculumQuestion): CurriculumQuestion[] {
  const pool: CurriculumQuestion[] = [];
  for (let attempt = 0; attempt < 72; attempt++) {
    const q = factory(attempt < 24 ? Math.min(8, mistake.mission) : attempt % 9);
    if (q.unit === mistake.unit && q.skill === mistake.skill && !pool.some(p => p.prompt === q.prompt && p.answer === q.answer)) pool.push(q);
    if (pool.length === 3) break;
  }
  if (!pool.length) return [];
  return Array.from({ length: 3 }, (_, index) => index === 2 ? transferQuestion(pool[index % pool.length]) : structuredClone(pool[index % pool.length]));
}
export function markRecovered(s: Save, unit: CurriculumUnitId, skill: string) {
  const key = `${unit}:${skill}`;
  s.adventure.recovered = [key, ...s.adventure.recovered.filter(item => item !== key)].slice(0, 30);
  s.curriculum.wrongSkills = s.curriculum.wrongSkills.filter(item => !(item.unit === unit && item.skill === skill));
}

export function calculationRecoveryQuestion(q: Question, phase: number): CurriculumQuestion {
  const unit = q.operation ?? 'division', a = formatScaled(q.dividend, q.places?.[0] ?? 0), b = formatScaled(q.divisor, q.places?.[1] ?? 0);
  const symbol = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' }[unit];
  const label = (text: string) => text.replace('R', ' · 나머지 '), answer = questionAnswerText(q);
  const story = unit === 'addition' ? `리본 ${a} m와 ${b} m를 이어 붙여요. 모두 몇 m일까요?`
    : unit === 'subtraction' ? `리본 ${a} m에서 ${b} m를 사용했어요. 몇 m가 남을까요?`
    : unit === 'multiplication' ? `한 묶음에 리본 ${a} m가 있어요. ${b}묶음의 리본은 모두 몇 m일까요?`
    : q.places ? `리본 ${a} m를 ${b} m씩 나누어요. 몇 묶음일까요?`
    : `과일 ${a}개를 바구니 하나에 ${b}개씩 담아요. 가득 찬 바구니 수${q.remainder ? '와 남은 과일 수' : ''}를 찾아요.`;
  const hint = unit === 'addition' ? '자리값을 나누어 더하거나, 수를 이어 세어 봐요.'
    : unit === 'subtraction' ? '전체에서 사용한 양을 빼요. 자리값을 나누어 생각해도 좋아요.'
    : unit === 'multiplication' ? '한 묶음의 양을 묶음 수만큼 더해 보세요.' : '같은 크기의 묶음을 만들어요. 나머지는 한 묶음보다 작아야 해요.';
  const wrongs = [q.answer + 1, q.answer + 2].map(value => q.places ? formatScaled(value, q.places[2]) : q.remainder ? `${value}R${q.remainder}` : String(value));
  const choices = [answer, ...wrongs].map(value => ({ value, label: label(value) }));
  // 답의 자리를 번갈아 배치해 세 문제를 같은 위치 누르기로 끝낼 수 없게 해요.
  for (let i = 0; i < phase; i++) choices.push(choices.shift()!);
  const small = !q.places && q.dividend <= 30 && q.divisor <= 10;
  return { unit, skill: `${{ addition: '덧셈', subtraction: '뺄셈', multiplication: '곱셈', division: '나눗셈' }[unit]} 다시 해내기`,
    kind: 'choice', answer, choices, prompt: phase === 2 ? story : `${a} ${symbol} ${b}의 답${q.remainder ? '과 나머지' : ''}를 찾아요.`,
    visual: small && unit === 'division' ? { kind: 'groups', total: q.dividend, divisor: q.divisor, remainder: q.remainder ?? 0 }
      : small && unit === 'multiplication' ? { kind: 'array', rows: q.divisor, columns: q.dividend }
      : { kind: 'scene', items: [{ icon: phase === 2 ? '🎀' : '🧩', label: `${a} ${symbol} ${b}` }], caption: phase === 2 ? '생활 속에서 같은 계산을 써요' : '수를 나누어 생각해요' },
    hints: [hint, hint, '천천히 계산하고 보기와 비교해요.'], explanation: `${a} ${symbol} ${b} = ${label(answer)}예요.` };
}

function validDesign(d: VillageDesign) {
  return !!d && Number.isInteger(d.grade) && d.grade >= 1 && d.grade <= 6 && designOptions(0, d.grade).includes(d.rows) && Number.isInteger(d.color) && d.color >= 0 && d.color <= 2 && typeof d.curved === 'boolean' && designOptions(2, d.grade).includes(d.baskets);
}
