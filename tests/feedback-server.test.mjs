import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleFeedback } from '../worker/feedback.js';

const payload = { category: '오류 제보', message: '상점 문 앞에서 멈췄어요. <script>text only</script>', consent: true, requestId: '12345678-1234-4234-8234-123456789abc' };
const request = (body = payload, origin = 'https://yangyeontae-blip.github.io', method = 'POST') => new Request('https://berry.example/api/feedback', { method, headers: { origin, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
const env = () => ({ RESEND_API_KEY: 'test-secret', FEEDBACK_FROM: 'game@example.test', FEEDBACK_TO: 'owner@example.test', DB: { prepare(sql) { return { bind: () => ({ run: async () => ({}), first: async () => ({ hits: 1 }) }) }; } } });

test('feedback rejects untrusted origins, methods, absent configuration and malformed consent/body', async () => {
  let calls = 0; const mail = async () => { calls++; return Response.json({ id: 'test' }); };
  assert.equal((await handleFeedback(request(payload, 'https://other.example'), env(), mail)).status, 403);
  assert.equal((await handleFeedback(request(payload, '', 'POST'), env(), mail)).status, 403);
  assert.equal((await handleFeedback(request(payload, undefined, 'GET'), env(), mail)).status, 405);
  assert.equal((await handleFeedback(request(), {}, mail)).status, 503);
  for (const body of [null, { ...payload, consent: false }, { ...payload, requestId: 'x' }, { ...payload, category: 'bad' }, { ...payload, message: 'a'.repeat(1001) }]) assert.equal((await handleFeedback(request(body), env(), mail)).status, 400);
  assert.equal(calls, 0);
});
test('feedback email uses only server recipient and plain text, without user identity or save data', async () => {
  const statements = []; const settings = env();
  settings.DB.prepare = sql => ({ bind: (...args) => { statements.push({ sql, args }); return { run: async () => ({}), first: async () => ({ hits: 1 }) }; } });
  const sent = [];
  const mail = async (url, init) => { sent.push({ url, init, body: JSON.parse(init.body) }); return Response.json({ id: 'accepted' }); };
  const response = await handleFeedback(request({ ...payload, to: 'attacker@example.test', nickname: 'hidden', save: { berries: 1 } }), settings, mail);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(sent[0].body.to, [settings.FEEDBACK_TO]); assert.equal(sent[0].body.html, undefined);
  assert.equal(sent[0].body.text, `분류: 오류 제보\n\n${payload.message}`);
  assert.equal(sent[0].init.headers['Idempotency-Key'], `berry-feedback/${payload.requestId}`);
  assert.equal(sent[0].init.headers.authorization, 'Bearer test-secret');
  assert.ok(statements.every(row => !JSON.stringify(row).includes(payload.message) && !JSON.stringify(row).includes('192.0.2.1')));
});
test('feedback limits persist via D1 and mail failures never report success', async () => {
  const settings = env(); settings.DB.prepare = () => ({ bind: () => ({ run: async () => ({}), first: async () => null }) });
  assert.equal((await handleFeedback(request(), settings, async () => { throw new Error('must not send'); })).status, 429);
  for (const mail of [async () => Response.json({ error: 'failed' }, { status: 401 }), async () => Response.json({}), async () => { throw new Error('timeout'); }]) {
    const response = await handleFeedback(request(), env(), mail); assert.ok([502, 503].includes(response.status)); assert.notEqual((await response.json()).ok, true);
  }
});
test('feedback handles CORS and enforces streamed byte limits even without content-length', async () => {
  const options = await handleFeedback(request(payload, undefined, 'OPTIONS'), {}, () => {});
  assert.equal(options.status, 204); assert.equal(options.headers.get('access-control-allow-origin'), 'https://yangyeontae-blip.github.io');
  assert.equal((await handleFeedback(request({ ...payload, message: '가'.repeat(7000) }), env())).status, 413);
  const malformed = new Request('https://berry.example/api/feedback', { method: 'POST', headers: { origin: 'https://yangyeontae-blip.github.io', 'content-type': 'application/json' }, body: '{' });
  assert.equal((await handleFeedback(malformed, env())).status, 400);
});
