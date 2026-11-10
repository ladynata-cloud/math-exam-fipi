'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'trainers/oge-task22-functions-graphs.html'), 'utf8');
const KEY = 'mathExamCourseProgress.v1', TID = 'oge-t22-grafiki', LEGACY = 'mathExam.oge22.practice.v1';
const copy = value => JSON.parse(JSON.stringify(value));
const settle = () => new Promise(resolve => setTimeout(resolve, 35));
class Local extends ResourceLoader {
  fetch(url) {
    const file = path.resolve(ROOT, '.' + new URL(url).pathname);
    return file.startsWith(ROOT + path.sep) && fs.existsSync(file) ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}
async function boot(t, options = {}) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (!/Not implemented/.test(error.message)) errors.push(error.message); });
  vc.on('error', error => errors.push(String(error)));
  let seed = 773;
  const dom = new JSDOM(HTML, {
    url:'https://mathexam.test/trainers/oge-task22-functions-graphs.html' + (options.query || ''),
    runScripts:'dangerously', pretendToBeVisual:true, virtualConsole:vc,
    ...(options.external ? {resources:new Local()} : {}),
    beforeParse(w) {
      w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{}; w.__TESTHOOK__=true;
      w.Math.random=()=> options.fixedSeed === undefined ? ((seed=(1664525*seed+1013904223)>>>0)/4294967296) : options.fixedSeed/4294967296;
      if(options.shared)w.OgeCourseSharedMode=true;
      if(options.managed)w.MathExamLearning={managed:true};
      for(const [key,value] of Object.entries(options.saved || {}))w.localStorage.setItem(key, typeof value==='string'?value:JSON.stringify(value));
      if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Unavailable','SecurityError');}});
    }
  });
  t.after(()=>dom.window.close());
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  if(options.external)await settle();
  const w=dom.window,d=w.document;
  return {w,d,api:w.__api,errors,
    host:()=>d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"]'),
    all:()=>JSON.parse(w.localStorage.getItem(KEY)||'{}'),
    evidence:()=>JSON.parse(w.localStorage.getItem(KEY)||'{}')[TID]?.ext?.auditLearning,
    records:()=>JSON.parse(w.localStorage.getItem(KEY)||'{}')[TID]?.ext?.auditLearning?.attempts||[],
    storage:()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];})),
    input(node,value,type='input'){node.value=String(value);node.dispatchEvent(new w.Event(type,{bubbles:true}));}
  };
}
function button(root,text){const node=[...root.querySelectorAll('button')].find(x=>x.textContent.trim()===text);assert(node,'Button: '+text);return node;}
function module(f,id){f.d.querySelector('.mod-btn[data-mod="'+id+'"]').click();return f.host();}
function help(host){host.querySelector('.minimal-hint > button').click();return host.querySelector('.minimal-help');}
function check(host){host.querySelector(':scope > .btn-row .btn-check').click();}
function fillCorrect(f,host){
  const input=host.querySelector('.ans-host'),problem=host.__problem;
  input.querySelectorAll('.ab-rm').forEach(node=>node.click());
  if(problem.atoms){
    for(const atom of problem.atoms){
      button(input,atom.type==='point'?'+ отдельное значение':'+ промежуток').click();
      const row=[...input.querySelectorAll('.ab-row')].at(-1);
      if(atom.type==='point')f.input(row.querySelector('.v-dec'),atom.v.toString());
      else{
        f.input(row.querySelectorAll('.v-dec')[0],atom.lo.toString());
        f.input(row.querySelectorAll('.v-dec')[1],atom.hi.toString());
        f.input(row.querySelectorAll('select')[0],atom.loCl?'[':'(','change');
        f.input(row.querySelectorAll('select')[1],atom.hiCl?']':')','change');
      }
    }
  }else for(const value of problem.vals){button(input,'+ значение').click();f.input([...input.querySelectorAll('.v-dec')].at(-1),value.toString());}
}
function graph(f,problem){const view=f.api.makeGraphView(true);f.d.body.append(view.el);view.show(problem);return view;}
function exact(f,view,value){f.input(view.el.querySelector('.graph-exact-input'),value);button(view.el,'Поставить точно').click();return Number(view.el.querySelector('.badge-t2').textContent);}
function problemInv(f,a=3,b=5){const {Fr}=f.api,xh=Fr(-b,a);return {kind:'hyperbola',sub:'inv_kx',a,b,xh,yh:Fr(1).div(xh),varname:'k',target:1};}
function problemShift(f,C=2,p=3){const {Fr}=f.api;return {kind:'hyperbola',sub:'shift_m',C,p,xh:Fr(-p),varname:'m',target:0};}
function problemParab(f,p=4,xh=1){const {Fr}=f.api;return {kind:'hyperbola',sub:'parab_kx',p:Fr(p),sq:Fr(Math.sqrt(p)),xh:Fr(xh),yh:Fr(-xh*xh-p),varname:'k',target:1};}
function oldStorage(){return {[KEY]:{
  unrelated:{v:1,solvedByType:{x:3},ext:{preserve:true}},
  [TID]:{v:1,updatedAt:123,solvedByType:{legacy:9},ext:{skills:{kept:7},unrelated:{keep:['a',2]}}}
},[LEGACY]:{m1:{solved:12,tries:18,foreign:'yes'},m3:{solved:4,tries:6},unrelated:{keep:true}}};}

test('exact fractional k and dynamic slider bounds reach 9/25 and 81 without counting the hole',async t=>{
  const f=await boot(t),v=graph(f,problemInv(f));
  assert.equal(exact(f,v,'9/25'),1);
  assert.equal(v.el.querySelectorAll('.xmark').length,1);
  assert.equal(exact(f,v,'360000001/1000000000'),2,'a nearby line still has two intersections');
  assert.equal(exact(f,v,'0'),0);assert.equal(exact(f,v,'-1'),0);
  v.el.querySelector('[data-parameter="9/25"]').click();assert.equal(v.getState().parameter,'9/25');
  const high=graph(f,problemInv(f,9,1));
  assert(Number(high.el.querySelector('input[type=range]').max)>=81);
  high.el.querySelector('[data-parameter="81"]').click();assert.equal(high.getState().parameter,'81');
  assert.equal(high.el.querySelector('.badge-t2').textContent,'1');
  assert.equal(high.el.querySelector('input[type=range]').value,'81');assert.deepEqual(f.errors,[]);
});

test('shifted hyperbola uses its actual count and markers, and separates asymptote from fractional missing height',async t=>{
  const f=await boot(t),v=graph(f,problemShift(f));
  for(const [value,count] of [['0',1],['2',0],['7/3',0],['2333333334/1000000000',1]]){
    assert.equal(exact(f,v,value),count,value);assert.equal(v.el.querySelectorAll('.xmark').length,count,value+' marks');
  }
  assert.match(v.el.querySelector('.graph-domain').textContent,/x ≠ 0, x ≠ -3/);
  const x=v.el.querySelector('.graph-point-input');f.input(x,'-3');button(v.el,'Найти значение').click();
  assert.match(v.el.querySelector('.graph-value').textContent,/не определена/);
  f.input(x,'0');button(v.el,'Найти значение').click();assert.match(v.el.querySelector('.graph-value').textContent,/не определена/);
  f.input(x,'1/2');button(v.el,'Найти значение').click();assert.match(v.el.querySelector('.graph-value').textContent,/y = 0/);
  assert.deepEqual(f.errors,[]);
});

test('parabola exact discriminant distinguishes tangency, a removed root and arbitrarily nearby lines',async t=>{
  const f=await boot(t),v=graph(f,problemParab(f));
  for(const [value,count] of [['0',0],['4',1],['-4',1],['-5',1],['5',2],['4000000001/1000000000',2],['3999999999/1000000000',0]]){
    assert.equal(exact(f,v,value),count,value);assert.equal(v.el.querySelectorAll('.xmark').length,count);
  }
  assert.equal(f.api.originalValue(problemParab(f),f.api.Fr(1)),null);
  assert.equal(f.api.originalValue(problemParab(f),f.api.Fr(0)).toString(),'-4','parabola has no extra x=0 exclusion');
  const degenerate=graph(f,problemParab(f,4,2));assert.equal(exact(f,degenerate,'-4'),0,'the sole tangent point is excluded');
  assert.deepEqual(f.errors,[]);
});

test('piecewise and modulus critical levels retain exact endpoints, distinct points and matching visible marks',async t=>{
  const f=await boot(t),{Fr,NEG_INF,POS_INF}=f.api;
  const seg=(kind,coef,lo,hi,loCl,hiCl)=>({kind,coef:coef.map(x=>Fr(x)),lo,hi,loCl,hiCl});
  // y=-x²-2x+3 for x>=-2; y=-x-1 for x<-2.
  const pieces=[seg('quad',[-1,-2,3],Fr(-2),POS_INF,true,false),seg('lin',[-1,-1],NEG_INF,Fr(-2),false,false)];
  const v=graph(f,{kind:'piecewise',pieces});
  for(const [m,count] of [['1',1],['3',3],['4',2],['4000000001/1000000000',1]]){
    assert.equal(exact(f,v,m),count);assert.equal(v.el.querySelectorAll('.xmark').length,count);
  }
  assert.equal(f.api.originalValue({kind:'piecewise',pieces},Fr(-2)).toString(),'3');
  // |x²+x-2| has zeros -2,1 and reflected vertex (-1/2,9/4).
  const abs=[seg('quad',[1,1,-2],NEG_INF,Fr(-2),false,false),seg('quad',[-1,-1,2],Fr(-2),Fr(1),true,true),seg('quad',[1,1,-2],Fr(1),POS_INF,false,false)];
  const a=graph(f,{kind:'modulus',pieces:abs});
  for(const [m,count] of [['-1',0],['0',2],['2',4],['9/4',3],['3',2]]){
    assert.equal(exact(f,a,m),count);assert.equal(a.el.querySelectorAll('.xmark').length,count);
  }
  assert.deepEqual(f.errors,[]);
});

test('all nine real prototype controls create correct UI answers and retain the exact problem while using help',async t=>{
  const f=await boot(t);let covered=0;
  for(const id of ['m1','m2','m3']){
    const host=module(f,id);
    for(const chip of [...host.querySelectorAll('.sub-chips button')].slice(1)){
      chip.click();const problem=host.__problem,key=host.__attempt.taskKey;const panel=help(host);
      const slider=panel.querySelector('input[type=range]'),old=panel.querySelector('svg').innerHTML;
      f.input(slider,slider.max);assert.notEqual(panel.querySelector('svg').innerHTML,old);
      for(const critical of panel.querySelectorAll('[data-parameter]')){critical.click();assert.equal(panel.querySelector('.graph-exact-input').value,critical.dataset.parameter);}
      assert.equal(host.__problem,problem);assert.equal(host.__attempt.taskKey,key);
      fillCorrect(f,host);check(host);assert.match(host.querySelector(':scope > .fb').textContent,/Верно/);
      assert.equal(f.records().at(-1).outcome,'helped');assert.equal(f.records().at(-1).helpUsed,true);covered++;
    }
  }
  assert.equal(covered,9);assert.deepEqual(f.errors,[]);
});

test('fraction graph choices render math rather than raw markup and explicit missing input is not a wrong answer',async t=>{
  const f=await boot(t),host=module(f,'m3');
  check(host);assert.equal(f.records().length,0);assert.equal(host.__attempt.firstAnswer,null);assert.equal(host.__attempt.errors.length,0);
  const row=host.querySelector('.ans-host .ab-row');row.querySelector('.v-tog').click();
  f.input(row.querySelector('.v-num'),'1');f.input(row.querySelector('.v-den'),'0');check(host);
  assert.match(host.querySelector(':scope > .fb').textContent,/нулю/);assert.equal(host.__attempt.errors.length,0);
  assert.equal(row.querySelector('.v-den').getAttribute('aria-invalid'),'true');
  const panel=help(host);button(panel,'Разобрать по шагам').click();
  button(panel,'Показать шаг').click();
  const choice=[...panel.querySelectorAll('.choices')].find(x=>x.querySelector('.frac'));
  assert(choice,'the graph selection contains a rendered fraction');assert.doesNotMatch(choice.textContent,/<span|class=|<i>/);
  for(const invalid of ['', '1/0', '1/2/3', '1e9', '<img>', '1.5/2'])assert.equal(f.api.parseStudentFraction(invalid),null,invalid);
  assert.equal(f.api.parseStudentFraction('−0,36').toString(),'-9/25');assert.deepEqual(f.errors,[]);
});

test('draft restores raw fraction fields, condition, first error, open help, exact parameter and revealed steps',async t=>{
  const f=await boot(t,{saved:oldStorage()}),host=module(f,'m3');
  f.input(host.querySelector('.ans-host .v-dec'),'777');check(host);
  const first=host.__attempt.firstAnswer,key=host.__attempt.taskKey,id=host.__attempt.id,statement=host.querySelector('.statement').innerHTML;
  const row=host.querySelector('.ans-host .ab-row');row.querySelector('.v-tog').click();f.input(row.querySelector('.v-num'),'9');f.input(row.querySelector('.v-den'),'');
  const panel=help(host);f.input(panel.querySelector('.graph-exact-input'),'9/25');button(panel,'Поставить точно').click();
  button(panel,'Разобрать по шагам').click();button(panel,'Показать шаг').click();
  const storage=f.storage(),before=f.all(),g=await boot(t,{saved:storage}),restored=g.host();
  assert.equal(restored.__attempt.taskKey,key);assert.equal(restored.__attempt.id,id);assert.equal(restored.querySelector('.statement').innerHTML,statement);
  assert.equal(restored.querySelector('.ans-host .v-num').value,'9');assert.equal(restored.querySelector('.ans-host .v-den').value,'');
  assert.equal(restored.querySelector('.ans-host .v-tog').getAttribute('aria-pressed'),'true');
  assert.equal(restored.__attempt.firstAnswer,first);assert.equal(restored.__attempt.errors.length,1);assert(restored.__attempt.helpKinds.includes('step-reveal'));
  const restoredHelp=restored.querySelector('.minimal-help');assert.equal(restoredHelp.hidden,false);assert.equal(restoredHelp.querySelector('.graph-exact-input').value,'9/25');
  assert.equal(restoredHelp.querySelectorAll('.step-card.peeked').length,1);assert.equal(restoredHelp.querySelectorAll('.step-card').length,2);
  assert.deepEqual(g.all().unrelated,before.unrelated);assert.deepEqual(g.all()[TID].solvedByType,before[TID].solvedByType);assert.deepEqual(g.all()[TID].ext.skills,before[TID].ext.skills);
  fillCorrect(g,restored);check(restored);assert.equal(g.records().at(-1).outcome,'helped');assert.equal(g.records().at(-1).helpUsed,true);
  assert.equal(JSON.parse(g.w.localStorage.getItem(LEGACY)).m3.solved,4,'revealed result never increases old solved counter');
  const h=await boot(t,{saved:g.storage()});check(h.host());assert.equal(h.records().length,1);assert.equal(h.host().__attempt.id,id);
  assert.deepEqual([...f.errors,...g.errors,...h.errors],[]);
});

test('first correct, automatically assisted correction and familiar results remain distinct and completion is idempotent',async t=>{
  const f=await boot(t),host=module(f,'m3');fillCorrect(f,host);check(host);assert.equal(f.records().at(-1).outcome,'independent');
  check(host);assert.equal(f.records().length,1);
  button(host,'Другая задача →').click();f.input(host.querySelector('.ans-host .v-dec'),'777');check(host);check(host);
  assert.equal(host.__attempt.errors.length,1,'same wrong submission is not duplicated');
  fillCorrect(f,host);check(host);assert.equal(f.records().at(-1).outcome,'helped');assert(f.records().at(-1).helpKinds.includes('automatic-feedback'));assert.equal(f.records().at(-1).firstAnswer,'777');
  const g=await boot(t,{fixedSeed:187654321});const repeat=module(g,'m3');fillCorrect(g,repeat);check(repeat);const old=repeat.__attempt.taskKey;
  button(repeat,'Другая задача →').click();assert.equal(repeat.__attempt.taskKey,old);assert.equal(repeat.__attempt.fresh,false);fillCorrect(g,repeat);check(repeat);
  assert.equal(g.records().at(-1).outcome,'familiar');assert.equal(g.records().at(-1).fresh,false);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('new task after help has a different condition, clean help and preserved unfinished work history',async t=>{
  const f=await boot(t),host=module(f,'m3'),old=host.__attempt.taskKey;help(host);f.input(host.querySelector('.ans-host .v-dec'),'23');check(host);
  button(host,'Другая задача →').click();assert.notEqual(host.__attempt.taskKey,old);assert.equal(host.__attempt.helpKinds.length,0);assert.equal(host.querySelector('.minimal-help').hidden,true);
  assert.equal(f.evidence().postponed.at(-1).firstAnswer,'23');assert(f.evidence().postponed.at(-1).helpKinds.includes('model'));
  fillCorrect(f,host);check(host);assert.equal(f.records().at(-1).outcome,'independent');assert.deepEqual(f.errors,[]);
});

test('stale tabs restore the latest draft and assistance before grading or overwriting another tab',async t=>{
  const f=await boot(t),host=module(f,'m3');f.input(host.querySelector('.ans-host .v-dec'),'12');
  const g=await boot(t,{saved:f.storage()}),newer=g.host();f.input(host.querySelector('.ans-host .v-dec'),'13');
  g.input(newer.querySelector('.ans-host .v-dec'),'23');help(newer);
  // Mimic storage propagation without delivering an event: checking must still guard it.
  const saved=g.w.localStorage.getItem(KEY);f.w.localStorage.setItem(KEY,saved);check(host);
  assert.equal(host.querySelector('.ans-host .v-dec').value,'23');assert(host.__attempt.helpKinds.includes('model'));
  assert.equal(f.records().length,0);assert.equal(host.__attempt.errors.length,0);assert.match(host.querySelector(':scope > .audit22-state').textContent,/вкладк/);
  fillCorrect(f,host);check(host);assert.equal(f.records().at(-1).outcome,'helped');assert.deepEqual([...f.errors,...g.errors],[]);
});

test('resume summary represents work, not initial entry, and chooses an unfinished module after another finishes',async t=>{
  const f=await boot(t);assert.equal(f.evidence().resume.hasWork,false);assert.equal(f.evidence().resume.at,0);
  const first=f.host();button(first.querySelector('.ans-host'),'+ отдельное значение').click();f.input(first.querySelector('.ans-host .v-dec'),'12');
  const actionAt=f.evidence().resume.at;assert(actionAt>0);assert.equal(f.evidence().resume.unfinished,true);
  const g=await boot(t,{saved:f.storage()});assert.equal(g.evidence().resume.at,actionAt,'reload is not a new action');
  const second=module(g,'m3');fillCorrect(g,second);check(second);
  assert.equal(g.evidence().resume.hasWork,true);assert.equal(g.evidence().resume.at,actionAt,'other unfinished module remains resumable');
  const remaining=module(g,'m1');fillCorrect(g,remaining);check(remaining);
  assert.equal(g.evidence().resume.hasWork,false);assert.equal(g.evidence().resume.unfinished,false);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('bounded history never makes an old task fresh; unknown progress and legacy counters survive',async t=>{
  const saved=oldStorage(),audit={v:1,attempts:Array.from({length:100},(_,i)=>({id:'old'+i,skill:'m1:parline',taskKey:'old-'+i,at:i+1,outcome:'helped',fresh:true,helpUsed:true})),seenKeys:Array.from({length:2048},(_,i)=>'seen-'+i),seenSaturated:true,draft:{sessions:{}}};
  saved[KEY][TID].ext.auditLearning=audit;
  const f=await boot(t,{saved}),host=module(f,'m3');assert.equal(host.__attempt.fresh,false);fillCorrect(f,host);check(host);
  assert.equal(f.records().length,100);assert.equal(f.records()[0].id,'old1');assert.equal(f.records().at(-1).outcome,'familiar');
  assert.equal(f.evidence().seenKeys.length,2048);assert.equal(f.evidence().seenSaturated,true);
  assert.equal(f.all()[TID].updatedAt,123,'evidence does not rewrite the old timestamp');assert.deepEqual(f.all()[TID].solvedByType,{legacy:9});assert.deepEqual(f.all()[TID].ext.unrelated,{keep:['a',2]});assert.deepEqual(f.all().unrelated,saved[KEY].unrelated);
  const old=JSON.parse(f.w.localStorage.getItem(LEGACY));assert.equal(old.m1.foreign,'yes');assert.equal(old.m1.solved,12);assert.deepEqual(old.unrelated,{keep:true});assert.equal(old.m3.solved,5);
  assert.deepEqual(f.errors,[]);
});

test('shared, managed, embedded and exam work never reads or writes personal evidence or legacy counters',async t=>{
  for(const options of [{shared:true},{managed:true},{query:'?mode=exam'},{query:'?exam=1'},{query:'?embed=1'}]){
    const f=await boot(t,{...options,saved:oldStorage()}),before=f.storage();let host;
    if(options.shared){host=f.d.createElement('div');f.d.body.append(host);f.w.Oge2022Native.mount(host,'m3:inv_kx');}else host=module(f,'m3');
    help(host);fillCorrect(f,host);check(host);assert.equal(f.api.Audit22.personal(),false);assert.deepEqual(f.storage(),before);assert.deepEqual(f.errors,[]);
  }
});

test('denied and malformed storage leave generation, exact input and checking usable',async t=>{
  const blocked=await boot(t,{blocked:true}),host=module(blocked,'m3');help(host);fillCorrect(blocked,host);check(host);
  assert.match(host.querySelector(':scope > .fb').textContent,/Верно/);assert.match(host.querySelector(':scope > .audit22-state').textContent,/Хранилище недоступно/);
  const corrupt=await boot(t,{saved:{[KEY]:'{broken',[LEGACY]:'null'}}),c=module(corrupt,'m3');fillCorrect(corrupt,c);check(c);assert.match(c.querySelector(':scope > .fb').textContent,/Верно/);assert.equal(corrupt.w.localStorage.getItem(KEY),'{broken','unreadable storage is retained for recovery');
  assert.deepEqual([...blocked.errors,...corrupt.errors],[]);
});

test('external reasoning notes stay tied to the restored condition and native help does not duplicate the model',async t=>{
  const f=await boot(t,{external:true}),host=module(f,'m3');await settle();const key=host.__attempt.taskKey;
  const writing=host.querySelector('.oca-work textarea');assert(writing);f.input(writing,'ОДЗ: знаменатель не равен нулю.\nПроверю выколотую точку.');
  help(host);await settle();assert.equal(host.querySelectorAll('.gview').length,1);assert(host.querySelector('.oca-graph-count'));
  const g=await boot(t,{external:true,saved:f.storage()}),restored=g.host();assert.equal(restored.__attempt.taskKey,key);
  assert.equal(restored.querySelector('.oca-work textarea').value,'ОДЗ: знаменатель не равен нулю.\nПроверю выколотую точку.');
  assert.equal(restored.querySelectorAll('.oca-work').length,1);assert.equal(restored.querySelectorAll('.gview').length,1);
  button(restored,'Другая задача →').click();await settle();assert.notEqual(restored.__attempt.taskKey,key);assert.equal(restored.querySelector('.oca-work textarea').value,'');
  assert.deepEqual([...f.errors,...g.errors],[]);
});


test('future evidence versions and malformed trainer branches remain byte-for-byte unchanged',async t=>{
  for(const replacement of [{v:2,attempts:[{id:'future',custom:['preserve',3]}],draft:{future:true}},'unrecognized']){
    const saved=oldStorage();saved[KEY][TID].ext.auditLearning=replacement;
    const f=await boot(t,{saved}),before=f.w.localStorage.getItem(KEY),host=module(f,'m3');help(host);fillCorrect(f,host);check(host);
    assert.equal(f.w.localStorage.getItem(KEY),before);assert.match(host.querySelector(':scope > .audit22-state').textContent,/другого формата/);assert.deepEqual(f.errors,[]);
  }
  const saved=oldStorage();saved[KEY][TID]='preserve malformed branch';const g=await boot(t,{saved}),before=g.w.localStorage.getItem(KEY),host=module(g,'m3');fillCorrect(g,host);check(host);assert.equal(g.w.localStorage.getItem(KEY),before);assert.deepEqual(g.errors,[]);
});


test('automatic mathematical feedback is sticky after reload and resume=1 chooses unfinished work rather than last empty navigation',async t=>{
  const f=await boot(t),host=module(f,'m3');f.input(host.querySelector('.ans-host .v-dec'),'777');check(host);
  assert(host.__attempt.helpKinds.includes('automatic-feedback'));assert.equal(f.evidence().resume.helpUsed,true);assert.equal(f.evidence().resume.skill,host.__attempt.skill);
  const id=host.__attempt.id;module(f,'m2');const saved=f.storage();
  const normal=await boot(t,{saved});assert.equal(normal.host().closest('.panel').dataset.mod,'m2','normal reload preserves active route');
  const g=await boot(t,{saved,query:'?resume=1'});assert.equal(g.host().closest('.panel').dataset.mod,'m3');assert.equal(g.host().__attempt.id,id);assert.equal(g.host().querySelector('.ans-host .v-dec').value,'777');assert.equal(new URLSearchParams(g.w.location.search).has('resume'),false,'resume is consumed once');
  fillCorrect(g,g.host());check(g.host());assert.equal(g.records().at(-1).outcome,'helped');assert(g.records().at(-1).helpKinds.includes('automatic-feedback'));assert.deepEqual([...f.errors,...normal.errors,...g.errors],[]);
});

test('empty exact drafts and radio choices in separate modules are restored without stealing one another',async t=>{
  const f=await boot(t),third=module(f,'m3');button(third,'Гипербола 1/x').click();let panel=help(third);button(panel,'Разобрать по шагам').click();
  const choice=panel.querySelector('.step-card input[type=radio]');choice.click();assert.equal(choice.checked,true);
  f.input(panel.querySelector('.graph-exact-input'),'');
  module(f,'m1');const first=f.host();panel=help(first);button(panel,'Разобрать по шагам').click();
  const other=panel.querySelector('.step-card input[type=radio]');if(other)other.click();assert.equal(choice.checked,true,'a choice in another module is a separate radio group');
  module(f,'m3');const g=await boot(t,{saved:f.storage()});assert.equal(g.host().querySelector('.graph-exact-input').value,'');assert.equal(g.host().querySelector('.step-card input[type=radio]').checked,true);assert.deepEqual([...f.errors,...g.errors],[]);
});


test('restoring a session and processing a storage event never echo a draft write to the other tab',async t=>{
  const f=await boot(t),host=module(f,'m3');f.input(host.querySelector('.ans-host .v-dec'),'12');const saved=f.storage();
  const g=await boot(t,{saved});assert.equal(g.w.localStorage.getItem(KEY),saved[KEY],'opening a peer is read-only');
  g.input(g.host().querySelector('.ans-host .v-dec'),'23');help(g.host());const newer=g.w.localStorage.getItem(KEY);
  f.w.localStorage.setItem(KEY,newer);f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:KEY,newValue:newer}));
  assert.equal(f.host().querySelector('.ans-host .v-dec').value,'23');assert.equal(f.w.localStorage.getItem(KEY),newer,'remote restore must not create a new revision');
  assert.deepEqual([...f.errors,...g.errors],[]);
});


test('all generated parabola critical positions include the remaining point and hole inside the visible graph',async t=>{
  const f=await boot(t);let cases=0;
  for(const p of [1,4,9])for(const xh of [-3,-2,-1,1,2,3]){
    if(Math.abs(xh)===Math.sqrt(p))continue;
    const v=graph(f,problemParab(f,p,xh));
    for(const button of v.el.querySelectorAll('[data-parameter]')){
      button.click();assert.equal(v.el.querySelector('.badge-t2').textContent,'1');
      const marks=[...v.el.querySelectorAll('.xmark,.dot-open')];assert.equal(marks.length,2,'one true intersection and one excluded hole');
      for(const mark of marks){const x=+mark.getAttribute('cx'),y=+mark.getAttribute('cy');assert(x>=0&&x<=v.grapher.W&&y>=0&&y<=v.grapher.H,'p='+p+', xh='+xh+', parameter='+button.dataset.parameter+' stays visible');}
      cases++;
    }
    assert(v.el.querySelectorAll('.tickY').length<=16,'axis labels stay readable');
  }
  assert.equal(cases,36);assert.deepEqual(f.errors,[]);
});


test('both signs of the 81 slope hole show the remaining hyperbola point and off-scale input has an explicit count',async t=>{
  const f=await boot(t);
  for(const b of [-1,1]){const v=graph(f,problemInv(f,9,b));assert.equal(exact(f,v,'81'),1);const point=v.el.querySelector('.xmark');assert(+point.getAttribute('cx')>=0&&+point.getAttribute('cx')<=v.grapher.W);assert(+point.getAttribute('cy')>=0&&+point.getAttribute('cy')<=v.grapher.H);assert.equal(v.el.querySelector('.graph-clipping').hidden,true);}
  const par=graph(f,problemParab(f,9,1));assert.equal(exact(f,par,'100'),2);assert.equal(par.el.querySelector('.graph-clipping').hidden,false);assert.match(par.el.querySelector('.graph-clipping').textContent,/1 из 2/);
  const hyp=graph(f,problemShift(f));assert.equal(exact(f,hyp,'2000000001/1000000000'),1);assert.match(hyp.el.querySelector('.graph-clipping').textContent,/1 из 1/);
  const inv=graph(f,problemInv(f));assert.equal(exact(f,inv,'1/100000000'),2);assert.match(inv.el.querySelector('.graph-clipping').textContent,/2 из 2/);
  assert.equal(exact(f,inv,'9/25'),1);assert.equal(inv.el.querySelector('.graph-clipping').hidden,true);assert.deepEqual(f.errors,[]);
});
