import type { CurriculumChoice, CurriculumQuestion, CurriculumVisual } from './curriculum';
import type { NewCurriculumUnitId } from './rules';

export type Rand = () => number;
export type GradeGen = (r: Rand, hard: boolean) => CurriculumQuestion;
/** 삼각형 지역은 4학년에만 있어서 다른 학년 표에는 없어도 돼요. */
export type GradeTable = Record<Exclude<NewCurriculumUnitId, 'triangle'>, GradeGen[]> & { triangle?: GradeGen[] };

let hardMode = false;
/** 도전 단계에서는 폭이 넓은 숫자 범위를 위쪽으로 치우쳐 뽑아 더 큰 수가 나오게 해요(좁은 범위는 종류 고르기에 쓰이므로 그대로 둬요). */
export function withHardMode<T>(hard: boolean, make: () => T): T { hardMode = hard; try { return make(); } finally { hardMode = false; } }
export const ri = (min: number, max: number, r: Rand) => { if (hardMode && max - min >= 6) min = Math.floor(min + (max - min) * .45); return Math.floor(r() * (max - min + 1)) + min; };
export const pick = <T>(items: readonly T[], r: Rand) => items[Math.min(items.length - 1, Math.floor(r() * items.length))];
export function shuffle<T>(items: readonly T[], r: Rand): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export interface QOpts { hints?: [string, string, string]; detail?: string }
const defaultHints = (skill: string, explanation: string): [string, string, string] => [`${skill}에서 무엇을 구하는지 먼저 찾아봐요.`, '그림과 식을 한 단계씩 살펴봐요.', explanation];
/** 힌트 세 개가 서로 겹치지 않도록, 겹치는 칸은 기본 힌트로 바꿔요. */
function distinctHints(hints: [string, string, string], skill: string, explanation: string): [string, string, string] {
  const fallback = defaultHints(skill, explanation), out: string[] = [];
  hints.forEach((hint, i) => out.push(out.includes(hint) || hint.length <= 4 ? fallback[i] : hint));
  if (new Set(out).size < 3) return fallback;
  return out as [string, string, string];
}

export function choiceQ(unit: NewCurriculumUnitId, skill: string, prompt: string, answer: string, wrongs: string[], visual: CurriculumVisual, explanation: string, r: Rand, opts: QOpts = {}): CurriculumQuestion {
  const labels = [answer, ...[...new Set(wrongs)].filter(w => w !== answer)].slice(0, 4);
  return { unit, skill, prompt, detail: opts.detail, kind: 'choice', answer, choices: shuffle(labels, r).map(label => ({ label, value: label }) as CurriculumChoice), visual, hints: opts.hints ? distinctHints(opts.hints, skill, explanation) : defaultHints(skill, explanation), explanation };
}

export function numberQ(unit: NewCurriculumUnitId, skill: string, prompt: string, answer: number, visual: CurriculumVisual, explanation: string, opts: QOpts = {}): CurriculumQuestion {
  return { unit, skill, prompt, detail: opts.detail, kind: 'number', answer: String(answer), visual, hints: opts.hints ? distinctHints(opts.hints, skill, explanation) : defaultHints(skill, explanation), explanation };
}

export const dots = (icon: string, rows: { label: string; icons: number }[]): CurriculumVisual => ({ kind: 'pictograph', icon, value: 1, rows });
export const fracBar = (n: number, d: number): CurriculumVisual => ({ kind: 'fraction', numerator: n, denominator: d });
export const nums = (list: number[]) => list.map(String);
export const near = (n: number, offsets: number[], min = 0) => offsets.map(o => String(Math.max(min, n + o)));

export const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
export const lcm = (a: number, b: number) => a / gcd(a, b) * b;
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const dec = (n: number, places = 3) => String(parseFloat(n.toFixed(places)));
/** 분수를 약분하고, 1보다 크면 대분수로 써요. */
export function fracText(n: number, d: number): string {
  const g = gcd(n, d), nn = n / g, dd = d / g;
  if (dd === 1) return String(nn);
  return nn > dd ? `${Math.floor(nn / dd)} ${nn % dd}/${dd}` : `${nn}/${dd}`;
}
/** 약분하지 않고 대분수 없이 n/d 로 써요. */
export const fracPlain = (n: number, d: number) => `${n}/${d}`;

const DIGIT_FINAL: Record<string, 'none' | 'final' | 'rieul'> = { 0: 'final', 1: 'rieul', 2: 'none', 3: 'final', 4: 'none', 5: 'none', 6: 'final', 7: 'rieul', 8: 'rieul', 9: 'none' };
const LATIN_FINAL: Record<string, 'none' | 'final' | 'rieul'> = { l: 'rieul', r: 'rieul', m: 'final', n: 'final' };
function finalKind(text: string): 'none' | 'final' | 'rieul' {
  const t = text.trimEnd(), fraction = t.match(/(\d+)\/(\d+)$/);
  if (fraction) return finalKind(fraction[1]);
  if (/(cm|mm|km|mL|L|m|°|%)$/.test(t)) return 'none';
  if (/(kg|g|t|²|³)$/.test(t)) return 'final';
  const chars = [...text.replace(/[\s)\]”’'".,!?%²³°]+$/g, '')];
  const last = chars[chars.length - 1] ?? '';
  if (/\d/.test(last)) return DIGIT_FINAL[last];
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) { const f = (code - 0xac00) % 28; return f === 0 ? 'none' : f === 8 ? 'rieul' : 'final'; }
  if (code >= 0x3131 && code <= 0x314e) return last === 'ㄹ' ? 'rieul' : 'final';
  return LATIN_FINAL[last.toLowerCase()] ?? 'none';
}
/** 받침에 맞게 조사를 붙여요. 예: j(5, '와과') → "5와", j('연필', '이가') → "연필이". */
export function j(text: string | number, pair: '은는' | '이가' | '을를' | '와과' | '으로'): string {
  const s = String(text), kind = finalKind(s);
  if (pair === '으로') return s + (kind === 'final' ? '으로' : '로');
  if (pair === '와과') return s + (kind === 'none' ? '와' : '과');
  return s + (kind === 'none' ? pair[1] : pair[0]);
}

/** 받침이 없으면 "예요", 있으면 "이에요"를 붙여요. 예: 길이예요, 모양이에요. */
export const ye = (text: string | number) => (finalKind(String(text)) === 'none' ? '예요' : '이에요');

/** 받침이 없으면 "라고", 있으면 "이라고"를 붙여요. 예: 구라고, 육이라고. */
export const irago = (text: string | number) => (finalKind(String(text)) === 'none' ? '라고' : '이라고');

export interface BankItem { q: string; a: string; w: string[]; x?: string; v?: CurriculumVisual }
/** 같은 개념을 여러 질문 형태로 묻는 문제 은행. 항목 하나를 골라 오답 보기를 섞어 내요. */
export const bankGen = (unit: NewCurriculumUnitId, skill: string, items: readonly BankItem[], visual: CurriculumVisual): GradeGen => (r) => {
  const item = pick(items, r), wrongs = shuffle(item.w, r).slice(0, 3);
  return choiceQ(unit, skill, item.q, item.a, wrongs, item.v ?? visual, item.x ?? `정답은 “${item.a}”이에요.`, r);
};
/** 여러 생성기 중 하나를 같은 확률로 골라 써요. */
export const mix = (...gens: GradeGen[]): GradeGen => (r, hard) => pick(gens, r)(r, hard);
