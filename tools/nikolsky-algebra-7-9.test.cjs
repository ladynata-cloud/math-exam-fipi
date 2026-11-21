'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/nikolsky-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-99');
assert.equal(book.source.sha256,'b6055538a9b8ba5ac1abb7019be29efc8dd7b63c493b7b53f140a1fc503aa56b');assert.equal(book.source.pages,289);assert(book.note.includes('978-5-09-027739-6'));
const pages=[5, 7, 9, 11, 14, 17, 19, 22, 26, 29, 30, 32, 34, 38, 42, 45, 47, 54, 59, 63, 66, 68, 72, 74, 76, 78, 79, 82, 85, 87, 92, 94, 97, 100, 102, 104, 107, 109, 111, 113, 114, 115, 118, 124, 128, 130, 136, 139, 144, 148, 152, 155, 157, 161, 168, 171, 174, 177, 180, 182, 186, 189, 192, 195, 200, 203, 206, 208, 216, 220, 223, 225, 269, 271, 273, 275, 276];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=['1','2','3','4','5','6','7','8-a','8-b','8-c','8-d','8-e','9','10','11','12','13','14-a','14-b','14-c','14-d','14-e','15-a','15-b','15-c','15-d','16-a','16-b','17','18-a','18-b','19-a','19-b','19-c'];
const letters={a:'а',b:'б',c:'в',d:'г',e:'д'},printed=ids.map(id=>id.replace(/-([a-e])$/,(_,c)=>letters[c]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000077.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'natural-numbers.js',dir+'grouping.js',dir+'inequality-data.js',dir+'inequalities.js',dir+'inequality-operations.js',dir+'inequality-proofs.js',dir+'figure.js','trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:nikolsky-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const id=ids[i],d=pure.window.MathExamTopicPractice.lessons.get('99-'+id).make(s);
 const vals=d.rows.map(r=>r[1]),ints=v=>String(v).match(/\d+/g).map(Number);
 const sum=ds=>ds.reduce((a,b)=>a+b,0),digits=n=>String(n).split('').map(Number);
 if(id==='1')return [1,vals[1],2];
 if(id==='2')return [vals[0],vals[1],sum(vals)];
 if(id==='3')return [0,vals[0]+1,3];
 if(id==='4')return [vals[1],2*vals[1],vals[0]*vals[1]];
 if(id==='5')return [Math.floor(vals[0]/vals[1]),vals[0]%vals[1],vals[1]-vals[0]%vals[1]];
 if(id==='6')return [vals[0],1,1];
 if(['7','9','10','11','12','13'].includes(id)){
   const divisor=vals[3],candidates=vals.slice(0,3);
   return [candidates[0]/divisor,candidates[1]%divisor,candidates.filter(n=>n%divisor===0).length];
 }
 if(id.startsWith('8-')){
   const [n,m,divisor]=vals;return [divisor===3||divisor===9?sum(digits(n)):n%10,n%divisor,m%divisor];
 }
 if(id==='14-a'){const [a,b]=vals;return [a+100*Math.floor(b/100),a+10*Math.floor(b/10),a+b];}
 if(id==='14-b'){const [n,b]=vals;return [1000-b,n-1000,n-b];}
 if(id==='14-c'){const [a,b]=vals;return [a*(b-b%10),a*(b%10),a*b];}
 if(id==='14-d'){const [n,b]=vals,k=Math.floor((n/b)/100);return [k,n-k*100*b,n/b];}
 if(id==='14-e'){const [a,b]=ints(vals[0]),[c,d]=ints(vals[1]);return [a*b,c/d,a*b-c/d+vals[2]];}
 if(id.startsWith('15-')){const [a,b,c]=vals,k=id==='15-b'||id==='15-c'?b-c:b+c;return [a,k,a*k];}
 if(id==='16-a')return [vals[0],sum(ints(vals[1])),0];
 if(id==='16-b')return [vals[0]/5,vals[1]/3,vals[0]*vals[1]/15];
 if(id==='17')return [vals[1]/vals[0],(vals[1]+1)%vals[0],vals[0]-1];
 if(id==='18-a'){
   const [n,h]=vals,range=Array.from({length:n},(_,j)=>j+1),chars=range.join('').split('');
   return [chars.filter(c=>c==='0').length,range.filter(k=>k%10===h).length,chars.filter(c=>c===String(h)).length];
 }
 if(id==='18-b'){
   const n=10*vals[0],chars=Array.from({length:10},(_,j)=>n+j).join('');
   return [45,sum(chars.split('').map(Number)),Number(BigInt(chars)%9n)];
 }
 const n=vals[0],f=Array.from({length:n},(_,j)=>j+1).reduce((p,k)=>p*BigInt(k),1n);
 const zeros=(f.toString().match(/0+$/)||[''])[0].length,first=Math.floor(n/5);
 return [first,zeros-first,zeros];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='99-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,Number(ids[i].split('-')[0])<=16?6:7);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,121);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000077.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-99');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'99-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Никольский, 7 класс: 77 строк источника, все 34 разбора №1–19, 1122 проверенных ответа и сохранение статуса самостоятельной работы.');
