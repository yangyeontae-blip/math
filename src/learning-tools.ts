import type { CurriculumQuestion } from './curriculum';
import { NEW_CURRICULUM_UNITS, OPERATIONS } from './rules';

export type ToolSpec = { kind: 'groups' | 'fraction' | 'decimal'; limits: number[]; labels: string[]; denominators: number[]; total: number; divisor: number };
export interface LearningTool { key: string; question: CurriculumQuestion; values: number[] }
export function toolSpec(q: CurriculumQuestion): ToolSpec | null {
  const v = q.visual;
  if (v.kind === 'groups' && Number.isInteger(v.total) && v.total > 0 && v.total <= 30 && Number.isInteger(v.divisor) && v.divisor > 0 && v.divisor <= 30 && v.remainder === v.total % v.divisor) {
    // Offer the next empty group as children build; do not reveal the quotient in advance.
    const groups = Math.min(30, Math.floor(v.total / v.divisor) + 1);
    return { kind: 'groups', limits: Array(groups).fill(v.divisor), labels: Array.from({ length: groups }, (_, i) => `${i + 1}번 묶음`), denominators: [], total: v.total, divisor: v.divisor };
  }
  if (v.kind === 'fraction' && v.compare && !v.groups && (v.denominator === v.compare.denominator || v.numerator === v.compare.numerator)) {
    const ns = [v.numerator, v.compare.numerator], ds = [v.denominator, v.compare.denominator];
    if (!ns.every(n => Number.isInteger(n) && n >= 0 && n <= 24) || !ds.every(d => Number.isInteger(d) && d > 0 && d <= 12)) return null;
    return { kind: 'fraction', limits: ns.map((n, i) => Math.max(1, Math.ceil(n / ds[i])) * ds[i]), labels: ns.map((n, i) => `${n}/${ds[i]}`), denominators: ds, total: 0, divisor: 0 };
  }
  if (v.kind === 'decimal' && v.compare !== undefined && [v.tenths, v.compare].every(n => Number.isInteger(n) && n >= 0 && n <= 10)) return { kind: 'decimal', limits: [10, 10], labels: [v.tenths, v.compare].map(n => (n / 10).toFixed(1)), denominators: [10, 10], total: 0, divisor: 0 };
  return null;
}
export function adjustTool(tool: LearningTool, group: number, delta: number) {
  const spec = toolSpec(tool.question);
  if (!spec || !Number.isInteger(group) || group < 0 || group >= spec.limits.length || ![-1, 1].includes(delta)) return false;
  const next = tool.values[group] + delta;
  if (next < 0 || next > spec.limits[group] || (spec.kind === 'groups' && tool.values.reduce((a, b) => a + b, 0) + delta > spec.total)) return false;
  tool.values[group] = next; return true;
}
export function validTool(value: unknown): value is LearningTool {
  if (value === null || typeof value !== 'object') return false;
  const t = value as LearningTool, q = t.question;
  if (typeof t.key !== 'string' || t.key.length > 400 || !q || !q.visual || typeof q.unit !== 'string' || typeof q.skill !== 'string' || typeof q.prompt !== 'string' || q.prompt.length > 1500 || typeof q.answer !== 'string' || typeof q.explanation !== 'string' || !['number', 'choice'].includes(q.kind)) return false;
  if (![...OPERATIONS, ...NEW_CURRICULUM_UNITS].includes(q.unit)) return false;
  if (q.detail !== undefined && typeof q.detail !== 'string') return false;
  if (!Array.isArray(q.hints) || q.hints.length !== 3 || !q.hints.every(h => typeof h === 'string' && h.length <= 1500)) return false;
  if (q.kind === 'choice' && (!Array.isArray(q.choices) || q.choices.length > 12 || !q.choices.every(c => c && typeof c.value === 'string' && typeof c.label === 'string'))) return false;
  const spec = toolSpec(q);
  return !!spec && Array.isArray(t.values) && t.values.length === spec.limits.length && t.values.every((v, i) => Number.isInteger(v) && v >= 0 && v <= spec.limits[i]) && (spec.kind !== 'groups' || t.values.reduce((a, b) => a + b, 0) <= spec.total);
}
export function toolHtml(tool: LearningTool) {
  const spec = toolSpec(tool.question)!;
  const remaining = spec.total - tool.values.reduce((a, b) => a + b, 0);
  const last = tool.values.reduce((last, value, index) => value > 0 ? index : last, -1);
  const shown = spec.kind === 'groups' ? Math.min(tool.values.length, Math.max(1, last + 2)) : tool.values.length;
  return `<section class="learning-tool" aria-label="직접 움직여 생각하기"><h4>🧩 직접 움직여 생각해요</h4><p>${spec.kind === 'groups' ? `물건을 ${spec.divisor}개씩 묶어 보세요. 가득 찬 묶음의 수와 남은 물건을 살펴봐요. 새 묶음은 옮기면 나타나요.` : '위에 적힌 수만큼 아래 칸을 채워 비교해 보세요. 조작 뒤에도 답을 직접 골라요.'}</p>${spec.kind === 'groups' ? `<button id="tool-source" draggable="true">🟡 남은 물건 ${remaining}개 · 선택하기</button>` : ''}<div class="tool-boards">${tool.values.slice(0, shown).map((value, i) => {
    const d = spec.denominators[i] || spec.divisor;
    return `<section><strong>${spec.labels[i]}</strong>${spec.kind === 'groups' ? `<button class="tool-group" data-tool-drop="${i}">${'🟡'.repeat(value) || '여기에 놓기'}<small>${value}개</small></button>` : `<div class="tool-bars" style="--cells:${d}">${Array.from({ length: spec.limits[i] / d }, (_, whole) => `<div>${Array.from({ length: d }, (_, cell) => `<button data-tool-cell="${i}" data-tool-position="${whole * d + cell}" aria-label="${i + 1}번 막대 ${whole * d + cell + 1}번째 조각" aria-pressed="${whole * d + cell < value}" class="${whole * d + cell < value ? 'filled' : ''}"></button>`).join('')}</div>`).join('')}</div>${spec.kind === 'decimal' ? `<label class="tool-numberline">0 <input data-tool-range="${i}" type="range" min="0" max="10" step="1" value="${value}" aria-label="${i + 1}번 수직선"> 1</label>` : ''}`}<output>${spec.kind === 'groups' ? '' : spec.kind === 'decimal' ? (value / 10).toFixed(1) : `${value}/${d}`}</output><div class="tool-adjust"><button data-tool-group="${i}" data-tool-delta="-1" aria-label="${i + 1}번 하나 빼기" ${value === 0 ? 'disabled' : ''}>−</button><button data-tool-group="${i}" data-tool-delta="1" aria-label="${i + 1}번 하나 넣기" ${value >= spec.limits[i] || spec.kind === 'groups' && remaining === 0 ? 'disabled' : ''}>＋</button></div></section>`;
  }).join('')}</div><p role="status" id="tool-status">답은 아래 보기에서 직접 골라 주세요.</p></section>`;
}
