// New owned material. See LICENSE; prior MIT permissions remain effective.
const power=['amber','jade','violet','blue'];
export function createCounterEditor({prefix,anchor,onChange=()=>{},showChannel=true}){
 const element=document.createElement('fieldset');element.id=prefix+'fields';element.innerHTML=`<legend>Footfall Counter O</legend><label ${showChannel?'':'hidden'}>Power channel<select id="${prefix}channel"></select></label><label>Count this courier<select id="${prefix}courier"></select></label><label>Ring every<select id="${prefix}threshold"></select></label><label>Starting marks<select id="${prefix}phase"></select></label><label>Power lasts<select id="${prefix}duration"></select></label>`;
 const $=id=>element.querySelector('#'+prefix+id),fill=(id,options)=>$(id).replaceChildren(...options.map(([k,label])=>new Option(label,String(k)))),n=(length,first,unit)=>Array.from({length},(_,i)=>{const j=i+first;return [j,`${j} ${unit}${j===1?'':'s'}`];});let length=0;
 fill('channel',power.map((c,i)=>[c,`${i+1} · ${c[0].toUpperCase()}${c.slice(1)}`]));fill('courier',[['either','Either courier'],['pip','Pip only'],['sprout','Sprout only']]);fill('threshold',n(6,1,'arrival'));fill('duration',n(6,1,'turn'));
 function marks(max,phase){if(length!==max){fill('phase',n(max,0,'mark'));length=max;} $('phase').value=String(Math.min(phase,max-1));}
 function value(){return {...(showChannel?{channel:$('channel').value}:{}),courier:$('courier').value,threshold:Number($('threshold').value),phase:Number($('phase').value),duration:Number($('duration').value)};}
 function set(p){for(const id of ['channel','courier','threshold','duration'])$(id).value=String(p[id]);marks(p.threshold,p.phase);}
 for(const id of ['channel','courier','threshold','phase','duration'])$(id).onchange=()=>{if(id==='threshold')marks(Number($('threshold').value),Number($('phase').value));onChange();};
 set({channel:'amber',courier:'either',threshold:2,phase:0,duration:1});anchor.after(element);element.hidden=true;return {element,set,value};
}
