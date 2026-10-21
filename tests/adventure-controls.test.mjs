import test from 'node:test';
import assert from 'node:assert/strict';
import { movementKey, controlHelp, gestureDirection, gamepadSnapshot, gamepadPress } from '../src/adventure-controls.mjs';
import { DEFAULT_PREFERENCES } from '../src/adventure-preferences.mjs';
const pad=()=>({connected:true,mapping:'standard',index:0,id:'test controller',buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]});
test('all three keyboard layouts retain arrows and uppercase controls; layouts never consume unrelated keys',()=>{
  for(const [layout,keys]of [['wasd',['w','d','s','a']],['ijkl',['i','l','k','j']]])for(const [i,key]of keys.entries()){assert.equal(movementKey(key,layout),['up','right','down','left'][i]);assert.equal(movementKey(key.toUpperCase(),layout),['up','right','down','left'][i]);}
  for(const layout of ['wasd','ijkl','arrows','invalid'])for(const [i,key]of ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].entries())assert.equal(movementKey(key,layout),['up','right','down','left'][i]);
  assert.equal(movementKey('w','ijkl'),null);assert.equal(movementKey('i','wasd'),null);assert.equal(movementKey('w','arrows'),null);assert.equal(movementKey('e'),null);
});
for(const style of ['auto','swipe'])test(`${style} gestures produce one cardinal step and reject short/diagonal/invalid movements`,()=>{
  const a={x:100,y:100};for(const [b,direction]of [[{x:140,y:100},'right'],[{x:60,y:100},'left'],[{x:100,y:60},'up'],[{x:100,y:140},'down']])assert.equal(gestureDirection(style,a,b),direction);
  for(const b of [{x:110,y:105},{x:140,y:140},{x:NaN,y:0},{x:Infinity,y:0}])assert.equal(gestureDirection(style,a,b),null);
});
test('tap-to-step uses the actual player anchor, ignores the keeper itself, and never treats a drag as a tap',()=>{
  const origin={x:50,y:80};for(const [point,direction]of [[{x:80,y:80},'right'],[{x:20,y:80},'left'],[{x:50,y:40},'up'],[{x:50,y:120},'down']])assert.equal(gestureDirection('tap',point,point,origin),direction);
  assert.equal(gestureDirection('tap',origin,origin,origin),null);assert.equal(gestureDirection('tap',{x:100,y:80},{x:140,y:80},origin),null);assert.equal(gestureDirection('tap',origin,{x:70,y:80}),null);
  for(const style of ['pad','keyboard','unknown'])assert.equal(gestureDirection(style,origin,{x:100,y:80},origin),null);
});
test('every visible control style gives accurate keyboard and gesture help',()=>{
  for(const controls of ['auto','pad','swipe','tap','keyboard'])assert.match(controlHelp({...DEFAULT_PREFERENCES,controls,keyboardLayout:'ijkl'}),/IJKL/);
  assert.match(controlHelp({...DEFAULT_PREFERENCES,keyboardLayout:'arrows'}),/Arrow keys/);assert.doesNotMatch(controlHelp({...DEFAULT_PREFERENCES,keyboardLayout:'arrows'}),/WASD/);
});
test('standard controller buttons map to documented actions, on rising edges only',()=>{
  for(const [index,action]of [[0,'interact'],[1,'back'],[2,'power'],[3,'dash'],[4,'decoy'],[5,'shield'],[8,'plan'],[9,'pause'],[10,'cargo'],[12,'up'],[13,'down'],[14,'left'],[15,'right']]){
    const value=pad(),before=gamepadSnapshot(value);value.buttons[index].pressed=true;const after=gamepadSnapshot(value);assert.equal(gamepadPress(after,before),action);assert.equal(gamepadPress(after,after),null);value.buttons[index].pressed=false;assert.equal(gamepadPress(gamepadSnapshot(value),after),null);
  }
});
test('controller stick deadzone, diagonals, missing pads, reconnect, and multiple buttons stay bounded',()=>{
  const value=pad(),neutral=gamepadSnapshot(value);value.axes=[.4,-.4];assert.equal(gamepadPress(gamepadSnapshot(value),neutral),null);value.axes=[-.9,.2];assert.equal(gamepadPress(gamepadSnapshot(value),neutral),'left');value.axes=[.2,-.8];assert.equal(gamepadPress(gamepadSnapshot(value),neutral),'up');value.buttons[9].pressed=true;value.buttons[0].pressed=true;assert.equal(gamepadPress(gamepadSnapshot(value),neutral),'pause');
  assert.equal(gamepadPress(gamepadSnapshot(value),null),null);assert.equal(gamepadSnapshot({...value,mapping:''}),null);assert.equal(gamepadSnapshot({...value,connected:false}),null);assert.equal(gamepadSnapshot(null),null);assert.equal(gamepadPress({...neutral,id:'another controller',held:['up']},neutral),null);
});
