// New owned material. See LICENSE; prior MIT permissions remain effective.
import {PRISM_OPERATIONS} from './clockwork.mjs';
export const VANE_LABELS=Object.freeze({rotate:'Turn right','rotate-left':'Turn left',mirror:'Mirror E/W','mirror-y':'Mirror N/S',reverse:'Reverse'});
export function normalizeVane(raw){const operation=raw?.operation===undefined?'rotate':raw.operation;if(typeof operation!=='string'||!Object.hasOwn(VANE_LABELS,operation))throw Error('Choose a known Wind Vane operation.');return {operation};}
export function vaneDescription(part){const {operation}=normalizeVane(part);return `${PRISM_OPERATIONS[operation]}. Entering transforms the three cards automatically after the movement card; the next card position stays next. Cargo stays held. Starting here, Wait and Use do not trigger it. A prism X instead needs Use and restarts at card 1.`;}
