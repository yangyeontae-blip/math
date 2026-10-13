import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VILLAGE_THEMES, villageThemeId } from '../src/villages.ts';
import { NEW_CURRICULUM_UNITS, OPERATIONS, journeyFor, newSave, validateSave } from '../src/rules.ts';

test('every forest and curriculum region has its own named village theme', () => {
  const ids = [...OPERATIONS, ...NEW_CURRICULUM_UNITS];
  assert.deepEqual(Object.keys(VILLAGE_THEMES).sort(), [...ids].sort());
  assert.equal(new Set(ids.map(id => VILLAGE_THEMES[id].name)).size, ids.length);
  assert.equal(new Set(ids.map(id => VILLAGE_THEMES[id].ground)).size, ids.length);
  for (const id of ids) { const theme = VILLAGE_THEMES[id]; assert.ok(theme.name.endsWith('마을') && theme.icon && theme.blurb.length > 8); }
});

test('the village follows the hub region when set and the current forest otherwise', () => {
  const s = newSave('마을', 0);
  assert.equal(villageThemeId(s), 'division'); s.forest = 'addition'; assert.equal(villageThemeId(s), 'addition');
  s.hub = 'fraction'; assert.equal(villageThemeId(s), 'fraction');
});

test('a hub is only accepted at the village of a curriculum region', () => {
  const s = newSave('허브', 0); s.hub = 'circle';
  assert.equal(validateSave(JSON.parse(JSON.stringify(s))).hub, 'circle');
  const bad = JSON.parse(JSON.stringify(s)); bad.hub = 'division'; assert.throws(() => validateSave(bad));
  const outside = JSON.parse(JSON.stringify(s)); outside.journey.stage = 1; assert.equal(journeyFor(validateSave(JSON.parse(JSON.stringify({ ...s, hub: undefined }))), 'division').stage, 0); assert.throws(() => validateSave(outside));
  const plain = newSave('허브없음', 0); assert.equal(validateSave(JSON.parse(JSON.stringify(plain))).hub, undefined);
});
