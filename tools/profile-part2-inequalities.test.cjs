'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {lessons,families}=require('../trainers/ege-profile/inequalities/lessons.js');
const is=(a,b)=>Math.abs(a-b)<1e-12;
function original(t,x){
 const p=t.params;
 switch(t.family){
 case 'rational':return x!==p.b&&(x-p.a)/(x-p.b)>=0;
 case 'repeated':return x!==p.b&&(x-p.a)**2/(x-p.b)<=0;
 case 'exponential':{const v=p.base**(2*x)-(p.base**p.l+p.base**p.r)*p.base**x+p.base**(p.l+p.r);return v<0||((x===p.l||x===p.r)&&Math.abs(v)<1e-10);}
 case 'fixed-log':if(x<=p.a)return false;{const v=Math.log(x-p.a)/Math.log(p.base);return v<p.k||is(v,p.k);}
 case 'variable-log':{const b=x-p.a,arg=p.c-x;if(!(b>0&&b!==1&&arg>0))return false;return Math.log(arg)/Math.log(b)>0;}
 case 'radical':return x+p.a>=0&&Math.sqrt(x+p.a)<=x-p.b;
 default:throw Error(t.family);
 }
}
function selected(points,answer,x){const at=points.indexOf(x);if(at!==-1)return answer.includes('p'+at);const next=points.findIndex(p=>p>x);return answer.includes('s'+(next===-1?points.length:next));}
function verifyAxis(f,predicate,label){
 const probes=[];
 for(let i=0;i<=f.points.length;i++)probes.push(i===0?f.points[0]-2:i===f.points.length?f.points.at(-1)+2:(f.points[i-1]+f.points[i])/2);
 probes.push(...f.points);
 for(const x of probes)assert.equal(selected(f.points,f.correct,x),predicate(x),label+' at '+x);
}
let dense=0,axisChecks=0;
assert.equal(lessons.length,18);assert.equal(families.length,6);
assert.equal(new Set(lessons.map(t=>t.id)).size,18);assert.equal(new Set(lessons.map(t=>t.storageKey)).size,18);
for(const t of lessons){
 assert.equal(lessons.filter(l=>l.family===t.family).length,3);
 assert(t.steps.length>=6&&t.steps.length<=10,t.id);
 assert(t.problemHtml.includes('<math'));assert(t.solvedDomainHtml.includes('Система'));
 assert(t.steps.every(s=>s.body&&s.record&&s.hint&&s.fields.length));
 const p=t.params;
 let probes=Array.from({length:6001},(_,i)=>-12+i/200);
 for(const q of t.points)probes.push(q,q-1e-7,q+1e-7);
 for(const x of probes){assert.equal(selected(t.points,t.solution,x),original(t,x),t.id+' original inequality at x='+x);dense++;}
 for(const s of t.steps)for(const f of s.fields){
  assert(f.id&&f.label&&f.correct!==undefined);
  if(f.kind==='choice')assert(f.options.some(o=>o.id===f.correct));
  if(f.kind==='number')assert(Number.isFinite(Number(f.correct)));
  if(f.kind!=='axis')continue;
  assert(f.points.every((v,i)=>Number.isFinite(v)&&(i===0||v>f.points[i-1])));
  const allowed=new Set([...f.points.map((_,i)=>'p'+i),...Array.from({length:f.points.length+1},(_,i)=>'s'+i)]);
  for(const token of f.correct)assert(allowed.has(token),t.id+': invalid axis token');
  for(const r of f.refs)for(const token of r.tokens)assert(allowed.has(token),t.id+': invalid reference token');
  let oracle;
  if(f.id==='final'||f.id==='sign-axis'||f.id==='case1'||f.id==='case2')oracle=x=>original(t,x);
  else if(t.family==='repeated'&&f.id==='negative')oracle=x=>x<p.b;
  else if(t.family==='exponential'&&f.id==='lower')oracle=x=>x>=p.l;
  else if(t.family==='fixed-log'&&f.id==='domain-axis')oracle=x=>x>p.a;
  else if(t.family==='variable-log'&&f.id==='domain-axis')oracle=x=>x>p.a&&x<p.c&&x!==p.a+1;
  else if(t.family==='radical'&&f.id==='quadratic')oracle=x=>(x-p.b)**2-x-p.a>=0;
  else assert.fail(t.id+': axis needs an independent check '+f.id);
  verifyAxis(f,oracle,t.id+'/'+f.id);axisChecks++;
  if(f.id==='final'&&f.refs.length){
   for(const token of allowed)assert.equal(f.correct.includes(token),f.refs.every(r=>r.tokens.includes(token)),t.id+': final intersection '+token);
  }
 }
 // Intermediate numeric answers are checked from the original problem's parameters.
 const numbers={};for(const s of t.steps)for(const f of s.fields)if(f.kind==='number')numbers[f.id]=Number(f.correct);
 const expected={
  rational:{excluded:p.b,zero:p.a},repeated:{excluded:p.b,zero:p.a},
  exponential:{sum:p.base**p.l+p.base**p.r,product:p.base**(p.l+p.r),left:p.base**p.l,right:p.base**p.r},
  'fixed-log':{domain:p.a,power:p.base**p.k,boundary:p.a+p.base**p.k},
  'variable-log':{'base-zero':p.a,'base-one':p.a+1,'arg-zero':p.c,upper:p.c-1},
  radical:{domain:-p.a||0,right:p.b,coefficient:2*p.b+1,constant:p.b*p.b-p.a,sum:p.l+p.r,product:p.l*p.r}
 }[t.family];
 assert.deepEqual(numbers,expected,t.id+' intermediate numeric answers');
 if(t.family==='radical'){assert.equal(p.l+p.r,2*p.b+1);assert.equal(p.l*p.r,p.b*p.b-p.a);assert(p.l<p.b&&p.b<p.r);}
}
// All authored local links and shared runtime dependencies must resolve.
const root=path.resolve(__dirname,'..');
for(const file of ['index.html','lesson.html']){
 const full=path.join(root,'trainers/ege-profile/inequalities',file),html=fs.readFileSync(full,'utf8');
 for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g))if(!url.startsWith('#'))assert(fs.existsSync(path.resolve(path.dirname(full),url.split(/[?#]/)[0])),file+': broken link '+url);
}
console.log('PROFILE_PART2_INEQUALITIES_MATH_OK',JSON.stringify({lessons:lessons.length,families:families.length,steps:lessons.reduce((s,l)=>s+l.steps.length,0),denseComparisons:dense,axes:axisChecks}));
