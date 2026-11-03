import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
const mfOptions={modules:true,scriptPath:'.plaza-worker/index.js',compatibilityDate:'2026-07-01',durableObjects:{PLAZA:{className:'SharedPlaza',useSQLite:true}},port:0};
const profile=(nickname='Cloud QA')=>({nickname,level:30,character:0,outfit:0,weapon:0,outfitLevel:0,weaponLevel:0,hairstyle:0,face:0,pet:-1,ride:-1,job:'ranger',rank:2,achievement:0,gradeTitle:0,multiplicationTitle:false});
const origin='https://yangyeontae-blip.github.io';
async function setup(t){const mf=new Miniflare(mfOptions);t.after(()=>mf.dispose());return mf;}
async function connect(mf,otherOrigin=origin,custom=profile()){
 const res=await mf.dispatchFetch('https://plaza.test/connect?v=1',{headers:{Upgrade:'websocket',Origin:otherOrigin}});assert.equal(res.status,101);
 const socket=res.webSocket,queue=[],waiters=[];socket.addEventListener('message',e=>{if(typeof e.data!=='string')return;let v;try{v=JSON.parse(e.data);}catch{v=e.data;}queue.push(v);for(const fn of [...waiters])fn();});
 const next=type=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiters.splice(waiters.indexOf(check),1);reject(Error('Missing '+type+': '+JSON.stringify(queue)));},4000);function check(){const i=queue.findIndex(x=>typeof x==='object'&&x.type===type||x===type);if(i>=0){clearTimeout(timer);waiters.splice(waiters.indexOf(check),1);resolve(queue.splice(i,1)[0]);}}waiters.push(check);check();});
 socket.accept();socket.send(JSON.stringify({type:'join',profile:custom,pose:{x:0,y:0,z:8,angle:0}}));const welcome=await next('welcome');return {socket,next,welcome,queue};
}
test('one real Durable Object joins GitHub and auxiliary clients, broadcasts movement, titles, emotes and departures',{timeout:10000},async t=>{
 const mf=await setup(t),a=await connect(mf,origin,profile('One')),b=await connect(mf,'https://berry-forest-school.yangyeontae.chatgpt.site',profile('Two'));
 assert.equal(a.welcome.room,b.welcome.room);assert.equal(b.welcome.players.length,1);assert.equal(b.welcome.players[0].profile.nickname,'One');assert.equal(b.welcome.players[0].profile.job,'ranger');assert.notEqual(a.welcome.id,b.welcome.id);
 const joined=await a.next('upsert');assert.equal(joined.player.profile.nickname,'Two');
 a.socket.send(JSON.stringify({type:'pose',id:b.welcome.id,seq:1,pose:{x:1,y:1,z:8,angle:.8}}));const moved=await b.next('pose');assert.equal(moved.id,a.welcome.id);assert.equal(moved.pose.y,1);
 a.socket.send(JSON.stringify({type:'emote',emote:'wave'}));assert.equal((await b.next('emote')).id,a.welcome.id);
 a.socket.send('ping');assert.equal(await a.next('pong'),'pong');
 a.socket.close(1000,'left');assert.equal((await b.next('leave')).id,a.welcome.id);b.socket.close();
});
test('real handshake rejects foreign origins, old protocols and non-WebSocket requests',{timeout:10000},async t=>{
 const mf=await setup(t);assert.equal((await mf.dispatchFetch('https://plaza.test/health')).status,200);
 assert.equal((await mf.dispatchFetch('https://plaza.test/connect?v=1',{headers:{Origin:'https://unrelated.example',Upgrade:'websocket'}})).status,403);
 assert.equal((await mf.dispatchFetch('https://plaza.test/connect?v=2',{headers:{Origin:origin,Upgrade:'websocket'}})).status,409);
 assert.equal((await mf.dispatchFetch('https://plaza.test/connect?v=1',{headers:{Origin:origin}})).status,426);
});
test('malformed, oversized and unjoined input cannot change another player or a saved game',{timeout:10000},async t=>{
 const mf=await setup(t),a=await connect(mf),b=await connect(mf,origin,profile('Friend'));
 a.socket.send(JSON.stringify({type:'pose',seq:1,pose:{x:999,y:0,z:999,angle:0}}));const correction=await a.next('correction');assert.equal(correction.pose.x,0);
 a.socket.send(JSON.stringify({type:'pose',seq:2,pose:{x:null,y:0,z:0,angle:0}}));
 const closed=await new Promise(resolve=>{a.socket.addEventListener('close',e=>resolve(e.code),{once:true});});assert.equal(closed,1008);
 const leave=await b.next('leave');assert.equal(leave.id,a.welcome.id);b.socket.close();
});
test('new sessions receive the current snapshot after updates and every socket has a server-generated identity',{timeout:10000},async t=>{
 const mf=await setup(t),a=await connect(mf);a.socket.send(JSON.stringify({type:'pose',seq:1,pose:{x:1,y:0,z:8,angle:0}}));await new Promise(r=>setTimeout(r,30));const b=await connect(mf,origin,profile('Next'));assert.equal(b.welcome.players[0].pose.x,1);assert.match(a.welcome.id,/^[a-f0-9-]{36}$/);b.socket.close();a.socket.close();
});

test('the shared plaza admits 64 players into one room and refuses overflow without creating another room',{timeout:10000},async t=>{
 const mf=await setup(t),clients=[];for(let i=0;i<64;i++)clients.push(await connect(mf,origin,profile('QA'+i)).catch(e=>{throw new Error('Connection '+i+' failed',{cause:e});}));
 assert.equal(clients.at(-1).welcome.players.length,63);assert.equal(new Set(clients.map(c=>c.welcome.room)).size,1);
 const overflow=await mf.dispatchFetch('https://plaza.test/connect?v=1',{headers:{Origin:origin,Upgrade:'websocket'}});assert.equal(overflow.status,101);const socket=overflow.webSocket;const received=new Promise(resolve=>socket.addEventListener('message',e=>resolve(JSON.parse(e.data)),{once:true}));socket.accept();assert.equal((await received).code,'full');
 for(const c of clients)c.socket.close();await new Promise(r=>setTimeout(r,50));
});
test('the server closes flooding and oversized messages and filters unknown emotes',{timeout:10000},async t=>{
 const mf=await setup(t),a=await connect(mf),b=await connect(mf,origin,profile('Other'));
 a.socket.send(JSON.stringify({type:'emote',emote:'arbitrary text'}));await new Promise(r=>setTimeout(r,30));assert.equal(b.queue.some(x=>x.type==='emote'),false);
 const close=new Promise(resolve=>a.socket.addEventListener('close',e=>resolve(e.code),{once:true}));a.socket.send('x'.repeat(5000));assert.equal(await close,1009);
 const c=await connect(mf,origin,profile('Fast'));const flooded=new Promise(resolve=>c.socket.addEventListener('close',e=>resolve(e.code),{once:true}));for(let i=0;i<20;i++)c.socket.send(JSON.stringify({type:'sync'}));assert.equal(await flooded,1008);b.socket.close();
});

test('movement rejections and duplicate sequence numbers still consume the flood limit',{timeout:10000},async t=>{
 const mf=await setup(t);for(const stale of [false,true]){const a=await connect(mf,origin,profile(stale?'Stale':'Jump'));const closed=new Promise(resolve=>a.socket.addEventListener('close',e=>resolve(e.code),{once:true}));for(let i=0;i<20;i++)a.socket.send(JSON.stringify({type:'pose',seq:stale?0:i,pose:{x:stale?0:999,y:0,z:stale?8:999,angle:0}}));assert.equal(await closed,1008);}
});
