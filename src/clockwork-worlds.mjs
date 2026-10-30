// New owned material. See LICENSE; prior MIT material retains its permissions.
import {blankAdventure,editAdventure} from './workshop-model.mjs';
import {normalizeBook} from './storybook-model.mjs';
export const CLOCKWORK_LEVELS=Object.freeze(['first-loop','patient-bridge','two-addresses']);
export const CLOCKWORK_CLEARS={
 'first-loop':['clockwork-toggle','right','right','right','wait',...Array(4).fill('right'),...Array(7).fill('left'),'down'],
 'patient-bridge':['clockwork-program:up,up,up','clockwork-toggle','right','right','right','wait','clockwork-toggle',...Array(4).fill('right'),...Array(7).fill('left'),'down'],
 'two-addresses':['clockwork-program:up,up,up','clockwork-toggle',...Array(4).fill('up'),'wait','clockwork-toggle',...Array(7).fill('right'),...Array(7).fill('left'),'clockwork-program:down,down,down','clockwork-toggle',...Array(4).fill('down'),'clockwork-toggle',...Array(7).fill('right'),...Array(7).fill('left'),'down'],
};
const chapters=[
 {title:'A Friend with Three Cards',intro:'Tavi has built Pip, a little brass postkeeper. Pip starts paused. Open Tools → Clockwork companion and Start loop. East, East, Wait repeats after your turns. Pip will reach the north-bank plate and stop at the trees. Cross for the light and bring it home.',passage:'Three cards lie beside a tiny brass boot. “An invention does not have to know everything,” Tavi says. “It only has to make one useful promise, and keep it.”',ending:'Pip delivers its first promise: a bridge that waits for someone else. Tavi writes YOUR TURN beside the three cards.'},
 {title:'The Patient Bridge',intro:'Pip is below the plate this time. Open Tools, choose North for all three cards, and Apply. Start the loop. After four of your turns Pip reaches the plate at column 6, row 4. Pause it there. Read Plan, restore the far light, and return. You can reprogram or Return to dock at any time.',passage:'“A useful machine must also learn to rest,” Tavi says. Pip’s next card is written where everyone can see it. Wait, watch, and give the bridge a patient keeper.',ending:'The bridge stays open while Pip rests. No one calls the pause a mistake. The next address can wait until you are ready.'},
 {title:'Two Addresses, One Promise',intro:'Two islands need light. Set all three cards to North, Start, then walk north four steps, Wait once, and Pause Pip on the upper plate. Cross the upper bridge, restore its light, and return west. Change the loop to South, Start, walk south four steps and Pause on the lower plate. Restore the other light, then return home. Undo restores both of you.',passage:'The last letter has two addresses. Tavi cannot decide which matters more. Pip turns its little brass head toward both windows. Perhaps one friend can keep two promises, one at a time.',ending:'Two windows shine across the water. Pip returns to the workshop with an empty bag and three very ordinary cards. Tavi hangs a fourth above the door: TOGETHER.'},
];
export function clockworkWorld(id,{proof=true}={}){
 const index=CLOCKWORK_LEVELS.indexOf(id);if(index<0)throw Error('Choose a Clockwork Post chapter.');const spec=chapters[index],base=blankAdventure(13,11),map=structuredClone(base.map),w=map.width;map.name=spec.title;
 for(const [i,layer]of map.layers.entries())layer.tiles.fill(i===0?3:0);
 const land=(x,y)=>map.layers[0].tiles[y*w+x]=(y===6||index===2&&y===2||index>0&&x===5||index===0&&y===3)?2:1;for(let y=1;y<=9;y++)for(let x=1;x<=11;x++)if(x!==6)land(x,y);
 if(index===2)for(let x=7;x<=11;x++)map.layers[0].tiles[6*w+x]=3;
 const markers=[{kind:'start',id:'start',x:2,y:6},{kind:'beacon',id:'home',x:2,y:7},{kind:'clockwork',id:'pip',x:index===0?2:5,y:index===0?3:index===2?8:7,name:'Pip',program:index===0?['right','right','wait']:['right','wait','left']}];
 const add=(kind,id,x,y,extra={})=>markers.push({kind,id,x,y,...extra});
 add('plate','upper-plate',5,3,{channel:'amber'});add('bridge','upper-bridge',6,index===2?2:6,{channel:'amber'});add('lantern','upper-light',9,index===2?2:6);
 if(index===2){add('plate','lower-plate',5,7,{channel:'jade'});add('bridge','lower-bridge',6,6,{channel:'jade'});add('lantern','lower-light',9,6);land(9,6);}
 // The finale's lower bank must be separate from the upper bank, but have its own bridge lane.
 if(index===2){for(let x=7;x<=11;x++)map.layers[0].tiles[5*w+x]=3;for(let x=7;x<=11;x++)land(x,6);}
 let world=editAdventure(base,{title:spec.title,author:'Lantern Trails',source:'Clockwork Post original',description:'A peaceful programmable-companion puzzle. Three cards, clear next steps, and a bridge to share.',intro:spec.intro,ending:spec.ending,hint:spec.intro,theme:'clockwork',par:[20,22,48][index],map,markers});
 if(proof)world=editAdventure(world,{proof:{difficulty:'trail',actions:CLOCKWORK_CLEARS[id]}});
 return world;
}
export function clockworkBook(){return normalizeBook({title:'The Clockwork Post',author:'Lantern Trails',synopsis:'Three original peaceful chapters with Pip, a programmable companion. Arrange three direction or Wait cards, coordinate a bridge, pause a promise, and deliver light to two islands.',ending:chapters[2].ending,chapters:CLOCKWORK_LEVELS.map((id,index)=>({world:clockworkWorld(id),passage:chapters[index].passage}))});}
