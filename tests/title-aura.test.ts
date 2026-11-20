import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from 'three';
import {createTitleAura} from '../src/title-aura';
import type {TitleDefinition,TitleId,TitleStyle} from '../src/titles';

const titles:TitleDefinition[]=(
  [['level-50','leaf'],['level-100','star'],['level-300','divine'],['level-500','divine'],['level-1000','star'],['ppojjaki','pet'],['grade-3','study'],['multiplication','study'],['expedition-10','explorer'],['math-friend','study']] as [TitleId,TitleStyle][]
).map(([id,style])=>({id,style,name:id,icon:'',requirement:''}));
function meshes(root:T.Group){const result:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)result.push(o);});return result;}
function snapshot(root:T.Group){return meshes(root).map(mesh=>({position:mesh.position.toArray(),rotation:mesh.rotation.toArray(),matrix:mesh instanceof T.InstancedMesh?Array.from(mesh.instanceMatrix.array):[]}));}

for(const title of titles)test(title.id+': bounded geometry, six motes, deterministic animation and stable buffers',()=>{
  const aura=createTitleAura(title),draws=meshes(aura.root);
  assert.ok(draws.length<=4);
  assert.equal(draws.filter(m=>m instanceof T.InstancedMesh).length,1);
  const motes=draws.find(m=>m instanceof T.InstancedMesh) as T.InstancedMesh;
  assert.equal(motes.count,6);
  const originalBuffers=draws.map(m=>m.geometry.attributes.position.array),instanceBuffer=motes.instanceMatrix.array;
  for(const time of [0,.5,3,45,3599,-20,Number.MAX_VALUE,Infinity,NaN]){
    aura.update(time,true);
    for(const mesh of draws){
      if(mesh instanceof T.InstancedMesh){mesh.computeBoundingBox();assert.ok(Array.from(mesh.instanceMatrix.array).every(Number.isFinite));}
    }
    aura.root.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(aura.root);
    assert.ok(bounds.min.y>=-.01&&bounds.max.y<=2.6,JSON.stringify(bounds));
    // A square bound alone would miss diagonal radius violations. Check every vertex/instance.
    const vertex=new T.Vector3(),matrix=new T.Matrix4();
    for(const mesh of draws){
      const attribute=mesh.geometry.getAttribute('position');
      for(let instance=0;instance<(mesh instanceof T.InstancedMesh?mesh.count:1);instance++){
        if(mesh instanceof T.InstancedMesh){mesh.getMatrixAt(instance,matrix);matrix.premultiply(mesh.matrixWorld);}else matrix.copy(mesh.matrixWorld);
        for(let i=0;i<attribute.count;i++){
          vertex.fromBufferAttribute(attribute,i).applyMatrix4(matrix);
          assert.ok(Math.hypot(vertex.x,vertex.z)<=1.2,'foot radius exceeded');
          assert.ok(Number.isFinite(vertex.x)&&Number.isFinite(vertex.y)&&Number.isFinite(vertex.z));
        }
      }
      const hits:T.Intersection[]=[];mesh.raycast(new T.Raycaster(),hits);assert.equal(hits.length,0);
    }
  }
  aura.update(14.2);const expected=snapshot(aura.root);
  for(let i=0;i<1000;i++)aura.update(i*.016,i%2===0);
  aura.update(14.2);assert.deepEqual(snapshot(aura.root),expected);
  assert.equal(aura.root.children.length,draws.length);
  assert.equal(motes.instanceMatrix.array,instanceBuffer);
  draws.forEach((m,i)=>assert.equal(m.geometry.attributes.position.array,originalBuffers[i]));
  assert.ok(!aura.root.children.some(child=>child instanceof T.Light));
  aura.dispose();
});

test('owned resources are disposed exactly once, including the instance buffer',()=>{
  const scene=new T.Scene(),aura=createTitleAura(titles[4]);scene.add(aura.root);
  const resources=new Set<T.BufferGeometry|T.Material|T.InstancedMesh>();
  for(const mesh of meshes(aura.root)){
    resources.add(mesh.geometry);
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])resources.add(material);
    if(mesh instanceof T.InstancedMesh)resources.add(mesh);
  }
  const counts=new Map<object,number>();
  for(const resource of resources){
    const count=()=>{counts.set(resource,(counts.get(resource)??0)+1);};
    if(resource instanceof T.BufferGeometry)resource.addEventListener('dispose',count);
    else if(resource instanceof T.Material)resource.addEventListener('dispose',count);
    else resource.addEventListener('dispose',count);
  }
  aura.dispose();aura.dispose();aura.update(Infinity);
  assert.equal(aura.root.parent,null);assert.equal(aura.root.children.length,0);
  for(const resource of resources)assert.equal(counts.get(resource),1);
});

test('nine themes have distinct main sculpture silhouettes',()=>{
  const signatures=new Set<string>();
  for(const title of titles.filter(t=>t.id!=='multiplication')){
    const aura=createTitleAura(title),figure=meshes(aura.root)[1];
    signatures.add(JSON.stringify(Array.from(figure.geometry.attributes.position.array)));
    aura.dispose();
  }
  assert.equal(signatures.size,9);
});

