import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptiveRecord, startLevel, adaptiveEnabled, setAdaptive } from '../src/adaptive';

const run = (level = startLevel(1), results: boolean[]) => results.reduce(adaptiveRecord, level);

test('three correct answers in a row raise the tier, and the streak restarts', () => {
  let level = run(startLevel(0), [true, true]); assert.deepEqual(level, { tier: 0, streak: 2, misses: 0 });
  level = adaptiveRecord(level, true); assert.deepEqual(level, { tier: 1, streak: 0, misses: 0 });
  assert.equal(run(level, [true, true, true]).tier, 2);
});

test('two misses in a row lower the tier, and a correct answer clears the misses', () => {
  assert.deepEqual(run(startLevel(2), [false]), { tier: 2, streak: 0, misses: 1 });
  assert.equal(run(startLevel(2), [false, true, false]).tier, 2);
  assert.equal(run(startLevel(2), [false, false]).tier, 1);
  assert.equal(run(startLevel(1), [false, false, false, false]).tier, 0);
});

test('the tier never leaves the easy-to-hard range', () => {
  assert.equal(run(startLevel(2), Array(9).fill(true)).tier, 2);
  assert.equal(run(startLevel(0), Array(9).fill(false)).tier, 0);
});

test('adaptive mode is off by default and survives broken storage', () => {
  const data = new Map<string, string>(), store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
  assert.equal(adaptiveEnabled(store), false); setAdaptive(true, store); assert.equal(adaptiveEnabled(store), true); setAdaptive(false, store); assert.equal(adaptiveEnabled(store), false);
  const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
  assert.equal(adaptiveEnabled(broken), false); assert.doesNotThrow(() => setAdaptive(true, broken));
});
