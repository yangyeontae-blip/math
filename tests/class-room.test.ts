import assert from 'node:assert/strict';
import test from 'node:test';
import { classRoomKey, formatClassCode, makeClassCode, normalizeClassRoomCode, readClassRoom, writeClassRoom } from '../src/class-room.ts';

test('teacher class codes are 7 letters with a check letter, and typos are rejected', () => {
  let seed = 1; const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const codes = Array.from({ length: 200 }, () => makeClassCode(random));
  for (const code of codes) { assert.match(code, /^[A-HJ-NP-Z2-9]{7}$/); assert.equal(normalizeClassRoomCode(code), code); }
  assert.equal(new Set(codes).size, codes.length);
  const code = codes[0];
  assert.equal(normalizeClassRoomCode(formatClassCode(code).toLowerCase()), code);
  assert.equal(normalizeClassRoomCode(' ' + code.slice(0, 4) + ' ' + code.slice(4) + ' '), code);
  const wrongCheck = code.slice(0, 6) + (code[6] === 'A' ? 'B' : 'A');
  assert.equal(normalizeClassRoomCode(wrongCheck), null);
  for (const bad of ['', 'ABC', 'ABCDEFGH', 'ABCD0FG', 12345, null]) assert.equal(normalizeClassRoomCode(bad), null);
  const typos = codes.filter(c => normalizeClassRoomCode(c.slice(0, 2) + (c[2] === 'K' ? 'M' : 'K') + c.slice(3)) !== null).length;
  assert.ok(typos < 20, 'most single-letter typos should be rejected: ' + typos);
  assert.equal(classRoomKey(code), 'class-plaza:' + code);
});

test('the chosen class code is remembered on this device and can be cleared', () => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } };
  const code = makeClassCode(() => .42);
  assert.equal(readClassRoom(storage), null);
  writeClassRoom(storage, code); assert.equal(readClassRoom(storage), code);
  writeClassRoom(storage, null); assert.equal(readClassRoom(storage), null);
});
