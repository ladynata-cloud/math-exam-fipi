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
const book=context.window.WorkshopCurriculum.books.find(b=>b.id==='source-94');
assert.equal(book.source.sha256,'4c5e6525c4ba0054171e486dace60bbd7ec51cf88fd2edd8044288cb62142bd9');
assert.equal(book.source.pages,224);assert(book.note.includes('978-5-85939-921-5'));
const printedPages=[8,15,21,28,36,39,43,48,54,57,63,67,72,77,85,89,94,98,103,113,121,124,128,133,139,143,148,154,159,164];
assert.equal(book.mapping.length,99);
assert.deepEqual(Array.from(book.mapping.filter(r=>r.sectionLabel.startsWith('§')),r=>r.page),printedPages);
for(const row of book.mapping){
  assert(row.sourcePath.endsWith('00000075.pdf#page='+row.page));
  if(row.sectionLabel==='§ 1.1')assert.equal(row.boardPath,row.externalPath);
  else assert(row.bookOnly&&!row.boardPath&&!row.externalPath);
}
const ids=['abcdefgh','abcdef','abcdefgh','abcdefgh'].flatMap((letters,i)=>Array.from(letters,letter=>(i+1)+'-'+letter)).concat(['5','6','7','8']);
const printed=ids.map(id=>/^4-[efgh]$|^[5-8]$/.test(id)?11:10);
const dir='trainers/rubin-chulkov7-2015/';
const html=read(dir+'index.html');
const files=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1])
  .filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,save) {
  const dom=new JSDOM(html,{url:'https://school.example'+entry.path,runScripts:'outside-only'});
  const w=dom.window, key='math:rubin-chulkov7-2015:v1:94-'+entry.path.split('94-').pop();
  w.TextEncoder=TextEncoder;w.Math.random=()=>0;
  if(save)w.localStorage.setItem(key,save);
  files.forEach(s=>w.eval(s));
  return {dom,w,doc:w.document,key};
}
function expected(i,s){
  const n=s+2;
  switch (ids[i]) {
    case '1-a': return [-n/10,1/10,-n];
    case '1-b': return [(n+1)/n,(2*n+1)/(n+1),(n+3)/n-(n+1)/(2*n+1)];
    case '1-c': return [-1/n,1/(n+1),0];
    case '1-d': return [4*(s+1),0,0];
    case '1-e': return [0,0,0];
    case '1-f': return [-n,-100*n,101*s+200.5];
    case '1-g': return [(n+4)/n,0,0];
    case '1-h': return [n,n,1];
    case '2-a':case '2-b':case '2-c':case '2-d':case '2-e':case '2-f': {
      const sub=i-8,a=3*s+2,b=s+1;
      const middle=[b,2*s+1,4*s+3,2*s+1,b/2,(4*s+3)/(a*b)];
      const end=[4*s+3,4*s+2,(4*s+3)/4,a*a-b*b,3*a-b/2,a/b-b/a];
      return [(s+sub)%3+1,middle[sub],end[sub]];
    }
    case '5':return [3*s+2,-.3*s-1,-6*s-4];
    case '6':return [1-3*s,.3*s+7,3*s+16];
    case '7':return [7*s+3,0,s-.3];
    case '8':return [0,8*s+.7,-7.05*s-1.4];
    default: {
      const [exercise,letter]=ids[i].split('-'),part='abcdefgh'.indexOf(letter);
      if(exercise==='3'){
        const value=[s+2,s+.5,3*s+4,-s-.25,-s-.1,-s-1.12,.002*s+.001,-.002*s-.001][part];
        return [value,2*value,2*value-3];
      }
      assert.equal(exercise,'4');
      const pairs=[[s+1,s+1],[s+3,1],[-4*s-1,-2*s],[(2*s+1)/4,-s-1.5],[-.04*(s+3),-s-.5],[-s-4,-s-.5],[-.07*(s+1),-.02*(s+1)],[4-.07*(s+1),-.01*(s+1)]];
      const [p,q]=pairs[part],n=2*p-7*q,d=p+4;
      return [n,d,n/d];
    }
  }
}
assert.equal(book.exercises.length,ids.length);
function checkExercise(i,entry) {
  const id='94-'+ids[i],{dom,w,doc,key}=open(entry);
  assert.equal(entry.path,'/'+dir+'index.html#lesson/'+id);
  assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,printed[i]);
  assert.equal(doc.querySelector('#lesson').value,id);
  assert.equal(doc.querySelector('#back').hash,'#book/source-94');
  assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000075.pdf#page='+printed[i]);
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
  const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.title,entry.title);
  assert.equal(lesson.printedReference,entry.printed);
  assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'94-'+ids[i+1]);
  const variants=new Set();
  for(let s=1;s<=11;s++){
    const data=lesson.make(s), answers=expected(i,s);variants.add(JSON.stringify(data.rows));
    data.questions.forEach((q,j)=>{
      assert(Math.abs(q.answer-answers[j])<1e-8,id+' '+s+' '+j);
      for(const [bad,message] of q.mistakes){assert(Math.abs(bad-q.answer)>1e-7);assert(message.length>17);}
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
  console.log('Source 94: 30 paragraphs, 30 revision topics, 30 answer sections, 34 student routes, 1122 independently checked answers and 34 saved drafts.');
}
checkExercises().catch(error=>{console.error(error);process.exitCode=1;});
