'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/vilenkin8-2010/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-82');
assert.equal(book.source.sha256,'527b99906f8be01f71d1a075f9cd1469ba2fb2c4b430ab6ca539e93a975f34e5');assert.equal(book.source.pages,305);assert(book.note.includes('978-5-09-019502-7'));
const pages=[3,7,9,15,18,22,24,26,29,34,36,37,39,42,44,48,52,55,58,60,63,66,68,69,74,77,87,90,93,96,99,100,102,105,107,109,
 112,114,117,122,124,127,131,133,135,137,142,144,150,155,157,160,162,165,168,171,175,177,178,179,181,184,187,190,192,195,197,201,206,207,
 211,215,220,222,226,231,234,236,242,244,246,248,250,253,257,261,264,267,272];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=['1','2a','2b','3','4',...Array.from('abcdefgh',c=>'5'+c)],printed=['1','2а','2б','3','4',...Array.from('абвгдежз',c=>'5'+c)];
for(const [i,r] of book.mapping.entries()){
 const physical=r.page<=226?r.page:r.page-2;
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000067.pdf#page='+physical);
 if(r.page===226){assert(r.focus.includes('отсутствует'));assert.equal(r.sourceLinkLabel,'Открыть продолжение со с. 228');}
 else assert.equal(r.sourceLinkLabel,undefined);
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'fractions.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:vilenkin8-2010:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const k=s+2;
 if(i===0){const cards=Array.from({length:4},(_,j)=>(j+s)%4);return [2,cards.indexOf(1)+1,cards.indexOf(2)+1];}
 if(i===1){const y=k+2;return [k*y,k+y,k*y/(k+y)];}
 if(i===2){const y=k,x=k*(2+s%3);return [x-y,x/y,(x-y)*y/x];}
 if(i===3){const b=k,c=2+s%4,a=(s+1)*b*c;return [a*c/b,a/b/c,c*c];}
 if(i===4){const b=k,c=2+s%4,d=c+2,a=(s+1)*b*c*d;return [a/b/c/d,(a/b)/(c/d),a/((b/c)/d)];}
 const j=i-5,y=(s+5)*(s%2?1:-1),b=s+1,a=2*b+1;
 const left=[y,a/b,y/5,-y/5,y/5,y/5,y/5,y/5][j],right=[1/y,b/a,-y/5,-y/5,-y/5,y/5,5/y,-5/y][j];
 return [right,[0,1,6,7].includes(j)?left*right:left+right,[0,1,6,7].includes(j)?2:1];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='82-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,4);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,13);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000067.pdf#page=4');assert.equal(doc.querySelector('#back').hash,'#book/source-82');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'82-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Vilenkin advanced grade 8: 89 verified sections, missing scan leaves marked, 13 native exercise routes and 429 checked answers.');
