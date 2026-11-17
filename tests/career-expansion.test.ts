import {test} from 'node:test';import assert from 'node:assert/strict';
import {newSave,validateSave} from '../src/rules';
import {ACADEMY_SKILLS,emptyCareer,selectJob,recordCareerTrial,advanceJob,careerSkills,hiddenCareerUnlocked,upgradeCareerSkill,validCareer,SKILL_UPGRADE_COSTS} from '../src/academy';
import {HuntingRuntime} from '../src/hunting';

test('six careers advance through fourth and fifth ranks with enforced level and real trial gates',()=>{
 for(const job of ['knight','mage','ranger','druid','alchemist','bard'] as const){const c=emptyCareer();if(job==='alchemist'){c.ranks.knight=c.ranks.mage=c.ranks.ranger=1;c.trials.knight=c.trials.mage=c.trials.ranger=1;c.learned=['lantern'];c.practiced=['lantern'];c.stats.defeats=30;c.stats.byZone[0]=30;}
 assert.equal(selectJob(c,job,100),true);assert.equal(advanceJob(c,job,100),false);
 for(const rank of [1,2,3,4,5] as const){const level=[0,10,30,60,100,200][rank];assert.equal(recordCareerTrial(c,job,rank),true);assert.equal(advanceJob(c,job,level-1),false);assert.equal(advanceJob(c,job,level),true);assert.equal(c.ranks[job],rank);assert.ok(careerSkills(c,level).some(id=>ACADEMY_SKILLS.find(s=>s.id===id)?.rank===rank));assert.ok(validCareer(c));}
 const slots=structuredClone(c.loadouts[job]);selectJob(c,null,100);selectJob(c,job,100);assert.deepEqual(c.loadouts[job],slots);
 }
});

test('hidden career requires each step of the documented route',()=>{
 const c=emptyCareer();assert.equal(selectJob(c,'alchemist',100),false);
 c.ranks.knight=c.ranks.mage=c.ranks.ranger=1;assert.equal(hiddenCareerUnlocked(c),false);
 c.learned=['lantern'];c.practiced=['lantern'];c.stats.defeats=29;assert.equal(hiddenCareerUnlocked(c),false);
 c.stats.defeats=30;assert.equal(hiddenCareerUnlocked(c),true);assert.equal(selectJob(c,'alchemist',100),true);
});

test('v1 careers migrate without replacing slots, earned ranks, or hunting totals',()=>{
 const s=newSave('옛숲친구',0,3),c=s.career;c.job='mage';c.ranks.mage=c.trials.mage=3;c.learned=['starfall'];c.loadouts.mage=['starfall',null,null,null];
 const legacy=JSON.parse(JSON.stringify(s));legacy.career.version=1;delete legacy.career.upgrades;for(const key of ['ranks','trials','loadouts']){delete legacy.career[key].druid;delete legacy.career[key].alchemist;}
 const restored=validateSave(legacy);assert.equal(restored.career.version,4);assert.deepEqual(restored.career.loadouts.mage,c.loadouts.mage);assert.deepEqual(restored.career.stats,c.stats);assert.equal(restored.career.ranks.mage,3);assert.equal(restored.career.ranks.druid,0);assert.deepEqual(restored.career.upgrades,{});
});

test('all new attack skills hit real enemies, empty casts spend no cooldown and upgrades affect damage',()=>{
 for(const skill of ACADEMY_SKILLS.slice(24)){
  const base={zone:0,level:100,power:1,job:skill.job,learned:[skill.id],loadout:[skill.id],practice:true};
  const empty=new HuntingRuntime(base);assert.deepEqual(empty.cast(skill.id,{x:19,z:19}),[]);assert.equal(empty.snapshot().cooldowns[skill.id],undefined);
  const runtime=new HuntingRuntime(base),p={x:0,z:2};const events=runtime.cast(skill.id,p,{x:0,z:-1});assert.ok(events.some(e=>e.type==='hit'),skill.id);assert.ok(runtime.snapshot().cooldowns[skill.id]!>0);
 }
 const s=newSave('정령친구',0,3);s.level=100;s.berries=100000;s.career.job='druid';s.career.ranks.druid=s.career.trials.druid=1;s.career.learned=['earthsong'];
 for(const cost of SKILL_UPGRADE_COSTS){const b=s.berries;upgradeCareerSkill(s,'earthsong');assert.equal(s.berries,b-cost);}
 const before=structuredClone(s);assert.throws(()=>upgradeCareerSkill(s,'earthsong'));assert.deepEqual(s,before);assert.equal(validateSave(JSON.parse(JSON.stringify(s))).career.upgrades.earthsong,5);
 const runtime=new HuntingRuntime({zone:0,level:100,power:10,job:'druid',learned:['earthsong'],loadout:['earthsong'],upgrades:s.career.upgrades,practice:true});
 const events=runtime.cast('earthsong',{x:0,z:2});const hit=events.find(e=>e.type==='hit');assert.ok(hit&&hit.type==='hit');assert.equal(hit.damage,25);
});
