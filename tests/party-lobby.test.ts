import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activePartyInvitation,normalizedPartyCode,partyDestinations,recommendedPartyDestination,parsePartyInvitation} from '../src/party-lobby';
const member=(grade:number,stage:number)=>({grade,openStages:{addition:stage,subtraction:stage,multiplication:stage,division:stage}});
test('friend destination uses common unlocked stages and the preferred forest',()=>{
 const members=[member(3,8),member(3,2)];
 assert.deepEqual(recommendedPartyDestination(members,'division'),{grade:3,forest:'division',stage:2});
 assert.ok(partyDestinations(members).every(c=>c.stage<=2));
 assert.deepEqual(partyDestinations([member(3,8),member(4,8)]),[]);
 assert.equal(recommendedPartyDestination([],'division'),null);
});
test('grouped codes normalize without weakening the eight character join validation',()=>{
 assert.equal(normalizedPartyCode(' abcd efgh '),'ABCDEFGH');
 assert.equal(normalizedPartyCode('abcd\nefgh'),'ABCDEFGH');
 assert.equal(/^[A-Z0-9]{8}$/.test(normalizedPartyCode('ABCD-EFGH')),false);
});
test('expired or malformed invitation notifications never create a visible invitation',()=>{
 const invite={id:crypto.randomUUID(),code:'ABCD1234',fromId:crypto.randomUUID(),nickname:'숲친구',expiresAt:Date.now()+60000};
 assert.ok(parsePartyInvitation(invite));
 assert.equal(parsePartyInvitation({...invite,expiresAt:Date.now()-1}),null);
 assert.equal(parsePartyInvitation({...invite,id:'invalid'}),null);
 assert.equal(parsePartyInvitation({...invite,expiresAt:Date.now()+120000}),null);
});

test('server invitation lookup rejects expiry, a different recipient and a declined invitation',()=>{
 const invite={id:'invitation',target:'friend',expiresAt:1000,memberId:'existing'};
 assert.equal(activePartyInvitation([invite],'invitation','friend',999),invite);
 assert.equal(activePartyInvitation([invite],'invitation','friend',1000),undefined);
 assert.equal(activePartyInvitation([invite],'invitation','other',999),undefined);
 assert.equal(activePartyInvitation([{...invite,declined:true}],'invitation','friend',999),undefined);
});
