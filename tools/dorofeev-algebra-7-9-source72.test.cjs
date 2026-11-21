'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/dorofeev-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-72');
assert.equal(book.source.sha256,'5ca8ad68d3bd585ff67ba6b6f86f4f5a73d29d37018390304a6e81df1d5b8de9');assert.equal(book.source.pages,322);assert(book.note.includes('978-5-09-038197-0'));
const pages=[3, 5, 11, 17, 26, 30, 35, 43, 48, 53, 57, 62, 66, 70, 78, 84, 89, 93, 100, 106, 111, 114, 117, 122, 127, 132, 136, 143, 148, 154, 159, 162, 166, 170, 175, 182, 191, 200, 205, 212, 216, 219, 223, 227, 236, 244, 252, 256, 266, 272, 274, 279, 284, 292, 298, 301, 303, 306, 308, 318];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=[4,4,6,4,5,4].flatMap((count,i)=>Array.from({length:count},(_,j)=>(i+1)+'abcdef'[j]));
const printed=ids.map(id=>id[0]+'абвгде'[id.charCodeAt(1)-97]);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000066.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['fraction-comparison','fraction-properties','algebraic-fractions','real-numbers','figure'].map(f=>dir+f+'.js'),'trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:dorofeev-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function number(text) {
 const [n,d=1] = String(text).replace(',','.').split('/').map(Number);
 return n/d;
}
function solve(i,seed) {
 const id=ids[i], numberId=Number(id[0]), variant=id.charCodeAt(1)-97;
 const data=pure.window.MathExamTopicPractice.lessons.get('72-'+id).make(seed);
 const vals=data.rows.map(r=>r[1]);
 if(numberId===5) {
  const [n,d]=vals[0].split('/').map(Number);
  return [Math.sign(n)*d,Math.abs(n),d/n];
 }
 if(numberId===6){
  const sum=number(vals[1]),diff=number(vals[2]);
  const [n,d]=[[sum,diff],[-diff,sum],[sum**2,diff**2],[diff**2,sum]][variant];
  return [n,d,n/d];
 }
 const variables = Object.fromEntries(vals[numberId===2?2:1].split(', ').map(row=>{
   const [name,value]=row.split(' = ');return [name,number(value)];
 }));
 const {a,b,c,x,y,m,n,p,q}=variables;
 if(numberId===1||numberId===4){
  const cases=numberId===1?[[4*a,8*b*c,0],[a+b,2*a-3*c,0],[3*c,2*c+4,5*c],[2*x+a,2*x,-a]]:
    [[a+b,a-b,0],[m*n,m-n,0],[3*x+2*y,x-y,0],[a*a+b*b,a*b,0]];
  const [top,bottom,outer]=cases[variant];
  return [top,bottom,top/bottom+outer];
 }
 if(numberId===2){
  const [top,bottom]=[[9*x*x-4*y*y,3*x+2*y],[4*a*a-20*a+25,2*a-5],[3*m**3-6*m*m-3*m,m*m-2*m-1],[4*a*a-11*a-3,a-3]][variant];
  return [bottom,top/bottom,top];
 }
 const all=[
  [a*b*c,a*b,b*c],[x*x*y*y,x*x*y,x*y*y],[(a*b*c)**2,a*a,a*b*c],
  [a*a-b*b,a+b,a-b],[2*(p+q)**2,(p+q)**2,2*(p+q)],[5*(m*m-n*n),m*m-n*n,5*(m-n)]
 ];
 const [multiple,first,second]=all[variant];
 return [multiple,multiple/first,multiple/second];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='72-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,8);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,101);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000066.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-72');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'72-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Дорофеев‑8, 2016: 60 строк оглавления, 27 разборов №1–6, 891 независимая проверка ответа.');
