import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markBackup, shouldRemindBackup } from '../src/backup';

const memory = () => { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } }; };
const DAY = 86_400_000, NOW = Date.UTC(2026, 9, 1);

test('backup reminder waits for progress, then asks at most once a day', () => {
  const storage = memory();
  assert.equal(shouldRemindBackup(storage, 2, NOW), false);
  assert.equal(shouldRemindBackup(storage, 5, NOW), true);
  assert.equal(shouldRemindBackup(storage, 5, NOW + 3_600_000), false);
  assert.equal(shouldRemindBackup(storage, 5, NOW + DAY + 1), true);
});

test('a recent backup silences the reminder for a week', () => {
  const storage = memory(); markBackup(storage, NOW);
  assert.equal(shouldRemindBackup(storage, 10, NOW + 6 * DAY), false);
  assert.equal(shouldRemindBackup(storage, 10, NOW + 8 * DAY), true);
});

test('broken storage never throws', () => {
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.doesNotThrow(() => markBackup(broken)); assert.doesNotThrow(() => shouldRemindBackup(broken, 9));
});
