import * as T from 'three';
import type {TitleDefinition} from './titles';

export type TitleAura = {root:T.Group;update(time:number,moving?:boolean):void;dispose():void};
type Theme = 'leaf'|'constellation'|'prism'|'spirit'|'crown'|'pet'|'study'|'compass'|'aurora';
type Point = readonly [number,number,number];
const TAU=Math.PI*2;
const NO_RAYCAST: T.Object3D['raycast']=()=>{};

/** Small, original triangle sculptures; vertex colors keep each sculpture in one draw. */
class Sculpture {
  private positions:number[]=[];
  private colors:number[]=[];
  triangle(a:Point,b:Point,c:Point,color:T.ColorRepresentation){
    const tint=new T.Color(color);
    for(const p of [a,b,c]){this.positions.push(...p);this.colors.push(tint.r,tint.g,tint.b);}
  }
  polygon(points:Point[],color:T.ColorRepresentation){
    for(let i=1;i<points.length-1;i++)this.triangle(points[0],points[i],points[i+1],color);
  }
  band(radius:number,width:number,y:number,color:T.ColorRepresentation,start=0,end=TAU){
    const steps=Math.max(2,Math.ceil((end-start)*12));
    for(let i=0;i<steps;i++){
      const a=start+(end-start)*i/steps,b=start+(end-start)*(i+1)/steps;
      const p:Point=[Math.cos(a)*radius,y,Math.sin(a)*radius];
      const q:Point=[Math.cos(b)*radius,y,Math.sin(b)*radius];
      const r:Point=[Math.cos(b)*(radius-width),y,Math.sin(b)*(radius-width)];
      const s:Point=[Math.cos(a)*(radius-width),y,Math.sin(a)*(radius-width)];
      this.triangle(p,q,r,color);this.triangle(p,r,s,color);
    }
  }
  stroke(a:Point,b:Point,width:number,color:T.ColorRepresentation){
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    const x=-dy/length*width/2,y=dx/length*width/2;
    this.polygon([[a[0]+x,a[1]+y,a[2]],[b[0]+x,b[1]+y,b[2]],[b[0]-x,b[1]-y,b[2]],[a[0]-x,a[1]-y,a[2]]],color);
  }
  star(x:number,y:number,z:number,r:number,color:T.ColorRepresentation,points=4){
    const vertices:Point[]=[];
    for(let i=0;i<points*2;i++){const a=i*Math.PI/points+Math.PI/2,d=i%2?r*.32:r;vertices.push([x+Math.cos(a)*d,y+Math.sin(a)*d,z]);}
    for(let i=0;i<vertices.length;i++)this.triangle([x,y,z],vertices[i],vertices[(i+1)%vertices.length],color);
  }
  leaf(x:number,y:number,z:number,size:number,angle:number,color:T.ColorRepresentation){
    const c=Math.cos(angle),s=Math.sin(angle);
    const p=(u:number,v:number):Point=>[x+(u*c-v*s)*size,y+(u*s+v*c)*size,z];
    this.polygon([p(0,-1),p(-.48,-.15),p(-.32,.56),p(0,1),p(.48,.15),p(.32,-.56)],color);
    this.stroke(p(0,-.72),p(0,.72),.012,0xeaffd8);
  }
  book(x:number,y:number,z:number,size:number){
    this.polygon([[x,y,z],[x-size,y+.1,z],[x-size,y+size*.8,z],[x,y+size*.62,z]],0x9de7ff);
    this.polygon([[x,y,z],[x+size,y+.1,z],[x+size,y+size*.8,z],[x,y+size*.62,z]],0xf0f8ff);
    this.stroke([x,y,z-.005],[x,y+size*.62,z-.005],.018,0x5375db);
    for(const side of [-1,1])for(let i=0;i<2;i++)this.stroke([x+side*size*.2,y+size*(.25+i*.2),z+.008],[x+side*size*.78,y+size*(.33+i*.2),z+.008],.012,0x688edc);
  }
  geometry(){
    const result=new T.BufferGeometry();
    result.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
    result.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
    result.computeBoundingSphere();
    return result;
  }
}

function themeFor(t:TitleDefinition):Theme{
  if(t.id==='math-friend')return 'aurora';
  if(t.id==='level-1000'||t.id==='level-2000'||t.id==='rich-100m')return 'crown';
  if(t.style==='wealth')return 'compass';
  if(t.id==='level-500')return 'spirit';
  if(t.id==='level-300')return 'prism';
  if(t.id==='level-100')return 'constellation';
  if(t.style==='pet')return 'pet';
  if(t.style==='explorer')return 'compass';
  if(t.style==='study')return 'study';
  return 'leaf';
}
const PALETTES:Record<Theme,readonly [number,number,number]>={
  leaf:[0x43dfa6,0xc9ff9a,0x85f5cf],constellation:[0xb598ff,0xffdc80,0xe3d3ff],
  prism:[0x8deaff,0xffa9ef,0xd8c0ff],spirit:[0x80f4ee,0xc4eaff,0x9caeff],
  crown:[0xffd46a,0xfff2b6,0xf6a8cb],pet:[0xffb497,0xffe1bf,0xff9eca],
  study:[0x93b9ff,0xd0f2ff,0xc7b3ff],compass:[0xf3cf78,0xc5ffbb,0xffedbe],
  aurora:[0x92f3d6,0xc5b2ff,0xffd2ed],
};

/** Feet-relative cosmetic only. Four draw meshes at most, exactly six animated motes.
 * Caller owns visibility/distance/reduced-motion policy and must dispose before detaching.
 * No textures, lights, timers, shared GPU resources, or per-frame object allocations.
 */
export function createTitleAura(t:TitleDefinition):TitleAura{
  const theme=themeFor(t),palette=PALETTES[theme];
  const root=new T.Group();root.name='title-aura:'+t.id;
  root.userData.titleAura=true;
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
  const makeMesh=(sculpture:Sculpture,opacity:number)=>{
    const geometry=sculpture.geometry();geometries.add(geometry);
    const material=new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity,side:T.DoubleSide,depthWrite:false,toneMapped:false,forceSinglePass:true});materials.add(material);
    const mesh=new T.Mesh(geometry,material);mesh.raycast=NO_RAYCAST;root.add(mesh);return mesh;
  };
  const floor=new Sculpture(),figure=new Sculpture(),halo=new Sculpture();
  floor.band(.9,.026,.045,palette[0]);
  for(let i=0;i<6;i++)floor.band(1.02,.016,.05,palette[1],i*TAU/6+.1,i*TAU/6+.56);
  let hasHalo=false;
  if(theme==='leaf'){
    // A rising wreath leaves the face and front of the body open.
    for(const side of [-1,1])for(let i=0;i<6;i++){
      const a=.25+i*.23;figure.leaf(side*(.67+.25*Math.sin(a)),.3+i*.18,.14,.13,side*(-.8+i*.14),palette[i%3]);
    }
    figure.star(0,.18,.5,.11,palette[1]);
  }else if(theme==='constellation'){
    const points:Point[]=[[-.96,1.1,.08],[-.78,1.76,.08],[-.4,2.1,.08],[.17,2.24,.08],[.69,1.94,.08],[.98,1.31,.08]];
    for(let i=0;i<points.length;i++){
      const p=points[i];figure.star(...p,i===3?.13:.09,palette[i%2],5);
      if(i)figure.stroke(points[i-1],p,.013,palette[0]);
    }
    floor.band(.72,.014,.052,palette[0]);
  }else if(theme==='prism'){
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(.5+i*.17),y=1.15+i*.15;
      figure.polygon([[side*.38,1.05,.16],[x,y+.52,.12],[side*(.87+i*.1),y+.29,.1],[side*.52,.94,.16]],palette[i]);
      figure.stroke([x,y+.48,.09],[side*.48,1.04,.13],.012,0xffffff);
    }
    halo.band(.48,.055,2.25,palette[1]);halo.band(.56,.016,2.25,palette[0]);hasHalo=true;
  }else if(theme==='spirit'){
    // Crescent is a strip, rather than an opaque disc over the player's face.
    for(let i=0;i<28;i++){
      const a=-1.15+i*4.6/28,b=-1.15+(i+1)*4.6/28;
      const p=(v:number,r:number):Point=>[.75+Math.cos(v)*r,1.9+Math.sin(v)*r,.08];
      const w=.055*Math.sin((i+.5)*Math.PI/28);
      figure.polygon([p(a,.28),p(b,.28),p(b,.28-w),p(a,.28-w)],palette[1]);
    }
    for(const side of [-1,1])for(let i=0;i<2;i++)figure.leaf(side*(.72+i*.15),.72+i*.32,.12,.18,side*.35,palette[i]);
    halo.band(.71,.025,.16,palette[0]);halo.band(.58,.012,.23,palette[1]);hasHalo=true;
  }else if(theme==='crown'){
    // A real circular five-point crown reads from every camera angle.
    figure.band(.38,.065,2.15,palette[0]);figure.band(.4,.018,2.11,palette[1]);
    for(let i=0;i<5;i++){
      const a=i*TAU/5,b=(i+1)*TAU/5,m=(a+b)/2;
      figure.triangle([Math.cos(a)*.38,2.15,Math.sin(a)*.38],[Math.cos(m)*.42,2.48,Math.sin(m)*.42],[Math.cos(b)*.38,2.15,Math.sin(b)*.38],palette[i%2]);
      figure.star(Math.cos(m)*.42,2.45,Math.sin(m)*.42,.055,palette[2]);
    }
    halo.band(.71,.026,.12,palette[1]);halo.band(.76,.012,.12,palette[0]);hasHalo=true;
  }else if(theme==='pet'){
    for(const side of [-1,1]){
      figure.leaf(side*.8,.68,.12,.19,side*.65,palette[0]);
      // Paw pads and four little toes, combined into the one sculpture.
      figure.star(side*.8,.94,.12,.105,palette[1],5);
      for(let i=0;i<4;i++)figure.star(side*.8+(i-1.5)*.065,1.09-Math.abs(i-1.5)*.022,.12,.032,palette[2],5);
    }
    floor.band(.74,.025,.055,palette[2]);
  }else if(theme==='study'){
    for(const side of [-1,1])figure.book(side*.77,1.03,.1,.24);
    const grade=t.grade??3;
    for(let i=0;i<6;i++){
      const a=i*TAU/6,x=Math.cos(a)*.76,z=Math.sin(a)*.76;
      floor.triangle([x-.04,.055,z],[x,.055,z+.07],[x+.04,.055,z],palette[(i+grade)%3]);
      figure.star(Math.cos(a)*.96,.55+(i%3)*.25,.1,.055,palette[(i+grade)%3]);
    }
  }else if(theme==='compass'){
    floor.band(.68,.023,.055,palette[1]);
    for(let i=0;i<8;i++){
      const a=i*TAU/8,r=i%2?.78:.91;
      floor.triangle([Math.cos(a)*r,.06,Math.sin(a)*r],[Math.cos(a+.11)*.4,.06,Math.sin(a+.11)*.4],[Math.cos(a-.11)*.4,.06,Math.sin(a-.11)*.4],palette[i%2]);
    }
    for(const side of [-1,1]){
      figure.star(side*.85,1.15,.1,.15,palette[0]);
      figure.leaf(side*.9,.75,.1,.13,side*.5,palette[1]);
    }
  }else{
    // Three airy, open aurora ribbons, never a solid curtain around the body.
    for(let ribbon=0;ribbon<3;ribbon++)for(let i=0;i<40;i++){
      const p=(step:number,edge:number):Point=>{
        const a=step/40*TAU,r=.86+.11*Math.sin(a*2+ribbon);
        return [Math.cos(a)*r,.35+ribbon*.23+(Math.sin(a*2+ribbon)+1)*.42+edge,Math.sin(a)*r];
      };
      figure.polygon([p(i,0),p(i+1,0),p(i+1,.045),p(i,.045)],palette[ribbon]);
    }
    halo.book(0,2.02,.1,.2);halo.star(-.36,2.22,.1,.07,palette[0]);halo.star(.36,2.22,.1,.07,palette[2]);hasHalo=true;
  }
  const seal=makeMesh(floor,.38),sculpture=makeMesh(figure,theme==='crown'?.8:.66);
  const floating=hasHalo?makeMesh(halo,.64):null;
  seal.name='aura-floor-seal';sculpture.name='aura-'+theme;
  const moteShape=new Sculpture();
  if(theme==='leaf'||theme==='pet')moteShape.leaf(0,0,0,1,0,0xffffff);
  else moteShape.star(0,0,0,1,0xffffff,theme==='constellation'?5:4);
  // A crossed star/petal makes the six motes visible from oblique views too.
  const moteGeometry=moteShape.geometry();
  const back=moteGeometry.clone();back.rotateY(Math.PI/2);
  const a=moteGeometry.getAttribute('position'),b=back.getAttribute('position');
  const positions=new Float32Array(a.array.length+b.array.length);positions.set(a.array);positions.set(b.array,a.array.length);
  const colors=new Float32Array(positions.length);colors.fill(1);
  moteGeometry.setAttribute('position',new T.BufferAttribute(positions,3));moteGeometry.setAttribute('color',new T.BufferAttribute(colors,3));moteGeometry.computeBoundingSphere();back.dispose();
  geometries.add(moteGeometry);
  const moteMaterial=new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.86,side:T.DoubleSide,depthWrite:false,toneMapped:false,forceSinglePass:true});materials.add(moteMaterial);
  const motes=new T.InstancedMesh(moteGeometry,moteMaterial,6);motes.name='aura-six-motes';motes.instanceMatrix.setUsage(T.DynamicDrawUsage);motes.frustumCulled=false;motes.raycast=NO_RAYCAST;
  const color=new T.Color();for(let i=0;i<6;i++)motes.setColorAt(i,color.setHex(palette[i%3]));
  root.add(motes);
  const pose=new T.Object3D();
  let disposed=false;
  const update=(time:number,moving=false)=>{
    if(disposed)return;
    // Modulo prevents large elapsed clocks from losing animation precision.
    const clock=Number.isFinite(time)?time%3600:0,drift=moving?.72:1;
    seal.rotation.y=clock*.09;
    sculpture.position.y=Math.sin(clock*1.2)*.025;
    if(floating){floating.position.y=Math.sin(clock*1.4+.6)*.035;floating.rotation.y=theme==='aurora'?0:Math.sin(clock*.45)*.12;}
    for(let i=0;i<6;i++){
      const phase=i*TAU/6,a=phase+clock*(theme==='spirit'?.42:.24),radius=.83+.12*Math.sin(clock*.8+phase);
      pose.position.set(Math.cos(a)*radius,.38+(i%3)*.48+Math.sin(clock*1.5+phase)*.14*drift,Math.sin(a)*radius);
      pose.rotation.set(Math.sin(a)*.35,-a,Math.sin(clock+phase)*.3);
      const size=(theme==='spirit'?.075:.065)*(1+.13*Math.sin(clock*2+phase));
      pose.scale.set(size,theme==='spirit'?size*1.65:size,size);pose.updateMatrix();motes.setMatrixAt(i,pose.matrix);
    }
    motes.instanceMatrix.needsUpdate=true;
  };
  update(0);
  return {root,update,dispose(){
    if(disposed)return;disposed=true;
    root.removeFromParent();root.clear();motes.dispose();
    for(const geometry of geometries)geometry.dispose();
    for(const material of materials)material.dispose();
    geometries.clear();materials.clear();
  }};
}

