import {expect} from '@playwright/test';
/** Solve actual rendered questions; never grant trials or change saved mission counters. */
export async function completeMathTrial(page){
 const before=await page.evaluate(()=>{const c=window.__berry.getState().career;return {job:c.job,rank:c.ranks[c.job]+1,correct:c.mathTrials[c.job].correct};});
 const target=Number(await page.locator('.career-math-mission progress').getAttribute('max'));
 await page.locator('[data-career-action="trial-arena"]').click();
 for(let done=before.correct;done<target;){
  await page.locator('[data-practice-op="addition"]').click();await page.locator('[data-practice-tier="0"]').click();await page.locator('#arena-start').click();
  for(let round=0;round<5&&done<target;round++){
   const q=await page.evaluate(()=>window.__berry.testBattleQuestion());await page.locator('#answer').click();for(const digit of q.answer)await page.locator(`[data-number="${digit}"]`).click();await page.locator('[data-number="확인"]').click();done++;
   expect(await page.evaluate(()=>{const c=window.__berry.getState().career;return c.mathTrials[c.job].correct;})).toBe(done);
   if(round<4&&done<target)await page.locator('#next-battle').click();
  }
  if(done<target){await page.locator('#next-battle').click();await page.locator('#modal [data-close]').last().click();await page.evaluate(()=>window.__berry.openArena());}
 }
 await page.evaluate(()=>window.__berry.careerSchool());await expect(page.locator('.career-math-mission')).toContainText('수련 완료');
 expect(await page.evaluate(()=>{const c=window.__berry.getState().career;return c.trials[c.job];})).toBe(before.rank);
}
