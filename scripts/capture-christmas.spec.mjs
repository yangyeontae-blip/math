import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { newSave } from '../src/rules.ts';
// 크리스마스 광장 확인 캡처(?event=christmas로 강제 표시). 실행: npx playwright test -c scripts/capture.config.mjs
const OUT = process.env.ART_OUT || '../screenshots/christmas_2026-11-26';
mkdirSync(OUT, { recursive: true });
for (const [name, vp] of [['pc', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }], ['low', { width: 844, height: 390 }]]) {
  test(`christmas ${name}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize(vp);
    await page.route('**/api/donation', r => r.fulfill({ contentType: 'application/json', body: '{"total":0,"gifts":0}' }));
    const s = newSave('베리', 0, 3); s.settings.lowQuality = true; s.settings.music = s.settings.sound = false; s.tutorial = { collected: true, battle: true, shop: true };
    await page.goto('/?event=christmas', { waitUntil: 'domcontentloaded' });
    await page.evaluate(s => { localStorage.clear(); localStorage.setItem('berry-forest-save-v1', JSON.stringify(s)); localStorage.setItem('berry-forest-ambience-v1', 'off'); }, s);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#continue').click();
    await expect(page.locator('#hud')).toBeVisible({ timeout: 30000 });
    await page.locator('body.is-christmas').waitFor({ state: 'attached', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${name}-plaza.png` });
  });
}
