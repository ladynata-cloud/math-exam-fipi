'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../learning/vilenkin6-textbook-helper.js'),'utf8'),tick=()=>new Promise(r=>setImmediate(r));
async function settle(){for(let n=0;n<5;n++)await tick();}const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function response(s,mode='hint',lines=['Сначала приведи дроби к общему знаменателю: [[1/2]].']){return {...s,mode,prompt:'Сложи дроби.',lines};}
function fixture(t){const dom=new JSDOM('<!doctype html><main><div id="host"></div></main>',{runScripts:'outside-only',url:'https://fixture.example/learning/'}),w=dom.window,host=w.document.getElementById('host');w.eval(source);
 const state={active:true,allowed:true,calls:[],snapshot:{id:'owned-attempt',contentId:'source-task',sourceRevision:'a'.repeat(64),step:0,workMode:'independent',completed:false,title:'Тренажёр к задаче 1'},ask:null};
 const dispose=w.VilenkinTextbookHelper.mount(host,{isCurrent:()=>state.active,canAsk:()=>state.allowed,snapshot:()=>state.snapshot,ask:async(mode,before)=>{state.calls.push({mode,before});return state.ask?state.ask(mode,before):response(before,mode);}});
 t.after(()=>{dispose();w.close();});return{state,host,w,dispose,open(){host.querySelector('[data-source-help-launcher]').click();},button(mode){return host.querySelector('[data-source-help="'+mode+'"]');},get answers(){return host.querySelectorAll('[data-source-help-answer]');},async ask(mode='hint'){this.button(mode).click();await settle();}};}
test('closed source helper starts without requests and describes first step accurately',async t=>{const f=fixture(t);assert(f.host.querySelector('[role=dialog]').hidden);assert.equal(f.state.calls.length,0);f.open();assert.equal(f.state.calls.length,0);assert.match(f.button('step').textContent,/первый шаг/);await f.ask('step');assert.match(f.answers[0].textContent,/С чего начать: первый шаг/);f.dispose.close();assert(f.host.querySelector('[role=dialog]').hidden);assert.equal(f.w.document.activeElement,f.host.querySelector('[data-source-help-launcher]'));});
test('no hint is rendered before the saved ACK; busy prevents another request',async t=>{const f=fixture(t),ack=deferred();f.state.ask=()=>ack.promise;f.open();await f.ask();assert.equal(f.answers.length,0);assert(f.button('hint').disabled);f.button('solution').click();assert.equal(f.state.calls.length,1);ack.resolve(response(f.state.snapshot));await settle();assert.equal(f.answers.length,1);assert.match(f.host.textContent,/Помощь сохранена/);assert.equal(f.host.querySelectorAll('.fraction').length,1);assert.equal(f.host.querySelector('.fraction').getAttribute('aria-label'),'1 разделить на 2');});
test('late responses are discarded after close, route/account, step or source changes',async t=>{for(const change of ['close','account','step','source']){const f=fixture(t),ack=deferred();f.state.ask=()=>ack.promise;f.open();await f.ask();const before={...f.state.snapshot};if(change==='close')f.dispose.close();if(change==='account')f.state.active=false;if(change==='step'){f.state.snapshot={...before,step:1};f.dispose.refresh();}if(change==='source'){f.state.snapshot={...before,sourceRevision:'b'.repeat(64)};f.dispose.refresh();}ack.resolve(response(before));await settle();assert.equal(f.answers.length,0,change);}});
test('revoked control and saving failure reveal no content; a clean retry can succeed',async t=>{const f=fixture(t),ack=deferred();f.state.ask=()=>ack.promise;f.open();await f.ask();f.state.allowed=false;ack.resolve(response(f.state.snapshot));await settle();assert.equal(f.answers.length,0);assert(f.button('hint').disabled);f.state.allowed=true;f.state.ask=async()=>null;f.dispose.refresh();await f.ask();assert.equal(f.answers.length,0);assert.match(f.host.textContent,/Не удалось подтвердить/);f.state.ask=null;await f.ask();assert.equal(f.answers.length,1);});
test('completed work exposes only explicit post-answer solution review',async t=>{const f=fixture(t);f.state.snapshot={...f.state.snapshot,completed:true};f.dispose.refresh();f.open();assert(f.button('hint').hidden);assert(f.button('step').hidden);assert.match(f.button('solution').textContent,/после ответа/);await f.ask('solution');assert.match(f.host.textContent,/Отметка за выполненное задание сохранена/);});
test('untrusted strings remain text and oversized or mismatched responses fail closed',async t=>{const f=fixture(t);f.open();f.state.ask=async(mode,before)=>response(before,mode,['<img src=x onerror="alert(1)"> [[<script>/2]]']);await f.ask();assert.equal(f.answers.length,1);assert.equal(f.host.querySelectorAll('img,script').length,0);assert.match(f.answers[0].textContent,/<img/);for(const mutate of [r=>r.lines=['x'.repeat(2049)],r=>r.sourceRevision='b'.repeat(64),r=>r.step=1,r=>r.mode='solution']){f.state.ask=async(mode,before)=>{const r=response(before,mode);mutate(r);return r;};await f.ask();assert.equal(f.answers.length,0);}});
test('acknowledged condition stays beside the hint with safe mathematical fractions',async t=>{const f=fixture(t);f.state.ask=async(mode,before)=>({...response(before,mode),prompt:'Сократи [[12/18]]. <img src=x onerror=alert(1)>'});f.open();await f.ask();const condition=f.host.querySelector('[data-source-help-condition]');assert.match(condition.textContent,/Задание. Сократи 1218/);assert.equal(condition.querySelector('.fraction').getAttribute('aria-label'),'12 разделить на 18');assert.equal(condition.querySelectorAll('img,script').length,0);});
test('intro yields space to the answer and returns on another step',async t=>{const f=fixture(t);f.open();assert.equal(f.host.querySelector('[data-source-help-intro]').hidden,false);await f.ask();assert.equal(f.host.querySelector('[data-source-help-intro]').hidden,true);f.state.snapshot={...f.state.snapshot,step:1};f.dispose.refresh();assert.equal(f.host.querySelector('[data-source-help-intro]').hidden,false);assert.equal(f.answers.length,0);});
test('pending or rejected draft prevents every help mode without contacting a service',async t=>{const f=fixture(t);f.state.allowed=false;f.dispose.refresh();f.open();for(const mode of ['hint','step','solution']){assert(f.button(mode).disabled);await f.ask(mode);}assert.equal(f.state.calls.length,0);assert.equal(f.answers.length,0);});
test('restored access clears only the temporary blocked message and retains real error and success statuses',async t=>{
 const f=fixture(t),status=f.host.querySelector('[role=status]');f.state.allowed=false;f.dispose.refresh();f.open();assert.match(status.textContent,/после сохранения работы/);assert(f.button('hint').disabled);
 f.state.allowed=true;f.dispose.refresh();assert.equal(status.textContent,'');assert(!f.button('hint').disabled);
 f.state.ask=async()=>null;await f.ask();const error=status.textContent;assert.match(error,/Не удалось подтвердить помощь/);f.dispose.refresh();assert.equal(status.textContent,error);
 f.state.ask=null;await f.ask();const success=status.textContent;assert.match(success,/Помощь сохранена/);f.dispose.refresh();assert.equal(status.textContent,success);
});

function navigationFixture(t){
 const dom=new JSDOM('<!doctype html><div class="content-column"><main><button id="course-start">Начать</button></main><div id="host"></div></div>',{runScripts:'outside-only',url:'https://fixture.example/learning/'}),w=dom.window,host=w.document.getElementById('host');w.eval(source);
 const state={active:true,requests:0,actions:[]};
 w.fetch=()=>{state.requests++;throw Error('Navigation must not request mathematical help');};
 const dispose=w.VilenkinTextbookHelper.mountNavigation(host,{isCurrent:()=>state.active,
  showCourse:target=>{state.actions.push(target);w.document.getElementById('course-start').focus();},showHistory:()=>state.actions.push('history')});
 t.after(()=>{dispose();w.close();});
 return{w,host,state,dispose,launcher:()=>host.querySelector('[data-course-help-launcher]'),panel:()=>host.querySelector('[role=dialog]'),action:key=>host.querySelector('[data-course-help-action="'+key+'"]')};
}
test('course helper stays visible before choosing a task and only points to navigation',t=>{
 const f=navigationFixture(t);assert(!f.host.hidden);assert(f.host.classList.contains('cabinet-assistant-dock'));assert(f.w.document.body.classList.contains('vilenkin-helper-visible'));
 assert(f.panel().hidden);assert.equal(f.launcher().getAttribute('aria-expanded'),'false');assert.equal(f.launcher().querySelector('.vilenkin-helper-icon').getAttribute('aria-hidden'),'true');
 f.launcher().click();assert(!f.panel().hidden);assert.match(f.host.textContent,/Выбери тему и открой задание/);assert.equal(f.host.querySelectorAll('[data-source-help],input,textarea').length,0);
 for(const key of ['start','topics','history']){f.dispose.open();f.action(key).click();assert(f.panel().hidden);}
 assert.deepEqual(f.state.actions,['start','topics','history']);assert.equal(f.state.requests,0);
});
test('course helper Escape and close return focus; choosing a course control keeps its focus',t=>{
 const f=navigationFixture(t);f.launcher().click();assert.equal(f.w.document.activeElement,f.host.querySelector('[data-course-help-close]'));
 f.w.document.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(f.panel().hidden);assert.equal(f.w.document.activeElement,f.launcher());
 f.launcher().click();f.host.querySelector('[data-course-help-close]').click();assert(f.panel().hidden);assert.equal(f.w.document.activeElement,f.launcher());
 f.dispose.open();f.action('start').click();assert.equal(f.w.document.activeElement,f.w.document.getElementById('course-start'));assert.equal(f.state.requests,0);
});
test('course helper does not navigate after account/route changes or after disposal',t=>{
 const f=navigationFixture(t),action=f.action('topics'),launcher=f.launcher();f.dispose.open();f.state.active=false;action.click();assert.deepEqual(f.state.actions,[]);
 f.state.active=true;f.dispose();action.click();launcher.click();assert.deepEqual(f.state.actions,[]);assert(f.host.hidden);assert.equal(f.host.children.length,0);assert(!f.w.document.body.classList.contains('vilenkin-helper-visible'));assert.equal(f.state.requests,0);
});
test('replacing a task helper with course navigation leaves one dock and stale cleanup cannot erase it',t=>{
 const f=fixture(t),previousLauncher=f.host.querySelector('[data-source-help-launcher]');
 const navigation=f.w.VilenkinTextbookHelper.mountNavigation(f.host,{isCurrent:()=>true,showCourse:()=>{},showHistory:()=>{}});t.after(navigation);
 f.dispose();previousLauncher.click();assert.equal(f.host.querySelectorAll('.cabinet-assistant-launcher').length,1);assert(f.host.querySelector('[data-course-help-launcher]'));assert(!f.host.hidden);assert.equal(f.state.calls.length,0);
 navigation();assert(f.host.hidden);assert(!f.w.document.body.classList.contains('vilenkin-helper-visible'));
});
