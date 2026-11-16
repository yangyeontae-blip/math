import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSave,validateSave,upgrade,huntingPower,huntingRewardFor,WEAPON_UPGRADES,buy,WEAPONS} from '../src/rules';
import {startExpedition,expeditionUnlocked} from '../src/expedition';
import {stageMonsters} from '../src/stages';
import {selectTitle,titleEffect} from '../src/titles';
import {plazaProfile} from '../src/plaza-identity';
import {compatiblePlazaProfile,parsePlazaProfile} from '../src/plaza-protocol';

test('expedition entry matches the final-stage requirement and clears the previous location',()=>{
 const s=newSave('별길',0,3);
 assert.equal(expeditionUnlocked(s),false);
 for(let stage=1;stage<=10;stage++){s.journey.maps[stage].cleared=true;s.journey.maps[stage].monsters=stageMonsters(stage).map((_,id)=>id);}
 assert.equal(expeditionUnlocked(s),true);
 s.homestead.inside=true;s.room.inside=false;
 assert.equal(startExpedition(s),true);
 assert.equal(s.homestead.inside,false);
 assert.equal(s.career.location,null);assert.equal(s.world2.location,null);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).expedition,s.expedition);
 const progress=structuredClone(s.expedition);
 s.journey.stage=0;
 assert.equal(startExpedition(s),true);
 assert.deepEqual(s.expedition,progress);
});

test('earned equipped titles boost combat and berries without stacking or granting locked effects',()=>{
 const s=newSave('숲길',0,3);s.level=300;
 const plain=huntingPower(s),berries=huntingRewardFor(s,3).berries;
 selectTitle(s,'level-300');assert.equal(titleEffect(s).attack,1.15);
 assert.ok(Math.abs(huntingPower(s)/plain-1.15)<1e-9);
 assert.equal(huntingRewardFor(s,3).berries,Math.floor(berries*1.15));
 s.level=1;assert.equal(titleEffect(s).attack,1);
 s.level=300;selectTitle(s,null);assert.equal(huntingPower(s),plain);
});

test('new weapons and ten guaranteed upgrades spend exactly the price and restore without loss',()=>{
 const s=newSave('공방',0,3);s.berries=1000000;
 for(let id=39;id<=41;id++){
  const before=s.berries;buy(s,'weapon',id);assert.equal(s.berries,before-WEAPONS[id].price);
  let power=huntingPower(s);
  for(const cost of WEAPON_UPGRADES){const b=s.berries;upgrade(s,'weapon',id);assert.equal(s.berries,b-cost);assert.ok(huntingPower(s)>power);power=huntingPower(s);}
  const beforeMax=structuredClone(s);assert.throws(()=>upgrade(s,'weapon',id));assert.deepEqual(s,beforeMax);
  assert.equal(validateSave(JSON.parse(JSON.stringify(s))).weapons[id],10);
  const profile=plazaProfile(s)!;assert.ok(profile);assert.equal(profile.weaponLevel,3);
  assert.ok(parsePlazaProfile(compatiblePlazaProfile(profile,3)));assert.ok(compatiblePlazaProfile(profile,3).weapon<39);
 }
});
