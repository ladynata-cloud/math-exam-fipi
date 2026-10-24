'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../..'),course=path.join(base,'stereo-course/shestakov-yaschenko-10-11');
const bundle=JSON.parse(fs.readFileSync(path.join(course,'data/course.json'))),api=require(path.join(course,'assets/engine.js'));
const seen=new Set(),topics=new Map();
for(const l of bundle.lessons){
 assert.deepEqual(api.validateLesson(l,bundle.catalog.book),[],l.id);
 assert(!seen.has(l.id));seen.add(l.id);
 assert(l.steps.length>=2,l.id+' full authored steps');
 assert(l.visualization.model.views.neutral,l.id);
 for(const s of l.steps)assert(!/^(TODO|TBD|Обоснование)$/i.test(s.justifications[0].text.trim()),l.id+' authored justification');
 assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(JSON.stringify(l)),l.id+' invalid PDF control glyph');
 assert(!/TODO|TBD|здесь будет|решение готовится/i.test(JSON.stringify(l)),l.id+' placeholder');
 const sec=l.source.section;if(!topics.has(sec))topics.set(sec,{theory:0,exercise:0});topics.get(sec)[l.kind]++;
 if(l.kind==='exercise'){
  assert(l.help[0].theoryIds.includes('sy-'+sec.replace('.','-')+'-theory'));
  if(l.answer.mode==='exact')assert(l.answer.accepted.every(s=>s.trim()&&s.length<300),l.id);
 }
}
assert.equal(bundle.catalog.entries.length,2007);
assert.equal(bundle.catalog.entries.filter(e=>e.kind==='exercise').length,1980);
assert.equal(topics.size,27,'All source topics have authored support');
assert.equal(bundle.lessons.filter(l=>l.kind==='exercise').length,516,'Chapter-one completion: 516 source variants');
const chapterOneCoverage={'1.1':32,'1.2':38,'1.3':50,'1.4':104,'1.5':28};
for(const [s,t] of topics){assert.equal(t.theory,1,s+' theory');assert.equal(t.exercise,chapterOneCoverage[s]||12,s+' exact authored coverage');}
const chapterOneIds=bundle.catalog.entries.filter(e=>e.kind==='exercise'&&e.source.section.startsWith('1.')).map(e=>e.id).sort();
assert.deepEqual(bundle.lessons.filter(l=>l.kind==='exercise'&&l.source.section.startsWith('1.')).map(l=>l.id).sort(),chapterOneIds,'Every chapter-one source variant exactly once');
const inspection=api.inspectBundle(bundle.catalog,bundle.lessons);
assert.deepEqual(inspection.issues,[]);
assert.equal(inspection.coverage.exercises,990);
assert.equal(inspection.coverage.theoryPoints,27);
assert.equal(inspection.coverage.available,bundle.lessons.filter(l=>l.status==='reviewed').length);
assert.equal(inspection.coverage.draft,1464,'Only remaining book variants stay pending');
const invalid=structuredClone(bundle.lessons[0]);invalid.source.pdfPages=invalid.source.printedPages.map(p=>p+1);assert(api.validateLesson(invalid,bundle.catalog.book).length>0,'wrong source offset rejected');
const bad=structuredClone(bundle);bad.lessons[0].steps[0].view='absent';if(bad.lessons[0].status==='reviewed')assert(api.inspectBundle(bad.catalog,bad.lessons).issues.length>0,'invalid model view blocked');
const draft=structuredClone(bundle);draft.catalog.entries.forEach(e=>e.status='draft');draft.lessons.forEach(e=>e.status='draft');assert.equal(api.inspectBundle(draft.catalog,draft.lessons).available.size,0,'pending source numbers cannot masquerade as solutions');
const foreign=structuredClone(bundle.lessons[0]);foreign.source.bookId='another-book';assert(api.validateLesson(foreign,bundle.catalog.book).length);
const report={cards:bundle.lessons.length,exercises:bundle.lessons.filter(l=>l.kind==='exercise').length,theory:27,topics:Object.fromEntries(topics),coverage:inspection.coverage};
console.log('SHESTAKOV_CONTENT_SCHEMA_OK '+JSON.stringify(report));
