'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'mathExamCourseProgress.v1';
const TID = 'oge24-dokazatelstva';
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const json = value => JSON.parse(JSON.stringify(value));

async function boot({saved, raw, notes, shared = false, managed = false, blocked = false, search = ''} = {}) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(source('trainers/oge-task24-proofs.html'), {
    url: 'https://mathexam.space/trainers/oge-task24-proofs.html' + search,
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.Math.random = () => 0.999; // Initial proof t1, no bank or answer changes.
      w.TextEncoder = TextEncoder;
      w.OgeCourseSharedMode = shared;
      if (managed) w.MathExamLearning = {managed: true};
      if (saved) w.localStorage.setItem(KEY, JSON.stringify(saved));
      if (typeof raw==='string') w.localStorage.setItem(KEY, raw);
      if (notes) w.localStorage.setItem('oge-course-proof-drafts-v1', notes);
      if (blocked) Object.defineProperty(w, 'localStorage', {get() { throw Error('Unavailable'); }});
      w.MathExamBoard = {register(adapter) { w.adapter = adapter; adapter.subscribe(() => {}); }};
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, {once: true}));
  const w = dom.window;
  for (const file of ['task19-textbook-data.js', 'task19-reference.js', 'oge-course-reference.js', 'oge-course-proof.js']) {
    w.eval(source('trainers/' + file));
  }
  if (shared) w.eval(source('trainers/oge-part2-geometry-board.js'));
  await new Promise(resolve => setTimeout(resolve, 0));
  return {w, d: w.document, errors, close() { w.OgeCourseProof?.dispose(); w.close(); }};
}
const run = (t, expression) => t.w.eval(expression);
const state = t => json(run(t, 'ST'));
const storage = t => JSON.parse(t.w.localStorage.getItem(KEY) || '{}');
const audit = t => storage(t)[TID]?.ext?.auditLearning;
function start(t, id, mode = 'train') {
  run(t, `ST={mode:${JSON.stringify(mode)},queue:[${JSON.stringify(id)}],qi:0,results:[]};loadTask();`);
}
function pick(t, i) { run(t, `pickCard({type:'s',i:${i}});`); }
function complete(t, order) {
  for (const i of order) {
    pick(t, i);
    if (run(t, 'ST.awaitJust!==null')) run(t, 'pickJust(ST.justPool.findIndex(x=>x.ok))');
  }
}
function lastAttempt(t) { return audit(t).attempts.at(-1); }

// These paths were read as mathematical arguments before implementation.
// In particular: t2's two angles and one side are independent; t5 and t14
// each require BOTH premises; t9's area decomposition needs no equality.
const ORDERS = {
  t1: [2, 0, 1, 3], t10: [1, 2, 0, 3, 4], t13: [1, 0, 3, 4, 2, 5, 6],
  t15: [0, 1, 2, 3], t2: [2, 1, 0, 3, 4], t3: [1, 0, 2, 3, 4],
  t4: [2, 0, 1, 3], t5: [1, 0, 2], t7: [0, 1, 2, 3], t6: [0, 1, 2, 3],
  t8: [1, 2, 3, 0, 4], t9: [2, 0, 1, 3], t12: [0, 1, 2], t11: [0, 1, 2],
  t14: [1, 0, 2, 3], t16: [0, 1, 2, 3], t17: [1, 0, 2, 3, 4],
  t18: [0, 1, 2, 3], t19: [1, 0, 2, 3], t20: [2, 0, 1, 3]
};

test('all 20 proof arguments accept mathematically valid paths and retain all 85 authored statements', async () => {
  const t = await boot();
  try {
    let steps = 0;
    for (const [id, order] of Object.entries(ORDERS)) {
      start(t, id); complete(t, order);
      assert.equal(state(t).solvedNow, true, id);
      assert.equal(state(t).err, 0, id);
      assert.deepEqual(state(t).order, order, id);
      assert.deepEqual([...t.d.querySelectorAll('.chain .citem')].map(n => +n.dataset.proofStep), order);
      assert.equal(t.d.querySelectorAll('.chain .citem').length, order.length);
      steps += order.length;
    }
    assert.equal(steps, 85);
    assert.deepEqual(t.errors, []);
  } finally { t.close(); }
});

test('the three independent premises of t2 allow all six orders, including justification mode', async () => {
  const t = await boot();
  try {
    for (const order of [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]]) {
      for (const mode of ['train', 'justify', 'exam']) {
        start(t, 't2', mode); complete(t, [...order, 3, 4]);
        assert.equal(state(t).solvedNow, true, mode + order);
        assert.equal(state(t).err, 0);
        assert.deepEqual(state(t).order, [...order, 3, 4]);
      }
    }
  } finally { t.close(); }
});

test('a conclusion is unavailable until every required fact is present, without calling a true statement false', async () => {
  const t = await boot();
  try {
    for (const [id, first, tooSoon, missing] of [['t2',0,3,[1,2]], ['t5',1,2,[0]], ['t14',0,2,[1]], ['t1',2,3,[0,1]]]) {
      start(t, id); pick(t, first); const before = state(t).order;
      pick(t, tooSoon); pick(t, tooSoon);
      assert.deepEqual(state(t).order, before, id);
      assert.equal(state(t).err, 0, id);
      assert.equal(state(t).missed, false, id);
      assert.equal(state(t).helpUsed, false, id);
      assert.match(t.d.querySelector('.diag').textContent, /ещё не хватает оснований/);
      for (const i of missing) pick(t, i);
      pick(t, tooSoon);
      assert(state(t).order.includes(tooSoon), id);
    }
  } finally { t.close(); }
});

test('step references and the written proof follow the selected mathematical argument', async () => {
  const t = await boot();
  try {
    start(t, 't2'); pick(t, 2); t.w.OgeCourseProof.decorate();
    const first = t.d.querySelector('.chain .citem');
    assert.match(first.textContent, /вертикальные/);
    assert.match(first.querySelector('.ocp-step-reason').textContent, /вертикальн|смежн/);
    assert.doesNotMatch(first.querySelector('.ocp-step-reason > p').textContent, /середина каждой диагонали/);
    complete(t, [1,0,3,4]);
    const text = t.d.querySelector('.blanktext').textContent;
    assert(text.indexOf('∠BOK = ∠DOM') < text.indexOf('BO = DO'));
    start(t, 't10'); assert.match(t.d.querySelector('.givens').textContent, /K — A — D.*K — B — C/);
  } finally { t.close(); }
});

test('one highlighted step preserves legacy F8 while the new evidence truthfully records help', async () => {
  const t = await boot();
  try {
    start(t, 't2'); run(t, 'useHint()'); complete(t, ORDERS.t2);
    assert.equal(run(t, 'selfSolved(ST)'), true, 'Historical training rule is not rewritten');
    assert.equal(storage(t)[TID].solvedByType.t2, 1);
    assert.equal(lastAttempt(t).outcome, 'helped'); assert.equal(lastAttempt(t).helpUsed, true);
    assert.equal(lastAttempt(t).fresh, true);
    assert.match(t.d.querySelector('.proof-learning-result').textContent, /Собрано с помощью/);
    const before = JSON.stringify(audit(t).attempts);
    run(t, 'onSolved();surrender();pickCard({type:"s",i:4});');
    assert.equal(JSON.stringify(audit(t).attempts), before);
    assert.equal(storage(t)[TID].solvedByType.t2, 1);
  } finally { t.close(); }
});

test('self correction and a familiar repetition stay distinct from a new independent proof', async () => {
  const t = await boot();
  try {
    start(t, 't2', 'justify');pick(t,2);run(t,'pickJust(ST.justPool.findIndex(x=>!x.ok))');complete(t, ORDERS.t2);
    assert.equal(lastAttempt(t).outcome, 'corrected'); assert.equal(lastAttempt(t).errors, 1);
    assert.equal(lastAttempt(t).helpUsed, false);
    run(t, 'trainThis()'); complete(t, ORDERS.t2);
    assert.equal(lastAttempt(t).outcome, 'familiar'); assert.equal(lastAttempt(t).fresh, false);
    start(t, 't14'); complete(t, ORDERS.t14);
    assert.equal(lastAttempt(t).outcome, 'independent');
  } finally { t.close(); }
});

test('a mathematical explanation after a trap remains help after reload and correction', async () => {
  const first=await boot();let saved,id;
  try {
    start(first,'t12');id=state(first).attemptId;run(first,"pickCard({type:'x',i:0})");
    assert.match(first.d.querySelector('.dmsg').textContent,/окружност|диаметр|вписанн/);
    assert.equal(state(first).helpUsed,true);assert.equal(state(first).auditErrors,1);
    saved=storage(first);
  }finally{first.close();}
  const second=await boot({saved});
  try {
    assert.equal(state(second).attemptId,id);assert.equal(state(second).helpUsed,true);
    complete(second,ORDERS.t12);
    assert.equal(lastAttempt(second).outcome,'helped');assert.equal(lastAttempt(second).helpUsed,true);
    assert.equal(lastAttempt(second).errors,1);
    assert.equal(run(second,'selfSolved(ST)'),true,'Legacy F8 still uses its original rule');
  }finally{second.close();}
});

test('help closure and restart never erase assistance or the original attempt identity', async () => {
  const t = await boot();
  try {
    start(t, 't2'); const id = state(t).attemptId;
    t.d.getElementById('courseHintToggle').click(); t.d.getElementById('courseHintToggle').click();
    pick(t, 2); run(t, 'restartTask()');
    assert.equal(state(t).attemptId, id); assert.equal(state(t).helpUsed, true);
    assert.equal(audit(t).byTask.t2.seenCount, 1);
    complete(t, ORDERS.t2); assert.equal(lastAttempt(t).outcome, 'helped');
  } finally { t.close(); }
});

test('leaving for a reference or strategy preserves assistance in the unfinished proof', async () => {
  for (const action of ["switchMode('sheet')", "switchMode('arsenal')", "openSheetZone('angles')"]) {
    const first = await boot(); let saved, originalId;
    try {
      start(first, 't2'); pick(first, 2); originalId = state(first).attemptId;
      run(first, action); saved = storage(first);
      assert.equal(saved[TID].ext.auditLearning.draft.helpUsed, true, action);
      assert.equal(saved[TID].ext.auditLearning.resume.unfinished, true, action);
    } finally { first.close(); }
    const second = await boot({saved, search:'?resume=1'});
    try {
      assert.equal(state(second).attemptId, originalId, action);
      assert.deepEqual(state(second).order, [2], action);
      assert.equal(state(second).helpUsed, true, action);
      complete(second, [1, 0, 3, 4]);
      assert.equal(lastAttempt(second).outcome, 'helped', action);
    } finally { second.close(); }
  }
});

test('reload restores the actual order, pending justification, assistance and the notebook', async () => {
  const first = await boot(); let saved, notes, originalId;
  try {
    start(first, 't2', 'justify'); pick(first, 2); run(first, 'pickJust(ST.justPool.findIndex(x=>x.ok))');
    first.w.OgeCourseProof.decorate(); const area=first.d.querySelector('.ocp-writing textarea');
    area.value='Вертикальные углы равны. Затем сравню стороны.';area.dispatchEvent(new first.w.Event('input', {bubbles:true}));
    run(first, 'useHint()');pick(first, 0); originalId=state(first).attemptId;
    saved=storage(first);notes=first.w.localStorage.getItem('oge-course-proof-drafts-v1');
    assert.equal(saved[TID].ext.auditLearning.draft.awaitJust, 0);
  } finally { first.close(); }
  const second = await boot({saved,notes});
  try {
    assert.deepEqual(state(second).order, [2]);assert.equal(state(second).awaitJust, 0);
    assert.equal(state(second).attemptId, originalId);assert.equal(state(second).helpUsed, true);
    assert.equal(state(second).resumed, true);
    assert.equal(second.d.querySelector('.ocp-writing textarea').value,'Вертикальные углы равны. Затем сравню стороны.');
    run(second, 'pickJust(ST.justPool.findIndex(x=>x.ok))'); complete(second,[1,3,4]);
    assert.equal(lastAttempt(second).outcome,'helped');
    // The existing independent note store is preserved by the page, not copied into evidence.
    assert.equal(typeof notes,'string');assert.match(notes,/Вертикальные углы равны/);
  } finally { second.close(); }
});


test('pagehide and reload preserve exact progress bytes for saved proof states', async () => {
  for(const kind of ['initial','unfinished','justification','completed']){
    const t=await boot();let restored;
    try{
      if(kind==='unfinished'){start(t,'t2');pick(t,2);run(t,'useHint()');}
      if(kind==='justification'){start(t,'t2','justify');pick(t,2);assert.equal(state(t).awaitJust,2);}
      if(kind==='completed'){start(t,'t5');complete(t,ORDERS.t5);}
      const raw=t.w.localStorage.getItem(KEY),revision=state(t).revision,order=state(t).order;
      t.w.dispatchEvent(new t.w.Event('pagehide'));
      assert.equal(t.w.localStorage.getItem(KEY),raw,kind+': pagehide does not rewrite an already saved draft');
      assert.equal(state(t).revision,revision,kind+': pagehide creates no revision');
      restored=await boot({raw});
      assert.equal(restored.w.localStorage.getItem(KEY),raw,kind+': reload is read-only');
      assert.deepEqual(state(restored).order,order);
      assert.equal(state(restored).revision,revision);
      restored.w.dispatchEvent(new restored.w.Event('pagehide'));
      assert.equal(restored.w.localStorage.getItem(KEY),raw,kind+': leaving the restored page is also read-only');
      assert.deepEqual([...t.errors,...restored.errors],[]);
    }finally{t.close();restored?.close();}
  }
});

test('pagehide still saves a dirty current draft once without awarding a result or clearing help', async () => {
  const t=await boot();let restored;
  try{
    start(t,'t2');pick(t,2);run(t,'useHint()');
    const before=audit(t),coreBefore=storage(t),revision=state(t).revision;
    assert.equal(before.draft.helpOpen,false);
    // A final save must retain changed UI state even if no input handler ran.
    t.d.querySelector('#courseHintPanel').hidden=false;
    t.w.dispatchEvent(new t.w.Event('pagehide'));
    const after=audit(t),coreAfter=storage(t),raw=t.w.localStorage.getItem(KEY);
    assert.equal(after.draft.revision,revision+1);
    assert.equal(after.draft.attemptId,before.draft.attemptId);
    assert.equal(after.draft.helpOpen,true);assert.equal(after.draft.helpUsed,true);
    assert.deepEqual(after.draft.order,[2]);assert.deepEqual(after.attempts,before.attempts);
    assert.deepEqual(after.resume,before.resume,'saving UI state does not invent a new learning action');
    delete coreBefore[TID].ext.auditLearning;delete coreAfter[TID].ext.auditLearning;
    assert.deepEqual(coreAfter,coreBefore,'a final save changes no historical credit');
    t.w.dispatchEvent(new t.w.Event('pagehide'));
    assert.equal(t.w.localStorage.getItem(KEY),raw,'the dirty draft is saved exactly once');
    restored=await boot({raw});
    assert.equal(restored.d.querySelector('#courseHintPanel').hidden,false);
    assert.equal(restored.w.localStorage.getItem(KEY),raw);
    assert.deepEqual([...t.errors,...restored.errors],[]);
  }finally{t.close();restored?.close();}
});

test('pagehide never replaces a newer revision from another tab, even with unsaved local UI state', async () => {
  const old=await boot();let newer;
  try{
    start(old,'t2');pick(old,2);
    newer=await boot({raw:old.w.localStorage.getItem(KEY)});
    run(newer,'useHint()');pick(newer,1);
    const latest=newer.w.localStorage.getItem(KEY),revision=state(old).revision;
    old.w.localStorage.setItem(KEY,latest);
    old.d.querySelector('#courseHintPanel').hidden=false;
    old.w.dispatchEvent(new old.w.Event('pagehide'));
    assert.equal(old.w.localStorage.getItem(KEY),latest,'a stale final save cannot replace newer help or order');
    assert.equal(state(old).revision,revision,'a rejected stale save cannot advance the local revision');
    assert.equal(audit(old).draft.helpUsed,true);assert.deepEqual(audit(old).draft.order,[2,1]);
    assert.deepEqual([...old.errors,...newer.errors],[]);
  }finally{old.close();newer?.close();}
});

test('a newer draft from another tab is preserved when an older task changes', async () => {
  const old = await boot(); let newer;
  try {
    start(old,'t2');pick(old,2);const oldId=state(old).attemptId;
    newer=await boot({saved:storage(old)});start(newer,'t14');pick(newer,1);
    const newest=storage(newer);old.w.localStorage.setItem(KEY,JSON.stringify(newest));
    pick(old,1);run(old,'useHint()');
    assert.notEqual(state(newer).attemptId,oldId);
    assert.equal(audit(old).draft.attemptId,state(newer).attemptId);
    assert.deepEqual(audit(old).draft.order,[1]);
  } finally { old.close(); newer?.close(); }
});

test('two tabs of one attempt cannot erase newer help or award the completed proof twice', async () => {
  const old=await boot();let newer;
  try {
    start(old,'t2');pick(old,2);const id=state(old).attemptId;
    newer=await boot({saved:storage(old)});
    assert.equal(newer.w.localStorage.getItem(KEY),old.w.localStorage.getItem(KEY),'Reload restores without writing a revision or legacy progress');
    run(newer,'useHint()');pick(newer,1);
    const latest=storage(newer);old.w.localStorage.setItem(KEY,JSON.stringify(latest));
    pick(old,0);
    assert.equal(old.w.localStorage.getItem(KEY),JSON.stringify(latest),'Adopting another tab\'s state emits no echo write');
    assert.equal(state(old).attemptId,id);
    assert.deepEqual(state(old).order,[2,1],'A stale action restores the newer work before it can be applied');
    assert.equal(state(old).helpUsed,true);
    assert.match(old.d.querySelector('.proof-resume-note').textContent,/другой вкладке/);
    complete(old,[0,3,4]);
    assert.equal(lastAttempt(old).outcome,'helped');assert.equal(audit(old).attempts.length,1);
    assert.equal(storage(old)[TID].solvedByType.t2,1);
    newer.w.localStorage.setItem(KEY,JSON.stringify(storage(old)));
    pick(newer,0);run(newer,'onSolved()');
    assert.equal(state(newer).solvedNow,true);
    assert.equal(audit(newer).attempts.length,1);
    assert.equal(storage(newer)[TID].solvedByType.t2,1,'Restoring a completed proof grants no repeated legacy credit');
  }finally{old.close();newer?.close();}
});

test('resume describes actual work, not a page visit, and closes only when the proof is complete', async () => {
  const t=await boot();
  try{
    assert.deepEqual(audit(t).resume,{at:0,hasWork:false,unfinished:false,helpUsed:false,skill:'theme-1'});
    start(t,'t2');assert.deepEqual(audit(t).resume,{at:0,hasWork:false,unfinished:false,helpUsed:false,skill:'theme-2'});
    pick(t,2);const first=audit(t).resume;assert(first.at>0);assert.equal(first.hasWork,true);assert.equal(first.unfinished,true);
    run(t,'renderTask()');assert.equal(audit(t).resume.at,first.at,'A redraw is not a new learning action');
    run(t,'restartTask()');assert.equal(audit(t).resume.hasWork,true);assert.equal(audit(t).resume.unfinished,true);
    complete(t,ORDERS.t2);assert.equal(audit(t).resume.unfinished,false);assert.equal(audit(t).resume.hasWork,true);
    start(t,'t14');t.w.OgeCourseProof.decorate();const note=t.d.querySelector('.ocp-writing textarea');
    note.value='Сначала сравню радиусы.';note.dispatchEvent(new t.w.Event('input',{bubbles:true}));
    assert.equal(audit(t).resume.unfinished,true);assert.equal(audit(t).draft.noteEdited,true);assert(audit(t).resume.at>0);
    assert.equal(audit(t).resume.helpUsed,false);assert.equal(audit(t).resume.skill,'theme-4');
    run(t,'useHint()');assert.equal(audit(t).resume.helpUsed,true);assert.equal(audit(t).resume.unfinished,true);
  }finally{t.close();}
});

test('after help a genuinely different unseen proof is offered, and exhaustion is labelled as repetition', async () => {
  const t=await boot();
  try {
    start(t,'t2');run(t,'surrender()');const next=run(t,'proofNextChoice()');
    assert.notEqual(next.id,'t2');assert.equal(next.fresh,true);assert(['t3','t4','t5'].includes(next.id));
    run(t,'nextProofPractice()');assert.equal(run(t,'curTask().id'),next.id);assert.equal(state(t).fresh,true);
    for(const id of Object.keys(ORDERS)){start(t,id);run(t,'surrender()');}
    assert.equal(run(t,'proofNextChoice().fresh'),false);
    assert.match(t.d.querySelector('.proof-learning-result').textContent,/Все 20 условий уже встречались/);
  }finally{t.close();}
});

test('malformed or unproved saved orders cannot become accepted steps or injected markup', async () => {
  const t=await boot();let good;
  try{start(t,'t2');pick(t,2);good=storage(t);}finally{t.close();}
  for(const mutation of [d=>{d.order=[3];},d=>{d.order=[2,2];},d=>{d.queue=['__proto__'];},d=>{d.justOrder=['<img>'];},d=>{d.helpUsed=false;d.glows=1;}]){
    const saved=json(good);mutation(saved[TID].ext.auditLearning.draft);const u=await boot({saved});
    try{assert.equal(state(u).resumed,false);assert.equal(state(u).placed,0);assert.deepEqual(u.errors,[]);}finally{u.close();}
  }
});

test('unrelated storage and legacy fields survive; unavailable storage leaves practice usable', async () => {
  const seed={otherTrainer:{custom:['preserve']},mistakes:{'other|type':{w:2,r:0}},[TID]:{v:1,updatedAt:1,solvedByType:{t20:6},ext:{foreign:{keep:true}}}};
  const t=await boot({saved:seed});
  try{start(t,'t2');complete(t,ORDERS.t2);const after=storage(t);assert.deepEqual(after.otherTrainer,seed.otherTrainer);assert.deepEqual(after.mistakes,seed.mistakes);assert.equal(after[TID].solvedByType.t20,6);assert.deepEqual(after[TID].ext.foreign,{keep:true});}finally{t.close();}
  const u=await boot({blocked:true});try{start(u,'t2');complete(u,ORDERS.t2);assert.equal(state(u).solvedNow,true);assert.deepEqual(u.errors,[]);}finally{u.close();}
});

test('a future or unreadable evidence extension is preserved while the proof remains usable', async () => {
  for (const ext of [
    {auditLearning:{v:2,attempts:[{future:'keep'}],draft:{payload:'preserve'}},foreign:{keep:true}},
    {auditLearning:'unreadable-but-not-ours-to-erase',foreign:{keep:true}},
    'legacy-extension'
  ]) {
    const raw=JSON.stringify({[TID]:{v:1,ext}}),t=await boot({raw});
    try {
      start(t,'t2');pick(t,2);run(t,'useHint()');complete(t,[1,0,3,4]);
      assert.equal(state(t).solvedNow,true);
      assert.deepEqual(storage(t)[TID].ext,ext);
      assert.equal(t.w.localStorage.getItem(KEY),raw,'The original progress string is preserved');
      assert.equal(state(t).fresh,false);assert.equal(run(t,'proofNextChoice().fresh'),false);
      assert.match(t.d.querySelector('.proof-learning-result').textContent,/Новизна условия не подтверждена/);
      assert.doesNotMatch(t.d.querySelector('.proof-learning-result').textContent,/Все 20 условий уже встречались/);
      assert.deepEqual(t.errors,[]);
    } finally {t.close();}
  }
});

test('malformed root or own records remain byte-for-byte intact during personal practice', async () => {
  for(const raw of ['{broken', '[1,2,3]', JSON.stringify({[TID]:'unreadable-own-record'}),JSON.stringify({[TID]:{ext:{auditLearning:{v:1,attempts:'unknown'}}}})]){
    const t=await boot({raw});
    try {
      start(t,'t2');run(t,"pickCard({type:'x',i:0})");complete(t,ORDERS.t2);
      assert.equal(state(t).solvedNow,true);assert.equal(state(t).fresh,false);
      assert.equal(t.w.localStorage.getItem(KEY),raw);
      assert.deepEqual(t.errors,[]);
    }finally{t.close();}
  }
});

test('exam and managed mode add no personal audit evidence', async () => {
  const t=await boot();
  try{const before=JSON.stringify(audit(t));start(t,'t2','exam');complete(t,ORDERS.t2);assert.equal(JSON.stringify(audit(t)),before);}finally{t.close();}
  const u=await boot({managed:true});try{start(u,'t2');complete(u,ORDERS.t2);assert.equal(audit(u),undefined);}finally{u.close();}
});

test('board action replay reproduces a reordered proof without new state fields or personal writes', async () => {
  const t=await boot({shared:true});
  try{
    const select=t.d.getElementById('oge-part2-type');select.value='t2';select.dispatchEvent(new t.w.Event('change'));
    for(const i of [2,1])t.d.querySelector(`[data-board-action="card:s:${i}"]`).click();
    const snapshot=t.w.getBoardTrainerState();assert.equal(snapshot.schema,1);
    assert.deepEqual(json(run(t,'ST.order')),[2,1]);assert.equal(t.w.localStorage.length,0);
    t.w.applyBoardTrainerState(snapshot);assert.deepEqual(json(run(t,'ST.order')),[2,1]);
    assert.deepEqual(json(t.w.getBoardTrainerState()),json(snapshot));
    for(const i of [0,3,4])t.d.querySelector(`[data-board-action="card:s:${i}"]`).click();
    assert.equal(state(t).solvedNow,true);assert.equal(t.w.localStorage.length,0);
    assert.deepEqual(t.errors,[]);
  }finally{t.close();}
});
