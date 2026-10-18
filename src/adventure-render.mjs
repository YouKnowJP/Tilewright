import { renderMap, drawTile, TILE_SIZE } from './render.mjs';
import { activePlates, enemyIntent, gateIsOpen } from './adventure.mjs';

const near = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= 30;
const same = (a, b) => a.x === b.x && a.y === b.y;

export function createAdventureRenderer(canvas, stage) {
  const background = document.createElement('canvas'); renderMap(background, stage.map);
  let columns = Math.min(24, stage.map.width), rows = Math.min(16, stage.map.height);
  let state = null, previous = null, movedAt = 0;
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

    for (const plate of stage.plates) {
      const x = plate.x * 24, y = plate.y * 24;
      rect('#635e45', x + 3, y + 14, 18, 7); rect(active.includes(plate.id) ? '#8cc09a' : '#d8a56a', x + 4, y + 12, 16, 6);
      rect('#f1db9a', x + 9, y + 13, 6, 2);
    }
    for (const gate of stage.gates) {
      const x = gate.x * 24, y = gate.y * 24, open = gateIsOpen(run, gate) || same(gate, run.player);
      if (gate.type === 'bridge') {
        if (open) drawTile(ctx, 12, x, y);
        else { rect('#426f75', x + 2, y + 8, 20, 2); rect('#c99c65', x + 1, y + 5, 3, 14); rect('#c99c65', x + 20, y + 5, 3, 14); }
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
    for (let y = Math.floor(cameraY); y < Math.min(stage.map.height, Math.ceil(cameraY + rows)); y++) {
      for (let x = Math.floor(cameraX); x < Math.min(stage.map.width, Math.ceil(cameraX + columns)); x++) {
        if (!run.seen[y * stage.map.width + x]) rect('#142d2c', x * 24, y * 24, 24, 24);
        else if (!near({ x, y }, run.player)) rect('#17393266', x * 24, y * 24, 24, 24);
      }
    }
    const x = player.x * 24, y = player.y * 24;
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
