// Optional adventure rules. Old worlds acquire no new state, preserving old journals.
const same = (a,b) => a.x===b.x && a.y===b.y;
const distance = (a,b) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const insideRoom = (p,r) => Math.abs(p.x-r.x)<=r.radius && Math.abs(p.y-r.y)<=r.radius;
export const WONDER_KINDS = ['turntable','vault','partner','rune'];
export const CARD_TRIGGERS = Object.freeze({lanterns:'Every lantern restored',bells:'Bell song completed',rescue:'Keeper rescued',switch:'Lever activated',visit:'Story rune visited',vault:'Vault opened'});
export const CARD_EFFECTS = Object.freeze({open:'Open a linked lever',reveal:'Reveal a place on the map',dialogue:'Change a keeper’s dialogue',message:'Tell a story moment'});
const plain = (value,max,label) => {if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw Error(`${label} needs printable text, up to ${max} characters.`);return value.trim();};
export function normalizeWonderNotes(input,markers) {
  const out={},lookup=id=>markers.find(m=>m.id===id);
  if(input.storyCards!==undefined) {
    if(!Array.isArray(input.storyCards)||input.storyCards.length>6)throw Error('Use at most six story cards.');
    const ids=new Set();out.storyCards=input.storyCards.map(card=>{
      if(!card||!/^card-[1-6]$/.test(card.id)||ids.has(card.id)||!Object.hasOwn(CARD_TRIGGERS,card.when)||!Object.hasOwn(CARD_EFFECTS,card.effect))throw Error('Story cards need unique IDs and known events and outcomes.');ids.add(card.id);
      const source=plain(card.source??'',40,'Story event object'),target=plain(card.target??'',40,'Story outcome object');
      const eventKinds={rescue:['rescue'],switch:['lever'],visit:['rune'],vault:['vault']};
      if(eventKinds[card.when]&&!eventKinds[card.when].includes(lookup(source)?.kind))throw Error('Choose an existing object for this story event.');
      if(card.when==='bells'&&!markers.some(m=>m.kind==='bell'))throw Error('A bell story event needs a bell.');
      const outcomeKinds={open:['lever'],dialogue:['guide','rescue']};
      if(outcomeKinds[card.effect]&&!outcomeKinds[card.effect].includes(lookup(target)?.kind)||card.effect==='reveal'&&!lookup(target))throw Error('Choose an existing object for this story outcome.');
      const text=plain(card.text??'',400,'Story card');if(!text)throw Error('Give each story card a short story moment.');
      return {id:card.id,when:card.when,source,effect:card.effect,target,text};
    });
    if(!out.storyCards.length)delete out.storyCards;
  }
  if(input.hints!==undefined) {
    const h=input.hints;if(!h||!['rotate','crate','bells','twin'].includes(h.practice))throw Error('Choose a known hint practice.');
    const target=plain(h.target??'',40,'Hint focus');if(target&&!lookup(target))throw Error('Choose an existing hint focus object.');
    out.hints={nudge:plain(h.nudge??'',400,'Gentle clue'),focus:plain(h.focus??'',400,'Focused clue'),practice:h.practice,target};
  }
  return out;
}
export function validateWonders(stage) {
  const rooms=stage.turntables||[],vaults=stage.vaults||[];
  if(rooms.length>4||vaults.length>3)throw Error('Use at most four rotating rooms and three optional vaults.');
  for(const room of rooms) {
    if(![1,2,3].includes(room.radius)||room.x-room.radius<0||room.y-room.radius<0||room.x+room.radius>=stage.map.width||room.y+room.radius>=stage.map.height)throw Error('Keep the whole rotating room inside the map.');
    if(rooms.some(other=>other!==room&&Math.abs(room.x-other.x)<=room.radius+other.radius&&Math.abs(room.y-other.y)<=room.radius+other.radius))throw Error('Rotating rooms cannot overlap.');
    if([...stage.enemies,...stage.hunters].some(enemy=>enemy.route.some(p=>insideRoom(p,room))))throw Error('Keep threat routes outside rotating rooms.');
    if([...stage.gates,...stage.npcs,...stage.crates].some(p=>same(p,room)))throw Error('Leave the rotating-room dial clear.');
  }
  // These authored cooperative puzzles are peaceful: each player has time to think.
  if(stage.partner&&vaults.length)throw Error('Two-Lantern worlds are peaceful. Use vaults in single-traveler worlds.');
  if(stage.partner&&(stage.hunters.length||stage.enemies.length||stage.hazards.length))throw Error('Two-Lantern worlds are peaceful. Remove threats and embers before adding a partner.');
  if(stage.partner&&same(stage.partner,stage.start))throw Error('Give the two travelers separate starting cells.');
}
export function initializeWonders(run) {
  if(!(run.stage.turntables?.length||run.stage.vaults?.length||run.stage.partner||run.stage.storyCards?.length))return;
  run.wonders={rotations:{},vaults:[],security:0,treasure:0,fired:[],dialogue:{}};
  if(run.stage.partner)run.twin={active:0,other:{x:run.stage.partner.x,y:run.stage.partner.y},otherFacing:'down'};
}
export function wonderInteractions(run) {
  return [...(run.stage.turntables||[]).map(r=>({...r,kind:'turntable',label:`Rotate ${r.name} clockwise`})),
    ...(run.stage.vaults||[]).filter(v=>!run.wonders.vaults.includes(v.id)).map(v=>({...v,kind:'vault',label:`Open optional ${v.name}`}))];
}
export function wonderPreview(run,item) {
  if(item.kind==='turntable')return `${item.radius*2+1} × ${item.radius*2+1} room · quarter-turn clockwise. Terrain, travelers, and objects turn together. Costs one turn. Threats must leave the square before it can turn. Undo restores it.${run.twin?' Pathfinder operates the dial.':''}`;
  const tier=run.wonders.security+1;
  return `Optional vault · +${tier*75} points. Security ${tier}/3: the marked vault-ring embers ignite on ${tier===1?'every fourth turn':tier===2?'two of every four turns':'three of every four turns'}. Opening takes one turn; that turn is protected by a brief ward. The normal exit stays available. Check Plan. Undo can close it.`;
}
export function wonderProblem(run,item) {
  if(item?.kind==='turntable'&&[...run.hunters,...run.enemies.map(e=>e.route[e.index])].some(p=>insideRoom(p,item)))return 'A threat is inside this room. Draw it outside the dashed square before turning the dial, or Undo your last move.';
  if(item?.kind==='turntable'&&run.twin?.active===0)return 'Switch to Pathfinder to turn this room. Lantern keeper restores the lights.';
  if(item?.kind==='vault'&&run.twin)return 'Optional security vaults belong in single-traveler worlds.';
  return null;
}
export function rotateRoom(run,room,walkableCells) {
  const point=p=>p&&insideRoom(p,room)?{...p,x:room.x-(p.y-room.y),y:room.y+(p.x-room.x)}:p;
  const map={...run.stage.map,layers:run.stage.map.layers.map(layer=>{const tiles=[...layer.tiles];for(let y=room.y-room.radius;y<=room.y+room.radius;y++)for(let x=room.x-room.radius;x<=room.x+room.radius;x++){const p=point({x,y});tiles[p.y*run.stage.map.width+p.x]=layer.tiles[y*run.stage.map.width+x];}return {...layer,tiles};})};
  const stage={...run.stage,map};
  for(const key of ['lanterns','keys','coins','hearts','crates','plates','gates','npcs','relays','supplies','cover','hazards','switches','waystones','vaults','runes','storyTargets','clockworkStops'])if(stage[key])stage[key]=stage[key].map(point);
  for(const key of ['start','exit','relic','delivery','partner','clockwork'])if(stage[key])stage[key]=point(stage[key]);
  const next={...run,stage,walkable:walkableCells(map),player:point(run.player),crates:run.crates.map(point),companions:run.companions.map(point),cargoPoint:point(run.cargoPoint),lure:point(run.lure),seen:[...run.seen],wonders:{...run.wonders,rotations:{...run.wonders.rotations,[room.id]:((Object.hasOwn(run.wonders.rotations,room.id)?run.wonders.rotations[room.id]:0)+1)%4}}};
  if(run.clockwork)next.clockwork=point(run.clockwork);
  if(run.twin)next.twin={...run.twin,other:point(run.twin.other)};
  if(run.guild?.echo)next.guild={...run.guild,echo:point(run.guild.echo)};
  for(let y=room.y-room.radius;y<=room.y+room.radius;y++)for(let x=room.x-room.radius;x<=room.x+room.radius;x++){const p=point({x,y});next.seen[p.y*map.width+p.x]=run.seen[y*map.width+x];}
  if(next.wonders.security)next.stage={...next.stage,hazards:[...next.stage.hazards.filter(h=>!h.vault),...vaultHazards(next)]};
  next.events=[...run.events,{type:'room-turn',name:room.name}];return next;
}
export function openVault(run,vault) {
  const security=run.wonders.security+1,treasure=run.wonders.treasure+security*75;
  const next={...run,ward:Math.max(run.ward,1),wonders:{...run.wonders,vaults:[...run.wonders.vaults,vault.id],security,treasure},events:[...run.events,{type:'vault',name:vault.name,security}]};
  next.stage={...run.stage,hazards:[...run.stage.hazards.filter(h=>!h.vault),...vaultHazards(next)]};return next;
}
export function vaultHazards(run) {
  const tier=run.wonders?.security||0;if(!tier)return [];
  const phases=tier===1?[3]:tier===2?[2,3]:[1,2,3];
  return (run.stage.vaults||[]).flatMap(v=>run.wonders.vaults.includes(v.id)?[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy],i)=>({id:`${v.id}-ring-${i}`,x:v.x+dx,y:v.y+dy,period:4,phases,offset:0,vault:true})).filter(p=>p.x>=0&&p.y>=0&&p.x<run.stage.map.width&&p.y<run.stage.map.height):[]);
}
export function switchTraveler(run) {
  if(!run.twin)return run;
  if(run.carrying)return {...run,events:[],message:'Set down the singing relic before handing over the controls.'};
  return {...run,player:{...run.twin.other},facing:run.twin.otherFacing,twin:{active:1-run.twin.active,other:{...run.player},otherFacing:run.facing},events:[{type:'traveler-switch'}],message:`${run.twin.active===0?'Pathfinder':'Lantern keeper'} takes the lead. Switching costs no turn; both travelers share hearts and supplies.`};
}
export function applyStoryCards(run) {
  if(!run.stage.storyCards?.length)return run;
  let next=run;
  for(let pass=0;pass<6;pass++) {
    let changed=false;
    for(const card of next.stage.storyCards) {
      if(next.wonders.fired.includes(card.id))continue;
      const fires=card.when==='lanterns'?next.collectedLanterns.length===next.stage.lanterns.length:card.when==='bells'?next.relayProgress===next.stage.sequence.length:card.when==='rescue'?next.rescued.includes(card.source):card.when==='switch'?next.switches[card.source]:card.when==='vault'?next.wonders.vaults.includes(card.source):next.stage.runes.some(p=>p.id===card.source&&same(p,next.player));
      if(!fires)continue;
      const wonders={...next.wonders,fired:[...next.wonders.fired,card.id],dialogue:{...next.wonders.dialogue}};
      next={...next,wonders,events:[...next.events,{type:'story-card',text:card.text}],message:card.text};
      if(card.effect==='open')next.switches={...next.switches,[card.target]:true};
      if(card.effect==='dialogue')wonders.dialogue[card.target]=card.text;
      if(card.effect==='reveal') {
        const target=[...(next.stage.storyTargets||[]),...next.stage.lanterns,...next.stage.npcs,...next.stage.switches,...next.stage.runes,...(next.stage.vaults||[]),...next.stage.relays,...next.stage.coins,next.stage.exit].find(p=>p.id===card.target);
        if(target){next.seen=[...next.seen];for(let y=Math.max(0,target.y-2);y<=Math.min(next.stage.map.height-1,target.y+2);y++)for(let x=Math.max(0,target.x-2);x<=Math.min(next.stage.map.width-1,target.x+2);x++)next.seen[y*next.stage.map.width+x]=true;}
      }
      changed=true;
    }
    if(!changed)break;
  }
  return next;
}
export const twinGoal = run => !run.twin || distance(run.twin.other,run.stage.exit)<=1;
export function hintFocus(run) {
  const id=run.stage.hints?.target,stage=run.stage;
  if(run.twin&&id===stage.partner.id)return {...(run.twin.active===1?run.player:run.twin.other),id};
  if(stage.relic&&id===stage.relic.id)return {...(run.carrying?run.player:run.cargoPoint||stage.delivery),id};
  return [...run.crates,...stage.cover,...stage.hazards,...run.hunters,...run.enemies.map(e=>({...e.route[e.index],id:e.id})),stage.start,stage.exit,...stage.lanterns,...stage.keys,...stage.coins,...stage.hearts,...stage.supplies,...stage.gates,...stage.switches,...stage.relays,...stage.npcs,...(stage.waystones||[]),...(stage.turntables||[]),...(stage.vaults||[]),...(stage.runes||[])].find(p=>p.id===id)||null;
}
