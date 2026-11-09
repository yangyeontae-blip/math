import {renderTitle} from './titles';
import {animateSkywardTree} from './skyward-art';
import type {PlazaChatMessage} from './plaza-social';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {profileTitles,PLAZA_EMOTES,PLAZA_CAPACITY,type PlazaProfile,type PlazaPlayer,type PlazaEmote} from './plaza-protocol';
type Model={root:T.Group;avatar:T.Group;pet:T.Group|null;dispose:()=>void};
type Actor={state:PlazaPlayer;position:T.Vector3;angle:number;label:HTMLDivElement;name:HTMLElement;title:HTMLElement;bubble:HTMLElement;emoteUntil:number;phase:number;signature:string;appearance:string;model:Model|null};
/** Merge opaque static pieces, keeping legs/arms and shader/instanced hair available for animation. */
export function mergePlazaAvatar(root:T.Group){
 root.updateMatrixWorld(true);const body=root.userData.body as T.Group|undefined;
 const keep=new Set<T.Object3D>([...(root.userData.feet??[]),...(root.userData.arms??[]),...(root.userData.hands??[]),...(root.userData.eyes??[])]);
 root.traverse(o=>{for(const part of o.userData.skywardMotion??[])keep.add(part.object);});
 const groups=new Map<T.Object3D,{geometry:T.BufferGeometry;mesh:T.Mesh}[]>();
 root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||Array.isArray(o.material)||!o.visible)return;let at:T.Object3D|null=o,anchor:T.Object3D=root;while(at&&at!==root){if(!at.visible||keep.has(at))return;if(at===body)anchor=body;at=at.parent;}
  const material=o.material as T.MeshStandardMaterial;if(!material.color||material.map||material.transparent||material.emissive?.getHex())return;
  let geo=o.geometry.clone();if(geo.index){const next=geo.toNonIndexed();geo.dispose();geo=next;}geo.applyMatrix4(new T.Matrix4().copy(anchor.matrixWorld).invert().multiply(o.matrixWorld));if(!geo.getAttribute('normal'))geo.computeVertexNormals();for(const key of Object.keys(geo.attributes))if(!['position','normal'].includes(key))geo.deleteAttribute(key);
  const colors=new Float32Array(geo.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=material.color.r;colors[i+1]=material.color.g;colors[i+2]=material.color.b;}geo.setAttribute('color',new T.BufferAttribute(colors,3));const parts=groups.get(anchor)??[];parts.push({geometry:geo,mesh:o});groups.set(anchor,parts);
 });
 const owned:T.Material[]=[];for(const [anchor,parts] of groups){const merged=mergeGeometries(parts.map(p=>p.geometry));parts.forEach(p=>p.geometry.dispose());if(!merged)continue;const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.82,side:T.DoubleSide}),mesh=new T.Mesh(merged,material);mesh.name='plaza-preserved-body';mesh.castShadow=mesh.receiveShadow=true;anchor.add(mesh);parts.forEach(p=>p.mesh.visible=false);owned.push(material);}
 return ()=>owned.forEach(m=>m.dispose());
}

const SPEECH_MS=7000;
type Speech={id:string;senderId:string;expires:number;width:number;height:number;viewport:number};
type LabelRect={x:number;top:number;bottom:number;width:number};
/** Prefer above the avatar; use a nearby free column when stacked greetings reach the top of a short screen. */
export function placePlazaLabel(x:number,y:number,width:number,height:number,viewportWidth:number,viewportHeight:number,occupied:readonly LabelRect[]){
 const minX=8+width/2,maxX=viewportWidth-8-width/2;if(minX>maxX||height>viewportHeight-33)return null;
 const clamp=(v:number)=>Math.max(minX,Math.min(maxX,v));
 const columns=[...new Set([clamp(x),...occupied.flatMap(r=>[clamp(r.x+(r.width+width)/2+6),clamp(r.x-(r.width+width)/2-6)])])].sort((a,b)=>Math.abs(a-x)-Math.abs(b-x));
 for(const candidate of columns){let bottom=Math.min(y,viewportHeight-8);
  for(let attempt=0;attempt<=occupied.length;attempt++){const overlap=occupied.filter(r=>Math.abs(r.x-candidate)<(r.width+width)/2+4&&bottom>r.top-4&&bottom-height<r.bottom+4);if(!overlap.length)break;bottom=Math.min(...overlap.map(r=>r.top))-5;}
  if(bottom-height>=25)return {x:candidate,y:bottom};
 }
 return null;
}
export class PlazaWorld {
 private peers=new Map<string,Actor>();private speeches=new Map<HTMLElement,Speech>();private self:T.Group|null=null;private own:ReturnType<PlazaWorld['label']>;private selfProfile:PlazaProfile|null=null;private selfSignature='';
 private farRoot=new T.Group();private far:{mesh:T.InstancedMesh;offset:T.Vector3;scale:T.Vector3;color:(p:PlazaProfile)=>number}[]=[];private matrix=new T.Matrix4();private quaternion=new T.Quaternion();private projected=new T.Vector3();private targetPosition=new T.Vector3();private partPosition=new T.Vector3();private partColor=new T.Color();private clock=0;
 constructor(private scene:T.Scene,private layer:HTMLElement,private factory:(p:PlazaProfile)=>Model,private colors:(p:PlazaProfile)=>{body:number;hair:number;skin:number}){
  this.own=this.label(true);
  const part=(geometry:T.BufferGeometry,offset:T.Vector3,scale:T.Vector3,color:(p:PlazaProfile)=>number)=>{const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({roughness:.9}),PLAZA_CAPACITY);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;this.farRoot.add(mesh);this.far.push({mesh,offset,scale,color});};
  part(new T.CylinderGeometry(.31,.46,.88,10),new T.Vector3(0,.67,0),new T.Vector3(1,1,1),p=>colors(p).body);
  part(new T.SphereGeometry(.53,12,8),new T.Vector3(0,1.5,0),new T.Vector3(1,.98,.87),p=>colors(p).skin);
  part(new T.SphereGeometry(.555,12,8,0,Math.PI*2,0,Math.PI*.455),new T.Vector3(0,1.51,-.04),new T.Vector3(1,1.03,.89),p=>colors(p).hair);
  for(const x of [-.15,.15])part(new T.SphereGeometry(.065,6,5),new T.Vector3(x,1.53,.47),new T.Vector3(1,1,1),()=>0x362b26);
  for(const x of [-.18,.18])part(new T.SphereGeometry(.17,6,5),new T.Vector3(x,.18,.07),new T.Vector3(1,1,1.4),()=>0x574840);
  for(const side of [-1,1]){part(new T.CylinderGeometry(.17,.2,.55,8),new T.Vector3(side*.4,.85,0),new T.Vector3(1,1,1),p=>colors(p).body);part(new T.SphereGeometry(.16,8,6),new T.Vector3(side*.49,.57,.02),new T.Vector3(1,1,1),p=>colors(p).skin);}
  part(new T.TorusGeometry(.075,.018,4,10,Math.PI),new T.Vector3(0,1.3,.47),new T.Vector3(1,1,1),()=>0x694438);
  this.farRoot.name='plaza-distant-avatars';
 }
 private label(self=false){const root=document.createElement('div');root.className='plaza-nameplate'+(self?' is-self':'');root.hidden=true;const name=document.createElement('strong'),title=document.createElement('span'),bubble=document.createElement('b');bubble.className='plaza-emote';bubble.hidden=true;const speech=document.createElement('div'),text=document.createElement('span');speech.className='plaza-speech';speech.hidden=true;speech.setAttribute('aria-hidden','true');speech.append(text);root.append(speech,name,title,bubble);this.layer.append(root);return {root,name,title,bubble};}
 private identity(label:ReturnType<PlazaWorld['label']>,p:PlazaProfile,role='player'){const text=profileTitles(p);label.name.textContent='Lv. '+p.level+' '+text.nickname;if(role==='operator'){const badge=document.createElement('small');badge.className='operator-mark';badge.textContent='운영자';label.name.append(badge);}label.title.innerHTML=text.definition?renderTitle(text.definition):'';label.root.classList.toggle('is-legendary',text.legendary);label.root.dataset.nameLength=String(text.nickname.length+String(p.level).length+5+(role==='operator'?4:0));label.root.dataset.titleLength=String(text.title.length);label.root.dataset.plateWidth=String(Math.min(210,Math.max((text.nickname.length+String(p.level).length+7)*14,(text.title.length+2)*11)));}
 setSelf(profile:PlazaProfile|null,player:T.Group,role='player'){this.self=player;this.selfProfile=profile;const signature=JSON.stringify([profile,role]);if(profile&&signature!==this.selfSignature)this.identity(this.own,profile,role);if(!profile)this.own.root.hidden=true;this.selfSignature=signature;}
 upsert(player:PlazaPlayer){let actor=this.peers.get(player.id);const signature=JSON.stringify([player.profile,player.role]);const p=player.profile,appearance=JSON.stringify([p.character,p.outfit,p.weapon,p.outfitLevel,p.weaponLevel,p.hairstyle,p.face,p.pet,p.ride]);
  if(!actor){const label=this.label();actor={state:player,position:new T.Vector3(player.pose.x,player.pose.y,player.pose.z),angle:player.pose.angle,label:label.root,name:label.name,title:label.title,bubble:label.bubble,emoteUntil:0,phase:0,signature,appearance,model:null};this.peers.set(player.id,actor);label.root.dataset.playerId=player.id;this.identity(label,player.profile,player.role);}
  else {actor.state=player;if(signature!==actor.signature){if(appearance!==actor.appearance){actor.model?.root.removeFromParent();actor.model?.dispose();actor.model=null;actor.appearance=appearance;}actor.signature=signature;this.identity({root:actor.label,name:actor.name,title:actor.title,bubble:actor.bubble},player.profile,player.role);}}
 }
 remove(id:string){const actor=this.peers.get(id);if(!actor)return;this.removeSpeech(actor.label);actor.label.remove();actor.model?.root.removeFromParent();actor.model?.dispose();this.peers.delete(id);}
 clearPeers(){this.clearSpeech();for(const id of [...this.peers.keys()])this.remove(id);for(const part of this.far)part.mesh.count=0;}
 detach(){this.clearPeers();this.farRoot.removeFromParent();}
 emote(id:string,emote:PlazaEmote){const actor=this.peers.get(id);if(!actor)return;actor.bubble.textContent=PLAZA_EMOTES[emote];actor.bubble.hidden=false;actor.emoteUntil=this.clock+3;}
 selfEmote(emote:PlazaEmote){this.own.bubble.textContent=PLAZA_EMOTES[emote];this.own.bubble.hidden=false;this.own.bubble.dataset.until=String(this.clock+3);}
 speak(playerId:string|null,message:PlazaChatMessage){
  const label=playerId===null?this.own.root:this.peers.get(playerId)?.label;if(!label)return;
  const speech=label.firstElementChild as HTMLElement;const existing=this.speeches.get(label);if(existing?.id===message.id)return;
  speech.firstElementChild!.textContent=message.text;speech.hidden=false;label.classList.add('is-speaking');
  this.speeches.set(label,{id:message.id,senderId:message.senderId,expires:performance.now()+SPEECH_MS,width:speech.offsetWidth,height:speech.offsetHeight,viewport:this.layer.clientWidth});
 }
 clearSpeech({messageId,senderId}:{messageId?:string;senderId?:string}={}){
  for(const [label,speech] of this.speeches)if((!messageId||speech.id===messageId)&&(!senderId||speech.senderId===senderId))this.removeSpeech(label);
 }
 private removeSpeech(label:HTMLElement){
  if(!this.speeches.delete(label))return;const speech=label.firstElementChild as HTMLElement;speech.hidden=true;speech.firstElementChild!.textContent='';label.classList.remove('is-speaking');
 }
 private place(label:HTMLElement,position:T.Vector3,height:number,camera:T.Camera,width:number,heightPx:number,visible:boolean,occupied:LabelRect[]){
  this.projected.copy(position);this.projected.y+=height;this.projected.project(camera);let hidden=!visible||this.projected.z>1||Math.abs(this.projected.x)>1.05||Math.abs(this.projected.y)>1.05;
  const speech=this.speeches.get(label);
  // Only read layout after a new message or a viewport resize, never on every frame.
  if(speech&&!label.hidden&&(speech.viewport!==width||!speech.height)){const bubble=label.firstElementChild as HTMLElement;speech.width=bubble.offsetWidth;speech.height=bubble.offsetHeight;speech.viewport=width;}
  const x=(this.projected.x*.5+.5)*width,y=(-this.projected.y*.5+.5)*heightPx;const compact=width<650,identityWidth=Math.min(compact?165:210,Number(label.dataset.plateWidth??160)),plateWidth=speech?Math.max(identityWidth,speech.width||(compact?165:210)):identityWidth,titleRows=Math.max(1,Math.ceil(Number(label.dataset.titleLength??0)*(compact?10:11)/(identityWidth-16))),nameRows=Math.max(1,Math.ceil(Number(label.dataset.nameLength??0)*(compact?11:12)/(Math.min(identityWidth,compact?150:190)-16))),plateHeight=(compact?25:29)*nameRows+titleRows*(compact?13:14.3)+13+(speech?(speech.height?speech.height+11:compact?70:76):(label.lastElementChild as HTMLElement)?.hidden===false?46:0);
  const placed=hidden?null:placePlazaLabel(x,y,plateWidth,plateHeight,width,heightPx,occupied);hidden=!placed;
  if(label.hidden!==hidden)label.hidden=hidden;if(placed){const transform='translate(-50%,-100%) translate('+Math.round(placed.x)+'px,'+Math.round(placed.y)+'px)';if(label.style.transform!==transform)label.style.transform=transform;occupied.push({x:placed.x,top:placed.y-plateHeight,bottom:placed.y,width:plateWidth});}
 }

 update(dt:number,camera:T.Camera,player:T.Group,showPeers:boolean,active:boolean,low:boolean,reduced:boolean){
  this.clock+=dt;const now=performance.now();for(const [label,speech] of this.speeches)if(speech.expires<=now)this.removeSpeech(label);const width=this.layer.clientWidth,height=this.layer.clientHeight;const occupied:{x:number;top:number;bottom:number;width:number}[]=[];
  const ownEffect=active&&!low&&!reduced;if(this.own.root.classList.contains('has-title-effects')!==ownEffect)this.own.root.classList.toggle('has-title-effects',ownEffect);
  if(this.selfProfile)this.place(this.own.root,player.position,this.selfProfile.ride>=0?4.4:3,camera,width,height,active,occupied);
  if(Number(this.own.bubble.dataset.until??0)<this.clock)this.own.bubble.hidden=true;
  if(!showPeers){if(this.peers.size)this.clearPeers();this.farRoot.removeFromParent();return;}
  if(this.farRoot.parent!==this.scene)this.scene.add(this.farRoot);
  const sorted=[...this.peers.values()].sort((a,b)=>a.position.distanceToSquared(player.position)-b.position.distanceToSquared(player.position));let farCount=0,nearCount=0,effectCount=0;
  for(const actor of sorted){
   const target=actor.state.pose,p=actor.state.profile,beforeX=actor.position.x,beforeZ=actor.position.z;
   actor.position.lerp(this.targetPosition.set(target.x,target.y,target.z),1-Math.exp(-dt*14));actor.angle+=Math.atan2(Math.sin(target.angle-actor.angle),Math.cos(target.angle-actor.angle))*(1-Math.exp(-dt*14));
   const moving=Math.hypot(actor.position.x-beforeX,actor.position.z-beforeZ)>.002;actor.phase+=dt*(moving?12:2);
   const detail=nearCount<(low?6:10)&&actor.position.distanceToSquared(player.position)<625;if(detail)nearCount++;
   if(detail&&!actor.model){actor.model=this.factory(p);this.scene.add(actor.model.root);}
   if(actor.model){actor.model.root.visible=detail;actor.model.root.position.copy(actor.position);actor.model.avatar.rotation.y=actor.angle;
    const body=actor.model.avatar.userData.body as T.Group|undefined;if(body)body.position.y=(p.ride>=0?Number(body.userData.plazaRideHeight??0):0)+(reduced?0:Math.sin(actor.phase*.2)*.012);
    const feet=(actor.model.avatar.userData.feet??[]) as T.Mesh[];feet.forEach((foot,i)=>foot.position.y=.18+(moving&&!reduced?Math.max(0,Math.sin(actor.phase+i*Math.PI))*.12:0));
    if(actor.model.pet){actor.model.pet.position.set(-1,.1+(moving&&!reduced?Math.abs(Math.sin(actor.phase))*.12:0),1);actor.model.pet.rotation.y=actor.angle;}
    animateSkywardTree(actor.model.root,this.clock,moving,reduced);
    if(!detail&&actor.position.distanceToSquared(player.position)>625){actor.model.root.removeFromParent();actor.model.dispose();actor.model=null;}
   }
   if(!detail){for(const part of this.far){const offset=this.partPosition.copy(part.offset);if(p.ride>=0)offset.y+=.7;offset.applyAxisAngle(T.Object3D.DEFAULT_UP,actor.angle).add(actor.position);this.quaternion.setFromAxisAngle(T.Object3D.DEFAULT_UP,actor.angle);this.matrix.compose(offset,this.quaternion,part.scale);part.mesh.setMatrixAt(farCount,this.matrix);part.mesh.setColorAt(farCount,this.partColor.setHex(part.color(p)));}farCount++;}
   actor.bubble.hidden=this.clock>actor.emoteUntil;
   const effect=active&&!low&&!reduced&&effectCount<3&&actor.position.distanceToSquared(player.position)<225&&!!profileTitles(p).definition;if(effect)effectCount++;if(actor.label.classList.contains('has-title-effects')!==effect)actor.label.classList.toggle('has-title-effects',effect);
   this.place(actor.label,actor.position,p.ride>=0?4.4:3,camera,width,height,active,occupied);
  }
  const cached=sorted.filter(a=>a.model&&!a.model.root.visible).reverse();let total=sorted.filter(a=>a.model).length;for(const a of cached){if(total<=(low?8:14))break;a.model!.root.removeFromParent();a.model!.dispose();a.model=null;total--;}
  for(const part of this.far){part.mesh.count=farCount;part.mesh.instanceMatrix.needsUpdate=true;if(part.mesh.instanceColor)part.mesh.instanceColor.needsUpdate=true;}
 }
}
