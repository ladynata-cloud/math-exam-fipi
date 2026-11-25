'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./volume-selfcheck.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const previous=require('./inscribed-solids-predecessor.cjs').volumeSelfcheck;
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const sourceIndex=require('../../stereo-course/textbook/source-index.json');
const old=previous.courseBefore(bank,sourceIndex);
assert.equal(old.lessons.length,837);
const chapter=c=>c.source.collection==='selfcheck'&&c.source.chapter==='V. Объёмы тел';
assert.equal(old.lessons.filter(chapter).length,0);
const historicalChapters=new Set(old.lessons.filter(card=>card.source.collection==='selfcheck').map(card=>card.source.chapter));
function earlierQuestions(lessons,number){
  return lessons.filter(card=>card.source.collection==='selfcheck'&&historicalChapters.has(card.source.chapter)&&Number(card.source.exercise)===number)
    .map(card=>[card.id,card.source]).sort(([first],[second])=>first.localeCompare(second));
}
const vals={'01-a':[1,12,0],'01-b':[3,0,7],'02':[.5,.25,.25,9],'03':[4,.25,1,3],'04':[.25,.5,.2],'05':[4,2,.5],
  '06':[4,4,9],'07':[2,2,2,3],'08':[16,12,4/3],'09-a':[3,6,.5],'09-b':[.5,.125,1/27],'10':[3,27,8],
  '11':[1,3,3*Math.sqrt(3)],'12-a':[3,.25,20],'12-b':[9,108,16],'13':[2,4,9],'14':[1.5,27/8,8/125]};
const vec=(a,b)=>a.map((x,i)=>x-b[i]);
const d=(a,b)=>Math.hypot(...vec(a,b));
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-p[1]*q[0];},0))/2;
function near(x,y){assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(y)),x+' versus '+y);}
const surface=r=>4*Math.PI*r*r;
const ball=r=>surface(r)*r/3;
let bound=0;
for(const [suffix,answers] of Object.entries(vals)){
  const id='ex-selfcheck-v-'+suffix,c=available.get(id),m=c.visualization.model,n=Number(suffix.slice(0,2));
  const unlettered=[1,3,4,5,6,8].includes(n);
  const p=unlettered ? Object.fromEntries(Object.entries(m.points).map(([name,pt])=>[name.slice(1),pt])) : m.points;
  if(unlettered)assert(Object.keys(m.points).every(name=>name.startsWith('_')),'no unexplained corner labels');
  assert(chapter(c));assert.equal(Number(c.source.exercise),n);assert.deepEqual(c.source.printedPages,[138]);assert.deepEqual(c.source.pdfPages,[140]);
  assert(Object.hasOwn(manifest.cards,id));assert.equal(c.steps.length,answers.length);viewer.prepare(m);
  const historical=earlierQuestions(old.lessons,n);
  assert(historical.length>0);
  assert.deepEqual(earlierQuestions(bank.lessons,n),historical,'preserved earlier-chapter siblings for volume question '+n);
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(answers[i]),step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    if(i===c.steps.length-2)assert(available.has(step.justifications[0].theoryId));
    bound++;
  }
  if(suffix==='01-a'){
    for(let axis=0;axis<3;axis++)for(let i=0;i<8;i++){
      assert(p['A'+i][axis]>=p.B0[axis]&&p['A'+i][axis]<=p.B6[axis]);
    }
  }else if(suffix==='01-b'){
    near(d(p.A0,p.A1)*d(p.A0,p.A3)*d(p.A0,p.A4),3);
    near(d(p.B0,p.B1)*d(p.B0,p.B3)*d(p.B0,p.B4),3);
  }else if(n===2){
    near(area([p.A,p.M,p.N])/area([p.A,p.B,p.C]),.25);near(d(p.A,p.A1),d(p.M,p.M1));
  }else if(n===3){
    const V=k=>Math.PI*(d(p[k+'0'],p[k+'1'])/2)**2*d(p[k+'1'],p[k+'2']);near(V('A'),V('B'));
  }else if(n===4||n===5){
    const volume=k=>area([0,1,2,3].map(i=>p[k+i]))*d(p[k+'T'],p[k+'O'])/3;
    near(volume('B')/volume('A'),.5);
    if(n===5)for(const k of ['A','B'])for(let i=0;i<4;i++)near(d(p[k+i],p[k+(i+1)%4]),2);
  }else if(n===6||n===8){
    const volume=k=>{const [a,b,t]=[0,1,2].map(i=>p[k+i]);return Math.PI*(d(a,b)/2)**2*(t[1]-a[1])/3;};
    near(volume('A')/volume('B'),n===6?4:4/3);
  }else if(n===7){
    near(d(p.A,p.M),d(p.N,p.D));near(d(p.M,p.N),d(p.B,p.C));near(d(p.M,p.B),d(p.N,p.C));
    near(dot(vec(p.A,p.M),vec(p.B,p.M)),0);near(dot(vec(p.D,p.N),vec(p.C,p.N)),0);
    near(d(p.M,p.B)+d(p.M,p.P),d(p.B,p.P));
  }else if(n===11){
    near(d(p.O,p.B6),Math.sqrt(3)*d(p.O,p.N));
    for(let i=0;i<8;i++)near(d(p.O,p['B'+i]),Math.sqrt(3));
    near(ball(d(p.O,p.B6))/ball(d(p.O,p.N)),3*Math.sqrt(3));
  }else if(n>=9){
    const a=d(p.O,p.A),b=d(p.P,p.B);
    if(n===9)near(a/b,.5);if(n===10)near(ball(b)/ball(a),27);
    if(n===12)near(surface(b)/surface(a),suffix==='12-a'?.25:9);
    if(n===13){near(ball(a)/ball(b),8);near(surface(a)/surface(b),4);}
    if(n===14){near(surface(a)/surface(b),9/4);near(ball(a)/ball(b),27/8);}
  }
}
for(let n=1;n<=14;n++)assert.deepEqual(manifest.parts['selfcheck-V-'+n],[1,9,12].includes(n)?['а','б']:[null]);
assert.equal(Object.keys(manifest.cards).length,17);assert.equal(bound,54);
console.log('ATANASYAN_VOLUME_SELFCHECK_OK: 14 source questions, 17 distinct cards, 54 checked fields, chapter identity and annotated physical models');
