'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./tangent-balls-cone-and-prism-ratios.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>Math.hypot(...v);
const near=(x,y)=>assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(x),Math.abs(y)),x+' versus '+y);
const equal=(a,b)=>near(norm(sub(a,b)),0);
const normal=(a,b,c)=>cross(sub(b,a),sub(c,a));
const area=(a,b,c)=>norm(normal(a,b,c))/2;
function projection(p,a,b,c) {
  const n=normal(a,b,c);
  return sub(p,mul(n,dot(sub(p,a),n)/dot(n,n)));
}
const distance=(a,b)=>norm(sub(a,b));
const volume=(a,b,c,d)=>Math.abs(dot(normal(a,b,c),sub(d,a)))/6;
const mix=(a,b,t)=>add(a,mul(sub(b,a),t));
function planeDistance(point,a,b,c) {
  const n=normal(a,b,c);
  return Math.abs(dot(n,sub(point,a)))/norm(n);
}
function supportCenters(a,b,c){
  const sizes=[a,b,c],d=2*Math.sqrt(a*b),u=2*Math.sqrt(a*c),v=2*Math.sqrt(b*c),x=(d*d+u*u-v*v)/(2*d),y2=u*u-x*x;
  if(y2< -1e-8)return null;
  const points=[[0,0,a],[d,0,b],[x,Math.sqrt(Math.max(0,y2)),c]];
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(distance(points[i],points[j]),sizes[i]+sizes[j]);
  return points;
}
function upperSpheres(R){
  const r=R/Math.sqrt(3),alt=Math.sqrt((R+r)**2-4*R*R/3);
  const A=[-R,0,R],B=[R,0,R],C=[0,Math.sqrt(3)*R,R],D=[0,-Math.sqrt(3)*R,R];
  const P=[0,r,R+alt],Q=[0,-r,R+alt];
  for(const base of [A,B,C])near(distance(P,base),R+r);
  for(const base of [A,B,D])near(distance(Q,base),R+r);
  assert(distance(P,D)>R+r && distance(Q,C)>R+r);
  near(distance(P,Q),2*r);near(distance(C,B),2*R);near(distance(D,B),2*R);near(distance(A,B),2*R);return r;
}
function coneRadius(lambda){return lambda/(Math.sqrt(3)*(2*(lambda-1)+Math.sqrt(3*lambda*lambda-6*lambda+4)));}
function coneFoot(lambda,k){
  const p=2/Math.sqrt(3),v=[0,0,lambda],b=[k,0,0],c=[p,0,1],dir=sub(b,v),t=dot(sub(c,v),dir)/dot(dir,dir),f=mix(v,b,t);
  return {f,t,distance:distance(f,c)};
}
function solveCone(lambda){
  const p=2/Math.sqrt(3),f=t=>Math.hypot(1,t)-(1-lambda)*t-p;
  let lo=0,hi=1;while(f(hi)<=0)hi*=2;
  for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(f(mid)>0)hi=mid;else lo=mid;}
  return lambda*(lo+hi)/2;
}
function prismRatios(A,B,C,w){
  const [a,b,c]=[A,B,C].map(p=>add(p,w)),M=mix(A,a,.5),X=mix(A,b,.5),Y=mix(A,c,.5);
  const prism=3*volume(A,B,C,a),small=volume(A,M,X,Y)+volume(a,M,X,Y);
  const top=volume(A,a,b,c)-small,bottom=volume(a,A,B,C)-small;
  return [small,bottom,top,prism-small-bottom-top].map(v=>v/prism);
}
let triples=0,cones=0,prisms=0;
for(const a of [1,4,9,20])for(const b of [.5,1,2.5,4].filter(x=>x<=a)){
  const threshold=a*b/(Math.sqrt(a)+Math.sqrt(b))**2;
  for(const c of [.9*threshold,threshold,(threshold+b)/2,b]){
    const got=supportCenters(a,b,c);assert.equal(!!got,c>=threshold);
    if(got && c===threshold)near(got[2][1]**2,0);
    triples++;
  }
}
for(const l of [.01,.1,.5,.99,1,1.5,1.99,2,2.01,3,10,100,1000]){
  const k=coneRadius(l);near(k,solveCone(l));
  const t=coneFoot(l,k);near(t.distance,1);assert(t.t>0&&t.t<1);
  near(2*l/Math.sqrt(3)-(l-1)*k,Math.hypot(l,k));cones++;
}
for(const shift of [-3,0,.5,4])for(const a of [1,2,7])for(const h of [.3,2,4,8]){
  const ratios=prismRatios([0,0,0],[a,0,0],[1,3,0],[shift,1-shift,h]);
  ratios.forEach((v,i)=>near(v,[1,3,3,5][i]/12));prisms++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0799','ex-main-0800','ex-main-0801','ex-main-0802']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const card=available.get(id),m=card.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(card.source.printedPages,[192]);assert.deepEqual(card.source.pdfPages,[194]);
  let expected;
  if(id.endsWith('799')){
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/вырожденный/u);
    for(const [i,k] of [...'ABC'].entries())near(p[k][2],m.spheres[i].radius);
    near(distance(p.A,p.C),6);near(distance(p.B,p.C),6);near(distance(p.A,p.B),8);near(distance(p.A,p.T),5);near(distance(p.B,p.T),5);
    near(norm(cross(sub(p.J,p.F),sub(p.G,p.F))),0);assert(p.J[0]>p.F[0]&&p.J[0]<p.G[0]);
    expected=[distance(p.F,p.H),1,36/25];
  }else if(id.endsWith('800')){
    for(const R of [.5,1,3,9,15])near(upperSpheres(R),R/Math.sqrt(3));
    const r=m.spheres[4].radius;
    for(const name of 'ABC')near(distance(p.P,p[name]),1+r);for(const name of 'ABD')near(distance(p.Q,p[name]),1+r);
    near(distance(p.P,p.Q),2*r);near(distance(p.F,p.G),2*r);near(distance(p.P,p.F),distance(p.Q,p.G));
    assert.equal(engine.classifyAnswer(String(r),card.answer.accepted).status,'correct');
    expected=[distance(p.C,p.O),distance(p.F,p.G),upperSpheres(3)];
  }else if(id.endsWith('801')){
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/λ=2/u);
    const k=distance(p.O,p.B);near(k,coneRadius(2));equal(p.F,coneFoot(2,k).f);
    const alt=distance(p.O,p.U);near(alt,coneRadius(1));equal(p.K,coneFoot(1,alt).f);
    near(distance(p.C,p.F),1);near(distance(p.C,p.K),1);near(distance(p.C,p.D),2);near(distance(p.D,p.E),2);
    expected=[distance(p.N,p.O),k,alt];
  }else{
    near(distance(p.M,mix(p.A,p.A1,.5)),0);equal(p.X,mix(p.A,p.B1,.5));equal(p.X,mix(p.B,p.A1,.5));equal(p.Y,mix(p.A,p.C1,.5));equal(p.Y,mix(p.C,p.A1,.5));
    const ratios=prismRatios(p.A,p.B,p.C,sub(p.A1,p.A));const scaled=ratios.map(x=>Math.round(12*x)).join(';');
    assert.equal(engine.classifyAnswer(scaled,card.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer('1;1;1;1',card.answer.accepted).status,'wrong');
    expected=[area(p.A,p.B,p.C)/area(p.M,p.X,p.Y),ratios[0],60*ratios[1]];
  }
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,12);console.log('ADVANCED_799_802_OK: twelve checked fields, '+triples+' threshold triangles, '+cones+' independently solved finite cones and '+prisms+' sheared or scaled triangular prisms.');
