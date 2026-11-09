import {hallId,validHallReport} from '../src/hall.ts';
const PREFIX='hall:character:';
export class HallOfFame{
 constructor(storage,clock=()=>Date.now()){this.storage=storage;this.now=clock;}
 async report(value,operator=false){if(!validHallReport(value))return {ok:false,error:'invalid'};const key=PREFIX+hallId(value.id);if(operator||!value.eligible){await this.storage.transaction(async tx=>{if(await tx.get(key)){await tx.delete(key);await tx.put('hall:count',Math.max(0,(await tx.get('hall:count')??0)-1));}});return {ok:true,excluded:true};}
  return this.storage.transaction(async tx=>{const old=await tx.get(key);if(old&&this.now()-old.updatedAt<1000)return {ok:true,pending:true};const count=await tx.get('hall:count')??0;if(!old&&count>=10000)return {ok:false,error:'full'};if(!old)await tx.put('hall:count',count+1);await tx.put(key,{nickname:value.nickname,level:Math.max(value.level,old?.level??0),berries:value.berries,updatedAt:this.now()});return {ok:true};});
 }
 async board(metric,me=''){const values=await this.storage.list({prefix:PREFIX,limit:10000}),rows=[...values].map(([key,v])=>({id:key.slice(PREFIX.length),...v}));rows.sort((a,b)=>b[metric]-a[metric]||a.updatedAt-b.updatedAt||a.id.localeCompare(b.id));let rank=0,previous=-1;const result=rows.map((r,i)=>{if(r[metric]!==previous){rank=i+1;previous=r[metric];}return {...r,rank};}),publicRow=r=>{const {id,...data}=r;return data;};return {metric,entries:result.slice(0,50).map(publicRow),mine:result.find(r=>r.id===me)?publicRow(result.find(r=>r.id===me)):null,updatedAt:this.now()};}
}
