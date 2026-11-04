/** World 2 data is independent of rendering, persistence and any future server transport. */
export const WORLD_TWO_NAME='별너머 군도';
export const WORLD_TWO_LEVEL=60;
export const WORLD_TWO_BOSS_NAME='고대 별나무 수호자';
export const WORLD_TWO_REGIONS=[
 {id:0,name:'햇살바람 초원',level:60,icon:'🌼',description:'두 개의 해와 떠 있는 섬, 빛나는 우산꽃 아래에서 별등불을 밝혀요.',hp:2600,damage:30,berries:300,xp:180,bonus:3000,killGoal:6,enemyNames:{melee:'민들레 뭉치',charge:'도토리 돌격대',ranged:'바람씨앗 정령'}},
 {id:1,name:'수정물결 호수',level:80,icon:'💎',description:'고리 행성 아래의 청록빛 호수와 공중에 뜬 수정 사이를 탐험해요.',hp:5500,damage:38,berries:450,xp:280,bonus:4500,killGoal:6,enemyNames:{melee:'수정 조각이',charge:'물결 돌진이',ranged:'푸른방울 정령'}},
 {id:2,name:'별빛고리 유적',level:100,icon:'🌌',description:'보랏빛 외계 대지와 궤도 유적에서 별의 고리를 깨워요.',hp:9500,damage:46,berries:650,xp:400,bonus:6500,killGoal:6,enemyNames:{melee:'별돌 파수꾼',charge:'혜성 돌격대',ranged:'달그림자 정령'}},
] as const;
export const WORLD_TWO_BEACONS=[{x:-9,z:-14},{x:9,z:-14},{x:0,z:-17}] as const;
export const WORLD_TWO_GATE={x:17,z:-8} as const;
export type WorldTwoLocation={region:number;boss:boolean};
export type WorldTwoRegionProgress={beacons:number[];kills:number;claimed:boolean};
export type WorldTwoProgress={location:WorldTwoLocation|null;regions:WorldTwoRegionProgress[];bossWins:number;bossClaimed:boolean;bestBossSeconds:number|null;totalBerries:number;totalXp:number;daily:{date:string;counts:number[]}};
export function emptyWorldTwo():WorldTwoProgress{return {location:null,regions:WORLD_TWO_REGIONS.map(()=>({beacons:[],kills:0,claimed:false})),bossWins:0,bossClaimed:false,bestBossSeconds:null,totalBerries:0,totalXp:0,daily:{date:'',counts:[0,0,0,0]}};}
export function validWorldTwo(value:unknown):value is WorldTwoProgress{const p=value as WorldTwoProgress;const n=(v:unknown,max=1e9):v is number=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=max;if(!p||!Array.isArray(p.regions)||p.regions.length!==3||p.regions.some((r,i)=>!r||!Array.isArray(r.beacons)||r.beacons.some(b=>!n(b,2))||new Set(r.beacons).size!==r.beacons.length||!n(r.kills)||typeof r.claimed!=='boolean'||r.claimed&&(r.kills<WORLD_TWO_REGIONS[i].killGoal||r.beacons.length!==3)||i>0&&(r.kills>0||r.beacons.length>0||r.claimed)&&!p.regions[i-1]?.claimed))return false;if(!n(p.bossWins)||typeof p.bossClaimed!=='boolean'||p.bossClaimed!==(p.bossWins>0)||p.bossClaimed&&!p.regions[2].claimed||p.bestBossSeconds!==null&&(!Number.isFinite(p.bestBossSeconds)||p.bestBossSeconds<=0||p.bestBossSeconds>1e8)||!p.bossClaimed&&p.bestBossSeconds!==null||!n(p.totalBerries)||!n(p.totalXp)||!p.daily||typeof p.daily.date!=='string'||p.daily.date!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(p.daily.date)||!Array.isArray(p.daily.counts)||p.daily.counts.length!==4||p.daily.counts.some(v=>!n(v)))return false;const l=p.location;return l===null||!!l&&n(l.region,2)&&typeof l.boss==='boolean'&&(!l.boss||l.region===2)&&(!l.region||p.regions[l.region-1].claimed)&&(!l.boss||p.regions[2].claimed);}
export function worldTwoRegionReady(p:WorldTwoProgress,id:number){const r=p.regions[id];return !!r&&r.kills>=WORLD_TWO_REGIONS[id].killGoal&&r.beacons.length===3;}
export function canEnterWorldTwo(p:WorldTwoProgress,level:number,id:number,boss=false){return Number.isInteger(id)&&!!WORLD_TWO_REGIONS[id]&&level>=WORLD_TWO_REGIONS[id].level&&(!id||p.regions[id-1].claimed)&&(!boss||id===2&&p.regions[2].claimed);}
export const WORLD_TWO_WEAPONS=Array.from({length:9},(_,i)=>{const region=Math.floor(i/3),style=i%3;return {name:[['햇살잎 대검','햇살꽃 지팡이','바람깃 활'],['수정물결 검','푸른호수 마법봉','수정시위 활'],['별빛고리 성검','은하수 현자봉','혜성날개 활']][region][style],price:30000+region*30000,bonus:86,multiplier:11.6,treePower:[19,24,30][region],icon:['⚔️','🔮','🏹'][style],color:[0xe9bd59,0x70c8db,0x9982da][region]};});
export const WORLD_TWO_OUTFITS=[
 {name:'별나무 수호 갑옷',price:120000,color:0x507e68,accent:0xf4d98d,desc:'금빛 잎 견갑과 별나무 왕관이 빛나는 수호자의 갑옷',effect:'사냥 최대 체력 +15%. 수학 보상 효과는 기존 최상위 의상과 같아요.',berryBonus:7,xpBonus:12,clearBonus:80},
 {name:'은하수 현자의 예복',price:120000,color:0x7771b4,accent:0xf5e2a3,desc:'별이 수놓인 긴 망토와 달빛 마법관',effect:'사냥 최대 체력 +15%. 수학 보상 효과는 기존 최상위 의상과 같아요.',berryBonus:7,xpBonus:12,clearBonus:80},
 {name:'혜성바람 순찰복',price:120000,color:0x537f98,accent:0xd9eee0,desc:'깃털 후드와 바람결 어깨 망토를 갖춘 순찰복',effect:'사냥 최대 체력 +15%. 수학 보상 효과는 기존 최상위 의상과 같아요.',berryBonus:7,xpBonus:12,clearBonus:80},
] as const;
/** IDs append to existing catalogs. Every job may use every reward. */
export function worldTwoEquipment(kind:'weapon'|'outfit',id:number){if(kind==='weapon'&&id>=27&&id<36)return {region:Math.floor((id-27)/3),boss:false,rarity:(id<33?'unique':'legendary') as 'unique'|'legendary'};if(kind==='outfit'&&id>=26&&id<29)return {region:2,boss:true,rarity:'legendary' as const};return null;}
export function worldTwoEquipmentSource(kind:'weapon'|'outfit',id:number){const item=worldTwoEquipment(kind,id);return item?item.boss?WORLD_TWO_BOSS_NAME+' 첫 승리 보상':WORLD_TWO_REGIONS[item.region].name+' 탐험 완수 보상':'';}
