import assert from 'node:assert/strict';
import test from 'node:test';
import { newSave, validateSave } from '../src/rules.ts';
import { DONATION_GOALS, DONATION_MAX, applyDonation, donationError, donationOf, fetchDonationTotal, goalsReached, sendDonation } from '../src/donation.ts';

test('donating checks the amount and only changes berries after the server accepts', () => {
  const s = newSave('베리', 0, 3); s.berries = 500;
  assert.match(donationError(s, 0), /1베리 이상/);
  assert.match(donationError(s, 1.5), /1베리 이상/);
  assert.match(donationError(s, 600), /100개 모자라요/);
  assert.match(donationError(s, DONATION_MAX + 1), /한 번에/);
  assert.equal(donationError(s, 500), '');
  applyDonation(s, 300);
  assert.equal(s.berries, 200); assert.deepEqual(donationOf(s), { given: 300, gifts: 1 });
});

test('the donation record survives save round trips and older saves start at zero', () => {
  const s = newSave('베리', 0, 3); s.berries = 100; applyDonation(s, 40);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s)))?.donation, { given: 40, gifts: 1 });
  const old = JSON.parse(JSON.stringify(newSave('나루', 1, 3))); delete old.donation;
  assert.deepEqual(validateSave(old)?.donation, { given: 0, gifts: 0 });
  assert.throws(() => validateSave({ ...old, donation: { given: -1, gifts: 0 } }), /손상/);
});

test('goals open one by one as the shared total grows', () => {
  assert.equal(goalsReached(0), 0);
  assert.equal(goalsReached(DONATION_GOALS[0].at), 1);
  assert.equal(goalsReached(DONATION_GOALS[3].at * 2), 4);
});

test('server errors become child-friendly messages and nothing is applied', async () => {
  const down = (async () => new Response('{}', { status: 503 })) as typeof fetch;
  await assert.rejects(fetchDonationTotal(down), /준비하는 중/);
  const offline = (async () => { throw new TypeError('network'); }) as typeof fetch;
  await assert.rejects(sendDonation(10, crypto.randomUUID(), offline), /연결하지 못했어요/);
  const ok = (async (_url: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify({ ok: true, total: 10 + (init?.body ? 5 : 0), gifts: 1 }))) as typeof fetch;
  assert.deepEqual(await sendDonation(5, crypto.randomUUID(), ok), { total: 15, gifts: 1 });
});
