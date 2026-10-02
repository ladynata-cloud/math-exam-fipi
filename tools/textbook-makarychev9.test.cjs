'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),C=require('../school/curriculum'),M=require('../school/math'),S=require('../school/state');
require('../school/algebra7').install(C,M);require('../school/secondary').install(C,M);require('../school/core-content').install(C);require('../school/core-math').install(M);require('../school/paths').install(C);const E=require('../school/editions-content');E.install(C);require('../school/editions-math').install(M);const V6=require('../school/vilenkin6-lessons');V6.install(C,E);require('../school/vilenkin6-math').install(M);require('../school/vilenkin5-lessons').install(C,V6);require('../school/vilenkin5-math').install(M,C);
const oldIds=C.lessons.map(l=>l.id),Full=require('../school/makarychev9-lessons'),P=Full.install(C,E),Math9=require('../school/makarychev9-math'),Lab=require('../school/makarychev9-models');Math9.install(M,C);
const num=x=>Array.isArray(x)?x.map(num):x&&typeof x==='object'?x.n/x.d:x,fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):x&&typeof x==='object'?M.fmt(x):String(x),text=t=>t.answerFormat==='m9-pairs'?t.answer.map(p=>'('+p.map(fmt).join(';')+')').join(';'):fmt(t.answer);
function same(x,y,msg){if(typeof x==='number'&&typeof y==='number')assert(Math.abs(x-y)<1e-8,msg+': '+x+' != '+y);else assert.deepEqual(x,y,msg);}
const yes=b=>b?'да':'нет',range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
function inSet(s,x){return s.split('∪').some(part=>{if(part[0]==='{')return x===Number(part.slice(1,-1));let [lo,hi]=part.slice(1,-1).split(';').map(v=>v.includes('∞')?v.startsWith('-')?-Infinity:Infinity:Number(v));return (x>lo||x===lo&&part[0]==='[')&&(x<hi||x===hi&&part.at(-1)===']');});}
function oracle(k,t){const d=t.data,{a,b,c,h,v,sgn}=d,z=num(t.answer),eq=(x,y)=>same(x,y,k),sum=(n,f)=>range(0,n-1).reduce((s,i)=>s+f(i),0);
 switch(k){
 case 'root-square':eq(z,Math.sqrt((-a)**2));break;
 case 'root-simplify':eq(z*Math.sqrt(d.rad),Math.sqrt((a+b)**2*d.rad)-Math.sqrt(b*b*d.rad));break;
 case 'powers':eq(z,1/(a**b)*a**(b+c));break;
 case 'root-compare':eq(z,a*Math.sqrt(c)>Math.sqrt(d.right)?'>':'<');break;
 case 'negative-compare':eq(z,-Math.sqrt(a*a+c)>-a?'>':'<');break;
 case 'bounds':assert(z[0]<Math.sqrt(d.rad)&&Math.sqrt(d.rad)<z[1]&&z[1]-z[0]===1);break;
 case 'absolute-error':eq(z,Math.abs(d.exact-d.approx)/100);break;
 case 'rounding':eq(z,Math.round(d.raw/10)/100);break;
 case 'relative-error':eq(z/100*d.exact,d.error);break;
 case 'standard-form':eq(a*10**z,d.n);assert(a>=1&&a<10);break;
 case 'scale-ratio':eq(z,(a*b*10**(c+3))/(b*10**c));break;
 case 'time-units':eq(z,d.speed*d.minutes/60);break;
 case 'price-change':{const grown=d.price+d.price*d.p/100;eq(z,grown-grown*d.p/100);break;}
 case 'weighted-mixture':eq(z*(d.m1+d.m2)/100,d.m1*d.p1/100+d.m2*d.p2/100);break;
 case 'joint-work':case 'work-equation':eq(z/d.t1+z/d.t2,1);assert(z<Math.min(d.t1,d.t2));break;
 case 'error-bound':eq(a-z[0],c/10);eq(z[1]-a,c/10);break;
 case 'pi-approx':eq(z/(2*d.radius),num(d.error));break;
 case 'precision-choice':assert(.5*10**-z<=num(d.tolerance)&&.5*10**(1-z)>num(d.tolerance));break;
 case 'even-odd':{const f=x=>v===0?x*x+a:v===1?x*x*x+a*x:x*x+a*x;const even=[1,2,3].every(x=>f(-x)===f(x)),odd=[1,2,3].every(x=>f(-x)===-f(x));eq(z,even?'чётная':odd?'нечётная':'ни та ни другая');break;}
 case 'symmetry-value':eq(d.odd?-z:z,sgn*b);break;
 case 'symmetric-domain':eq(z,yes(range(-a,d.right).every(x=>-x>=-a&&-x<=d.right)));break;
 case 'domain':eq(z,a);break;
 case 'read-graph':eq(z-a*sgn*b,h);break;
 case 'inverse':eq(z*sgn*b,d.k);break;
 case 'parabola-value':eq(z,d.aa*(-a)**2);break;
 case 'parabola-coefficient':eq(z*b*b,d.aa*b*b);break;
 case 'parabola-range':eq(z,d.aa>0?'минимум':'максимум');break;
 case 'shift-vertex':eq(sgn*c*(z[0]-h)**2+sgn*a,z[1]);eq(z[0],h);break;
 case 'shift-points':eq(z[0]-a,b);eq(z[1]+c,b*b);break;
 case 'shift-zero':eq(z.length,2);z.forEach(x=>eq((x-h)**2-a*a,0));assert(z[0]!==z[1]);break;
 case 'quadratic-vertex':eq(d.aa*z[0]**2+d.bb*z[0]+d.cc,z[1]);eq(d.aa*(z[0]-1)**2+d.bb*(z[0]-1)+d.cc,d.aa*(z[0]+1)**2+d.bb*(z[0]+1)+d.cc);break;
 case 'complete-square':for(const x of [-3,0,4])eq((x+z[0])**2+z[1],x*x+2*h*x+h*h-a);break;
 case 'quadratic-intersections':z.forEach(x=>eq((x-d.r1)*(x-d.r2),0));eq(z.length,2);break;
 case 'rational-shift':eq(z[0]-h,0);eq(z[1],a);break;
 case 'rational-point':eq((z-a)*(d.xx-h),b*c);break;
 case 'hole':eq(z[0],a);eq(z[1],z[0]+a);break;
 case 'zero-product':eq(z.length,2);z.forEach(x=>eq(x*(x-a),0));assert(z.includes(0));break;
 case 'discriminant':eq(z.length,2);z.forEach(x=>eq(x*x+d.bb*x+d.cc,0));break;
 case 'biquadratic':case 'substitution':eq(z.length,4);assert(new Set(z).size===4);z.forEach(x=>{let t=k==='substitution'?x-h:x;eq(t**4-(d.u**2+d.w**2)*t*t+d.u*d.u*d.w*d.w,0);});break;
 case 'rational-domain':eq(z.filter(x=>x===a||x===-b).length,2);break;
 case 'rational-solve':assert(z!==a&&z!==-b);eq((a+1)/(z-a),a/(z+b));break;
 case 'extraneous':eq(z,0);assert(a===2*a-a);break;
 case 'motion-equation':eq(z+d.s/d.v2,d.s/d.v1);break;
 case 'rectangle-equation':eq(z*(z+b),d.width*d.length);assert(z>0);break;
 case 'quadratic-sign':case 'interval-product':case 'interval-rational':case 'interval-even':for(let x=-15;x<=15;x+=.25){const y=k==='quadratic-sign'?(x-d.lo)*(x-d.hi):k==='interval-product'?(x+a)*x*(x-b):k==='interval-rational'?x===-a?null:(x-b)/(x+a):(x+a)**2*(x-b);eq(inSet(z,x),y!==null&&(k==='quadratic-sign'?y<0:k==='interval-product'?y>0:y>=0));}break;
 case 'double-root':eq(z,v===0?h:v===1?'нет':'все');break;
 case 'no-roots-sign':eq(z,sgn>0?'все':'нет');assert((-4-h)**2+a>0);break;
 case 'grouping':eq(z.length,new Set(d.r).size);z.forEach(x=>eq(x**3-d.mid*x*x-a*a*x+d.mid*a*a,0));break;
 case 'reciprocal-equation':eq(z.length,2);z.forEach(x=>eq(x+1/x,(a*a+1)/a));break;
 case 'point-check':eq(z,yes(a+c*d.testY===d.sum));break;
 case 'circle-graph':eq(z,[h,b,Math.sqrt(a*a)]);break;
 case 'graph-intercept':eq(b*z[0],a*b);eq(a*z[1],a*b);break;
 case 'system-substitute':eq(z.length,2);z.forEach(([x,y])=>{eq(y,x*x-a*b);eq(y,(b-a)*x);});break;
 case 'system-sum-product':eq(z.length,2);z.forEach(([x,y])=>{eq(x+y,2*a+c);eq(x*y,a*(a+c));});break;
 case 'system-circle':eq(z.length,2);z.forEach(([x,y])=>{eq(x*x+y*y,25*c*c);eq(y,3*c);});break;
 case 'linear-system-count':{const a2=v===2?a+1:a,b2=v===0?b+c:b;eq(z,a===a2?b===b2?'бесконечно':0:1);break;}
 case 'linear-system-solve':eq(z[0]+z[1],a+b);eq(z[0]-z[1],a-b);break;
 case 'linear-parameter':eq(z,a);assert(b!==b+c);break;
 case 'rectangle-system':eq(2*(z[0]+z[1]),2*(2*a+b));eq(z[0]*z[1],a*(a+b));assert(z[0]>z[1]&&z[1]>0);break;
 case 'two-numbers':case 'symmetric-system':eq(z[0]+z[1],2*a+c);eq(z[0]**2+z[1]**2,a*a+(a+c)**2);assert(z[0]<z[1]);break;
 case 'river-system':eq(z[0]+z[1],d.boat+c);eq(z[0]-z[1],d.boat-c);break;
 case 'halfplane':eq(z,yes(a+b<d.limit));break;
 case 'disk':eq(z,yes(Math.hypot(d.xx,d.yy)<=d.radius));break;
 case 'parabola-region':eq(z,yes(d.yy>h*h));break;
 case 'intersection-regions':eq(z,yes(d.xx>=0&&b>=0&&d.xx+b<=d.limit));break;
 case 'integer-region':{let count=0;for(let x=0;x<=a;x++)for(let y=0;y<=a;y++)if(x+y<=a)count++;eq(z,count);break;}
 case 'bounded-maximum':eq(z,Math.max(...range(0,a).flatMap(x=>range(0,a-x).map(y=>b*x+y))));break;
 case 'difference-squares-system':eq(z[0]+z[1],2*a+b);eq(z[0]**2-z[1]**2,(2*a+b)*b);break;
 case 'system-zero-factor':eq(z.length,4);eq(new Set(z.map(x=>x.join(','))).size,4);z.forEach(([x,y])=>{eq(x*x-y*y,0);eq(x*x+y*y,2*a*a);});break;
 case 'sequence-formula':eq(z,a*b*b-c);break;
 case 'sequence-recursion':{let result=a;for(let i=1;i<d.index;i++)result=result*2-1;eq(z,result);break;}
 case 'sequence-membership':eq(z,yes(range(1,100).map(n=>a*n+c).includes(d.target)));break;
 case 'arithmetic-term':eq(z,h+sum(a-1,()=>d.diff));break;
 case 'arithmetic-difference':eq(d.ai+(d.j-d.i)*z,d.aj);break;
 case 'arithmetic-index':assert(Number.isInteger(z)&&z>0);eq(h+sum(z-1,()=>d.diff),d.target);break;
 case 'arithmetic-sum':eq(z,sum(d.index,i=>h+i*d.diff));break;
 case 'arithmetic-slice':eq(z,range(d.i,d.j).reduce((s,i)=>s+h+(i-1)*c,0));break;
 case 'arithmetic-story':eq(z,sum(d.index,i=>d.first+i*d.diff));break;
 case 'geometric-term':{let r=a;for(let i=1;i<b;i++)r*=d.ratio;eq(z,r);break;}
 case 'geometric-ratio':eq(z/a,(a*b)/(a*b*b));break;
 case 'geometric-decay':{let r=a*100;for(let i=0;i<c;i++)r-=r/2;eq(z,r);break;}
 case 'geometric-sum':eq(z,sum(b,i=>a*d.ratio**i));break;
 case 'geometric-one':eq(z,sum(b,()=>d.first));break;
 case 'geometric-alternating':eq(z,sum(b,i=>d.first*(-1)**i));break;
 case 'induction-base':eq(z,sum(a,i=>2*i+1));break;
 case 'induction-step':eq(z,(a+1)**2-a*a);break;
 case 'induction-apply':eq(z,range(a,a+b-1).reduce((s,i)=>s+2*i+1,0));break;
 default:throw Error('Missing oracle '+k);
 }
}
assert.equal(P.ids.length,93);assert.equal(P.coreIds.length,78);assert.equal(P.units.length,31);assert(P.units.every(u=>u.ids.length===3));assert.equal(new Set(C.lessons.map(l=>l.id)).size,C.lessons.length);assert(oldIds.every(id=>C.byId[id]));
const stack=new Set(),visited=new Set();function visit(id){assert(C.byId[id],id);if(visited.has(id))return;assert(!stack.has(id),'Cycle '+id);stack.add(id);C.byId[id].requires.forEach(visit);stack.delete(id);visited.add(id);}C.lessons.forEach(l=>visit(l.id));
let count=0;for(const id of P.ids){const l=C.byId[id];assert(l.worked.length===3&&l.explanation.length>40&&l.reflect.length===2);[...l.requires,...l.related].forEach(x=>assert(C.byId[x]));for(let seed=0;seed<140;seed++){const t=M.generate(id,seed);oracle(l.fullKey,t);assert(t.steps.length>=2,id);for(const part of [...t.steps,t]){assert(M.accepts(text(part),part),id+' rejects '+text(part));assert(!M.accepts('не знаю',part),id);assert(!/NaN|undefined|Infinity/.test(part.prompt),id);assert(!/NaN|undefined|Infinity/.test(text(part)),id);}count++;}}
// Alternate valid pair order is accepted; lost roots, duplicate roots and swapped coordinates are not.
const pairs={answer:[[1,2],[3,4]],answerFormat:'m9-pairs'};assert(M.accepts('(3;4); (1;2)',pairs));assert(!M.accepts('(1;2);(1;2)',pairs));assert(!M.accepts('(2;1);(4;3)',pairs));assert(!M.accepts('(1;2)',pairs));assert(!M.accepts('garbage (1;2);(3;4)',pairs));
const intervals={answer:'(-∞;-2)∪[3;+∞)',answerFormat:'m9-set'};assert(M.accepts('[3;inf) U (-inf; -2)',intervals));assert(!M.accepts('(-inf;-2]U[3;inf)',intervals));assert(!M.accepts('(-inf;-2)',intervals));
let frames=0;for(const a of [-4,-1,0,1,4])for(const h of [-6,0,6])for(const k of [-6,0,6])for(const x of [-8,-1,0,1,8]){same(Lab.value({a,h,k,type:'parabola'},x),a*x*x-2*a*h*x+a*h*h+k);same(Lab.value({a,h,k,type:'inverse'},x),x===h?null:a/(x-h)+k);frames++;}
for(const type of ['arithmetic','geometric'])for(const first of [-5,0,5])for(const change of [-3,0,1,3])for(const count of [2,5,8]){const s=Lab.sequence({type,first,change,count});assert.equal(s.values.length,count);s.values.slice(1).forEach((x,i)=>same(x,type==='arithmetic'?s.values[i]+change:s.values[i]*change));same(s.sum,s.values.reduce((a,b)=>a+b,0));frames++;}
for(const type of ['product','quotient','even'])for(const left of [-8,0])for(const right of [1,8])for(const x of [left-1,left,(left+right)/2,right,right+1]){const z=Lab.signs({type,left,right},x);if(type==='quotient'&&x===right)assert.equal(z,null);else assert(Number.isFinite(z));frames++;}
const state=S.blank();S.result(state,{skill:'m9-01',mode:'check',correct:true,attempt:1,assisted:false,exposed:false,time:1,fingerprint:'legacy'});const store={getItem(){return JSON.stringify(state);},setItem(){throw Error('Unexpected write');}};const restored=S.load(store,C.lessons.map(x=>x.id));assert(!restored.blocked);assert.equal(restored.state.skills['m9-01'].checks.length,1);
const board=JSON.parse(fs.readFileSync('trainers/board-picker-data.json'));for(const id of P.ids)assert(board.entries.some(e=>e.href.endsWith('#lesson/'+id)));assert.equal(P.units.filter(u=>u.extra).length,5);
console.log(`PASS Makarychev9: ${count} independent final-answer checks; guided answer acceptance; ${frames} lab frames; 93 lessons / 31 points; prerequisite DAG; legacy progress; board catalog.`);
