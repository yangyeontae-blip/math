import {test,expect} from '@playwright/test';import {newSave} from '../src/rules.ts';
async function start(page){const s=newSave('안전모험가',0,3);s.berries=321;s.settings.lowQuality=true;s.settings.sound=s.settings.music=false;s.tutorial={collected:true,battle:true,shop:true};await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(s=>{localStorage.clear();localStorage.setItem('berry-forest-save-v1',JSON.stringify(s));localStorage.setItem('berry-forest-ambience-v1','off');},s);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await expect(page.locator('#hud')).toBeVisible({timeout:30000});}
test('stability feedback: leaving chat input restores keyboard and touch movement without sending text',async({page})=>{
 await start(page);await page.locator('#plaza-chat-toggle').click();await expect(page.locator('#plaza-chat-input')).toBeEnabled();await page.locator('#plaza-chat-input').fill('모험 이야기');
 const before=await page.evaluate(()=>{const p=window.__berry.getWorld().player.position;return {x:p.x,z:p.z};});
 if(test.info().project.name==='mobile'){
  const rect=await page.locator('#joystick').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.8,rect.y+rect.height*.25,{steps:5});
 }else{const rect=await page.locator('#world canvas').boundingBox();await page.mouse.click(rect.x+rect.width*.45,rect.y+rect.height*.55);await page.keyboard.down('w');}
 await expect.poll(()=>page.evaluate(p=>{const q=window.__berry.getWorld().player.position;return Math.hypot(p.x-q.x,p.z-q.z);},before)).toBeGreaterThan(.3);
 await page.mouse.up();await page.keyboard.up('w');expect(await page.evaluate(()=>window.__berry.getWorld().textInputFocus)).toBe(false);expect(await page.locator('#plaza-chat-input').inputValue()).toBe('모험 이야기');
});
test('stability feedback: real WebGL context loss preserves a saved game and its open menu before resuming',async({page},info)=>{
 await start(page);await page.locator('#settings').click();
 const initial=await page.evaluate(()=>window.__berry.getState().berries);
 await page.evaluate(()=>{const gl=window.__berry.getWorld().renderer.getContext(),extension=gl.getExtension('WEBGL_lose_context');if(!extension)throw Error('context-loss extension unavailable');window.__recoveryExtension=extension;extension.loseContext();});
 await expect(page.locator('#graphics-recovery')).toBeVisible();await expect(page.locator('#graphics-continue')).toBeDisabled();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')).berries)).toBe(initial);
 await page.evaluate(()=>window.__recoveryExtension.restoreContext());await expect(page.locator('#graphics-continue')).toBeEnabled({timeout:30000});await page.screenshot({path:info.outputPath('graphics-recovery.png')});await page.locator('#graphics-continue').click();
 await expect(page.locator('#graphics-recovery')).not.toBeVisible();await expect(page.locator('#modal')).toBeVisible();expect(await page.evaluate(()=>window.__berry.getWorld().paused)).toBe(true);await page.keyboard.press('Escape');expect(await page.evaluate(()=>window.__berry.getWorld().paused)).toBe(false);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('berry-forest-save-v1')).settings.lowQuality)).toBe(true);expect(await page.evaluate(()=>window.__berry.getState().berries)).toBe(initial);
 const before=await page.evaluate(()=>{const p=window.__berry.getWorld().player.position;return {x:p.x,z:p.z};});await page.keyboard.down('w');await expect.poll(()=>page.evaluate(p=>{const q=window.__berry.getWorld().player.position;return Math.hypot(q.x-p.x,q.z-p.z);},before)).toBeGreaterThan(.3);await page.keyboard.up('w');
});
