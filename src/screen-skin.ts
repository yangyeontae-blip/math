// 기본 모양으로 남아 있던 창에 Codex 수채화 머리 그림을 입힌다(2026-11-23, 선생님 요청 "기본 UI 전부 그림 UI로").
// 창 구조는 그대로 두고, 제목(h2)으로 어떤 그림을 쓸지 고른다.
export const SCREEN_SKINS: Record<string, string> = {
  '소리·화면·저장·교사용': 'settings',
  '하루 5분 모험': 'daily',
  '도움말': 'guide',
  '학습 기록': 'notebook',
  '친구·아이템': 'notebook',
  '내 방 꾸미기': 'room',
  '선생님·보호자와 함께 봐요': 'report',
  '다섯 번의 작은 도전': 'arena',
  '베리숲을 즐겁고 안전하게 이용해요': 'guide',
  '함께 베리숲을 다듬어요': 'daily',
};
export function screenSkin(heading: string | null | undefined): string {
  return SCREEN_SKINS[(heading ?? '').trim()] ?? '';
}
