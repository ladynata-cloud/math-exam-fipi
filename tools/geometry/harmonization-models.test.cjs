'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),I=require(root+'/geometry-course/assets/investigations.js'),T=require(root+'/geometry-course/assets/tasks.js'),P=require(root+'/geometry-course/assets/practice.js'),C=require(root+'/geometry-course/data/course.json');
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${message||''}: ${a} != ${b}`),cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>a.map((x,i)=>x-b[i]),len=v=>Math.hypot(...v),d=(a,b)=>len(sub(a,b));
const area=pts=>Math.abs(pts.reduce((s,p,i)=>s+cross(p,pts[(i+1)%pts.length]),0))/2;
function cases(cs){let out=[{}];for(const c of cs){const vs=c.options?c.options.map(o=>o[0]):[...new Set([c.min,c.value,c.max])];out=out.flatMap(o=>vs.map(v=>({...o,[c.key]:v})));}return out;}
test('63 explicit contracts and every control combination has finite geometry or an explicit invalid state',()=>{
 assert.deepEqual(I.ids.slice().sort(),C.units.map(u=>u.id).sort());let count=0;for(const id of I.ids){assert(I.descriptions[id].action.length>30);assert(I.descriptions[id].conclusion.length>30);assert.equal(I.forecasts[id].length,3);for(const values of cases(I.controls[id])){const m=I.model(id,values);for(const [name,p] of Object.entries(m.points))assert(p.every(Number.isFinite),id+' '+name);for(const c of m.circles)assert(c.r>0&&Number.isFinite(c.r),id+' circle');assert(m.readout.length,id);const html=I.svg(m,id);assert(!/NaN|Infinity|undefined/.test(html),id);count++;}}assert(count>700);console.log('Investigated control combinations:',count);
});
test('line, angle, length and locus models respect actual incidence and their domains',()=>{
 assert(!I.model('segments',{d:0,offset:0,angle:20}).valid);for(const angle of [-45,0,40]){const m=I.model('segments',{d:6,offset:0,angle});near(cross(sub(m.points.B,m.points.A),sub(m.points.P,m.points.A)),0);}
 assert.equal(I.model('length',{x:7}).values.inside,false);near(I.model('length',{x:7}).values.AB+I.model('length',{x:7}).values.BC,8);
 const outside=I.model('measure-angle',{ray:140}).values;assert(!outside.inside);assert(outside.part1+outside.part2>100);
 for(const alpha of [20,80,140]){const m=I.model('angle-locus',{angle:alpha,position:.5});near(m.values.distance1,m.values.distance2);assert(I.model('angle-locus',{angle:alpha,position:.2}).values.distance1<I.model('angle-locus',{angle:alpha,position:.2}).values.distance2);}
 near(I.model('perp-locus',{x:0,y:0}).values.PA,I.model('perp-locus',{x:0,y:0}).values.PB);
});
test('SSA has two different triangles with the same stated side/side/nonincluded angle',()=>{
 const m=I.model('triangle-sas',{mode:'ssa'}),p=m.points;near(d(p.A,p.C),5);near(d(p.B,p.C),3);near(d(p.D,p.C),3);assert(Math.abs(d(p.A,p.B)-d(p.A,p.D))>1);near(I.helpers.angle(p.B,p.A,p.C),30);near(I.helpers.angle(p.D,p.A,p.C),30);
 const counts=[10,30,70].map(angle=>I.model('solve-triangle',{mode:'ssa',angle}).values.solutions);assert.deepEqual(counts,[2,2,0]);assert.equal(I.model('solve-triangle',{mode:'sss',c:7}).values.solutions,0);
});
test('centres and cevians are constructed from the varied triangle, including obtuse cases',()=>{
 for(const x of [-2,2,3,8]){const m=I.model('centers',{x,height:3}),p=m.points;near(d(p.O,p.A),d(p.O,p.B));near(d(p.O,p.B),d(p.O,p.C));const sideDistance=(point,a,b)=>Math.abs(cross(sub(b,a),sub(point,a)))/d(a,b);near(sideDistance(p.I,p.A,p.B),sideDistance(p.I,p.B,p.C));near(sideDistance(p.I,p.B,p.C),sideDistance(p.I,p.C,p.A));near((p.A[0]+p.B[0]+p.C[0])/3,p.G[0]);near((p.A[1]+p.B[1]+p.C[1])/3,p.G[1]);}
 const c=I.model('cevians',{x:3});near(c.points.M[0],c.points.D[0]);near(c.points.M[0],c.points.H[0]);assert(!I.model('cevians',{x:2}).values.coincident);
});
test('area models agree with independent coordinate area, not labels alone',()=>{
 for(const id of ['area-parallelogram','area-trapezoid','area-triangle'])for(const values of cases(I.controls[id])){const m=I.model(id,values),a=area(m.polygons[0].map(n=>m.points[n]));near(a,id==='area-triangle'?m.values.triangle:m.values.area,id);}
 for(const values of cases(I.controls.heron)){const m=I.model('heron',values);if(m.valid)near(area(m.polygons[0].map(n=>m.points[n])),m.values.heron,'Heron');}
 for(const values of cases(I.controls.pythagoras)){const m=I.model('pythagoras',values);if(!m.valid)continue;const [ab,bc,ca]=m.polygons.slice(1).map(p=>area(p.map(n=>m.points[n])));near(ab,m.values.c**2);near(bc,m.values.a**2);near(ca,m.values.b**2);near(bc+ca-ab,m.values.residual);}
});
test('similarity and homothety use the stated centre and signed coefficient',()=>{
 for(const k of [-2,-.5,.5,1,2])for(const ox of [-2,1]){const m=I.model('homothety',{scale:k,ox,oy:-1}),p=m.points;for(const [a,b] of [['A','K'],['B','L'],['C','M']]){const u=sub(p[a],p.O),v=sub(p[b],p.O);near(cross(u,v),0);near(v[0],k*u[0]);near(v[1],k*u[1]);}near(d(p.K,p.L)/d(p.A,p.B),Math.abs(k));}
 assert(!I.model('homothety',{scale:0}).valid);
 for(const id of ['similarity','polygon-similarity'])for(const k of [.5,1,2]){const m=I.model(id,{scale:k});near(area(m.polygons[1].map(n=>m.points[n]))/area(m.polygons[0].map(n=>m.points[n])),k*k);}
});
test('circle intersection, tangent and chord products distinguish all boundaries',()=>{
 const count=(R,r,d)=>I.model('circle-position',{R,r,d}).values.count;assert.equal(count(3,2,5),1);assert.equal(count(3,2,1),1);assert.equal(count(3,2,3),2);assert.equal(count(3,2,0),0);assert.equal(count(3,3,0),'бесконечно много');assert.equal(count(3,2,6),0);
 for(const values of cases(I.controls['circle-position'])){const m=I.model('circle-position',values);for(const n of ['A','B'])if(m.points[n]){near(d(m.points[n],m.points.O),values.R);near(d(m.points[n],m.points.P),values.r);}}
 for(const x of [-3,0,3,6,8]){const m=I.model('chord-angles',{x,angle:20});assert(m.valid);near(m.values.product1,m.values.product2);near(d(m.points.C,m.points.O),5);near(d(m.points.D,m.points.O),5);}
 for(const distance of [0,1,3,4]){const m=I.model('chords-tangent',{distance});if(m.points.T)near(d(m.points.T,m.points.O),3);}
});
test('trigonometric, vector and minimization quantities follow coordinates',()=>{
 for(const angle of [30,60,90,120,150]){const m=I.model('dot-product',{angle,length:4});near(m.values.dot,m.points.A[0]*m.points.B[0]+m.points.A[1]*m.points.B[1]);}
 assert.equal(I.model('vector-scale',{scale:0}).values.direction,'none');assert.equal(I.model('vector-basis',{angle:0,x:2,y:1}).values.solutions,0);assert.equal(I.model('vector-basis',{angle:0,x:2,y:0}).values.solutions,'infinite');
 for(const angle of [0,45,90,120,180,270,360]){const m=I.model('trig-circle',{angle});near(m.values.sin**2+m.values.cos**2,1);}
 for(const angle of [110,230,330]){const m=I.model('sine-rule',{angle,radius:3});near(m.values.ratioA,6);near(m.values.ratioB,6);near(m.values.ratioC,6);}
 const optimum=I.model('symmetry-method',{x:-3/7});near(optimum.values.length,optimum.values.minimum);assert(I.model('symmetry-method',{x:2}).values.length>optimum.values.minimum);
});
test('12 new practice families have distinct mathematical situations and finite checkable results',()=>{
 assert.equal(P.ids.length,12);for(const id of P.ids){const kinds=new Set();for(let seed=0;seed<90;seed++){const t=P.task(id,seed);kinds.add(t.meta.learningType);assert(t.steps.length>=2);assert.equal(T.check(T.format(t.answer),t.answer).status,'correct',id);for(const s of t.steps)assert.equal(T.check(T.format(s.answer),s.answer).status,'correct',id+' step');assert(t.meta.scene?.points);}assert(kinds.size>=3,id);}
});
test('real parser rejects undefined intermediate expressions and preserves supported valid arithmetic',()=>{
 for(const [s,n] of [['-2^2',-4],['(-2)^2',4],['2^-2',.25],['14/4',3.5],['3,5',3.5],['sqrt(25)-3',2],['2*(3+4)',14],['0^2',0],['2^3^2',512]])near(T.number(s),n,s);
 for(const s of ['(1/0)^0','sqrt(-4)^0','1/(1/0)','0^0','0^-1','sqrt(-1)','1/(3-3)'])assert.equal(T.check(s,1).status,'domain',s);
 for(const s of ['2/','sqrt(2','abc','1..2'])assert.equal(T.check(s,1).status,'format',s);
 assert.equal(T.check('',1).status,'empty');assert.equal(T.check('2; -3',[2,-3]).status,'correct');assert.equal(T.check('не знаю','да').status,'format');assert.equal(T.check('нет','да').status,'wrong');
});

test('regular polygons retain every distinct vertex and their incircle radius for n=3…12',()=>{
 for(let n=3;n<=12;n++)for(const radius of [1,3,5]){const m=I.model('regular-polygons',{n,radius}),names=m.polygons[0],p=m.points;assert.equal(names.length,n);const side=d(p[names[0]],p[names[1]]);for(let i=0;i<n;i++){near(d(p[names[i]],p.O),radius);near(d(p[names[i]],p[names[(i+1)%n]]),side);}near(d(p.O,p.Q),m.values.r);near(area(names.map(n=>p[n])),n*side*m.values.r/2);}
});
test('named movements use one actual centre, vector or reflection axis; zero rotation is identity',()=>{
 for(const angle of [0,30,90,180]){const m=I.model('translation-rotation',{mode:'rotation',angle}),p=m.points,t=angle*Math.PI/180;for(const [a,b] of [['A','D'],['B','E'],['C','F']]){const u=sub(p[a],p.O),v=sub(p[b],p.O);near(d(p.O,p[a]),d(p.O,p[b]));near(v[0],u[0]*Math.cos(t)-u[1]*Math.sin(t));near(v[1],u[0]*Math.sin(t)+u[1]*Math.cos(t));}}
 const translated=I.model('translation-rotation',{mode:'translation',shift:-2});for(const [a,b] of [['A','D'],['B','E'],['C','F']])assert.deepEqual(sub(translated.points[b],translated.points[a]),[-2,1]);
 const reflected=I.model('movement',{mode:'reflection'});for(const [a,b] of [['A','D'],['B','E'],['C','F']]){near((reflected.points[a][0]+reflected.points[b][0])/2,4);near(reflected.points[a][1],reflected.points[b][1]);}
 for(const id of ['angles','measure-angle','angle-locus'])assert.equal(I.model(id,I.defaults(id)).rays.length,2,id);
 const boundary=I.model('chord-angles',{x:5,angle:20});near(boundary.values.product1,0);near(boundary.values.product2,0);assert(boundary.readout.some(s=>s.includes('P на окружности')));
});
