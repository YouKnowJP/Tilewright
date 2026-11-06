import {normalizePipLook,PIP_PAINTS} from './pip-look.mjs';
import { walkableCells } from './adventure.mjs';
import { CHANNEL_NUMBERS, drawCueBadge } from './adventure-accessibility.mjs';
import { drawTile } from './render.mjs';
import { CHAPTERS } from './adventure-art.mjs';
export const CHANNEL_COLORS = Object.freeze({ amber: '#efc47a', jade: '#8ed8ae', violet: '#c3a2e4', blue: '#8acddd' });
// New owned Parcelworks cover illustration; earlier art retains its permissions.
export function drawParcelworksCover(canvas){
  canvas.width=400;canvas.height=160;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const pixel=(ink,x,y,w,h)=>{ctx.fillStyle=ink;ctx.fillRect(x,y,w,h);};
  pixel('#112f3c',0,0,400,160);pixel('#1b4347',0,82,400,78);
  for(const [x,y]of [[20,20],[54,40],[97,17],[143,32],[181,13],[224,35],[287,21],[381,56]]){pixel('#e6d59c',x,y,3,3);pixel('#9fbead',x-3,y+1,9,1);}
  pixel('#ebd6a0',333,18,27,27);pixel('#112f3c',328,14,20,24);
  for(const [x,y,w]of [[0,94,57],[61,80,48],[118,102,44],[294,85,53],[353,96,47]]){pixel('#254b4b',x,y,w,160-y);pixel('#41635a',x-3,y,w+6,5);for(let wx=x+9;wx<x+w-7;wx+=17){pixel('#f5cd7e',wx,y+13,7,10);pixel('#34534d',wx+3,y+13,1,10);}}
  pixel('#173d3c',0,142,400,18);pixel('#789374',0,142,400,3);
  // Two brass dispatch mouths and their roof-level pipework.
  pixel('#725643',38,64,18,77);pixel('#deb678',41,64,12,74);pixel('#8e6b48',38,60,67,18);pixel('#edc68a',41,63,61,12);
  pixel('#edc68a',93,59,20,33);pixel('#fff0c1',96,62,14,27);pixel('#153b42',99,66,11,19);
  pixel('#725643',322,69,19,72);pixel('#deb678',325,69,13,69);pixel('#edc68a',300,64,43,18);pixel('#fff0c1',293,60,19,32);pixel('#153b42',296,65,11,21);
  for(const [x,y]of [[125,63],[147,53],[170,49],[193,52],[275,55]])pixel('#e0ba75',x,y,5,3);
  for(const [x,y]of [[155,76],[278,90]]){pixel('#e7dfb7',x,y,17,12);pixel('#b89864',x+2,y+2,13,2);pixel('#b89864',x+5,y+5,7,2);}
  ctx.save();ctx.translate(201,65);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0},77);ctx.restore();
  pixel('#e9bf76',265,123,16,16);pixel('#fff0bd',271,123,4,16);pixel('#537165',184,144,106,3);
}
// New owned illustration for the Lantern Loom.
export function drawLoomCover(canvas){
 canvas.width=400;canvas.height=160;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const pixel=(ink,x,y,w,h)=>{ctx.fillStyle=ink;ctx.fillRect(x,y,w,h);};
 pixel('#192f3e',0,0,400,160);pixel('#304853',0,92,400,68);for(const [x,y,w]of [[0,71,40],[146,84,49],[318,68,82]]){pixel('#25404a',x,y,w,160-y);pixel('#577367',x-3,y,w+6,5);for(let k=x+11;k<x+w-8;k+=18)pixel('#d6be82',k,y+17,7,12);}
 for(const [x,y]of [[23,22],[155,29],[206,13],[293,24],[377,41]]){pixel('#e8d9ac',x,y,3,3);pixel('#b5c9ae',x-2,y+1,7,1);}
 pixel('#d9b779',41,45,100,12);pixel('#759288',44,56,13,88);pixel('#759288',125,56,13,88);pixel('#e6c98e',57,57,68,13);pixel('#ebd5a2',82,69,18,14);pixel('#b8c9ba',61,84,60,44);pixel('#102e37',65,88,52,33);
 for(let n=0;n<3;n++){pixel('#f0dc9e',70+n*15,93,11,22);pixel('#466961',73+n*15,99,6,4);}pixel('#d5b379',58,132,68,12);pixel('#81977f',35,144,116,4);
 for(const [x,y]of [[162,76],[185,82],[307,80]]){pixel('#e8d8a6',x,y,16,22);pixel('#607d72',x+4,y+5,8,3);pixel('#607d72',x+4,y+12,8,3);}
 ctx.save();ctx.translate(225,65);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0},77);ctx.restore();pixel('#e8d09a',319,34,3,25);pixel('#f5df9f',314,54,13,21);pixel('#fff2bf',318,58,5,12);pixel('#789274',0,148,400,3);
}
// New owned illustration for the Signal Orchard.
export function drawOrchardCover(canvas){
 canvas.width=400;canvas.height=160;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const pixel=(ink,x,y,w,h)=>{ctx.fillStyle=ink;ctx.fillRect(x,y,w,h);};
 pixel('#193e45',0,0,400,160);pixel('#31564d',0,105,400,55);pixel('#90b69a',0,146,400,3);pixel('#efdda6',321,18,22,22);
 for(const [x,y,w]of [[0,9,91],[120,0,74],[264,40,57],[352,1,48]]){pixel('#6b6850',x+Math.floor(w/2),y+36,10,118-y);pixel('#37665b',x,y,w,39);pixel('#4f8067',x+7,y+5,w-14,25);for(let n=0;n<3;n++){pixel(n%2?'#a7e3cf':'#f4d48b',x+12+n*19,y+25+n%2*8,7,10);}}
 pixel('#b59e70',32,129,137,9);pixel('#d6c08b',40,117,116,5);for(const [x,y]of [[77,72],[113,84],[160,58],[185,88]]){pixel('#e9deba',x,y,15,20);pixel('#577e6c',x+4,y+5,7,3);pixel('#577e6c',x+4,y+11,7,3);}
 ctx.save();ctx.translate(203,65);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0},77);ctx.restore();ctx.save();ctx.translate(45,74);drawWorkshopObject(ctx,{kind:'pip-router',channel:'jade',x:0,y:0},49);ctx.restore();pixel('#efdda6',299,123,18,16);pixel('#72977c',285,142,45,3);
}
// New owned illustration for the Prism Observatory.
export function drawPrismCover(canvas){
 canvas.width=400;canvas.height=160;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const p=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 p('#172d43',0,0,400,160);p('#304655',0,114,400,46);for(const [x,y]of [[23,17],[57,52],[126,20],[179,40],[275,16],[349,49],[381,22]]){p('#efdda6',x,y,3,3);p('#a4c6c9',x-2,y+1,7,1);}p('#dcd6ac',325,13,22,22);p('#172d43',320,9,15,21);
 p('#55777b',35,76,122,70);p('#7e9b91',28,76,136,6);p('#72968f',46,58,100,18);p('#a3b4a0',61,43,70,15);p('#d1cda5',81,34,30,9);p('#b0ccc0',92,42,7,34);p('#1b3949',69,89,54,54);p('#b0ccc0',94,90,4,53);
 p('#839e95',147,73,58,9);p('#c4d5b0',194,58,14,32);p('#203e51',196,62,7,24);for(const [x,y]of [[216,66],[234,57],[250,46]])p('#e5d28c',x,y,5,3);
 ctx.save();ctx.translate(276,67);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0},75);ctx.restore();ctx.save();ctx.translate(211,105);drawWorkshopObject(ctx,{kind:'pip-prism',x:0,y:0},38);ctx.restore();p('#839d88',0,147,400,4);
}
// New owned illustration for the Lantern Foundry.
export function drawFoundryCover(canvas){
 canvas.width=400;canvas.height=160;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const p=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 p('#213a46',0,0,400,160);p('#3b544f',0,110,400,50);for(const [x,y]of [[24,26],[75,14],[228,20],[303,38],[376,17]])p('#e9d9a4',x,y,3,3);p('#6e8173',39,37,17,93);p('#81978a',35,31,25,8);p('#4d6e68',23,73,153,72);p('#99ad90',19,69,161,6);p('#35534e',42,91,111,53);
 for(const [x,c]of [[52,'#efc47a'],[88,'#8ed8ae'],[124,'#c3a2e4']]){p('#d3d5ad',x,91,22,38);p(c,x+4,96,14,28);p('#f9edbf',x+9,99,4,17);}p('#9c9270',34,141,132,7);for(const [x,y]of [[181,81],[199,74],[217,68]])p('#e5c58b',x,y,5,3);
 ctx.save();ctx.translate(256,65);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0,parcel:'amber'},77);ctx.restore();ctx.save();ctx.translate(193,111);drawWorkshopObject(ctx,{kind:'pip-parcel',x:0,y:0,channel:'amber'},37);ctx.restore();p('#8a9d7e',0,149,400,3);
}
// New owned Switchback Station illustration.
export function drawSwitchbackCover(canvas){
 canvas.width=400;canvas.height=160;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const p=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};p('#193a49',0,0,400,160);p('#45655d',0,116,400,44);p('#819078',0,133,400,4);p('#bda46d',25,117,350,4);for(let x=24;x<380;x+=22)p('#657c6d',x,113,8,18);for(let n=0;n<8;n++){p('#cbb784',160+n*13,116-n*8,14,3);p('#cbb784',160+n*13,123-n*8,14,3);}p('#365b62',27,46,112,68);p('#95b2a1',20,40,127,8);for(const [x,c]of [[38,'#efc47a'],[72,'#8ed8ae'],[106,'#8acddd']]){p('#d7d3a1',x,62,20,28);p(c,x+3,66,14,20);}p('#d9c98d',74,16,5,24);p('#ecdda6',63,16,27,4);p('#91b7ad',0,145,400,3);ctx.save();ctx.translate(166,77);drawWorkshopObject(ctx,{kind:'pip-sorter',channel:'jade',x:0,y:0},47);ctx.restore();ctx.save();ctx.translate(289,63);drawWorkshopObject(ctx,{kind:'clockwork',x:0,y:0,parcel:'amber'},78);ctx.restore();
}
// New owned illustration for the Glassworks.
export function drawGlassworksCover(canvas){
 canvas.width=400;canvas.height=160;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const p=(colour,x,y,w,h)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};p('#20374c',0,0,400,160);p('#39585e',0,113,400,47);p('#91aa93',0,145,400,4);p('#5e7b79',32,43,130,90);p('#a3bda8',25,37,145,8);p('#233e49',46,58,103,65);for(const [x,colour]of [[55,'#efc47a'],[88,'#8ed8ae'],[121,'#8acddd']]){p('#a3bda8',x-3,58,26,59);p(colour,x,64,20,47);p('#f3efc7',x+5,68,4,29);}p('#ccb785',178,70,62,7);p('#819e95',229,65,8,48);p('#ccb785',225,108,43,7);c.save();c.translate(179,91);drawWorkshopObject(c,{kind:'pip-press',channel:'amber',output:'jade',x:0,y:0},53);c.restore();c.save();c.translate(293,64);drawWorkshopObject(c,{kind:'clockwork',x:0,y:0,parcel:'blue'},77);c.restore();for(const [x,y]of [[19,16],[197,23],[278,34],[375,18]])p('#e7d9a4',x,y,3,3);
}
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
    case 'pip-kiln': rect('#314c56',2,3,20,20);rect('#b99b72',4,4,16,18);rect('#d8bc86',15,1,5,6);rect('#183742',6,8,12,11);rect(item.powered?'#edab68':'#769d9c',8,10,8,7);rect(item.powered?'#fff0ad':'#c0d9c6',10,12,4,5);rect(CHANNEL_COLORS[item.input]||'#efc47a',3,5,4,3);rect(CHANNEL_COLORS[item.powered?item.poweredOutput:item.quiet]||'#b3dbb8',17,19,4,3);rect(color,9,3,5,3);break;
    case 'pip-mixer': rect('#344f5a',2,3,20,20);rect('#d5bc83',3,18,18,4);rect('#edcf92',4,9,16,10);rect('#173b43',6,10,12,7);rect(color,4,4,5,4);rect(CHANNEL_COLORS[item.second]||'#9bd9c9',15,4,5,4);rect(item.stored?(CHANNEL_COLORS[item.stored]||'#fff1bd'):'#607b7b',8,12,8,4);rect(CHANNEL_COLORS[item.output]||'#b1dfb9',10,19,4,3);rect('#fff1bc',11,7,2,3);rect('#fff1bc',9,8,6,1);break;
    case 'pip-echo': rect('#304d55',2,3,20,20);rect('#dbbf7d',4,5,6,15);rect('#fff1ba',5,7,3,3);rect('#dbbf7d',14,5,6,15);rect('#fff1ba',16,7,3,3);rect('#91d3c1',9,10,6,3);rect('#91d3c1',10,15,4,3);break;
    case 'pip-scale': rect('#35535a',2,3,20,20);rect('#d5bb7e',3,20,18,3);rect('#edcc87',11,6,3,14);rect(item.powered?color:'#92a6a0',3,7,18,3);rect('#edcc87',4,10,2,5);rect('#edcc87',18,10,2,5);rect(item.powered?'#fff2bd':'#637e81',2,15,7,3);rect(item.powered?'#fff2bd':'#637e81',16,15,7,3);break;
    case 'pip-tide': rect('#314d59',2,2,20,21);rect('#d5ba7c',3,2,18,3);rect('#d5ba7c',3,20,18,3);rect(item.powered?color:'#7b8e93',5,6,14,12);rect('#173d44',7,8,10,8);rect('#fff1bc',11,8,2,5);rect('#fff1bc',11,12,5,2);for(let n=0;n<3;n++)rect(item.powered?'#fff1bc':'#becac4',4+n*6,18-(n%2),4,1);break;
    case 'pip-seal': rect('#46606b',2,3,20,20);rect('#cfb77b',3,5,4,18);rect('#cfb77b',17,5,4,18);rect('#edcf8c',3,3,18,4);rect(CHANNEL_COLORS[item.channel]||'#cbd9cb',8,7,8,10);rect('#173d44',10,9,4,6);if(item.channel==='empty')rect('#f8eac1',10,10,4,3);if(item.courier==='pip')rect('#f6d487',10,1,4,3);if(item.courier==='sprout'){rect('#a7dfb0',10,1,3,3);rect('#a7dfb0',13,0,2,2);}if(item.heading&&item.heading!=='all'){ctx.save();ctx.translate(12,12);ctx.rotate({up:-Math.PI/2,right:0,down:Math.PI/2,left:Math.PI}[item.heading]);rect('#fff3bd',-4,-1,8,2);rect('#fff3bd',2,-3,2,6);ctx.restore();}break;
    case 'pip-pulse-bell': rect('#324d57',2,3,20,20);rect('#c9aa71',3,20,18,3);rect('#f2d18a',7,4,10,3);rect(item.powered?color:'#627b80',5,8,14,10);rect('#e9cc8d',3,17,18,3);rect('#fff1bc',11,20,3,2);rect('#163842',9,9,7,7);rect(item.powered?'#fff2bc':'#8da29a',12,10,2,5);for(let n=0;n<(item.remaining||0);n++)rect(color,3+n*3,1,2,2);break;
    case 'pip-lantern-switch': rect('#324d57',2,3,20,20);rect('#c9aa71',4,4,16,17);rect(item.powered?color:'#173842',6,6,9,12);if(item.powered){rect('#fff4bf',9,7,3,8);ring('#fff1b533',10,12,6);}rect('#152f39',16,6,3,13);rect('#fff0bc',15,item.powered?6:14,5,4);rect('#d8c18a',5,21,14,2);break;
    case 'pip-press': rect('#324a58',2,4,20,19);rect(color,4,7,7,12);rect(CHANNEL_COLORS[item.output]||'#8ed8ae',13,7,7,12);rect('#f5df9d',8,3,8,4);rect('#183d43',10,7,4,9);rect('#fff1c7',9,13,7,3);rect('#8eac99',5,20,14,3);break;
    case 'pip-flip': rect('#354e5c',2,3,20,20);rect('#f0c785',4,5,7,14);rect('#9cd4bb',13,5,7,14);rect('#193c42',6,8,3,8);rect('#193c42',15,8,3,8);rect('#f7edbd',10,10,4,4);rect('#bbad7b',5,20,14,3);break;
    case 'pip-locker': rect('#354e5c',2,3,20,20);rect(color,3,4,18,3);rect('#ceb47e',4,8,16,13);rect('#173b43',6,10,12,8);if(item.stored){rect(CHANNEL_COLORS[item.stored]||'#f4dfa5',8,11,8,6);rect('#fff1c7',11,11,2,6);}else rect('#a8c0b3',14,12,2,4);rect('#d9cc99',5,21,14,2);break;
    case 'pip-sorter': rect('#344b61',2,3,20,20);rect(color,4,5,16,16);rect('#173d45',6,7,12,12);rect('#fff0b9',11,12,3,7);rect('#fff0b9',7,8,3,6);rect('#fff0b9',15,8,3,6);rect('#fff0b9',8,13,9,3);break;
    case 'pip-parcel': rect('#465a61',2,5,20,18);rect(color,4,7,16,13);rect('#102e36',6,9,12,9);rect('#f5d694',9,11,7,7);rect('#fff1c7',11,11,2,7);break;
    case 'pip-socket': rect('#466570',3,5,18,18);rect(color,5,7,14,13);rect(item.powered?'#eaf8b7':'#183b46',7,9,10,8);rect('#fff1c7',10,10,4,6);break;
    case 'pip-lock': drawTile(ctx,12,0,0);rect(color,2,2,4,20);rect(color,18,2,4,20);rect('#f3e8b6',9,9,6,6);break;
    case 'pip-prism': rect('#324e62',2,3,20,20);rect('#b4d8d3',4,5,16,15);rect('#173e49',6,7,12,11);rect('#ffe4a5',11,7,3,10);rect('#ffe4a5',8,10,9,3);rect('#8fbaae',5,20,14,3);break;
    case 'pip-router': rect('#30475e',2,3,20,20);rect(color,4,4,16,17);rect('#102f38',6,6,12,12);for(let n=0;n<3;n++){rect('#e8d8ae',7+n*3,7,2,4);rect('#a7e3cf',7+n*3,13,2,4);}rect('#d5b379',5,20,14,3);break;
    case 'pip-stamp': rect('#30475e',2,3,20,20);rect('#b0c8cf',4,4,16,15);rect('#102f38',6,6,12,10);for(let n=0;n<3;n++){rect('#ffe3a3',7+n*3,8,2,5);}rect('#d5b379',5,20,14,3);break;
    case 'pip-tube': rect('#273e47',2,3,20,20);rect('#d0a766',4,4,16,18);rect(color,6,6,12,14);rect('#102d33',8,8,8,10);rect('#f9e5b2',9,17,6,3);break;
    case 'pip-stop': rect('#efe0a4',2,3,20,18);rect('#4e7069',4,5,16,14);rect('#e6c46b',6,6,3,12);rect('#fbefcc',9,6,9,6);ctx.fillStyle='#1a3536';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(String(item.order||1),13,13);break;
    case 'clockwork': {const look=normalizePipLook(item.look);rect('#805c3e',3,6,18,15);rect(PIP_PAINTS[look.paint].body,5,7,14,11);rect('#203d48',7,10,3,item.mood==='pleased'?2:4);rect('#203d48',14,10,3,item.mood==='pleased'?2:4);if(item.mood==='puzzled')rect('#203d48',13,8,5,1);rect('#ecf5c7',10,2,4,5);if(look.antenna==='leaf'){rect('#8dce9e',13,1,5,3);rect('#58866b',14,0,3,2);}if(look.antenna==='star'){rect('#fff1bc',8,3,8,2);rect('#fff1bc',11,0,2,8);}if(look.scarf!=='none'){const ink=look.scarf==='coral'?'#efa58b':'#fff0c4';rect(ink,5,17,14,3);rect(ink,5,19,4,3);}rect('#566b68',5,21,5,3);rect('#566b68',15,21,5,3);if(item.parcel){rect('#213a43',13,15,11,9);rect(CHANNEL_COLORS[item.parcel]||'#efc47a',15,16,8,7);rect('#fff1c7',18,16,2,7);}break;}
    case 'turntable': ring('#465b70',12,12,11); ring('#e8c785',12,12,8); rect('#253f48',10,4,4,15); rect('#253f48',7,7,9,3); rect('#fff1c6',14,13,5,4); break;
    case 'vault': rect('#503e4d',2,5,20,18); rect('#c99a5f',4,7,16,13); rect('#f4d796',10,6,4,16); ring('#394d57',12,13,4); rect('#fff1c6',11,11,2,4); break;
    case 'rune': ring('#547a81',12,13,9); rect('#d4eeee',10,5,4,15); rect('#d4eeee',5,10,14,4); ring('#203d48',12,12,3); break;
    case 'partner': rect('#6e9dbe',6,11,13,12); rect('#efcba6',8,5,9,8); rect('#3a586d',6,3,13,5); rect('#f6df9b',15,12,4,7); rect('#18363f',8,21,3,3); rect('#18363f',14,21,3,3); break;
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
  if(item.hideCue)return;
  if(item.kind==='pip-press')drawCueBadge(ctx,item,'E',item.number||'',size);
  if(item.kind==='pip-flip')drawCueBadge(ctx,item,'Z',item.number||'',size);
  if(item.kind==='pip-sorter')drawCueBadge(ctx,item,'J',item.number||'',size);
  if(['pip-parcel','pip-socket'].includes(item.kind))drawCueBadge(ctx,item,item.kind==='pip-parcel'?'Q':'N',CHANNEL_NUMBERS[item.channel]||'1',size);
  if(['plate','bridge','lever','door','waystone','ember','pip-lock'].includes(item.kind))drawCueBadge(ctx,item,CHANNEL_NUMBERS[item.channel]||'1','',size);
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
  for (const item of [...pack.markers.filter(m => ['fern', 'ember', 'pip-stop'].includes(m.kind)), ...pack.markers.filter(m => !['fern', 'ember', 'pip-stop'].includes(m.kind))]) drawWorkshopObject(ctx, item, size);
  for(const room of pack.markers.filter(m=>m.kind==='turntable')){const r=(room.span-1)/2;ctx.strokeStyle='#f6d88e';ctx.lineWidth=thumbnail?1:2;ctx.setLineDash([4,3]);ctx.strokeRect((room.x-r)*size+1,(room.y-r)*size+1,room.span*size-2,room.span*size-2);ctx.setLineDash([]);}
  for(const [i,press]of pack.markers.filter(m=>m.kind==='pip-press').entries())drawCueBadge(ctx,press,'E',String(i+1),size);
  for(const [i,prism]of pack.markers.filter(m=>m.kind==='pip-prism').entries())drawCueBadge(ctx,prism,'X',String(i+1),size);
  for(const [i,flip]of pack.markers.filter(m=>m.kind==='pip-flip').entries())drawCueBadge(ctx,flip,'Z',String(i+1),size);
  for(const [i,junction]of pack.markers.filter(m=>m.kind==='pip-sorter').entries())drawCueBadge(ctx,junction,'J',String(i+1),size);
  for(const [i,stamp]of pack.markers.filter(m=>['pip-stamp','pip-router'].includes(m.kind)).entries())drawCueBadge(ctx,stamp,'M',String(i+1),size);
  for(const tube of pack.markers.filter(m=>m.kind==='pip-tube'))drawCueBadge(ctx,tube,'U',CHANNEL_NUMBERS[tube.channel],size);
  for(const stop of pack.markers.filter(m=>m.kind==='pip-stop'))drawCueBadge(ctx,{x:stop.x,y:stop.y+.5},'F',String(stop.order),size);
  const object = pack.markers.find(m => m.id === selected);
  if (object?.route && !thumbnail) { ctx.strokeStyle = '#f5d893'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); object.route.forEach((p, i) => i ? ctx.lineTo((p.x + .5) * size, (p.y + .5) * size) : ctx.moveTo((p.x + .5) * size, (p.y + .5) * size)); ctx.stroke(); ctx.setLineDash([]); }
  if (object) { ctx.strokeStyle = '#fff0b2'; ctx.lineWidth = 2; ctx.strokeRect(object.x * size + 1, object.y * size + 1, size - 2, size - 2); }
  if (cursor && !thumbnail) { ctx.strokeStyle = '#fff4d2'; ctx.lineWidth = 1; ctx.strokeRect(cursor.x * size + 2, cursor.y * size + 2, size - 4, size - 4); }
}

export function drawGardensCover(canvas){
 canvas.width=400;canvas.height=160;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const p=(colour,x,y,w,h)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
 p('#183c40',0,0,400,160);p('#416152',0,108,400,52);p('#bdaa78',12,124,376,8);p('#a4bb8b',0,149,400,4);
 for(const [x,y]of [[30,58],[76,75],[141,42],[228,67],[365,52]]){p('#8eae7a',x,y,5,62);p('#a9c68e',x-12,y+10,16,8);p('#739f7c',x+3,y+23,16,8);p('#efca86',x-5,y-3,16,12);}
 p('#dbc797',95,91,130,5);p('#dbc797',95,91,5,34);p('#dbc797',221,91,5,34);
 c.save();c.translate(116,58);drawWorkshopObject(c,{kind:'pip-flip',x:0,y:0},56);c.restore();
 c.save();c.translate(268,54);drawWorkshopObject(c,{kind:'clockwork',x:0,y:0},77);c.restore();
 for(const [x,y]of [[20,19],[89,30],[197,21],[259,33],[377,17]])p('#f4e5ba',x,y,3,3);
}
