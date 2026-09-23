import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave } from '../src/rules.ts';
import { gardenOf, rescueSheep, plantFlower } from '../src/garden.ts';

test('rescue requires equal groups, correct order, and rewards each round once', () => {
  const s = newSave('구름', 0);
  assert.equal(rescueSheep(s, 0, [2, 4]), false);
  assert.equal(rescueSheep(s, 0, [3]), false);
  assert.equal(rescueSheep(s, 1, [4, 4, 4]), false);
  assert.equal(rescueSheep(s, 0, [3, 3]), true);
  assert.equal(rescueSheep(s, 0, [3, 3]), false);
  assert.equal(rescueSheep(s, 1, [4, 4, 4]), true);
  assert.equal(rescueSheep(s, 2, [5, 5, 5, 5]), true);
  assert.equal(gardenOf(s).rescued, 3);
});
test('planting spends earned seeds, redecorating is free, invalid slots fail', () => {
  const s = newSave('꽃', 1);
  assert.equal(plantFlower(s, 0, 0), false);
  rescueSheep(s, 0, [3, 3]);
  assert.equal(plantFlower(s, 0, 0), true);
  assert.equal(plantFlower(s, 1, 0), false);
  assert.equal(plantFlower(s, 0, 2), true);
  assert.equal(plantFlower(s, -1, 0), false);
  assert.equal(plantFlower(s, 0, 3), false);
  assert.deepEqual(gardenOf(s).flowers, [2, -1, -1]);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});
test('old saves gain an empty garden and malformed progress is rejected', () => {
  const s = newSave('기존', 2); delete s.garden;
  assert.deepEqual(gardenOf(validateSave(s)), { rescued: 0, flowers: [-1, -1, -1] });
  for (const garden of [{rescued: 4, flowers: [-1,-1,-1]}, {rescued: 0, flowers: [0,-1,-1]}, {rescued: 1, flowers: [9,-1,-1]}, {rescued: 1, flowers: []}]) {
    assert.throws(() => validateSave({...s, garden}));
  }
});
