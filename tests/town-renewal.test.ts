import test from 'node:test';
import assert from 'node:assert/strict';
import {Encounter,recordWrongAnswer,newSave,validateSave,questionAnswerText,practiceQuestion,type SchoolGrade,type Question} from '../src/rules';
import {generateReviewQuestion,answerCurriculumQuestion} from '../src/curriculum';
import {worldMap} from '../src/world-map';
import {trailPair,validForestTrail} from '../src/forest-trail';
import {VILLAGE_SPOTS,MARKET_SHOPS} from '../src/village-layout';
import {isVillagePond} from '../src/stages';

test('grades 3–6 have a grade floor even on stage one and easy practice; every answer submits correctly',()=>{
 for(const grade of [3,4,5,6] as const)for(const operation of ['addition','subtraction'] as const)for(const stage of [1,5,10]){
  let previous:Question|undefined;for(let i=0;i<80;i++){
   const encounter=new Encounter(0,false,1,previous,stage,0,operation,'stage',undefined,grade),q=encounter.question;
   if(!q.places){assert.ok(q.dividend>=(grade===3?100:1000));assert.ok(q.divisor>=(grade===3?100:1000));}
   else {assert.ok(q.dividend/10**q.places[0]>=10);assert.ok(q.divisor/10**q.places[1]>=10);}
   assert.equal(q.answer,operation==='addition'?q.dividend+q.divisor:q.dividend-q.divisor);
   assert.equal(encounter.answer('0'),'wrong');assert.equal(encounter.answer(questionAnswerText(q)),'correct');assert.equal(encounter.answer(questionAnswerText(q)),'ignored');previous=q;
  }
  for(const tier of [0,1,2] as const){const q=practiceQuestion(operation,tier,undefined,1,grade);if(!q.places)assert.ok(q.divisor>=(grade===3?100:1000));}
 }
 for(const grade of [1,2] as const){const q=new Encounter(0,false,1,undefined,1,0,'addition','stage',undefined,grade).question;assert.ok(q.dividend<10&&q.divisor<10);}
});
test('town and market map markers are separate and never alter an existing save',()=>{
 const s=newSave('모험가',0,3);s.berries=4321;s.learning.correct=27;s.journey.maps[1].berries=[0,2];const before=structuredClone(s);
 assert.match(worldMap(s),/aria-current="location"[^>]*>🧭 중앙 광장/);assert.match(worldMap(s,true),/aria-current="location"[^>]*>🧭 상점거리/);
 assert.deepEqual(s,before);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),before);
 assert.ok(!isVillagePond(0,VILLAGE_SPOTS.home.x,VILLAGE_SPOTS.home.z));
 for(const shop of MARKET_SHOPS)assert.ok(Math.abs(shop.x)<24&&Math.abs(shop.z)<18);
});
test('older grade light-seed activities avoid single-digit arithmetic and keep earned completion valid',()=>{
 for(const grade of [3,4,5,6] as SchoolGrade[])for(let lamp=0;lamp<3;lamp++){const [a,b]=trailPair(grade,lamp);assert.ok(a>=100&&b>=100);assert.ok(a+b<=999);}
 const s=newSave('모험가',0,6);s.forestTrail={seeds:[0,1],placed:[3,0,0],lit:[0],drafts:['22','','']};const before=structuredClone(s);assert.ok(validForestTrail(s.forestTrail));assert.deepEqual(validateSave(s).forestTrail,before.forestTrail);
});

test('mixed curriculum review also keeps the chosen grade instead of using a two-digit fallback',()=>{for(const grade of [3,4,5,6] as const)for(const operation of ['addition','subtraction'] as const)for(let i=0;i<50;i++){const q=generateReviewQuestion(operation,Math.random,grade);const nums=q.prompt.match(/\d+/g)!.map(Number);assert.ok(nums[0]>=(grade===3?100:1000)&&nums[1]>=(grade===3?100:1000));assert.ok(answerCurriculumQuestion(q,q.answer));}});

test('wrong four-digit questions survive saving without dropping old records or recovery codes',()=>{
 const s=newSave('모험가',0,4);s.berries=654;s.learning.wrongQuestions=[{dividend:24,divisor:17,answer:41,operation:'addition'}];
 for(const operation of ['addition','subtraction'] as const){const q=new Encounter(0,false,1,undefined,1,0,operation,'stage',undefined,4).question;recordWrongAnswer(s,q);}
 const before=structuredClone(s),loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,before);assert.equal(loaded.learning.wrongQuestions.length,3);
 const bad=structuredClone(s);bad.learning.wrongQuestions[0].answer++;assert.throws(()=>validateSave(bad));
});