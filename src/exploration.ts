import { Encounter, journeyFor, canEnter, operationsForGrade, questionAnswerText, type Save, type ForestKind, type Question } from './rules';
import { STAGES } from './stages';
export interface DiscoveryPuzzle { question:Question; draft:string; hints:number }
export interface Exploration { seen:string[]; solved:string[]; puzzles:Record<string,DiscoveryPuzzle> }
export const emptyExploration=():Exploration=>({seen:[],solved:[],puzzles:{}});
export const discoveryId=(forest:ForestKind,stage:number)=>`${forest}:${stage}`;
export function parseDiscovery(id:string){const m=/^(addition|subtraction|multiplication|division):(10|[1-9])$/.exec(id);return m?{forest:m[1] as ForestKind,stage:Number(m[2])}:null;}
export function discoverySpot(stage:number){return {x:stage%2?-5:5,z:-9-(stage%3)*2};}
const THEMES={addition:['햇살','빛을 이어'],subtraction:['바람','덩굴을 정리해'],multiplication:['꽃무리','같은 무늬를 이어'],division:['물방울','고르게 나누어']} as const;
const PLACES=['숨은 정원','나무 쉼터','작은 옛터','호수 전망대','도토리 뜰','구름 쉼터','수정 정원','눈꽃 옛터','별빛 마당','무지개 전망대'];
export function discoveryInfo(forest:ForestKind,stage:number){return {name:`${THEMES[forest][0]} ${PLACES[stage-1]}`,story:`${STAGES[stage-1].name}의 발자국을 따라 도착했어요. ${THEMES[forest][1]} 이 장소를 되살려 주세요.`,icon:['🌷','🪑','🏛️'][stage%3],hint:'길 옆의 작은 발자국과 표지판을 따라가 보세요.'};}
export function syncDiscoveries(s:Save){for(const forest of operationsForGrade(s.grade)){const done=forest==='addition'?s.forestTrail.lit.length===3:s.forestActivities[forest].done.length===3;if(done){const id=discoveryId(forest,1);if(!s.exploration.seen.includes(id))s.exploration.seen.push(id);if(!s.exploration.solved.includes(id))s.exploration.solved.push(id);}}}
export function discoveryHere(s:Save){return !s.room.inside&&!s.homestead.inside&&!s.expedition.active&&journeyFor(s).stage>0&&operationsForGrade(s.grade).includes(s.forest);}
export function openDiscovery(s:Save){if(!discoveryHere(s))return null;syncDiscoveries(s);const stage=journeyFor(s).stage,id=discoveryId(s.forest,stage);if(!s.exploration.seen.includes(id))s.exploration.seen.push(id);if(stage>1&&!s.exploration.solved.includes(id)&&!s.exploration.puzzles[id])s.exploration.puzzles[id]={question:{...new Encounter(0,false,s.level,undefined,stage,s.settings.maxDividend,s.forest,s.settings.multiplicationRange,undefined,s.grade).question,operation:s.forest},draft:'',hints:0};return id;}
export function discoveryAnswerCorrect(q:Question,draft:string){const text=draft.trim().toUpperCase();return q.places?/^\d+(?:\.\d+)?$/.test(text)&&Math.abs(Number(text)-q.answer/10**q.places[2])<1e-9:text===questionAnswerText(q);}
export function solveDiscovery(s:Save,id:string){const p=parseDiscovery(id);if(!p||!discoveryHere(s)||p.forest!==s.forest||p.stage!==journeyFor(s).stage||p.stage===1||!canEnter(s,p.stage,p.forest)||s.exploration.solved.includes(id))return false;const work=s.exploration.puzzles[id];if(!work||!discoveryAnswerCorrect(work.question,work.draft))return false;s.exploration.solved.push(id);delete s.exploration.puzzles[id];s.learning.correct=Math.min(1e9,s.learning.correct+1);s.berries=Math.min(1e9,s.berries+10);return true;}
export function discoveryQuestionText(q:Question){const places=q.places??[0,0,0],n=(v:number,p:number)=>String(v/10**p);return `${n(q.dividend,places[0])} ${q.operation==='addition'?'+':q.operation==='subtraction'?'−':q.operation==='multiplication'?'×':'÷'} ${n(q.divisor,places[1])}`;}
export function validDiscoveryQuestion(q:unknown):q is Question {
  if(!q||typeof q!=='object')return false;const a=q as Question;
  if(![a.dividend,a.divisor,a.answer].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9)||a.divisor===0||!['addition','subtraction','multiplication','division'].includes(a.operation??''))return false;
  if(a.places!==undefined&&(!Array.isArray(a.places)||a.places.length!==3||!a.places.every(n=>Number.isInteger(n)&&n>=0&&n<=3)))return false;
  const p=a.places??[0,0,0],left=a.dividend/10**p[0],right=a.divisor/10**p[1],answer=a.answer/10**p[2],remainder=a.remainder??0;
  if(!Number.isSafeInteger(remainder)||remainder<0||remainder>=a.divisor)return false;
  return a.operation==='addition'?Math.abs(left+right-answer)<1e-8:a.operation==='subtraction'?Math.abs(left-right-answer)<1e-8:a.operation==='multiplication'?Math.abs(left*right-answer)<1e-8:Math.abs(left-right*answer-remainder)<1e-8;
}
export function validExploration(value:unknown):value is Exploration {if(!value||typeof value!=='object')return false;const e=value as Exploration,ids=(list:unknown):list is string[]=>Array.isArray(list)&&list.length<=40&&list.every(id=>typeof id==='string'&&parseDiscovery(id))&&new Set(list).size===list.length;if(!ids(e.seen)||!ids(e.solved)||e.solved.some(id=>!e.seen.includes(id))||!e.puzzles||typeof e.puzzles!=='object'||Array.isArray(e.puzzles)||Object.keys(e.puzzles).length>36)return false;return Object.entries(e.puzzles).every(([id,p])=>{const d=parseDiscovery(id);return d&&d.stage>1&&e.seen.includes(id)&&!e.solved.includes(id)&&p&&validDiscoveryQuestion(p.question)&&p.question.operation===d.forest&&typeof p.draft==='string'&&p.draft.length<=24&&/^[0-9.Rr]*$/.test(p.draft)&&Number.isInteger(p.hints)&&p.hints>=0&&p.hints<=99;});}
