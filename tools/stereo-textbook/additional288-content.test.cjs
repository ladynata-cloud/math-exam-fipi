'use strict';
// Source/progression/retention boundary for the six additional prism tasks.
// Mathematical oracles, independent review and actual pixels are separate gates.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'stereo-course/textbook/lessons');
const baseline=require('./additional288-baseline.cjs'),{sha,published,ids}=baseline;
const later=require('./additional294-baseline.cjs');
const currentIndex=require(root+'/stereo-course/textbook/source-index.json');
const sourceIndex=later.previousIndex(currentIndex);
const production=later.previousCourse(require(root+'/stereo-course/textbook/data/course.json'),currentIndex);
const registry=later.previousRegistry(require('./content-review.json')),screenshots=later.previousCases(require('./browser-cases.cjs'));
const report=require(root+'/docs/reviews/ATANASYAN_POLYHEDRA_288_293_CONTENT.json');
const API=require(root+'/stereo-course/textbook/assets/engine.js');
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const content=card=>{const copy=structuredClone(card);delete copy.status;delete copy.review;return copy;};
const exact=(actual,expected,label)=>{assert.equal(new Set(actual).size,actual.length,label+' unique');assert.deepEqual([...actual].sort(),[...expected].sort(),label);};
const helpers=items=>items.flatMap(item=>[item,...helpers(item.children||[])]);
const expected=[...ids],cards=expected.map(id=>JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8')));
const previous=baseline.previousCourse(production,sourceIndex);
baseline.previousRegistry(registry);baseline.previousCases(screenshots);
const corruptCourse=structuredClone(production);corruptCourse.lessons.find(c=>!ids.has(c.id)).title+=' changed';assert.throws(()=>baseline.previousCourse(corruptCourse,sourceIndex),/complete prior 479/);
const corruptRegistry=structuredClone(registry);corruptRegistry.cards[0].sha256='0'.repeat(64);assert.throws(()=>baseline.previousRegistry(corruptRegistry),/complete prior review/);
const corruptIndex=structuredClone(sourceIndex);corruptIndex.entries[0].source.printedPages=[999];assert.throws(()=>baseline.previousIndex(corruptIndex),/exact source index/);
const corruptCases=new Map(screenshots);corruptCases.set([...corruptCases.keys()][0],'changed-historical-case');assert.throws(()=>baseline.previousCases(corruptCases),/all 997 prior browser cases/);
assert.equal(sha([...screenshots].filter(([key])=>ids.has(key.split('|')[0]))),'7db73270fc1e9ec1dfe6db8fc69f2f530f0d08d467dca8ae7ff4fa1b62a98395','exact additive screenshot inventory');
const rawPrevious=fs.readdirSync(dir).filter(name=>name.endsWith('.json')&&!ids.has(name.slice(0,-5))&&!later.ids.has(name.slice(0,-5))&&!require('./additional299-baseline.cjs').ids.has(name.slice(0,-5))).sort().map(name=>[name,hash(fs.readFileSync(path.join(dir,name)))]);
assert.equal(rawPrevious.length,479);assert.equal(sha(rawPrevious),published.rawLessonManifestSHA256,'all 479 prior authored files byte-identical');
for(const[file,value]of Object.entries(published.immutableFiles))assert.equal(hash(fs.readFileSync(path.join(root,file))),value,'immutable runtime/schema/builder '+file);
assert.equal(previous.lessons.length,479);assert.equal(previous.catalog.entries.length,1368);
assert.equal(registry.cards.length,485);assert.equal(registry.batches.length,24);
exact(registry.batches.at(-1).cardIds,expected,'one exact independent review batch');
exact(production.lessons.filter(c=>!previous.lessons.some(old=>old.id===c.id)).map(c=>c.id),expected,'only six additional tasks');
assert.equal(report.authorBase,published.commit);
assert.equal(report.verdict,'PASS_INDEPENDENT_SOURCE_MATHEMATICS_AND_WRITTEN_PEDAGOGY');
assert.equal(report.authorReviewerSeparation.reviewerAuthoredLessons,false);
assert(Number.isFinite(Date.parse(report.reviewedAt)),'independent review timestamp');
exact(report.cards.map(c=>c.id),expected,'independent reviewed IDs');

const Ajv=require('ajv/dist/2020'),ajv=new Ajv({allErrors:true,strict:true});require('ajv-formats')(ajv);
const validate=ajv.compile(require(root+'/stereo-course/textbook/schema/lesson.schema.json'));
const{JSDOM}=require('jsdom'),dom=new JSDOM('<div id="app"></div><div id="model"></div>',{url:'https://example.test/stereo-course/textbook/',pretendToBeVisual:true,runScripts:'outside-only'}),win=dom.window;
for(const file of ['math-text.js','task-scene-viewer.js'])win.eval(fs.readFileSync(root+'/stereo-course/assets/'+file,'utf8'));
const allById=new Map(production.lessons.map(c=>[c.id,c]));
let steps=0,views=0;
for(const card of cards){
 const id=card.id,n=card.source.exercise;
 assert(validate(card),id+JSON.stringify(validate.errors));assert.deepEqual(API.validateLesson(card,production.catalog.book),[],id);
 assert.deepEqual(allById.get(id),card,id+': exact integrated record');
 assert.equal(sha(content(card)),report.cards.find(c=>c.id===id).sha256,id+': content bound to independent review');
 assert.equal(card.status,'reviewed');for(const field of ['source','mathematics','pedagogy'])assert.equal(card.review[field],'passed');
 assert.equal(card.source.collection,'main');assert.equal(card.source.chapter,'III. Многогранники');
 assert.deepEqual(card.source.printedPages,[86]);assert.deepEqual(card.source.pdfPages,[88]);assert.equal(card.source.subpart,undefined);
 const source=sourceIndex.entries.find(e=>e.id==='source-main-'+n.padStart(4,'0'));
 assert(source);assert.deepEqual(source.sourceSubparts,[]);assert.deepEqual(source.requiredParts,[null]);
 const catalogRows=production.catalog.entries.filter(e=>e.source.collection==='main'&&e.source.exercise===n);
 assert.equal(catalogRows.length,1);assert.equal(catalogRows[0].id,id);assert.equal(catalogRows[0].status,'reviewed');
 assert.equal(card.answer.mode,n==='292'?'exact':'manual',id+': formulas and proofs require written assessment');
 assert(card.answer.prompt.length>25,id+': specific answer instruction');
 const model=card.visualization.model,used=new Set(['neutral']),help=helpers(card.help),references=[];
 for(const h of help){used.add(h.view||'neutral');references.push(...h.theoryIds||[]);}
 for(const s of card.steps){used.add(s.view||'neutral');references.push(...s.justifications.map(j=>j.theoryId).filter(Boolean));}
 assert(references.length>0,id+': contextual theory');for(const ref of references)assert.equal(allById.get(ref)?.kind,'theory',id+': available theory '+ref);
 exact([...used],Object.keys(model.views),id+': every authored view reachable');
 const captured=new Set();
 for(const[key]of screenshots){const[owner,stage]=key.split('|');if(owner!==id)continue;
  if(stage==='condition')captured.add('neutral');
  else if(stage.startsWith('step-')){const step=card.steps.find(s=>s.id===stage);assert(step,id+': known captured step');captured.add(step.view||'neutral');}
  else if(stage.startsWith('help:')){const hint=help.find(h=>h.id===stage.slice(5));assert(hint,id+': known captured hint');captured.add(hint.view||'neutral');}
 }
 assert(screenshots.has(id+'|condition'));assert(screenshots.has(id+'|'+card.steps.at(-1).id),id+': complete final proof capture');
 exact([...captured],Object.keys(model.views),id+': every model state captured at both browser widths');
 const mount=win.TaskSceneViewer.mount(win.document.getElementById('model'),model);
 for(const view of used){assert(mount.setView(view));assert(!/NaN|Infinity/.test(win.document.querySelector('#model svg').outerHTML),id+': finite '+view);}mount.destroy();
 function display(value,at){if(typeof value==='string'){
  assert(!/[А-Яа-яЁё]\d/u.test(value),id+at+': readable number spacing');
  if(value.includes('/')){const node=win.document.createElement('div');win.StereoMath.appendText(node,value);for(const f of node.querySelectorAll('.stereo-fraction'))f.remove();assert(!node.textContent.includes('/'),id+at+': arithmetic ratios use fraction bars');}
 }else if(Array.isArray(value))value.forEach((x,i)=>display(x,at+'.'+i));else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))display(v,at+'.'+k);}
 for(const[k,v]of Object.entries(card))if(!['source','review'].includes(k))display(v,'.'+k);
 steps+=card.steps.length;views+=used.size;
}
assert.equal(steps,33);assert.equal(views,33);assert.equal(screenshots.size,1033,'997 old cases and 36 additional cases');
const full=API.inspectBundle(production.catalog,production.lessons);assert.deepEqual(full.issues,[]);
assert.equal(full.available.size,485);assert.equal(production.catalog.entries.length,1368);
assert.equal(full.coverage.availableExercises,293);assert.equal(full.coverage.availableTheoryPoints,37);assert.equal(full.coverage.availableSelfchecks,40);assert.equal(full.coverage.partiallyAvailable,0);
for(const id of expected){
 const copy=structuredClone(production);copy.catalog.entries.find(e=>e.id===id).status='draft';copy.lessons=copy.lessons.filter(c=>c.id!==id);
 const result=API.inspectBundle(copy.catalog,copy.lessons);assert.deepEqual(result.issues,[]);assert.equal(result.available.size,484);assert.equal(result.coverage.availableExercises,292);assert.equal(result.coverage.partiallyAvailable,0);
}
const pending=structuredClone(cards);for(const card of pending){card.status='in-review';card.review={source:'pending',mathematics:'pending',pedagogy:'pending'};}
const pendingCatalog={...production.catalog,entries:pending.map(card=>Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,card[k]])))};
assert.equal(API.inspectBundle(pendingCatalog,pending).available.size,0,'unreviewed additional tasks cannot publish');

// Actual interaction: retained earlier steps and written proofs never certified.
const appRoot=win.document.getElementById('app'),app=API.createApp(appRoot,production);
for(const card of cards){
 assert(app.open(card.id));const next=[...appRoot.querySelectorAll('button')].find(b=>b.textContent==='Разобрать по шагам');assert(next);
 for(let i=0;i<card.steps.length;i++)next.click();assert.equal(appRoot.querySelectorAll('[data-step]').length,card.steps.length);
 const form=appRoot.querySelector('[data-final-form]'),field=form.querySelector('textarea,input');assert(field);
 field.value=card.source.exercise==='292'?'4,8':'Пробная запись рассуждения.';field.dispatchEvent(new win.Event('input',{bubbles:true}));form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 const stateKey='mathExamTextbook.v1:'+production.catalog.book.id+':'+card.id+':r'+card.revision,saved=JSON.parse(win.localStorage.getItem(stateKey));
 assert.equal(saved.checked,card.source.exercise==='292',card.id+': numeric answer only can be automatically checked');
 assert.equal(saved.revealed,card.steps.length);assert.equal(saved.draft,field.value,card.id+': entered answer retained');
}
app.destroy();dom.window.close();
console.log('ATANASYAN_ADDITIONAL_288_293_CONTENT_OK',cards.length,'cards',steps,'steps',views,'states; all prior479 exact; source1–293 complete');
module.exports={cards:cards.length,steps,views};
