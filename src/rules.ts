import { stageBerries, stageMonsters, stageTrees, stageSize, berryValue, clearBonus } from './stages';
import { emptyExpedition, expeditionLayout, EXPEDITION_TITLES, type ExpeditionProgress } from './expedition';
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
  { name: '해바라기 우산', price: 2400, bonus: 23, multiplier: 4.9, treePower: 7, icon: '🌻', color: 0xf4c84e },
  { name: '꿀단지 철퇴', price: 2900, bonus: 25, multiplier: 5.2, treePower: 8, icon: '🍯', color: 0xd99736 },
  { name: '구구단 마법책', price: 3500, bonus: 28, multiplier: 5.6, treePower: 8, icon: '📕', color: 0xe88352 },
  { name: '황금벌 지휘봉', price: 4200, bonus: 31, multiplier: 6, treePower: 9, icon: '🐝', color: 0xf2bd35 },
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
  { name: '해바라기 원피스', price: 1080, color: 0xeebf3e, accent: 0x8fbf66, desc: '커다란 해바라기 리본이 달린 노란 원피스', effect: '길의 베리마다 +6, 몬스터마다 경험치 +2를 받아요.', berryBonus: 6, xpBonus: 2, clearBonus: 0 },
  { name: '꿀벌 후드', price: 1280, color: 0xf0bd38, accent: 0x493c35, desc: '작은 더듬이와 줄무늬 날개가 달린 후드', effect: '몬스터마다 경험치 +7, 스테이지를 통과하면 베리 +35를 받아요.', berryBonus: 0, xpBonus: 7, clearBonus: 35 },
  { name: '살구빛 구름옷', price: 1520, color: 0xf3ad79, accent: 0xffead3, desc: '살구빛 구름 자수와 폭신한 소매가 있는 옷', effect: '길의 베리마다 +4, 스테이지를 통과하면 베리 +55를 받아요.', berryBonus: 4, xpBonus: 0, clearBonus: 55 },
  { name: '곱셈별 예복', price: 1900, color: 0xcc7755, accent: 0xffdf72, desc: '숫자별과 햇살 망토가 반짝이는 특별 예복', effect: '몬스터마다 경험치 +9, 스테이지를 통과하면 베리 +65를 받아요.', berryBonus: 0, xpBonus: 9, clearBonus: 65 },
] as const;
export const CHARACTERS = [
  { name: '봄이', desc: '동글동글 양 갈래', hair: 0x623d2e, skin: 0xffd8b1, style: 0 },
  { name: '하루', desc: '씩씩한 밤톨 머리', hair: 0x3d303a, skin: 0xf1bc91, style: 1 },
  { name: '여울', desc: '은빛 단발 머리', hair: 0xe5ddca, skin: 0xffdebe, style: 2 },
  { name: '나루', desc: '폭신한 곱슬 머리', hair: 0x946544, skin: 0xc68e6c, style: 3 },
] as const;
export const MONSTERS = [
  { name: '새싹 슬라임', icon: '🌱', berry: 8, xp: 10, score: 10, color: 0x91d975, rounds: 1 },
  { name: '버섯 요정', icon: '🍄', berry: 10, xp: 12, score: 15, color: 0xf493a6, rounds: 1 },
  { name: '구름 토끼', icon: '☁️', berry: 12, xp: 15, score: 20, color: 0xeaf4fc, rounds: 1 },
  { name: '도토리 정령', icon: '🌰', berry: 15, xp: 20, score: 25, color: 0xd3aa74, rounds: 1 },
  { name: '김나현 · 별꿀벌', icon: '🐝', berry: 18, xp: 23, score: 28, color: 0xf2c94c, rounds: 2 },
  { name: '송하나 · 민들레 고양이', icon: '🐱', berry: 20, xp: 25, score: 31, color: 0xf3ad79, rounds: 2 },
  { name: '박가현 · 달빛 여우', icon: '🦊', berry: 22, xp: 28, score: 35, color: 0xb99be7, rounds: 2 },
  { name: '권소희 · 꽃구름 양', icon: '🐑', berry: 25, xp: 31, score: 39, color: 0xf0b7cf, rounds: 3 },
  { name: '김민준 · 별도토리 곰', icon: '🐻', berry: 28, xp: 35, score: 44, color: 0x8eb7d6, rounds: 3 },
] as const;
export function monsterBattleRounds(monster: number, arena = false) { return arena ? 1 : MONSTERS[monster]?.rounds ?? 1; }
export const RIDES = [
  { name: '당근 씽씽카', price: 1000, speed: 1.6, flying: false, icon: '🥕', color: 0xf39a58, desc: '당근 바퀴로 통통 달리는 첫 라이딩' },
  { name: '구름양 포포', price: 1800, speed: 1.85, flying: false, icon: '🐑', color: 0xd9eff7, desc: '폭신한 털을 흔들며 빠르게 달려요' },
  { name: '도토리 붕붕이', price: 2800, speed: 2.1, flying: false, icon: '🌰', color: 0xb98352, desc: '도토리 바퀴가 씩씩하게 숲길을 달려요' },
  { name: '무지개 사슴', price: 4000, speed: 2.35, flying: false, icon: '🦌', color: 0x82cfb2, desc: '무지개 발자국을 남기는 빠른 사슴' },
  { name: '별빛 페가수스', price: 5000, speed: 2.55, flying: true, icon: '🪽', color: 0xc9b5ef, desc: '반짝이는 날개로 물과 장애물 위를 날아요' },
  { name: '솜사탕 열기구', price: 6500, speed: 2.75, flying: true, icon: '🎈', color: 0xf2a9cf, desc: '달콤한 구름을 타고 하늘을 둥실 날아요' },
  { name: '달빛 아기용', price: 8000, speed: 3, flying: true, icon: '🐉', color: 0x7898d8, desc: '달빛 꼬리를 그리며 아주 빠르게 날아요' },
  { name: '오로라 고래', price: 10000, speed: 3.25, flying: true, icon: '🐳', color: 0x65b9d8, desc: '오로라 물결을 헤치며 가장 빠르게 날아요' },
  { name: '해바라기 사자', price: 12000, speed: 3.45, flying: true, icon: '🦁', color: 0xe6aa43, desc: '꽃잎 갈기를 흔들며 햇살 길을 빠르게 날아요' },
  { name: '꿀벌 하늘마차', price: 15000, speed: 3.7, flying: true, icon: '🐝', color: 0xf3c43f, desc: '꿀빛 날개 네 장으로 가장 빠르게 날아가요' },
] as const;
export const PLAYER_MOVE_SPEED = 8.45;
export function petChaseSpeed(rideSpeed: number) { return Math.max(12, PLAYER_MOVE_SPEED * rideSpeed * 1.2); }
export const PETS = [
  { name: '딸기 햄찌', price: 400, radius: 2.8, icon: '🐹', color: 0xd9a16f, desc: '가까운 베리를 쪼르르 달려가 먹어 줘요' },
  { name: '구름 토끼콩', price: 700, radius: 3.3, icon: '🐰', color: 0xf1e8ec, desc: '긴 귀로 베리 냄새를 잘 찾아요' },
  { name: '숲냥이 모리', price: 1200, radius: 3.8, icon: '🐱', color: 0xb68b70, desc: '살금살금 다가가 주변 베리를 모아요' },
  { name: '별부엉이 루루', price: 2000, radius: 4.5, icon: '🦉', color: 0x9b83bd, desc: '밝은 눈으로 조금 먼 베리도 찾아요' },
  { name: '아기용 베리링', price: 3500, radius: 5.2, icon: '🐲', color: 0x75bd91, desc: '넓은 범위의 베리를 재빠르게 모아 줘요' },
  { name: '꿀벌 몽이', price: 4500, radius: 5.8, icon: '🐝', color: 0xf2c94c, desc: '꽃가루를 반짝이며 먼 베리까지 날아가요' },
  { name: '해바라기 여우', price: 5500, radius: 6.4, icon: '🦊', color: 0xe8a15b, desc: '해바라기 꼬리를 흔들며 가장 넓게 찾아요' },
] as const;
export const HAIRSTYLES = [
  { name: '기본 머리', price: 0, icon: '🙂' }, { name: '몽실 양갈래', price: 100, icon: '🎀' },
  { name: '반짝 단발', price: 160, icon: '✨' }, { name: '밤톨 웨이브', price: 240, icon: '🌰' },
  { name: '별빛 포니테일', price: 360, icon: '⭐' }, { name: '구름 트윈번', price: 500, icon: '☁️' },
  { name: '해바라기 땋은머리', price: 680, icon: '🌻' }, { name: '꿀벌 동글번', price: 820, icon: '🐝' },
  { name: '살구 웨이브', price: 980, icon: '🍑' }, { name: '햇살 왕관머리', price: 1250, icon: '☀️' },
] as const;
export const FACES = [
  { name: '해맑은 얼굴', price: 0, icon: '😊' }, { name: '초롱초롱 눈', price: 100, icon: '🥺' },
  { name: '씩씩한 눈썹', price: 160, icon: '😎' }, { name: '방긋 고양이상', price: 240, icon: '😺' },
  { name: '별눈 반짝이', price: 360, icon: '🤩' }, { name: '졸린 달눈', price: 520, icon: '🌙' },
  { name: '토끼 앞니 미소', price: 700, icon: '🐰' }, { name: '하트 반짝눈', price: 900, icon: '💖' },
  { name: '용감한 번개눈', price: 1200, icon: '⚡' }, { name: '무지개 웃음', price: 1500, icon: '🌈' },
  { name: '햇살 초승달눈', price: 1750, icon: '☀️' }, { name: '꿀방울 미소', price: 2000, icon: '🍯' },
  { name: '해바라기 반짝눈', price: 2300, icon: '🌻' }, { name: '별숲 용기눈', price: 2600, icon: '🌟' },
] as const;
export const POTIONS = [
  { name: '달콤 베리물약', icon: '🧃', price: 140, kind: 'berry', multiplier: 2, durationMinutes: 10, desc: '사용한 뒤 10분 동안 몬스터에게 받는 베리가 2배가 돼요.' },
  { name: '황금 베리물약', icon: '🍯', price: 360, kind: 'berry', multiplier: 3, durationMinutes: 5, desc: '사용한 뒤 5분 동안 몬스터에게 받는 베리가 3배가 돼요.' },
  { name: '쑥쑥 경험물약', icon: '🧪', price: 320, kind: 'xp', multiplier: 3, durationMinutes: 10, desc: '사용한 뒤 10분 동안 몬스터에게 받는 경험치가 3배가 돼요.' },
] as const;
export const WEAPON_UPGRADES = [60, 120, 240];
export const OUTFIT_UPGRADES = [50, 100];
export type ForestKind = 'division' | 'multiplication';
export type MultiplicationRange = 'stage' | 'tables';
export interface Journey { stage: number; maps: { berries: number[]; monsters: number[]; trees: number[]; cleared: boolean }[] }
export interface MultiplicationFinal { left: number; right: number; step: 0 | 1 }
export interface Save {
  version: 9; nickname: string; character: number; berries: number; level: number; xp: number;
  weapon: number; outfit: number; weapons: Record<string, number>; outfits: Record<string, number>;
  ride: number; rides: Record<string, boolean>; pet: number; pets: Record<string, boolean>;
  hairstyle: number; hairstyles: Record<string, boolean>; face: number; faces: Record<string, boolean>; teacherMode: boolean;
  best: number; position: { x: number; z: number }; tutorial: { collected: boolean; battle: boolean; shop: boolean };
  settings: { music: boolean; sound: boolean; lowQuality: boolean; maxDividend: 0 | 90 | 180; multiplicationRange: MultiplicationRange; sessionMinutes: number };
  learning: { elapsedSeconds: number; correct: number; wrong: number; wrongQuestions: Question[] };
  discoveries: { monsters: number[]; pets: number[]; outfits: number[] };
  room: { furniture: number[]; inside: boolean };
  garden?: { rescued: number; flowers: number[] };
  expedition: ExpeditionProgress;
  forest: ForestKind;
  journey: Journey;
  multiplicationJourney: Journey;
  multiplicationFinal: MultiplicationFinal | null;
  multiplicationCompleted: boolean;
  multiplicationRewardClaimed: boolean;
  potions: { stock: number[]; berryMultiplier: 1 | 2 | 3; berryUntil: number; xpMultiplier: 1 | 3; xpUntil: number };
}
export interface Question { dividend: number; divisor: number; answer: number; operation?: ForestKind }
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
  return { version: 9, nickname: nickname.trim(), character, berries: 0, level: 1, xp: 0, weapon: 0, outfit: 0, weapons: { 0: 0 }, outfits: { 0: 0 }, ride: -1, rides: {}, pet: -1, pets: {}, hairstyle, hairstyles: { 0: true, [hairstyle]: true }, face: 0, faces: { 0: true }, teacherMode: false, best: 0, position: { x: 0, z: 8 }, tutorial: { collected: false, battle: false, shop: false }, settings: { music: true, sound: true, lowQuality: false, maxDividend: 0, multiplicationRange: 'stage', sessionMinutes: 0 }, learning: { elapsedSeconds: 0, correct: 0, wrong: 0, wrongQuestions: [] }, discoveries: { monsters: [], pets: [], outfits: [0] }, room: { furniture: [], inside: false }, forest: 'division', journey: emptyJourney(), multiplicationJourney: emptyJourney(), multiplicationFinal: null, multiplicationCompleted: false, multiplicationRewardClaimed: false, potions: { stock: [0, 0, 0], berryMultiplier: 1, berryUntil: 0, xpMultiplier: 1, xpUntil: 0 }, garden: { rescued: 0, flowers: [-1, -1, -1] }, expedition: emptyExpedition() };
}
export function emptyJourney(): Journey { return { stage: 0, maps: Array.from({ length: 11 }, () => ({ berries: [], monsters: [], trees: [], cleared: false })) }; }
export function journeyFor(s: Save, forest: ForestKind = s.forest) { return forest === 'multiplication' ? s.multiplicationJourney : s.journey; }
export function canEnter(s: Save, stage: number, forest: ForestKind = s.forest) { const journey = journeyFor(s, forest); return Number.isInteger(stage) && stage >= 0 && stage <= 10 && (s.teacherMode || stage <= 1 || journey.maps[stage - 1].cleared); }
export function collectBerry(s: Save, id: number) {
  const journey = journeyFor(s), stage = journey.stage, map = journey.maps[stage];
  if (!Number.isInteger(id) || !stageBerries(stage)[id] || map.berries.includes(id)) return 0;
  const value = berryValue(stage) + OUTFITS[s.outfit].berryBonus; map.berries.push(id); s.berries += value; s.tutorial.collected = true; return value;
}
export function recordWrongAnswer(s: Save, q: Question) {
  s.learning.wrong++;
  const key = `${q.operation ?? 'division'}:${q.dividend}/${q.divisor}`;
  if (!s.learning.wrongQuestions.some(item => `${item.operation ?? 'division'}:${item.dividend}/${item.divisor}` === key)) s.learning.wrongQuestions.unshift({ ...q, operation: q.operation ?? 'division' });
  s.learning.wrongQuestions = s.learning.wrongQuestions.slice(0, 30);
}
export function recordCorrectAnswer(s: Save, monster: number) {
  s.learning.correct++;
  if (!s.discoveries.monsters.includes(monster)) s.discoveries.monsters.push(monster);
}
export const STAGE_STORIES = ['새싹 슬라임과 인사하고 들판의 봄빛을 되찾아요.', '버섯 요정의 길 안내를 받아 오솔길을 밝혀요.', '벚꽃 언덕에 흩어진 꽃잎 축제를 도와요.', '호숫가 친구들과 반짝이는 물길을 지켜요.', '도토리 정령과 숲의 가을 잔치를 준비해요.', '구름 정원의 바람 종을 다시 울려요.', '수정숲의 별빛 조각을 모아 길을 비춰요.', '눈꽃 산책길에 따뜻한 발자국을 남겨요.', '옛터의 돌기둥에 숨은 이야기를 찾아요.', '꽃섬 친구들과 무지개 축제를 열어요.'] as const;
export function treeDamage(s: Save) { return WEAPONS[s.weapon].treePower + s.weapons[s.weapon]; }
export function fellTree(s: Save, id: number, reward: 2 | 3 | 4) {
  const journey = journeyFor(s), map = journey.maps[journey.stage];
  if (!Number.isInteger(id) || !stageTrees(journey.stage)[id] || map.trees.includes(id) || ![2, 3, 4].includes(reward)) return 0;
  map.trees.push(id); s.berries += reward; return reward;
}
export function finishHunt(s: Save, id: number) {
  const journey = journeyFor(s), stage = journey.stage, map = journey.maps[stage], monsters = stageMonsters(stage);
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
  for (let n = 10; n <= dividendLimit; n += 10) for (let d = 2; d <= 9; d++) if (n % d === 0 && n / d <= maxAnswer) result.push({ dividend: n, divisor: d, answer: n / d, operation: 'division' });
  return result;
}
export function multiplicationHasCarrying(left: number, right: number) { return left % 10 * right >= 10; }
function multiplicationRange(stage: number, review = false) {
  if (review) return { min: 2, max: 9, rightMin: 2, rightMax: 9, tables: true, carry: null as boolean | null };
  if (stage <= 1) return { min: 2, max: 5, rightMin: 2, rightMax: 5, tables: true, carry: null };
  if (stage === 2) return { min: 2, max: 9, rightMin: 2, rightMax: 9, tables: true, carry: null };
  if (stage === 3) return { min: 10, max: 90, rightMin: 2, rightMax: 5, tens: true, carry: null };
  if (stage === 4) return { min: 10, max: 90, rightMin: 2, rightMax: 9, tens: true, carry: null };
  if (stage === 5) return { min: 11, max: 49, rightMin: 2, rightMax: 4, carry: false };
  if (stage === 6) return { min: 11, max: 49, rightMin: 2, rightMax: 4, carry: true };
  if (stage <= 8) return { min: 11, max: 79, rightMin: 2, rightMax: 6, carry: true };
  return { min: 11, max: 99, rightMin: 2, rightMax: 9, carry: null };
}
export function multiplicationQuestionPool(stage = 1, tablesOnly = false, review = false): Question[] {
  const rule = multiplicationRange(tablesOnly ? 2 : Math.min(10, Math.max(1, stage)), review);
  const result: Question[] = [];
  for (let left = rule.min; left <= rule.max; left++) {
    if ('tens' in rule && rule.tens && left % 10 !== 0) continue;
    for (let right = rule.rightMin; right <= rule.rightMax; right++) {
      if (rule.carry !== null && multiplicationHasCarrying(left, right) !== rule.carry) continue;
      result.push({ dividend: left, divisor: right, answer: left * right, operation: 'multiplication' });
    }
  }
  return result;
}
const recentQuestions: string[] = [];
export function pickQuestion(level: number, previous?: Question, stage = 0, maxDividend: 0 | 90 | 180 = 0): Question {
  const all = questionPool(level, stage, maxDividend), blocked = new Set(recentQuestions.slice(-Math.min(8, Math.floor(all.length / 2)))), key = (q: Question) => `division:${q.dividend}/${q.divisor}`;
  let pool = all.filter(q => key(q) !== (previous ? key(previous) : '') && !blocked.has(key(q)));
  if (!pool.length) pool = all;
  const picked = pool[Math.floor(Math.random() * pool.length)]; recentQuestions.push(`${picked.operation ?? 'division'}:${picked.dividend}/${picked.divisor}`); if (recentQuestions.length > 16) recentQuestions.shift(); return picked;
}
export function pickMultiplicationQuestion(stage = 1, previous?: Question, range: MultiplicationRange = 'stage'): Question {
  const review = range === 'stage' && stage >= 9 && Math.random() < .3;
  const all = multiplicationQuestionPool(stage, range === 'tables', review);
  const key = (q: Question) => `${q.operation}:${q.dividend}x${q.divisor}`;
  const blocked = new Set(recentQuestions.slice(-Math.min(8, Math.floor(all.length / 2))));
  let pool = all.filter(q => key(q) !== (previous ? key(previous) : '') && !blocked.has(key(q)));
  if (!pool.length) pool = all;
  const picked = pool[Math.floor(Math.random() * pool.length)]; recentQuestions.push(key(picked)); if (recentQuestions.length > 16) recentQuestions.shift(); return picked;
}
export function multiplicationUsesStory(monsterIndex: number) {
  return Number.isInteger(monsterIndex) && monsterIndex >= 0 && (monsterIndex + 1) % 3 === 0;
}
export function startMultiplicationFinal(s: Save): MultiplicationFinal | null {
  if (!s.teacherMode && !s.multiplicationJourney.maps[10].cleared) return null;
  if (!s.multiplicationFinal) {
    const q = multiplicationQuestionPool(2)[Math.floor(Math.random() * multiplicationQuestionPool(2).length)];
    s.multiplicationFinal = { left: q.dividend, right: q.divisor, step: 0 };
  }
  return s.multiplicationFinal;
}
export function answerMultiplicationFinal(s: Save, answer: number) {
  const gate = s.multiplicationFinal; if (!gate) return { correct: false, complete: false, reward: false };
  const expected = gate.step === 0 ? gate.left * gate.right : gate.left;
  if (answer !== expected) return { correct: false, complete: false, reward: false };
  if (gate.step === 0) { gate.step = 1; return { correct: true, complete: false, reward: false }; }
  s.multiplicationCompleted = true; s.multiplicationFinal = null;
  const reward = !s.multiplicationRewardClaimed;
  if (reward) s.multiplicationRewardClaimed = true;
  return { correct: true, complete: true, reward };
}
export function potionEffects(s: Save, now = Date.now()) {
  return {
    berryMultiplier: s.potions.berryUntil > now ? s.potions.berryMultiplier : 1,
    berrySeconds: Math.max(0, Math.ceil((s.potions.berryUntil - now) / 1000)),
    xpMultiplier: s.potions.xpUntil > now ? s.potions.xpMultiplier : 1,
    xpSeconds: Math.max(0, Math.ceil((s.potions.xpUntil - now) / 1000)),
  } as const;
}
export function rewardFor(s: Save, monster: number, arena: boolean, now = Date.now()) {
  const m = MONSTERS[monster], w = WEAPONS[s.weapon];
  const { berryMultiplier, xpMultiplier } = potionEffects(s, now);
  return { berries: (m.berry + w.bonus + (arena ? 0 : 2 + journeyFor(s).stage * 2)) * berryMultiplier, xp: (m.xp + OUTFITS[s.outfit].xpBonus) * xpMultiplier, score: arena ? Math.round(m.score * (w.multiplier + s.weapons[s.weapon] * 0.1)) : 0 };
}
export function grantReward(s: Save, monster: number, arena: boolean, now = Date.now()) {
  const reward = rewardFor(s, monster, arena, now); let levels = 0;
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
export function buyPotion(s: Save, id: number) {
  const potion = POTIONS[id]; if (!Number.isInteger(id) || !potion) throw new Error('없는 물약이에요.');
  if (s.potions.stock[id] >= 99) throw new Error('이 물약은 99개까지 보관할 수 있어요.');
  if (s.berries < potion.price) throw new Error(`${potion.price - s.berries}베리가 더 필요해요.`);
  s.berries -= potion.price; s.potions.stock[id]++; return `${potion.name}을(를) 가방에 넣었어요!`;
}
export function usePotion(s: Save, id: number, now = Date.now()) {
  const potion = POTIONS[id]; if (!Number.isInteger(id) || !potion || !s.potions.stock[id]) throw new Error('가방에 이 물약이 없어요.');
  const effects = potionEffects(s, now);
  if (potion.kind === 'berry' && effects.berrySeconds) throw new Error(`베리 물약 효과가 ${Math.ceil(effects.berrySeconds / 60)}분 정도 남아 있어요.`);
  if (potion.kind === 'xp' && effects.xpSeconds) throw new Error(`경험치 물약 효과가 ${Math.ceil(effects.xpSeconds / 60)}분 정도 남아 있어요.`);
  s.potions.stock[id]--;
  if (potion.kind === 'berry') { s.potions.berryMultiplier = potion.multiplier as 2 | 3; s.potions.berryUntil = now + potion.durationMinutes * 60_000; }
  else { s.potions.xpMultiplier = 3; s.potions.xpUntil = now + potion.durationMinutes * 60_000; }
  return `${potion.name}을(를) 사용했어요. ${potion.durationMinutes}분 동안 효과가 있어요!`;
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
  s.potions.stock = POTIONS.map(() => 9);
  s.discoveries.monsters = MONSTERS.map((_, id) => id); s.discoveries.pets = PETS.map((_, id) => id); s.discoveries.outfits = OUTFITS.map((_, id) => id);
  s.multiplicationCompleted = true; s.multiplicationRewardClaimed = true;
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
  if (migrated.version === 6) { migrated.version = 7; migrated.expedition = emptyExpedition(); }
  if (migrated.version === 7) {
    migrated.version = 8;
    migrated.forest = 'division';
    migrated.multiplicationJourney = emptyJourney();
    migrated.multiplicationFinal = null;
    migrated.multiplicationCompleted = migrated.teacherMode === true;
    migrated.multiplicationRewardClaimed = migrated.teacherMode === true;
    migrated.settings = { ...(migrated.settings as object), multiplicationRange: 'stage' };
    const learning = migrated.learning as Save['learning'] | undefined;
    if (learning?.wrongQuestions) learning.wrongQuestions = learning.wrongQuestions.map(q => ({ ...q, operation: q.operation ?? 'division' }));
    const expedition = migrated.expedition as ExpeditionProgress | undefined;
    if (expedition?.active?.gateQuestion) expedition.active.gateQuestion = { ...expedition.active.gateQuestion, operation: 'division' };
  }
  if (migrated.version === 8) {
    const old = migrated.potions as { stock?: number[]; berryMultiplier?: number; berryUses?: number; xpMultiplier?: number; xpUses?: number } | undefined;
    const now = Date.now(), preserveMs = 5 * 60_000;
    const berryActive = !!old?.berryUses && [2, 3].includes(old.berryMultiplier ?? 0), xpActive = !!old?.xpUses && old.xpMultiplier === 3;
    migrated.version = 9;
    migrated.potions = {
      stock: Array.isArray(old?.stock) ? old.stock : (migrated.teacherMode ? POTIONS.map(() => 9) : [0, 0, 0]),
      berryMultiplier: berryActive ? old!.berryMultiplier : 1,
      berryUntil: berryActive ? now + preserveMs : 0,
      xpMultiplier: xpActive ? 3 : 1,
      xpUntil: xpActive ? now + preserveMs : 0,
    };
  }
  const s = migrated as unknown as Save;
  if (s.garden === undefined) s.garden = { rescued: 0, flowers: [-1, -1, -1] };
  if (s.potions === undefined) s.potions = { stock: s.teacherMode ? POTIONS.map(() => 9) : [0, 0, 0], berryMultiplier: 1, berryUntil: 0, xpMultiplier: 1, xpUntil: 0 };
  if (s.room && s.room.inside === undefined) s.room.inside = false;
  // Teacher saves may predate newly released collection items. Keep the demonstration wardrobe complete.
  const hasTeacherCollection = s.teacherMode && (Object.keys(s.weapons).length > 1 || Object.keys(s.outfits).length > 1 || Object.keys(s.rides).length > 0 || Object.keys(s.pets).length > 0);
  if (hasTeacherCollection) {
    WEAPONS.forEach((_, id) => { if (s.weapons[id] === undefined) s.weapons[id] = 3; });
    OUTFITS.forEach((_, id) => { if (s.outfits[id] === undefined) s.outfits[id] = 2; });
    RIDES.forEach((_, id) => { s.rides[id] = true; }); PETS.forEach((_, id) => { s.pets[id] = true; });
    HAIRSTYLES.forEach((_, id) => { s.hairstyles[id] = true; }); FACES.forEach((_, id) => { s.faces[id] = true; });
    s.discoveries.monsters = MONSTERS.map((_, id) => id); s.discoveries.pets = PETS.map((_, id) => id); s.discoveries.outfits = OUTFITS.map((_, id) => id);
  }
  const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
  if (!s.garden || !integer(s.garden.rescued, 0, 3) || !Array.isArray(s.garden.flowers) || s.garden.flowers.length !== 3 || s.garden.flowers.some(f => !integer(f, -1, 2)) || s.garden.flowers.filter(f => f >= 0).length > s.garden.rescued) return fail();
  if (s.version !== 9 || !['division', 'multiplication'].includes(s.forest) || typeof s.teacherMode !== 'boolean' || typeof s.nickname !== 'string' || !s.nickname.trim() || [...s.nickname].length > 10 || !integer(s.character, 0, 3) || !integer(s.berries, 0, 1e9) || !integer(s.level, 1, 100000) || !integer(s.xp, 0, s.level * 40 - 1) || !integer(s.best, 0, 1e9)) return fail();
  if (!s.potions || !Array.isArray(s.potions.stock) || s.potions.stock.length !== POTIONS.length || s.potions.stock.some(n => !integer(n, 0, 99)) || ![1, 2, 3].includes(s.potions.berryMultiplier) || !integer(s.potions.berryUntil, 0, Number.MAX_SAFE_INTEGER) || ![1, 3].includes(s.potions.xpMultiplier) || !integer(s.potions.xpUntil, 0, Number.MAX_SAFE_INTEGER) || (s.potions.berryUntil === 0) !== (s.potions.berryMultiplier === 1) || (s.potions.xpUntil === 0) !== (s.potions.xpMultiplier === 1)) return fail();
  const expedition = s.expedition;
  if (!expedition || !integer(expedition.completed, 0, 1e8) || !integer(expedition.selectedTitle, 0, EXPEDITION_TITLES.length - 1) || expedition.completed < EXPEDITION_TITLES[expedition.selectedTitle].need) return fail();
  if (expedition.active !== null) {
    const active = expedition.active, layout = expeditionLayout(expedition.completed), q = active?.gateQuestion;
    if (!active || active.stage !== layout.stage || ![0, 1].includes(active.storyKind) || !Array.isArray(active.stars) || !Array.isArray(active.monsters)) return fail();
    for (const [found, allowed] of [[active.stars, layout.stars], [active.monsters, layout.monsters]] as const) if (found.some(id => !allowed.includes(id)) || new Set(found).size !== found.length) return fail();
    if (!q || !integer(q.dividend, 10, 180) || q.dividend % 10 !== 0 || !integer(q.divisor, 2, 9) || q.dividend % q.divisor !== 0 || q.answer !== q.dividend / q.divisor) return fail();
  }
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
  for (const journey of [s.journey, s.multiplicationJourney]) {
    if (!journey || !integer(journey.stage, 0, 10) || !Array.isArray(journey.maps) || journey.maps.length !== 11) return fail();
    for (let stage = 0; stage <= 10; stage++) {
      const m = journey.maps[stage];
      if (!m || typeof m.cleared !== 'boolean') return fail();
      for (const [key, max] of [['berries', stageBerries(stage).length], ['monsters', stageMonsters(stage).length], ['trees', stageTrees(stage).length]] as const) if (!Array.isArray(m[key]) || m[key].some(id => !integer(id, 0, max - 1)) || new Set(m[key]).size !== m[key].length) return fail();
      if (stage > 0 && m.cleared !== (m.monsters.length === stageMonsters(stage).length)) return fail();
      if (!s.teacherMode && stage > 1 && (m.cleared || m.monsters.length || m.berries.length || m.trees.length) && !journey.maps[stage - 1].cleared) return fail();
    }
  }
  if (typeof s.multiplicationCompleted !== 'boolean' || typeof s.multiplicationRewardClaimed !== 'boolean' || (s.multiplicationCompleted && !s.multiplicationRewardClaimed)) return fail();
  if (s.multiplicationFinal !== null) {
    const gate = s.multiplicationFinal;
    if (!integer(gate.left, 2, 9) || !integer(gate.right, 2, 9) || ![0, 1].includes(gate.step)) return fail();
  }
  if ((s.multiplicationCompleted || s.multiplicationFinal) && !s.teacherMode && !s.multiplicationJourney.maps[10].cleared) return fail();
  if (expedition.active && !s.teacherMode && !s.journey.maps.slice(1).every(map => map.cleared)) return fail();
  if (!canEnter(s, journeyFor(s).stage)) return fail();
  const bounds = stageSize(journeyFor(s).stage);
  if (!s.position || !Number.isFinite(s.position.x) || !Number.isFinite(s.position.z) || Math.abs(s.position.x) > bounds.x || Math.abs(s.position.z) > bounds.z) return fail();
  if (!s.tutorial || ['collected', 'battle', 'shop'].some(k => typeof s.tutorial[k as keyof Save['tutorial']] !== 'boolean')) return fail();
  if (!s.settings || ['music', 'sound', 'lowQuality'].some(k => typeof s.settings[k as keyof Save['settings']] !== 'boolean') || ![0, 90, 180].includes(s.settings.maxDividend) || !['stage', 'tables'].includes(s.settings.multiplicationRange) || !integer(s.settings.sessionMinutes, 0, 180)) return fail();
  const validQuestion = (q: Question) => q.operation === 'multiplication'
    ? integer(q.dividend, 2, 99) && integer(q.divisor, 2, 9) && q.answer === q.dividend * q.divisor
    : integer(q.dividend, 10, 999) && integer(q.divisor, 2, 9) && q.dividend % q.divisor === 0 && q.answer === q.dividend / q.divisor;
  if (!s.learning || !integer(s.learning.elapsedSeconds, 0, 1e9) || !integer(s.learning.correct, 0, 1e9) || !integer(s.learning.wrong, 0, 1e9) || !Array.isArray(s.learning.wrongQuestions) || s.learning.wrongQuestions.length > 30 || s.learning.wrongQuestions.some(q => !validQuestion(q))) return fail();
  if (!s.discoveries || !s.room || typeof s.room.inside !== 'boolean' || !Array.isArray(s.room.furniture) || s.room.furniture.some(id => !integer(id, 0, 8))) return fail();
  if (s.room.inside && journeyFor(s).stage !== 0) return fail();
  for (const [key, max] of [['monsters', MONSTERS.length], ['pets', PETS.length], ['outfits', OUTFITS.length]] as const) if (!Array.isArray(s.discoveries[key]) || s.discoveries[key].some(id => !integer(id, 0, max - 1))) return fail();
  return structuredClone(s);
}
export class Encounter {
  question: Question; solved = false; monster: number; arena: boolean; stage: number;
  constructor(monster: number, arena: boolean, level: number, previous?: Question, stage = 0, maxDividend: 0 | 90 | 180 = 0, operation: ForestKind = 'division', multiplicationRange: MultiplicationRange = 'stage') { this.monster = monster; this.arena = arena; this.stage = stage; this.question = operation === 'multiplication' ? pickMultiplicationQuestion(stage || 1, previous, multiplicationRange) : pickQuestion(level, previous, stage, maxDividend); }
  answer(value: string): 'correct' | 'wrong' | 'ignored' {
    if (this.solved) return 'ignored';
    if (!/^\d{1,3}$/.test(value) || Number(value) !== this.question.answer) return 'wrong';
    this.solved = true; return 'correct';
  }
}
