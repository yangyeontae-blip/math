import test from 'node:test';
import assert from 'node:assert/strict';
import { VILLAGE_SPOTS, villageWelcomeClear, villageMonsterSpot, villageTreeSpot } from '../src/village-layout';
import { stageMonsters, stageTrees } from '../src/stages';
import { pickLine, GREETINGS } from '../src/npc-lines';

test('공지판 대사는 단계 선택 대사와 구분하고 날씨가 안내를 가리지 않음', () => {
  for (let i=0;i<100;i++) {
    const random = () => i / 100;
    assert.ok(GREETINGS.noticeBoard.includes(pickLine('noticeBoard',random,{night:true,rain:true})!));
    assert.ok(GREETINGS.unit.includes(pickLine('unit',random,{night:true,rain:true})!));
    assert.doesNotMatch(pickLine('unit',random)!, /소식|공지/);
  }
});
test('입구·공지판·꽃밭에는 상호작용과 수관을 위한 간격이 있음', () => {
  const spots=Object.values(VILLAGE_SPOTS);
  for(let i=0;i<spots.length;i++) for(let j=i+1;j<spots.length;j++) assert.ok(Math.hypot(spots[i].x-spots[j].x,spots[i].z-spots[j].z)>7);
  for(const at of spots) assert.ok(villageWelcomeClear(at.x,at.z));
  stageTrees(0).forEach((tree,id)=> {const at=villageTreeSpot(id,tree.x,tree.z); assert.ok(!villageWelcomeClear(at.x,at.z));});
  stageMonsters(0).forEach((monster,id)=> {const at=villageMonsterSpot(id,monster.x,monster.z); for(const spot of spots) assert.ok(Math.hypot(at.x-spot.x,at.z-spot.z)>3.5);});
});
