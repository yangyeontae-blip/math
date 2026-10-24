import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackError, sendFeedback, type FeedbackPayload } from '../src/feedback';

const payload: FeedbackPayload = { category: '개선 제안', message: '상점 간판을 더 크게 해 주세요.', consent: true, requestId: '12345678-1234-4234-8234-123456789abc' };
test('feedback validates explicit consent and message limits before making a request', async () => {
  assert.ok(feedbackError('알 수 없음', '좋아요 좋아요', true));
  assert.ok(feedbackError(payload.category, '    ', true));
  assert.ok(feedbackError(payload.category, '가'.repeat(1001), true));
  assert.equal(feedbackError(payload.category, '가'.repeat(1000), true), '');
  let calls = 0;
  await assert.rejects(sendFeedback({ ...payload, consent: false }, (async () => { calls++; return new Response(); }) as typeof fetch));
  assert.equal(calls, 0);
});
test('feedback sends only volunteered text and category; retries preserve idempotency key', async () => {
  const requests: object[] = [];
  const fetcher = (async (_url: unknown, init: RequestInit) => {
    requests.push(JSON.parse(init.body as string)); assert.equal(init.credentials, 'omit');
    return Response.json({ ok: true });
  }) as typeof fetch;
  await sendFeedback({ ...payload, nickname: 'not-to-be-sent', save: { berries: 10 } } as FeedbackPayload, fetcher);
  await sendFeedback(payload, fetcher);
  assert.deepEqual(requests, [payload, payload]);
});
test('feedback treats missing service, invalid success, provider errors and offline requests as failures', async () => {
  for (const response of [Response.json({ ok: true }, { status: 503 }), Response.json({}), new Response('old server', { status: 404 }), Response.json({ error: 'limit' }, { status: 429 })]) {
    await assert.rejects(sendFeedback(payload, (async () => response) as typeof fetch));
  }
  await assert.rejects(sendFeedback(payload, (async () => { throw new TypeError('offline'); }) as typeof fetch), /接続|연결/);
});
