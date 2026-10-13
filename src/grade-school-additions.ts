// 학교 2학기 평가에서 자주 나오는 문제 모양을 게임에도 넣어요.
// 1학년 수 배열표·부등호, 2학년 곱셈구구 말 문제와 □ 문제, 4학년 소수 읽고 쓰기, 6학년 빈칸이 있는 쌓기나무.
import { choiceQ, irago, j, numberQ, pick, ri, shuffle, ye, type GradeGen } from './grade-helpers';
import type { VariantMap } from './grade-variants12';
import type { CurriculumVisual } from './curriculum';

const NO: CurriculumVisual = { kind: 'none' };
type Rand = () => number;

// ───────────────────────── 1학년 ─────────────────────────
const tableCards = (nums: (number | '□')[]): CurriculumVisual => ({ kind: 'scene', items: nums.map(n => ({ icon: String(n) })), caption: '수 배열표의 일부' });

const arrayTableBlank: GradeGen = (r: Rand) => {
  if (r() < .35) {
    const start = ri(11, 69, r), cells = [start, start + 10, start + 20], hole = ri(1, 2, r), answer = cells[hole];
    return numberQ('pictograph', '수의 순서', `수 배열표에서 아래로 한 칸 내려가면 10이 커져요. 위에서부터 ${cells.map((n, i) => i === hole ? '□' : n).join(', ')}일 때 □에 알맞은 수는 무엇일까요?`, answer,
      tableCards(cells.map((n, i) => i === hole ? '□' : n)), `아래로 한 칸 내려갈 때마다 10씩 커지므로 □는 ${answer}${ye(answer)}.`,
      { hints: ['아래로 내려갈수록 수가 얼마씩 커지는지 알아봐요.', `${cells[hole - 1]} 아래 칸은 ${cells[hole - 1] + 10}${ye(cells[hole - 1] + 10)}.`, `□에 알맞은 수는 ${answer}${ye(answer)}.`] });
  }
  const start = ri(51, 93, r), values = Array.from({ length: 7 }, (_, i) => start + i), hole = ri(1, 5, r), answer = values[hole];
  return numberQ('pictograph', '수의 순서', `수 배열표의 한 줄이에요. □에 알맞은 수는 무엇일까요? ${values.map((n, i) => i === hole ? '□' : n).join(' ')}`, answer,
    tableCards(values.map((n, i) => i === hole ? '□' : n)), `오른쪽으로 갈수록 1씩 커지므로 □는 ${values[hole - 1]} 다음 수인 ${answer}${ye(answer)}.`,
    { hints: ['오른쪽으로 한 칸 갈 때마다 수가 얼마나 커지는지 봐요.', `□ 바로 앞의 수는 ${values[hole - 1]}${ye(values[hole - 1])}.`, `${values[hole - 1]} 다음 수는 ${answer}${ye(answer)}.`] });
};

const signChoice: GradeGen = (r: Rand) => {
  const a = ri(21, 100, r); let b = a + pick([-1, 1, -2, 2, -10, 10, -7, 7, -15, 15], r); if (b > 100 || b < 11) b = a - 5;
  const bigger = a > b, answer = bigger ? '>' : '<';
  return choiceQ('pictograph', '수 비교', `${a} □ ${b}에서 □ 안에 알맞은 부등호는 무엇일까요?`, answer, [bigger ? '<' : '>'], NO,
    `${j(a, '은는')} ${b}보다 ${bigger ? '커요' : '작아요'}. 그래서 ${a} ${answer} ${b}로 써요.`, r,
    { hints: ['먼저 두 수의 십의 자리부터 비교해요.', `${j(a, '와과')} ${b} 중 어느 수가 더 큰지 생각해요.`, `큰 수 쪽이 벌어진 부등호를 써요. ${a} ${answer} ${b}.`] });
};

// ───────────────────────── 2학년 ─────────────────────────
const THINGS: [holder: string, unit: string, item: string, counter: string][] = [
  ['한 송이', '송이', '바나나', '개'], ['한 상자', '상자', '사과', '개'], ['한 바구니', '바구니', '감', '개'],
  ['한 봉지', '봉지', '귤', '개'], ['한 통', '통', '연필', '자루'], ['한 묶음', '묶음', '풍선', '개']
];
export const timesTable: GradeGen = (r: Rand) => {
  const form = ri(0, 2, r);
  if (form === 2) {
    const a = pick([2, 3, 4, 5, 6, 7, 8, 9], r), b = ri(0, 9, r), product = a * b, hole = r() < .5 ? `□ × ${a}` : `${a} × □`;
    return numberQ('plane', '곱셈구구', `□ 안에 알맞은 수를 써넣으세요. ${hole} = ${product}`, b, NO,
      b === 0 ? '어떤 수에 0을 곱하면 항상 0이므로 □는 0이에요.' : `${a} × ${b} = ${product}이므로 □는 ${b}${ye(b)}.`,
      { hints: ['곱셈구구를 외우며 곱이 얼마가 되는 수를 찾아요.', b === 0 ? '곱이 0이 되려면 곱하는 수 중 하나가 0이어야 해요.' : `${a}단을 차례로 외워 ${j(product, '이가')} 나오는 곳을 찾아요.`, `□에 알맞은 수는 ${b}${ye(b)}.`] });
  }
  const [holder, unit, item, counter] = pick(THINGS, r), each = ri(2, 9, r), groups = ri(2, 9, r), total = each * groups;
  const rows: CurriculumVisual = { kind: 'array', rows: groups, columns: each };
  const lead = `${holder}에는 ${j(item, '이가')} ${each}${counter}씩 있어요.`;
  if (form === 0) {
    return numberQ('plane', '곱셈구구', `${lead} ${groups}${unit}에 있는 ${j(item, '은는')} 모두 몇 ${counter}일까요?`, total, rows,
      `${each} × ${groups} = ${total}이므로 모두 ${total}${counter}${ye(`${total}${counter}`)}.`,
      { hints: ['한 묶음에 몇 개씩이고 몇 묶음인지 찾아요.', `${each}개씩 ${groups}묶음이므로 ${each} × ${j(groups, '을를')} 계산해요.`, `${each} × ${groups} = ${total}`] });
  }
  const answer = `${each} × ${groups} = ${total}`;
  return choiceQ('plane', '곱셈구구', `${lead} ${groups}${unit}에 있는 ${item}의 수를 곱셈식으로 나타낸 것은 무엇일까요?`, answer,
    [`${each} + ${groups} = ${each + groups}`, `${each} × ${groups + 1} = ${each * (groups + 1)}`, `${each + 1} × ${groups} = ${(each + 1) * groups}`], rows,
    `${each}개씩 ${groups}묶음이므로 ${answer}${ye(answer)}.`, r, { hints: ['한 묶음에 몇 개씩이고 몇 묶음인지 찾아요.', `${each}개씩 ${groups}묶음은 ${each} × ${j(groups, '으로')} 나타내요.`, answer] });
};

// ───────────────────────── 4학년 ─────────────────────────
const DIGIT = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const readDigits = (digits: number[]) => digits.map(d => DIGIT[d]).join('');
const PLACE = ['', '소수 첫째 자리', '소수 둘째 자리', '소수 셋째 자리'];
const VALUE = ['', '0.1', '0.01', '0.001'];
/** 낱말 뒤에 붙일 조사만 돌려줘요(따옴표 뒤에 붙일 때 써요). */
const pt = (word: string, pair: '은는' | '을를' | '이가') => j(word, pair).slice(word.length);
const valueOf = (digit: number, place: number) => (digit * Number(VALUE[place])).toFixed(place);

const decimalReadWrite: GradeGen = (r: Rand) => {
  const form = ri(0, 3, r), distinct = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], r), skill = form === 2 ? '소수의 자릿값' : '소수 세 자리 수';
  if (form === 0 || form === 1) {
    const whole = ri(0, 9, r), d = distinct.slice(0, ri(2, 3, r)), text = `${whole}.${d.join('')}`, spoken = `${DIGIT[whole]}점 ${readDigits(d)}`;
    if (form === 0) {
      return choiceQ('measurement', skill, `${j(text, '을를')} 바르게 읽은 것은 무엇일까요?`, spoken,
        [`${DIGIT[whole]}점 ${readDigits([...d].reverse())}`, `${DIGIT[(whole + 1) % 10]}점 ${readDigits(d)}`, `${DIGIT[whole]}점 ${readDigits(d.slice(1))}`], NO,
        `소수점은 “점”이라고 읽고, 소수점 아래는 숫자를 하나씩 읽어요. ${j(text, '은는')} “${spoken}”${ye(spoken)}.`, r,
        { hints: ['소수점은 “점”이라고 읽어요.', '소수점 아래의 숫자는 자릿값 말고 숫자를 하나씩 읽어요.', `${j(text, '은는')} “${spoken}”${irago(spoken)} 읽어요.`] });
    }
    return choiceQ('measurement', skill, `“${spoken}”${pt(spoken, '을를')} 수로 바르게 쓴 것은 무엇일까요?`, text,
      [`${whole}.${[...d].reverse().join('')}`, `${whole}${d.join('')}`, `${d.join('')}.${whole}`], NO,
      `“점”은 소수점으로 쓰고 소수점 아래는 읽은 숫자를 차례로 써요. “${spoken}”${pt(spoken, '은는')} ${text}${ye(text)}.`, r,
      { hints: ['“점”은 소수점으로 써요.', '소수점 아래는 읽은 숫자를 차례로 써요.', `${text}${ye(text)}.`] });
  }
  if (form === 2) {
    const d = distinct.slice(0, 3), whole = distinct[3], place = ri(1, 3, r), digit = d[place - 1], text = `${whole}.${d.join('')}`, answer = `${PLACE[place]}, ${valueOf(digit, place)}`;
    return choiceQ('measurement', skill, `${text}에서 ${j(digit, '은는')} 소수 몇째 자리 숫자이고 얼마를 나타내는지 고르세요.`, answer,
      [1, 2, 3].filter(p => p !== place).map(p => `${PLACE[p]}, ${valueOf(digit, p)}`), NO,
      `${j(digit, '은는')} ${PLACE[place]} 숫자이므로 ${valueOf(digit, place)}${ye(valueOf(digit, place))}.`, r,
      { hints: ['소수점 바로 아래부터 소수 첫째, 둘째, 셋째 자리예요.', `${j(digit, '이가')} 소수점에서 몇 번째 자리에 있는지 세어 봐요.`, `${PLACE[place]}의 ${digit}${pt(String(digit), '은는')} ${valueOf(digit, place)}${ye(valueOf(digit, place))}.`] });
  }
  const three = r() < .5, fraction = three ? '1000분의 1' : '100분의 1', answer = three ? '0.001, 영점 영영일' : '0.01, 영점 영일';
  return choiceQ('measurement', skill, `분수 ${fraction}을 소수로 쓰고 읽은 것은 무엇일까요?`, answer,
    three ? ['0.01, 영점 영일', '0.1, 영점 일', '0.0001, 영점 영영영일'] : ['0.001, 영점 영영일', '0.1, 영점 일', '0.1, 영점 영일'], NO,
    `${fraction}은 ${three ? '0.001' : '0.01'}이라 쓰고 “${three ? '영점 영영일' : '영점 영일'}”${irago(three ? '영점 영영일' : '영점 영일')} 읽어요.`, r,
    { hints: ['분모가 10이면 0.1, 100이면 0.01이에요.', `${fraction}에서 분모의 0의 개수만큼 소수점 아래 자리가 생겨요.`, `${answer}${ye(answer)}.`] });
};

// ───────────────────────── 6학년 ─────────────────────────
/** 위에서 본 모양에 쌓기나무가 없는 칸(0)이 섞인 모양이에요. */
const STACK_LEAD = '위에서 본 모양에 쓴 수는 그 자리에 쌓은 쌓기나무의 수예요. 빈칸은 쌓기나무가 없는 자리예요.';
function irregularGrid(r: Rand) {
  const w = ri(3, 4, r), d = ri(2, 3, r);
  let heights: number[][] = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    heights = Array.from({ length: d }, () => Array.from({ length: w }, () => (r() < .3 ? 0 : ri(1, 3, r))));
    const flat = heights.flat();
    if (flat.some(h => h === 0) && flat.some(h => h >= 2) && flat.some(h => h >= 3) && heights.every(row => row.some(h => h > 0)) && Array.from({ length: w }, (_, x) => heights.some(row => row[x] > 0)).every(Boolean)) break;
  }
  return { w, heights };
}

const irregularStack: GradeGen = (r: Rand) => {
  const { w, heights } = irregularGrid(r), skill = '쌓기나무 위·앞·옆', lead = STACK_LEAD;
  const flat = heights.flat(), total = flat.reduce((a, b) => a + b, 0), visual: CurriculumVisual = { kind: 'stack-grid', heights };
  const ask = ri(0, 1, r);
  if (ask === 0) {
    return numberQ('measurement', skill, `${lead} 쌓기나무는 모두 몇 개일까요?`, total, visual,
      `수를 모두 더하면 ${flat.filter(h => h > 0).join(' + ')} = ${total}이므로 ${total}개예요.`,
      { hints: ['칸에 적힌 수가 그 자리에 쌓은 쌓기나무의 수예요.', '빈칸은 쌓기나무가 없는 자리라 더하지 않아요.', `모두 더하면 ${total}개예요.`] });
  }
  const profile = Array.from({ length: w }, (_, x) => Math.max(...heights.map(row => row[x]))), answer = profile.join('-');
  const wrongs = [profile.map((n, i) => i === 0 ? n + 1 : n).join('-'), [...profile].reverse().join('-'), profile.map((n, i) => i === w - 1 ? Math.max(1, n - 1) : n).join('-')].filter((v, i, a) => v !== answer && a.indexOf(v) === i);
  return choiceQ('measurement', skill, `${lead} 앞에서 본 모양에서 각 줄의 가장 높은 층을 왼쪽부터 나타낸 것은 무엇일까요? (예: 3-2-4)`, answer, wrongs, visual,
    `앞에서는 같은 세로줄에서 가장 높은 층만 보여요. 왼쪽부터 ${answer}${ye(answer)}.`, r,
    { hints: ['앞에서 보면 같은 세로줄에 놓인 쌓기나무가 겹쳐 보여요.', '각 세로줄에서 가장 큰 수를 찾아요.', `왼쪽부터 쓰면 ${answer}${ye(answer)}.`] });
};

/** 층별 쌓기나무 수: 1층에는 몇 개, 2층에는 몇 개처럼 위에서 본 모양의 수로 세어요. */
const layerStack: GradeGen = (r: Rand) => {
  const { heights } = irregularGrid(r), flat = heights.flat(), visual: CurriculumVisual = { kind: 'stack-grid', heights };
  const layer = pick([1, 2, 3].filter(l => flat.some(h => h >= l)), r), count = flat.filter(h => h >= layer).length;
  return numberQ('measurement', '쌓기나무', `${STACK_LEAD} ${layer}층에는 쌓기나무가 몇 개 놓여 있을까요?`, count, visual,
    `${layer}층에는 쌓기나무가 ${layer}개 이상 쌓인 자리마다 1개씩 있어요. 그런 자리가 ${count}군데이므로 ${count}개예요.`,
    { hints: [`${layer}층에 놓이려면 그 자리에 쌓기나무가 ${layer}개 이상 있어야 해요.`, `수가 ${layer} 이상인 칸을 세어 봐요.`, `${count}개예요.`] });
};

export const ADDED_VARIANTS: Record<1 | 4 | 6, VariantMap> = {
  1: { pictograph: { 2: [arrayTableBlank], 3: [signChoice] } },
  4: { measurement: { 0: [decimalReadWrite], 5: [decimalReadWrite] } },
  6: { measurement: { 1: [layerStack], 7: [irregularStack] } }
};
