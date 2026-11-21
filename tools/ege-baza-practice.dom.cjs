/* DOM integration only. This does not claim real browser or layout coverage. */
const {JSDOM,VirtualConsole}=require('jsdom');
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..'),errors=[];
const tick=()=>new Promise(resolve=>setTimeout(resolve,2));
function create(saved,hash='map',search=''){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(base,'ege-baza/path/index.html'),'utf8'),{url:'https://course.test/ege-baza/path/index.html'+search+'#'+hash,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.localStorage.setItem('legacy-course-sentinel','keep');if(saved!==undefined)w.localStorage.setItem('mathexam.ege-baza.path.v1'+(search==='?practice=recovery'?'.separate':''),saved);
 // Keep the fixture's dependencies and execution order identical to the page.
 for(const script of w.document.querySelectorAll('script')){
  assert(!script.type||script.type==='text/javascript','unsupported script type '+script.type);
  if(!script.hasAttribute('src')){w.eval(script.textContent);continue;}
  const url=new URL(script.src);assert.equal(url.origin,w.location.origin,'external fixture script');
  const file=path.resolve(base,'.'+decodeURIComponent(url.pathname));
  assert(file.startsWith(base+path.sep),'script must stay inside the repository');
  w.eval(fs.readFileSync(file,'utf8'));
 }
 return {dom,w,d:w.document};
}
const click=(d,s)=>{const e=d.querySelector(s);assert(e,'missing '+s);e.click();};
const enter=(w,d,v,prefix='answer')=>{const e=d.querySelector('#'+prefix);assert(e);e.value=String(v);e.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('#'+prefix+'Form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
async function go(w,s){w.location.hash=s;await tick();}
async function testTargetedRemediation(w,d){
 // Input-specific help must survive exam-family routing and a page reload.
 for(const id of ['fractions','equations']){
  await go(w,'lesson='+id);
  click(d,'#startSteps');
  const lesson=w.PathCourse.state().lessons[id];
  const seed=lesson.seed,step=lesson.step,independent=lesson.independent;
  const task=w.PathData.task(id,seed);
  const value=id==='fractions'?'1/0':String(-task.steps[step].a);
  enter(w,d,value,'stepAnswer');
  assert.match(d.querySelector('#ege-remediation a').textContent,id==='fractions'?/Смысл дроби/:/разными знаками/);
  assert.equal(new URL(d.querySelector('#ege-remediation a').href).searchParams.get('returnTo'),'/ege-baza/path/index.html#lesson='+id);
  const restored=create(w.localStorage.getItem(w.PathCourse.KEY),'lesson='+id);
  assert.equal(restored.d.querySelector('#stepAnswer').value,value);
  assert.equal(restored.w.PathCourse.state().lessons[id].seed,seed);
  assert.equal(restored.w.PathCourse.state().lessons[id].step,step);
  assert.equal(restored.w.PathCourse.state().lessons[id].independent,independent);
  restored.w.close();
 }
 const cases=[
  ['practice-decimals','/trainers/arifmetika.html?level=n5c'],
  ['practice-decimal-division','/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html'],
  ['practice-grid-parallelogram','/geometry-course/atlas/area-parallelogram.html'],
  ['practice-parallelogram','/geometry-course/atlas/area-parallelogram.html'],
  ['practice-area-units','/trainers/oge-basics/units-area.html'],
  ['practice-time','/trainers/oge-basics/units-length-time.html']
 ];
 function assertReturn(link,id,target){
  const actual=new URL(link.href),expected=new URL(target,actual.origin);
  assert.equal(actual.pathname,expected.pathname,id);
  for(const [key,value] of expected.searchParams)assert.equal(actual.searchParams.get(key),value,id);
  assert.equal(actual.searchParams.get('returnTo'),'/ege-baza/path/index.html#lesson='+id);
  const file=path.resolve(base,'.'+actual.pathname);
  const opened=new JSDOM(fs.readFileSync(file,'utf8'),{url:actual.href,runScripts:'outside-only'});
  const bridge=opened.window.document.querySelector('script[src$="/ege-baza/return-to-course.js"]');
  assert(bridge,target+' must load its return control');
  opened.window.eval(fs.readFileSync(path.resolve(base,'.'+new URL(bridge.src).pathname),'utf8'));
  assert.equal(opened.window.document.querySelector('#ege-return a').hash,'#lesson='+id);
  opened.window.close();
 }
 for(const [id,target] of cases){
  await go(w,'lesson='+id);
  click(d,'#new');
  enter(w,d,9999);
  assertReturn(d.querySelector('#ege-remediation a'),id,target);
  const restored=create(w.localStorage.getItem(w.PathCourse.KEY),'lesson='+id);
  assert.equal(restored.d.querySelector('#answer').value,'9999',id);
  assert.equal(restored.w.PathCourse.state().lessons[id].seed,w.PathCourse.state().lessons[id].seed,id);
  restored.w.close();
 }
 for(const [id,hint] of [
  ['choice','полную стоимость'],
  ['practice-delivery','точном равенстве'],
  ['practice-trig-angle','360°'],
  ['practice-inverse-formula','Сложи основания'],
  ['practice-probability-draw','зелёного жетона'],
  ['practice-probability-opposite','неисправных насосов'],
  ['practice-right-ratio','Найди сторону напротив прямого угла C. Введи её длину.'],
  ['practice-quadratic','Подбери два множителя'],
  ['practice-log-equation','По определению логарифма']
 ]){
  await go(w,'lesson='+id);
  click(d,'#new');
  enter(w,d,9999);
  const help=d.querySelector('#ege-remediation');
  assert(help.textContent.includes(hint),id);
  assert(!help.querySelector('a'),id);
  click(d,'#ege-remediation button');
  assert(d.querySelector('#taskSteps').open,id);
  assert.equal(d.querySelector('#answer').value,'9999',id);
 }
 const id='practice-decimals';
 await go(w,'lesson='+id);
 click(d,'#new');
 const task=w.PathData.task(id,w.PathCourse.state().lessons[id].seed);
 enter(w,d,task.steps[0].a);
 assertReturn(d.querySelector('#ege-remediation a'),id,'/trainers/oge-basics/decimal-add-subtract.html');
 click(d,'#startSteps');
 enter(w,d,task.steps[0].a,'stepAnswer');
 enter(w,d,9999,'stepAnswer');
 assertReturn(d.querySelector('#stepFeedback + #ege-remediation a'),id,'/trainers/oge-basics/decimal-add-subtract.html');
 const restored=create(w.localStorage.getItem(w.PathCourse.KEY),'lesson='+id);
 assert.equal(restored.d.querySelector('#stepAnswer').value,'9999');
 assert.equal(restored.w.PathCourse.state().lessons[id].step,1);
 restored.w.close();
 click(d,'#new');
 d.querySelector('#storage').hidden=false;
 enter(w,d,9999);
 const link=d.querySelector('#ege-remediation a');
 assert.equal(link.target,'_blank');
 assert.equal(link.rel,'noopener');
 assert.equal(new URL(link.href).searchParams.has('returnTo'),false);
 d.querySelector('#storage').hidden=true;

 const division='practice-decimal-division';
 await go(w,'lesson='+division);
 click(d,'#new');
 click(d,'#startSteps');
 const steps=w.PathData.task(division,w.PathCourse.state().lessons[division].seed).steps;
 for(const step of steps.slice(0,2))enter(w,d,step.a,'stepAnswer');
 enter(w,d,9999,'stepAnswer');
 assert(!d.querySelector('#ege-remediation'),'at the quotient step the decimal shift is already done');
}
(async()=>{
 const {dom,w,d}=create();
 assert.equal(d.querySelectorAll('#cards>.card').length,21);await go(w,'foundation');assert.equal(d.querySelectorAll('.foundation-route>li').length,13);
 for(const m of w.PathData.practice.catalog){
  await go(w,'lesson='+m.id);assert(d.querySelector('#typeSelect'));
  d.querySelector('#taskHelp').open=true;d.querySelector('#taskModel').open=true;await tick();assert(d.querySelector('#model'));
  d.querySelector('#taskSteps').open=true;await tick();let t=w.PathData.task(m.id,w.PathCourse.state().lessons[m.id].seed);
  for(const [i,step] of t.steps.entries()){
   if(m.id==='practice-diameter-chord'&&i===1){
    assert(!d.querySelector('#stepAnswer'),'First justify the right angle on the diameter');
    click(d,'#taskStepsBody [data-construct="yes"]');
    assert(d.querySelector('#taskStepsBody svg .construction'),'Right-angle mark after the theorem');
   }
   enter(w,d,step.a,'stepAnswer');
  }
  assert(d.querySelector('#taskStepsBody').textContent.includes('Разбор завершён'),m.id);
  click(d,'#new');t=w.PathData.task(m.id,w.PathCourse.state().lessons[m.id].seed);
  if(t.display)assert(d.querySelector('.task-support svg,.task-support table'),m.id+' missing exam figure');
  enter(w,d,t.answer);assert(d.querySelector('#feedback').textContent.startsWith('Верно'),m.id+' check');
 }
 // A wrong first attempt must not become independent credit after correction.
 await go(w,'lesson=practice-percent-whole');click(d,'#new');let id='practice-percent-whole',l=w.PathCourse.state().lessons[id],before=l.independent,t=w.PathData.task(id,l.seed);enter(w,d,t.answer+17);assert(d.querySelector('#ege-remediation a'));
 const returnLink=new URL(d.querySelector('#ege-remediation a').href);assert.equal(returnLink.searchParams.get('returnTo'),'/ege-baza/path/index.html#lesson='+id);enter(w,d,t.answer);assert.equal(l.independent,before);
 // Restore the exact lesson step and unfinished answer from the existing schema.
 await go(w,'lesson=practice-fraction-add');const current=w.PathCourse.state().lessons['practice-fraction-add'];current.step=1;current.stage=2;current.draft='3/';delete current.taskFirst;w.dispatchEvent(new w.Event('pagehide'));const saved=w.localStorage.getItem(w.PathCourse.KEY);const b=create(saved,'lesson=practice-fraction-add');assert.equal(b.d.querySelector('#stepAnswer').value,'3/');assert.equal(b.w.PathCourse.state().lessons['practice-fraction-add'].step,1);b.w.close();
 await testTargetedRemediation(w,d);
 // A support visit from the separately saved practice must not enter the course's store.
 const isolated=create(undefined,'lesson=practice-fraction-add','?practice=recovery');
 const courseKey='mathexam.ege-baza.path.v1';
 isolated.w.localStorage.setItem(courseKey,saved);
 click(isolated.d,'#startSteps');
 enter(isolated.w,isolated.d,'1/0','stepAnswer');
 const separateLesson=isolated.w.PathCourse.state().lessons['practice-fraction-add'];
 const separateLink=new URL(isolated.d.querySelector('#ege-remediation a').href);
 assert.equal(separateLink.searchParams.get('returnTo'),'/ege-baza/path/index.html?practice=recovery#lesson=practice-fraction-add');
 const supportPage=new JSDOM('<body></body>',{url:separateLink.href,runScripts:'outside-only'});
 supportPage.window.eval(fs.readFileSync(path.join(base,'ege-baza/return-to-course.js'),'utf8'));
 const destination=new URL(supportPage.window.document.querySelector('#ege-return a').href);
 assert.equal(destination.search,'?practice=recovery');
 const returned=create(isolated.w.localStorage.getItem(isolated.w.PathCourse.KEY),destination.hash.slice(1),destination.search);
 assert.equal(returned.w.PathCourse.KEY,courseKey+'.separate');
 assert.equal(returned.d.querySelector('#stepAnswer').value,'1/0');
 assert.equal(returned.w.PathCourse.state().lessons['practice-fraction-add'].seed,separateLesson.seed);
 assert.equal(returned.w.PathCourse.state().lessons['practice-fraction-add'].step,separateLesson.step);
 assert.equal(returned.w.PathCourse.state().lessons['practice-fraction-add'].independent,0);
 assert.equal(isolated.w.localStorage.getItem(courseKey),saved);
 assert.equal(returned.w.localStorage.getItem(courseKey),null,'isolated restore never writes course progress');
 isolated.w.close();supportPage.window.close();returned.w.close();
 // New hyphenated lesson IDs return through the existing restricted return bridge.
 const back=new JSDOM('<body></body>',{url:returnLink.href,runScripts:'outside-only'});back.window.eval(fs.readFileSync(path.join(base,'ege-baza/return-to-course.js'),'utf8'));assert.equal(back.window.document.querySelector('#ege-return a').hash,'#lesson='+id);back.window.close();
 for(const bad of ['https://evil.example/','/trainers/trainer-board.html#map','/ege-baza/path/index.html?admin=1#map','/ege-baza/path/index.html?practice=other#map','/ege-baza/path/index.html?practice=recovery&admin=1#map','/ege-baza/path/index.html?practice=recovery&practice=recovery#map','/ege-baza/work-rate/index.html?practice=recovery#practice']){const x=new JSDOM('<body></body>',{url:'https://course.test/trainers/oge-basics/fraction-meaning.html?returnTo='+encodeURIComponent(bad),runScripts:'outside-only'});x.window.eval(fs.readFileSync(path.join(base,'ege-baza/return-to-course.js'),'utf8'));assert(!x.window.document.querySelector('#ege-return'));x.window.close();}
 // Exam must contain all 21 positions and display the data required to solve it.
 await go(w,'exam');click(d,'#start');let r=w.PathCourse.state().active;assert.equal(r.ids.length,21);
 const input=d.querySelector('#answer');input.value='draft';input.dispatchEvent(new w.Event('input'));const backup=w.localStorage.getItem(w.PathCourse.KEY);const c=create(backup,'exam');assert.equal(c.d.querySelector('#answer').value,'draft');c.w.close();
 for(let i=0;i<21;i++){r=w.PathCourse.state().active;t=w.PathData.task(r.ids[r.i],r.seed+r.i);assert.equal(t.pos,i+1);if(t.display)assert(d.querySelector('.task-support svg,.task-support table'));enter(w,d,t.answer);await tick();}
 assert.equal(w.PathCourse.state().runs.at(-1).answers.filter(a=>a.correct).length,21);assert(d.querySelector('#main').textContent.includes('21/21'));
 // Diagnostics only recommend evidence from positions the learner submitted or deliberately skipped.
 await go(w,'diagnostic');click(d,'#start');r=w.PathCourse.state().active;
 enter(w,d,w.PathData.task(r.ids[0],r.seed).answer);click(d,'#finish');await tick();
 assert.match(d.querySelector('#main .panel').textContent,/Верно 1 из 1 проверенных/);
 assert(!d.querySelector('#main .callout a[href^="#lesson="]'));
 assert.equal(d.querySelectorAll('#main details li:has(b)').length,21);
 assert.equal([...d.querySelectorAll('#main details li b')].filter(n=>n.textContent.startsWith('Не проверено')).length,20);
 await go(w,'diagnostic');click(d,'#start');r=w.PathCourse.state().active;
 enter(w,d,'');click(d,'#skip');click(d,'#finish');await tick();
 assert.equal(d.querySelector('#main .callout a').hash,'#lesson='+r.ids[0]);
 assert.match(d.querySelector('#main details li b').textContent,/^Пока не знаю/);
 const archived=create(w.localStorage.getItem(w.PathCourse.KEY),'report');
 assert.match(archived.d.querySelector('#main details li b').textContent,/^Пока не знаю/);
 assert.match(archived.d.querySelector('#main details li:nth-child(2) b').textContent,/^Не проверено/);
 assert(!archived.d.querySelector('#main details li:nth-child(2) p'),'unchecked item does not disclose its answer');
 archived.w.close();
 assert.equal(w.localStorage.getItem('legacy-course-sentinel'),'keep');assert(w.PathCourse.valid(w.PathCourse.state()));
 const corrupt='{broken';const c2=create(corrupt);c2.w.dispatchEvent(new c2.w.Event('pagehide'));assert.equal(c2.w.localStorage.getItem(c2.w.PathCourse.KEY),corrupt);assert(!c2.d.querySelector('#storage').hidden);c2.w.close();
 assert.deepEqual(errors,[]);w.close();console.log('EGE_BAZA_PRACTICE_DOM_OK: 79 guided and independent flows; 21-position exam; figures; remediation return; partial answer restore; incorrect-to-correct credit; corrupt/legacy data preservation. DOM simulation, not a real-browser check.');
})().catch(e=>{console.error(e);process.exit(1);});
