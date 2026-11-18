import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';
import { ACADEMY_SKILLS } from '../src/academy.ts';

test('combat presentation compiles every skill, preserves pause and responds live to reduced motion', async ({page},info) => {
  test.setTimeout(240000);
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/Shader|WebGLProgram/.test(e.text()))errors.push(e.text());});
  const s=newSave('숲모험가',0,3);s.level=200;s.tutorial={collected:true,battle:true,shop:true};s.settings.music=s.settings.sound=false;s.settings.lowQuality=false;
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');localStorage.setItem('berry-display-v1',JSON.stringify({clean:false,view:'near'}));},s);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await page.waitForFunction(()=>window.__berry?.getWorld()?.active);
  for(const job of ['knight','mage','ranger','druid','alchemist','bard']){
    const ids=ACADEMY_SKILLS.filter(s=>s.job===job||!s.job).map(s=>s.id);
    for (const id of ids) {
      const cast=await page.evaluate(({job,id})=>{const w=window.__berry.getWorld(),s=window.__berry.getState();w.enterTraining(s,{job,mode:'multi',skills:[id]});w.setPaused(false);const e=w.huntingStatus.enemies[0];w.player.position.set(e.x,0,e.z+1.5);w.follow.copy(w.player.position);w.player.rotation.y=Math.PI;return w.useHuntSkill(id);},{job,id});
      expect(cast,id+' casts from a fresh practice encounter').toBe(true); await page.waitForTimeout(80);
    }
    await page.waitForTimeout(120);
    await page.screenshot({path:info.outputPath(`combat-${job}.png`)});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{const w=window.__berry.getWorld(),s=window.__berry.getState();w.enterTraining(s,{job:'mage',mode:'multi',skills:['cosmicGenesis']});w.setPaused(false);w.player.position.set(0,0,-1);w.useHuntSkill('cosmicGenesis');});
  await page.waitForTimeout(200);
  const reduced=await page.evaluate(()=>{const w=window.__berry.getWorld(),root=w.combatWorld.root.getObjectByName('combat-vfx');return {sparks:root.children[0].count,layers:root.children.filter(c=>c.type==='Group').map(g=>g.children.filter(c=>c.visible).length),flashes:w.combatWorld.root.children.filter(c=>c.userData.hitFlash?.visible).length};});
  expect(reduced.sparks).toBe(0);expect(reduced.flashes).toBe(0);expect(reduced.layers.every(n=>n===1)).toBe(true);
  const frozen=await page.evaluate(()=>{const w=window.__berry.getWorld();w.setPaused(true);return w.huntingStatus.time;});await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__berry.getWorld().huntingStatus.time)).toBe(frozen);
  expect(errors).toEqual([]);
});
