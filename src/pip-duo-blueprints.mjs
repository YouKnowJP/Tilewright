// New owned material. See LICENSE; prior MIT permissions remain effective.
import {transformRailExits} from './pip-rails.mjs';
import {normalizeRest} from './pip-rests.mjs';
import {normalizeDrum} from './pip-drums.mjs';
import {normalizeWeave} from './pip-weaves.mjs';
import {normalizeKiln} from './pip-kilns.mjs';
import {normalizeMixer} from './pip-mixers.mjs';
import {normalizeEcho,transformEchoOperation} from './pip-echoes.mjs';
import {normalizeTide} from './pip-tides.mjs';
import {DUO_CHANNELS,duoRequiredVersion,normalizeDuoPart,normalizeDuoProject,duoEditable,duoText} from './pip-duo.mjs';
import {transformProgram,transformPrismOperation} from './clockwork.mjs';
const p=(x,y)=>({x,y}),part=(kind,x,y,extra={})=>({kind,x,y,...extra});
export const DUO_BLUEPRINTS=Object.freeze([
 {id:'rail-corner',name:'Sidecar corner',note:'Start two steps west of Q with East / East / Use. Ride south after the first East and use the second East to reach the window.'},
 {id:'rail-fork',name:'Two-way switch',note:'A quiet rail rolls east. Power sends it around the upper dogleg. Try the ride in each state, then add stations after the exits.'},
 {id:'footfall-bridge',name:'A crossing on two steps',note:'Start two couriers at the western ends. East / Wait / Use on the upper path and East / West / Wait below. A second arrival at O powers the bridge for three turns.'},
 {id:'footfall-kiln',name:'The walking kiln',note:'East / Wait / Use from the western end. O starts one mark from ringing; a five-turn beat reaches the kiln Use. Try a different starting count or arrival rhythm.'},
 {id:'wind-corner',name:'A walking corner',note:'East / East / Use from the western end collects at Q. F turns the very next movement south toward the press; the second vane turns east again toward the window.'},
 {id:'wind-mirrors',name:'A mirrored stroll',note:'Use East / Wait / Use from the western end. Two Wind Vanes turn a courier back at either end; tune the mirrors or swap them for other turns in the compass panel.'},
 {id:'rest-crossing',name:'The patient crossing',note:'R pauses a courier after entry while the tide keeps turning. Tune the pause and clock phase to meet the bridge. Cards resume exactly where they stopped.'},
 {id:'rest-rendezvous',name:'The wayside meeting',note:'Two independently timed Rest Stones lead toward a handoff and a window. Write the friends’ approach cards, then compose pauses to bring them together.'},
 {id:'drum-crossing',name:'The delayed crossing',note:'A Memory Drum repeats the tide on a different power number. Tune its delay and the clock to open a bridge after the original beat has passed.'},
 {id:'drum-dispatch',name:'The returning beat',note:'A bell sends a beat into a Memory Drum. The delayed output powers a signal after the bell is quiet. Compose each station’s timing, then rewrite its routes.'},
 {id:'weave-crossing',name:'The two-source crossing',note:'W combines two tide sources into numbered bridge power. Tune the relay rule and clock rhythm. Sources are sampled together; relays never feed other relays.'},
 {id:'weave-dispatch',name:'The woven dispatch',note:'Two lanterns feed W. Use the numbered signal to compare Quiet and Powered roads. Rewrite its cards, tune the relay rule and rewire every power port together.'},
 {id:'kiln-lane',name:'The clock-fired atelier',note:'A tide powers a two-recipe kiln. Use reads power from the start of its turn. Match the delivery window to the Powered output, then tune the approach or the tide phase.'},
 {id:'kiln-dispatch',name:'The lantern kiln',note:'Use L to change a kiln’s recipe on the next tick. Both outputs are useful: add windows, mixers or cargo compasses to choose what happens next.'},
 {id:'mixing-lane',name:'The little mixing house',note:'Y keeps one ingredient. Bring the other to carry the blend to N. Either ingredient can go first; wrong parcels stay safe. Plan a second visit or a route for your friend.'},
 {id:'mixing-dispatch',name:'The bowl and the cargo fork',note:'A bowl leads to a cargo compass. Empty hands return west; a blended parcel takes the northern road. Rewrite either bank and add wells or lockers to supply both ingredients.'},
 {id:'echo-atelier',name:'The echo atelier',note:'Use J to learn a friend’s route. East / Wait / Use then collects, presses and delivers. Choose the echo arrangement and recipe; the friend supplies the cards.'},
 {id:'echo-dispatch',name:'A reply at the dispatch fork',note:'An echo leads to a numbered signal. Quiet returns west; Powered takes the northern road. Rewrite either bank without moving the piece or changing its power number.'},
 {id:'scale-crossing',name:'A bridge with a cargo scale',note:'V powers B only while the chosen courier stands on it with matching cargo. Power is sampled before either courier acts; occupied bridges stay safe.'},
 {id:'scale-dispatch',name:'The weighhouse dispatch',note:'A cargo scale powers a matching signal. Quiet waits; Powered takes the delivery road. Choose a cargo condition and badge, then wire its power independently.'},
 {id:'tide-crossing',name:'A bridge with a tide chart',note:'T runs automatically from turn one. Its open beats power B; occupied crossings stay safe. Tune the cycle and phase, then rehearse both couriers.'},
 {id:'tide-fork',name:'The rhythmic dispatch sign',note:'T powers the numbered signal at the start of a turn. Quiet waits; Powered sends a courier east. Adjust its phase, or stagger repeated copies.'},
 {id:'recipe',name:'Parcel atelier',note:'Put a courier two tiles before Q. East / East / Use collects, converts and delivers. Choose different input and output parcels.'},
 {id:'return-sign',name:'A sign with two roads',note:'Use on Z chooses its next route. The northern glass returns the courier; the other bank opens the road to the right. Add your own wells and windows.'},
 {id:'tube-pair',name:'A little brass shortcut',note:'Use on either U travels to the other end of its colour. Keep one complete pair per tube colour.'},
 {id:'crossing',name:'A bridge for a friend',note:'One partner holds P while the other crosses B. The plate and bridge share a numbered colour.'},
 {id:'locker-pair',name:'Letters across the water',note:'K sends at one end and collects at the other. Its numbered colour names the connection; any parcel can travel. One parcel fits in each channel.'},
 {id:'cargo-switch',name:'A compass for your pockets',note:'Use C with a matching parcel to go east. Otherwise return west. The northern and western mirrors make a little road for experiments.'},
 {id:'night-atelier',name:'The midnight dyehouse',note:'Use two tiles before Q. Collect, convert and send through K. Place a matching collect locker on your partner’s road.'},
 {id:'locker-loop',name:'The patient collector',note:'A collect locker and cargo compass wait for a parcel. Mirrors return empty hands. Add a window two tiles east of C.'},
 {id:'waiting-bell',name:'A bell that waits',note:'Put Sprout on C with Wait / Wait / Use, and a handoff beside it. Empty hands keep waiting; a parcel chooses North / North / Use, delivers at N and returns by the northern mirror.'},
 {id:'lantern-crossing',name:'A bridge that remembers',note:'Use L to toggle its numbered colour. Matching bridges open next tick and stay powered after a courier leaves. Use any matching L again to switch that channel off.'},
 {id:'lantern-fork',name:'A fork beneath a lantern',note:'Light the left L, then visit M to take its northern route. Another courier can switch L off while the first travels. M reads remembered power on its next Use.'},
 {id:'bell-crossing',name:'A bridge on borrowed beats',note:'Use A to ring its numbered channel for one to six following ticks. Cross B before the countdown ends. Occupied bridges stay safe until the courier leaves.'},
 {id:'bell-fork',name:'The bellkeeper’s fork',note:'Ring A, then Use M while that channel is ringing to take the northern route. Quiet and Powered choose different roads. Configure the duration to fit your cards.'},
 {id:'passport-arch',name:'A passport arch',note:'G inspects a courier’s badge and cargo when entering from the chosen direction. Other directions pass freely. The seal keeps the parcel; Use is not needed.'},
 {id:'passport-lane',name:'The outward-and-home lane',note:'As drawn: the first G inspects the chosen cargo heading East. The second expects empty hands heading West. Put a delivery beyond this lane. The chosen badge applies to both arches.'},
 {id:'turning-atelier',name:'The corner atelier',note:'A well, recipe and clockwise corner lead to a window below. Begin two tiles west of Q with East / East / Use. Change the colours and delivery target to fit your tower.'}
]);
export function normalizeDuoBlueprint(raw){
 if(!raw||raw.format!=='pip-duo-blueprint'||![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].includes(raw.version)||!Number.isInteger(raw.width)||!Number.isInteger(raw.height)||raw.width<1||raw.width>13||raw.height<1||raw.height>9||!Array.isArray(raw.road)||raw.road.length>raw.width*raw.height||!Array.isArray(raw.parts)||(!raw.parts.length&&(raw.version!==5||!raw.road.length))||raw.parts.length>32)throw Error('Choose a garden-sized blueprint with stations or a nonempty road stencil.');
 const valid=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<raw.width&&p.y<raw.height,road=[],parts=[];
 for(const cell of raw.road){if(!valid(cell)||road.some(p=>p.x===cell.x&&p.y===cell.y))throw Error('Blueprint roads must be unique and inside the piece.');road.push(p(cell.x,cell.y));}
 for(const rawPart of raw.parts){const item=normalizeDuoPart(rawPart,{version:raw.version+1});if(!valid(item)||!road.some(p=>p.x===item.x&&p.y===item.y)||parts.some(p=>p.x===item.x&&p.y===item.y))throw Error('Each blueprint part needs its own garden tile.');parts.push(item);}
 for(const c of DUO_CHANNELS){const count=parts.filter(p=>p.kind==='tube'&&p.channel===c).length;if(count!==0&&count!==2)throw Error('Capture or share both ends of each tube colour.');}
 if(raw.version>=2){for(const c of DUO_CHANNELS)if(parts.filter(p=>p.kind==='locker'&&p.channel===c).length>2)throw Error('Each locker channel has at most two ends. Shift colours for separate copies.');if(parts.filter(p=>['flip','signal','cargo','echo'].includes(p.kind)).length>8)throw Error('A blueprint can contain at most eight route memories, signals, cargo compasses and echoes.');for(const kind of ['pip-dock','sprout-dock'])if(parts.filter(p=>p.kind===kind).length>1)throw Error('A blueprint can contain only one home flag for each companion.');}
 return {format:'pip-duo-blueprint',version:raw.version,name:duoText(raw.name,'A little invention'),author:duoText(raw.author,'A trail keeper'),note:duoText(raw.note,'A piece for your next adventure.',180),width:raw.width,height:raw.height,road,parts};
}
export function duoBlueprint(id,{input='amber',second='blue',output='jade',channel='amber',initial=false,turns=0,parcels=1,duration=3,match='jade',courier='either',heading='all',period=4,beats=2,offset=0,echoOperation='copy',kilnInput='amber',kilnQuiet='jade',kilnPowered='blue',kilnChannel='violet',weaveFirst='amber',weaveSecond='jade',weaveChannel='violet',weaveRule='both',drumInput='amber',drumChannel='jade',drumDelay=2,restDuration=2}={}){
 const spec=DUO_BLUEPRINTS.find(b=>b.id===id);if(!spec)throw Error('Choose a duo blueprint.');if(![input,output,channel].every(c=>DUO_CHANNELS.includes(c))||typeof initial!=='boolean'||!Number.isInteger(parcels)||parcels<1||parcels>3||!Number.isInteger(duration)||duration<1||duration>6||!['all','empty','any',...DUO_CHANNELS].includes(match)||!['either','pip','sprout'].includes(courier)||!['all','up','right','down','left'].includes(heading))throw Error('Choose known blueprint colours, routes and delivery targets.');
 let width,height,road,parts;
 if(id==='rail-corner'){
  width=5;height=2;road=[p(0,0),p(1,0),p(2,0),p(3,0),p(3,1),p(4,1)];
  parts=[part('source',2,0,{channel}),part('rail',3,0,{channel,quietExit:'down',poweredExit:'down'}),part('receiver',4,1,{channel,parcels})];
 }
 if(id==='rail-fork'){
  width=5;height=3;road=[...Array.from({length:5},(_,x)=>p(x,1)),p(1,0),p(2,0),p(0,2),p(1,2)];
  parts=[part('rail',1,1,{channel,quietExit:'right',poweredExit:'up'}),part('rail',1,0,{channel,quietExit:'right',poweredExit:'right'}),part('rail',2,0,{channel,quietExit:'down',poweredExit:'down'}),part('counter',1,2,{channel,threshold:2,phase:0,duration:3,courier:'either'})];
 }
 if(id==='footfall-bridge'){width=5;height=3;road=[...Array.from({length:5},(_,x)=>p(x,0)),p(0,2),p(1,2)];parts=[part('source',1,0,{channel}),part('bridge',3,0,{channel}),part('receiver',4,0,{channel,parcels}),part('counter',1,2,{channel,threshold:2,phase:0,duration:3,courier:'either'})];}
 if(id==='footfall-kiln'){width=6;height=1;road=Array.from({length:6},(_,x)=>p(x,0));parts=[part('source',1,0,{channel:kilnInput}),part('counter',2,0,{channel:kilnChannel,threshold:2,phase:1,duration:5,courier:'either'}),part('kiln',3,0,{channel:kilnChannel,input:kilnInput,quiet:kilnQuiet,powered:kilnPowered}),part('receiver',5,0,{channel:kilnPowered,parcels})];}
 if(id==='wind-corner'){width=5;height=3;road=[p(0,0),p(1,0),p(2,0),p(3,0),p(3,1),p(3,2),p(4,2)];parts=[part('source',2,0,{channel:input}),part('vane',3,0,{operation:'rotate'}),part('press',3,1,{channel:input,output}),part('vane',3,2,{operation:'rotate-left'}),part('receiver',4,2,{channel:output,parcels})];}
 if(id==='wind-mirrors'){width=5;height=1;road=Array.from({length:5},(_,x)=>p(x,0));parts=[part('vane',0,0,{operation:'mirror'}),part('source',1,0,{channel}),part('receiver',3,0,{channel,parcels}),part('vane',4,0,{operation:'mirror'})];}
 if(id==='rest-crossing'){width=5;height=2;road=[...Array.from({length:5},(_,x)=>p(x,1)),p(0,0)];parts=[part('tide',0,0,{channel,...normalizeTide({period,beats,offset})}),part('rest',1,1,normalizeRest({duration:restDuration})),part('bridge',3,1,{channel})];}
 if(id==='rest-rendezvous'){width=5;height=3;road=[...Array.from({length:5},(_,x)=>p(x,0)),...Array.from({length:5},(_,x)=>p(x,2)),p(3,1)];parts=[part('rest',1,0,normalizeRest({duration:restDuration})),part('rest',1,2,normalizeRest({duration:restDuration})),part('handoff',3,0),part('receiver',3,1,{channel,parcels})];}
 if(id==='drum-crossing'){width=5;height=2;road=[...Array.from({length:5},(_,x)=>p(x,1)),p(0,0),p(2,0)];parts=[part('tide',0,0,{channel:drumInput,...normalizeTide({period,beats,offset})}),part('drum',2,0,normalizeDrum({input:drumInput,channel:drumChannel,delay:drumDelay})),part('bridge',2,1,{channel:drumChannel})];}
 if(id==='drum-dispatch'){width=3;height=3;road=[p(0,0),p(1,0),p(2,0),p(2,1),p(2,2)];parts=[part('pulse',0,0,{channel:drumInput,duration}),part('drum',2,0,normalizeDrum({input:drumInput,channel:drumChannel,delay:drumDelay})),part('signal',2,2,{channel:drumChannel,program:['left','wait','use'],alternate:['down','wait','use']})];}
 if(id==='weave-crossing'){width=5;height=2;road=[...Array.from({length:5},(_,x)=>p(x,1)),p(0,0),p(2,0),p(4,0)];parts=[part('tide',0,0,{channel:weaveFirst,...normalizeTide({period,beats,offset})}),part('tide',2,0,{channel:weaveSecond,...normalizeTide({period,beats,offset:(offset+1)%period})}),part('weave',4,0,normalizeWeave({first:weaveFirst,second:weaveSecond,channel:weaveChannel,rule:weaveRule})),part('bridge',2,1,{channel:weaveChannel})];}
 if(id==='weave-dispatch'){width=3;height=3;road=[p(0,0),p(1,0),p(2,0),p(0,1),p(0,2),p(1,2),p(2,2)];parts=[part('latch',0,0,{channel:weaveFirst}),part('latch',2,0,{channel:weaveSecond}),part('weave',1,0,normalizeWeave({first:weaveFirst,second:weaveSecond,channel:weaveChannel,rule:weaveRule})),part('signal',0,2,{channel:weaveChannel,program:['wait','wait','use'],alternate:['right','right','use']})];}
 if(id==='kiln-lane'){width=5;height=2;road=[p(0,0),...Array.from({length:5},(_,x)=>p(x,1))];parts=[part('tide',0,0,{channel:kilnChannel,...normalizeTide({period,beats,offset})}),part('source',0,1,{channel:kilnInput}),part('kiln',2,1,normalizeKiln({channel:kilnChannel,input:kilnInput,quiet:kilnQuiet,powered:kilnPowered})),part('receiver',4,1,{channel:kilnPowered,parcels})];}
 if(id==='kiln-dispatch'){width=3;height=3;road=[p(0,0),p(1,0),p(2,0),p(2,1),p(2,2)];parts=[part('latch',0,0,{channel:kilnChannel}),part('kiln',2,0,normalizeKiln({channel:kilnChannel,input:kilnInput,quiet:kilnQuiet,powered:kilnPowered})),part('cargo',2,2,{channel:kilnPowered,program:['left','wait','use'],alternate:['down','wait','use']})];}
 if(id==='mixing-lane'){width=3;height=1;road=Array.from({length:3},(_,x)=>p(x,0));parts=[part('mixer',0,0,normalizeMixer({channel:input,second,output})),part('receiver',2,0,{channel:output,parcels})];}
 if(id==='mixing-dispatch'){width=3;height=3;road=[p(0,2),p(1,2),p(2,2),p(2,1),p(2,0)];parts=[part('mixer',0,2,normalizeMixer({channel:input,second,output})),part('cargo',2,2,{channel:output,program:['left','wait','use'],alternate:['up','wait','use']}),part('prism',2,0,{operation:'mirror-y'})];}
 if(id==='echo-atelier'){if(input===output)throw Error('The echo atelier needs different parcel colours.');width=6;height=1;road=Array.from({length:6},(_,x)=>p(x,0));parts=[part('echo',0,0,normalizeEcho({operation:echoOperation})),part('source',1,0,{channel:input}),part('press',3,0,{channel:input,output}),part('receiver',5,0,{channel:output,parcels})];}
 if(id==='echo-dispatch'){width=3;height=3;road=[p(0,2),p(1,2),p(2,2),p(2,1),p(2,0)];parts=[part('echo',0,2,normalizeEcho({operation:echoOperation})),part('signal',2,2,{channel,program:['left','wait','use'],alternate:['up','wait','use']}),part('prism',2,0,{operation:'mirror-y'})];}
 if(id==='scale-crossing'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('scale',0,0,{channel,match,courier}),part('bridge',2,0,{channel})];}
 if(id==='scale-dispatch'){width=3;height=2;road=[p(0,0),...Array.from({length:3},(_,x)=>p(x,1))];parts=[part('scale',0,0,{channel,match,courier}),part('signal',0,1,{channel,program:['wait','wait','use'],alternate:['right','right','use']})];}
 if(id==='tide-crossing'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('tide',0,0,{channel,...normalizeTide({period,beats,offset})}),part('bridge',2,0,{channel})];}
 if(id==='tide-fork'){width=3;height=2;road=[p(0,0),...Array.from({length:3},(_,x)=>p(x,1))];parts=[part('tide',0,0,{channel,...normalizeTide({period,beats,offset})}),part('signal',0,1,{channel,program:['wait','wait','use'],alternate:['right','right','use']})];}
 if(id==='recipe'){if(input===output)throw Error('The atelier needs different input and output parcels.');width=5;height=1;road=Array.from({length:5},(_,x)=>p(x,0));parts=[part('source',0,0,{channel:input}),part('press',2,0,{channel:input,output}),part('receiver',4,0,{channel:output,parcels})];}
 if(id==='return-sign'){width=2;height=3;road=[p(0,0),p(0,1),p(0,2),p(1,2)];parts=[part('prism',0,0,{operation:'mirror-y'}),part('flip',0,2,{program:['up','wait','use'],alternate:['right','wait','use'],initial})];}
 if(id==='tube-pair'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('tube',0,0,{channel}),part('tube',2,0,{channel})];}
 if(id==='crossing'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('plate',0,0,{channel}),part('bridge',2,0,{channel})];}
 if(id==='locker-pair'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('locker',0,0,{channel,mode:'send'}),part('locker',2,0,{channel,mode:'take'})];}
 if(id==='cargo-switch'){width=5;height=3;road=[p(0,2),p(1,2),p(2,2),p(3,2),p(4,2),p(2,1),p(2,0)];parts=[part('prism',0,2,{operation:'mirror'}),part('cargo',2,2,{channel:'any',program:['left','left','use'],alternate:['right','right','use']}),part('prism',2,0,{operation:'mirror-y'})];}
 if(id==='night-atelier'){if(input===output)throw Error('The dyehouse needs different parcel colours.');width=5;height=1;road=Array.from({length:5},(_,x)=>p(x,0));parts=[part('source',0,0,{channel:input}),part('press',2,0,{channel:input,output}),part('locker',4,0,{channel,mode:'send'})];}
 if(id==='locker-loop'){width=5;height=1;road=Array.from({length:5},(_,x)=>p(x,0));parts=[part('prism',0,0,{operation:'mirror'}),part('locker',2,0,{channel,mode:'take'}),part('cargo',4,0,{channel:'any',program:['left','left','use'],alternate:['right','right','use']})];}
 if(id==='waiting-bell'){width=1;height=5;road=Array.from({length:5},(_,y)=>p(0,y));parts=[part('prism',0,0,{operation:'mirror-y'}),part('receiver',0,2,{channel,parcels}),part('cargo',0,4,{channel:'any',program:['wait','wait','use'],alternate:['up','up','use']})];}
 if(id==='lantern-crossing'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('latch',0,0,{channel}),part('bridge',2,0,{channel})];}
 if(id==='lantern-fork'){width=3;height=3;road=[p(0,2),p(1,2),p(2,2),p(2,1),p(2,0)];parts=[part('latch',0,2,{channel}),part('signal',2,2,{channel,program:['left','wait','use'],alternate:['up','wait','use']}),part('prism',2,0,{operation:'mirror-y'})];}
 if(id==='bell-crossing'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('pulse',0,0,{channel,duration}),part('bridge',2,0,{channel})];}
 if(id==='bell-fork'){width=3;height=3;road=[p(0,2),p(1,2),p(2,2),p(2,1),p(2,0)];parts=[part('pulse',0,2,{channel,duration}),part('signal',2,2,{channel,program:['left','wait','use'],alternate:['up','wait','use']}),part('prism',2,0,{operation:'mirror-y'})];}
 if(id==='passport-arch'){width=1;height=1;road=[p(0,0)];parts=[part('seal',0,0,{channel:match,courier,heading})];}
 if(id==='passport-lane'){width=3;height=1;road=[p(0,0),p(1,0),p(2,0)];parts=[part('seal',0,0,{channel:match,courier,heading:'right'}),part('seal',2,0,{channel:'empty',courier,heading:'left'})];}
 if(id==='turning-atelier'){if(input===output)throw Error('The corner atelier needs different parcel colours.');width=5;height=3;road=[...Array.from({length:5},(_,x)=>p(x,0)),p(4,1),p(4,2)];parts=[part('source',0,0,{channel:input}),part('press',2,0,{channel:input,output}),part('prism',4,0,{operation:'rotate'}),part('receiver',4,2,{channel:output,parcels})];}
 return configureDuoBlueprint({format:'pip-duo-blueprint',version:duoRequiredVersion(parts)-1,name:spec.name,author:'Lantern Trails',note:spec.note,width,height,road,parts},{turns});
}
export function configureDuoBlueprint(input,{turns=0,palette=0,first='keep',reflection='none'}={}){
 let piece=normalizeDuoBlueprint(input);if(!Number.isInteger(turns)||turns<0||turns>3||!Number.isInteger(palette)||palette<0||palette>3||!['keep','a','b'].includes(first)||!['none','horizontal','vertical'].includes(reflection))throw Error('Choose a blueprint direction, reflection, palette and first route.');
 const colour=c=>DUO_CHANNELS.includes(c)?DUO_CHANNELS[(DUO_CHANNELS.indexOf(c)+palette)%4]:c;piece={...piece,parts:piece.parts.map(p=>({...p,...(p.channel?{channel:colour(p.channel)}:{}),...(p.output?{output:colour(p.output)}:{}),...(p.kind==='mixer'?{second:colour(p.second)}:{}),...(p.kind==='drum'?{input:colour(p.input)}:{}),...(p.kind==='weave'?{first:colour(p.first),second:colour(p.second)}:{}),...(p.kind==='kiln'?{input:colour(p.input),quiet:colour(p.quiet),powered:colour(p.powered)}:{}),...(p.kind==='scale'?{match:colour(p.match)}:{}),...(p.kind==='flip'&&first!=='keep'?{initial:first==='b'}:{})}))};
 if(reflection!=='none'){const horizontal=reflection==='horizontal',point=p=>({x:horizontal?piece.width-1-p.x:p.x,y:horizontal?p.y:piece.height-1-p.y}),programOperation=horizontal?'mirror':'mirror-y',prismOperation=horizontal?'mirror-x':'mirror-y';piece={...piece,road:piece.road.map(point),parts:piece.parts.map(p=>({...p,...point(p),...(p.program?{program:transformProgram(p.program,programOperation)}:{}),...(p.alternate?{alternate:transformProgram(p.alternate,programOperation)}:{}),...(p.operation?{operation:p.kind==='echo'?transformEchoOperation(p.operation,prismOperation):transformPrismOperation(p.operation,prismOperation)}:{}),...(p.kind==='rail'?transformRailExits(p,programOperation):{}),...(p.kind==='seal'&&p.heading!=='all'?{heading:transformProgram([p.heading,'wait','wait'],programOperation)[0]}:{})}))};}
 for(let i=0;i<turns;i++){
  const rotate=p=>({x:piece.height-1-p.y,y:p.x});
  piece={...piece,width:piece.height,height:piece.width,road:piece.road.map(rotate),parts:piece.parts.map(p=>({...p,...rotate(p),...(p.program?{program:transformProgram(p.program,'rotate')}:{}),...(p.alternate?{alternate:transformProgram(p.alternate,'rotate')}:{}),...(p.operation?{operation:p.kind==='echo'?transformEchoOperation(p.operation,'rotate'):transformPrismOperation(p.operation,'rotate')}:{}),...(p.kind==='rail'?transformRailExits(p,'rotate'):{}),...(p.kind==='seal'&&p.heading!=='all'?{heading:transformProgram([p.heading,'wait','wait'],'rotate')[0]}:{})}))};
 }
 return normalizeDuoBlueprint(piece);
}
export function placeDuoBlueprint(input,piece,x,y){
 if(!duoEditable(input))throw Error('Remix a story before placing blueprints.');const a=normalizeDuoBlueprint(piece);if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+a.width>input.board.width||y+a.height>input.board.height)throw Error('Move the cursor so the whole blueprint fits.');
 const shifted=a.parts.map(p=>({...p,x:p.x+x,y:p.y+y}));if(shifted.some(p=>input.parts.some(q=>p.x===q.x&&p.y===q.y)))throw Error('Place blueprint parts on free tiles. Existing parts stay safe.');
 const road=[...input.board.road];for(const p of a.road){const cell={x:p.x+x,y:p.y+y};if(!road.some(p=>p.x===cell.x&&p.y===cell.y))road.push(cell);}
 if(!shifted.length&&road.length===input.board.road.length)return normalizeDuoProject(input);const {proof,...base}=input;return normalizeDuoProject({...base,version:Math.max(base.version,a.parts.length?a.version+1:2),parts:[...base.parts,...shifted],board:{...base.board,road}});
}
export function captureDuoBlueprint(input,{x,y,width,height},name='My little invention'){
 if(!duoEditable(input)||![x,y,width,height].every(Number.isInteger)||x<0||y<0||width<1||height<1||x+width>input.board.width||y+height>input.board.height)throw Error('Capture an area inside your duo garden.');
 const inside=p=>p.x>=x&&p.y>=y&&p.x<x+width&&p.y<y+height,shift=p=>({...p,x:p.x-x,y:p.y-y});
 const parts=input.parts.filter(inside).map(shift);return normalizeDuoBlueprint({format:'pip-duo-blueprint',version:parts.length?duoRequiredVersion(parts)-1:5,name,author:input.author,note:'Captured from '+input.name,width,height,road:input.board.road.filter(inside).map(shift),parts});
}
export function repeatDuoBlueprint(input,{count=1,axis='right',gap=1,shiftColours=false,phaseStep=0}={}){
 const piece=normalizeDuoBlueprint(input);if(!Number.isInteger(count)||count<1||count>3||!['right','down'].includes(axis)||!Number.isInteger(gap)||gap<0||gap>2||typeof shiftColours!=='boolean'||!Number.isInteger(phaseStep)||phaseStep<0||phaseStep>7)throw Error('Arrange one to three copies with a gap of zero to two tiles.');
 const width=piece.width+(axis==='right'?(count-1)*(piece.width+gap):0),height=piece.height+(axis==='down'?(count-1)*(piece.height+gap):0);if(width>13||height>9)throw Error('This arrangement is larger than a duo garden.');const road=[],parts=[];
 for(let i=0;i<count;i++){const copy=configureDuoBlueprint(piece,{palette:shiftColours?i:0}),dx=axis==='right'?i*(piece.width+gap):0,dy=axis==='down'?i*(piece.height+gap):0;road.push(...copy.road.map(p=>({...p,x:p.x+dx,y:p.y+dy})));parts.push(...copy.parts.map(p=>({...p,x:p.x+dx,y:p.y+dy,...(p.kind==='tide'?{offset:(p.offset+i*phaseStep)%p.period}:{})})));}
 return normalizeDuoBlueprint({...piece,width,height,road,parts});
}
export function duoBlueprintFit(project,piece,x,y){try{placeDuoBlueprint(project,piece,x,y);return {valid:true,message:`${piece.width} × ${piece.height} fits at column ${x+1}, row ${y+1}.`};}catch(error){return {valid:false,message:error.message};}}
export function serializeDuoBlueprint(piece){return JSON.stringify(normalizeDuoBlueprint(piece))+'\n';}
export function parseDuoBlueprint(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>40_000)throw Error('Choose a duo blueprint smaller than 40 KB.');let p;try{p=JSON.parse(raw);}catch{throw Error('This blueprint is not valid JSON.');}return normalizeDuoBlueprint(p);}

export function retimeDuoBlueprint(input,settings){const piece=normalizeDuoBlueprint(input),rhythm=normalizeTide(settings);if(!piece.parts.some(p=>p.kind==='tide'))throw Error('Choose a blueprint with a tide beacon.');return normalizeDuoBlueprint({...piece,parts:piece.parts.map(p=>p.kind==='tide'?{...p,...rhythm}:p)});}
