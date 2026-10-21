import { gestureDirection, gamepadSnapshot, gamepadPress } from './adventure-controls.mjs';

// Shared by the real game and training. Browser pinch/cancel never becomes a move.
export function createMapInput(canvas,{preferences,enabled,origin,onMove}) {
  let pointer=null,blocked=false;const active=new Set();
  const cancel=()=>{pointer=null;blocked=false;active.clear();};
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;active.add(event.pointerId);
    if(active.size>1||event.isPrimary===false){pointer=null;blocked=true;return;}
    if(!enabled()||!['auto','swipe','tap'].includes(preferences().controls))return;
    pointer={x:event.clientX,y:event.clientY,id:event.pointerId};canvas.focus({preventScroll:true});
    try{canvas.setPointerCapture(event.pointerId);}catch{pointer=null;}
  });
  canvas.addEventListener('pointerup',event=>{
    const start=pointer;active.delete(event.pointerId);pointer=null;
    if(!blocked&&start?.id===event.pointerId&&canvas.hasPointerCapture(event.pointerId)&&enabled()){
      const direction=gestureDirection(preferences().controls,start,{x:event.clientX,y:event.clientY},origin());if(direction)onMove(direction);
    }
    if(!active.size)blocked=false;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointercancel',cancel);
  canvas.addEventListener('lostpointercapture',event=>{if(pointer?.id===event.pointerId)pointer=null;active.delete(event.pointerId);if(!active.size)blocked=false;});
  window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);document.addEventListener('visibilitychange',cancel);
  document.addEventListener('pointerdown',event=>{if(event.target!==canvas)cancel();});
  return {cancel};
}
export function createGamepadInput({onPress,onStatus,enabled,read=()=>{if(!navigator.getGamepads)throw Error('unavailable');return navigator.getGamepads();},schedule=requestAnimationFrame,unschedule=cancelAnimationFrame}) {
  let frame=null,previous=null,running=false,status='',suspended=false;
  function report(text){if(text!==status){status=text;onStatus(text);}}
  function tick(){
    frame=null;if(!running)return;
    if(document.hidden||document.hasFocus?.()===false){previous=null;suspended=true;frame=schedule(tick);return;}
    let pads;try{pads=Array.from(read()).filter(pad=>pad?.connected);}catch{report('Controller access is unavailable in this browser. Touch and keyboard still work.');running=false;return;}
    const pad=pads.find(item=>item.mapping==='standard'),snapshot=gamepadSnapshot(pad);
    report(pad?'Controller ready · D-pad or left stick to move.':pads.length?'This controller has no standard mapping. Choose touch or keyboard.':'Connect a controller, then press a button to let the browser discover it.');
    const press=suspended?null:gamepadPress(snapshot,previous);previous=snapshot;suspended=false;
    if(press&&enabled())onPress(press);
    frame=schedule(tick);
  }
  function start(){if(running)return;running=true;previous=null;suspended=false;frame=schedule(tick);}
  function stop(){running=false;previous=null;if(frame!==null)unschedule(frame);frame=null;report('Controller is off. Touch and keyboard remain available.');}
  window.addEventListener('blur',()=>{previous=null;suspended=true;});
  return {start,stop};
}
