import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleDonation, DONATION_MAX } from '../worker/donation.js';

const origin = 'https://yangyeontae-blip.github.io';
const cors = request => request.headers.get('origin') === origin ? { 'access-control-allow-origin': origin } : {};
const json = (request, value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', ...cors(request) } });
const tools = (limited = false) => ({ json, corsHeaders: cors, rateLimited: () => limited });
const id = n => `12345678-1234-4234-8234-${String(n).padStart(12, '0')}`;
const post = (body, from = origin) => new Request('https://berry.example/api/donation', { method: 'POST', headers: { origin: from, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const get = () => new Request('https://berry.example/api/donation', { headers: { origin } });

function fakeDb() {
  const box = { total: 0, gifts: 0 }, gifts = new Map(), seen = [];
  return { box, gifts, seen, prepare(sql) { return { bind: (...args) => ({
    run: async () => { seen.push({ sql, args });
      if (sql.startsWith('INSERT OR IGNORE INTO donation_gifts')) { if (gifts.has(args[0])) return { meta: { changes: 0 } }; gifts.set(args[0], args[1]); return { meta: { changes: 1 } }; }
      if (sql.startsWith('INSERT INTO donation_box')) { box.total += args[0]; box.gifts += 1; }
      return { meta: { changes: 1 } }; },
  }), first: async () => (box.gifts ? { ...box } : null) }; } };
}

test('donation box starts at zero and adds each gift once', async () => {
  const DB = fakeDb(), env = { DB };
  assert.deepEqual(await (await handleDonation(get(), env, tools())).json(), { total: 0, gifts: 0 });
  assert.deepEqual(await (await handleDonation(post({ amount: 300, requestId: id(1) }), env, tools())).json(), { ok: true, total: 300, gifts: 1 });
  assert.deepEqual(await (await handleDonation(post({ amount: 300, requestId: id(1) }), env, tools())).json(), { ok: true, total: 300, gifts: 1 });
  assert.deepEqual(await (await handleDonation(post({ amount: 50, requestId: id(2) }), env, tools())).json(), { ok: true, total: 350, gifts: 2 });
  assert.ok(DB.seen.every(row => !JSON.stringify(row).includes('nickname')));
});

test('donation box rejects bad amounts, other sites, floods and a missing database', async () => {
  const env = { DB: fakeDb() };
  for (const body of [{ amount: 0, requestId: id(3) }, { amount: 1.5, requestId: id(3) }, { amount: DONATION_MAX + 1, requestId: id(3) }, { amount: '10', requestId: id(3) }, { amount: 10, requestId: 'x' }]) assert.equal((await handleDonation(post(body), env, tools())).status, 400);
  assert.equal((await handleDonation(post({ amount: 10, requestId: id(4) }, 'https://other.example'), env, tools())).status, 403);
  assert.equal((await handleDonation(post({ amount: 10, requestId: id(4) }), env, tools(true))).status, 429);
  assert.equal((await handleDonation(get(), {}, tools())).status, 503);
  assert.equal(env.DB.box.total, 0);
});
