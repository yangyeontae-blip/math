import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seasonalParticleAt } from './storybook-art';
import { MARKET_SCALE, MARKET_SHOPS, POSTBOX_SPOT, VILLAGE_SPOTS } from './village-layout';

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
  private treeDecor?: T.Group;
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
    const loader = new T.TextureLoader(), maps = new Map<string, T.Texture>();
    const mapFor = (name: string) => {
      let map = maps.get(name);
      if (!map) { map = loader.load(`${import.meta.env.BASE_URL}art/christmas/${name}.webp`); map.colorSpace = T.SRGBColorSpace; this.textures.push(map); maps.set(name, map); }
      return map;
    };
    const sprite = (name: string, x: number, y: number, z: number, w: number, h: number) => {
      const material = new T.SpriteMaterial({ map: mapFor(name), transparent: true, alphaTest: .02, depthWrite: false, toneMapped: false }); this.materials.push(material);
      const object = new T.Sprite(material); object.name = `christmas-${name}`; object.center.set(.5, 0);
      object.position.set(x, y, z); object.scale.set(w, h, 1); this.root.add(object); return object;
    };
    const garland = (x: number, y: number, z: number, width: number, parent: T.Object3D = this.root) => {
      const material = new T.MeshBasicMaterial({ map: mapFor('garland'), transparent: true, alphaTest: .04, depthWrite: false, side: T.DoubleSide, toneMapped: false }); this.materials.push(material);
      this.mesh(parent, new T.PlaneGeometry(width, width / 6.4), material, x, y, z).name = 'christmas-garland';
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
      for (const shop of MARKET_SHOPS) sprite('wreath', shop.x, 1.35, shop.z + 1.95 * MARKET_SCALE, .85, .85);
      sprite('wreath', -14.5, 1.8, 11.75, 1.05, 1.05);
    } else {
      sprite('tree', -4.9, .25, 4.8, 4.8, 7.2);
      // Match the sprite's camera-facing up direction, including its illustrated star.
      const treeDecor = this.treeDecor = new T.Group(); treeDecor.name = 'christmas-tree-lights'; treeDecor.position.set(-4.9, .25, 4.8); treeDecor.quaternion.copy(options.camera.quaternion); this.root.add(treeDecor);
      sprite('gifts', -4.6, .27, 6, 2.7, 1.55); sprite('gifts', -6.5, .25, 4.6, 1.6, .95);
      sprite('wreath', POSTBOX_SPOT.x + .2, 2.35, POSTBOX_SPOT.z + 1.25, .8, .8);
      sprite('wreath', VILLAGE_SPOTS.notice.x - 1.1, 1.65, VILLAGE_SPOTS.notice.z + .38, .9, .9);
      sprite('wreath', 0, 1.7, -8.95, 1.25, 1.25);
      sprite('snowman', -15.3, .12, 14.9, 1.6, 2); sprite('snowman', 8.5, .12, 14.5, 1.6, 2);
      for (const x of [-10, 8]) garland(x, 1.05, 19.6, 6);
      // A low loop follows the stone ring without crossing signs or walking lanes.
      strand(Array.from({ length: 129 }, (_, i) => { const a = i / 128 * Math.PI * 2; return new T.Vector3(Math.cos(a) * 7.7, .62 + Math.sin(a * 8) * .12, 2 + Math.sin(a) * 7.7); }), low ? 8 : 2);
      strand(Array.from({ length: 129 }, (_, i) => { const t = i / 128, a = t * Math.PI * 8, r = 2.05 * (1 - t) + .12; return new T.Vector3(Math.cos(a) * r, .55 + t * 5.9, .18 + Math.sin(a) * r * .18); }), low ? 8 : 3, treeDecor);
      const starShape = new T.Shape();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .2 : .44; if (!i) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); } starShape.closePath();
      const gold = this.material(0xffdf84); gold.emissive.setHex(0xffbd47); gold.emissiveIntensity = 1.4; gold.side = T.DoubleSide;
      const star = this.mesh(treeDecor, new T.ShapeGeometry(starShape), gold, 0, 6.85, .08); star.name = 'christmas-treetop-star';
      const halo = sprite('star-glow', 0, 6.85, .12, 2.2, 2.2); halo.center.set(.5, .5); treeDecor.add(halo);
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
      garland(0, 1.25, .04, 7.1, plaque);
      for (const side of [-1, 1]) { const ribbon = sprite('bow', side * 3, .85, .08, .85, .6); plaque.add(ribbon); }
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
    this.treeDecor?.quaternion.copy(this.camera.quaternion);
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
