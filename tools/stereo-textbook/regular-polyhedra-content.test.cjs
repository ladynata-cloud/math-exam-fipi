'use strict';
// Source completeness and publication boundaries for the reviewed continuation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'stereo-course/textbook/lessons');
const manifest=require('./regular-polyhedra-manifest.json');
const production=require(root+'/stereo-course/textbook/data/course.json');
const sourceIndex=require(root+'/stereo-course/textbook/source-index.json');
const API=require(root+'/stereo-course/textbook/assets/engine.js');
const screenshots=require('./browser-cases.cjs');
const Ajv=require('ajv/dist/2020'),ajv=new Ajv({allErrors:true,strict:true});
require('ajv-formats')(ajv);
const validate=ajv.compile(require(root+'/stereo-course/textbook/schema/lesson.schema.json'));
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="m"></div>',{pretendToBeVisual:true,runScripts:'outside-only'});
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/task-scene-viewer.js','utf8'));
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/math-text.js','utf8'));
const cards=manifest.cards.map(id=>require(path.join(dir,id+'.json')));
assert.equal(cards.length,17);assert.equal(new Set(manifest.cards).size,17);
assert.equal(cards.filter(c=>c.source.point==='35').length,4);
assert.equal(cards.filter(c=>c.source.point==='36').length,10);
assert.equal(cards.filter(c=>c.kind==='exercise').length,3);
const allById=new Map(production.lessons.map(c=>[c.id,c]));
const hidden={
 'theory-035-parallelepiped-examples':['O','H','H1','L','L1','M','N','P','Q'],
 'theory-035-unbounded-examples':['O','A1','K','A2','Z','Z1','B','T','U','V','W'],
 'theory-035-general-solids-examples':['O','L','L1','M','N'],
 'theory-035-applications-elements':['O','L','L1'],
 'theory-036-tetrahedron':['O','M'],
 'theory-036-octahedron':['KA','KB','KC','KD','KA1','KB1','KC1','KD1','O'],
 'theory-036-icosahedron-existence':['O','U','L','C'],
 'theory-036-dodecahedron-existence':['O','M',...Array.from({length:20},(_,i)=>'F'+(i+1))],
 'ex-main-0280-intersecting':['M']
};
let steps=0,views=0;
for(const c of cards){
 assert(validate(c),c.id+JSON.stringify(validate.errors));
 assert.deepEqual(API.validateLesson(c,production.catalog.book),[],c.id);
 assert.equal(c.status,'reviewed',c.id+': reviewed integration only');
 for(const field of ['source','mathematics','pedagogy'])assert.equal(c.review[field],'passed',c.id+': '+field);
 assert.deepEqual(allById.get(c.id),c,c.id+': integrated content is the authored record');
 // Exercise the real formatter over every new display string. All arithmetic
 // ratios in this batch must render as fraction bars, including nested radicals.
 function display(value,at){
  if(typeof value==='string'){
   assert(!/[А-Яа-яЁё]\d/u.test(value),c.id+at+': readable separation before numbers');
   if(value.includes('/')){
    const element=dom.window.document.createElement('div');dom.window.StereoMath.appendText(element,value);
    for(const fraction of element.querySelectorAll('.stereo-fraction'))fraction.remove();
    assert(!element.textContent.includes('/'),c.id+at+': unformatted arithmetic slash');
   }
  }else if(Array.isArray(value))value.forEach((x,i)=>display(x,at+'.'+i));
  else if(value&&typeof value==='object')for(const [key,x]of Object.entries(value))display(x,at+'.'+key);
 }
 for(const [key,value]of Object.entries(c))if(!['review','source'].includes(key))display(value,'.'+key);
 const m=c.visualization.model,refs=[],used=new Set(['neutral',...c.steps.map(s=>s.view)].filter(Boolean));
 function help(items){for(const h of items){if(h.view)used.add(h.view);refs.push(...h.theoryIds||[]);help(h.children||[]);}}
 help(c.help);
 for(const s of c.steps)for(const j of s.justifications)if(j.theoryId)refs.push(j.theoryId);
 for(const id of refs)assert.equal(allById.get(id)?.kind,'theory',c.id+': available contextual theory '+id);
 assert(refs.length>0,c.id+': contextual theory links');
 for(const n of m.neutralPoints||[])assert(m.points[n],c.id+': defined initial point '+n);
 const initial=new Set([...(m.labelNames||[]),...(m.neutralPoints||[]),...m.edges.flat(),...(m.faces||[]).flat(),...(m.views.neutral.segments||[]).flat(),...(m.views.neutral.polygon||[]),...(m.views.neutral.points||[])]);
 for(const n of hidden[c.id]||[]){assert(m.points[n],c.id+': named helper exists '+n);assert(!initial.has(n),c.id+': no premature helper '+n);}
 const mount=dom.window.TaskSceneViewer.mount(dom.window.document.getElementById('m'),m);
 for(const v of Object.keys(m.views)){
  assert(used.has(v),c.id+': every model view is reachable '+v);
  assert(mount.setView(v),c.id+': view renders '+v);
  assert(!/NaN|Infinity/.test(dom.window.document.querySelector('svg').outerHTML),c.id+': finite view '+v);
  views++;
 }
 const captured=new Set();
 for(const [key]of screenshots){
  const [id,stage]=key.split('|');if(id!==c.id)continue;
  if(stage==='condition')captured.add('neutral');
  else if(stage.startsWith('step-')){
   const s=c.steps.find(s=>s.id===stage);assert(s,c.id+': screenshot step exists '+stage);captured.add(s.view||'neutral');
  }
 }
 assert(screenshots.has(c.id+'|condition'),c.id+': initial production screenshot');
 assert.deepEqual([...captured].sort(),Object.keys(m.views).sort(),c.id+': production screenshot plan covers every model state');
 mount.destroy();steps+=c.steps.length;
}
for(const [n,parts]of Object.entries(manifest.reviewedSourceContracts)){
 const collection=['35','36'].includes(n)?'theory':'main';
 const source=sourceIndex.entries.find(e=>e.source.collection===collection&&(collection==='theory'?e.source.point:e.source.exercise)===n);
 assert(source,'source position '+n);assert.deepEqual(source.requiredParts,parts,'reviewed source contract '+n);
 const entries=production.catalog.entries.filter(e=>e.source.collection===collection&&(collection==='theory'?e.source.point:e.source.exercise)===n);
 assert.equal(entries.length,parts.length,'no missing or extra source part '+n);
 assert(entries.every(e=>e.status==='reviewed'),'complete source coverage '+n);
 const normalize=x=>x==null?'__whole__':x;
 assert.deepEqual(entries.map(e=>normalize(e.source.subpart)).sort(),parts.map(normalize).sort(),'exact parts '+n);
}
assert.deepEqual(Object.keys(manifest.reviewedSourceContracts).sort(),['279','280','35','36'].sort());
assert.deepEqual(manifest.reviewedSourceContracts['279'],[null]);
assert.deepEqual(manifest.reviewedSourceContracts['280'],['пересекающиеся диагонали','параллельные диагонали']);
// A catalog or source-completeness flag cannot publish unreviewed authored content.
const unreviewed=structuredClone(cards);
for(const c of unreviewed){c.status='in-review';c.review={source:'pending',mathematics:'pending',pedagogy:'pending'};}
const catalog={...production.catalog,entries:unreviewed.map(c=>Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,c[k]])))};
assert.equal(API.inspectBundle(catalog,unreviewed).available.size,0,'real in-review guard');
// Preserve the exact previous 435-card release boundary in an isolated copy.
// The newer point37/exercises281–287 block is independently checked below by
// its own test; advancing the course must not relax the old completeness gate.
const laterIds=new Set(require('./polyhedra-symmetry-manifest.json').cards);
const baseline=structuredClone(production);
for(const entry of baseline.catalog.entries)if(laterIds.has(entry.id))entry.status='draft';
baseline.lessons=baseline.lessons.filter(card=>!laterIds.has(card.id));
const report=API.inspectBundle(baseline.catalog,baseline.lessons);
assert.equal(report.available.size,435,'418 previously reviewed cards plus17 continuation cards');
assert.equal(report.coverage.availableTheoryPoints,36);
assert.equal(report.coverage.availableExercises,275);
assert.equal(report.coverage.availableSelfchecks,26);
assert.equal(report.coverage.partiallyAvailable,0);
assert.deepEqual(report.issues,[]);
const cubeAngle=cards.find(c=>c.id==='ex-main-0279');
assert.equal(cubeAngle.answer.mode,'exact');assert.deepEqual(cubeAngle.answer.accepted,['60']);
for(const id of ['ex-main-0280-intersecting','ex-main-0280-parallel'])assert.equal(cards.find(c=>c.id===id).answer.mode,'manual','formula and proof require written checking');
dom.window.close();
console.log('ATANASYAN_REGULAR_POLYHEDRA_CONTENT_OK',cards.length,'cards',steps,'justified steps',views,'reachable model states; points35–36 and exercises279–280 complete');
