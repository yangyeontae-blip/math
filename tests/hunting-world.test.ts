import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { HuntingRuntime } from '../src/hunting';
import { advanceHuntCharge, autoHuntTarget, HuntingWorld } from '../src/hunting-world';

test('short charge stops at a thin obstacle and bounds while matching clear travel across frame sizes', () => {
  const start = { x: 0, z: 0 }, direction = { x: 1, z: 0 };
  const wall = advanceHuntCharge(start, direction, 2.4, x => x < 1.1 || x > 1.2);
  assert.equal(wall.blocked, true); assert.ok(wall.x <= 1.1 && wall.x > .9);
  const diagonal = advanceHuntCharge(start, { x: 1, z: 1 }, 2.4, (x, z) => x < .8 && z < .8);
  assert.equal(diagonal.blocked, true); assert.ok(diagonal.x < .8 && diagonal.z < .8);
  const big = advanceHuntCharge(start, direction, 2.4, () => true);
  let small = { x: 0, z: 0 }; for (let i = 0; i < 5; i++) small = advanceHuntCharge(small, direction, .48, () => true);
  assert.ok(Math.abs(big.x - 2.4) < 1e-8); assert.ok(Math.abs(big.x - small.x) < 1e-8);
  assert.equal(advanceHuntCharge(start, direction, 0, () => true).x, 0);
});

test('auto aim keeps valid touched targets and replaces defeated or out-of-range targets, including enemies behind the player', () => {
  const enemies = new HuntingRuntime({ zone: 0, level: 10, power: 10 }).snapshot().enemies;
  assert.equal(autoHuntTarget(enemies, { x: 0, z: -1 }, 8, null)?.id, '1');
  assert.equal(autoHuntTarget(enemies, { x: 0, z: -1 }, 8, '0')?.id, '0');
  assert.equal(autoHuntTarget(enemies, { x: 0, z: -1 }, 8, '3')?.id, '1');
  assert.equal(autoHuntTarget(enemies, { x: 0, z: -7 }, 2, null)?.id, '1');
  enemies[1].hp = 0; assert.notEqual(autoHuntTarget(enemies, { x: 0, z: -1 }, 8, '1')?.id, '1');
  assert.equal(autoHuntTarget(enemies, { x: 0, z: 10 }, 2.8, null), null);
  assert.equal(autoHuntTarget(enemies, { x: 0, z: -1 }, NaN, null), null);
});

test('hunting visuals recycle transient effects without accumulating enemy meshes', () => {
  const runtime = new HuntingRuntime({ zone: 0, level: 20, power: 12, job: 'mage', learned: ['starbolt'], loadout: ['starbolt'] });
  const visual = new HuntingWorld(), camera = new T.PerspectiveCamera(); camera.position.set(18, 25, 24); camera.lookAt(0, 0, 0);
  visual.update(runtime.snapshot(), camera, '0', .04);
  const steadyChildren = visual.root.children.length;
  assert.equal(visual.root.children.filter(child => child.userData.huntEnemyId !== undefined).length, 6);
  for (let cycle = 0; cycle < 20; cycle++) {
    for (const event of runtime.cast('starbolt', { x: -6, z: 0 }, { x: 0, z: -1 })) visual.onEvent(event, runtime.snapshot());
    visual.update(runtime.snapshot(), camera, '0', .04);
    runtime.step(4.1, { x: 0, z: 10 }); visual.update(runtime.snapshot(), camera, null, 4.1);
    assert.equal(visual.root.children.length, steadyChildren);
  }
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  visual.root.traverse(object => { if (object instanceof T.Mesh) { geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); } });
  let disposedGeometry = 0, disposedMaterial = 0;
  for (const geometry of geometries) geometry.addEventListener('dispose', () => disposedGeometry++);
  for (const material of materials) material.addEventListener('dispose', () => disposedMaterial++);
  visual.dispose(); visual.dispose();
  assert.equal(disposedGeometry, geometries.size); assert.equal(disposedMaterial, materials.size); assert.equal(visual.root.children.length, 0);
});

test('practice adapters show only the core-provided number of dummies and allow pointer target picking', () => {
  for (const [mode, count] of [['single', 1], ['multi', 3], ['attacking', 2]] as const) {
    const runtime = new HuntingRuntime({ zone: 0, level: 10, power: 10, practice: true, practiceMode: mode });
    const visual = new HuntingWorld(true), camera = new T.PerspectiveCamera(50, 1, .1, 100);
    camera.position.set(0, 7, 10); camera.lookAt(0, .7, 0); camera.updateMatrixWorld(true);
    visual.update(runtime.snapshot(), camera, null, .04); visual.root.updateMatrixWorld(true);
    assert.equal(visual.root.children.filter(child => child.userData.huntEnemyId !== undefined).length, count);
    const enemy = runtime.snapshot().enemies[0], aim = new T.Vector3(enemy.x, 1, enemy.z).project(camera);
    assert.equal(visual.pick(new T.Vector2(aim.x, aim.y), camera), enemy.id);
    assert.equal(visual.pick(new T.Vector2(9, 9), camera), null); visual.dispose();
  }
});
