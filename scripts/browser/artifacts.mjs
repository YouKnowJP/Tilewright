import { fileURLToPath } from 'node:url';

// Generated captures stay with this project, regardless of the caller's folder.
const output = new URL('../../.playwright-mcp/', import.meta.url);
export const artifactPath = name => fileURLToPath(new URL(name, output));
