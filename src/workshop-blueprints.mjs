// New owned material. See LICENSE; prior MIT permissions remain effective.
import {gardenWorld} from './pip-gardens-worlds.mjs';
import {glassworksWorld} from './pip-glassworks-worlds.mjs';
import {editAdventure} from './workshop-model.mjs';
import {captureAssembly,importAssembly,serializeAssembly} from './workshop-assemblies.mjs';
const specs=[
 ['return-sign','two-ways-home',{x:4,y:2,width:3,height:3},'A sign with two roads','Route A goes north to a return glass; Route B goes east to a bell. Put Pip two tiles west of Z and try East / East / Use. Change both banks to make another return puzzle.'],
 ['parcel-pendulum','amber-pendulum',{x:4,y:4,width:5,height:7},'A parcel pendulum','Route A collects and converts amber; Route B delivers jade. Set both receiver and recipe targets when changing the number of trips. Add Pip outside the piece.'],
 ['fourfold-braid','fourfold-braid',{x:7,y:3,width:5,height:5},'Four returning roads','The middle sign alternates two side signs. Each side alternates two tubes. Side banks move one tile, Wait, Use; main banks move two tiles, Use. Add Pip two tiles north of the middle sign.'],
 ['amber-recipe','different-spark',{x:4,y:2,width:5,height:1},'Amber into jade','A reusable source, a press and a receiver. Try East / East / Use from two tiles west of Q. After placement, read the new link numbers; copies receive independent channels.'],
];
export function workshopBlueprints(){return specs.map(([id,level,bounds,name,note])=>{
 const source=id==='amber-recipe'?glassworksWorld(level,{proof:false}):gardenWorld(level,{proof:false});
 const world=editAdventure(source,{markers:source.markers.filter(m=>!['pip-stop','pip-lock'].includes(m.kind))});
 return {id,piece:captureAssembly(world,bounds,name,note)};
});}
export function copyBlueprint(items,id){
 const blueprint=workshopBlueprints().find(b=>b.id===id);if(!blueprint)throw Error('Choose a workshop blueprint.');
 return importAssembly(items,serializeAssembly(blueprint.piece));
}
