/* Presentation only. Existing board state, server and bridge contracts stay intact. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id);
 const panels=[...document.querySelectorAll('.workspace-dialog')];
 let returnTo=null;
 document.querySelectorAll('[data-open-panel]').forEach(button=>button.addEventListener('click',()=>{
   returnTo=button;
   byId(button.dataset.openPanel).showModal();
 }));
 panels.forEach(panel=>{
   panel.querySelector('[data-close-panel]').addEventListener('click',()=>panel.close());
   panel.addEventListener('close',()=>{if(returnTo?.isConnected)returnTo.focus();});
   panel.addEventListener('click',e=>{
     if(e.target!==panel)return;
     const r=panel.getBoundingClientRect();
     if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();
   });
 });
 ['toggleTrainer','toggleTrainerBoard','focusBoard'].forEach(id=>byId(id).addEventListener('click',()=>{
   panels.forEach(panel=>{if(panel.open)panel.close();});
   requestAnimationFrame(()=>byId('canvas').focus({preventScroll:true}));
 }));
 const picker=byId('trainerPicker');
 const closeAfterOpen=()=>{if(byId('pickerError').hidden&&picker.open)picker.close();};
 byId('openTrainer').addEventListener('click',closeAfterOpen);
 byId('trainerUrl').addEventListener('keydown',e=>{if(e.key==='Enter')closeAfterOpen();});
 byId('trainerQuick').addEventListener('change',closeAfterOpen);
 const error=byId('pickerError'),inline=byId('pickerInlineError');
 const syncError=()=>{inline.textContent=error.textContent;inline.hidden=error.hidden;};
 new MutationObserver(syncError).observe(error,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 syncError();
 const title=byId('openedTrainerTitle');
 new MutationObserver(()=>{title.title=title.textContent;}).observe(title,{childList:true,subtree:true});
 const status=byId('shareStatus');
 new MutationObserver(()=>{status.title=status.textContent;}).observe(status,{childList:true,subtree:true});
})();
