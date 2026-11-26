'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

const directory = path.resolve(__dirname,'../trainers/oge-basics/multiplication-division');
const html = fs.readFileSync(path.join(directory,'arzhenikov-map.html'),'utf8');
const bank = fs.readFileSync(path.join(directory,'arzhenikov-garden-bank.js'),'utf8');
const script = fs.readFileSync(path.join(directory,'arzhenikov-garden.js'),'utf8');
const key = 'mathexam.arzhenikov.garden.v1';
const copy = value => JSON.parse(JSON.stringify(value));
const draft = () => ({values:[],events:[],moves:0,tools:{},correct:false});
const initial = () => ({series:{},book:{},reviewCount:{},seen:{},last:'count',review:null,due:0});
function started(state,id,help = false) {
  state.series[id] = {round:0,step:0,task:draft(),done:false};
  state.series[id].task.events.push({kind:help?'hint':'answer',at:10,...(help?{}:{attempt:1,values:['0'],wrong:[0]})});
  if (help) state.series[id].task.tools.hint = true;
}
function open(state = initial(),hash = 'garden-review') {
  const dom = new JSDOM(html,{url:'https://mathexam.test/arzhenikov-map.html#'+hash,runScripts:'outside-only',pretendToBeVisual:true});
  const {window} = dom;
  window.localStorage.setItem(key,JSON.stringify(state));
  window.eval(bank); window.eval(script);
  const panel = window.document.getElementById('garden-play');
  const saved = () => JSON.parse(window.localStorage.getItem(key));
  const click = name => {
    const button = [...panel.querySelectorAll('button')].find(item => item.textContent === name);
    assert(button,'button is available: '+name); button.click();
  };
  const answer = values => {
    const fields = [...panel.querySelectorAll('form input, form select')];
    assert.equal(fields.length,values.length);
    fields.forEach((field,index) => {
      field.value = String(values[index]);
      field.dispatchEvent(new window.Event('input',{bubbles:true}));
    });
    panel.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  };
  const solveReview = () => {
    const run = saved().review;
    const item = run.queue[run.step];
    const card = window.ArzhenikovGarden.card(item.id,item.round,2,true);
    answer(card.fields.map(field => [].concat(field.answer)[0]));
  };
  return {window,panel,saved,click,answer,solveReview,close:()=>window.close()};
}

test('empty or merely opened plots do not introduce topics under the name of review',()=>{
  const state = initial();
  state.series.count = {round:0,step:0,task:draft(),done:false};
  const page = open(state);
  try {
    assert.equal(page.saved().review.queue.length,0);
    assert.match(page.panel.textContent,/Сначала выбери участок/);
    assert.equal(page.panel.querySelectorAll('form').length,0);
    assert.equal(page.panel.querySelector('a.garden-go').getAttribute('href'),'#garden-count');
    assert.deepEqual(page.saved().book,{});
  } finally { page.close(); }
});

for (const count of [1,2,3]) test(count+' started plots yield exactly '+count+' review tasks, including work with help',()=>{
  const ids = ['count','pack','share'].slice(0,count);
  const state = initial(); ids.forEach(id => started(state,id,true));
  const page = open(state);
  try {
    const run = page.saved().review;
    assert.equal(run.queue.length,count);
    assert.deepEqual(new Set(run.queue.map(item=>item.id)),new Set(ids));
    assert.match(page.panel.querySelector('.garden-stage').textContent,new RegExp('1 из '+count+'$'));
    assert.equal(page.panel.querySelectorAll('.garden-meter i').length,count);
    for(let index=0;index<count;index++) {
      page.solveReview();
      page.click(index===count-1?'Завершить повторение':'Следующая задача');
    }
    assert.equal(page.saved().review.done,true);
    assert.match(page.panel.textContent,new RegExp('Решено задач: '+count+'\\.'));
    assert.equal(Object.keys(page.saved().reviewCount).length,count);
    assert(page.saved().review.queue.every(item=>page.saved().reviewCount[item.id]===1));
  } finally { page.close(); }
});

test('a completed supported mission qualifies even if its old series draft is absent',()=>{
  const state = initial();
  state.book.pack = {missions:1,independent:0,journal:[{fingerprint:'bed.pack.0.2',status:'После разбора',events:[],at:1}]};
  const page = open(state);
  try { assert.deepEqual(page.saved().review.queue,[{id:'pack',round:0}]); }
  finally { page.close(); }
});

test('review gives weaker or less-repeated visited topics priority, never unvisited topics',()=>{
  const state = initial();
  for (const id of ['count','pack','share','zero']) started(state,id,true);
  state.reviewCount.count = 4;
  state.reviewCount.pack = 1;
  state.book.share = {missions:1,independent:1,journal:[{fingerprint:'bed.share.0.2',status:'Самостоятельно',events:[],at:1}]};
  const page = open(state);
  try { assert.deepEqual(page.saved().review.queue.map(item=>item.id),['zero','share','pack']); }
  finally { page.close(); }
});

test('full explanation is available before the first answer and assistance survives reload',()=>{
  const state = initial(); started(state,'pack',true);
  const page = open(state);
  let stored;
  try {
    assert.equal(page.saved().review.task.events.length,0);
    page.click('Посмотреть разбор');
    stored = page.saved();
    assert.equal(stored.review.task.tools.solution,true);
    assert.deepEqual(stored.review.task.events.map(event=>event.kind),['solution']);
  } finally { page.close(); }
  const resumed = open(stored);
  try {
    const button = [...resumed.panel.querySelectorAll('button')].find(item=>item.textContent==='Посмотреть разбор');
    assert.equal(button.getAttribute('aria-expanded'),'true');
    resumed.solveReview();
    const saved = resumed.saved(), entry = saved.book.pack.journal.at(-1);
    assert.equal(saved.book.pack.independent,0);
    assert.equal(entry.status,'После разбора');
    assert.deepEqual(entry.events.map(event=>event.kind),['solution','answer']);
    assert.equal(entry.independent,false);
  } finally { resumed.close(); }
});

test('wrong answers do not create duplicate explanation controls or erase their first attempt',()=>{
  const state = initial(); started(state,'pack');
  const page = open(state);
  try {
    page.answer([0,0]);
    assert.equal([...page.panel.querySelectorAll('button')].filter(item=>item.textContent==='Посмотреть разбор').length,1);
    page.solveReview();
    const entry = page.saved().book.pack.journal.at(-1);
    assert.equal(entry.status,'После исправления');
    assert.equal(entry.independent,false);
    assert.equal(entry.events.filter(event=>event.kind==='answer').length,2);
  } finally { page.close(); }
});

test('a restored legacy queue removes only unvisited future tasks and preserves the active attempt',()=>{
  const state = initial(); started(state,'count');
  state.review = {queue:[{id:'count',round:3},{id:'share',round:0},{id:'pack',round:0}],step:0,task:draft(),done:false,delayed:false};
  state.review.task.values = ['17','23'];
  state.review.task.events = [{kind:'hint',at:20},{kind:'answer',attempt:1,values:['17','23'],wrong:[0],at:21}];
  state.review.task.tools.hint = true;
  const before = copy(state.review.task);
  const page = open(state);
  try {
    assert.deepEqual(page.saved().review.queue,[{id:'count',round:3}]);
    assert.deepEqual(page.saved().review.task,before);
    assert.deepEqual(page.saved().reviewCount,{});
    assert.deepEqual(page.saved().book,{});
    assert.match(page.panel.textContent,/выполненные ответы и черновики сохранены/);
  } finally { page.close(); }
});

test('removing an unvisited current task archives its draft without rewriting completed evidence',()=>{
  const state = initial(); started(state,'count');
  const journal = {fingerprint:'mix.count.0.2',status:'Самостоятельно',independent:true,at:20,
    events:[{kind:'answer',attempt:1,values:['24','30'],wrong:[],at:20}]};
  state.book.count = {missions:0,independent:1,journal:[journal]};
  state.seen['mix.count.0.2'] = true;
  state.reviewCount.count = 1;
  const task = draft(); task.values = ['7','40'];
  task.events = [{kind:'solution',at:21},{kind:'answer',attempt:1,values:['7','40'],wrong:[0,1],at:22}];
  task.tools.solution = true;
  state.review = {queue:[{id:'count',round:0},{id:'share',round:0},{id:'pack',round:0}],step:1,task,done:false,delayed:false};
  const page = open(state);
  let migrated;
  try {
    migrated = page.saved();
    assert.deepEqual(migrated.book,state.book);
    assert.deepEqual(migrated.seen,{...state.seen,'mix.share.0.2':true});
    assert.deepEqual(migrated.reviewCount,state.reviewCount);
    assert.equal(migrated.review.done,true);
    assert.deepEqual(migrated.review.queue,[{id:'count',round:0}]);
    assert.deepEqual(migrated.reviewDrafts[0].task,task);
    assert.deepEqual(migrated.reviewDrafts[0].assignment,{id:'share',round:0});
    assert.match(page.panel.textContent,/Черновик прежнего повторения/);
    page.click('Новая смешанная грядка');
    assert.deepEqual(page.saved().review.queue,[{id:'count',round:1}]);
    assert.deepEqual(page.saved().reviewDrafts,migrated.reviewDrafts);
  } finally { page.close(); }
  const resumed = open(migrated);
  try {
    assert.equal(resumed.saved().reviewDrafts.length,1,'reload does not duplicate or convert the archived attempt');
    assert.deepEqual(resumed.saved().book,state.book);
  } finally { resumed.close(); }
  started(migrated,'share'); migrated.review = null;
  const later = open(migrated);
  try {
    assert.equal(later.saved().review.queue[0].id,'share');
    later.solveReview();
    assert.equal(later.saved().book.share.journal.at(-1).status,'Повтор знакомой задачи');
    assert.equal(later.saved().book.share.independent,0,'an archived earlier attempt cannot become a new independent success');
  } finally { later.close(); }
});

test('already completed legacy answers stay historical and do not qualify unseen plots for future review',()=>{
  const state = initial(); started(state,'count');
  const task = draft(); task.correct = true; task.result = {status:'Самостоятельно',independent:true};
  task.events = [{kind:'answer',attempt:1,values:['4','24'],wrong:[],at:30}];
  state.book.share = {missions:0,independent:1,journal:[{fingerprint:'mix.share.0.2',status:'Самостоятельно',independent:true,events:copy(task.events),at:30}]};
  state.reviewCount.share = 1;
  state.review = {queue:[{id:'count',round:0},{id:'share',round:0},{id:'pack',round:0}],step:1,task,done:false,delayed:false};
  const page = open(state);
  try {
    assert.deepEqual(page.saved().review.queue,[{id:'count',round:0},{id:'share',round:0}]);
    assert.deepEqual(page.saved().review.task,task);
    assert.deepEqual(page.saved().book,state.book);
    page.click('Завершить повторение');
    page.click('Новая смешанная грядка');
    assert.deepEqual(page.saved().review.queue,[{id:'count',round:0}]);
    assert.deepEqual(page.saved().book,state.book);
  } finally { page.close(); }
});
