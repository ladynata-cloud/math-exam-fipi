'use strict';
// Analytic and coordinate checks derived from the printed conditions (pp112–113),
// independently of the authored solution generation.
const assert=require('node:assert/strict');
const bundle=require('../../stereo-course/textbook/data/course.json');
const ids=require('./additional404-baseline.json').ids;
const cards=bundle.lessons.filter(c=>ids.includes(c.id));
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near=(a,b,label,tol=1e-9)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' != '+b);
const distance=(p,a,b)=>norm(sub(p[a],p[b]));
const area=ps=>{let x=0;for(let i=1;i+1<ps.length;i++)x+=norm(cross(sub(ps[i],ps[0]),sub(ps[i+1],ps[0])))/2;return x;};
const angleCos=(p,a,b,c)=>dot(sub(p[a],p[b]),sub(p[c],p[b]))/(distance(p,a,b)*distance(p,c,b));
function closed(m,label){
 const edges=new Map(),vertices=new Set();
 for(const f of m.faces){f.forEach(k=>vertices.add(k));for(let i=0;i<f.length;i++){const k=[f[i],f[(i+1)%f.length]].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}}
 assert([...edges.values()].every(n=>n===2),label+' complete boundary, no duplicate or missing cap');
 assert.equal(vertices.size-edges.size+m.faces.length,2,label+' sphere topology');
}
function check(input){
 const get=n=>input.find(c=>c.id==='ex-main-'+n);
 let c=get('0404'),p=c.visualization.model.points;
 near(distance(p,'S','A')/distance(p,'O','A'),4,'404 sector length becomes circumference');
 assert(c.steps.at(-1).explanation.includes('l = 4r'));
 c=get('0405');p=c.visualization.model.points;
 for(const [a,b]of [['A','B'],['B','C'],['C','A']])near(dot(sub(p[a],p.S),sub(p[b],p.S)),0,'405 perpendicular generators');
 near(angleCos(p,'A','S','D'),-1/3,'405 axial apex angle');assert(c.steps.at(-1).explanation.includes('−1/3'));
 c=get('0406');assert(c.steps.at(-1).explanation.includes('√(S₀² − S₁²)/π'),'406 square root of difference');
 c=get('0407');p=c.visualization.model.points;
 near(angleCos(p,'S','A','O'),1/7,'407 angle with base');near(distance(p,'S','A')/(distance(p,'S','A')+distance(p,'O','A')),7/8,'407 area ratio');
 assert(c.steps.at(-1).explanation.includes('arccos(1/7)'));
 c=get('0408');p=c.visualization.model.points;
 near(distance(p,'O','A'),4,'408 radius');near(angleCos(p,'A','O','B'),-.5,'408 central angle 120');
 near(dot(sub(p.A,p.B),sub(p.S,p.M)),0,'408 section altitude');near(angleCos(p,'S','M','O'),Math.SQRT1_2,'408 dihedral 45');
 near(area(['S','A','B'].map(k=>p[k])),4*Math.sqrt(6),'408 actual section area');assert(c.steps.at(-1).explanation.includes('4√6 см²'));
 c=get('0409');p=c.visualization.model.points;
 near(distance(p,'O','A')/distance(p,'S','A'),3/4,'409 sector270');near(angleCos(p,'A','S','O'),Math.sqrt(7)/4,'409 angle with height');
 assert(c.steps.at(-1).explanation.includes('arcsin(3/4)'));
 c=get('0410');p=c.visualization.model.points;
 near(angleCos(p,'A','C','B'),0,'410 original right angle');
 near(distance(p,'A','C'),3,'410 a');near(distance(p,'B','C'),4,'410 b');near(distance(p,'A','B'),5,'410 c');
 near(dot(sub(p.C,p.H),sub(p.B,p.A)),0,'410 radius perpendicular to axis');
 closed(c.visualization.model,'410');
 assert(c.visualization.model.faces.every(f=>f.includes('A')||f.includes('B')),'410 no internal common disk');
 near(c.visualization.model.faces.reduce((s,f)=>s+area(f.map(k=>p[k])),0),Math.PI*(12/5)*7,'410 outer area',.002);
 assert(c.steps.at(-1).explanation.includes('(πab(a + b))/√(a² + b²)'));
 c=get('0411');p=c.visualization.model.points;
 near(distance(p,'A','B'),10,'411 larger base');near(distance(p,'D','C'),6,'411 smaller base');
 near(distance(p,'A','D'),distance(p,'B','C'),'411 equal legs');near(angleCos(p,'D','A','B'),.5,'411 acute angle');
 near(distance(p,'D','H'),2*Math.sqrt(3),'411 height');closed(c.visualization.model,'411');
 assert(c.visualization.model.faces.every(f=>f.includes('A')||f.includes('B')||new Set(f.map(k=>p[k][2])).size===2),'411 no internal disks');
 near(c.visualization.model.faces.reduce((s,f)=>s+area(f.map(k=>p[k])),0),40*Math.sqrt(3)*Math.PI,'411 outer area',.002);
 assert(c.steps.at(-1).explanation.includes('40√3π'));
 for(const [suffix,n,expected]of [['a',3,9*Math.sqrt(3)*(Math.sqrt(73)+3)/4],['b',4,18+6*Math.sqrt(41)],['c',6,9*(Math.sqrt(91)+3*Math.sqrt(3))/2]]){
  c=get('0412-'+suffix);p=c.visualization.model.points;
  near(distance(p,'S','O'),4,'412 height');near(distance(p,'O','A'),3,'412 circumradius');
  near(distance(p,'S','A'),5,'412 lateral edge');assert(distance(p,'S','M')<5,'412 apothem is not edge');
  near(dot(sub(p.S,p.M),sub(p.A,p.B)),0,'412 apothem perpendicular to side');
  near(distance(p,'M','O'),3*Math.cos(Math.PI/n),'412 base apothem');
  assert.equal(c.visualization.model.faces.length,n+1);closed(c.visualization.model,'412'+suffix);
  near(c.visualization.model.faces.reduce((s,f)=>s+area(f.map(k=>p[k])),0),expected,'412 exact pyramid surface');
  assert(c.steps.some(s=>s.justifications.some(j=>j.theoryId==='theory-033-area')),'412 correct linked surface theorem');
 }
 c=get('0413');p=c.visualization.model.points;
 near(dot(sub(p.C,p.A),sub(p.D,p.B)),0,'413 perpendicular diagonals');
 near(distance(p,'C','D'),4,'413 40cm is diameter4dm');
 near(area(['A','B','C','D'].map(k=>p[k])),36,'413 axial area36dm2');
 near(distance(p,'B','C'),2*Math.sqrt(10),'413 slant');
 const R=distance(p,'O','B'),r=distance(p,'O1','C'),l=distance(p,'B','C');
 near(Math.PI*(R+r)*l,12*Math.sqrt(10)*Math.PI,'413 lateral surface');
 near(Math.PI*((R+r)*l+R*R+r*r),4*(3*Math.sqrt(10)+5)*Math.PI,'413 full surface');
 assert(c.steps.at(-1).explanation.includes('4(3√10 + 5)π дм²'),'413 units and result');
}
check(cards);
let families=0;
for(let i=1;i<=240;i++){
 const r=.2+i/35,h=.3+((i*37)%271)/23,a=.2+((i*17)%311)/29,b=.4+((i*53)%283)/31,l=Math.hypot(r,h);
 near((Math.PI*(4*r)/2)/(2*Math.PI*r),1,'404 scale family');families++;
 const u=[Math.sqrt(2)*h,0,-h],w=[-Math.sqrt(2)*h/2,Math.sqrt(6)*h/2,-h];
 near(dot(u,w),0,'405 scale source perpendicularity');
 near(dot(u,[-u[0],0,-h])/(norm(u)**2),-1/3,'405 cosine family');families++;
 const S0=Math.PI*r*l,S1=Math.PI*r*r;
 assert(S0>S1);near(Math.sqrt(S0*S0-S1*S1)/Math.PI,r*h,'406 area from independent dimensions');families++;
 const long=7*r,height=Math.sqrt(long*long-r*r);
 near(r/Math.hypot(r,height),1/7,'407 scale family');families++;
 const A=[r/2,r*Math.sqrt(3)/2,0],B=[r/2,-r*Math.sqrt(3)/2,0],S=[0,0,r/2];
 near(area([S,A,B]),r*r*Math.sqrt(6)/4,'408 scaled coordinates');families++;
 const ell=4*r/3,hh=Math.sqrt(ell*ell-r*r);
 near(Math.sin(Math.atan2(r,hh)),.75,'409 independent height family');families++;
 const hyp=Math.hypot(a,b),rad=a*b/hyp;
 const A0=[0,0,0],B0=[0,0,hyp],C0=[rad,0,a*a/hyp];
 near(norm(sub(A0,C0)),a,'410 reconstructed leg a');near(norm(sub(B0,C0)),b,'410 reconstructed leg b');
 near(Math.PI*rad*(norm(sub(A0,C0))+norm(sub(B0,C0))),Math.PI*a*b*(a+b)/hyp,'410 area family');families++;
 const k=r,rr=2*Math.sqrt(3)*k,H=6*k,L=4*k;
 near(2*Math.PI*rr*H+2*Math.PI*rr*L,40*Math.sqrt(3)*Math.PI*k*k,'411 scaled area');families++;
 for(const n of [3,4,6]){
  const vertices=Array.from({length:n},(_,j)=>[r*Math.cos(2*Math.PI*j/n),r*Math.sin(2*Math.PI*j/n),0]),top=[0,0,h];
  const direct=area(vertices)+vertices.reduce((s,p,j)=>s+area([top,p,vertices[(j+1)%n]]),0),apot=r*Math.cos(Math.PI/n),P=2*n*r*Math.sin(Math.PI/n);
  near(direct,P*(Math.hypot(h,apot)+apot)/2,'412 direct surface family');
 }families++;
 const R=2*r,rrr=r,H2=R+rrr,L2=Math.hypot(H2,R-rrr);
 const diag1=[R+rrr,0,H2],diag2=[-R-rrr,0,H2];
 near(dot(diag1,diag2),0,'413 source diagonal family');near(L2/r,Math.sqrt(10),'413 scaled slant');families++;
}
let negatives=0;
for(const mutate of [
 x=>x.find(c=>c.id==='ex-main-0405').visualization.model.points.C[2]+=1,
 x=>x.find(c=>c.id==='ex-main-0407').steps.at(-1).explanation='arcsin(1/7)',
 x=>x.find(c=>c.id==='ex-main-0408').visualization.model.points.S[2]*=2,
 x=>x.find(c=>c.id==='ex-main-0409').steps.at(-1).explanation='arccos(3/4)',
 x=>x.find(c=>c.id==='ex-main-0410').visualization.model.faces.push(Array.from({length:64},(_,i)=>'_r'+i)),
 x=>x.find(c=>c.id==='ex-main-0411').visualization.model.faces.pop(),
 x=>x.find(c=>c.id==='ex-main-0412-b').visualization.model.points.M=[0,0,0],
 x=>x.find(c=>c.id==='ex-main-0413').visualization.model.points.C[0]*=2
]){const bad=structuredClone(cards);mutate(bad);assert.throws(()=>check(bad));negatives++;}
console.log('ATANASYAN_ADDITIONAL404_MATH_OK: 12 source models, '+families+' parameter families, '+negatives+' rejected corruptions');

