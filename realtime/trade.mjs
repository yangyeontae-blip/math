// 광장·상점거리 거래 중계. 거래는 짧게 끝나므로 방(Durable Object) 메모리에만 두고, 방이 잠들면 진행 중이던 거래는 사라져요(아무것도 오가지 않음).
import {parseTradeOffer,EMPTY_OFFER} from '../src/trade.ts';
const TRADE_TTL=5*60_000;
const nick=s=>s.profile?.nickname??'친구';
export function tradesOf(room){return room.trades??=new Map();}
function find(room,id){return room.sessions().find(([,a])=>a.joined&&a.id===id);}
function sendState(room,t){
 for(const [me,other] of [[t.a,t.b],[t.b,t.a]]){const mine=find(room,me),theirs=find(room,other);if(!mine)continue;
  room.send(mine[0],{type:'trade-state',tradeId:t.id,partner:{id:other,nickname:theirs?nick(theirs[1]):'친구'},mine:t.offers[me],theirs:t.offers[other],myLock:!!t.locks[me],theirLock:!!t.locks[other]});}
}
export function closeTrade(room,t,reason){tradesOf(room).delete(t.id);for(const id of [t.a,t.b]){const p=find(room,id);if(p)room.send(p[0],{type:'trade-closed',tradeId:t.id,reason});}}
export function closeTradesFor(room,playerId){for(const t of [...tradesOf(room).values()])if(t.a===playerId||t.b===playerId)closeTrade(room,t,'gone');}
export function handleTrade(room,ws,s,m,now=Date.now()){
 const trades=tradesOf(room);
 for(const t of [...trades.values()])if(now-t.at>TRADE_TTL)closeTrade(room,t,'expired');
 const t=typeof m.tradeId==='string'?trades.get(m.tradeId):undefined,party=t&&(t.a===s.id||t.b===s.id);
 if(m.type==='trade-request'){
  if(typeof m.to!=='string'||m.to===s.id)return true;const target=find(room,m.to);if(!target){room.send(ws,{type:'trade-closed',reason:'gone'});return true;}
  for(const other of trades.values())if([other.a,other.b].some(id=>id===s.id||id===m.to)){room.send(ws,{type:'trade-closed',reason:'busy'});return true;}
  const id=crypto.randomUUID();trades.set(id,{id,a:s.id,b:m.to,accepted:false,offers:{[s.id]:EMPTY_OFFER,[m.to]:EMPTY_OFFER},locks:{},at:now});
  room.send(target[0],{type:'trade-invite',tradeId:id,from:{id:s.id,nickname:nick(s)}});room.send(ws,{type:'trade-pending',tradeId:id,to:{id:m.to,nickname:nick(target[1])}});return true;
 }
 if(!party)return true;
 if(m.type==='trade-reply'){if(t.b!==s.id||t.accepted)return true;if(m.accept!==true){closeTrade(room,t,m.reason==='refused'?'refused':'declined');return true;}t.accepted=true;t.at=now;sendState(room,t);return true;}
 if(m.type==='trade-cancel'){closeTrade(room,t,'cancelled');return true;}
 if(!t.accepted)return true;
 if(m.type==='trade-offer'){const offer=parseTradeOffer(m.offer);if(!offer)return true;
  // 같은 제안을 다시 보내면(확정 직전 재전송 등) 확정 상태를 건드리지 않아요. 내용이 바뀔 때만 두 사람의 확정을 풀어요.
  if(JSON.stringify(offer)===JSON.stringify(t.offers[s.id]))return true;
  if(t.locks[t.a]||t.locks[t.b]){sendState(room,t);return true;}t.offers[s.id]=offer;t.at=now;sendState(room,t);return true;}
 if(m.type==='trade-lock'){
  t.locks[s.id]=true;t.at=now;
  if(t.locks[t.a]&&t.locks[t.b]){trades.delete(t.id);for(const [me,other] of [[t.a,t.b],[t.b,t.a]]){const p=find(room,me);if(p)room.send(p[0],{type:'trade-done',tradeId:t.id,gave:t.offers[me],got:t.offers[other]});}}
  else sendState(room,t);
  return true;
 }
 return true;
}
