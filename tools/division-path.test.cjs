'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const base = 'trainers/oge-basics/multiplication-division/';
const G = require('../' + base + 'division-guided-core.js');
const html = fs.readFileSync(path.join(root,base,'division-path.html'),'utf8');
function page(t, saved) {
 const dom = new JSDOM(html,{url:'https://mathexam.space/'+base+'division-path.html',runScripts:'outside-only'});t.after(()=>dom.window.close());
 dom.window.DivisionGuided = G;
 if(saved)dom.window.localStorage.setItem('mathExamBasics.guidedDivision.v1',JSON.stringify(saved));
 dom.window.eval(fs.readFileSync(path.join(root,base,'division-path.js'),'utf8'));
 return dom;
}
test('all eight stages, Claude, multiples and checkpoint lead to existing local pages',t=>{
 const {window:w}=page(t);assert.equal(w.document.querySelectorAll('.path-step').length,8);
 for(const a of w.document.querySelectorAll('a[href]')) {
  const url=new URL(a.href);assert.equal(url.origin,'https://mathexam.space');
  let target=path.join(root,url.pathname);if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
  assert(fs.existsSync(target),url.pathname);
 }
});
test('help/repeats/duplicate tasks are not independent progress; saved next step resumes',t=>{
 const records=[];
 for(let seq=0;seq<3;seq++)records.push({topic:'start',task:G.make('start',seq),errors:0,hints:0,reveals:0,repeated:false});
 records.push({...records[0]},{...records[1],topic:'oneDigit',task:G.make('oneDigit',0),hints:1});
 const task=G.make('twoDigit',0),p=G.plan(task);
 const {window:w}=page(t,{version:1,active:'twoDigit',records,sessions:{twoDigit:{task,done:false,accepted:false,step:1,answers:[p.actions[0].answer]}}});
 assert.match(w.document.querySelector('[data-progress="start"]').textContent,/: 3/);
 assert.match(w.document.querySelector('[data-progress="oneDigit"]').textContent,/Пока нет/);
 assert.equal(w.document.getElementById('continue-division').hash,'#twoDigit');
 assert.match(w.document.getElementById('continue-division').textContent,/Продолжить/);
});
test('malformed records are preserved and never described as mastery',t=>{
 const {window:w}=page(t,{version:1,records:'broken'});
 assert.equal(w.document.getElementById('progress-notice').hidden,false);
 assert.equal(JSON.parse(w.localStorage.getItem('mathExamBasics.guidedDivision.v1')).records,'broken');
 assert.equal(w.document.querySelectorAll('.is-practised').length,0);
});
