'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/mordkovich-2019/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-90');
assert.equal(book.source.sha256,'3bc86fefaa4f53d12e27ce73022b847aa44112affd41278269306d07f18755c7');
assert.equal(book.source.pages,234);assert(book.note.includes('978-5-346-04408-6'));
const pages=[3, 4, 12, 15, 23, 26, 32, 38, 40, 47, 52, 64, 68, 70, 74, 78, 83, 90, 93, 98, 101, 106, 109, 111, 113, 115, 120, 125, 126, 128, 133, 136, 140, 144, 152, 154, 157, 160, 162, 165, 169, 174, 178, 184, 187, 189, 197, 199, 210, 214];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=Array.from({length:16},(_,i)=>'1-'+(1+Math.floor(i/4))+'-'+'abcd'[i%4]);
const printed=ids.map((_,i)=>'Упражнение №1.'+(1+Math.floor(i/4))+'абвг'[i%4]);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000070.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'grade7-workbook.js',dir+'grade8-domains.js',dir+'grade7-theory.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:mordkovich-2019:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s) {
 const a=s+.5,b=s+1/3,k=s+3,x=s+.25,y=s+.75;
 const first=[a+b,b*k,a*k,2*a,a+b,-1-s/8,a-s/(s+1),s+8-s/2,(s+.5)*(2*s+2),s+2,x+y,(s+1)*x,(s+.2)*5*s,s+3,x/2+y,3*y-x][i];
 const op=[3,1,1,1,4,3,4,3,1,2,3,4,1,2,3,4][i];
 const result=[(a+b)*k,a+b*k,a*k+b,2*a+3*b,(a+b)/k,-5*(s+8)/(8*(s+4)),(s+5)/(a-s/(s+1)),-(s+8-s/2)/12,
    s+1/3+(s+.5)*(2*s+2),s+2-s/4,(x+y)*(x-y),(s+1)/(s+2),s+2/3+(s+.2)*5*s,s+3-s/8,(x/2)**2-y*y,(3*y-x)/x][i];
 return [first,op,result];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='90-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<12?4:5);
 let {dom,w,doc,key,l}=open(r);
 assert(doc.querySelector('#edition').textContent.includes('11-е издание'));assert(!doc.querySelector('#edition').textContent.includes('14-е'));assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,80);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000070.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-90');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'90-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Мордкович и Николаев, 7 класс, часть 2: 50 строк оглавления, 16 подпунктов №1.1–1.4, 528 независимых ответов.');
