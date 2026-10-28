import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {salonHairModel,salonFaceModel,salonGeometryCount,isSalonSharedGeometry,disposeSalonMaterials} from '../src/salon-models';

function signature(root:T.Group){const parts:string[]=[];root.updateMatrixWorld(true);root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');parts.push(JSON.stringify([o.geometry.type,p.count,Array.from(p.array).filter((_,i)=>i%13===0),o.position.toArray(),o.scale.toArray(),o.rotation.toArray().slice(0,3)]));}});return parts.join('|');}
function validate(root:T.Group){let count=0;root.traverse(o=>{if(o instanceof T.Mesh){count++;assert.ok(isSalonSharedGeometry(o.geometry));assert.ok(Array.from(o.geometry.getAttribute('position').array).every(Number.isFinite));}});assert.ok(count>0&&count<60);const bounds=new T.Box3().setFromObject(root);assert.ok(bounds.min.y>.6&&bounds.max.y<2.7);assert.ok(bounds.min.x>-.95&&bounds.max.x<.95);assert.ok(bounds.min.z>-.95&&bounds.max.z<.6);}

test('all ten salon hairstyles have distinct bounded 3D geometry and recognizable silhouettes',()=>{
 const variants=Array.from({length:10},(_,i)=>salonHairModel(i,0x67483b,0x91c5ae));
 variants.forEach(validate);assert.equal(new Set(variants.map(signature)).size,10);
 const feature=(i:number,text:string)=>{let found=false;variants[i].traverse(o=>{if(o.name.includes(text))found=true;});assert.ok(found,text);};
 for(const [id,name]of [[1,'pigtail'],[2,'bob-curtain'],[3,'chestnut-wave'],[4,'high-ponytail'],[5,'bun-spiral'],[6,'braid'],[7,'single-round-bun'],[8,'long-wave'],[9,'sun-circlet']] as const)feature(id,name);
 const boxes=variants.map(g=>new T.Box3().setFromObject(g));assert.ok(boxes[1].max.x>boxes[0].max.x+.1);assert.ok(boxes[8].min.y<boxes[2].min.y-.2);assert.ok(boxes[4].min.z<boxes[0].min.z-.15);
 variants.forEach(disposeSalonMaterials);
});
test('all fourteen salon faces use visibly different geometry and expose blink meshes',()=>{
 const variants=Array.from({length:14},(_,i)=>salonFaceModel(i));variants.forEach(validate);assert.equal(new Set(variants.map(signature)).size,14);
 for(const model of variants){assert.ok(model.userData.eyes.length>=2);for(const eye of model.userData.eyes){assert.ok(eye instanceof T.Mesh);assert.ok(Number.isFinite(eye.userData.blinkHeight)&&eye.userData.blinkHeight>0);assert.equal(eye.scale.y,eye.userData.blinkHeight);const center=new T.Box3().setFromObject(eye).getCenter(new T.Vector3());eye.scale.y*=.12;const blinkCenter=new T.Box3().setFromObject(eye).getCenter(new T.Vector3());assert.ok(Math.abs(center.y-blinkCenter.y)<.025,'blink stays on the face');eye.scale.y=eye.userData.blinkHeight;}}
 for(const [id,name]of [[3,'cat-mouth'],[4,'star-eye'],[6,'bunny-tooth'],[7,'heart-eye'],[8,'lightning-eye'],[9,'rainbow'],[10,'sun-crescent'],[11,'honey-drop'],[12,'flower-eye'],[13,'forest-star']] as const){let found=false;variants[id].traverse(o=>{if(o.name.includes(name))found=true;});assert.ok(found,name);}
 variants.forEach(disposeSalonMaterials);
});
test('hair color stays character-specific and invalid selections fall back to the original style',()=>{
 for(const color of [0x49372f,0xd4aa69,0x453d60]){const model=salonHairModel(0,color,0xe5ad8b);const cap=model.getObjectByName('hair-crown') as T.Mesh;assert.equal((cap.material as T.MeshStandardMaterial).color.getHex(),color);disposeSalonMaterials(model);}
 assert.equal(signature(salonHairModel(-1,0x49372f,0xe5ad8b)),signature(salonHairModel(0,0x49372f,0xe5ad8b)));
 assert.equal(signature(salonFaceModel(NaN)),signature(salonFaceModel(0)));
});
test('rebuilding salon previews reuses a bounded geometry library and disposes only owned materials',()=>{
 const first=salonHairModel(6,0x49372f,0xe5ad8b),before=salonGeometryCount();
 const next=salonHairModel(6,0x49372f,0xe5ad8b);assert.equal(salonGeometryCount(),before);assert.ok(before<256);
 let disposed=0;const materials=first.userData.salonMaterials as T.Material[];materials.forEach(m=>m.addEventListener('dispose',()=>disposed++));
 const geometry=(first.getObjectByName('hair-crown') as T.Mesh).geometry;let geometryDisposed=false;geometry.addEventListener('dispose',()=>{geometryDisposed=true;});
 const wrapper=new T.Group();wrapper.add(first);disposeSalonMaterials(wrapper);disposeSalonMaterials(wrapper);assert.equal(disposed,materials.length);assert.equal(geometryDisposed,false);
 assert.equal((next.getObjectByName('hair-crown') as T.Mesh).geometry,geometry);disposeSalonMaterials(next);
});
