import { journeyFor, type Save, type SchoolGrade } from './rules';

export interface ForestTrail { seeds: number[]; lit: number[]; placed: number[]; drafts: string[] }
export const emptyForestTrail = (): ForestTrail => ({ seeds: [], lit: [], placed: [0, 0, 0], drafts: ['', '', ''] });
export const TRAIL_SEEDS = [{ x: -4, z: 22 }, { x: 4, z: 22 }, { x: -4, z: 11 }, { x: 4, z: 11 }, { x: -4, z: 0 }, { x: 4, z: 0 }];
export const TRAIL_LAMPS = [{ x: 0, z: 17 }, { x: 0, z: 6 }, { x: 0, z: -6 }];
export function trailHere(s: Save) { return s.forest === 'addition' && journeyFor(s).stage === 1 && !s.room.inside && !s.homestead?.inside && !s.expedition.active; }
export function trailPair(grade: SchoolGrade, lamp: number): readonly [number, number] {
  const pairs = grade === 1 ? [[2, 3], [4, 2], [5, 3]] : grade === 2 ? [[8, 7], [14, 9], [26, 18]] : grade === 3 ? [[128, 147], [236, 185], [347, 268]] : grade === 4 ? [[237, 186], [358, 267], [467, 358]] : [[286, 397], [478, 256], [567, 278]];
  return pairs[lamp] as [number, number];
}
export function collectTrailSeed(s: Save, id: number) {
  if (!trailHere(s) || !Number.isInteger(id) || id < 0 || id >= 6 || s.forestTrail.seeds.includes(id)) return false;
  s.forestTrail.seeds.push(id); return true;
}
export function moveTrailBundle(s: Save, lamp: number, side: number) {
  const t = s.forestTrail;
  if (!trailHere(s) || !Number.isInteger(lamp) || lamp < 0 || lamp > 2 || ![0, 1].includes(side) || t.lit.includes(lamp) || !t.seeds.includes(lamp * 2 + side)) return false;
  t.placed[lamp] ^= 1 << side; return true;
}
export function lightTrailLamp(s: Save, lamp: number) {
  const t = s.forestTrail;
  if (!trailHere(s) || lamp !== t.lit.length || lamp < 0 || lamp > 2 || t.placed[lamp] !== 3 || !t.seeds.includes(lamp * 2) || !t.seeds.includes(lamp * 2 + 1)) return false;
  const [a, b] = trailPair(s.grade, lamp);
  if (!/^\d{1,3}$/.test(t.drafts[lamp]) || Number(t.drafts[lamp]) !== a + b) return false;
  t.lit.push(lamp); return true;
}
export function validForestTrail(value: unknown): value is ForestTrail {
  if (!value || typeof value !== 'object') return false;
  const t = value as ForestTrail, int = (n: unknown, max: number) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= max;
  return Array.isArray(t.seeds) && t.seeds.length <= 6 && t.seeds.every(n => int(n, 5)) && new Set(t.seeds).size === t.seeds.length
    && Array.isArray(t.lit) && t.lit.length <= 3 && t.lit.every((n, i) => n === i && t.seeds.includes(n * 2) && t.seeds.includes(n * 2 + 1))
    && Array.isArray(t.placed) && t.placed.length === 3 && t.placed.every((n, i) => int(n, 3) && (!(n & 1) || t.seeds.includes(i * 2)) && (!(n & 2) || t.seeds.includes(i * 2 + 1)))
    && t.lit.every(n => t.placed[n] === 3) && Array.isArray(t.drafts) && t.drafts.length === 3 && t.drafts.every(v => typeof v === 'string' && /^\d{0,3}$/.test(v));
}
export function trailGoal(s: Save): { label: string; guide: 'trailSeed' | 'trailLamp' } {
  const t = s.forestTrail, lamp = t.lit.length;
  return lamp === 3 ? { label: '빛씨앗 오솔길 완성! 빛나는 나무 구경하기', guide: 'trailLamp' }
    : t.seeds.includes(lamp * 2) && t.seeds.includes(lamp * 2 + 1)
      ? { label: `등불 ${lamp + 1}/3 · 나무 등불에서 빛 합치기`, guide: 'trailLamp' }
      : { label: `등불 ${lamp + 1}/3 · 빛씨앗 묶음 ${[lamp * 2, lamp * 2 + 1].filter(n => t.seeds.includes(n)).length}/2 찾기`, guide: 'trailSeed' };
}
