import test from 'node:test';
import assert from 'node:assert/strict';
import { HALL_BOARD_SIZE, hallMissingReason } from '../src/hall';
import { HALL_GUIDE_SPOT, VILLAGE_SPOTS, villageWelcomeClear } from '../src/village-layout';
import { GREETINGS, pickLine } from '../src/npc-lines';
import { sortedNotices } from '../src/notices';

test('명예의 전당은 50명보다 많이 보여 주고, 목록에 없는 아이에게 이유를 알려 준다', () => {
  assert.ok(HALL_BOARD_SIZE > 50);
  assert.match(hallMissingReason('하랑', true), /제외/);
  assert.match(hallMissingReason('하랑', false), /새로고침/);
});

test('뽀짝이는 운영자 소식 공지판 바로 옆, 장식이 놓이지 않는 빈 자리에 선다', () => {
  const d = Math.hypot(HALL_GUIDE_SPOT.x - VILLAGE_SPOTS.notice.x, HALL_GUIDE_SPOT.z - VILLAGE_SPOTS.notice.z);
  assert.ok(d > 2 && d < 4.5, `distance ${d}`);
  assert.ok(villageWelcomeClear(HALL_GUIDE_SPOT.x, HALL_GUIDE_SPOT.z));
  for (const [name, at] of Object.entries(VILLAGE_SPOTS)) if (name !== 'notice') assert.ok(Math.hypot(at.x - HALL_GUIDE_SPOT.x, at.z - HALL_GUIDE_SPOT.z) > 4, name);
});

test('뽀짝이는 명예의 전당을 안내하는 대사를 한다', () => {
  for (let i = 0; i < 20; i++) assert.ok(GREETINGS.hallGuide.includes(pickLine('hallGuide', () => i / 20)!));
  assert.ok(GREETINGS.hallGuide.some(line => line.includes('뽀짝')));
});

test('안내문에 명예의 전당·파티 업데이트와 뽀짝이 위치를 적는다', () => {
  const n = sortedNotices().find(x => x.id === 'hall-party-2026-11-10')!;
  assert.ok(n.pinned);
  for (const word of ['명예의 전당', '뽀짝이', '운영자 소식', '파티']) assert.ok(n.body.includes(word), word);
});
