import type { CurriculumQuestion, CurriculumMission, CurriculumVisual } from './curriculum';
import { fixVisual } from './grade-visual-fix';
import type { CurriculumUnitId, NewCurriculumUnitId, SchoolGrade } from './rules';
import { GRADE1 } from './grade-g1';
import { GRADE2 } from './grade-g2';
import { GRADE4 } from './grade-g4';
import { GRADE5 } from './grade-g5';
import { GRADE6 } from './grade-g6';
import { GRADE5_EXTRA, GRADE6_EXTRA } from './grade-g56x';
import { GRADE1_EXTRA, GRADE2_EXTRA, GRADE4_EXTRA } from './grade-g124x';
import { VARIANTS_G1, type VariantMap } from './grade-variants12';
import { VARIANTS_G2 } from './grade-variants2';
import { VARIANTS_G4, VARIANTS_G5, VARIANTS_G6 } from './grade-variants456';
import { j, mix, withHardMode, type GradeTable } from './grade-helpers';

export interface GradeRegion { id: CurriculumUnitId; icon: string; name: string; short: string; className: string; semester: '1학기' | '2학기' | '공통' }

type UnitPlan = { icon: string; name: string; short: string; semester: '1학기' | '2학기'; topics: string[] };
type GradePlan = Record<NewCurriculumUnitId, UnitPlan>;

const PLANS: Record<Exclude<SchoolGrade, 3>, GradePlan> = {
  1: {
    plane: { icon: '🔢', name: '9와 50 수마을', short: '9까지의 수에서 50까지의 수', semester: '1학기', topics: ['9까지의 수', '수의 순서', '수 비교', '몇십과 몇', '50까지의 수'] },
    lengthTime: { icon: '🕰️', name: '시계와 규칙길', short: '몇 시·몇 시 30분과 반복 규칙', semester: '2학기', topics: ['몇 시', '몇 시 30분', '하루의 때', '수 규칙', '모양 규칙'] },
    fractionDecimal: { icon: '🧩', name: '모으기 가르기마을', short: '수를 두 수로 모으고 가르기', semester: '1학기', topics: ['수 모으기', '수 가르기', '10 만들기', '빈칸 수', '수 이야기'] },
    circle: { icon: '🔺', name: '알록달록 모양정원', short: '상자·공·둥근기둥과 세모·네모·동그라미', semester: '1학기', topics: ['상자 모양', '공 모양', '둥근기둥 모양', '세모와 네모', '동그라미'] },
    fraction: { icon: '🧱', name: '모양과 위치섬', short: '모양을 쌓고 위치와 순서를 말하기', semester: '2학기', topics: ['모양 쌓기', '위와 아래', '앞과 뒤', '왼쪽과 오른쪽', '몇 번째'] },
    measurement: { icon: '⚖️', name: '비교 저울마을', short: '길이·무게·넓이·들이를 직접 비교', semester: '1학기', topics: ['길이 비교', '무게 비교', '넓이 비교', '들이 비교', '순서 정하기'] },
    pictograph: { icon: '🔢', name: '100까지 수 관측소', short: '100까지의 수와 묶어 세기', semester: '2학기', topics: ['100까지의 수', '10개씩 묶기', '수의 순서', '수 비교', '빈칸 수'] },
  },
  2: {
    plane: { icon: '🔢', name: '수와 식 마을', short: '네 자리 수와 덧셈·뺄셈 식', semester: '1학기', topics: ['백 알아보기', '세 자리 수', '천 알아보기', '네 자리 수', '수 비교'] },
    lengthTime: { icon: '🕰️', name: '시각과 시간길', short: '몇 시 몇 분·시간·하루·달력', semester: '2학기', topics: ['몇 시 몇 분', '시간의 합', '시각 구하기', '하루와 일주일', '달력'] },
    fractionDecimal: { icon: '📏', name: '길이 재기마을', short: 'cm와 m로 재고 길이를 계산', semester: '1학기', topics: ['cm로 재기', '1 m', 'cm와 m', '길이의 합', '길이의 차'] },
    circle: { icon: '🔷', name: '여러 가지 도형정원', short: '삼각형·사각형·원과 쌓기 모양', semester: '1학기', topics: ['삼각형', '사각형', '원', '도형 분류', '쌓기 모양'] },
    fraction: { icon: '🧩', name: '규칙 찾기섬', short: '수·무늬·쌓기에서 규칙 찾기', semester: '2학기', topics: ['수 규칙', '무늬 규칙', '늘어나는 규칙', '줄어드는 규칙', '규칙 설명'] },
    measurement: { icon: '📚', name: '분류하기마을', short: '정한 기준에 따라 자료를 분류', semester: '1학기', topics: ['기준 정하기', '한 기준 분류', '두 기준 분류', '개수 세기', '분류 설명'] },
    pictograph: { icon: '📊', name: '표와 그래프 관측소', short: '자료를 표와 그래프로 나타내고 비교', semester: '2학기', topics: ['표 읽기', '그래프 읽기', '가장 많은 것', '차이 구하기', '자료 이야기'] },
  },
  4: {
    plane: { icon: '🔢', name: '큰 수 별마을', short: '만·억·조와 큰 수의 자릿값', semester: '1학기', topics: ['만', '억', '조', '자릿값', '큰 수 비교'] },
    lengthTime: { icon: '📐', name: '각도와 삼각형길', short: '각도·예각·둔각과 삼각형 분류', semester: '1학기', topics: ['각도', '각도 재기', '예각과 둔각', '삼각형 분류', '각도 계산'] },
    fractionDecimal: { icon: '🪞', name: '이동과 규칙마을', short: '평면도형의 밀기·뒤집기·돌리기와 규칙 찾기', semester: '1학기', topics: ['밀기', '뒤집기', '돌리기', '수 배열 규칙', '규칙을 식으로'] },
    circle: { icon: '🔷', name: '수직·평행·다각형정원', short: '수직과 평행, 다각형의 성질', semester: '2학기', topics: ['수직', '평행', '사각형', '다각형', '대각선'] },
    fraction: { icon: '🍰', name: '분수 계산섬', short: '분모가 같은 분수의 덧셈과 뺄셈', semester: '1학기', topics: ['진분수', '가분수와 대분수', '크기 비교', '분수 덧셈', '분수 뺄셈'] },
    measurement: { icon: '🔟', name: '소수 덧셈뺄셈마을', short: '소수 두·세 자리 수와 소수의 덧셈·뺄셈', semester: '2학기', topics: ['소수의 자릿값', '소수 크기 비교', '소수 덧셈', '소수 뺄셈', '소수 생활 문제'] },
    pictograph: { icon: '📈', name: '그래프 관측소', short: '막대그래프와 꺾은선그래프 해석', semester: '2학기', topics: ['막대그래프', '꺾은선그래프', '변화 읽기', '자료 비교', '그래프 해석'] },
  },
  5: {
    plane: { icon: '🔗', name: '약수와 배수마을', short: '약수·배수·공약수·공배수', semester: '1학기', topics: ['약수', '배수', '공약수', '최대공약수', '최소공배수'] },
    lengthTime: { icon: '🧮', name: '혼합계산과 어림길', short: '혼합 계산·대응 관계·수의 범위·올림 버림 반올림', semester: '1학기', topics: ['혼합 계산', '괄호', '대응 관계', '수의 범위', '올림·버림·반올림'] },
    fractionDecimal: { icon: '🔟', name: '소수 곱셈마을', short: '자연수×소수와 소수×소수', semester: '2학기', topics: ['소수×자연수', '자연수×소수', '소수 한 자리 곱셈', '소수 두 자리 곱셈', '곱의 크기'] },
    circle: { icon: '🪞', name: '합동과 대칭정원', short: '합동·선대칭·점대칭 도형', semester: '2학기', topics: ['합동', '대응점', '대응변', '선대칭', '점대칭'] },
    fraction: { icon: '🍰', name: '분수 연산섬', short: '약분·통분과 분수의 덧셈·뺄셈·곱셈', semester: '1학기', topics: ['약분', '통분', '분수 덧셈', '분수 뺄셈', '분수 곱셈'] },
    measurement: { icon: '📐', name: '둘레와 넓이마을', short: '다각형의 둘레와 넓이, 직육면체', semester: '1학기', topics: ['다각형 둘레', '평행사변형 넓이', '삼각형 넓이', '사다리꼴 넓이', '직육면체'] },
    pictograph: { icon: '📊', name: '평균과 가능성관측소', short: '평균을 구하고 가능성을 말로 비교', semester: '2학기', topics: ['평균', '평균으로 합계 구하기', '가능성 비교', '가능성 표현', '자료 해석'] },
  },
  6: {
    plane: { icon: '➗', name: '분수 나눗셈마을', short: '분수÷자연수와 분수÷분수', semester: '1학기', topics: ['분수÷자연수', '자연수÷분수', '분수÷분수', '역수', '분수 나눗셈'] },
    lengthTime: { icon: '🔟', name: '소수 나눗셈길', short: '소수÷자연수와 소수÷소수', semester: '1학기', topics: ['소수÷자연수', '자연수÷소수', '소수÷소수', '몫 어림', '나머지 나타내기'] },
    fractionDecimal: { icon: '⚖️', name: '비와 비율마을', short: '비·비율·백분율을 연결', semester: '1학기', topics: ['비', '비율', '분수로 나타내기', '소수로 나타내기', '백분율'] },
    circle: { icon: '⭕', name: '원의 넓이정원', short: '원주율·원의 둘레·원의 넓이', semester: '2학기', topics: ['원주', '원주율', '원의 둘레', '원의 넓이', '원 활용'] },
    fraction: { icon: '📐', name: '비례식과 비례배분섬', short: '비례식의 성질과 비례배분', semester: '2학기', topics: ['비의 성질', '비례식', '비례식 계산', '비례배분', '생활 속 비례'] },
    measurement: { icon: '🧊', name: '입체도형마을', short: '각기둥·각뿔·공간·원기둥·원뿔·구', semester: '2학기', topics: ['각기둥과 각뿔', '쌓기나무', '원기둥', '원뿔과 구', '겉넓이와 부피'] },
    pictograph: { icon: '📈', name: '여러 가지 그래프관측소', short: '띠그래프·원그래프와 자료 해석', semester: '1학기', topics: ['띠그래프', '원그래프', '백분율 읽기', '자료 비교', '자료 해석'] },
  },
};

const OPS: Record<SchoolGrade, Partial<Record<'addition'|'subtraction'|'multiplication'|'division', GradeRegion>>> = {
  1: { addition: { id:'addition', icon:'🍎', name:'모으기 덧셈숲', short:'9까지와 20까지의 덧셈', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'가르기 뺄셈숲', short:'9까지와 20까지의 뺄셈', className:'subtraction', semester:'2학기' } },
  2: { addition: { id:'addition', icon:'🍎', name:'받아올림 덧셈숲', short:'두 자리 수 범위의 덧셈', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'받아내림 뺄셈숲', short:'두 자리 수 범위의 뺄셈', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'곱셈과 구구단숲', short:'곱셈의 뜻과 2단부터 9단', className:'multiplication', semester:'2학기' } },
  3: {},
  4: { addition: { id:'addition', icon:'🍎', name:'세 자리 덧셈숲', short:'세 자리 수의 덧셈 복습', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'세 자리 뺄셈숲', short:'세 자리 수의 뺄셈 복습', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'큰 수 곱셈숲', short:'두세 자리 수의 곱셈', className:'multiplication', semester:'1학기' }, division: { id:'division', icon:'🌿', name:'큰 수 나눗셈숲', short:'두 자리 수로 나누기', className:'division', semester:'1학기' } },
  5: { addition: { id:'addition', icon:'🍎', name:'덧셈 다지기숲', short:'세 자리 수와 소수의 덧셈 복습', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'뺄셈 다지기숲', short:'세 자리 수와 소수의 뺄셈 복습', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'곱셈 다지기숲', short:'두 자리 수와 소수의 곱셈 복습', className:'multiplication', semester:'2학기' }, division: { id:'division', icon:'🌿', name:'나눗셈 전략숲', short:'자연수 나눗셈과 검산', className:'division', semester:'1학기' } },
  6: { addition: { id:'addition', icon:'🍎', name:'덧셈 다지기숲', short:'세 자리 수와 소수의 덧셈 복습', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'뺄셈 다지기숲', short:'세 자리 수와 소수의 뺄셈 복습', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'곱셈 다지기숲', short:'두 자리 수와 소수의 곱셈 복습', className:'multiplication', semester:'1학기' }, division: { id:'division', icon:'🌿', name:'나눗셈 다지기숲', short:'두 자리 수 나눗셈과 소수 나눗셈 복습', className:'division', semester:'1학기' } },
};

export function gradeRegions(grade: SchoolGrade): { first: GradeRegion[]; second: GradeRegion[] } | null {
  if (grade === 3) return null;
  const plan = PLANS[grade], ops = Object.values(OPS[grade]) as GradeRegion[];
  const extras = (Object.entries(plan) as [NewCurriculumUnitId, UnitPlan][]).map(([id, item]): GradeRegion => ({ id, icon:item.icon, name:item.name, short:item.short, className:id.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), semester:item.semester }));
  return { first: [...ops.filter(x => x.semester === '1학기'), ...extras.filter(x => x.semester === '1학기')], second: [...ops.filter(x => x.semester === '2학기'), ...extras.filter(x => x.semester === '2학기')] };
}

const EXTRA_TOPICS: Partial<Record<Exclude<SchoolGrade, 3>, Partial<Record<NewCurriculumUnitId, string[]>>>> = {
  1: { fractionDecimal: ['이야기에 맞는 식', '덧셈과 뺄셈의 관계'] },
  2: { plane: ['세 수의 덧셈·뺄셈', '□가 있는 식', '덧셈과 뺄셈의 관계'], fractionDecimal: ['길이 어림'], circle: ['입체도형 모양', '쌓기나무 위치와 방향'] },
  4: { plane: ['어림셈'], lengthTime: ['이등변삼각형과 정삼각형'], fractionDecimal: ['점의 이동', '계산식 배열 규칙'], circle: ['정다각형', '모양 만들기와 채우기'], measurement: ['소수 세 자리 수'] },
  5: {
    plane: ['공배수'],
    lengthTime: ['대응 관계 표', '대응 관계 식'],
    fraction: ['분수 크기 비교', '대분수 덧셈·뺄셈', '분수와 소수 크기 비교', '나눗셈의 몫을 분수로'],
    measurement: ['직사각형 넓이와 넓이 단위', '마름모 넓이', '겨냥도와 전개도'],
  },
  6: {
    plane: ['분모가 다른 분수÷분수', '대분수÷자연수'],
    lengthTime: ['몫을 소수로 나타내기'],
    fractionDecimal: ['비율의 크기 비교', '백분율 활용'],
    measurement: ['부피 단위', '각기둥과 원기둥 전개도', '쌓기나무 위·앞·옆', '정육면체 겉넓이와 부피'],
    pictograph: ['가능성을 수로', '가능성 판단'],
  },
};
export function gradeTopics(grade: Exclude<SchoolGrade, 3>, unit: NewCurriculumUnitId): string[] {
  return [...PLANS[grade][unit].topics, ...(EXTRA_TOPICS[grade]?.[unit] ?? [])];
}

export function gradeMissions(grade: SchoolGrade, unit: NewCurriculumUnitId): CurriculumMission[] | null {
  if (grade === 3) return null;
  const topics = gradeTopics(grade, unit);
  return Array.from({length:10}, (_, i) => ({
    name: i === 9 ? `${PLANS[grade][unit].name} 수호자` : `${topics[i % topics.length]} ${i < topics.length ? '첫걸음' : '도전'}`,
    kind: i === 0 ? 'concept' : i === 9 ? 'guardian' : i % 3 === 0 ? 'story' : 'practice',
    skill: topics[i % topics.length],
    description: i === 9 ? `${PLANS[grade][unit].name}에서 배운 문제를 모두 모아 도전해요.` : i < topics.length ? `${j(topics[i % topics.length], '을를')} 그림과 함께 차근차근 익혀요.` : `${j(topics[i % topics.length], '을를')} 더 큰 수와 더 긴 이야기로 풀어 봐요.`,
  }));
}
const merge = (base: GradeTable, extra: Partial<GradeTable>): GradeTable => Object.fromEntries((Object.keys(base) as NewCurriculumUnitId[]).map(unit => [unit, [...base[unit], ...(extra[unit] ?? [])]])) as GradeTable;
/** 질문이 너무 빨리 되풀이되는 주제에는, 같은 개념을 다른 방식으로 묻는 변형을 섞어요. */
const withVariants = (table: GradeTable, variants: VariantMap): GradeTable => Object.fromEntries((Object.keys(table) as NewCurriculumUnitId[]).map(unit => [unit, table[unit].map((base, index) => { const extra = variants[unit]?.[index]; return extra?.length ? mix(base, ...extra) : base; })])) as GradeTable;
const TABLES: Record<Exclude<SchoolGrade, 3>, GradeTable> = {
  1: withVariants(merge(GRADE1, GRADE1_EXTRA), VARIANTS_G1), 2: withVariants(merge(GRADE2, GRADE2_EXTRA), VARIANTS_G2), 4: withVariants(merge(GRADE4, GRADE4_EXTRA), VARIANTS_G4),
  5: withVariants(merge(GRADE5, GRADE5_EXTRA), VARIANTS_G5), 6: withVariants(merge(GRADE6, GRADE6_EXTRA), VARIANTS_G6),
};

export function generateGradeQuestion(grade: Exclude<SchoolGrade, 3>, unit: NewCurriculumUnitId, mission: number, r: () => number = Math.random): CurriculumQuestion {
  const generators = TABLES[grade][unit];
  const hard = mission >= generators.length;
  return fixVisual(grade, withHardMode(hard, () => generators[mission % generators.length](r, hard)));
}
