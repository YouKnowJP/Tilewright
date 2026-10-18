import { TILES, MAX_LAYERS, MAX_FILE_BYTES, History, createDocument, validateDocument,
  parseDocument, serializeDocument, paintCells, floodCells, lineCells, rectangleCells, inBounds } from './model.mjs';
import { createSample } from './sample.mjs';
import { loadDocument, saveDocument } from './storage.mjs';
import { TILE_SIZE, drawTile, renderMap } from './render.mjs';

const $ = selector => document.querySelector(selector);
const canvas = $('#map');
const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
const restored = loadDocument(storage);
let history = new History(restored.document || createSample());
let activeLayer = history.document.layers[0].id;
let selectedTile = 1, tool = 'brush', grid = true, cursor = { x: 0, y: 0 }, stroke = null;
let hasEdits = Boolean(restored.document);
let saveLabel = restored.document ? 'Restored locally' : 'Sample map';
const toolNames = { brush: 'Brush', erase: 'Eraser', fill: 'Flood fill', rectangle: 'Rectangle', pick: 'Eyedropper' };
const announce = message => { $('#status').textContent = message; };

function currentProjection() {
  if (!stroke || stroke.tool === 'rectangle') return history.document;
  return paintCells(stroke.base, stroke.layer, [...stroke.cells.values()], stroke.tile);
}

function draw() {
  renderMap(canvas, currentProjection(), { grid, cursor,
    preview: stroke?.tool === 'rectangle' ? rectangleCells(stroke.start, cursor) : null });
  $('#coordinates').textContent = `X: ${String(cursor.x).padStart(2, '0')}  Y: ${String(cursor.y).padStart(2, '0')}`;
}

function refresh() {
  const map = history.document;
  if (!map.layers.some(layer => layer.id === activeLayer)) activeLayer = map.layers[0].id;
  cursor = { x: Math.min(cursor.x, map.width - 1), y: Math.min(cursor.y, map.height - 1) };
  $('#document-title').textContent = map.name;
  $('#document-meta').textContent = `${map.width} × ${map.height} tiles`;
  $('#map-name').value = map.name;
  $('#map-width').replaceChildren(document.createTextNode(`${map.width} `), Object.assign(document.createElement('small'), { textContent: 'tiles' }));
  $('#map-height').replaceChildren(document.createTextNode(`${map.height} `), Object.assign(document.createElement('small'), { textContent: 'tiles' }));
  $('#map-pixels').textContent = `${map.width * TILE_SIZE} × ${map.height * TILE_SIZE} px`;
  canvas.setAttribute('aria-label', `${map.name}, ${map.width} by ${map.height} tile map. Arrow keys move the cursor; Space applies ${toolNames[tool]} on ${map.layers.find(layer => layer.id === activeLayer).name}.`);
  $('#active-layer-label').textContent = map.layers.find(layer => layer.id === activeLayer).name;
  $('#undo').disabled = !history.past.length;
  $('#redo').disabled = !history.future.length;
  $('#add-layer').disabled = map.layers.length >= MAX_LAYERS;
  $('#save-state').textContent = saveLabel;
  $('#save-state').classList.toggle('error', saveLabel === 'Export to keep changes');
  $('#layers').replaceChildren(...[...map.layers].reverse().map(layer => {
    const row = document.createElement('div');
    row.className = `layer-row ${layer.id === activeLayer ? 'selected' : ''} ${layer.visible ? '' : 'layer-hidden'}`;
    const select = document.createElement('button');
    select.className = 'layer-select';
    select.setAttribute('aria-pressed', String(layer.id === activeLayer));
    select.setAttribute('aria-label', `Select ${layer.name} layer`);
    const icon = Object.assign(document.createElement('span'), { className: 'layer-icon', textContent: '▱' });
    icon.setAttribute('aria-hidden', 'true');
    select.append(icon, Object.assign(document.createElement('span'), { textContent: layer.name }));
    select.addEventListener('click', () => { cancelStroke(); activeLayer = layer.id; refresh(); announce(`${layer.name} selected. Tools affect this layer.`); });
    const visibility = document.createElement('button');
    visibility.className = 'visibility'; visibility.dataset.layer = layer.id;
    visibility.textContent = layer.visible ? '◉' : '○';
    visibility.setAttribute('aria-label', `${layer.visible ? 'Hide' : 'Show'} ${layer.name} layer`);
    visibility.addEventListener('click', () => {
      cancelStroke();
      commit({ ...history.document, layers: history.document.layers.map(item => item.id === layer.id ? { ...item, visible: !item.visible } : item) },
        `${layer.name} ${layer.visible ? 'hidden' : 'shown'}.`);
      $(`.visibility[data-layer="${layer.id}"]`)?.focus();
    });
    row.append(select, visibility); return row;
  }));
  canvas.style.width = `${map.width * TILE_SIZE * Number($('#zoom').value)}px`;
  canvas.style.height = `${map.height * TILE_SIZE * Number($('#zoom').value)}px`;
  draw();
}

function persist() {
  const saved = saveDocument(storage, history.document);
  saveLabel = saved ? 'Saved locally' : 'Export to keep changes';
  return saved;
}

function commit(map, message) {
  if (!history.commit(map)) return;
  hasEdits = true;
  const saved = persist(); refresh();
  announce(saved ? message : `${message} Browser saving is unavailable. Export JSON to keep your work.`);
}

function cancelStroke() { stroke = null; draw(); }

function selectTool(next) {
  cancelStroke(); tool = next;
  document.querySelectorAll('[data-tool]').forEach(button => {
    button.classList.toggle('active', button.dataset.tool === tool);
    button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
  });
  $('#tool-name').textContent = toolNames[tool]; refresh();
  announce(`${toolNames[tool]} selected. ${tool === 'rectangle' ? 'Drag between two corners, or use Space and arrow keys.' : 'Paint on the selected layer.'}`);
}

function selectTile(id) {
  selectedTile = id;
  document.querySelectorAll('[data-tile]').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.tile) === id);
    button.setAttribute('aria-pressed', String(Number(button.dataset.tile) === id));
  });
  const preview = $('#selected-preview'), ctx = preview.getContext('2d');
  ctx.clearRect(0, 0, preview.width, preview.height); drawTile(ctx, id, 0, 0, 48);
  $('#selected-name').textContent = TILES[id].name;
  announce(`${TILES[id].name} selected.`);
}

function initializePalette() {
  for (const tile of TILES.filter(item => item.id !== 0)) {
    const button = document.createElement('button');
    button.className = 'tile-button'; button.dataset.tile = tile.id;
    button.setAttribute('aria-label', `${tile.name} tile`);
    button.setAttribute('aria-pressed', 'false');
    const thumbnail = document.createElement('canvas'); thumbnail.width = 48; thumbnail.height = 48;
    thumbnail.setAttribute('aria-hidden', 'true');
    const ctx = thumbnail.getContext('2d');
    if (tile.group === 'objects') drawTile(ctx, 1, 0, 0, 48);
    drawTile(ctx, tile.id, 0, 0, 48);
    button.append(thumbnail, Object.assign(document.createElement('span'), { textContent: tile.name }));
    button.addEventListener('click', () => selectTile(tile.id));
    $(`#${tile.group}-palette`).append(button);
  }
  selectTile(1);
}

function eventCell(event) {
  const box = canvas.getBoundingClientRect();
  return { x: Math.max(0, Math.min(history.document.width - 1, Math.floor((event.clientX - box.left) / box.width * history.document.width))),
    y: Math.max(0, Math.min(history.document.height - 1, Math.floor((event.clientY - box.top) / box.height * history.document.height))) };
}

function begin(cell, pointerId = null) {
  const map = history.document, layer = map.layers.find(item => item.id === activeLayer);
  if (tool === 'pick') {
    selectTile(layer.tiles[cell.y * map.width + cell.x]);
    selectTool('brush');
    announce(`Picked ${TILES[selectedTile].name} from ${layer.name}. Brush selected.`); return;
  }
  if (!layer.visible) { announce('Show this layer before painting on it.'); return; }
  if (tool === 'fill') {
    commit(paintCells(map, activeLayer, floodCells(map, activeLayer, cell.x, cell.y), selectedTile), 'Region filled.'); return;
  }
  stroke = { base: map, layer: activeLayer, tool, tile: tool === 'erase' ? 0 : selectedTile,
    start: cell, last: cell, cells: new Map([[`${cell.x},${cell.y}`, cell]]), pointerId };
  draw();
}

function finishStroke() {
  if (!stroke) return;
  const pending = stroke;
  const cells = pending.tool === 'rectangle' ? rectangleCells(pending.start, cursor) : [...pending.cells.values()];
  const next = paintCells(pending.base, pending.layer, cells, pending.tile);
  stroke = null;
  commit(next, `${toolNames[pending.tool]} applied. ${cells.length} ${cells.length === 1 ? 'cell' : 'cells'} in the stroke.`);
  draw();
}

canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || (stroke && stroke.pointerId !== null)) return;
  event.preventDefault(); cancelStroke(); cursor = eventCell(event); canvas.focus();
  canvas.setPointerCapture(event.pointerId); begin(cursor, event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (stroke?.pointerId !== undefined && stroke.pointerId !== null && stroke.pointerId !== event.pointerId) return;
  cursor = eventCell(event);
  if (stroke && stroke.pointerId === event.pointerId) {
    for (const cell of lineCells(stroke.last, cursor)) stroke.cells.set(`${cell.x},${cell.y}`, cell);
    stroke.last = cursor;
  }
  draw();
});
canvas.addEventListener('pointerup', event => {
  if (stroke?.pointerId === event.pointerId) { cursor = eventCell(event); finishStroke(); }
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener('pointercancel', () => { cancelStroke(); announce('Stroke canceled.'); });
canvas.addEventListener('lostpointercapture', event => {
  if (!stroke || stroke.pointerId !== event.pointerId) return;
  // Some browsers release capture just before dispatching pointerup.
  // Preserve the completed stroke; explicit pointercancel still discards it.
  if (event.buttons === 0) finishStroke();
  else cancelStroke();
});
canvas.addEventListener('blur', () => { if (stroke?.pointerId === null) cancelStroke(); });
canvas.addEventListener('keydown', event => {
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[event.key]) {
    event.preventDefault();
    const [dx, dy] = moves[event.key];
    if (inBounds(history.document, cursor.x + dx, cursor.y + dy)) cursor = { x: cursor.x + dx, y: cursor.y + dy };
    draw(); announce(`Column ${cursor.x + 1}, row ${cursor.y + 1}. ${TILES[history.document.layers.find(layer => layer.id === activeLayer).tiles[cursor.y * history.document.width + cursor.x]].name}.`);
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (event.repeat) return;
    if (stroke) finishStroke();
    else { begin(cursor); if (stroke && tool !== 'rectangle') finishStroke(); }
  }
});

function moveHistory(direction) {
  cancelStroke();
  if (history[direction]()) { const saved = persist(); refresh(); announce(`${direction === 'undo' ? 'Undid' : 'Redid'} the last change.${saved ? '' : ' Local saving failed; export JSON.'}`); }
}
$('#undo').addEventListener('click', () => moveHistory('undo'));
$('#redo').addEventListener('click', () => moveHistory('redo'));
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
$('#zoom').addEventListener('change', refresh);
function toggleGrid() { grid = !grid; $('#grid-toggle').setAttribute('aria-pressed', String(grid)); draw(); announce(`Grid ${grid ? 'shown' : 'hidden'}.`); }
$('#grid-toggle').addEventListener('click', toggleGrid);
$('#map-name').addEventListener('change', event => {
  cancelStroke();
  try { commit(validateDocument({ ...history.document, name: event.target.value }), 'Map renamed.'); }
  catch (error) { event.target.value = history.document.name; announce(error.message); }
});
$('#add-layer').addEventListener('click', () => {
  cancelStroke();
  const map = history.document;
  if (map.layers.length >= MAX_LAYERS) return;
  let suffix = 1;
  while (map.layers.some(layer => layer.id === `layer-${suffix}`)) suffix++;
  const layer = { id: `layer-${suffix}`, name: `Layer ${suffix}`, visible: true, tiles: Array(map.width * map.height).fill(0) };
  activeLayer = layer.id;
  commit({ ...map, layers: [...map.layers, layer] }, 'New layer added in front.');
});

function download(blob, extension) {
  const name = history.document.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tilewright-map';
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `${name}.${extension}`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
function exportJSON() {
  cancelStroke();
  download(new Blob([serializeDocument(history.document)], { type: 'application/json' }), 'json');
  announce('JSON exported with all layers. Keep this file as a portable backup.');
}
$('#export-json').addEventListener('click', exportJSON);
$('#export-png').addEventListener('click', () => {
  cancelStroke();
  const output = document.createElement('canvas'); renderMap(output, history.document);
  output.toBlob(blob => { if (blob) { download(blob, 'png'); announce('PNG exported: visible layers, no grid.'); } else announce('PNG export failed. Try exporting JSON.'); }, 'image/png');
});

function replaceDocument(map) {
  cancelStroke(); history = new History(map); activeLayer = map.layers[0].id; cursor = { x: 0, y: 0 }; hasEdits = true;
  const saved = persist(); refresh(); $('#viewport').scrollTo(0, 0);
  announce(saved ? `${map.name} opened and saved locally.` : `${map.name} opened. Local saving failed; export JSON to keep your work.`);
}
function canReplace() { return !hasEdits || window.confirm('Replace the current map? Export JSON first if you want to keep both maps.'); }
$('#new-map').addEventListener('click', () => { cancelStroke(); $('#new-dialog').showModal(); });
$('#cancel-new').addEventListener('click', () => $('#new-dialog').close());
$('#new-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const map = createDocument($('#new-name').value, Number($('#new-width').value), Number($('#new-height').value));
    if (canReplace()) { $('#new-dialog').close(); replaceDocument(map); }
  } catch (error) { announce(error.message); }
});
$('#load-sample').addEventListener('click', () => { if (canReplace()) replaceDocument(createSample()); });
$('#import-map').addEventListener('click', () => { cancelStroke(); $('#file-input').click(); });
$('#file-input').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  try {
    if (file.size > MAX_FILE_BYTES) throw new Error('Map files must be smaller than 1 MB.');
    const map = parseDocument(await file.text());
    if (canReplace()) replaceDocument(map);
  } catch (error) { announce(`Import failed: ${error.message} Your current map is unchanged.`); }
});
$('#help-button').addEventListener('click', () => { cancelStroke(); $('#help-dialog').showModal(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { cancelStroke(); return; }
  if (event.target.closest('input, select, textarea, dialog') || event.altKey) return;
  const key = event.key.toLowerCase();
  if (event.ctrlKey || event.metaKey) {
    if (key === 'z') { event.preventDefault(); moveHistory(event.shiftKey ? 'redo' : 'undo'); }
    if (key === 'y') { event.preventDefault(); moveHistory('redo'); }
    if (key === 's') { event.preventDefault(); exportJSON(); }
    return;
  }
  const shortcuts = { b: 'brush', e: 'erase', f: 'fill', r: 'rectangle', i: 'pick' };
  if (shortcuts[key]) { event.preventDefault(); selectTool(shortcuts[key]); }
  if (key === 'g') { event.preventDefault(); toggleGrid(); }
});

initializePalette(); refresh();
announce(restored.error || (restored.document ? 'Your last map was restored from this browser.' : 'Welcome to Willowbend. Pick a tile and make it yours.'));
