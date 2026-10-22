// DOM regression simulation. This is not visual or real-device browser QA.
const realConsole=console;
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const root=path.join(__dirname,'..','..','courses','vilenkin-5-part-1');
const KEY='mathexam-vilenkin5-part1-v1';
const files=[1,2,3,4,5].map(n=>JSON.parse(fs.readFileSync(path.join(root,`data/lessons-${n}.json`),'utf8')));
const data=files.flat(),book=JSON.parse(fs.readFileSync(path.join(root,'data/textbook-index.json'),'utf8'));
async function boot(saved,bundle=false){
 const {window:dom}=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8'));
 const w={document:dom.document,HTMLElement:dom.HTMLElement,Event:dom.Event,addEventListener:dom.addEventListener.bind(dom),dispatchEvent:dom.dispatchEvent.bind(dom)};w.window=w;
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||''},set(v){for(const o of this.querySelectorAll('option')){if(o.value===String(v))o.setAttribute('selected','');else o.removeAttribute('selected')}}});
 const mem=saved instanceof Map?new Map(saved):new Map(saved?[[KEY,saved]]:[]),errors=[];
 Object.assign(w,{console:{log(){},warn(){},error:(...a)=>errors.push(a.map(String).join(' '))},location:{hash:'',protocol:'https:'},localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)},scrollTo(){},confirm:()=>true,Blob,URL,setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout,navigator:{clipboard:{writeText:async()=>{}}}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','')};
 w.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
 if(bundle)w.VILENKIN_DATA={lessons:files,book};
 w.fetch=async u=>{if(bundle)throw Error('offline must not fetch');return{ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,u),'utf8'))}};
 const ctx=vm.createContext(w);
 for(const f of ['math.js','labs.js','practice.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 await new Promise(r=>setTimeout(r,20));
 const nav=h=>{w.location.hash=h;w.dispatchEvent(new w.Event('hashchange'))};
 return{w,mem,errors,nav,ctx};
}
function click(w,s){const x=w.document.querySelector(s);assert(x,'missing '+s);x.click()}
function type(w,v){const f=w.document.querySelector('#answer');assert(f,'source answer input');f.value=String(v);f.dispatchEvent(new w.Event('input'));return f}
function answer(w,v){type(w,v);w.document.querySelector('#answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}))}
function solve(w,t){if(t.options){const i=t.options.findIndex(x=>w.CourseMath.equivalent(x,t.answer));assert(i>=0);click(w,`[data-option="${i}"]`)}else answer(w,Array.isArray(t.answer)?t.answer[0]:t.answer)}
function state(x){return JSON.parse(x.mem.get(KEY))}
function numeric(t){return !t.options&&/^[\d ,./-]+$/.test(String(t.answer))}
function bookHash(e){return '#book/'+encodeURIComponent(e.number)}
function closeArithmetic(w){const d=w.document.querySelector('dialog.arithmetic-dialog');assert(d?.open,'arithmetic dialog is open');const b=[...d.querySelectorAll('button')].find(x=>x.textContent.includes('Вернуться к заданию'));assert(b,'clear return to source task');b.click();assert(!d.open||!d.isConnected,'arithmetic dialog closes')}
(async()=>{
 const x=await boot(),{w,mem,errors,nav}=x;
 assert(w.document.body.textContent.includes('Твой маршрут'));assert(w.document.body.textContent.includes('24 темы'));assert(w.document.body.textContent.includes('4 практикума'));
 let models=0,controls=0,renders=0;
 for(const l of data){
  for(const tab of ['theory','steps','practice','check']){
   nav(`#lesson/${l.id}/${tab}`);assert(w.document.querySelector('#lessonBody'));assert(!w.document.body.textContent.includes('Курс не загрузился'));renders++;
   assert.equal(w.document.querySelector('.lesson-head a').getAttribute('href'),`textbook.pdf#page=${l.pdfPage||Math.max(1,l.page-2)}`);
   if(tab==='theory'){
    models++;assert(w.document.querySelector('#labHost').textContent.trim().length>20,'model '+l.id);
    for(const c of [...w.document.querySelectorAll('#labHost input,#labHost select')]){
     const orig=c.value,values=c.tagName==='SELECT'?[...c.querySelectorAll('option')].map(o=>o.value):[c.getAttribute('min'),c.getAttribute('max')];
     for(const v of values){c.value=v;c.dispatchEvent(new w.Event('input'));assert(!/\bNaN\b|undefined|Infinity/.test(w.document.querySelector('#labHost').textContent),'invalid lab '+l.id)}
     c.value=orig;c.dispatchEvent(new w.Event('input'));controls++;
    }
   }
  }
 }
 assert.equal(renders,116);assert.equal(models,29);assert(controls>=29);
 // Select actual authored numeric tasks, avoiding dependence on another textbook's IDs.
 const l=data.find(l=>l.id===8&&numeric(l.tasks[0])&&l.examples[0].steps.every(numeric)&&l.tasks.slice(-5).slice(0,2).every(numeric));assert(l,'addition lesson fixtures');
 const id=l.id,t=l.tasks[0],e=l.examples[0];
 nav(`#lesson/${id}/practice/0`);click(w,'#hint');solve(w,t);let saved=state(x);assert.equal(saved.lessons[id].tasks[t.id].result,'assisted');assert.equal(Object.values(saved.lessons[id].tasks).filter(t=>t.solved).length,1);
 nav(`#lesson/${id}/practice/0`);assert(w.document.querySelector('.badge.assisted'));
 const reload=await boot(mem);reload.nav(`#lesson/${id}/practice/0`);assert(reload.w.document.querySelector('.badge.assisted'));assert.equal(reload.errors.length,0);
 nav(`#lesson/${id}/steps/0`);solve(w,e.steps[0]);assert.equal(w.document.querySelectorAll('.step.completed').length,1);nav('#lesson/2/theory');nav(`#lesson/${id}/steps/0`);assert.equal(w.document.querySelectorAll('.step.completed').length,1);
 nav(`#lesson/${id}/check`);click(w,'#startExam');answer(w,'');answer(w,'1/0');answer(w,'нет');assert.equal(state(x).lessons[id].exam.n,0,'invalid answers never spend the one exam attempt');
 for(const item of l.tasks.slice(-5))solve(w,item);
 assert(state(x).lessons[id].exam.complete);assert.equal(state(x).lessons[id].exam.score,5);
 const [book1,book2]=book.exercises;assert(book1&&book2);nav('#book/'+book1.printedPage);assert(w.document.querySelector('iframe'),'numeric source-page shortcut');nav(bookHash(book1));assert(w.document.querySelector('iframe').getAttribute('src').includes('#page='+book1.pdfPage));let note=w.document.querySelector('#bookNote');note.value='Проверка заметки';note.dispatchEvent(new w.Event('input'));nav(bookHash(book2));nav(bookHash(book1));assert.equal(w.document.querySelector('#bookNote').value,'Проверка заметки');
 nav('#progress');assert(w.document.body.textContent.includes('С подсказкой'));nav('#home');assert(w.document.body.textContent.includes('Продолжить занятие'));
 // Stored checks resume and retain help; stale submit cannot advance twice.
 const second=await boot();second.nav(`#lesson/${id}/check`);click(second.w,'#startExam');solve(second.w,l.tasks.slice(-5)[0]);second.nav(`#lesson/${id}/theory`);second.nav(`#lesson/${id}/check`);assert.equal(state(second).lessons[id].exam.n,1);assert(state(second).lessons[id].exam.aided);
 const examReload=await boot(second.mem);examReload.nav(`#lesson/${id}/check`);assert(examReload.w.document.body.textContent.includes('Проверка · 2 из 5'));assert(examReload.w.document.body.textContent.includes('работа с помощью'));
 const oldSubmit=second.w.document.querySelector('#answerForm').onsubmit;solve(second.w,l.tasks.slice(-5)[1]);oldSubmit({preventDefault(){}});assert.equal(state(second).lessons[id].exam.n,2);
 for(const invalid of [{version:1,lessons:{},notes:null},{version:1,lessons:{[id]:{examples:{0:{n:999,rows:[]}}}}}]){
  const raw=JSON.stringify(invalid),bad=await boot(raw);assert.equal(bad.mem.get(KEY),raw);assert.equal(bad.errors.length,0);assert(!bad.w.document.querySelector('#saveWarning').hidden);assert(bad.w.document.body.textContent.includes('Твой маршрут'));
 }
 nav('#progress');const beforeImport=mem.get(KEY);await w.document.querySelector('#importProgress').onchange({target:{files:[{size:100,text:async()=>JSON.stringify({version:1,lessons:{},notes:null})}]}});assert.equal(mem.get(KEY),beforeImport);assert(w.document.querySelector('#importFeedback').textContent.includes('Не удалось'));
 nav('#book/%E0%A4%A');assert(w.document.querySelector('#bookSearch'));
 const bundled=await boot(undefined,true);assert.equal(bundled.errors.length,0);bundled.nav(bookHash(book.checks?.[0]||book1));assert(bundled.w.document.querySelector('iframe'));
 // Visible labels name what to enter and give the current unit, also in a check.
 const labeled=await boot(),area=data.find(l=>l.id===21),areaIndex=area.tasks.slice(0,-5).findIndex(t=>(t.unit||/Найди площадь.*см²/.test(t.prompt))&&!t.options);assert(areaIndex>=0);labeled.nav(`#lesson/21/practice/${areaIndex}`);
 let label=labeled.w.document.querySelector('label[for="answer"]');assert(label.textContent.includes(area.tasks[areaIndex].unit||'см²'));assert(label.textContent.includes('Введи только число'));assert.equal(labeled.w.document.querySelector('#answer').getAttribute('maxlength'),'2000');
 labeled.nav(`#lesson/${id}/steps/0`);label=labeled.w.document.querySelector('label[for="answer"]');assert(label.textContent.includes(e.steps[0].prompt));
 // Revealing a step preserves input and waits for an explicit continue.
 const reveal=await boot();reveal.nav(`#lesson/${id}/steps/0`);type(reveal.w,'17');click(reveal.w,'#stepReveal');let r=state(reveal).lessons[id].examples[0];assert.equal(r.n,0);assert.equal(r.rows.length,0);assert.equal(r.draft,'17');assert(r.help&&r.revealed);assert.equal(reveal.w.document.querySelector('#answer').value,'17');assert(reveal.w.document.querySelector('#continueStep'));
 const rr=await boot(reveal.mem);rr.nav(`#lesson/${id}/steps/0`);assert.equal(rr.w.document.querySelector('#answer').value,'17');const oldContinue=rr.w.document.querySelector('#continueStep').onclick;click(rr.w,'#continueStep');oldContinue();r=state(rr).lessons[id].examples[0];assert.equal(r.n,1);assert(r.rows[0].help);assert.equal(r.draft,'');assert(!r.revealed);
 // Direct PDF consultation records help even when opening a new tab.
 const pdf=await boot();pdf.nav(`#lesson/${id}/check`);click(pdf.w,'#startExam');type(pdf.w,'12');click(pdf.w,'.lesson-head a[href^="textbook.pdf"]');let pdfExam=state(pdf).lessons[id].exam;assert(pdfExam.aided);assert.equal(pdfExam.n,0);assert.equal(pdfExam.draft,'12');assert(pdf.w.document.querySelector('#examHelpNote').textContent.includes('работа с помощью'));
 for(const task of l.tasks.slice(-5))solve(pdf.w,task);pdfExam=state(pdf).lessons[id].exam;assert.equal(pdfExam.score,5);assert(pdf.w.document.querySelector('#examPanel h2').textContent.includes('с повторением'));
 // Text bounds are applied before persistence and remain valid after reload.
 const bounded=await boot();bounded.nav(`#lesson/${id}/practice/0`);let field=type(bounded.w,'9'.repeat(2100));assert.equal(field.value.length,2000);assert.equal(state(bounded).lessons[id].tasks[t.id].draft.length,2000);
 bounded.nav(bookHash(book1));field=bounded.w.document.querySelector('#bookNote');assert.equal(field.getAttribute('maxlength'),'50000');field.value='я'.repeat(50100);field.dispatchEvent(new bounded.w.Event('input'));assert.equal(field.value.length,50000);assert.equal(state(bounded).notes[book1.number].text.length,50000);
 const br=await boot(bounded.mem);assert(br.w.document.querySelector('#saveWarning').hidden);br.nav(`#lesson/${id}/practice/0`);assert.equal(br.w.document.querySelector('#answer').value.length,2000);br.nav(bookHash(book1));assert.equal(br.w.document.querySelector('#bookNote').value.length,50000);
 // A too-large new note cannot replace the last readable browser copy. Keep the in-memory work exportable.
 const manyNotes=Object.fromEntries(book.exercises.slice(0,99).map(e=>[e.number,{text:'x'.repeat(50000),done:false}]));
 const nearLimit=JSON.stringify({version:1,lessons:{},notes:manyNotes,last:null,returnTo:null,focus:false});assert(nearLimit.length<5000000);
 const sizeGuard=await boot(nearLimit);assert(sizeGuard.w.document.querySelector('#saveWarning').hidden);const overflowPage=book.exercises[99];sizeGuard.nav(bookHash(overflowPage));let largeNote=sizeGuard.w.document.querySelector('#bookNote');largeNote.value='y'.repeat(50000);largeNote.dispatchEvent(new sizeGuard.w.Event('input'));assert.equal(sizeGuard.mem.get(KEY),nearLimit);assert.equal(largeNote.value.length,50000);assert(sizeGuard.w.document.querySelector('#saveWarning').textContent.includes('Прежняя сохранённая копия не изменена'));assert(sizeGuard.w.document.querySelector('#saveWarning').textContent.includes('лимит загрузки'));
 let exportedBlob=null;sizeGuard.w.URL={createObjectURL:b=>{exportedBlob=b;return'blob:progress-test'},revokeObjectURL(){}};sizeGuard.nav('#progress');click(sizeGuard.w,'#backupProgress');assert(exportedBlob);const backup=JSON.parse(await exportedBlob.text());assert.equal(backup.notes[overflowPage.number].text.length,50000);assert.equal(backup.notes[book1.number].text.length,50000);
 const sizeReload=await boot(sizeGuard.mem);assert(sizeReload.w.document.querySelector('#saveWarning').hidden);sizeReload.nav(bookHash(book1));assert.equal(sizeReload.w.document.querySelector('#bookNote').value.length,50000);
 // Arithmetic detours preserve the source DOM, completed steps, hash and draft.
 const detour=await boot();detour.nav(`#lesson/${id}/steps/0`);solve(detour.w,e.steps[0]);const originalHash=detour.w.location.hash;field=type(detour.w,'321');const completed=detour.w.document.querySelector('.step.completed');click(detour.w,'#trainArithmetic');assert.equal(detour.w.location.hash,originalHash);assert.equal(detour.w.document.querySelector('#answer'),field);assert.equal(detour.w.document.querySelector('.step.completed'),completed);assert.equal(field.value,'321');r=state(detour).lessons[id].examples[0];assert.equal(r.n,1);assert.equal(r.rows.length,1);assert(r.help);assert.equal(r.draft,'321');closeArithmetic(detour.w);assert.equal(field.value,'321');
 const dr=await boot(detour.mem);dr.nav(originalHash);assert.equal(dr.w.document.querySelector('#answer').value,'321');assert.equal(dr.w.document.querySelectorAll('.step.completed').length,1);solve(dr.w,e.steps[1]);assert(state(dr).lessons[id].examples[0].rows[1].help);
 const ordinary=await boot();ordinary.nav(`#lesson/${id}/practice/0`);field=type(ordinary.w,'654');click(ordinary.w,'#trainArithmetic');assert.equal(ordinary.w.document.querySelector('#answer'),field);assert.equal(field.value,'654');assert.equal(state(ordinary).lessons[id].tasks[t.id].help,1);assert(!state(ordinary).lessons[id].tasks[t.id].solved);closeArithmetic(ordinary.w);solve(ordinary.w,t);assert.equal(state(ordinary).lessons[id].tasks[t.id].result,'assisted');
 const examArithmetic=await boot();examArithmetic.nav(`#lesson/${id}/check`);click(examArithmetic.w,'#startExam');field=type(examArithmetic.w,'987');click(examArithmetic.w,'#openArithmetic');assert.equal(examArithmetic.w.document.querySelector('#answer'),field);assert.equal(field.value,'987');let examState=state(examArithmetic).lessons[id].exam;assert(examState.aided);assert.equal(examState.n,0);assert.equal(examState.draft,'987');closeArithmetic(examArithmetic.w);assert(examArithmetic.w.document.querySelector('#examHelpNote').textContent.includes('арифметическая'));
 const bookArithmetic=await boot();bookArithmetic.nav(bookHash(book1));note=bookArithmetic.w.document.querySelector('#bookNote');note.value='Сохранить мою запись';note.dispatchEvent(new bookArithmetic.w.Event('input'));click(bookArithmetic.w,'#trainArithmetic');closeArithmetic(bookArithmetic.w);assert.equal(bookArithmetic.w.document.querySelector('#bookNote'),note);assert.equal(note.value,'Сохранить мою запись');
 for(const env of [x,reload,second,examReload,bundled,labeled,reveal,rr,pdf,bounded,br,detour,dr,ordinary,examArithmetic,bookArithmetic,sizeGuard,sizeReload])assert.deepEqual(env.errors,[]);
 realConsole.log(JSON.stringify({status:'PASS',renders,models,controls,flows:['retained completed steps','one result per item','hint provenance','five-item independent check','invalid answers preserve check attempt','stale-submit guard','saved check resume','malformed storage preserved','atomic malformed import rejection','source PDF links','book notes','offline data','task-specific answer units','step reveal waits for continue','bounded saved text','oversize save preserves previous copy and allows export','arithmetic detour retains source DOM and hash','arithmetic detour retains step and draft after reload','arithmetic practice source assistance','header arithmetic marks unfinished check as aided','book detour retains written work'],visualQA:'not claimed by DOM simulation'}));
})().catch(e=>{realConsole.error(e);process.exit(1)});
