(function(){
'use strict';
if(window.MathExamRemediationManaged)return;
const core=window.QuotientEstimate,D=window.DivisionLab,key='mathExamBasics.quotientEstimate.v1';
const $=id=>document.getElementById(id);
let seed=1,source=core.make(seed),state={answers:[],answer:'',help:false,feedback:null};
try{
 const saved=JSON.parse(localStorage.getItem(key)||'null');
 if(saved&&Number.isInteger(saved.seed)&&saved.seed>=0&&saved.seed<=4294967295){
  const candidate=core.make(saved.seed),s=saved.state;
  if(s&&Array.isArray(s.answers)&&s.answers.length<=candidate.steps.length&&s.answers.every((a,i)=>typeof a==='string'&&a.length<=30&&D.check(a,candidate.steps[i]))&&typeof s.answer==='string'&&s.answer.length<=30){
   seed=saved.seed;source=candidate;state={answers:s.answers,answer:s.answer,help:s.help===true,feedback:null};
  }
 }
}catch(_){}
function save(){try{localStorage.setItem(key,JSON.stringify({seed,state}));}catch(_){}}
function render(focus){
 const i=state.answers.length,q=source.steps[i],done=!q;
 $('estimate-count').textContent=done?'Пример завершён':'Шаг '+(i+1)+' из '+source.steps.length;
 $('estimate-task').textContent=source.task.prompt;
 const trail=$('estimate-trail');trail.replaceChildren();
 source.steps.slice(0,i).forEach((step,n)=>{const p=document.createElement('p');p.textContent='✓ '+step.record;if(n===i-1)p.className='latest';trail.append(p);});
 $('estimate-form').hidden=done;$('estimate-hint').hidden=done;
 $('estimate-new').textContent=done?'Следующий пример →':'Другой пример';
 const f=$('estimate-feedback');f.hidden=!state.feedback&&!done;f.className=state.feedback?.kind||'correct';
 f.textContent=done?(state.help?'Получилось с подсказкой. Попробуй следующий пример сам.':'Цифра найдена самостоятельно.'):(state.feedback?.text||'');
 if(q){$('estimate-prompt').textContent=q.prompt;$('estimate-answer').value=state.answer;$('estimate-answer').placeholder=q.kind==='digit'?'Одна цифра':'Твой ответ';if(focus)$('estimate-answer').focus({preventScroll:true});}
}
$('practice').onclick=()=>{$('view-practice').hidden=false;$('practice').hidden=true;render(true);};
$('estimate-answer').oninput=e=>{state.answer=e.target.value;save();};
$('estimate-form').onsubmit=e=>{
 e.preventDefault();const q=source.steps[state.answers.length];if(!q||!state.answer.trim())return;
 if(D.check(state.answer,q)){state.answers.push(state.answer);state.answer='';state.feedback=null;}
 else state.feedback={kind:'incorrect',text:q.error||q.hint};
 save();render(true);
};
$('estimate-hint').onclick=()=>{const q=source.steps[state.answers.length];if(!q)return;state.help=true;state.feedback={kind:'hint',text:q.hint};save();render();};
$('estimate-new').onclick=()=>{seed=(seed+1)>>>0;source=core.make(seed);state={answers:[],answer:'',help:false,feedback:null};save();render(true);};
render();
})();
