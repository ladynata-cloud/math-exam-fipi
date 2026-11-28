'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),base=path.join(root,'trainers/oge-basics');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function sources(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?sources(path.join(dir,x.name)):[path.join(dir,x.name)]);}
const pages=sources(base).filter(p=>p.endsWith('.html')&&p!==path.join(base,'multiplication-division/long-division-from-simple-to-decimals.html')).filter(p=>/const SPEC =|function computeSteps|const SKILLS=/.test(fs.readFileSync(p,'utf8')));
async function mount(t,file,{search='',storage={}}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const html=fs.readFileSync(path.join(base,file),'utf8');
 const dom=new JSDOM(html,{url:'https://mathexam.space/trainers/oge-basics/'+file+search,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>false;
 let seed=826313;w.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 for(const [key,value] of Object.entries(storage))w.localStorage.setItem(key,value);
 w.eval(fs.readFileSync(path.join(base,'learning-loader.js'),'utf8').split('/* Remediation loader:')[0]);
 for(const script of [...d.scripts])if(!script.src&&script.textContent.trim())w.eval(script.textContent);
 // Percentage source registers its original boot handler; call it exactly once.
 if(d.getElementById('p-q'))d.dispatchEvent(new w.Event('DOMContentLoaded'));
 w.eval(fs.readFileSync(path.join(base,'basics-help.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(base,'basics-standalone.js'),'utf8'));
 await tick();
 t.after(()=>{assert.deepEqual(errors,[]);w.close();});
 return {w,d,errors,dom};
}
function originalInput(f){return f.d.querySelector('#practiceAnswer input,#answerArea input,#p-q input');}
function helpButton(f){return f.d.querySelector('.basics-help-host button');}

test('all 34 unchanged source pages start a task once and retain native secondary controls',async t=>{
 assert.equal(pages.length,34);
 for(const p of pages){
  const file=path.relative(base,p),f=await mount(t,file);
  assert(f.d.body.classList.contains('basics-task-first'),file);
  assert.equal(f.d.getElementById('view-practice').hidden,false,file);
  assert.equal(f.d.getElementById('view-home').hidden,true,file);
  assert(helpButton(f),file);assert.match(helpButton(f).textContent,/Нужна помощь/);
  assert.equal(f.d.querySelector('.bs-options').open,false,file);
  assert(f.d.querySelector('[data-route="check"],[data-nav="check"]'),file);
  assert(f.d.querySelector('#practicePrompt,#taskTitle,#p-q')?.textContent.trim(),file);
  const condition=f.d.querySelector('#practicePrompt,#taskTitle,#p-q').textContent;
  assert.equal(f.w.MathExamBasicsStandalone.init(),false,'second init must not make a new task');
  assert.equal(f.d.querySelector('#practicePrompt,#taskTitle,#p-q').textContent,condition);
 }
});

test('mini-checkpoints contain each required action and use different questions',async t=>{
 const targets = {
  'units-area.html': ['m2cm2','cm2m2','area'],
  'units-length-time.html': ['mcm','cmm','kmm','time'],
  'rounding.html': ['int','dec','ceil'],
  'decimal-add-subtract.html': ['add','sub'],
  'negative-add-subtract.html': ['0','1','2','3'],
  'negative-number-line.html': ['compare','opposite','abs','move'],
  'order-of-operations.html': ['Умножение раньше','Скобки','Деление раньше','Слева направо','Полный порядок'],
  'multiplication-division.html': ['mul','div','missing'],
  'multiplication-division/division-with-remainder.html': ['q','r','check'],
  'multiplication-division/multiplication-meaning.html': ['groups','meaning','rows','swap'],
  'multiplication-division/multiplication-mixed.html': ['mul','div','missing','missingDivisor','check'],
  'multiplication-division/tabular-division.html': ['division','divisor','factor'],
  'multiplication-division/multiplication-pythagoras-table.html': ['grid'],
  'multiplication-division/column-multiplication-one-digit.html': ['column1'],
  'multiplication-division/column-multiplication-two-digit.html': ['column2'],
 };
 for(const [file,required] of Object.entries(targets)){
  const f=await mount(t,file);
  for(let repetition=0;repetition<300;repetition++){
   const tasks=f.w.__trainerDebug.makeCheckSet();
   assert.equal(tasks.length,5,file);
   const identities=new Set(tasks.map(task=>task.prompt+'|'+(task.options?.map(option=>option.html).join('|')||'')));
   assert.equal(identities.size,5,file);
   const key=file==='order-of-operations.html'?'label':'skill';
   assert(required.every(skill=>tasks.some(task=>task[key]===skill)),file);
  }
  if(file==='order-of-operations.html'){
   assert.equal(f.d.getElementById('practiceBadge').textContent,'порядок действий');
  }
 }
});

test('zero checkpoint stays distinct from accumulated practice and the previous best',async t=>{
 const key='mathExamBasics.units-area.v1';
 const f=await mount(t,'units-area.html',{storage:{[key]:JSON.stringify({independent:3,best:4})}});
 const $=id=>f.d.getElementById(id);
 assert.equal($('homePct').textContent,'—');
 assert.equal($('statBest').textContent,'4/5');
 f.d.querySelector('[data-route="check"]').click();
 for(let i=0;i<5;i++){
  $('checkAnswer').querySelector('input').value='99999999';
  $('checkNext').click();
 }
 assert.equal($('resultScore').textContent,'0/5');
 $('view-check').querySelector('[data-route="home"]').click();
 assert.equal($('homePct').textContent,'0/5');
 assert.equal($('statIndependent').textContent,'3');
 assert.equal($('statBest').textContent,'4/5');
 assert.match($('homeRec').textContent,/Повторите действия/);
 const state=f.w.localStorage.getItem(key);
 assert.equal(JSON.parse(state).lastCheck,0);
 const restored=await mount(t,'units-area.html',{storage:{[key]:state}});
 assert.equal(restored.d.getElementById('homePct').textContent,'0/5');

 const catalog=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{
  url:'https://mathexam.space/trainers/oge-basics/',runScripts:'outside-only'
 });
 t.after(()=>catalog.window.close());
 const w=catalog.window;
 w.localStorage.setItem('mathExamCourseProgress.v1',f.w.localStorage.getItem('mathExamCourseProgress.v1'));
 for(const script of w.document.scripts)if(!script.src&&script.textContent.trim())w.eval(script.textContent);
 assert.equal(w.document.querySelector('[data-topic="ogeBasicsUnitsArea"] .topic-progress').textContent,'Последний · 0/5');
 assert.equal(w.document.querySelector('[data-topic="ogeBasicsDecimals"] .topic-progress').textContent,'Зачёт · —');
});

test('the package recommendation drills exact and inexact division without switching topics',async t=>{
 const f=await mount(t,'rounding.html',{search:'?practice=packages'});
 const observed=new Set();
 for(let i=0;i<40;i++){
  const task=f.w.__trainerDebug.state().current;
  const parts=task.prompt.match(/(\d+) л<\/strong> краски\. В одной упаковке (\d+) л/);
  assert(parts);
  const liters=Number(parts[1]), capacity=Number(parts[2]);
  assert.equal(task.answer,Math.ceil(liters/capacity));
  observed.add(liters%capacity===0);
  f.d.getElementById('nextTask').click();
 }
 assert.equal(observed.size,2);
});

test('basic decimal draft survives help, reopening, lessons, and returning to the same problem',async t=>{
 const f=await mount(t,'decimal-add-subtract.html'),state=f.w.__trainerDebug.state();
 const task=state.current,inp=originalInput(f);inp.value='12,05';
 const before=f.d.getElementById('practicePrompt').innerHTML;
 helpButton(f).click();await tick();assert(state.help>0);
 assert.strictEqual(originalInput(f),inp);assert.equal(inp.value,'12,05');
 helpButton(f).click();helpButton(f).click();await tick();
 assert.strictEqual(originalInput(f),inp);assert.equal(inp.value,'12,05');
 f.d.querySelector('[data-route="learn"]').click();
 f.d.querySelector('[data-route="practice"]').click();await tick();
 assert.strictEqual(state.current,task);assert.strictEqual(originalInput(f),inp);
 assert.equal(inp.value,'12,05');assert.equal(f.d.getElementById('practicePrompt').innerHTML,before);
 inp.value=String(task.answer);f.d.getElementById('checkTask').click();
 assert.equal(state.independent,0);assert.equal(state.supported,1,'hiding a hint must not restore independent credit');
});

test('selected basic choice and native solution semantics survive help movement',async t=>{
 const f=await mount(t,'fraction-meaning.html');
 let state=f.w.__trainerDebug.state(),guard=0;
 while(!f.d.querySelector('#practiceAnswer .choice')&&guard++<30)f.d.getElementById('nextTask').click();
 const choice=f.d.querySelector('#practiceAnswer .choice');assert(choice);choice.click();
 helpButton(f).click();await tick();assert(choice.classList.contains('selected'));
 helpButton(f).click();helpButton(f).click();assert(choice.classList.contains('selected'));
 f.d.getElementById('solutionBtn').click();await tick();
 assert.equal(state.reviewed,1);assert.equal(f.d.getElementById('checkTask').hidden,true);
 assert.equal(f.d.getElementById('nextTask').hidden,false);
});

test('nested prerequisites keep each help draft and the original decimal answer',async t=>{
 const f=await mount(t,'decimal-add-subtract.html'),state=f.w.__trainerDebug.state();
 const task=state.current,inp=originalInput(f);inp.value='12,05';
 helpButton(f).click();await tick();
 function enter(skill){
  const current=[...f.d.querySelectorAll('.bh-frame')].find(frame=>!frame.hidden);
  const button=current.querySelector('.bh-deeper[data-bh-skill="'+skill+'"]');assert(button,skill);button.click();
 }
 enter('decimal-add');
 const addDraft=f.d.querySelector('[data-bh-node="decimal-add"] .bh-answer');addDraft.value='0,4';
 enter('decimal');
 const decimalDraft=f.d.querySelector('[data-bh-node="decimal"] .bh-answer');decimalDraft.value='0,2';
 enter('fraction-parts');
 assert.equal(f.d.querySelector('.bh-panel').dataset.bhDepth,'3');
 helpButton(f).click();helpButton(f).click();await tick();
 assert.equal(f.d.querySelector('.bh-panel').dataset.bhDepth,'3');
 f.d.querySelector('.bh-back').click();
 assert.strictEqual(f.d.querySelector('[data-bh-node="decimal"] .bh-answer'),decimalDraft);assert.equal(decimalDraft.value,'0,2');
 f.d.querySelector('.bh-back').click();
 assert.strictEqual(f.d.querySelector('[data-bh-node="decimal-add"] .bh-answer'),addDraft);assert.equal(addDraft.value,'0,4');
 f.d.querySelector('.bh-root').click();
 assert.strictEqual(originalInput(f),inp);assert.equal(inp.value,'12,05');assert.strictEqual(state.current,task);
 assert.equal(state.independent,0);assert.equal(state.supported,0,'small help exercises cannot finish the parent task');
});

test('legacy division retains accepted digit, live input and work when assistance is explored',async t=>{
 const f=await mount(t,'multiplication-division/long-division-two-digit.html'),state=f.w.__trainerDebug.state();
 const task=state.task,digit=task.steps[0].qd;
 f.d.querySelectorAll('#multiples .multiple')[digit].click();await tick();
 assert.equal(state.phase,'product');assert.equal(state.quotient,String(digit));
 const inp=originalInput(f);inp.value='123';const quotient=f.d.getElementById('quotientDisplay').textContent;
 helpButton(f).click();await tick();assert(state.help>0);assert.equal(state.clean,false);
 assert(f.d.querySelector('[data-bh-node="root"] .bh-deeper[data-bh-skill="multiply"]'),'product step must offer multiplication help');
 assert.strictEqual(originalInput(f),inp);assert.equal(inp.value,'123');
 assert.equal(f.d.getElementById('quotientDisplay').textContent,quotient);
 f.d.querySelector('[data-route="learn"]').click();f.d.querySelector('[data-route="practice"]').click();
 assert.strictEqual(state.task,task);assert.equal(state.phase,'product');assert.equal(inp.value,'123');
 inp.value=String(task.steps[0].prod);f.d.querySelector('#answerArea button').click();await tick();
 assert.equal(state.phase,'remainder');assert.equal(state.quotient,String(digit));
 assert.equal(f.d.querySelector('.basics-help-host button').getAttribute('aria-expanded'),'false');
 helpButton(f).click();await tick();
 assert(f.d.querySelector('[data-bh-node="root"] .bh-deeper[data-bh-skill="subtract"]'),'remainder step must offer subtraction help');
});

test('percentage hint feedback does not replace live answers or hide checker feedback',async t=>{
 const f=await mount(t,'percentages/percent-meaning.html');
 // Select a numerical skill through the existing selector, if needed.
 let inp=originalInput(f);
 if(!inp){for(const button of f.d.querySelectorAll('#chips button')){button.click();if((inp=originalInput(f)))break;}}
 assert(inp);await tick();inp.value='17,5';const question=f.d.getElementById('p-q').textContent;
 helpButton(f).click();await tick();
 assert.strictEqual(originalInput(f),inp);assert.equal(inp.value,'17,5');
 assert.equal(f.d.getElementById('p-fb').hidden,true);assert.match(f.d.querySelector('.bs-hint-output').textContent,/Подсказка/);
 f.d.querySelector('[data-nav="learn"]').click();f.d.querySelector('[data-nav="practice"]').click();await tick();
 assert.strictEqual(originalInput(f),inp);assert.equal(f.d.getElementById('p-q').textContent,question);
 inp.value='99999999';inp.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await tick();
 assert.equal(f.d.getElementById('p-fb').hidden,false);assert(f.d.getElementById('p-fb').classList.contains('bad'));
 f.d.getElementById('p-sol').click();await tick();assert.equal(f.d.getElementById('s-rev').textContent,'1');
 assert.equal(f.d.getElementById('p-fb').hidden,true);assert.match(f.d.querySelector('.bs-hint-output').textContent,/Разбор/);
 f.d.getElementById('p-next').click();await tick();
 assert.equal(f.d.querySelector('.bs-hint-output').textContent,'');assert.equal(f.d.querySelector('.basics-help-host button').getAttribute('aria-expanded'),'false');
});

test('check mode still has no helper and opening it does not start a percentage exam',async t=>{
 for(const file of ['decimal-add-subtract.html','multiplication-division/long-division-two-digit.html','percentages/percent-final-checkpoint.html']){
  const f=await mount(t,file);
  f.d.querySelector('[data-route="check"],[data-nav="check"]').click();await tick();
  assert.equal(f.d.getElementById('view-practice').hidden,true);
  assert.equal(f.d.querySelector('#view-check .basics-help-host'),null);
  if(file.includes('percentages/')){assert.equal(f.d.getElementById('check-run').hidden,true);assert.equal(f.d.getElementById('check-intro').hidden,false);}
 }
});

test('the public quotient ruler fits whole divisors and records division with remainder',async t=>{
 const f=await mount(t,'multiplication-division/long-division-quotient-digit.html');
 const {d,w}=f, get=id=>d.getElementById(id), state=w.__trainerDebug.state();
 const ticks=()=>[...get('multiples').querySelectorAll('button')];
 const enter=value=>{
  get('answerArea').querySelector('input').value=String(value);
  get('answerArea').querySelector('button').click();
 };
 assert.equal(get('dividendDisplay').textContent,'88');
 assert.equal(get('partialValue').style.getPropertyValue('--position'),(88/150*100)+'%');
 assert.deepEqual(ticks().map(b=>Number(b.querySelector('b').textContent)),[0,15,30,45,60,75,90,105,120,135]);
 assert.equal(get('multiples').querySelector('.ruler-end b').textContent,'150');
 assert.equal(get('quotientDisplay').textContent,'?');
 ticks()[4].click();
 assert.match(get('feedback').textContent,/ещё 15/);
 ticks()[6].click();
 assert.match(get('feedback').textContent,/90 больше 88/);
 assert.equal(state.quotient,'');
 ticks()[5].click();
 assert.equal(get('quotientDisplay').textContent,'5');
 assert(get('writtenProduct').hidden);
 enter(75);
 assert.equal(get('writtenProduct').textContent,'− 75');
 assert(!get('writtenProduct').hidden);
 enter(13);
 assert.equal(get('writtenRemainder').textContent,'13');
 assert(!get('writtenRemainder').hidden);
 assert.match(get('feedback').textContent,/Цифра частного — 5, остаток — 13/);
 assert.equal(state.supported,1);

 // Use the normal new-example button with predictable random draws for boundary cases.
 for(const [digit,remainder] of [[1,0],[5,0],[9,0],[9,14]]){
  const draws=[13.5/38,(digit-.5)/9,(remainder+.5)/15];
  w.Math.random=()=>draws.shift();
  get('nextBtn').click();
  const partial=15*digit+remainder;
  assert.equal(get('partialValue').textContent,String(partial));
  assert.equal(get('partialValue').style.getPropertyValue('--position'),(partial/150*100)+'%');
  assert.equal(get('dividendDisplay').textContent,String(partial));
  ticks()[digit].click();enter(15*digit);enter(remainder);
  assert.equal(get('quotientDisplay').textContent,String(digit));
  assert.equal(get('writtenRemainder').textContent,String(remainder));
 }
 assert.equal(state.independent,4);
 w.Math.random=()=>0.4;
 get('nextBtn').click();
 get('solution').click();
 assert.equal(state.reviewed,1);
 assert.equal(state.phase,'done');
 assert(get('multiplesWrap').hidden);
 assert(get('feedback').querySelector('.solution'));
 assert(!get('writtenRemainder').hidden);
});
