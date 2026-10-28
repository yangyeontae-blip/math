import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { HuntingRuntime } from '../src/hunting';
import { ACADEMY_SKILLS } from '../src/academy';
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

test('cast visuals travel from the actor, freeze at zero delta and recycle after their real simulation lifetime', () => {
  const runtime = new HuntingRuntime({ zone: 0, level: 20, power: 12, job: 'mage', learned: ['starbolt'], loadout: ['starbolt'] });
  const visual = new HuntingWorld(), camera = new T.PerspectiveCamera(), actor = { x: -6, z: 0 };
  for (const event of runtime.cast('starbolt', actor, { x: 0, z: -1 })) visual.onEvent(event, runtime.snapshot(), actor);
  visual.update(runtime.snapshot(), camera, '0', 0);
  const projectile = visual.root.children.find(child => child.userData.skill === 'starbolt')!;
  assert.ok(projectile); assert.equal(projectile.position.x, actor.x); assert.equal(projectile.position.z, actor.z);
  const impact = visual.root.children.find(child => child.userData.huntImpact)!;
  assert.ok(impact, 'real hit produces a local impact');
  const before = JSON.stringify(visual.root.toJSON());
  for (let i = 0; i < 20; i++) visual.update(runtime.snapshot(), camera, '0', 0);
  assert.equal(JSON.stringify(visual.root.toJSON()), before, 'paused simulation must not advance trails or impacts');
  runtime.step(.12, actor); visual.update(runtime.snapshot(), camera, '0', .12);
  assert.ok(projectile.position.z < 0 && projectile.position.z > -3, 'projectile interpolates instead of appearing at its target');
  runtime.step(5, { x: 0, z: 10 }); visual.update(runtime.snapshot(), camera, null, 5);
  assert.equal(visual.root.children.some(child => child.userData.skill || child.userData.huntImpact), false);
  for (const event of runtime.cast('starbolt', actor, { x: 0, z: -1 })) visual.onEvent(event, runtime.snapshot(), actor);
  visual.update(runtime.snapshot(), camera, '0', 0);
  assert.equal(visual.root.children.find(child => child.userData.skill === 'starbolt'), projectile, 'completed cast reuses its group');
  assert.equal(visual.root.children.find(child => child.userData.huntImpact), impact, 'completed impact reuses its group');
  visual.dispose();
});

test('all skill silhouettes have bounded shared resources and quality changes take effect without reallocating', () => {
  const visual = new HuntingWorld(), camera = new T.PerspectiveCamera(), base = new HuntingRuntime({ zone: 0, level: 60, power: 10 }).snapshot();
  const snapshot = { ...base, effects: ACADEMY_SKILLS.map((skill, index) => ({ id: `skill-${index}`, skill: skill.id, x: index, z: 0, radius: 6, duration: skill.duration, remaining: skill.duration * .75 })) };
  const original = JSON.stringify(snapshot); visual.update(snapshot, camera, null, 0);
  const effects = visual.root.children.filter(child => typeof child.userData.skill === 'string');
  assert.equal(effects.length, ACADEMY_SKILLS.length); assert.ok(effects.length <= 24);
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  effects.forEach(group => group.traverse(object => { if (object instanceof T.Mesh) { geometries.add(object.geometry); materials.add(object.material as T.Material); assert.equal(object.castShadow, false); } }));
  assert.ok(geometries.size <= 5, 'skills reuse simple geometry instead of allocating particles each frame');
  const fullCount = effects.reduce((count, group) => count + group.children.filter(child => child.visible).length, 0);
  visual.setQuality({ lowQuality: true, reducedMotion: true }); visual.update(snapshot, camera, null, 0);
  const reducedCount = effects.reduce((count, group) => count + group.children.filter(child => child.visible).length, 0);
  assert.ok(reducedCount < fullCount); assert.ok(effects.every(group => group.children.filter(child => child.visible).length <= 6));
  assert.ok(effects.every(group => group.scale.y <= 1.15), 'large areas stay low instead of covering the scene with tall meshes');
  const reducedTransforms = effects.map(group => group.toJSON());
  const later = { ...snapshot, effects: snapshot.effects.map(effect => ({ ...effect, remaining: effect.remaining * .5 })) };
  visual.update(later, camera, null, 0);
  assert.deepEqual(effects.map(group => group.toJSON()), reducedTransforms, 'reduced motion removes animated sweeps and rain');
  visual.update({ ...base, effects: [] }, camera, null, 1);
  visual.setQuality({ lowQuality: false, reducedMotion: false }); visual.update(snapshot, camera, null, 0);
  assert.ok(effects.every(group => group.parent === visual.root)); assert.equal(JSON.stringify(snapshot), original);
  let geometryDisposals = 0, materialDisposals = 0;
  geometries.forEach(geometry => geometry.addEventListener('dispose', () => geometryDisposals++));
  materials.forEach(material => material.addEventListener('dispose', () => materialDisposals++));
  visual.dispose(); visual.dispose(); assert.equal(geometryDisposals, geometries.size); assert.equal(materialDisposals, materials.size);
});

test('hit bursts and overlapping areas stay capped and release every visual on dispose', () => {
  const visual = new HuntingWorld(), camera = new T.PerspectiveCamera(), base = new HuntingRuntime({ zone: 0, level: 60, power: 10 }).snapshot();
  const enemies = Array.from({ length: 60 }, (_, i) => ({ ...base.enemies[0], id: `enemy-${i}` }));
  const snapshot = { ...base, enemies, effects: Array.from({ length: 60 }, (_, i) => ({ id: `area-${i}`, skill: 'vortex' as const, x: i, z: 0, radius: 6, duration: 4, remaining: 3 })) };
  for (const enemy of enemies) visual.onEvent({ type: 'hit', enemyId: enemy.id, damage: .1, skill: 'vortex' }, snapshot);
  visual.update(snapshot, camera, null, 0);
  assert.equal(visual.root.children.filter(child => child.userData.huntImpact).length, 24);
  assert.equal(visual.root.children.filter(child => child.userData.skill).length, 24);
  visual.update({ ...base, effects: [] }, camera, null, 1);
  assert.equal(visual.root.children.some(child => child.userData.skill || child.userData.huntImpact), false);
  visual.dispose(); assert.equal(visual.root.children.length, 0);
});

test('body buffs follow the moving actor while placed areas and traps remain at their cast location', () => {
  const visual = new HuntingWorld(), camera = new T.PerspectiveCamera(), base = new HuntingRuntime({ zone: 0, level: 60, power: 10 }).snapshot();
  const snapshot = { ...base, effects: (['shield', 'wind', 'guardian', 'vortex', 'trap'] as const).map(skill => ({ id: skill, skill, x: 1, z: 2, radius: 2, duration: 4, remaining: 3 })) };
  const player = { x: 7, z: -4 }; visual.update(snapshot, camera, null, 0, player);
  for (const group of visual.root.children.filter(child => child.userData.skill)) {
    const follows = ['shield', 'wind', 'guardian'].includes(group.userData.skill);
    assert.equal(group.position.x, follows ? player.x : 1); assert.equal(group.position.z, follows ? player.z : 2);
  }
  assert.ok(snapshot.effects.every(effect => effect.x === 1 && effect.z === 2), 'only presentation follows the actor, never gameplay areas');
  visual.dispose();
});

test('ranger basic attack fires one readable moving arrow per volley even for splash hits and in light mode', () => {
  const visual = new HuntingWorld(false, 0, { lowQuality: true }), camera = new T.PerspectiveCamera(), snapshot = new HuntingRuntime({ zone: 0, level: 10, power: 10 }).snapshot();
  const actor = { x: -6, z: 2, job: 'ranger' as const };
  for (const enemy of snapshot.enemies) visual.onEvent({ type: 'hit', enemyId: enemy.id, damage: 2, skill: 'basic' }, snapshot, actor);
  visual.update(snapshot, camera, null, 0);
  const arrows = () => visual.root.children.filter(child => child.userData.huntProjectile);
  assert.equal(arrows().length, 1, 'splash damage does not emit a duplicate volley');
  const arrow = arrows()[0]; assert.equal(arrow.position.z, actor.z);
  assert.ok(arrow.children[1].visible && arrow.children[2].visible, 'light mode retains both arrowhead and shaft');
  assert.ok(arrow.children[1].scale.x >= .2 && arrow.children[2].scale.z >= .9, 'arrow silhouette has substantial head and shaft dimensions');
  visual.update(snapshot, camera, null, .18);
  assert.ok(arrow.position.z < actor.z && arrow.position.z > snapshot.enemies[0].z);
  const frozen = arrow.position.clone(); visual.update(snapshot, camera, null, 0); assert.ok(arrow.position.equals(frozen));
  visual.update(snapshot, camera, null, .4); assert.equal(arrows().length, 0);
  visual.onEvent({ type: 'hit', enemyId: '0', damage: 2, skill: 'basic' }, { ...snapshot, time: 1 }, actor);
  assert.equal(arrows()[0], arrow, 'basic arrows reuse a bounded visual pool');
  visual.dispose(); assert.equal(visual.root.children.length, 0);
});

test('multi-target shots use actual hit destinations and chain lightning starts each link at the previous target', () => {
  const camera = new T.PerspectiveCamera(), snapshot = new HuntingRuntime({ zone: 0, level: 60, power: 10 }).snapshot(), actor = { x: 1, z: 2 };
  for (const skill of ['leafOrb', 'tripleShot', 'thunderChain'] as const) {
    const visual = new HuntingWorld(); visual.onEvent({ type: 'cast', skill }, snapshot, actor);
    for (const enemy of snapshot.enemies.slice(0, 3)) visual.onEvent({ type: 'hit', enemyId: enemy.id, damage: 1, skill }, snapshot, actor);
    visual.update(snapshot, camera, null, .18);
    const shots = visual.root.children.filter(child => child.userData.huntProjectile);
    assert.equal(shots.length, 3, 'each actual hit receives one projectile or lightning segment');
    if (skill === 'thunderChain') { assert.equal(shots[0].position.x, actor.x); assert.equal(shots[1].position.x, snapshot.enemies[0].x); assert.equal(shots[2].position.x, snapshot.enemies[1].x); }
    else assert.equal(new Set(shots.map(group => `${group.position.x},${group.position.z}`)).size, 3);
    visual.update(snapshot, camera, null, 1); assert.equal(visual.root.children.some(child => child.userData.huntProjectile), false);
    visual.dispose();
  }
});
