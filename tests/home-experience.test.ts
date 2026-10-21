import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, addRoomFurniture, placeRoomFurniture, removeRoomFurniture, validateSave } from '../src/rules';
import { HOME_EXIT, atHomeExit, VISITOR_LINES, visitorLines, pickVisitorLine } from '../src/home-experience';

test('home: the village exit is at the end of the path, not beside the entrance',()=>{
  assert.equal(atHomeExit(0,12),false);
  assert.equal(atHomeExit(3,HOME_EXIT.z),false);
  assert.equal(atHomeExit(0,HOME_EXIT.z),true);
  assert.equal(atHomeExit(0,28),true);
});
test('home: 56 original visitor lines are unique and matched to existing scenery',()=>{
  const all=Object.values(VISITOR_LINES).flat();assert.equal(all.length,56);assert.equal(new Set(all).size,56);
  const s=newSave('모험가',0,3),empty=visitorLines(s,false);
  assert.ok(empty.includes(VISITOR_LINES.empty[0]));assert.ok(!empty.includes(VISITOR_LINES.flowers[0]));
  s.homestead.owned[6]=1;s.homestead.objects.push({uid:s.homestead.nextId++,kind:6,column:3,row:3,rotation:0});
  assert.ok(visitorLines(s,false).includes(VISITOR_LINES.flowers[0]));assert.ok(!visitorLines(s,false).includes(VISITOR_LINES.empty[0]));
  assert.ok(visitorLines(s,true).includes(VISITOR_LINES.dogFlowers[0]));assert.ok(!visitorLines(s,true).includes(VISITOR_LINES.welcome[0]));
  for(const random of [0,.5,.999]){const first=pickVisitorLine(s,false,'',()=>random);assert.notEqual(pickVisitorLine(s,false,first,()=>random),first);}
  validateSave(s);
});
test('home: placing, moving, storing and restoring furniture preserves ownership and other progress',()=>{
  const s=newSave('모험가',0,3);s.discoveries.monsters=[0,1];const berries=s.berries,xp=s.xp;
  assert.ok(addRoomFurniture(s,1));assert.ok(placeRoomFurniture(s,1,4,2));validateSave(s);
  const restored=JSON.parse(JSON.stringify(s));validateSave(restored);assert.deepEqual(restored.room.positions['1'],{column:4,row:2});
  assert.ok(removeRoomFurniture(restored,1));assert.ok(addRoomFurniture(restored,1));assert.equal(restored.berries,berries);assert.equal(restored.xp,xp);validateSave(restored);
});
