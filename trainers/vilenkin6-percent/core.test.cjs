'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const unit=require('../../courses/vilenkin-6-part-1/textbook-data/units-A.json').find(u=>u.id===2),math=require('../../courses/vilenkin-6-part-1/textbook-math'),C=require('./core')(unit,math);
const expected=[['37/100','0.37'],['3.4','85'],['0.75','75'],['4','400'],['0.2','20'],['40','4.5','180'],['5','500'],['6','0.02','2']];
test('all eight original tasks and eighteen steps agree with independent arithmetic',()=>{
  const answers=[37/100,340*25/100,3/4*100,8/2*100,130/650*100,450*(1-60/100),105/21*100,(300-294)/300*100];
  assert.equal(unit.tasks.length,8);assert.equal(unit.tasks.reduce((n,t)=>n+t.steps.length,0),18);
  unit.tasks.forEach((task,index)=>{
    assert(math.check(String(answers[index]),task.answer,task.answerType).ok);
    let s=C.initial(task.id);s=C.change(s,'mode','guided');
    for(const answer of expected[index]){s=C.change(s,'input',answer);s=C.change(s,'check');}
    assert(s.works[task.id].complete);assert.equal(s.works[task.id].step,expected[index].length);
    s=C.change(s,'repeat');s=C.change(s,'mode','independent');s=C.change(s,'input',String(answers[index]));s=C.change(s,'check');assert(s.works[task.id].complete);
  });
});
test('wrong answers, two-error hints, drafts, mode switches, notes and task navigation survive state roundtrip',()=>{
  let s=C.initial(unit.tasks[0].id);s=C.change(s,'input','1');s=C.change(s,'check');assert.equal(s.works[s.taskId].wrong[0],1);
  assert.throws(()=>C.change(s,'hint'));s=C.change(s,'check');s=C.change(s,'hint');assert(s.works[s.taskId].hints[0]);
  s=C.change(s,'input','37/100');s=C.change(s,'check');s=C.change(s,'notes','37 : 100 = 0,37');s=C.change(s,'rules',true);
  s=C.change(s,'task',unit.tasks[3].id);s=C.change(s,'input','4');const restored=C.normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored,s);s=C.change(restored,'task',unit.tasks[0].id);assert.equal(s.works[s.taskId].step,1);assert.equal(s.works[s.taskId].notes,'37 : 100 = 0,37');assert(s.rulesOpen);
});
test('rejects foreign tasks, forged completed steps, extra fields and oversized payloads',()=>{
  for(const mutate of [s=>s.taskId='v6-book-9-private',s=>s.works[unit.tasks[0].id].step=1,s=>s.works[unit.tasks[0].id].complete=true,s=>s.privateAccount='secret',s=>s.works[unit.tasks[0].id].notes='a'.repeat(1201),s=>s.works[unit.tasks[0].id].final='<img>']){
    const s=C.initial();mutate(s);assert.throws(()=>C.normalize(s));
  }
  assert.equal(C.change(C.initial(),'input','<b>37</b>').works[unit.tasks[0].id].answers[0],'b37/b');
});
test('board uses canonical source and does not read/write cabinet or browser progress',()=>{
  const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.match(app,/textbook-data\/units-A\.json/);assert.doesNotMatch(app,/localStorage|sessionStorage|\/api\/learning|MathExamLearning/);
  const catalog=require('../../learning/vilenkin6-textbook-catalog');assert.deepEqual(catalog.filter(row=>row.unitId===2).map(row=>row.contentId),unit.tasks.map(t=>t.id));
  const manifest=require('../board-compat.json').trainers.find(t=>t.trainerId==='vilenkin6-percent');assert.equal(manifest.file,'trainers/vilenkin6-percent/index.html');assert.equal(manifest.supportsBoardMirror,true);
});
