import {test} from 'node:test';import assert from 'node:assert/strict';
import * as T from 'three';
import {newSave,validateSave} from '../src/rules';
import {WORLD_TWO_REGIONS,WORLD_THREE_NAME,canEnterWorldTwo,worldTwoBoss} from '../src/world-two';
import {activateWorldTwoBeacon,grantWorldTwoReward,worldTwoRewardFor} from '../src/world-two-rules';
import {HuntingRuntime} from '../src/hunting';
import {planetaryScenery,planetaryTerrain,disposePlanetaryScenery,planetThemeIndex} from '../src/world-two-planet';
import {renderWorldThree} from '../src/world-two-ui';

test('World 3 opens after the existing worlds, preserves old saves, and grants each first completion once',()=>{
 const s=newSave('새벽친구',0,3);s.level=1000;
 const legacy=JSON.parse(JSON.stringify(s));legacy.world2.regions.length=10;legacy.world2.daily.counts=Array(12).fill(2);delete legacy.world2.thirdBoss;
 const restored=validateSave(legacy);assert.equal(restored.world2.regions.length,13);assert.deepEqual(restored.world2.daily.counts.slice(0,12),Array(12).fill(2));assert.deepEqual(restored.world2.daily.counts.slice(12),[0,0,0,0]);assert.deepEqual(restored.world2.thirdBoss,{wins:0,bestSeconds:null});
 assert.equal(canEnterWorldTwo(s.world2,s.level,10),false);
 for(const r of WORLD_TWO_REGIONS.slice(0,10))Object.assign(s.world2.regions[r.id],{kills:r.killGoal,beacons:[0,1,2],claimed:true});
 for(const r of WORLD_TWO_REGIONS.slice(10)){
  assert.equal(canEnterWorldTwo(s.world2,r.level-1,r.id),false);assert.equal(canEnterWorldTwo(s.world2,r.level,r.id),true);s.world2.location={region:r.id,boss:false};
  for(let n=0;n<r.killGoal;n++)grantWorldTwoReward(s,{type:'defeat',id:r.id+'-'+n,enemyId:'0',enemyType:'melee',zone:0,practice:false,encounter:'world2-'+r.id},10);
  for(const [id,p]of [{x:-9,z:-14},{x:9,z:-14},{x:0,z:-17}].entries())activateWorldTwoBeacon(s,id,p);
  assert.equal(s.world2.regions[r.id].claimed,true);const before=s.berries;assert.equal(activateWorldTwoBeacon(s,0,{x:-9,z:-14}).activated,false);assert.equal(s.berries,before);
  assert.ok(worldTwoRewardFor(s,r.id).berries>0);
 }
 assert.ok(canEnterWorldTwo(s.world2,800,12,true));s.world2.location={region:12,boss:true};
 const event={type:'defeat' as const,id:'worldtree-win',enemyId:'0',enemyType:'melee' as const,zone:0,practice:false,encounter:'world2-12-boss'};
 assert.equal(grantWorldTwoReward(s,event,120).first,true);const b=s.berries;assert.equal(grantWorldTwoReward(s,event,120).berries,0);assert.equal(s.berries,b);assert.equal(s.world2.thirdBoss.wins,1);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).world2,s.world2);
 assert.match(renderWorldThree(s),new RegExp(WORLD_THREE_NAME));assert.match(renderWorldThree(s),/세계수 수호자에게 도전/);
});

test('World 3 has three separate visual themes, real combat and an accessible safe camp',()=>{
 const themes=new Set();
 for(const id of [10,11,12]){const r=WORLD_TWO_REGIONS[id];themes.add(planetThemeIndex(id));const terrain=planetaryTerrain(id),scenery=planetaryScenery(id);assert.ok(terrain.getObjectByName('planetary-safe-camp'));const bounds=new T.Box3().setFromObject(scenery);assert.ok(bounds.max.y>4&&Number.isFinite(bounds.max.x));disposePlanetaryScenery(terrain);disposePlanetaryScenery(scenery);
  const runtime=new HuntingRuntime({zone:0,level:1000,power:1000,encounter:{id:'world2-'+id,hp:r.hp,damage:r.damage,boss:false}});assert.equal(runtime.snapshot().enemies.length,6);const e=runtime.snapshot().enemies[0];assert.ok(runtime.attack({x:e.x,z:e.z+1}).some(e=>e.type==='hit'));
 }
 assert.equal(themes.size,3);const boss=worldTwoBoss(12)!;const runtime=new HuntingRuntime({zone:0,level:1000,power:10000,encounter:{id:'world2-12-boss',hp:boss.hp,damage:boss.damage,boss:true}});assert.equal(runtime.snapshot().enemies.length,1);assert.equal(runtime.snapshot().enemies[0].maxHp,1200000);
});
