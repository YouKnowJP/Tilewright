// New owned material. See LICENSE; prior MIT material retains its permissions.
import {switchChange} from './adventure-mechanisms.mjs';
export const CLOCKWORK_COMMANDS=Object.freeze(['up','right','down','left','wait','use']);
export const CLOCKWORK_LABELS=Object.freeze({up:'North ↑',right:'East →',down:'South ↓',left:'West ←',wait:'Wait ·',use:'Use'});
export function normalizeProgram(value=['right','right','wait']){if(!Array.isArray(value)||value.length!==3||value.some(item=>!CLOCKWORK_COMMANDS.includes(item)))throw Error('A Clockwork companion needs exactly three direction, Wait or Use cards.');return [...value];}
export function clockworkAction(action){return ['clockwork-toggle','clockwork-reset','clockwork-step'].includes(action)||/^clockwork-program:(?:up|right|down|left|wait|use),(?:up|right|down|left|wait|use),(?:up|right|down|left|wait|use)$/.test(action);}
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function clockworkGoals(run){
 const stops=run.stage.clockworkStops||[],done=run.clockwork?.delivered||[],last=stops.at(-1);
 return [...stops.map((stop,i)=>({label:`Pip delivery ${i+1}: ${stop.name}`,done:done.includes(stop.id)})),...(last?.required?[{label:`Leave Pip paused at ${last.name}`,done:done.length===stops.length&&same(run.clockwork,last)&&!run.clockwork.running}]:[])];
}
function visitStop(run){
 const stops=run.stage.clockworkStops,bot=run.clockwork,next=stops?.[bot.delivered?.length||0];if(!next||!same(bot,next))return run;
 const text=`${bot.name} delivered stop ${(bot.delivered?.length||0)+1} of ${stops.length}: ${next.name}.`;
 return {...run,clockwork:{...bot,delivered:[...(bot.delivered||[]),next.id],last:text},events:[...run.events,{type:'clockwork-stop',text}]};
}
const delta={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0],wait:[0,0]};
function useCard(run){
 const bot=run.clockwork,lever=run.stage.switches.find(item=>same(item,bot)&&item.operable!==false),bell=run.stage.relays.find(item=>same(item,bot)),events=[];let next=run,text='No lever or bell on this tile.';
 if(lever){const change=switchChange(run,{[lever.id]:!run.switches[lever.id]},{includeClockwork:true});if(change.error)text=change.error;else{next={...run,switches:change.switches};text=`${lever.name} switched ${next.switches[lever.id]?'on':'off'}.`;events.push({type:'switch',name:lever.name,active:next.switches[lever.id]});}}
 else if(bell){if(run.relayProgress===run.stage.sequence.length)text='The melody is already complete.';else if(run.stage.sequence[run.relayProgress]===bell.id){const relayProgress=run.relayProgress+1;next={...run,relayProgress,...(relayProgress===run.stage.sequence.length?{stun:4,alarm:0}:{})};text=relayProgress===run.stage.sequence.length?'Melody complete; signal gates open.':`${bell.name}: note ${relayProgress} of ${run.stage.sequence.length}.`;events.push({type:relayProgress===run.stage.sequence.length?'relay-complete':'relay'});}else{next={...run,relayProgress:run.stage.sequence[0]===bell.id?1:0,alarm:6};text='Wrong bell; the melody starts again. Read the order in Quest.';events.push({type:'alarm'});}}
 return {...next,clockwork:{...bot,last:text},events:[...run.events,...events,{type:'clockwork-use',text:`${bot.name}: ${text}`} ]};
}
export function clockworkStep(run,canEnter){
 const bot=run.clockwork;if(!bot||!bot.running)return run;
 const command=bot.program[bot.index];if(command==='use'){const next=useCard(run);return visitStop({...next,clockwork:{...next.clockwork,index:(bot.index+1)%3}});}
 const [dx,dy]=delta[command],point={x:bot.x+dx,y:bot.y+dy};
 const blocked=command!=='wait'&&(!canEnter(run,point)||run.crates.some(crate=>same(crate,point)));
 return visitStop({...run,clockwork:{...bot,...(!blocked?point:{}),index:(bot.index+1)%3,last:blocked?'Blocked':command,moves:bot.moves+(command!=='wait'&&!blocked?1:0)}});
}
export function clockworkForecast(run,canEnter){
 const bot=run.clockwork;if(!bot)return '';const command=bot.program[bot.index],[dx,dy]=delta[command]||[0,0],point={x:bot.x+dx,y:bot.y+dy},blocked=!canEnter(run,point)||run.crates.some(crate=>same(crate,point));
 return `${bot.name} at column ${bot.x+1}, row ${bot.y+1}. ${bot.running?`Next: card ${bot.index+1}, ${command}${blocked&&!['wait','use'].includes(command)?' (blocked; the card still advances)':''}.`:'Paused; holds its current plate.'} Loop: ${bot.program.join(' → ')}. Movement happens after your step. Use operates a lever or bell on the helper’s tile. Advance one card works while paused and costs one turn. Program, Start/Pause and Return to dock each spend one turn and hold the helper still for that turn.`;
}
export function clockworkRehearsal(run,canEnter,program){normalizeProgram(program);let next={...run,events:[],clockwork:{...run.clockwork,program:[...program],index:0,running:true}};return Array.from({length:6},(_,index)=>{const card=program[next.clockwork.index];next=clockworkStep(next,canEnter);return {step:index+1,card,x:next.clockwork.x,y:next.clockwork.y,result:next.clockwork.last};});}
export function clockworkActionLabel(action){if(action.startsWith('clockwork-program:'))return 'Set companion cards: '+action.slice('clockwork-program:'.length).split(',').map(command=>({up:'North',right:'East',down:'South',left:'West',wait:'Wait',use:'Use'}[command]||command)).join(' → ');if(action==='clockwork-toggle')return 'Start or pause companion';if(action==='clockwork-reset')return 'Return companion to dock';if(action==='clockwork-step')return 'Advance one companion card';return null;}
