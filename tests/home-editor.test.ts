import test from 'node:test';
import assert from 'node:assert/strict';
import { HomeEditorSession, homeCellAt } from '../src/home-editor-state';
import { newSave, validateSave } from '../src/rules';
import { MARKET_RADIUS, MARKET_DOOR_OFFSET, MARKET_SHOPS, villageMonsterSpot } from '../src/village-layout';
import { stageMonsters } from '../src/stages';

test('3D placement, cancelled move, storage and undo preserve stock and saved progress',()=>{
 const s=newSave('정원',0,3);s.berries=100;const e=new HomeEditorSession(s,()=>true);
 assert.equal(e.craft(6),'');e.move(3,3);assert.equal(e.place(),'');const before=structuredClone(s),uid=s.homestead.objects[0].uid;
 e.select(uid);e.move(7,4);e.rotate();e.cancel();assert.deepEqual(s,before);
 e.select(uid);e.move(7,4);assert.equal(e.place(),'');assert.equal(s.homestead.objects[0].column,7);
 assert.equal(e.undo(),true);assert.deepEqual(s,before);
 e.select(uid);assert.ok(e.store());assert.equal(s.homestead.objects.length,0);assert.equal(s.homestead.owned[6],1);
 assert.ok(e.undo());assert.deepEqual(s,before);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
});
test('invalid placements spend no stock; undoing paid crafting restores exactly its cost',()=>{
 const s=newSave('정원',0,1);s.berries=100;const e=new HomeEditorSession(s,()=>false);
 assert.equal(e.craft(6),'');e.move(3,3);assert.equal(e.place(),'');assert.equal(e.craft(6),'');assert.equal(s.berries,90);
 const before=structuredClone(s);e.move(3,3);assert.match(e.place(),/겹쳐/);assert.deepEqual(s,before);
 e.move(12,0);assert.match(e.place(),/경계/);assert.deepEqual(s,before);
 e.move(5,11);assert.match(e.place(),/입구/);assert.deepEqual(s,before);
 assert.ok(e.undo());assert.equal(s.berries,100);assert.equal(s.homestead.owned[6],1);
 assert.match(e.craft(12),/도안|완전판/);assert.equal(s.berries,100);
});
test('3D floor selection retains exact cell edges instead of wrapping out-of-bounds clicks',()=>{
 assert.deepEqual(homeCellAt(-12,-12),{column:0,row:0});assert.deepEqual(homeCellAt(11.99,11.99),{column:11,row:11});
 assert.deepEqual(homeCellAt(12,12),{column:12,row:12});assert.deepEqual(homeCellAt(-12.01,0),{column:-1,row:6});
});
test('six individual shop entrances remain reachable with player radius and generous merchant spacing',()=>{
 const blocked=(x:number,z:number)=>MARKET_SHOPS.some(s=>Math.hypot(s.x-x,s.z-z)<MARKET_RADIUS+.32);
 const reached=new Set<string>(),queue:[[number,number]]|[number,number][]=[[0,4]];
 // Half-unit nodes cover the expanded market, starting at the village approach.
 for(let i=0;i<queue.length;i++){const [gx,gz]=queue[i],key=gx+','+gz;if(reached.has(key)||gx< -48||gx>48||gz< -38||gz>4||blocked(gx/2,gz/2))continue;reached.add(key);queue.push([gx+1,gz],[gx-1,gz],[gx,gz+1],[gx,gz-1]);}
 for(const a of MARKET_SHOPS){const x=Math.round(a.x*2),z=Math.round((a.z+MARKET_DOOR_OFFSET)*2);assert.ok(reached.has(x+','+z),a.id+' entrance blocked');for(const b of MARKET_SHOPS)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>6);}
 stageMonsters(0).forEach((m,id)=>{const p=villageMonsterSpot(id,m.x,m.z);assert.ok(!blocked(p.x,p.z));});
});
