'use strict';
const assert=require('node:assert/strict'),G=require('./task-graphs.js'),C=require('./check.js'),P=require('./models.js'),rows=require('./exercises-1109-1113.json');
const task=mode=>rows.find(q=>q.graph.mode===mode);
const ops={'+':(a,b)=>a+b,'-':(a,b)=>a-b,'*':(a,b)=>a*b,'/':(a,b)=>a/b,'^':(a,b)=>a**b};
function evaluate(node,values){if(!Array.isArray(node))return node in values?values[node]:Number(node);return ops[node[0]](evaluate(node[1],values),evaluate(node[2],values));}
assert.equal(rows.length,11);for(const q of rows){assert.equal(q.source.page,248);assert(C.check(q.answer,q));for(const s of q.steps)assert(C.check(s.answer,s));}
const cross=task('cross');assert(C.check('(1;2); (-2;-1)',cross));assert(!C.check('(1;2), (1;2)',cross));assert(!C.check('(1;2), (-2;1)',cross));
let count=0;
for(let n=-42;n<=42;n++)for(let d=1;d<=7;d++){
 const x=n/d;
 for(const k of ['cross','disjoint','strip']){
  const g=task(k).graph,r=G.review43Trial(g,n+'/'+d);
  if(k==='strip'){assert.equal(r.inside,x>0&&x<=4);}
  else if(x!==0){const equal=Math.abs(r.line-r.other)<1e-11;assert.equal(equal,k==='cross'&&(x===-2||x===1));}else assert.equal(r.other,null);
  count++;
 }
 for(let m=-4;m<=4;m++)for(const key of ['identity-a','identity-b','identity-c']){
  const q=task(key),values={a:x,x,y:m,c:m};if(key==='identity-a'&&(x===0||x===1))continue;
  if(key==='identity-b'&&(x*m===0||Math.abs(x)===Math.abs(m)))continue;if(key==='identity-c'&&Math.abs(x)===Math.abs(m))continue;
  const [equals,left,right]=q.mathExpression;assert.equal(equals,'=');const v=evaluate(left,values);
  assert(Math.abs(v-Number(right))<1e-8,q.id);count++;
 }
}
assert.equal(G.review43Trial(task('numeric').graph,'3/2').allowed,false);assert(Math.abs(evaluate(task('numeric').mathExpression,{a:-1.2})+.36)<1e-12);
assert.equal(G.review43Digits([311,18],6),'17,277777');assert.equal(G.review43Digits([1727,100],6),'17,270000');
for(const q of rows.filter(t=>t.graph.mode.startsWith('compare-'))){const g=q.graph,diff=g.left[0]*g.right[1]-g.right[0]*g.left[1];assert.equal(q.answer,diff<0?'<':'>');}
for(let seed=0;seed<80;seed++)for(const id of P.review43Skills.map(s=>s.id)){const q=P.extraReview43(id,seed,1+seed%3);assert(C.check(q.answer,q));if(q.kind==='intersection-points')for(const [x,y] of C.pointGroups(q.answer)[0]){const r=G.review43Trial(q.graph,x.n+'/'+x.d);assert.equal(r.line,y.n/y.d);assert.equal(r.other,r.line);}}
console.log('PASS '+count+' source substitutions and graph samples, interval endpoints, digit comparisons and generated examples.');
