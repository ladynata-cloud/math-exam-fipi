'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/mordkovich-2013/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-20');
assert.equal(book.source.sha256,'ac54155d0a75e395ca24d63b42dfe202dc841f7ae3de8d286efacdfa42f967ee');assert.equal(book.source.pages,405);assert(book.note.includes('978-5-346-02410-1'));
const pages=[5,11,18,23,36,44,57,59,63,65,70,73,75,82,87,92,99,103,113,118,121,128,134,135,137,143,147,156,164,173,178,188,192,200,204,209,214,219,223,232,243,248,251,256,262,266,271,273,281,287,297,312,319,329,331,343,352,359,371,376,383,391];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
assert.equal(book.mapping.find(r=>r.sectionLabel==='§ 24').title,'Предел последовательности');
const ids=['def1','def2','fig1a','fig1b','fig2a','fig2b','fig3','fig4','fig5','fig6','fig7','fig8','example1a','example1b','example2'];
const labels=['§1, определение 1','§1, определение 2','Рис. 1а','Рис. 1б','Рис. 2а','Рис. 2б','Рис. 3','Рис. 4','Рис. 5','Рис. 6','Рис. 7','Рис. 8','§1, пример 1а','§1, пример 1б','§1, пример 2'];
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000010.pdf#page='+(r.page+3));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['identities.js','quotients.js','quadrants.js','ranges.js','arguments.js','functions-theory.js'].map(f=>dir+f),'trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:mordkovich-2013:v1:'+id;
 w.localStorage.setItem('math:mordkovich-2013:v1:21-7-1a','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const n=s+2,k=2+s%3,h=1+s%3,v=2+s%4,t=s+3;
 if(i===0)return [3,2,2];
 if(i===1)return [n+2*k,0,n];
 if(i===2||i===3)return [h,(i===2?1:-1)*t*t+v,h-t];
 if(i===4||i===5){const a=(i===4?1:-1)*n;return [a,-a/t,0];}
 if(i===6||i===8){const sh=i===8?h:0;return [-sh,t,(t+1)**2-sh];}
 if(i===7||i===10){const x=i===10?h:0,y=i===10?v:0;return [y,t+y,t+x];}
 if(i===9)return [-h*h,-h,t*t-h*h];
 if(i===11){const a=h,b=a*(s+1);return [-b,-b/a,-(a*t+b)];}
 const a=k;
 if(i===12)return [-a*a,a,1+1/n];
 if(i===13)return [-a*a,0,a];
 return [1+s%8,0,10];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='20-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printedLabel,labels[i]);assert.equal(r.page,[5,5,6,6,6,6,6,6,7,7,7,7,8,8,10][i]);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,80);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000010.pdf#page='+(r.page+3));assert.equal(doc.querySelector('#back').hash,'#book/source-20');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'20-'+ids[i+1]);assert.equal(r.title,l.title);
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
 assert.equal(w.localStorage.getItem('math:mordkovich-2013:v1:21-7-1a'),'preserved');dom.window.close();
}
console.log('Mordkovich 2013 theory: 62 verified section and supplement links, 15 individual practices, 495 independent answers and saved progress.');
