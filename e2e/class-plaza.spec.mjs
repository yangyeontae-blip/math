import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';

// 2026-11-27 우리 반 광장: 선생님이 반 코드를 만들고, 같은 코드를 넣은 친구만 광장에서 만나요.
test.describe.configure({ timeout: 180000 });
async function start(page, nickname, teacher = false, url = '/') {
  const s = newSave(nickname, 0, 3); s.level = 30; s.teacherMode = teacher;
  s.settings.music = s.settings.sound = false; s.settings.lowQuality = true; s.tutorial = { collected: true, battle: true, shop: true };
  await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('berry-forest-save-v1', JSON.stringify(s)); localStorage.setItem('berry-forest-ambience-v1', 'off'); sessionStorage.setItem('seeded', '1'); } }, s);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('#continue').click({ timeout: 60000 });
  await expect(page.locator('#hud')).toBeVisible({ timeout: 30000 });
}

test('teacher makes a class code; only friends with the same code meet in the plaza', async ({ page, browser }, info) => {
  if (info.project.name === 'mobile') test.skip();
  await start(page, '선생님', true);
  await page.locator('#plaza-status').click();
  await page.locator('.plaza-class-make').click();
  const made = await page.locator('.plaza-class-made').textContent();
  const code = /([A-Z0-9]{4}-[A-Z0-9]{3})/.exec(made ?? '')?.[1];
  expect(code).toBeTruthy();
  await expect(page.locator('.plaza-class b')).toContainText('우리 반 광장 · ' + code);
  await expect(page.locator('#plaza-status')).toContainText('우리 반 광장', { timeout: 30000 });
  await page.screenshot({ path: info.outputPath('class-plaza-teacher.png') });
  await page.locator('.plaza-close').click();

  const peerBrowser = await browser.browserType().launch({ ...info.project.use.launchOptions, channel: info.project.use.channel, headless: true });
  try {
    const classmate = await (await peerBrowser.newContext({ viewport: page.viewportSize() })).newPage();
    await start(classmate, '반친구', false, page.url());
    await classmate.locator('#plaza-status').click();
    await classmate.locator('#plaza-class-code').fill('zzzz-zzz');
    await classmate.locator('.plaza-class-join').click();
    await expect(classmate.locator('.plaza-class-error')).toContainText('반 코드가 맞지 않아요');
    await classmate.locator('#plaza-class-code').fill(code.toLowerCase());
    await classmate.locator('.plaza-class-join').click();
    await expect(classmate.locator('#plaza-status')).toContainText('우리 반 광장 · 2명', { timeout: 30000 });
    await expect(page.locator('.plaza-nameplate:not(.is-self)')).toContainText('반친구', { timeout: 30000 });

    // 다른 반 친구와 섞이지 않는 것은 광장 서버 검사(realtime/plaza.test.mjs)가 확인해요.
    await classmate.screenshot({ path: info.outputPath('class-plaza-classmate.png') });
    await classmate.locator('.plaza-class-leave').click();
    await expect(classmate.locator('#plaza-status')).toContainText('함께하는 광장', { timeout: 30000 });
    await expect(page.locator('#plaza-status')).toContainText('1명', { timeout: 30000 });
  } finally { await peerBrowser.close(); }
});
