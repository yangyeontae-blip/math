import test from 'node:test';
import assert from 'node:assert/strict';
import { worldMap } from '../src/world-map';
import { newSave } from '../src/rules';
test('island map preserves records, marks one current region and retains grade limits',()=>{
 for(const grade of [1,3,6] as const){const s=newSave('지도',0,grade),before=JSON.stringify(s);s.homestead.inside=true;const map=worldMap(s);assert.match(map,/data-nav="home"[^>]+aria-current="location"/);assert.equal((map.match(/aria-current=/g)||[]).length,1);s.homestead.inside=false;assert.equal(JSON.stringify(s),before);if(grade===1)assert.match(worldMap(s),/data-nav="division"[^>]+disabled/);}
});
