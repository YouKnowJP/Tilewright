import test from 'node:test';
import assert from 'node:assert/strict';
import { yieldToBrowser } from '../src/browser-yield.mjs';

function scheduler(){const frames=new Map(),timers=new Map();let id=0;return {frames,timers,requestFrame:cb=>{frames.set(++id,cb);return id;},cancelFrame:key=>frames.delete(key),setTimer:cb=>{timers.set(++id,cb);return id;},clearTimer:key=>timers.delete(key)};}
for(const first of ['frames','timers'])test(`replay yield completes when ${first} fires and releases both scheduled handles`,async()=>{
  const clock=scheduler(),waiting=yieldToBrowser(clock),callback=clock[first].values().next().value;assert.equal(clock.frames.size,1);assert.equal(clock.timers.size,1);callback();await waiting;assert.equal(clock.frames.size,0);assert.equal(clock.timers.size,0);callback();assert.equal(clock.frames.size+clock.timers.size,0);
});
test('a missing or failing animation-frame API still releases the replay through its timer',async()=>{
  for(const requestFrame of [null,()=>{throw Error('suspended');}]){const clock=scheduler(),waiting=yieldToBrowser({...clock,requestFrame});clock.timers.values().next().value();await waiting;assert.equal(clock.timers.size,0);}
});
test('a synchronous renderer callback cannot leave an orphaned fallback timer',async()=>{
  const clock=scheduler();await yieldToBrowser({...clock,requestFrame:cb=>{cb();return 9;}});assert.equal(clock.frames.size+clock.timers.size,0);
});
