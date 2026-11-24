import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tradeRefused,setTradeRefused} from '../src/trade-view';
test('trade refusal setting is off by default, persists on the device and survives storage errors',()=>{
  const data=new Map<string,string>();const store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  assert.equal(tradeRefused(store),false);
  setTradeRefused(true,store);assert.equal(tradeRefused(store),true);
  setTradeRefused(false,store);assert.equal(tradeRefused(store),false);
  const broken={getItem:()=>{throw Error('x');},setItem:()=>{throw Error('x');}};
  assert.equal(tradeRefused(broken),false);assert.doesNotThrow(()=>setTradeRefused(true,broken));
});
