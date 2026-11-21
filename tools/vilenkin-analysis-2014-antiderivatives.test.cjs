'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),root=path.join(__dirname,'..'),dir='trainers/vilenkin-analysis-2014';
const read=file=>fs.readFileSync(path.join(root,file),'utf8'),html=read(dir+'/index.html');
const context=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),context);
const book=context.window.WorkshopCurriculum.books.find(b=>b.id==='source-6');
assert.equal(book.source.sha256,'8d2cfbdc62180a6c89ecce5b88c1c0280ee4f1685e188e6f0fcba3f8a35e00eb');
assert.equal(book.source.pages,313);assert(book.note.includes('978-5-346-02829-1'));
const source=(p)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000006.pdf#page='+(p+1);
const pageList=[3,5,5,9,10,13,16,21,24,27,28,31,33,36,43,47,50,55,57,60,63,68,70,72,74,76,81,87,89,93,94,96,99,102,104,105,109,112,113,118,120,121,124,128,132,139,142,146,149,151,157,160,161,163,169,173,177,186,188,192,194,197,198,203,205,206,211,214,217,220,222,223,225,229,231,234,236,238,240,241,243,245,248,253,254,258,264,270,273,277,283,286,293,299,309];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pageList);assert.deepEqual(Array.from(book.mapping.filter(r=>r.sectionLabel.endsWith('*')),r=>r.sectionLabel),['2.3.5*','2.3.6*','3.2.6*']);
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,source(r.page));if(i===1||i===2){assert.equal(r.coverage,'module');assert(r.boardPath.endsWith('/6-topic-'+i));}
 else {assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}
}
const entries=[...Array.from(book.mapping.slice(1,3),r=>({path:r.externalPath,page:r.page})),...book.exercises];
const keys=['topic-1','topic-2','1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4','2-5','2-6'];
const print=['1 (1)','1 (2)','1 (3)','1 (4)','2 (1)','2 (2)','2 (3)','2 (4)','2 (5)','2 (6)'];
assert.deepEqual(Array.from(book.exercises,x=>x.printed),print);
const scripts=['trainers/tyurin-statistics/content.js',dir+'/irrationality.js',dir+'/decimal-bounds.js',dir+'/antiderivatives.js','trainers/tyurin-statistics/app.js'].map(read);
function open(path,stash){
 const dom=new JSDOM(html,{url:'https://example.test'+path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;const id=path.split('/').at(-1),key='math:vilenkin-analysis-2014:v1:'+id;
 if(stash)w.localStorage.setItem(key,stash);w.localStorage.setItem('math:vilenkin-analysis-2014:v1:30-14','earlier local state');for(const src of scripts)w.eval(src);
 return {dom,w,doc,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function independent(i,s){
 const n=s+2,k=s+2,t=2+s%3;
 if(i===0){const a=s+1,c=2*s+1;return [2*a*t,a*t*t,a*t*t+c];}
 if(i===1){const a=s+1,b=2*s+5,c=s+2,x=1+s%3;return [2*a*x,b-c,0];}
 if(i===2)return [n+1,(s+3)/(n+1),s+4];
 if(i===3){const root=2+s%4,top=root*(s+1)+1;return [top/root,(top+root)/root,root/(top+root)];}
 if(i===4)return [(2-9)/6,6*(s+3),-2*(2*s+1)];
 if(i===5){const x=1+s%3,a=s+2;return [a,-a,(x**4-a**2)/(x**2+a)];}
 if(i===6)return [2+s%4,k,-k*(s+3)];
 if(i===7)return [k*k,2*k,0];
 if(i===8)return [2,3*k,2*s+3];
 if(i===9){const x=1/(2*k);return [k*k,2*k,1/Math.sqrt(1-1/(16*k*k))];}
 if(i===10){const x=(1+s%3)**2,b=s+3;return [1/(2*Math.sqrt(x)),-2*b,-(s+2)*Math.sin(Math.sqrt(x))/(2*Math.sqrt(x))-2*b*x*Math.cos(x*x)];}
 return [2+s%5,3+s%5,k];
}
const act=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function submit(doc,value){const a=doc.querySelector('#answer');a.value=String(value);a.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));a.form.dispatchEvent(new doc.defaultView.Event('submit',{bubbles:true,cancelable:true}));}
for(const [i,r] of entries.entries()){
 const id='6-'+keys[i];assert.equal(r.path,'/'+dir+'/index.html#lesson/'+id);
 let {dom,w,doc,key,lesson}=open(r.path);
 if(i>1){assert.equal(r.title,lesson.title);assert.equal(r.path,r.boardPath);}
 assert.equal(doc.querySelectorAll('#lesson option').length,42);assert(doc.querySelector('#edition').textContent.includes('11 класс'));
 assert.equal(doc.querySelector('#back').hash,'#book/source-6');assert.equal(doc.querySelector('#source').href,source(r.page));
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);
 assert.equal(w.MathExamTopicEdition.nextId(lesson),keys[i+1]&&'6-'+keys[i+1]);
 const variants=new Set();
 for(let s=1;s<=11;s++){
  const d=lesson.make(s),target=independent(i,s);variants.add(JSON.stringify(d.rows));assert.equal(d.questions.length,3);
  for(const [j,q] of d.questions.entries()){assert(Math.abs(q.answer-target[j])<1e-9,id+'/'+s+'/'+j);assert(q.mistakes.length);
   for(const [wrong,how] of q.mistakes){assert(Math.abs(wrong-q.answer)>5.1e-7,id+'/'+s+'/'+j);assert(how.length>20);}}
  assert(w.MathExamTopicEdition.figure(d).includes('role="img"'));
 }
 assert.equal(variants.size,11,id);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 act(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 act(doc,'practice');submit(doc,9999999);const saved=w.localStorage.getItem(key);dom.window.close();
 ({dom,w,doc,key,lesson}=open(r.path,saved));assert.equal(doc.querySelector('#answer').value,'9999999');
 submit(doc,independent(i,2)[2]);act(doc,'next');
 for(let j=0;j<3;j++){if(j===0){const [bad,message]=lesson.make(4).questions[0].mistakes[0];submit(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(message));}if(j===2)act(doc,'hint');submit(doc,independent(i,j+4)[j]);act(doc,'next');}
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);act(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);
 assert.equal(w.localStorage.getItem('math:vilenkin-analysis-2014:v1:30-14'),'earlier local state');dom.window.close();
}
console.log('Vilenkin grade 11 advanced 2014: 95 printed rows; two introduction models, all ten subparts of exercises 1 and 2, 396 mathematical answers, local progress and book isolation.');
