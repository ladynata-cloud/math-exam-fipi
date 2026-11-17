const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
const old=D.meta.map(m=>({id:m.id,tasks:[0,1,2,11,45,100].map(s=>JSON.stringify(D.task(m.id,s)))}));
require('../ege-baza/path/practice.js');
for (const [id, seed, retained] of [['practice-temperature',1,-20], ['practice-root-product',19,5]]) {
  const current=D.task(id,seed);
  assert.notEqual(id==='practice-temperature'?current.params.c:current.params.a,retained,'source data are independently selected');
}
assert.notEqual(D.task('practice-inverse-formula',167).params.a,8);
assert.notDeepEqual(D.task('practice-grid-parallelogram',18).display.points,[[0,0],[3,0],[5,5],[2,5]]);

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
 case 'electric':return p.speed!==undefined?(p.speed/p.radius)*p.speed:p.i===undefined?(p.u/p.r)*p.u:p.r*p.i*p.i;
 case 'temperature':return (9*p.c+160)/5;
 case 'area-formula':return p.a*p.h/2+p.b*p.h/2;
 case 'inverse-formula':return p.S/((p.a+p.b)/2);
 case 'probability-draw':return p.excluded?(p.n-p.excluded.reduce((a,b)=>a+b,0))/p.n:p.good/p.n;
 case 'probability-opposite':return 1-p.bad/p.n;
 case 'delivery':return Math.min(...p.rows.map(([,price,ship,threshold])=>{const goods=price*p.n;return goods+((threshold!==0&&goods>threshold)?0:ship);}));
 case 'rental':{
  if(p.rating)return Math.min(...p.rows.map(([,strength,accuracy,issues])=>strength*3+accuracy*2-issues*4));
  return Math.min(...p.rows.map(([,consumption,price,rent])=>rent+price*consumption*p.km/100));
 }
 case 'overnight':return 24*60+p.end-p.start;
 case 'missing-perimeter':{
  const sizes=[[p.a,p.c],[p.b,p.c],[p.b,p.d],[p.a,p.d]];
  const [width,height]=sizes[p.blank];
  return width+height+width+height;
 }
 case 'graph-slope':return (p.y1-p.y2)/(p.x1-p.x2);
 case 'grid-cut':{
  if(!p.estimate)return (p.w-p.a)*p.h+p.a*(p.h-p.b);
  const twiceArea=p.points.reduce((area,[x,y],i)=>{const [nextX,nextY]=p.points[(i+1)%p.points.length];return area+x*nextY-y*nextX;},0);
  assert.notEqual(Math.abs(twiceArea)%2,1,'estimate must avoid an exact half-unit tie');
  return Math.round(Math.abs(twiceArea)/2);
 }
 case 'grid-parallelogram':case 'parallelogram':return sum(Array(p.h).fill(p.a));
 case 'free-area':return (p.a-p.b)*p.a+p.b*(p.a-p.c);
 case 'fence':return p.a+p.b+p.a+p.b-p.g;
 case 'spokes':return 360*(p.gaps??1)/p.n;
 case 'displacement':return p.before===undefined?p.litres*p.factor*1000-p.litres*1000:p.litres*1000*(p.after/p.before-1);
 case 'pour':return p.oldH/(Math.PI*p.ratio*p.ratio)*Math.PI;
 case 'joined-surface':{
  if(p.width===undefined)return 2*(2*p.a*p.a+2*p.a*p.a+p.a*p.a);
  const front=p.width*p.baseHeight+p.upperWidth*p.raise,frontPerimeter=2*(p.width+p.baseHeight+p.raise);
  return 2*front+frontPerimeter*p.depth;
 }
 case 'faces':return (p.n+2-1)+(p.n+1-1);
 case 'right-ratio':return (p.ask?Math.sqrt(p.c*p.c-p.a*p.a):Math.sqrt(p.c*p.c-p.b*p.b))/p.c;
 case 'triangle-angle':return 180-(p.a+p.b);
 case 'diameter-chord':return Math.sqrt(4*p.r*p.r-p.chord*p.chord);
 case 'cone-area':assert.ok(p.l>p.r&&2*p.l>p.r*p.ratio,'both cones must exist');return (Math.PI*(p.r*p.ratio)*(2*p.l))/(Math.PI*p.r*p.l);
 case 'pyramid-lateral':{const side=p.perimeter===undefined?10*p.s:p.perimeter/p.n,edge=p.edge??13*p.s;return p.n*.5*side*Math.sqrt(edge*edge-side*side/4);}
 case 'box-diagonal':return p.a*p.b*Math.sqrt(p.d*p.d-p.a*p.a);
 case 'similar-volume':return p.whole===undefined?p.small*Math.pow(p.factor,3):p.whole*(1-Math.pow(p.smallHeight/p.height,3));
 case 'fraction-add':return (4*p.a+6*p.b)/24;
 case 'fraction-divide':return (p.a/p.b)/(p.c/p.d);
 case 'mixed-fraction-expression':return p.tenths/10+(p.numerator/8)*4/5;
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
 case 'log-equation-difference':return roots(x=>p.factor*(x+p.shift)>0
  ? Math.log(p.factor*(x+p.shift)/p.divisor)/Math.log(p.base)-Math.log(p.ratio)/Math.log(p.base)
  : NaN, -100, 500)[0];
 case 'log-equation':return roots(x=>x+p.b>0?Math.log(x+p.b)/Math.log(p.a)-p.p:NaN, -100, 500)[0];
 case 'exponential-equation':return roots(x=>Math.pow(p.a,x+p.b)-Math.pow(p.a,p.p))[0];
 case 'rational-equation':return roots(x=>x!==p.a?p.num/(x-p.a)-p.b:NaN)[0];
 case 'meeting':{
  if(p.fromSecond!==undefined)return (p.total-p.fromSecond)/p.hours;
  if(p.turn===undefined)return p.dist/(p.a+p.b);
  const atTurn=p.turn/p.fast;
  const currentGap=p.turn-p.slow*atTurn;
  return p.slow*(atTurn+currentGap/(p.slow+p.fast));
 }
 case 'river':return p.d1/(p.v+p.u)+p.d2/(p.v-p.u);
 case 'work':return p.a*p.b/(p.a+p.b);
 case 'mixture-water':return (p.m*p.p-p.m*p.q)/p.q;
 case 'average-three':return sum(p.dist)/sum(p.dist.map((d,i)=>d/p.speed[i]));
 case 'ring-meeting':return p.L/(p.same?p.fast-p.slow:p.fast+p.slow);
 case 'ring-route':return p.half-p.ac;
 case 'average-speed':return (2*p.d)/(p.d/p.slow+p.d/p.fast);
 case 'mushroom-count': {
  const possible = [];
  for (let saffron = 0; saffron <= p.total; saffron++) {
   const milk = p.total - saffron;
   if (milk < p.anyWithSaffron && saffron < p.anyWithMilk) possible.push(p.askSaffron ? saffron : milk);
  }
  assert.equal(possible.length, 1);
  return possible[0];
 }
 case 'vase-order': {
  const possible = [];
  const orders = ['WBY', 'WYB', 'BWY', 'BYW', 'YWB', 'YBW'];
  for (let white = 1; white < p.total - 1; white++) {
   for (let blue = 1; blue < p.total - white; blue++) {
    const counts = { W: white, B: blue, Y: p.total - white - blue };
    for (const order of orders) {
     const sum = part => [...part].reduce((total, color) => total + counts[color], 0);
     if (sum(order.slice(0, order.indexOf('B'))) === p.left && sum(order.slice(order.indexOf('W') + 1)) === p.right) {
      possible.push({ order, ...counts });
     }
    }
   }
  }
  assert.equal(possible.length, 1);
  assert.equal(possible[0].order, 'WYB');
  return possible[0].Y;
 }
 case 'sets':return p.A+p.B-p.total;
 case 'integer-budget':{
  if(!p.allowsSkips)return roots(x=>p.reward*x-p.penalty*(p.n-x)-p.score,0,p.n)[0];
  const valid=[];
  for(let correct=0;correct<=p.n;correct++){
   for(let errors=1;errors+correct<=p.n;errors++){
    if(p.reward*correct-p.penalty*errors===p.score)valid.push(correct);
   }
  }
  assert.equal(valid.length,1,'quiz with skipped answers must have one solution');
  return valid[0];
 }
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
 if(t.reference==='tangent-match'){
  const slopes=t.params.panels.map(({left,right})=>(right-left)/2);
  assert.equal(new Set(slopes).size,4);
  assert.equal(t.display.kind,'tangents');
  return slopes.map(slope=>t.params.order.indexOf(slope)+1).join('');
 }
 if(t.reference==='graph-match-criteria'){
  const intervals=p.values.slice(1).map((right,i)=>[p.values[i],right]);
  const max=Math.max(...intervals.map(([left,right])=>right-left));
  const criteria=p.signs
   ? [([a,b])=>a<b,([a,b])=>a>b,([a,b])=>a>0&&b>0,([a,b])=>a<0&&b<0]
   : [([a,b])=>b-a===max,([a,b])=>b<a,([a,b])=>a<b&&a>p.base,([a,b])=>a===b];
  return intervals.map(pair=>{
   const matching=criteria.flatMap((fn,i)=>fn(pair)?[i]:[]);
   assert.equal(matching.length,1);
   return p.order.indexOf(matching[0])+1;
  }).join('');
 }
 if(t.reference==='graph-match'){const diffs=p.values.slice(1).map((v,i)=>v-p.values[i]),big=Math.max(...diffs);return diffs.map(v=>p.order.indexOf(v<0?1:v===0?2:v===big?3:0)+1).join('');}
 if(t.reference==='luggage')return p.rows.filter(r=>r.slice(1).every((v,i)=>v<=(p.limits||[55,40,20,10])[i])).map(r=>r[0]).join('');
 if(t.reference==='logic-order'){
  const result=[true,true,true,true];
  for(let a=1;a<7;a++)for(let b=1;b<7;b++)for(let c=1;c<7;c++)for(let d=1;d<7;d++)if(a>b&&b>c&&d>c){[a>c,c<a&&c<b&&c<d,d>a,b===d].forEach((v,i)=>result[i]&&=v);}
  return p.order.flatMap((v,i)=>result[v]?[i+1]:[]).join('');
 }
 if(t.reference==='logic-all')return p.order.flatMap((v,i)=>[0,2].includes(v)?[i+1]:[]).join('');
 return null;
}
let tested=0;
for(const {id,tasks} of old)assert.deepEqual([0,1,2,11,45,100].map(s=>JSON.stringify(D.practice.taskForBankVersion(id,s))),tasks,'Legacy task changed: '+id);
for(let pos=1;pos<=21;pos++)assert(D.practice.catalog.some(m=>m.pos===pos),'Empty position '+pos);
for(const m of D.practice.catalog){
 const variants = ['practice-mushroom-count', 'practice-vase-order'].includes(m.id) ? 240 : 80;
 const conditions = new Set();
 for(let seed=0;seed<variants;seed++){
  const t=D.task(m.id,seed);assert(t.q&&t.steps.length&&t.steps.length<=20);assert.equal(t.pos,m.pos);
  if(t.answerKind==='solutions'){
   const expected=[];
   for(let n=t.reference==='digits-delete'?10000:1000;n<(t.reference==='digits-delete'?100000:10000);n++){
    const digits=[...String(n)].map(Number);
    const fits=t.reference==='digits-delete'
      ? n%22===0&&new RegExp([...String(n)].join('.*')).test(t.params.digits)
      : t.reference==='digit-pair'
        ? [...String(n)].sort().join('')===t.params.first&&[...String(n*t.params.factor)].sort().join('')===t.params.second
        : t.reference==='digits-product'
        ? n%t.params.divisor===0&&digits.reduce((a,b)=>a*b,1)===t.params.target
        : n%t.params.divisor===0&&t.params.allowed.every(x=>digits.includes(x));
    if(fits)expected.push(String(n));
   }
   assert(expected.length>0);assert.deepEqual(t.solutions,expected);for(const answer of expected)assert(D.correct(t,answer));assert(!D.correct(t,'0'+expected[0]));assert(!D.correct(t,'123'));
  }else{let value=semantic(t);if(value===null)value=numeric(t.reference,t.params);assert(Number.isFinite(value)||typeof value==='string',m.id);assert(D.correct(t,String(value)),m.id+' seed '+seed+': '+value+' vs '+t.answer);if(typeof value==='number')assert(!D.correct(t,String(value+.01)),m.id+' loose answer');}
  for(const step of t.steps){assert(step.q&&step.why);assert(D.correct(step,String(step.a)),m.id+' invalid step');}
  if(t.reference==='whole-count'){
   const {a,b,total}=t.params,n=numeric(t.reference,t.params),atMax=t.steps.at(-1).a;
   assert(atMax>=0&&atMax<=n);
   assert.equal((n-atMax)*a+atMax*b,total,'The example must attain the total');
  }
  for(const bad of ['', 'Infinity', 'NaN','1/0','<script>','1e10'])assert(!D.correct(t,bad),m.id+' accepted '+bad);
  conditions.add(t.q);
  tested++;
 }
 if (variants === 240) assert.equal(conditions.size, variants, m.id + ' distinct conditions');
}
assert.equal(D.task('practice-chart',0).display.kind,'graph');
assert.equal(D.task('practice-chart',1).display.kind,'bars');
assert.equal(D.practice.taskForBankVersion('practice-chart',0).display.kind,'bars');
assert.equal(D.task('practice-rental',1).params.rating,true);
assert.ok(Number.isFinite(D.task('practice-rental',0).params.km));
assert.ok(Number.isFinite(D.practice.taskForBankVersion('practice-rental',1).params.km));
assert.equal(D.practice.taskForBankVersion('practice-digits-delete',1).params.digits,'45341527');
assert.notEqual(D.task('practice-digits-delete',1).params.digits,'45341527');
const alternateSeeds=Array.from({length:120},(_,index)=>index);
for(const id of ['probability','motion','mixtures']){
 assert(new Set(alternateSeeds.map(seed=>D.task(id,seed).answer)).size>=6,id+' requires varied answers');
}
const unitGroups=new Set(alternateSeeds.map(seed=>D.task('practice-units-match',seed).labels.join('|')));
assert.equal(unitGroups.size,4);
assert.equal(D.task('practice-meeting',1).params.turn!==undefined,true);
assert.equal(Object.hasOwn(D.practice.taskForBankVersion('practice-meeting',1).params,'turn'),false);
for(const seed of alternateSeeds){
 const lamp=D.task('probability',seed),{total,bad}=lamp.params;
 assert.equal(lamp.answer,(total-bad)/total);
 const van=D.task('motion',seed),{dist,speed}=van.params;
 assert.equal(van.answer,sum(dist)/sum(dist.map((km,index)=>km/speed[index])));
 const lemonade=D.task('mixtures',seed),{mass,concentration,water}=lemonade.params;
 assert.equal(lemonade.answer,mass*concentration/(mass+water));
 const lake=D.task('reasoning',seed),{half,ac,ad,cd}=lake.params;
 assert(ac<half&&ad<half&&cd>Math.abs(ac-ad)&&cd<ac+ad);
 assert.equal(lake.answer,(ac+ad+cd)/2-ac);
}
console.log(`EGE_BAZA_PRACTICE_MATH_OK: ${tested} generated conditions, ${D.practice.catalog.length} new families, all 21 positions, 168 unchanged legacy cases, exhaustive digit answers, independently recalculated keys.`);

// The new median uses perimeter and base. Recover the sides independently
// from the givens and test the exact old task through the rollback bank.
for(let seed=0;seed<216;seed++){
 const task=D.task('triangle',seed),legacy=D.practice.taskForBankVersion('triangle',seed,1);
 assert.match(legacy.q,/Найдите площадь/);
 if(seed%2){assert.equal(task.q,legacy.q);continue;}
 const {base,perimeter}=task.params;
 const side=(perimeter-base)/2;
 assert.equal(task.answer,Math.sqrt((side-base/2)*(side+base/2)));
 assert.match(task.q,/медианы BM/);
 assert.equal(D.correct(task,String(task.answer)),true);
}
