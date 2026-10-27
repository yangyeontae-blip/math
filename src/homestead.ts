import type { Save } from './rules';

export const HOME_SIZE = 12, HOME_LIMIT = 60;
export const STARTER_BLUEPRINTS = [0, 1, 3, 6, 18, 21];
export const HOME_ITEMS = [
  ['흙길','🟫','길·울타리',1,1,false,false], ['돌길','🪨','길·울타리',1,1,false,false], ['나무 데크','🪵','길·울타리',2,1,false,false],
  ['꽃울타리','🌸','길·울타리',2,1,true,false], ['나무 울타리','🪵','길·울타리',2,1,true,false], ['작은 문','🚪','길·울타리',1,1,false,false],
  ['딸기꽃밭','🍓','식물',1,1,false,false], ['해바라기밭','🌻','식물',1,1,false,false], ['라벤더밭','🪻','식물',1,1,false,false],
  ['버섯 화단','🍄','식물',1,1,false,false], ['둥근 나무','🌳','식물',1,1,true,false], ['열매나무','🍎','식물',1,1,true,false],
  ['분수','⛲','생활 시설',2,2,true,true], ['쉼터','🏡','생활 시설',2,2,true,true], ['소풍 식탁','🧺','생활 시설',2,1,true,true],
  ['펫 놀이터','🐾','생활 시설',2,2,true,true], ['작은 온실','🌱','생활 시설',2,2,true,true], ['물레방아','💧','생활 시설',2,2,true,true],
  ['벤치','🪑','장식',2,1,true,true], ['가로등','🏮','장식',1,1,true,false], ['우체통','📮','장식',1,1,true,true],
  ['표지판','🪧','장식',1,1,true,false], ['풍차','🌬️','장식',2,2,true,false], ['꽃아치','🌈','장식',2,1,false,false],
].map(([name,icon,category,w,h,solid,interactive],id) => ({ id, name:name as string, icon:icon as string, category:category as string, w:w as number, h:h as number, solid:solid as boolean, interactive:interactive as boolean, price: (w as number)*(h as number) === 1 ? 10 : (w as number)*(h as number) === 2 ? 20 : 40 }));
export interface HomeObject { uid: number; kind: number; column: number; row: number; rotation: number }
export interface Homestead { inside: boolean; position: {x:number;z:number}; owned: number[]; objects: HomeObject[]; nextId: number; memories: number[] }
export const emptyHomestead = (): Homestead => ({inside:false,position:{x:0,z:12},owned:Array(24).fill(0),objects:[],nextId:1,memories:[]});
export function blueprintIds(discoveries: number) { return [...STARTER_BLUEPRINTS, ...(discoveries>=3?[2,4,5,7,8,19]:[]), ...(discoveries>=6?[9,10,12,13,14,20]:[]), ...(discoveries>=10?[11,15,16,17,22,23]:[])]; }
export function availableHome(s: Save, kind: number) { return (s.homestead.owned[kind]??0)-s.homestead.objects.filter(o=>o.kind===kind).length; }
export function objectCells(o: HomeObject) { const item=HOME_ITEMS[o.kind], w=o.rotation%2?item.h:item.w,h=o.rotation%2?item.w:item.h;return Array.from({length:w*h},(_,i)=>({column:o.column+i%w,row:o.row+Math.floor(i/w)})); }
const key=(c:number,r:number)=>r*HOME_SIZE+c;
export function homeReachable(objects: HomeObject[]) {
  const blocked=new Set(objects.filter(o=>HOME_ITEMS[o.kind].solid).flatMap(o=>objectCells(o).map(c=>key(c.column,c.row))));
  const reached=new Set<number>(),queue=[key(5,11),key(6,11)];
  for(let i=0;i<queue.length;i++){const k=queue[i];if(reached.has(k)||blocked.has(k))continue;reached.add(k);const c=k%12,r=Math.floor(k/12);for(const [x,y] of [[c-1,r],[c+1,r],[c,r-1],[c,r+1]])if(x>=0&&x<12&&y>=0&&y<12&&!reached.has(key(x,y)))queue.push(key(x,y));}
  return reached;
}
export function homeRoute(objects: HomeObject[], from: number, to: number): number[] {
  const blocked=new Set(objects.filter(o=>HOME_ITEMS[o.kind].solid).flatMap(o=>objectCells(o).map(c=>key(c.column,c.row))));
  const queue=[from],prev=new Map<number,number>([[from,-1]]);
  for(let i=0;i<queue.length;i++){const k=queue[i];if(k===to){const path=[];for(let n=to;n!==-1;n=prev.get(n)!)path.push(n);return path.reverse();}const c=k%12,r=Math.floor(k/12);for(const [x,y] of [[c-1,r],[c+1,r],[c,r-1],[c,r+1]]){const n=key(x,y);if(x>=0&&x<12&&y>=0&&y<12&&!blocked.has(n)&&!prev.has(n)){prev.set(n,k);queue.push(n);}}}return[];
}
export function layoutError(objects: HomeObject[]) {
  if(objects.length>HOME_LIMIT)return '마을에는 60개까지 놓을 수 있어요.';
  const occupied=new Set<number>();
  for(const o of objects)for(const c of objectCells(o)) {if(c.column<0||c.column>=12||c.row<0||c.row>=12)return '마을 경계 밖에는 놓을 수 없어요.';const k=key(c.column,c.row);if(occupied.has(k))return '다른 물건과 겹쳐요.';if(c.row===11&&(c.column===5||c.column===6))return '입구 두 칸은 비워 주세요.';occupied.add(k);}
  const reached=homeReachable(objects);
  for(const o of objects.filter(o=>HOME_ITEMS[o.kind].interactive)) {
    if(!objectCells(o).some(c=>[[c.column-1,c.row],[c.column+1,c.row],[c.column,c.row-1],[c.column,c.row+1]].some(([x,y])=>x>=0&&x<12&&y>=0&&y<12&&reached.has(key(x,y)))))return '입구에서 시설까지 걸어갈 길을 남겨 주세요.';
  }return '';
}
export function craftHome(s: Save, kind: number, full: boolean) {
  if(!Number.isInteger(kind)||!HOME_ITEMS[kind])return '없는 제작물이에요.';
  if(!blueprintIds(s.exploration.solved.length).includes(kind))return '숲의 발견을 모아 도안을 열어 주세요.';
  if(!full&&!STARTER_BLUEPRINTS.includes(kind))return '완전판에서 만드는 도안이에요.';
  if(s.homestead.owned[kind]>=240)return '이 물건은 충분히 보유하고 있어요.';
  const price=s.homestead.owned[kind]===0?0:HOME_ITEMS[kind].price;
  if(s.berries<price)return `베리 ${price}개가 필요해요.`;
  s.berries-=price;s.homestead.owned[kind]++;return '';
}
export function placeHome(s: Save,kind:number,column:number,row:number,rotation:number,full:boolean,uid?:number) {
  if(![kind,column,row,rotation].every(Number.isSafeInteger)||!HOME_ITEMS[kind]||rotation<0||rotation>3)return '배치 위치를 다시 골라 주세요.';
  const old=uid===undefined?undefined:s.homestead.objects.find(o=>o.uid===uid);
  if(uid!==undefined&&(!old||old.kind!==kind))return '옮길 물건을 다시 골라 주세요.';
  if(!full&&!STARTER_BLUEPRINTS.includes(kind))return '완전판에서 배치하는 물건이에요.';
  if(!old&&availableHome(s,kind)<=0)return '먼저 이 물건을 만들어 주세요.';
  const next=s.homestead.objects.filter(o=>o.uid!==uid),object={uid:uid??s.homestead.nextId,kind,column,row,rotation};next.push(object);
  const error=layoutError(next);if(error)return error;
  s.homestead.objects=next;if(!old)s.homestead.nextId++;return '';
}
/** 한 번에 꾸미기: 예쁘게 짜 둔 정원 배치. 열린 도안만, 원래 제작·배치 규칙 그대로 놓아요. */
type PresetItem = { kind: number; column: number; row: number; rotation: number };
const at = (kind: number, cells: [number, number][], rotation = 0): PresetItem[] => cells.map(([column, row]) => ({ kind, column, row, rotation }));
const span = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
export const GARDEN_PRESETS = [
  { id: 'flower', name: '꽃길 정원', icon: '🌸', note: '돌길 따라 딸기꽃이 피는 정원', items: [
    ...at(1, span(3, 10).flatMap(r => [[5, r], [6, r]] as [number, number][])),
    ...at(6, span(4, 10).flatMap(r => [[4, r], [7, r]] as [number, number][])),
    ...at(3, [[1, 2], [3, 2], [7, 2], [9, 2]]), ...at(21, [[5, 2]]), ...at(18, [[2, 6], [8, 6]]),
  ] },
  { id: 'pond', name: '연못 쉼터', icon: '⛲', note: '분수 둘레에 라벤더와 가로등', items: [
    ...at(23, [[5, 10]]), ...at(2, [[5, 9], [5, 8], [5, 7]]), ...at(12, [[5, 5]]),
    ...at(8, [[4, 4], [4, 5], [4, 6], [7, 4], [7, 5], [7, 6], [5, 4], [6, 4]]), ...at(18, [[2, 6], [8, 6]]),
    ...at(19, [[3, 8], [8, 8], [3, 3], [8, 3]]), ...at(10, [[1, 1], [10, 1], [1, 9], [10, 9], [1, 5], [10, 5]]),
  ] },
  { id: 'orchard', name: '과수원 소풍', icon: '🍎', note: '열매나무 아래 소풍과 풍차', items: [
    ...at(0, span(5, 10).flatMap(r => [[5, r], [6, r]] as [number, number][])), ...at(14, [[5, 4]]),
    ...at(11, [[1, 1], [3, 1], [8, 1], [10, 1], [1, 3], [3, 3], [8, 3], [10, 3]]), ...at(7, span(6, 9).flatMap(r => [[3, r], [8, r]] as [number, number][])),
    ...at(22, [[0, 8]]), ...at(17, [[10, 7]]), ...at(4, [[0, 11], [2, 11], [8, 11], [10, 11]]),
  ] },
] as const;
/** 테마에 필요한 도안 중 지금 쓸 수 있는 수. */
export function presetReady(s: Save, id: string, full: boolean) {
  const p = GARDEN_PRESETS.find(x => x.id === id); if (!p) return { usable: 0, total: 0 };
  const open = blueprintIds(s.exploration.solved.length), kinds = [...new Set(p.items.map(i => i.kind))];
  return { usable: kinds.filter(k => open.includes(k) && (full || STARTER_BLUEPRINTS.includes(k))).length, total: kinds.length };
}
export function applyGardenPreset(s: Save, id: string, full: boolean) {
  const p = GARDEN_PRESETS.find(x => x.id === id); let placed = 0, skipped = 0, short = false, spent = 0;
  if (!p) return { placed, skipped, short, spent };
  const open = blueprintIds(s.exploration.solved.length);
  for (const it of p.items) {
    if (!open.includes(it.kind) || (!full && !STARTER_BLUEPRINTS.includes(it.kind))) { skipped++; continue; }
    if (availableHome(s, it.kind) <= 0) { const before = s.berries, error = craftHome(s, it.kind, full); if (error) { skipped++; if (error.startsWith('베리')) short = true; continue; } spent += before - s.berries; }
    if (placeHome(s, it.kind, it.column, it.row, it.rotation, full)) skipped++; else placed++;
  }
  return { placed, skipped, short, spent };
}
export function storeHome(s: Save,uid:number) { const index=s.homestead.objects.findIndex(o=>o.uid===uid);if(index<0)return false;s.homestead.objects.splice(index,1);return true; }
export const HOME_REQUESTS = [
  {title:'꽃을 보며 쉬고 싶어요',icon:'🌸',needs:[[6,7,8,9],[18]],memory:'꽃향기 속 첫 인사',line:'네가 만든 꽃밭 옆에서 쉬니 정말 포근해!'},
  {title:'처음 오는 친구를 위한 길',icon:'🪧',needs:[[0,1,2],[21]],memory:'우리 마을 길잡이',line:'표지판을 보고 찾아왔어. 네가 만든 길을 함께 걸어 보자!'},
  {title:'쉬어 갈 작은 집',icon:'🏡',needs:[[13],[18]],memory:'한낮의 쉼터',line:'쉼터와 벤치가 있어 오래 머물고 싶어졌어.'},
  {title:'나무 아래 소풍',icon:'🧺',needs:[[14],[10,11]],memory:'나무 그늘 소풍',line:'나무 아래 식탁에서 함께 소풍하니 즐거워!'},
  {title:'펫 친구의 놀이터',icon:'🐾',needs:[[15],[6,7,8,9]],memory:'꽃밭을 달리는 친구',line:'펫 친구도 꽃 옆 놀이터가 마음에 드나 봐!'},
  {title:'물이 흐르는 정원',icon:'💧',needs:[[12],[17]],memory:'물소리 정원',line:'분수와 물레방아 소리를 들으니 숲에 온 것 같아.'},
] as const;
export function requestReady(s: Save,id:number){const q=HOME_REQUESTS[id];return !!q&&q.needs.every(group=>s.homestead.objects.some(o=>(group as readonly number[]).includes(o.kind)));}
export function claimHomeMemory(s:Save,id:number){if(!Number.isInteger(id)||s.homestead.memories.includes(id)||!requestReady(s,id))return false;s.homestead.memories.push(id);return true;}
export function visitorTargets(s:Save){const reached=homeReachable(s.homestead.objects);return s.homestead.objects.filter(o=>HOME_ITEMS[o.kind].interactive||o.kind>=6&&o.kind<=11).flatMap(o=>{const cells=objectCells(o),own=new Set(cells.map(c=>key(c.column,c.row))),adjacent=cells.flatMap(c=>[[c.column-1,c.row],[c.column+1,c.row],[c.column,c.row-1],[c.column,c.row+1]]).filter(([x,y])=>x>=0&&x<12&&y>=0&&y<12&&reached.has(key(x,y))&&!own.has(key(x,y)));return [...new Set(adjacent.map(([x,y])=>key(x,y)))].map(cell=>({uid:o.uid,kind:o.kind,cell}));});}
export function validHomestead(value:unknown):value is Homestead {
  if(!value||typeof value!=='object')return false;const h=value as Homestead,int=(n:unknown,max:number)=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=max;
  if(typeof h.inside!=='boolean'||!h.position||![h.position.x,h.position.z].every(n=>Number.isFinite(n)&&Math.abs(n)<=13)||!Array.isArray(h.owned)||h.owned.length!==24||!h.owned.every(n=>int(n,240))||!int(h.nextId,1e9)||h.nextId<1||!Array.isArray(h.objects)||h.objects.length>60||!Array.isArray(h.memories)||!h.memories.every(n=>int(n,5))||new Set(h.memories).size!==h.memories.length)return false;
  if(!h.objects.every(o=>o&&int(o.uid,h.nextId-1)&&o.uid>0&&int(o.kind,23)&&int(o.column,11)&&int(o.row,11)&&int(o.rotation,3))||new Set(h.objects.map(o=>o.uid)).size!==h.objects.length)return false;
  return !layoutError(h.objects)&&h.owned.every((n,id)=>n>=h.objects.filter(o=>o.kind===id).length);
}
