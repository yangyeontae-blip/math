import {test} from 'node:test';import assert from 'node:assert/strict';
import {newSave,validateSave,journeyFor,operationsForGrade,questionAnswerText,type SchoolGrade} from '../src/rules';
import {HOME_ITEMS,STARTER_BLUEPRINTS,emptyHomestead,blueprintIds,craftHome,placeHome,storeHome,availableHome,objectCells,homeRoute,layoutError,claimHomeMemory,validHomestead,visitorTargets} from '../src/homestead';
import {emptyExploration,openDiscovery,solveDiscovery,syncDiscoveries,discoveryId,validExploration,discoveryAnswerCorrect} from '../src/exploration';
test('version 20 migration preserves all old progress, finances and partial activities and recognizes finished first discoveries',()=>{
 const s=newSave('숲친구',0,3);s.berries=345;s.forestTrail={seeds:[0,1,2,3,4,5],lit:[0,1,2],placed:[3,3,3],drafts:['22','40','63']};
 const old={...structuredClone(s),version:20} as Record<string,unknown>;delete old.homestead;delete old.exploration;
 const after=validateSave(old);assert.equal(after.version,22);assert.deepEqual(after.homestead,emptyHomestead());assert.deepEqual(after.exploration.solved,['addition:1']);
 for(const k of ['berries','weapons','forestTrail','forestActivities','story','learning','adventure','additionJourney'] as const)assert.deepEqual(after[k],s[k]);
});
test('24 blueprints unlock with ten discoveries available in grade 1, first crafting is free and paid duplicates are atomic',()=>{
 assert.equal(HOME_ITEMS.length,24);assert.equal(new Set(blueprintIds(10)).size,24);assert.deepEqual(blueprintIds(0),STARTER_BLUEPRINTS);assert.equal(blueprintIds(3).length,12);assert.equal(blueprintIds(6).length,18);
 const s=newSave('숲친구',0,1);assert.equal(craftHome(s,6,false),'');assert.equal(s.berries,0);assert.equal(availableHome(s,6),1);
 const before=structuredClone(s);assert.ok(craftHome(s,6,false));assert.deepEqual(s,before);s.berries=10;assert.equal(craftHome(s,6,false),'');assert.equal(s.berries,0);assert.equal(s.homestead.owned[6],2);
 s.exploration.solved=Array.from({length:10},(_,i)=>`addition:${i+1}`);assert.equal(craftHome(s,17,true),'');assert.ok(craftHome(s,17,false));assert.ok(placeHome(s,17,3,3,0,false));
});
test('placing, moving, rotation, storage and reload conserve inventory; rejected placements do not change state',()=>{
 const s=newSave('숲친구',0);craftHome(s,18,true);craftHome(s,6,true);assert.equal(placeHome(s,18,1,2,0,true),'');const uid=s.homestead.objects[0].uid;
 assert.equal(placeHome(s,18,2,2,1,true,uid),'');assert.equal(objectCells(s.homestead.objects[0]).length,2);assert.equal(s.homestead.objects[0].rotation,1);
 const before=structuredClone(s);for(const [c,r]of [[2,2],[12,0],[5,11],[-1,0]]){assert.ok(placeHome(s,6,c,r,0,true));assert.deepEqual(s,before);}
 assert.equal(storeHome(s,uid),true);assert.equal(availableHome(s,18),1);assert.equal(placeHome(s,18,0,0,0,true),'');assert.deepEqual(validateSave(s).homestead,s.homestead);
 assert.equal(s.homestead.owned[18],1);assert.equal(s.berries,0);
});
test('entrance-to-facility access is checked after rotations and new obstacles',()=>{
 const s=newSave('숲친구',0);s.homestead.owned[18]=1;s.homestead.owned[10]=6;assert.equal(placeHome(s,18,5,5,0,true),'');
 const walls=[[4,5],[7,5],[5,4],[6,4],[5,6],[6,6]];
 for(const [c,r]of walls.slice(0,-1))assert.equal(placeHome(s,10,c,r,0,true),'');const before=structuredClone(s);
 assert.match(placeHome(s,10,6,6,0,true),/길/);assert.deepEqual(s,before);assert.ok(homeRoute(s.homestead.objects,137,78).length>0);
});
test('sixty-object limit permits relocation at the cap, and blocked save layouts are rejected',()=>{
 const s=newSave('숲친구',0);s.homestead.owned[0]=70;for(let i=0;i<60;i++)assert.equal(placeHome(s,0,i%12,Math.floor(i/12),0,true),'');
 assert.match(placeHome(s,0,0,5,0,true),/60/);assert.equal(placeHome(s,0,0,5,0,true,s.homestead.objects[0].uid),'');
 const h=structuredClone(s.homestead);h.objects[1].column=h.objects[0].column;h.objects[1].row=h.objects[0].row;assert.equal(validHomestead(h),false);assert.throws(()=>validateSave({...s,homestead:h}));
});
test('resident requests grant one persistent memory, visitors target reachable facilities, and storing keeps memories',()=>{
 const s=newSave('숲친구',0);craftHome(s,6,true);craftHome(s,18,true);placeHome(s,6,2,2,0,true);placeHome(s,18,4,3,0,true);
 assert.equal(claimHomeMemory(s,0),true);assert.equal(claimHomeMemory(s,0),false);assert.ok(visitorTargets(s).length>=2);
 storeHome(s,s.homestead.objects[0].uid);assert.deepEqual(s.homestead.memories,[0]);assert.deepEqual(validateSave(s).homestead.memories,[0]);
});
test('all 40 discovery locations generate grade-appropriate valid resumable questions with no duplicate rewards',()=>{
 let count=0;for(const forest of operationsForGrade(6))for(let stage=1;stage<=10;stage++){assert.equal(discoveryId(forest,stage),`${forest}:${stage}`);count++;}assert.equal(count,40);
 for(const grade of [1,2,3,4,5,6] as SchoolGrade[])for(const forest of operationsForGrade(grade))for(let stage=2;stage<=10;stage++)for(let repeat=0;repeat<4;repeat++){
  const s=newSave('숲친구',0,grade);s.teacherMode=true;s.forest=forest;journeyFor(s).stage=stage;s.position={x:0,z:20};const id=openDiscovery(s)!;assert.ok(id);const puzzle=s.exploration.puzzles[id];puzzle.draft='9';puzzle.hints=1;
  assert.equal(validExploration(s.exploration),true,JSON.stringify(puzzle.question));const restored=validateSave(s);assert.deepEqual(restored.exploration,s.exploration);
  puzzle.draft=questionAnswerText(puzzle.question);assert.equal(solveDiscovery(s,id),true);assert.equal(solveDiscovery(s,id),false);assert.equal(s.berries,10);assert.equal(s.learning.correct,1);assert.equal(validExploration(s.exploration),true);
 }
});
test('wrong answers, leaving and unsupported grade forests do not grant a discovery, and decimal/remainder answers are exact',()=>{
 const s=newSave('숲친구',0,1);s.teacherMode=true;s.additionJourney.stage=2;s.forest='addition';const id=openDiscovery(s)!;s.exploration.puzzles[id].draft='999999';const before=structuredClone(s);assert.equal(solveDiscovery(s,id),false);assert.deepEqual(s,before);
 s.forest='division';s.journey.stage=2;assert.equal(openDiscovery(s),null);assert.equal(solveDiscovery(s,id),false);
 assert.equal(discoveryAnswerCorrect({operation:'division',dividend:15,divisor:3,answer:5,places:[1,0,1]},'0.50'),true);
 assert.equal(discoveryAnswerCorrect({operation:'division',dividend:13,divisor:3,answer:4,remainder:1},'4r1'),true);
 assert.equal(discoveryAnswerCorrect({operation:'division',dividend:13,divisor:3,answer:4,remainder:1},'4'),false);
});
test('simultaneous home/room saves, invalid counts and forged questions are rejected',()=>{
 const s=newSave('숲친구',0);assert.throws(()=>validateSave({...s,homestead:{...s.homestead,inside:true},room:{...s.room,inside:true}}));
 for(const count of [-1,1.5,Infinity]){const h=emptyHomestead();h.owned[0]=count;assert.equal(validHomestead(h),false);}
 const e=emptyExploration();e.seen=['addition:2'];e.puzzles['addition:2']={question:{operation:'addition',dividend:2,divisor:3,answer:99},draft:'',hints:0};assert.equal(validExploration(e),false);assert.equal(layoutError([]),'');
});
