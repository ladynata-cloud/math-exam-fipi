'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/peterson8-2017/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-73');
assert.equal(book.source.sha256,'b03dcf7bae31a3479d017b776f6aaa661b489ca327624996e242faca5ccd1dcf');
assert.equal(book.source.pages,147);assert(book.note.includes('978-5-9963-3229-8'));
assert.deepEqual(Array.from(book.mapping,r=>r.page),[3,13,21,29,38,43,45,58,67,72,74,76,83,91,96,102,110,120,122,124,134]);
const ids=['1','2a','2b','2c','3',...Array.from('abcdef',ch=>'4'+ch),'5a','5b'];
const printed=['1','2а','2б','2в','3',...Array.from('абвгде',ch=>'4'+ch),'5а','5б'];
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000059.pdf#page='+(r.page+2));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['questions','logic','powers','power-order','fractions'].map(p=>dir+p+'.js'),'trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:peterson8-2017:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
const gcd=(a,b)=>b?gcd(b,a%b):a;
function solve(i,s){
 const h=s+2;
 if(i===0){const cards=Array.from({length:4},(_,j)=>(j+s)%4);return [cards.indexOf(1)+1,cards.indexOf(0)+1,2];}
 if(i===1)return [5*h,3*h/(5*h),3*h/(5*h)*100];
 if(i===2){const work=s+7,check=work-3;return [check,work+check,(work+check)/46];}
 if(i===3){const warm=s+5,tech=warm+4,all=3+warm+tech+s+3;return [tech,all,tech/all];}
 if(i===4){const f=x=>(2*x+1)/(x-h);return [h,f(h-1),f(h+2)];}
 if(i>=5&&i<=10){
  const j=i-5,top=t=>[t+1,t-2,t*t+t,t*t+2*t+1,t**3-t*t+2*t+3,t*t-6*t+8][j];
  const bot=t=>[t-1,t-3,t*t-t,t*t-1,t*t-5*t+6,t*t-7*t+12][j];
  const xs=Array.from({length:31},(_,k)=>h-15+k),roots=xs.filter(x=>bot(x-h)===0);
  if(roots.length===1){const t=roots[0]-h+1;return [roots[0],xs.find(x=>top(x-h)===0),top(t)/bot(t)];}
  const common=roots.filter(x=>top(x-h)===0);return [roots[0],roots.at(-1),common.length?common[0]:0];
 }
 if(i===11){const a=(s+1)*h,b=(s+2)*h,g=gcd(a,b),target=(s+2)*(2+s%3);return [g,b/g,a*target/b];}
 const c=s+2,a=c+1;return [a,3*c*c,a*c*3];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='73-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<3?7:8);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,84);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000059.pdf#page='+(r.page+2));assert.equal(doc.querySelector('#back').hash,'#book/source-73');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'73-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Part 3: 21 printed sections, 13 exercise routes, 429 independently checked answers, diagnostics and persisted individual records.');
