import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLocalRanks, updateLocalRanks } from '../src/ranking.ts';

test('local expedition ranking keeps each nickname best and sorts safely', () => {
  let ranks = updateLocalRanks([], '하나', 3);
  ranks = updateLocalRanks(ranks, '민준', 7);
  ranks = updateLocalRanks(ranks, '하나', 5);
  ranks = updateLocalRanks(ranks, '하나', 2);
  assert.deepEqual(ranks, [{ nickname: '민준', completed: 7 }, { nickname: '하나', completed: 5 }]);
  assert.deepEqual(parseLocalRanks(JSON.stringify(ranks)), ranks);
  assert.deepEqual(parseLocalRanks('{broken'), []);
  assert.deepEqual(parseLocalRanks(JSON.stringify([{ nickname: '<script>', completed: -1 }])), []);
});

test('local ranking is capped at twenty players', () => {
  let ranks = [] as { nickname: string; completed: number }[];
  for (let i = 0; i < 30; i++) ranks = updateLocalRanks(ranks, `아이${i}`, i);
  assert.equal(ranks.length, 20); assert.equal(ranks[0].completed, 29); assert.equal(ranks.at(-1)?.completed, 10);
});
