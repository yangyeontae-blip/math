import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';

// 2026-11-26 광장 작은 기부함 + 낚시터 보상(낚은 베리·보물·등급 완성)을 실제 화면에서 확인해요. 기부 서버는 가짜로 대신해요.
async function start(page, s) {
  s.settings.lowQuality = true; s.settings.music = s.settings.sound = false; s.tutorial = { collected: true, battle: true, shop: true };
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => { localStorage.clear(); localStorage.setItem('berry-forest-save-v1', JSON.stringify(s)); localStorage.setItem('berry-forest-ambience-v1', 'off'); }, s);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#continue').click();
  await expect(page.locator('#hud')).toBeVisible({ timeout: 30000 });
}

test('donation box shows the shared total, takes berries only after the server accepts, and decorates the plaza', async ({ page }, info) => {
  test.setTimeout(120000);
  const box = { total: 123_456, gifts: 12 }, posted = []; let fail = false;
  await page.route('**/api/donation', async route => {
    const req = route.request();
    if (req.method() === 'POST') {
      if (fail) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '기부함이 잠시 쉬고 있어요.' }) });
      const body = req.postDataJSON(); posted.push(body); box.total += body.amount; box.gifts += 1;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, ...box }) });
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(box) });
  });
  const s = newSave('베리', 0, 3); s.level = 300; s.berries = 5000;
  await start(page, s);
  await expect.poll(() => page.evaluate(() => window.__berry.getWorld().donationGoals)).toBe(2);
  await page.screenshot({ path: info.outputPath('plaza-donation-box.png') });
  await page.evaluate(() => window.__berry.openDonation());
  await expect(page.locator('.donation-total strong')).toHaveText('123,456');
  await expect(page.locator('.donation-goals li.is-done')).toHaveCount(2);
  await page.evaluate(() => document.getAnimations().forEach(a => a.finish())); await page.screenshot({ path: info.outputPath('donation-box.png') });
  await page.locator('[data-donate="100"]').click();
  await expect(page.locator('.donation-total strong')).toHaveText('123,556');
  await expect(page.locator('.donation-mine')).toContainText('내가 낸 베리 100');
  expect(await page.evaluate(() => window.__berry.getState().berries)).toBe(4900);
  expect(Object.keys(posted[0]).sort()).toEqual(['amount', 'requestId']);
  fail = true;
  await page.locator('#donation-amount').fill('2a5');
  await expect(page.locator('#donation-amount')).toHaveValue('25');
  await page.locator('#donation-send').click();
  await expect(page.locator('.donation-paper .error')).toContainText('베리는 그대로예요');
  expect(await page.evaluate(() => window.__berry.getState().berries)).toBe(4900);
  await page.locator('#donation-amount').fill('9999');
  await page.locator('#donation-send').click();
  await expect(page.locator('.donation-paper .error')).toContainText('모자라요');
  await page.keyboard.press('Escape');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('berry-forest-save-v1')));
  expect(saved.donation).toEqual({ given: 100, gifts: 1 });
});

test('fishing pays berries per catch and a finished tier gives its reward button and title', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.route('**/api/donation', route => route.fulfill({ status: 503, body: '{}' }));
  const s = newSave('낚시왕', 0, 3); s.level = 300; s.berries = 1000;
  s.fishing.cards = Object.fromEntries(['pythagoras', 'hypatia', 'euler', 'newton', 'leibniz', 'choi-seokjeong', 'lovelace'].map(id => [id, 1]));
  await start(page, s);
  await page.evaluate(() => window.__berry.openFishing());
  await page.locator('#fish-cast').click();
  await expect(page.locator('.fishing-gain')).toContainText('베리');
  const after = await page.evaluate(() => window.__berry.getState().berries);
  expect(after).toBeGreaterThan(1000 - 50);
  await expect(page.locator('[data-fish-set="rare"]')).toBeVisible();
  await page.evaluate(() => document.getAnimations().forEach(a => a.finish())); await page.screenshot({ path: info.outputPath('fishing-rewards.png') });
  await page.locator('[data-fish-set="rare"]').click();
  await expect(page.locator('.fishing-set.is-done')).toContainText('반짝 물결 낚시꾼');
  expect(await page.evaluate(() => window.__berry.getState().berries)).toBe(after + 3000);
});
