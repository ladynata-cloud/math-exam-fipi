'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/peterson9-2017/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-51');
assert.equal(book.source.sha256,'5499660d5c43cc1481cb92556fc8a2a5ec86e5c1582a38185a2c90cc7242bd29');assert.equal(book.source.pages,179);assert(book.note.includes('978-5-85429-645-8'));
const pages=[3,10,18,23,30,32,38,43,50,57,59,66,71,74,80,84,89,96,102,108,112,117,120,121,127,132,138,145,148,154,159,163,167,169];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=['1','2-1','2-2','2-3','2-4','3','4-1','4-2','5-1a','5-1b','5-1c','5-2','6a','6b','6c','7a','7b','7c','8','9-1a','9-1b','9-1c','9-2','9-3'],printed=['1',...Array.from({length:4},(_,i)=>'2 (график '+(i+1)+' из 4)'),'3','4 (1)','4 (2)','5 (1а)','5 (1б)','5 (1в)','5 (2)','6а','6б','6в','7а','7б','7в','8','9 (1а)','9 (1б)','9 (1в)','9 (2)','9 (3)'];
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000043.pdf#page='+(r.page+2));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'sets.js',dir+'number-sets.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:peterson9-2017:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const n=s+2,m=s+1,k=2+s%3,h=1+s%2,b=1+s%3;
 if(i===0)return [m+1+3/8,m+2+7/25,(m+3+3/6)-(m+1/4)];
 if(i===1)return [k,k*n,n+1];
 if(i===2)return [h,k,k*n*n];
 if(i===3)return [b,-n,b-(b+n)];
 if(i===4)return [k,k/n,-k/n];
 if(i===5){const order=Array.from({length:4},(_,j)=>(j+1+s%3)%4);return [0,1,3].map(j=>order.indexOf(j)+1);}
 if(i===6)return [0,n,1];
 if(i===7)return [0,1,n+6];
 if(i===8){const top=(s+1)*10+1+s%8;return [90,9*(top+1),(top+1)/10];}
 if(i===9){const numerator=10*(s+1)+4+s%5;return [numerator/100,numerator-1,.01];}
 if(i===10){const power=10**(1+s%3),last=1+s%8;return [power,last-1,1/power];}
 if(i===11){const a=1+s%7,period=12+s;return [990,99*a+period,1/990];}
 if(i<=14){const m=s+3,test=i===12?Number.isInteger:i===13?Number.isInteger:v=>typeof v==='number',raw=[m,-m-1,1/(2*m+1),Math.sqrt(m*m),undefined,-(s/99),((m+1)**2-1)/m];const valid=raw.filter(v=>test(v)&&(i!==12||v>0));return [valid.length,raw.length-valid.length,new Set(valid).size];}
 if(i===15)return [s+3,2,s+4];
 if(i===16)return [-1/(s+3),s+5,1];
 if(i===17){const step=2+s%6;return [step*(s+3),s+5,step];}
 if(i===18)return [s+7,2+s%3,2+s%3];
 const occupied=s+4, shift=i===23?s+4-(1+s%3):i===21?10*(s+1):1;
 return [occupied+shift,occupied+2,shift];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='51-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<5?7:i>21?9:8);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,24);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000043.pdf#page='+(r.page+2));assert.equal(doc.querySelector('#back').hash,'#book/source-51');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'51-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Peterson grade 9 part I: 34 source rows, 24 native practice routes, 792 independent answers and saved progress.');
