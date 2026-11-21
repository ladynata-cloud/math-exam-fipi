'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./coplanar-vector-directions.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const expected = {
  'theory-068':['2','0','2','0'], 'theory-069':['C','C1','-1','5'], 'theory-070':['2','-1','1','0'],
  'ex-main-0592-a':['A1','1','да','да'], 'ex-main-0592-b':['C','3','нет','да'],
  'ex-main-0592-c':['-1','1','да','да'], 'ex-main-0592-d':['AB','AA1','нет','да'],
  'ex-main-0593':['E','1/2','да','3'], 'ex-main-0594':['C','BB1','1','0']
};
const pages={'theory-068':[150,151],'theory-069':[151,152],'theory-070':[152,153]};
const sub=(u,v)=>u.map((x,i)=>x-v[i]), scale=(v,k)=>v.map(x=>x*k);
const add=(...vs)=>vs.reduce((u,v)=>u.map((x,i)=>x+v[i]),[0,0,0]);
const cross=([x,y,z],[a,b,c])=>[y*c-z*b,z*a-x*c,x*b-y*a];
const det=(u,v,w)=>cross(u,v).reduce((s,x,i)=>s+x*w[i],0);
const norm=v=>Math.hypot(...v),same=(u,v)=>assert(norm(sub(u,v))<1e-8,JSON.stringify([u,v]));
const {available,issues}=engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts,{'theory-68':[null],'theory-69':[null],'theory-70':[null],'592':['а','б','в','г'],'593':[null],'594':[null]});
let fields=0,models=0;
for(const [id,answers] of Object.entries(expected)){
  const card=available.get(id),model=card.visualization.model;
  const printed=pages[id]||[153];
  assert.deepEqual(card.source.printedPages,printed);assert.deepEqual(card.source.pdfPages,printed.map(i=>i+2));
  assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
  viewer.prepare(model);
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(answers[i],step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+'/'+wrong);
    fields++;
  }
  for(const transform of [v=>v,([x,y,z])=>[8+y+z,x-2*y,5+z],([x,y,z])=>[-4+z,y-x/3,12-x]]){
    const p=Object.fromEntries(Object.entries(model.points).map(([k,pt])=>[k,transform(pt)]));
    const v=(a,b)=>sub(p[b],p[a]);
    if(id==='theory-068'){
      const a=v('O','A'),b=v('O','B');same(v('O','C'),add(a,b));
      assert(norm(cross(a,b))>1e-8);assert(Math.abs(det(a,b,v('O','H')))>1e-8);
    }else if(id==='theory-069'){
      same(v('B','C'),v('A','D'));same(v('C','C1'),v('A','A1'));
      same(v('A','C1'),add(v('A','B'),v('A','D'),v('A','A1')));
    }else if(id==='theory-070'){
      const a=v('O','A'),b=v('O','B'),c=v('O','C');
      assert(Math.abs(det(a,b,c))>1e-8);same(v('O','I'),scale(a,2));same(v('I','J'),scale(b,-1));same(v('J','T'),c);
      same(v('O','T'),add(scale(a,2),scale(b,-1),c));
      for(const [x,y,z] of [[0,0,0],[-3,1,2],[.5,-2,0]]){
        const t=add(scale(a,x),scale(b,y),scale(c,z)),volume=det(a,b,c);
        same([det(t,b,c)/volume,det(a,t,c)/volume,det(a,b,t)/volume],[x,y,z]);
      }
    }else if(id.includes('0592')){
      const input=model.views.neutral.segments.map(([a,b])=>v(a,b));
      const translated=model.views.transfer.segments.map(([a,b])=>v(a,b));
      // In 592a all three source arrows coincide after translation to A.
      for(const u of input)assert(translated.some(t=>norm(sub(u,t))<1e-8));
      for(const u of translated)assert(input.some(t=>norm(sub(u,t))<1e-8));
      const coplanar=Math.abs(det(...input))<1e-8;
      assert.equal(coplanar,['a','c'].includes(id.at(-1)),id+' printed key');
      assert.equal(card.answer.accepted[0],coplanar?'да':'нет');
      const vertices=model.views.plane.polygon;
      const u=v(vertices[0],vertices[1]),w=v(vertices[0],vertices[3]);
      assert(norm(cross(u,w))>1e-8);
      assert.equal(input.every(t=>Math.abs(det(u,w,t))<1e-8),coplanar);
    }else if(id==='ex-main-0593'){
      same(p.E,scale(add(p.A,p.C),.5));same(p.F,scale(add(p.B,p.D),.5));
      same(v('F','P'),v('B','A'));same(v('F','Q'),v('D','C'));
      same(v('F','S'),scale(v('F','E'),2));same(v('F','S'),add(v('B','A'),v('D','C')));
      assert(Math.abs(det(v('F','E'),v('B','A'),v('D','C')))<1e-8);
    }else{
      same(v('A','C'),add(v('A','B'),v('A','D')));same(v('A','C1'),add(v('A','B1'),v('A','D1')));
      same(v('C','P'),v('B','B1'));same(v('C','Q'),v('D','D1'));same(v('C','C1'),add(v('B','B1'),v('D','D1')));
      assert(Math.abs(det(v('C','C1'),v('B','B1'),v('D','D1')))<1e-8);
    }
    models++;
  }
}
console.log('COPLANAR_VECTOR_DIRECTIONS_OK',JSON.stringify({cards:9,fields,affineModels:models}));
