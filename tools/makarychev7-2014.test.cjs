'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const folder = path.join(root,'trainers/makarychev7-2014');
const read = f => fs.readFileSync(f,'utf8');
const html = read(path.join(folder,'index.html'));
function open(point, saved) {
  const id='95-'+point, key='math:makarychev7-2014:v1:'+id;
  const dom=new JSDOM(html,{url:'https://math.test/trainers/makarychev7-2014/index.html#lesson/'+id,runScripts:'outside-only'});
  const {window:w}=dom;
  w.Math.random=()=>0;
  if(saved) w.localStorage.setItem(key,saved);
  for(const asset of ['../tyurin-statistics/content.js','statistics.js','../tyurin-statistics/app.js']) w.eval(read(path.join(folder,asset)));
  return {dom,w,doc:w.document,id,key};
}
const book={id:'source-95',source:{source_url:'https://my-uchebnik.ru/book/algebra/1/algebra-00000074.htm'}};
const mapDom=new JSDOM('',{runScripts:'outside-only'});
mapDom.window.WorkshopCurriculum={books:[book]};
mapDom.window.eval(read(path.join(root,'school/makarychev7-2014-book.js')));
mapDom.window.eval(read(path.join(root,'school/makarychev7/data.js')));
const byId=new Map(mapDom.window.MakarychevCourse.lessons.map(l=>[l.id,l]));
const pages=[5,8,12,17,20,25,28,32,36,42,46,55,59,62,69,75,84,93,99,103,108,110,112,119,127,130,135,140,145,150,152,163,169,172,177,180,183,186,190,199,204,207,211,215,219,223];
assert.deepEqual(Array.from(book.mapping,row=>row.page),pages);
for(const [i,row] of book.mapping.entries()){
  assert.equal(row.section,i+1);
  if(row.boardPath){assert.ok([9,10].includes(row.section));assert.equal(row.boardPath,row.externalPath);continue;}
  const m=/^\/school\/makarychev7\/index.html#lesson\/(p\d\d)\/(\d+)$/.exec(row.externalPath);
  assert.ok(m&&byId.get(m[1])?.tasks[Number(m[2])]?.steps.length);
}
assert.equal(book.mapping.filter(r=>r.boardPath).length,2);
mapDom.window.close();
for(const point of [9,10]){
  const view=open(point),{w,doc,id,key}=view, lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(doc.querySelector('#source').href.split('#')[1],point===9?'page=36':'page=42');
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),'/trainers/makarychev7-2014/index.html#lesson/'+id);
  const initial=JSON.parse(w.localStorage.getItem(key));assert.deepEqual(initial.results,[]);
  const variants=new Set();
  for(let n=1;n<=11;n++){
    const data=lesson.make(n);
    const values=Array.from(data.rows,r=>r[1]);
    variants.add(values.join(','));
    const sorted=[...values].sort((a,b)=>a-b);
    const sum=values.reduce((total,v)=>total+v,0);
    const count=v=>values.filter(x=>x===v).length;
    const mode=sorted.find(v=>count(v)===3);
    const median=(sorted[2]+sorted[3])/2;
    const expected=point===9?[sum/values.length,sorted.at(-1)-sorted[0],mode]:[
      values.slice(0,5).sort((a,b)=>a-b)[2],median,median
    ];
    assert.deepEqual(Array.from(data.questions,q=>q.answer),expected);
    for(const q of data.questions){for(const [wrong,explanation] of q.mistakes){assert.notEqual(wrong,q.answer);assert.ok(explanation.length>20);}}
  }
  assert.equal(variants.size,11);
  const button=key=>doc.querySelector('[data-action="'+key+'"]').click();
  const answer=value=>{const field=doc.querySelector('#answer');field.value=String(value);field.dispatchEvent(new w.Event('input',{bubbles:true}));doc.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  const get=()=>JSON.parse(w.localStorage.getItem(key));
  function current(){
    const s=get(),k=s.stage==='check'?s.results.length:0;
    const data=lesson.make(1+(s.variant+(s.stage==='check'?3+k:1))%11);
    return data.questions[(s.variant+(s.stage==='check'?k:2))%3];
  }
  button('practice');answer(current().answer);button('next');
  answer(current().mistakes[0][0]);assert.ok(doc.querySelector('#feedback').textContent.includes(current().mistakes[0][1]));
  answer(current().answer);button('next');assert.deepEqual(get().results,['fixed']);
  button('hint');answer(current().answer);button('next');assert.deepEqual(get().results,['fixed','help']);
  answer(current().answer);button('next');assert.deepEqual(get().results,['fixed','help','first']);
  const original=w.localStorage.getItem(key);
  const resumed=open(point,original);assert.equal(resumed.doc.querySelector('#lesson').value,id);assert.equal(JSON.parse(resumed.w.localStorage.getItem(key)).stage,'done');
  resumed.doc.querySelector('[data-action="again"]').click();assert.notEqual(JSON.parse(resumed.w.localStorage.getItem(key)).variant,get().variant);
  resumed.dom.window.close();view.dom.window.close();
}
console.log('46 printed points, 44 specific course tasks, two interactive routes, 22 independent statistical samples, explicit help, correction, fresh attempts, restoration.');
