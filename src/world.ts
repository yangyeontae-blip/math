import { VILLAGE_SPOTS, villageWelcomeClear, villageTreeSpot, villageMonsterSpot } from './village-layout';
import { homeScenery } from './homestead-models';
import { HOME_ITEMS, objectCells, visitorTargets, homeRoute, type HomeObject } from './homestead';
import { discoveryHere, discoveryInfo, discoverySpot, discoveryId } from './exploration';
import { fieldHere, fieldSpec, FIELD_INFO, FIELD_SPOTS } from './forest-activities';
import { trailHere, trailPair, TRAIL_SEEDS, TRAIL_LAMPS } from './forest-trail';
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CHARACTERS, MONSTERS, OUTFITS, PETS, RIDES, WEAPONS, PLAYER_MOVE_SPEED, HERO_BREAD_PET_ID, berryWithinReach, petChaseSpeed, riderHeight, journeyFor, roomFurniturePosition, type ForestKind, type Save } from './rules';
import { STAGES, stageBerries, stageMonsters, stagePlatforms, stageTrees, stageSize, isVillagePond } from './stages';
import { EXPEDITION_STAR_SPOTS, expeditionLayout } from './expedition';
import { storyHere, storySpot } from './story';
import { activitySpec, type StoryActivity } from './story-activities';
import type { PetReaction } from './pet-care';
import { VILLAGE_PROJECTS, projectSpec } from './adventure';
import { VILLAGE_THEMES, villageThemeId, type VillageTheme } from './villages';
import type { AmbienceScene } from './ambience';

type Entity = { id: string; name: string; x: number; z: number; mesh: T.Group; label: HTMLDivElement };
export type GuideKind = 'homeEditor' | 'homeExit' | 'homeVisitor' | 'discovery' | 'forestWork' | 'trailSeed' | 'trailLamp' | 'berry' | 'monster' | 'shop' | 'journey' | 'next' | 'star' | 'expMonster' | 'roomExit' | 'storyClue' | 'storyPuzzle' | 'storyMailbox' | 'village' | 'villageProject0' | 'villageProject1' | 'villageProject2';
const mat = (color: number, roughness = .86) => new T.MeshStandardMaterial({ color, roughness });
const materials = new Map<number, T.MeshStandardMaterial>();
const sharedGeometries = new Set<T.BufferGeometry>();
const CAMERA_OFFSET = new T.Vector3(18, 25, 24);
const ROOM_CAMERA_OFFSET = new T.Vector3(10, 18, 15);
const sphereGeometry = new T.SphereGeometry(1, 12, 8); sharedGeometries.add(sphereGeometry);
// 펫·라이딩은 가까이서 크게 보이므로 매끈한 공을 써요. 숲·마을의 수많은 공은 가벼운 공을 그대로 써요.
const smoothSphereGeometry = new T.SphereGeometry(1, 28, 20); sharedGeometries.add(smoothSphereGeometry);
let activeSphere = sphereGeometry;
const particleGeometry = new T.OctahedronGeometry(.09); sharedGeometries.add(particleGeometry);
const expeditionStarGeometry = new T.OctahedronGeometry(.42); sharedGeometries.add(expeditionStarGeometry);
const boxGeometries = new Map<string, T.BoxGeometry>(), cylinderGeometries = new Map<string, T.CylinderGeometry>();
function cachedBox(w: number, h: number, d: number) { const key = `${w},${h},${d}`; if (!boxGeometries.has(key)) { const geo = new T.BoxGeometry(w, h, d); boxGeometries.set(key, geo); sharedGeometries.add(geo); } return boxGeometries.get(key)!; }
function cachedCylinder(top: number, bottom: number, h: number, sides: number) { const key = `${top},${bottom},${h},${sides}`; if (!cylinderGeometries.has(key)) { const geo = new T.CylinderGeometry(top, bottom, h, sides); cylinderGeometries.set(key, geo); sharedGeometries.add(geo); } return cylinderGeometries.get(key)!; }
function material(color: number) { if (!materials.has(color)) materials.set(color, mat(color)); return materials.get(color)!; }
const twoSidedMaterials = new Map<number, T.MeshStandardMaterial>();
function twoSided(color: number) { if (!twoSidedMaterials.has(color)) { const m = mat(color); m.side = T.DoubleSide; twoSidedMaterials.set(color, m); } return twoSidedMaterials.get(color)!; }
/** 매끈한 공으로 모델을 만들고, 날개·망토 같은 얇은 판은 뒤에서 봐도 보이게 양면으로 바꿔요. */
function smoothModel<A extends unknown[]>(build: (...args: A) => T.Group) {
  return (...args: A) => {
    activeSphere = smoothSphereGeometry;
    try {
      const model = build(...args);
      model.traverse(o => { if (o instanceof T.Mesh && (o.geometry.type === 'CircleGeometry' || o.geometry.type === 'ShapeGeometry') && o.material instanceof T.MeshStandardMaterial && !o.material.transparent) o.material = twoSided(o.material.color.getHex()); });
      return model;
    } finally { activeSphere = sphereGeometry; }
  };
}
function mesh(geo: T.BufferGeometry, color: number, x = 0, y = 0, z = 0, parent?: T.Object3D) {
  const m = new T.Mesh(geo, material(color)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent?.add(m); return m;
}
function ball(p: T.Object3D, color: number, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx) {
  const m = mesh(activeSphere, color, x, y, z, p); m.scale.set(sx, sy, sz); return m;
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
    if (face >= 10) { const color = [0xf7c947, 0xe8a75c, 0xf2c640, 0xffdf76][face - 10] ?? 0xffdf76; ball(body, color, side * .19, 1.51, .462, .065, .075, .02); ball(body, 0xffffff, side * .17, 1.54, .476, .018, .022, .008); }
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
  if (hairstyle >= 6) { for (const side of [-1, 1]) ball(body, c.hair, side * .42, hairstyle === 7 ? 2.04 : 1.75, -.06, hairstyle === 7 ? .25 : .2, hairstyle === 6 ? .36 : .24, .2); for (let i = 0; i < 3; i++) ball(body, o.accent, -.22 + i * .22, 2.02 + Math.sin(i) * .06, .02, .08); }
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
  if (weapon >= 12 && weapon <= 15) { ball(w, WEAPONS[weapon].color, 0, .96, 0, .3, .27, .16); for (let i = 0; i < 8; i++) ball(w, i % 2 ? 0x7cad55 : 0xffdf65, Math.cos(i * Math.PI / 4) * .34, .96 + Math.sin(i * Math.PI / 4) * .34, 0, .095, .13, .07); }
  if (weapon === 16) { // 강지후의 젤리 발바닥: 폭신한 큰 발바닥과 네 발가락
    ball(w, 0xf18fa5, 0, .92, .03, .28, .25, .13); ball(w, 0xffc3cf, 0, .9, .16, .15, .13, .04);
    for (let i = 0; i < 4; i++) { const x = -.24 + i * .16; ball(w, 0xf18fa5, x, 1.19 + Math.abs(i - 1.5) * .025, .02, .105, .14, .09); ball(w, 0xffdbe2, x, 1.2, .11, .05, .065, .025); }
    box(w, 0xffd66f, 0, .49, 0, .4, .075, .13);
  }
  if (weapon === 17) { // 나현이의 황금별 칼: 가장 긴 금빛 칼날과 별 보석
    const blade = mesh(new T.ConeGeometry(.21, 1.02, 4), 0xffd34f, 0, .98, 0, w); blade.rotation.z = Math.PI; blade.scale.z = .42;
    const shine = box(w, 0xfff2a8, -.055, .96, .075, .05, .7, .025); shine.rotation.z = -.02;
    box(w, 0xf3a944, 0, .47, 0, .62, .1, .16); ball(w, 0x8fdcf1, 0, .48, .12, .105, .105, .04);
    for (let i = 0; i < 5; i++) ball(w, i % 2 ? 0xffffff : 0xffe16d, Math.cos(i * 1.257) * .22, .48 + Math.sin(i * 1.257) * .22, .12, .05);
  }
  if (weapon >= 18) { // 새 상점 무기: 각자 색이 다른 반짝이는 모험 지팡이
    cylinder(w, WEAPONS[weapon].color, 0, .86, 0, .07, .09, .95, 8);
    if (weapon === 18) { mesh(new T.OctahedronGeometry(.24), 0xffed91, 0, 1.38, .02, w); box(w, 0xfff7cf, 0, 1.02, .1, .13, .42, .035); }
    if (weapon === 19) { const harp = mesh(new T.TorusGeometry(.29, .055, 7, 18, Math.PI * 1.35), 0xffe19a, 0, 1.18, .02, w); harp.rotation.z = -.45; for (let i = 0; i < 3; i++) box(w, 0xffffff, -.1 + i * .1, 1.15, .08, .018, .35, .02); }
    if (weapon === 20) { ball(w, 0xeaf7ff, 0, 1.18, .02, .3, .3, .2); mesh(new T.TorusGeometry(.16, .035, 6, 18), 0xffdb73, 0, 1.18, .25, w); }
    if (weapon === 21) { for (let i = 0; i < 10; i++) ball(w, i % 2 ? 0xffdc55 : 0xf0a635, Math.cos(i * Math.PI / 5) * .25, 1.25 + Math.sin(i * Math.PI / 5) * .25, .03, .09, .13, .06); ball(w, 0x855b35, 0, 1.25, .08, .14); }
    if (weapon === 22) { const comet = mesh(new T.ConeGeometry(.2, .72, 5), 0xff9cab, 0, 1.28, .02, w); comet.rotation.z = Math.PI; for (let i = 0; i < 3; i++) ball(w, i % 2 ? 0xffe690 : 0xffffff, -.2 - i * .1, 1.0 - i * .1, .03, .08 - i * .015); }
  }
  if (outfit === 8) { box(body, 0xf55f74, 0, .82, .39, .3, .34, .08); for (const side of [-1, 1]) box(body, 0xf8d9a0, side * .18, .98, .36, .06, .42, .04); }
  if (outfit === 9) { const brim = cylinder(body, o.accent, 0, 1.98, 0, .57, .57, .08); ball(body, o.color, 0, 2.12, 0, .38, .25, .34); }
  if (outfit === 10) { for (const side of [-1, 1]) { const ear = ball(body, o.accent, side * .27, 2.26, 0, .17, .55, .15); ear.rotation.z = side * -.16; } ball(body, 0xffffff, 0, .77, -.38, .22); }
  if (outfit === 11) { mesh(new T.SphereGeometry(.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), o.color, 0, 1.94, 0, body); ball(body, o.accent, 0, 2.23, 0, .16); box(body, o.accent, 0, .87, -.42, .52, .58, .18); }
  if (outfit === 12) { for (const side of [-1, 1]) { const ear = mesh(new T.ConeGeometry(.16, .43, 5), o.color, side * .3, 2.12, 0, body); ear.rotation.z = side * -.2; } ball(body, o.accent, 0, .72, .38, .2, .14, .05); }
  if (outfit === 13) { for (const side of [-1, 1]) ball(body, 0xffffff, side * .28, 2.05, 0, .25, .3, .22); for (let i = 0; i < 3; i++) ball(body, 0xffffff, -.22 + i * .22, .72, .4, .09); }
  if (outfit === 14) { for (const side of [-1, 1]) ball(body, 0xeef397, side * .25, 2.02, .03, .28, .18, .18); const cape = mesh(new T.CircleGeometry(.65, 16), 0x78bf70, 0, .82, -.31, body); cape.rotation.x = -.2; }
  if (outfit === 15) { for (const side of [-1, 1]) { const wing = mesh(new T.CircleGeometry(.38, 12), side < 0 ? 0xf7b6dc : 0xaedcf4, side * .42, 1, -.25, body); wing.scale.y = 1.5; } for (let i = 0; i < 3; i++) mesh(new T.OctahedronGeometry(.08), o.accent, -.2 + i * .2, .72, .41, body); }
  if (outfit === 16) { // 해바라기 원피스: 꽃잎 모자와 잎사귀 리본
    for (let i = 0; i < 10; i++) ball(body, i % 2 ? o.color : 0xffd84f, Math.cos(i * Math.PI / 5) * .36, 2.04 + Math.sin(i * Math.PI / 5) * .32, .02, .095, .14, .07);
    ball(body, 0x865b36, 0, 2.04, .04, .17); for (const side of [-1, 1]) { const leaf = mesh(new T.CircleGeometry(.2, 10), o.accent, side * .34, .8, -.28, body); leaf.scale.y = 1.7; leaf.rotation.z = side * -.55; }
  }
  if (outfit === 17) { // 꿀벌 후드: 줄무늬 후드, 더듬이와 투명 날개
    for (const y of [.57, .78, .99]) box(body, y === .78 ? o.accent : o.color, 0, y, .36, .58, .11, .05);
    for (const side of [-1, 1]) { const antenna = cylinder(body, o.accent, side * .17, 2.2, .02, .018, .026, .34, 6); antenna.rotation.z = side * -.3; ball(body, 0xffdf72, side * .22, 2.38, .02, .075); const wing = mesh(new T.CircleGeometry(.3, 12), 0xffefbd, side * .39, .93, -.25, body); wing.scale.y = 1.45; wing.rotation.z = side * -.48; }
  }
  if (outfit === 18) { // 살구빛 구름옷: 구름 소매와 복숭아빛 방울
    for (const side of [-1, 1]) { for (let i = 0; i < 3; i++) ball(body, 0xffead3, side * (.42 + i * .08), .72 + i * .13, -.03, .14 - i * .015); ball(body, o.color, side * .33, 2.05, .02, .2, .13, .11); }
    for (let i = 0; i < 5; i++) ball(body, 0xffead3, -.34 + i * .17, .29, .28, .12, .08, .06); ball(body, 0xf39b74, 0, .76, .4, .12, .14, .05);
  }
  if (outfit === 19) { // 곱셈별 예복: 햇살 왕관과 숫자별 망토
    const cape = mesh(new T.CircleGeometry(.66, 18), o.color, 0, .86, -.32, body); cape.rotation.x = -.16;
    for (let i = 0; i < 7; i++) { const star = mesh(new T.OctahedronGeometry(.075), i % 2 ? o.accent : 0xfff2b0, -.33 + i * .11, .58 + (i % 3) * .2, -.38, body); star.rotation.z = i * .4; }
    for (let i = 0; i < 5; i++) { const ray = mesh(new T.ConeGeometry(.09, .3, 5), o.accent, -.28 + i * .14, 2.18 + Math.abs(i - 2) * .05, .02, body); ray.rotation.z = (i - 2) * -.16; }
  }
  if (outfit === 20) { // 송하나의 별고양이 갑옷: 고양이 투구, 어깨 갑옷, 별 방패
    box(body, 0x6f5c97, 0, .83, .37, .58, .58, .09); box(body, o.accent, 0, .85, .43, .42, .42, .035);
    for (const side of [-1, 1]) {
      ball(body, o.color, side * .43, 1.1, .01, .24, .2, .24); ball(body, o.accent, side * .43, 1.11, .2, .13, .11, .05);
      const ear = mesh(new T.ConeGeometry(.17, .42, 5), o.color, side * .27, 2.16, .01, body); ear.rotation.z = side * -.16;
      const inner = mesh(new T.ConeGeometry(.08, .23, 5), 0xf6b2c5, side * .25, 2.15, .12, body); inner.rotation.z = side * -.16;
    }
    const shield = cylinder(body, 0x6f5c97, -.48, .83, -.2, .43, .43, .12, 8); shield.rotation.z = Math.PI / 2;
    mesh(new T.OctahedronGeometry(.2), o.accent, -.53, .84, -.31, body);
    for (let i = 0; i < 8; i++) ball(body, i % 2 ? 0xffe89b : 0xffffff, Math.cos(i * Math.PI / 4) * .27, .83 + Math.sin(i * Math.PI / 4) * .25, .46, .045, .07, .025);
    ball(body, 0xf4d460, 0, .83, .48, .12); ball(body, 0x7b5a34, 0, .83, .53, .055);
  }
  if (outfit >= 21) { // 새 의상: 꽃·별·리본 장식으로 실루엣도 구분해요.
    const crownColor = [0xb58aca, 0x9bcdf2, 0xef8399, 0xdfefff, 0x78b8a8][outfit - 21];
    for (let i = 0; i < 5; i++) ball(body, i % 2 ? o.accent : crownColor, -.24 + i * .12, 2.1 + Math.sin(i) * .07, .03, .08);
    const cape = mesh(new T.CircleGeometry(.56, 14), o.color, 0, .86, -.32, body); cape.rotation.x = -.16;
    if (outfit === 23) { ball(body, 0xffe7b6, 0, .82, .43, .16); for (const side of [-1, 1]) ball(body, 0xef8399, side * .28, .82, .42, .13); }
    if (outfit === 24) for (const side of [-1, 1]) { const ear = ball(body, o.accent, side * .27, 2.27, .02, .14, .43, .13); ear.rotation.z = side * -.16; }
    if (outfit === 25) for (const side of [-1, 1]) { const wing = mesh(new T.CircleGeometry(.32, 10), side < 0 ? 0xa9e0dd : 0xd5b6ef, side * .42, 1.04, -.25, body); wing.scale.y = 1.45; }
  }
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
  if (type === 4) { for (const side of [-1, 1]) { cylinder(g, 0x4e4036, side * .23, 1.13, 0, .025, .025, .3); ball(g, 0xffdf57, side * .27, 1.32, 0, .07); const wing = mesh(new T.CircleGeometry(.3, 10), 0xfff0a4, side * .52, .58, -.1, g); wing.scale.y = 1.35; } for (const y of [.4, .66]) cylinder(g, 0x4e4036, 0, y, .02, .67, .67, .1); }
  if (type === 5) { for (const side of [-1, 1]) { const ear = mesh(new T.ConeGeometry(.2, .42, 5), c, side * .3, 1.12, 0, g); ear.rotation.z = side * -.12; } ball(g, 0xffda67, .42, 1.04, .08, .18, .07, .16); }
  if (type === 6) { for (const side of [-1, 1]) { const ear = mesh(new T.ConeGeometry(.23, .5, 5), c, side * .31, 1.13, 0, g); ear.rotation.z = side * -.18; } ball(g, 0xffe8c9, 0, .5, .55, .25, .2, .06); ball(g, 0xffffff, .48, .72, -.22, .32, .24, .18); }
  if (type === 7) { for (let i = 0; i < 7; i++) ball(g, 0xfff8f0, (i % 4 - 1.5) * .22, .98 + (i % 2) * .16, -.05, .25, .2, .24); for (const side of [-1, 1]) ball(g, 0xf6c7db, side * .52, .83, 0, .16, .32, .13); }
  if (type === 8) { for (const side of [-1, 1]) ball(g, c, side * .39, 1.02, 0, .22, .22, .17); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ball(g, 0xffdf72, Math.cos(a) * .25, 1.14 + Math.sin(a) * .22, .12, .07, .07, .035); } }
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

const makeRide = smoothModel(buildRide);
function buildRide(id: number) {
  const g = new T.Group(), ride = RIDES[id]; g.userData.rideModel = true;
  // 동물 탈것 공통 부품: 눈, 다리, 깃털 날개, 안장. 머리는 목을 세워 앞쪽 위에 두어 탄 사람에게 가려지지 않게 해요.
  const eyes = (y: number, z: number, spread: number, color = 0x2f2a3a) => { for (const side of [-1, 1]) { ball(g, color, side * spread, y, z, .05, .068, .03); ball(g, 0xffffff, side * spread - .015, y + .025, z + .022, .016, .02, .01); } };
  const leg = (x: number, z: number, color: number, hoof: number, h: number) => { cylinder(g, color, x, h / 2 + .06, z, .07, .085, h, 10); ball(g, hoof, x, .07, z, .1, .07, .12); };
  const featherWing = (side: number, colors: readonly number[], x: number, y: number, z: number, size: number) => { colors.forEach((color, i) => { const plume = mesh(new T.CircleGeometry(size * (1 - i * .17), 16), color, side * (x + i * size * .32), y - i * size * .18, z - i * .05, g); plume.scale.set(.62, 1.5, 1); plume.rotation.set(-.35, 0, side * -.7); plume.userData.rideWing = side; }); };
  const saddle = (y: number, color = 0x8d6046) => { box(g, color, 0, y, -.05, .52, .1, .5); ball(g, 0xffd978, 0, y + .06, .2, .08); };
  const neckHead = (body: number, light: number, neckY: number, headY: number, headZ: number) => {
    const neck = ball(g, body, 0, neckY, headZ - .32, .2, .36, .2); neck.rotation.x = -.55;
    ball(g, body, 0, headY, headZ, .25, .23, .3); ball(g, light, 0, headY - .07, headZ + .26, .16, .13, .14);
  };
  if (id === 0) {
    box(g, 0x73b7a3, 0, .34, 0, 1.25, .16, .58); cylinder(g, 0xf39a58, 0, .55, .1, .16, .3, .72, 10).rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) { const wheel = cylinder(g, 0x554b47, side * .48, .22, .08, .23, .23, .15, 12); wheel.rotation.z = Math.PI / 2; ball(g, 0xffd56c, side * .48, .22, .08, .08); ball(g, 0xfff1b0, side * .3, .39, .31, .08, .07, .035); }
  } else if (id === 1) { // 구름양 포포: 몽실 구름 몸, 앞으로 내민 얼굴, 짧은 다리
    for (let i = 0; i < 7; i++) ball(g, 0xf5fbff, (i % 4 - 1.5) * .26, .58 + (i % 2) * .14, (Math.floor(i / 4) - .5) * .5, .36, .32, .4);
    for (const side of [-1, 1]) for (const z of [-.35, .35]) leg(side * .3, z, 0x9a8b84, 0x6c605b, .34);
    ball(g, 0xe6d9cf, 0, .9, .78, .3, .27, .27); for (const x of [-.12, 0, .12]) ball(g, 0xffffff, x, 1.12, .72, .12);
    eyes(.96, 1.02, .11); ball(g, 0xc98f8f, 0, .84, 1.04, .05, .03, .02);
    for (const side of [-1, 1]) { const ear = ball(g, 0xe6d9cf, side * .32, .95, .72, .14, .05, .08); ear.rotation.z = side * -.3; ball(g, 0xf3a6b5, side * .22, .86, 1.0, .06, .04, .02); }
    ball(g, 0xffffff, 0, .72, -.62, .14); saddle(.92);
  } else if (id === 2) { // 도토리 붕붕이: 도토리 차체와 네 바퀴
    ball(g, 0x9a653d, 0, .63, 0, .68, .48, .62); cylinder(g, 0x6d4835, 0, 1.05, 0, .52, .62, .22, 12);
    box(g, 0xf2daa0, 0, .78, .04, .56, .08, .42);
    for (const side of [-1, 1]) for (const front of [-1, 1]) { const wheel = cylinder(g, 0x4c4650, side * .54, .25, front * .42, .19, .19, .16, 10); wheel.rotation.z = Math.PI / 2; ball(g, 0xffdc6c, side * .55, .25, front * .42, .065); }
    for (const side of [-1, 1]) ball(g, 0x493c35, side * .17, 1.04, .54, .045, .06, .025);
    const sprout = cylinder(g, 0x70a85b, 0, 1.38, 0, .035, .045, .35, 7); sprout.rotation.z = -.24; ball(g, 0x8acb75, -.13, 1.49, 0, .17, .08, .09);
  } else if (id === 3) { // 무지개 사슴: 긴 다리, 세운 목, 가지 뿔, 무지개 점박이
    ball(g, 0x82cfb2, 0, .62, 0, .42, .34, .7);
    for (const side of [-1, 1]) for (const z of [-.42, .42]) leg(side * .26, z, 0x6a9f79, 0x5b5149, .52);
    neckHead(0x82cfb2, 0xbfeee0, 1.0, 1.32, .82); ball(g, 0x3d3a3a, 0, 1.28, 1.12, .045, .035, .025); eyes(1.38, 1.04, .15, 0x3a4440);
    for (const side of [-1, 1]) {
      const ear = ball(g, 0xc1a5ee, side * .26, 1.47, .78, .1, .2, .06); ear.rotation.z = side * -.9;
      const antler = cylinder(g, 0xffd77d, side * .12, 1.68, .76, .025, .035, .4, 6); antler.rotation.z = side * -.3;
      const branch = cylinder(g, 0xffd77d, side * .2, 1.7, .8, .02, .025, .2, 6); branch.rotation.z = side * -1.1; ball(g, 0xffe9a8, side * .2, 1.87, .76, .04);
    }
    for (let i = 0; i < 5; i++) ball(g, [0xffe17a, 0xf4a6cd, 0xa9def0, 0xc6f0a8, 0xd9c2f5][i], Math.sin(i * 2.4) * .22, .9 + (i % 2) * .04, -.45 + i * .14, .06, .03, .06);
    ball(g, 0xff8fb4, 0, .8, -.7, .12, .14, .16); saddle(.97);
  } else if (id === 4) { // 별빛 페가수스: 말 몸, 세운 목과 갈기, 세 겹 깃털 날개, 금빛 발굽
    ball(g, 0xd9cefa, 0, .78, 0, .44, .36, .74);
    for (const side of [-1, 1]) for (const z of [-.42, .42]) leg(side * .26, z, 0xc9b5ef, 0xffd76a, .62);
    neckHead(0xd9cefa, 0xf2ecff, 1.16, 1.5, .86); ball(g, 0x6b5a8f, 0, 1.45, 1.15, .05, .03, .025); eyes(1.56, 1.08, .15, 0x45405e);
    for (const side of [-1, 1]) { const ear = mesh(new T.ConeGeometry(.06, .18, 8), 0xf7e9ff, side * .1, 1.78, .78, g); ear.rotation.z = side * -.25; featherWing(side, [0xffffff, 0xf7d3ee, 0xc6e5ff], .42, 1.18, -.05, .46); }
    for (let i = 0; i < 6; i++) ball(g, i % 2 ? 0xffe898 : 0xf7c6ec, 0, 1.72 - i * .11, .62 - i * .1, .09, .1, .08);
    for (let i = 0; i < 4; i++) ball(g, i % 2 ? 0xffe898 : 0xf7c6ec, 0, .86 - i * .1, -.78 - i * .14, .13 - i * .018);
    saddle(1.13, 0x7c68b4);
  } else if (id === 5) { // 솜사탕 열기구: 머리 위 줄무늬 풍선, 밧줄, 탄 사람이 서 있는 바구니
    box(g, 0xa8754e, 0, 1.08, 0, .84, .56, .74); box(g, 0xd4a06a, 0, 1.38, 0, .9, .06, .8);
    for (let i = 0; i < 3; i++) box(g, 0x8d5f3e, 0, .92 + i * .14, .375, .86, .025, .01);
    ball(g, 0xf2a9cf, 0, 3.75, 0, .78, .86, .78); ball(g, 0xffd9e9, 0, 4.55, 0, .26, .1, .26);
    for (let i = 0; i < 4; i++) { const stripe = mesh(new T.TorusGeometry(.79, .035, 8, 32), [0xffe6a0, 0xc5e9ff, 0xfff4c9, 0xd9c6ff][i], 0, 3.75, 0, g); stripe.scale.set(1, 1.09, 1); stripe.rotation.y = i * Math.PI / 4; }
    cylinder(g, 0xf7c9dd, 0, 2.92, 0, .3, .2, .14, 16);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const rope = cylinder(g, 0xf4e2b2, sx * .33, 2.17, sz * .28, .018, .018, 1.6, 6); rope.rotation.set(sz * -.05, 0, sx * .05); }
    const flame = mesh(new T.ConeGeometry(.09, .26, 10), 0xffb84d, 0, 2.72, 0, g); flame.rotation.x = Math.PI;
  } else if (id === 6) { // 달빛 아기용: 세운 목, 뒤로 누운 뿔, 박쥐 날개, 등 가시, 긴 꼬리
    ball(g, 0x7898d8, 0, .78, 0, .48, .4, .76);
    for (const side of [-1, 1]) for (const z of [-.4, .4]) leg(side * .3, z, 0x6a87c8, 0x3f4f86, .5);
    neckHead(0x7898d8, 0xb9cbf2, 1.16, 1.5, .86); for (const side of [-1, 1]) ball(g, 0x2c3560, side * .06, 1.47, 1.15, .025, .018, .012); eyes(1.58, 1.06, .15, 0x343c62);
    const wingShape = new T.Shape(); wingShape.moveTo(0, 0); wingShape.lineTo(.2, .34); wingShape.lineTo(.56, .44); wingShape.quadraticCurveTo(.48, .3, .54, .14); wingShape.quadraticCurveTo(.42, .17, .37, .02); wingShape.quadraticCurveTo(.27, .08, .21, -.07); wingShape.quadraticCurveTo(.1, -.02, 0, 0);
    for (const side of [-1, 1]) {
      const horn = mesh(new T.ConeGeometry(.06, .3, 8), 0xffe69a, side * .13, 1.76, .74, g); horn.rotation.set(-.6, 0, side * -.25);
      const wing = mesh(new T.ShapeGeometry(wingShape, 10), 0xaed0f0, side * .34, 1.12, -.05, g); wing.scale.set(side * 1.7, 1.7, 1); wing.rotation.x = -.3; wing.userData.rideWing = side;
    }
    for (let i = 0; i < 5; i++) { const spike = mesh(new T.ConeGeometry(.07, .2, 6), 0xffe69a, 0, 1.15 - Math.abs(i - 1) * .02, -.25 - i * .14, g); spike.rotation.x = -.5; }
    for (let i = 0; i < 6; i++) ball(g, 0x9fc9f0, 0, .82 - i * .04, -.78 - i * .2, .16 - i * .02, .13 - i * .015, .18);
    saddle(1.13, 0x3f4f86);
  } else if (id === 7) { // 오로라 고래: 둥근 지느러미와 물결 꼬리
    ball(g, 0x65b9d8, 0, .82, 0, .94, .55, .72); ball(g, 0x89d7e6, 0, 1.02, .62, .5, .44, .44); ball(g, 0xe8f9ff, 0, .72, .5, .33, .22, .1);
    for (const side of [-1, 1]) { const fin = ball(g, 0x86d5e7, side * .8, .67, -.05, .42, .13, .34); fin.rotation.z = side * .48; ball(g, 0x354662, side * .18, 1.1, .94, .045, .065, .025); const tail = ball(g, 0x9fe6e5, side * .3, .88, -.78, .28, .1, .34); tail.rotation.z = side * .48; }
    for (let i = 0; i < 3; i++) ball(g, 0xb1f2db, -.18 + i * .18, 1.43 + Math.sin(i) * .06, .02, .08, .2, .07);
    for (let i = 0; i < 3; i++) ball(g, 0xe7fbff, .86, 1.05 + i * .2, -.3 + i * .12, .07, .07, .07);
  } else if (id === 8) { // 해바라기 사자: 해바라기 갈기, 꽃잎 날개, 꼬리 술
    ball(g, 0xe4a24d, 0, .78, 0, .48, .38, .72);
    for (const side of [-1, 1]) for (const z of [-.4, .4]) leg(side * .3, z, 0xd9953f, 0xf4d9a8, .5);
    neckHead(0xe4a24d, 0xfbe1b0, 1.12, 1.45, .86);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const petal = ball(g, i % 2 ? 0xf4c947 : 0xe89b3e, Math.cos(a) * .36, 1.45 + Math.sin(a) * .36, .76, .1, .2, .06); petal.rotation.z = a - Math.PI / 2; }
    ball(g, 0x6b4a2e, 0, 1.39, 1.15, .06, .045, .03); eyes(1.52, 1.12, .14, 0x493b32);
    for (const side of [-1, 1]) { ball(g, 0xe4a24d, side * .2, 1.68, .82, .08); featherWing(side, [0xfff2b8, 0xffe08a, 0xf4c947], .42, 1.18, -.05, .42); }
    for (let i = 0; i < 4; i++) ball(g, 0xe4a24d, 0, .82 + i * .06, -.78 - i * .13, .055); ball(g, 0x9a5a2a, 0, 1.08, -1.3, .12);
    saddle(1.14);
  } else if (id === 9) { // 꿀벌 하늘마차: 탄 사람이 앉는 꿀단지 마차와 앞에서 끄는 꿀벌
    cylinder(g, 0xf3c43f, 0, 1.0, 0, .56, .46, .62, 20); const rim = mesh(new T.TorusGeometry(.56, .06, 8, 24), 0xf9df8a, 0, 1.31, 0, g); rim.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ball(g, 0xffd25c, Math.cos(a) * .5, 1.18, Math.sin(a) * .5, .07, .14, .07); }
    for (const side of [-1, 1]) box(g, 0x8a6a3c, side * .3, 1.12, .75, .04, .04, .7);
    ball(g, 0xf0bd38, 0, 1.25, 1.35, .4, .34, .48); for (const z of [1.15, 1.38, 1.6]) { const f = Math.sqrt(Math.max(.05, 1 - ((z - 1.35) / .48) ** 2)) * 1.03; ball(g, 0x4f4338, 0, 1.25, z, .4 * f, .34 * f, .04); }
    ball(g, 0xf6d95e, 0, 1.42, 1.82, .26, .24, .22); eyes(1.47, 2.0, .1, 0x3d3733); ball(g, 0xf1a6a0, .17, 1.38, 1.98, .05, .03, .02); ball(g, 0xf1a6a0, -.17, 1.38, 1.98, .05, .03, .02);
    for (const side of [-1, 1]) { const antenna = cylinder(g, 0x4f4338, side * .1, 1.74, 1.86, .02, .025, .28, 6); antenna.rotation.z = side * -.3; ball(g, 0x4f4338, side * .15, 1.87, 1.86, .05); featherWing(side, [0xfff2c5, 0xd9f3ed], .32, 1.55, 1.25, .34); }
    const stinger = mesh(new T.ConeGeometry(.06, .2, 8), 0x4f4338, 0, 1.25, .82, g); stinger.rotation.x = -Math.PI / 2;
  } else if (id === 10) { // 반짝 킥보드: 낮은 발판, 긴 손잡이, 작은 바퀴 두 개
    box(g, 0x67c7f2, 0, .2, 0, .42, .08, 1.15); box(g, 0xffffff, 0, .25, 0, .18, .02, .9);
    for (const z of [-.5, .56]) { const wheel = cylinder(g, 0x4b4750, 0, .13, z, .13, .13, .1, 12); wheel.rotation.z = Math.PI / 2; ball(g, 0xffd56c, 0, .13, z, .04, .04, .06); }
    const pole = cylinder(g, 0xe9eef2, 0, .58, .54, .026, .03, .86, 8); pole.rotation.x = -.12; box(g, 0x3f8fc2, 0, 1.0, .5, .56, .045, .045);
    for (const side of [-1, 1]) ball(g, 0xff9a6c, side * .3, 1, .5, .055, .055, .09); ball(g, 0xfff1b0, 0, .88, .62, .06, .05, .03);
  } else if (id === 11) { // 바람 자전거: 두 바퀴, 가는 프레임, 안장, 바구니
    for (const z of [-.52, .52]) { const wheel = mesh(new T.TorusGeometry(.33, .035, 6, 20), 0x3c4a42, 0, .37, z, g); wheel.rotation.y = Math.PI / 2; ball(g, 0xdfe7e3, 0, .37, z, .05, .05, .05); }
    box(g, 0x7ccf88, 0, .52, .06, .06, .06, .95); const down = box(g, 0x62b872, 0, .45, -.12, .05, .05, .62); down.rotation.x = .55;
    box(g, 0x7ccf88, 0, .6, -.3, .05, .3, .05); box(g, 0x7ccf88, 0, .6, .5, .05, .46, .05).rotation.x = -.18;
    box(g, 0x8d6046, 0, .79, -.3, .24, .07, .32); box(g, 0x3c4a42, 0, .86, .5, .56, .05, .05);
    for (const side of [-1, 1]) ball(g, 0xffd978, side * .3, .86, .5, .05, .05, .08);
    box(g, 0xe7c88c, 0, .66, .72, .34, .2, .22); ball(g, 0xff7f8e, 0, .8, .72, .08);
  } else if (id === 12) { // 번개 오토바이: 굵은 바퀴, 연료통, 전조등, 배기관
    for (const z of [-.66, .66]) { const wheel = cylinder(g, 0x2f2c33, 0, .36, z, .36, .36, .2, 14); wheel.rotation.z = Math.PI / 2; const hub = cylinder(g, 0xd7dadf, 0, .36, z, .17, .17, .24, 10); hub.rotation.z = Math.PI / 2; }
    box(g, 0x3b3b44, 0, .52, .02, .34, .3, 1.0); ball(g, 0xe0524e, 0, .82, .2, .22, .17, .34); ball(g, 0xf06a63, 0, .86, .3, .12, .06, .18);
    box(g, 0x2a2a31, 0, .76, -.32, .3, .1, .55); box(g, 0xe0524e, 0, .62, -.7, .28, .05, .3);
    const fork = box(g, 0xc7ccd3, 0, .6, .56, .08, .62, .08); fork.rotation.x = -.35; cylinder(g, 0x2a2a31, 0, 1.0, .46, .03, .03, .78, 8).rotation.z = Math.PI / 2;
    ball(g, 0xfff4b0, 0, .92, .72, .12, .12, .08); const exhaust = cylinder(g, 0xb8bdc6, .24, .3, -.4, .06, .08, .7, 8); exhaust.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) ball(g, 0xffffff, side * .38, 1, .46, .05, .05, .08);
  } else if (id === 13) { // 황금별 스포츠카: 낮은 차체, 오픈 운전석, 황금 줄무늬, 날개, 네 바퀴
    box(g, 0x2b3a67, 0, .34, 0, 1.2, .32, 2.2); box(g, 0x34477c, 0, .54, .78, 1.1, .16, .66); box(g, 0x34477c, 0, .54, -.88, 1.1, .16, .42);
    for (const side of [-1, 1]) { box(g, 0x2b3a67, side * .56, .62, -.1, .08, .3, 1.1); box(g, 0xf3c43f, side * .6, .45, 0, .03, .05, 2.05); }
    box(g, 0xf3c43f, 0, .64, .78, .16, .02, .66); box(g, 0xf3c43f, 0, .64, -.88, .16, .02, .42);
    box(g, 0xefe3c4, 0, .5, -.28, .72, .2, .5); const glass = box(g, 0xbfe6ff, 0, .74, .86, 1.0, .2, .035); glass.rotation.x = -.5;
    for (const side of [-1, 1]) box(g, 0xf3c43f, side * .5, .68, .86, .04, .22, .04); ball(g, 0xf3c43f, 0, .65, 1.02, .07, .07, .03);
    box(g, 0xf3c43f, 0, .56, 1.1, .8, .06, .05); for (const side of [-1, 1]) ball(g, 0xfff4b0, side * .38, .54, 1.1, .1, .08, .05);
    for (const side of [-1, 1]) ball(g, 0xff5f6d, side * .4, .56, -1.1, .09, .07, .04);
    for (const side of [-1, 1]) for (const z of [-.7, .72]) { const wheel = cylinder(g, 0x2b2830, side * .62, .31, z, .31, .31, .24, 16); wheel.rotation.z = Math.PI / 2; const hub = cylinder(g, 0xf3c43f, side * .64, .31, z, .16, .16, .26, 10); hub.rotation.z = Math.PI / 2; }
    box(g, 0x1f2a4c, 0, 1.0, -1.08, 1.1, .05, .3); for (const side of [-1, 1]) box(g, 0xf3c43f, side * .4, .84, -1.0, .05, .3, .05);
    const wheelRing = mesh(new T.TorusGeometry(.17, .025, 6, 14), 0x1f1f25, 0, .86, .3, g); wheelRing.rotation.x = -.8; ball(g, 0xf3c43f, 0, .86, .3, .045, .045, .03);
  } else if (id === 14) { // 빨간판다 롤러스케이트: 앞코에 빨간판다 얼굴, 뒤꿈치에 줄무늬 꼬리
    for (const side of [-1, 1]) {
      box(g, 0xe97762, side * .26, .3, 0, .3, .18, .72); box(g, 0xfff1e4, side * .26, .4, 0, .32, .03, .74);
      for (const z of [-.25, .25]) { const wheel = cylinder(g, 0x4e5360, side * .26, .12, z, .11, .11, .12, 14); wheel.rotation.z = Math.PI / 2; ball(g, 0xffd56c, side * .26, .12, z, .04, .04, .07); }
      ball(g, 0xd9653f, side * .26, .36, .4, .15, .13, .12); ball(g, 0xfff1e4, side * .26, .33, .5, .08, .06, .05); ball(g, 0x2e2420, side * .26, .35, .55, .025);
      for (const e of [-1, 1]) { ball(g, 0x2e2420, side * .26 + e * .06, .41, .5, .022, .03, .015); ball(g, 0xfff1e4, side * .26 + e * .06, .45, .49, .03, .015, .01); ball(g, 0xd9653f, side * .26 + e * .1, .48, .38, .05, .05, .03); }
      for (let i = 0; i < 4; i++) ball(g, i % 2 ? 0x6b3a2a : 0xd9653f, side * .26, .34 + i * .02, -.42 - i * .09, .07 - i * .008);
    }
  } else if (id === 15) { // 민들레 글라이더: 머리 위 민들레 솜털 낙하산, 줄기, 씨앗 의자
    ball(g, 0x9a6b3c, 0, .86, 0, .32, .14, .3); ball(g, 0xc99562, 0, .95, 0, .26, .05, .24);
    cylinder(g, 0x8fbf6a, 0, 2.05, -.36, .03, .035, 2.3, 8);
    ball(g, 0xfffdf4, 0, 3.32, -.36, .88, .42, .88); ball(g, 0xf7efd8, 0, 3.18, -.36, .82, .2, .82); ball(g, 0xf0c85b, 0, 3.12, -.36, .14, .08, .14);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; ball(g, i % 2 ? 0xffffff : 0xfff6dc, Math.cos(a) * .86, 3.22 + (i % 2) * .05, -.36 + Math.sin(a) * .86, .17, .14, .17); }
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + .3; ball(g, 0xffffff, Math.cos(a) * .42, 3.66, -.36 + Math.sin(a) * .42, .16, .12, .16); }
    for (let i = 0; i < 5; i++) { const seed = ball(g, 0xfffaf0, Math.cos(i * 1.26) * 1.05, 3.0 - (i % 2) * .15, -.36 + Math.sin(i * 1.26) * 1.05, .05, .07, .05); seed.userData.rideGlow = true; }
  } else if (id === 16) { // 별토끼 로켓: 눕힌 로켓 몸, 토끼 귀가 달린 앞코, 둥근 창, 꼬리 불꽃
    const hull = cylinder(g, 0xa88de0, 0, .66, -.05, .36, .36, 1.3, 20); hull.rotation.x = Math.PI / 2;
    const nose = mesh(new T.ConeGeometry(.36, .55, 20), 0xffc4dc, 0, .66, .875, g); nose.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) { const ear = ball(g, 0xffffff, side * .12, 1.08, .78, .07, .26, .05); ear.rotation.set(-.4, 0, side * -.2); ball(g, 0xffb3cf, side * .12, 1.08, .81, .035, .18, .02).rotation.set(-.4, 0, side * -.2); }
    const window1 = mesh(new T.TorusGeometry(.13, .03, 8, 20), 0xffe37c, .36, .7, .2, g); window1.rotation.y = Math.PI / 2; ball(g, 0xdff4ff, .35, .7, .2, .02, .11, .11);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.PI / 2, fin = mesh(new T.ConeGeometry(.2, .42, 3), 0xffc4dc, Math.cos(a) * .4, .66 + Math.sin(a) * .4, -.6, g); fin.rotation.set(Math.PI / 2, 0, a - Math.PI / 2); }
    const ringBand = mesh(new T.TorusGeometry(.37, .035, 8, 24), 0xffe37c, 0, .66, .3, g); ringBand.rotation.y = 0;
    for (let i = 0; i < 3; i++) { const fire = mesh(new T.ConeGeometry(.26 - i * .07, .4 + i * .15, 12), [0xff8a5c, 0xffb84d, 0xffe37c][i], 0, .66, -.9 - i * .12, g); fire.rotation.x = -Math.PI / 2; }
    for (let i = 0; i < 4; i++) { const star = mesh(new T.OctahedronGeometry(.05), 0xffffff, Math.sin(i * 1.7) * .25, .4 + i * .15, -1.3 - i * .15, g); star.userData.rideGlow = true; }
  } else if (id === 17) { // 구름버스 보송이: 둥근 버스 몸, 창문, 얼굴, 구름 바퀴, 지붕 위 자리
    box(g, 0xcfeafa, 0, .62, 0, .96, .66, 1.7); for (const z of [-.85, .85]) { const cap = cylinder(g, 0xcfeafa, 0, .62, z, .33, .33, .96, 16); cap.rotation.z = Math.PI / 2; cap.scale.set(1, 1, 1); }
    box(g, 0xffffff, 0, .97, 0, 1.0, .06, 1.8);
    for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) { box(g, 0x8fc3e6, side * .485, .72, i * .45, .02, .26, .32); box(g, 0xffffff, side * .49, .72, i * .45, .015, .3, .03); }
    eyes(.74, 1.2, .2, 0x2f3a46); ball(g, 0xf3a6b5, .32, .6, 1.17, .07, .045, .02); ball(g, 0xf3a6b5, -.32, .6, 1.17, .07, .045, .02); const smile = mesh(new T.TorusGeometry(.06, .015, 6, 12, Math.PI), 0x2f3a46, 0, .62, 1.2, g); smile.rotation.z = Math.PI;
    for (const side of [-1, 1]) for (const z of [-.6, .6]) { ball(g, 0xffffff, side * .45, .22, z, .22); ball(g, 0xf0f8ff, side * .5, .2, z + .1, .14); }
    for (const z of [-.7, -.2, .3, .75]) for (const side of [-1, 1]) ball(g, 0xffffff, side * .46, 1.0, z, .13);
  } else if (id === 18) { // 베리혜성 썰매: 말려 올라간 금빛 썰매 날, 의자 등받이, 앞의 큰 베리, 긴 혜성 꼬리
    box(g, 0xea7192, 0, .62, 0, .78, .16, 1.3); box(g, 0xffd6df, 0, .72, -.05, .66, .06, 1.1); box(g, 0xea7192, 0, .95, -.6, .78, .5, .1);
    for (const side of [-1, 1]) { box(g, 0xffe5a0, side * .34, .3, 0, .06, .05, 1.5); const curl = mesh(new T.TorusGeometry(.2, .03, 8, 18, Math.PI), 0xffe5a0, side * .34, .5, .75, g); curl.rotation.y = Math.PI / 2; for (const z of [-.4, .4]) box(g, 0xffe5a0, side * .34, .45, z, .04, .3, .04); }
    ball(g, 0xe0405e, 0, .95, .66, .2, .2, .18); for (let i = 0; i < 6; i++) ball(g, 0xffe9a2, Math.cos(i) * .12, .95 + Math.sin(i * 1.3) * .12, .82, .022); for (const side of [-1, 1]) { const leaf = mesh(new T.CircleGeometry(.07, 10), 0x72ad67, side * .06, 1.16, .66, g); leaf.scale.y = 1.6; leaf.rotation.z = side * .6; }
    for (let i = 0; i < 8; i++) { const glow = ball(g, [0xffe690, 0xffd0dc, 0xffffff][i % 3], Math.sin(i * 1.3) * .06 * i, .7 + Math.sin(i * .8) * .08, -.85 - i * .2, .2 - i * .02); if (i % 3 === 2) glow.userData.rideGlow = true; }
  }
  // 안장은 동물 탈것마다 등 높이에 맞춰 위에서 따로 얹어요. 씽씽카·붕붕이·고래는 여기서 기본 안장을 받아요.
  if (id === 0 || id === 2 || id === 7) { box(g, 0x8d6046, 0, .92, -.05, .5, .12, .42); ball(g, 0xffd978, 0, .98, .12, .09); }
  if (ride.flying) { const glow = mesh(new T.TorusGeometry(.42, .025, 5, 16), 0xffec9f, 0, .25, 0, g); glow.rotation.x = Math.PI / 2; glow.userData.rideGlow = true; }
  return g;
}

const makePet = smoothModel(buildPet);
function buildPet(id: number) {
  const g = new T.Group(), pet = PETS[id];
  const body = new T.Group(); g.add(body);
  const eye = (side: number, x: number, y: number, z: number, color = 0x35423e, scale = 1) => {
    ball(body, color, side * x, y, z, .04 * scale, .058 * scale, .024).userData.petEye = true;
    ball(body, 0xffffff, side * (x - .012), y + .023 * scale, z + .018, .012 * scale, .016 * scale, .008).userData.petEye = true;
  };
  const cheek = (side: number, x: number, y: number, z: number, color = 0xf3a6b5) => ball(body, color, side * x, y, z, .065, .032, .018);
  const paw = (side: number, color: number, x = .21, y = .16, z = .22) => {
    const foot = ball(body, color, side * x, y, z, .13, .1, .18); foot.userData.petPaw = side; return foot;
  };
  const tailRoot = new T.Group(); tailRoot.position.set(0, .34, -.2); tailRoot.userData.petTail = id * .7 + 1; body.add(tailRoot);
  // 박쥐 날개: 뼈대 세 줄과 물결 모양 막. 어깨에 붙어 펄럭여요.
  const batWing = (side: number, bone: number, skin: number, x: number, y: number, z: number, size: number) => {
    const wing = new T.Group(); wing.position.set(side * x, y, z); wing.rotation.y = side * -.55; wing.userData.petWing = side; body.add(wing);
    const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(.2, .34); s.lineTo(.56, .44); s.quadraticCurveTo(.48, .3, .54, .14); s.quadraticCurveTo(.42, .17, .37, .02); s.quadraticCurveTo(.27, .08, .21, -.07); s.quadraticCurveTo(.1, -.02, 0, 0);
    const skinMesh = mesh(new T.ShapeGeometry(s, 10), skin, 0, 0, 0, wing); skinMesh.scale.set(side * size, size, 1);
    for (const [bx, by, len] of [[.28, .39, .3], [.27, .19, .28], [.18, .08, .2]] as const) { const rod = ball(wing, bone, side * bx * size * .55, by * size * .55, .01, len * size * .55, .022, .022); rod.rotation.z = side * Math.atan2(by, bx); }
    ball(wing, bone, 0, 0, 0, .05);
    return wing;
  };
  // 아기용 공통 몸: 앞으로 나온 주둥이, 뒤로 누운 뿔, 등 가시, 배 비늘, 박쥐 날개
  const dragon = (main: number, head: number, belly: number, horn: number, wingSkin: number) => {
    ball(body, main, 0, .34, -.02, .38, .32, .42); ball(body, head, 0, .68, .16, .3, .27, .27);
    ball(body, belly, 0, .32, .34, .2, .25, .07); for (let i = 0; i < 4; i++) ball(body, horn, 0, .2 + i * .1, .39 - Math.abs(i - 1.5) * .02, .13 - i * .015, .03, .025);
    ball(body, head, 0, .58, .38, .17, .12, .14); ball(body, belly, 0, .53, .44, .12, .05, .08);
    for (const side of [-1, 1]) {
      ball(body, 0x3d4a3f, side * .06, .62, .51, .022, .016, .012);
      eye(side, .12, .75, .38, 0x2f3a46, 1.15); cheek(side, .2, .6, .4, 0xf1a8b4); paw(side, belly);
      const hornMesh = mesh(new T.ConeGeometry(.06, .26, 8), horn, side * .13, .93, .06, body); hornMesh.rotation.set(-.55, 0, side * -.28);
      const fin = mesh(new T.ConeGeometry(.05, .14, 6), horn, side * .27, .76, .1, body); fin.rotation.z = side * -1.1;
      batWing(side, main, wingSkin, .26, .5, -.14, .95);
    }
    for (let i = 0; i < 5; i++) { const a = Math.PI * (.62 + i * .1), spike = mesh(new T.ConeGeometry(.05, .14, 6), horn, 0, .34 + Math.sin(a) * .3, -.02 + Math.cos(a) * .4, body); spike.rotation.x = -(a - Math.PI / 2) * .9; }
    for (let i = 0; i < 5; i++) { ball(tailRoot, main, 0, .03 + i * .025, -.22 - i * .12, .14 - i * .018, .11 - i * .012, .15); mesh(new T.ConeGeometry(.04 - i * .004, .12, 6), horn, 0, .15 - i * .01, -.22 - i * .12, tailRoot); }
    const tip = mesh(new T.ConeGeometry(.08, .16, 4), horn, 0, .1, -.86, tailRoot); tip.rotation.x = -Math.PI / 2;
  };

  if (id === 0) { // 딸기 햄찌: 통통한 볼, 등 줄무늬, 딸기 배낭
    ball(body, pet.color, 0, .33, 0, .38, .32, .39); ball(body, 0xe7b27d, 0, .59, .18, .3, .27, .27);
    ball(body, 0xffeee1, 0, .33, .34, .24, .21, .08); ball(body, 0xffd2bd, 0, .56, .43, .075, .055, .032);
    for (const side of [-1, 1]) { eye(side, .11, .63, .42); cheek(side, .22, .52, .4); paw(side, 0xffe8d5); ball(body, 0xffd3a0, side * .2, .79, .1, .12); ball(body, 0xfff0d9, side * .18, .79, .18, .06, .075, .025); }
    for (let i = -1; i <= 1; i++) box(body, 0x9b714d, i * .095, .39, -.37, .045, .37, .025);
    ball(tailRoot, 0xf0c092, -.27, .08, -.12, .12, .12, .16);
    ball(body, 0xe95e74, .29, .68, .1, .15, .14, .1); for (let i = 0; i < 4; i++) ball(body, 0xffe9a2, .24 + (i % 2) * .08, .65 + Math.floor(i / 2) * .08, .2, .018);
    for (const side of [-1, 1]) { const leaf = mesh(new T.CircleGeometry(.08, 8), 0x72ad67, .29 + side * .055, .82, .11, body); leaf.scale.y = 1.4; leaf.rotation.z = side * .6; }
  } else if (id === 1) { // 구름 토끼콩: 긴 귀, 구름 털, 리본
    ball(body, pet.color, 0, .34, 0, .33, .34, .37); ball(body, 0xf8f2f5, 0, .62, .18, .29, .28, .26);
    for (let i = 0; i < 5; i++) ball(body, 0xffffff, -.2 + i * .1, .34 + (i % 2) * .08, -.31, .14);
    ball(body, 0xfff7f2, 0, .51, .39, .16, .14, .055); ball(body, 0xf4b9c6, 0, .55, .435, .055, .04, .025);
    for (const side of [-1, 1]) { eye(side, .11, .65, .4, 0x4e5264, 1.08); cheek(side, .21, .54, .38, 0xf2b6c6); paw(side, 0xffffff, .2, .15, .22); const ear = ball(body, pet.color, side * .13, 1.03, .12, .1, .42, .1); ear.rotation.z = side * -.12; ear.userData.petEar = side; const inner = ball(body, 0xffcbd8, side * .13, 1.04, .2, .046, .3, .025); inner.rotation.z = side * -.12; inner.userData.petEar = side; }
    ball(tailRoot, 0xffffff, 0, .06, -.25, .19); ball(body, 0x8fcde4, -.1, .43, .4, .11, .08, .05); ball(body, 0x8fcde4, .1, .43, .4, .11, .08, .05); ball(body, 0xffe6a8, 0, .43, .43, .05);
  } else if (id === 2) { // 숲냥이 모리: 줄무늬 꼬리, 흰 양말, 수염과 방울
    ball(body, pet.color, 0, .34, -.02, .35, .31, .41); ball(body, pet.color, 0, .61, .19, .29, .27, .27);
    ball(body, 0xfff0df, 0, .5, .4, .17, .14, .06); ball(body, 0xd98f90, 0, .54, .445, .052, .035, .024);
    for (const side of [-1, 1]) { eye(side, .105, .66, .42, 0x35574a, 1.04); cheek(side, .21, .54, .39); paw(side, 0xfff0df); const ear = mesh(new T.ConeGeometry(.12, .32, 5), pet.color, side * .17, .91, .13, body); ear.rotation.z = side * -.15; ear.userData.petEar = side; const inner = mesh(new T.ConeGeometry(.055, .18, 5), 0xf5c3c5, side * .15, .88, .21, body); inner.rotation.z = side * -.15; inner.userData.petEar = side; for (const y of [.49, .56]) { const whisker = box(body, 0x8e7569, side * .24, y, .44, .2, .012, .012); whisker.rotation.z = side * (y < .52 ? .12 : -.12); } }
    for (let i = 0; i < 5; i++) { const segment = ball(tailRoot, i % 2 ? 0x8a6654 : pet.color, .04, .03 + i * .035, -.18 - i * .13, .105 - i * .009, .1, .14); segment.rotation.x = -.08 * i; }
    for (const side of [-1, 1]) box(body, 0x795c4e, side * .12, .78, .28, .045, .19, .025).rotation.z = side * -.22;
    const collar = mesh(new T.TorusGeometry(.2, .024, 5, 16), 0x7cc5ac, 0, .47, .19, body); collar.rotation.x = Math.PI / 2; ball(body, 0xffd96a, 0, .39, .42, .065).userData.petCharm = true;
  } else if (id === 3) { // 별부엉이 루루: 목 없는 알 몸, 큰 얼굴 원반과 금빛 눈테, 몸에 붙은 날개, 깃털 귀
    ball(body, pet.color, 0, .48, 0, .4, .46, .36); ball(body, 0xe9def7, 0, .33, .17, .27, .27, .2);
    for (let row = 0; row < 3; row++) for (let i = -1; i <= 1; i++) { const v = ball(body, 0xb9a6d6, i * .09, .42 - row * .085, .35 - row * .01, .04, .018, .014); v.rotation.z = i * .5; }
    for (const side of [-1, 1]) {
      ball(body, 0xf6efff, side * .13, .67, .26, .17, .17, .11); ball(body, 0xf1c867, side * .13, .68, .35, .1, .1, .03); eye(side, .13, .68, .375, 0x2f2640, 1.5);
      const brow = ball(body, 0x806aa4, side * .14, .82, .31, .11, .025, .03); brow.rotation.z = side * .35;
      const tuft = new T.Group(); tuft.position.set(side * .22, .88, .04); tuft.userData.petEar = side; body.add(tuft); const feather = ball(tuft, 0x806aa4, side * .04, .08, 0, .06, .15, .045); feather.rotation.z = side * -.5;
      const wing = new T.Group(); wing.position.set(side * .34, .64, -.02); wing.userData.petWing = side; body.add(wing);
      ball(wing, 0xa08cc1, side * .03, -.17, 0, .1, .25, .17); ball(wing, 0x806aa4, side * .04, -.35, -.04, .07, .11, .11); for (let i = 0; i < 3; i++) ball(wing, 0xd9ccef, side * .1, -.1 - i * .09, .06, .02, .035, .02);
      for (let toe = 0; toe < 3; toe++) ball(body, 0xf2a94e, side * .12 + (toe - 1) * .045, .05, .27, .028, .025, .06);
    }
    const beak = mesh(new T.ConeGeometry(.05, .13, 8), 0xf2a94e, 0, .57, .4, body); beak.rotation.x = Math.PI - .35;
    ball(tailRoot, 0x806aa4, 0, .02, -.16, .16, .07, .14);
    const moon = mesh(new T.TorusGeometry(.12, .032, 6, 16, Math.PI * 1.45), 0xffe789, .27, 1.0, .1, body); moon.rotation.z = -.4; moon.userData.petCharm = true;
  } else if (id === 4) { // 아기용 베리링: 초록 아기용, 머리 위 베리 장식
    dragon(pet.color, 0x82cba0, 0xd8f2bf, 0xf3d77a, 0xbdeccf);
    ball(body, 0xe95e74, .2, .95, .12, .07); ball(body, 0x72ad67, .2, 1.02, .12, .04, .02, .04);
  } else if (id === 5) { // 꿀벌 몽이: 줄무늬 몸, 네 장 날개, 꽃 왕관
    ball(body, 0xf2c94c, 0, .38, -.05, .38, .31, .44); ball(body, 0xf6d95e, 0, .67, .21, .28, .25, .25);
    for (const z of [-.28, -.04, .18]) { const f = Math.sqrt(1 - ((z + .05) / .44) ** 2) * 1.03; ball(body, 0x51463d, 0, .38, z, .38 * f, .31 * f, .045); } // 몸을 감싸는 둥근 줄무늬
    ball(body, 0xffe4a1, 0, .57, .42, .16, .12, .055); ball(body, 0x6f4a31, 0, .58, .465, .05, .035, .025);
    for (const side of [-1, 1]) { eye(side, .105, .71, .42, 0x443a35, 1.08); cheek(side, .2, .58, .39, 0xf1a6a0); const antenna = cylinder(body, 0x4b4036, side * .1, .94, .12, .018, .025, .28, 5); antenna.rotation.z = side * -.28; antenna.userData.petEar = side; ball(body, 0x4b4036, side * .16, 1.05, .12, .05); for (let wingIndex = 0; wingIndex < 2; wingIndex++) { const wing = mesh(new T.CircleGeometry(wingIndex ? .16 : .23, 10), wingIndex ? 0xd9f3ed : 0xfff2c5, side * (.27 + wingIndex * .09), .53 - wingIndex * .18, -.09, body); wing.scale.y = wingIndex ? 1.25 : 1.5; wing.rotation.z = side * (.5 + wingIndex * .12); wing.userData.petWing = side; } for (let leg = 0; leg < 3; leg++) { const tinyLeg = cylinder(body, 0x5a4a3f, side * (.2 + leg * .04), .2 + leg * .06, .02 - leg * .11, .012, .015, .22, 5); tinyLeg.rotation.z = side * -.62; } }
    const stinger = mesh(new T.ConeGeometry(.06, .2, 5), 0x51463d, 0, .34, -.48, body); stinger.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 5; i++) ball(body, i % 2 ? 0xffffff : 0xffdf64, Math.cos(i * 1.26) * .18, .91 + Math.sin(i * 1.26) * .14, .08, .055); ball(body, 0x9a6d42, 0, .91, .09, .06);
  } else if (id === 6) { // 해바라기 여우: 큰 꽃꼬리, 흰 가슴털, 검은 발끝
    ball(body, pet.color, 0, .34, -.02, .37, .31, .42); ball(body, 0xedae68, 0, .65, .19, .3, .27, .29);
    ball(body, 0xffedda, 0, .5, .41, .18, .14, .06); ball(body, 0x4d4138, 0, .54, .465, .055, .04, .025); ball(body, 0xffedda, 0, .3, .38, .16, .22, .05);
    for (const side of [-1, 1]) { eye(side, .11, .7, .43, 0x44392f, 1.08); cheek(side, .22, .57, .4, 0xf2a3a0); paw(side, 0x55473c); const ear = mesh(new T.ConeGeometry(.14, .4, 5), pet.color, side * .18, .97, .12, body); ear.rotation.z = side * -.18; ear.userData.petEar = side; const inner = mesh(new T.ConeGeometry(.065, .23, 5), 0xf4b0a1, side * .16, .93, .2, body); inner.rotation.z = side * -.18; inner.userData.petEar = side; }
    for (let i = 0; i < 6; i++) ball(tailRoot, i < 4 ? pet.color : 0xffedda, .08 * Math.sin(i * .55), .03 + i * .06, -.18 - i * .14, .2 - i * .012, .18, .2);
    ball(body, 0x8c6744, .23, .88, .16, .12); for (let i = 0; i < 10; i++) ball(body, i % 2 ? 0xffdf55 : 0xf6bd3f, .23 + Math.cos(i * Math.PI / 5) * .18, .88 + Math.sin(i * Math.PI / 5) * .18, .14, .055, .09, .04);
    for (let i = 0; i < 5; i++) ball(body, i % 2 ? 0xf6cb45 : 0xe5a344, Math.cos(i * 1.26) * .22, .38 + Math.sin(i * 1.26) * .19, -.37, .1, .13, .08);
  } else if (id === 7) { // 도토리 다람쥐 콩이: 도토리 모자, 볼주머니, 크게 말린 복슬 꼬리, 도토리 안은 앞발
    ball(body, pet.color, 0, .33, -.02, .36, .32, .4); ball(body, pet.color, 0, .62, .18, .29, .27, .27); ball(body, 0xffe9c9, 0, .3, .37, .2, .22, .05);
    ball(body, 0xffe9c9, 0, .5, .4, .16, .13, .06); ball(body, 0x4d3a2e, 0, .54, .445, .05, .036, .024);
    for (const side of [-1, 1]) {
      eye(side, .105, .67, .41, 0x3d2f27, 1.08); cheek(side, .22, .55, .38, 0xf2a3a0); ball(body, 0xe0a56e, side * .2, .5, .3, .1, .09, .09); paw(side, 0xffe9c9, .15, .27, .38);
      const ear = mesh(new T.ConeGeometry(.095, .26, 5), pet.color, side * .2, .91, .08, body); ear.rotation.z = side * -.2; ear.userData.petEar = side;
      const tuft = mesh(new T.ConeGeometry(.03, .1, 5), 0x7a4a2b, side * .21, 1.06, .08, body); tuft.rotation.z = side * -.2; tuft.userData.petEar = side;
    }
    ball(body, 0x8a5a36, 0, .93, .14, .24, .1, .24); ball(body, 0xc99562, 0, .86, .14, .2, .06, .2); cylinder(body, 0x6b4a2d, 0, 1.03, .14, .012, .018, .09, 5);
    ball(body, 0x9a6a3c, 0, .28, .44, .07, .09, .07);
    for (let i = 0; i < 6; i++) ball(tailRoot, i < 4 ? pet.color : 0xffe2b8, 0, .08 + i * .12, -.1 - Math.sin(i * .5) * .2, .2 - i * .005, .17, .2);
  } else if (id === 8) { // 이신비의 별: 반짝이는 금빛 별 몸통, 졸린 듯 귀여운 얼굴, 별가루와 빛 고리
    const k = .6, cy = .6;
    const outline = new T.Shape();
    for (let i = 0; i < 10; i++) { const radius = (i % 2 ? .3 : .68) * k, angle = Math.PI / 2 + i * Math.PI / 5, x = Math.cos(angle) * radius, y = Math.sin(angle) * radius; if (i === 0) outline.moveTo(x, y); else outline.lineTo(x, y); }
    outline.closePath();
    mesh(new T.ExtrudeGeometry(outline, { depth: .2, bevelEnabled: true, bevelThickness: .05, bevelSize: .045, bevelSegments: 2 }), pet.color, 0, cy, -.1, body);
    ball(body, 0xffe27a, 0, cy, 0, .2, .2, .13); ball(body, 0xfffbe0, -.13, cy + .24, .16, .06, .03, .015);
    for (const side of [-1, 1]) { eye(side, .08, cy + .04, .17, 0x6b4a1f, .95); cheek(side, .16, cy - .07, .165, 0xff9f8a); }
    ball(body, 0x8a5a24, 0, cy - .09, .175, .035, .018, .012);
    mesh(new T.TorusGeometry(.62, .012, 6, 40), 0xfff3b0, 0, cy, -.2, body);
    for (let i = 0; i < 6; i++) { const sparkle = ball(body, i % 2 ? 0xffffff : 0xfff0a8, Math.cos(i * 1.05 + .4) * .6, cy + Math.sin(i * 1.05 + .4) * .52, -.1, .035); sparkle.userData.petCharm = true; }
  } else if (id === 9) { // 달빛 수달 모모: 넓은 꼬리, 반달 가방, 물방울 장식
    ball(body, pet.color, 0, .34, -.03, .4, .27, .46); ball(body, pet.color, 0, .67, .2, .3, .27, .29);
    ball(body, 0xffedcf, 0, .33, .39, .22, .19, .055); ball(body, 0xffedcf, 0, .57, .42, .18, .13, .055); ball(body, 0x5a4035, 0, .6, .475, .052, .035, .025);
    for (const side of [-1, 1]) { eye(side, .105, .72, .43, 0x263e48, 1.08); cheek(side, .21, .59, .405, 0xf2a6a4); paw(side, 0x9fd3d7, .22, .18, .22); ball(body, pet.color, side * .23, .88, .12, .105); ball(body, 0xe8c6ad, side * .23, .88, .19, .055); }
    for (let i = 0; i < 6; i++) { const tail = ball(tailRoot, i < 4 ? 0x5f9eaa : 0xa8d9df, 0, .02 + i * .025, -.2 - i * .14, .17 - i * .01, .1, .2); tail.rotation.x = -.05 * i; }
    const moon = mesh(new T.TorusGeometry(.13, .035, 5, 16, Math.PI * 1.5), 0xffe58a, -.25, .79, .2, body); moon.rotation.z = -.55; moon.userData.petCharm = true;
    for (let i = 0; i < 3; i++) { const drop = ball(body, 0xbcecff, .32 + i * .08, .47 + i * .12, -.12, .05 - i * .008); drop.userData.petCharm = true; }
  } else if (id === 10) { // 무지개 알파카 포포: 겨울 목, 구름 털, 색동 안장
    ball(body, 0xece2d2, 0, .35, -.04, .43, .32, .47); for (const x of [-.25, 0, .25]) for (const y of [.27, .48]) ball(body, x === 0 && y > .4 ? 0xffffff : pet.color, x, y, -.25, .22);
    ball(body, 0xead9c4, 0, .66, .02, .17, .36, .18); ball(body, pet.color, 0, .93, .18, .3, .28, .28); ball(body, 0xfff0dc, 0, .82, .42, .17, .13, .06); ball(body, 0xb98177, 0, .85, .475, .05, .035, .025);
    for (const side of [-1, 1]) { eye(side, .105, .98, .43, 0x493c46, 1.12); cheek(side, .21, .84, .4, 0xf4aeba); const ear = mesh(new T.ConeGeometry(.095, .28, 5), 0xd8c3aa, side * .2, 1.22, .11, body); ear.rotation.z = side * -.32; ear.userData.petEar = side; paw(side, side < 0 ? 0xe89d9d : 0x79c9c4, .23, .13, .18); }
    for (let i = 0; i < 5; i++) ball(body, [0xef8b91, 0xf4c45d, 0x79c9c4, 0x82a9df, 0xb38ad7][i], -.28 + i * .14, .5, .37, .09, .045, .03);
    for (let i = 0; i < 5; i++) { const tuft = ball(body, i % 2 ? 0xffffff : 0xf4ecdf, -.18 + i * .09, 1.18 + (i % 2) * .07, .16, .115); tuft.userData.petCharm = true; }
    for (let i = 0; i < 3; i++) ball(tailRoot, 0xffffff, 0, .08 + i * .05, -.18 - i * .09, .15 - i * .025);
  } else if (id === HERO_BREAD_PET_ID) { // 호빵 별용사 팡팡: 독자적인 빵 영웅, 산호빛 볼과 남색 별망토
    ball(body, 0x3e436f, 0, .39, -.08, .34, .34, .3); // 영웅복
    ball(body, pet.color, 0, .78, .18, .43, .42, .3); ball(body, 0xefc28d, 0, .81, .31, .34, .33, .13); // 두 겹의 호빵 얼굴
    for (const side of [-1, 1]) {
      eye(side, .13, .88, .46, 0x3b2a2a, 1.18); ball(body, 0xf06f67, side * .25, .73, .42, .12, .095, .045);
      const glove = ball(body, 0xffd85d, side * .38, .42, .15, .14, .13, .15); glove.userData.petPaw = side;
      const boot = ball(body, 0x75d8cc, side * .17, .12, .08, .15, .1, .2); boot.rotation.z = side * .12; boot.userData.petPaw = side;
      const cape = mesh(new T.CircleGeometry(.36, 8), 0x564077, side * .22, .46, -.3, body); cape.scale.set(.75, 1.25, 1); cape.rotation.z = side * .22; cape.userData.petWing = side;
    }
    ball(body, 0xe85b58, 0, .79, .47, .1, .085, .05); const smile = mesh(new T.TorusGeometry(.095, .018, 5, 16, Math.PI), 0x7c3d45, 0, .67, .47, body); smile.rotation.z = Math.PI;
    const badge = mesh(new T.OctahedronGeometry(.11), 0xffe376, 0, .43, .28, body); badge.scale.y = 1.18; badge.userData.petCharm = true;
    const belt = box(body, 0xf1c75d, 0, .3, .18, .6, .075, .06); belt.rotation.x = -.08; box(body, 0xffffff, 0, .3, .225, .11, .1, .035);
    const halo = mesh(new T.TorusGeometry(.31, .028, 6, 24), 0xffef9a, 0, 1.25, .03, body); halo.rotation.x = Math.PI / 2; halo.userData.petCharm = true;
    for (let i = 0; i < 5; i++) { const star = mesh(new T.OctahedronGeometry(.055), i % 2 ? 0xffffff : 0xffde6b, Math.cos(i * 1.26) * .5, .72 + Math.sin(i * 1.26) * .45, -.15, body); star.userData.petCharm = true; }
  } else if (id === 12) { // 별구름 아기새 루미: 구름 몸, 겹날개, 별 깃털
    for (let i = 0; i < 5; i++) ball(body, i % 2 ? 0xffffff : pet.color, -.2 + i * .1, .43 + (i % 2) * .08, -.04, .22, .19, .22);
    ball(body, 0xf5f9ff, 0, .72, .2, .29, .27, .27); ball(body, 0xffd57a, 0, .63, .47, .075, .055, .12);
    for (const side of [-1, 1]) {
      eye(side, .105, .76, .43, 0x39455d, 1.12); cheek(side, .2, .65, .4, 0xf1aebe);
      const wing = new T.Group(); wing.position.set(side * .3, .48, -.04); wing.rotation.z = side * .38; wing.userData.petWing = side; body.add(wing);
      for (let feather = 0; feather < 3; feather++) { const plume = mesh(new T.CircleGeometry(.2 - feather * .025, 12), [0xffffff, 0xc8e4ff, 0x9fc7f2][feather], side * feather * .08, -.08 * feather, 0, wing); plume.scale.y = 1.55; plume.rotation.z = side * .22; }
      const tuft = mesh(new T.ConeGeometry(.06, .21, 5), 0xc4dcfa, side * .1, 1.0, .1, body); tuft.rotation.z = side * -.28;
    }
    for (let i = -1; i <= 1; i++) { const feather = mesh(new T.ConeGeometry(.09, .34, 5), i === 0 ? 0xa9d2f3 : 0xeaf5ff, i * .12, .35, -.36, body); feather.rotation.x = -1.08; }
    const star = mesh(new T.OctahedronGeometry(.11), 0xffdf6f, .26, .94, .12, body); star.userData.petCharm = true;
  } else if (id === 13) { // 달빛 아기용 세라: 보랏빛 아기용, 달빛 날개와 초승달 장식
    dragon(pet.color, 0xa998e1, 0xe7ddff, 0xffe8a6, 0xd6ccff);
    const moon = mesh(new T.TorusGeometry(.13, .036, 6, 18, Math.PI * 1.5), 0xffe990, .26, 1.02, .16, body); moon.rotation.z = -.55; moon.userData.petCharm = true;
  } else if (id === 14) { // 오로라 날개고양이 나비: 고양이 얼굴과 무지개 세 겹 날개
    ball(body, pet.color, 0, .37, -.02, .38, .32, .42); ball(body, 0x9ce3d6, 0, .69, .2, .3, .28, .29); ball(body, 0xf1fff9, 0, .56, .42, .17, .14, .06);
    for (const side of [-1, 1]) {
      eye(side, .11, .76, .43, 0x2f4c55, 1.13); cheek(side, .22, .61, .4, 0xf2a6be); paw(side, 0xf1fff9);
      const ear = mesh(new T.ConeGeometry(.14, .4, 5), pet.color, side * .19, 1.02, .12, body); ear.rotation.z = side * -.17;
      const inner = mesh(new T.ConeGeometry(.065, .22, 5), 0xf5bad2, side * .17, .98, .21, body); inner.rotation.z = side * -.17;
      const wing = new T.Group(); wing.position.set(side * .35, .53, -.14); wing.rotation.z = side * .4; wing.userData.petWing = side; body.add(wing);
      const colors = [0xffb7d3, 0xbccaff, 0x9ce7da];
      for (let feather = 0; feather < 3; feather++) { const plume = mesh(new T.CircleGeometry(.26 - feather * .025, 14), colors[feather], side * feather * .11, -.1 * feather, 0, wing); plume.scale.y = 1.65; plume.rotation.z = side * .3; }
    }
    for (let i = 0; i < 6; i++) ball(tailRoot, [0x86d7cf, 0xa8dce8, 0xcabef1][i % 3], .08 * Math.sin(i * .6), .04 + i * .065, -.18 - i * .13, .18 - i * .01, .15, .19);
    const crown = mesh(new T.TorusGeometry(.22, .025, 5, 22), 0xffea96, 0, 1.18, .05, body); crown.rotation.x = Math.PI / 2; crown.userData.petCharm = true;
    for (let i = 0; i < 5; i++) { const sparkle = mesh(new T.OctahedronGeometry(.045), i % 2 ? 0xffffff : 0xffe47d, Math.cos(i * 1.257) * .48, .72 + Math.sin(i * 1.257) * .4, -.12, body); sparkle.userData.petCharm = true; }
  } else if (id === 15) { // 복숭아 너구리 보보: 눈가 가면 무늬, 둥근 귀, 고리 무늬 꼬리, 복숭아 주머니
    ball(body, pet.color, 0, .34, -.02, .38, .32, .4); ball(body, pet.color, 0, .65, .18, .32, .27, .28); ball(body, 0xfff1e4, 0, .3, .35, .2, .2, .06);
    ball(body, 0xfff1e4, 0, .56, .4, .17, .12, .08); ball(body, 0x3d302c, 0, .59, .48, .055, .038, .026);
    for (const side of [-1, 1]) {
      const mask = ball(body, 0x5a4440, side * .12, .68, .38, .12, .075, .04); mask.rotation.z = side * -.28; eye(side, .12, .685, .42, 0x1f1a19, 1.1);
      ball(body, 0xfff1e4, side * .13, .78, .36, .08, .03, .03); cheek(side, .23, .56, .37); paw(side, 0x5a4440);
      const ear = new T.Group(); ear.position.set(side * .21, .87, .08); ear.userData.petEar = side; body.add(ear); ball(ear, pet.color, 0, 0, 0, .1, .11, .06); ball(ear, 0x5a4440, 0, 0, .04, .055, .06, .03);
    }
    for (let i = 0; i < 6; i++) ball(tailRoot, i % 2 ? 0x5a4440 : pet.color, 0, .06 + i * .05, -.16 - i * .11, .17 - i * .008, .16, .13);
    const strap = box(body, 0xc77b5f, 0, .46, .35, .045, .62, .02); strap.rotation.z = .75;
    ball(body, 0xffb3a0, -.3, .27, .2, .13, .12, .12); ball(body, 0xff8f86, -.3, .27, .28, .06, .1, .05); const leaf = mesh(new T.CircleGeometry(.06, 10), 0x72ad67, -.27, .4, .22, body); leaf.scale.y = 1.6; leaf.rotation.z = -.7;
  } else if (id === 16) { // 민들레 강아지 단추: 늘어진 귀, 혀, 눈가 얼룩, 민들레 솜털 꼬리
    ball(body, pet.color, 0, .34, -.02, .37, .31, .41); ball(body, pet.color, 0, .65, .18, .3, .27, .27); ball(body, 0xfff3df, 0, .3, .35, .19, .21, .06);
    ball(body, 0xfff3df, 0, .55, .4, .17, .12, .1); ball(body, 0x3a2c28, 0, .6, .5, .06, .045, .03); ball(body, 0xf28a95, 0, .47, .46, .045, .055, .02);
    ball(body, 0xc99a55, .12, .7, .37, .1, .09, .05);
    for (const side of [-1, 1]) {
      eye(side, .11, .7, .42, 0x2d2622, 1.12); cheek(side, .21, .57, .39); paw(side, 0xfff3df);
      const ear = ball(body, 0xc99a55, side * .29, .66, .14, .09, .2, .11); ear.rotation.z = side * .3;
    }
    cylinder(tailRoot, pet.color, 0, .14, -.12, .04, .05, .26, 8).rotation.x = -.6;
    ball(tailRoot, 0xffffff, 0, .3, -.26, .16); for (let i = 0; i < 8; i++) { const seed = ball(tailRoot, 0xfffbe9, Math.cos(i * .785) * .16, .3 + Math.sin(i * .785) * .16, -.26, .035); seed.userData.petCharm = true; }
    for (let i = 0; i < 8; i++) ball(body, 0xf4d35c, .19 + Math.cos(i * .785) * .07, .9 + Math.sin(i * .785) * .07, .2, .04, .04, .02); ball(body, 0xe0a52c, .19, .9, .21, .035);
  } else if (id === 17) { // 구름양 아기 메에: 몽실 털뭉치 몸, 크림색 얼굴, 옆으로 난 귀, 말린 뿔
    ball(body, pet.color, 0, .38, -.04, .36, .3, .38);
    for (const [x, y, z] of [[-.25, .42, .02], [.25, .42, .02], [0, .6, -.1], [-.18, .56, -.22], [.18, .56, -.22], [0, .42, -.32], [-.27, .3, -.18], [.27, .3, -.18], [0, .62, .1]] as const) ball(body, 0xffffff, x, y, z, .19);
    ball(body, 0xf6dcc8, 0, .62, .3, .21, .2, .19);
    for (const [x, y] of [[-.11, .82], [0, .86], [.11, .82]] as const) ball(body, 0xffffff, x, y, .26, .1);
    ball(body, 0xc98f8f, 0, .56, .48, .04, .025, .02);
    for (const side of [-1, 1]) {
      eye(side, .08, .66, .46, 0x3a3238, 1.05); cheek(side, .14, .57, .44);
      const ear = new T.Group(); ear.position.set(side * .25, .66, .24); ear.userData.petEar = side; body.add(ear); const flap = ball(ear, 0xf6dcc8, side * .04, 0, 0, .12, .05, .07); flap.rotation.z = side * -.3; ball(ear, 0xf3b9c0, side * .05, 0, .03, .07, .025, .04);
      const horn = mesh(new T.TorusGeometry(.065, .026, 8, 14, Math.PI * 1.5), 0xf5d38a, side * .19, .8, .24, body); horn.rotation.set(0, side * .4, side > 0 ? 0 : Math.PI);
      paw(side, 0xb59a8a, .19, .1, .2);
    }
    ball(tailRoot, 0xffffff, 0, .06, -.2, .12);
  } else if (id === 18) { // 무지개 해파리 젤리: 반구 갓, 무지개 테두리, 흔들리는 촉수
    const glow = new T.MeshStandardMaterial({ color: pet.color, roughness: .3, emissive: pet.color, emissiveIntensity: .18 });
    const bell = new T.Mesh(new T.SphereGeometry(.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glow); bell.position.set(0, .52, 0); bell.castShadow = true; body.add(bell);
    const under = mesh(new T.CircleGeometry(.41, 32), 0xc8f0f4, 0, .515, 0, body); under.rotation.x = Math.PI / 2;
    const rainbow = [0xffb3c7, 0xffd98a, 0xbdf0a8, 0x9fdcf5, 0xc9b6f2];
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ball(body, rainbow[i % 5], Math.cos(a) * .4, .5, Math.sin(a) * .4, .075, .05, .075); }
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + .5; ball(body, 0xe9fbff, Math.cos(a) * .18, .86 + (i % 2) * .02, Math.sin(a) * .18 - .05, .06, .035, .06); }
    ball(body, 0xfffbe8, -.14, .82, .22, .07, .035, .035);
    for (const side of [-1, 1]) { eye(side, .11, .68, .38, 0x2b3b48, 1.15); cheek(side, .2, .62, .36, 0xf6a9c0); }
    const smile = mesh(new T.TorusGeometry(.04, .012, 6, 12, Math.PI), 0x2b3b48, 0, .62, .395, body); smile.rotation.z = Math.PI;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3, strand = new T.Group(); strand.position.set(Math.cos(a) * .22, .48, Math.sin(a) * .22); strand.userData.petEar = i % 2 ? 1 : -1; body.add(strand); for (let k = 0; k < 4; k++) ball(strand, rainbow[(i + k) % 5], Math.sin(k * 1.4 + i) * .035, -.08 - k * .1, 0, .045 - k * .006, .065, .045 - k * .006); }
  } else if (id === 19) { // 별꼬리 여우 라온: 밤하늘색 여우, 금빛 별이 달린 큰 꼬리, 별가루 날개
    ball(body, pet.color, 0, .36, -.02, .37, .31, .42); ball(body, 0x9aa2e6, 0, .67, .19, .3, .27, .29);
    ball(body, 0xf4f1ff, 0, .52, .41, .18, .14, .07); ball(body, 0x2e2a4a, 0, .56, .47, .055, .04, .025); ball(body, 0xf4f1ff, 0, .32, .36, .16, .22, .06);
    for (const side of [-1, 1]) {
      eye(side, .11, .72, .43, 0x262244, 1.1); cheek(side, .22, .59, .4, 0xf2a6c8); paw(side, 0x3c3770);
      const ear = mesh(new T.ConeGeometry(.14, .4, 8), pet.color, side * .18, .99, .12, body); ear.rotation.z = side * -.18; ear.userData.petEar = side;
      const inner = mesh(new T.ConeGeometry(.065, .23, 8), 0xd9c9ff, side * .16, .95, .2, body); inner.rotation.z = side * -.18; inner.userData.petEar = side;
      const wing = new T.Group(); wing.position.set(side * .3, .5, -.12); wing.userData.petWing = side; body.add(wing);
      for (let feather = 0; feather < 3; feather++) { const plume = mesh(new T.CircleGeometry(.18 - feather * .03, 14), [0xe3e6ff, 0xb9c1f5, 0x8c95e0][feather], side * feather * .09, -.07 * feather, 0, wing); plume.scale.y = 1.5; plume.rotation.z = side * .3; }
    }
    for (let i = 0; i < 6; i++) ball(tailRoot, i < 4 ? pet.color : 0xb8bff2, .06 * Math.sin(i * .6), .05 + i * .075, -.16 - i * .12, .19 - i * .012, .17, .19);
    const star = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .07 : .16, a = Math.PI / 2 + i * Math.PI / 5; if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    const tipStar = mesh(new T.ExtrudeGeometry(star, { depth: .06, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 }), 0xffd75e, 0, .58, -.86, tailRoot); tipStar.userData.petCharm = true;
    for (let i = 0; i < 5; i++) { const dust = mesh(new T.OctahedronGeometry(.035), i % 2 ? 0xffffff : 0xffe58a, Math.cos(i * 1.26) * .45, .65 + Math.sin(i * 1.26) * .35, -.1, body); dust.userData.petCharm = true; }
  } else { // 예비: 새 펫을 추가하면 기본 몸으로 보여요
    ball(body, pet.color, 0, .35, -.02, .4, .34, .32); ball(body, pet.color, 0, .68, .2, .3, .28, .28);
    ball(body, 0xffefdc, 0, .55, .42, .17, .14, .06); ball(body, 0x5a4541, 0, .58, .47, .052, .035, .025);
    for (const side of [-1, 1]) { eye(side, .11, .74, .43, 0x38424a, 1.12); cheek(side, .22, .61, .4); paw(side, pet.color); }
  }
  // 빛나는 목걸이와 이름표는 펫들의 공통 모험 장비예요. (몸 자체가 장식인 펫은 제외)
  if (![2, 3, 8, 18, HERO_BREAD_PET_ID].includes(id)) { const collar = mesh(new T.TorusGeometry(.2, .024, 5, 16), id > 2 ? 0xbbeeff : 0xf4d478, 0, .48, .18, body); collar.rotation.x = Math.PI / 2; }
  if (![2, 8, 18, HERO_BREAD_PET_ID].includes(id)) { const charm = mesh(new T.OctahedronGeometry(.065), id > 2 ? 0xbbeeff : 0xffd788, 0, .38, .44, body); charm.userData.petCharm = true; }
  g.position.set(-1.05, .02, -.7); g.userData.petModel = true; g.userData.petBody = body; return g;
}

function makeHeroPetAura(ride: number) {
  const aura = new T.Group(); aura.position.y = ride >= 0 ? riderHeight(ride) : 0; aura.userData.heroPetAura = true;
  const floorRing = mesh(new T.TorusGeometry(.75, .035, 6, 30), 0xffd75e, 0, .12, 0, aura); floorRing.rotation.x = Math.PI / 2; floorRing.userData.heroAuraRing = 1;
  const skyRing = mesh(new T.TorusGeometry(.58, .025, 6, 26), 0xfff5bd, 0, 1.12, 0, aura); skyRing.rotation.x = Math.PI / 2; skyRing.userData.heroAuraRing = -1;
  for (let i = 0; i < 8; i++) {
    const sparkle = mesh(new T.OctahedronGeometry(i % 2 ? .055 : .075), i % 2 ? 0xffffff : 0xffdf6f, Math.cos(i * Math.PI / 4) * .82, .58 + (i % 3) * .3, Math.sin(i * Math.PI / 4) * .82, aura);
    sparkle.userData.heroAuraSparkle = i;
  }
  return aura;
}

const FOREST_PALETTES: Partial<Record<ForestKind, { sky: number; ground: number; accent: number; foliage: number }>> = {
  multiplication: { sky: 0xffe7b8, ground: 0xe7d99b, accent: 0xf2bd72, foliage: 0x8dbb65 },
  addition: { sky: 0xfdf0c8, ground: 0xdbe8a4, accent: 0xea9a86, foliage: 0x7dbd5d },
  subtraction: { sky: 0xf8dcc0, ground: 0xe6c993, accent: 0xd9894a, foliage: 0xd98a44 },
};
const FOREST_GATES: Record<ForestKind, number> = { division: 0xc087d2, multiplication: 0xe5a743, addition: 0xe86f68, subtraction: 0xd98a44 };

export class World {
  scene = new T.Scene(); renderer: T.WebGLRenderer; camera: T.OrthographicCamera;
  player = new T.Group(); private entities: Entity[] = []; private coins: { mesh: T.Group; id: number; y: number }[] = []; private stars: { mesh: T.Group; id: number; y: number; label: HTMLDivElement }[] = [];
  private colliders: { x: number; z: number; r: number; id?: string }[] = []; private platforms = stagePlatforms(0); stage = 0; forest: ForestKind = 'division';
  private keys = new Set<string>(); private stick = { x: 0, z: 0 }; private clock = new T.Clock(); private time = 0; private vy = 0; private grounded = true;
  private particles: { mesh: T.Mesh; v: T.Vector3; life: number }[] = []; private lastSafe = new T.Vector3(0, 0, 8); private follow = new T.Vector3(0, 0, 1);
  private weatherKind: 'none' | 'rain' | 'snow' | 'leaves' | 'fireflies' = 'none';
  private lowQuality = false;
  private weatherMesh: T.InstancedMesh | null = null;
  private weatherDrops: { x: number; y: number; z: number; speed: number; sway: number; phase: number }[] = [];
  private weatherDummy = new T.Object3D();
  private sun: T.DirectionalLight; private labelLayer: HTMLDivElement; private selectedId: string | null = null;
  private guideTarget: { object: T.Object3D; name: string; arrivalDistance: number } | null = null; private guideElement: HTMLDivElement;
  private swingUntil = 0; private rideIndex = -1; private petIndex = -1; private petModel: T.Group | null = null; private petTargetId: number | null = null; private animationRunning = false;
  private rideAnimated: T.Object3D[] = []; private butterflies: T.Object3D[] = []; private furnitureRoot: T.Group | null = null;
  private trailScenery: T.Group | null = null; private trailNext = 0;
  private storyScenery: T.Group | null = null; private restoredBridge = false;
  private storyActivityRoot: T.Group | null = null; private activityMarkers: { at: T.Vector3; label: HTMLDivElement }[] = [];
  private storyActivityFocus: T.Vector3 | null = null; private craftAnimated: T.Object3D[] = [];
  private petIdle = 0; private petWalk = 0; private petMotion = false; private petEating = false;
  private petReaction: PetReaction | null = null; private petReactUntil = 0; private petCharm: T.Group | null = null;
  private petAnimated: T.Object3D[] = [];
  onPetWalk = (_distance: number) => {};
  private shadowSweep = 0; private tempScale = new T.Vector3(); private tempSphere = new T.Sphere();
  private tempProjection = new T.Vector3(); private tempTarget = new T.Vector3(); private tempWorld = new T.Vector3(); private cameraTarget = new T.Vector3();
  inHomestead=false; private homeRoot:T.Group|null=null; private homeSave:Save|null=null; private homeTargets:ReturnType<typeof visitorTargets>=[]; private discoveryRoot:T.Group|null=null;
  private homeVisitors:{entity:Entity;cell:number;path:number[];pause:number;turn:number;kind:number}[]=[];
  active = false; paused = true; inRoom = false; onCollect = (_id: number) => {}; onStar = (_id: number) => {}; onInteract = (_id: string) => {}; onAttack = (_id: string | null) => {}; onNear = (_name: string | null, _id: string | null) => {}; onJump = () => {}; onRescue = () => {}; onStageLoaded = (_stage: number) => {};
  constructor(private container: HTMLElement) {
    this.scene.background = new T.Color(0xd0eade); this.scene.fog = new T.Fog(0xd0eade, 58, 112);
    const touchDevice = matchMedia('(pointer: coarse)').matches;
    this.renderer = new T.WebGLRenderer({ antialias: !touchDevice, alpha: false, powerPreference: 'high-performance' }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, touchDevice ? 1 : 1.25)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = touchDevice ? T.PCFShadowMap : T.PCFSoftShadowMap; /* 태블릿·휴대폰은 가벼운 그림자 */ this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.35; container.append(this.renderer.domElement);
    this.camera = new T.OrthographicCamera(-18, 18, 14, -14, .1, 140);
    this.scene.add(new T.HemisphereLight(0xfff9e6, 0x74905a, 2.35)); this.sun = new T.DirectionalLight(0xffedcf, 2.8); this.sun.position.set(-15, 30, 15); this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024); Object.assign(this.sun.shadow.camera, { left: -34, right: 34, top: 32, bottom: -30, far: 85 }); this.sun.shadow.normalBias = .06; this.scene.add(this.sun);
    const fill = new T.DirectionalLight(0xd8f3ff, .7); fill.position.set(18, 12, -14); this.scene.add(fill);
    this.labelLayer = document.createElement('div'); this.labelLayer.className = 'world-labels'; container.append(this.labelLayer);
    this.guideElement = document.createElement('div'); this.guideElement.className = 'navigation-guide'; this.guideElement.hidden = true; this.guideElement.innerHTML = '<span aria-hidden="true">➜</span><div><b></b><small></small></div>'; container.append(this.guideElement);
    this.buildVillage(); this.mergeStaticScenery(); this.setAvatar(0, 0, 0); this.player.position.set(0, 0, 8); this.scene.add(this.player);
    window.addEventListener('resize', () => { this.resize(); this.renderOnce(); }); this.resize();
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearInput(); this.syncAnimation(); });
    // 한글 입력 상태에서는 W가 'ㅈ'으로 들어와요. 글자(e.key) 대신 자판 위치(e.code)로 읽어 한/영 상태와 상관없이 움직여요.
    const keyOf = (e: KeyboardEvent) => ({ KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyE: 'e', KeyF: 'f', ArrowUp: 'arrowup', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft', ArrowRight: 'arrowright', Space: ' ' } as Record<string, string>)[e.code] ?? e.key.toLowerCase();
    window.addEventListener('keydown', e => { if (!this.active || this.paused || this.storyActivityFocus || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return; const key = keyOf(e); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault(); this.keys.add(key); if (!e.repeat && key === ' ') this.jump(); if (!e.repeat && key === 'e') this.interact(); if (!e.repeat && key === 'f') this.attack(); });
    window.addEventListener('keyup', e => this.keys.delete(keyOf(e))); window.addEventListener('blur', () => this.clearInput()); document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearInput(); });
    this.renderOnce();
  }
  private buildVillage(theme: VillageTheme = VILLAGE_THEMES.division) {
    this.scene.background = new T.Color(theme.sky); this.scene.fog = new T.Fog(theme.sky, 58, 112);
    box(this.scene, theme.ground, 0, -.55, 0, 51, 1.1, 41); box(this.scene, theme.groundDeep, 0, -1.3, 0, 50, .5, 40);
    // Main paths and circular village square.
    box(this.scene, theme.path, 0, .015, 2, 3.8, .055, 34); box(this.scene, theme.path, 0, .02, -3.8, 25, .06, 3.8); box(this.scene, theme.path, 6, .018, 9, 15, .05, 3);
    cylinder(this.scene, theme.square, 0, .04, 3, 4.3, 4.3, .07, 40);
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
    const mailbox = new T.Group(); box(mailbox, 0xe59687, 0, 1.1, 0, .72, .95, .5); cylinder(mailbox, 0x81624b, 0, .45, 0, .09, .11, .9, 7); box(mailbox, 0xffe6a3, .25, 1.1, .28, .12, .12, .04); ball(mailbox, 0xfff1b1, 0, 1.66, 0, .15); this.addEntity('storyMailbox', '숲속 우체통 · 편지 대모험', -6.1, -4.9, mailbox);
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
    this.addEntity('shepherd', '가현이 · 구름양 목장주인', -5.4, 3, makeCharacter(0, 21, 3, 0, 0, 6, 7));
    this.addEntity('weapon', '강지후 · 무기 상점', -8, -3.8, makeCharacter(1, 6, 1));
    this.addEntity('outfit', '오지후 · 의상 상점', -3.8, -7, makeCharacter(2, 4, 2));
    this.addEntity('ride', '나현이 · 라이딩 상점', 14, -5.5, makeCharacter(0, 10, 6));
    this.addEntity('pet', '윤준 · 펫 상점', 18.5, -3.5, makeCharacter(1, 12, 10));
    this.addEntity('potion', '박준우 · 물약 상점', 8, -1.8, makeCharacter(0, 16, 12));
    this.addEntity('beauty', '가영이 · 헤어와 얼굴 꾸미기', -15.5, -4.2, makeCharacter(2, 15, 2));
    this.addEntity('arena', '신비 · 대련장', 0, -9, makeCharacter(3, 5, 3));
    this.addEntity('room', '나의 집 · 들어가기', 9, -4.5, this.gate(0xe5ad79));
    stageMonsters(0).forEach((m, i) => { const at = villageMonsterSpot(i, m.x, m.z); this.addEntity(`monster${i}`, MONSTERS[m.type].name, at.x, at.z, makeMonster(m.type)); });
    this.addEntity('journey', '수학 모험의 문 · 1~6학년 지도', 10.5, 13.5, this.gate(0x9e78c9));
    // Keep the walking areas clear; peripheral trees frame the miniature world.
    for (let i = 0; i < 48; i++) { const a = i * 2.39996, r = 17 + (i % 4) * 1.65; const x = Math.cos(a) * r, z = Math.sin(a) * r * .77; if (villageWelcomeClear(x, z) || (x > 14 && z > 1) || Math.hypot(x - 10.5, z - 13.5) < 7 || Math.hypot(x - 18.5, z + 3.5) < 7 || (Math.abs(x) < 5 && z < -12)) continue; this.tree(x, z, .85 + (i % 3) * .16, theme.pinkTrees ? i % 3 === 0 : i % 6 === 0, theme.foliage); }
    stageTrees(0).forEach(({ x, z }, i) => { const at = villageTreeSpot(i, x, z); if (Math.hypot(at.x - 18.5, at.z + 3.5) >= 8) this.addChoppableTree(i, at.x, at.z, 1, theme.pinkTrees || i % 2 === 0, theme.foliage); });
    for (let i = 0; i < 65; i++) { const x = Math.sin(i * 12.97) * 23, z = Math.cos(i * 4.67) * 18; if (villageWelcomeClear(x, z) || Math.abs(x) < 3 || Math.hypot(x - 10.5, z - 13.5) < 7 || (z < -2 && z > -11) || (x > 5 && z > 2 && z < 14)) continue; for (let j = 0; j < 3; j++) { const fx = x + j * .14; cylinder(this.scene, 0x538c50, fx, .14, z, .025, .025, .3, 5); ball(this.scene, [0xffe8ae, 0xf4aec4, 0xeae3ff][i % 3], fx, .32, z, .1, .09, .1); } }
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { const x = side * 22, z = -15 + i * 4.7; cylinder(this.scene, 0xd4bb88, x, .5, z, .08, .09, 1, 8); box(this.scene, 0xe7d3a3, x, .65, z + 2, .12, .11, 4.7); }
    this.villageDecor(theme);
    if (theme === VILLAGE_THEMES.addition) {
      const board = new T.Group();
      for (const x of [-.65,.65]) cylinder(board, 0x886445, x, .8, 0, .07, .09, 1.6, 7);
      box(board, 0xc99062, 0, 1.35, 0, 1.9, 1.15, .16); box(board, 0xfff8de, 0, 1.35, .1, 1.58, .88, .04);
      for (let i=0;i<3;i++) box(board, 0xd5ae8d, -.1, 1.58-i*.23, .13, 1.1-i*.15, .045, .02);
      this.addEntity('noticeBoard', '마을 공지판 · 소식 읽기', VILLAGE_SPOTS.notice.x, VILLAGE_SPOTS.notice.z, board);
    } else if (theme !== VILLAGE_THEMES.division) this.addEntity('unit', `${theme.name} 안내판 · 단계 지도`, -10, 9.5, this.gate(theme.gate));
    this.addBerries();
  }
  // 숲마다 다른 분위기를 만드는 장식. 걷는 길과 상점 앞은 비워 둬요.
  private villageDecor(theme: VillageTheme) {
    const free = (x: number, z: number) => !villageWelcomeClear(x, z) && Math.abs(x) >= 3 && !(z < -2 && z > -11) && !(x > 5 && z > 2 && z < 14) && Math.hypot(x + 10, z - 9.5) > 3 && Math.hypot(x - 10.5, z - 13.5) > 6 && Math.hypot(x - 18.5, z + 3.5) > 6 && Math.abs(x) < 24 && Math.abs(z) < 19;
    const spots = (count: number, a: number, b: number, make: (x: number, z: number, i: number) => void) => { let made = 0; for (let i = 0; made < count && i < count * 4; i++) { const x = Math.sin(i * a) * 23, z = Math.cos(i * b) * 18; if (!free(x, z)) continue; make(x, z, made++); } };
    if (theme.deco === 'sunflower') spots(22, 4.31, 2.71, (x, z, i) => { cylinder(this.scene, 0x5d934b, x, .45, z, .04, .06, .85, 6); ball(this.scene, 0x6e512f, x, .93, z, .14); for (let p = 0; p < 8; p++) ball(this.scene, 0xf6cb42, x + Math.cos(p * Math.PI / 4) * .25, .93 + Math.sin(p * Math.PI / 4) * .25, z, .11, .15, .06); if (i % 4 === 0) { const bee = new T.Group(); bee.position.set(x + .45, 1.4, z); ball(bee, 0xf2c340, 0, 0, 0, .15, .11, .12); box(bee, 0x4b4036, 0, 0, .08, .3, .06, .08); this.scene.add(bee); this.butterflies.push(bee); } });
    else if (theme.deco === 'apple') spots(26, 3.77, 2.39, (x, z, i) => { if (i % 5 === 0) { box(this.scene, 0xb98d58, x, .22, z, .9, .44, .7); for (let k = 0; k < 4; k++) ball(this.scene, 0xe0503f, x - .28 + k * .19, .5, z + (k % 2) * .12 - .06, .13); } else { ball(this.scene, 0xe0503f, x, .22, z, .2, .19, .2); ball(this.scene, 0x5d934b, x + .08, .42, z, .09, .04, .05); } });
    else if (theme.deco === 'leaves') spots(70, 3.91, 2.17, (x, z, i) => { ball(this.scene, [0xd9822f, 0xc0592a, 0xe9b04a, 0x9a5a2a][i % 4], x, .05, z, .26, .025, .17); if (i % 9 === 0) for (let k = 0; k < 5; k++) ball(this.scene, [0xd9822f, 0xe9b04a][k % 2], x + Math.cos(k * 1.3) * .25, .1 + k * .04, z + Math.sin(k * 1.3) * .2, .26, .03, .17); });
    else if (theme.deco === 'shapes') spots(20, 3.63, 2.51, (x, z, i) => { const colors = [0x62b4d6, 0xf0a36a, 0xe67f92]; if (i % 3 === 0) box(this.scene, colors[i % 3], x, .32, z, .62, .62, .22); else if (i % 3 === 1) cylinder(this.scene, colors[i % 3], x, .3, z, .34, .34, .6, 3); else cylinder(this.scene, colors[i % 3], x, .3, z, .32, .32, .6, 16); });
    else if (theme.deco === 'clock') spots(16, 3.47, 2.29, (x, z, i) => { cylinder(this.scene, 0x9b7654, x, .6, z, .08, .1, 1.2, 7); const face = cylinder(this.scene, 0xfff3cf, x, 1.45, z, .5, .5, .12, 24); face.rotation.x = Math.PI / 2; box(this.scene, 0x6b665d, x, 1.46, z + .08, .04, .35, .04); box(this.scene, 0xd47d69, x + .12, 1.46, z + .09, .25, .04, .04); if (i % 4 === 0) box(this.scene, 0xe2c38f, x + .9, .12, z, 1.2, .24, .28); });
    else if (theme.deco === 'decimal') spots(20, 3.23, 2.73, (x, z, i) => { for (let cell = 0; cell < 10; cell++) box(this.scene, cell < (i % 9) + 1 ? 0xb98ade : 0xffefd9, x - .72 + cell * .16, .08, z, .14, .1, .32); if (i % 4 === 0) ball(this.scene, 0xffcf6e, x, .62, z, .22); });
    else if (theme.deco === 'moon') spots(16, 3.37, 2.83, (x, z, i) => { const ring = mesh(new T.TorusGeometry(.7 + (i % 3) * .35, .05, 6, 32), [0xe9e2f8, 0xc9d6f2, 0xf3eaff][i % 3], x, .06, z, this.scene); ring.rotation.x = Math.PI / 2; if (i % 4 === 0) { cylinder(this.scene, 0x8c93b8, x, .7, z, .05, .07, 1.4, 6); ball(this.scene, 0xfff1b8, x, 1.55, z, .26); } });
    else if (theme.deco === 'cake') spots(14, 3.13, 2.57, (x, z, i) => { cylinder(this.scene, [0xf6b7c8, 0xf9d9a8, 0xcde8c0][i % 3], x, .22, z, .62, .62, .44, 18); cylinder(this.scene, 0xfffaf0, x, .5, z, .5, .5, .14, 18); ball(this.scene, 0xe84a5f, x, .68, z, .1); if (i % 3 === 0) { cylinder(this.scene, 0xf4f0e8, x + 1.2, .5, z, .05, .05, 1, 6); ball(this.scene, [0xf6a7bc, 0xf5d37b][i % 2], x + 1.2, 1.1, z, .22); } });
    else if (theme.deco === 'scales') spots(16, 3.51, 2.43, (x, z, i) => { if (i % 4 === 0) { box(this.scene, 0xcdbd95, x, .08, z, 1.3, .16, .6); cylinder(this.scene, 0x9a8a62, x, .7, z, .04, .05, 1.2, 6); box(this.scene, 0x9a8a62, x, 1.28, z, 1.5, .06, .06); for (const side of [-1, 1]) cylinder(this.scene, 0xe9d8a0, x + side * .68, 1.05, z, .3, .3, .05, 14); } else { cylinder(this.scene, [0x8fd3e0, 0xf3c4d8, 0xbfe6a8][i % 3], x, .3, z, .25, .3, .6, 10); cylinder(this.scene, 0xeaf6f6, x, .72, z, .1, .12, .24, 8); ball(this.scene, 0xc9a77a, x, .88, z, .08); } });
    else if (theme.deco === 'stars') spots(20, 3.29, 2.61, (x, z, i) => { if (i % 5 === 0) { cylinder(this.scene, 0x7a7fa8, x, .55, z, .06, .09, 1.1, 6); cylinder(this.scene, 0x9fa6d2, x, 1.25, z, .22, .12, .75, 8).rotation.x = -.7; } else { const star = new T.Group(); star.position.set(x, 1.1 + (i % 3) * .3, z); mesh(new T.OctahedronGeometry(.28), [0xffe27a, 0xfff3b0, 0xf5c0ff][i % 3], 0, 0, 0, star); this.scene.add(star); this.butterflies.push(star); } });
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
  private addExpeditionObjects(s: Save) {
    const active = s.expedition.active;
    if (!active) return;
    const layout = expeditionLayout(s.expedition.completed);
    for (const id of layout.stars) {
      const spot = EXPEDITION_STAR_SPOTS[id], g = new T.Group();
      mesh(expeditionStarGeometry, 0xffd36f, 0, 0, 0, g); ball(g, 0xfff8ce, 0, .12, 0, .16);
      g.position.set(spot.x, .95, spot.z); g.visible = !active.stars.includes(id); this.scene.add(g);
      const label = document.createElement('div'); label.className = 'entity-label star-label'; label.textContent = '✦ 별빛 표식'; this.labelLayer.append(label);
      this.stars.push({ mesh: g, id, y: .95, label });
    }
    for (const id of layout.monsters) {
      const monster = stageMonsters(this.stage)[id], model = makeMonster(monster.type); model.userData.monsterType = monster.type;
      this.addEntity(`expMonster${id}`, `별빛 대련 · ${MONSTERS[monster.type].name}`, monster.x, monster.z, model);
      const entity = this.entities[this.entities.length - 1]; entity.mesh.visible = !active.monsters.includes(id); entity.label.classList.add('monster-label');
    }
    const gate = this.entities.find(e => e.id === 'next');
    if (gate) { gate.name = '별빛 원정 출구'; gate.label.textContent = gate.name; }
  }
  private buildHunt(stage: number) {
    const base = STAGES[stage - 1], palette = FOREST_PALETTES[this.forest], spec = palette ? { ...base, ...palette } : base, size = stageSize(stage); this.platforms = stagePlatforms(stage); this.scene.background = new T.Color(spec.sky); this.scene.fog = new T.Fog(spec.sky, 55, 120);
    box(this.scene, spec.ground, 0, -.55, 0, size.x * 2, 1.1, size.z * 2); box(this.scene, 0x708f71, 0, -1.3, 0, size.x * 2 - 1, .5, size.z * 2 - 1);
    box(this.scene, spec.accent, 0, .02, 0, 3.8, .06, size.z * 2 - 5); for (const z of [14, 0, -15]) box(this.scene, spec.accent, 0, .025, z, size.x * 2 - 10, .06, 2.6);
    this.platforms.forEach(p => { box(this.scene, 0xa8a88c, p.x, p.h / 2, p.z, p.w, p.h, p.d); box(this.scene, spec.accent, p.x, p.h + .02, p.z, p.w + .05, .08, p.d + .05); });
    this.addEntity('village', '베리숲 마을로 돌아가기', 0, size.z - 5, this.gate(0x6eb7a1)); this.addEntity('next', stage === 10 ? (this.forest === 'multiplication' ? '구구단 햇살문' : this.forest === 'division' ? '마지막 축하문' : '완주 축하문') : `다음 길 · ${STAGES[stage].name}`, 0, -size.z + 5, this.gate(FOREST_GATES[this.forest]));
    stageMonsters(stage).forEach((m, i) => this.addEntity(`monster${i}`, `${MONSTERS[m.type].name} · ${i + 1}`, m.x, m.z, makeMonster(m.type)));
    for (let i = 0; i < 55; i++) { const x = Math.sin(i * 2.399 + stage) * (size.x - 4), z = Math.cos(i * 1.73 + stage) * (size.z - 4); if (Math.abs(x) < 4 || [14, 0, -15].some(v => Math.abs(z - v) < 2.5)) continue; this.tree(x, z, .8 + i % 3 * .2, spec.theme === 'blossom', spec.foliage); }
    stageTrees(stage).forEach(({ x, z }, i) => this.addChoppableTree(i, x, z, .92 + (i % 3) * .08, spec.theme === 'blossom', spec.foliage));
    for (const z of [20, 6, -9, -23]) { box(this.scene, 0xb98d58, -3.4, .65, z, .12, 1.25, .12); box(this.scene, 0xe6ca8f, -2.8, 1.05, z, 1.35, .56, .12); ball(this.scene, 0xffe98d, -3.35, 1.36, z, .1); }
    for (let i = 0; i < 30; i++) { const x = Math.sin(i * 5.7 + stage) * (size.x - 7), z = Math.cos(i * 3.3 + stage) * (size.z - 8); cylinder(this.scene, 0x5c9a59, x, .12, z, .025, .025, .24, 5); ball(this.scene, [0xffb3c7, 0xffdf82, 0xc5b2ef, 0xa9dfe1][i % 4], x, .29, z, .1, .08, .1); }
    if (this.forest === 'multiplication') for (let i = 0; i < 18; i++) { const x = Math.sin(i * 4.31 + stage) * (size.x - 7), z = Math.cos(i * 2.71 + stage) * (size.z - 8); cylinder(this.scene, 0x5d934b, x, .45, z, .04, .06, .85, 6); ball(this.scene, 0x6e512f, x, .93, z, .14); for (let p = 0; p < 8; p++) ball(this.scene, 0xf6cb42, x + Math.cos(p * Math.PI / 4) * .25, .93 + Math.sin(p * Math.PI / 4) * .25, z, .11, .15, .06); if (i % 3 === 0) { const bee = new T.Group(); bee.position.set(x + .45, 1.4, z); ball(bee, 0xf2c340, 0, 0, 0, .15, .11, .12); box(bee, 0x4b4036, 0, 0, .08, .3, .06, .08); this.scene.add(bee); this.butterflies.push(bee); } }
    if (this.forest === 'addition') for (let i = 0; i < 24; i++) { const x = Math.sin(i * 4.31 + stage) * (size.x - 7), z = Math.cos(i * 2.71 + stage) * (size.z - 8); ball(this.scene, 0xe0503f, x, .22, z, .2, .19, .2); ball(this.scene, 0x5d934b, x + .08, .42, z, .09, .04, .05); }
    if (this.forest === 'subtraction') for (let i = 0; i < 46; i++) { const x = Math.sin(i * 3.91 + stage) * (size.x - 6), z = Math.cos(i * 2.17 + stage) * (size.z - 7); ball(this.scene, [0xd9822f, 0xc0592a, 0xe9b04a, 0x9a5a2a][i % 4], x, .05, z, .26, .025, .17); }
    for (let i = 0; i < 14; i++) { const g = new T.Group(); g.position.set((i % 2 ? 1 : -1) * (size.x - 5), 0, size.z - 7 - Math.floor(i / 2) * 8); this.scene.add(g); if (spec.theme === 'crystal') { for (let j = 0; j < 3; j++) { const m = mesh(new T.OctahedronGeometry(.65), [0x9bade6, 0xc3a0df, 0x9bd6d4][j], j * .55 - .55, 1.3, 0, g); m.scale.y = 2 + j * .3; } } else if (spec.theme === 'mushroom') { cylinder(g, 0xf4e4cb, 0, .9, 0, .4, .6, 1.8); ball(g, 0xda8e9a, 0, 2, 0, 1.8, .65, 1.5); } else { for (let j = 0; j < 5; j++) ball(g, spec.foliage, Math.cos(j * 1.26), .7, Math.sin(j * 1.26), .4, .14, .4); } }
    this.addBerries();
  }
  private clearMap() {
    this.endStoryActivity();
    if(this.discoveryRoot)this.disposeModel(this.discoveryRoot);this.discoveryRoot=null;this.homeTargets=[];this.homeVisitors.forEach(v=>this.disposeModel(v.entity.mesh));
    if(this.homeRoot)this.disposeModel(this.homeRoot);this.homeRoot=null;this.homeVisitors=[];this.homeSave=null;this.inHomestead=false;
    if (this.trailScenery) this.disposeModel(this.trailScenery); this.trailScenery = null;
    if (this.storyScenery) this.disposeModel(this.storyScenery);
    this.storyScenery = null; this.craftAnimated = []; this.restoredBridge = false; this.butterflies = []; this.particles = [];
    this.clearGuide(); this.selectedId = null; this.petTargetId = null; this.onNear(null, null); this.entities.forEach(e => e.label.remove()); this.stars.forEach(star => star.label.remove()); this.entities = []; this.coins = []; this.stars = []; this.colliders = [];
    for (const child of [...this.scene.children]) if (child !== this.player && child !== this.petModel && child !== this.weatherMesh && !(child instanceof T.Light)) { this.scene.remove(child); if (child instanceof T.Mesh && child.userData.mergedScenery) child.geometry.dispose(); }
    this.furnitureRoot = null;
  }
  /**
   * 움직이지 않는 바닥 장식(길·울타리·꽃·돌 등)을 같은 색끼리 하나로 합쳐 그리기 횟수를 줄여요.
   * 게임이 나중에 움직이거나 숨기는 것(베리·나무·몬스터·별·애니메이션 표시가 있는 조각)은 그대로 둬요.
   */
  private mergeStaticScenery() {
    this.trimSmallShadows();
    const keep = new Set<T.Object3D>();
    const note = (value: unknown) => { if (value instanceof T.Object3D) keep.add(value); else if (value && typeof value === 'object' && 'mesh' in value && (value as { mesh: unknown }).mesh instanceof T.Object3D) keep.add((value as { mesh: T.Object3D }).mesh); };
    for (const value of Object.values(this)) { if (Array.isArray(value)) value.forEach(note); else note(value); }
    const flagged = (o: T.Object3D) => Object.keys(o.userData).some(k => k !== 'shadowChecked'); // 그림자 정리 표시는 움직임과 상관없어요
    const mergeable = (m: T.Mesh) => m.material instanceof T.MeshStandardMaterial && !m.material.transparent && m.visible;
    // 통째로 합칠 수 있는 맨 위 조각: 혼자 놓인 장식, 또는 게임이 건드리지 않는 장식 묶음(가게·집·울타리 등)
    const tops: T.Object3D[] = [];
    for (const child of this.scene.children) {
      if (keep.has(child) || flagged(child) || !child.visible || child instanceof T.Light) continue;
      if (child instanceof T.Mesh) { if (mergeable(child)) tops.push(child); continue; }
      if (child.type !== 'Group') continue;
      let ok = true; child.traverse(o => { if (o === child) return; if (keep.has(o) || flagged(o) || !o.visible || (o instanceof T.Mesh && !mergeable(o)) || (!(o instanceof T.Mesh) && o.type !== 'Group')) ok = false; });
      if (ok) tops.push(child);
    }
    this.scene.updateMatrixWorld(true);
    const groups = new Map<string, T.Mesh[]>();
    for (const top of tops) top.traverse(o => {
      if (!(o instanceof T.Mesh)) return;
      const m = o.material as T.MeshStandardMaterial, g = o.geometry, attrs = Object.keys(g.attributes).sort().join(',');
      const key = `${m.uuid}|${o.castShadow}|${o.receiveShadow}|${g.index ? 'i' : 'n'}|${attrs}`;
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(o);
    });
    const merged = new Set<T.Mesh>();
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const parts = list.map(o => o.geometry.clone().applyMatrix4(o.matrixWorld));
      const geometry = mergeGeometries(parts); parts.forEach(p => p.dispose()); if (!geometry) continue;
      const out = new T.Mesh(geometry, list[0].material); out.castShadow = list[0].castShadow; out.receiveShadow = list[0].receiveShadow; out.userData.mergedScenery = true; out.userData.shadowChecked = true;
      this.scene.add(out); list.forEach(o => merged.add(o));
    }
    // 모든 조각이 합쳐진 맨 위 조각만 치워요. 하나라도 남았으면 그 묶음은 그대로 둬요(합친 조각만 숨김).
    for (const top of tops) {
      const meshes: T.Mesh[] = []; top.traverse(o => { if (o instanceof T.Mesh) meshes.push(o); });
      if (meshes.every(m => merged.has(m))) { this.scene.remove(top); meshes.forEach(m => { if (!sharedGeometries.has(m.geometry)) m.geometry.dispose(); }); }
      else meshes.forEach(m => { if (merged.has(m)) m.visible = false; });
    }
  }
  loadStage(s: Save, fresh = false) {
    this.clearInput(); this.clearMap(); this.inRoom = false; s.room.inside = false; s.homestead.inside=false; this.forest = s.forest; const journey = journeyFor(s); this.stage = journey.stage;
    this.scene.background = new T.Color(0xd0eade); this.scene.fog = new T.Fog(0xd0eade, 58, 112); this.platforms = stagePlatforms(this.stage);
    if (this.stage === 0) this.buildVillage(VILLAGE_THEMES[villageThemeId(s)]); else this.buildHunt(this.stage);
    if (this.stage === 0) { this.updateStoryVillage(s); const gate=new T.Group();box(gate,0xd3b985,0,.8,0,1.4,1.6,.2);ball(gate,0xa8c98c,0,1.9,0,.5);this.addEntity('homesteadGate','🏡 나의 마을 · 들어가기',VILLAGE_SPOTS.home.x,VILLAGE_SPOTS.home.z,gate); }
    this.mergeStaticScenery();
    if (trailHere(s)) this.buildForestTrail(s);
    if (fieldHere(s)) this.buildForestWork(s);
    if (discoveryHere(s)) this.buildDiscovery(s);
    if (this.stage > 0 && storyHere(s)) {
      for (let clue = 0; clue < 3; clue++) {
        const spot = storySpot(s.story.active!.chapter, clue), model = new T.Group();
        box(model, 0xfff6cf, 0, .75, 0, .74, .5, .09); ball(model, 0xf3a9bb, .31, 1, .05, .13);
        this.addEntity(`storyClue${clue}`, `✉️ 편지 단서 ${clue + 1}/3`, spot.x, spot.z, model);
      }
      const spot = storySpot(s.story.active!.chapter, 2), puzzle = new T.Group();
      cylinder(puzzle, 0xa0b7d9, 0, .12, 0, .9, .9, .22, 12); mesh(expeditionStarGeometry, 0xffde8b, 0, 1.1, 0, puzzle);
      this.addEntity('storyPuzzle', '✦ 편지 속 수학 문제', spot.x, spot.z, puzzle);
      this.refreshStoryObjects(s);
    }
    const map = journey.maps[this.stage], expedition = s.forest === 'division' && !!s.expedition.active && s.expedition.active.stage === this.stage;
    this.coins.forEach(c => c.mesh.visible = !expedition && !map.berries.includes(c.id));
    this.entities.forEach(e => { if (e.id.startsWith('monster')) e.mesh.visible = !expedition && !map.monsters.includes(Number(e.id.slice(7))); if (e.id.startsWith('tree')) e.mesh.visible = !expedition && !map.trees.includes(Number(e.id.slice(4))); });
    if (expedition) this.addExpeditionObjects(s);
    const spawn = this.stage === 0 ? { x: 0, z: 8 } : { x: 0, z: stageSize(this.stage).z - 9 }; const p = fresh ? spawn : s.position; this.player.position.set(p.x, 0, p.z); this.placePetNearPlayer(); this.lastSafe.copy(this.player.position); this.follow.copy(this.player.position);
    this.onStageLoaded(this.stage);
  }
  enterHomestead(s:Save,preserve=false){
    const pos=preserve?s.homestead.position:{x:0,z:12};this.clearInput();this.clearMap();this.inRoom=false;this.inHomestead=true;s.room.inside=false;s.homestead.inside=true;this.stage=0;this.platforms=[];this.homeSave=s;
    this.scene.background=new T.Color(0xd5eddb);this.scene.fog=new T.Fog(0xd5eddb,40,85);
    box(this.scene,0xa9c78c,0,-.5,0,27,1,27);box(this.scene,0xe5d0a5,0,.02,12,4,.04,2);box(this.scene,0x8daf76,0,.2,-12.7,26,.4,.5);for(const side of [-1,1]){box(this.scene,0x8daf76,side*12.7,.2,0,.5,.4,26);box(this.scene,0x8daf76,side*8,.2,12.7,10,.4,.5);}
    for(let i=0;i<=12;i++){box(this.scene,0xbed29e,-12+i*2,.015,0,.025,.025,24);box(this.scene,0xbed29e,0,.015,-12+i*2,24,.025,.025);}
    const built=homeScenery(s.homestead.objects);this.homeRoot=built.root;this.scene.add(built.root);this.craftAnimated.push(...built.rotors);
    for(const o of s.homestead.objects){const item=HOME_ITEMS[o.kind],cells=objectCells(o),w=o.rotation%2?item.h:item.w,h=o.rotation%2?item.w:item.h,x=(o.column+(w-1)/2-5.5)*2,z=(o.row+(h-1)/2-5.5)*2;
      if(item.solid)cells.forEach(c=>this.colliders.push({x:(c.column-5.5)*2,z:(c.row-5.5)*2,r:.72}));
      if(item.interactive)this.addEntity(`homeObject${o.uid}`,`${item.icon} ${item.name}`,x,z,new T.Group());
    }
    const editor=new T.Group();cylinder(editor,0xb98a62,0,.55,0,.6,.6,1.1,8);box(editor,0xf8ebbe,0,1.2,0,1.4,.12,1);this.addEntity('homeEditor','📐 나의 마을 설계 수첩',-3,12,editor);
    const exit=new T.Group();cylinder(exit,0xc3a774,0,.5,0,.08,.1,1,8);box(exit,0xf1e2ad,0,1.2,0,1.5,.7,.15);this.addEntity('homeExit','🚪 원래 모험으로 돌아가기',3,12,exit);
    const names=["연태쌤", "가현이", "오지후"];
    this.homeTargets=visitorTargets(s);if(this.homeTargets.length)for(let i=0;i<3;i++){const model=makeCharacter(i,0,0),cell=137+i%2;this.addEntity(`homeVisitor${i}`,`${names[i]} · 정원 구경`,(cell%12-5.5)*2,(Math.floor(cell/12)-5.5)*2,model);const entity=this.entities[this.entities.length-1];entity.mesh.visible=i<(s.settings.lowQuality?1:3);this.homeVisitors.push({entity,cell,path:[],pause:i,turn:i,kind:6});}
    this.player.position.set(pos.x,0,pos.z);this.placePetNearPlayer();this.lastSafe.set(0,0,12);this.follow.copy(this.player.position);this.quality(s.settings.lowQuality);
  }
  private animateHomeVisitors(dt:number){
    const s=this.homeSave;if(!s)return;const targets=this.homeTargets;
    for(const visitor of this.homeVisitors){if(!visitor.entity.mesh.visible)continue;const model=visitor.entity.mesh;
      if(visitor.pause>0){visitor.pause-=dt;continue;}
      if(!visitor.path.length){const turn=visitor.turn++,target=s.homestead.memories.includes(3)&&turn%3===0?targets.filter(t=>t.kind===14)[turn%Math.max(1,targets.filter(t=>t.kind===14).length)]??targets[turn%targets.length]:targets[turn%targets.length];if(!target)continue;visitor.kind=target.kind;visitor.path=homeRoute(s.homestead.objects,visitor.cell,target.cell).slice(1);if(!visitor.path.length){visitor.pause=s.homestead.memories.length?6:4;model.scale.y=(visitor.kind===18||visitor.kind===13)&&s.homestead.memories.some(id=>id===0||id===2)?.82:1;}continue;}
      model.scale.y=1;const next=visitor.path[0],x=(next%12-5.5)*2,z=(Math.floor(next/12)-5.5)*2,dx=x-model.position.x,dz=z-model.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.65);
      if(d>.01){model.position.x+=dx/d*step;model.position.z+=dz/d*step;model.rotation.y=Math.atan2(dx,dz);}visitor.entity.x=model.position.x;visitor.entity.z=model.position.z;
      if(d<.05){visitor.cell=next;visitor.path.shift();if(!visitor.path.length){visitor.pause=s.homestead.memories.length?6:4;model.scale.y=(visitor.kind===18||visitor.kind===13)&&s.homestead.memories.some(id=>id===0||id===2)?.82:1;visitor.entity.name=["연태쌤", "가현이", "오지후"][Number(visitor.entity.id.slice(11))]+' · '+(visitor.kind===18||visitor.kind===13?'잠깐 쉬는 중':visitor.kind===14?'함께 소풍 중':visitor.kind===15?'펫 놀이터 구경':'꽃과 정원 구경');visitor.entity.label.textContent=visitor.entity.name;if(visitor.kind===15&&s.homestead.memories.includes(4)&&this.petIndex>=0)this.reactPet('spin');}}
    }
  }
  private buildDiscovery(s:Save){
    const stage=journeyFor(s).stage,spot=discoverySpot(stage),info=discoveryInfo(s.forest,stage),g=new T.Group();
    cylinder(g,0xc1a478,0,.55,0,.08,.1,1.1,7);box(g,0xf6e6ba,0,1.2,0,1.4,.7,.15);ball(g,0xf2c878,0,1.9,0,.25);this.addEntity('discovery',`${info.icon} ${info.name} · 발자국의 끝`,spot.x,spot.z,g);
    for(let i=0;i<8;i++){const t=(i+1)/9,x=spot.x*t,z=22+(spot.z-22)*t;for(const side of [-1,1])cylinder(g,0xd9bc8e,x-spot.x+side*.16,.03,z-spot.z,.09,.1,.04,6);}
    const scenery=new T.Group();scenery.position.set(spot.x,0,spot.z-3);this.scene.add(scenery);this.discoveryRoot=scenery;
    const restored=new T.Group();restored.name='discoveryRestored';scenery.add(restored);
    if(stage%3===0){for(const x of [-1.5,1.5]){cylinder(scenery,0xc1b89a,x,.8,0,.22,.28,1.6,8);ball(restored,0xffdb89,x,1.8,0,.25);}box(restored,0xd4c59f,0,1.9,0,3.5,.25,.4);}
    else if(stage%3===1){box(scenery,0xaf8b62,0,.02,0,3,.04,2);for(let i=0;i<6;i++){const x=(i%3-1)*.85,z=Math.floor(i/3)*.7-.35;cylinder(restored,0x7ba96d,x,.4,z,.03,.04,.8,6);ball(restored,[0xf0a9bf,0xf1cf79,0xb8add8][i%3],x,.85,z,.22);}}
    else {box(scenery,0xad8a60,0,.45,0,2.8,.2,.8);for(const x of [-1.1,1.1])cylinder(scenery,0x977552,x,.2,0,.08,.1,.4,6);for(const x of [-1.4,1.4])cylinder(restored,0x88af76,x,1.1,-.6,.12,.15,2.2,8);box(restored,0xb7cd91,0,2.2,-.6,3.2,.22,1.8);}
    const dormant=new T.Group();dormant.name='discoveryDormant';for(let i=0;i<3;i++)ball(dormant,0xa1a28b,-1+i,.18,.5,.25);scenery.add(dormant);
    this.refreshDiscovery(s);
  }
  refreshDiscovery(s:Save){const entity=this.entities.find(e=>e.id==='discovery');if(!entity)return;const done=s.exploration.solved.includes(discoveryId(s.forest,journeyFor(s).stage));entity.mesh.traverse(o=>{if(o instanceof T.Mesh&&(o.geometry instanceof T.SphereGeometry))o.material=material(done?0x94bd7b:0xf2c878);});entity.name=`${discoveryInfo(s.forest,journeyFor(s).stage).name} · ${done?'되살린 장소':'발자국의 끝'}`;entity.label.textContent=entity.name;this.discoveryRoot?.children.forEach(o=>{if(o.name==='discoveryRestored')o.visible=done;if(o.name==='discoveryDormant')o.visible=!done;});}
  private buildForestWork(s: Save) {
    if (!fieldHere(s)) return;
    const forest = s.forest, info = FIELD_INFO[forest], scenery = new T.Group();
    scenery.userData.forestWork = true; this.scene.add(scenery); this.trailScenery = scenery;
    FIELD_SPOTS.forEach((spot, step) => {
      const g = new T.Group(), { a, b } = fieldSpec(forest,s.grade,step);
      cylinder(g, forest === 'division' ? 0x81bccc : 0x9fa578, 0,.08,0, .85,.9,.16,12);
      const sign = new T.Group(); cylinder(sign,0xa38359,-1.8,.7,0,.07,.1,1.4,7); ball(sign,forest === 'division' ? 0x8ed9ed : forest === 'multiplication' ? 0xf8c980 : 0x9bbc75,-1.8,1.5,0,.36); g.add(sign);
      if (forest === 'subtraction') {
        for (let i=0;i<a;i++) { const thorn = new T.Group(); thorn.userData.fieldSlot=i;
          box(thorn,0x87664f,0,.38,0,.65,.12,.12).rotation.z=.4;
          box(thorn,0xa38b65,0,.55,0,.12,.44,.12).rotation.z=-.35;
          thorn.position.set((i%6-2.5)*.65,0,-1-Math.floor(i/6)*.65); g.add(thorn);
        }
      } else if (forest === 'multiplication') {
        for (let row=0;row<a;row++) { const flowers = new T.Group(); flowers.userData.fieldSlot=row; flowers.position.z=-1.2-row*1.25;
          box(flowers,0xcbb58a,0,.1,0,b*.65+.3,.2,.9);
          for(let col=0;col<b;col++) { const x=(col-(b-1)/2)*.65; cylinder(flowers,0x7da968,x,.4,0,.035,.04,.6,6); ball(flowers,0xffd67d,x,.75,0,.23); ball(flowers,0xf1acb7,x,.76,.12,.11); }
          g.add(flowers);
        }
      } else {
        for(let channel=0;channel<b;channel++) { const x=(channel-(b-1)/2)*1.05;
          box(g,0xc8b895,x,.15,-1,.9,.3,2.6); const water=box(g,0x71c5e2,x,.4,-1,.65,.4,2.35); water.userData.fieldWater=channel;
          box(g,0x9bd3e3,x,.04,-3,.18,.08,1.5);
        }
      }
      this.addEntity(`forestWork${step}`,`${info.icon} ${step+1}번 ${info.place} · ${info.verb}`,spot.x,spot.z,g);
      for(let n=0;n<7;n++) { const stone=new T.Group(); stone.userData.fieldStep=step; stone.name='fieldPath'; cylinder(stone,forest === 'division' ? 0x8acddc : 0xb6cc85,0,.06,spot.z-n*1.2,.52,.6,.12,8); scenery.add(stone); }
    });
    const final=new T.Group(); final.name='fieldFinal'; final.position.z=-16;
    if(forest === 'division') {
      box(final,0xbcb398,0,.4,0,4,.8,2.8); box(final,0x71c5e2,0,.83,0,3.5,.12,2.3);
      const wheel=new T.Group(); wheel.position.set(0,1.7,-.4); wheel.userData.fieldWheel=true; final.add(wheel); this.craftAnimated.push(wheel);
      for(let i=0;i<8;i++) { const paddle=box(wheel,0x9a7852,Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4),0,.65,.22,.3); paddle.rotation.z=i*Math.PI/4; }
      box(final,0x72c6dc,-1.65,1.5,0,.22,2.4,.3);
    } else {
      for(const x of [-1.8,1.8]) cylinder(final,0x9a8060,x,1.1,0,.15,.2,2.2,8);
      for(let i=0;i<9;i++) ball(final,forest === 'multiplication' ? [0xf2b3ca,0xffd67d,0xc1b4e7][i%3] : 0xa7c779,-1.8+i*.45,2.3+Math.sin(i/8*Math.PI)*.5,0,.36);
      box(final,0xd2b991,0,.28,1,2.8,.3,.8);
    }
    scenery.add(final); this.refreshForestWork(s);
  }
  refreshForestWork(s: Save) {
    if(!fieldHere(s)) return;
    const forest=s.forest, work=s.forestActivities[forest], info=FIELD_INFO[forest]; this.trailNext=Math.min(2,work.done.length);
    for(const entity of this.entities) if(entity.id.startsWith('forestWork')) {
      const step=Number(entity.id.slice(10)), values=work.values[step], done=work.done.includes(step), {a,b}=fieldSpec(forest,s.grade,step);
      entity.name=`${info.icon} ${step+1}번 ${info.place} · ${done ? '완성했어요!' : step === work.done.length ? info.verb : '앞 장소부터 해 봐요'}`; entity.label.textContent=entity.name;
      entity.mesh.children.forEach(part => {
        if(typeof part.userData.fieldSlot === 'number') {
          const slot=part.userData.fieldSlot;
          if(forest === 'subtraction') { part.visible=!values.includes(slot); if(done) part.position.set(slot%2 ? 2.6 : -2.6,0,-1-Math.floor(slot/2)*.35); }
          if(forest === 'multiplication') part.visible=values.includes(slot);
        }
        if(typeof part.userData.fieldWater === 'number') { const count=values[part.userData.fieldWater]; part.visible=count>0; part.scale.y=Math.min(1.5,Math.max(.08,count/(a/b))); }
      });
      if(this.selectedId===entity.id) this.onNear(entity.name,entity.id);
    }
    this.trailScenery?.children.forEach(part => { if(part.name==='fieldPath') part.visible=work.done.includes(part.userData.fieldStep); if(part.name==='fieldFinal') part.visible=work.done.length===3; });
  }
  private buildForestTrail(s: Save) {
    const scenery = new T.Group(); scenery.userData.forestTrail = true; this.scene.add(scenery); this.trailScenery = scenery;
    TRAIL_SEEDS.forEach((spot, id) => {
      const g = new T.Group(); cylinder(g, 0x91ad65, 0, .1, 0, .6, .65, .2, 8);
      mesh(expeditionStarGeometry, 0xffdf7c, 0, .95, 0, g); ball(g, 0xfff7c9, 0, 1.45, 0, .16);
      this.addEntity(`trailSeed${id}`, `✦ ${Math.floor(id / 2) + 1}번 등불` + ` · 빛씨앗 ${trailPair(s.grade, Math.floor(id / 2))[id % 2]}개 묶음`, spot.x, spot.z, g);
    });
    TRAIL_LAMPS.forEach((spot, id) => {
      const g = new T.Group(); cylinder(g, 0x9a7852, 0, .65, 0, .22, .3, 1.3, 8);
      ball(g, 0x8d9c80, 0, 1.7, 0, .75).name = 'trailGlow';
      this.addEntity(`trailLamp${id}`, `🌳 ${id + 1}번 나무 등불 · 빛 합치기`, spot.x, spot.z, g);
      for (let n = 0; n < 6; n++) {
        const stone = new T.Group(); stone.userData.trailSegment = id;
        const z = spot.z - n * 1.45; cylinder(stone, 0x9fa58c, Math.sin(n) * .35, .08, z, .65, .72, .16, 8).name = 'trailGlow'; scenery.add(stone);
      }
    });
    const tree = new T.Group(); tree.userData.trailSegment = 2;
    cylinder(tree, 0x8b6c50, 0, 1.3, -16, .4, .6, 2.6, 9);
    for (const [x, y, z] of [[0, 3.7, -16], [-1, 2.9, -16], [1, 2.9, -16]]) ball(tree, 0x8d9c80, x, y, z, 1.25).name = 'trailGlow';
    scenery.add(tree); this.refreshForestTrail(s);
  }
  refreshForestTrail(s: Save) {
    if (!trailHere(s)) return;
    this.trailNext = Math.min(2, s.forestTrail.lit.length);
    for (const entity of this.entities) {
      if (entity.id.startsWith('trailSeed')) entity.mesh.visible = !s.forestTrail.seeds.includes(Number(entity.id.slice(9)));
      if (entity.id.startsWith('trailLamp')) {
        const id = Number(entity.id.slice(9)), lit = s.forestTrail.lit.includes(id);
        entity.name = `🌳 ${id + 1}번 나무 등불 · ${lit ? '밝아졌어요!' : id === s.forestTrail.lit.length ? '빛 합치기' : '앞 등불부터 밝혀요'}`;
        entity.label.textContent = entity.name;
        if (this.selectedId === entity.id) this.onNear(entity.name, entity.id);
        entity.mesh.traverse(o => { if (o instanceof T.Mesh && o.name === 'trailGlow') o.material = material(lit ? 0xffdd78 : 0x8d9c80); });
      }
    }
    this.trailScenery?.children.forEach(child => child.traverse(o => { if (o instanceof T.Mesh && o.name === 'trailGlow') o.material = material(s.forestTrail.lit.includes(child.userData.trailSegment) ? 0xffdd78 : 0x9fa58c); }));
  }
  refreshStoryObjects(s: Save) {
    const a = s.story.active;
    for (const e of this.entities) {
      if (!e.id.startsWith('storyClue') && e.id !== 'storyPuzzle') continue;
      const visible = !!a && storyHere(s) && (e.id === 'storyPuzzle' ? a.found.length === 3 && !a.solved : Number(e.id.slice('storyClue'.length)) === a.found.length);
      e.mesh.visible = visible; e.label.hidden = !visible;
      if (!visible && this.selectedId === e.id) { this.selectedId = null; this.onNear(null, null); }
    }
    this.clearGuide(); this.renderOnce();
  }
  updateStoryVillage(s: Save) {
    if (this.stage !== 0 || this.inRoom) return;
    if (this.storyScenery) { this.scene.remove(this.storyScenery); this.disposeModel(this.storyScenery); }
    this.craftAnimated = []; this.restoredBridge = s.story.completed.includes(1);
    const oldFriend = this.entities.find(e => e.id === 'storyFriend');
    if (oldFriend) { oldFriend.label.remove(); this.scene.remove(oldFriend.mesh); this.disposeModel(oldFriend.mesh); this.entities = this.entities.filter(e => e !== oldFriend); }
    const g = new T.Group(); g.userData.storyScenery = true; this.scene.add(g); this.storyScenery = g;
    this.buildVillageProjects(g, s);
    if (s.story.completed.includes(0)) {
      const friend = makePet(1); friend.scale.setScalar(1.4);
      this.addEntity('storyFriend', '편지 친구 · 솜이', -4.2, -3, friend);
      for (const side of [-1, 1]) { cylinder(g, 0xbb8f62, -4.2 + side * .9, .25, -3, .3, .35, .5); ball(g, 0xf4b6cd, -4.2 + side * .9, .7, -3, .4); }
    }
    if (this.restoredBridge) {
      this.buildCraftBridge(g, 19, 8, 9.5);
      const wheel = this.buildCraftWheel(g, 21.5, 4.5); this.craftAnimated.push(wheel);
      box(g, 0xf6e4c1, 22.5, .55, 4.5, 1.3, 1.1, 1.4);
      const roof = cylinder(g, 0xcd8d79, 22.5, 1.5, 4.5, 0, 1.2, .9, 4); roof.rotation.y = Math.PI / 4;
    }
    if (s.story.completed.includes(2)) {
      cylinder(g, 0xd8c9a6, -13, .05, 8.5, 3, 3, .1, 24);
      cylinder(g, 0x8f7059, -13, 1.1, 8.5, .22, .38, 2.2, 8);
      for (const [x, y, z] of [[0, 2.8, 0], [-.8, 2.4, .2], [.8, 2.5, -.2]]) ball(g, 0xa2cbaa, -13 + x, y, 8.5 + z, 1.15, .85, .9);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const light = mesh(particleGeometry, 0xffd980, -13 + Math.cos(a) * 1.2, 2.4 + Math.sin(a) * .6, 8.8 + Math.sin(a) * .5, g); light.scale.setScalar(1.6); light.userData.storySparkle = i; this.craftAnimated.push(light); }
      for (const x of [-15, -11]) { box(g, 0xbe9568, x, .42, 10, 1.6, .18, .7); for (const side of [-1, 1]) box(g, 0x8e7352, x + side * .5, .2, 10, .12, .4, .45); }
      cylinder(g, 0xecd2b1, -13, .55, 11, .8, .8, .16); cylinder(g, 0xae8a62, -13, .27, 11, .1, .22, .55);
    }
    this.renderOnce();
  }
  private buildCraftBridge(g: T.Group, x: number, z: number, length: number) {
    for (let i = 0; i < 14; i++) box(g, i % 2 ? 0xc79862 : 0xd9b17d, x - length / 2 + (i + .5) * length / 14, .1, z, length / 14 - .035, .16, 2.1);
    for (const side of [-1, 1]) { box(g, 0xba9066, x, .72, z + side, length, .12, .13); for (let i = 0; i < 5; i++) cylinder(g, 0xa47c53, x - length / 2 + i * length / 4, .4, z + side, .065, .085, .8, 6); }
  }
  private buildVillageProjects(g: T.Group, s: Save) {
    for (const e of this.entities.filter(entity => entity.id.startsWith('villageProject'))) {
      e.label.remove(); this.scene.remove(e.mesh); this.disposeModel(e.mesh);
    }
    this.entities = this.entities.filter(entity => !entity.id.startsWith('villageProject'));
    const positions = [[VILLAGE_SPOTS.flowers.x, VILLAGE_SPOTS.flowers.z], [0, 14], [5, 15]];
    VILLAGE_PROJECTS.forEach((project, id) => {
      const done = s.adventure.completed.includes(id), marker = new T.Group();
      cylinder(marker, 0x94734e, 0, .45, 0, .06, .08, .9, 6);
      box(marker, done ? 0xa6d18e : 0xe5cea3, 0, .98, 0, 1.1, .6, .12);
      this.addEntity(`villageProject${id}`, `${project.icon} ${project.name} · ${done ? '완성한 장소' : '함께 만들기'}`, positions[id][0], positions[id][1], marker);
      const active = s.adventure.active?.project === id ? s.adventure.active : null;
      if (!done && !active) return;
      const design = s.adventure.active?.project === id ? s.adventure.active.design : s.adventure.designs[id];
      const spec = projectSpec(id, design.grade);
      if (id === 0) { spec.rows = design.rows; spec.columns = spec.target / design.rows; }
      if (id === 2) { spec.groups = design.baskets; spec.target = spec.max / design.baskets; }
      if (id === 0) {
        box(g, 0x916849, -8, .035, 13, spec.columns * .65 + .3, .07, spec.rows * .65 + .3);
        for (let row = 0; row < spec.rows; row++) for (let column = 0; column < spec.columns; column++) {
          if (active && row * spec.columns + column >= active.values[0]) continue;
          const x = -8 + (column - (spec.columns - 1) / 2) * .65, z = 13 + (row - (spec.rows - 1) / 2) * .65;
          cylinder(g, 0x608f46, x, .2, z, .03, .03, .4, 5);
          for (let petal = 0; petal < 5; petal++) { const a = petal * Math.PI * 2 / 5; ball(g, [0xeeb0c6, 0xe8ca6f, 0xc0afd9][design.color], x + Math.cos(a) * .1, .42, z + Math.sin(a) * .1, .1, .06, .1); }
          ball(g, 0xf7e5a3, x, .46, z, .07);
        }
      } else if (id === 1) {
        for (let i = 0; i < (active ? active.values[0] : spec.target); i++) cylinder(g, i % 2 ? 0xcac4af : 0xdbd0b5, -4.8 + i * 8 / spec.target, .05, 15.7 + (design.curved ? Math.sin(i * Math.PI / spec.target) * .6 : 0), .27, .32, .1, 7);
      } else {
        box(g, 0xbd9268, 5, .75, 16.3, 3, .18, 1.5);
        for (const x of [3.9, 6.1]) for (const z of [15.8, 16.8]) box(g, 0x97704d, x, .35, z, .13, .7, .13);
        for (let basket = 0; basket < spec.groups; basket++) {
          const x = 4 + basket * 2 / Math.max(1, spec.groups - 1);
          cylinder(g, 0xd1ae72, x, .97, 16.3, .28, .2, .3, 8);
          for (let fruit = 0; fruit < (active ? active.values[basket] : spec.target); fruit++) ball(g, fruit % 2 ? 0xe8be64 : 0xd98076, x + Math.cos(fruit * 2.4) * .12, 1.15, 16.3 + Math.sin(fruit * 2.4) * .12, .085);
        }
        for (const x of [3.2, 6.8]) cylinder(g, 0xae8d62, x, 1.5, 16.6, .04, .05, 3, 6);
        for (let i = 0; i < 7; i++) box(g, [0xe6b8cb, 0xd3dca0, 0xb9c9e0][i % 3], 3.3 + i * .56, 2.75, 16.6, .3, .28, .06);
      }
    });
  }
  private buildCraftWheel(parent: T.Group, x: number, z: number) {
    const wheel = new T.Group(); wheel.position.set(x, 1.1, z); parent.add(wheel); wheel.userData.storyWheel = true;
    const rim = mesh(new T.TorusGeometry(.8, .09, 6, 20), 0xa47851, 0, 0, 0, wheel);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, spoke = box(wheel, 0xc49c6b, Math.cos(a) * .4, Math.sin(a) * .4, 0, .85, .08, .1); spoke.rotation.z = a; const paddle = box(wheel, 0xcca671, Math.cos(a) * .8, Math.sin(a) * .8, 0, .3, .14, .5); paddle.rotation.z = a; }
    rim.castShadow = false; return wheel;
  }
  beginStoryActivity(s: Save) {
    const active = s.story.active; if (!active?.activity || !storyHere(s)) return;
    this.clearInput(); this.clearGuide(); this.selectedId = null; this.onNear(null, null);
    const spot = storySpot(active.chapter, 2); this.storyActivityFocus = new T.Vector3(spot.x, .5, spot.z);
    const sign = this.entities.find(e => e.id === 'storyPuzzle'); if (sign) sign.mesh.visible = false;
    this.renderStoryActivity(s); this.resize();
  }
  renderStoryActivity(s: Save) {
    const a = s.story.active; if (!a?.activity || !this.storyActivityFocus) return;
    if (this.storyActivityRoot) { this.scene.remove(this.storyActivityRoot); this.disposeModel(this.storyActivityRoot); }
    this.activityMarkers.forEach(m => m.label.remove()); this.activityMarkers = [];
    const spec = activitySpec(a.chapter, a.activity.grade), values = a.activity.values;
    const g = new T.Group(); g.position.copy(this.storyActivityFocus); g.position.y = .1; g.userData.storyActivity = true; g.userData.waterSolved = a.solved; this.scene.add(g); this.storyActivityRoot = g;
    box(g, 0xf5e7c8, 0, -.04, 0, 8.8, .14, 4.5);
    const colors = [0xe8a296, 0x95c4a1, 0x94bad6, 0xc4a3d1];
    if (spec.kind === 'water') {
      const tankHeight = 2.5, fraction = values[0] / spec.total;
      box(g, 0xa4c8b9, -1.3, .08, 0, 2.5, .15, 1.8);
      box(g, 0xb6d9d2, -1.3, tankHeight / 2, -.82, 2.5, tankHeight, .12);
      for (const side of [-1, 1]) box(g, 0xd0e6d5, -1.3 + side * 1.2, tankHeight / 2, 0, .1, tankHeight, 1.8);
      if (fraction > 0) box(g, 0x6cbfd0, -1.3, fraction * tankHeight / 2 + .1, 0, 2.25, fraction * tankHeight, 1.6);
      for (let n = 0; n <= spec.total; n += spec.step) box(g, n === spec.target ? 0xd57f5c : 0xfaf6da, -2.28, .1 + n / spec.total * tankHeight, .88, n === spec.target ? .65 : .3, .04, .05);
      this.buildCraftWheel(g, 2.1, 0);
      this.activityMarker(g, -1.3, 3.2, 0, `${values[0]} ${spec.unit} / 목표 ${spec.target} ${spec.unit}`);
      cylinder(g, 0xe9bc77, .6, .4, 1.1, .32, .25, .7, 12);
    } else {
      const positions = Array.from({ length: spec.groups }, (_, i) => (i - (spec.groups - 1) / 2) * 2);
      for (let i = 0; i < spec.groups; i++) {
        const x = positions[i]; cylinder(g, colors[i], x, .1, .3, .8, .8, .15, 16);
        if (spec.kind === 'bridge') {
          for (let p = 0; p < values[i]; p++) box(g, p % 2 ? 0xc9965e : 0xe4b87d, x, .25 + p * .13, .3, 1.15, .11, .45);
        } else {
          for (let p = 0; p < values[i]; p++) { const angle = p * Math.PI * 2 / spec.total; const slice = new T.CylinderGeometry(.65, .65, .28, 12, 1, false, angle, Math.PI * 2 / spec.total - .04); mesh(slice, 0xf3b0c3, x, .34, .3, g); }
          const friend = makePet([0, 1, 16][i]); friend.position.set(x, 0, -1.4); friend.scale.setScalar(.8); g.add(friend);
        }
        this.activityMarker(g, x, spec.kind === 'bridge' ? 2.2 : 1.5, .3, `${i + 1}번 · ${values[i]}${spec.unit}`);
      }
      if (a.solved && spec.kind === 'bridge') this.buildCraftBridge(g, 0, -1.3, 7.7);
    }
    if (a.solved) { this.burst(g.position, 0xffd67d, 12); this.reactPet('happy'); }
    this.renderOnce();
  }
  private activityMarker(g: T.Group, x: number, y: number, z: number, text: string) {
    const label = document.createElement('div'); label.className = 'activity-marker'; label.textContent = text; this.labelLayer.append(label);
    this.activityMarkers.push({ at: g.position.clone().add(new T.Vector3(x, y, z)), label });
  }
  endStoryActivity() {
    this.storyActivityFocus = null;
    if (this.storyActivityRoot) { this.scene.remove(this.storyActivityRoot); this.disposeModel(this.storyActivityRoot); this.storyActivityRoot = null; }
    this.activityMarkers.forEach(m => m.label.remove()); this.activityMarkers = []; this.clearInput(); this.resize();
  }
  enterRoom(s: Save, preservePosition = false) {
    const roomPosition = preservePosition ? this.player.position.clone() : new T.Vector3(0, 0, 2.7);
    this.clearInput(); this.clearMap(); this.inRoom = true; s.room.inside = true; this.stage = 0; this.platforms = [];
    this.scene.background = new T.Color(0xf1dfc5); this.scene.fog = new T.Fog(0xf1dfc5, 35, 65);
    box(this.scene, 0xa9845e, 0, -.58, 0, 15, 1.15, 12);
    box(this.scene, 0xd8bd94, 0, .02, 0, 14.4, .08, 11.4);
    box(this.scene, 0xf2d4c4, 0, 2.3, -5.8, 15, 4.6, .4);
    // Low front and side walls let the camera see furniture inside the room.
    box(this.scene, 0xe7c6b4, -7.3, .58, 0, .4, 1.16, 12);
    box(this.scene, 0xe7c6b4, 7.3, .58, 0, .4, 1.16, 12);
    box(this.scene, 0xe7c6b4, -4.9, .38, 5.8, 5.2, .76, .4);
    box(this.scene, 0xe7c6b4, 4.9, .38, 5.8, 5.2, .76, .4);
    box(this.scene, 0x9e795e, 0, 4.55, -5.8, 15, .18, .48);
    box(this.scene, 0x9e795e, -7.3, 1.19, 0, .48, .12, 12);
    box(this.scene, 0x9e795e, 7.3, 1.19, 0, .48, .12, 12);
    box(this.scene, 0xc48676, 0, .09, 0, 8.4, .1, 5.6);
    box(this.scene, 0x9bd6df, 0, 2.7, -5.54, 3.3, 1.8, .08);
    box(this.scene, 0xf6e4a8, 0, 2.7, -5.46, .12, 1.9, .08);
    box(this.scene, 0xf6e4a8, 0, 2.7, -5.44, 3.5, .12, .08);
    // A dedicated doorway is the only way out; the hunt-gate remains a village return.
    for (const x of [-1.35, 1.35]) box(this.scene, 0x9e795e, x, 1.25, 5.48, .2, 2.5, .25);
    box(this.scene, 0x9e795e, 0, 2.45, 5.48, 2.8, .2, .25);
    this.addEntity('roomExit', '마을로 돌아가기', 0, 4.2, this.gate(0x6eb7a1));
    const sign = new T.Group(); box(sign, 0x9a754f, 0, 1, 0, 1.8, 1.5, .25); box(sign, 0xf2dfac, 0, 1.05, .16, 1.45, 1.1, .08); this.addEntity('roomDecor', '내 방 꾸미기', 5.65, 4.05, sign);
    this.furnitureRoot = new T.Group(); this.scene.add(this.furnitureRoot);
    this.updateRoomFurniture(s, false);
    this.player.position.copy(roomPosition); this.placePetNearPlayer(); this.lastSafe.copy(this.player.position); this.follow.copy(this.player.position);
    this.camera.position.copy(this.follow).add(ROOM_CAMERA_OFFSET); this.camera.lookAt(this.follow); this.renderOnce();
  }
  updateRoomFurniture(s: Save, render = true) {
    if (!this.inRoom || !this.furnitureRoot) return;
    for (const child of [...this.furnitureRoot.children]) { this.furnitureRoot.remove(child); this.disposeModel(child as T.Group); }
    for (const id of s.room.furniture) {
      const position = roomFurniturePosition(s, id);
      const x = (position.column - 2) * 2.55, z = -3.65 + position.row * 2.05;
      const g = new T.Group(); g.position.set(x, 0, z); this.furnitureRoot.add(g);
      if (id === 0) { cylinder(g, 0x9e7555, 0, .55, 0, .56, .62, .22, 8); cylinder(g, 0xe98b9a, 0, .75, 0, .4, .62, .26, 8); }
      else if (id === 1) { cylinder(g, 0xb97855, 0, .3, 0, .3, .38, .55, 8); cylinder(g, 0x579a68, 0, .85, 0, .04, .07, .95, 6); for (const side of [-1, 1]) ball(g, 0x87bf79, side * .25, 1.2, 0, .28); }
      else if (id === 2) { ball(g, 0xb98d62, 0, .55, 0, .48, .48, .38); ball(g, 0xb98d62, 0, 1.08, .04, .34); for (const side of [-1, 1]) ball(g, 0xb98d62, side * .39, .58, .08, .17); }
      else if (id === 3) { box(g, 0x8c6957, 0, 1.5, 0, 1.5, 1.25, .18); box(g, 0x9bd6df, 0, 1.5, .11, 1.23, .98, .05); }
      else if (id === 4) { box(g, 0xe7c6b4, 0, .45, 0, 1.7, .5, 2.2); box(g, 0xf6eee0, 0, .76, -.25, 1.65, .18, 1.5); for (const side of [-1, 1]) ball(g, 0xfff7e9, side * .3, .8, .7, .28, .2, .28); }
      else if (id === 5) { box(g, 0x906b50, 0, 1.05, 0, 1.25, 2.1, .55); for (const y of [.45, 1.1, 1.75]) { box(g, 0xc49a70, 0, y, .3, 1.3, .12, .65); for (let b = 0; b < 3; b++) box(g, [0xd88984, 0x83b6ae, 0xefd18c][b], -.4 + b * .4, y + .23, .3, .24, .35, .3); } }
      else if (id === 6) { cylinder(g, 0x9c795a, 0, .8, 0, .05, .07, 1.5, 7); ball(g, 0xffe699, 0, 1.65, 0, .3); }
      else if (id === 7) { cylinder(g, 0xb47659, 0, .32, 0, .42, .5, .6, 10); for (let b = 0; b < 3; b++) ball(g, 0xe84f70, -.2 + b * .2, .7, 0, .13); }
      else if (id === 8) { cylinder(g, 0xc9824b, 0, .34, 0, .44, .55, .62, 10); cylinder(g, 0x5d934b, 0, 1.05, 0, .05, .07, 1.2, 7); ball(g, 0x6e512f, 0, 1.7, 0, .18); for (let p = 0; p < 10; p++) ball(g, 0xf6cb42, Math.cos(p * Math.PI / 5) * .38, 1.7 + Math.sin(p * Math.PI / 5) * .38, 0, .15, .2, .08); }
      else if (id === 9) { const ring = mesh(new T.TorusGeometry(.58, .07, 8, 28), 0xd9c6ff, 0, 1.05, 0, g); ring.rotation.x = Math.PI / 2; cylinder(g, 0xd4aa62, 0, .5, 0, .06, .08, 1.05, 7); for (const side of [-1, 1]) { const leg = cylinder(g, 0x8665a5, side * .25, 1.15, 0, .035, .05, 1.2, 6); leg.rotation.z = side * .23; } }
      else if (id === 10) { cylinder(g, 0xf0bd70, 0, .28, 0, .72, .82, .5, 14); for (let p = 0; p < 6; p++) { const slice = mesh(new T.ConeGeometry(.32, .65, 3), p % 2 ? 0xffd8a8 : 0xf39cad, Math.cos(p * Math.PI / 3) * .36, .63, Math.sin(p * Math.PI / 3) * .36, g); slice.rotation.z = Math.PI; } }
      else if (id === 11) { box(g, 0x8f6949, 0, .28, 0, 1.6, .16, .6); cylinder(g, 0x8f6949, 0, .86, 0, .06, .08, 1.1, 7); box(g, 0xd6b878, 0, 1.36, 0, .75, .13, .16); for (const side of [-1, 1]) { cylinder(g, 0x9bd6df, side * .5, .75, 0, .35, .25, .16, 12); box(g, 0xb5dbe1, side * .5, .9, 0, .55, .12, .55); } }
      else if (id === 12) { box(g, 0x7f654f, 0, 1.2, 0, 1.8, 1.6, .18); box(g, 0xf8edca, 0, 1.2, .12, 1.55, 1.35, .06); for (let row = 0; row < 3; row++) for (let icon = 0; icon <= row; icon++) ball(g, [0xf38aa3, 0x83b6ae, 0xf0c65f][row], -.5 + icon * .38, 1.62 - row * .4, .18, .1); }
      else if (id === 13) { box(g, 0xd9b36d, 0, 1.25, 0, 1.7, 1.5, .16); box(g, 0xfff7dc, 0, 1.25, .1, 1.42, 1.22, .05); const ribbon = mesh(new T.TorusGeometry(.22, .055, 7, 18), 0xb58bd3, 0, 1.45, .17, g); ribbon.rotation.x = Math.PI / 2; for (let p = 0; p < 6; p++) ball(g, 0xf2c85b, Math.cos(p * Math.PI / 3) * .34, 1.45 + Math.sin(p * Math.PI / 3) * .34, .17, .08); }
      else if (id === 14) { box(g, 0xa57959, 0, 1.3, 0, 1.65, 1.55, .16); box(g, 0xf8efd0, 0, 1.3, .1, 1.38, 1.28, .05); const triangle = mesh(new T.ConeGeometry(.42, .7, 3), 0xe98983, -.38, 1.35, .18, g); triangle.rotation.z = Math.PI; box(g, 0x75a9a0, .38, 1.35, .18, .62, .62, .08); }
      else if (id === 15) { cylinder(g, 0x9a704d, 0, .72, 0, .34, .42, 1.35, 10); const face = cylinder(g, 0xf5db8c, 0, 1.62, .08, .72, .72, .16, 18); face.rotation.x = Math.PI / 2; box(g, 0x5f7058, 0, 1.72, .22, .06, .48, .05); const hand = box(g, 0xd66f70, .12, 1.58, .23, .35, .05, .04); hand.rotation.z = -.65; }
      else if (id === 16) { cylinder(g, 0xa6c879, 0, .04, 0, 1.5, 1.5, .08, 18); for (let p = 0; p < 10; p++) ball(g, [0xf19aa1, 0xf4cd6a, 0x80bca8, 0xa98ac7, 0xf0a86e][p % 5], Math.cos(p * Math.PI / 5) * .95, .13, Math.sin(p * Math.PI / 5) * .95, .15, .08, .15); }
      else if (id === 17) { box(g, 0xa77858, 0, 1.12, 0, 1.65, 1.35, .16); box(g, 0xfff2d3, 0, 1.12, .1, 1.35, 1.05, .06); box(g, 0xe9a2ad, 0, 1.1, .16, .72, .42, .035); box(g, 0xffdf99, 0, 1.1, .19, .13, .13, .04); }
      else if (id === 18) { cylinder(g, 0xb8875f, 0, .22, 0, .55, .6, .4, 12); cylinder(g, 0x96c9dc, 0, .85, 0, .38, .3, .92, 14); ball(g, 0xd9f5ff, 0, 1.32, 0, .32, .14, .32); for (const side of [-1, 1]) ball(g, 0xffe9b5, side * .22, .93, .3, .09); }
      else if (id === 19) { cylinder(g, 0xb58c63, 0, .23, 0, .56, .62, .38, 10); cylinder(g, 0x8a6850, 0, .68, 0, .11, .13, .55, 7); ball(g, 0x8fc386, 0, 1.2, 0, .52, .48, .4); for (let p = 0; p < 5; p++) ball(g, 0xffe7a5, Math.cos(p * 1.26) * .4, 1.27 + Math.sin(p * 1.26) * .3, .32, .1); }
    }
    if (render) this.renderOnce();
  }
  private house(x: number, z: number, roof: number, wall: number) {
    const g = new T.Group(); g.position.set(x, 0, z); this.scene.add(g);
    cylinder(g, 0xcebe96, 0, .22, 0, 2.65, 2.85, .44, 8); cylinder(g, wall, 0, 1.65, 0, 2.35, 2.45, 2.9, 12);
    const r = mesh(new T.ConeGeometry(3.25, 2.2, 8), roof, 0, 4.15, 0, g); r.rotation.y = Math.PI / 8;
    const roofCap = new T.MeshStandardMaterial({ color: roof, roughness: .92, flatShading: true });
    const eave = new T.Mesh(new T.CylinderGeometry(3.12, 3.12, .18, 8), roofCap); eave.position.y = 3.13; eave.rotation.y = Math.PI / 8; g.add(eave);
    cylinder(g, roof, 0, 3.13, 0, 3.1, 3.15, .22, 8); box(g, 0x836343, 0, 1.13, 2.23, 1.05, 1.95, .15); ball(g, 0xfbd180, .3, 1.12, 2.36, .07);
    for (const sign of [-1, 1]) {
      box(g, 0xb19a6a, sign * 1.4, 1.9, 1.94, .92, .96, .12); box(g, 0xffdc94, sign * 1.4, 1.9, 2.01, .68, .7, .08); box(g, wall, sign * 1.4, 1.9, 2.07, .07, .7, .08);
      box(g, 0x9a704d, sign * 1.4, 1.37, 2.08, 1.02, .12, .28); for (let i = 0; i < 3; i++) ball(g, [0xf49bb2, 0xf5d36f, 0xb8d897][i], sign * 1.4 + (i - 1) * .27, 1.52, 2.18, .12, .14, .11);
    }
    // A little scalloped awning, timber framing and a hanging welcome sign make each shop feel handcrafted.
    box(g, 0xf7e8cc, 0, 2.12, 2.1, 3.05, .2, .52);
    for (let i = 0; i < 7; i++) { const stripe = box(g, i % 2 ? 0xe98f98 : 0xf8d98f, -1.28 + i * .43, 2.13, 2.37, .42, .23, .08); stripe.rotation.x = -.08; }
    for (const side of [-1, 1]) { box(g, 0xf5e6c4, side * 2.15, 1.5, 1.76, .12, 2.65, .12); ball(g, 0xffe9a5, side * 2.15, 2.84, 1.76, .1); }
    box(g, 0xf7e5b8, 0, 2.75, 2.52, 1.08, .35, .12); box(g, 0x9a704d, 0, 2.54, 2.52, .08, .28, .08);
    cylinder(g, 0xa47753, 1.3, 4.7, -.8, .3, .35, 1.5, 8); ball(g, 0xf1f1dc, 1.3, 5.8, -.8, .4, .24, .34);
    for (const side of [-1, 1]) { ball(g, 0x8eb878, side * 2.55, .38, 1.7, .44, .26, .35); ball(g, side < 0 ? 0xf6c3cf : 0xf8e2a2, side * 2.55, .57, 1.7, .17, .13, .17); }
    this.colliders.push({ x, z, r: 2.7 });
  }
  private tree(x: number, z: number, scale: number, pink: boolean, foliage?: number) {
    const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); this.scene.add(g); cylinder(g, 0x94724e, 0, 1, 0, .19, .32, 2, 8);
    ball(g, foliage ?? (pink ? 0xe6a2ad : 0x63a56b), 0, 2.55, 0, 1.55, 1.5, 1.38); ball(g, foliage ?? (pink ? 0xf1b8bb : 0x88bd77), -.5, 3.35, 0, 1.12, 1.12, 1); ball(g, foliage ?? (pink ? 0xf5c9c7 : 0xa0cd7e), .5, 3.25, .45, .8, .83, .8);
    // Soft pastel fruit and tiny blossoms add detail without textures or extra effects.
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + x * .37; ball(g, pink ? 0xffe3a1 : 0xe8798b, Math.cos(a) * .86, 2.28 + (i % 2) * .38, Math.sin(a) * .78, .13, .15, .13); }
    ball(g, 0xfff0c6, -.9, 3.08, .1, .11, .1, .1); ball(g, 0xfff0c6, .84, 3.55, -.22, .1, .1, .1); this.colliders.push({ x, z, r: .5 });
  }
  private addChoppableTree(id: number, x: number, z: number, scale: number, pink: boolean, foliage?: number) {
    const g = new T.Group(); g.scale.setScalar(scale); cylinder(g, 0x94724e, 0, 1, 0, .19, .32, 2, 8);
    ball(g, foliage ?? (pink ? 0xe6a2ad : 0x63a56b), 0, 2.55, 0, 1.55, 1.5, 1.38); ball(g, foliage ?? (pink ? 0xf1b8bb : 0x88bd77), -.5, 3.35, 0, 1.12, 1.12, 1); ball(g, foliage ?? (pink ? 0xf5c9c7 : 0xa0cd7e), .5, 3.25, .45, .8, .83, .8);
    g.userData.hp = 7; this.addEntity(`tree${id}`, '베리나무 · 베기', x, z, g); this.colliders.push({ x, z, r: .5, id: `tree${id}` });
  }
  // 틀린 개념을 다시 만나는 "그림자 몬스터". 마을에만 최대 3마리가 나타나고, 다시 풀면 사라져요.
  setShadows(shadows: { id: string; name: string; type: number }[]) {
    const keep: Entity[] = [];
    for (const e of this.entities) { if (e.id.startsWith('shadow')) { this.scene.remove(e.mesh); this.disposeShadow(e.mesh); e.label.remove(); } else keep.push(e); }
    this.entities = keep;
    if (this.selectedId?.startsWith('shadow')) { this.selectedId = null; this.onNear(null, null); }
    if (this.inRoom || this.stage !== 0) return;
    const spots = [[-6.5, 7.5], [3.5, 10.5], [-12, 2.5]] as const, dark = new T.Color(0x3b2f5c);
    shadows.slice(0, spots.length).forEach((shadow, i) => {
      const model = makeMonster(shadow.type);
      // 재질은 색마다 공유되므로, 복제해서 칠해야 다른 몬스터가 같이 어두워지지 않아요.
      model.traverse(o => { if (o instanceof T.Mesh) { const m = (o.material as T.MeshStandardMaterial).clone(); m.color.lerp(dark, .72); m.transparent = true; m.opacity = .82; o.material = m; o.userData.ownMaterial = true; } });
      this.addEntity(shadow.id, shadow.name, spots[i][0], spots[i][1], model);
      this.entities[this.entities.length - 1].label.classList.add('monster-label');
    });
    this.renderOnce();
  }
  private disposeShadow(g: T.Group) { g.traverse(o => { if (o instanceof T.Mesh && o.userData.ownMaterial) (o.material as T.Material).dispose(); }); }
  private addEntity(id: string, name: string, x: number, z: number, model: T.Group) {
    model.position.set(x, 0, z); this.scene.add(model);
    const label = document.createElement('div'); label.className = `entity-label ${id.startsWith('monster') ? 'monster-label' : ''}`; label.textContent = name; this.labelLayer.append(label);
    this.entities.push({ id, name, x, z, mesh: model, label });
  }
  setAvatar(character: number, outfit: number, weapon: number, outfitLevel = 0, weaponLevel = 0, ride = -1, pet = -1, hairstyle = 0, face = 0) {
    const position = this.player.position.clone(), rotation = this.player.rotation.y;
    this.scene.remove(this.player); this.disposeModel(this.player); this.player = makeCharacter(character, outfit, weapon, outfitLevel, weaponLevel, hairstyle, face); this.player.position.copy(position); this.player.rotation.y = rotation; this.player.scale.setScalar(matchMedia('(max-width: 600px)').matches ? 1.08 : 1); this.scene.add(this.player);
    if (this.petModel) { this.scene.remove(this.petModel); this.disposeModel(this.petModel); }
    this.rideIndex = ride; this.petIndex = pet; this.petModel = null; this.petTargetId = null; this.rideAnimated = []; this.petAnimated = []; this.petIdle = 0; this.petReaction = null; this.petCharm = null;
    if (ride >= 0 && RIDES[ride]) { const body = this.player.userData.body as T.Group; body.position.y = riderHeight(ride); const rideModel = makeRide(ride); rideModel.traverse(o => { if (o.userData.rideWing || o.userData.ridePropeller || o.userData.rideGlow) this.rideAnimated.push(o); }); this.player.add(rideModel); }
    if (pet === HERO_BREAD_PET_ID) { const aura = makeHeroPetAura(ride); this.player.add(aura); this.player.userData.heroPetAura = aura; }
    if (pet >= 0 && PETS[pet]) {
      this.petModel = makePet(pet); this.scene.add(this.petModel); this.placePetNearPlayer();
      this.petModel.traverse(o => { if (Object.keys(o.userData).some(k => ['petEye', 'petWing', 'petEar', 'petTail', 'petPaw', 'petCharm'].includes(k))) { o.userData.restRotation = o.rotation.clone(); o.userData.restScale = o.scale.clone(); this.petAnimated.push(o); } });
      this.petCharm = new T.Group(); const ribbon = box(this.petCharm, 0xf19eb7, 0, .7, .48, .2, .1, .04); ribbon.rotation.z = .2; ball(this.petCharm, 0xffd888, 0, .63, .5, .06); this.petCharm.visible = false; (this.petModel.userData.petBody as T.Group).add(this.petCharm);
    }
  }
  dressPet(show: boolean) { if (this.petCharm) this.petCharm.visible = show; }
  reactPet(reaction: PetReaction) {
    if (!this.petModel) return;
    this.petReaction = reaction; this.petReactUntil = this.time + (reaction === 'sleep' ? 8 : reaction === 'sit' ? 5 : 2.6); this.petIdle = 0;
    if (reaction === 'happy' || reaction === 'discover') this.burst(this.petModel.position, 0xf4a3bc, 5);
  }
  private placePetNearPlayer() { if (this.petModel) this.petModel.position.set(this.player.position.x - 1.05, this.player.position.y + .02, this.player.position.z - .7); }
  private disposeModel(g: T.Group) { g.traverse(o => { if (o instanceof T.Mesh && !sharedGeometries.has(o.geometry)) o.geometry.dispose(); }); }
  /** 날씨는 화면 위 필터가 아니라 캐릭터 주변 3D 공간에서 움직여 글자와 지형을 가리지 않아요. */
  setWeather(scene: AmbienceScene | null) {
    const kind = !scene || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : scene.weather === 'rain' ? 'rain' : scene.weather === 'snow' ? 'snow' : scene.season === 'autumn' ? 'leaves' : scene.mood === 'night' ? 'fireflies' : 'none';
    if (kind === this.weatherKind) return;
    this.weatherKind = kind;
    this.container.dataset.weatherEffect = kind;
    if (this.weatherMesh) {
      this.scene.remove(this.weatherMesh);
      this.weatherMesh.geometry.dispose();
      (this.weatherMesh.material as T.Material).dispose();
      this.weatherMesh = null;
    }
    this.weatherDrops = [];
    if (kind === 'none') { this.renderOnce(); return; }
    const count = this.lowQuality ? (kind === 'rain' ? 12 : kind === 'snow' ? 16 : kind === 'fireflies' ? 6 : 7)
      : matchMedia('(pointer: coarse)').matches ? (kind === 'rain' ? 28 : kind === 'snow' ? 38 : kind === 'fireflies' ? 10 : 14) : (kind === 'rain' ? 48 : kind === 'snow' ? 60 : kind === 'fireflies' ? 16 : 22);
    const geometry = kind === 'rain' ? new T.CylinderGeometry(.014, .014, .38, 3) : kind === 'snow' ? new T.OctahedronGeometry(.14) : kind === 'fireflies' ? new T.SphereGeometry(.07, 6, 4) : new T.PlaneGeometry(.28, .19);
    const material = new T.MeshBasicMaterial({ color: kind === 'rain' ? 0xc3deee : kind === 'snow' ? 0xdbeaf1 : kind === 'fireflies' ? 0xffdc79 : 0xd59042, transparent: true, opacity: kind === 'rain' ? .48 : .78, depthWrite: false, side: T.DoubleSide });
    this.weatherMesh = new T.InstancedMesh(geometry, material, count);
    this.weatherMesh.frustumCulled = false;
    this.weatherMesh.castShadow = false;
    this.weatherMesh.receiveShadow = false;
    this.scene.add(this.weatherMesh);
    this.weatherDrops = Array.from({ length: count }, (_, i) => ({
      x: this.player.position.x + (Math.random() - .5) * 26,
      y: kind === 'fireflies' ? .5 + Math.random() * 2 : .5 + Math.random() * 8,
      z: this.player.position.z + (Math.random() - .5) * 26,
      speed: kind === 'rain' ? 10 + Math.random() * 4 : kind === 'snow' ? .8 + Math.random() * .65 : kind === 'fireflies' ? .08 + Math.random() * .1 : 1.2 + Math.random() * .8,
      sway: (Math.random() - .5) * (kind === 'rain' ? .5 : 1.3),
      phase: i * 2.4 + Math.random() * 3,
    }));
    this.updateWeather(0);
  }
  private updateWeather(dt: number) {
    const mesh = this.weatherMesh;
    if (!mesh) return;
    mesh.visible = !this.inRoom;
    if (this.inRoom) return;
    const p = this.player.position, kind = this.weatherKind;
    for (let i = 0; i < this.weatherDrops.length; i++) {
      const drop = this.weatherDrops[i];
      drop.y += (kind === 'fireflies' ? 1 : -1) * drop.speed * dt;
      drop.x += (kind === 'rain' ? -.5 : drop.sway + Math.sin(this.time * 1.2 + drop.phase) * .3) * dt;
      if (drop.y < .15 || (kind === 'fireflies' && drop.y > 3.2) || Math.abs(drop.x - p.x) > 17 || Math.abs(drop.z - p.z) > 17) {
        drop.x = p.x + (Math.random() - .5) * 26;
        drop.y = kind === 'fireflies' ? .5 + Math.random() : 8 + Math.random() * 3;
        drop.z = p.z + (Math.random() - .5) * 26;
      }
      this.weatherDummy.position.set(drop.x, drop.y, drop.z);
      this.weatherDummy.rotation.set(kind === 'leaves' ? this.time * .8 + drop.phase : 0, kind === 'leaves' ? this.time * 1.4 + drop.phase : 0, kind === 'rain' ? -.15 : 0);
      this.weatherDummy.scale.setScalar(kind === 'snow' ? .75 + Math.sin(drop.phase) * .2 : kind === 'fireflies' ? .65 + .35 * Math.sin(this.time * 2 + drop.phase) : 1);
      this.weatherDummy.updateMatrix();
      mesh.setMatrixAt(i, this.weatherDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  setActive(active: boolean) { this.active = active; this.paused = !active; if (!active) this.clearInput(); this.syncAnimation(); }
  setPaused(paused: boolean) { this.paused = paused; if (paused) this.clearInput(); this.syncAnimation(); }
  private syncAnimation() {
    const shouldRun = this.active && !this.paused && !document.hidden;
    if (shouldRun && !this.animationRunning) { this.animationRunning = true; this.clock.start(); this.renderer.setAnimationLoop(() => this.frame()); }
    else if (!shouldRun && this.animationRunning) { this.animationRunning = false; this.renderer.setAnimationLoop(null); if (!document.hidden) this.renderOnce(); }
  }
  private renderOnce() { if (!document.hidden) this.renderer.render(this.scene, this.camera); }
  restore(s: Save) { this.setAvatar(s.character, s.outfit, s.weapon, s.outfits[s.outfit], s.weapons[s.weapon], s.ride, s.pet, s.hairstyle, s.face); if (s.homestead.inside) this.enterHomestead(s,true); else if (s.room.inside) this.enterRoom(s); else this.loadStage(s); this.quality(s.settings.lowQuality); }
  quality(low: boolean) { this.lowQuality = low; const touchDevice = matchMedia('(pointer: coarse)').matches; this.renderer.setPixelRatio(Math.min(devicePixelRatio, low || touchDevice ? 1 : 1.25)); this.renderer.shadowMap.enabled = !low; this.sun.castShadow = !low;this.homeVisitors.forEach((v,i)=>v.entity.mesh.visible=i<(low?1:3)); }
  clearInput() { this.keys.clear(); this.stick = { x: 0, z: 0 }; }
  guideTo(kind: GuideKind) {
    const entityMatch = (entity: Entity) => kind === 'homeVisitor' ? entity.id.startsWith('homeVisitor') : kind === 'forestWork' ? entity.id === `forestWork${this.trailNext}` : kind === 'trailSeed' ? entity.id.startsWith('trailSeed') && Math.floor(Number(entity.id.slice(9)) / 2) === this.trailNext : kind === 'trailLamp' ? entity.id === `trailLamp${this.trailNext}` : kind === 'monster' ? entity.id.startsWith('monster') : kind === 'expMonster' ? entity.id.startsWith('expMonster') : kind === 'storyClue' ? entity.id.startsWith('storyClue') : kind === 'shop' ? ['weapon', 'outfit', 'ride', 'pet', 'potion', 'beauty'].includes(entity.id) : entity.id === kind;
    const candidates: { object: T.Object3D; name: string; arrivalDistance: number }[] = kind === 'berry'
      ? this.coins.filter(coin => coin.mesh.visible).map(coin => ({ object: coin.mesh, name: '길 위의 베리', arrivalDistance: .9 }))
      : kind === 'star'
        ? this.stars.filter(star => star.mesh.visible).map(star => ({ object: star.mesh, name: '별빛 표식', arrivalDistance: 1.2 }))
        : this.entities.filter(entity => entity.mesh.visible && entityMatch(entity)).map(entity => ({ object: entity.mesh, name: entity.name, arrivalDistance: 2.6 }));
    candidates.sort((a, b) => a.object.position.distanceToSquared(this.player.position) - b.object.position.distanceToSquared(this.player.position));
    this.guideTarget = candidates[0] ?? null;
    if (!this.guideTarget) { this.clearGuide(); return null; }
    this.guideElement.querySelector('b')!.textContent = this.guideTarget.name;
    this.guideElement.hidden = false;
    return this.guideTarget.name;
  }
  private clearGuide() { this.guideTarget = null; this.guideElement.hidden = true; }
  moveStick(x: number, z: number) { this.stick = { x, z }; }
  jump() { if (this.active && !this.paused && !this.storyActivityFocus && this.grounded) { this.vy = 7.4; this.grounded = false; this.onJump(); } }
  interact() { if (this.active && !this.paused && !this.storyActivityFocus && this.selectedId) this.onInteract(this.selectedId); }
  attack() { if (!this.active || this.paused || this.storyActivityFocus) return; this.swingUntil = this.time + .28; this.onAttack(this.selectedId?.startsWith('tree') ? this.selectedId : null); }
  hitTree(id: string, damage: number) {
    const e = this.entities.find(e => e.id === id && e.mesh.visible); if (!e || !id.startsWith('tree')) return null;
    e.mesh.userData.hp = Math.max(0, Number(e.mesh.userData.hp) - damage); e.mesh.userData.shakeUntil = this.time + .28; this.burst(e.mesh.position, 0xc5e88b, 5);
    if (e.mesh.userData.hp === 0) { e.mesh.visible = false; e.label.hidden = true; cylinder(this.scene, 0xa77b50, e.x, .2, e.z, .32, .43, .4, 9); this.burst(e.mesh.position, 0xffa1b8, 12); this.selectedId = null; this.onNear(null, null); }
    return { fell: e.mesh.userData.hp === 0, remaining: e.mesh.userData.hp as number };
  }
  defeat(id: string) { const e = this.entities.find(e => e.id === id); if (e) { const type = id.startsWith('expMonster') ? Number(e.mesh.userData.monsterType) : stageMonsters(this.stage)[Number(id.slice(7))].type; this.burst(e.mesh.position, MONSTERS[type].color); e.mesh.visible = false; } }
  celebrate() { this.burst(this.player.position, 0xffd371, 10); }
  private burst(pos: T.Vector3, color: number, count = 14) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const available = Math.max(0, 48 - this.particles.length); for (let i = 0; i < Math.min(count, available); i++) { const m = mesh(particleGeometry, color, pos.x, pos.y + .9, pos.z, this.scene); this.particles.push({ mesh: m, v: new T.Vector3((Math.random() - .5) * 3.5, 1.5 + Math.random() * 2, (Math.random() - .5) * 3.5), life: .75 }); } }
  private water(x: number, z: number) { return !this.inHomestead && !this.inRoom && !(this.stage === 0 && this.restoredBridge && x > 14 && x < 24 && Math.abs(z - 8) < 1) && isVillagePond(this.stage, x, z); }
  private resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight, span = w < 700 ? 13 : 14.5;
    if (this.storyActivityFocus) {
      const landscape = w / h > 1.6 && h < 600, width = landscape ? 19 : 11.8, height = width * h / w;
      this.camera.left = landscape ? -6 : -width / 2; this.camera.right = landscape ? 13 : width / 2;
      this.camera.top = height * (landscape ? .5 : .34); this.camera.bottom = -height * (landscape ? .5 : .66);
    } else { this.camera.left = -span * w / h; this.camera.right = span * w / h; this.camera.top = span; this.camera.bottom = -span; }
    this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
  }
  /** 베리·꽃·눈알처럼 작은 조각은 그림자가 거의 보이지 않아요. 그림자 그리기에서 빼서 태블릿의 그리기 횟수를 크게 줄여요. */
  private trimSmallShadows() {
    this.scene.traverse(o => {
      if (!(o instanceof T.Mesh) || o.userData.shadowChecked) return; o.userData.shadowChecked = true;
      if (!o.castShadow) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      o.getWorldScale(this.tempScale); const radius = (o.geometry.boundingSphere ?? this.tempSphere).radius * Math.max(this.tempScale.x, this.tempScale.y, this.tempScale.z);
      if (radius < .25) o.castShadow = false;
    });
  }
  private frame() {
    if (document.hidden || this.paused || !this.active) return;
    const dt = Math.min(this.clock.getDelta(), .04); this.time += dt;
    if(this.inHomestead)this.animateHomeVisitors(dt);
    if (this.shadowSweep++ % 45 === 0) this.trimSmallShadows(); // 새로 생긴 펫·탈것·몬스터도 곧 정리돼요.
    const p = this.player.position;
    this.updateWeather(dt);
    if (this.active && !this.paused && !this.storyActivityFocus) {
      const oldX = p.x, oldZ = p.z;
      let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')) + this.stick.x;
      let dz = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup')) + this.stick.z;
      const n = Math.hypot(dx, dz); if (n > 1) { dx /= n; dz /= n; }
      const ride = this.rideIndex >= 0 ? RIDES[this.rideIndex] : null, flying = !!ride?.flying, speed = PLAYER_MOVE_SPEED * (ride?.speed ?? 1);
      const vx = (dx * .8 + dz * .6) * speed, vz = (-dx * .6 + dz * .8) * speed;
      const allowed = (x: number, z: number) => flying || (!this.colliders.some(c => (!c.id || this.entities.find(e => e.id === c.id)?.mesh.visible) && Math.hypot(x - c.x, z - c.z) < c.r + .32) && !this.platforms.some(t => Math.abs(x - t.x) < t.w / 2 + .2 && Math.abs(z - t.z) < t.d / 2 + .2 && p.y < t.h - .13));
      if (allowed(p.x + vx * dt, p.z)) p.x += vx * dt; if (allowed(p.x, p.z + vz * dt)) p.z += vz * dt;
      if (n > .05) { this.player.rotation.y = Math.atan2(vx, vz); this.player.userData.feet?.forEach((f: T.Mesh, i: number) => { f.position.y = .18 + Math.max(0, Math.sin(this.time * 13 + i * Math.PI)) * .12; }); }
      const platform = flying ? undefined : this.platforms.find(t => Math.abs(p.x - t.x) < t.w / 2 + .15 && Math.abs(p.z - t.z) < t.d / 2 + .15); const floor = flying ? 1.65 + Math.sin(this.time * 2.2) * .08 : platform?.h ?? 0;
      this.vy -= 18 * dt; p.y += this.vy * dt; if (p.y <= floor && this.vy <= 0) { p.y = floor; this.vy = 0; this.grounded = true; } else this.grounded = false;
      const bounds = this.inHomestead ? { x: 13.4, z: 13.4 } : this.inRoom ? { x: 6.8, z: 5.2 } : stageSize(this.stage);
      if (Math.abs(p.x) > bounds.x - .5 || Math.abs(p.z) > bounds.z - .5 || (!flying && this.water(p.x, p.z) && p.y <= .2)) { p.copy(this.lastSafe); this.vy = 0; this.onRescue(); }
      else if (this.grounded && (flying || !this.water(p.x, p.z)) && Math.abs(p.x) < bounds.x - 2 && Math.abs(p.z) < bounds.z - 2) this.lastSafe.copy(p);
      if (this.petModel) { const walked = Math.hypot(p.x - oldX, p.z - oldZ); if (walked < 4) this.petWalk += walked; if (this.petWalk >= 1) { this.onPetWalk(this.petWalk); this.petWalk = 0; } }
      // 베리는 바닥의 수평 거리로 판정해 발판·점프·라이딩 높이에서도 눈에 닿으면 수집됩니다.
      for (const c of this.coins) if (c.mesh.visible && berryWithinReach(p.x, p.z, c.mesh.position.x, c.mesh.position.z)) { c.mesh.visible = false; this.burst(c.mesh.position, 0xff9fb4, 6); this.onCollect(c.id); }
      for (const star of this.stars) if (star.mesh.visible && Math.hypot(p.x - star.mesh.position.x, p.z - star.mesh.position.z) < 1.35) { star.mesh.visible = false; star.label.hidden = true; this.burst(star.mesh.position, 0xffdf83, 8); this.onStar(star.id); }
      if (this.petModel && this.petIndex >= 0) {
        let target = this.petTargetId === null ? undefined : this.coins.find(c => c.id === this.petTargetId && c.mesh.visible);
        if (!target) {
          this.petTargetId = null; let best: number = PETS[this.petIndex].radius;
          for (const c of this.coins) { if (!c.mesh.visible) continue; const d = Math.hypot(p.x - c.mesh.position.x, p.z - c.mesh.position.z); if (d < best) { target = c; best = d; } }
          if (target) { this.petTargetId = target.id; this.reactPet('discover'); }
        }
        if (target) { this.tempTarget.copy(target.mesh.position); this.tempTarget.y -= .46; }
        else this.tempTarget.set(-1.05, .12, -.7).applyQuaternion(this.player.quaternion).add(p);
        this.tempWorld.set(this.tempTarget.x - this.petModel.position.x, 0, this.tempTarget.z - this.petModel.position.z); const distanceToTarget = this.tempWorld.length();
        if (distanceToTarget > .06) { const angle = Math.atan2(this.tempWorld.x, this.tempWorld.z), turn = Math.atan2(Math.sin(angle - this.petModel.rotation.y), Math.cos(angle - this.petModel.rotation.y)); this.petModel.rotation.y += turn * Math.min(1, dt * 12); }
        const rideSpeed = this.rideIndex >= 0 ? RIDES[this.rideIndex].speed : 1;
        const step = petChaseSpeed(rideSpeed) * dt;
        if (distanceToTarget > step) this.petModel.position.addScaledVector(this.tempWorld, step / distanceToTarget); else this.petModel.position.copy(this.tempTarget);
        const petMoving = distanceToTarget > .15;
        this.petMotion = petMoving; this.petEating = !!target && distanceToTarget < .9;
        this.petIdle = petMoving || target ? 0 : this.petIdle + dt;
        if (this.petReactUntil <= this.time) this.petReaction = null;
        if (petMoving && this.petReaction === 'sleep') this.petReaction = null;
        const petBaseY = target ? target.mesh.position.y - .46 : p.y;
        const petFlying = PETS[this.petIndex].flying;
        const hop = this.petIndex === 1 ? Math.max(0, Math.sin(this.time * 8)) * .24 : Math.abs(Math.sin(this.time * 12)) * .09;
        const perched = petFlying && this.petIdle > 5;
        const height = petBaseY + (petFlying ? (perched ? .08 : .65) + Math.sin(this.time * 3.2) * .035 : petMoving ? hop : .02 + Math.sin(this.time * 2.4) * .012);
        this.petModel.position.y += (height - this.petModel.position.y) * Math.min(1, dt * 12);
        if (!petMoving && !target) { const angle = Math.atan2(p.x - this.petModel.position.x, p.z - this.petModel.position.z); this.petModel.rotation.y += Math.atan2(Math.sin(angle - this.petModel.rotation.y), Math.cos(angle - this.petModel.rotation.y)) * Math.min(1, dt * 3); }
        const petBody = this.petModel.userData.petBody as T.Object3D | undefined;
        if (petBody) {
          const sleeping = !petMoving && (this.petReaction === 'sleep' || this.petIdle > 12), sitting = !petMoving && this.petReaction === 'sit';
          petBody.scale.y = sleeping ? .68 : sitting ? .78 : this.petEating ? .86 + Math.sin(this.time * 13) * .1 : petMoving ? .96 + Math.sin(this.time * 11) * .04 : 1;
          petBody.rotation.x = sleeping ? -.15 : sitting ? -.08 : this.petEating ? .18 : 0;
          petBody.rotation.y = this.petReaction === 'spin' ? (this.time - this.petReactUntil + 2.6) * Math.PI * 2 : 0;
          petBody.position.y = this.petReaction === 'happy' ? Math.abs(Math.sin(this.time * 7)) * .17 : 0;
        }
        if (target && distanceToTarget < .55 && target.mesh.visible) { target.mesh.visible = false; this.petTargetId = null; this.burst(target.mesh.position, 0xff9fb4, 6); this.onCollect(target.id); }
      }
    }
    if (this.storyActivityFocus && this.storyActivityRoot) this.storyActivityRoot.traverse(o => { if (o.userData.storyWheel && o.parent?.userData.storyActivity) { const water = this.storyActivityRoot!.userData.waterSolved; if (water) o.rotation.z -= dt; } });
    for (const o of this.craftAnimated) { if (o.userData.homeRotor) { if(!matchMedia('(prefers-reduced-motion: reduce)').matches)o.rotation.z-=dt*.8; } else if (o.userData.fieldWheel) { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) o.rotation.z -= dt * .7; } else if (o.userData.storyWheel) o.rotation.z -= dt * .7; else { o.rotation.y += dt * .6; o.scale.setScalar(1.5 + Math.sin(this.time * 1.7 + Number(o.userData.storySparkle)) * .12); } }
    for (const c of this.coins) { c.mesh.rotation.y += dt; c.mesh.position.y = c.y + Math.sin(this.time * 2.8 + c.mesh.position.x) * .12; }
    // 화면 크기는 한 프레임에 한 번만 읽어요. 이름표마다 읽으면 그때마다 페이지 배치를 다시 계산해 태블릿에서 버벅여요.
    const viewW = this.container.clientWidth, viewH = this.container.clientHeight;
    const placeLabel = (label: HTMLElement, v: T.Vector3, hidden: boolean) => {
      if (label.hidden !== hidden) label.hidden = hidden;
      if (hidden) return;
      const transform = `translate(-50%, -100%) translate(${Math.round((v.x * .5 + .5) * viewW)}px, ${Math.round((-v.y * .5 + .5) * viewH)}px)`;
      if (label.style.transform !== transform) label.style.transform = transform;
    };
    for (const marker of this.activityMarkers) placeLabel(marker.label, this.tempProjection.copy(marker.at).project(this.camera), false);
    for (const star of this.stars) {
      star.mesh.rotation.y += dt * 1.9; star.mesh.position.y = star.y + Math.sin(this.time * 3 + star.id) * .16;
      const v = this.tempProjection.set(star.mesh.position.x, 2, star.mesh.position.z).project(this.camera);
      placeLabel(star.label, v, !this.active || !star.mesh.visible || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.1);
    }
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
      placeLabel(e.label, v, !!this.storyActivityFocus || !this.active || !e.mesh.visible || (this.stage === 0 && !this.inRoom && !this.inHomestead && (e.id.startsWith('tree') ? d > 3.8 : e.id.startsWith('monster') ? d > 7 : false)) || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.1);
      const isNear = d < 2.8; if (e.label.classList.contains('near') !== isNear) e.label.classList.toggle('near', isNear);
    }
    if (!this.storyActivityFocus && (near?.id ?? null) !== this.selectedId) {
      this.entities.find(e => e.id === this.selectedId)?.label.classList.remove('is-target');
      near?.label.classList.add('is-target');
      this.selectedId = near?.id ?? null; this.onNear(near?.name ?? null, near?.id ?? null);
    }
    for (const butterfly of this.butterflies) { butterfly.position.y += Math.sin(this.time * 4 + butterfly.position.x) * .0015; butterfly.rotation.y += dt * .7; }
    if(this.inHomestead)this.homeVisitors.forEach(v=>v.entity.label.hidden=v.entity.id!==this.selectedId||!v.entity.mesh.visible);
    const weapon = this.player.userData.weapon as T.Group | undefined; if (weapon) weapon.rotation.z = -.28 + (this.swingUntil > this.time ? Math.sin((this.swingUntil - this.time) / .28 * Math.PI) * -1.35 : 0);
    for (const o of this.rideAnimated) {
      if (o.userData.rideWing) o.rotation.z = Number(o.userData.rideWing) * (-.72 + Math.sin(this.time * 7) * .18);
      if (o.userData.ridePropeller) o.rotation.z += dt * 11;
      if (o.userData.rideGlow) { o.rotation.z += dt * .9; o.userData.baseScale ??= o.scale.clone(); o.scale.copy(o.userData.baseScale as T.Vector3).multiplyScalar(1 + Math.sin(this.time * 3.5) * .09); } // 원래 크기를 기준으로 반짝여요(작은 별가루가 커다란 공이 되지 않게)
    }
    if (this.petModel) for (const o of this.petAnimated) {
      const rest = o.userData.restRotation as T.Euler, sleeping = !this.petMotion && (this.petReaction === 'sleep' || this.petIdle > 12);
      if (o.userData.petCharm) { o.rotation.y += dt * 3; const pulse = 1 + Math.sin(this.time * 6) * .12; o.userData.baseScale ??= o.scale.clone(); o.scale.copy(o.userData.baseScale as T.Vector3).multiplyScalar(pulse); }
      if (o.userData.petWing) o.rotation.z = rest.z + Number(o.userData.petWing) * (sleeping || this.petIdle > 5 ? .06 : Math.sin(this.time * 9) * .2);
      if (o.userData.petEar) o.rotation.z = rest.z + Math.sin(this.time * (this.petIndex === 1 ? 3.6 : 2) + Number(o.userData.petEar)) * (sleeping ? .015 : .06);
      if (o.userData.petTail) o.rotation.y = rest.y + Math.sin(this.time * (this.petIndex === 16 || this.petReaction === 'happy' ? 13 : 4.6)) * (sleeping ? .03 : .4);
      if (o.userData.petPaw) o.rotation.x = rest.x + (this.petMotion ? Math.sin(this.time * 12 + Number(o.userData.petPaw) * Math.PI / 2) * .3 : 0);
      if (o.userData.petEye) { const scale = o.userData.restScale as T.Vector3; o.scale.y = scale.y * (sleeping || Math.sin(this.time * 1.7) > .995 ? .13 : 1); }
    }
    const heroAura = this.player.userData.heroPetAura as T.Group | undefined;
    if (heroAura) {
      heroAura.rotation.y += dt * 1.35;
      heroAura.traverse(o => {
        if (o.userData.heroAuraRing) { o.rotation.z += dt * .55 * Number(o.userData.heroAuraRing); const pulse = 1 + Math.sin(this.time * 3.4 + Number(o.userData.heroAuraRing)) * .07; o.scale.setScalar(pulse); }
        if (o.userData.heroAuraSparkle !== undefined) { const i = Number(o.userData.heroAuraSparkle); o.position.y = .55 + (i % 3) * .3 + Math.sin(this.time * 3.2 + i) * .09; o.rotation.y += dt * 2.4; }
      });
    }
    if (this.player.userData.sparkles) this.player.userData.sparkles.rotation.y += dt;
    for (let i = this.particles.length - 1; i >= 0; i--) { const q = this.particles[i]; q.life -= dt; q.v.y -= dt * 5; q.mesh.position.addScaledVector(q.v, dt); q.mesh.scale.setScalar(Math.max(0, q.life)); if (q.life <= 0) { this.scene.remove(q.mesh); this.particles.splice(i, 1); } }
    const target = this.storyActivityFocus ?? (this.active ? p : this.cameraTarget.set(0, 0, -1)); this.follow.lerp(target, 1 - Math.exp(-dt * (this.storyActivityFocus ? 8 : 3)));
    this.camera.position.copy(this.follow).add(this.storyActivityFocus ? this.cameraTarget.set(0, 13, 16) : this.inRoom ? ROOM_CAMERA_OFFSET : CAMERA_OFFSET); this.camera.lookAt(this.follow); this.updateGuide(); this.renderer.render(this.scene, this.camera);
  }
  private updateGuide() {
    const target = this.guideTarget;
    if (!target || !target.object.visible) { if (target) this.clearGuide(); return; }
    target.object.getWorldPosition(this.tempWorld);
    const distance = Math.hypot(this.player.position.x - this.tempWorld.x, this.player.position.z - this.tempWorld.z);
    if (distance < target.arrivalDistance) { this.clearGuide(); return; }
    const projected = this.tempProjection.copy(this.tempWorld).project(this.camera), width = this.container.clientWidth, height = this.container.clientHeight;
    const rawX = (projected.x * .5 + .5) * width, rawY = (-projected.y * .5 + .5) * height;
    const x = Math.min(width - 64, Math.max(64, rawX)), y = Math.min(height - 92, Math.max(78, rawY));
    const angle = Math.atan2(rawY - height / 2, rawX - width / 2) * 180 / Math.PI;
    this.guideElement.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    (this.guideElement.querySelector('span') as HTMLElement).style.transform = `rotate(${angle}deg)`;
    this.guideElement.querySelector('small')!.textContent = `${Math.ceil(distance)}m 앞`;
  }
}

export class AvatarPreview {
  private scene = new T.Scene(); private camera = new T.PerspectiveCamera(30, 1, .1, 20); private renderer: T.WebGLRenderer; private model = new T.Group(); private resizeObserver: ResizeObserver; private animationFrame = 0; private lastFrame = 0; private drawWidth = 0; private drawHeight = 0;
  constructor(private element: HTMLElement) {
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.renderer.setClearColor(0x000000, 0); this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.4; element.append(this.renderer.domElement); this.scene.add(new T.HemisphereLight(0xffffff, 0xa6ba93, 3)); const light = new T.DirectionalLight(0xffedcd, 3); light.position.set(-3, 4, 5); this.scene.add(light); this.camera.position.set(2.2, 1.9, 5.8); this.camera.lookAt(0, 1.1, 0);
    this.resizeObserver = new ResizeObserver(() => this.draw()); this.resizeObserver.observe(element); this.animate(performance.now());
  }
  private replaceModel(model: T.Group, camera: [number, number, number], lookY: number, fit = false) {
    this.scene.remove(this.model); this.model.traverse(x => { if (x instanceof T.Mesh && !sharedGeometries.has(x.geometry)) x.geometry.dispose(); }); this.model = model; this.model.rotation.y = -.18;
    this.camera.position.set(...camera); this.camera.lookAt(0, lookY, 0);
    if (fit) this.fitCamera(new T.Vector3(...camera).sub(new T.Vector3(0, lookY, 0)).normalize());
    this.scene.add(this.model); this.draw();
  }
  /** 키가 큰 펫·라이딩도 머리끝이 잘리지 않도록 모델 크기에 맞춰 카메라 거리를 정해요. */
  private fitCamera(direction: T.Vector3) {
    this.model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(this.model), center = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
    const aspect = Math.max(.6, (this.element.clientWidth || 1) / (this.element.clientHeight || 1)), vertical = T.MathUtils.degToRad(this.camera.fov) / 2, horizontal = Math.atan(Math.tan(vertical) * aspect);
    const across = Math.max(size.x, size.z), distance = Math.max(size.y / 2 / Math.tan(vertical), across / 2 / Math.tan(horizontal)) * 1.12 + across / 2;
    this.camera.position.copy(center).addScaledVector(direction, distance); this.camera.lookAt(center);
  }
  show(c: number, o: number, w: number, ol = 0, wl = 0, hairstyle = 0, face = 0) { const model = makeCharacter(c, o, w, ol, wl, hairstyle, face); model.userData.previewKind = 'avatar'; this.replaceModel(model, [2.2, 1.9, 5.8], 1.1); }
  showSalon(c: number, o: number, hairstyle: number, face: number) {
    const model = makeCharacter(c, o, 0, 0, 0, hairstyle, face);
    (model.userData.weapon as T.Group | undefined)?.removeFromParent();
    this.replaceModel(model, [0, 1.62, 3.05], 1.43);
  }
  salonPortrait(c: number, o: number, hairstyle: number, face: number): string {
    this.showSalon(c, o, hairstyle, face);
    return this.renderer.domElement.toDataURL('image/png');
  }
  showPet(id: number) { const model = makePet(id); model.position.set(0, PETS[id].flying ? -.18 : .08, 0); model.scale.setScalar(id === 10 ? 1.48 : id === HERO_BREAD_PET_ID ? 1.6 : id >= 12 ? 1.55 : 1.72); model.userData.previewKind = 'pet'; this.replaceModel(model, [2.1, 1.35, 4.15], id === 10 ? .68 : .62, true); }
  showRide(id: number, c: number, o: number, w: number, ol = 0, wl = 0, hairstyle = 0, face = 0) { const model = makeCharacter(c, o, w, ol, wl, hairstyle, face), body = model.userData.body as T.Group; body.position.y = riderHeight(id); model.add(makeRide(id)); model.userData.previewKind = 'ride'; this.replaceModel(model, [3.4, 2.35, 7.7], 1.15, true); }
  private draw() { const w = this.element.clientWidth, h = this.element.clientHeight; if (!w || !h) return; if (w !== this.drawWidth || h !== this.drawHeight) { this.drawWidth = w; this.drawHeight = h; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); } this.renderer.render(this.scene, this.camera); }
  private animate = (time: number) => { this.animationFrame = requestAnimationFrame(this.animate); if (time - this.lastFrame < 33 || document.hidden || !this.element.isConnected) return; this.lastFrame = time; this.model.rotation.y = -.18 + Math.sin(time * .0007) * .16; const body = this.model.userData.body as T.Group | undefined; if (body) { body.userData.baseY ??= body.position.y; body.position.y = (body.userData.baseY as number) + Math.sin(time * .003) * .035; } const sparkles = this.model.userData.sparkles as T.Group | undefined; if (sparkles) sparkles.rotation.y += .025; this.model.traverse(o => { if (o.userData.petCharm) { o.rotation.y += .06; o.userData.baseScale ??= o.scale.clone(); o.scale.copy(o.userData.baseScale as T.Vector3).multiplyScalar(1 + Math.sin(time * .006) * .12); } if (o.userData.petWing) o.rotation.z = Number(o.userData.petWing) * (.4 + Math.sin(time * .011) * .14); if (o.userData.rideWing) o.rotation.z = Number(o.userData.rideWing) * (-.72 + Math.sin(time * .009) * .14); if (o.userData.ridePropeller) o.rotation.z += .18; if (o.userData.rideGlow) o.rotation.z += .025; }); this.draw(); };
  dispose() { cancelAnimationFrame(this.animationFrame); this.resizeObserver.disconnect(); this.model.traverse(x => { if (x instanceof T.Mesh && !sharedGeometries.has(x.geometry)) x.geometry.dispose(); }); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove(); } // 미리보기를 자주 바꿔도 WebGL 창이 쌓여 게임 화면이 꺼지지 않도록 바로 돌려줘요.
}

/** Render the four selection portraits from the same 3D character models using one temporary WebGL context. */
export function characterPortraits(): string[] {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  try {
    renderer.setPixelRatio(1);
    renderer.setSize(100, 112, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0xa6ba93, 3));
    const light = new T.DirectionalLight(0xffedcd, 3); light.position.set(-3, 4, 5); scene.add(light);
    const camera = new T.PerspectiveCamera(30, 100 / 112, .1, 20);
    camera.position.set(1.25, 1.75, 4.35); camera.lookAt(0, 1.13, 0);
    return CHARACTERS.map((character, index) => {
      const model = makeCharacter(index, 0, 0, 0, 0, character.style);
      model.rotation.y = -.2;
      scene.add(model); renderer.render(scene, camera);
      const image = renderer.domElement.toDataURL('image/png');
      scene.remove(model);
      model.traverse(o => { if (o instanceof T.Mesh && !sharedGeometries.has(o.geometry)) o.geometry.dispose(); });
      return image;
    });
  } finally { renderer.dispose(); renderer.forceContextLoss(); }
}
