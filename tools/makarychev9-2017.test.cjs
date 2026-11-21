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
  switch (point) {
    case 4: {
      const polynomial=x=>a*(x-b)*(x-c);
      return [-b,(polynomial(1)-polynomial(-1))/2,polynomial(0)];
    }
    case 5: return [b/(a*a),b,4*b];
    case 6: {
      const rule=data.caption.split('Штриховая линия g(x) = ')[1];
      const inside=rule.match(/\(x ([+−]) (\d+)\)²/), outside=rule.match(/x² ([+−]) (\d+)/);
      const h=inside ? (inside[1]==='+'?-1:1)*Number(inside[2]) : 0;
      const k=outside ? (outside[1]==='+'?1:-1)*Number(outside[2]) : 0;
      return [h,k,k];
    }
    case 7: {
      const fn=x=>a*x*x+b*x+c, high=a<0;
      const xs=Array.from({length:31},(_,i)=>i-15);
      const extreme=xs.reduce((best,x)=>(high ? fn(x)>fn(best) : fn(x)<fn(best))?x:best);
      const mate=xs.find(x=>x!==r[3] && fn(x)===fn(r[3]));
      return [extreme,fn(extreme),mate];
    }
    case 8: {
      const answers=Array.from({length:17},(_,i)=>i-8).filter(x=>x**a===c);
      return [(-b)**a,answers.length,b**a-(-b)**a];
    }
    case 9: {
      const integers=Array.from({length:17},(_,i)=>i-8);
      const positive=integers.filter(x=>x**a===b);
      return [Math.max(...positive),positive.length,integers.find(x=>x**t[0]===t[1])];
    }
    case 10: return [c,a,(a*r[3]+b)/(r[3]-c)];
    case 11: {
      const root=Array.from({length:20},(_,i)=>i+1).find(x=>x**c===a);
      return [root,root**b,1/(root**b)];
    }
    case 12: {
      const roots=Array.from({length:51},(_,i)=>i-25).filter(x=>x**4-a*x*x+b===0);
      return [Math.min(...roots.map(x=>x*x)),roots.length,Math.min(...roots)];
    }
    case 13: {
      const x=Array.from({length:41},(_,i)=>i-20).find(x=>(x*x-a*x+b)/(x-c)===0);
      return [c,x,x-c];
    }
    case 14: {
      const op=data.caption.match(/\(x−v\) ([≤<>≥]) 0/)[1];
      const valid=x=>{const y=a*(x-b)*(x-c);return {'<':y<0,'≤':y<=0,'>':y>0,'≥':y>=0}[op];};
      const solutions=Array.from({length:41},(_,i)=>i-20).filter(valid);
      return [Math.min(b,c),solutions.length,Math.max(...solutions)];
    }
    case 15: {
      const [leading,u,v,w]=r,fn=x=>leading*(x-u)*(x-u)*(x-v)*(x-w);
      const switches=[u,v,w].filter(x=>fn(x-0.2)*fn(x+0.2)<0).length;
      const valid=Array.from({length:w-u+3},(_,i)=>u-1+i).filter(x=>fn(x)<0);
      return [switches,Math.sign(fn((v+w)/2)),valid.length];
    }
    case 16: {
      const t=r[3],fn=x=>x**3+a*x*x+b*x+c;
      const rest=Array.from({length:41},(_,i)=>i-20).filter(x=>x!==t && fn(x)===0);
      return [-rest.reduce((sum,x)=>sum+x,0),rest.reduce((product,x)=>product*x,1),Math.max(...rest)];
    }
    default: throw Error('uncovered point '+point);
  }
}
function click(w,action) {w.document.querySelector('[data-action="'+action+'"]').click();}
function submit(w,value) {
  const field=w.document.querySelector('#answer'); field.value=String(value);
  field.dispatchEvent(new w.Event('input',{bubbles:true}));
  w.document.querySelector('#work form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
}
for (const [i,page] of [5,14,22,27,31,38,44,49,54,60,65,75,81,87,92,98].entries()) {
  const point=i+1,id='50-'+point,key='math:makarychev9-2017:v1:'+id;
  let dom=open(id),w=dom.window; const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.page,page); assert.equal(w.document.querySelector('#lesson').value,id);
  assert.equal(w.document.querySelector('#work svg').getAttribute('role'),'img');
  if(point===6) assert.equal(w.document.querySelectorAll('#work svg polyline').length,2);
  if(point===10) {
    const model=lesson.make(4), asymptote=model.asymptotes[0];
    assert.equal(w.document.querySelectorAll('#work svg polyline').length,2);
    assert(model.curves[0].every(p=>p[0]<asymptote) && model.curves[1].every(p=>p[0]>asymptote));
  }
  assert.equal(new URL(w.document.querySelector('#board').href).searchParams.get('trainer'),'/trainers/makarychev9-2017/index.html#lesson/'+id);
  for(let s=1;s<=11;s++) {
    const d=lesson.make(s), correct=answers(point,d);
    const afterRepeat = lesson.make(1+(s-1+7)%11);
    assert.notEqual(JSON.stringify(d.rows),JSON.stringify(afterRepeat.rows),id+' repeated source data');
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
console.log('Source 50: 528 independent numeric checks and sixteen pupil journeys with saved and assisted work.');
