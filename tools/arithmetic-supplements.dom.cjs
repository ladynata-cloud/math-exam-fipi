'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),extra=require('../soviet-math/arithmetic-practice.js');
function mount(t,file,query='',storage={},managedEnvelope){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://example.test/'+file+query,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
 let random=1729;w.Math.random=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
 const gradient={addColorStop(){}};const ctx=new Proxy({measureText:s=>({width:String(s).length*10}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});w.HTMLCanvasElement.prototype.getContext=()=>ctx;
 for(const [key,value] of Object.entries(storage))w.localStorage.setItem(key,value);
 let adapter;if(managedEnvelope)w.MathExamLearning={register:a=>{adapter=a;}};
 for(const script of [...w.document.scripts]){const src=script.getAttribute('src');if(src){if(/^https?:/.test(src)||managedEnvelope&&src.includes('learning-bridge.js'))continue;w.eval(fs.readFileSync(path.resolve(root,path.dirname(file),src.split('?')[0]),'utf8'));}else if(script.textContent.trim())w.eval(script.textContent);}
 if(managedEnvelope){assert(adapter);adapter.applyState(w.JSON.parse(JSON.stringify({...managedEnvelope,readOnly:false})));}
 assert.deepEqual(errors,[]);t.after(()=>w.close());return {w,d:w.document,errors};
}
const enter=(f,selector,value)=>{const input=f.d.querySelector(selector);input.value=String(value);input.dispatchEvent(new f.w.Event('input',{bubbles:true}));};

test('all nine linked arithmetic levels respect their URL and keep generating at the selected level',t=>{
 for(const level of ['t2a','t2b','t2c','n2d','t2e','n2e','n3c','n4b','n5c']){
  const f=mount(t,'trainers/arifmetika.html','?course=preoge&level='+level),conditions=new Set();
  assert(f.d.body.classList.contains('course-mode'));assert.equal(f.d.querySelector('#level').value,level);
  for(let i=0;i<20;i++){conditions.add(['prompt','qlabel','viswrap','ladwrap','pythwrap','vgrid','cleft','dbox'].map(id=>f.d.getElementById(id)?.innerHTML||'').join('|'));f.d.querySelector('#next').click();assert.equal(f.d.querySelector('#level').value,level);}
  assert(conditions.size>1,'Selected arithmetic level produces multiple conditions: '+level);assert.deepEqual(f.errors,[]);
 }
});

test('small additional generators preserve the skill, correctness and controlled variety',()=>{
 for(const topic of extra.topics){const unique=new Set();for(let seed=0;seed<2000;seed++){
  const q=extra.make(topic,seed);unique.add(q.prompt);assert(q.steps.length>=1&&q.steps.length<=3);
  const a=Number(q.prompt.match(/\d+/)[0]);assert(a>=2&&a<=99);
  const expected=topic==='multiply-by-ten-hundred'?a*Number(q.prompt.split('×')[1]):q.prompt.includes('(')?a:q.prompt.includes('×')?0:a;
  assert.equal(q.answer,expected);assert.equal(q.steps.at(-1).answer,expected);
  for(const step of q.steps){assert(extra.accepts(step.answer,step.answer));assert(!extra.accepts(step.answer+1,step.answer));}
  assert.equal(extra.nextSeed(seed),seed+1);
 }assert(unique.size>=98,'Number variation stays within the small-number skill');}
 assert.equal(extra.nextSeed(4294967295),0);assert.throws(()=>extra.make('unknown',0));
});

test('first hint gives the method; explicit solution is recorded as help',t=>{
 const f=mount(t,'soviet-math/arithmetic-practice.html','?topic=multiply-by-ten-hundred'),key='mathExam.sovietArithmeticPractice.v1.multiply-by-ten-hundred';
 enter(f,'#answer',1);f.d.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));
 f.d.querySelector('#hint').click();assert.doesNotMatch(f.d.querySelector('#hint-text').textContent,/20/);assert.match(f.d.querySelector('#hint-text').textContent,/Справа припиши/);
 f.d.querySelector('#solution').click();assert.match(f.d.querySelector('#hint-text').textContent,/20/);assert.equal(JSON.parse(f.w.localStorage.getItem(key)).assisted,true);
 enter(f,'#answer',20);f.d.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));assert.match(f.d.querySelector('#question').textContent,/с помощью/);assert.equal(JSON.parse(f.w.localStorage.getItem(key)).helpSolved,1);
 f.d.querySelector('#next').click();assert.equal(JSON.parse(f.w.localStorage.getItem(key)).assisted,false);
});

test('corrupt local practice remains untouched through input, help, checks and next',t=>{
 const topic='zero-actions',key='mathExam.sovietArithmeticPractice.v1.'+topic;
 for(const raw of ['{broken',JSON.stringify({version:1,topic,seed:0,answers:['999'],draft:'',hint:false,solved:0})]){
  const f=mount(t,'soviet-math/arithmetic-practice.html','?topic='+topic,{[key]:raw});assert.equal(f.d.querySelector('#save-warning').hidden,false);
  enter(f,'#answer',2);f.d.querySelector('#hint').click();f.d.querySelector('#solution').click();f.d.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));f.d.querySelector('#next').click();
  assert.equal(f.w.localStorage.getItem(key),raw);assert.equal(f.d.querySelector('#save-warning').hidden,false);assert.match(f.d.querySelector('#save-warning').textContent,/оставлена без изменений/);
 }
});

for(const topic of extra.topics)test('extra practice repeats, restores its draft and keeps wrong answers on the same step: '+topic,t=>{
 let f=mount(t,'soviet-math/arithmetic-practice.html','?topic='+topic);const key='mathExam.sovietArithmeticPractice.v1.'+topic;
 for(let cycle=0;cycle<12;cycle++){
  const q=extra.make(topic,cycle);assert.equal(f.d.querySelector('#condition').textContent,q.prompt);
  for(let step=0;step<q.steps.length;step++){
   const before=f.d.querySelector('#question').textContent;
   enter(f,'#answer',q.steps[step].answer+1);f.d.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));
   assert.equal(f.d.querySelector('#question').textContent,before);assert.equal(JSON.parse(f.w.localStorage.getItem(key)).answers.length,step);
   f.d.querySelector('#hint').click();assert.equal(f.d.querySelector('#hint-text').hidden,false);
   enter(f,'#answer',q.steps[step].answer);f.d.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));
  }
  assert.equal(f.d.querySelector('#next').hidden,false);assert.equal(JSON.parse(f.w.localStorage.getItem(key)).solved,cycle+1);
  f.d.querySelector('#next').click();f.d.querySelector('#next').click();assert.equal(JSON.parse(f.w.localStorage.getItem(key)).seed,cycle+1,'Double click cannot discard the fresh unsolved condition');
  if(cycle===4){enter(f,'#answer','12');const saved=f.w.localStorage.getItem(key);f=mount(t,'soviet-math/arithmetic-practice.html','?topic='+topic,{[key]:saved});assert.equal(f.d.querySelector('#answer').value,'12');assert.equal(f.w.localStorage.getItem(key),saved);}
  assert.deepEqual(f.errors,[]);
 }
});

test('all ten finite Soviet topics expose a matching live practice link',t=>{
 const f=mount(t,'soviet-math/index.html','#groups');
 for(const [topic,url] of Object.entries(extra.continuations)){
  f.w.history.replaceState(null,'','#'+topic);f.w.dispatchEvent(new f.w.HashChangeEvent('hashchange'));
  const box=f.d.querySelector('#extra-practice'),link=f.d.querySelector('#extra-practice-link');assert.equal(box.hidden,false);assert.equal(link.getAttribute('href'),url);assert.equal(link.target,'_blank');
  const u=new URL(url,'https://example.test');assert(fs.existsSync(path.join(root,u.pathname)),'Continuation target exists');
  assert.equal(f.w.__soviet.plan().topicId,topic,'The old example remains the original topic');
 }
 assert.deepEqual(f.errors,[]);
});

for(const [route,mod,type] of [['fraction-multiply','frac','*'],['decimal-multiply','dec','*'],['fraction-mixed','frac','all'],['decimal-mixed','dec','all']])test('fraction deep link opens the matching generated practice: '+route,t=>{
 const f=mount(t,'trainers/drobi-oge-trainer.html','#practice='+route),conditions=new Set();
 assert.match(f.d.querySelector('#pageTitle').textContent,mod==='frac'?/обыкновенные/i:/десятичные/i);assert.equal(f.d.querySelector('#gType').value,type);
 for(let i=0;i<25;i++){
  const expression=f.d.querySelector('#gExpr').textContent;conditions.add(expression);assert(f.d.querySelectorAll('.gstep').length>0);
  if(type==='*')assert.match(expression,/·|×/,'Multiplication links never select division or addition');
  let left=30;while(f.d.querySelector('#gShow')){assert(left-->0);f.d.querySelector('#gShow').click();}
  assert(f.d.querySelector('#gNext'));f.d.querySelector('#gNext').click();assert.equal(f.d.querySelectorAll('.gstep.done').length,0);
 }
 assert(conditions.size>15);assert.deepEqual(f.errors,[]);
});

test('unknown and inherited object names cannot become fraction routes',t=>{
 for(const route of ['constructor','__proto__','toString','unknown']){const f=mount(t,'trainers/drobi-oge-trainer.html','#practice='+route);assert(f.d.querySelector('[data-mod="frac"]'));assert.equal(f.d.querySelector('#gType'),null);assert.deepEqual(f.errors,[]);}
});

test('both limited fraction-expression lessons expose the same-skill continuation publicly and outside the managed iframe',t=>{
 const server=require('../board-server/learning-contracts.js');
 for(const id of ['fractions','practice-fraction-expression','practice-decimals'])for(const managed of [false,true]){
  const envelope=managed?server.create('ege-path',id,1):undefined,unchanged=JSON.stringify(envelope);
  const f=mount(t,'ege-baza/path/index.html',(managed?'?learning=1':'')+'#lesson='+id,{},envelope);
  let host=f.d;
  if(managed){
   assert.equal(f.d.querySelector('.fraction-extra-practice'),null,'No inert popup link in the sandboxed trainer');
   const parent=new JSDOM('<main id="support"></main>',{url:'https://learning.example.test/learning/#attempt=sample',runScripts:'outside-only'});t.after(()=>parent.window.close());
   parent.window.eval(fs.readFileSync(path.join(root,'learning/route.js'),'utf8'));host=parent.window.document.querySelector('#support');
   const item={id:'path:'+id,trainerId:'ege-path',contentId:id},catalog={items:[item],get:key=>key===item.id?item:null},attempt={id:'sample',trainerId:'ege-path',contentId:id,taskSpec:envelope.taskSpec};
   const before=JSON.stringify(attempt);parent.window.LearningRoute.mountSupport(host,{catalog,attempt,attempts:[],account:{id:'pupil'},labels:{},submit:()=>{},canLeave:()=>true,openContent:()=>{}});assert.equal(JSON.stringify(attempt),before);
   assert.equal(host.ownerDocument.defaultView.frameElement,null,'Continuation is rendered in the parent page');
  }
  const link=host.querySelector('.fraction-extra-practice a');
  if(id==='practice-decimals')assert.equal(link,null);else {assert(link);assert.equal(link.getAttribute('href'),'https://mathexam.space/school/index.html?course=vilenkin6#lesson/v6f-fraction-order');assert.equal(link.target,'_blank');}
  assert.equal(JSON.stringify(envelope),unchanged);assert.deepEqual(f.errors,[]);
 }
});

test('fraction banks advertise generated arithmetic both before and after their finite set',t=>{
 const f=mount(t,'trainers/oge-task6-fractions.html');
 const links=()=>[...f.d.querySelectorAll('a[href*="#practice="]')].map(a=>a.hash);
 assert(links().includes('#practice=fraction-mixed'));assert(links().includes('#practice=decimal-mixed'));
 f.w.renderSummary();assert(f.d.querySelector('#again'));assert.equal(f.d.querySelectorAll('#card a[href*="#practice="]').length,2);
 const g=mount(t,'trainers/drobi-oge-trainer.html');g.d.querySelector('[data-mod="frac"]').click();g.d.querySelector('[data-t="drill"]').click();g.d.querySelector('#dDots .dot:last-child').click();g.d.querySelector('#dSkip').click();assert.equal(g.d.querySelectorAll('#dCard a[href*="#practice="]').length,2);
});

test('school practice advances after its 3000-record history fills, including after reload',t=>{
 const S=require('../school/state.js'),state=S.blank(),key=S.KEY;
 state.last={skill:'multiply',mode:'practice',seed:3017};
 for(let i=0;i<3000;i++)state.events.push({skill:'multiply',mode:'practice',correct:true,assisted:false,independent:false,attempt:1,time:i,fingerprint:'multiply|old '+i});
 const original=JSON.stringify(state);let f=mount(t,'school/index.html','#lesson/multiply',{[key]:original});
 f.d.querySelector('[data-cmd="mode"][data-value="practice"]').click();
 const prompts=new Set();
 for(let cycle=0;cycle<4;cycle++){
  const saved=JSON.parse(f.w.localStorage.getItem(key));assert.equal(saved.last.seed,3018+cycle);assert.equal(saved.events.length,3000);
  const q=f.w.WorkshopMath.generate('multiply',saved.last.seed);prompts.add(q.prompt);enter(f,'#answer',q.answer);f.d.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));
  if(cycle===1){const persisted=f.w.localStorage.getItem(key);f=mount(t,'school/index.html','#lesson/multiply',{[key]:persisted});f.d.querySelector('[data-cmd="mode"][data-value="practice"]').click();}
  else f.d.querySelector('[data-cmd="next"]').click();
 }
 assert(prompts.size>1);assert.equal(JSON.stringify(state),original,'The starting saved record is never mutated');assert.deepEqual(f.errors,[]);
});
