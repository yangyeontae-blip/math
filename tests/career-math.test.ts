import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyCareer,selectJob,advanceJob,startCareerMathTrial,recordCareerMathAnswer,careerMathTrialView,validCareer} from '../src/academy';
import {newSave,validateSave} from '../src/rules';

test('math trials require the chosen job and level, combine forest and arena, and cannot repeat credit after completion',()=>{
 const p=emptyCareer();assert.equal(startCareerMathTrial(p,'knight',10),false);selectJob(p,'knight',10);
 assert.equal(startCareerMathTrial(p,'knight',9),false);assert.equal(recordCareerMathAnswer(p,10,'forest'),null);
 for(const [rank,target,level] of [[1,5,10],[2,10,30],[3,15,60],[4,20,100],[5,25,200]] as const){
  assert.equal(startCareerMathTrial(p,'knight',level),true);
  assert.equal(advanceJob(p,'knight',level),false);
  for(let i=1;i<=target;i++){
   const progress=recordCareerMathAnswer(p,level,i%2?'forest':'arena');
   assert.deepEqual(progress,{correct:i,target,complete:i===target});
   assert.equal(validCareer(p),true);
  }
  assert.equal(recordCareerMathAnswer(p,level,'arena'),null);assert.equal(startCareerMathTrial(p,'knight',level),false);
  assert.equal(p.trials.knight,rank);assert.equal(advanceJob(p,'knight',level),true);
 }
 assert.equal(careerMathTrialView(p,200),null);
});

test('partial math missions survive game export/reload and job changes without resetting or granting unearned ranks',()=>{
 const s=newSave('수학모험가',0);s.level=30;selectJob(s.career,'mage',30);startCareerMathTrial(s.career,'mage',30);recordCareerMathAnswer(s.career,30,'forest');
 const loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.version,26);assert.equal(careerMathTrialView(loaded.career,30)?.correct,1);
 selectJob(loaded.career,'ranger',30);startCareerMathTrial(loaded.career,'ranger',30);recordCareerMathAnswer(loaded.career,30,'arena');recordCareerMathAnswer(loaded.career,30,'arena');
 selectJob(loaded.career,'mage',30);startCareerMathTrial(loaded.career,'mage',30);assert.equal(careerMathTrialView(loaded.career,30)?.correct,1);
 assert.equal(loaded.career.ranks.mage,0);assert.equal(loaded.berries,s.berries);
 selectJob(loaded.career,'ranger',30);assert.equal(careerMathTrialView(loaded.career,30)?.correct,2);
});

test('legacy earned trials remain valid while malformed optional progress is rejected',()=>{
 const p=emptyCareer();p.job='mage';p.trials.mage=1;assert.equal(validCareer(p),true);assert.equal(careerMathTrialView(p,10)?.complete,true);assert.equal(advanceJob(p,'mage',10),true);
 for(const mathTrials of [null,[],{mage:{rank:1,correct:6}},{mage:{rank:2,correct:-1}},{mage:{rank:3,correct:1.5}},{mage:{rank:6,correct:1}},{invalid:{rank:1,correct:1}}])assert.equal(validCareer({...p,mathTrials}),false);
});
