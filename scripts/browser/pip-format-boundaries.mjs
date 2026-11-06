// Keep negative import probes beyond the latest supported duo format.
import {DUO_KINDS,duoRequiredVersion} from '../../src/pip-duo.mjs';
const latest=duoRequiredVersion(DUO_KINDS.map(kind=>({kind})));
export const UNSUPPORTED_DUO_VERSION=latest+1;
export const UNSUPPORTED_BLUEPRINT_VERSION=latest;
