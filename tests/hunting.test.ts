import test from 'node:test';
import assert from 'node:assert/strict';
import {HuntingRuntime,HUNT_ZONES,HUNT_CAMP,type HuntEvent} from '../src/hunting';
import {newSave,validateSave,huntingPower,huntingRewardFor,grantHuntingReward,WEAPONS,PETS,PPOJJAK_PET_ID,huntingCompanionStats,buyPet} from '../src/rules';
import {ACADEMY_SKILLS,emptyCareer,validCareer,selectJob,recordCareerTrial,advanceJob,careerSkills,equipCareerSkill,learnCareerSkill,migrateAcademy,ACADEMY_KEY,emptyAcademy,saveAcademy} from '../src/academy';
const profile={nickname:'모험가',grade:3,character:0};
const store=()=>{const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},map};};
test('24 unique skills have exact class rank gates and retained per-class four-slot loadouts',()=>{
 assert.equal(ACADEMY_SKILLS.length,24);assert.equal(new Set(ACADEMY_SKILLS.map(s=>s.id)).size,24);
 const c=emptyCareer();assert.equal(selectJob(c,'mage',9),false);assert.equal(selectJob(c,'mage',NaN),false);assert.equal(selectJob(c,'mage',10),true);
 assert.equal(advanceJob(c,'mage',100),false);assert.equal(learnCareerSkill(c,'starfall',100),false);
 assert.equal(recordCareerTrial(c,'mage',2),false);assert.equal(recordCareerTrial(c,'mage',1),true);assert.equal(advanceJob(c,'mage',10),true);
 assert.deepEqual(careerSkills(c,10),['starbolt','frost','leafOrb','shield','wind']);assert.deepEqual(c.loadouts.mage,['starbolt','frost','shield','wind']);assert.equal(equipCareerSkill(c,0,'starfall',100),false);
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
 const reward=grantHuntingReward(s,event,now);assert.equal(reward.berries,15);assert.equal(reward.xp,12);assert.equal(s.career.stats.defeats,1);assert.deepEqual(s.career.stats.seen,['ranged']);const once=structuredClone(s);assert.equal(grantHuntingReward(s,event,now).eligible,false);assert.deepEqual(s,once);
 s.career.daily.counts[1]=100;const reduced=huntingRewardFor(s,1,now);assert.equal(reduced.berries,3);assert.equal(reduced.xp,3);assert.deepEqual(s.learning,oldLearning);assert.deepEqual(s.daily,oldDaily);assert.deepEqual(s.journey,oldJourney);assert.equal(s.best,0);validateSave(s);
});
test('level growth strengthens combat monotonically from novice through the maximum level',()=>{
 const s=newSave('모험가',0);assert.ok(Math.abs(huntingPower(s)-10.95)<1e-9);
 let previous=0;for(const level of [...Array.from({length:1000},(_,i)=>i+1),10000,99999,100000]){s.level=level;const power=huntingPower(s);assert.ok(Number.isFinite(power)&&power>previous,`level ${level}`);assert.ok(power>8+level*.35,'stronger than the previous level formula');previous=power;}
 s.level=100;assert.equal(huntingPower(s),141);s.level=10000;assert.equal(huntingPower(s),11688);
 s.level=60;assert.ok(huntingPower(s)>8*huntingPower({...s,level:1}),'level 60 has more than eight times novice power');
 for(const [level,zone,damage] of [[1,0,11],[60,3,91]]){s.level=level;const runtime=new HuntingRuntime({zone,level,power:huntingPower(s)}),enemy=runtime.snapshot().enemies[0];const hit=runtime.attack({x:enemy.x,z:enemy.z+1}).find(event=>event.type==='hit');assert.ok(hit&&hit.type==='hit');assert.equal(hit.damage,damage);assert.equal(runtime.snapshot().enemies[0].hp,enemy.hp-damage);}
});
test('the strengthened level base preserves weapon strength and every upgrade multiplier',()=>{
 for(const level of [1,10,30,60,1000]){const s=newSave('모험가',0);s.level=level;const plain=huntingPower(s);for(let weapon=0;weapon<WEAPONS.length;weapon++){s.weapon=weapon;s.weapons[weapon]=0;const unupgraded=huntingPower(s);assert.ok(Math.abs(unupgraded/plain-(1+(WEAPONS[weapon].treePower-1)*.22))<1e-9);for(let upgrade=1;upgrade<=3;upgrade++){s.weapons[weapon]=upgrade;assert.ok(Math.abs((huntingPower(s)-unupgraded)/plain-upgrade*.15)<1e-9);}}}
 const s=newSave('모험가',0);s.level=100;s.weapon=22;s.weapons[22]=3;assert.ok(Math.abs(huntingPower(s)-545.67)<1e-9);
 for(const zone of HUNT_ZONES){s.level=zone.level;s.weapon=0;const plain=huntingPower(s);s.weapon=22;const strong=huntingPower(s);assert.ok(Math.ceil(zone.hp/strong)<=Math.ceil(zone.hp/plain),'better gear never needs more attacks');}
});
test('each unlocked hunting zone grants the increased base reward without learning bonuses',()=>{
 const now=new Date(2026,9,28,12).getTime(),expected=[[20,12],[50,30],[100,60],[200,120]];
 for(const zone of HUNT_ZONES){const s=newSave('모험가',0);s.level=zone.level;const before=structuredClone(s.learning);const reward=grantHuntingReward(s,zone.id,'melee',now);assert.equal(reward.berries,expected[zone.id][0]);assert.equal(reward.xp,expected[zone.id][1]);assert.equal(s.berries,reward.berries);assert.equal(s.xp,reward.xp);assert.deepEqual(s.learning,before);validateSave(s);}
 const s=newSave('모험가',0);s.level=80;grantHuntingReward(s,3,'melee',now);s.career.daily.counts[3]=100;const minimum=huntingRewardFor(s,3,now);assert.equal(minimum.berries,50);assert.equal(minimum.xp,30);
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
 assert.equal(grantHuntingReward(s,1,'charge',now).berries,50);assert.equal(grantHuntingReward(s,1,'charge',now).berries,12);assert.equal(huntingRewardFor(s,1,now+86400000).berries,50);
});
test('basic attacks keep hitting the chosen enemy and splash nearby enemies (2026-10-27 hold-F fix)',()=>{
 // 예전에는 매 공격마다 가장 가까운 몬스터로 대상이 바뀌어, 계속 눌러도 한 마리도 쓰러지지 않았어요.
 const sticky=new HuntingRuntime({zone:0,level:1,power:10,job:'mage',practice:true,practiceMode:'multi'}),far=sticky.snapshot().enemies[2];
 const hits=sticky.attack({x:-3,z:2},undefined,far.id).filter(e=>e.type==='hit');assert.equal(hits[0].type==='hit'&&hits[0].enemyId,far.id);assert.equal(sticky.snapshot().enemies[2].hp,far.hp-10);
 const area=new HuntingRuntime({zone:0,level:1,power:10,job:'mage',practice:true,practiceMode:'multi'}),[left,mid,right]=area.snapshot().enemies;
 area.attack({x:0,z:2},undefined,mid.id);const after=area.snapshot().enemies;assert.equal(after[1].hp,mid.hp-10);assert.equal(after[0].hp,left.hp-6);assert.equal(after[2].hp,right.hp-6);
});

test('all nine additional skills require the correct job, equipped slot and real target before consuming cooldown',()=>{
 for(const skill of ACADEMY_SKILLS.slice(15)){const options={zone:0,level:60,power:1,job:skill.job!,learned:[skill.id],practice:true};const runtime=new HuntingRuntime(options);assert.deepEqual(runtime.cast(skill.id,{x:100,z:100}),[]);assert.equal(runtime.snapshot().cooldowns[skill.id],undefined);assert.ok(runtime.cast(skill.id,{x:0,z:2},{x:0,z:-1}).some(e=>e.type==='hit'));assert.equal(runtime.snapshot().cooldowns[skill.id],skill.cooldown);assert.deepEqual(runtime.cast(skill.id,{x:0,z:2}),[]);const wrong=new HuntingRuntime({...options,job:skill.job==='mage'?'ranger':'mage'});assert.deepEqual(wrong.cast(skill.id,{x:0,z:2}),[]);const unequipped=new HuntingRuntime({...options,loadout:[]});assert.deepEqual(unequipped.cast(skill.id,{x:0,z:2}),[]);}
});
test('acorn rush has three exact hits and new frontal skills never hit enemies behind the player',()=>{
 const options={zone:0,level:60,power:1,job:'knight' as const,learned:['acornRush','dawnSlash'] as const,practice:true};const rush=new HuntingRuntime(options);const hits=rush.cast('acornRush',{x:0,z:2},{x:0,z:-1}).filter(e=>e.type==='hit');assert.equal(hits.length,3);assert.ok(Math.abs(hits.reduce((n,e)=>n+e.damage,0)-2.4)<1e-9);assert.ok(Math.abs(rush.snapshot().enemies[0].hp-45.6)<1e-9);const back=new HuntingRuntime(options);assert.deepEqual(back.cast('dawnSlash',{x:0,z:-2},{x:0,z:-1}),[]);assert.equal(back.snapshot().cooldowns.dawnSlash,undefined);const front=back.cast('dawnSlash',{x:0,z:2},{x:0,z:-1}).find(e=>e.type==='hit');assert.ok(front&&front.type==='hit');assert.equal(front.damage,4);
});
test('vine pull moves three enemies closer and applies an actual 1.5 second root',()=>{
 const r=new HuntingRuntime({zone:0,level:60,power:1,job:'knight',learned:['vinePull'],practice:true,practiceMode:'multi'}),p={x:0,z:5},before=r.snapshot().enemies;const events=r.cast('vinePull',p),after=r.snapshot().enemies;assert.equal(events.filter(e=>e.type==='hit').length,3);assert.equal(events.filter(e=>e.type==='practiceEffect'&&e.kind==='root').length,3);after.forEach((e,i)=>{assert.ok(Math.hypot(e.x-p.x,e.z-p.z)<Math.hypot(before[i].x-p.x,before[i].z-p.z));assert.ok(Math.abs(Math.hypot(e.x-p.x,e.z-p.z)-1.8)<1e-9);assert.equal(e.state,'rooted');});r.step(1.49,p);assert.ok(r.snapshot().enemies.every(e=>e.state==='rooted'));r.step(.02,p);assert.ok(r.snapshot().enemies.every(e=>e.state==='idle'));const crowd=new HuntingRuntime({zone:0,level:60,power:1,job:'knight',learned:['vinePull']});assert.equal(crowd.cast('vinePull',{x:0,z:-5}).filter(e=>e.type==='hit').length,3);
});
test('new ranged multi-target skills obey their target limits and thunder really roots four enemies',()=>{
 for(const [id,job,damage] of [['leafOrb','mage',14],['tripleShot','ranger',17]] as const){const r=new HuntingRuntime({zone:0,level:60,power:10,job,learned:[id],practice:true,practiceMode:'multi'}),hits=r.cast(id,{x:0,z:4},{x:0,z:-1}).filter(e=>e.type==='hit');assert.equal(hits.length,3);assert.ok(hits.every(e=>e.damage===damage));}const thunder=new HuntingRuntime({zone:0,level:60,power:1,job:'mage',learned:['thunderChain']}),events=thunder.cast('thunderChain',{x:0,z:-5});assert.equal(events.filter(e=>e.type==='hit').length,4);assert.equal(thunder.snapshot().enemies.filter(e=>e.state==='rooted').length,4);thunder.step(1.01,{x:0,z:-5});assert.equal(thunder.snapshot().enemies.filter(e=>e.state==='rooted').length,0);
});
test('comet and gale center on distant targets while moon arrow reaches fourteen steps only',()=>{
 for(const [id,job,damage] of [['comet','mage',10],['galeShot','ranger',5]] as const){const r=new HuntingRuntime({zone:0,level:60,power:2,job,learned:[id],practice:true});const events=r.cast(id,{x:0,z:9});const effect=r.snapshot().effects[0];assert.equal(effect.x,0);assert.equal(effect.z,0);const hit=events.find(e=>e.type==='hit');assert.ok(hit&&hit.type==='hit');assert.equal(hit.damage,damage);if(id==='galeShot'){assert.equal(r.snapshot().enemies[0].state,'rooted');assert.ok(events.some(e=>e.type==='practiceEffect'&&e.kind==='root'));}}const arrow=new HuntingRuntime({zone:0,level:60,power:2,job:'ranger',learned:['moonArrow'],practice:true});assert.deepEqual(arrow.cast('moonArrow',{x:0,z:14.01},{x:0,z:-1}),[]);assert.equal(arrow.snapshot().cooldowns.moonArrow,undefined);const hits=arrow.cast('moonArrow',{x:0,z:14},{x:0,z:-1}).filter(e=>e.type==='hit');assert.equal(hits.length,1);assert.equal(hits[0].damage,12);
});
test('Ppojjaki keeps old pet indices, costs 150000 and grants combat and reward bonuses only while equipped',()=>{
 assert.equal(PPOJJAK_PET_ID,20);assert.equal(PETS[PPOJJAK_PET_ID].name,'귀염둥이 뽀짝이');assert.equal(PETS[19].name,'별꼬리 여우 라온');const now=new Date(2026,9,28,12).getTime(),s=newSave('모험가',0);s.level=60;s.berries=150000;const plain=huntingPower(s);buyPet(s,PPOJJAK_PET_ID);assert.equal(s.berries,0);assert.equal(s.pet,PPOJJAK_PET_ID);assert.ok(Math.abs(huntingPower(s)/plain-1.45)<1e-9);assert.deepEqual(huntingCompanionStats(s),{maxHpMultiplier:1.35,damageReduction:.2});const reward=grantHuntingReward(s,{type:'defeat',id:'ppojjaki-once',enemyId:'0',enemyType:'melee',zone:3,practice:false},now);assert.equal(reward.berries,300);assert.equal(reward.xp,168);const once=structuredClone(s);assert.equal(grantHuntingReward(s,{type:'defeat',id:'ppojjaki-once',enemyId:'0',enemyType:'melee',zone:3,practice:false},now).eligible,false);assert.deepEqual(s,once);s.potions.berryMultiplier=3;s.potions.berryUntil=now+10000;s.potions.xpMultiplier=4;s.potions.xpUntil=now+10000;const potion=huntingRewardFor(s,3,now);assert.equal(potion.berries,900);assert.equal(potion.xp,672);s.pet=-1;assert.equal(huntingPower(s),plain);assert.deepEqual(huntingCompanionStats(s),{maxHpMultiplier:1,damageReduction:0});s.potions.berryUntil=s.potions.xpUntil=0;s.potions.berryMultiplier=s.potions.xpMultiplier=1;assert.equal(huntingRewardFor(s,3,now).berries,200);assert.equal(huntingRewardFor(s,3,now).xp,120);assert.equal(s.learning.correct,0);assert.equal(s.version,22);validateSave(s);
});
test('Ppojjaki health and reduction update without resetting combat and never stack with stronger skill reductions',()=>{
 const base={zone:1,level:10,power:1},stats=huntingCompanionStats({pet:PPOJJAK_PET_ID});const r=new HuntingRuntime({...base,...stats,job:'knight',learned:['shield','guardian']});assert.equal(r.snapshot().maxHp,162);const p={x:-6,z:-2};let hit=r.step(1.2,p).find(e=>e.type==='playerHit');assert.ok(hit&&hit.type==='playerHit');assert.equal(hit.damage,8);const before=r.snapshot();assert.equal(r.updateProfile({...base,...huntingCompanionStats({pet:-1})}),true);assert.equal(r.snapshot().maxHp,120);assert.deepEqual(r.snapshot().enemies,before.enemies);assert.equal(r.snapshot().time,before.time);assert.equal(r.updateProfile({...base,...stats}),true);assert.equal(r.snapshot().maxHp,162);r.cast('shield',p);r.cast('guardian',p);hit=r.step(3,p).find(e=>e.type==='playerHit');assert.ok(hit&&hit.type==='playerHit');assert.equal(hit.damage,5);const practice=new HuntingRuntime({...base,...stats,practice:true,practiceMode:'attacking'});assert.equal(practice.snapshot().maxHp,120);const trainingHit=practice.step(2,{x:-1.5,z:0}).find(e=>e.type==='playerHit');assert.ok(trainingHit&&trainingHit.type==='playerHit');assert.equal(trainingHit.damage,10);assert.equal(r.updateProfile({...base,maxHpMultiplier:Infinity}),false);
});


test('highest enterable hunting zones retain full level rewards at every boundary',()=>{
 const now=new Date(2026,9,29,12).getTime();
 for(const level of [...Array.from({length:121},(_,i)=>i+1),1000,100000]){
  const s=newSave('모험가',0);s.level=level;const highest=HUNT_ZONES.filter(z=>z.level<=level).at(-1)!;const reward=huntingRewardFor(s,highest.id,now);
  assert.equal(reward.multiplier,1,'level '+level);assert.equal(reward.berries,highest.berries);assert.equal(reward.xp,highest.xp);
 }
 const s=newSave('모험가',0);s.level=59;assert.equal(huntingRewardFor(s,2,now).multiplier,1);assert.equal(huntingRewardFor(s,3,now).eligible,false);
 s.level=60;assert.equal(huntingRewardFor(s,2,now).multiplier,.1);assert.equal(huntingRewardFor(s,3,now).multiplier,1);
});

test('level 50 zone 30 deposits 100 berries and 60 XP, then 25 and 15 after daily 100, across save restore',()=>{
 const now=new Date(2026,9,29,12).getTime(),s=newSave('모험가',0);s.level=50;
 const event={type:'defeat' as const,id:'level50-99',enemyId:'0',enemyType:'melee' as const,zone:2,practice:false};
 grantHuntingReward(s,{...event,id:'seed'},now);s.career.daily.counts[2]=99;
 const berries=s.berries,xp=s.xp,full=grantHuntingReward(s,event,now);
 assert.equal(full.berries,100);assert.equal(full.xp,60);assert.equal(s.berries-berries,100);assert.equal(s.xp-xp,60);assert.equal(s.career.daily.counts[2],100);
 const restored=validateSave(JSON.parse(JSON.stringify(s))),reduced=grantHuntingReward(restored,{...event,id:'level50-100'},now);
 assert.equal(reduced.berries,25);assert.equal(reduced.xp,15);assert.equal(reduced.multiplier,.25);assert.equal(restored.berries-s.berries,25);assert.equal(restored.xp-s.xp,15);assert.equal(restored.career.stats.totalBerries-s.career.stats.totalBerries,25);
 const once=structuredClone(restored);assert.equal(grantHuntingReward(restored,{...event,id:'level50-100'},now).eligible,false);assert.deepEqual(restored,once);
 assert.equal(huntingRewardFor(restored,2,now+86400000).berries,100);
 restored.potions.berryMultiplier=3;restored.potions.berryUntil=now+10000;restored.potions.xpMultiplier=4;restored.potions.xpUntil=now+10000;
 assert.equal(huntingRewardFor(restored,2,now).berries,75);assert.equal(huntingRewardFor(restored,2,now).xp,60);
});
