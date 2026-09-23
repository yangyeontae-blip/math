import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questionPool, newSave, validateSave, buy, upgrade, buyRide, dismount, buyPet, buyLook, applyTeacherCode, enableTeacherMode, grantReward, rewardFor, Encounter, WEAPONS, OUTFITS, PETS, RIDES, HAIRSTYLES, FACES, MONSTERS, STAGE_DIVISION_DIFFICULTY, collectBerry, finishHunt, fellTree, treeDamage, canEnter, recordWrongAnswer, recordCorrectAnswer } from '../src/rules.ts';
import { stageBerries, stageMonsters, stageTrees, clearBonus, berryValue } from '../src/stages.ts';

test('every question follows the curriculum; two-digit quotients begin at level 4', () => {
  for (const level of [1, 2, 3, 4, 10, 100]) {
    const pool = questionPool(level); assert.ok(pool.length > 0);
    for (const q of pool) { assert.ok(q.dividend >= 10 && q.dividend <= (level < 4 ? 90 : level < 7 ? 120 : 180) && q.dividend % 10 === 0); assert.ok(q.divisor >= 2 && q.divisor <= 9); assert.equal(q.divisor * q.answer, q.dividend); if (level < 4) assert.ok(q.answer < 10); }
    if (level >= 4) assert.ok(pool.some(q => q.answer >= 10));
    if (level >= 7) assert.ok(pool.some(q => q.dividend > 90));
  }
});
test('division questions grow gradually harder across the ten hunt stages', () => {
  let previousMax = 0;
  STAGE_DIVISION_DIFFICULTY.forEach((rule, index) => {
    const stage = index + 1, pool = questionPool(1, stage); assert.ok(pool.length >= 8);
    for (const q of pool) { assert.equal(q.dividend % 10, 0); assert.ok(q.dividend <= rule.maxDividend); assert.ok(q.answer <= rule.maxAnswer); assert.equal(q.divisor * q.answer, q.dividend); }
    const maxAnswer = Math.max(...pool.map(q => q.answer)); assert.ok(maxAnswer >= previousMax); previousMax = maxAnswer;
    if (stage === 1) assert.ok(pool.every(q => q.answer < 10));
    if (stage >= 2) assert.ok(pool.some(q => q.answer >= 10));
    if (stage <= 4) assert.ok(pool.every(q => q.dividend < 100));
    if (stage >= 5) assert.ok(pool.some(q => q.dividend >= 100));
  });
  assert.ok(questionPool(1, 10).some(q => q.answer >= 40));
});
test('all weapons and upgrades give the documented rewards for every monster', () => {
  const s = newSave('베리', 0);
  WEAPONS.forEach((w, wi) => { s.weapon = wi; for (let u = 0; u <= 3; u++) { s.weapons[wi] = u; MONSTERS.forEach((m, mi) => { assert.deepEqual(rewardFor(s, mi, true), { berries: m.berry + w.bonus, xp: m.xp, score: Math.round(m.score * (w.multiplier + u * .1)) }); assert.equal(rewardFor(s, mi, false).score, 0); }); } });
});
test('wrong and repeated answers never produce a second victory', () => {
  const encounter = new Encounter(0, true, 1); assert.equal(encounter.answer('99'), 'wrong'); assert.equal(encounter.solved, false);
  assert.equal(encounter.answer(String(encounter.question.answer)), 'correct'); assert.equal(encounter.answer(String(encounter.question.answer)), 'ignored'); assert.equal(encounter.answer('99'), 'ignored');
});
test('purchases, equipment and upgrades cannot spend more than the balance', () => {
  const s = newSave('봄', 1); const before = structuredClone(s); assert.throws(() => buy(s, 'weapon', 1)); assert.deepEqual(s, before); assert.throws(() => upgrade(s, 'outfit', 2));
  s.berries = 1000; buy(s, 'weapon', 1); assert.equal(s.berries, 920); assert.equal(s.weapon, 1); buy(s, 'weapon', 0); buy(s, 'weapon', 1); assert.equal(s.berries, 920);
  for (let i = 0; i < 3; i++) upgrade(s, 'weapon', 1); assert.equal(s.weapons[1], 3); assert.equal(s.berries, 500); assert.throws(() => upgrade(s, 'weapon', 1)); assert.equal(s.berries, 500);
  buy(s, 'outfit', 7); upgrade(s, 'outfit', 7); upgrade(s, 'outfit', 7); assert.equal(s.berries, 110); assert.equal(s.outfits[7], 2); assert.throws(() => upgrade(s, 'outfit', 7));
});
test('outfit combat effects never change the division or arena score rule', () => {
  const s = newSave('옷', 2), before = rewardFor(s, 3, true); s.berries = 1000; buy(s, 'outfit', 7); upgrade(s, 'outfit', 7); upgrade(s, 'outfit', 7); const after = rewardFor(s, 3, true); assert.equal(after.score, before.score); assert.equal(after.berries, before.berries); assert.equal(after.xp, before.xp + 2);
});
test('level-up threshold, remaining XP and 20 berry gift', () => {
  const s = newSave('성장', 3); for (let i = 0; i < 4; i++) grantReward(s, 0, true); assert.equal(s.level, 2); assert.equal(s.xp, 0); assert.equal(s.berries, 52); assert.equal(s.tutorial.battle, true);
  for (let i = 0; i < 4; i++) grantReward(s, 3, false); assert.equal(s.level, 3); assert.equal(s.xp, 0); assert.equal(s.berries, 132);
});
test('save round-trip preserves state and rejects corrupted, unsafe or invalid files', () => {
  const s = newSave('모험가', 3); s.berries = 500; buy(s, 'outfit', 4); upgrade(s, 'outfit', 4); assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
  for (const bad of [null, {}, { ...s, version: 99 }, { ...s, berries: -1 }, { ...s, xp: 10000 }, { ...s, weapon: 3 }, { ...s, position: { x: Infinity, z: 0 } }, { ...s, outfits: { 0: 0, 4: 9 } }, { ...s, settings: {} }]) assert.throws(() => validateSave(bad));
  assert.throws(() => newSave(' ', 0)); assert.throws(() => newSave('12345678901', 0)); assert.throws(() => newSave('봄', 4));
});
test('stages have fixed, non-refilling berries and unlock only after all hunts', () => {
  const s = newSave('여행', 0); assert.equal(canEnter(s, 1), true); assert.equal(canEnter(s, 2), false);
  const first = collectBerry(s, 0); assert.equal(first, berryValue(0)); assert.equal(collectBerry(s, 0), 0); assert.equal(s.journey.maps[0].berries.length, 1);
  s.journey.stage = 1; assert.equal(stageBerries(1).length > stageBerries(0).length, true);
  for (let id = 0; id < stageMonsters(1).length; id++) assert.ok(finishHunt(s, id));
  assert.equal(s.journey.maps[1].cleared, true); assert.equal(canEnter(s, 2), true);
  assert.equal(finishHunt(s, 0), null); assert.ok(s.berries >= clearBonus(1));
});
test('outfit effects boost rewards but do not make problems or weapons optional', () => {
  const s = newSave('꽃', 0); s.berries = 1000; buy(s, 'outfit', 7); assert.equal(rewardFor(s, 0, false).xp, MONSTERS[0].xp + 2);
  const before = s.berries; s.journey.stage = 1; collectBerry(s, 0); assert.equal(s.berries - before, berryValue(1));
  const encounter = new Encounter(0, false, 1); assert.equal(encounter.answer(String(encounter.question.answer)), 'correct');
});
test('trees give only 2 to 4 berries once and stronger weapons cut faster', () => {
  const s = newSave('나무', 0); assert.ok(stageTrees(0).length > 0); assert.equal(treeDamage(s), 1);
  assert.equal(fellTree(s, 0, 4), 4); assert.equal(s.berries, 4); assert.equal(fellTree(s, 0, 2), 0); assert.equal(s.berries, 4);
  s.berries = 5000; buy(s, 'weapon', WEAPONS.length - 1); assert.equal(treeDamage(s), WEAPONS.at(-1)!.treePower); upgrade(s, 'weapon', WEAPONS.length - 1); assert.equal(treeDamage(s), WEAPONS.at(-1)!.treePower + 1);
  assert.equal(fellTree(s, 999, 2), 0); assert.equal(fellTree(s, 1, 1 as 2), 0); assert.equal(fellTree(s, 1, 5 as 2), 0);
});
test('version 2 saves migrate with untouched tree progress', () => {
  const old = structuredClone(newSave('예전', 0)) as unknown as Record<string, unknown>; old.version = 2;
  const journey = old.journey as { maps: Array<Record<string, unknown>> }; journey.maps.forEach(m => delete m.trees);
  const migrated = validateSave(old); assert.equal(migrated.version, 6); assert.deepEqual(migrated.journey.maps[0].trees, []); assert.equal(migrated.ride, -1); assert.deepEqual(migrated.rides, {}); assert.equal(migrated.pet, -1); assert.deepEqual(migrated.hairstyles, { 0: true }); assert.equal(migrated.settings.maxDividend, 0); assert.deepEqual(migrated.room.furniture, []);
});
test('teacher curriculum ceilings and local learning records behave safely', () => {
  const s = newSave('수업', 0);
  const hundredQuestions = questionPool(10, 6); assert.ok(hundredQuestions.some(q => q.dividend >= 100));
  assert.ok(questionPool(10, 6, 90).every(q => q.dividend <= 90));
  assert.ok(questionPool(10, 6, 180).some(q => q.dividend > 90));
  const q = { dividend: 40, divisor: 5, answer: 8 }; recordWrongAnswer(s, q); recordWrongAnswer(s, q); assert.equal(s.learning.wrong, 2); assert.equal(s.learning.wrongQuestions.length, 1);
  recordCorrectAnswer(s, 2); assert.equal(s.learning.correct, 1); assert.deepEqual(s.discoveries.monsters, [2]);
  s.settings.sessionMinutes = 15; s.learning.elapsedSeconds = 32; s.room.furniture = [0, 4]; assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});
test('rides cost at least 1000 berries and flying starts at 5000 berries', () => {
  assert.ok(RIDES.every(ride => ride.price >= 1000)); assert.ok(RIDES.filter(ride => ride.flying).every(ride => ride.price >= 5000));
  const s = newSave('라이더', 0); assert.throws(() => buyRide(s, 0)); s.berries = 6000; const before = s.berries; buyRide(s, 0); assert.equal(s.berries, before - RIDES[0].price); assert.equal(s.ride, 0); assert.equal(s.rides[0], true);
  buyRide(s, 0); assert.equal(s.berries, before - RIDES[0].price); assert.equal(dismount(s), '라이딩에서 내려 천천히 걸어요.'); assert.equal(s.ride, -1);
});
test('teacher code unlocks all demonstration content without clearing hunts', () => {
  const s = newSave('선생님', 0); assert.throws(() => enableTeacherMode(s, 'Teacher')); enableTeacherMode(s, 'teacher');
  assert.equal(s.teacherMode, true); assert.equal(s.berries, 1_000_000); assert.equal(Object.keys(s.weapons).length, WEAPONS.length); assert.equal(Object.keys(s.outfits).length, OUTFITS.length); assert.equal(Object.keys(s.rides).length, RIDES.length); assert.equal(Object.keys(s.pets).length, PETS.length); assert.equal(Object.keys(s.hairstyles).length, HAIRSTYLES.length); assert.equal(Object.keys(s.faces).length, FACES.length); assert.equal(canEnter(s, 10), true); assert.equal(s.journey.maps[10].monsters.length, 0);
});
test('money codes add the exact berries and pet and beauty purchases stay safe', () => {
  const s = newSave('꾸미기', 0); applyTeacherCode(s, 'showmethemoney'); assert.equal(s.berries, 1000); applyTeacherCode(s, 'greedisgood'); assert.equal(s.berries, 11000);
  const beforePet = s.berries; buyPet(s, 0); assert.equal(s.berries, beforePet - PETS[0].price); assert.equal(s.pet, 0); buyPet(s, 0); assert.equal(s.berries, beforePet - PETS[0].price);
  const beforeHair = s.berries; buyLook(s, 'hairstyle', 1); assert.equal(s.berries, beforeHair - HAIRSTYLES[1].price); assert.equal(s.hairstyle, 1); buyLook(s, 'hairstyle', 0); assert.equal(s.hairstyle, 0);
  assert.throws(() => applyTeacherCode(s, 'SHOWMETHEMONEY')); assert.equal(RIDES.length, 8); assert.equal(PETS.length, 5);
});
