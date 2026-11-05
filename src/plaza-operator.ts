import {PLAZA_ENDPOINT} from './plaza-endpoint';
const KEY='berry-plaza-operator-v1';
export class PlazaOperator {
 private credential:{token:string;expiresAt:number}|null=null;
 private verified=false;
 constructor(private endpoint=PLAZA_ENDPOINT,private storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>=localStorage,private request:typeof fetch=fetch.bind(globalThis)){try{const v=JSON.parse(storage.getItem(KEY)??'null');if(v&&/^[a-f0-9]{64}$/.test(v.token)&&v.expiresAt>Date.now())this.credential=v;else storage.removeItem(KEY);}catch{}}
 get token(){return this.credential?.expiresAt!>Date.now()?this.credential!.token:'';}
 get expiresAt(){return this.credential?.expiresAt??0;}
 invalidate(){this.verified=false;}
 get active(){return this.verified&&!!this.token;}
 private url(){const u=new URL(this.endpoint);u.protocol=u.protocol==='ws:'?'http:':'https:';u.pathname='/operator/session';u.search='';return u.href;}
 private async call(method:string,code?:string){const res=await this.request(this.url(),{method,cache:'no-store',headers:{...(code!==undefined?{'Content-Type':'application/json'}:{}),...(this.token?{Authorization:'Bearer '+this.token}:{})},...(code!==undefined?{body:JSON.stringify({code})}:{})});const data=await res.json();if(!res.ok||data.role!=='operator'&&method!=='DELETE')throw new Error(data.error==='rate'?'여러 번 입력했어요. 15분 후 다시 시도해 주세요.':data.error==='not_ready'?'운영자 인증을 준비 중이에요.':'코드를 확인해 주세요.');return data;}
 async validate(){if(!this.token)return false;try{await this.call('GET');this.verified=true;return true;}catch{this.verified=false;return false;}}
 async authenticate(code:string){const data=await this.call('POST',code);if(!/^[a-f0-9]{64}$/.test(data.token)||!Number.isSafeInteger(data.expiresAt))throw Error('인증 응답을 확인하지 못했어요.');this.credential={token:data.token,expiresAt:data.expiresAt};try{this.storage.setItem(KEY,JSON.stringify(this.credential));}catch{}this.verified=true;}
 async logout(){await this.call('DELETE');this.credential=null;this.verified=false;try{this.storage.removeItem(KEY);}catch{}}
}
export function plazaDeviceIdentity(storage:Pick<Storage,'getItem'|'setItem'>=localStorage){const key='berry-plaza-chat-device-v1';try{const saved=storage.getItem(key);if(saved&&/^[a-f0-9-]{36}$/.test(saved))return saved;const id=crypto.randomUUID();storage.setItem(key,id);return id;}catch{return crypto.randomUUID();}}