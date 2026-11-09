import {canEnter,finishHunt,rematchHunt,journeyFor,operationsForGrade,type Save} from './rules';
import {validPartyLesson,type PartyReward} from './forest-party';
export function claimPartyReward(s:Save,r:PartyReward,now=Date.now()){
 if(!r||!/^[a-f0-9-]{36}:\d$/.test(r.id)||!validPartyLesson(r.config)||r.config.grade!==s.grade||!operationsForGrade(s.grade).includes(r.config.forest)||!canEnter(s,r.config.stage,r.config.forest)||!Number.isSafeInteger(r.expiresAt)||r.expiresAt<=now||r.expiresAt>now+25*60*60*1000||!Number.isInteger(r.correct)||r.correct<0||r.correct>5||!Number.isInteger(r.wrong)||r.wrong<0)return {accepted:false,xp:0,berries:0};
 s.partyClaims=s.partyClaims.filter(x=>x.expiresAt>now);if(s.partyClaims.some(x=>x.id===r.id))return {accepted:true,duplicate:true,xp:0,berries:0};if(s.partyClaims.length>=4096)return {accepted:false,xp:0,berries:0};
 const previous=s.forest;s.forest=r.config.forest;const journey=journeyFor(s),previousStage=journey.stage;journey.stage=r.config.stage;let reward;
 try{reward=finishHunt(s,r.monster)??rematchHunt(s,r.monster);}finally{journey.stage=previousStage;s.forest=previous;}
 // A partially cleared individual map may already contain this monster. Keep the shared completion without a second first-clear reward.
 s.partyClaims.push({id:r.id,expiresAt:r.expiresAt});s.learning.correct=Math.min(1e9,s.learning.correct+r.correct);s.learning.wrong=Math.min(1e9,s.learning.wrong+r.wrong);
 return {accepted:true,xp:reward?.xp??0,berries:reward?.berries??0};
}
