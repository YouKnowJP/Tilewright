import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventureSound } from '../src/adventure-sound.mjs';

test('sound is opt-in, can be toggled, releases every oscillator, and recreates a closed context', async () => {
  const contexts = [], nodes = [];
  class Audio {
    state = 'suspended'; currentTime = 0; destination = {};
    constructor() { contexts.push(this); }
    async resume() { this.state = 'running'; }
    createOscillator() { const node = { frequency: {}, connect() {}, start() {}, stop() { this.onended(); }, disconnect() { this.disconnected = true; } }; nodes.push(node); return node; }
    createGain() { const node = { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() { this.disconnected = true; } }; nodes.push(node); return node; }
  }
  globalThis.window = { AudioContext: Audio };
  try {
    const sound = createAdventureSound(); sound.play([{ type: 'win' }]); assert.equal(contexts.length, 0);
    assert.equal(await sound.toggle(), true);
    for (const type of ['win', 'relay-complete', 'alarm', 'shield', 'rescue', 'hurt', 'lantern', 'key', 'coin', 'unlock', 'move']) sound.play([{ type }]);
    assert.ok(nodes.length > 30); assert.ok(nodes.every(node => node.disconnected));
    assert.equal(await sound.toggle(), false); const count = nodes.length; sound.play([{ type: 'win' }]); assert.equal(nodes.length, count);
    contexts[0].state = 'closed'; assert.equal(await sound.toggle(), true); assert.equal(contexts.length, 2);
    contexts[1].createOscillator = () => { throw Error('device unavailable'); }; sound.play([{ type: 'win' }]); assert.equal(sound.enabled, false);
  } finally { delete globalThis.window; }
});

test('unavailable or denied audio stays disabled without breaking gameplay', async () => {
  globalThis.window = {};
  try {
    assert.equal(await createAdventureSound().toggle(), false);
    window.AudioContext = class { async resume() { throw Error('blocked'); } };
    const sound = createAdventureSound(); assert.equal(await sound.toggle(), false); sound.play([{ type: 'win' }]); assert.equal(sound.enabled, false);
  } finally { delete globalThis.window; }
});
