import { naturalSupported,naturalEnabled,prepareNaturalVoice,useDeviceVoice,voiceStyle,setVoiceStyle,voiceStatus,voiceBusy } from './natural-speech';
import { speak,stopSpeech } from './speech';
import { VOICE_DOWNLOAD_MB } from './natural-speech-config';

export function voiceControls(host:HTMLElement,expanded=false){
  if(!naturalSupported())return;
  const panel=document.createElement('details');panel.className='voice-controls';panel.open=expanded;
  // 설정 창에서 자리를 덜 차지하도록 한 줄 요약만 보이고, 고르기·받기는 펼쳐야 보여요. 긴 안내는 "자세한 안내" 안에 접어 둬요.
  panel.innerHTML=`<summary><span>읽어주기 목소리</span><b data-voice-current></b></summary><div class="voice-row"><select data-voice-style aria-label="읽어주기 목소리"><option value="F1">다정한 목소리</option><option value="M1">차분한 목소리</option></select><button class="secondary" data-voice-sample>들어보기</button></div><button class="primary wide" data-voice-prepare>새 목소리 받기 · 약 ${VOICE_DOWNLOAD_MB}MB</button><p data-voice-status role="status" aria-live="polite"></p><button class="text-button wide" data-voice-device>기기 목소리로 바꾸기</button><details class="voice-more"><summary>자세한 안내</summary><small>Supertonic AI 목소리로 문제를 읽어요. 처음 한 번 약 ${VOICE_DOWNLOAD_MB}MB를 받으니 Wi-Fi에서 준비해 주세요. 문제·답·학생 저장은 음성 서버로 보내지 않아요. 음성 파일은 공식 모델 저장소와 실행 라이브러리 CDN에서 받아 이 브라우저에 보관해요. 약한 기기에서는 기기 목소리로 돌아가요. <a href="./licenses/supertonic/MODEL-LICENSE.txt" target="_blank" rel="noopener">모델 이용 조건</a></small></details>`;
  host.append(panel);
  const select=panel.querySelector<HTMLSelectElement>('[data-voice-style]')!;select.value=voiceStyle();
  select.onchange=()=>{stopSpeech();setVoiceStyle(select.value==='M1'?'M1':'F1');updateVoiceControls();};
  panel.querySelector<HTMLButtonElement>('[data-voice-prepare]')!.onclick=async()=>{stopSpeech();try{await prepareNaturalVoice();}catch{/* Status includes retry instructions. */}updateVoiceControls();};
  panel.querySelector<HTMLButtonElement>('[data-voice-sample]')!.onclick=()=>{speak('안녕! 베리숲에 온 걸 환영해. 문제를 천천히 읽고 함께 생각해 보자.');};
  panel.querySelector<HTMLButtonElement>('[data-voice-device]')!.onclick=()=>{stopSpeech();useDeviceVoice();updateVoiceControls();};
  updateVoiceControls();
}
function updateVoiceControls(){
  document.querySelectorAll<HTMLElement>('[data-voice-status]').forEach(element=>element.textContent=voiceStatus());
  document.querySelectorAll<HTMLButtonElement>('[data-voice-prepare]').forEach(button=>{button.disabled=voiceBusy();button.textContent=voiceBusy()?'목소리 준비 중…':naturalEnabled()?'새 목소리 다시 준비하기':`새 목소리 받기 · 약 ${VOICE_DOWNLOAD_MB}MB`;});
  document.querySelectorAll<HTMLButtonElement>('[data-voice-sample]').forEach(button=>button.disabled=voiceBusy()||!naturalEnabled());
  document.querySelectorAll<HTMLElement>('[data-voice-current]').forEach(element=>element.textContent=voiceBusy()?'준비 중…':naturalEnabled()?(voiceStyle()==='M1'?'차분한 AI 목소리':'다정한 AI 목소리'):'기기 목소리');
}
if(typeof window!=='undefined')window.addEventListener('berry-speech-status',updateVoiceControls);
