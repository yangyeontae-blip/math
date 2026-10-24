import { test, expect } from '@playwright/test';
const SAVE='berry-forest-save-v1', RECORD='berry-forest-learning-resolutions-v1';
async function start(page){
 await page.goto('/');await page.locator('#nickname-input').fill('탐험가');await page.locator('#new-game').click();
 await expect(page.locator('#hud')).toBeVisible();await expect(page.locator('#save-status')).toHaveText('✓ 저장됨');
 await page.waitForFunction(()=>!!window.__berry);
}
async function openArena(page){
 await page.evaluate(()=>window.__berry.openArena());await page.locator('[data-practice-op="addition"]').click();
 await page.locator('#arena-start').click();await expect(page.locator('#answer')).toBeVisible();
}
async function answer(page, wrong=false){
 const q=await page.evaluate(()=>window.__berry.testBattleQuestion());
 await page.locator('#answer').fill(wrong?'99999999':q.answer);
 if(await page.locator('#remainder').count())await page.locator('#remainder').fill(wrong?'999':String(q.remainder));
 await page.locator('[data-number="확인"]').click();
}
test('hint, retry, immediate save, report and reload keep the same adventure',async({page})=>{
 await start(page);await openArena(page);await page.locator('#show-hint').click();await answer(page,true);await answer(page);
 await expect(page.locator('#battle-result')).toBeVisible();
 const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), SAVE);
 const ledger=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), RECORD);
 expect(ledger.units.addition.retried).toBe(1);
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
