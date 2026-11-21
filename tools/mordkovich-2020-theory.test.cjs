'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),catalog);
const books=catalog.window.WorkshopCurriculum.books,book=books.find(b=>b.id==='source-24');
assert.equal(book.source.sha256,'64ba72c5b78284a44e582bfa3a61e9ac9e8be21a22b96105ad46843487f60934');
assert.equal(book.source.pages,457);assert.equal(books.find(b=>b.id==='source-25').exercises.length,59);
const pages=[5,23,29,32,45,48,59,72,86,88,94,105,113,129,133,136,146,149,154,156,165,187,206,218,226,230,235,243,250,252,254,263,271,279,292,303,318,327,338,349,358,369,375,380,393,398,413,420,433];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const physical=p=>p<=48?p-1:p<=115?p:p+2;
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.section,i+1);assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000024.pdf#page='+physical(pages[i]));
 if(i){assert(r.bookOnly);assert(!r.boardPath);assert(!r.externalPath);}
}
assert(book.mapping[21].title.includes('и неравенства'));assert(book.mapping[24].title.includes('и разности'));
const labels=['Введение к §1','Определение 1',...Array.from({length:9},(_,i)=>'Свойство '+(i+1)),'Пример 1'];
assert.deepEqual(Array.from(book.exercises,x=>x.printedLabel),labels);
const directory='trainers/mordkovich-2020/',html=read(directory+'index.html');
const scripts=Array.from(html.matchAll(/<script defer src="([^"]+)"/g),([,p])=>p)
 .filter(p=>!p.startsWith('/')&&!p.includes('board-bridge')).map(p=>read(path.join(directory,p)));
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://mathexam.example'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;const id=entry.path.split('/').at(-1),key='math:mordkovich-2020:v1:'+id;
 if(saved)w.localStorage.setItem(key,saved);
 for(const script of scripts)w.eval(script);
 return {dom,w,doc:w.document,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function oracle(d){
 const vals=d.rows.map(row=>row[1]);
 if(d.family==='sets'){
  const points=Array.from({length:d.hi-d.lo+1},(_,i)=>d.lo+i);
  return [points.filter(n=>n>0).length,points.length,1];
 }
 if(d.family==='definition')return [vals[0],Math.floor(vals[1]/vals[0]),(vals[1]+1)%vals[0]];
 if(d.family==='product')return [Math.min(...d.cells),8/4,d.cells.reduce((a,b)=>a*b,1)/8];
 const divide=(a,b)=>Math.floor(a/b),res=(a,b)=>a-divide(a,b)*b;
 switch(d.i){
 case 0:return [vals[0]/vals[1],vals[1]/vals[2],vals[0]/vals[2]];
 case 1:case 7:return [vals[0]/vals[2],vals[1]/vals[2],vals[4]/vals[2]];
 case 2:return [res(vals[1],vals[0]),res(vals[1]+vals[2],vals[0]),res(vals[1]+vals[2]+vals[3],vals[0])];
 case 3:return [vals[0]/vals[2],vals[4]/vals[2],(vals[4]-vals[0])/vals[2]];
 case 4:{const [a,b]=vals[2].split(' и ').map(Number);return [vals[0]/a,vals[1]/b,(vals[0]*vals[1])/(a*b)];}
 case 5:{const [a,b]=vals[0].split(' / ').map(Number),[u,v]=vals[1].split(' / ').map(Number);return [a/b,u/v,u/a];}
 case 6:return [res(vals[0],vals[2]),res(vals[1],vals[2]),res(vals[0]*vals[1],vals[2])];
 case 8:{const all=d.cells.filter(n=>res(n,d.size)===0);return [all[0],all.length,all[0]/d.size];}
 }
 throw Error('unknown theory');
}
const click=(doc,a)=>doc.querySelector('[data-action="'+a+'"]').click();
function reply(doc,answer){
 const node=doc.querySelector('#answer'),E=doc.defaultView.Event;node.value=answer;node.dispatchEvent(new E('input',{bubbles:true}));
 doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));
}
for(const [i,entry] of book.exercises.entries()){
 assert.equal(entry.path,entry.boardPath);let {dom,w,doc,key,lesson}=open(entry);
 assert.equal(doc.querySelector('#lesson').value,lesson.id);assert.equal(doc.querySelectorAll('#lesson option').length,71);
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
 assert.equal(doc.querySelector('#back').hash,'#book/source-24');
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000024.pdf#page='+physical(entry.page));
 assert(doc.querySelector('#edition').textContent.includes('часть 1'));assert.equal(lesson.printedReference,entry.printedLabel);
 const next=book.exercises[i+1]?.path.split('/').at(-1);assert.equal(w.MathExamTopicEdition.nextId(lesson),next);
 const seen=new Set();for(let s=1;s<=11;s++){
  const d=lesson.make(s),answers=oracle(d);seen.add(JSON.stringify([d.caption,d.rows]));
  assert(w.MathExamTopicEdition.figure(d).includes('role="img"'));
  d.questions.forEach((q,j)=>{assert.equal(q.answer,answers[j],lesson.id+'/'+s+'/'+j);
   for(const [bad,msg] of q.mistakes){assert.notEqual(q.answer,bad);assert(msg.length>15);}});
 }
 assert.equal(seen.size,11,lesson.id);
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 assert(!doc.querySelector('#work').textContent.includes(lesson.printedGuide));click(doc,'printed-guide');
 assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 click(doc,'practice');reply(doc,99999999);
 const saved=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,lesson}=open(entry,saved));
 assert.equal(doc.querySelector('#answer').value,'99999999');reply(doc,oracle(lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  const d=lesson.make(4+j);if(j===0){const [bad,msg]=d.questions[j].mistakes[0];reply(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');reply(doc,oracle(d)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);
 click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log('Theory volume 24: 49 printed sections, 12 distinct anchors, 396 independent answers plus 12 corrected/unaided/helped cycles, persisted drafts and fresh retries.');
