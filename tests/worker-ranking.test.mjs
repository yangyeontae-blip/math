import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

class FakeDB {
  rows = [{ player_id: 'device-1234567890', nickname: '별이', completed: 7 }];
  writes = [];
  prepare(sql) {
    if (sql.includes('SELECT player_id')) return { all: async () => ({ results: this.rows }) };
    return { bind: (...values) => ({ run: async () => { this.writes.push(values); return { success: true }; } }) };
  }
}

test('ranking worker reads top scores and marks this device without exposing ids', async () => {
  const db = new FakeDB();
  const response = await worker.fetch(new Request('https://berry.example/api/rankings?player_id=device-1234567890', { headers: { origin: 'https://yangyeontae-blip.github.io' } }), { DB: db });
  assert.equal(response.status, 200); assert.equal(response.headers.get('access-control-allow-origin'), 'https://yangyeontae-blip.github.io');
  assert.deepEqual(await response.json(), { rankings: [{ rank: 1, nickname: '별이', completed: 7, isMine: true }] });
});

test('ranking worker validates and writes an anonymous best score', async () => {
  const db = new FakeDB();
  const request = new Request('https://berry.example/api/rankings', {
    method: 'POST', headers: { origin: 'http://127.0.0.1:5173', 'content-type': 'application/json' },
    body: JSON.stringify({ playerId: 'device-1234567890', nickname: ' 새별 ', completed: 9 }),
  });
  const response = await worker.fetch(request, { DB: db });
  assert.equal(response.status, 200); assert.deepEqual(db.writes, [['device-1234567890', '새별', 9]]);
  const bad = await worker.fetch(new Request('https://berry.example/api/rankings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ playerId: 'short', nickname: '<아이>', completed: -1 }) }), { DB: db });
  assert.equal(bad.status, 400); assert.equal(db.writes.length, 1);
});
