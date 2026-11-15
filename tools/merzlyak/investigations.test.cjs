'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../../geometry-merzlyak/assets/investigations.js');
const course=require('../../geometry-merzlyak/data/course.json');
const id=short=>'merzlyak-'+(short[0]==='b'?'base-':'advanced-')+short.slice(1);
const value=(short,controls)=>api.evaluate(id(short),controls).values;
const close=(a,b,label='')=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' ≠ '+b);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const det=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const lengthToLine=(p,a,b)=>Math.abs(det(a,b,p))/distance(a,b);
const angleAt=(a,b,c)=>Math.atan2(Math.abs(det(b,a,c)),(a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y))*180/Math.PI;
const pointNamed=(r,label)=>r.scene.points.find(p=>p.label===label);
function finiteData(x,path='value') {
  if(typeof x==='number')assert.ok(Number.isFinite(x),path+' is finite');
  else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))finiteData(v,path+'.'+k);
}
function combinations(controls,index=0,current={},out=[]) {
  if(index===controls.length){out.push(current);return out;}
  const c=controls[index],values=c.type==='select'?c.options.map(o=>o.value):[...new Set([c.min,c.value,c.max])];
  for(const v of values)combinations(controls,index+1,{...current,[c.key]:v},out);
  return out;
}
test('84 explicit topic cards preserve course identity and have a usable comparison',()=>{
  assert.equal(course.units.length,84);assert.equal(Object.keys(api.specs).length,84);
  assert.deepEqual(Object.keys(api.specs).sort(),course.units.map(u=>u.id).sort());
  for(const unit of course.units) {
    const spec=api.get(unit.id);
    for(const key of ['title','question','action','observation','conclusion','proofNote'])assert.ok(spec[key]?.trim(),unit.id+': '+key);
    assert.ok(spec.choices.includes('Пока не знаю'),unit.id);
    assert.ok(spec.controls.length>0,unit.id);
    const original=api.evaluate(unit.id),variants=combinations(spec.controls);
    assert.ok(variants.some(c=>JSON.stringify(api.evaluate(unit.id,c).scene)!==JSON.stringify(original.scene)),unit.id+' permits a different geometric case');
  }
  assert.notEqual(api.get(id('b7-1')).family,'cevians');
  assert.equal(api.get(id('b7-8')).family,'congruence');
  assert.equal(api.get(id('b7-11')).family,'sss');
});
test('all control corners and selector modes have finite geometry or an explicit undefined case',()=>{
  let cases=0;
  for(const spec of Object.values(api.specs))for(const controls of combinations(spec.controls)) {
    const result=api.evaluate(spec.id,controls);cases++;
    finiteData(result.values,spec.id);finiteData(result.scene,spec.id);
    assert.ok(result.svg.startsWith('<svg'),spec.id);
    assert.ok(!/NaN|Infinity|undefined|<script|foreignObject/.test(result.svg),spec.id);
    assert.ok(result.readout.length>0,spec.id);
  }
  assert.ok(cases>500,'all corners: '+cases);
});
test('distinct points, segment order and angles retain their hypotheses',()=>{
  for(const a of [-90,-30,0,25,90]) {
    const coincident=value('b7-1',{d:0,angle:a});assert.equal(coincident.onBoth,true);assert.equal(coincident.possibleLines,'many');
  }
  assert.equal(value('b7-1',{d:4,angle:0}).onBoth,true);
  assert.equal(value('b7-1',{d:4,angle:25}).onBoth,false);
  for(const x of [-2,0,3,8,10]){const v=value('b7-2',{x});assert.equal(v.AB+v.BC===v.AC,x>=0&&x<=8);}
  for(const angle of [20,55,90,160]) {const v=value('b7-4',{angle});close(v.alpha+v.beta,180);close(v.alpha,v.vertical);}
});
test('congruence distinguishes insufficient data, SAS, ASA, SSS and degeneracy',()=>{
  const two=value('b7-8',{mode:'sides',angle:60,delta:20});close(two.first.b,two.second.b);close(two.first.c,two.second.c);assert.ok(Math.abs(two.first.a-two.second.a)>.1);
  const sas=value('b7-8',{mode:'sas',angle:90,delta:30});close(sas.first.a,Math.sqrt(41));close(sas.second.a,Math.sqrt(41));
  const asa=value('b7-8',{mode:'asa',angle:40});close(asa.first.A,40);close(asa.first.B,50);close(asa.first.C,90);close(asa.first.b,5*Math.cos(40*Math.PI/180));
  const up=api.evaluate(id('b7-11'),{base:6,side:'1'}),down=api.evaluate(id('b7-11'),{base:6,side:'-1'});
  for(const r of [up,down]){const A=pointNamed(r,'A'),B=pointNamed(r,'B'),C=pointNamed(r,'C');close(distance(A,C),5);close(distance(B,C),4);close(distance(A,B),6);}
  assert.ok(pointNamed(up,'C').y>0&&pointNamed(down,'C').y<0);
  for(const c of [0,1,9,10])assert.equal(value('a7-17',{base:c}).exists,false);
  assert.equal(value('a7-17',{base:8}).exists,true);
});
test('cevians, isosceles converse and triangle angle relationships are geometric',()=>{
  for(const x of [1,2,3,5]) {
    const r=api.evaluate(id('b7-7'),{x,height:4}),v=r.values;
    const A=pointNamed(r,'A'),B=pointNamed(r,'B'),C=pointNamed(r,'C'),M=pointNamed(r,'M'),H=pointNamed(r,'H'),D=pointNamed(r,'D');
    close(distance(A,M),distance(M,B));close((C.x-H.x)*(B.x-A.x)+(C.y-H.y)*(B.y-A.y),0);
    close(angleAt(A,C,D),angleAt(D,C,B));close(v.ratioADDB,distance(A,C)/distance(B,C));
    if(x!==3)assert.ok(distance(M,H)>0);
  }
  for(const a of [30,45,70]){const v=value('b7-10',{alpha:a,beta:a});close(v.a,v.b);}
  for(const x of [1,3,5]){const v=value('b7-16',{x,height:3});close(v.sum,180);close(v.exteriorB,v.A+v.C);}
});
test('right triangle projections, Pythagoras and trigonometric ratios agree independently',()=>{
  for(let angle=20;angle<=70;angle+=5) {
    const v=value('b8-15',{angle}),r=value('b8-16',{angle,hypotenuse:8});
    close(v.h*v.h,v.p*v.q);close(v.b*v.b,v.c*v.p);close(v.a*v.a,v.c*v.q);
    close(r.a*r.a+r.b*r.b,64);close(r.C,90);close(v.CM,3);
  }
  close(value('b7-18',{angle:30}).a,3);
  const small=value('b8-17',{angle:45,hypotenuse:4}),large=value('b8-17',{angle:45,hypotenuse:8});
  close(small.sin,Math.SQRT1_2);close(small.sin,large.sin);close(small.cos,large.cos);close(large.tan,1);
});
test('circle loci, tangency and ruler-compass cases count all intersections',()=>{
  assert.equal(value('b7-19',{distance:2}).location,'inside');assert.equal(value('b7-19',{distance:3}).location,'boundary');
  for(const [distance,count]of[[0,2],[2,2],[3,1],[4,0]])assert.equal(value('b7-20',{distance}).intersections,count);
  for(const [radius,count]of[[2,0],[3,1],[4,2]])assert.equal(value('b7-22',{radius}).count,count);
  const r=api.evaluate(id('b7-23'),{radius:4}),P=pointNamed(r,'P'),A=pointNamed(r,'A'),B=pointNamed(r,'B');
  close(distance(P,A),4);close(distance(P,B),4);close(P.x,0);
});
test('triangle centers have the defining distances; Euler circle is checked at actual midpoint coordinates',()=>{
  for(const x of [1,2,3,5])for(const height of [2,4,5]) {
    const r=api.evaluate(id('b7-21'),{x,height}),v=r.values,t=['A','B','C'].map(l=>pointNamed(r,l));
    for(const P of t)close(distance(v.circumcenter,P),v.circumradius);
    for(let i=0;i<3;i++)close(lengthToLine(v.incenter,t[i],t[(i+1)%3]),v.inradius);
    const ex=value('a7-23',{x,height});for(const d of ex.distances)close(d,ex.exradius);
    const eu=value('a8-17',{x,height});close(eu.GH,2*eu.OG);for(const d of eu.nineDistances)close(d,eu.nineRadius);
    close(eu.nineCenter.x,(eu.circumcenter.x+eu.orthocenter.x)/2);close(eu.nineCenter.y,(eu.circumcenter.y+eu.orthocenter.y)/2);
  }
});
test('quadrilateral properties and area are not substituted for one another',()=>{
  const rect=value('b8-4',{width:4,height:3});close(rect.diagonalAC,5);close(rect.diagonalBD,5);assert.equal(rect.square,false);
  const rhomb=value('b8-5',{angle:60});close(rhomb.diagonalDot,0);close(rhomb.area,8*Math.sqrt(3));assert.ok(Math.abs(rhomb.diagonalAC-rhomb.diagonalBD)>1);
  assert.equal(value('b8-6',{angle:90,ratio:1}).square,true);assert.equal(value('b8-6',{angle:90,ratio:1.5}).square,false);
  for(const shift of [-2,0,3]){const v=value('b8-21',{shift,height:4});close(v.area,24);}
  assert.ok(value('b8-3',{offset:1}).midpointGap>0);close(value('b8-3',{offset:0}).midpointGap,0);
  for(const shift of [0,1,3]){const v=value('b8-23',{top:4,height:3,shift});close(v.area,15);}
  assert.equal(value('b8-8',{top:6}).parallelBoth,true);
});
test('similarity, inscribed angles and quadrilateral circle criteria are distinct',()=>{
  for(const fraction of [.25,.5,.75]){const v=value('b8-7',{fraction,x:3});close(v.DE,6*fraction);close(v.parallelCross,0);}
  for(const k of [.5,1,2]){const v=value('b8-12',{scale:k});for(const ratio of v.ratios)close(ratio,k);close(v.areaRatio,k*k);}
  const bad=value('b8-14',{condition:'sides',scale:2,delta:20});assert.ok(Math.abs(bad.ratios[0]-2)>.1);close(bad.ratios[1],2);close(bad.ratios[2],2);
  for(const arc of [40,80,160])for(const vertex of [120,180,240])close(value('b8-9',{arc,vertex}).inscribed,arc/2);
  for(const shift of [-30,0,30]) {
    const cyclic=value('b8-10',{kind:'cyclic',shift});close(cyclic.oppositeAngles[0],180);close(cyclic.oppositeAngles[1],180);
    const tangent=value('a8-11',{shift});close(tangent.oppositeSides[0],tangent.oppositeSides[1]);
  }
});
test('trigonometry handles undefined endpoint ratios; cosine, sine and Heron have numeric oracles',()=>{
  assert.equal(value('b9-1',{angle:90}).tan,null);assert.equal(value('b9-1',{angle:0}).cot,null);assert.equal(value('b9-1',{angle:180}).cot,null);
  assert.ok(value('b9-1',{angle:120}).cos<0);assert.ok(value('b9-1',{angle:120}).sin>0);
  close(value('b9-2',{angle:60}).a,Math.sqrt(21));close(value('b9-2',{angle:90}).a,Math.sqrt(41));
  for(const angle of [30,60,90,140]){const v=value('b9-3',{angle});for(const ratio of v.sineRatios)close(ratio,2*v.R);}
  close(value('b9-5',{base:6}).heron,15*Math.sqrt(7)/4);
  const a=value('b9-7',{radius:2}),b=value('b9-7',{radius:4});close(b.circumference/a.circumference,2);close(b.area/a.area,4);
});
test('coordinates, linear equations and vectors retain correct endpoint and zero-vector semantics',()=>{
  const v=value('b9-8',{x:4,y:5});close(v.distance,Math.sqrt(52));close(v.M.x,1);close(v.M.y,3);
  const section=value('a9-8',{x:4,y:4,ratio:2});close(section.M.x,2);close(section.M.y,3);close(section.ratio,2);
  assert.equal(value('b9-9',{x:4,y:-1}).onCircle,true);assert.equal(value('b9-9',{x:1,y:-1}).onCircle,false);
  assert.equal(value('b9-10',{kind:'vertical',intercept:2}).slope,null);
  const sum=value('b9-14',{x:-1,y:2});assert.deepEqual([sum.sum.x,sum.sum.y],[2,3]);assert.deepEqual([sum.difference.x,sum.difference.y],[4,-1]);
  const components=value('b9-13',{ax:1,ay:-1,dx:3,dy:4}),moved=value('b9-13',{ax:-2,ay:2,dx:3,dy:4});
  assert.deepEqual([components.from.x,components.from.y,components.to.x,components.to.y],[1,-1,4,3]);
  assert.deepEqual([components.dx,components.dy],[3,4]);assert.notDeepEqual([components.dx,components.dy],[components.to.x,components.to.y]);
  assert.deepEqual([moved.dx,moved.dy],[3,4]);assert.deepEqual([moved.to.x,moved.to.y],[1,6]);
  for(const start of [[-3,2],[0,0],[2,-1]])for(const delta of [[3,4],[-2,3],[0,0]]){
    const c=value('b9-13',{ax:start[0],ay:start[1],dx:delta[0],dy:delta[1]});
    close(c.to.x-c.from.x,c.dx);close(c.to.y-c.from.y,c.dy);close(c.atOrigin.x,c.dx);close(c.atOrigin.y,c.dy);
    assert.equal(c.zero,delta[0]===0&&delta[1]===0);
  }
  const minus=value('b9-15',{factor:-2});assert.deepEqual([minus.scaled.x,minus.scaled.y],[-6,-2]);close(minus.length,2*Math.sqrt(10));
  close(value('b9-16',{angle:90,length:2}).dot,0);assert.equal(value('b9-16',{angle:90,length:0}).nonzero,false);
});
test('transformations are checked by all three pair distances, including a genuine non-movement',()=>{
  for(const [short,controls]of[['b9-17',{x:-2,y:3}],['b9-18',{axis:2}],['b9-19',{centerX:2,centerY:1}],['a9-22',{angle:90}]]) {
    const v=value(short,controls);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)close(distance(v.original[i],v.original[j]),distance(v.image[i],v.image[j]));
  }
  const central=value('b9-19',{centerX:2,centerY:1});for(let i=0;i<3;i++){close((central.original[i].x+central.image[i].x)/2,2);close((central.original[i].y+central.image[i].y)/2,1);}
  const turn=value('a9-22',{angle:90});for(let i=0;i<3;i++){close(turn.image[i].x,-turn.original[i].y);close(turn.image[i].y,turn.original[i].x);}
  const stretch=value('a9-18',{kind:'stretch'});assert.notEqual(stretch.length1,stretch.length2);
  for(const factor of [-2,-1,0,.5,2]){const v=value('b9-20',{factor});close(v.ratio,Math.abs(factor));close(v.areaRatio,factor*factor);}
});
test('spatial quantities use perpendicular height and distinguish sphere from cylinder graphics',()=>{
  const p=value('b9-21',{height:3});close(p.prismVolume,36);close(p.pyramidVolume,12);
  const a=value('b9-22',{kind:'sphere',radius:2,height:2}),b=value('b9-22',{kind:'sphere',radius:2,height:6});
  close(a.sphere,32*Math.PI/3);close(a.sphere,b.sphere);close(a.cylinder,8*Math.PI);close(a.cone,8*Math.PI/3);
  const sphere=api.evaluate(id('b9-22'),{kind:'sphere',radius:2,height:6}),cylinder=api.evaluate(id('b9-22'),{kind:'cylinder',radius:2,height:6});
  assert.equal(sphere.scene.shapes.filter(s=>s.kind==='circle').length,1);
  assert.notDeepEqual(sphere.scene,cylinder.scene);
});
test('Ceva, Menelaus and chord angles use actual incidence, including a parallel secant',()=>{
  for(const d of [.2,.4,.8])for(const f of [.2,.3,.8]) {
    const cv=value('a9-9-ceva',{d,f});close(cv.product,1);close(cv.sineProduct,1);
    const me=value('a8-8-menelaus',{d,f});
    if(Math.abs(d+f-1)<1e-9)assert.equal(me.valid,false);
    else {assert.equal(me.valid,true);close(me.product,1);close(me.collinear,0);assert.equal(me.outsideE,true);}
  }
  for(const a of [40,60,100])for(const b of [40,80,100])close(value('a8-9',{a,b}).actual,(a+b)/2);
});
test('radical axis and inversion explicitly exclude degenerate definitions',()=>{
  assert.equal(value('a9-9-radical',{distance:0}).valid,false);
  for(const y of [-3,0,3]){const v=value('a9-9-radical',{distance:4,y});close(v.power1,v.power2);close(v.x,21/8);}
  assert.ok(value('a9-9-radical',{distance:4,y:0}).power1<0);
  assert.equal(value('a9-9-inversion',{distance:0}).valid,false);
  for(const distance of [.5,1.5,3,6]){const v=value('a9-9-inversion',{distance,angle:60});close(v.distance*v.imageDistance,9);}
  close(value('a9-9-inversion',{distance:3}).imageDistance,3);
});
