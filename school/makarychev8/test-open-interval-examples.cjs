'use strict';
const assert=require('node:assert/strict'),C=require('./check'),G=require('./task-graphs'),M=require('../peterson6/math'),tasks=require('./exercises-1032-1038.json');
for(const t of tasks){assert(C.check(t.answer,t),t.title);for(const q of t.steps)assert(C.check(q.answer,q),t.title);}
for(const [n,yes,no]of [[1037,['4.5','4 2/5'],['4','5','6','-4.5']],[1038,['3.1','3 1/4'],['3','3.4','-3.2']]]){
 const q=tasks.find(t=>t.title==='№ '+n);for(const x of yes)assert(C.check(x,q),x);for(const x of no)assert(!C.check(x,q),x);
}
for(const [n,yes,no]of [[1032,'40.999','41'],[1033,'7.001','7.01']]){
 const q=tasks.find(t=>t.title==='№ '+n+'а');assert(C.check(yes,q));assert(!C.check(no,q));
}
const right=['12;37','8;нет','нет;нет','нет;19'];
tasks.filter(t=>t.kind==='extrema-pair').forEach((t,i)=>{assert(C.check(right[i],t));assert(!C.check(i===2?'11;14':'37;12',t));});
let trials=0;
const ranges=t=>t.graph.ranges.map(C.axisRanges);
for(const t of tasks.filter(q=>q.graph.mode==='operation')){
 const [first,second]=ranges(t),claim=C.axisRanges(t.graph.claim);let counter=false;
 for(let n=-48;n<64;n++){const x=M.parse(n+'/4'),a=G.isInAxis(first,x),b=G.isInAxis(second,x),left=t.graph.operation==='union'?a||b:a&&b;counter||=left!==G.isInAxis(claim,x);trials++;}
 assert.equal(counter,t.answer==='неверно');
}
for(let i=-400;i<=400;i++){
 const q=M.parse(i+'/4');assert.deepEqual(G.setProbe('integer-positive',q),[Number.isInteger(i/4),i>0]);const odd=(i/4)%2===1,prime=Number.isInteger(i/4)&&i/4>=2&&!Array.from({length:Math.max(0,Math.floor(Math.sqrt(Math.max(i/4,0)))-1)},(_,j)=>j+2).some(d=>(i/4)%d===0);assert.deepEqual(G.setProbe('prime-odd',q),[prime,odd]);trials+=2;
}
console.log('PASS own rational witnesses, four exact extrema pairs, every interval operation and '+trials+' membership trials.');
