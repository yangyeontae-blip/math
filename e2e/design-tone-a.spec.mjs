import {test,expect} from '@playwright/test';
import {newSave} from '../src/rules.ts';

test.beforeEach(async({page})=>{
  await page.route('**/api/weather?**',route=>route.fulfill({json:{region:'cheongju',weather:'clear',temp:12}}));
});

test('tone A: registration, weather and departure fit the opening viewport',async({page},info)=>{
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('#new-game')).toBeInViewport({ratio:1});
  await expect(page.locator('#start-weather')).toContainText('기상청');
  await page.locator('[data-grade="6"]').click();await expect(page.locator('[data-grade="6"]')).toHaveAttribute('aria-checked','true');
  await page.locator('[data-character="2"]').click();await expect(page.locator('[data-character="2"]')).toHaveAttribute('aria-pressed','true');
  const bounds=await page.locator('.start-story,.start-departure').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  if(info.project.name==='desktop')expect(bounds[0].right).toBeLessThan(bounds[1].x);
  else expect(bounds[0].bottom).toBeLessThanOrEqual(bounds[1].y);
});

test('tone A: unreadable weather offers a clear next step without blocking departure',async({page})=>{
  await page.route('**/api/weather?**',route=>route.abort('internetdisconnected'));
  await page.goto('/');await expect(page.locator('#start-weather')).toContainText('새로고침');
  await expect(page.locator('#new-game')).toBeEnabled();
  expect(await page.locator('#start-weather').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
});

test('tone A: HUD uses line icons and retains folding, navigation and profile clearance',async({page})=>{
  const s=newSave('베리',0,3);s.settings.lowQuality=true;s.settings.music=s.settings.sound=false;s.level=60;s.tutorial={collected:true,battle:true,shop:true};
  await page.goto('/');await page.evaluate(s=>{
    localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));
    localStorage.setItem('berry-display-v1',JSON.stringify({clean:false,view:'normal'}));
    localStorage.setItem('berry-forest-ambience-v1','off');
  },s);await page.reload();await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();
  for(const id of ['today-adventure','quest-toggle','adventure-menu','feedback-open','plaza-chat-toggle','party-open']){
    await expect(page.locator('#'+id+' svg.ui-icon')).toHaveCount(1);
  }
  await expect(page.locator('#today-adventure')).toHaveText('오늘의 모험');
  await expect.poll(()=>page.locator('#hud').evaluate(el=>{
    const profile=el.querySelector('.player-card').getBoundingClientRect(),quest=el.querySelector('.quest-card').getBoundingClientRect();
    return quest.top>=profile.bottom;
  })).toBe(true);
  const initiallyExpanded=await page.locator('#quest-toggle').getAttribute('aria-expanded');
  await page.locator('#quest-toggle').click();await expect(page.locator('#quest-toggle')).toHaveAttribute('aria-expanded',initiallyExpanded==='true'?'false':'true');
  await page.locator('#quest-toggle').click();await expect(page.locator('#quest-toggle')).toHaveAttribute('aria-expanded',initiallyExpanded);
  await page.locator('#stage-map').click();await expect(page.locator('[data-nav="explore"]')).toBeVisible();
  await expect(page.locator('[data-nav="explore"] svg.ui-icon')).toHaveCount(1);
});
