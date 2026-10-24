'use strict';
// Exact continuation boundary, source lettering and prior435 preservation.
// Source/mathematics review and actual cloud images remain independent gates.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'stereo-course/textbook/lessons');
const manifest=require('./polyhedra-symmetry-manifest.json');
const sourceIndex=require(root+'/stereo-course/textbook/source-index.json'),baseline=require('./selfcheck-baseline.cjs');
const production=baseline.previousCourse(require(root+'/stereo-course/textbook/data/course.json'),sourceIndex);
const registry=structuredClone(require('./content-review.json'));registry.cards=registry.cards.filter(c=>!baseline.ids.has(c.id));
const API=require(root+'/stereo-course/textbook/assets/engine.js'),screenshots=require('./browser-cases.cjs');
const theoryParts=['tetrahedron-center','tetrahedron-axes','tetrahedron-planes','cube-center','cube-axes','cube-planes','cube-plane-correction','octahedron','icosahedron','dodecahedron'];
const exerciseParts={'281':[null],'282':[null],'283':['а','б'],'284':[null],'285':[null],'286':['а','б'],'287':['а','б','в']};
const expectedIds=[...theoryParts.map(part=>'theory-037-'+part),'ex-main-0281','ex-main-0282','ex-main-0283-a','ex-main-0283-b','ex-main-0284','ex-main-0285','ex-main-0286-a','ex-main-0286-b','ex-main-0287-a','ex-main-0287-b','ex-main-0287-c'];
const exact=(actual,expected,label)=>{assert.equal(new Set(actual).size,actual.length,label+' unique');assert.deepEqual([...actual].sort(),[...expected].sort(),label);};
assert.equal(manifest.status,'reviewed','manifest records actual completed review');
exact(manifest.cards,expectedIds,'exact21-card scope');
assert.deepEqual(manifest.expected,{cards:21,theoryCards:10,exerciseCards:11,totalCards:456,completeTheoryPoints:37,completeExercises:282,selfchecks:26,catalogEntries:1364});
const cards=manifest.cards.map(id=>JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8'))),ids=new Set(expectedIds),allById=new Map(production.lessons.map(c=>[c.id,c]));
assert.equal(cards.filter(c=>c.kind==='theory'&&c.source.point==='37').length,10);
assert.equal(cards.filter(c=>c.kind==='exercise').length,11);
const canon=x=>x&&typeof x==='object'?Array.isArray(x)?x.map(canon):Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
const old=production.lessons.filter(c=>!ids.has(c.id));
assert.equal(old.length,435,'prior435-card boundary');
assert.equal(sha([...old].sort((a,b)=>a.id.localeCompare(b.id))),'f6d83a12a97204d17e2e80c7830ccb881054bd41960316d4d8529b6a54cae4b0','exact prior435 records, including review metadata, from head9215006');
const oldReviews=registry.cards.filter(c=>!ids.has(c.id));assert.equal(oldReviews.length,435);
assert.equal(sha(oldReviews),'a26459d230b23a999b9c9b55def6e0639a04defcbfa2439f83592e71c6612ab7','prior435 review rows preserved');
assert.equal(sha(registry.batches.slice(0,20)),'bd77c396113d34b6bda2c7a7fec1a494304c299c864390eeaff675a881ad61e8','prior20 review batches preserved');
const Ajv=require('ajv/dist/2020'),ajv=new Ajv({allErrors:true,strict:true});require('ajv-formats')(ajv);
const validate=ajv.compile(require(root+'/stereo-course/textbook/schema/lesson.schema.json'));
const {JSDOM}=require('jsdom'),dom=new JSDOM('<div id="model"></div>',{pretendToBeVisual:true,runScripts:'outside-only'});
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/math-text.js','utf8'));
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/task-scene-viewer.js','utf8'));
let steps=0,views=0;
for(const card of cards){
 assert(validate(card),card.id+JSON.stringify(validate.errors));assert.deepEqual(API.validateLesson(card,production.catalog.book),[],card.id);
 assert.equal(card.status,'reviewed');for(const field of ['source','mathematics','pedagogy'])assert.equal(card.review[field],'passed',card.id+': independent '+field+' review');
 assert.deepEqual(allById.get(card.id),card,card.id+': exact integrated record');
 function display(value,at){if(typeof value==='string'){
  assert(!/[А-Яа-яЁё]\d/u.test(value),card.id+at+': readable number spacing');
  if(value.includes('/')){const node=dom.window.document.createElement('div');dom.window.StereoMath.appendText(node,value);for(const fraction of node.querySelectorAll('.stereo-fraction'))fraction.remove();assert(!node.textContent.includes('/'),card.id+at+': arithmetic ratios use actual fraction bars');}
 }else if(Array.isArray(value))value.forEach((x,i)=>display(x,at+'.'+i));else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))display(v,at+'.'+k);}
 for(const [k,v]of Object.entries(card))if(!['source','review'].includes(k))display(v,'.'+k);
 const model=card.visualization.model,used=new Set(['neutral']),refs=[];
 const bodyNames=new Set(model.edges.flat()),givenHelpers=new Set(card.id.startsWith('ex-main-0283-')?['G']:[]);
 const initial=new Set([...(model.labelNames||[]),...(model.neutralPoints||[]),...model.edges.flat(),...(model.faces||[]).flat(),...(model.views.neutral.points||[]),...(model.views.neutral.segments||[]).flat(),...(model.views.neutral.polygon||[])]);
 for(const name of Object.keys(model.points))if(!bodyNames.has(name)&&!givenHelpers.has(name))assert(!initial.has(name),card.id+': helper introduced progressively '+name);
 for(const name of givenHelpers)assert(initial.has(name),card.id+': source-given center is initially shown');
 function helps(items){for(const item of items){used.add(item.view||'neutral');refs.push(...item.theoryIds||[]);helps(item.children||[]);}}helps(card.help);
 for(const step of card.steps){used.add(step.view||'neutral');for(const j of step.justifications)if(j.theoryId)refs.push(j.theoryId);}
 assert(refs.length>0,card.id+': contextual theory');for(const id of refs)assert.equal(allById.get(id)?.kind,'theory',card.id+': available theory '+id);
 exact([...used],Object.keys(model.views),card.id+': every model view reachable');
 const mount=dom.window.TaskSceneViewer.mount(dom.window.document.getElementById('model'),model);
 for(const view of used){assert(mount.setView(view));assert(!/NaN|Infinity/.test(dom.window.document.querySelector('svg').outerHTML),card.id+': finite geometry '+view);}mount.destroy();
 const captured=new Set();for(const [key]of screenshots){const [id,stage]=key.split('|');if(id!==card.id)continue;if(stage==='condition')captured.add('neutral');else if(stage.startsWith('step-')){const step=card.steps.find(s=>s.id===stage);assert(step,card.id+': captured step exists');captured.add(step.view||'neutral');}else if(stage.startsWith('help:')){const find=items=>{for(const item of items){if(item.id===stage.slice(5))return item;const found=find(item.children||[]);if(found)return found;}};const item=find(card.help);assert(item);captured.add(item.view||'neutral');}}
 assert(screenshots.has(card.id+'|condition'),card.id+': initial screenshot');exact([...captured],Object.keys(model.views),card.id+': all authored states in actual browser capture plan');
 steps+=card.steps.length;views+=used.size;
}
assert.deepEqual(manifest.reviewedSourceContracts,{'37':theoryParts,...exerciseParts},'exact reviewed source contract');
for(const [n,parts]of Object.entries(manifest.reviewedSourceContracts)){
 const collection=n==='37'?'theory':'main',field=n==='37'?'point':'exercise';
 const source=sourceIndex.entries.find(e=>e.source.collection===collection&&e.source[field]===n);assert(source,'source '+n);assert.deepEqual(source.requiredParts,parts,'required parts '+n);
 if(n!=='37')assert.deepEqual(source.sourceSubparts,parts[0]===null?[]:parts,'original Cyrillic source lettering '+n);
 const entries=production.catalog.entries.filter(e=>e.source.collection===collection&&e.source[field]===n);assert.equal(entries.length,parts.length);assert(entries.every(e=>e.status==='reviewed'));
 exact(entries.map(e=>e.source.subpart??'__whole__'),parts.map(p=>p??'__whole__'),'complete catalog parts '+n);
}
const full=API.inspectBundle(production.catalog,production.lessons);assert.deepEqual(full.issues,[]);assert.equal(full.available.size,456);assert.equal(production.catalog.entries.length,1364);assert.equal(full.coverage.availableTheoryPoints,37);assert.equal(full.coverage.availableExercises,282);assert.equal(full.coverage.availableSelfchecks,26);assert.equal(full.coverage.partiallyAvailable,0);
// Any missing required component must stop point37 from being counted complete.
for(const part of theoryParts){const withheld='theory-037-'+part,copy=structuredClone(production);for(const entry of copy.catalog.entries)if(entry.id===withheld)entry.status='draft';copy.lessons=copy.lessons.filter(c=>c.id!==withheld);const r=API.inspectBundle(copy.catalog,copy.lessons);assert.equal(r.coverage.availableTheoryPoints,36,withheld+': incomplete point37');assert.equal(r.coverage.partiallyAvailable,1,withheld+': remaining point37 components are partial');}
const unpublished=structuredClone(cards);for(const card of unpublished){card.status='in-review';card.review={source:'pending',mathematics:'pending',pedagogy:'pending'};}
const unpublishedCatalog={...production.catalog,entries:unpublished.map(card=>Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,card[k]])))};assert.equal(API.inspectBundle(unpublishedCatalog,unpublished).available.size,0,'unreviewed new cards cannot publish');
assert.equal(cards.find(c=>c.id==='ex-main-0282').answer.mode,'exact');assert.deepEqual(cards.find(c=>c.id==='ex-main-0282').answer.accepted,['90']);
for(const id of expectedIds.filter(id=>id.startsWith('ex-')&&id!=='ex-main-0282'))assert.equal(cards.find(c=>c.id===id).answer.mode,'manual',id+': written proof/formula remains manual');
dom.window.close();console.log('ATANASYAN_POLYHEDRA_SYMMETRY_CONTENT_OK',cards.length,'cards',steps,'steps',views,'states; prior435 exact; point37 and281–287 complete');
