// Original canvas scenery shared by the atlas and game. Purely cosmetic:
// collision, fog, objectives, and saved expedition fingerprints stay unchanged.
export const CHAPTERS = Object.freeze([
  { id: 'woodland', name: 'The First Light', place: 'Willowbend woods', summary: 'Learn the paths. Bring the lanterns home.', sky: '#c5ddbd', far: '#85a98a', ridge: '#527c65', dark: '#244c40', glow: '#f6d98d' },
  { id: 'forge', name: 'The Watching Forest', place: 'Briarwatch frontier', summary: 'The hunters are listening. Change your story.', sky: '#d5bba3', far: '#ab8f87', ridge: '#725d70', dark: '#3c394d', glow: '#ffce84' },
  { id: 'marsh', name: 'The Sluice Saga', place: 'Rainmoss waterways', summary: 'Turn the water. Make a way for everyone.', sky: '#bdd7d3', far: '#7fa9a6', ridge: '#507e82', dark: '#294c5a', glow: '#deedb0' },
  { id: 'archive', name: 'The Unwritten Sky', place: 'The violet archives', summary: 'Borrow a lost story. Return a forgotten star.', sky: '#c7bfdf', far: '#978bb8', ridge: '#69668f', dark: '#373a59', glow: '#f3d99a' },
  { id: 'dunes', name: 'The Amber Road', place: 'Cinder dunes', summary: 'Lost heirlooms, quiet caravans, a furnace choir.', sky: '#f0d29a', far: '#d6ac7a', ridge: '#b97b60', dark: '#6d4e51', glow: '#fff0b6' },
  { id: 'aurora', name: 'The Long Dawn', place: 'The northern lights', summary: 'Follow the aurora. Bring the whole sky home.', sky: '#aeced9', far: '#7fa5bb', ridge: '#567a99', dark: '#304b6a', glow: '#c9f3d9' },
  { id: 'coast', name: 'The Tideglass Coast', place: 'The sea-glass shores', summary: 'Follow the turning tide. Leave a light for every boat.', sky: '#b5dce0', far: '#75b1ba', ridge: '#4a8598', dark: '#254e67', glow: '#ffe7aa' },
  { id: 'clockwork', name: 'The Clockwork Orchard', place: 'The brassleaf gardens', summary: 'Wind the forgotten garden. Bring its morning home.', sky: '#dbd3ab', far: '#a7ac7c', ridge: '#788460', dark: '#465b49', glow: '#f6c983' },
]);
export const themeFor = stage => CHAPTERS.find(theme => theme.id === stage.theme) || CHAPTERS[0];
export function drawTitleArt(canvas) {
  canvas.width = 960; canvas.height = 600;
  const ctx = canvas.getContext('2d');
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  rect('#112d36', 0, 0, 960, 600);
  for (let i = 0; i < 90; i++) rect(i % 3 ? '#7faaa1' : '#e9dca9', (i * 157 + 41) % 960, (i * 73 + 13) % 280, i % 3 ? 2 : 3, 2);
  for (let y = 0; y < 10; y++) {
    const inset = [16, 8, 4, 0, 0, 0, 0, 4, 8, 16][y];
    rect('#f1dfa0', 732 + inset, 67 + y * 5, 50 - inset * 2, 5);
  }
  const pine = (x, y, size, color) => {
    rect('#1b3434', x - size * .07, y, size * .14, size * .5);
    for (let row = 0; row < 5; row++) rect(color, x - size * (.12 + row * .085), y - size + row * size * .19, size * (.24 + row * .17), size * .24);
  };
  for (let layer = 0; layer < 3; layer++) {
    const ground = 300 + layer * 80, color = ['#24434a', '#224b46', '#193e37'][layer];
    rect(color, 0, ground, 960, 600 - ground);
    for (let i = 0; i < 15; i++) pine(i * 77 + (layer % 2) * 30, ground + (i * 17 % 30), 100 + layer * 25 + i % 4 * 18, color);
  }
  for (let y = 350; y < 600; y += 12) {
    const width = 10 + (y - 350) * .38, x = 674 + Math.sin(y / 88) * 48;
    rect('#877d51', x - width / 2, y, width, 12);
    if (y % 24) rect('#ae9b64', x - width / 2 + 4, y + 2, Math.max(2, width - 12), 3);
  }
  for (const [x, y] of [[664, 354], [725, 442], [652, 532]]) {
    rect('#d1b265', x - 2, y, 4, 29); rect('#ceb376', x - 9, y - 15, 18, 19);
    rect('#fff0b1', x - 5, y - 11, 10, 11); rect('#ffe7a333', x - 17, y - 22, 34, 35);
  }
  // A keeper and their lantern, looking toward the distant path.
  rect('#172f2c', 764, 518, 39, 8); rect('#965f47', 769, 488, 25, 29);
  rect('#d69764', 771, 478, 20, 15); rect('#efc38a', 774, 487, 15, 12);
  rect('#c48b60', 766, 477, 31, 6); rect('#eac779', 799, 501, 9, 12);
  rect('#ffefb4', 801, 503, 5, 7); rect('#5b6247', 772, 517, 7, 10); rect('#5b6247', 784, 517, 7, 10);
  pine(910, 572, 250, '#102c2b'); pine(49, 580, 235, '#102c2b');
}
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
  if (theme.id === 'coast') {
    ctx.fillStyle = theme.dark; ctx.fillRect(43, 42, 20, 65); ctx.fillRect(37, 36, 32, 9);
    poly(theme.dark, [[36, 36], [53, 19], [70, 36]]);
    ctx.fillStyle = '#eee4c7'; ctx.fillRect(47, 48, 12, 15); ctx.fillRect(47, 77, 12, 10);
    ctx.fillStyle = theme.glow; ctx.fillRect(46, 38, 14, 6);
    poly('#ffe7aa60', [[60, 40], [165, 20], [165, 62], [60, 44]]);
    ctx.fillStyle = theme.sky; for (let i = 0; i < 5; i++) ctx.fillRect(81 + i * 39, 114 + i % 2 * 5, 27, 2);
  } else if (theme.id === 'clockwork') {
    ctx.fillStyle = theme.dark; ctx.fillRect(47, 50, 7, 57); ctx.fillRect(30, 64, 42, 6);
    ctx.beginPath(); ctx.arc(51, 51, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.glow; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(51, 51, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(51, 39); ctx.lineTo(51, 51); ctx.lineTo(61, 56); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = theme.dark; ctx.fillRect(95 + i * 25, 80 + i % 2 * 8, 5, 31); ctx.fillStyle = theme.glow; ctx.fillRect(90 + i * 25, 77 + i % 2 * 8, 15, 6); }
  } else if (['archive', 'forge'].includes(theme.id)) {
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
    coast: { '80a471': '91b8ac', '709563': '729b93', '91b47f': 'bfd7c5', aab0a2: 'b7c6c5', '8e998d': '8aabb1', '75867b': '658c9a', c8b58e: 'd6c89d', b7a27d: 'c3ad85', dbc9a3: 'eee0b6', '78aebe': '63a8ba', '8dbdca': '9ad1da', '659eaf': '43859d' },
    clockwork: { '80a471': '9da378', '709563': '7f8b61', '91b47f': 'c2c398', a4bf81: 'b8ba86', '91ae73': '929c68', b7cb91: 'd7cfa0', aab0a2: 'b9a889', '8e998d': '97876b', '75867b': '7a785f', '375f4c': '56674b', '42765b': '718057', '588969': '9eaa6f' },
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
    if (theme.id === 'coast') { ctx.fillRect(px + 6, py + 11, 11, 2); ctx.fillRect(px + 8, py + 14, 7, 2); }
    else if (theme.id === 'clockwork') { ctx.fillRect(px + 7, py + 10, 8, 2); ctx.fillRect(px + 7, py + 16, 8, 2); ctx.fillRect(px + 5, py + 12, 2, 4); ctx.fillRect(px + 15, py + 12, 2, 4); }
    else if (theme.id === 'archive') { ctx.fillRect(px + 5, py + 13, 10, 2); ctx.fillRect(px + 9, py + 9, 2, 9); }
    else if (theme.id === 'dunes') { ctx.fillRect(px + 4, py + 10, 13, 1); ctx.fillRect(px + 8, py + 13, 12, 1); }
    else if (theme.id === 'aurora') { ctx.fillRect(px + 5, py + 12, 3, 2); ctx.fillRect(px + 13, py + 16, 6, 2); }
    else { ctx.fillRect(px + 6, py + 13, 3, 3); ctx.fillRect(px + 14, py + 15, 2, 2); }
  }
}
