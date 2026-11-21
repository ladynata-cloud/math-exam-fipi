'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.join(__dirname,'..'),dir=path.join(root,'trainers/mordkovich-2013');
const read=file=>fs.readFileSync(file,'utf8'), ctx=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read(path.join(root,'school/index.html')),ctx);
const book=ctx.window.WorkshopCurriculum.books.find(b=>b.id==='source-21');
const pages=[5,7,9,10,12,13,18,21,23,25,28,30,31,36,38,41,44,45,51,55,57,62,65,67,70,72,78,82,89,93,101,103,108,110,112,115,119,123,129,134,141,143,146,150,154,156,158,162,165,171,175,177,181,181,187,188,192,195,198,202];
assert.equal(book.source.sha256,'e4edd0e1c56a66b296761d5e789c96034bea26ba0b520ef0fab87a2ca860c110');
assert.equal(book.source.pages,279);assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
assert.equal(book.mapping.filter(r=>r.bookOnly && !r.boardPath && !r.externalPath).length,56);
for(const row of book.mapping)assert.equal(new URL(row.sourcePath).hash,'#page='+(row.page+(row.page<18?3:5)));
const circle=['chapter4','chapter5','chapter6a','chapter6b'].flatMap(m=>require('../ege-profil/circle/'+m));
const board=require('../ege-profil/circle/board-session');
const all=circle.flatMap(l=>l.tasks), expected=[...new Set(all.map(t=>t.book))];
const joint=new Set(circle.filter(l=>board.LESSON_IDS.includes(l.id)).flatMap(l=>l.tasks.map(t=>t.book)));
assert.equal(all.length,289);assert.equal(joint.size,13);assert.equal(expected.length,75);
assert.deepEqual(Array.from(book.exercises.slice(0,75),r=>r.printed),expected);
for(const entry of book.exercises.slice(0,75)){
 assert.equal(entry.path,'/ege-profil/circle/index.html#number/'+entry.printed);
 assert.equal(entry.boardPath,joint.has(entry.printed)?'/trainers/ege-profile-circle.html#number/'+entry.printed:null);
}
const expressions=[
 (s,c)=>1-s*s, (s,c)=>c*c-1, (s,c)=>1-c*c, (s,c)=>s*s-1,
 (s,c)=>(1-s)*(1+s), (s,c)=>c*c+1-s*s, (s,c)=>(1-c)*(1+c), (s,c)=>s*s+2*c*c-1
];
const html=read(path.join(dir,'index.html'));
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://example.test'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 const id=entry.path.split('/').pop(),storage='math:mordkovich-2013:v1:'+id;
 if(saved)w.localStorage.setItem(storage,saved);
 for(const name of ['../tyurin-statistics/content.js','identities.js','quotients.js','../tyurin-statistics/app.js'])w.eval(read(path.join(dir,name)));
 return {dom,w,storage,doc:w.document,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
const click=(doc,act)=>doc.querySelector('[data-action="'+act+'"]').click();
function submit(doc,v){
 const field=doc.querySelector('#answer');field.value=String(v);field.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
 doc.querySelector('#work form').dispatchEvent(new doc.defaultView.Event('submit',{bubbles:true,cancelable:true}));
}
// Evaluate the printed (unsimplified) ratios and denominators independently.
const quotients=[
 (s,c)=>1/(c*c)-1,(s,c)=>(1-s*s)/(c*c),(s,c)=>1-1/(s*s),(s,c)=>(1-c*c)/(1-s*s),
 (s,c)=>(s+c)**2/(1+2*s*c),(s,c)=>(1-2*s*c)/(c-s)**2,(s,c)=>c*c/(1-s)-s,(s,c)=>s*s/(1+c)+c,
 (s,c)=>s**4-c**4+2*c*c,(s,c)=>(2-s*s-c*c)/(3*s*s+3*c*c),(s,c)=>s**4+c**4+2*s*s*c*c,(s,c)=>(s**4-c**4)/(s*s-c*c)
];
const denominators=[
 (s,c)=>c*c,(s,c)=>c*c,s=>s*s,s=>1-s*s,(s,c)=>1+2*s*c,(s,c)=>(c-s)**2,
 s=>1-s,(s,c)=>1+c,()=>1,(s,c)=>3*s*s+3*c*c,()=>1,(s,c)=>s*s-c*c
];
function expectAnswers(i,d){
 if(i>=8){
   const n=i-8, y=d.s/d.r, x=d.c/d.r, original=quotients[n](y,x);
   const allowed=d.angles.filter(k=>Math.abs(denominators[n](Math.sin(k*Math.PI/4),Math.cos(k*Math.PI/4)))>1e-8);
   return [allowed.length,d.scale*original,d.offset-original];
 }
 const [,s,r]=d.rows[0],[,c]=d.rows[1],cos=[0,3,4,5,7].includes(i);
 const match=d.questions[2].prompt.match(/²t = (\d+)\/(\d+)/);assert(match);
 const other=Number(match[1])/Number(match[2]),rest=1-other;
 return [(cos?c:s)**2,expressions[i](s/r,c/r),expressions[i](Math.sqrt(cos?other:rest),Math.sqrt(cos?rest:other))];
}
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,String(a)+' ≠ '+b);
for(const [i,entry] of book.exercises.slice(75).entries()){
 let {dom,w,doc,lesson,storage}=open(entry);
 assert.equal(entry.boardPath,entry.path);assert.equal(doc.querySelector('#lesson').value,lesson.id);
 assert.equal(doc.querySelectorAll('#lesson option').length,20);assert.equal(doc.querySelector('#source').href.split('#').pop(),i<8?'page=23':'page=24');
 assert.equal(JSON.parse(w.localStorage.getItem(storage)).results.length,0);
 assert(!doc.querySelector('#work').textContent.includes(lesson.printedGuide));click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 const seen=new Set();
 for(let seed=1;seed<=11;seed++){
  const d=lesson.make(seed), expected=expectAnswers(i,d);seen.add(JSON.stringify(d.rows));
  assert.equal(d.s*d.s+d.c*d.c,d.r*d.r);
  d.questions.forEach((q,j)=>{close(q.answer,expected[j]);for(const [wrong,msg] of q.mistakes){assert(Math.abs(wrong-q.answer)>1e-9);assert(msg.length>20);}});
 }
 assert.equal(seen.size,11);click(doc,'practice');submit(doc,9999);
 const saved=w.localStorage.getItem(storage);dom.window.close();
 ({dom,w,doc,lesson,storage}=open(entry,saved));assert.equal(doc.querySelector('#answer').value,'9999');
 submit(doc,expectAnswers(i,lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  const d=lesson.make(4+j);
  if(j===0){const [wrong,msg]=d.questions[j].mistakes[0];submit(doc,wrong);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');submit(doc,expectAnswers(i,d)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(storage)).results,['fixed','first','help']);
 click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(storage)).variant,7);dom.window.close();
}
console.log('60 printed sections; 75 independently addressable circle exercises with 289 parts; 13 exact shared circle entries; 20 new printed identities, 660 direct mathematical checks and individual corrected/first/assisted/retry journeys.');
