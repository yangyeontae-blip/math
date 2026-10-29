import {test,expect} from '@playwright/test';
import {newSave} from '../src/rules.ts';
async function start(page,level=1){const s=newSave('숲모험가',0,3);s.level=level;s.tutorial={collected:true,battle:true,shop:true};s.settings.lowQuality=true;s.settings.music=s.settings.sound=false;await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');},s);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible();}
test('hunting grants one saved reward, pauses, reloads at camp and returns to the fork',async({page})=>{
 await start(page);await page.locator('#stage-map').click();await page.locator('[data-nav="hunting"]').first().click();await expect(page.locator('[data-zone="1"]')).toBeDisabled();await expect(page.locator('.career-notice')).toContainText('현재 사냥 공격력 11');await expect(page.locator('[data-zone="0"]')).toContainText('기본 베리 20 · 경험치 12');await page.locator('[data-zone="0"]').click();await expect(page.locator('.location-pill')).toContainText('가시덩굴');
 await page.evaluate(()=>window.__berry.getWorld().player.position.set(-6,0,-1));await page.keyboard.down('f');await expect.poll(()=>page.evaluate(()=>window.__berry.getState().career.stats.defeats),{timeout:30000}).toBeGreaterThan(0);await page.keyboard.up('f');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(saved.career.stats.defeats).toBe(1);expect(saved.berries).toBe(20);expect(saved.xp).toBe(12);expect(saved.learning.correct).toBe(0);expect(saved.career.location.kind).toBe('hunting');
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
  expect(await page.evaluate(()=>window.__berry.getState().career.ranks.knight)).toBe(rank);await expect(page.locator('#career-title')).toHaveText(['','기사 · 1차','수호기사 · 2차','고대숲 기사 · 3차'][rank]);
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


test('level 50 hunting shows and saves the highest-zone reward before and after daily 100',async({page},info)=>{
 for(const count of [0,100]){
  const s=newSave('보상모험가',0,3),now=new Date();s.level=50;s.weapon=22;s.weapons[22]=3;s.berries=1000;s.xp=0;
  s.tutorial={collected:true,battle:true,shop:true};s.settings.lowQuality=true;s.settings.music=s.settings.sound=false;
  s.career.daily={date:[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-'),counts:[0,0,count,0]};
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');},s);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();
  await page.locator('#stage-map').click();await page.locator('[data-nav="hunting"]').first().click();
  const berries=count?25:100,xp=count?15:60;
  await expect(page.locator('[data-zone="2"]')).toContainText('지금 받을 보상: 베리 '+berries+' · 경험치 '+xp);await expect(page.locator('[data-zone="3"]')).toBeDisabled();
  if(count)await expect(page.locator('[data-zone="2"]')).toContainText('오늘 100마리 이후 25%');
  await page.screenshot({path:info.outputPath('level50-reward-'+count+'.png')});
  await page.locator('[data-zone="2"]').click();await page.evaluate(()=>window.__berry.getWorld().player.position.set(-6,0,-1));
  await page.keyboard.down('f');try{await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')).career.stats.defeats),{timeout:30000}).toBe(1);}finally{await page.keyboard.up('f');}
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(saved.berries).toBe(1000+berries);expect(saved.xp).toBe(xp);expect(saved.career.stats.totalBerries).toBe(berries);expect(saved.learning.correct).toBe(0);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')));expect(restored.berries).toBe(saved.berries);expect(restored.xp).toBe(saved.xp);expect(restored.career.stats.defeats).toBe(1);
 }
});
