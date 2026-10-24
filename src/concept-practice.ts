import type { Operation, PracticeTier, Question } from './rules';
import { adaptiveRecord, startLevel, type AdaptiveLevel } from './adaptive';
export function calculationConcept(q: Question): string {
  const op = q.operation ?? 'division';
  if (q.places?.some(Boolean)) return `${op}:decimal`;
  if (op === 'addition' || op === 'subtraction') {
    let a = q.dividend, b = q.divisor, exchange = false;
    while (a || b) { if (op === 'addition' ? a % 10 + b % 10 >= 10 : a % 10 < b % 10) exchange = true; a = Math.floor(a / 10); b = Math.floor(b / 10); }
    return `${op}:${exchange ? op === 'addition' ? 'carry' : 'borrow' : 'basic'}`;
  }
  return op === 'division' ? `${op}:${q.remainder ? 'remainder' : 'equal'}` : `${op}:${q.dividend >= 10 || q.divisor >= 10 ? 'multi-digit' : 'tables'}`;
}
export const CONCEPT_LABELS: Record<string, string> = { basic: '기초 계산', carry: '받아올림', borrow: '받아내림', decimal: '소수 계산', remainder: '나머지 있는 나눗셈', equal: '나누어떨어지는 나눗셈', 'multi-digit': '여러 자리 곱셈', tables: '구구단' };
export const conceptLabel = (key: string) => CONCEPT_LABELS[key.split(':')[1]] ?? '계산';
/** Difficulty belongs to each concept, so a borrow mistake does not lower basic subtraction. */
export class ConceptPractice {
  readonly levels = new Map<string, AdaptiveLevel>();
  clear() { this.levels.clear(); }
  record(q: Question, tier: PracticeTier, correct: boolean) {
    const key = calculationConcept(q), before = this.levels.get(key) ?? startLevel(tier), after = adaptiveRecord(before, correct);
    this.levels.set(key, after); return { key, before, after };
  }
  target(operation: Operation): string | undefined {
    return [...this.levels].filter(([key, level]) => key.startsWith(`${operation}:`) && (level.misses > 0 || level.tier < 1)).sort((a,b) => a[1].tier - b[1].tier || b[1].misses - a[1].misses)[0]?.[0];
  }
  choose(operation: Operation, fallback: PracticeTier, generate: (tier: PracticeTier) => Question): { question: Question; tier: PracticeTier } {
    const initial = generate(fallback);
    const target = this.target(operation) ?? calculationConcept(initial);
    const tier = this.levels.get(target)?.tier ?? fallback;
    if (tier === fallback && calculationConcept(initial) === target) return { question: initial, tier };
    for (let i = 0; i < 30; i++) {
      const question = generate(tier);
      if (calculationConcept(question) === target) return { question, tier };
    }
    // Never apply a concept's tier to a different concept just to fill a slot.
    // If the grade-safe generator cannot serve that concept, retain the picker baseline.
    return { question: initial, tier: fallback };
  }
}
