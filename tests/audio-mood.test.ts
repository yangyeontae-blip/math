import assert from 'node:assert/strict';
import test from 'node:test';
import { moodForHour } from '../src/audio.ts';

test('time of day picks a calm mood for every hour', () => {
  for (let h = 0; h < 24; h++) assert.ok(['day', 'dusk', 'night'].includes(moodForHour(h)));
  assert.equal(moodForHour(9), 'day');
  assert.equal(moodForHour(18), 'dusk');
  assert.equal(moodForHour(23), 'night');
  assert.equal(moodForHour(3), 'night');
});
