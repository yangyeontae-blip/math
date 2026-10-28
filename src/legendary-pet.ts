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
  const sphere = new T.SphereGeometry(1, 18, 12), curlGeometry = new T.SphereGeometry(1, 10, 8);
  const fur = new T.MeshStandardMaterial({ color: 0xdca675, roughness: .87 });
  const earFur = new T.MeshStandardMaterial({ color: 0xc58c5d, roughness: .9 });
  const cream = new T.MeshStandardMaterial({ color: 0xffe1bb, roughness: .84 });
  const dark = new T.MeshStandardMaterial({ color: 0x261f1c, roughness: .21 });
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
      if (seed === 1.1 && dummy.position.y < .12 && dummy.position.z > .22) dummy.position.z = .2; // soft wool stays behind the expression
      // Embed tiny, flattened curls into a smooth silhouette rather than stacking hard balls on it.
      const scale = .032 + (Math.sin(i * 5.7 + seed) + 1) * .006;
      dummy.scale.set(scale * 1.12, scale * .84, scale); dummy.rotation.set(a, i * .3, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = true; mesh.userData.fullCount = count; mesh.userData.ppoWool = true; parent.add(mesh); curls.push(mesh); return mesh;
  };
  ball(body, fur, 0, .405, -.075, .285, .245, .335);
  ball(body, cream, 0, .41, .16, .155, .17, .145);
  wool(body, fur, 38, new T.Vector3(0, .405, -.075), new T.Vector3(.272, .228, .322), .2);
  const head = new T.Group(); head.position.set(0, .855, .18); body.add(head); body.userData.ppoHead = head;
  ball(head, fur, 0, 0, 0, .35, .325, .295);
  wool(head, fur, 36, new T.Vector3(), new T.Vector3(.334, .31, .281), 1.1);
  const ears: T.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = new T.Group(); ear.position.set(side * .31, .13, .005); ear.rotation.z = side * .1; head.add(ear); ears.push(ear);
    ball(ear, earFur, side * .025, -.195, 0, .135, .265, .15);
    ball(ear, fur, side * .035, -.34, .055, .095, .095, .09);
    wool(ear, earFur, 16, new T.Vector3(side * .025, -.195, 0), new T.Vector3(.123, .248, .136), side * .7);
  }
  // Clear eyes sit in front of the wool rather than getting lost between curls.
  for (const side of [-1, 1]) {
    ball(head, dark, side * .127, .043, .273, .077, .087, .044);
    ball(head, shine, side * .127 - .023, .073, .31, .025, .027, .009);
    ball(head, shine, side * .127 + .023, .014, .312, .011, .012, .006);
    ball(head, cream, side * .062, -.112, .293, .109, .083, .097);
    ball(head, pink, side * .226, -.079, .239, .037, .021, .009);
  }
  ball(head, cream, 0, -.174, .297, .1, .047, .068);
  ball(head, dark, 0, -.074, .383, .046, .032, .032);
  ball(head, shine, -.013, -.062, .41, .012, .007, .004);
  ball(head, dark, 0, -.131, .382, .009, .025, .006);
  for (const side of [-1, 1]) { const smile = ball(head, dark, side * .025, -.156, .376, .032, .01, .007); smile.rotation.z = side * .2; }
  ball(head, pink, 0, -.181, .372, .021, .022, .007);
  const legs: T.Group[] = [];
  for (const z of [-.255, .195]) for (const side of [-1, 1]) {
    const leg = new T.Group(); leg.position.set(side * .18, .29, z); body.add(leg); legs.push(leg);
    ball(leg, fur, 0, -.075, 0, .093, .14, .1); ball(leg, cream, 0, -.205, .038, .108, .072, .132);
  }
  const tail = new T.Group(); tail.position.set(0, .47, -.38); body.add(tail);
  ball(tail, fur, 0, .11, -.075, .075, .14, .085); wool(tail, fur, 12, new T.Vector3(0, .17, -.095), new T.Vector3(.07, .104, .078), 2.2);
  // Small gold bow and bell, without adding a bright shell around the dog.
  for (const side of [-1, 1]) { const bow = ball(body, cream, side * .064, .56, .295, .069, .04, .024); bow.rotation.z = side * .35; }
  ball(body, gold, 0, .531, .335, .039); ball(body, dark, 0, .526, .371, .01, .014, .005);
  root.userData.ppoParts = { body, ears, legs, tail, curls } satisfies PetParts;
  ownAssets(root);
  return root;
}

/** Gold flower on the floor and small paw/star ornaments; no screen-covering transparency. */
export function createPpojjakiAura(_ride = -1): T.Group {
  const root = new T.Group(), flower = new T.Group(); flower.position.y = .24; root.add(flower); root.name = '뽀짝이 꽃빛';
  const sphere = new T.SphereGeometry(1, 8, 6), ring = new T.TorusGeometry(1, .032, 5, 40);
  const gold = new T.MeshBasicMaterial({ color: 0xf6b52a, transparent: true, opacity: .75, depthWrite: false, depthTest: false, toneMapped: false });
  const cream = new T.MeshBasicMaterial({ color: 0xffe8ac, transparent: true, opacity: .75, depthWrite: false, depthTest: false, toneMapped: false });
  for (const radius of [.8, 1.08]) { const hoop = new T.Mesh(ring, gold); hoop.rotation.x = Math.PI / 2; hoop.scale.setScalar(radius); flower.add(hoop); }
  const crown = new T.Mesh(ring, gold); crown.rotation.x = Math.PI / 2; crown.scale.setScalar(.42); crown.position.y = 2.25; root.add(crown);
  const petals = new T.InstancedMesh(sphere, gold, 8), dummy = new T.Object3D();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; dummy.position.set(Math.cos(a) * .44, 0, Math.sin(a) * .44); dummy.rotation.set(0, -a, 0); dummy.scale.set(.27, .012, .11); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix); }
  petals.computeBoundingSphere(); flower.add(petals);
  const paws = new T.InstancedMesh(sphere, cream, 20);
  const starShape = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .045 : .105; if (!i) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); } starShape.closePath();
  const stars = new T.InstancedMesh(new T.ShapeGeometry(starShape), cream, 4); cream.side = T.DoubleSide;
  root.add(paws, stars); root.userData.ppoAuraParts = { flower, paws, stars, dummy } satisfies AuraParts;
  animatePpojjakiAura(root, 0, false, false); paws.computeBoundingSphere(); stars.computeBoundingSphere();
  root.traverse(object => { if (object instanceof T.Mesh) object.renderOrder = 7; });
  ownAssets(root);
  return root;
}

export function animatePpojjakiPet(group: T.Group, time: number, moving: boolean, low: boolean, reduced: boolean) {
  const parts = group.userData.ppoParts as PetParts | undefined; if (!parts) return;
  const t = Number.isFinite(time) ? time : 0;
  const motion = (group.userData.ppoMotion ??= { time: t, weight: moving ? 1 : 0 }) as { time: number; weight: number };
  const dt = Math.max(0, Math.min(.25, t - motion.time));
  motion.weight = reduced ? 0 : t < motion.time ? Number(moving) : motion.weight + (Number(moving) - motion.weight) * (1 - Math.exp(-dt * 12)); motion.time = t;
  const walk = motion.weight, gait = Math.sin(t * 10.4), bounce = Math.abs(Math.sin(t * 10.4));
  parts.body.position.y = reduced ? 0 : bounce * .027 * walk + Math.sin(t * 2.1) * .005 * (1 - walk);
  parts.body.rotation.z = reduced ? 0 : gait * .027 * walk;
  const head = parts.body.userData.ppoHead as T.Group | undefined;
  if (head) { head.rotation.x = reduced ? 0 : Math.sin(t * 10.4 - .45) * .035 * walk; head.rotation.z = reduced ? 0 : Math.sin(t * 2.1) * .012 * (1 - walk); }
  parts.ears.forEach((ear, i) => { const side = i ? 1 : -1; ear.rotation.z = side * (.1 + bounce * .05 * walk); ear.rotation.x = reduced ? 0 : Math.sin(t * 10.4 - .65 + i * .18) * .19 * walk; });
  // Diagonal pairs step together; the longer visible paw swing reads as walking even on small screens.
  parts.legs.forEach((leg, i) => { const phase = i === 0 || i === 3 ? 1 : -1; leg.rotation.x = reduced ? 0 : gait * phase * .6 * walk; leg.rotation.z = reduced ? 0 : Math.sin(t * 10.4 + i * Math.PI) * .025 * walk; });
  parts.tail.rotation.z = reduced ? 0 : Math.sin(t * 3.8) * .15 * (1 - walk) + Math.sin(t * 9) * .31 * walk;
  parts.tail.rotation.y = reduced ? 0 : Math.sin(t * 4.1) * .1;
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
