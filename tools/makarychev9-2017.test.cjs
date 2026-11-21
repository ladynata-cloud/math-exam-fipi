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
    case 17: {
      const solve=x=>Array.from({length:101},(_,i)=>i-50).filter(y=>(x-a)**2+(y-b)**2===c*c);
      const ys=solve(r[3]);
      return [Math.max(...ys),Math.min(...ys),solve(a+c).length];
    }
    case 18: {
      const xs=Array.from({length:41},(_,i)=>i-20).filter(x=>x*x===a*x+b);
      return [xs[0],xs[1]**2,xs[1]-xs[0]];
    }
    case 19: {
      const pairs=Array.from({length:41},(_,i)=>i-20).map(x=>[x,2*x+a]).filter(([x,y])=>x*x+b*x+y===c);
      return [-pairs[0][0]-pairs[1][0],pairs[0][0],pairs[1][1]];
    }
    case 20: {
      const inside=[];
      for(let u=1;u<=c;u++)for(let v=u;u*v<=c;v++)if(u*v===c && 2*(u+v+4*b)===a)inside.push([u,v]);
      assert.equal(inside.length,1);
      const [u,v]=inside[0];
      return [u+v,u+2*b,(u+2*b)*(v+2*b)-c];
    }
    case 21: {
      const bound=(c-a)**2+b,strict=data.caption.includes('y > ');
      const ys=Array.from({length:101},(_,i)=>i-50).filter(y=>(strict?y>bound:y>=bound) && y<=r[3]);
      return [bound,ys[0],ys.length];
    }
    case 22: {
      const ys=Array.from({length:101},(_,i)=>i-50).filter(y=>(r[4]-a)**2+(y-b)**2<c*c && y>=r[3]);
      return [ys[0],ys[ys.length-1],ys.length];
    }
    case 23: {
      const pairs=[];
      const upto=Math.ceil(Math.sqrt(b));
      for(let x=-upto;x<=upto;x++)for(let y=-upto;y<=upto;y++)if(x*x+y*y===b && x*x-y*y-a*(x-y)===0)pairs.push([x,y]);
      const equal=pairs.find(([x,y])=>x===y && x>0);
      const split=pairs.find(([x,y])=>x+y===a);
      return [equal[0],split[0]*split[1],pairs.length];
    }
    case 24: {
      const values=Array.from({length:21},(_,i)=>i*i+a);
      return [values[b],values.indexOf(c),values[b+1]-values[b]];
    }
    case 25: {
      const terms={};terms[a]=b;terms[a+1]=c;
      for(let i=a-1;i>0;i--)terms[i]=2*terms[i+1]-terms[i+2];
      for(let i=a+2;i<=r[3];i++)terms[i]=2*terms[i-1]-terms[i-2];
      return [c-b,terms[1],terms[r[3]]];
    }
    case 26: {
      const seats=Array.from({length:c},(_,i)=>a+i*b);
      return [seats.at(-1),seats[0]+seats.at(-1),seats.reduce((sum,n)=>sum+n,0)];
    }
    case 27: {
      const terms=[a,b];
      while(terms.length<=c)terms.push(terms.at(-1)*b/a);
      return [b/a,terms[c-1],terms[c]-terms[c-1]];
    }
    case 28: {
      const terms=[a];
      while(terms.length<=c)terms.push(terms.at(-1)*b);
      return [terms[c-1],terms.slice(0,c).reduce((sum,n)=>sum+n),terms[c]];
    }
    case 29: {
      let all=0,newBorder=0;
      for(let x=0;x<=b;x++)for(let y=0;y<=b;y++){all+=a;if(x===b||y===b)newBorder+=a;}
      return [a,newBorder,all];
    }
    case 30: {
      const pairs=Array.from({length:a},(_,i)=>Array.from({length:b},(_,j)=>[i+1,j+1])).flat();
      return [pairs.length,pairs.filter(([i,j])=>j!==1 || i>c).length,pairs.filter(([,j])=>j===1).length];
    }
    case 31: {
      const orders=[];
      function list(xs,left){if(!left.length){orders.push(xs);return;}for(const y of left)list([...xs,y],left.filter(x=>x!==y));}
      list([],Array.from({length:a},(_,i)=>i+1));
      return [orders.length,orders.filter(xs=>xs[0]===b).length,orders.filter(xs=>Math.abs(xs.indexOf(1)-xs.indexOf(2))===1).length];
    }
    case 32:
    case 33: {
      const triples=[];
      for(let i=1;i<=a;i++)for(let j=1;j<=a;j++)for(let k=1;k<=a;k++)if(new Set([i,j,k]).size===3 && (point===32 || (i<j&&j<k)))triples.push([i,j,k]);
      const includes=triples.filter(tr=>tr.includes(b));
      if(point===33)return [triples.length,includes.length,triples.length-includes.length];
      return [new Set(triples.map(([i,j])=>i+','+j)).size,triples.length,includes.length];
    }
    case 34: {
      const trials=data.rows.map(([n,h])=>Array.from({length:n},(_,i)=>i<h));
      return [trials[0].filter(Boolean).length/trials[0].length,trials.flat().filter(Boolean).length,trials.flat().filter(Boolean).length/trials.flat().length];
    }
    case 35: {
      const totals=[];
      for(let i=1;i<=a;i++)for(let j=1;j<=a;j++)totals.push(i+j);
      const favorable=totals.filter(k=>k===b).length;
      return [totals.length,favorable,favorable/totals.length];
    }
    case 36: {
      const chips=['red','blue','white'].flatMap((color,i)=>Array(r[i]).fill(color)),outcomes=chips.flatMap(x=>chips.map(y=>[x,y]));
      return [chips.filter(x=>x!=='white').length/chips.length,outcomes.filter(([x,y])=>x==='red'&&y==='red').length/outcomes.length,outcomes.filter(pair=>pair.includes('red')).length/outcomes.length];
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
for (const [i,page] of [5,14,22,27,31,38,44,49,54,60,65,75,81,87,92,98,108,114,117,122,125,130,134,144,148,154,161,168,172,182,187,191,194,198,202,211].entries()) {
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
console.log('Source 50: 1188 independent numeric checks and thirty-six pupil journeys with saved and assisted work.');
