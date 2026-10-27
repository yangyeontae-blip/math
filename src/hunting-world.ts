import * as T from 'three';
import { skillInfo } from './academy';
import type { HuntEnemy, HuntEvent, HuntSnapshot } from './hunting';

/** A touched target wins while it is alive and in range; otherwise aim at the nearest living enemy. */
export function autoHuntTarget(enemies: readonly HuntEnemy[], player: { x: number; z: number }, range: number, selectedId: string | null): HuntEnemy | null {
  if (!Number.isFinite(range) || range < 0) return null;
  let nearest: HuntEnemy | null = null, distance = Infinity;
  for (const enemy of enemies) { const d = Math.hypot(enemy.x - player.x, enemy.z - player.z); if (enemy.hp <= 0 || d > range) continue; if (enemy.id === selectedId) return enemy; if (d < distance) { nearest = enemy; distance = d; } }
  return nearest;
}

/** Short swept movement: a thin obstacle must stop a dash instead of being skipped in a slow frame. */
export function advanceHuntCharge(start: { x: number; z: number }, direction: { x: number; z: number }, distance: number, allowed: (x: number, z: number) => boolean) {
  let x = start.x, z = start.z; const length = Math.hypot(direction.x, direction.z);
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(length) || !length) return { x, z, blocked: false };
  const travel = Math.min(3, distance), count = Math.ceil(travel / .08), step = travel / count;
  for (let i = 0; i < count; i++) { const nx = x + direction.x / length * step, nz = z + direction.z / length * step; if (!allowed(nx, nz)) return { x, z, blocked: true }; x = nx; z = nz; }
  return { x, z, blocked: false };
}

/** 사냥터 구역별 분위기(하늘·안개·바닥·나무·몬스터 색). 숫자는 HUNT_ZONES의 id와 같아요. */
export const HUNT_THEMES = [
  { title: '해 질 녘 가시덤불', sky: 0x4f5f47, fog: 0x45553f, ground: 0x4c6a3d, path: 0x6b6446, foliage: 0x3f5d36, tint: 0x6c8f42, eye: 0xfff06a, glow: 0xb8ff6e },
  { title: '메마른 붉은 협곡', sky: 0x9a6a46, fog: 0x8a5a3a, ground: 0xa67645, path: 0x7d5232, foliage: 0x7c6a3a, tint: 0xb0703c, eye: 0xffa53a, glow: 0xffc46b },
  { title: '안개 낀 달빛 늪', sky: 0x23284a, fog: 0x1e2342, ground: 0x2f3557, path: 0x454a6a, foliage: 0x253049, tint: 0x5e6aa8, eye: 0xc9f0ff, glow: 0x9fd8ff },
  { title: '불타는 용암 폐허', sky: 0x2b1515, fog: 0x231010, ground: 0x3a2120, path: 0x4f3530, foliage: 0x2a1a18, tint: 0x8a3b30, eye: 0xff4a2e, glow: 0xff7a2e },
] as const;

/** 구역마다 다른 장식(놀이 공간 바깥에만 둬요). 보상·충돌·저장과 상관없는 그림이에요. */
export function huntingScenery(zone: number): T.Group {
  const g = new T.Group(), theme = HUNT_THEMES[zone] ?? HUNT_THEMES[0], cache = new Map<string, T.Material>();
  const mat = (c: number, glow = false) => { const key = `${c}:${glow}`; if (!cache.has(key)) cache.set(key, glow ? new T.MeshBasicMaterial({ color: c }) : new T.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true })); return cache.get(key)!; };
  const put = (geo: T.BufferGeometry, c: number, x: number, y: number, z: number, glow = false) => { const m = new T.Mesh(geo, mat(c, glow)); m.position.set(x, y, z); m.castShadow = !glow; m.receiveShadow = true; g.add(m); return m; };
  let seed = zone * 7919 + 13; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // 놀이 공간(가로 -11~11, 세로 -20~4)과 야영지(세로 4 이상)를 피한 둘레 자리
  const spots: { x: number; z: number }[] = [];
  for (let i = 0; i < 44; i++) { const side = i % 3; const x = side === 2 ? -19 + rnd() * 38 : (side ? 1 : -1) * (12 + rnd() * 8), z = side === 2 ? -21 - rnd() * 5 : -24 + rnd() * 27; spots.push({ x, z }); }
  // 어둠 속에서 빛나는 눈(모든 구역)
  for (let i = 0; i < 9; i++) { const p = spots[i * 4 + 1]; const y = .8 + rnd() * .9; for (const side of [-1, 1]) put(new T.SphereGeometry(.09, 8, 6), theme.eye, p.x + side * .18, y, p.z + .9, true).scale.set(1, .6, 1); }
  if (zone === 0) {
    spots.forEach((p, i) => {
      if (i % 3 === 0) { // 가시 덩굴
        const vine = put(new T.TorusGeometry(.9 + rnd() * .5, .12, 6, 14, Math.PI * 1.2), 0x2f4a2a, p.x, .5, p.z); vine.rotation.set(Math.PI / 2 + rnd() * .5, rnd() * 3, 0);
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 1.2; const t = put(new T.ConeGeometry(.08, .35, 4), 0x9a8a5a, p.x + Math.cos(a) * 1.1, .55 + Math.sin(a) * .3, p.z + Math.sin(a) * .4); t.rotation.z = a; }
      } else if (i % 3 === 1) { // 빛나는 독버섯
        for (let k = 0; k < 3; k++) { const x = p.x + (rnd() - .5) * 1.4, z = p.z + (rnd() - .5) * 1.4, h = .3 + rnd() * .5; put(new T.CylinderGeometry(.06, .08, h, 6), 0xd8d0b0, x, h / 2, z); put(new T.SphereGeometry(.28, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), k % 2 ? 0x9b4fc4 : 0x6fd36a, x, h, z, true); }
      } else { put(new T.CylinderGeometry(.55, .7, .7, 7), 0x4a3828, p.x, .35, p.z); put(new T.CylinderGeometry(.5, .5, .05, 7), 0x7a6040, p.x, .72, p.z); }
    });
  } else if (zone === 1) {
    spots.forEach((p, i) => {
      if (i % 2 === 0) { const h = 2 + rnd() * 3.5; const spire = put(new T.ConeGeometry(.9 + rnd() * .6, h, 6), i % 4 ? 0x9a5a35 : 0x7d4529, p.x, h / 2, p.z); spire.rotation.y = rnd() * 3; }
      else { for (let k = 0; k < 3; k++) put(new T.IcosahedronGeometry(.4 + rnd() * .5, 0), 0x8a6a4a, p.x + (rnd() - .5) * 1.5, .3, p.z + (rnd() - .5) * 1.5); }
    });
    for (let i = 0; i < 16; i++) { const crack = put(new T.BoxGeometry(.08, .02, 2 + rnd() * 3), 0x4a2f1c, -20 + rnd() * 40, .02, -22 + rnd() * 28); crack.rotation.y = rnd() * 3; }
  } else if (zone === 2) {
    spots.forEach((p, i) => {
      if (i % 3 === 0) { const pool = put(new T.CircleGeometry(1.2 + rnd() * 1.2, 20), 0x13253a, p.x, .03, p.z); pool.rotation.x = -Math.PI / 2; pool.castShadow = false; }
      else if (i % 3 === 1) { // 죽은 나무
        const h = 2.2 + rnd() * 1.6; put(new T.CylinderGeometry(.12, .22, h, 6), 0x1c1a24, p.x, h / 2, p.z);
        for (let k = 0; k < 3; k++) { const b = put(new T.CylinderGeometry(.04, .08, 1.1, 5), 0x1c1a24, p.x, h * (.55 + k * .15), p.z); b.rotation.z = (k % 2 ? 1 : -1) * (.7 + rnd() * .4); b.rotation.y = rnd() * 3; }
      } else put(new T.SphereGeometry(.16, 10, 8), theme.glow, p.x, 1.2 + rnd(), p.z, true); // 도깨비불
    });
  } else {
    for (let i = 0; i < 22; i++) { const crack = put(new T.BoxGeometry(.18, .03, 1.5 + rnd() * 3), i % 3 ? 0xff6a2a : 0xffb23e, -21 + rnd() * 42, .03, -24 + rnd() * 27, true); crack.rotation.y = rnd() * 3; if (Math.abs(crack.position.x) < 11 && crack.position.z > -20) crack.position.x += crack.position.x < 0 ? -12 : 12; }
    spots.forEach((p, i) => {
      if (i % 3 === 0) { const h = 1 + rnd() * 2; const c = put(new T.OctahedronGeometry(.5, 0), 0x2a1f3a, p.x, h * .5, p.z); c.scale.set(.6, h, .6); c.rotation.y = rnd() * 3; }
      else if (i % 3 === 1) { const h = 1.5 + rnd() * 2.5; put(new T.CylinderGeometry(.45, .55, h, 8), 0x5a4a44, p.x, h / 2, p.z); put(new T.BoxGeometry(1.3, .3, 1.3), 0x6a5a52, p.x, h + .15, p.z).rotation.y = rnd(); }
      else put(new T.SphereGeometry(.1, 6, 6), theme.glow, p.x, .4 + rnd() * 2, p.z, true); // 불씨
    });
  }
  g.userData.huntingScenery = zone; return g;
}

/** A visual adapter only. Health, damage, rewards and simulation time belong to HuntingRuntime. */
export class HuntingWorld {
  readonly root = new T.Group();
  private geometries = new Set<T.BufferGeometry>();
  private materials = new Set<T.Material>();
  private colors = new Map<string, T.Material>();
  private enemies = new Map<string, { root: T.Group; body: T.Group; hp: T.Mesh; bar: T.Group; target: T.Mesh; warning: T.Mesh }>();
  private effects = new Map<string, T.Group>();
  private numbers: { sprite: T.Sprite; texture: T.CanvasTexture; material: T.SpriteMaterial; life: number }[] = [];
  private pendingDamage = new Map<string, number>(); private damageClock = 0;
  private sphere = this.geometry(new T.SphereGeometry(1, 12, 8));
  private cube = this.geometry(new T.BoxGeometry(1, 1, 1));
  private cone = this.geometry(new T.ConeGeometry(1, 1, 7));
  private circle = this.geometry(new T.CircleGeometry(1, 32));
  private ring = this.geometry(new T.RingGeometry(.88, 1, 32));
  private plane = this.geometry(new T.PlaneGeometry(1, 1));
  private arc = this.geometry(new T.TorusGeometry(1, .075, 6, 24, Math.PI));
  constructor(readonly training = false, readonly zone = 0) { this.root.userData.huntingRuntime = true; }
  private glowing = new Map<number, T.MeshBasicMaterial>();
  private glow(color: number) { let m = this.glowing.get(color); if (!m) { m = new T.MeshBasicMaterial({ color }); this.glowing.set(color, m); this.materials.add(m); } return m; }
  private geometry<G extends T.BufferGeometry>(geometry: G): G { this.geometries.add(geometry); return geometry; }
  private material(color: number | string, opacity = 1): T.MeshStandardMaterial | T.MeshBasicMaterial {
    const key = `${color}:${opacity}`; if (this.colors.has(key)) return this.colors.get(key) as T.MeshStandardMaterial;
    const material = opacity < 1 ? new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: T.DoubleSide }) : new T.MeshStandardMaterial({ color, roughness: .84 });
    this.colors.set(key, material); this.materials.add(material); return material;
  }
  private piece(parent: T.Object3D, geometry: T.BufferGeometry, color: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
    const mesh = new T.Mesh(geometry, this.material(color)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  private enemy(id: string, index: number) {
    const root = new T.Group(), body = new T.Group(); root.add(body); root.userData.huntEnemyId = id;
    const color = [0x89aa65, 0xb38a67, 0xaa8cc0, 0x73a5a0, 0xc38375, 0xb6a45d][index % 6];
    if (this.training) {
      this.piece(body, this.cube, 0x956f4b, 0, 1, 0, .2, 1.8, .2);
      this.piece(body, this.sphere, 0xdbc18b, 0, 1.45, 0, .44, .45, .32);
      this.piece(body, this.cube, 0xbc9970, 0, .9, 0, 1.6, .15, .16);
      this.piece(body, this.sphere, color, 0, .9, .12, .43, .5, .22);
      this.piece(body, this.sphere, 0xf7e7b8, 0, .95, .34, .25, .25, .025);
    } else {
      // 구역이 높을수록 크고 어두우며, 볼터치 대신 빛나는 눈·찡그린 눈썹·이빨을 달아요.
      const theme = HUNT_THEMES[this.zone] ?? HUNT_THEMES[0], dark = new T.Color(color).lerp(new T.Color(theme.tint), .55).multiplyScalar(.82).getHex();
      body.scale.setScalar(1 + this.zone * .14);
      this.piece(body, this.sphere, dark, 0, .68, 0, .7, .64, .61);
      for (const side of [-1, 1]) {
        const eye = new T.Mesh(this.sphere, this.glow(theme.eye)); eye.position.set(side * .22, .82, .56); eye.scale.set(.1, .07, .03); body.add(eye);
        const brow = this.piece(body, this.cube, 0x1e1a1a, side * .22, .95, .57, .26, .05, .04); brow.rotation.z = side * .45;
        this.piece(body, this.sphere, dark, side * .4, .18, .12, .24, .16, .29);
      }
      for (const x of [-.12, .12]) { const fang = this.piece(body, this.cone, 0xfff4dc, x, .5, .57, .045, .13, .045); fang.rotation.x = Math.PI; }
      if (this.zone >= 2) for (let i = 0; i < 5; i++) { const spike = this.piece(body, this.cone, 0x2a2430, -.36 + i * .18, 1.05 - Math.abs(i - 2) * .06, -.32, .1, .4, .1); spike.rotation.x = -.5; }
      if (this.zone >= 3) for (const side of [-1, 1]) { const horn = this.piece(body, this.cone, 0x3a2a24, side * .38, 1.28, .05, .12, .55, .12); horn.rotation.z = -side * .5; }
      if (index % 6 === 0) for (const side of [-1, 1]) { const leaf = this.piece(body, this.sphere, 0x4c7951, side * .16, 1.31, 0, .17, .4, .1); leaf.rotation.z = -side * .6; }
      else if (index % 6 === 1) { this.piece(body, this.sphere, 0x81583e, 0, 1.1, 0, .78, .26, .7); this.piece(body, this.cone, 0xe8d7ac, 0, 1.45, 0, .17, .55, .17); }
      else if (index % 6 === 2) for (const side of [-1, 1]) this.piece(body, this.sphere, color, side * .31, 1.44, 0, .18, .58, .17);
      else if (index % 6 === 3) { for (let i = 0; i < 4; i++) this.piece(body, this.cone, 0x487b71, -.42 + i * .28, 1.14, -.12, .18, .5, .18); }
      else if (index % 6 === 4) { this.piece(body, this.sphere, 0xf1d59c, 0, .65, .57, .25, .2, .05); for (const side of [-1, 1]) this.piece(body, this.cone, color, side * .36, 1.28, 0, .24, .52, .23); }
      else for (const side of [-1, 1]) { this.piece(body, this.cone, 0x8f7850, side * .36, 1.35, 0, .14, .6, .14); this.piece(body, this.sphere, 0xf1d990, side * .55, .7, 0, .25, .12, .5); }
    }
    const bar = new T.Group(); bar.position.y = 2.2; root.add(bar);
    const background = new T.Mesh(this.plane, this.material(0x473d39)); background.scale.set(1.5, .16, 1); bar.add(background);
    const hp = new T.Mesh(this.plane, this.material(0x87bd76)); hp.position.z = .009; hp.scale.set(1.44, .105, 1); bar.add(hp);
    const target = new T.Mesh(this.ring, this.material(0xffda6e, .9)); target.rotation.x = -Math.PI / 2; target.position.y = .045; target.visible = false; root.add(target);
    const warning = new T.Mesh(this.circle, this.material(0xef795d, .4)); warning.rotation.x = -Math.PI / 2; warning.visible = false; this.root.add(warning);
    const value = { root, body, hp, bar, target, warning }; this.enemies.set(id, value); this.root.add(root); return value;
  }
  update(snapshot: HuntSnapshot, camera: T.Camera, selected: string | null, dt: number) {
    this.damageClock += dt;
    if (this.damageClock >= .25) { this.damageClock = 0; for (const [id, damage] of this.pendingDamage) { const enemy = snapshot.enemies.find(value => value.id === id); if (enemy) this.damageNumber(damage, enemy.x, enemy.z); } this.pendingDamage.clear(); }
    for (const [index, enemy] of snapshot.enemies.entries()) {
      const visual = this.enemies.get(enemy.id) ?? this.enemy(enemy.id, index);
      visual.root.visible = enemy.state !== 'defeated'; visual.root.position.set(enemy.x, 0, enemy.z);
      visual.body.position.y = this.training ? 0 : Math.sin(snapshot.time * 3 + index) * .045;
      visual.body.rotation.z = enemy.state === 'recovery' ? Math.sin(snapshot.time * 18) * .06 : 0;
      visual.bar.quaternion.copy(camera.quaternion);
      const ratio = T.MathUtils.clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1); visual.hp.scale.x = ratio * 1.44; visual.hp.position.x = -(1 - ratio) * .72;
      visual.target.visible = enemy.id === selected && visual.root.visible;
      visual.warning.visible = !!enemy.telegraph && visual.root.visible;
      if (enemy.telegraph) { visual.warning.position.set(enemy.telegraph.x, .035, enemy.telegraph.z); visual.warning.scale.setScalar(enemy.telegraph.radius); }
    }
    const live = new Set(snapshot.effects.map(effect => effect.id));
    for (const [id, mesh] of this.effects) if (!live.has(id)) { this.root.remove(mesh); this.effects.delete(id); }
    for (const effect of snapshot.effects) {
      let mesh = this.effects.get(effect.id);
      if (!mesh) { mesh = this.makeEffect(effect.skill); this.effects.set(effect.id, mesh); this.root.add(mesh); }
      mesh.position.set(effect.x, .12, effect.z); const progress = 1 - effect.remaining / Math.max(.01, effect.duration);
      mesh.scale.setScalar(Math.max(.2, effect.radius * (.65 + progress * .35))); mesh.rotation.y = snapshot.time * (effect.skill === 'vortex' || effect.skill === 'storm' ? 2 : .35);
    }
    for (let i = this.numbers.length - 1; i >= 0; i--) { const value = this.numbers[i]; value.life -= dt; value.sprite.position.y += dt * .8; value.material.opacity = Math.min(1, value.life * 2); if (value.life <= 0) { this.root.remove(value.sprite); value.texture.dispose(); value.material.dispose(); this.numbers.splice(i, 1); } }
  }
  onEvent(event: HuntEvent, snapshot: HuntSnapshot) {
    if (event.type !== 'hit' || !snapshot.enemies.some(enemy => enemy.id === event.enemyId)) return;
    this.pendingDamage.set(event.enemyId, (this.pendingDamage.get(event.enemyId) ?? 0) + event.damage);
  }
  targetObject(id: string) { return this.enemies.get(id)?.root ?? null; }
  private makeEffect(id: import('./academy').SkillId) {
    const group = new T.Group(), color = new T.Color(skillInfo(id).color).getHex();
    const ground = new T.Mesh(this.ring, this.material(color, .65)); ground.rotation.x = -Math.PI / 2; group.add(ground);
    if (id === 'shield' || id === 'guardian') { const shell = new T.Mesh(this.sphere, this.material(color, .17)); shell.position.y = .6; shell.scale.set(.7, .8, .7); group.add(shell); }
    else if (id === 'crescent' || id === 'charge' || id === 'pierce' || id === 'arrow') { const arc = new T.Mesh(id === 'crescent' ? this.arc : this.cone, this.material(color, .85)); arc.rotation.x = id === 'crescent' ? -Math.PI / 3 : Math.PI / 2; arc.position.y = .55; arc.scale.set(.9, id === 'crescent' ? .9 : 1.6, .22); group.add(arc); }
    else if (id === 'roots' || id === 'trap' || id === 'frost') for (let i = 0; i < 6; i++) { const stem = this.piece(group, this.cone, id === 'frost' ? 0xc0e8ef : color, Math.cos(i * Math.PI / 3) * .7, .24, Math.sin(i * Math.PI / 3) * .7, .11, .65, .11); stem.rotation.z = Math.cos(i) * .25; }
    else if (id === 'starbolt' || id === 'lantern') { this.piece(group, this.sphere, 0xffe6a1, 0, .85, 0, .3); for (let i = 0; i < 4; i++) this.piece(group, this.cone, color, Math.cos(i * Math.PI / 2) * .5, .85, Math.sin(i * Math.PI / 2) * .5, .08, .3, .08); }
    else for (let i = 0; i < (id === 'starfall' ? 8 : 5); i++) { const mote = this.piece(group, id === 'starfall' ? this.cone : this.sphere, i % 2 ? color : 0xe3f5a8, Math.cos(i * 2.399) * (.35 + i * .07), .2 + i * .17, Math.sin(i * 2.399) * (.35 + i * .07), .09, id === 'starfall' ? .35 : .1, .09); mote.rotation.z = .4; }
    group.traverse(object => { if (object instanceof T.Mesh) object.castShadow = false; }); return group;
  }
  private damageNumber(damage: number, x: number, z: number) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const label = String(Math.max(1, Math.round(damage))); ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#4b372d'; ctx.strokeText(label, 64, 48); ctx.fillStyle = '#fff1b3'; ctx.fillText(label, 64, 48);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const material = new T.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new T.Sprite(material); sprite.scale.set(1.7, .85, 1); sprite.position.set(x, 2.6, z); this.root.add(sprite); this.numbers.push({ sprite, texture, material, life: 1.1 });
    if (this.numbers.length > 24) { const oldest = this.numbers.shift()!; this.root.remove(oldest.sprite); oldest.texture.dispose(); oldest.material.dispose(); }
  }
  pick(ndc: T.Vector2, camera: T.Camera): string | null {
    const ray = new T.Raycaster(); ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObjects([...this.enemies.values()].filter(value => value.root.visible).map(value => value.root), true)) { let node: T.Object3D | null = hit.object; while (node) { if (typeof node.userData.huntEnemyId === 'string') return node.userData.huntEnemyId; node = node.parent; } }
    return null;
  }
  dispose() { this.root.removeFromParent(); for (const value of this.numbers) { value.texture.dispose(); value.material.dispose(); } this.numbers = []; for (const geometry of this.geometries) geometry.dispose(); for (const material of this.materials) material.dispose(); this.geometries.clear(); this.materials.clear(); this.enemies.clear(); this.effects.clear(); this.pendingDamage.clear(); this.root.clear(); }
}
