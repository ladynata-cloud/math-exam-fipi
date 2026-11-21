'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/alimov-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-81');
assert.equal(book.source.sha256,'77bc7681b5cba96ce41ff4a0819ee8b31ba9b5e9a7d08357e80add6115043747');assert.equal(book.source.pages,259);assert(book.note.includes('978-5-09-028790-6'));
const pages=[3, 10, 13, 17, 20, 23, 25, 32, 37, 42, 47, 51, 54, 57, 60, 62, 68, 73, 77, 80, 82, 85, 88, 94, 97, 101, 105, 108, 112, 114, 116, 121, 127, 130, 135, 139, 142, 145, 151, 154, 157, 161, 165, 171, 173, 177, 181, 185, 190, 193, 210, 217, 225, 234, 253];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=["1-1", "1-2", "1-3", "1-4", "2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "3-1", "3-2", "3-3", "3-4", "3-5", "3-6", "4-1", "4-2", "4-3", "4-4", "4-5", "4-6", "5-1", "5-2", "5-3", "5-4", "6-1", "6-2", "6-3", "6-4"],printed=["1 (1)", "1 (2)", "1 (3)", "1 (4)", "2 (1)", "2 (2)", "2 (3)", "2 (4)", "2 (5)", "2 (6)", "3 (1)", "3 (2)", "3 (3)", "3 (4)", "3 (5)", "3 (6)", "4 (1)", "4 (2)", "4 (3)", "4 (4)", "4 (5)", "4 (6)", "5 (1)", "5 (2)", "5 (3)", "5 (4)", "6 (1)", "6 (2)", "6 (3)", "6 (4)"];
assert.deepEqual(Array.from(book.mapping.filter(r=>r.sectionLabel.endsWith('*')),r=>r.sectionLabel),['§ 33*','§ 34*','§ 43*']);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000068.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'numeric-expressions.js',dir+'order.js',dir+'grouped-calculations.js',dir+'comparisons.js',dir+'signed-arithmetic.js',dir+'signed-powers.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:alimov-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const a=s+1,b=2+s%4,c=1+s%3;
 if(i<22){
  const signs=[[1,1],[1,-1],[-1,1],[-1,-1],[1,1,1],[-1,1,1],[1,-1,1],[1,-1,-1],[-1,1,-1],[-1,-1,-1],[1,1],[-1,1],[1,-1],[-1,1],[-1,-1],[-1,-1],[1,-1,1],[-1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,-1,-1]][i];
  let first,result;
  if(i===0)first=(7+s)*a/10;
  else if(i===1)first=2;
  else if(i===2)first=1/(s+4);
  else if(i===3)first=1;
  else if(i===4||i===6)first=s+1;
  else if(i===7)first=1;
  else if(i===8)first=a*b/10;
  else if(i<10)first=a*b;
  else if(i===13)first=a/(10*b);
  else if(i<16)first=a;
  else if(i===17)first=a;
  else if(i<20)first=a*b*c;
  else first=a;
  if(signs.length===2){result=first*signs[0]*signs[1];return [signs.filter(x=>x<0).length,first,result];}
  first*=signs[0]*signs[1];const last=(i===7?s+2:i===8?10:(i>=16&&i<20?b:c))*signs[2];
  result=i>=16&&i<20?first/last:first*last;
  return [signs.filter(x=>x<0).length,first,result];
 }
 if(i<26){
  const n=s+1,b=1+s%3,c=2+s%3;
  if(i===22)return [-(n**3),-(n**3)*b*b,-(n**3)*b*b*c*c];
  if(i===23)return [-n,n*b**3,n*b**3*c*c];
  if(i===24)return [-(n**3),-(n**3)*b*b,n**3*b*b/c**3];
  return [n,-n*b**3,-n*b**3/(c*c)];
 }
 const m=s%2?(2*s+3)/10:2*s+1,sign=i%2===0?-1:1;return [sign*m,sign,m/(s+1)];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='81-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,7);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,73);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000068.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-81');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'81-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Alimov 8, 2012: 55 source rows and all 30 subparts of exercises 1–6, 990 mathematical answers and personal progress.');
