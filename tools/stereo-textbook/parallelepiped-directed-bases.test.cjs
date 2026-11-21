'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bundle = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./parallelepiped-directed-bases.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const sums = {
  a:{steps:['AB','BC','AC1','A1C'], printed:['A-B','A-D','A-A1'], diagonal:'A-C1', repeat:'A1-C'},
  b:{steps:['DA','AB','DB1','AC1'], printed:['D-A','D-C','D-D1'], diagonal:'D-B1', repeat:'A-C1'},
  c:{steps:['DC','CB','DB1','CA1'], printed:['A1-B1','C1-B1','B-B1'], diagonal:'D-B1', repeat:'C-A1'},
  d:{steps:['A1A','AD','A1C','AC1'], printed:['A1-A','A1-D1','A-B'], diagonal:'A1-C', repeat:'A-C1'},
  e:{steps:['BA','AA1','BD1','CA1'], printed:['B1-A1','B-B1','B-C'], diagonal:'B-D1', repeat:'C-A1'}
};
const sub=(u,v)=>u.map((x,i)=>x-v[i]), scale=(v,k)=>v.map(x=>x*k);
const add=(...vs)=>vs.reduce((u,v)=>u.map((x,i)=>x+v[i]),[0,0,0]);
const same=(u,v)=>assert(Math.hypot(...sub(u,v))<1e-8,JSON.stringify([u,v]));
const determinant=([x,y,z],[a,b,c],[r,s,t])=>x*(b*t-c*s)-y*(a*t-c*r)+z*(a*s-b*r);
const {available,issues}=engine.inspectBundle(bundle.catalog,bundle.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts,{'595':['а','б','в','г','д'],'596':['а','б']});
let fields=0, configurations=0;
for(const id of Object.keys(manifest.cards)){
  const card=available.get(id),model=card.visualization.model;
  assert.deepEqual(card.source.printedPages,[154]);assert.deepEqual(card.source.pdfPages,[156]);
  assert.equal(model.faces.length,6);viewer.prepare(model);
  assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
  const exercise=card.source.exercise,suffix=id.at(-1),row=sums[suffix];
  const fieldsExpected=exercise==='595'?row.steps:suffix==='a'?['1','AD','1','0']:['BA','-1','1','-2'];
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(fieldsExpected[i],step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+'/'+wrong);
    fields++;
  }
  for(const transform of [v=>v,([x,y,z])=>[4+y-z,2+y+x,1-z],([x,y,z])=>[-3+2*x,y+x,z+y/3]]){
    const p=Object.fromEntries(Object.entries(model.points).map(([n,pt])=>[n,transform(pt)]));
    const vec=([a,b])=>sub(p[b],p[a]),edge=s=>vec(s.split('-'));
    if(exercise==='595'){
      const usual=model.views.neutral.segments,retry=model.views.retry.segments,path=model.views.path.segments;
      assert.deepEqual(usual,row.printed.map(s=>s.split('-')));
      assert.equal(path.length,3);assert.equal(path[0][1],path[1][0]);assert.equal(path[1][1],path[2][0]);
      for(let i=0;i<3;i++)same(vec(usual[i]),vec(path[i]));
      same(add(...usual.map(vec)),edge(row.diagonal));same(add(...retry.map(vec)),edge(row.repeat));
      assert.equal(usual.filter((s,i)=>s.join('-')!==retry[i].join('-')).length,1);
      for(const [input,ans] of [[usual,row.diagonal],[retry,row.repeat]]){
        const value=add(...input.map(vec)),vertices=[];
        for(const a of Object.keys(p))for(const b of Object.keys(p))
          if(a!==b&&Math.hypot(...sub(vec([a,b]),value))<1e-8)vertices.push(a+'-'+b);
        assert.deepEqual(vertices,[ans],id+' unique ordered endpoint pair');
      }
      assert.equal(engine.classifyAnswer(row.diagonal.replace('-',''),card.answer.accepted).status,'correct');
    }else{
      const basis=suffix==='a'?['B-A','B-C','B-B1']:['A1-A','A1-B','A1-D1'];
      const [u,v,w]=basis.map(edge);
      const signedVolume=determinant(u,v,w);assert(Math.abs(signedVolume)>1e-8);
      function coordinates(target){return [determinant(target,v,w),determinant(u,target,w),determinant(u,v,target)].map(q=>q/signedVolume);}
      const target=edge(suffix==='a'?'B-D1':'B1-D1'),coefficients=suffix==='a'?[1,1,1]:[1,-1,1];
      same(coordinates(target),coefficients);
      same(target,add(scale(u,coefficients[0]),scale(v,coefficients[1]),scale(w,coefficients[2])));
      if(suffix==='a')same(coordinates(edge('B-D')),[1,1,0]);
      else same(coordinates(edge('A-B1')),[-2,1,0]);
      assert.equal(engine.classifyAnswer(coefficients.join(';'),card.answer.accepted).status,'correct');
      assert.equal(engine.classifyAnswer([0,...coefficients.slice(1)].join(';'),card.answer.accepted).status,'wrong');
    }
    configurations++;
  }
}
console.log('PARALLELEPIPED_DIRECTED_BASES_OK',JSON.stringify({cards:7,fields,affineModels:configurations}));
