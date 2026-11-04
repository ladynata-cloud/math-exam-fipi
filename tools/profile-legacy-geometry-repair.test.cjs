'use strict';
// Regressions for legacy trainers linked from the profile course. No accounts,
// persisted pupil results, or network requests are used by these pure checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function functionFrom(file, name, context={}) {
  const source = read(file), start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name);
  const end = source.indexOf('\n}', start);
  return vm.runInNewContext('(' + source.slice(start, end + 2) + ')',context);
}
const plan = functionFrom('ege-profil/trainers/planimetry-t1.html', 'parseAnswer');
const stereo = require('../ege-profil/trainers/stereo/js/data.js').parseAns;
const vectors = functionFrom('ege-profil/trainers/vectors-t2.html', 'parseAns');
const probabilitySource = [...read('ege-profil/trainers/probability-t45.html').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes('var PR ='));
const probabilityContext = {module:{exports:{}}};
vm.runInNewContext(probabilitySource, probabilityContext);
const probability = probabilityContext.module.exports;

test('numeric parsers reject an invalid suffix and non-decimal encodings instead of crediting a prefix', () => {
  for (const [name, parse] of Object.entries({plan, stereo, vectors, probability:probability.parse})) {
    for (const raw of ['5abc', '5/2oops', '5; 9', '0x5', '5e0', 'Infinity', '', ' ', '5%', '5,2,1', '5 0']) {
      assert.ok(Number.isNaN(parse(raw)), name + ': ' + JSON.stringify(raw));
    }
    for (const [raw, expected] of [[' 5 ', 5], ['−0,25', -.25], ['+0.5', .5], ['.5', .5], ['0', 0]]) {
      assert.equal(parse(raw), expected, name + ': ' + raw);
    }
  }
});

test('geometry accepts a whole simple fraction and rejects a zero denominator', () => {
  for (const parse of [plan, stereo]) {
    assert.equal(parse('5 / 2'), 2.5);
    assert.equal(parse('−3,5 / 2'), -1.75);
    assert.equal(parse('64/2'), 32, 'the numerator alone is never the result');
    for (const bad of ['5/0', '0/0', '1/2/3', '/5', '5/']) assert.ok(Number.isNaN(parse(bad)), bad);
  }
  assert.equal(stereo('10/2'), 5, 'task 27054 accepts a valid equivalent fraction');
  assert.notEqual(stereo('5/2'), 5, 'task 27054 rejects the old false-positive prefix');
});

test('probability distinguishes a percentage from a probability and enforces requested rounding', () => {
  assert.equal(probability.check('0,6%', {answer:.6}), false);
  assert.match(probability.diagnose('0,6%', {answer:.6}), /процент/);
  const dice = {answer: .083333, round:2, traps:[]}; // two dice, sum 4: 3/36
  for (const raw of ['0,08', '0.0800']) assert.equal(probability.check(raw, dice), true, raw);
  for (const raw of ['0.087', '0.083333', '0.079', '0.09', '8%']) assert.equal(probability.check(raw, dice), false, raw);
  assert.match(probability.diagnose('0.083333', dice), /округлить до сотых/);
  assert.equal(probability.check('0.375', {answer:.375}), true);
  assert.equal(probability.check('0.38', {answer:.375}), false, 'no unsolicited rounding');
});

test('all 13 probability families still accept their displayed finite answer', () => {
  for (const generator of [...probability.G4, ...probability.G5]) {
    for (let i=0; i<40; i++) {
      const task = probability.make(generator), shown = probability.shown(task);
      assert.ok(probability.check(probability.dec(shown), task), task.type + ': ' + shown);
      assert.equal(probability.check(probability.dec(shown) + '%', task), false, task.type + ' percentage');
    }
  }
});

function boot(file, query='', seed=()=>{}) {
  const errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(read('ege-profil/trainers/' + file), {
    runScripts:'dangerously', url:'https://fixture.invalid/ege-profil/trainers/' + file + query,
    pretendToBeVisual:true, virtualConsole:console,
    beforeParse(window) {
      window.requestAnimationFrame = () => 0;
      // jsdom has no canvas renderer. This stub is only for the optional
      // scratchpad; SVG/3D rendering is covered by the companion browser gate.
      window.HTMLCanvasElement.prototype.getContext = () => new Proxy({measureText:text=>({width:String(text).length*7})}, {get:(target,key)=>target[key]||(()=>{})});
      window.HTMLElement.prototype.scrollIntoView = () => {};
      window.localStorage.setItem('audit-preserved-course', JSON.stringify({completed:['synthetic-old-task'], score:7}));
      seed(window);
    }
  });
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return {dom, window:dom.window, document:dom.window.document, errors};
}

test('fast vectors retry the same task without revealing or double-counting the first mistake', () => {
  const {dom,window:w,document:d,errors} = boot('vectors-t2.html');
  try {
    d.getElementById('modeFast').click();
    const answer = w.eval('cur.answer'), condition = d.getElementById('prompt').innerHTML;
    const input=d.getElementById('ans'), check=d.getElementById('checkBtn');
    input.value=answer+'oops'; check.click();
    assert.equal(w.eval('stats.solved'), 0, 'invalid input is not a mathematical attempt');
    for (let i=0;i<2;i++) {
      input.value=String(answer+1); check.click();
      assert.equal(input.disabled, false);
      assert.equal(check.disabled, false);
      assert.equal(d.getElementById('solution').classList.contains('show'), false);
      assert.doesNotMatch(d.getElementById('feedback').textContent, /Правильный ответ|Ответ:/);
      assert.equal(w.eval('stats.solved'), 1, 'first attempt recorded only once');
      assert.equal(d.getElementById('prompt').innerHTML, condition);
    }
    input.value=String(answer); check.click();
    assert.equal(w.eval('answered'), true);
    assert.equal(w.eval('stats.solved'), 1);
    assert.equal(w.eval('stats.right'), 0, 'correction preserves first-attempt accuracy');
    assert.match(d.getElementById('feedback').textContent, /Верно после исправления/);
    assert.equal(d.querySelector('details.box').open, false);
    assert.equal(d.getElementById('solution').classList.contains('show'), false);
    d.getElementById('solBtn').click();
    assert.equal(d.getElementById('solution').classList.contains('show'), true, 'solution remains available on request');
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('guided vectors do not solve a step after repeated mistakes; help remains an explicit choice', () => {
  const {dom,window:w,document:d,errors}=boot('vectors-t2.html');
  try {
    const wrongChoices=[...d.querySelectorAll('#steps .choices [data-ok="0"]')];
    for(const choice of wrongChoices.slice(0,2)) choice.click();
    assert.equal(w.eval('sp.phase'), 'recog');
    assert.equal(d.getElementById('hintBox').classList.contains('show'), false);
    d.querySelector('#steps .choices [data-ok="1"]').click();
    assert.equal(w.eval('sp.phase'), 'steps');
    // First numeric step of the default coordinate family.
    for(let guard=0;w.eval('cur.steps[sp.idx].t')!=='n'&&guard<5;guard++) d.querySelector('#steps .choices [data-ok="1"]').click();
    const step=w.eval('sp.idx'), wanted=w.eval('cur.steps[sp.idx].a');
    for(let i=0;i<2;i++) {
      d.getElementById('stepIn').value=String(wanted+1); d.getElementById('stepCheck').click();
    }
    assert.equal(w.eval('sp.idx'), step);
    assert.equal(d.getElementById('hintBox').classList.contains('show'), false);
    d.getElementById('stepHint').click();
    assert.equal(d.getElementById('hintBox').classList.contains('show'), true);
    d.getElementById('stepReveal').click();
    assert.equal(w.eval('sp.idx'), step+1);
    assert.equal(w.eval('sp.help'), true);
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('planimetry keeps a mistaken step active and opens its answer only on request', () => {
  const {dom,window:w,document:d,errors}=boot('planimetry-t1.html');
  try {
    w.openGuided(0);
    const state=w.__dbg().state, initial=state.pi, wrong=(state.recogCi+1)%state.recogOpts.length;
    w.choicePick(wrong); w.choicePick(wrong);
    assert.equal(state.pi, initial);
    assert.equal(state.reveals, 0);
    d.getElementById('constructLink').click();
    assert.equal(state.pi, initial+1);
    assert.equal(state.reveals, 1);
    while(state.phases[state.pi].s.t!=='num') d.getElementById('constructLink').click();
    const step=state.pi, expected=state.phases[step].s.ans;
    for(let i=0;i<2;i++){
      d.getElementById('ansInput').value=String(expected+10); d.getElementById('checkBtn').click();
    }
    assert.equal(state.pi, step);
    assert.doesNotMatch(d.getElementById('msg').textContent,/Верное значение/);
    d.getElementById('hintBtn').click();
    assert.equal(state.pi, step,'a hint does not complete the step');
    d.getElementById('constructLink').click();
    assert.equal(state.pi, step+1);
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('planimetry requires the exact finite answer rather than a nearby number', () => {
  const {dom,window:w,document:d}=boot('planimetry-t1.html');
  try {
    w.openSolo(0);
    const state=w.__dbg().state, answer=state.t.answer;
    d.getElementById('ansInput').value=String(answer+.005);d.getElementById('checkBtn').click();
    assert.equal(state.done,false);
    d.getElementById('ansInput').value=String(answer)+'abc';d.getElementById('checkBtn').click();
    assert.equal(state.done,false);
    d.getElementById('ansInput').value=String(answer*2)+'/2';d.getElementById('checkBtn').click();
    assert.equal(state.done,true);
  } finally { dom.window.close(); }
});

test('probability route selects the requested task number and keeps prior unrelated results', () => {
  for (const [query,label] of [['?topic=basic','задание 4'],['?topic=compound','задание 5'],['','вперемешку']]) {
    const {dom,document:d,window:w,errors}=boot('probability-t45.html', query);
    try {
      assert.equal(d.querySelector('#modeChips [aria-pressed="true"]').textContent, label);
      if(query) assert.equal(d.getElementById('dTag').textContent, label);
      if(query) assert.equal(d.querySelector('.tab[aria-selected="true"]').dataset.view,'drill');
      assert.equal(w.localStorage.getItem('audit-preserved-course'), JSON.stringify({completed:['synthetic-old-task'], score:7}));
      assert.deepEqual(errors, []);
    } finally { dom.window.close(); }
  }
});

test('probability only opens the explanation ladder when the pupil requests it', () => {
  const {dom,document:d,errors}=boot('probability-t45.html', '?topic=basic');
  try {
    d.getElementById('dAnswer').value='0,6%'; d.getElementById('dCheck').click();
    assert.match(d.getElementById('dFb').textContent, /процент/);
    for(let i=0;i<2;i++) {
      d.getElementById('dAnswer').value='-2'; d.getElementById('dCheck').click();
      assert.equal(d.getElementById('dSolBox').classList.contains('on'), false);
    }
    d.getElementById('dSol').click();
    assert.equal(d.getElementById('dSolBox').classList.contains('on'), true);
    assert.equal(d.querySelectorAll('#dSolBox .lq').length, 1);
    assert.equal(d.querySelectorAll('#dSolBox .la').length, 0, 'the answer is still withheld');
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

const requestCourseHelp=w=>w.document.dispatchEvent(new w.CustomEvent('profile-course-help-requested',{detail:{path:w.location.pathname,lessonId:'bridge-triangle'}}));

test('secondary references and type pickers start closed and do not remount the current exercise',()=>{
  for(const file of ['planimetry-t1.html','vectors-t2.html','pryamougolny-treugolnik-trenazher.html','planimetry-yashchenko-t1.html','vectors-yashchenko-t2.html']){
    const {dom,document:d,window:w}=boot(file,file==='pryamougolny-treugolnik-trenazher.html'?'#t1':'');
    try{
      if(file==='planimetry-t1.html')w.openGuided(1);
      const nodes=[...d.querySelectorAll('canvas,#taskArea,#taskText,#prompt')];
      for(const details of d.querySelectorAll('details.trainer-reference')){
        assert.equal(details.open,false,file+' reference starts closed');
        details.querySelector('summary').click();assert.equal(details.open,true);
        details.querySelector('summary').click();assert.equal(details.open,false);
      }
      assert.ok(nodes.every(node=>node.isConnected),file+' task nodes retained');
      for(const node of d.querySelectorAll('#cv,#taskText,#prompt,#taskArea'))assert.equal(node.closest('details.trainer-reference'),null,file+' task is not reference content');
    }finally{dom.window.close();}
  }
});

test('external course help prevents independent credit in old planimetry and vectors', () => {
  const plan=boot('planimetry-t1.html');
  try {
    const w=plan.window,d=plan.document;w.openSolo(0);
    const state=w.__dbg().state;d.getElementById('ansInput').value=String(state.t.answer);
    requestCourseHelp(w);d.getElementById('checkBtn').click();
    assert.notEqual(state.results[0],'g');assert.equal(state.streak,0);
    w.openExam();requestCourseHelp(w);w.checkAnswer(state.t.answer);
    assert.notEqual(state.results[0],'g');assert.match(d.getElementById('msg').textContent,/с помощью/);
    assert.deepEqual(plan.errors,[]);
  }finally{plan.dom.window.close();}
  const vector=boot('vectors-t2.html');
  try{
    const w=vector.window,d=vector.document;d.getElementById('modeFast').click();
    w.eval('stats.best=5;stats.right=5;stats.streak=5;');
    d.getElementById('ans').value=String(w.eval('cur.answer'));
    requestCourseHelp(w);d.getElementById('checkBtn').click();
    assert.equal(w.eval('stats.right'),5);assert.equal(w.eval('stats.best'),5);assert.equal(w.eval('stats.streak'),0);
    assert.match(d.getElementById('feedback').textContent,/Верно с помощью/);
    assert.deepEqual(vector.errors,[]);
  }finally{vector.dom.window.close();}
});

test('both Yashchenko banks exclude externally assisted practice and exam answers while retaining earned bests', () => {
  for(const file of ['planimetry-yashchenko-t1.html','vectors-yashchenko-t2.html']){
    const {dom,window:w,document:d,errors}=boot(file);
    try{
      w.eval('stats.best=10;stats.passed=true;tstat(state.task.id).best=4;saveStats();');
      const id=w.eval('state.task.id'),input=d.querySelector('#taskArea input.num');
      input.value=String(w.eval('state.task.ans'));
      requestCourseHelp(w);assert.equal(d.querySelector('#taskArea input.num'),input,'help preserves the draft node');
      d.querySelector('[data-action="check"]').click();
      assert.equal(w.eval('tstat('+JSON.stringify(id)+').correct'),0);
      assert.equal(w.eval('tstat('+JSON.stringify(id)+').best'),4);
      assert.equal(w.eval('tstat('+JSON.stringify(id)+').streak'),0);
      w.eval("setMode('exam');startExam();");
      d.querySelector('#taskArea input.num').value=String(w.eval('state.z.tasks[0].ans'));
      requestCourseHelp(w);d.querySelector('[data-action="exam-check"]').click();
      assert.equal(w.eval('state.z.marks[0]'),false);
      assert.equal(w.eval('stats.best'),10);assert.equal(w.eval('stats.passed'),true);
      assert.deepEqual(errors,[]);
    }finally{dom.window.close();}
  }
});

test('right-triangle external help does not extend an independent streak or revoke an earned best', () => {
  const {dom,window:w,document:d,errors}=boot('pryamougolny-treugolnik-trenazher.html','#t1');
  try{
    w.eval("setMode('solo');tstat(state.topic).best=4;tstat(state.topic).correct=4;tstat(state.topic).streak=4;saveStats();");
    requestCourseHelp(w);w.eval('soloSolved();');
    assert.equal(w.eval('tstat(state.topic).correct'),4);
    assert.equal(w.eval('tstat(state.topic).best'),4);
    assert.equal(w.eval('tstat(state.topic).streak'),0);
    assert.match(d.querySelector('#taskArea').textContent,/Верно с помощью/);
    assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
});

test('probability external help excludes practice and exam credit without altering old results', () => {
  const {dom,window:w,document:d,errors}=boot('probability-t45.html','?topic=basic',w=>{
    w.Math.random=()=>0;w.setTimeout=()=>0;
    w.localStorage.setItem('mathExamCourseProgress.v1',JSON.stringify({'probability-t45':{solved4:7,solved5:8,runs:1,best:10,passed:true},foreign:{earned:42}}));
  });
  try{
    const match=d.getElementById('dText').textContent.match(/В урне (\d+).* и (\d+)/);
    assert.ok(match);d.getElementById('dAnswer').value=String(+match[1]/(+match[1]+ +match[2]));
    requestCourseHelp(w);d.getElementById('dCheck').click();
    let all=JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'));
    assert.equal(all['probability-t45'].solved4,7);assert.equal(d.getElementById('stStreak').textContent,'0');
    const originalTask=w.PR.task;w.PR.task=mode=>(w.__examTask=originalTask(mode));
    d.querySelector('.tab[data-view="exam"]').click();d.getElementById('zStart').click();
    d.getElementById('zAnswer').value=String(w.PR.shown(w.__examTask));
    requestCourseHelp(w);d.getElementById('zCheck').click();
    assert.match(d.getElementById('zFb').textContent,/Верно с помощью/);
    assert.equal(d.querySelector('#zDots span').className,'bad');
    all=JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'));
    assert.equal(all['probability-t45'].best,10);assert.equal(all['probability-t45'].passed,true);assert.deepEqual(all.foreign,{earned:42});
    assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
});

test('stereo supported answers keep old success but do not create a new independent success', () => {
  for(const previous of [{foreign:'kept'}, {st:'ok',attempts:4,wrong:1,foreign:'kept'}]){
    let saved=previous;const nodes={answer:{value:'5'},feedback:{style:{}}};
    const check=functionFrom('ege-profil/trainers/stereo/js/trainer.js','check',{
      prob:()=>({id:'27054',ans:'5',topic:'Параллелепипед'}), $:id=>nodes[id],parseAns:stereo,courseHelpUsed:true,
      saveRec:(_id,make)=>{saved=make(saved);},cnt:value=>Number(value)||0,topicOf:task=>task.topic,renderNav(){},paintSelection(){}
    });
    check();
    assert.equal(saved.st,previous.st==='ok'?'ok':'fail');
    assert.equal(saved.assisted,true);assert.equal(saved.foreign,'kept');
    assert.equal(saved.wrong,previous.wrong||0);assert.match(nodes.feedback.textContent,/Верно с помощью/);
  }
});
