import test from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, addRoomFurniture, canEnter, type SchoolGrade } from '../src/rules';
import { emptyStory, STORY_CHAPTERS, storyHere, storySpot, startStory, findStoryClue, solveStory, finishStory, seededRandom } from '../src/story';
import { gradeRegions, generateGradeQuestion } from '../src/grade-content';
import { generateCurriculumQuestion, answerCurriculumQuestion } from '../src/curriculum';
import { stageMonsters } from '../src/stages';
import { newActivity, activitySpec } from '../src/story-activities';

function prepareSolvedActivity(s: ReturnType<typeof newSave>) {
  const active = s.story.active!; active.activity = newActivity(active.chapter, s.grade);
  active.activity.values.fill(activitySpec(active.chapter, s.grade).target);
}

test('old version 14 save keeps progress and items while adding story state', () => {
  const before = newSave('아이', 0);
  before.berries = 521; before.weapons[2] = 1; before.journey.maps[1].monsters = stageMonsters(1).map((_, id) => id); before.journey.maps[1].cleared = true;
  const old = structuredClone(before) as unknown as Record<string, unknown>;
  old.version = 14; delete old.story;
  const after = validateSave(old);
  assert.equal(after.version, 22); assert.equal(after.berries, 521);
  assert.equal(after.weapons[2], 1); assert.equal(after.journey.maps[1].cleared, true);
  assert.deepEqual(after.story, emptyStory());
});

test('chapters unlock at stages 1, 4, 7 and clues require ordered interaction', () => {
  const s = newSave('아이', 0);
  assert.equal(startStory(s, 1, 42), false);
  assert.equal(startStory(s, 0, 42), true);
  s.journey.stage = 1;
  assert.equal(storyHere(s), true);
  assert.equal(findStoryClue(s, 1), false);
  for (let clue = 0; clue < 3; clue++) assert.equal(findStoryClue(s, clue), true);
  assert.equal(findStoryClue(s, 2), false);
  assert.equal(solveStory(s), false); prepareSolvedActivity(s);
  assert.equal(solveStory(s), true); assert.equal(solveStory(s), false);
  s.journey.stage = 0;
  const reward = finishStory(s);
  assert.deepEqual(reward, { chapter: 0, first: true, gift: STORY_CHAPTERS[0].gift });
  assert.equal(s.berries, 0); assert.equal(s.xp, 0);
  assert.equal(finishStory(s), null);
  assert.equal(startStory(s, 0, 42), true);
  s.journey.stage = 1;
  for (let clue = 0; clue < 3; clue++) findStoryClue(s, clue);
  prepareSolvedActivity(s); solveStory(s); s.journey.stage = 0;
  assert.equal(finishStory(s)?.first, false);
  assert.deepEqual(s.story.completed, [0]);
  for (let stage = 1; stage <= 6; stage++) s.journey.maps[stage].cleared = true;
  assert.equal(canEnter(s, 4), true); assert.equal(canEnter(s, 7), true);
  assert.equal(startStory(s, 1), true);
});

test('story progress survives validation and pauses during other maps and expedition', () => {
  const s = newSave('아이', 0);
  startStory(s, 0, 123); s.journey.stage = 1; findStoryClue(s, 0);
  const restored = validateSave(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.story.active?.found, [0]); assert.equal(restored.story.active?.seed, 123);
  restored.journey.stage = 0; assert.equal(storyHere(restored), false);
  restored.journey.stage = 1; restored.forest = 'multiplication'; assert.equal(storyHere(restored), false);
  restored.forest = 'division';
  restored.expedition.active = { stage: 1, stars: [], monsters: [], gateQuestion: { dividend: 20, divisor: 2, answer: 10, operation: 'division' }, storyKind: 0 };
  assert.equal(storyHere(restored), false);
  assert.equal(findStoryClue(restored, 1), false);
});

test('clue spots stay on known safe paths; deterministic questions suit grades 1–6', () => {
  for (let chapter = 0; chapter < 3; chapter++) for (let clue = 0; clue < 3; clue++) {
    const spot = storySpot(chapter, clue); assert.ok(Math.abs(spot.x) <= 9 && Math.abs(spot.z) <= 18);
  }
  for (let grade = 1; grade <= 6; grade++) {
    const s = newSave('아이', 0, grade as SchoolGrade);
    const sets = gradeRegions(s.grade);
    for (let chapter = 0; chapter < 3; chapter++) {
      const unit = (['plane', 'fractionDecimal', 'measurement'] as const)[chapter], mission = chapter * 3;
      assert.ok(grade === 3 || [...sets!.first, ...sets!.second].some(item => item.id === unit));
      const factory = () => grade === 3 ? generateCurriculumQuestion(unit, mission, seededRandom(13)) : generateGradeQuestion(s.grade as Exclude<SchoolGrade, 3>, unit, mission, seededRandom(13));
      const first = factory(), second = factory();
      assert.deepEqual(first, second);
      assert.ok(first.prompt.length > 0 && first.hints.length === 3);
      assert.equal(answerCurriculumQuestion(first, first.answer), true);
    }
  }
});

test('room can stay full without consuming an owned story gift', () => {
  const s = newSave('아이', 0);
  s.story.completed.push(0);
  s.room.furniture = [...Array.from({ length: 17 }, (_, id) => id), 18, 19, 17];
  assert.equal(addRoomFurniture(s, 17), false);
  assert.deepEqual(s.story.completed, [0]);
  s.room.furniture.pop();
  assert.equal(addRoomFurniture(s, 17), true);
});
