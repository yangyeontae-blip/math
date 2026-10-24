/** 운영자 공지. 수정 후 두 게임과 보조 주소를 다시 배포합니다. */
export interface VillageNotice {
  id: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  body: string;
  pinned: boolean;
}

export const VILLAGE_NOTICES: readonly VillageNotice[] = [
  {
    id: 'welcome-2026-10-24',
    title: '🌳 베리숲에 오신 모험가 여러분, 환영합니다!',
    publishedAt: '2026-10-24',
    body: '안녕하세요, 모험가 여러분! 베리숲 운영자입니다. 🍓\n\n베리숲에 찾아와 주셔서 정말 반갑습니다. 숲길을 따라 모험하고, 귀여운 펫과 친구가 되고, 나만의 마을도 꾸미며 즐거운 시간을 보내 주세요. 어려운 문제가 나와도 괜찮아요. 힌트를 보며 천천히, 여러분만의 속도로 모험하시면 됩니다.\n\n모험하다 불편했던 순간이 있었나요? 마음에 쏙 들었던 점이나 “이런 것도 있으면 좋겠어요!” 하는 아이디어도 들려주세요. 게임 화면의 「의견 보내기」를 눌러 편하게 남겨주시면 됩니다. 함께하시는 보호자님의 의견도 환영합니다.\n\n보내주신 이야기는 하나하나 소중히 살펴보고, 더 즐겁고 편안한 베리숲이 되도록 최대한 개선해 나가겠습니다. 의견을 적으실 때는 이름이나 학교, 연락처 같은 개인정보는 넣지 말아 주세요.\n\n여러분의 작은 한마디가 베리숲을 더 좋은 모험의 공간으로 만들어 줍니다. 오늘도 베리숲에서 즐거운 추억을 만들어 가세요!\n\n따뜻한 마음을 담아,\n베리숲 운영자 드림',
    pinned: true,
  },
  {
    id: 'notice-board-2026-10-18',
    title: '마을 공지판에 오신 것을 환영해요!',
    publishedAt: '2026-10-18',
    body: '이곳은 운영자가 베리숲의 새로운 소식과 이용 안내를 전하는 공지판이에요.\n\n글을 골라 운영자의 소식을 읽어 보세요. 모험을 떠나려면 공지판을 닫고 「지도 → 숲으로 모험」을 선택해 주세요.',
    pinned: true,
  },
];

export function sortedNotices(notices: readonly VillageNotice[] = VILLAGE_NOTICES): VillageNotice[] {
  return [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}

function text(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function noticeListHtml(notices: readonly VillageNotice[] = VILLAGE_NOTICES): string {
  const list = sortedNotices(notices);
  return `<p class="notice-intro">운영자가 전하는 베리숲의 소식이에요.</p><div class="notice-list">${list.length ? list.map(n => `<button class="secondary notice-card" data-notice="${text(n.id)}"><span>${n.pinned ? '<small class="notice-pin">📌 중요 공지</small>' : ''}<strong>${text(n.title)}</strong><time datetime="${text(n.publishedAt)}">${text(n.publishedAt)}</time></span><span aria-hidden="true">›</span></button>`).join('') : '<p class="notice-empty" role="status">아직 등록된 소식이 없어요.</p>'}</div>`;
}

export function noticeDetailHtml(notice: VillageNotice): string {
  return `<article class="notice-article" aria-labelledby="notice-title"><h3 id="notice-title" tabindex="-1">${text(notice.title)}</h3><time datetime="${text(notice.publishedAt)}">${text(notice.publishedAt)}</time><p class="notice-body">${text(notice.body)}</p></article><button class="secondary wide" id="notice-back">← 공지 목록</button>`;
}
