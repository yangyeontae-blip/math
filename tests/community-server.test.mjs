import {test} from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {handleCommunity} from '../server/community.js';
import {questionAnswerText} from '../src/rules.ts';
function database(){const db=new DatabaseSync(':memory:');db.exec(readFileSync('server/community-migration.sql','utf8'));return {db,prepare(sql){const statement=db.prepare(sql);return {bind(...args){return {first:async()=>statement.get(...args)??null,run:async()=>({meta:{changes:Number(statement.run(...args).changes)}})};}};}};}
const token=n=>n.toString(16).padStart(64,'0'),origin='https://yangyeontae-blip.github.io';
function client(DB,n,clock){return async(kind,body,from=origin)=>{const request=new Request('https://test/api/community/'+kind,{method:'POST',headers:{origin:from,'content-type':'application/json',authorization:'Bearer '+token(n),'cf-connecting-ip':'192.0.2.'+n},body:JSON.stringify(body)}),response=await handleCommunity(request,{DB},clock());return {status:response.status,...await response.json()};};}

test('persistent guild invitations, membership, leadership and removals are bound to each device key',async t=>{
 const DB=database();t.after(()=>DB.db.close());const now=()=>1794803000000,a=client(DB,1,now),b=client(DB,2,now),c=client(DB,3,now);
 assert.equal((await a('guild',{action:'create',name:'<b>',nickname:'숲친구'})).status,400);
 const made=await a('guild',{action:'create',name:'아침숲',nickname:'숲친구'});assert.equal(made.status,200);const code=made.room.code;
 assert.equal((await c('guild',{action:'state',code})).status,403);
 const joined=await b('guild',{action:'join',code,nickname:'별친구'});assert.equal(joined.room.members.length,2);const target=joined.room.you;
 assert.equal((await b('guild',{action:'kick',code,target:made.room.you})).status,403);
 assert.equal((await a('guild',{action:'leave',code})).status,400);
 const same=await b('guild',{action:'join',code,nickname:'별친구'});assert.equal(same.room.members.length,2);
 assert.equal((await a('guild',{action:'transfer',code,target})).status,200);
 assert.equal((await b('guild',{action:'kick',code,target:made.room.you})).room.members.length,1);
 assert.equal((await a('guild',{action:'state',code})).status,403);
 const stored=DB.db.prepare('SELECT payload FROM community_rooms').get().payload;assert.equal(stored.includes(token(1)),false);assert.equal(stored.includes(token(2)),false);
 assert.equal((await b('guild',{action:'state',code},'https://unrelated.example')).status,403);
 assert.equal((await b('guild',{action:'leave',code})).room,null);assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM community_rooms').get().n,0);
});

test('two real clients share five server questions, cannot replay answers or see secrets, and finish without game rewards',async t=>{
 const DB=database();t.after(()=>DB.db.close());let now=1794804000000;const a=client(DB,1,()=>now),b=client(DB,2,()=>now),third=client(DB,3,()=>now);
 const made=await a('duel',{action:'create',nickname:'햇살',grade:3,forest:'division'}),code=made.room.code;
 assert.equal((await b('duel',{action:'join',code,nickname:'달빛'})).room.members.length,2);assert.equal((await third('duel',{action:'join',code,nickname:'세번째'})).status,409);
 assert.equal((await a('duel',{action:'ready',code})).room.phase,'waiting');let current=(await b('duel',{action:'ready',code})).room;assert.equal(current.phase,'playing');
 assert.equal(JSON.stringify(current).includes('gateQuestion'),false);assert.equal('answer' in current,false);assert.equal('run' in current,false);
 for(let round=1;round<=5;round++){
  const raw=JSON.parse(DB.db.prepare('SELECT payload FROM community_rooms WHERE id=?').get('duel:'+code).payload),answer=questionAnswerText(raw.run.question),questionId=current.question.id;
  assert.equal((await a('duel',{action:'answer',code,questionId:'old',answer})).status,409);
  const correct=await a('duel',{action:'answer',code,questionId,answer});assert.equal(correct.room.phase,'result');assert.equal(correct.room.members.find(m=>m.id===correct.room.you).score,round);
  assert.equal((await b('duel',{action:'answer',code,questionId,answer})).status,409);assert.equal((await a('duel',{action:'answer',code,questionId,answer})).status,409);
  now+=2300;current=(await b('duel',{action:'state',code})).room;
 }
 assert.equal(current.phase,'finished');assert.equal(current.winner,made.room.you);assert.equal('berries' in current,false);
 now+=21*60000;assert.equal((await a('duel',{action:'state',code})).status,404);
});

test('a guild admits exactly 24 unique members and opens a seat only after an authorized removal',async t=>{
 const DB=database();t.after(()=>DB.db.close());const now=()=>1794805000000,leader=client(DB,1,now),made=await leader('guild',{action:'create',name:'별의모임',nickname:'길드장'}),code=made.room.code;
 let room=made.room;
 for(let n=2;n<=24;n++){const joined=await client(DB,n,now)('guild',{action:'join',code,nickname:'모험가'+n});assert.equal(joined.status,200);room=joined.room;}
 assert.equal(room.members.length,24);assert.equal((await client(DB,25,now)('guild',{action:'join',code,nickname:'새친구'})).status,409);
 const target=room.members.at(-1).id;assert.equal((await client(DB,2,now)('guild',{action:'kick',code,target})).status,403);
 assert.equal((await leader('guild',{action:'kick',code,target})).room.members.length,23);
 assert.equal((await client(DB,25,now)('guild',{action:'join',code,nickname:'새친구'})).room.members.length,24);
});
