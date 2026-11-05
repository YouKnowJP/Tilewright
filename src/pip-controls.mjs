// New owned material. See LICENSE; prior MIT permissions remain effective.
import {movementKey} from './adventure-controls.mjs';

// These commands apply only while a Pip garden owns keyboard focus.
// Text fields, menus, browser shortcuts and composition keep their own input.
export function pipCanvasCommand(event,{mode='build',keyboardLayout='arrows',keyRepeat='off'}={}) {
 if(!['build','test','practice'].includes(mode)||event.defaultPrevented||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||typeof event.key!=='string')return null;
 const direction=mode==='practice'?null:movementKey(event.key,keyboardLayout);
 const action=direction?'inspect':event.key===' '||event.key==='Enter'?mode==='build'?'place':'step':event.key.toLowerCase()==='z'?'undo':event.key.toLowerCase()==='r'&&mode==='test'?'run':null;
 if(!action)return null;
 if(event.repeat&&!(action==='inspect'&&keyRepeat==='on'))return {action:'ignore'};
 return direction?{action,direction}:{action};
}

export function pipCanvasHelp({mode='build',keyboardLayout='arrows'}={}) {
 if(mode==='practice')return 'With the garden focused: Space or Enter advances both chosen cards; Z undoes one tick. Hold-to-repeat is off for these actions.';
 const keys=keyboardLayout==='arrows'?'Arrow keys':`Arrow keys or ${keyboardLayout==='ijkl'?'IJKL':'WASD'}`;
 return `With the garden focused: ${keys} inspect tiles. ${mode==='test'?'Space or Enter advances one tick; R runs or pauses.':'Space or Enter places or inspects your selected part.'} Z undoes one ${mode==='test'?'tick':'edit'}. Escape pauses a running test; press it again to leave. Numbers on parcels also identify their colour.`;
}
