const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..'),errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(root,'school/index.html'),'utf8'),{url:'https://example.test/school/index.html#book/makarychev7-2024',runScripts:'outside-only',virtualConsole:vc});
const w=dom.window,d=w.document;w.scrollTo=()=>{}; // jsdom has no layout/scrolling; this is not a visual browser check.
w.localStorage.setItem('legacy-course-sentinel','keep');
// Load the same ordered assets as the real page, including course navigation.
for(const script of d.querySelectorAll('script[src]')){const file=script.getAttribute('src').split('?')[0];w.eval(fs.readFileSync(path.join(root,'school',file),'utf8'));}
const tick=()=>new Promise(r=>setTimeout(r,5)),click=s=>{const el=d.querySelector(s);assert(el,s);el.click();},fmt=a=>Array.isArray(a)?a.map(fmt).join('; '):typeof a==='object'?w.WorkshopMath.fmt(a):String(a);
const go=async hash=>{w.location.hash=hash;await tick();};
const answer=value=>{d.querySelector('#answer').value=value;d.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
(async()=>{
 const mapped=new Set(Array.from(d.querySelectorAll('[data-cmd=learn]')).map(el=>el.dataset.value).filter(id=>id.startsWith('alg-')));assert.equal(mapped.size,6);
 for(const id of w.WorkshopCurriculum.lessons.filter(x=>x.id.startsWith('alg-')).map(x=>x.id)){
  await go('lesson/'+id);assert.equal(d.querySelectorAll('.alg-theory h2').length,3,id);assert(d.querySelector('#model svg'),id);
  const lesson=w.WorkshopCurriculum.byId[id];click('[data-cmd=claim][data-value="'+lesson.claimTrue+'"]');assert(d.querySelector('#claim-feedback').textContent.startsWith('Да,'));
  const t=w.WorkshopMath.generate(id,0),steps=[...t.steps,{answer:t.answer}];
  for(let i=0;i<steps.length;i++){answer(fmt(steps[i].answer));assert(!d.querySelector('.feedback.error'),id+' step '+i);if(i<steps.length-1)click('[data-cmd=next]');}
 }
 await go('lesson/alg-variable');d.querySelector('#answer').value='−12';click('[data-cmd=prerequisite]');await tick();click('[data-cmd=return]');await tick();assert.equal(d.querySelector('#answer').value,'−12');
 await go('lesson/alg-order');for(let i=0;i<3;i++)click('[data-op="'+i+'"]');assert(d.querySelector('.alg-caption').textContent.includes('3 из 3'));
 await go('lesson/alg-identity');click('[data-verdict=no]');assert(d.querySelector('.alg-message').textContent.includes('Сейчас стороны совпадают'));
 const input=d.querySelector('.alg-slider input');input.value=0;input.dispatchEvent(new w.Event('input'));click('[data-verdict=no]');assert(d.querySelector('.alg-message').textContent.includes('не тождество'));
 input.value=1;input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('.alg-message').textContent,'');
 await go('lesson/alg-rational');click('[data-cmd=mode][data-value=check]');await tick();
 let state=JSON.parse(w.localStorage.getItem(w.WorkshopState.KEY));let t=w.WorkshopMath.generate(state.last.skill,state.last.seed);answer(fmt(t.answer));state=JSON.parse(w.localStorage.getItem(w.WorkshopState.KEY));assert.equal(state.skills['alg-rational'].checks.length,1);
 click('[data-cmd=next]');await tick();click('[data-cmd=hint]');state=JSON.parse(w.localStorage.getItem(w.WorkshopState.KEY));t=w.WorkshopMath.generate(state.last.skill,state.last.seed);answer(fmt(t.answer));state=JSON.parse(w.localStorage.getItem(w.WorkshopState.KEY));assert.equal(state.skills['alg-rational'].checks.length,1);
 await go('lesson/fraction');assert(d.querySelector('#model svg'));assert.equal(w.localStorage.getItem('legacy-course-sentinel'),'keep');assert.deepEqual(errors,[]);
 // A cached older HTML document may load a newer app.js without the new route module.
 const compat=new JSDOM('<div id="main"></div><div id="notice"></div><input id="file-input">',{url:'https://example.test/school/index.html',runScripts:'outside-only'});
 compat.window.scrollTo=()=>{};
 for(const file of ['math.js','curriculum.js','state.js','models.js','algebra7.js','secondary.js','app.js'])compat.window.eval(fs.readFileSync(path.join(root,'school',file),'utf8'));
 assert(compat.window.document.querySelector('h1'));assert(compat.window.document.getElementById('notice').textContent.includes('Обновите страницу'));compat.window.close();
 w.close();console.log('PASS: jsdom only — six full guided paths; claims; interactive controls; gap/return; independent vs assisted evidence; existing model and legacy data.');
})().catch(e=>{w.close();console.error(e);process.exitCode=1;});
