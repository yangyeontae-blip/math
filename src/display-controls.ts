import './feedback-ui.css';
export type ViewPreset='near'|'normal'|'wide';
export const VIEW_SCALES={near:.82,normal:1,wide:1.25} as const;
export function displayPreference(raw:string|null,mobile:boolean){try{const v=JSON.parse(raw??'null');return {clean:typeof v?.clean==='boolean'?v.clean:mobile,view:Object.hasOwn(VIEW_SCALES,v?.view)?v.view as ViewPreset:'normal' as ViewPreset};}catch{return {clean:mobile,view:'normal' as ViewPreset};}}
export function mountDisplayControls(host:HTMLElement,world:()=>{setViewScale:(n:number)=>void}|undefined){
 const key='berry-display-v1';let raw=null;try{raw=localStorage.getItem(key);}catch{}const pref=displayPreference(raw,matchMedia('(max-width:700px)').matches);
 const bar=document.createElement('div');bar.className='display-controls';bar.setAttribute('aria-label','화면 정리와 게임 시야');bar.innerHTML='<button id="hud-toggle" aria-controls="hud">화면 접기</button><button id="view-toggle" aria-expanded="false" aria-controls="view-presets">시야</button><div id="view-presets" hidden role="group" aria-label="게임 안 시야"><small>게임 안 시야 조절</small>'+Object.entries({near:'가까이',normal:'기본',wide:'넓게'}).map(([id,label])=>'<button data-view="'+id+'">'+label+'</button>').join('')+'</div>';host.append(bar);
 const fold=bar.querySelector<HTMLButtonElement>('#hud-toggle')!,zoom=bar.querySelector<HTMLButtonElement>('#view-toggle')!,panel=bar.querySelector<HTMLElement>('#view-presets')!;
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(pref));}catch{}};
 function apply(){host.classList.toggle('is-clean-screen',pref.clean);fold.textContent=pref.clean?'화면 펼치기':'화면 접기';fold.setAttribute('aria-expanded',String(!pref.clean));bar.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===pref.view)));world()?.setViewScale(VIEW_SCALES[pref.view]);}
 fold.onclick=()=>{pref.clean=!pref.clean;apply();save();};zoom.onclick=()=>{panel.hidden=!panel.hidden;zoom.setAttribute('aria-expanded',String(!panel.hidden));};bar.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>{pref.view=b.dataset.view as ViewPreset;apply();save();panel.hidden=true;zoom.setAttribute('aria-expanded','false');});apply();return {apply};
}
export function storageLocation(){const agent=navigator.userAgent;const browser=/Edg\//.test(agent)?'Microsoft Edge':/OPR\//.test(agent)?'Opera':/Firefox\//.test(agent)?'Firefox':/Chrome\//.test(agent)?'Chrome':/Safari\//.test(agent)?'Safari':'현재 브라우저';return location.origin+' · '+browser;}
