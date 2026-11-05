import test from 'node:test';
import assert from 'node:assert/strict';
import {pipCanvasCommand,pipCanvasHelp} from '../src/pip-controls.mjs';
const key=(key,options={},event={})=>pipCanvasCommand({key,...event},options);

test('garden inspection honors arrows and both saved letter layouts without moving couriers',()=>{
 for(const [layout,keys]of [['wasd',['w','d','s','a']],['ijkl',['i','l','k','j']],['arrows',['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']]])for(const [i,k]of keys.entries())for(const mode of ['build','test'])assert.deepEqual(key(k,{mode,keyboardLayout:layout}),{action:'inspect',direction:['up','right','down','left'][i]});
 assert.equal(key('w',{keyboardLayout:'ijkl'}),null);assert.equal(key('i',{keyboardLayout:'wasd'}),null);
});
test('place, step, run and Undo have explicit bench, test and practice meanings',()=>{
 for(const k of [' ','Enter']){assert.deepEqual(key(k),{action:'place'});assert.deepEqual(key(k,{mode:'test'}),{action:'step'});assert.deepEqual(key(k,{mode:'practice'}),{action:'step'});}
 for(const mode of ['build','test','practice'])for(const k of ['z','Z'])assert.deepEqual(key(k,{mode}),{action:'undo'});
 assert.deepEqual(key('R',{mode:'test'}),{action:'run'});assert.equal(key('r'),null);assert.equal(key('r',{mode:'practice'}),null);assert.equal(key('ArrowRight',{mode:'practice'}),null);
});
test('held action keys never spend extra ticks or edits, including when inspection repeat is enabled',()=>{
 for(const mode of ['build','test','practice'])for(const keyRepeat of ['on','off'])for(const k of [' ','Enter','z'])assert.deepEqual(key(k,{mode,keyRepeat},{repeat:true}),{action:'ignore'});
 assert.deepEqual(key('r',{mode:'test',keyRepeat:'on'},{repeat:true}),{action:'ignore'});
 assert.deepEqual(key('ArrowRight',{}, {repeat:true}),{action:'ignore'});assert.deepEqual(key('ArrowRight',{keyRepeat:'on'},{repeat:true}),{action:'inspect',direction:'right'});
});
test('browser shortcuts, composition and already-handled events retain their input',()=>{
 for(const flag of ['ctrlKey','metaKey','altKey','isComposing','defaultPrevented'])for(const k of [' ','Enter','r','z','ArrowUp'])assert.equal(key(k,{mode:'test'},{[flag]:true}),null);
 for(const k of ['Escape','Tab','Process','Dead','F11','Backspace','/'])assert.equal(key(k,{mode:'test'}),null);assert.equal(key(' ',{mode:'other'}),null);assert.equal(pipCanvasCommand({}),null);
});
test('visible keyboard instructions match each garden mode and selected layout',()=>{
 for(const keyboardLayout of ['wasd','ijkl','arrows'])for(const mode of ['build','test']){const text=pipCanvasHelp({mode,keyboardLayout});assert.match(text,/garden focused/);assert.match(text,/inspect tiles/);assert.match(text,mode==='test'?/advances one tick; R runs or pauses/:/places or inspects/);if(keyboardLayout!=='arrows')assert.ok(text.includes(keyboardLayout.toUpperCase()));else assert.doesNotMatch(text,/WASD|IJKL/);}
 assert.match(pipCanvasHelp({mode:'practice'}),/both chosen cards/);assert.doesNotMatch(pipCanvasHelp({mode:'practice'}),/R runs|places/);
});
