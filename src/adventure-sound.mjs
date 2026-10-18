export function createAdventureSound() {
  let context = null, enabled = false;
  async function toggle() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      if (!context) context = new Audio();
      await context.resume(); enabled = !enabled; return enabled;
    } catch { enabled = false; return false; }
  }
  function play(events) {
    if (!enabled || !context || context.state !== 'running') return;
    const type = events.find(event => event.type === 'win')?.type || events.find(event => event.type === 'hurt')?.type
      || events.find(event => event.type === 'lantern')?.type || events[0]?.type;
    const notes = type === 'win' ? [523.25, 659.25, 783.99, 1046.5] : type === 'lantern' ? [659.25, 783.99, 1046.5]
      : type === 'hurt' ? [146.83, 110] : type === 'key' || type === 'coin' ? [880] : type === 'unlock' ? [392, 523.25] : [];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator(), volume = context.createGain();
      const start = context.currentTime + index * .1;
      oscillator.type = type === 'hurt' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0, start); volume.gain.linearRampToValueAtTime(.065, start + .012);
      volume.gain.exponentialRampToValueAtTime(.001, start + .2);
      oscillator.connect(volume); volume.connect(context.destination); oscillator.start(start); oscillator.stop(start + .22);
    });
  }
  return { toggle, play };
}
