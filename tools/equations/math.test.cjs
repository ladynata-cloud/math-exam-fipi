'use strict';
const assert=require('node:assert/strict');const E=require('./engine.js');let count=0;
function test(prev,next,ok,code){const result=E.check(prev,next);assert.equal(result.ok,ok,`${prev} → ${next}: ${JSON.stringify(result)}`);if(code)assert.equal(result.code,code);count++;}
for(let a=-9;a<=9;a++)if(a)for(let x=-10;x<=10;x++)for(let b=-5;b<=5;b++){
 const p=`${a}*x+(${b})=${a*x+b}`;
 test(p,`${a}x=${a*x}`,true);
 test(p,`x=${x}`,true,'solved');
 test(p,`${a}x=${a*x+1}`,false,'different');
 test(p,`x=${x+1}`,false,'different');
}
for(const [p,n] of [['3x+5=17','3x=12'],['3x=12','x=4'],['2(x+1)=10','x=4'],['x/3=2','x=6'],['0,3x+0,5=1,7','3x=12'],['x=1/3','3x=1'],['3x+5=17','17=5+3х'],['x=4','2x=8'],['x=4','x+3=7'],['x=4','-x=-4']])test(p,n,true);
for(const n of ['0=0','1=2','0x=0','x=4/0','x/(x-4)=0','x*x=16','x=x','x^2=16','x=4<script>','x=4=4','x=','x=4.','x=0.333333333333333333333333','x=4/0+4','(x-4)*(x+1)=0'])test('x=4',n,false);
test('x=1/3','x=0.333333333333333333333333',false);test('x=1','x=1.000000000000000000000001',false);test('x=1','x=1/1',true);test('x=1','x/0=1',false,'syntax');test('x=1','x/(x-x)=1',false,'syntax');
for(const s of ['x=1 2','x=1\t2','x=1\n2'])test('x=12',s,false,'syntax');
assert.equal(E.check('0=0','x=1').code,'source');
for(const s of ['x='.repeat(1000),'-'.repeat(200)+'x=1','9'.repeat(100)+'x=1'])assert.equal(E.check('x=1',s).ok,false);
console.log(`MATHEMATICS_OK ${count} checks`);
