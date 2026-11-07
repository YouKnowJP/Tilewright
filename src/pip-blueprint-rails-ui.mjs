// New owned material. See LICENSE; prior MIT permissions remain effective.
import {createRailEditor} from './pip-rail-editor.mjs';
import {blueprintRailStations, tuneBlueprintRail, swapBlueprintRailExits, previewBlueprintRide} from './pip-blueprint-rails.mjs';

export function createBlueprintRails({dialog, getMode, stop, onChange}) {
  const panel = document.createElement('details');
  panel.id = 'ps-bp-rails';
  panel.innerHTML = `<summary>Route switch rails</summary>
    <p>Set both exits before turning or copying the piece. Use the power tools to change channels.</p>
    <label>Rail<select id="ps-bp-rail-station"></select></label>
    <div id="ps-bp-rail-anchor"></div>
    <div class="ps-actions">
      <button id="ps-bp-rail-copy">Copy exits to all</button>
      <button id="ps-bp-rail-swap">Swap all exits</button>
      <button id="ps-bp-rail-restore">Restore this rail</button>
      <button id="ps-bp-rail-reset">Restore all rails</button>
    </div>
    <details id="ps-bp-rail-preview"><summary>Try a ride</summary>
      <p>This sample follows the original piece with fixed power. Rehearse in the garden to check couriers, machines and crossings.</p>
      <label>Sample power<select id="ps-bp-rail-sample">
        <option value="">All quiet</option><option value="amber">1 Amber</option><option value="jade">2 Jade</option>
        <option value="violet">3 Violet</option><option value="blue">4 Blue</option>
      </select></label>
      <p id="ps-bp-rail-result" role="status"></p>
    </details>`;
  dialog.querySelector('#ps-bp-counters').after(panel);
  const control = name => panel.querySelector('#ps-bp-rail-' + name);
  const exits = rail => ({quietExit: rail.quietExit, poweredExit: rail.poweredExit});
  let source, configured, signature = '', stations = [], selected = 0, edits = new Map();
  const editor = createRailEditor({
    prefix: 'ps-bp-rail-', anchor: control('anchor'), showChannel: false,
    onChange: () => change(() => adopt(tuneBlueprintRail(configured, selected, editor.value()))),
  });

  function sample() {
    if (!stations.length) return;
    const {path, stop, target} = previewBlueprintRide(configured, selected, control('sample').value);
    const coordinate = point => `${point.x + 1},${point.y + 1}`;
    const trail = path.slice(0, 7).map(coordinate).join(' → ') + (path.length > 7 ? ` → … → ${coordinate(path.at(-1))}` : '');
    const end = {road: 'The next card resumes here.', loop: 'The sample loops back to a rail.', water: 'The exit meets water.', edge: 'The exit leaves this piece.'};
    control('result').textContent = `${trail}${target ? ' → ' + coordinate(target) : ''}. ${end[stop]}`;
  }

  function render() {
    if (!stations.length) return;
    editor.element.hidden = false;
    editor.set(configured.parts[selected]);
    const building = getMode() === 'build';
    control('copy').disabled = !building || stations.length < 2;
    control('swap').disabled = !building || !configured.parts.some(part => part.kind === 'rail' && part.quietExit !== part.poweredExit);
    control('restore').disabled = !building || !edits.has(selected);
    control('reset').disabled = !building || !edits.size;
    sample();
  }

  function apply(piece) {
    source = piece;
    stations = piece.parts.some(part => part.kind === 'rail') ? blueprintRailStations(piece) : [];
    panel.hidden = !stations.length;
    const key = JSON.stringify(stations.map(({channel, ...station}) => station));
    if (key !== signature) {
      signature = key;
      edits = new Map();
      selected = stations[0]?.index ?? 0;
      control('station').replaceChildren(...stations.map(rail => new Option(`Rail · ${rail.x + 1}, ${rail.y + 1}`, String(rail.index))));
      control('station').value = String(selected);
    }
    configured = piece;
    for (const [index, settings] of edits) configured = tuneBlueprintRail(configured, index, settings);
    render();
    return configured;
  }

  function change(action) {
    if (getMode() !== 'build' || !stations.length) return;
    stop();
    action();
    onChange();
  }
  function adopt(piece) {
    edits = new Map();
    for (const {index} of stations) {
      const original = source.parts[index], next = piece.parts[index];
      if (next.quietExit !== original.quietExit || next.poweredExit !== original.poweredExit) edits.set(index, exits(next));
    }
  }
  function reset() {
    signature = '';
    edits = new Map();
    control('sample').value = '';
  }
  control('station').onchange = () => {
    if (getMode() !== 'build') return;
    stop();
    selected = Number(control('station').value);
    render();
  };
  control('sample').onchange = sample;
  control('copy').onclick = () => change(() => adopt(tuneBlueprintRail(configured, selected, exits(configured.parts[selected]), {all: true})));
  control('swap').onclick = () => change(() => adopt(swapBlueprintRailExits(configured)));
  control('restore').onclick = () => change(() => edits.delete(selected));
  control('reset').onclick = () => change(() => edits.clear());
  return {apply, reset};
}
