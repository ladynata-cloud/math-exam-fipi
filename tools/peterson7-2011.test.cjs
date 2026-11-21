'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cwd='trainers/peterson7-2011/',html=read(cwd+'index.html');
const catalog=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),catalog);
const book=catalog.window.WorkshopCurriculum.books.find(b=>b.id==='source-101');
assert.equal(book.source.sha256,'6c5f695ff056b44dc5c9a35778772d2cc9e2af77743715554457ac0d5107fa68');assert.equal(book.source.pages,139);
const pages=[3,10,16,23,28,34,41,45,52,58,64,69,76,81,88,93,99,103,110,116,122,128];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);for(const [i,r] of book.mapping.entries()){
 assert.equal(new URL(r.sourcePath).hash,'#page='+(r.page+2));if(i){assert(r.bookOnly);assert(!r.boardPath);assert(!r.externalPath);}
}
const keys='abcd',letters='абвг',ids=[],printed=[];
for(let t=1;t<=3;t++)for(let j=0;j<4;j++){ids.push('1-'+t+keys[j]);printed.push('1('+t+')'+letters[j]);}
for(const t of [2,3])for(let j=0;j<3;j++){ids.push(t+keys[j]);printed.push(t+letters[j]);}
assert.deepEqual(Array.from(book.exercises,r=>r.path.split('/').pop()),ids.map(x=>'101-'+x));
assert.deepEqual(Array.from(book.exercises,r=>r.printed),printed);
const scripts=['trainers/tyurin-statistics/content.js',cwd+'modelling.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 const id=entry.path.split('/').pop(), key='math:peterson7-2011:v1:'+id;if(saved)w.localStorage.setItem(key,saved);
 for(const script of scripts)w.eval(script);
 return {dom,w,doc:w.document,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function oracle(i,d){
 if(i<12){const small=(d.overall-d.diff)/2,big=d.overall-small;if(i>=8)assert.equal(small,0);return [d.overall+d.diff,big,small];}
 if(i===12){const sol=Array.from({length:10*d.t},(_,x)=>x).filter(x=>x>=d.t&&2*x-3*(x-d.t)===x);assert.equal(sol.length,1);return [3*d.t,sol[0],sol[0]-d.t];}
 if(i===13){const sol=Array.from({length:10*(d.cut+d.c)},(_,x)=>x).filter(x=>x>=d.cut&&5*(x-d.cut)-2*x===x+d.c);assert.equal(sol.length,1);return [3,sol[0],sol[0]*d.cakes];}
 if(i===14){const sol=Array.from({length:d.total},(_,x)=>x).filter(x=>d.m*x+x-d.diff-d.cut===d.total);assert.equal(sol.length,1);return [d.m+1,sol[0],sol[0]-d.diff];}
 const corrections=Array.from(d.deltas),change=corrections.reduce((a,b)=>a+b,0);const base=(d.sum-change)/3;
 assert.equal(corrections.map(k=>k+base).reduce((a,b)=>a+b,0),d.sum);
 return [change/100,base/100,(base+corrections[d.target])/100];
}
function printedSolutions(i,l){
 if(i<12){
   const input=[[208,50],[180,46],[242,110],[210,62]][i%4];
   const expected=i>=8?input[0]:(input[0]+input[1])/2;
   assert(l.printedGuide.includes(String(expected)));
   if(i>=8){assert(l.printedGuide.includes('y = 0'));assert(l.printedGuide.includes('в этой формулировке не участвует'));}
   return;
 }
 const expected=['12 лет','30 яиц','540 м','97 680 руб.','32,68 км','115,89 т'][i-12];assert(l.printedGuide.includes(expected),l.id);
}
function click(doc,id){const el=doc.querySelector('[data-action="'+id+'"]');assert(el,id);el.click();}
function reply(doc,v){const a=doc.querySelector('#answer');a.value=v;const E=doc.defaultView.Event;a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
for(const [i,entry] of book.exercises.entries()){
 assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,i<12?6:7);
 let {dom,w,doc,key,lesson}=open(entry);
 assert.equal(doc.querySelector('#lesson').value,lesson.id);assert.equal(doc.querySelectorAll('#lesson option').length,18);
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
 assert.equal(doc.querySelector('#source').hash,i<12?'#page=8':'#page=9');assert(doc.querySelector('#worked-data svg[aria-label]'));
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 assert(!doc.querySelector('#work').textContent.includes(lesson.printedGuide));click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'101-'+ids[i+1]);
 printedSolutions(i,lesson);const seen=new Set();
 for(let s=1;s<=11;s++){
  const d=lesson.make(s),answers=oracle(i,d);seen.add(JSON.stringify([d.caption,d.rows]));
  d.questions.forEach((q,j)=>{assert.equal(q.answer,answers[j],lesson.id+'/'+s+'/'+j);for(const [bad,msg] of q.mistakes){assert.notEqual(bad,q.answer);assert(msg.length>=20);}});
 }
 assert.equal(seen.size,11,lesson.id);
 click(doc,'practice');reply(doc,99999999);
 const saved=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,lesson}=open(entry,saved));
 assert.equal(doc.querySelector('#answer').value,'99999999');
 reply(doc,oracle(i,lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  const d=lesson.make(4+j);
  if(j===0){const [bad,msg]=d.questions[j].mistakes[0];reply(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');reply(doc,oracle(i,d)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);
 click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log('Peterson 7, part 1 (2011): 19 numbered sections and 3 reviews, 18 exact original entries, 594 model answers, all 18 independent corrections, help, return and retry. The literal repeated n in 1(3) is preserved for all four numeric sets.');
