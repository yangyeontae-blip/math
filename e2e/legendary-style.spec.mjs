import { test, expect } from '@playwright/test';
import { newSave, HAIRSTYLES } from '../src/rules.ts';

const SAVE = 'berry-forest-save-v1';
async function saved(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
}
async function start(page, berries) {
  const fixture = newSave('숲꾸밈모험가', 0, 3);
  fixture.berries = berries;
  fixture.settings.lowQuality = true;
  fixture.settings.music = fixture.settings.sound = false;
  fixture.tutorial = { collected: true, battle: true, shop: true };
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Playwright gives each test its own storage; only a synthetic adventure is installed.
  await page.evaluate(({ key, save }) => {
    localStorage.clear();
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('berry-forest-ambience-v1', 'off');
  }, { key: SAVE, save: fixture });
  await resume(page);
  return fixture;
}
async function resume(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#continue').click();
  await expect(page.locator('#hud')).toBeVisible({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => !!window.__berry), { timeout: 30000 }).toBe(true);
}
function expectNoLearningCredit(state, fixture) {
  const { elapsedSeconds, ...learningCredit } = state.learning;
  const { elapsedSeconds: initialElapsed, ...initialCredit } = fixture.learning;
  // Ordinary play time may advance; purchases must not create answers or review credit.
  expect(learningCredit).toEqual(initialCredit);
  expect(elapsedSeconds).toBeGreaterThanOrEqual(initialElapsed);
  expect(state.career.stats).toEqual(fixture.career.stats);
  expect(state.career.practiced).toEqual(fixture.career.practiced);
}

test('legendary Ppojjaki purchase, guardian title, reload and resting preserve ownership without learning credit', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const fixture = await start(page, 150000);
  await page.evaluate(() => window.__berry.openPetShop(20));
  await expect(page.locator('[data-shop-pet="20"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.collection-detail .pet-hero')).toContainText('[전설]');
  await expect(page.locator('#buy-pet')).toBeEnabled();await page.screenshot({path:info.outputPath('ppo-shop.png')});
  await page.locator('#buy-pet').click();
  await expect.poll(async () => (await saved(page)).pet, { timeout: 30000 }).toBe(20);
  let state = await saved(page);
  expect(state.pets['20']).toBe(true);
  expect(state.berries).toBe(0);
  await page.evaluate(() => window.__berry.closeModal());
  await expect(page.locator('#guardian-title')).toBeVisible();
  await expect(page.locator('#guardian-title')).toHaveText(/뽀짝이의\s*수호자/);
  await page.screenshot({path:info.outputPath('ppo-aura.png')});expectNoLearningCredit(state, fixture);

  await resume(page);
  state = await saved(page);
  expect(state.pet).toBe(20);
  expect(state.pets['20']).toBe(true);
  expect(state.berries).toBe(0);
  await expect(page.locator('#guardian-title')).toBeVisible();
  await page.evaluate(() => window.__berry.openInventory('pet', 20));
  await expect(page.locator('#collection-rest')).toBeEnabled();
  await page.locator('#collection-rest').click();
  await expect.poll(async () => (await saved(page)).pet, { timeout: 30000 }).toBe(-1);
  await page.evaluate(() => window.__berry.closeModal());
  await expect(page.locator('#guardian-title')).toBeHidden();
  state = await saved(page);
  expect(state.pets['20']).toBe(true);
  expect(state.berries).toBe(0);
  expectNoLearningCredit(state, fixture);
  expect(errors).toEqual([]);
});

test('salon hairstyles have distinct portraits and purchasing persists while owned restyling stays free', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const fixture = await start(page, 10000);
  await expect.poll(() => page.evaluate(() => typeof window.__berry.openBeauty), { timeout: 30000 }).toBe('function');
  await page.evaluate(() => window.__berry.openBeauty('hairstyle', 6));
  const ids = [1, 2, 6, 8, 9];
  for (const id of ids) await expect(page.locator(`[data-salon-image="${id}"]`)).toHaveAttribute('src', /^data:image\//);
  const portraits = await Promise.all(ids.map(id => page.locator(`[data-salon-image="${id}"]`).getAttribute('src')));
  expect(new Set(portraits).size).toBe(ids.length);
  expect(portraits[ids.indexOf(6)]).not.toBe(portraits[ids.indexOf(8)]);
  expect((await saved(page)).berries).toBe(10000);await page.screenshot({path:info.outputPath('salon-hair.png')});
  await page.locator('#buy-look').click();
  await expect.poll(async () => (await saved(page)).hairstyle, { timeout: 30000 }).toBe(6);
  const balance = 10000 - HAIRSTYLES[6].price;
  let state = await saved(page);
  expect(state.hairstyles['6']).toBe(true);
  expect(state.berries).toBe(balance);

  await resume(page);
  state = await saved(page);
  expect(state.hairstyle).toBe(6);
  expect(state.hairstyles['6']).toBe(true);
  await page.evaluate(() => window.__berry.openBeauty('hairstyle', 6));
  await expect(page.locator('#buy-look')).toBeDisabled();
  await page.evaluate(id => window.__berry.openBeauty('hairstyle', id), fixture.hairstyle);
  await page.locator('#buy-look').click();
  await expect.poll(async () => (await saved(page)).hairstyle, { timeout: 30000 }).toBe(fixture.hairstyle);
  expect((await saved(page)).berries).toBe(balance);
  await page.evaluate(() => window.__berry.openBeauty('hairstyle', 6));
  await page.locator('#buy-look').click();
  await expect.poll(async () => (await saved(page)).hairstyle, { timeout: 30000 }).toBe(6);
  state = await saved(page);
  expect(state.berries).toBe(balance);
  expectNoLearningCredit(state, fixture);
  expect(errors).toEqual([]);
});
