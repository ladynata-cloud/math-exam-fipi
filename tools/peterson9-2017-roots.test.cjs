'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/peterson9-2017/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-52');
assert.equal(book.source.sha256,'3e3ed3f8da8613816646443025ce6a557eea7e5b8c9c5b75e44e2e1d35bf078e');assert.equal(book.source.pages,202);assert(book.note.includes('978-5-85429-646-5'));
const pages=[3, 10, 17, 23, 28, 31, 36, 43, 45, 51, 57, 61, 65, 72, 76, 79, 84, 91, 93, 99, 105, 109, 114, 118, 121, 123, 125, 131, 136, 142, 145, 147, 150, 156, 163, 167, 171, 173, 174, 185];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=["1a", "1b", "1c", "1d", "1e", "1f", "2", "3", "4-1", "4-2", "5-1", "5-2", "5-3"],printed=["1а", "1б", "1в", "1г", "1д", "1е", "2", "3", "4 (1)", "4 (2)", "5 (1)", "5 (2)", "5 (3)"];
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000044.pdf#page='+(r.page+2));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'sets.js',dir+'number-sets.js',dir+'roots.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:peterson9-2017:v1:'+id;
 w.localStorage.setItem('math:peterson9-2017:v1:51-9-3','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const n=s+2,g=s+3,small=s+1,extra=2+s%3;
 if(i===0)return [g,2,0];
 if(i===1)return [n,n*extra,(n*extra)**2];
 if(i===2)return [0,-n,n];
 if(i===3)return [5*small,2*small,24*small**2];
 if(i===4)return [-extra,extra,-2*n*(n+extra)];
 if(i===5){const b=small+1+s%3,delta=small**2-b**2;return [delta,-delta,b];}
 if(i===6)return [-Math.pow(n,3),n**4,0];
 if(i===7)return [-n,n+1,1];
 if(i===8)return [n,n+1,0];
 if(i===9)return [0,-(n**3+1),8*(n**3+1)];
 if(i===10 || i===11){const deg=i===10?5:7,r=(2+s%3)**deg+s,z=(i===11?-1:1)*r**(1/deg);return [1,Math.floor(z),Math.ceil(z)];}
 return [n,1,0];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='52-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,8);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,37);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000044.pdf#page='+(r.page+2));assert.equal(doc.querySelector('#back').hash,'#book/source-52');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'52-'+ids[i+1]);assert.equal(r.title,l.title);
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
 assert.equal(w.localStorage.getItem('math:peterson9-2017:v1:51-9-3'),'preserved');dom.window.close();
}
console.log('Peterson grade 9 part II: 40 source rows, 13 native practice routes, 429 independent answers and saved progress.');
