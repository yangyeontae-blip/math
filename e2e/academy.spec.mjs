import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';
async function openSchoolMenu(page){
 if(!await page.evaluate(()=>window.__berry.getWorld().inAcademy)){
  await page.locator('#stage-map').click();
  await page.locator('[data-nav="academy"]').first().click();
  await expect(page.locator('.location-pill')).toContainText('모험학교');
 }
 await page.evaluate(()=>{
  const world=window.__berry.getWorld(),teacher=world.entities.find(entity=>entity.id==='academyTeacher');
  world.player.position.set(teacher.x,0,teacher.z+.6);
 });
 await expect(page.locator('#interact')).toContainText('스킬 배우기');
 if(await page.locator('#touch-talk').isVisible())await page.locator('#touch-talk').click();
 else await page.keyboard.press('e');
 await expect(page.locator('.career-howto')).toBeVisible();
}
test('academy entry, learning, casting, practice and reload preserve the original adventure',async({page},info)=>{
 const fixture=newSave('수련모험가',0,3);fixture.settings.lowQuality=true;fixture.settings.music=false;fixture.settings.sound=false;
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>localStorage.setItem('berry-forest-save-v1',JSON.stringify(s)),fixture);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible({timeout:20000});
 await openSchoolMenu(page);await expect(page.locator('.career-howto')).toContainText('전직은 이렇게 해요');await expect(page.locator('[data-career-action="next-career-step"]')).toBeDisabled();await expect(page.locator('.career-painted-expanded')).toHaveCount(9);const iconTexture=await page.request.get('/art/skill-sigils-expanded-v1.webp');expect(iconTexture.ok()).toBe(true);expect(iconTexture.headers()['content-type']).toContain('image/webp');await page.keyboard.press('Escape');await expect(page.locator('.location-pill')).toContainText('모험학교');
 const bar=await page.locator('#academy-skills').boundingBox(),back=await page.locator('#plaza-return').boundingBox();expect(bar&&back).toBeTruthy();expect(bar.x+bar.width<=back.x||back.x+back.width<=bar.x||bar.y+bar.height<=back.y||back.y+back.height<=bar.y).toBe(true);
 await openSchoolMenu(page);await page.locator('[data-career-action="lesson"][data-skill="shield"]').click();await page.locator('#academy-learn').click();await expect(page.locator('#career-hud [data-cast-skill="shield"]')).toBeEnabled();
 await page.locator('#career-hud [data-cast-skill="shield"]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')).career.practiced.includes('shield')),{timeout:30000}).toBe(true);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(before.version).toBe(25);expect(before.berries).toBe(0);expect(before.room.inside).toBe(false);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();await expect(page.locator('[data-cast-skill="shield"]')).toBeEnabled();
 const toggle=page.getByRole('button',{name:'스킬 접기',exact:true});
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 const size=await toggle.boundingBox();expect(size.width).toBeGreaterThanOrEqual(44);expect(size.height).toBeGreaterThanOrEqual(44);
 if(info.project.name==='mobile')await toggle.tap();else await toggle.click();
 await expect(page.locator('#exploration-skill-slots')).toBeHidden();
 await expect(page.locator('#modal')).not.toBeVisible();
 const reopen=page.getByRole('button',{name:'스킬 펼치기',exact:true});
 if(info.project.name==='mobile')await reopen.tap();else await reopen.click();
 await expect(page.locator('#exploration-skill-slots [data-cast-skill="shield"]')).toBeVisible();
 await openSchoolMenu(page);await expect(page.locator('.career-skill-list')).toContainText('수련 완료');
});

// Existing flows exercise the expanded HUD; feedback-upgrade separately tests the mobile first-run default.
test.beforeEach(async({page})=>{await page.addInitScript(()=>{if(localStorage.getItem('berry-display-v1')===null)localStorage.setItem('berry-display-v1',JSON.stringify({clean:false,view:'normal'}));});});
