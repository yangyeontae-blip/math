import * as T from 'three';
import {WEAPON_ART,OUTFIT_ART,weaponMaterial} from './equipment-art';
import {WEAPONS,OUTFITS} from './rules';
import {ITEM_RARITIES,itemRarity} from './item-rarity';
import type {SkywardKit} from './skyward-art';

const ink=0x30263e,gold=0xffd05b,cream=0xfff3cf;
const ramp=new T.DataTexture(new Uint8Array([90,180,255]),3,1,T.RedFormat);
ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.needsUpdate=true;
const colors=new Map<number,T.MeshToonMaterial>();
const rim=new T.MeshBasicMaterial({color:ink,side:T.BackSide});
function toon(color:number){let m=colors.get(color);if(!m){m=new T.MeshToonMaterial({color,gradientMap:ramp,side:T.DoubleSide});colors.set(color,m);}return m;}
function plate(k:SkywardKit,g:T.Group,color:number,points:number[][],z=0,depth=.09){
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  return k.mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:1,steps:1}),color,0,0,z-depth/2,g);
}
function star(k:SkywardKit,g:T.Group,x:number,y:number,size:number,color=gold,z=.1){
  return plate(k,g,color,Array.from({length:10},(_,i)=>{const a=i*Math.PI/5+Math.PI/2,r=i%2?size*.46:size;return [x+Math.cos(a)*r,y+Math.sin(a)*r];}),z,.055);
}
/** Same catalogue silhouette as the SVG. Advanced collection models keep their bespoke geometry. */
export function createInventoryWeapon(id:number,k:SkywardKit){
  const g=new T.Group();g.name='inventory-weapon-'+id;
  const [shape,mark]=WEAPON_ART[id],c=id===0?0xba854d:WEAPONS[id].color;
  const grip=()=>{k.cylinder(g,0x765365,0,.16,0,.065,.075,.49,8);for(const y of [.02,.13,.24])k.box(g,gold,0,y,.065,.13,.026,.02);k.ball(g,gold,0,-.12,0,.095);};
  const shaft=()=>{k.cylinder(g,weaponMaterial(id)==='wood'?0x91613d:0x8878a5,0,.55,0,.055,.065,1.25,8);k.cylinder(g,gold,0,.22,0,.09,.09,.075,8);};
  if(shape==='sword'||shape==='twin'){
    grip();const sides=shape==='twin'?[-1,1]:[0];
    for(const side of sides){plate(k,g,c,[[side*.14-.13,.4],[side*.14-.17,1.22],[side*.14,1.48],[side*.14+.17,1.22],[side*.14+.13,.4]]);plate(k,g,cream,[[side*.14-.07,.48],[side*.14-.1,1.19],[side*.14,1.4],[side*.14+.025,.48]],.065,.02);}
    plate(k,g,gold,[[-.4,.35],[-.32,.47],[0,.4],[.32,.47],[.4,.35],[.24,.29],[0,.34],[-.24,.29]]);
    star(k,g,0,.38,.12,id===0?0x84b863:gold,.12);
    if(id===0){for(const x of [-.07,.07])k.box(g,0x755033,x,.9,.075,.018,.44,.012);}
  }else if(shape==='hammer'){
    grip();shaft();if(id===1||id===23){k.ball(g,c,0,1,0,.42,.32,.28);k.cylinder(g,0x754b37,0,1.19,0,.38,.43,.19,10);k.cylinder(g,0x754b37,.03,1.34,0,.04,.05,.16,6);}
    else k.box(g,c,0,1.04,0,.85,.42,.32);
    for(const side of [-1,1])k.box(g,gold,side*.33,1.01,.02,.07,.36,.32);star(k,g,0,1.02,.16,cream,.3);
  }else if(shape==='bow'){
    const arc=k.mesh(new T.TorusGeometry(.51,.065,6,18,Math.PI),c,0,.7,0,g);arc.rotation.z=-Math.PI/2;
    k.box(g,cream,0,.7,0,.018,1.02,.02);k.box(g,0x845c67,.46,.7,0,.12,.3,.12);k.box(g,gold,.18,.7,.08,.92,.025,.025);plate(k,g,cream,[[.7,.7],[.53,.8],[.53,.6]],.08);star(k,g,.25,1.05,.12);
  }else if(shape==='spear'||shape==='pencil'){
    shaft();grip();plate(k,g,c,[[-.08,.85],[-.23,1.16],[0,1.61],[.23,1.16],[.08,.85]]);plate(k,g,cream,[[0,.91],[0,1.52],[-.16,1.16]],.07,.025);k.box(g,gold,0,.86,0,.45,.07,.15);
    if(shape==='pencil')k.box(g,0xf692b1,0,.36,0,.18,.16,.18);
  }else if(shape==='axe'){
    shaft();plate(k,g,c,[[-.04,1.17],[-.46,1.35],[-.52,.92],[-.22,.87],[0,1],[.23,.87],[.47,1.02],[.4,1.35],[.09,1.17]]);k.box(g,gold,0,1.1,0,.16,.38,.18);
  }else if(shape==='book'){
    k.box(g,c,0,.76,0,.72,.85,.18);k.box(g,cream,.015,.76,.11,.62,.73,.045);k.box(g,c,.03,.76,.14,.58,.68,.04);k.box(g,gold,-.3,.76,.04,.08,.87,.22);star(k,g,.03,.77,.2,gold,.18);plate(k,g,0xf292b4,[[.05,.35],[.05,.07],[.14,.16],[.23,.07],[.23,.35]],.05);
  }else if(shape==='fan'){
    grip();plate(k,g,c,[[0,.3],[-.53,1.02],[-.4,1.22],[0,1.35],[.4,1.22],[.53,1.02]]);
    for(const a of [-.6,-.3,0,.3,.6]){const rib=k.box(g,gold,Math.sin(a)*.23,.79,.08,.025,.92,.025);rib.rotation.z=-a;}star(k,g,0,1.07,.18,cream,.1);
  }else if(shape==='harp'){
    const arc=k.mesh(new T.TorusGeometry(.38,.075,6,18,Math.PI*1.4),gold,0,.92,0,g);arc.rotation.z=-.6;k.box(g,c,.32,.9,0,.13,.83,.15);
    for(const x of [-.18,-.04,.1,.24])k.box(g,cream,x,.92,.06,.015,.62,.015);star(k,g,.29,1.3,.13);
  }else if(shape==='paw'){
    shaft();k.ball(g,cream,0,1,0,.35,.29,.15);k.ball(g,0xf18fa5,0,1,.15,.19,.14,.04);for(const x of [-.27,-.09,.09,.27]){k.ball(g,cream,x,1.3-Math.abs(x)*.3,0,.12,.18,.12);k.ball(g,0xf18fa5,x,1.32-Math.abs(x)*.3,.11,.06,.08,.025);}
  }else if(shape==='umbrella'){
    shaft();k.mesh(new T.ConeGeometry(.57,.4,12,1,true),c,0,1.1,0,g);star(k,g,0,1.19,.13,gold,.34);
  }else if(shape==='water'){
    k.box(g,c,0,.7,0,.59,.45,.36);const spout=k.cylinder(g,gold,.39,.85,0,.08,.1,.42,8);spout.rotation.z=-1;const handle=k.mesh(new T.TorusGeometry(.23,.045,6,14,Math.PI),gold,0,1,0,g);star(k,g,0,.73,.14,gold,.21);
  }else if(shape==='ladle'||shape==='bell'||shape==='flail'){
    shaft();k.ball(g,c,0,1.06,0,.34,.25,.22);k.cylinder(g,gold,0,1.2,0,.3,.34,.07,12);star(k,g,0,1.05,.13,cream,.24);
  }else{
    shaft();grip();const size=id===7?.35:.28;
    if(mark==='flower'||mark==='sun')for(let i=0;i<6;i++)k.ball(g,c,Math.cos(i*Math.PI/3)*.27,1.11+Math.sin(i*Math.PI/3)*.27,0,.15,.16,.09);
    if(mark==='star'||mark==='sun')star(k,g,0,1.11,size,c,.04);
    else k.mesh(new T.OctahedronGeometry(size),c,0,1.11,0,g);
    k.ball(g,cream,-.08,1.2,.22,.065,.09,.025);k.mesh(new T.TorusGeometry(.32,.035,6,18,Math.PI),gold,0,1.05,0,g);
  }
  return g;
}

export function addInventoryOutfit(body:T.Group,id:number,k:SkywardKit){
  const g=new T.Group();g.name='inventory-outfit-'+id;const o=OUTFITS[id],type=OUTFIT_ART[id],rank=ITEM_RARITIES.indexOf(itemRarity('outfit',id,o.price));
  // Dark belt and large bright clasp separate jacket, trousers and cape at game distance.
  k.cylinder(g,ink,0,.5,0,.39,.43,.1,12);k.box(g,o.accent,0,.5,.41,.19,.13,.06);k.box(g,ink,0,.5,.45,.09,.06,.02);
  for(const side of [-1,1]){k.box(g,o.accent,side*.19,.16,.24,.26,.065,.04);if(rank>=2){k.ball(g,o.accent,side*.43,1.02,.01,.22,.1,.22);k.box(g,cream,side*.43,1.055,.17,.23,.035,.08);}}
  if(['cloak','queen','armor','wizard','ranger','bard','suit'].includes(type)&&id<26){
    const cape=plate(k,g,o.color,[[-.29,1.05],[-.58,.18],[-.24,.09],[0,.22],[.24,.09],[.58,.18],[.29,1.05]],-.35,.055);
    cape.rotation.x=.12;plate(k,g,o.accent,[[-.48,.23],[-.24,.16],[0,.29],[.24,.16],[.48,.23],[.5,.17],[.24,.1],[0,.22],[-.24,.1],[-.5,.17]],-.39,.025);
  }
  if(type==='armor'){plate(k,g,o.accent,[[-.28,.99],[0,.88],[.28,.99],[.24,.65],[0,.56],[-.24,.65]],.35,.05);star(k,g,0,.78,.12,o.color,.42);}
  else if(['suit','bard','ranger'].includes(type)){const sash=k.box(g,o.accent,-.025,.8,.35,.13,.48,.04);sash.rotation.z=.55;}
  else {for(const y of [.68,.81,.94])k.ball(g,o.accent,.09,y,.36,.035,.035,.02);}
  body.add(g);return g;
}

/** Bounded, reusable toon materials; no lights or bloom pass per equipped item. */
export function styleEquipment(root:T.Object3D,rank:number,glowColor:number){
  const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
  for(const m of meshes){const old=m.material;if(!(old instanceof T.MeshStandardMaterial)||old.transparent)continue;
    m.material=toon(old.color.getHex());
    const outline=new T.Mesh(m.geometry,rim);outline.name='equipment-outline';outline.scale.setScalar(1.065);outline.userData.equipmentOutline=true;m.add(outline);
  }
  if(rank>=3){const sparkles=new T.Group();sparkles.name='equipment-glow';sparkles.userData.equipmentEffect=true;
    for(let i=0;i<(rank===4?4:2);i++){const m=new T.Mesh(new T.OctahedronGeometry(.045),toon(glowColor));m.position.set(Math.cos(i*2.4)*.42,.6+i*.22,.17+Math.sin(i*2.4)*.14);sparkles.add(m);}root.add(sparkles);}
}
export function updateEquipmentEffects(root:T.Object3D,time:number,low=false,reduced=false){
  let effects=root.userData.equipmentEffects as T.Object3D[]|undefined;
  if(!effects){effects=[];root.traverse(o=>{if(o.userData.equipmentEffect)effects!.push(o);});root.userData.equipmentEffects=effects;}
  for(const g of effects){g.visible=!low;g.rotation.y=reduced?0:Math.sin(time*.7)*.15;g.children.forEach((m,i)=>{m.rotation.z=reduced?Math.PI/4:time*.5+i;m.scale.setScalar(reduced?1:.85+Math.sin(time*2+i)*.15);});}
}
