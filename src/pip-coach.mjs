// New owned material. See LICENSE; prior MIT permissions remain effective.
import {clockworkSignal,clockworkBankLabel} from './clockwork.mjs';
import {freightLink} from './pip-freight.mjs';
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function pipAdvice(run){
 const bot=run?.clockwork;if(!bot)return {text:'Meet Pip in a companion adventure or visit Tinkerer’s Trials.',lesson:'first-use'};
 const press=run.stage.clockworkPresses?.find(p=>same(p,bot)),receiver=run.stage.clockworkReceivers?.find(p=>same(p,bot)),stamp=run.stage.clockworkStamps?.find(p=>same(p,bot));
 if(press&&bot.parcel!==press.channel)return {text:`${press.name} needs parcel ${freightLink(press.channel)} (${press.channel}). ${bot.parcel?`Pip keeps its ${bot.parcel} parcel; find the recipe that can use it.`:'Collect a parcel from Q first.'}`,lesson:'paint-parcel'};
 if(receiver&&bot.parcel!==receiver.channel)return {text:`${receiver.name} takes ${receiver.channel}. ${bot.parcel?`Pip is carrying ${bot.parcel}; a wrong delivery keeps it safe.`:'Pip is empty-handed. Return to a source before trying this window.'}`,lesson:'first-use'};
 if(stamp?.flip)return {text:`${stamp.name} will load ${clockworkBankLabel(stamp,clockworkSignal(run,stamp)?'powered':'quiet')} on its next Use. This sign remembers its own next route; the parcel stays in Pip’s hands.`,lesson:'remember-road'};
 if(bot.last==='Blocked')return {text:'The next card still advances after a blocked move. Check the landing tile and any bridge plate. You may need to move the keeper before advancing again.',lesson:'corner-turn'};
 const command=bot.program[bot.index];return {text:command==='use'?'Use acts on Pip’s current tile. Walking onto Q, N or a stamp does not operate it. Read Route hardware to check the tile and parcel.':`Next is card ${bot.index+1}: ${command}. The free rehearsal starts your draft at card 1; the real companion keeps its current card until you Apply.`,lesson:'first-use'};
}
export function pipStateKey(run){const b=run.clockwork;return JSON.stringify([b?.x,b?.y,b?.index,b?.program,b?.parcel,b?.received,b?.presses,b?.stamped,b?.flips,b?.routed,b?.delivered,b?.prisms,run.switches,run.relayProgress,run.player,run.crates]);}
export function pipAdvanceStop(before,after,{mode='event',seen=new Set(),steps=1,max=120}={}){
 if(!after?.clockwork||after.status!=='playing')return 'Trail finished';
 if(after===before||after.turns===before.turns)return 'No turn advanced';
 if(after.health<before.health||after.dialogue||after.events?.some(e=>['hurt','alarm'].includes(e.type)))return 'Your attention is needed';
 if(after.clockwork.last==='Blocked')return 'Pip is blocked';
 const key=pipStateKey(after);if(seen.has(key))return 'The route is repeating';
 if(steps>=max)return 'Advance limit reached';
 const changed=after.events?.some(e=>['clockwork-stop','clockwork-stamp','clockwork-prism','clockwork-press','clockwork-parcel','clockwork-use','story-card','relay','relay-complete','switch'].includes(e.type));
 if(mode==='event'&&changed)return 'Next event reached';
 if(mode==='delivery'&&after.events?.some(e=>e.type==='clockwork-stop'||e.type==='clockwork-parcel'&&e.text?.includes('Delivered')||['story-card','relay-complete'].includes(e.type)))return 'Delivery or story event reached';
 if(mode==='delivery'&&/needs parcel|empty-handed|No lever|No program|exit blocked/i.test(after.clockwork.last||''))return 'Check Pip’s next task';
 return null;
}
