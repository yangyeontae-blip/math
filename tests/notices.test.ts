import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VILLAGE_NOTICES, sortedNotices, noticeListHtml, noticeDetailHtml, type VillageNotice } from '../src/notices';

const notice = (id: string, publishedAt: string, pinned = false): VillageNotice => ({ id, publishedAt, pinned, title: id, body: '첫 문단\n\n다음 문단' });
test('공지: 고정 우선, 각 그룹 최신순, 원본 순서 보존', () => {
  const input = [notice('old', '2026-01-01'), notice('new', '2026-10-18'), notice('pin', '2025-01-01', true)];
  assert.deepEqual(sortedNotices(input).map(n => n.id), ['pin', 'new', 'old']);
  assert.deepEqual(input.map(n => n.id), ['old', 'new', 'pin']);
});
test('공지: 빈 목록과 긴 본문을 손실 없이 표시하고 HTML은 실행하지 않음', () => {
  assert.match(noticeListHtml([]), /아직 등록된 소식/);
  const n = { ...notice('a" onclick="bad', '2026-10-18'), title: '<script>&"\'', body: '<img src=x onerror=bad>\n\n' + '긴 글'.repeat(3000) };
  const html = noticeDetailHtml(n);
  assert.ok(!html.includes('<script>') && !html.includes('<img'));
  assert.ok(html.includes('&lt;img') && html.includes('긴 글'.repeat(3000)) && html.includes('\n\n'));
  assert.ok(noticeListHtml([n]).includes('a&quot; onclick=&quot;bad'));
});
test('공지: 운영자 데이터의 고유 ID와 유효한 게시일', () => {
  assert.equal(new Set(VILLAGE_NOTICES.map(n => n.id)).size, VILLAGE_NOTICES.length);
  for (const n of VILLAGE_NOTICES) { assert.match(n.publishedAt, /^\d{4}-\d{2}-\d{2}$/); assert.equal(new Date(n.publishedAt).toISOString().slice(0, 10), n.publishedAt); assert.ok(n.title.trim() && n.body.trim()); }
});
