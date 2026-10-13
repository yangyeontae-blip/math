import assert from 'node:assert/strict';
import test from 'node:test';
import { ambienceDelay, ambienceLabel, createAmbienceScene, spread } from '../src/ambience.ts';

function rolls(...values: number[]) {
  let index = 0;
  return () => values[index++] ?? .5;
}

test('ambience is created from random rolls instead of the device clock', () => {
  assert.deepEqual(createAmbienceScene(rolls(.2, .2, .8)), { season: 'green', mood: 'day', weather: 'clear' });
  assert.deepEqual(createAmbienceScene(rolls(.7, .7, .8)), { season: 'autumn', mood: 'night', weather: 'clear' });
  assert.deepEqual(createAmbienceScene(rolls(.9, .9, .2)), { season: 'winter', mood: 'night', weather: 'snow' });
});

test('snow belongs to winter and scene labels explain the event', () => {
  const winter = createAmbienceScene(rolls(.9, .1, .1));
  const autumn = createAmbienceScene(rolls(.7, .1, .1));
  assert.equal(winter.weather, 'snow');
  assert.notEqual(autumn.weather, 'snow');
  assert.match(ambienceLabel(winter), /겨울.*눈 내림/);
  assert.match(ambienceLabel(autumn), /가을/);
});

test('particle positions are scattered, not lined up in a few columns', () => {
  for (const salt of [1, 2, 3, 4, 5, 6]) {
    const values = Array.from({ length: 22 }, (_, i) => spread(i, salt));
    assert.ok(values.every(v => v >= 0 && v < 1), `salt ${salt} out of range`);
    assert.ok(new Set(values.map(v => v.toFixed(3))).size >= 20, `salt ${salt} repeats values`);
  }
  const xs = Array.from({ length: 14 }, (_, i) => Math.floor(spread(i, 4) * 8));
  assert.ok(new Set(xs).size >= 5, 'x positions cover most of the width');
});

test('each ambience scene lasts two to four minutes', () => {
  assert.equal(ambienceDelay(() => 0), 120_000);
  const latest = ambienceDelay(() => .99999);
  assert.ok(latest >= 120_000 && latest <= 240_000, `delay ${latest}`);
});
