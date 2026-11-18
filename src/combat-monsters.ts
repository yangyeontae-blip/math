import * as T from 'three';

type Kit = { sphere: T.BufferGeometry; cube: T.BufferGeometry; cone: T.BufferGeometry; circle: T.BufferGeometry; material: (color: number) => T.Material };
/** Nine original rounded silhouettes. The caller owns the shared geometry/materials. */
export function monsterModel(type: number, color: number, kit: Kit) {
  const root = new T.Group(), body = new T.Group(); root.add(body); root.userData.combatMonster = true; root.userData.monsterBody = body;
  const put = (g: T.BufferGeometry, c: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => { const m = new T.Mesh(g, kit.material(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = Math.max(sx,sy,sz) > .25; m.userData.monsterDetail = Math.max(sx,sy,sz) < .075; body.add(m); return m; };
  const ball = (c: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => put(kit.sphere, c, x, y, z, sx, sy, sz);
  const cream = 0xffedcb, dark = 0x293c4b, tint = new T.Color(color).lerp(new T.Color(0xffffff), .13).getHex();
  const torso = ball(tint, 0, .69, 0, .67, .66, .58); torso.name = 'soft-body';
  ball(cream, 0, .47, .47, .43, .35, .16);
  for (const side of [-1, 1]) {
    const foot = ball(color, side * .42, .16, .16, .27, .17, .34); foot.userData.monsterFoot = side;
    ball(cream, side * .43, .20, .39, .14, .06, .07);
    ball(0xfffaf0, side * .225, .87, .508, .153, .185, .095);
    ball(dark, side * .208, .865, .586, .098, .128, .05);
    ball(0xffffff, side * .207 - .025, .912, .625, .037, .044, .016);
    ball(0x87c8df, side * .208 + .024, .82, .624, .023, .025, .014);
    ball(0xf4a1aa, side * .42, .64, .47, .135, .065, .044);
  }
  ball(dark, 0, .61, .607, .065, .042, .026); ball(0xf6b6b0, 0, .585, .626, .034, .015, .011);
  if (type % 9 === 0) { // sprout: a sweeping two-leaf crest
    for (const side of [-1, 1]) { const leaf = ball(side < 0 ? 0x328e6b : 0x9ce678, side * .23, 1.45, -.03, .24, .48, .095); leaf.rotation.z = -side * .65; ball(0xdaf7a3, side * .19, 1.45, .045, .035, .28, .02).rotation.z = -side * .65; }
  } else if (type % 9 === 1) {
    ball(0xc85a7a, 0, 1.18, -.06, .92, .29, .73); ball(0xf2829c, 0, 1.39, -.06, .78, .34, .65);
    for (const [x, y, z] of [[-.4, 1.54, .32], [.32, 1.63, .18], [.02, 1.7, -.2]]) ball(cream, x, y, z, .14, .045, .12);
    ball(0xffcd8c, .59, .95, .18, .18, .21, .12);
  } else if (type % 9 === 2) {
    for (const side of [-1, 1]) { const ear = ball(tint, side * .31, 1.53, -.08, .22, .64, .19); ear.rotation.z = -side * .17; ball(0xf8b5d2, side * .31, 1.57, .08, .10, .42, .033).rotation.z = -side * .17; }
    ball(cream, .57, .42, -.30, .24);
  } else if (type % 9 === 3) {
    ball(0x82583d, 0, 1.25, -.07, .78, .27, .63); ball(0xa8794b, 0, 1.42, -.07, .62, .28, .5);
    const stem = put(kit.cone, 0x79513b, .05, 1.74, -.07, .1, .4, .1); stem.rotation.z = -.35;
    for (let i = 0; i < 7; i++) ball(0xcda170, -.5 + i * .16, 1.26, .47, .065, .055, .035);
  } else if (type % 9 === 4) {
    for (const side of [-1, 1]) { const wing = ball(0xdaefff, side * .67, 1.02, -.13, .39, .22, .08); wing.rotation.z = side * .5; wing.userData.monsterWing = side; ball(0xffde8b, side * .27, 1.52, .02, .10); }
    for (const y of [.47, .7]) ball(0x715637, 0, y, -.15, .65, .07, .51);
  } else if (type % 9 === 5 || type % 9 === 6) {
    for (const side of [-1, 1]) { const ear = put(kit.cone, tint, side * .43, 1.43, -.08, .27, .59, .23); ear.rotation.z = -side * .27; put(kit.cone, 0xffd9c4, side * .43, 1.45, .1, .13, .35, .035).rotation.z = -side * .27; }
    const tail = ball(color, .69, .62, -.26, .32, .35, .49); tail.rotation.z = -.7; tail.userData.monsterTail = true;
    ball(cream, .82, .86, -.3, .24, .2, .28);
  } else if (type % 9 === 7) {
    for (let i = 0; i < 9; i++) { const a = i * 2.399; ball(0xfff4ee, Math.cos(a) * .46, 1.22 + i % 2 * .15, Math.sin(a) * .27 - .05, .29, .26, .26); }
    for (const side of [-1, 1]) ball(0xf2a7cb, side * .61, 1.02, -.01, .19, .34, .13).rotation.z = side * .6;
  } else {
    for (const side of [-1, 1]) ball(color, side * .43, 1.22, -.08, .26, .24, .2);
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; put(kit.cone, 0xffd774, Math.cos(a) * .3, 1.37 + Math.sin(a) * .2, .07, .13, .3, .10).rotation.z = a - Math.PI / 2; }
  }
  const shadow = new T.Mesh(kit.circle, kit.material(0x40564b)); shadow.position.y = .025; shadow.rotation.x = -Math.PI / 2; shadow.scale.set(.64, .43, 1); root.add(shadow);
  root.userData.monsterDetails = body.children.filter(o => o.userData.monsterDetail);
  root.userData.monsterShadow = shadow; body.userData.restScale = body.scale.clone(); return root;
}

export function animateMonster(root: T.Group, time: number, dt: number, reduced: boolean, state = 'idle', moving = false) {
  const body = root.userData.monsterBody as T.Group | undefined; if (!body) return;
  body.userData.restScale ??= body.scale.clone(); const base = body.userData.restScale as T.Vector3;
  const hit = Math.max(0, Number(root.userData.hitLife ?? 0) - dt); root.userData.hitLife = hit;
  if (hit > .19 && !reduced) return; // 35 ms pose-only hit stop; the simulation keeps running.
  const phase = time * (moving ? 10 : 3.1) + Number(root.userData.phase ?? 0), bounce = reduced ? 0 : Math.sin(phase);
  let squash = 1 + bounce * (moving ? .065 : .025);
  if (state === 'telegraph') squash = reduced ? .92 : .84 + Math.sin(time * 10) * .015;
  if (hit > 0 && !reduced) squash = 1 - Math.sin(hit / .225 * Math.PI) * .22;
  const spread = 1 / Math.sqrt(squash); body.scale.set(base.x * spread, base.y * squash, base.z * spread);
  const kick = reduced ? 0 : Math.sin(Math.min(1, hit / .225) * Math.PI) * .25;
  body.position.set(Number(root.userData.kickX ?? 0) * kick, reduced ? 0 : moving ? Math.abs(bounce) * .13 : bounce * .035, Number(root.userData.kickZ ?? 0) * kick);
  body.rotation.z = reduced ? 0 : hit > 0 ? Math.sin(hit * 30) * .12 : moving ? bounce * .06 : 0;
  for (const child of body.children) {
    if (child.userData.monsterWing) child.rotation.z = Number(child.userData.monsterWing) * (.5 + (reduced ? 0 : Math.sin(time * 12) * .25));
    if (child.userData.monsterFoot) child.rotation.x = reduced || !moving ? 0 : Math.sin(phase + Number(child.userData.monsterFoot) * 1.57) * .35;
    if (child.userData.monsterTail) child.rotation.y = reduced ? 0 : Math.sin(time * 4) * .25;
  }
}
