'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),base=path.join(root,'trainers/oge-basics');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function sources(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?sources(path.join(dir,x.name)):[path.join(dir,x.name)]);}
const pages=sources(base).filter(p=>p.endsWith('.html')&&p!==path.join(base,'multiplication-division/long-division-from-simple-to-decimals.html')).filter(p=>/const SPEC =|function computeSteps|const SKILLS=/.test(fs.readFileSync(p,'utf8')));
async function mount(t,file){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const html=fs.readFileSync(path.join(base,file),'utf8');
 const dom=new JSDOM(html,{url:'https://mathexam.space/trainers/oge-basics/'+file,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>false;
 let seed=826313;w.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
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
 assert.strictEqual(originalInput(f),inp);assert.equal(inp.value,'123');
 assert.equal(f.d.getElementById('quotientDisplay').textContent,quotient);
 f.d.querySelector('[data-route="learn"]').click();f.d.querySelector('[data-route="practice"]').click();
 assert.strictEqual(state.task,task);assert.equal(state.phase,'product');assert.equal(inp.value,'123');
 inp.value=String(task.steps[0].prod);f.d.querySelector('#answerArea button').click();await tick();
 assert.equal(state.phase,'remainder');assert.equal(state.quotient,String(digit));
 assert.equal(f.d.querySelector('.basics-help-host button').getAttribute('aria-expanded'),'false');
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
