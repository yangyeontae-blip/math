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

test('공지: 세계 2 요청 범위와 이후 친구 서버 계획을 고정 공지로 안내한다',()=>{const latest=VILLAGE_NOTICES.find(n=>n.id==='world-two-plan-2026-11-03')!;assert.ok(latest);assert.equal(latest.pinned,true);assert.equal(latest.body,'의견 보내기를 검토한 결과 ‘세계 2의 지역 3곳 + 새 장비 12종 + 혼자 도전 가능한 보스 1종’를 추가하고, 이후에 서버를 만들어 친구들과 만날 수 있도록 하겠습니다.');});

test('공지: 렉 완화 안내는 실제 설정과 저장 후 새로고침 순서를 안내한다',()=>{const n=sortedNotices()[0];assert.equal(n.id,'lag-help-2026-11-05');assert.ok(n.pinned);for(const label of ['가벼운 화면','계절과 날씨 이벤트','혼자 다니기','친구들과 만나기','저장 파일 내려받기','의견 보내기'])assert.ok(n.body.includes(label));assert.ok(n.body.indexOf('저장 파일 내려받기')<n.body.indexOf('새로고침'));assert.ok(!/캐시.*삭제|저장소.*삭제/.test(n.body));});
