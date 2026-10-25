import * as T from 'three';

/** Shared architectural language. Pure scenery: no rewards, storage or interactions. */
export const VILLAGE_ART = { grass:0xc6d99c, earth:0x9bb778, cream:0xf4e6c8, edge:0xd3bb94, wood:0x997151, mint:0x659d91, trim:0xfff4d9, leaf:0x76a866, berry:0xe36685 };
const mats=new Map<number,T.MeshStandardMaterial>();
function piece(g:T.Object3D,c:number,geo:T.BufferGeometry,x:number,y:number,z:number){
 if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.92,flatShading:true}));
 const m=new T.Mesh(geo,mats.get(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
const block=(g:T.Object3D,c:number,x:number,y:number,z:number,w:number,h:number,d:number)=>piece(g,c,new T.BoxGeometry(w,h,d),x,y,z);
const orb=(g:T.Object3D,c:number,x:number,y:number,z:number,r:number,sy=1)=>{const m=piece(g,c,new T.IcosahedronGeometry(r,1),x,y,z);m.scale.y=sy;return m;};
const post=(g:T.Object3D,c:number,x:number,y:number,z:number,r:number,h:number)=>piece(g,c,new T.CylinderGeometry(r,r,h,10),x,y,z);
export const PLAZA_BERRY_TREES=[{x:-5.7,z:-5.5,scale:.9},{x:-2.8,z:-6.7,scale:1.08},{x:.4,z:-5.8,scale:.86},{x:-9.2,z:-1.9,scale:.85},{x:-10.6,z:-4.2,scale:1},{x:8.9,z:-5.7,scale:1},{x:10.4,z:-3.4,scale:.86}] as const;
export function berryTreeModel(){
 const g=new T.Group(),a=VILLAGE_ART;
 post(g,a.wood,0,1.15,0,.23,2.3);
 for(const side of [-1,1]){const b=post(g,a.wood,side*.35,1.9,0,.12,1.15);b.rotation.z=-side*.55;}
 for(const [x,y,z,r]of [[0,2.7,0,1.25],[-.72,2.4,.1,.83],[.72,2.5,.16,.87],[-.2,3.5,-.1,.85],[.6,3.25,.1,.68]])orb(g,a.leaf,x,y,z,r);
 orb(g,0x97bd76,-.45,3.65,.25,.65);orb(g,0xb1cd83,.65,3.1,.65,.57);
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
 block(g,a.edge,0,.2,0,w+.6,.4,d+.5);block(g,wall,0,h/2+.4,0,w,h,d);
 block(g,a.trim,0,.62,0,w+.12,.3,d+.12);
 for(const side of [-1,1]){block(g,a.trim,side*(w/2-.16),h/2+.45,d/2+.06,.23,h,.16);const roofHalf=block(g,roof,0,h+.95,side*(d/4+.15),w+.85,.2,d/2+.65);roofHalf.rotation.x=side*.43;}
 block(g,0x507e77,0,h+1.46,0,w+.9,.18,.18);
 for(let row=0;row<4;row++)for(const side of [-1,1]){const pz=side*(.2+row*.6),py=h+1.4-row*.25;block(g,0x77afa0,0,py,pz,w+.7,.045,.07);}
 const front=d/2;
 block(g,a.wood,0,1.45,front+.1,1.22,2.15,.18);block(g,0xb1d4c5,0,1.65,front+.21,.84,1.25,.045);post(g,0xe7c078,.34,1.25,front+.27,.065,.13);
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