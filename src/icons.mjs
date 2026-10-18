const PATHS = {
  brush: ['m15 3 6 6-10 10-6-6Z', 'm5 13-2 8 8-2', 'm13 5 6 6'],
  erase: ['m15 3 6 6-11 11H6l-4-4Z', 'm7 11 6 6', 'M10 20h12'],
  fill: ['m10 3 9 9-9 9-9-9Z', 'm6 2 6 6', 'M3 14h14', 'M21 15s-3 3-3 5a3 3 0 0 0 6 0c0-2-3-5-3-5Z'],
  rectangle: ['M4 4h16v16H4Z'],
  pick: ['m15 3 6 6', 'm14 4 6 6-11 11H3v-6Z', 'm6 12 6 6'],
  pan: ['M8 12V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v9c0 5-3 7-7 7h-1c-2 0-4-1-5-3L3 13a2 2 0 0 1 3-2l2 2'],
  undo: ['M9 5 4 10l5 5', 'M4 10h10a6 6 0 0 1 0 12'],
  redo: ['m15 5 5 5-5 5', 'M20 10H10a6 6 0 0 0 0 12'],
  grid: ['M3 3h18v18H3Z', 'M9 3v18M15 3v18M3 9h18M3 15h18'],
  layers: ['m12 3 10 6-10 6L2 9Z', 'm2 14 10 6 10-6'],
  eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  'eye-off': ['M3 3 21 21', 'M9 5a12 12 0 0 1 3 0c6 0 10 7 10 7a24 24 0 0 1-4 4', 'M6 6a24 24 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1'],
  duplicate: ['M8 8h13v13H8Z', 'M16 8V3H3v13h5'],
  'arrow-up': ['m5 11 7-7 7 7', 'M12 4v16'],
  'arrow-down': ['m5 13 7 7 7-7', 'M12 4v16'],
  trash: ['M3 6h18', 'M5 6l1 15h12l1-15', 'M9 6V3h6v3', 'M10 10v7M14 10v7'],
};

export function createIcon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' })) {
    icon.setAttribute(key, value);
  }
  icon.classList.add('ui-icon');
  for (const data of PATHS[name] || []) {
    const path = document.createElementNS(namespace, 'path'); path.setAttribute('d', data); icon.append(path);
  }
  return icon;
}
