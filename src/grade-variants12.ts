import { bankGen, choiceQ, dots, j, mix, numberQ, pick, ri, shuffle, type BankItem, type GradeGen } from './grade-helpers';
import type { NewCurriculumUnitId } from './rules';

export type VariantMap = Partial<Record<NewCurriculumUnitId, Record<number, GradeGen[]>>>;

const GEO = (shape: 'rectangle' | 'square' | 'right-triangle' | 'angle', label: string) => ({ kind: 'geometry' as const, shape, label });
const ONE = dots('📦', [{ label: '모양', icons: 1 }]);
const SOLID = ['상자 모양', '공 모양', '둥근기둥 모양'] as const;
const others = (a: string, all: readonly string[]) => all.filter(x => x !== a) as string[];

/** 입체도형 이름 문제: 물건 -> 모양 */
const solidItems = (kind: (typeof SOLID)[number], objects: readonly string[], notObjects: readonly string[], facts: readonly string[]): BankItem[] => [
  ...objects.map(o => ({ q: `${j(o, '은는')} 어떤 모양에 가까울까요?`, a: kind, w: others(kind, SOLID) })),
  ...facts.map(f => ({ q: f, a: kind, w: others(kind, SOLID) })),
  ...notObjects.map((n, i) => ({ q: '다음 중 ' + kind + '이 아닌 것은 무엇일까요?', a: n, w: objects.slice(i, i + 3).length >= 3 ? objects.slice(i, i + 3) as string[] : objects.slice(0, 3) as string[], x: `${j(n, '은는')} ${j(kind, '이가')} 아니에요.` })),
];

export const VARIANTS_G1: VariantMap = {
  circle: {
    0: [bankGen('circle', '상자 모양', solidItems('상자 모양', ['택배 상자', '주사위', '과자 상자', '냉장고', '벽돌', '두꺼운 책'], ['축구공', '통조림 캔', '구슬'], ['평평한 면이 여섯 개이고 모서리가 뾰족한 입체 모양은 무엇일까요?', '굴러가지 않고 모서리가 있는 입체 모양은 무엇일까요?']), ONE)],
    1: [bankGen('circle', '공 모양', solidItems('공 모양', ['축구공', '지구본', '야구공', '탁구공', '구슬', '수박'], ['주사위', '통조림 캔', '택배 상자'], ['어느 방향으로 굴려도 잘 굴러가는 입체 모양은 무엇일까요?', '평평한 면도 뾰족한 모서리도 없는 입체 모양은 무엇일까요?']), ONE)],
    2: [bankGen('circle', '둥근기둥 모양', solidItems('둥근기둥 모양', ['통조림 캔', '두루마리 휴지', '북', '음료수 캔', '원통 모양 풀통', '초 한 자루'], ['주사위', '구슬', '택배 상자'], ['위와 아래가 평평한 원이고 옆이 둥근 입체 모양은 무엇일까요?', '세우면 서 있고 눕히면 굴러가는 입체 모양은 무엇일까요?']), ONE)],
    3: [bankGen('circle', '세모와 네모', [
      { q: '변이 3개인 모양은 무엇일까요?', a: '세모', w: ['네모', '동그라미'] }, { q: '변이 4개인 모양은 무엇일까요?', a: '네모', w: ['세모', '동그라미'] },
      { q: '꼭짓점이 3개인 모양은 무엇일까요?', a: '세모', w: ['네모', '동그라미'] }, { q: '꼭짓점이 4개인 모양은 무엇일까요?', a: '네모', w: ['세모', '동그라미'] },
      { q: '삼각자는 어떤 모양일까요?', a: '세모', w: ['네모', '동그라미'] }, { q: '창문은 어떤 모양일까요?', a: '네모', w: ['세모', '동그라미'] },
      { q: '공책의 앞면은 어떤 모양일까요?', a: '네모', w: ['세모', '동그라미'] }, { q: '삼각김밥은 어떤 모양일까요?', a: '세모', w: ['네모', '동그라미'] },
      { q: '세모의 꼭짓점은 모두 몇 개일까요?', a: '3개', w: ['2개', '4개', '5개'] }, { q: '네모의 곧은 선은 모두 몇 개일까요?', a: '4개', w: ['3개', '5개', '6개'] },
      { q: '다음 중 세모가 아닌 것은 무엇일까요?', a: '달력', w: ['삼각자', '삼각김밥', '삼각 깃발'], x: '달력은 네모 모양이에요.' },
    ], GEO('right-triangle', '세모와 네모'))],
    4: [bankGen('circle', '동그라미', [
      { q: '동전은 어떤 모양일까요?', a: '동그라미', w: ['세모', '네모'] }, { q: '접시의 위쪽 모양은 무엇일까요?', a: '동그라미', w: ['세모', '네모'] },
      { q: '둥근 시계는 어떤 모양일까요?', a: '동그라미', w: ['세모', '네모'] }, { q: '곧은 선이 하나도 없는 모양은 무엇일까요?', a: '동그라미', w: ['세모', '네모'] },
      { q: '꼭짓점이 없는 모양은 무엇일까요?', a: '동그라미', w: ['세모', '네모'] }, { q: '어디를 만져도 뾰족하지 않은 모양은 무엇일까요?', a: '동그라미', w: ['세모', '네모'] },
      { q: '다음 중 동그라미가 아닌 모양은 무엇일까요?', a: '네모', w: ['동전', '접시', '둥근 시계'], x: '네모는 곧은 선과 꼭짓점이 있어요.' },
      { q: '다음 중 동그라미가 아닌 모양은 무엇일까요?', a: '세모', w: ['동전', '단추', '둥근 거울'], x: '세모는 곧은 선과 꼭짓점이 있어요.' },
    ], GEO('angle', '둥근 모양'))],
  },
  fractionDecimal: {
    2: [
      (r) => { const a = ri(1, 9, r); return numberQ('fractionDecimal', '10 만들기', `10에서 ${j(a, '을를')} 빼면 얼마일까요?`, 10 - a, dots('●', [{ label: `${a}`, icons: a }, { label: '남은 것', icons: 10 - a }]), `10에서 ${j(a, '을를')} 빼면 ${10 - a}예요.`); },
      (r) => { const a = ri(1, 9, r); return numberQ('fractionDecimal', '10 만들기', `□와 ${j(a, '을를')} 모으면 10이 돼요. □는 얼마일까요?`, 10 - a, dots('●', [{ label: '□', icons: 10 - a }, { label: `${a}`, icons: a }]), `${j(10 - a, '와과')} ${j(a, '을를')} 모으면 10이에요.`); },
    ],
  },
  lengthTime: {
    2: [bankGen('lengthTime', '하루의 때', [
      { q: '“아침밥을 먹어요”는 하루 중 언제 일어나는 일일까요?', a: '아침', w: ['낮', '저녁', '밤'] }, { q: '“해가 떠오르고 새가 지저귀어요”는 하루 중 언제일까요?', a: '아침', w: ['낮', '저녁', '밤'] },
      { q: '“해가 높이 떠서 놀이터에서 놀아요”는 하루 중 언제일까요?', a: '낮', w: ['아침', '저녁', '밤'] }, { q: '“점심밥을 먹어요”는 하루 중 언제일까요?', a: '낮', w: ['아침', '저녁', '밤'] },
      { q: '“노을이 붉게 물들어요”는 하루 중 언제일까요?', a: '저녁', w: ['아침', '낮', '밤'] }, { q: '“집에 돌아와 저녁밥을 먹어요”는 하루 중 언제일까요?', a: '저녁', w: ['아침', '낮', '밤'] },
      { q: '“별이 반짝이고 모두 잠들어요”는 하루 중 언제일까요?', a: '밤', w: ['아침', '낮', '저녁'] }, { q: '“잠옷으로 갈아입고 이불을 덮어요”는 하루 중 언제일까요?', a: '밤', w: ['아침', '낮', '저녁'] },
      { q: '“세수를 하고 학교에 갈 준비를 해요”는 하루 중 언제일까요?', a: '아침', w: ['낮', '저녁', '밤'] }, { q: '“달이 하늘에 떠 있어요”는 하루 중 언제일까요?', a: '밤', w: ['아침', '낮', '저녁'] },
    ], { kind: 'length-time', measure: 'time', values: [1], unit: '시간', labels: ['하루'] })],
    3: [
      (r) => { const s = ri(14, 25, r), st = ri(1, 3, r), seq = [s, s - st, s - 2 * st, s - 3 * st]; return numberQ('lengthTime', '수 규칙', `${seq.join(', ')}, □ 에서 □에 알맞은 수는 무엇일까요?`, s - 4 * st, dots('●', [{ label: `${st}씩 작아져요`, icons: st }]), `${st}씩 작아지는 규칙이므로 ${seq[3]} 다음은 ${s - 4 * st}이에요.`); },
      (r) => { const k = ri(1, 5, r), seq = [10 * k, 10 * (k + 1), 10 * (k + 2)]; return numberQ('lengthTime', '수 규칙', `${seq.join(', ')}, □ 에서 □에 알맞은 수는 무엇일까요?`, 10 * (k + 3), dots('●', [{ label: '10씩 커져요', icons: 5 }]), `10씩 커지는 규칙이므로 ${seq[2]} 다음은 ${10 * (k + 3)}이에요.`); },
      (r) => { const a = ri(1, 8, r), st = ri(1, 3, r); return numberQ('lengthTime', '수 규칙', `${a}, □, ${a + 2 * st}, ${a + 3 * st} 에서 □에 알맞은 수는 무엇일까요?`, a + st, dots('●', [{ label: `${st}씩 커져요`, icons: st }]), `${st}씩 커지는 규칙이므로 □는 ${a + st}이에요.`); },
    ],
    4: [
      (r) => { const set = pick([['🔴', '🔺', '🟦'], ['⭐', '🌙', '☀️'], ['🍎', '🍌', '🍇'], ['🐱', '🐶', '🐰']] as const, r), seq = [set[0], set[1], set[2], set[0], set[1]]; return choiceQ('lengthTime', '모양 규칙', `${seq.join(' ')} □ 에서 □에 들어갈 모양은 무엇일까요?`, set[2], [set[0], set[1]], dots(set[0], [{ label: '규칙', icons: 3 }]), `${j(set.join(' '), '이가')} 되풀이되므로 다음은 ${set[2]}예요.`, r); },
      (r) => { const set = pick([['🔴', '🔺'], ['⭐', '🌙'], ['🍎', '🍌'], ['🐱', '🐶']] as const, r), seq = [set[0], set[0], set[1], set[0], set[0], set[1], set[0]]; return choiceQ('lengthTime', '모양 규칙', `${seq.join(' ')} □ 에서 □에 들어갈 모양은 무엇일까요?`, set[0], [set[1]], dots(set[0], [{ label: '규칙', icons: 3 }]), `${set[0]} ${set[0]} ${j(set[1], '이가')} 되풀이되므로 다음은 ${set[0]}예요.`, r); },
      (r) => { const set = pick([['🔴', '🔺'], ['⭐', '🌙'], ['🍎', '🍌']] as const, r), seq = [set[0], set[1], set[1], set[0], set[1], set[1], set[0], set[1]]; return choiceQ('lengthTime', '모양 규칙', `${seq.join(' ')} □ 에서 □에 들어갈 모양은 무엇일까요?`, set[1], [set[0]], dots(set[0], [{ label: '규칙', icons: 3 }]), `${set[0]} ${set[1]} ${j(set[1], '이가')} 되풀이되므로 다음은 ${set[1]}예요.`, r); },
    ],
  },
  measurement: {
    1: [(r) => { const [heavy, light] = pick([['코끼리', '토끼'], ['수박', '포도 한 알'], ['책가방', '연필'], ['자동차', '자전거'], ['호랑이', '고양이'], ['냉장고', '의자'], ['곰', '다람쥐']] as const, r), asksHeavy = r() < .5, first = r() < .5 ? heavy : light, second = first === heavy ? light : heavy, answer = asksHeavy ? heavy : light; return choiceQ('measurement', '무게 비교', `${j(first, '와과')} ${second} 중에서 ${asksHeavy ? '더 무거운' : '더 가벼운'} 것은 무엇일까요?`, answer, [asksHeavy ? light : heavy, '무게가 같아요'], dots('⚖️', [{ label: heavy, icons: 4 }, { label: light, icons: 1 }]), `${j(heavy, '은는')} ${light}보다 무거워요.`, r); }],
  },
  pictograph: {
    1: [
      (r) => { const k = ri(2, 10, r); return numberQ('pictograph', '10개씩 묶기', `10개씩 묶음이 ${k}개이면 모두 몇 개일까요?`, k * 10, dots('🔟', [{ label: '묶음', icons: k }]), `10개씩 ${k}묶음이므로 ${k * 10}개예요.`); },
      (r) => { const k = ri(2, 9, r); return numberQ('pictograph', '10개씩 묶기', `사탕이 ${k * 10}개 있어요. 10개씩 묶으면 몇 묶음이 될까요?`, k, dots('🍬', [{ label: '묶음', icons: k }]), `${j(k * 10, '은는')} 10개씩 ${k}묶음이에요.`); },
    ],
  },
};

void shuffle; void mix;
