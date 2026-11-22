const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./additional-coordinate-distances.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const plus=(a,b)=>a.map((v,i)=>v+b[i]);
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const times=(a,k)=>a.map(v=>v*k);
const normSq=a=>dot(a,a);
const mean=(...vectors)=>times(vectors.reduce(plus),1/vectors.length);
const equal=(a,b)=>assert(normSq(minus(a,b))<1e-12,JSON.stringify([a,b]));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,[a,b].join(' versus '));
const triple=a=>a.join(';');
let fields=0,arcs=0,medians=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),p=c.visualization.model.points,m=c.visualization.model;
 viewer.prepare(m);const page=n<748?187:188;assert.deepEqual(c.source.printedPages,[page]);assert.deepEqual(c.source.pdfPages,[page+2]);assert.equal(c.source.collection,'main');
 let vals;
 if(n===739){
   const normalized=v=>times(v,1/Math.sqrt(normSq(v)));
   for(const [input,output] of [[p.A,p.U],[p.B,p.V],[p.T,p.R]]){equal(normalized(input),output);near(dot(input,output),Math.sqrt(normSq(input)));}
   vals=[triple([normSq(p.A),normSq(p.B)]),triple(p.U),triple(p.R),triple([...p.U,...p.V])];
 }else if(n===740){
   equal([p.A[0],p.A[2]],[2,-Math.sqrt(5)]);equal([p.B[0],p.B[2]],[2,-Math.sqrt(5)]);near(normSq(p.A),25);near(normSq(p.B),25);assert(p.A[1]===-p.B[1]);vals=[p.A[2]**2,p.A[1]**2,'-5;5',triple([p.B[1],p.A[1]])];
 }else if(n===741){
   equal(mean(p.M,p.N),p.A);equal(mean(p.P,p.Q),p.B);equal(mean(p.P,p.T),p.V);vals=[triple(p.A),triple(p.B),Math.sqrt(normSq(minus(p.V,p.A))),Math.sqrt(normSq(minus(p.B,p.A)))];
 }else if(n===742){
   equal(p.B,[-2,5,Math.sqrt(3)]);let values=[p.H,p.K,p.L].map(base=>Math.sqrt(normSq(minus(p.B,base))));assert.equal(Math.round(values[0]**2),28);for(const [axis,a] of [p.H,p.K,p.L].entries()){const v=p.T.map((x,i)=>i===axis?x:0);near(normSq(minus(p.T,v)),values[axis]**2);}
   vals=[Math.round(values[0]**2),triple(values.slice(1).map(x=>Math.round(x*x))),0,triple(values)];
 }else if(n===743){
   const lateral=a=>a[0]**2+a[2]**2,left=lateral(p.A),right=lateral(p.B),constant=right+p.B[1]**2-left-p.A[1]**2,t=constant/(2*(p.B[1]-p.A[1]));equal([0,t,0],p.M);near(normSq(minus(p.M,p.A)),normSq(minus(p.M,p.B)));
   vals=[triple([left,right]),constant,normSq(minus(p.T,p.A)),triple(p.M)];
 }else if(n===744){
   const ca=minus(p.A,p.C),cb=minus(p.B,p.C);equal(mean(p.A,p.B),p.O);equal(mean(p.A,p.T),p.U);near(normSq(minus(p.O,p.A)),normSq(minus(p.O,p.C)));vals=[dot(ca,cb),normSq(minus(p.A,p.B)),triple(p.U),triple(p.O)];
 }else if(n===745||n===746){
   const sphere=m.spheres[0],center=sphere.center,r=sphere.radius;
   for(const edge of sphere.surfaceEdges){for(const v of edge)near(normSq(minus(p[v],center)),r*r);arcs++;}
   if(n===745){
     for(const name of ['A','B','D'])near(normSq(minus(p[name],center)),r*r);
     const counts=[0,1,2].map(axis=>{const distanceSq=center.reduce((s,v,i)=>s+(i===axis?0:v*v),0);return distanceSq>r*r?0:distanceSq===r*r?1:2;});assert.deepEqual(counts,[1,0,2]);
     vals=[triple(counts.slice(0,2)),triple([p.D[2],p.B[2]]),2,triple([...p.A,...p.D,...p.B])];
   }else{
     assert.equal(p.M[0],p.H[0]);assert(normSq(p.M)>r*r);near(dot(minus(p.A,p.H),p.H),0);near(normSq(p.A),r*r);near(normSq(p.U),r*r);
     vals=[p.H[0],normSq(minus(p.A,p.H)),normSq(minus(p.U,p.T)),Math.sqrt(r*r-p.H[0]**2)];
   }
 }else if(n===747){
   equal(mean(p.A,p.B,p.C),p.G);equal(mean(p.A,p.B,p.T),p.U);vals=[p.A[2]+p.B[2]+p.C[2],p.G[2],Math.abs(p.U[2]),p.G[2]];
 }else if(n===748){
   const names=['A','B','C','D'];for(const shift of [[0,0,0],[-3,5,1],[1,-2,4]])for(const scale of [1,2,4]){
     const moved=v=>plus(times(v,scale),shift);for(const name of names){const others=names.filter(k=>k!==name).map(k=>moved(p[k]));const f=mean(...others),g=moved(p.G),start=moved(p[name]);equal(f,moved(p['F'+name]));equal(g,plus(start,times(minus(f,start),.75)));medians++;}}
   vals=[1/3,.75,'3;2;1',3];
 }else throw Error(id);
 c.steps.forEach((st,i)=>{assert.equal(engine.classifyAnswer(String(vals[i]),st.input.accepted).status,'correct',id+' '+i+' '+vals[i]);for(const a of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(a,st.input.accepted).status,'wrong',id+' '+i+' '+a);fields++;});
 assert.equal(engine.classifyAnswer(String(vals.at(-1)),c.answer.accepted).status,'correct',id+' final');
}
assert.equal(arcs,96);assert.equal(medians,36);assert.equal(fields,30);
console.log('SPACE_DISTANCES_739_748_OK: 30 learner fields, both ordinate roots, the radical in 742, every sphere-axis intersection, 96 sphere arcs and 36 tetrahedron medians checked');
