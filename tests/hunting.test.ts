import test from 'node:test';
import assert from 'node:assert/strict';
import {HuntingRuntime,HUNT_ZONES,HUNT_CAMP,type HuntEvent} from '../src/hunting';
import {newSave,validateSave,huntingPower,huntingRewardFor,grantHuntingReward} from '../src/rules';
import {ACADEMY_SKILLS,emptyCareer,validCareer,selectJob,recordCareerTrial,advanceJob,careerSkills,equipCareerSkill,learnCareerSkill,migrateAcademy,ACADEMY_KEY,emptyAcademy,saveAcademy} from '../src/academy';
const profile={nickname:'모험가',grade:3,character:0};
const store=()=>{const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},map};};
test('15 unique skills have exact class rank gates and retained per-class four-slot loadouts',()=>{
 assert.equal(ACADEMY_SKILLS.length,15);assert.equal(new Set(ACADEMY_SKILLS.map(s=>s.id)).size,15);
 const c=emptyCareer();assert.equal(selectJob(c,'mage',9),false);assert.equal(selectJob(c,'mage',NaN),false);assert.equal(selectJob(c,'mage',10),true);
 assert.equal(advanceJob(c,'mage',100),false);assert.equal(learnCareerSkill(c,'starfall',100),false);
 assert.equal(recordCareerTrial(c,'mage',2),false);assert.equal(recordCareerTrial(c,'mage',1),true);assert.equal(advanceJob(c,'mage',10),true);
 assert.deepEqual(careerSkills(c,10),['starbolt','frost','shield','wind']);assert.deepEqual(c.loadouts.mage,['starbolt','frost','shield','wind']);assert.equal(equipCareerSkill(c,0,'starfall',100),false);
 assert.equal(recordCareerTrial(c,'mage',2),true);assert.equal(advanceJob(c,'mage',29),false);assert.equal(advanceJob(c,'mage',30),true);
 assert.equal(recordCareerTrial(c,'mage',3),true);assert.equal(advanceJob(c,'mage',59),false);assert.equal(advanceJob(c,'mage',60),true);
 const slots=[...c.loadouts.mage];assert.equal(selectJob(c,'knight',60),true);assert.ok(!careerSkills(c,60).includes('starfall'));assert.equal(selectJob(c,'mage',60),true);assert.deepEqual(c.loadouts.mage,slots);assert.equal(c.ranks.mage,3);assert.ok(validCareer(c));
});
test('v21 migration preserves old game and integrates only matching-profile academy once without deleting source',()=>{
 const save=newSave('모험가',0),old=structuredClone(save) as any;old.version=21;delete old.career;old.berries=321;old.room.furniture=[0];old.room.positions={'0':{column:2,row:1}};
 const migrated=validateSave(old);assert.equal(migrated.version,22);assert.equal(migrated.berries,321);assert.deepEqual(migrated.room,old.room);assert.deepEqual(migrated.learning,old.learning);
 const storage=store(),a=emptyAcademy(profile);a.learned=['shield','lantern'];a.practiced=['shield'];saveAcademy(storage,a);const original=storage.getItem(ACADEMY_KEY);
 assert.equal(migrateAcademy(storage,{...profile,nickname:'다른 모험가'},migrated.career),false);assert.equal(migrateAcademy(storage,profile,migrated.career),true);assert.equal(migrateAcademy(storage,profile,migrated.career),false);assert.equal(storage.getItem(ACADEMY_KEY),original);assert.deepEqual(migrated.career.learned,a.learned);assert.deepEqual(validateSave(migrated).career,migrated.career);
 const corrupt=structuredClone(migrated);corrupt.career.loadouts.novice[0]='starfall';assert.throws(()=>validateSave(corrupt));
});
test('normal zones have six enemies, simulation pauses and dead enemies wait 12 seconds and a safe spawn distance',()=>{
 const r=new HuntingRuntime({zone:0,level:1,power:100});assert.equal(r.snapshot().enemies.length,6);const target=r.snapshot().enemies[0],p={x:target.x,z:target.z+1};
 const events=r.attack(p);assert.equal(events.filter(e=>e.type==='defeat').length,1);assert.equal(r.attack(p).length,0);
 const before=r.snapshot();r.step(100,p,true);assert.deepEqual(r.snapshot(),before);r.step(NaN,p);assert.deepEqual(r.snapshot(),before);
 for(let i=0;i<3;i++)r.step(5,p);assert.equal(r.snapshot().enemies[0].hp,0,'no respawn on top of player');
 assert.equal(r.step(.05,HUNT_CAMP).filter(e=>e.type==='respawn').length,1);const next=r.attack({x:target.x,z:target.z+1}).find(e=>e.type==='defeat');assert.ok(next&&next.type==='defeat');assert.notEqual(next.id,(events.find(e=>e.type==='defeat') as any).id);
});
test('targetless casts do not spend cooldown; root and piercing target real enemies',()=>{
 const r=new HuntingRuntime({zone:0,level:10,power:10,job:'ranger',learned:['pierce'],practice:true,practiceMode:'multi'});
 assert.deepEqual(r.cast('pierce',{x:100,z:100}),[]);assert.equal(r.snapshot().cooldowns.pierce,undefined);
 const hits=r.cast('pierce',{x:-6,z:0},{x:1,z:0}).filter(e=>e.type==='hit');assert.equal(hits.length,3);assert.equal(r.snapshot().cooldowns.pierce,7);
 const mage=new HuntingRuntime({zone:0,level:10,power:10,job:'mage',learned:['frost'],practice:true});assert.ok(mage.cast('frost',{x:0,z:2}).some(e=>e.type==='practiceEffect'&&e.kind==='root'));assert.equal(mage.snapshot().enemies[0].state,'rooted');
});
test('each damage-over-time skill applies its advertised total independently of timestep',()=>{
 for(const [skill,duration,power,job] of [['vortex',4,3,'mage'],['starfall',3,4,'mage'],['storm',2,4,'ranger']] as const){
  const make=()=>new HuntingRuntime({zone:0,level:60,power:2,job,learned:[skill],practice:true});const a=make(),b=make(),p={x:0,z:2};a.cast(skill,p);b.cast(skill,p);a.step(duration,p);for(let i=0;i<duration*100;i++)b.step(.01,p);
  assert.ok(Math.abs(a.snapshot().enemies[0].hp-(48-2*power))<1e-7,skill);assert.ok(Math.abs(a.snapshot().enemies[0].hp-b.snapshot().enemies[0].hp)<1e-7,skill);
 }
});
test('targeted area skills center on enemies eight steps away and empty casts spend no cooldown',()=>{
 for(const [skill,duration,power,job] of [['vortex',4,3,'mage'],['starfall',3,4,'mage'],['storm',2,4,'ranger']] as const){
  const r=new HuntingRuntime({zone:0,level:60,power:2,job,learned:[skill],practice:true});
  assert.deepEqual(r.cast(skill,{x:100,z:100}),[]);assert.equal(r.snapshot().cooldowns[skill],undefined);
  const p={x:0,z:8};assert.ok(r.cast(skill,p,{x:0,z:-1}).some(e=>e.type==='cast'));
  const effect=r.snapshot().effects.find(e=>e.skill===skill)!;assert.equal(effect.x,0);assert.equal(effect.z,0);
  const events=r.step(duration,p);assert.ok(events.some(e=>e.type==='hit'&&e.skill===skill));assert.ok(Math.abs(r.snapshot().enemies[0].hp-(48-2*power))<1e-7,skill);
 }
});
test('shield and guardian use the strongest damage reduction only, and practice has no reward',()=>{
 const r=new HuntingRuntime({zone:0,level:60,power:10,job:'knight',learned:['shield','guardian'],practice:true,practiceMode:'attacking'}),p={x:-1.5,z:0};r.cast('shield',p);r.cast('guardian',p);
 const events=r.step(2,p),hit=events.find(e=>e.type==='playerHit');assert.ok(hit&&hit.type==='playerHit');assert.equal(hit.damage,4);assert.ok(events.some(e=>e.type==='practiceEffect'&&e.skill==='shield'&&e.kind==='block'));
 const s=newSave('모험가',0);const before=structuredClone(s);grantHuntingReward(s,{type:'defeat',id:'practice',enemyId:'0',enemyType:'melee',zone:0,practice:true});assert.deepEqual(s,before);
});
test('hunting rewards combine level and daily reductions before flooring, include potions, and never count learning missions',()=>{
 const now=new Date(2026,9,26,12).getTime(),s=newSave('모험가',0);s.level=30;s.weapon=22;s.weapons[22]=3;s.outfit=5;s.outfits[5]=0;
 s.potions.berryMultiplier=3;s.potions.berryUntil=now+10000;s.potions.xpMultiplier=4;s.potions.xpUntil=now+10000;
 let event={type:'defeat' as const,id:'one',enemyId:'0',enemyType:'ranged' as const,zone:1,practice:false};const oldLearning=structuredClone(s.learning),oldDaily=structuredClone(s.daily),oldJourney=structuredClone(s.journey);
 const reward=grantHuntingReward(s,event,now);assert.equal(reward.berries,1);assert.equal(reward.xp,2);assert.equal(s.career.stats.defeats,1);assert.deepEqual(s.career.stats.seen,['ranged']);const once=structuredClone(s);assert.equal(grantHuntingReward(s,event,now).eligible,false);assert.deepEqual(s,once);
 s.career.daily.counts[1]=100;const reduced=huntingRewardFor(s,1,now);assert.equal(reduced.berries,Math.floor(4*.1*.25*3));assert.equal(reduced.xp,Math.floor(6*.1*.25*4));assert.deepEqual(s.learning,oldLearning);assert.deepEqual(s.daily,oldDaily);assert.deepEqual(s.journey,oldJourney);assert.equal(s.best,0);validateSave(s);
});
test('weapon strength and upgrades are separate combat bonuses and baseline encounter duration stays within target bands',()=>{
 for(const z of HUNT_ZONES){const s=newSave('모험가',0);s.level=z.level;const plain=huntingPower(s);s.weapon=22;s.weapons[22]=3;const strong=huntingPower(s);assert.ok(strong>plain);const normalSeconds=Math.ceil(z.hp/plain)*.85,topSeconds=Math.ceil(z.hp/strong)*.85;assert.ok(normalSeconds>=4&&normalSeconds<=8,`${z.name}: ${normalSeconds}`);assert.ok(topSeconds>=2&&topSeconds<=4,`${z.name}: ${topSeconds}`);}
});
test('updating level and weapon power keeps the same battle, cooldowns and enemy health',()=>{
 const r=new HuntingRuntime({zone:0,level:10,power:5,job:'mage',learned:['starbolt'],practice:true});const p={x:0,z:2};r.cast('starbolt',p);r.step(.2,p);const before=r.snapshot();
 assert.equal(r.updateProfile({level:11,power:10}),true);const after=r.snapshot();assert.equal(after.time,before.time);assert.deepEqual(after.cooldowns,before.cooldowns);assert.deepEqual(after.enemies,before.enemies);assert.equal(after.playerHp,before.playerHp+2);assert.equal(after.maxHp,before.maxHp+2);r.attack(p);assert.equal(r.snapshot().enemies[0].hp,after.enemies[0].hp-10);
 assert.equal(r.updateProfile({level:NaN,power:0}),false);
});
test('telegraphed attacks can be dodged and zero health retreats to camp without persistent state',()=>{
 const r=new HuntingRuntime({zone:0,level:1,power:1}),p={x:-6,z:-2};const warning=r.step(.05,p);assert.equal(warning.some(e=>e.type==='playerHit'),false);assert.ok(r.snapshot().enemies[0].telegraph);
 const dodged=r.step(1,{x:-10,z:0});assert.equal(dodged.some(e=>e.type==='playerHit'),false);
 let retreat:HuntEvent|undefined;for(let i=0;i<200&&!retreat;i++)retreat=r.step(.5,p).find(e=>e.type==='retreat');
 assert.ok(retreat&&retreat.type==='retreat');assert.equal(retreat.x,HUNT_CAMP.x);assert.equal(retreat.z,HUNT_CAMP.z);assert.equal(r.snapshot().playerHp,r.snapshot().maxHp);assert.ok(r.snapshot().invulnerable>2);
});
test('disengaged enemies return to their spawn and recover while camp remains safe',()=>{
 const r=new HuntingRuntime({zone:0,level:1,power:1}),spawn=r.snapshot().enemies[0];r.attack({x:spawn.x,z:spawn.z+1});assert.ok(r.snapshot().enemies[0].hp<spawn.maxHp);
 const events=r.step(5,HUNT_CAMP);assert.equal(r.snapshot().enemies[0].hp,spawn.maxHp);assert.equal(events.some(e=>e.type==='playerHit'),false);
});
test('the first hundred daily kills are full reward, then quarter reward, and a new day restores the allowance',()=>{
 const s=newSave('모험가',0);s.level=10;const now=new Date(2026,9,26,12).getTime();grantHuntingReward(s,1,'melee',now);s.career.daily.counts[1]=99;
 assert.equal(grantHuntingReward(s,1,'charge',now).berries,4);assert.equal(grantHuntingReward(s,1,'charge',now).berries,1);assert.equal(huntingRewardFor(s,1,now+86400000).berries,4);
});
