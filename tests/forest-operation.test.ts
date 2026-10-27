import { test } from 'node:test';
import assert from 'node:assert/strict';
import { operationsForGrade, battleMode, canEnter, newSave, validateSave, Encounter, OPERATIONS, type Question, type PracticeTier } from '../src/rules';
import { expeditionUnlocked } from '../src/expedition';

test('forests ignore every arena operation, difficulty and legacy skip setting in all grades', () => {
  for (const grade of [1,2,3,4,5,6] as const) for (const forest of operationsForGrade(grade)) {
    for (const selected of ['auto', ...OPERATIONS] as const) for (const skip of [false,true]) {
      const s=newSave('모험가',0,grade);s.forest=forest;s.settings.practice={operation:selected,tier:2,skipPicker:skip};
      const mode=battleMode(s,false);assert.equal(mode.operation,forest);assert.equal(mode.practice,undefined);
      for(const stage of [1,5,10]) {const q: Question=new Encounter(0,false,1,undefined,stage,0,mode.operation,'stage',mode.practice,grade).question;assert.equal(q.operation??'division',forest);}
    }
  }
});
test('arena auto and explicit choices stay in the allowed grade range for all five rounds',()=>{
  for(const grade of [1,2,3,4,5,6] as const) for(const choice of ['auto',...OPERATIONS] as const){
    const s=newSave('모험가',0,grade);s.forest='subtraction';s.settings.practice.operation=choice;
    const mode=battleMode(s,true), allowed=operationsForGrade(grade);assert.ok(allowed.includes(mode.operation));
    assert.equal(mode.operation,choice==='auto'||!allowed.includes(choice)?'subtraction':choice);
    let previous: Question | undefined;
    for(let round=0;round<5;round++){previous=new Encounter(0,true,1,previous,2,0,previous?.operation??mode.operation,'stage',mode.practice,grade).question;assert.equal(previous.operation??'division',mode.operation);}
  }
});
test('grade 1 cannot choose or enter multiplication and division, even with teacher mode',()=>{
  assert.deepEqual(operationsForGrade(1),['addition','subtraction']);
  assert.deepEqual(operationsForGrade(2),['addition','subtraction','multiplication']);
  const s=newSave('모험가',0,1);s.teacherMode=true;
  for(const forest of ['multiplication','division'] as const)for(const stage of [0,1,10])assert.equal(canEnter(s,stage,forest),false);
  assert.equal(canEnter(s,10,'addition'),true);assert.equal(expeditionUnlocked(s),false);
});
test('old wrong forest and arena preferences normalize without losing progress or belongings',()=>{
  for(const grade of [1,2] as const){
    const s=newSave('모험가',0,grade);s.forest='division';s.journey.stage=1;s.journey.maps[1].berries=[0];s.berries=432;s.settings.practice={operation:'division',tier:2,skipPicker:true};
    const restored=validateSave(JSON.parse(JSON.stringify(s)));
    assert.equal(restored.version,22);assert.equal(restored.forest,'addition');assert.equal(restored.additionJourney.stage,0);assert.equal(restored.settings.practice.operation,'auto');
    assert.equal(restored.berries,432);assert.deepEqual(restored.journey,s.journey);assert.deepEqual(restored.weapons,s.weapons);assert.deepEqual(restored.curriculum,s.curriculum);
    assert.deepEqual(restored.position,{x:0,z:8});
  }
});
test('allowed saved choices and forest progress remain intact when reloading',()=>{
  const s=newSave('모험가',0,1);s.forest='subtraction';s.subtractionJourney.stage=1;s.settings.practice={operation:'addition',tier:0 as PracticeTier,skipPicker:true};
  const restored=validateSave(s);assert.equal(restored.forest,'subtraction');assert.equal(restored.subtractionJourney.stage,1);assert.deepEqual(restored.settings.practice,s.settings.practice);
});
