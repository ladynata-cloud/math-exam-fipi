'use strict';
const assert=require('node:assert/strict');
const C=require('../school/curriculum.js'),M=require('../school/math.js'),S=require('../school/state.js');
const oldIds=C.lessons.map(l=>l.id),old=oldIds.map(id=>JSON.stringify(M.generate(id,7)));
require('../school/algebra7.js').install(C,M);require('../school/secondary.js').install(C,M);
const rows=C.lessons.filter(l=>l.id.startsWith('sec-')),ids=C.lessons.map(l=>l.id);
assert.equal(rows.length,24);assert.equal(new Set(ids).size,ids.length);
const visited=new Set(),active=new Set();function walk(id){assert(C.byId[id],id);assert(!active.has(id),'prerequisite cycle: '+id);if(visited.has(id))return;active.add(id);C.byId[id].requires.forEach(walk);active.delete(id);visited.add(id);}ids.forEach(walk);
oldIds.forEach((id,i)=>assert.equal(JSON.stringify(M.generate(id,7)),old[i]));
const number=x=>Array.isArray(x)?x.map(number):x&&typeof x==='object'?x.n/x.d:x;
const fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):x&&typeof x==='object'?M.fmt(x):String(x);
const factorial=n=>n<2?1:n*factorial(n-1);
function solve(t){
 const p=t.prompt,id=t.audit.id,v=t.audit.v,N=(p.match(/−?\-?\d+/g)||[]).map(x=>Number(x.replace('−','-')));let m;
 switch(id){
  case 'linear': if(v===2)return N[1]===N[3]?'все':'нет';return (N[2]-N[1])/N[0];
  case 'line': if(v===2)return (N[3]-N[1])/(N[2]-N[0]);return N[0]*N[2]+N[1];
  case 'powers':return v===0?N[1]+N[3]:v===1?N[1]*N[2]:N[1]-N[3];
  case 'polynomial':m=p.match(/\(x ([+−]) (\d+)\)\(x ([+−]) (\d+)\)/);{const a=Number(m[2])*(m[1]==='−'?-1:1),b=Number(m[4])*(m[3]==='−'?-1:1);return [1,a+b,a*b];}
  case 'square':m=p.match(/\((\d+)x ([+−]) (\d+)\)/);{const a=+m[1],b=+m[3]*(m[2]==='−'?-1:1);return [a*a,2*a*b,b*b];}
  case 'difference':if(v===0)return Math.sqrt(Math.abs(N[0]));if(v===2)return 2;return (N[0]-Math.abs(N[1]))*(N[2]+N[3]);
  case 'system':if(v===2)return 0;return [(N[0]+N[1])/2,(N[0]-N[1])/2];
  case 'domain':return v===2?'нет':Math.abs(N.at(-1));
  case 'rational':if(v===0)return (N[1]+N[2])/N[0];if(v===1)return (N[1]-(N[2]-Math.abs(N[3])))/N[0];return N[1]/N[2];
  case 'root':return v===0?Math.sqrt(N[0]):v===1?Math.abs(N[0]):2;
  case 'quadratic':if(v===2)return 0;m=p.match(/x² ([+−]) (\d+)x ([+−]) (\d+)/);{const b=+m[2]*(m[1]==='−'?-1:1),c=+m[4]*(m[3]==='−'?-1:1);const roots=[];for(let x=-10;x<=10;x++)if(x*x+b*x+c===0)roots.push(x);return roots.length===1?roots[0]:roots;}
  case 'inequality':return N[0]<0?(p.split('. ')[0].includes('≤')?'≥':'>'):(p.split('. ')[0].includes('≤')?'≤':'<');
  case 'parabola':return v===2?N[2]:[Math.abs(N[1]),N[2]];
  case 'intervals':return v===0?'−':v===1?[-N[0],Math.abs(N[1])]:'нет';
  case 'arithmetic':{const a=N[0],d=N[1],n=N[2];if(v!==2)return a+Array(n-1).fill(d).reduce((s,x)=>s+x,0);return Array.from({length:n},(_,i)=>a+i*d).reduce((s,x)=>s+x,0);}
  case 'geometric':{const a=N[0],r=N[1],n=N[2];let x=a,sum=0;for(let i=0;i<n;i++){sum+=x;if(i<n-1)x*=r;}return v===2?sum:x;}
  case 'exponential':if(v===0)return N[0]**N[1];if(v===2)return '<';return Math.round(Math.log(N[1])/Math.log(N[0]));
  case 'logarithm':if(v===0)return Math.round(Math.log(N[1])/Math.log(N[0]));if(v===1)return -Math.round(Math.log(N[2])/Math.log(N[0]));return N[0]**N[2]+Math.abs(N[1]);
  case 'circle':if(v===2)return N[0]/180;return Math.round(v===0?Math.cos(N[0]*Math.PI/180):Math.sin(N[0]*Math.PI/180));
  case 'derivative':if(v===1)return (N[1]**2-N[0]**2)/(N[1]-N[0]);if(v===0)return 2*N[0];return 2*N[0]*N[2];
  case 'outcomes':{if(v===2)return 6/36;let count=0;for(let x=1;x<=6;x++)for(let y=1;y<=6;y++)if(x+y===N[0])count++;return v===0?count/36:count;}
  case 'conditional':{const red=N[0],blue=N[1],total=red+blue;let favorable=0,denom=0;for(let i=0;i<total;i++)for(let j=0;j<total;j++){if(v!==1&&i===j)continue;denom++;if(v===2?(i<red)!==(j<red):i<red&&j<red)favorable++;}return favorable/denom;}
  case 'statistics':{const xs=N.slice(0,5).sort((a,b)=>a-b);return v===0?xs[2]:v===1?xs.reduce((a,b)=>a+b)/5:xs[4]-xs[0];}
  case 'expectation':{if(v===2){const p=N[1]/N[2],mean=p;return p*(1-mean)**2+(1-p)*mean**2;}return N[0]*N[1]/N[2]-(v===1?N[4]:0);}
 }
}
let tested=0;
for(const l of rows){assert.equal(l.detail.length,3);assert(l.detail.every(p=>typeof p[1]==='string'&&p[1].length>0));for(let seed=0;seed<240;seed++){
 const t=M.generate(l.id,seed);assert(M.accepts(fmt(t.answer),t),l.id+' answer');for(const step of t.steps)assert(M.accepts(fmt(step.answer),step));const expected=solve(t),actual=number(t.answer);
 if(typeof expected==='number')assert(Math.abs(expected-actual)<1e-9,t.prompt+' expected '+expected+' actual '+actual);else assert.deepEqual(actual,expected,t.prompt);
 assert(!M.accepts('это не ответ',t));tested++;
}}
const s=S.blank();S.result(s,{skill:'fraction',mode:'check',correct:true,assisted:false,exposed:false,attempt:1,time:100,fingerprint:'old'});assert.deepEqual(S.validate(JSON.parse(JSON.stringify(s)),ids),s);
for(const assisted of [true,false]){S.result(s,{skill:rows[0].id,mode:'check',correct:true,assisted,exposed:false,attempt:1,time:100,fingerprint:'fresh'+assisted});}assert.equal(s.skills[rows[0].id].checks.length,1);
const storage={getItem:()=>'{damaged',setItem:()=>{throw Error('must not overwrite');}};assert(S.load(storage,ids).blocked);
console.log('PASS: '+tested+' secondary questions independently solved from prompts; prerequisite DAG; existing generators and storage evidence unchanged.');
