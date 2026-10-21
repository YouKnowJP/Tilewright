export const PREFERENCES_KEY = 'tilewright.preferences.v1';
export const DEFAULT_PREFERENCES = Object.freeze({ volume: 60, motion: 'system', text: 'standard', controls:'auto', keyboardLayout:'wasd', padSide:'left', controlSize:'comfortable', keyRepeat:'off', gamepad:'off' });
export function normalizePreferences(value) {
  const option=(field,values)=>values.includes(value?.[field])?value[field]:DEFAULT_PREFERENCES[field];
  return {
    volume: Number.isInteger(value?.volume) && value.volume >= 0 && value.volume <= 100 ? value.volume : DEFAULT_PREFERENCES.volume,
    motion: ['system', 'reduced'].includes(value?.motion) ? value.motion : DEFAULT_PREFERENCES.motion,
    text: ['standard', 'large'].includes(value?.text) ? value.text : DEFAULT_PREFERENCES.text,
    controls:option('controls',['auto','pad','swipe','tap','keyboard']),
    keyboardLayout:option('keyboardLayout',['wasd','ijkl','arrows']),
    padSide:option('padSide',['left','right']),controlSize:option('controlSize',['comfortable','large']),
    keyRepeat:option('keyRepeat',['off','on']),gamepad:option('gamepad',['off','on']),
  };
}
export function loadPreferences(storage) {
  try {
    const text = storage.getItem(PREFERENCES_KEY);
    if (!text || text.length > 1000) return { ...DEFAULT_PREFERENCES };
    const value = JSON.parse(text);
    return value.version === 1 ? normalizePreferences(value.preferences) : { ...DEFAULT_PREFERENCES };
  } catch { return { ...DEFAULT_PREFERENCES }; }
}
export function savePreferences(storage, preferences) {
  try { storage.setItem(PREFERENCES_KEY, JSON.stringify({ version: 1, preferences: normalizePreferences(preferences) })); return true; }
  catch { return false; }
}
