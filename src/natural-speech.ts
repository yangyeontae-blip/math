import { MODEL_VOICES, VOICE_DOWNLOAD_MB, type NaturalVoice } from './natural-speech-config';

const MODE_KEY='berry-forest-voice-engine-v1',VOICE_KEY='berry-forest-voice-style-v1';
let worker:Worker|null=null,context:AudioContext|null=null,source:AudioBufferSourceNode|null=null;
let serial=0,playback=0,idle:ReturnType<typeof setTimeout>|undefined,playbackDone:(()=>void)|undefined;
let status='자연스러운 한국어 목소리를 준비할 수 있어요.';
const pending=new Map<number,{resolve:(value:any)=>void;reject:(error:Error)=>void;type:string;timer:ReturnType<typeof setTimeout>}>();
const stored=(key:string)=>{try{return localStorage.getItem(key);}catch{return null;}};
function save(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* Voice still works this session. */}}
let sessionMode:string|null=null;
export function naturalSupported(){return typeof Worker!=='undefined'&&typeof AudioContext!=='undefined'&&typeof WebAssembly!=='undefined';}
export function naturalEnabled(){return (sessionMode??stored(MODE_KEY))==='natural'&&naturalSupported();}
export function voiceStyle():NaturalVoice{return stored(VOICE_KEY)==='M1'?'M1':'F1';}
export function setVoiceStyle(voice:NaturalVoice){save(VOICE_KEY,voice);}
export function voiceStatus(){return status;}
export function voiceBusy(){return pending.size>0;}
function report(text:string){status=text;if(typeof window!=='undefined')window.dispatchEvent(new Event('berry-speech-status'));}
function retire(){worker?.terminate();worker=null;clearTimeout(idle);for(const request of pending.values()){clearTimeout(request.timer);request.reject(new Error('음성 준비를 취소했어요.'));}pending.clear();}
function rest(){clearTimeout(idle);if(worker)idle=setTimeout(()=>{if(!pending.size&&!source)retire();},60000);}
function getWorker(){
  if(!worker){
    worker=new Worker(new URL('./natural-speech.worker.ts',import.meta.url),{type:'module'});
    worker.onmessage=event=>{
      const data=event.data;if(data.type==='progress'){report(data.text);return;}
      const request=pending.get(data.id);if(!request)return;pending.delete(data.id);clearTimeout(request.timer);
      if(data.type==='error'){report('AI 목소리를 준비하지 못했어요. 기기 목소리로 읽거나 다시 준비해 주세요.');request.reject(new Error(data.message));}else request.resolve(data);
      rest();
    };
    worker.onerror=()=>{retire();report('음성을 불러오지 못했어요. 기기 음성을 쓰거나 다시 시도해 주세요.');};
  }
  return worker;
}
function request(type:'prepare'|'speak',text=''){
  clearTimeout(idle);const id=++serial;
  return new Promise<any>((resolve,reject)=>{
    const timer=setTimeout(()=>{retire();report('음성 준비가 오래 걸려 멈췄어요. 연결을 확인하고 다시 시도해 주세요.');},240000);
    pending.set(id,{resolve,reject,type,timer});
    try{getWorker().postMessage({id,type,text,voice:voiceStyle()});}catch(error){retire();reject(error);}
  });
}
export async function prepareNaturalVoice(){
  if(!naturalSupported())throw new Error('이 브라우저에서는 기기 목소리를 사용해 주세요.');
  report(`한국어 목소리 준비 중 · 처음에는 약 ${VOICE_DOWNLOAD_MB}MB, Wi-Fi를 권장해요.`);
  try{await request('prepare');sessionMode='natural';save(MODE_KEY,'natural');report(`${MODEL_VOICES[voiceStyle()]} 준비 완료 · 문제를 기기 안에서 읽어요.`);}
  catch(error){report(error instanceof Error?error.message:'음성을 준비하지 못했어요.');throw error;}
}
export function useDeviceVoice(){stopNaturalVoice();retire();sessionMode='device';save(MODE_KEY,'device');report('기기에 설치된 한국어 목소리를 사용해요.');}
export function stopNaturalVoice(){
  playback++;const active=source;source=null;if(active){active.onended=null;try{active.stop();}catch{/* Already ended. */}active.disconnect();}
  playbackDone?.();playbackDone=undefined;
  if([...pending.values()].some(p=>p.type==='speak'))retire();
  if(context?.state==='running')void context.suspend();rest();
}
export async function speakNatural(text:string){
  const token=++playback;
  context??=new AudioContext();await context.resume();
  if(token!==playback)return;
  report('자연스러운 목소리로 읽을 준비 중…');
  const result=await request('speak',text);
  if(token!==playback)return;
  const pcm=result.pcm as Float32Array;
  if(!pcm.length||pcm.some(value=>!Number.isFinite(value)))throw new Error('음성을 만들지 못했어요.');
  const buffer=context.createBuffer(1,pcm.length,result.sampleRate);buffer.copyToChannel(new Float32Array(pcm),0);
  const node=context.createBufferSource();node.buffer=buffer;node.connect(context.destination);source=node;
  report(`${MODEL_VOICES[voiceStyle()]}로 읽는 중…`);
  await new Promise<void>(resolve=>{playbackDone=resolve;node.onended=()=>{playbackDone=undefined;node.disconnect();if(source===node)source=null;rest();resolve();};node.start();});
  if(token===playback){report('읽기를 마쳤어요.');void context.suspend();}
}
