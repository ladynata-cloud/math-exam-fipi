'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./skew-lines-and-corner-reflection.json');
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
const unit=v=>mul(v,1/norm(v));
const angleCos=(a,b)=>Math.abs(dot(a,b))/(norm(a)*norm(b));
function skewLineDistance(a,b,c,d){const n=unit(cross(sub(b,a),sub(d,c)));return Math.abs(dot(sub(c,a),n));}
function distances(a,h){
  const A=[0,0,0],B=[a,0,0],C=[a/2,Math.sqrt(3)*a/2,0],S=[0,0,h];
  const t=h*h/(h*h+3*a*a/4),Y=mix(S,C,t),X=[Y[0],0,0];
  const link=sub(Y,X),line=sub(C,S);near(dot(link,sub(B,A)),0);near(dot(link,line),0);
  near(norm(link),skewLineDistance(A,B,C,S));
  near(angleCos(sub(B,A),line),a/(2*Math.hypot(a,h)));
  return norm(link)/a;
}
function checkUprights(a){
  const B=[0,0,0],C=[a,0,0],A=[a/2,Math.sqrt(3)*a/2,0],D=[0,0,a/Math.SQRT2],E=[a,0,a*Math.SQRT2];
  near(dot(sub(A,D),sub(E,D)),0);near(distance(A,D),distance(E,D));
  const faceCos=angleCos(normal(A,D,E),normal(A,B,C));
  near(faceCos,1/Math.sqrt(3));near(faceCos,area(A,B,C)/area(A,D,E));
}
function diagonalSquares(u,v,w){
  const vectors=[add(add(u,v),w),add(sub(v,u),w),sub(w,add(u,v)),add(sub(u,v),w)];
  return vectors.map(q=>dot(q,q));
}
function trace(entry,initial){
  let q=[...entry],d=[...initial];const events=[];
  near(q.reduce((a,b)=>a+b,0),1);assert(d.reduce((a,b)=>a+b,0)<0);
  for(let bounce=0;bounce<=3;bounce++){
    const candidates=[];
    for(let i=0;i<3;i++)if(d[i]<0)candidates.push({wall:i,t:-q[i]/d[i]});
    const sum=d.reduce((s,x)=>s+x,0);
    if(sum>0)candidates.push({wall:3,t:(1-q.reduce((s,x)=>s+x,0))/sum});
    const sorted=candidates.filter(c=>c.t>1e-9).sort((a,b)=>a.t-b.t);
    if(sorted.length>1&&Math.abs(sorted[0].t-sorted[1].t)<1e-8)return null;
    assert(sorted.length);
    const {wall,t}=sorted[0];q=add(q,mul(d,t));
    assert(q.every(x=>x>=-1e-8));assert(q.reduce((s,x)=>s+x,0)<=1+1e-8);
    if(wall!==3)d[wall]*=-1;
    events.push({wall,point:q,dir:[...d]});
    if(wall===3)return events;
  }
  assert.fail('a coordinate plane may be struck at most once');
}
let skewCases=0,parallelepipeds=0,rayCases=0,early=0,triple=0;
for(const a of [.3,.5,1,2,4,7])for(const ratio of [.25,.6,1,2,4]){
  const d=distances(a,a*ratio);if(ratio===1)near(d,Math.sqrt(3/7));checkUprights(a);skewCases++;
}
for(const x of [-2,0,1,4])for(const y of [-3,0,2])for(const z of [-1,0,3]){
  const u=[2,0,0],v=[x,2,0],w=[y,z,1];
  near(diagonalSquares(u,v,w).reduce((a,b)=>a+b,0),4*(dot(u,u)+dot(v,v)+dot(w,w)));parallelepipeds++;
}
for(const x of [.1,.2,.35])for(const y of [.16,.27,.41])for(const a of [1,1.8,3])for(const b of [.9,1.6,2.7])for(const c of [.6,1.4,2.5]){
  const initial=[-a,-b,-c],events=trace([x,y,1-x-y],initial);if(!events)continue;
  assert.equal(events.at(-1).wall,3);const hits=events.slice(0,-1).map(t=>t.wall);
  assert.equal(new Set(hits).size,hits.length);
  const reversed=distance(initial, mul(events.at(-1).dir,-1))<1e-8;
  assert.equal(reversed,hits.length===3);rayCases++;if(reversed)triple++;else early++;
}
assert(triple>0&&early>0);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0787','ex-main-0788','ex-main-0789','ex-main-0790']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const card=available.get(id),m=card.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(card.source.printedPages,[191]);assert.deepEqual(card.source.pdfPages,[193]);
  let expected;
  if(id.endsWith('787')){
    near(dot(sub(p.Y,p.X),sub(p.B,p.A)),0);near(dot(sub(p.Y,p.X),sub(p.C,p.S)),0);
    equal(p.Y,mix(p.S,p.C,4/7));equal(p.X,mix(p.A,p.B,2/7));equal(sub(p.A,p.J),sub(p.S,p.C));
    const d=skewLineDistance(p.A,p.B,p.S,p.C)/distance(p.A,p.B),cos=angleCos(sub(p.B,p.A),sub(p.C,p.S));
    assert.equal(engine.classifyAnswer(d+';'+cos,card.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer(cos+';'+d,card.answer.accepted).status,'wrong');
    expected=[cos,distance(p.S,p.Y)/distance(p.S,p.C),angleCos(sub(p.B,p.A),sub(p.C,p.T))];
  }else if(id.endsWith('788')){
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/угол при D прямой/u);
    near(distance(p.D,p.B),distance(p.A,p.B)/Math.SQRT2);near(distance(p.E,p.C),distance(p.A,p.B)*Math.SQRT2);
    near(dot(sub(p.A,p.D),sub(p.E,p.D)),0);assert(dot(sub(p.D,p.B),sub(p.E,p.C))>0);
    near(dot(sub(p.A,p.D),sub(p.T,p.D)),8);
    expected=['D',area(p.A,p.B,p.C)/area(p.A,p.D,p.E),8];
  }else if(id.endsWith('789')){
    assert.equal(card.answer.mode,'manual');const u=sub(p.B,p.A),v=sub(p.D,p.A),w=sub(p.E,p.A);
    const squares=[['A','G'],['B','H'],['C','E'],['D','F']].map(([a,b])=>distance(p[a],p[b])**2);
    for(const [i,x] of diagonalSquares(u,v,w).entries())near(x,squares[i]);
    const second=diagonalSquares(u,v,sub(p.E1,p.A));near(second[0],12);near(second[0],distance(p.A,p.G1)**2);
    expected=[squares[0],0,second.reduce((a,b)=>a+b,0)];
  }else{
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/после одного отражения/u);
    const first=trace(p.P,[-1,-1,-1]),second=trace(p.Q,[-3,-1,-1]);
    assert.deepEqual(first.map(e=>e.wall),[0,1,2,3]);assert.deepEqual(second.map(e=>e.wall),[0,3]);
    for(const [i,name] of [...'XYZR'].entries())equal(first[i].point,p[name]);
    for(const [i,name] of [...'ET'].entries())equal(second[i].point,p[name]);
    equal(first.at(-1).dir,[1,1,1]);equal(second.at(-1).dir,[3,-1,-1]);
    expected=[first[0].dir[0],3,second.at(-1).dir[1]];
  }
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,12);
console.log('ADVANCED_787_790_OK: twelve checked fields, '+skewCases+' variable skew models, '+parallelepipeds+' oblique boxes and '+rayCases+' finite first-hit optical paths ('+triple+' triple and '+early+' early exits).');
