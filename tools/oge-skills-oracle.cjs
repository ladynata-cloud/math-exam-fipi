'use strict';
// Exact mathematical checks independent of the UI grader and the authored answer.
// Logical witnesses validate availability of a stated step, not a free-text proof.
const base=require('./foundations-routes-oracle.cjs');
function ensure(value,message){if(!value)throw Error(message);}
function compare(a,b){const d=a[0]*b[1]-b[0]*a[1];return d<0n?-1:d>0n?1:0;}
function verify(q){
 const o=q.oracle;ensure(o&&typeof o.kind==='string','Missing OGE oracle '+q.id);
 if(o.kind==='proof-dependency'){
  ensure(q.input==='choice'&&Array.isArray(q.choices)&&Array.isArray(o.candidates)&&q.choices.length===o.candidates.length,'proof candidate correspondence '+q.id);
  ensure(Array.isArray(o.facts)&&o.facts.every(f=>typeof f==='string')&&new Set(o.facts).size===o.facts.length,'proof premises '+q.id);
  ensure(['next','unsupported'].includes(o.mode),'proof mode '+q.id);if(o.mode==='next')ensure(typeof o.goal==='string'&&!o.facts.includes(o.goal),'unestablished target '+q.id);
  const facts=new Set(o.facts),matches=[];
  for(const [i,c]of o.candidates.entries()){ensure(Array.isArray(c.requires)&&c.requires.length&&c.requires.every(f=>typeof f==='string')&&new Set(c.requires).size===c.requires.length&&typeof c.produces==='string','step premises '+q.id);
   const available=c.requires.every(f=>facts.has(f));if(o.mode==='next'?available&&c.produces===o.goal:!available)matches.push(i);
  }
  ensure(matches.length===1&&q.choices[matches[0]]===q.answer,'ambiguous or unsupported proof step '+q.id);return true;
 }
 if(!['reduced-numerator','quadratic-root','dice-sum','visual-coordinate'].includes(o.kind))return base.verify(q);
 ensure(q.input==='number','numeric mathematical witness '+q.id);const actual=base.literal(String(q.answer));let expected;
 if(o.kind==='reduced-numerator'){const value=base.evaluate(o.expr);expected=base.R(value[0]);}
 if(o.kind==='quadratic-root'){
  const a=base.evaluate(o.a),b=base.evaluate(o.b),c=base.evaluate(o.c);ensure(a[0]!==0n,'non-quadratic witness '+q.id);
  const answer=String(q.answer),residual=base.evaluate(['add',['mul',o.a,['pow',answer,2]],['mul',o.b,answer],o.c]);ensure(residual[0]===0n,'not a root '+q.id);
  const second=base.evaluate(['sub',['div',['neg',o.b],o.a],answer]);ensure(o.selection==='larger'||o.selection==='smaller','root selection '+q.id);
  ensure(o.selection==='larger'?compare(actual,second)>=0:compare(actual,second)<=0,'wrong selected root '+q.id);
  for(const denied of o.excluded||[])ensure(!base.eq(actual,base.evaluate(denied)),'excluded root '+q.id);if(o.domain){if(o.domain.min!==undefined)ensure(compare(actual,base.evaluate(o.domain.min))>=0,'root below domain '+q.id);if(o.domain.max!==undefined)ensure(compare(actual,base.evaluate(o.domain.max))<=0,'root above domain '+q.id);}return true;
 }
 if(o.kind==='dice-sum'){
  ensure(Number.isInteger(o.sides)&&o.sides>=2&&o.sides<=100&&Number.isInteger(o.sum),'dice sample space '+q.id);let favorable=0;for(let a=1;a<=o.sides;a++)for(let b=1;b<=o.sides;b++)if(a+b===o.sum)favorable++;expected=base.R(BigInt(favorable),BigInt(o.sides*o.sides));
 }
 if(o.kind==='visual-coordinate'){
  ensure(q.visual&&Array.isArray(q.visual.points),'coordinate model '+q.id);
  const points=q.visual.points.filter(p=>p.label===o.label);ensure(points.length===1&&((q.visual.type==='numberLine'&&o.axis==='value')||(q.visual.type==='graph'&&['x','y'].includes(o.axis))),'unambiguous coordinate point '+q.id);expected=base.literal(String(points[0][o.axis]));
 }
 ensure(base.eq(actual,expected),'incorrect OGE answer '+q.id);return true;
}
module.exports={...base,verify};
