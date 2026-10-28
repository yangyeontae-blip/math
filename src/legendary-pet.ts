import * as T from 'three';

type PetParts = { body: T.Group; ears: T.Group[]; legs: T.Group[]; tail: T.Group; curls: T.InstancedMesh[] };
type AuraParts = { flower: T.Group; paws: T.InstancedMesh; stars: T.InstancedMesh; dummy: T.Object3D };
type OwnedAssets = { geometries: Set<T.BufferGeometry>; materials: Set<T.Material>; instances: T.InstancedMesh[] };

function ownAssets(group: T.Group) {
  const assets: OwnedAssets = { geometries: new Set(), materials: new Set(), instances: [] };
  group.traverse(object => { if (object instanceof T.Mesh) { assets.geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) assets.materials.add(material); } if (object instanceof T.InstancedMesh) assets.instances.push(object); });
  group.userData.ppoAssets = assets;
}

/** Only our model's assets: later attachments may use the world's shared materials. */
export function disposePpojjakiAssets(root: T.Object3D) {
  const owners: T.Object3D[] = []; root.traverse(object => { if (object.userData.ppoAssets) owners.push(object); });
  for (const owner of owners) {
    const assets = owner.userData.ppoAssets as OwnedAssets; delete owner.userData.ppoAssets;
    assets.instances.forEach(mesh => mesh.dispose()); assets.geometries.forEach(geometry => { geometry.userData.ppoDisposed = true; geometry.dispose(); }); assets.materials.forEach(material => material.dispose());
    assets.instances.length = 0; assets.geometries.clear(); assets.materials.clear();
    delete owner.userData.ppoParts; delete owner.userData.ppoAuraParts; delete owner.userData.petBody;
  }
}

/** Each model owns its small shared assets; normal deduplicated traversal disposal is sufficient. */
export function createPpojjakiPet(): T.Group {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  root.name = '뽀짝이'; root.userData.petModel = true; root.userData.petBody = body;
  const sphere = new T.SphereGeometry(1, 12, 8), curlGeometry = new T.SphereGeometry(1, 8, 6);
  const fur = new T.MeshStandardMaterial({ color: 0xd9a574, roughness: .92 });
  const earFur = new T.MeshStandardMaterial({ color: 0xbe8356, roughness: .95 });
  const cream = new T.MeshStandardMaterial({ color: 0xffe8c6, roughness: .85 });
  const dark = new T.MeshStandardMaterial({ color: 0x2c211e, roughness: .28 });
  const shine = new T.MeshBasicMaterial({ color: 0xfffaf0 });
  const gold = new T.MeshStandardMaterial({ color: 0xf1c76e, metalness: .45, roughness: .38 });
  const pink = new T.MeshStandardMaterial({ color: 0xd78986, roughness: .8 });
  const ball = (parent: T.Object3D, material: T.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
    const mesh = new T.Mesh(sphere, material); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const curls: T.InstancedMesh[] = [];
  const wool = (parent: T.Object3D, material: T.Material, count: number, center: T.Vector3, size: T.Vector3, seed: number) => {
    const mesh = new T.InstancedMesh(curlGeometry, material, count), dummy = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const y = 1 - 2 * (i + .5) / count, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.399963 + seed;
      dummy.position.set(center.x + Math.cos(a) * r * size.x, center.y + y * size.y, center.z + Math.sin(a) * r * size.z);
      if (seed === 1.1 && dummy.position.y < .98 && dummy.position.z > .32) dummy.position.z = .32; // leave the eyes and muzzle unobstructed
      const scale = .065 + (Math.sin(i * 5.7 + seed) + 1) * .013; dummy.scale.set(scale * 1.08, scale, scale); dummy.rotation.set(a, i * .3, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = true; mesh.userData.fullCount = count; mesh.userData.ppoWool = true; parent.add(mesh); curls.push(mesh); return mesh;
  };
  ball(body, fur, 0, .43, -.08, .29, .26, .36);
  ball(body, fur, 0, .83, .2, .29, .28, .25);
  wool(body, fur, 38, new T.Vector3(0, .43, -.08), new T.Vector3(.27, .23, .34), .2);
  wool(body, fur, 36, new T.Vector3(0, .86, .18), new T.Vector3(.27, .24, .22), 1.1);
  const ears: T.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = new T.Group(); ear.position.set(side * .28, .94, .16); ear.rotation.z = side * .12; body.add(ear); ears.push(ear);
    ball(ear, earFur, side * .045, -.19, 0, .13, .25, .15);
    wool(ear, earFur, 16, new T.Vector3(side * .045, -.19, 0), new T.Vector3(.12, .22, .14), side * .7);
  }
  // Clear eyes sit in front of the wool rather than getting lost between curls.
  for (const side of [-1, 1]) {
    ball(body, dark, side * .118, .87, .438, .064, .071, .043);
    ball(body, shine, side * .118 - .018, .895, .475, .021);
    ball(body, shine, side * .118 + .019, .856, .475, .009);
    ball(body, cream, side * .065, .746, .47, .108, .087, .105);
  }
  ball(body, cream, 0, .69, .47, .11, .055, .08);
  ball(body, dark, 0, .79, .565, .059, .044, .04);
  ball(body, shine, -.016, .808, .594, .013, .008, .006);
  ball(body, dark, 0, .72, .558, .011, .023, .009);
  ball(body, pink, 0, .681, .533, .028, .026, .011);
  const legs: T.Group[] = [];
  for (const z of [-.28, .19]) for (const side of [-1, 1]) {
    const leg = new T.Group(); leg.position.set(side * .19, .25, z); body.add(leg); legs.push(leg);
    ball(leg, fur, 0, -.075, 0, .095, .15, .1); ball(leg, cream, 0, -.18, .035, .11, .065, .135);
  }
  const tail = new T.Group(); tail.position.set(0, .49, -.38); body.add(tail);
  ball(tail, fur, 0, .12, -.09, .09, .17, .1); wool(tail, fur, 12, new T.Vector3(0, .19, -.12), new T.Vector3(.1, .13, .1), 2.2);
  // Small gold bow and bell, without adding a bright shell around the dog.
  for (const side of [-1, 1]) { const bow = ball(body, cream, side * .065, .56, .29, .07, .04, .024); bow.rotation.z = side * .35; }
  ball(body, gold, 0, .53, .33, .045); ball(body, dark, 0, .522, .372, .012, .018, .006);
  root.userData.ppoParts = { body, ears, legs, tail, curls } satisfies PetParts;
  ownAssets(root);
  return root;
}

/** Gold flower on the floor and small paw/star ornaments; no screen-covering transparency. */
export function createPpojjakiAura(_ride = -1): T.Group {
  const root = new T.Group(), flower = new T.Group(); flower.position.y = .035; root.add(flower); root.name = '뽀짝이 꽃빛';
  const sphere = new T.SphereGeometry(1, 8, 6), ring = new T.TorusGeometry(1, .018, 5, 40);
  const gold = new T.MeshBasicMaterial({ color: 0xf1cc78, transparent: true, opacity: .56, depthWrite: false });
  const cream = new T.MeshBasicMaterial({ color: 0xffe8ac, transparent: true, opacity: .75, depthWrite: false });
  for (const radius of [.62, .87]) { const hoop = new T.Mesh(ring, gold); hoop.rotation.x = Math.PI / 2; hoop.scale.setScalar(radius); flower.add(hoop); }
  const petals = new T.InstancedMesh(sphere, gold, 8), dummy = new T.Object3D();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; dummy.position.set(Math.cos(a) * .44, 0, Math.sin(a) * .44); dummy.rotation.set(0, -a, 0); dummy.scale.set(.27, .012, .11); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix); }
  petals.computeBoundingSphere(); flower.add(petals);
  const paws = new T.InstancedMesh(sphere, cream, 20);
  const starShape = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .045 : .105; if (!i) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); } starShape.closePath();
  const stars = new T.InstancedMesh(new T.ShapeGeometry(starShape), cream, 4); cream.side = T.DoubleSide;
  root.add(paws, stars); root.userData.ppoAuraParts = { flower, paws, stars, dummy } satisfies AuraParts;
  animatePpojjakiAura(root, 0, false, false); paws.computeBoundingSphere(); stars.computeBoundingSphere();
  ownAssets(root);
  return root;
}

export function animatePpojjakiPet(group: T.Group, time: number, moving: boolean, low: boolean, reduced: boolean) {
  const parts = group.userData.ppoParts as PetParts | undefined; if (!parts) return;
  const t = Number.isFinite(time) ? time : 0, gait = reduced ? 0 : moving ? Math.sin(t * 11) : Math.sin(t * 2.2) * .16;
  parts.body.position.y = reduced ? 0 : moving ? Math.abs(gait) * .035 : Math.sin(t * 2.2) * .008;
  parts.ears.forEach((ear, i) => { const side = i ? 1 : -1; ear.rotation.z = side * (.12 + gait * .08); ear.rotation.x = reduced ? 0 : gait * .16; });
  parts.legs.forEach((leg, i) => { leg.rotation.x = reduced || !moving ? 0 : gait * (i === 0 || i === 3 ? .32 : -.32); });
  parts.tail.rotation.z = reduced ? 0 : Math.sin(t * (moving ? 10 : 5)) * .26;
  parts.curls.forEach(mesh => { mesh.count = low ? Math.ceil(Number(mesh.userData.fullCount) * .68) : Number(mesh.userData.fullCount); });
}

export function animatePpojjakiAura(group: T.Group, time: number, low: boolean, reduced: boolean) {
  const parts = group.userData.ppoAuraParts as AuraParts | undefined; if (!parts) return;
  const t = reduced || !Number.isFinite(time) ? 0 : time, { dummy } = parts;
  parts.flower.rotation.y = t * .1; parts.flower.scale.setScalar(reduced ? 1 : 1 + Math.sin(t * 1.4) * .025);
  parts.paws.count = low || reduced ? 10 : 20; parts.stars.count = low || reduced ? 2 : 4;
  for (let paw = 0; paw < 4; paw++) {
    const a = paw * Math.PI / 2 + t * .28, x = Math.cos(a) * .83, z = Math.sin(a) * .83, y = .42 + (paw % 2) * .42 + Math.sin(t * 1.3 + paw) * .035;
    for (let pad = 0; pad < 5; pad++) {
      const toe = (pad - 1) * .7 - 1.05;
      dummy.position.set(x + (pad ? Math.sin(toe) * .075 : 0), y + (pad ? .08 + Math.cos(toe) * .025 : 0), z);
      dummy.rotation.set(0, -a + Math.PI / 2, 0); dummy.scale.set(pad ? .022 : .055, pad ? .026 : .043, .016); dummy.updateMatrix(); parts.paws.setMatrixAt(paw * 5 + pad, dummy.matrix);
    }
    const starAngle = a + .6; dummy.position.set(Math.cos(starAngle) * .95, .65 + (paw % 2) * .35, Math.sin(starAngle) * .95); dummy.rotation.set(0, -a, .2 + Math.sin(t + paw) * .15); dummy.scale.setScalar(1); dummy.updateMatrix(); parts.stars.setMatrixAt(paw, dummy.matrix);
  }
  parts.paws.instanceMatrix.needsUpdate = true; parts.stars.instanceMatrix.needsUpdate = true;
}
