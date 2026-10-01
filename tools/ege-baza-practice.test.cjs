const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
const old=D.meta.map(m=>({id:m.id,tasks:[0,1,2,11,45,100].map(s=>JSON.stringify(D.task(m.id,s)))}));
require('../ege-baza/path/practice.js');
const sum=a=>a.reduce((x,y)=>x+y,0);
const roots=(fn,from=-100,to=100)=>Array.from({length:to-from+1},(_,i)=>i+from).filter(x=>Math.abs(fn(x))<1e-10);
const numeric=(r,p)=>{
 switch(r){
 case 'change':return p.paid-sum(Array(p.n).fill(p.price));
 case 'afford':{let n=0;while((n+1)*p.price<=p.money)n++;return n;}
 case 'transport':{let n=0;while(n*p.seats<p.children+p.adults)n++;return n;}
 case 'time':return sum(Array(p.h).fill(60))+p.m;
 case 'area-units':return p.a/10*100*100;
 case 'chart':return p.ask?Math.max(...p.values):p.values.indexOf(Math.min(...p.values))+1;
 case 'ranking':return p.rows.map(r=>sum(r.slice(1))).slice().sort((a,b)=>b-a).indexOf(sum(p.rows[p.target].slice(1)))+1;
 case 'interval-data':{let v=0;for(let i=p.a;i<=p.b;i++)v+=p.values[i];return v;}
 case 'electric':return (p.u/p.r)*p.u;
 case 'temperature':return (9*p.c+160)/5;
 case 'inverse-formula':return p.S/((p.a+p.b)/2);
 case 'probability-draw':return p.good/p.n;
 case 'probability-opposite':return 1-p.bad/p.n;
 case 'delivery':return Math.min(...p.rows.map(([,price,ship,threshold])=>{const goods=price*p.n;return goods+((threshold!==0&&goods>threshold)?0:ship);}));
 case 'rental':return Math.min(...p.rows.map(([,consumption,price,rent])=>rent+price*consumption*p.km/100));
 case 'graph-slope':return (p.y1-p.y2)/(p.x1-p.x2);
 case 'grid-cut':return (p.w-p.a)*p.h+p.a*(p.h-p.b);
 case 'grid-parallelogram':case 'parallelogram':return sum(Array(p.h).fill(p.a));
 case 'free-area':return (p.a-p.b)*p.a+p.b*(p.a-p.c);
 case 'fence':return p.a+p.b+p.a+p.b-p.g;
 case 'spokes':return 360/p.n;
 case 'displacement':return p.litres*p.factor*1000-p.litres*1000;
 case 'pour':return p.oldH/(Math.PI*p.ratio*p.ratio)*Math.PI;
 case 'joined-surface':return 2*(2*p.a*p.a+2*p.a*p.a+p.a*p.a);
 case 'faces':return (p.n+2-1)+(p.n+1-1);
 case 'right-ratio':return (p.ask?Math.sqrt(p.c*p.c-p.a*p.a):Math.sqrt(p.c*p.c-p.b*p.b))/p.c;
 case 'triangle-angle':return 180-(p.a+p.b);
 case 'diameter-chord':return Math.sqrt(4*p.r*p.r-p.chord*p.chord);
 case 'cone-area':assert.ok(p.l>p.r&&2*p.l>p.r*p.ratio,'both cones must exist');return (Math.PI*(p.r*p.ratio)*(2*p.l))/(Math.PI*p.r*p.l);
 case 'pyramid-lateral':{let side=10*p.s,edge=13*p.s;return p.n*.5*side*Math.sqrt(edge*edge-side*side/4);}
 case 'box-diagonal':return p.a*p.b*Math.sqrt(p.d*p.d-p.a*p.a);
 case 'similar-volume':return p.small*Math.pow(p.factor,3);
 case 'fraction-add':return (4*p.a+6*p.b)/24;
 case 'fraction-divide':return (p.a/p.b)/(p.c/p.d);
 case 'fraction-expression':return p.a/4+(p.b/6)/(2/3);
 case 'decimals':return p.a/10*(p.b/10)+p.c/10;
 case 'decimal-division':return (p.a/10)/(p.b/10);
 case 'fraction-percent':return p.num*100/p.den;
 case 'percent-part':return p.whole/100*p.p;
 case 'percent-whole':return p.part/(p.p/100);
 case 'percent-rate':return p.part*100/p.whole;
 case 'ratio-parts':return p.total-p.total/(p.a+p.b)*p.a;
 case 'direct-proportion':return p.cost*p.b/p.a;
 case 'inverse-proportion':return p.a*p.time/p.b;
 case 'percent-change':return p.price+(p.up?1:-1)*p.price*p.p/100;
 case 'percent-reverse':return p.after*100/(100-p.p);
 case 'percent-chain':{let up=p.price+p.price*p.p/100;return up-up*p.p/100;}
 case 'root-product':return Math.sqrt(p.a*p.b*p.b)*Math.sqrt(p.a);
 case 'power-rules':return Math.pow(p.a,p.m)*Math.pow(p.a,p.n)/Math.pow(p.a,p.p);
 case 'log-value':{let n=0,value=1;while(value<p.b){n++;value*=p.a;}assert.equal(value,p.b);return n;}
 case 'identity-product':return (p.a*Math.sqrt(p.b)-1)*(p.a*Math.sqrt(p.b)+1);
 case 'trig-angle':return p.n*Math.sin(p.angle*Math.PI/180);
 case 'quadratic':return Math.max(...roots(x=>x*x-p.sum*x+p.prod));
 case 'radical-equation':return roots(x=>x-p.a>=0?Math.sqrt(x-p.a)-p.b:NaN)[0];
 case 'log-equation':return roots(x=>x+p.b>0?Math.log(x+p.b)/Math.log(p.a)-p.p:NaN, -100, 500)[0];
 case 'exponential-equation':return roots(x=>Math.pow(p.a,x+p.b)-Math.pow(p.a,p.p))[0];
 case 'rational-equation':return roots(x=>x!==p.a?p.num/(x-p.a)-p.b:NaN)[0];
 case 'meeting':return p.dist/(p.a+p.b);
 case 'river':return p.d1/(p.v+p.u)+p.d2/(p.v-p.u);
 case 'work':return p.a*p.b/(p.a+p.b);
 case 'mixture-water':return (p.m*p.p-p.m*p.q)/p.q;
 case 'average-speed':return (2*p.d)/(p.d/p.slow+p.d/p.fast);
 case 'sets':return p.A+p.B-p.total;
 case 'integer-budget':return roots(x=>p.reward*x-p.penalty*(p.n-x)-p.score,0,p.n)[0];
 case 'whole-count':{let ns=roots(n=>n*p.a<=p.total&&p.total<=n*p.b?0:1,1,p.total);assert.equal(ns.length,1);return ns[0];}
 }
 throw Error('Missing independent reference: '+r);
};
function semantic(t){const p=t.params;
 if(t.reference==='units-match')return [0,1,2,3].map(n=>p.order.indexOf(n)+1).join('');
 if(t.reference==='number-match'){const ordered=p.values.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]);return ordered.map(([,i])=>p.order.indexOf(i)+1).join('');}
 if(t.reference==='inequality-match'){
  const {a,b}=p,ps=[a-1,a,(a+b)/2,b,b+1];
  const original=[x=>x-a>0,x=>-2*x>-2*b,x=>(x-a)*(x-b)<0,x=>x!==b&&(x-a)/(x-b)>0];
  const possible=[x=>x>a,x=>x<b,x=>x>a&&x<b,x=>x<a||x>b];
  return original.map(fn=>p.order.findIndex(i=>ps.every(x=>fn(x)===possible[i](x)))+1).join('');
 }
 if(t.reference==='graph-match'){const diffs=p.values.slice(1).map((v,i)=>v-p.values[i]),big=Math.max(...diffs);return diffs.map(v=>p.order.indexOf(v<0?1:v===0?2:v===big?3:0)+1).join('');}
 if(t.reference==='luggage')return p.rows.filter(r=>r.slice(1).every((v,i)=>v<=[55,40,20,10][i])).map(r=>r[0]).join('');
 if(t.reference==='logic-order'){
  const result=[true,true,true,true];
  for(let a=1;a<7;a++)for(let b=1;b<7;b++)for(let c=1;c<7;c++)for(let d=1;d<7;d++)if(a>b&&b>c&&d>c){[a>c,c<a&&c<b&&c<d,d>a,b===d].forEach((v,i)=>result[i]&&=v);}
  return p.order.flatMap((v,i)=>result[v]?[i+1]:[]).join('');
 }
 if(t.reference==='logic-all')return p.order.flatMap((v,i)=>[0,2].includes(v)?[i+1]:[]).join('');
 return null;
}
let tested=0;
for(const {id,tasks} of old)assert.deepEqual([0,1,2,11,45,100].map(s=>JSON.stringify(D.task(id,s))),tasks,'Legacy task changed: '+id);
for(let pos=1;pos<=21;pos++)assert(D.practice.catalog.some(m=>m.pos===pos),'Empty position '+pos);
for(const m of D.practice.catalog){
 for(let seed=0;seed<80;seed++){
  const t=D.task(m.id,seed);assert(t.q&&t.steps.length&&t.steps.length<=20);assert.equal(t.pos,m.pos);
  if(t.answerKind==='solutions'){
   const expected=[];
   for(let n=1000;n<10000;n++){const digits=[...String(n)].map(Number);if(t.reference==='digits-product'?n%12===0&&digits.reduce((a,b)=>a*b,1)===t.params.target:n%t.params.divisor===0&&new Set(digits).size===4&&digits.every(x=>x%2===0))expected.push(String(n));}
   assert(expected.length>0);assert.deepEqual(t.solutions,expected);for(const answer of expected)assert(D.correct(t,answer));assert(!D.correct(t,'0'+expected[0]));assert(!D.correct(t,'123'));
  }else{let value=semantic(t);if(value===null)value=numeric(t.reference,t.params);assert(Number.isFinite(value)||typeof value==='string',m.id);assert(D.correct(t,String(value)),m.id+' seed '+seed+': '+value+' vs '+t.answer);if(typeof value==='number')assert(!D.correct(t,String(value+.01)),m.id+' loose answer');}
  for(const step of t.steps){assert(step.q&&step.why);assert(D.correct(step,String(step.a)),m.id+' invalid step');}
  for(const bad of ['', 'Infinity', 'NaN','1/0','<script>','1e10'])assert(!D.correct(t,bad),m.id+' accepted '+bad);
  tested++;
 }
}
console.log(`EGE_BAZA_PRACTICE_MATH_OK: ${tested} generated conditions, ${D.practice.catalog.length} new families, all 21 positions, 168 unchanged legacy cases, exhaustive digit answers, independently recalculated keys.`);
