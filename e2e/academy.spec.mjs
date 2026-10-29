import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';
test('academy entry, learning, casting, practice and reload preserve the original adventure',async({page})=>{
 const fixture=newSave('수련모험가',0,3);fixture.settings.lowQuality=true;fixture.settings.music=false;fixture.settings.sound=false;
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>localStorage.setItem('berry-forest-save-v1',JSON.stringify(s)),fixture);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible({timeout:20000});
 await page.locator('#academy-open').click();await expect(page.locator('.career-howto')).toContainText('전직은 이렇게 해요');await expect(page.locator('[data-career-action="next-career-step"]')).toBeDisabled();await expect(page.locator('.career-painted-expanded')).toHaveCount(9);const iconTexture=await page.request.get('/art/skill-sigils-expanded-v1.webp');expect(iconTexture.ok()).toBe(true);expect(iconTexture.headers()['content-type']).toContain('image/webp');await page.locator('#academy-walk').click();await expect(page.locator('.location-pill')).toContainText('모험학교');
 const bar=await page.locator('#academy-skills').boundingBox(),back=await page.locator('#plaza-return').boundingBox();expect(bar&&back).toBeTruthy();expect(bar.x+bar.width<=back.x||back.x+back.width<=bar.x||bar.y+bar.height<=back.y||back.y+back.height<=bar.y).toBe(true);
 await page.locator('#academy-open').click();await page.locator('[data-career-action="lesson"][data-skill="shield"]').click();await page.locator('#academy-learn').click();await expect(page.locator('#career-hud [data-cast-skill="shield"]')).toBeEnabled();
 await page.locator('#career-hud [data-cast-skill="shield"]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')).career.practiced.includes('shield')),{timeout:30000}).toBe(true);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(before.version).toBe(22);expect(before.berries).toBe(0);expect(before.room.inside).toBe(false);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();await expect(page.locator('[data-cast-skill="shield"]')).toBeEnabled();
 await page.locator('#academy-open').click();await expect(page.locator('.career-skill-list')).toContainText('수련 완료');
});
