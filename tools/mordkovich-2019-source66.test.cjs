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
const book=context.window.WorkshopCurriculum.books.find(b=>b.id==='source-66');
assert.equal(book.source.sha256,'d9e7e0a14d4efe8d64cce2e5ca6125343314aa617a4dbe2fccc236e1fd6b64ae');
assert.equal(book.source.pages,290);assert(book.note.includes('978-5-346-04410-9'));
const printedPages=[4, 10, 16, 18, 20, 23, 26, 32, 39, 47, 50, 54, 60, 68, 72, 77, 79, 89, 94, 106, 119, 131, 136, 140, 142, 146, 150, 155, 164, 169, 172, 180, 185, 189, 195, 200, 207, 209, 213, 221, 228, 231, 236, 246, 252, 257, 267, 269, 271, 275, 277];
assert.equal(book.mapping.length,61);
assert.deepEqual(Array.from(book.mapping.filter(r=>r.sectionLabel.startsWith('§')),r=>r.page),printedPages);
for(const row of book.mapping){
  assert(row.sourcePath.endsWith('00000050.pdf#page='+(row.page+1)));
  if(row.sectionLabel==='§ 1')assert.equal(row.boardPath,row.externalPath);
  else assert(row.bookOnly&&!row.boardPath&&!row.externalPath);
}
const ids=["1-ex1-a", "1-ex1-b", "1-ex1-c", "1-ex2", "1-ex3", "1-ex4", "1-ex5-a", "1-ex5-b", "1-ex5-c", "1-q1", "1-q2-one", "1-q2-two", "1-q3", "1-q4", "1-q5", "1-q6", "1-q7", "1-q8", "1-q9"],printed=[5, 5, 5, 5, 7, 8, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
const dir='trainers/mordkovich-2019/';
const html=read(dir+'index.html');
const files=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1])
  .filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,save) {
  const dom=new JSDOM(html,{url:'https://school.example'+entry.path,runScripts:'outside-only'});
  const w=dom.window, key='math:mordkovich-2019:v1:66-'+entry.path.split('66-').pop();
  w.TextEncoder=TextEncoder;w.Math.random=()=>0;
  if(save)w.localStorage.setItem(key,save);
  files.forEach(s=>w.eval(s));
  return {dom,w,doc:w.document,key};
}
function expected(i,s){
  const n=s+2,k=s+3;
  switch(ids[i]){
    case '1-ex1-a':return [2,4*s+4,(n*n+3*n*s+s*s)/(4*s+4)];
    case '1-ex1-b':return [n,n*n,1];
    case '1-ex1-c':return [0,0,1];
    case '1-ex2':return [2*k,k*k-4,(2*k*k+3*k+1)/(k*k-4)];
    case '1-ex3':return [3,6*n,-3];
    case '1-ex4':return [3*s+3,-3*s-3,-2/7];
    case '1-ex5-a':return [12,3*n,2*(n+1)];
    case '1-ex5-b':return [12,n+1,2];
    case '1-ex5-c':return [2*n+1,n+1,(n+1)*(2*n+1)];
    case '1-q1':return [2*k+1,k-2,2];
    case '1-q2-one':case '1-q4':return [n,1,n+2];
    case '1-q2-two':case '1-q5':return [2,2*n+2,n+1];
    case '1-q3':return [2,3,2*k+3];
    case '1-q6':return [-n,2,n];
    case '1-q7':return [(n+1)*n,(n+3)*n,1];
    case '1-q8':return [s+2,-s-2,-1];
    case '1-q9':return [-n/k,n/k,-1];
    default:throw Error('Unknown source-66 card');
  }
}
assert.equal(book.exercises.length,ids.length);
function checkExercise(i,entry) {
  const id='66-'+ids[i],{dom,w,doc,key}=open(entry);
  assert.equal(entry.path,'/'+dir+'index.html#lesson/'+id);
  assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,printed[i]);
  assert.equal(doc.querySelector('#lesson').value,id);
  assert.equal(doc.querySelector('#back').hash,'#book/source-66');
  assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000050.pdf#page='+(printed[i]+1));
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
  const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.title,entry.title);
  assert.equal(lesson.printedReference,entry.printed);
  assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'66-'+ids[i+1]);
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
async function checkExercises() {
  for(const [i,entry] of book.exercises.entries()){
    checkExercise(i,entry);
    // Allow jsdom to release closed windows before opening the next lesson.
    await new Promise(resolve=>setImmediate(resolve));
  }
  console.log('Source 66: 51 printed paragraphs, 19 student routes, 627 independently checked questions and 19 personal draft round trips.');
}
checkExercises().catch(error=>{console.error(error);process.exitCode=1;});
