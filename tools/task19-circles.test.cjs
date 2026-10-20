'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../trainers/task19-visual-models.js');
const source=require('../trainers/task19-visual-data.js');
const cards=source.cards.filter(c=>c.theme==='Окружность'||c.id==='summer-024');
const hints=Object.fromEntries(cards.map(c=>[c.id,c.hint]));
const circleModels=['circleRadii','circleLine','circleTangents','circlePair','circleCenter','radiusChord','equalCircleChords','circleRectangle','circleRhombus','circleMeasure'];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const dot=(a,b,c)=>(a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]);
function sample(model,params={}){return core.sample(model,params);}
function variants(model,params){const p=sample(model,params).values,controls=core.controlsFor(model,p),all=[p];for(const{key,min,max}of controls)for(const v of[min,(min+max)/2,max])all.push({...p,[key]:v});return all;}
function pointsFinite(points){for(const q of Object.values(points))for(const v of q)assert.ok(Number.isFinite(v));}

test('all 40 circle-theme cards have an actionable override',()=>{
  const expected=cards.map(c=>c.id).sort();
  assert.deepEqual(Object.keys(hints).sort(),expected);assert.equal(expected.length,40);
  for(const[id,h]of Object.entries(hints)){assert.ok(h.prompt.length>20,id);assert.ok(h.preserve,id);assert.ok(h.observe,id);assert.ok(core.modelNames.includes(h.model),`${id}: ${h.model}`);}
});

test('every new circle card keeps usable controls and finite rendering at control limits',()=>{
  for(const h of Object.values(hints)){if(!circleModels.includes(h.model))continue;const controls=core.controlsFor(h.model,h.params);assert.ok(controls.length);
    for(const v of variants(h.model,h.params)){const s=sample(h.model,v);pointsFinite(s.points);for(const n of Object.values(s.metrics))assert.ok(typeof n!=='number'||Number.isFinite(n),`${h.model} finite metric`);const r=core.render(h.model,s.values);assert.ok(r.svg.length>100);assert.ok(r.readout.length);assert.doesNotMatch(r.svg,/NaN|undefined|Infinity/);}
  }
});

test('radius endpoints stay on circle and diameters have the center as midpoint',()=>{
  for(const mode of['radii','diameter','twoDiameters'])for(const v of variants('circleRadii',{mode})){const {points:P,values:p}=sample('circleRadii',v);close(distance(P.O,P.A),p.radius);close(distance(P.O,P.B),p.radius);if(mode!=='radii'){close(distance(P.A,P.B),2*p.radius);close(P.A[0]+P.B[0],0);close(P.A[1]+P.B[1],0);}if(P.C){close(distance(P.C,P.D),2*p.radius);close(cross(P.A,P.B,P.O),0);close(cross(P.C,P.D,P.O),0);}}
});

test('tangent and secant controls preserve the premise, including extreme offsets',()=>{
  for(const mode of['tangent','secant'])for(const v of variants('circleLine',{mode})){const {points:P,metrics:M}=sample('circleLine',v);if(mode==='tangent'){close(distance(P.O,P.T),M.radius);close(dot(P.O,P.T,P.V),0);assert.equal(M.intersections,1);}else{close(distance(P.O,P.A),M.radius);close(distance(P.O,P.B),M.radius);close(cross(P.U,P.V,P.A),0);close(cross(P.U,P.V,P.B),0);assert.ok(distance(P.A,P.B)>0);assert.equal(M.intersections,2);}}
});

test('two tangents are equal and perpendicular to radii while P remains outside',()=>{
  for(const v of variants('circleTangents',{})){const {points:P,metrics:M}=sample('circleTangents',v);assert.ok(distance(P.O,P.P)>M.radius);close(distance(P.O,P.A),M.radius);close(distance(P.O,P.B),M.radius);close(dot(P.O,P.A,P.P),0);close(dot(P.O,P.B,P.P),0);close(distance(P.P,P.A),distance(P.P,P.B));assert.ok(distance(P.A,P.B)>0);}
});

test('intersecting circles remain intersecting, unequal radii give unequal center distances',()=>{
  for(const v of variants('circlePair',{mode:'intersecting',other:2})){const {points:P,metrics:M}=sample('circlePair',v);assert.equal(M.intersections,2);for(const q of[P.P,P.Q]){close(distance(P.O1,q),M.radius);close(distance(P.O2,q),M.other);}assert.ok(distance(P.P,P.Q)>0);}
  const s=sample('circlePair',{mode:'intersecting',other:2});assert.notEqual(s.metrics.O1P,s.metrics.O2P);
});

test('free-circle controls reach zero, one and two intersections without violating larger-radius premise',()=>{
  for(const mode of['greater','free']){const counts=new Set();for(let d=0;d<=11;d+=.1){const s=sample('circlePair',{mode,other:2,distance:d});assert.ok(s.metrics.radius>s.metrics.other);counts.add(s.metrics.intersections);}assert.deepEqual([...counts].sort(),[0,1,2]);}
});

test('equal chords have equal perpendicular distances; arbitrary crossing radius need not bisect',()=>{
  for(const v of variants('equalCircleChords',{})){const {points:P,metrics:M}=sample('equalCircleChords',v);for(const n of['A','B','C','D'])close(distance(P.O,P[n]),M.radius);close(distance(P.A,P.B),distance(P.C,P.D));close(distance(P.O,P.M),distance(P.O,P.N));close(dot(P.O,P.M,P.A),0);close(dot(P.O,P.N,P.C),0);}
  for(const v of variants('radiusChord',{})){const {points:P,metrics:M}=sample('radiusChord',v);close(distance(P.O,P.A),M.radius);close(distance(P.O,P.B),M.radius);close(distance(P.O,P.T),M.radius);close(cross(P.O,P.T,P.M),0);close(cross(P.A,P.B,P.M),0);assert.ok(P.M[0]>P.A[0]&&P.M[0]<P.B[0]);}
  assert.notEqual(sample('radiusChord').metrics.AM,sample('radiusChord').metrics.MB);close(sample('radiusChord',{position:0}).metrics.AM,sample('radiusChord',{position:0}).metrics.MB);
});

test('rectangle and rhombus circle experiments preserve their shape and distinguish counterexamples',()=>{
  for(const name of['circleRectangle','circleRhombus'])for(const mode of['incircle','circumcircle'])for(const v of variants(name,{mode})){const{points:P,metrics:M}=sample(name,v);close(cross(P.A,P.B,[P.C[0]-P.D[0],P.C[1]-P.D[1]]),0);if(name==='circleRectangle')close(dot(P.B,P.A,P.D),0);else close(distance(P.A,P.B),distance(P.A,P.D));
    for(const[n,a,b]of[['E','A','B'],['F','B','C'],['G','C','D'],['H','D','A']]){close(cross(P[a],P[b],P[n]),0);close(dot(P.O,P[n],P[a]),0);}
    if(mode==='circumcircle'){for(const n of['A','B','D'])close(distance(P.O,P[n]),M.radius);if(name==='circleRectangle')close(distance(P.O,P.C),M.radius);}else if(name==='circleRhombus')for(const n of['E','F','G','H'])close(distance(P.O,P[n]),M.radius);
  }
  const rectangle=sample('circleRectangle').metrics;assert.notEqual(rectangle.OE,rectangle.OF);assert.notEqual(rectangle.AB+rectangle.CD,rectangle.BC+rectangle.DA);
  const rhombus=sample('circleRhombus',{mode:'circumcircle'}).metrics;assert.notEqual(rhombus.OC,rhombus.radius);assert.notEqual(rhombus.oppositeAngleSum,180);
  close(sample('circleRhombus',{mode:'circumcircle',angle:90}).metrics.OC,sample('circleRhombus',{mode:'circumcircle',angle:90}).metrics.radius);
});

test('moving candidate center breaks equal distances; area scales quadratically and length linearly',()=>{
  close(sample('circleCenter',{x:0,y:0}).metrics.spread,0);for(const v of[{x:1,y:0},{x:0,y:1},{x:-2,y:2}])assert.ok(sample('circleCenter',v).metrics.spread>0);
  const a=sample('circleMeasure',{radius:1}).metrics,b=sample('circleMeasure',{radius:2}).metrics;close(b.area/a.area,4);close(b.length/a.length,2);assert.notEqual(sample('circleMeasure',{radius:3}).metrics.area,sample('circleMeasure',{radius:3}).metrics.comparison);
});
