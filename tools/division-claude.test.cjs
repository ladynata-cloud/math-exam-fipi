'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../trainers/long-division-claude.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const KEY = 'mathExamDivisionClaude.v1';

function open(t, saved, blocked = false) {
  const dom = new JSDOM(html, {url:'https://mathexam.space/trainers/long-division-claude.html',runScripts:'outside-only'});
  t.after(() => dom.window.close());
  const w = dom.window;
  w.confirm = () => true;
  w.localStorage.setItem('mathExamCourseProgress.v1', '{"keep":"legacy"}');
  if (saved !== undefined) w.localStorage.setItem(KEY, typeof saved === 'string' ? saved : JSON.stringify(saved));
  if (blocked) Object.defineProperty(w, 'localStorage', {get(){throw Error('blocked');}});
  vm.runInContext(script, dom.getInternalVMContext());
  return w;
}
function fixture(dividend='4032', divisor=4, mode='training') {
  return {version:1, stats:{total:0,right:0,supported:0,reviewed:0,streak:0,best:0,history:[]},
    attempt:{problem:{dividend,divisor,quotient:String(Number(dividend)/divisor)},mode,level:'zero',phase:'findFirst',subPhase:'pick',stepIdx:0,trySelLen:0,done:false,attempts:0,assisted:mode!=='training',counted:false}};
}
function one(w) {
  const d = w.document;
  if(w.phase==='findFirst') d.querySelectorAll('#ugolok button')[w.plan.firstLen-1].click();
  else if(w.phase==='countDigits') d.querySelectorAll('#countBtns button')[w.plan.steps.length-1].click();
  else if(w.phase==='divide' && w.subPhase==='pick') d.querySelectorAll('#picker button')[w.plan.steps[w.stepIdx].q].click();
  else if(w.phase==='divide' && w.subPhase==='remcheck') d.querySelector('#remCheckBtns button').click();
  else if(w.phase==='divide' && w.subPhase==='bring') d.querySelector('#bringBtn').click();
  else throw Error('Unexpected state '+w.phase+'/'+w.subPhase);
}
function complete(w) { for(let n=0;n<60 && !w.done;n++) one(w); assert.equal(w.done,true); }
function identity(w){return JSON.stringify([w.problem,w.mode,w.level,w.phase,w.subPhase,w.stepIdx,w.trySelLen,w.done,w.assisted,w.counted]);}

test('2500 generated examples: ordered complexity and independent integer oracle', t => {
  const w=open(t);
  let seed=59403;
  w.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const level of ['first','easy','med','hard','zero']) {
    w.level=level;
    for(let i=0;i<500;i++) {
      const p=w.makeProblem(), plan=w.buildPlan(p), n=BigInt(p.dividend), d=BigInt(p.divisor);
      assert.equal(plan.quotient,String(n/d)); assert.equal(plan.finalRem,Number(n%d));
      if(level==='zero') assert.match(plan.quotient,/^[1-9]0[1-9]{1,2}$/);
      else {assert.equal(plan.quotient.length,{first:1,easy:2,med:3,hard:4}[level]);assert.doesNotMatch(plan.quotient,/0/);}
      let consumed=0, remainder=0n;
      for(const s of plan.steps) {
        while(consumed<s.used) {remainder=remainder*10n+BigInt(p.dividend[consumed]);consumed++;}
        assert.equal(BigInt(s.partial),remainder);
        const digit=remainder/d;
        assert(digit>=0n && digit<=9n);assert.equal(s.q,Number(digit));
        assert.equal(BigInt(s.prod),digit*d);
        remainder%=d;assert.equal(BigInt(s.rem),remainder);assert(remainder<d);
      }
    }
  }
});

test('every phase and zero resumes exactly; one completed example counts once', t => {
  let w=open(t,fixture()), phases=new Set(), zeroSteps=0;
  while(!w.done) {
    phases.add(w.phase+'/'+w.subPhase);
    if(w.phase==='divide' && w.subPhase==='pick' && w.plan.steps[w.stepIdx].q===0) {
      zeroSteps++;assert.equal(w.document.querySelectorAll('.zero-suggest').length,0,'training does not reveal zero');
    }
    const before=identity(w), saved=w.localStorage.getItem(KEY);
    w=open(t,saved);assert.equal(identity(w),before,'reload preserves the exact exercise/phase');
    one(w);
  }
  assert.equal(zeroSteps,2);
  assert.deepEqual([...phases].sort(),['countDigits/pick','divide/bring','divide/pick','divide/remcheck','findFirst/pick']);
  assert.equal(w.stats.total,1);assert.equal(w.stats.right,1);assert.equal(w.stats.supported,0);
  const saved=w.localStorage.getItem(KEY);w=open(t,saved);
  w.finish(true);w.showSolution();w.confirmRem(true);
  assert.equal(w.stats.total,1);assert.equal(w.stats.reviewed,0);
  assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),'{"keep":"legacy"}');
});

test('empty, malformed and out-of-phase actions never advance; wrong attempts remain correctable', t => {
  const w=open(t,fixture('168',7));
  for(const v of ['',null,NaN,-1,0,99]) w.selectFirst(v);
  assert.equal(w.phase,'findFirst');
  w.document.querySelector('#ugolok button').click();
  assert.equal(w.phase,'findFirst');assert.equal(w.trySelLen,1);
  one(w);
  for(const v of ['',null,NaN,-1,0]) w.confirmCount(v);
  assert.equal(w.phase,'countDigits');
  w.confirmCount(1);assert.equal(w.phase,'countDigits');one(w);
  for(const v of ['',null,NaN,-1,10]) w.tryDigit(v);
  assert.equal(w.subPhase,'pick');assert.equal(w.attempts,0);
  w.tryDigit(9);assert.equal(w.subPhase,'pick');
  w.tryDigit(0);assert.equal(w.subPhase,'pick');
  one(w);w.confirmRem('');w.confirmRem(false);assert.equal(w.subPhase,'remcheck');
  complete(w);assert.equal(w.stats.total,1);assert.equal(w.stats.supported,1);assert.equal(w.stats.right,0);
});

test('learning, requested hints, learning-mode detours and full solutions retain their provenance', t => {
  for(const help of ['learning','hint','explanation','mode','solution','detour']) {
    let w=open(t,fixture('84',2,help==='learning'?'learning':'training'));
    if(help==='hint') w.document.querySelector('#hint').click();
    if(help==='explanation') w.document.querySelector('[data-help="pick"]').click();
    if(help==='mode') {w.document.querySelector('[data-mode="learning"]').click();w.document.querySelector('[data-mode="training"]').click();}
    if(help==='solution') {w.document.querySelector('#solution').click();w.document.querySelector('#solution').click();}
    if(help==='detour') {
      const event=new w.CustomEvent('mathexam:skill-support',{cancelable:true,detail:{skill:'subtraction'}});
      w.document.dispatchEvent(event);assert.equal(event.defaultPrevented,false);
    }
    w=open(t,w.localStorage.getItem(KEY));
    if(help==='solution') {assert.equal(w.stats.reviewed,1);assert.equal(w.stats.total,0);assert.equal(w.done,true);}
    else {complete(w);assert.equal(w.stats.supported,1,help);assert.equal(w.stats.right,0,help);}
  }
});

test('damaged/unavailable storage keeps practice working and requests a separate help tab', t => {
  for(const saved of ['{broken', {...fixture(),attempt:{...fixture().attempt,stepIdx:900}}]) {
    const raw=typeof saved==='string'?saved:JSON.stringify(saved),w=open(t,raw);
    assert.equal(w.document.querySelector('#saveWarning').hidden,false);
    complete(w);assert.equal(w.localStorage.getItem(KEY),raw,'do not erase damaged records');
    const event=new w.CustomEvent('mathexam:skill-support',{cancelable:true});
    w.document.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
  }
  const w=open(t,undefined,true);complete(w);assert.equal(w.done,true);
});

test('loaded history is text and navigation points to the live route',t=>{
  const f=fixture();f.stats.history=[{text:'<img src=x onerror=alert(1)>'}];const w=open(t,f);
  assert.equal(w.document.querySelector('#history img'),null);
  assert.match(w.document.querySelector('#history').textContent,/<img/);
  assert(w.document.querySelector('a[href="/trainers/oge-basics/multiplication-division/division-path.html"]'));
  assert(w.document.querySelector('a[href="/"]'));
  assert.equal(w.document.title,'Деление уголком — тренажёр Клода | MathExam');
});

test('invalid saved types and completion combinations never crash or erase the record',t=>{
  const corrupt=[];
  const numeric=fixture('18',3);numeric.attempt.problem.dividend=18;numeric.attempt.problem.quotient=6;corrupt.push(numeric);
  const early=fixture();early.attempt.counted=true;corrupt.push(early);
  const over=fixture();over.attempt.phase='done';over.attempt.done=true;over.attempt.counted=true;over.attempt.stepIdx=0;corrupt.push(over);
  for(const f of corrupt){const raw=JSON.stringify(f),w=open(t,raw);complete(w);assert.equal(w.localStorage.getItem(KEY),raw);}
});

test('a stale tab cannot overwrite newer saved work on navigation',t=>{
  const w=open(t,fixture());one(w);
  const newer=fixture('84',2);newer.stats.total=1;newer.stats.right=1;
  const raw=JSON.stringify(newer);w.localStorage.setItem(KEY,raw);
  w.dispatchEvent(new w.Event('pagehide'));
  assert.equal(w.localStorage.getItem(KEY),raw);
  assert.equal(w.storageBlocked,true);
});

test('a fresh exercise closes old help and resets only the new attempt provenance',t=>{
  const w=open(t,fixture('84',2));
  w.document.querySelector('#ndp').click();w.document.querySelector('[data-help="pick"]').click();
  complete(w);w.document.querySelector('#next').click();
  assert.equal(w.document.querySelector('#helpPanel').classList.contains('open'),false);
  assert.equal(w.document.querySelector('#helpAnswer').textContent,'');
  assert.equal(w.assisted,false);assert.equal(w.stats.supported,1);
});
