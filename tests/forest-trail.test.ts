import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, type SchoolGrade } from '../src/rules';
import { emptyForestTrail, collectTrailSeed, lightTrailLamp, moveTrailBundle, trailPair, trailHere, trailGoal, validForestTrail } from '../src/forest-trail';

const start = (grade: SchoolGrade = 1) => { const s = newSave('숲친구', 0, grade); s.forest = 'addition'; s.additionJourney.stage = 1; s.position = { x: 0, z: 24 }; return s; };
test('version 18 migrates to 21 preserving currency, equipment, learning, village designs and progress', () => {
  const s = start(3); s.berries = 543; s.learning.correct = 12; s.adventure.completed = [0];
  const old = { ...structuredClone(s), version: 18 } as Record<string, unknown>; delete old.forestTrail;
  const restored = validateSave(old);
  assert.equal(restored.version, 22); assert.deepEqual(restored.forestTrail, emptyForestTrail());
  for (const key of ['berries', 'weapons', 'learning', 'adventure', 'additionJourney'] as const) assert.deepEqual(restored[key], s[key]);
});
test('trail belongs only to addition stage 1, and cannot change another forest or expedition', () => {
  const s = start(); assert.equal(trailHere(s), true);
  for (const forest of ['subtraction', 'multiplication', 'division'] as const) { s.forest = forest; assert.equal(collectTrailSeed(s, 0), false); }
  s.forest = 'addition'; s.additionJourney.stage = 2; assert.equal(moveTrailBundle(s, 0, 0), false);
  s.additionJourney.stage = 1; s.room.inside = true; assert.equal(collectTrailSeed(s, 0), false);
});
test('collection, placement and an unfinished answer survive reload; wrong answers and leaving lose nothing', () => {
  const s = start(); s.berries = 66; assert.equal(moveTrailBundle(s, 0, 0), false);
  assert.equal(collectTrailSeed(s, 0), true); assert.equal(collectTrailSeed(s, 0), false); collectTrailSeed(s, 1);
  moveTrailBundle(s, 0, 0); moveTrailBundle(s, 0, 1); s.forestTrail.drafts[0] = '4';
  const before = structuredClone(s); assert.equal(lightTrailLamp(s, 0), false); assert.deepEqual(s, before);
  const restored = validateSave(s); assert.deepEqual(restored.forestTrail, s.forestTrail);
  restored.forestTrail.drafts[0] = '5'; assert.equal(lightTrailLamp(restored, 0), true);
  assert.equal(lightTrailLamp(restored, 0), false); assert.equal(moveTrailBundle(restored, 0, 0), false); assert.equal(restored.berries, 66);
});
test('all grades complete three ordered addition lamps with no repeat reward or stage unlock', () => {
  for (const grade of [1, 2, 3, 4, 5, 6] as SchoolGrade[]) {
    const s = start(grade), before = structuredClone(s.additionJourney);
    for (let i = 0; i < 6; i++) assert.equal(collectTrailSeed(s, i), true);
    assert.equal(lightTrailLamp(s, 1), false);
    for (let lamp = 0; lamp < 3; lamp++) {
      const [a, b] = trailPair(grade, lamp); if (grade === 1) assert.ok(a + b <= 10);
      moveTrailBundle(s, lamp, 0); moveTrailBundle(s, lamp, 1); s.forestTrail.drafts[lamp] = String(a + b);
      assert.equal(lightTrailLamp(s, lamp), true); assert.equal(lightTrailLamp(s, lamp), false);
      assert.deepEqual(validateSave(s).forestTrail, s.forestTrail);
    }
    assert.equal(s.berries, 0); assert.equal(s.xp, 0); assert.deepEqual(s.additionJourney, before);
    assert.match(trailGoal(s).label, /완성/);
  }
});
test('malformed or impossible trail states and future saves are rejected', () => {
  const s = start();
  for (const value of [null, {}, { ...emptyForestTrail(), seeds: [0, 0] }, { ...emptyForestTrail(), seeds: [6] }, { ...emptyForestTrail(), lit: [1] }, { ...emptyForestTrail(), placed: [3, 0, 0] }, { ...emptyForestTrail(), drafts: ['<x>', '', ''] }]) assert.equal(validForestTrail(value), false);
  for (const id of [-1, 6, 0.5, NaN]) assert.equal(collectTrailSeed(s, id), false);
  assert.throws(() => validateSave({ ...s, version: 23 }));
});
