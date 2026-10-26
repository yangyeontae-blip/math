import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeStorybookArt, makeContactShadow, seasonalParticleAt, storybookMaterial, storybookSway } from '../src/storybook-art';

test('storybook materials import and construct without DOM and share resources', () => {
  const grass = storybookMaterial('grass', 0x91b676);
  assert.equal(storybookMaterial('grass', 0x91b676), grass);
  assert.notEqual(storybookMaterial('stone', 0x91b676), grass);
  assert.equal(grass.color.getHex(), 0x91b676); assert.equal(grass.metalness, 0);
  const a = makeContactShadow(.7), b = makeContactShadow(1.2);
  assert.equal(a.geometry, b.geometry); assert.equal(a.material, b.material);
  assert.equal(a.position.y, .025); assert.equal(a.material.depthWrite, false);
  assert.equal(a.scale.x, .7); assert.equal(b.scale.x, 1.2);
  disposeStorybookArt(); assert.notEqual(storybookMaterial('grass', 0x91b676), grass); disposeStorybookArt();
});

test('branch sway is bounded, continuous, and independent of rendering frame rate', () => {
  for (let i = 0; i < 10000; i++) {
    const t = i / 37; assert.ok(Math.abs(storybookSway(t, 2)) <= .03100001);
    assert.ok(Math.abs(storybookSway(t + .001, 2) - storybookSway(t, 2)) < .0001);
    assert.equal(storybookSway(t, 2, 0), 0);
    assert.equal(storybookSway(t, 2, 2), storybookSway(t, 2, 1));
  }
});

test('season particles remain finite, bounded and deterministic throughout repeated recycling', () => {
  for (const kind of ['snow', 'leaf'] as const) for (let seed = 0; seed < 40; seed++) for (let frame = 0; frame < 180; frame++) {
    const time = frame * 2.7, p = seasonalParticleAt(kind, time, seed, 20);
    assert.deepEqual(p, seasonalParticleAt(kind, time, seed, 20));
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(p.y >= 0 && p.y <= 8); assert.ok(Math.abs(p.x) <= 10.65 && Math.abs(p.z) <= 10.325);
    assert.ok(p.opacity >= 0 && p.opacity <= 1); assert.ok(p.scale > 0 && p.scale < .2);
    if (p.y < .05 || p.y > 7.95) assert.ok(p.opacity < .1, 'recycling at ground/top must be nearly invisible');
  }
  assert.notDeepEqual(seasonalParticleAt('snow', 4, 1), seasonalParticleAt('snow', 4, 2));
});
