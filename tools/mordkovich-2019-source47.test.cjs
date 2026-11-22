'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/mordkovich-2019/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-47');
assert.equal(book.source.sha256,'c2f2e1a40ae0fa40554ffb968ccd521414de9441b34a07d143ff41ffb712242b');
assert.equal(book.source.pages,290);assert(book.note.includes('978-5-346-04287-7'));
const pages=[3, 4, 4, 10, 16, 24, 27, 32, 36, 44, 44, 53, 55, 60, 68, 70, 74, 83, 83, 92, 102, 113, 121, 130, 135, 135, 142, 147, 156, 168, 172, 172, 177, 183, 187, 192, 264];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=Array.from({length:24},(_,i)=>'1-'+(1+Math.floor(i/4))+'-'+'abcd'[i%4]);
const printed=ids.map((_,i)=>'Упражнение №1.'+(1+Math.floor(i/4))+'абвг'[i%4]);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000035.pdf#page='+(r.page+1));
 if(i!==2){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=[...read(dir+'index.html').matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:mordkovich-2019:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s) {
 if(i>=20){
   const a=s+2,b=s+3,j=i-20,roots=[[0,a],[0,a/2,a+3],[-a,0],[-a,0,b/2]][j],lo=Math.floor(roots[0])-1,hi=Math.ceil(roots.at(-1))+1;
   const input=t=>[t*(t-a)<0,t*(t-a/2)*(t-a-3)>=0,t*(t+a)>0,t*(t+a)*(t-b/2)<=0][j];
   let count=0;for(let t=lo;t<=hi;t++)if(input(t))count++;
   return [Math.max(...roots),j%2?roots.length:0,count];
 }
 const h=(s-6)*(-1)**(i%2),radius=1+s%4,low=h-radius,high=h+radius;
 const a=(1+s%3)*((i===5||i===7||i>=12&&i<16)?-1:1);
 const b=-2*a*h;
 const q=x=>a*x*x+b*x+c;
 const two=i<4||i>=16,single=i>=4&&i<8;
 const c=two?a*low*high:single?a*h*h:a*h*h+Math.sign(a)*(s+2);
 const test=[h,low,high+1,h+1][s%4],left=low-1-s%3,right=high+1+s%3;
 const strict=[5,8,10,12,14,16,17,18,19].includes(i);
 const up=[2,3,4,5,7,8,11,13,14,16,18].includes(i);
 const ok=x=>{const y=q(x);return y===0?!strict:up?y>0:y<0;};
 const count=Array.from({length:right-left+1},(_,j)=>left+j).filter(ok).length;
 if(two)return [low,Number(ok(test)),count];
 if(single)return [h,Number(ok(test)),q(right)];
 return [-b/(2*a),q(h),count];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=Number.isInteger(v)?String(v):v.toFixed(8);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='47-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<20?4:5);
 let {dom,w,doc,key,l}=open(r);
 assert(doc.querySelector('#edition').textContent.includes('13-е издание'));assert(!doc.querySelector('#edition').textContent.includes('14-е'));assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,479);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000035.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-47');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'47-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Мордкович и Николаев, 9 класс, часть 2: 37 строк оглавления, 24 подпункта №1.1–1.6, 792 независимых ответов.');
