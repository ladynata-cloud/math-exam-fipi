'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const dir = path.join(__dirname,'../trainers/makarychev9-2017');
const html = fs.readFileSync(path.join(dir,'index.html'),'utf8');
function open(id, saved) {
  const dom=new JSDOM(html,{url:'https://math.test/trainers/makarychev9-2017/index.html#lesson/'+id,runScripts:'outside-only'});
  const w=dom.window; w.TextEncoder=TextEncoder; w.Math.random=()=>0;
  if(saved) w.localStorage.setItem('math:makarychev9-2017:v1:'+id,saved);
  for (const [,script] of html.matchAll(/<script defer src="([^"]+)"/g)) {
    if(!script.startsWith('/')) w.eval(fs.readFileSync(path.resolve(dir,script),'utf8'));
  }
  return dom;
}
function answers(point,data) {
  const [r,t]=data.rows;
  if (point===1) {
    const prompt=data.questions[2].prompt, target=Number(prompt.match(/(-?\d+)\?$/)[1]);
    return [new Set(data.rows.map(p=>p[1])).size,data.rows.find(p=>p[0]===Number(data.questions[1].prompt.match(/(-?\d+)\?$/)[1]))[1],data.rows.filter(p=>p[1]===target).length];
  }
  if (point===2) {
    const peak=data.rows.reduce((best,p)=>p[1]>best[1]?p:best);
    return [peak[0],data.rows.filter(p=>p[1]===0).length,t[0]-r[0]];
  }
  const [a,b,c]=r;
  if (point===3) {
    const roots=Array.from({length:101},(_,i)=>i-50).filter(x=>a*x*x+b*x+c===0);
    return [roots[0],roots[1],roots[0]*roots[1]];
  }
  const polynomial=x=>a*(x-b)*(x-c);
  return [-b,(polynomial(1)-polynomial(-1))/2,polynomial(0)];
}
function click(w,action) {w.document.querySelector('[data-action="'+action+'"]').click();}
function submit(w,value) {
  const field=w.document.querySelector('#answer'); field.value=String(value);
  field.dispatchEvent(new w.Event('input',{bubbles:true}));
  w.document.querySelector('#work form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
}
for (const [i,page] of [5,14,22,27].entries()) {
  const point=i+1,id='50-'+point,key='math:makarychev9-2017:v1:'+id;
  let dom=open(id),w=dom.window; const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.page,page); assert.equal(w.document.querySelector('#lesson').value,id);
  assert.equal(w.document.querySelector('#work svg').getAttribute('role'),'img');
  assert.equal(new URL(w.document.querySelector('#board').href).searchParams.get('trainer'),'/trainers/makarychev9-2017/index.html#lesson/'+id);
  for(let s=1;s<=11;s++) {
    const d=lesson.make(s), correct=answers(point,d);
    for(const [j,q] of d.questions.entries()) {
      assert.equal(q.answer,correct[j],id+' variant '+s+' question '+j);
      assert(q.calculation && q.error);
      for(const [wrong,msg] of q.mistakes) {assert.notEqual(wrong,q.answer);assert(msg.length>20);}
    }
  }
  assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
  click(w,'practice');submit(w,'99999');
  let receipt=w.localStorage.getItem(key);dom.window.close();dom=open(id,receipt);w=dom.window;
  assert.equal(w.document.querySelector('#answer').value,'99999');
  submit(w,answers(point,lesson.make(2))[2]);click(w,'next');
  for(let j=0;j<3;j++) {
    const data=lesson.make(4+j),q=data.questions[j];
    if(j===0 && q.mistakes.length) {
      submit(w,q.mistakes[0][0]);assert(w.document.querySelector('#feedback').textContent.includes(q.mistakes[0][1]));
    } else if(j===0) submit(w,'99998');
    if(j===2)click(w,'hint');
    submit(w,answers(point,data)[j]);click(w,'next');
  }
  assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);
  click(w,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);
  dom.window.close();
}
console.log('Source 50: 132 independent numeric checks and four pupil journeys with saved and assisted work.');
