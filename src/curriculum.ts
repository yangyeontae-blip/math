import type { CurriculumUnitId, NewCurriculumUnitId } from './rules';

export type CurriculumQuestionKind = 'number' | 'choice';
export type CurriculumVisual =
  | { kind: 'circle'; focus: 'center' | 'radius' | 'diameter' | 'compass'; radius: number }
  | { kind: 'fraction'; numerator: number; denominator: number; groups?: number }
  | { kind: 'measure'; measure: 'capacity' | 'weight'; values: number[]; unit: 'mL' | 'L' | 'g' | 'kg' | 't' }
  | { kind: 'pictograph'; icon: string; value: number; rows: { label: string; icons: number }[] }
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

export interface CurriculumMission {
  name: string;
  kind: 'concept' | 'practice' | 'story' | 'guardian';
  skill: string;
  description: string;
}

export const CURRICULUM_MISSIONS: Record<NewCurriculumUnitId, CurriculumMission[]> = {
  circle: [
    { name: '달빛 한가운데', kind: 'concept', skill: '원의 중심', description: '원의 한가운데 점을 찾아요.' },
    { name: '중심에서 가장자리로', kind: 'concept', skill: '반지름', description: '중심과 원 위의 점을 이어요.' },
    { name: '원을 가로지르는 빛', kind: 'concept', skill: '지름', description: '중심을 지나는 선분을 찾아요.' },
    { name: '반지름 두 번', kind: 'practice', skill: '반지름과 지름', description: '지름은 반지름의 두 배임을 익혀요.' },
    { name: '지름을 반으로', kind: 'practice', skill: '지름과 반지름', description: '지름에서 반지름을 구해요.' },
    { name: '마법 컴퍼스', kind: 'practice', skill: '원 그리기', description: '컴퍼스로 원을 그리는 순서를 익혀요.' },
    { name: '달빛 연못 이야기', kind: 'story', skill: '원의 성질', description: '연못의 크기를 원의 성질로 알아봐요.' },
    { name: '수레바퀴 이야기', kind: 'story', skill: '반지름과 지름', description: '바퀴의 반지름과 지름을 찾아요.' },
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
    { name: '관측소 수호자', kind: 'guardian', skill: '그림그래프 종합', description: '읽기·비교·완성을 모두 사용해요.' },
  ],
};

const randomInt = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)];
const shuffle = <T>(items: T[], random: () => number) => items.map(value => ({ value, order: random() })).sort((a, b) => a.order - b.order).map(item => item.value);
const numberChoices = (answer: number, offsets: number[], suffix: string, random: () => number): CurriculumChoice[] => shuffle([answer, ...offsets.map(n => Math.max(0, answer + n))].filter((n, i, all) => all.indexOf(n) === i).slice(0, 4).map(n => ({ label: `${n}${suffix}`, value: String(n) })), random);
const choiceQuestion = (base: Omit<CurriculumQuestion, 'kind' | 'answer' | 'choices'>, answer: string, choices: CurriculumChoice[]): CurriculumQuestion => ({ ...base, kind: 'choice', answer, choices });
const numberQuestion = (base: Omit<CurriculumQuestion, 'kind' | 'answer'>, answer: number): CurriculumQuestion => ({ ...base, kind: 'number', answer: String(answer) });

function circleQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission === 8) return circleQuestion(randomInt(0, 7, random), random);
  const radius = randomInt(2, 9, random), diameter = radius * 2;
  const base = { unit: 'circle' as const, skill: CURRICULUM_MISSIONS.circle[mission].skill, visual: { kind: 'circle' as const, focus: (mission === 0 ? 'center' : mission === 1 ? 'radius' : mission === 5 ? 'compass' : 'diameter') as 'center' | 'radius' | 'diameter' | 'compass', radius }, hints: ['원은 한가운데 점에서 같은 거리만큼 떨어진 점들이 모인 모양이에요.', '반지름은 중심에서 원 위까지, 지름은 중심을 지나 원의 양쪽 끝까지 이어요.', `반지름 ${radius} cm라면 지름은 ${radius} cm가 두 번이에요.`] as [string, string, string] };
  if (mission === 0) return choiceQuestion({ ...base, prompt: '원의 한가운데 있는 점을 무엇이라고 할까요?', explanation: '원의 한가운데 점을 원의 중심이라고 해요.' }, '중심', ['중심', '반지름', '지름'].map(value => ({ label: value, value })));
  if (mission === 1) return choiceQuestion({ ...base, prompt: '원의 중심에서 원 위의 한 점까지 이은 선분은 무엇일까요?', explanation: '중심에서 원 위까지 이은 선분은 반지름이에요.' }, '반지름', ['반지름', '지름', '둘레'].map(value => ({ label: value, value })));
  if (mission === 2) return choiceQuestion({ ...base, prompt: '원의 중심을 지나 원 위의 두 점을 이은 선분은 무엇일까요?', explanation: '원의 중심을 지나는 가장 긴 선분은 지름이에요.' }, '지름', ['지름', '반지름', '중심'].map(value => ({ label: value, value })));
  if (mission === 3) return numberQuestion({ ...base, prompt: `반지름이 ${radius} cm인 원의 지름은 몇 cm일까요?`, explanation: `지름은 반지름의 2배이므로 ${radius} × 2 = ${diameter} cm예요.` }, diameter);
  if (mission === 4) return numberQuestion({ ...base, prompt: `지름이 ${diameter} cm인 원의 반지름은 몇 cm일까요?`, explanation: `반지름은 지름의 절반이므로 ${diameter} ÷ 2 = ${radius} cm예요.` }, radius);
  if (mission === 5) return choiceQuestion({ ...base, prompt: '컴퍼스로 원을 그릴 때 가장 먼저 할 일은 무엇일까요?', explanation: '먼저 중심을 정하고, 원하는 반지름만큼 컴퍼스를 벌려 원을 그려요.' }, '중심 정하기', [{ label: '중심 정하기', value: '중심 정하기' }, { label: '색칠부터 하기', value: '색칠부터 하기' }, { label: '지름을 접기', value: '지름을 접기' }]);
  if (mission === 6) return numberQuestion({ ...base, prompt: `달빛 연못의 중심에서 가장자리까지가 ${radius} m예요. 연못을 가로지르는 지름은 몇 m일까요?`, explanation: `${radius} m가 두 번 이어지므로 지름은 ${diameter} m예요.` }, diameter);
  return numberQuestion({ ...base, prompt: `수레바퀴의 지름이 ${diameter} cm예요. 중심에서 가장자리까지는 몇 cm일까요?`, explanation: `지름을 똑같이 둘로 나누면 반지름 ${radius} cm가 돼요.` }, radius);
}

function fractionQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission === 8) return fractionQuestion(randomInt(0, 7, random), random);
  const denominator = pick([3, 4, 5, 6, 8], random), numerator = randomInt(1, denominator - 1, random);
  const base = { unit: 'fraction' as const, skill: CURRICULUM_MISSIONS.fraction[mission].skill, visual: { kind: 'fraction' as const, numerator, denominator }, hints: ['아래 수인 분모는 전체를 똑같이 나눈 조각 수예요.', '위 수인 분자는 그중에서 고르거나 색칠한 조각 수예요.', `전체 ${denominator}조각 중 ${numerator}조각이면 ${numerator}/${denominator}이에요.`] as [string, string, string] };
  if (mission <= 1) {
    const answer = `${numerator}/${denominator}`;
    return choiceQuestion({ ...base, prompt: `전체를 ${denominator}조각으로 똑같이 나누고 ${numerator}조각을 색칠했어요. 알맞은 분수는 무엇일까요?`, explanation: `전체 ${denominator}조각이 분모, 색칠한 ${numerator}조각이 분자이므로 ${answer}이에요.` }, answer, shuffle([{ label: answer, value: answer }, { label: `${denominator}/${numerator}`, value: `${denominator}/${numerator}` }, { label: `${numerator}/${denominator + 1}`, value: `${numerator}/${denominator + 1}` }], random));
  }
  if (mission === 2 || mission >= 6) {
    const groups = randomInt(2, 5, random), total = denominator * groups, amount = numerator * groups;
    return numberQuestion({ ...base, visual: { kind: 'fraction', numerator, denominator, groups }, prompt: `${total}개의 ${mission === 6 ? '케이크 조각' : mission === 7 ? '별사탕' : '열매'} 중 ${numerator}/${denominator}은 몇 개일까요?`, explanation: `${total}개를 ${denominator}묶음으로 똑같이 나누면 한 묶음은 ${groups}개예요. 그중 ${numerator}묶음은 ${groups} × ${numerator} = ${amount}개예요.` }, amount);
  }
  if (mission === 3) {
    const improper = denominator + randomInt(1, denominator - 1, random), answer = improper > denominator ? '가분수' : '진분수';
    return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: improper, denominator }, prompt: `${improper}/${denominator}은 어떤 분수일까요?`, explanation: `분자가 분모보다 크므로 ${improper}/${denominator}은 가분수예요.` }, answer, ['진분수', '가분수', '자연수'].map(value => ({ label: value, value })));
  }
  if (mission === 4) {
    const whole = randomInt(1, 3, random), rest = randomInt(1, denominator - 1, random), improper = whole * denominator + rest, answer = `${whole} ${rest}/${denominator}`;
    return choiceQuestion({ ...base, visual: { kind: 'fraction', numerator: improper, denominator }, prompt: `${improper}/${denominator}을 대분수로 나타내면 무엇일까요?`, explanation: `${improper} = ${denominator} × ${whole} + ${rest}이므로 ${answer}이에요.` }, answer, shuffle([{ label: answer, value: answer }, { label: `${whole + 1} ${rest}/${denominator}`, value: `${whole + 1} ${rest}/${denominator}` }, { label: `${whole} ${denominator}/${rest}`, value: `${whole} ${denominator}/${rest}` }], random));
  }
  const other = numerator === denominator - 1 ? numerator - 1 : numerator + 1, answer = numerator > other ? `${numerator}/${denominator}` : `${other}/${denominator}`;
  return choiceQuestion({ ...base, prompt: `${numerator}/${denominator}과 ${other}/${denominator} 중 더 큰 분수는 무엇일까요?`, explanation: `분모가 같으면 분자가 큰 분수가 더 커요. 따라서 ${answer}이 더 커요.` }, answer, [`${numerator}/${denominator}`, `${other}/${denominator}`, `두 분수는 같아요`].map(value => ({ label: value, value })));
}

function measurementQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission === 8) return measurementQuestion(randomInt(0, 7, random), random);
  const capacity = mission === 0 || mission === 3 || mission === 6 || (mission === 2 && random() < .5) || (mission === 5 && random() < .5);
  const base = { unit: 'measurement' as const, skill: CURRICULUM_MISSIONS.measurement[mission].skill, visual: { kind: 'measure' as const, measure: capacity ? 'capacity' as const : 'weight' as const, values: [1], unit: capacity ? 'L' as const : 'kg' as const }, hints: ['단위가 서로 같아야 더하거나 비교할 수 있어요.', '1 L는 1,000 mL이고 1 kg은 1,000 g이에요.', '큰 단위 하나를 작은 단위 1,000개로 바꾸어 생각해 보세요.'] as [string, string, string] };
  if (mission === 0) return choiceQuestion({ ...base, prompt: '물통에 들어가는 물의 양을 나타내기에 알맞은 단위는 무엇일까요?', explanation: '물통의 들이는 L(리터)로 나타내면 알맞아요.' }, 'L', ['L', 'kg', 'cm'].map(value => ({ label: value, value })));
  if (mission === 1) return choiceQuestion({ ...base, prompt: '수박의 무게를 나타내기에 알맞은 단위는 무엇일까요?', explanation: '수박처럼 제법 무거운 물건은 kg으로 나타내면 알맞아요.' }, 'kg', ['mL', 'kg', 'L'].map(value => ({ label: value, value })));
  if (mission === 2) {
    const answer = capacity ? '1 L' : '3 kg', choices = capacity ? ['1 mL', '1 L', '100 L'] : ['3 g', '3 kg', '3 t'];
    return choiceQuestion({ ...base, prompt: capacity ? '우유 한 팩의 들이로 가장 알맞은 것은 무엇일까요?' : '고양이 한 마리의 무게로 가장 알맞은 것은 무엇일까요?', explanation: capacity ? '우유 한 팩은 약 1 L로 어림할 수 있어요.' : '고양이 한 마리는 약 3 kg으로 어림할 수 있어요.' }, answer, choices.map(value => ({ label: value, value })));
  }
  if (mission === 3) {
    const liters = randomInt(1, 8, random), extra = randomInt(1, 9, random) * 100, answer = liters * 1000 + extra;
    return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'capacity', values: [liters, extra], unit: 'mL' }, prompt: `${liters} L ${extra} mL는 모두 몇 mL일까요?`, explanation: `${liters} L는 ${liters * 1000} mL이므로 모두 ${answer} mL예요.` }, answer);
  }
  if (mission === 4) {
    const kilograms = randomInt(1, 8, random), extra = randomInt(1, 9, random) * 100, answer = kilograms * 1000 + extra;
    return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: [kilograms, extra], unit: 'g' }, prompt: `${kilograms} kg ${extra} g은 모두 몇 g일까요?`, explanation: `${kilograms} kg은 ${kilograms * 1000} g이므로 모두 ${answer} g이에요.` }, answer);
  }
  const first = randomInt(12, 28, random) * 100, second = randomInt(2, 9, random) * 100, subtract = random() < .45, calculationAnswer = subtract ? first - second : first + second;
  if (mission === 5) return numberQuestion({ ...base, visual: { kind: 'measure', measure: capacity ? 'capacity' : 'weight', values: [first, second], unit: capacity ? 'mL' : 'g' }, prompt: `${first} ${capacity ? 'mL' : 'g'}${subtract ? '에서' : '와'} ${second} ${capacity ? 'mL' : 'g'}${subtract ? '을 덜어 내면' : '을 합하면'} 몇 ${capacity ? 'mL' : 'g'}일까요?`, explanation: `${first} ${subtract ? '−' : '+'} ${second} = ${calculationAnswer}이므로 ${calculationAnswer} ${capacity ? 'mL' : 'g'}예요.` }, calculationAnswer);
  if (mission === 6) {
    const bottles = randomInt(2, 5, random), each = randomInt(2, 6, random) * 100, answer = bottles * each;
    return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'capacity', values: Array(bottles).fill(each), unit: 'mL' }, prompt: `${each} mL 물약을 ${bottles}병 만들면 모두 몇 mL일까요?`, explanation: `${each} mL씩 ${bottles}병이므로 ${each} × ${bottles} = ${answer} mL예요.` }, answer);
  }
  const boxes = randomInt(2, 5, random), each = randomInt(2, 8, random), deliveryAnswer = boxes * each;
  return numberQuestion({ ...base, visual: { kind: 'measure', measure: 'weight', values: Array(boxes).fill(each), unit: 'kg' }, prompt: `${each} kg짜리 짐을 ${boxes}상자 배달하면 모두 몇 kg일까요?`, explanation: `${each} kg씩 ${boxes}상자이므로 ${each} × ${boxes} = ${deliveryAnswer} kg이에요.` }, deliveryAnswer);
}

function pictographQuestion(mission: number, random: () => number): CurriculumQuestion {
  if (mission === 8) return pictographQuestion(randomInt(0, 7, random), random);
  const value = pick([2, 5, 10], random), iconsA = randomInt(2, 6, random), iconsB = randomInt(1, 5, random), rows = [{ label: '딸기', icons: iconsA }, { label: '포도', icons: iconsB }];
  const base = { unit: 'pictograph' as const, skill: CURRICULUM_MISSIONS.pictograph[mission].skill, visual: { kind: 'pictograph' as const, icon: '●', value, rows }, hints: ['먼저 그림 하나가 나타내는 수를 확인해요.', '그림 수와 그림 하나의 값을 곱해요.', `그림 하나가 ${value}을 나타내므로 그림 수에 ${value}를 곱해요.`] as [string, string, string] };
  if (mission === 0) return choiceQuestion({ ...base, prompt: `그림그래프에서 ● 하나가 ${value}명을 뜻해요. ●●●은 몇 명일까요?`, explanation: `${value}명이 3묶음이므로 ${value} × 3 = ${value * 3}명이에요.` }, String(value * 3), numberChoices(value * 3, [-value, value, value * 2], '명', random));
  if (mission === 1 || mission === 6) {
    const answer = iconsA * value;
    return numberQuestion({ ...base, prompt: `${mission === 6 ? '친구들이 좋아하는 과일을 조사했어요. ' : ''}딸기 줄은 ●가 ${iconsA}개예요. 딸기를 고른 친구는 몇 명일까요?`, explanation: `● ${iconsA}개 × ${value}명 = ${answer}명이에요.` }, answer);
  }
  if (mission === 2) {
    const total = iconsA * value;
    return numberQuestion({ ...base, detail: `딸기 ${total}명 = ● ${iconsA}개`, prompt: `딸기를 고른 ${total}명을 ● ${iconsA}개로 나타냈어요. ● 하나는 몇 명일까요?`, explanation: `${total} ÷ ${iconsA} = ${value}이므로 ● 하나는 ${value}명이에요.` }, value);
  }
  if (mission === 3) {
    const answer = (iconsA + iconsB) * value;
    return numberQuestion({ ...base, prompt: '딸기와 포도를 고른 친구는 모두 몇 명일까요?', explanation: `그림이 모두 ${iconsA + iconsB}개이므로 ${iconsA + iconsB} × ${value} = ${answer}명이에요.` }, answer);
  }
  if (mission === 4) {
    const target = randomInt(2, 7, random), answer = target;
    return choiceQuestion({ ...base, detail: `사과 ${target * value}명`, prompt: `사과를 고른 친구 ${target * value}명을 나타내려면 ●가 몇 개 필요할까요?`, explanation: `${target * value} ÷ ${value} = ${target}이므로 ● ${target}개가 필요해요.` }, String(answer), numberChoices(answer, [-1, 1, 2], '개', random));
  }
  if (mission === 5) {
    const answer = `${iconsA}개`;
    return choiceQuestion({ ...base, detail: `딸기를 고른 친구 ${iconsA * value}명`, prompt: '자료와 알맞은 그림그래프는 무엇일까요?', explanation: `${iconsA * value} ÷ ${value} = ${iconsA}이므로 ● ${iconsA}개인 그래프가 알맞아요.` }, answer, shuffle([iconsA, Math.max(1, iconsA - 1), iconsA + 1].map(n => ({ label: `● ${n}개`, value: `${n}개` })), random));
  }
  const answer = Math.abs(iconsA - iconsB) * value;
  return numberQuestion({ ...base, prompt: '딸기와 포도를 고른 친구 수는 몇 명 차이 날까요?', explanation: `그림 수의 차이는 ${Math.abs(iconsA - iconsB)}개이고, 그림 하나가 ${value}명이므로 ${answer}명 차이예요.` }, answer);
}

export function generateCurriculumQuestion(unit: NewCurriculumUnitId, mission: number, random: () => number = Math.random): CurriculumQuestion {
  if (!Number.isInteger(mission) || mission < 0 || mission >= CURRICULUM_MISSIONS[unit].length) throw new Error('없는 학습 임무예요.');
  if (unit === 'circle') return circleQuestion(mission, random);
  if (unit === 'fraction') return fractionQuestion(mission, random);
  if (unit === 'measurement') return measurementQuestion(mission, random);
  return pictographQuestion(mission, random);
}

export function generateReviewQuestion(unit: CurriculumUnitId, random: () => number = Math.random): CurriculumQuestion {
  if (unit === 'multiplication') {
    const left = randomInt(12, 99, random), right = randomInt(2, 9, random), answer = left * right;
    return numberQuestion({ unit, skill: '곱셈 복습', prompt: `${left} × ${right}은 얼마일까요?`, visual: { kind: 'array', rows: right, columns: Math.min(10, left) }, hints: [`${left}을 십의 자리와 일의 자리로 나누어 보세요.`, `${Math.floor(left / 10) * 10} × ${right}와 ${left % 10} × ${right}을 따로 계산해요.`, `두 계산 결과를 더하면 ${answer}이에요.`], explanation: `${left} × ${right} = ${answer}이에요.` }, answer);
  }
  if (unit === 'division') {
    const divisor = randomInt(2, 9, random), quotient = randomInt(12, 80, random), remainder = randomInt(0, divisor - 1, random), dividend = divisor * quotient + remainder, answer = `${quotient}R${remainder}`;
    const choices = shuffle([answer, `${quotient + 1}R${remainder}`, `${quotient}R${(remainder + 1) % divisor}`].map(value => ({ label: value.replace('R0', '').replace('R', ' · 나머지 '), value })), random);
    return choiceQuestion({ unit, skill: '나눗셈 복습', prompt: `${dividend} ÷ ${divisor}의 몫과 나머지를 찾아요.`, visual: { kind: 'groups', total: dividend, divisor, remainder }, hints: [`${divisor}씩 ${quotient}묶음을 만들 수 있어요.`, `${divisor} × ${quotient} = ${divisor * quotient}이에요.`, `${dividend} - ${divisor * quotient} = ${remainder}이므로 나머지는 ${remainder}예요.`], explanation: `${dividend} = ${divisor} × ${quotient} + ${remainder}이므로 몫은 ${quotient}, 나머지는 ${remainder}예요.` }, answer, choices);
  }
  return generateCurriculumQuestion(unit, randomInt(0, 7, random), random);
}

export function answerCurriculumQuestion(question: CurriculumQuestion, value: string) {
  return value.trim() === question.answer;
}
