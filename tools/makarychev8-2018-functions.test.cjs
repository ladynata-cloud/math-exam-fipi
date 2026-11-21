'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/makarychev8-2018/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-49');
assert.equal(book.source.sha256,'2c312d483df62f90dddc74d700b6993548304d76784cc4bde0805506b21fd1c8');assert.equal(book.source.pages,401);assert(book.note.includes('978-5-09-051124-7'));
const pages=[3, 4, 10, 15, 19, 23, 29, 33, 38, 45, 48, 52, 58, 66, 70, 77, 85, 90, 94, 100, 104, 108, 112, 117, 119, 122, 126, 132, 136, 139, 144, 147, 152, 157, 161, 164, 170, 175, 179, 185, 189, 196, 200, 204, 209, 214, 220, 229, 235, 243, 250, 254, 257, 262, 266, 269, 273, 278, 285, 289, 293, 298, 305, 310, 313, 316, 322, 325, 330, 333, 336, 341, 344, 348, 354, 358, 363, 371, 375, 394];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const counts=[6,1,1,3,4,1,2,4,2,1,1,2,1,2,1,2];
const ids=counts.flatMap((len,j)=>Array.from({length:len},(_,i)=>String(j+1)+(len>1?String.fromCharCode(97+i):'')));
const printed=ids.map(id=>id.replace(/[a-h]$/,c=>'абвгдежз'[c.charCodeAt(0)-97]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000042.pdf#page='+(r.page+1));
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
 const id=ids[i],n=parseInt(id),d=pure.window.MathExamTopicPractice.lessons.get('49-'+id).make(s);
 const vals=d.rows.map(r=>r[1]),m=d.graph;
 const domains=m.segments;
 assert(domains.length>0);for(const z of domains){assert(z.left<z.right);for(const x of [z.left,(z.left+z.right)/2,z.right])assert(Number.isFinite(z.fn(x)));}
 if(n===1||n===7||n===10){
   const [x1,x2]=vals.slice(1),f=id==='1a'?x=>(s+2)*x+s-5:id==='1b'?x=>-(s+2)*x+s-5:id==='1c'?x=>6*(s+2)/x:id==='1d'?x=>-6*(s+2)/x:
     id==='1e'||id==='1f'?x=>x*x:id==='7a'?x=>6*(s+1)/(s-4-x):id==='7b'?x=>6*(s+1)/(x+4-s):x=>(s+1)*x+s-6;
   assert(Math.abs(f(x1)-m.points[0][1])<1e-8);return [f(x1),f(x2),f(x2)-f(x1)];
 }
 if(n===2)return [s-4,vals[1],-vals[1]];
 if(n===3){const [A,B,C]=vals.map(t=>t.split('; ').map(Number));return[B[0],B[1]-A[1],C[1]-B[1]];}
 if(n===4){
   const h=vals[0];assert.equal(domains.length,4);assert(domains[0].openRight);assert(!domains[1].openLeft);
   assert(domains[0].fn(h)===0);assert.equal(domains[1].fn(h),1);assert(domains[2].openLeft);assert(domains[3].openLeft);
   return id==='4a'?[h+2,h+6,1]:id==='4b'?[h-2,h,1]:[h,h+1,1];
 }
 if(n===5){
   const a=vals[2],zero=id==='5d'?0:s+1,k=id==='5d'?a*a:({'5a':2,'5b':-3,'5c':-2})[id]*(a-zero);
   return [zero,k,['5a','5b'].includes(id)?k:k/2-k];
 }
 if(n===6){const [h,v]=vals[0].split('; ').map(Number);assert.equal(domains[0].fn(h),domains[1].fn(h));return[v+2,v-1,-3];}
 if(n===8){const h=s-4,r=1+s%4;if(id==='8d'){assert.equal(domains.length,2);return[h,0,s+1];}
   const l=h-r,u=h+r,middle=id==='8a'?-r:id==='8b'?r:-r*r;assert.equal(domains[0].fn(l),0);assert.equal(domains[1].fn(u),0);return[l,u,middle];}
 if(id==='9a')return [vals[1],2*vals[1],3];
 if(id==='9b'){const slope=z=>(z.fn(z.right)-z.fn(z.left))/(z.right-z.left);const ss=[s+11,s+7,s+1];domains.forEach((z,j)=>assert.equal(slope(z),ss[j]));return ss;}
 if(n===11){const x=vals[0],k=Math.floor(x);assert(domains.every(z=>z.openRight&&!z.openLeft));return[k,x-k,0];}
 if(n===12){const h=id==='12a'?s+1:-s-1,v=id==='12a'?s+3:-s-3;assert.equal(domains[0].left,h);return[h,v,v+3];}
 if(n===13){const a=s+1;for(const x of [a+1,a+2])assert(Math.abs((a-x)/(a+x)-(-1+2*a/(x+a)))<1e-8);return[-a,-1,2*a];}
 if(n===14){const a=id==='14a'?1:2,b=a*(s+1),r=vals[2];return [-b/a,r,3*b+r];}
 if(n===15){const [a,b]=vals,lower=8*a*b;return [2*Math.sqrt(a),lower,(a+1)*(b+1)*(a*b+1)-lower];}
 return [id==='16a'?3:-1,s+1,s+2];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='49-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,parseInt(ids[i])<=9?8:9);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,182);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000042.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-49');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'49-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Макарычев, 9 класс, углублённый: 80 строк, 34 исходных упражнения и подпункта №1–16, 1122 проверенных самостоятельных ответа.');
