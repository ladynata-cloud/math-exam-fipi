'use strict';
const assert=require('node:assert/strict');
const C=require('../school/curriculum'),M=require('../school/math'),S=require('../school/state');
require('../school/algebra7').install(C,M);require('../school/secondary').install(C,M);require('../school/core-content').install(C);require('../school/core-math').install(M);require('../school/paths').install(C);
const E=require('../school/editions-content'),D=require('../school/editions-models');E.install(C);require('../school/editions-math').install(M);
const value=x=>Array.isArray(x)?x.map(value):typeof x==='object'?x.n/x.d:x;
const fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):typeof x==='object'?M.fmt(x):String(x);
const close=(x,y)=>assert(Math.abs(x-y)<1e-8,`${x} != ${y}`);
const ints=(a,b,p)=>Array.from({length:b-a+1},(_,i)=>a+i).filter(p);
let checks=0,models=0;
for(const l of C.lessons.filter(l=>l.edition)){
 assert(l.detail.length>=3);l.requires.forEach(id=>assert(C.byId[id]));const fingerprints=new Set();
 for(let seed=0;seed<180;seed++){
 const t=M.generate(l.id,seed),d=t.data,z=value(t.answer),{a,b,c,x,v,n}=d;
 for(const s of [t,...t.steps])assert(M.accepts(s.answerFormat==='prime-factors'?s.answer.join('*'):fmt(s.answer),s),l.id+' unenterable answer');
 fingerprints.add(S.fingerprint(l.id,t));assert(t.steps.length>=2);
 if(d.type==='v6')switch(n){
 case 1:if(v===0)close(z*3,d.values.reduce((s,n)=>s+n,0));else close(z+((a+b)*c-a),(a+b)*c);break;
 case 2:if(v===0)close(z+d.total*d.p/100,d.total);if(v===1)close(z*d.p/100,a*d.p);if(v===2)close(d.total*(1+z/100),d.total+a*d.p);break;
 case 3:close(z/(a*10),[20,25,40][v]/100);break;
 case 4:close(z*2+[40,55,70][v],180);break;
 case 5:close(z+(a+b)+(b+c)-b,a+b+2*c);break;
 case 6:assert.equal(z.reduce((p,n)=>p*n,1),d.val);for(const q of z)assert.equal(ints(1,q,k=>q%k===0).length,2);break;
 case 7:assert.equal(z,Math.max(...ints(1,Math.min(d.A,d.B),k=>d.A%k===0&&d.B%k===0)));break;
 case 8:assert.equal(z,ints(1,d.A*d.B,k=>k%d.A===0&&k%d.B===0)[0]);break;
 case 9:assert.equal(z[0]%(a*b),0);assert.equal(z[0]%(b*c),0);close(z[1]/z[0],1/(a*b));close(z[2]/z[0],1/(b*c));break;
 case 10:case 11:case 12:case 15:{const u=value(d.u),w=value(d.w);close(z,d.op==='+'?u+w:d.op==='−'?u-w:d.op==='×'?u*w:u/w);break;}
 case 13:close(z+a*c,a*b*c);break;case 16:close(z/b,a*c);break;
 case 14:case 36:close(z,(v===1?-a:a)*b+(v===1?-a:a)*(100-b));break;
 case 17:close(z/c,1/a+1/b);break;
 case 18:close(z[0]+z[1],a*(b+c));close(z[0]/z[1],b/c);break;
 case 19:close(z/(b*c),a/b);break;
 case 20:if(v===1)close(a*b*z,a*b*c);else close(z/c,b*10);break;
 case 21:close(z*100,b*a*1000);break;
 case 22:assert.deepEqual(z,v===0?[-x,c]:v===1?[x,-c]:[-x,-c]);break;
 case 23:close(z,v===0?3.14*a*a:2*3.14*a);break;
 case 24:close(z,-a);break;case 25:close(z+d.w,0);break;case 26:close(z,Math.abs(-a-b));break;
 case 27:assert(z==='<');assert(-a*b<-a);break;case 28:close(-a+z,b);break;
 case 29:case 30:case 31:close(z,d.u+d.w);break;case 32:close(z+d.w,d.u);break;
 case 33:close(z,d.u*d.w);break;case 34:close(z*d.w,-a*b);break;case 35:close(z,-a/10**(v+1));break;
 case 37:for(const probe of [-3,0,5])close(z[0]*probe+z[1],(v===1?-a:a)*(b*probe-c));break;
 case 38:close(z,(v===1?-a:a)*b);break;
 case 39:for(const probe of [-3,0,5])close(z*probe,(v===1?-a:a)*probe+b*probe-c*probe);break;
 case 40:close(a*z+b,a*x+b);break;
 case 41:assert.equal(z,(v===0?90:40+a)===90?'да':'нет');break;
 case 42:assert.equal(z,v===2?'нет':'да');break;
 case 43:close(z[0]-x,a);close(z[1]-c,-b);break;
 case 44:close(z,d.points.slice(1).reduce((s,p,i)=>s+(p[1]===d.points[i][1]?p[0]-d.points[i][0]:0),0));break;
 default:throw Error(l.id+' missing oracle');
 }else switch(n){
 case 1:close(z*Math.sqrt(d.rad),Math.sqrt(a*a*d.rad)+Math.sqrt(b*b*d.rad));break;
 case 2:assert.equal(z,v===1?(-Math.sqrt(d.rad)<-a?'<':'>'):(Math.sqrt(d.rad)>a?'>':'<'));break;
 case 3:close(z/100,Math.abs(d.exact-d.approx)/Math.abs(d.exact));break;
 case 4:close(z[0]*10**z[1],(a*10+b)*10**d.exponent);assert(z[0]>=1&&z[0]<10);break;
 case 5:assert(z/d.price*d.per>=d.area);assert((z/d.price-1)*d.per<d.area);break;
 case 6:close(z[0],3.14*a*a);close(z[1],3.15*a*a);break;
 case 7:{const f=x=>v===0?a*x*x+b:v===1?a*x**3-b*x:a*x*x+b*x;const probes=[-3,-2,0,1,4];const even=probes.every(x=>f(x)===f(-x)),odd=probes.every(x=>f(-x)===-f(x));assert.equal(z,even?'чётная':odd?'нечётная':'ни та ни другая');const st=t.steps[1];assert.equal(st.answer,v===0?0:v===1?b:-b);break;}
 case 8:if(v===0){assert.equal(z,b);assert(Math.abs(a-a)+b===z);}else assert.equal(z,a);break;
 case 9:case 10:case 11:{const f=x=>d.k*x*x-2*d.k*d.h*x+d.k*d.h*d.h+d.j;close(z[1],f(z[0]));close(f(z[0]-1),f(z[0]+1));break;}
 case 12:for(const t of [-12,-8,12])close(z[0]+z[1]/(t-z[2]),(b*t+(a-b*x))/(t-x));break;
 case 13:assert.deepEqual(z,ints(-20,20,k=>k*(k-d.p)*(k+d.r)===0));break;
 case 18:assert.deepEqual(z,ints(-20,20,k=>k**4-(d.p*d.p+d.r*d.r)*k*k+d.p*d.p*d.r*d.r===0));break;
 case 14:if(z==='нет')assert.equal(d.root,d.h);else{assert.notEqual(z,d.h);close((z*z-d.h*d.h)/(z-d.h),d.root+d.h);}break;
 case 15:assert(z>b);close(d.distance/(z-b)-d.distance/z,b*c);break;
 case 16:case 17:assert.deepEqual(z,ints(-25,25,k=>{if(d.den&&k===d.hi)return false;const f=d.den?(k-d.lo)/(k-d.hi):(k-d.lo)*(k-d.hi);return d.strict?f<0:f<=0;}));break;
 case 19:assert.equal(z,a*a+b*b===a*a+b*b+(v===1?1:0)?'да':'нет');break;
 case 20:{const roots=ints(-20,20,k=>k*k===(d.p+d.r)*k-d.p*d.r);assert.deepEqual(z,roots.flatMap(k=>[k,k*k]));break;}
 case 21:{const A=v===2?2*a+1:2*a,B=2*b,T=2*c+(v===1?1:0),det=a*B-b*A;assert.equal(z,det!==0?'одно':a*T===c*A?'бесконечно много':'нет');break;}
 case 22:close(2*(z[0]+z[1]),2*(2*a+b));close(z[0]*z[1],a*(a+b));break;
 case 23:case 24:assert.equal(z,(d.py>=d.px+d.threshold&&(n===23||d.px**2+d.py**2<=b*b))?'да':'нет');break;
 case 25:close((z[0]-z[1])*(z[0]+z[1]),0);close(z[0]+z[1],a);break;
 case 26:{let value=d.start;for(let i=1;i<d.count;i++)value+=d.diff;close(z,value);break;}
 case 27:close(z,d.start+9*d.diff);break;
 case 28:{let term=d.start,sum=0;for(let i=0;i<d.count;i++){sum+=term;term+=d.diff;}close(z,sum);break;}
 case 29:case 30:{let term=d.start,sum=0;for(let i=0;i<d.count;i++){sum+=term;if(i<d.count-1)term*=d.ratio;}close(z,n===29?term:sum);break;}
 case 31:if(v===0){for(let k=1;k<10;k++)close(k*k+z[0]*k+z[1],(k+1)**2);}else close(z,ints(a+1,a+b,()=>true).reduce((s,k)=>s+2*k-1,0));break;
 default:throw Error(l.id+' missing oracle');
 }
 if(t.model.kind==='edition'&&seed<3){const specs=D.spec(t.model),p=Object.fromEntries(specs.map(f=>[f.key,f.value]));for(const f of specs)for(const value of [f.min,f.value,f.max]){p[f.key]=value;const r=D.investigate(t.model,p);assert(r.question&&r.caption&&r.target!==undefined);assert(!/NaN|Infinity|undefined/.test(r.svg),l.id);models++;}}
 checks++;
 }
 // Fixed proof questions are supplemented by generated applications.
 assert(fingerprints.size>=3,l.id+' insufficient variations');
}
assert.equal(E.v6.length,44);assert.equal(E.m9.length,31);assert.equal(C.pathById.vilenkin6.ids.length,44);assert.equal(C.pathById.makarychev9.ids.length,31);
const old=S.blank();S.result(old,{skill:'fraction',mode:'check',correct:true,assisted:false,exposed:false,attempt:1,time:1,fingerprint:'legacy'});assert.deepEqual(S.validate(old,C.lessons.map(l=>l.id)),old);
console.log(`PASS ${checks} independently checked generated tasks, ${models} model boundaries, 75 points, legacy state.`);
