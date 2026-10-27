import * as T from 'three';
import { storybookMaterial } from './storybook-art';

/** Shared architectural language. Pure scenery: no rewards, storage or interactions. */
export const VILLAGE_ART = { grass:0xc6d99c, earth:0x9bb778, cream:0xf4e6c8, edge:0xd3bb94, wood:0x997151, mint:0x659d91, trim:0xfff4d9, leaf:0x76a866, berry:0xe36685 };
const mats=new Map<number,T.MeshStandardMaterial>();
function piece(g:T.Object3D,c:number,geo:T.BufferGeometry,x:number,y:number,z:number){
 if(!mats.has(c))mats.set(c,c===VILLAGE_ART.wood?storybookMaterial('wood',c):new T.MeshStandardMaterial({color:c,roughness:.92,flatShading:true}));
 const m=new T.Mesh(geo,mats.get(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
const block=(g:T.Object3D,c:number,x:number,y:number,z:number,w:number,h:number,d:number)=>piece(g,c,new T.BoxGeometry(w,h,d),x,y,z);
const orb=(g:T.Object3D,c:number,x:number,y:number,z:number,r:number,sy=1)=>{const m=piece(g,c,new T.IcosahedronGeometry(r,1),x,y,z);m.scale.y=sy;return m;};
const post=(g:T.Object3D,c:number,x:number,y:number,z:number,r:number,h:number)=>piece(g,c,new T.CylinderGeometry(r,r,h,10),x,y,z);
// Repeated little stones share one draw call, even on the longer market lanes.
function stoneDetails(g:T.Object3D,c:number,positions:{x:number;y:number;z:number;scaleX:number;scaleZ:number;angle:number}[]){
 if(!positions.length)return;
 if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.96,flatShading:true}));
 const stones=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),mats.get(c),positions.length),at=new T.Object3D();
 positions.forEach((p,i)=>{at.position.set(p.x,p.y,p.z);at.rotation.set(0,p.angle,0);at.scale.set(p.scaleX,.075,p.scaleZ);at.updateMatrix();stones.setMatrixAt(i,at.matrix);});
 stones.instanceMatrix.needsUpdate=true;stones.receiveShadow=true;g.add(stones);
}
export const PLAZA_BERRY_TREES=[{x:-5.7,z:-5.5,scale:.9},{x:-2.8,z:-6.7,scale:1.08},{x:5.7,z:-7.2,scale:.86},{x:-9.2,z:-1.9,scale:.85},{x:-10.6,z:-4.2,scale:1},{x:8.9,z:-5.7,scale:1},{x:10.4,z:-3.4,scale:.86}] as const;
export function berryTreeModel(variant=0){
 const g=new T.Group(),a=VILLAGE_ART;
 post(g,a.wood,0,1.15,0,.23,2.3);
 for(const side of [-1,1]){const b=post(g,a.wood,side*.35,1.9,0,.12,1.15);b.rotation.z=-side*.55;}
 const shape=((variant%3)+3)%3,lean=shape===1?.15:shape===2?-.13:0;
 for(const [i,[x,y,z,r]]of [[0,2.7,0,1.25],[-.72,2.4,.1,.83],[.72,2.5,.16,.87],[-.2,3.5,-.1,.85],[.6,3.25,.1,.68]].entries()){
  const crown=orb(g,i%2?0x6f9e61:a.leaf,x+lean*(y-2),y,z,r,shape===1?1.12:shape===2?.9:1);crown.rotation.y=i*.7;
 }
 orb(g,0x97bd76,-.45+lean,3.65,.25,.65);orb(g,0xb1cd83,.65,3.1,.65,.57);
 for(let i=0;i<7;i++){const angle=i*2.4,x=Math.cos(angle)*.98,z=Math.sin(angle)*.95,y=2.25+(i%3)*.42;for(const side of [-1,1])orb(g,side<0?a.berry:0xd54d73,x+side*.1,y,z,.18,1.15);const leaf=orb(g,0x447e57,x,y+.22,z,.15,.35);leaf.rotation.z=.4;}
 return g;
}
export function flowerBed(g:T.Object3D,x:number,z:number,length=2.4,rotation=0){
 const bed=new T.Group();bed.position.set(x,0,z);bed.rotation.y=rotation;g.add(bed);
 block(bed,0xb6c68c,0,.07,0,length+.35,.14,1.15);
 for(let i=0;i<Math.ceil(length/.55);i++){const px=-length/2+.28+i*.55;orb(bed,0x8eae6b,px,.28,0,.35,.7);const y=.45+(i%2)*.12;for(let k=0;k<5;k++){const angle=k*Math.PI*2/5;orb(bed,i%3===0?0xf0b5bd:0xfff4d9,px+Math.cos(angle)*.14,y,.08+Math.sin(angle)*.14,.1,.65);}orb(bed,0xe9bc69,px,y+.025,.08,.065);}
 for(const side of [-1,1])block(bed,VILLAGE_ART.edge,0,.12,side*.56,length+.5,.23,.12);
}
export function gardenBench(g:T.Object3D,x:number,z:number,rotation=0){
 const b=new T.Group();b.position.set(x,0,z);b.rotation.y=rotation;g.add(b);
 for(const px of [-1,1])for(const pz of [-.3,.3])block(b,0x667d6a,px,.33,pz,.12,.65,.12);
 for(let i=0;i<3;i++)block(b,VILLAGE_ART.wood,0,.67,-.28+i*.28,2.65,.12,.24);
 for(let i=0;i<2;i++)block(b,0xb68b61,0,1+i*.25,-.45,2.65,.18,.12);
 for(const side of [-1,1])block(b,0x667d6a,side*1.18,.88,0,.12,.14,.85);
}
export function gardenLamp(g:T.Object3D,x:number,z:number){
 const a=VILLAGE_ART;post(g,a.edge,x,.16,z,.32,.32);post(g,a.wood,x,1.25,z,.09,2.5);
 block(g,0xffe7ac,x,2.55,z,.42,.6,.42);for(const side of [-1,1])block(g,a.wood,x+side*.23,2.55,z,.06,.68,.48);
 const cap=piece(g,new T.Color(a.mint).getHex(),new T.ConeGeometry(.45,.3,4),x,3,z);cap.rotation.y=Math.PI/4;
}
export function stoneLane(g:T.Object3D,x:number,z:number,width:number,length:number){
 const a=VILLAGE_ART;block(g,a.edge,x,.035,z,width+.24,.07,length+.24);block(g,a.cream,x,.08,z,width,.08,length);
 // Broad paving stones rather than dense geometric noise.
 for(let row=0;row<Math.floor(length/1.4);row++)for(let col=0;col<Math.floor(width/1.45);col++){
  const px=x-width/2+.73+col*1.45,pz=z-length/2+.7+row*1.4;
  block(g,(row+col)%3===0?0xefdfbf:0xf8ecd5,px,.127,pz,1.35,.015,1.28);
 }
 const edging:{x:number;y:number;z:number;scaleX:number;scaleZ:number;angle:number}[]=[];
 // Small irregular shoulders soften the straight strip without covering its walking surface.
 for(const side of [-1,1])for(let i=0;i<Math.min(12,Math.ceil(length/1.8));i++){
  const t=(i+.5)/Math.min(12,Math.ceil(length/1.8));
  edging.push({x:x+side*(width/2+.1+(i%3)*.025),y:.105,z:z-length/2+t*length,scaleX:.16+(i%2)*.035,scaleZ:.25+(i%3)*.07,angle:i*.77});
 }
 stoneDetails(g,0xc5b99a,edging);
}
export function plazaGarden(){
 const g=new T.Group(),a=VILLAGE_ART;
 const disc=piece(g,a.edge,new T.CylinderGeometry(7.8,7.8,.12,64),0,.06,2);
 disc.receiveShadow=true;piece(g,a.cream,new T.CylinderGeometry(7.55,7.55,.09,64),0,.16,2);
 for(let i=0;i<40;i++){const angle=i*Math.PI/20;const stone=block(g,i%2?a.trim:a.edge,Math.cos(angle)*7.6,.23,2+Math.sin(angle)*7.6,.78,.12,.3);stone.rotation.y=-angle+Math.PI/2;}
 // Inset arcs provide paving detail without obscuring navigation.
 for(const r of [3.4,5.5]){const ring=piece(g,0xe3d0ab,new T.TorusGeometry(r,.025,4,64),0,.215,2);ring.rotation.x=Math.PI/2;ring.castShadow=false;}
 for(const [x,z,angle]of [[-8,-1,.15],[7.4,-2,-.2]]){gardenBench(g,x,z,angle);flowerBed(g,x,z-1.15,3);}
 for(const [x,z]of [[-6,8],[6,8],[-10,-7],[10,-8]])gardenLamp(g,x,z);
 for(const [x,z,len,angle]of [[-5,-8.5,3.6,0],[5,-8.5,3.6,0],[-13,6,3.2,0],[12,2,3.2,0],[-5,12,2.4,0],[5,12,2.4,0]])flowerBed(g,x,z,len,angle);
 return g;
}
/** 광장의 연꽃 호수(장식 전용). 가운데가 (0,0)이고, 물 판정과 같은 둥근 사각형 모양이에요. */
export function lotusLake(halfX:number,halfZ:number,corner:number){
 const g=new T.Group();
 const shape=(hx:number,hz:number,r:number)=>{const s=new T.Shape();s.moveTo(-hx+r,-hz);s.lineTo(hx-r,-hz);s.quadraticCurveTo(hx,-hz,hx,-hz+r);s.lineTo(hx,hz-r);s.quadraticCurveTo(hx,hz,hx-r,hz);s.lineTo(-hx+r,hz);s.quadraticCurveTo(-hx,hz,-hx,hz-r);s.lineTo(-hx,-hz+r);s.quadraticCurveTo(-hx,-hz,-hx+r,-hz);return s;};
 const flat=(hx:number,hz:number,r:number,c:number,y:number)=>{const m=piece(g,c,new T.ShapeGeometry(shape(hx,hz,Math.max(.2,r)),12),0,y,0);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;};
 flat(halfX+.65,halfZ+.65,corner+.65,0xe9d8aa,.035); // 모래 둑
 flat(halfX+.2,halfZ+.2,corner+.2,0x9fc98b,.05); // 물가 풀
 flat(halfX,halfZ,corner,0x86d3d0,.075); // 얕은 물
 flat(halfX-1.1,halfZ-1.1,corner-1,0x5fb5c4,.085); // 깊은 물
 flat(halfX-2.2,halfZ-2.4,corner-1.4,0x4fa3b8,.09);
 // 물가 돌: 둘레를 따라 고르게
 const edge:{x:number;y:number;z:number;scaleX:number;scaleZ:number;angle:number}[]=[];
 for(let i=0;i<46;i++){const a=i/46*Math.PI*2,cx=Math.cos(a),cz=Math.sin(a),k=1/Math.max(Math.abs(cx)/(halfX+.35),Math.abs(cz)/(halfZ+.35));edge.push({x:cx*k,y:.1,z:cz*k,scaleX:.22+(i%3)*.06,scaleZ:.3+(i%4)*.05,angle:i*1.3});}
 stoneDetails(g,0xcfc3a3,edge);
 // 물결
 for(const [x,z,r]of [[-1,-2,.55],[1.2,1.8,.4],[-.6,3.1,.32]]){const ring=piece(g,0xd9f3ef,new T.TorusGeometry(r,.025,4,28),x,.1,z);ring.rotation.x=Math.PI/2;ring.castShadow=false;}
 // 연잎과 연꽃
 const pads=[[-1.9,-3.4,.55],[1.6,-2.6,.48],[-.4,-1,.42],[2,.4,.6],[-2,1.6,.5],[.7,2.9,.46],[-1.2,3.9,.4],[1.9,3.8,.52],[.2,-3.9,.38]];
 pads.forEach(([x,z,r],i)=>{const pad=piece(g,i%2?0x5c9d57:0x74b268,new T.CircleGeometry(r,18,.25,Math.PI*2-.5),x,.11,z);pad.rotation.x=-Math.PI/2;pad.rotation.z=i*1.7;pad.castShadow=false;
  if(i%2===0){const s=i%4===0?1.35:1.1;for(let k=0;k<8;k++){const a=k/8*Math.PI*2,petal=orb(g,k%2?0xf7b6cc:0xf08fb0,x+Math.cos(a)*.2*s,.27,z+Math.sin(a)*.2*s,.15*s,1.6);petal.rotation.z=Math.cos(a)*.65;petal.rotation.x=Math.sin(a)*.65;}for(let k=0;k<5;k++){const a=k/5*Math.PI*2+.3;orb(g,0xffe3ec,x+Math.cos(a)*.09*s,.38,z+Math.sin(a)*.09*s,.09*s,1.5);}orb(g,0xffd966,x,.45,z,.07*s);}});
 // 갈대
 for(const [x,z]of [[halfX-.35,halfZ-.6],[halfX-.75,halfZ-.25],[-halfX+.4,-halfZ+.55],[-halfX+.8,-halfZ+.3],[halfX-.3,-halfZ+.9]]){const h=.9+((x*7+z*3)%3+3)%3*.18;post(g,0x7a9b52,x,h/2+.05,z,.03,h);orb(g,0x7a5236,x,h+.08,z,.07,2.2);const leaf=post(g,0x8db361,x+.08,.4,z,.025,.7);leaf.rotation.z=.35;}
 // 작은 나무 선착장(광장 쪽)
 for(let i=0;i<4;i++)block(g,VILLAGE_ART.wood,-halfX+.55,.2,-.9+i*.6,1.5,.08,.5);
 for(const z of [-1.1,1.1])for(const x of [-halfX+.05,-halfX+1.15])post(g,0x7c5a3e,x,.12,z,.07,.4);
 return g;
}
export function fountainModel(){
 const g=new T.Group(),a=VILLAGE_ART;
 piece(g,a.edge,new T.CylinderGeometry(1.9,2,.25,16),0,.2,0);
 piece(g,a.trim,new T.CylinderGeometry(1.75,1.85,.48,16),0,.5,0);
 piece(g,0x8dcfc6,new T.CylinderGeometry(1.53,1.53,.05,32),0,.76,0);
 post(g,a.edge,0,1.05,0,.25,.7);piece(g,a.trim,new T.CylinderGeometry(.8,.63,.2,16),0,1.35,0);
 piece(g,0xa0ded4,new T.CylinderGeometry(.65,.65,.05,24),0,1.46,0);
 post(g,0xb8e6dd,0,1.7,0,.09,.5);orb(g,0xd4f1e5,0,1.98,0,.19,1.5);
 for(let i=0;i<8;i++){const angle=i*Math.PI/4;const water=post(g,0xb8e6dd,Math.cos(angle)*.57,1.09,Math.sin(angle)*.57,.027,.55);water.rotation.z=Math.cos(angle)*.35;}
 return g;
}
export function cottageModel(roof=VILLAGE_ART.mint,wall=0xf4e3bf,school=false){
 const g=new T.Group(),a=VILLAGE_ART,w=school?7:4.8,d=school?4.6:4.1,h=school?3.6:3;
 const roofEdge=new T.Color(roof).lerp(new T.Color(a.trim),.2).getHex(),ridge=new T.Color(roof).multiplyScalar(.78).getHex();
 block(g,a.edge,0,.2,0,w+.6,.4,d+.5);block(g,wall,0,h/2+.4,0,w,h,d);
 block(g,a.trim,0,.62,0,w+.12,.3,d+.12);
 for(const side of [-1,1]){block(g,a.trim,side*(w/2-.16),h/2+.45,d/2+.06,.23,h,.16);const roofHalf=block(g,roof,0,h+.95,side*(d/4+.15),w+.85,.2,d/2+.65);roofHalf.rotation.x=side*.43;}
 block(g,ridge,0,h+1.46,0,w+.9,.18,.18);
 for(let row=0;row<4;row++)for(const side of [-1,1]){const pz=side*(.2+row*.6),py=h+1.4-row*.25;block(g,roofEdge,0,py,pz,w+.7,.045,.07);}
 const front=d/2;
 // Dark reveals, pale lintels and paired shutters keep the windows readable at village scale.
 for(const side of [-1,1]){
  const x=side*(school?2.25:1.5);
  for(const shutter of [-1,1]){block(g,roof,x+shutter*.7,2,front+.14,.22,1.25,.12);block(g,a.trim,x+shutter*.7,1.82,front+.22,.23,.055,.03);}
  block(g,a.trim,x,2.75,front+.18,1.48,.14,.28);
 }
 for(const side of [-1,1]){
  block(g,a.wood,side*(w/2+.12),h+.48,0,.16,.2,d+.55);
  block(g,a.wood,side*(w/2-.18),1.65,-d/2-.035,.15,2.6,.12);
 }
 const courses=[];
 for(let i=0;i<Math.floor(w/.72);i++)courses.push({x:-w/2+.36+i*.72,y:.23,z:front+.26,scaleX:.31,scaleZ:.15,angle:(i%2)*.13});
 stoneDetails(g,0xb9a487,courses);
 block(g,a.wood,0,1.45,front+.1,1.22,2.15,.18);block(g,0xb1d4c5,0,1.65,front+.21,.84,1.25,.045);post(g,0xe7c078,.34,1.25,front+.27,.065,.13);
 for(const px of [-.38,0,.38])block(g,0xb78a61,px,.77,front+.215,.28,.55,.035);
 block(g,a.trim,0,2.57,front+.16,1.5,.16,.26);
 for(let i=0;i<3;i++)block(g,i%2?a.trim:a.edge,0,.12+i*.12,front+.9-i*.22,2.05,.24,.95);
 for(const side of [-1,1]){const x=side*(school?2.25:1.5);block(g,a.wood,x,2,front+.08,1.18,1.4,.18);block(g,0xb7d8cf,x,2,front+.19,.92,1.1,.05);block(g,a.trim,x,2,front+.23,.07,1.12,.04);block(g,a.trim,x,2,front+.23,.95,.07,.04);block(g,a.wood,x,1.25,front+.3,1.4,.22,.5);flowerBed(g,x,front+.6,1.2);}
 if(school){
  block(g,wall,0,h+1.45,-.5,1.65,2.1,1.65);const cap=piece(g,roof,new T.ConeGeometry(1.5,1.2,4),0,h+3,-.5);cap.rotation.y=Math.PI/4;
  block(g,a.wood,0,h+1.65,.36,.72,1,.1);orb(g,0xf0c879,0,h+1.65,.45,.27,1.25);
  // A large leaf crest over the entrance, entirely modeled and locally rendered.
  const crest=piece(g,a.trim,new T.CylinderGeometry(.66,.66,.12,20),0,h+.1,front+.15);crest.rotation.x=Math.PI/2;
  const leaf=orb(g,0x74a073,0,h+.13,front+.25,.32,.5);leaf.rotation.z=-.5;
 }else{block(g,a.edge,1.3,h+1.4,-.9,.6,1.8,.65);block(g,a.trim,1.3,h+2.3,-.9,.8,.16,.8);}
 return g;
}
export function districtBorder(g:T.Object3D,width:number,depth:number,offsetZ=0){
 const a=VILLAGE_ART;
 for(let x=-width/2+1;x<width/2;x+=3){for(const z of [-depth/2,depth/2]){if(z>0&&Math.abs(x)<4)continue;const at=z+offsetZ;post(g,a.trim,x,.65,at,.1,1.25);orb(g,a.edge,x,1.31,at,.14);if(x+3<width/2)for(const y of [.5,.92])block(g,a.wood,x+1.5,y,at,3,.08,.08);}}
 for(const side of [-1,1])for(let z=-depth/2+1;z<depth/2;z+=3){post(g,a.trim,side*width/2,.65,z+offsetZ,.1,1.25);if(z+3<depth/2)for(const y of [.5,.92])block(g,a.wood,side*width/2,y,z+1.5+offsetZ,.08,.08,3);}
}
export function marketGarden(){
 const g=new T.Group();districtBorder(g,48,37);
 stoneLane(g,0,5,5,14);stoneLane(g,0,-8,42,3);stoneLane(g,0,2,42,3);
 for(const x of [-19,-6,6,19]){gardenLamp(g,x,5);flowerBed(g,x,6.5,2);}
 for(const x of [-20,-6,6,20]){flowerBed(g,x,-17,2.5);gardenLamp(g,x,-9);}
 gardenBench(g,-8,9);gardenBench(g,8,9);return g;
}
export function homesteadGarden(){
 const g=new T.Group();districtBorder(g,26,41,8);
 stoneLane(g,0,20,4,15);stoneLane(g,-5,20,7,2);
 for(const side of [-1,1]){gardenLamp(g,side*2.8,13.8);flowerBed(g,side*5,27,3);for(const z of [-9,-2,6])flowerBed(g,side*13.7,z,2,Math.PI/2);}
 gardenBench(g,7.5,18.5);flowerBed(g,7.5,17.2,3);return g;
}

function leafCrest(g:T.Object3D,x:number,y:number,z:number,scale=1){
 const shape=new T.Shape();shape.moveTo(0,-.45);shape.bezierCurveTo(-.75,-.1,-.65,.65,.45,.75);shape.bezierCurveTo(.67,.05,.42,-.3,0,-.45);
 const m=piece(g,0xc9ac62,new T.ShapeGeometry(shape,12),x,y,z);m.scale.setScalar(scale);
 const stem=block(g,0xffe0a0,x,y+.08*scale,z+.015,.045*scale,.85*scale,.025);stem.rotation.z=-.42;
}

/** Academy architecture shares the village palette but has a distinct guild silhouette. */
export function academyBuilding(){
 const g=new T.Group(),a=VILLAGE_ART;
 const core=cottageModel(0x477f77,0xf3e4c5,true);core.scale.setScalar(1.08);g.add(core);
 for(const side of [-1,1]){const wing=cottageModel(side<0?0x568f84:0x629d8d,0xefddba);wing.scale.setScalar(.7);wing.position.set(side*4.4,0,.1);g.add(wing);block(g,a.edge,side*3.1,2.7,2.65,.32,4.7,.42);orb(g,0xe2c482,side*3.1,5.13,2.65,.25);flowerBed(g,side*4.5,2.2,2.3);}
 // Tower with a gilded clock and contrasting roof courses.
 block(g,0xe6d1a6,3.2,4.1,-1,1.65,6.6,1.7);block(g,a.trim,3.2,6.2,-1,1.9,.2,1.95);
 for(const side of [-1,1])block(g,a.wood,3.2+side*.55,6.8,-.12,.12,1.2,.15);
 block(g,0x5b725c,3.2,6.85,-.12,1.1,1.15,.1);orb(g,0xeec879,3.2,6.8,0,.34,1.2);
 const cap=piece(g,0x447e72,new T.ConeGeometry(1.5,1.65,4),3.2,8,-1);cap.rotation.y=Math.PI/4;orb(g,0xe3bf70,3.2,8.95,-1,.18);
 for(const side of [-1,1]){
  // Arched amber window and dark timber reveal.
  const arch=piece(g,0xc8a767,new T.TorusGeometry(.56,.075,6,20,Math.PI),side*2.15,3.1,2.59);
  block(g,0xf3ce7f,side*2.15,2.65,2.62,1,.9,.04);block(g,a.wood,side*2.15,2.8,2.68,.065,1.4,.05);
  block(g,a.wood,side*2.15,2.6,2.68,1.06,.065,.05);
  const lantern=new T.Group();gardenLamp(lantern,0,0);lantern.scale.setScalar(.65);lantern.position.set(side*1.7,.75,3.1);g.add(lantern);
 }
 // Entrance canopy, gold leaf crest, broad stone approach.
 for(let i=0;i<4;i++)block(g,i%2?a.trim:a.edge,0,.08+i*.16,4.35-i*.38,3.8,.2,1.15);
 const doorArch=piece(g,0xd4af60,new T.TorusGeometry(.9,.11,7,28,Math.PI),0,2.32,2.68);
 for(const side of [-1,1])block(g,0xd4af60,side*.9,1.63,2.68,.13,1.4,.13);

 // Timber balcony, leaf banners and gold eave trim give the facade a crafted guild identity.
 for(const side of [-1,1]){
  block(g,0x4a7160,side*5.1,2.4,1.64,.9,1.7,.08);block(g,0xd2b46a,side*5.1,3.3,1.72,1.1,.1,.12);leafCrest(g,side*5.1,2.5,1.73,.52);
  block(g,0xceb783,side*2,3.95,2.8,2,.16,.65);for(let i=0;i<5;i++)block(g,0xd4bd80,side*2-.8+i*.4,4.25,3.05,.06,.55,.06);block(g,0xe7d5a2,side*2,4.55,3.05,2,.08,.1);
 }
 leafCrest(g,0,4.4,2.74,.55);
 flowerBed(g,-5.8,-.8,2,Math.PI/2);flowerBed(g,5.8,-.8,2,Math.PI/2);
 return g;
}
export function academyInterior(){
 const g=new T.Group(),a=VILLAGE_ART;
 block(g,a.wood,0,-.35,0,19,.7,15);block(g,0xf1e3c3,0,.025,0,18,.05,14);
 for(let i=0;i<22;i++)block(g,i%3?0xdac29a:0xcdb089,-8.55+i*.8,.065,0,.76,.03,13.7);
 block(g,0xf4e7cb,0,2.7,-7,19,5.4,.35);block(g,0x527e6e,0,.8,-6.78,18,1.6,.12);
 for(let i=0;i<19;i++)block(g,0xc9bd8c,-8.6+i*.95,.8,-6.66,.07,1.55,.06);
 block(g,0xd8bd7b,0,1.63,-6.6,18,.12,.15);
 for(const side of [-1,1]){block(g,0xe3d2ac,side*9,.6,0,.3,1.2,14);block(g,a.wood,side*9,1.24,0,.42,.12,14);}
 block(g,0xe4c98c,0,.11,.6,5.4,.07,10.6);block(g,0x416f62,0,.16,.6,5,.04,10.2);
 for(const x of [-2.2,2.2])block(g,0xc5ad72,x,.19,.6,.06,.02,9.8);
 const crest=piece(g,0xd7b973,new T.TorusGeometry(1.5,.04,5,32),0,.21,.8);crest.rotation.x=Math.PI/2;

 // Ornate interior corner pilasters, pennants and wall lamps frame the open play area.
 for(const x of [-8,-3.2,3.2,8]){
  block(g,0xc2a478,x,2.5,-6.5,.25,5,.32);block(g,0xe5d1a0,x,4.9,-6.35,.55,.18,.5);
 }
 for(const side of [-1,1]){
  block(g,0x3c6b57,side*3.1,3.35,-6.25,1.2,2.3,.08);block(g,0xcdb36b,side*3.1,4.55,-6.15,1.4,.12,.16);leafCrest(g,side*3.1,3.5,-6.13,.65);
  for(const z of [-5,2]){post(g,0xb59a5f,side*8.3,.25,z,.45,.5);orb(g,0x69996b,side*8.3,.83,z,.62,.85);orb(g,0x8eae76,side*8.3,1.45,z,.4);}
 }
 for(const side of [-1,1])for(const z of [-3,3]){const motif=piece(g,0xcbb579,new T.TorusGeometry(.22,.035,4,16),side*2,.2,z);motif.rotation.x=Math.PI/2;}
 const window=piece(g,0xd4b36a,new T.TorusGeometry(1.2,.14,7,24,Math.PI),0,3.7,-6.65);block(g,0x9bc9b4,0,3.1,-6.65,2.25,1.3,.1);orb(g,0xeedba2,0,3.6,-6.56,.67);const leaf=orb(g,0x548c6d,0,3.6,-6.45,.45,.6);leaf.rotation.z=.6;
 // Skill lectern and the luminous open book.
 post(g,0xb99a60,-4,.28,-2,1.5,.5);post(g,0x6c9b83,-4,.9,-2,.72,1);block(g,0xd8b568,-4,1.42,-2,2.2,.18,1.5);
 for(const side of [-1,1]){const cover=block(g,0x466c58,-4+side*.48,1.72,-2,.96,.13,1.3);cover.rotation.z=side*-.18;const page=block(g,0xffedb5,-4+side*.45,1.82,-2,.87,.08,1.18);page.rotation.z=side*-.18;for(let i=0;i<4;i++)block(g,0xb2b788,-4+side*.45,1.88,-2.35+i*.2,.52,.012,.025);}

 const bookGlow=new T.Mesh(new T.TorusGeometry(1.18,.035,6,40),new T.MeshStandardMaterial({color:0xffdf8e,emissive:0xffd16c,emissiveIntensity:.5}));bookGlow.rotation.x=Math.PI/2;bookGlow.position.set(-4,1.5,-2);g.add(bookGlow);
 // Safe practice dummy, with no attack requirement or damage counter.
 post(g,0xcba779,4,.25,-1,1.1,.45);post(g,0x997150,4,1,-1,.18,1.3);orb(g,0xd4b887,4,1.8,-1,.45,1.2);block(g,0x997150,4,1.2,-1,1.7,.15,.15);orb(g,0x7fab83,4,1.8,-.6,.23,.8);
 const target=piece(g,0xb6a16f,new T.TorusGeometry(1.5,.04,4,32),4,.12,-1);target.rotation.x=Math.PI/2;
 // Library walls, books and a comfortable record alcove.
 for(const x of [-6,6]){block(g,a.wood,x,1.55,-6,3,3.1,.65);for(let shelf=0;shelf<3;shelf++){block(g,0xe9d1a3,x,.45+shelf*.9,-5.55,2.8,.1,.7);for(let i=0;i<6;i++)block(g,[0x568b79,0xc4a66f,0xa88d9f,0x7d9cae][i%4],x-1.15+i*.43,.78+shelf*.9,-5.55,.28,.55+(i%2)*.14,.4);}}
 gardenBench(g,5,4,Math.PI);flowerBed(g,7.5,3.5,2,Math.PI/2);
 for(const x of [-7,7])gardenLamp(g,x,0);
 for(const side of [-1,1]){block(g,a.wood,side*1.5,1.3,6.8,.2,2.6,.3);block(g,0xd5b573,side*1.5,2.7,6.8,.4,.16,.5);}
 return g;
}
export function skillEffectModel(id:'shield'|'wind'|'lantern'){
 const g=new T.Group(),color=id==='shield'?0x8bd19a:id==='wind'?0xa2dce3:0xffdb83;
 const material=new T.MeshBasicMaterial({color,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const ring=new T.Mesh(new T.TorusGeometry(id==='shield'?1:.8,.04,6,32),material);ring.rotation.x=Math.PI/2;ring.position.y=.18;g.add(ring);
 if(id==='shield'){const dome=new T.Mesh(new T.SphereGeometry(1.1,16,10,0,Math.PI*2,0,Math.PI*.65),new T.MeshBasicMaterial({color,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide,toneMapped:false}));dome.position.y=.6;g.add(dome);for(let i=0;i<6;i++){const a=i*Math.PI/3;const leaf=new T.Mesh(new T.OctahedronGeometry(.15),material);leaf.position.set(Math.cos(a),.9+(i%2)*.3,Math.sin(a));leaf.scale.y=1.8;g.add(leaf);}}
 else if(id==='wind'){for(let i=0;i<3;i++){const ribbon=new T.Mesh(new T.TorusGeometry(.6+i*.12,.025,5,24,Math.PI*1.5),material);ribbon.rotation.x=Math.PI/2;ribbon.position.y=.25+i*.3;g.add(ribbon);}}
 else{const lamp=new T.Mesh(new T.OctahedronGeometry(.25),material);lamp.position.set(.8,1.9,0);g.add(lamp);const arch=new T.Mesh(new T.TorusGeometry(.34,.025,5,24),material);arch.position.set(.8,1.9,0);g.add(arch);}
 return g;
}
