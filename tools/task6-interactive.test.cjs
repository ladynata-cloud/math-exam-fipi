'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../trainers/oge-task6-fractions.html'),'utf8');
function boot(t){
  const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://mathexam.space/trainers/oge-task6-fractions.html',pretendToBeVisual:true,virtualConsole:console});
  t.after(()=>{dom.window.close();assert.deepEqual(errors,[]);});const w=dom.window,$=id=>w.document.getElementById(id),evaluate=s=>w.eval(s);
  const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const snapshot=()=>evaluate('JSON.stringify({records,streak,answeredCur,pos,order})');
  return{w,$,evaluate,input,snapshot,model:evaluate('Task6Labs.model'),family:evaluate('Task6Labs.family')};
}
const step=(kind,a,b,prompt='')=>({kind,prompt,audit:{args:[a,b].filter(Boolean)}});
const q=(n,d=1)=>[BigInt(n),BigInt(d)];
const same=(actual,n,d=1)=>assert.equal(actual[0]*BigInt(d),BigInt(n)*actual[1]);

test('every operation of all174 plans has a contextual interactive model and an independent small question',t=>{
  const ui=boot(t),plans=ui.evaluate('TASKS.map(t=>Task6Hints.plan(t))'),families=new Set();let count=0;
  for(const plan of plans)for(const current of plan.steps){
    const model=ui.model(current,{});count++;families.add(model.family);
    assert.ok(model.title&&model.instruction&&model.simple&&model.exercise.prompt);
    assert.ok(model.body||model.readout);assert.ok(model.controls.length||model.body.includes('data-lab-part'));
    assert.doesNotMatch(model.body+model.readout,/NaN|Infinity|undefined/);
    for(const control of model.controls){
      const value=control.type==='range'?control.max:control.type==='toggle'?true:'3';
      const changed=ui.model(current,{[control.key]:value});assert.doesNotMatch(changed.body+changed.readout,/NaN|Infinity|undefined/);
    }
  }
  assert.equal(count,1054);assert.deepEqual([...families].sort(),['add','decimal','div','gcd','lcm','mixed','mul','numerator','pow','reciprocal','sub']);
});

test('common denominator and common divisor experiments distinguish exact divisibility',t=>{
  const{model}=boot(t),l=step('lcm',q(6),q(4)),g=step('gcd',q(18),q(24));
  const no=model(l,{candidate:'8'});assert.equal(no.data.dividesBoth,false);assert.equal(no.data.remainderA,2n);assert.equal(no.data.remainderB,0n);
  assert.equal(model(l,{candidate:'12'}).data.dividesBoth,true);assert.equal(model(g,{candidate:'6'}).data.dividesBoth,true);
  assert.equal(model(g,{candidate:'12'}).data.dividesBoth,false);
  for(const candidate of ['0','-2','1/0','2abc','1e4','9'.repeat(129)])assert.match(model(g,{candidate}).readout,/положительное целое/);
});

test('number line handles subtraction of negatives and exact fractional progress',t=>{
  const{model}=boot(t),s=step('sub',q(-2),q(-3)),a=step('add',q(-2),q(-3));
  same(model(s,{progress:10}).data.current,1);same(model(s,{progress:5}).data.current,-1,2);
  same(model(a,{progress:10}).data.current,-5);same(model(a,{progress:5}).data.current,-7,2);
  assert.equal(model(s).exercise.expected,'right');assert.equal(model(a).exercise.expected,'left');
});

test('multiplication and division models use exact products, signs and remainders',t=>{
  const{model}=boot(t);same(model(step('mul',q(3,4),q(-2)),{progress:10}).data.product,-3,2);
  same(model(step('mul',q(3,4),q(-2)),{progress:5}).data.product,-3,4);
  const divided=step('div',q(3,4),q(2,5));assert.equal(model(divided,{candidate:'15/8'}).data.matches,true);
  const wrong=model(divided,{candidate:'1'});same(wrong.data.remainder,7,20);assert.equal(wrong.data.matches,false);
  same(model(step('div',q(-3,4),q(2,5)),{candidate:'-15/8'}).data.remainder,0);
  for(const candidate of ['1/0','1.2.3','2abc'])assert.ok(!('product'in model(divided,{candidate}).data));
});

test('decimal shifts, mixed units, reciprocal and powers preserve their mathematical meaning',t=>{
  const{model}=boot(t);
  const multiply=step('mul',q(-6,5),q(100),'Убери запятую в первом числе.');same(model(multiply,{count:1}).data.result,-12);same(model(multiply,{count:2}).data.result,-120);
  const divide=step('div',q(-12),q(100),'Верни запятую: раздели результат на 100.');same(model(divide,{count:2}).data.result,-3,25);
  const mixed={...step('add',q(15),q(2)),lab:{family:'mixed',whole:3n,numerator:2n,denominator:5n}};assert.equal(model(mixed,{count:3}).data.total,17n);
  const inverse=step('div',q(1),q(-2,3),'Переверни вторую дробь.');same(model(inverse,{flipped:true}).data.shown,-3,2);same(model(inverse,{flipped:true}).data.product,1);
  const power=step('pow',q(-2),q(3));for(const[count,result]of [[0,1],[1,-2],[2,4],[3,-8]])same(model(power,{count}).data.product,result);
  const zeroPower=step('pow',q(5),q(0));same(model(zeroPower,{count:0}).data.product,1);assert.ok(model(zeroPower).controls[0].max>model(zeroPower).controls[0].min,'Zero-power help has a working control');
  same(model(step('pow',q(0),q(2)),{count:0}).data.product,0);
});

test('unfinished answers, model settings and nested help survive collapse and task roundtrip',t=>{
  const ui=boot(t);ui.input('ans','-0,6');ui.$('hintToggle').click();ui.input('stepAnswer','unfinished');ui.$('stepHelpToggle').click();ui.input('lab-candidate','70');
  for(const id of ['labSimple','labExercise']){ui.$(id).open=true;ui.$(id).dispatchEvent(new ui.w.Event('toggle'));}
  ui.input('labMiniAnswer','draft-mini');const before=ui.snapshot();
  ui.$('stepHelpToggle').click();ui.$('stepHelpToggle').click();assert.equal(ui.$('lab-candidate').value,'70');assert.equal(ui.$('labMiniAnswer').value,'draft-mini');assert.equal(ui.$('labExercise').open,true);
  ui.$('hintToggle').click();ui.$('hintToggle').click();assert.equal(ui.$('stepAnswer').value,'unfinished');assert.equal(ui.$('ans').value,'-0,6');assert.equal(ui.$('lab-candidate').value,'70');assert.equal(ui.snapshot(),before);
  ui.$('taskJump').value='1';ui.$('taskJump').dispatchEvent(new ui.w.Event('change',{bubbles:true}));ui.$('previous').click();assert.equal(ui.$('hintPanel').hidden,false);assert.equal(ui.$('stepAnswer').value,'unfinished');assert.equal(ui.$('lab-candidate').value,'70');assert.equal(ui.$('labMiniAnswer').value,'draft-mini');assert.equal(ui.$('labSimple').open,true);assert.equal(ui.$('labExercise').open,true);assert.equal(ui.$('ans').value,'-0,6');assert.equal(ui.snapshot(),before);
});

test('experiments and small-step checks never credit or fill the original task',t=>{
  const ui=boot(t);ui.$('hintToggle').click();ui.$('stepHelpToggle').click();const before=ui.snapshot(),session=ui.evaluate('hintSession()');
  ui.input('lab-candidate','50');ui.$('labExercise').open=true;ui.input('labMiniAnswer','10');ui.$('labMiniCheck').click();assert.match(ui.$('labMiniFeedback').textContent,/Верно/);assert.equal(ui.snapshot(),before);assert.equal(session.index,0);assert.equal(ui.$('stepAnswer').value,'');assert.equal(ui.$('ans').value,'');
  ui.$('labReturn').click();assert.equal(ui.w.document.activeElement.id,'stepAnswer');
});

test('wrong intermediate feedback and accepted work survive return without repeat credit',t=>{
  const ui=boot(t);ui.$('hintToggle').click();ui.input('stepAnswer','7');ui.$('stepCheck').click();const wrong=ui.$('stepFeedback').textContent;ui.$('hintToggle').click();ui.$('hintToggle').click();assert.equal(ui.$('stepAnswer').value,'7');assert.equal(ui.$('stepFeedback').textContent,wrong);assert.equal(ui.$('stepAnswer').getAttribute('aria-invalid'),'true');
  ui.input('stepAnswer','50');ui.$('stepCheck').click();const accepted=ui.$('hintSteps').textContent;ui.$('taskJump').value='1';ui.$('taskJump').dispatchEvent(new ui.w.Event('change'));ui.$('previous').click();assert.equal(ui.$('hintSteps').textContent,accepted);assert.equal(ui.evaluate('hintSession().index'),1);assert.equal(ui.evaluate('streak'),0);assert.equal(ui.evaluate('currentRecord().wrongAttempts'),0);
});

test('all174 tasks can open, manipulate and return from their first interactive help without errors',t=>{
  const ui=boot(t);ui.evaluate("cat='all';startSet()");for(let i=0;i<174;i++){
    ui.evaluate(`pos=${i};renderTask()`);ui.$('hintToggle').click();if(ui.$('hintPanel').hidden)ui.$('hintToggle').click();ui.$('stepHelpToggle').click();if(ui.$('stepLab').hidden)ui.$('stepHelpToggle').click();
    assert.ok(ui.$('labOutput').textContent.trim()||ui.$('labOutput').querySelector('svg'));assert.ok(ui.$('labSimple'));assert.ok(ui.$('labExercise'));
    ui.$('stepHelpToggle').click();assert.equal(ui.$('stepLab').hidden,true);ui.$('stepHelpToggle').click();assert.equal(ui.$('stepLab').hidden,false);
  }
});

test('visible previous-task and course navigation are present and do not mark skipped',t=>{
  const ui=boot(t);assert.equal(ui.$('previous').disabled,true);const link=ui.w.document.querySelector('.course-return a');assert.equal(link.getAttribute('href'),'../oge/');assert.ok(fs.statSync(path.join(__dirname,'../oge/index.html')).isFile());
  ui.evaluate('pos=2;renderTask()');const records=ui.evaluate('JSON.stringify(records)');ui.$('previous').click();assert.equal(ui.evaluate('pos'),1);assert.equal(ui.evaluate('JSON.stringify(records)'),records);
});


test('selecting fraction parts retains keyboard focus after the model updates',t=>{
  const ui=boot(t);ui.evaluate("cat='all';startSet();pos=TASKS.findIndex(t=>t.mode==='numerator');renderTask()");ui.$('hintToggle').click();ui.evaluate('hintSession().index=hintSession().plan.steps.length-1;renderHint()');ui.$('stepHelpToggle').click();
  for(const part of ['numerator','denominator']){const button=ui.w.document.querySelector('[data-lab-part="'+part+'"]');button.focus();button.click();assert.equal(ui.w.document.activeElement.dataset.labPart,part);assert.equal(ui.w.document.activeElement.getAttribute('aria-pressed'),'true');}
});
