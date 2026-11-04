'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/lesson-funnel.js'), 'utf8');
function boot(options = {}) {
  const listeners = {}, tags = [], calls = [];
  const cards = [false, true].map(channel => ({classList: {contains: () => channel}}));
  const document = {referrer: 'https://search.example/query?private=secret', visibilityState: 'visible',
    head: {appendChild: tag => tags.push(tag)}, createElement: () => ({}),
    addEventListener: (event, fn) => { listeners[event] = fn; }, querySelectorAll: () => cards};
  let observed;
  const window = {location: new URL(options.url || 'https://mathexam.space/lessons/?token=secret#private'),
    navigator: options.navigator || {}, ym: (...args) => calls.push(args),
    IntersectionObserver: function (fn) { observed = fn; this.observe = () => {}; }};
  window.self = window; window.top = options.frame ? {} : window;
  if (options.queue) delete window.ym;
  const context = vm.createContext({window, document, URL, Set, Date});
  vm.runInContext(source, context);
  function click(href, event = {}) {
    const a = {href, closest: selector => selector === '.me-contacts' ? {} : null};
    listeners[event.type || 'click']?.({type: 'click', target: {closest: () => a}, ...event});
  }
  return {window, document, listeners, tags, calls, cards, click,
    goals: () => calls.filter(c => c[1] === 'reachGoal'),
    observe: entries => observed(entries), rerun: () => vm.runInContext(source, context)};
}
test('public allowlist, iframe and privacy preferences never load tracking', () => {
  for (const options of [{url:'https://example.com/lessons/'}, {url:'https://mathexam.space/learning/'},
    {frame:true}, {navigator:{doNotTrack:'1'}}, {navigator:{globalPrivacyControl:true}}]) {
    const b = boot(options); assert.equal(b.tags.length,0); assert.equal(b.calls.length,0);
  }
});
test('one counter, sanitized explicit hit, no replay or arbitrary links', () => {
  const b=boot(); b.rerun(); assert.equal(b.tags.length,1);
  assert.equal(b.calls.filter(c=>c[1]==='init').length,1);
  const init=b.calls[0][2];
  for (const flag of ['webvisor','clickmap','trackLinks','trackHash','ecommerce']) assert.equal(init[flag],false);
  assert.equal(init.defer,true); assert.equal(init.disableYtm,true);
  assert.equal(b.calls[1][2],'https://mathexam.space/lessons/');
  assert.equal(b.calls[1][3].referer,'https://search.example');
  assert(!JSON.stringify(b.calls).includes('secret'));
  assert.equal(b.goals()[0][2],'lesson_page_view');
});
test('contacts and channels remain distinct, with page and placement', () => {
  const b=boot({url:'https://mathexam.space/topics/procenty/'});
  b.click('https://t.me/ladynata3000'); b.click('https://vk.ru/ladynata3000');
  b.click('https://t.me/mathexamspace');
  b.click('https://max.ru/join/KKMgzGoEUezcYD_sJGMdvP1hcy90-3sTiZvkRk1_I3c');
  assert.deepEqual(b.goals().map(c=>[c[2],c[3].destination]),[
    ['lesson_contact_click','telegram'],['lesson_contact_click','vk'],['channel_click','telegram'],['channel_click','max']]);
  for(const c of b.goals()) {assert.equal(c[3].page,'/topics/procenty/');assert.equal(c[3].placement,'invitation');}
  b.click('https://t.me/other'); b.click('https://t.me/ladynata3000?private=secret');
  assert.equal(b.goals().length,4);
});
test('normal/middle/keyboard clicks count once; canceled/right clicks do not', () => {
  const b=boot({url:'https://mathexam.space/'});
  b.click('https://mathexam.space/lessons/');
  b.click('https://t.me/ladynata3000',{type:'auxclick',button:1});
  b.click('https://t.me/ladynata3000',{type:'auxclick',button:2});
  b.click('https://t.me/ladynata3000',{defaultPrevented:true});
  assert.equal(b.goals().length,2);
  const l=boot();l.click('https://mathexam.space/lessons/');assert.equal(l.goals().length,1);
  l.click('https://mathexam.space/lessons/#contact');assert.equal(l.goals()[1][3].destination,'contact_section');
});
test('visible cards count once per type; hidden tabs and subthreshold cards do not', () => {
  const b=boot({url:'https://mathexam.space/'});
  b.document.visibilityState='hidden';
  b.observe(b.cards.map(target=>({target,isIntersecting:true,intersectionRatio:.5})));
  assert.equal(b.goals().length,0);
  b.document.visibilityState='visible';b.listeners.visibilitychange();b.listeners.visibilitychange();
  assert.deepEqual(b.goals().map(c=>c[2]),['lesson_invitation_view','channel_invitation_view']);
  const c=boot({url:'https://mathexam.space/'});
  c.observe([{target:c.cards[0],isIntersecting:true,intersectionRatio:.1}]);assert.equal(c.goals().length,0);
});
test('blocked counter queues safely; throwing counter never cancels a link', () => {
  const b=boot({queue:true});assert.equal(b.window.ym.a.length,3);
  b.click('https://t.me/ladynata3000');assert.equal(b.window.ym.a.length,4);
  b.window.ym=()=>{throw Error('blocked');};assert.doesNotThrow(()=>b.click('https://vk.ru/ladynata3000'));
});
