// Browser fallback + opt-in, locally synthesized Supertonic Korean speech.
import { naturalEnabled, naturalSupported, speakNatural, stopNaturalVoice } from './natural-speech';
const AUTO_KEY = 'berry-forest-read-aloud-v1';

/** 수식 기호를 소리 내어 읽기 좋은 말로 바꿔요. */
export function speechText(text: string): string {
  return text
    .replace(/\s*[×✕]\s*/g, ' 곱하기 ').replace(/\s*÷\s*/g, ' 나누기 ').replace(/\s*[−–]\s*/g, ' 빼기 ').replace(/\s*\+\s*/g, ' 더하기 ')
    .replace(/\s*=\s*/g, ' 는 ').replace(/\s*□\s*/g, ' 얼마 ').replace(/(\d+)\s*\/\s*(\d+)/g, '$2분의 $1').replace(/\s+/g, ' ').trim();
}

const deviceSupported=()=>typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
export function speechSupported(): boolean { return deviceSupported() || naturalSupported(); }
let generation=0,finish: (()=>void)|undefined;
export function stopSpeech() {generation++;stopNaturalVoice();if(deviceSupported())speechSynthesis.cancel();const done=finish;finish=undefined;done?.();}

export function preferredKoreanVoice<T extends {lang:string;name:string;localService?:boolean}>(voices:T[]):T|undefined{
  return voices.filter(v=>v.lang.toLowerCase().startsWith('ko')).sort((a,b)=>{
    const score=(v:T)=>(/natural|online|sunhi|선히|순희|google|heami|해미/i.test(v.name)?10:0)+(v.localService?1:0);
    return score(b)-score(a);
  })[0];
}

export function speak(text: string, onEnd?: () => void): boolean {
  if (!speechSupported()) return false;
  const spoken = speechText(text); if (!spoken) return false;
  stopSpeech();
  const token=generation;finish=onEnd;
  const done=()=>{if(token!==generation)return;const callback=finish;finish=undefined;callback?.();};
  const device=()=>{
    if(token!==generation)return;
    if(!deviceSupported()){done();return;}
    const utterance=new SpeechSynthesisUtterance(spoken);utterance.lang='ko-KR';utterance.rate=.96;utterance.pitch=1;
    const voice=preferredKoreanVoice(speechSynthesis.getVoices());if(voice)utterance.voice=voice;
    utterance.onend=done;utterance.onerror=done;speechSynthesis.speak(utterance);
  };
  if(naturalEnabled())void speakNatural(spoken).then(done).catch(()=>{if(token===generation)device();});else device();
  return true;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;
export function autoReadEnabled(storage: Store = localStorage): boolean { try { return storage.getItem(AUTO_KEY) === '1'; } catch { return false; } }
export function setAutoRead(on: boolean, storage: Store = localStorage) { try { storage.setItem(AUTO_KEY, on ? '1' : '0'); } catch { /* 저장 공간이 없어도 읽어주기는 계속 쓸 수 있어요 */ } }
