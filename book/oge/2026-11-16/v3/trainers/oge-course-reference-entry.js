/* Official OGE sheet beside existing equation, vertex and interval help. */
(function(){
'use strict';
const d=document,R=window.OgeCourseReference;if(!R)return;
function sheet(host,label,crop){if(!host||host.querySelector(':scope>.ocre-sheet'))return;const box=d.createElement('div');box.className='ocre-sheet';R.sheetCards(box,[crop],{pages:[3],label,crops:window.OgeCourseAlgebraReference?.crops});host.append(box);}
function update(){
 for(const host of d.querySelectorAll('.task11-vertex .vertex-reference')){
  if(host.dataset.ocreReady)continue;host.dataset.ocreReady='1';
  sheet(host.parentElement,'Где формула вершины в справочных материалах?','parabola-vertex');
 }
 for(const host of d.querySelectorAll('.equation-discovery[data-discovery-family="QF"] .discovery-body,.equation-discovery[data-discovery-family="QR"] .discovery-body,.equation-discovery[data-discovery-family="LSQ"] .discovery-body'))sheet(host,'Где нужная формула в справочном листе?',host.closest('.equation-discovery').dataset.discoveryFamily==='LSQ'?'identities':'quadratic-roots');
 const lab=d.querySelector('#task13LabHost [data-lab-kind="quad"]');
 if(lab)sheet(lab,'Где формула корней квадратного трёхчлена?','quadratic-roots');
}
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;update();});});observer.observe(d.body,{subtree:true,childList:true});update();
window.OgeCourseReferenceEntry={update,dispose:()=>observer.disconnect()};
})();
