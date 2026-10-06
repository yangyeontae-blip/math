import type { CurriculumUnitId, NewCurriculumUnitId } from './rules';
import { j } from './grade-helpers';
import { grade3HasVariant, grade3Variant } from './grade3-variants';

export type CurriculumQuestionKind = 'number' | 'choice';
export type CurriculumVisual =
  | { kind: 'circle'; focus: 'center' | 'radius' | 'diameter' | 'compass' | 'given-radius' | 'given-diameter'; radius: number; unit?: 'cm' | 'm' }
  | { kind: 'geometry'; shape: 'segment' | 'line' | 'ray' | 'angle' | 'right-angle' | 'right-triangle' | 'rectangle' | 'square'; label?: string }
  | { kind: 'length-time'; measure: 'length' | 'time'; values: number[]; unit: 'mm' | 'cm' | 'm' | 'km' | '초' | '분' | '시간'; labels?: string[] }
  | { kind: 'decimal'; tenths: number; compare?: number }
  | { kind: 'fraction'; numerator: number; denominator: number; groups?: number; compare?: { numerator: number; denominator: number } }
  | { kind: 'measure'; measure: 'capacity' | 'weight'; values: number[]; unit: 'mL' | 'L' | 'g' | 'kg' | 't'; labels?: string[] }
  | { kind: 'pictograph'; icon: string; value: number; unitLabel?: string; rows: { label: string; icons: number }[] }
  | { kind: 'bar-graph'; labels: string[]; values: number[]; unit: string; line?: boolean; hidden?: number[]; step?: number }
  | { kind: 'ratio-graph'; mode: 'band' | 'pie'; parts: { label: string; percent: number }[]; hidden?: number[] }
  | { kind: 'transform'; op: 'slide' | 'flip-h' | 'flip-v' | 'rotate-cw90' | 'rotate-ccw90' | 'rotate-180'; label?: string; mark?: 'top' | 'bottom' | 'left' | 'right' }
  | { kind: 'array'; rows: number; columns: number }
  | { kind: 'groups'; total: number; divisor: number; remainder: number };

export interface CurriculumChoice { label: string; value: string }
export interface CurriculumQuestion {
  unit: CurriculumUnitId;
  skill: string;
  prompt: string;
  detail?: string;
  kind: CurriculumQuestionKind;
  answer: string;
  choices?: CurriculumChoice[];
  visual: CurriculumVisual;
  hints: [string, string, string];
  explanation: string;
}

function fractionParts(value: string) {
  const match = value.match(/^(\d+)\/(\d+)$/);
  return match ? [Number(match[1]), Number(match[2])] as const : null;
}

/** 선택한 오답과 문제 그림을 함께 살펴보고, 정답을 바로 밝히지 않는 짧은 피드백을 만듭니다. */
export function curriculumWrongFeedback(question: CurriculumQuestion, submitted: string) {
  const chosen = question.choices?.find(choice => choice.value === submitted)?.label ?? submitted;
  if (question.kind === 'number') {
    const entered = Number(submitted), answer = Number(question.answer);
    const size = Number.isFinite(entered) && Number.isFinite(answer) && entered !== answer
      ? `입력한 ${j(submitted, '은는')} 답보다 ${entered > answer ? '커요' : '작아요'}. `
      : `입력한 ${j(submitted, '을를')} 다시 살펴봐요. `;
    if (question.visual.kind === 'array') return `${size}가로와 세로의 수를 곱했는지 확인해 봐요. ${question.hints[0]}`;
    if (question.visual.kind === 'groups') return `${size}전체를 ${question.visual.divisor}개씩 묶고 남는 수까지 세어 봐요.`;
    if (question.visual.kind === 'fraction') return `${size}전체 조각 수와 색칠한 조각 수를 그림에서 다시 세어 봐요.`;
    if (question.visual.kind === 'pictograph') return `${size}그림 한 개가 ${question.visual.value}${j(question.visual.unitLabel ?? '', '을를')} 나타내는지 확인해 봐요.`;
    if (question.visual.kind === 'length-time' || question.visual.kind === 'measure') return `${size}먼저 단위를 같게 바꾸었는지 확인해 봐요. ${question.hints[0]}`;
    if (question.visual.kind === 'circle') return `${size}반지름과 지름의 관계를 그림에서 다시 찾아봐요.`;
    return `${size}${question.hints[0]}`;
  }

  const selectedFraction = fractionParts(submitted), answerFraction = fractionParts(question.answer);
  if (selectedFraction && answerFraction) {
    if (selectedFraction[0] === answerFraction[1] && selectedFraction[1] === answerFraction[0]) return `${j(chosen, '을를')} 골랐어요. 분자와 분모의 자리를 바꾸지 않았는지 봐요. 전체 조각 수는 아래에, 고른 조각 수는 위에 써요.`;
    if (selectedFraction[1] === answerFraction[1]) return `${j(chosen, '을를')} 골랐어요. 분모는 같지만 고른 조각 수가 맞는지 그림에서 다시 세어 봐요.`;
    return `${j(chosen, '을를')} 골랐어요. 전체를 몇 조각으로 나눴는지 먼저 세어 분모를 확인해 봐요.`;
  }
  if (question.visual.kind === 'pictograph') return `${j(chosen, '을를')} 골랐어요. 각 줄의 ${question.visual.icon} 수를 다시 세고, 그림 한 개의 값 ${question.visual.value}${j(question.visual.unitLabel ?? '', '을를')} 적용해 봐요.`;
  if (question.visual.kind === 'measure') return `${j(chosen, '을를')} 골랐어요. 물건의 실제 크기를 떠올리고 ${question.visual.measure === 'capacity' ? 'mL와 L' : 'g, kg, t'} 중 알맞은 단위를 골라 봐요.`;
  if (question.visual.kind === 'length-time') return `${j(chosen, '을를')} 골랐어요. ${j(question.visual.measure === 'time' ? '60초와 1분, 60분과 1시간' : '길이 단위 사이의 관계', '을를')} 먼저 확인해 봐요.`;
  if (question.visual.kind === 'circle') return `${j(chosen, '을를')} 골랐어요. 선분이 원의 중심을 지나는지, 양 끝이 어디에 닿는지 그림에서 확인해 봐요.`;
  if (question.visual.kind === 'geometry') return `${j(chosen, '을를')} 골랐어요. 선의 끝점과 도형의 모서리를 하나씩 짚어 보며 특징을 비교해 봐요.`;
  if (question.visual.kind === 'decimal') return `${j(chosen, '을를')} 골랐어요. 열 칸 중 색칠한 칸 수와 소수점 오른쪽 숫자를 연결해 봐요.`;
  return `${j(chosen, '을를')} 골랐어요. ${question.hints[0]}`;
}

export interface CurriculumMission {
  name: string;
  kind: 'concept' | 'practice' | 'story' | 'guardian';
  skill: string;
  description: string;
}

export const CURRICULUM_MISSIONS: Record<NewCurriculumUnitId, CurriculumMission[]> = {
  plane: [
    { name: '두 점을 곧게 이어요', kind: 'concept', skill: '선분', description: '두 점을 곧게 이은 선분을 알아봐요.' },
    { name: '끝없이 뻗는 길', kind: 'concept', skill: '직선과 반직선', description: '직선과 반직선의 다른 점을 찾아요.' },
    { name: '두 선이 만나는 곳', kind: 'concept', skill: '각', description: '한 점에서 시작한 두 반직선으로 각을 만들어요.' },
    { name: '네모난 모서리', kind: 'practice', skill: '직각', description: '종이 모서리처럼 반듯한 직각을 찾아요.' },
    { name: '직각 세기', kind: 'practice', skill: '도형의 직각', description: '도형에 있는 직각의 수를 세어요.' },
    { name: '직각삼각형 텐트', kind: 'practice', skill: '직각삼각형', description: '직각이 있는 삼각형을 구별해요.' },
    { name: '직사각형 창문', kind: 'story', skill: '직사각형', description: '네 각이 모두 직각인 사각형을 찾아요.' },
    { name: '정사각형 타일', kind: 'story', skill: '정사각형', description: '네 변의 길이가 같은 직사각형을 찾아요.' },
    { name: '도형 마을 설계', kind: 'practice', skill: '평면도형 종합', description: '선분·각·여러 가지 사각형을 연결해요.' },
    { name: '도형마을 수호자', kind: 'guardian', skill: '평면도형 종합', description: '평면도형의 성질을 모두 사용해요.' },
  ],
  lengthTime: [
    { name: '밀리미터 자', kind: 'concept', skill: 'mm와 cm', description: '1 cm와 10 mm의 관계를 알아봐요.' },
    { name: '킬로미터 표지판', kind: 'concept', skill: 'km와 m', description: '1 km와 1,000 m의 관계를 알아봐요.' },
    { name: '알맞은 길이 단위', kind: 'concept', skill: '길이 어림', description: '물건과 거리에 알맞은 단위를 골라요.' },
    { name: '리본 길이 합치기', kind: 'practice', skill: '길이의 덧셈', description: 'cm와 mm 길이를 더해요.' },
    { name: '남은 산책길', kind: 'practice', skill: '길이의 뺄셈', description: 'km와 m 길이를 빼요.' },
    { name: '똑딱똑딱 1분', kind: 'concept', skill: '초와 분', description: '1분은 60초임을 익혀요.' },
    { name: '시계탑의 약속', kind: 'practice', skill: '시간과 분', description: '1시간은 60분임을 익혀요.' },
    { name: '기차 여행 시간', kind: 'story', skill: '시간 계산', description: '시각 사이에 흐른 시간을 구해요.' },
    { name: '마을 운동회 기록', kind: 'story', skill: '길이와 시간 종합', description: '길이와 시간 문제를 생활 속에서 풀어요.' },
    { name: '시계마을 수호자', kind: 'guardian', skill: '길이와 시간 종합', description: '단위 관계와 계산을 모두 사용해요.' },
  ],
  fractionDecimal: [
    { name: '똑같이 나눈 한 조각', kind: 'concept', skill: '분수의 뜻', description: '전체를 똑같이 나눈 한 부분을 알아봐요.' },
    { name: '여러 조각을 분수로', kind: 'concept', skill: '분수 읽기', description: '색칠한 부분을 분수로 나타내요.' },
    { name: '한 조각의 크기', kind: 'practice', skill: '단위분수', description: '분모가 커질수록 한 조각이 작아짐을 알아봐요.' },
    { name: '분수 크기 겨루기', kind: 'practice', skill: '분수의 크기', description: '분모가 같은 분수의 크기를 비교해요.' },
    { name: '열 칸 중 한 칸', kind: 'concept', skill: '소수의 뜻', description: '10분의 몇을 소수로 나타내요.' },
    { name: '소수 바르게 읽기', kind: 'concept', skill: '소수 읽기', description: '0.1부터 0.9까지 읽고 써요.' },
    { name: '분수와 소수 짝꿍', kind: 'practice', skill: '분수와 소수', description: '10분의 몇과 소수를 서로 바꾸어요.' },
    { name: '어느 소수가 클까', kind: 'practice', skill: '소수의 크기', description: '소수의 크기를 비교해요.' },
    { name: '주스병 눈금 이야기', kind: 'story', skill: '분수와 소수 종합', description: '생활 속 분수와 소수를 찾아요.' },
    { name: '소수마을 수호자', kind: 'guardian', skill: '분수와 소수 종합', description: '분수와 소수의 뜻과 크기를 모두 사용해요.' },
  ],
  circle: [
    { name: '달빛 한가운데', kind: 'concept', skill: '원의 중심', description: '원의 한가운데 점을 찾아요.' },
    { name: '중심에서 가장자리로', kind: 'concept', skill: '반지름', description: '중심과 원 위의 점을 이어요.' },
    { name: '원을 가로지르는 빛', kind: 'concept', skill: '지름', description: '중심을 지나는 선분을 찾아요.' },
    { name: '반지름 두 번', kind: 'practice', skill: '반지름과 지름', description: '지름은 반지름의 두 배임을 익혀요.' },
    { name: '지름을 반으로', kind: 'practice', skill: '지름과 반지름', description: '지름에서 반지름을 구해요.' },
    { name: '마법 컴퍼스', kind: 'practice', skill: '원 그리기', description: '컴퍼스로 원을 그리는 순서를 익혀요.' },
    { name: '달빛 연못 이야기', kind: 'story', skill: '원의 성질', description: '연못의 크기를 원의 성질로 알아봐요.' },
    { name: '수레바퀴 이야기', kind: 'story', skill: '반지름과 지름', description: '바퀴의 반지름과 지름을 찾아요.' },
    { name: '달빛 원 축제', kind: 'story', skill: '원 종합', description: '생활 속 원의 성질을 다시 연결해요.' },
    { name: '원의 정원 수호자', kind: 'guardian', skill: '원 종합', description: '원의 중심·반지름·지름을 모두 사용해요.' },
  ],
  fraction: [
    { name: '똑같이 나눈 케이크', kind: 'concept', skill: '분수의 뜻', description: '전체를 똑같이 나누어 분수로 나타내요.' },
    { name: '색칠한 조각 읽기', kind: 'concept', skill: '분수 읽기', description: '색칠한 부분을 분수로 읽어요.' },
    { name: '전체의 얼마만큼', kind: 'concept', skill: '분수만큼', description: '전체에 대한 분수만큼을 구해요.' },
    { name: '1보다 작거나 큰 분수', kind: 'practice', skill: '진분수와 가분수', description: '진분수와 가분수를 구별해요.' },
    { name: '한 덩이와 남은 조각', kind: 'practice', skill: '대분수', description: '가분수와 대분수를 바꾸어 봐요.' },
    { name: '어느 쪽이 더 클까', kind: 'practice', skill: '분수의 크기', description: '분모가 같은 분수의 크기를 비교해요.' },
    { name: '소풍 케이크 이야기', kind: 'story', skill: '분수만큼', description: '친구들이 먹은 케이크 조각을 세어요.' },
    { name: '별사탕 상자 이야기', kind: 'story', skill: '분수만큼', description: '별사탕의 몇 분의 몇을 찾아요.' },
    { name: '분수 케이크 축제', kind: 'story', skill: '분수 종합', description: '분수의 뜻과 크기를 생활 문제로 연결해요.' },
    { name: '분수섬 수호자', kind: 'guardian', skill: '분수 종합', description: '분수의 뜻과 크기를 모두 사용해요.' },
  ],
  measurement: [
    { name: '물방울의 단위', kind: 'concept', skill: '들이의 단위', description: 'L와 mL를 알맞게 사용해요.' },
    { name: '짐꾸러미의 단위', kind: 'concept', skill: '무게의 단위', description: 'g, kg, t을 알맞게 사용해요.' },
    { name: '어림 탐정', kind: 'concept', skill: '어림하기', description: '생활 물건의 들이와 무게를 어림해요.' },
    { name: '물약 병 바꾸기', kind: 'practice', skill: '들이 단위 관계', description: '1 L와 1,000 mL의 관계를 익혀요.' },
    { name: '저울 눈금 바꾸기', kind: 'practice', skill: '무게 단위 관계', description: '1 kg과 1,000 g의 관계를 익혀요.' },
    { name: '합치고 덜어 내기', kind: 'practice', skill: '들이와 무게의 계산', description: '들이와 무게를 더하고 빼요.' },
    { name: '물약 가게 이야기', kind: 'story', skill: '들이 계산', description: '필요한 물약의 들이를 계산해요.' },
    { name: '숲 배달 이야기', kind: 'story', skill: '무게 계산', description: '배달할 짐의 무게를 계산해요.' },
    { name: '물방울 배달 축제', kind: 'story', skill: '들이와 무게 종합', description: '들이와 무게를 생활 문제로 다시 풀어요.' },
    { name: '저울마을 수호자', kind: 'guardian', skill: '들이와 무게 종합', description: '단위·어림·계산을 모두 사용해요.' },
  ],
  pictograph: [
    { name: '그림 하나의 약속', kind: 'concept', skill: '그림그래프의 뜻', description: '그림 하나가 나타내는 수를 알아봐요.' },
    { name: '그림 수 세기', kind: 'concept', skill: '그림그래프 읽기', description: '그림의 수로 자료를 읽어요.' },
    { name: '숨은 수 찾기', kind: 'concept', skill: '그림값 구하기', description: '전체 수에서 그림 하나의 값을 찾아요.' },
    { name: '모두 몇 명일까', kind: 'practice', skill: '자료 합계', description: '그림그래프의 여러 자료를 합해요.' },
    { name: '빈칸 그림 채우기', kind: 'practice', skill: '그림그래프 완성', description: '표에 맞게 필요한 그림 수를 구해요.' },
    { name: '알맞은 그래프 고르기', kind: 'practice', skill: '자료 나타내기', description: '자료와 맞는 그림그래프를 골라요.' },
    { name: '좋아하는 과일 조사', kind: 'story', skill: '자료 해석', description: '친구들이 좋아하는 과일을 비교해요.' },
    { name: '숲 친구 발자국 조사', kind: 'story', skill: '자료 비교', description: '그림그래프에서 차이를 찾아요.' },
    { name: '별빛 조사 발표회', kind: 'story', skill: '그림그래프 종합', description: '여러 그림그래프를 읽고 비교해요.' },
    { name: '관측소 수호자', kind: 'guardian', skill: '그림그래프 종합', description: '읽기·비교·완성을 모두 사용해요.' },
  ],
};

const randomInt = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)];
const shuffle = <T>(items: T[], random: () => number) => items.map(value => ({ value, order: random() })).sort((a, b) => a.order - b.order).map(item => item.value);
const numberChoices = (answer: number, offsets: number[], suffix: string, random: () => number): CurriculumChoice[] => shuffle([answer, ...offsets.map(n => Math.max(0, answer + n))].filter((n, i, all) => all.indexOf(n) === i).slice(0, 4).map(n => ({ label: `${n}${suffix}`, value: String(n) })), random);
const choiceQuestion = (base: Omit<CurriculumQuestion, 'kind' | 'answer' | 'choices'>, answer: string, choices: CurriculumChoice[]): CurriculumQuestion => ({ ...base, kind: 'choice', answer, choices });
const numberQuestion = (base: Omit<CurriculumQuestion, 'kind' | 'answer'>, answer: number): CurriculumQuestion => ({ ...base, kind: 'number', answer: String(answer) });
const withChoices = (answer: string, wrongs: string[], random: () => number): CurriculumChoice[] => shuffle([answer, ...wrongs].filter((value, index, all) => all.indexOf(value) === index).map(value => ({ label: value, value })), random);

const CIRCLE_CM_SCENES = ['둥근 쿠키', '둥근 접시', '동전', '단추', '둥근 거울', '팽이'] as const;
const CIRCLE_M_SCENES = ['꽃밭', '연못', '분수대', '원 모양 무대', '회전목마 바닥', '둥근 놀이터'] as const;
const COMPASS_STEPS = [
  { prompt: '컴퍼스로 원을 그릴 때 가장 먼저 할 일은 무엇일까요?', answer: '중심 정하기', wrongs: ['색칠부터 하기', '지름을 접기'], explanation: '먼저 중심을 정하고, 원하는 반지름만큼 컴퍼스를 벌려 원을 그려요.', hints: ['컴퍼스로 그리기 전에 원의 한가운데를 어디에 둘지 정해야 해요.', '컴퍼스의 뾰족한 침을 꽂을 자리가 원의 중심이 돼요.', '가장 먼저 “중심 정하기”를 해요.'] },
  { prompt: '중심을 정한 다음에는 무엇을 해야 할까요?', answer: '반지름만큼 벌리기', wrongs: ['중심을 지우기', '종이를 접기'], explanation: '연필심과 뾰족한 침 사이를 원하는 반지름만큼 벌려요.', hints: ['중심을 정했으니 이제 원의 크기를 정할 차례예요.', '원의 크기는 중심에서 가장자리까지의 길이, 반지름으로 정해요.', '침과 연필심 사이를 “반지름만큼 벌려요”.'] },
  { prompt: '원을 그리는 동안 컴퍼스의 뾰족한 침은 어떻게 해야 할까요?', answer: '중심에 고정하기', wrongs: ['계속 옮기기', '종이 밖에 놓기'], explanation: '뾰족한 침을 중심에 고정해야 같은 거리로 둥글게 그릴 수 있어요.', hints: ['원을 그리는 동안 움직이면 안 되는 쪽이 있어요.', '움직이는 쪽은 연필심이고, 가만히 있어야 하는 쪽은 침이에요.', '침은 “중심에 고정해요”.'] },
  { prompt: '한 원을 그리는 동안 컴퍼스의 침과 연필심 사이 거리는 어떻게 해야 할까요?', answer: '그대로 유지하기', wrongs: ['점점 넓히기', '점점 좁히기'], explanation: '침과 연필심 사이 거리를 바꾸지 않아야 중심에서 같은 거리인 원이 그려져요.', hints: ['원 위의 모든 점은 중심에서 같은 거리에 있어요.', '그 거리가 바로 반지름이에요. 반지름이 달라지면 둥근 원이 되지 않아요.', '컴퍼스를 벌린 간격을 “그대로 유지해요”.'] },
  { prompt: '컴퍼스로 원을 그리는 순서로 알맞은 것은 무엇일까요?', answer: '중심→벌리기→돌리기', wrongs: ['돌리기→중심→벌리기', '벌리기→침 옮기기→접기'], explanation: '중심을 정하고, 반지름만큼 벌리고, 침을 중심에 고정한 채 돌려요.', hints: ['먼저 할 일, 그다음 할 일, 마지막에 할 일을 차례대로 떠올려요.', '중심을 정하고, 벌리고, 마지막에 돌려요.', '알맞은 순서는 “중심→벌리기→돌리기”예요.'] },
] as const;

function circleQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return circleQuestion(randomInt(0, 7, random), random);
  const radius = randomInt(2, 9, random), diameter = radius * 2;
  const base = (focus: 'center' | 'radius' | 'diameter' | 'compass' | 'given-radius' | 'given-diameter', unit: 'cm' | 'm' = 'cm') => ({ unit: 'circle' as const, skill: CURRICULUM_MISSIONS.circle[mission].skill, visual: { kind: 'circle' as const, focus, radius, unit } });
  if (mission === 0) {
    const situation = pick(['둥근 과녁의 한가운데 점', '수레바퀴가 빙글빙글 도는 한가운데 점', '둥근 연못의 정확한 한가운데 점', '원 모양 시계의 정가운데 점'], random);
    return choiceQuestion({ ...base('center'), prompt: `${j(situation, '을를')} 수학에서는 무엇이라고 할까요?`, hints: ['원의 가장자리 어디까지 재어도 거리가 똑같은 점을 찾아봐요.', '바퀴살이 모두 모이는 한가운데 점이에요.', '가장자리까지의 거리가 모두 같은 한가운데 점을 “중심”이라고 해요.'], explanation: '원의 가장자리까지 거리가 모두 같은 한가운데 점을 원의 중심이라고 해요.' }, '중심', withChoices('중심', ['반지름', '지름', '둘레'], random));
  }
  if (mission === 1) {
    const situation = pick(['자전거 바퀴의 중심에서 바퀴 끝까지 이은 살', '둥근 방패의 중심에서 가장자리까지 그은 선분', '피자 한가운데에서 테두리까지 곧게 이은 선분', '원의 중심과 원 위의 한 점을 이은 선분'], random);
    return choiceQuestion({ ...base('radius'), prompt: `${j(situation, '은는')} 무엇일까요?`, hints: ['선분이 시작하는 곳이 원의 중심인지 살펴봐요.', '중심에서 시작해 원 위의 한 점에서 끝나는 선분이에요.', '중심과 원 위의 한 점을 이은 선분을 “반지름”이라고 해요.'], explanation: '원의 중심에서 원 위의 한 점까지 이은 선분을 반지름이라고 해요.' }, '반지름', withChoices('반지름', ['지름', '둘레', '중심'], random));
  }
  if (mission === 2) {
    const situation = pick(['원의 중심을 지나 양쪽 끝을 이은 선분', '둥근 북의 한쪽 끝에서 중심을 지나 반대쪽 끝까지 이은 선분', '시계의 중심을 지나 3과 9를 곧게 이은 선분', '원 안에서 중심을 지나도록 가장 길게 그은 선분'], random);
    return choiceQuestion({ ...base('diameter'), prompt: `${j(situation, '은는')} 무엇일까요?`, hints: ['선분이 원의 중심을 지나는지 살펴봐요.', '중심을 지나 원 위의 두 점을 이은 선분이에요.', '중심을 지나 양쪽 끝을 이은 선분을 “지름”이라고 해요.'], explanation: '원의 중심을 지나 원 위의 두 점을 이은 선분을 지름이라고 해요.' }, '지름', withChoices('지름', ['반지름', '중심', '둘레'], random));
  }
  if (mission === 3) {
    const object = pick(CIRCLE_CM_SCENES, random);
    return numberQuestion({ ...base('given-radius'), prompt: `${object}의 반지름이 ${radius} cm예요. 중심을 지나 한쪽 끝에서 반대쪽 끝까지의 길이는 몇 cm일까요?`, hints: ['중심을 지나 양쪽 끝을 이은 선분은 지름이에요.', '지름은 반지름이 두 번 이어진 길이예요.', `${radius} × 2 를 계산해 보세요.`], explanation: `지름은 반지름의 2배이므로 ${radius} × 2 = ${diameter} cm예요.` }, diameter);
  }
  if (mission === 4) {
    const object = pick(CIRCLE_CM_SCENES, random);
    return numberQuestion({ ...base('given-diameter'), prompt: `${object}의 지름이 ${diameter} cm예요. 중심에서 가장자리까지의 길이는 몇 cm일까요?`, hints: ['중심에서 가장자리까지의 길이는 반지름이에요.', '반지름은 지름의 절반이에요. 지름을 똑같이 둘로 나눠요.', `${diameter} ÷ 2 를 계산해 보세요.`], explanation: `반지름은 지름의 절반이므로 ${diameter} ÷ 2 = ${radius} cm예요.` }, radius);
  }
  if (mission === 5) {
    const step = pick(COMPASS_STEPS, random);
    return choiceQuestion({ ...base('compass'), prompt: step.prompt, hints: [...step.hints] as [string, string, string], explanation: step.explanation }, step.answer, withChoices(step.answer, [...step.wrongs], random));
  }
  if (mission === 6) {
    const scene = pick(CIRCLE_M_SCENES, random);
    return numberQuestion({ ...base('given-radius', 'm'), prompt: `${scene}의 중심에서 가장자리까지가 ${radius} m예요. 가운데를 지나 반대편까지 곧게 건너면 몇 m일까요?`, hints: ['가운데를 지나 반대편까지의 길이는 지름이에요.', '지름은 반지름이 두 번 이어진 길이예요.', `${radius} × 2 를 계산해 보세요.`], explanation: `${radius} m가 두 번 이어지므로 지름은 ${diameter} m예요.` }, diameter);
  }
  const scene = pick(CIRCLE_M_SCENES, random);
  return numberQuestion({ ...base('given-diameter', 'm'), prompt: `${scene}의 한쪽 끝에서 중심을 지나 반대쪽 끝까지가 ${diameter} m예요. 중심에서 가장자리까지는 몇 m일까요?`, hints: ['중심에서 가장자리까지의 길이는 반지름이에요.', '지름을 똑같이 둘로 나누면 반지름이 돼요.', `${diameter} ÷ 2 를 계산해 보세요.`], explanation: `지름을 똑같이 둘로 나누면 반지름 ${radius} m가 돼요.` }, radius);
}

const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10] as const;
const COMPARE_DENOMINATORS = [3, 4, 5, 6, 8, 10] as const;

function fractionQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return fractionQuestion(randomInt(0, 7, random), random);
  const denominator = pick(FRACTION_DENOMINATORS, random), numerator = randomInt(1, denominator - 1, random);
  const base = { unit: 'fraction' as const, skill: CURRICULUM_MISSIONS.fraction[mission].skill, visual: { kind: 'fraction' as const, numerator, denominator } };
  if (mission === 0) {
    const answer = `${numerator}/${denominator}`;
    const object = pick(['케이크', '피자', '초콜릿 판', '색종이', '꽃밭'], random);
    return choiceQuestion({ ...base, prompt: `${object} 전체를 ${denominator}부분으로 똑같이 나누고 그중 ${numerator}부분을 골랐어요. 알맞은 분수는 무엇일까요?`, hints: ['전체를 몇 부분으로 똑같이 나누었는지 먼저 세어 봐요.', `전체를 똑같이 나눈 수 ${j(denominator, '이가')} 분모(아래 수), 고른 수 ${j(numerator, '이가')} 분자(위 수)예요.`, `분모 ${denominator}, 분자 ${numerator}이므로 ${answer}이에요.`], explanation: `전체를 나눈 ${j(denominator, '이가')} 분모, 고른 ${j(numerator, '이가')} 분자이므로 ${answer}이에요.` }, answer, withChoices(answer, [`${denominator}/${numerator}`, `${numerator}/${denominator + 1}`], random));
  }
  if (mission === 1) {
    const answer = `${denominator}분의 ${numerator}`;
    return choiceQuestion({ ...base, prompt: `${j(`${numerator}/${denominator}`, '을를')} 바르게 읽은 것은 무엇일까요?`, hints: ['분수는 아래 수인 분모를 먼저 읽고 “분의”를 붙여요.', '분모를 읽은 다음에 위 수인 분자를 읽어요.', `${j(`${numerator}/${denominator}`, '은는')} “${answer}”이라고 읽어요.`], explanation: `분모 ${j(denominator, '을를')} 먼저 읽고 분자 ${j(numerator, '을를')} 읽으므로 “${answer}”이에요.` }, answer, withChoices(answer, [`${numerator}분의 ${denominator}`, `${denominator}분의 ${numerator + 1}`], random));
  }
  if (mission === 2 || mission >= 6) {
    const groups = randomInt(2, Math.min(5, Math.floor(30 / denominator)), random), total = denominator * groups, amount = numerator * groups;
    const objects = mission === 6 ? ['소풍 샌드위치', '컵케이크', '과일 꼬치', '주먹밥'] : mission === 7 ? ['별사탕', '구슬', '씨앗', '반짝 스티커'] : ['열매', '도토리', '꽃송이', '리본'];
    const object = pick(objects, random), askRemaining = mission >= 6 && random() < .35, answer = askRemaining ? total - amount : amount;
    const prompt = askRemaining
      ? `${object} ${total}개 중 ${j(`${numerator}/${denominator}`, '을를')} 나누어 주었어요. 남은 것은 몇 개일까요?`
      : `${object} ${total}개 중 ${numerator}/${denominator}만큼은 몇 개일까요?`;
    const explanation = `${total}개를 ${denominator}묶음으로 똑같이 나누면 한 묶음은 ${groups}개예요. ${numerator}묶음은 ${groups} × ${numerator} = ${amount}개${askRemaining ? `이고, ${total} - ${amount} = ${answer}개가 남아요.` : '예요.'}`;
    const hints: [string, string, string] = [`전체를 ${denominator}묶음으로 똑같이 나누어 봐요.`, `한 묶음은 ${total} ÷ ${denominator} = ${groups}개예요.`, askRemaining ? `${numerator}묶음은 ${groups} × ${numerator} = ${amount}개이고, 남은 것은 ${total} - ${amount}예요.` : `${numerator}묶음이니까 ${groups} × ${numerator} 를 계산해요.`];
    return numberQuestion({ ...base, visual: { kind: 'fraction', numerator, denominator, groups }, prompt, hints, explanation }, answer);
  }
  if (mission === 3) {
    const improper = random() < .5, shownNumerator = improper ? denominator + randomInt(0, denominator * 2, random) : numerator;
    const answer = improper ? '가분수' : '진분수';
    const explanation = improper ? '분자가 분모와 같거나 크므로 가분수예요.' : '분자가 분모보다 작으므로 진분수예요.';
    return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: shownNumerator, denominator }, prompt: `${j(`${shownNumerator}/${denominator}`, '은는')} 진분수일까요, 가분수일까요?`, hints: ['분자와 분모의 크기를 먼저 비교해요.', '분자가 분모보다 작으면 진분수예요.', '분자가 분모와 같거나 크면 가분수예요.'], explanation }, answer, withChoices(answer, [improper ? '진분수' : '가분수'], random));
  }
  if (mission === 4) {
    const whole = randomInt(1, 3, random), rest = randomInt(1, denominator - 1, random), improper = whole * denominator + rest, answer = `${whole} ${rest}/${denominator}`;
    const conversionHints: [string, string, string] = ['분자를 분모로 나누어 몇 덩이인지 찾아요.', `분모 ${denominator}짜리 한 덩이마다 ${denominator}조각이 필요해요.`, `${denominator} × ${whole} + ${rest} = ${j(improper, '을를')} 이용해 확인해요.`];
    if (random() < .5) return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: improper, denominator }, prompt: `${j(`${improper}/${denominator}`, '을를')} 대분수로 나타내면 무엇일까요?`, hints: conversionHints, explanation: `${improper} = ${denominator} × ${whole} + ${rest}이므로 ${answer}이에요.` }, answer, withChoices(answer, [`${whole + 1} ${rest}/${denominator}`, `${whole} ${rest}/${denominator + 1}`, `${Math.max(1, whole - 1)} ${rest}/${denominator}`], random));
    const improperAnswer = `${improper}/${denominator}`;
    return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: improper, denominator }, prompt: `${j(answer, '을를')} 가분수로 나타내면 무엇일까요?`, hints: conversionHints, explanation: `${denominator} × ${whole} + ${rest} = ${improper}이므로 ${improperAnswer}이에요.` }, improperAnswer, withChoices(improperAnswer, [`${whole + rest}/${denominator}`, `${improper + 1}/${denominator}`, `${improper}/${denominator + 1}`], random));
  }
  if (random() < .6) {
    const sharedDenominator = pick(COMPARE_DENOMINATORS, random), first = randomInt(1, sharedDenominator - 1, random);
    let second = randomInt(1, sharedDenominator - 2, random); if (second >= first) second++;
    const larger = Math.max(first, second), smaller = Math.min(first, second), answer = `${larger}/${sharedDenominator}`;
    return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: first, denominator: sharedDenominator, compare: { numerator: second, denominator: sharedDenominator } }, prompt: `${j(`${first}/${sharedDenominator}`, '와과')} ${second}/${sharedDenominator} 중 더 큰 분수는 무엇일까요?`, hints: ['두 분수의 분모가 같은지 먼저 살펴봐요.', '분모가 같으면 한 조각의 크기가 같으니, 조각 수인 분자를 비교해요.', `${j(larger, '이가')} ${smaller}보다 크므로 ${j(answer, '이가')} 더 커요.`], explanation: `분모가 같으면 분자가 큰 분수가 더 커요. 따라서 ${j(answer, '이가')} 더 커요.` }, answer, withChoices(answer, [`${smaller}/${sharedDenominator}`], random));
  }
  const firstDenominator = pick(COMPARE_DENOMINATORS, random), secondDenominator = pick(COMPARE_DENOMINATORS.filter(value => value !== firstDenominator), random);
  const sharedNumerator = randomInt(1, Math.min(firstDenominator, secondDenominator) - 1, random), smallerDenominator = Math.min(firstDenominator, secondDenominator), largerDenominator = Math.max(firstDenominator, secondDenominator);
  const answer = `${sharedNumerator}/${smallerDenominator}`;
  return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: sharedNumerator, denominator: firstDenominator, compare: { numerator: sharedNumerator, denominator: secondDenominator } }, prompt: `${j(`${sharedNumerator}/${firstDenominator}`, '와과')} ${sharedNumerator}/${secondDenominator} 중 더 큰 분수는 무엇일까요?`, hints: ['두 분수는 분자가 같아요. 분모를 살펴봐요.', '같은 개수의 조각을 고를 때는 한 조각의 크기를 비교해요. 분모가 작을수록 한 조각이 더 커요.', `분모 ${j(smallerDenominator, '이가')} ${largerDenominator}보다 작으므로 ${j(answer, '이가')} 더 커요.`], explanation: `분자가 같을 때는 분모가 작은 분수가 더 커요. 따라서 ${j(answer, '이가')} 더 커요.` }, answer, withChoices(answer, [`${sharedNumerator}/${largerDenominator}`], random));
}

function measurementQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return measurementQuestion(randomInt(0, 7, random), random);
  const capacity = mission === 0 || mission === 3 || mission === 6 || (mission === 2 && random() < .5) || (mission === 5 && random() < .5);
  const base = { unit: 'measurement' as const, skill: CURRICULUM_MISSIONS.measurement[mission].skill, visual: { kind: 'measure' as const, measure: capacity ? 'capacity' as const : 'weight' as const, values: [1], unit: capacity ? 'L' as const : 'kg' as const }, hints: ['단위가 서로 같아야 더하거나 비교할 수 있어요.', '1 L는 1,000 mL이고 1 kg은 1,000 g이에요.', '큰 단위 하나를 작은 단위 1,000개로 바꾸어 생각해 보세요.'] as [string, string, string] };
  if (mission === 0) {
    const examples = [
      { item: '안약 한 병', answer: 'mL', explanation: '안약처럼 아주 적은 액체의 들이는 mL로 나타내요.' },
      { item: '작은 요구르트 한 병', answer: 'mL', explanation: '작은 음료의 들이는 mL로 나타내면 알맞아요.' },
      { item: '생수병 하나', answer: 'mL', explanation: '생수병 하나의 들이는 보통 mL로 나타내요.' },
      { item: '우유 큰 팩 하나', answer: 'L', explanation: '우유 큰 팩의 들이는 약 1 L로 나타낼 수 있어요.' },
      { item: '욕조에 받는 물', answer: 'L', explanation: '욕조처럼 많은 물의 들이는 L로 나타내요.' },
      { item: '커다란 물통', answer: 'L', explanation: '커다란 물통의 들이는 L로 나타내면 알맞아요.' },
    ];
    const example = pick(examples, random);
    return choiceQuestion({ ...base, visual: { kind: 'measure', measure: 'capacity', values: [1], unit: example.answer as 'mL' | 'L', labels: [example.item] }, prompt: `${example.item}의 들이를 나타내기에 알맞은 단위는 무엇일까요?`, hints: ['담을 수 있는 액체의 양을 들이라고 해요.', '적은 양은 mL, 많은 양은 L를 주로 사용해요.', '1 L는 1,000 mL예요.'], explanation: example.explanation }, example.answer, ['mL', 'L', 'kg', 'cm'].map(value => ({ label: value, value })));
  }
  if (mission === 1) {
    const examples = [
      { item: '연필 한 자루', answer: 'g', explanation: '연필처럼 가벼운 물건은 g으로 나타내면 알맞아요.', choices: ['g', 'kg', 't'] },
      { item: '사과 한 개', answer: 'g', explanation: '사과처럼 손에 가볍게 드는 물건은 g으로 나타내요.', choices: ['g', 'kg', 't'] },
      { item: '수박 한 통', answer: 'kg', explanation: '수박처럼 제법 무거운 물건은 kg으로 나타내면 알맞아요.', choices: ['g', 'kg', 't'] },
      { item: '초등학생 한 명', answer: 'kg', explanation: '사람의 몸무게는 kg으로 나타내면 알맞아요.', choices: ['g', 'kg', 't'] },
      { item: '큰 화물차 한 대', answer: 't', explanation: '화물차처럼 매우 무거운 것은 t으로 나타내면 알맞아요.', choices: ['g', 'kg', 't'] },
      { item: '코끼리 한 마리', answer: 't', explanation: '코끼리처럼 매우 무거운 동물은 t으로 나타낼 수 있어요.', choices: ['g', 'kg', 't'] },
    ];
    const example = pick(examples, random);
    return choiceQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: [1], unit: example.answer as 'g' | 'kg' | 't', labels: [example.item] }, prompt: `${example.item}의 무게를 나타내기에 알맞은 단위는 무엇일까요?`, hints: ['물건을 실제로 들어 본 느낌을 떠올려요.', '가벼운 것은 g, 사람이 들 만한 것은 kg을 많이 사용해요.', '자동차처럼 매우 무거운 것은 t을 사용해요.'], explanation: example.explanation }, example.answer, example.choices.map(value => ({ label: value, value })));
  }
  if (mission === 2) {
    const capacityExamples = [
      { item: '종이컵 한 컵', answer: '200 mL', choices: ['2 mL', '200 mL', '20 L'], explanation: '종이컵 한 컵은 약 200 mL로 어림할 수 있어요.' },
      { item: '생수병 하나', answer: '500 mL', choices: ['5 mL', '500 mL', '50 L'], explanation: '작은 생수병 하나는 약 500 mL예요.' },
      { item: '우유 큰 팩', answer: '1 L', choices: ['1 mL', '1 L', '100 L'], explanation: '우유 큰 팩은 약 1 L로 어림할 수 있어요.' },
      { item: '욕조에 받는 물', answer: '150 L', choices: ['150 mL', '15 L', '150 L'], explanation: '욕조에는 많은 물이 들어가므로 약 150 L가 알맞아요.' },
    ];
    const weightExamples = [
      { item: '지우개 한 개', answer: '20 g', choices: ['20 g', '20 kg', '20 t'], explanation: '지우개는 손에 가볍게 들리므로 약 20 g이 알맞아요.' },
      { item: '고양이 한 마리', answer: '3 kg', choices: ['3 g', '3 kg', '3 t'], explanation: '고양이 한 마리는 약 3 kg으로 어림할 수 있어요.' },
      { item: '쌀 한 포대', answer: '20 kg', choices: ['20 g', '20 kg', '20 t'], explanation: '쌀 한 포대는 두 손으로 들어야 하므로 약 20 kg이 알맞아요.' },
      { item: '작은 자동차 한 대', answer: '1 t', choices: ['1 g', '1 kg', '1 t'], explanation: '자동차는 매우 무거우므로 약 1 t이 알맞아요.' },
    ];
    const example = pick(capacity ? capacityExamples : weightExamples, random);
    return choiceQuestion({ ...base, visual: { kind: 'measure', measure: capacity ? 'capacity' : 'weight', values: [1], unit: capacity ? 'L' : 'kg', labels: [example.item] }, prompt: `${example.item}의 ${capacity ? '들이' : '무게'}로 가장 알맞은 것은 무엇일까요?`, hints: ['직접 들어 보거나 담아 본 모습을 떠올려요.', '숫자와 단위를 함께 살펴봐요.', '너무 작거나 너무 큰 값을 먼저 지워 보세요.'], explanation: example.explanation }, example.answer, example.choices.map(value => ({ label: value, value })));
  }
  if (mission === 3) {
    const liters = randomInt(1, 8, random), extra = randomInt(1, 9, random) * 100, answer = liters * 1000 + extra;
    if (random() < .5) return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'capacity', values: [liters, extra], unit: 'mL', labels: [`${liters} L`, `${extra} mL`] }, prompt: `${liters} L ${extra} mL는 모두 몇 mL일까요?`, explanation: `${liters} L는 ${liters * 1000} mL이므로 모두 ${answer} mL예요.` }, answer);
    const mixed = `${liters} L ${extra} mL`;
    return choiceQuestion({ ...base, visual: { kind: 'measure', measure: 'capacity', values: [answer], unit: 'mL' }, prompt: `${answer} mL를 L와 mL로 나타내면 무엇일까요?`, explanation: `${answer} mL에서 1,000 mL가 ${liters}번 있고 ${extra} mL가 남으므로 ${mixed}예요.` }, mixed, shuffle([{ label: mixed, value: mixed }, { label: `${liters + 1} L ${extra} mL`, value: `${liters + 1} L ${extra} mL` }, { label: `${liters} L ${Math.max(0, extra - 100)} mL`, value: `${liters} L ${Math.max(0, extra - 100)} mL` }], random));
  }
  if (mission === 4) {
    const kilograms = randomInt(1, 8, random), extra = randomInt(1, 9, random) * 100, answer = kilograms * 1000 + extra;
    if (random() < .5) return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: [kilograms, extra], unit: 'g', labels: [`${kilograms} kg`, `${extra} g`] }, prompt: `${kilograms} kg ${extra} g은 모두 몇 g일까요?`, explanation: `${kilograms} kg은 ${kilograms * 1000} g이므로 모두 ${answer} g이에요.` }, answer);
    const mixed = `${kilograms} kg ${extra} g`;
    return choiceQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: [answer], unit: 'g' }, prompt: `${answer} g을 kg과 g으로 나타내면 무엇일까요?`, explanation: `${answer} g에서 1,000 g이 ${kilograms}번 있고 ${extra} g이 남으므로 ${mixed}이에요.` }, mixed, shuffle([{ label: mixed, value: mixed }, { label: `${kilograms + 1} kg ${extra} g`, value: `${kilograms + 1} kg ${extra} g` }, { label: `${kilograms} kg ${Math.max(0, extra - 100)} g`, value: `${kilograms} kg ${Math.max(0, extra - 100)} g` }], random));
  }
  const first = randomInt(12, 28, random) * 100, second = randomInt(2, 9, random) * 100, subtract = random() < .45, calculationAnswer = subtract ? first - second : first + second;
  if (mission === 5) {
    const unit = capacity ? 'mL' : 'g';
    const context = capacity
      ? pick(subtract ? ['물통에서 물을 따라 냈어요', '주스 병에서 한 컵을 나누었어요', '물약 냄비에서 병에 덜었어요'] : ['두 물병의 물을 한 통에 모았어요', '두 종류의 주스를 섞었어요', '물약 두 병을 큰 병에 합쳤어요'], random)
      : pick(subtract ? ['밀가루 봉지에서 조금 사용했어요', '찰흙 덩이에서 한 조각을 떼었어요', '과일 바구니에서 일부를 꺼냈어요'] : ['두 봉지의 견과류를 합쳤어요', '두 찰흙 덩이를 한데 모았어요', '두 과일 상자를 저울에 함께 올렸어요'], random);
    return numberQuestion({ ...base, visual: { kind: 'measure', measure: capacity ? 'capacity' : 'weight', values: [first, second], unit }, detail: context, prompt: `${first} ${unit}${subtract ? '에서' : '와'} ${second} ${unit}${subtract ? '을 덜어 내면' : '을 합하면'} 몇 ${unit}일까요?`, explanation: `${first} ${subtract ? '−' : '+'} ${second} = ${calculationAnswer}이므로 ${calculationAnswer} ${unit}예요.` }, calculationAnswer);
  }
  if (mission === 6) {
    const bottles = randomInt(2, 5, random), each = randomInt(2, 6, random) * 100, answer = bottles * each;
    const item = pick(['반짝 물약', '딸기 주스', '꽃에 줄 물', '따뜻한 우유'], random), container = pick(['병', '컵', '주전자'], random);
    return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'capacity', values: Array(bottles).fill(each), unit: 'mL', labels: Array(bottles).fill(`${each} mL`) }, prompt: `${container} 하나에 ${j(item, '을를')} ${each} mL씩 담았어요. ${bottles}${container}에는 모두 몇 mL가 들어 있을까요?`, explanation: `${each} mL씩 ${bottles}${container}이므로 ${each} × ${bottles} = ${answer} mL예요.` }, answer);
  }
  if (random() < .35) {
    const each = pick([250, 500], random), boxes = 1000 / each;
    return choiceQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: Array(boxes).fill(each), unit: 'kg' }, prompt: `${each} kg짜리 짐 ${boxes}개는 모두 몇 t일까요?`, explanation: `${each} × ${boxes} = 1,000 kg이고 1,000 kg은 1 t이에요.` }, '1 t', [{ label: '1 t', value: '1 t' }, { label: '10 t', value: '10 t' }, { label: '100 t', value: '100 t' }]);
  }
  const boxes = randomInt(2, 5, random), each = randomInt(2, 8, random), deliveryAnswer = boxes * each, item = pick(['사과', '책', '감자', '도토리', '밀가루'], random);
  return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: Array(boxes).fill(each), unit: 'kg', labels: Array(boxes).fill(`${each} kg`) }, prompt: `${item} 한 상자의 무게가 ${each} kg이에요. ${boxes}상자를 함께 옮기면 모두 몇 kg일까요?`, explanation: `${each} kg씩 ${boxes}상자이므로 ${each} × ${boxes} = ${deliveryAnswer} kg이에요.` }, deliveryAnswer);
}

function pictographQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return pictographQuestion(randomInt(0, 7, random), random);
  const value = pick([2, 5, 10], random), iconsA = randomInt(2, 6, random), iconsB = randomInt(1, 5, random), iconsC = randomInt(1, 6, random);
  const theme = pick([
    { a: '딸기', b: '포도', c: '귤', icon: '●', unit: '명', subject: '좋아하는 과일' },
    { a: '토끼', b: '다람쥐', c: '고슴도치', icon: '🐾', unit: '마리', subject: '숲에서 만난 동물' },
    { a: '맑은 날', b: '흐린 날', c: '비 온 날', icon: '☀', unit: '일', subject: '한 달 날씨' },
    { a: '동화책', b: '과학책', c: '만화책', icon: '📖', unit: '권', subject: '도서관에서 빌린 책' },
    { a: '튤립', b: '장미', c: '해바라기', icon: '✿', unit: '송이', subject: '정원에 핀 꽃' },
    { a: '월요일', b: '화요일', c: '수요일', icon: '♻', unit: '개', subject: '모은 재활용품' },
    { a: '무당벌레', b: '나비', c: '잠자리', icon: '◆', unit: '마리', subject: '관찰한 곤충' },
    { a: '빨강별', b: '파랑별', c: '노랑별', icon: '★', unit: '개', subject: '모은 별 스티커' },
  ], random);
  const rows = [{ label: theme.a, icons: iconsA }, { label: theme.b, icons: iconsB }, { label: theme.c, icons: iconsC }];
  const base = { unit: 'pictograph' as const, skill: CURRICULUM_MISSIONS.pictograph[mission].skill, visual: { kind: 'pictograph' as const, icon: theme.icon, value, unitLabel: theme.unit, rows }, hints: ['먼저 그림 하나가 나타내는 수를 확인해요.', '그림 수와 그림 하나의 값을 곱해요.', `그림 하나의 값은 ${value}${theme.unit}이에요. 그림 수에 ${j(value, '을를')} 곱해요.`] as [string, string, string] };
  if (mission === 0) return choiceQuestion({ ...base, prompt: `그림그래프에서 ${theme.icon} 하나의 값은 ${value}${theme.unit}이에요. ${j(theme.icon.repeat(3), '은는')} 모두 얼마일까요?`, explanation: `${value}${j(theme.unit, '이가')} 3묶음이므로 ${value} × 3 = ${value * 3}${theme.unit}이에요.` }, String(value * 3), numberChoices(value * 3, [-value, value, value * 2], theme.unit, random));
  if (mission === 1) {
    const answer = iconsA * value;
    return numberQuestion({ ...base, detail: theme.subject, prompt: `${theme.a} 줄에는 ${j(theme.icon, '이가')} ${iconsA}개 있어요. ${theme.a} 자료는 모두 몇 ${theme.unit}일까요?`, explanation: `${theme.icon} ${iconsA}개 × ${value}${theme.unit} = ${answer}${theme.unit}이에요.` }, answer);
  }
  if (mission === 2) {
    const total = iconsA * value;
    return numberQuestion({ ...base, detail: `${theme.a} ${total}${theme.unit} = ${theme.icon} ${iconsA}개`, prompt: `${total}${j(theme.unit, '을를')} ${theme.icon} ${iconsA}개로 나타냈어요. ${theme.icon} 하나의 값은 얼마일까요?`, explanation: `${total} ÷ ${iconsA} = ${value}이므로 ${theme.icon} 하나의 값은 ${value}${theme.unit}이에요.` }, value);
  }
  if (mission === 3) {
    const includeThree = random() < .45, iconTotal = iconsA + iconsB + (includeThree ? iconsC : 0), answer = iconTotal * value;
    return numberQuestion({ ...base, detail: theme.subject, prompt: `${theme.a}, ${theme.b}${includeThree ? `, ${theme.c}` : ''} 자료를 모두 합하면 몇 ${theme.unit}일까요?`, explanation: `그림이 모두 ${iconTotal}개이므로 ${iconTotal} × ${value} = ${answer}${theme.unit}이에요.` }, answer);
  }
  if (mission === 4) {
    const target = randomInt(2, 7, random), answer = target;
    return choiceQuestion({ ...base, detail: `${theme.a} ${target * value}${theme.unit}`, prompt: `${target * value}${j(theme.unit, '을를')} 나타내려면 ${j(theme.icon, '이가')} 몇 개 필요할까요?`, explanation: `${target * value} ÷ ${value} = ${target}이므로 ${theme.icon} ${target}개가 필요해요.` }, String(answer), numberChoices(answer, [-1, 1, 2], '개', random));
  }
  if (mission === 5) {
    const answer = `${iconsA}개`;
    return choiceQuestion({ ...base, detail: `${theme.a} 자료 ${iconsA * value}${theme.unit}`, prompt: '자료와 알맞은 그림그래프는 무엇일까요?', explanation: `${iconsA * value} ÷ ${value} = ${iconsA}이므로 ${theme.icon} ${iconsA}개인 그래프가 알맞아요.` }, answer, shuffle([iconsA, Math.max(1, iconsA - 1), iconsA + 1].map(n => ({ label: `${theme.icon.repeat(n)} (${n}개)`, value: `${n}개` })), random));
  }
  if (mission === 6) {
    const entries = [{ label: theme.a, icons: iconsA }, { label: theme.b, icons: iconsB }, { label: theme.c, icons: iconsC }], most = [...entries].sort((a, b) => b.icons - a.icons)[0];
    const tied = entries.filter(entry => entry.icons === most.icons);
    if (tied.length > 1) {
      const answer = '같아요';
      return choiceQuestion({ ...base, detail: theme.subject, prompt: `${j(tied[0].label, '와과')} ${tied[1].label} 중 더 많은 자료는 어느 쪽일까요?`, hints: ['두 줄의 그림 수를 각각 세어요.', '그림 하나의 값이 같으므로 그림 수만 비교해도 돼요.', `두 줄 모두 그림이 ${most.icons}개예요.`], explanation: `두 줄 모두 ${j(theme.icon, '이가')} ${most.icons}개이므로 자료의 수가 같아요.` }, answer, [{ label: tied[0].label, value: tied[0].label }, { label: tied[1].label, value: tied[1].label }, { label: '두 자료가 같아요', value: answer }]);
    }
    return choiceQuestion({ ...base, detail: theme.subject, prompt: '세 자료 중 가장 많은 것은 무엇일까요?', hints: ['각 줄의 그림 수를 세어요.', '그림 하나의 값은 모든 줄에서 같아요.', '그림이 가장 많은 줄을 고르면 돼요.'], explanation: `${most.label} 줄의 그림이 ${most.icons}개로 가장 많으므로 ${most.label} 자료가 가장 많아요.` }, most.label, entries.map(entry => ({ label: `${entry.label} · ${entry.icons * value}${theme.unit}`, value: entry.label })));
  }
  const pair = pick([[theme.a, iconsA, theme.b, iconsB], [theme.a, iconsA, theme.c, iconsC], [theme.b, iconsB, theme.c, iconsC]] as const, random);
  const difference = Math.abs(pair[1] - pair[3]), answer = difference * value;
  return numberQuestion({ ...base, detail: theme.subject, prompt: `${j(pair[0], '와과')} ${pair[2]} 자료는 몇 ${theme.unit} 차이 날까요?`, explanation: `그림 수의 차이는 ${difference}개이고, 그림 하나가 ${value}${j(theme.unit, '을를')} 나타내므로 ${answer}${theme.unit} 차이 나요.` }, answer);
}

const SHAPE_BUILDS = [
  { prompt: '똑같은 정사각형 모양 색종이 2장을 한 변끼리 맞붙이면 어떤 도형이 될까요?', answer: '직사각형', wrongs: ['정사각형', '삼각형'], explanation: '정사각형 2장을 한 변끼리 붙이면 네 각이 모두 직각이고 길쭉한 직사각형이 돼요.' },
  { prompt: '똑같은 직각삼각형 2장을 가장 긴 변끼리 맞붙이면 어떤 도형이 될 수 있을까요?', answer: '직사각형', wrongs: ['원', '정사각형'], explanation: '똑같은 직각삼각형 2장의 긴 변끼리 붙이면 직사각형이 될 수 있어요.' },
  { prompt: '똑같은 정사각형 4장을 2줄, 2칸으로 붙이면 어떤 도형이 될까요?', answer: '정사각형', wrongs: ['직각삼각형', '원'], explanation: '정사각형 4장을 2줄 2칸으로 붙이면 더 큰 정사각형이 돼요.' },
  { prompt: '똑같은 정사각형 3장을 한 줄로 붙이면 어떤 도형이 될까요?', answer: '직사각형', wrongs: ['정사각형', '직각삼각형'], explanation: '정사각형 3장을 한 줄로 붙이면 길쭉한 직사각형이 돼요.' },
] as const;
function shapeBuildQuestion(random: () => number): CurriculumQuestion {
  const item = pick(SHAPE_BUILDS, random);
  return choiceQuestion({ unit: 'plane', skill: '도형으로 모양 만들기', visual: { kind: 'geometry', shape: 'rectangle', label: '도형을 붙여 새 도형 만들기' }, prompt: item.prompt, hints: ['붙인 뒤의 변과 각을 상상해 봐요.', '직각이 몇 개 생기는지, 변의 길이가 어떤지 살펴봐요.', `정답은 ${item.answer}이에요.`], explanation: item.explanation }, item.answer, withChoices(item.answer, [...item.wrongs], random));
}

function planeQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return random() < .3 ? shapeBuildQuestion(random) : planeQuestion(randomInt(0, 7, random), random);
  const skill = CURRICULUM_MISSIONS.plane[mission].skill;
  const base = (shape: Extract<CurriculumVisual, { kind: 'geometry' }>['shape'], label?: string) => ({ unit: 'plane' as const, skill, visual: { kind: 'geometry' as const, shape, label } });
  if (mission === 0) return choiceQuestion({ ...base('segment', '점 ㄱ과 점 ㄴ'), prompt: '두 점 ㄱ과 ㄴ을 곧게 이은 선을 무엇이라고 할까요?', hints: ['양쪽에 끝점이 있는지 살펴봐요.', '두 점 사이만 곧게 이은 선이에요.', '두 점을 곧게 이은 부분을 선분이라고 해요.'], explanation: '두 점을 곧게 이은 선의 한 부분을 선분이라고 해요.' }, '선분', withChoices('선분', ['직선', '반직선'], random));
  if (mission === 1) {
    const ray = random() < .5;
    return choiceQuestion({ ...base(ray ? 'ray' : 'line'), prompt: ray ? '한 점에서 시작하여 한쪽으로 끝없이 뻗는 선은 무엇일까요?' : '양쪽으로 끝없이 곧게 뻗는 선은 무엇일까요?', hints: [ray ? '시작점은 있지만 다른 쪽 끝점은 없어요.' : '양쪽 모두 끝점이 없어요.', ray ? '한쪽 방향으로만 계속 뻗어요.' : '두 방향으로 계속 뻗어요.', ray ? '정답은 반직선이에요.' : '정답은 직선이에요.'], explanation: ray ? '한 점에서 시작해 한쪽으로 끝없이 뻗는 선은 반직선이에요.' : '양쪽으로 끝없이 곧게 뻗는 선은 직선이에요.' }, ray ? '반직선' : '직선', withChoices(ray ? '반직선' : '직선', ray ? ['직선', '선분'] : ['반직선', '선분'], random));
  }
  if (mission === 2) return choiceQuestion({ ...base('angle'), prompt: '한 점에서 시작한 두 반직선으로 이루어진 도형은 무엇일까요?', hints: ['두 선이 한 점에서 만나요.', '만나는 점은 꼭짓점이에요.', '한 점에서 시작한 두 반직선이 만드는 도형은 각이에요.'], explanation: '한 점에서 시작한 두 반직선으로 이루어진 도형을 각이라고 해요.' }, '각', withChoices('각', ['원', '선분'], random));
  if (mission === 3) return choiceQuestion({ ...base('right-angle'), prompt: '종이의 반듯한 모서리처럼 생긴 각을 무엇이라고 할까요?', hints: ['정사각형의 모서리를 떠올려요.', '직각 표시가 있는지 살펴봐요.', '반듯하게 꺾인 각은 직각이에요.'], explanation: '종이 모서리처럼 반듯하게 꺾인 각을 직각이라고 해요.' }, '직각', withChoices('직각', ['예각', '선분'], random));
  if (mission === 4) {
    const shape = pick(['right-triangle', 'rectangle', 'square'] as const, random), answer = shape === 'right-triangle' ? 1 : 4;
    return numberQuestion({ ...base(shape), prompt: '그림 속 도형에는 직각이 몇 개 있을까요?', hints: ['모서리마다 종이의 직각과 겹쳐 본다고 생각해요.', shape === 'right-triangle' ? '직각삼각형에는 직각이 하나 있어요.' : '네 모서리가 모두 반듯해요.', `직각은 ${answer}개예요.`], explanation: `그림에서 직각 표시에 맞는 모서리는 ${answer}개예요.` }, answer);
  }
  if (mission === 5) return choiceQuestion({ ...base('right-triangle'), prompt: '직각이 한 개 있는 삼각형의 이름은 무엇일까요?', hints: ['삼각형 안에 반듯한 모서리가 있어요.', '직각이 들어 있는 삼각형이에요.', '정답은 직각삼각형이에요.'], explanation: '직각이 한 개 있는 삼각형을 직각삼각형이라고 해요.' }, '직각삼각형', withChoices('직각삼각형', ['정사각형', '직사각형'], random));
  if (mission === 6) return choiceQuestion({ ...base('rectangle'), prompt: '네 각이 모두 직각인 사각형은 무엇일까요?', hints: ['네 개의 모서리가 모두 반듯해요.', '마주 보는 두 변의 길이가 같아요.', '이 도형은 직사각형이에요.'], explanation: '네 각이 모두 직각인 사각형을 직사각형이라고 해요.' }, '직사각형', withChoices('직사각형', ['직각삼각형', '원'], random));
  return choiceQuestion({ ...base('square'), prompt: '네 각이 모두 직각이고 네 변의 길이도 모두 같은 사각형은 무엇일까요?', hints: ['직사각형의 성질을 가지고 있어요.', '네 변의 길이가 모두 같다는 조건도 있어요.', '이 도형은 정사각형이에요.'], explanation: '네 각이 모두 직각이고 네 변의 길이가 모두 같은 사각형은 정사각형이에요.' }, '정사각형', withChoices('정사각형', ['직사각형', '직각삼각형'], random));
}

function secondsClockQuestion(random: () => number): CurriculumQuestion {
  const h = randomInt(1, 11, random), m = randomInt(1, 5, random) * 10, s = randomInt(1, 11, random) * 5, answer = `${h}시 ${m}분 ${s}초`;
  const otherSecond = s >= 30 ? s - 10 : s + 10;
  return choiceQuestion({ unit: 'lengthTime', skill: '초 단위 시각 읽기', visual: { kind: 'length-time', measure: 'time', values: [h, m, s], unit: '초', labels: [`짧은바늘 ${h}`, `긴바늘 ${m / 5}`, `초바늘 ${s / 5}`] }, prompt: `시계의 짧은바늘은 ${j(h, '와과')} ${h + 1} 사이, 긴바늘은 ${m / 5}, 초바늘은 ${j(s / 5, '을를')} 가리켜요. 몇 시 몇 분 몇 초일까요?`, hints: ['짧은바늘은 시, 긴바늘은 분, 초바늘은 초를 나타내요.', '숫자 1은 5분(5초), 2는 10분(10초)처럼 5씩 뛰어 세어 읽어요.', `긴바늘 ${j(m / 5, '은는')} ${m}분, 초바늘 ${j(s / 5, '은는')} ${s}초예요.`], explanation: `긴바늘 ${j(m / 5, '은는')} ${m}분, 초바늘 ${j(s / 5, '은는')} ${s}초이므로 ${answer}이에요.` }, answer, withChoices(answer, [`${h}시 ${s}분 ${m}초`, `${h}시 ${m}분 ${otherSecond}초`, `${h + 1}시 ${m}분 ${s}초`], random));
}

function lengthTimeQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return random() < .3 ? secondsClockQuestion(random) : lengthTimeQuestion(randomInt(0, 7, random), random);
  const skill = CURRICULUM_MISSIONS.lengthTime[mission].skill;
  const visual = (measure: 'length' | 'time', values: number[], unit: Extract<CurriculumVisual, { kind: 'length-time' }>['unit'], labels?: string[]) => ({ kind: 'length-time' as const, measure, values, unit, labels });
  const hints = (a: string, b: string, c: string): [string, string, string] => [a, b, c];
  if (mission === 0) {
    const cm = randomInt(1, 9, random), mm = randomInt(1, 9, random), answer = cm * 10 + mm;
    return numberQuestion({ unit: 'lengthTime', skill, visual: visual('length', [cm, mm], 'mm', [`${cm} cm`, `${mm} mm`]), prompt: `${cm} cm ${mm} mm는 모두 몇 mm일까요?`, hints: hints('1 cm는 10 mm예요.', `${cm} cm는 ${cm * 10} mm예요.`, `${cm * 10} + ${mm} = ${answer} mm예요.`), explanation: `${cm} cm = ${cm * 10} mm이므로 모두 ${answer} mm예요.` }, answer);
  }
  if (mission === 1) {
    const km = randomInt(1, 5, random), m = randomInt(1, 9, random) * 100, answer = km * 1000 + m;
    return numberQuestion({ unit: 'lengthTime', skill, visual: visual('length', [km, m], 'm', [`${km} km`, `${m} m`]), prompt: `${km} km ${m} m는 모두 몇 m일까요?`, hints: hints('1 km는 1,000 m예요.', `${km} km는 ${km * 1000} m예요.`, `${km * 1000} + ${m} = ${answer} m예요.`), explanation: `${km} km를 m로 바꾸어 더하면 ${answer} m예요.` }, answer);
  }
  if (mission === 2) {
    const examples = pick([
      { item: '지우개의 두께', answer: 'mm', wrongs: ['m', 'km'] }, { item: '연필의 길이', answer: 'cm', wrongs: ['mm', 'km'] },
      { item: '교실의 긴 쪽 길이', answer: 'm', wrongs: ['mm', 'km'] }, { item: '마을과 학교 사이 거리', answer: 'km', wrongs: ['mm', 'cm'] },
    ], random);
    return choiceQuestion({ unit: 'lengthTime', skill, visual: visual('length', [1], examples.answer as 'mm' | 'cm' | 'm' | 'km', [examples.item]), prompt: `${j(examples.item, '을를')} 나타내기에 가장 알맞은 단위는 무엇일까요?`, hints: hints('실제 크기나 거리를 떠올려요.', '아주 짧으면 mm, 손바닥만 하면 cm를 많이 써요.', '방 크기는 m, 먼 거리는 km를 사용해요.'), explanation: `${examples.item}에는 ${j(examples.answer, '이가')} 알맞아요.` }, examples.answer, withChoices(examples.answer, examples.wrongs, random));
  }
  if (mission === 3) {
    const first = randomInt(12, 35, random), second = randomInt(5, 24, random), answer = first + second;
    return numberQuestion({ unit: 'lengthTime', skill, visual: visual('length', [first, second], 'cm'), prompt: `${first} cm 리본과 ${second} cm 리본을 이어 붙이면 모두 몇 cm일까요?`, hints: hints('두 길이를 합해요.', `${first} + ${j(second, '을를')} 계산해요.`, `합은 ${answer} cm예요.`), explanation: `${first} + ${second} = ${answer}이므로 ${answer} cm예요.` }, answer);
  }
  if (mission === 4) {
    const whole = randomInt(2, 6, random) * 1000, used = randomInt(2, 9, random) * 100, answer = whole - used;
    return numberQuestion({ unit: 'lengthTime', skill, visual: visual('length', [whole, used], 'm'), prompt: `${whole} m 산책길에서 ${used} m를 걸었어요. 남은 길은 몇 m일까요?`, hints: hints('전체 길이에서 걸은 길이를 빼요.', `${whole} - ${j(used, '을를')} 계산해요.`, `남은 길은 ${answer} m예요.`), explanation: `${whole} - ${used} = ${answer}이므로 ${answer} m가 남아요.` }, answer);
  }
  if (mission === 5) {
    const minutes = randomInt(1, 5, random), seconds = randomInt(1, 5, random) * 10, answer = minutes * 60 + seconds;
    return numberQuestion({ unit: 'lengthTime', skill, visual: visual('time', [minutes, seconds], '초', [`${minutes}분`, `${seconds}초`]), prompt: `${minutes}분 ${seconds}초는 모두 몇 초일까요?`, hints: hints('1분은 60초예요.', `${minutes}분은 ${minutes * 60}초예요.`, `${minutes * 60} + ${seconds} = ${answer}초예요.`), explanation: `${minutes}분을 초로 바꾸어 더하면 ${answer}초예요.` }, answer);
  }
  if (mission === 6) {
    const hours = randomInt(1, 4, random), minutes = randomInt(1, 5, random) * 10, answer = hours * 60 + minutes;
    return numberQuestion({ unit: 'lengthTime', skill, visual: visual('time', [hours, minutes], '분', [`${hours}시간`, `${minutes}분`]), prompt: `${hours}시간 ${minutes}분은 모두 몇 분일까요?`, hints: hints('1시간은 60분이에요.', `${hours}시간은 ${hours * 60}분이에요.`, `${hours * 60} + ${minutes} = ${answer}분이에요.`), explanation: `${hours}시간을 분으로 바꾸어 더하면 ${answer}분이에요.` }, answer);
  }
  const start = randomInt(8, 10, random), startMinute = pick([0, 10, 20, 30], random), duration = pick([20, 30, 40, 50], random), endTotal = start * 60 + startMinute + duration, endHour = Math.floor(endTotal / 60), endMinute = endTotal % 60, answer = `${endHour}시 ${endMinute.toString().padStart(2, '0')}분`;
  return choiceQuestion({ unit: 'lengthTime', skill, visual: visual('time', [start, startMinute, duration], '분', [`${start}시 ${startMinute.toString().padStart(2, '0')}분 출발`, `${duration}분 걸림`]), prompt: `${start}시 ${startMinute.toString().padStart(2, '0')}분에 출발해 ${duration}분 동안 갔어요. 도착 시각은 언제일까요?`, hints: hints('출발 시각의 분에 걸린 시간을 더해요.', '60분이 되면 1시간을 올려요.', `도착 시각은 ${answer}이에요.`), explanation: `출발 시각에 ${duration}분을 더하면 ${answer}이에요.` }, answer, withChoices(answer, [`${start}시 ${Math.max(0, startMinute - 10).toString().padStart(2, '0')}분`, `${endHour + 1}시 ${endMinute.toString().padStart(2, '0')}분`], random));
}

function fractionDecimalQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission >= 8) return fractionDecimalQuestion(randomInt(0, 7, random), random);
  const skill = CURRICULUM_MISSIONS.fractionDecimal[mission].skill, denominator = pick([2, 3, 4, 5, 6, 8, 10], random), numerator = randomInt(1, denominator - 1, random);
  const fractionVisual = (n = numerator, d = denominator) => ({ kind: 'fraction' as const, numerator: n, denominator: d });
  const decimalVisual = (tenths: number, compare?: number) => ({ kind: 'decimal' as const, tenths, compare });
  if (mission === 0) return choiceQuestion({ unit: 'fractionDecimal', skill, visual: fractionVisual(1, denominator), prompt: `전체를 ${denominator}부분으로 똑같이 나눈 것 중 한 부분을 나타낸 분수는 무엇일까요?`, hints: ['전체를 나눈 수가 분모예요.', '고른 부분은 1개예요.', `정답은 1/${denominator}이에요.`], explanation: `전체를 ${denominator}부분으로 나눈 한 부분은 1/${denominator}이에요.` }, `1/${denominator}`, withChoices(`1/${denominator}`, [`${denominator}/1`, `2/${denominator}`], random));
  if (mission === 1) return choiceQuestion({ unit: 'fractionDecimal', skill, visual: fractionVisual(), prompt: `${denominator}칸 중 ${numerator}칸을 색칠했어요. 알맞은 분수는 무엇일까요?`, hints: ['전체 칸 수가 분모예요.', '색칠한 칸 수가 분자예요.', `정답은 ${numerator}/${denominator}이에요.`], explanation: `전체 ${denominator}칸 중 ${numerator}칸이므로 ${numerator}/${denominator}이에요.` }, `${numerator}/${denominator}`, withChoices(`${numerator}/${denominator}`, [`${denominator}/${numerator}`, `${Math.max(1, numerator - 1)}/${denominator}`], random));
  if (mission === 2) {
    const a = randomInt(2, 5, random), b = randomInt(6, 10, random), answer = `1/${a}`;
    return choiceQuestion({ unit: 'fractionDecimal', skill, visual: { kind: 'fraction', numerator: 1, denominator: a, compare: { numerator: 1, denominator: b } }, prompt: `${j(`1/${a}`, '와과')} 1/${b} 중 더 큰 분수는 무엇일까요?`, hints: ['전체의 크기는 같아요.', '똑같이 나눈 조각 수가 적을수록 한 조각은 커요.', `${j(a, '이가')} ${b}보다 작으므로 ${j(`1/${a}`, '이가')} 더 커요.`], explanation: `같은 전체를 ${a}조각으로 나눈 한 조각이 ${b}조각으로 나눈 한 조각보다 커요.` }, answer, withChoices(answer, [`1/${b}`, '같아요'], random));
  }
  if (mission === 3) {
    const d = pick([4, 5, 6, 8, 10], random), a = randomInt(1, d - 2, random), b = randomInt(a + 1, d - 1, random), answer = `${b}/${d}`;
    return choiceQuestion({ unit: 'fractionDecimal', skill, visual: { kind: 'fraction', numerator: a, denominator: d, compare: { numerator: b, denominator: d } }, prompt: `${j(`${a}/${d}`, '와과')} ${b}/${d} 중 더 큰 분수는 무엇일까요?`, hints: ['두 분수의 분모가 같아요.', '분모가 같으면 분자를 비교해요.', `${j(b, '이가')} ${a}보다 크므로 ${j(answer, '이가')} 더 커요.`], explanation: `분모가 같을 때는 분자가 큰 분수가 더 커요.` }, answer, withChoices(answer, [`${a}/${d}`, '같아요'], random));
  }
  const tenths = randomInt(1, 9, random), decimal = `0.${tenths}`;
  if (mission === 4) return choiceQuestion({ unit: 'fractionDecimal', skill, visual: decimalVisual(tenths), prompt: `전체를 10칸으로 나누어 ${tenths}칸을 색칠했어요. 소수로 나타내면 무엇일까요?`, hints: ['10분의 몇인지 먼저 생각해요.', `${j(`${tenths}/10`, '은는')} 소수 한 자리로 나타낼 수 있어요.`, `${tenths}/10 = ${decimal}이에요.`], explanation: `10분의 ${j(tenths, '은는')} 소수로 ${decimal}이에요.` }, decimal, withChoices(decimal, [`${tenths}.0`, `0.${Math.max(0, tenths - 1)}`], random));
  if (mission === 5) {
    const words = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']; const answer = `영 점 ${words[tenths]}`;
    return choiceQuestion({ unit: 'fractionDecimal', skill, visual: decimalVisual(tenths), prompt: `${j(decimal, '을를')} 바르게 읽은 것은 무엇일까요?`, hints: ['소수점 앞의 0은 영이라고 읽어요.', '소수점은 점이라고 읽어요.', `${j(decimal, '은는')} “${answer}”이라고 읽어요.`], explanation: `${j(decimal, '은는')} “${answer}”이라고 읽어요.` }, answer, withChoices(answer, [`${tenths} 점 영`, `영 분의 ${tenths}`], random));
  }
  if (mission === 6) return choiceQuestion({ unit: 'fractionDecimal', skill, visual: decimalVisual(tenths), prompt: `${j(decimal, '와과')} 같은 크기의 분수는 무엇일까요?`, hints: ['소수 한 자리는 10분의 몇을 나타내요.', '소수점 오른쪽 숫자가 분자가 돼요.', `${decimal} = ${tenths}/10이에요.`], explanation: `${j(decimal, '은는')} 10분의 ${tenths}이므로 ${j(`${tenths}/10`, '와과')} 같아요.` }, `${tenths}/10`, withChoices(`${tenths}/10`, [`10/${tenths}`, `${Math.max(1, tenths - 1)}/10`], random));
  const other = tenths === 9 ? randomInt(1, 8, random) : randomInt(tenths + 1, 9, random), answer = `0.${Math.max(tenths, other)}`;
  return choiceQuestion({ unit: 'fractionDecimal', skill, visual: decimalVisual(tenths, other), prompt: `${j(`0.${tenths}`, '와과')} 0.${other} 중 더 큰 수는 무엇일까요?`, hints: ['두 수 모두 0과 1 사이예요.', '소수점 오른쪽 숫자를 비교해요.', `${j(Math.max(tenths, other), '이가')} 더 크므로 ${j(answer, '이가')} 더 커요.`], explanation: `소수 한 자리끼리는 소수점 오른쪽 숫자가 큰 수가 더 커요.` }, answer, withChoices(answer, [`0.${Math.min(tenths, other)}`, '같아요'], random));
}

function generateRawCurriculumQuestion(unit: NewCurriculumUnitId, mission: number, random: () => number = Math.random): CurriculumQuestion {
  if (!Number.isInteger(mission) || mission < 0 || mission >= CURRICULUM_MISSIONS[unit].length) throw new Error('없는 학습 임무예요.');
  if (unit === 'plane') return planeQuestion(mission, random);
  if (unit === 'lengthTime') return lengthTimeQuestion(mission, random);
  if (unit === 'fractionDecimal') return fractionDecimalQuestion(mission, random);
  if (unit === 'circle') return circleQuestion(mission, random);
  if (unit === 'fraction') return fractionQuestion(mission, random);
  if (unit === 'measurement') return measurementQuestion(mission, random);
  return pictographQuestion(mission, random);
}

/** 숫자가 1일 때처럼 힌트 세 개가 같아지는 문제는, 겹치는 칸을 기본 안내로 바꿔요. */
function withDistinctHints(question: CurriculumQuestion): CurriculumQuestion {
  if (new Set(question.hints).size === 3 && question.hints.every(hint => hint.length > 4)) return question;
  const fallback: [string, string, string] = ['먼저 무엇을 구하는지 문제를 천천히 읽어요.', '그림과 식을 한 단계씩 살펴봐요.', question.explanation];
  const hints = question.hints.map((hint, index) => question.hints.indexOf(hint) !== index || hint.length <= 4 ? fallback[index] : hint) as [string, string, string];
  return { ...question, hints: new Set(hints).size === 3 ? hints : fallback };
}

export function generateCurriculumQuestion(unit: NewCurriculumUnitId, mission: number, random: () => number = Math.random): CurriculumQuestion {
  const variant = mission >= 0 && mission < CURRICULUM_MISSIONS[unit].length && grade3HasVariant(unit, mission) && random() < .7 ? grade3Variant(unit, mission, random) : null;
  if (variant) {
    const hints = variant.hints ?? ['문제를 천천히 읽고 무엇을 묻는지 찾아봐요.', '그림이나 알고 있는 약속을 떠올려 봐요.', variant.explanation];
    const base = { unit, skill: CURRICULUM_MISSIONS[unit][mission].skill, prompt: variant.prompt, visual: variant.visual, hints, explanation: variant.explanation };
    return withDistinctHints(variant.kind === 'number' ? numberQuestion(base, Number(variant.answer)) : choiceQuestion(base, variant.answer, withChoices(variant.answer, variant.wrongs ?? [], random)));
  }
  return withDistinctHints(generateRawCurriculumQuestion(unit, mission, random));
}

export function generateReviewQuestion(unit: CurriculumUnitId, random: () => number = Math.random): CurriculumQuestion {
  if (unit === 'multiplication') {
    const left = randomInt(12, 99, random), right = randomInt(2, 9, random), answer = left * right;
    return numberQuestion({ unit, skill: '곱셈 복습', prompt: `${left} × ${j(right, '은는')} 얼마일까요?`, visual: { kind: 'array', rows: right, columns: Math.min(10, left) }, hints: [`${j(left, '을를')} 십의 자리와 일의 자리로 나누어 보세요.`, `${Math.floor(left / 10) * 10} × ${j(right, '와과')} ${left % 10} × ${j(right, '을를')} 따로 계산해요.`, `두 계산 결과를 더하면 ${answer}이에요.`], explanation: `${left} × ${right} = ${answer}이에요.` }, answer);
  }
  if (unit === 'division') {
    const divisor = randomInt(2, 9, random), quotient = randomInt(12, 80, random), remainder = randomInt(0, divisor - 1, random), dividend = divisor * quotient + remainder, answer = `${quotient}R${remainder}`;
    const choices = shuffle([answer, `${quotient + 1}R${remainder}`, `${quotient}R${(remainder + 1) % divisor}`].map(value => ({ label: value.replace('R0', '').replace('R', ' · 나머지 '), value })), random);
    return choiceQuestion({ unit, skill: '나눗셈 복습', prompt: `${dividend} ÷ ${divisor}의 몫과 나머지를 찾아요.`, visual: { kind: 'groups', total: dividend, divisor, remainder }, hints: [`${divisor}씩 ${quotient}묶음을 만들 수 있어요.`, `${divisor} × ${quotient} = ${divisor * quotient}이에요.`, `${dividend} - ${divisor * quotient} = ${remainder}이므로 나머지는 ${remainder}예요.`], explanation: `${dividend} = ${divisor} × ${quotient} + ${remainder}이므로 몫은 ${quotient}, 나머지는 ${remainder}예요.` }, answer, choices);
  }
  if (unit === 'addition') {
    const left = randomInt(12, 70, random), right = randomInt(11, 99 - left, random), answer = left + right, tens = Math.floor(right / 10) * 10, ones = right % 10;
    return numberQuestion({ unit, skill: '덧셈 복습', prompt: `${left} + ${j(right, '은는')} 얼마일까요?`, visual: { kind: 'array', rows: 2, columns: 10 }, hints: [`${j(right, '을를')} ${j(tens, '와과')} ${ones}으로 나누어 생각해요.`, `${left} + ${tens} = ${left + tens}이에요.`, `${left + tens} + ${ones} = ${answer}이에요.`], explanation: `${left} + ${right} = ${answer}이에요.` }, answer);
  }
  if (unit === 'subtraction') {
    const left = randomInt(31, 99, random), right = randomInt(11, left - 10, random), answer = left - right, tens = Math.floor(right / 10) * 10, ones = right % 10;
    return numberQuestion({ unit, skill: '뺄셈 복습', prompt: `${left} - ${j(right, '은는')} 얼마일까요?`, visual: { kind: 'array', rows: 2, columns: 10 }, hints: [`${j(right, '을를')} ${j(tens, '와과')} ${ones}으로 나누어 차례로 빼요.`, `${left} - ${tens} = ${left - tens}이에요.`, `${left - tens} - ${ones} = ${answer}이에요.`], explanation: `${left} - ${right} = ${answer}이에요.` }, answer);
  }
  return generateCurriculumQuestion(unit, randomInt(0, 7, random), random);
}

export function answerCurriculumQuestion(question: CurriculumQuestion, value: string) {
  return value.trim() === question.answer;
}
