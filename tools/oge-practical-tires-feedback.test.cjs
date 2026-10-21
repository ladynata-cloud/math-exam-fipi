'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),html=path.join(root,'trainers/oge-1-5-trainers/practice-1-5-tires.html'),order=[0,2,1,3,4,5,6],taskIds=[2,3,4,5,6];
const helpLabels={2:'Как выбрать шину по таблице?',3:'Как найти высоту боковины?',4:'Как найти диаметр колеса?',5:'Как сравнить размеры колёс?',6:'Как связаны оборот колеса и пробег?'};
const adapters=new Set(['practical-discovery.js','practical-minimal.js','tire-learning-flow.js','tire-variant-layout.js']);
class Local extends ResourceLoader{constructor(native=false){super();this.native=native;}fetch(url){const u=new URL(url);if(u.origin!=='https://mathexam.space'||this.native&&adapters.has(path.basename(u.pathname)))return null;const f=path.join(root,u.pathname);return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
const tick=()=>new Promise(r=>setTimeout(r,20));
async function open({native=false}={}){const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>{if(!/scrollTo|navigation|HTMLCanvasElement.prototype.getContext/.test(e.message))errors.push(e.message);});const dom=new JSDOM(fs.readFileSync(html,'utf8'),{url:'https://mathexam.space/trainers/oge-1-5-trainers/practice-1-5-tires.html',resources:new Local(native),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=()=>1;}});await new Promise(r=>dom.window.addEventListener('load',r));await tick();return {dom,w:dom.window,doc:dom.window.document,errors};}
const storage=w=>JSON.stringify(Object.keys(w.localStorage).sort().map(k=>[k,w.localStorage.getItem(k)]));
const current=(doc,id)=>{assert.equal(doc.querySelector('.step-section.active').id,'section-'+id);assert.equal(doc.querySelector('#step-stepper .step-btn.active').dataset.step,String(id));assert.equal(doc.querySelector('#step-stepper [aria-current="step"]').dataset.step,String(id));};
const copy=s=>s.replace(/\s+/g,' ').trim();
const questions=doc=>taskIds.map(id=>copy(doc.querySelector('#section-'+id+' .card-intro').textContent));
const keys=w=>JSON.parse(w.eval('JSON.stringify(Object.fromEntries(Object.entries(CHECKS).map(([id,c])=>[id,{correct:c.correct,tol:c.tol,stepIdx:c.stepIdx,isFinal:c.isFinal}])))'));
function visible(node,w){assert.ok(node,'required node exists');for(let p=node;p;p=p.parentElement){assert.equal(p.hidden,false,p.id+' is not hidden');assert.notEqual(w.getComputedStyle(p).display,'none',p.id+' is displayed');if(p.tagName==='DETAILS')assert.equal(p.open,true,'no closed disclosure hides the required node');}}

// The baseline runs only the unmodified native inline engine. It does not read
// a copy of the new layout's question text or share its presentation adapters.
test('all 21 variants show the native five questions and exact givens together without changing answer keys',async()=>{
 const [c,native]=await Promise.all([open(),open({native:true})]),{w,doc}=c;try{
  assert.equal(doc.documentElement.dataset.tireVariantLayout,'ready');assert.equal(doc.querySelectorAll('#variant-select option').length,21);
  for(let variant=0;variant<21;variant++){
   native.w.loadVariant(variant);w.loadVariant(variant);await tick();
   assert.deepEqual(questions(doc),questions(native.doc),'exact original task conditions for variant '+variant);
   assert.deepEqual(keys(w),keys(native.w),'native answer/check definitions remain unchanged');
   assert.deepEqual([...doc.querySelectorAll('.step-section')].map(s=>s.id),[0,1,2,3,4,5,6].map(id=>'section-'+id),'native positional step identity preserved');
   const stream=doc.querySelector('#tvl-task-stream'),pane=doc.querySelector('#tvl-tables-pane');assert.ok(stream&&pane);
   for(const id of taskIds){const section=doc.querySelector('#section-'+id);assert.equal(section.closest('#tvl-task-stream'),stream);visible(section.querySelector('.card-intro'),w);visible(section.querySelector('[data-pd-main="1"] input'),w);const toggle=section.querySelector('.pd-toggle');visible(toggle,w);assert.equal(toggle.textContent,helpLabels[id]);}
   const expected=w.eval('VD.v.t1.compat'),table=doc.querySelector('#tvl-tables-pane .compat-table');visible(table,w);assert.equal(table.closest('.pd-panel,details'),null,'essential table is outside optional help');assert.equal(table.querySelectorAll('.win,.col-hl').length,0);
   assert.deepEqual([...table.querySelectorAll('thead th')].slice(1).map(n=>n.textContent),Array.from(expected.disks,d=>d+'″'));
   assert.deepEqual([...table.querySelectorAll('tbody tr')].map(tr=>[...tr.cells].map(n=>n.textContent)),Array.from(expected.rows,r=>[String(r.w),...Array.from(expected.disks,d=>String(r.cells[d]||'—'))]));
   const master=doc.querySelector('#master-table');assert.equal(master.closest('#tvl-tables-pane'),pane);visible(master,w);assert.equal(doc.querySelectorAll('#master-table').length,1);assert.equal(doc.querySelectorAll('.tlf-shared-calculations').length,0,'one editable table replaces read-only copies');
   assert.deepEqual([...master.querySelectorAll('.calc-cell')].map(e=>[e.dataset.tire,e.dataset.cell]),[...native.doc.querySelectorAll('#master-table .calc-cell')].map(e=>[e.dataset.tire,e.dataset.cell]));
   const model=doc.querySelector('#tvl-main-model .t3d-root');visible(model,w);assert.equal(model.closest('.pd-panel,details'),null,'the model is available before any help click');const factory=doc.querySelector('#vb-factory').textContent.match(/(\d+)\/(\d+)\s*R(\d+)/);assert.ok(factory);
   for(const [index,key]of [[1,'width'],[2,'profile'],[3,'disk']])assert.equal(+model.querySelector('[data-pd-key='+key+']').value,+factory[index],'exact factory marking initializes '+key);
   assert.equal(doc.querySelectorAll('#tvl-main-model .t3d-root').length,1);assert.equal(copy(model.querySelector('.t3d-marking').textContent),copy(doc.querySelector('#vb-factory').textContent));assert.equal(+model.querySelector('[data-tire-dimension=width]').dataset.worldValue,+factory[1]);const commonGiven=[...doc.querySelectorAll('.tvl-common-given,.tvl-marking-given')];assert.equal(commonGiven.length,2);commonGiven.forEach(n=>visible(n,w));const commonText=copy(commonGiven.map(n=>n.textContent).join(' '));assert.ok(commonText.includes(doc.querySelector('#vb-factory').textContent));for(const phrase of [/ширина шины в миллиметрах/,/высота боковины в процентах от ширины/,/диаметр диска в дюймах/,/R означает радиальную конструкцию/,/1 дюйм\s*=\s*25,4 мм/])assert.match(commonText,phrase,'common givens are available before optional marking help');
   assert.deepEqual([...doc.querySelectorAll('#step-stepper .step-btn')].map(b=>+b.dataset.step),order);for(const id of order){w.goToStep(id);current(doc,id);}taskIds.forEach(n=>visible(doc.querySelector('#section-'+n+' .card-intro'),w));
   w.markStepDone(2);w.refreshStepperDone();assert.deepEqual([...doc.querySelectorAll('#step-stepper .step-btn.done')].map(b=>+b.dataset.step),[2],'completion keeps native task identity');
  }
  assert.deepEqual(c.errors,[]);assert.deepEqual(native.errors,[]);
 }finally{w.close();native.w.close();}
});

test('the original editable table, accepted cells and five answer drafts stay mounted while using contextual help',async()=>{
 const c=await open(),{w,doc}=c;try{
  const master=doc.querySelector('#master-table'),input=master.querySelector('.calc-cell:not(:disabled)'),cellSelector='[data-tire="'+input.dataset.tire+'"][data-cell="'+input.dataset.cell+'"]';
  const answers=taskIds.map(id=>doc.querySelector('#section-'+id+' [data-pd-main="1"] input'));answers.forEach((answer,i)=>{answer.value='17,'+i;answer.dispatchEvent(new w.Event('input',{bubbles:true}));});
  input.value='123,45';input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('blur'));await tick();assert.ok(input.classList.contains('wrong'));assert.equal(input.disabled,false);
  const model=doc.querySelector('#tvl-main-model .t3d-root'),modelControl=model.querySelector('[data-pd-key=width]'),chosenWidth=String(+modelControl.min+1);modelControl.value=chosenWidth;modelControl.dispatchEvent(new w.Event('input',{bubbles:true}));
  const assertPersistent=()=>{assert.equal(doc.querySelector('#master-table'),master);assert.equal(master.querySelector(cellSelector),input);assert.equal(doc.querySelector('#tvl-main-model .t3d-root'),model);assert.equal(modelControl.value,chosenWidth);answers.forEach((answer,i)=>{assert.equal(doc.querySelector('#section-'+taskIds[i]+' [data-pd-main="1"] input'),answer);assert.equal(answer.value,'17,'+i);});visible(master,w);};
  for(const id of taskIds){w.goToStep(id);current(doc,id);assertPersistent();assert.equal(input.value,'123,45');const toggle=doc.querySelector('#section-'+id+' .pd-toggle'),panel=doc.getElementById(toggle.getAttribute('aria-controls')),before=storage(w);toggle.click();await tick();assert.equal(toggle.textContent,'Убрать подсказку');assert.equal(panel.hidden,false);assertPersistent();panel.querySelector('.pd-return').click();await tick();assert.equal(toggle.textContent,helpLabels[id]);assert.equal(panel.hidden,true);assert.equal(storage(w),before,'help never awards progress');}
  const correct=w.eval('cellSpec(VD.byId['+JSON.stringify(input.dataset.tire)+'],'+JSON.stringify(input.dataset.cell)+').correct');input.value=String(correct);input.dispatchEvent(new w.Event('blur'));await tick();assert.ok(input.classList.contains('correct'));assert.equal(input.disabled,true);
  for(const id of [6,2,5,3,4]){w.goToStep(id);assertPersistent();assert.equal(input.value,String(correct));assert.equal(input.disabled,true);}
  const section=doc.querySelector('#section-3'),toggle=section.querySelector('.pd-toggle');toggle.click();const panel=doc.getElementById(toggle.getAttribute('aria-controls')),lab=panel.querySelector('details');lab.open=true;
  for(const key of ['width','side','disk']){const check=panel.querySelector('[data-tire-part='+key+']');if(!check.checked)check.click();}const selected=panel.querySelector('[data-pd-key=part]').value;const before=storage(w);toggle.click();toggle.click();assert.equal(panel.querySelector('[data-pd-key=part]').value,selected);assert.equal(panel.querySelectorAll('[data-tire-part]:checked').length,3);assert.equal(storage(w),before);assertPersistent();
  w.goToStep(1);const native=doc.querySelector('#w-read .substep-hint-btn');native.click();assert.equal(native.textContent,'Убрать подсказку');native.click();assert.equal(native.textContent,'Хочешь подсказку?');assert.equal(native.parentElement.querySelector('.substep-hint').hidden,true);
  assert.deepEqual(c.errors,[]);
 }finally{w.close();}
});

test('rolling-wheel captions remain readable outside the motion paths and follow variant/reset redraws',async()=>{
 const c=await open(),{w,doc}=c;try{
  const check=()=>{
   const svg=doc.querySelector('#anim-svg'),source=[...svg.querySelectorAll('text.anim-lab')];
   const rows=[...doc.querySelectorAll('.tlf-rolling-caption')];assert.equal(rows.length,2);
   assert.deepEqual(rows.map(row=>[row.querySelector('.tlf-rolling-caption-name').textContent,row.querySelector('.tlf-rolling-caption-circumference').textContent]),[[source[1].textContent,source[2].textContent],[source[3].textContent,source[4].textContent]]);
   assert.deepEqual(rows.map(row=>row.dataset.wheel),['upper','lower']);assert.deepEqual(rows.map(row=>row.querySelector('strong').textContent),['Верхнее колесо','Нижнее колесо']);
   assert.equal(svg.querySelectorAll('[data-tlf-rolling-caption]').length,4);assert.equal(source[0].textContent,'старт');assert.equal(source[0].getAttribute('y'),'24');assert.equal(source[0].hasAttribute('data-tlf-rolling-caption'),false);assert.equal(source[0].hasAttribute('aria-hidden'),false);
   assert.ok(doc.querySelector('.tlf-rolling-captions').compareDocumentPosition(svg)&w.Node.DOCUMENT_POSITION_FOLLOWING);
   assert.equal(w.getComputedStyle(source[1]).display,'none');assert.notEqual(w.getComputedStyle(source[0]).display,'none');
   return rows.map(row=>row.textContent).join('|');
  };
  w.goToStep(6);await tick();const first=check();w.resetAnim();await tick();assert.equal(check(),first,'reset preserves exact captions without duplicate legends');
  w.loadVariant(20);await tick();w.goToStep(6);await tick();assert.notEqual(check(),first,'author variant displays its own current dimensions');w.resetAnim();await tick();check();assert.deepEqual(c.errors,[]);
 }finally{w.close();}
});
