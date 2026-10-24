'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),bundle=require(root+'/stereo-course/textbook/data/course.json'),ls=bundle.lessons,book=bundle.catalog.book,API=require(root+'/stereo-course/textbook/assets/engine.js'),Viewer=require(root+'/stereo-course/assets/task-scene-viewer.js'),{JSDOM}=require('jsdom'),crypto=require('node:crypto'),review=require('./content-review.json');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
assert.equal(review.cards.length,ls.length,'review applies to every published card');
for(const item of review.cards){const lesson=ls.find(l=>l.id===item.id);assert(lesson,'missing reviewed card '+item.id);const content=structuredClone(lesson);delete content.status;delete content.review;assert.equal(crypto.createHash('sha256').update(JSON.stringify(canonical(content))).digest('hex'),item.sha256,'content changed after independent review: '+item.id);}
const ids=new Set(ls.map(l=>l.id)),keys=new Set();let steps=0,views=0;
for(const l of ls){assert.deepEqual(API.validateLesson(l,book),[],l.id);assert.equal(l.status,'reviewed');for(const field of ['source','mathematics','pedagogy'])assert.equal(l.review[field],'passed');const key=JSON.stringify([l.kind,l.source.bookId,l.source.collection,['main','theory'].includes(l.source.collection)?null:l.source.chapter,l.source.examTask,l.source.point,l.source.exercise,l.source.subpart]);assert(!keys.has(key),'source identity '+l.id);keys.add(key);Viewer.prepare(l.visualization.model);steps+=l.steps.length;function h(hs){for(const x of hs){for(const id of x.theoryIds||[])assert(ids.has(id),'missing theory '+id);h(x.children||[]);}}h(l.help);for(const s of l.steps)for(const j of s.justifications)if(j.theoryId)assert(ids.has(j.theoryId),'missing theory '+j.theoryId);}
assert.equal(ls.length,479);assert.equal(ls.filter(x=>x.kind==='exercise').length,391);
for(let n=1;n<=270;n++)assert(ls.some(l=>l.source.collection==='main'&&l.source.exercise===String(n)),'missing exercise '+n);
for(let n=271;n<=287;n++)assert(ls.some(l=>l.source.collection==='main'&&l.source.exercise===String(n)),'missing polyhedra exercise '+n);
for(let n=1;n<=37;n++)assert(ls.some(l=>l.source.collection==='theory'&&l.source.point===String(n)),'missing theory point '+n);
const coverage=API.inspectBundle(bundle.catalog,ls).coverage;assert.equal(coverage.availableExercises,287);assert.equal(coverage.availableTheoryPoints,37);assert.equal(coverage.availableSelfchecks,40);assert.equal(coverage.partiallyAvailable,0,'points35–37 and chapter III self-checks complete; later sources remain inventoried drafts');
for(let n=1;n<=16;n++)assert(ls.some(l=>l.source.collection==='selfcheck'&&l.source.chapter==='I. Параллельность прямых и плоскостей'&&l.source.exercise===String(n)),'missing chapterI self-check '+n);
for(let n=1;n<=10;n++)assert(ls.some(l=>l.source.collection==='selfcheck'&&l.source.chapter==='II. Перпендикулярность прямых и плоскостей'&&l.source.exercise===String(n)),'missing chapterII self-check '+n);
for(let n=1;n<=14;n++)assert(ls.some(l=>l.source.collection==='selfcheck'&&l.source.chapter==='III. Многогранники'&&l.source.exercise===String(n)),'missing chapterIII self-check '+n);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a),col=(p,a,b,c)=>norm(cross(sub(p[b],p[a]),sub(p[c],p[a])))<1e-8,plane=(p,a,b,c,x)=>Math.abs(dot(cross(sub(p[b],p[a]),sub(p[c],p[a])),sub(p[x],p[a])))<1e-8;
const find=id=>ls.find(l=>l.id.endsWith(id)).visualization.model;
const f8=find('main-001-a').points;for(const tri of [['D','P','E'],['A','E','B'],['D','M','B'],['D','K','C']])assert(col(f8,...tri),tri);
assert(!plane(f8,'A','B','C','D'));assert(plane(f8,'P','D','C','E'));
const f9=find('main-002-a').points;for(const tri of [['B','P','Q'],['B1','Q','C1'],['D','K','D1'],['C','M','C1'],['K','M','R'],['D','C','R']])assert(col(f9,...tri),tri);
for(const p of ['D','C','C1','D1','K','M','R'])assert(plane(f9,'D','C','C1',p),p);
for(const p of ['B','C','B1','C1','P','Q','M'])assert(plane(f9,'B','Q','C',p),p);
assert(!plane(f9,'A1','B1','C1','P'),'P must not be in top face');assert(plane(f9,'A1','B1','C1','Q'));assert(f9.R[1]>f9.C[1]);
// Regression gate: constructions used only in help must not appear in the initial model.
for(const [suffix,hidden] of [['003-b',['D']],['003-c',['D']],['007-b',['Q']],['010-a',['X']],['010-b',['X']],['013-a',['A','B']],['013-b',['M']],['013-c',['A','B','M']]]){const model=find('main-'+suffix);for(const name of hidden){assert(!model.labelNames.includes(name),suffix+': premature label '+name);assert(!model.edges.some(edge=>edge.includes(name)),suffix+': premature construction '+name);}}
assert.equal(find('main-008-a').faces.length,0,'alpha choice is not given before help');
assert.match(find('main-008-a').views.circleplane.label,/α/,'selected polygon belongs to alpha, not the circle plane');
for(const l of ls.filter(l=>l.kind==='exercise'))assert(!/бесконеч|контрпример|ровно две невозможны|именно по AB|почему ответ 2|одна или три/i.test(l.title+' '+l.statement.goal+' '+l.answer.prompt),l.id+': premature verdict');
const dom=new JSDOM('<div id="m"></div>',{runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.eval(fs.readFileSync(path.join(root,'stereo-course/assets/task-scene-viewer.js'),'utf8'));
for(const l of ls){const mount=w.TaskSceneViewer.mount(w.document.getElementById('m'),l.visualization.model);assert(w.document.querySelector('svg'));for(const name of Object.keys(l.visualization.model.views)){assert.equal(mount.setView(name),true);assert(!/NaN|Infinity/.test(w.document.querySelector('svg').outerHTML),l.id+':'+name);views++;}mount.destroy();}
assert.equal(steps,1730,'exact justified-step count');assert.equal(views,1784,'exact authored-view count');
require('./symmetry-content.test.cjs');
require('./regular-polyhedra-content.test.cjs');
require('./polyhedra-symmetry-content.test.cjs');
require('./polyhedra-selfcheck-content.test.cjs');
require('./polyhedra-practical-content.test.cjs');
require('./prism-content.test.cjs');
const pyramidEarly=require('./pyramid-ex239-253-content.test.cjs').run(bundle);
console.log(`ATANASYAN_PYRAMID_EX239_253_CONTENT_OK ${pyramidEarly.cards} cards, ${pyramidEarly.groups} source-derived regression groups`);
const pyramidRemaining=require('./pyramid-theory32-34-ex254-270-content.test.cjs').run(bundle);
console.log(`ATANASYAN_PYRAMID_THEORY32_34_EX254_270_CONTENT_OK ${pyramidRemaining.cards} cards, ${pyramidRemaining.groups} source-derived regression groups`);
dom.window.close();console.log(`ATANASYAN_TEXTBOOK_CONTENT_OK ${ls.length} cards, ${steps} justified steps, ${views} views; source identities/theory links/fig8+9 incidences/DOM finite`);
