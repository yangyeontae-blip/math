/** World 2 data is independent of rendering, persistence and any future server transport. */
export const WORLD_TWO_NAME='별너머 군도';
export const WORLD_TWO_LEVEL=60;
export const WORLD_TWO_BOSS_NAME='고대 별나무 수호자';
export const WORLD_TWO_REGIONS=[
 {id:0,name:'햇살바람 초원',level:60,icon:'🌼',description:'두 개의 해와 떠 있는 섬, 빛나는 우산꽃 아래에서 별등불을 밝혀요.',hp:2600,damage:30,berries:270,xp:162,bonus:3000,killGoal:6,enemyNames:{melee:'민들레 뭉치',charge:'도토리 돌격대',ranged:'바람씨앗 정령'}},
 {id:1,name:'수정물결 호수',level:80,icon:'💎',description:'고리 행성 아래의 청록빛 호수와 공중에 뜬 수정 사이를 탐험해요.',hp:5500,damage:38,berries:405,xp:252,bonus:4500,killGoal:6,enemyNames:{melee:'수정 조각이',charge:'물결 돌진이',ranged:'푸른방울 정령'}},
 {id:2,name:'별빛고리 유적',level:100,icon:'🌌',description:'보랏빛 외계 대지와 궤도 유적에서 별의 고리를 깨워요.',hp:9500,damage:46,berries:585,xp:360,bonus:6500,killGoal:6,enemyNames:{melee:'별돌 파수꾼',charge:'혜성 돌격대',ranged:'달그림자 정령'}},
 {id:3,name:'오로라 산호숲',level:120,icon:'🪸',description:'민트빛 산호 사이로 흐르는 오로라를 따라 별등불을 밝혀요.',hp:15000,damage:54,berries:650,xp:405,bonus:8500,killGoal:6,enemyNames:{melee:'오로라 산호 정령',charge:'물결발 순찰자',ranged:'연둣빛 별가루'}},
 {id:4,name:'황혼 운석 협곡',level:200,icon:'☄️',description:'금빛 운석과 불그스름한 암벽 사이, 떨어진 별들의 길을 찾아요.',hp:27000,damage:74,berries:850,xp:520,bonus:12000,killGoal:6,enemyNames:{melee:'운석 조각이',charge:'황혼바위 돌격대',ranged:'재빛 혜성 정령'}},
 {id:5,name:'은하 폭풍 성채',level:280,icon:'🏰',description:'빛의 기둥을 켜서 보랏빛 폭풍 너머 성운룡의 둥지를 열어요.',hp:42000,damage:96,berries:1050,xp:650,bonus:16000,killGoal:6,enemyNames:{melee:'폭풍 갑옷 정령',charge:'번개깃 파수꾼',ranged:'은하 구름술사'}},
 {id:6,name:'성운이끼 정원',level:350,icon:'🌿',description:'푸른 성운을 머금은 거대 이끼 사이에서 빛의 씨앗을 찾아요.',hp:55000,damage:108,berries:1200,xp:760,bonus:20000,killGoal:6,enemyNames:{melee:'성운이끼 정령',charge:'푸른별 돌격대',ranged:'안개씨앗 마법이'}},
 {id:7,name:'혜성유리 사막',level:400,icon:'🔮',description:'보랏빛 유리 모래와 떠오른 혜성 파편이 빛나는 외계 사막이에요.',hp:68000,damage:120,berries:1350,xp:880,bonus:24000,killGoal:6,enemyNames:{melee:'유리별 파수꾼',charge:'모래혜성 돌진이',ranged:'보라빛 수정술사'}},
 {id:8,name:'영원의 별바다',level:450,icon:'🌊',description:'공중에서 흐르는 별의 바다 위, 은빛 징검섬을 탐험해요.',hp:82000,damage:132,berries:1500,xp:1000,bonus:28000,killGoal:6,enemyNames:{melee:'별물결 정령',charge:'은빛물살 돌격대',ranged:'심해별 마법이'}},
 {id:9,name:'정령왕의 빛숲',level:500,icon:'🧚',description:'금빛 뿌리와 청록빛 별꽃이 피는 군도 가장 깊은 빛의 숲이에요.',hp:98000,damage:145,berries:1700,xp:1150,bonus:32000,killGoal:6,enemyNames:{melee:'빛뿌리 수호자',charge:'별꽃 사슴정령',ranged:'정령왕의 등불'}},
] as const;
export const WORLD_TWO_CORE_REGIONS = 3;
export const WORLD_TWO_BOSSES = {
  2: { region: 2, name: WORLD_TWO_BOSS_NAME, level: 100, hp: 90000, damage: 72, berries: 1500, xp: 1000, firstBerries: 20000, firstXp: 3000, dailySlot: 3 },
  5: { region: 5, name: '성운룡 아스트라', level: 300, hp: 260000, damage: 155, berries: 3100, xp: 1800, firstBerries: 35000, firstXp: 12000, dailySlot: 7 },
} as const;
export function worldTwoBoss(region:number) {
  return region === 2 || region === 5 ? WORLD_TWO_BOSSES[region] : undefined;
}
export const WORLD_TWO_BEACONS=[{x:-9,z:-14},{x:9,z:-14},{x:0,z:-17}] as const;
export const WORLD_TWO_GATE={x:17,z:-8} as const;
export type WorldTwoLocation={region:number;boss:boolean};
export type WorldTwoRegionProgress={beacons:number[];kills:number;claimed:boolean};
export type WorldTwoProgress={location:WorldTwoLocation|null;regions:WorldTwoRegionProgress[];bossWins:number;bossClaimed:boolean;bestBossSeconds:number|null;outerBoss:{wins:number;bestSeconds:number|null};totalBerries:number;totalXp:number;daily:{date:string;counts:number[]}};
const emptyRegion = (): WorldTwoRegionProgress => ({beacons:[],kills:0,claimed:false});
export const emptyWorldTwoDaily = (date = "") => ({date, counts:Array<number>(WORLD_TWO_REGIONS.length+2).fill(0)});
export function emptyWorldTwo():WorldTwoProgress {
  return {location:null,regions:WORLD_TWO_REGIONS.map(emptyRegion),bossWins:0,bossClaimed:false,bestBossSeconds:null,outerBoss:{wins:0,bestSeconds:null},totalBerries:0,totalXp:0,daily:emptyWorldTwoDaily()};
}
/** Expand the original v24 archipelago without shifting its guardian’s daily count. */
export function expandWorldTwoSave(value:unknown):unknown {
  let p = value as Partial<WorldTwoProgress> | null;
  if(p&&Array.isArray(p.regions)&&p.regions.length===6&&Array.isArray(p.daily?.counts)&&p.daily.counts.length===8&&p.outerBoss!==undefined)return {...p,regions:[...p.regions,...WORLD_TWO_REGIONS.slice(6).map(emptyRegion)],daily:{...p.daily,counts:[...p.daily.counts,0,0,0,0]}};
  if (!p || p.outerBoss !== undefined || !Array.isArray(p.regions) || p.regions.length !== 3 || !Array.isArray(p.daily?.counts) || p.daily.counts.length !== 4) return value;
  return {
    ...p,
    regions: [...p.regions, ...WORLD_TWO_REGIONS.slice(WORLD_TWO_CORE_REGIONS).map(emptyRegion)],
    outerBoss: {wins:0,bestSeconds:null},
    daily: {...p.daily,counts:[...p.daily.counts,...Array<number>(WORLD_TWO_REGIONS.length-2).fill(0)]},
  };
}
export function validWorldTwo(value:unknown):value is WorldTwoProgress {
  const p = value as WorldTwoProgress;
  const count = (v:unknown,max=1e9):v is number => Number.isSafeInteger(v) && Number(v)>=0 && Number(v)<=max;
  const best = (v:number|null,wins:number) => v===null || wins>0 && Number.isFinite(v) && v>0 && v<=1e8;
  if (!p || !Array.isArray(p.regions) || p.regions.length!==WORLD_TWO_REGIONS.length) return false;
  for (const [i,r] of p.regions.entries()) {
    if (!r || !Array.isArray(r.beacons) || r.beacons.some(b=>!count(b,2)) || new Set(r.beacons).size!==r.beacons.length || !count(r.kills) || typeof r.claimed!=="boolean") return false;
    if (r.claimed && (r.kills<WORLD_TWO_REGIONS[i].killGoal || r.beacons.length!==3)) return false;
    if (i>0 && (r.kills || r.beacons.length || r.claimed) && !p.regions[i-1].claimed) return false;
  }
  if (!count(p.bossWins) || p.bossClaimed!==(p.bossWins>0) || p.bossClaimed&&!p.regions[2].claimed || !best(p.bestBossSeconds,p.bossWins)) return false;
  if (!p.outerBoss || !count(p.outerBoss.wins) || p.outerBoss.wins>0&&!p.regions[5].claimed || !best(p.outerBoss.bestSeconds,p.outerBoss.wins)) return false;
  if (!count(p.totalBerries) || !count(p.totalXp) || !p.daily || typeof p.daily.date!=="string" || p.daily.date!==""&&!/^\d{4}-\d{2}-\d{2}$/.test(p.daily.date) || !Array.isArray(p.daily.counts) || p.daily.counts.length!==WORLD_TWO_REGIONS.length+2 || p.daily.counts.some(v=>!count(v))) return false;
  const location=p.location;
  return location===null || !!location && count(location.region,WORLD_TWO_REGIONS.length-1) && typeof location.boss==="boolean" && canEnterWorldTwo(p,Infinity,location.region,location.boss);
}
export function worldTwoRegionReady(p:WorldTwoProgress,id:number) {
  const r=p.regions[id];
  return !!r && r.kills>=WORLD_TWO_REGIONS[id].killGoal && r.beacons.length===3;
}
export function canEnterWorldTwo(p:WorldTwoProgress,level:number,id:number,boss=false,operator=false) {
  const region=WORLD_TWO_REGIONS[id];
  if (!Number.isInteger(id) || !region || !operator&&(!(level>=region.level) || id>0&&!p.regions[id-1]?.claimed)) return false;
  if (!boss) return true;
  const encounter=worldTwoBoss(id);
  return !!encounter && (operator || level>=encounter.level && p.regions[id].claimed);
}
export const WORLD_TWO_WEAPONS=Array.from({length:9},(_,i)=>{const region=Math.floor(i/3),style=i%3;return {name:[['햇살잎 대검','햇살꽃 지팡이','바람깃 활'],['수정물결 검','푸른호수 마법봉','수정시위 활'],['별빛고리 성검','은하수 현자봉','혜성날개 활']][region][style],price:30000+region*30000,bonus:86,multiplier:11.6,treePower:[19,24,30][region],icon:['⚔️','🔮','🏹'][style],color:[0xe9bd59,0x70c8db,0x9982da][region]};});
export const WORLD_TWO_OUTFITS=[
 {name:'별나무 수호 갑옷',price:120000,color:0x507e68,accent:0xf4d98d,desc:'금빛 잎 견갑과 별나무 왕관이 빛나는 수호자의 갑옷',effect:'사냥 최대 체력 +15%. 수학 보상 효과는 기존 최상위 의상과 같아요.',berryBonus:7,xpBonus:12,clearBonus:80},
 {name:'은하수 현자의 예복',price:120000,color:0x7771b4,accent:0xf5e2a3,desc:'별이 수놓인 긴 망토와 달빛 마법관',effect:'사냥 최대 체력 +15%. 수학 보상 효과는 기존 최상위 의상과 같아요.',berryBonus:7,xpBonus:12,clearBonus:80},
 {name:'혜성바람 순찰복',price:120000,color:0x537f98,accent:0xd9eee0,desc:'깃털 후드와 바람결 어깨 망토를 갖춘 순찰복',effect:'사냥 최대 체력 +15%. 수학 보상 효과는 기존 최상위 의상과 같아요.',berryBonus:7,xpBonus:12,clearBonus:80},
] as const;
/** IDs append to existing catalogs. Every job may use every reward. */
export function worldTwoEquipment(kind:'weapon'|'outfit',id:number){if(kind==='weapon'&&id>=27&&id<36)return {region:Math.floor((id-27)/3),boss:false,rarity:(id<33?'unique':'legendary') as 'unique'|'legendary'};if(kind==='outfit'&&id>=26&&id<29)return {region:2,boss:true,rarity:'legendary' as const};return null;}
export function worldTwoEquipmentSource(kind:'weapon'|'outfit',id:number){const item=worldTwoEquipment(kind,id);return item?item.boss?WORLD_TWO_BOSS_NAME+' 첫 승리 보상':WORLD_TWO_REGIONS[item.region].name+' 탐험 완수 보상':'';}
