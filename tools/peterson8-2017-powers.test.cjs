'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/peterson8-2017/',read=p=>fs.readFileSync(path.join(root,p),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-71');
assert.equal(book.source.sha256,'2589dcee6a1fc39290eb51c1f0fb66b8dc094a0322bd593a6d0a595a7704bae9');
assert.equal(book.source.pages,163);assert(book.note.includes('978-5-9963-3228-1'));
assert.deepEqual(Array.from(book.mapping,r=>r.page),[3,16,28,37,45,52,57,62,64,68,75,82,88,95,100,106,112,114,120,127,133,141,148,150]);
const ids=['1a','1b','2',...Array.from({length:8},(_,j)=>'3-'+(j+1)),...Array.from({length:8},(_,j)=>'4-'+(j+1)),...[8,8,3,3].flatMap((n,j)=>Array.from({length:n},(_,k)=>(j+5)+'abcdefgh'[k]))];
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000058.pdf#page='+(r.page+2));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}
 else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
}
const programs=[read('trainers/tyurin-statistics/content.js'),read(dir+'questions.js'),read(dir+'logic.js'),read(dir+'powers.js'),read(dir+'power-order.js'),read(dir+'fractions.js'),read(dir+'restrictions.js'),read('trainers/tyurin-statistics/app.js')];
const other='math:peterson8-2017:v1:70-1-1';
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:peterson8-2017:v1:'+id;
 w.localStorage.setItem(other,'earlier pupil draft');if(stash)w.localStorage.setItem(key,stash);for(const p of programs)w.eval(p);
 return {dom,w,doc:w.document,key,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
function ref(i,s){
 if(i>=19&&i<35){
  const n=i<27?8:11,k=s+2,idx=(i-19)%8;
  const ab=n===8?[[k+2,k],[-k-1,k],[-k-2,-k],[0,-k-0.5],[-k/2,k/2],[1/(k+1),1],[-1/k,1/(k+1)],[-k-0.2,k+1]][idx]:
   [[k+0.2,k+1],[k,-k-0.5],[-k-1.5,-k-0.5],[-k,0],[k+0.5,-k-0.5],[1/(k+1),1/k],[1/k,1/(k+2)],[-1/k,-1]][idx];
  const raised=ab.map(x=>Array(n).fill(x).reduce((a,b)=>a*b,1));
  return [n===8?Math.sign(Math.abs(ab[0])-Math.abs(ab[1])):ab.filter(x=>x<0).length,Math.sign(raised[0]-raised[1]),raised.filter(x=>x>0).length];
 }
 if(i>=35){
  const k=s+1,ranges=[[-k,k],[-k-1,k+1],[0,k],[-k,k],[0,k],[-k-1,k]];
  const [left,right]=ranges[i-35],degree=i<38?4:7;
  const pairs=Array.from({length:right-left+1},(_,j)=>{const x=j+left;return [x,Array(degree).fill(x).reduce((a,b)=>a*b,1)];});
  const values=pairs.map(row=>row[1]),largest=Math.max(...values);
  return [Math.min(...values),largest,degree===4?values.filter(y=>y===largest).length:values.filter(y=>y<0).length];
 }
 const n=i===0||i>=3&&i<11?2:3;
 const pow=(v,k)=>Array(k).fill(v).reduce((a,b)=>a*b,1);
 if(i<2){const a=(s+1)/2;return [pow(a,n),pow(-a,n),pow(2,n)];}
 if(i===2){
  const a=s+2,unsorted=[1/(a+1)/(a+1),1/a/a,a*a,-(a+1)*(a+1),-a*a*a];
  const cards=unsorted.map((_,j)=>({value:unsorted[(j+s)%5],position:j+1})).filter(x=>x.value>0).sort((a,b)=>a.value-b.value);
  return [cards.length,cards[0].position,cards.at(-1).position];
 }
 const which=(i-3)%8,v=s+2,p=pow(v,n),m=pow(-v,n),after=pow(v+1,n);
 if(which===0||which===2)return [p,after,after-p];
 if(which===1||which===3)return [m,after,p+m];
 if(which===4)return [p,1,m];
 if(which===5){const a=(2*s+1)/2;return [pow(a,n),pow(-a,n),pow(a,n)+pow(-a,n)];}
 if(which===6)return [m,Math.abs(-v-v),[m,p].filter(x=>x>0).length];
 const points=Array.from({length:2*v+1},(_,j)=>pow(j-v,n));return [points[1]-points[0],Math.min(...points),Math.max(...points)];
}
function reply(doc,num){
 const e=doc.querySelector('#answer');e.value=String(num);e.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
 doc.querySelector('#work form').dispatchEvent(new doc.defaultView.Event('submit',{bubbles:true,cancelable:true}));
}
const click=(doc,action)=>doc.querySelector('[data-action="'+action+'"]').click();
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='71-'+ids[i];
 assert.equal(r.path,dir.replace(/^/,'/')+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);
 assert.equal(r.page,i>=17?9:8);
 let {dom,doc,w,key,lesson}=open(r);assert.equal(doc.querySelector('#lesson').value,id);
 assert.equal(doc.querySelectorAll('#lesson option').length,97);assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000058.pdf#page='+(r.page+2));assert.equal(doc.querySelector('#back').hash,'#book/source-71');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);
 assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'71-'+ids[i+1]);assert(lesson.printedReference.endsWith(r.printed));
 assert.equal(doc.querySelector('#title').textContent,r.title);
 const seen=new Set();for(let s=1;s<=11;s++){
  const d=lesson.make(s),answers=ref(i,s);seen.add(JSON.stringify([d.caption,d.rows,d.n,d.v,d.a,d.b]));assert(w.MathExamTopicEdition.figure(d).includes('role="img"'));
  d.questions.forEach((q,k)=>{assert.equal(q.answer,answers[k],id+'/'+s+'/'+k);assert(q.mistakes.length);for(const [bad,msg] of q.mistakes){assert.notEqual(bad,answers[k],id+'/'+s+'/'+k);assert(msg.length>20);}});
 }
 assert.equal(seen.size,11,id);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 click(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(lesson.printedGuide));
 click(doc,'practice');reply(doc,8888888);let stash=w.localStorage.getItem(key);dom.window.close();({dom,doc,w,key,lesson}=open(r,stash));
 assert.equal(doc.querySelector('#answer').value,'8888888');reply(doc,ref(i,2)[2]);click(doc,'next');
 for(let j=0;j<3;j++){
  if(!j){const [bad,msg]=lesson.make(4).questions[0].mistakes[0];reply(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)click(doc,'hint');reply(doc,ref(i,j+4)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);
 assert.equal(w.localStorage.getItem(other),'earlier pupil draft');dom.window.close();
}
console.log('Part 2: verified 24 printed sections, 41 exercises, 1353 checked answers, persisted results and independent volume keys.');
