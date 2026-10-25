import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_PLAZA_EXIT, homeExitInReach } from '../src/home-exit';
test('lower garden gateway offers an interaction only within reach, including when standing inside it',()=>{
 assert.equal(HOME_PLAZA_EXIT.x,0);assert.equal(HOME_PLAZA_EXIT.z,26);assert.equal(homeExitInReach(0,26),true);assert.equal(homeExitInReach(0,23.21),true);assert.equal(homeExitInReach(0,23.19),false);assert.equal(homeExitInReach(2.79,26),true);assert.equal(homeExitInReach(2.81,26),false);assert.equal(homeExitInReach(2.5,24),false);assert.equal(homeExitInReach(0,12),false);assert.equal(homeExitInReach(NaN,26),false);assert.equal(homeExitInReach(0,Infinity),false);
});
