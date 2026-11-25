'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/nikolsky-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-57');
assert.equal(book.source.sha256,'f99d9260339bccd690207c6f0a6f59c28ff2165a529de4caa1882377b53ee586');assert.equal(book.source.pages,337);assert(book.note.includes('978-5-09-032436-6'));
const pages=[5, 9, 12, 16, 21, 26, 28, 32, 35, 37, 40, 45, 50, 53, 58, 61, 66, 74, 75, 77, 81, 82, 87, 93, 97, 101, 104, 109, 112, 117, 119, 123, 126, 130, 133, 136, 138, 142, 147, 149, 152, 156, 159, 165, 170, 175, 179, 180, 182, 185, 191, 193, 194, 198, 202, 206, 210, 212, 217, 222, 224, 227, 228, 230, 232, 236, 240, 243, 246, 248, 250, 253, 301, 311, 314, 316, 318, 320];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const counts=[9,3,12,5,4,2,1,2,4,6,6,6,6,6,3,6,6,6,6,6,3,6,6,6,6];
const ids=['example-1','example-2',...counts.flatMap((len,j)=>Array.from({length:len},(_,i)=>j===6?'7':(j+1)+'-'+String.fromCharCode(97+i)))];
const printed=ids.map(id=>id.startsWith('example')?'Пример '+id.at(-1):id.replace(/-([a-l])$/,(_,c)=>'абвгдежзиклм'[c.charCodeAt(0)-97]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000046.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'natural-numbers.js',dir+'grouping.js',dir+'inequality-data.js',dir+'inequalities.js',dir+'inequality-operations.js',dir+'inequality-proofs.js',dir+'intervals.js',dir+'interval-order.js',dir+'linear-inequality-data.js',dir+'linear-inequalities.js',dir+'figure.js','trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:nikolsky-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
const numeric=v=>{const [a,b=1]=String(v).replace(',','.').split('/').map(Number);return a/b;};
for(const [key,expr,sk,sb,sgn,sc,target,side] of pure.window.NikolskyLinearOriginals){
 const [k,b,c,t]=[sk,sb,sc,target].map(numeric);
 assert(Math.abs(k*t+b-c)<1e-9,key);
 for(const x of [t-2,t+3])assert.equal(sgn==='<'?k*x+b<c:k*x+b>c,side==='<'?x<t:x>t,key);
}
function solve(i,s){
 const id=ids[i],l=pure.window.MathExamTopicPractice.lessons.get('57-'+id),d=l.make(s),v=d.rows.map(r=>r[1]),n=Number(id.split('-')[0]);
 if(id.startsWith('example')||n>=11){
   const [k,b,c]=v.slice(0,3).map(numeric),op=v[3],x=numeric(v[4]),t=(c-b)/k;
   const right=op==='<'? k*(t+1)+b<c:k*(t+1)+b>c;
   return b===0&&c===0&&d.questions[0].prompt.includes('левая часть')?[0,k*x,right?1:-1]:[c-b,t,right?1:-1];
 }
 if(n<=3){const {kind,A,B,x}=d.marks;
   if(kind==='all')return [0,3,x+2];
   const two=['between','outside'].includes(kind),irr=['3-g','3-h','3-i'].includes(id);
   const inside=kind==='between'?x>A&&x<B:kind==='outside'?x<A||x>B:kind==='left'?x<A:x>A;
   return [irr?Math.floor(A):A,two?(irr?Math.ceil(B-A):B-A):kind==='left'?-1:1,Number(inside)];
 }
 if(n===4){const [b,step]=v;return [b+step,Math.sign(step),id==='4-d'?2:Math.abs(step)];}
 if(n===5){const [t,a,b]=v;return [t+a,t+b,b-a];}
 if(n===6){const [a,x]=v;return [x-a,Math.abs(x-a),Math.sign(x-a)];}
 if(n===7){const k=Number(v[0].match(/^(-?\d+)x/)[1]);return [k,v[1],k+v[1]];}
 if(n===8){const [a,k,x]=v;return [0,k*(x-a),1];}
 if(n===9){const [a,x]=v,which=id.at(-1);return [a+(['a','c'].includes(which)?1:-1),(a+x)/2,Number(['c','d'].includes(which))];}
 const x=v[0],symbol=String(v[1]);const t=symbol==='π'?Math.PI:symbol.startsWith('√')?Math.sqrt(numeric(symbol.slice(1))):Number(symbol);
 return [x*x,x*x-(symbol==='π'?3.14*3.14:t*t),Number(['a','b','f'].includes(id.at(-1))?x>t:x<t)];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='57-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,ids[i]==='example-1'?5:ids[i]==='example-2'?6:Number(ids[i].split('-')[0])<=7?7:Number(ids[i].split('-')[0])<=21?8:9);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,255);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000046.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-57');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'57-'+ids[i+1]);assert.equal(r.title,l.title);
 const variants=new Set();for(let s=1;s<=11;s++){
  const d=l.make(s),answers=solve(i,s);variants.add(JSON.stringify(d.rows));
  d.questions.forEach((q,j)=>{assert(Math.abs(q.answer-answers[j])<1e-8,id+'/'+s+'/'+j);assert(q.mistakes.length);for(const [bad,msg] of q.mistakes){assert(Math.abs(q.answer-bad)>1e-7,id+'/'+s+'/'+j);assert(msg.length>20);}});
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
console.log('Никольский, 9 класс: 78 источниковых строк, 134 собственных разбора и 4422 проверенных ответа по примерам и упражнениям 1–25.');
