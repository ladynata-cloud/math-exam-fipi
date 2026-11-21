'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./inscribed-volume-applications.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const values = [[2,5,10/3,20/3],[2,1,1/3,8/3],[6,36,3/2,2/3],[2,8,96,12],[2,6/5,12/5,8/5],[5,4,21/8,13/6]];
const theories = ['theory-059','theory-059','theory-060','theory-059','theory-049','theory-059'];
const delta=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0);
const norm=v=>Math.hypot(...v);
const d=(a,b)=>norm(delta(a,b));
function near(a,b) {assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' versus '+b);}
function between(p,a,b){near(d(a,p)+d(p,b),d(a,b));}
function angle(a,o,b) {const v=delta(a,o),w=delta(b,o);return Math.acos(Math.max(-1,Math.min(1,dot(v,w)/(norm(v)*norm(w)))));}
function volumeCone(radius,height){return Math.PI*radius**2*height/3;}
function volumeBall(radius){return 4*Math.PI*radius**3/3;}
let fields=0;
for(let n=541;n<=546;n++){
  const id='ex-main-'+String(n).padStart(4,'0'),c=available.get(id),m=c.visualization.model,p=m.points;
  assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(manifest.parts[n],[null]);viewer.prepare(m);
  assert.deepEqual(c.source.printedPages,[140]);assert.deepEqual(c.source.pdfPages,[142]);
  for(const [i,s] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(values[n-541][i]),s.input.accepted).status,'correct',id+'/'+s.id);
    for(const bad of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(bad,s.input.accepted).status,'wrong');
    if(i===2)assert.equal(s.justifications[0].theoryId,theories[n-541]);fields++;
  }
  for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(delta(p[a],p[o]),delta(p[b],p[o])),0);
  if(n===541){
    const a=d(p.B,p.C),long=d(p.A,p.B),R=d(p.O,p.F),H=d(p.O,p.S);assert(a<long);
    for(const k of 'ABCD')near(d(p.O,p[k]),R);
    const phi=angle(p.B,p.O,p.C),theta=angle(p.O,p.K,p.S);
    near(Math.tan(phi/2),.5);near(theta,Math.PI/4);
    near(volumeCone(R,H),Math.PI*a**3*Math.tan(theta)/(24*Math.sin(phi/2)**2*Math.tan(phi/2)));
  }else if(n===542){
    const a=d(p.A,p.B),phi=angle(p.B,p.A,p.D),R=d(p.O,p.K),theta=angle(p.O,p.K,p.S);
    near(phi,Math.PI/6);near(theta,Math.PI/4);
    const verts=[p.A,p.B,p.C,p.D];
    for(let i=0;i<4;i++){
      const aPt=verts[i],bPt=verts[(i+1)%4],v=delta(bPt,aPt),w=delta(p.O,aPt),t=dot(w,v)/dot(v,v);
      assert(t>0&&t<1);near(norm(w.map((x,i)=>x-t*v[i])),R);near(d(aPt,bPt),a);
    }
    near(volumeCone(R,d(p.O,p.S)),Math.PI*a**3*Math.sin(phi)**3*Math.tan(theta)/24);
  }else if(n===543){
    const R=d(p.O,p.B),H=d(p.O,p.P);near(d(p.I,p.O),R);near(d(p.I,p.P),R);
    near(Math.PI*R*R*H/volumeBall(R),3/2);
  }else if(n===544||n===545){
    const r=d(p.O,p.F),h=d(p.O,p.S),ell=d(p.S,p.F),rho=d(p.I,p.O);
    between(p.T,p.S,p.F);near(d(p.I,p.T),rho);near(dot(delta(p.I,p.T),delta(p.F,p.S)),0);
    near(d(p.F,p.T),r);near(d(p.S,p.T),ell-r);near(r*h,rho*(r+ell));
    if(n===544){near(r,6);near(rho,3);near(volumeCone(r,h),96*Math.PI);}
    else{const radius=d(p.K,p.T);near(radius,r*(ell-r)/ell);near(2*Math.PI*radius,12*Math.PI/5);}
  }else{
    const large=d(p.O,p.B),small=d(p.P,p.C),h=d(p.O,p.P),rho=d(p.O,p.I);
    near(d(p.B,p.C),large+small);near(rho,Math.sqrt(large*small));near(d(p.I,p.T),rho);
    between(p.T,p.B,p.C);near(dot(delta(p.I,p.T),delta(p.B,p.C)),0);
    near(Math.PI*h*(large**2+large*small+small**2)/(3*volumeBall(rho)),21/8);
  }
}
let comparisons=0;
for(const a of [.5,2,3.5])for(const slope of [.25,.6,.9])for(const tangent of [.5,1.25]){
  const b=a/slope, r=Math.hypot(a,b)/2,h=b*tangent/2,phi=2*Math.atan(slope);
  near(volumeCone(r,h),Math.PI*a**3*tangent/(24*Math.sin(phi/2)**2*Math.tan(phi/2)));comparisons++;
}
for(const r of [1,2.5,6])for(const h of [.75,4,9]){
  const l=Math.hypot(r,h),rho=r*h/(r+l),t=h*(h-rho)/(l*l);
  near(r*t,r*(l-r)/l);near(Math.hypot(r*t,h*(1-t)-rho),rho);
  near(h,2*r*r*rho/(r*r-rho*rho));comparisons++;
}
for(const R of [2,4,8])for(const ratio of [.2,.4,.8]){
  const r=R*ratio,h=2*Math.sqrt(R*r),s=h/2;
  const disk=z=>Math.PI*(R+(r-R)*z/h)**2;
  const integral=h*(disk(0)+4*disk(h/2)+disk(h))/6;
  near(integral/volumeBall(s),(R*R+R*r+r*r)/(2*R*r));comparisons++;
}
assert.equal(fields,24);assert.equal(comparisons,36);
console.log('ATANASYAN_INSCRIBED_APPLICATIONS_OK: six source constructions, 24 fields, four independent incircle feet, common sphere tangencies and 36 angle/projection/disk checks');
