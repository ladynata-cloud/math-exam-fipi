/* Hide public exploration links in existing managed/exam wrappers. No storage writes. */
(function(){'use strict';
 let isolated=true;try{const q=new URLSearchParams(location.search);isolated=window.self!==window.top||window.MathExamLearning?.managed===true||!!window.OgeCourseSharedMode||['board','mirror','embedded','managed'].some(k=>q.get(k)==='1')||q.get('mode')==='exam';}catch(_){}
 if(isolated){document.querySelectorAll('.oge-skill-entrance').forEach(node=>node.hidden=true);return;}
 const query=new URLSearchParams(location.search),data=window.OgeSkillEntryData||{},map=Object.hasOwn(data,query.get('skill-map'))?data[query.get('skill-map')]:null,node=query.get('skill-node'),title=map&&Object.hasOwn(map.nodes,node)?map.nodes[node]:null;
 if(title){const link=document.querySelector('.oge-skill-entrance a');if(link){link.href='/oge/skills/#'+query.get('skill-map')+'?node='+node;link.replaceChildren(document.createTextNode('← К шагу «'+title+'»'));const note=document.createElement('small');note.textContent=map.title;link.append(note);}}
 function selectInvestigation(){const id=new URLSearchParams(location.search).get('skill-model');if(!id||!/^[a-z][a-z0-9-]{1,60}$/.test(id))return;const shell=document.getElementById('oge-video-models'),picker=shell?.querySelector('[data-ovm-picker]');if(!picker||![...picker.options].some(option=>option.value===id))return;shell.open=true;if(picker.value!==id){picker.value=id;picker.dispatchEvent(new Event('change',{bubbles:true}));}requestAnimationFrame(()=>{shell.scrollIntoView({block:'start'});shell.querySelector('summary')?.focus({preventScroll:true});});}
 if(document.readyState==='complete')selectInvestigation();else document.addEventListener('DOMContentLoaded',selectInvestigation,{once:true});
})();
