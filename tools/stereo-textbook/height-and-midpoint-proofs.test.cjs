'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const review=require('./height-and-midpoint-proofs.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]),scale=(a,k)=>a.map(x=>x*k);
const sub=(a,b)=>add(a,scale(b,-1)),mid=(a,b)=>scale(add(a,b),.5),mean=(...a)=>scale(add(...a),1/a.length);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' vs '+b);
const xyz=(a,b)=>a.forEach((x,i)=>near(x,b[i]));
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d];
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const answers={610:['4','1','3','3'],611:['1/2','1/2','<','5'],612:['1/2','1/2','Q','7;5']};
let fields=0,heights=0,affineCases=0;
for(const n of [610,611,612]){
  const id='ex-main-0'+n,c=available.get(id),m=c.visualization.model,p=m.points;
  assert(Object.hasOwn(review.cards,id));viewer.prepare(m);
  assert.deepEqual(c.source.printedPages,[156]);assert.deepEqual(c.source.pdfPages,[158]);
  assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
  for(const [i,s] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(answers[n][i],s.input.accepted).status,'correct');
    for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+' '+w);
    fields++;
  }
  if(n===610){
    xyz(p.M,mean(p.A,p.B,p.C));xyz(p.L,mean(p.A,p.B,p.T));xyz(p.M1,[p.M[0],p.M[1],0]);xyz(p.M1,[p.L[0],p.L[1],0]);
    for(const foot of ['A','B','C','M'])xyz(p[foot+'1'],[p[foot][0],p[foot][1],0]);
    for(const values of [[2,4,6],[2,4,-3],[-1,-2,-6],[0,2,5],[0,-2,5],[-2,0,2],[0,0,0]]){
      for(const normal of [[0,0,1],[2/3,-2/3,1/3]]){
        const tangent=scale(cross(normal,[1,0,0]),1/norm(cross(normal,[1,0,0]))),other=cross(normal,tangent);
        const offset=[1,-2,3];
        const verts=values.map((h,i)=>add(offset,scale(tangent,[0,4,1][i]),scale(other,[0,0,3][i]),scale(normal,h)));
        const signed=x=>dot(sub(x,offset),normal),project=x=>sub(x,scale(normal,signed(x)));
        const M=mean(...verts);xyz(project(M),mean(...verts.map(project)));
        const dis=norm(sub(M,project(M))),average=verts.reduce((s,x)=>s+norm(sub(x,project(x))),0)/3;
        near(dis,Math.abs(values.reduce((a,b)=>a+b,0))/3);
        if(values.some(x=>x<0)&&values.some(x=>x>0))assert(dis<average-1e-6);else near(dis,average);
        heights++;
      }
    }
  }else{
    for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[1,2,0],[0,1,-1],[0,0,2]],[[-1,0,1],[1,-2,0],[0,1,3]]]){
      const q=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,add(mat.map(r=>dot(r,v)),[2,-1,4])]));
      const v=(a,b)=>sub(q[b],q[a]);
      assert(Math.abs(dot(v('A','B'),cross(v('A','C'),v('A','D'))))>1e-6);
      if(n===611){
        xyz(q.M,mid(q.A,q.B));xyz(q.N,mid(q.C,q.D));xyz(q.T,mid(q.B,q.C));
        xyz(v('M','T'),scale(v('A','C'),.5));xyz(v('T','N'),scale(v('B','D'),.5));
        const u=v('A','C'),w=v('B','D');assert(norm(cross(u,w))>1e-6);
        assert(2*norm(v('M','N'))<norm(u)+norm(w)-1e-6);
        near(norm(scale(add([6,0,0],[0,8,0]),.5)),5);
      }else{
        xyz(q.K,mid(q.A,q.B));xyz(q.M,mid(q.C,q.D));
        for(const [key,a,b] of [['P','K','C'],['Q','K','D'],['R','M','A'],['S','M','B']])xyz(q[key],mid(q[a],q[b]));
        xyz(q.G,mid(q.P,q.Q));xyz(q.G,mid(q.R,q.S));xyz(q.G,mid(q.K,q.M));
        xyz(v('P','Q'),scale(v('C','D'),.5));xyz(v('R','S'),scale(v('A','B'),.5));
        assert(norm(cross(v('P','Q'),v('R','S')))>1e-6);
        xyz(v('P','R'),v('S','Q'));xyz(v('R','Q'),v('P','S'));
        for(const wrong of ['PR;QS','PS;RQ'])assert.equal(engine.classifyAnswer(wrong,c.answer.accepted).status,'wrong');
      }
      affineCases++;
    }
  }
}
assert.equal(fields,12);assert.equal(heights,14);assert.equal(affineCases,6);
console.log('HEIGHT_AND_MIDPOINT_PROOFS_OK',JSON.stringify({fields,heights,affineCases}));
