// Presentation guidance only: routes, saved runs, and puzzle rules are unchanged.
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const openingIds=new Set(['trail-1','trail-2','trail-3']);
const cratePlates=run=>run.stage.plates.filter(p=>run.crates.some(c=>same(c,p))).length;

export const openingTrailSubtitle=stage=>stage.id==='trail-3'?'Two crates. One final crossing.':stage.subtitle;
export function openingKeeperText(stage,text){
 if(!openingIds.has(stage.id))return text;
 return text.replace('Wardens show their next step in red. A dash crosses two cells before they move.','You move before the wardens. Avoid both their current tile and their red next-step outline. Wait for an opening; Undo restores a mistaken turn.')
  .replace('You receive one shield.','You receive one shield charge. Open Tools and choose Shield before a risky step.');
}

export function openingTrailGoal(run){
 if(!run||!openingIds.has(run.stage.id)||run.status!=='playing')return '';
 const lit=run.collectedLanterns.length,total=run.stage.lanterns.length;
 if(lit===total)return 'All three lanterns are lit. Reach the turquoise beacon to finish.';
 const locked=run.stage.gates.some(g=>g.type==='key'&&!run.openGates.includes(g.id));
 if(run.stage.id==='trail-1')return !locked?`Find the remaining lanterns: ${lit}/${total} lit. Then follow the turquoise beacon home.`:run.keyCount?'Take your brass key to the gate on the east path.':'Find the brass key north of camp. You can explore at your own pace.';
 const held=cratePlates(run);
 if(run.stage.id==='trail-2'){
  if(held)return 'Keep the crate on its plate. Walk around it to find the three lanterns.';
  const moved=run.crates.some(c=>{const original=run.stage.crates.find(o=>o.id===c.id);return original&&!same(c,original);});
  return moved?'The crate left its plate. Undo the push, or circle around and push it back.':'Push the nearby crate right onto its copper plate to hold the bridge open.';
 }
 if(held<2)return held?'One of two plates held. Leave this crate parked and find the second.':'Park one crate on each copper plate. Both are needed for the crossing.';
 if(locked)return run.keyCount?'Both plates are held. Carry the key through the crossing to the vault.':'Both plates are held. Find the west-bank brass key before the vault.';
 return `Vault open. Find the remaining lanterns: ${lit}/${total} lit.`;
}

export function trailFeedback(run){
 if(!run)return '';
 const pushes=run.events.filter(e=>e.type==='push'),pushed=pushes.at(-1);
 if(pushed&&/^(Pressure plate held\.|Crate moved\.)/.test(run.message)){
  if(run.stage.plates.some(p=>same(p,pushed)))return 'Crate parked on a pressure plate. Leave it there and walk around it.';
  if(run.stage.plates.some(p=>same(p,run.player)))return 'The crate left its plate. You are holding it for now; stepping away will release it. Undo can restore the push.';
  return 'Crate moved. Push it onto a copper pressure plate.';
 }
 const goal=openingTrailGoal(run);
 if(!goal)return run.message;
 if(run.events.some(e=>e.type==='hurt'))return 'A warden caught you. Undo restores this turn and your heart.';
 if(run.events.some(e=>e.type==='lantern')&&run.collectedLanterns.length===run.stage.lanterns.length)return goal;
 if(run.turns===0&&run.message===run.stage.intro||!run.events.length&&['Read the next-step markers. Walk or wait to recharge.','The trail leads onward. Take your time.'].includes(run.message))return goal;
 return run.message;
}
