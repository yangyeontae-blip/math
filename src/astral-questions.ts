import type {CurriculumQuestion, CurriculumVisual} from './curriculum';
import {generateCurriculumQuestion} from './curriculum';
import {generateGradeQuestion,gradeTopics} from './grade-content';
import {numberQ,choiceQ,dec,pick,shuffle} from './grade-helpers';
import {guardLeak} from './leak-guard';
import type {SchoolGrade,NewCurriculumUnitId} from './rules';

export type AstralQuestion=CurriculumQuestion & {astral:{grade:SchoolGrade;family:string;givens:number[]}};
export function studyRandom(seed:number){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
const int=(r:()=>number,a:number,b:number)=>a+Math.floor(r()*(b-a+1));
const unitFor=(family:number):NewCurriculumUnitId=>family===0?'plane':family===1?'measurement':'pictograph';
/** New reasoning tasks stay within the selected grade, independent of character level. */
export function appliedAstralQuestion(grade:SchoolGrade,family:number,stage:number,r:()=>number):AstralQuestion{
 const zone=['혜성잎 숲','수정고리 숲','은하수 지혜숲'][family],names=['별씨앗','빛구슬','수정 조각'] as const,item=pick(names,r);
 let q:CurriculumQuestion,givens:number[]=[],mode='';
 const make=(prompt:string,answer:number,explanation:string,visual:CurriculumVisual={kind:'none'})=>numberQ(unitFor(family),'조건을 이어 푸는 심화 문제',prompt,answer,visual,explanation,{detail:zone+'에서 필요한 조건을 찾아 차례로 풀어 보세요.',hints:['주어진 수와 마지막에 구하는 것을 따로 찾아봐요.','첫 조건의 결과를 구한 뒤, 다음 조건에 이어서 사용해요.','계산한 결과가 이야기의 조건에 모두 맞는지 확인해요.']});
 if(family===0){
  if(grade===1){const a=int(r,3,9),b=int(r,2,9),c=int(r,1,Math.min(a+b-1,5));givens=[a,b,c];mode='add-give';q=make(`${item}이 ${a}개 있었어요. ${b}개를 더 찾은 뒤 친구에게 ${c}개 주었어요. 지금 몇 개 있나요?`,a+b-c,`${a}개와 ${b}개를 모으면 ${a+b}개예요. 그중 ${c}개를 주면 ${a+b-c}개가 남아요.`);}
  else if(grade===2){const a=int(r,2,9),b=int(r,2,9),c=int(r,1,Math.min(9,a*b-1));givens=[a,b,c];mode='groups-give';q=make(`상자 ${a}개에 ${item}이 ${b}개씩 있어요. 모두 꺼내 ${c}개를 사용하면 몇 개 남나요?`,a*b-c,`${a} × ${b} = ${a*b}개, ${a*b} − ${c} = ${a*b-c}개예요.`);}
  else if(grade===3){const a=int(r,12,45),b=int(r,2,9),c=int(r,4,Math.min(30,a*b-1));givens=[a,b,c];mode='groups-give';q=make(`정령 ${b}마리가 ${item}을 ${a}개씩 가져왔어요. 그중 ${c}개로 길을 밝히면 몇 개 남나요?`,a*b-c,`${a} × ${b} = ${a*b}개를 모았어요. ${a*b} − ${c} = ${a*b-c}개가 남아요.`);}
  else if(grade===4){const a=int(r,11,25),b=int(r,12,35),c=int(r,3,19);givens=[a*b,b,c];mode='share-add';q=make(`${item} ${a*b}개를 ${b}곳에 똑같이 나누었어요. 한 곳에 ${c}개를 더 놓으면 그곳에는 몇 개가 있나요?`,a+c,`${a*b} ÷ ${b} = ${a}개, ${a} + ${c} = ${a+c}개예요.`);}
  else if(grade===5){const a=int(r,11,49),b=int(r,2,7),c=int(r,1,9);givens=[a,b,c];mode='decimal-buy';q=make(`빛줄 한 개의 길이는 ${dec(a/10)} m예요. ${b}개의 길이를 모두 합한 뒤 ${dec(c/10)} m를 더 이으면 몇 m인가요?`,Number(dec((a*b+c)/10)),`${dec(a/10)} × ${b} = ${dec(a*b/10)} m예요. 여기에 ${dec(c/10)} m를 더하면 ${dec((a*b+c)/10)} m예요.`);}
  else {const a=int(r,2,6),b=int(r,7,18),c=int(r,5,12),d=int(r,1,6);givens=[a,a*b,c,d];mode='proportion-give';q=make(`같은 꾸러미 ${a}개에 ${item}이 모두 ${a*b}개 있어요. 꾸러미 ${c}개에서 ${d}개를 꺼내 쓰면 몇 개 남나요?`,b*c-d,`꾸러미 하나에는 ${a*b} ÷ ${a} = ${b}개가 있어요. ${b} × ${c} − ${d} = ${b*c-d}개예요.`);}
 }else if(family===1){
  if(grade===1){const labels=['혜성 나무','달빛 나무','별꽃 나무'],order=shuffle([0,1,2],r);givens=order;mode='compare-chain';q=choiceQ('measurement','두 비교를 연결하기',`${labels[order[1]]}는 ${labels[order[0]]}보다 길어요. ${labels[order[2]]}는 ${labels[order[1]]}보다 길어요. 가장 긴 것은 무엇인가요?`,labels[order[2]],labels.filter((_,i)=>i!==order[2]),{kind:'scene',items:labels.map(label=>({icon:'🌱',label}))},`짧은 것부터 ${labels[order[0]]}, ${labels[order[1]]}, ${labels[order[2]]} 순서예요.`,r,{hints:['두 문장에서 어느 나무가 더 긴지 각각 찾아봐요.','짧은 것부터 나무 이름을 이어서 놓아 보세요.','두 비교를 모두 만족하는 순서를 확인해요.']});}
  else if(grade===2){const a=int(r,1,3),b=int(r,10,60),c=int(r,1,9);givens=[a,b,c];mode='length-cut';q=make(`길이가 ${a} m ${b} cm인 빛줄에서 ${c} cm를 잘랐어요. 남은 길이는 모두 몇 cm인가요?`,a*100+b-c,`${a} m는 ${a*100} cm예요. ${a*100} + ${b} − ${c} = ${a*100+b-c} cm예요.`);}
  else if(grade===3){const a=int(r,2,8),b=int(r,10,45),c=int(r,15,45);givens=[a,b,c];mode='time-add';q=make(`첫 길을 걷는 데 ${a}분 ${b}초, 다음 길을 걷는 데 ${c}초 걸렸어요. 모두 몇 초 걸렸나요?`,a*60+b+c,`${a}분은 ${a*60}초예요. ${a*60} + ${b} + ${c} = ${a*60+b+c}초예요.`);}
  else if(grade===4){const a=int(r,12,35),b=int(r,10,25);givens=[90,a,b];mode='angle-parts';q=make(`직각을 세 부분으로 나누었어요. 두 부분이 각각 ${a}도, ${b}도이면 나머지 한 부분은 몇 도인가요?`,90-a-b,`직각은 90도예요. 90 − ${a} − ${b} = ${90-a-b}도예요.`,{kind:'geometry',shape:'right-angle'});}
  else if(grade===5){const a=int(r,10,18),b=int(r,4,7)*2,c=int(r,4,6);givens=[a,b,c];mode='area-cut';q=make(`가로 ${a} cm, 세로 ${b} cm인 직사각형 종이에서 밑변 ${b} cm, 높이 ${c} cm인 삼각형을 잘라 냈어요. 남은 넓이는 몇 제곱cm인가요?`,a*b-b*c/2,`직사각형은 ${a*b}제곱cm, 삼각형은 ${b} × ${c} ÷ 2 = ${b*c/2}제곱cm예요. 남은 넓이는 ${a*b-b*c/2}제곱cm예요.`);}
  else {const a=int(r,4,9),b=int(r,3,8),c=int(r,2,6),d=int(r,2,10);givens=[a,b,c,d];mode='volume-remove';q=make(`한 변이 1 cm인 정육면체를 빈틈없이 쌓아 가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 직육면체를 만들었어요. 정육면체 ${d}개를 꺼내면 남은 부피는 몇 세제곱cm인가요?`,a*b*c-d,`처음 부피는 ${a} × ${b} × ${c} = ${a*b*c}세제곱cm예요. ${d}세제곱cm를 빼면 ${a*b*c-d}세제곱cm예요.`);}
 }else{
  if(grade<=2){const a=int(r,grade===1?3:8,grade===1?7:24),b=int(r,grade===1?3:8,grade===1?7:24),c=int(r,1,Math.min(a+b-1,grade===1?5:12));givens=[a,b,c];mode='add-give';q=make(`빛씨앗을 첫날 ${a}개, 다음 날 ${b}개 모았어요. ${c}개로 등불을 만들면 몇 개 남나요?`,a+b-c,`${a} + ${b} − ${c} = ${a+b-c}개예요.`,{kind:'bar-graph',labels:['첫날','다음 날'],values:[a,b],unit:'개'});}
  else if(grade===3||grade===4){const a=int(r,3,8),b=int(r,3,8),c=int(r,1,Math.min(a+b-1,5)),d=grade===3?5:10;givens=[a,b,c,d];mode='pictograph-difference';q=make(`그림 하나는 ${d}개를 나타내요. 가 마을과 나 마을의 수를 합하면 다 마을보다 몇 개 더 많나요?`,(a+b-c)*d,`(${a} + ${b} − ${c}) × ${d} = ${(a+b-c)*d}개예요.`,{kind:'pictograph',icon:'⭐',value:d,unitLabel:'개',rows:[{label:'가',icons:a},{label:'나',icons:b},{label:'다',icons:c}]});}
  else if(grade===5){const mean=int(r,12,24),a=mean-int(r,1,4),b=mean+int(r,1,4),c=mean-int(r,1,4);givens=[mean,4,a,b,c];mode='average-missing';q=make(`네 곳에서 모은 ${item} 수의 평균은 ${mean}개예요. 세 곳에서 각각 ${a}개, ${b}개, ${c}개를 모았다면 나머지 한 곳에서는 몇 개를 모았나요?`,mean*4-a-b-c,`전체는 ${mean} × 4 = ${mean*4}개예요. 세 곳의 합 ${a+b+c}개를 빼면 ${mean*4-a-b-c}개예요.`);}
  else {const a=int(r,3,10)*40,b=pick([20,25,30,40,50],r);givens=[a,b,2];mode='percent-groups';q=make(`모험가 ${a}명 중 ${b}%가 수정고리 숲을 골랐어요. 그 사람들을 인원이 같은 두 모둠으로 나누면 한 모둠은 몇 명인가요?`,a*b/100/2,`${a} × ${b}/100 = ${a*b/100}명이에요. ${a*b/100} ÷ 2 = ${a*b/100/2}명이에요.`);}
 }
 q.unit=family===0?(grade===1?'addition':grade<=3?'multiplication':grade===4?'division':grade===5?'fractionDecimal':'measurement'):family===1?(grade<=4?'lengthTime':'measurement'):'pictograph';
 return Object.assign(guardLeak(q),{astral:{grade,family:mode,givens}});
}
const UNITS:NewCurriculumUnitId[]=['plane','lengthTime','fractionDecimal','circle','fraction','measurement','pictograph'];
export function astralQuestions(grade:SchoolGrade,forest:number,stage:number,seed:number):CurriculumQuestion[]{
 const r=studyRandom(seed),seen=new Set<string>(),out:CurriculumQuestion[]=[];
 for(let slot=0;slot<5;slot++){
  let q:CurriculumQuestion|undefined;
  for(let attempt=0;attempt<150;attempt++){
   if(slot===4){const unit=forest===1?pick(grade===4?['circle','lengthTime','triangle'] as const:grade===2?['circle','lengthTime','fractionDecimal'] as const:['circle','measurement','lengthTime'] as const,r):pick(UNITS,r);q=grade===3?generateCurriculumQuestion(unit,5+int(r,0,3),r):generateGradeQuestion(grade,unit,gradeTopics(grade,unit).length+int(r,0,gradeTopics(grade,unit).length-1),r);}
   else q=appliedAstralQuestion(grade,forest===2?(slot+stage)%3:forest,stage,r);
   const key=q.prompt+'|'+(q.detail??'')+'|'+JSON.stringify(q.visual);if(!seen.has(key)){seen.add(key);break;}q=undefined;
  }
  if(!q)throw Error('서로 다른 심화 문제를 만들지 못했어요. 다시 시작해 주세요.');out.push(q);
 }
 return out;
}