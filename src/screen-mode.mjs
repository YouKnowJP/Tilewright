// Screen presentation is deliberately independent of game state and saved runs.
export function createScreenMode({doc,root=doc.documentElement,onChange=()=>{}}) {
  let mode='page',busy=false,note='',destroyed=false,wanted=false;
  const current=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
  const snapshot=()=>({mode,busy,note});
  const emit=()=>{if(!destroyed)onChange(snapshot());};
  function changed(){if(current()===root){if(!wanted){mode='native';void leave();return;}mode='native';note='Full screen. Use the screen button or Escape to leave.';}else if(mode==='native'){mode='page';wanted=false;note='Full screen closed.';}emit();}
  doc.addEventListener('fullscreenchange',changed);doc.addEventListener('webkitfullscreenchange',changed);
  async function leave(){
    if(busy)return snapshot();wanted=false;busy=true;emit();
    try {if(current()===root){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(exit)await exit.call(doc);}mode='page';note='Normal view restored.';}
    catch{mode=current()===root?'native':'page';note=mode==='native'?'Use your browser’s Escape or Back control to leave full screen.':'Normal view restored.';}
    finally{busy=false;emit();}return snapshot();
  }
  async function enter(){
    if(busy||mode!=='page')return snapshot();busy=true;wanted=true;note='';emit();
    const request=root.requestFullscreen||root.webkitRequestFullscreen;
    try {
      if(!request||doc.fullscreenEnabled===false||!root.requestFullscreen&&doc.webkitFullscreenEnabled===false)throw Error('not available');
      await request.call(root);
      if(!wanted){mode='page';return snapshot();}
      mode=current()===root?'native':'expanded';note=mode==='native'?'Full screen. Use the screen button or Escape to leave.':'Expanded view fills the available browser space.';
    }catch{const cancelled=!wanted;wanted=false;mode=cancelled?'page':'expanded';note=cancelled?'Full screen closed.':'Expanded view fills the available space. For a separate app window on a phone, use your browser’s Add to Home Screen option.';}
    finally{busy=false;emit();}return snapshot();
  }
  return {get state(){return snapshot();},enter,leave,toggle:()=>mode==='page'?enter():leave(),destroy(){destroyed=true;doc.removeEventListener('fullscreenchange',changed);doc.removeEventListener('webkitfullscreenchange',changed);}};
}
