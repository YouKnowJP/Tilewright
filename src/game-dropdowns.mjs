// Native selects remain the data/form controls. Only these HTML comboboxes are
// interactive, so opening a choice never invokes a browser or operating-system picker.
const widgets=new Map();let active=null,serial=0,frame=0;
const set=(node,name,value)=>{if(node.getAttribute(name)!==String(value))node.setAttribute(name,String(value));};
const enabled=option=>!option.hidden&&!option.disabled&&!option.closest('optgroup[disabled],optgroup[hidden]');
const visible=node=>node.isConnected&&!node.closest('[hidden], [inert]')&&node.getClientRects().length>0;
function nameOf(widget){
  const {source,labels}=widget,by=source.getAttribute('aria-labelledby');
  return source.getAttribute('aria-label')||(by?by.split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' '):labels.map(label=>[...label.childNodes].filter(node=>node.nodeType===3).map(node=>node.textContent).join(' ')).join(' ')).trim()||'Choose an option';
}
function refresh(widget){
  const {source,trigger}=widget,option=source.selectedOptions[0];
  const text=option?.label||'Choose an option';if(trigger.firstChild.textContent!==text)trigger.firstChild.textContent=text;
  trigger.disabled=source.disabled||!Array.from(source.options).some(enabled);trigger.hidden=source.hidden;
  set(trigger,'aria-label',nameOf(widget));set(trigger,'aria-disabled',trigger.disabled);
  if(source.title)trigger.title=source.title;else trigger.removeAttribute('title');
  if(active?.widget===widget){if(trigger.disabled||!visible(trigger))close(false);else renderChoices();}
}
function close(focus=true){
  if(!active)return;const {widget,menu}=active;active=null;
  set(widget.trigger,'aria-expanded','false');widget.trigger.removeAttribute('aria-activedescendant');
  if(typeof menu.hidePopover==='function'&&menu.matches(':popover-open'))menu.hidePopover();menu.remove();
  if(focus&&visible(widget.trigger))widget.trigger.focus({preventScroll:true});
}
function highlight(index){
  if(!active)return;const {widget,list,choices}=active;if(!choices.length)return;
  active.index=Math.max(0,Math.min(choices.length-1,index));
  for(const row of list.querySelectorAll('[role="option"]'))row.classList.toggle('is-active',Number(row.dataset.index)===active.index);
  const row=list.querySelector(`[data-index="${active.index}"]`);set(widget.trigger,'aria-activedescendant',row.id);
  const r=row.getBoundingClientRect(),bounds=list.getBoundingClientRect();if(r.top<bounds.top)list.scrollTop-=bounds.top-r.top;else if(r.bottom>bounds.bottom)list.scrollTop+=r.bottom-bounds.bottom;
}
function commit(index){
  if(!active)return;const {widget,choices}=active,option=choices[index];if(!option||!enabled(option))return;
  const changed=widget.source.value!==option.value;close();widget.source.value=option.value;
  if(changed){widget.source.dispatchEvent(new Event('input',{bubbles:true}));widget.source.dispatchEvent(new Event('change',{bubbles:true}));}
  refresh(widget);
}
function renderChoices(){
  if(!active)return;const {widget,list}=active,previous=active.choices?.[active.index]?.value;
  active.choices=Array.from(widget.source.options).filter(enabled);list.replaceChildren();let group=null;
  for(const option of widget.source.options){
    if(option.hidden||option.closest('optgroup[hidden]'))continue;
    const parent=option.closest('optgroup');if(parent&&parent!==group){const title=document.createElement('div');title.className='game-select-group';title.textContent=parent.label;title.setAttribute('role','presentation');list.append(title);}group=parent;
    const row=document.createElement('div'),index=active.choices.indexOf(option);row.className='game-select-option';row.textContent=option.label;row.id=`${widget.trigger.id}-option-${option.index}`;row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.selected));row.setAttribute('aria-disabled',String(!enabled(option)));row.dataset.index=String(index);row.dataset.value=option.value;
    row.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'&&index>=0)highlight(index);});
    row.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')event.preventDefault();});row.addEventListener('click',()=>commit(index));list.append(row);
  }
  const index=active.choices.findIndex(option=>option.value===(previous??widget.source.value));active.index=Math.max(0,index);position();highlight(active.index);
}
function position(){
  if(!active)return;const {widget,menu,list}=active;if(!visible(widget.trigger)){close(false);return;}
  const viewport=window.visualViewport,left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0,width=viewport?.width||innerWidth,height=viewport?.height||innerHeight,rect=widget.trigger.getBoundingClientRect(),gap=6,edge=8;
  if(rect.bottom<top||rect.top>top+height||rect.right<left||rect.left>left+width){close(false);return;}
  const below=top+height-rect.bottom-edge-gap,above=rect.top-top-edge-gap,desired=Math.min(380,list.scrollHeight+48),up=below<Math.min(desired,180)&&above>below;
  const available=Math.max(70,Math.min(380,up?above:below));menu.style.width=`${Math.min(width-edge*2,Math.max(rect.width,Math.min(340,width-edge*2)))}px`;
  menu.style.left=`${Math.max(left+edge,Math.min(rect.left,left+width-edge-parseFloat(menu.style.width)))}px`;
  list.style.maxHeight=`${Math.max(44,available-menu.firstChild.getBoundingClientRect().height-14)}px`;menu.style.maxHeight=`${available}px`;
  menu.style.top=`${up?Math.max(top+edge,rect.top-gap-menu.getBoundingClientRect().height):rect.bottom+gap}px`;
}
function schedulePosition(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;position();});}
function open(widget){
  if(widget.trigger.disabled||!visible(widget.trigger))return;if(active?.widget===widget){close();return;}close(false);
  const menu=document.createElement('div'),heading=document.createElement('div'),list=document.createElement('div');menu.className='game-select-menu';menu.setAttribute('popover','manual');heading.className='game-select-heading';heading.textContent=nameOf(widget);heading.setAttribute('aria-hidden','true');list.className='game-select-options';list.id=`${widget.trigger.id}-list`;list.setAttribute('role','listbox');list.setAttribute('aria-label',nameOf(widget));menu.append(heading,list);
  (widget.trigger.closest('dialog[open]')||document.body).append(menu);active={widget,menu,list,index:0,choices:[],buffer:'',typedAt:0};
  set(widget.trigger,'aria-controls',list.id);set(widget.trigger,'aria-expanded','true');widget.trigger.focus({preventScroll:true});
  if(typeof menu.showPopover==='function')menu.showPopover();else menu.dataset.fallback='open';renderChoices();
}
function step(delta){if(active)highlight((active.index+delta+active.choices.length)%active.choices.length);}
function typeAhead(key){
  if(!active)return;const now=performance.now();active.buffer=now-active.typedAt>700?key:active.buffer+key;active.typedAt=now;
  const needle=active.buffer.toLocaleLowerCase(),repeated=[...needle].every(char=>char===needle[0]),term=repeated?needle[0]:needle,start=repeated?active.index+1:active.index;
  for(let i=0;i<active.choices.length;i++){const index=(start+i)%active.choices.length;if(active.choices[index].label.toLocaleLowerCase().split(/\s+/).some(word=>word.startsWith(term))||active.choices[index].label.toLocaleLowerCase().startsWith(term)){highlight(index);break;}}
}
function enhance(source){
  if(widgets.has(source)||source.multiple||source.size>1)return;
  source.id||=`game-choice-${++serial}`;const labels=Array.from(source.labels),trigger=document.createElement('button');trigger.type='button';trigger.id=`${source.id}-control`;trigger.className='game-select-trigger';trigger.dataset.gameSelect=source.id;trigger.append(document.createElement('span'));trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const widget={source,trigger,labels};widgets.set(source,widget);source.classList.add('game-select-source');source.tabIndex=-1;source.setAttribute('aria-hidden','true');source.after(trigger);for(const label of labels)label.htmlFor=trigger.id;
  // The game also sets values directly when restoring saves or changing modes.
  for(const property of ['value','selectedIndex']){const descriptor=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,property);Object.defineProperty(source,property,{configurable:true,get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);refresh(widget);}});}
  source.addEventListener('change',()=>refresh(widget));source.addEventListener('focus',()=>trigger.focus({preventScroll:true}));trigger.addEventListener('click',()=>open(widget));
  new MutationObserver(()=>refresh(widget)).observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','selected','label','value','title','aria-label','aria-labelledby']});refresh(widget);
}
export function controlDropdown(command){
  if(active){if(['up','left'].includes(command))step(-1);else if(['down','right'].includes(command))step(1);else if(command==='interact')commit(active.index);else if(['back','pause','plan'].includes(command))close();return true;}
  const source=document.activeElement?.dataset.gameSelect,widget=source&&widgets.get(document.getElementById(source));if(!widget||widget.trigger.disabled)return false;
  if(command==='interact'){open(widget);return true;}
  if(['left','right'].includes(command)){open(widget);step(command==='left'?-1:1);commit(active.index);return true;}return false;
}
export function installGameDropdowns(){
  document.querySelectorAll('select').forEach(enhance);
  document.addEventListener('keydown',event=>{
    const widget=widgets.get(document.getElementById(event.target.dataset?.gameSelect));if(!widget)return;
    if(event.ctrlKey||event.metaKey)return;const key=event.key;if(!active&&widget.source.id==='game-target'&&key.toLowerCase()==='e')return;
    if(key==='Tab'){close(false);return;}
    if(key==='Escape'&&active){event.preventDefault();event.stopImmediatePropagation();close();return;}
    const arrow=['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(key),accept=key==='Enter'||key===' ',boundary=['Home','End','PageDown','PageUp'].includes(key),typing=key.length===1&&!event.altKey;
    if(!arrow&&!accept&&!boundary&&!typing)return;event.preventDefault();event.stopImmediatePropagation();if(event.repeat&&accept)return;
    if(!active){open(widget);if(key==='Home')highlight(0);else if(key==='End')highlight(active.choices.length-1);else if(typing&&!accept)typeAhead(key);return;}
    if(arrow)step(['ArrowUp','ArrowLeft'].includes(key)?-1:1);else if(boundary)highlight(key==='Home'?0:key==='End'?active.choices.length-1:active.index+(key==='PageUp'?-8:8));else if(accept)commit(active.index);else if(typing)typeAhead(key);
  },true);
  document.addEventListener('pointerdown',event=>{if(active&&!active.menu.contains(event.target)&&!active.widget.trigger.contains(event.target))close(false);},true);
  document.addEventListener('focusin',event=>{if(active&&!active.menu.contains(event.target)&&event.target!==active.widget.trigger)close(false);});
  document.addEventListener('reset',()=>queueMicrotask(()=>widgets.forEach(refresh)));
  const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches('select'))enhance(node);node.querySelectorAll('select').forEach(enhance);}if(active&&!visible(active.widget.trigger))close(false);});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','inert']});
  window.addEventListener('resize',schedulePosition);window.addEventListener('scroll',schedulePosition,true);window.visualViewport?.addEventListener('resize',schedulePosition);window.visualViewport?.addEventListener('scroll',schedulePosition);window.addEventListener('blur',()=>close(false));
}
