'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),P=require('./models.js');
const cards=require('./exercises-1136.json');
const root=Math.sqrt;
const differences=[
  5*root(2)+3*root(5)-(3*root(7)+root(45)),
  6*root(2)-2*root(7)-(4*root(3)-root(28)),
  5*root(3)+3*root(5)-(root(75)+7*root(2)),
  root(112)-2*root(5)-(4*root(7)-root(23))
];
function check(q){
 const g=q.graph,[co,la,ra]=q.steps.map(s=>Number(s.answer));
 assert.equal(co*co*g.commonRad,g.hidden);
 assert.equal(la,g.leftTerm[0]**2*g.leftTerm[1]);
 assert.equal(ra,g.rightTerm[0]**2*g.rightTerm[1]);
 const sign=(la-ra)*(g.negative?-1:1);
 const expected=sign>0?'>':sign<0?'<':'=';
 for(const symbol of q.choices)assert.equal(C.check(symbol,q),symbol===expected);
}
assert.equal(cards.length,4);
for(const [i,q]of cards.entries()){
 assert.equal(q.source.page,255);
 assert.equal(q.title,'№ 1136'+['а','б','в','г'][i]);
 assert.equal(q.answer,differences[i]<0?'<':'>');
 check(q);
}
const variants=new Set();
for(let seed=1;seed<101;seed++)for(let level=1;level<=3;level++){
 const q=P.practiceFinalFunction('cancel-common-surd',seed,level);check(q);variants.add(q.prompt);
}
assert(variants.size>=80);
console.log('PASS four printed radical comparisons, common factors, reversed order for negative remainders, 300 regenerated cases');
