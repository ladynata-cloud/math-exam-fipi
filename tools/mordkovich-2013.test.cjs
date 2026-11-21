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
 for(const name of ['../tyurin-statistics/content.js','identities.js','quotients.js','quadrants.js','ranges.js','arguments.js','../tyurin-statistics/app.js'])w.eval(read(path.join(dir,name)));
 return {dom,w,storage,doc:w.document,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function click(doc,act){const target=doc.querySelector('[data-action="'+act+'"]');assert(target,doc.querySelector('#lesson').value+' · '+act+' · '+(doc.querySelector('#feedback')?.textContent||''));target.click();}
function submit(doc,v){
 const field=doc.querySelector('#answer');field.value=Number.isInteger(v)?String(v):v.toFixed(9);field.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
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
const printedFractions=[
 (s,c)=>c/s-(c-1)/s,(s,c)=>(c/s)**2-(1/(s*s)-1),(s,c)=>c*c-((c/s)**2+1)*s*s,(s,c)=>(s*s-1)/(c*c-1)+s/c*c/s,
 (s,c)=>s/(1+c)+s/(1-c),(s,c)=>(c/s)**2*(c*c-1)+1,(s,c)=>c/(1+s)+c/(1-s),(s,c)=>(s/c+1)/(1+c/s),
 (s,c)=>(1-s*s)/(1-c*c)+s/c*c/s,(s,c)=>(c*c-(c/s)**2)/(s*s-(s/c)**2),
 (s,c)=>(c+c/s)/(c/s),(s,c)=>(1-s)/c,(s,c)=>(s+s/c)/(s/c),(s,c)=>s/(1-c),
 (s,c)=>((s+c)**2-1)/(c/s-s*c),(s,c)=>s**3*(1+c/s)+c**3*(1+s/c)
];
const printedAllowed=[
 (s,c)=>s,(s,c)=>s,(s,c)=>s,(s,c)=>s*c,(s,c)=>(1-c)*(1+c),(s,c)=>s,(s,c)=>(1-s)*(1+s),(s,c)=>s*c*(s+c),
 (s,c)=>s*c,(s,c)=>s*c,(s,c)=>s*c,(s,c)=>c*(1+s),(s,c)=>s*c,(s,c)=>s*(1-c),(s,c)=>s*c,(s,c)=>s*c
];
function later(i,d){
 if(i>=61){
   const kind=i-61,admit=x=>{
     if(kind===1)return Number.isFinite(1/(x-d.a));
     if(kind===2)return Number.isFinite(Math.sqrt(x-d.a));
     if(kind===3)return Number.isFinite(1/((x-d.a)**2-d.b*d.b));
     return true;
   };
   const all=Array.from({length:d.hi-d.lo+1},(_,k)=>d.lo+k);
   const u=d.hi-d.a;
   return [[d.a-d.b,d.a,d.a+d.b].filter(admit).length,all.filter(admit).length,d.level+Math.cos(u)**2+Math.sin(u)**2];
 }
 if(i>=56){
   const index=i-56,t=Math.atan2(d.y,d.x),s=Math.sin(t),c=Math.cos(t);
   if(index===4)return [Math.tan(t),s,s+c];
   const before=[Math.tan(t),1/Math.tan(t),s,c][index];
   const after=[Math.tan(Math.PI-t),1/Math.tan(Math.PI-t),Math.sin(-t),Math.cos(-t)+Math.sin(-t)][index];
   return [Math.sign(after),before,after];
 }
 if(i>=40){
   const n=i-40,original=printedFractions[n](d.s/d.r,d.c/d.r);
   const allowed=d.angles.filter(k=>Math.abs(printedAllowed[n](Math.sin(k*Math.PI/4),Math.cos(k*Math.PI/4)))>1e-8).length;
   if(n===9){
     const m=d.questions[2].prompt.match(/ctg t = ([^.]*)\. Вычисли/);assert(m);
     const ctg=printedNumber(m[1].replace(',','.')), t=Math.atan2(1,ctg);
     return [allowed,6,printedFractions[n](Math.sin(t),Math.cos(t))];
   }
   return [allowed,d.scale*original,d.offset-original];
 }
 const n=i-36,samps=[];
 for(let k=0;k<400;k++){
   const t=2*Math.PI*k/400,s=Math.sin(t),c=Math.cos(t);
   if((n===1||n===3)&&Math.abs(c)<1e-10)continue;
   const e=[1-(c*c-s*s),1-s*c*Math.tan(t),s+3*s*s+3*c*c,c*c*Math.tan(t)**2+5*c*c-1][n];
   samps.push(d.offset+d.k*e);
 }
 const lo=Math.round(Math.min(...samps)),hi=Math.round(Math.max(...samps));
 let integers=hi-lo-1;
 for(const edge of [lo,hi])if(samps.some(v=>Math.abs(v-edge)<1e-8))integers++;
 return [lo,hi,integers];
}
function expectAnswers(i,d){
 if(i>=36)return later(i,d);
 if(i>=20){
   const a=Math.atan2(d.y,d.x),values={sin:Math.sin(a),cos:Math.cos(a),tg:Math.tan(a),ctg:1/Math.tan(a)};
   const actualQ=a>0?(a<Math.PI/2?1:2):(a<-Math.PI/2?3:4);
   assert.equal(actualQ,d.quadrant);
   return Object.keys(values).filter(k=>k!==d.given).map(k=>values[k]);
 }
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
const printedSignProblems=[
 ['sin',4/5,2],['sin',5/12,1],['sin',-.6,4],['sin',-.28,3],
 ['cos',.8,1],['cos',-5/13,2],['cos',.6,4],['cos',-24/25,3],
 ['tg',3/4,1],['tg',2.4,3],['tg',-3/4,2],['tg',-5/12,4],
 ['ctg',12/5,3],['ctg',7/24,1],['ctg',-5/12,4],['ctg',-8/15,2]
];
function printedNumber(text){
 const parts=text.replace(/−/g,'-').split('/');
 const atom=v=>v&&v.startsWith('√')?Math.sqrt(Number(v.slice(1))):Number(v);
 return atom(parts[0])/(parts[1]?atom(parts[1]):1);
}
function verifyPrintedSigns(index,guide){
 const [fn,given,q]=printedSignProblems[index],sx=[2,3].includes(q)?-1:1,sy=q>2?-1:1;
 let x,y;
 if(fn==='sin'){y=given;x=sx*Math.sqrt(1-y*y);}
 else if(fn==='cos'){x=given;y=sy*Math.sqrt(1-x*x);}
 else{const tg=fn==='tg'?given:1/given;x=sx/Math.hypot(1,tg);y=tg*x;}
 const model={sin:y,cos:x,tg:y/x,ctg:x/y}, found=new Set();
 for(const m of guide.matchAll(/(sin|cos|tg|ctg) t = ([−0-9√/]+)/g)){
   close(printedNumber(m[2]),model[m[1]]);found.add(m[1]);
 }
 assert.deepEqual([...found].sort(),Object.keys(model).filter(k=>k!==fn).sort());
}
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,String(a)+' ≠ '+b);
for(const [i,entry] of book.exercises.slice(75).entries()){
 let {dom,w,doc,lesson,storage}=open(entry);
 const editionKeys=Array.from(book.exercises.slice(75),r=>r.path.split('/').pop());
 assert.deepEqual(Array.from(doc.querySelectorAll('#lesson option'),n=>n.value),editionKeys);
 assert.equal(w.MathExamTopicEdition.nextId(lesson),editionKeys[i+1]);
 assert.equal(entry.boardPath,entry.path);assert.equal(doc.querySelector('#lesson').value,lesson.id);
 assert.equal(doc.querySelectorAll('#lesson option').length,65);assert.equal(doc.querySelector('#source').href.split('#').pop(),i<8?'page=23':i<32?'page=24':i<56?'page=25':'page=26');
 assert.equal(JSON.parse(w.localStorage.getItem(storage)).results.length,0);
 assert(!doc.querySelector('#work').textContent.includes(lesson.printedGuide));click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 if(i>=20&&i<36)verifyPrintedSigns(i-20,lesson.printedGuide);
 const seen=new Set();
 for(let seed=1;seed<=11;seed++){
  const d=lesson.make(seed), expected=expectAnswers(i,d);seen.add(JSON.stringify([d.rows,d.caption]));
  if(i<36)assert.equal(i<20?d.s*d.s+d.c*d.c:d.x*d.x+d.y*d.y,d.r*d.r);
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
console.log('60 printed sections; 75 independently addressable circle exercises with 289 parts; 13 exact shared circle entries; all 65 numbered subparts in §7, 2145 direct mathematical checks and individual corrected/first/assisted/retry journeys.');
