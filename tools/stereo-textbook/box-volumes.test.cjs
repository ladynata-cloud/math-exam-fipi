'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bundle = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./box-volumes.json');
const {available,issues} = engine.inspectBundle(bundle.catalog,bundle.lessons);
assert.deepEqual(issues,[]);
const cards=[...available.values()].filter(c=>Object.hasOwn(manifest.cards,c.id));
const sub = (a,b) => a.map((v,i) => v-b[i]);
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const norm = a => Math.hypot(...a);
const distance = (a,b) => norm(sub(a,b));
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const eq=(a,b)=>assert(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),a+' differs from '+b);
const sine=(a,b)=>norm(cross(a,b))/(norm(a)*norm(b));
const cosine=(a,b)=>dot(a,b)/(norm(a)*norm(b));
const answer=(c,v)=>{assert.equal(engine.classifyAnswer(String(v),c.answer.accepted).status,'correct',c.id);assert.equal(engine.classifyAnswer(String(v+1),c.answer.accepted).status,'wrong',c.id);};
assert.equal(cards.length,21);
const nParts={440:['а','б'],441:['а','б','в','г'],442:['а','б','в'],443:[null],444:[null],445:[null],446:[null],447:[null],448:[null],449:[null],450:['а','б'],451:[null]};
for(const [exercise,parts] of Object.entries(nParts))
  assert.deepEqual(cards.filter(c=>c.source.exercise===exercise).map(c=>c.source.subpart||null),parts);
assert.deepEqual(cards.filter(c=>c.kind==='theory').map(c=>c.source.point).sort(),['52','53']);
const expected441={'а':1980,'б':300,'в':1170*Math.sqrt(3),'г':16*Math.sqrt(5)/5};
const expected442={'а':432*Math.sqrt(2),'б':6*Math.sqrt(6),'в':8*Math.sqrt(5)/25};
for(const c of cards) {
  assert(c.steps.every(s=>s.justifications.length) && c.steps.some(s=>s.input));
  const m=c.visualization.model,p=m.points,n=+c.source.exercise,sp=c.source.subpart;
  viewer.prepare(m);
  for(const v of Object.values(m.views)) for(const [a,o,b] of v.rightAngles||[])
    eq(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
  const a=sub(p.B,p.A),b=sub(p.D||p.C,p.A),up=sub(p.A1,p.A);
  const x=norm(a),y=norm(b),h=norm(up);
  const prism=Math.abs(dot(cross(a,b),up))/(n===451?2:1);
  if(c.kind==='theory') {
    if(c.source.point==='52') {
      eq(prism,12);
      assert.equal(new Set(Object.values(p).map(q=>q.join(','))).size,36);
    }
    if(c.source.point==='53')eq(prism,15);
    continue;
  }
  assert.deepEqual(c.source.pdfPages,[n<=441?122:123]);
  if(n===440) {
    eq(prism,8);
    if(sp==='б') {
      const first=distance(p.LL,p.A), shared=distance(p.LL,p.KL);
      eq(shared/first,1/3);
    }
  }
  if(n===441){eq(prism,expected441[sp]);answer(c,prism);}
  if(n===442){
    if(sp==='а')eq(distance(p.A,p.C),12);
    if(sp==='б')eq(distance(p.A,p.C1),3*Math.sqrt(2));
    if(sp==='в'){eq(distance(p.D,p.E),1);eq(distance(p.A,p.E),x/2);}
    eq(prism,expected442[sp]);answer(c,prism);
  }
  if(n===443){eq(prism,1728);answer(c,Math.cbrt(prism));}
  if(n===444){eq(prism,1950);answer(c,prism*1.8/1000);}
  if(n===445){
    eq(distance(p.A,p.C1),13);eq(distance(p.B,p.D),12);eq(distance(p.B,p.C1),11);
    eq(prism,240*Math.sqrt(2));answer(c,prism);
  }
  if(n===446 || n===447 || n===448 || n===450) {
    const d=norm(sub(p.C1,p.A)), sinA=x/d, sinB=h/d;
    if(n===446){eq(d,18);eq(sinA,0.5);eq(cosine(sub(p.C1,p.A),up),1/Math.sqrt(2));eq(prism,729*Math.sqrt(2));answer(c,prism);}
    if(n===447) eq(prism,h**3*sinA*Math.sqrt(1-sinA**2-sinB**2)/sinB**2);
    if(n===448){eq(sinA,.5);eq(prism,x*y*Math.sqrt(3*x*x-y*y));}
    if(n===450) {
      if(sp==='а'){eq(d,1);eq(sine(sub(p.C1,p.A),sub(p.C,p.A)),1/Math.sqrt(2));eq(cosine(sub(p.C1,p.A),a),.5);eq(prism,Math.sqrt(2)/8);}
      else{eq(d,24);eq(cosine(sub(p.C1,p.A),up),1/Math.sqrt(2));eq(sinA,.5);eq(prism,1728*Math.sqrt(2));}
      answer(c,prism);
    }
  }
  if(n===449) {
    eq(distance(p.B,p.D),12);
    eq(cosine(sub(p.A,p.B),sub(p.D,p.B)),.5);
    eq(sine(sub(p.B1,p.D),sub(p.B,p.D)),1/Math.sqrt(2));
    eq(prism,432*Math.sqrt(3));answer(c,prism);
  }
  if(n===451){eq(x,35);eq(distance(p.B,p.C),37);eq(h,11);eq(prism,2310);answer(c,prism);}
}
for(let x=1;x<=12;x++)for(let y=1;y<=9;y++)for(let h=1;h<=6;h++){
  const d=Math.hypot(x,y,h), sinA=x/d,sinB=h/d;
  eq(h**3*sinA*Math.sqrt(1-sinA**2-sinB**2)/sinB**2,x*y*h);
}
console.log('ATANASYAN_BOX_VOLUMES_OK: points 52–53, all 19 numbered parts, dimensions, 648 angle families, signed triple products and exact answers');
