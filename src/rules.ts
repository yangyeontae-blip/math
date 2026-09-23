import { stageBerries, stageMonsters, stageTrees, stageSize, berryValue, clearBonus } from './stages';
export const WEAPONS = [
  { name: '새싹 나무검', price: 0, bonus: 0, multiplier: 1, treePower: 1, icon: '🌱', color: 0x96bf6a },
  { name: '도토리 망치', price: 80, bonus: 2, multiplier: 1.2, treePower: 2, icon: '🔨', color: 0xbf8c52 },
  { name: '달빛 부채', price: 180, bonus: 4, multiplier: 1.5, treePower: 2, icon: '🌙', color: 0xa0b9f7 },
  { name: '별꽃 지팡이', price: 360, bonus: 6, multiplier: 2, treePower: 3, icon: '✨', color: 0xf4d66a },
  { name: '복숭아 단검', price: 480, bonus: 7, multiplier: 2.2, treePower: 3, icon: '🍑', color: 0xf49aaa },
  { name: '꿀벌 황금도끼', price: 620, bonus: 8, multiplier: 2.5, treePower: 4, icon: '🐝', color: 0xf0b52f },
  { name: '무지개 물뿌리개', price: 780, bonus: 10, multiplier: 2.8, treePower: 4, icon: '🌈', color: 0x72cbd4 },
  { name: '왕별 숲지팡이', price: 980, bonus: 12, multiplier: 3.2, treePower: 5, icon: '⭐', color: 0xffd95a },
  { name: '딸기잼 국자', price: 1180, bonus: 14, multiplier: 3.5, treePower: 5, icon: '🍓', color: 0xe9657b },
  { name: '구름양 대검', price: 1420, bonus: 16, multiplier: 3.8, treePower: 6, icon: '🐑', color: 0xeaf4ff },
  { name: '개구리 연잎창', price: 1680, bonus: 18, multiplier: 4.2, treePower: 6, icon: '🐸', color: 0x6abf72 },
  { name: '별사탕 왕홀', price: 2000, bonus: 21, multiplier: 4.6, treePower: 7, icon: '🍬', color: 0xc79bea },
] as const;
export const OUTFITS = [
  { name: '새싹 탐험복', price: 0, color: 0x4d9c78, accent: 0xffe4a3, desc: '처음 떠나는 모험의 설렘', effect: '추가 효과가 없는 기본 옷이에요.', berryBonus: 0, xpBonus: 0, clearBonus: 0 },
  { name: '색동 저고리', price: 40, color: 0xf08c9f, accent: 0x79c9d0, desc: '알록달록 소매와 고운 옷고름', effect: '길의 베리 1개를 주울 때마다 1베리를 더 받아요.', berryBonus: 1, xpBonus: 0, clearBonus: 0 },
  { name: '숲속 망토', price: 60, color: 0x267e68, accent: 0xc8df85, desc: '숲의 색을 닮은 포근한 망토', effect: '몬스터 1마리를 이길 때마다 경험치를 2 더 받아요.', berryBonus: 0, xpBonus: 2, clearBonus: 0 },
  { name: '구름 도포', price: 80, color: 0x79b5e2, accent: 0xf2f6ff, desc: '파란 하늘 아래 가벼운 발걸음', effect: '길의 베리 1개를 주울 때마다 2베리를 더 받아요.', berryBonus: 2, xpBonus: 0, clearBonus: 0 },
  { name: '꽃 도포', price: 100, color: 0xd77cba, accent: 0xffdf99, desc: '봄꽃처럼 화사한 긴 옷자락', effect: '한 스테이지의 몬스터를 모두 이기면 통과 보상에 20베리가 더해져요.', berryBonus: 0, xpBonus: 0, clearBonus: 20 },
  { name: '별빛 마법사복', price: 140, color: 0x7761b3, accent: 0xf6d36e, desc: '작은 별이 머무는 마법사의 옷', effect: '몬스터 1마리를 이길 때마다 경험치를 4 더 받아요.', berryBonus: 0, xpBonus: 4, clearBonus: 0 },
  { name: '달빛 무사복', price: 180, color: 0x405b8c, accent: 0xcbe4ee, desc: '은빛 옷깃이 빛나는 의상', effect: '길의 베리 1개를 주울 때마다 3베리를 더 받아요.', berryBonus: 3, xpBonus: 0, clearBonus: 0 },
  { name: '왕실 꽃비단', price: 240, color: 0xeab356, accent: 0xf9f0d5, desc: '금빛 비단과 풍성한 꽃장식', effect: '몬스터마다 경험치 +2, 스테이지를 통과하면 베리 +35를 받아요.', berryBonus: 0, xpBonus: 2, clearBonus: 35 },
  { name: '딸기 농장 멜빵', price: 280, color: 0x6ea6d9, accent: 0xf55f74, desc: '주머니에 딸기를 담는 포근한 멜빵', effect: '길의 베리 1개를 주울 때마다 4베리를 더 받아요.', berryBonus: 4, xpBonus: 0, clearBonus: 0 },
  { name: '노랑 오리 우비', price: 320, color: 0xf2c94c, accent: 0xfff4ad, desc: '빗방울도 신나는 통통한 우비', effect: '한 스테이지의 몬스터를 모두 이기면 통과 보상에 45베리가 더해져요.', berryBonus: 0, xpBonus: 0, clearBonus: 45 },
  { name: '토끼 귀 소풍복', price: 390, color: 0xe7a5c4, accent: 0xfff2f7, desc: '긴 토끼 귀와 보송한 꼬리가 달린 옷', effect: '몬스터 1마리를 이길 때마다 경험치를 6 더 받아요.', berryBonus: 0, xpBonus: 6, clearBonus: 0 },
  { name: '도토리 숲지기', price: 480, color: 0x9b7448, accent: 0xd8bb71, desc: '도토리 모자와 나뭇잎 가방 세트', effect: '길의 베리마다 +2, 스테이지를 통과하면 베리 +30을 받아요.', berryBonus: 2, xpBonus: 0, clearBonus: 30 },
  { name: '고양이 카페 앞치마', price: 560, color: 0x8d7f9f, accent: 0xffd9df, desc: '고양이 귀와 리본 주머니가 달린 앞치마', effect: '길의 베리마다 +3, 몬스터마다 경험치 +3을 받아요.', berryBonus: 3, xpBonus: 3, clearBonus: 0 },
  { name: '구름양 잠옷', price: 660, color: 0xb9d9eb, accent: 0xffffff, desc: '몽글몽글 양 귀와 구름 단추가 달린 옷', effect: '몬스터 1마리를 이길 때마다 경험치를 8 더 받아요.', berryBonus: 0, xpBonus: 8, clearBonus: 0 },
  { name: '개구리 연잎옷', price: 780, color: 0x70b978, accent: 0xd8f28c, desc: '동그란 눈과 연잎 망토가 귀여운 옷', effect: '길의 베리 1개를 주울 때마다 5베리를 더 받아요.', berryBonus: 5, xpBonus: 0, clearBonus: 0 },
  { name: '별사탕 요정복', price: 920, color: 0xb78ed3, accent: 0xffe083, desc: '별 날개와 사탕빛 리본이 반짝이는 옷', effect: '몬스터마다 경험치 +5, 스테이지를 통과하면 베리 +50을 받아요.', berryBonus: 0, xpBonus: 5, clearBonus: 50 },
] as const;
export const CHARACTERS = [
  { name: '봄이', desc: '동글동글 양 갈래', hair: 0x623d2e, skin: 0xffd8b1, style: 0 },
  { name: '하루', desc: '씩씩한 밤톨 머리', hair: 0x3d303a, skin: 0xf1bc91, style: 1 },
  { name: '여울', desc: '은빛 단발 머리', hair: 0xe5ddca, skin: 0xffdebe, style: 2 },
  { name: '나루', desc: '폭신한 곱슬 머리', hair: 0x946544, skin: 0xc68e6c, style: 3 },
] as const;
export const MONSTERS = [
  { name: '새싹 슬라임', icon: '🌱', berry: 8, xp: 10, score: 10, color: 0x91d975 },
  { name: '버섯 요정', icon: '🍄', berry: 10, xp: 12, score: 15, color: 0xf493a6 },
  { name: '구름 토끼', icon: '☁️', berry: 12, xp: 15, score: 20, color: 0xeaf4fc },
  { name: '도토리 정령', icon: '🌰', berry: 15, xp: 20, score: 25, color: 0xd3aa74 },
] as const;
export const RIDES = [
  { name: '당근 씽씽카', price: 1000, speed: 1.6, flying: false, icon: '🥕', color: 0xf39a58, desc: '당근 바퀴로 통통 달리는 첫 라이딩' },
  { name: '구름양 포포', price: 1800, speed: 1.85, flying: false, icon: '🐑', color: 0xd9eff7, desc: '폭신한 털을 흔들며 빠르게 달려요' },
  { name: '도토리 붕붕이', price: 2800, speed: 2.1, flying: false, icon: '🌰', color: 0xb98352, desc: '도토리 바퀴가 씩씩하게 숲길을 달려요' },
  { name: '무지개 사슴', price: 4000, speed: 2.35, flying: false, icon: '🦌', color: 0x82cfb2, desc: '무지개 발자국을 남기는 빠른 사슴' },
  { name: '별빛 페가수스', price: 5000, speed: 2.55, flying: true, icon: '🪽', color: 0xc9b5ef, desc: '반짝이는 날개로 물과 장애물 위를 날아요' },
  { name: '솜사탕 열기구', price: 6500, speed: 2.75, flying: true, icon: '🎈', color: 0xf2a9cf, desc: '달콤한 구름을 타고 하늘을 둥실 날아요' },
  { name: '달빛 아기용', price: 8000, speed: 3, flying: true, icon: '🐉', color: 0x7898d8, desc: '달빛 꼬리를 그리며 아주 빠르게 날아요' },
  { name: '오로라 고래', price: 10000, speed: 3.25, flying: true, icon: '🐳', color: 0x65b9d8, desc: '오로라 물결을 헤치며 가장 빠르게 날아요' },
] as const;
export const PLAYER_MOVE_SPEED = 8.45;
export function petChaseSpeed(rideSpeed: number) { return Math.max(12, PLAYER_MOVE_SPEED * rideSpeed * 1.2); }
export const PETS = [
  { name: '딸기 햄찌', price: 400, radius: 2.8, icon: '🐹', color: 0xd9a16f, desc: '가까운 베리를 쪼르르 달려가 먹어 줘요' },
  { name: '구름 토끼콩', price: 700, radius: 3.3, icon: '🐰', color: 0xf1e8ec, desc: '긴 귀로 베리 냄새를 잘 찾아요' },
  { name: '숲냥이 모리', price: 1200, radius: 3.8, icon: '🐱', color: 0xb68b70, desc: '살금살금 다가가 주변 베리를 모아요' },
  { name: '별부엉이 루루', price: 2000, radius: 4.5, icon: '🦉', color: 0x9b83bd, desc: '밝은 눈으로 조금 먼 베리도 찾아요' },
  { name: '아기용 베리링', price: 3500, radius: 5.2, icon: '🐲', color: 0x75bd91, desc: '넓은 범위의 베리를 재빠르게 모아 줘요' },
] as const;
export const HAIRSTYLES = [
  { name: '기본 머리', price: 0, icon: '🙂' }, { name: '몽실 양갈래', price: 100, icon: '🎀' },
  { name: '반짝 단발', price: 160, icon: '✨' }, { name: '밤톨 웨이브', price: 240, icon: '🌰' },
  { name: '별빛 포니테일', price: 360, icon: '⭐' }, { name: '구름 트윈번', price: 500, icon: '☁️' },
] as const;
export const FACES = [
  { name: '해맑은 얼굴', price: 0, icon: '😊' }, { name: '초롱초롱 눈', price: 100, icon: '🥺' },
  { name: '씩씩한 눈썹', price: 160, icon: '😎' }, { name: '방긋 고양이상', price: 240, icon: '😺' },
  { name: '별눈 반짝이', price: 360, icon: '🤩' }, { name: '졸린 달눈', price: 520, icon: '🌙' },
  { name: '토끼 앞니 미소', price: 700, icon: '🐰' }, { name: '하트 반짝눈', price: 900, icon: '💖' },
  { name: '용감한 번개눈', price: 1200, icon: '⚡' }, { name: '무지개 웃음', price: 1500, icon: '🌈' },
] as const;
export const WEAPON_UPGRADES = [60, 120, 240];
export const OUTFIT_UPGRADES = [50, 100];
export interface Save {
  version: 6; nickname: string; character: number; berries: number; level: number; xp: number;
  weapon: number; outfit: number; weapons: Record<string, number>; outfits: Record<string, number>;
  ride: number; rides: Record<string, boolean>; pet: number; pets: Record<string, boolean>;
  hairstyle: number; hairstyles: Record<string, boolean>; face: number; faces: Record<string, boolean>; teacherMode: boolean;
  best: number; position: { x: number; z: number }; tutorial: { collected: boolean; battle: boolean; shop: boolean };
  settings: { music: boolean; sound: boolean; lowQuality: boolean; maxDividend: 0 | 90 | 180; sessionMinutes: number };
  learning: { elapsedSeconds: number; correct: number; wrong: number; wrongQuestions: Question[] };
  discoveries: { monsters: number[]; pets: number[]; outfits: number[] };
  room: { furniture: number[]; inside: boolean };
  garden?: { rescued: number; flowers: number[] };
  journey: { stage: number; maps: { berries: number[]; monsters: number[]; trees: number[]; cleared: boolean }[] };
}
export interface Question { dividend: number; divisor: number; answer: number }
export const STAGE_DIVISION_DIFFICULTY = [
  { maxDividend: 80, maxAnswer: 9 },
  { maxDividend: 90, maxAnswer: 10 },
  { maxDividend: 90, maxAnswer: 12 },
  { maxDividend: 90, maxAnswer: 15 },
  { maxDividend: 100, maxAnswer: 20 },
  { maxDividend: 120, maxAnswer: 24 },
  { maxDividend: 140, maxAnswer: 28 },
  { maxDividend: 150, maxAnswer: 30 },
  { maxDividend: 160, maxAnswer: 36 },
  { maxDividend: 180, maxAnswer: 45 },
] as const;
export function newSave(nickname: string, character: number): Save {
  if (!nickname.trim() || [...nickname.trim()].length > 10 || !Number.isInteger(character) || character < 0 || character > 3) throw new Error('이름은 1~10자, 캐릭터는 4명 중 골라 주세요.');
  const hairstyle = CHARACTERS[character].style;
  return { version: 6, nickname: nickname.trim(), character, berries: 0, level: 1, xp: 0, weapon: 0, outfit: 0, weapons: { 0: 0 }, outfits: { 0: 0 }, ride: -1, rides: {}, pet: -1, pets: {}, hairstyle, hairstyles: { 0: true, [hairstyle]: true }, face: 0, faces: { 0: true }, teacherMode: false, best: 0, position: { x: 0, z: 8 }, tutorial: { collected: false, battle: false, shop: false }, settings: { music: true, sound: true, lowQuality: false, maxDividend: 0, sessionMinutes: 0 }, learning: { elapsedSeconds: 0, correct: 0, wrong: 0, wrongQuestions: [] }, discoveries: { monsters: [], pets: [], outfits: [0] }, room: { furniture: [], inside: false }, journey: emptyJourney(), garden: { rescued: 0, flowers: [-1, -1, -1] } };
}
export function emptyJourney(): Save['journey'] { return { stage: 0, maps: Array.from({ length: 11 }, () => ({ berries: [], monsters: [], trees: [], cleared: false })) }; }
export function canEnter(s: Save, stage: number) { return Number.isInteger(stage) && stage >= 0 && stage <= 10 && (s.teacherMode || stage <= 1 || s.journey.maps[stage - 1].cleared); }
export function collectBerry(s: Save, id: number) {
  const stage = s.journey.stage, map = s.journey.maps[stage];
  if (!Number.isInteger(id) || !stageBerries(stage)[id] || map.berries.includes(id)) return 0;
  const value = berryValue(stage) + OUTFITS[s.outfit].berryBonus; map.berries.push(id); s.berries += value; s.tutorial.collected = true; return value;
}
export function recordWrongAnswer(s: Save, q: Question) {
  s.learning.wrong++;
  const key = `${q.dividend}/${q.divisor}`;
  if (!s.learning.wrongQuestions.some(item => `${item.dividend}/${item.divisor}` === key)) s.learning.wrongQuestions.unshift({ ...q });
  s.learning.wrongQuestions = s.learning.wrongQuestions.slice(0, 30);
}
export function recordCorrectAnswer(s: Save, monster: number) {
  s.learning.correct++;
  if (!s.discoveries.monsters.includes(monster)) s.discoveries.monsters.push(monster);
}
export const STAGE_STORIES = ['새싹 슬라임과 인사하고 들판의 봄빛을 되찾아요.', '버섯 요정의 길 안내를 받아 오솔길을 밝혀요.', '벚꽃 언덕에 흩어진 꽃잎 축제를 도와요.', '호숫가 친구들과 반짝이는 물길을 지켜요.', '도토리 정령과 숲의 가을 잔치를 준비해요.', '구름 정원의 바람 종을 다시 울려요.', '수정숲의 별빛 조각을 모아 길을 비춰요.', '눈꽃 산책길에 따뜻한 발자국을 남겨요.', '옛터의 돌기둥에 숨은 이야기를 찾아요.', '꽃섬 친구들과 무지개 축제를 열어요.'] as const;
export function treeDamage(s: Save) { return WEAPONS[s.weapon].treePower + s.weapons[s.weapon]; }
export function fellTree(s: Save, id: number, reward: 2 | 3 | 4) {
  const map = s.journey.maps[s.journey.stage];
  if (!Number.isInteger(id) || !stageTrees(s.journey.stage)[id] || map.trees.includes(id) || ![2, 3, 4].includes(reward)) return 0;
  map.trees.push(id); s.berries += reward; return reward;
}
export function finishHunt(s: Save, id: number) {
  const stage = s.journey.stage, map = s.journey.maps[stage], monsters = stageMonsters(stage);
  if (!Number.isInteger(id) || !monsters[id] || map.monsters.includes(id)) return null;
  map.monsters.push(id); const reward = grantReward(s, monsters[id].type, false);
  let clearReward = 0;
  if (stage > 0 && map.monsters.length === monsters.length && !map.cleared) { map.cleared = true; clearReward = clearBonus(stage) + OUTFITS[s.outfit].clearBonus; s.berries += clearReward; }
  return { ...reward, clearReward };
}
export function questionPool(level: number, stage = 0, maxDividend: 0 | 90 | 180 = 0): Question[] {
  const result: Question[] = [];
  const stageRule = stage > 0 ? STAGE_DIVISION_DIFFICULTY[Math.min(stage, 10) - 1] : null;
  let dividendLimit: number = stageRule?.maxDividend ?? (level < 4 ? 90 : level < 7 ? 120 : 180);
  if (maxDividend === 90 && dividendLimit >= 100) dividendLimit = 90;
  if (maxDividend === 180) dividendLimit = Math.max(dividendLimit, 180);
  const maxAnswer = stageRule?.maxAnswer ?? (level < 4 ? 9 : Number.POSITIVE_INFINITY);
  for (let n = 10; n <= dividendLimit; n += 10) for (let d = 2; d <= 9; d++) if (n % d === 0 && n / d <= maxAnswer) result.push({ dividend: n, divisor: d, answer: n / d });
  return result;
}
const recentQuestions: string[] = [];
export function pickQuestion(level: number, previous?: Question, stage = 0, maxDividend: 0 | 90 | 180 = 0): Question {
  const all = questionPool(level, stage, maxDividend), blocked = new Set(recentQuestions.slice(-Math.min(8, Math.floor(all.length / 2))));
  let pool = all.filter(q => `${q.dividend}/${q.divisor}` !== `${previous?.dividend}/${previous?.divisor}` && !blocked.has(`${q.dividend}/${q.divisor}`));
  if (!pool.length) pool = all;
  const picked = pool[Math.floor(Math.random() * pool.length)]; recentQuestions.push(`${picked.dividend}/${picked.divisor}`); if (recentQuestions.length > 16) recentQuestions.shift(); return picked;
}
export function rewardFor(s: Save, monster: number, arena: boolean) {
  const m = MONSTERS[monster], w = WEAPONS[s.weapon];
  return { berries: m.berry + w.bonus + (arena ? 0 : s.journey.stage * 2), xp: m.xp + OUTFITS[s.outfit].xpBonus, score: arena ? Math.round(m.score * (w.multiplier + s.weapons[s.weapon] * 0.1)) : 0 };
}
export function grantReward(s: Save, monster: number, arena: boolean) {
  const reward = rewardFor(s, monster, arena); let levels = 0;
  const milestones: { level: number; berries: number }[] = [];
  s.berries += reward.berries; s.xp += reward.xp; s.tutorial.battle = true;
  while (s.xp >= s.level * 40) {
    s.xp -= s.level * 40; s.level++; s.berries += 20; levels++;
    const gift = s.level === 30 ? 30_000 : s.level === 50 ? 50_000 : s.level === 100 ? 100_000 : 0;
    if (gift) { s.berries += gift; milestones.push({ level: s.level, berries: gift }); }
  }
  return { ...reward, levels, milestones };
}
export function buy(s: Save, kind: 'weapon' | 'outfit', id: number): string {
  const items = kind === 'weapon' ? WEAPONS : OUTFITS;
  const owned = kind === 'weapon' ? s.weapons : s.outfits;
  if (!Number.isInteger(id) || !items[id]) throw new Error('없는 장비예요.');
  if (Object.hasOwn(owned, id)) { s[kind] = id; return '장착했어요!'; }
  if (s.berries < items[id].price) throw new Error(`${items[id].price - s.berries}베리가 더 필요해요.`);
  s.berries -= items[id].price; owned[id] = 0; s[kind] = id; return '새 장비를 장착했어요!';
}
export function upgrade(s: Save, kind: 'weapon' | 'outfit', id: number): string {
  const owned = kind === 'weapon' ? s.weapons : s.outfits;
  const costs = kind === 'weapon' ? WEAPON_UPGRADES : OUTFIT_UPGRADES;
  if (!Object.hasOwn(owned, id)) throw new Error('먼저 장비를 구매해 주세요.');
  const cost = costs[owned[id]];
  if (cost === undefined) throw new Error('가장 멋진 단계예요!');
  if (s.berries < cost) throw new Error(`${cost - s.berries}베리가 더 필요해요.`);
  s.berries -= cost; owned[id]++; return `${owned[id]}단계로 강화했어요!`;
}
export function buyRide(s: Save, id: number): string {
  const ride = RIDES[id];
  if (!Number.isInteger(id) || !ride) throw new Error('없는 라이딩이에요.');
  if (s.rides[id]) { s.ride = id; return `${ride.name}에 탔어요!`; }
  if (s.berries < ride.price) throw new Error(`${ride.price - s.berries}베리가 더 필요해요.`);
  s.berries -= ride.price; s.rides[id] = true; s.ride = id; return `${ride.name}을(를) 만나 함께 달려요!`;
}
export function dismount(s: Save) { s.ride = -1; return '라이딩에서 내려 천천히 걸어요.'; }
export function buyPet(s: Save, id: number): string {
  const pet = PETS[id]; if (!Number.isInteger(id) || !pet) throw new Error('없는 펫이에요.');
  if (s.pets[id]) { s.pet = id; return `${pet.name}와 함께 모험해요!`; }
  if (s.berries < pet.price) throw new Error(`${pet.price - s.berries}베리가 더 필요해요.`);
  s.berries -= pet.price; s.pets[id] = true; s.pet = id; return `${pet.name}이(가) 새 친구가 되었어요!`;
}
export function unequipPet(s: Save) { s.pet = -1; return '펫이 포근한 집에서 쉬어요.'; }
export function buyLook(s: Save, kind: 'hairstyle' | 'face', id: number): string {
  const items = kind === 'hairstyle' ? HAIRSTYLES : FACES, owned = kind === 'hairstyle' ? s.hairstyles : s.faces;
  if (!Number.isInteger(id) || !items[id]) throw new Error('없는 꾸미기예요.');
  if (!owned[id]) { if (s.berries < items[id].price) throw new Error(`${items[id].price - s.berries}베리가 더 필요해요.`); s.berries -= items[id].price; owned[id] = true; }
  s[kind] = id; return kind === 'hairstyle' ? '새 헤어스타일로 변신했어요!' : '새로운 표정으로 변신했어요!';
}
export function enableTeacherMode(s: Save, code: string): string {
  return applyTeacherCode(s, code);
}
export function applyTeacherCode(s: Save, code: string): string {
  if (code === 'showmethemoney') { s.berries += 1000; return '수업용 베리 1,000개를 추가했어요!'; }
  if (code === 'greedisgood') { s.berries += 10000; return '수업용 베리 10,000개를 추가했어요!'; }
  if (code !== 'teacher') throw new Error('암호코드가 맞지 않아요.');
  s.teacherMode = true; s.berries = 1_000_000;
  WEAPONS.forEach((_, id) => { s.weapons[id] = 3; }); OUTFITS.forEach((_, id) => { s.outfits[id] = 2; }); RIDES.forEach((_, id) => { s.rides[id] = true; }); PETS.forEach((_, id) => { s.pets[id] = true; }); HAIRSTYLES.forEach((_, id) => { s.hairstyles[id] = true; }); FACES.forEach((_, id) => { s.faces[id] = true; });
  s.discoveries.monsters = MONSTERS.map((_, id) => id); s.discoveries.pets = PETS.map((_, id) => id); s.discoveries.outfits = OUTFITS.map((_, id) => id);
  return '선생님 모드가 열렸어요! 모든 아이템과 스테이지를 사용할 수 있어요.';
}
export function validateSave(value: unknown): Save {
  const fail = () => { throw new Error('베리숲 저장 파일이 아니거나 내용이 손상되었어요.'); };
  if (!value || typeof value !== 'object') return fail();
  const migrated = structuredClone(value) as Record<string, unknown>;
  if (migrated.version === 1) { migrated.version = 2; migrated.journey = emptyJourney(); }
  if (migrated.version === 2) { migrated.version = 3; const journey = migrated.journey as Save['journey']; journey.maps.forEach(m => { m.trees = []; }); }
  if (migrated.version === 3) { migrated.version = 4; migrated.ride = -1; migrated.rides = {}; migrated.teacherMode = false; }
  if (migrated.version === 4 && migrated.teacherMode === undefined) migrated.teacherMode = false;
  if (migrated.version === 4) { migrated.version = 5; migrated.pet = -1; migrated.pets = {}; migrated.hairstyle = 0; migrated.hairstyles = { 0: true }; migrated.face = 0; migrated.faces = { 0: true }; }
  if (migrated.version === 5) {
    migrated.version = 6;
    migrated.settings = { ...(migrated.settings as object), maxDividend: 0, sessionMinutes: 0 };
    migrated.learning = { elapsedSeconds: 0, correct: 0, wrong: 0, wrongQuestions: [] };
    migrated.discoveries = { monsters: [], pets: Object.keys(migrated.pets as object).map(Number), outfits: Object.keys(migrated.outfits as object).map(Number) };
    migrated.room = { furniture: [], inside: false };
  }
  const s = migrated as unknown as Save;
  if (s.garden === undefined) s.garden = { rescued: 0, flowers: [-1, -1, -1] };
  if (s.room && s.room.inside === undefined) s.room.inside = false;
  const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
  if (!s.garden || !integer(s.garden.rescued, 0, 3) || !Array.isArray(s.garden.flowers) || s.garden.flowers.length !== 3 || s.garden.flowers.some(f => !integer(f, -1, 2)) || s.garden.flowers.filter(f => f >= 0).length > s.garden.rescued) return fail();
  if (s.version !== 6 || typeof s.teacherMode !== 'boolean' || typeof s.nickname !== 'string' || !s.nickname.trim() || [...s.nickname].length > 10 || !integer(s.character, 0, 3) || !integer(s.berries, 0, 1e9) || !integer(s.level, 1, 100000) || !integer(s.xp, 0, s.level * 40 - 1) || !integer(s.best, 0, 1e9)) return fail();
  for (const [key, total, max] of [['weapons', WEAPONS.length, 3], ['outfits', OUTFITS.length, 2]] as const) {
    const map = s[key];
    if (!map || typeof map !== 'object' || Array.isArray(map) || !Object.hasOwn(map, '0')) return fail();
    for (const [id, v] of Object.entries(map)) if (!/^\d+$/.test(id) || !integer(Number(id), 0, total - 1) || !integer(v, 0, max)) return fail();
  }
  if (!integer(s.weapon, 0, WEAPONS.length - 1) || !integer(s.outfit, 0, OUTFITS.length - 1) || !Object.hasOwn(s.weapons, s.weapon) || !Object.hasOwn(s.outfits, s.outfit)) return fail();
  if (!integer(s.ride, -1, RIDES.length - 1) || !s.rides || typeof s.rides !== 'object' || Array.isArray(s.rides)) return fail();
  for (const [id, owned] of Object.entries(s.rides)) if (!/^\d+$/.test(id) || !integer(Number(id), 0, RIDES.length - 1) || owned !== true) return fail();
  if (s.ride >= 0 && !s.rides[s.ride]) return fail();
  for (const [key, selected, items] of [['pets', s.pet, PETS], ['hairstyles', s.hairstyle, HAIRSTYLES], ['faces', s.face, FACES]] as const) {
    const owned = s[key]; if (!owned || typeof owned !== 'object' || Array.isArray(owned)) return fail();
    for (const [id, value] of Object.entries(owned)) if (!/^\d+$/.test(id) || !integer(Number(id), 0, items.length - 1) || value !== true) return fail();
    if (!integer(selected, key === 'pets' ? -1 : 0, items.length - 1) || (selected >= 0 && !owned[selected])) return fail();
  }
  if (!s.journey || !integer(s.journey.stage, 0, 10) || !Array.isArray(s.journey.maps) || s.journey.maps.length !== 11) return fail();
  for (let stage = 0; stage <= 10; stage++) {
    const m = s.journey.maps[stage];
    if (!m || typeof m.cleared !== 'boolean') return fail();
    for (const [key, max] of [['berries', stageBerries(stage).length], ['monsters', stageMonsters(stage).length], ['trees', stageTrees(stage).length]] as const) if (!Array.isArray(m[key]) || m[key].some(id => !integer(id, 0, max - 1)) || new Set(m[key]).size !== m[key].length) return fail();
    if (stage > 0 && m.cleared !== (m.monsters.length === stageMonsters(stage).length)) return fail();
    if (!s.teacherMode && stage > 1 && (m.cleared || m.monsters.length || m.berries.length || m.trees.length) && !s.journey.maps[stage - 1].cleared) return fail();
  }
  if (!canEnter(s, s.journey.stage)) return fail();
  const bounds = stageSize(s.journey.stage);
  if (!s.position || !Number.isFinite(s.position.x) || !Number.isFinite(s.position.z) || Math.abs(s.position.x) > bounds.x || Math.abs(s.position.z) > bounds.z) return fail();
  if (!s.tutorial || ['collected', 'battle', 'shop'].some(k => typeof s.tutorial[k as keyof Save['tutorial']] !== 'boolean')) return fail();
  if (!s.settings || ['music', 'sound', 'lowQuality'].some(k => typeof s.settings[k as keyof Save['settings']] !== 'boolean') || ![0, 90, 180].includes(s.settings.maxDividend) || !integer(s.settings.sessionMinutes, 0, 180)) return fail();
  if (!s.learning || !integer(s.learning.elapsedSeconds, 0, 1e9) || !integer(s.learning.correct, 0, 1e9) || !integer(s.learning.wrong, 0, 1e9) || !Array.isArray(s.learning.wrongQuestions) || s.learning.wrongQuestions.length > 30 || s.learning.wrongQuestions.some(q => !integer(q.dividend, 10, 999) || !integer(q.divisor, 2, 9) || q.dividend % q.divisor || q.answer !== q.dividend / q.divisor)) return fail();
  if (!s.discoveries || !s.room || typeof s.room.inside !== 'boolean' || !Array.isArray(s.room.furniture) || s.room.furniture.some(id => !integer(id, 0, 7))) return fail();
  if (s.room.inside && s.journey.stage !== 0) return fail();
  for (const [key, max] of [['monsters', MONSTERS.length], ['pets', PETS.length], ['outfits', OUTFITS.length]] as const) if (!Array.isArray(s.discoveries[key]) || s.discoveries[key].some(id => !integer(id, 0, max - 1))) return fail();
  return structuredClone(s);
}
export class Encounter {
  question: Question; solved = false; monster: number; arena: boolean; stage: number;
  constructor(monster: number, arena: boolean, level: number, previous?: Question, stage = 0, maxDividend: 0 | 90 | 180 = 0) { this.monster = monster; this.arena = arena; this.stage = stage; this.question = pickQuestion(level, previous, stage, maxDividend); }
  answer(value: string): 'correct' | 'wrong' | 'ignored' {
    if (this.solved) return 'ignored';
    if (!/^\d{1,2}$/.test(value) || Number(value) !== this.question.answer) return 'wrong';
    this.solved = true; return 'correct';
  }
}
