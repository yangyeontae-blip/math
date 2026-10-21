import { naturalSupported,naturalEnabled,prepareNaturalVoice,useDeviceVoice,voiceStyle,setVoiceStyle,voiceStatus,voiceBusy } from './natural-speech';
import { speak,stopSpeech } from './speech';
import { VOICE_DOWNLOAD_MB } from './natural-speech-config';

export function voiceControls(host:HTMLElement,expanded=false){
  if(!naturalSupported())return;
  const panel=document.createElement('details');panel.className='voice-controls';panel.open=expanded;
  panel.innerHTML=`<summary>🔊 자연스러운 한국어 목소리</summary><p>Supertonic AI 목소리로 문제를 읽어요. 처음에 약 ${VOICE_DOWNLOAD_MB}MB를 받으므로 Wi-Fi에서 준비해 주세요. 처음 접속할 때는 내려받지 않아요.</p><label>목소리 <select data-voice-style aria-label="읽어주기 목소리"><option value="F1">다정한 목소리</option><option value="M1">차분한 목소리</option></select></label><button class="primary wide" data-voice-prepare>새 목소리 받기 · 약 ${VOICE_DOWNLOAD_MB}MB</button><p data-voice-status role="status" aria-live="polite"></p><button class="secondary wide" data-voice-sample>목소리 들어보기</button><button class="text-button wide" data-voice-device>기기 목소리로 바꾸기 · 다운로드 취소</button><small>문제·답·학생 저장은 음성 서버로 보내지 않아요. 음성 파일만 공식 모델 저장소와 실행 라이브러리 CDN에서 받으며, 주소별 브라우저 저장 공간에 보관해요. 캐시를 지우면 다시 받을 수 있어요. 약한 기기에서는 기기 목소리로 돌아가요. <a href="./licenses/supertonic/MODEL-LICENSE.txt" target="_blank" rel="noopener">모델 이용 조건</a></small>`;
  host.append(panel);
  const select=panel.querySelector<HTMLSelectElement>('[data-voice-style]')!;select.value=voiceStyle();
  select.onchange=()=>{stopSpeech();setVoiceStyle(select.value==='M1'?'M1':'F1');};
  panel.querySelector<HTMLButtonElement>('[data-voice-prepare]')!.onclick=async()=>{stopSpeech();try{await prepareNaturalVoice();}catch{/* Status includes retry instructions. */}updateVoiceControls();};
  panel.querySelector<HTMLButtonElement>('[data-voice-sample]')!.onclick=()=>{speak('안녕! 베리숲에 온 걸 환영해. 문제를 천천히 읽고 함께 생각해 보자.');};
  panel.querySelector<HTMLButtonElement>('[data-voice-device]')!.onclick=()=>{stopSpeech();useDeviceVoice();updateVoiceControls();};
  updateVoiceControls();
}
function updateVoiceControls(){
  document.querySelectorAll<HTMLElement>('[data-voice-status]').forEach(element=>element.textContent=voiceStatus());
  document.querySelectorAll<HTMLButtonElement>('[data-voice-prepare]').forEach(button=>{button.disabled=voiceBusy();button.textContent=voiceBusy()?'목소리 준비 중…':naturalEnabled()?'새 목소리 다시 준비하기':`새 목소리 받기 · 약 ${VOICE_DOWNLOAD_MB}MB`;});
  document.querySelectorAll<HTMLButtonElement>('[data-voice-sample]').forEach(button=>button.disabled=voiceBusy()||!naturalEnabled());
}
if(typeof window!=='undefined')window.addEventListener('berry-speech-status',updateVoiceControls);
