import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSave,huntingPower,WEAPONS,OUTFITS,RIDES,PETS} from '../src/rules';
import {itemComparison,itemCardMeta,itemSlotArt,itemSlotAttributes} from '../src/item-presentation';
import {ITEM_ICON_PATHS} from '../src/item-icon-paths';
import {existsSync,readFileSync} from 'node:fs';
import * as T from 'three';
import {mergePlazaAvatar} from '../src/plaza-world';
import {styleEquipment,updateEquipmentEffects} from '../src/equipment-models';

test('equipment comparisons use owned upgrade levels and never mutate the adventure',()=>{
  const s=newSave('숲모험가',0,3);s.weapon=1;s.weapons[1]=2;s.weapons[26]=3;
  const before=structuredClone(s),delta=Math.round(huntingPower({...s,weapon:26})-huntingPower(s));
  assert.match(itemComparison(s,'weapon',26),new RegExp(`공격 ↑${delta}`));
  assert.match(itemComparison(s,'weapon',0),/공격 ↓/);
  assert.match(itemComparison(s,'weapon',1),/현재 장비/);
  for(const [kind,items] of Object.entries({weapon:WEAPONS,outfit:OUTFITS,ride:RIDES,pet:PETS}) as [keyof typeof ITEM_ICON_PATHS,readonly unknown[]][]){
    if(kind==='potion')continue;
    for(let id=0;id<items.length;id++){
      const html=itemComparison(s,kind,id)+itemCardMeta(s,kind,id,false)+itemSlotArt(kind,id,3,true)+itemSlotAttributes(kind,id);
      assert.doesNotMatch(html,/NaN|undefined|Infinity/);
    }
  }
  assert.deepEqual(s,before);
});

test('every saved catalogue ID has both an intact v1 original and a readable v2 SVG',()=>{
  for(const [kind,items] of Object.entries({weapon:WEAPONS,outfit:OUTFITS,ride:RIDES,pet:PETS})){
    const paths=ITEM_ICON_PATHS[kind as keyof typeof ITEM_ICON_PATHS];
    assert.equal(paths.length,items.length);
    for(const path of paths){
      assert.ok(existsSync('public/'+path.replace('berry-items-v2','berry-items-v1')));
      const svg=readFileSync('public/'+path,'utf8');
      assert.match(svg,/viewBox="0 0 128 128"/);
      assert.match(svg,/data-rarity="(common|rare|epic|unique|legendary)"/);
      assert.doesNotMatch(svg,/undefined|NaN|<script|https?:\/\/(?!www.w3.org)/);
    }
  }
});

test('every weapon, outfit, ride and pet shows its painted v3 icon',async()=>{
  const {itemIcon}=await import('../src/item-icons');
  for(const [kind,items] of Object.entries({weapon:WEAPONS,outfit:OUTFITS,ride:RIDES,pet:PETS}))for(let id=0;id<items.length;id++){
    assert.ok(existsSync(`public/art/berry-items-v3/${kind}-${id}.webp`),`${kind}-${id}`);
    assert.ok(itemIcon(kind as 'weapon',id).includes(`berry-items-v3/${kind}-${id}.webp`));
  }
  assert.ok(itemIcon('potion',0).includes('berry-items-v2'));
});

test('plaza batching preserves toon equipment and back-face outlines; low quality hides its effects',()=>{
  const root=new T.Group(),equipment=new T.Group();root.add(equipment);
  const blade=new T.Mesh(new T.BoxGeometry(.2,1,.1),new T.MeshStandardMaterial({color:0x8877cc}));equipment.add(blade);
  styleEquipment(equipment,4,0xffdd88);
  const ink=blade.getObjectByName('equipment-outline') as T.Mesh;
  const ordinary=new T.Mesh(new T.BoxGeometry(.3,.3,.3),new T.MeshStandardMaterial({color:0xffbb88}));root.add(ordinary);
  updateEquipmentEffects(root,0,true,false);
  assert.equal(root.getObjectByName('equipment-glow')?.visible,false);
  const dispose=mergePlazaAvatar(root);
  assert.equal(blade.visible,true);assert.equal(ink.visible,true);
  assert.ok(blade.material instanceof T.MeshToonMaterial);
  assert.equal((ink.material as T.Material).side,T.BackSide);
  assert.equal(ordinary.visible,false);assert.ok(root.getObjectByName('plaza-preserved-body'));
  updateEquipmentEffects(root,1,false,true);
  assert.equal(root.getObjectByName('equipment-glow')?.visible,true);
  dispose();
  root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});
});
