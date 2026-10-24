import test from 'node:test';
import assert from 'node:assert/strict';
import { SafeSaveStore } from '../src/save-storage';
import { newSave, validateSave, practiceQuestion, type Question } from '../src/rules';
import { readLearningRecords, recordResolution, resetLearningRecords } from '../src/learning-records';
import { ConceptPractice, calculationConcept } from '../src/concept-practice';
import { buildReport, reportHtml } from '../src/report';
const memory = () => { const data = new Map<string,string>(); let writes = 0; return { data, get writes(){return writes;}, getItem:(k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>{writes++;data.set(k,v);} }; };
test('normal checkpoints recover corruption without replacing a good backup',()=>{
 const st=memory(),save=newSave('탐험가',0),store=new SafeSaveStore(()=>st,'game',validateSave);
 store.write(save,100);save.berries=10;store.write(save,200);assert.equal(store.checkpoint()!.berries,0);
 st.setItem('game','{broken');const reopened=new SafeSaveStore(()=>st,'game',validateSave);
 assert.equal(reopened.load()!.berries,0);assert.equal(reopened.status,'recovered');
 assert.ok(reopened.write(save,300));assert.equal(reopened.checkpoint()!.berries,0);
});
test('unchanged saves avoid writes and a quota failure leaves the last good save intact',()=>{
 const st=memory(),save=newSave('탐험가',0),store=new SafeSaveStore(()=>st,'game',validateSave);
 store.write(save);const writes=st.writes;store.write(save);assert.equal(st.writes,writes);
 const previous=st.getItem('game');const blocked={getItem:st.getItem,setItem:()=>{throw Error('quota');}};
 const failing=new SafeSaveStore(()=>blocked,'game',validateSave);failing.load();save.berries++;
 assert.equal(failing.write(save),false);assert.equal(failing.status,'error');assert.equal(st.getItem('game'),previous);
 assert.equal(new SafeSaveStore(()=>{throw Error('blocked');},'game',validateSave).load(),null);
});
test('resolutions are mutually exclusive and reset separately from the v21 game and purchases',()=>{
 const st=memory();st.setItem('berry-forest-entitlements-v1','keep');
 recordResolution(st,'addition',false,false);recordResolution(st,'addition',false,true);recordResolution(st,'addition',true,true);
 assert.deepEqual(readLearningRecords(st).units.addition,{independent:1,assisted:1,retried:1});
 resetLearningRecords(st);assert.deepEqual(readLearningRecords(st).units,{});assert.equal(st.getItem('berry-forest-entitlements-v1'),'keep');
 assert.equal(newSave('탐험가',0).version,21);
});
test('basic reports distinguish insufficient evidence from lack of difficulty and show new resolutions',()=>{
 const st=memory(),save=newSave('탐험가',0),regions=[{id:'addition' as const,name:'덧셈',icon:'+'}];
 recordResolution(st,'addition',false,true);const report=buildReport(save,regions,new Date(),readLearningRecords(st));
 const html=reportHtml(report);assert.match(html,/도움받아 해결/);assert.match(html,/소급 분류하지/);assert.match(html,/아직 학습 기록이 없어요/);
 assert.doesNotMatch(html,/크게 어려워하는 단원이 없어요/);
});
test('concept difficulties isolate borrowing, basic subtraction, carrying, decimal and remainder',()=>{
 const p=new ConceptPractice();const borrow:Question={operation:'subtraction',dividend:32,divisor:17,answer:15,remainder:0};
 const basic:Question={...borrow,dividend:32,divisor:11,answer:21};
 p.record(borrow,1,false);p.record(borrow,1,false);p.record(basic,1,true);
 assert.equal(p.levels.get('subtraction:borrow')!.tier,0);assert.equal(p.levels.get('subtraction:basic')!.tier,1);
 assert.equal(calculationConcept({operation:'addition',dividend:9,divisor:2,answer:11,remainder:0}),'addition:carry');
 assert.equal(calculationConcept({...borrow,places:[1,1,1]}),'subtraction:decimal');
 assert.equal(calculationConcept({operation:'division',dividend:17,divisor:3,answer:5,remainder:2}),'division:remainder');
 for(const grade of [1,2,3,4,5,6] as const)for(let i=0;i<20;i++){
  const selected=p.choose('subtraction',1,tier=>practiceQuestion('subtraction',tier,undefined,1,grade));
  assert.ok(Number.isInteger(selected.question.answer)&&selected.question.answer>=0);
 }
 p.clear();assert.equal(p.levels.size,0);
});

test('a concept unavailable at its adjusted tier cannot change another concept difficulty',()=>{
 const p=new ConceptPractice();const basic:Question={operation:'subtraction',dividend:32,divisor:11,answer:21,remainder:0};
 const borrow:Question={...basic,divisor:17,answer:15};
 p.record(borrow,1,false);p.record(borrow,1,false);
 const chosen=p.choose('subtraction',1,()=>basic);
 assert.equal(calculationConcept(chosen.question),'subtraction:basic');assert.equal(chosen.tier,1);
 p.clear();for(let i=0;i<3;i++)p.record(basic,1,true);
 const raised=p.choose('subtraction',1,tier=>tier===2?borrow:basic);
 assert.equal(calculationConcept(raised.question),'subtraction:basic');assert.equal(raised.tier,1);
});
