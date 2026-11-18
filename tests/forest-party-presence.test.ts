import test from 'node:test';
import assert from 'node:assert/strict';
import {ForestPartyClient} from '../src/forest-party-client';
import {newSave} from '../src/rules';
import {plazaProfile} from '../src/plaza-identity';

class Socket {
 static instances:Socket[]=[];
 readyState=0; fail=false; sent:any[]=[];
 onopen:(()=>void)|null=null; onmessage:((e:{data:string})=>void)|null=null;
 onerror:(()=>void)|null=null; onclose:(()=>void)|null=null;
 constructor(readonly url:string){Socket.instances.push(this);}
 send(raw:string){if(this.fail)throw new Error('temporary send failure');this.sent.push(JSON.parse(raw));}
 close(){this.readyState=3;}
 open(){this.readyState=1;this.onopen?.();this.onmessage?.({data:JSON.stringify({type:'joined',token:'a'.repeat(64)})});}
}
function setup(t:test.TestContext){
 const originals=new Map(['WebSocket','document','localStorage'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const values=new Map<string,string>();const doc={hidden:false};
 for(const [key,value]of Object.entries({WebSocket:Socket,document:doc,localStorage:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)}}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 const save=newSave('동기화친구',0,3),profile=plazaProfile(save)!;
 const client=new ForestPartyClient('ws://127.0.0.1:5189',{profile:()=>({profile,grade:3,openStages:{addition:10,subtraction:10,multiplication:10,division:10},operatorToken:'',chatIdentity:'test-device'}),state:()=>{},pose:()=>{},message:()=>{},chat:()=>{},status:()=>{}});
 t.after(()=>{client.stop();for(const [key,d]of originals)if(d)Object.defineProperty(globalThis,key,d);else Reflect.deleteProperty(globalThis,key);});
 client.join('PRESENCE');const socket=Socket.instances.at(-1)!;socket.open();return {client,socket,doc};
}
const pose={x:0,y:0,z:1,angle:0};
const presences=(socket:Socket)=>socket.sent.filter(m=>m.type==='pose').map(m=>m.here);

test('an unchanged returning player resends presence after a direct hidden-page departure',t=>{
 const {client,socket,doc}=setup(t);client.tick(pose,true);doc.hidden=true;client.send({type:'pose',pose,here:false});doc.hidden=false;client.tick(pose,true);
 assert.deepEqual(presences(socket),[true,false,true]);
});
test('an immediate presence update before an answer is deduplicated by the periodic tick',t=>{
 const {client,socket}=setup(t);client.send({type:'pose',pose,here:true});client.send({type:'answer',questionId:'question',value:'2'});client.tick(pose,true);
 assert.deepEqual(socket.sent.filter(m=>m.type==='pose'||m.type==='answer').map(m=>m.type),['pose','answer']);
});
test('a failed presence send is retried without pretending it reached the server',t=>{
 const {client,socket}=setup(t);client.tick(pose,true);socket.fail=true;assert.equal(client.send({type:'pose',pose,here:false}),false);socket.fail=false;client.send({type:'pose',pose,here:false});client.tick(pose,true);
 assert.deepEqual(presences(socket),[true,false,true]);
});
