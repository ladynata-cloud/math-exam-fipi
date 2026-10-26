'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const base=__dirname;
const src=f=>fs.readFileSync(path.join(base,f),'utf8');
function runtime(hash){const dom=new JSDOM(src('index.html'),{url:'https://mathexam.space/school/peterson5/'+hash,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};for(const f of ['math.js','models.js','data.js','app.js'])w.eval(src(f));return dom;}
const dom=runtime('#home'),w=dom.window,D=w.PetersonCourse,M=w.PetersonMath;
assert.equal(D.lessons.length,43);assert.equal(D.lessons.filter(l=>l.part===1).length,24);assert.equal(D.lessons.filter(l=>l.part===2).length,19);
assert.equal(M.skills.length,25);assert(!M.check('18/10','9/5',D.lessons[24].tasks[2].answerFormat));assert(!M.check('002,900200','2,9002',D.lessons[35].tasks[2].answerFormat));assert(M.check('2.9002','2,9002',D.lessons[35].tasks[2].answerFormat));const ids=new Set();let tasks=0,manual=0,steps=0;
for(const l of D.lessons){assert(l.theory.length>=2,l.id);assert(l.model,l.id);assert(l.skills.every(id=>M.skills.some(x=>x.id===id)),l.id);assert(l.tasks.length>=3,l.id);
 for(const [index,t] of l.tasks.entries()){
  assert(!ids.has(t.id));ids.add(t.id);tasks++;assert.equal(t.source.part,l.part);assert(t.source.verified,t.id);assert(t.source.page>=l.page,t.id);assert(t.steps.length>=2,t.id);assert(t.finalLabel,t.id);assert(['number','choice','manual'].includes(t.kind),t.id);
  if(t.kind==='choice'){assert(t.choices.includes(t.answer),t.id);assert.equal(t.choices.length,new Set(t.choices).size,t.id);}
  else if(t.kind==='number')assert(M.check(t.answer,t.answer,t.answerFormat),t.id+' expected answer form');
  const r=runtime('#lesson/'+l.id+'/'+index),doc=r.window.document;assert(!doc.body.textContent.includes('Не удалось открыть'),t.id);assert(doc.getElementById('problem').textContent.includes(t.prompt.split(' ')[0]),t.id);
  const help=doc.querySelector('[data-action="guided"]');help.click();
  for(let i=0;i<t.steps.length;i++){
   const q=t.steps[i];const input=doc.querySelector('[data-step-input="'+i+'"]');
   if(typeof q!=='string'&&q.answer!==undefined){assert(input,t.id+' step '+i);input.value=q.answer;input.dispatchEvent(new r.window.Event('input',{bubbles:true}));doc.querySelector('[data-step-form="'+i+'"]').dispatchEvent(new r.window.Event('submit',{bubbles:true,cancelable:true}));}
   else{const b=doc.querySelector('[data-action="continue-step"],[data-action="next-step"]');assert(b,t.id+' continue '+i);b.click();}
   steps++;
  }
  if(t.kind==='manual'){manual++;const note=doc.getElementById('notebook');note.value='Моё рассуждение записано в тетради.';note.dispatchEvent(new r.window.Event('input',{bubbles:true}));doc.querySelector('[data-action="reviewed"]').click();assert(!r.window.PetersonApp.getState().tasks[t.id].correct,t.id+' manual credit');}
  else {if(t.kind==='choice'){doc.querySelector('[data-choice="'+t.choices.indexOf(t.answer)+'"]').click();}else{const input=doc.getElementById('final-answer');input.value=t.answer;input.dispatchEvent(new r.window.Event('input',{bubbles:true}));}doc.getElementById('answer-form').dispatchEvent(new r.window.Event('submit',{bubbles:true,cancelable:true}));const result=r.window.PetersonApp.getState().tasks[t.id];assert(result.correct,t.id);assert(!result.independent,t.id+' hint provenance');}
  r.window.close();
 }
}
assert.equal(tasks,131);assert(manual>0);dom.window.close();console.log(JSON.stringify({ok:true,topics:43,tasks,manual,guidedSteps:steps,skills:25,gate:'PETERSON5_CONTENT_JOURNEYS_OK'}));
