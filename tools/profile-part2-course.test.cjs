'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const lessons=['algebra','geometry','models'].flatMap(name=>require('../ege-profil/part-two/content-'+name+'.js'));
const state=require('../ege-profil/part-two/state.js'),check=require('../ege-profil/start/checks.js');
const examMap=require('../ege-profil/exam-map.js');

test('all seven legacy topic groups retain six real method lessons with separate conditions',()=>{
 assert.equal(lessons.length,42);assert.equal(new Set(lessons.map(l=>l.id)).size,42);
 const ids=new Set();
 for(let n=14;n<=20;n++)assert.equal(lessons.filter(l=>l.exam===n).length,6,'section '+n);
 for(const l of lessons){
  assert.ok(l.title&&l.goal&&l.theory.length>=2,l.id);assert.equal(l.tasks.length,l.exam===14?8:6,l.id);
  assert.equal(new Set(l.tasks.map(t=>t.prompt)).size,l.tasks.length,'distinct conditions '+l.id);
  for(const t of l.tasks){
   assert.ok(!ids.has(t.id),t.id);ids.add(t.id);
   assert.ok(t.proof?.prompt&&t.proof.criteria.length>=2&&t.solution.length>=2,t.id);
   if(t.equationAnswer){assert.equal(t.hints.length,2,t.id);assert.equal(t.steps.length+t.final.length,0,t.id);}
   else assert.ok(t.steps.length>=2&&t.final.length,t.id);
  }
 }
 assert.equal(ids.size,264);
});

test('all actual answer aliases can be entered, empty answers cannot pass',()=>{
 for(const l of lessons)for(const t of l.tasks)for(const q of [...t.steps,...t.final]){
  assert.ok(q.answers.length,t.id);
  for(const a of q.answers)assert.ok(state.matches(q.answers,String(a),check),t.id+': '+a);
  assert.equal(state.matches(q.answers,'',check),false,t.id);
  assert.equal(state.matches(q.answers,'   ',check),false,t.id);
 }
});

test('prior START curriculum, foundational bridges and published collections remain available',()=>{
 const original=['geometry','stereo','algebra','probability','equations','functions','applied','finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
 assert.equal(original.length,81);assert.equal(original.reduce((s,l)=>s+l.tasks.length,0),486);
 for(let n=1;n<=13;n++)assert.ok(original.some(l=>l.position===n),'legacy START group '+n);
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

test('entrance exposes nineteen official routes, extra topics and original courses without hidden disclosure',()=>{
 const dom=new JSDOM(fs.readFileSync(path.join(root,'ege-profil/index.html'),'utf8'));const d=dom.window.document;
 for(const entry of [...examMap.entries,...examMap.extras]){
  const href=entry.source+'/index.html'+examMap.hash(entry);
  const link=d.querySelector('#profile-2027 a[href="'+href+'"]');assert.ok(link,href);assert.equal(link.closest('details:not([open])'),null,href);
 }
 assert.ok(d.querySelector('#legacy-course[open]'));assert.ok(d.querySelector('a[href="trigonometry/index.html"]'));assert.ok(d.querySelector('a[href="atanasyan-10-11/index.html"]'));
 assert.ok(d.querySelector('a[href="/"]'));dom.window.close();
});

test('task SVGs are self-contained and accessible, with no executable or external payloads',()=>{
 for(const l of lessons)for(const t of l.tasks)if(t.diagram){const dom=new JSDOM(t.diagram),svg=dom.window.document.querySelector('svg');assert.ok(svg?.getAttribute('viewBox'),t.id);assert.ok(svg.getAttribute('aria-label')||svg.querySelector('title'),t.id);assert.equal(svg.querySelector('script,foreignObject,image'),null,t.id);assert.ok(!/NaN|Infinity|undefined/.test(t.diagram),t.id);dom.window.close();}
});

test('new course is an explicit public sitemap hub',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,'tools/seo-public-pages.json'),'utf8'));
 assert.ok(config.seed_paths.includes('/ege-profil/part-two/'));
});


async function courseDOM(hash = 'map') {
 const folder=path.join(root,'ege-profil/part-two');
 const dom=new JSDOM(fs.readFileSync(path.join(folder,'index.html'),'utf8'),{url:'https://mathexam.space/ege-profil/part-two/#'+hash,runScripts:'outside-only'});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const script of w.document.querySelectorAll('script[src]')){
  const src=script.getAttribute('src').split('?')[0];if(src.startsWith('/assets/'))continue;
  w.eval(fs.readFileSync(path.resolve(folder,src),'utf8'));
 }
 await w.ProfilePartTwoApp.render();
 return dom;
}

test('second-part home links written finance and keeps numerical preparation and extra optimization',async()=>{
 const dom=await courseDOM(),d=dom.window.document;
 for(const number of [13,14,15,17,18,19])assert.ok(d.querySelector('a[href="#fipi/2027/'+number+'"]'),'official '+number);
 const finance=d.querySelector('a[href="/ege-profil/start/#fipi/2027/16"]');assert.ok(finance);
 const written=finance.closest('.card').querySelector('a[href="#fipi/2027/16"]');
 assert.ok(written);
 assert.match(written.closest('.card').textContent,/18 условий с письменным решением/);
 assert.match(written.closest('.card').textContent,/запишите полное обоснование/);
 const domFinance=await courseDOM('fipi/2027/16'), financeDocument=domFinance.window.document;
 assert.equal(financeDocument.querySelectorAll('.grid .card a[href^="#lesson/h12-"]').length,3);
 assert.match(financeDocument.querySelector('#main').textContent,/16 тем и 96 числовых упражнений/);
 domFinance.window.close();
 assert.ok(d.querySelector('a[href="#topic/optimization"]'));
 assert.equal(d.querySelectorAll('.grid .card').length,8);
 assert.match(d.querySelector('#main').textContent,/36 тем и 228 условий/);
 dom.window.close();
});

test('written finance progress leaves the original 42 lessons and their results separate',async()=>{
 const dom=await courseDOM('progress'),w=dom.window,d=w.document;
 try{
  const {store,financeLessons}=w.ProfilePartTwoApp;
  const original=lessons[0].tasks[3],written=financeLessons[0].tasks;
  const save=(task,mode)=>store.attempt(task.id,{kind:'final',answers:task.final.map(field=>field.answers[0]),correct:true,mode,independentEligible:mode==='independent'});
  await save(original,'independent');
  await save(written[3],'independent');
  await save(written[0],'guided');
  await w.ProfilePartTwoApp.render();
  const originalStats=d.querySelector('#main > .stats');
  assert.match(originalStats.textContent,/264 условий/);
  assert.match(originalStats.textContent,/Самостоятельные ответы: 1/);
  assert.match(originalStats.textContent,/С опорой: 0/);
  assert.equal(d.querySelectorAll('.table-wrap tbody tr').length,42);
  const financeProgress=d.querySelector('[aria-labelledby="finance-progress-title"]');
  assert.match(financeProgress.textContent,/18 условий/);
  assert.match(financeProgress.textContent,/Самостоятельные ответы: 1/);
  assert.match(financeProgress.textContent,/С опорой: 1/);
  assert.ok(financeProgress.querySelector('a[href="#fipi/2027/16"]'));
 }finally{w.close();}
});

test('legacy second-part routes retain their topics and show current labels without renumbering lessons',async()=>{
 const cases=[[14,13,'Уравнения'],[15,14,'Стереометрия'],[16,15,'Неравенства'],[17,null,'Моделирование'],[18,17,'Планиметрия'],[19,18,'параметром'],[20,19,'Числа']];
 for(const [legacy,official,title]of cases){
  const dom=await courseDOM('exam/'+legacy),w=dom.window,d=w.document;
  assert.match(d.querySelector('h1').textContent,new RegExp(title));
  const label=d.querySelector('#main > .eyebrow').textContent;
  if(official)assert.match(label,new RegExp('№\\s*'+official+'$'));else assert.match(label,/Дополнительная тема/);
  const actual=[...d.querySelectorAll('.grid .card a[href^="#lesson/"]')].map(a=>a.hash.slice(8));
  assert.deepEqual(actual,lessons.filter(l=>l.exam===legacy).map(l=>l.id));
  const canonical=official?'fipi/2027/'+official:'topic/optimization';
  w.history.replaceState({},'','#'+canonical);await w.ProfilePartTwoApp.render();
  assert.match(d.querySelector('h1').textContent,new RegExp(title));
  assert.deepEqual([...d.querySelectorAll('.grid .card a[href^="#lesson/"]')].map(a=>a.hash.slice(8)),actual);
  dom.window.close();
 }
});
