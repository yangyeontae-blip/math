import * as ort from 'onnxruntime-web/wasm';
import { TextToSpeech, UnicodeProcessor, Style } from './vendor/supertonic/helper.js';
import { modelUrl, MODEL_FILES, VOICE_CACHE, VOICE_DOWNLOAD_MB, speechChunks, type NaturalVoice } from './natural-speech-config';

// One background thread also works without cross-origin isolation on GitHub Pages.
ort.env.wasm.numThreads=1;
ort.env.wasm.proxy=false;
ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
let engine:TextToSpeech|null=null, initialization:Promise<void>|null=null;
const styles=new Map<NaturalVoice,Style>();
let queue=Promise.resolve();
const send=(data:object)=>self.postMessage(data);
async function asset(path:string):Promise<ArrayBuffer>{
  const url=modelUrl(path);
  let cache:Cache|undefined;
  try{cache=await caches.open(VOICE_CACHE);const saved=await cache.match(url);if(saved)return saved.arrayBuffer();}catch{/* Private browsing/quota: speech can still run in memory. */}
  const response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw new Error(`음성 파일을 받지 못했어요 (${response.status}).`);
  if(cache){try{await cache.put(url,response.clone());}catch{/* Storage full: do not prevent speech. */}}
  return response.arrayBuffer();
}
async function json(path:string){return JSON.parse(new TextDecoder().decode(await asset(path)));}
async function initialize(){
  if(engine)return;
  if(!initialization)initialization=(async()=>{
    const cfg=await json('onnx/tts.json'),indexer=await json('onnx/unicode_indexer.json');
    const sessions:ort.InferenceSession[]=[];
    try{
      for(let i=0;i<MODEL_FILES.length;i++){
        send({type:'progress',text:`음성 파일 준비 ${i+1}/4 · 처음에는 약 ${VOICE_DOWNLOAD_MB}MB를 받아요`});
        const buffer=await asset(`onnx/${MODEL_FILES[i]}`);
        sessions.push(await ort.InferenceSession.create(buffer,{executionProviders:['wasm'],graphOptimizationLevel:'all'}));
      }
      engine=new TextToSpeech(cfg,new UnicodeProcessor(indexer),...sessions as [ort.InferenceSession,ort.InferenceSession,ort.InferenceSession,ort.InferenceSession]);
    }catch(error){await Promise.all(sessions.map(session=>session.release()));throw error;}
  })().catch(error=>{initialization=null;throw error;});
  await initialization;
}
async function style(voice:NaturalVoice){
  if(!styles.has(voice)){
    const v=await json(`voice_styles/${voice}.json`);
    styles.set(voice,new Style(new ort.Tensor('float32',Float32Array.from(v.style_ttl.data.flat(Infinity)),v.style_ttl.dims),new ort.Tensor('float32',Float32Array.from(v.style_dp.data.flat(Infinity)),v.style_dp.dims)));
  }
  return styles.get(voice)!;
}
self.onmessage=event=>{
  const {id,type,text,voice='F1'}=event.data;
  // ONNX sessions are not run concurrently. A cancelled request is ignored by its caller.
  queue=queue.catch(()=>{}).then(async()=>{
    try{
      await initialize();const speaker=await style(voice);
      if(type==='prepare'){send({type:'ready',id});return;}
      const chunks=speechChunks(text),samples:Float32Array[]=[];
      for(const chunk of chunks){const result=await engine!.call(chunk,'ko',speaker,8,1.02);const length=Math.min(result.wav.length,Math.ceil(result.duration[0]*engine!.sampleRate));samples.push(Float32Array.from(result.wav.slice(0,length)));}
      const pcm=new Float32Array(samples.reduce((sum,s)=>sum+s.length,0));let offset=0;
      for(const sample of samples){pcm.set(sample,offset);offset+=sample.length;}
      self.postMessage({type:'audio',id,pcm,sampleRate:engine!.sampleRate},{transfer:[pcm.buffer]});
    }catch(error){send({type:'error',id,message:error instanceof Error?error.message:'음성을 준비하지 못했어요.'});}
  });
};
