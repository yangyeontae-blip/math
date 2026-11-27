// 우리 반 광장(2026-11-27): 선생님이 만든 반 코드를 넣은 친구들끼리만 중앙 광장에서 만나요.
// 코드는 헷갈리는 글자(0·O·1·I)를 뺀 6글자 + 맞춤 글자 1개 = 7글자예요. 맞춤 글자가 틀리면 받지 않아서,
// 아이가 아무렇게나 친 코드로 다른 반 방에 섞여 들어가기 어렵고, 선생님 코드는 서로 겹치지 않아요.
// 서버(realtime/index.mjs)도 이 파일로 코드를 확인해요. 이름·학교는 코드에 들어가지 않아요.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KEY = 'berry-forest-class-room-v1';

function checkLetter(body: string) {
  // 글자 하나만 틀려도 맞춤 글자가 대부분 달라지도록 잘 섞어요(FNV-1a).
  let h = 0x811c9dc5;
  for (const ch of 'berry-class:' + body) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return ALPHABET[h % ALPHABET.length];
}

/** 선생님용: 새 반 코드 하나를 만들어요. */
export function makeClassCode(random: () => number = Math.random) {
  let body = '';
  for (let i = 0; i < 6; i++) body += ALPHABET[Math.min(ALPHABET.length - 1, Math.floor(random() * ALPHABET.length))];
  return body + checkLetter(body);
}

/** 띄어쓰기·하이픈·소문자를 정리하고, 맞춤 글자까지 맞는 코드만 돌려줘요. */
export function normalizeClassRoomCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z0-9]{7}$/.test(code) || [...code].some(ch => !ALPHABET.includes(ch))) return null;
  return checkLetter(code.slice(0, 6)) === code[6] ? code : null;
}

/** 칠판에 적기 좋게 4-3으로 나눠 보여 줘요. */
export const formatClassCode = (code: string) => code.slice(0, 4) + '-' + code.slice(4);
/** 광장 서버의 방 이름. 모두의 광장(central-plaza-v1)과 겹치지 않아요. */
export const classRoomKey = (code: string) => 'class-plaza:' + code;

export function readClassRoom(storage: Pick<Storage, 'getItem'>): string | null {
  try { return normalizeClassRoomCode(storage.getItem(KEY)); } catch { return null; }
}
export function writeClassRoom(storage: Pick<Storage, 'setItem' | 'removeItem'>, code: string | null) {
  try { if (code) storage.setItem(KEY, code); else storage.removeItem(KEY); } catch { /* 저장이 막혀도 이번 접속에서는 그대로 써요. */ }
}
