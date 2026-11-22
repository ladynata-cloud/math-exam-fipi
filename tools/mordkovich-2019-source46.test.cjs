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
const book=context.window.WorkshopCurriculum.books.find(b=>b.id==='source-46');
assert.equal(book.source.sha256,'dca95e4319049829516ea0e21243195ff028ecd0d7e1e569dfe8675b39018489');
assert.equal(book.source.pages,290);assert(book.note.includes('978-5-346-04286-0'));
const printedPages=[4, 21, 31, 37, 41, 49, 53, 60, 76, 81, 88, 101, 105, 111, 123, 132, 140, 157, 163, 175, 183, 193, 198, 211, 226, 237, 245, 261, 274];
assert.equal(book.mapping.length,37);
assert.deepEqual(Array.from(book.mapping.filter(r=>r.sectionLabel.startsWith('§')),r=>r.page),printedPages);
for(const row of book.mapping){
  assert(row.sourcePath.endsWith('00000034.pdf#page='+(row.page+1)));
  if(row.sectionLabel==='§ 1')assert.equal(row.boardPath,row.externalPath);
  else assert(row.bookOnly&&!row.boardPath&&!row.externalPath);
}
const ids=["1-rule1", "1-rule2", "1-rule3", "1-rule2-star", "1-rule3-star", "1-ex1", "1-ex2", "1-ex3-a", "1-ex3-b", "1-ex4"],printed=[5, 5, 5, 6, 6, 7, 8, 9, 9, 9];
const dir='trainers/mordkovich-2019/';
const html=read(dir+'index.html');
const files=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1])
  .filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,save) {
  const dom=new JSDOM(html,{url:'https://school.example'+entry.path,runScripts:'outside-only'});
  const w=dom.window, key='math:mordkovich-2019:v1:46-'+entry.path.split('46-').pop();
  w.TextEncoder=TextEncoder;w.Math.random=()=>0;
  if(save)w.localStorage.setItem(key,save);
  files.forEach(s=>w.eval(s));
  return {dom,w,doc:w.document,key};
}
function expected(i,s){
 switch(ids[i]){
   case '1-rule1':return [s,-(s*s),-s];
   case '1-rule2':case '1-rule2-star':return [s+2,s+3,s+4];
   case '1-rule3':case '1-rule3-star':return [-s-2,s+3,s+2];
   case '1-ex1':return [4,-2,-s-2];
   case '1-ex2':return [-(s+1)/2,s+2,2];
   case '1-ex3-a':return [s+2,0,2*s+3];
   case '1-ex3-b':return [-s-2,0,0];
   case '1-ex4':return [s+1,-s-2,2];
   default:throw Error('Unknown printed exercise');
 }
}
assert.equal(book.exercises.length,ids.length);
function checkExercise(i,entry) {
  const id='46-'+ids[i],{dom,w,doc,key}=open(entry);
  assert.equal(entry.path,'/'+dir+'index.html#lesson/'+id);
  assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,printed[i]);
  assert.equal(doc.querySelector('#lesson').value,id);
  assert.equal(doc.querySelector('#back').hash,'#book/source-46');
  assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000034.pdf#page='+(printed[i]+1));
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
  const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.title,entry.title);
  assert.equal(lesson.printedReference,entry.printed);
  assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'46-'+ids[i+1]);
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
  console.log('Source 46: 29 printed paragraphs, 10 student routes, 330 independently checked questions and 10 personal draft round trips.');
}
checkExercises().catch(error=>{console.error(error);process.exitCode=1;});
