import {operationsForGrade,type ForestKind,type SchoolGrade} from './rules';
export type ForestRoom={grade:SchoolGrade;forest:ForestKind;stage:number};
export function forestRoomKey(v:ForestRoom|null){return v?'math-forest:'+v.grade+':'+v.forest+':'+v.stage:'';}
export function parseForestRoom(u:URL):ForestRoom|null{const grade=Number(u.searchParams.get('grade')),stage=Number(u.searchParams.get('stage')),forest=u.searchParams.get('forest') as ForestKind;return Number.isInteger(grade)&&grade>=1&&grade<=6&&Number.isInteger(stage)&&stage>=1&&stage<=10&&operationsForGrade(grade as SchoolGrade).includes(forest)?{grade:grade as SchoolGrade,stage,forest}:null;}
export function presenceIdFromHash(hash:string){return hash.slice(0,8)+'-'+hash.slice(8,12)+'-'+hash.slice(12,16)+'-'+hash.slice(16,20)+'-'+hash.slice(20,32);}
