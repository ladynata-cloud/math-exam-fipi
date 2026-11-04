'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),source=process.env.TRAINER_SOURCE_ROOT||root;
const files=['arifmetika.html','drobi-oge-trainer.html','negative-numbers.html','rounding-stepwise.html'];
function mount(t,file,query='',options={}){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const html=fs.readFileSync(path.join(root,'trainers',file),'utf8');
  const dom=new JSDOM(html,{url:'https://example.test/trainers/'+file+query,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>false;
  let seed=71429;w.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  if(options.storage!==undefined)w.localStorage.setItem('mathExamCourseProgress.v1',options.storage);
  for(const script of d.scripts){if(script.src){const name=new URL(script.src).pathname;w.eval(fs.readFileSync(path.join(source,name),'utf8'));}else if(script.textContent.trim()){const expose=file==='drobi-oge-trainer.html'?';window.foundationTest={tasks:TASKS,hints:Task6Hints,getHelp:()=>foundationHelp,getGuided:()=>G,getDrill:()=>DR,openNumerator:()=>{go("module","exam","drill");DR.cat="progon";startDrill();DR.pos=DR.order.findIndex(i=>TASKS[i].mode==="numerator");drillTask();}};':'';w.eval(script.textContent+expose);}}
  assert.deepEqual(errors,[]);t.after(()=>{assert.deepEqual(errors,[]);w.close();});return {w,d};
}
function submit(f,id,value,button){f.d.getElementById(id).value=String(value);f.d.getElementById(button).click();}
function select(f,id,value){const node=f.d.getElementById(id);node.value=value;node.dispatchEvent(new f.w.Event('change'));}
function closed(node){assert(node);assert.equal(node.open,false);}

test('each foundation starts an actual exercise with folded settings and green action styling',t=>{
  for(const file of files){const f=mount(t,file);assert(f.d.querySelector('#oge-foundations-minimal'));for(const detail of f.d.querySelectorAll('.foundation-options,.foundation-results,.foundation-reference'))closed(detail);assert(f.d.body.textContent.includes('Хочешь подсказку?'));assert(f.d.querySelector('#ans,#dAns'));const prompt=f.d.querySelector('#prompt,#expr,#dCard .mexp');assert(prompt&&prompt.textContent.trim());}
});

test('rounding keeps every click phase, carry chain, mistakes, and progress accounting',t=>{
  const f=mount(t,'rounding-stepwise.html','?place=-2');assert.equal(f.w.task.p,-2);assert.equal(f.w.roundText('9,995',-2),'10,00');assert.equal(f.w.roundText('1,005',-2),'1,01');
  const q=f.w.task;f.d.querySelector('.digit[data-i="'+q.ti+'"]').click();assert.equal(f.w.step,'look');f.d.querySelector('.digit[data-i="'+q.li+'"]').click();assert.equal(f.w.step,'decision');f.d.getElementById(q.decision).click();assert.equal(f.w.step,'answer');
  submit(f,'ans',q.ans+1,'check');assert.equal(f.w.stats.total,0);assert.equal(f.w.solved,false);submit(f,'ans',q.ansText,'check');assert.equal(f.w.stats.total,1);assert.equal(f.w.stats.right,0);submit(f,'ans',q.ansText,'check');assert.equal(f.w.stats.total,1);
  f.d.getElementById('next').click();assert.equal(f.w.step,'target');assert.equal(f.w.solved,false);select(f,'place','6');assert.equal(f.w.task.p,6);closed(f.d.getElementById('rounding-options'));
});

test('rounding help keeps answer blank and valid place deep links are retained',t=>{
  for(const place of ['1','0','-1','-2','mixed']){const f=mount(t,'rounding-stepwise.html','?place='+place);assert.equal(f.d.getElementById('place').value,place);f.d.getElementById('hint').click();assert.equal(f.d.getElementById('ans').value,'');assert(f.d.querySelector('.digit.target'));}
});

test('arithmetic deep links and all level choices remain available',t=>{
  const f=mount(t,'arifmetika.html','?course=preoge&level=n3c');assert.equal(f.w.levelId,'n3c');assert.equal(f.w.phase,'col');assert.equal(f.d.querySelectorAll('#arithmetic-choices').length,1);assert(f.d.querySelectorAll('#level option').length>=40);closed(f.d.getElementById('arithmetic-choices'));
  select(f,'level','n4d');assert.equal(f.w.levelId,'n4d');assert.equal(f.w.phase,'select');const before=f.w.selLen;f.d.getElementById('more').click();assert(f.w.selLen>=before);assert(f.d.getElementById('selok'));assert(f.d.getElementById('course-next'));
});

test('an accepted column answer writes its digit immediately and preserves it at the following step',t=>{
  for(const level of ['n2b','n3c','n4b']){const f=mount(t,'arifmetika.html','?level='+level);assert.equal(f.w.phase,'col');const step=f.w.task.csteps[f.w.cIdx],expected=step.writes.filter(x=>x.row!=='CAR');assert(expected.length);submit(f,'ans',step.a,'check');for(const write of expected){assert.equal(f.w.task.writes[write.row][write.col],write.ch);assert(f.d.getElementById('vgrid').textContent.includes(write.ch));}assert(!f.d.getElementById('instruction').textContent.includes('по разрядам'));}
});

test('negative-number page runs the existing number-line exercise immediately and preserves alternative links',t=>{
  const f=mount(t,'negative-numbers.html','?seed=foundations-check'),get=()=>f.w.getBoardTrainerState();const state=get();assert.equal(state.phase,'start');assert(state.task);assert(f.d.querySelector('a[href="/trainers/who-is-stronger.html"]'));assert(f.d.querySelector('a[href="/trainers/negative-numbers-line.html"]'));closed(f.d.getElementById('negative-options'));
  f.w.clickPoint(state.task.a);assert.equal(get().phase,'end');f.w.clickPoint(state.task.res);assert.equal(get().phase,'answer');submit(f,'ans',state.task.res,'check');assert.equal(get().phase,'done');assert.equal(f.d.getElementById('sTotal').textContent,'1');assert.equal(f.d.getElementById('sRight').textContent,'1');
  f.d.querySelector('#mode [data-v="sub"]').click();assert.equal(get().mode,'sub');assert.equal(get().task.op,'-');assert.equal(get().phase,'start');
});

test('fraction practice opens with no solution, supports exact intermediate hints, and retains accepted work',t=>{
  const f=mount(t,'drobi-oge-trainer.html');assert(f.d.getElementById('dAns'));closed(f.d.getElementById('fraction-options'));assert.equal(f.d.getElementById('dStepsArea').hidden,true);
  const prompt=f.d.querySelector('#dCard>.mexp').innerHTML;f.d.getElementById('dStepBtn').click();assert.equal(f.d.getElementById('dStepsArea').hidden,false);assert.equal(f.d.getElementById('dAns').value,'');const expected=f.w.foundationTest.getHelp().plan.steps[0].expected.map(String).join('/');submit(f,'foundationHintAnswer','999999','foundationHintCheck');assert.equal(f.d.querySelectorAll('.foundation-help-step.done').length,0);submit(f,'foundationHintAnswer',expected,'foundationHintCheck');assert.equal(f.d.querySelectorAll('.foundation-help-step.done').length,1);assert.equal(f.d.querySelector('#dCard>.mexp').innerHTML,prompt);
  f.d.getElementById('dStepBtn').click();assert.equal(f.d.getElementById('dStepsArea').hidden,true);f.d.getElementById('dStepBtn').click();assert.equal(f.d.querySelectorAll('.foundation-help-step.done').length,1);f.d.getElementById('dAns').value='23/36';f.d.getElementById('dAns').dispatchEvent(new f.w.Event('input'));assert(f.d.querySelector('.foundation-answer-preview .f'));
});

test('every fraction-bank task has exact help and preserves numerator-only questions',t=>{
  const f=mount(t,'drobi-oge-trainer.html'),count=f.w.foundationTest.tasks.length;assert.equal(count,174);for(let i=0;i<count;i++){const task=f.w.foundationTest.tasks[i],p=f.w.foundationTest.hints.plan(task),result={same:p.final[0]*BigInt(task.d)===p.final[1]*BigInt(task.n),count:p.steps.length,mode:p.mode};assert.equal(result.same,true,'task '+i);assert(result.count>=2);}
  f.w.foundationTest.openNumerator();assert.match(f.d.querySelector('#dCard .prompt').textContent,/числитель/);f.d.getElementById('dStepBtn').click();assert(f.d.getElementById('foundationHintAnswer'));assert.equal(f.d.getElementById('dAns').value,'');
});

test('fraction generator deep links, all module modes, and immediate retained guided steps still work',t=>{
  for(const route of ['fraction-multiply','decimal-multiply','fraction-mixed','decimal-mixed']){const f=mount(t,'drobi-oge-trainer.html','#practice='+route);assert(f.d.getElementById('gExpr'));assert(f.d.getElementById('gIn'));assert.equal(f.d.querySelectorAll('#gSteps>.gstep').length,1);const answer=f.w.foundationTest.getGuided().task.steps[0].ans.join('/');submit(f,'gIn',answer,'gCheck');assert.equal(f.d.querySelectorAll('#gSteps>.gstep.done').length,1);assert(f.d.querySelector('#gSteps>.gstep.done').textContent.trim());f.d.querySelector('[data-module="dec"]').click();assert(f.d.getElementById('dAns'));f.d.querySelector('[data-t="learn"]').click();assert(f.d.getElementById('cGo'));}
});


test('arithmetic save errors remain visible outside closed results and preserve original bytes',t=>{
  const f=mount(t,'arifmetika.html','',{storage:'{broken'}),warning=f.d.getElementById('legacy-save-warning');assert.equal(warning.hidden,false);assert.equal(warning.closest('details'),null);submit(f,'ans',f.w.task.ansv,'check');assert.equal(f.w.localStorage.getItem('mathExamCourseProgress.v1'),'{broken');assert.equal(warning.hidden,false);
});

test('fraction help is counted as assisted, survives hiding, and resets for a new task',t=>{
  const f=mount(t,'drobi-oge-trainer.html');f.d.getElementById('dStepBtn').click();let guard=0;while(f.d.getElementById('foundationHintCheck')){assert(guard++<30);const h=f.w.foundationTest.getHelp(),expected=h.plan.steps[h.index].expected.map(String).join('/');submit(f,'foundationHintAnswer',expected,'foundationHintCheck');}const answer=f.w.foundationTest.getHelp().plan.answer.map(String).join('/');f.d.getElementById('dStepBtn').click();submit(f,'dAns',answer,'dCheck');const dr=f.w.foundationTest.getDrill();assert.equal(dr.status[dr.order[dr.pos]],'y');assert.match(f.d.getElementById('dStats').textContent,/с подсказкой или после ошибки/);f.d.getElementById('dCheck').click();assert.equal(dr.helpUsed,false);const next=f.w.foundationTest.tasks[dr.order[dr.pos]];submit(f,'dAns',next.n+'/'+next.d,'dCheck');assert.equal(dr.status[dr.order[dr.pos]],'g');
});


test('optional downloads keep a full-width body panel and all download actions',t=>{
  for(const file of ['rounding-stepwise.html','negative-numbers.html']){
    const f=mount(t,file),panel=f.d.querySelector('section.download-panel');
    assert.equal(panel.parentElement,f.d.body,'The download panel keeps its body-row layout contract');
    const details=panel.querySelector(':scope > details');closed(details);details.querySelector(':scope > summary').click();
    assert.equal(details.open,true);assert.equal(details.querySelectorAll('.download-actions a[download]').length,3);
  }
});
