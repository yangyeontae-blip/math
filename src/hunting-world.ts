import * as T from 'three';
import { skillInfo, type JobId, type SkillId } from './academy';
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
  private effectOrigins = new Map<string, { x: number; z: number }>();
  private effectPool = new Map<SkillId, T.Group[]>();
  private impacts: { group: T.Group; life: number; duration: number }[] = [];
  private impactPool: T.Group[] = [];
  private projectiles: { group: T.Group; skill: SkillId; origin: { x: number; z: number }; target: { x: number; z: number }; elapsed: number }[] = [];
  private projectilePool = new Map<SkillId, T.Group[]>();
  private castOrigins = new Map<SkillId, { x: number; z: number }>();
  private lastBasicShot = -Infinity;
  private numbers: { sprite: T.Sprite; texture: T.CanvasTexture; material: T.SpriteMaterial; life: number }[] = [];
  private pendingDamage = new Map<string, number>(); private damageClock = 0;
  private sphere = this.geometry(new T.SphereGeometry(1, 12, 8));
  private cube = this.geometry(new T.BoxGeometry(1, 1, 1));
  private cone = this.geometry(new T.ConeGeometry(1, 1, 7));
  private circle = this.geometry(new T.CircleGeometry(1, 32));
  private ring = this.geometry(new T.RingGeometry(.88, 1, 32));
  private plane = this.geometry(new T.PlaneGeometry(1, 1));
  private arc = this.geometry(new T.TorusGeometry(1, .075, 6, 24, Math.PI));
  constructor(readonly training = false, readonly zone = 0, readonly options: { lowQuality?: boolean; reducedMotion?: boolean } = {}) { this.root.userData.huntingRuntime = true; }
  setQuality(options: { lowQuality: boolean; reducedMotion: boolean }) { Object.assign(this.options, options); }
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
  update(snapshot: HuntSnapshot, camera: T.Camera, selected: string | null, dt: number, player?: { x: number; z: number }) {
    dt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
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
    // Keep a fixed visual budget even if a future runtime exposes many overlapping areas.
    const visibleEffects = snapshot.effects.filter(effect => !(['leafOrb', 'thunderChain', 'tripleShot', 'moonArrow'].includes(effect.skill) && this.castOrigins.has(effect.skill))).slice(-24), live = new Set(visibleEffects.map(effect => effect.id));
    for (const [id, mesh] of this.effects) if (!live.has(id)) {
      this.root.remove(mesh); this.effects.delete(id); this.effectOrigins.delete(id);
      const skill = mesh.userData.skill as SkillId, pool = this.effectPool.get(skill) ?? [];
      if (pool.length < 2) pool.push(mesh); this.effectPool.set(skill, pool);
    }
    for (const id of this.effectOrigins.keys()) if (!live.has(id)) this.effectOrigins.delete(id);
    for (const effect of visibleEffects) {
      let mesh = this.effects.get(effect.id);
      if (!mesh) { mesh = this.effectPool.get(effect.skill)?.pop() ?? this.makeEffect(effect.skill); this.effects.set(effect.id, mesh); this.root.add(mesh); }
      this.animateEffect(mesh, effect, this.effectOrigins.get(effect.id));
      if (player && Number.isFinite(player.x) && Number.isFinite(player.z) && ['shield', 'wind', 'guardian'].includes(effect.skill)) { mesh.position.x = player.x; mesh.position.z = player.z; }
    }
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const impact = this.impacts[i]; impact.life -= dt;
      if (impact.life <= 0) { this.root.remove(impact.group); this.impactPool.push(impact.group); this.impacts.splice(i, 1); continue; }
      const p = 1 - impact.life / impact.duration;
      impact.group.scale.setScalar(this.options.reducedMotion ? .7 : .35 + p * .65);
      impact.group.rotation.y = this.options.reducedMotion ? 0 : p * .5;
      impact.group.children.forEach((child, index) => { child.visible = index < (this.options.lowQuality || this.options.reducedMotion ? 3 : 7); });
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const shot = this.projectiles[i]; shot.elapsed += dt;
      if (shot.elapsed >= .48) { this.root.remove(shot.group); const pool = this.projectilePool.get(shot.skill) ?? []; if (pool.length < 3) pool.push(shot.group); this.projectilePool.set(shot.skill, pool); this.projectiles.splice(i, 1); continue; }
      this.animateEffect(shot.group, { id: '', skill: shot.skill, ...shot.target, radius: 1, duration: .48, remaining: .48 - shot.elapsed }, shot.origin);
    }
    for (let i = this.numbers.length - 1; i >= 0; i--) { const value = this.numbers[i]; value.life -= dt; value.sprite.position.y += dt * .8; value.material.opacity = Math.min(1, value.life * 2); if (value.life <= 0) { this.root.remove(value.sprite); value.texture.dispose(); value.material.dispose(); this.numbers.splice(i, 1); } }
  }
  onEvent(event: HuntEvent, snapshot: HuntSnapshot, origin?: { x: number; z: number; job?: JobId | null }) {
    if (event.type === 'cast') {
      const effect = snapshot.effects.filter(effect => effect.skill === event.skill).at(-1);
      if (origin && Number.isFinite(origin.x) && Number.isFinite(origin.z)) { this.castOrigins.set(event.skill, { ...origin }); if (effect) this.effectOrigins.set(effect.id, { ...origin }); }
      if ((event.skill === 'storm' || event.skill === 'galeShot') && effect && origin) this.launchProjectile('arrow', origin, effect);
      return;
    }
    if (event.type !== 'hit' || !snapshot.enemies.some(enemy => enemy.id === event.enemyId)) return;
    this.pendingDamage.set(event.enemyId, (this.pendingDamage.get(event.enemyId) ?? 0) + event.damage);
    const enemy = snapshot.enemies.find(enemy => enemy.id === event.enemyId)!;
    if (event.skill === 'basic' && origin?.job === 'ranger' && this.lastBasicShot !== snapshot.time) { this.lastBasicShot = snapshot.time; this.launchProjectile('arrow', origin, enemy); }
    if (event.skill !== 'basic' && ['leafOrb', 'thunderChain', 'tripleShot', 'moonArrow'].includes(event.skill)) {
      const from = this.castOrigins.get(event.skill) ?? origin;
      if (from) { this.launchProjectile(event.skill, from, enemy); if (event.skill === 'thunderChain') this.castOrigins.set(event.skill, { x: enemy.x, z: enemy.z }); }
    }
    // Continuous damage is coalesced per enemy: never create one burst per simulation tick.
    if (!this.impacts.some(value => value.group.userData.enemyId === event.enemyId && value.life > .12)) {
      const group = this.impactPool.pop() ?? (this.impacts.length < 24 ? this.makeImpact() : this.impacts.shift()!.group);
      group.userData.enemyId = event.enemyId; group.position.set(enemy.x, .8, enemy.z); group.rotation.set(0, 0, 0); group.scale.setScalar(.35);
      this.root.add(group); this.impacts.push({ group, life: .28, duration: .28 });
    }
  }
  targetObject(id: string) { return this.enemies.get(id)?.root ?? null; }
  private launchProjectile(skill: SkillId, origin: { x: number; z: number }, target: { x: number; z: number }) {
    if (![origin.x, origin.z, target.x, target.z].every(Number.isFinite)) return;
    if (this.projectiles.length >= 12) { const old = this.projectiles.shift()!; this.root.remove(old.group); const pool = this.projectilePool.get(old.skill) ?? []; if (pool.length < 3) pool.push(old.group); this.projectilePool.set(old.skill, pool); }
    const group = this.projectilePool.get(skill)?.pop() ?? this.makeEffect(skill);
    delete group.userData.skill; group.userData.huntProjectile = true;
    this.projectiles.push({ group, skill, origin: { x: origin.x, z: origin.z }, target: { x: target.x, z: target.z }, elapsed: 0 }); this.root.add(group);
    this.animateEffect(group, { id: '', skill, x: target.x, z: target.z, radius: 1, duration: .48, remaining: .48 }, origin);
  }
  private makeImpact() {
    const group = new T.Group(); group.userData.huntImpact = true;
    const slash = new T.Mesh(this.arc, this.glow(0xffdf93)); slash.scale.set(.65, .4, .4); slash.rotation.set(-.5, .2, -.6); group.add(slash);
    for (let i = 0; i < 6; i++) {
      const ray = new T.Mesh(this.cone, this.glow(i % 2 ? 0xffd181 : 0xfff2c0)), a = i * Math.PI / 3;
      ray.position.set(Math.cos(a) * .48, Math.sin(a) * .4, .06); ray.rotation.z = a - Math.PI / 2; ray.scale.set(.045, .35, .045); group.add(ray);
    }
    return group;
  }
  private makeEffect(id: SkillId) {
    const group = new T.Group(); group.userData.skill = id;
    const palette: Partial<Record<SkillId, number>> = { starbolt: 0xffd981, frost: 0x99ddf3, vortex: 0xff9e51, starfall: 0xc8b2ff, arrow: 0x8dded2, pierce: 0xb9f3be, storm: 0x80d9ed, acornRush: 0xe3b477, vinePull: 0x83d78c, dawnSlash: 0xffcd70, leafOrb: 0x99efb5, thunderChain: 0xffe98b, comet: 0xffa96c, tripleShot: 0xb3efc4, galeShot: 0x8ed9ee, moonArrow: 0xcdbdff };
    const color = palette[id] ?? new T.Color(skillInfo(id).color).getHex();
    const add = (geometry: T.BufferGeometry, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, opacity = .85, tint = color) => {
      const mesh = new T.Mesh(geometry, this.material(tint, opacity)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); group.add(mesh); return mesh;
    };
    const ground = add(this.ring, 0, 0, 0, 1, 1, 1, .42); ground.rotation.x = -Math.PI / 2; ground.userData.role = 'ground';
    if (id === 'shield' || id === 'guardian') {
      add(this.sphere, 0, .65, 0, .65, .85, .65, .13);
      for (let i = 0; i < (id === 'guardian' ? 6 : 3); i++) {
        const a = i * Math.PI * 2 / (id === 'guardian' ? 6 : 3);
        const leaf = add(id === 'guardian' ? this.cone : this.arc, Math.cos(a) * .75, .6, Math.sin(a) * .75, .12, .48, .08);
        leaf.rotation.set(id === 'shield' ? .4 : 0, -a, -.3); leaf.userData.role = 'orbit';
      }
    } else if (id === 'crescent' || id === 'charge' || id === 'acornRush' || id === 'dawnSlash') {
      for (let i = 0; i < 3; i++) { const slash = add(this.arc, 0, .6, i * .12, 1 - i * .1, .7, .32, .8 - i * .2); slash.rotation.set(-.7, 0, -.5); slash.userData.role = 'blade'; slash.userData.phase = i; }
      if (id === 'charge') add(this.sphere, 0, .7, -.1, .6, .7, .15, .38);
      if (id === 'acornRush') for (let i = 0; i < 3; i++) add(this.sphere, (i - 1) * .4, .65, 0, .12, .2, .12, .9);
    } else if (id === 'thunderChain') {
      for (let i = 0; i < 5; i++) { const bolt = add(this.cube, 0, 1.05, 0, .075, .075, 1, .92); bolt.userData.role = 'lightning'; bolt.userData.phase = i; }
    } else if (id === 'starbolt' || id === 'arrow' || id === 'pierce' || id === 'leafOrb' || id === 'tripleShot' || id === 'moonArrow') {
      const orb = id === 'starbolt' || id === 'leafOrb', moon = id === 'moonArrow';
      const head = add(orb ? this.sphere : this.cone, 0, 1.05, 0, moon ? .32 : .23, orb ? .23 : moon ? .95 : .7, .23, .95, orb || moon ? color : 0xffe2a0); head.rotation.x = -Math.PI / 2;
      // An opaque pale shaft remains legible against both the dark forest and bright camp.
      add(this.cube, 0, 1.05, .55, .12, .12, .9, .95, 0xfff0c2);
      for (let i = 0; i < 3; i++) { const tail = add(this.cube, 0, 1.05, 1.05 + i * .34, .11 - i * .025, .09 - i * .02, id === 'pierce' ? .7 : .38, .65 - i * .16); tail.userData.role = 'tail'; }
      if (orb) for (let i = 0; i < 4; i++) { const shard = add(this.cone, Math.cos(i * Math.PI / 2) * .3, .8, Math.sin(i * Math.PI / 2) * .3, .06, .24, .06); shard.userData.role = 'orbit'; }
    } else if (id === 'frost' || id === 'roots' || id === 'trap' || id === 'vinePull') {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, shard = add(this.cone, Math.cos(a) * .7, .25, Math.sin(a) * .7, .1, id === 'trap' ? .24 : .75, .1);
        shard.rotation.set(Math.cos(a) * .35, 0, Math.sin(a) * .35); shard.userData.role = 'sprout'; shard.userData.phase = i;
        if (id === 'frost') { const petal = add(this.cube, Math.cos(a) * .4, .08, Math.sin(a) * .4, .06, .035, .42, .7); petal.rotation.y = -a; }
      }
      if (id === 'vinePull') for (let i = 0; i < 2; i++) { const vine = add(this.arc, 0, .18 + i * .3, 0, .8, .6, .8, .6); vine.rotation.x = Math.PI / 2; vine.userData.role = 'ribbon'; vine.userData.phase = i; }
    } else if (id === 'comet') {
      const core = add(this.sphere, 0, 3.5, 0, .45, .55, .45, .9, 0xffda82); core.userData.role = 'comet';
      for (let i = 0; i < 4; i++) { const flame = add(this.cone, i * .06, 3.9 + i * .3, 0, .23 - i * .04, .65, .18, .7 - i * .1); flame.userData.role = 'cometTail'; flame.userData.phase = i; }
    } else if (id === 'lantern') {
      add(this.sphere, 0, 1, 0, .18, .28, .18, .9, 0xffd77c);
      for (let i = 0; i < 4; i++) { const pointer = add(this.cone, Math.cos(i * Math.PI / 2) * .65, .08, Math.sin(i * Math.PI / 2) * .65, .1, .35, .1); pointer.rotation.set(Math.PI / 2, 0, i * Math.PI / 2); }
    } else if (id === 'wind') {
      for (let i = 0; i < 3; i++) { const ribbon = add(this.arc, 0, .15 + i * .17, 0, .65 + i * .1, .45, .65, .55); ribbon.rotation.set(Math.PI / 2, 0, i * 2); ribbon.userData.role = 'ribbon'; ribbon.userData.phase = i; }
    } else {
      // Falling arrows/stars and a rising fire helix share tiny unlit geometry, never lights or postprocessing.
      for (let i = 0; i < 8; i++) {
        const a = i * 2.399, r = .25 + (i % 3) * .23;
        const mote = add(id === 'vortex' ? this.sphere : this.cone, Math.cos(a) * r, .3 + i * .14, Math.sin(a) * r, id === 'vortex' ? .11 : .065, id === 'vortex' ? .16 : .4, .075, .8, i % 2 ? color : id === 'vortex' ? 0xffcb6b : 0xffe4a4);
        mote.userData.role = 'rain'; mote.userData.phase = i; mote.rotation.z = id === 'storm' ? -.4 : .3;
      }
      if (id === 'vortex') for (let i = 0; i < 2; i++) { const helix = add(this.arc, 0, .3 + i * .5, 0, .8 - i * .2, .7, .8, .5); helix.rotation.x = Math.PI / 2; helix.userData.role = 'ribbon'; helix.userData.phase = i; }
    }
    group.children.forEach(child => { child.userData.basePosition = child.position.clone(); child.userData.baseScale = child.scale.clone(); child.userData.baseRotation = child.rotation.clone(); });
    return group;
  }
  private animateEffect(group: T.Group, effect: HuntSnapshot['effects'][number], origin?: { x: number; z: number }) {
    const id = effect.skill, elapsed = Math.max(0, effect.duration - effect.remaining), progress = T.MathUtils.clamp(elapsed / Math.max(.01, effect.duration), 0, 1), reduced = !!this.options.reducedMotion;
    const projectile = ['starbolt', 'arrow', 'pierce', 'leafOrb', 'tripleShot', 'moonArrow'].includes(id), melee = ['crescent', 'charge', 'acornRush', 'dawnSlash'].includes(id);
    // A radius-six gameplay area has a low silhouette; never grow a six-metre-tall effect over labels.
    group.position.set(effect.x, .12, effect.z); group.rotation.set(0, 0, 0);
    group.scale.setScalar(projectile ? 1 : melee ? 1.3 : Math.min(4.6, Math.max(.7, effect.radius)));
    group.scale.y = projectile || melee ? 1 : 1.15;
    if (id === 'dawnSlash') group.scale.x = 2.4;
    if (projectile && origin) {
      const travel = reduced ? 1 : Math.min(1, elapsed / Math.min(.36, effect.duration * .9));
      group.position.x = T.MathUtils.lerp(origin.x, effect.x, travel); group.position.z = T.MathUtils.lerp(origin.z, effect.z, travel);
      group.rotation.y = Math.atan2(effect.x - origin.x, effect.z - origin.z) + Math.PI;
    } else if (melee && origin) group.rotation.y = Math.atan2(effect.x - origin.x, effect.z - origin.z);
    if (id === 'thunderChain' && origin) { group.position.set(origin.x, .12, origin.z); group.rotation.y = Math.atan2(effect.x - origin.x, effect.z - origin.z) + Math.PI; group.scale.set(1, 1, 1); }
    if (!reduced && (id === 'vortex' || id === 'wind' || id === 'storm' || id === 'galeShot')) group.rotation.y += elapsed * (id === 'vortex' ? 1.8 : .8);
    const budget = this.options.lowQuality || reduced ? 6 : 16;
    group.children.forEach((child, index) => {
      child.visible = index < budget; child.position.copy(child.userData.basePosition); child.scale.copy(child.userData.baseScale); child.rotation.copy(child.userData.baseRotation);
      const role = child.userData.role, phase = child.userData.phase ?? index;
      if (role === 'lightning' && origin) { const length = Math.hypot(effect.x - origin.x, effect.z - origin.z); child.position.z = -length * (phase + .5) / 5; child.position.x = (phase % 2 ? 1 : -1) * .12; child.scale.z = length / 5 + .08; child.rotation.y = (phase % 2 ? 1 : -1) * Math.atan2(.24, Math.max(.1, length / 5)); }
      if (reduced) { if (role === 'comet' || role === 'cometTail') child.position.y = .35 + (role === 'cometTail' ? phase * .12 : 0); return; }
      if (role === 'blade') { const swing = id === 'acornRush' ? (progress * 3 + phase / 3) % 1 : progress; child.rotation.y += swing * Math.PI * 1.3 - phase * .16; child.scale.multiplyScalar(Math.max(.15, Math.sin(swing * Math.PI))); }
      else if (role === 'ground') child.scale.multiplyScalar(.85 + Math.min(1, elapsed * 5) * .15);
      else if (role === 'sprout') child.scale.y *= Math.min(1, elapsed * 7 + .12);
      else if (role === 'rain') {
        const p = (elapsed * (id === 'vortex' ? .85 : 1.7) + phase * .137) % 1;
        child.position.y = id === 'vortex' ? .15 + p * 1.6 : .12 + (1 - p) * 2.5;
        child.scale.multiplyScalar(.65 + Math.sin(p * Math.PI) * .35);
      } else if (role === 'comet' || role === 'cometTail') { child.position.y = Math.max(role === 'comet' ? .35 : .4, child.userData.basePosition.y - elapsed * 8); child.position.x -= Math.min(.4, elapsed) * .5; }
      else if (role === 'ribbon') child.rotation.z += elapsed * 1.7 + phase;
      else if (role === 'orbit') child.position.y += Math.sin(elapsed * 2 + index) * .07;
    });
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
  dispose() { this.root.removeFromParent(); for (const value of this.numbers) { value.texture.dispose(); value.material.dispose(); } this.numbers = []; for (const geometry of this.geometries) geometry.dispose(); for (const material of this.materials) material.dispose(); this.geometries.clear(); this.materials.clear(); this.enemies.clear(); this.effects.clear(); this.effectOrigins.clear(); this.effectPool.clear(); this.impacts = []; this.impactPool = []; this.projectiles = []; this.projectilePool.clear(); this.castOrigins.clear(); this.colors.clear(); this.glowing.clear(); this.pendingDamage.clear(); this.root.clear(); }
}
