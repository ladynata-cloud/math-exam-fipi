'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),course=path.join(root,'geometry-course/textbook');
const bundle=JSON.parse(fs.readFileSync(path.join(course,'data/course.json'),'utf8'));
const engine=require(path.join(course,'assets/engine.js')),viewer=require(path.join(course,'assets/planar-viewer.js'));
const scope=JSON.parse(fs.readFileSync(path.join(__dirname,'release-scope.json'),'utf8'));
const chapterSources=new Map(scope.chapters.filter(chapter=>chapter.chapter>=2).map(chapter=>[
 chapter.chapter,JSON.parse(fs.readFileSync(path.join(__dirname,'chapter-'+String(chapter.chapter).padStart(2,'0')+'-source-map.json'),'utf8'))
]));
const read=name=>JSON.parse(fs.readFileSync(path.join(course,name),'utf8'));
const sequence=([first,last])=>Array.from({length:last-first+1},(_,i)=>first+i);
function assertReachableViews(lesson){
 const views=lesson.visualization.model.views,stepViews=new Set();
 for(const [index,step] of lesson.steps.entries()){
  const expected='step-'+(index+1);stepViews.add(expected);
  assert.equal(step.view,expected,lesson.id+' natural step must select '+expected);
  assert.ok(Object.hasOwn(views,expected),lesson.id+' missing reachable step view '+expected);
 }
 for(const [id,view] of Object.entries(views)){
  if(id==='neutral')continue;
  if(/^step-[1-9]\d*$/.test(id)){
   assert.ok(stepViews.has(id),lesson.id+' unreferenced step view '+id);continue;
  }
  // The real viewer creates buttons only for case-*; a programmatic setView
  // can otherwise render an authored view that pupils can never reach.
  assert.ok(/^case-.+$/.test(id)&&id.slice(5).trim(),lesson.id+' unreachable authored view '+id);
  const unlock=view.availableFromStep===undefined?0:view.availableFromStep;
  assert.ok(Number.isInteger(unlock)&&unlock>=0&&unlock<=lesson.steps.length,
   lesson.id+' case unlock outside natural steps: '+id);
 }
 // Legacy neutral/step views may retain copied availableFromStep metadata.
 // The viewer ignores it there; only actual case buttons need this upper bound.
}
assert.equal(bundle.catalog.book.id,'atanasyan-2023-7-9');
assert.equal(bundle.catalog.book.pdfPageOffset,1);
assert.equal(bundle.build.fullTextbookComplete,false);
assert.equal(bundle.catalog.inventoryComplete,false);
assert.equal(bundle.sourceInventory.summary.continuousNumberCount,1431);
for(const [chapter,source] of chapterSources){
 assert.equal(source.bookId,'atanasyan-2023-7-9');assert.equal(source.chapter,chapter);
 assert.equal(source.source.sha256,'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72');
}
const groups={main:[],theory:[],selfcheck:[]};
for(const lesson of bundle.lessons){
 assert.deepEqual(engine.validateLesson(lesson,bundle.catalog.book),[],lesson.id);
 assert.deepEqual(viewer.validateModel(lesson.visualization.model),[],lesson.id);
 assertReachableViews(lesson);
 groups[lesson.source.collection].push(lesson);
 if(lesson.kind==='exercise')assert.equal(lesson.answer.mode,'manual','Proofs/constructions need human reasoning review');
 for(const step of lesson.steps){
  assert.ok(lesson.visualization.model.views[step.view],lesson.id+' missing scene');
  assert.ok(step.prompt.trim()&&step.explanation.trim()&&step.justifications.every(j=>j.text.trim()),lesson.id+' missing explanation');
  for(const j of step.justifications)if(j.theoryId)assert.ok(bundle.lessons.some(l=>l.id===j.theoryId&&l.kind==='theory'),'Broken theory reference '+j.theoryId);
 }
}
assert.deepEqual(bundle.build.chapters.map(c=>c.chapter),scope.chapters.map(c=>c.chapter),'Explicit release scope');
assert.equal(scope.totalCards,[...scope.chapters,...(scope.supplements||[])].reduce((total,c)=>total+c.cards,0));
for(const chapter of scope.chapters){
 const source=bundle.sourceInventory.chapters.find(c=>c.chapter===chapter.chapter),prefix='preparation/chapter-'+String(chapter.chapter).padStart(2,'0');
 const independentSource=chapterSources.get(chapter.chapter);
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
  if(independentSource){
   const independentlyChecked=independentSource.exercises.find(e=>e.number===original.number);assert(independentlyChecked,'Independently inventoried exercise '+original.number);
   assert.deepEqual(original.parts.map(p=>p.part),independentlyChecked.parts,'Independent source subparts '+original.number);
   assert.deepEqual(original.printedPages,independentlyChecked.printedPages,'Independent source pages '+original.number);
  }
 }
 if(independentSource){
  assert.deepEqual(independentSource.exercises.map(item=>item.number),sequence(source.exerciseNumbers),'Complete independent exercise inventory');
  assert.equal(chapter.cards,independentSource.counts.cards);assert.equal(chapter.mainParts,independentSource.counts.mainParts);
  for(const [prepared,independent] of [[theory.theory,independentSource.theory],[theory.selfchecks,independentSource.selfchecks]]){
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

const supplements=scope.supplements||[];
assert.deepEqual((bundle.build.supplements||[]).map(s=>s.key),supplements.map(s=>s.key),'Explicit supplementary scope');
assert(supplements.length<=1,'No adjacent book sections are implicitly authorized');
for(const supplement of supplements){
 assert.equal(supplement.key,'7-advanced');assert.equal(supplement.label,'7 класс · повышенная трудность');
 assert.deepEqual(supplement.exerciseNumbers,[413,461]);
 const source=JSON.parse(fs.readFileSync(path.join(__dirname,'grade-07-advanced-source-map.json'),'utf8'));
 assert.equal(source.bookId,'atanasyan-2023-7-9');
 assert.equal(source.source.sha256,'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72');
 assert.deepEqual(source.exercises.map(e=>e.number),sequence(supplement.exerciseNumbers),'All advanced source numbers');
 const files=fs.readdirSync(path.join(course,'preparation')).filter(name=>/^grade-07-advanced(?:-[a-z])?\.json$/.test(name));
 const exercises=files.flatMap(name=>read('preparation/'+name).exercises).sort((a,b)=>a.number-b.number);
 assert.deepEqual(exercises.map(e=>e.number),sequence(supplement.exerciseNumbers),'No duplicated/missing advanced preparation');
 const actual=bundle.lessons.filter(l=>l.source.chapter===supplement.label);
 assert(actual.every(l=>l.source.collection==='main'),'Advanced section is not fabricated theory or another chapter');
 assert.equal(actual.length,supplement.mainParts);assert.equal(actual.length,supplement.cards);
 assert.equal(actual.length,source.counts.cards);assert.equal(source.counts.mainNumbers,49);
 assert.equal(source.counts.mainParts,actual.length);
 for(const exercise of exercises){
  const checked=source.exercises.find(e=>e.number===exercise.number);
  assert.deepEqual(exercise.parts.map(p=>p.part),checked.parts,'Advanced exact source parts '+exercise.number);
  assert.deepEqual(exercise.printedPages,checked.printedPages,'Advanced exact pages '+exercise.number);
  const cards=actual.filter(l=>l.source.exercise===String(exercise.number));
  assert.deepEqual(cards.map(l=>l.id),checked.parts.map((_,i)=>'atanasyan-7-9-main-'+exercise.number+'-part-'+(i+1)));
  assert.deepEqual(cards.map(l=>l.source.subpart||'single'),checked.parts);
  for(const card of cards){
   assert.deepEqual(card.source.printedPages,checked.printedPages);assert.deepEqual(card.source.pdfPages,checked.printedPages.map(p=>p+1));
   assert.equal(card.source.advancedGrade,7);assert.deepEqual(card.source.relatedChapters,checked.relatedChapters,'Exact related chapter group '+exercise.number);
   assert.equal(card.revision,1,'Stable new advanced work namespace');
  }
 }
 const build=bundle.build.supplements.find(s=>s.key===supplement.key);
 assert.equal(build.authoredCards,supplement.cards);assert.equal(build.numberedExercises,49);
 assert.equal(build.theoryPoints,0);assert.equal(build.selfcheckQuestions,0);
 assert(actual.every(l=>l.status===(build.publicationReviewMatches?'reviewed':'in-review')),'Advanced cards require their own matching review');
}

assert.equal(new Set(bundle.lessons.map(l=>l.id)).size,scope.totalCards);
assert.equal(bundle.build.authoredCards,scope.totalCards);
assert.equal(bundle.build.numberedExercises,[...scope.chapters,...supplements].reduce((n,c)=>n+sequence(c.exerciseNumbers).length,0));
const review=engine.inspectBundle(bundle.catalog,bundle.lessons,{allowInReview:true});
assert.equal(review.available.size,scope.totalCards);assert.deepEqual(review.issues,[]);
const published=engine.inspectBundle(bundle.catalog,bundle.lessons);
const approvedIds=bundle.lessons.filter(l=>l.status==='reviewed').map(l=>l.id).sort();
assert.deepEqual([...published.available.keys()].sort(),approvedIds,'Pending content leaked into public catalog or reviewed chapter disappeared');
assert.equal(bundle.build.publicationReviewMatches,[...bundle.build.chapters,...(bundle.build.supplements||[])].every(c=>c.publicationReviewMatches));
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
