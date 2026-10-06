// 문제 읽어주기: 브라우저에 들어 있는 음성 합성(speechSynthesis)을 써요. 서버로 아무것도 보내지 않아요.
const AUTO_KEY = 'berry-forest-read-aloud-v1';

/** 수식 기호를 소리 내어 읽기 좋은 말로 바꿔요. */
export function speechText(text: string): string {
  return text
    .replace(/\s*[×✕]\s*/g, ' 곱하기 ').replace(/\s*÷\s*/g, ' 나누기 ').replace(/\s*[−–]\s*/g, ' 빼기 ').replace(/\s*\+\s*/g, ' 더하기 ')
    .replace(/\s*=\s*/g, ' 는 ').replace(/\s*□\s*/g, ' 얼마 ').replace(/(\d+)\s*\/\s*(\d+)/g, '$2분의 $1').replace(/\s+/g, ' ').trim();
}

export function speechSupported(): boolean { return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'; }
export function stopSpeech() { if (speechSupported()) speechSynthesis.cancel(); }

export function speak(text: string, onEnd?: () => void): boolean {
  if (!speechSupported()) return false;
  const spoken = speechText(text); if (!spoken) return false;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(spoken); utterance.lang = 'ko-KR'; utterance.rate = .88; utterance.pitch = 1.05;
  const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('ko')); if (voice) utterance.voice = voice;
  if (onEnd) { utterance.onend = onEnd; utterance.onerror = onEnd; }
  speechSynthesis.speak(utterance); return true;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;
export function autoReadEnabled(storage: Store = localStorage): boolean { try { return storage.getItem(AUTO_KEY) === '1'; } catch { return false; } }
export function setAutoRead(on: boolean, storage: Store = localStorage) { try { storage.setItem(AUTO_KEY, on ? '1' : '0'); } catch { /* 저장 공간이 없어도 읽어주기는 계속 쓸 수 있어요 */ } }
