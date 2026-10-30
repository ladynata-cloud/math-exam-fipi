'use strict';
// Independent source-map caption expectations; this preview never grants approval.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{expectedTitle}=require('./caption_expectations.cjs');
assert(process.argv[2],'Pass the isolated review root');
const root=path.resolve(process.argv[2]),dir=path.join(root,'geometry-course/textbook');
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'chapter-07-source-map.json')));
const bundle=JSON.parse(fs.readFileSync(path.join(dir,'data/course.json'))),api=require(path.join(dir,'assets/engine.js')),viewer=require(path.join(dir,'assets/planar-viewer.js'));
const lessons=bundle.lessons.filter(l=>l.source.chapter==='VII');
assert.equal(lessons.length,source.counts.cards);assert.equal(bundle.lessons.length,bundle.build.chapters.some(c=>c.chapter===8)?1247:893+source.counts.cards);
const paragraphs=bundle.sourceInventory.paragraphs.filter(p=>p.chapter===7);
assert.deepEqual(paragraphs,source.paragraphs,'Exact independently read VII paragraph map');assert.equal(paragraphs.length,3);
const approved=bundle.build.chapters.find(c=>c.chapter===7).publicationReviewMatches;
const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/geometry-course/textbook/review.html',runScripts:'outside-only'}),w=dom.window,d=w.document;
for(const name of ['math-text.js','planar-viewer.js','engine.js'])w.eval(fs.readFileSync(path.join(dir,'assets',name),'utf8'));
const app=w.GeometryTextbook.createApp(d.getElementById('app'),{...bundle,allowInReview:!bundle.build.publicationReviewMatches});
assert.equal(d.querySelectorAll('[data-preview-notice]').length,bundle.build.publicationReviewMatches?0:1);
for(const lesson of lessons){
 assert.deepEqual(api.validateLesson(lesson,bundle.catalog.book),[],lesson.id);assert.deepEqual(viewer.validateModel(lesson.visualization.model),[],lesson.id);
 assert.equal(lesson.status,approved?'reviewed':'in-review');assert.equal(api.lessonTitle(lesson),expectedTitle(lesson));
 const s=lesson.source,n=Number(s.point||s.exercise),field=s.collection==='theory'?'pointNumbers':'exerciseNumbers';
 const expected=s.collection==='selfcheck'?null:source.paragraphs.find(p=>n>=p[field][0]&&n<=p[field][1]);
 const location=api.sourceLocation(s,bundle.sourceInventory);assert(location.startsWith('К главе VII «Площадь»'));
 if(expected)assert(location.includes('К параграфу §'+expected.number+' «'+expected.title+'»'),lesson.id);
 else assert(!location.includes('К параграфу'),'No invented paragraph for additional tasks or chapter review');
 assert(app.open(lesson.id));assert.equal(d.querySelector('main h1').textContent,expectedTitle(lesson));assert.equal(d.querySelector('.lesson-permalink').getAttribute('href'),'#'+lesson.id);
 assert.equal(d.querySelectorAll('[data-main-model] svg').length,1);
}
for(const chapter of ['I','VI','VII']){
 const q=bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='selfcheck'&&l.source.exercise==='1');
 app.open(q.id);const input=d.getElementById('final-answer');input.value='Черновик главы '+chapter;input.dispatchEvent(new w.Event('input',{bubbles:true}));
}
for(const chapter of ['I','VI','VII']){
 const q=bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='selfcheck'&&l.source.exercise==='1');app.open(q.id);assert.equal(d.getElementById('final-answer').value,'Черновик главы '+chapter);
}
const publicInspection=api.inspectBundle(bundle.catalog,bundle.lessons);
assert.equal([...publicInspection.available.values()].filter(l=>l.source.chapter==='VII').length,approved?190:0,'VII candidate leaked into ordinary public entry');
const preview=api.inspectBundle(bundle.catalog,bundle.lessons,{allowInReview:true});
assert.equal(preview.available.size,bundle.lessons.length);assert.deepEqual(preview.issues,[]);
app.destroy();dom.window.close();console.log(JSON.stringify({gate:'CHAPTER_VII_CANDIDATE_CAPTIONS_OK',cards:lessons.length,paragraphs:3,domJourneys:lessons.length,independentApproval:false}));
