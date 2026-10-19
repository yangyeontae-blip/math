import { journeyFor, type Save } from './rules';
import { discoveryId } from './exploration';

export type FocusKind = 'story' | 'project' | 'room' | 'craft' | 'visit' | 'expedition' | 'discover' | 'explore' | 'start';
/** Existing progress is the source of truth; opening a menu never changes the chosen adventure. */
export function adventureFocus(s: Save): FocusKind {
  if (s.room.inside) return 'room';
  if (s.homestead.inside) return s.adventure.active ? 'project' : s.homestead.objects.some(o => [6, 18].includes(o.kind)) ? 'visit' : 'craft';
  if (s.expedition.active) return 'expedition';
  if (s.story.active) return 'story';
  if (s.adventure.active) return 'project';
  const stage = journeyFor(s).stage;
  if (stage) return s.exploration.solved.includes(discoveryId(s.forest, stage)) ? 'explore' : 'discover';
  if (!s.homestead.objects.length && s.exploration.solved.length) return 'craft';
  return 'start';
}

export const HUB_DESTINATIONS = [
  { id: 'explore', icon: '🌳', title: '숲으로 모험', detail: '숲을 고르고, 숨은 장소를 발견해요' },
  { id: 'home', icon: '🏡', title: '나의 마을', detail: '집 밖 정원 · 집 안 · 함께 만드는 정원' },
  { id: 'shops', icon: '🛍️', title: '상점 거리', detail: '옷과 얼굴, 펫과 모험 도구를 골라요' },
] as const;

/** Only the closest actionable name floats above the world. Directions live in the map. */
export function showEntityLabel(id: string, nearest: string | null, visible: boolean): boolean {
  return visible && id === nearest;
}

/** Keep v21's position range so older clients can still read the same save. */
export function savedGardenPosition(x: number, z: number): { x: number; z: number } {
  return Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 13 && Math.abs(z) <= 13
    ? { x, z } : { x: 0, z: 12 };
}
