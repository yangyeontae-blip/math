import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, journeyFor, type SchoolGrade } from '../src/rules';
import { FIELD_FORESTS, emptyForestActivities, fieldHere, fieldSpec, fieldReady, changeForestWork, finishForestWork, validForestActivities, type FieldForest } from '../src/forest-activities';

function start(forest: FieldForest, grade: SchoolGrade = 3) { const s = newSave('숲친구',0,grade); s.forest=forest; journeyFor(s).stage=1; s.position={x:0,z:17}; return s; }
function prepare(s: ReturnType<typeof start>, step: number) {
  if (!fieldHere(s)) throw Error('not available');
  const {a,b}=fieldSpec(s.forest,s.grade,step);
  if(s.forest==='division') for(let i=0;i<a/b;i++) assert.equal(changeForestWork(s,step,-1),true);
  else for(let i=0;i<(s.forest==='subtraction'?b:a);i++) assert.equal(changeForestWork(s,step,i),true);
}
test('version 19 migration preserves the completed and partial addition trail, inventories, village and learning', () => {
  const s=start('subtraction'); s.berries=87; s.forestTrail={seeds:[0,1,2],lit:[0],placed:[3,1,0],drafts:['22','1','']};
  const old={...structuredClone(s),version:19} as Record<string,unknown>; delete old.forestActivities;
  const after=validateSave(old); assert.equal(after.version,21); assert.deepEqual(after.forestActivities,emptyForestActivities());
  for(const key of ['forestTrail','weapons','adventure','learning','berries','additionJourney'] as const) assert.deepEqual(after[key],s[key]);
});
test('all new activities respect grades, first-stage bounds, room and expedition exclusion', () => {
  for(const grade of [1,2,3,6] as SchoolGrade[]) for(const forest of FIELD_FORESTS) {
    const s=start(forest,grade), allowed=forest==='subtraction'||(forest==='multiplication'?grade>=2:grade>=3);
    assert.equal(fieldHere(s),allowed); assert.equal(changeForestWork(s,0,0),allowed);
    journeyFor(s).stage=2; assert.equal(changeForestWork(s,0,0),false);
    journeyFor(s).stage=1; s.room.inside=true; assert.equal(finishForestWork(s,0),false);
  }
});
test('subtraction can undo chosen thorns; incomplete and wrong submissions preserve every item', () => {
  const s=start('subtraction',1); assert.equal(changeForestWork(s,0,0),true); assert.equal(changeForestWork(s,0,0),true); assert.deepEqual(s.forestActivities.subtraction.values[0],[]);
  const w=s.forestActivities.subtraction; w.drafts[0]='5'; assert.equal(finishForestWork(s,0),false);
  changeForestWork(s,0,0); changeForestWork(s,0,1); w.drafts[0]='4';
  const before=structuredClone(s); assert.equal(finishForestWork(s,0),false); assert.deepEqual(s,before);
  const after=validateSave(s); assert.deepEqual(after.forestActivities,s.forestActivities); after.forestActivities.subtraction.drafts[0]='5'; assert.equal(finishForestWork(after,0),true);
});
test('multiplication requires all equal-sized flower rows and a submitted answer', () => {
  assert.equal(fieldSpec('multiplication',2,0).equation,'3 × 2');
  const s=start('multiplication',2),w=s.forestActivities.multiplication; w.drafts[0]='6';
  changeForestWork(s,0,0); assert.equal(finishForestWork(s,0),false); changeForestWork(s,0,1);
  assert.equal(fieldReady('multiplication',2,0,w.values[0]),true); assert.deepEqual(w.done,[]);
  assert.equal(finishForestWork(s,0),true); assert.equal(finishForestWork(s,0),false); assert.equal(changeForestWork(s,0,0),false);
});
test('division conserves finite water, permits returns, and rejects unequal full allocations', () => {
  const s=start('division'),w=s.forestActivities.division;
  assert.equal(changeForestWork(s,0,0,-1),false);
  for(let i=0;i<12;i++) assert.equal(changeForestWork(s,0,0),true);
  assert.equal(changeForestWork(s,0,1),false); assert.equal(changeForestWork(s,0,-1),false);
  w.drafts[0]='4'; assert.equal(finishForestWork(s,0),false);
  for(let i=0;i<8;i++) { changeForestWork(s,0,0,-1); changeForestWork(s,0,i%2+1); }
  assert.deepEqual(w.values[0],[4,4,4]); assert.equal(finishForestWork(s,0),true);
  assert.deepEqual(validateSave(s).forestActivities,s.forestActivities);
});
test('each supported grade completes three distinct ordered stations; progress is separate with no farming or stage unlock', () => {
  for(const grade of [1,2,3,4,5,6] as SchoolGrade[]) for(const forest of FIELD_FORESTS) {
    const s=start(forest,grade); if(!fieldHere(s)) continue;
    const before=structuredClone(journeyFor(s)); assert.equal(changeForestWork(s,1,0),false);
    for(let step=0;step<3;step++) {
      const {answer}=fieldSpec(forest,grade,step); prepare(s,step);
      s.forestActivities[forest].drafts[step]=String(answer); assert.equal(finishForestWork(s,step),true); assert.equal(finishForestWork(s,step),false);
      assert.deepEqual(validateSave(s).forestActivities,s.forestActivities);
    }
    assert.equal(s.berries,0); assert.equal(s.xp,0); assert.deepEqual(journeyFor(s),before);
    for(const other of FIELD_FORESTS.filter(f=>f!==forest)) assert.deepEqual(s.forestActivities[other].done,[]);
  }
});
test('impossible water, duplicate objects, out-of-order completion and invalid draft data are rejected', () => {
  for(const change of [
    (w:ReturnType<typeof emptyForestActivities>)=>{w.division.values[0]=[13,0,0];},
    (w:ReturnType<typeof emptyForestActivities>)=>{w.division.values[0]=[-1,0,0];},
    (w:ReturnType<typeof emptyForestActivities>)=>{w.subtraction.values[0]=[0,0];},
    (w:ReturnType<typeof emptyForestActivities>)=>{w.multiplication.values[1]=[0];},
    (w:ReturnType<typeof emptyForestActivities>)=>{w.division.done=[1];},
    (w:ReturnType<typeof emptyForestActivities>)=>{w.subtraction.drafts[0]='<b>';},
  ]) { const w=emptyForestActivities(); change(w); assert.equal(validForestActivities(w,3),false); assert.throws(()=>validateSave({...start('division'),forestActivities:w})); }
  const s=start('division'); for(const step of [-1,3,NaN,.5]) assert.equal(changeForestWork(s,step,0),false);
  for(const slot of [-2,3,NaN,.5]) assert.equal(changeForestWork(s,0,slot),false);
});
