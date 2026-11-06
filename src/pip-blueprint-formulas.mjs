// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
const fields={press:['channel','output'],mixer:['channel','second','output'],kiln:['input','quiet','powered']};
const recipe=part=>Object.fromEntries(fields[part.kind].map(key=>[key,part[key]]));
export function blueprintRecipeStations(input){const piece=normalizeDuoBlueprint(input);return piece.parts.flatMap((p,index)=>fields[p.kind]?[{index,kind:p.kind,x:p.x,y:p.y,...recipe(p)}]:[]);}
export function rewriteBlueprintRecipe(input,index,patch={}, {all=false}={}){
 const piece=normalizeDuoBlueprint(input),selected=piece.parts[index];
 if(!Number.isInteger(index)||!fields[selected?.kind])throw Error('Choose a press, mixing bowl or kiln in this blueprint.');
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!fields[selected.kind].includes(k))||typeof all!=='boolean')throw Error('Rewrite only the chosen machine’s recipe. Its power channel stays separate.');
 const updated=normalizeDuoBlueprint({...piece,parts:piece.parts.map((p,i)=>i===index?{...p,...patch}:p)}),formula=recipe(updated.parts[index]);
 return all?normalizeDuoBlueprint({...updated,parts:updated.parts.map(p=>p.kind===selected.kind?{...p,...formula}:p)}):updated;
}
export function describeBlueprintRecipe(part){if(!fields[part?.kind])throw Error('Choose a recipe machine.');return part.kind==='kiln'?`${part.input}: Quiet → ${part.quiet}; Powered → ${part.powered}`:part.kind==='mixer'?`${part.channel} + ${part.second} → ${part.output}`:`${part.channel} → ${part.output}`;}
