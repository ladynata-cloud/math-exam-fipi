'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const Check=require('../ege-profil/start/checks.js');
const Feedback=require('../ege-profil/start/practice-feedback.js');
const lessons=['geometry','probability','equations','functions','finance'].flatMap(name=>require('../ege-profil/start/'+name+'-data.js'));
const byTask=new Map(lessons.flatMap(lesson=>lesson.tasks.map(task=>[task.id,{lesson,task}])));
// Independent numerical receipts from the authored conditions, not values
// returned by the diagnostic. Each tuple is task, guided step, wrong, correct.
const groups={
  direction:[['vec-coordinates-x',1,'-8','8'],['vec-coordinates-y',1,'12','-12'],['vec-coordinates-reverse',1,'-7','7']],
  length:[['vec-length-basic',1,'100','10'],['vec-length-negative',2,'169','13'],['vec-length-points',2,'169','13'],['vec-length-axis',1,'121','11'],['vec-operations-difference-length',2,'100','10']],
  scale:[['vec-length-scaled',1,'-21','21']],
  denominator:[['prob-count-1',2,'6/4','3/5'],['prob-count-2',2,'3/9','1/4'],['prob-count-3',2,'7/13','7/20'],['prob-count-4',2,'8/12','2/5'],['prob-count-5',2,'9/6','3/5'],['prob-count-6',2,'4/12','1/4']],
  complement:[['prob-complement-count-1',1,'28/40','3/10'],['prob-complement-count-3',1,'35/50','3/10'],['prob-complement-count-4',1,'39/60','7/20'],['prob-complement-count-6',1,'60/80','1/4']],
  withoutReplacement:[['prob-afterdraw-1',2,'2/6','2/5'],['prob-afterdraw-4',2,'3/11','3/10']],
  transfer:[['eq-linear-1',2,'16/3','4'],['eq-linear-2',2,'14/4','5'],['eq-linear-3',2,'-7','-3'],['eq-linear-4',2,'4','2'],['eq-linear-5',2,'1.5','-2'],['eq-linear-6',2,'4','1.5']],
  square:[['eq-root-1',4,'1','4'],['eq-root-2',4,'2','6'],['eq-root-3',4,'5','2'],['eq-root-4',4,'3','8'],['eq-root-5',4,'17/3','5']],
  intercept:[['fn-line-1',4,'6','7'],['fn-line-2',4,'-6','-3'],['fn-line-3',4,'-0.5','2'],['fn-line-4',4,'6','7'],['fn-line-5',4,'-2','1'],['fn-line-6',4,'0','2']],
  slope:[['calc-tangent-1',2,'1/2','2'],['calc-tangent-3',2,'2','1/2'],['calc-tangent-4',2,'1/3','3'],['calc-tangent-5',2,'-2','-1/2']],
  principal:[['finance-630197-guided',2,'780','636'],['finance-630197-independent',2,'828','630.2']],
  lastInterest:[['finance-630197-guided',4,'386','463.2'],['finance-630197-independent',4,'350.2','402.73']]
};
const marker={direction:/начало и конец/,length:/квадрате длины/,scale:/направление вектора/,denominator:/все равновозможные исходы/,complement:/неразобранные билеты/,withoutReplacement:/вынутый жетон/,transfer:/свободного слагаемого/,square:/обеих частей в квадрат/,intercept:/формуле прямой/,slope:/изменение y делят на изменение x/,principal:/первоначальный долг/,lastInterest:/ещё одно начисление/};
function args(id,step,mode='guided',input){
  const {lesson,task}=byTask.get(id);
  return {lesson,task,step:mode==='guided'?step:0,mode,input,question:mode==='guided'?task.steps[step]:{answer:task.answer,strictNumeric:task.strictNumeric,domain:task.domain}};
}
const clone=value=>JSON.parse(JSON.stringify(value));
for(const [kind,cases]of Object.entries(groups))test(kind+': all authored numerical receipts, accepted equivalents and exact question boundaries',()=>{
  for(const [id,step,wrong,correct]of cases){
    const request=args(id,step,'guided',wrong),before=JSON.stringify(request);
    assert.ok(Check.check(request.question.answer,correct,undefined,request.question),id+': independent correct receipt');
    assert.ok(!Check.check(request.question.answer,wrong,undefined,request.question),id+': independently wrong receipt');
    const message=Feedback.forAnswer(request);assert.match(message,marker[kind],id);
    assert.doesNotMatch(message,/\d/,id+': no numeric answer disclosure');
    assert.equal(JSON.stringify(request),before,id+': pure read');
    assert.equal(Feedback.forAnswer({...request,input:correct}),null,id+': correct');
    assert.equal(Feedback.forAnswer({...request,input:'('+correct+')*2/2'}),null,id+': equivalent correct expression');
    assert.equal(Feedback.forAnswer({...request,input:String(Check.number(wrong)+0.123456789)}),null,id+': unrelated wrong answer');
    for(const input of ['', ' ', 'abc', '1/0', 'sqrt(-1)', null, {}, Infinity])assert.equal(Feedback.forAnswer({...request,input}),null,id+': invalid input');
    for(let other=0;other<request.task.steps.length;other++){
      if(other===step)continue;
      const output=Feedback.forAnswer(args(id,other,'guided',wrong));
      // The two financial rules deliberately share a task, but never a step.
      assert.equal(output,null,id+': no diagnostic on another guided step '+other);
    }
    for(const mode of ['plan','independent']){
      const output=Feedback.forAnswer(args(id,step,mode,wrong));
      if(kind==='principal')assert.equal(output,null,id+': intermediate debt is not a final-answer diagnostic');
      else{
        assert.match(output,marker[kind],id+': '+mode);
        assert.equal(Feedback.forAnswer(args(id,step,mode,correct)),null,id+': final accepted receipt');
        assert.equal(Feedback.forAnswer(args(id,step,mode,'('+correct+')*2/2')),null,id+': final equivalent receipt');
      }
    }
  }
});

test('all eligible existing conditions are covered; collisions are not mistakes',()=>{
  const kinds=new Set(['displacement-coordinate','vector-length','point-distance','difference-length','scaled-length','classical','complement-count','afterdraw','linear-equation','root-equation','line-value','tangent']);
  const actual=lessons.flatMap(lesson=>lesson.tasks).filter(task=>kinds.has(task.meta?.kind)||task.meta?.family==='last_payment_from_fixed_first_two').map(task=>task.id).sort();
  const receipts=[...new Set(Object.values(groups).flat().map(row=>row[0]).concat(['eq-root-6','calc-tangent-2','calc-tangent-6']))].sort();
  assert.deepEqual(receipts,actual,'Every condition of these authored shapes has a receipt or an explicit collision case');
  for(const [id,correct]of [['eq-root-6','6/5'],['calc-tangent-2','-1'],['calc-tangent-6','0']]){
    const t=byTask.get(id).task;
    for(const mode of ['guided','plan','independent'])assert.equal(Feedback.forAnswer(args(id,t.steps.length-1,mode,correct)),null,id);
  }
});

test('authoritative checker wins, including an accepted nearby ordinary answer',()=>{
  const request=args('fn-line-4',4,'independent','7.00000005');
  assert.equal(Check.check(7,request.input),true);assert.equal(Feedback.forAnswer(request),null);
  const original=globalThis.ProfileCheck;let checked=0;
  try{globalThis.ProfileCheck={number:Check.number,check(){checked++;return true;}};
    assert.equal(Feedback.forAnswer({...request,input:'6'}),null);assert.equal(checked,1);
  }finally{globalThis.ProfileCheck=original;}
});

test('wrong metadata, changed question contracts and unknown tasks fall back without a claim',()=>{
  for(const cases of Object.values(groups)){
    const [id,step,wrong]=cases[0],request=args(id,step,'guided',wrong);
    for(const mutate of [
      r=>{r.task.meta.kind='unknown';},r=>{r.task.meta=null;},r=>{r.task.meta=[];},
      r=>{r.task.id+='-new';},r=>{r.lesson.id+='-new';},r=>{r.task.answer+=1;},
      r=>{r.task.steps.pop();},r=>{r.question={...r.question,prompt:'A different question'};},
      r=>{r.question={...r.question,choices:['one','two']};},r=>{r.step=-1;},r=>{r.mode='unknown';}
    ]){
      const copy=clone(request);copy.task=copy.lesson.tasks.find(task=>task.id===id);copy.question=copy.task.steps[step];mutate(copy);
      assert.equal(Feedback.forAnswer(copy),null,id+': malformed or changed contract');
    }
    // Every numeric metadata field used by these models must keep its type.
    for(const [field,value]of Object.entries(request.task.meta))if(typeof value==='number'||Array.isArray(value)||field==='parameters'){
      const copy=clone(request);copy.task=copy.lesson.tasks.find(task=>task.id===id);copy.question=copy.task.steps[step];
      copy.task.meta[field]=typeof value==='number'?String(value):{};
      assert.equal(Feedback.forAnswer(copy),null,id+': malformed '+field);
    }
  }
  assert.equal(Feedback.forAnswer(),null);
  for(const invalid of [null,false,1,'task',[]])assert.equal(Feedback.forAnswer(invalid),null);
  const request=args('fn-line-4',4,'independent','6');
  assert.equal(Feedback.forAnswer({...request,step:4}),null,'Final mode never borrows a guided step index');
  assert.equal(Feedback.forAnswer({...request,task:{...request.task}}),null,'A task must belong to the supplied lesson');
});

test('standalone browser module has no DOM/storage dependency and conservative numeric fallback',()=>{
  const sandbox={};for(const name of ['document','localStorage','sessionStorage'])Object.defineProperty(sandbox,name,{get(){throw Error('Forbidden '+name);}});
  vm.runInNewContext(fs.readFileSync(path.join(root,'ege-profil/start/practice-feedback.js'),'utf8'),sandbox);
  const feedback=sandbox.ProfilePracticeFeedback;
  const request=args('prob-count-1',2,'independent','6/4');assert.match(feedback.forAnswer(request),marker.denominator);
  assert.equal(feedback.forAnswer({...request,input:'3/5'}),null);
  assert.equal(feedback.forAnswer({...request,input:'sqrt(0.36)'}),null,'An unsupported expression is not misdiagnosed');
});
