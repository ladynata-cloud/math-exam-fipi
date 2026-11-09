'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const T=require(root+'/geometry-merzlyak/assets/tasks.js');
const course=require(root+'/geometry-merzlyak/data/course.json');
const proofs=require(root+'/geometry-merzlyak/data/proofs.json');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const sorted=a=>[...a].sort((a,b)=>a-b);
const same=(a,b)=>sorted(a).every((v,i)=>Math.abs(v-sorted(b)[i])<1e-8);
const triangle=s=>{const a=sorted(s);assert.ok(a[0]>0&&a[0]+a[1]>a[2]);};
const answers={};
let checked=0;
for(const kind of ['similarity-definition','similarity-aa','similarity-sas-sss']){
 answers[kind]=new Set();
 for(let seed=0;seed<240;seed++){
  const t=T.task(kind,seed),m=t.meta;
  answers[kind].add(t.answer);
  assert.ok(T.equal(T.format(t.answer),t.answer));
  for(const step of t.steps)assert.ok(T.equal(T.format(step.answer),step.answer));
  if(m.skill==='correspondence'){
   const mapped=[...m.side].map(v=>m.order[1][m.order[0].indexOf(v)]).join('');
   assert.equal(t.answer,mapped);
  }
  if(m.skill==='scale'){
   triangle(m.small);triangle(m.large);
   near(t.answer/m.small[1],m.large[0]/m.small[0]);
  }
  if(m.skill==='angle-invariance'){
   assert.ok(m.angle>0&&m.angle<180&&m.k>1);
   assert.equal(t.answer,seed%4===2?m.angle:'нет');
  }
  if(m.skill==='aa-insufficient'){
   const a=m.angles1[0],first=[a,60,120-a],other=[a,65,115-a];
   assert.ok(!same(first,other)); // Both sets obey the given one-angle equality.
   near(first.reduce((a,b)=>a+b),180);near(other.reduce((a,b)=>a+b),180);
   assert.equal(t.answer,'недостаточно данных');
  }else if(m.angles1){
   for(const angles of [m.angles1,m.angles2]){
    assert.ok(angles.every(a=>a>0&&a<180));
    near(angles.reduce((a,b)=>a+b),180);
   }
   if(m.skill==='aa-correspondence'){
    assert.equal(t.answer,'DEF'[m.angles2.indexOf(m.angles1[m.vertex])]);
   }else assert.equal(t.answer,same(m.angles1,m.angles2)?'да':'нет');
  }
  if(m.skill==='sas'){
   assert.ok(m.included);
   // Recover the unprovided side independently using the cosine rule.
   const third=(s,a)=>Math.sqrt(s[0]**2+s[1]**2-2*s[0]*s[1]*Math.cos(a*Math.PI/180));
   const ratio=m.sides2[0]/m.sides1[0];
   near(m.sides2[1]/m.sides1[1],ratio);
   near(third(m.sides2,m.angles[1])/third(m.sides1,m.angles[0]),ratio);
   assert.equal(t.answer,'да');
  }
  if(m.skill.startsWith('sss-')){
   triangle(m.sides1);triangle(m.sides2);
   const a=sorted(m.sides1),b=sorted(m.sides2),ratios=b.map((v,i)=>v/a[i]);
   assert.equal(t.answer,ratios.every(r=>Math.abs(r-ratios[0])<1e-8)?'да':'нет');
  }
  if(m.skill==='ssa-insufficient'){
   assert.equal(m.included,false);
   // AB and AC with angle B=30° allow two positive intersections of
   // ray BC with the circle centred at A and radius AC.
   const lengths=s=>{
    const [ab,ac]=s,cos=Math.cos(Math.PI/6),sin=.5;
    const delta=Math.sqrt(ac*ac-ab*ab*sin*sin);
    return [ab*cos-delta,ab*cos+delta];
   };
   const d1=lengths(m.sides1),d2=lengths(m.sides2),ratio=m.sides2[0]/m.sides1[0];
   for(const d of d1){
    triangle([...m.sides1,d]);
    near((m.sides1[0]**2+d*d-m.sides1[1]**2)/(2*m.sides1[0]*d),Math.cos(Math.PI/6));
   }
   near(d2[0]/d1[0],ratio); // A similar pair exists.
   assert.ok(Math.abs(d2[1]/d1[0]-ratio)>1e-3); // A different valid form also exists.
   assert.equal(t.answer,'недостаточно данных');
  }
  checked++;
 }
}
for(const kind of ['similarity-aa','similarity-sas-sss'])
 for(const answer of ['да','нет','недостаточно данных'])assert.ok(answers[kind].has(answer),`${kind}: missing ${answer}`);

const ids=['merzlyak-base-8-12','merzlyak-base-8-13','merzlyak-base-8-14'];
const units=ids.map(id=>course.units.find(u=>u.id===id));
assert.equal(new Set(units.map(u=>u.calc)).size,3);
assert.equal(new Set(units.map(u=>u.proof)).size,3);
for(const u of units){
 assert.equal(u.contentVersion,2);
 for(const s of u.source){
  assert.equal(s.unit,u.id);
  assert.equal(course.sources.find(x=>x.track===s.track&&x.grade===s.grade&&x.point===s.point).unit,u.id);
 }
 const html=fs.readFileSync(root+'/geometry-merzlyak/atlas/'+u.id+'.html','utf8');
 const config=JSON.parse(html.match(/window\.COURSE_CONFIG=(.*?);<\/script>/s)[1]);
 assert.deepEqual(config.unit,u);
 assert.deepEqual(config.proof,proofs[u.proof]);
 assert.equal(config.investigation,u.investigation);
 assert.ok(html.includes('/assets/assistant/navigator-widget.js'));
}
assert.equal(course.sources.find(s=>s.track==='advanced'&&s.grade===8&&s.point===15).unit,ids[1]);
assert.equal(course.sources.find(s=>s.track==='advanced'&&s.grade===8&&s.point===18).unit,ids[2]);
// The II/III proof uses only AA similarity and SAS/SSS congruence, rather than
// assuming the similarity criterion that it is meant to establish.
const proof=proofs['similarity-sas-sss'];
assert.match(proof.steps[0].text,/При k=1 положим M=E, N=F/);
assert.match(proof.steps[0].text,/При k≠1/);
assert.match(proof.steps[1].reason,/При k=1 это один и тот же треугольник/);
assert.match(proof.steps[1].reason,/При k≠1/);
// In the construction D=(0,0), E=(4,0), F=(1,3). At k=1 the
// triangles coincide; only k!=1 gives distinct parallel lines MN and EF.
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const length=a=>Math.hypot(...a);
const e=[4,0],f=[1,3],ef=sub(f,e);
for(const k of [.25,.5,1,2,3]){
 const m=e.map(x=>k*x),n=f.map(x=>k*x),mn=sub(n,m);
 assert.ok(cross(m,n)>0); // Positive scale keeps a nondegenerate triangle.
 near(length(m)/length(e),k);
 near(length(n)/length(f),k);
 near(length(mn)/length(ef),k);
 near(cross(mn,ef),0);
 if(k===1){assert.deepEqual(m,e);assert.deepEqual(n,f);}
 else assert.ok(Math.abs(cross(sub(m,e),ef))>1e-8);
}
assert.ok(proof.steps.some(s=>s.reason.includes('первый признак')));
assert.ok(proof.steps.some(s=>s.reason.includes('первый признак равенства')));
assert.ok(proof.steps.some(s=>s.reason.includes('третий признак равенства')));
const done=new Set();
for(const s of proof.steps){assert.ok(s.depends.every(id=>done.has(id)));done.add(s.id);}
console.log(JSON.stringify({status:'PASS',families:3,mathematicalCases:checked,sourcePages:units.length}));
