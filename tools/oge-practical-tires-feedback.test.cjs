'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),html=path.join(root,'trainers/oge-1-5-trainers/practice-1-5-tires.html'),order=[0,2,1,3,4,5,6];
class Local extends ResourceLoader{fetch(url){const u=new URL(url);if(u.origin!=='https://mathexam.space')return null;const f=path.join(root,u.pathname);return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
const tick=()=>new Promise(r=>setTimeout(r,20));
async function open(){const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>{if(!/scrollTo|navigation|HTMLCanvasElement.prototype.getContext/.test(e.message))errors.push(e.message);});const dom=new JSDOM(fs.readFileSync(html,'utf8'),{url:'https://mathexam.space/trainers/oge-1-5-trainers/practice-1-5-tires.html',resources:new Local(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=()=>1;}});await new Promise(r=>dom.window.addEventListener('load',r));await tick();return {dom,w:dom.window,doc:dom.window.document,errors};}
const storage=w=>JSON.stringify(Object.keys(w.localStorage).sort().map(k=>[k,w.localStorage.getItem(k)]));
const current=(doc,id)=>{assert.equal(doc.querySelector('.step-section.active').id,'section-'+id);assert.equal(doc.querySelector('#step-stepper .step-btn.active').dataset.step,String(id));assert.equal(doc.querySelector('#step-stepper [aria-current="step"]').dataset.step,String(id));};

test('all 21 tire variants retain exact task1 givens and use stable step IDs in the new route',async()=>{
 const c=await open(),{w,doc}=c;try{
  assert.equal(doc.documentElement.dataset.tireLearningFlow,'ready');
  assert.equal(doc.querySelectorAll('#variant-select option').length,21);
  for(let variant=0;variant<21;variant++){
   w.loadVariant(variant);await tick();
   assert.deepEqual([...doc.querySelectorAll('#step-stepper .step-btn')].map(b=>+b.dataset.step),order);
   const expected=w.eval('VD.v.t1.compat'),table=doc.querySelector('#section-2 .compat-table'),given=table.closest('.tlf-compatibility-given');
   assert.ok(given);assert.equal(given.closest('.pd-panel,details'),null,'essential given is not in help');
   assert.equal(table.querySelectorAll('.win,.col-hl').length,0);
   assert.deepEqual([...table.querySelectorAll('thead th')].slice(1).map(n=>n.textContent),Array.from(expected.disks,d=>d+'″'));
   assert.deepEqual([...table.querySelectorAll('tbody tr')].map(tr=>[...tr.cells].map(n=>n.textContent)),Array.from(expected.rows,r=>[String(r.w),...Array.from(expected.disks,d=>String(r.cells[d]||'—'))]));
   assert.ok(given.compareDocumentPosition(doc.querySelector('#t1-final'))&w.Node.DOCUMENT_POSITION_FOLLOWING,'table precedes final answer');
   current(doc,0);for(const id of order.slice(1)){doc.querySelector('.step-section.active .nav-btn.next').click();current(doc,id);}
   for(const id of order.slice(0,-1).reverse()){doc.querySelector('.step-section.active .nav-btn:not(.next)').click();current(doc,id);}
   w.markStepDone(2);assert.equal(doc.querySelector('#step-stepper [data-step="2"]').classList.contains('done'),true);assert.equal(doc.querySelector('#step-stepper [data-step="1"]').classList.contains('done'),false);
   w.refreshStepperDone();assert.deepEqual([...doc.querySelectorAll('#step-stepper .step-btn.done')].map(b=>+b.dataset.step),[2]);
  }
  assert.deepEqual(c.errors,[]);
 }finally{w.close();}
});

test('learner calculation drafts, accepted entries and final answers survive navigation; hints award no credit',async()=>{
 const c=await open(),{w,doc}=c;try{
  const input=doc.querySelector('#master-table .calc-cell:not(:disabled)'),tire=input.dataset.tire,field=input.dataset.cell,answer=doc.querySelector('#t1-final input');
  answer.value='17,25';input.value='123,45';input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('blur'));await tick();
  assert.ok(input.classList.contains('wrong'));assert.equal(input.disabled,false);
  for(const id of [3,4,5,6]){w.goToStep(id);const table=doc.querySelector('#section-'+id+' .tlf-shared-calculations');assert.ok(table.textContent.includes('123,45'));assert.match(table.textContent,/исправь/);assert.equal(table.querySelector('[data-status="wrong"]').textContent.startsWith('123,45'),true);}
  w.goToStep(1);assert.equal(input.value,'123,45');assert.equal(answer.value,'17,25');
  const correct=w.eval('cellSpec(VD.byId['+JSON.stringify(tire)+'],'+JSON.stringify(field)+').correct');input.value=String(correct);input.dispatchEvent(new w.Event('blur'));await tick();assert.ok(input.classList.contains('correct'));assert.equal(input.disabled,true);
  w.goToStep(3);assert.ok(doc.querySelector('#section-3 .tlf-calculation-table [data-status="correct"]').textContent.includes(String(correct)));
  const answer2=doc.querySelector('#t2-H input');answer2.value='77,7';const before=storage(w),toggle=doc.querySelector('#section-3 .pd-toggle'),panel=doc.getElementById(toggle.getAttribute('aria-controls'));
  toggle.click();assert.equal(toggle.textContent,'Убрать подсказку');panel.querySelector('.pd-return').click();assert.equal(toggle.textContent,'Хочешь подсказку?');toggle.click();toggle.click();assert.equal(panel.hidden,true);assert.equal(answer2.value,'77,7');assert.equal(storage(w),before);
  w.goToStep(1);const native=doc.querySelector('#w-read .substep-hint-btn');native.click();assert.equal(native.textContent,'Убрать подсказку');native.click();assert.equal(native.textContent,'Хочешь подсказку?');assert.equal(native.parentElement.querySelector('.substep-hint').hidden,true);
  w.goToStep(2);assert.equal(answer.value,'17,25');assert.equal(input.value,String(correct));assert.deepEqual(c.errors,[]);
 }finally{w.close();}
});
