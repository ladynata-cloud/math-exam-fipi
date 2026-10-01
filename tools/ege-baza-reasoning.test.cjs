const assert=require('node:assert/strict'),D=require('../ege-baza/reasoning/data.js'),M=require('../ege-baza/reasoning/math.js');
const keys=[[0,'5',1,'1935'],[1,'24','1236'],[1,0,'1236'],['5',0,'74235'],['1','12','1.2','4.8'],['3','2','360','72'],['120','60','90','2'],['.9','9','10'],[0,1,'13','4'],[0,0,'16'],['345',1,0,'16','9'],['60','160','80','80']];
const checks=['4680','1836','2232','95436','6','48','60','10','8','20','15','115'];
D.lessons.forEach((l,i)=>{l.steps.forEach((t,j)=>assert(t.rule?D.rules[t.rule](keys[i][j]):t.options?t.a===keys[i][j]:+t.a===+keys[i][j],l.id+' '+j));const t=l.check;assert(t.rule?D.rules[t.rule](checks[i]):+t.a===+checks[i],l.id+' check');});
for(const invalid of ['0193','12345','1234','-1935','19.35','foo'])assert(!D.rules.odd15(invalid));assert(D.rules.odd15('9135'));assert(D.rules.even45('6840'));assert(!D.rules.strike('57324'));assert(!D.rules.strike('741235'));assert(!D.rules.product12('2232'));
let accepted=0;for(let n=1000;n<=9999;n++){const s=String(n),ds=[...s].map(Number),expected=n%45===0&&new Set(ds).size===4&&ds.every(d=>d%2===0);assert.equal(D.rules.even45(s),expected);if(expected)accepted++;}assert(accepted>1);
assert.deepEqual(M.scores(20,4,7,31),[{right:13,wrong:3,skip:4}]);assert.deepEqual(M.scores(15,3,5,14),[{right:8,wrong:2,skip:5}]);
assert.deepEqual(M.table([110,115,120],21,22),[16]);assert.deepEqual(M.table([100,105,110],21,22),[15]);assert.equal(M.construct([110,115,120],15,21,22),null);
for(const cols of [[110,115,120],[100,105,110]]){const n=M.table(cols,21,22)[0],rows=M.construct(cols,n,21,22);assert.equal(rows.length,n);rows.forEach(r=>{assert(r.every(v=>Number.isInteger(v)&&v>=1));assert([21,22].includes(r.reduce((a,b)=>a+b,0)));});cols.forEach((c,j)=>assert.equal(rows.reduce((a,r)=>a+r[j],0),c));}
for(const [L,a,b] of [[6,4,6],[9,3,6]]){const t=2*L/(a+b),r=M.walk(t,L,a,b);assert(Math.abs(r.slow-r.fast)<1e-10);assert(t>=L/b);assert(a*t<L);}
assert.equal(M.average(180,60,180,90),72);assert.equal(M.average(120,40,120,60),48);
console.log('REASONING_MATH_OK: all guided/check keys, exhaustive 9000 four-digit inputs, alternative answers, path conservation, integer feasibility and constructive table column/row sums.');module.exports={keys,checks};
