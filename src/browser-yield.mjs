// Replays must make progress even when a background tab stops animation frames.
export function yieldToBrowser({
  requestFrame=globalThis.requestAnimationFrame?.bind(globalThis),
  cancelFrame=globalThis.cancelAnimationFrame?.bind(globalThis),
  setTimer=setTimeout,clearTimer=clearTimeout,delay=40,
}={}) {
  return new Promise(resolve=>{
    let done=false,frame,timer;
    const finish=()=>{if(done)return;done=true;if(frame!==undefined)cancelFrame?.(frame);if(timer!==undefined)clearTimer(timer);resolve();};
    timer=setTimer(finish,delay);
    if(!done&&requestFrame)try{frame=requestFrame(finish);if(done&&frame!==undefined)cancelFrame?.(frame);}catch{ /* The timer still releases a suspended renderer. */ }
  });
}
