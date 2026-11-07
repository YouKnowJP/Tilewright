// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {turnstilePayment} from './pip-turnstile.mjs';

const colourOptions = () => DUO_CHANNELS.map((value, i) =>
  new Option(`${i + 1} · ${value[0].toUpperCase()}${value.slice(1)}`, value));

export function createTurnstileEditor({prefix, anchor, onChange}) {
  const element = document.createElement('fieldset');
  element.id = prefix + 'fields';
  element.className = 'ps-fields';
  element.innerHTML = `<legend>Parcel Turnstile</legend>
    <label>Parcel fare<select id="${prefix}fare"></select></label>
    <label>Power circuit<select id="${prefix}channel"></select></label>
    <label>Powered turns<select id="${prefix}duration"></select></label>`;
  const control = key => element.querySelector('#' + prefix + key);
  for (const key of ['fare', 'channel']) control(key).replaceChildren(...colourOptions());
  control('duration').replaceChildren(...Array.from({length: 6}, (_, i) => new Option(String(i + 1))));
  const value = () => ({fare: control('fare').value, channel: control('channel').value, duration: Number(control('duration').value)});
  function set(part) {
    for (const key of ['fare', 'channel', 'duration']) control(key).value = part[key];
  }
  for (const select of element.querySelectorAll('select')) select.onchange = onChange;
  set({fare: 'amber', channel: 'blue', duration: 3});
  anchor.after(element);
  element.hidden = true;
  return {element, set, value};
}

export function createBlueprintTurnstiles({dialog, getMode, stop, onChange}) {
  const panel = document.createElement('details');
  panel.id = 'ps-bp-turnstiles';
  panel.hidden = true;
  panel.innerHTML = `<summary>Set turnstile fares</summary>
    <p>Tune each original station before arranging copies. Check the finished piece in Station rules.</p>
    <label>Turnstile<select id="ps-bp-toll-station"></select></label>
    <div id="ps-bp-toll-anchor" hidden></div>
    <button id="ps-bp-toll-reset">Restore this turnstile</button>
    <details id="ps-bp-toll-preview"><summary>Preview a fare</summary>
      <p>Compare one payment with a crossing. Other sources and occupied bridges can also supply power during rehearsal.</p>
      <div class="ps-fields">
        <label>Carried parcel<select id="ps-bp-toll-cargo"></select></label>
        <label>Entry turn<select id="ps-bp-toll-entry"></select></label>
        <label>Crossing turn<select id="ps-bp-toll-crossing"></select></label>
      </div>
      <p id="ps-bp-toll-result" role="status"></p>
    </details>`;
  dialog.querySelector('#ps-bp-meeting').after(panel);
  const control = key => panel.querySelector('#ps-bp-toll-' + key);
  let signature = '', source, configured, stations = [], edits = new Map();
  const selected = () => Number(control('station').value);
  const editor = createTurnstileEditor({prefix: 'ps-bp-toll-', anchor: control('anchor'), onChange: () => {
    if (getMode() !== 'build' || !stations.length) return;
    stop();
    const fields = editor.value(), original = source.parts[selected()];
    if (Object.entries(fields).every(([key, value]) => original[key] === value)) edits.delete(selected());
    else edits.set(selected(), fields);
    onChange();
  }});
  control('cargo').replaceChildren(new Option('Empty hands', ''), ...colourOptions());
  control('cargo').value = 'amber';
  for (const [key, initial] of [['entry', 4], ['crossing', 7]]) {
    control(key).replaceChildren(...Array.from({length: 24}, (_, i) => new Option(`Turn ${i + 1}`, String(i + 1))));
    control(key).value = String(initial);
  }
  for (const key of ['cargo', 'entry', 'crossing']) control(key).onchange = sample;
  control('station').onchange = render;
  control('reset').onclick = () => {
    if (getMode() !== 'build') return;
    stop();
    edits.delete(selected());
    onChange();
  };

  function sample() {
    if (!stations.length) return;
    const part = configured.parts[selected()];
    const crossing = Number(control('crossing').value);
    const payment = turnstilePayment(part, control('cargo').value, Number(control('entry').value));
    if (!payment) {
      control('result').textContent = `Entry blocked. Required fare: ${part.fare}. Cargo stays in hand.`;
      return;
    }
    const window = payment.first === payment.last ? `turn ${payment.first}` : `turns ${payment.first}–${payment.last}`;
    const supplied = crossing >= payment.first && crossing <= payment.last;
    control('result').textContent = `Fare spent. ${part.channel} powers on ${window}. Turn ${crossing} ${supplied ? 'can use this receipt' : 'falls outside this receipt'}.`;
  }

  function render() {
    if (!stations.length) return;
    editor.element.hidden = false;
    editor.set(configured.parts[selected()]);
    for (const field of editor.element.querySelectorAll('select')) field.disabled = getMode() !== 'build';
    control('reset').disabled = getMode() !== 'build' || !edits.has(selected());
    sample();
  }

  function apply(piece) {
    source = piece;
    stations = piece.parts.flatMap((part, index) => part.kind === 'turnstile' ? [[index, part]] : []);
    panel.hidden = !stations.length;
    const key = JSON.stringify(stations);
    if (signature !== key) {
      signature = key;
      edits.clear();
      control('station').replaceChildren(...stations.map(([index, part]) =>
        new Option(`Gate · ${part.x + 1}, ${part.y + 1}`, String(index))));
    }
    configured = edits.size ? {...piece, parts: piece.parts.map((part, index) =>
      edits.has(index) ? {...part, ...edits.get(index)} : part)} : piece;
    render();
    return configured;
  }

  function reset() {
    signature = '';
    edits.clear();
    panel.open = false;
    control('preview').open = false;
    control('cargo').value = 'amber';
    control('entry').value = '4';
    control('crossing').value = '7';
  }
  return {apply, reset};
}
