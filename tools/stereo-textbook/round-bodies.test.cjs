'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bundle = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./round-bodies.json');
const sub = (a,b) => a.map((v,i) => v-b[i]);
const dot = (a,b) => a.reduce((sum,v,i)=>sum+v*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const close = (a,b) => assert(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)), a+' differs from '+b);
const distance = (a,b) => norm(sub(a,b));
function distanceToLine(x,a,b) { return norm(cross(sub(x,a),sub(b,a)))/distance(b,a); }
function checkStep(card,i,value) {
  assert.equal(engine.classifyAnswer(String(value),card.steps[i].input.accepted).status,'correct',card.id);
  assert.equal(engine.classifyAnswer(String(value+1),card.steps[i].input.accepted).status,'wrong',card.id);
}
const sourceParts={433:[null],434:[null],435:[null],436:['а','б','в'],437:[null],438:[null],439:['а','б','в']};
const {available,issues}=engine.inspectBundle(bundle.catalog,bundle.lessons);
assert.deepEqual(issues,[]);
const cards=[...available.values()].filter(c=>Object.hasOwn(manifest.cards,c.id));
assert.equal(cards.length,11);
for(const [n,parts] of Object.entries(sourceParts))
  assert.deepEqual(cards.filter(c=>c.source.exercise===n).map(c=>c.source.subpart||null),parts);
for(const card of cards) {
  const n=+card.source.exercise,part=card.source.subpart,m=card.visualization.model,p=m.points;
  assert.deepEqual(card.source.pdfPages,[117]);
  assert.deepEqual(card.source.printedPages,[115]);
  assert(card.steps.every(s=>s.justifications.length) && card.steps.some(s=>s.input));
  viewer.prepare(m);
  for(const view of Object.values(m.views)) for(const [x,o,y] of view.rightAngles||[])
    close(dot(sub(p[x],p[o]),sub(p[y],p[o])),0);
  const [inner,outer]=m.spheres;
  if(n<=434) {
    for(const f of m.faces) {
      const [a,b,c]=f.map(k=>p[k]);const normal=cross(sub(b,a),sub(c,a));
      close(Math.abs(dot(sub(inner.center,a),normal))/norm(normal),inner.radius);
    }
    for(const k of new Set(m.faces.flat())) close(distance(outer.center,p[k]),outer.radius);
    if(n===433) {
      const a=distance(p.A,p.B);
      close(distance(p.S,p.A),2*a);
      checkStep(card,1,inner.radius/a); checkStep(card,2,outer.radius/a);
      close(inner.radius/a,(3*Math.sqrt(5)-1)/(4*Math.sqrt(33)));
      close(outer.radius/a,2*Math.sqrt(33)/11);
    } else {
      close(inner.radius,2);close(outer.radius,5);
      for(const [a,h] of [[4*Math.sqrt(3),6],[4*Math.sqrt(2),8]]) {
        const q=a/2,ap=Math.hypot(q,h),radius=q*h/(q+ap),enclosing=(h*h+2*q*q)/(2*h);
        close(radius,2);close(enclosing,5);
      }
      checkStep(card,2,6);checkStep(card,3,4*Math.sqrt(2));
    }
    continue;
  }
  const base=distance(p.O,p.B),height=distance(p.O,p.P),radius=inner.radius,slant=distance(p.P,p.B);
  if(n===435) {
    close(distance(inner.center,p.O),radius);close(distance(inner.center,p.T),radius);
    close(distanceToLine(inner.center,p.B,p.D),radius);
    const ratio=4*radius**2/(2*base*(height+base));close(ratio,2/3);
    assert.equal(engine.classifyAnswer(String(ratio),card.answer.accepted).status,'correct');
  }
  if(n===436 || n===437) {
    close(distance(inner.center,p.O),radius);
    close(distanceToLine(inner.center,p.B,p.P),radius);
    if(n===436) {
      const angle=2*Math.atan(base/height);
      close(radius/base,Math.tan(Math.PI/4-angle/4));
      if(part==='в') {
        close(radius,1);close(base,Math.sqrt(3));close(angle*180/Math.PI,60);
      }
    } else {
      const alpha=Math.atan(height/base);
      close(base*(base+slant),radius**2*(1+1/Math.cos(alpha))/Math.tan(alpha/2)**2);
      checkStep(card,3,9);
    }
  }
  if(n>=438) {
    close(distance(inner.center,p.B),radius);close(distance(inner.center,n===438?p.D:p.P),radius);
    if(n===438) {
      close(height,2*base);
      assert.equal(engine.classifyAnswer(String(2*base*(height+base)/(4*radius**2)),card.answer.accepted).status,'correct');
    } else {
      const phi = 2*Math.atan(base/height);
      close(base,radius*Math.sin(phi));
      if(part==='в') {
        close(radius,2*base);checkStep(card,2,30);checkStep(card,3,150);
        for(const h of [2+Math.sqrt(3),2-Math.sqrt(3)])
          close((h*h+1)/(2*h),2);
      }
    }
  }
}
for(let height=1;height<=30;height++) for(let radius=1;radius<=18;radius++) {
  const slant=Math.hypot(height,radius),half=Math.atan(radius/height);
  const r=radius*height/(radius+slant),R=(height*height+radius*radius)/(2*height);
  close(r/radius,Math.tan(Math.PI/4-half/2));
  close(radius, R*Math.sin(2*half));
}
console.log('ATANASYAN_ROUND_BODIES_OK: 11 source parts, separate inscribed/circumscribed radii, both solutions of 434 and 439, 540 cone families');
