import * as T from 'three';
import { CHARACTERS, MONSTERS, OUTFITS, WEAPONS, type Save } from './rules';
import { STAGES, stageBerries, stageMonsters, stagePlatforms, stageSize } from './stages';

type Entity = { id: string; name: string; x: number; z: number; mesh: T.Group; label: HTMLDivElement };
const mat = (color: number, roughness = .86) => new T.MeshStandardMaterial({ color, roughness });
const materials = new Map<number, T.MeshStandardMaterial>();
function material(color: number) { if (!materials.has(color)) materials.set(color, mat(color)); return materials.get(color)!; }
function mesh(geo: T.BufferGeometry, color: number, x = 0, y = 0, z = 0, parent?: T.Object3D) {
  const m = new T.Mesh(geo, material(color)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent?.add(m); return m;
}
function ball(p: T.Object3D, color: number, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx) {
  const m = mesh(new T.SphereGeometry(1, 14, 10), color, x, y, z, p); m.scale.set(sx, sy, sz); return m;
}
function box(p: T.Object3D, color: number, x: number, y: number, z: number, w: number, h: number, d: number) { return mesh(new T.BoxGeometry(w, h, d), color, x, y, z, p); }
function cylinder(p: T.Object3D, color: number, x: number, y: number, z: number, top: number, bottom: number, h: number, sides = 16) { return mesh(new T.CylinderGeometry(top, bottom, h, sides), color, x, y, z, p); }

export function makeCharacter(character: number, outfit: number, weapon: number, outfitLevel = 0, weaponLevel = 0) {
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
  ball(body, c.hair, 0, 1.77, -.065, .55, .31, .46);
  for (const side of [-1, 1]) {
    ball(body, c.skin, side * .51, 1.47, 0, .1, .14, .12);
    ball(body, 0x343a39, side * .19, 1.5, .424, .047, .065, .026);
    ball(body, 0xffffff, side * .18, 1.524, .444, .014);
    ball(body, 0xf1a69d, side * .31, 1.37, .397, .086, .043, .021);
    if (c.style === 0) { ball(body, c.hair, side * .55, 1.68, -.06, .24); ball(body, o.accent, side * .43, 1.84, .04, .12); }
    if (c.style === 2) ball(body, c.hair, side * .43, 1.47, -.13, .18, .43, .3);
  }
  const smile = mesh(new T.TorusGeometry(.075, .012, 5, 10, Math.PI), 0x975e57, 0, 1.35, .44, body); smile.rotation.z = Math.PI;
  for (let i = 0; i < (c.style === 3 ? 7 : 4); i++) ball(body, c.hair, -.38 + i * (c.style === 3 ? .125 : .23), 1.86 + Math.sin(i) * .045, .19, c.style === 3 ? .18 : .16, .18, .2);
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
  cylinder(w, 0x8a6044, 0, .26, 0, .055, .065, .8, 8);
  if (weapon === 0) { const blade = box(w, WEAPONS[weapon].color, 0, .63, 0, .15, .52, .09); blade.rotation.z = -.08; box(w, o.accent, 0, .36, 0, .34, .07, .13); }
  if (weapon === 1) { cylinder(w, 0x89552f, 0, .74, 0, .3, .33, .36); ball(w, 0xc7985c, 0, .68, 0, .35, .3, .3); }
  if (weapon === 2) { const fan = mesh(new T.CircleGeometry(.43, 12, 0, Math.PI), 0xb8cbff, 0, .63, .05, w); (fan.material as T.Material).side = T.DoubleSide; for (let i = 0; i < 5; i++) { const rib = box(w, 0xffe3a2, 0, .69, .07, .024, .55, .02); rib.rotation.z = (i - 2) * .5; } }
  if (weapon === 3) { mesh(new T.OctahedronGeometry(.28), 0xffdd72, 0, .94, 0, w); ball(w, 0xf4a4d3, 0, .94, 0, .14); }
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

export class World {
  scene = new T.Scene(); renderer: T.WebGLRenderer; camera: T.OrthographicCamera;
  player = new T.Group(); private entities: Entity[] = []; private coins: { mesh: T.Group; id: number; y: number }[] = [];
  private colliders: { x: number; z: number; r: number }[] = []; private platforms = stagePlatforms(0); stage = 0;
  private keys = new Set<string>(); private stick = { x: 0, z: 0 }; private clock = new T.Clock(); private time = 0; private vy = 0; private grounded = true;
  private particles: { mesh: T.Mesh; v: T.Vector3; life: number }[] = []; private lastSafe = new T.Vector3(0, 0, 8); private follow = new T.Vector3(0, 0, 1);
  private sun: T.DirectionalLight; private labelLayer: HTMLDivElement; private selectedId: string | null = null;
  active = false; paused = true; onCollect = (_id: number) => {}; onInteract = (_id: string) => {}; onNear = (_name: string | null) => {}; onJump = () => {}; onRescue = () => {};
  constructor(private container: HTMLElement) {
    this.scene.background = new T.Color(0xc5e5d4); this.scene.fog = new T.Fog(0xc5e5d4, 55, 105);
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap; this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.35; container.append(this.renderer.domElement);
    this.camera = new T.OrthographicCamera(-18, 18, 14, -14, .1, 140);
    this.scene.add(new T.HemisphereLight(0xe9fbff, 0x6f9450, 2.2)); this.sun = new T.DirectionalLight(0xffefd2, 3.1); this.sun.position.set(-15, 30, 15); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); Object.assign(this.sun.shadow.camera, { left: -34, right: 34, top: 32, bottom: -30, far: 85 }); this.sun.shadow.normalBias = .06; this.scene.add(this.sun);
    this.labelLayer = document.createElement('div'); this.labelLayer.className = 'world-labels'; container.append(this.labelLayer);
    this.buildVillage(); this.setAvatar(0, 0, 0); this.player.position.set(0, 0, 8); this.scene.add(this.player);
    window.addEventListener('resize', () => this.resize()); this.resize();
    window.addEventListener('keydown', e => { if (!this.active || this.paused || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault(); this.keys.add(e.key.toLowerCase()); if (!e.repeat && e.code === 'Space') this.jump(); if (!e.repeat && e.key.toLowerCase() === 'e') this.interact(); });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase())); window.addEventListener('blur', () => this.clearInput()); document.addEventListener('visibilitychange', () => this.clearInput());
    this.renderer.setAnimationLoop(() => this.frame());
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
    // Arena: a lavender garden, not a threatening dungeon.
    cylinder(this.scene, 0xc7bdd8, 0, .08, -13, 4.3, 4.3, .14, 40); cylinder(this.scene, 0xe1d9e7, 0, .17, -13, 3.65, 3.65, .07, 40);
    const ring = mesh(new T.TorusGeometry(3.25, .055, 6, 48), 0xab96c4, 0, .22, -13, this.scene); ring.rotation.x = Math.PI / 2;
    for (const x of [-4.3, 4.3]) { cylinder(this.scene, 0xaca4b6, x, 1, -14, .38, .48, 2); ball(this.scene, 0xfbe5a2, x, 2.15, -14, .42); }
    this.addEntity('guide', '연태쌤 · 마을 대장', 1.8, 3, makeYeontae());
    this.addEntity('weapon', '강지후 · 무기 상점', -8, -3.8, makeCharacter(1, 6, 1));
    this.addEntity('outfit', '오지후 · 의상 상점', 8, -3.8, makeCharacter(2, 4, 2));
    this.addEntity('arena', '별솔 · 대련장', 0, -9, makeCharacter(3, 5, 3));
    stageMonsters(0).forEach((m, i) => this.addEntity(`monster${i}`, MONSTERS[m.type].name, m.x, m.z, makeMonster(m.type)));
    this.addEntity('journey', '모험의 문 · 10개의 사냥터', 10.5, 13.5, this.gate(0x9e78c9));
    // Keep the walking areas clear; peripheral trees frame the miniature world.
    for (let i = 0; i < 48; i++) { const a = i * 2.39996, r = 17 + (i % 4) * 1.65; const x = Math.cos(a) * r, z = Math.sin(a) * r * .77; if ((x > 14 && z > 1) || (Math.abs(x) < 5 && z < -12)) continue; this.tree(x, z, .85 + (i % 3) * .16, i % 6 === 0); }
    [[-15, -6], [-15, 8], [14, -9], [12, 15], [-6, 15]].forEach(([x, z], i) => this.tree(x, z, 1, i % 2 === 0));
    for (let i = 0; i < 65; i++) { const x = Math.sin(i * 12.97) * 23, z = Math.cos(i * 4.67) * 18; if (Math.abs(x) < 3 || (z < -2 && z > -11) || (x > 5 && z > 2 && z < 14)) continue; for (let j = 0; j < 3; j++) { const fx = x + j * .14; cylinder(this.scene, 0x538c50, fx, .14, z, .025, .025, .3, 5); ball(this.scene, [0xffe8ae, 0xf4aec4, 0xeae3ff][i % 3], fx, .32, z, .1, .09, .1); } }
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { const x = side * 22, z = -15 + i * 4.7; cylinder(this.scene, 0xd4bb88, x, .5, z, .08, .09, 1, 8); box(this.scene, 0xe7d3a3, x, .65, z + 2, .12, .11, 4.7); }
    this.addBerries();
  }
  private gate(color = 0x9e78c9) {
    const g = new T.Group(), glow = new T.MeshBasicMaterial({ color: 0xf7ddff, transparent: true, opacity: .65 });
    cylinder(g, 0xd6bc80, 0, .04, 0, 1.85, 1.85, .08, 24);
    for (const side of [-1, 1]) {
      cylinder(g, 0xe5c99c, side * 1.35, 1.35, 0, .27, .35, 2.7, 8); cylinder(g, color, side * 1.35, 2.7, 0, .36, .43, .2, 8); ball(g, 0xffdd91, side * 1.35, 3.02, 0, .25);
      for (let i = 0; i < 3; i++) ball(g, [0xf3a9ca, 0xb7db9b, 0xb5d8ec][i], side * (1.65 + i * .11), .25 + i * .18, .05, .16, .08, .13);
    }
    const arch = mesh(new T.TorusGeometry(1.34, .19, 8, 24, Math.PI), color, 0, 2.66, 0, g); arch.rotation.z = 0;
    const inner = new T.Mesh(new T.CircleGeometry(1.17, 30), glow); inner.position.set(0, 1.46, -.04); g.add(inner);
    const star = mesh(new T.OctahedronGeometry(.3), 0xffe18a, 0, 3.72, 0, g); star.rotation.z = .4;
    for (let i = 0; i < 7; i++) { const a = i * .89; const sparkle = mesh(new T.OctahedronGeometry(.075 + (i % 2) * .035), i % 2 ? 0xffdc91 : 0xf8c8e9, Math.cos(a) * 1.75, 1.1 + (i % 3) * .62, Math.sin(a) * .25, g); sparkle.userData.sparkle = true; }
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
    for (let i = 0; i < 14; i++) { const g = new T.Group(); g.position.set((i % 2 ? 1 : -1) * (size.x - 5), 0, size.z - 7 - Math.floor(i / 2) * 8); this.scene.add(g); if (spec.theme === 'crystal') { for (let j = 0; j < 3; j++) { const m = mesh(new T.OctahedronGeometry(.65), [0x9bade6, 0xc3a0df, 0x9bd6d4][j], j * .55 - .55, 1.3, 0, g); m.scale.y = 2 + j * .3; } } else if (spec.theme === 'mushroom') { cylinder(g, 0xf4e4cb, 0, .9, 0, .4, .6, 1.8); ball(g, 0xda8e9a, 0, 2, 0, 1.8, .65, 1.5); } else { for (let j = 0; j < 5; j++) ball(g, spec.foliage, Math.cos(j * 1.26), .7, Math.sin(j * 1.26), .4, .14, .4); } }
    this.addBerries();
  }
  loadStage(s: Save, fresh = false) {
    this.clearInput(); this.selectedId = null; this.onNear(null); this.stage = s.journey.stage; this.entities.forEach(e => e.label.remove()); this.entities = []; this.coins = []; this.colliders = [];
    for (const child of [...this.scene.children]) if (child !== this.player && !(child instanceof T.Light)) this.scene.remove(child);
    this.scene.background = new T.Color(0xc5e5d4); this.scene.fog = new T.Fog(0xc5e5d4, 55, 105); this.platforms = stagePlatforms(this.stage);
    if (this.stage === 0) this.buildVillage(); else this.buildHunt(this.stage);
    const map = s.journey.maps[this.stage]; this.coins.forEach(c => c.mesh.visible = !map.berries.includes(c.id)); this.entities.forEach(e => { if (e.id.startsWith('monster')) e.mesh.visible = !map.monsters.includes(Number(e.id.slice(7))); });
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
  private addEntity(id: string, name: string, x: number, z: number, model: T.Group) {
    model.position.set(x, 0, z); this.scene.add(model);
    const label = document.createElement('div'); label.className = `entity-label ${id.startsWith('monster') ? 'monster-label' : ''}`; label.textContent = name; this.labelLayer.append(label);
    this.entities.push({ id, name, x, z, mesh: model, label });
  }
  setAvatar(character: number, outfit: number, weapon: number, outfitLevel = 0, weaponLevel = 0) {
    const position = this.player.position.clone(), rotation = this.player.rotation.y;
    this.scene.remove(this.player); this.disposeModel(this.player); this.player = makeCharacter(character, outfit, weapon, outfitLevel, weaponLevel); this.player.position.copy(position); this.player.rotation.y = rotation; this.scene.add(this.player);
  }
  private disposeModel(g: T.Group) { g.traverse(o => { if (o instanceof T.Mesh) o.geometry.dispose(); }); }
  restore(s: Save) { this.setAvatar(s.character, s.outfit, s.weapon, s.outfits[s.outfit], s.weapons[s.weapon]); this.loadStage(s); this.quality(s.settings.lowQuality); }
  quality(low: boolean) { this.renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.7)); this.renderer.shadowMap.enabled = !low; this.sun.castShadow = !low; this.scene.traverse(o => { if (o instanceof T.Mesh) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => m.needsUpdate = true); } }); }
  clearInput() { this.keys.clear(); this.stick = { x: 0, z: 0 }; }
  moveStick(x: number, z: number) { this.stick = { x, z }; }
  jump() { if (this.active && !this.paused && this.grounded) { this.vy = 7.4; this.grounded = false; this.onJump(); } }
  interact() { if (this.active && !this.paused && this.selectedId) this.onInteract(this.selectedId); }
  defeat(id: string) { const e = this.entities.find(e => e.id === id); if (e) { const monster = stageMonsters(this.stage)[Number(id.slice(7))]; this.burst(e.mesh.position, MONSTERS[monster.type].color); e.mesh.visible = false; } }
  celebrate() { this.burst(this.player.position, 0xffd371, 30); }
  private burst(pos: T.Vector3, color: number, count = 14) { for (let i = 0; i < count; i++) { const m = mesh(new T.OctahedronGeometry(.09), color, pos.x, pos.y + .9, pos.z, this.scene); this.particles.push({ mesh: m, v: new T.Vector3((Math.random() - .5) * 5, 2 + Math.random() * 3, (Math.random() - .5) * 5), life: 1 }); } }
  private water(x: number, z: number) { return x > 15.25 && x < 22.75 && z > 2.75 && z < 13.25; }
  private resize() { const w = this.container.clientWidth, h = this.container.clientHeight; const span = w < 700 ? 13 : 14.5; this.camera.left = -span * w / h; this.camera.right = span * w / h; this.camera.top = span; this.camera.bottom = -span; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); }
  private frame() {
    const dt = Math.min(this.clock.getDelta(), .04); this.time += dt;
    const p = this.player.position;
    if (this.active && !this.paused) {
      let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')) + this.stick.x;
      let dz = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup')) + this.stick.z;
      const n = Math.hypot(dx, dz); if (n > 1) { dx /= n; dz /= n; }
      const vx = (dx * .8 + dz * .6) * 5, vz = (-dx * .6 + dz * .8) * 5;
      const allowed = (x: number, z: number) => !this.colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.r + .32) && !this.platforms.some(t => Math.abs(x - t.x) < t.w / 2 + .2 && Math.abs(z - t.z) < t.d / 2 + .2 && p.y < t.h - .13);
      if (allowed(p.x + vx * dt, p.z)) p.x += vx * dt; if (allowed(p.x, p.z + vz * dt)) p.z += vz * dt;
      if (n > .05) { this.player.rotation.y = Math.atan2(vx, vz); this.player.userData.feet?.forEach((f: T.Mesh, i: number) => { f.position.y = .18 + Math.max(0, Math.sin(this.time * 13 + i * Math.PI)) * .12; }); }
      const platform = this.platforms.find(t => Math.abs(p.x - t.x) < t.w / 2 + .15 && Math.abs(p.z - t.z) < t.d / 2 + .15); const floor = platform?.h ?? 0;
      this.vy -= 18 * dt; p.y += this.vy * dt; if (p.y <= floor && this.vy <= 0) { p.y = floor; this.vy = 0; this.grounded = true; } else this.grounded = false;
      const bounds = stageSize(this.stage);
      if (Math.abs(p.x) > bounds.x - .5 || Math.abs(p.z) > bounds.z - .5 || (this.water(p.x, p.z) && p.y <= .2)) { p.copy(this.lastSafe); this.vy = 0; this.onRescue(); }
      else if (this.grounded && !this.water(p.x, p.z) && Math.abs(p.x) < bounds.x - 2 && Math.abs(p.z) < bounds.z - 2) this.lastSafe.copy(p);
      for (const c of this.coins) if (c.mesh.visible && p.distanceTo(c.mesh.position) < 1) { c.mesh.visible = false; this.burst(c.mesh.position, 0xff9fb4, 6); this.onCollect(c.id); }
    }
    for (const c of this.coins) { c.mesh.rotation.y += dt; c.mesh.position.y = c.y + Math.sin(this.time * 2.8 + c.mesh.position.x) * .12; }
    let near: Entity | undefined, distance = 2.8;
    for (const e of this.entities) {
      if (e.id.startsWith('monster')) { e.mesh.position.y = Math.max(0, Math.sin(this.time * 2 + e.x)) * .16; e.mesh.rotation.y = Math.sin(this.time * .5 + e.z) * .35; }
      if (e.mesh.userData.magicGate) { e.mesh.rotation.y = Math.sin(this.time * .45 + e.x) * .07; e.mesh.traverse(o => { if (o.userData.sparkle) { o.position.y += Math.sin(this.time * 2.4 + o.position.x) * .0015; o.rotation.y += dt * 1.8; } }); }
      const d = Math.hypot(p.x - e.x, p.z - e.z); if (e.mesh.visible && d < distance) { near = e; distance = d; }
      const v = new T.Vector3(e.x, e.id.startsWith('monster') ? 2 : 2.6, e.z).project(this.camera);
      e.label.style.transform = `translate(-50%, -100%) translate(${(v.x * .5 + .5) * this.container.clientWidth}px, ${(-v.y * .5 + .5) * this.container.clientHeight}px)`;
      e.label.hidden = !this.active || !e.mesh.visible || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.1;
      e.label.classList.toggle('near', d < 2.8);
    }
    if ((near?.id ?? null) !== this.selectedId) { this.selectedId = near?.id ?? null; this.onNear(near?.name ?? null); }
    if (this.player.userData.sparkles) this.player.userData.sparkles.rotation.y += dt;
    for (let i = this.particles.length - 1; i >= 0; i--) { const q = this.particles[i]; q.life -= dt; q.v.y -= dt * 5; q.mesh.position.addScaledVector(q.v, dt); q.mesh.scale.setScalar(Math.max(0, q.life)); if (q.life <= 0) { this.scene.remove(q.mesh); q.mesh.geometry.dispose(); this.particles.splice(i, 1); } }
    const target = this.active ? p : new T.Vector3(0, 0, -1); this.follow.lerp(target, 1 - Math.exp(-dt * 3));
    this.camera.position.copy(this.follow).add(new T.Vector3(18, 25, 24)); this.camera.lookAt(this.follow); this.renderer.render(this.scene, this.camera);
  }
}

export class AvatarPreview {
  private scene = new T.Scene(); private camera = new T.PerspectiveCamera(30, 1, .1, 20); private renderer: T.WebGLRenderer; private model = new T.Group(); private resizeObserver: ResizeObserver;
  constructor(private element: HTMLElement) {
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.renderer.setClearColor(0x000000, 0); this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.4; element.append(this.renderer.domElement); this.scene.add(new T.HemisphereLight(0xffffff, 0xa6ba93, 3)); const light = new T.DirectionalLight(0xffedcd, 3); light.position.set(-3, 4, 5); this.scene.add(light); this.camera.position.set(2.2, 1.9, 5.8); this.camera.lookAt(0, 1.1, 0);
    this.resizeObserver = new ResizeObserver(() => this.draw()); this.resizeObserver.observe(element);
  }
  show(c: number, o: number, w: number, ol = 0, wl = 0) { this.scene.remove(this.model); this.model.traverse(x => { if (x instanceof T.Mesh) x.geometry.dispose(); }); this.model = makeCharacter(c, o, w, ol, wl); this.model.rotation.y = -.18; this.scene.add(this.model); this.draw(); }
  private draw() { const w = this.element.clientWidth, h = this.element.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.render(this.scene, this.camera); }
  dispose() { this.resizeObserver.disconnect(); this.model.traverse(x => { if (x instanceof T.Mesh) x.geometry.dispose(); }); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
