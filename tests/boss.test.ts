import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoWeek, bossOfWeek, normalizeClassCode, readBoss, addBossDamage, setClassCode, claimBossReward, parseBossSummary, BOSS_REWARD } from '../src/boss';
// @ts-expect-error 워커는 번들 없이 그대로 배포하는 순수 JS라 타입 선언이 없어요.
import { isoWeekKey, normalizeClassCode as workerNormalize, bossMaxHp, allowedBossDamage } from '../worker/index.js';

const memory = () => { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } }; };
const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 12);

test('ISO weeks are right at year edges and match the worker', () => {
  const cases: [number, string][] = [[at(2026, 10, 2), '2026-W40'], [at(2026, 1, 1), '2026-W01'], [at(2024, 12, 30), '2025-W01'], [at(2021, 1, 3), '2020-W53'], [at(2026, 12, 31), '2026-W53']];
  for (const [time, expected] of cases) { assert.equal(isoWeek(time), expected); assert.equal(isoWeekKey(time), expected); }
});

test('class codes are validated the same on both sides', () => {
  for (const code of ['3반', ' AbC1 ', '별빛반']) assert.equal(normalizeClassCode(code), workerNormalize(code));
  for (const bad of ['', 'a', '반 이름', 'abc!', 'x'.repeat(13), '<b>']) { assert.equal(normalizeClassCode(bad), null); assert.equal(workerNormalize(bad), null); }
});

test('local damage resets every week and keeps the class code', () => {
  const store = memory(); const w1 = at(2026, 10, 1), w2 = at(2026, 10, 8);
  assert.equal(setClassCode(store, '3반', w1), '3반'); addBossDamage(store, 1, w1); addBossDamage(store, 4, w1);
  assert.equal(readBoss(store, w1).damage, 5); const next = readBoss(store, w2); assert.equal(next.damage, 0); assert.equal(next.classCode, '3반');
  assert.equal(setClassCode(store, '!!', w1), null); assert.equal(setClassCode(store, '', w1), ''); assert.equal(readBoss(store, w1).classCode, '');
});

test('the boss reward is paid once per week and only to active helpers', () => {
  const store = memory(), now = at(2026, 10, 1), week = isoWeek(now);
  const win = { week, classCode: '3반', members: 3, damage: 600, maxHp: 500, defeated: true, mine: 12 };
  setClassCode(store, '3반', now); addBossDamage(store, 9, now);
  assert.equal(claimBossReward(store, win, now), 0);
  addBossDamage(store, 1, now);
  assert.equal(claimBossReward(store, { ...win, defeated: false }, now), 0);
  assert.equal(claimBossReward(store, { ...win, week: '2020-W01' }, now), 0);
  assert.equal(claimBossReward(store, win, now), BOSS_REWARD); assert.equal(claimBossReward(store, win, now), 0);
  assert.equal(claimBossReward(store, null, now), 0);
});

test('server summaries are parsed strictly and boss strength grows with the class', () => {
  const good = { week: '2026-W40', classCode: '3반', members: 2, damage: 10, maxHp: 400, defeated: false, mine: 4 };
  assert.deepEqual(parseBossSummary(good), good);
  for (const bad of [null, 'x', { ...good, damage: -1 }, { ...good, members: 1.5 }, { ...good, defeated: 'no' }, { ...good, week: 5 }]) assert.equal(parseBossSummary(bad), null);
  assert.equal(bossMaxHp(0), 300); assert.equal(bossMaxHp(10), 1200);
  assert.ok(bossOfWeek('2026-W40').name.length > 0);
});

test('a player cannot add damage faster than the weekly allowance', () => {
  assert.equal(allowedBossDamage(null), 100);
  const now = Date.UTC(2026, 9, 1, 12), stamp = (ms: number) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
  assert.equal(allowedBossDamage({ damage: 50, updated_at: stamp(now) }, now), 70);
  assert.equal(allowedBossDamage({ damage: 50, updated_at: stamp(now - 2 * 3_600_000) }, now), 310);
  assert.equal(allowedBossDamage({ damage: 990, updated_at: stamp(now - 100 * 3_600_000) }, now), 1000);
});