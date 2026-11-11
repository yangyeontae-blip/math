import {test,expect} from '@playwright/test';import {newSave} from '../src/rules.ts';import {stageBerries,stageMonsters} from '../src/stages.ts';
const KEY='berry-forest-save-v1';
// Match the plaza tests: each simulated device owns a browser process so
// software WebGL initialization cannot block another device's reload.
async function device(browser, info, options) {
 const process = await browser.browserType().launch({...info.project.use.launchOptions,channel:info.project.use.channel,headless:true});
 try {
  const context=await process.newContext({...options,baseURL:info.project.use.baseURL});
  return {browser:process,context};
 }
 catch(error) { await process.close(); throw error; }
}
const activePages=new Set();
async function withOtherRenderersPaused(page,work) {
 const paused=[];
 try {
  for(const other of activePages)if(other!==page&&!other.isClosed()){
   const was=await other.evaluate(()=>{const w=window.__berry?.getWorld();if(!w)return null;const paused=w.paused;w.setPaused(true);w.__friendTestRender=w.renderer.render;w.renderer.render=()=>{};return paused;});
   if(was!==null)paused.push([other,was]);
  }
  return await work();
 }finally{
  for(const [other,was] of paused)if(!other.isClosed())await other.evaluate(value=>{const w=window.__berry?.getWorld();if(w){if(w.__friendTestRender){w.renderer.render=w.__friendTestRender;delete w.__friendTestRender;}w.setPaused(value);}},was);
 }
}
async function continueAdventure(page) {
 await expect(page.locator('#continue')).toBeVisible({timeout:45000});
 await page.locator('#continue').click();
 await expect(page.locator('#hud')).toBeVisible({timeout:45000});
}
async function reloadAdventure(page) {
 await withOtherRenderersPaused(page,async()=>{
  await page.reload({waitUntil:'domcontentloaded'});
  await continueAdventure(page);
 });
}
async function begin(context,name,grade=3,stage=1,online=false){
 const page=await context.newPage(),s=newSave(name,0,grade);page.on('pageerror',error=>console.log('FRIEND_PAGE_ERROR',name,error.message));
 s.level=50;s.settings.music=s.settings.sound=false;s.settings.lowQuality=true;s.journey.stage=stage;
 if(stage>1){s.journey.maps[1].cleared=true;s.journey.maps[1].monsters=stageMonsters(1).map((_,i)=>i);}
 s.journey.maps[1].berries=stageBerries(1).map((_,i)=>i);s.tutorial={collected:true,battle:true,shop:true};
 await page.addInitScript(({KEY,s,online})=>{
  if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(s));
  localStorage.setItem('berry-plaza-enabled-v1',online?'on':'off');localStorage.setItem('berry-forest-ambience-v1','off');
 },{KEY,s,online});
 await withOtherRenderersPaused(page,async()=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await continueAdventure(page);
 });
 activePages.add(page);return page;
}
function answer(prompt){const [a,op,b]=prompt.split(' '),x=Number(a),y=Number(b);return op==='+'?String(x+y):op==='−'?String(x-y):op==='×'?String(x*y):x%y?Math.floor(x/y)+'R'+x%y:String(x/y);}
test('two isolated players share forest avatars, questions, progress, chat bubbles and one saved reward through reload',async({browser},info)=>{test.setTimeout(240000);const mobile=info.project.name==='mobile',opts={viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile};const devices=[];try{const first=await device(browser,info,opts);devices.push(first);const second=await device(browser,info,opts);devices.push(second);const a=await begin(first.context,'협동나무'),b=await begin(second.context,'협동별꽃');await a.locator('#party-open').click();await a.locator('#party-create').click();await a.locator('.party-code-details summary').click();await expect(a.locator('.party-code')).toBeVisible({timeout:15000});const code=await a.locator('.party-code').innerText();await b.locator('#party-open').click();await b.locator('.party-code-details summary').click();await b.locator('#party-code-input').fill(code);await b.locator('#party-join-form button[type=submit]').click();await expect(b.locator('.party-members li:not(.is-empty)')).toHaveCount(2,{timeout:15000});await b.locator('#party-close').click();await expect(a.locator('.party-members li:not(.is-empty)')).toHaveCount(2);await a.locator('#party-start').click();await expect(a.locator('#party-question-open')).toBeVisible({timeout:15000});await expect(b.locator('#party-question-open')).toBeVisible({timeout:15000});await expect.poll(()=>a.locator('.plaza-nameplate:not(.is-self)').count()).toBe(1);await a.locator('#party-question-open').click();await b.locator('#party-question-open').click();const prompt=await a.locator('.party-question h3').innerText();await expect(b.locator('.party-question h3')).toHaveText(prompt);if(!mobile)await b.evaluate(KEY=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===KEY)throw new DOMException('Test quota','QuotaExceededError');return set.call(this,k,v);};},KEY);await a.locator('#party-answer').fill(answer(prompt));await a.locator('#party-answer-form .primary').click();await expect(a.locator('#party-next')).toBeVisible();await expect(b.locator('#party-next')).toBeVisible();if(!mobile){await expect(b.locator('#save-status')).toContainText('저장 실패');expect(await b.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).partyClaims.length,KEY)).toBe(0);await reloadAdventure(b);await expect(b.locator('#party-question-open')).toBeVisible({timeout:20000});await b.locator('#party-question-open').click();await expect(b.locator('#party-next')).toBeVisible();}for(const p of [a,b])await expect.poll(()=>p.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).partyClaims.length,KEY)).toBe(1);const saved=await b.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);expect(saved.journey.maps[1].monsters).toEqual([0]);expect(saved.version).toBe(26);await a.locator('.party-chat-details summary').click();await b.locator('.party-chat-details summary').click();await a.locator('#party-chat-input').fill('같이 풀어서 즐거워!');await a.locator('#party-chat-form button').click();await expect(b.locator('.party-chat-log')).toContainText('같이 풀어서 즐거워!');await a.screenshot({path:info.outputPath('shared-forest-question.png')});await reloadAdventure(b);await expect(b.locator('#party-question-open')).toBeVisible({timeout:20000});const after=await b.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);expect(after.partyClaims).toEqual(saved.partyClaims);expect(after.xp).toBe(saved.xp);await b.locator('#party-question-open').click();await expect(b.locator('#party-next')).toBeVisible();await a.locator('#party-next').click();await expect(b.locator('#party-answer')).toBeVisible();await expect(b.locator('.party-question h3')).not.toHaveText(prompt);await b.screenshot({path:info.outputPath('shared-forest-mobile.png')});}finally{for(const device of devices.reverse())await device.browser.close();}});


test('the same-grade same-stage forest meets automatically and a party reuses those avatars without duplicates',async({browser},info)=>{test.setTimeout(240000);const mobile=info.project.name==='mobile',options={viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile};const devices=[];try{const contexts=[];for(let i=0;i<3;i++){const d=await device(browser,info,options);devices.push(d);contexts.push(d.context);}const [ca,cb,cc]=contexts;const a=await begin(ca,'같은숲나무',3,1,true),b=await begin(cb,'같은숲별꽃',3,1,true),other=await begin(cc,'다른학년친구',4,1,true);await expect(a.locator('#plaza-status')).toContainText('함께하는 수학숲 · 2명',{timeout:20000});await expect(other.locator('#plaza-status')).toContainText('1명',{timeout:20000});await expect.poll(()=>a.locator('.plaza-nameplate:not(.is-self)').count()).toBe(1);await expect(a.locator('.plaza-nameplate:not(.is-self)')).toContainText('같은숲별꽃');await a.locator('#party-open').click();await a.locator('#party-create').click();await a.locator('.party-code-details summary').click();await expect(a.locator('.party-code')).toBeVisible();const code=await a.locator('.party-code').innerText();await b.locator('#party-open').click();await b.locator('.party-code-details summary').click();await b.locator('#party-code-input').fill(code);await b.locator('#party-join-form button[type=submit]').click();await expect(a.locator('.party-members li:not(.is-empty)')).toHaveCount(2);await b.locator('#party-close').click();await a.locator('#party-start').click();await expect(a.locator('#party-question-open')).toBeVisible();await expect.poll(()=>a.locator('.plaza-nameplate:not(.is-self)').count()).toBe(1);await a.screenshot({path:info.outputPath('automatic-math-forest-friends.png')});await other.close();const stage=await begin(cc,'다른단계친구',3,2,true);await expect(stage.locator('#plaza-status')).toContainText('1명',{timeout:20000});}finally{for(const device of devices.reverse())await device.browser.close();}});


test('friend invitation starts the recommended shared forest without entering a code',async({browser},info)=>{
 test.setTimeout(240000);
 const mobile=info.project.use.isMobile===true;
 const opts={viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile};
 const devices=[];
 try{
  for(let i=0;i<2;i++)devices.push(await device(browser,info,opts));
  const a=await begin(devices[0].context,'초대나무',3,1,true),b=await begin(devices[1].context,'초대별꽃',3,1,true);
  await expect(a.locator('#plaza-status')).toContainText('2명',{timeout:20000});
  await b.locator('#party-open').click();
  await b.locator('.party-code-details summary').click();
  await b.locator('#party-code-input').fill('DRAFT');
  await a.locator('#party-open').click();
  await a.locator('.party-nearby li').filter({hasText:'초대별꽃'}).getByRole('button',{name:'함께 모험 초대',exact:true}).click();
  await expect(b.locator('.party-invite-banner')).toContainText('초대나무',{timeout:15000});
  await expect(b.locator('#party-code-input')).toHaveValue('DRAFT');
  await b.locator('[data-invite-show]').click();
  await b.locator('[data-invite-decline]').click();
  await expect(b.locator('.party-invite-banner')).toBeHidden();
  // A second invitation is allowed after the documented per-friend interval.
  await a.waitForTimeout(10500);
  await a.locator('.party-friend-details summary').click();
  await a.locator('.party-nearby li').filter({hasText:'초대별꽃'}).getByRole('button',{name:'함께 모험 초대',exact:true}).click();
  await b.locator('[data-invite-show]').click();
  await b.locator('[data-invite-accept]').click();
  await expect(a.locator('.party-members li:not(.is-empty)')).toHaveCount(2,{timeout:15000});
  await expect(b.locator('.party-members li:not(.is-empty)')).toHaveCount(2);
  await expect(a.locator('#party-start')).toBeEnabled();
  await a.screenshot({path:info.outputPath('friends-adventure-lobby.png')});
  const choices=await a.locator('#party-destination option').evaluateAll(items=>items.map(o=>({value:o.value,selected:o.selected})));
  const different=choices.find(o=>!o.selected);
  if(different){
   await a.locator('.party-destination summary').click();
   await a.locator('#party-destination').selectOption(different.value);
   await expect(a.locator('#party-start')).toBeDisabled();
   await expect(b.locator('#party-ready')).toBeVisible();
   await b.locator('#party-ready').click();
   await expect(a.locator('#party-start')).toBeEnabled();
  }
  await a.locator('#party-start').click();
  await expect(a.locator('#party-question-open')).toBeVisible({timeout:20000});
  await expect(b.locator('#party-question-open')).toBeVisible({timeout:20000});
  for(const page of [a,b])await page.locator('#party-question-open').click();
  const prompt=await a.locator('.party-question h3').innerText();
  await expect(b.locator('.party-question h3')).toHaveText(prompt);
  await a.locator('#party-answer').fill(answer(prompt));
  await a.locator('#party-answer-form .primary').click();
  await expect(b.locator('.party-question')).toContainText('초대나무님이 맞혔어요');
  await b.screenshot({path:info.outputPath('friends-adventure-shared-answer.png')});
 }finally{for(const d of devices.reverse())await d.browser.close();}
});

test('friend lobby remains usable in portrait, landscape and tablet viewports',async({browser},info)=>{
 test.setTimeout(150000);
 const mobile=info.project.use.isMobile===true;
 const d=await device(browser,info,{viewport:{width:390,height:844},isMobile:mobile,hasTouch:mobile});
 try{
  const page=await begin(d.context,'화면나무',3,1,false);
  await page.locator('#party-open').click();await page.locator('#party-create').click();
  await expect(page.locator('.party-members li')).toHaveCount(4);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:768,height:1024}]){
   await page.setViewportSize(viewport);
   await expect(page.locator('#party-start')).toBeDisabled();
   await page.locator('#party-start').scrollIntoViewIfNeeded();
   const box=await page.locator('#party-start').boundingBox();
   expect(box.height).toBeGreaterThanOrEqual(48);
   expect(box.x).toBeGreaterThanOrEqual(0);
   expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
   await page.screenshot({path:info.outputPath('friend-lobby-'+viewport.width+'x'+viewport.height+'.png')});
  }
 }finally{await d.browser.close();}
});
