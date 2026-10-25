import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_PLAZA_EXIT, homePlazaExitReached } from '../src/home-exit';
test('private village exit is at the lower path and only crossing its approach returns to the plaza',()=>{
 assert.equal(HOME_PLAZA_EXIT.x,0);assert.ok(HOME_PLAZA_EXIT.z>=25&&HOME_PLAZA_EXIT.z<=27.5);
 assert.equal(homePlazaExitReached(0,24.7),false);assert.equal(homePlazaExitReached(0,24.8),true);assert.equal(homePlazaExitReached(1.4,26),true);assert.equal(homePlazaExitReached(1.41,26),false);
 assert.equal(homePlazaExitReached(0,12),false);assert.equal(homePlazaExitReached(-8,20),false);assert.equal(homePlazaExitReached(NaN,26),false);assert.equal(homePlazaExitReached(0,Infinity),false);
});