// Content contracts and answer-representation regressions. This does not
// replace visual comparison with the textbook or independent arithmetic review.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../courses/vilenkin-6-part-1');
require(path.join(root, 'textbook-math.js'));
const M = global.TextbookMath;
const index = JSON.parse(fs.readFileSync(path.join(root, 'data/textbook-index.json')));
const source = new Map([...index.exercises, ...index.checks].map(x => [x.number, x]));
const units = ['A','B','C','D'].flatMap(x => JSON.parse(fs.readFileSync(path.join(root, `textbook-data/units-${x}.json`))));
const reviewed = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/reports/VILENKIN6_TEXTBOOK_SOURCE_REVIEW.json')));
for(const block of ['A','B','C','D']){
  const name=`units-${block}.json`,digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'textbook-data',name))).digest('hex');
  assert.equal(digest,reviewed.dataHashes[name],name+': source review must match current content');
}
assert.deepEqual(units.map(u => u.id), Array.from({length:24},(_,i)=>i));
const ids = new Set(), selected = new Set();
let tasks = 0, steps = 0, manual = 0, pictures = 0;
function text(s, where) { assert.equal(typeof s, 'string', where); assert(s.trim(), where); assert(!/<\/?[a-z][^>]*>/i.test(s), where + ': content must not contain HTML'); }
function answer(t, where) {
  assert(Object.hasOwn(M.formats, t.answerType), where + ': unknown answer type');
  if (t.answerType === 'self-check') {
    assert.equal(t.answer, '', where);
    assert(Array.isArray(t.selfCheck) && t.selfCheck.length >= 2, where + ': concrete manual criteria required');
    t.selfCheck.forEach(x => text(x, where));
  } else {
    const answers = Array.isArray(t.answer) ? t.answer : [t.answer];
    assert(answers.length, where);
    for (const a of answers) { text(a, where); assert(M.check(a, t.answer, t.answerType).ok, where + ': invalid canonical answer ' + a); }
    assert(!M.check('',t.answer,t.answerType).ok, where + ': empty answer accepted');
    if (t.options) { assert(t.options.length >= 2, where); assert(t.options.some(x => M.check(x,t.answer,t.answerType).ok),where + ': correct option absent'); }
  }
}
for (const u of units) {
  text(u.title,'unit title'); text(u.goal,u.title); assert(u.rules.length >= 1,u.title);
  u.rules.forEach(r=>{text(r.title,u.title);text(r.text,u.title)});
  assert(u.prereq.every(n=>Number.isInteger(n) && n>=0 && n<u.id),u.title + ': invalid prerequisite');
  assert(u.tasks.length >= 8,u.title + ': incomplete selection');
  for (const role of ['learn','practice','check']) assert(u.tasks.filter(t=>t.role===role).length >= 2,u.title + ': missing ' + role);
  for (const t of u.tasks) {
    tasks++; assert(!ids.has(t.id),t.id); ids.add(t.id);
    assert(['learn','practice','check'].includes(t.role),t.id); text(t.prompt,t.id); text(t.hint,t.id);
    const s = t.source; assert(s && Number.isInteger(s.page) && s.page>=4 && s.page<=156,t.id + ': source page');
    assert.equal(typeof s.part,'string',t.id + ': source part');
    if(!s.number)text(s.part,t.id + ': unnumbered source label');
    assert(['exercise','example','question','check'].includes(s.kind),t.id + ': source kind');
    if (s.number && /^[123]\.\d+$/.test(s.number)) {
      assert(source.has(s.number),t.id + ': unknown book number');
      assert.equal(source.get(s.number).printedPage,s.page,t.id + ': page differs from index; verify source');
    } else if (!s.number) assert(['example','question','check'].includes(s.kind),t.id + ': numbered exercise lacks number');
    const ref = [s.number || s.kind,s.part,s.page].join('|');
    assert(!selected.has(ref),t.id + ': same source subpart used twice'); selected.add(ref);
    answer(t,t.id); if(t.answerType==='self-check') manual++;
    assert(t.steps.length >= 2 && t.steps.length <= 9,t.id + ': step count');
    for (const st of t.steps) { steps++;text(st.prompt,t.id);text(st.hint,t.id);text(st.explain,t.id);answer(st,t.id + ' / ' + st.prompt); }
    assert(t.solution.length >= 2,t.id + ': missing solution'); t.solution.forEach(s=>text(s,t.id));
    if (t.visual) {
      if(t.visual.type==='image') { pictures++; const p=t.visual.src; assert(/^textbook-data\/figures\/[\w-]+\.png$/.test(p),t.id); assert(fs.statSync(path.join(root,p)).size>200,t.id); text(t.visual.alt,t.id); }
      else { assert.equal(t.visual.type,'table',t.id);assert(t.visual.headers.length>=2,t.id);assert(t.visual.rows.every(r=>r.length===t.visual.headers.length),t.id); }
    }
  }
}
const yes=(v,t,type)=>assert(M.check(v,t,type).ok,[v,t,type].join(' / '));
const no=(v,t,type)=>assert(!M.check(v,t,type).ok,[v,t,type].join(' / '));
yes('0,375','3/8','number'); no('0,375','3/8','fraction');
yes('0,375','0.375','decimal'); no('3/8','0.375','decimal');
yes('3/4','3/4','reduced-fraction'); no('18/24','3/4','reduced-fraction');
yes('3/2','3/2','improper-fraction'); no('1 1/2','3/2','improper-fraction');
yes('3 1/2','3 1/2','mixed'); no('7/2','3 1/2','mixed');
yes('3 1/2','3 1/2','reduced-mixed'); no('3 2/4','3 1/2','reduced-mixed');
yes('4/12;9/12','4/12;9/12','fixed-denominator-pair');
no('1/3;3/4','4/12;9/12','fixed-denominator-pair');
no('8/24;18/24','4/12;9/12','fixed-denominator-pair');
yes('3 · 2^2 · 5','60','prime-factors'); no('4*15','60','prime-factors');
yes('3;1;2','1;2;3','number-list'); no('1;2;2','1;2;3','number-list');
no('2;1','1;2','ordered-pair'); no('1/0','1','number');
no('<img src=x onerror=alert(1)>','1','number');
no('2^999999999','4','prime-factors'); no('9'.repeat(300),'1','number');
assert(!M.fmt('<script>alert(1)</script>').includes('<script>'));
console.log(JSON.stringify({status:'PASS',units:units.length,tasks,steps,manual,pictureUses:pictures,source:'number/page index and unique selected subparts checked; visual/arithmetic review separate'}));
