'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{expectedTitle}=require('./caption_expectations.cjs');
const dir=path.resolve(__dirname,'../../geometry-course/textbook');
const bundle=JSON.parse(fs.readFileSync(path.join(dir,'data/course.json'),'utf8'));
const api=require(path.join(dir,'assets/engine.js'));
const original=JSON.stringify(bundle),roman=['','I','II','III','IV','V'];
const paragraphMap=JSON.parse(fs.readFileSync(path.join(__dirname,'paragraph-source-map.json'),'utf8'));
assert.equal(paragraphMap.bookId,'atanasyan-2023-7-9');
assert.equal(paragraphMap.sourceSha256,'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72');
assert.deepEqual(bundle.sourceInventory.paragraphs,paragraphMap.paragraphs,'Published paragraph index matches the independent source reading');
for(const lesson of bundle.lessons){
 assert.equal(api.lessonTitle(lesson),expectedTitle(lesson),lesson.id+' exact reference caption');
 const location=api.sourceLocation(lesson.source,bundle.sourceInventory);
 const chapter=bundle.sourceInventory.chapters.find(c=>roman[c.chapter]===lesson.source.chapter);
 const matches=paragraphMap.paragraphs.filter(p=>roman[p.chapter]===lesson.source.chapter&&((lesson.source.collection==='theory'&&Number(lesson.source.point)>=p.pointNumbers[0]&&Number(lesson.source.point)<=p.pointNumbers[1])||(lesson.source.collection==='main'&&Number(lesson.source.exercise)>=p.exerciseNumbers[0]&&Number(lesson.source.exercise)<=p.exerciseNumbers[1])));
 assert(matches.length<=1,'A source item cannot belong to two paragraphs');
 if(matches.length){const p=matches[0];assert(location.includes('К параграфу §'+p.number+' «'+p.title+'»'),lesson.id+' exact paragraph reference');}
 else assert(!location.includes('К параграфу'),lesson.id+' no inferred paragraph');
 if(chapter)assert(location.startsWith('К главе '+lesson.source.chapter+' «'+chapter.title+'»'),lesson.id+' chapter reference');
 if(lesson.source.collection==='selfcheck')assert(!location.includes('К параграфу'),'A chapter question has no fabricated paragraph');
 if(Number(lesson.source.exercise)>=413){
  assert(location.startsWith('К разделу «Задачи повышенной трудности за 7 класс»'),'Advanced section caption');
  assert(!location.includes('К параграфу')&&!location.includes('К главе VI'),'No invented paragraph or chapter VI');
 }
}
assert.equal(JSON.stringify(bundle),original,'Presentation captions must not rewrite lesson identity or teaching');
// Explicit source ranges distinguish a paragraph from its numbered point.
const inventory={chapters:[{chapter:2,title:'Треугольники'}],paragraphs:[{chapter:2,number:1,title:'Первый признак',pointNumbers:[14,15],exerciseNumbers:[92,96]}]};
const theory={collection:'theory',chapter:'II',point:'14'};
assert.equal(api.sourceLocation(theory,inventory),'К главе II «Треугольники» · К параграфу §1 «Первый признак»');
assert.equal(api.sourceLocation({collection:'main',chapter:'II',exercise:'97'},inventory),'К главе II «Треугольники»','An adjacent number does not inherit a paragraph');
assert.equal(api.sourceLocation({collection:'selfcheck',chapter:'II',exercise:'1'},inventory),'К главе II «Треугольники»');
const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/geometry-course/textbook/',runScripts:'outside-only'});
const w=dom.window,d=w.document;
for(const file of ['math-text.js','planar-viewer.js','engine.js'])w.eval(fs.readFileSync(path.join(dir,'assets',file),'utf8'));
const app=w.GeometryTextbook.createApp(d.getElementById('app'),{...bundle,allowInReview:true});
const sample=[];
for(const chapter of bundle.build.chapters){
 for(const collection of ['main','theory','selfcheck'])sample.push(bundle.lessons.find(l=>l.source.chapter===chapter.chapterLabel&&l.source.collection===collection));
}
const advanced=bundle.lessons.filter(l=>Number(l.source.exercise)>=413);
if(advanced.length)sample.push(advanced[0],advanced.at(-1));
for(const lesson of sample){
 assert(app.open(lesson.id));
 assert.equal(d.querySelector('main h1').textContent,expectedTitle(lesson));
 assert.equal(d.querySelector('.lesson-permalink').getAttribute('href'),'#'+lesson.id);
 const input=d.getElementById('final-answer');
 if(input){
  const key='mathExamTextbook.v1:'+lesson.source.bookId+':'+lesson.id+':r'+lesson.revision;
  input.value='Сохранённая работа '+lesson.id;input.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(JSON.parse(w.localStorage.getItem(key)).draft,input.value);
  app.home();app.open(lesson.id);assert.equal(d.getElementById('final-answer').value,'Сохранённая работа '+lesson.id);
 }
}

for(const [part,denominator] of [['1/2AB','2'],['1/4AB','4']]){
 const lesson=bundle.lessons.find(l=>l.source.collection==='main'&&l.source.exercise==='30'&&l.source.subpart===part);
 assert(lesson,'Published half/quarter subpart exists');app.open(lesson.id);
 const title=d.querySelector('main h1');
 assert.equal(title.querySelector('.stereo-numerator').textContent,'AB','Half/quarter refers to segment AB');
 assert.equal(title.querySelector('.stereo-denominator').textContent,denominator,'No accidental 1/(2AB) or 1/(4AB)');
 assert.equal(lesson.source.subpart,part,'Raw source identity remains frozen');
}
app.home();
assert(d.querySelector('.chapter-inventory h3').textContent.startsWith('К главе I'));
assert([...d.querySelectorAll('.catalog-lesson-link')].every(a=>a.textContent.startsWith('К ')));
for(const p of bundle.sourceInventory.paragraphs||[])assert(d.body.textContent.includes('К параграфу §'+p.number+' «'+p.title+'»'),'Paragraph appears in the course contents');
app.destroy();dom.window.close();
console.log(JSON.stringify({gate:'ATANASYAN_REFERENCE_CAPTIONS_OK',titles:bundle.lessons.length,domJourneys:sample.length,stableWorkKeys:true}));
