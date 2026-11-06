// New owned material. See LICENSE; prior MIT permissions remain effective.
const colours=['amber','jade','violet','blue'];
export const WEAVE_RULES=Object.freeze({both:'Both sources',either:'Either source',one:'Exactly one source',neither:'Neither source'});
export function normalizeWeave(raw){
 const {first,second,channel,rule}=raw||{};
 if(![first,second,channel].every(c=>colours.includes(c))||new Set([first,second,channel]).size!==3)throw Error('A Weave relay needs two different source numbers and a third output number.');
 if(!Object.hasOwn(WEAVE_RULES,rule))throw Error('Choose Both, Either, Exactly one or Neither for the relay.');
 return {first,second,channel,rule};
}
export function weaveMatches(part,power){
 const p=normalizeWeave(part),a=power.has(p.first),b=power.has(p.second);
 return p.rule==='both'?a&&b:p.rule==='either'?a||b:p.rule==='one'?a!==b:!a&&!b;
}
// Relays listen only to physical sources and completed window groups.
// All read the same snapshot. Outputs never feed other relays in this turn.
export function weaveOutputs(parts,power){return new Set(parts.filter(p=>p.kind==='weave'&&weaveMatches(p,power)).map(p=>p.channel));}
export function weaveTruthTable(part){normalizeWeave(part);return [[false,false],[false,true],[true,false],[true,true]].map(([first,second])=>({first,second,output:weaveMatches(part,new Set([...(first?[part.first]:[]),...(second?[part.second]:[])]))}));}
const number=c=>`${colours.indexOf(c)+1} · ${c}`;
export function weaveDescription(part,active){const p=normalizeWeave(part);return `${WEAVE_RULES[p.rule]}: ${number(p.first)} and ${number(p.second)} → power ${number(p.channel)}. Reads sources at turn start, before either courier acts. Windows, held plates/bridges, lanterns, bells, tides and scales count; other relay or drum outputs do not. No Use needed.${typeof active==='boolean'?' Next turn: '+(active?'Powered.':'Quiet.'):''}`;}
