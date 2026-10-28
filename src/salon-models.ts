import * as T from 'three';

/** Body-local models; the caller supplies the skin/head and retains its existing outfit. */
const geometries=new Map<string,T.BufferGeometry>();
const GEOMETRY_LIMIT=256;
function shared(key:string,make:()=>T.BufferGeometry){
 let geometry=geometries.get(key);
 if(!geometry){if(geometries.size>=GEOMETRY_LIMIT)throw new Error('Salon geometry budget exceeded');geometry=make();geometry.userData.sharedSalonAsset=true;geometries.set(key,geometry);}
 return geometry;
}
export const isSalonSharedGeometry=(geometry:T.BufferGeometry)=>geometry.userData.sharedSalonAsset===true;
export const salonGeometryCount=()=>geometries.size;
/** Call when replacing an avatar. Geometry stays in a bounded shared library; each model owns its materials. */
export function disposeSalonMaterials(root:T.Object3D){
 const materials=new Set<T.Material>();
 root.traverse(o=>{for(const material of (o.userData.salonMaterials??[]) as T.Material[])materials.add(material);o.userData.salonMaterials=[];});
 materials.forEach(material=>material.dispose());
}
type Point=[number,number,number];
function builder(name:string){
 const root=new T.Group(),materials=new Map<number,T.MeshStandardMaterial>();root.name=name;root.userData.eyes=[];root.userData.salonMaterials=[];
 const material=(color:number)=>{if(!materials.has(color)){const m=new T.MeshStandardMaterial({color,roughness:.83,side:T.DoubleSide});materials.set(color,m);root.userData.salonMaterials.push(m);}return materials.get(color)!;};
 const mesh=(name:string,color:number,geometry:T.BufferGeometry,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
 const oval=(name:string,color:number,x:number,y:number,z:number,sx:number,sy:number,sz=.025)=>{const m=mesh(name,color,shared('oval',()=>new T.SphereGeometry(1,12,8)),x,y,z);m.scale.set(sx,sy,sz);return m;};
 const box=(name:string,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=mesh(name,color,shared('box',()=>new T.BoxGeometry(1,1,1)),x,y,z);m.scale.set(sx,sy,sz);return m;};
 const curve=(name:string,color:number,points:Point[],radius=.014,taper=false)=>mesh(name,color,shared(`curve:${name}`,()=>{
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=Math.max(8,points.length*3),geo=new T.TubeGeometry(path,segments,radius,6,false);
  if(taper){const vertices=geo.getAttribute('position');for(let i=0;i<=segments;i++){const center=path.getPointAt(i/segments),factor=1-.78*Math.pow(i/segments,2);for(let j=0;j<=6;j++){const n=i*7+j;vertices.setXYZ(n,center.x+(vertices.getX(n)-center.x)*factor,center.y+(vertices.getY(n)-center.y)*factor,center.z+(vertices.getZ(n)-center.z)*factor);}}geo.computeVertexNormals();}
  return geo;
 }));
 const shape=(name:string,color:number,path:(s:T.Shape)=>void,x:number,y:number,z:number,sx:number,sy=sx)=>{const m=mesh(name,color,shared(`shape:${name}`,()=>{const s=new T.Shape();path(s);return new T.ShapeGeometry(s,12);}),x,y,z);m.scale.set(sx,sy,1);return m;};
 const eye=(m:T.Mesh)=>{
  // Curved closed eyes start in body coordinates; blink around the eye, not the character's feet.
  if(m.position.lengthSq()===0){m.geometry.computeBoundingBox();const center=m.geometry.boundingBox!.getCenter(new T.Vector3()),source=m.geometry;m.geometry=shared(`blink-local:${m.name}`,()=>source.clone().translate(-center.x,-center.y,-center.z));m.position.copy(center);}
  m.userData.blinkHeight=m.scale.y;root.userData.eyes.push(m);return m;
 };
 return {root,mesh,oval,box,curve,shape,eye};
}
const normalized=(id:number,count:number)=>Number.isInteger(id)&&id>=0&&id<count?id:0;
const rgb=(value:number)=>Number.isInteger(value)&&value>=0&&value<=0xffffff?value:0x604839;
const tint=(color:number,other:number,amount:number)=>new T.Color(color).lerp(new T.Color(other),amount).getHex();
function starPath(s:T.Shape,points=5){for(let i=0;i<points*2;i++){const angle=Math.PI/2+i*Math.PI/points,r=i%2?.43:1,x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();}
function heartPath(s:T.Shape){s.moveTo(0,-.9);s.bezierCurveTo(-1.6,.1,-.9,1.5,0,.65);s.bezierCurveTo(.9,1.5,1.6,.1,0,-.9);s.closePath();}
function leafPath(s:T.Shape){s.moveTo(-.85,-.8);s.bezierCurveTo(-1.2,.6,.2,1.4,.95,.8);s.bezierCurveTo(.9,-.5,.2,-1.2,-.85,-.8);s.closePath();}

export function salonHairModel(style:number,hairColor:number,accent:number){
 style=normalized(style,10);hairColor=rgb(hairColor);accent=rgb(accent);
 const b=builder(`salon-hair-${style}`),g=b.root,hair=style===8?tint(hairColor,0xce8766,.12):hairColor,shine=tint(hair,0xe4c59f,.13);
 g.userData.salonStyle=style;
 const cap=b.mesh('hair-crown',hair,shared('hair-cap',()=>new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.455)),0,1.51,-.04);cap.scale.set(.555,style===3?.63:.57,.49);
 const lock=(name:string,p:Point[],width=.12,color=hair)=>b.curve(`hair${style}:${name}`,color,p,width,true);
 const fringe=(sweep=0)=>{for(let i=0;i<3;i++){const x=-.3+i*.28;lock(`fringe-${i}`,[[x-sweep,1.99,.22],[x,1.88,.36],[x+sweep,1.67+(i%2)*.06,.41]],.14);}};
 const bow=(x:number,y:number,z:number)=>{for(const side of [-1,1]){const wing=b.shape(`hair-bow-${side}`,accent,s=>{s.moveTo(0,0);s.lineTo(side, .65);s.quadraticCurveTo(side*1.3,0,side,-.65);s.closePath();},x,y,z,.11);wing.rotation.z=side*.12;}b.oval('bow-knot',accent,x,y,z+.015,.045,.055,.045);};
 const band=(name:string,x:number,y:number,z:number,r:number,color=accent)=>{const m=b.mesh(name,color,shared('hair-band',()=>new T.TorusGeometry(1,.15,6,18)),x,y,z);m.scale.setScalar(r);return m;};
 if(style===0){fringe(.07);lock('short-side',[[-.43,1.88,.16],[-.48,1.7,.2],[-.44,1.52,.18]],.1);}
 if(style===1){
  fringe(-.04);
  for(const side of [-1,1]){lock(`pigtail-${side}`,[[side*.44,1.86,-.12],[side*.68,1.63,-.16],[side*.65,1.36,-.13],[side*.76,1.2,-.07]],.205);bow(side*.54,1.81,.04);}
 }
 if(style===2){
  for(const side of [-1,1]){const curtain=lock(`bob-curtain-${side}`,[[side*.36,1.96,-.1],[side*.5,1.72,-.09],[side*.51,1.3,-.06],[side*.43,1.18,.04]],.21);curtain.scale.z=.85;}
  lock('bob-back',[[0,1.94,-.32],[0,1.55,-.46],[0,1.21,-.31]],.29);
  for(let i=0;i<4;i++){const x=-.34+i*.225;lock(`straight-fringe-${i}`,[[x,1.99,.23],[x,1.81,.39],[x,1.68,.41]],.12);}
  b.shape('bob-sparkle',0xffe7a3,starPath,.43,1.78,.28,.09);
 }
 if(style===3){
  for(let i=0;i<5;i++){const x=-.4+i*.2;lock(`chestnut-wave-${i}`,[[x,2.04,.15],[x-.08,1.92,.35],[x+.055,1.79,.4],[x-.035,1.68,.37]],.115);}
  for(const side of [-1,1])lock(`short-curl-${side}`,[[side*.44,1.95,-.04],[side*.53,1.78,.08],[side*.44,1.62,.16],[side*.5,1.58,.02]],.12);
 }
 if(style===4){
  fringe(.12);lock('high-ponytail',[[.16,2.04,-.14],[.34,2.13,-.41],[.4,1.82,-.64],[.24,1.37,-.67],[.42,1.22,-.53]],.225);
  band('ponytail-tie',.2,2.02,-.15,.14).rotation.x=Math.PI/3;
  b.shape('pony-star',0xffdd80,starPath,.35,1.94,.25,.12);
 }
 if(style===5){
  fringe(-.07);
  for(const side of [-1,1]){b.oval(`cloud-bun-${side}`,hair,side*.51,2.04,-.13,.26,.25,.24);const spiral:Point[]=[];for(let i=0;i<15;i++){const angle=i*.7,r=.04+i*.011;spiral.push([side*.51+Math.cos(angle)*r,2.04+Math.sin(angle)*r,.105]);}lock(`bun-spiral-${side}`,spiral,.025,shine);bow(side*.45,1.85,.12);}
 }
 if(style===6){
  fringe(.03);
  for(const side of [-1,1]){
   for(let strand=0;strand<2;strand++){const braid:Point[]=[];for(let i=0;i<12;i++)braid.push([side*.5+Math.sin(i*Math.PI/2+strand*Math.PI)*.067,1.66-i*.061,-.07+Math.cos(i*Math.PI/2+strand*Math.PI)*.05]);lock(`braid-${side}-${strand}`,braid,.075,strand?shine:hair);}
   bow(side*.5,.97,.02);
  }
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const petal=b.shape('sunflower-petal',0xf7cd57,leafPath,-.42+Math.cos(a)*.103,1.91+Math.sin(a)*.103,.3,.055);petal.rotation.z=a;}
  b.oval('sunflower-heart',0x93633e,-.42,1.91,.31,.058,.058,.025);
 }
 if(style===7){
  fringe(.1);b.oval('single-round-bun',hair,0,2.13,-.28,.31,.3,.28);
  for(let i=0;i<2;i++)band(`honey-bun-band-${i}`,0,2.13,-.065,.17+i*.065,i?accent:0xf0cc64);
  for(const side of [-1,1])lock(`bee-wisp-${side}`,[[side*.41,1.88,.1],[side*.48,1.65,.08],[side*.39,1.43,.16]],.07);
  b.oval('bee-clip',0xe8bc51,.37,1.92,.3,.105,.075,.04);b.box('bee-stripe',0x574536,.38,1.92,.341,.035,.12,.012);
  for(const side of [-1,1])b.oval('bee-wing',0xf6f0d8,.37+side*.07,2,.3,.055,.075,.016);
 }
 if(style===8){
  lock('sweeping-fringe',[[-.33,2.01,.19],[.06,1.94,.38],[.35,1.71,.4]],.19);
  for(const side of [-1,1]){lock(`long-wave-${side}`,[[side*.37,1.98,-.05],[side*.55,1.67,.02],[side*.46,1.35,.04],[side*.62,1.11,-.02],[side*.45,.89,.02]],.18);lock(`wave-highlight-${side}`,[[side*.48,1.9,.07],[side*.57,1.6,.13],[side*.51,1.33,.15],[side*.61,1.11,.12]],.023,shine);}
  lock('long-back',[[-.12,1.97,-.35],[-.14,1.53,-.48],[.08,1.07,-.45],[0,.86,-.36]],.32);
 }
 if(style===9){
  for(let i=0;i<5;i++){const x=-.36+i*.18;lock(`crown-crop-${i}`,[[x,1.9,.29],[x-.07,1.98,.37],[x+.055,1.7,.4]],.105);}
  const circlet=band('sun-circlet',0,1.98,-.02,.49,0xe8c66e);circlet.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){const x=-.37+i*.185,top=2.1+(i===2?.15:i%2?.07:0);b.shape(`sun-ray-${i}`,0xffdf86,s=>{s.moveTo(-1,0);s.lineTo(0,1);s.lineTo(1,0);s.closePath();},x,2.015,.32,.065,top-2.015);}
 }
 return g;
}

export function salonFaceModel(face:number){
 face=normalized(face,14);
 const b=builder(`salon-face-${face}`),g=b.root,ink=0x343a39,lip=0x975b60;
 g.userData.salonFace=face;
 const line=(name:string,color:number,points:Point[],radius=.012)=>b.curve(`face${face}:${name}`,color,points,radius);
 const brow=(side:number,slope=0,color=ink)=>line(`brow-${side}`,color,[[side*.29,1.64+slope,.421],[side*.19,1.66,.438],[side*.1,1.64-slope,.437]],.016);
 const cheeks=(color=0xf0a1a0,width=.077)=>{for(const side of [-1,1])b.oval(`cheek-${side}`,color,side*.31,1.37,.394,width,.035,.013);};
 const dotEyes=(wide=.047,tall=.066,color=ink)=>{for(const side of [-1,1]){b.eye(b.oval(`eye-${side}`,color,side*.19,1.5,.435,wide,tall,.023));b.eye(b.oval(`eye-glint-${side}`,0xfffbed,side*.19-.013,1.52,.456,.012,.017,.007));}};
 const smile=(width=.09,depth=.045)=>line('smile',lip,[[-width,1.36,.446],[0,1.36-depth,.456],[width,1.36,.446]],.012);
 const openMouth=(width=.07,height=.055)=>b.oval('open-mouth',0x70444b,0,1.33,.45,width,height,.014);
 if(face===0){dotEyes();cheeks();smile();}
 if(face===1){
  for(const side of [-1,1]){b.eye(b.oval(`wide-eye-white-${side}`,0xfff9ec,side*.19,1.5,.427,.098,.113,.025));b.eye(b.oval(`wide-pupil-${side}`,0x514b43,side*.19,1.486,.453,.073,.087,.014));for(const [dx,dy,r]of [[-.027,.04,.024],[.027,-.025,.012]])b.eye(b.oval(`wide-glint-${side}-${dx}`,0xffffff,side*.19+dx,1.49+dy,.47,r,r,.005));brow(side,-.026);}
  cheeks(0xf0b7b7,.09);openMouth(.037,.037);
 }
 if(face===2){
  for(const side of [-1,1]){b.eye(b.oval(`determined-eye-${side}`,ink,side*.19,1.49,.44,.071,.037,.02));brow(side,.045);}
  cheeks(0xe5b18f,.05);line('confident-smirk',lip,[[-.08,1.32,.445],[.02,1.33,.456],[.1,1.37,.445]],.015);
 }
 if(face===3){
  for(const side of [-1,1]){b.eye(b.shape('cat-eye',0x735a6d,s=>{s.moveTo(-1,0);s.quadraticCurveTo(0,1,1,0);s.quadraticCurveTo(0,-.5,-1,0);},side*.19,1.5,.445,.085,.08));line(`cat-lash-${side}`,ink,[[side*.23,1.53,.449],[side*.3,1.57,.418]],.012);for(const dy of [0,.055])line(`whisker-${side}-${dy}`,0xa87878,[[side*.3,1.38+dy,.417],[side*.44,1.35+dy,.33]],.01);}
  b.shape('cat-nose',0xe795a4,s=>{s.moveTo(-1,.4);s.lineTo(1,.4);s.lineTo(0,-1);s.closePath();},0,1.39,.469,.035);
  line('cat-mouth',lip,[[-.1,1.34,.446],[-.045,1.31,.456],[0,1.35,.46],[.045,1.31,.456],[.1,1.34,.446]],.012);
 }
 if(face===4){
  for(const side of [-1,1]){b.eye(b.shape('star-eye',0xecc34e,starPath,side*.19,1.5,.45,.108));b.shape('star-cheek-spark',0xffd978,starPath,side*.36,1.37,.382,.045);brow(side,-.03);}
  openMouth(.075,.064);b.oval('happy-tongue',0xee8da1,0,1.3,.468,.048,.023,.007);
 }
 if(face===5){
  for(const side of [-1,1]){const lid=line(`sleepy-eye-${side}`,ink,[[side*.27,1.51,.429],[side*.19,1.485,.452],[side*.11,1.5,.445]],.016);b.eye(lid);brow(side,.008);}
  cheeks(0xc4b6dc,.065);openMouth(.025,.044);
 }
 if(face===6){dotEyes(.049,.082);cheeks(0xf4aaba,.099);openMouth(.094,.065);for(const side of [-1,1])b.box(`bunny-tooth-${side}`,0xfffbec,side*.029,1.345,.472,.05,.071,.012);}
 if(face===7){for(const side of [-1,1])b.eye(b.shape('heart-eye',0xea7098,heartPath,side*.19,1.5,.449,.105));cheeks(0xf3b1ba,.092);line('kiss-lips',lip,[[-.035,1.37,.456],[.035,1.345,.466],[-.025,1.32,.456]],.017);}
 if(face===8){
  for(const side of [-1,1]){b.eye(b.shape('lightning-eye',0xf1c85b,s=>{s.moveTo(.2,1);s.lineTo(-.85,-.05);s.lineTo(-.05,-.05);s.lineTo(-.3,-1);s.lineTo(.9,.22);s.lineTo(.1,.22);s.closePath();},side*.19,1.5,.451,.084,.1));brow(side,.065);}
  line('brave-grin',lip,[[-.08,1.34,.448],[.035,1.33,.458],[.09,1.35,.445]],.015);cheeks(0xf0c884,.055);
 }
 if(face===9){
  for(const side of [-1,1]){b.eye(line(`laugh-eye-${side}`,ink,[[side*.28,1.48,.428],[side*.19,1.55,.451],[side*.1,1.48,.445]],.016));for(let i=0;i<3;i++)line(`rainbow-${side}-${i}`,[0xe88b9c,0xf0c461,0x8cbd93][i],[[side*.28,1.4-i*.04,.422],[side*.34,1.42-i*.04,.392],[side*.4,1.39-i*.04,.357]],.012);}
  openMouth(.112,.07);b.oval('laugh-tongue',0xf29ba9,0,1.296,.47,.075,.025,.008);
 }
 if(face===10){
  for(const side of [-1,1]){b.eye(line(`sun-crescent-eye-${side}`,0x9c7634,[[side*.28,1.53,.429],[side*.19,1.47,.452],[side*.1,1.53,.445]],.022));for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line(`sun-cheek-ray-${side}-${i}`,0xe0b44d,[[side*.34+Math.cos(a)*.03,1.36+Math.sin(a)*.03,.393],[side*.34+Math.cos(a)*.075,1.36+Math.sin(a)*.075,.39]],.012);}}
  smile(.075,.025);
 }
 if(face===11){
  for(const side of [-1,1]){b.eye(b.shape('honey-drop-eye',0xb67d32,s=>{s.moveTo(0,1);s.bezierCurveTo(-1.3,-.3,-.7,-1,0,-1);s.bezierCurveTo(.7,-1,1.3,-.3,0,1);s.closePath();},side*.19,1.51,.448,.071,.097));b.eye(b.oval('honey-glint',0xffefd2,side*.19-.02,1.52,.461,.016,.023,.007));for(let i=0;i<2;i++)b.oval('honey-freckle',0xd7a257,side*(.29+i*.07),1.365+(i%2)*.035,.405-i*.035,.015,.015,.007);}
  line('honey-smile',lip,[[-.09,1.34,.445],[-.02,1.305,.46],[.08,1.35,.446]],.014);
 }
 if(face===12){
  for(const side of [-1,1]){for(let i=0;i<6;i++){const a=i*Math.PI/3;b.eye(b.oval(`flower-eye-petal-${side}-${i}`,0xf4ca5a,side*.19+Math.cos(a)*.064,1.51+Math.sin(a)*.064,.444,.041,.041,.012));}b.eye(b.oval(`flower-eye-center-${side}`,0x795636,side*.19,1.51,.461,.039,.044,.01));brow(side,-.04);}
  cheeks(0xf2b7a4,.07);smile(.105,.052);
 }
 if(face===13){
  for(const side of [-1,1]){b.eye(b.oval(`forest-eye-${side}`,0x44745e,side*.19,1.5,.439,.077,.092,.023));b.eye(b.shape('forest-star-pupil',0xffe09a,s=>starPath(s,4),side*.19,1.51,.467,.046,.065));brow(side,.038);const leaf=b.shape('forest-cheek-leaf',0x87b49a,leafPath,side*.34,1.37,.39,.044,.026);leaf.rotation.z=side*.5;}
  line('forest-courage-smile',lip,[[-.09,1.335,.447],[0,1.31,.458],[.11,1.365,.439]],.016);
 }
 return g;
}
