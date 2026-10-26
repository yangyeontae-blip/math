import * as T from 'three';
import { makeContactShadow, storybookMaterial } from './storybook-art';

// One clock drives shared vertex shaders, without walking through every leaf each frame.
const windTime = { value: 0 }, windStrength = { value: 1 };
const leaves = new Map<number, T.MeshStandardMaterial>();
const flatSurfaces = new Map<string,T.MeshStandardMaterial>();
export function leafMaterial(color: number) {
  if (leaves.has(color)) return leaves.get(color)!;
  const m = new T.MeshStandardMaterial({ color, roughness: .94 });
  m.onBeforeCompile = shader => {
    shader.uniforms.storyTime = windTime; shader.uniforms.storyMotion = windStrength;
    shader.vertexShader = 'uniform float storyTime; uniform float storyMotion;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 storyAt = (modelMatrix * vec4(position, 1.0)).xyz;
      #ifdef USE_INSTANCING
        storyAt = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
      #endif
      transformed.x += sin(storyTime*.85 + storyAt.x*.37 + storyAt.z*.21) * .055 * storyMotion;
      transformed.z += cos(storyTime*.65 + storyAt.x*.23) * .025 * storyMotion;`);
  };
  m.customProgramCacheKey = () => 'storybook-leaves-1';
  leaves.set(color, m); return m;
}

/** Visual decoration only. It never enters the collision or interaction lists. */
export class StorybookScene {
  private root: T.Group | null = null;
  private plants: T.InstancedMesh | null = null;
  private water: T.InstancedMesh | null = null;
  private waterSpots: { x: number; y: number; z: number; radius: number }[] = [];
  private floors: T.Box3[] = [];
  private contact = makeContactShadow(.72);
  private petContact = makeContactShadow(.46);
  private dummy = new T.Object3D();
  private reduced = false;
  private scene: T.Scene | null = null;
  clear(scene: T.Scene) {
    if (!this.root) return;
    scene.remove(this.root);
    this.root.traverse(o => { if (o instanceof T.Mesh) { if(!o.geometry.userData.sharedStorybookAsset)o.geometry.dispose();const m=o.material;if(!Array.isArray(m)&&m.userData.storybookOwned)m.dispose();if(o instanceof T.InstancedMesh)o.dispose(); } });
    this.root = null; this.plants = this.water = null; this.waterSpots = [];this.floors=[];
  }
  prepare(scene: T.Scene, indoor: boolean, market: boolean, forest: boolean, forestColor: number) {
    this.clear(scene);
    this.scene=scene;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scene.fog = null;
    scene.updateMatrixWorld(true);
    scene.traverse(o => {
      if (!(o instanceof T.Mesh) || !(o.material instanceof T.MeshStandardMaterial) || o.material.transparent || o.userData.xray) return;
      const p = o.geometry.parameters as { width?: number; height?: number; depth?: number; radiusTop?: number } | undefined;
      if (!p) return;
      const color = o.material.color.getHex();
      if((p.height??9)<=1.2&&(((p.width??0)>1&&(p.depth??0)>1)||(p.radiusTop??0)>3)) {
        const bounds=new T.Box3().setFromObject(o);if(bounds.max.y<2.5)this.floors.push(bounds);
      }
      if ((p.width ?? 0) > 25 && (p.height ?? 9) <= 1.2) o.material = storybookMaterial('grass', color);
      else if ((p.width ?? 0) > 3 && (p.depth ?? 0) > 1 && (p.height ?? 9) < .2) o.material = storybookMaterial(indoor ? 'wood' : 'stone', color);
      // Restrict water recognition to existing large blue horizontal surfaces, not puzzles or signs.
      if ([0x59b9bf,0x8dcfc6,0xa0ded4,0x7ccada,0x7bc9dc,0x8ed4df,0x86cbd9,0x83c5d5,0x83cbd8,0x80c5db,0x79c8dc,0x75c3d5,0x89d1d9,0x88c9de,0x73c4db,0x80c9dc].includes(color) && ((p.width ?? 0) > 2 || (p.radiusTop ?? 0) > .5)) {
        o.material = storybookMaterial('water', color);
        const bounds = new T.Box3().setFromObject(o), at = bounds.getCenter(new T.Vector3()), size = bounds.getSize(new T.Vector3());
        this.waterSpots.push({x:at.x,y:bounds.max.y+.025,z:at.z,radius:Math.max(.05,Math.min(1.4,Math.min(size.x,size.z)*.25))});
      }
    });
    const root = this.root = new T.Group(); root.userData.storybookRuntime = true; scene.add(root);
    root.add(this.contact, this.petContact);
    if (!indoor) {
      // A single instanced draw for the meadow fringe; all entrances and paths remain clear.
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute([-.1,0,0,.06,0,0,.02,.42,.03, 0,0,-.08,0,0,.08,-.05,.3,0],3)); geo.computeVertexNormals();
      const material = leafMaterial(forestColor);
      const plants = this.plants = new T.InstancedMesh(geo, material, 180); plants.castShadow = false;
      const tint = new T.Color();
      for(let i=0;i<180;i++) {
        const side=i%2?-1:1, lane=forest?4.5:market?20:22;
        const noise=(Math.sin(i*127.1)*43758.5453)%1;
        const x=side*(lane+Math.abs(noise)*(forest?12:2)), z=-17+((i*1.618)%34);
        if(forest&&[14,0,-15].some(cross=>Math.abs(z-cross)<2)) {this.dummy.position.set(x,.09,z+2.2);}else this.dummy.position.set(x,.09,z);
        this.dummy.rotation.set(0,i*2.399,0);this.dummy.scale.setScalar(.65+(i%5)*.16);this.dummy.updateMatrix();plants.setMatrixAt(i,this.dummy.matrix);
        tint.setHex(i%5===0?0xb6c87a:0xffffff);plants.setColorAt(i,tint);
      }
      root.add(plants);
    }
    if(this.waterSpots.length) {
      const geo = new T.RingGeometry(.93,1,32); geo.rotateX(-Math.PI/2);
      const material = new T.MeshBasicMaterial({color:0xe1f6ed,transparent:true,opacity:.25,depthWrite:false});
      material.userData.storybookOwned=true;
      this.water = new T.InstancedMesh(geo,material,Math.min(12,this.waterSpots.length*3));this.water.frustumCulled=false;root.add(this.water);
    }
  }
  quality(low: boolean) {
    if(this.plants)this.plants.count=low?60:180;if(this.water)this.water.visible=!low&&!this.reduced;
    // Large tablet screens spend most of their software-rendering budget on textured ground.
    // Retain the palette and model detail, using a shared untextured variant in light mode.
    this.scene?.traverse(o=>{if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial))return;
      const source=(o.material.userData.storybookSource as T.MeshStandardMaterial|undefined)??o.material;
      if(!source.userData.sharedStorybookAsset||!source.map)return;
      if(low){let flat=flatSurfaces.get(source.uuid);if(!flat){flat=source.clone();flat.map=null;flat.userData={sharedStorybookAsset:true,storybookSource:source};flatSurfaces.set(source.uuid,flat);}o.material=flat;}else o.material=source;
    });
  }
  update(time: number, player: T.Vector3, pet: T.Vector3 | null, floor: number) {
    windTime.value=time;windStrength.value=this.reduced?0:1;
    const top=(p:T.Vector3)=>{let y=floor;for(const b of this.floors)if(p.x>=b.min.x&&p.x<=b.max.x&&p.z>=b.min.z&&p.z<=b.max.z&&b.max.y<=floor+.3)y=Math.max(y,b.max.y);return y+.025;};
    this.contact.position.set(player.x,top(player),player.z);
    const factor=Math.max(.55,1-(player.y-floor)*.1);this.contact.scale.set(.72*factor,.6*factor,1);
    this.petContact.visible=!!pet;if(pet)this.petContact.position.set(pet.x,top(pet),pet.z);
    if(!this.water||!this.water.visible)return;
    for(let i=0;i<this.water.count;i++) {const p=this.waterSpots[Math.floor(i/3)],phase=(time*.17+i/3)%1,r=p.radius*(.18+phase*.8);this.dummy.position.set(p.x,p.y,p.z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(r,1,r);this.dummy.updateMatrix();this.water.setMatrixAt(i,this.dummy.matrix);}
    this.water.instanceMatrix.needsUpdate=true;
  }
  dispose(scene:T.Scene) { this.clear(scene); }
}
