'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{JSDOM}=require('jsdom');
const {restoreRootTeaching}=require('./oge8-root-domains-preservation.cjs');
// Published homework support from PR459 is part of the preserved source; keep
// this immutable default aligned with the workflow's fetched baseline.
const root=path.resolve(__dirname,'..'),routes=require('./oge-learner-routes.json'),base=process.env.OGE_ENTRY_BASE||'955c83154eed49554b648c03b66e1eba16932222';
// This task updates the simple-equations engine and adds a recheck control.
// Bind both to the exact task source. Other pages and link metrics still
// compare against the published baseline above.
const taskSources={'trainers/simple-equations-stepwise.html':'7d4c3d03f833c1ceae43d18f3b62d15a7ec9e74a'};
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const parse=(source,p)=>new JSDOM(source,{url:'https://mathexam.space/'+p});
let links=0,beforeDirect=0,beforeHome=0;
for(const p of routes.pages){
 const dom=parse(read(p),p),d=dom.window.document,old=parse(execFileSync('git',['show',base+':'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6}),p),od=old.window.document;
 const destinations=[...d.querySelectorAll('a[href]')].map(a=>new URL(a.href));
 const isCourse=u=>/\/trainers\/oge-course\/(?:index\.html)?$/.test(u.pathname),isHome=u=>/^\/(?:index\.html)?$/.test(u.pathname);
 const redirect=d.querySelector('meta[http-equiv="refresh"]');
 if(!redirect){assert(destinations.some(isCourse),p+' course return');assert(destinations.some(isHome),p+' home return');}
 beforeDirect+=Number([...od.querySelectorAll('a[href]')].some(a=>isCourse(new URL(a.href))));
 beforeHome+=Number([...od.querySelectorAll('a[href]')].some(a=>isHome(new URL(a.href))));
 for(const u of destinations){if(u.origin!=='https://mathexam.space')continue;let local=decodeURIComponent(u.pathname).slice(1);if(!local||local.endsWith('/'))local+='index.html';assert(fs.existsSync(path.join(root,local)),p+' missing '+u.pathname);links++;}
 if(routes.wayfinding.includes(p)){
  assert.equal(d.querySelectorAll('nav.oge-wayfinding').length,1,p+' one return bar');
  const nav=d.querySelector('nav.oge-wayfinding');assert.equal(nav.querySelector('a').textContent,'← Все темы ОГЭ');assert.equal(nav.querySelectorAll('a').length,2);
  assert([...d.scripts].some(s=>new URL(s.src||'https://mathexam.space/').pathname==='/assets/oge-wayfinding.js'));
  assert(d.querySelector('link[href^="/assets/oge-wayfinding.css"]'));
  // Adding navigation must not alter the actual exercise, saved-work keys or controls.
  const scripts=doc=>[...doc.scripts].filter(s=>!s.src).map(s=>s.textContent.replace(/\r\n/g,'\n'));
  const taskSource=taskSources[p]?parse(execFileSync('git',['show',taskSources[p]+':'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6}),p):null;
  const baseline=taskSource?taskSource.window.document:od;
  const actualScripts=scripts(d);
  if(p==='trainers/oge-task8-powers-roots.html'){
    const matches=actualScripts.filter(script=>script.includes('(при a ≥ 0 и натуральном n). Почему?'));
    assert.equal(matches.length,1,p+' reviewed teaching script');
    const index=actualScripts.indexOf(matches[0]);
    actualScripts[index]=restoreRootTeaching(matches[0]);
  }
  assert.deepEqual(actualScripts,scripts(baseline),p+' inline engines preserved');
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
console.log('OGE_LEARNER_ENTRY_STATIC_OK',JSON.stringify({documents:routes.pages.length,bars:routes.wayfinding.length,links,beforeDirectCourse:beforeDirect,beforeHome}));
