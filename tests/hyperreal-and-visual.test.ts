import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTeacherCode, canEnter, canStartCurriculumMission, FACES, HAIRSTYLES, newSave, OUTFITS, PETS, POTIONS, RIDES, validateSave, WEAPONS } from '../src/rules';
import { GRADE1 } from '../src/grade-g1';
import { curriculumVisualHtml } from '../src/curriculum-visual';

test('hyperreal unlocks the full local demonstration save without breaking validation', () => {
  const save = newSave('검수모험', 0);
  applyTeacherCode(save, 'hyperreal');
  assert.equal(save.level, 1000);
  assert.equal(save.xp, 0);
  assert.equal(save.berries, 10_000_000);
  assert.equal(save.teacherMode, true);
  assert.equal(Object.keys(save.weapons).length, WEAPONS.length);
  assert.equal(Object.keys(save.outfits).length, OUTFITS.length);
  assert.equal(Object.keys(save.rides).length, RIDES.length);
  assert.equal(Object.keys(save.pets).length, PETS.length);
  assert.equal(Object.keys(save.hairstyles).length, HAIRSTYLES.length);
  assert.equal(Object.keys(save.faces).length, FACES.length);
  assert.equal(save.potions.stock.length, POTIONS.length);
  for (const forest of ['addition', 'subtraction', 'multiplication', 'division'] as const) assert.equal(canEnter(save, 10, forest), true);
  assert.equal(canStartCurriculumMission(save, 'circle', 9), true);
  assert.equal(validateSave(save).berries, 10_000_000);
});

test('tens and ones show different visual units', () => {
  const question = GRADE1.plane[3](() => .35, false);
  assert.equal(question.visual.kind, 'place-value');
  const html = curriculumVisualHtml(question.visual);
  assert.match(html, /한 묶음 = 10개/);
  assert.match(html, /점 하나 = 1개/);
  const comparison = GRADE1.pictograph[3](() => .35, false);
  assert.equal(comparison.visual.kind, 'place-value-compare');
  const compared = curriculumVisualHtml(comparison.visual);
  assert.match(compared, /한 묶음 = 10개/);
  assert.match(compared, /하나 = 1개/);
});
