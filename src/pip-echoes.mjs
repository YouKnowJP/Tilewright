// New owned material. See LICENSE; prior MIT permissions remain effective.
import {normalizeProgram,transformProgram,transformPrismOperation,PRISM_OPERATIONS} from './clockwork.mjs';
export const ECHO_OPERATIONS=Object.freeze({copy:'Copy the cards',...PRISM_OPERATIONS});
export function normalizeEcho(raw={}){const operation=raw.operation===undefined?'copy':raw.operation;if(!Object.hasOwn(ECHO_OPERATIONS,operation))throw Error('Choose how an echo arranges the other courier’s cards.');return {operation};}
export function echoProgram(program,operation='copy'){normalizeEcho({operation});const cards=normalizeProgram(program);return operation==='copy'?[...cards]:transformProgram(cards,operation);}
export function transformEchoOperation(operation,geometry){normalizeEcho({operation});if(!['rotate','mirror-x','mirror-y'].includes(geometry))throw Error('Choose an echo map transformation.');return operation==='copy'?'copy':transformPrismOperation(operation,geometry);}
export function echoDescription(part){return `Use copies the other courier’s three cards as they were at turn start. ${ECHO_OPERATIONS[normalizeEcho(part).operation]}. Restart at card 1; keep the parcel. Both friends read the same snapshot.`;}
