import { bankGen, choiceQ, dots, fmt, fracBar, fracText, j, lcm, numberQ, pick, ri, shuffle, type BankItem, ye } from './grade-helpers';
import type { VariantMap } from './grade-variants12';

const GEO = (shape: 'rectangle' | 'square' | 'right-triangle' | 'angle' | 'segment', label: string) => ({ kind: 'geometry' as const, shape, label });
const SIDES = ['위쪽', '아래쪽', '왼쪽', '오른쪽'] as const;
const MARK: Record<(typeof SIDES)[number], 'top' | 'bottom' | 'left' | 'right'> = { 위쪽: 'top', 아래쪽: 'bottom', 왼쪽: 'left', 오른쪽: 'right' };
const OPPOSITE: Record<(typeof SIDES)[number], (typeof SIDES)[number]> = { 위쪽: '아래쪽', 아래쪽: '위쪽', 왼쪽: '오른쪽', 오른쪽: '왼쪽' };
const CW: Record<(typeof SIDES)[number], (typeof SIDES)[number]> = { 위쪽: '오른쪽', 오른쪽: '아래쪽', 아래쪽: '왼쪽', 왼쪽: '위쪽' };
const CCW: Record<(typeof SIDES)[number], (typeof SIDES)[number]> = { 위쪽: '왼쪽', 왼쪽: '아래쪽', 아래쪽: '오른쪽', 오른쪽: '위쪽' };
const t = (x: number) => String(parseFloat(x.toFixed(2)));
const POLY = ['삼각형', '사각형', '오각형', '육각형', '칠각형', '팔각형'] as const;
const tf = (op: 'slide' | 'flip-h' | 'flip-v' | 'rotate-cw90' | 'rotate-ccw90' | 'rotate-180', label: string, mark: 'top' | 'bottom' | 'left' | 'right') => ({ kind: 'transform' as const, op, label, mark });

export const VARIANTS_G4: VariantMap = {
  plane: {
    0: [(r) => { const a = ri(2, 9, r), b = ri(1, 9, r), answer = a * 10000 + b * 1000; return choiceQ('plane', '만', `${a}만 ${b}천을 수로 쓰면 무엇일까요?`, fmt(answer), [fmt(a * 1000 + b * 100), fmt(a * 10000 + b * 100), fmt(a * 100000 + b * 1000)], dots('●', [{ label: '만', icons: a }, { label: '천', icons: b }]), `${a}만은 ${fmt(a * 10000)}, ${b}천은 ${fmt(b * 1000)}이므로 ${fmt(answer)}${ye(fmt(answer))}.`, r); },
         (r) => { const a = ri(2, 9, r), b = ri(1, 9, r), n = a * 10000 + b * 1000; return choiceQ('plane', '만', `${j(fmt(n), '은는')} 1만이 몇 개와 1천이 몇 개인 수일까요?`, `${a}개와 ${b}개`, [`${b}개와 ${a}개`, `${a * 10}개와 ${b}개`, `${a}개와 ${b * 10}개`], dots('●', [{ label: '만', icons: a }, { label: '천', icons: b }]), `${fmt(n)} = ${a}만 ${b}천이에요.`, r); }],
    1: [(r) => { const a = ri(2, 9, r), b = ri(1, 9, r), answer = a * 100000000 + b * 10000000; return choiceQ('plane', '억', `${a}억 ${b}천만을 수로 쓰면 무엇일까요?`, fmt(answer), [fmt(a * 10000000 + b * 1000000), fmt(a * 100000000 + b * 1000000), fmt(a * 1000000000 + b * 10000000)], dots('●', [{ label: '억', icons: a }, { label: '천만', icons: b }]), `${a}억은 ${fmt(a * 100000000)}, ${b}천만은 ${fmt(b * 10000000)}이므로 ${fmt(answer)}${ye(fmt(answer))}.`, r); },
         (r) => { const a = ri(2, 9, r); return choiceQ('plane', '억', '1억은 1만의 몇 배일까요?', '10000배', ['100배', '1000배', '100000배'], dots('●', [{ label: '억', icons: a }]), '1억은 1만이 10000개 모인 수예요.', r); }],
    2: [bankGen('plane', '조', [
      { q: '1조는 1억이 몇 개 모인 수일까요?', a: '10000개', w: ['100개', '1000개', '100000개'] }, { q: '1조를 수로 쓰면 0이 모두 몇 개 필요할까요?', a: '12개', w: ['8개', '10개', '16개'] },
      { q: '1억이 10000개 모이면 얼마일까요?', a: '1조', w: ['1000만', '10억', '100조'] }, { q: '10000억은 얼마일까요?', a: '1조', w: ['1억', '10조', '100억'] },
      { q: '2조를 수로 쓰면 무엇일까요?', a: fmt(2000000000000), w: [fmt(200000000000), fmt(20000000000000), fmt(2000000000)] }, { q: '5조를 수로 쓰면 무엇일까요?', a: fmt(5000000000000), w: [fmt(500000000000), fmt(50000000000000), fmt(5000000000)] },
      { q: '3조 4000억을 수로 쓰면 무엇일까요?', a: fmt(3400000000000), w: [fmt(340000000000), fmt(3040000000000), fmt(34000000000000)] }, { q: '1000억이 10개 모이면 얼마일까요?', a: '1조', w: ['100억', '1억', '10조'] },
      { q: '억 다음으로 큰 수의 단위는 무엇일까요?', a: '조', w: ['만', '천', '백'] },
    ], dots('●', [{ label: '조', icons: 1 }]))],
  },
  lengthTime: {
    0: [(r) => numberQ('lengthTime', '각도', '직선이 이루는 각(평각)은 몇 도일까요?', 180, GEO('angle', '평각'), '직선을 이루는 평각은 180°예요.', { hints: ['직각은 90°예요.', '평각은 직각 두 개를 이은 각이에요.', '90 + 90 = 180°예요.'] }),
        (r) => { const a = ri(1, 8, r) * 10, b = ri(1, 8, r) * 10; return numberQ('lengthTime', '각도', `${a}°인 각과 ${b}°인 각을 이어 붙이면 몇 도일까요?`, a + b, GEO('angle', `${a}° + ${b}°`), `${a} + ${b} = ${a + b}°예요.`); },
        (r) => { const a = ri(1, 8, r) * 10; return numberQ('lengthTime', '각도', `직각 90°에서 ${a}°를 빼면 몇 도일까요?`, 90 - a, GEO('angle', `90° − ${a}°`), `90 − ${a} = ${90 - a}°예요.`); },
        (r) => { const a = ri(2, 16, r) * 10; return numberQ('lengthTime', '각도', `평각 180°에서 ${a}°를 빼면 몇 도일까요?`, 180 - a, GEO('angle', `180° − ${a}°`), `180 − ${a} = ${180 - a}°예요.`); }],
  },
  fractionDecimal: {
    1: [(r) => { const dir = pick(SIDES, r), from = pick(SIDES, r), horizontal = dir === '오른쪽' || dir === '왼쪽', swaps = horizontal ? (from === '왼쪽' || from === '오른쪽') : (from === '위쪽' || from === '아래쪽'), answer = swaps ? OPPOSITE[from] : from; return choiceQ('fractionDecimal', '뒤집기', `도형을 ${j(dir, '으로')} 뒤집었어요. 원래 ${from}에 있던 ★은 뒤집은 도형에서 어느 쪽에 있을까요?`, answer, SIDES.filter(x => x !== answer) as unknown as string[], tf(horizontal ? 'flip-h' : 'flip-v', `${j(dir, '으로')} 뒤집기`, MARK[from]), swaps ? `${j(horizontal ? '오른쪽·왼쪽' : '위쪽·아래쪽', '이가')} 서로 바뀌므로 ${from}의 ★은 ${j(answer, '으로')} 가요.` : `${j(horizontal ? '위쪽과 아래쪽' : '왼쪽과 오른쪽', '은는')} 바뀌지 않으므로 ★은 그대로 ${answer}에 있어요.`, r); }],
    2: [(r) => { const op = pick(['cw', 'ccw', '180'] as const, r), from = pick(SIDES, r), answer = op === 'cw' ? CW[from] : op === 'ccw' ? CCW[from] : OPPOSITE[from], label = op === 'cw' ? '시계 방향으로 90°' : op === 'ccw' ? '시계 반대 방향으로 90°' : '180°'; return choiceQ('fractionDecimal', '돌리기', `도형을 ${label} 돌렸어요. 원래 ${from}에 있던 ★은 어느 쪽으로 옮겨 갈까요?`, answer, SIDES.filter(x => x !== answer) as unknown as string[], tf(op === 'cw' ? 'rotate-cw90' : op === 'ccw' ? 'rotate-ccw90' : 'rotate-180', `${label} 돌리기`, MARK[from]), `${label} 돌리면 ${from}에 있던 ★이 ${j(answer, '으로')} 가요.`, r); }],
    6: [(r) => { const n = ri(3, 4, r), prev = Array.from({ length: n - 1 }, (_, k) => `9 × ${'1'.repeat(k + 1)} = ${'9'.repeat(k + 1)}`).join(', '); return numberQ('fractionDecimal', '계산식 배열 규칙', `${prev}처럼 계산식에 규칙이 있어요. 9 × ${'1'.repeat(n)}의 결과는 얼마일까요?`, Number('9'.repeat(n)), dots('●', [{ label: '규칙', icons: 3 }]), `9 × ${'1'.repeat(n)} = ${'9'.repeat(n)}${ye('9'.repeat(n))}. 9가 하나씩 늘어나는 규칙이에요.`); },
         (r) => { const n = ri(4, 9, r), prev = Array.from({ length: 3 }, (_, k) => { const m = k + 1; return `1부터 ${m}까지의 합 ${(m * (m + 1)) / 2}`; }).join(', '); return numberQ('fractionDecimal', '계산식 배열 규칙', `${prev}처럼 1부터 차례로 더해요. 1부터 ${n}까지 모두 더하면 얼마일까요?`, (n * (n + 1)) / 2, dots('●', [{ label: '합', icons: 3 }]), `1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}${ye((n * (n + 1)) / 2)}.`); }],
  },
  circle: {
    0: [bankGen('circle', '수직', [
      { q: '직각으로 만나는 두 직선은 서로 어떤 관계일까요?', a: '수직', w: ['평행', '대각선'] }, { q: '두 직선이 만나 이루는 각이 90°이면 어떤 관계일까요?', a: '수직', w: ['평행', '대각선'] },
      { q: '직사각형에서 이웃한 두 변은 서로 어떤 관계일까요?', a: '수직', w: ['평행', '대각선'] }, { q: '정사각형에서 마주 보는 두 변은 서로 어떤 관계일까요?', a: '평행', w: ['수직', '대각선'] },
      { q: '삼각자의 직각을 이용해 직선에 그은 수직인 선을 무엇이라고 할까요?', a: '수선', w: ['평행선', '대각선', '반직선'] }, { q: '한 직선에 수직인 직선은 몇 개 그을 수 있을까요?', a: '셀 수 없이 많아요', w: ['1개', '2개', '4개'] },
      { q: '3시 정각일 때 시계의 시침과 분침이 이루는 각은 무엇일까요?', a: '직각', w: ['예각', '둔각'] }, { q: '수직인 두 직선이 만나서 이루는 각의 크기는 몇 도일까요?', a: '90°', w: ['45°', '60°', '180°'] },
    ], GEO('angle', '수직'))],
    2: [bankGen('circle', '사각형', [
      { q: '평행사변형의 마주 보는 두 변의 길이는 어떨까요?', a: '같아요', w: ['달라요', '한 쌍만 같아요'] }, { q: '마름모의 네 변의 길이는 어떨까요?', a: '모두 같아요', w: ['마주 보는 변만 같아요', '모두 달라요'] },
      { q: '사다리꼴에는 평행한 변이 몇 쌍 이상 있을까요?', a: '한 쌍 이상', w: ['없어요', '세 쌍'] }, { q: '직사각형의 네 각은 모두 어떤 각일까요?', a: '직각', w: ['예각', '둔각'] },
      { q: '두 대각선의 길이가 같은 사각형은 무엇일까요?', a: '직사각형', w: ['마름모', '평행사변형'] }, { q: '두 대각선이 서로 수직으로 만나는 사각형은 무엇일까요?', a: '마름모', w: ['직사각형', '평행사변형'] },
      { q: '정사각형은 직사각형이라고 할 수 있을까요?', a: '네, 네 각이 모두 직각이니까요', w: ['아니요, 변의 길이가 같으니까요', '아니요, 모양이 다르니까요'] },
      { q: '마주 보는 두 쌍의 변이 서로 평행한 사각형은 무엇일까요?', a: '평행사변형', w: ['사다리꼴', '오각형', '삼각형'] }, { q: '네 변의 길이가 모두 같고 네 각이 모두 직각인 사각형은 무엇일까요?', a: '정사각형', w: ['마름모', '직사각형', '사다리꼴'] },
    ], GEO('rectangle', '사각형'))],
    3: [bankGen('circle', '다각형', [
      { q: '곧은 선분으로만 둘러싸인 도형을 무엇이라고 할까요?', a: '다각형', w: ['원', '곡선'] }, { q: '다음 중 다각형이 아닌 것은 무엇일까요?', a: '원', w: ['삼각형', '오각형', '육각형'] },
      { q: '변의 길이와 각의 크기가 모두 같은 다각형을 무엇이라고 할까요?', a: '정다각형', w: ['마름모', '직사각형', '이등변삼각형'] }, { q: '다각형에서 변과 꼭짓점의 수는 어떨까요?', a: '서로 같아요', w: ['변이 더 많아요', '꼭짓점이 더 많아요'] },
      { q: '변이 가장 적은 다각형은 무엇일까요?', a: '삼각형', w: ['사각형', '오각형', '육각형'] },
    ], GEO('square', '다각형'))],
    4: [(r) => { const n = ri(4, 8, r), name = POLY[n - 3], total = n * (n - 3) / 2; return numberQ('circle', '대각선', `${j(name, '은는')} 한 꼭짓점에서 그을 수 있는 대각선이 ${n - 3}개예요. 대각선은 모두 몇 개일까요?`, total, GEO('square', name), `${n} × ${n - 3} ÷ 2 = ${total}개예요.`, { hints: ['대각선은 서로 이웃하지 않는 두 꼭짓점을 이은 선분이에요.', '같은 대각선을 두 번 세지 않도록 2로 나누어요.', `${n} × ${n - 3} ÷ 2 = ${total}개예요.`] }); },
         (r) => { const n = ri(4, 9, r), name = POLY[n - 3] ?? '구각형'; return numberQ('circle', '대각선', `${name}의 한 꼭짓점에서 그을 수 있는 대각선은 몇 개일까요?`, n - 3, GEO('square', name), `자기 자신과 이웃한 두 꼭짓점을 뺀 ${n} − 3 = ${n - 3}개예요.`); }],
    6: [bankGen('circle', '모양 만들기와 채우기', [
      { q: '똑같은 직각삼각형 2개를 빗변끼리 붙이면 어떤 도형이 될 수 있을까요?', a: '직사각형', w: ['원', '오각형', '육각형'] }, { q: '정삼각형 2개를 변끼리 붙이면 어떤 도형이 될까요?', a: '마름모', w: ['정사각형', '직사각형'] },
      { q: '정삼각형 3개를 한 줄로 붙이면 어떤 도형이 될까요?', a: '사다리꼴', w: ['마름모', '직사각형'] }, { q: '똑같은 정삼각형 6개를 둥글게 붙이면 어떤 도형이 될까요?', a: '정육각형', w: ['정오각형', '정팔각형'] },
      { q: '정사각형 4개를 2줄, 2칸으로 붙이면 어떤 도형이 될까요?', a: '정사각형', w: ['삼각형', '원', '오각형'] }, { q: '정사각형 2개를 변끼리 붙이면 어떤 도형이 될까요?', a: '직사각형', w: ['정사각형', '마름모'] },
      { q: '직각이등변삼각형 4개를 붙여서 만들 수 있는 도형은 무엇일까요?', a: '정사각형', w: ['원', '오각형'] },
    ], GEO('square', '모양 만들기'))],
  },
};

const LETTERS3 = ['ㄱ', 'ㄴ', 'ㄷ'] as const, LETTERS3B = ['ㄹ', 'ㅁ', 'ㅂ'] as const, LETTERS4 = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'] as const, LETTERS4B = ['ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'] as const;
const PAIRS_LCM = [[2, 3], [3, 4], [4, 6], [6, 8], [3, 5], [4, 10], [6, 9], [8, 12], [5, 10], [6, 15], [4, 5], [6, 10], [9, 12], [10, 15], [8, 10]] as const;

export const VARIANTS_G5: VariantMap = {
  circle: {
    0: [bankGen('circle', '합동', [
      { q: '두 도형이 합동이면 대응변의 길이는 어떨까요?', a: '서로 같아요', w: ['서로 달라요', '한쪽이 더 길어요'] }, { q: '두 도형이 합동이면 대응각의 크기는 어떨까요?', a: '서로 같아요', w: ['서로 달라요', '한쪽이 더 커요'] },
      { q: '합동인 두 도형의 둘레는 어떨까요?', a: '서로 같아요', w: ['서로 달라요', '한쪽이 더 길어요'] }, { q: '합동인 두 도형을 겹치면 어떻게 될까요?', a: '완전히 겹쳐요', w: ['반만 겹쳐요', '조금도 겹치지 않아요'] },
      { q: '모양은 같지만 크기가 다른 두 도형은 합동일까요?', a: '아니요, 크기가 달라요', w: ['네, 모양이 같아요', '네, 변의 수가 같아요'] }, { q: '한 도형을 뒤집거나 돌려서 다른 도형과 완전히 겹치면 두 도형은 어떤 관계일까요?', a: '합동', w: ['수직', '평행'] },
      { q: '합동인 두 삼각형에서 대응점의 수는 모두 몇 쌍일까요?', a: '3쌍', w: ['2쌍', '4쌍', '6쌍'] }, { q: '서로 합동인 두 도형의 넓이는 어떨까요?', a: '서로 같아요', w: ['서로 달라요', '한쪽이 더 넓어요'] },
    ], GEO('rectangle', '합동'))],
    1: [(r) => { const tri = r() < .5, A = tri ? LETTERS3 : LETTERS4, B = tri ? LETTERS3B : LETTERS4B, n = A.length, i = ri(0, n - 1, r), next = (i + 1) % n, kind = ri(0, 2, r), figure = tri ? '삼각형' : '사각형', head = `${figure} ${j(A.join(''), '와과')} ${figure} ${j(B.join(''), '이가')} 합동이고 점 ${A.join(', ')}의 대응점이 차례로 ${B.join(', ')}${ye(B.join(', '))}.`, visual = GEO(tri ? 'right-triangle' : 'rectangle', '합동인 두 도형'); if (kind === 0) return choiceQ('circle', '대응점', `${head} 점 ${A[i]}의 대응점은 어느 것일까요?`, B[i], B.filter((_, k) => k !== i) as string[], visual, `차례로 짝을 지으면 점 ${A[i]}의 대응점은 점 ${B[i]}${ye(B[i])}.`, r); if (kind === 1) return choiceQ('circle', '대응점', `${head} 변 ${A[i]}${A[next]}의 대응변은 어느 것일까요?`, `변 ${B[i]}${B[next]}`, B.map((_, k) => `변 ${B[k]}${B[(k + 1) % n]}`).filter((_, k) => k !== i), visual, `점 ${A[i]}→${B[i]}, 점 ${A[next]}→${B[next]}이므로 대응변은 변 ${B[i]}${B[next]}${ye(B[next])}.`, r); return choiceQ('circle', '대응점', `${head} 각 ${A[i]}의 대응각은 어느 것일까요?`, `각 ${B[i]}`, B.filter((_, k) => k !== i).map(x => `각 ${x}`), visual, `각 ${A[i]}의 대응각은 각 ${B[i]}${ye(B[i])}.`, r); }],
  },
  plane: {
    4: [(r) => { const [a, b] = pick(PAIRS_LCM, r), L = lcm(a, b); return numberQ('plane', '최소공배수', `${a}일마다 가는 가게와 ${b}일마다 가는 도서관에 오늘 함께 갔어요. 며칠 뒤에 처음으로 다시 같은 날 갈까요?`, L, dots('●', [{ label: `${a}일마다`, icons: 3 }, { label: `${b}일마다`, icons: 3 }]), `${j(a, '와과')} ${b}의 최소공배수가 ${L}이므로 ${L}일 뒤예요.`.replace(`${j(a, '와과')}`, j(a, '와과')), { hints: ['두 수의 배수를 각각 써 봐요.', '처음으로 같아지는 배수를 찾아요.', `최소공배수 ${L}${ye(L)}.`] }); },
         (r) => { const [a, b] = pick(PAIRS_LCM, r); return numberQ('plane', '최소공배수', `${j(a, '와과')} ${b}의 최소공배수는 얼마일까요?`, lcm(a, b), dots('●', [{ label: String(a), icons: 3 }, { label: String(b), icons: 3 }]), `${a}의 배수와 ${b}의 배수 중 공통인 가장 작은 수는 ${lcm(a, b)}${ye(lcm(a, b))}.`); }],
  },
  fraction: {
    1: [(r) => { const [d1, d2] = pick([[2, 3], [3, 4], [4, 6], [2, 5], [3, 5], [4, 5], [6, 8], [3, 6]] as const, r), L = lcm(d1, d2), n1 = ri(1, d1 - 1, r), n2 = ri(1, d2 - 1, r); return numberQ('fraction', '통분', `${j(`${n1}/${d1}`, '와과')} ${j(`${n2}/${d2}`, '을를')} 분모 ${j(L, '으로')} 통분하면 ${j(`${n1 * (L / d1)}/${L}`, '와과')} □/${L}${ye(L)}. □는 얼마일까요?`, n2 * (L / d2), fracBar(n2, d2), `${d2}에 ${j(L / d2, '을를')} 곱해 ${j(L, '이가')} 되므로 분자 ${n2}에도 ${j(L / d2, '을를')} 곱해 ${n2 * (L / d2)}${ye(n2 * (L / d2))}.`); },
         (r) => { const [d1, d2] = pick([[4, 6], [6, 8], [4, 10], [6, 9], [3, 4], [2, 5]] as const, r), L = lcm(d1, d2), wrong = L + 1, ks = [L, L * 2, L * 3]; return choiceQ('fraction', '통분', `분모가 ${d1}인 분수와 분모가 ${d2}인 분수를 통분할 때 공통분모가 될 수 없는 수는 무엇일까요?`, String(wrong), ks.map(String), fracBar(1, d1), `공통분모는 ${j(d1, '와과')} ${d2}의 공배수여야 해요. ${j(wrong, '은는')} 공배수가 아니에요.`, r); }],
  },
  pictograph: {
    3: [bankGen('pictograph', '가능성 표현', [
      { q: '내일 아침에 해가 뜰 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '확실하다', w: ['불가능하다', '반반이다', '~아닐 것 같다'] }, { q: '주사위를 던질 때 짝수의 눈이 나올 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '반반이다', w: ['불가능하다', '확실하다', '~아닐 것 같다'] },
      { q: '주사위를 던질 때 7의 눈이 나올 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '불가능하다', w: ['반반이다', '확실하다', '~일 것 같다'] }, { q: '10개 중 1개만 당첨인 제비를 뽑을 때 당첨될 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '~아닐 것 같다', w: ['확실하다', '~일 것 같다', '반반이다'] },
      { q: '10개 중 9개가 당첨인 제비를 뽑을 때 당첨될 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '~일 것 같다', w: ['불가능하다', '반반이다', '~아닐 것 같다'] }, { q: '파란 구슬만 들어 있는 주머니에서 빨간 구슬을 꺼낼 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '불가능하다', w: ['확실하다', '반반이다', '~일 것 같다'] },
      { q: '파란 구슬만 들어 있는 주머니에서 파란 구슬을 꺼낼 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '확실하다', w: ['불가능하다', '반반이다', '~아닐 것 같다'] }, { q: '동전을 던질 때 숫자 면이 나올 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '반반이다', w: ['불가능하다', '확실하다', '~일 것 같다'] },
      { q: '1부터 10까지 적힌 카드에서 홀수를 뽑을 가능성을 말로 나타내면 알맞은 것은 무엇일까요?', a: '반반이다', w: ['불가능하다', '확실하다', '~아닐 것 같다'] },
    ], dots('🎲', [{ label: '가능성', icons: 3 }]))],
  },
};

export const VARIANTS_G6: VariantMap = {
  circle: {
    1: [bankGen('circle', '원주율', [
      { q: '원주율은 약 얼마일까요?', a: '3.14', w: ['1.57', '6.28', '31.4'] }, { q: '(원주) ÷ (지름)의 값을 무엇이라고 할까요?', a: '원주율', w: ['반지름', '넓이', '대각선'] },
      { q: '원의 크기가 달라지면 원주율은 어떻게 될까요?', a: '변하지 않아요', w: ['커져요', '작아져요', '두 배가 돼요'] }, { q: '원주는 지름의 약 몇 배일까요?', a: '약 3.14배', w: ['약 2배', '약 6.28배', '약 1.57배'] },
      { q: '지름이 10 cm인 원의 원주는 약 몇 cm일까요? (원주율 3.14)', a: '31.4', w: ['3.14', '62.8', '314'] }, { q: '지름이 20 cm인 원의 원주는 약 몇 cm일까요? (원주율 3.14)', a: '62.8', w: ['6.28', '31.4', '628'] },
      { q: '원주를 구하는 식으로 알맞은 것은 무엇일까요?', a: '지름 × 원주율', w: ['반지름 × 반지름', '지름 ÷ 원주율', '반지름 + 원주율'] }, { q: '원주율을 3.14로 쓰는 까닭은 무엇일까요?', a: '정확한 값 대신 가까운 값을 쓰는 거예요', w: ['정확히 3.14이기 때문이에요', '원이 클수록 3.14가 커지기 때문이에요'] },
    ], { kind: 'circle', focus: 'diameter', radius: 3, unit: 'cm' })],
    4: [(r) => { const rad = ri(1, 6, r) * 2, answer = t(rad * rad * 3.14); return choiceQ('circle', '원 활용', `지름이 ${rad * 2} cm인 원 모양 피자의 넓이는 몇 cm²일까요? (원주율 3.14)`, answer, [t(rad * 3.14), t(rad * 2 * 3.14), t(rad * 2 * rad * 2 * 3.14)].filter(x => x !== answer), { kind: 'circle', focus: 'given-diameter', radius: rad, unit: 'cm' }, `반지름은 ${rad} cm이므로 ${rad} × ${rad} × 3.14 = ${answer} cm²예요.`, r); },
         (r) => { const rad = ri(1, 6, r) * 2, half = t(rad * rad * 3.14 / 2); return choiceQ('circle', '원 활용', `반지름이 ${rad} cm인 원을 반으로 잘랐어요. 반원의 넓이는 몇 cm²일까요? (원주율 3.14)`, half, [t(rad * rad * 3.14), t(rad * 3.14), t(rad * rad * 3.14 / 4)].filter(x => x !== half), { kind: 'circle', focus: 'given-radius', radius: rad, unit: 'cm' }, `원의 넓이 ${rad} × ${rad} × 3.14 = ${t(rad * rad * 3.14)}의 반이므로 ${half} cm²예요.`, r); },
         (r) => { const d = ri(2, 12, r), answer = t(d * 3.14); return choiceQ('circle', '원 활용', `지름이 ${d} cm인 원 모양 접시의 둘레는 몇 cm일까요? (원주율 3.14)`, answer, [t(d * d * 3.14), t(d / 2 * 3.14), t(d * 2 * 3.14)].filter(x => x !== answer), { kind: 'circle', focus: 'given-diameter', radius: d / 2, unit: 'cm' }, `${d} × 3.14 = ${answer} cm예요.`, r); }],
  },
  measurement: {
    0: [(r) => { const n = ri(3, 8, r), name = ['', '', '', '삼각', '사각', '오각', '육각', '칠각', '팔각'][n], forms = [['꼭짓점', `${name}기둥`, 2 * n], ['모서리', `${name}기둥`, 3 * n], ['면', `${name}기둥`, n + 2], ['꼭짓점', `${name}뿔`, n + 1], ['모서리', `${name}뿔`, 2 * n], ['면', `${name}뿔`, n + 1]] as const, [what, solid, answer] = forms[ri(0, 5, r)]; return numberQ('measurement', '각기둥과 각뿔', `${solid}의 ${j(what, '은는')} 모두 몇 개일까요?`, answer, GEO(solid.endsWith('뿔') ? 'right-triangle' : 'rectangle', solid), `${solid}의 ${j(what, '은는')} ${answer}개예요.`); }],
    2: [bankGen('measurement', '원기둥', [
      { q: '원기둥의 밑면은 어떤 모양일까요?', a: '원', w: ['삼각형', '사각형', '타원'] }, { q: '원기둥의 옆면을 펼치면 어떤 모양일까요?', a: '직사각형', w: ['원', '삼각형', '사다리꼴'] },
      { q: '원기둥의 두 밑면은 서로 어떤 관계일까요?', a: '평행하고 합동이에요', w: ['수직이에요', '크기가 달라요'] }, { q: '원기둥의 높이는 어디를 잰 길이일까요?', a: '두 밑면 사이의 거리', w: ['밑면의 둘레', '밑면의 지름'] },
      { q: '원기둥을 위에서 내려다보면 어떤 모양일까요?', a: '원', w: ['직사각형', '삼각형'] }, { q: '원기둥을 앞에서 보면 어떤 모양일까요?', a: '직사각형', w: ['원', '삼각형'] },
      { q: '원기둥의 모서리는 몇 개일까요?', a: '없어요', w: ['2개', '3개', '12개'], x: '원기둥은 곡면이어서 곧은 모서리가 없어요.' }, { q: '원기둥의 밑면은 모두 몇 개일까요?', a: '2개', w: ['1개', '3개', '4개'] },
    ], { kind: 'circle', focus: 'given-radius', radius: 3, unit: 'cm' })],
  },
  pictograph: {
    5: [(r) => { const items = [['주사위를 던질 때 3 이하의 눈이 나올 가능성', '1/2'], ['주사위를 던질 때 6의 약수의 눈이 나올 가능성', '2/3'], ['1부터 4까지 적힌 카드에서 짝수를 뽑을 가능성', '1/2'], ['1부터 5까지 적힌 카드에서 3의 배수를 뽑을 가능성', '1/5'], ['1부터 10까지 적힌 카드에서 5의 배수를 뽑을 가능성', '1/5'], ['빨간 공 1개와 파란 공 1개가 든 주머니에서 빨간 공을 꺼낼 가능성', '1/2'], ['주사위를 던질 때 1부터 6 사이의 눈이 나올 가능성', '1'], ['주사위를 던질 때 0의 눈이 나올 가능성', '0']] as const, [what, answer] = pick(items, r); return choiceQ('pictograph', '가능성을 수로', `${j(what, '을를')} 수로 나타내면 얼마일까요?`, answer, ['0', '1/2', '1', '1/6', '2/3', '1/5'].filter(x => x !== answer), dots('🎲', [{ label: '가능성', icons: 3 }]), '일어날 수 있는 경우의 수를 전체 경우의 수로 나누어 구해요. 불가능하면 0, 확실하면 1이에요.', r); }],
  },
};

void shuffle; void fracText;
export type { BankItem };
