import {test,expect} from '@playwright/test';
import {newSave} from '../src/rules.ts';
async function start(page,level=1){const s=newSave('숲모험가',0,3);s.level=level;s.tutorial={collected:true,battle:true,shop:true};s.settings.lowQuality=true;s.settings.music=s.settings.sound=false;await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');},s);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();}
test('hunting grants one saved reward, pauses, reloads at camp and returns to the fork',async({page})=>{
 await start(page);await page.locator('#stage-map').click();await page.locator('[data-nav="hunting"]').first().click();await expect(page.locator('[data-zone="1"]')).toBeDisabled();await page.locator('[data-zone="0"]').click();await expect(page.locator('.location-pill')).toContainText('가시덩굴');
 await page.evaluate(()=>window.__berry.getWorld().player.position.set(-6,0,-1));await page.keyboard.down('f');await expect.poll(()=>page.evaluate(()=>window.__berry.getState().career.stats.defeats),{timeout:30000}).toBeGreaterThan(0);await page.keyboard.up('f');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(saved.career.stats.defeats).toBe(1);expect(saved.berries).toBe(2);expect(saved.xp).toBe(3);expect(saved.learning.correct).toBe(0);expect(saved.career.location.kind).toBe('hunting');
 const paused=await page.evaluate(()=>{window.__berry.getWorld().setPaused(true);return window.__berry.getWorld().huntingStatus.time;});await page.waitForTimeout(400);expect(await page.evaluate(()=>window.__berry.getWorld().huntingStatus.time)).toBe(paused);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('.location-pill')).toContainText('가시덩굴');const back=await page.evaluate(()=>({s:window.__berry.getState(),h:window.__berry.getWorld().huntingStatus}));expect(back.s.career.stats.defeats).toBe(1);expect(back.h.playerHp).toBe(back.h.maxHp);expect(back.h.safe).toBe(true);
 await page.locator('[data-career-action="exit-combat"]').click();await expect(page.locator('.location-pill')).toContainText('중앙 광장');expect(await page.evaluate(()=>window.__berry.getState().career.location)).toBeNull();
});
test('three knight advancements require real practice and preserve a second job loadout',async({page})=>{
 await start(page,60);await page.locator('#academy-open').click();await page.locator('#academy-walk').click();await page.locator('#academy-open').click();await page.locator('[data-career-action="choose-job"][data-job="knight"]').click();
 for(const rank of [1,2,3]){
  await page.locator('[data-career-action="start-trial"]').click();await expect(page.locator('#career-hud')).toBeVisible();
  if(rank===1){await page.locator('#career-hud [data-cast-skill="crescent"]').click();await page.locator('#career-hud [data-cast-skill="charge"]').click();}
  else if(rank===2)await page.locator('#career-hud [data-cast-skill="roots"]').click();
  else {await page.locator('#career-hud [data-cast-skill="guardian"]').click();await page.keyboard.down('f');}
  await expect.poll(()=>page.evaluate(()=>window.__berry.getState().career.trials.knight),{timeout:30000}).toBe(rank);await page.keyboard.up('f');await page.locator('[data-career-action="exit-combat"]').click();await page.locator('#academy-open').click();await page.locator('[data-career-action="advance-job"]').click();
  expect(await page.evaluate(()=>window.__berry.getState().career.ranks.knight)).toBe(rank);
 }
 const first=await page.evaluate(()=>structuredClone(window.__berry.getState().career));await page.locator('[data-career-action="choose-job"][data-job="mage"]').click();await page.locator('[data-career-action="choose-job"][data-job="knight"]').click();const restored=await page.evaluate(()=>window.__berry.getState().career);expect(restored.loadouts.knight).toEqual(first.loadouts.knight);expect(restored.ranks.knight).toBe(3);expect(restored.stats.defeats).toBe(0);expect(await page.evaluate(()=>window.__berry.getState().berries)).toBe(0);
});
test('lifting the movement finger keeps a separately held touch attack running',async({page},info)=>{
 test.skip(info.project.name!=='mobile','Touch-only interaction');
 await start(page,60);await page.locator('#stage-map').click();await page.locator('[data-nav="hunting"]').first().click();await page.locator('[data-zone="3"]').click();
 await page.evaluate(()=>window.__berry.getWorld().player.position.set(-6,0,-1));
 const attack=await page.locator('[data-career-action="attack"]').boundingBox(),stick=await page.locator('#joystick').boundingBox();expect(attack&&stick).toBeTruthy();
 await page.evaluate(()=>{window.__huntTouchTrace=[];for(const type of ['pointerdown','pointerup','pointercancel'])document.addEventListener(type,e=>{const target=e.target.closest?.('[data-career-action="attack"]')?'attack':e.target.closest?.('#joystick')?'joystick':e.target.id;window.__huntTouchTrace.push({type:e.type,id:e.pointerId,target});},true);});
 const cdp=await page.context().newCDPSession(page),move={id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},hit={id:2,x:attack.x+attack.width/2,y:attack.y+attack.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move,hit]});
 // Chrome releases the contact listed in a partial touchEnd. Ending `hit` releases
 // attack; touchMove[hit] does not lift movement. Verify the received pointerup below.
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[move]});
  const trace=await page.evaluate(()=>window.__huntTouchTrace),movement=trace.find(e=>e.type==='pointerdown'&&e.target==='joystick'),attacking=trace.find(e=>e.type==='pointerdown'&&e.target==='attack');expect(movement&&attacking).toBeTruthy();
  try { await expect.poll(()=>page.evaluate(id=>window.__huntTouchTrace.some(e=>e.type==='pointerup'&&e.id===id),movement.id),{timeout:5000}).toBe(true); }
  finally { await info.attach('touch-pointer-trace',{body:JSON.stringify(await page.evaluate(()=>window.__huntTouchTrace),null,2),contentType:'application/json'}); }
  expect(await page.evaluate(id=>window.__huntTouchTrace.some(e=>(e.type==='pointerup'||e.type==='pointercancel')&&e.id===id),attacking.id)).toBe(false);
 const hp=await page.evaluate(()=>window.__berry.getWorld().huntingStatus.enemies[0].hp);
 await expect.poll(()=>page.evaluate(()=>window.__berry.getWorld().huntingStatus.enemies[0].hp),{timeout:10000}).toBeLessThan(hp);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
});
