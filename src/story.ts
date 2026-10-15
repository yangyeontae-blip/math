import type { ForestKind, Save } from './rules';
import { canEnter, journeyFor } from './rules';
import { EXPEDITION_STAR_SPOTS } from './expedition';

export const STORY_CHAPTERS = [
  { title: '잃어버린 숲 편지', stage: 1, gift: '숲 편지 액자', icon: '✉️', clues: ['바람에 날린 편지의 첫 장이에요. 숲 친구가 누군가를 기다리고 있대요.', '두 번째 장에는 작은 발자국이 그려져 있어요. 길을 따라가 볼까요?', '마지막 장에 수학으로 여는 봉인이 있어요. 친구의 마음을 찾아줘요!'], ending: '흩어진 편지를 다시 모아 숲 친구에게 전했어요.' },
  { title: '반짝 호수의 약속', stage: 4, gift: '반짝 호수 유리병', icon: '💧', clues: ['호숫가에서 반짝이는 쪽지를 찾았어요. 물방울 친구의 약속이 적혀 있어요.', '다음 쪽지에는 함께 나누고 싶은 것이 그려져 있어요.', '마지막 쪽지에 풀어야 할 수학 약속이 남아 있어요.'], ending: '물방울 친구와의 약속을 지켰어요. 호수에 작은 빛이 돌아왔어요.' },
  { title: '별빛 나무의 비밀', stage: 7, gift: '별빛 나무 장식', icon: '🌟', clues: ['오래된 나무 아래 별가루가 묻은 편지 조각이에요.', '두 번째 조각에는 밤하늘을 지키는 방법이 적혀 있어요.', '마지막 조각의 수학 문제를 풀면 별빛 나무가 빛날 거예요.'], ending: '별빛 나무가 반짝였어요. 숲의 친구들이 함께 밤하늘을 올려다봤어요.' },
] as const;
export interface StoryProgress {
  completed: number[];
  active: null | { chapter: number; forest: ForestKind; found: number[]; solved: boolean; seed: number };
}
export function emptyStory(): StoryProgress { return { completed: [], active: null }; }
export function storySpot(chapter: number, clue: number) {
  return EXPEDITION_STAR_SPOTS[([0, 3, 6][clue] + chapter) % EXPEDITION_STAR_SPOTS.length];
}
export function storyHere(s: Save) {
  const a = s.story.active;
  return !!a && a.forest === s.forest && STORY_CHAPTERS[a.chapter]?.stage === journeyFor(s).stage && !s.expedition.active;
}
export function startStory(s: Save, chapter: number, seed = Math.floor(Math.random() * 0x7fffffff)) {
  const info = STORY_CHAPTERS[chapter];
  if (!info || s.story.active || s.expedition.active || s.room.inside || journeyFor(s).stage !== 0 || !canEnter(s, info.stage, s.forest)) return false;
  s.story.active = { chapter, forest: s.forest, found: [], solved: false, seed: Math.max(0, Math.min(0x7fffffff, Math.floor(seed))) };
  return true;
}
export function findStoryClue(s: Save, clue: number) {
  const a = s.story.active;
  if (!a || !storyHere(s) || a.solved || clue !== a.found.length || clue < 0 || clue > 2) return false;
  a.found.push(clue);
  return true;
}
export function solveStory(s: Save) {
  const a = s.story.active;
  if (!a || !storyHere(s) || a.found.length !== 3 || a.solved) return false;
  a.solved = true;
  return true;
}
export function finishStory(s: Save) {
  const a = s.story.active;
  if (!a || !a.solved || s.expedition.active || s.room.inside || journeyFor(s).stage !== 0) return null;
  const chapter = a.chapter, first = !s.story.completed.includes(chapter);
  if (first) s.story.completed.push(chapter);
  s.story.active = null;
  return { chapter, first, gift: STORY_CHAPTERS[chapter].gift };
}
export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 0x100000000; };
}
