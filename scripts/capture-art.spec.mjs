import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { newSave } from '../src/rules.ts';

// 그림 깨짐 수리 전/후 캡처(2026-11-26). scripts 폴더에서 npx playwright test -c capture.config.mjs capture-art (ART_OUT=../screenshots/after_art_... 로 바꿔 저장).
const OUT = process.env.ART_OUT || '../screenshots/before_art_2026-11-26';
mkdirSync(OUT, { recursive: true });
const finish = page => page.evaluate(() => document.getAnimations().forEach(a => a.finish()));
async function start(page) {
  await page.route('**/api/donation', r => r.fulfill({ contentType: 'application/json', body: '{"total":0,"gifts":0}' }));
  const s = newSave('베리', 0, 3); s.level = 300; s.berries = 50000;
  s.settings.lowQuality = true; s.settings.music = s.settings.sound = false; s.tutorial = { collected: true, battle: true, shop: true };
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => { localStorage.clear(); localStorage.setItem('berry-forest-save-v1', JSON.stringify(s)); localStorage.setItem('berry-forest-ambience-v1', 'off'); }, s);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#continue').click();
  await expect(page.locator('#hud')).toBeVisible({ timeout: 30000 });
}
for (const [name, vp] of [['pc', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }], ['low', { width: 844, height: 390 }]]) {
  test(`capture ${name}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize(vp);
    await start(page);
    const shot = async (id, open) => { await page.evaluate(open); await page.waitForTimeout(600); await finish(page); await page.screenshot({ path: `${OUT}/${name}-${id}.png` }); await page.evaluate(() => window.__berry.closeModal()); };
    await finish(page); await page.screenshot({ path: `${OUT}/${name}-hud.png` });
    await shot('math-forest', () => window.__berry.openAdventureMap());
    await shot('hunting', () => window.__berry.huntingMenu());
    await shot('fishing', () => window.__berry.openFishing());
    await shot('settings', () => window.__berry.openSettings());
    await shot('school', () => window.__berry.careerSchool());
    await shot('workshop', () => window.__berry.openPotionWorkshop());

  });
}
