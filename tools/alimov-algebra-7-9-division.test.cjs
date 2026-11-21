'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/alimov-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-58');
assert.equal(book.source.sha256,'8d27f5cb34d5661f71e3462b1bb183eb5eccf817dd854835ab756c657a508bcc');assert.equal(book.source.pages,291);assert(book.note.includes('978-5-09-028981-8'));
const pages=[3, 10, 17, 23, 27, 32, 35, 38, 43, 46, 50, 57, 62, 65, 69, 73, 77, 82, 87, 89, 92, 97, 101, 106, 110, 114, 118, 124, 129, 131, 138, 140, 146, 150, 156, 162, 164, 170, 178, 182, 186, 192, 197, 202, 226, 237, 255, 285];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=["1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "2-1", "2-2", "2-3", "2-4", "3-1", "3-2", "3-3", "3-4", "4-1", "4-2", "4-3", "4-4", "5-1", "5-2", "5-3", "5-4", "6-1", "6-2", "6-3", "6-4", "7-1", "7-2", "7-3", "7-4", "8-1", "8-2", "8-3", "8-4", "9-1", "9-2", "9-3", "9-4"],printed=["1 (1)", "1 (2)", "1 (3)", "1 (4)", "1 (5)", "1 (6)", "2 (1)", "2 (2)", "2 (3)", "2 (4)", "3 (1)", "3 (2)", "3 (3)", "3 (4)", "4 (1)", "4 (2)", "4 (3)", "4 (4)", "5 (1)", "5 (2)", "5 (3)", "5 (4)", "6 (1)", "6 (2)", "6 (3)", "6 (4)", "7 (1)", "7 (2)", "7 (3)", "7 (4)", "8 (1)", "8 (2)", "8 (3)", "8 (4)", "9 (1)", "9 (2)", "9 (3)", "9 (4)"];
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000049.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'numeric-expressions.js',dir+'order.js',dir+'grouped-calculations.js',dir+'comparisons.js',dir+'signed-arithmetic.js',dir+'signed-powers.js',dir+'sign-proofs.js',dir+'polynomial-division-data.js',dir+'polynomial-division.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:alimov-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
const originalAnswers=[
 [["5","1"],["0"],["-7","1"]],
 [["1","-1"],["0"],["5","4"]],
 [["-1","3"],["0"],["3","2"]],
 [["-1","3","2"],["0"],["-1","3"]],
 [["1","3"],["0"],["-1","3","2"]],
 [["-2","5"],["0"],["2","1","3"]],
 [["-1","-1","3"],["0"],["-1","1","2"]],
 [["-2","2","3"],["0"],["1","-2","3"]],
 [["0","2","5"],["0"],["-4","0","0","3"]],
 [["2","0","0","3"],["0"],["0","-3","4"]],
 [["5","1"],["14"],["-2","1"]],
 [["-13","4"],["38"],["3","1"]],
 [["-2","0","3"],["5"],["1","2"]],
 [["-3","2"],["4","-2"],["2","0","1"]],
 [["-4/9","2/3","1"],["8/9"],["2","3"]],
 [["-3/2","1/2"],["15/2","-5/2"],["5","0","2"]],
 [["0","3"],["7","-1","10"],["0","-4","2","1"]],
 [["-3","1","2"],["3","1"],["1","1","1"]],
 [["1","-1","1","-1","1"],["0"],["1","1"]],
 [["1","1","1","1","1","1"],["0"],["-1","1"]],
 [["0","-4","0","1"],["-7","8"],["2","0","3"]],
 [["5","0","3"],["0","1","15"],["0","0","-3","0","2"]],
 [["-25/8","0","1/2","2"],["-125/8"],["-5","0","4"]],
 [["2/3","-2","0","1"],["0","19/3"],["0","1","3"]],
 [["0","0","0","2","1"],["0","6"],["0","-2","1"]],
 [["1","0","-2","1"],["0"],["0","1","2","1"]],
 [["3","-2","1"],["0"],["1","5"]],
 [["-1","7"],["0"],["1","-3","1"]],
 [["-3","0","2"],["0"],["-1","4","1"]],
 [["0","-1","1"],["0"],["2","0","0","3"]],
 [["3","-2","1"],["0"],["3","4"]],
 [["-2","0","3"],["0"],["0","3","4"]],
 [["2","0","1"],["0"],["0","-1","0","2"]],
 [["-1","0","0","0","3"],["0"],["2","0","1"]],
 [["-9","1"],["42"],["4","1"]],
 [["-4","2"],["5","5"],["0","2","1"]],
 [["-5","0","2"],["3","0","1"],["0","0","2","1"]],
 [["2","0","0","5"],["-1","2"],["0","-1","0","3"]]
];
const num=v=>{const [n,d]=String(v).split('/').map(Number);return n/(d||1);};
const evaluate=(a,x)=>Array.from(a).reduceRight((u,c)=>u*x+num(c),0);
const power=(v)=>Array.from(v).length-1;
function validate(l,i,s){
 const [m,r,q]=originalAnswers[i],d=l.make(s);
 if(s===1){
  const source=l.id.split('-').slice(1).join('-');assert.equal(source,ids[i]);
 }
 const n=parseInt(ids[i],10);
 for(const x of [-3,-1,0,1,2]){
  assert(Math.abs(evaluate(d.P,x)-evaluate(d.Q,x)*evaluate(d.M,x)-evaluate(d.R,x))<1e-7,l.id+' generated identity at '+x);
  assert(Math.abs(evaluate(d.Q,x)-evaluate(q,x)-(s+1))<1e-9);
  assert(Math.abs(evaluate(d.M,x)-evaluate(m,x)-s)<1e-9);
  if(n<=5||n>=8)assert(Math.abs(evaluate(d.R,x)-(s+1)*evaluate(r,x))<1e-9);
 }
 assert(d.R.every(c=>Math.abs(c)<1e-10)||power(d.R)<power(d.Q));
}
function solve(i,s){
 const [m,r,q]=originalAnswers[i].map(a=>a.map(num)),[n,part]=ids[i].split('-').map(Number);
 if(n===7){const orig=[3,10,3,2][part-1],mult=[1,1,-4,1][part-1];return [(s%3+1)*mult,orig+s,m[0]+s];}
 if(n>=8)return [(q[0]+s+1)*(m[0]+s),q.length-1,q[0]+s+1];
 const realR0=n===6?(s%2?s+part:0):r[0]*(s+1);
 return [m.at(-1),n===6?Number(s%2===0):m[0]+s,realR0];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='58-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<6?8:i<34?9:10);
 let {dom,w,doc,key,l}=open(r);
 assert(doc.querySelector('#edition').textContent.includes('9 класс'));
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,131);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000049.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-58');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'58-'+ids[i+1]);assert.equal(r.title,l.title);
 const variants=new Set();for(let s=1;s<=11;s++){
  validate(l,i,s);const d=l.make(s),answers=solve(i,s);variants.add(JSON.stringify(d.rows));
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
console.log('Alimov 9, 2012: 48 source rows; all 38 subparts of exercises 1–9, 1254 answers and polynomial identities, coefficient comparison and progress.');
