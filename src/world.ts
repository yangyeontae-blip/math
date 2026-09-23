import * as T from 'three';
import { CHARACTERS, MONSTERS, OUTFITS, PETS, RIDES, WEAPONS, type Save } from './rules';
import { STAGES, stageBerries, stageMonsters, stagePlatforms, stageTrees, stageSize } from './stages';

type Entity = { id: string; name: string; x: number; z: number; mesh: T.Group; label: HTMLDivElement };
const mat = (color: number, roughness = .86) => new T.MeshStandardMaterial({ color, roughness });
const materials = new Map<number, T.MeshStandardMaterial>();
const sharedGeometries = new Set<T.BufferGeometry>();
const CAMERA_OFFSET = new T.Vector3(18, 25, 24);
const sphereGeometry = new T.SphereGeometry(1, 12, 8); sharedGeometries.add(sphereGeometry);
const particleGeometry = new T.OctahedronGeometry(.09); sharedGeometries.add(particleGeometry);
const boxGeometries = new Map<string, T.BoxGeometry>(), cylinderGeometries = new Map<string, T.CylinderGeometry>();
function cachedBox(w: number, h: number, d: number) { const key = `${w},${h},${d}`; if (!boxGeometries.has(key)) { const geo = new T.BoxGeometry(w, h, d); boxGeometries.set(key, geo); sharedGeometries.add(geo); } return boxGeometries.get(key)!; }
function cachedCylinder(top: number, bottom: number, h: number, sides: number) { const key = `${top},${bottom},${h},${sides}`; if (!cylinderGeometries.has(key)) { const geo = new T.CylinderGeometry(top, bottom, h, sides); cylinderGeometries.set(key, geo); sharedGeometries.add(geo); } return cylinderGeometries.get(key)!; }
function material(color: number) { if (!materials.has(color)) materials.set(color, mat(color)); return materials.get(color)!; }
function mesh(geo: T.BufferGeometry, color: number, x = 0, y = 0, z = 0, parent?: T.Object3D) {
  const m = new T.Mesh(geo, material(color)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent?.add(m); return m;
}
function ball(p: T.Object3D, color: number, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx) {
  const m = mesh(sphereGeometry, color, x, y, z, p); m.scale.set(sx, sy, sz); return m;
}
function box(p: T.Object3D, color: number, x: number, y: number, z: number, w: number, h: number, d: number) { return mesh(cachedBox(w, h, d), color, x, y, z, p); }
function cylinder(p: T.Object3D, color: number, x: number, y: number, z: number, top: number, bottom: number, h: number, sides = 16) { return mesh(cachedCylinder(top, bottom, h, sides), color, x, y, z, p); }

export function makeCharacter(character: number, outfit: number, weapon: number, outfitLevel = 0, weaponLevel = 0, hairstyle = 0, face = 0) {
  const g = new T.Group(), c = CHARACTERS[character], o = OUTFITS[outfit];
  const body = new T.Group(); g.add(body); g.userData.body = body;
  // Short, rounded chibi proportions. All costumes are visible 3D geometry.
  const left = ball(body, 0x574840, -.19, .18, .05, .19, .2, .28), right = ball(body, 0x574840, .19, .18, .05, .19, .2, .28);
  g.userData.feet = [left, right];
  cylinder(body, o.color, 0, .67, 0, .31, outfit > 2 ? .53 : .42, .88);
  box(body, o.accent, 0, .81, .32, .63, .12, .1);
  const collar = box(body, o.accent, -.06, 1, .27, .12, .45, .07); collar.rotation.z = -.45;
  ball(body, o.accent, .19, .8, .4, .1, .12, .05);
  for (const sign of [-1, 1]) {
    const arm = cylinder(body, outfit === 1 && sign < 0 ? 0xffd27f : o.color, sign * .4, .85, 0, .17, .2, .55); arm.rotation.z = sign * .3;
    ball(body, c.skin, sign * .49, .57, .02, .16);
  }
  if (outfit === 2 || outfit === 5) { const cape = cylinder(body, o.color, 0, .73, -.2, .25, .64, 1, 12); cape.scale.z = .6; }
  ball(body, c.skin, 0, 1.5, 0, .53, .52, .46);
  ball(body, c.hair, 0, 1.77, -.065, .55, hairstyle === 3 ? .38 : .31, .46);
  for (const side of [-1, 1]) {
    ball(body, c.skin, side * .51, 1.47, 0, .1, .14, .12);
    const bigEye = face === 1 || face === 4;
    ball(body, face === 3 ? 0x563e55 : 0x343a39, side * .19, 1.5, .424, bigEye ? .065 : .047, bigEye ? .085 : .065, .026);
    if (face !== 4) ball(body, 0xffffff, side * .18, 1.524, .444, face === 1 ? .022 : .014);
    ball(body, face === 4 ? 0xf6c85f : 0xf1a69d, side * .31, 1.37, .397, face === 3 ? .065 : .086, .043, .021);
    if (hairstyle === 1 || hairstyle === 5) { ball(body, c.hair, side * .55, 1.68, -.06, hairstyle === 5 ? .3 : .24); ball(body, o.accent, side * .43, 1.84, .04, .12); }
    if (hairstyle === 2) ball(body, c.hair, side * .43, 1.47, -.13, .18, .43, .3);
    if (hairstyle === 4 && side > 0) { ball(body, c.hair, .53, 1.58, -.16, .25, .5, .27); ball(body, o.accent, .43, 1.88, -.02, .12); }
    if (face === 2) { const brow = box(body, 0x4d4039, side * .19, 1.61, .445, .13, .025, .02); brow.rotation.z = side * -.16; }
    if (face === 3) { // 방긋 고양이상: 속눈썹과 수염
      const lash = box(body, 0x563e55, side * .3, 1.54, .44, .1, .018, .016); lash.rotation.z = side * .42;
      for (const y of [1.37, 1.42]) { const whisker = box(body, 0x8e6171, side * .43, y, .42, .18, .014, .012); whisker.rotation.z = side * (y === 1.37 ? -.18 : .18); }
    }
    if (face === 4) { // 별눈 반짝이: 눈동자 대신 또렷한 별
      const star = mesh(particleGeometry, 0xffdd65, side * .19, 1.5, .456, body); star.scale.set(.72, .72, .34); star.rotation.z = side * .25;
      ball(body, 0xffffff, side * .14, 1.54, .47, .018, .025, .01);
    }
    if (face === 5) { // 졸린 달눈: 눈꺼풀과 작은 달빛 볼
      const lid = ball(body, c.skin, side * .19, 1.55, .452, .09, .045, .018); lid.rotation.z = side * .16;
      ball(body, 0xd3c5f2, side * .34, 1.36, .43, .055, .035, .014);
    }
    if (face === 7) { // 하트 반짝눈: 두 개의 둥근 조각으로 만든 하트
      ball(body, 0xf05f91, side * .16, 1.52, .46, .055, .07, .018); ball(body, 0xf05f91, side * .22, 1.52, .46, .055, .07, .018);
      const point = mesh(new T.ConeGeometry(.09, .16, 3), 0xf05f91, side * .19, 1.45, .46, body); point.rotation.z = Math.PI;
    }
    if (face === 8) { // 용감한 번개눈: 노란 번개와 각진 눈썹
      const bolt = box(body, 0xffd85e, side * .19, 1.5, .455, .06, .13, .018); bolt.rotation.z = side * .58;
      const brow = box(body, 0x5b4a42, side * .19, 1.62, .45, .16, .025, .02); brow.rotation.z = side * -.24;
    }
    if (face === 9) { // 무지개 웃음: 양볼의 세 줄 무지개
      for (let stripe = 0; stripe < 3; stripe++) ball(body, [0xf58aa4, 0xf5cf65, 0x85cfa0][stripe], side * .34, 1.4 - stripe * .045, .43, .07, .012, .012);
    }
  }
  const smile = mesh(new T.TorusGeometry(.075, .012, 5, 10, Math.PI), 0x975e57, 0, 1.35, .44, body); smile.rotation.z = Math.PI;
  if (face === 1) { smile.scale.set(.72, 1.25, 1); ball(body, 0xf7a4b6, 0, 1.34, .45, .032, .05, .014); }
  if (face === 2) { smile.scale.x = 1.2; }
  if (face === 3) { smile.scale.x = 1.35; for (const side of [-1, 1]) ball(body, 0x6a4f48, side * .08, 1.37, .452, .018, .045, .012); }
  if (face === 4) { smile.scale.set(1.12, .85, 1); for (const side of [-1, 1]) ball(body, 0xffe98a, side * .38, 1.66, .435, .04); }
  if (face === 5) { smile.scale.set(.65, .75, 1); }
  if (face === 6) { smile.scale.set(.82, .72, 1); for (const side of [-1, 1]) ball(body, 0xf6b1be, side * .34, 1.38, .43, .1, .055, .018); box(body, 0xfffdf2, -.055, 1.31, .452, .1, .1, .018); box(body, 0xfffdf2, .055, 1.31, .452, .1, .1, .018); }
  if (face === 7) { smile.scale.set(1.28, 1.12, 1); }
  if (face === 8) { smile.scale.set(1.05, .62, 1); }
  if (face === 9) { smile.scale.set(1.5, 1.25, 1); }
  const curls = hairstyle === 3 ? 7 : 4; for (let i = 0; i < curls; i++) ball(body, c.hair, -.38 + i * (hairstyle === 3 ? .125 : .23), 1.86 + Math.sin(i) * .045, .19, hairstyle === 3 ? .18 : .16, .18, .2);
  if (hairstyle === 5) for (const side of [-1, 1]) ball(body, c.hair, side * .38, 2.05, -.02, .26);
  if (outfit === 5) { cylinder(body, o.color, 0, 1.97, 0, .65, .65, .08); mesh(new T.ConeGeometry(.46, .75, 12), o.color, 0, 2.32, 0, body); }
  if (outfit === 7) { cylinder(body, o.accent, 0, 2.02, 0, .33, .35, .2, 6); ball(body, 0xe781a5, 0, 2.15, .28, .13); }
  if (outfitLevel >= 1) {
    const border = mesh(new T.TorusGeometry(outfit > 2 ? .5 : .4, .045, 5, 24), o.accent, 0, .25, 0, body); border.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) ball(body, o.accent, -.2 + i * .2, .59, .37, .045);
  }
  if (outfitLevel >= 2) {
    const halo = new T.Group(); body.add(halo); g.userData.sparkles = halo;
    for (let i = 0; i < 7; i++) mesh(new T.OctahedronGeometry(.065), o.accent, Math.cos(i * .9) * .8, .6 + (i % 3) * .45, Math.sin(i * .9) * .8, halo);
  }
  const w = new T.Group(); w.position.set(.62, .63, .12); w.rotation.z = -.28; body.add(w);
  g.userData.weapon = w;
  cylinder(w, 0x8a6044, 0, .26, 0, .055, .065, .8, 8);
  if (weapon === 0) { const blade = box(w, WEAPONS[weapon].color, 0, .63, 0, .15, .52, .09); blade.rotation.z = -.08; box(w, o.accent, 0, .36, 0, .34, .07, .13); }
  if (weapon === 1) { cylinder(w, 0x89552f, 0, .74, 0, .3, .33, .36); ball(w, 0xc7985c, 0, .68, 0, .35, .3, .3); }
  if (weapon === 2) { const fan = mesh(new T.CircleGeometry(.43, 12, 0, Math.PI), 0xb8cbff, 0, .63, .05, w); (fan.material as T.Material).side = T.DoubleSide; for (let i = 0; i < 5; i++) { const rib = box(w, 0xffe3a2, 0, .69, .07, .024, .55, .02); rib.rotation.z = (i - 2) * .5; } }
  if (weapon === 3) { mesh(new T.OctahedronGeometry(.28), 0xffdd72, 0, .94, 0, w); ball(w, 0xf4a4d3, 0, .94, 0, .14); }
  if (weapon === 4) { const blade = mesh(new T.ConeGeometry(.16, .58, 6), WEAPONS[weapon].color, 0, .75, 0, w); blade.rotation.z = Math.PI; ball(w, 0xffd0d8, 0, 1.02, 0, .17); }
  if (weapon === 5) { const head = box(w, WEAPONS[weapon].color, 0, .82, 0, .62, .28, .18); head.rotation.z = -.12; for (const side of [-1, 1]) ball(w, 0x403629, side * .2, .87, .12, .045); }
  if (weapon === 6) { const can = ball(w, WEAPONS[weapon].color, 0, .73, 0, .3, .25, .22); can.rotation.z = .3; cylinder(w, 0xf4d56e, .25, .86, 0, .06, .09, .48, 8).rotation.z = -1.15; }
  if (weapon === 7) { mesh(new T.OctahedronGeometry(.34), WEAPONS[weapon].color, 0, .97, 0, w); for (let i = 0; i < 5; i++) ball(w, 0xfff0a4, Math.cos(i * 1.26) * .28, .97 + Math.sin(i * 1.26) * .28, 0, .08); }
  if (weapon === 8) { ball(w, 0xf6b3bd, 0, .95, 0, .29, .2, .12); cylinder(w, 0xfff0da, 0, 1.12, 0, .1, .12, .22, 8); for (let i = 0; i < 4; i++) ball(w, 0xe94e6b, -.18 + i * .12, 1.21 + (i % 2) * .06, .02, .065); }
  if (weapon === 9) { const blade = box(w, 0xeaf4ff, 0, .78, 0, .28, .72, .1); blade.rotation.z = -.12; for (const side of [-1, 1]) ball(w, 0xffffff, side * .2, 1.08, 0, .16); box(w, 0x9dc6df, 0, .4, 0, .48, .1, .16); }
  if (weapon === 10) { const leaf = mesh(new T.CircleGeometry(.34, 14), 0x78c780, 0, .98, .02, w); (leaf.material as T.Material).side = T.DoubleSide; cylinder(w, 0x97d081, 0, .7, 0, .04, .07, .78, 8); ball(w, 0xffef8e, 0, 1.02, .08, .08); }
  if (weapon === 11) { ball(w, 0xc99be8, 0, .98, 0, .3, .3, .18); for (let i = 0; i < 6; i++) ball(w, [0xff91ad, 0x8ed9e8, 0xffdc76][i % 3], Math.cos(i * 1.05) * .31, .98 + Math.sin(i * 1.05) * .31, 0, .095); }
  if (outfit === 8) { box(body, 0xf55f74, 0, .82, .39, .3, .34, .08); for (const side of [-1, 1]) box(body, 0xf8d9a0, side * .18, .98, .36, .06, .42, .04); }
  if (outfit === 9) { const brim = cylinder(body, o.accent, 0, 1.98, 0, .57, .57, .08); ball(body, o.color, 0, 2.12, 0, .38, .25, .34); }
  if (outfit === 10) { for (const side of [-1, 1]) { const ear = ball(body, o.accent, side * .27, 2.26, 0, .17, .55, .15); ear.rotation.z = side * -.16; } ball(body, 0xffffff, 0, .77, -.38, .22); }
  if (outfit === 11) { mesh(new T.SphereGeometry(.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), o.color, 0, 1.94, 0, body); ball(body, o.accent, 0, 2.23, 0, .16); box(body, o.accent, 0, .87, -.42, .52, .58, .18); }
  if (outfit === 12) { for (const side of [-1, 1]) { const ear = mesh(new T.ConeGeometry(.16, .43, 5), o.color, side * .3, 2.12, 0, body); ear.rotation.z = side * -.2; } ball(body, o.accent, 0, .72, .38, .2, .14, .05); }
  if (outfit === 13) { for (const side of [-1, 1]) ball(body, 0xffffff, side * .28, 2.05, 0, .25, .3, .22); for (let i = 0; i < 3; i++) ball(body, 0xffffff, -.22 + i * .22, .72, .4, .09); }
  if (outfit === 14) { for (const side of [-1, 1]) ball(body, 0xeef397, side * .25, 2.02, .03, .28, .18, .18); const cape = mesh(new T.CircleGeometry(.65, 16), 0x78bf70, 0, .82, -.31, body); cape.rotation.x = -.2; }
  if (outfit === 15) { for (const side of [-1, 1]) { const wing = mesh(new T.CircleGeometry(.38, 12), side < 0 ? 0xf7b6dc : 0xaedcf4, side * .42, 1, -.25, body); wing.scale.y = 1.5; } for (let i = 0; i < 3; i++) mesh(new T.OctahedronGeometry(.08), o.accent, -.2 + i * .2, .72, .41, body); }
  if (weaponLevel) for (let i = 0; i < weaponLevel; i++) ball(w, 0xffe891, 0, .3 + i * .16, .08, .06);
  return g;
}

export function makeMonster(type: number) {
  const g = new T.Group(), c = MONSTERS[type].color;
  ball(g, c, 0, .5, 0, .66, .57, .6);
  ball(g, c, -.4, .13, .22, .24, .15, .32); ball(g, c, .4, .13, .22, .24, .15, .32);
  if (type === 0) { const leaf = ball(g, 0x3f9861, -.13, 1.1, 0, .18, .36, .08); leaf.rotation.z = .6; const l2 = ball(g, 0x66b956, .13, 1.1, 0, .17, .3, .08); l2.rotation.z = -.6; }
  if (type === 1) { ball(g, 0xe86c83, 0, 1, -.02, .84, .34, .72); for (const [x, z] of [[-.35, .2], [.25, .35], [.1, -.3]]) ball(g, 0xffe9cc, x, 1.28, z, .12, .04, .1); }
  if (type === 2) for (const side of [-1, 1]) { ball(g, c, side * .26, 1.23, 0, .16, .49, .17); ball(g, 0xeeb8d1, side * .26, 1.26, .14, .075, .28, .03); }
  if (type === 3) { ball(g, 0x866043, 0, .96, 0, .7, .25, .63); cylinder(g, 0x866043, 0, 1.18, 0, .08, .1, .3); }
  for (const side of [-1, 1]) { ball(g, 0x314c40, side * .23, .62, .52, .055, .07, .035); ball(g, 0xf5a2ac, side * .38, .47, .48, .1, .045, .03); }
  ball(g, 0x805b54, 0, .44, .586, .055, .028, .016); return g;
}

// A friendly original village captain: warm bread-like round face, rosy cheeks and a tiny red cape.
function makeYeontae() {
  const g = new T.Group();
  cylinder(g, 0xd9464c, 0, .66, -.18, .5, .67, 1.15); // little cape
  cylinder(g, 0xf2d596, 0, .68, 0, .46, .58, .9);
  ball(g, 0xf0bd78, 0, 1.54, 0, .68, .62, .55);
  for (const side of [-1, 1]) { ball(g, 0xffffff, side * .22, 1.62, .49, .105, .125, .04); ball(g, 0x423d37, side * .22, 1.62, .535, .045, .06, .02); ball(g, 0xec7880, side * .42, 1.4, .48, .13, .07, .03); }
  const smile = mesh(new T.TorusGeometry(.085, .015, 5, 10, Math.PI), 0x8d5a4e, 0, 1.38, .53, g); smile.rotation.z = Math.PI;
  ball(g, 0xefd363, 0, 2.18, 0, .25, .13, .2); // cute star badge
  for (const side of [-1, 1]) { cylinder(g, 0xe5bc7f, side * .5, .7, 0, .13, .15, .55); ball(g, 0xf0bd78, side * .57, .45, .06, .14); }
  return g;
}

function makeRide(id: number) {
  const g = new T.Group(), ride = RIDES[id]; g.userData.rideModel = true;
  if (id === 0) {
    box(g, 0x73b7a3, 0, .34, 0, 1.25, .16, .58); cylinder(g, 0xf39a58, 0, .55, .1, .16, .3, .72, 10).rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) { const wheel = cylinder(g, 0x554b47, side * .48, .22, .08, .23, .23, .15, 12); wheel.rotation.z = Math.PI / 2; ball(g, 0xffd56c, side * .48, .22, .08, .08); }
  } else if (id === 1) {
    for (let i = 0; i < 7; i++) ball(g, 0xf5fbff, (i % 4 - 1.5) * .32, .55 + (i % 2) * .18, (Math.floor(i / 4) - .5) * .35, .42, .36, .38);
    ball(g, 0xdcebf1, 0, .72, .42, .48, .43, .42); for (const side of [-1, 1]) { ball(g, 0x394844, side * .16, .8, .78, .045, .06, .03); ball(g, 0xc0dce7, side * .3, 1.07, .43, .14, .24, .12); }
  } else if (id === 2) { // 도토리 붕붕이: 도토리 차체와 네 바퀴
    ball(g, 0x9a653d, 0, .63, 0, .68, .48, .62); cylinder(g, 0x6d4835, 0, 1.05, 0, .52, .62, .22, 12);
    box(g, 0xf2daa0, 0, .78, .04, .56, .08, .42);
    for (const side of [-1, 1]) for (const front of [-1, 1]) { const wheel = cylinder(g, 0x4c4650, side * .54, .25, front * .42, .19, .19, .16, 10); wheel.rotation.z = Math.PI / 2; ball(g, 0xffdc6c, side * .55, .25, front * .42, .065); }
    for (const side of [-1, 1]) ball(g, 0x493c35, side * .17, 1.04, .54, .045, .06, .025);
  } else if (id === 3) { // 무지개 사슴: 다리·뿔·꼬리가 있는 탈것
    ball(g, 0x82cfb2, 0, .72, 0, .76, .5, .56); ball(g, 0x9ee5d3, 0, 1.08, .58, .39, .38, .42);
    for (const side of [-1, 1]) { for (const z of [-.34, .34]) cylinder(g, 0x6a9f79, side * .48, .35, z, .07, .09, .56, 7); ball(g, 0x414a42, side * .13, 1.16, .94, .043, .06, .025); const ear = ball(g, 0xc1a5ee, side * .28, 1.45, .52, .11, .28, .09); ear.rotation.z = side * -.28; }
    for (const side of [-1, 1]) { const antler = cylinder(g, 0xffd77d, side * .18, 1.55, .53, .025, .04, .42, 6); antler.rotation.z = side * -.24; }
    ball(g, 0xff8fb4, 0, .98, -.58, .17, .18, .32);
  } else if (id === 4) { // 별빛 페가수스: 말 실루엣과 깃털 날개
    ball(g, 0xc9b5ef, 0, .78, 0, .78, .48, .58); ball(g, 0xd9cefa, 0, 1.16, .55, .4, .4, .42);
    for (const side of [-1, 1]) { for (const z of [-.34, .34]) cylinder(g, 0x8f79c7, side * .5, .35, z, .065, .08, .62, 7); const wing = mesh(new T.CircleGeometry(.58, 12), side < 0 ? 0xf7d3ee : 0xc6e5ff, side * .64, 1.02, -.04, g); wing.scale.y = 1.45; wing.rotation.z = side * -.62; wing.userData.rideWing = side; ball(g, 0x45405e, side * .14, 1.23, .92, .045, .06, .025); }
    for (const side of [-1, 1]) { const ear = ball(g, 0xf7e9ff, side * .25, 1.48, .57, .09, .25, .07); ear.rotation.z = side * -.18; }
    for (let i = 0; i < 4; i++) ball(g, 0xffef9a, 0, .9 + i * .12, -.5 - i * .18, .16 - i * .02);
  } else if (id === 5) { // 솜사탕 열기구: 커다란 풍선과 바구니
    ball(g, 0xf2a9cf, 0, 1.5, 0, .76, .86, .76); ball(g, 0xffd9e9, -.38, 1.65, .22, .33); ball(g, 0xbce6fa, .38, 1.55, .22, .3);
    box(g, 0xa8754e, 0, .46, 0, .58, .28, .48); for (const side of [-1, 1]) for (const z of [-1, 1]) cylinder(g, 0xf4e2b2, side * .22, .94, z * .18, .025, .025, .88, 6);
    const propeller = box(g, 0xffe891, 0, .53, -.34, .85, .09, .08); propeller.userData.ridePropeller = true; box(g, 0xffe891, 0, .53, -.34, .09, .85, .08).userData.ridePropeller = true;
  } else if (id === 6) { // 달빛 아기용: 날개·뿔·긴 꼬리
    ball(g, 0x7898d8, 0, .72, 0, .82, .5, .62); ball(g, 0x91ace8, 0, 1.08, .58, .43, .42, .45);
    for (const side of [-1, 1]) { const wing = mesh(new T.ConeGeometry(.46, 1.2, 3), 0xaed0f0, side * .72, .96, -.1, g); wing.rotation.z = side * -.78; wing.rotation.x = -.18; wing.userData.rideWing = side; ball(g, 0x343c62, side * .14, 1.15, .96, .045, .06, .025); const horn = mesh(new T.ConeGeometry(.07, .28, 6), 0xffe69a, side * .17, 1.48, .61, g); horn.rotation.x = -.2; }
    for (let i = 0; i < 5; i++) ball(g, 0x9fc9f0, 0, .83 + i * .1, -.44 - i * .25, .18 - i * .025);
  } else { // 오로라 고래: 둥근 지느러미와 물결 꼬리
    ball(g, 0x65b9d8, 0, .82, 0, .94, .55, .72); ball(g, 0x89d7e6, 0, 1.02, .62, .5, .44, .44); ball(g, 0xe8f9ff, 0, .72, .5, .33, .22, .1);
    for (const side of [-1, 1]) { const fin = ball(g, 0x86d5e7, side * .8, .67, -.05, .42, .13, .34); fin.rotation.z = side * .48; ball(g, 0x354662, side * .18, 1.1, .94, .045, .065, .025); const tail = ball(g, 0x9fe6e5, side * .3, .88, -.78, .28, .1, .34); tail.rotation.z = side * .48; }
    for (let i = 0; i < 3; i++) ball(g, 0xb1f2db, -.18 + i * .18, 1.43 + Math.sin(i) * .06, .02, .08, .2, .07);
  }
  // 모든 탈것에 같은 모험 안장을 더해, 캐릭터가 자연스럽게 타고 있다는 느낌을 만듭니다.
  if (id !== 5) { box(g, 0x8d6046, 0, .92, -.05, .5, .12, .42); ball(g, 0xffd978, 0, .98, .12, .09); }
  if (ride.flying) { const glow = mesh(new T.TorusGeometry(.42, .025, 5, 16), 0xffec9f, 0, .25, 0, g); glow.rotation.x = Math.PI / 2; glow.userData.rideGlow = true; }
  return g;
}

function makePet(id: number) {
  const g = new T.Group(), pet = PETS[id];
  ball(g, pet.color, 0, .32, 0, .34, .29, .35); ball(g, pet.color, 0, .57, .18, .28, .27, .25);
  for (const side of [-1, 1]) { ball(g, 0x35423e, side * .1, .61, .4, .035, .05, .02); ball(g, 0xf3a6b5, side * .19, .51, .38, .055, .03, .02); }
  if (id === 0) for (const side of [-1, 1]) ball(g, pet.color, side * .2, .76, .1, .12);
  if (id === 1) for (const side of [-1, 1]) ball(g, pet.color, side * .13, .92, .12, .09, .36, .09);
  if (id === 2) for (const side of [-1, 1]) { const ear = mesh(new T.ConeGeometry(.1, .3, 5), pet.color, side * .16, .86, .13, g); ear.rotation.z = side * -.15; }
  if (id === 3) { for (const side of [-1, 1]) ball(g, 0xf1d38b, side * .13, .62, .41, .08, .1, .025); for (const side of [-1, 1]) { const wing = ball(g, 0xc5addb, side * .32, .4, -.02, .2, .28, .08); wing.rotation.z = side * .35; wing.userData.petWing = side; } }
  if (id === 4) { for (const side of [-1, 1]) mesh(new T.ConeGeometry(.08, .24, 5), 0xd5ef9a, side * .14, .86, .12, g); for (let i = 0; i < 3; i++) ball(g, 0xd5ef9a, 0, .42 + i * .09, -.35 - i * .13, .09 - i * .015); }
  // Original cozy-fantasy companion details: a tiny gem collar, travel pouch and glowing charm.
  const collar = mesh(new T.TorusGeometry(.2, .025, 5, 16), 0xf4d478, 0, .48, .18, g); collar.rotation.x = Math.PI / 2;
  box(g, 0x9b7653, -.3, .34, -.08, .18, .23, .1); const charm = mesh(new T.OctahedronGeometry(.065), id > 2 ? 0xbbeeff : 0xffd788, 0, .38, .43, g); charm.userData.petCharm = true;
  g.position.set(-1.05, .02, -.7); g.userData.petModel = true; g.userData.petBody = g.children[0]; return g;
}

export class World {
  scene = new T.Scene(); renderer: T.WebGLRenderer; camera: T.OrthographicCamera;
  player = new T.Group(); private entities: Entity[] = []; private coins: { mesh: T.Group; id: number; y: number }[] = [];
  private colliders: { x: number; z: number; r: number; id?: string }[] = []; private platforms = stagePlatforms(0); stage = 0;
  private keys = new Set<string>(); private stick = { x: 0, z: 0 }; private clock = new T.Clock(); private time = 0; private vy = 0; private grounded = true;
  private particles: { mesh: T.Mesh; v: T.Vector3; life: number }[] = []; private lastSafe = new T.Vector3(0, 0, 8); private follow = new T.Vector3(0, 0, 1);
  private sun: T.DirectionalLight; private labelLayer: HTMLDivElement; private selectedId: string | null = null;
  private swingUntil = 0; private rideIndex = -1; private petIndex = -1; private petModel: T.Group | null = null; private animationRunning = false;
  private rideAnimated: T.Object3D[] = []; private butterflies: T.Object3D[] = [];
  private tempProjection = new T.Vector3(); private tempTarget = new T.Vector3(); private tempWorld = new T.Vector3(); private cameraTarget = new T.Vector3();
  active = false; paused = true; onCollect = (_id: number) => {}; onInteract = (_id: string) => {}; onAttack = (_id: string | null) => {}; onNear = (_name: string | null, _id: string | null) => {}; onJump = () => {}; onRescue = () => {};
  constructor(private container: HTMLElement) {
    this.scene.background = new T.Color(0xc5e5d4); this.scene.fog = new T.Fog(0xc5e5d4, 55, 105);
    const touchDevice = matchMedia('(pointer: coarse)').matches;
    this.renderer = new T.WebGLRenderer({ antialias: !touchDevice, alpha: false, powerPreference: 'high-performance' }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, touchDevice ? 1 : 1.25)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap; this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.35; container.append(this.renderer.domElement);
    this.camera = new T.OrthographicCamera(-18, 18, 14, -14, .1, 140);
    this.scene.add(new T.HemisphereLight(0xe9fbff, 0x6f9450, 2.2)); this.sun = new T.DirectionalLight(0xffefd2, 3.1); this.sun.position.set(-15, 30, 15); this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024); Object.assign(this.sun.shadow.camera, { left: -34, right: 34, top: 32, bottom: -30, far: 85 }); this.sun.shadow.normalBias = .06; this.scene.add(this.sun);
    this.labelLayer = document.createElement('div'); this.labelLayer.className = 'world-labels'; container.append(this.labelLayer);
    this.buildVillage(); this.setAvatar(0, 0, 0); this.player.position.set(0, 0, 8); this.scene.add(this.player);
    window.addEventListener('resize', () => { this.resize(); this.renderOnce(); }); this.resize();
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearInput(); this.syncAnimation(); });
    window.addEventListener('keydown', e => { if (!this.active || this.paused || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault(); this.keys.add(e.key.toLowerCase()); if (!e.repeat && e.code === 'Space') this.jump(); if (!e.repeat && e.key.toLowerCase() === 'e') this.interact(); if (!e.repeat && e.key.toLowerCase() === 'f') this.attack(); });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase())); window.addEventListener('blur', () => this.clearInput());
    this.renderOnce();
  }
  private buildVillage() {
    box(this.scene, 0x8cbc65, 0, -.55, 0, 51, 1.1, 41); box(this.scene, 0x719d55, 0, -1.3, 0, 50, .5, 40);
    // Main paths and circular village square.
    box(this.scene, 0xe4ce9f, 0, .015, 2, 3.8, .055, 34); box(this.scene, 0xe4ce9f, 0, .02, -3.8, 25, .06, 3.8); box(this.scene, 0xe4ce9f, 6, .018, 9, 15, .05, 3);
    cylinder(this.scene, 0xe9d6ad, 0, .04, 3, 4.3, 4.3, .07, 40);
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; cylinder(this.scene, 0xd0b98e, Math.cos(a) * 4.1, .085, 3 + Math.sin(a) * 4.1, .22, .22, .06, 8); }
    // Fountain and water with a clear boundary.
    cylinder(this.scene, 0xc8c9b0, -3.1, .32, 3, 1.05, 1.14, .65); cylinder(this.scene, 0x69c5cb, -3.1, .68, 3, .85, .85, .07); cylinder(this.scene, 0xf3e6c4, -3.1, 1, 3, .19, .27, .9); ball(this.scene, 0xb4e7e4, -3.1, 1.53, 3, .29);
    this.colliders.push({ x: -3.1, z: 3, r: 1.3 });
    box(this.scene, 0xe5d29f, 19, .03, 8, 8.6, .1, 11.5); box(this.scene, 0x59b9bf, 19, .1, 8, 7.5, .08, 10.5);
    for (let i = 0; i < 5; i++) { cylinder(this.scene, 0x72ad63, 17 + i % 2 * 3, .16, 4.5 + i * 1.5, .42, .42, .02, 12); ball(this.scene, 0xf0b6ce, 17 + i % 2 * 3, .24, 4.5 + i * 1.5, .14, .12, .14); }
    this.platforms.forEach(p => { box(this.scene, 0xa8a88c, p.x, p.h / 2, p.z, p.w, p.h, p.d); box(this.scene, 0xcfe298, p.x, p.h + .02, p.z, p.w + .05, .08, p.d + .05); });
    this.house(-9, -8, 0x659c91, 0xf6e5bd); this.house(9, -8, 0xd995a7, 0xffe9ce);
    // Original cozy life-sim details: a tiny farm, mailbox, picnic bench and lanterns.
    box(this.scene, 0x9d754d, -17, .05, -10, 6.5, .12, 4.5);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) { cylinder(this.scene, 0x4c9555, -19.2 + col * 1.1, .28, -11.2 + row * 1.15, .035, .055, .5, 5); ball(this.scene, [0xf28fa8, 0xf4d66a, 0x9dcfe5][row], -19.2 + col * 1.1, .55, -11.2 + row * 1.15, .13); }
    for (let i = 0; i < 7; i++) { box(this.scene, 0xe4c18c, -20.4 + i * 1.1, .42, -12.75, 1, .12, .12); cylinder(this.scene, 0xba8a58, -20.9 + i * 1.1, .4, -12.75, .045, .055, .8, 6); }
    box(this.scene, 0x8f6949, 5.5, .55, 5.5, 2.2, .18, .65); box(this.scene, 0x8f6949, 5.5, .95, 5.75, 2.2, .18, .18); for (const x of [4.7, 6.3]) cylinder(this.scene, 0x76523d, x, .3, 5.5, .08, .08, .6, 6);
    box(this.scene, 0xe59687, -6.1, 1.1, -4.9, .72, .95, .5); cylinder(this.scene, 0x81624b, -6.1, .45, -4.9, .09, .11, .9, 7); box(this.scene, 0xffe6a3, -5.85, 1.1, -4.62, .12, .12, .04);
    for (const [x, z] of [[-5, 11], [6, 11], [-5, -1], [6, -1]]) { cylinder(this.scene, 0x755a43, x, .65, z, .06, .08, 1.3, 7); ball(this.scene, 0xffe99a, x, 1.35, z, .22); }
    // Pastel bunting, tiny mushrooms and butterflies make the square feel festive.
    for (let i = 0; i < 9; i++) { const flag = mesh(new T.ConeGeometry(.18, .38, 3), [0xf6a7bc, 0xf5d37b, 0x92d4cc][i % 3], -5 + i * 1.25, 2.3 + Math.sin(i * .7) * .12, -2.2, this.scene); flag.rotation.z = Math.PI; }
    for (const [x, z, c] of [[-4, 7, 0xf58da6], [5, 7, 0xffd66b], [-12, 1, 0xa9cceb], [13, 3, 0xd8a3e6]] as const) { cylinder(this.scene, 0xffeed6, x, .18, z, .08, .12, .36, 7); ball(this.scene, c, x, .42, z, .28, .16, .25); }
    for (let i = 0; i < 8; i++) { const x = -8 + i * 2.2, z = 7 + Math.sin(i) * 1.8; if (Math.hypot(x - 10.5, z - 13.5) < 7) continue; const g = new T.Group(); g.position.set(x, .9 + i % 2 * .35, z); this.scene.add(g); ball(g, i % 2 ? 0xf5a9ca : 0x9bd8e0, -.1, 0, 0, .12, .08, .03); ball(g, i % 2 ? 0xf5a9ca : 0x9bd8e0, .1, 0, 0, .12, .08, .03); cylinder(g, 0x75543e, 0, 0, 0, .025, .025, .16, 5); this.butterflies.push(g); }
    // Arena: a lavender garden, not a threatening dungeon.
    cylinder(this.scene, 0xc7bdd8, 0, .08, -13, 4.3, 4.3, .14, 40); cylinder(this.scene, 0xe1d9e7, 0, .17, -13, 3.65, 3.65, .07, 40);
    const ring = mesh(new T.TorusGeometry(3.25, .055, 6, 48), 0xab96c4, 0, .22, -13, this.scene); ring.rotation.x = Math.PI / 2;
    for (const x of [-4.3, 4.3]) { cylinder(this.scene, 0xaca4b6, x, 1, -14, .38, .48, 2); ball(this.scene, 0xfbe5a2, x, 2.15, -14, .42); }
    this.addEntity('guide', '연태쌤 · 마을 대장', 1.8, 3, makeYeontae());
    this.addEntity('weapon', '강지후 · 무기 상점', -8, -3.8, makeCharacter(1, 6, 1));
    this.addEntity('outfit', '오지후 · 의상 상점', 8, -3.8, makeCharacter(2, 4, 2));
    this.addEntity('ride', '나현이 · 라이딩 상점', 14, -5.5, makeCharacter(0, 10, 6));
    this.addEntity('pet', '윤준 · 펫 상점', 18.5, -3.5, makeCharacter(1, 12, 10));
    this.addEntity('beauty', '가영이 · 헤어와 성형', -15.5, -4.2, makeCharacter(2, 15, 2));
    this.addEntity('arena', '신비 · 대련장', 0, -9, makeCharacter(3, 5, 3));
    stageMonsters(0).forEach((m, i) => this.addEntity(`monster${i}`, MONSTERS[m.type].name, m.x, m.z, makeMonster(m.type)));
    this.addEntity('journey', '모험의 문 · 10개의 사냥터', 10.5, 13.5, this.gate(0x9e78c9));
    // Keep the walking areas clear; peripheral trees frame the miniature world.
    for (let i = 0; i < 48; i++) { const a = i * 2.39996, r = 17 + (i % 4) * 1.65; const x = Math.cos(a) * r, z = Math.sin(a) * r * .77; if ((x > 14 && z > 1) || Math.hypot(x - 10.5, z - 13.5) < 7 || Math.hypot(x - 18.5, z + 3.5) < 7 || (Math.abs(x) < 5 && z < -12)) continue; this.tree(x, z, .85 + (i % 3) * .16, i % 6 === 0); }
    stageTrees(0).forEach(({ x, z }, i) => { if (Math.hypot(x - 18.5, z + 3.5) >= 8) this.addChoppableTree(i, x, z, 1, i % 2 === 0); });
    for (let i = 0; i < 65; i++) { const x = Math.sin(i * 12.97) * 23, z = Math.cos(i * 4.67) * 18; if (Math.abs(x) < 3 || Math.hypot(x - 10.5, z - 13.5) < 7 || (z < -2 && z > -11) || (x > 5 && z > 2 && z < 14)) continue; for (let j = 0; j < 3; j++) { const fx = x + j * .14; cylinder(this.scene, 0x538c50, fx, .14, z, .025, .025, .3, 5); ball(this.scene, [0xffe8ae, 0xf4aec4, 0xeae3ff][i % 3], fx, .32, z, .1, .09, .1); } }
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { const x = side * 22, z = -15 + i * 4.7; cylinder(this.scene, 0xd4bb88, x, .5, z, .08, .09, 1, 8); box(this.scene, 0xe7d3a3, x, .65, z + 2, .12, .11, 4.7); }
    this.addBerries();
  }
  private gate(color = 0x9e78c9) {
    const g = new T.Group(), glow = new T.MeshBasicMaterial({ color: 0xf7ddff, transparent: true, opacity: .65 });
    const runeMat = new T.MeshBasicMaterial({ color: 0xffe5a3, transparent: true, opacity: .72, depthWrite: false });
    const auraMat = new T.MeshBasicMaterial({ color, transparent: true, opacity: .2, depthWrite: false, side: T.DoubleSide });
    const aura = new T.Mesh(new T.CircleGeometry(2.5, 48), auraMat); aura.rotation.x = -Math.PI / 2; aura.position.y = .035; aura.userData.gatePulse = true; g.add(aura);
    const rune = new T.Mesh(new T.TorusGeometry(2.18, .055, 8, 64), runeMat); rune.rotation.x = Math.PI / 2; rune.position.y = .085; rune.userData.gateRing = .38; g.add(rune);
    const runeInner = new T.Mesh(new T.TorusGeometry(1.72, .035, 8, 48), new T.MeshBasicMaterial({ color: 0xf7c5f1, transparent: true, opacity: .78, depthWrite: false })); runeInner.rotation.x = Math.PI / 2; runeInner.position.y = .095; runeInner.userData.gateRing = -.56; g.add(runeInner);
    cylinder(g, 0xd6bc80, 0, .04, 0, 1.85, 1.85, .08, 24);
    for (const side of [-1, 1]) {
      cylinder(g, 0xe5c99c, side * 1.35, 1.35, 0, .27, .35, 2.7, 8); cylinder(g, color, side * 1.35, 2.7, 0, .36, .43, .2, 8); ball(g, 0xffdd91, side * 1.35, 3.02, 0, .25);
      for (let i = 0; i < 3; i++) ball(g, [0xf3a9ca, 0xb7db9b, 0xb5d8ec][i], side * (1.65 + i * .11), .25 + i * .18, .05, .16, .08, .13);
    }
    const arch = mesh(new T.TorusGeometry(1.34, .19, 8, 24, Math.PI), color, 0, 2.66, 0, g); arch.rotation.z = 0;
    const inner = new T.Mesh(new T.CircleGeometry(1.17, 30), glow); inner.position.set(0, 1.46, -.04); g.add(inner);
    const halo = new T.Mesh(new T.TorusGeometry(1.02, .045, 8, 48), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .78, depthWrite: false })); halo.position.set(0, 1.46, .02); halo.userData.gateHalo = true; g.add(halo);
    const beam = new T.Mesh(new T.CylinderGeometry(.72, 1.12, 2.7, 24, 1, true), new T.MeshBasicMaterial({ color: 0xecc9ff, transparent: true, opacity: .12, side: T.DoubleSide, depthWrite: false })); beam.position.y = 1.4; beam.userData.gateBeam = true; g.add(beam);
    const star = mesh(new T.OctahedronGeometry(.3), 0xffe18a, 0, 3.72, 0, g); star.rotation.z = .4;
    for (let i = 0; i < 7; i++) { const a = i * .89; const sparkle = mesh(new T.OctahedronGeometry(.075 + (i % 2) * .035), i % 2 ? 0xffdc91 : 0xf8c8e9, Math.cos(a) * 1.75, 1.1 + (i % 3) * .62, Math.sin(a) * .25, g); sparkle.userData.sparkle = true; }
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, orb = ball(g, [0xffe49b, 0xf7b7dc, 0xaedcf1][i % 3], Math.cos(a) * 2.05, .35 + i % 4 * .52, Math.sin(a) * .42, .065 + i % 2 * .025); Object.assign(orb.userData, { gateOrb: true, gateAngle: a, gateRadius: 1.72 + i % 3 * .2, gateBaseY: .35 + i % 4 * .52, gateSpeed: .48 + i % 4 * .09 }); }
    const light = new T.PointLight(0xe6c8ff, 6, 7); light.position.set(0, 1.7, .4); g.add(light);
    g.userData.magicGate = true; return g;
  }
  private addBerries() { stageBerries(this.stage).forEach(({ x, z }, id) => { const p = this.platforms.find(t => Math.abs(t.x - x) < 1 && Math.abs(t.z - z) < 1); const g = new T.Group(); ball(g, 0xf77591, -.09, 0, 0, .21, .24, .19); ball(g, 0xdd496f, .1, .015, 0, .2, .23, .19); const leaf = ball(g, 0x4a9853, 0, .26, 0, .18, .055, .09); leaf.rotation.z = .45; const y = (p?.h ?? 0) + .68; g.position.set(x, y, z); this.scene.add(g); this.coins.push({ mesh: g, id, y }); }); }
  private buildHunt(stage: number) {
    const spec = STAGES[stage - 1], size = stageSize(stage); this.platforms = stagePlatforms(stage); this.scene.background = new T.Color(spec.sky); this.scene.fog = new T.Fog(spec.sky, 55, 120);
    box(this.scene, spec.ground, 0, -.55, 0, size.x * 2, 1.1, size.z * 2); box(this.scene, 0x708f71, 0, -1.3, 0, size.x * 2 - 1, .5, size.z * 2 - 1);
    box(this.scene, spec.accent, 0, .02, 0, 3.8, .06, size.z * 2 - 5); for (const z of [14, 0, -15]) box(this.scene, spec.accent, 0, .025, z, size.x * 2 - 10, .06, 2.6);
    this.platforms.forEach(p => { box(this.scene, 0xa8a88c, p.x, p.h / 2, p.z, p.w, p.h, p.d); box(this.scene, spec.accent, p.x, p.h + .02, p.z, p.w + .05, .08, p.d + .05); });
    this.addEntity('home', '베리숲 마을로 돌아가기', 0, size.z - 5, this.gate(0x6eb7a1)); this.addEntity('next', stage === 10 ? '마지막 축하문' : `다음 길 · ${STAGES[stage].name}`, 0, -size.z + 5, this.gate(0xc087d2));
    stageMonsters(stage).forEach((m, i) => this.addEntity(`monster${i}`, `${MONSTERS[m.type].name} · ${i + 1}`, m.x, m.z, makeMonster(m.type)));
    for (let i = 0; i < 55; i++) { const x = Math.sin(i * 2.399 + stage) * (size.x - 4), z = Math.cos(i * 1.73 + stage) * (size.z - 4); if (Math.abs(x) < 4 || [14, 0, -15].some(v => Math.abs(z - v) < 2.5)) continue; this.tree(x, z, .8 + i % 3 * .2, spec.theme === 'blossom', spec.foliage); }
    stageTrees(stage).forEach(({ x, z }, i) => this.addChoppableTree(i, x, z, .92 + (i % 3) * .08, spec.theme === 'blossom', spec.foliage));
    for (const z of [20, 6, -9, -23]) { box(this.scene, 0xb98d58, -3.4, .65, z, .12, 1.25, .12); box(this.scene, 0xe6ca8f, -2.8, 1.05, z, 1.35, .56, .12); ball(this.scene, 0xffe98d, -3.35, 1.36, z, .1); }
    for (let i = 0; i < 30; i++) { const x = Math.sin(i * 5.7 + stage) * (size.x - 7), z = Math.cos(i * 3.3 + stage) * (size.z - 8); cylinder(this.scene, 0x5c9a59, x, .12, z, .025, .025, .24, 5); ball(this.scene, [0xffb3c7, 0xffdf82, 0xc5b2ef, 0xa9dfe1][i % 4], x, .29, z, .1, .08, .1); }
    for (let i = 0; i < 14; i++) { const g = new T.Group(); g.position.set((i % 2 ? 1 : -1) * (size.x - 5), 0, size.z - 7 - Math.floor(i / 2) * 8); this.scene.add(g); if (spec.theme === 'crystal') { for (let j = 0; j < 3; j++) { const m = mesh(new T.OctahedronGeometry(.65), [0x9bade6, 0xc3a0df, 0x9bd6d4][j], j * .55 - .55, 1.3, 0, g); m.scale.y = 2 + j * .3; } } else if (spec.theme === 'mushroom') { cylinder(g, 0xf4e4cb, 0, .9, 0, .4, .6, 1.8); ball(g, 0xda8e9a, 0, 2, 0, 1.8, .65, 1.5); } else { for (let j = 0; j < 5; j++) ball(g, spec.foliage, Math.cos(j * 1.26), .7, Math.sin(j * 1.26), .4, .14, .4); } }
    this.addBerries();
  }
  loadStage(s: Save, fresh = false) {
    this.clearInput(); this.selectedId = null; this.onNear(null, null); this.stage = s.journey.stage; this.entities.forEach(e => e.label.remove()); this.entities = []; this.coins = []; this.colliders = [];
    for (const child of [...this.scene.children]) if (child !== this.player && !(child instanceof T.Light)) this.scene.remove(child);
    this.scene.background = new T.Color(0xc5e5d4); this.scene.fog = new T.Fog(0xc5e5d4, 55, 105); this.platforms = stagePlatforms(this.stage);
    if (this.stage === 0) this.buildVillage(); else this.buildHunt(this.stage);
    const map = s.journey.maps[this.stage]; this.coins.forEach(c => c.mesh.visible = !map.berries.includes(c.id)); this.entities.forEach(e => { if (e.id.startsWith('monster')) e.mesh.visible = !map.monsters.includes(Number(e.id.slice(7))); if (e.id.startsWith('tree')) e.mesh.visible = !map.trees.includes(Number(e.id.slice(4))); });
    const spawn = this.stage === 0 ? { x: 0, z: 8 } : { x: 0, z: stageSize(this.stage).z - 9 }; const p = fresh ? spawn : s.position; this.player.position.set(p.x, 0, p.z); this.lastSafe.copy(this.player.position); this.follow.copy(this.player.position);
  }
  private house(x: number, z: number, roof: number, wall: number) {
    const g = new T.Group(); g.position.set(x, 0, z); this.scene.add(g);
    cylinder(g, 0xcebe96, 0, .22, 0, 2.65, 2.85, .44, 8); cylinder(g, wall, 0, 1.65, 0, 2.35, 2.45, 2.9, 12);
    const r = mesh(new T.ConeGeometry(3.25, 2.2, 8), roof, 0, 4.15, 0, g); r.rotation.y = Math.PI / 8;
    cylinder(g, roof, 0, 3.13, 0, 3.1, 3.15, .22, 8); box(g, 0x836343, 0, 1.13, 2.23, 1.05, 1.95, .15); ball(g, 0xfbd180, .3, 1.12, 2.36, .07);
    for (const sign of [-1, 1]) { box(g, 0xb19a6a, sign * 1.4, 1.9, 1.94, .84, .88, .1); box(g, 0xffdc94, sign * 1.4, 1.9, 2.01, .63, .65, .08); box(g, wall, sign * 1.4, 1.9, 2.07, .06, .66, .08); }
    cylinder(g, 0xa47753, 1.3, 4.7, -.8, .3, .35, 1.5, 8); ball(g, 0xf1f1dc, 1.3, 5.8, -.8, .4, .24, .34);
    this.colliders.push({ x, z, r: 2.7 });
  }
  private tree(x: number, z: number, scale: number, pink: boolean, foliage?: number) {
    const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); this.scene.add(g); cylinder(g, 0x94724e, 0, 1, 0, .19, .32, 2, 8);
    ball(g, foliage ?? (pink ? 0xe6a2ad : 0x63a56b), 0, 2.55, 0, 1.55, 1.5, 1.38); ball(g, foliage ?? (pink ? 0xf1b8bb : 0x88bd77), -.5, 3.35, 0, 1.12, 1.12, 1); ball(g, foliage ?? (pink ? 0xf5c9c7 : 0xa0cd7e), .5, 3.25, .45, .8, .83, .8); this.colliders.push({ x, z, r: .5 });
  }
  private addChoppableTree(id: number, x: number, z: number, scale: number, pink: boolean, foliage?: number) {
    const g = new T.Group(); g.scale.setScalar(scale); cylinder(g, 0x94724e, 0, 1, 0, .19, .32, 2, 8);
    ball(g, foliage ?? (pink ? 0xe6a2ad : 0x63a56b), 0, 2.55, 0, 1.55, 1.5, 1.38); ball(g, foliage ?? (pink ? 0xf1b8bb : 0x88bd77), -.5, 3.35, 0, 1.12, 1.12, 1); ball(g, foliage ?? (pink ? 0xf5c9c7 : 0xa0cd7e), .5, 3.25, .45, .8, .83, .8);
    g.userData.hp = 7; this.addEntity(`tree${id}`, '베리나무 · 베기', x, z, g); this.colliders.push({ x, z, r: .5, id: `tree${id}` });
  }
  private addEntity(id: string, name: string, x: number, z: number, model: T.Group) {
    model.position.set(x, 0, z); this.scene.add(model);
    const label = document.createElement('div'); label.className = `entity-label ${id.startsWith('monster') ? 'monster-label' : ''}`; label.textContent = name; this.labelLayer.append(label);
    this.entities.push({ id, name, x, z, mesh: model, label });
  }
  setAvatar(character: number, outfit: number, weapon: number, outfitLevel = 0, weaponLevel = 0, ride = -1, pet = -1, hairstyle = 0, face = 0) {
    const position = this.player.position.clone(), rotation = this.player.rotation.y;
    this.scene.remove(this.player); this.disposeModel(this.player); this.player = makeCharacter(character, outfit, weapon, outfitLevel, weaponLevel, hairstyle, face); this.player.position.copy(position); this.player.rotation.y = rotation; this.scene.add(this.player);
    this.rideIndex = ride; this.petIndex = pet; this.petModel = null; this.rideAnimated = [];
    if (ride >= 0 && RIDES[ride]) { const body = this.player.userData.body as T.Group; body.position.y = RIDES[ride].flying ? 1.03 : .78; const rideModel = makeRide(ride); rideModel.traverse(o => { if (o.userData.rideWing || o.userData.ridePropeller || o.userData.rideGlow) this.rideAnimated.push(o); }); this.player.add(rideModel); }
    if (pet >= 0 && PETS[pet]) { this.petModel = makePet(pet); this.player.add(this.petModel); }
  }
  private disposeModel(g: T.Group) { g.traverse(o => { if (o instanceof T.Mesh && !sharedGeometries.has(o.geometry)) o.geometry.dispose(); }); }
  setActive(active: boolean) { this.active = active; this.paused = !active; if (!active) this.clearInput(); this.syncAnimation(); }
  setPaused(paused: boolean) { this.paused = paused; if (paused) this.clearInput(); this.syncAnimation(); }
  private syncAnimation() {
    const shouldRun = this.active && !this.paused && !document.hidden;
    if (shouldRun && !this.animationRunning) { this.animationRunning = true; this.clock.start(); this.renderer.setAnimationLoop(() => this.frame()); }
    else if (!shouldRun && this.animationRunning) { this.animationRunning = false; this.renderer.setAnimationLoop(null); if (!document.hidden) this.renderOnce(); }
  }
  private renderOnce() { if (!document.hidden) this.renderer.render(this.scene, this.camera); }
  restore(s: Save) { this.setAvatar(s.character, s.outfit, s.weapon, s.outfits[s.outfit], s.weapons[s.weapon], s.ride, s.pet, s.hairstyle, s.face); this.loadStage(s); this.quality(s.settings.lowQuality); }
  quality(low: boolean) { const touchDevice = matchMedia('(pointer: coarse)').matches; this.renderer.setPixelRatio(Math.min(devicePixelRatio, low || touchDevice ? 1 : 1.25)); this.renderer.shadowMap.enabled = !low; this.sun.castShadow = !low; }
  clearInput() { this.keys.clear(); this.stick = { x: 0, z: 0 }; }
  moveStick(x: number, z: number) { this.stick = { x, z }; }
  jump() { if (this.active && !this.paused && this.grounded) { this.vy = 7.4; this.grounded = false; this.onJump(); } }
  interact() { if (this.active && !this.paused && this.selectedId) this.onInteract(this.selectedId); }
  attack() { if (!this.active || this.paused) return; this.swingUntil = this.time + .28; this.onAttack(this.selectedId?.startsWith('tree') ? this.selectedId : null); }
  hitTree(id: string, damage: number) {
    const e = this.entities.find(e => e.id === id && e.mesh.visible); if (!e || !id.startsWith('tree')) return null;
    e.mesh.userData.hp = Math.max(0, Number(e.mesh.userData.hp) - damage); e.mesh.userData.shakeUntil = this.time + .28; this.burst(e.mesh.position, 0xc5e88b, 5);
    if (e.mesh.userData.hp === 0) { e.mesh.visible = false; e.label.hidden = true; cylinder(this.scene, 0xa77b50, e.x, .2, e.z, .32, .43, .4, 9); this.burst(e.mesh.position, 0xffa1b8, 12); this.selectedId = null; this.onNear(null, null); }
    return { fell: e.mesh.userData.hp === 0, remaining: e.mesh.userData.hp as number };
  }
  defeat(id: string) { const e = this.entities.find(e => e.id === id); if (e) { const monster = stageMonsters(this.stage)[Number(id.slice(7))]; this.burst(e.mesh.position, MONSTERS[monster.type].color); e.mesh.visible = false; } }
  celebrate() { this.burst(this.player.position, 0xffd371, 30); }
  private burst(pos: T.Vector3, color: number, count = 14) { for (let i = 0; i < count; i++) { const m = mesh(particleGeometry, color, pos.x, pos.y + .9, pos.z, this.scene); this.particles.push({ mesh: m, v: new T.Vector3((Math.random() - .5) * 5, 2 + Math.random() * 3, (Math.random() - .5) * 5), life: 1 }); } }
  private water(x: number, z: number) { return x > 15.25 && x < 22.75 && z > 2.75 && z < 13.25; }
  private resize() { const w = this.container.clientWidth, h = this.container.clientHeight; const span = w < 700 ? 13 : 14.5; this.camera.left = -span * w / h; this.camera.right = span * w / h; this.camera.top = span; this.camera.bottom = -span; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); }
  private frame() {
    if (document.hidden || this.paused || !this.active) return;
    const dt = Math.min(this.clock.getDelta(), .04); this.time += dt;
    const p = this.player.position;
    if (this.active && !this.paused) {
      let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')) + this.stick.x;
      let dz = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup')) + this.stick.z;
      const n = Math.hypot(dx, dz); if (n > 1) { dx /= n; dz /= n; }
      const ride = this.rideIndex >= 0 ? RIDES[this.rideIndex] : null, flying = !!ride?.flying, speed = 6.5 * (ride?.speed ?? 1);
      const vx = (dx * .8 + dz * .6) * speed, vz = (-dx * .6 + dz * .8) * speed;
      const allowed = (x: number, z: number) => flying || (!this.colliders.some(c => (!c.id || this.entities.find(e => e.id === c.id)?.mesh.visible) && Math.hypot(x - c.x, z - c.z) < c.r + .32) && !this.platforms.some(t => Math.abs(x - t.x) < t.w / 2 + .2 && Math.abs(z - t.z) < t.d / 2 + .2 && p.y < t.h - .13));
      if (allowed(p.x + vx * dt, p.z)) p.x += vx * dt; if (allowed(p.x, p.z + vz * dt)) p.z += vz * dt;
      if (n > .05) { this.player.rotation.y = Math.atan2(vx, vz); this.player.userData.feet?.forEach((f: T.Mesh, i: number) => { f.position.y = .18 + Math.max(0, Math.sin(this.time * 13 + i * Math.PI)) * .12; }); }
      const platform = flying ? undefined : this.platforms.find(t => Math.abs(p.x - t.x) < t.w / 2 + .15 && Math.abs(p.z - t.z) < t.d / 2 + .15); const floor = flying ? 1.65 + Math.sin(this.time * 2.2) * .08 : platform?.h ?? 0;
      this.vy -= 18 * dt; p.y += this.vy * dt; if (p.y <= floor && this.vy <= 0) { p.y = floor; this.vy = 0; this.grounded = true; } else this.grounded = false;
      const bounds = stageSize(this.stage);
      if (Math.abs(p.x) > bounds.x - .5 || Math.abs(p.z) > bounds.z - .5 || (!flying && this.water(p.x, p.z) && p.y <= .2)) { p.copy(this.lastSafe); this.vy = 0; this.onRescue(); }
      else if (this.grounded && (flying || !this.water(p.x, p.z)) && Math.abs(p.x) < bounds.x - 2 && Math.abs(p.z) < bounds.z - 2) this.lastSafe.copy(p);
      for (const c of this.coins) if (c.mesh.visible && p.distanceTo(c.mesh.position) < 1) { c.mesh.visible = false; this.burst(c.mesh.position, 0xff9fb4, 6); this.onCollect(c.id); }
      if (this.petModel && this.petIndex >= 0) {
        let target: (typeof this.coins)[number] | undefined, best: number = PETS[this.petIndex].radius;
        for (const c of this.coins) { if (!c.mesh.visible) continue; const d = Math.hypot(p.x - c.mesh.position.x, p.z - c.mesh.position.z); if (d < best) { target = c; best = d; } }
        this.player.updateWorldMatrix(true, false);
        if (target) { this.tempTarget.copy(target.mesh.position); this.player.worldToLocal(this.tempTarget); this.tempTarget.y = .22; }
        else this.tempTarget.set(-1.05, .12, -.7);
        const turnX = this.tempTarget.x - this.petModel.position.x, turnZ = this.tempTarget.z - this.petModel.position.z;
        if (Math.hypot(turnX, turnZ) > .04) this.petModel.rotation.y = Math.atan2(turnX, turnZ);
        this.petModel.position.lerp(this.tempTarget, 1 - Math.exp(-dt * (target ? 3.8 : 2.6)));
        const petMoving = Math.hypot(turnX, turnZ) > .06;
        this.petModel.position.y = .02 + (petMoving ? Math.abs(Math.sin(this.time * 12)) * .11 : Math.sin(this.time * 2.4) * .025);
        const petBody = this.petModel.userData.petBody as T.Object3D | undefined;
        if (petBody) { petBody.scale.y = target && this.petModel.getWorldPosition(this.tempWorld).distanceTo(target.mesh.position) < .9 ? .78 + Math.abs(Math.sin(this.time * 13)) * .35 : petMoving ? .9 + Math.abs(Math.sin(this.time * 11)) * .15 : 1; }
        if (target && this.petModel.getWorldPosition(this.tempWorld).distanceTo(target.mesh.position) < .55 && target.mesh.visible) { target.mesh.visible = false; this.burst(target.mesh.position, 0xff9fb4, 6); this.onCollect(target.id); }
      }
    }
    for (const c of this.coins) { c.mesh.rotation.y += dt; c.mesh.position.y = c.y + Math.sin(this.time * 2.8 + c.mesh.position.x) * .12; }
    let near: Entity | undefined, distance = 2.8;
    for (const e of this.entities) {
      if (e.id.startsWith('monster')) { e.mesh.position.y = Math.max(0, Math.sin(this.time * 2 + e.x)) * .16; e.mesh.rotation.y = Math.sin(this.time * .5 + e.z) * .35; }
      if (e.id.startsWith('tree') && e.mesh.userData.shakeUntil > this.time) e.mesh.rotation.z = Math.sin(this.time * 55) * .08; else if (e.id.startsWith('tree')) e.mesh.rotation.z = 0;
      if (e.mesh.userData.magicGate) { e.mesh.rotation.y = Math.sin(this.time * .45 + e.x) * .045; e.mesh.traverse(o => {
        if (o.userData.sparkle) { o.rotation.y += dt * 2.4; o.rotation.z += dt * 1.2; }
        if (o.userData.gateRing) o.rotation.z += dt * Number(o.userData.gateRing);
        if (o.userData.gateHalo) { o.rotation.z += dt * .65; const pulse = 1 + Math.sin(this.time * 2.2) * .055; o.scale.setScalar(pulse); }
        if (o.userData.gatePulse) { const pulse = 1 + (Math.sin(this.time * 1.8) + 1) * .08; o.scale.setScalar(pulse); (o as T.Mesh).material && (((o as T.Mesh).material as T.MeshBasicMaterial).opacity = .14 + (Math.sin(this.time * 1.8) + 1) * .06); }
        if (o.userData.gateBeam) { o.rotation.y += dt * .3; (o as T.Mesh).material && (((o as T.Mesh).material as T.MeshBasicMaterial).opacity = .09 + (Math.sin(this.time * 2.5) + 1) * .035); }
        if (o.userData.gateOrb) { o.userData.gateAngle += dt * o.userData.gateSpeed; o.position.x = Math.cos(o.userData.gateAngle) * o.userData.gateRadius; o.position.z = Math.sin(o.userData.gateAngle) * .48; o.position.y = o.userData.gateBaseY + Math.sin(this.time * 2.1 + o.userData.gateAngle) * .16; }
      }); }
      const d = Math.hypot(p.x - e.x, p.z - e.z); if (e.mesh.visible && d < distance) { near = e; distance = d; }
      const v = this.tempProjection.set(e.x, e.id.startsWith('monster') ? 2 : 2.6, e.z).project(this.camera);
      e.label.style.transform = `translate(-50%, -100%) translate(${(v.x * .5 + .5) * this.container.clientWidth}px, ${(-v.y * .5 + .5) * this.container.clientHeight}px)`;
      e.label.hidden = !this.active || !e.mesh.visible || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.1;
      e.label.classList.toggle('near', d < 2.8);
    }
    if ((near?.id ?? null) !== this.selectedId) { this.selectedId = near?.id ?? null; this.onNear(near?.name ?? null, near?.id ?? null); }
    for (const butterfly of this.butterflies) { butterfly.position.y += Math.sin(this.time * 4 + butterfly.position.x) * .0015; butterfly.rotation.y += dt * .7; }
    const weapon = this.player.userData.weapon as T.Group | undefined; if (weapon) weapon.rotation.z = -.28 + (this.swingUntil > this.time ? Math.sin((this.swingUntil - this.time) / .28 * Math.PI) * -1.35 : 0);
    for (const o of this.rideAnimated) {
      if (o.userData.rideWing) o.rotation.z = Number(o.userData.rideWing) * (-.72 + Math.sin(this.time * 7) * .18);
      if (o.userData.ridePropeller) o.rotation.z += dt * 11;
      if (o.userData.rideGlow) { o.rotation.z += dt * .9; o.scale.setScalar(1 + Math.sin(this.time * 3.5) * .09); }
    }
    if (this.petModel) this.petModel.traverse(o => { if (o.userData.petCharm) { o.rotation.y += dt * 3; const pulse = 1 + Math.sin(this.time * 6) * .12; o.scale.setScalar(pulse); } if (o.userData.petWing) o.rotation.z = Number(o.userData.petWing) * (.35 + Math.sin(this.time * 11) * .18); });
    if (this.player.userData.sparkles) this.player.userData.sparkles.rotation.y += dt;
    for (let i = this.particles.length - 1; i >= 0; i--) { const q = this.particles[i]; q.life -= dt; q.v.y -= dt * 5; q.mesh.position.addScaledVector(q.v, dt); q.mesh.scale.setScalar(Math.max(0, q.life)); if (q.life <= 0) { this.scene.remove(q.mesh); this.particles.splice(i, 1); } }
    const target = this.active ? p : this.cameraTarget.set(0, 0, -1); this.follow.lerp(target, 1 - Math.exp(-dt * 3));
    this.camera.position.copy(this.follow).add(CAMERA_OFFSET); this.camera.lookAt(this.follow); this.renderer.render(this.scene, this.camera);
  }
}

export class AvatarPreview {
  private scene = new T.Scene(); private camera = new T.PerspectiveCamera(30, 1, .1, 20); private renderer: T.WebGLRenderer; private model = new T.Group(); private resizeObserver: ResizeObserver;
  constructor(private element: HTMLElement) {
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.renderer.setClearColor(0x000000, 0); this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.4; element.append(this.renderer.domElement); this.scene.add(new T.HemisphereLight(0xffffff, 0xa6ba93, 3)); const light = new T.DirectionalLight(0xffedcd, 3); light.position.set(-3, 4, 5); this.scene.add(light); this.camera.position.set(2.2, 1.9, 5.8); this.camera.lookAt(0, 1.1, 0);
    this.resizeObserver = new ResizeObserver(() => this.draw()); this.resizeObserver.observe(element);
  }
  show(c: number, o: number, w: number, ol = 0, wl = 0, hairstyle = 0, face = 0) { this.scene.remove(this.model); this.model.traverse(x => { if (x instanceof T.Mesh && !sharedGeometries.has(x.geometry)) x.geometry.dispose(); }); this.model = makeCharacter(c, o, w, ol, wl, hairstyle, face); this.model.rotation.y = -.18; this.scene.add(this.model); this.draw(); }
  private draw() { const w = this.element.clientWidth, h = this.element.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.render(this.scene, this.camera); }
  dispose() { this.resizeObserver.disconnect(); this.model.traverse(x => { if (x instanceof T.Mesh && !sharedGeometries.has(x.geometry)) x.geometry.dispose(); }); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
