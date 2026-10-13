import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

class FakeDB {
  rows = [{ player_id: 'device-1234567890', nickname: '별이', completed: 7 }];
  existing = null;
  writes = [];
  prepare(sql) {
    if (sql.includes('SELECT player_id')) return { all: async () => ({ results: this.rows }) };
    if (sql.includes('WHERE player_id')) return { bind: () => ({ first: async () => this.existing }) };
    return { bind: (...values) => ({ run: async () => { this.writes.push(values); return { success: true }; } }) };
  }
}

const post = (body, ip = '1.1.1.1') => new Request('https://berry.example/api/rankings', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) });

test('ranking worker clamps impossible jumps and rejects bad nicknames', async () => {
  const db = new FakeDB();
  let response = await worker.fetch(post({ playerId: 'device-1234567890', nickname: '장난꾸러기', completed: 99999 }, '2.2.2.2'), { DB: db });
  assert.equal(response.status, 200); assert.equal((await response.json()).completed, 30); assert.equal(db.writes[0][2], 30);
  db.existing = { completed: 10, updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) };
  response = await worker.fetch(post({ playerId: 'device-1234567890', nickname: '장난꾸러기', completed: 500 }, '2.2.2.3'), { DB: db });
  assert.equal(db.writes[1][2], 13);
  db.existing = { completed: 10, updated_at: new Date(Date.now() - 2 * 3_600_000).toISOString().replace('T', ' ').slice(0, 19) };
  await worker.fetch(post({ playerId: 'device-1234567890', nickname: '장난꾸러기', completed: 500 }, '2.2.2.4'), { DB: db });
  assert.equal(db.writes[2][2], 25);
  const before = db.writes.length;
  response = await worker.fetch(post({ playerId: 'device-1234567890', nickname: '시 발', completed: 1 }, '2.2.2.5'), { DB: db });
  assert.equal(response.status, 422); assert.equal(db.writes.length, before);
});

test('ranking worker rate limits repeated writes from one address', async () => {
  const db = new FakeDB(); const statuses = [];
  for (let i = 0; i < 12; i++) statuses.push((await worker.fetch(post({ playerId: 'device-1234567890', nickname: '별이', completed: 1 }, '9.9.9.9'), { DB: db })).status);
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(200)); assert.deepEqual(statuses.slice(10), [429, 429]);
});

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

class FakeBossDB {
  rows = new Map();
  prepare(sql) {
    const rows = this.rows;
    return { bind: (...v) => ({
      first: async () => {
        if (sql.includes('COUNT(*)')) { const mine = [...rows.values()].filter(r => r.class_code === v[0] && r.week === v[1]); return { members: mine.length, damage: mine.reduce((s, r) => s + r.damage, 0) }; }
        return rows.get(v.join('|')) ?? null;
      },
      run: async () => { const key = v.slice(0, 3).join('|'), old = rows.get(key); rows.set(key, { class_code: v[0], week: v[1], player_id: v[2], damage: Math.max(v[3], old?.damage ?? 0), updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) }); return { success: true }; },
    }) };
  }
}
const bossPost = (body, ip) => new Request('https://berry.example/api/boss', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) });

test('boss api pools damage per class and week, clamps jumps and hides nothing personal', async () => {
  const db = new FakeBossDB();
  let res = await worker.fetch(bossPost({ classCode: '3반', playerId: 'device-aaaaaaaaaaaa', damage: 40 }, '5.5.5.1'), { DB: db });
  assert.equal(res.status, 200); let body = await res.json();
  assert.equal(body.members, 1); assert.equal(body.damage, 40); assert.equal(body.maxHp, 300); assert.equal(body.defeated, false); assert.equal(body.mine, 40);
  res = await worker.fetch(bossPost({ classCode: '3반', playerId: 'device-bbbbbbbbbbbb', damage: 99999 }, '5.5.5.2'), { DB: db }); body = await res.json();
  assert.equal(body.members, 2); assert.equal(body.mine, 100); assert.equal(body.damage, 140); assert.equal(body.maxHp, 400);
  res = await worker.fetch(new Request('https://berry.example/api/boss?class=3%EB%B0%98&player_id=device-aaaaaaaaaaaa', { headers: { origin: 'https://yangyeontae-blip.github.io' } }), { DB: db }); body = await res.json();
  assert.equal(res.status, 200); assert.equal(body.mine, 40); assert.deepEqual(Object.keys(body).sort(), ['classCode', 'damage', 'defeated', 'maxHp', 'members', 'mine', 'week']);
  const other = await (await worker.fetch(new Request('https://berry.example/api/boss?class=other'), { DB: db })).json(); assert.equal(other.members, 0); assert.equal(other.damage, 0);
});

test('boss api rejects bad input and reports a missing table as unavailable', async () => {
  const db = new FakeBossDB();
  for (const body of [{ classCode: 'a', playerId: 'device-aaaaaaaaaaaa', damage: 1 }, { classCode: '3반', playerId: 'short', damage: 1 }, { classCode: '3반', playerId: 'device-aaaaaaaaaaaa', damage: -1 }]) {
    assert.equal((await worker.fetch(bossPost(body, '6.6.6.1'), { DB: db })).status, 400);
  }
  assert.equal((await worker.fetch(new Request('https://berry.example/api/boss?class=x'), { DB: db })).status, 400);
  const broken = { prepare() { throw new Error('no such table: boss_progress'); } };
  assert.equal((await worker.fetch(new Request('https://berry.example/api/boss?class=3%EB%B0%98'), { DB: broken })).status, 503);
});
