import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {newSave,WEAPONS,OUTFITS} from '../src/rules.ts';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const s=newSave('숲꾸밈모험가',0,3);s.level=200;s.berries=3000000;s.weapon=26;s.outfit=25;s.position={x:-18,z:5.5};
  WEAPONS.forEach((_,i)=>s.weapons[i]=i===26?3:0);OUTFITS.forEach((_,i)=>s.outfits[i]=i===25?2:0);
  s.settings.lowQuality=mobile;s.settings.music=s.settings.sound=false;s.tutorial={collected:true,battle:true,shop:true};
  await page.addInitScript(s=>{localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');localStorage.setItem('berry-plaza-enabled-v1','off');localStorage.setItem('berry-display-v1',JSON.stringify({clean:false,view:'normal'}));},s);
  await page.goto('http://127.0.0.1:4177/',{waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
  expect(await page.evaluate(()=>typeof window.__berry)).toBe('undefined');
  await expect(page.locator('#interact')).toContainText('상점');
  await page.keyboard.press('e');
  for(const kind of ['weapon','outfit']){
   await page.locator('#stage-map').click();await page.locator('[data-nav="shops"]').first().click();await page.locator(`[data-nav="${kind}"]`).first().click();
   await page.locator(`[data-item="${kind==='weapon'?26:25}"]`).click();
   await expect(page.locator('#shop-avatar canvas')).toBeVisible();
   await expect(page.locator('.item-card .catalog-item-icon').first()).toHaveAttribute('src',/berry-items-v2/);
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#modal img')].map(i=>i.decode()));});
   await page.locator('#modal').screenshot({path:`screenshots/items/after/production-${mobile?'mobile':'desktop'}-shop-${kind}.png`,timeout:60000});
   await page.keyboard.press('Escape');
  }
  await page.locator('#inventory').click();
  for(const kind of ['weapon','outfit']){
   await page.locator(`[data-inventory-tab="${kind}"]`).click();await expect(page.locator('#collection-preview canvas')).toBeVisible();
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#modal img')].map(i=>i.decode()));});
   await page.locator('#modal').screenshot({path:`screenshots/items/after/production-${mobile?'mobile':'desktop'}-bag-${kind}.png`,timeout:60000});
  }
  results.push({viewport:mobile?'mobile':'desktop',lowQuality:s.settings.lowQuality,productionHooksAbsent:true,overflow:await page.locator('#modal').evaluate(e=>e.scrollWidth>e.clientWidth),errors});
  expect(errors).toEqual([]);await context.close();
 }
 writeFileSync('screenshots/items/after/production-evidence.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results));
}finally{await browser.close();}
