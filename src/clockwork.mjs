// New owned material. See LICENSE; prior MIT material retains its permissions.
export const CLOCKWORK_COMMANDS=Object.freeze(['up','right','down','left','wait']);
export function normalizeProgram(value=['right','right','wait']){if(!Array.isArray(value)||value.length!==3||value.some(item=>!CLOCKWORK_COMMANDS.includes(item)))throw Error('A Clockwork companion needs exactly three movement or Wait cards.');return [...value];}
export function clockworkAction(action){return ['clockwork-toggle','clockwork-reset'].includes(action)||/^clockwork-program:(?:up|right|down|left|wait),(?:up|right|down|left|wait),(?:up|right|down|left|wait)$/.test(action);}
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const delta={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0],wait:[0,0]};
export function clockworkStep(run,canEnter){
 const bot=run.clockwork;if(!bot||!bot.running)return run;
 const command=bot.program[bot.index],[dx,dy]=delta[command],point={x:bot.x+dx,y:bot.y+dy};
 const blocked=command!=='wait'&&(!canEnter(run,point)||run.crates.some(crate=>same(crate,point)));
 return {...run,clockwork:{...bot,...(!blocked?point:{}),index:(bot.index+1)%3,last:blocked?'Blocked':command,moves:bot.moves+(command!=='wait'&&!blocked?1:0)}};
}
export function clockworkForecast(run,canEnter){
 const bot=run.clockwork;if(!bot)return '';const command=bot.program[bot.index],[dx,dy]=delta[command],point={x:bot.x+dx,y:bot.y+dy},blocked=!canEnter(run,point)||run.crates.some(crate=>same(crate,point));
 return `${bot.name} at column ${bot.x+1}, row ${bot.y+1}. ${bot.running?`Next: card ${bot.index+1}, ${command}${blocked&&command!=='wait'?' (blocked; the card still advances)':''}.`:'Paused; holds its current plate.'} Loop: ${bot.program.join(' → ')}. Movement happens after your step. Program, Start/Pause and Return to dock each spend one turn and hold the helper still for that turn.`;
}
export function clockworkActionLabel(action){if(action.startsWith('clockwork-program:'))return 'Set companion cards: '+action.slice(18).split(',').map(command=>({up:'North',right:'East',down:'South',left:'West',wait:'Wait'}[command]||command)).join(' → ');if(action==='clockwork-toggle')return 'Start or pause companion';if(action==='clockwork-reset')return 'Return companion to dock';return null;}
