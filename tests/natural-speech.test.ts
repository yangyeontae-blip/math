import {test} from 'node:test';
import assert from 'node:assert/strict';
import {speechText,preferredKoreanVoice} from '../src/speech';
import {MODEL_BASE,QUANT_BASE,VOICE_DOWNLOAD_MB,modelUrl,speechChunks} from '../src/natural-speech-config';

test('natural voice uses pinned model revisions and smaller int8 estimator/vocoder',()=>{
  assert.match(MODEL_BASE,/resolve\/[a-f0-9]{40}$/);assert.match(QUANT_BASE,/resolve\/[a-f0-9]{40}$/);
  assert.ok(modelUrl('onnx/vocoder.onnx').endsWith('/vocoder.int8.onnx'));assert.ok(modelUrl('onnx/vector_estimator.onnx').startsWith(QUANT_BASE));
  assert.ok(modelUrl('voice_styles/F1.json').startsWith(MODEL_BASE));assert.ok(VOICE_DOWNLOAD_MB<=160);
});
test('Korean voice fallback ignores other languages and prefers a named natural voice',()=>{
  const voices=[{lang:'en-US',name:'Natural English'},{lang:'ko-KR',name:'Old voice'},{lang:'ko-KR',name:'Microsoft SunHi Natural'}];
  assert.equal(preferredKoreanVoice(voices)?.name,'Microsoft SunHi Natural');assert.equal(preferredKoreanVoice([voices[0]]),undefined);
});
test('long questions are split without truncating words or exposing an answer',()=>{
  for(const text of ['베리 12개를 친구 3명에게 똑같이 나누어 주세요.','가'.repeat(1000),Array(80).fill('문제를 천천히 생각해요.').join(' ')]){
    const chunks=speechChunks(text);assert.ok(chunks.every(c=>c.length<=110));assert.equal(chunks.join('').replace(/\s/g,''),text.replace(/\s/g,''));
  }
  assert.equal(speechText('36 ÷ 4 = □'),'36 나누기 4 는 얼마');
});
