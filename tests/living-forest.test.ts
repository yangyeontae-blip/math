import test from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, type SchoolGrade } from '../src/rules';
import { startStory, findStoryClue, solveStory, finishStory } from '../src/story';
import { activitySpec, newActivity, adjustActivity, activitySolved, validActivity } from '../src/story-activities';
import { petFriend, strokePet, walkWithPet, validPetFriends } from '../src/pet-care';

test('all three manipulatives have reachable exact solutions for grades 1–6', () => {
  for (let grade = 1; grade <= 6; grade++) for (let chapter = 0; chapter < 3; chapter++) {
    const a = newActivity(chapter, grade as SchoolGrade), spec = activitySpec(chapter, a.grade);
    assert.equal(activitySolved(a, chapter), false);
    for (let group = 0; group < spec.groups; group++) {
      assert.equal(adjustActivity(a, chapter, group, -1), false);
      for (let amount = 0; amount < spec.target; amount += spec.step) assert.equal(adjustActivity(a, chapter, group, 1), true);
    }
    assert.equal(validActivity(a, chapter), true); assert.equal(activitySolved(a, chapter), true);
    assert.equal(adjustActivity(a, chapter, -1, 1), false);
    assert.equal(adjustActivity(a, chapter, 0, .5), false);
    assert.equal(adjustActivity(a, chapter, 0, -1), true); assert.equal(activitySolved(a, chapter), false);
  }
});

test('unequal sharing and overflowing a water tank do not pass', () => {
  const bridge = newActivity(0, 3), water = newActivity(1, 3);
  bridge.values = [12, 0, 6, 6]; assert.equal(activitySolved(bridge, 0), false);
  assert.equal(adjustActivity(bridge, 0, 1, 1), false);
  water.values = [2250]; assert.equal(adjustActivity(water, 1, 0, 1), false); assert.equal(activitySolved(water, 1), false);
  assert.equal(validActivity({ ...water, values: [251] }, 1), false);
  assert.equal(validActivity({ ...water, kind: 'cake' }, 1), false);
});

test('partial puzzle, hint and retry survive reload without changing currency', () => {
  const s = newSave('모험가', 0); s.berries = 123;
  startStory(s, 0); s.journey.stage = 1; for (let i = 0; i < 3; i++) findStoryClue(s, i);
  s.story.active!.activity = newActivity(0, 3); adjustActivity(s.story.active!.activity, 0, 0, 1);
  s.story.active!.activity.hints = 1; s.story.active!.activity.mistakes = 2;
  const restored = validateSave(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.story, s.story); assert.equal(restored.berries, 123);
  assert.equal(solveStory(restored), false);
  restored.story.active!.activity!.values.fill(6); assert.equal(solveStory(restored), true);
  assert.equal(solveStory(restored), false); restored.journey.stage = 0;
  assert.equal(finishStory(restored)?.first, true); assert.equal(finishStory(restored), null);
  assert.equal(restored.berries, 123); assert.equal(restored.xp, 0);
  assert.deepEqual(validateSave(restored).story.completed, [0]);
});

test('version 15 solved letters and village milestones migrate without progress loss', () => {
  const s = newSave('모험가', 0); startStory(s, 0); s.story.active!.found = [0, 1, 2]; s.story.active!.solved = true;
  s.story.completed = [1, 2]; s.berries = 345;
  const old = JSON.parse(JSON.stringify(s)); old.version = 15; delete old.petFriends; delete old.story.active.activity;
  const restored = validateSave(old);
  assert.equal(restored.version, 17); assert.equal(restored.story.active!.solved, true);
  assert.equal(finishStory(restored)?.first, true); assert.deepEqual(restored.story.completed, [1, 2, 0]); assert.equal(restored.berries, 345);
});

test('pet affection has no date decay, clicks cannot farm bond, movement unlocks cosmetics', () => {
  const s = newSave('모험가', 0); s.pets[1] = true; s.pet = 1;
  for (let i = 0; i < 100; i++) strokePet(s);
  assert.equal(petFriend(s).bond, 3); assert.equal(s.berries, 0); assert.equal(s.xp, 0);
  assert.equal(walkWithPet(s, Infinity), false); assert.equal(walkWithPet(s, -1), false); assert.equal(walkWithPet(s, 100), false);
  for (let i = 0; i < 540; i++) walkWithPet(s, 1);
  const friend = petFriend(s); assert.equal(friend.bond, 12); friend.accessory = true; friend.name = '솜사탕';
  const restored = validateSave(JSON.parse(JSON.stringify(s))); assert.deepEqual(restored.petFriends, s.petFriends);
  assert.equal(validPetFriends({ 2: { ...friend } }, s.pets), false);
  assert.equal(validPetFriends({ 1: { ...friend, bond: 1 } }, s.pets), false);
});
