import {hallId,validHallReport,HALL_BOARD_SIZE} from '../src/hall.ts';
const PREFIX='hall:character:',HALL_KEEP_MS=365*24*60*60*1000;
export class HallOfFame{
 constructor(storage,clock=()=>Date.now()){this.storage=storage;this.now=clock;}
 async report(value,operator=false){if(!validHallReport(value))return {ok:false,error:'invalid'};const key=PREFIX+hallId(value.id);if(operator||!value.eligible){await this.storage.transaction(async tx=>{if(await tx.get(key)){await tx.delete(key);await tx.put('hall:count',Math.max(0,(await tx.get('hall:count')??0)-1));}});return {ok:true,excluded:true};}
  return this.storage.transaction(async tx=>{const old=await tx.get(key);if(old&&this.now()-old.updatedAt<1000)return {ok:true,pending:true};const count=await tx.get('hall:count')??0;if(!old&&count>=10000)return {ok:false,error:'full'};if(!old)await tx.put('hall:count',count+1);await tx.put(key,{nickname:value.nickname,level:Math.max(value.level,old?.level??0),berries:value.berries,updatedAt:this.now()});return {ok:true};});
 }
 // 개인정보 처리방침 제4조: 1년 동안 기록이 바뀌지 않은 명예의 전당 줄은 자동 파기
 async prune(values){const cutoff=this.now()-HALL_KEEP_MS,stale=[...values].filter(([,v])=>!(v?.updatedAt>=cutoff)).map(([key])=>key);if(!stale.length)return values;for(let i=0;i<stale.length;i+=128)await this.storage.delete(stale.slice(i,i+128));await this.storage.put('hall:count',Math.max(0,(await this.storage.get('hall:count')??0)-stale.length));const fresh=new Map(values);for(const k of stale)fresh.delete(k);return fresh;}
 async board(metric,me=''){const values=await this.prune(await this.storage.list({prefix:PREFIX,limit:10000})),rows=[...values].map(([key,v])=>({id:key.slice(PREFIX.length),...v}));rows.sort((a,b)=>b[metric]-a[metric]||a.updatedAt-b.updatedAt||a.id.localeCompare(b.id));let rank=0,previous=-1;const result=rows.map((r,i)=>{if(r[metric]!==previous){rank=i+1;previous=r[metric];}return {...r,rank};}),publicRow=r=>{const {id,...data}=r;return data;};return {metric,entries:result.slice(0,HALL_BOARD_SIZE).map(publicRow),mine:result.find(r=>r.id===me)?publicRow(result.find(r=>r.id===me)):null,updatedAt:this.now()};}
}
