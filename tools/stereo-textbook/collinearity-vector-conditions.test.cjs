'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./collinearity-vector-conditions.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const answers = {
  '0586':['3','4','-1','10'], '0587':['1','3','2','3'],
  '0588-a':['-1.5','1.5','0','-3'], '0588-b':['-3','-5','0','7'],
  '0588-c':['4.5','2.5','0','2'], '0588-d':['4','6','0','-7'],
  '0589':['2','2','1/2','4'], '0590':['5','1/5','3','1'],
  '0591-a':['1','-1','-1','0'], '0591-b':['5','5','1/5','-3']
};
const sub=(u,v)=>u.map((x,i)=>x-v[i]);
const scale=(v,k)=>v.map(x=>k*x);
const add=(...vs)=>vs.reduce((u,v)=>u.map((x,i)=>x+v[i]),[0,0,0]);
const cross=([x,y,z],[a,b,c])=>[y*c-z*b,z*a-x*c,x*b-y*a];
const same=(u,v)=>assert(Math.hypot(...sub(u,v))<1e-8,JSON.stringify([u,v]));
const collinear=(u,v)=>Math.hypot(...cross(u,v))<1e-8;
const zero=[0,0,0];
const {available,issues}=engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts,{'586':[null],'587':[null],'588':['а','б','в','г'],'589':[null],'590':[null],'591':['а','б']});
let fields=0,affineModels=0,originCases=0, inverseCases=0;
for(const [suffix,values] of Object.entries(answers)){
  const id='ex-main-'+suffix,card=available.get(id),m=card.visualization.model;
  assert(Object.hasOwn(manifest.cards,id));
  assert.deepEqual(card.source.printedPages,[150]);
  assert.deepEqual(card.source.pdfPages,[152]);
  assert.equal(card.answer.mode,'manual');
  assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
  viewer.prepare(m);
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(values[i],step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+'/'+wrong);
    fields++;
  }
  for(const [frame,transform] of [v=>v,([x,y,z])=>[4+y,3+z+x/2,-2+x],([x,y,z])=>[1-2*x,7+z-2*y,1+2*z]].entries()){
    const p=Object.fromEntries(Object.entries(m.points).map(([k,v])=>[k,transform(v)]));
    const v=(a,b)=>sub(p[b],p[a]), lane=k=>v('_'+k,k);
    if(suffix==='0586'){
      assert(collinear(v('A','M'),v('M','B')));same(v('A','M'),scale(v('M','B'),3));
      for(const lambda of [-3,-2,-.5,0,.5,3]){
        // Construct from A and B, not from the displayed formula involving O.
        const point=add(p.A,scale(sub(p.B,p.A),lambda/(1+lambda)));
        same(sub(point,p.A),scale(sub(p.B,point),lambda));
        for(const origin of [p.O,p.A,transform([8,5,-3])]){
          const result=scale(add(sub(p.A,origin),scale(sub(p.B,origin),lambda)),1/(1+lambda));
          same(result,sub(point,origin));originCases++;
        }
      }
    }else if(suffix==='0587'){
      const a=v('O','A'),b=v('A','B'),c=v('B','C'),result=v('O','C');
      same(c,scale(a,-1));assert(!collinear(a,b));assert(!collinear(b,c));
      same(add(a,b,c),result);same(result,b);
      const sumLength=Math.hypot(...a)+Math.hypot(...b)+Math.hypot(...c);
      assert(sumLength>Math.hypot(...result)+1e-8);
      if(frame===0){assert.equal(sumLength,3);assert.equal(Math.hypot(...result),1);}
      assert.match(card.statement.text,/\|p\|=\|a\|\+\|b\|\+\|c\|/u);
      assert.match(card.answer.feedback,/утверждение ложно/iu);
    }else if(suffix.startsWith('0588-')){
      const weights={'a':[1,1],'b':[1,-1],'c':[1,3],'d':[-1,2]}[suffix.at(-1)];
      const a=lane('A'),b=lane('B'),c=lane('C'),r=lane('R');
      assert(collinear(a,c)&&collinear(b,c)&&collinear(r,c));
      same(r,add(scale(a,weights[0]),scale(b,weights[1])));
      // For c=0, no assumption a || b is licensed. The conclusion still holds
      // for independent a and b because their combination is collinear with 0.
      const a0=[0,1,-2], b0=[-3,-1,2];assert(!collinear(a0,b0));assert(collinear(add(scale(a0,weights[0]),scale(b0,weights[1])),zero));
    }else if(suffix==='0589'||suffix==='0590'){
      const a=lane('A'),b=lane('B'),u=lane('U'),w=lane('V');
      const k=suffix==='0589'?1:2, j=suffix==='0589'?-1:-3;
      same(u,add(a,scale(b,k)));same(w,add(a,scale(b,j)));assert(collinear(u,w)&&collinear(a,b));
      for(const s of [-2,0,1.5])for(const t of [-4,0,3]){
        const u0=scale([1,-2,3],s),v0=scale([1,-2,3],t);
        const recoveredB=scale(sub(u0,v0),1/(k-j));
        const recoveredA=sub(u0,scale(recoveredB,k));assert(collinear(recoveredA,recoveredB));
        same(add(recoveredA,scale(recoveredB,k)),u0);same(add(recoveredA,scale(recoveredB,j)),v0);
        inverseCases++;
      }
    }else{
      const a=v('O','A'), b=v('O','B'), u=v('O','U'),w=v('O','V');
      same(u,add(a,b));same(w,sub(a,b));assert(!collinear(u,w));assert(!collinear(a,b));
      if(suffix.endsWith('b')){
        const x=v('O','X'),y=v('O','Y');same(x,add(a,scale(b,2)));same(y,sub(scale(a,2),b));
        same(scale(add(x,scale(y,2)),.2),a);same(scale(sub(scale(x,2),y),.2),b);assert(!collinear(x,y));
      }
    }
    affineModels++;
  }
}
console.log('COLLINEARITY_VECTOR_CONDITIONS_OK',JSON.stringify({cards:10,fields,affineModels,originCases,inverseCases}));
