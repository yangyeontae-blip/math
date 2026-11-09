import type {CurriculumQuestion} from './curriculum';
import type {SchoolGrade} from './rules';
import {astralQuestions} from './astral-questions';
export const ASTRAL_FORESTS=[
 {id:0,name:'혜성잎 숲',level:120,icon:'☄️',description:'수 감각과 연산의 조건을 이어 별씨앗을 깨워요.',berries:1000,xp:600,stageBerries:5000,stageXp:2000,forestBerries:20000,forestXp:8000},
 {id:1,name:'수정고리 숲',level:150,icon:'💎',description:'도형과 측정의 단서를 연결해 수정 길을 밝혀요.',berries:1500,xp:900,stageBerries:8000,stageXp:3500,forestBerries:35000,forestXp:12000},
 {id:2,name:'은하수 지혜숲',level:200,icon:'🌌',description:'내 학년의 여러 단원을 함께 써서 은하수 길을 열어요.',berries:2200,xp:1300,stageBerries:12000,stageXp:5000,forestBerries:60000,forestXp:20000},
] as const;
export interface AstralGradeProgress {cleared:[number,number,number];correct:number;wrong:number}
export interface AstralLocation {forest:number;stage:number}
export interface AstralRun extends AstralLocation {id:string;grade:SchoolGrade;seed:number;generator:1;questions:CurriculumQuestion[];index:number;hintLevel:number;draft:string}
export interface AstralStudy {byGrade:Partial<Record<SchoolGrade,AstralGradeProgress>>;location:AstralLocation|null;active:AstralRun|null;totalBerries:number;totalXp:number}
export const emptyAstralStudy=():AstralStudy=>({byGrade:{},location:null,active:null,totalBerries:0,totalXp:0});
export function astralGrade(p:AstralStudy,grade:SchoolGrade):AstralGradeProgress{return p.byGrade[grade]??={cleared:[0,0,0],correct:0,wrong:0};}
export function canEnterAstral(p:AstralStudy,grade:SchoolGrade,level:number,forest:number,stage=0,operator=false){const data=p.byGrade[grade],region=ASTRAL_FORESTS[forest];return Number.isInteger(forest)&&!!region&&Number.isInteger(stage)&&stage>=0&&stage<10&&(operator||level>=region.level&&(forest===0||data?.cleared[forest-1]===10)&&stage<=(data?.cleared[forest]??0));}
export function validAstralStudy(value:unknown,grade:SchoolGrade,level:number):value is AstralStudy{
 try{const p=value as AstralStudy,n=(v:unknown,max=1e9):v is number=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=max;
 if(!p||!p.byGrade||typeof p.byGrade!=='object'||Array.isArray(p.byGrade)||Object.keys(p.byGrade).length>6||!n(p.totalBerries)||!n(p.totalXp))return false;
 for(const [key,g] of Object.entries(p.byGrade)){if(!/^[1-6]$/.test(key)||!g||!Array.isArray(g.cleared)||g.cleared.length!==3||g.cleared.some((c,i)=>!n(c,10)||i>0&&c>0&&g.cleared[i-1]!==10)||!n(g.correct)||!n(g.wrong))return false;}
 const l=p.location;if(l!==null&&(!l||!canEnterAstral(p,grade,level,l.forest,l.stage)))return false;
 const a=p.active;if(a===null)return true;
 if(!a||a.grade!==grade||l!==null&&(a.forest!==l.forest||a.stage!==l.stage)||!canEnterAstral(p,grade,level,a.forest,a.stage)||a.generator!==1||typeof a.id!=='string'||!/^[a-f0-9-]{36}$/.test(a.id)||!n(a.seed,4294967295)||!n(a.index,4)||!n(a.hintLevel,3)||typeof a.draft!=='string'||a.draft.length>32||!Array.isArray(a.questions)||a.questions.length!==5)return false;
 // The seed and generator version verify stored answers as well as restoring the exact question.
 return JSON.stringify(a.questions)===JSON.stringify(astralQuestions(grade,a.forest,a.stage,a.seed));
 }catch{return false;}
}