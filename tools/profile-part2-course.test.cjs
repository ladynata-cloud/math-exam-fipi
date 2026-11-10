'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const lessons=['algebra','geometry','models'].flatMap(name=>require('../ege-profil/part-two/content-'+name+'.js'));
const state=require('../ege-profil/part-two/state.js'),check=require('../ege-profil/start/checks.js');

test('all seven sections contain six real method lessons with separate conditions',()=>{
 assert.equal(lessons.length,42);assert.equal(new Set(lessons.map(l=>l.id)).size,42);
 const ids=new Set();
 for(let n=14;n<=20;n++)assert.equal(lessons.filter(l=>l.exam===n).length,6,'section '+n);
 for(const l of lessons){
  assert.ok(l.title&&l.goal&&l.theory.length>=2,l.id);assert.equal(l.tasks.length,6,l.id);
  assert.equal(new Set(l.tasks.map(t=>t.prompt)).size,6,'six distinct conditions '+l.id);
  for(const t of l.tasks){assert.ok(!ids.has(t.id),t.id);ids.add(t.id);assert.ok(t.steps.length>=2&&t.final.length&&t.solution.length>=2,t.id);assert.ok(t.proof?.prompt&&t.proof.criteria.length>=2,t.id);}
 }
 assert.equal(ids.size,252);
});

test('all actual answer aliases can be entered, empty answers cannot pass',()=>{
 for(const l of lessons)for(const t of l.tasks)for(const q of [...t.steps,...t.final]){
  assert.ok(q.answers.length,t.id);
  for(const a of q.answers)assert.ok(state.matches(q.answers,String(a),check),t.id+': '+a);
  assert.equal(state.matches(q.answers,'',check),false,t.id);
  assert.equal(state.matches(q.answers,'   ',check),false,t.id);
 }
});

test('prior first-part curriculum, foundational bridges and published collections remain available',()=>{
 const original=['geometry','stereo','algebra','probability','equations','functions','applied','finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
 assert.equal(original.length,81);assert.equal(original.reduce((s,l)=>s+l.tasks.length,0),486);
 for(let n=1;n<=13;n++)assert.ok(original.some(l=>l.position===n),'first part '+n);
 for(const f of ['ege-profil/trigonometry/index.html','ege-profil/circle/index.html','ege-profil/atanasyan-10-11/index.html','ege-profil/trainers/stereo/index.html','ege-profil/trainers/inequalities.html','ege-profil/trainers/parameters-18/index.html','ege-profil/exam/full-exam.html'])assert.ok(fs.existsSync(path.join(root,f)),f);
});

test('all prior-resource links exist and primary lesson links resolve to actual IDs',()=>{
 const original=['geometry','stereo','algebra','probability','equations','functions','applied','finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
 const oldIds=new Set(original.map(l=>l.id));
 for(const l of lessons)for(const link of l.prerequisites){
  const url=new URL(link.href,'https://mathexam.space');assert.equal(url.origin,'https://mathexam.space');
  let file=path.join(root,url.pathname);if(file.endsWith('/'))file+='index.html';assert.ok(fs.existsSync(file),l.id+' -> '+link.href);
  if(url.pathname.startsWith('/ege-profil/start/')&&url.hash.startsWith('#lesson/'))assert.ok(oldIds.has(url.hash.slice(8)),link.href);
 }
});

test('entrance exposes all twenty direct routes and original courses without hidden disclosure',()=>{
 const dom=new JSDOM(fs.readFileSync(path.join(root,'ege-profil/index.html'),'utf8'));const d=dom.window.document;
 for(let n=1;n<=20;n++){
  const href=n<=13?'start/index.html#calm/'+n:'part-two/index.html#exam/'+n;
  const link=d.querySelector('#profile-2027 a[href="'+href+'"]');assert.ok(link,href);assert.equal(link.closest('details:not([open])'),null,href);
 }
 assert.ok(d.querySelector('#legacy-course[open]'));assert.ok(d.querySelector('a[href="trigonometry/index.html"]'));assert.ok(d.querySelector('a[href="atanasyan-10-11/index.html"]'));
 assert.ok(d.querySelector('a[href="/"]'));dom.window.close();
});

test('task SVGs are self-contained and accessible, with no executable or external payloads',()=>{
 for(const l of lessons)for(const t of l.tasks)if(t.diagram){const dom=new JSDOM(t.diagram),svg=dom.window.document.querySelector('svg');assert.ok(svg?.getAttribute('viewBox'),t.id);assert.ok(svg.getAttribute('aria-label')||svg.querySelector('title'),t.id);assert.equal(svg.querySelector('script,foreignObject,image'),null,t.id);assert.ok(!/NaN|Infinity|undefined/.test(t.diagram),t.id);dom.window.close();}
});
