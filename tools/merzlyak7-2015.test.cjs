'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/merzlyak9-2014/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-93');
assert.equal(book.source.sha256,'35ff5da97b8b42439b89a235db47ab2c20acf5500f88d04b76b50e6b50c11a87');assert.equal(book.source.pages,275);assert(book.note.includes('978-5-360-05509-9'));
const pages=[3, 5, 11, 13, 19, 27, 28, 30, 35, 43, 51, 57, 61, 68, 69, 74, 80, 87, 91, 92, 97, 102, 109, 116, 117, 122, 129, 130, 132, 135, 147, 153, 163, 175, 177, 178, 186, 195, 195, 203, 207, 214, 223, 225, 227, 237, 250, 254, 259, 266, 268];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const counts=[6,12,15,5,4,5,4];
const ids=['example',...counts.flatMap((total,i)=>Array.from({length:total},(_,j)=>(i+1)+'-'+(j+1)))];
const printed=ids.map(id=>id==='example'?'Пример':id.replace(/(\d+)-(\d+)/,'$1($2)'));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000071.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['edition','inequalities','functions','applied','sequences','expressions-2015','expression-figure'].map(f=>dir+f+'.js'),'trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:merzlyak9-2014:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function parseLabel(source){
 // The authored table uses fully parenthesized internal blocks. Re-evaluate its visible labels, independently of the trainer's rational arithmetic.
 const token=source.replace(/−/g,'-').match(/\d+ \d+\/\d+|\d+\/\d+|\d+(?:,\d+)?|[^\s]/g);let cursor=0;
 const parseAtom=()=>{const v=token[cursor++];if(v==='-')return -parseAtom();if(v==='('){const result=expr();assert.equal(token[cursor++],')');return result;}if(v.includes(' ')){const [n,f]=v.split(' '),[p,q]=f.split('/').map(Number);return +n+p/q;}if(v.includes('/')){const [p,q]=v.split('/').map(Number);return p/q;}return Number(v.replace(',','.'));};
 const expr=()=>{let x=parseAtom();while(cursor<token.length&&token[cursor]!==')'){const op=token[cursor++],y=parseAtom();if(op==='+')x+=y;else if(op==='-')x-=y;else if(op==='·')x*=y;else if(op===':')x/=y;else if(op==='^')x**=y;else throw Error(op);}return x;};
 const val=expr();assert.equal(cursor,token.length);return val;
}
function ratio(v){
 for(let d=1;d<100000;d++){const n=Math.round(v*d);if(Math.abs(v*d-n)<1e-8)return[n,d];}throw Error(v);
}
function solve(i,s){
 const id=ids[i],l=pure.window.MathExamTopicPractice.lessons.get('93-'+id),data=l.make(s),vals=data.rows.map(r=>r[1]);
 if(id==='example')return [-vals[0],7*vals[1],-7*vals[0]*vals[1]];
 const x=parseLabel(vals[1]),y=parseLabel(vals[2]),result=parseLabel(vals[0]),A=ratio(x),B=ratio(y),op=data.tree.op;
 if(data.tree.A.op||data.tree.B.op)return[x,y,result];
 if(op==='+'||op==='-'){let d=Math.max(A[1],B[1]);while(d%A[1]||d%B[1])d++;return[Math.round(x*d),Math.round(y*d),result];}
 if(op==='^')return[A[0]**y,A[1]**y,result];
 return op==='*'?[A[0]*B[0],A[1]*B[1],result]:[A[0]*Math.sign(B[0])*B[1],A[1]*Math.abs(B[0]),result];
}
const originals=['140', '1869/500', '6/5', '27/50', '9/10', '800', '9/4', '7/6', '13/63', '1/10', '8', '6/5', '1/6', '22', '157/24', '22/5', '179/63', '85/8', '3/10', '13/10', '0', '-61/100', '86/5', '-3/2', '-39/5', '12/5', '-7', '-16/5', '3/5', '0', '3/10', '-4/5', '1/8', '16/9', '463/27', '5/4', '-3/10', '-4/3', '1', '58/5', '5/4', '22/5', '-7/10', '-2', '-191/2', '7', '16', '136', '3/4', '-8', '14/5', '-8'];
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='93-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,(ids[i]==='example'||parseInt(ids[i])<=2)?6:7);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,78);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000071.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-93');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'93-'+ids[i+1]);assert.equal(r.title,l.title);
 if(ids[i]!=='example'){const m=l.printedGuide.match(/(?:получится|получается|Ответ) ([−-]?\d+(?:\/\d+)?)\.$/i);if(m)assert.equal(parseLabel(m[1]),parseLabel(originals[i]),id+' printed answer');else{const all=l.printedGuide.match(/= ([−-]?\d+(?:\/\d+)?)\.$/);assert(all,id);assert.equal(parseLabel(all[1]),parseLabel(originals[i]),id+' printed answer');}}
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
console.log('Мерзляк‑7, 2015: 51 строка карты, печатный пример и все 51 подпункт №1–7. Проверен каждый исходный ответ и 1716 новых самостоятельных ответов.');
