'use strict';
const assert=require('node:assert/strict'),M=require('./models.js');let checks=0;const close=(a,b)=>{checks++;assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);};
for(let angle=-720;angle<=720;angle+=15){const p=M.circle(angle);close(p.sin*p.sin+p.cos*p.cos,1);close(p.sin,M.circle(angle+360).sin);close(p.cos,M.circle(angle+360).cos);if((angle-90)%180===0)assert.equal(p.tan,null);else close(p.tan,p.sin/p.cos);}
const source=require('node:vm').runInNewContext(require('node:fs').readFileSync(__dirname+'/data.js','utf8')+';window.AlimovCourse',{window:{}});
for(const task of source.lessons[28].tasks){
 const {opposite,adjacent,hypotenuse}=task.initialTriangle;
 assert.equal(opposite**2+adjacent**2,hypotenuse**2);
 const a=Math.atan2(opposite,adjacent)*180/Math.PI;
 const [n,d]=task.answer.split('/').map(Number);
 close(M.circle(2*a).sin,n/d);
 for(let offset=-90;offset<=90;offset++){
  const first=M.circle(a+offset),second=M.circle(2*(a+offset));
  close(second.sin,2*first.sin*first.cos);close(second.cos,first.cos**2-first.sin**2);
 }
}
for(const a of [0.5,2,3])for(const x of [-3,-1,0,1,3])close(M.curve('log',a,M.curve('exp',a,x)),x);
assert(Number.isNaN(M.curve('log',2,0)));assert(Number.isNaN(M.curve('root',2,-1)));assert(Number.isNaN(M.curve('inverse',2,0)));assert(Number.isNaN(M.curve('rational',2,-1)));assert(Number.isNaN(M.curve('tan',2,Math.PI/4)));
for(let n=2;n<=8;n++)for(let k=1;k<=n;k++){let subsets=0;for(let bits=0;bits<(1<<n);bits++)if(bits.toString(2).replace(/0/g,'').length===k)subsets++;assert.equal(M.counting(n,k).combinations,subsets);checks++;}
for(const xs of [[1,2,2,7],[0,2,4],[-2,0,2],[8,8,8]]){const v=M.statistics(xs),shift=M.statistics(xs.map(x=>x+10));close(v.variance,shift.variance);close(v.sd*v.sd,v.variance);close(v.mean+10,shift.mean);}
close(M.statistics([1,2,2,7]).mean,3);close(M.statistics([1,2,2,7]).median,2);close(M.statistics([0,2,4]).variance,8/3);
console.log(JSON.stringify({status:'PASS',checks,domains:'logs, roots, poles and tangent gaps'}));
