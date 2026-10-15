import type { Save } from './rules';

export interface PetFriend { name: string; bond: number; walked: number; strokes: number; accessory: boolean }
export type PetFriends = Record<string, PetFriend>;
export const PET_TRICKS = [{ bond: 0, name: '쓰다듬기', action: 'happy' }, { bond: 3, name: '앉아', action: 'sit' }, { bond: 8, name: '빙글빙글', action: 'spin' }] as const;
export type PetReaction = 'happy' | 'sit' | 'spin' | 'sleep' | 'discover';
export function petFriend(s: Save, id = s.pet): PetFriend {
  if (id < 0 || !s.pets[id]) throw new Error('함께할 펫을 먼저 골라 주세요.');
  return s.petFriends[id] ??= { name: '', bond: 0, walked: 0, strokes: 0, accessory: false };
}
export function strokePet(s: Save): boolean {
  const friend = petFriend(s);
  // 애정 표현은 언제든 가능하고, 첫 세 번만 친밀도가 올라가요. 이후에는 함께 걸어요.
  if (friend.strokes >= 3) return false;
  friend.strokes++; friend.bond = Math.min(30, friend.bond + 1); return true;
}
export function walkWithPet(s: Save, distance: number): boolean {
  if (s.pet < 0 || !Number.isFinite(distance) || distance <= 0 || distance > 10) return false;
  const friend = petFriend(s), before = friend.bond;
  friend.walked += distance;
  while (friend.walked >= 60) { friend.walked -= 60; friend.bond = Math.min(30, friend.bond + 1); }
  return before !== friend.bond;
}
export function validPetFriends(value: unknown, owned: Save['pets']): value is PetFriends {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([id, f]) => /^\d+$/.test(id) && !!owned[id] && !!f && typeof f === 'object' && typeof f.name === 'string' && [...f.name].length <= 10 && !/[\u0000-\u001f<>]/.test(f.name) && Number.isInteger(f.bond) && f.bond >= 0 && f.bond <= 30 && Number.isFinite(f.walked) && f.walked >= 0 && f.walked < 60 && Number.isInteger(f.strokes) && f.strokes >= 0 && f.strokes <= 3 && typeof f.accessory === 'boolean' && (!f.accessory || f.bond >= 12));
}
