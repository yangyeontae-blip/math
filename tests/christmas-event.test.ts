import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHRISTMAS_END, christmasActive } from '../src/christmas-event';
import { CHRISTMAS_LINES, GREETINGS, pickLine } from '../src/npc-lines';
import { VILLAGE_NOTICES, sortedNotices } from '../src/notices';

test('Christmas ends exactly at midnight after December 25 in Korea', () => {
  const settings = { seasonalEvents: true, search: '' };
  assert.equal(CHRISTMAS_END, Date.parse('2026-12-25T15:00:00Z'));
  assert.equal(christmasActive(CHRISTMAS_END - 1, settings), true);
  assert.equal(christmasActive(CHRISTMAS_END, settings), false);
  assert.equal(christmasActive(CHRISTMAS_END + 1, settings), false);
});

test('existing seasonal preference opts out, explicit Christmas preview overrides it and expiry', () => {
  assert.equal(christmasActive(CHRISTMAS_END - 1, { seasonalEvents: false, search: '' }), false);
  assert.equal(christmasActive(CHRISTMAS_END + 1, { seasonalEvents: false, search: '?event=christmas' }), true);
  assert.equal(christmasActive(CHRISTMAS_END + 1, { seasonalEvents: true, search: '?event=other' }), false);
});

test('Christmas greetings are opt-in, short, and do not repeat a single seasonal line', () => {
  for (const [id, lines] of Object.entries(CHRISTMAS_LINES)) {
    for (const line of lines) assert.ok(line.length <= 40);
    assert.ok(GREETINGS[id].includes(pickLine(id, () => 0, { christmas: false })!));
    assert.ok(lines.includes(pickLine(id, () => 0, { christmas: true })!));
  }
  const previous = CHRISTMAS_LINES.journey[0];
  assert.notEqual(pickLine('journey', () => 0, { christmas: true }, previous), previous);
  const expired = christmasActive(CHRISTMAS_END, { seasonalEvents: true, search: '' });
  assert.ok(GREETINGS.hallGuide.includes(pickLine('hallGuide', () => 0, { christmas: expired })!));
});

test('Christmas notice is temporary and unpinned; postbox remains first', () => {
  const notice = VILLAGE_NOTICES.find(n => n.id === 'christmas-2026')!;
  assert.equal(notice.christmas, true); assert.equal(notice.pinned, false);
  assert.equal(sortedNotices()[0].id, 'postbox-2026-11-23');
  assert.ok(!VILLAGE_NOTICES.filter(n => !n.christmas || christmasActive(CHRISTMAS_END, { search: '' })).includes(notice));
});
