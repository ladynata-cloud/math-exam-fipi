'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '../..');
const slug = 'simple-equations-stepwise';
const key = 'mathExamCourseProgress.v1';
const topic = 'simpleEquationsStepwise';
const freeKey = 'mathExam.equationSteps.v1';
const ops = ['opMinus', 'opPlus', 'opDivide', 'opMultiply'];
const legacy = {
  total:42, right:42, streak:42, best:42, date:'07.11',
  history:Array.from({length:12}, (_,i) => ({text:'Прежняя запись '+i})), extra:'keep'
};
const original = { topics:{[topic]:legacy, neighbour:{keep:true}}, 'oge-t9-uravneniya':{passed:true} };
const files = ['trainers/'+slug+'.html', 'downloads/trainers/'+slug+'/'+slug+'.html'];

function boot(t, file, entries = {}, type = 0, shared) {
  const dom = new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),
    {url:'https://mathexam.space/'+file,runScripts:'outside-only'});
  const w = dom.window;
  t.after(() => w.close());
  if (shared) Object.defineProperty(w,'localStorage',{value:shared});
  for (const [k,v] of Object.entries(entries)) w.localStorage.setItem(k,JSON.stringify(v));
  // Choose the operation deterministically and independently parse the rendered equation.
  w.Math.random = () => (type + 0.25) / 4;
  const script = [...w.document.scripts].find(s => !s.src && s.textContent.includes(topic));
  assert(script,'trainer script exists');
  w.eval(script.textContent);
  const id = x => w.document.getElementById(x);
  const click = x => id(x).click();
  const state = () => JSON.parse(w.localStorage.getItem(key));
  const record = () => state()?.topics[topic];
  const evidence = () => record()?.assessmentV1;
  const equation = () => {
    const numbers = id('eq').textContent.match(/-?\d+/g).map(Number);
    const [a,b] = numbers;
    if (id('eq').textContent.includes(' + ')) return [0,b-a];
    if (id('eq').textContent.includes(' − ')) return [1,b+a];
    if (id('eq').textContent.includes(' · ')) return [2,b/a];
    return [3,b*a];
  };
  const submit = (offset = 0, enter = false) => {
    const [op,value] = equation();
    click(ops[op]);
    assert(!id('ans').disabled);
    id('ans').value = String(value+offset);
    if (enter) id('ans').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter'}));
    else click('check');
  };
  return {w,id,click,state,record,evidence,equation,submit};
}

for (const file of files) {
  for (const level of ['easy','med']) {
    for (let type=0; type<4; type++) {
      test(file+' '+level+' '+ops[type]+' tracks help and checks a fresh equation', t => {
        const a = boot(t,file,{[key]:original,[freeKey]:{keep:true}},type);
        if (level==='med') a.click('med');
        const [op,answer] = a.equation();
        assert.equal(op,type);
        assert.deepEqual(a.state(),original);
        assert.equal(a.id('status').textContent,'тема начата');
        assert.equal(a.id('best').textContent,'0');
        a.click('check');
        a.click(ops[op]);
        a.click('check');
        assert.deepEqual(a.state(),original,'unselected and blank checks do not save');
        a.click('hint');
        a.submit(1);
        assert.equal(a.evidence().errors,1);
        assert.equal(a.evidence().independentErrors,0);
        a.click('solution');
        const before = a.state();
        assert.equal(a.evidence().revealed,1);
        assert.equal(a.record().right,42);
        assert(a.id('ans').disabled);
        assert.equal(a.id('ans').value,String(answer));
        a.click('check');
        a.click('solution');
        a.click('hint');
        assert.deepEqual(a.state(),before);
        const b = boot(t,file,{[key]:before,[freeKey]:{keep:true}},type);
        b.click('retest');
        const [newType,newAnswer] = b.equation();
        assert.equal(newType,type);
        assert(b.id(level).classList.contains('active'));
        assert.notEqual(newAnswer,answer);
        assert.equal(b.id('ans').value,'');
        b.submit(0,true);
        assert.equal(b.evidence().rechecks,1);
        assert.equal(b.evidence().independent,1);
        assert.equal(b.evidence().best,1);
        assert(b.id('retest').hidden);
        assert.equal(b.record().history[0].kind,'recheck');
        assert.deepEqual(b.record().history.slice(-12),legacy.history);
        assert.deepEqual(b.state().topics.neighbour,original.topics.neighbour);
        assert.deepEqual(b.state()['oge-t9-uravneniya'],original['oge-t9-uravneniya']);
        assert.deepEqual(JSON.parse(b.w.localStorage.getItem(freeKey)),{keep:true});
      });
    }
  }
}

test('errors, guided success, repeated help, and attainment thresholds stay separate', t => {
  const a = boot(t,files[0],{[key]:original});
  for (let i=0;i<12;i++) {
    a.click('solution');
    a.click('check');
    a.click('next');
  }
  assert.equal(a.evidence().revealed,12);
  assert.equal(a.evidence().independent,0);
  assert.equal(a.record().right,42);
  assert.equal(a.id('status').textContent,'тема начата');
  a.click('opPlus');
  a.click('opDivide');
  a.submit();
  assert.equal(a.evidence().independentErrors,1);
  assert.equal(a.evidence().guided,1);
  assert.equal(a.evidence().streak,0);
  a.click('retest');
  a.click('hint');
  a.submit();
  assert.equal(a.evidence().guided,2);
  assert.equal(a.evidence().rechecks,0);
  assert(!a.id('retest').hidden);
  a.click('retest');
  a.submit();
  assert.equal(a.evidence().rechecks,1);
  assert.equal(a.id('acc').textContent,'50%');
  for (let i=2;i<=39;i++) {
    a.click('next');
    a.submit();
    if (i===19 || i===38) assert.equal(a.id('status').textContent,'почти освоено');
  }
  assert.equal(a.id('status').textContent,'тема освоена');
  assert.equal(a.id('best').textContent,'39');
  assert.deepEqual(a.record().history.slice(-12),legacy.history);
  const final = a.state();
  a.click('check');
  a.click('solution');
  assert.deepEqual(a.state(),final);
  a.click('reset');
  assert.equal(a.record().history.length,0);
  assert.equal(a.evidence().independent,0);
  assert.deepEqual(a.state().topics.neighbour,original.topics.neighbour);
  assert.deepEqual(a.state()['oge-t9-uravneniya'],original['oge-t9-uravneniya']);
});

test('an already open tab cannot credit a ready answer opened in another tab', t => {
  const values = new Map();
  const store = { getItem:k => values.get(k) ?? null, setItem:(k,v) => values.set(k,v) };
  const a = boot(t,files[0],{[key]:original},0,store);
  const b = boot(t,files[0],{},0,store);
  assert.deepEqual(a.equation(),b.equation());
  a.click('solution');
  b.submit();
  assert.equal(b.evidence().revealed,1);
  assert.equal(b.evidence().independent,0);
  assert.equal(b.evidence().guided,1);
  assert.deepEqual(b.state().topics.neighbour,original.topics.neighbour);
});

test('help cannot move a borderline accuracy across the mastery threshold', t => {
  const a = boot(t,files[0]);
  for (let i=0;i<40;i++) {
    if (i) a.click('next');
    a.submit(i<5 ? 1 : 0);
  }
  assert.equal(a.id('total').textContent,'40');
  assert.equal(a.id('acc').textContent,'88%');
  assert.equal(a.id('status').textContent,'почти освоено');
  for (let i=0;i<3;i++) {
    a.click('next');
    a.click('hint');
    a.submit();
  }
  a.click('next');
  a.click('solution');
  a.click('check');
  assert.equal(a.evidence().independent,35);
  assert.equal(a.evidence().guided,3);
  assert.equal(a.evidence().revealed,1);
  assert.equal(a.id('acc').textContent,'88%');
  assert.equal(a.id('status').textContent,'почти освоено');
});

test('MEP1 carries new evidence and legacy topics, with reversible import', async t => {
  const a = boot(t,files[0],{[key]:original});
  a.click('hint');
  a.submit();
  a.click('retest');
  a.submit();
  const result = a.state();
  a.w.eval(fs.readFileSync(path.join(root,'ege-profil/progress-code.js'),'utf8'));
  const code = a.w.PROGRESS_CODE;
  const decoded = await code.decode(await code.encode(code.readLive()));
  const plain = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(decoded),result);
  a.w.localStorage.setItem(key,JSON.stringify(original));
  assert.equal(code.loadInto(decoded),true);
  assert.deepEqual(a.state(),result);
  assert.equal(code.restoreBackup(),true);
  assert.deepEqual(a.state(),original);
});
