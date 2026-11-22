const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const receipt=require('./coordinate-chapter-seven-end.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),squared=a=>dot(a,a);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' versus '+b),equal=(a,b)=>near(squared(sub(a,b)),0);
const triple=a=>a.join(';');
const normalized=a=>mul(a,1/Math.sqrt(squared(a)));
const yes=b=>b?'да':'нет';let fields=0,tests=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),part=c.source.subpart,m=c.visualization.model,p=m.points;
 viewer.prepare(m);const page=n===763?189:188;assert.deepEqual(c.source.printedPages,[page]);assert.deepEqual(c.source.pdfPages,[page+2]);
 let vals;
 if(n===757){const coords=normalized(p.M);for(const a of [p.M,p.T,[1,0,0],[-2,-4,-1],[4,3,0]]){const u=normalized(a);near(squared(u),1);tests++;}vals=[triple(coords),1,1,1];}
 if(n===758){near(dot(p.A,p.C),.5);near(dot(p.A,p.B),Math.SQRT1_2);near(dot(p.C,p.B),Math.SQRT1_2);for(const name of ['C','T']){near(Math.abs(dot(p.H,p[name])),Math.SQRT1_2);tests++;}vals=[dot(p.A,p.C),p.C[1],Math.abs(p.T[2]),45];}
 if(n===759){for(const t of [Math.PI/9,Math.PI/6,.8*Math.PI])for(const f of [Math.PI/18,Math.PI/4,Math.PI/3]){const e=[1,0,0],h=[0,Math.cos(f),Math.sin(f)],v=add(mul(e,Math.cos(t)),mul(h,Math.sin(t)));near(squared(v),1);near(dot(v,[0,1,0]),Math.sin(t)*Math.cos(f));tests++;}vals=[dot(p.B,p.C),dot(p.C,p.D),dot(p.C,p.T),'sin;cos'];}
 if(n===760){for(const l of [1,2,4])for(const h of [1,3])for(const k of [1,2,5]){const C=[0,h,0],D=[l,k*Math.cos(2*Math.PI/3),k*Math.sin(2*Math.PI/3)];near(squared(sub(C,D)),l*l+h*h+k*k+k*h);tests++;}vals=[1,squared(sub(p.D,p.C)),7,1];}
 if(n===761){const motion=v=>[2-v[2],1+v[1],v[0]-1];for(const k of ['A','B','C','K','L'])equal(p[k+'1'],motion(p[k]));const d=sub(p.L1,p.K1),x=sub(p.B1,p.A1),y=sub(p.C1,p.A1);if(part==='а'){for(const t of [-2,0,1,4]){near(add(p.K1,mul(d,t))[0],1);near(p.A1[0],2);tests++;}vals=[p.A1[0],p.K1[0],0,'нет'];}else{near(dot(d,x),0);near(dot(d,y),0);for(const [a,b] of [[1,0],[-3,1],[2,4],[0,-2]]){near(dot(d,add(mul(x,a),mul(y,b))),0);tests++;}vals=[p.A1[0],2,90,'да'];}}
 if(n===762){const reflect=v=>[v[0],v[1],-v[2]];equal(reflect(p.U),p.V);equal(reflect(p.T),p.R);for(const v of [p.U,p.T,[-2,0,3],[-1,0,-1]]){const before=normalized(v),after=normalized(reflect(v));near(Math.abs(before[0]),Math.abs(after[0]));tests++;}vals=[triple(p.V),45,Math.abs(p.R[2]/p.R[0]),37];}
 if(n===763){const shift=sub(p.A1,p.A);for(const k of ['A','B','C','D','T']){equal(add(p[k],shift),p[k+'1']);equal(sub(p[k+'1'],shift),p[k]);tests++;}vals=[p.A1[2],triple(sub(p.T1,shift)),'нет',yes(shift[2]===0)];}
 c.steps.forEach((st,i)=>{assert.equal(engine.classifyAnswer(String(vals[i]),st.input.accepted).status,'correct',id+' '+i);for(const bad of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(bad,st.input.accepted).status,'wrong',id+' '+bad);fields++;});assert.equal(engine.classifyAnswer(String(vals.at(-1)),c.answer.accepted).status,'correct',id+' final');
}
assert.equal(fields,27);assert.equal(tests,56);
console.log('CHAPTER_VII_COORDINATES_AND_MOTIONS_COMPLETE: points 71–84, all 17 review questions and source exercises 637–763; final 27 fields and 56 variable geometric controls verified; the separate final review and advanced problems start at 764');
