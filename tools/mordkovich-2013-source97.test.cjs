'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/mordkovich-2013/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-97');
assert.equal(book.source.sha256,'8667b61432ec95c9b87987ce4da75be92a6b21c97f9f83af833b23679c707336');assert.equal(book.source.pages,177);assert(book.note.includes('978-5-346-02432-3'));
const pages=[3, 7, 14, 16, 22, 27, 33, 39, 47, 58, 60, 62, 65, 70, 74, 77, 80, 81, 85, 87, 93, 95, 97, 98, 100, 105, 108, 111, 112, 115, 118, 122, 123, 130, 132, 133, 136, 139, 142, 145, 149, 153, 155, 156, 162, 165, 172];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=['ex1','ex2a','ex2b','ex2c',...Array.from({length:17},(_,i)=>i===6?['q7a','q7b']:['q'+(i+1)]).flat()];
const printed=ids.map(id=>id==='ex1'?'Пример 1':id.startsWith('ex2')?'Пример 2'+'абв'[id.charCodeAt(3)-97]:id.startsWith('q7')?'Вопрос 7 · x = '+(id==='q7a'?'1':'2,5'):'Вопрос '+id.slice(1));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000080.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['identities','quotients','quadrants','ranges','arguments','functions-theory','function-properties','expressions-grade7','fractions-grade8'].map(f=>dir+f+'.js'),'trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:mordkovich-2013:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s) {
 const id=ids[i],k=s+2;
 if(id==='ex1'){const v=2*s+7;return [-1/3,-3*v,-v/(3*(s+3))];}
 if(id.startsWith('ex2')) {
  const a=s+4,b=id==='ex2c'?a:id==='ex2b'?-(s+1):s+1;
  return [a*a+2*a*b+b*b,a*a-b*b,id==='ex2c'?0:(a+b)/(a-b)];
 }
 if(['q1','q3'].includes(id)){
  const cats=[0,1,-1,0,1],rotate=s%5;
  const arr=[...cats.slice(rotate),...cats.slice(0,rotate)];
  return [2,arr.indexOf(id==='q1'?0:1)+1,arr.indexOf(-1)+1];
 }
 if(id==='q2'||id==='q5'){
  const a=s+2,b=s%4+2,c=s+4,mode=id==='q5'?1:s%3;
  const first=[b*c,a+b,a*a][mode],total=[a+b*c,(a+b)*c,a*a-b][mode];
  return [first,total,2*total];
 }
 if(['q4','q6'].includes(id)){
  const m=s+2,n=s+3,multiply=id==='q6'||s%2;
  return multiply?[m*n,(m+1)*n,n]:[m+n,m+n+1,1];
 }
 if(['q7a','q7b','q15','q16','q17'].includes(id)){
  const bad=id==='q7b'||id==='q17',x=bad?k:k+1;
  return [k,2*k-2*x,bad?0:(3*x-4)/(2*k-2*x)];
 }
 if(['q8','q9','q10','q11'].includes(id)){
  const a=s+4,b=s+2,c=s+1;
  return {q8:[a,b,a+b],q9:[a,b,a*b],q10:[a+b,b+c,a+b+c],q11:[a*b,b*c,a*b*c]}[id];
 }
 if(id==='q12'){const n=s+1,d=s+3,m=2+s%4;return[n*m,d*m,n/d];}
 const a=-(s+5),b=id==='q13'?-(s+2):(s%2?s+8:s+2);
 return [Math.abs(b),Math.sign(b),a+b];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='97-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,ids[i]==='ex1'?8:ids[i].startsWith('ex2')?11:14);
 let {dom,w,doc,key,l}=open(r);
 assert(doc.querySelector('#edition').textContent.includes('17-е издание'));assert(!doc.querySelector('#edition').textContent.includes('14-е'));assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,136);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000080.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-97');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'97-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Мордкович‑7, 2013: 47 строк оглавления, 22 разбора всех примеров и вопросов §1, 726 независимо проверенных ответов.');
