'use strict';
// Checks captions and the actual candidate/release boundary; grants no approval.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{expectedTitle}=require('./caption_expectations.cjs');
const root=path.resolve(process.argv[2]||''),dir=path.join(root,'geometry-course/textbook');
assert(process.argv[2],'Pass the isolated review root');
const bundle=JSON.parse(fs.readFileSync(path.join(dir,'data/course.json'))),api=require(path.join(dir,'assets/engine.js')),viewer=require(path.join(dir,'assets/planar-viewer.js'));
const lessons=bundle.lessons.filter(l=>l.source.chapter==='VI');assert.equal(lessons.length,138);const scope=JSON.parse(fs.readFileSync(path.join(root,'tools/geometry-textbook/release-scope.json')));assert.equal(bundle.lessons.length,scope.totalCards);
const paragraphs=bundle.sourceInventory.paragraphs.filter(p=>p.chapter===6);assert.equal(paragraphs.length,3);
const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/geometry-course/textbook/review.html',runScripts:'outside-only'}),w=dom.window,d=w.document;
for(const name of ['math-text.js','planar-viewer.js','engine.js'])w.eval(fs.readFileSync(path.join(dir,'assets',name),'utf8'));
const app=w.GeometryTextbook.createApp(d.getElementById('app'),{...bundle,allowInReview:!bundle.build.publicationReviewMatches});
const approved=bundle.build.chapters.find(c=>c.chapter===6).publicationReviewMatches;
assert.equal(d.querySelectorAll('[data-preview-notice]').length,bundle.build.publicationReviewMatches?0:1);
for(const lesson of lessons){
 assert.deepEqual(api.validateLesson(lesson,bundle.catalog.book),[],lesson.id);assert.deepEqual(viewer.validateModel(lesson.visualization.model),[],lesson.id);
 assert.equal(lesson.status,approved?'reviewed':'in-review');assert.equal(api.lessonTitle(lesson),expectedTitle(lesson));
 const s=lesson.source,n=Number(s.point||s.exercise),expected=s.collection==='selfcheck'?null:s.collection==='theory'?(n<=47?1:n<=50?2:3):n<=470?1:n<=501?2:n<=519?3:null;
 const location=api.sourceLocation(s,bundle.sourceInventory);assert(location.startsWith('К главе VI «Четырёхугольники»'));
 if(expected){const p=paragraphs.find(p=>p.number===expected);assert(location.includes('К параграфу §'+p.number+' «'+p.title+'»'),lesson.id);}
 else assert(!location.includes('К параграфу'),'No invented paragraph for additional tasks or chapter review');
 assert(app.open(lesson.id));assert.equal(d.querySelector('main h1').textContent,expectedTitle(lesson));assert.equal(d.querySelector('.lesson-permalink').getAttribute('href'),'#'+lesson.id);
}
for(const chapter of ['I','VI']){
 const question=bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='selfcheck'&&l.source.exercise==='1');
 app.open(question.id);const input=d.getElementById('final-answer');input.value='Черновик главы '+chapter;input.dispatchEvent(new w.Event('input',{bubbles:true}));
}
for(const chapter of ['I','VI']){const q=bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='selfcheck'&&l.source.exercise==='1');app.open(q.id);assert.equal(d.getElementById('final-answer').value,'Черновик главы '+chapter);}
const publicInspection=api.inspectBundle(bundle.catalog,bundle.lessons);assert.equal([...publicInspection.available.values()].filter(l=>l.source.chapter==='VI').length,approved?138:0,'Only independently approved VI cards appear publicly');
app.destroy();dom.window.close();console.log(JSON.stringify({gate:'CHAPTER_VI_CAPTIONS_OK',cards:138,paragraphs:3,domJourneys:138,independentApproval:false}));
