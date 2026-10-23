const palette={night:'#112c32',pine:'#25493d',path:'#8b8055',roof:'#a36c59',wall:'#c0b28b',light:'#ffe3a0',water:'#689eaa'};
function house(ctx,x,y,built,index=0){
  const rect=(color,a,b,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x+a,y+b,w,h);};
  rect('#0b252966',-30,33,70,9);rect(built?palette.wall:'#41564a',-25,-5,54,40);
  for(let i=0;i<7;i++)rect(built?index%2?'#8f829c':palette.roof:'#3a5148',-31+i*4,-12-i*4,66-i*8,5);
  rect('#293f38',-4,12,12,24);rect(built?palette.light:'#253e39',-18,5,10,10);rect(built?palette.light:'#253e39',13,5,10,10);
  if(!built){rect('#687452',-35,28,15,5);rect('#687452',20,30,20,5);return;}
  if(index===0){rect('#dacb94',33,7,5,30);rect('#cba274',27,1,18,14);rect('#6d6550',29,7,14,2);}
  if(index===1){ctx.strokeStyle='#dcc48b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+35,y+20,16,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(x+35,y+20);ctx.lineTo(x+35+Math.cos(a)*15,y+20+Math.sin(a)*15);ctx.stroke();}}
  if(index===2){for(let i=0;i<5;i++){rect('#7f9b65',-34+i*17,39,3,13);rect(i%2?'#f1d18d':'#ce9da5',-37+i*17,35,10,6);}}
  if(index===3){rect('#b9a7ce',-20,-1,15,5);rect('#b9a7ce',10,-1,15,5);}
  if(index===4){ctx.fillStyle='#94b9bf';ctx.beginPath();ctx.arc(x+2,y-28,20,Math.PI,0);ctx.fill();rect('#d4c28c',8,-41,29,7);}
  if(index===5){for(let i=0;i<4;i++){rect('#c6acd3',-28+i*21,-36-i%2*5,8,8);rect('#e9d5a2',-26+i*21,-38-i%2*5,4,12);}}
}
export function drawVillage(canvas,state){
  canvas.width=720;canvas.height=380;const ctx=canvas.getContext('2d'),rect=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  rect(palette.night,0,0,720,380);const built=new Set(state.built);
  for(let i=0;i<60;i++)rect(i<state.completed.length*4?'#f5d994':'#597b79',(i*137+19)%720,(i*37+11)%110,2,2);
  for(let i=0;i<15;i++){const x=i*53-12,y=110+i%3*20;rect('#1c3b35',x+15,y,8,52);for(let row=0;row<5;row++)rect(palette.pine,x+20-row*6,y-60+row*13,4+row*12,14);}
  rect('#344f3d',35,142,650,205);rect('#3d5940',70,130,580,220);
  for(let i=0;i<60;i++)rect('#54704a',(i*97+45)%650+20,145+(i*41)%195,6,3);
  rect(palette.path,340,153,21,208);rect(palette.path,104,198,500,15);rect(palette.path,215,287,310,15);
  rect(built.has('canal')?palette.water:'#586452',20,319,680,13);rect('#bba170',331,314,42,23);
  const positions=[[120,179],[292,150],[453,156],[600,184],[241,274],[492,274]],ids=['post','canal','garden','archive','observatory','studio'];
  positions.forEach(([x,y],i)=>house(ctx,x,y,built.has(ids[i]),i));
  for(let i=0;i<6;i++){const x=[83,200,377,555,314,610][i],y=[246,123,244,133,302,291][i];rect('#7d8261',x,y,3,20);rect(built.size>i?palette.light:'#55634b',x-4,y-6,11,11);if(built.size>i){ctx.fillStyle='#ffe2a01b';ctx.beginPath();ctx.arc(x+1,y,22,0,Math.PI*2);ctx.fill();}}
  if(state.decoration==='ferry'){for(const [x,y] of [[130,325],[530,325]]){rect('#e2bb76',x,y-4,34,7);rect('#af8957',x+5,y+3,24,4);rect('#f2d79c',x+16,y-16,2,12);rect('#d9c591',x+18,y-14,13,9);}}
  if(state.decoration==='stars'){ctx.strokeStyle='#b5a1b8';ctx.beginPath();ctx.moveTo(80,95);ctx.quadraticCurveTo(350,155,640,95);ctx.stroke();for(let i=0;i<13;i++){const x=90+i*43,y=103+Math.sin(i/12*Math.PI)*26;rect('#dac0e6',x,y,8,8);rect('#f7dfae',x+3,y-4,2,16);rect('#f7dfae',x-4,y+3,16,2);}}
  if(built.size===6){ctx.strokeStyle='#d8bf88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(80,110);ctx.lineTo(640,110);ctx.stroke();for(let i=0;i<18;i++)rect(['#cca1a7','#b0c6a2','#e9cc88'][i%3],87+i*31,111,14,13);}
}
export function drawProject(canvas,index,built=true){canvas.width=120;canvas.height=100;const ctx=canvas.getContext('2d');ctx.fillStyle='#15332f';ctx.fillRect(0,0,120,100);house(ctx,54,52,built,index);}
export function drawKeepsake(canvas,index,unlocked){
  canvas.width=96;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#122d2d';ctx.fillRect(0,0,96,80);ctx.strokeStyle=unlocked?'#d6bd82':'#526a51';ctx.lineWidth=2;ctx.strokeRect(14,11,68,58);ctx.fillStyle=unlocked?['#e6c486','#99cbd0','#d8d2a1','#bea6d6','#d0bb77','#d4b2d4','#ffe6aa'][index]:'#41554a';
  if(index===0){ctx.fillRect(28,29,40,25);ctx.strokeStyle='#7b6851';ctx.beginPath();ctx.moveTo(28,29);ctx.lineTo(48,44);ctx.lineTo(68,29);ctx.stroke();}
  else if(index===1){ctx.fillRect(39,24,18,34);ctx.fillRect(42,18,12,8);}
  else if(index===2){ctx.beginPath();ctx.ellipse(48,40,10,17,.4,0,Math.PI*2);ctx.fill();}
  else if(index===3){ctx.fillRect(29,24,35,34);ctx.clearRect(54,24,10,10);}
  else if(index===4){ctx.beginPath();ctx.arc(48,40,20,0,Math.PI*2);ctx.stroke();ctx.fillRect(44,36,8,8);ctx.fillRect(64,30,7,7);}
  else{for(let i=0;i<5;i++){const x=30+i*9,y=31+(i%2)*12;ctx.fillRect(x,y,5,5);if(i<4){ctx.beginPath();ctx.moveTo(x+2,y+2);ctx.lineTo(x+11,31+((i+1)%2)*12+2);ctx.stroke();}}}
}
