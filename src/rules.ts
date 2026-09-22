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
] as const;
export const OUTFITS = [
  { name: '새싹 탐험복', price: 0, color: 0x4d9c78, accent: 0xffe4a3, desc: '처음 떠나는 모험의 설렘', effect: '베리 +0', berryBonus: 0, xpBonus: 0, clearBonus: 0 },
  { name: '색동 저고리', price: 40, color: 0xf08c9f, accent: 0x79c9d0, desc: '알록달록 소매와 고운 옷고름', effect: '베리 줍기 +1', berryBonus: 1, xpBonus: 0, clearBonus: 0 },
  { name: '숲속 망토', price: 60, color: 0x267e68, accent: 0xc8df85, desc: '숲의 색을 닮은 포근한 망토', effect: '몬스터 경험치 +2', berryBonus: 0, xpBonus: 2, clearBonus: 0 },
  { name: '구름 도포', price: 80, color: 0x79b5e2, accent: 0xf2f6ff, desc: '파란 하늘 아래 가벼운 발걸음', effect: '베리 줍기 +2', berryBonus: 2, xpBonus: 0, clearBonus: 0 },
  { name: '꽃 도포', price: 100, color: 0xd77cba, accent: 0xffdf99, desc: '봄꽃처럼 화사한 긴 옷자락', effect: '스테이지 완료 +20베리', berryBonus: 0, xpBonus: 0, clearBonus: 20 },
  { name: '별빛 마법사복', price: 140, color: 0x7761b3, accent: 0xf6d36e, desc: '작은 별이 머무는 마법사의 옷', effect: '몬스터 경험치 +4', berryBonus: 0, xpBonus: 4, clearBonus: 0 },
  { name: '달빛 무사복', price: 180, color: 0x405b8c, accent: 0xcbe4ee, desc: '은빛 옷깃이 빛나는 의상', effect: '베리 줍기 +3', berryBonus: 3, xpBonus: 0, clearBonus: 0 },
  { name: '왕실 꽃비단', price: 240, color: 0xeab356, accent: 0xf9f0d5, desc: '금빛 비단과 풍성한 꽃장식', effect: '완료 +35베리 · 경험치 +2', berryBonus: 0, xpBonus: 2, clearBonus: 35 },
  { name: '딸기 농장 멜빵', price: 280, color: 0x6ea6d9, accent: 0xf55f74, desc: '주머니에 딸기를 담는 포근한 멜빵', effect: '베리 줍기 +4', berryBonus: 4, xpBonus: 0, clearBonus: 0 },
  { name: '노랑 오리 우비', price: 320, color: 0xf2c94c, accent: 0xfff4ad, desc: '빗방울도 신나는 통통한 우비', effect: '완료 +45베리', berryBonus: 0, xpBonus: 0, clearBonus: 45 },
  { name: '토끼 귀 소풍복', price: 390, color: 0xe7a5c4, accent: 0xfff2f7, desc: '긴 토끼 귀와 보송한 꼬리가 달린 옷', effect: '경험치 +6', berryBonus: 0, xpBonus: 6, clearBonus: 0 },
  { name: '도토리 숲지기', price: 480, color: 0x9b7448, accent: 0xd8bb71, desc: '도토리 모자와 나뭇잎 가방 세트', effect: '베리 +2 · 완료 +30베리', berryBonus: 2, xpBonus: 0, clearBonus: 30 },
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
export const WEAPON_UPGRADES = [60, 120, 240];
export const OUTFIT_UPGRADES = [50, 100];
export interface Save {
  version: 3; nickname: string; character: number; berries: number; level: number; xp: number;
  weapon: number; outfit: number; weapons: Record<string, number>; outfits: Record<string, number>;
  best: number; position: { x: number; z: number }; tutorial: { collected: boolean; battle: boolean; shop: boolean };
  settings: { music: boolean; sound: boolean; lowQuality: boolean };
  journey: { stage: number; maps: { berries: number[]; monsters: number[]; trees: number[]; cleared: boolean }[] };
}
export interface Question { dividend: number; divisor: number; answer: number }
export function newSave(nickname: string, character: number): Save {
  if (!nickname.trim() || [...nickname.trim()].length > 10 || !Number.isInteger(character) || character < 0 || character > 3) throw new Error('이름은 1~10자, 캐릭터는 4명 중 골라 주세요.');
  return { version: 3, nickname: nickname.trim(), character, berries: 0, level: 1, xp: 0, weapon: 0, outfit: 0, weapons: { 0: 0 }, outfits: { 0: 0 }, best: 0, position: { x: 0, z: 8 }, tutorial: { collected: false, battle: false, shop: false }, settings: { music: true, sound: true, lowQuality: false }, journey: emptyJourney() };
}
export function emptyJourney(): Save['journey'] { return { stage: 0, maps: Array.from({ length: 11 }, () => ({ berries: [], monsters: [], trees: [], cleared: false })) }; }
export function canEnter(s: Save, stage: number) { return Number.isInteger(stage) && stage >= 0 && stage <= 10 && (stage <= 1 || s.journey.maps[stage - 1].cleared); }
export function collectBerry(s: Save, id: number) {
  const stage = s.journey.stage, map = s.journey.maps[stage];
  if (!Number.isInteger(id) || !stageBerries(stage)[id] || map.berries.includes(id)) return 0;
  const value = berryValue(stage) + OUTFITS[s.outfit].berryBonus; map.berries.push(id); s.berries += value; s.tutorial.collected = true; return value;
}
export function treeDamage(s: Save) { return WEAPONS[s.weapon].treePower + s.weapons[s.weapon]; }
export function fellTree(s: Save, id: number, reward: 1 | 2) {
  const map = s.journey.maps[s.journey.stage];
  if (!Number.isInteger(id) || !stageTrees(s.journey.stage)[id] || map.trees.includes(id) || (reward !== 1 && reward !== 2)) return 0;
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
export function questionPool(level: number): Question[] {
  const result: Question[] = [];
  const maxDividend = level < 4 ? 90 : level < 7 ? 120 : 180;
  for (let n = 10; n <= maxDividend; n += 10) for (let d = 2; d <= 9; d++) if (n % d === 0 && (level >= 4 || n / d < 10)) result.push({ dividend: n, divisor: d, answer: n / d });
  return result;
}
const recentQuestions: string[] = [];
export function pickQuestion(level: number, previous?: Question): Question {
  const all = questionPool(level), blocked = new Set(recentQuestions.slice(-Math.min(8, Math.floor(all.length / 2))));
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
  s.berries += reward.berries; s.xp += reward.xp; s.tutorial.battle = true;
  while (s.xp >= s.level * 40) { s.xp -= s.level * 40; s.level++; s.berries += 20; levels++; }
  return { ...reward, levels };
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
export function validateSave(value: unknown): Save {
  const fail = () => { throw new Error('베리숲 저장 파일이 아니거나 내용이 손상되었어요.'); };
  if (!value || typeof value !== 'object') return fail();
  const migrated = structuredClone(value) as Record<string, unknown>;
  if (migrated.version === 1) { migrated.version = 2; migrated.journey = emptyJourney(); }
  if (migrated.version === 2) { migrated.version = 3; const journey = migrated.journey as Save['journey']; journey.maps.forEach(m => { m.trees = []; }); }
  const s = migrated as unknown as Save;
  const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
  if (s.version !== 3 || typeof s.nickname !== 'string' || !s.nickname.trim() || [...s.nickname].length > 10 || !integer(s.character, 0, 3) || !integer(s.berries, 0, 1e9) || !integer(s.level, 1, 100000) || !integer(s.xp, 0, s.level * 40 - 1) || !integer(s.best, 0, 1e9)) return fail();
  for (const [key, total, max] of [['weapons', WEAPONS.length, 3], ['outfits', OUTFITS.length, 2]] as const) {
    const map = s[key];
    if (!map || typeof map !== 'object' || Array.isArray(map) || !Object.hasOwn(map, '0')) return fail();
    for (const [id, v] of Object.entries(map)) if (!/^\d+$/.test(id) || !integer(Number(id), 0, total - 1) || !integer(v, 0, max)) return fail();
  }
  if (!integer(s.weapon, 0, WEAPONS.length - 1) || !integer(s.outfit, 0, OUTFITS.length - 1) || !Object.hasOwn(s.weapons, s.weapon) || !Object.hasOwn(s.outfits, s.outfit)) return fail();
  if (!s.journey || !integer(s.journey.stage, 0, 10) || !Array.isArray(s.journey.maps) || s.journey.maps.length !== 11) return fail();
  for (let stage = 0; stage <= 10; stage++) {
    const m = s.journey.maps[stage];
    if (!m || typeof m.cleared !== 'boolean') return fail();
    for (const [key, max] of [['berries', stageBerries(stage).length], ['monsters', stageMonsters(stage).length], ['trees', stageTrees(stage).length]] as const) if (!Array.isArray(m[key]) || m[key].some(id => !integer(id, 0, max - 1)) || new Set(m[key]).size !== m[key].length) return fail();
    if (stage > 0 && m.cleared !== (m.monsters.length === stageMonsters(stage).length)) return fail();
    if (stage > 1 && (m.cleared || m.monsters.length || m.berries.length || m.trees.length) && !s.journey.maps[stage - 1].cleared) return fail();
  }
  if (!canEnter(s, s.journey.stage)) return fail();
  const bounds = stageSize(s.journey.stage);
  if (!s.position || !Number.isFinite(s.position.x) || !Number.isFinite(s.position.z) || Math.abs(s.position.x) > bounds.x || Math.abs(s.position.z) > bounds.z) return fail();
  if (!s.tutorial || ['collected', 'battle', 'shop'].some(k => typeof s.tutorial[k as keyof Save['tutorial']] !== 'boolean')) return fail();
  if (!s.settings || ['music', 'sound', 'lowQuality'].some(k => typeof s.settings[k as keyof Save['settings']] !== 'boolean')) return fail();
  return structuredClone(s);
}
export class Encounter {
  question: Question; solved = false; monster: number; arena: boolean;
  constructor(monster: number, arena: boolean, level: number, previous?: Question) { this.monster = monster; this.arena = arena; this.question = pickQuestion(level, previous); }
  answer(value: string): 'correct' | 'wrong' | 'ignored' {
    if (this.solved) return 'ignored';
    if (!/^\d{1,2}$/.test(value) || Number(value) !== this.question.answer) return 'wrong';
    this.solved = true; return 'correct';
  }
}
