import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seasonalParticleAt } from './storybook-art';
import { MARKET_SCALE, MARKET_SHOPS, POSTBOX_SPOT, VILLAGE_SPOTS } from './village-layout';

/** 크리스마스 트리와 간판 자리: 모험학교 왼쪽(화단·가로등과 겹치지 않는 곳), 간판은 트리 앞 광장 쪽. */
export const TREE_SPOT = { x: -8.5, z: -11 } as const;
export const SIGN_SPOT = { x: -8.8, y: 2, z: -8.6 } as const;

type Options = { market: boolean; dog: T.Group | null; characters: T.Group[]; camera: T.Camera; sign: (parent: T.Object3D) => () => void };

/** Temporary scenery only. All attachments, materials and lighting changes are owned here. */
export class ChristmasOverlay {
  readonly root = new T.Group();
  private textures: T.Texture[] = [];
  private materials: T.Material[] = [];
  private geometries = new Set<T.BufferGeometry>();
  private originals: { mesh: T.Mesh; material: T.Material | T.Material[] }[] = [];
  private cleanups: (() => void)[] = [];
  private attachments: T.Group[] = [];
  private bulbs: T.MeshStandardMaterial[] = [];
  private snow: T.InstancedMesh;
  private dummy = new T.Object3D();
  private camera: T.Camera;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(scene: T.Scene, private low: boolean, skip: Set<T.Object3D>, options: Options) {
    this.camera = options.camera;
    this.root.name = 'christmas-overlay'; this.root.userData.christmas = true;
    this.winterScenery(scene, skip);
    const background = scene.background; scene.background = new T.Color(0xe4e6ee);
    this.cleanups.push(() => { scene.background = background; });
    scene.traverse(o => {
      if (!(o instanceof T.HemisphereLight || o instanceof T.DirectionalLight)) return;
      const color = o.color.clone();
      o.color.lerp(new T.Color(o instanceof T.DirectionalLight ? 0xffd9b0 : 0xe7e7ff), .32);
      this.cleanups.push(() => { o.color.copy(color); });
    });
    const red = this.material(0xba3841), white = this.material(0xfff8e8);
    const sphere = new T.SphereGeometry(1, 10, 6);
    const ball = (parent: T.Object3D, material: T.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
      const m = this.mesh(parent, sphere, material, x, y, z); m.scale.set(sx, sy, sz); return m;
    };
    const hat = (parent: T.Object3D, y: number, radius: number) => {
      const g = new T.Group(); g.name = 'christmas-santa-hat'; g.position.y = y; g.rotation.z = -.16; parent.add(g);
      this.mesh(g, new T.ConeGeometry(radius, radius * 1.65, 12), red, 0, radius * .8, 0).rotation.z = -.12;
      this.mesh(g, new T.TorusGeometry(radius * .95, radius * .2, 6, 18), white, 0, .015, 0).rotation.x = Math.PI / 2;
      ball(g, white, radius * .1, radius * 1.65, 0, radius * .27);
    };
    const dogBody = options.dog?.userData.petBody as T.Group | undefined;
    const dogHead = dogBody?.userData.ppoHead as T.Group | undefined;
    if (dogHead) {
      const plaque = options.dog?.parent?.children.find(o => o.userData.sign);
      if (plaque) { const y = plaque.position.y; plaque.position.y = 3.5; this.cleanups.push(() => { plaque.position.y = y; }); }
      const costume = new T.Group(); costume.name = 'christmas-ppojjaki-costume'; dogHead.add(costume);
      hat(costume, .28, .32);
      this.mesh(costume, new T.TorusGeometry(.255, .075, 6, 18), red, 0, -.29, -.04).rotation.x = Math.PI / 2;
      this.mesh(costume, new T.BoxGeometry(.13, .33, .07), red, .16, -.43, .2).rotation.z = -.2;
      for (let i = 0; i < 4; i++) ball(costume, white, .14 + i * .008, -.32 - i * .065, .242, .035, .012, .01);
      this.batch(costume); this.attachments.push(costume);
    }
    options.characters.forEach((character, i) => {
      // makeCharacter's head and hair belong to the animated body, without a head bone.
      const body = character.userData.body as T.Group | undefined; if (!body) return;
      const accessory = new T.Group(); accessory.name = i ? 'christmas-arena-earmuffs' : 'christmas-guide-hat'; body.add(accessory);
      if (!i) hat(accessory, 1.99, .49);
      else {
        this.mesh(accessory, new T.TorusGeometry(.52, .045, 5, 18, Math.PI), red, 0, 1.53, 0);
        for (const side of [-1, 1]) ball(accessory, red, side * .53, 1.53, .02, .14, .2, .16);
      }
      this.batch(accessory); this.attachments.push(accessory);
    });
    // 2026-11-27: 평평한 그림(스프라이트) 대신 광장 나무와 같은 로우폴리 3D 모형으로 만들어요.
    const flat = (color: number, emissive = 0, glow = 0) => {
      const m = new T.MeshStandardMaterial({ color, roughness: .9, flatShading: true });
      if (emissive) { m.emissive.setHex(emissive); m.emissiveIntensity = glow; }
      this.materials.push(m); return m;
    };
    const pine = flat(0x3f7a4a), pineDark = flat(0x2f6440), snowCap = flat(0xfbfbf7), bark = flat(0x7a5434);
    const coal = flat(0x2b2a2e), carrot = flat(0xe8833a), scarfRed = flat(0xc23a45), scarfCream = flat(0xf6ead2);
    const ornaments = [flat(0xd33c48, 0x5a0d14, .25), flat(0xf2c14e, 0x6a4a08, .35), flat(0x5f9fd8, 0x123a5e, .25), flat(0xf4f1ea)];
    const giftColors = [flat(0xd9534f), flat(0x4f9a6a), flat(0x5b8fd6), flat(0xf0c14b), flat(0xb86fd0)];
    const ribbonGold = flat(0xf6d77a), ribbonRed = flat(0xc8303e);
    const place = (o: T.Object3D, x: number, y: number, z: number, parent: T.Object3D = this.root) => { o.position.set(x, y, z); parent.add(o); return o; };
    // 트리: 5단으로 층이 보이게, 위로 갈수록 좁고 밝게. 단 끝마다 눈, 구슬은 단마다 몇 개만 크게.
    const pineTiers = [flat(0x2c5e3c), flat(0x336b43), flat(0x3b784a), flat(0x438552), flat(0x4c925a)];
    const skirt = flat(0xb8343f), skirtTrim = flat(0xf7efe0);
    const tree3d = (x: number, z: number, s: number) => {
      const g = new T.Group(); g.name = 'christmas-tree'; place(g, x, 0, z); g.scale.setScalar(s);
      ball(g, snowCap, 0, .02, 0, 1.75, .18, 1.75);
      this.mesh(g, new T.CylinderGeometry(1.25, 1.35, .06, 14), skirt, 0, .12, 0);
      this.mesh(g, new T.TorusGeometry(1.3, .05, 5, 20), skirtTrim, 0, .15, 0).rotation.x = Math.PI / 2;
      this.mesh(g, new T.CylinderGeometry(.16, .22, .75, 7), bark, 0, .45, 0);
      const tiers: [number, number, number][] = [[1.4, 1.15, .6], [1.12, 1.0, 1.25], [.86, .9, 1.85], [.6, .8, 2.4], [.36, .68, 2.9]];
      tiers.forEach(([r, h, base], i) => {
        const cone = this.mesh(g, new T.ConeGeometry(r, h, 8), pineTiers[i], 0, base + h / 2, 0); cone.rotation.y = i * .4;
        // 단 아래 끝을 따라 얹힌 눈(얇은 고리)
        const rim = this.mesh(g, new T.TorusGeometry(r * .9, .07, 4, 16), snowCap, 0, base + .08, 0); rim.rotation.x = Math.PI / 2; rim.scale.z = .6;
        const n = [5, 4, 4, 3, 0][i];
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2 + i * .9;
          ball(g, ornaments[(k + i) % 3], Math.cos(a) * r * .86, base + .2, Math.sin(a) * r * .86, .13);
        }
      });
      return g;
    };
    const snowman3d = (x: number, z: number, s: number, turn: number) => {
      const g = new T.Group(); g.name = 'christmas-snowman'; place(g, x, 0, z); g.scale.setScalar(s); g.rotation.y = turn;
      ball(g, snowCap, 0, .55, 0, .58); ball(g, snowCap, 0, 1.3, 0, .42); ball(g, snowCap, 0, 1.92, 0, .3);
      for (const side of [-1, 1]) ball(g, coal, side * .1, 2, .26, .04);
      for (const y of [1.45, 1.28, 1.1]) ball(g, coal, 0, y, .41, .045);
      const nose = this.mesh(g, new T.ConeGeometry(.055, .3, 6), carrot, 0, 1.93, .4); nose.rotation.x = Math.PI / 2;
      const scarf = this.mesh(g, new T.TorusGeometry(.3, .08, 6, 14), scarfRed, 0, 1.66, 0); scarf.rotation.x = Math.PI / 2;
      this.mesh(g, new T.BoxGeometry(.16, .42, .08), scarfRed, .18, 1.45, .25).rotation.z = -.18;
      this.mesh(g, new T.BoxGeometry(.17, .05, .085), scarfCream, .19, 1.33, .25);
      for (const side of [-1, 1]) {
        const arm = this.mesh(g, new T.CylinderGeometry(.025, .035, .75, 5), bark, side * .62, 1.45, 0); arm.rotation.z = side * -1.05;
        const twig = this.mesh(g, new T.CylinderGeometry(.015, .02, .22, 4), bark, side * .88, 1.68, 0); twig.rotation.z = side * -.3;
      }
      this.mesh(g, new T.CylinderGeometry(.24, .24, .05, 10), coal, 0, 2.19, 0);
      this.mesh(g, new T.CylinderGeometry(.16, .17, .28, 10), coal, 0, 2.34, 0);
      this.mesh(g, new T.CylinderGeometry(.171, .171, .06, 10), scarfRed, 0, 2.25, 0);
      return g;
    };
    const gift3d = (x: number, z: number, w: number, h: number, d: number, color: number, turn: number) => {
      const g = new T.Group(); g.name = 'christmas-gift'; place(g, x, 0, z); g.rotation.y = turn;
      this.mesh(g, new T.BoxGeometry(w, h, d), giftColors[color % giftColors.length], 0, h / 2, 0);
      const rib = color % 2 ? ribbonGold : ribbonRed;
      this.mesh(g, new T.BoxGeometry(w + .02, h + .02, d * .18), rib, 0, h / 2, 0);
      this.mesh(g, new T.BoxGeometry(w * .18, h + .02, d + .02), rib, 0, h / 2, 0);
      for (const side of [-1, 1]) { const loop = this.mesh(g, new T.TorusGeometry(.15 * w, .03, 5, 10), rib, side * .13 * w, h + .06, 0); loop.rotation.y = Math.PI / 2; loop.rotation.z = side * .5; }
      return g;
    };
    const wreath3d = (x: number, y: number, z: number, size: number, parent: T.Object3D = this.root) => {
      const g = new T.Group(); g.name = 'christmas-wreath'; place(g, x, y, z, parent); g.scale.setScalar(size);
      this.mesh(g, new T.TorusGeometry(.36, .13, 7, 16), pine);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ball(g, k % 2 ? ornaments[0] : pineDark, Math.cos(a) * .36, Math.sin(a) * .36, .1, k % 2 ? .06 : .09); }
      for (const side of [-1, 1]) ball(g, red, side * .11, -.36, .14, .1, .07, .05).rotation.z = side * .4;
      ball(g, red, 0, -.36, .16, .05);
      return g;
    };
    const garland = (x: number, y: number, z: number, width: number, parent: T.Object3D = this.root) => {
      const pts = Array.from({ length: 25 }, (_, i) => { const s = i / 24; return new T.Vector3(x - width / 2 + s * width, y - Math.sin(s * Math.PI * 2) ** 2 * .18, z); });
      const rope = this.mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, .09, 6, false), pine); rope.name = 'christmas-garland';
      pts.forEach((pt, i) => { if (i % 3 === 0) ball(parent, i % 2 ? ornaments[1] : ornaments[0], pt.x, pt.y - .06, pt.z + .08, .06); });
    };
    const bow = (x: number, y: number, z: number, size: number) => {
      for (const side of [-1, 1]) {
        ball(this.root, red, x + side * size * .25, y, z, size * .29, size * .2, size * .13).rotation.z = side * .3;
        this.mesh(this.root, new T.BoxGeometry(size * .18, size * .42, size * .09), red, x + side * size * .14, y - size * .25, z).rotation.z = side * .25;
      }
      ball(this.root, red, x, y, z + size * .08, size * .13);
    };
    const bulbPositions = new Map<T.Object3D, T.Vector3[]>();
    const wireMaterial = new T.LineBasicMaterial({ color: 0x48664b }); this.materials.push(wireMaterial);
    const strand = (points: T.Vector3[], spacing: number, parent: T.Object3D = this.root) => {
      const geometry = new T.BufferGeometry().setFromPoints(points); this.geometries.add(geometry);
      const wire = new T.Line(geometry, wireMaterial); wire.name = 'christmas-light-wire'; parent.add(wire);
      const bulbs = bulbPositions.get(parent) ?? []; bulbPositions.set(parent, bulbs);
      for (let i = 0; i < points.length; i += spacing) bulbs.push(points[i]);
    };
    const lampSpots = options.market ? [[-19, 5], [-6, 5], [6, 5], [19, 5], [-20, -9], [-6, -9], [6, -9], [20, -9]] : [[-6, 8], [6, 8], [-10, -7], [10, -8]];
    for (const [x, z] of lampSpots) {
      this.mesh(this.root, new T.CylinderGeometry(.112, .112, 2.1, 10), white, x, 1.25, z);
      const helix = Array.from({ length: 65 }, (_, i) => { const a = i / 64 * Math.PI * 10; return new T.Vector3(x + Math.cos(a) * .116, .2 + i / 64 * 2.1, z + Math.sin(a) * .116); });
      this.mesh(this.root, new T.TubeGeometry(new T.CatmullRomCurve3(helix), 64, .027, 4, false), red);
      bow(x, 2.05, z + .17, .8);
    }
    if (options.market) {
      for (const shop of MARKET_SHOPS) wreath3d(shop.x, 1.35, shop.z + 1.95 * MARKET_SCALE, .95);
      wreath3d(-14.5, 1.8, 11.75, 1.15);
    } else {
      // 2026-11-27 우체통·기부함·공지판이 모인 곳은 번잡해서, 선생님 제안대로 모험학교 왼쪽으로 옮겼어요.
      tree3d(TREE_SPOT.x, TREE_SPOT.z, 1.9);
      const treeDecor = new T.Group(); treeDecor.name = 'christmas-tree-lights'; treeDecor.position.set(TREE_SPOT.x, 0, TREE_SPOT.z); treeDecor.scale.setScalar(1.9); this.root.add(treeDecor);
      [[1.7, 1.1, .7, .55, .6, 0, .3], [2.4, .1, .55, .45, .55, 1, -.4], [-1.8, 1, .5, .7, .5, 2, .8], [.5, 1.9, .65, .5, .6, 3, .2], [-2.3, -.2, .45, .35, .45, 4, -.6]].forEach(([gx, gz, w, h, d, c, r]) => gift3d(TREE_SPOT.x + gx, TREE_SPOT.z + gz, w, h, d, c, r));
      wreath3d(POSTBOX_SPOT.x + .2, 2.35, POSTBOX_SPOT.z + 1.25, .9);
      wreath3d(VILLAGE_SPOTS.notice.x - 1.1, 1.65, VILLAGE_SPOTS.notice.z + .38, 1);
      wreath3d(0, 1.7, -8.95, 1.35);
      snowman3d(-15.3, 14.9, 1.45, .4); snowman3d(-10.5, 16.2, 1.3, .1);
      for (const x of [-10, 8]) garland(x, 1.05, 19.6, 6);
      // A low loop follows the stone ring without crossing signs or walking lanes.
      strand(Array.from({ length: 129 }, (_, i) => { const a = i / 128 * Math.PI * 2; return new T.Vector3(Math.cos(a) * 7.7, .62 + Math.sin(a * 8) * .12, 2 + Math.sin(a) * 7.7); }), low ? 8 : 2);
      strand(Array.from({ length: 129 }, (_, i) => { const t = i / 128, a = t * Math.PI * 10, r = 1.3 * (1 - t) + .14; return new T.Vector3(Math.cos(a) * r, .7 + t * 2.75, Math.sin(a) * r); }), low ? 8 : 3, treeDecor);
      const starShape = new T.Shape();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .2 : .44; if (!i) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); } starShape.closePath();
      const gold = this.material(0xffdf84); gold.emissive.setHex(0xffbd47); gold.emissiveIntensity = 1.4; gold.side = T.DoubleSide;
      const star = this.mesh(treeDecor, new T.ExtrudeGeometry(starShape, { depth: .12, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 1 }), gold, 0, 3.72, -.06); star.name = 'christmas-treetop-star'; star.scale.setScalar(1.05);
    }
    [0xf55c55, 0xffc34f, 0x69b875, 0xffeed1].forEach((color, index) => {
      const material = this.material(color); material.emissive.setHex(color); material.emissiveIntensity = 1.15; this.bulbs.push(material);
      for (const [parent, all] of bulbPositions) {
        const positions = all.filter((_, i) => i % 4 === index);
        const geometry = new T.SphereGeometry(.105, 7, 5); this.geometries.add(geometry);
        const bulbs = new T.InstancedMesh(geometry, material, positions.length); bulbs.name = `christmas-bulbs-${index}`;
        positions.forEach((p, i) => { this.dummy.position.copy(p); this.dummy.scale.set(1, 1.3, 1); this.dummy.updateMatrix(); bulbs.setMatrixAt(i, this.dummy.matrix); });
        bulbs.computeBoundingSphere(); parent.add(bulbs);
      }
    });
    this.batch(this.root);
    if (!options.market) {
      this.cleanups.push(options.sign(this.root));
      const plaque = this.root.getObjectByName('표지판: 메리 크리스마스')!;
      garland(0, .95, .04, 3.4, plaque);
      for (const side of [-1, 1]) {
        const px = SIGN_SPOT.x + side * 1.45;
        this.mesh(this.root, new T.CylinderGeometry(.1, .12, SIGN_SPOT.y, 8), white, px, SIGN_SPOT.y / 2, SIGN_SPOT.z);
        const helix = Array.from({ length: 41 }, (_, k) => { const a = k / 40 * Math.PI * 7; return new T.Vector3(px + Math.cos(a) * .115, k / 40 * SIGN_SPOT.y, SIGN_SPOT.z + Math.sin(a) * .115); });
        this.mesh(this.root, new T.TubeGeometry(new T.CatmullRomCurve3(helix), 40, .03, 4, false), red);
      }
    }
    const snowMaterial = new T.MeshBasicMaterial({ color: 0xfffcf5, transparent: true, opacity: .8, depthWrite: false }); this.materials.push(snowMaterial);
    const snowGeometry = new T.SphereGeometry(1, 5, 3); this.geometries.add(snowGeometry);
    this.snow = new T.InstancedMesh(snowGeometry, snowMaterial, low ? 20 : 96);
    this.snow.name = 'christmas-snow'; this.snow.frustumCulled = false; this.snow.visible = !this.reduced;
    this.root.add(this.snow); scene.add(this.root); this.update(0, new T.Vector3());
  }

  private material(color: number) {
    const material = new T.MeshStandardMaterial({ color, roughness: .95 }); this.materials.push(material); return material;
  }
  private mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, x = 0, y = 0, z = 0) {
    this.geometries.add(geometry); const m = new T.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m;
  }
  private batch(group: T.Group) {
    group.updateWorldMatrix(true, true);
    const inverse = group.matrixWorld.clone().invert(), groups = new Map<T.Material, T.Mesh[]>();
    group.traverse(o => { if (o instanceof T.Mesh && !(o instanceof T.InstancedMesh) && !Array.isArray(o.material) && !o.name) (groups.get(o.material) ?? groups.set(o.material, []).get(o.material)!).push(o); });
    for (const [material, list] of groups) {
      if (list.length < 2) continue;
      const parts = list.map(o => o.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld)));
      const geometry = mergeGeometries(parts); parts.forEach(p => p.dispose()); if (!geometry) continue;
      this.geometries.add(geometry); list.forEach(o => o.removeFromParent()); group.add(new T.Mesh(geometry, material));
    }
  }
  private winterScenery(scene: T.Scene, skip: Set<T.Object3D>) {
    const tint = new Map<string, T.MeshStandardMaterial>(), bounds = new T.Box3(), hsl = { h: 0, s: 0, l: 0 };
    scene.updateMatrixWorld(true);
    const walk = (o: T.Object3D) => {
      if (skip.has(o)) return;
      if (o instanceof T.Mesh && o.material instanceof T.MeshStandardMaterial) {
        const original = o.material; original.color.getHSL(hsl); bounds.setFromObject(o);
        // 연못·분수 물(파란빛)은 눈으로 덮지 않고 살짝 언 물빛만 줘요.
        const water = hsl.h > .45 && hsl.h < .72 && hsl.s > .15;
        const ground = !water && bounds.max.y < .4 && bounds.min.y < .25;
        const foliage = !water && hsl.h > .16 && hsl.h < .46 && hsl.s > .12;
        if (ground || foliage || water) {
          const key = original.uuid + (water ? '-water' : ground ? '-ground' : '-foliage'); let winter = tint.get(key);
          if (!winter) {
            winter = original.clone(); winter.userData = {};
            winter.color.lerp(new T.Color(water ? 0xd8eef6 : ground ? 0xf5f5f0 : 0xe7efec), water ? .3 : ground ? .94 : .72);
            tint.set(key, winter); this.materials.push(winter);
          }
          this.originals.push({ mesh: o, material: original }); o.material = winter;
        }
      }
      for (const child of o.children) walk(child);
    };
    walk(scene);
  }
  update(time: number, player: T.Vector3) {
    if (!this.low && !this.reduced) this.bulbs.forEach((m, i) => { m.emissiveIntensity = 1.1 + Math.sin(time * 1.35 + i * 1.6) * .28; });
    if (this.reduced) return;
    for (let i = 0; i < this.snow.count; i++) {
      const p = seasonalParticleAt('snow', time * .72, i, 26);
      this.dummy.position.set(player.x + p.x, p.y, player.z + p.z);
      this.dummy.scale.setScalar(p.scale * p.opacity); this.dummy.updateMatrix(); this.snow.setMatrixAt(i, this.dummy.matrix);
    }
    this.snow.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.cleanups.forEach(cleanup => cleanup()); this.root.removeFromParent();
    for (const { mesh, material } of this.originals) mesh.material = material;
    this.attachments.forEach(g => g.removeFromParent());
    this.root.traverse(o => { if (o instanceof T.InstancedMesh) o.dispose(); });
    this.geometries.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose());
  }
}
