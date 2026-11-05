'use strict';
// Independent analytic equations and coordinates for the printed exercises.
// Uses source dimensions, not a generated answer key or renderer output.
const assert=require('node:assert/strict');
const bundle=require('../../stereo-course/textbook/data/course.json');
const ids=require('./additional396-baseline.json').ids;
const cards=bundle.lessons.filter(c=>ids.includes(c.id));
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>Math.hypot(...v);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near=(a,b,label,tol=1e-9)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' ≠ '+b);
const area=ps=>{let s=0;for(let i=1;i+1<ps.length;i++)s+=norm(cross(sub(ps[i],ps[0]),sub(ps[i+1],ps[0])))/2;return s;};
function checkModels(input){
 const get=n=>input.find(c=>c.id==='ex-main-'+n);
 let c=get('0396'),p=c.visualization.model.points,r=norm(p.C),h=norm(sub(p.O1,p.O));
 near(norm(p.M),r/2,'396 midpoint');near(dot(sub(p.B,p.A),p.C),0,'396 plane normal');near(p.A[0],p.M[0],'396 plane through M');near(p.B1[0],p.M[0],'396 vertical plane');near(area([p.A,p.B,p.B1,p.A1]),Math.sqrt(3)*r*h,'396 section area');
 c=get('0397');p=c.visualization.model.points;
 const a=norm(sub(p.B,p.A)),height=norm(sub(p.O1,p.O)),proj=norm(sub(p.Cp,p.B)),side=norm(sub(p.C,p.B));
 near(a,height,'397 a is generator and AB');near(dot(sub(p.B,p.A),sub(p.C,p.B)),0,'397 rectangle');near(side*side,proj*proj+height*height,'397 right projection triangle');near(height/side,Math.sin(Math.PI/3),'397 60 degree angle');
 for(const name of ['A','B','Cp','Dp']){near(p[name][2],0,'397 lower plane');near(Math.hypot(p[name][0],p[name][1]),a/Math.sqrt(3),'397 base circle');}
 near(norm(sub(p.Cp,p.A)),2*a/Math.sqrt(3),'397 diagonal is diameter');
 c=get('0398');p=c.visualization.model.points;r=norm(p.A);
 for(const k of ['P','Q','R','T','A1'])near(p[k][0],r,'398 tangent plane');
 near(dot(sub(p.A1,p.A),p.A),0,'398 generator perpendicular to radius');
 near(norm(p.A),2,'398 model radius');near(p.A[1],0,'398 unique tangent point');
 c=get('0399');p=c.visualization.model.points;
 near(dot(sub(p.B,p.A),sub(p.D,p.A)),0,'399 rectangle');
 assert(c.steps.at(-1).explanation.includes('√((S₁² + S₂²)/(2π(S₁ + S₂)))'),'399 correct symmetric formula');
 c=get('0400-a');p=c.visualization.model.points;near(norm(sub(p.B,p.A)),norm(sub(p.C,p.B)),'400a axial square');
 c=get('0400-b');p=c.visualization.model.points;
 near(norm(sub(p.D,p.A))/norm(sub(p.B,p.A)),2,'400b exact source side ratio');
 const sideArea=(radius,height)=>2*Math.PI*radius*height,fullArea=(radius,height)=>sideArea(radius,height)+2*Math.PI*radius*radius;
 const r1=norm(sub(p.D,p.O)),h1=norm(sub(p.O1,p.O)),r2=norm(sub(p.B,p.P)),h2=norm(sub(p.P1,p.P));
 near(fullArea(r1,h1)/sideArea(r1,h1),2,'400b short height');near(fullArea(r2,h2)/sideArea(r2,h2),5/4,'400b long height');
 assert(c.steps.at(-1).explanation.includes('2 или 5/4'),'400b keeps both orientations');
 c=get('0401');p=c.visualization.model.points;r=norm(sub(p.B,p.O));h=norm(sub(p.O1,p.O));
 const rho=norm(sub(p.A,p.K));near(2*r*h,rho*rho,'401 model satisfies equality of areas');
 near(rho*rho,r*r+h*h/4,'401 circumcircle radius');
 for(const k of ['A','B','C','D'])near(norm(sub(p[k],p.K)),rho,'401 concyclic rectangle');
 assert(c.steps.at(-1).explanation.includes('(2 + √3)/2')&&c.steps.at(-1).explanation.includes('(2 − √3)/2'),'401 both positive roots');
 c=get('0402');p=c.visualization.model.points;
 const radius=norm(sub(p.B,p.O)),height2=norm(sub(p.C,p.B));near(2*radius,height2,'402 equality uses diameter, not radius');
 assert(c.steps.at(-1).explanation.includes('h = p/2')&&c.steps.at(-1).explanation.includes('r = p/4'),'402 source answer dimensions');
 c=get('0403');p=c.visualization.model.points;
 near(norm(sub(p.A,p.O)),6,'403 outer radius');near(norm(sub(p.D,p.I)),5,'403 inner radius');near(norm(sub(p.B,p.A)),16,'403 outer height');near(norm(sub(p.C,p.D)),15,'403 inner depth');near(norm(sub(p.I,p.O)),1,'403 bottom thickness');near(norm(sub(p.B,p.C)),1,'403 wall thickness');
 const faces=c.visualization.model.faces,used=new Set(),edges=new Map();
 let surface=0;
 for(const f of faces){f.forEach(k=>used.add(k));surface+=area(f.map(k=>p[k]));for(let i=0;i<f.length;i++){const k=[f[i],f[(i+1)%f.length]].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}
  if(f.every(k=>Math.abs(p[k][2]-16)<1e-9)){assert.equal(f.length,4,'403 top is rim quads only');const radii=f.map(k=>Math.hypot(p[k][0],p[k][1]));assert(radii.some(r=>Math.abs(r-5)<1e-8)&&radii.some(r=>Math.abs(r-6)<1e-8),'403 rim joins both radii');}
 }
 assert([...edges.values()].every(n=>n===2),'403 solid glass boundary has no missing surface or duplicated cap');
 assert.equal(used.size-edges.size+faces.length,2,'403 closed boundary topology');
 near(surface,414*Math.PI,'403 polygonal mesh approaches analytic full area',0.003);
 assert(c.steps.at(-1).explanation.includes('414π см²'),'403 full exposed surface');
}
checkModels(cards);
let families=0;
for(let i=1;i<=300;i++){
 const a=0.2+i/31,b=0.6+(i*37%401)/29,h=0.3+(i*17%307)/19,r=0.1+(i*29%311)/23;
 // 396: area of actual rectangle with its two endpoints on the circle.
 const x=r/2,y=Math.sqrt(r*r-x*x),rectangle=2*y*h,axial=2*r*h;
 near(rectangle/axial,Math.sqrt(3)/2,'396 scale family');families++;
 // 397: reconstruct the four vertices from the 60° projection constraint.
 const q=a/(2*Math.sqrt(3)),radius=Math.hypot(a/2,q),bc=Math.hypot(2*q,a);
 near(radius,a*Math.sqrt(3)/3,'397 radius family');near(a/bc,Math.sqrt(3)/2,'397 source angle family');families++;
 // 398: x=r on x²+y²=r² implies y²=0; sample distinct non-tangent points.
 for(let j=1;j<64;j++){const theta=2*Math.PI*j/64;assert(r*Math.cos(theta)<r,'398 no second tangent point');}families++;
 // 399: independently construct both full surfaces, then recover diagonal.
 const s1=2*Math.PI*b*b+2*Math.PI*a*b,s2=2*Math.PI*a*a+2*Math.PI*a*b;
 near(Math.sqrt((s1*s1+s2*s2)/(2*Math.PI*(s1+s2))),Math.hypot(a,b),'399 area-to-diagonal family');families++;
 // 400: source aspect ratio allows both assignments.
 for(const [radius,height,expected]of [[a,a,2],[a/2,2*a,5/4],[a,2*a,3/2]])near((2*Math.PI*radius*height+2*Math.PI*radius*radius)/(2*Math.PI*radius*height),expected,'400 source orientations');families++;
 // 401: every root is positive and satisfies the original area equality.
 for(const x of [(2+Math.sqrt(3))/2,(2-Math.sqrt(3))/2]){assert(x>0);const rr=x*h;near(2*Math.PI*rr*h,Math.PI*(rr*rr+h*h/4),'401 both scales');}families++;
 // 402: all sampled feasible diameters have lower area than the square.
 const p=a+b,opt=Math.PI*p*p/4;
 for(let j=1;j<40;j++){const diameter=p*j/40,height=p-diameter;assert(Math.PI*diameter*height<=opt+1e-9);if(j!==20)assert(Math.PI*diameter*height<opt);}
 near(2*(2*(p/4)+p/2),2*p,'402 prescribed perimeter');families++;
 // 403: exposed surfaces of a cup with positive wall and bottom thickness.
 const wall=0.1+i/1000,inner=r,outer=inner+wall,H=h+wall;
 const five=2*Math.PI*outer*H+2*Math.PI*inner*(H-wall)+Math.PI*outer*outer+Math.PI*inner*inner+Math.PI*(outer*outer-inner*inner);
 near(five,2*Math.PI*(outer*H+inner*(H-wall)+outer*outer),'403 parameter family');families++;
}
let negatives=0;
for(const mutate of [
 data=>{data.find(c=>c.id==='ex-main-0396').visualization.model.points.M[0]+=0.2;},
 data=>{data.find(c=>c.id==='ex-main-0397').visualization.model.points.C[2]+=1;},
 data=>{data.find(c=>c.id==='ex-main-0400-b').steps.at(-1).explanation='Только 2.';},
 data=>{data.find(c=>c.id==='ex-main-0401').steps.at(-1).explanation='Только положительный знак.';},
 data=>{data.find(c=>c.id==='ex-main-0402').steps.at(-1).explanation='h = p/2 и r = p/2';},
 data=>{data.find(c=>c.id==='ex-main-0403').visualization.model.faces.pop();}
]){const bad=structuredClone(cards);mutate(bad);assert.throws(()=>checkModels(bad));negatives++;}
console.log('ATANASYAN_ADDITIONAL396_MATH_OK: '+families+' parameter families; nine source models; '+negatives+' rejected mathematical corruptions');
module.exports={families,negatives,checkModels};
