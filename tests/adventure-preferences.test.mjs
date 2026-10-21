import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, PREFERENCES_KEY, normalizePreferences, loadPreferences, savePreferences } from '../src/adventure-preferences.mjs';

test('preferences round-trip without changing game/map storage or retaining unknown fields', () => {
  const values = new Map([['tilewright.document.v1', 'my map'], ['tilewright.expedition.v1', 'my journey']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const next = { ...DEFAULT_PREFERENCES, volume:35, motion:'reduced', text:'large', controls:'tap', keyboardLayout:'ijkl', padSide:'right', controlSize:'large', keyRepeat:'on', gamepad:'on' };
  assert.equal(savePreferences(storage, { ...next, ignored: 'discard' }), true); assert.deepEqual(loadPreferences(storage), next);
  assert.equal(values.get('tilewright.document.v1'), 'my map'); assert.equal(values.get('tilewright.expedition.v1'), 'my journey');
  assert.deepEqual(JSON.parse(values.get(PREFERENCES_KEY)), { version: 1, preferences: next });
});
test('missing, malformed, oversized, and unsupported preferences fall back safely', () => {
  for (const text of [undefined, '', '{', 'null', 'x'.repeat(1001), '{"version":2}', '{"version":1,"preferences":null}']) {
    assert.deepEqual(loadPreferences({ getItem: () => text }), DEFAULT_PREFERENCES);
  }
  for (const patch of [{ volume: -1 }, { volume: 101 }, { volume: 1.5 }, { volume: '50' }, { motion: 'spin' }, { text: 'huge' }]) assert.deepEqual(normalizePreferences({ ...DEFAULT_PREFERENCES, ...patch }), DEFAULT_PREFERENCES);
  assert.deepEqual(loadPreferences({ getItem() { throw Error('blocked'); } }), DEFAULT_PREFERENCES);
  assert.equal(savePreferences({ setItem() { throw Error('quota'); } }, DEFAULT_PREFERENCES), false);
});

test('older saves gain safe control defaults and invalid control values cannot hide the UI',()=>{
  const old={volume:25,motion:'reduced',text:'large'},storage={getItem:()=>JSON.stringify({version:1,preferences:old})};
  assert.deepEqual(loadPreferences(storage),{...DEFAULT_PREFERENCES,...old});
  for(const key of ['controls','keyboardLayout','padSide','controlSize','keyRepeat','gamepad'])assert.deepEqual(normalizePreferences({...DEFAULT_PREFERENCES,[key]:'unknown'}),DEFAULT_PREFERENCES);
});
