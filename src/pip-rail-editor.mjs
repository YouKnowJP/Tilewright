// New owned material. See LICENSE; prior MIT permissions remain effective.
import {CLOCKWORK_LABELS} from './clockwork.mjs';
import {RAIL_DIRECTIONS} from './pip-rails.mjs';

export function createRailEditor({prefix, anchor, onChange, showChannel = true}) {
  const element = document.createElement('fieldset');
  element.id = prefix + 'fields';
  element.innerHTML = `<legend>Switch Rail</legend>
    <label ${showChannel ? '' : 'hidden'}>Power channel<select id="${prefix}channel"></select></label>
    <label>Quiet exit<select id="${prefix}quiet"></select></label>
    <label>Powered exit<select id="${prefix}powered"></select></label>`;
  const control = name => element.querySelector('#' + prefix + name);
  const colours = ['Amber', 'Jade', 'Violet', 'Blue'];
  control('channel').replaceChildren(...colours.map((label, index) => new Option(`${index + 1} · ${label}`, label.toLowerCase())));
  for (const field of ['quiet', 'powered']) {
    control(field).replaceChildren(...Object.keys(RAIL_DIRECTIONS).map(direction => new Option(CLOCKWORK_LABELS[direction], direction)));
  }
  function set(part) {
    control('channel').value = part.channel;
    control('quiet').value = part.quietExit;
    control('powered').value = part.poweredExit;
  }
  function value() {
    const exits = {quietExit: control('quiet').value, poweredExit: control('powered').value};
    return showChannel ? {channel: control('channel').value, ...exits} : exits;
  }
  for (const field of element.querySelectorAll('select')) field.onchange = onChange;
  set({channel: 'amber', quietExit: 'right', poweredExit: 'down'});
  anchor.after(element);
  element.hidden = true;
  return {element, set, value};
}
