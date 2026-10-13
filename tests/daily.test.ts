import assert from 'node:assert/strict';
import test from 'node:test';
import { DAILY_MISSIONS, claimDaily, dailyReady, dailyStampsShown, ensureDaily, recordDaily } from '../src/daily';
import { newSave, validateSave } from '../src/rules';

const finish = (s: ReturnType<typeof newSave>, day: string) => { for (const m of DAILY_MISSIONS) recordDaily(s, m.kind, m.goal, day); };

test('daily progress is capped and resets on a new day', () => {
  const s = newSave('콩이', 0);
  recordDaily(s, 'correct', 99, '2026-10-01');
  assert.equal(ensureDaily(s, '2026-10-01').progress[0], DAILY_MISSIONS[0].goal);
  assert.deepEqual(ensureDaily(s, '2026-10-02').progress, [0, 0, 0]);
});

test('claiming needs a finished mission and cannot be repeated', () => {
  const s = newSave('콩이', 0); const day = '2026-10-01';
  assert.throws(() => claimDaily(s, 0, day));
  recordDaily(s, 'correct', 5, day); assert.equal(dailyReady(s, day), true);
  const before = s.berries, r = claimDaily(s, 0, day);
  assert.equal(s.berries, before + r.berries); assert.equal(r.stamp, true); assert.equal(r.streak, 1);
  assert.throws(() => claimDaily(s, 0, day)); assert.equal(dailyReady(s, day), false);
});

test('all-clear bonus is paid once and streak grows only on consecutive days', () => {
  const s = newSave('콩이', 0);
  finish(s, '2026-10-01'); const results = [0, 1, 2].map(i => claimDaily(s, i, '2026-10-01'));
  assert.deepEqual(results.map(r => r.allClear), [false, false, true]); assert.equal(results[1].stamp, false);
  finish(s, '2026-10-02'); assert.equal(claimDaily(s, 0, '2026-10-02').streak, 2);
  finish(s, '2026-10-05'); assert.equal(claimDaily(s, 0, '2026-10-05').streak, 1);
});

test('seventh stamp gives a berry potion and stamp board wraps', () => {
  const s = newSave('콩이', 0); let last: ReturnType<typeof claimDaily> | undefined;
  for (let day = 1; day <= 7; day++) { const key = `2026-10-${String(day).padStart(2, '0')}`; recordDaily(s, 'correct', 5, key); last = claimDaily(s, 0, key); }
  assert.equal(last!.potion, true); assert.equal(s.potions.stock[0], 1); assert.equal(dailyStampsShown(7), 7); assert.equal(dailyStampsShown(8), 1); assert.equal(dailyStampsShown(0), 0);
});

test('saves with or without daily data validate, and tampered data is rejected', () => {
  const s = newSave('콩이', 0); assert.doesNotThrow(() => validateSave(s));
  recordDaily(s, 'correct', 5, '2026-10-01'); claimDaily(s, 0, '2026-10-01'); assert.doesNotThrow(() => validateSave(s));
  const bad = structuredClone(s); bad.daily!.claimed[1] = true; assert.throws(() => validateSave(bad));
});
