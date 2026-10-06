'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');
require('../ege-baza/path/grade7-foundations.js');
const oldSeeds=[0,1,17,119,240,359,100003];
const oldTasks=D.meta.map(m=>({id:m.id,tasks:oldSeeds.map(seed=>JSON.stringify(D.task(m.id,seed)))}));
require('../ege-baza/path/pre7-applications.js');
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function R(n,d=1){n=BigInt(n);d=BigInt(d);assert(d!==0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
const add=(a,b)=>R(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const sub=(a,b)=>R(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>R(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>R(a[0]*b[1],a[1]*b[0]);
function parse(s){s=String(s).trim().replaceAll('−','-').replace(',','.');if(s.includes('/')){const[a,b]=s.split('/');return div(parse(a),parse(b));}const m=s.match(/^(-?)(\d+)(?:\.(\d+))?$/);assert(m,'Exact numeric: '+s);const tail=m[3]||'';return R(BigInt(m[2]+tail)*(m[1]?-1n:1n),10n**BigInt(tail.length));}
const asString=r=>`${r[0]}/${r[1]}`;
const cmp=(a,b)=>{const d=a[0]*b[1]-b[0]*a[1];return d<0n?1:d===0n?2:3;};
function oracle(t){
 const p=t.params,m=p.mode;let expected,steps;
 switch(t.id){
 case 'pre7-fraction-line':{
  const whole=R(p.base),increment=R(1,p.d);
  expected=m===0?add(whole,mul(R(p.p),increment)):m===1?increment:sub(add(whole,R(p.right,p.d)),add(whole,R(p.left,p.d)));
  steps=m===0?[p.d,increment,p.base*p.d,expected]:m===1?[1,p.d,increment]:[p.right-p.left,increment,expected];
  assert(p.p>0&&p.p<p.d);if(m===2)assert(p.left>=0&&p.right>p.left&&p.right<=p.d);
  assert.equal(t.model.diagram.max-t.model.diagram.min,1);assert.equal(t.model.diagram.intervals,p.d);
  const point=t.model.diagram.points.at(-1);assert.equal(point.value,m===1?p.base+1:p.base+(m===0?p.p:p.right)/p.d);
  break;
 }
 case 'pre7-equivalent-fractions':{
  assert.equal(BigInt(p.P)*BigInt(p.d),BigInt(p.Q)*BigInt(p.p),'Equal fractional strips.');
  assert.equal(gcd(BigInt(p.p),BigInt(p.d)),1n);const common=Number(gcd(BigInt(p.P),BigInt(p.Q)));
  expected=m===0?R(p.p*p.Q,p.d):m===1?R(p.P,p.Q):R(p.P*p.d,p.p);
  steps=m===0?[p.Q/p.d,p.Q/p.d,expected]:m===1?[common,p.P/common,p.Q/common,expected]:[p.P/p.p,p.P/p.p,expected];
  assert(p.Q<=20&&p.P<p.Q&&p.p>0);break;
 }
 case 'pre7-fraction-compare':{
  const lcm=Number(BigInt(p.d*p.e)/gcd(BigInt(p.d),BigInt(p.e))),index=cmp(R(p.a,p.d),R(p.b,p.e));expected=R(index);
  steps=m===0?[p.d,p.a,p.b,index]:m===1?[p.a,p.d,p.e,index]:[lcm,p.a*lcm/p.d,p.b*lcm/p.e,index];
  if(m===0)assert.equal(p.d,p.e);if(m===1)assert.equal(p.a,p.b);
  assert(p.a>0&&p.a<p.d&&p.b>0&&p.b<p.e);break;
 }
 case 'pre7-fraction-part-whole':{
  const ratio=R(p.p,p.d),part=mul(R(p.whole),ratio),unit=div(R(p.whole),R(p.d));
  expected=m===0?part:m===1?div(R(p.part),ratio):sub(R(p.whole),part);
  steps=m===1?[p.p,div(R(p.part),R(p.p)),expected]:[p.d,unit,part];if(m===2)steps.push(expected);
  assert.deepEqual(R(p.part),part);assert(p.p>0&&p.p<p.d);assert.equal(part[1],1n);break;
 }
 case 'pre7-decimal-compare':{
  const displayed=t.q.match(/^Сравни ([\d,]+) и ([\d,]+)\./);assert(displayed);
  const x=parse(displayed[1]),y=parse(displayed[2]),index=cmp(x,y);assert.deepEqual(x,R(p.x,1000));assert.deepEqual(y,R(p.y,1000));expected=R(index);
  steps=[Number(x[0]/x[1]),Number(y[0]/y[1])];if(m!==2)steps.push(mul(x,R(1000)),mul(y,R(1000)));steps.push(index);
  if(m===1)assert.deepEqual(x,y);if(m===2)assert.notEqual(Number(x[0]/x[1]),Number(y[0]/y[1]));
  t.model.diagram.rows.forEach((row,i)=>assert.deepEqual(parse(row[0]),R(row[1]*1000+row[2]*100+row[3]*10+row[4],1000)));
  break;
 }
 case 'pre7-mass-capacity':{
  const total=p.whole*1000+p.tail;assert.equal(p.total,total);
  expected=m===2?R(cmp(R(total),R(p.smaller))):R(total);
  steps=m===2?[total,p.smaller,expected]:[1000,p.whole*1000,total];
  assert(p.tail>0&&p.tail<1000);if(m===2)assert(p.smaller>0);break;
 }
 case 'pre7-ruler-length':{
  const length=p.end-p.start;expected=m===1?R(length,10):m===2?R(p.start+p.length):R(length);
  steps=m===1?[p.start,length,10,expected]:m===2?[p.start,p.length,p.start+p.length]:[p.start,p.end,length];
  assert.equal(length,p.length);assert(p.start>0&&p.end>p.start);assert.equal(t.model.diagram.max-t.model.diagram.min,t.model.diagram.intervals,'Ruler ticks are one integer unit apart.');
  assert.equal(t.model.diagram.points[0].value,p.start);assert.equal(t.model.diagram.points[1].value,p.end);break;
 }
 case 'pre7-perimeter':{
  assert(t.model.diagram.description.includes('схематический'));const sides=t.model.diagram.sides,sum=sides.reduce((a,b)=>a+b,0);assert.equal(sum,p.perimeter);
  expected=m===2?R((sum-2*p.a)/2):R(sum);
  steps=m===0?[4,p.a+p.b,sum]:m===1?[3,p.a+p.b,sum]:[sum/2,p.a,expected];
  if(m===1){for(const side of sides)assert(sum-side>side,'Nondegenerate triangle.');assert.equal(t.model.diagram.rectangle,false);}else{assert.equal(sides[0],sides[2]);assert.equal(sides[1],sides[3]);assert.equal(t.model.diagram.rectangle,true);}
  if(m===2){assert.equal(t.model.diagram.labels[1],'?');assert.equal(t.model.diagram.labels[3],'?');}break;
 }
 case 'pre7-grid-area':{
  const d=t.model.diagram;let cells=0;
  for(let y=0;y<d.rows;y++)for(let x=0;x<d.cols;x++){const hole=d.cutout;if(!hole||x<hole.x||x>=hole.x+hole.w||y<hole.y||y>=hole.y+hole.h)cells++;}
  assert.equal(p.cells,cells);expected=R(cells*(m===2?p.side*p.side:1));
  steps=m===0?[p.cols,p.rows,expected]:m===1?[p.cols*p.rows,p.w*p.h,expected]:[cells,p.side*p.side,expected];
  assert.equal(d.unit,`Сторона клетки ${m===2?p.side:1} см`);if(m===1)assert(d.cutout&&d.cutout.w<p.cols&&d.cutout.h<p.rows);else assert.equal(d.cutout,undefined);
  assert(cells>0);break;
 }
 default:throw Error('Missing oracle: '+t.id);
 }
 assert.equal(t.steps.length,steps.length,'Every intermediate step independently checked.');
 steps.forEach((expected,i)=>assert.deepEqual(parse(t.steps[i].a),Array.isArray(expected)?expected:R(expected),`${t.id}: ${t.steps[i].q}`));
 return expected;
}
function modelBounds(t){
 const m=t.model,d=m.diagram;assert.equal(m.kind,'pre7-lab');assert(typeof d.description==='string'&&d.description.length>10);assert(m.elements.length>=2);const ids=m.elements.map(e=>e.id);assert.equal(new Set(ids).size,ids.length);m.elements.forEach(e=>assert(e.id&&e.label&&e.description));
 let allowed=[];
 switch(d.type){
 case 'line':assert(Number.isFinite(d.min)&&d.max>d.min);assert(Number.isInteger(d.intervals)&&d.intervals>=1&&d.intervals<=20);d.points.forEach(p=>assert(Number.isFinite(p.value)&&p.value>=d.min&&p.value<=d.max));allowed=d.points.map(p=>p.id);break;
 case 'bars':assert(d.bars.length>=2);d.bars.forEach(b=>assert(Number.isInteger(b.parts)&&b.parts>0&&b.parts<=20&&b.value>=0&&b.value<=b.total&&b.total>0));allowed=d.bars.map(b=>b.id);break;
 case 'table':assert(d.headers.length<=5);d.rows.forEach(r=>assert.equal(r.length,d.headers.length));allowed=[...d.rowIds,...d.rows.flatMap((r,i)=>r.map((_,j)=>`cell-${i}-${j}`))];break;
 case 'boundary':assert([3,4].includes(d.sides.length));assert(d.sides.every(s=>Number.isInteger(s)&&s>0));allowed=d.sides.map((_,i)=>'side-'+i);break;
 case 'grid':assert(Number.isInteger(d.cols)&&d.cols>=1&&d.cols<=12);assert(Number.isInteger(d.rows)&&d.rows>=1&&d.rows<=10);if(d.cutout){const h=d.cutout;assert(h.x>=0&&h.y>=0&&h.w>0&&h.h>0&&h.x+h.w<=d.cols&&h.y+h.h<=d.rows);}allowed=Array.from({length:d.rows},(_,i)=>'row-'+i).concat(d.cutout?['cutout']:[]);break;
 default:throw Error('Unknown diagram '+d.type);
 }
 ids.forEach(id=>assert(allowed.includes(id),`${t.id}: selection ${id} points to an actual diagram part`));
}
assert.equal(D.pre7Applications.families.length,9);assert.equal(D.pre7Applications.count,360);assert.equal(new Set(D.meta.map(m=>m.id)).size,D.meta.length);
let cases=0,steps=0;const diversity={},comparisonSigns={};
for(const family of D.pre7Applications.families){
 const meta=D.meta.find(m=>m.id===family.id);for(const key of ['grade7','pre7','expanded','trainingOnly'])assert.equal(meta[key],true);assert.equal(meta.pos,null);assert.equal(meta.subject,'foundation');assert(meta.idea&&meta.gap);
 const unique=[new Set(),new Set(),new Set()];
 for(let seed=0;seed<360;seed++){
  const t=D.task(family.id,seed),expected=oracle(t),label=family.id+' seed '+seed;assert.equal(t.params.mode,Math.floor(seed/120));unique[t.params.mode].add(t.q);
  assert.deepEqual(parse(t.a),expected,label);assert.deepEqual(parse(t.answerExact),expected,label);assert.equal(t.answer,Number(expected[0])/Number(expected[1]),label);assert(D.correct(t,asString(expected)));assert(D.correct(t,D.answerText(t)));
  assert(!D.correct(t,asString(add(expected,R(1)))));for(const invalid of ['', 'abc','1/0'])assert(!D.correct(t,invalid));
  for(const s of t.steps){assert.equal(s.strict,true);assert(s.q&&s.why);assert(D.correct(s,D.answerText(s)));assert(!D.correct(s,asString(add(parse(s.a),R(1)))));assert(!D.correct(s,'1/0'));if(s.choices){assert.equal(s.choices.length,3);assert(s.choices.some(c=>c.value===String(s.a)));}steps++;}
  if(t.id==='pre7-equivalent-fractions'&&t.params.mode===1){
   const {p,d,P,Q}=t.params;
   for(const item of [t,t.steps.at(-1)]){
    assert.equal(item.answerKind,'reducedFraction');assert.equal(D.answerText(item),`${p}/${d}`);
    assert(D.correct(item,`  ${p} / ${d}  `));assert(D.correct(item,`0${p}/0${d}`));
    for(const bad of [`${P}/${Q}`,`${p*2}/${d*2}`,String(p/d),`${p}/${-d}`,`${p}/0`,`${p}/${d}abc`,`${p}/${d}/1`])assert(!D.correct(item,bad),'A reduction task checks reduced form: '+bad);
    assert(D.correct(JSON.parse(JSON.stringify(item)),`${p}/${d}`),'Pinned serialized task retains reduction contract.');
   }
  }
  assert.equal(t.trainingOnly,true);
  if(t.choices){comparisonSigns[family.id]??=new Set();comparisonSigns[family.id].add(t.answer);assert(t.choices.some(c=>c.value===String(t.a)));for(const c of t.choices)assert.equal(D.correct(t,c.value),c.value===String(t.a));}
  modelBounds(t);assert.deepEqual(D.task(family.id,seed),t);assert.equal(D.task(family.id,seed+360).q,t.q);assert.equal(D.task(family.id,seed-360).q,t.q);cases++;
 }
 diversity[family.id]=unique.map(s=>s.size);unique.forEach((s,i)=>assert(s.size>=30,`${family.id} mode ${i}: meaningful condition diversity (${s.size})`));
}
assert(D.correct({answerKind:'reducedFraction',a:'-1/2'},' − 1 / 2 '));
assert(!D.correct({answerKind:'reducedFraction',a:'-1/2'},'1/-2'));
assert(D.correct({answerKind:'reducedFraction',a:'2'},'2'));
assert(D.correct({answerKind:'reducedFraction',a:'2'},'2/1'));
assert(!D.correct({answerKind:'reducedFraction',a:'2'},'4/2'));
for(const [id,set] of Object.entries(comparisonSigns))assert.deepEqual([...set].sort(),[1,2,3],id+' includes less/equal/greater');
for(const old of oldTasks)assert.deepEqual(oldSeeds.map(seed=>JSON.stringify(D.task(old.id,seed))),old.tasks,old.id+' unchanged');
console.log(JSON.stringify({result:'PRE7_APPLICATIONS_OK',families:9,seedCases:cases,exactSteps:steps,structuralModes:27,uniqueConditionsPerMode:diversity,legacyCases:oldTasks.length*oldSeeds.length}));
