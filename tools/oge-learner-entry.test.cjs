'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{JSDOM}=require('jsdom');
const {createHash}=require('node:crypto');
const {restoreRootTeaching}=require('./oge8-root-domains-preservation.cjs');
const {restoreRootAcceptance}=require('./oge8-root-acceptance-preservation.cjs');
const {receipt:auditSources,verifyAuditedSource}=require('./oge-audit-source-preservation.cjs');
// Published homework support from PR459 is part of the preserved source; keep
// this immutable default aligned with the workflow's fetched baseline.
const root=path.resolve(__dirname,'..'),routes=require('./oge-learner-routes.json'),base=process.env.OGE_ENTRY_BASE||'955c83154eed49554b648c03b66e1eba16932222';
// Explicit reviewed task sources bind the free-equation and percent-resume
// changes. Other pages and link metrics retain the published baseline.
const taskSources={"trainers/oge-task16-circle.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/oge-task17-quadrilaterals.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/task19-trainer.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/oge13-inequalities-series.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/oge-task18-grid.html":"7a7169c35c54351ace4f7844b7730899b4a61831",'trainers/simple-equations-stepwise.html':'7d4c3d03f833c1ceae43d18f3b62d15a7ec9e74a','trainers/oge-1-5-trainers/percent-table-trainer.html':'e258e438cd30e396c7741741384911f0a424581d'};
// PR #539 subject-review baseline plus PR #548's checked bracket-caption change.
// Exact source: 88d8eb2cd8fdefa95b0aae7d6954a60c914e118d.
// Evidence: docs/tasks/TASK9_BRACKET_LABELS_20261111.md;
// earlier mathematics review: docs/reports/OGE9_EXPANDED_REVIEW_20261110.md.
// Controls retain the baseline; the complete inline engine remains pinned.
const task9ReviewedScript='b226c3f4216892b8d8021ebf0029a49ebb1ba6859d1797c91b5a4a293084728f';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const parse=(source,p)=>new JSDOM(source,{url:'https://mathexam.space/'+p});
// This shared engine's default course is EGE; retain full return coverage while
// validating its reviewed parent instead of adding an unrelated OGE bar.
const courseParents={'ege-baza/path/index.html':{href:'/ege-baza/index.html',label:'← Курс ЕГЭ база'}};
assert.deepEqual(routes.courseParents,courseParents,'only the reviewed EGE parent override is allowed');
for(const p of Object.keys(courseParents)){
 assert(routes.pages.includes(p),p+' remains in page coverage');
 assert(!routes.wayfinding.includes(p),p+' uses its existing course header');
}
let links=0,beforeDirect=0,beforeHome=0;
for(const p of routes.pages){
 const current=read(p);
 // Only the three explicitly audited pages may use a new source. The helper
 // seals the entire HTML to its allowed content checkpoint before navigation,
 // controls and inline engines are compared with that same reviewed source.
 if(auditSources.pages[p])verifyAuditedSource(p,current);
 const dom=parse(current,p),d=dom.window.document,old=parse(execFileSync('git',['show',base+':'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6}),p),od=old.window.document;
 const destinations=[...d.querySelectorAll('a[href]')].map(a=>new URL(a.href));
 const parent=courseParents[p],isCourse=u=>parent?u.pathname===parent.href:/\/trainers\/oge-course\/(?:index\.html)?$/.test(u.pathname),isHome=u=>/^\/(?:index\.html)?$/.test(u.pathname);
 const redirect=d.querySelector('meta[http-equiv="refresh"]');
 if(!redirect){assert(destinations.some(isCourse),p+' course return');assert(destinations.some(isHome),p+' home return');}
 beforeDirect+=Number([...od.querySelectorAll('a[href]')].some(a=>isCourse(new URL(a.href))));
 beforeHome+=Number([...od.querySelectorAll('a[href]')].some(a=>isHome(new URL(a.href))));
 for(const u of destinations){if(u.origin!=='https://mathexam.space')continue;let local=decodeURIComponent(u.pathname).slice(1);if(!local||local.endsWith('/'))local+='index.html';assert(fs.existsSync(path.join(root,local)),p+' missing '+u.pathname);links++;}
 if(parent){
  const nav=d.querySelector('header nav[aria-label="Учебная навигация"]');assert(nav,p+' course navigation');
  const back=[...nav.querySelectorAll('a[href]')].filter(a=>isCourse(new URL(a.href)));
  assert.equal(back.length,1,p+' one exact course return');assert.equal(back[0].textContent,parent.label);
  assert.equal(d.querySelectorAll('nav.oge-wayfinding').length,0,p+' no unrelated OGE bar');
  assert(d.querySelector('header a.path-home[href="/"]'),p+' visible home link remains in header');
 }
 if(routes.wayfinding.includes(p)){
  assert.equal(d.querySelectorAll('nav.oge-wayfinding').length,1,p+' one return bar');
  const nav=d.querySelector('nav.oge-wayfinding');assert.equal(nav.querySelector('a').textContent,'← Все темы ОГЭ');assert.equal(nav.querySelectorAll('a').length,2);
  assert([...d.scripts].some(s=>new URL(s.src||'https://mathexam.space/').pathname==='/assets/oge-wayfinding.js'));
  assert(d.querySelector('link[href^="/assets/oge-wayfinding.css"]'));
 }
 if(routes.wayfinding.includes(p)||parent){
  // Adding navigation must not alter the actual exercise, saved-work keys or controls.
  const scripts=doc=>[...doc.scripts].filter(s=>!s.src).map(s=>s.textContent.replace(/\r\n/g,'\n'));
  const reviewedSource=auditSources.pages[p]?.sourceCommit||taskSources[p];
  const taskSource=reviewedSource?parse(execFileSync('git',['show',reviewedSource+':'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6}),p):null;
  const baseline=taskSource?taskSource.window.document:od;
  const actualScripts=scripts(d);
  if(p==='trainers/oge-task8-powers-roots.html'){
    const reference=actualScripts.filter(script=>script.includes('window.sqSearch=function'));
    assert.equal(reference.length,1,p+' reviewed reference script');
    actualScripts[actualScripts.indexOf(reference[0])]=restoreRootAcceptance(reference[0],'reference');
    const matches=actualScripts.filter(script=>script.includes('(при a ≥ 0 и натуральном n). Почему?'));
    assert.equal(matches.length,1,p+' reviewed teaching script');
    const index=actualScripts.indexOf(matches[0]);
    actualScripts[index]=restoreRootTeaching(restoreRootAcceptance(matches[0],'learning'));
  }
  if(p==='trainers/oge-task9-equations.html'){
    assert.equal(actualScripts.length,1,p+' one reviewed inline engine');
    assert.equal(createHash('sha256').update(actualScripts[0]).digest('hex'),task9ReviewedScript,p+' exact reviewed inline engine');
  }else{
    assert.deepEqual(actualScripts,scripts(baseline),p+' inline engines preserved');
  }
  const controls=doc=>[...doc.querySelectorAll('input,select,textarea,button')].map(e=>[e.tagName,e.id,e.getAttribute('name'),e.getAttribute('type')]);
  assert.deepEqual(controls(d),controls(baseline),p+' controls preserved');
  if(taskSource)taskSource.window.close();
 }
 dom.window.close();old.window.close();
}
const course=parse(read('trainers/oge-course/index.html'),'trainers/oge-course/index.html');
assert.equal(course.window.document.querySelectorAll('.learner-start .entry').length,3);
assert.equal(course.window.document.querySelector('#how-to-learn').open,false);
assert.equal(course.window.document.querySelectorAll('#how-to-learn li').length,4);
assert.match(course.window.document.querySelector('.learner-start').textContent,/Диагностика только по №1–5/);
const source=read('assets/oge-wayfinding.js');
for(const [embedded,search,hidden] of [[false,'',false],[false,'?board=1',true],[true,'',true],[false,'?board=0',false]]){
 const nav={hidden:false},self={},window={self,top:embedded?{}:self};
 vm.runInNewContext(source,{document:{querySelector:()=>nav},window,location:{search},URLSearchParams});assert.equal(nav.hidden,hidden);
}
console.log('OGE_LEARNER_ENTRY_STATIC_OK',JSON.stringify({documents:routes.pages.length,bars:routes.wayfinding.length,courseParents:Object.keys(courseParents).length,links,beforeDirectCourse:beforeDirect,beforeHome}));
