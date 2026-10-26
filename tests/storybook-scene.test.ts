import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { StorybookScene, leafMaterial } from '../src/storybook-scene';

function withMotion(run: (setReduced: (value: boolean) => void) => void) {
  const previous = globalThis.matchMedia; let reduced = false;
  globalThis.matchMedia = query => ({ matches: reduced, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } });
  try { run(value => { reduced = value; }); }
  finally { if (previous) globalThis.matchMedia = previous; else Reflect.deleteProperty(globalThis, 'matchMedia'); }
}
const runtime = (scene: T.Scene) => scene.children.find(child => child.userData.storybookRuntime)!;
const instances = (scene: T.Scene) => runtime(scene).children.filter((child): child is T.InstancedMesh => child instanceof T.InstancedMesh);
const water = (scene: T.Scene) => instances(scene).find(child => child.material instanceof T.MeshBasicMaterial)!;

test('scene replacement releases map-owned instances once and retains shared contact and leaf resources', () => withMotion(() => {
  const scene = new T.Scene(), art = new StorybookScene();
  const pond = new T.Mesh(new T.BoxGeometry(6, .4, 4), new T.MeshStandardMaterial({ color: 0x8dcfc6 }));
  scene.add(pond); art.prepare(scene, false, false, false, 0x75a669);
  const firstRoot = runtime(scene), first = instances(scene), rings = water(scene);
  const contacts = firstRoot.children.filter((child): child is T.Mesh => child instanceof T.Mesh && !(child instanceof T.InstancedMesh));
  let geometryDisposes = 0, materialDisposes = 0, instanceDisposes = 0, sharedDisposes = 0;
  rings.geometry.addEventListener('dispose', () => geometryDisposes++);
  (rings.material as T.Material).addEventListener('dispose', () => materialDisposes++);
  for (const mesh of first) mesh.addEventListener('dispose', () => instanceDisposes++);
  contacts[0].geometry.addEventListener('dispose', () => sharedDisposes++);
  (contacts[0].material as T.Material).addEventListener('dispose', () => sharedDisposes++);
  leafMaterial(0x75a669).addEventListener('dispose', () => sharedDisposes++);
  art.dispose(scene); art.dispose(scene);
  assert.equal(geometryDisposes, 1); assert.equal(materialDisposes, 1); assert.equal(instanceDisposes, first.length);
  assert.equal(sharedDisposes, 0); assert.deepEqual(scene.children, [pond]);
  for (let i = 0; i < 50; i++) {
    art.prepare(scene, false, false, false, 0x75a669);
    assert.equal(scene.children.filter(child => child.userData.storybookRuntime).length, 1);
    assert.equal(instances(scene).length, 2);
    assert.equal(instances(scene)[0].count, 180);
    assert.equal((runtime(scene).children[0] as T.Mesh).geometry, contacts[0].geometry);
  }
  art.clear(scene); assert.deepEqual(scene.children, [pond]); pond.geometry.dispose();
}));

test('ripple placement uses transformed world bounds and fits within a scaled narrow pond', () => withMotion(() => {
  const scene = new T.Scene(), art = new StorybookScene(), parent = new T.Group();
  parent.position.set(5, 2, -3); parent.scale.set(2, 3, .5);
  const pond = new T.Mesh(new T.BoxGeometry(6, .4, 2), new T.MeshStandardMaterial({ color: 0x8dcfc6 }));
  pond.position.set(1, .2, 4); pond.rotation.y = Math.PI / 2; parent.add(pond); scene.add(parent);
  scene.updateMatrixWorld(true); const bounds = new T.Box3().setFromObject(pond);
  art.prepare(scene, false, false, false, 0x75a669); art.update(1, new T.Vector3(), null, 0);
  const rings = water(scene), matrix = new T.Matrix4(), at = new T.Vector3(), scale = new T.Vector3();
  for (let i = 0; i < rings.count; i++) {
    rings.getMatrixAt(i, matrix); matrix.decompose(at, new T.Quaternion(), scale);
    assert.ok(Math.abs(at.y - (bounds.max.y + .025)) < .00001);
    assert.ok(at.x - scale.x >= bounds.min.x && at.x + scale.x <= bounds.max.x);
    assert.ok(at.z - scale.z >= bounds.min.z && at.z + scale.z <= bounds.max.z);
  }
  art.clear(scene); pond.geometry.dispose();
}));

test('contact shadows sit above raised paving but never jump up onto furniture', () => withMotion(() => {
  const scene=new T.Scene(),art=new StorybookScene();
  const paving=new T.Mesh(new T.BoxGeometry(10,.1,8),new T.MeshStandardMaterial());paving.position.y=.15;scene.add(paving);
  const table=new T.Mesh(new T.BoxGeometry(3,.2,3),new T.MeshStandardMaterial());table.position.y=1;scene.add(table);
  art.prepare(scene,true,false,false,0x75a669);art.quality(true);art.update(0,new T.Vector3(0,0,0),null,0);
  assert.ok(Math.abs(runtime(scene).children[0].position.y-.225)<1e-6);
  art.clear(scene);paving.geometry.dispose();table.geometry.dispose();
}));

test('quality and reduced motion retain contact shadows while reducing ornamental work', () => withMotion(setReduced => {
  const scene = new T.Scene(), art = new StorybookScene();
  scene.add(new T.Mesh(new T.BoxGeometry(6, .4, 4), new T.MeshStandardMaterial({ color: 0x8dcfc6 })));
  scene.fog = new T.Fog(0xffffff, 1, 10); art.prepare(scene, false, false, false, 0x75a669);
  art.quality(true); assert.equal(instances(scene)[0].count, 60); assert.equal(water(scene).visible, false);
  const player = new T.Vector3(3, 1, 4); art.update(10, player, null, .3);
  const contact = runtime(scene).children[0]; assert.equal(contact.position.x, 3); assert.equal(contact.position.z, 4); assert.equal(contact.visible, true);
  assert.equal(scene.fog, null);
  art.quality(false); assert.equal(instances(scene)[0].count, 180); assert.equal(water(scene).visible, true);
  setReduced(true); art.prepare(scene, false, false, false, 0x75a669); art.quality(false); art.update(10, player, null, 0);
  assert.equal(water(scene).visible, false);
  const shader = { uniforms: {} as Record<string, { value: number }>, vertexShader: '#include <begin_vertex>' };
  leafMaterial(0x75a669).onBeforeCompile(shader as never, {} as never);
  assert.equal(shader.uniforms.storyMotion.value, 0);
  setReduced(false); art.prepare(scene, true, false, false, 0x75a669); art.update(11, player, null, 0);
  assert.equal(instances(scene).filter(child => child.material instanceof T.MeshStandardMaterial).length, 0);
  assert.equal(shader.uniforms.storyMotion.value, 1); art.clear(scene);
}));
