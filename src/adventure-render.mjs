import { renderMap, drawTile, TILE_SIZE } from './render.mjs';
import { activePlates, enemyIntent, gateIsOpen, hazardActive } from './adventure.mjs';
import { decorateMap, themeFor, keeperColors } from './adventure-art.mjs';

const same = (a, b) => a.x === b.x && a.y === b.y;

export function createAdventureRenderer(canvas, stage) {
  const background = document.createElement('canvas'); renderMap(background, stage.map); decorateMap(background, stage);
  let columns = Math.min(24, stage.map.width), rows = Math.min(16, stage.map.height);
  let state = null, previous = null, movedAt = 0;
  const near = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (state?.effects.sightSquared ?? 30);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function resize(width, height) {
    columns = Math.min(stage.map.width, Math.max(8, Math.min(24, Math.floor(width / 28))));
    rows = Math.min(stage.map.height, Math.max(7, Math.min(16, Math.floor(height / 28))));
    canvas.width = columns * TILE_SIZE; canvas.height = rows * TILE_SIZE;
    const scale = Math.min(width / canvas.width, height / canvas.height);
    canvas.style.width = `${Math.max(1, canvas.width * scale)}px`;
    canvas.style.height = `${Math.max(1, canvas.height * scale)}px`;
  }

  function setState(next) {
    previous = state?.player || next.player;
    if (!state || !same(state.player, next.player)) movedAt = performance.now();
    state = next;
  }

  function draw(time = performance.now()) {
    if (!state) return;
    const ctx = canvas.getContext('2d'), run = state;
    const progress = reducedMotion.matches ? 1 : Math.min(1, (time - movedAt) / 90);
    const player = { x: previous.x + (run.player.x - previous.x) * progress, y: previous.y + (run.player.y - previous.y) * progress };
    const cameraX = Math.max(0, Math.min(stage.map.width - columns, player.x - (columns - 1) / 2));
    const cameraY = Math.max(0, Math.min(stage.map.height - rows, player.y - (rows - 1) / 2));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#173932'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-Math.round(cameraX * TILE_SIZE), -Math.round(cameraY * TILE_SIZE));
    ctx.drawImage(background, 0, 0);
    const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const circle = (color, x, y, radius) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); };
    const visible = point => run.seen[point.y * stage.map.width + point.x];
    const active = activePlates(run);

    for (const cover of stage.cover) {
      const x = cover.x * 24, y = cover.y * 24;
      for (let i = 0; i < 3; i++) {
        const stemX = x + 5 + i * 7, top = y + 6 + (i % 2) * 3;
        rect('#648957', stemX, top, 2, 16);
        for (let leaf = 0; leaf < 3; leaf++) {
          const leafY = top + 3 + leaf * 4;
          rect('#9fbe7a', stemX - 3, leafY - 2, 3, 2); rect('#b0ce86', stemX + 2, leafY - 2, 3, 2);
          rect('#82a86b', stemX - 2, leafY, 6, 2);
        }
      }
    }
    for (const hazard of stage.hazards) {
      const x = hazard.x * 24, y = hazard.y * 24, active = hazardActive(run, hazard), warning = hazardActive(run, hazard, run.turns + 1);
      rect(active ? '#905646' : '#6b7160', x + 2, y + 16, 20, 7);
      for (let i = 0; i < 3; i++) {
        rect(active ? '#e99a50' : '#a2936e', x + 4 + i * 6, y + (active ? 9 : 17), 3, active ? 11 : 3);
        if (active) rect('#ffe5a1', x + 5 + i * 6, y + 12, 2, 6);
      }
      if (warning) { ctx.strokeStyle = '#edb35d'; ctx.lineWidth = 2; ctx.setLineDash([2, 2]); ctx.strokeRect(x + 1, y + 1, 22, 22); ctx.setLineDash([]); }
    }
    for (const relay of stage.relays) {
      const x = relay.x * 24, y = relay.y * 24, powered = stage.sequence.slice(0, run.relayProgress).includes(relay.id);
      const colors = { copper: '#dda76a', glass: '#89c8b6', iron: '#aab4b2', moon: '#c6acd9', root: '#a4c27d', sun: '#f5d27a' };
      rect('#5a685c', x + 5, y + 19, 14, 4); rect('#89967a', x + 8, y + 13, 8, 8);
      if (powered) circle('#a0e1ba55', x + 12, y + 10, 12);
      rect(powered ? '#a6e0b8' : colors[relay.id] || '#d9bc83', x + 5, y + 7, 14, 10);
      rect('#eee3b5', x + 9, y + 4, 6, 3); rect('#5b7861', x + 11, y + 14, 2, 5);
    }
    for (const supply of stage.supplies) {
      if (run.usedSupplies.includes(supply.id)) continue;
      const x = supply.x * 24, y = supply.y * 24;
      rect('#4a6c63', x + 3, y + 8, 18, 14); rect('#8fb4a1', x + 4, y + 7, 16, 12);
      rect('#e4d6a0', x + 10, y + 6, 4, 14); rect('#e4d6a0', x + 7, y + 12, 10, 3);
    }
    for (const npc of stage.npcs) {
      const position = run.companions.find(companion => companion.id === npc.id) || npc;
      const x = position.x * 24, y = position.y * 24;
      circle('#354f3b55', x + 12, y + 21, 8);
      const [coat, scarf] = keeperColors(npc.id);
      rect(coat, x + 6, y + 10, 13, 12); rect(scarf, x + 8, y + 11, 9, 8);
      rect('#755943', x + 6, y + 4, 13, 8); rect('#edc795', x + 8, y + 7, 9, 6);
      rect(run.rescued.includes(npc.id) ? '#a8e0b8' : '#fff0bc', x + 8, y - 3, 11, 6);
      rect('#497567', x + 10, y - 1, 2, 2); rect('#497567', x + 14, y - 1, 2, 2);
    }
    if (run.lure && run.lure.until > run.turns) {
      const x = run.lure.x * 24, y = run.lure.y * 24;
      circle('#90d8ce55', x + 12, y + 11, 14); circle('#b5ede1', x + 12, y + 11, 6);
      rect('#f4edc9', x + 10, y + 7, 4, 8);
    }
    for (const plate of stage.plates) {
      const x = plate.x * 24, y = plate.y * 24;
      rect('#635e45', x + 3, y + 14, 18, 7); rect(active.includes(plate.id) ? '#8cc09a' : '#d8a56a', x + 4, y + 12, 16, 6);
      rect('#f1db9a', x + 9, y + 13, 6, 2);
    }
    for (const item of stage.switches) {
      if (!visible(item)) continue;
      const x = item.x * 24, y = item.y * 24, on = run.switches[item.id];
      rect('#514d43', x + 4, y + 15, 16, 7); rect('#b9aa77', x + 6, y + 13, 12, 6);
      circle('#4d7776', x + 12, y + 9, 8); circle(on ? '#b4e3c1' : '#f0cf8d', x + 12, y + 9, 5);
      rect('#35504b', x + (on ? 11 : 7), y + (on ? 4 : 8), on ? 2 : 10, on ? 10 : 2);
      rect('#ede7bb', x + 10, y + 18, 4, 2);
    }
    for (const gate of stage.gates) {
      const x = gate.x * 24, y = gate.y * 24, open = gateIsOpen(run, gate) || same(gate, run.player);
      if (gate.type === 'bridge' || (gate.type === 'switch' && gate.appearance === 'sluice')) {
        if (open) drawTile(ctx, 12, x, y);
        else { rect('#426f75', x + 2, y + 8, 20, 2); rect('#c99c65', x + 1, y + 5, 3, 14); rect('#c99c65', x + 20, y + 5, 3, 14); }
      } else if ((gate.type === 'signal' || gate.type === 'switch') && !open) {
        rect('#6e657d', x + 2, y + 2, 3, 22); rect('#6e657d', x + 19, y + 2, 3, 22);
        rect('#bcadd7', x + 4, y + 6, 16, 3); rect('#bcadd7', x + 4, y + 16, 16, 3);
        circle('#e8d3ed', x + 12, y + 12, 4);
      } else if (!open) {
        rect('#6e563d', x + 1, y + 3, 3, 20); rect('#6e563d', x + 20, y + 3, 3, 20);
        rect('#c99a52', x + 3, y + 6, 18, 4); rect('#dfbb70', x + 3, y + 14, 18, 4);
        rect('#765e45', x + 10, y + 9, 5, 7); rect('#f4d791', x + 11, y + 10, 3, 3);
      }
    }
    const beacon = stage.exit, bx = beacon.x * 24, by = beacon.y * 24;
    circle('#1e6f6359', bx + 12, by + 12, 13);
    circle('#88dfb3', bx + 12, by + 14, 8); circle('#3c8d78', bx + 12, by + 14, 5);
    rect('#d1e9bb', bx + 8, by + 5, 8, 10); rect('#fff0b1', bx + 10, by + 1, 4, 7);

    for (const item of stage.lanterns) {
      if (run.collectedLanterns.includes(item.id) || !visible(item)) continue;
      const x = item.x * 24, y = item.y * 24, bob = reducedMotion.matches ? 0 : Math.round(Math.sin(time / 350 + item.x) * 1.5);
      circle('#ffdc7738', x + 12, y + 11 + bob, 12);
      rect('#8a673f', x + 8, y + 4 + bob, 8, 3); rect('#8a673f', x + 7, y + 7 + bob, 10, 12);
      rect('#f2bc59', x + 8, y + 8 + bob, 8, 8); rect('#fff0b3', x + 10, y + 9 + bob, 4, 5);
      rect('#e8cd8a', x + 9, y + 19 + bob, 6, 2);
    }
    if (run.cargoPoint && !run.cargoDelivered) {
      const x = run.cargoPoint.x * 24, y = run.cargoPoint.y * 24;
      circle('#b8d9e05a', x + 12, y + 12, 12); rect('#7c8d9c', x + 6, y + 6, 12, 14); rect('#e8ddb4', x + 9, y + 4, 6, 15); rect('#a9dfdf', x + 10, y + 8, 4, 5);
    }
    for (const key of stage.keys) {
      if (run.collectedKeys.includes(key.id) || !visible(key)) continue;
      const x = key.x * 24, y = key.y * 24;
      circle('#b58136', x + 8, y + 9, 5); circle('#f9dd7e', x + 8, y + 9, 3);
      rect('#f9dd7e', x + 11, y + 8, 10, 3); rect('#d9a64f', x + 16, y + 10, 2, 5); rect('#d9a64f', x + 20, y + 10, 2, 4);
    }
    for (const coin of stage.coins) {
      if (run.collectedCoins.includes(coin.id) || !visible(coin)) continue;
      const x = coin.x * 24 + 12, y = coin.y * 24 + 12;
      circle('#a97638', x, y + 1, 5); circle('#f0cc6f', x, y - 1, 5); rect('#fff0bb', x - 1, y - 4, 2, 6);
    }
    for (const heart of stage.hearts) {
      if (run.collectedHearts.includes(heart.id) || !visible(heart)) continue;
      const x = heart.x * 24, y = heart.y * 24;
      rect('#b66762', x + 5, y + 8, 14, 7); rect('#f4b18e', x + 6, y + 6, 5, 6); rect('#f4b18e', x + 13, y + 6, 5, 6);
      rect('#e6957c', x + 8, y + 14, 8, 3); rect('#e6957c', x + 10, y + 17, 4, 3);
    }
    for (const crate of run.crates) {
      const x = crate.x * 24, y = crate.y * 24;
      rect('#71533a', x + 2, y + 4, 20, 19); rect('#c29960', x + 3, y + 3, 18, 17);
      rect('#dfbd80', x + 4, y + 4, 16, 2); rect('#977046', x + 5, y + 9, 14, 2); rect('#977046', x + 5, y + 15, 14, 2);
      for (let i = 0; i < 12; i++) rect('#e5c38b', x + 6 + i, y + 6 + i, 2, 2);
    }
    for (const enemy of run.enemies) {
      const point = enemy.route[enemy.index];
      if (!near(point, run.player)) continue;
      const intent = enemyIntent(run, enemy).point;
      ctx.strokeStyle = '#d26d58'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
      ctx.strokeRect(intent.x * 24 + 3, intent.y * 24 + 3, 18, 18); ctx.setLineDash([]);
      const x = point.x * 24, y = point.y * 24;
      circle('#4d443844', x + 12, y + 20, 9);
      rect('#9f4d4d', x + 3, y + 9, 18, 11); rect('#cc7867', x + 5, y + 5, 14, 11);
      rect('#ecaa86', x + 6, y + 6, 6, 3); rect('#fff0c2', x + 7, y + 11, 3, 4); rect('#fff0c2', x + 15, y + 11, 3, 4);
      rect('#4d5145', x + 8, y + 13, 2, 2); rect('#4d5145', x + 16, y + 13, 2, 2);
    }
    for (const hunter of run.hunters) {
      for (const cell of hunter.attack || []) {
        if (!near(cell, run.player)) continue;
        const ax = cell.x * 24, ay = cell.y * 24;
        rect('#b66b8855', ax + 1, ay + 1, 22, 22); ctx.strokeStyle = '#f0b2aa'; ctx.lineWidth = 2;
        ctx.strokeRect(ax + 2, ay + 2, 20, 20); ctx.beginPath(); ctx.moveTo(ax + 6, ay + 6); ctx.lineTo(ax + 18, ay + 18);
        ctx.moveTo(ax + 18, ay + 6); ctx.lineTo(ax + 6, ay + 18); ctx.stroke();
      }
      if (!near(hunter, run.player)) continue;
      const x = hunter.x * 24, y = hunter.y * 24;
      ctx.strokeStyle = hunter.mode === 'distracted' ? '#84d3c5' : '#e18d82'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]);
      ctx.strokeRect(hunter.intent.x * 24 + 2, hunter.intent.y * 24 + 2, 20, 20); ctx.setLineDash([]);
      circle('#37364955', x + 12, y + 21, 10);
      rect(hunter.boss ? '#654b77' : '#526580', x + 3, y + 9, 18, 12);
      rect(hunter.boss ? '#a384b0' : '#8ba3ad', x + 5, y + 5, 14, 12);
      rect('#f8d3a4', x + 7, y + 11, 3, 3); rect('#f8d3a4', x + 15, y + 11, 3, 3);
      rect('#403d50', x + 8, y + 12, 2, 2); rect('#403d50', x + 16, y + 12, 2, 2);
      if (hunter.boss) {
        rect('#deb975', x + 5, y + 1, 14, 5);
        for (let i = 0; i < hunter.phase; i++) rect('#fff0bc', x + 6 + i * 5, y - 2, 3, 5);
      }
    }
    for (let y = Math.floor(cameraY); y < Math.min(stage.map.height, Math.ceil(cameraY + rows)); y++) {
      for (let x = Math.floor(cameraX); x < Math.min(stage.map.width, Math.ceil(cameraX + columns)); x++) {
        if (!run.seen[y * stage.map.width + x]) rect(stage.theme ? themeFor(stage).dark : '#142d2c', x * 24, y * 24, 24, 24);
        else if (!near({ x, y }, run.player)) rect(`${stage.theme ? themeFor(stage).dark : '#173932'}66`, x * 24, y * 24, 24, 24);
      }
    }
    const x = player.x * 24, y = player.y * 24;
    if (run.ward > 0) { circle('#a4e8da44', x + 12, y + 12, 17); ctx.strokeStyle = '#b2edda'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, 26, 26); }
    circle('#354f3b55', x + 12, y + 21, 8);
    const blink = run.invulnerability > 0 && !reducedMotion.matches && Math.floor(time / 130) % 2;
    ctx.globalAlpha = blink ? .55 : 1;
    rect('#4c5b50', x + 7, y + 18, 4, 5); rect('#4c5b50', x + 14, y + 18, 4, 5);
    rect('#b36d4d', x + 6, y + 11, 13, 10); rect('#dfa16e', x + 7, y + 11, 10, 7);
    rect('#a36246', x + 5, y + 4, 15, 10); rect('#e5aa75', x + 7, y + 3, 11, 5);
    rect('#f5d7a0', x + 8, y + 8, 9, 6);
    if (run.facing !== 'up') {
      rect('#3a4d42', x + (run.facing === 'left' ? 8 : 10), y + 10, 2, 2);
      rect('#3a4d42', x + (run.facing === 'right' ? 16 : 14), y + 10, 2, 2);
    }
    if (run.carrying) { rect('#b9dfe0', x + 1, y + 10, 5, 10); rect('#f3e5b7', x + 2, y + 12, 3, 4); }
    rect('#f7d47b', x + 17, y + 15, 4, 5); ctx.globalAlpha = 1;
    if (run.events.some(event => ['lantern', 'win'].includes(event.type)) && time - movedAt < 550 && !reducedMotion.matches) {
      const spread = (time - movedAt) / 35;
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        rect('#fff0b3', x + 12 + Math.cos(angle) * spread, y + 10 + Math.sin(angle) * spread, 2, 2);
      }
    }
    ctx.restore();
  }

  function drawMinimap(target) {
    if (!state) return;
    const ctx = target.getContext('2d'), run = state;
    const scale = Math.min(target.width / stage.map.width, target.height / stage.map.height);
    const ox = (target.width - stage.map.width * scale) / 2, oy = (target.height - stage.map.height * scale) / 2;
    ctx.fillStyle = '#183c35'; ctx.fillRect(0, 0, target.width, target.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(background, ox, oy, stage.map.width * scale, stage.map.height * scale);
    ctx.fillStyle = '#183c35';
    run.seen.forEach((seen, index) => { if (!seen) ctx.fillRect(ox + index % stage.map.width * scale, oy + Math.floor(index / stage.map.width) * scale, Math.ceil(scale), Math.ceil(scale)); });
    for (const item of stage.lanterns) {
      if (run.collectedLanterns.includes(item.id) || !run.seen[item.y * stage.map.width + item.x]) continue;
      ctx.fillStyle = '#ffdc77'; ctx.fillRect(ox + item.x * scale, oy + item.y * scale, Math.max(2, scale), Math.max(2, scale));
    }
    for (const item of [...stage.switches, ...stage.relays]) {
      if (!run.seen[item.y * stage.map.width + item.x]) continue;
      ctx.strokeStyle = '#fff1ce'; ctx.lineWidth = 1;
      ctx.strokeRect(ox + item.x * scale, oy + item.y * scale, Math.max(3, scale), Math.max(3, scale));
    }
    for (const [point, color] of [[stage.exit, '#8de1ba'], [run.player, '#fff2c0']]) {
      ctx.fillStyle = color; ctx.fillRect(ox + point.x * scale, oy + point.y * scale, Math.max(3, scale), Math.max(3, scale));
    }
    ctx.strokeStyle = '#fff0b380'; ctx.lineWidth = 1;
    const left = Math.max(0, Math.min(stage.map.width - columns, run.player.x - (columns - 1) / 2));
    const top = Math.max(0, Math.min(stage.map.height - rows, run.player.y - (rows - 1) / 2));
    ctx.strokeRect(ox + left * scale, oy + top * scale, columns * scale, rows * scale);
  }

  return { resize, setState, draw, drawMinimap };
}
