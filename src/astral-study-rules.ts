import {operatorAccess} from './operator-access';
import type {Save} from './rules';
import {potionEffects,PPOJJAK_PET_ID,recordCurriculumAttempt,mathQuestionXp} from './rules';
import {recordDaily} from './daily';
import {ASTRAL_FORESTS,astralGrade,canEnterAstral} from './astral-study';
import {astralQuestions} from './astral-questions';
export function enterAstral(s:Save,forest:number,stage=0){
 if(!canEnterAstral(s.astralStudy,s.grade,s.level,forest,stage,operatorAccess()))throw Error('레벨과 앞 수학숲·단계를 먼저 확인해 주세요.');
 if(s.expedition.active||s.story.active)throw Error('진행 중인 원정이나 이야기 모험을 먼저 마쳐 주세요.');
 const p=s.astralStudy;if(p.active&&(p.active.forest!==forest||p.active.stage!==stage))throw Error('풀던 단계를 먼저 이어가거나 정리해 주세요.');
 p.location={forest,stage};s.world2.location=null;s.career.location=null;s.room.inside=s.homestead.inside=false;astralGrade(p,s.grade);return p.location;
}
export function startAstralRun(s:Save,seed=Math.floor(Math.random()*4294967296)){
 const p=s.astralStudy,l=p.location;if(!l||!canEnterAstral(p,s.grade,s.level,l.forest,l.stage,operatorAccess()))throw Error('수학숲의 문제 장소 가까이에서 시작해요.');
 if(p.active)return p.active;
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('잘못된 문제 씨앗이에요.');
 p.active={...l,id:crypto.randomUUID(),grade:s.grade,generator:1,seed,questions:astralQuestions(s.grade,l.forest,l.stage,seed),index:0,hintLevel:0,draft:''};return p.active;
}
export function leaveAstral(s:Save){s.astralStudy.location=null;/* Keep an unfinished run so returning restores the same question. */}
export function resumeAstral(s:Save){const a=s.astralStudy.active;if(!a)return null;return enterAstral(s,a.forest,a.stage);}
export function abandonAstralRun(s:Save){s.astralStudy.active=null;}
export function astralHint(s:Save){const a=s.astralStudy.active;if(!a||!s.astralStudy.location)return 0;a.hintLevel=Math.min(3,a.hintLevel+1);return a.hintLevel;}
export function astralAnswerMatches(answer:string,value:string,numeric:boolean){const v=value.trim();return v===answer||numeric&&/^-?\d+(?:\.\d+)?$/.test(v)&&Math.abs(Number(v)-Number(answer))<1e-9;}
function award(s:Save,berries:number,xp:number){s.berries=Math.min(1e9,s.berries+berries);s.astralStudy.totalBerries=Math.min(1e9,s.astralStudy.totalBerries+berries);s.astralStudy.totalXp=Math.min(1e9,s.astralStudy.totalXp+xp);s.xp+=xp;let levels=0;while(s.level<100000&&s.xp>=s.level*40){s.xp-=s.level*40;s.level++;levels++;s.berries=Math.min(1e9,s.berries+20+({30:30000,50:50000,100:100000}[s.level]??0));}if(s.level===100000)s.xp=Math.min(s.xp,s.level*40-1);return levels;}
export function submitAstralAnswer(s:Save,runId:string,index:number,value:string,now=Date.now()){
 const p=s.astralStudy,a=p.active,l=p.location;if(!a||!l||a.id!==runId||a.index!==index||a.forest!==l.forest||a.stage!==l.stage||!canEnterAstral(p,s.grade,s.level,a.forest,a.stage,operatorAccess())||!Number.isFinite(now)||typeof value!=='string'||value.length>32)return null;
 const q=a.questions[index],correct=astralAnswerMatches(q.answer,value,q.kind==='number'),g=astralGrade(p,s.grade),usedHint=a.hintLevel>0;
 recordCurriculumAttempt(s,q.unit,correct,0,q.skill,usedHint);
 if(!correct){g.wrong=Math.min(1e9,g.wrong+1);s.learning.wrong=Math.min(1e9,s.learning.wrong+1);return {correct:false,berries:0,xp:0,levels:0,stageComplete:false,firstStage:false,firstForest:false,usedHint};}
 g.correct=Math.min(1e9,g.correct+1);s.learning.correct=Math.min(1e9,s.learning.correct+1);recordDaily(s,'correct');
 const f=ASTRAL_FORESTS[a.forest],effects=potionEffects(s,now);let berries=usedHint?0:f.berries,xp=usedHint?0:mathQuestionXp(s.level,f.xp),firstStage=false,firstForest=false;
 a.index++;a.hintLevel=0;a.draft='';const stageComplete=a.index===5;
 if(stageComplete){firstStage=a.stage===g.cleared[a.forest]&&(a.forest===0||g.cleared[a.forest-1]===10);if(firstStage){g.cleared[a.forest]++;berries+=f.stageBerries;xp+=f.stageXp;firstForest=g.cleared[a.forest]===10;if(firstForest){berries+=f.forestBerries;xp+=f.forestXp;}}p.active=null;}
 berries=Math.floor(berries*effects.berryMultiplier*(s.pet===PPOJJAK_PET_ID?1.5:1));xp=Math.floor(xp*effects.xpMultiplier*(s.pet===PPOJJAK_PET_ID?1.4:1));
 const levels=award(s,berries,xp);return {correct:true,berries,xp,levels,stageComplete,firstStage,firstForest,usedHint};
}