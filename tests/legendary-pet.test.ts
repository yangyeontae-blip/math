import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createPpojjakiPet, createPpojjakiAura, animatePpojjakiPet, animatePpojjakiAura, disposePpojjakiAssets } from '../src/legendary-pet';

function resources(group: T.Group) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), instances: T.InstancedMesh[] = [];
  group.traverse(object => { if (object instanceof T.Mesh) { geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); } if (object instanceof T.InstancedMesh) instances.push(object); });
  return { geometries, materials, instances };
}
function matrices(group: T.Group) { group.updateMatrixWorld(true); const values: number[][] = []; group.traverse(object => values.push([...object.matrix.elements])); return values; }

test('legendary poodle has instanced curly wool, a compact silhouette and no external textures', () => {
  const pet = createPpojjakiPet(), { geometries, materials, instances } = resources(pet);
  assert.ok(pet.userData.petBody instanceof T.Group);
  assert.equal(instances.length, 5); assert.equal(instances.reduce((n, mesh) => n + mesh.count, 0), 118);
  assert.equal(geometries.size, 2, 'smooth face and wool each share a single geometry');
  for (const material of materials) assert.equal((material as T.MeshStandardMaterial).map ?? null, null);
  const bounds = new T.Box3().setFromObject(pet), size = bounds.getSize(new T.Vector3());
  assert.ok(size.y > .9 && size.y < 1.4); assert.ok(size.x < 1.35, 'wide fluffy ears stay close to the compact body'); assert.ok(bounds.min.y > -.05, 'short feet remain above the ground');
});

test('pet gait is deterministic, returns to rest and reduces wool triangles without allocating replacements', () => {
  const pet = createPpojjakiPet(), before = resources(pet), body = pet.userData.petBody as T.Group;
  animatePpojjakiPet(pet, 1.1, true, false, false); const walking = matrices(pet);
  animatePpojjakiPet(pet, 1.1, true, false, false); assert.deepEqual(matrices(pet), walking, 'same simulation time freezes the animation');
  animatePpojjakiPet(pet, 1.4, true, true, false); assert.notDeepEqual(matrices(pet), walking);
  assert.ok(resources(pet).instances.reduce((n, mesh) => n + mesh.count, 0) < 118);
  animatePpojjakiPet(pet, 9, true, false, true); const reduced = matrices(pet); assert.equal(body.position.y, 0);
  animatePpojjakiPet(pet, 99, true, false, true); assert.deepEqual(matrices(pet), reduced);
  assert.deepEqual(resources(pet).geometries, before.geometries); assert.deepEqual(resources(pet).materials, before.materials);
});

test('small golden aura has no scene-covering shell and respects low quality and fixed simulation time', () => {
  const aura = createPpojjakiAura(), { instances, materials } = resources(aura);
  assert.ok(materials.size <= 2); assert.equal(instances.length, 3);
  const maxOpacity = Math.max(...[...materials].map(material => material.opacity)); assert.ok(maxOpacity <= .75);
  animatePpojjakiAura(aura, 2, false, false);
  const previous = instances.map(mesh => [...mesh.instanceMatrix.array]);
  animatePpojjakiAura(aura, 2, false, false); assert.deepEqual(instances.map(mesh => [...mesh.instanceMatrix.array]), previous);
  animatePpojjakiAura(aura, 3, true, true); const reduced = instances.map(mesh => [...mesh.instanceMatrix.array]);
  assert.equal(instances.find(mesh => mesh.instanceMatrix.count === 20)?.count, 10);
  assert.equal(instances.find(mesh => mesh.instanceMatrix.count === 4)?.count, 2);
  animatePpojjakiAura(aura, 55, true, true); assert.deepEqual(instances.map(mesh => [...mesh.instanceMatrix.array]), reduced);
  const bounds = new T.Box3().setFromObject(aura), size = bounds.getSize(new T.Vector3()); assert.ok(size.x < 2.5 && size.z < 2.5 && size.y < 2.6);
});

test('pet and aura dispose once without touching materials attached later by the world', () => {
  for (const group of [createPpojjakiPet(), createPpojjakiAura()]) {
    const { geometries, materials, instances } = resources(group); let geometryDisposals = 0, materialDisposals = 0, instanceDisposals = 0;
    geometries.forEach(geometry => geometry.addEventListener('dispose', () => geometryDisposals++));
    materials.forEach(material => material.addEventListener('dispose', () => materialDisposals++));
    instances.forEach(instance => instance.addEventListener('dispose', () => instanceDisposals++));
    const sharedGeometry = new T.BoxGeometry(), sharedMaterial = new T.MeshBasicMaterial(); let sharedDisposals = 0;
    sharedGeometry.addEventListener('dispose', () => sharedDisposals++); sharedMaterial.addEventListener('dispose', () => sharedDisposals++);
    group.add(new T.Mesh(sharedGeometry, sharedMaterial));
    const avatar = new T.Group(); avatar.add(group); disposePpojjakiAssets(avatar); disposePpojjakiAssets(avatar);
    assert.equal(geometryDisposals, geometries.size); assert.equal(materialDisposals, materials.size); assert.equal(instanceDisposals, instances.length);
    assert.equal(sharedDisposals, 0); assert.ok([...geometries].every(geometry => geometry.userData.ppoDisposed));
    avatar.traverse(object => { if (object instanceof T.Mesh && !object.geometry.userData.ppoDisposed && object.geometry !== sharedGeometry) object.geometry.dispose(); });
    assert.equal(geometryDisposals, geometries.size, 'generic cleanup can skip marked geometry after the helper');
    sharedGeometry.dispose(); sharedMaterial.dispose(); avatar.clear();
  }
});

test('puppy diagonal feet step clearly, settle gradually and stop under reduced motion', () => {
  const pet=createPpojjakiPet(), parts=pet.userData.ppoParts as {legs:T.Group[];ears:T.Group[];body:T.Group};
  animatePpojjakiPet(pet,.12,true,false,false);
  const moving=parts.legs.map(leg=>leg.rotation.x);
  assert.ok(Math.abs(moving[0])>.4);
  assert.equal(moving[0],moving[3]);assert.equal(moving[1],moving[2]);assert.equal(moving[0],-moving[1]);
  animatePpojjakiPet(pet,.13,false,false,false);assert.ok(Math.abs(parts.legs[0].rotation.x)>.1,'coming to rest retains a short settling step');
  for(let t=.2;t<1.5;t+=.1)animatePpojjakiPet(pet,t,false,false,false);
  assert.ok(parts.legs.every(leg=>Math.abs(leg.rotation.x)<.001));
  animatePpojjakiPet(pet,1.6,true,false,true);assert.ok(parts.legs.every(leg=>leg.rotation.x===0));assert.equal(parts.body.position.y,0);
});