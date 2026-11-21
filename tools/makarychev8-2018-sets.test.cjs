'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/makarychev8-2018/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-91');
assert.equal(book.source.sha256,'9bf2aa4a117a65f83aee5082fbf3f64fe71d6878435907b09edb04d465698416');assert.equal(book.source.pages,305);assert(book.note.includes('978-5-09-051122-3'));
const pages=[3, 4, 8, 12, 16, 22, 30, 37, 43, 46, 49, 55, 58, 63, 66, 70, 75, 81, 88, 93, 98, 101, 108, 115, 119, 123, 127, 131, 136, 139, 143, 147, 152, 156, 159, 163, 167, 170, 172, 177, 185, 193, 201, 206, 213, 219, 226, 230, 235, 243, 246, 251, 255, 259, 264, 269, 273, 276, 281, 285, 299];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const counts=[4,1,6,5,4,2,4,1,4,3,2,2,3,2,4,1,6,1,1];
const ids=counts.flatMap((len,j)=>Array.from({length:len},(_,i)=>String(j+1)+(len>1?String.fromCharCode(97+i):'')));
const printed=ids.map(id=>id.replace(/[a-h]$/,c=>'абвгдежз'[c.charCodeAt(0)-97]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000076.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'fractions.js',dir+'sets-motion.js',dir+'domains.js',dir+'integer-zeros.js',dir+'proofs.js',dir+'edition-sets.js',dir+'edition-sets-practice.js',dir+'edition-sets-model.js',dir+'function-graphs.js',dir+'function-comparison.js',dir+'function-applications.js',dir+'function-figure.js','trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:makarychev8-2018:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
const id=ids[i],n=parseInt(id),d=pure.window.MathExamTopicPractice.lessons.get('91-'+id).make(s),vals=d.rows.map(r=>r[1]);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,j)=>a+j),gcd=(a,b)=>b?gcd(b,a%b):a;
const prime=n=>n>1&&range(2,n-1).every(v=>n%v!==0),m=d.model;
if(n===12&&id==='12a'){
  const den=vals[0],ns=range(1,den-1).filter(x=>x/den>1/5&&x/den<1/2),reduced=ns.filter(x=>gcd(x,den)===1);
  return [ns.length,reduced.length,ns.length-reduced.length];
}
if(d.chart==='set-sieve'&&id!=='10c'){
  let candidates,unit=1;
  if(id==='7d')candidates=range(vals[0],vals[1]).filter(v=>v%10===vals[2]&&prime(v));
  else if(id==='11a'){const a=Math.floor(Math.sqrt(vals[0]))+1;candidates=range(a,a+4);}
  else {const [lo,hi]=String(vals[0]).split('…').map(Number);candidates=range(lo,hi).filter(x=>x%vals[1]===vals[2]||(x-vals[2])%vals[1]===0);unit=vals[3];}
  assert.deepEqual([...m.selected],candidates,id+' summary');return [Math.min(...candidates)/unit,Math.max(...candidates)/unit,candidates.length];
}
if(n===2){const xs=vals[0].split(', ').map(Number),small=xs.filter(x=>x<100);return [small.length,xs.find(x=>x>=100),small.reduce((a,b)=>a+b)];}
if(n===3||n===4){const [p,den,g,offset]=vals,x=p/den;return [p+offset*den,Math.abs(p)%den,Number(g==='Q'||g==='Z'&&Number.isInteger(x)||g==='N'&&Number.isInteger(x)&&x>0)];}
if(id==='6a')return [vals[0]+vals[1]-1,vals[1],2];
if(id==='6b'){const w=vals[0];return [w.length,new Set(w).size,w.length-new Set(w).size];}
if(n===8){const [a,b,c]=vals.map(v=>v.split(', '));return [a.length,a.filter(x=>b.includes(x)).length,a.filter(x=>c.includes(x)).length];}
if(id==='10c')return [vals[0]+1,vals[0]+5,range(vals[0]+1,vals[0]+10).filter(x=>x%10===0).length];
if(n===13||n===14){const [digits,len]=vals,allowed=digits.split(', '),ns=range(10**(len-1),10**len-1).filter(x=>[...String(x)].every(ch=>allowed.includes(ch)));return [new Set(ns.map(x=>String(x)[0])).size,ns.length,ns.at(-1)];}
if(n===15){const [a,b,c]=[...String(vals[0])].map(Number);return [a-b,b+c,Number(a-b===2&&b+c===7)];}
if(n===16){const total=vals[0];return [total/100,total-total/10,total+total/5];}
if(n===17){const [total,p]=vals;return [total*.01,p*.01,total*p*.01];}
if(n===18){const [total,p,r]=vals,first=total-total*p/100,second=first*r/100;return [first,second,first-second];}
const [total,p]=vals;return [total/100,total*p/100,total*(100+p)/100];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='91-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,parseInt(ids[i])<=2?6:parseInt(ids[i])<=10?7:8);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,182);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000076.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-91');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'91-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Макарычев, 7 класс, углублённый: 61 строка, 56 исходных упражнений и подпунктов №1–19, 1848 проверенных самостоятельных ответов.');
