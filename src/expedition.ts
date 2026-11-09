import { pickQuestion, type Question, type Save } from './rules';
import { stageMonsters, stageSize } from './stages';

export {EXPEDITION_TITLES} from './titles';
import {EXPEDITION_TITLES} from './titles';

// Every marker sits on one of the broad, unobstructed paths on all hunt maps.
export const EXPEDITION_STAR_SPOTS = [
  { x: 0, z: 18 }, { x: -9, z: 14 }, { x: 9, z: 14 },
  { x: 0, z: 5 }, { x: -9, z: 0 }, { x: 9, z: 0 },
  { x: 0, z: -8 }, { x: -9, z: -15 }, { x: 9, z: -15 },
] as const;

export type ExpeditionProgress = {
  completed: number;
  selectedTitle: number;
  active: null | {
    stage: number;
    stars: number[];
    monsters: number[];
    gateQuestion: Question;
    storyKind: 0 | 1;
  };
};

export function emptyExpedition(): ExpeditionProgress { return { completed: 0, selectedTitle: 0, active: null }; }
export function expeditionUnlocked(s: Save) { return s.grade >= 3 && (s.teacherMode || s.journey.maps.slice(1).every(map => map.cleared)); }
export function expeditionLayout(completed: number) {
  const stage = completed % 10 + 1;
  const stars = [0, 3, 6].map(offset => (completed * 2 + offset) % EXPEDITION_STAR_SPOTS.length);
  const total = stageMonsters(stage).length;
  const monsters = [completed % total, (completed + Math.ceil(total / 2)) % total];
  return { stage, stars, monsters };
}
export function startExpedition(s: Save) {
  if (!expeditionUnlocked(s)) return false;
  s.forest = 'division';
  const progress = s.expedition;
  const alreadyThere = !!progress.active && s.journey.stage === progress.active.stage && !s.room.inside;
  if (!progress.active) {
    const layout = expeditionLayout(progress.completed);
    progress.active = { stage: layout.stage, stars: [], monsters: [], gateQuestion: pickQuestion(s.level, undefined, layout.stage, s.settings.maxDividend), storyKind: progress.completed % 2 as 0 | 1 };
  }
  s.journey.stage = progress.active.stage;
  s.room.inside = false;
  if (!alreadyThere) s.position = { x: 0, z: stageSize(progress.active.stage).z - 9 };
  return true;
}
export function collectExpeditionStar(s: Save, id: number) {
  const active = s.expedition.active;
  if (!active || s.journey.stage !== active.stage || !expeditionLayout(s.expedition.completed).stars.includes(id) || active.stars.includes(id)) return false;
  active.stars.push(id); return true;
}
export function defeatExpeditionMonster(s: Save, id: number) {
  const active = s.expedition.active;
  if (!active || s.journey.stage !== active.stage || !expeditionLayout(s.expedition.completed).monsters.includes(id) || active.monsters.includes(id)) return false;
  active.monsters.push(id); return true;
}
export function canFinishExpedition(s: Save) {
  const active = s.expedition.active;
  if (!active || s.journey.stage !== active.stage) return false;
  const layout = expeditionLayout(s.expedition.completed);
  return active.stars.length === layout.stars.length && active.monsters.length === layout.monsters.length && layout.stars.every(id => active.stars.includes(id)) && layout.monsters.every(id => active.monsters.includes(id));
}
export function expeditionBerryReward(stage: number) { return 60 + Math.min(10, Math.max(1, stage)) * 15; }
export function finishExpedition(s: Save, answer: number) {
  if (!canFinishExpedition(s) || answer !== s.expedition.active!.gateQuestion.answer) return null;
  const berries = expeditionBerryReward(s.expedition.active!.stage);
  s.expedition.active = null;
  s.expedition.completed++;
  s.berries += berries;
  return { completed: s.expedition.completed, newTitle: EXPEDITION_TITLES.findIndex(t => t.need === s.expedition.completed), berries };
}
export function selectExpeditionTitle(s: Save, id: number) {
  if (!Number.isInteger(id) || !EXPEDITION_TITLES[id] || s.expedition.completed < EXPEDITION_TITLES[id].need) return false;
  s.expedition.selectedTitle = id; return true;
}
