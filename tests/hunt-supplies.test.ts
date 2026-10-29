import test from 'node:test';
import assert from 'node:assert/strict';
import {HuntingRuntime} from '../src/hunting';
import {newSave,validateSave,POTIONS,buyPotion,usePotion,useHuntingSupply} from '../src/rules';
import {HUNT_RECOVERY_ITEMS,huntingSupply,LEGACY_POTION_COUNT} from '../src/hunt-supplies';
import {renderCombatHud} from '../src/career-ui';
const danger={x:-6,z:-3},quiet={x:16,z:18};
function injured(){const runtime=new HuntingRuntime({zone:0,level:60,power:1});for(let i=0;i<100&&runtime.snapshot().playerHp>runtime.snapshot().maxHp*.5;i++)runtime.step(.5,danger);assert.ok(runtime.snapshot().playerHp<runtime.snapshot().maxHp*.6);return runtime;}

test('legacy six-potion v22 saves retain every item and progress, extending only the four empty recovery slots',()=>{
 const s=newSave('모험가',0);s.berries=1234;s.potions.stock=[3,2,1,4,5,6];s.potions.berryUntil=123456;s.potions.berryMultiplier=2;const before=structuredClone(s);
 const restored=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(restored.version,22);assert.deepEqual(restored.potions.stock,[3,2,1,4,5,6,0,0,0,0]);assert.equal(restored.potions.berryUntil,before.potions.berryUntil);assert.deepEqual(restored.learning,before.learning);assert.deepEqual(restored.room,before.room);assert.equal(restored.berries,1234);
 for(const stock of [[1,2,3,4,5,6,7],[-1,0,0,0,0,0],Array(11).fill(0)]){const invalid=structuredClone(before);invalid.potions.stock=stock;assert.throws(()=>validateSave(invalid));}
 assert.equal(LEGACY_POTION_COUNT,6);assert.equal(POTIONS.length,10);assert.equal(POTIONS[0].kind,'berry');assert.equal(POTIONS[5].kind,'xp');assert.equal(HUNT_RECOVERY_ITEMS.length,4);
});

test('instant potions heal the advertised capped amount and share a simulation-time cooldown',()=>{
 const r=injured(),before=r.snapshot(),used=r.consumeSupply(8);assert.ok(used.used);assert.equal(used.healed,Math.min(before.maxHp-before.playerHp,Math.round(before.maxHp*.35)));assert.equal(r.snapshot().playerHp,before.playerHp+used.healed);assert.equal(r.snapshot().supplies.health,12);
 assert.deepEqual(r.consumeSupply(9),{used:false,reason:'cooldown'});const frozen=r.snapshot();r.step(5,quiet,true);assert.deepEqual(r.snapshot(),frozen);r.step(5,quiet);r.step(5,quiet);r.step(2,quiet);assert.equal(r.snapshot().supplies.health,0);
 assert.ok(r.consumeSupply(9).used);assert.equal(r.snapshot().playerHp,r.snapshot().maxHp);
 const full=r.snapshot();assert.deepEqual(r.consumeSupply(8),{used:false,reason:'full'});assert.deepEqual(r.snapshot(),full);
});

test('food regenerates over real combat steps, never overflows, pauses, and shares a separate food cooldown',()=>{
 const a=injured(),b=injured(),before=a.snapshot();assert.ok(a.consumeSupply(6).used);assert.ok(b.consumeSupply(6).used);assert.equal(a.snapshot().playerHp,before.playerHp);assert.deepEqual(a.consumeSupply(7),{used:false,reason:'cooldown'});
 const frozen=a.snapshot();a.step(5,quiet,true);assert.deepEqual(a.snapshot(),frozen);a.step(4,quiet);a.step(4,quiet);for(let i=0;i<160;i++)b.step(.05,quiet);
 assert.ok(Math.abs(a.snapshot().playerHp-Math.min(before.maxHp,before.playerHp+before.maxHp*.4))<1e-7);assert.ok(Math.abs(a.snapshot().playerHp-b.snapshot().playerHp)<1e-7);assert.equal(a.snapshot().supplies.mealRemaining,0);assert.equal(Math.round(a.snapshot().supplies.food),17);
 const c=injured();assert.ok(c.consumeSupply(7).used);assert.ok(c.consumeSupply(8).used);c.step(5,quiet);c.step(5,quiet);assert.equal(c.snapshot().playerHp,c.snapshot().maxHp);assert.equal(c.snapshot().supplies.mealRemaining,0);
});

test('buying and using recovery inventory is bounded, charged once, saved, and rejects non-use without losing stock',()=>{
 const s=newSave('모험가',0);s.berries=1000;s.level=60;buyPotion(s,6);buyPotion(s,8);assert.equal(s.berries,925);assert.equal(s.potions.stock[6],1);assert.equal(s.potions.stock[8],1);
 const before=structuredClone(s);assert.throws(()=>useHuntingSupply(s,8,()=>({used:false,reason:'full'})));assert.deepEqual(s,before);assert.throws(()=>usePotion(s,8));assert.deepEqual(s,before);
 const r=injured();useHuntingSupply(s,8,id=>r.consumeSupply(id));assert.equal(s.potions.stock[8],0);assert.equal(s.potions.stock[6],1);assert.equal(validateSave(JSON.parse(JSON.stringify(s))).potions.stock[8],0);
 let activated=false;assert.throws(()=>useHuntingSupply(s,8,()=>{activated=true;return {used:true,healed:1};}));assert.equal(activated,false);s.potions.stock[9]=99;const balance=s.berries;assert.throws(()=>buyPotion(s,9));assert.equal(s.berries,balance);s.berries=0;assert.throws(()=>buyPotion(s,7));assert.equal(s.potions.stock[7],0);assert.equal(s.learning.correct,0);assert.equal(s.career.stats.defeats,0);
});

test('practice, invalid items and non-hunting activation never consume a recovery item',()=>{
 const r=new HuntingRuntime({zone:0,level:60,power:1,practice:true});assert.deepEqual(r.consumeSupply(6),{used:false,reason:'practice'});for(const id of [-1,0,5,10,NaN,6.5]){assert.equal(huntingSupply(id),undefined);assert.deepEqual(r.consumeSupply(id),{used:false,reason:'invalid'});}
 const s=newSave('모험가',0);s.potions.stock[6]=1;const before=structuredClone(s);assert.throws(()=>useHuntingSupply(s,6,()=>({used:false,reason:'location'})));assert.deepEqual(s,before);
});

test('recovery controls coexist with four skills and expose item quantity, keyboard key and disabled state',()=>{
 const html=renderCombatHud({hp:20,maxHp:100,skills:[null,null,null,null],supplies:[{id:8,name:'새싹 회복물약',icon:'💚',stock:2,key:'Q',disabled:false,note:'즉시 회복'},{id:6,name:'도토리 쿠키',icon:'🍪',stock:0,key:'R',disabled:true,note:'가방에 없어요'}]});
 assert.equal((html.match(/data-career-action="cast-skill"/g)||[]).length,4);assert.equal((html.match(/data-career-action="use-supply"/g)||[]).length,2);assert.match(html,/<kbd>Q<\/kbd>/);assert.match(html,/도토리 쿠키 0개, 가방에 없어요/);assert.match(html,/data-supply="6" disabled/);
});
