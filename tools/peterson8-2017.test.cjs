'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),catalog=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),catalog);
const book=catalog.window.WorkshopCurriculum.books.find(b=>b.id==='source-70'),dir='trainers/peterson8-2017/';
assert.equal(book.source.sha256,'b04c28b720297ac5f7174fe17f64314e73c92036a7ddc1a4d78b0a77b7662e7b');assert.equal(book.source.pages,131);assert(book.note.includes('978-5-9963-3227-4'));
const pages=[3,12,18,25,34,40,42,47,54,61,66,71,77,82,87,90,98,104,112,117,120];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
for(const [i,row] of book.mapping.entries()){assert.equal(row.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000057.pdf#page='+(row.page+2));if(i)assert(row.bookOnly&&!row.boardPath);else assert.equal(row.externalPath,book.exercises[0].path);}
const ids=['1-1','1-2','1-3','2-1','2-2','3','4','5a','5b','5c','5d','6','7a','7b',...Array.from({length:12},(_,j)=>'8-'+(j+1)),...Array.from({length:4},(_,j)=>'9-'+(j+1))];
assert.deepEqual(Array.from(book.exercises,r=>r.path.split('/').pop()),ids.map(x=>'70-'+x));
assert.deepEqual(Array.from(book.exercises,r=>r.printed),['1(1)','1(2)','1(3)','2(1)','2(2)','3','4','5а','5б','5в','5г','6','7а','7б',...Array.from({length:12},(_,j)=>'8('+(j+1)+')'),...Array.from({length:4},(_,j)=>'9('+(j+1)+')')]);
assert.deepEqual(Array.from(book.exercises,r=>r.page),[6,6,7,7,7,7,7,7,7,7,7,7,7,8,...Array(16).fill(8)]);
const html=read(dir+'index.html'),scripts=['trainers/tyurin-statistics/content.js',dir+'questions.js',dir+'logic.js',dir+'powers.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').pop(),key='math:peterson8-2017:v1:'+id;
 if(saved)w.localStorage.setItem(key,saved);for(const script of scripts)w.eval(script);
 return {dom,w,doc:w.document,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function oracle(i,d){
 if(i>=26){
  const index=i-26,p=d.p;
  const rows=d.ns.map(n=>{
   const fact=Array.from({length:n},(_,j)=>j+1).some(x=>x%p===0);
   const a=index===3?fact:(n*n-Math.floor(n*n/p)*p)===[0,1,2][index];
   const b=index===3?n>=p-1:(n-Math.floor(n/p)*p)===[0,1,4][index];
   return {n,a,b};
  });
  const direct=rows.filter(x=>!( !x.a||x.b )),reverse=rows.filter(x=>!( !x.b||x.a ));
  const excluded=rows.filter(x=>d.s%2===0?!x.a&&x.b:!x.b&&x.a);
  return [direct.length,reverse.length,excluded[0]?.n||0];
 }
 if(i>=14){
  const idx=i-14,n=d.n,marks=d.rows.map(r=>r[1]);switch(idx){
   case 0:{const valid=d.cells.map(z=>z.startsWith('√')?Number.isInteger(Math.sqrt(Number(z.slice(1)))):true);return [valid.indexOf(false)+1,valid.filter(Boolean).length,Number(valid.every(Boolean))];}
   case 1:{const hyp=Math.sqrt(d.a*d.a+d.b*d.b);return [hyp,hyp-Math.max(d.a,d.b),Number(hyp>d.a&&hyp>d.b)];}
   case 2:return [marks[1]-marks[0],1,0];
   case 3:case 11:return [marks.findIndex(x=>x.endsWith('.'))+1,marks.findIndex(x=>x.endsWith('!'))+1,marks.findIndex(x=>x.endsWith('?'))+1];
   case 4:case 5:{const val=n*(n-1)*(n+1),mod=d.m,first=Array.from({length:mod},(_,j)=>j+1).find(x=>!Number.isInteger((x*x*x-x)/mod));return [val,val-Math.floor(val/mod)*mod,first||0];}
   case 6:return [marks[0].split(',').length,marks[1]*marks[2],0];
   case 7:return [d.grade,Number(d.grade===8),Number(d.grade!==8)];
   case 8:return [d.grade,d.grade-1,0];
   case 9:return [d.year+d.offset,0,1];
   case 10:return [Number(d.x1===d.x2),Math.abs(d.x1-d.x2),1];
  }
 }

 if(i===0){const clocks=d.rows.map(r=>Number(r[1].split(':')[0])),dur=clocks.map(h=>(24+h-d.start)%24);return [dur[0],dur[1],dur[1]-dur[0]];}
 if(i===1||i===2){const [dist,t1,t2]=d.rows.map(r=>r[1]),speed1=dist/t1,speed2=dist/t2,t=dist/(speed1+speed2);return i===1?[speed1,speed1+speed2,t]:[t,t1-t,t2-t];}
 if(i===3||i===4){
  const banned=i===3?[d.h+6,d.h+2]:[d.h,d.h+d.v],hit=Array.from({length:100},(_,k)=>k-25).filter(x=>{
   if(banned.includes(x))return false;const t=x-d.h;
   return i===3?(2*t-3)*(t-2)===(2*t-1)*(t-6):3*(x-d.h-d.v)===2*(x-d.h);
  });assert.equal(hit.length,1);return i===3?[...banned,hit[0]]:[banned.length,Math.max(...banned),hit[0]];
 }
 if(i===5){const [c,a,t]=d.rows.map(r=>r[1]);return [c*a,c*a*t,7];}
 if(i===6){const [t,after]=d.rows.map(r=>parseInt(r[1],10));const first=t+after,second=1/(1/t-1/first);return [first,Math.round(second/first),Math.round(second)];}
 if(i>=7&&i<=10){
  const abs=Math.max(d.h,d.v,d.b)+20,h=d.h,roots=[];for(let x=-abs;x<=abs;x++){
   if(d.excluded.includes(x))continue;
   if([2*x-(h+3)===x-3,(d.a-(d.a+1))===x-h,x**5-d.a*d.a*x**3===0,x**3-d.v*x*x-d.b*d.b*x+d.v*d.b*d.b===0][i-7])roots.push(x);
  }
  assert.deepEqual(Array.from(d.roots).sort((a,b)=>a-b),roots);
  if(i===7)return [h,h,roots.length];if(i===8)return [h,-1,roots[0]];if(i===9)return [roots.length,Math.min(...roots),Math.max(...roots)];
  return [Math.max(...roots),Math.min(...roots),roots.length];
 }
 if(i===11){let now=d.initial,first;for(let i=0;i<3;i++){now=(now-d.e)*4/3;if(!i)first=now;}return [d.initial-d.e,first,now];}
 if(i===12){const [a,b,gap]=d.rows.map(r=>r[1]),t=gap/(b-a);return [t,t*a,t*b];}
 const first=d.total/2.2,second=first*1.2;return [6,Math.round(first/5),Math.round(second)];
}
const click=(doc,a)=>doc.querySelector('[data-action="'+a+'"]').click();
function reply(doc,n){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=n;a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
for(const [i,entry] of book.exercises.entries()){
 assert.equal(entry.path,entry.boardPath);let {dom,w,doc,key,lesson}=open(entry);
 assert.equal(doc.querySelector('#lesson').value,lesson.id);assert.equal(doc.querySelectorAll('#lesson option').length,49);
 assert.equal(doc.querySelector('#source').hash,'#page='+(entry.page+2));assert.equal(doc.querySelector('#back').hash,'#book/source-70');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
 assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'70-'+ids[i+1]);assert(lesson.printedReference.endsWith(entry.printed));
 if(lesson.id==='70-6'){assert(lesson.printedPrompt.includes('к концу третьего года'));assert(lesson.printedGuide.includes('после третьего года, 2960'));}
 const seen=new Set();for(let s=1;s<=11;s++){
  const d=lesson.make(s),answers=oracle(i,d);seen.add(JSON.stringify([d.caption,d.rows]));assert(w.MathExamTopicEdition.figure(d).includes('role="img"'));
  d.questions.forEach((q,j)=>{assert.equal(q.answer,answers[j],lesson.id+'/'+s+'/'+j);for(const [bad,msg] of q.mistakes){assert.notEqual(q.answer,bad,lesson.id);assert(msg.length>14);}});
 }
 assert.equal(seen.size,11,lesson.id);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 click(doc,'practice');reply(doc,99999999);const stash=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,lesson}=open(entry,stash));assert.equal(doc.querySelector('#answer').value,'99999999');
 reply(doc,oracle(i,lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  const d=lesson.make(j+4);if(j===0){const [bad,msg]=d.questions[0].mistakes[0];reply(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');reply(doc,oracle(i,d)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log('Peterson 8 (2017), part 1: 21 native map entries, 30 printed exercise routes and 990 independently checked answers.');
