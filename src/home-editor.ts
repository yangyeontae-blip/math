import * as T from 'three';
import { HOME_ITEMS, STARTER_BLUEPRINTS, availableHome, blueprintIds, type HomeObject } from './homestead';
import { homeItemModel } from './homestead-models';
import { HomeEditorSession, homeCellAt } from './home-editor-state';
import type { Save } from './rules';
import type { HomeHooks } from './homestead-view';
import './home-editor.css';

/** An isolated editing scene uses the same models and placement rules as the walkable village. */
export function showHomeEditor(s:Save,h:HomeHooks){
  const edit=new HomeEditorSession(s,h.full);
  h.open(`<section data-home-editor><header class="editor-header"><button id="editor-back" class="secondary">← 이전 메뉴</button><div><span>내 손으로 꾸미는 정원</span><h2>정원 꾸미기</h2></div><button id="editor-finish" class="primary">완료 · 걸어 보기</button></header><div class="editor-body"><aside class="editor-catalog"><h3>놓을 물건</h3><label class="editor-filter">종류 <select id="editor-category"><option>전체</option><option>길·울타리</option><option>식물</option><option>생활 시설</option><option>장식</option></select></label><div id="editor-items"></div><p id="editor-wallet"></p></aside><main class="editor-stage"><div class="editor-view" id="editor-view" tabindex="0" role="group" aria-label="3D 마을 배치 화면. 물건을 고르고 바닥을 누르세요. 방향키로 위치를 고르고 Enter로 배치할 수도 있어요."></div><div class="editor-camera"><button id="editor-camera-left" aria-label="마을 보기 왼쪽 회전">↶</button><button id="editor-camera-right" aria-label="마을 보기 오른쪽 회전">↷</button><button id="editor-zoom-in" aria-label="마을 확대">＋</button><button id="editor-zoom-out" aria-label="마을 축소">−</button><button id="editor-fit">전체 보기</button></div><div class="editor-instruction" id="editor-message" role="status" aria-live="polite">① 물건 고르기 → ② 원하는 바닥 누르기</div><div class="editor-tools"><b id="editor-selection">놓인 물건을 누르면 옮기거나 보관할 수 있어요.</b><div class="editor-controls"><button id="editor-place" class="primary">여기에 놓기</button><button id="editor-rotate">↻ 물건 회전</button><button id="editor-store">보관</button><button id="editor-cancel">선택 해제</button><button id="editor-undo">↶ 되돌리기</button></div><div id="editor-nudge" class="editor-nudge" aria-label="키보드 대신 한 칸 이동"><button data-nudge="-1,0" aria-label="배치 왼쪽 한 칸">←</button><button data-nudge="0,-1" aria-label="배치 위로 한 칸">↑</button><button data-nudge="0,1" aria-label="배치 아래로 한 칸">↓</button><button data-nudge="1,0" aria-label="배치 오른쪽 한 칸">→</button><button id="editor-craft">만들기</button></div></div></main></div></section>`);
  const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id)! as E;
  const host=$('editor-view'),dialog=host.closest('dialog')!;
  const scene=new T.Scene();scene.background=new T.Color(0xd9eddd);
  const camera=new T.OrthographicCamera(-22,22,22,-22,.1,140),ray=new T.Raycaster(),point=new T.Vector2();
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false});}catch{host.textContent='3D 꾸미기를 열지 못했어요. 그래픽 가속을 켠 브라우저에서 다시 열어 주세요.'; $('editor-back').onclick=h.back; $('editor-finish').onclick=h.enter;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
  scene.add(new T.HemisphereLight(0xfff6dc,0x8fba9a,2.5));const sun=new T.DirectionalLight(0xffffff,2.4);sun.position.set(-10,25,18);scene.add(sun);
  const ownedMaterials:T.Material[]=[];
  const material=(color:number)=>{const m=new T.MeshStandardMaterial({color,roughness:.9});ownedMaterials.push(m);return m;};
  const ground=new T.Mesh(new T.BoxGeometry(25,.5,25),material(0xbcd49d));ground.position.y=-.29;scene.add(ground);
  const lawn=new T.Mesh(new T.PlaneGeometry(24,24),material(0xd7e4b8));lawn.rotation.x=-Math.PI/2;lawn.position.y=-.01;scene.add(lawn);
  const grid=new T.GridHelper(24,12,0x8ea678,0xaabc91);grid.position.y=.015;scene.add(grid);
  const entry=new T.Mesh(new T.BoxGeometry(3.8,.08,1.8),material(0xe4c79a));entry.position.set(0,.03,11);scene.add(entry);
  const root=new T.Group();scene.add(root);let ghost:T.Group|null=null,ghostKind=-1,angle=Math.PI/4,zoom=1,frame=0,disposed=false,category='전체';
  const focus=new T.Vector3();
  const markMaterial=new T.MeshBasicMaterial({color:0x4c946c,transparent:true,opacity:.42,depthWrite:false});ownedMaterials.push(markMaterial);
  const mark=new T.Mesh(new T.BoxGeometry(1,.05,1),markMaterial);scene.add(mark);
  const disposeGroup=(g:T.Object3D,cloned=false)=>g.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();if(cloned)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});
  const position=(g:T.Object3D,o:HomeObject)=>{const item=HOME_ITEMS[o.kind],w=o.rotation%2?item.h:item.w,d=o.rotation%2?item.w:item.h;g.position.set((o.column+(w-1)/2-5.5)*2,0,(o.row+(d-1)/2-5.5)*2);g.rotation.y=o.rotation*Math.PI/2;};
  const draw=()=>{if(!disposed)renderer.render(scene,camera);};
  const requestDraw=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});};
  const resize=()=>{if(disposed)return;const w=host.clientWidth,hgt=host.clientHeight;if(!w||!hgt)return;renderer.setSize(w,hgt);const aspect=w/hgt,half=(aspect<1?18:16.5)/zoom;camera.left=-half*Math.max(1,aspect);camera.right=-camera.left;camera.top=half*Math.max(1,1/aspect);camera.bottom=-camera.top;camera.position.set(focus.x+Math.sin(angle)*32,35,focus.z+Math.cos(angle)*32);camera.lookAt(focus);camera.updateProjectionMatrix();requestDraw();};
  const focusSelection=()=>{if(!edit.selection)return;const o=edit.selection;focus.set((o.column-5.5)*2,0,(o.row-5.5)*2);zoom=Math.max(zoom,1.55);resize();};
  const rebuild=()=>{for(const child of [...root.children]){root.remove(child);disposeGroup(child);}for(const o of s.homestead.objects){const g=homeItemModel(o.kind);g.userData.uid=o.uid;position(g,o);root.add(g);}};
  const message=(text:string,error=false)=>{$('editor-message').textContent=text;$('editor-message').classList.toggle('invalid',error);};
  const updatePreview=()=>{
    const selected=edit.selection;root.children.forEach(g=>g.visible=g.userData.uid!==selected?.uid);
    if(!selected){if(ghost)ghost.visible=false;mark.visible=false;}
    else{
      if(ghostKind!==selected.kind){if(ghost){scene.remove(ghost);disposeGroup(ghost,true);}ghost=homeItemModel(selected.kind);ghost.traverse(o=>{if(o instanceof T.Mesh){o.material=(o.material as T.Material).clone();o.material.transparent=true;o.material.opacity=.62;}});scene.add(ghost);ghostKind=selected.kind;}
      ghost!.visible=true;position(ghost!,selected);const item=HOME_ITEMS[selected.kind],w=selected.rotation%2?item.h:item.w,d=selected.rotation%2?item.w:item.h;
      mark.visible=true;mark.position.set(ghost!.position.x,.07,ghost!.position.z);mark.scale.set(w*2,1,d*2);markMaterial.color.setHex(edit.error()?0xc26d61:0x4c946c);
    }
    const item=selected&&HOME_ITEMS[selected.kind];
    $('editor-selection').textContent=selected?`${item!.name} · ${selected.uid?'옮기는 중':`보관 ${availableHome(s,selected.kind)}개`} · ${selected.column+1}열 ${selected.row+1}행`:'물건을 고르거나 놓인 물건을 눌러 보세요.';
    for(const id of ['editor-place','editor-rotate','editor-cancel'])$(id).hidden=!selected;
    $('editor-nudge').hidden=!selected;
    document.querySelectorAll<HTMLButtonElement>('[data-editor-kind]').forEach(b=>b.setAttribute('aria-pressed',String(!selected?.uid&&selected?.kind===Number(b.dataset.editorKind))));
    $('editor-store').hidden=!selected?.uid;$<HTMLButtonElement>('editor-place').disabled=!!edit.error();$<HTMLButtonElement>('editor-undo').disabled=!edit.canUndo;
    $('editor-craft').hidden=!selected||!!selected.uid;
    if(selected){const price=s.homestead.owned[selected.kind]?item!.price:0;$('editor-craft').textContent=price?`하나 더 만들기 · ${price}베리`:'첫 제작 무료';}
    $('editor-wallet').textContent=`${s.homestead.objects.length}/60개 배치 · ${s.berries.toLocaleString()}베리`;
    $('editor-view').setAttribute('aria-label',`3D 마을 배치 화면. ${selected?`${item!.name}, ${selected.column+1}열 ${selected.row+1}행. ${edit.error()||'여기에 놓을 수 있어요.'}`:'물건 선택 후 바닥을 누르세요.'}`);
    requestDraw();
  };
  const catalog=()=>{
    const blueprints=blueprintIds(s.exploration.solved.length),items=HOME_ITEMS.filter(i=>blueprints.includes(i.id)&&(h.full()||STARTER_BLUEPRINTS.includes(i.id))&&(category==='전체'||category===i.category));
    $('editor-items').innerHTML=items.map(i=>`<button data-editor-kind="${i.id}" class="editor-item" aria-label="${i.name} 고르기"><span>${i.icon}</span><b>${i.name}</b><small>${availableHome(s,i.id)?`보관 ${availableHome(s,i.id)}개`:s.homestead.owned[i.id]?`${i.price}베리로 제작`:'첫 제작 무료'}</small></button>`).join('');
    document.querySelectorAll<HTMLButtonElement>('[data-editor-kind]').forEach(b=>b.onclick=()=>{const kind=Number(b.dataset.editorKind);edit.choose(kind);focusSelection();if(!s.homestead.owned[kind]){const error=edit.craft(kind);if(error){message(error,true);updatePreview();return;}changed();message('첫 물건을 무료로 준비했어요! 놓을 칸을 고른 뒤 ‘여기에 놓기’를 누르세요.');return;}updatePreview();message(availableHome(s,kind)?'놓을 칸을 고른 뒤 ‘여기에 놓기’를 누르세요.':'이 물건은 모두 놓았어요. 하나 더 만들려면 아래의 베리 가격을 확인해 주세요.');});
  };
  const changed=()=>{h.changed();h.save();rebuild();catalog();updatePreview();};
  const place=()=>{const error=edit.place();if(error){message(error,true);updatePreview();return;}changed();message('놓았어요. 옮기려면 그 물건을 누르세요.');};
  const hit=(e:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();point.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(point,camera);const p=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());return p?homeCellAt(p.x,p.z):null;};
  let down:{x:number;y:number;uid:number|null}|null=null,dragged=false;
  renderer.domElement.onpointerdown=e=>{
    host.focus({preventScroll:true});hit(e);let uid:number|null=null;
    if(!edit.selection){const intersection=ray.intersectObjects(root.children,true)[0];let o:T.Object3D|undefined=intersection?.object;while(o&&o.parent!==root)o=o.parent??undefined;uid=o?.userData.uid??null;if(uid){edit.select(uid);focusSelection();updatePreview();}}
    down={x:e.clientX,y:e.clientY,uid};dragged=false;renderer.domElement.setPointerCapture(e.pointerId);
  };
  renderer.domElement.onpointermove=e=>{if(!edit.selection)return;if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)dragged=true;const p=hit(e);if(p&&(e.pointerType!=='touch'||down&&dragged)){edit.move(p.column,p.row);updatePreview();}};
  renderer.domElement.onpointerup=e=>{if(!down)return;const start=down;down=null;const p=hit(e);if(start.uid&&!dragged){message('바닥을 눌러 이동하거나 회전·보관을 선택하세요.');return;}if(edit.selection&&p){edit.move(p.column,p.row);if(e.pointerType==='touch'){updatePreview();message('초록색 칸을 확인하고 ‘여기에 놓기’를 누르세요.');}else place();}};
  renderer.domElement.onpointercancel=()=>{down=null;edit.cancel();updatePreview();message('이동을 취소했어요. 원래 물건은 그대로예요.');};
  $('editor-place').onclick=place;$('editor-rotate').onclick=()=>{edit.rotate();updatePreview();};$('editor-cancel').onclick=()=>{edit.cancel();updatePreview();message('선택을 해제했어요.');};
  $('editor-store').onclick=()=>{if(edit.store()){changed();message('보관했어요. 물건은 사라지지 않아요.');}};
  $('editor-undo').onclick=()=>{if(edit.undo()){changed();message('방금 변경을 되돌렸어요.');}};
  $('editor-craft').onclick=()=>{if(!edit.selection)return;const error=edit.craft(edit.selection.kind);if(!error)changed();message(error||'준비됐어요. 마을 바닥을 눌러 놓으세요.',!!error);};
  const nudge=(dx:number,dz:number)=>{const o=edit.selection;if(o){edit.move(Math.max(0,Math.min(11,o.column+dx)),Math.max(0,Math.min(11,o.row+dz)));updatePreview();}};
  document.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach(b=>b.onclick=()=>{const [x,z]=b.dataset.nudge!.split(',').map(Number);nudge(x,z);});
  host.onkeydown=e=>{const directions:Record<string,number[]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(directions[e.key]){e.preventDefault();nudge(...directions[e.key] as [number,number]);}if(e.key==='Enter'){e.preventDefault();place();}if(e.key.toLowerCase()==='r'){edit.rotate();updatePreview();}};
  $<HTMLSelectElement>('editor-category').onchange=e=>{category=(e.target as HTMLSelectElement).value;catalog();};
  $('editor-camera-left').onclick=()=>{angle-=Math.PI/4;resize();};$('editor-camera-right').onclick=()=>{angle+=Math.PI/4;resize();};$('editor-zoom-in').onclick=()=>{zoom=Math.min(1.8,zoom+.2);resize();};$('editor-zoom-out').onclick=()=>{zoom=Math.max(.8,zoom-.2);resize();};$('editor-fit').onclick=()=>{zoom=1;focus.set(0,0,0);angle=Math.PI/4;resize();};
  $('editor-back').onclick=()=>{edit.cancel();dispose();h.back();};$('editor-finish').onclick=()=>{edit.cancel();dispose();h.enter();};
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const observer=new MutationObserver(()=>{if(!host.isConnected||!dialog.open)dispose();});observer.observe(dialog,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();observer.disconnect();disposeGroup(root);if(ghost)disposeGroup(ghost,true);for(const o of [ground,lawn,grid,entry,mark]){o.geometry.dispose();}ownedMaterials.forEach(m=>m.dispose());(Array.isArray(grid.material)?grid.material:[grid.material]).forEach(m=>m.dispose());renderer.dispose();}
  rebuild();catalog();updatePreview();resize();
}
