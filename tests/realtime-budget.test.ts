import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shouldSendPose,POSE_SEND_MS,POSE_SETTLE_MS} from '../src/plaza-client';
import {HALL_REPORT_MS,hallRetryDelay} from '../src/hall';

const at={x:0,y:0,z:8,angle:0};

test('pose updates are limited to about 2.5 per second while walking',()=>{
 assert.equal(shouldSendPose(null,at,0,0),true);
 assert.equal(shouldSendPose(at,{...at,x:3},1000,1000+200),false);
 assert.equal(shouldSendPose(at,{...at,x:3},1000,1000+POSE_SEND_MS),true);
 let sent=0,last:typeof at|null=null,lastAt=0;
 for(let t=0;t<10000;t+=200){const pose={...at,x:t/100};if(shouldSendPose(last,pose,lastAt,t)){sent++;last=pose;lastAt=t;}}
 assert.ok(sent<=26,`sent ${sent} poses in 10 seconds`);
});

test('tiny jitter waits, but the final resting pose is still delivered',()=>{
 const nudge={...at,x:.05,angle:.02};
 assert.equal(shouldSendPose(at,nudge,0,POSE_SEND_MS),false);
 assert.equal(shouldSendPose(at,nudge,0,POSE_SETTLE_MS),true);
 assert.equal(shouldSendPose(at,{...at,angle:.5},0,POSE_SEND_MS),true);
});

test('hall reports are spaced out and back off when the server is blocked',()=>{
 assert.ok(HALL_REPORT_MS>=120000);
 assert.equal(hallRetryDelay(0),30000);
 assert.ok(hallRetryDelay(1)>hallRetryDelay(0));
 assert.equal(hallRetryDelay(20),600000);
});
