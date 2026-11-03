import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {profileTitles,PLAZA_EMOTES,PLAZA_CAPACITY,type PlazaProfile,type PlazaPlayer,type PlazaEmote} from './plaza-protocol';
type Model={root:T.Group;avatar:T.Group;pet:T.Group|null;dispose:()=>void};
type Actor={state:PlazaPlayer;position:T.Vector3;angle:number;label:HTMLDivElement;name:HTMLElement;title:HTMLElement;bubble:HTMLElement;emoteUntil:number;phase:number;signature:string;model:Model|null};
/** Merge opaque static pieces, keeping legs/arms and shader/instanced hair available for animation. */
export function mergePlazaAvatar(root:T.Group){
 root.updateMatrixWorld(true);const pieces:T.BufferGeometry[]=[];const keep=new Set<T.Object3D>([...(root.userData.feet??[]),...(root.userData.arms??[]),...(root.userData.hands??[])]);
 const inverse=root.matrixWorld.clone().invert();
 root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||Array.isArray(o.material)||!o.visible)return;let p:T.Object3D|null=o;while(p&&p!==root){if(!p.visible||keep.has(p))return;p=p.parent;}
  const material=o.material as T.MeshStandardMaterial;if(!material.color||material.map||material.transparent||material.emissive?.getHex())return;
  let geo=o.geometry.clone();if(geo.index){const next=geo.toNonIndexed();geo.dispose();geo=next;}geo.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(!geo.getAttribute('normal'))geo.computeVertexNormals();
  for(const key of Object.keys(geo.attributes))if(!['position','normal'].includes(key))geo.deleteAttribute(key);
  const colors=new Float32Array(geo.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=material.color.r;colors[i+1]=material.color.g;colors[i+2]=material.color.b;}geo.setAttribute('color',new T.BufferAttribute(colors,3));pieces.push(geo);o.visible=false;
 });
 const merged=pieces.length?mergeGeometries(pieces):null;pieces.forEach(g=>g.dispose());if(!merged)return ()=>{};
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.82});const mesh=new T.Mesh(merged,material);mesh.castShadow=true;root.add(mesh);return ()=>material.dispose();
}
export class PlazaWorld {
 private peers=new Map<string,Actor>();private self:T.Group|null=null;private own:ReturnType<PlazaWorld['label']>;private selfProfile:PlazaProfile|null=null;private selfSignature='';
 private farRoot=new T.Group();private far:{mesh:T.InstancedMesh;offset:T.Vector3;scale:T.Vector3;color:(p:PlazaProfile)=>number}[]=[];private matrix=new T.Matrix4();private quaternion=new T.Quaternion();private projected=new T.Vector3();private targetPosition=new T.Vector3();private partPosition=new T.Vector3();private partColor=new T.Color();private clock=0;
 constructor(private scene:T.Scene,private layer:HTMLElement,private factory:(p:PlazaProfile)=>Model,private colors:(p:PlazaProfile)=>{body:number;hair:number;skin:number}){
  this.own=this.label(true);
  const part=(geometry:T.BufferGeometry,offset:T.Vector3,scale:T.Vector3,color:(p:PlazaProfile)=>number)=>{const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({roughness:.9}),PLAZA_CAPACITY);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;this.farRoot.add(mesh);this.far.push({mesh,offset,scale,color});};
  part(new T.CapsuleGeometry(.33,.38,3,8),new T.Vector3(0,.7,0),new T.Vector3(1,1,1),p=>colors(p).body);
  part(new T.SphereGeometry(.43,10,7),new T.Vector3(0,1.5,0),new T.Vector3(1,1,1),p=>colors(p).skin);
  part(new T.SphereGeometry(.46,10,6,0,Math.PI*2,0,Math.PI*.48),new T.Vector3(0,1.53,0),new T.Vector3(1,1,1),p=>colors(p).hair);
  for(const x of [-.15,.15])part(new T.SphereGeometry(.065,6,5),new T.Vector3(x,1.53,.39),new T.Vector3(1,1,1),()=>0x362b26);
  for(const x of [-.18,.18])part(new T.SphereGeometry(.17,6,5),new T.Vector3(x,.18,.07),new T.Vector3(1,1,1.4),()=>0x574840);
  this.farRoot.name='plaza-distant-avatars';
 }
 private label(self=false){const root=document.createElement('div');root.className='plaza-nameplate'+(self?' is-self':'');root.hidden=true;const name=document.createElement('strong'),title=document.createElement('span'),bubble=document.createElement('b');bubble.className='plaza-emote';bubble.hidden=true;root.append(name,title,bubble);this.layer.append(root);return {root,name,title,bubble};}
 private identity(label:ReturnType<PlazaWorld['label']>,p:PlazaProfile){const text=profileTitles(p);label.name.textContent=text.nickname;label.title.textContent=text.title;label.root.classList.toggle('is-legendary',text.legendary);label.root.dataset.titleLength=String(text.title.length);label.root.dataset.plateWidth=String(Math.min(210,Math.max((text.nickname.length+2)*14,(text.title.length+2)*11)));}
 setSelf(profile:PlazaProfile|null,player:T.Group){this.self=player;this.selfProfile=profile;const signature=JSON.stringify(profile);if(profile&&signature!==this.selfSignature)this.identity(this.own,profile);if(!profile)this.own.root.hidden=true;this.selfSignature=signature;}
 upsert(player:PlazaPlayer){let actor=this.peers.get(player.id);const signature=JSON.stringify(player.profile);
  if(!actor){const label=this.label();actor={state:player,position:new T.Vector3(player.pose.x,player.pose.y,player.pose.z),angle:player.pose.angle,label:label.root,name:label.name,title:label.title,bubble:label.bubble,emoteUntil:0,phase:0,signature,model:null};this.peers.set(player.id,actor);label.root.dataset.playerId=player.id;this.identity(label,player.profile);}
  else {actor.state=player;if(signature!==actor.signature){actor.model?.root.removeFromParent();actor.model?.dispose();actor.model=null;actor.signature=signature;this.identity({root:actor.label,name:actor.name,title:actor.title,bubble:actor.bubble},player.profile);}}
 }
 remove(id:string){const actor=this.peers.get(id);if(!actor)return;actor.label.remove();actor.model?.root.removeFromParent();actor.model?.dispose();this.peers.delete(id);}
 clearPeers(){for(const id of [...this.peers.keys()])this.remove(id);for(const part of this.far)part.mesh.count=0;}
 detach(){this.clearPeers();this.farRoot.removeFromParent();}
 emote(id:string,emote:PlazaEmote){const actor=this.peers.get(id);if(!actor)return;actor.bubble.textContent=PLAZA_EMOTES[emote];actor.bubble.hidden=false;actor.emoteUntil=this.clock+3;}
 selfEmote(emote:PlazaEmote){this.own.bubble.textContent=PLAZA_EMOTES[emote];this.own.bubble.hidden=false;this.own.bubble.dataset.until=String(this.clock+3);}
 private place(label:HTMLElement,position:T.Vector3,height:number,camera:T.Camera,width:number,heightPx:number,visible:boolean,occupied:{x:number;top:number;bottom:number;width:number}[]){
  this.projected.copy(position);this.projected.y+=height;this.projected.project(camera);let hidden=!visible||this.projected.z>1||Math.abs(this.projected.x)>1.05||Math.abs(this.projected.y)>1.05;
  const x=(this.projected.x*.5+.5)*width;let y=(-this.projected.y*.5+.5)*heightPx;const compact=width<650,plateWidth=Math.min(compact?165:210,Number(label.dataset.plateWidth??160)),titleRows=Math.max(1,Math.ceil(Number(label.dataset.titleLength??0)*(compact?10:11)/(plateWidth-16))),plateHeight=(compact?25:29)+titleRows*(compact?13:14.3)+13+((label.lastElementChild as HTMLElement)?.hidden===false?46:0);
  if(!hidden){for(let attempt=0;attempt<64;attempt++){const overlap=occupied.filter(r=>Math.abs(r.x-x)<(r.width+plateWidth)/2+4&&y>r.top-4&&y-plateHeight<r.bottom+4);if(!overlap.length)break;y=Math.min(...overlap.map(r=>r.top))-5;}if(y-plateHeight<25)hidden=true;}
  if(label.hidden!==hidden)label.hidden=hidden;if(!hidden){const transform='translate(-50%,-100%) translate('+Math.round(x)+'px,'+Math.round(y)+'px)';if(label.style.transform!==transform)label.style.transform=transform;occupied.push({x,top:y-plateHeight,bottom:y,width:plateWidth});}
 }

 update(dt:number,camera:T.Camera,player:T.Group,showPeers:boolean,active:boolean,low:boolean,reduced:boolean){
  this.clock+=dt;const width=this.layer.clientWidth,height=this.layer.clientHeight;const occupied:{x:number;top:number;bottom:number;width:number}[]=[];
  if(this.selfProfile)this.place(this.own.root,player.position,this.selfProfile.ride>=0?4.4:3,camera,width,height,active,occupied);
  if(Number(this.own.bubble.dataset.until??0)<this.clock)this.own.bubble.hidden=true;
  if(!showPeers){if(this.peers.size)this.clearPeers();this.farRoot.removeFromParent();return;}
  if(this.farRoot.parent!==this.scene)this.scene.add(this.farRoot);
  const sorted=[...this.peers.values()].sort((a,b)=>a.position.distanceToSquared(player.position)-b.position.distanceToSquared(player.position));let farCount=0,nearCount=0;
  for(const actor of sorted){
   const target=actor.state.pose,p=actor.state.profile,beforeX=actor.position.x,beforeZ=actor.position.z;
   actor.position.lerp(this.targetPosition.set(target.x,target.y,target.z),1-Math.exp(-dt*14));actor.angle+=Math.atan2(Math.sin(target.angle-actor.angle),Math.cos(target.angle-actor.angle))*(1-Math.exp(-dt*14));
   const moving=Math.hypot(actor.position.x-beforeX,actor.position.z-beforeZ)>.002;actor.phase+=dt*(moving?12:2);
   const detail=nearCount<(low?4:8)&&actor.position.distanceToSquared(player.position)<225;if(detail)nearCount++;
   if(detail&&!actor.model){actor.model=this.factory(p);this.scene.add(actor.model.root);}
   if(actor.model){actor.model.root.visible=detail;actor.model.root.position.copy(actor.position);actor.model.avatar.rotation.y=actor.angle;
    const body=actor.model.avatar.userData.body as T.Group|undefined;if(body)body.position.y=(p.ride>=0?Number(body.userData.plazaRideHeight??0):0)+(reduced?0:Math.sin(actor.phase*.2)*.012);
    const feet=(actor.model.avatar.userData.feet??[]) as T.Mesh[];feet.forEach((foot,i)=>foot.position.y=.18+(moving&&!reduced?Math.max(0,Math.sin(actor.phase+i*Math.PI))*.12:0));
    if(actor.model.pet){actor.model.pet.position.set(-1,.1+(moving&&!reduced?Math.abs(Math.sin(actor.phase))*.12:0),1);actor.model.pet.rotation.y=actor.angle;}
    if(!detail&&actor.position.distanceToSquared(player.position)>625){actor.model.root.removeFromParent();actor.model.dispose();actor.model=null;}
   }
   if(!detail){for(const part of this.far){const offset=this.partPosition.copy(part.offset);if(p.ride>=0)offset.y+=.7;offset.applyAxisAngle(T.Object3D.DEFAULT_UP,actor.angle).add(actor.position);this.quaternion.setFromAxisAngle(T.Object3D.DEFAULT_UP,actor.angle);this.matrix.compose(offset,this.quaternion,part.scale);part.mesh.setMatrixAt(farCount,this.matrix);part.mesh.setColorAt(farCount,this.partColor.setHex(part.color(p)));}farCount++;}
   actor.bubble.hidden=this.clock>actor.emoteUntil;
   this.place(actor.label,actor.position,p.ride>=0?4.4:3,camera,width,height,active,occupied);
  }
  const cached=sorted.filter(a=>a.model&&!a.model.root.visible).reverse();let total=sorted.filter(a=>a.model).length;for(const a of cached){if(total<=(low?6:12))break;a.model!.root.removeFromParent();a.model!.dispose();a.model=null;total--;}
  for(const part of this.far){part.mesh.count=farCount;part.mesh.instanceMatrix.needsUpdate=true;if(part.mesh.instanceColor)part.mesh.instanceColor.needsUpdate=true;}
 }
}
