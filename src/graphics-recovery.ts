import './graphics-recovery.css';
type Hooks={active:()=>boolean;paused:()=>boolean;freeze:()=>void;persist:()=>boolean;light:()=>void;resume:(previouslyPaused:boolean)=>void;download:()=>void};
/** Recover the existing renderer and save; never force a page reload after a lost context. */
export function mountGraphicsRecovery(canvas:HTMLCanvasElement,h:Hooks){
 const dialog=document.createElement('dialog');dialog.id='graphics-recovery';dialog.setAttribute('aria-labelledby','graphics-recovery-title');dialog.innerHTML='<h2 id="graphics-recovery-title">게임 화면을 다시 준비해요</h2><p>기기의 그래픽 화면이 잠시 끊겼어요. 모험을 멈추고 지금 기록을 보관했어요.</p><p id="graphics-save-state" role="status"></p><button id="graphics-continue" disabled>가벼운 화면으로 계속하기</button><button id="graphics-download">모험 기록 파일 받기</button><button id="graphics-reload">기록을 저장하고 새로고침</button><p class="note">자동으로 게임에서 나가지 않아요. 화면이 돌아오면 계속하기를 눌러 주세요. 다시 열어도 이어하기에서 모험을 계속해요.</p>';
 document.body.append(dialog);const status=dialog.querySelector<HTMLElement>('#graphics-save-state')!,next=dialog.querySelector<HTMLButtonElement>('#graphics-continue')!,reload=dialog.querySelector<HTMLButtonElement>('#graphics-reload')!;
 let lost=false,restored=false,previouslyPaused=false,saved=false;
 function render(){next.disabled=!restored;reload.disabled=!saved;status.textContent=saved?(restored?'✓ 기록을 보관했고 화면도 돌아왔어요.':'✓ 기록을 보관했어요. 브라우저가 화면을 복구하는 중이에요.'):'이 기기에 저장하지 못했어요. 먼저 모험 기록 파일을 받아 주세요.';}
 const onLost=(event:Event)=>{event.preventDefault();if(!h.active()||lost)return;lost=true;restored=false;previouslyPaused=h.paused();h.freeze();saved=h.persist();render();if(!dialog.open)dialog.showModal();};
 const onRestored=()=>{if(!lost)return;restored=true;render();};
 canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
 next.onclick=()=>{if(!restored)return;h.light();saved=h.persist();lost=false;dialog.close();h.resume(previouslyPaused);};
 dialog.querySelector<HTMLButtonElement>('#graphics-download')!.onclick=h.download;
 reload.onclick=()=>{saved=h.persist();render();if(saved)location.reload();};
 dialog.addEventListener('cancel',e=>e.preventDefault());dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();}});
 return ()=>{canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);dialog.remove();};
}
