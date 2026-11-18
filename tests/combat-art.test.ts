import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { ACADEMY_SKILLS } from '../src/academy';
import { COMBAT_ART, attackStyle, attackPose } from '../src/combat-art';
import { CombatVfx } from '../src/combat-vfx';
import { monsterModel, animateMonster } from '../src/combat-monsters';
import { HuntingWorld } from '../src/hunting-world';
import { HuntingRuntime } from '../src/hunting';

test('every skill has an authored sigil identity and existing dawn themes stay recognizable', () => {
  assert.deepEqual(Object.keys(COMBAT_ART).sort(), ACADEMY_SKILLS.map(s => s.id).sort());
  assert.equal(new Set(Object.values(COMBAT_ART).map(a => JSON.stringify(a))).size, ACADEMY_SKILLS.length);
  assert.equal(COMBAT_ART.everbloom.motif, 'flower'); assert.equal(COMBAT_ART.cosmicGenesis.motif, 'planet'); assert.equal(COMBAT_ART.sparkFlask.motif, 'flask'); assert.equal(COMBAT_ART.noteBolt.motif, 'note');
});

test('attack profiles anticipate, release and return to rest for all jobs and weapon families', () => {
  assert.equal(attackStyle('ranger', 0), 'bow'); assert.equal(attackStyle('bard', 0), 'music'); assert.equal(attackStyle('mage', 0), 'cast'); assert.equal(attackStyle('alchemist', 0), 'throw');
  assert.equal(attackStyle(null, 1), 'heavy'); assert.equal(attackStyle(null, 10), 'thrust');
  for (const style of ['slash', 'heavy', 'thrust', 'bow', 'cast', 'throw', 'music'] as const) {
    assert.equal(attackPose(style, 0).swing, 0); assert.ok(attackPose(style, .07).swing < 0); assert.ok(attackPose(style, .22).swing > 0);
    assert.equal(attackPose(style, 2).swing, 0); assert.equal(attackPose(style, 2).done, true);
    assert.ok(Math.abs(attackPose(style, .2, true).swing) < Math.abs(attackPose(style, .2).swing));
  }
});

test('four-phase cues cap particles and allocations, reuse completed cues, and dispose pooled resources once', () => {
  const vfx = new CombatVfx(); vfx.cast('solarOath', { x: 0, z: 0 }, { x: 2, z: 3 });
  const cue = vfx.root.children.find(o => o.type === 'Group')!;
  assert.equal(cue.userData.phase, 'cast'); vfx.update(.25); assert.equal(cue.userData.phase, 'launch'); vfx.update(.3); assert.equal(cue.userData.phase, 'impact'); vfx.update(.5); assert.equal(cue.userData.phase, 'afterglow'); vfx.update(1);
  vfx.cast('everbloom', { x: 0, z: 0 }, { x: 2, z: 3 }); assert.equal(vfx.root.children.find(o => o.type === 'Group'), cue);
  for (let i = 0; i < 200; i++) vfx.cast('cosmicGenesis', { x: i, z: 0 }, { x: 2, z: 3 });
  vfx.update(.04); assert.ok(vfx.root.children.length <= 19); assert.ok((vfx.root.children[0] as T.InstancedMesh).count <= 240);
  const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  vfx.root.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); materials.add(o.material as T.Material); } });
  let g = 0, m = 0; geometry.forEach(v => v.addEventListener('dispose', () => g++)); materials.forEach(v => v.addEventListener('dispose', () => m++));
  vfx.clear(); vfx.dispose(); vfx.dispose(); assert.equal(g, geometry.size); assert.equal(m, materials.size); assert.equal(vfx.root.children.length, 0);
});

test('light mode caps cues and sparks; reduced motion immediately removes particles and moving layers', () => {
  const vfx = new CombatVfx({ lowQuality: true });
  for (let i = 0; i < 60; i++) vfx.cast('cosmicGenesis', { x: 0, z: 0 }, { x: 2, z: 3 });
  vfx.update(.1); assert.ok(vfx.root.children.length <= 9); assert.ok((vfx.root.children[0] as T.InstancedMesh).count <= 64);
  vfx.setQuality({ reducedMotion: true }); vfx.update(.01);
  assert.equal((vfx.root.children[0] as T.InstancedMesh).count, 0);
  for (const cue of vfx.root.children.filter(o => o.type === 'Group')) {
    assert.equal(cue.children.filter(o => o.visible).length, 1);
    cue.children[0].updateMatrix(); const before = cue.children[0].matrix.clone(); vfx.update(.1); cue.children[0].updateMatrix(); assert.deepEqual(cue.children[0].matrix, before);
  }
  vfx.dispose();
});

test('monster hit and telegraph poses only deform artwork and recover without moving gameplay roots', () => {
  const material = new T.MeshStandardMaterial(), sphere = new T.SphereGeometry(), cube = new T.BoxGeometry(), cone = new T.ConeGeometry(), circle = new T.CircleGeometry();
  const root = monsterModel(2, 0xbbaadd, { sphere, cube, cone, circle, material: () => material }); root.position.set(5, 0, -3);
  const before = root.position.clone(); root.userData.hitLife = .225; root.userData.kickX = 1;
  for (let i = 0; i < 20; i++) animateMonster(root, i * .04, .04, false, 'telegraph');
  assert.ok(root.position.equals(before)); assert.ok((root.userData.monsterBody as T.Group).scale.y < 1);
  animateMonster(root, 1, .04, true); assert.equal((root.userData.monsterBody as T.Group).position.y, 0);
  for (const asset of [material,sphere,cube,cone,circle]) asset.dispose();
});

test('all ranged jobs draw one traveling basic shot per volley, including splash hits', () => {
  const snapshot = new HuntingRuntime({zone:0,level:20,power:10}).snapshot(), camera = new T.PerspectiveCamera();
  for (const job of ['mage','ranger','druid','alchemist','bard'] as const) {
    const visual = new HuntingWorld(false,0,{lowQuality:true}), origin = {x:-6,z:2,job};
    for (const enemy of snapshot.enemies) visual.onEvent({type:'hit',enemyId:enemy.id,damage:1,skill:'basic'},snapshot,origin);
    const shots=visual.root.children.filter(o=>o.userData.huntProjectile); assert.equal(shots.length,1,job);
    visual.update(snapshot,camera,null,.18); assert.ok(shots[0].position.z < origin.z && shots[0].position.z > snapshot.enemies[0].z,job+' shot travels');
    visual.dispose();
  }
});
