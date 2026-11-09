import {journeyFor,type Save} from './rules';
import {canEnterWorldTwo} from './world-two';
import {canEnterAstral} from './astral-study';
/** Store a safe return point for privileged visits, without fabricating completed lessons. */
export function operatorCheckpoint(s:Save):Save{const w=s.world2.location,a=s.astralStudy.location,r=s.astralStudy.active;
 const worldLocked=!!w&&!canEnterWorldTwo(s.world2,s.level,w.region,w.boss),astralLocked=!!a&&!canEnterAstral(s.astralStudy,s.grade,s.level,a.forest,a.stage),runLocked=!!r&&!canEnterAstral(s.astralStudy,s.grade,s.level,r.forest,r.stage);
 const j=journeyFor(s),forestLocked=!s.teacherMode&&j.stage>1&&!j.maps[j.stage-1]?.cleared,key=s.forest==='multiplication'?'multiplicationJourney':s.forest==='addition'?'additionJourney':s.forest==='subtraction'?'subtractionJourney':'journey';
 if(!worldLocked&&!astralLocked&&!runLocked&&!forestLocked)return s;
 return {...s,...(forestLocked?{[key]:{...j,stage:0},hub:undefined,position:{x:0,z:8}}:{}),...(worldLocked?{world2:{...s.world2,location:null},position:{x:0,z:8}}:{}),...(astralLocked||runLocked?{astralStudy:{...s.astralStudy,location:astralLocked?null:a,active:runLocked?null:r},position:{x:0,z:8}}:{})};}
