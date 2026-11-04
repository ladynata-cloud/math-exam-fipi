'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),baseline=require('./additional396-baseline.cjs'),{ids,published,hash,sha,exact}=baseline;
const later=require('./additional404-baseline.cjs');
const full=require('../../stereo-course/textbook/data/course.json'),fullIndex=require('../../stereo-course/textbook/source-index.json');
const course=later.previousCourse(full,fullIndex),index=later.previousIndex(fullIndex),registry=later.previousRegistry(require('./content-review.json')),cases=later.previousCases(require('./browser-cases.cjs'));
const old=baseline.previousCourse(course,index);baseline.previousIndex(index);baseline.previousRegistry(registry);baseline.previousCases(cases);
assert.equal(baseline.previousLessonFiles(root+'/stereo-course/textbook/lessons').length,653);
for(const[file,gitBlob]of Object.entries(published.unchangedFiles)){const bytes=fs.readFileSync(root+'/'+file);assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),gitBlob,'unchanged renderer/storage/schema: '+file);}
const API=require('../../stereo-course/textbook/assets/engine.js'),checked=API.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(checked.issues,[]);assert.equal(checked.available.size,662);assert.equal(checked.coverage.availableExercises,403);assert.equal(checked.coverage.availableSelfchecks,50);assert.equal(checked.coverage.availableTheoryPoints,51);assert.equal(checked.coverage.partiallyAvailable,0);
const cards=course.lessons.filter(c=>ids.has(c.id));exact(cards.map(c=>c.id),ids,'nine complete additions');
let steps=0,views=0;
for(const c of cards){
 assert.equal(c.status,'reviewed');assert.equal(c.answer.mode,'manual');assert.deepEqual(API.validateLesson(c,course.catalog.book),[]);
 assert.deepEqual(c,JSON.parse(fs.readFileSync(root+'/stereo-course/textbook/lessons/'+c.id+'.json')));
 assert.deepEqual(c.source.printedPages,[112]);assert.deepEqual(c.source.pdfPages,[114]);assert.equal(c.source.chapter,'IV. Цилиндр, конус и шар');assert.equal(c.source.collection,'main');assert.equal(c.revision,1);
 const content=structuredClone(c);delete content.status;delete content.review;assert.equal(sha(content),registry.cards.find(x=>x.id===c.id).sha256);
 const reached=new Set(['neutral']);for(const item of [...c.help,...c.steps])reached.add(item.view||'neutral');
 assert.deepEqual([...reached].sort(),Object.keys(c.visualization.model.views).sort(),'all model states reachable');
 for(const stage of ['condition',...c.help.map(h=>'help:'+h.id),...c.steps.map(s=>s.id)])assert(cases.has(c.id+'|'+stage));
 for(const s of c.steps){assert(s.justifications.length);for(const j of s.justifications)if(j.theoryId){const linked=course.lessons.find(t=>t.id===j.theoryId);assert(linked);assert.deepEqual(j.source,linked.source,'exact cited theory source');}}
 const initial=[c.title,c.statement.text,c.statement.goal,c.answer.prompt,c.visualization.caption,c.visualization.model.views.neutral.label].join('\n');assert(!/Ответ\s*[:=]|414π|r = p\/4|5\/4/iu.test(initial),'no premature final result');
 steps+=c.steps.length;views+=Object.keys(c.visualization.model.views).length;
}
assert.equal(steps,38);assert.equal(views,40);assert.equal(cases.size,2064);
for(const n of Object.keys(published.parts))assert.deepEqual(cards.filter(c=>c.source.exercise===n).map(c=>c.source.subpart??null),published.parts[n],'complete original source parts');
let rejected=0;
for(const mutate of [
 data=>{data.lessons=data.lessons.filter(c=>c.id!=='ex-main-0400-b');},
 data=>{data.lessons.find(c=>ids.has(c.id)).steps[0].explanation+=' changed';},
 data=>{data.lessons.find(c=>!ids.has(c.id)).revision++;},
 data=>{data.catalog.entries.find(c=>c.id==='ex-main-0400-a').source.subpart='a';}
]){const bad=structuredClone(course);mutate(bad);assert.throws(()=>baseline.previousCourse(bad,index));rejected++;}
const incomplete=structuredClone(index);delete incomplete.entries.find(baseline.target).requiredParts;assert.throws(()=>baseline.previousIndex(incomplete));rejected++;
const pending=structuredClone(cards),catalog=structuredClone(course.catalog);pending.forEach(c=>{c.status='in-review';c.review={source:'pending',mathematics:'pending',pedagogy:'pending'};});catalog.entries.forEach(e=>{if(ids.has(e.id))e.status='in-review';});assert.equal(API.inspectBundle(catalog,old.lessons.concat(pending)).available.size,653,'pending additions never open');
const {JSDOM}=require('jsdom'),dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/stereo-course/textbook/',runScripts:'outside-only',pretendToBeVisual:true}),win=dom.window;
for(const f of ['math-text.js','task-scene-viewer.js'])win.eval(fs.readFileSync(root+'/stereo-course/assets/'+f,'utf8'));
win.eval(fs.readFileSync(root+'/stereo-course/textbook/assets/engine.js','utf8'));
const node=win.document.getElementById('app'),key=c=>'mathExamTextbook.v1:'+c.source.bookId+':'+c.id+':r'+c.revision;
let app=win.StereoTextbook.createApp(node,course);
const prior=old.lessons.find(c=>c.id==='ex-selfcheck-iv-10');app.open(prior.id);let field=node.querySelector('#final-answer');field.value='Сохранённое доказательство прежнего выпуска';field.dispatchEvent(new win.Event('input',{bubbles:true}));node.querySelector('[data-steps]+button').click();const before=win.localStorage.getItem(key(prior));
for(const c of cards){assert(app.open(c.id));assert.equal(node.querySelectorAll('[data-step]').length,0);assert(!node.querySelector('[data-main-help]').open);assert(node.querySelector('[data-companion-source]').textContent.includes('К задаче № '+c.source.exercise));field=node.querySelector('#final-answer');field.value='Моя работа '+c.id;field.dispatchEvent(new win.Event('input',{bubbles:true}));for(const _ of c.steps)node.querySelector('[data-steps]+button').click();const saved=JSON.parse(win.localStorage.getItem(key(c)));assert.equal(saved.revealed,c.steps.length);assert.equal(saved.checked,false);app.home();app.open(c.id);assert.equal(node.querySelector('#final-answer').value,saved.draft);assert.equal(node.querySelectorAll('[data-step]').length,c.steps.length);}
assert.equal(win.localStorage.getItem(key(prior)),before,'new lessons do not rewrite old saved work');
app.destroy();app=win.StereoTextbook.createApp(node,course);app.open(prior.id);assert.equal(node.querySelector('#final-answer').value,'Сохранённое доказательство прежнего выпуска');assert.equal(node.querySelectorAll('[data-step]').length,1);app.destroy();dom.window.close();
require('./additional396-math.test.cjs');
console.log('ATANASYAN_ADDITIONAL396_CONTENT_OK: 662 cards; all prior 653 bytes and records preserved; 38 steps; 40 states; '+rejected+' rejected integration corruptions');
