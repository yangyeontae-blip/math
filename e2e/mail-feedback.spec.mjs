import {test,expect} from '@playwright/test';
import {newSave} from '../src/rules.ts';
import {stageMonsters,isVillagePond} from '../src/stages.ts';
import {startExpedition,collectExpeditionStar,expeditionLayout} from '../src/expedition.ts';
import {ACADEMY_SKILLS} from '../src/academy.ts';

async function start(page,s){
 s.settings.lowQuality=true;s.settings.music=s.settings.sound=false;
 s.tutorial={collected:true,battle:true,shop:true};
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');},s);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible({timeout:30000});
}

test('mail feedback: shop visit keeps an active expedition and resumes its exact progress',async({page},info)=>{
 const s=newSave('별길친구',0,3);for(let n=1;n<=10;n++){s.journey.maps[n].cleared=true;s.journey.maps[n].monsters=stageMonsters(n).map((_,id)=>id);}
 startExpedition(s);collectExpeditionStar(s,expeditionLayout(0).stars[0]);
 await start(page,s);
 await page.locator('#stage-map').click();await page.locator('[data-nav="shops"]').first().click();await page.locator('[data-nav="walk"]').click();
 await expect.poll(()=>page.evaluate(()=>window.__berry.getWorld().inMarket)).toBe(true);
 expect(await page.evaluate(()=>window.__berry.getState().expedition.active)).toEqual(s.expedition.active);
 await page.locator('#stage-map').click();await page.locator('[data-nav="explore"]').first().click();await page.locator('[data-nav="expedition"]').click();await page.locator('#expedition-start').click();
 await expect.poll(()=>page.evaluate(()=>window.__berry.getWorld().isPublicForest)).toBe(true);
 expect(await page.evaluate(()=>window.__berry.getState().expedition.active)).toEqual(s.expedition.active);
 await page.screenshot({path:info.outputPath('resumed-expedition.png')});
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
 expect(await page.evaluate(()=>window.__berry.getState().expedition.active)).toEqual(s.expedition.active);
});

test('mail feedback: walking into the lake stays on shore without repeated rescue or rising',async({page},info)=>{
 await start(page,newSave('연꽃친구',0,3));
 const begin=await page.evaluate(()=>{const w=window.__berry.getWorld();w.player.position.set(14.5,0,8);w.lastSafe.set(14.5,0,8);w.moveStick(.8,.6);return w.time;});
 await expect.poll(()=>page.evaluate(()=>window.__berry.getWorld().time),{timeout:30000}).toBeGreaterThan(begin+1.5);
 const shore=await page.evaluate(()=>{const w=window.__berry.getWorld();w.clearInput();return {x:w.player.position.x,y:w.player.position.y,z:w.player.position.z};});
 expect(isVillagePond(0,shore.x,shore.z)).toBe(false);expect(shore.x).toBeGreaterThanOrEqual(14.5);expect(shore.x).toBeLessThan(15.25);expect(shore.y).toBe(0);
 await page.evaluate(()=>{const w=window.__berry.getWorld();w.player.position.set(19,1,8);w.vy=-2;w.grounded=false;});
 await expect.poll(()=>page.evaluate(()=>window.__berry.getWorld().player.position.y)).toBe(0);
 const landed=await page.evaluate(()=>{const p=window.__berry.getWorld().player.position;return {x:p.x,z:p.z};});expect(isVillagePond(0,landed.x,landed.z)).toBe(false);
 await page.screenshot({path:info.outputPath('lake-shore.png')});
});

test('mail feedback: title bonuses and guaranteed weapon upgrades are visible and saved',async({page},info)=>{
 const s=newSave('여명친구',0,3);s.level=300;s.berries=500000;s.weapons[39]=3;s.weapon=39;
 await start(page,s);await page.locator('#inventory').click();await page.locator('[data-inventory-tab="title"]').click();await page.locator('[data-title-choice="level-300"]').click();await expect(page.locator('.title-effect')).toContainText('+15%');
 await page.locator('.title-wardrobe>.close').click();await page.locator('#stage-map').click();await page.locator('[data-nav="shops"]').first().click();await page.locator('[data-nav="weapon"]').click();
 await expect(page.locator('.weapon-detail')).toContainText('여명 숲지기 망치');await page.locator('#upgrade-item').click();await expect(page.locator('.weapon-detail')).toContainText('+4');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')).weapons[39])).toBe(4);
 await page.screenshot({path:info.outputPath('weapon-workshop.png')});
});

test('mail feedback: fourth advancement requires its actual trial and skill training spends berries once',async({page},info)=>{
 const s=newSave('여명수련생',0,3);s.level=100;s.berries=5000;s.career.job='knight';s.career.ranks.knight=s.career.trials.knight=3;
 s.career.learned=ACADEMY_SKILLS.filter(a=>a.job==='knight'&&a.rank<=3).map(a=>a.id);s.career.loadouts.knight=['crescent','charge','roots','guardian'];
 await start(page,s);await page.locator('#stage-map').click();await page.locator('[data-nav="academy"]').first().click();
 const teacher=()=>page.evaluate(()=>{const w=window.__berry.getWorld(),e=w.entities.find(e=>e.id==='academyTeacher');w.player.position.set(e.x,0,e.z+.6);});
 await teacher();await expect(page.locator('#interact')).toContainText('스킬');if(await page.locator('#touch-talk').isVisible())await page.locator('#touch-talk').click();else await page.keyboard.press('e');
 await expect(page.locator('[data-career-action="start-trial"]')).toHaveAttribute('data-rank','4');await expect(page.locator('[data-career-action="choose-job"][data-job="alchemist"]')).toBeDisabled();
 await page.locator('[data-career-action="start-trial"]').click();await expect(page.locator('[data-cast-skill="dawnCrown"]')).toBeVisible();
 await page.evaluate(()=>{const w=window.__berry.getWorld(),e=w.huntingStatus.enemies[0];w.player.position.set(e.x,0,e.z+2);w.player.rotation.y=Math.PI;});
 await page.locator('[data-cast-skill="dawnCrown"]').click();await expect.poll(()=>page.evaluate(()=>window.__berry.getState().career.trials.knight)).toBe(4);
 await page.locator('[data-career-action="exit-combat"]').click();await teacher();await expect(page.locator('#interact')).toContainText('스킬');if(await page.locator('#touch-talk').isVisible())await page.locator('#touch-talk').click();else await page.keyboard.press('e');
 await page.locator('[data-career-action="advance-job"]').click();await expect(page.locator('.career-heading h2')).toContainText('여명의 성기사');
 await page.locator('[data-career-action="upgrade-skill"][data-skill="dawnCrown"]').click();
 expect(await page.evaluate(()=>window.__berry.getState().berries)).toBe(4000);expect(await page.evaluate(()=>window.__berry.getState().career.upgrades.dawnCrown)).toBe(1);
 await page.screenshot({path:info.outputPath('fourth-career.png')});
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
 expect(await page.evaluate(()=>window.__berry.getState().career.ranks.knight)).toBe(4);expect(await page.evaluate(()=>window.__berry.getState().career.upgrades.dawnCrown)).toBe(1);
});
