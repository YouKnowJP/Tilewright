// New owned material. See LICENSE; prior MIT permissions remain effective.
import {startTinker,tinkerStep,tinkerStateKey,TINKER_LIMIT,tinkerParts} from './pip-tinker.mjs';
import {duoReadiness} from './pip-duo.mjs';
export const REHEARSAL_LENGTHS=Object.freeze([12,24,60,120,240]);
export function rehearseTinker(project,limit=60){
 if(!REHEARSAL_LENGTHS.includes(limit))throw Error('Choose a rehearsal of 12, 24, 60, 120 or 240 ticks.');let state=startTinker(project);const frames=[state],events=[],seen=new Set([tinkerStateKey(state)]);let stop='preview';
 while(state.status==='playing'&&state.ticks<limit&&state.ticks<TINKER_LIMIT){state=tinkerStep(state);frames.push(state);for(const event of state.events)events.push({tick:state.ticks,text:event,kind:event.includes('Delivered')?'delivery':/locker/i.test(event)?'locker':event.includes('Passed parcel')?'handoff':event.includes('Blocked')?'blocked':/cards|loaded|Loaded/.test(event)?'program':'station'});if(state.status!=='playing'){stop=state.status;break;}const key=tinkerStateKey(state);if(seen.has(key)){stop='repeat';break;}seen.add(key);}
 return {frames,events,stop};
}
export function rehearsalAdvice(project,trace){
 if(project.version>=2){const ready=duoReadiness(project);if(!ready.ready)return ready.errors[0];}
 if(!project.programs.flat().includes('use'))return (project.programs.length===1?'Pip’s program has no Use card.':'Both programs have no Use card.')+' Add Use so a companion can collect, deliver or activate a station.';
 if(trace.stop==='won')return 'The route works. Inspect any frame, then try a different route or keep this clear.';
 if(trace.stop==='repeat'){const blocked=trace.events.filter(e=>e.kind==='blocked');return blocked.length?'This route repeats after blocked moves. Inspect the last obstacle: blocked movement still advances the card.':'This route repeats without completing every goal. Inspect the last station and the parcel each partner holds.';}
 const parts=tinkerParts(project),last=trace.frames.at(-1);if(parts.some(p=>p.kind==='receiver'&&!(last.received[p.id]>= (p.parcels||1))))return 'Some windows are still waiting. Filter deliveries, then inspect the last collection, recipe or locker exchange.';
 return 'Check the remaining handoffs, locker goals and home flags. A longer rehearsal may reveal the return route.';
}
