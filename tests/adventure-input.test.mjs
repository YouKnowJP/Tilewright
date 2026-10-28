import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapInput, createGamepadInput } from '../src/adventure-input.mjs';
function browserEnvironment(fn){const originals=['window','document'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]);globalThis.window=new EventTarget();globalThis.document=new EventTarget();document.hidden=false;try{return fn();}finally{for(const [key,descriptor]of originals)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
function mapHarness(){const canvas=new EventTarget(),capture=new Set(),moves=[],preferences={controls:'auto'};let enabled=true;canvas.focus=()=>{};canvas.setPointerCapture=id=>capture.add(id);canvas.hasPointerCapture=id=>capture.has(id);canvas.releasePointerCapture=id=>capture.delete(id);const input=createMapInput(canvas,{preferences:()=>preferences,enabled:()=>enabled,origin:()=>({x:100,y:100}),onMove:direction=>moves.push(direction)});const send=(type,properties={})=>canvas.dispatchEvent(Object.assign(new Event(type),{pointerId:1,button:0,isPrimary:true,clientX:100,clientY:100,...properties}));return {canvas,capture,moves,preferences,input,send,disable:()=>enabled=false};}
test('captured gestures move once; cancelled, lost, or silently released capture never moves',()=>browserEnvironment(()=>{
  const h=mapHarness();h.send('pointerdown');h.send('pointerup',{clientX:140});assert.deepEqual(h.moves,['right']);h.send('pointerup',{clientX:180});assert.equal(h.moves.length,1);
  for(const interruption of ['pointercancel','lostpointercapture','silent-release']){h.send('pointerdown');if(interruption==='silent-release')h.capture.clear();else h.send(interruption);h.send('pointerup',{clientY:40});assert.equal(h.moves.length,1,interruption);}
  h.send('pointerdown');h.send('pointerdown',{pointerId:2,isPrimary:false});h.send('pointerup',{clientY:40});h.send('pointerup',{pointerId:2,clientY:40});assert.equal(h.moves.length,1);
  h.send('pointerdown');window.dispatchEvent(new Event('blur'));h.send('pointerup',{clientY:40});assert.equal(h.moves.length,1);h.send('pointerdown');h.disable();h.send('pointerup',{clientX:160});assert.equal(h.moves.length,1);
}));
test('changing map style, explicit cancellation, and document visibility preserve deliberate turn input',()=>browserEnvironment(()=>{
  const h=mapHarness();h.preferences.controls='pad';h.send('pointerdown');h.send('pointerup',{clientX:160});assert.deepEqual(h.moves,[]);
  h.preferences.controls='tap';h.send('pointerdown',{clientX:140});h.send('pointerup',{clientX:140});assert.deepEqual(h.moves,['right']);
  h.send('pointerdown',{clientY:140});window.dispatchEvent(new Event('resize'));h.send('pointerup',{clientY:140});assert.equal(h.moves.length,1);
  h.send('pointerdown',{clientY:140});h.input.cancel();h.send('pointerup',{clientY:140});assert.equal(h.moves.length,1);
  h.send('pointerdown',{clientY:140});document.dispatchEvent(new Event('visibilitychange'));h.send('pointerup',{clientY:140});assert.equal(h.moves.length,1);
}));
test('controller polling latches connections, suppresses held/background inputs, stops, and handles blocked APIs',()=>browserEnvironment(()=>{
  const pad={connected:true,mapping:'standard',index:0,id:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0]},presses=[],statuses=[];let next=null,pads=[pad],blocked=false;
  const input=createGamepadInput({read:()=>{if(blocked)throw Error('blocked');return pads;},enabled:()=>true,onPress:value=>presses.push(value),onStatus:value=>statuses.push(value),schedule:fn=>{next=fn;return 1;},unschedule:()=>{next=null;}}),tick=()=>{const fn=next;next=null;fn();};
  pad.buttons[1].pressed=true;input.start();tick();assert.deepEqual(presses,[]);pad.buttons[1].pressed=false;tick();pad.buttons[1].pressed=true;tick();assert.deepEqual(presses,['back']);tick();assert.equal(presses.length,1);
  document.hidden=true;tick();document.hidden=false;tick();assert.equal(presses.length,1);pad.buttons[1].pressed=false;tick();pad.buttons[12].pressed=true;tick();assert.deepEqual(presses,['back','up']);
  let focused=false;document.hasFocus=()=>focused;pad.buttons[1].pressed=true;tick();assert.equal(presses.length,2);focused=true;tick();assert.equal(presses.length,2);
  pads=[];tick();pads=[pad];tick();assert.equal(presses.length,2);input.stop();assert.equal(next,null);assert.match(statuses.at(-1),/off/);
  blocked=true;input.start();tick();assert.equal(next,null);assert.match(statuses.at(-1),/unavailable/);assert.equal(presses.length,2);
}));
test('stopping controller polling from a menu action cannot schedule another frame',()=>browserEnvironment(()=>{
  const pad={connected:true,mapping:'standard',index:0,id:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0]};let next=null,input,presses=0;
  input=createGamepadInput({read:()=>[pad],enabled:()=>true,onPress:()=>{presses++;input.stop();},onStatus:()=>{},schedule:fn=>{next=fn;return 1;},unschedule:()=>{next=null;}});
  const tick=()=>{const fn=next;next=null;fn();};input.start();tick();pad.buttons[1].pressed=true;tick();assert.equal(presses,1);assert.equal(next,null);
}));
