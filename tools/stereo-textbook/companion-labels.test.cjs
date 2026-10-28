'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),bundle=require(root+'/stereo-course/textbook/data/course.json');
const original=JSON.stringify(bundle),dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/stereo-course/textbook/',runScripts:'outside-only'}),w=dom.window,doc=w.document;
const errors=[];w.addEventListener('error',e=>errors.push(e.error));
w.TaskSceneViewer={mount(node){node.append(doc.createElement('svg'));return {destroy(){node.replaceChildren();},setView(){},getState(){return {yaw:0,pitch:0};}};}};
w.eval(fs.readFileSync(root+'/stereo-course/assets/math-text.js','utf8'));
w.eval(fs.readFileSync(root+'/stereo-course/textbook/assets/engine.js','utf8'));
const app=w.StereoTextbook.createApp(doc.querySelector('#app'),bundle);
const choose=(id,value)=>{const field=doc.getElementById(id);field.value=value;field.dispatchEvent(new w.Event('change',{bubbles:true}));};
const search=value=>{const field=doc.getElementById('catalog-search');field.value=value;field.dispatchEvent(new w.Event('input',{bubbles:true}));};
const visibleReference=()=>{const ref=doc.querySelector('main>header>[data-companion-source]');assert.ok(ref);assert.equal(ref.closest('details'),null);assert.doesNotMatch(ref.textContent,/undefined|null|NaN/);return ref;};

assert.match(doc.querySelector('h1').textContent,/^Курс к учебнику «Геометрия 10–11\. Атанасян»$/);
assert.equal(doc.getElementById('catalog-paragraph').options.length,28,'all 27 printed paragraphs are selectable, including pending chapters');
assert.ok([...doc.getElementById('catalog-chapter').options].some(o=>o.textContent==='К главе III. Многогранники'));

// The first ready page and every later page expose a source caption without
// opening a disclosure. Pending groups expose captions but no fake lesson link.
const readySeen=new Set(),pendingSeen=new Set();
function collect(section,seen,ready){
 for(;;){
  const list=doc.querySelector(section);assert.ok(list);
  for(const article of list.querySelectorAll('article')){
   const ref=article.querySelector('[data-companion-source]');assert.ok(ref);assert.doesNotMatch(ref.textContent,/undefined|null|NaN/);
   assert.match(ref.querySelector('.companion-book').textContent,/2024.*стр\./);seen.add(ref.dataset.companionSource);
   if(ready){assert.equal(ref.closest('details'),null);assert.ok(article.querySelector('[data-lesson]'));}
   else assert.equal(article.querySelector('[data-lesson]'),null);
  }
  const next=list.querySelector('nav button:last-child');if(!next||next.disabled)break;next.click();
 }
}
collect('[data-catalog-ready]',readySeen,true);
assert.equal(readySeen.size,bundle.lessons.length);
collect('[data-catalog-pending]',pendingSeen,false);
assert.ok(pendingSeen.size>500,'pending source inventory is covered across all pages');

// Chapter-specific paragraph numbers cannot cross-contaminate another chapter.
choose('catalog-chapter','III. Многогранники');choose('catalog-paragraph','III:2');
assert.match(doc.querySelector('.catalog-location-heading').textContent,/К главе III/);
assert.match(doc.querySelectorAll('.catalog-location-heading')[1].textContent,/К параграфу 2 «Пирамида»/);
assert.ok([...doc.querySelectorAll('[data-catalog-ready] .companion-location')].every(e=>e.textContent.includes('К параграфу 2 «Пирамида»')));
choose('catalog-chapter','IV. Цилиндр, конус и шар');
assert.equal(doc.getElementById('catalog-paragraph').value,'','changing chapter removes the earlier chapter paragraph selection');
assert.deepEqual([...doc.getElementById('catalog-paragraph').options].map(o=>o.value),['','IV:1','IV:2','IV:3']);
choose('catalog-paragraph','IV:1');
assert.match(doc.querySelector('[data-catalog-pending] .companion-location').textContent,/К главе IV.*К параграфу 1 «Цилиндр»/);
assert.equal(doc.querySelectorAll('[data-catalog-ready] [data-lesson]').length,0,'a pending paragraph never becomes available because it has a caption');
app.home();search('Пирамида');assert.ok(doc.querySelector('[data-catalog-ready] [data-lesson]'));

// Every available card has a visible, correct source identity. Reveal all
// written steps to inspect their source-reference captions as well.
let references=0;
for(const lesson of bundle.lessons){
 assert.equal(app.open(lesson.id),true);const ref=visibleReference(),identity=ref.querySelector('.companion-identity').textContent;
 if(lesson.source.collection==='theory')assert.equal(identity,'К пункту '+lesson.source.point);
 else if(lesson.source.collection==='selfcheck')assert.match(identity,new RegExp('^К вопросу '+lesson.source.exercise+' для самопроверки'));
 else assert.match(identity,new RegExp('^К задаче № '+lesson.source.exercise+'(?:$| ·)'));
 assert.equal(doc.querySelector('main>header>h1').textContent,lesson.title);
 assert.match(ref.querySelector('.companion-book').textContent,/К учебнику.*Атанасян.*12-е издание.*2024/);
 const next=doc.querySelector('[data-steps]+button');for(const _ of lesson.steps)next.click();
 for(const source of doc.querySelectorAll('[data-step] small')){assert.doesNotMatch(source.textContent,/undefined|null|NaN/);assert.match(source.textContent,/^К /);references++;}
}
assert.ok(references>1000,'all actual justification source captions were mounted');

// Actual tasks at page-shared headings remain in the preceding paragraph;
// first-page-only or all-pages-contained heuristics mislabel these source cases.
for(const [number,paragraph]of [[32,1],[33,1],[164,2],[165,2],[196,3],[238,1],[270,2],[287,3]]){
 const lesson=bundle.lessons.find(l=>l.source.collection==='main'&&l.source.exercise===String(number));assert.ok(lesson);app.open(lesson.id);assert.match(visibleReference().textContent,new RegExp('К параграфу '+paragraph+' «'));
}
app.home();choose('catalog-collection','main');
for(const [number,paragraph]of [[345,1],[371,2],[395,3],[451,1],[502,3],[517,4],[591,2],[612,3],[681,1],[835,1],[848,2],[849,2],[850,2],[857,3],[858,3],[862,3],[870,4]]){
 search(String(number));const reference=doc.querySelector('[data-catalog-pending] [data-companion-source]');assert.ok(reference);assert.match(reference.textContent,new RegExp('К параграфу '+paragraph+' «'));
}
search('518');assert.doesNotMatch(doc.querySelector('[data-catalog-pending] [data-companion-source]').textContent,/К параграфу/,'additional task 518 shares page138 with chapter questions, not paragraph4');

// Source chapter questions and additional exercises must not acquire the last
// paragraph number simply because it precedes them in the book.
app.open('ex-main-0310');assert.match(visibleReference().textContent,/К задаче № 310.*К главе III/s);assert.doesNotMatch(visibleReference().textContent,/К параграфу/);
app.open('ex-main-0311-a');assert.equal(visibleReference().querySelector('.companion-identity').textContent,'К задаче № 311 · подпункт а');
const selfcheck=bundle.lessons.find(l=>l.source.collection==='selfcheck');app.open(selfcheck.id);assert.doesNotMatch(visibleReference().textContent,/К параграфу/);
app.open('theory-033');assert.match(visibleReference().textContent,/К пункту 33.*К главе III.*К параграфу 2 «Пирамида»/s);
app.open('theory-037-cube-axes');assert.equal(visibleReference().querySelector('.companion-identity').textContent,'К пункту 37','an internal theory variant key is not a printed subpart');

// Contextual theory has its own visible reference and returns to the same draft.
const parent=bundle.lessons.find(l=>l.kind==='exercise'&&l.help.some(h=>h.theoryIds?.length));app.open(parent.id);
const answer=doc.getElementById('final-answer');answer.value='Моя незавершённая запись';answer.dispatchEvent(new w.Event('input',{bubbles:true}));
const trigger=doc.querySelector('[data-main-help] button[title^="К пункту"]');assert.ok(trigger);trigger.click();
const modal=doc.querySelector('dialog'),modalRef=modal.querySelector(':scope>[data-companion-source]');assert.ok(modalRef);assert.equal(modalRef.closest('details'),null);assert.match(modalRef.textContent,/К пункту/);
modal.querySelector(':scope>button').click();assert.equal(doc.querySelector('dialog'),null);assert.equal(doc.getElementById('final-answer').value,'Моя незавершённая запись');
const stateKey='mathExamTextbook.v1:'+bundle.catalog.book.id+':'+parent.id+':r'+parent.revision;
assert.equal(JSON.parse(w.localStorage.getItem(stateKey)).draft,'Моя незавершённая запись');
assert.equal(JSON.stringify(bundle),original,'captions and filtering never rewrite content/source metadata');
assert.equal(errors.length,0);
app.destroy();w.close();
console.log('ATANASYAN_COMPANION_LABELS_OK: '+readySeen.size+' available cards, '+pendingSeen.size+' pending source groups, 27 paragraphs, '+references+' justification captions, contextual theory and retained draft');
