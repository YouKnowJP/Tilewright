import { TILES, MAX_LAYERS, MAX_FILE_BYTES, History, createDocument, validateDocument,
  parseDocument, serializeDocument, paintCells, floodCells, lineCells, rectangleCells, inBounds } from './model.mjs';
import { createSample } from './sample.mjs';
import { loadDocument, saveDocument } from './storage.mjs';
import { TILE_SIZE, drawTile, renderMap } from './render.mjs';
import { cellAtPoint, fitZoom } from './viewport.mjs';
import { createIcon } from './icons.mjs';
import { renameLayer, duplicateLayer, moveLayer, removeLayer, resizeDocument, croppedTileCount } from './operations.mjs';
import { createAdventureUI } from './adventure-ui.mjs';

const $ = selector => document.querySelector(selector);
const canvas = $('#map');
const viewport = $('#viewport');
const zoomControl = $('#zoom');
const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
const restored = loadDocument(storage);
let history = new History(restored.document || createSample());
let activeLayer = history.document.layers[0].id;
let lastLayerPosition = 0;
let selectedTile = 1, tool = 'brush', grid = true, cursor = { x: 0, y: 0 }, stroke = null;
let pan = null, showCursor = false;
let hasEdits = Boolean(restored.document);
let saveLabel = restored.document ? 'Restored locally' : 'Sample map';
const toolNames = { brush: 'Brush', erase: 'Eraser', fill: 'Flood fill', rectangle: 'Rectangle', pick: 'Eyedropper', pan: 'Pan' };
const announce = message => { $('#status').textContent = message; };

function currentProjection() {
  if (!stroke) return history.document;
  const cells = stroke.tool === 'rectangle' ? rectangleCells(stroke.start, cursor) : [...stroke.cells.values()];
  return paintCells(stroke.base, stroke.layer, cells, stroke.tile);
}

function draw() {
  renderMap(canvas, currentProjection(), { editor: true, grid, cursor: showCursor && tool !== 'pan' ? cursor : null,
    preview: stroke?.tool === 'rectangle' ? rectangleCells(stroke.start, cursor) : null });
  $('#coordinates').textContent = `X: ${String(cursor.x).padStart(2, '0')}  Y: ${String(cursor.y).padStart(2, '0')}`;
}

function layoutCanvas(preserveCenter = true) {
  const map = history.document;
  const padding = getComputedStyle($('.canvas-wrap'));
  const paddingX = parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight);
  const paddingY = parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom);
  const scale = zoomControl.value === 'fit'
    ? fitZoom(map.width, map.height, viewport.clientWidth, viewport.clientHeight, paddingX, paddingY)
    : Number(zoomControl.value);
  const oldBounds = canvas.getBoundingClientRect(), view = viewport.getBoundingClientRect();
  const centerX = view.left + viewport.clientWidth / 2, centerY = view.top + viewport.clientHeight / 2;
  const fractionX = (centerX - oldBounds.left) / oldBounds.width;
  const fractionY = (centerY - oldBounds.top) / oldBounds.height;
  const width = map.width * TILE_SIZE * scale, height = map.height * TILE_SIZE * scale;
  if (Math.abs(oldBounds.width - width) < .02 && Math.abs(oldBounds.height - height) < .02) return;
  canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  if (zoomControl.value === 'fit' || !preserveCenter) { viewport.scrollTo(0, 0); return; }
  const bounds = canvas.getBoundingClientRect();
  viewport.scrollLeft += bounds.left + fractionX * bounds.width - centerX;
  viewport.scrollTop += bounds.top + fractionY * bounds.height - centerY;
}

function revealCursor() {
  const bounds = canvas.getBoundingClientRect(), view = viewport.getBoundingClientRect();
  const width = bounds.width / history.document.width, height = bounds.height / history.document.height;
  const left = bounds.left + cursor.x * width, top = bounds.top + cursor.y * height;
  const right = left + width, bottom = top + height;
  if (left < view.left + 8) viewport.scrollLeft -= view.left + 8 - left;
  else if (right > view.left + viewport.clientWidth - 8) viewport.scrollLeft += right - view.left - viewport.clientWidth + 8;
  if (top < view.top + 8) viewport.scrollTop -= view.top + 8 - top;
  else if (bottom > view.top + viewport.clientHeight - 8) viewport.scrollTop += bottom - view.top - viewport.clientHeight + 8;
}

function refresh() {
  const map = history.document;
  if (!map.layers.some(layer => layer.id === activeLayer)) activeLayer = map.layers[Math.min(lastLayerPosition, map.layers.length - 1)].id;
  lastLayerPosition = map.layers.findIndex(layer => layer.id === activeLayer);
  const selectedLayer = map.layers[lastLayerPosition];
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
  $('#layer-name').value = selectedLayer.name;
  $('#layer-info').textContent = `${selectedLayer.tiles.filter(tile => tile !== 0).length} occupied cells · ${selectedLayer.visible ? 'Visible' : 'Hidden'}`;
  $('#duplicate-layer').disabled = map.layers.length >= MAX_LAYERS;
  $('#raise-layer').disabled = lastLayerPosition === map.layers.length - 1;
  $('#lower-layer').disabled = lastLayerPosition === 0;
  $('#delete-layer').disabled = map.layers.length <= 1;
  $('#save-state').textContent = saveLabel;
  $('#save-state').classList.toggle('error', saveLabel === 'Export to keep changes');
  $('#layers').replaceChildren(...[...map.layers].reverse().map(layer => {
    const row = document.createElement('div');
    row.className = `layer-row ${layer.id === activeLayer ? 'selected' : ''} ${layer.visible ? '' : 'layer-hidden'}`;
    const select = document.createElement('button');
    select.className = 'layer-select';
    select.setAttribute('aria-pressed', String(layer.id === activeLayer));
    select.setAttribute('aria-label', `Select ${layer.name} layer`);
    const icon = createIcon('layers');
    select.append(icon, Object.assign(document.createElement('span'), { textContent: layer.name }));
    select.dataset.layer = layer.id;
    select.addEventListener('click', () => {
      cancelStroke(); activeLayer = layer.id; refresh();
      $(`.layer-select[data-layer="${layer.id}"]`).focus({ preventScroll: true });
      announce(`${layer.name} selected. Tools affect this layer.`);
    });
    const visibility = document.createElement('button');
    visibility.className = 'visibility'; visibility.dataset.layer = layer.id;
    visibility.append(createIcon(layer.visible ? 'eye' : 'eye-off'));
    visibility.setAttribute('aria-label', `${layer.visible ? 'Hide' : 'Show'} ${layer.name} layer`);
    visibility.addEventListener('click', () => {
      cancelStroke();
      commit({ ...history.document, layers: history.document.layers.map(item => item.id === layer.id ? { ...item, visible: !item.visible } : item) },
        `${layer.name} ${layer.visible ? 'hidden' : 'shown'}.`);
      $(`.visibility[data-layer="${layer.id}"]`)?.focus({ preventScroll: true });
    });
    row.append(select, visibility); return row;
  }));
  layoutCanvas();
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

function endPan() {
  const pointerId = pan?.pointerId;
  pan = null; canvas.classList.remove('is-panning');
  if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
}

function cancelStroke() { stroke = null; endPan(); draw(); }

function selectTool(next) {
  cancelStroke(); tool = next;
  document.querySelectorAll('[data-tool]').forEach(button => {
    button.classList.toggle('active', button.dataset.tool === tool);
    button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
  });
  $('#tool-name').textContent = toolNames[tool]; refresh();
  canvas.dataset.tool = tool;
  const instructions = tool === 'pan' ? 'Drag the map to scroll, or use arrow keys. Fit map shows the whole canvas.'
    : tool === 'rectangle' ? 'Drag between two corners, or use Space and arrow keys.' : 'Paint on the selected layer.';
  announce(`${toolNames[tool]} selected. ${instructions}`);
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
  return cellAtPoint(history.document.width, history.document.height, canvas.getBoundingClientRect(), event.clientX, event.clientY);
}

function begin(cell, pointerId = null) {
  if (tool === 'pan') { announce('Drag the map to scroll, or use arrow keys.'); return; }
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
  if (event.button !== 0 || pan || (stroke && stroke.pointerId !== null)) return;
  event.preventDefault(); cancelStroke(); cursor = eventCell(event); showCursor = true;
  canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
  if (tool === 'pan') {
    pan = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    canvas.classList.add('is-panning'); return;
  }
  begin(cursor, event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (pan) {
    if (pan.pointerId === event.pointerId) {
      viewport.scrollLeft = pan.left + pan.x - event.clientX;
      viewport.scrollTop = pan.top + pan.y - event.clientY;
    }
    return;
  }
  if (stroke?.pointerId !== undefined && stroke.pointerId !== null && stroke.pointerId !== event.pointerId) return;
  cursor = eventCell(event); showCursor = true;
  if (stroke && stroke.pointerId === event.pointerId) {
    for (const cell of lineCells(stroke.last, cursor)) stroke.cells.set(`${cell.x},${cell.y}`, cell);
    stroke.last = cursor;
  }
  draw();
});
canvas.addEventListener('pointerup', event => {
  if (pan?.pointerId === event.pointerId) { endPan(); return; }
  if (stroke?.pointerId === event.pointerId) { cursor = eventCell(event); finishStroke(); }
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener('pointercancel', () => { cancelStroke(); announce('Stroke canceled.'); });
canvas.addEventListener('lostpointercapture', event => {
  if (pan?.pointerId === event.pointerId) { endPan(); return; }
  if (!stroke || stroke.pointerId !== event.pointerId) return;
  // Some browsers release capture just before dispatching pointerup.
  // Preserve the completed stroke; explicit pointercancel still discards it.
  if (event.buttons === 0) finishStroke();
  else cancelStroke();
});
canvas.addEventListener('pointerleave', () => { if (!stroke) { showCursor = false; draw(); } });
canvas.addEventListener('focus', () => { showCursor = true; draw(); });
canvas.addEventListener('blur', () => { showCursor = false; if (stroke?.pointerId === null) cancelStroke(); else draw(); });
canvas.addEventListener('keydown', event => {
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[event.key]) {
    event.preventDefault();
    const [dx, dy] = moves[event.key];
    if (tool === 'pan') { viewport.scrollBy(dx * TILE_SIZE * 2, dy * TILE_SIZE * 2); return; }
    if (inBounds(history.document, cursor.x + dx, cursor.y + dy)) cursor = { x: cursor.x + dx, y: cursor.y + dy };
    showCursor = true; revealCursor();
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
zoomControl.addEventListener('change', () => { cancelStroke(); layoutCanvas(); announce(zoomControl.value === 'fit' ? 'Whole map fitted to the workspace.' : `Zoom ${Math.round(Number(zoomControl.value) * 100)} percent. Use Pan to move around the map.`); });
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

$('#layer-name').addEventListener('change', event => {
  cancelStroke();
  try {
    commit(renameLayer(history.document, activeLayer, event.target.value), 'Layer renamed.');
    event.target.value = history.document.layers.find(layer => layer.id === activeLayer).name;
  } catch (error) { event.target.value = history.document.layers.find(layer => layer.id === activeLayer).name; announce(error.message); }
});
$('#layer-name').addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); event.target.blur(); }
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopPropagation();
    event.target.value = history.document.layers.find(layer => layer.id === activeLayer).name; event.target.blur();
  }
});
$('#duplicate-layer').addEventListener('click', () => {
  cancelStroke();
  try {
    const next = duplicateLayer(history.document, activeLayer);
    activeLayer = next.layers[lastLayerPosition + 1].id;
    commit(next, 'Layer duplicated in front of its original.');
  } catch (error) { announce(error.message); }
});
for (const [selector, direction, label] of [['#raise-layer', 1, 'forward'], ['#lower-layer', -1, 'backward']]) {
  $(selector).addEventListener('click', () => {
    cancelStroke(); commit(moveLayer(history.document, activeLayer, direction), `Layer moved ${label}.`);
  });
}
$('#delete-layer').addEventListener('click', () => {
  const layer = history.document.layers.find(item => item.id === activeLayer);
  const count = layer.tiles.filter(tile => tile !== 0).length;
  if (!window.confirm(`Delete “${layer.name}” and its ${count} occupied cells? Undo can restore the layer.`)) return;
  cancelStroke();
  try { commit(removeLayer(history.document, activeLayer), 'Layer deleted. Undo restores it.'); }
  catch (error) { announce(error.message); }
});

function resizeDraft() {
  const width = Number($('#resize-width').value), height = Number($('#resize-height').value);
  const anchor = $('#resize-anchor').value, fillTile = Number($('#resize-fill').value);
  return { width, height, anchor, fillTile,
    map: resizeDocument(history.document, width, height, { anchor, fillTile }),
    cropped: croppedTileCount(history.document, width, height, anchor) };
}

function updateResizePreview() {
  try {
    const draft = resizeDraft();
    $('#resize-error').hidden = true; $('#resize-preview-wrap').hidden = false;
    $('#apply-resize').disabled = draft.map === history.document;
    renderMap($('#resize-preview'), draft.map, { editor: true });
    $('#resize-preview').setAttribute('aria-label', `${draft.width} by ${draft.height} map after resizing, ${draft.anchor.replaceAll('-', ' ')} anchor. ${draft.cropped} occupied cells cropped.`);
    const added = draft.width * draft.height - Math.min(draft.width, history.document.width) * Math.min(draft.height, history.document.height);
    const retained = draft.cropped ? `${draft.cropped} occupied cells will be cropped, including hidden layers. Undo restores them.` : 'All occupied tiles are retained.';
    $('#resize-summary').textContent = draft.map === history.document ? 'Choose different dimensions to resize.'
      : `${retained}${added ? ` ${added} new cells per layer. Back layer: ${TILES[draft.fillTile].name}; other layers: empty.` : ''}`;
    $('#resize-summary').classList.toggle('has-crop', draft.cropped > 0);
  } catch (error) {
    $('#resize-preview-wrap').hidden = true; $('#apply-resize').disabled = true;
    $('#resize-summary').textContent = ''; $('#resize-error').textContent = error.message; $('#resize-error').hidden = false;
  }
}
$('#resize-map').addEventListener('click', () => {
  cancelStroke();
  $('#resize-width').value = history.document.width; $('#resize-height').value = history.document.height;
  $('#resize-anchor').value = 'top-left'; $('#resize-fill').value = '1';
  updateResizePreview(); $('#resize-dialog').showModal();
});
for (const selector of ['#resize-width', '#resize-height', '#resize-anchor', '#resize-fill']) {
  $(selector).addEventListener('input', updateResizePreview);
  $(selector).addEventListener('change', updateResizePreview);
}
$('#cancel-resize').addEventListener('click', () => $('#resize-dialog').close());
$('#resize-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const draft = resizeDraft();
    cancelStroke(); zoomControl.value = 'fit';
    commit(draft.map, `Map resized to ${draft.width} × ${draft.height}. Undo restores the previous dimensions and tiles.`);
    viewport.scrollTo(0, 0); $('#resize-dialog').close();
  } catch { updateResizePreview(); }
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
  zoomControl.value = 'fit';
  const saved = persist(); refresh(); viewport.scrollTo(0, 0);
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
  if (!$('#adventure').hidden) return;
  if (event.key === 'Escape') { cancelStroke(); return; }
  if (event.target.closest('input, select, textarea, dialog') || event.altKey) return;
  const key = event.key.toLowerCase();
  if (event.ctrlKey || event.metaKey) {
    if (key === 'z') { event.preventDefault(); moveHistory(event.shiftKey ? 'redo' : 'undo'); }
    if (key === 'y') { event.preventDefault(); moveHistory('redo'); }
    if (key === 's') { event.preventDefault(); exportJSON(); }
    return;
  }
  const shortcuts = { b: 'brush', e: 'erase', f: 'fill', r: 'rectangle', i: 'pick', h: 'pan' };
  if (shortcuts[key]) { event.preventDefault(); selectTool(shortcuts[key]); }
  if (key === 'g') { event.preventDefault(); toggleGrid(); }
});

document.querySelectorAll('[data-icon]').forEach(element => element.append(createIcon(element.dataset.icon)));
initializePalette(); refresh();
new ResizeObserver(() => layoutCanvas()).observe(viewport);
announce(restored.error || (restored.document ? 'Your last map was restored from this browser.' : 'Welcome to Willowbend. Pick a tile and make it yours.'));

const adventures = createAdventureUI({ storage, getMap: () => history.document, backToEditor: () => setMode(false) });
function setMode(play, updateURL = true) {
  cancelStroke(); $('#editor').hidden = play; $('#adventure').hidden = !play;
  document.body.classList.toggle('playing', play);
  document.title = play ? 'Tilewright — Lantern Trails' : 'Tilewright — Make a little world';
  $('#mode-create').setAttribute('aria-pressed', String(!play)); $('#mode-play').setAttribute('aria-pressed', String(play));
  const heading = $('#intro-title'), accent = document.createElement('span'); accent.textContent = '.';
  heading.replaceChildren(document.createTextNode(play ? 'Follow a little adventure' : 'Make a little world'), accent);
  $('.intro .eyebrow').textContent = play ? 'GATHER LIGHT. OUTSMART THE WARDENS.' : 'YOUR WORLD, ONE TILE AT A TIME';
  $('.intro-description').textContent = play ? 'Story missions, branching expeditions, and a new trail every day. The world moves when you do.'
    : 'A quiet corner for your next adventure. Paint, experiment, and take it with you.';
  if (play) adventures.enter(); else { adventures.leave(); layoutCanvas(); }
  if (updateURL) window.history.replaceState(null, '', `${location.pathname}${location.search}${play ? '#play' : ''}`);
}
$('#mode-create').addEventListener('click', () => setMode(false));
$('#mode-play').addEventListener('click', () => setMode(true));
function readGameHash() {
  const shared = location.hash.startsWith('#adventure=');
  setMode(location.hash === '#play' || shared, false);
  if (shared) adventures.openShared(location.hash.slice(11));
}
window.addEventListener('hashchange', readGameHash);
if (location.hash === '#play' || location.hash.startsWith('#adventure=')) readGameHash();
