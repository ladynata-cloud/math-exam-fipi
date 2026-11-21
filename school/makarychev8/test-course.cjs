'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const C=require('./check.js'),M=require('../peterson6/math.js');
const w={};vm.runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),{window:w});const D=w.MakarychevCourse;
// A returning browser must not combine new answer kinds with the cached old checker.
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
const runtimeFiles=['style.css','../peterson6/math.js','task-graphs.js','check.js','models.js','data.js','app.js'];
const versions=runtimeFiles.map(file=>{
 const refs=assets.filter(value=>value.split('?')[0]===file);assert.equal(refs.length,1,file+' has one runtime reference');
 const version=new URL(refs[0],'https://mathexam.test/school/makarychev8/').searchParams.get('v');
 assert(version&&/^[a-zA-Z0-9-]+$/.test(version),file+' requires a release cache version');
 assert(fs.existsSync(__dirname+'/'+file),file+' exists');return version;
});
assert.equal(new Set(versions).size,1,'The coupled course assets must use one release cache version');
assert.equal(D.lessons.length,51);assert.equal(new Set(D.lessons.map(l=>l.id)).size,51);
assert.deepEqual(Array.from(D.lessons,l=>l.order),Array.from({length:51},(_,i)=>i+1));
const ids=new Set(),skills=new Set(M.skills.map(s=>s.id));let tasks=0,steps=0,source=0;
for(const l of D.lessons){
 assert(l.theory.length>=3,l.id+' theory');assert(l.tasks.length>=6,l.id+' tasks');
 assert(l.model&&l.title&&l.page&&l.sourceRange,l.id+' metadata');
 const ref=D.sourceMap.sections.find(s=>s.kind==='topic'&&s.id===l.order);assert.equal(l.page,ref.printedPage);
 for(const t of l.tasks){tasks++;assert(!ids.has(t.id),'Duplicate '+t.id);ids.add(t.id);assert(t.prompt&&t.finalLabel&&t.hint&&t.explanation,t.id+' incomplete');assert(t.steps.length>=2,t.id+' steps');
  assert(C.check(t.answer,t),t.id+' rejects canonical answer '+t.answer);assert(!C.check('',t),t.id+' blank accepted');assert(!C.check('garbage'+t.answer,t),t.id+' invalid accepted');
  for(const a of t.accepts||[])assert(C.check(a,t),t.id+' rejects alias '+a);
  for(const s of t.skills||[])assert(skills.has(s),t.id+' unknown skill '+s);
  if(t.kind==='choice'){assert(t.choices.length>=2,t.id);assert.equal(t.choices.filter(x=>x===t.answer).length,1,t.id+' ambiguous choice');}
  for(const q of t.steps){steps++;assert(q.prompt&&q.hint&&q.explanation,t.id+' incomplete step');assert(C.check(q.answer,q),t.id+' step rejects '+q.answer);}
  assert(['textbook','authored'].includes(t.source.type),t.id+' source');if(t.source.type==='textbook'){source++;const n=Number(/№\s*(\d+)/.exec(t.source.reference)?.[1]);assert(n>=1&&n<=1340,t.id+' bad source number');assert(t.source.page>=5&&t.source.page<=288,t.id+' bad source page');}
  assert(!JSON.stringify(t).includes('{{frac:{{'),t.id+' nested unsupported fraction');
 }
}
assert(C.check('0,5',{answer:'1/2',kind:'number'}));assert(!C.check('1/0',{answer:'0',kind:'number'}));
assert(C.check('3; -2',{answer:'-2;3',kind:'set'}));assert(!C.check('3;3',{answer:'-2;3',kind:'set'}));assert(!C.check('3',{answer:'-2;3',kind:'set'}));
assert(C.check('x^2 − 4',{answer:'x²-4',kind:'text'}));assert(!C.check('x²+4',{answer:'x²-4',kind:'text'}));
assert(C.check('5/(6*x)',{answer:'5/(6x)',kind:'text'}));assert(C.check('x^3/(8*y^3)',{answer:'x³/(8y³)',kind:'text'}));assert(!C.check('2*3',{answer:'23',kind:'text'}));
assert(!C.check('2abc',{answer:'2',kind:'number'}));assert(!C.check('1e309',{answer:'1',kind:'number'}));
const solvedSourceNumbers=new Set(D.lessons.flatMap(l=>l.tasks)
 .filter(t=>t.source.type==='textbook')
 .map(t=>Number(/№\s*(\d+)/.exec(t.source.reference)[1])));
assert.deepEqual(Array.from(D.completedSourceRanges,r=>Array.from(r)),[[1,509]],'published range of complete source coverage');
for(let n=1;n<=509;n++)assert(solvedSourceNumbers.has(n),'missing numbered course work '+n);
for(const id of ['p05','p06','p07']) {
 const lesson=D.lessons.find(l=>l.id===id),refs=lesson.studyOrder.map(i=>lesson.tasks[i].source);
 assert.equal(new Set(lesson.studyOrder).size,lesson.tasks.length,'all bookmarked indices appear once');
 const names=refs.filter(r=>r.type==='textbook').map(r=>r.reference);
 assert.deepEqual([...names],[...names].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true})),'source order');
 assert(refs.slice(names.length).every(r=>r.type==='authored'),'additional practice follows the book');
}
for(const [slopeSign,interceptSign,right,wrong] of [[1,1,'2/3;7','0;7'],[-1,1,'-4;1/5','-4;-1/5'],[-1,-1,'-3;-2','3;-2'],[0,1,'0;9','1;9']]){
 const branch={kind:'line-sign-example',answer:'0;1',slopeSign,interceptSign};
 assert(C.check(right,branch));assert(!C.check(wrong,branch));assert(!C.check('3;',branch));
}
const inverse=D.lessons.find(l=>l.id==='p08');
const seq=inverse.studyOrder.map(i=>inverse.tasks[i]).filter(t=>t.source.type==='textbook');
const nums=seq.map(t=>Number(/№\s*(\d+)/.exec(t.source.reference)[1]));
assert.deepEqual([...nums],[...nums].sort((a,b)=>a-b));assert.equal(seq[0].id,'p08-t01');
for(const [id,right,wrong] of [['p08-source-189-а','2,45;−2,44','2,45;2,44'],['p08-source-189-б','4.73;1.27','0;4.7'],['p08-source-190-б','1.68;−1.68','-1.68;2']]){
 const t=inverse.tasks.find(q=>q.id===id);assert(C.check(right,t));assert(!C.check(wrong,t));assert(!C.check('1;',t));
}
const equivalent=(answer,value)=>C.check(value,{kind:'text',answer,reducedExpression:true});
assert(equivalent('(2*b-a)/7','(-a+2b)/7'));
assert(equivalent('(x-5)*(x-4)/6','(x^2-9x+20)/6'));
assert(equivalent('b/(2*a)','b/(2a)'));
assert(!equivalent('1/(a-b)','(a+c)/((a-b)*(a+c))'),'extra excluded values');
assert(!equivalent('(2*b-a)/7','(-a+2b)/0'));
assert(!equivalent('2*a*b','2a-b'));
assert(!equivalent('a','a+(b-b)'));
assert(!equivalent('a','a^9999999'));
const allNumbers=D.sourceMap.sections.flatMap(s=>Array.from(s.exerciseNumbers||[]));assert.equal(allNumbers.length,1340);assert.equal(new Set(allNumbers).size,1340);
console.log(JSON.stringify({status:'PASS',topics:51,tasks,steps,textbookTasks:source,exerciseMap:1340,checks:'schema, source refs, accepted answers, steps, input boundaries, root sets'}));
