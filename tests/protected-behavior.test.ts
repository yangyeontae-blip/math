import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, applyTeacherCode, TEACHER_CODE_HASH } from '../src/rules';
import { sha256Hex } from '../src/sha256';

// 이 테스트들은 "건드리면 안 되는 기존 동작"을 고정해요. 바꾸려면 CLAUDE.md의 Protected behaviors를 먼저 확인하고 사용자 허락을 받으세요.

test('protected: the classroom teacher code is still "teacher"', () => {
  assert.equal(TEACHER_CODE_HASH, sha256Hex('teacher'));
  const s = newSave('선생님', 0); applyTeacherCode(s, 'teacher');
  assert.equal(s.teacherMode, true); assert.equal(s.berries, 1_000_000);
});

test('protected: level and money codes work on any save, without teacher mode', () => {
  const s = newSave('아이', 0); assert.equal(s.teacherMode, false);
  applyTeacherCode(s, 'showmethemoney'); assert.equal(s.berries, 1000);
  applyTeacherCode(s, 'greedisgood'); assert.equal(s.berries, 11000);
  applyTeacherCode(s, 'levelup'); assert.equal(s.level, 2);
  applyTeacherCode(s, 'levelup1'); assert.equal(s.level, 3);
  applyTeacherCode(s, 'levelup10'); assert.equal(s.level, 13);
  assert.equal(s.teacherMode, false);
});

test('protected: wrong or differently-cased codes are rejected without changing the save', () => {
  const s = newSave('아이', 0), before = structuredClone(s);
  for (const word of ['Teacher', 'TEACHER', 'levelup100', '', ' teacher']) assert.throws(() => applyTeacherCode(s, word), /암호코드/);
  assert.deepEqual(s, before);
});