export const SKYWARD_WEAPON_START=36,SKYWARD_OUTFIT_START=29,SKYWARD_PET_START=21,SKYWARD_RIDE_START=19;
export const SKYWARD_WEAPONS=[
 {name:'성운 초승달검',price:180000,bonus:86,multiplier:11.6,treePower:34,icon:'🌙',color:0x83cbbd},
 {name:'수정궤도 마법봉',price:180000,bonus:86,multiplier:11.6,treePower:34,icon:'🔮',color:0xa48bdd},
 {name:'은하깃 서약활',price:180000,bonus:86,multiplier:11.6,treePower:34,icon:'🏹',color:0x6fb8d2},
] as const;
export const SKYWARD_OUTFITS=[
 {name:'혜성 수호자의 갑옷',price:170000,color:0x325f68,accent:0xe4bf72,icon:'🛡️',desc:'초승달 견갑과 별빛 흉장이 빛나는 청록빛 갑옷',effect:'사냥 최대 체력 +20%. 길의 베리 +7, 문제 경험치 +12, 숲 완수 베리 +80. 꾸밈 강화는 외형을 바꿔요.',berryBonus:7,xpBonus:12,clearBonus:80},
 {name:'수정별 연회 예복',price:170000,color:0x7d659d,accent:0xf0dca1,icon:'🌠',desc:'겹겹이 흐르는 보랏빛 자락과 수정 왕관의 별빛 예복',effect:'사냥 최대 체력 +20%. 길의 베리 +7, 문제 경험치 +12, 숲 완수 베리 +80. 꾸밈 강화는 외형을 바꿔요.',berryBonus:7,xpBonus:12,clearBonus:80},
 {name:'은하바람 탐험복',price:170000,color:0x395c85,accent:0xf0d8a1,icon:'🧭',desc:'황금 고글과 날개깃 망토, 튼튼한 가방을 갖춘 탐험복',effect:'사냥 최대 체력 +20%. 길의 베리 +7, 문제 경험치 +12, 숲 완수 베리 +80. 꾸밈 강화는 외형을 바꿔요.',berryBonus:7,xpBonus:12,clearBonus:80},
] as const;
export const SKYWARD_PETS=[
 {name:'달꽃 유니콘 루나',price:65000,radius:18,flying:false,icon:'🦄',color:0xeadace,desc:'복숭아빛 갈기와 작은 금빛 뿔의 유니콘. 네 발로 사뿐사뿐 걸으며 18칸 안의 베리를 찾아요.'},
 {name:'수정숲 판다 토토',price:88000,radius:19.5,flying:false,icon:'🐼',color:0xd9e5d7,desc:'동그란 볼과 수정 가방을 가진 포근한 판다. 통통 걷고 눈을 깜빡이며 19.5칸 안의 베리를 찾아요.'},
 {name:'별우체부 그리핀 피코',price:125000,radius:21,flying:true,icon:'🦅',color:0xe8bd7b,desc:'폭신한 금빛 앞발과 오로라 날개, 편지 가방을 가진 전설 우체부. 날갯짓하며 21칸 안의 베리를 찾아요.'},
] as const;
export const SKYWARD_RIDES=[
 {name:'버섯집 달팽이',price:5500,speed:2.4,flying:false,riderY:1.625,icon:'🍄',color:0xd78369,desc:'작은 버섯 지붕에 올라타요. 더듬이를 살랑이며 숲길을 2.4배 빠르게 달려요.'},
 {name:'달토끼 마차',price:18000,speed:3.5,flying:false,riderY:.91,icon:'🐇',color:0xe8dfd2,desc:'달토끼가 끄는 금빛 바퀴의 마차. 토끼의 발걸음과 함께 땅 위를 3.5배 빠르게 달려요.'},
 {name:'수정날개 가오리',price:38000,speed:4.2,flying:true,riderY:.78,icon:'💎',color:0x72bcc9,desc:'보석 같은 날개를 천천히 펼치는 하늘 가오리. 물과 낮은 장애물 위를 4.2배 빠르게 날아요.'},
 {name:'은하별 기관차',price:65000,speed:4.8,flying:true,riderY:.88,icon:'🚂',color:0x405d86,desc:'황금 바퀴와 별빛 전조등의 작은 기관차. 구름 위의 별길을 4.8배 빠르게 달려요.'},
 {name:'오로라 수호룡',price:98000,speed:4.95,flying:true,riderY:1.21,icon:'🐉',color:0x87b8b4,desc:'부드러운 오로라 날개와 말랑한 별뿔을 가진 수호룡. 꼬리를 흔들며 4.95배 빠르게 날아요.'},
] as const;
export type SkywardKind='weapon'|'outfit'|'pet'|'ride';
export function skywardItem(kind:SkywardKind,id:number){const data={weapon:SKYWARD_WEAPONS,outfit:SKYWARD_OUTFITS,pet:SKYWARD_PETS,ride:SKYWARD_RIDES}[kind],start={weapon:36,outfit:29,pet:21,ride:19}[kind];return Number.isInteger(id)&&id>=start&&id<start+data.length?data[id-start]:undefined;}
export function skywardIcon(kind:SkywardKind,id:number){return skywardItem(kind,id)?'<img class="skyward-item-icon" src="'+(import.meta.env?.BASE_URL??'./')+'art/skyward-'+kind+'-'+id+'.svg" alt="" aria-hidden="true" width="64" height="64">':'';}
export function skywardShopBanner(kind:SkywardKind){const count={weapon:3,outfit:3,pet:3,ride:5}[kind];return '<section class="skyward-banner"><div><small>✦ 별너머 컬렉션</small><strong>새로운 '+({weapon:'무기',outfit:'의상',pet:'펫 친구',ride:'라이딩'}[kind])+' '+count+'종</strong></div><button id="skyward-featured" class="secondary">새 컬렉션 보기 <span aria-hidden="true">→</span></button></section>';}
/** Keep each group in catalogue order while surfacing the new group on selection. */
export function skywardShopOrder(kind:SkywardKind, selected:number, ids:number[]){
  if(!skywardItem(kind,selected))return ids;
  return [...ids.filter(id=>skywardItem(kind,id)),...ids.filter(id=>!skywardItem(kind,id))];
}
