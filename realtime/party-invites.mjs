import {presenceIdFromHash} from '../src/forest-room.ts';

export async function handlePartyInvite(room,ws,s,message) {
 if(message.type==='party-invite-reply'){
  if(!s.partyInvites||message.accepted!==false||typeof message.code!=='string'||!/^[A-Z0-9]{8}$/.test(message.code)||typeof message.id!=='string'||!/^[a-f0-9-]{36}$/.test(message.id))return true;
  await room.env.PARTIES.get(room.env.PARTIES.idFromName(message.code)).fetch('https://party.internal/internal/invite-decline',{method:'POST',body:JSON.stringify({id:message.id,target:presenceIdFromHash(s.chatSender)})});
  return true;
 }
 if(message.type!=='party-invite')return false;
 const target=room.sessions().find(([,peer])=>peer.joined&&peer.id===message.targetId);
 const fail=text=>room.send(ws,{type:'party-invite-status',message:text});
 if(!s.partyInvites||!target?.[1].partyInvites){fail('친구가 게임을 새로 열면 초대할 수 있어요.');return true;}
 const peer=target[1];
 if(peer.id===s.id||peer.grade!==s.grade){fail('같은 학년 친구를 골라 주세요.');return true;}
 const now=Date.now();
 if(now-(s.lastInviteAt??0)<1000){fail('친구의 대답을 잠시 기다려 주세요.');return true;}
 s.lastInviteAt=now;ws.serializeAttachment(s);
 if(typeof message.code!=='string'||!/^[A-Z0-9]{8}$/.test(message.code)||typeof message.memberToken!=='string'||!/^[a-f0-9]{64}$/.test(message.memberToken)){fail('친구 모험을 먼저 만들어 주세요.');return true;}
 const response=await room.env.PARTIES.get(room.env.PARTIES.idFromName(message.code)).fetch('https://party.internal/internal/invite',{
  method:'POST',body:JSON.stringify({memberToken:message.memberToken,sender:presenceIdFromHash(s.chatSender),target:presenceIdFromHash(peer.chatSender),grade:peer.grade})
 });
 const result=await response.json();
 if(!response.ok){fail(result.error);return true;}
 room.send(target[0],{type:'party-invitation',invitation:{id:result.id,code:message.code,fromId:s.id,nickname:s.profile.nickname,expiresAt:result.expiresAt}});
 fail(peer.profile.nickname+'님에게 초대했어요.');
 return true;
}
