// New owned material. See LICENSE; prior MIT material retains its permissions.
let pending=null;
export function confirmGame(message,{title='Before you continue',accept='Continue'}={}) {
  if(pending)return Promise.resolve(false);
  const opener=document.activeElement,dialog=document.createElement('dialog');dialog.id='game-confirm-dialog';dialog.className='front-dialog';dialog.setAttribute('aria-labelledby','game-confirm-title');dialog.setAttribute('aria-describedby','game-confirm-copy');
  const heading=document.createElement('h2');heading.id='game-confirm-title';heading.textContent=title;
  const copy=document.createElement('p');copy.id='game-confirm-copy';copy.tabIndex=0;copy.textContent=message;
  const actions=document.createElement('div');actions.className='dialog-actions';const cancel=document.createElement('button'),yes=document.createElement('button');cancel.tabIndex=yes.tabIndex=0;cancel.id='game-confirm-cancel';cancel.textContent='Keep what I have';yes.id='game-confirm-accept';yes.textContent=accept;yes.className='front-primary';actions.append(cancel,yes);dialog.append(heading,copy,actions);document.body.append(dialog);
  pending=new Promise(resolve=>{cancel.onclick=()=>dialog.close('cancel');yes.onclick=()=>dialog.close('accept');dialog.addEventListener('close',()=>{const result=dialog.returnValue==='accept';dialog.remove();pending=null;if(opener?.isConnected)opener.focus({preventScroll:true});resolve(result);},{once:true});});const result=pending;dialog.showModal();cancel.focus();return result;
}
