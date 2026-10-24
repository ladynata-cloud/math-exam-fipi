'use strict';
// Chapter III source completeness and exact preservation of the 456-card release.
// Independent mathematics and actual image inspection are separate gates.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'stereo-course/textbook/lessons');
const manifest=require('./polyhedra-selfcheck-manifest.json'),production=require(root+'/stereo-course/textbook/data/course.json');
const sourceIndex=require(root+'/stereo-course/textbook/source-index.json'),registry=require('./content-review.json');
const API=require(root+'/stereo-course/textbook/assets/engine.js'),screenshots=require('./browser-cases.cjs');
const baseline=require('./selfcheck-baseline.cjs');
const expectedIds=[...Array.from({length:6},(_,i)=>'ex-selfcheck-iii-'+String(i+1).padStart(2,'0')),
 'ex-selfcheck-iii-07-a','ex-selfcheck-iii-07-b','ex-selfcheck-iii-08','ex-selfcheck-iii-09',
 ...['zero','one','two','nonconvex'].map(part=>'ex-selfcheck-iii-10-'+part),
 ...Array.from({length:4},(_,i)=>'ex-selfcheck-iii-'+String(i+11))];
const ids=new Set(expectedIds),contracts=Object.fromEntries(Array.from({length:14},(_,i)=>[String(i+1),i===6?['а','б']:i===9?['внутренняя точка','точка на стороне','точка в вершине','невыпуклое основание']:[null]]));
const exact=(actual,expected,label)=>{assert.equal(new Set(actual).size,actual.length,label+' unique');assert.deepEqual([...actual].sort(),[...expected].sort(),label);};
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
assert.equal(manifest.status,'reviewed','manifest follows completed independent review');
exact(manifest.cards,expectedIds,'exact eighteen-card scope');assert.deepEqual(manifest.reviewedSourceContracts,contracts);
assert.deepEqual(manifest.expected,{cards:18,exerciseCards:18,totalCards:474,completeTheoryPoints:37,completeExercises:282,selfchecks:40,catalogEntries:1368});
const cards=expectedIds.map(id=>JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8'))),allById=new Map(production.lessons.map(c=>[c.id,c]));

// Freeze prior authored bytes as well as canonical records, reviews and source metadata.
const old=production.lessons.filter(c=>!ids.has(c.id));assert.equal(old.length,456);
assert.equal(sha([...old].sort((a,b)=>a.id.localeCompare(b.id))),'aee0f0d9f42ccecfc51db0494b0cc9393d1a002d0423bf357c0f9c36c8a9f7ca','prior456 integrated records, including review metadata');
const rawOld=fs.readdirSync(dir).filter(n=>n.endsWith('.json')&&!ids.has(n.slice(0,-5))).sort().map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,n))).digest('hex')]);
assert.equal(rawOld.length,456);assert.equal(sha(rawOld),'de53dc202836763d03d23133a6e48aff7ef675e1851bfced7c280a9f31b9335d','prior456 authored files stay byte-identical');
const oldReviews=registry.cards.filter(c=>!ids.has(c.id));assert.equal(oldReviews.length,456);
assert.equal(sha(oldReviews),'953c74851cc16d4385d070d607d4aaa06cc79fe67e9741c74d2622f43ba0c142','prior456 registered reviews');
assert.equal(sha(registry.batches.slice(0,21)),'c02d55e655da8dfd1a8db526b9274b80be9c91928ec25b13d5ca0ccbf50d6110','prior21 review batches');
const originalIndex=structuredClone(sourceIndex);assert.equal(originalIndex.entries.length,1253);
for(const entry of originalIndex.entries)if(entry.id.startsWith('source-selfcheck-3-'))delete entry.requiredParts;
assert.equal(sha(originalIndex),'b731d50e7a45ba994fac60eba1304e24792aea62933f9cd7eb4cecab30567470','only fourteen new requiredParts fields may change');
const previous=baseline.previousCourse(production,sourceIndex);
assert.equal(sha(previous),'71b433530f11657ad24418b5134005243da94b4470f90ae42a33d4c09ad3485b','isolated historical fixture exactly reconstructs the complete456-card bundle');
assert.equal(previous.catalog.entries.length,1364);
const previousCases=[...screenshots].filter(([key])=>!ids.has(key.split('|')[0]));assert.equal(previousCases.length,830);
assert.equal(sha(previousCases),'4028ebca32f8a2eccfc05cf7b463d4573790780a35a2a63df381afdc555e62aa','all830 previous screenshot cases are unchanged');

const Ajv=require('ajv/dist/2020'),ajv=new Ajv({allErrors:true,strict:true});require('ajv-formats')(ajv);
const validate=ajv.compile(require(root+'/stereo-course/textbook/schema/lesson.schema.json'));
const {JSDOM}=require('jsdom'),dom=new JSDOM('<div id="model"></div>',{url:'https://example.test/stereo-course/textbook/',pretendToBeVisual:true,runScripts:'outside-only'});
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/math-text.js','utf8'));
dom.window.eval(fs.readFileSync(root+'/stereo-course/assets/task-scene-viewer.js','utf8'));
let steps=0,views=0;
for(const card of cards){
 assert(validate(card),card.id+JSON.stringify(validate.errors));assert.deepEqual(API.validateLesson(card,production.catalog.book),[],card.id);
 assert.equal(card.kind,'exercise');assert.equal(card.status,'reviewed');
 for(const field of ['source','mathematics','pedagogy'])assert.equal(card.review[field],'passed',card.id+': independent '+field+' review');
 assert.deepEqual(allById.get(card.id),card,card.id+': exact integrated record');
 assert.equal(card.source.collection,'selfcheck');assert.equal(card.source.chapter,'III. Многогранники');
 const number=Number(card.source.exercise),page=number<=11?85:86;
 assert.deepEqual(card.source.printedPages,[page]);assert.deepEqual(card.source.pdfPages,[page+2]);
 assert.equal(card.answer.mode,'manual',card.id+': proof and construction require honest written checking');
 const model=card.visualization.model,used=new Set(['neutral']),refs=[];
 const bodyNames=new Set(model.edges.flat());
 // Question14 deliberately keeps the whole body in its neutral view so later
 // views can isolate each cut solid without the original prism showing through.
 if(card.id==='ex-selfcheck-iii-14')for(const name of ['A','B','C','A1','B1','C1'])bodyNames.add(name);
 const given=new Set(card.id==='ex-selfcheck-iii-08'?['M','N','M1','N1']:['ex-selfcheck-iii-10-zero','ex-selfcheck-iii-10-one'].includes(card.id)?['H']:[]);
 const initial=new Set([...(model.labelNames||[]),...(model.neutralPoints||[]),...model.edges.flat(),...(model.faces||[]).flat(),...(model.views.neutral.points||[]),...(model.views.neutral.segments||[]).flat(),...(model.views.neutral.polygon||[])]);
 for(const name of Object.keys(model.points))if(!bodyNames.has(name)&&!given.has(name))assert(!initial.has(name),card.id+': constructed helper appears progressively '+name);
 if(card.id==='ex-selfcheck-iii-08')for(const name of given)assert(initial.has(name),card.id+': source-given midpoint initially visible '+name);
 function helps(items){for(const item of items){used.add(item.view||'neutral');refs.push(...item.theoryIds||[]);helps(item.children||[]);}}helps(card.help);
 for(const step of card.steps){used.add(step.view||'neutral');for(const j of step.justifications)if(j.theoryId)refs.push(j.theoryId);}
 assert(refs.length>0,card.id+': contextual theory links');for(const id of refs)assert.equal(allById.get(id)?.kind,'theory',card.id+': available theory '+id);
 exact([...used],Object.keys(model.views),card.id+': all model states reachable');
 const mount=dom.window.TaskSceneViewer.mount(dom.window.document.getElementById('model'),model);
 for(const view of used){assert(mount.setView(view));assert(!/NaN|Infinity/.test(dom.window.document.querySelector('svg').outerHTML),card.id+': finite '+view);}mount.destroy();
 function display(value,at){if(typeof value==='string'){
  assert(!/[А-Яа-яЁё]\d/u.test(value),card.id+at+': readable spacing before numbers');
  if(value.includes('/')){const node=dom.window.document.createElement('div');dom.window.StereoMath.appendText(node,value);for(const fraction of node.querySelectorAll('.stereo-fraction'))fraction.remove();assert(!node.textContent.includes('/'),card.id+at+': whole arithmetic ratios use fraction bars');}
 }else if(Array.isArray(value))value.forEach((x,i)=>display(x,at+'.'+i));else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))display(v,at+'.'+k);}
 for(const [k,v]of Object.entries(card))if(!['source','review'].includes(k))display(v,'.'+k);
 const captured=new Set();
 for(const [key]of screenshots){const [id,stage]=key.split('|');if(id!==card.id)continue;
  if(stage==='condition')captured.add('neutral');
  else if(stage.startsWith('step-')){const step=card.steps.find(s=>s.id===stage);assert(step,card.id+': known captured step');captured.add(step.view||'neutral');}
  else if(stage.startsWith('help:')){const find=items=>{for(const item of items){if(item.id===stage.slice(5))return item;const found=find(item.children||[]);if(found)return found;}};const item=find(card.help);assert(item,card.id+': known captured help');captured.add(item.view||'neutral');}
 }
 assert(screenshots.has(card.id+'|condition'),card.id+': initial screenshot');
 assert(screenshots.has(card.id+'|'+card.steps.at(-1).id),card.id+': complete final proof screenshot');
 exact([...captured],Object.keys(model.views),card.id+': browser captures cover every new model state');
 steps+=card.steps.length;views+=used.size;
}
for(const [number,parts]of Object.entries(contracts)){
 const source=sourceIndex.entries.find(e=>e.id==='source-selfcheck-3-'+number.padStart(2,'0'));assert(source);
 assert.deepEqual(source.requiredParts,parts);assert.deepEqual(source.source.printedPages,[85,86]);assert.deepEqual(source.source.pdfPages,[87,88]);
 const entries=production.catalog.entries.filter(e=>e.source.collection==='selfcheck'&&e.source.chapter==='III. Многогранники'&&e.source.exercise===number);
 assert.equal(entries.length,parts.length);assert(entries.every(e=>e.status==='reviewed'));
 exact(entries.map(e=>e.source.subpart??'__whole__'),parts.map(p=>p??'__whole__'),'complete source question '+number);
}
const full=API.inspectBundle(production.catalog,production.lessons);assert.deepEqual(full.issues,[]);
assert.equal(full.available.size,474);assert.equal(production.catalog.entries.length,1368);
assert.equal(full.coverage.availableTheoryPoints,37);assert.equal(full.coverage.availableExercises,282);assert.equal(full.coverage.availableSelfchecks,40);assert.equal(full.coverage.partiallyAvailable,0);
// Withholding any original letter or pedagogical case leaves its source incomplete.
for(const id of expectedIds.filter(id=>id.startsWith('ex-selfcheck-iii-07-')||id.startsWith('ex-selfcheck-iii-10-'))){
 const copy=structuredClone(production);for(const entry of copy.catalog.entries)if(entry.id===id)entry.status='draft';copy.lessons=copy.lessons.filter(c=>c.id!==id);
 const r=API.inspectBundle(copy.catalog,copy.lessons);assert.equal(r.coverage.availableSelfchecks,39,id+': incomplete source question');assert.equal(r.coverage.partiallyAvailable,1,id+': partial source remains visible');
}
const unpublished=structuredClone(cards);for(const card of unpublished){card.status='in-review';card.review={source:'pending',mathematics:'pending',pedagogy:'pending'};}
const unpublishedCatalog={...production.catalog,entries:unpublished.map(card=>Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,card[k]])))};
assert.equal(API.inspectBundle(unpublishedCatalog,unpublished).available.size,0,'unreviewed new cards cannot publish');
// Source metadata is visible in both catalog rows and the real source disclosure.
// Pedagogical case identifiers must therefore be understandable Russian labels.
const appRoot=dom.window.document.createElement('div');dom.window.document.body.append(appRoot);
dom.window.HTMLElement.prototype.scrollIntoView=()=>{};dom.window.scrollTo=()=>{};
const app=API.createApp(appRoot,production),caseCards=cards.filter(c=>c.source.exercise==='10');
for(const [selector,value]of [['#catalog-collection','selfcheck'],['#catalog-chapter','III. Многогранники'],['#catalog-search','10']]){
 const control=appRoot.querySelector(selector);control.value=value;control.dispatchEvent(new dom.window.Event(selector==='#catalog-search'?'input':'change',{bubbles:true}));
}
assert.equal(appRoot.querySelectorAll('[data-catalog-ready] article').length,4);
for(const card of caseCards){const row=appRoot.querySelector('[data-lesson="'+card.id+'"]').closest('article');assert(row.textContent.includes(card.source.subpart),card.id+': localized catalog source');assert(!/\b(?:zero|one|two|nonconvex)\b/.test(row.textContent));}
for(const card of caseCards){assert(app.open(card.id));const summary=[...appRoot.querySelectorAll('summary')].find(node=>node.textContent==='Где это в учебнике?');assert(summary,card.id+': actual source disclosure');const text=summary.parentElement.querySelector('p').textContent;assert(text.includes(card.source.subpart),card.id+': localized source disclosure');assert(!/\b(?:zero|one|two|nonconvex)\b/.test(text));}
app.destroy();
dom.window.close();console.log('ATANASYAN_POLYHEDRA_SELFCHECK_CONTENT_OK',cards.length,'cards',steps,'steps',views,'states; prior456 exact; chapterIII questions1–14 complete');
