import * as T from 'three';
import { skillInfo, type SkillId } from './academy';
import { COMBAT_ART, type CombatArt, type CombatMotif } from './combat-art';

type Point = { x: number; z: number };
type Cue = { root: T.Group; age: number; duration: number; art: CombatArt; rank: number; origin: Point; target: Point; kind: 'cast' | 'hit' | 'defeat' | 'basic'; angle: number };
type Spark = { active: boolean; age: number; duration: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; color: T.Color };
export type CombatQuality = { lowQuality?: boolean; reducedMotion?: boolean };
const motifs: CombatMotif[] = ['blade', 'moon', 'leaf', 'flower', 'tree', 'flask', 'crystal', 'seal', 'star', 'crown', 'galaxy', 'arrow', 'planet', 'note', 'wave', 'shield', 'wind'];
const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
// Analytic, antialiased rings and petal sigils. No render targets, lights or bloom pass.
const fragmentShader = `
varying vec2 vUv; uniform vec3 tint; uniform vec3 accent; uniform float age; uniform float alpha; uniform float petals; uniform float motif; uniform float mode;
float stroke(float x,float width){return 1.-smoothstep(width,width+.012,abs(x));}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float ink=0.;
 if(mode<.5){float circle=stroke(r-.77,.012)+stroke(r-.89,.008);float ticks=pow(max(0.,cos(a*petals*2.)),24.)*stroke(r-.84,.04);float petal=.48+.13*cos(a*petals+age*.6);ink=circle*.65+ticks+stroke(r-petal,.018);
 float emblem=0.;
 if(motif<.5){emblem=stroke(p.x+.32*p.y,.035)*step(abs(p.y),.48);}
 else if(motif<1.5){emblem=stroke(r-.3,.022)*smoothstep(-.2,.12,-p.x);}
 else if(motif<4.5){emblem=stroke(r-(.23+.12*cos(a*petals)),.027);}
 else if(motif<5.5){emblem=stroke(length(vec2(p.x,p.y+.12))-.21,.024)*step(p.y,.02)+stroke(abs(p.x)-.07,.02)*step(abs(p.y-.13),.17);}
 else if(motif<8.5){emblem=stroke(r-(.24+.1*cos(a*petals)),.02);}
 else if(motif<9.5){emblem=stroke(p.y+.2,.025)*step(abs(p.x),.38)+stroke(p.y-(.04+.14*cos(p.x*17.)),.024)*step(abs(p.x),.38);}
 else if(motif<12.5){emblem=stroke(length(vec2(p.x,p.y*2.))-.35,.02)+stroke(r-.17,.022);}
 else if(motif<13.5){emblem=stroke(p.x-.08,.022)*step(abs(p.y-.02),.29)+stroke(length(vec2((p.x+.02)*.8,(p.y+.26)*1.3))-.09,.027);}
 else {emblem=stroke(p.y-.09*sin(p.x*13.),.024)*step(abs(p.x),.38);}
 ink+=emblem;
 }else if(mode<1.5){float sweep=smoothstep(-2.7,-2.3,a)*(1.-smoothstep(.7,1.3,a));ink=(stroke(r-.64,.022)+stroke(r-.71,.055)*.45)*sweep;}
 else if(mode<2.5){ink=exp(-p.x*p.x*80.)*pow(max(0.,1.-abs(p.y)),.6)+stroke(abs(p.x)-.16,.008)*pow(max(0.,1.-abs(p.y)),2.)*.35;}
 else {ink=pow(max(0.,1.-r),3.)*.55+stroke(r-(.18+age*.65),.025)*(1.-age);}
 float fade=1.-smoothstep(.93,1.,r);float value=clamp(ink*fade,0.,1.);gl_FragColor=vec4(mix(tint,accent,min(1.,value*.32)),value*alpha*.72);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

/** A bounded presentation timeline. Every cue and spark slot is reused. */
export class CombatVfx {
  readonly root = new T.Group();
  private plane = new T.PlaneGeometry(1, 1);
  private sparkGeometry = new T.OctahedronGeometry(1, 0);
  private sparkMaterial = new T.MeshBasicMaterial({ color: 0xffffff, blending: T.AdditiveBlending, transparent: true, opacity: .85, depthWrite: false, toneMapped: false });
  private sparks = new T.InstancedMesh(this.sparkGeometry, this.sparkMaterial, 240);
  private slots: Spark[] = Array.from({ length: 240 }, () => ({ active: false, age: 0, duration: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, color: new T.Color() }));
  private cues: Cue[] = [];
  private pool: T.Group[] = [];
  private owned = new Set<T.ShaderMaterial>();
  private dummy = new T.Object3D();
  private cursor = 0;
  private disposed = false;
  constructor(readonly quality: CombatQuality = {}) { this.root.name = 'combat-vfx'; this.root.userData.combatVfx = true; this.sparks.frustumCulled = false; this.sparks.instanceMatrix.setUsage(T.DynamicDrawUsage); this.sparks.count = 0; this.root.add(this.sparks); }
  setQuality(quality: CombatQuality) { Object.assign(this.quality, quality); if (this.quality.lowQuality) while (this.cues.length > 8) this.recycle(this.cues.shift()!); }
  private makeCue() {
    const root = new T.Group();
    for (let i = 0; i < 5; i++) {
      const material = new T.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { tint: { value: new T.Color() }, accent: { value: new T.Color() }, age: { value: 0 }, alpha: { value: 0 }, petals: { value: 5 }, motif: { value: 0 }, mode: { value: i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : 3 } }, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
      this.owned.add(material); const mesh = new T.Mesh(this.plane, material); mesh.renderOrder = 3; root.add(mesh);
    }
    return root;
  }
  cue(kind: Cue['kind'], art: CombatArt, origin: Point, target = origin, rank = 1, angle = 0) {
    if (![origin.x, origin.z, target.x, target.z].every(Number.isFinite)) return;
    const limit = this.quality.lowQuality ? 8 : 18;
    if (this.cues.length >= limit) this.recycle(this.cues.shift()!);
    const root = this.pool.pop() ?? this.makeCue(); this.root.add(root);
    const cue: Cue = { root, age: 0, duration: kind === 'cast' ? .85 + rank * .12 : kind === 'defeat' ? .8 : .46, art, rank, origin: { ...origin }, target: { ...target }, kind, angle };
    for (const object of root.children) { const u = ((object as T.Mesh).material as T.ShaderMaterial).uniforms; u.tint.value.setHex(art.color); u.accent.value.setHex(art.accent); u.petals.value = art.petals; u.motif.value = motifs.indexOf(art.motif); }
    this.cues.push(cue);
    if (!this.quality.reducedMotion) this.emit(target, art, kind === 'cast' ? 8 + rank * 4 : kind === 'defeat' ? 30 : 12, kind === 'defeat' ? 3 : 1.8);
    this.pose(cue);
  }
  cast(id: SkillId, origin: Point, target: Point) { const art = COMBAT_ART[id]; this.cue('cast', art, origin, target, skillInfo(id).rank || 1, art.twist); }
  hit(id: SkillId | 'basic', point: Point) { this.cue('hit', id === 'basic' ? COMBAT_ART.crescent : COMBAT_ART[id], point); }
  defeat(point: Point, color = 0xffd882) { this.cue('defeat', { ...COMBAT_ART.starbolt, color }, point); }
  private emit(point: Point, art: CombatArt, requested: number, power: number) {
    const count = this.quality.lowQuality ? Math.ceil(requested / 4) : requested;
    for (let i = 0; i < count; i++) {
      const slot = this.slots[this.cursor++ % (this.quality.lowQuality ? 64 : this.slots.length)], a = i * 2.399 + this.cursor * .13;
      Object.assign(slot, { active: true, age: 0, duration: .45 + i % 5 * .1, x: point.x, y: .65, z: point.z, vx: Math.cos(a) * power, vy: 1.8 + i % 4 * .6, vz: Math.sin(a) * power, size: .035 + i % 3 * .025 });
      slot.color.setHex(i % 3 ? art.color : art.accent);
    }
  }
  private pose(cue: Cue) {
    const { root, art, rank, kind, age, duration, origin, target } = cue, reduced = !!this.quality.reducedMotion;
    const p = Math.min(1, age / duration), travel = reduced ? 1 : T.MathUtils.smoothstep(age, .10, .28);
    const x = T.MathUtils.lerp(origin.x, target.x, travel), z = T.MathUtils.lerp(origin.z, target.z, travel);
    root.position.set(x, .09, z);
    // Four readable phases: charging seal, release ribbon, contact column, lingering rings.
    root.userData.phase = p < .15 ? 'cast' : p < .32 ? 'launch' : p < .65 ? 'impact' : 'afterglow';
    const scale = kind === 'basic' ? 3.6 : kind === 'cast' ? 2.8 + rank * .65 : kind === 'defeat' ? 2.6 : 1.8;
    for (let i = 0; i < root.children.length; i++) {
      const mesh = root.children[i] as T.Mesh<T.PlaneGeometry, T.ShaderMaterial>, u = mesh.material.uniforms;
      mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); mesh.scale.setScalar(scale);
      mesh.visible = reduced ? i === 0 : this.quality.lowQuality ? i < 2 : i < (rank >= 3 ? 5 : 4);
      u.age.value = reduced ? .5 : p; u.alpha.value = reduced ? .28 : Math.min(1, age * 15 + .18) * (1 - T.MathUtils.smoothstep(p, .55, 1));
      if (i === 0) { mesh.rotation.set(-Math.PI / 2, 0, reduced ? 0 : age * (.3 + art.twist)); mesh.scale.multiplyScalar(reduced ? 1 : .65 + Math.min(1, age * 6) * .35); }
      if (i === 1) { mesh.rotation.set(-.8, cue.angle + age * 2, -.5); mesh.position.y = .9; mesh.scale.multiplyScalar(.95); if (kind === 'cast' && ['moon', 'planet', 'galaxy'].includes(art.motif)) mesh.rotation.x = .6; }
      if (i === 2) { mesh.position.y = scale * .6; mesh.scale.set(scale * .65, scale * 1.6, 1); mesh.rotation.y = Math.PI / 4; u.alpha.value *= (rank >= 3 ? .75 : .35) * Math.sin(Math.min(1, age * 4) * Math.PI * .85); }
      if (i === 3) { mesh.rotation.x = -Math.PI / 2; mesh.scale.multiplyScalar(1 + p * .8); u.alpha.value *= .6; }
      if (i === 4) { mesh.position.y = 1.1; mesh.rotation.y = -Math.PI / 4; mesh.scale.set(scale, scale * .65, 1); u.alpha.value *= .5; }
      if (!reduced && (kind === 'hit' || kind === 'defeat')) {
        mesh.visible = i < (kind === 'defeat' ? 1 : 2);
        u.mode.value = i === 0 ? 3 : 1;
        mesh.rotation.set(-.6,.64,i === 0 ? 0 : -.7 + age * 2);
        mesh.position.y = .85; mesh.scale.setScalar(scale * (.6 + p * .7));
        u.alpha.value *= .8;
      } else if (!reduced && kind === 'basic') {
        mesh.visible = i === 1 || !this.quality.lowQuality && i === 3;
        u.mode.value = 1;
        mesh.position.y = 1.0; mesh.rotation.set(-.55,.64,-.9 + age * 4 - (i===3?.25:0));
        mesh.scale.set(scale*(i===3?.85:1),scale*.7,1);
        u.alpha.value *= Math.sin(Math.min(1,age/.09)*Math.PI*.5)*(i===3?.3:.9);
      } else u.mode.value = i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : 3;
      // Accessibility: a steady ground emblem, no flash, sweep or rising columns.
      if (reduced) { u.alpha.value = .25; mesh.rotation.set(-Math.PI / 2, 0, 0); }
    }
  }
  update(dt: number) {
    dt = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 1)) : 0;
    for (let i = this.cues.length - 1; i >= 0; i--) { const cue = this.cues[i]; cue.age += dt; if (cue.age >= cue.duration) { this.recycle(cue); this.cues.splice(i, 1); } else this.pose(cue); }
    let count = 0;
    for (const spark of this.slots) {
      if (!spark.active) continue; spark.age += dt;
      if (spark.age >= spark.duration || this.quality.reducedMotion || this.quality.lowQuality && count >= 64) { spark.active = false; continue; }
      const t = spark.age, fade = 1 - t / spark.duration;
      this.dummy.position.set(spark.x + spark.vx * t, spark.y + spark.vy * t - 2.5 * t * t, spark.z + spark.vz * t);
      this.dummy.rotation.set(t * 3, t * 2, t); this.dummy.scale.set(spark.size * fade, spark.size * fade * 2, spark.size * fade); this.dummy.updateMatrix();
      this.sparks.setMatrixAt(count, this.dummy.matrix); this.sparks.setColorAt(count, spark.color); count++;
    }
    this.sparks.count = count; this.sparks.instanceMatrix.needsUpdate = true; if (this.sparks.instanceColor) this.sparks.instanceColor.needsUpdate = true;
  }
  private recycle(cue: Cue) { cue.root.removeFromParent(); this.pool.push(cue.root); }
  clear() { for (const cue of this.cues) this.recycle(cue); this.cues = []; for (const slot of this.slots) slot.active = false; this.sparks.count = 0; }
  dispose() { if (this.disposed) return; this.disposed = true; this.clear(); this.root.removeFromParent(); this.sparks.dispose(); this.plane.dispose(); this.sparkGeometry.dispose(); this.sparkMaterial.dispose(); for (const material of this.owned) material.dispose(); this.owned.clear(); this.pool = []; this.root.clear(); }
}
