const assert=require('node:assert/strict');
const C=require('../school/curriculum'),M=require('../school/math'),S=require('../school/state');
require('../school/algebra7').install(C,M);require('../school/secondary').install(C,M);
const oldIds=C.lessons.map(l=>l.id),before=S.blank();
S.result(before,{skill:'fraction',mode:'check',correct:true,assisted:false,exposed:false,attempt:1,time:100,fingerprint:'old-record'});
const Core=require('../school/core-content');Core.install(C);require('../school/core-math').install(M);require('../school/paths').install(C);
const Models=require('../school/core-models');
const ids=C.lessons.map(l=>l.id),value=x=>typeof x==='object'?x.n/x.d:x,values=x=>Array.isArray(x)?x.map(value):value(x),fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):typeof x==='object'?M.fmt(x):String(x);
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const ints=(lo,hi,p)=>Array.from({length:hi-lo+1},(_,i)=>lo+i).filter(p);
assert.equal(Core.rows.length,48);assert.equal(ids.length,152);assert.equal(new Set(ids).size,ids.length);
assert.deepEqual(S.validate(JSON.parse(JSON.stringify(before)),ids),before);
let checks=0;
for(const row of Core.rows){const id='core-'+row[0],l=C.byId[id];assert.equal(l.detail.length,3);l.requires.forEach(x=>assert(C.byId[x],x));
 for(let seed=0;seed<240;seed++){
  const t=M.generate(id,seed),d=t.data,{a,b,c,k,x,v}=d,z=values(t.answer),arr=Array.isArray(z)?z:[z];
  assert(M.accepts(fmt(t.answer),t),id);t.steps.forEach(st=>assert(M.accepts(fmt(st.answer),st),id));assert(t.steps.length>=2||id==='core-radical-equation');
  switch(d.id){
   case 'brackets':for(const n of [-7,0,9])close(z[0]*n+z[1],a*n-(b*n-c)+d.d*n);break;
   case 'factor':for(const n of [-8,-1,0,3])close(c*n*(z[0]*n+z[1]),a*c*n*n+b*c*n);break;
   case 'grouping':for(const n of [-2,0,4])for(const y of [-3,1])close((n+z[0])*(y+z[1]),n*y+b*n+a*y+a*b);break;
   case 'cubes':for(const n of [-9,-1,0,4,8])close((n+d.sg*b)*(n*n+z[0]*n+z[1]),n**3+d.sg*b**3);break;
   case 'substitution':close(z[1],z[0]+b);close(z[0]+z[1],d.total);assert(t.prompt.includes('= '+d.total));break;
   case 'elimination':close(a*z[0]+z[1],d.u);close(a*z[0]-z[1],d.w);break;
   case 'work':close(z/d.hours[0]+z/d.hours[1],d.gardens);for(const h of d.hours)assert(t.prompt.includes('за '+h+' ч'));assert(t.prompt.includes(d.gardens+' огород'));break;
   case 'mixture':close(z*(d.mass[0]+d.mass[1]),d.mass[0]*d.p[0]+d.mass[1]*d.p[1]);assert(z>=Math.min(...d.p)&&z<=Math.max(...d.p));break;
   case 'fraction-reduce':close(z[0],(d.at*d.at-b*b)/(d.at-b));assert.equal(z[1]-b,0);assert(t.prompt.includes('x = '+d.at));break;
   case 'fraction-add':close(z,a/c+d.sign*b/(c+1));break;
   case 'fraction-divide':close(z[0],(a/(d.at-b))/((d.at-c)/(d.at-b)));assert.deepEqual(z.slice(1),ints(0,10,n=>n===b||n===c));break;
   case 'rational-equation':assert.notEqual(z,b);close(a/(z-b),d.right);break;
   case 'radical-extract':close(z*Math.sqrt(d.rad),Math.sqrt(a*a*d.rad));assert(z>=0);break;
   case 'radical-product':close(z,Math.sqrt(a*a*d.rad)*Math.sqrt(b*b*d.rad));break;
   case 'radical-equation':if(d.rhs<0)assert.equal(z,'нет');else{assert(z+b>=0);close(Math.sqrt(z+b),d.rhs);}break;
   case 'viete':assert.deepEqual(z,ints(-20,20,n=>n*n+(a-b)*n-a*b===0));break;
   case 'quadratic-general':assert.deepEqual(z,ints(-20,20,n=>d.coef[0]*n*n+d.coef[1]*n+d.coef[2]===0));break;
   case 'inequality-system':assert.deepEqual(z,ints(-20,20,n=>(v===1?n>-b:n>=-b)&&n<a));break;
   case 'quadratic-inequality':assert.deepEqual(z,ints(-20,20,n=>d.strict?(n+b)*(n-a)<0:(n+b)*(n-a)<=0));break;
   case 'rational-inequality':assert.deepEqual(z,ints(-20,20,n=>n!==a&&(n+b)/(n-a)<=0));break;
   case 'absolute-equation':assert.deepEqual(arr,ints(-20,20,n=>Math.abs(n-x)===d.radius));break;
   case 'absolute-inequality':assert.deepEqual(z,ints(-20,20,n=>Math.abs(n-x)<=c));break;
   case 'nonlinear-system':{const pairs=ints(-20,20,n=>n*n===b*b).map(n=>[n,n*n]);assert.deepEqual(z,[pairs.reduce((s,p)=>s+p[0],0),pairs.reduce((s,p)=>s+p[1],0)]);break;}
   case 'inverse':close(z*d.at,a*b);break;
   case 'transform':assert.equal(z[0],d.h);assert.equal(z[1],b);for(const n of [z[0]-1,z[0]+1])assert.equal(Math.sign(k*(n-d.h)**2+b-z[1]),Math.sign(k));break;
   case 'sequence':{let n=d.start;for(let i=0;i<(d.geometric?c:c-1);i++)n=d.geometric?n*2:n+b;assert.equal(z,n);break;}
   case 'power-domain':close(z,Math.pow(d.base,d.exp/2));break;
   case 'exp-equation':close(Math.pow(a,z+b),Math.pow(a,d.target));break;
   case 'exp-inequality':for(const n of [-10,0,b,b+1,10])assert.equal(z==='>'?n>b:n<b,Math.pow(d.small?1/a:a,n)>Math.pow(d.small?1/a:a,b));break;
   case 'log-domain':assert(z-b>0);assert(z-1-b<=0);break;
   case 'log-equation':close(Math.log(z-b)/Math.log(a),c);break;
   case 'log-inequality':{const valid=n=>n>b&&(d.small?Math.log(n-b)/Math.log(1/a)<=1+1e-10:Math.log(n-b)/Math.log(a)>=1-1e-10);assert(valid(z));assert(!valid(z-1));break;}
   case 'trig-identity':close(z*z+(d.sinN/d.den)**2,1);assert.equal(Math.sign(z),[2,3].includes(d.quadrant)?-1:1);break;
   case 'trig-equation':assert.deepEqual(z,ints(0,360,n=>Math.abs((d.cos?Math.cos:Math.sin)(n*Math.PI/180)-d.trigValue)<1e-9));break;
   case 'trig-graph':assert.equal(z[0],a);for(const t0 of [0,.3,2])close(a*Math.sin(b*t0),a*Math.sin(b*(t0+z[1]*Math.PI)));assert(z[1]>0);break;
   case 'derivative-rule':{const f=n=>a*n*n+k*n+b,h=.0001;close(z,Math.round((f(x+h)-f(x-h))/(2*h)*1e7)/1e7);break;}
   case 'extrema':{const samples=Array.from({length:((d.hi-d.lo)*100)+1},(_,i)=>d.lo+i/100).map(n=>(n-d.h)**2+b);close(z,Math.min(...samples));break;}
   case 'integral':{let sum=0;for(let i=0;i<1000;i++)sum+=(a*((i+.5)*c/1000)+b)*c/1000;close(z,sum);break;}
   case 'product-rule':{let total=0;for(let i=0;i<a;i++)for(let j=0;j<b;j++)for(let h=0;h<c;h++)total++;assert.equal(z,total);break;}
   case 'permutations':{function arrangements(pool){if(!pool.length)return 1;return pool.reduce((s,n)=>s+arrangements(pool.filter(x=>x!==n)),0);}assert.equal(z,arrangements(ints(1,c,()=>true)));break;}
   case 'combinations':{const pairs=new Set();for(let i=0;i<d.n;i++)for(let j=0;j<d.n;j++)if(i!==j)pairs.add(d.ordered?[i,j].join(','):[Math.min(i,j),Math.max(i,j)].join(','));assert.equal(z,pairs.size);break;}
   case 'frequency':close(z*d.total,d.success);break;
   case 'union':{const A=new Set(ints(1,d.A,()=>true)),B=new Set([...ints(1,d.both,()=>true),...ints(d.A+1,d.A+d.B-d.both,()=>true)]);assert.equal(B.size,d.B);close(z,new Set([...A,...B]).size/20);break;}
   case 'independence':{let good=0;for(let i=0;i<10;i++)for(let j=0;j<10;j++)if(d.atLeast?(i<a||j<b):(i<a&&j<b))good++;close(z,good/100);break;}
   case 'binomial':{let good=0,total=a**c;for(let n=0;n<total;n++){let r=n,successes=0;for(let j=0;j<c;j++){if(r%a===0)successes++;r=Math.floor(r/a);}if(successes===1)good++;}close(z,good/total);break;}
   case 'variance':{const mean=d.values.reduce((s,n)=>s+n,0)/d.values.length;close(z,d.values.reduce((s,n)=>s+(n-mean)**2,0)/d.values.length);break;}
   case 'weighted':{const points=[...Array(d.n[0]).fill(d.means[0]),...Array(d.n[1]).fill(d.means[1])];close(z,points.reduce((s,n)=>s+n,0)/points.length);break;}
   case 'chart':close(d.before*(1+z/100),d.after);break;
   default:throw Error('No independent oracle '+d.id);
  }
  checks++;
 }
 const variants=new Set(Array.from({length:240},(_,seed)=>S.fingerprint(id,M.generate(id,seed))));assert(variants.size>=4,id+' insufficient unseen variants');
 const config=Models.config(row[4]);for(let p=config.min;p<=config.max;p+=config.step){const ex=Models.investigate(row[0],row[4],p,M);assert(ex.caption&&ex.question&&ex.svg);assert(!/NaN|Infinity/.test(ex.svg));assert(M.equal(fmt(ex.target),ex.target));}
}
// Every path references real lessons; every new lesson is reachable, with no prerequisite cycles.
assert.equal(C.pathById.constructor,undefined);assert.equal(C.pathById.__proto__,undefined);
const covered=new Set(C.paths.flatMap(p=>p.ids));for(const r of Core.rows)assert(covered.has('core-'+r[0]),r[0]);
for(const p of C.paths){assert.equal(p.diagnostic.length,8);for(const id of [...p.ids,...p.diagnostic])assert(C.byId[id],id);}
function visit(id,stack=[]){assert(!stack.includes(id),'Prerequisite cycle '+[...stack,id]);C.byId[id].requires.forEach(next=>visit(next,[...stack,id]));}ids.forEach(id=>visit(id));
// All old and new data survives; hints, retries, repeats never grant independent successes.
const state=JSON.parse(JSON.stringify(before));for(const [i,event] of [{assisted:true,exposed:false,attempt:1},{assisted:false,exposed:true,attempt:1},{assisted:false,exposed:false,attempt:2}].entries())S.result(state,{skill:'core-work',mode:'check',correct:true,time:200+i,fingerprint:'f'+i,...event});
assert.equal(state.skills['core-work'].checks.length,0);assert.deepEqual(S.validate(state,ids),state);assert.equal(state.skills.fraction.checks.length,1);
console.log(`PASS ${checks} final answers checked by independent relations/enumeration; 48 lesson contracts, all model parameter values, 9 routes, prerequisites and compatible progress.`);
