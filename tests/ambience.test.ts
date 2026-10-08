import assert from 'node:assert/strict';
import test from 'node:test';
import { ambienceDelay, ambienceLabel, createAmbienceScene } from '../src/ambience.ts';

function rolls(...values: number[]) {
  let index = 0;
  return () => values[index++] ?? .5;
}

test('ambience is created from random rolls instead of the device clock', () => {
  assert.deepEqual(createAmbienceScene(rolls(.2, .2, .8)), { season: 'green', mood: 'day', weather: 'clear' });
  assert.deepEqual(createAmbienceScene(rolls(.7, .7, .8)), { season: 'autumn', mood: 'dusk', weather: 'clear' });
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

test('each ambience scene lasts two to four minutes', () => {
  assert.equal(ambienceDelay(() => 0), 120_000);
  const latest = ambienceDelay(() => .99999);
  assert.ok(latest >= 120_000 && latest <= 240_000, `delay ${latest}`);
});
