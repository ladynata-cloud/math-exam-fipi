'use strict';
// Reviewed symmetry regressions. Partial source coverage must stay visible.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'stereo-course/textbook/lessons');
const Ajv=require('ajv/dist/2020'),ajv=new Ajv({allErrors:true,strict:true});
require('ajv-formats')(ajv);
const schema=ajv.compile(require(root+'/stereo-course/textbook/schema/lesson.schema.json'));
const API=require(root+'/stereo-course/textbook/assets/engine.js');
const {JSDOM}=require('jsdom'),manifest=require('./pending-symmetry/manifest.json');
const production=require(root+'/stereo-course/textbook/data/course.json');
const sourceIndex=require(root+'/stereo-course/textbook/source-index.json');
const screenshotCases=require('./browser-cases.cjs');
const cards=manifest.cards.map(id=>require(path.join(dir,id+'.json')));
assert.equal(cards.length,15);assert.equal(new Set(manifest.cards).size,15);
assert.equal(manifest.status,'reviewed-partial');
const allById=new Map(production.lessons.map(c=>[c.id,c]));
const dom=new JSDOM('<div id="m"></div>',{pretendToBeVisual:true,runScripts:'outside-only'});
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/task-scene-viewer.js','utf8'));
let steps=0,views=0;
for(const c of cards){
 assert(schema(c),c.id+JSON.stringify(schema.errors));
 assert.deepEqual(API.validateLesson(c,production.catalog.book),[],c.id);
 assert.equal(c.status,'reviewed');
 for(const field of ['source','mathematics','pedagogy'])assert.equal(c.review[field],'passed',c.id+': '+field);
 assert.deepEqual(allById.get(c.id),c,'integrated content matches authored record: '+c.id);
 const refs=[];
 const used=new Set(['neutral',...c.steps.map(s=>s.view)].filter(Boolean));
 function help(items){for(const h of items){if(h.view)used.add(h.view);refs.push(...h.theoryIds||[]);help(h.children||[]);}}
 help(c.help);
 for(const s of c.steps)for(const j of s.justifications)if(j.theoryId)refs.push(j.theoryId);
 for(const id of refs)assert.equal(allById.get(id)?.kind,'theory',c.id+': available theory '+id);
 if(c.kind==='exercise')assert(refs.length>0,c.id+': contextual theory is linked');
 const mount=dom.window.TaskSceneViewer.mount(dom.window.document.getElementById('m'),c.visualization.model);
 for(const v of Object.keys(c.visualization.model.views)){
  assert(used.has(v),c.id+': unreachable view '+v);
  assert(mount.setView(v));assert(!/NaN|Infinity/.test(dom.window.document.querySelector('svg').outerHTML));views++;
 }
 const captured=new Set();
 for(const [key]of screenshotCases){
  const [id,stage]=key.split('|');if(id!==c.id)continue;
  if(stage==='condition')captured.add('neutral');
  else if(stage.startsWith('step-'))captured.add(c.steps.find(s=>s.id===stage)?.view||'neutral');
 }
 assert(screenshotCases.has(c.id+'|condition'),c.id+': production condition screenshot');
 assert.deepEqual([...captured].sort(),Object.keys(c.visualization.model.views).sort(),c.id+': production screenshots cover every view');
 mount.destroy();steps+=c.steps.length;
 for(const name of c.visualization.model.neutralPoints)assert(c.visualization.model.points[name]);
}
const expected={'276':['а','б','в','г'],'277':['а','б','в'],'278':['а','б','в · боковое ребро не равно стороне основания','в · все рёбра равны']};
for(const [n,parts]of Object.entries(expected)){
 assert.deepEqual(cards.filter(c=>c.source.exercise===n).map(c=>c.source.subpart),parts);
 const source=sourceIndex.entries.find(e=>e.source.collection==='main'&&e.source.exercise===n);
 assert.deepEqual(source.requiredParts,parts,'complete reviewed source contract '+n);
 assert.deepEqual(manifest.reviewedSourceContracts[n],parts);
 const entries=production.catalog.entries.filter(e=>e.source.collection==='main'&&e.source.exercise===n);
 assert.equal(entries.length,parts.length);assert(entries.every(e=>e.status==='reviewed'));
 assert.deepEqual(source.sourceSubparts,n==='276'?['а','б','в','г']:['а','б','в'],'original lettering remains source metadata');
}
const readyParts=['center','axis','plane','figure'];
const pendingParts=['parallelepiped-examples','unbounded-examples','general-solids-examples','applications-elements'];
const theoryContract=[...readyParts,...pendingParts];
const source35=sourceIndex.entries.find(e=>e.source.collection==='theory'&&e.source.point==='35');
assert.deepEqual(source35.requiredParts,theoryContract,'point35 includes uncompleted source components');
assert.deepEqual(manifest.reviewedSourceContracts['35'],theoryContract);
const point35=production.catalog.entries.filter(e=>e.source.collection==='theory'&&e.source.point==='35');
assert.equal(point35.length,8);
assert.deepEqual(point35.filter(e=>e.status==='reviewed').map(e=>e.source.subpart).sort(),[...readyParts].sort());
assert.deepEqual(point35.filter(e=>e.status==='draft').map(e=>e.source.subpart).sort(),[...pendingParts].sort());
const coverage=API.inspectBundle(production.catalog,production.lessons).coverage;
assert.equal(coverage.availableTheoryPoints,34,'four definitions cannot complete point35');
assert.equal(coverage.partiallyAvailable,1);assert.equal(coverage.availableExercises,273);
assert.equal(production.catalog.entries.length,1341,'four missing theory components stay inventoried');
// This isolated mutation tests the real guard; it never changes authored files.
const unreviewed=structuredClone(cards);
for(const c of unreviewed){c.status='in-review';c.review={source:'pending',mathematics:'pending',pedagogy:'pending'};}
const catalog={...production.catalog,entries:unreviewed.map(c=>Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,c[k]])))};
assert.equal(API.inspectBundle(catalog,unreviewed).available.size,0,'unreviewed drafts remain unavailable to pupils');
const byId=id=>cards.find(c=>c.id===id);
assert.match(byId('ex-main-0277-a').steps.at(-1).explanation,/бесконечно/);
assert.match(byId('ex-main-0277-c').steps.at(-1).explanation,/Ответ: 9/);
assert.match(byId('ex-main-0278-c').steps[1].explanation,/3/);
assert.match(byId('ex-main-0278-c-regular').steps.at(-1).explanation,/Ответ: 6/);
assert.equal(steps,50);assert.equal(views,43);dom.window.close();
console.log('ATANASYAN_SYMMETRY_CONTENT_OK',cards.length,'cards',steps,'steps',views,'reachable views; point35 remains partial');
