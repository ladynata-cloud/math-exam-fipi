'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const receipt=require('./spatial-scalar-identities-and-opposite-edges.json'),bank=require('../../stereo-course/textbook/data/course.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs'),{available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const dot=(v,w)=>v.reduce((s,x,i)=>s+x*w[i],0),add=(v,w)=>v.map((x,i)=>x+w[i]),sub=(v,w)=>v.map((x,i)=>x-w[i]),mul=(v,k)=>v.map(x=>x*k),norm=v=>Math.sqrt(dot(v,v));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b);
const same=(a,b)=>near(norm(sub(a,b)),0),mid=(a,b)=>mul(add(a,b),.5);
const good=(v,accepted)=>assert.equal(engine.classifyAnswer(String(v),accepted).status,'correct',String(v));
const pp=[['B','A','D1','C1',-1,'-1'],['B','C1','D1','B',-1.5,'-3/2'],['A','C1','A','C1',4,'4'],['D','B1','D','B1',2,'sqrt(2)'],['A1','C','A1','C',4,'2'],['D','A1','D1','B',-.5,'-1/4'],['A','C1','D','B1',1,'sqrt(2)/4']];
let fields=0,generalProofs=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),m=c.visualization.model,p=m.points,idx=id.charCodeAt(id.length-1)-97;
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 assert.deepEqual(c.source.printedPages,[177]);assert.deepEqual(c.source.pdfPages,[179]);
 let answers;
 if(n===697){const u=sub(p.B1,p.D),v=sub(p.C1,p.B);assert.deepEqual(u,[1,-2,2]);assert.deepEqual(v,[0,2,2]);near(dot(u,v),0);answers=['0;-4;4',0,90,90];}
 if(n===698){near(norm(p.A),1);near(norm(p.B),2);near(norm(p.C),2);near(dot(p.A,p.C),1);near(dot(p.B,p.C),2);near(dot(p.S,p.C),3);near(dot(p.S,p.T),-3);answers=[1,2,-3,3];}
 if(n===699){same(p.Q,add(add(p.A,p.B),p.C));near(dot(p.Q,p.D),3);near(dot(p.Q,p.T),-3);
  for(let j=-4;j<=4;j++)for(let i=-2;i<=2;i++){const a=[j,2,i-j],b=[i,i*j,3],c=[2,-j,i],d=[1,j-i,i*j];near(dot(add(add(a,b),c),d),dot(a,d)+dot(b,d)+dot(c,d));generalProofs++;}
  answers=['2;-2;3',3,-3,2];}
 if(n===700){near(dot(p.A,p.B),-.5);near(dot(p.B,p.C),0);near(dot(p.C,p.A),0);
  if(idx===0){near(dot(p.U,p.V),1);near(dot(p.W,p.Q),.5);answers=['-1/2;0;0',1,'1/2',4,'1;1/2'];}
  else{near(dot(p.U,p.U),3);near(dot(p.V,p.V),2);near(norm(p.W),2*norm(p.U));near(norm(p.Q),2*norm(p.V));answers=['-1/2;0;0',3,2,2,'sqrt(3);sqrt(2)'];}}
 if(n===701){near(norm(p.A),3);near(p.A[1],-1);near(p.T[1]/norm(p.T),1/3);
  for(const a of [[-1,2,4],[3,-7,1],[0,0,2],[0,-4,0],[-2,0,0]])for(const ax of [[1,0,0],[0,1,0],[0,0,1]]){
    const d=dot(ax,a),value=Math.cos(Math.acos(d/norm(a)))*norm(a);near(value,d);generalProofs++;}
  answers=[-1,'2;-1;2','1/3','L*cos(phi1)'];}
 if(n===702){same(p.M,mid(p.A,p.D));same(p.N,mid(p.B,p.C));const v=sub(p.N,p.M),u=sub(p.D,p.A),w=sub(p.C,p.B);near(dot(v,u),0);near(dot(v,w),0);
  const verts=[p.A,p.B,p.C,p.D];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)near(norm(sub(verts[i],verts[j])),Math.sqrt(8));
  for(const i of [1,2,3]){const others=[1,2,3].filter(j=>j!==i),m=mid(verts[0],verts[i]),n=mid(verts[others[0]],verts[others[1]]);near(dot(sub(m,n),sub(verts[i],verts[0])),0);near(dot(sub(m,n),sub(verts[others[0]],verts[others[1]])),0);generalProofs++;}
  answers=['N','0;0',0,'90;90'];}
 if(n===703){const [a,b,f,h,val,ans]=pp[idx],u=sub(p[b],p[a]),v=sub(p[h],p[f]);near(dot(u,v),val);
  const e=sub(p.B,p.A),d=sub(p.D,p.A),k=sub(p.A1,p.A);near(dot(e,d),.5);near(dot(e,k),0);near(dot(d,k),0);[e,d,k].forEach(v=>near(norm(v),1));
  same(sub(p.Q,p[a]),v);same(sub(p.T,p[a]),mul(v,-1));if(idx===3)near(norm(u),Math.SQRT2);if(idx===4)near(norm(u),2);if(idx>=5)near(val/(norm(u)*norm(v)),idx===5?-.25:Math.SQRT2/4);
  answers=['1/2',val,-val,ans];}
 if(n===704){const a=p.A,b=p.B,c=p.C;near(dot(a,sub(c,b)),0);near(dot(b,sub(c,a)),0);near(dot(sub(b,a),c),0);near(dot(a,b),2);
  // The proof works even when the three lengths from D are unequal. Derive C in an affine line from the two premises.
  for(const x of [1,2,3])for(const y of [1,3])for(const t of [-3,2]){const aa=[x,1,0],bb=[0,y,1],cc=[(y-t)/x,t,y-y*t];near(dot(aa,sub(cc,bb)),0);near(dot(bb,sub(cc,aa)),0);near(dot(sub(bb,aa),cc),0);generalProofs++;}
  answers=['0;0',2,0,0];}
 c.steps.forEach((step,i)=>{good(answers[i],step.input.accepted);for(const w of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(w,step.input.accepted).status,'wrong',id+' '+w);fields++;});
 good(answers.at(-1),c.answer.accepted);
}
assert.equal(fields,47);assert.equal(generalProofs,75);
console.log('SPATIAL_SCALAR_IDENTITIES_OK: 47 addressed steps, all seven oblique-base values, two midpoints and 75 varied checks of four algebraic or geometric proofs');
