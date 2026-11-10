import {validateSave,type Save} from './rules';
export const ACCOUNT_URL=(import.meta.env?.VITE_ACCOUNT_URL as string|undefined)||'https://berry-forest-school.yangyeontae.chatgpt.site/api/account/';
export class AccountError extends Error {constructor(message:string,readonly status:number){super(message);}}
export class AdventureAccount {
 token='';username='';revision=0;
 constructor(private fetcher:typeof fetch=(...args)=>fetch(...args)){}
 async request(action:string,data:unknown={}){
  let response:Response;try{response=await this.fetcher(new URL(action,ACCOUNT_URL),{method:'POST',credentials:'omit',headers:{'content-type':'application/json',...(this.token?{authorization:'Bearer '+this.token}:{})},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});}catch{throw new AccountError('연결이 불안정해요. 이 기기 기록은 그대로 남아 있어요. 잠시 후 다시 시도해 주세요.',503);}
  const result=await response.json().catch(()=>null);
  if(!response.ok)throw new AccountError(result?.error||'보관함에 연결하지 못했어요. 기기 기록은 그대로예요.',response.status);
  if(!result?.ok)throw new AccountError('보관 결과를 확인하지 못했어요.',503);return result;
 }
 async enter(action:'register'|'login',username:string,password:string,consent=false){const r=await this.request(action,{username,password,consent});this.token=r.token;this.username=r.username;return r;}
 async load():Promise<{snapshot:Save|null;revision:number;updatedAt:number}>{const token=this.token,r=await this.request('load');if(this.token!==token)throw new AccountError('다시 로그인해 주세요.',401);const snapshot=r.snapshot?validateSave(r.snapshot):null;if(!Number.isSafeInteger(r.revision)||r.revision<0)throw Error('보관 버전을 확인하지 못했어요.');this.revision=r.revision;return {...r,snapshot};}
 async save(snapshot:Save){const token=this.token,r=await this.request('save',{snapshot,revision:this.revision});if(this.token!==token)throw new AccountError('다시 로그인해 주세요.',401);this.revision=r.revision;return r;}
 async logout(){const token=this.token;this.token='';this.username='';this.revision=0;if(token)try{await this.fetcher(new URL('logout',ACCOUNT_URL),{method:'POST',credentials:'omit',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:'{}',signal:AbortSignal.timeout(5000)});}catch{}}
}
export const LOCAL_ACCOUNT_BACKUPS='berry-forest-account-local-backups-v1';
/** Never remove a local adventure when replacement cannot first be archived. */
export function archiveAccountLocal(storage:Pick<Storage,'getItem'|'setItem'>,save:Save){
 let old:unknown;try{old=JSON.parse(storage.getItem(LOCAL_ACCOUNT_BACKUPS)||'[]');}catch{throw Error('이전 보관 사본을 읽지 못했어요. 먼저 저장 파일을 내려받아 주세요.');}
 if(!Array.isArray(old))throw Error('보관 사본을 확인해 주세요.');
 const reports=Object.fromEntries(['berry-forest-learning-resolutions-v1','berry-forest-report-history-v1'].map(k=>[k,storage.getItem(k)]));
 const next=JSON.stringify([{savedAt:Date.now(),snapshot:save,reports},...old].slice(0,3));storage.setItem(LOCAL_ACCOUNT_BACKUPS,next);
 if(storage.getItem(LOCAL_ACCOUNT_BACKUPS)!==next)throw Error('기기 기록을 보관하지 못했어요. 먼저 파일을 내려받아 주세요.');
}
