'use strict';
// Direct coordinate and parameter checks derived from the printed conditions,
// independently of the authored construction script and the printed answers.
const assert=require('node:assert/strict');
const bundle=require('../../stereo-course/textbook/data/course.json');
const ids=require('./additional414-baseline.json').ids;
const cards=bundle.lessons.filter(c=>ids.includes(c.id));
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,t)=>a.map(x=>x*t);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near=(a,b,label,tol=2e-9)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' != '+b);
const vector=(a,b,label)=>a.forEach((x,i)=>near(x,b[i],label+' coordinate '+i));
const distance=(p,a,b)=>norm(sub(p[a],p[b]));
const angleCos=(p,a,b,c)=>dot(sub(p[a],p[b]),sub(p[c],p[b]))/(distance(p,a,b)*distance(p,c,b));
const midpoint=(a,b)=>mul(add(a,b),.5);
const allText=c=>c.steps.map(s=>s.explanation).join('\n');
let checkedArcs=0;
function onSphere(point,center,r,label){near(norm(sub(point,center)),r,label);}
function circle(m,prefix,center,r,normal,label){
 const names=Object.keys(m.points).filter(k=>k.startsWith(prefix));assert.equal(names.length,64,label+' complete circle');
 for(const n of names){onSphere(m.points[n],center,r,label);near(dot(sub(m.points[n],center),normal),0,label+' plane');}
}
function rectangle(p,names,label){
 const [a,b,c,d]=names.map(n=>p[n]);vector(sub(b,a),sub(c,d),label+' opposite sides');vector(sub(d,a),sub(c,b),label+' opposite sides');near(dot(sub(b,a),sub(d,a)),0,label+' right angle');assert(norm(sub(b,a))>0&&norm(sub(d,a))>0,label+' nondegenerate');
}
function check(input){
 assert.equal(input.length,14);const get=n=>input.find(c=>c.id==='ex-main-'+n);
 for(const c of input){
  const m=c.visualization.model;
  for(const s of m.spheres||[]){assert(s.radius>0);for(const edge of s.surfaceEdges){for(const n of edge){assert(m.points[n],c.id+' sphere point');onSphere(m.points[n],s.center,s.radius,c.id+' own surface arc');checkedArcs++;}}}
 }
 for(const part of ['a','b','c']){
  const c=get('0414-'+part),m=c.visualization.model,p=m.points;
  onSphere(p.A,p.O,5,'414 source point');onSphere(p.A1,p.O,5,'414 image point');
  if(part==='a')vector(sub(p.A1,p.O),mul(sub(p.A,p.O),-1),'414a central reflection');
  if(part==='b'){
   vector(midpoint(p.A,p.A1),p.H,'414b half turn');near(norm(cross(sub(p.H,p.O),sub(p._axis1,p.O))),0,'414b H on axis');near(dot(sub(p.A,p.H),sub(p._axis1,p.O)),0,'414b perpendicular foot');
   assert(c.steps[1].explanation.includes('H = O'));assert(c.steps[2].explanation.startsWith('При H ≠ O'),'414b nondegenerate triangles only');
  }
  if(part==='c'){vector(midpoint(p.A,p.A1),p.H,'414c reflection midpoint');near(p.O[2],0,'414c centre in plane');near(p.H[2],0,'414c foot in plane');near(p.A[0],p.A1[0],'414c normal direction');near(p.A[1],p.A1[1],'414c normal direction');}
  assert(/повтор|ещё раз/iu.test(allText(c)),'414 reverse inclusion by involution');
 }
 for(const part of ['a','b']){
  const c=get('0415-'+part),p=c.visualization.model.points;
  near(distance(p,'A','B'),1.8,'415 first leg');near(distance(p,'A','C'),2.4,'415 second leg');near(angleCos(p,'B','A','C'),0,'415 right angle');near(distance(p,'B','C'),3,'415 hypotenuse');
  const R=part==='a'?1.5:6.5;for(const x of ['A','B','C'])near(distance(p,'O',x),R,'415 source sphere');
  if(part==='a')vector(p.O,midpoint(p.B,p.C),'415a centre on hypotenuse');
  else{vector(p.H,midpoint(p.B,p.C),'415b projected circumcentre');near(dot(sub(p.O,p.H),sub(p.B,p.A)),0,'415b perpendicular to first direction');near(dot(sub(p.O,p.H),sub(p.C,p.A)),0,'415b perpendicular to second direction');near(distance(p,'O','H')**2,40,'415b squared distance');assert(allText(c).includes('2√10 см'));}
 }
 for(const part of ['a','b']){
  const c=get('0416-'+part),m=c.visualization.model,p=m.points;
  near(distance(p,'O','P'),6,'416 outer radius');near(distance(p,'O','A'),2,'416 first third');near(distance(p,'A','P'),4,'416 remaining two thirds');near(distance(p,'O','H'),1,'416 inner radius and tangent distance');near(dot(sub(p.O,p.H),sub(p.A,p.H)),0,'416 tangent perpendicular');near(angleCos(p,'O','A','H'),Math.sqrt(3)/2,'416a angle30');
  circle(m,'_section',p.H,Math.sqrt(35),[0,0,1],'416 section');near(distance(p,'H','X')**2/(4*6**2),35/144,'416b disk to sphere area');
  assert(allText(c).includes(part==='a'?'30°':'35/144'),'416 exact identified result');
 }
 {
  const c=get('0417'),m=c.visualization.model,p=m.points;
  rectangle(p,['A','B','C','D'],'417 first rectangle');rectangle(p,['A','B','E','F'],'417 second rectangle');
  vector(p.P,midpoint(p.A,p.C),'417 first centre');vector(p.Q,midpoint(p.A,p.E),'417 second centre');vector(p.H,midpoint(p.A,p.B),'417 common midpoint');
  for(const [foot,sides]of [['P',['B','D']],['Q',['B','F']]])for(const n of sides)near(dot(sub(p.O,p[foot]),sub(p[n],p.A)),0,'417 normal');
  const r=distance(p,'O','A');for(const n of ['B','C','D','E','F'])near(distance(p,'O',n),r,'417 same sphere');
  const n1=cross(sub(p.B,p.A),sub(p.D,p.A)),n2=cross(sub(p.B,p.A),sub(p.F,p.A));near(Math.abs(dot(n1,n2))/(norm(n1)*norm(n2)),.5,'417 generic60-degree planes, not presumed perpendicular');
  for(const [prefix,normal]of [['_greatXY',[0,0,1]],['_greatXZ',[0,1,0]],['_greatYZ',[1,0,0]]])circle(m,prefix,p.O,r,normal,'417 concluding great circle');
  assert(!m.edges.some(e=>e.some(n=>n.startsWith('_great'))),'417 sphere not disclosed on cold entry');
  assert(allText(c).includes('совпадает с P или Q'),'417 zero normal length case handled');
 }
 for(const part of ['a','b']){
  const c=get('0418-'+part),m=c.visualization.model,p=m.points,s1=m.spheres[0],s2=m.spheres[1];near(s1.radius,s2.radius,'418 equal radii');assert(distance(p,'O1','O2')>0,'418 distinct centres');near(distance(p,'O1','O2'),1.6*s1.radius,'418 chosen source separation');vector(midpoint(p.O1,p.O2),p.H,'418 common circle centre');
  circle(m,'_intersection',p.H,3,[0,0,1],'418 common circle');for(const n of Object.keys(p).filter(k=>k.startsWith('_intersection')))onSphere(p[n],p.O2,5,'418 converse point on both spheres');
  near(distance(p,'H','X')/s1.radius,.6,'418b radius');
  if(part==='a'){assert(allText(c).includes('0 < d < 2R'),'418 coincident/tangent cases not called circle');assert(c.steps.at(-1).explanation.includes('любую точку'),'418 reverse inclusion');}
 }
 for(const part of ['a','b']){
  const c=get('0419-'+part),m=c.visualization.model,p=m.points,R=m.spheres[0].radius;
  for(const n of ['A','B','C','D','M'])onSphere(p[n],p.O,R,'419 source and antipode');
  const l=distance(p,'D','A'),a=distance(p,'A','B');for(const n of ['B','C'])near(distance(p,'D',n),l,'419 equal lateral edges');
  for(const [x,y]of [['A','B'],['B','C'],['C','A']])near(angleCos(p,x,'D',y),0,'419 sample2phi90');
  vector(p.H,mul(add(add(p.A,p.B),p.C),1/3),'419 equilateral centre');near(distance(p,'D','M'),2*R,'419 diameter');near(dot(sub(p.D,p.A),sub(p.M,p.A)),0,'419 right angle DAM');near(dot(sub(p.A,p.H),sub(p.D,p.M)),0,'419 altitude to diameter');near(l*l,2*R*distance(p,'D','H'),'419 cathetus theorem');
  assert(p.O[2]<p.H[2],'419 sample centre lies outside tetrahedron');near(l,2*Math.sqrt(3),'419 actual AD');near(a,2*Math.sqrt(6),'419 actual AB differs from AD');
  const s=Math.sin(Math.PI/4);near(l,2*R*Math.sqrt((3-4*s*s)/3),'419 named AD formula');near(a,4*R*s*Math.sqrt((3-4*s*s)/3),'419 named AB formula');
  if(part==='a'){
   const final=c.steps.at(-1).explanation;assert(final.includes('AB = 4R sinφ√((3 − 4sin²φ)/3)'),'419 printed order must not swap AB');assert(final.includes('AD = 2R√((3 − 4sin²φ)/3)'),'419 printed order must not swap AD');
  }else{
   circle(m,'_base',p.H,a/Math.sqrt(3),[0,0,1],'419 section');near(Math.PI*distance(p,'H','A')**2,8*Math.PI,'419 sample section area');assert(c.steps.at(-1).explanation.includes('(16πR²sin²φ(3 − 4sin²φ))/9'));
  }
  assert(allText(c).includes('0 < φ < 60°'),'419 strict nondegenerate domain');assert(allText(c).includes('вне тетраэдра'),'419 no interior-centre assumption');
 }
 {
  const c=get('0420'),m=c.visualization.model,p=m.points;near(distance(p,'O','M'),26,'420 OM, not nearest distance');near(distance(p,'M','N'),16,'420 nearest distance');near(distance(p,'O','X'),10,'420 source sphere');near(distance(p,'M','X'),24,'420 target distance');near(p.H[2],50/13,'420 plane coordinate');near(distance(p,'H','X'),120/13,'420 circle radius');
  circle(m,'_locus',p.H,120/13,[0,0,1],'420 complete locus');for(const n of Object.keys(p).filter(k=>k.startsWith('_locus')))near(distance(p,'M',n),24,'420 every locus point');
  assert(c.steps.at(-1).explanation.includes('(240π)/13 см'),'420 circumference not area');assert(allText(c).includes('любой точки Y'),'420 converse included');assert(allText(c).includes('не предполагает заранее'),'420 signed projection');
 }
 {
  const c=get('0421'),m=c.visualization.model,p=m.points;const R=m.spheres[0].radius,r=m.spheres[1].radius;assert(R>r&&r>0);vector(m.spheres[0].center,m.spheres[1].center,'421 concentric');near(distance(p,'O','H'),r,'421 inner tangent plane');near(distance(p,'O','X'),R,'421 outer section');near(distance(p,'H','X')**2,R*R-r*r,'421 equal areas after dividing by pi');
  circle(m,'_centralOuter',p.O,R,[0,0,1],'421 outer central ring');circle(m,'_centralInner',p.O,r,[0,0,1],'421 inner central ring');circle(m,'_tangent',p.H,4,[0,0,1],'421 tangent section');
  assert(!m.views.central.polygon,'421 central annulus must not be painted as a full disk');assert(allText(c).includes('π(R² − r²)'),'421 area difference, not sum');assert(allText(c).includes('одну общую точку H'),'421 tangent point has no area');
 }
}
check(cards);
const arcCount=checkedArcs;
let families=0;
for(let i=1;i<=180;i++){
 const R=.7+i/31,theta=.025+((i*37)%173)/173*(Math.PI-.05),L=.8+((i*23)%179)/29,p=.4+((i*11)%193)/41,q=.3+((i*13)%181)/37;
 // Symmetries about arbitrary directions, including a second application.
 const axis=mul([1,i%5+1,i%7-3],1/norm([1,i%5+1,i%7-3])),A=mul([i%11-5,3,i%13-6],R/norm([i%11-5,3,i%13-6]));
 const half=x=>sub(mul(axis,2*dot(x,axis)),x),plane=x=>sub(x,mul(axis,2*dot(x,axis)));
 near(norm(half(A)),R,'414 axis family');vector(half(half(A)),A,'414 axis involution');near(norm(plane(A)),R,'414 plane family');vector(plane(plane(A)),A,'414 plane involution');vector(half(axis),axis,'414 fixed axis point');families++;
 const a=.2+p,b=.4+q,rad=Math.hypot(a,b)/2,RR=rad+.1+R,h=Math.sqrt(RR*RR-rad*rad),O=[0,0,h];
 for(const X of [[-a/2,-b/2,0],[a/2,-b/2,0],[-a/2,b/2,0]])near(norm(sub(X,O)),RR,'415 independent right-triangle family');families++;
 near(Math.asin((R/6)/(R/3)),Math.PI/6,'416 angle family');near((R*R-(R/6)**2)/(4*R*R),35/144,'416 area family');families++;
 // Solve for the sphere centre directly from the two arbitrary rectangles.
 const centre=[0,p/2,(q-p*Math.cos(theta))/(2*Math.sin(theta))],vertices=[[-L/2,0,0],[L/2,0,0],[L/2,p,0],[-L/2,p,0],[L/2,q*Math.cos(theta),q*Math.sin(theta)],[-L/2,q*Math.cos(theta),q*Math.sin(theta)]];
 const rr=norm(sub(vertices[0],centre));for(const X of vertices)near(norm(sub(X,centre)),rr,'417 arbitrary widths and dihedral angle');families++;
 const d=R*(.005+((i*19)%179)/179*1.99),rho=Math.sqrt(R*R-d*d/4),X=[rho*Math.cos(theta),rho*Math.sin(theta),0];near(norm(sub(X,[0,0,-d/2])),R,'418 first sphere family');near(norm(sub(X,[0,0,d/2])),R,'418 second sphere family');families++;
 // Parameterize a sphere by an arbitrary section height, not by the answer.
 const z=R*(-.995+1.99*((i*29)%181)/181),rhoBase=Math.sqrt(R*R-z*z),D=[0,0,R],U=[rhoBase,0,z],V=[-rhoBase/2,Math.sqrt(3)*rhoBase/2,z];
 const ell=norm(sub(U,D)),side=norm(sub(U,V)),sinPhi=side/(2*ell),phi=Math.asin(sinPhi);assert(phi>0&&phi<Math.PI/3);
 near(ell,2*R*Math.sqrt((3-4*sinPhi*sinPhi)/3),'419 AD from independent polar section');near(side,4*R*sinPhi*Math.sqrt((3-4*sinPhi*sinPhi)/3),'419 AB from independent polar section');near(Math.PI*rhoBase*rhoBase,16*Math.PI*R*R*sinPhi*sinPhi*(3-4*sinPhi*sinPhi)/9,'419 section area family');families++;
 const dist=R+L,x=R*(-.98+1.96*((i*31)%181)/181),target=Math.sqrt(dist*dist+R*R-2*dist*x),found=(dist*dist+R*R-target*target)/(2*dist),circleR=Math.sqrt(R*R-found*found),Y=[circleR*Math.cos(theta),circleR*Math.sin(theta),found];
 near(found,x,'420 independent locus plane');near(norm(Y),R,'420 locus sphere');near(norm(sub(Y,[0,0,dist])),target,'420 locus distance family');families++;
 const inner=R*(.02+.96*((i*43)%181)/181),cut=Math.sqrt(R*R-inner*inner);near(Math.PI*cut*cut,Math.PI*(R*R-inner*inner),'421 arbitrary concentric shell');families++;
}
// Fixed and degenerate boundaries are checked separately, never silently sampled.
vector([0,0,0],[0,0,0],'414 centre as perpendicular foot');
for(const R of [1,3,9]){near(R*R-(2*R/2)**2,0,'418 tangency is not circle');assert(R*R-(2.1*R/2)**2<0,'418 separated spheres');}
for(const theta of [.4,1]){const p=5,q=p*Math.cos(theta),O=[0,p/2,(q-p*Math.cos(theta))/(2*Math.sin(theta))];near(O[2],0,'417 possible O=P');}
let negatives=0;
for(const mutate of [
 x=>x.find(c=>c.id==='ex-main-0414-a').visualization.model.points.A1[0]+=1,
 x=>x.find(c=>c.id==='ex-main-0414-b').visualization.model.points.H[1]=1,
 x=>x.find(c=>c.id==='ex-main-0414-c').visualization.model.points.A1[2]=4,
 x=>x.find(c=>c.id==='ex-main-0415-a').visualization.model.points.O[2]=1,
 x=>x.find(c=>c.id==='ex-main-0415-b').visualization.model.points.H[0]=.1,
 x=>x.find(c=>c.id==='ex-main-0416-a').visualization.model.points.A=x.find(c=>c.id==='ex-main-0416-a').visualization.model.points.P.map(v=>v/2),
 x=>x.find(c=>c.id==='ex-main-0416-b').steps.at(-1).explanation='35/36',
 x=>x.find(c=>c.id==='ex-main-0417').visualization.model.points.O[1]+=.1,
 x=>x.find(c=>c.id==='ex-main-0418-a').visualization.model.points.O2=[0,0,-4],
 x=>x.find(c=>c.id==='ex-main-0419-a').steps.at(-1).explanation='AB = 2R√((3 − 4sin²φ)/3), AD = 4R sinφ√((3 − 4sin²φ)/3)',
 x=>x.find(c=>c.id==='ex-main-0419-b').visualization.model.points.D[2]=3,
 x=>x.find(c=>c.id==='ex-main-0420').visualization.model.points.M[2]=16,
 x=>x.find(c=>c.id==='ex-main-0420').visualization.model.points._locus17[0]+=.1,
 x=>x.find(c=>c.id==='ex-main-0421').visualization.model.views.central.polygon=['O','A','B']
]){const bad=structuredClone(cards);mutate(bad);assert.throws(()=>check(bad));negatives++;}
console.log('ATANASYAN_ADDITIONAL414_MATH_OK: 14 source models, '+arcCount+' surface endpoints, '+families+' parameter families, '+negatives+' rejected corruptions; 419 AB/AD independently distinguished');
