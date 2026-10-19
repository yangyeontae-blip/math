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
