import assert from 'node:assert/strict';
import test from 'node:test';
import { newSave } from '../src/rules.ts';
import { renderWorldTwo } from '../src/world-two-ui.ts';

test('World 2 sheet shows the way to World 3 at the top', () => {
  const html = renderWorldTwo(newSave('베리', 0, 3));
  const banner = html.indexOf('world-three-banner'), regions = html.indexOf('world-two-regions');
  assert.ok(banner > 0 && banner < regions, 'banner comes before the region list');
  assert.match(html, /data-career-action="open-world3">🌈 세계 3</);
  assert.match(html, /레벨 \d+이 되면 바로 들어갈 수 있어요/);
  const strong = newSave('베리', 0, 3); strong.level = 700;
  const openHtml = renderWorldTwo(strong);
  assert.match(openHtml, /data-career-action="enter-world2" data-region="10">세계 3으로 바로 출발/);
});
