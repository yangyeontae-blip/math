import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { PLAZA_BERRY_TREES, berryTreeModel, cottageModel, plazaGarden, fountainModel, marketGarden, homesteadGarden } from '../src/village-art';
import { VILLAGE_SPOTS } from '../src/village-layout';

test('plaza landscape keeps all entrances, the notice board and teacher approaches clear',()=>{
 assert.equal(PLAZA_BERRY_TREES.length,7);
 for(const tree of PLAZA_BERRY_TREES){
  for(const goal of [{x:0,z:3},{x:0,z:8},{x:-20,z:2},VILLAGE_SPOTS.home,VILLAGE_SPOTS.notice])assert.ok(Math.hypot(tree.x-goal.x,tree.z-goal.z)>3);
  assert.ok(tree.z<0,'trees stay behind the main foreground');
 }
});

test('all redesigned scenery builds finite geometry without a DOM or external textures',()=>{
 for(const factory of [berryTreeModel,cottageModel,plazaGarden,fountainModel,marketGarden,homesteadGarden]){
  const g=factory();let count=0;
  g.traverse(o=>{if(o instanceof T.Mesh){count++;const a=o.geometry.getAttribute('position');for(let i=0;i<a.array.length;i++)assert.ok(Number.isFinite(a.array[i]));assert.ok(!(o.material as T.MeshStandardMaterial).map);o.geometry.dispose();}});
  assert.ok(count>10);assert.ok(!new T.Box3().setFromObject(g).isEmpty());
 }
});

test('fixed homestead landscape leaves the saved 12 by 12 placement footprint untouched',()=>{
 const g=homesteadGarden();g.updateMatrixWorld(true);
 g.traverse(o=>{if(o instanceof T.Mesh){const b=new T.Box3().setFromObject(o);assert.ok(b.max.x<=-12||b.min.x>=12||b.max.z<=-12||b.min.z>=12,'fixed decoration must stay outside editable cells');o.geometry.dispose();}});
});