import {test,expect} from '@playwright/test';import {newSave} from '../src/rules.ts';
// Two fresh 3D startups and a saved-session reload use the same budget as shared-plaza checks.
// Separate browser processes avoid competing shader compilation on software-rendered CI.
test.describe.configure({timeout:180000});
async function boot(page,nickname,url='/'){const s=newSave(nickname,0,3);s.settings.lowQuality=true;s.settings.sound=s.settings.music=false;s.tutorial={collected:true,battle:true,shop:true};await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');},s);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible({timeout:30000});}
async function open(page,kind){await page.locator('#stage-map').click();await page.locator('[data-nav="'+kind+'"]').click();await expect(page.locator('[data-community-sheet]')).toBeVisible();}
async function join(page,code){await page.locator('#community-code').fill(code);await page.locator('#community-join button').click();await expect(page.locator('.community-code')).toHaveText(code);}

test('community: two devices join a persistent guild and enforce leadership transfer and removal',async({page,browser},info)=>{
 let peerBrowser;
 try{
  await boot(page,'아침친구');await open(page,'guild');await page.locator('#guild-name').fill('새벽숲길드');await page.locator('#community-create button').click();await expect(page.locator('.community-code')).toBeVisible();const code=(await page.locator('.community-code').textContent()).trim();
  peerBrowser=await browser.browserType().launch({...info.project.use.launchOptions,channel:info.project.use.channel,headless:true});const context=await peerBrowser.newContext({viewport:page.viewportSize(),isMobile:test.info().project.name==='mobile',hasTouch:test.info().project.name==='mobile'}),friend=await context.newPage();
  await boot(friend,'저녁친구',page.url());await open(friend,'guild');await join(friend,code);await expect(page.locator('.community-members')).toContainText('저녁친구',{timeout:15000});
  expect(await page.evaluate(()=>window.__berry.getState().berries)).toBe(0);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();await open(page,'guild');await expect(page.locator('.community-code')).toHaveText(code);
  await page.locator('[data-community-action="transfer"]').click();await expect(friend.locator('[data-community-action="kick"]')).toBeVisible({timeout:15000});
  await friend.locator('[data-community-action="kick"]').click();await expect(page.locator('#community-join')).toBeVisible({timeout:15000});
  await friend.screenshot({path:info.outputPath('persistent-guild.png')});await friend.locator('[data-community-action="leave"]').click();await expect(friend.locator('#community-create')).toBeVisible();
 }finally{await peerBrowser?.close();}
});

test('community: friends play five live shared questions and retain berries and learning records',async({page,browser},info)=>{
 let peerBrowser;
 try{
  await boot(page,'햇살대원');await open(page,'duel');await page.locator('#duel-forest').selectOption('division');await page.locator('#community-create button').click();await expect(page.locator('.community-code')).toBeVisible();const code=(await page.locator('.community-code').textContent()).trim();
  peerBrowser=await browser.browserType().launch({...info.project.use.launchOptions,channel:info.project.use.channel,headless:true});const context=await peerBrowser.newContext({viewport:page.viewportSize(),isMobile:test.info().project.name==='mobile',hasTouch:test.info().project.name==='mobile'}),friend=await context.newPage();
  await boot(friend,'달빛대원',page.url());await open(friend,'duel');await join(friend,code);await page.locator('[data-community-action="ready"]').click();await friend.locator('[data-community-action="ready"]').click();
  for(let round=1;round<=5;round++){
   await expect(page.locator('.community-round')).toHaveText(round+' / 5 문제',{timeout:15000});await expect(page.locator('#duel-answer')).toBeVisible();await expect(friend.locator('.community-round')).toHaveText(round+' / 5 문제',{timeout:15000});
   const prompt=await page.locator('.community-question').textContent();await expect(friend.locator('.community-question')).toHaveText(prompt);const [a,b]=prompt.match(/\d+/g).map(Number),answer=Math.floor(a/b)+(a%b?' '+a%b:'');
   await page.locator('#duel-answer').fill(String(answer));await page.locator('#community-answer button').click();await expect(page.locator('.community-result')).toContainText('정답');
  }
  await expect(page.locator('[data-community-sheet]')).toContainText('대전에서 이겼어요!',{timeout:15000});await expect(friend.locator('[data-community-sheet]')).toContainText('친구가 이겼어요!',{timeout:15000});
  for(const p of [page,friend]){const state=await p.evaluate(()=>window.__berry.getState());expect(state.berries).toBe(0);expect(state.learning.correct).toBe(0);expect(state.learning.wrong).toBe(0);}
  await page.screenshot({path:info.outputPath('friend-duel-results.png')});
 }finally{await peerBrowser?.close();}
});
