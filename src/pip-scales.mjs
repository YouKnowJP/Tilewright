// New owned material. See LICENSE; prior MIT permissions remain effective.
const parcels=['amber','jade','violet','blue'];
export function normalizeScale(raw={}){
 const match=raw.match===undefined?'any':raw.match,courier=raw.courier===undefined?'either':raw.courier;
 if(!['all','empty','any',...parcels].includes(match)||!['either','pip','sprout'].includes(courier))throw Error('Choose a scale’s cargo condition and courier badge.');
 return {match,courier};
}
export function scaleMatches(part,bot){const p=normalizeScale(part);return Boolean(bot&&(p.courier==='either'||bot.id?.toLowerCase()===p.courier)&&(p.match==='all'||p.match==='empty'&&!bot.parcel||p.match==='any'&&Boolean(bot.parcel)||p.match===bot.parcel));}
export function scalePower(parts,bots){return [...new Set(parts.filter(p=>p.kind==='scale'&&bots.some(b=>b.x===p.x&&b.y===p.y&&scaleMatches(p,b))).map(p=>p.channel))];}
export function scaleDescription(part){const p=normalizeScale(part),who=p.courier==='either'?'Either courier':p.courier==='pip'?'Pip':'Sprout',cargo=p.match==='all'?'with any hands':p.match==='empty'?'with empty hands':p.match==='any'?'carrying any parcel':'carrying '+p.match;return `${who} ${cargo} powers ${part.channel} while standing here. Changes take effect next turn; no Use is needed.`;}
