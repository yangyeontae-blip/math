import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureFocus, HUB_DESTINATIONS, showEntityLabel, savedGardenPosition } from '../src/navigation';
import { newSave, journeyFor, validateSave } from '../src/rules';
import { craftHome, placeHome } from '../src/homestead';
import { beginProject } from '../src/adventure';
import { startStory } from '../src/story';

test('first journey stays focused through discovery, placement and a resident visit for grades 1, 3, 6',()=>{
  for(const grade of [1,3,6] as const){
    const s=newSave('탐험가',0,grade);s.forest='addition';
    assert.equal(adventureFocus(s),'start');journeyFor(s).stage=1;
    assert.equal(adventureFocus(s),'discover');
    s.exploration.seen.push('addition:1');s.exploration.solved.push('addition:1');
    assert.equal(adventureFocus(s),'explore');s.homestead.inside=true;
    assert.equal(adventureFocus(s),'craft');const berries=s.berries;
    assert.equal(craftHome(s,6,true),'');assert.equal(placeHome(s,6,3,7,0,true),'');
    assert.equal(s.berries,berries);assert.equal(adventureFocus(s),'visit');
    assert.equal(adventureFocus(validateSave(JSON.parse(JSON.stringify(s)))),'visit');
  }
});
test('active stories and projects keep priority and navigation does not alter a save',()=>{
  const s=newSave('탐험가',0,3);assert.ok(startStory(s,0));
  const before=JSON.stringify(s);assert.equal(adventureFocus(s),'story');assert.equal(JSON.stringify(s),before);
  s.story.active=null;assert.ok(beginProject(s,0));s.homestead.inside=true;
  assert.equal(adventureFocus(s),'project');
  s.room.inside=true;s.homestead.inside=false;assert.equal(adventureFocus(s),'room');
});
test('v21 progress and furnishings survive entering the shared garden annex and restoring',()=>{
  const s=newSave('탐험가',0,6);s.berries=157;craftHome(s,18,true);placeHome(s,18,2,5,0,true);
  beginProject(s,0);s.adventure.active!.values[0]=2;s.homestead.inside=true;s.homestead.position=savedGardenPosition(-7,24);
  assert.deepEqual(s.homestead.position,{x:0,z:12});
  const restored=validateSave(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.berries,157);assert.deepEqual(restored.homestead,s.homestead);assert.deepEqual(restored.adventure,s.adventure);
  const legacy=structuredClone(s);legacy.homestead.position={x:0,z:12};assert.equal(validateSave(legacy).homestead.position.z,12);
});
test('only three main destinations and one nearest actionable name are exposed',()=>{
  assert.deepEqual(HUB_DESTINATIONS.map(d=>d.id),['explore','home','shops']);
  const ids=['noticeBoard','journey','tree1','beauty','homeVisitor0'];
  assert.equal(ids.filter(id=>showEntityLabel(id,'noticeBoard',true)).length,1);
  assert.ok(ids.every(id=>!showEntityLabel(id,null,true)));assert.equal(showEntityLabel('noticeBoard','noticeBoard',false),false);
});
