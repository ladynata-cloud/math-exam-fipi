'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../../geometry-course/assets/proof-diagrams.js');
const T=require('../../geometry-course/assets/task-diagrams.js');
const G=require('../../geometry-course/assets/tasks.js');
const C=require('../../geometry-course/data/course.json');
const P=require('../../geometry-course/data/proofs.json');
const NP=require('../../geometry-course/assets/practice.js');
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),len=p=>Math.hypot(...p),dist=(a,b)=>len(sub(a,b));
const near=(a,b,msg='')=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${msg}: ${a} != ${b}`);
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const area=(a,b,c)=>Math.abs(cross(sub(b,a),sub(c,a)))/2;
const angle=(a,o,b)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,o),sub(b,o))/(dist(a,o)*dist(b,o)))))*180/Math.PI;
const numbers=q=>(q.replace(/[−–]/g,'-').match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);

test('every actual proof and all 63 task units have accessible finite coordinate drawings',()=>{
  for(const [id,p]of Object.entries(P)){
    assert(D.supports(id),id);
    for(let s=0;s<=p.steps.length;s++){const html=D.figure(id,s);assert.match(html,/svg[^>]*role="img"[^>]*aria-label=/);assert(!/NaN|Infinity|undefined/.test(html),id+' step '+s);}
  }
  for(const unit of C.units){assert(T.supports(unit.id),unit.id);for(let seed=0;seed<105;seed++){
    const task=G.task(unit.calc,seed),m=T.model(unit,task),html=T.figure(unit,task);
    assert(m,unit.id);assert.match(html,/data-figure-kind="practice"/);assert(!/NaN|Infinity|undefined/.test(html),unit.id+' '+seed);
    for(const [name,point]of Object.entries(m.points))assert(point.length===2&&point.every(Number.isFinite),unit.id+' '+name);
  }}
});

test('proof diagrams satisfy their stated incidences, distances and right angles',()=>{
  let p=D.model('hyp-median',1).points;near(dot(sub(p.A,p.C),sub(p.B,p.C)),0);near(angle(p.B,p.A,p.C),30);near(dist(p.A,p.B),dist(p.A,p.D));near(dist(p.A,p.B),dist(p.B,p.D));
  p=D.model('projection').points;near(dot(sub(p.A,p.C),sub(p.B,p.C)),0);near(dot(sub(p.C,p.H),sub(p.B,p.A)),0);near(dist(p.C,p.H)**2,dist(p.A,p.H)*dist(p.H,p.B));
  p=D.model('trapezoid',3).points;near(cross(sub(p.N,p.M),sub(p.D,p.A)),0);near(dist(p.M,p.N),(dist(p.A,p.D)+dist(p.B,p.C))/2);near(dist(p.M,p.K),dist(p.B,p.C)/2);near(dist(p.K,p.N),dist(p.A,p.D)/2);
  p=D.model('centers',1).points;near(dist(p.O,p.A),dist(p.O,p.B));near(dist(p.O,p.B),dist(p.O,p.C));
  p=D.model('heron').points;near(dist(p.A,p.C),13);near(dist(p.A,p.B),14);near(dist(p.B,p.C),15);near(area(p.A,p.B,p.C),84);
  p=D.model('centroid',1).points;near(dist(p.A,p.G),2*dist(p.G,p.M));near(dist(p.B,p.G),2*dist(p.G,p.N));
  p=D.model('chords',2).points;for(const n of ['A','B','C','D'])near(dist(p.O,p[n]),3);near(dist(p.P,p.A)*dist(p.P,p.B),dist(p.P,p.C)*dist(p.P,p.D));assert(dist(p.O,p.P)>0,'intersection is not artificially restricted to center');
  p=D.model('inscribed').points;for(const n of ['A','B','C'])near(dist(p.O,p[n]),3);near(angle(p.A,p.C,p.B),angle(p.A,p.O,p.B)/2);near(dist(p.C,p.B),6);
  p=D.model('pythagoras').points;const names=['P','Q','R','S'];for(let i=0;i<4;i++){const a=p[names[i]],b=p[names[(i+1)%4]],c=p[names[(i+2)%4]];near(dist(a,b),5);near(dot(sub(a,b),sub(c,b)),0);}
});

test('auxiliary objects appear at the relevant proof step, not before',()=>{
  assert(!D.model('tangent',0).points.P);let p=D.model('tangent',1).points;assert(p.P);near(dot(sub(p.O,p.T),sub(p.P,p.T)),0);assert(dist(p.P,p.O)>dist(p.O,p.T));
  assert(!D.model('hyp-median',0).points.D);assert(D.model('hyp-median',1).points.D);
  assert(!D.model('area-triangle',0).points.D);assert(D.model('area-triangle',1).points.D);
  assert(!D.model('reflection-path',0).points['B′']);assert(D.model('reflection-path',1).points['B′']);assert(!D.model('reflection-path',2).points['M₀']);assert(D.model('reflection-path',3).points['M₀']);
  assert.equal(D.model('triangle-sum',0).segments.length,0);assert.equal(D.model('triangle-sum',1).segments.length,1);
  assert.equal(D.model('centers',0).circles.length,0);assert.equal(D.model('centers',2).circles.length,0);assert.equal(D.model('centers',3).circles.length,1);
  assert.equal(D.model('iso',2).rightAngles.length,0);assert.equal(D.model('iso',3).rightAngles.length,1);
  assert.equal(D.model('polygon-scale',0).segments.length,0);assert.equal(D.model('polygon-scale',1).segments.length,2);assert.equal(D.model('polygon-scale',2).segments.length,4);
  assert(!D.model('circles-intersection',0).points.X);assert(D.model('circles-intersection',1).points.X);assert(!D.model('circles-intersection',2).points['X′']);assert(D.model('circles-intersection',3).points['X′']);
});

test('old numeric task diagrams use the condition numbers with correct geometry across variants',()=>{
  const byCalc=Object.fromEntries(C.units.map(u=>[u.calc,u]));
  for(let seed=0;seed<105;seed++){
    const get=kind=>{const t=G.task(kind,seed);return {p:T.model(byCalc[kind],t).points,n:numbers(t.question),t};};
    let {p,n}=get('pythagoras');near(dot(sub(p.A,p.C),sub(p.B,p.C)),0);near(dist(p.A,p.B),n[0]);near(dist(p.A,p.C),n[1]);
    ({p,n}=get('heron'));near(dist(p.B,p.C),n[0]);near(dist(p.A,p.C),n[1]);near(dist(p.A,p.B),n[2]);
    ({p,n}=get('projection'));near(dot(sub(p.A,p.C),sub(p.B,p.C)),0);near(dist(p.A,p.H),n[0]);near(dist(p.B,p.H),n[1]);
    ({p,n}=get('tangent'));near(dist(p.P,p.A),n[0]);near(dist(p.P,p.B),n[0]);near(dot(sub(p.O,p.A),sub(p.P,p.A)),0);near(dot(sub(p.O,p.B),sub(p.P,p.B)),0);
    ({p,n}=get('distance'));near(dist(p.P,p.H),n[0]);near(dist(p.P,p.A),n[1]);near(dot(sub(p.P,p.H),sub(p.A,p.H)),0);
    ({p,n}=get('area-parallelogram'));near(dist(p.A,p.B),n[0]);near(dist(p.D,p.H),n[1]);near(dist(p.A,p.D),n[2]);near(dot(sub(p.D,p.H),sub(p.B,p.A)),0);
    ({p,n}=get('inradius'));near(dist(p.I,p.H),n[0]);near(dist(p.I,p.K),n[0]);near(dist(p.I,p.L),n[0]);near(dot(sub(p.I,p.H),sub(p.B,p.A)),0);
    ({p,n}=get('inscribed'));near(angle(p.A,p.C,p.B),n[0]/2);
    ({p,n}=get('chord-angle'));near(angle(p.B,p.P,p.D),(n[0]-n[1])/2);assert(dist(p.P,p.O)>3);
    ({p,n}=get('cyclic'));near(angle(p.B,p.A,p.D),n[0]);near(angle(p.B,p.C,p.D),180-n[0]);
    ({p,n}=get('right30'));near(dist(p.A,p.B),n[0]);near(angle(p.C,p.A,p.B),30);
    ({p,n}=get('area-sine'));near(dist(p.A,p.B),n[0]);near(dist(p.A,p.C),n[1]);near(angle(p.B,p.A,p.C),n[2]);
    ({p,n}=get('trig'));near(dist(p.A,p.C),n[0]);near(dist(p.B,p.C),n[1]);near(dist(p.A,p.B),n[2]);
    ({p,n}=get('locus'));near(dist(p.P,p.H),n[0]);near(dist(p.P,p.K),n[0]);near(dot(sub(p.P,p.H),sub(p.A,p.O)),0);near(dot(sub(p.P,p.K),sub(p.B,p.O)),0);
    ({p,n}=get('centroid'));near(dist(p.A,p.M),n[0]);near(dist(p.A,p.G),2*dist(p.G,p.M));
  }
});

test('condition rendering does not read the expected answer or expose a future image',()=>{
  const u=C.units.find(x=>x.id==='coordinates'),t=G.task(u.calc,1),html=T.figure(u,t),different={...t,answer:'FORBIDDEN_ANSWER_SENTINEL',steps:[{answer:'FORBIDDEN_STEP_SENTINEL'}]};
  assert.equal(T.figure(u,different),html);
  assert(!html.includes('FORBIDDEN'));
  const custom={question:'Дано AB; найти длину.',answer:999,meta:{scene:{points:{A:[0,0],B:[4,0]},segments:[['A','B',{arrow:true}]],labels:[{at:[2,1],text:'AB = ?'}]}}};
  assert.match(T.figure(u,custom),/AB = \?/);assert(!T.figure(u,custom).includes('999'));
});

test('new proof models preserve transformation, circle and decomposition conditions',()=>{
  let p=D.model('rigid-equality').points;near(dist(p.A,p.B),dist(p.C,p.D));
  p=D.model('circles-intersection',3).points;for(const n of ['X','X′']){near(dist(p.O,p[n]),3);near(dist(p.P,p[n]),2);}
  p=D.model('polygon-scale',1).points;for(const[a,b]of [['A','B'],['B','C'],['C','D'],['D','E'],['E','A']])near(dist(p[a+'′'],p[b+'′'])/dist(p[a],p[b]),1.3);
  p=D.model('angle-name').points;near(angle(p.A,p.O,p.B),angle(p.P,p.O,p.Q));
  p=D.model('circles-intersection',4).points;near(dist(p.O,p.X),3);near(dist(p.P,p.X),2);near(dist(p.O,p.P),5);near(dist(p['O₂'],p['X₂']),3);near(dist(p['P₂'],p['X₂']),2);near(dist(p['O₂'],p['P₂']),1);
  const m=D.model('circles-intersection',5);near(dist(m.points.O,m.points.P),0);near(dist(m.points['O₂'],m.points['P₂']),0);assert.equal(m.circles[0].radius,m.circles[1].radius);assert.notEqual(m.circles[2].radius,m.circles[3].radius);
  p=D.model('triangle-solvability',4).points;near(dist(p.A,p.B),5);near(dist(p.A,p.C),4);near(dist(p.B,p.C),3);near(dot(sub(p.A,p.C),sub(p.B,p.C)),0);near(dist(p.D,p.F),3);near(dist(p.F,p.E),4);near(dist(p.D,p.E),7);
});

test('authored scenes reveal constructions by step without mutating the saved condition',()=>{
  const unit={id:'symmetry-method'},task={question:'Найти кратчайший путь.',answer:'SECRET_EXPECTED_VALUE',meta:{scene:{
    points:{A:[0,3],B:[6,4],M:[1,0]},segments:[['A','M'],['M','B']],
    reveals:[
      {step:1,points:{D:[6,-4]},pointLabels:{D:'B′'},segments:[['B','D',{dashed:true}]]},
      {step:2,removePoints:['M'],points:{M0:[18/7,0]},pointLabels:{M0:'M₀'},replace:{segments:[['A','D']]}}
    ]
  }}};
  const saved=JSON.stringify(task),initial=T.model(unit,task),first=T.model(unit,task,{step:1}),second=T.model(unit,task,{step:2});
  assert(!initial.points.D);assert(!initial.points.M0);assert.equal(initial.segments.length,2);
  assert(first.points.D);assert(!first.points.M0);assert.equal(first.segments.length,3);
  assert(!second.points.M);assert(second.points.M0);assert.equal(second.segments.length,1);
  assert.match(T.figure(unit,task,{step:1}),/>B′<\/text>/);assert(!T.figure(unit,task).includes('B′'));
  assert.equal(JSON.stringify(task),saved);assert.deepEqual(T.model(unit,task),initial,'returning to condition hides later work');
  assert(!T.figure(unit,task,{step:2}).includes('SECRET_EXPECTED_VALUE'));
});

test('diagram content is escaped and every point label remains inside the SVG viewBox',()=>{
  const html=T.figure({id:'segments'},{question:'<script>condition</script>',answer:'hidden',meta:{scene:{points:{A:[0,0],B:[1,0]},segments:[['A','B']],pointLabels:{A:'<script>label</script>'},labels:[{at:[0,1],text:'<img onerror="unsafe">'}]}}});
  assert(!html.includes('<script>'));assert(!html.includes('<img '));assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);
  for(const id of D.proofIds.filter(id=>!D.legacy.proofIds.includes(id)))for(let step=0;step<=5;step++){
    const text=D.figure(id,step);for(const match of text.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"/g)){const x=Number(match[1]),y=Number(match[2]);assert(x>=0&&x<=360&&y>=0&&y<=230,`${id}: label at ${x},${y}`);}
  }
});

test('all new practice families render the actual condition and each guided construction',()=>{
  for(const id of NP.ids)for(let seed=0;seed<105;seed++){
    const unit=C.units.find(u=>u.id===id),task=NP.task(id,seed),saved=JSON.stringify(task);
    assert.deepEqual(T.model(unit,task).points,task.meta.scene.points,`${id}: initial points differ`);
    for(let step=0;step<=task.steps.length;step++){
      const html=T.figure(unit,task,{step});assert.match(html,/svg[^>]*role="img"[^>]*aria-label=/);assert(!/NaN|Infinity|undefined/.test(html),`${id}: ${seed}, step ${step}`);
    }
    assert.equal(JSON.stringify(task),saved,`${id}: condition was mutated`);
    assert.equal(T.figure(unit,{...task,answer:'NO_ANSWER_IN_DIAGRAM',steps:[]}),T.figure(unit,task));
  }
});

test('new practice scenes preserve the numerical givens, transformations and limiting cases',()=>{
  const get=(id,seed,step=0)=>T.model({id},NP.task(id,seed),{step}).points;
  for(let seed=0;seed<105;seed++){
    const n=Math.floor(seed/3),k=1+n%5,x=2+n%7,v=seed%3;
    let p=get('triangle-sas',seed);near(dist(p.A,p.B),dist(p.D,p.E));near(dist(p.A,p.C),dist(p.D,p.F));
    if(v===0){near(dist(p.A,p.B),x);near(dist(p.A,p.C),x+1);near(dist(p.B,p.C),x+2);near(angle(p.B,p.A,p.C),angle(p.E,p.D,p.F));}
    p=get('triangle-signs',seed);if(v===1){near(dist(p.A,p.B),x);near(dist(p.A,p.C),x+1);near(dist(p.B,p.C),x+2);}if(v===2){near(dist(p.D,p.E),2*dist(p.A,p.B));near(angle(p.B,p.A,p.C),angle(p.E,p.D,p.F));}
    p=get('pythagoras',seed);const lengths=[dist(p.A,p.B),dist(p.A,p.C),dist(p.B,p.C)].sort((a,b)=>a-b),expected=([[5,12,13],[3,4,5],[3,4,6]][v]).map(a=>a*k);lengths.forEach((a,i)=>near(a,expected[i]));if(v<2)near(dot(sub(p.A,p.C),sub(p.B,p.C)),0);
    p=get('heron',seed);if(v===0)near(area(p.A,p.B,p.C),84*k*k);if(v===1)near(area(p.A,p.B,p.C),12*k*k);if(v===2){near(area(p.A,p.B,p.C),0);near(dist(p.A,p.C),3*k);near(dist(p.C,p.B),4*k);}
    p=get('trig-right',seed);near(dist(p.A,p.C),4*k);near(dist(p.B,p.C),3*k);near(dist(p.A,p.B),5*k);
    p=get('trig-circle',seed);near(dist(p.O,p.P),1);assert.equal(Math.sign(p.P[0]),v===2?1:-1);assert.equal(Math.sign(p.P[1]),v===0?1:-1);
    p=get('movement',seed);if(v===0){near(dist(p.A,p.B),dist(p.A1,p.B1));near(p.A1[0]-p.A[0],x);near(p.A1[1]-p.A[1],-k);}if(v===1){near(dist(p.A,p.B),x);near(dist(p.A1,p.B1),(k+1)*x);for(const name of ['A','B'])for(let i=0;i<2;i++)near(p[name+'1'][i],p[name][i]*(k+1));}if(v===2){near(p.A[0],p.A1[0]);near(p.A[1],-p.A1[1]);}
    p=get('dot-product',seed);if(v===0){near(dist(p.O,p.A),x);near(dist(p.O,p.B),2*k);near(angle(p.A,p.O,p.B),60);}if(v===1)near(dot(sub(p.A,p.O),sub(p.B,p.O)),2*k-x);if(v===2)near(dot(sub(p.A,p.O),sub(p.B,p.O)),0);
    p=get('solve-triangle',seed,2);if(v===0)assert(!p.C);if(v===1){near(dist(p.A,p.C),5);near(dist(p.B,p.C),3);near(dist(p.D,p.C),3);near(angle(p.C,p.A,p.B),30);assert(p.B[0]>0&&p.D[0]>0&&p.B[0]!==p.D[0]);}if(v===2){near(dist(p.A,p.B),3*k);near(dist(p.A,p.C),4*k);near(dot(sub(p.B,p.A),sub(p.C,p.A)),0);}
  }
  for(const seed of [0,1,3,4,21,22]){
    const initial=get('symmetry-method',seed),task=NP.task('symmetry-method',seed),last=get('symmetry-method',seed,task.steps.length);
    assert(!initial.D);assert(!initial.M0);assert(last.D&&last.M0);near(last.D[0],last.B[0]);near(last.D[1],-last.B[1]);near(cross(sub(last.M0,last.A),sub(last.D,last.A)),0);near(last.M0[1],0);
  }
  for(const step of [0,1]){const p=get('solve-triangle',1,step);assert(!p.B);assert(!p.D);}
});

test('diagram type and caption remain readable at a 276 pixel drawing width',()=>{
  for(const id of D.proofIds){const html=D.figure(id,0),w=Number(html.match(/viewBox="0 0 ([\d.]+)/)[1]),font=Number(html.match(/font:600 (\d+)px/)[1]);assert(font*276/w>=14,`${id}: effective font ${font*276/w}`);assert.match(html,/figcaption style="font-size:14px/);}
  const html=T.figure(C.units[0],G.task(C.units[0].calc,1));assert.match(html,/font:600 20px/);assert(!html.includes('font-size="14"'));
});

test('all published point and note labels occupy disjoint bounds without changing the geometry',()=>{
  const verify=(html,name)=>{
    assert(!html.includes('data-label-crowded'),name+' could not place every label');
    const texts=[...html.matchAll(/<text\b([^>]*)>/g)];
    const boxes=texts.map(match=>{
      const box=match[1].match(/data-label-box="([^"]+)"/);
      assert(box,name+' has an unregistered label');
      const [left,top,right,bottom]=box[1].split(' ').map(Number);
      assert([left,top,right,bottom].every(Number.isFinite),name);
      assert(left>=0&&top>=0&&right<=360&&bottom<=230,name+' clips a label');
      return {left,top,right,bottom};
    });
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i],b=boxes[j];
      assert(Math.min(a.right,b.right)<=Math.max(a.left,b.left)||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top),`${name}: labels ${i} and ${j} overlap`);
    }
  };
  for(const [id,proof]of Object.entries(P))if(!D.legacy.proofIds.includes(id))for(let step=0;step<=proof.steps.length;step++)verify(D.figure(id,step),`proof ${id}/${step}`);
  for(const id of D.legacy.proofIds)for(let step=0;step<=P[id].steps.length;step++){
    const html=D.figure(id,step),height=Number(html.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1]);
    // Measured Noto Sans 600/18 font bounds: ascent 19.242, descent 5.274.
    // Keep a small margin around that envelope for the reviewed legacy SVGs.
    for(const match of html.matchAll(/<text x="[\d.-]+" y="([\d.-]+)"/g)){
      const baseline=Number(match[1]);assert(baseline>=19.3&&baseline+5.3<=height,`${id}/${step}: clipped legacy label at ${baseline}`);
    }
  }
  for(const unit of C.units)for(let seed=0;seed<105;seed++)verify(T.figure(unit,G.task(unit.calc,seed)),`task ${unit.id}/${seed}`);
  for(const id of NP.ids)for(let seed=0;seed<3;seed++){
    const task=NP.task(id,seed),unit=C.units.find(u=>u.id===id);
    for(let step=0;step<=task.steps.length;step++)verify(T.figure(unit,task,{step}),`new task ${id}/${seed}/${step}`);
  }
  const unit=C.units.find(u=>u.id==='area-parallelogram'),task=G.task(unit.calc,0),model=T.model(unit,task),before=JSON.stringify(model),html=D.render(model);
  near(dist(model.points.B,model.points.H),0);
  assert.match(html,/data-label-for="B H"[^>]*>B = H<\/text>/,'coincident vertices share one honest label');
  assert.match(html,/data-point="B"/);assert.match(html,/data-point="H"/);
  assert.equal(JSON.stringify(model),before,'text placement leaves mathematical points intact');
});
