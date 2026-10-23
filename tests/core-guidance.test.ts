import test from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, practiceQuestion, operationsForGrade, type Question } from '../src/rules';
import { craftHome, placeHome, storeHome, claimHomeMemory, HOME_REQUESTS } from '../src/homestead';
import { homeRecommendation, requestChecklist } from '../src/home-guidance';
import { HintProgress, earlyCalculationHint } from '../src/battle-hints';

test('garden goals progress through placement, memory and reload without a new save field', () => {
  for (const grade of [1,3,6] as const) {
    const s=newSave('탐험가',0,grade),keys=Object.keys(s.homestead);
    craftHome(s,6,true);placeHome(s,6,2,3,0,true);
    assert.equal(homeRecommendation(s,false).label,'벤치를 놓아 첫 부탁 준비하기');
    assert.deepEqual(requestChecklist(s,0,false).map(x=>x.placed),[true,false]);
    craftHome(s,18,true);placeHome(s,18,5,4,0,true);
    assert.equal(homeRecommendation(s,false).action,'request');
    assert.ok(claimHomeMemory(s,0));assert.equal(claimHomeMemory(s,0),false);
    const berries=s.berries;storeHome(s,s.homestead.objects[0].uid);
    const restored=validateSave(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(Object.keys(restored.homestead),keys);assert.deepEqual(restored.homestead.memories,[0]);
    assert.equal(restored.berries,berries);assert.equal(homeRecommendation(restored,false).id,1);
  }
});

test('recommendations prioritize ready requests, respect blueprints and never sell premium work as free', () => {
  const s=newSave('탐험가',0,3),before=structuredClone(s);
  homeRecommendation(s,false);assert.deepEqual(s,before);
  for (const [kind,c,r] of [[0,1,1],[21,2,1]]) {craftHome(s,kind,true);placeHome(s,kind,c,r,0,true);}
  assert.equal(homeRecommendation(s,true).id,1);assert.equal(homeRecommendation(s,true).action,'request');
  s.homestead.memories=[0,1];
  assert.equal(homeRecommendation(s,false).action,'free');
  assert.equal(homeRecommendation(s,true).action,'discover');
  s.exploration.solved=['addition:1','addition:2','addition:3','addition:4','addition:5','addition:6'];
  assert.equal(homeRecommendation(s,true).id,2);
  s.homestead.memories=HOME_REQUESTS.map((_,id)=>id);s.homestead.objects=[];
  assert.equal(homeRecommendation(s,true).label,'정원을 자유롭게 꾸미고 주민과 쉬기');
});

test('automatic mistakes never advance hints; new questions start without help', () => {
  const progress=new HintProgress();assert.equal(progress.stage,0);
  assert.equal(progress.first(),1);assert.equal(progress.first(),1);
  assert.equal(progress.next(),2);assert.equal(progress.first(),2);
  assert.equal(progress.next(),3);assert.equal(progress.next(),3);assert.equal(progress.first(),3);
  assert.equal(new HintProgress().stage,0);
});

test('early hints keep the final result unsolved for all grades and arithmetic modes', () => {
  for(const grade of [1,3,6] as const)for(const op of operationsForGrade(grade))for(let i=0;i<60;i++){
    const q=practiceQuestion(op,2,undefined,3,grade),before=structuredClone(q);
    for(const step of [1,2]){
      const hint=earlyCalculationHint(q,step);
      assert.ok(hint.length>20);assert.doesNotMatch(hint,new RegExp(`=\\s*${q.answer}(?:<|\\s|$)`));
      assert.doesNotMatch(hint,/class="group"|<i>|정답은|몫 \d|나머지 \d/);
    }
    assert.deepEqual(q,before);
  }
  const q:Question={dividend:29,divisor:4,answer:7,remainder:1,operation:'division'};
  assert.match(earlyCalculationHint(q,2),/4 × □ \+ □ = 29/);
  for(const operation of ['addition','subtraction','multiplication','division'] as const){
    assert.ok(earlyCalculationHint({...q,operation,places:[1,1,1]},1).includes('소수'));
  }
});
