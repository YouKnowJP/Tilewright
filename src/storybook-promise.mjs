import { blankAdventure, editAdventure, normalizeAdventure } from './workshop-model.mjs';
import { normalizeBook } from './storybook-model.mjs';

export const PROMISE_LEVELS = ['crossroads', 'ferry', 'workshop', 'river-home', 'listening-garden'];
const titles = ['The Crossroads Letter', 'A Ferry for Everyone', 'The Spare-Part Garden', 'The River Remembers', 'Vesper’s Listening Garden'];
// These journals are authored and checked on both rule sets with the other clears.
export const PROMISE_CLEARS = {"crossroads": ["right", "dash-right", "right", "interact:post-wheel", "dash-right", "right", "up", "dash-up", "up", "up", "dash-right", "up", "right", "right", "dash-down", "down", "dash-down", "down", "left", "left", "left", "dash-left", "left", "dash-left", "left", "left", "down"], "ferry": ["dash-up", "up", "dash-right", "right", "up", "right", "right", "down", "right", "right", "right", "dash-right", "right", "dash-up", "right", "down", "dash-down", "down", "down", "dash-up", "up", "left", "dash-left", "left", "left", "left", "left", "up", "left", "left", "down", "down", "dash-left", "down", "dash-down"], "workshop": ["dash-up", "up", "dash-up", "up", "right", "right", "dash-right", "down", "interact:spark", "right", "dash-down", "down", "dash-right", "right", "right", "right", "interact:shape", "up", "dash-up", "right", "down", "dash-down", "wait", "dash-down", "up", "left", "dash-left", "up", "left", "left", "dash-left", "down", "dash-down", "left", "left", "left"], "river-home": ["dash-right", "right", "dash-right", "right", "right", "dash-up", "up", "wait", "dash-up", "right", "right", "dash-right", "down", "down", "right", "dash-down", "down", "dash-left", "up", "up", "interact:river-letter", "dash-right", "up", "interact:moss", "close-dialogue", "left", "left", "left", "dash-down", "down", "left", "left", "dash-left", "left", "down", "dash-left", "left"], "listening-garden": ["up", "dash-up", "up", "dash-right", "down", "down", "right", "dash-down", "interact:listen", "down", "dash-right", "right", "right", "right", "right", "dash-right", "right", "up", "dash-left", "interact:answer", "left", "down", "left", "dash-left", "left", "dash-left", "left", "left"]};
export function promiseWorld(id) {
  const index = PROMISE_LEVELS.indexOf(id); if (index < 0) throw Error('Choose a known promise chapter.');
  const base = blankAdventure(18, 12), map = base.map, markers = [], add = (kind, id, x, y, extra = {}) => markers.push({ kind, id, x, y, ...extra });
  map.name = titles[index]; map.layers[0].tiles.fill(1); map.layers[1].tiles.fill(0);
  const tile = (x,y,value,layer=0) => { map.layers[layer].tiles[y*18+x] = value; };
  for (let y=0;y<12;y++) for(let x=0;x<18;x++) {
    if (!x || !y || x===17 || y===11) tile(x,y,7,1);
    else if (y===8 || x===3) tile(x,y,5);
    else if ((x*7+y*11)%23===0) tile(x,y,10,1);
  }
  const river = crossings => { for(let y=1;y<11;y++)tile(8,y,3);for(const y of crossings)tile(8,y,12); };
  add('start','start',2,8); add('beacon','home',3,9);
  let kit='none', hint='', intro='', ending='';
  if(index===0){
    river([4,8]);add('lever','post-wheel',6,8,{name:'Crossroads wheel'});add('door','post-door',8,8);add('plate','high-plate',6,4);add('crate','high-crate',5,4);add('bridge','high-bridge',8,4);
    add('lantern','letter-light',13,2);add('coin','post-stamp',5,2);add('coin','river-stamp',14,9);
    add('guide','nessa',3,7,{name:'Nessa',text:'Two letters. One pair of hands. Moss needs a ferry; Ilex needs a workshop. Restore the crossroads light, then choose whose road you will mend first at camp. The other keeper will understand.'});
    intro='Nessa has two letters and one keeper to carry them. Restore the eastern light by opening the low crossing or holding the high bridge. At camp, your choice will lead to a different world and ending.';
    hint='The wheel at column 7, row 9 opens the low crossing. Or push the high crate east onto its plate and walk around it. The next story choice waits at camp.';
    ending='The post lamp shines on two envelopes. One smells of reeds; the other is folded into a paper star. Both are invitations. Which promise will you carry?';
  }else if(index===1){
    river([5]);add('plate','ferry-weight',6,5);add('crate','ferry-crate',5,5);add('bridge','ferry-span',8,5);add('lantern','ferry-light',13,3);add('lantern','landing-light',14,8);
    add('guide','moss',4,8,{name:'Moss',text:'A ferry is a promise that the far bank belongs to everyone. Push the counterweight onto the plate. Leave it there for the return trip; the lantern double is only a temporary answer.'});kit='echoist';add('coin','reed-token',12,8);
    intro='You chose the ferry. Moss needs a crossing that stays open after you have gone. Leave the counterweight on amber, restore both landing lights, and return to the western beacon.';
    hint='Approach the crate from the west and push it east once. Walk around it via the row above, then cross at row 6. The double offers a temporary alternative, but a crate keeps the road open.';
    ending='Moss sends the first ferry across with nobody aboard. “For whoever comes next,” he says. A bell answers from the far bank. The river has one more promise for you.';
  }else if(index===2){
    river([6]);add('gate','garden-lock',8,6);add('key','spare-key',4,2);add('lantern','studio-light',13,3);add('lantern','bench-light',13,8);kit='bellrunner';
    add('guide','ilex',5,8,{name:'Ilex',text:'You brought the workshop letter! The spare key is in the north garden. Ring the two bench bells in order. Every invention begins with someone leaving room for another idea.'});
    add('bell','spark',6,3,{name:'Spark',order:1});add('bell','shape',12,6,{name:'Shape',order:2});add('coin','brass-star',15,8);
    intro='You chose the workshop. Find the spare key, ring Spark then Shape, and restore the two workbench lamps. Ilex is building a garden that can listen as well as shine.';
    hint='Collect the key in the northwest garden. Ring Spark from beside it, unlock the crossing at row 7, then ring Shape from the eastern bank before returning.';
    ending='Ilex folds a spare gear into a paper star. It turns when you speak. “Vesper used to keep the listening garden,” she says. “Perhaps we can teach it a kinder song.”';
  }else if(index===3){
    river([8]);add('lantern','north-light',13,3);add('lantern','south-light',14,8);add('relic','river-letter',12,6,{name:'Moss’s river letter'});add('rescue','moss',14,4,{name:'Moss',text:'The last ferry carried my old notebook. Restore both lamps and I will walk home with you. Bring the letter too: Nessa has waited long enough.'});
    add('coin','river-pearl',15,9);add('guide','nessa',4,7,{name:'Nessa',text:'Moss took the river route. The letter is singing on the far bank. Bring him and his story home together.'});
    intro='The ferry brought Moss to the old landing. Restore both lights, take his singing letter, and speak to him before returning to the beacon. Your repaired crossing keeps the way home open.';
    hint='Cross at row 9. Restore both eastern lamps before speaking to Moss beside the northern landing. Take the letter from an adjacent cell and return with both keeper and cargo.';
    ending='The river letter is a map of every crossing Moss ever repaired. He adds yours in blue. Nessa hangs a small ferry above the postbox. The road you chose has become a way home for someone else.';
  }else{
    kit='mistweaver';add('lantern','west-light',4,4);add('lantern','east-light',14,8);add('bell','listen',5,8,{name:'Listen',order:1});add('bell','answer',12,8,{name:'Answer',order:2});
    add('hunter','vesper',13,2,{name:'Vesper, the Listener',rival:'listener',vision:3,route:[{x:13,y:2},{x:15,y:2}]});
    add('coin','brave-star',14,3);add('coin','quiet-star',10,9);add('supplies','field-kit',7,8);
    for(let x=7;x<=15;x++)add('fern',`fern-${x}`,x,9);for(let y=3;y<=8;y++)add('fern',`west-fern-${y}`,7,y);
    add('guide','ilex',3,7,{name:'Ilex',text:'Vesper announces its next counter in Plan. Repeated dashes teach it a long reach; predictable steps teach it an interception. A false light still fools it. The southern fern path gives you a quiet alternative.'});
    intro='Ilex’s invention has woken Vesper, the Listener. Restore the lights and ring Listen, then Answer. Read its announced counter in Plan, try a distraction, or follow the quiet southern garden. The northern star is an optional risk.';
    hint='The west light and both bells are outside Vesper’s northern patrol. The southern fern line reaches the east light quietly. Use Plan before approaching the optional northern treasure; counters commit before your action.';
    ending='Vesper hears the two bells and lowers its searchlight. Ilex adds a new line to its instructions: “A different answer is still an answer.” Back in town, paper stars turn slowly above a workshop built for everyone.';
  }
  for(const marker of markers)tile(marker.x,marker.y,0,1);
  const world=editAdventure(base,{title:titles[index],author:'Lantern Trails',description:['A story choice that changes the road ahead.','A lasting crossing or a borrowed footstep.','Keys, ordered bells, and a new invention.','A rescue and singing-letter homecoming.','A named rival learns patterns; quiet routes remain open.'][index],source:'Storybook original',theme:index===4?'archive':index===2?'clockwork':index===3?'coast':'woodland',kit,map,markers,par:[30,38,40,40,32][index],intro,hint,ending});
  return normalizeAdventure({...world,...(PROMISE_CLEARS[id]?{proof:{difficulty:'trail',actions:PROMISE_CLEARS[id]}}:{})});
}
export function promiseBook(){
  return normalizeBook({title:'The Keeper’s Promise',author:'Lantern Trails',synopsis:'Two letters. Two roads. Choose the ferry or the workshop, then follow your decision through different worlds, reunions, and endings.',ending:'Every promise leaves a road behind.',chapters:[
    {world:promiseWorld('crossroads'),passage:'Nessa lays two letters on the counter. Moss needs a ferry restored. Ilex needs a workshop lit. “You can only take one road today,” she says. “But a promise kept is never a small thing.”',routes:[{id:'ferry',label:'Carry Moss’s ferry letter',description:'Repair a permanent crossing, then bring a keeper and his river letter home.',target:1},{id:'workshop',label:'Carry Ilex’s workshop letter',description:'Rebuild the workbenches, then meet a rival that listens to your footsteps.',target:2}]},
    {world:promiseWorld('ferry'),passage:'You follow the reed-scented envelope. Moss waits beside a counterweight, already making room on the far bank for the next traveler.',next:3},
    {world:promiseWorld('workshop'),passage:'You follow the paper-star envelope. Ilex has laid out two bells and a spare key. Somewhere beyond the benches, a listening machine is waking.',next:4},
    {world:promiseWorld('river-home'),passage:'The ferry moves again. Moss has gone ahead to recover the old river letter. This time, the road you repaired will bring him home.',next:'end',ending:'THE FERRY ENDING — A copper ferry hangs above Nessa’s postbox. Moss has named the crossing after everyone who will need it. The village remembers the road you kept open.'},
    {world:promiseWorld('listening-garden'),passage:'Your repaired workshop has given Vesper a voice. It remembers footsteps, but it has never heard an answer made of bells. Ilex asks you to try.',next:'end',ending:'THE WORKSHOP ENDING — Ilex’s paper stars turn above the village. Vesper keeps the garden now, listening for songs instead of mistakes. The village remembers the space you made for new ideas.'},
  ]});
}
