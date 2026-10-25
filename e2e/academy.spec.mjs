import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';
test('academy entry, learning, casting, practice and reload preserve the original adventure',async({page})=>{
 const fixture=newSave('수련모험가',0,3);fixture.settings.lowQuality=true;fixture.settings.music=false;fixture.settings.sound=false;
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>localStorage.setItem('berry-forest-save-v1',JSON.stringify(s)),fixture);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible({timeout:20000});
 await page.locator('#academy-open').click();await page.locator('#academy-walk').click();await expect(page.locator('.location-pill')).toContainText('모험학교');
 const bar=await page.locator('#academy-skills').boundingBox(),back=await page.locator('#plaza-return').boundingBox();expect(bar&&back).toBeTruthy();expect(bar.x+bar.width<=back.x||back.x+back.width<=bar.x||bar.y+bar.height<=back.y||back.y+back.height<=bar.y).toBe(true);
 await page.locator('#academy-open').click();await page.locator('[data-academy-lesson="shield"]').click();await page.locator('#academy-learn').click();await expect(page.locator('[data-cast-skill="shield"]')).toBeEnabled();
 await page.locator('[data-cast-skill="shield"]').click();await expect(page.locator('[data-cast-skill="shield"]')).toContainText('사용 중');// Software-rendered CI can advance simulation time slower than wall-clock time.
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-academy-v1')).practiced.includes('shield')),{timeout:30000}).toBe(true);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(before.version).toBe(21);expect(before.berries).toBe(0);expect(before.room.inside).toBe(false);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();await expect(page.locator('[data-cast-skill="shield"]')).toBeEnabled();
 await page.locator('#academy-open').click();await expect(page.locator('.academy-cards')).toContainText('수련 완료');
});