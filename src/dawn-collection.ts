export const DAWN_START={weapon:42,outfit:32,pet:24,ride:24} as const;
export const DAWN_WEAPONS=[
 {name:'태양서약 장검',price:240000,bonus:94,multiplier:12.4,treePower:40,icon:'☀️',color:0xe7b86a},
 {name:'별노래 크리스털 하프',price:240000,bonus:94,multiplier:12.4,treePower:40,icon:'🎵',color:0xda9dbb},
 {name:'새벽깃 날개활',price:240000,bonus:94,multiplier:12.4,treePower:40,icon:'🏹',color:0x85bfc5},
] as const;
export const DAWN_OUTFITS=[
 {name:'태양서약 기사 예복',price:210000,color:0x355868,accent:0xe7c781,icon:'☀️',desc:'금빛 태양 견갑과 짙은 청록 망토의 기사 예복',effect:'사냥 최대 체력 +25%. 길의 베리 +8, 문제 경험치 +14, 숲 완수 베리 +90. 꾸밈 강화는 외형을 바꿔요.',berryBonus:8,xpBonus:14,clearBonus:90},
 {name:'별노래 공연 의상',price:210000,color:0xa76688,accent:0xf3dbac,icon:'🎼',desc:'꽃잎 소매와 오선보 망토, 금빛 음표 브로치의 공연 의상',effect:'사냥 최대 체력 +25%. 길의 베리 +8, 문제 경험치 +14, 숲 완수 베리 +90. 꾸밈 강화는 외형을 바꿔요.',berryBonus:8,xpBonus:14,clearBonus:90},
 {name:'새벽바람 탐험 망토',price:210000,color:0x527d79,accent:0xe5ca9c,icon:'🪶',desc:'은빛 날개깃과 반달 머리장식으로 완성한 새벽 탐험복',effect:'사냥 최대 체력 +25%. 길의 베리 +8, 문제 경험치 +14, 숲 완수 베리 +90. 꾸밈 강화는 외형을 바꿔요.',berryBonus:8,xpBonus:14,clearBonus:90},
] as const;
export const DAWN_PETS=[
 {name:'별노래 아기여우 미오',price:110000,radius:20,flying:false,icon:'🦊',color:0xeab28c,desc:'크림빛 볼과 커다란 귀, 별 모양 꼬리를 가진 아기여우. 네 발로 사뿐히 걸으며 20칸 안의 베리를 찾아요.'},
 {name:'새벽구름 아기고래 포롱',price:135000,radius:21,flying:true,icon:'🐳',color:0x9ecdd8,desc:'구름 지느러미와 금빛 별을 달고 둥실 떠다니는 아기고래. 21칸 안의 베리를 찾아요. 뽀짝이의 전용 전설 효과는 없어요.'},
] as const;
export const DAWN_RIDES=[
 {name:'새벽꽃 사슴 마차',price:35000,speed:4.4,flying:false,riderY:1.03,icon:'🦌',color:0xc39778,desc:'꽃잎 뿔과 금빛 안장을 갖춘 사슴을 타요. 네 발로 땅 위를 4.4배 빠르게 달려요.'},
 {name:'별노래 하늘배',price:120000,speed:4.95,flying:true,riderY:1.08,icon:'⛵',color:0x748fbe,desc:'초승달 선체와 별빛 돛을 펼친 작은 하늘배. 물과 낮은 장애물 위를 4.95배 빠르게 날아요.'},
] as const;
export type DawnKind=keyof typeof DAWN_START;
export function dawnItem(kind:DawnKind,id:number){const data={weapon:DAWN_WEAPONS,outfit:DAWN_OUTFITS,pet:DAWN_PETS,ride:DAWN_RIDES}[kind];return Number.isInteger(id)&&id>=DAWN_START[kind]&&id<DAWN_START[kind]+data.length?data[id-DAWN_START[kind]]:undefined;}
export function dawnIcon(kind:DawnKind,id:number){return dawnItem(kind,id)?'<img class="skyward-item-icon dawn-item-icon" src="'+(import.meta.env?.BASE_URL??'./')+'art/berry-items-v3/'+kind+'-'+id+'.webp" alt="" aria-hidden="true" width="72" height="72">':'';}
export function dawnShopBanner(kind:DawnKind){const count={weapon:3,outfit:3,pet:2,ride:2}[kind];return '<section class="dawn-banner"><div class="dawn-banner-sun" aria-hidden="true">✺</div><div><span class="dawn-eyebrow">NEW COLLECTION · 새벽서약</span><h3>숲이 깨어나는 순간</h3><p>금빛 햇살, 별의 선율. 새로운 '+({weapon:'무기',outfit:'의상',pet:'펫',ride:'라이딩'}[kind])+' '+count+'종을 만나 보세요.</p><button id="dawn-featured" class="secondary">새벽서약 컬렉션 보기 <span aria-hidden="true">↗</span></button></div></section>';}
export function dawnShopOrder(kind:DawnKind,selected:number,ids:number[]){return dawnItem(kind,selected)?[...ids.filter(id=>dawnItem(kind,id)),...ids.filter(id=>!dawnItem(kind,id))]:ids;}
