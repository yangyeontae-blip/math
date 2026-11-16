import {test} from 'node:test';import assert from 'node:assert/strict';
import {newSave,validateSave,grantMathQuestionXp,grantHuntingReward,huntingRewardFor} from '../src/rules';
import {upgradeBerryMachine,harvestBerryMachine,MACHINE_COSTS,MACHINE_YIELD,berryMachineMultiplier} from '../src/berry-machine';

test('a berry machine spends exact guaranteed upgrade costs and preserves its charge across save restore',()=>{
 const s=newSave('풍차지기',0,3);s.berries=100000;
 for(const [i,cost]of MACHINE_COSTS.entries()){const b=s.berries;upgradeBerryMachine(s);assert.equal(s.berries,b-cost);assert.equal(s.career.machine.level,i+1);assert.equal(berryMachineMultiplier(s),1+(i+1)*.1);}
 const max=structuredClone(s);assert.throws(()=>upgradeBerryMachine(s));assert.deepEqual(s,max);
 for(let n=0;n<10;n++)grantMathQuestionXp(s,1);assert.equal(s.career.machine.charge,10);
 const restored=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.career.machine,s.career.machine);
 const before=restored.berries;harvestBerryMachine(restored);assert.equal(restored.berries-before,MACHINE_YIELD[3]);assert.equal(restored.career.machine.charge,0);const once=structuredClone(restored);assert.throws(()=>harvestBerryMachine(restored));assert.deepEqual(restored,once);
});

test('legitimate hunting charges a machine once per event while practice, duplicates and unopened zones do not',()=>{
 const s=newSave('바람지기',0,3);s.berries=3000;upgradeBerryMachine(s);const event={type:'defeat' as const,id:'one-real-monster',enemyId:'0',enemyType:'melee' as const,zone:0,practice:false};
 const reward=grantHuntingReward(s,event);assert.equal(reward.berries,Math.floor(18*1.1));assert.equal(s.career.machine.charge,1);const before=structuredClone(s);
 grantHuntingReward(s,event);grantHuntingReward(s,{...event,id:'practice',practice:true});grantHuntingReward(s,{...event,id:'locked',zone:3});assert.deepEqual(s,before);
 assert.equal(huntingRewardFor(s,0).berries,Math.floor(18*1.1));
});

test('older career records gain an empty machine without losing learned skill upgrades',()=>{
 const s=newSave('옛공방',0,3),old=JSON.parse(JSON.stringify(s));old.career.version=2;delete old.career.machine;old.career.learned=['crescent'];old.career.upgrades={crescent:2};const migrated=validateSave(old);assert.deepEqual(migrated.career.machine,{level:0,charge:0,produced:0});assert.equal(migrated.career.upgrades.crescent,2);
 const invalid=JSON.parse(JSON.stringify(s));invalid.career.machine.charge=-1;assert.throws(()=>validateSave(invalid));
});
