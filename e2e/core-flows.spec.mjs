import { test, expect } from '@playwright/test';
import { newSave } from '../src/rules.ts';
const SAVE='berry-forest-save-v1', RECORD='berry-forest-learning-resolutions-v1';
async function start(page){
 page.on('pageerror',error=>console.log('Browser error:',error.message));
 const fixture=newSave('탐험가',0,3);fixture.settings.lowQuality=true;fixture.settings.music=false;fixture.settings.sound=false;
 await page.goto('/',{waitUntil:'domcontentloaded'});
 // Use a real v21 fixture in the supported lightweight mode on software-rendered CI.
 await page.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:SAVE,save:fixture});
 await page.reload({waitUntil:'domcontentloaded'});console.log('Start screen ready');
 await page.locator('#continue').click();
 await expect(page.locator('#hud')).toBeVisible({timeout:20000});console.log('Adventure ready');
 await expect(page.locator('#save-status')).toHaveText('✓ 저장됨');
 await page.waitForFunction(()=>!!window.__berry);
}
async function openArena(page){
 await page.evaluate(()=>window.__berry.openArena());await page.locator('[data-practice-op="addition"]').click();
 await page.locator('#arena-start').click();await expect(page.locator('#answer')).toBeVisible();
}
async function answer(page, wrong=false){
 const q=await page.evaluate(()=>window.__berry.testBattleQuestion());
 await page.locator('#answer').click();
 for(const digit of (wrong?'9999':q.answer))await page.locator(`[data-number="${digit}"]`).click();
 if(await page.locator('#remainder').count()){await page.locator('#remainder').click();for(const digit of String(wrong?9:q.remainder))await page.locator(`[data-number="${digit}"]`).click();}
 await page.locator('[data-number="확인"]').click();
}
test('hint, retry, immediate save, report and reload keep the same adventure',async({page})=>{
 await start(page);await openArena(page);await answer(page);await page.locator('#next-battle').click();
 await page.locator('#show-hint').click();await answer(page);await page.locator('#next-battle').click();
 await answer(page,true);await answer(page);
 await expect(page.locator('#battle-result')).toBeVisible();
 const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), SAVE);
 const ledger=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), RECORD);
 expect(ledger.units.addition).toEqual({independent:1,assisted:1,retried:1});
 await page.evaluate(()=>window.__berry.openReport());await expect(page.locator('.report-sheet').first()).toContainText('재도전 성공');
 await page.reload();await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
 const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), SAVE);expect(after.nickname).toBe(before.nickname);expect(after.berries).toBe(before.berries);
});
test('garden placement survives reloading',async({page})=>{
 await start(page);await page.evaluate(()=>{window.__berry.closeModal();window.__berry.enterHomeGarden();window.__berry.testHomeEditor();});
 await expect(page.locator('[data-home-editor]')).toBeVisible();
 await page.locator('[data-editor-kind="0"]').click();await page.locator('#editor-place').click();
 const before=await page.evaluate(()=>window.__berry.getState().homestead.objects);expect(before.length).toBeGreaterThan(0);
 await page.reload();await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
 const after=await page.evaluate(()=>window.__berry.getState().homestead.objects);expect(after).toEqual(before);
});
test('corrupt current save offers the valid checkpoint and storage failure stays visible',async({page})=>{
 await start(page);
 await page.evaluate(key=>{const s=localStorage.getItem(key);localStorage.setItem(key+'-checkpoint',s);localStorage.setItem(key,'{broken');}, SAVE);
 await page.reload();await expect(page.locator('#start-error')).toContainText('정상 기록');await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
 await page.evaluate(()=>{window.__berry.getState().berries++;Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};window.__berry.persist();});
 await expect(page.locator('#save-status')).toContainText('저장 실패');
});
