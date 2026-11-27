import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';

// 2026-11-27 광장 벤치에 앉기: 가까이 가서 앉고, 움직이면 일어나요.
test('player can sit on a plaza bench and stands up when moving', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.route('**/api/donation', r => r.fulfill({ contentType: 'application/json', body: '{"total":0,"gifts":0}' }));
  const s = newSave('베리', 0, 3); s.settings.lowQuality = true; s.settings.music = s.settings.sound = false; s.tutorial = { collected: true, battle: true, shop: true };
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => { localStorage.clear(); localStorage.setItem('berry-forest-save-v1', JSON.stringify(s)); localStorage.setItem('berry-forest-ambience-v1', 'off'); }, s);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#continue').click();
  await expect(page.locator('#hud')).toBeVisible({ timeout: 30000 });
  const sat = await page.evaluate(() => { const w = window.__berry.getWorld(); w.player.position.set(-8, 0, .4); return w.sitOnBench('benchPlaza0'); });
  expect(sat).toBe(true);
  const pose = await page.evaluate(() => { const w = window.__berry.getWorld(); return { status: w.roomActivityStatus, y: w.player.userData.body.position.y, x: w.player.position.x, z: w.player.position.z }; });
  expect(pose.status?.kind).toBe('sit');
  expect(pose.y).toBeGreaterThan(.3);
  expect(Math.hypot(pose.x + 8, pose.z + 1)).toBeLessThan(.5);
  await expect(page.locator('.room-activity-panel')).toContainText('벤치에서 쉬는 중');
  await page.evaluate(() => document.getAnimations().forEach(a => { try { a.finish(); } catch {} }));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: info.outputPath('bench-sit.png') });
  expect(await page.evaluate(() => window.__berry.getWorld().sitOnBench('benchPlaza1'))).toBe(false);
  await page.locator('.room-activity-panel [data-room-life="stop"]').click();
  expect(await page.evaluate(() => window.__berry.getWorld().roomActivityStatus)).toBeNull();
  expect(await page.evaluate(() => window.__berry.getWorld().player.userData.body.position.y)).toBe(0);
});
