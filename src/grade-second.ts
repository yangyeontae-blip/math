// 2학기 지역(시계·규칙·그래프·사각형·소수 덧셈뺄셈·합동과 대칭·평균과 가능성·원의 넓이·비례식 등)의 10단계가 서로 다른 개념을 묻도록 채운 문제들이에요.
// 각 지역의 기존 주제 뒤에 이어 붙으며, 주제 이름은 SECOND_TOPICS에 같은 순서로 적어요.
import { bankGen, choiceQ, dec, dots, fracText, irago, j, mix, numberQ, pick, ri, shuffle, ye, type GradeTable } from './grade-helpers';
import type { CurriculumVisual } from './curriculum';
import type { NewCurriculumUnitId } from './rules';

type Topics = Partial<Record<NewCurriculumUnitId, string[]>>;
const NO: CurriculumVisual = { kind: 'none' };
const geo = (shape: 'rectangle' | 'square' | 'right-triangle' | 'angle' | 'segment', label: string): CurriculumVisual => ({ kind: 'geometry', shape, label });
const clock = (h: number, m: number): CurriculumVisual => ({ kind: 'length-time', measure: 'time', values: [h, m], unit: '분', clock: true });
const barV = (labels: string[], values: number[], unit: string, hidden: number[] = [], line = false, step?: number): CurriculumVisual => ({ kind: 'bar-graph', labels, values, unit, line, hidden, step });
const circR = (radius: number): CurriculumVisual => ({ kind: 'circle', focus: 'radius-only', radius, unit: 'cm' });
const circD = (radius: number): CurriculumVisual => ({ kind: 'circle', focus: 'diameter-only', radius, unit: 'cm' });
const hour12 = (h: number) => ((h - 1) % 12 + 12) % 12 + 1;
const distinct = (count: number, min: number, max: number, r: () => number) => shuffle(Array.from({ length: max - min + 1 }, (_, k) => min + k), r).slice(0, count);
const FRUITS = ['사과', '배', '귤', '포도'] as const;

// ───────────────────────── 1학년 ─────────────────────────
const G1: Partial<GradeTable> = {
  lengthTime: [
    mix((r) => { const h = ri(1, 11, r); return choiceQ('lengthTime', '긴바늘과 짧은바늘', `시계의 긴바늘이 12를 가리키고 짧은바늘이 ${j(h, '을를')} 가리켜요. 몇 시일까요?`, `${h}시`, [`${h + 1}시`, `${Math.max(1, h - 1)}시`, `${h}시 30분`], clock(h, 0), `긴바늘이 12이면 정각이고, 짧은바늘이 가리키는 숫자가 시예요. 그래서 ${h}시예요.`, r); }, bankGen('lengthTime', '긴바늘과 짧은바늘', [
      { q: '시계에서 “몇 시”를 알려 주는 바늘은 어느 것일까요?', a: '짧은바늘', w: ['긴바늘', '시계 숫자', '시계 테두리'] },
      { q: '정각(몇 시)일 때 긴바늘은 어느 숫자를 가리킬까요?', a: '12', w: ['3', '6', '9'] },
      { q: '“몇 시 30분”일 때 긴바늘은 어느 숫자를 가리킬까요?', a: '6', w: ['12', '3', '9'] },
      { q: '시계에서 “몇 분”을 알려 주는 바늘은 어느 것일까요?', a: '긴바늘', w: ['짧은바늘', '시계 숫자', '시계 테두리'] },
      { q: '긴바늘이 6을 가리키면 30분이에요. 긴바늘이 12를 가리키면 어떤 시각일까요?', a: '정각', w: ['30분', '15분', '45분'] }
    ], NO)),
    (r) => { const h = ri(1, 11, r), half = r() < .5, answer = `${h + 1}시${half ? ' 30분' : ''}`; return choiceQ('lengthTime', '1시간 뒤의 시각', `${h}시${half ? ' 30분' : ''}에서 1시간이 지나면 몇 시${half ? ' 30분' : ''}일까요?`, answer, [`${h}시${half ? ' 30분' : ''}`, `${h + 2}시${half ? ' 30분' : ''}`, `${Math.max(1, h - 1)}시${half ? ' 30분' : ''}`], clock(h, half ? 30 : 0), `1시간이 지나면 짧은바늘이 숫자 하나만큼 움직여 ${answer}${ye(answer)}.`, r, { hints: ['1시간이 지나면 짧은바늘이 숫자 한 칸 움직여요.', `${h}에서 한 칸 더 간 숫자를 찾아봐요.`, `${answer}${ye(answer)}.`] }); },
    (r) => { const times = [[2, 0], [3, 30], [4, 0], [5, 30], [6, 0], [7, 30], [8, 0], [9, 30], [10, 0], [11, 30]] as const; const a = pick(times, r); let b = pick(times, r); while (b[0] === a[0]) b = pick(times, r); const name = (t: readonly [number, number]) => `${t[0]}시${t[1] ? ' 30분' : ''}`, later = a[0] > b[0] ? a : b, earlier = a[0] > b[0] ? b : a, asksLate = r() < .5; return choiceQ('lengthTime', '시각의 앞과 뒤', `${j(name(a), '와과')} ${name(b)} 중 ${asksLate ? '더 늦은' : '더 이른'} 시각은 무엇일까요?`, name(asksLate ? later : earlier), [name(asksLate ? earlier : later)], clock(a[0], a[1]), `시계의 짧은바늘이 더 ${asksLate ? '큰' : '작은'} 숫자 쪽에 있는 ${name(asksLate ? later : earlier)}이 더 ${asksLate ? '늦어요' : '일러요'}.`, r); },
    (r) => { const pair = pick([['🍎', '🍌'], ['🔴', '🔵'], ['⭐', '🌙'], ['🐶', '🐱']] as const, r), len = ri(4, 7, r), seq = Array.from({ length: len }, (_, i) => pair[i % 2]), answer = pair[len % 2]; return choiceQ('lengthTime', 'AB 규칙 찾기', `두 가지 모양이 번갈아 나와요. ${seq.join(' ')} □ 에서 □에 들어갈 모양은 무엇일까요?`, answer, [pair[0] === answer ? pair[1] : pair[0]], NO, `${pair.join('와 ')}가 번갈아 나오므로 □는 ${answer}${ye(answer)}.`, r); },
    (r) => { const pair = pick([['🍎', '🍌'], ['🔴', '🔵'], ['⭐', '🌙'], ['🐶', '🐱']] as const, r), unit = [pair[0], pair[0], pair[1]], len = ri(4, 7, r), seq = Array.from({ length: len }, (_, i) => unit[i % 3]), answer = unit[len % 3]; return choiceQ('lengthTime', '세 칸 규칙 찾기', `${pair[0]} ${pair[0]} ${pair[1]} 순서가 되풀이돼요. ${seq.join(' ')} □ 에서 □에 들어갈 모양은 무엇일까요?`, answer, [answer === pair[0] ? pair[1] : pair[0]], NO, `${unit.join(' ')}이 되풀이되므로 □는 ${answer}${ye(answer)}.`, r); }
  ],
  fraction: [
    (r) => { const names = pick([['🍎', '🍌', '🍇', '🍓', '🍊'], ['🐶', '🐱', '🐰', '🐻', '🐼'], ['🚗', '🚌', '🚲', '🚂', '✈️']] as const, r), middle = r() < .5, i = ri(1, 3, r); return choiceQ('fraction', '가운데와 사이', middle ? `왼쪽부터 ${names.join(', ')} 순서로 한 줄로 있어요. 가운데에 있는 것은 무엇일까요?` : `왼쪽부터 ${names.join(', ')} 순서로 한 줄로 있어요. ${names[i - 1]}와 ${names[i + 1]} 사이에 있는 것은 무엇일까요?`, middle ? names[2] : names[i], names.filter((_, k) => k !== (middle ? 2 : i)).slice(0, 3), { kind: 'scene', items: names.map(icon => ({ icon })), caption: '왼쪽 → 오른쪽' }, middle ? '다섯 개 가운데 셋째가 가운데예요.' : `${names[i - 1]}와 ${names[i + 1]} 사이는 ${names[i]}${ye(names[i])}.`, r); },
    (r) => { const n = ri(5, 9, r), k = ri(2, n - 1, r), answer = n - k + 1; return numberQ('fraction', '반대쪽에서 세기', `모두 ${n}명이 한 줄로 서 있어요. 서아는 앞에서 ${k}번째예요. 서아는 뒤에서 몇 번째일까요?`, answer, dots('🧒', [{ label: '줄', icons: n }]), `${n}명 중 앞에서 ${k}번째이면 뒤에서는 ${n} − ${k} + 1 = ${answer}번째예요.`, { hints: ['앞에 선 사람과 뒤에 선 사람을 따로 세어 봐요.', `앞에 ${k - 1}명이 있고, 서아 뒤에는 ${n - k}명이 있어요.`, `뒤에서 ${n - k}명 다음이니까 ${answer}번째예요.`] }); },
    (r) => { const front = ri(2, 8, r), name = pick(['서준', '하윤', '도현', '지우'], r); return numberQ('fraction', '줄 서기 순서', `줄을 서 있어요. ${name} 앞에 ${front}명이 서 있어요. ${j(name, '은는')} 앞에서 몇 번째일까요?`, front + 1, dots('🧒', [{ label: '앞', icons: Math.min(front, 9) }]), `앞의 ${front}명 다음이므로 ${front + 1}번째예요.`, { hints: ['앞에 서 있는 사람 다음 자리를 생각해요.', `${front}명 다음 사람은 몇 번째일까요?`, `${front} + 1 = ${front + 1}번째예요.`] }); },
    (r) => { const a = ri(1, 5, r), b = ri(1, 5, r), c = ri(1, 5, r), floors = r() < .5 ? 2 : 3, parts = [a, b, c].slice(0, floors), total = parts.reduce((x, y) => x + y, 0); return numberQ('fraction', '쌓은 개수 세기', `쌓기나무를 ${floors}층으로 쌓았어요. ${parts.map((p, i) => `${i + 1}층에 ${p}개`).join(', ')}예요. 쌓기나무는 모두 몇 개일까요?`, total, dots('🧱', parts.map((p, i) => ({ label: `${i + 1}층`, icons: p }))), `${parts.join(' + ')} = ${total}개예요.`); },
    (r) => { const n = ri(2, 9, r), asksTop = r() < .5; return numberQ('fraction', '층 위치', `쌓기나무를 ${n}층으로 쌓았어요. ${asksTop ? '맨 위' : '맨 아래'}에 있는 쌓기나무는 몇 층일까요?`, asksTop ? n : 1, dots('🧱', Array.from({ length: n }, (_, i) => ({ label: `${i + 1}층`, icons: 1 }))), asksTop ? `${n}층까지 쌓았으므로 맨 위는 ${n}층이에요.` : '맨 아래는 1층이에요.'); }
  ],
  pictograph: [
    (r) => { const tens = ri(1, 9, r), ones = ri(0, 9, r), n = tens * 10 + ones; return choiceQ('pictograph', '몇 묶음과 낱개', `${j(n, '은는')} 10개씩 묶음 몇 개와 낱개 몇 개일까요?`, `${tens}묶음과 ${ones}개`, [`${ones}묶음과 ${tens}개`, `${tens + 1}묶음과 ${ones}개`, `${tens}묶음과 ${(ones + 1) % 10}개`], NO, `${j(n, '은는')} 10개씩 ${tens}묶음과 낱개 ${ones}개예요.`, r); },
    (r) => { const plus = r() < .5, n = plus ? ri(10, 99, r) : ri(11, 100, r); return numberQ('pictograph', '1 큰 수와 1 작은 수', `${n}보다 1 ${plus ? '큰' : '작은'} 수는 무엇일까요?`, plus ? n + 1 : n - 1, NO, `${n}보다 1 ${plus ? '큰' : '작은'} 수는 ${plus ? n + 1 : n - 1}${ye(plus ? n + 1 : n - 1)}.`); },
    (r) => { const plus = r() < .5, n = plus ? ri(10, 90, r) : ri(20, 100, r), answer = plus ? n + 10 : n - 10; return numberQ('pictograph', '10 큰 수와 10 작은 수', `${n}보다 10 ${plus ? '큰' : '작은'} 수는 무엇일까요?`, answer, NO, `10개씩 묶음이 하나 ${plus ? '늘어나' : '줄어들어'} ${answer}${ye(answer)}.`, { hints: ['10개씩 묶음의 수가 어떻게 달라질지 생각해요.', `${n}에서 10개씩 묶음 하나를 ${plus ? '더해' : '빼'} 봐요.`, `${answer}${ye(answer)}.`] }); },
    (r) => { const ONES = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], TENS = ['', '십', '이십', '삼십', '사십', '오십', '육십', '칠십', '팔십', '구십'], tens = ri(2, 9, r), ones = ri(1, 9, r), n = tens * 10 + ones, word = `${TENS[tens]}${ONES[ones]}`; if (r() < .5) { return choiceQ('pictograph', '수 읽고 쓰기', `${j(n, '을를')} 한자어 수(일, 이, 삼, …)로 읽으면 어떻게 읽을까요?`, word, [`${TENS[ones]}${ONES[tens]}`, `${TENS[Math.min(9, tens + 1)]}${ONES[ones]}`, `${TENS[tens]}${ONES[Math.min(9, ones % 9 + 1)]}`], NO, `${j(n, '은는')} 십의 자리가 ${tens}, 일의 자리가 ${ones}이므로 “${word}”${irago(word)} 읽어요.`, r); } return numberQ('pictograph', '수 읽고 쓰기', `어떤 수를 “${word}”라고 읽었어요. 이 수를 숫자로 쓰면 무엇일까요?`, n, NO, `${word}은 십의 자리가 ${tens}, 일의 자리가 ${ones}이므로 ${n}${ye(n)}.`); },
    (r) => { const set = new Set<number>(); while (set.size < 3) set.add(ri(10, 99, r)); const nums = [...set], big = r() < .5, answer = big ? Math.max(...nums) : Math.min(...nums); return choiceQ('pictograph', '세 수 크기 비교', `${nums.join(', ')} 중 가장 ${big ? '큰' : '작은'} 수는 무엇일까요?`, String(answer), nums.filter(n => n !== answer).map(String), NO, `십의 자리부터 비교하면 ${j(answer, '이가')} 가장 ${big ? '커요' : '작아요'}.`, r); }
  ]
};

// ───────────────────────── 2학년 ─────────────────────────
const G2: Partial<GradeTable> = {
  lengthTime: [
    (r) => { const h = ri(1, 10, r), m = pick([0, 10, 20, 30], r), d = pick([10, 20, 30].filter(x => m + x < 60), r); return numberQ('lengthTime', '걸린 시간', `${h}시${m ? ` ${m}분` : ''}에 숙제를 시작해서 ${h}시 ${m + d}분에 끝냈어요. 숙제를 하는 데 몇 분 걸렸을까요?`, d, clock(h, m), `${m}분에서 ${m + d}분까지 ${d}분이 지났어요.`, { hints: ['시작한 시각과 끝낸 시각의 분이 얼마나 차이가 나는지 봐요.', `${m + d} − ${m}을 계산해요.`, `${d}분이에요.`] }); },
    (r) => { const h = ri(1, 12, r), m = pick([0, 10, 20, 30, 40, 50], r), n = ri(1, 3, r), answer = `${hour12(h + n)}시${m ? ` ${m}분` : ''}`; return choiceQ('lengthTime', '몇 시간 뒤 시각', `${h}시${m ? ` ${m}분` : ''}에서 ${n}시간이 지나면 몇 시${m ? ' 몇 분' : ''}일까요?`, answer, [`${hour12(h + n + 1)}시${m ? ` ${m}분` : ''}`, `${hour12(h + Math.max(1, n - 1) )}시${m ? ` ${m}분` : ''}`, `${hour12(h + n)}시${m === 30 ? '' : ' 30분'}`], clock(h, m), `${n}시간이 지나면 시는 ${n}만큼 커지고 분은 그대로여서 ${answer}${ye(answer)}.`, r); },
    (r) => { const events = [['아침 식사 시각', [6, 7, 8], '오전'], ['학교에 가는 시각', [7, 8, 9], '오전'], ['점심 시각', [12, 1], '오후'], ['학교가 끝나는 시각', [1, 2, 3, 4], '오후'], ['저녁 식사 시각', [5, 6, 7], '오후'], ['잠자리에 드는 시각', [8, 9, 10], '오후'], ['아침에 일어나는 시각', [6, 7, 8], '오전']] as const, [name, hours, ampm] = pick(events, r), h = pick(hours, r), other = ampm === '오전' ? '오후' : '오전'; return choiceQ('lengthTime', '오전과 오후', `${j(name, '은는')} ${h}시예요. 알맞게 말한 것은 무엇일까요?`, `${ampm} ${h}시`, [`${other} ${h}시`, `${ampm} ${hour12(h + 1)}시`, `${other} ${hour12(h + 1)}시`], clock(h, 0), `낮 12시 전은 오전, 낮 12시 후는 오후예요. ${name}은 ${ampm} ${h}시예요.`, r); },
    (r) => { const h = ri(1, 3, r), m = pick([10, 20, 30, 40, 50], r), total = h * 60 + m, answer = `${h}시간 ${m}분`; return choiceQ('lengthTime', '분을 시간으로 바꾸기', `${total}분은 몇 시간 몇 분일까요?`, answer, [`${h + 1}시간 ${m}분`, `${Math.max(1, h - 1)}시간 ${m}분`, `${h}시간 ${m === 30 ? 20 : 30}분`], NO, `${total}분에서 60분씩 묶어 ${h}시간(${h * 60}분)을 빼면 ${m}분이 남아 ${answer}이에요.`, r, { hints: ['1시간은 60분이에요.', `${total}분에서 60분을 몇 번 뺄 수 있는지 세어 봐요.`, `${answer}이에요.`] }); },
    (r) => { const m = ri(3, 11, r), d = ri(1, 10, r), weeks = ri(1, 2, r), answer = d + weeks * 7; return numberQ('lengthTime', '며칠 뒤 날짜', `${m}월 ${d}일에서 ${weeks}주일 뒤는 ${m}월 며칠일까요? (1주일은 7일이에요)`, answer, NO, `${weeks}주일은 ${weeks * 7}일이므로 ${d} + ${weeks * 7} = ${answer}일이에요.`, { hints: ['1주일은 7일이에요.', `${weeks}주일은 며칠인지 먼저 구해요.`, `${d} + ${weeks * 7} = ${answer}일이에요.`] }); }
  ],
  fraction: [
    (r) => { const a = ri(2, 6, r), b = ri(2, 6, r), s = a + b, dir = pick(['오른쪽', '아래쪽', '왼쪽', '위쪽'] as const, r), step = ri(1, 2, r), up = dir === '오른쪽' || dir === '아래쪽', answer = up ? s + step : s - step; return numberQ('fraction', '덧셈표의 규칙', `덧셈표에서 ${a} + ${b} = ${s}이에요. 이 칸에서 ${dir}으로 ${step}칸 가면 수가 어떻게 될까요? (덧셈표에서는 ${up ? '오른쪽이나 아래쪽' : '왼쪽이나 위쪽'}으로 갈수록 ${up ? '1씩 커져요' : '1씩 작아져요'})`, answer, NO, `${dir}으로 ${step}칸 가면 ${step}만큼 ${up ? '커지므로' : '작아지므로'} ${answer}${ye(answer)}.`); },
    (r) => { const n = ri(2, 9, r), m = ri(2, 8, r); return numberQ('fraction', '곱셈표의 규칙', `곱셈표에서 ${n} × ${m} = ${n * m}이에요. 바로 오른쪽 칸(${n} × ${m + 1})의 수는 얼마일까요? (오른쪽으로 갈수록 ${n}씩 커져요)`, n * (m + 1), NO, `${n * m}보다 ${n} 큰 ${n * (m + 1)}${ye(n * (m + 1))}.`, { hints: [`오른쪽으로 한 칸 가면 ${n}씩 커져요.`, `${n * m} + ${j(n, '을를')} 계산해요.`, `${n * (m + 1)}${ye(n * (m + 1))}.`] }); },
    (r) => { const s = ri(1, 4, r), d = ri(2, 4, r), seq = [s, s + d, s + 2 * d, s + 3 * d], answer = s + 5 * d; return numberQ('fraction', '쌓은 모양의 규칙', `쌓기나무를 첫째에 ${seq[0]}개, 둘째에 ${seq[1]}개, 셋째에 ${seq[2]}개, 넷째에 ${seq[3]}개 쌓았어요. 같은 규칙으로 여섯째에는 몇 개를 쌓아야 할까요?`, answer, dots('🧱', seq.map((v, i) => ({ label: `${i + 1}째`, icons: v }))), `${d}개씩 늘어나요. 다섯째는 ${s + 4 * d}개, 여섯째는 ${answer}개예요.`); },
    (r) => { const sets = [['🔴', '🔵', '🔵'], ['🍎', '🍎', '🍌'], ['⭐', '🌙', '🌙'], ['🐶', '🐱', '🐱']] as const, unit = pick(sets, r), pos = ri(7, 13, r), seq = Array.from({ length: 6 }, (_, i) => unit[i % 3]), answer = unit[(pos - 1) % 3], wrongs = [...new Set(unit)].filter(x => x !== answer); return choiceQ('fraction', '반복 무늬의 자리', `${seq.join(' ')} … 처럼 ${unit.join(' ')} 순서가 되풀이돼요. ${pos}번째 모양은 무엇일까요?`, answer, wrongs, NO, `3개씩 되풀이되므로 ${pos}번째는 ${(pos - 1) % 3 + 1}번째 모양과 같은 ${answer}${ye(answer)}.`, r, { hints: ['몇 개의 모양이 되풀이되는지 먼저 찾아요.', `${pos}번째가 되풀이되는 모양의 몇 번째에 해당하는지 따져 봐요.`, `${pos}번째는 ${answer}${ye(answer)}.`] }); },
    (r) => { const step = pick([2, 3, 5, 10], r), start = ri(1, 4, r) * step, idx = ri(1, 3, r), seq = [0, 1, 2, 3, 4].map(k => start + k * step), shown = seq.map((v, k) => k === idx ? '□' : String(v)).join(', '); return numberQ('fraction', '빈칸의 수 찾기', `규칙에 따라 수를 늘어놓았어요. ${shown} 에서 □에 알맞은 수는 무엇일까요?`, seq[idx], NO, `${step}씩 커지는 규칙이므로 □는 ${seq[idx]}${ye(seq[idx])}.`); }
  ],
  pictograph: [
    (r) => { const counts = distinct(4, 1, 10, r), least = counts.indexOf(Math.min(...counts)); return choiceQ('pictograph', '가장 적은 것', `과일 표예요. ${FRUITS.map((f, k) => `${f} ${counts[k]}명`).join(', ')}. 가장 적은 친구가 좋아하는 과일은 무엇일까요?`, FRUITS[least], FRUITS.filter((_, k) => k !== least), dots('○', FRUITS.map((f, k) => ({ label: f, icons: counts[k] }))), `${counts[least]}명으로 ${j(FRUITS[least], '이가')} 가장 적어요.`, r); },
    (r) => { const counts = FRUITS.map(() => ri(2, 9, r)), a = ri(0, 3, r); let b = ri(0, 3, r); if (b === a) b = (a + 1) % 4; return numberQ('pictograph', '두 항목의 합', `${FRUITS.map((f, k) => `${f} ${counts[k]}명`).join(', ')}을 좋아해요. ${j(FRUITS[a], '와과')} ${j(FRUITS[b], '을를')} 좋아하는 친구는 모두 몇 명일까요?`, counts[a] + counts[b], dots('○', FRUITS.map((f, k) => ({ label: f, icons: counts[k] }))), `${counts[a]} + ${counts[b]} = ${counts[a] + counts[b]}명이에요.`); },
    (r) => { const counts = FRUITS.map(() => ri(2, 8, r)), total = counts.reduce((x, y) => x + y, 0), i = ri(0, 3, r); return numberQ('pictograph', '모르는 칸 구하기', `우리 반 ${total}명이 좋아하는 과일을 조사했어요. ${FRUITS.map((f, k) => k === i ? `${f} □명` : `${f} ${counts[k]}명`).join(', ')}이에요. □에 알맞은 수는 무엇일까요?`, counts[i], NO, `${total}에서 나머지를 빼면 ${counts[i]}명이에요.`, { hints: ['전체 수에서 알고 있는 수를 빼면 돼요.', `${total}에서 나머지 항목의 수를 차례로 빼요.`, `${counts[i]}명이에요.`] }); },
    (r) => { const counts = distinct(4, 1, 10, r), hi = Math.max(...counts), lo = Math.min(...counts); return numberQ('pictograph', '많고 적음의 차', `그래프에서 ${FRUITS.map((f, k) => `${f} ${counts[k]}명`).join(', ')}이에요. 가장 많은 것과 가장 적은 것은 몇 명 차이가 날까요?`, hi - lo, dots('○', FRUITS.map((f, k) => ({ label: f, icons: counts[k] }))), `가장 많은 ${hi}명에서 가장 적은 ${lo}명을 빼면 ${hi - lo}명이에요.`); },
    bankGen('pictograph', '표와 그래프의 좋은 점', [
      { q: '그래프의 좋은 점은 무엇일까요?', a: '어느 것이 더 많고 적은지 한눈에 비교할 수 있어요', w: ['조사한 사람의 이름을 모두 알 수 있어요', '조사하지 않은 것도 알 수 있어요', '합계를 계산하지 않아도 돼요'] },
      { q: '표의 좋은 점은 무엇일까요?', a: '항목별 수와 합계를 정확하게 알 수 있어요', w: ['조사하지 않은 것도 알 수 있어요', '그림이 있어서 항상 더 많은 것을 알 수 있어요', '자료를 조사하지 않아도 돼요'] },
      { q: '좋아하는 과일을 조사해 표로 나타내면 알기 쉬운 것은 무엇일까요?', a: '조사한 친구 수의 합계', w: ['내일 먹을 과일', '과일의 가격', '과일이 자라는 곳'] },
      { q: '그래프에서 ○가 가장 많은 줄은 무엇을 나타낼까요?', a: '가장 많은 친구가 고른 항목', w: ['가장 적은 친구가 고른 항목', '아무도 고르지 않은 항목', '조사 날짜'] },
      { q: '표에서 “합계”는 무엇을 나타낼까요?', a: '조사한 전체 수', w: ['가장 많은 항목의 수', '가장 적은 항목의 수', '항목의 개수'] },
      { q: '과일별로 좋아하는 친구 수를 한눈에 비교하려면 무엇으로 나타내면 좋을까요?', a: '그래프', w: ['달력', '시계', '자'] },
      { q: '조사한 자료를 정리할 때 표에 꼭 쓰는 것은 무엇일까요?', a: '항목과 그 수', w: ['항목의 색깔', '조사한 사람의 키', '조사한 날씨'] },
      { q: '그래프로 나타낼 때 ○ 한 개는 보통 무엇을 나타낼까요?', a: '조사 대상 한 명(또는 한 개)', w: ['조사 대상 전체', '항목의 이름', '조사한 날짜'] },
      { q: '자료를 표로 나타낼 때 가장 먼저 해야 할 일은 무엇일까요?', a: '조사할 항목을 정해요', w: ['합계를 계산해요', '그래프에 색을 칠해요', '표를 접어요'] },
      { q: '그래프에서 ○의 수가 같은 두 항목은 어떤 관계일까요?', a: '좋아하는 친구 수가 같아요', w: ['한 항목이 두 배 많아요', '한 항목이 더 많아요', '조사하지 않았어요'] }
    ], NO)
  ]
};

// ───────────────────────── 4학년 ─────────────────────────
const G4: Partial<GradeTable> = {
  circle: [
    (r) => { const kind = ri(0, 2, r), a = ri(3, 12, r), b = ri(3, 12, r), x = ri(5, 17, r) * 10 / 2 + 5; if (kind === 0) return numberQ('circle', '평행사변형의 성질', `평행사변형에서 마주 보는 변의 길이는 같아요. 이웃한 두 변이 ${a} cm, ${b} cm이면 네 변의 길이의 합은 몇 cm일까요?`, 2 * (a + b), NO, `2 × (${a} + ${b}) = ${2 * (a + b)} cm예요.`); if (kind === 1) return numberQ('circle', '평행사변형의 성질', `평행사변형에서 이웃한 두 각의 크기의 합은 180°예요. 한 각이 ${x}°이면 이웃한 각은 몇 도일까요?`, 180 - x, NO, `180° − ${x}° = ${180 - x}°예요.`); return numberQ('circle', '평행사변형의 성질', `평행사변형에서 마주 보는 두 각의 크기는 같아요. 한 각이 ${x}°이면 마주 보는 각은 몇 도일까요?`, x, NO, `마주 보는 각의 크기는 같아서 ${x}°예요.`); },
    (r) => { const kind = ri(0, 2, r), a = ri(3, 15, r), d = ri(2, 9, r) * 2; if (kind === 0) return numberQ('circle', '마름모의 성질', `마름모는 네 변의 길이가 모두 같아요. 한 변이 ${a} cm이면 네 변의 길이의 합은 몇 cm일까요?`, 4 * a, NO, `${a} × 4 = ${4 * a} cm예요.`); if (kind === 1) return numberQ('circle', '마름모의 성질', `마름모의 두 대각선은 서로를 똑같이 둘로 나누어요. 한 대각선의 길이가 ${d} cm이면 두 대각선이 만나는 점에서 꼭짓점까지는 몇 cm일까요?`, d / 2, NO, `${d} ÷ 2 = ${d / 2} cm예요.`); return numberQ('circle', '마름모의 성질', '마름모의 두 대각선이 만나서 이루는 각은 몇 도일까요?', 90, NO, '마름모의 두 대각선은 서로 수직으로 만나서 90°예요.'); },
    (r) => { const kind = ri(0, 3, r), a = ri(3, 14, r), b = ri(2, 12, r), d = ri(4, 16, r); if (kind === 0) return numberQ('circle', '직사각형과 정사각형의 성질', `직사각형의 가로가 ${a + b} cm, 세로가 ${b} cm이면 네 변의 길이의 합은 몇 cm일까요?`, 2 * (a + 2 * b), geo('rectangle', '직사각형'), `2 × (${a + b} + ${b}) = ${2 * (a + 2 * b)} cm예요.`); if (kind === 1) return numberQ('circle', '직사각형과 정사각형의 성질', `정사각형의 한 변이 ${a} cm이면 네 변의 길이의 합은 몇 cm일까요?`, 4 * a, geo('square', '정사각형'), `${a} × 4 = ${4 * a} cm예요.`); if (kind === 2) return numberQ('circle', '직사각형과 정사각형의 성질', `직사각형의 두 대각선의 길이는 같아요. 한 대각선이 ${d} cm이면 다른 대각선은 몇 cm일까요?`, d, geo('rectangle', '직사각형'), `직사각형의 두 대각선은 길이가 같아서 ${d} cm예요.`); return numberQ('circle', '직사각형과 정사각형의 성질', '정사각형의 두 대각선이 만나서 이루는 각은 몇 도일까요?', 90, geo('square', '정사각형'), '정사각형의 두 대각선은 서로 수직으로 만나서 90°예요.'); }
  ],
  measurement: [
    (r) => { let t = ri(101, 499, r), u = ri(101, 499, r); while (t % 10 === 0) t = ri(101, 499, r); while (u % 10 === 0) u = ri(101, 499, r); const ans = (t + u) / 100; return choiceQ('measurement', '소수 두 자리 수끼리의 덧셈', `${dec(t / 100, 2)} + ${j(dec(u / 100, 2), '은는')} 얼마일까요?`, dec(ans, 2), [dec(ans + .1, 2), dec(ans - .1, 2), dec(ans + 1, 2)], NO, `소수점의 자리를 맞추어 같은 자리끼리 더해요. ${dec(t / 100, 2)} + ${dec(u / 100, 2)} = ${dec(ans, 2)}${ye(dec(ans, 2))}.`, r, { hints: ['소수점의 자리를 맞추어 세로로 써 봐요.', '소수 둘째 자리끼리, 소수 첫째 자리끼리, 일의 자리끼리 차례로 더해요.', `답은 ${dec(ans, 2)}${ye(dec(ans, 2))}.`] }); },
    (r) => { let t = ri(12, 59, r), u = ri(12, 59, r); for (let k = 0; k < 40 && (t % 10) + (u % 10) < 10; k++) { t = ri(12, 59, r); u = ri(12, 59, r); } const ans = (t + u) / 10; return choiceQ('measurement', '받아올림이 있는 소수 덧셈', `${dec(t / 10, 1)} + ${j(dec(u / 10, 1), '은는')} 얼마일까요?`, dec(ans, 1), [dec(ans - 1, 1), dec(ans + .1, 1), dec(ans + 1, 1)], NO, `소수 첫째 자리에서 받아올림해서 ${dec(t / 10, 1)} + ${dec(u / 10, 1)} = ${dec(ans, 1)}${ye(dec(ans, 1))}.`, r); },
    (r) => { let t = ri(30, 99, r), u = ri(11, 29, r); for (let k = 0; k < 40 && (t % 10) >= (u % 10); k++) { t = ri(30, 99, r); u = ri(11, 29, r); } const ans = (t - u) / 10; return choiceQ('measurement', '받아내림이 있는 소수 뺄셈', `${dec(t / 10, 1)} − ${j(dec(u / 10, 1), '은는')} 얼마일까요?`, dec(ans, 1), [dec(ans + 1, 1), dec(ans - .1, 1), dec(ans + .2, 1)], NO, `소수 첫째 자리에서 받아내림해서 ${dec(t / 10, 1)} − ${dec(u / 10, 1)} = ${dec(ans, 1)}${ye(dec(ans, 1))}.`, r); },
    (r) => { const a = ri(2, 9, r); let u = ri(11, 199, r); while (u % 10 === 0) u = ri(11, 199, r); const ans = (100 * a - u) / 100; return choiceQ('measurement', '자연수에서 소수 빼기', `리본 ${a} m 중에서 ${dec(u / 100, 2)} m를 썼어요. 남은 리본은 몇 m일까요?`, dec(ans, 2), [dec(ans + .1, 2), dec(ans - .1, 2), dec(ans + 1, 2)], NO, `${j(a, '을를')} ${a}.00으로 생각하고 소수점의 자리를 맞추어 빼요. ${a} − ${dec(u / 100, 2)} = ${dec(ans, 2)}${ye(dec(ans, 2))}.`, r, { hints: ['자연수는 소수점 아래에 0을 붙여 생각해요.', `${a}.00 − ${j(dec(u / 100, 2), '을를')} 계산해요.`, `남은 리본은 ${dec(ans, 2)} m예요.`] }); }
  ],
  pictograph: [
    (r) => { const cells = pick([2, 4, 5], r), per = pick([2, 5, 10, 20], r); return numberQ('pictograph', '눈금 한 칸의 크기', `막대그래프에서 눈금 ${cells}칸이 ${cells * per}${pick(['명', '개'], r)}을 나타내요. 눈금 한 칸은 얼마를 나타낼까요?`, per, NO, `${cells * per} ÷ ${cells} = ${per}이에요.`, { hints: ['전체 크기를 눈금 칸 수로 나누면 한 칸의 크기예요.', `${cells * per} ÷ ${j(cells, '을를')} 계산해요.`, `한 칸은 ${j(per, '을를')} 나타내요.`] }); },
    (r) => { const labels = ['토끼', '다람쥐', '고슴도치', '여우'], values = labels.map(() => ri(2, 12, r) * 5), total = values.reduce((x, y) => x + y, 0); return numberQ('pictograph', '그래프의 합계', `막대그래프를 보고 조사한 동물은 모두 몇 마리인지 구해 보세요.`, total, barV(labels, values, '마리', [], false, 5), `${values.join(' + ')} = ${total}마리예요.`); },
    (r) => { for (let tries = 0; tries < 60; tries++) { const labels = ['1월', '2월', '3월', '4월', '5월', '6월'], values = labels.map(() => ri(2, 12, r) * 5), diffs = values.slice(1).map((v, i) => Math.abs(v - values[i])), max = Math.max(...diffs); if (diffs.filter(d => d === max).length !== 1) continue; const i = diffs.indexOf(max) + 1, answer = `${labels[i - 1]}에서 ${labels[i]}`; const opts = labels.slice(1).map((_, k) => `${labels[k]}에서 ${labels[k + 1]}`); return choiceQ('pictograph', '변화가 가장 큰 때', '꺾은선그래프에서 선이 가장 가파르게 올라가거나 내려간 때는 언제일까요?', answer, shuffle(opts.filter(o => o !== answer), r).slice(0, 3), barV(labels, values, '개', [], true, 5), `두 점의 높이 차이가 ${max}으로 가장 커서 ${answer}이에요.`, r, { hints: ['이웃한 두 점의 높이 차이를 하나씩 비교해 봐요.', '선이 가장 가파른 곳이 변화가 가장 큰 곳이에요.', `${answer} 구간이 가장 많이 변했어요.`] }); } const labels = ['1월', '2월', '3월', '4월', '5월', '6월'], values = [10, 15, 20, 45, 50, 55]; return choiceQ('pictograph', '변화가 가장 큰 때', '꺾은선그래프에서 선이 가장 가파르게 올라간 때는 언제일까요?', '3월에서 4월', ['1월에서 2월', '2월에서 3월', '4월에서 5월'], barV(labels, values, '개', [], true, 5), '3월에서 4월에 25가 늘어 가장 많이 변했어요.', r); },
    (r) => { const labels = ['1월', '2월', '3월', '4월', '5월', '6월'], values: number[] = [ri(2, 4, r) * 5]; for (let k = 1; k < 6; k++) values.push(values[k - 1] + ri(1, 3, r) * 5); const i = ri(0, 2, r), k = ri(i + 2, 5, r), diff = values[k] - values[i]; return numberQ('pictograph', '변화한 양', `꺾은선그래프에서 ${labels[i]}부터 ${labels[k]}까지 모두 얼마나 늘어났을까요?`, diff, barV(labels, values, '개', [], true, 5), `${labels[k]}은 ${values[k]}, ${labels[i]}은 ${values[i]}이므로 ${values[k]} − ${values[i]} = ${diff}${ye(diff)}.`); },
    (r) => { const m = ri(2, 4, r) * 10, n = ri(1, 3, r) * 10, a = m, b = m + 2 * n; return numberQ('pictograph', '그래프로 예상하기', `꺾은선그래프에서 3월은 ${a}개, 5월은 ${b}개예요. 3월과 5월의 점을 곧게 이은 선 위에서 4월의 값은 몇 개쯤일까요? (4월은 두 달의 한가운데예요)`, (a + b) / 2, NO, `두 값의 가운데 값은 (${a} + ${b}) ÷ 2 = ${(a + b) / 2}개예요.`, { hints: ['한가운데 값은 두 수의 합을 2로 나눈 값이에요.', `${j(a, '와과')} ${j(b, '을를')} 더한 뒤 2로 나눠요.`, `${(a + b) / 2}개예요.`] }); }
  ]
};

// ───────────────────────── 5학년 ─────────────────────────
const ANGLE_NAMES = [['ㄱ', 'ㄹ'], ['ㄴ', 'ㅁ'], ['ㄷ', 'ㅂ']] as const;
const SHAPES_SYM = ['정삼각형', '정사각형', '이등변삼각형', '정오각형', '정육각형'] as const;
const G5: Partial<GradeTable> = {
  fractionDecimal: [
    (r) => { let n = ri(101, 999, r); if (n % 10 === 0) n += 1; const m = pick([10, 100, 1000], r), ans = n * m / 100; return choiceQ('fractionDecimal', '곱하는 수의 0의 개수', `${dec(n / 100, 2)} × ${m} = □에서 □에 알맞은 수는 무엇일까요?`, dec(ans, 3), [dec(ans * 10, 3), dec(ans / 10, 3), dec(ans * 100, 3)], NO, `${m}을 곱하면 곱하는 수의 0이 ${String(m).length - 1}개이므로 소수점이 오른쪽으로 ${String(m).length - 1}칸 옮겨져 ${dec(ans, 3)}${ye(dec(ans, 3))}.`, r, { hints: ['곱하는 수에 0이 몇 개 있는지 세어 봐요.', '0의 개수만큼 소수점이 오른쪽으로 옮겨져요.', `${dec(ans, 3)}${ye(dec(ans, 3))}.`] }); },
    (r) => { let a = ri(11, 49, r), b = ri(11, 49, r); if (a % 10 === 0) a += 1; if (b % 10 === 0) b += 1; const p = ri(1, 2, r), q = ri(1, 2, r), x = a / 10 ** p, y = b / 10 ** q, ans = a * b / 10 ** (p + q); return choiceQ('fractionDecimal', '곱의 소수점 위치', `${a} × ${b} = ${a * b}이에요. ${dec(x, p)} × ${j(dec(y, q), '은는')} 얼마일까요?`, dec(ans, 4), [dec(ans * 10, 4), dec(ans / 10, 4), dec(ans * 100, 4)], NO, `소수점 아래 자릿수의 합이 ${p + q}이므로 ${a * b}에서 소수점을 왼쪽으로 ${p + q}칸 옮겨 ${dec(ans, 4)}${ye(dec(ans, 4))}.`, r, { hints: ['두 소수의 소수점 아래 자릿수를 각각 세어 더해요.', `${a * b}에서 그 수만큼 소수점을 왼쪽으로 옮겨요.`, `${dec(ans, 4)}${ye(dec(ans, 4))}.`] }); },
    (r) => { const ta = ri(2, 9, r) * 10 + pick([1, 2, 8, 9], r), tb = ri(2, 9, r) * 10 + pick([1, 2, 8, 9], r), est = Math.round(ta / 10) * Math.round(tb / 10); return choiceQ('fractionDecimal', '소수 곱셈의 어림', `${dec(ta / 10, 1)} × ${dec(tb / 10, 1)}의 곱을 어림하면 약 얼마일까요? (각 수를 가장 가까운 자연수로 어림해요)`, `약 ${est}`, [`약 ${est * 10}`, `약 ${Math.max(1, est - 6)}`, `약 ${est + 9}`], NO, `${Math.round(ta / 10)} × ${Math.round(tb / 10)} = ${est}이므로 약 ${est}${ye(est)}.`, r); },
    (r) => { if (r() < .5) { const t = ri(12, 49, r), n = ri(3, 9, r), ans = t * n / 10, item = pick(['주스', '우유', '물'], r); return choiceQ('fractionDecimal', '소수 곱셈 이야기', `한 병에 ${item} ${dec(t / 10, 1)} L씩 담았어요. ${n}병에 담은 ${item}의 양은 모두 몇 L일까요?`, dec(ans, 1), [dec(ans * 10, 1), dec(ans / 10, 2), dec(ans + n / 10, 1)], NO, `${dec(t / 10, 1)} × ${n} = ${dec(ans, 1)} L예요.`, r); } const t = ri(12, 29, r), u = ri(12, 29, r), ans = t * u / 100; return choiceQ('fractionDecimal', '소수 곱셈 이야기', `1 m의 무게가 ${dec(t / 10, 1)} kg인 끈이 있어요. 이 끈 ${dec(u / 10, 1)} m의 무게는 몇 kg일까요?`, dec(ans, 2), [dec(ans * 10, 2), dec(ans / 10, 3), dec((t + u) / 10, 1)], NO, `${dec(t / 10, 1)} × ${dec(u / 10, 1)} = ${dec(ans, 2)} kg이에요.`, r); },
    (r) => { const N = pick([6, 8, 10, 12, 15, 20, 24, 30], r), small = pick([0.2, 0.4, 0.5, 0.6, 0.8, 0.9], r), bigs = shuffle([1.1, 1.2, 1.5, 2.5, 3.5], r).slice(0, 3); return choiceQ('fractionDecimal', '곱셈 결과의 크기', `계산 결과가 ${N}보다 작은 것은 무엇일까요?`, `${N} × ${small}`, bigs.map(b => `${N} × ${b}`), NO, `1보다 작은 수를 곱하면 곱이 원래 수보다 작아져요. ${N} × ${j(small, '이가')} ${N}보다 작아요.`, r, { hints: ['곱하는 수가 1보다 큰지 작은지 살펴봐요.', '1보다 작은 수를 곱하면 원래 수보다 작아져요.', `${N} × ${j(small, '이가')} 정답이에요.`] }); }
  ],
  circle: [
    (r) => { const [[a, b]] = [pick(ANGLE_NAMES, r)], x = ri(6, 24, r) * 5; return numberQ('circle', '대응각의 크기', `삼각형 ㄱㄴㄷ과 삼각형 ㄹㅁㅂ은 서로 합동이에요. ${j(`각 ${a}`, '이가')} ${x}°일 때, 대응각인 각 ${b}의 크기는 몇 도일까요?`, x, NO, `합동인 도형에서 대응각의 크기는 같으므로 ${x}°예요.`, { hints: ['합동인 도형에서 대응각의 크기가 어떤지 떠올려 봐요.', `각 ${a}의 대응각은 각 ${b}이에요.`, `대응각은 크기가 같아서 ${x}°예요.`] }); },
    (r) => { const s = [ri(3, 9, r), ri(3, 9, r), ri(3, 9, r), ri(3, 9, r)], total = s.reduce((x, y) => x + y, 0); return numberQ('circle', '합동인 도형의 둘레', `두 사각형은 서로 합동이에요. 한 사각형의 네 변의 길이가 ${s.join(' cm, ')} cm이면 다른 사각형의 네 변의 길이의 합은 몇 cm일까요?`, total, NO, `합동이면 대응변의 길이가 같아서 ${s.join(' + ')} = ${total} cm예요.`); },
    (r) => { if (r() < .5) { const n = ri(3, 8, r); return numberQ('circle', '대칭축의 수', `정${n}각형의 대칭축은 모두 몇 개일까요?`, n, NO, `정다각형의 대칭축은 꼭짓점의 수와 같아서 ${n}개예요.`); } const info: Record<string, number> = { 정삼각형: 3, 정사각형: 4, 이등변삼각형: 1, 정오각형: 5, 정육각형: 6 }, answer = pick(SHAPES_SYM, r); return choiceQ('circle', '대칭축의 수', `대칭축이 ${info[answer]}개인 도형은 무엇일까요? (이등변삼각형은 정삼각형이 아니에요)`, answer, shuffle([...SHAPES_SYM.filter(s => s !== answer), '평행사변형(마름모·직사각형이 아닌)'], r).slice(0, 3), NO, `${answer}의 대칭축은 ${info[answer]}개예요.`, r); },
    (r) => { const sym = ['정사각형', '직사각형', '평행사변형', '마름모', '정육각형'], non = ['정삼각형', '정오각형', '이등변삼각형', '직각삼각형', '정칠각형'], kind = ri(0, 2, r), turn = '점대칭도형은 한 점을 중심으로 180° 돌렸을 때 처음 도형과 완전히 겹쳐요.'; if (kind === 0) return choiceQ('circle', '점대칭도형 찾기', '다음 중 점대칭도형이 아닌 것은 무엇일까요?', pick(non, r), shuffle(sym, r).slice(0, 3), NO, turn, r); if (kind === 1) return choiceQ('circle', '점대칭도형 찾기', '다음 중 점대칭도형은 무엇일까요?', pick(sym, r), shuffle(non, r).slice(0, 3), NO, turn, r); return choiceQ('circle', '점대칭도형 찾기', '선대칭도형은 아니지만 점대칭도형인 것은 무엇일까요? (직사각형·마름모가 아닌 일반 평행사변형이에요)', '평행사변형', ['정사각형', '정육각형', '정삼각형'], NO, '평행사변형은 점대칭이지만 선대칭은 아니에요.', r); },
    (r) => { const a = ri(2, 12, r), point = r() < .5; return numberQ('circle', '대칭의 중심과 대칭축', point ? `점대칭도형에서 대칭의 중심과 점 ㄱ 사이의 거리가 ${a} cm예요. 점 ㄱ과 그 대응점 사이의 거리는 몇 cm일까요?` : `선대칭도형에서 점 ㄱ과 대칭축 사이의 거리가 ${a} cm예요. 점 ㄱ과 그 대응점 사이의 거리는 몇 cm일까요?`, 2 * a, NO, point ? `대칭의 중심에서 두 대응점까지의 거리가 같아서 ${a} + ${a} = ${2 * a} cm예요.` : `대칭축에서 두 대응점까지의 거리가 같아서 ${a} + ${a} = ${2 * a} cm예요.`); }
  ],
  pictograph: [
    (r) => { const names = ['지우', '하준', '서아', '도윤'], m = ri(8, 20, r), d1 = ri(1, 4, r), d2 = ri(1, 4, r), values = shuffle([m + d1, m - d1, m + d2, m - d2], r); return numberQ('pictograph', '평균 구하기', `네 친구의 줄넘기 기록이 ${values.join('회, ')}회예요. 평균은 몇 회일까요?`, m, barV(names, values, '회'), `(${values.join(' + ')}) ÷ 4 = ${m}회예요.`, { hints: ['평균은 자료의 합을 자료의 수로 나눈 값이에요.', `${values.join(' + ')}의 값을 먼저 계산해요.`, `합을 4로 나누면 ${m}회예요.`] }); },
    (r) => { let ma = ri(60, 90, r), mb = ri(60, 90, r); if (ma === mb) mb += 5; const na = ri(3, 5, r), nb = na === 4 ? 5 : 4, win = ma > mb ? '1모둠' : '2모둠'; return choiceQ('pictograph', '평균 비교하기', `1모둠 ${na}명의 점수 합은 ${ma * na}점, 2모둠 ${nb}명의 점수 합은 ${mb * nb}점이에요. 평균이 더 높은 모둠은 어느 모둠일까요?`, win, [win === '1모둠' ? '2모둠' : '1모둠', '두 모둠의 평균이 같아요'], NO, `1모둠의 평균은 ${ma}점, 2모둠의 평균은 ${mb}점이므로 ${win}이 더 높아요.`, r, { hints: ['점수의 합이 아니라 평균을 비교해야 해요.', '각 모둠의 합을 사람 수로 나누어 평균을 구해요.', `평균이 더 높은 ${win}이 정답이에요.`] }); },
    (r) => { const a = ri(60, 100, r), b = ri(60, 100, r), c = ri(60, 100, r), last = pick(Array.from({ length: 41 }, (_, k) => 60 + k).filter(v => (a + b + c + v) % 4 === 0), r), mean = (a + b + c + last) / 4; return numberQ('pictograph', '평균으로 모르는 값 구하기', `네 번 본 수학 시험의 평균이 ${mean}점이에요. 앞의 세 번은 ${a}점, ${b}점, ${c}점이었어요. 마지막 시험은 몇 점일까요?`, last, NO, `네 번의 합은 ${mean} × 4 = ${mean * 4}점이고, 마지막은 ${mean * 4} − ${a + b + c} = ${last}점이에요.`, { hints: ['평균에 시험 횟수를 곱하면 네 번의 합을 알 수 있어요.', '네 번의 합에서 앞의 세 번의 합을 빼요.', `${last}점이에요.`] }); },
    bankGen('pictograph', '가능성을 수로 나타내기', [
      { q: '빨간 구슬만 3개 들어 있는 주머니에서 구슬 한 개를 꺼낼 때, 빨간 구슬일 가능성을 수로 나타내면 얼마일까요?', a: '1', w: ['0', '1/2'] },
      { q: '파란 구슬만 4개 들어 있는 주머니에서 구슬 한 개를 꺼낼 때, 빨간 구슬일 가능성을 수로 나타내면 얼마일까요?', a: '0', w: ['1', '1/2'] },
      { q: '동전을 한 번 던질 때 그림 면이 나올 가능성을 수로 나타내면 얼마일까요?', a: '1/2', w: ['0', '1'] },
      { q: '주사위를 한 번 던질 때 눈의 수가 7일 가능성을 수로 나타내면 얼마일까요?', a: '0', w: ['1', '1/2'] },
      { q: '주사위를 한 번 던질 때 눈의 수가 6 이하일 가능성을 수로 나타내면 얼마일까요?', a: '1', w: ['0', '1/2'] },
      { q: '흰 바둑돌 1개와 검은 바둑돌 1개만 든 주머니에서 한 개를 꺼낼 때 흰 바둑돌일 가능성을 수로 나타내면 얼마일까요?', a: '1/2', w: ['0', '1'] },
      { q: '1부터 10까지의 수가 적힌 카드 중 한 장을 뽑을 때 11이 나올 가능성을 수로 나타내면 얼마일까요?', a: '0', w: ['1', '1/2'] },
      { q: '1부터 10까지의 수가 적힌 카드 중 한 장을 뽑을 때 10 이하의 수가 나올 가능성을 수로 나타내면 얼마일까요?', a: '1', w: ['0', '1/2'] },
      { q: '홀수 카드 1장과 짝수 카드 1장만 있을 때 한 장을 뽑아 홀수일 가능성을 수로 나타내면 얼마일까요?', a: '1/2', w: ['0', '1'] },
      { q: '노란 구슬만 5개 들어 있는 주머니에서 파란 구슬을 꺼낼 가능성을 수로 나타내면 얼마일까요?', a: '0', w: ['1', '1/2'] },
      { q: '앞면과 뒷면이 있는 동전을 던질 때 앞면이나 뒷면 중 하나가 나올 가능성을 수로 나타내면 얼마일까요?', a: '1', w: ['0', '1/2'] }
    ], NO),
    bankGen('pictograph', '가능성을 말로 판단하기', [
      { q: '가능성이 “확실하다”인 경우는 어느 것일까요?', a: '오늘이 월요일이면 내일은 화요일이에요', w: ['동전을 던지면 숫자 면이 나와요', '주사위를 던지면 7이 나와요', '내일은 반드시 비가 와요'] },
      { q: '가능성이 “불가능하다”인 경우는 어느 것일까요?', a: '주사위를 한 번 던져서 눈의 수가 0이 나와요', w: ['동전을 던져서 그림 면이 나와요', '주사위를 던져서 짝수가 나와요', '주사위를 던져서 6 이하의 수가 나와요'] },
      { q: '가능성이 “반반이다”에 알맞은 경우는 어느 것일까요?', a: '동전을 던져서 숫자 면이 나와요', w: ['해가 서쪽에서 떠요', '오늘 다음 날은 내일이에요', '주사위를 던져서 7이 나와요'] },
      { q: '가능성이 가장 높은 경우는 어느 것일까요?', a: '12월 다음 달은 1월이에요', w: ['동전을 던져서 그림 면이 나와요', '주사위를 던져서 6이 나와요', '주사위를 던져서 7이 나와요'] },
      { q: '가능성이 “불가능하다”인 경우는 어느 것일까요?', a: '동전을 던졌을 때 앞면도 뒷면도 아닌 면이 나와요', w: ['동전을 던져서 앞면이 나와요', '동전을 던져서 뒷면이 나와요', '동전을 던져서 앞면이나 뒷면이 나와요'] },
      { q: '가능성이 “확실하다”인 경우는 어느 것일까요?', a: '빨간 구슬만 든 주머니에서 빨간 구슬을 꺼내요', w: ['빨간 구슬과 파란 구슬이 반반 든 주머니에서 빨간 구슬을 꺼내요', '빨간 구슬만 든 주머니에서 파란 구슬을 꺼내요', '파란 구슬이 더 많은 주머니에서 빨간 구슬을 꺼내요'] },
      { q: '가능성이 “반반이다”에 알맞은 경우는 어느 것일까요?', a: '빨간 구슬 1개와 파란 구슬 1개 중 빨간 구슬을 꺼내요', w: ['빨간 구슬만 든 주머니에서 빨간 구슬을 꺼내요', '파란 구슬만 든 주머니에서 빨간 구슬을 꺼내요', '주사위를 던져서 7이 나와요'] },
      { q: '가능성이 “불가능하다”인 경우는 어느 것일까요?', a: '사람이 날개 없이 하늘을 마음대로 날아다녀요', w: ['동전을 던져서 숫자 면이 나와요', '주사위를 던져서 3이 나와요', '내일 학교에 가요'] },
      { q: '가능성이 “확실하다”인 경우는 어느 것일까요?', a: '1월 다음 달은 2월이에요', w: ['주사위를 던져서 1이 나와요', '동전을 던져서 그림 면이 나와요', '주사위를 던져서 7이 나와요'] }
    ], NO)
  ]
};

// ───────────────────────── 6학년 ─────────────────────────
const PRISM_NAMES = ['', '', '', '삼', '사', '오', '육', '칠', '팔'] as const;
const G6: Partial<GradeTable> = {
  circle: [
    (r) => { const d = pick([2, 4, 5, 6, 8, 10, 12, 15, 20], r), c = dec(3.14 * d, 2); return numberQ('circle', '원주로 지름 구하기', `원주가 ${c} cm인 원의 지름은 몇 cm일까요? (원주율 3.14)`, d, NO, `(지름) = (원주) ÷ 3.14 = ${c} ÷ 3.14 = ${d} cm예요.`, { hints: ['원주는 지름의 3.14배예요.', `원주 ${c} cm를 3.14로 나눠요.`, `지름은 ${d} cm예요.`] }); },
    (r) => { const rad = ri(1, 10, r), d = rad * 2, ans = dec(rad * rad * 3.14, 2); return choiceQ('circle', '지름으로 원의 넓이 구하기', `지름이 ${d} cm인 원의 넓이는 몇 cm²일까요? (원주율 3.14)`, ans, [dec(d * d * 3.14, 2), dec(d * 3.14, 2), dec(rad * 3.14, 2)], circD(rad), `반지름이 ${d} ÷ 2 = ${rad} cm이므로 ${rad} × ${rad} × 3.14 = ${ans} cm²예요.`, r, { hints: ['넓이를 구하려면 먼저 반지름이 필요해요.', `지름 ${d} cm의 반이 반지름이에요.`, `${rad} × ${rad} × 3.14 = ${ans} cm²예요.`] }); },
    (r) => { const rad = ri(2, 12, r), ans = `${dec(3.14 * rad * rad, 2)} cm²`; return choiceQ('circle', '원의 넓이 어림하기', `반지름이 ${rad} cm인 원이 있어요. 원 안에 꼭 맞는 정사각형의 넓이는 ${2 * rad * rad} cm², 원 밖에 꼭 맞는 정사각형의 넓이는 ${4 * rad * rad} cm²예요. 원의 넓이로 알맞은 것은 무엇일까요?`, ans, [`${rad * rad} cm²`, `${dec(1.5 * rad * rad, 2)} cm²`, `${5 * rad * rad} cm²`], NO, `원의 넓이는 ${2 * rad * rad} cm²보다 크고 ${4 * rad * rad} cm²보다 작아요. ${rad} × ${rad} × 3.14 = ${ans}이므로 알맞아요.`, r); },
    (r) => { const rad = ri(2, 10, r), d = rad * 2, ans = dec(rad * rad * 3.14 / 2, 2); return choiceQ('circle', '반원의 넓이', `지름이 ${d} cm인 반원의 넓이는 몇 cm²일까요? (원주율 3.14)`, ans, [dec(rad * rad * 3.14, 2), dec(d * d * 3.14 / 2, 2), dec(rad * 3.14, 2)], circD(rad), `원 전체의 넓이 ${rad} × ${rad} × 3.14의 반이므로 ${ans} cm²예요.`, r, { hints: ['반원의 넓이는 원의 넓이의 반이에요.', `먼저 반지름 ${rad} cm인 원의 넓이를 구해요.`, `그 값을 2로 나누면 ${ans} cm²예요.`] }); },
    (r) => { const rad = ri(2, 12, r), s = rad * 2, ans = dec(s * s - 3.14 * rad * rad, 2); return choiceQ('circle', '색칠한 부분의 넓이', `한 변이 ${s} cm인 정사각형 안에 꼭 맞는 원을 그렸어요. 원 밖에 있는 정사각형 부분(색칠한 부분)의 넓이는 몇 cm²일까요? (원주율 3.14)`, ans, [dec(3.14 * rad * rad, 2), dec(s * s, 2), dec(s * s - 3.14 * rad, 2)], NO, `정사각형의 넓이 ${s * s}에서 원의 넓이 ${j(dec(3.14 * rad * rad, 2), '을를')} 빼면 ${ans} cm²예요.`, r, { hints: ['색칠한 부분의 넓이는 큰 도형에서 작은 도형을 빼서 구해요.', '정사각형의 넓이와 원의 넓이를 각각 구해요.', `${s * s} − ${dec(3.14 * rad * rad, 2)} = ${ans} cm²예요.`] }); }
  ],
  fraction: [
    (r) => { let p = ri(1, 9, r), q = ri(1, 9, r); while (p === q || gcdOf(p, q) !== 1) { p = ri(1, 9, r); q = ri(1, 9, r); } const k = ri(2, 6, r); return choiceQ('fraction', '가장 간단한 자연수의 비', `${p * k} : ${j(q * k, '을를')} 가장 간단한 자연수의 비로 나타내면 무엇일까요?`, `${p} : ${q}`, [`${q} : ${p}`, `${p * k} : ${q}`, `${p} : ${q * k}`], NO, `두 항을 ${k}로 나누면 ${p} : ${q}예요.`, r, { hints: ['두 항을 같은 수로 나누어 간단하게 만들어요.', `두 항을 모두 나눌 수 있는 수는 ${k}예요.`, `${p} : ${q}예요.`] }); },
    (r) => { const p = ri(2, 7, r), q = ri(2, 7, r), k = ri(2, 5, r); return numberQ('fraction', '외항의 곱과 내항의 곱', `비례식 ${p} : ${q} = ${p * k} : ${q * k}에서 외항의 곱은 얼마일까요?`, p * q * k, NO, `외항은 ${j(p, '와과')} ${q * k}이므로 ${p} × ${q * k} = ${p * q * k}예요. (내항의 곱도 같아요.)`, { hints: ['비례식에서 바깥쪽에 있는 두 수가 외항이에요.', `외항은 ${j(p, '와과')} ${q * k}이에요.`, `${p} × ${q * k} = ${p * q * k}예요.`] }); },
    (r) => { const a = ri(1, 5, r), k = ri(2, 5, r); let b = ri(2, 7, r); while (a === b) b = ri(2, 7, r); return choiceQ('fraction', '비례식 세우기', `주스 원액 ${a}컵에 물 ${b}컵을 섞어요. 같은 맛으로 원액 ${a * k}컵에 물 ${b * k}컵을 섞으려고 해요. 알맞은 비례식은 무엇일까요?`, `${a} : ${b} = ${a * k} : ${b * k}`, [`${a} : ${b} = ${b * k} : ${a * k}`, `${a} : ${b} = ${a + k} : ${b + k}`, `${a} : ${b} = ${a * k} : ${b + k}`], NO, `두 양에 같은 수 ${j(k, '을를')} 곱하므로 ${a} : ${b} = ${a * k} : ${b * k}예요.`, r); },
    (r) => { const a = ri(1, 5, r); let b = ri(1, 5, r); while (a === b) b = ri(1, 5, r); return choiceQ('fraction', '전체를 비로 나누기', `전체를 ${a} : ${j(b, '으로')} 나누어요. ${a}에 해당하는 몫은 전체의 얼마일까요?`, fracText(a, a + b), [fracText(b, a + b), fracText(a, b), fracText(a + b, b)], NO, `전체는 ${a} + ${b} = ${a + b}이므로 ${a}에 해당하는 몫은 전체의 ${fracText(a, a + b)}예요.`, r, { hints: ['비의 두 수를 더하면 전체 묶음의 수가 돼요.', `${j(a, '와과')} ${j(b, '을를')} 먼저 더해요.`, `${a}에 해당하는 몫은 전체의 ${fracText(a, a + b)}예요.`] }); },
    (r) => { const a = ri(1, 4, r), b = ri(a + 1, 6, r), u = ri(2, 6, r), total = (a + b) * u, name = pick(['구슬', '스티커', '쿠키'], r); return numberQ('fraction', '비례배분 활용', `${name} ${total}개를 민수와 지아가 ${a} : ${j(b, '으로')} 나누어 가지려고 해요. 두 사람이 가지는 ${name} 수의 차는 몇 개일까요?`, (b - a) * u, dots('🍬', [{ label: '민수', icons: Math.min(a, 6) }, { label: '지아', icons: Math.min(b, 6) }]), `전체를 ${j(a + b, '으로')} 나눈 한 묶음이 ${u}개이고, 두 사람의 차는 ${b - a}묶음이므로 ${(b - a) * u}개예요.`, { hints: ['전체를 비의 합으로 나누면 한 묶음의 크기를 알 수 있어요.', `${total} ÷ ${a + b} = ${u}개가 한 묶음이에요.`, `${b - a}묶음 차이이므로 ${(b - a) * u}개예요.`] }); }
  ],
  measurement: [
    (r) => { const n = ri(3, 8, r), prism = r() < .5; return prism ? numberQ('measurement', '각기둥과 각뿔의 모서리', `${PRISM_NAMES[n]}각기둥의 모서리는 모두 몇 개일까요?`, 3 * n, geo('rectangle', `${PRISM_NAMES[n]}각기둥`), `위아래 밑면에 ${n}개씩, 옆에 ${n}개가 있어 ${n} × 3 = ${3 * n}개예요.`) : numberQ('measurement', '각기둥과 각뿔의 모서리', `${PRISM_NAMES[n]}각뿔의 모서리는 모두 몇 개일까요?`, 2 * n, geo('right-triangle', `${PRISM_NAMES[n]}각뿔`), `밑면에 ${n}개, 옆에 ${n}개가 있어 ${n} × 2 = ${2 * n}개예요.`); }
  ]
};
function gcdOf(a: number, b: number): number { return b === 0 ? a : gcdOf(b, a % b); }

export const GRADE_SECOND: Record<1 | 2 | 4 | 5 | 6, Partial<GradeTable>> = { 1: G1, 2: G2, 4: G4, 5: G5, 6: G6 };

export const SECOND_TOPICS: Record<1 | 2 | 4 | 5 | 6, Topics> = {
  1: {
    lengthTime: ['긴바늘과 짧은바늘', '1시간 뒤의 시각', '시각의 앞과 뒤', 'AB 규칙 찾기', '세 칸 규칙 찾기'],
    fraction: ['가운데와 사이', '반대쪽에서 세기', '줄 서기 순서', '쌓은 개수 세기', '층 위치'],
    pictograph: ['몇 묶음과 낱개', '1 큰 수와 1 작은 수', '10 큰 수와 10 작은 수', '수 읽고 쓰기', '세 수 크기 비교']
  },
  2: {
    lengthTime: ['걸린 시간', '몇 시간 뒤 시각', '오전과 오후', '분을 시간으로 바꾸기', '며칠 뒤 날짜'],
    fraction: ['덧셈표의 규칙', '곱셈표의 규칙', '쌓은 모양의 규칙', '반복 무늬의 자리', '빈칸의 수 찾기'],
    pictograph: ['가장 적은 것', '두 항목의 합', '모르는 칸 구하기', '많고 적음의 차', '표와 그래프의 좋은 점']
  },
  4: {
    circle: ['평행사변형의 성질', '마름모의 성질', '직사각형과 정사각형의 성질'],
    measurement: ['소수 두 자리 수끼리의 덧셈', '받아올림이 있는 소수 덧셈', '받아내림이 있는 소수 뺄셈', '자연수에서 소수 빼기'],
    pictograph: ['눈금 한 칸의 크기', '그래프의 합계', '변화가 가장 큰 때', '변화한 양', '그래프로 예상하기']
  },
  5: {
    fractionDecimal: ['곱하는 수의 0의 개수', '곱의 소수점 위치', '소수 곱셈의 어림', '소수 곱셈 이야기', '곱셈 결과의 크기'],
    circle: ['대응각의 크기', '합동인 도형의 둘레', '대칭축의 수', '점대칭도형 찾기', '대칭의 중심과 대칭축'],
    pictograph: ['평균 구하기', '평균 비교하기', '평균으로 모르는 값 구하기', '가능성을 수로 나타내기', '가능성을 말로 판단하기']
  },
  6: {
    circle: ['원주로 지름 구하기', '지름으로 원의 넓이 구하기', '원의 넓이 어림하기', '반원의 넓이', '색칠한 부분의 넓이'],
    fraction: ['가장 간단한 자연수의 비', '외항의 곱과 내항의 곱', '비례식 세우기', '전체를 비로 나누기', '비례배분 활용'],
    measurement: ['각기둥과 각뿔의 모서리']
  }
};
