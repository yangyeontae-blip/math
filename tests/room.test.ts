import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addRoomFurniture,
  defaultRoomFurniturePosition,
  newSave,
  placeRoomFurniture,
  removeRoomFurniture,
  roomFurniturePosition,
  validateSave,
} from '../src/rules.ts';

test('가구를 빈 칸에 놓고 원하는 칸으로 옮겨 저장한다', () => {
  const save = newSave('꾸미', 0);
  assert.equal(addRoomFurniture(save, 1), true);
  assert.equal(addRoomFurniture(save, 4), true);
  assert.deepEqual(roomFurniturePosition(save, 1), { column: 0, row: 0 });
  assert.deepEqual(roomFurniturePosition(save, 4), { column: 1, row: 0 });

  assert.equal(placeRoomFurniture(save, 1, 3, 2), true);
  assert.deepEqual(roomFurniturePosition(save, 1), { column: 3, row: 2 });
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))), save);
});

test('가구가 있는 칸으로 옮기면 두 가구가 안전하게 자리를 바꾼다', () => {
  const save = newSave('바꾸미', 1);
  addRoomFurniture(save, 2); addRoomFurniture(save, 5);
  assert.equal(placeRoomFurniture(save, 2, 1, 0), true);
  assert.deepEqual(roomFurniturePosition(save, 2), { column: 1, row: 0 });
  assert.deepEqual(roomFurniturePosition(save, 5), { column: 0, row: 0 });
  assert.doesNotThrow(() => validateSave(save));
});

test('가구를 치우면 위치도 지우고 예전 저장은 기본 자리로 옮긴다', () => {
  const save = newSave('정리', 2);
  addRoomFurniture(save, 3); addRoomFurniture(save, 7);
  assert.equal(removeRoomFurniture(save, 3), true);
  assert.deepEqual(save.room.furniture, [7]);
  assert.equal(Object.hasOwn(save.room.positions, 3), false);

  const old = JSON.parse(JSON.stringify(save));
  old.version = 12; delete old.room.positions;
  const migrated = validateSave(old);
  assert.equal(migrated.version, 14);
  assert.deepEqual(migrated.room.positions, { 7: defaultRoomFurniturePosition(0) });
});

test('겹치거나 방 밖인 저장 위치는 거절한다', () => {
  const save = newSave('안전', 3);
  addRoomFurniture(save, 0); addRoomFurniture(save, 1);
  const overlap = structuredClone(save); overlap.room.positions['1'] = { ...overlap.room.positions['0'] };
  assert.throws(() => validateSave(overlap));
  const outside = structuredClone(save); outside.room.positions['0'] = { column: 5, row: 0 };
  assert.throws(() => validateSave(outside));
});
