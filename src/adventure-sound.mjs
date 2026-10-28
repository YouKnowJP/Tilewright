export function createAdventureSound() {
  let context = null, enabled = false, volumeLevel = 1;
  async function toggle() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      if (!context || context.state === 'closed') context = new Audio();
      await context.resume(); enabled = !enabled; return enabled;
    } catch { enabled = false; return false; }
  }
  function play(events) {
    if (!enabled || !context || context.state !== 'running' || volumeLevel === 0) return;
    const type = events.find(event => ['win', 'relay-complete', 'alarm', 'shield', 'rescue'].includes(event.type))?.type || events.find(event => event.type === 'hurt')?.type
      || events.find(event => event.type === 'lantern')?.type || events[0]?.type;
    const notes = type === 'echo' ? [329.63, 659.25] : type === 'echo-return' ? [659.25, 493.88, 329.63] : type === 'echo-fade' ? [329.63, 246.94] : type === 'waystone' ? [329.63, 493.88, 659.25] : type === 'pulse' ? [261.63, 392] : type === 'veil' ? [440, 349.23] : type === 'relay-complete' || type === 'rescue' ? [392, 523.25, 783.99] : type === 'alarm' ? [220, 164.81, 220] : type === 'shield' ? [392, 659.25] : type === 'win' ? [523.25, 659.25, 783.99, 1046.5] : type === 'lantern' ? [659.25, 783.99, 1046.5]
      : type === 'hurt' ? [146.83, 110] : type === 'key' || type === 'coin' ? [880] : type === 'unlock' ? [392, 523.25] : [];
    try { notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator(), volume = context.createGain();
      const start = context.currentTime + index * .1;
      oscillator.type = type === 'hurt' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0, start); volume.gain.linearRampToValueAtTime(.065 * volumeLevel, start + .012);
      volume.gain.exponentialRampToValueAtTime(.001, start + .2);
      oscillator.connect(volume); volume.connect(context.destination); oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); }; oscillator.start(start); oscillator.stop(start + .22);
    }); } catch { enabled = false; }
  }
  return { toggle, play, setVolume(value) { if (Number.isFinite(value)) volumeLevel = Math.max(0, Math.min(1, value)); }, get enabled() { return enabled; } };
}
