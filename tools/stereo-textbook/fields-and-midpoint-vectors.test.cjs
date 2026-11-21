'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const review = require('./fields-and-midpoint-vectors.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const add = (...vs) => vs.reduce((a,b) => a.map((x,i) => x+b[i]), [0,0,0]);
const scale = (v,k) => v.map(x => x*k);
const diff = (a,b) => add(a,scale(b,-1));
const near = (a,b) => assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)), a+' vs '+b);
const same = (a,b) => {assert.equal(a.length,b.length); a.forEach((x,i)=>near(x,b[i]));};
const length = v => Math.hypot(...v);
const v = (p,a,b) => diff(p[b],p[a]);
const coefficients = (basis,weights) => add(...basis.map((a,i)=>scale(a,weights[i])));
const params = {
 '0597-a':['-1','sqrt(2)','2','sqrt(2)/2','2'], '0597-b':['sqrt(19+4*sqrt(3))/3','1','sqrt(140/27)','4/3','1/3'],
 '0598':['0;-1;0','-1;1;-1','-1/2;1/2;-1/2','1/2;1/2;-1/2'],
 '0599':['1;1;0','1;0;1','1;1/2;1/2','1;2/3;1/3'], '0600':['0;-1;1','1;-1;1','1/2;0;1/2','1;-1/2;1/2'],
 '0601':['1;0.5;1','9/4','1.5','sqrt(33)/4'], '0602':['1/2;1/2;0','1;-1;1','3/4;-1/4;1/2','2/3;0;1/3'],
 '0603':['2/3','1/3','1/3;1/3;1/3','1;3;1']
};
const {available,issues}=engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
let fields=0, fieldConfigs=0, affineConfigs=0;
for(const [suffix,answers] of Object.entries(params)){
  const id='ex-main-'+suffix,card=available.get(id),model=card.visualization.model;
  assert(Object.hasOwn(review.cards,id));
  const pages=suffix==='0603'?[154,155]:[154];
  assert.deepEqual(card.source.printedPages,pages);assert.deepEqual(card.source.pdfPages,pages.map(n=>n+2));
  assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
  viewer.prepare(model); assert.equal(answers.length,card.steps.length);
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(answers[i],step.input.accepted).status,'correct',id+'/'+step.id);
    for(const input of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(input,step.input.accepted).status,'wrong',id+'/'+step.id+' '+input);
    fields++;
  }
  if(suffix.startsWith('0597')){
    const targets=suffix.endsWith('a')?['A','C1']:['C','B1','F','O'];
    for(const side of [.5,2,7]){
      const points=Object.fromEntries(Object.entries(model.points).map(([key,x])=>[key,scale(x,side/3)]));
      for(const charge of [-3,0,2]){
        const k=2.7,U=k*Math.abs(charge)/side**2;
        for(const target of targets){
          const contributions=['A1','B','D'].map(s=>{
            const displacement=v(points,s,target),field=scale(displacement,k*charge/length(displacement)**3);
            if(charge!==0){
              // All source arrows share a single drawing scale, including their radial lengths.
              const displayed=v(model.points,target,'_'+target+s);
              same(displayed,scale(field,.99*side**2/(k*charge)));
            }
            return field;
          });
          const E=add(...contributions);
          if(charge!==0)same(v(model.points,target,'_'+target+'sum'),scale(E,.99*side**2/(k*charge)));
          const diag=v(points,'A','C1');
          if(target==='A'||target==='C1'){
            same(E,scale(diag,k*charge/side**3*(target==='A'?-1:1/Math.sqrt(2))));
          }else{
            const ratio={C:Math.sqrt(19+4*Math.sqrt(3))/3,B1:Math.sqrt(19+4*Math.sqrt(3))/3,F:2*Math.sqrt(105)/9,O:4/3}[target];
            near(length(E),U*ratio);
          }
          fieldConfigs++;
        }
      }
    }
    continue;
  }
  for(const basisMap of [
    [[1,0,0],[0,1,0],[0,0,1]], [[1,2,0],[0,1,1],[0,0,2]], [[-2,0,3],[0,1,0],[0,0,1]]
  ]){
    const p=Object.fromEntries(Object.entries(model.points).map(([n,pt])=>[n,basisMap.map(row=>row.reduce((s,x,i)=>s+x*pt[i],0))]));
    const r=(a,b)=>v(p,a,b);
    if(suffix==='0598'){
      const basis=[r('A','A1'),r('A','B'),r('A','D')];
      same(r('C','D'),coefficients(basis,[0,-1,0]));same(r('D1','O'),coefficients(basis,[-.5,.5,-.5]));
      same(r('O','B1'),coefficients(basis,[.5,.5,-.5]));
    }else if(suffix==='0599'){
      const basis=[r('D','A'),r('A','B'),r('A','C')];
      same(r('D','K'),coefficients(basis,[1,.5,.5]));
      same(add(r('D','B'),scale(r('B','C'),1/3)),coefficients(basis,[1,2/3,1/3]));
    }else if(suffix==='0600'||suffix==='0602'){
      const basis=[r('O','A'),r('O','B'),r('O','C')];
      same(r('O','D'),coefficients(basis,[1,-1,1]));
      if(suffix==='0600'){
        same(r('O','M'),coefficients(basis,[.5,0,.5]));same(r('O','N'),coefficients(basis,[1,-.5,.5]));
      }else{
        same(r('O','M'),coefficients(basis,[.5,.5,0]));same(r('O','K'),coefficients(basis,[.75,-.25,.5]));
        same(add(r('O','M'),scale(r('M','D'),1/3)),coefficients(basis,[2/3,0,1/3]));
      }
    }else if(suffix==='0601'){
      const basis=[r('A','B'),r('A','D'),r('A','A1')];
      same(r('A','K'),coefficients(basis,[1,.5,1]));same(r('A','T'),coefficients(basis,[1,.25,1]));
      // Metric claims apply to the cube before a general affine change.
      const original=model.points,m=length(v(original,'A','B'));
      near(length(v(original,'A','K'))/m,1.5);near(length(v(original,'A','T'))/m,Math.sqrt(33)/4);
    }else{
      same(r('A','M'),scale(r('A','K'),2/3));
      for(const origin of [[0,0,0],p.O,p.M,[10,-7,4]]){
        const rays=['A','B','C'].map(end=>diff(p[end],origin));
        same(diff(p.M,origin),scale(add(...rays),1/3));
      }
    }
    affineConfigs++;
  }
}
assert.equal(fields,34);assert.equal(fieldConfigs,54);assert.equal(affineConfigs,18);
assert.equal(Object.keys(review.cards).length,8);
console.log('FIELDS_AND_MIDPOINT_VECTORS_OK',JSON.stringify({fields,fieldConfigs,affineConfigs}));
