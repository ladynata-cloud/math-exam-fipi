'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./midlines-vector-coefficients.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const expected = {
  '0582-a': ['CA','2','-2','8'], '0582-b': ['EA','AB','-1/2','7'],
  '0583': ['NM','1/2','-1/2','8'], '0584-a': ['3','-9','5','1'],
  '0584-b': ['6','-13','2','-1'], '0585': ['CC1','0','AD','14']
};
const sub = (u,v) => u.map((x,i) => x-v[i]);
const add = (...vs) => vs.reduce((u,v) => u.map((x,i) => x+v[i]), [0,0,0]);
const scale = (v,k) => v.map(x => x*k);
const midpoint = (a,b) => scale(add(a,b),.5);
const same = (u,v) => assert(Math.hypot(...sub(u,v)) < 1e-8, JSON.stringify([u,v]));
// These identities use affine structure, so test an oblique change of basis, a
// reflected and translated frame, and the original authored figure independently.
const transforms = [
  ([x,y,z]) => [x,y,z],
  ([x,y,z]) => [4-x+y/4,3+2*y-z,-1+z/2],
  ([x,y,z]) => [7+y-2*z,3+z,-17+x+y]
];
const {available,issues} = engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts,{'582':['а','б'],'583':[null],'584':['а','б'],'585':[null]});
let fields=0,models=0;
for(const [suffix,answers] of Object.entries(expected)){
  const id='ex-main-'+suffix,card=available.get(id),model=card.visualization.model;
  assert(Object.hasOwn(manifest.cards,id));
  assert.deepEqual(card.source.printedPages,[149]);
  assert.deepEqual(card.source.pdfPages,[151]);
  viewer.prepare(model);
  assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(answers[i],step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+'/'+wrong);
    fields++;
  }
  for(const transform of transforms){
    const p=Object.fromEntries(Object.entries(model.points).map(([label,coord])=>[label,transform(coord)]));
    const v=(a,b)=>sub(p[b],p[a]);
    if(suffix.startsWith('0582') || suffix==='0583'){
      // Any origin, including a vertex and a point outside the figure's plane.
      for(const origin of [p.O,p.A,transform([4,3,-8])]){
        const at=b=>sub(p[b],origin);
        if(suffix==='0583'){
          same(p.M,midpoint(p.A,p.B));same(p.N,midpoint(p.C,p.D));
          same(sub(at('M'),at('N')),scale(add(v('A','D'),v('B','C')),-.5));
        }else{
          same(p.E,midpoint(p.A,p.B));same(p.F,midpoint(p.B,p.C));
          same(v('A','B'),v('D','C'));
          same(sub(at('A'),at('C')),scale(v('E','F'),-2));
          same(sub(at('A'),at('E')),scale(v('D','C'),-.5));
        }
      }
    }else if(suffix.startsWith('0584')){
      const m=v('O','M'),n=v('O','N');
      same(v('O','I'),scale(m,-1));
      if(suffix.endsWith('a')){
        const printed=add(scale(add(m,n),2),scale(sub(scale(m,4),n),-3),m);
        same(printed,add(scale(n,5),scale(m,-9)));same(v('O','T'),printed);
      }else{
        const q=v('O','P');
        const printed=add(m,scale(add(n,scale(m,-2),q),-3),scale(sub(q,scale(m,4)),5));
        same(printed,add(scale(m,-13),scale(n,-3),scale(q,2)));same(v('O','T'),printed);
      }
    }else{
      for(const vertex of ['A','B','C','D'])same(v(vertex,vertex+'1'),v('A','A1'));
      same(v('A','C1'),add(v('A','B'),v('B','C'),v('C','C1')));
      same(v('B1','D'),add(v('B1','B'),v('B','A'),v('A','D')));
      same(add(v('A','C1'),v('B1','D')),scale(v('B','C'),2));
      assert.equal(card.answer.mode,'manual');
    }
    models++;
  }
}
for(const [suffix,correct,wrong,malformed] of [
  ['0584-a','-9; 5','5;-9','-9,5'],
  ['0584-b','-13;-3;2','2;-3;-13','-13,3']
]){
  const accepted=available.get('ex-main-'+suffix).answer.accepted;
  assert.equal(engine.classifyAnswer(correct,accepted).status,'correct');
  assert.equal(engine.classifyAnswer(wrong,accepted).status,'wrong');
  assert.equal(engine.classifyAnswer(malformed,accepted).status,'invalid');
}
console.log('MIDLINES_VECTOR_COEFFICIENTS_OK',JSON.stringify({cards:6,fields,affineModels:models}));
