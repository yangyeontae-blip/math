/** Stable appended inventory IDs; the first six reward potions never move. */
export const LEGACY_POTION_COUNT=6;
export const HUNT_RECOVERY_ITEMS=[
 {name:'도토리 쿠키',icon:'🍪',price:30,kind:'food',multiplier:1,durationMinutes:0,fraction:.4,durationSeconds:8,cooldownSeconds:25,desc:'8초 동안 최대 체력의 40%를 천천히 회복해요. 음식은 25초마다 먹어요.'},
 {name:'베리숲 샌드위치',icon:'🥪',price:80,kind:'food',multiplier:1,durationMinutes:0,fraction:.7,durationSeconds:10,cooldownSeconds:25,desc:'10초 동안 최대 체력의 70%를 천천히 회복해요. 음식은 25초마다 먹어요.'},
 {name:'새싹 회복물약',icon:'💚',price:45,kind:'health',multiplier:1,durationMinutes:0,fraction:.35,durationSeconds:0,cooldownSeconds:12,desc:'최대 체력의 35%를 즉시 회복해요. 회복물약은 12초마다 써요.'},
 {name:'별빛 회복물약',icon:'❤️',price:120,kind:'health',multiplier:1,durationMinutes:0,fraction:.65,durationSeconds:0,cooldownSeconds:12,desc:'최대 체력의 65%를 즉시 회복해요. 회복물약은 12초마다 써요.'},
] as const;
export type SupplyKind='food'|'health';
export type SupplyUseResult={used:true;healed:number}|{used:false;reason:'full'|'cooldown'|'practice'|'location'|'invalid'};
export function huntingSupply(id:number){return Number.isInteger(id)&&id>=LEGACY_POTION_COUNT?HUNT_RECOVERY_ITEMS[id-LEGACY_POTION_COUNT]:undefined;}
export function supplyFailure(reason:Exclude<SupplyUseResult,{used:true}>['reason']){return {full:'체력이 이미 가득해요. 소모품은 그대로예요.',cooldown:'아직 재사용 대기 중이에요. 소모품은 그대로예요.',practice:'수련에서는 보급품을 쓰지 않아요.',location:'사냥터에서 게임을 진행할 때 사용할 수 있어요.',invalid:'없는 보급품이에요.'}[reason];}
