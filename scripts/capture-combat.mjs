import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { newSave } from '../src/rules.ts';
import { ACADEMY_SKILLS } from '../src/academy.ts';

const phase = process.argv[2] || 'after';
const base = process.env.COMBAT_URL || 'http://127.0.0.1:4175';
mkdirSync(`screenshots/combat/${phase}`, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', e => { if (e.type() === 'error' && /Shader|WebGLProgram/.test(e.text())) errors.push(e.text()); });
// Isolate all records and prevent contact with public game services.
await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
const save = newSave('숲모험가', 0, 3);
save.level = 200; save.tutorial = { collected: true, battle: true, shop: true };
save.settings.music = save.settings.sound = false;
save.settings.lowQuality = false;
save.career.job = 'knight';
for (const job of ['knight', 'mage', 'ranger', 'druid', 'alchemist', 'bard']) save.career.ranks[job] = save.career.trials[job] = 5;
save.career.learned = ACADEMY_SKILLS.map(s => s.id);
save.career.loadouts.knight = ['crescent', 'dawnCrown', 'solarOath', 'roots'];
await page.goto(base);
await page.evaluate(s => { localStorage.clear(); localStorage.setItem('berry-forest-save-v1', JSON.stringify(s)); localStorage.setItem('berry-forest-ambience-v1', 'off'); localStorage.setItem('berry-display-v1', JSON.stringify({ clean: false, view: 'near' })); }, save);
await page.reload(); await page.locator('#continue').click();
await page.waitForFunction(() => window.__berry?.getWorld()?.active);
async function arena(zone = 0, job = 'knight') {
  await page.evaluate(({ zone, job }) => {
    const w = window.__berry.getWorld(), s = window.__berry.getState();
    w.configureCombat({ job, learned: s.career.learned, loadout: s.career.learned });
    w.enterHunting(s, zone); w.quality(s.settings.lowQuality); w.setPaused(false);
    const e = w.huntingStatus.enemies[0]; w.player.position.set(e.x, 0, e.z + 2); w.player.rotation.y = Math.PI; w.follow.copy(w.player.position);
  }, { zone, job });
  await page.waitForTimeout(180);
}
for (const zone of [0, 1, 2]) { await arena(zone); await page.screenshot({ path: `screenshots/combat/${phase}/monsters-zone-${zone}.png` }); }
for (const [id, job] of [['basic', 'knight'], ['crescent', 'knight'], ['solarOath', 'knight'], ['cosmicGenesis', 'mage'], ['everbloom', 'druid'], ['oceanSymphony', 'bard']]) {
  await arena(0, job);
  await page.evaluate(id => id === 'basic' ? window.__berry.getWorld().huntAttack() : window.__berry.getWorld().useHuntSkill(id), id);
  await page.waitForTimeout(id === 'basic' ? 120 : 240);
  await page.screenshot({ path: `screenshots/combat/${phase}/${id}.png` });
}
if (phase === 'after') {
  await arena(); await page.evaluate(() => { const w=window.__berry.getWorld(); w.quality(true); w.useHuntSkill('solarOath'); }); await page.waitForTimeout(200); await page.screenshot({path:`screenshots/combat/${phase}/low-quality.png`});
  await page.emulateMedia({reducedMotion:'reduce'}); await arena(); await page.evaluate(() => window.__berry.getWorld().useHuntSkill('solarOath')); await page.waitForTimeout(200); await page.screenshot({path:`screenshots/combat/${phase}/reduced-motion.png`});
  await page.emulateMedia({reducedMotion:'no-preference'}); await arena();
  await page.evaluate(()=>{const w=window.__berry.getWorld(),snapshot=w.huntingStatus;w.combatWorld.onEvent({type:'hit',enemyId:snapshot.enemies[0].id,skill:'basic',damage:123,critical:true},snapshot);});
  await page.waitForTimeout(200); await page.screenshot({path:`screenshots/combat/${phase}/critical-feedback.png`});
}
writeFileSync(`screenshots/combat/${phase}/capture.json`, JSON.stringify({ browser: 'system Chrome', base, errors }, null, 2));
await browser.close();
if (errors.length) throw Error(errors.join('\n'));
