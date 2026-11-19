// Synthetic saves in an isolated system Chrome context; no live player records.
// node --import tsx scripts/capture-items.mjs before|after [baseURL]
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newSave,WEAPONS,OUTFITS,RIDES,PETS} from '../src/rules.ts';
const phase=process.argv[2];
if(!['before','after'].includes(phase))throw Error('Expected before or after');
const out=`screenshots/items/${phase}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const evidence=[];
try {
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const s=newSave('숲꾸밈모험가',0,3);s.level=200;s.berries=3000000;s.room.inside=true;s.weapon=26;s.outfit=25;
  WEAPONS.forEach((_,i)=>s.weapons[i]=i===26?3:0);OUTFITS.forEach((_,i)=>s.outfits[i]=i===25?2:0);
  RIDES.forEach((_,i)=>s.rides[i]=true);PETS.forEach((_,i)=>s.pets[i]=true);
  s.settings.lowQuality=true;s.settings.music=s.settings.sound=false;s.tutorial={collected:true,battle:true,shop:true};
  await page.addInitScript(s=>{localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');localStorage.setItem('berry-plaza-enabled-v1','off');localStorage.setItem('berry-display-v1',JSON.stringify({clean:false,view:'normal'}));},s);
  await page.goto(process.argv[3]??'http://127.0.0.1:4175/',{waitUntil:'domcontentloaded'});
  await page.locator('#continue').click();await page.waitForFunction(()=>!!window.__berry?.getWorld());
  for(const [name,method,kind,id] of [['shop-weapons','openShop','weapon',26],['shop-outfits','openShop','outfit',25],['bag-weapons','openInventory','weapon',26],['bag-outfits','openInventory','outfit',25],['shop-pets','openPetShop',20],['bag-rides','openInventory','ride',23]]){
   await page.evaluate(([method,kind,id])=>window.__berry[method](kind,id),[method,kind,id]);
   await page.locator('#modal canvas').waitFor({state:'visible'});
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#modal img')].map(i=>i.decode().catch(()=>{})));});
   const stem=`${out}/${mobile?'mobile':'desktop'}-${name}`;
   await page.locator('#modal').screenshot({path:stem+'.png',timeout:60000});
   const preview=page.locator('#shop-avatar,#collection-preview');await preview.screenshot({path:stem+'-preview.png',timeout:60000});
   evidence.push({viewport:mobile?'mobile':'desktop',name,overflow:await page.locator('#modal').evaluate(e=>e.scrollWidth>e.clientWidth),errors:[...errors]});
  }
  await context.close();
 }
 writeFileSync(`${out}/evidence.json`,JSON.stringify(evidence,null,2)+'\n');
}finally{await browser.close();}
