'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/mordkovich-2019/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-67');
assert.equal(book.source.sha256,'d715052c62337bc94ea359b4851856b7f24d9c08a0ba8edb5005b45a7616bd9e');
assert.equal(book.source.pages,354);assert(book.note.includes('978-5-346-04411-6'));
const pages=[3, 4, 15, 25, 31, 36, 43, 48, 50, 54, 60, 63, 67, 73, 79, 85, 98, 99, 109, 111, 123, 132, 149, 158, 161, 166, 173, 175, 181, 187, 193, 197, 206, 209, 219, 225, 230, 234, 237, 240, 246, 250, 255, 258, 263, 270, 272, 276, 278, 283, 285, 287, 289, 318];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=Array.from({length:36},(_,i)=>'1-'+(1+Math.floor(i/4))+'-'+'abcd'[i%4]).concat('1-10');
const printed=ids.map((_,i)=>'Упражнение №1.'+(1+Math.floor(i/4))+(i<36?'абвг'[i%4]:''));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000051.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'grade7-workbook.js',dir+'grade8-domains.js',dir+'grade7-statistics.js',dir+'grade7-coordinates.js',dir+'grade7-relations.js',dir+'grade7-functions.js',dir+'grade7-distributions.js',dir+'grade7-systems.js',dir+'grade7-nominal.js',dir+'grade7-theory.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:mordkovich-2019:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s) {
 const a=s+1,b=s+3,k=2+s%3,probe=s+.125;
 const forbidden=[
   [-a],[-b/k],[-b],[-a/k],[-a,0],[-b,0],[0,a],[0,b],
   [-b,-a],[-a,a],[-b,a/k],[-b,b],[-a-b,-a,b],[0,a/k],[-b,-a/b,1/k],[-a/k,0],
   [0,a],[-b,0],[-a,0],[0,b],[a],[a/k],[-b],[-b/k],[],[0],[],[0],
   [-a,a],[-b,b],[-b,b],[-a,a],[-a],[0,a],[0],[a],[-a,0,b]
 ][i];
 if(i<32) {
   const marked=s%2&&forbidden.length?forbidden[s%forbidden.length]:probe;
   const answer=forbidden.length ? (s%2===0?Math.max(...forbidden):Math.min(...forbidden)) : a;
   return [forbidden.length,answer,forbidden.includes(marked)?0:1];
 }
 const t=a+1;
 return [[1,1,a],[1,0,3*t*t/(t*(t-a))],[0,0,(t*t+a)/(t*t)],[2,1,-a],[2,1,a]][i-32];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='67-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<12?4:5);
 let {dom,w,doc,key,l}=open(r);
 assert(doc.querySelector('#edition').textContent.includes('16-е издание'));assert(!doc.querySelector('#edition').textContent.includes('14-е'));assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,322);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000051.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-67');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'67-'+ids[i+1]);assert.equal(r.title,l.title);
 const variants=new Set();for(let s=1;s<=11;s++){
  const d=l.make(s),answers=solve(i,s);variants.add(JSON.stringify(d.rows));
  d.questions.forEach((q,j)=>{assert(Math.abs(q.answer-answers[j])<1e-10,id+'/'+s+'/'+j);assert(q.mistakes.length);for(const [bad,msg] of q.mistakes){assert(Math.abs(q.answer-bad)>1e-7,id+'/'+s+'/'+j);assert(msg.length>20);}});
  assert(w.MathExamTopicEdition.figure(d).includes('role="img"'));
 }
 assert.equal(variants.size,11,id);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 action(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(l.printedGuide));action(doc,'practice');send(doc,88888888);
 const stash=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,l}=open(r,stash));assert.equal(doc.querySelector('#answer').value,'88888888');
 send(doc,solve(i,2)[2]);action(doc,'next');for(let j=0;j<3;j++){
  if(!j){const [bad,msg]=l.make(4).questions[0].mistakes[0];send(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)action(doc,'hint');send(doc,solve(i,j+4)[j]);action(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);action(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);
 assert.equal(w.localStorage.getItem('math:peterson8-2017:v1:71-2'),'preserved');dom.window.close();
}
console.log('Мордкович и Николаев, 8 класс, часть 2: 54 строки оглавления, все 37 подпунктов №1.1–1.10, 1221 независимый ответ.');
