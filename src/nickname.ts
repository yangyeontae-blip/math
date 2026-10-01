// 초등학생 대상 서비스라 부적절한 닉네임은 전체 랭킹에 올리지 않아요.
// worker/index.js의 BLOCKED_WORDS와 같은 목록이에요(tests/nickname.test.ts가 일치를 확인해요).
export const BLOCKED_WORDS = ['시발', '씨발', '씨바', '시바', '병신', '븅신', '지랄', '좆', '조까', '존나', '개새끼', '새끼', '미친놈', '미친년', '염병', '엿먹', '아가리', '닥쳐', '느금', '니미', '섹스', '야동', '자지', '보지', '걸레', '창녀', '꺼져', '죽어', '죽인다', 'fuck', 'shit', 'bitch', 'sex', 'porn', 'dick', 'pussy', 'nigg', 'asshole'];

export function isBlockedNickname(nickname: string): boolean {
  const flat = nickname.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return BLOCKED_WORDS.some(word => flat.includes(word));
}
