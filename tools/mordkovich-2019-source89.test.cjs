'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const context = vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),context);
const book = context.window.WorkshopCurriculum.books.find(b=>b.id==='source-89');
assert.equal(book.source.sha256,'d4a9d47bd2a22b069ff4368bb96ce1033d642abbd488da7c8df1c11f765a00ae');
assert.equal(book.source.pages,234);
assert(book.note.includes('978-5-346-04407-9'));
assert.equal(book.mapping.length,66);
const printedPages=[5,11,12,17,21,31,36,42,48,60,74,77,84,89,92,97,103,107,111,113,120,123,124,129,131,134,137,140,144,147,149,151,154,162,165,167,171,174,179,186,190,195,199,203,209,215,217,224];
const paragraphs=book.mapping.filter(r=>/^§ /.test(r.sectionLabel));
assert.deepEqual(Array.from(paragraphs,r=>r.page),printedPages);
for(const [i,row] of paragraphs.entries()) {
  assert.equal(row.sectionLabel,'§ '+(i+1));
  assert.equal(row.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000069.pdf#page='+(row.page+1));
  assert.equal(row.coverage,i<6?'module':'source');
  if(i<6)assert.equal(row.externalPath,row.boardPath);
  else assert(row.bookOnly&&!row.externalPath&&!row.boardPath);
}
const dir='trainers/mordkovich-2019/';
const ids=['1-ex1','1-ex2-a','1-ex2-b','1-ex2-c','2-q2','2-q3','2-q4','3-ex1','3-ex2','4-ex1','4-ex2','5-ex1','5-ex2','5-ex3','6-ex1','6-ex2','6-ex3'];
const printed=[6,9,9,9,12,12,12,14,15,19,20,22,22,23,32,33,36];
const html=read(dir+'index.html');
const files=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1])
  .filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,save) {
  const dom=new JSDOM(html,{url:'https://school.example'+entry.path,runScripts:'outside-only'});
  const w=dom.window, key='math:mordkovich-2019:v1:89-'+entry.path.split('89-').pop();
  w.TextEncoder=TextEncoder;w.Math.random=()=>0;
  if(save)w.localStorage.setItem(key,save);
  files.forEach(s=>w.eval(s));
  return {dom,w,doc:w.document,key};
}
function expected(i,s) {
  const u=s+2,v=s+4,a=s+2,b=i===1?s+4:-(s+1);
  const h=s+2,w=s+6,k=s+1, gap=s+3, initial=gap+2*k;
  switch(ids[i]) {
    case '1-ex1':return [-1/3,-3*(u+v),(-3*(u+v))/(5*s+5)];
    case '1-ex2-a':case '1-ex2-b':return [a-b,a*a-b*b,(a*a+2*a*b+b*b)/(a*a-b*b)];
    case '1-ex2-c':return [-a,a,2];
    case '2-q2':return [2*s+8,(s+2)*(s+4),2*s+8-(s+2)*(s+4)];
    case '2-q3':return [h*w,h*k,h*(w+k)];
    case '2-q4':return [h*w,h*k,h*(w-k)];
    case '3-ex1':return [2*k,initial,3*initial];
    case '3-ex2':return [6,2*s+4,3*s+6];
    case '4-ex1':{const x=(s+1)/3+(s+3)/6;return [6,12*x,4*x];}
    case '5-ex1':{const high=3*s+6,low=2*s+4;const total=high*(s+1)/(high-low);return [high*(s+1),total,low*total];}
    case '6-ex1':return [-s-2,-3*s-6,s+2];
    case '6-ex2':{
      const b=(s+1)/(s+6),c=(s+3+s%3)/(s+6),a=(s+8)/(s+6);
      return [Math.abs(c-b),Math.abs(a-c),2*c<a+b?b:a];
    }
    case '4-ex2':{
      const l=(s+3)/5, r=(s+2)/2;
      return [10*l,10*(l-r),((s+1)/5+(s+3)/2)/(l-r)];
    }
    case '5-ex2':{
      const t=2+s%3, lead=t*(s+2)-(s+3), pedestrian=(t*(s+2)-lead)/(t+1-t);
      return [t+1,pedestrian,pedestrian*(t+1)];
    }
    case '5-ex3':{
      const t=s+2+30/60, x=s+5, flow=1+s%3;
      return [t,t*(x+flow)+1.5*(x-flow)-x*(t+1.5),x];
    }
    case '6-ex3':{
      const n=2*s+1, good=s+1+s-Math.floor((2*s-1)/3)-1;
      return [n,good,good/n];
    }
    default:throw new Error('Unexpected lesson');
  }
}
assert.equal(book.exercises.length,ids.length);
for(const [i,entry] of book.exercises.entries()){
  const id='89-'+ids[i],{dom,w,doc,key}=open(entry);
  assert.equal(entry.path,'/'+dir+'index.html#lesson/'+id);
  assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,printed[i]);
  assert.equal(doc.querySelector('#lesson').value,id);
  assert.equal(doc.querySelector('#back').hash,'#book/source-89');
  assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000069.pdf#page='+(printed[i]+1));
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
  const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.title,entry.title);
  assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'89-'+ids[i+1]);
  const variants=new Set();
  for(let s=1;s<=11;s++){
    const data=lesson.make(s), answers=expected(i,s);variants.add(JSON.stringify(data.rows));
    data.questions.forEach((q,j)=>{
      assert(Math.abs(q.answer-answers[j])<1e-8,id+' '+s+' '+j);
      for(const [bad,message] of q.mistakes){assert(Math.abs(bad-q.answer)>1e-7);assert(message.length>25);}
    });
    assert(w.MathExamTopicEdition.figure(data).includes('role="img"'));
  }
  assert.equal(variants.size,11);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
  doc.querySelector('[data-action="practice"]').click();
  const input=doc.querySelector('#answer');input.value='99875';input.dispatchEvent(new w.Event('input',{bubbles:true}));
  const saved=w.localStorage.getItem(key);
  const reopened=open(entry,saved);
  assert.equal(reopened.doc.querySelector('#answer').value,'99875');
  assert.deepEqual(JSON.parse(reopened.w.localStorage.getItem(key)).results,[]);
  const current=reopened.doc;
  const action=name=>current.querySelector('[data-action="'+name+'"]').click();
  function send(value){
    const a=current.querySelector('#answer');
    a.value=Number.isInteger(value)?String(value):value.toFixed(9);
    a.dispatchEvent(new reopened.w.Event('input',{bubbles:true}));
    current.querySelector('#work form').dispatchEvent(new reopened.w.Event('submit',{bubbles:true,cancelable:true}));
  }
  send(expected(i,2)[2]);action('next');
  for(let q=0;q<3;q++){
    if(q===0){
      const [wrong,message]=lesson.make(4).questions[q].mistakes[0];
      send(wrong);
      assert(current.querySelector('#feedback').textContent.includes(message));
    }
    if(q===2)action('hint');
    send(expected(i,q+4)[q]);action('next');
  }
  assert.deepEqual(JSON.parse(reopened.w.localStorage.getItem(key)).results,['fixed','first','help']);
  action('again');
  assert.notEqual(JSON.parse(reopened.w.localStorage.getItem(key)).variant,0);
  reopened.dom.window.close();dom.window.close();
}
console.log('Source 89: 48 printed paragraphs, 17 student routes, 561 independently checked questions and 17 personal draft round trips.');
