// Original canvas scenery shared by the atlas and game. Purely cosmetic:
// collision, fog, objectives, and saved expedition fingerprints stay unchanged.
export const CHAPTERS = Object.freeze([
  { id: 'woodland', name: 'The First Light', place: 'Willowbend woods', summary: 'Learn the paths. Bring the lanterns home.', sky: '#c5ddbd', far: '#85a98a', ridge: '#527c65', dark: '#244c40', glow: '#f6d98d' },
  { id: 'forge', name: 'The Watching Forest', place: 'Briarwatch frontier', summary: 'The hunters are listening. Change your story.', sky: '#d5bba3', far: '#ab8f87', ridge: '#725d70', dark: '#3c394d', glow: '#ffce84' },
  { id: 'marsh', name: 'The Sluice Saga', place: 'Rainmoss waterways', summary: 'Turn the water. Make a way for everyone.', sky: '#bdd7d3', far: '#7fa9a6', ridge: '#507e82', dark: '#294c5a', glow: '#deedb0' },
  { id: 'archive', name: 'The Unwritten Sky', place: 'The violet archives', summary: 'Borrow a lost story. Return a forgotten star.', sky: '#c7bfdf', far: '#978bb8', ridge: '#69668f', dark: '#373a59', glow: '#f3d99a' },
  { id: 'dunes', name: 'The Amber Road', place: 'Cinder dunes', summary: 'Lost heirlooms, quiet caravans, a furnace choir.', sky: '#f0d29a', far: '#d6ac7a', ridge: '#b97b60', dark: '#6d4e51', glow: '#fff0b6' },
  { id: 'aurora', name: 'The Long Dawn', place: 'The northern lights', summary: 'Follow the aurora. Bring the whole sky home.', sky: '#aeced9', far: '#7fa5bb', ridge: '#567a99', dark: '#304b6a', glow: '#c9f3d9' },
]);
export const themeFor = stage => CHAPTERS.find(theme => theme.id === stage.theme) || CHAPTERS[0];
export function keeperColors(id) {
  const index = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 5;
  return [['#547d89', '#a9cfc8'], ['#806283', '#c5abd1'], ['#8b624b', '#e2b78a'], ['#6b7b4e', '#c1d28f'], ['#6b729c', '#b2c6df']][index];
}
export function drawKeeperPortrait(canvas, npc, theme, rescued) {
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d'), [coat, scarf] = keeperColors(npc.id);
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  rect(theme.sky, 0, 0, 64, 64); rect(theme.ridge, 0, 47, 64, 17);
  rect(coat, 12, 37, 40, 27); rect(scarf, 21, 38, 23, 11); rect(scarf, 35, 44, 7, 17);
  rect('#624c43', 17, 10, 31, 30); rect('#ecc69b', 21, 18, 23, 24);
  rect('#3a464a', 25, 27, 3, 4); rect('#3a464a', 37, 27, 3, 4);
  rect(rescued ? '#ac725d' : '#c48a70', 29, 36, 8, rescued ? 3 : 2);
  rect(coat, 12, 12, 40, 8); rect(coat, 21, 6, 24, 10); rect(theme.glow, 22, 14, 22, 3);
}

export function drawAtlasArt(canvas, theme, variant = 0) {
  canvas.width = 360; canvas.height = 128;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.fillStyle = theme.sky; ctx.fillRect(0, 0, w, h);
  const poly = (color, points) => { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
  ctx.fillStyle = theme.glow; ctx.beginPath(); ctx.arc(282 - variant * 22, 29, 16, 0, Math.PI * 2); ctx.fill();
  poly(theme.far, [[0, 75], [45, 22 + variant * 5], [95, 72], [157, 31], [240, 79], [301, 39], [360, 75], [360, h], [0, h]]);
  poly(theme.ridge, [[0, 93], [58, 69], [120, 88], [205, 60 + variant * 5], [300, 89], [360, 70], [360, h], [0, h]]);
  poly(theme.dark, [[0, 109], [92, 99], [170, 111], [269, 91], [360, 100], [360, h], [0, h]]);
  if (['archive', 'forge'].includes(theme.id)) {
    for (let i = 0; i < 5; i++) { const x = 24 + i * 27; ctx.fillStyle = theme.dark; ctx.fillRect(x, 49 + i % 2 * 12, 14, 60); ctx.fillRect(x - 3, 47 + i % 2 * 12, 20, 5); ctx.fillStyle = theme.glow; ctx.fillRect(x + 5, 62 + i % 2 * 12, 4, 12); }
  } else if (theme.id === 'dunes') {
    poly(theme.dark, [[38, 106], [79, 49], [120, 106]]); poly(theme.ridge, [[79, 49], [94, 106], [120, 106]]);
    ctx.fillStyle = theme.dark; ctx.fillRect(149, 73, 5, 34); ctx.fillRect(139, 80, 22, 5); ctx.fillRect(137, 73, 5, 11); ctx.fillRect(158, 70, 5, 14);
  } else {
    for (let i = 0; i < 5; i++) { const x = 22 + i * 29, y = 62 + i % 3 * 9; poly(theme.dark, [[x, y + 40], [x + 12, y], [x + 24, y + 40]]); ctx.fillStyle = theme.dark; ctx.fillRect(x + 10, y + 35, 4, 16); }
  }
  if (['marsh', 'aurora'].includes(theme.id)) {
    ctx.fillStyle = theme.id === 'aurora' ? '#b5efce65' : '#bdded357';
    for (let i = 0; i < 6; i++) ctx.fillRect(190 + (i % 3) * 28, 109 + i * 3, 50 - i * 4, 1);
  }
  if (theme.id === 'aurora') poly('#b4edce77', [[132, 0], [165, 28], [206, 35], [260, 7], [310, 0], [269, 22], [207, 46], [163, 39], [119, 0]]);
  // A tiny traveler, lamp, and winding path keep every card a place to explore.
  poly(theme.ridge, [[172, 128], [184, 108], [210, 101], [201, 111], [195, 128]]);
  ctx.fillStyle = '#e9ba7d'; ctx.fillRect(230, 87, 6, 6); ctx.fillStyle = '#a65f4f'; ctx.fillRect(228, 93, 10, 12);
  ctx.fillStyle = theme.glow; ctx.fillRect(240, 95, 5, 7);
}

export function decorateMap(canvas, stage) {
  if (!stage.theme) return;
  const theme = themeFor(stage), ctx = canvas.getContext('2d');
  const palettes = {
    archive: { aab0a2: '9794b0', '8e998d': '77778f', '75867b': '626b86', a6b0a0: 'a5aac4', bdc3b1: 'd1cde1', '78aebe': '8a9ec2', '8dbdca': 'b0bdd8', '659eaf': '707fa9' },
    dunes: { '375f4c': '687654', '42765b': '7e915e', '588969': 'a9b87e', '78aebe': '75b8bb', '8dbdca': 'b2d9cf', '659eaf': '4d9eaa' },
    aurora: { '80a471': 'a8c6d2', '709563': '8babbf', '91b47f': 'd8e9e5', a4bf81: 'c4dadc', '91ae73': 'a0bbc8', b7cb91: 'e0efec', '375f4c': '3c6078', '42765b': '537e96', '588969': '98bcc9', '78aebe': '6994b9', '8dbdca': 'a0d3df', '659eaf': '5076a1', aab0a2: 'acbdcc', '8e998d': '839aac', c8b58e: '839fb6', b7a27d: '708ba5', dbc9a3: 'afcbd6' },
  };
  if (palettes[theme.id]) {
    const colors = new Map(Object.entries(palettes[theme.id]).map(([from, to]) => [parseInt(from, 16), [parseInt(to.slice(0, 2), 16), parseInt(to.slice(2, 4), 16), parseInt(to.slice(4), 16)]]));
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height), data = pixels.data;
    for (let i = 0; i < data.length; i += 4) { const color = colors.get(data[i] * 65536 + data[i + 1] * 256 + data[i + 2]); if (color) [data[i], data[i + 1], data[i + 2]] = color; }
    ctx.putImageData(pixels, 0, 0);
  }
  // Subtle map-only tint leaves entity and next-turn warning colors consistent.
  ctx.fillStyle = `${theme.ridge}28`; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const protectedCells = new Set([stage.start, stage.exit, ...['lanterns', 'keys', 'coins', 'hearts', 'supplies', 'crates', 'plates', 'gates', 'npcs', 'relays', 'switches', 'cover', 'hazards'].flatMap(key => stage[key] || []), ...(stage.relic ? [stage.relic] : [])].map(p => `${p.x},${p.y}`));
  for (let y = 1; y < stage.map.height - 1; y++) for (let x = 1; x < stage.map.width - 1; x++) {
    const i = y * stage.map.width + x;
    if (protectedCells.has(`${x},${y}`) || stage.map.layers[1].tiles[i] || stage.map.layers[0].tiles[i] === 3 || (x * 19 + y * 31) % 37) continue;
    const px = x * 24, py = y * 24;
    ctx.fillStyle = theme.dark + '45'; ctx.fillRect(px + 3, py + 17, 17, 3);
    ctx.fillStyle = theme.glow + '99';
    // Ground-level marks are traversable decoration, never wall-like props.
    if (theme.id === 'archive') { ctx.fillRect(px + 5, py + 13, 10, 2); ctx.fillRect(px + 9, py + 9, 2, 9); }
    else if (theme.id === 'dunes') { ctx.fillRect(px + 4, py + 10, 13, 1); ctx.fillRect(px + 8, py + 13, 12, 1); }
    else if (theme.id === 'aurora') { ctx.fillRect(px + 5, py + 12, 3, 2); ctx.fillRect(px + 13, py + 16, 6, 2); }
    else { ctx.fillRect(px + 6, py + 13, 3, 3); ctx.fillRect(px + 14, py + 15, 2, 2); }
  }
}
