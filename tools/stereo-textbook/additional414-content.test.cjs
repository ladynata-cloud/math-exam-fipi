'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),baseline=require('./additional414-baseline.cjs'),{ids,published,sha,exact}=baseline;
const course=require('../../stereo-course/textbook/data/course.json'),index=require('../../stereo-course/textbook/source-index.json'),registry=require('./content-review.json'),cases=require('./browser-cases.cjs');
const old=baseline.previousCourse(course,index);baseline.previousIndex(index);baseline.previousRegistry(registry);baseline.previousCases(cases);
assert.equal(baseline.previousLessonFiles(root+'/stereo-course/textbook/lessons').length,674);
for(const[file,gitBlob]of Object.entries(published.unchangedFiles)){
 const bytes=fs.readFileSync(root+'/'+file);assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),gitBlob,'unchanged renderer/storage/schema: '+file);
}
const API=require('../../stereo-course/textbook/assets/engine.js'),checked=API.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(checked.issues,[]);assert.equal(checked.available.size,688);assert.equal(checked.coverage.availableExercises,421);assert.equal(checked.coverage.availableSelfchecks,50);assert.equal(checked.coverage.availableTheoryPoints,51);assert.equal(checked.coverage.partiallyAvailable,0);
const cards=course.lessons.filter(c=>ids.has(c.id));exact(cards.map(c=>c.id),ids,'fourteen complete additions');
const receipt=require('../../docs/reviews/ATANASYAN_ADDITIONAL_414_421_INDEPENDENT.json');
const contents=cards.map(c=>{const x=structuredClone(c);delete x.status;delete x.review;return x;});
assert.equal(receipt.authoredSHA256,sha(contents),'independent written review binds the exact authored content');
assert.deepEqual(receipt.contentHashes,Object.fromEntries(contents.map(c=>[c.id,sha(c)])),'independent review binds every part');
exact(receipt.ids,ids,'independent review exact scope');
assert(['source','mathematics','pedagogy'].every(k=>receipt[k].verdict==='passed'),'independent written review completed');
assert.equal(receipt.sourceSHA256,'bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770');
for(const[file,expected]of Object.entries(receipt.runtimeSHA256))assert.equal(baseline.hash(fs.readFileSync(root+'/'+file)),expected,'reviewed runtime identity');
// Before image inspection a candidate can be checked as writing, but never released by the browser gate.
if(receipt.visual.verdict==='passed'){
 baseline.validateVisualReceipt(receipt,cards);
 const stale=structuredClone(receipt);stale.visual.reviewedContentSHA256='0'.repeat(64);assert.throws(()=>baseline.validateVisualReceipt(stale,cards),/same current content/);
 const incomplete=structuredClone(receipt);incomplete.visual.captureHashes.pop();assert.throws(()=>baseline.validateVisualReceipt(incomplete,cards),/reviewed capture hash/);
}
let steps=0,views=0,newCases=0;
for(const c of cards){
 assert.equal(c.status,'reviewed');assert.equal(c.answer.mode,'manual');assert.deepEqual(API.validateLesson(c,course.catalog.book),[]);
 assert.deepEqual(c,JSON.parse(fs.readFileSync(root+'/stereo-course/textbook/lessons/'+c.id+'.json')));
 const printed=Number(c.source.exercise)<=419?113:114;
 assert.deepEqual(c.source.printedPages,[printed]);assert.deepEqual(c.source.pdfPages,[printed+2]);
 assert.equal(c.source.chapter,'IV. Цилиндр, конус и шар');assert.equal(c.source.collection,'main');assert.equal(c.revision,1);
 const content=structuredClone(c);delete content.status;delete content.review;assert.equal(sha(content),registry.cards.find(x=>x.id===c.id).sha256);
 const reached=new Set(['neutral']);for(const item of [...c.help,...c.steps])reached.add(item.view||'neutral');
 assert.deepEqual([...reached].sort(),Object.keys(c.visualization.model.views).sort(),'all model states reachable');
 for(const stage of ['condition',...c.help.map(h=>'help:'+h.id),...c.steps.map(s=>s.id)]){assert(cases.has(c.id+'|'+stage));newCases++;}
 for(const h of c.help)for(const id of h.theoryIds||[])assert(course.lessons.some(t=>t.id===id),'linked help theory');
 for(const s of c.steps){assert(s.justifications.length);for(const j of s.justifications)if(j.theoryId){const linked=course.lessons.find(t=>t.id===j.theoryId);assert(linked);assert.deepEqual(j.source,linked.source,'exact cited theory source');}}
 const initial=[c.title,c.statement.text,c.statement.goal,c.answer.prompt,c.visualization.caption,c.visualization.model.views.neutral.label].join('\n');
 assert(!/Ответ\s*[:=]|2√10|35\/144|240π|30°|0,6R/iu.test(initial),'no premature computed answer');
 steps+=c.steps.length;views+=Object.keys(c.visualization.model.views).length;
}
assert.equal(steps,58);assert.equal(views,60);assert.equal(newCases,95);assert.equal(cases.size,2245);
for(const n of Object.keys(published.parts))assert.deepEqual(cards.filter(c=>c.source.exercise===n).map(c=>c.source.subpart??null),published.parts[n],'complete Cyrillic source parts');
const initial415=cards.find(c=>c.id==='ex-main-0415-a').visualization.model;
assert(!initial415.labelNames.includes('O')&&!initial415.views.neutral.segments?.flat().includes('O'),'415a centre is disclosed only when proved');
let rejected=0;
for(const mutate of [
 data=>{data.lessons=data.lessons.filter(c=>c.id!=='ex-main-0414-c');},
 data=>{data.lessons.find(c=>ids.has(c.id)).steps[0].explanation+=' changed';},
 data=>{data.lessons.find(c=>!ids.has(c.id)).revision++;},
 data=>{data.catalog.entries.find(c=>c.id==='ex-main-0418-a').source.subpart='a';},
 data=>{data.lessons.find(c=>ids.has(c.id)).review.mathematics='pending';},
 data=>{data.lessons.find(c=>!ids.has(c.id)).review.source='pending';}
]){const bad=structuredClone(course);mutate(bad);assert.throws(()=>baseline.previousCourse(bad,index));rejected++;}
const incomplete=structuredClone(index);delete incomplete.entries.find(baseline.target).requiredParts;assert.throws(()=>baseline.previousIndex(incomplete));rejected++;
const absentContracts=structuredClone(index);for(const e of absentContracts.entries.filter(baseline.target))delete e.requiredParts;assert.throws(()=>baseline.previousCourse(course,absentContracts),/all eight source contracts/);rejected++;
const wrongSource=structuredClone(index);wrongSource.entries.find(baseline.target).source.printedPages=[112];assert.throws(()=>baseline.previousIndex(wrongSource));rejected++;
const badRegistry=structuredClone(registry);badRegistry.cards[0].sha256='0'.repeat(64);assert.throws(()=>baseline.previousRegistry(badRegistry));rejected++;
const pending=structuredClone(cards),catalog=structuredClone(course.catalog);pending.forEach(c=>{c.status='in-review';c.review={source:'pending',mathematics:'pending',pedagogy:'pending'};});catalog.entries.forEach(e=>{if(ids.has(e.id))e.status='in-review';});assert.equal(API.inspectBundle(catalog,old.lessons.concat(pending)).available.size,674,'pending additions never open');
const {JSDOM}=require('jsdom'),dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/stereo-course/textbook/',runScripts:'outside-only',pretendToBeVisual:true}),win=dom.window;
for(const f of ['math-text.js','task-scene-viewer.js'])win.eval(fs.readFileSync(root+'/stereo-course/assets/'+f,'utf8'));
win.eval(fs.readFileSync(root+'/stereo-course/textbook/assets/engine.js','utf8'));
const node=win.document.getElementById('app'),key=c=>'mathExamTextbook.v1:'+c.source.bookId+':'+c.id+':r'+c.revision;
let app=win.StereoTextbook.createApp(node,course);
const prior=old.lessons.find(c=>c.id==='ex-main-0413');app.open(prior.id);let field=node.querySelector('#final-answer');field.value='Сохранённая работа прежнего выпуска';field.dispatchEvent(new win.Event('input',{bubbles:true}));node.querySelector('[data-steps]+button').click();const before=win.localStorage.getItem(key(prior));
for(const c of cards){
 assert(app.open(c.id));assert.equal(node.querySelectorAll('[data-step]').length,0);assert(!node.querySelector('[data-main-help]').open);
 field=node.querySelector('#final-answer');field.value='Моя работа '+c.id;field.dispatchEvent(new win.Event('input',{bubbles:true}));
 for(const _ of c.steps)node.querySelector('[data-steps]+button').click();
 const saved=JSON.parse(win.localStorage.getItem(key(c)));assert.equal(saved.revealed,c.steps.length);assert.equal(saved.checked,false);
 app.home();app.open(c.id);assert.equal(node.querySelector('#final-answer').value,saved.draft);assert.equal(node.querySelectorAll('[data-step]').length,c.steps.length);
}
assert.equal(win.localStorage.getItem(key(prior)),before,'old saved work not rewritten');
app.destroy();dom.window.close();
require('./additional414-math.test.cjs');
console.log('ATANASYAN_ADDITIONAL414_CONTENT_OK: 688 cards; all prior 674 bytes and records preserved; 58 steps; 60 states; '+rejected+' rejected integration corruptions');
