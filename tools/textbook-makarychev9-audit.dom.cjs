'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),errors=[];
function boot(hash='lesson/m9f-root-square',saved=null,framed=false){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'school/index.html'),'utf8'),{url:'https://example.test/school/index.html?course=makarychev9#'+hash,runScripts:'outside-only',virtualConsole:vc});
 if(framed)dom.reconfigure({windowTop:{}});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 if(saved)w.localStorage.setItem('mathexam.workshop.v1',saved);w.localStorage.setItem('audit-sentinel','keep');
 for(const script of w.document.querySelectorAll('script[src]')){const file=script.getAttribute('src').split('?')[0];w.eval(fs.readFileSync(file.startsWith('/')?path.join(root,file):path.join(root,'school',file),'utf8'));}
 return dom;
}
const tick=()=>new Promise(r=>setTimeout(r,8));
const state=w=>JSON.parse(w.localStorage.getItem(w.WorkshopState.KEY));
function input(w,sel,value,event='input'){const el=w.document.querySelector(sel);assert(el,sel);el.value=String(value);el.dispatchEvent(new w.Event(event,{bubbles:true}));}
function click(w,sel){const el=w.document.querySelector(sel);assert(el,sel);el.click();}
function answer(w,value){input(w,'#answer',value);w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const text=(w,t)=>t.answerFormat==='m9-pairs'?t.answer.map(p=>'('+p.map(x=>text(w,{answer:x})).join(';')+')').join(';'):Array.isArray(t.answer)?t.answer.map(x=>text(w,{answer:x})).join(';'):typeof t.answer==='object'?w.WorkshopMath.fmt(t.answer):String(t.answer);
(async()=>{
 let dom=boot(),w=dom.window;
 assert(w.WorkshopMath.accepts('(-inf; -4/2) U [1,5; +inf)',{answer:'(-∞;-2)∪[1.5;+∞)',answerFormat:'m9-set'}));
 assert(w.WorkshopMath.accepts('[2;3] U (3;4]',{answer:'[2;4]',answerFormat:'m9-set'}));
 assert(w.WorkshopMath.accepts('[-2;-2] U [3;+inf)',{answer:'{-2}∪[3;+∞)',answerFormat:'m9-set'}));
 assert(!w.WorkshopMath.accepts('(-inf;-2] U [3;+inf)',{answer:'(-∞;-2)∪[3;+∞)',answerFormat:'m9-set'}));
 assert(!w.WorkshopMath.accepts('(2;3) U (3;4)',{answer:'(2;4)',answerFormat:'m9-set'}));
 assert(w.WorkshopMath.accepts('(1 1/2;6)',{answer:'(1.5;6)',answerFormat:'m9-set'}));
 assert(!w.WorkshopMath.accepts('(1 1/2;6)',{answer:'(5.5;6)',answerFormat:'m9-set'}));
 assert(!w.WorkshopMath.accepts('[-inf;3]',{answer:'(-∞;3]',answerFormat:'m9-set'}));
 const ids=w.WorkshopCurriculum.pathById.makarychev9.ids;assert.equal(ids.length,93);
 for(const id of ids){w.location.hash='lesson/'+id;await tick();assert(w.document.querySelector('#m9-prediction'),id);assert(w.document.querySelector('#m9-explanation'),id);assert(w.document.querySelector('.m9-model-details'),id);assert(!w.document.querySelector('.m9-model-details').open,id);assert.equal(w.document.querySelector('.lesson-head').nextElementSibling.id,'task-panel');}
 w.location.hash='lesson/m9f-root-square';await tick();
 input(w,'#m9-prediction','Проверю знак корня');input(w,'#m9-explanation','Квадрат положителен; корень неотрицательный.');
 click(w,'[data-cmd=mode][data-value=check]');await tick();
 answer(w,'');assert.equal(state(w).m9Drafts['m9f-root-square'].attempt,0);assert.equal(state(w).events.length,0);
 answer(w,'abc');answer(w,'1/');assert.equal(state(w).m9Drafts['m9f-root-square'].attempt,0);assert.equal(state(w).m9Drafts['m9f-root-square'].firstAttempt,null);assert.equal(state(w).events.length,0);
 answer(w,'-1');const before=state(w);assert.equal(before.events.length,1);assert.equal(before.m9Drafts['m9f-root-square'].firstAttempt.value,'-1');
 click(w,'[data-cmd=hint]');click(w,'[data-cmd=hint]');click(w,'[data-cmd=hint]');
 input(w,'#answer','черновик до перезагрузки');const saved=w.localStorage.getItem(w.WorkshopState.KEY),seed=state(w).last.seed;dom.window.close();
 dom=boot('lesson/m9f-root-square',saved);w=dom.window;await tick();
 assert.equal(state(w).last.seed,seed);assert.equal(w.document.querySelector('#answer').value,'черновик до перезагрузки');assert.match(w.document.querySelector('#help').textContent,/Ответ этого шага/);assert.equal(state(w).m9Drafts['m9f-root-square'].hintLevels.check,3);assert.equal(state(w).events.length,1,'reload must not create an attempt');
 let task=w.WorkshopMath.generate(state(w).last.skill,seed);answer(w,text(w,task));assert.equal(w.document.querySelector('#answer').value,text(w,task));let s=state(w);assert.equal(s.skills['m9f-root-square'].checks.length,0);assert.equal(s.events.at(-1).assisted,true);assert.equal(s.m9Drafts['m9f-root-square'].firstAttempt.value,'-1');
 click(w,'[data-cmd=mode][data-value=check]');await tick();task=w.WorkshopMath.generate(state(w).last.skill,state(w).last.seed);assert.notEqual(state(w).last.seed,seed);answer(w,text(w,task));s=state(w);assert.equal(s.skills['m9f-root-square'].checks.length,1);assert(s.m9History.some(d=>d.seed===seed&&d.assisted));assert(s.m9History.some(d=>d.inquiry.prediction==='Проверю знак корня'));
 assert.equal(w.WorkshopState.validate(s,w.WorkshopCurriculum.lessons.map(l=>l.id)).m9History.length,s.m9History.length);
 w.location.hash='m9-check/m9f-powers';await tick();answer(w,'abc');answer(w,'1/');let freshTask=w.WorkshopMath.generate(state(w).last.skill,state(w).last.seed);answer(w,text(w,freshTask));assert.equal(state(w).events.at(-1).attempt,1);assert(state(w).events.at(-1).independent,'format repairs must preserve a true first mathematical success');
 // Missing old help provenance is conservative, while unrelated state is preserved.
 const unknown=JSON.parse(JSON.stringify(s));delete unknown.m9Drafts['m9f-root-square'].assisted;delete unknown.m9Drafts['m9f-root-square'].exposed;const safe=w.WorkshopState.validate(unknown,w.WorkshopCurriculum.lessons.map(l=>l.id));assert(safe.m9Drafts['m9f-root-square'].assisted);assert(safe.m9Drafts['m9f-root-square'].exposed);assert.equal(JSON.stringify(safe.skills),JSON.stringify(s.skills));
 w.location.hash='lesson/m9f-rational-shift';await tick();input(w,'[data-param=type]','inverse','change');input(w,'[data-param=a]',0,'change');input(w,'[data-param=h]',2,'change');input(w,'[data-param=k]',3,'change');
 assert.equal(w.document.querySelectorAll('[data-asymptotes]').length,0);assert.equal(w.document.querySelectorAll('.m9-open').length,1);assert.match(w.document.querySelector('.m9-domain').textContent,/x ≠ 2/);assert.match(w.document.querySelector('.m9-domain').textContent,/Вертикальной асимптоты нет/);assert.match(w.document.querySelector('.m9-value-table').textContent,/не определено/);
 input(w,'[data-param=type]','parabola','change');click(w,'[data-lab-action=new-mission]');const mission=w.document.querySelector('.m9-mission p').textContent,graphSaved=w.localStorage.getItem(w.WorkshopState.KEY);dom.window.close();dom=boot('lesson/m9f-rational-shift',graphSaved);w=dom.window;await tick();assert.equal(w.document.querySelector('.m9-mission p').textContent,mission);assert.equal(w.document.querySelector('[data-param=h]').value,'2');
 w.location.hash='lesson/m9f-arithmetic-sum';await tick();input(w,'[data-sum]','123');const sumSaved=w.localStorage.getItem(w.WorkshopState.KEY);dom.window.close();dom=boot('lesson/m9f-arithmetic-sum',sumSaved);w=dom.window;await tick();assert.equal(w.document.querySelector('[data-sum]').value,'123');
 // Explicit independent entry used by numbered tasks also accepts valid prerequisite IDs.
 w.location.hash='m9-check/sets';await tick();assert.equal(state(w).last.mode,'check');assert.equal(state(w).last.skill,'sets');
 for(const alias of ['makarychev7','makarychev8']){w.location.hash='course/'+alias;await tick();assert(w.document.querySelector('a[href="'+alias+'/"]'));}
 const persisted=w.localStorage.getItem(w.WorkshopState.KEY);dom.window.close();dom=boot('lesson/m9f-root-square',persisted,true);w=dom.window;await tick();assert.match(w.document.querySelector('.lesson-head').textContent,/Личный прогресс/);input(w,'#answer','42');click(w,'[data-cmd=hint]');answer(w,'42');assert.equal(w.localStorage.getItem(w.WorkshopState.KEY),persisted,'board must not touch personal work');assert.equal(w.localStorage.getItem('audit-sentinel'),'keep');dom.window.close();
 assert.deepEqual(errors,[]);console.log('PASS M9 audit DOM: all 93 entrypoints; saved inquiry, first answer, attempts and level-3 hints; new independent task; bounded archive/import; domain a=0; model mission and inputs reload; numbered check entry; native links; board byte isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
