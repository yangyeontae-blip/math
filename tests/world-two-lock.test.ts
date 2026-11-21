import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSave} from '../src/rules';
import {WORLD_TWO_REGIONS,WORLD_THREE_START,canEnterWorldTwo,worldTwoLockReason} from '../src/world-two';

test('every locked World 2/3 region explains exactly what is missing, and open regions have no reason',()=>{
 const s=newSave('별모험가',0,3);s.level=59;
 assert.match(worldTwoLockReason(s.world2,s.level,0),/레벨 60부터/);
 s.level=1000;
 for(let id=0;id<WORLD_TWO_REGIONS.length;id++){
  const open=canEnterWorldTwo(s.world2,s.level,id),reason=worldTwoLockReason(s.world2,s.level,id);
  assert.equal(open,reason==='',`region ${id}`);
 }
 s.world2.regions[0]={beacons:[0,1],kills:4,claimed:false};
 assert.equal(worldTwoLockReason(s.world2,s.level,1),'앞 지역 「'+WORLD_TWO_REGIONS[0].name+'」 탐험을 먼저 완수해요 · 등불 2/3 · 정령 4/6');
 assert.equal(worldTwoLockReason(s.world2,s.level,WORLD_THREE_START),'');
 s.world2.regions[WORLD_THREE_START]={beacons:[0,1,2],kills:6,claimed:false};
 assert.match(worldTwoLockReason(s.world2,s.level,WORLD_THREE_START+1),/정령 6\/8/);
 assert.match(worldTwoLockReason(s.world2,s.level,12,true),/탐험을 먼저 완수/);
 assert.equal(worldTwoLockReason(s.world2,s.level,99),'없는 지역이에요.');
});
