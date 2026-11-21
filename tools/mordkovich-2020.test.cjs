'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cwd='trainers/mordkovich-2020/',html=read(cwd+'index.html');
const catalog=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),catalog);
const book=catalog.window.WorkshopCurriculum.books.find(b=>b.id==='source-25');
assert.equal(book.source.sha256,'3673e0c373ede390ba966c168beb2ffef1aed709cb3b33268729052adfd884fa');
assert.equal(book.source.pages,352);
const pages=[4,21,27,29,32,35,37,43,55,66,73,80,85,88,94,99,101,111,116,119,123,126,136,144,150,157,160,165,174,178,182,185,189,193,197,203,206,210,219,224,234,237,246,251,262,277,279,287,292,297];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.section,i);assert.equal(new URL(r.sourcePath).hash,'#page='+(r.page+(r.page<170?-1:1)));
 if(i){assert(r.bookOnly);assert(!r.boardPath);assert(!r.externalPath);}
}
const ids=['1a','1b','1c','1d','2','3a','3b','3c','3d','4a','4b','4c','4d','5a','5b','6a','6b','6c','6d','7a','7b','7c','7d'];
assert.deepEqual(Array.from(book.exercises,r=>r.path.split('/').pop()),ids.map(x=>'25-review-'+x));
assert.deepEqual(Array.from(book.exercises,r=>r.printed),ids.map(id=>id.replace(/[abcd]/g,x=>'абвг'['abcd'.indexOf(x)])));
const scripts=['trainers/tyurin-statistics/content.js',cwd+'review.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 const id=entry.path.split('/').pop(), key='math:mordkovich-2020:v1:'+id;if(saved)w.localStorage.setItem(key,saved);
 for(const script of scripts)w.eval(script);
 return {dom,w,doc:w.document,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
const numericType=value=>{
 if(typeof value==='number')return Number.isInteger(value)?value>0?0:1:2;
 if(value.startsWith('√'))return Number.isInteger(Math.sqrt(+value.slice(1)))?0:3;
 if(value.includes('π'))return 3;
 return value.includes('/')?2:Number(value.replace('−','-'))>0?0:1;
};
function oracle(i,d){
 if(i<4){
  const hits=v=>[[0],[0,1,2],[0,1],[3]][i].includes(numericType(v));
  const cnt=d.list.filter(hits).length,inExtra=+hits(d.extra[0]);
  return [cnt,inExtra,d.list.length+1-cnt-inExtra];
 }
 if(i===4){const zToN=d.caption.includes('Z ⊂ N'),bad=d.list.map(numericType).map(t=>zToN?t===1:t===2);return [bad.indexOf(true)+1,bad.filter(Boolean).length,d.list.findIndex(x=>numericType(x)===3)+1];}
 if(i<9){const v=d.values.filter(v=>Number.isInteger(v/d.d));return [v.length,v.reduce((a,b)=>a+b,0),d.values.at(-1)%d.d];}
 if(i<13){
  const div=Array.from({length:d.v},(_,k)=>k+1).filter(k=>Number.isInteger(d.v/k));
  const small=Math.max(...div.filter(k=>k<=Math.sqrt(d.v)));return [div.length,d.v/small,Math.max(...div.filter(k=>k<d.v))];
 }
 if(i<15)return [d.n/d.b,d.product/d.k,d.n*d.a/(d.a*d.b)];
 if(i<19){const first=d.e1/d.common,second=d.e2/d.common,bracket=first+(i===17?-second:second);return [first,bracket,(d.e1+(i===17?-d.e2:d.e2))/bracket];}
 return [+String(d.n).slice(-d.width),d.n%d.d,(d.n+1)%d.d];
}
function click(doc,id){const el=doc.querySelector('[data-action="'+id+'"]');assert(el,id);el.click();}
function reply(doc,v){const a=doc.querySelector('#answer');a.value=v;const E=doc.defaultView.Event;a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
for(const [i,entry] of book.exercises.entries()){
 assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,4);
 let {dom,w,doc,key,lesson}=open(entry);
 assert.equal(doc.querySelector('#lesson').value,lesson.id);assert.equal(doc.querySelectorAll('#lesson option').length,23);
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
 assert.equal(doc.querySelector('#source').hash,'#page=3');assert(doc.querySelector('#worked-data svg[aria-label]'));
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 assert(!doc.querySelector('#work').textContent.includes(lesson.printedGuide));click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'25-review-'+ids[i+1]);
 const seen=new Set();
 for(let s=1;s<=11;s++){
  const d=lesson.make(s),answers=oracle(i,d);seen.add(JSON.stringify([d.caption,d.rows]));
  d.questions.forEach((q,j)=>{assert.equal(q.answer,answers[j],lesson.id+'/'+s+'/'+j);for(const [bad,msg] of q.mistakes){assert.notEqual(bad,q.answer);assert(msg.length>=20);}});
 }
 assert.equal(seen.size,11,lesson.id);
 click(doc,'practice');reply(doc,99999999);
 const saved=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,lesson}=open(entry,saved));
 assert.equal(doc.querySelector('#answer').value,'99999999');
 reply(doc,oracle(i,lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  const d=lesson.make(4+j);
  if(j===0){const [bad,msg]=d.questions[j].mistakes[0];reply(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');reply(doc,oracle(i,d)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);
 click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log('Mordkovich/Semenov 2020: 50 printed entries, 23 individual learning flows, 759 independently checked answers, 23 corrections, unaided answers, help, reloads and fresh retries.');
