import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave } from '../src/rules';
import { GARDEN_PRESETS, STARTER_BLUEPRINTS, applyGardenPreset, layoutError, presetReady } from '../src/homestead';

test('every garden preset is a valid layout on an empty garden', () => {
  for (const p of GARDEN_PRESETS) {
    const objects = p.items.map((it, i) => ({ uid: i + 1, ...it }));
    assert.equal(layoutError(objects), '', p.name);
  }
});

test('the flower preset uses only free starter blueprints and keeps berry rules', () => {
  const flower = GARDEN_PRESETS.find(p => p.id === 'flower')!;
  assert.ok(flower.items.every(i => STARTER_BLUEPRINTS.includes(i.kind)));
  const s = newSave('정원사', 0); s.berries = 10_000;
  assert.deepEqual(presetReady(s, 'flower', false), { usable: 5, total: 5 });
  const r = applyGardenPreset(s, 'flower', false);
  assert.equal(r.placed, flower.items.length); assert.equal(r.skipped, 0); assert.equal(s.homestead.objects.length, flower.items.length);
  assert.equal(s.berries, 10_000 - r.spent); assert.ok(r.spent > 0, 'only the first of each item is free');
  assert.equal(applyGardenPreset(s, 'flower', false).placed, 0, 'occupied cells are skipped');
  validateSave(JSON.parse(JSON.stringify(s)));
});

test('a garden preset with too few berries places what it can and reports the shortage', () => {
  const s = newSave('정원사', 0); s.berries = 0;
  const r = applyGardenPreset(s, 'flower', false);
  assert.ok(r.placed > 0 && r.placed < GARDEN_PRESETS[0].items.length); assert.equal(r.short, true); assert.equal(s.berries, 0);
});

test('locked blueprints are skipped instead of unlocked by presets', () => {
  const s = newSave('정원사', 0); s.berries = 10_000;
  const r = applyGardenPreset(s, 'pond', true);
  assert.ok(r.skipped > 0); assert.ok(s.homestead.objects.every(o => STARTER_BLUEPRINTS.includes(o.kind)));
});
