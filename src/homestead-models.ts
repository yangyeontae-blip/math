import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HOME_ITEMS, type HomeObject } from './homestead';
const materials=new Map<number,T.MeshStandardMaterial>();
function piece(g:T.Group,color:number,geometry:T.BufferGeometry,x:number,y:number,z:number){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.85}));const m=new T.Mesh(geometry,materials.get(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const box=(g:T.Group,c:number,x:number,y:number,z:number,w:number,h:number,d:number)=>piece(g,c,new T.BoxGeometry(w,h,d),x,y,z);
const ball=(g:T.Group,c:number,x:number,y:number,z:number,r:number)=>piece(g,c,new T.SphereGeometry(r,8,6),x,y,z);
const post=(g:T.Group,c:number,x:number,y:number,z:number,r:number,h:number)=>piece(g,c,new T.CylinderGeometry(r,r,h,8),x,y,z);
export function homeItemModel(kind:number){
 const g=new T.Group(),wood=0xa7815d,green=0x91ba75,cream=0xf2dfb0,pink=0xefacc3,blue=0x89ccdb;
 const flower=(x:number,z:number,c=pink)=>{post(g,green,x,.4,z,.035,.7);ball(g,c,x,.8,z,.22);ball(g,0xffe28f,x,.85,z+.08,.1);};
 if(kind<=2){box(g,[0xd4b68b,0xc6c7ad,wood][kind],0,.06,0,kind===2?3.8:1.85,.12,1.85);if(kind===2)for(let i=0;i<5;i++)box(g,cream,-1.5+i*.75,.14,0,.035,.02,1.8);}
 else if(kind<=5){if(kind===5){for(const x of [-.7,.7])post(g,wood,x,.8,0,.12,1.6);box(g,cream,0,1.6,0,1.8,.2,.2);}else{for(const x of [-1.5,0,1.5])post(g,wood,x,.7,0,.1,1.4);for(const y of [.45,1])box(g,wood,0,y,0,3.8,.16,.16);if(kind===3)for(const x of [-1.1,0,1.1])ball(g,pink,x,1.2,0,.23);}}
 else if(kind<=9){box(g,0x9e7658,0,.04,0,1.75,.08,1.75);for(const [x,z] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){if(kind===9){post(g,cream,x,.28,z,.08,.55);ball(g,0xe6a19d,x,.55,z,.3);}else flower(x,z,[0xe99cab,0xf8d378,0xb5a1d3][kind-6]);}}
 else if(kind<=11){post(g,wood,0,1,0,.25,2);ball(g,green,0,2.2,0,1);ball(g,0xa6c789,-.5,1.7,0,.65);if(kind===11)for(const x of [-.6,.2,.6])ball(g,0xe99782,x,2.4,.6,.2);}
 else if(kind===12){post(g,cream,0,.25,0,1.6,.5);post(g,blue,0,.52,0,1.4,.05);post(g,cream,0,1,0,.23,1);post(g,blue,0,1.65,0,.1,.8);ball(g,blue,0,2.1,0,.25);}
 else if(kind===13||kind===16){box(g,cream,0,.15,0,3.6,.3,3.6);for(const x of [-1.4,1.4])for(const z of [-1.4,1.4])post(g,wood,x,1.1,z,.1,2.2);const roof=piece(g,kind===16?0xb7d9c7:0xcb9e85,new T.ConeGeometry(2.6,1,4),0,2.7,0);roof.rotation.y=Math.PI/4;if(kind===16)for(const x of [-.8,0,.8])flower(x,0,green);else box(g,wood,0,.65,0,2.4,.2,1);}
 else if(kind===14||kind===18){box(g,wood,0,.8,0,3.5,.22,kind===14?1.5:.65);for(const x of [-1.3,1.3])post(g,wood,x,.4,0,.1,.8);if(kind===18)box(g,wood,0,1.2,.35,3.5,.55,.15);else for(const x of [-.5,.3,.8])ball(g,0xe7ac85,x,1,0,.2);}
 else if(kind===15){box(g,0xb8ce8d,0,.05,0,3.8,.1,3.8);for(const x of [-1.3,1.3])post(g,wood,x,.6,0,.08,1.2);const ramp=box(g,0xefc692,0,.7,0,2.4,.18,1);ramp.rotation.z=.25;for(const z of [-1.4,1.4])ball(g,0xc9b2db,.7,.3,z,.25);}
 else if(kind===17||kind===22){box(g,cream,0,.6,0,2.2,1.2,1.5);if(kind===17){box(g,blue,0,.06,0,3.7,.12,3.7);box(g,blue,-1.5,1,0,.15,1.7,.4);}else piece(g,0xc9a7a0,new T.ConeGeometry(1.5,1,6),0,1.7,0);const rotor=new T.Group();rotor.position.set(0,kind===17?1.2:2,1);rotor.userData.homeRotor=true;g.add(rotor);for(let i=0;i<(kind===17?8:4);i++){const a=i*Math.PI/(kind===17?4:2);const m=box(rotor,wood,Math.cos(a)*.9,Math.sin(a)*.9,0,.8,.2,.2);m.rotation.z=a;}}
 else if(kind===19){post(g,wood,0,1,0,.09,2);ball(g,0xffe4a6,0,2.1,0,.35);}
 else if(kind===20){post(g,wood,0,.5,0,.1,1);box(g,pink,0,1.2,0,.9,.8,.65);box(g,cream,0,1.25,.35,.65,.08,.04);}
 else if(kind===21){post(g,wood,0,.7,0,.1,1.4);box(g,cream,0,1.3,0,1.6,.65,.15);}
 else {for(const x of [-1.5,1.5])post(g,wood,x,1,0,.12,2);for(let i=0;i<9;i++)ball(g,[pink,cream,0xb9abd4][i%3],-1.5+i*.375,2+Math.sin(i/8*Math.PI)*.5,0,.27);}
 return g;
}
export function homeScenery(objects:HomeObject[]){
 const root=new T.Group(),raw=new T.Group(),rotors:T.Group[]=[];
 for(const o of objects){const item=HOME_ITEMS[o.kind],w=o.rotation%2?item.h:item.w,h=o.rotation%2?item.w:item.h,g=homeItemModel(o.kind);g.position.set((o.column+(w-1)/2-5.5)*2,0,(o.row+(h-1)/2-5.5)*2);g.rotation.y=o.rotation*Math.PI/2;raw.add(g);}
 raw.updateMatrixWorld(true);const groups=new Map<T.Material,T.BufferGeometry[]>();
 raw.traverse(o=>{if(o.userData.homeRotor){const rotation=new T.Quaternion(),scale=new T.Vector3(),position=new T.Vector3();o.matrixWorld.decompose(position,rotation,scale);const copy=o.clone(true) as T.Group;copy.position.copy(position);copy.quaternion.copy(rotation);copy.scale.copy(scale);rotors.push(copy);}if(o instanceof T.Mesh&&!o.parent?.userData.homeRotor){const m=o.material as T.Material;const list=groups.get(m)??[];list.push(o.geometry.clone().applyMatrix4(o.matrixWorld));groups.set(m,list);}});
 for(const [material,list]of groups){const geometry=mergeGeometries(list);list.forEach(g=>g.dispose());if(geometry){const m=new T.Mesh(geometry,material);m.receiveShadow=true;m.castShadow=true;root.add(m);}}
 raw.traverse(o=>{if(o instanceof T.Mesh&&!o.parent?.userData.homeRotor)o.geometry.dispose();});rotors.forEach(r=>root.add(r));return {root,rotors};
}
