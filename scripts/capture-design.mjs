import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw Error('Usage: node scripts/capture-design.mjs before|after');
process.chdir(resolve(import.meta.dirname, '..'));
// Keep the browser profile, compiler scratch files and caches inside this worktree.
const scratch = resolve('.design-tmp');
await mkdir(scratch, { recursive: true });
process.env.TEMP = process.env.TMP = scratch;
const build = spawnSync('cmd.exe', ['/d', '/s', '/c', 'pnpm build:browser'], { stdio: 'inherit', windowsHide: true });
if (build.status !== 0) throw Error('Browser build failed');
const origin = 'http://127.0.0.1:4184';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4184', '--strictPort'], { stdio: 'pipe', windowsHide: true });
let browser;
let browserChannel = 'chrome';
const output = resolve('screenshots', phase);
await mkdir(output, { recursive: true });
const results = [];
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(origin)).ok) break; } catch {} await new Promise(r => setTimeout(r, 150)); }
  const options = { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  try { browser = await chromium.launch({ ...options, channel: 'chrome' }); } catch { browserChannel = 'chromium'; browser = await chromium.launch(options); }
  for (const [device, viewport] of Object.entries({ pc: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } })) {
    const context = await browser.newContext({ viewport, isMobile: device === 'mobile', hasTouch: device === 'mobile', serviceWorkers: 'block' });
    await context.routeWebSocket('**/*', socket => socket.close());
    let mode = 'normal';
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/api/') || url.pathname === '/hall') {
        if (url.pathname.includes('weather')) return route.fulfill({ json: { region: 'cheongju', weather: 'clear', temp: 12 } });
        if (url.pathname.includes('ranking')) {
          if (mode === 'error') return route.abort('internetdisconnected');
          return route.fulfill({ json: { rankings: mode === 'empty' ? [] : [{ rank: 1, nickname: '베리', completed: 3, isMine: true }] } });
        }
        return route.fulfill({ status: 503, json: { error: 'not_ready' } });
      }
      if (url.origin !== origin && !/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('berry-forest-ambience-v1', 'off');
      localStorage.setItem('berry-display-v1', JSON.stringify({ clean: false, view: 'normal' }));
    });
    const snap = async name => {
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const file = `${device}-${name}.png`;
      await page.screenshot({ path: resolve(output, file), animations: 'disabled' });
      const audit = await page.evaluate(() => {
        const targets = '#new-game,#today-adventure,#character-desc,.save-note,.note,.ranking-note,.ranking-unavailable,.salon-ribbon,.salon-note,.salon-description,#save-status,.hall-notice';
        const styles = [...document.querySelectorAll(targets)].filter(el => el.checkVisibility()).map(el => {
          const s = getComputedStyle(el), r = el.getBoundingClientRect();
          return { selector: el.id ? '#' + el.id : '.' + el.classList[0], fontSize: s.fontSize, color: s.color, background: s.backgroundColor, top: Math.round(r.top), bottom: Math.round(r.bottom) };
        });
        const remainingUiEmoji = [...document.querySelectorAll('#hud button,#modal button')].filter(el => el.checkVisibility() && !el.closest('.curriculum-answers,.party-question,.story-activity,.tool-boards')).flatMap(el => {
          const marks = (el.textContent ?? '').match(/\p{Extended_Pictographic}/gu);
          return marks ? [{ selector: el.id ? '#' + el.id : el.tagName.toLowerCase(), marks: [...new Set(marks)] }] : [];
        });
        return { styles, remainingUiEmoji, fonts: [...document.fonts].map(font => ({ family: font.family, status: font.status })), horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
      });
      results.push({ device, screen: name, file, mode, audit });
      console.log(`${phase}: ${file}`);
    };
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.locator('#nickname-input').fill('베리');
    await page.locator('#start-avatar canvas').waitFor({ timeout: 30000 });
    await page.locator('#nickname-input').blur();
    await page.waitForTimeout(850);
    await page.locator('#start-screen').evaluate(el => el.scrollTop = 0);
    await snap('start');
    await page.locator('#new-game').click();
    await page.waitForFunction(() => window.__berry?.getWorld()?.active);
    await page.evaluate(() => {
      const s = window.__berry.getState(); s.level = 60; s.berries = 5000;
      s.settings.lowQuality = true; s.settings.music = s.settings.sound = false;
      s.tutorial = { collected: true, battle: true, shop: true };
      for (const map of s.journey.maps) map.cleared = true;
      window.__berry.persist(); window.__berry.refresh(); window.__berry.closeModal();
    });
    await snap('hud');
    await page.locator('#plaza-status').click();
    await snap('offline');
    await page.locator('.plaza-close').click();
    await page.evaluate(() => window.__berry.openArena());
    await page.locator('[data-practice-op="addition"]').click();
    await page.locator('#arena-start').click();
    await page.locator('#answer').waitFor();
    await snap('question');
    await page.evaluate(() => { window.__berry.closeModal(); window.__berry.openInventory(); });
    await snap('bag');
    await page.evaluate(() => { window.__berry.closeModal(); window.__berry.openShop('weapon'); });
    await snap('shop');
    await page.evaluate(() => { window.__berry.closeModal(); window.__berry.openBeauty(); });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-salon-image]')].every(img => img.complete && img.naturalWidth > 0), undefined, { timeout: 30000 });
    await snap('salon');
    await page.evaluate(() => { window.__berry.closeModal(); window.__berry.careerSchool(); });
    await snap('career');
    const board = async () => {
      await page.evaluate(() => window.__berry.closeModal());
      await page.locator('#stage-map').click();
      await page.locator('[data-nav="explore"]').first().click();
      await page.locator('[data-nav="expedition"]').click();
      await page.locator('[data-rank-tab="global"]').waitFor();
      await page.locator('#global-ranking-panel .ranking-loading').waitFor({ state: 'detached' });
    };
    await board();
    await snap('expedition');
    await page.locator('#global-ranking-panel').scrollIntoViewIfNeeded();
    await snap('ranking');
    mode = 'empty'; await board(); await page.locator('#global-ranking-panel').scrollIntoViewIfNeeded(); await snap('ranking-empty');
    mode = 'error'; await board(); await page.locator('#global-ranking-panel').scrollIntoViewIfNeeded(); await snap('ranking-error');
    await page.evaluate(() => { window.__berry.closeModal(); document.querySelector('#boss-open').click(); });
    await page.locator('#boss-class-code').fill('모험');
    await page.locator('#boss-save').click();
    await page.waitForTimeout(700);
    await snap('server-unavailable');
    await context.close();
    const failure = await browser.newContext({ viewport, serviceWorkers: 'block' });
    await failure.routeWebSocket('**/*', socket => socket.close());
    await failure.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === origin || /fonts\.(googleapis|gstatic)\.com/.test(url.hostname) ? route.continue() : route.abort();
    });
    const errorPage = await failure.newPage();
    await errorPage.goto(origin);
    await errorPage.locator('#nickname-input').fill('베리');
    await errorPage.locator('#nickname-input').blur();
    await errorPage.evaluate(() => document.fonts.ready);
    await errorPage.waitForTimeout(1500);
    await errorPage.locator('#start-screen').evaluate(el => el.scrollTop = 0);
    await errorPage.screenshot({ path: resolve(output, `${device}-weather-error.png`), animations: 'disabled' });
    results.push({ device, screen: 'weather-error', file: `${device}-weather-error.png`, mode: 'weather-error' });
    await failure.close();
  }
  await writeFile(resolve(output, 'capture.json'), JSON.stringify({ phase, browserChannel, browserVersion: browser.version(), viewportNotes: 'Viewport captures; ranking is scrolled into view. All online responses are fixtures; no real records are submitted.', results }, null, 2));
} finally { await browser?.close(); server.kill(); }
