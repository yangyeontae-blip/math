import assert from 'node:assert/strict';
import test from 'node:test';
import { weatherForDate } from '../src/ambience.ts';

test('weather is stable within a day and rains only some days', () => {
  assert.equal(weatherForDate(new Date(2026, 9, 7, 8)), weatherForDate(new Date(2026, 9, 7, 22)));
  let rainy = 0;
  for (let d = 1; d <= 360; d++) if (weatherForDate(new Date(2026, 0, d)) === 'rain') rainy++;
  assert.ok(rainy > 30 && rainy < 90, `rainy days ${rainy}`);
});
