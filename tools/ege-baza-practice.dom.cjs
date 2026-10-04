/* DOM integration only. This does not claim real browser or layout coverage. */
const {JSDOM,VirtualConsole}=require('jsdom');
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..'),errors=[];
const tick=()=>new Promise(resolve=>setTimeout(resolve,2));
function create(saved,hash='map'){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(base,'ege-baza/path/index.html'),'utf8'),{url:'https://course.test/ege-baza/path/index.html#'+hash,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.localStorage.setItem('legacy-course-sentinel','keep');if(saved!==undefined)w.localStorage.setItem('mathexam.ege-baza.path.v1',saved);
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
const enter=(w,d,v)=>{const e=d.querySelector('#answer');assert(e);e.value=String(v);e.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('#answerForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
async function go(w,s){w.location.hash=s;await tick();}
(async()=>{
 const {dom,w,d}=create();
 assert.equal(d.querySelectorAll('#cards>.card').length,21);await go(w,'foundation');assert.equal(d.querySelectorAll('.foundation-route>li').length,13);
 for(const m of w.PathData.practice.catalog){
  await go(w,'lesson='+m.id);assert(d.querySelector('#typeSelect'));
  click(d,'[data-stage="1"]');assert(d.querySelector('#model'));
  click(d,'[data-stage="2"]');let t=w.PathData.task(m.id,w.PathCourse.state().lessons[m.id].seed);
  for(const s of t.steps)enter(w,d,s.a);
  assert(d.querySelector('#lesson').textContent.includes('Разбор завершён'),m.id);
  click(d,'#new');t=w.PathData.task(m.id,w.PathCourse.state().lessons[m.id].seed);
  if(t.display)assert(d.querySelector('.task-support svg,.task-support table'),m.id+' missing exam figure');
  enter(w,d,t.answer);assert(d.querySelector('#feedback').textContent.startsWith('Верно'),m.id+' check');
 }
 // A wrong first attempt must not become independent credit after correction.
 await go(w,'lesson=practice-percent-whole');click(d,'[data-stage="3"]');click(d,'#new');let id='practice-percent-whole',l=w.PathCourse.state().lessons[id],before=l.independent,t=w.PathData.task(id,l.seed);enter(w,d,t.answer+17);assert(d.querySelector('#ege-remediation a'));
 const returnLink=new URL(d.querySelector('#ege-remediation a').href);assert.equal(returnLink.searchParams.get('returnTo'),'/ege-baza/path/index.html#lesson='+id);enter(w,d,t.answer);assert.equal(l.independent,before);
 // Restore the exact lesson step and unfinished answer from the existing schema.
 await go(w,'lesson=practice-fraction-add');click(d,'[data-stage="2"]');const current=w.PathCourse.state().lessons['practice-fraction-add'];current.step=1;current.draft='3/';w.dispatchEvent(new w.Event('pagehide'));const saved=w.localStorage.getItem(w.PathCourse.KEY);const b=create(saved,'lesson=practice-fraction-add');assert.equal(b.d.querySelector('#answer').value,'3/');assert.equal(b.w.PathCourse.state().lessons['practice-fraction-add'].step,1);b.w.close();
 // New hyphenated lesson IDs return through the existing restricted return bridge.
 const back=new JSDOM('<body></body>',{url:returnLink.href,runScripts:'outside-only'});back.window.eval(fs.readFileSync(path.join(base,'ege-baza/return-to-course.js'),'utf8'));assert.equal(back.window.document.querySelector('#ege-return a').hash,'#lesson='+id);back.window.close();
 for(const bad of ['https://evil.example/','/trainers/trainer-board.html#map','/ege-baza/path/index.html?admin=1#map']){const x=new JSDOM('<body></body>',{url:'https://course.test/trainers/oge-basics/fraction-meaning.html?returnTo='+encodeURIComponent(bad),runScripts:'outside-only'});x.window.eval(fs.readFileSync(path.join(base,'ege-baza/return-to-course.js'),'utf8'));assert(!x.window.document.querySelector('#ege-return'));x.window.close();}
 // Exam must contain all 21 positions and display the data required to solve it.
 await go(w,'exam');click(d,'#start');let r=w.PathCourse.state().active;assert.equal(r.ids.length,21);
 const input=d.querySelector('#answer');input.value='draft';input.dispatchEvent(new w.Event('input'));const backup=w.localStorage.getItem(w.PathCourse.KEY);const c=create(backup,'exam');assert.equal(c.d.querySelector('#answer').value,'draft');c.w.close();
 for(let i=0;i<21;i++){r=w.PathCourse.state().active;t=w.PathData.task(r.ids[r.i],r.seed+r.i);assert.equal(t.pos,i+1);if(t.display)assert(d.querySelector('.task-support svg,.task-support table'));enter(w,d,t.answer);await tick();}
 assert.equal(w.PathCourse.state().runs.at(-1).answers.filter(a=>a.correct).length,21);assert(d.querySelector('#main').textContent.includes('21/21'));
 assert.equal(w.localStorage.getItem('legacy-course-sentinel'),'keep');assert(w.PathCourse.valid(w.PathCourse.state()));
 const corrupt='{broken';const c2=create(corrupt);c2.w.dispatchEvent(new c2.w.Event('pagehide'));assert.equal(c2.w.localStorage.getItem(c2.w.PathCourse.KEY),corrupt);assert(!c2.d.querySelector('#storage').hidden);c2.w.close();
 assert.deepEqual(errors,[]);w.close();console.log('EGE_BAZA_PRACTICE_DOM_OK: 75 guided and independent flows; 21-position exam; figures; remediation return; partial answer restore; incorrect-to-correct credit; corrupt/legacy data preservation. DOM simulation, not a real-browser check.');
})().catch(e=>{console.error(e);process.exit(1);});
