import { journeyFor, type Save } from './rules';
import { discoveryId } from './exploration';

/** Menu callbacks rebuild the screen from the live save, rather than restoring stale HTML. */
export class MenuHistory {
  private entries: { key: string; render: () => void }[] = [];
  private revision = 0;
  enter(key: string, render: () => void) {
    const previous = this.entries.findIndex(entry => entry.key === key);
    if (previous >= 0) this.entries.length = previous;
    this.entries.push({ key, render });
    this.revision++;
  }
  get version() { return this.revision; }
  isCurrent(key: string, version: number) { return this.entries.at(-1)?.key === key && this.revision === version; }
  get current() { return this.entries.at(-1)?.render; }
  get hasParent() { return this.entries.length > 1; }
  back(): boolean {
    if (!this.hasParent) return false;
    this.entries.pop();
    this.current!();
    return true;
  }
  clear() { this.entries = []; this.revision++; }
}

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
  { id: 'home', icon: '🏡', title: '나의 집', detail: '방 · 정원 · 주민' },
  { id: 'shops', icon: '🛍️', title: '상점거리', detail: '옷과 얼굴, 펫과 무기를 골라요' },
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
