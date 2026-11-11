import {operationsForGrade,type ForestKind,type SchoolGrade} from './rules';

export type PartyDestination = {grade:SchoolGrade;forest:ForestKind;stage:number};
export type PartyLobbyMember = {grade:number;openStages:Record<string,number>};
export type PartyInvitation = {id:string;code:string;fromId:string;nickname:string;expiresAt:number};

export function normalizedPartyCode(value:string) {
 return value.replace(/\s/g,'').toUpperCase();
}
export function partyDestinations(members:PartyLobbyMember[]):PartyDestination[] {
 const first=members[0];
 if(!first||!Number.isInteger(first.grade)||first.grade<1||first.grade>6||members.some(m=>m.grade!==first.grade))return [];
 const grade=first.grade as SchoolGrade;
 return operationsForGrade(grade).flatMap(forest=>{
  const highest=Math.min(...members.map(m=>m.openStages[forest]??0));
  return Array.from({length:Math.max(0,Math.min(10,highest))},(_,i)=>({grade,forest,stage:i+1}));
 });
}
export function recommendedPartyDestination(members:PartyLobbyMember[],preferred:ForestKind):PartyDestination|null {
 const choices=partyDestinations(members);
 const forest=choices.some(c=>c.forest===preferred)?preferred:choices[0]?.forest;
 return choices.filter(c=>c.forest===forest).at(-1)??null;
}
export function samePartyDestination(a:PartyDestination|null|undefined,b:PartyDestination|null|undefined) {
 return a?.grade===b?.grade&&a?.forest===b?.forest&&a?.stage===b?.stage;
}
export function parsePartyInvitation(value:unknown):PartyInvitation|null {
 const v=value as PartyInvitation;
 return v&&typeof v.id==='string'&&/^[a-f0-9-]{36}$/.test(v.id)&&
 typeof v.code==='string'&&/^[A-Z0-9]{8}$/.test(v.code)&&typeof v.fromId==='string'&&
 typeof v.nickname==='string'&&v.nickname.length>0&&[...v.nickname].length<=10&&
 Number.isSafeInteger(v.expiresAt)&&v.expiresAt>Date.now()&&v.expiresAt<=Date.now()+65000?v:null;
}

export function activePartyInvitation<T extends {id:string;target:string;expiresAt:number;declined?:boolean}>(invitations:T[],id:string,target:string|null,now=Date.now()):T|undefined {
 return invitations.find(invite=>invite.id===id&&invite.target===target&&!invite.declined&&invite.expiresAt>now);
}
