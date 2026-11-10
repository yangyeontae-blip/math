import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleAccounts,accountName,accountPassword} from '../worker/accounts.js';
import {newSave} from '../src/rules.ts';
function database(){
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync('drizzle/0003_aspiring_karen_page.sql','utf8'));
 db.exec(readFileSync('drizzle/0004_abandoned_silver_fox.sql','utf8'));
 return {db,prepare(sql){
  const statement=db.prepare(sql);
  return {bind(...args){
   return {first:async()=>statement.get(...args)??null,run:async()=>({meta:{changes:Number(statement.run(...args).changes)}})};
  }};
 }};
}
const origin='https://yangyeontae-blip.github.io';
const req=(action,body={},token='',from=origin)=>new Request('https://game.test/api/account/'+action,{method:'POST',headers:{origin:from,'content-type':'application/json','cf-connecting-ip':'192.0.2.10',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
const password='Berry!VerySafe123';
test('account credentials have explicit limits; origins and offline configuration fail closed',async()=>{assert.equal(accountName('Berry_01'),'berry_01');for(const s of ['ab','1234','a<script>','a b c'])assert.equal(accountName(s),null);assert.equal(accountPassword('short'),false);assert.equal(accountPassword(password),true);assert.equal((await handleAccounts(req('login',{},'','https://unrelated.example'),{})).status,403);assert.equal((await handleAccounts(req('login'),{})).status,503);});
test('real SQL account flow preserves revisions, isolates users, rotates recovery and never stores plaintext credentials',async t=>{const DB=database();t.after(()=>DB.db.close());const env={DB,ACCOUNT_PEPPER:'test-only-server-pepper-with-32-characters'};const call=async(a,b={},token='')=>{const response=await handleAccounts(req(a,b,token),env);return {status:response.status,...await response.json()};};
 const noConsent=await call('register',{username:'BerryOne',password});assert.equal(noConsent.status,400);
 const a=await call('register',{username:'BerryOne',password,consent:true});assert.equal(a.status,200);assert.equal(a.recoveryCode.length,64);
 const row=DB.db.prepare('SELECT * FROM adventure_accounts').get();assert.notEqual(row.password_hash,password);assert.notEqual(row.recovery_hash,a.recoveryCode);assert.equal(JSON.stringify(row).includes(a.token),false);
 const s=newSave('보관친구',0);s.berries=87;
 assert.equal((await call('save',{snapshot:s,revision:0})).status,401);
 assert.equal((await call('save',{snapshot:{version:26},revision:0},a.token)).status,400);
 assert.equal((await call('save',{snapshot:s,revision:0},a.token)).revision,1);
 const stale=await call('save',{snapshot:{...s,berries:1},revision:0},a.token);assert.equal(stale.status,409);
 let cloud=await call('load',{},a.token);assert.equal(cloud.snapshot.berries,87);
 assert.equal((await call('login',{username:'BerryOne',password:'wrong-password-123'})).status,401);
 const b=await call('register',{username:'BerryTwo',password,consent:true});assert.equal((await call('load',{},b.token)).snapshot,null);
 const login=await call('login',{username:'BERRYONE',password});assert.equal(login.status,200);
 s.berries=99;assert.equal((await call('save',{snapshot:s,revision:1},login.token)).revision,2);assert.equal(JSON.parse(DB.db.prepare('SELECT previous_snapshot FROM adventure_accounts WHERE username=?').get('berryone').previous_snapshot).berries,87);
 assert.equal((await call('logout',{},login.token)).status,200);assert.equal((await call('load',{},login.token)).status,401);
 const recovered=await call('recover',{username:'BerryOne',password:'New!BerryPass456',recoveryCode:a.recoveryCode});assert.equal(recovered.status,200);assert.notEqual(recovered.recoveryCode,a.recoveryCode);assert.equal((await call('load',{},a.token)).status,401);
 assert.equal((await call('recover',{username:'BerryOne',password,recoveryCode:a.recoveryCode})).status,401);
 const next=await call('login',{username:'BerryOne',password:'New!BerryPass456'});assert.equal(next.status,200);cloud=await call('load',{},next.token);assert.equal(cloud.snapshot.berries,99);
 DB.db.prepare('UPDATE adventure_sessions SET expires_at=0').run();assert.equal((await call('load',{},next.token)).status,401);
});
test('atomic account-target limits persist across requests',async t=>{const DB=database();t.after(()=>DB.db.close());const env={DB,ACCOUNT_PEPPER:'test-only-server-pepper-with-32-characters'};let status;for(let i=0;i<9;i++)status=(await handleAccounts(req('login',{username:'MissingAccount',password}),env)).status;assert.equal(status,429);assert.equal(DB.db.prepare('SELECT COUNT(*) AS n FROM adventure_accounts').get().n,0);});
