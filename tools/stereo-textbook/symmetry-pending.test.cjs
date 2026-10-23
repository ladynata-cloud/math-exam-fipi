'use strict';
// Validate real draft records without promoting review flags or release counts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dir=path.join(__dirname,'pending-symmetry');
const Ajv=require('ajv/dist/2020'),ajv=new Ajv({allErrors:true,strict:true});
require('ajv-formats')(ajv);
const schema=ajv.compile(require(root+'/stereo-course/textbook/schema/lesson.schema.json'));
const API=require(root+'/stereo-course/textbook/assets/engine.js'),Viewer=require(root+'/stereo-course/assets/task-scene-viewer.js');
const {JSDOM}=require('jsdom'),manifest=require('./pending-symmetry/manifest.json');
const production=require(root+'/stereo-course/textbook/data/course.json');
const cards=manifest.cards.map(id=>require(path.join(dir,id+'.json')));
assert.equal(cards.length,15);assert.equal(new Set(manifest.cards).size,15);
const dom=new JSDOM('<div id="m"></div>',{pretendToBeVisual:true,runScripts:'outside-only'});
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/task-scene-viewer.js','utf8'));
let steps=0,views=0;
for(const c of cards){
 assert(schema(c),c.id+JSON.stringify(schema.errors));
 assert.deepEqual(API.validateLesson(c,production.catalog.book),[],c.id);
 assert.equal(c.status,'in-review');
 assert.deepEqual(c.review,{source:'pending',mathematics:'pending',pedagogy:'pending'});
 assert(!production.lessons.some(l=>l.id===c.id),'draft must not be counted as released');
 const mount=dom.window.TaskSceneViewer.mount(dom.window.document.getElementById('m'),c.visualization.model);
 const used=new Set(['neutral',...c.steps.map(s=>s.view),...c.help.map(h=>h.view)].filter(Boolean));
 for(const v of Object.keys(c.visualization.model.views)){
  assert(used.has(v),c.id+': unreachable view '+v);
  assert(mount.setView(v));assert(!/NaN|Infinity/.test(dom.window.document.querySelector('svg').outerHTML));views++;
 }
 mount.destroy();steps+=c.steps.length;
 // No auxiliary points or lines in the initial figure.
 for(const name of c.visualization.model.neutralPoints)assert(c.visualization.model.points[name]);
}
const expected={'276':['а','б','в','г'],'277':['а','б','в'],'278':['а','б','в · боковое ребро не равно стороне основания','в · все рёбра равны']};
for(const [n,parts]of Object.entries(expected))assert.deepEqual(cards.filter(c=>c.source.exercise===n).map(c=>c.source.subpart),parts);
const catalog={...production.catalog,entries:cards.map(c=>Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,c[k]])))};
assert.equal(API.inspectBundle(catalog,cards).available.size,0,'unreviewed drafts remain unavailable to pupils');
const byId=id=>cards.find(c=>c.id===id);
assert.match(byId('ex-main-0277-a').steps.at(-1).explanation,/бесконечно/);
assert.match(byId('ex-main-0277-c').steps.at(-1).explanation,/Ответ: 9/);
assert.match(byId('ex-main-0278-c').steps[1].explanation,/3/);
assert.match(byId('ex-main-0278-c-regular').steps.at(-1).explanation,/Ответ: 6/);
assert.equal(steps,50);dom.window.close();
console.log('ATANASYAN_SYMMETRY_DRAFT_OK',cards.length,'cards',steps,'steps',views,'reachable views; publication remains blocked');
