import { walkableCells } from './adventure.mjs';
import { CHANNEL_NUMBERS, drawCueBadge } from './adventure-accessibility.mjs';
import { drawTile } from './render.mjs';
import { CHAPTERS } from './adventure-art.mjs';
export const CHANNEL_COLORS = Object.freeze({ amber: '#efc47a', jade: '#8ed8ae', violet: '#c3a2e4', blue: '#8acddd' });
export function drawLabDiscovery(canvas,index,unlocked){
  canvas.width=96;canvas.height=72;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const colors=unlocked?['#efbf72','#a5e1d2','#c0a7eb','#ffe5a0']:['#687d6a','#6f8175','#6c7a76','#7b8067'];
  const pixel=(x,y,w,h,color=colors[index])=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const diamond=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();};
  pixel(0,0,96,72,'#12302c');pixel(10,59,76,2,'#41594b');
  if(index===0){diamond(48,32,23,'#72553b');diamond(48,32,17,colors[0]);pixel(45,18,6,28,'#fff0b4');pixel(34,29,28,6,'#fff0b4');}
  if(index===1){diamond(48,32,27,'#476d64');diamond(48,32,23,colors[1]);diamond(48,32,16,'#173e36');diamond(48,22,9,colors[1]);diamond(48,42,9,'#dce9b6');pixel(46,30,4,4,'#fff0b4');}
  if(index===2){diamond(37,33,22,'#67567d');diamond(56,28,22,colors[2]);diamond(56,28,13,'#e2d1f7');pixel(27,54,43,3,colors[2]);pixel(33,48,31,3,'#a5d9d0');}
  if(index===3){for(const [x,y]of [[21,28],[37,18],[56,20],[74,31]]){pixel(x,y+4,2,20,'#677f71');diamond(x+1,y,6,colors[3]);pixel(x,y-2,2,5,'#fff5ce');}pixel(20,48,58,2,'#cfb67c');pixel(32,54,35,2,'#cfb67c');}
  if(!unlocked){ctx.fillStyle='#12302c77';ctx.fillRect(0,0,96,72);}
}
export function drawWorkshopObject(ctx, item, size = 24) {
  ctx.save(); ctx.translate(item.x * size, item.y * size); ctx.scale(size / 24, size / 24);
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }, color = CHANNEL_COLORS[item.channel] || '#efc47a';
  const ring = (ink, x, y, r) => { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  switch (item.kind) {
    case 'start': rect('#926344', 6, 3, 13, 6); rect('#eec997', 8, 8, 9, 6); rect('#e5bc76', 7, 14, 11, 8); rect('#40554a', 8, 21, 3, 3); rect('#40554a', 14, 21, 3, 3); break;
    case 'beacon': ring('#7ed8cc66', 12, 13, 11); rect('#4a9d99', 4, 18, 16, 5); rect('#b0eee0', 9, 3, 6, 16); rect('#e8f8d0', 7, 8, 10, 5); break;
    case 'lantern': ring('#ffe4a13b', 12, 12, 11); rect('#a98043', 6, 3, 12, 18); rect('#ffeba7', 9, 7, 6, 11); break;
    case 'coin': ring('#b98945', 12, 13, 7); ring('#f3d17b', 11, 12, 6); rect('#fff0b5', 10, 8, 2, 8); break;
    case 'key': ring('#f1c36a', 7, 12, 5); ring('#847953', 7, 12, 2); rect('#f1c36a', 11, 10, 11, 4); rect('#f1c36a', 18, 13, 3, 4); break;
    case 'gate': rect('#69503a', 2, 3, 4, 20); rect('#69503a', 18, 3, 4, 20); rect('#e1b46b', 4, 7, 16, 4); rect('#e1b46b', 4, 15, 16, 4); break;
    case 'crate': rect('#805c3e', 3, 5, 18, 18); rect('#c6a16a', 5, 7, 14, 14); rect('#8d673f', 6, 9, 12, 3); rect('#8d673f', 9, 7, 3, 14); break;
    case 'plate': rect('#59634a', 2, 14, 20, 7); rect(color, 4, 12, 16, 6); rect('#ffe7a0', 10, 13, 4, 3); break;
    case 'bridge': drawTile(ctx, 12, 0, 0); rect(color, 2, 1, 4, 4); rect(color, 18, 1, 4, 4); break;
    case 'lever': rect('#7b7253', 5, 15, 14, 8); ring(color, 12, 10, 8); rect('#334b44', 6, 9, 12, 3); rect('#f6df9b', 10, 18, 4, 2); break;
    case 'door': case 'signal': rect('#655f78', 2, 3, 4, 20); rect('#655f78', 18, 3, 4, 20); rect(item.kind === 'door' ? color : '#d4b4e1', 4, 7, 16, 3); rect(item.kind === 'door' ? color : '#d4b4e1', 4, 16, 16, 3); ring('#e9ddc0', 12, 12, 3); break;
    case 'bell': rect('#626f57', 6, 18, 12, 5); rect('#e0c78e', 6, 7, 12, 12); rect('#fff0bb', 10, 3, 4, 5); ctx.fillStyle = '#3b5144'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(item.order || 1), 12, 16); break;
    case 'waystone': ring('#c0a6e444', 12, 12, 11); rect('#7b769b', 3, 3, 4, 20); rect('#7b769b', 17, 3, 4, 20); rect(color, 5, 2, 14, 4); rect('#a4ece0', 10, 8, 4, 12); break;
    case 'guide': case 'rescue': rect(item.kind === 'rescue' ? '#857099' : '#648a89', 6, 11, 13, 12); rect('#edc594', 8, 5, 9, 8); rect('#846348', 6, 3, 13, 5); rect('#ffedb9', 9, 0, 7, 3); break;
    case 'relic': rect('#b5aad5', 7, 7, 10, 14); rect('#e6d4e9', 9, 4, 6, 15); rect('#a0d6d5', 3, 11, 3, 3); rect('#a0d6d5', 19, 6, 3, 3); break;
    case 'supplies': rect('#496d62', 3, 8, 18, 14); rect('#b5d29a', 5, 9, 14, 3); rect('#f5e3b0', 10, 6, 4, 16); break;
    case 'heart': ctx.fillStyle = '#f1aa8b'; ctx.beginPath(); ctx.moveTo(12, 20); ctx.lineTo(3, 11); ctx.lineTo(3, 6); ctx.lineTo(8, 3); ctx.lineTo(12, 7); ctx.lineTo(16, 3); ctx.lineTo(21, 6); ctx.lineTo(21, 11); ctx.closePath(); ctx.fill(); break;
    case 'fern': for (let i = 0; i < 3; i++) { rect('#a8cc7d', 4 + i * 7, 4 + i % 2 * 3, 2, 19); rect('#70965e', 1 + i * 7, 8, 8, 3); rect('#70965e', 1 + i * 7, 15, 8, 3); } break;
    case 'ember': rect('#805d4b', 2, 16, 20, 7); for (let i = 0; i < 3; i++) { rect('#e7a25e', 4 + i * 6, 5 + i % 2 * 3, 4, 15); rect('#ffe29e', 5 + i * 6, 11, 2, 8); } break;
    case 'patrol': case 'hunter': case 'watcher': rect(item.kind === 'watcher' ? '#786a8b' : '#a76c61', 4, 6, 16, 16); rect('#473f4c', 6, 9, 12, 6); rect('#ffe2a0', 7, 10, 3, 3); rect('#ffe2a0', 14, 10, 3, 3); if (item.kind === 'watcher') { rect('#d3b2db', 3, 1, 4, 7); rect('#d3b2db', 17, 1, 4, 7); } break;
  }
  ctx.restore();
  if(['plate','bridge','lever','door','waystone','ember'].includes(item.kind))drawCueBadge(ctx,item,CHANNEL_NUMBERS[item.channel]||'1','',size);
}
export function drawWorkshopWorld(canvas, pack, { thumbnail = false, selected = null, cursor = null, grid = false } = {}) {
  const map = pack.map, size = thumbnail ? Math.min(24, 360 / map.width, 240 / map.height) : 24, width = Math.ceil(map.width * size), height = Math.ceil(map.height * size);
  if (canvas.width !== width) canvas.width = width; if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#173932'; ctx.fillRect(0, 0, width, height);
  for (const layer of map.layers) if (layer.visible) for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) drawTile(ctx, layer.tiles[y * map.width + x], x * size, y * size, size, x * 7 + y * 3);
  const theme = CHAPTERS.find(theme => theme.id === pack.theme) || CHAPTERS[0]; ctx.fillStyle = `${theme.ridge}32`; ctx.fillRect(0, 0, width, height);
  if(typeof document!=='undefined'&&document.body?.dataset.gameContrast==='high'){
    const walkable=walkableCells(map);for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){const open=walkable[y*map.width+x];ctx.fillStyle=open?'#13262c':'#576572';ctx.fillRect(x*size,y*size,size,size);ctx.strokeStyle=open?'#3f5860':'#d3e0e8';ctx.lineWidth=.5;ctx.strokeRect(x*size+.5,y*size+.5,size-1,size-1);}
  }
  if (grid) { ctx.strokeStyle = '#17393235'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= map.width; x++) { ctx.moveTo(x * size, 0); ctx.lineTo(x * size, height); } for (let y = 0; y <= map.height; y++) { ctx.moveTo(0, y * size); ctx.lineTo(width, y * size); } ctx.stroke(); }
  for (const item of [...pack.markers.filter(m => ['fern', 'ember'].includes(m.kind)), ...pack.markers.filter(m => !['fern', 'ember'].includes(m.kind))]) drawWorkshopObject(ctx, item, size);
  const object = pack.markers.find(m => m.id === selected);
  if (object?.route && !thumbnail) { ctx.strokeStyle = '#f5d893'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); object.route.forEach((p, i) => i ? ctx.lineTo((p.x + .5) * size, (p.y + .5) * size) : ctx.moveTo((p.x + .5) * size, (p.y + .5) * size)); ctx.stroke(); ctx.setLineDash([]); }
  if (object) { ctx.strokeStyle = '#fff0b2'; ctx.lineWidth = 2; ctx.strokeRect(object.x * size + 1, object.y * size + 1, size - 2, size - 2); }
  if (cursor && !thumbnail) { ctx.strokeStyle = '#fff4d2'; ctx.lineWidth = 1; ctx.strokeRect(cursor.x * size + 2, cursor.y * size + 2, size - 4, size - 4); }
}
