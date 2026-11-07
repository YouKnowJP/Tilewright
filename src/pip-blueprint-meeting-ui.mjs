// New owned material. See LICENSE; prior MIT permissions remain effective.
import {DUO_CHANNELS} from './pip-duo.mjs';
import {meetingTurn} from './pip-rendezvous.mjs';

export function createBlueprintMeeting(dialog) {
  const panel = document.createElement('details');
  panel.id = 'ps-bp-meeting';
  panel.hidden = true;
  panel.innerHTML = `<summary>Preview a meeting</summary>
    <p>Choose two sample arrival turns. The preview shows when both couriers can move again. Rehearse the placed garden to find its actual arrivals.</p>
    <label>Post pair<select id="ps-bp-meeting-link"></select></label>
    <p id="ps-bp-meeting-ends"></p>
    <div class="ps-fields">
      <label>Pip arrives<select id="ps-bp-meeting-pip"></select></label>
      <label>Sprout arrives<select id="ps-bp-meeting-sprout"></select></label>
    </div>
    <p id="ps-bp-meeting-result" role="status"></p>`;
  dialog.querySelector('#ps-bp-links').after(panel);
  const control = name => panel.querySelector('#ps-bp-meeting-' + name);
  let links = [], posts = [];
  for (const [id, initial] of [['pip', 4], ['sprout', 7]]) {
    const select = control(id);
    select.replaceChildren(...Array.from({length: 16}, (_, i) => new Option(`Turn ${i + 1}`, String(i + 1))));
    select.value = String(initial);
    select.onchange = render;
  }
  control('link').onchange = render;

  function render() {
    if (!links.length) return;
    const pair = posts.filter(post => post.channel === control('link').value);
    const [pip, sprout] = ['pip', 'sprout'].map(id => Number(control(id).value));
    const resume = meetingTurn(pip, sprout);
    const held = arrival => {
      const ticks = resume - arrival - 1;
      return ticks ? `${ticks} ${ticks === 1 ? 'turn' : 'turns'}` : 'no extra turns';
    };
    control('ends').textContent = 'Posts at ' + pair.map(post => `column ${post.x + 1}, row ${post.y + 1}`).join(' and ') + '.';
    control('result').textContent = `Both resume on turn ${resume}. Pip waits ${held(pip)}. Sprout waits ${held(sprout)}.`;
  }

  return function update(piece) {
    posts = piece?.parts.filter(part => part.kind === 'sync') ?? [];
    const next = DUO_CHANNELS.filter(channel => posts.some(post => post.channel === channel));
    panel.hidden = !next.length;
    if (links.join() !== next.join()) {
      const current = control('link').value;
      links = next;
      control('link').replaceChildren(...links.map(channel => new Option(`Link ${DUO_CHANNELS.indexOf(channel) + 1}`, channel)));
      if (links.includes(current)) control('link').value = current;
    }
    render();
  };
}
