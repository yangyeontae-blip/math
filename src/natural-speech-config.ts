export const MODEL_REVISION = 'aafc6e32416a594460b32413efc49d7fe4ce6d46';
export const MODEL_BASE = `https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/${MODEL_REVISION}`;
export const QUANT_BASE = 'https://huggingface.co/csukuangfj2/sherpa-onnx-supertonic-3-tts-int8-2026-05-11/resolve/cca5a0e6c96e1d2c720986bf7e75fcc81dee3ae4';
export const VOICE_CACHE = `berry-natural-voice-int8-${MODEL_REVISION}`;
export const VOICE_DOWNLOAD_MB = 160;
export function modelUrl(path:string){
  return /onnx\/(vector_estimator|vocoder)\.onnx$/.test(path)?`${QUANT_BASE}/${path.slice(5).replace('.onnx','.int8.onnx')}`:`${MODEL_BASE}/${path}`;
}
export const MODEL_FILES = ['duration_predictor.onnx','text_encoder.onnx','vector_estimator.onnx','vocoder.onnx'] as const;
export const MODEL_VOICES = { F1:'다정한 목소리', M1:'차분한 목소리' } as const;
export type NaturalVoice = keyof typeof MODEL_VOICES;

export function speechChunks(text: string, limit=110): string[] {
  const chunks:string[]=[];let current='';
  for(const word of text.split(/\s+/).filter(Boolean)){
    if(current && current.length+word.length+1>limit){chunks.push(current);current='';}
    // Even unusually long text without spaces cannot create unbounded inference.
    for(let i=0;i<word.length;i+=limit){const part=word.slice(i,i+limit);if(i){if(current)chunks.push(current);current=part;}else current+=(current?' ':'')+part;}
  }
  if(current)chunks.push(current);return chunks;
}
