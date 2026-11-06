// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeProgram,CLOCKWORK_LABELS} from './clockwork.mjs';
import {normalizeDuoBlueprint} from './pip-duo-blueprints.mjs';
const kinds=['flip','signal','cargo'];
export function blueprintRouteStations(input){const piece=normalizeDuoBlueprint(input);return piece.parts.flatMap((p,index)=>kinds.includes(p.kind)?[{index,kind:p.kind,x:p.x,y:p.y,program:[...p.program],alternate:[...p.alternate]}]:[]);}
export function rewriteBlueprintRoute(input,index,patch={}){const piece=normalizeDuoBlueprint(input);if(!Number.isInteger(index)||!kinds.includes(piece.parts[index]?.kind))throw Error('Choose a route memory, signal or cargo compass in this piece.');if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!['program','alternate'].includes(k)))throw Error('Rewrite only the chosen station’s two card banks.');const update=Object.fromEntries(Object.entries(patch).map(([key,cards])=>[key,normalizeProgram(cards)]));return normalizeDuoBlueprint({...piece,parts:piece.parts.map((part,i)=>i===index?{...part,...update}:part)});}

export function describeBlueprintRoute(part){if(!kinds.includes(part?.kind))throw Error('Choose a banked route station.');const labels=part.kind==='signal'?['Quiet','Powered']:part.kind==='cargo'?['Otherwise','Matching cargo']:['Route A','Route B'];return labels.map((label,i)=>label+': '+normalizeProgram(i?part.alternate:part.program).map(c=>CLOCKWORK_LABELS[c]).join(' / ')).join('. ');}
