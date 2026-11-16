import {test} from 'node:test';import assert from 'node:assert/strict';import {Miniflare} from 'miniflare';import {hallId} from '../src/hall.ts';
const origin='https://yangyeontae-blip.github.io';
const profile=nickname=>({nickname,level:30,character:0,outfit:0,weapon:0,outfitLevel:0,weaponLevel:0,hairstyle:0,face:0,pet:-1,ride:-1,job:'novice',rank:0,achievement:0,gradeTitle:0,multiplicationTitle:false,selectedTitleId:null});
async function setup(t){const mf=new Miniflare({modules:true,scriptPath:'.plaza-worker/index.js',compatibilityDate:'2026-07-01',durableObjects:{PLAZA:{className:'SharedPlaza',useSQLite:true},PARTIES:{className:'ForestParty',useSQLite:true}},port:0});t.after(()=>mf.dispose());return mf;}
async function connect(mf,code,nickname,{create=false,token,extra={}}={}){const response=await mf.dispatchFetch('https://party.test/party/connect?code='+code+(create?'&create=1':''),{headers:{Upgrade:'websocket',Origin:origin}});assert.equal(response.status,101);const socket=response.webSocket,queue=[],waiters=[];socket.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data);}catch{return;}queue.push(m);for(const check of [...waiters])check();});const next=(type,predicate=()=>true)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiters.splice(waiters.indexOf(check),1);reject(Error('Missing '+type));},5000);const check=()=>{const index=queue.findIndex(m=>m.type===type&&predicate(m));if(index>=0){clearTimeout(timer);waiters.splice(waiters.indexOf(check),1);resolve(queue.splice(index,1)[0]);}};waiters.push(check);check();});socket.accept();socket.send(JSON.stringify({type:'join',profile:profile(nickname),grade:3,openStages:{addition:10,subtraction:10,multiplication:10,division:10},...extra,...(token?{token}:{})}));return {socket,next,queue,send:m=>socket.send(JSON.stringify(m))};}
function answer(prompt){const [a,op,b]=prompt.split(' '),x=Number(a),y=Number(b);return op==='+'?String(x+y):op==='−'?String(x-y):op==='×'?String(x*y):x%y?Math.floor(x/y)+'R'+x%y:String(x/y);}
test('two real party sockets share a question and monster completion; reconnect resends only the unacknowledged reward',{timeout:20000},async t=>{const mf=await setup(t),a=await connect(mf,'PARTY001','One',{create:true});await a.next('joined');await a.next('party');const b=await connect(mf,'PARTY001','Two');const bToken=(await b.next('joined')).token;await b.next('party');a.send({type:'pose',pose:{x:0,y:0,z:20,angle:0},here:true});b.send({type:'pose',pose:{x:2,y:0,z:20,angle:0},here:true});await a.next('pose');a.send({type:'start',config:{forest:'division',stage:1,grade:3,level:30}});const first=await a.next('party',s=>!!s.run),other=await b.next('party',s=>!!s.run);assert.equal(first.run.question.id,other.run.question.id);assert.ok(!('answer'in first.run.question));a.send({type:'answer',questionId:first.run.question.id,value:answer(first.run.question.prompt)});const wonA=await a.next('party',s=>s.rewards.length>0),wonB=await b.next('party',s=>s.rewards.length>0);assert.deepEqual(wonA.run.completed,[0]);assert.equal(wonA.rewards[0].id,wonB.rewards[0].id);a.send({type:'answer',questionId:first.run.question.id,value:answer(first.run.question.prompt)});a.send({type:'sync'});assert.equal((await a.next('party',s=>s.rewards.length>0)).rewards.length,1);a.send({type:'reward-ack',id:wonA.rewards[0].id});b.socket.close();const reconnected=await connect(mf,'PARTY001','Two',{token:bToken});assert.equal((await reconnected.next('joined')).token,bToken);const resumed=await reconnected.next('party');assert.equal(resumed.rewards.length,1);reconnected.send({type:'reward-ack',id:resumed.rewards[0].id});reconnected.send({type:'sync'});assert.equal((await reconnected.next('party')).rewards.length,0);a.socket.close();reconnected.socket.close();});
test('party invitation spaces are isolated and a fifth member cannot join',{timeout:20000},async t=>{const mf=await setup(t),members=[];for(let i=0;i<4;i++){const p=await connect(mf,'PARTY002','Friend'+i,{create:i===0});await p.next('joined');await p.next('party');members.push(p);}const fifth=await connect(mf,'PARTY002','Fifth');assert.match((await fifth.next('error')).message,/네 명/);const other=await connect(mf,'PARTY003','Elsewhere',{create:true});await other.next('joined');assert.equal((await other.next('party')).members.length,1);for(const p of [...members,fifth,other])p.socket.close();});


test('Hall of Fame HTTP collects only valid reports, sorts both boards, and respects excluded profiles and origins',{timeout:10000},async t=>{const mf=await setup(t),a={id:crypto.randomUUID(),nickname:'학습별',level:500,berries:2000,eligible:true},b={id:crypto.randomUUID(),nickname:'베리별',level:100,berries:9000,eligible:true};const post=r=>mf.dispatchFetch('https://party.test/hall',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(r)});assert.equal((await post(a)).status,200);assert.equal((await post(b)).status,200);const get=async by=>(await mf.dispatchFetch('https://party.test/hall?by='+by,{headers:{Origin:origin}})).json();assert.equal((await get('level')).entries[0].nickname,a.nickname);assert.equal((await get('berries')).entries[0].nickname,b.nickname);assert.equal((await post({...a,eligible:false})).status,200);assert.equal((await get('level')).entries.length,1);assert.equal((await post({...b,berries:-1})).status,400);const blocked=await mf.dispatchFetch('https://party.test/hall',{headers:{Origin:'https://elsewhere.invalid'}});assert.equal(blocked.status,403);});

test('Hall of Fame returns more than fifty children so lower ranks still appear',{timeout:20000},async t=>{const mf=await setup(t);for(let i=0;i<60;i++){const r=await mf.dispatchFetch('https://party.test/hall',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),nickname:'친구'+i,level:i+1,berries:i,eligible:true})});assert.equal(r.status,200);}const board=await (await mf.dispatchFetch('https://party.test/hall?by=level&limit=200',{headers:{Origin:origin}})).json();assert.equal(board.entries.length,60);assert.equal(board.entries.at(-1).level,1);});

test('Hall HTTP preserves old clients and returns two hundred requested entries with the out-of-list personal rank',{timeout:20000},async t=>{const mf=await setup(t);let lowest;for(let i=0;i<205;i++){const body={id:crypto.randomUUID(),nickname:'Friend'+i,level:i+1,berries:i,eligible:true};if(i===0)lowest=body;const response=await mf.dispatchFetch('https://party.test/hall',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200);}for(const metric of ['level','berries']){const get=async extra=>(await mf.dispatchFetch('https://party.test/hall?by='+metric+'&me='+hallId(lowest.id)+extra,{headers:{Origin:origin}})).json();const legacy=await get(''),modern=await get('&limit=200');assert.equal(legacy.entries.length,50);assert.equal(modern.entries.length,200);assert.equal(legacy.mine.rank,205);assert.equal(modern.mine.rank,205);assert.deepEqual(legacy.entries,modern.entries.slice(0,50));assert.ok(modern.entries.every(row=>!('id'in row)));}for(const limit of ['201','-1','1.5','bad'])assert.equal((await mf.dispatchFetch('https://party.test/hall?limit='+limit,{headers:{Origin:origin}})).status,400);});


test('modern friends recommend a shared destination and require readiness again after changing it',{timeout:15000},async t=>{
 const mf=await setup(t),a=await connect(mf,'LOBBY001','Leader',{create:true,extra:{lobbyV1:true,preferredForest:'division',openStages:{addition:3,subtraction:3,multiplication:3,division:3}}});
 await a.next('joined');await a.next('party');
 a.send({type:'start'});assert.match((await a.next('error')).message,/한 명 더/);
 const b=await connect(mf,'LOBBY001','Friend',{extra:{lobbyV1:true,preferredForest:'addition',openStages:{addition:2,subtraction:2,multiplication:2,division:2}}});
 await b.next('joined');const joined=await b.next('party');
 assert.deepEqual(joined.lobby.destination,{grade:3,forest:'division',stage:2});
 a.send({type:'destination',destination:{grade:3,forest:'division',stage:1}});
 const changed=await b.next('party',s=>s.lobby.destination.stage===1);
 assert.ok(!changed.lobby.ready.includes(changed.self));
 a.send({type:'start'});assert.match((await a.next('error')).message,/준비/);
 b.send({type:'ready',revision:changed.lobby.revision-1});
 b.send({type:'sync'});assert.ok(!(await b.next('party')).lobby.ready.includes(changed.self));
 b.send({type:'ready',revision:changed.lobby.revision});
 await a.next('party',s=>s.lobby.revision===changed.lobby.revision&&s.lobby.destination.stage===1&&s.lobby.ready.length===2);
 a.send({type:'start'});assert.equal((await b.next('party',s=>!!s.run)).run.config.stage,1);
 a.socket.close();b.socket.close();
});

test('real plaza invitations bind the recipient and party membership, enforce grade and ten second cooldown',{timeout:20000},async t=>{
 const mf=await setup(t);
 async function plaza(nickname,identity,grade=3){
  const response=await mf.dispatchFetch('https://party.test/connect?v=1',{headers:{Origin:origin,Upgrade:'websocket'}});
  const socket=response.webSocket,queue=[];
  socket.addEventListener('message',e=>{if(e.data!=='pong')queue.push(JSON.parse(e.data));});socket.accept();
  socket.send(JSON.stringify({type:'join',profile:profile(nickname),pose:{x:0,y:0,z:8,angle:0},batchedPoses:true,chatIdentity:identity,partyInvites:true,grade}));
  const next=async type=>{for(let i=0;i<100;i++){const index=queue.findIndex(v=>v.type===type);if(index>=0)return queue.splice(index,1)[0];await new Promise(r=>setTimeout(r,30));}throw Error('Missing '+type);};
  return {socket,next,welcome:await next('welcome')};
 }
 const senderId=crypto.randomUUID(),targetId=crypto.randomUUID();
 const a=await plaza('Leader',senderId),b=await plaza('Friend',targetId),c=await plaza('OtherGrade',crypto.randomUUID(),4);
 const party=await connect(mf,'INVITE01','Leader',{create:true,extra:{chatIdentity:senderId,lobbyV1:true}});
 const token=(await party.next('joined')).token;await party.next('party');
 const invite=target=>a.socket.send(JSON.stringify({type:'party-invite',targetId:target.welcome.id,code:'INVITE01',memberToken:token}));
 invite(c);assert.match((await a.next('party-invite-status')).message,/같은 학년/);
 invite(b);const invitation=(await b.next('party-invitation')).invitation;
 assert.equal(invitation.code,'INVITE01');assert.ok(invitation.expiresAt>Date.now());await a.next('party-invite-status');
 await new Promise(r=>setTimeout(r,1050));invite(b);assert.match((await a.next('party-invite-status')).message,/조금 전에/);
 const stolen=await connect(mf,'INVITE01','Else',{extra:{chatIdentity:crypto.randomUUID(),invitation:invitation.id,lobbyV1:true}});
 assert.match((await stolen.next('error')).message,/초대 시간/);
 const accepted=await connect(mf,'INVITE01','Friend',{extra:{chatIdentity:targetId,invitation:invitation.id,lobbyV1:true}});
 const acceptedToken=(await accepted.next('joined')).token;assert.equal((await accepted.next('party')).members.length,2);
 const retry=await connect(mf,'INVITE01','Friend',{extra:{chatIdentity:targetId,invitation:invitation.id,lobbyV1:true}});
 assert.equal((await retry.next('joined')).token,acceptedToken);assert.equal((await retry.next('party')).members.length,2);
 for(const p of [a,b,c,party,stolen,accepted,retry])p.socket.close();
});

test('concurrent last-seat joins admit only four friends and mixed-grade destinations stay unavailable',{timeout:15000},async t=>{
 const mf=await setup(t),members=[];
 for(let i=0;i<3;i++){const p=await connect(mf,'SEAT0001','Friend'+i,{create:i===0,extra:{lobbyV1:true}});await p.next('joined');await p.next('party');members.push(p);}
 const last=await Promise.all([connect(mf,'SEAT0001','Fourth',{extra:{lobbyV1:true}}),connect(mf,'SEAT0001','Fifth',{extra:{lobbyV1:true}})]);
 await new Promise(r=>setTimeout(r,150));
 assert.equal(last.filter(p=>p.queue.some(v=>v.type==='joined')).length,1);
 assert.equal(last.filter(p=>p.queue.some(v=>v.type==='error')).length,1);
 for(const p of [...members,...last])p.socket.close();
 const x=await connect(mf,'GRADE001','One',{create:true,extra:{lobbyV1:true}});await x.next('joined');await x.next('party');
 const y=await connect(mf,'GRADE001','Two',{extra:{lobbyV1:true,grade:4}});await y.next('joined');
 assert.equal((await y.next('party')).lobby.destination,null);x.socket.close();y.socket.close();
});
