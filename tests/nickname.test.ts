import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKED_WORDS, isBlockedNickname } from '../src/nickname';
// @ts-expect-error 워커는 번들 없이 그대로 배포하는 순수 JS라 타입 선언이 없어요.
import { BLOCKED_WORDS as WORKER_WORDS, isBlockedNickname as workerBlocked } from '../worker/index.js';

test('client and ranking worker share the same nickname blocklist', () => {
  assert.deepEqual(BLOCKED_WORDS, WORKER_WORDS);
  for (const name of ['별이', '시 발', '씨.발', 'F u C k', '새끼손가락', '하루']) assert.equal(isBlockedNickname(name), workerBlocked(name));
});

test('blocked nicknames are caught even with spaces, symbols and capitals', () => {
  for (const name of ['시 발', '씨.발', 'F u C k', 'SHIT', '개★새끼']) assert.equal(isBlockedNickname(name), true, name);
  for (const name of ['별이', '하루', '봄이', '여울', '나루', '베리공주', 'Berry']) assert.equal(isBlockedNickname(name), false, name);
});
