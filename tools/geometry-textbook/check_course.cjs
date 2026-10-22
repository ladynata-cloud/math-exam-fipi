'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),course=path.join(root,'geometry-course/textbook');
const bundle=JSON.parse(fs.readFileSync(path.join(course,'data/course.json'),'utf8'));
const engine=require(path.join(course,'assets/engine.js')),viewer=require(path.join(course,'assets/planar-viewer.js'));
const scope=JSON.parse(fs.readFileSync(path.join(__dirname,'release-scope.json'),'utf8'));
const chapterTwoSource=JSON.parse(fs.readFileSync(path.join(__dirname,'chapter-02-source-map.json'),'utf8'));
const read=name=>JSON.parse(fs.readFileSync(path.join(course,name),'utf8'));
const sequence=([first,last])=>Array.from({length:last-first+1},(_,i)=>first+i);
assert.equal(bundle.catalog.book.id,'atanasyan-2023-7-9');
assert.equal(bundle.catalog.book.pdfPageOffset,1);
assert.equal(bundle.build.fullTextbookComplete,false);
assert.equal(bundle.catalog.inventoryComplete,false);
assert.equal(bundle.sourceInventory.summary.continuousNumberCount,1431);
assert.equal(chapterTwoSource.source.sha256,'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72');
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
assert.deepEqual(bundle.build.chapters.map(c=>c.chapter),scope.chapters.map(c=>c.chapter),'Explicit release scope');
assert.equal(scope.totalCards,scope.chapters.reduce((total,c)=>total+c.cards,0));
for(const chapter of scope.chapters){
 const source=bundle.sourceInventory.chapters.find(c=>c.chapter===chapter.chapter),prefix='preparation/chapter-'+String(chapter.chapter).padStart(2,'0');
 assert.deepEqual(chapter.exerciseNumbers,source.exerciseNumbers,'Release scope agrees with exact source');
 const preparationFiles=fs.readdirSync(path.join(course,'preparation')).filter(name=>new RegExp('^chapter-'+String(chapter.chapter).padStart(2,'0')+'(?:-[a-z])?\\.json$').test(name));
 const exercises=preparationFiles.flatMap(name=>read('preparation/'+name).exercises).sort((a,b)=>a.number-b.number);
 const theory=read(prefix+'-theory.json');
 const main=groups.main.filter(l=>l.source.chapter===chapter.label),points=groups.theory.filter(l=>l.source.chapter===chapter.label),questions=groups.selfcheck.filter(l=>l.source.chapter===chapter.label);
 assert.deepEqual(exercises.map(e=>e.number),sequence(source.exerciseNumbers),'Every source number exactly once');
 assert.equal(main.length,chapter.mainParts,'Independently source-audited subpart total');
 assert.equal(points.length,sequence(chapter.theoryPoints).length);
 assert.equal(questions.length,chapter.selfcheckQuestions);assert.equal(questions.length,source.reviewQuestions.count);
 assert.deepEqual(points.map(l=>Number(l.source.point)),sequence(chapter.theoryPoints));
 assert.deepEqual(theory.theory.map(p=>p.number),sequence(chapter.theoryPoints));
 assert.deepEqual(questions.map(l=>Number(l.source.exercise)),sequence(source.reviewQuestions.numbers));
 assert.deepEqual(theory.selfchecks.map(p=>p.number),sequence(source.reviewQuestions.numbers));
 for(const original of exercises){
  const actual=main.filter(l=>l.source.exercise===String(original.number));
  assert.deepEqual(actual.map(l=>l.source.subpart||'single'),original.parts.map(p=>p.part),'Missing source part '+original.number);
  assert.deepEqual(actual.map(l=>l.id),original.parts.map((p,i)=>'atanasyan-7-9-main-'+original.number+'-part-'+(i+1)),'Stable exercise and learner-work IDs');
  if(chapter.chapter===2){
   const independentlyChecked=chapterTwoSource.exercises.find(e=>e.number===original.number);assert(independentlyChecked,'Independently inventoried exercise '+original.number);
   assert.deepEqual(original.parts.map(p=>p.part),independentlyChecked.parts,'Independent source subparts '+original.number);
   assert.deepEqual(original.printedPages,independentlyChecked.printedPages,'Independent source pages '+original.number);
  }
 }
 if(chapter.chapter===2){
  assert.equal(chapter.cards,chapterTwoSource.counts.cards);assert.equal(chapter.mainParts,chapterTwoSource.counts.mainParts);
  for(const [prepared,independent] of [[theory.theory,chapterTwoSource.theory],[theory.selfchecks,chapterTwoSource.selfchecks]]){
   assert.deepEqual(prepared.map(p=>p.number),independent.map(p=>p.number),'Independent source theory/review inventory');
   for(const item of prepared)assert.deepEqual(item.printedPages,independent.find(p=>p.number===item.number).printedPages,'Independent theory/review pages '+item.number);
  }
 }
 for(const question of questions)assert.equal(question.id,'atanasyan-7-9-selfcheck-'+(chapter.chapter===1?'':'chapter-'+chapter.chapter+'-')+question.source.exercise+'-part-1','Chapter-qualified review identity');
 const actual=bundle.lessons.filter(l=>l.source.chapter===chapter.label),build=bundle.build.chapters.find(c=>c.chapter===chapter.chapter);
 assert.equal(actual.length,chapter.cards);assert.equal(build.authoredCards,chapter.cards);assert.equal(build.numberedExercises,source.numberCount);
 assert.equal(build.theoryPoints,points.length);assert.equal(build.selfcheckQuestions,questions.length);
 assert(actual.every(l=>l.status===(build.publicationReviewMatches?'reviewed':'in-review')),'Only its own manifest can approve a chapter');
}
assert.equal(new Set(bundle.lessons.map(l=>l.id)).size,scope.totalCards);
assert.equal(bundle.build.authoredCards,scope.totalCards);
assert.equal(bundle.build.numberedExercises,scope.chapters.reduce((n,c)=>n+sequence(c.exerciseNumbers).length,0));
const review=engine.inspectBundle(bundle.catalog,bundle.lessons,{allowInReview:true});
assert.equal(review.available.size,scope.totalCards);assert.deepEqual(review.issues,[]);
const published=engine.inspectBundle(bundle.catalog,bundle.lessons);
const approvedIds=bundle.lessons.filter(l=>l.status==='reviewed').map(l=>l.id).sort();
assert.deepEqual([...published.available.keys()].sort(),approvedIds,'Pending content leaked into public catalog or reviewed chapter disappeared');
assert.equal(bundle.build.publicationReviewMatches,bundle.build.chapters.every(c=>c.publicationReviewMatches));
if(process.argv.includes('--require-reviewed'))assert.equal(bundle.build.publicationReviewMatches,true,'No current publication review for every included chapter');
// Reject the other edition's page mapping and stale/partial content.
const wrongPage=structuredClone(bundle.lessons[0]);wrongPage.source.pdfPages=wrongPage.source.printedPages.map(p=>p+2);
assert.ok(engine.validateLesson(wrongPage,bundle.catalog.book).some(s=>s.includes('page mismatch')));
const invalid=structuredClone(bundle.lessons[0]);invalid.visualization.model.views.neutral.segments=[['absent','point']];
assert.ok(engine.validateLesson(invalid,bundle.catalog.book).length);
const duplicate=engine.inspectBundle(bundle.catalog,[...bundle.lessons,bundle.lessons[0]],{allowInReview:true});
assert.ok(!duplicate.available.has(bundle.lessons[0].id));
const withheld=structuredClone(bundle.catalog);withheld.entries[0].status='draft';
assert.ok(!engine.inspectBundle(withheld,bundle.lessons,{allowInReview:true}).available.has(withheld.entries[0].id));
console.log(JSON.stringify({gate:'ATANASYAN_7_9_COURSE_CONTENT_OK',mainNumbers:bundle.build.numberedExercises,parts:groups.main.length,theory:groups.theory.length,selfchecks:groups.selfcheck.length,models:bundle.lessons.length,publicationReviewMatches:bundle.build.publicationReviewMatches}));
