const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./coordinates-chapter-seven-self-check.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = engine.inspectBundle(bank.catalog, bank.lessons);
assert.deepEqual(issues, []);
const triple = a => a.join(';');
const add = (a,b) => a.map((v,i)=>v+b[i]);
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const scale = (a,k) => a.map(v=>v*k);
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const lensq = a => dot(a,a);
const yes = b => b?'да':'нет';
let count=0;
for (const id of Object.keys(receipt.cards)) {
  const c=available.get(id), n=Number(c.source.exercise), part='абвгд'.indexOf(c.source.subpart), m=c.visualization.model, p=m.points;
  assert.equal(c.source.collection,'selfcheck');assert(c.source.chapter.startsWith('VII.'));assert.deepEqual(c.source.printedPages,[186]);assert.deepEqual(c.source.pdfPages,[188]);
  viewer.prepare(m);
  assert.deepEqual(new Set(Object.keys(m.views)), new Set(['neutral',...c.steps.map(s=>s.view),...c.help.map(s=>s.view)]));
  let values;
  switch(n){
    case 1:{const name=v=>v.filter(t=>t===0).length===2?['Ox','Oy','Oz'][v.findIndex(t=>t!==0)]:['Oyz','Oxz','Oxy'][v.findIndex(t=>t===0)];values=[name(p.P),'да',name(p.T),part===0?'плоскость':'ось'];break;}
    case 2:{const delta=sub(p.B,p.A);assert.equal(delta[2],0);assert.deepEqual(p.C,sub(p.A,delta));assert.equal(p.T[2],p.U[2]);values=[delta[2],p.C[2],p.T[2],delta[2]];break;}
    case 3:{const fixed=part===0?[2]:part===1?[1]:[1,2];for(const [x,i] of fixed.map(i=>[p.A[i],i]))for(const point of [p.B,p.C,p.D,p.T])assert.equal(point[i],x);const terms=[p.B[1],p.B[2],p.C[2],p.D[1],p.D[2]],idx=[[1,2,4],[0,3],[0,1,2,3,4]][part],numbers=triple(idx.map(i=>terms[i]));values=[numbers,5-idx.length,'да',numbers];break;}
    case 4:{const v=sub(p.C,p.A);values=[triple(v),triple(scale(v,-1)),triple(sub(p.O,p.U)),'-1;-1'];break;}
    case 5:{assert.equal(lensq(p.B),1);assert.deepEqual(p.B,p.D);const g=dot(p.A,p.B);values=[g,yes(g===0),dot(p.C,p.D),g?'коллинеарен':'перпендикулярен'];break;}
    case 6:{assert.equal(p.A[1],0);assert.equal(p.B[0],0);values=['да',p.B[0],triple(p.C.slice(0,2)),part===0?'нет':'перпендикулярен'];break;}
    case 7:{const k=p.B[0]/p.A[0],matches=p.A.every((v,i)=>Math.abs(k*v-p.B[i])<1e-10);assert.deepEqual(p.D,scale(p.C,-2));values=[k,k*p.A[1],-2,yes(matches)];break;}
    case 8:case 9:{const square=lensq(p.P),remaining=square-p.A[0]**2;assert.equal(square,lensq(p.Q));assert.equal(square,lensq(p.T));values=[square,remaining,0,yes(remaining>=0)];break;}
    case 10:{const d=Math.abs(p.B[0]-p.A[0]);assert.deepEqual(sub(p.B,p.A),[d,0,0]);assert.equal(lensq(sub(p.U,p.T)),(p.T[0]-p.U[0])**2);values=[d,lensq(sub(p.C,p.A)),0,part===0?'нет':'вдоль'];break;}
    case 11:{const k=dot(p.A,p.B)/Math.sqrt(lensq(p.A)*lensq(p.B));assert(Math.abs(k-[1,-1,0,.5,-.5][part])<1e-12);values=[Math.round(k*2)/2,dot(p.A,p.B),dot(p.C,p.D),Math.round(k*2)/2];break;}
    case 12:{const s=dot(p.A,p.B);assert.match(c.help[0].text,/0°/);values=[s,0,dot(p.C,p.D),s>0?'меньше':s<0?'больше':'равен'];break;}
    case 13:{const names=[['A','D','D1','C1'],['B','D','C','C1'],['A1','C1','A','D'],['D','B','D1','C1'],['B','B','A','C']][part];const [a,b,e,f]=names.map(k=>p[k]),u=sub(b,a),v=sub(f,e),g=dot(u,v);values=[triple(u),g,dot(scale(u,2),scale(v,2)),yes(lensq(u)!==0&&lensq(v)!==0&&g===0)];break;}
    case 14:{const k=dot(p.A,p.B);assert.equal(Math.sign(k-2),[-1,0,1][part]);values=[p.A[0]*p.B[0],k,dot(p.C,p.D),'да'];break;}
    case 15:{const total=add(p.B,p.C),mid=scale(total,.5);assert.deepEqual(mid,p.A);assert.deepEqual(sub(total,p.T),p.U);values=[triple(total),triple(mid),triple(p.U),triple(mid)];break;}
    case 16:{const mid=scale(add(p.M,p.N),.5);assert.deepEqual(mid,p.H);for(const name of 'ABCD')assert.equal(p[name][1],mid[1]);values=[mid[1],'Oy',2*mid[1]-2,'параллельны'];break;}
    case 17:{const transforms=[[-1,1,1],[-1,-1,1],[-1,-1,-1]];const changes=transforms.map(s=>s.filter(t=>t===-1).length),hands=transforms.map(s=>s.reduce((a,b)=>a*b)>0?'правая':'левая');values=[...changes,hands.join(';')];break;}
    default: throw Error('Unexpected question '+id);
  }
  assert.equal(c.steps.length,3);
  c.steps.forEach((s,i)=>{assert.equal(engine.classifyAnswer(String(values[i]),s.input.accepted).status,'correct',id+' '+i);for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+' '+i+' '+w);count++;});
  assert.equal(engine.classifyAnswer(String(values[3]),c.answer.accepted).status,'correct',id+' final');
}
assert.equal(Object.keys(receipt.parts).length,17);assert.equal(count,117);
console.log('CHAPTER_VII_SELFCHECK_OK: all 17 printed questions, 39 addressed cards and 117 independently recalculated steps; the zero-vector angle follows point 76.');
