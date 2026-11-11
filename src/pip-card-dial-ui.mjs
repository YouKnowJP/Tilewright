// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CLOCKWORK_LABELS} from './clockwork.mjs';
import {CARD_DIAL_LABELS,dialNextCard} from './pip-card-dial.mjs';

export function createCardDialEditor({anchor,onChange}) {
  const element = document.createElement('label');
  element.append('Card Dial setting');
  const select = document.createElement('select');
  select.id = 'ps-dial-shift';
  select.replaceChildren(...Object.entries(CARD_DIAL_LABELS).map(([value, label]) => new Option(label, value)));
  select.onchange = onChange;
  element.append(select);
  anchor.after(element);
  element.hidden = true;
  return {element, value: () => ({shift: select.value}), set(part) { select.value = part.shift; }};
}

export function createBlueprintDialPreview({anchor,getProject}) {
  const element = document.createElement('details');
  element.id = 'ps-bp-dials';
  element.hidden = true;
  element.innerHTML = `<summary>Preview Card Dials</summary>
    <p>Choose the card that would normally run after a successful entry. The preview uses the courier’s starting route.</p>
    <div class="ps-fields">
      <label>Card Dial<select id="ps-bp-dial-station"></select></label>
      <label>Courier<select id="ps-bp-dial-courier"><option value="0">Pip</option><option value="1">Sprout</option></select></label>
      <label>Normal next card<select id="ps-bp-dial-next"></select></label>
    </div>
    <p id="ps-bp-dial-result" role="status"></p>`;
  anchor.after(element);
  const station = element.querySelector('#ps-bp-dial-station');
  const courier = element.querySelector('#ps-bp-dial-courier');
  const normalNext = element.querySelector('#ps-bp-dial-next');
  const result = element.querySelector('#ps-bp-dial-result');
  let dials = [], signature = '', shownProgram;

  function render() {
    if (!dials.length) return;
    const dial = dials[Number(station.value)];
    const program = getProject().programs[Number(courier.value)];
    const index = Number(normalNext.value);
    const label = (command, i) => `Card ${i + 1} · ${CLOCKWORK_LABELS[command]}`;
    if (program.join(',') !== shownProgram) {
      shownProgram = program.join(',');
      normalNext.replaceChildren(...program.map((command, i) => new Option(label(command, i), String(i))));
      normalNext.value = String(index);
    }
    const next = dialNextCard(index, dial.shift);
    result.textContent = `${CARD_DIAL_LABELS[dial.shift]}. Next to run is ${label(program[next], next)}.`;
  }

  station.onchange = courier.onchange = normalNext.onchange = render;
  function update(piece) {
    dials = piece?.parts.filter(part => part.kind === 'dial') ?? [];
    element.hidden = !dials.length;
    const key = JSON.stringify(dials);
    if (key !== signature) {
      const selected = station.value;
      signature = key;
      station.replaceChildren(...dials.map((part, i) =>
        new Option(`Column ${part.x + 1}, row ${part.y + 1} · ${CARD_DIAL_LABELS[part.shift]}`, String(i))));
      if (Number(selected) < dials.length && selected !== '') station.value = selected;
    }
    render();
  }
  function reset() {
    element.open = false;
    courier.value = '0';
    normalNext.value = '0';
    update(null);
  }

  normalNext.replaceChildren(...[0, 1, 2].map(i => new Option(`Card ${i + 1}`, String(i))));
  return {update, reset};
}
