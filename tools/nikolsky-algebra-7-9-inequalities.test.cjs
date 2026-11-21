'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/nikolsky-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-75');
assert.equal(book.source.sha256,'f1e6b585cc9c6c4a9cbe17e782ae37128ee032744b3f6a5a8ac2301a8a5fa95b');assert.equal(book.source.pages,305);assert(book.note.includes('978-5-09-027740-2'));
const pages=[5, 11, 14, 19, 22, 26, 30, 33, 35, 39, 41, 45, 48, 51, 58, 60, 62, 66, 69, 74, 76, 80, 85, 87, 91, 94, 96, 99, 101, 104, 107, 111, 114, 119, 126, 129, 131, 133, 138, 143, 146, 149, 150, 155, 157, 163, 167, 169, 173, 175, 178, 184, 188, 191, 195, 201, 203, 210, 213, 218, 222, 224, 228, 232, 283, 285, 288, 290, 292];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=[[1,2],[2,2],[3,6],[4,6],[5,8]].flatMap(([n,len])=>Array.from({length:len},(_,i)=>n+'-'+String.fromCharCode(97+i)));
const printed=ids.map(id=>id.replace(/-([a-h])$/,(_,c)=>'абвгдежз'[c.charCodeAt(0)-97]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000055.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'natural-numbers.js',dir+'grouping.js',dir+'inequality-data.js',dir+'inequalities.js',dir+'figure.js','trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:nikolsky-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
  const id=ids[i],data=pure.window.MathExamTopicPractice.lessons.get('75-'+id).make(s),vals=data.rows.map(r=>r[1]);
  const parse=v=>{const [a,b=1]=String(v).split('/').map(Number);return a/b;};
  if(id.startsWith('1-')){
    const nums=vals.map(v=>v.split(' < ').map(Number));
    const op=id==='1-a'?(a,b)=>a+b:(a,b)=>a*b;
    const L=op(nums[0][0],nums[1][0]),R=op(nums[0][1],nums[1][1]);return [L,R,R-L];
  }
  if(id.startsWith('2-')){const [a,b]=vals;return [a-b,Math.abs(a-b),Number(a>=b)];}
  const den=vals.pop(),pts=vals.map(parse),a=pts[0],b=pts.at(-1);
  if(id.startsWith('3-'))return [Math.round(a*den),Math.round((a-b)*den),Math.sign(a-b)];
  if(id.startsWith('4-'))return [Math.round(Math.min(a,b)*den),Math.round((a+b)*den),(a+b)/2];
  return [Math.abs(a-pts[1]),Math.abs(b-pts[1]),Math.abs(a-b)];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='75-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,9);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,58);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000055.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-75');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'75-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Никольский, 8 класс: 69 строк оглавления, 24 исходных подпункта №1–5, 792 проверенных ответа и сохранение.');
