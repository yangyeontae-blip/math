import test from 'node:test';
import assert from 'node:assert/strict';
import { POSTBOX_SPOT, HALL_GUIDE_SPOT, VILLAGE_SPOTS, villageWelcomeClear } from '../src/village-layout';
import { GREETINGS, pickLine } from '../src/npc-lines';
import { POSTBOX_KINDS, postboxRewardToday, POSTBOX_REWARD } from '../src/postbox';
import { FEEDBACK_CATEGORIES, FEEDBACK_URL } from '../src/feedback';
import { sortedNotices } from '../src/notices';

test('우체통은 공지판 바로 옆 빈자리에, 뽀짝이와 겹치지 않게 선다', () => {
  const d = Math.hypot(POSTBOX_SPOT.x - VILLAGE_SPOTS.notice.x, POSTBOX_SPOT.z - VILLAGE_SPOTS.notice.z);
  assert.ok(d > 2.5 && d < 4.5, `distance ${d}`);
  assert.ok(villageWelcomeClear(POSTBOX_SPOT.x, POSTBOX_SPOT.z));
  assert.ok(Math.hypot(POSTBOX_SPOT.x - HALL_GUIDE_SPOT.x, POSTBOX_SPOT.z - HALL_GUIDE_SPOT.z) > 5);
});

test('우체통 편지 세 종류는 서버가 받는 의견 분류와 하나씩 맞는다', () => {
  assert.deepEqual(POSTBOX_KINDS.map(k => k.category).sort(), [...FEEDBACK_CATEGORIES].sort());
  for (let i = 0; i < 10; i++) assert.ok(GREETINGS.postbox.includes(pickLine('postbox', () => i / 10, { night: true })!));
  assert.ok(GREETINGS.postbox.some(l => l.includes('이름')));
});

test('편지 선물 베리는 하루에 한 번만', () => {
  const box = new Map<string, string>(), storage = { getItem: (k: string) => box.get(k) ?? null, setItem: (k: string, v: string) => void box.set(k, v) };
  const day = new Date(2026, 10, 23, 9), later = new Date(2026, 10, 23, 20), next = new Date(2026, 10, 24, 8);
  assert.equal(postboxRewardToday(storage, day), true);
  assert.equal(postboxRewardToday(storage, later), false);
  assert.equal(postboxRewardToday(storage, next), true);
  assert.ok(POSTBOX_REWARD > 0 && POSTBOX_REWARD <= 100);
  assert.equal(postboxRewardToday({ getItem: () => { throw Error('blocked'); }, setItem: () => {} }, day), false);
});

test('의견은 옛 ChatGPT Sites 주소가 아니라 지금 게임 서버로 간다', () => {
  assert.doesNotMatch(FEEDBACK_URL, /chatgpt\.site/);
  assert.match(FEEDBACK_URL, /\/api\/feedback$/);
});

test('공지판에 우체통 안내가 맨 위에 있다', () => {
  const n = sortedNotices()[0];
  assert.equal(n.id, 'postbox-2026-11-23');
  for (const w of ['우체통', '이름', '50베리']) assert.ok(n.body.includes(w), w);
});
