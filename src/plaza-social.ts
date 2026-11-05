import {isBlockedNickname} from './nickname';
export const CHAT_TTL=10*60*1000,CHAT_LIMIT=50,CHAT_LENGTH=100,CHAT_INTERVAL=3000,OPERATOR_SESSION_TTL=7*24*60*60*1000;
export type PlazaRole='player'|'operator';
export interface PlazaChatMessage {id:string;senderId:string;nickname:string;text:string;operator:boolean;sentAt:number}
export interface PlazaChatMute {senderId:string;nickname:string;until:number}
export const validChatIdentity=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
export function normalizeChat(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const text=value.normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').trim().replace(/\s+/gu,' ');
 if(!text||[...text].length>CHAT_LENGTH||/[\u0000-\u001f\u007f<>]/.test(text)||isBlockedNickname(text))return null;
 if(/(?:https?:\/\/|www\.|[\p{L}\p{N}-]+\.(?:com|net|org|kr|io|site|dev|gg|app|me)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:01[016789]|02|0[3-6]\d)[\s.-]?\d{3,4}[\s.-]?\d{4})/iu.test(text))return null;
 return text;
}
export function parseChatMessage(value:unknown):PlazaChatMessage|null{const m=value as PlazaChatMessage;if(!m||!validChatIdentity(m.id)||typeof m.senderId!=='string'||!/^[a-f0-9]{64}$/.test(m.senderId)||typeof m.nickname!=='string'||[...m.nickname].length>10||!m.nickname||/[<>\u0000-\u001f]/.test(m.nickname)||typeof m.operator!=='boolean'||!Number.isSafeInteger(m.sentAt)||m.sentAt<0||normalizeChat(m.text)!==m.text)return null;return {id:m.id,senderId:m.senderId,nickname:m.nickname,text:m.text,operator:m.operator,sentAt:m.sentAt};}