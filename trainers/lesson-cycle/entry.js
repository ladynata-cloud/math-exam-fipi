/* Candidate: local entry control for the four existing MathExam courses. */
(function(root){
'use strict';
const topics=new Set(['area','prob','rate','motion']);
function mount(anchor,topic,{visible=true}={}){
 if(!anchor||!topics.has(topic)||root.top!==root||!['http:','https:'].includes(root.location.protocol))return null;
 const q=new URLSearchParams(root.location.search);
 if(q.get('board')==='1'||q.get('learning')==='1')return null;
 const existing=anchor.querySelector('[data-mathexam-lesson-cycle="'+topic+'"]');
 if(existing){existing.hidden=!visible;return existing;}
 const p=document.createElement('p');p.dataset.mathexamLessonCycle=topic;p.hidden=!visible;
 const link=document.createElement('a');link.textContent='Полное занятие: диагностика, практика и домашняя работа';
 const dir=topic==='area'?'./lesson-cycle/':'../lesson-cycle/';
 link.href=new URL(dir+'START.html?topic='+topic,root.location.href).href;link.target='_blank';link.rel='noopener noreferrer';p.append(link);
 const hint=document.createElement('small');hint.textContent=' · личный режим, отдельная вкладка';p.append(hint);anchor.append(p);return p;
}
root.MathExamLessonCycleEntry=Object.freeze({mount});
})(window);
