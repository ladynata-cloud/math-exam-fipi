'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../school/shared/learning-route-progress.js'),'utf8');
const lessons = [
  {id:'p01',title:'Первая',order:1,tasks:[{id:'a',methodVersion:2},{id:'b',methodVersion:1}]},
  {id:'p02',title:'Вторая',order:2,tasks:[{id:'c',methodVersion:1}]}
];
function environment(initial = {}, failures = {}) {
  const data = new Map(Object.entries(initial)), writes = [], notices = [];
  let rendered;
  const localStorage = {
    getItem(key) { if(failures.read)throw Error('Denied');return data.get(key)||null; },
    setItem(key,value) { if(failures.write)throw Error('Quota');writes.push([key,value]);data.set(key,value); }
  };
  const window = {MathExamLearningRoute:{render(model){rendered=model;return '<route></route>';}}};
  vm.runInNewContext(source,{window,localStorage});
  function create(key = 'course-a', state = {tasks:{},last:null}, credit) {
    return window.MathExamRouteProgress.create({key,lessons,chapters:[{id:1,title:'Глава',lessonIds:['p01','p02']}],
      title:'Курс',scope:'Темы',getState:()=>state,credit,warn:msg=>notices.push(msg),
      validRoute:hash => /^#lesson\/p0[12]\/[01]$|^#practice\/fractions\/[123]$/.test(hash)?hash:null});
  }
  const model = adapter => {adapter.html();return rendered;};
  return {data,writes,notices,create,model};
}
const rows = model => model.chapters[0].lessons;

test('home read and study acknowledgement never rewrite legacy result keys', () => {
  const old = '{"version":1,"tasks":{"a":{"value":"answer"}},"history":{"a":["kept"]}}';
  const env = environment({'course-a':old}), state = {tasks:{a:{value:'draft',note:'notes'}},last:null};
  const before = JSON.stringify(state), app = env.create('course-a',state);
  env.model(app);app.markStudied('p01');env.model(app);
  assert.equal(env.data.get('course-a'),old);
  assert.equal(JSON.stringify(state),before);
  assert.deepEqual(env.writes.map(([key])=>key),['course-a.route.v1']);
});

test('separate course keys cannot leak identical topic IDs', () => {
  const env = environment(), a=env.create('course-a'),b=env.create('course-b');
  a.markStudied('p01');
  assert.equal(rows(env.model(a))[0].studied,true);
  assert.equal(rows(env.model(b))[0].studied,false);
  assert.equal(env.data.has('course-b.route.v1'),false);
});

test('bad metadata is preserved and cannot block task evidence', () => {
  const corrupt = '{broken';
  const env = environment({'course-a.route.v1':corrupt}), app = env.create('course-a',{tasks:{a:{correct:true,independent:true,methodVersion:2}},last:null});
  assert.equal(rows(env.model(app))[0].done,1);
  app.markStudied('p02');
  assert.equal(env.data.get('course-a.route.v1'),corrupt);
  assert.equal(env.writes.length,0);
  assert.ok(env.notices.length);
});

test('denied storage retains an exportable session-only acknowledgement without claiming saved', () => {
  const env = environment({}, {read:true}), app = env.create();
  app.markStudied('p01');
  assert.equal(app.exportMeta().studied.p01,true);
  assert.equal(rows(env.model(app))[0].studied,true);
  assert.doesNotMatch(app.studyButton('p01'),/отметка сохранена/);
  assert.ok(env.notices.length);
  assert.equal(env.writes.length,0);
});

test('a failed write is never displayed as a saved acknowledgement', () => {
  const env = environment({}, {write:true}), app = env.create();
  app.markStudied('p01');
  assert.doesNotMatch(app.studyButton('p01'),/отметка сохранена/);
  assert.equal(env.writes.length,0);
  assert.equal(app.exportMeta().studied.p01,true);
});

test('legacy imports have no required metadata and invalid optional metadata is ignored with notice', () => {
  const env = environment(), app = env.create();
  assert.doesNotThrow(()=>app.importMeta(undefined));
  assert.equal(env.writes.length,0);
  assert.doesNotThrow(()=>app.importMeta({version:99,studied:{p01:true}}));
  assert.equal(app.exportMeta().studied.p01,undefined);
  assert.equal(env.writes.length,0);
  assert.ok(env.notices.length);
});

test('valid imported marks merge monotonically and exclude unknown topics or false values', () => {
  const env = environment(), app = env.create();
  app.markStudied('p01');app.importMeta({version:1,studied:{p01:false,p02:true,other:true}});
  assert.deepEqual(JSON.parse(JSON.stringify(app.exportMeta())),{version:1,studied:{p01:true,p02:true}});
  assert.equal(env.writes.some(([key])=>key==='course-a'),false);
});

test('another tab acknowledgement is retained when this tab next saves', () => {
  const env = environment(), a=env.create(),b=env.create();
  a.markStudied('p01');b.markStudied('p02');
  assert.deepEqual(JSON.parse(env.data.get('course-a.route.v1')).studied,{p02:true,p01:true});
});

test('prior-method credit remains visible as started work but is excluded from current credit', () => {
  const state = {tasks:{a:{correct:true,independent:true,methodVersion:1}},last:{hash:'#lesson/p01/0'}};
  const env = environment(), app=env.create('course-a',state,(task,saved)=>(task.methodVersion||1)===(saved.methodVersion||1));
  const model=env.model(app), first=rows(model)[0];
  assert.equal(first.started,true);assert.equal(first.done,0);assert.equal(first.independent,0);
  assert.equal(model.resume.href,'#lesson/p01/0');
});

test('correct assisted task advances to next unanswered task without independent credit', () => {
  const state={tasks:{a:{correct:true,independent:false,assisted:true,methodVersion:2}},last:{hash:'#lesson/p01/0'}};
  const env=environment(),model=env.model(env.create('course-a',state));
  assert.equal(rows(model)[0].done,1);assert.equal(rows(model)[0].independent,0);
  assert.equal(model.resume.href,'#lesson/p01/1');
});

test('first-step drafts and notebook drafts are recognized as started', () => {
  const env=environment(),model=env.model(env.create('course-a',{tasks:{a:{values:['12'],step:0},c:{note:'мысль'}},last:null}));
  assert.equal(rows(model)[0].started,true);assert.equal(rows(model)[1].started,true);
  assert.equal(model.resume.isNew,false);
});

test('resume keeps exact unsolved task, direct practice, and rejects an invalid last route', () => {
  const env=environment(),state={tasks:{},last:{hash:'#lesson/p01/1'}},app=env.create('course-a',state);
  assert.equal(env.model(app).resume.href,'#lesson/p01/1');
  state.last.hash='#practice/fractions/2';assert.equal(env.model(app).resume.href,state.last.hash);
  assert.equal(env.model(app).resume.lessonId,null);
  state.last.hash='javascript:alert(1)';assert.equal(env.model(app).resume.href,'#lesson/p01/0');
});

test('all completed task banks lead to new practice instead of replaying an unchangeable result', () => {
  const env=environment(),state={tasks:Object.fromEntries(['a','b','c'].map(id=>[id,{correct:true,independent:false}])),last:{hash:'#lesson/p02/0'}};
  const model=env.model(env.create('course-a',state));
  assert.equal(model.resume.href,'#skills');
  assert.match(model.resume.label,/Все учебные задачи пройдены/);
  assert.equal(rows(model).reduce((sum,row)=>sum+row.independent,0),0);
});


test('viewing theory or a hint without answering does not claim problem-solving activity', () => {
  const env=environment(),state={tasks:{a:{assisted:true,hint:true,guided:true,stepHints:{0:true},reveals:{0:true}}},last:null};
  const app=env.create('course-a',state);app.markStudied('p01');
  const model=env.model(app);assert.equal(rows(model)[0].started,false);
  assert.equal(rows(model)[0].studied,true);assert.equal(rows(model)[0].done,0);
});

test('array metadata and unknown topic acknowledgement cannot alter marks', () => {
  const env=environment(),app=env.create(),array=[];array.version=1;array.studied={p01:true};
  assert.equal(app.importMeta(array),false);assert.equal(app.markStudied('unknown'),false);
  assert.equal(env.writes.length,0);assert.equal(app.exportMeta().studied.p01,undefined);
});
