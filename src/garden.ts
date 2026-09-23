import type { Save } from './rules';

export const RESCUES = [
  { total: 6, groups: 2, name: '길 잃은 아기양', story: '비가 오기 전에 아기양을 우리에 똑같이 나눠 데려다주세요.' },
  { total: 12, groups: 3, name: '숲속 소풍', story: '소풍을 나온 양들이 쉬어 갈 우리를 찾고 있어요.' },
  { total: 20, groups: 4, name: '별빛 귀가 작전', story: '해가 지고 있어요! 마지막 양들도 모두 집으로 데려다주세요.' },
] as const;
export const FLOWERS = ['🌷', '🌻', '🌸'];
export function gardenOf(s: Save) { return s.garden ??= { rescued: 0, flowers: [-1, -1, -1] }; }
export function rescueSheep(s: Save, round: number, pens: number[]) {
  const garden = gardenOf(s), quest = RESCUES[round];
  if (!quest || round !== garden.rescued || pens.length !== quest.groups || !pens.every(n => Number.isInteger(n) && n === quest.total / quest.groups)) return false;
  garden.rescued++; return true;
}
export function plantFlower(s: Save, slot: number, flower: number) {
  const garden = gardenOf(s);
  if (!Number.isInteger(slot) || slot < 0 || slot > 2 || !Number.isInteger(flower) || flower < 0 || flower >= FLOWERS.length) return false;
  if (garden.flowers[slot] < 0 && garden.flowers.filter(f => f >= 0).length >= garden.rescued) return false;
  garden.flowers[slot] = flower; return true;
}
