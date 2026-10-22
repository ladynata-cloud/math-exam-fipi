'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),course=path.join(root,'geometry-course/textbook');
const bundle=JSON.parse(fs.readFileSync(path.join(course,'data/course.json'),'utf8'));
const engine=require(path.join(course,'assets/engine.js')),viewer=require(path.join(course,'assets/planar-viewer.js'));
const prep=JSON.parse(fs.readFileSync(path.join(course,'preparation/chapter-01.json'),'utf8'));
assert.equal(bundle.catalog.book.id,'atanasyan-2023-7-9');
assert.equal(bundle.catalog.book.pdfPageOffset,1);
assert.equal(bundle.build.fullTextbookComplete,false);
assert.equal(bundle.catalog.inventoryComplete,false);
assert.equal(bundle.sourceInventory.summary.continuousNumberCount,1431);
const groups={main:[],theory:[],selfcheck:[]};
for(const lesson of bundle.lessons){
 assert.deepEqual(engine.validateLesson(lesson,bundle.catalog.book),[],lesson.id);
 assert.deepEqual(viewer.validateModel(lesson.visualization.model),[],lesson.id);
 groups[lesson.source.collection].push(lesson);
 if(lesson.kind==='exercise')assert.equal(lesson.answer.mode,'manual','Proofs/constructions need human reasoning review');
 for(const step of lesson.steps){
  assert.ok(lesson.visualization.model.views[step.view],lesson.id+' missing scene');
  assert.ok(step.prompt.trim()&&step.explanation.trim()&&step.justifications.every(j=>j.text.trim()),lesson.id+' missing explanation');
  for(const j of step.justifications)if(j.theoryId)assert.ok(bundle.lessons.some(l=>l.id===j.theoryId&&l.kind==='theory'),'Broken theory reference '+j.theoryId);
 }
}
assert.equal(groups.main.length,134);assert.equal(groups.theory.length,13);assert.equal(groups.selfcheck.length,26);
assert.deepEqual(groups.theory.map(l=>Number(l.source.point)),Array.from({length:13},(_,i)=>i+1));
assert.deepEqual(groups.selfcheck.map(l=>Number(l.source.exercise)),Array.from({length:26},(_,i)=>i+1));
for(const original of prep.exercises){
 const actual=groups.main.filter(l=>l.source.exercise===String(original.number));
 assert.deepEqual(actual.map(l=>l.source.subpart||'single'),original.parts.map(p=>p.part),'Missing source part '+original.number);
}
assert.equal(new Set(bundle.lessons.map(l=>l.id)).size,173);
const review=engine.inspectBundle(bundle.catalog,bundle.lessons,{allowInReview:true});
assert.equal(review.available.size,173);assert.deepEqual(review.issues,[]);
const published=engine.inspectBundle(bundle.catalog,bundle.lessons);
assert.equal(published.available.size,bundle.build.publicationReviewMatches?173:0,'Pending content leaked into public catalog');
if(process.argv.includes('--require-reviewed'))assert.equal(bundle.build.publicationReviewMatches,true,'No current publication review');
// Reject the other edition's page mapping and stale/partial content.
const wrongPage=structuredClone(bundle.lessons[0]);wrongPage.source.pdfPages=wrongPage.source.printedPages.map(p=>p+2);
assert.ok(engine.validateLesson(wrongPage,bundle.catalog.book).some(s=>s.includes('page mismatch')));
const invalid=structuredClone(bundle.lessons[0]);invalid.visualization.model.views.neutral.segments=[['absent','point']];
assert.ok(engine.validateLesson(invalid,bundle.catalog.book).length);
const duplicate=engine.inspectBundle(bundle.catalog,[...bundle.lessons,bundle.lessons[0]],{allowInReview:true});
assert.ok(!duplicate.available.has(bundle.lessons[0].id));
const withheld=structuredClone(bundle.catalog);withheld.entries[0].status='draft';
assert.ok(!engine.inspectBundle(withheld,bundle.lessons,{allowInReview:true}).available.has(withheld.entries[0].id));
console.log(JSON.stringify({gate:'ATANASYAN_7_9_COURSE_CONTENT_OK',mainNumbers:91,parts:134,theory:13,selfchecks:26,models:173,publicationReviewMatches:bundle.build.publicationReviewMatches}));
