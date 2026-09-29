import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getGlobalPlayerId, parseGlobalRanks, syncGlobalRank } from '../src/global-ranking.ts';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test('global ranking parser keeps only safe top-fifty rows', () => {
  const parsed = parseGlobalRanks({ rankings: [
    { rank: 1, nickname: '별이', completed: 12, isMine: true },
    { rank: 0, nickname: '<script>', completed: -1, isMine: false },
  ] });
  assert.deepEqual(parsed, [{ rank: 1, nickname: '별이', completed: 12, isMine: true }]);
  assert.deepEqual(parseGlobalRanks({ rankings: 'wrong' }), []);
});

test('a device keeps one anonymous player id', () => {
  const storage = new MemoryStorage();
  const first = getGlobalPlayerId(storage as unknown as Storage), second = getGlobalPlayerId(storage as unknown as Storage);
  assert.equal(first, second); assert.match(first, /^[a-zA-Z0-9-]{16,64}$/);
});

test('unchanged global score is submitted once but rankings still refresh', async () => {
  const storage = new MemoryStorage(), calls: string[] = [], originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    calls.push(init?.method ?? 'GET');
    return new Response(JSON.stringify({ rankings: [{ rank: 1, nickname: '별이', completed: 3, isMine: true }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    await syncGlobalRank(storage as unknown as Storage, 'device-1234567890', '별이', 3);
    await syncGlobalRank(storage as unknown as Storage, 'device-1234567890', '별이', 3);
    assert.deepEqual(calls, ['POST', 'GET', 'GET']);
  } finally { globalThis.fetch = originalFetch; }
});
