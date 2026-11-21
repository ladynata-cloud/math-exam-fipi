'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/dorofeev-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-53');
assert.equal(book.source.sha256,'39402e7ad32953594640692ab9c137a11a72013cdec1d14bf0e093b55330e521');assert.equal(book.source.pages,339);assert(book.note.includes('978-5-09-038460-5'));
const pages=[3, 5, 19, 28, 36, 44, 53, 57, 63, 66, 70, 74, 83, 93, 107, 117, 124, 131, 134, 137, 142, 156, 162, 170, 176, 188, 192, 197, 202, 205, 213, 218, 228, 239, 246, 258, 264, 271, 273, 279, 284, 288, 297, 302, 308, 312, 314, 318, 322, 325, 333];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=[5,5,4,3].flatMap((count,i)=>Array.from({length:count},(_,j)=>(i+1)+'abcdef'[j]));
const printed=ids.map(id=>id[0]+'абвгде'[id.charCodeAt(1)-97]);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000041.pdf#page='+(r.page+1));
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
function classify(text){
 const raw=text.replaceAll('−','-');
 if(/[√π]/.test(raw))return {level:3,sign:raw.startsWith('-')?-1:1};
 const [a,b=1]=raw.split('/').map(Number), n=a/b;
 return {level:Number.isInteger(n)?(n>0?0:1):2,sign:Math.sign(n)};
}
function contains(set,level) {
 return set==='R'||(set==='R∖Q'?level===3:level<={N:0,Z:1,Q:2}[set]);
}
function solve(i,s) {
 const id=ids[i],part=id.charCodeAt(1)-97;
 const data=pure.window.MathExamTopicPractice.lessons.get('53-'+id).make(s), values=data.rows.map(row=>row[1]);
 if(id[0]==='1'||id[0]==='3') {
  const members=values.map((text,j)=>{
   const {level,sign}=classify(text);
   const test=id[0]==='1'?[level===0,level<=1,level<=2,level===3&&sign<0,sign>0]:[level===2,level===1,level===3,level<=2];
   return test[part]?j+1:null;
  }).filter(x=>x!==null);
  return [members.length,members[0],members.at(-1)];
 }
 if(id[0]==='2'){
  const target=contains(values[2],classify(values[0]).level);
  return [Number(target),Number(!target),Number([0,2,3].includes(part))];
 }
 return values.map(text=>{
  const [number,sign,set]=text.match(/^(.*?) (∈|∉) (.+)$/).slice(1);
  return Number(contains(set,classify(number).level)===(sign==='∈'));
 });
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='53-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,ids[i][0]==="1"?11:12);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,101);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000041.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-53');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'53-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Дорофеев‑9, 2016: 51 строка оглавления, 17 разборов №1–4, 561 независимая проверка ответа.');
