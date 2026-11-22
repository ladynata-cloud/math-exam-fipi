'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/mordkovich-2013/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-76');
assert.equal(book.source.sha256,'8626284d5715c245530bbb13123b5a91f0e997c215f8ee7cef4ea73fd46020b3');assert.equal(book.verifiedCopy.sha256,'1c800d4e1283d2488f26e386bfdec1e37c479a016556497e83886a86f2101575');assert.equal(book.verifiedCopy.pages,258);assert.equal(book.source.pages,258);assert(book.note.includes('978-5-346-02483-5'));
const pages=[3, 5, 11, 17, 19, 20, 24, 28, 35, 42, 45, 50, 55, 64, 68, 73, 74, 86, 98, 113, 124, 130, 134, 136, 141, 145, 155, 159, 162, 173, 176, 183, 187, 194, 197, 204, 211, 214, 220, 229, 237, 246, 247, 250, 254];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=['ex1a','ex1b','ex1c','ex2','ex3','ex4a','ex4b','ex4c','q1','q2','q3','q4','q5a','q5b','q5c','q6','q7','q8','q9','q10'];
const printed=ids.map(id=>(id.startsWith('ex')?'Пример ':'Вопрос ')+id.replace(/^(ex|q)/,'').replace(/[abc]$/,c=>'абв'[c.charCodeAt(0)-97]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000053.pdf#page='+(r.page+1));
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
 const id=ids[i],part=id.charAt(id.length-1);
 if(id.startsWith('ex1')) {
  const a=s+3,b=part==='a'?s+1:part==='b'?0:a;
  const n=a*a+3*a*b+b*b,d=a*a-b*b;
  return [n,d,d===0?0:n/d];
 }
 if(id==='ex2')return [s+2,-s-1,s+1];
 if(id==='ex3'){const y=s+1,x=4*y+1;return[x-3*y,-1,(x*x-5*x*y+6*y*y)/(9*y*y-x*x)];}
 if(id.startsWith('ex4')){
  const k=s+2,tuple=part==='a'?[5,10*k,9*(k+1)]:part==='b'?[3*k,3*k*(k+1),2*(k+1)**2]:[3,3*(k+3),(k+3)*(2*k+3)];
  return tuple;
 }
 if(['q1','q2','q3'].includes(id)){
  const x=s+2,y=s+3,t=id==='q3'?3:id==='q2'&&s%2===0?2:1;
  const top=t===3?2*x+4:t===2?x+y:2*x+1,d=t===3?2:t===2?x-y:x+1;
  return [top,d,top/d];
 }
 if(['q4','q5a','q5b','q5c'].includes(id)){
  const bits=id==='q5a'?[1,1,1]:id==='q4'?[1,0,1]:[0,0,1],index=s%3;
  return [...bits.slice(index),...bits.slice(0,index)];
 }
 if(id==='q6'||id==='q7'){const a=s+2;return id==='q6'?[-2,1,a+2]:[0,0,a];}
 if(id==='q9')return[s+1,-s-1,-1];
 const n=s+2,d=s+5,k=id==='q10'?-1:s%4+2;
 return[n*k,d*k,n/d];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='76-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,ids[i].startsWith('ex1')?6:ids[i]==='ex2'?7:ids[i].startsWith('ex')?9:10);
 let {dom,w,doc,key,l}=open(r);
 assert(doc.querySelector('#edition').textContent.includes('10-е издание'));assert(!doc.querySelector('#edition').textContent.includes('14-е'));assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,136);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000053.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-76');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'76-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Мордкович и Николаев, 8 класс: 45 строк оглавления, 20 разборов всех примеров и вопросов §1, 660 независимых ответов.');
