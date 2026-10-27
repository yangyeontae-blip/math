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
  constructor(readonly training = false) { this.root.userData.huntingRuntime = true; }
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
      this.piece(body, this.sphere, color, 0, .68, 0, .7, .64, .61);
      for (const side of [-1, 1]) {
        this.piece(body, this.sphere, 0x384a35, side * .21, .8, .55, .06, .08, .025);
        this.piece(body, this.sphere, 0xf4b5a3, side * .4, .61, .51, .12, .055, .03);
        this.piece(body, this.sphere, color, side * .4, .18, .12, .24, .16, .29);
      }
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
