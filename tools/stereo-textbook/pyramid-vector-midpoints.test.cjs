'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./pyramid-vector-midpoints.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');

const sourceAnswers = {
  '0578': ['2', 'N', '4', '12'],
  '0579': ['2', '3', '6', '18'],
  '0580': ['2', 'AO', '-1', '0'],
  '0581-a': ['-', '1', '-1', '1'],
  '0581-b': ['+', '2', '2', '1/2'],
  '0581-c': ['-', '1/2', '-1/2', '1/2']
};
const {available, issues} = engine.inspectBundle(course.catalog, course.lessons);
assert.deepEqual(issues, []);
assert.deepEqual(manifest.parts, {'578':[null], '579':[null], '580':[null], '581':['а','б','в']});

const diff = (a, b) => a.map((v, i) => v-b[i]);
const sum = (...vectors) => vectors.reduce((a,b) => a.map((v,i) => v+b[i]), [0,0,0]);
const scale = (v, k) => v.map(x => x*k);
const dot = (u,v) => u.reduce((s,x,i) => s+x*v[i], 0);
const mid = (u,v) => scale(sum(u,v), .5);
const equals = (u,v) => assert(Math.hypot(...diff(u,v))<1e-7, JSON.stringify([u,v]));
const transforms = [
  ([x,y,z]) => [x,y,z],
  ([x,y,z]) => [7+2*y,-1-2*x,5+2*z],
  ([x,y,z]) => [-3+z/2, 4+x/2, -7+y/2]
];
let fields=0, configurations=0;
for (const [suffix, answers] of Object.entries(sourceAnswers)) {
  const id='ex-main-'+suffix, card=available.get(id), model=card.visualization.model;
  assert(Object.hasOwn(manifest.cards,id)); viewer.prepare(model);
  assert.deepEqual(card.source.printedPages,[149]); assert.deepEqual(card.source.pdfPages,[151]);
  assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
  for(const [i, step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(answers[i],step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step)) assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+'/'+step.id+'/'+wrong);
    fields++;
  }
  for (const transform of transforms) {
    const p=Object.fromEntries(Object.entries(model.points).map(([key,point])=>[key,transform(point)]));
    const v=(a,b)=>diff(p[b],p[a]);
    if(suffix==='0578'){
      equals(p.M,mid(p.A,p.B)); equals(p.N,mid(p.C,p.D)); equals(p.O,mid(p.M,p.N));
      equals(v('A','D'),scale(v('B','C'),2));
      for(const apex of [p.P,transform([3,8,-4]),transform([-10,5,3])]){
        const at=k=>diff(p[k],apex);
        equals(sum(at('A'),at('B')),scale(at('M'),2)); equals(sum(at('C'),at('D')),scale(at('N'),2));
        equals(sum(...[...'ABCD'].map(at)),scale(at('O'),4)); configurations++;
      }
    }else if(suffix==='0579'){
      const vertices='ABCDEF', feet='KLMNRS';
      for(let i=0;i<6;i++){
        const a=vertices[i],b=vertices[(i+1)%6],f=feet[i];
        equals(p[f],mid(p[a],p[b])); assert(Math.abs(dot(v('P',f),v(a,b)))<1e-7);
        equals(p.H,mid(p[a],p[vertices[(i+3)%6]])); equals(p.H,mid(p[f],p[feet[(i+3)%6]]));
        assert(Math.hypot(...v('P',a))>Math.hypot(...v('P',f)));
      }
      const expected=scale(v('P','H'),6);
      equals(sum(...[...vertices].map(k=>v('P',k))),expected); equals(sum(...[...feet].map(k=>v('P',k))),expected);
      if(transform===transforms[0]){
        assert.equal(Math.hypot(...v('P','A')),5); assert(Math.abs(Math.hypot(...v('P','K'))-Math.sqrt(21))<1e-8);
      }
      configurations++;
    }else if(suffix==='0580'){
      for(const b of [p.B,p.A,transform([6,-2,7])]){
        const o=mid(p.A,b); equals(diff(o,p.A),scale(diff(b,p.A),.5)); equals(diff(p.A,o),scale(diff(b,o),-1)); configurations++;
      }
    }else{
      const rows={'0581-a':['A','B','C','D',-1], '0581-b':['A','C1','A','O',2], '0581-c':['O','B1','B1','D',-.5]};
      const [a,b,c,d,k]=rows[suffix];
      for(const [u,w] of [['A','C1'],['B1','D'],['A1','C'],['B','D1']])equals(p.O,mid(p[u],p[w]));
      const len=Math.hypot(...v('A','B'));for(const side of [['A','D'],['A','A1']])assert(Math.abs(Math.hypot(...v(...side))-len)<1e-8);
      assert(Math.abs(dot(v('A','B'),v('A','D')))<1e-8);
      equals(v(a,b),scale(v(c,d),k)); assert.equal(engine.classifyAnswer(String(k),card.answer.accepted).status,'correct');
      assert.equal(engine.classifyAnswer(String(-k),card.answer.accepted).status,'wrong'); configurations++;
    }
  }
}
assert.equal(fields,24);assert.equal(configurations,30);
console.log('ATANASYAN_PYRAMID_VECTOR_MIDPOINTS_OK: paired edges and apothems, symmetry with coincident endpoints, all three signed cube ratios, 24 fields and 30 configurations');
