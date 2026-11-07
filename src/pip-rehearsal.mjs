// New owned material. See LICENSE; prior MIT permissions remain effective.
import {startTinker,tinkerStep,tinkerStateKey,TINKER_LIMIT,tinkerParts} from './pip-tinker.mjs';
import {duoReadiness,duoDefinition} from './pip-duo.mjs';
export const REHEARSAL_LENGTHS=Object.freeze([12,24,60,120,240]);
export function rehearseTinker(project,limit=60){
 if(!REHEARSAL_LENGTHS.includes(limit))throw Error('Choose a rehearsal of 12, 24, 60, 120 or 240 ticks.');let state=startTinker(project);const frames=[state],events=[],seen=new Set([tinkerStateKey(state)]);let stop='preview';
 while(state.status==='playing'&&state.ticks<limit&&state.ticks<TINKER_LIMIT){state=tinkerStep(state);frames.push(state);for(const event of state.events)events.push({tick:state.ticks,text:event,kind:/Switch Rail (?:·|reached|linked|blocked)/.test(event)?'rail':/Footfall Counter (?:·|rang)/.test(event)?'footfall':event.includes('Wind Vane turned cards')?'wind':/Rest Stone|Resting|Rest complete/.test(event)?'rest':event.includes('Delivered')?'delivery':/locker/i.test(event)?'locker':event.includes('Passed parcel')?'handoff':event.includes('Blocked')?'blocked':/cards|loaded|Loaded/.test(event)?'program':'station'});if(state.status!=='playing'){stop=state.status;break;}const key=tinkerStateKey(state);if(seen.has(key)){stop='repeat';break;}seen.add(key);}
 return {frames,events,stop};
}
export function rehearsalAdvice(project,trace){
 if(project.version>=2){const ready=duoReadiness(project);if(!ready.ready)return ready.errors[0];}
 if(!project.programs.flat().includes('use'))return (project.programs.length===1?'Pip’s program has no Use card.':'Both programs have no Use card.')+' Add Use so a companion can collect, deliver or activate a station.';
 if(trace.stop==='won')return 'The route works. Inspect any frame, then try a different route or keep this clear.';
 if(trace.stop==='repeat'&&tinkerParts(project).some(p=>p.kind==='rail'))return 'This route repeats with the same ride and cards. Filter Switch Rail rides to check the exit, the power when it moves and where cards resume.';
 if(trace.stop==='repeat'&&tinkerParts(project).some(p=>p.kind==='counter'))return 'This route repeats with the same counter marks and power. Filter Footfalls & pulses and check the courier badge, arrival and next powered turn.';
 if(trace.stop==='repeat'&&tinkerParts(project).some(p=>p.kind==='vane'))return 'This route repeats. Filter Wind turns and check which card follows each arrival. A Wind Vane keeps the next card position; a prism restarts at card 1.';
 if(trace.stop==='repeat'&&tinkerParts(project).some(p=>p.kind==='rest'))return 'This route repeats with the same pauses and machine phases. Filter Resting & pacing, inspect the held next card, then adjust a stone’s pause or the approaching cards.';
 if(trace.stop==='repeat'&&tinkerParts(project).some(p=>p.kind==='tide'))return 'This route repeats across a complete tide cycle. Inspect the next tick’s phase and the blocked cards, then adjust the beacon or the approach.';
 if(trace.stop==='repeat'){const blocked=trace.events.filter(e=>e.kind==='blocked');return blocked.length?'This route repeats after blocked moves. Inspect the last obstacle: blocked movement still advances the card.':'This route repeats without completing every goal. Inspect the last station and the parcel each partner holds.';}
 const parts=tinkerParts(project),last=trace.frames.at(-1);if(parts.some(p=>p.kind==='receiver'&&!(last.received[p.id]>= (p.parcels||1))))return 'Some windows are still waiting. Filter deliveries, then inspect the last collection, recipe or locker exchange.';
 if(project.version>=5&&duoDefinition(project).quietBells&&Object.keys(last.pulses||{}).length)return 'Timed bells are still ringing. Let their countdowns reach zero while returning both couriers to any marked home flags.';
 if(project.version>=13&&duoDefinition(project).quietDrums&&Object.keys(last.drums||{}).length)return 'Drums still hold recorded beats. Switch their sources off, then allow each delayed beat to leave before bringing both friends home.';
 return 'Check the remaining handoffs, locker goals and home flags. A longer rehearsal may reveal the return route.';
}
