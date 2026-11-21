'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/alimov-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-104');
assert.equal(book.source.sha256,'ac5f4e9af041e6da896b17052200905687d058afd2b028db3a62fc579ee10fe9');assert.equal(book.source.pages,226);assert(book.note.includes('978-5-09-025169-3'));
const pages=[3, 8, 10, 14, 19, 23, 27, 30, 35, 41, 44, 48, 55, 58, 61, 63, 67, 69, 71, 75, 78, 81, 85, 88, 90, 94, 97, 99, 104, 108, 112, 114, 118, 121, 124, 132, 138, 143, 147, 152, 156, 160, 165, 170, 173, 177, 181, 187, 188, 198, 202, 209, 222];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=["1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7", "1-8", "2-1", "2-2", "3-1", "3-2", "3-3", "3-4", "4", "5-1", "5-2", "5-3", "5-4"],printed=["1 (1)", "1 (2)", "1 (3)", "1 (4)", "1 (5)", "1 (6)", "1 (7)", "1 (8)", "2 (1)", "2 (2)", "3 (1)", "3 (2)", "3 (3)", "3 (4)", "4", "5 (1)", "5 (2)", "5 (3)", "5 (4)"];
ids.push('6-1','6-2','6-3','6-4','6-5','6-6','7-1','7-2','7-3','7-4','puzzle-1','8-1','8-2','8-3','8-4','8-5','8-6','9-1','9-2','9-3','9-4','9-5','9-6','10');printed.push('6 (1)','6 (2)','6 (3)','6 (4)','6 (5)','6 (6)','7 (1)','7 (2)','7 (3)','7 (4)','Занимательная №1','8 (1)','8 (2)','8 (3)','8 (4)','8 (5)','8 (6)','9 (1)','9 (2)','9 (3)','9 (4)','9 (5)','9 (6)','10');
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000079.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'numeric-expressions.js',dir+'order.js',dir+'grouped-calculations.js',dir+'comparisons.js',dir+'signed-arithmetic.js',dir+'signed-powers.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:alimov-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 if(i===0){const a=40+s,b=200+13*s;return [100*a,100*a-b,a-b/100];}
 if(i===1){const n=12+4*s;return [n,4,n*.25];}
 if(i===2){const d=s+3,n=d-1,b=2+s%3;return [b*d,n-b*d,n/d-b];}
 if(i===3){const a=s+2,d=2*a+1,k=2*a;return [1/k,2,(a/d)/k];}
 if(i===4){const n=s+1,d=2+s%3,k=2+s%4;return [n*d+1,d*k,(n+1/d)*(d*k)/(n*d+1)];}
 if(i===5){const n=1+s%3,d=s+3,k=2+s%4;return [n*d+1,k,(n+1/d)*d*k];}
 if(i===6){const u=1+s/2,k=s+2;return [10*u,10*u*k,-u*k/(-u)];}
 if(i===7){const a=30+3*s,b=2+s%7;return [a*b,2,-(a/10)*(b/10)];}
 if(i===8){const a=s+4,b=a+2+s%3;return [a+b,a-b,a*a-b*b];}
 if(i===9){const n=3+s;return [n/10,n/10,n/5];}
 if(i>=10&&i<=13){
   let L,R;const a=s+2;
   if(i===10){const d=3+s,p=1+s%2;L=(2+p)/(2*d);R=(2+p-s%2)/(2*d);}
   if(i===11){const b=2+s%3;L=a*b/10;R=(a*b+s%2)/10;}
   if(i===12){const b=s+1,n=5*b+s%2;L=2*(n+b);R=3*(n-b);}
   if(i===13){const n=2+s%3,b=s+2;L=3*(n+b);R=2*n*b;}
   return [L,R,Number(Math.abs(L-R)<1e-12)];
 }
 if(i===14){const p=(23+s)*(15+s%3),q=(12+s)*(20+s%4);return [p,q,p+q];}
 if(i===15){const n=2+s%4,k=3+s;return [n*n,2*k,(s+7)/10*n*n+2*k-(3*s+2)];}
 if(i===16){const b=2+s%3,m=3+s,n=5+s;return [1/b**2,n,(21+s)/10-m+n];}
 if(i===17){const a=21+s,k=4+s;return [.05*a,k,.05*a-k+(s+3)/10];}
 if(i===18){const n=(s+12)/10,k=s+2,v=1+s;return [n*n,v/10,n*n+2*k-v/10];}
 if(i===19||i===20){const a=s+2,L=i===19?1/a+1/(a+1):1/(a+2)-1/a,R=i===19?1/(a+2)-1/(a+1):1/(a+3)-1/(a+1);return [L,R,L*R];}
 if(i===21){const a=s+1,d=s+3,k=2+s%3;return [2*k/d,2/d,a+(d+1)/d];}
 if(i===22){const a=s+3,d=s+2;return [2,2/d,a-1/d];}
 if(i===23){const d=s+2,m=6+s;return [m*d*d,m*d,m*d-(s+1)/100];}
 if(i===24){const k=s+3,a=2+s%3,b=(20+s)/100;return [k,b*a*a,1-k+b*a*a];}
 if(i===25){const n=2+s%4,m=s+2,top=-n*n/2-m,bot=m+4;return [top,bot,top/bot];}
 if(i===26){const d=s+2,n=s+3,top=(d*.4)/d-(1+1/d)*d/10;return [top,n,top/n];}
 if(i===27){const n=s+2,k=2+s%4,b=(s+3)/10;return [n*n+b,k,k+1];}
 if(i===28){const n=2+s%4,d=s+1,r=(s+12)/10;return [-d,r-d,2*(r-d)];}
 if(i===29){const d=1+s%9,t=1+Math.floor((s-1)/9);return [d*11,4*t,(11*d+1)*t];}
 if(i>=30&&i<36){
  let other,part;
  if(i===30){part=(100+10*s)/5;other=part+s%2;}
  if(i===31){part=(s+2)*(2+s%4);other=part-s%2;}
  if(i===32){const d=s+2;other=(s+3)*d+2;part=other+s%2;}
  if(i===33){other=(8+2*s)/4;part=other+(s%2)/2;}
  if(i===34){other=s+7;part=other+s%2;}
  if(i===35){part=(2*(s+2))*(1.5+.5*(s%5));other=part+s%2;}
  return [other,part,Number(Math.abs(part-other)<1e-10)];
 }
 if(i>=36&&i<42)return i===41?[1,-1,1]:[-1,1,1];
 const n=2+s%3,v=3+s%3,m=30+5*s,r=5+s%4;return [n*m,n*m*v/60,n*(m+r)+(s+2)*60];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='104-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<29?6:7);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,73);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000079.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-104');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'104-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Alimov 7, 2011: 53 source rows and all 43 native exercises and subparts for §1 (1–10 plus the separately numbered puzzle), 1419 mathematical answers and personal progress.');
