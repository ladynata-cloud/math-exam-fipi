'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{JSDOM}=require('jsdom');
const {createHash}=require('node:crypto');
const {restoreRootTeaching}=require('./oge8-root-domains-preservation.cjs');
const {restoreRootAcceptance}=require('./oge8-root-acceptance-preservation.cjs');
const {restoreOge7Input}=require('./oge7-number-input-preservation.cjs');
const {restoreFractionMultiplicationStep}=require('./task6-numerator-instruction.cjs');
const {restoreReviewedDrawing}=require('./oge-video-models-preservation.cjs');
const {tyrePage,restoreTyreHints}=require('./oge-tyre-hints-preservation.cjs');
// Published homework support from PR459 is part of the preserved source; keep
// this immutable default aligned with the workflow's fetched baseline.
const root=path.resolve(__dirname,'..'),routes=require('./oge-learner-routes.json'),base=process.env.OGE_ENTRY_BASE||'955c83154eed49554b648c03b66e1eba16932222';
// Explicit reviewed task sources bind the free-equation and percent-resume
// changes. The apartment exercise has a reviewed new feedback engine. Other pages
// and link metrics retain the published baseline.
const taskSources={"trainers/oge-1-5-trainers/practice-1-5-apartments.html":"18b44244753ac806d449a2040ad4b8c8af9acaf3","trainers/oge-task16-circle.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/oge-task17-quadrilaterals.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/task19-trainer.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/oge13-inequalities-series.html":"7a7169c35c54351ace4f7844b7730899b4a61831","trainers/oge-task18-grid.html":"7a7169c35c54351ace4f7844b7730899b4a61831",'trainers/simple-equations-stepwise.html':'7d4c3d03f833c1ceae43d18f3b62d15a7ec9e74a','trainers/oge-1-5-trainers/percent-table-trainer.html':'e258e438cd30e396c7741741384911f0a424581d'};
// WORK-07 / #765: the algebra factory has a reviewed new lesson and legacy-mode engine.
// Compare its complete inline scripts and teaching controls to the immutable source.
taskSources['trainers/like-terms-factory.html']='72b8c03dcdd824979500c02ed662344394e8ee65';
// The fraction controls were reviewed on this immutable published source. Keep
// the complete inline engine and static controls comparison, including fixes.
taskSources['trainers/oge-basics/fraction-meaning.html']='7a876fa9b80f22df458348d5460fdd940dc8cac3';
// PR #539/#548 behavior plus the reviewed explanation-only accuracy correction.
// Exact source: 679421ce3057ffbcdab89b80fcd591337f67f9e8.
// Evidence: docs/tasks/OGE9_EXPLANATION_ACCURACY_20261116.md and its report.
// Prior bracket source: 88d8eb2cd8fdefa95b0aae7d6954a60c914e118d;
// earlier mathematics review: docs/reports/OGE9_EXPANDED_REVIEW_20261110.md.
// Controls retain the baseline; the complete inline engine remains pinned.
const reviewedSingleScripts={
  // Reviewed interactive ruler and notebook. The historic HTML controls stay pinned;
  // the full arithmetic path, boundary positions and assistance are exercised in the standalone/browser suites.
  'trainers/oge-basics/multiplication-division/long-division-quotient-digit.html':'327e80f5188efa65bea0404e701c56342beae47766dd2f846ce708e2f7653941',
  // The requested first percentage uses the existing table, visual model and grading.
  // The normal random route and the article example are exercised separately.
  'trainers/percent-part-whole-trainer.html':'1b1e2bbd1bc8a3f3ff60a584b183131ea1311ed2285d913f315266183ea0c631',
  'trainers/oge-task9-equations.html':'a8cae46b2d9730ee6de05e14abf3bbd07a842b06c598264b86cfd9351c1d6c02',
  // The labelled bisector, median and equal halves in d26f2e8. Original controls stay pinned.
  'trainers/oge-task25-geometry.html':'fe246b1d188a53ff3e88245a483edc3cb7321bac034fa9068d8dd2d7cad8e133'
};
// Reviewed results-to-practice UI. The model is still compared to its baseline.
const analogue='trainers/oge-2027-analogue-1.html';
const analogueReviewedApp='593d785fa27ad62d4b073066e414e029fbe283437f47b8e64f59cb1e08830b01';
// Exact script bytes for the reviewed foundation audit.
const foundationAuditScripts={
  "trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html": "1fd0ad712d475a8ec0d209df540ccb547ca6d9a4947bc5cf3977598af6a3d69a",
  "trainers/oge-basics/decimal-add-subtract.html": "5b29dec7331f20a06d1b4d2f13e3b1cc1e8037176c61875e63cf22f9d5d35e82",
  "trainers/oge-basics/fraction-common-denominator.html": "35d28ebf601603246777c91af8e46b7c23f54ccba32de45387acc9d57c90da5c",
  "trainers/oge-basics/fraction-meaning.html": "79a9cc5f34d364d97ba341c718dab8aa3ee60e5edc82f86493740fe6173f35a7",
  "trainers/oge-basics/index.html": "bf06d6a1e1b657d1db183168bf9b8f647369b401a84e314e9b89543a7b3826bc",
  "trainers/oge-basics/multiplication-division.html": "13d8c60bdaadb67805ee7bc642af7a733d5c56a6782ea3fc60da0fc35a9ac193",
  "trainers/oge-basics/multiplication-division/column-multiplication-one-digit.html": "f88b8b368ef68bc871c66b33ee387550eecf00148cfa7b76d829e6e9be311d94",
  "trainers/oge-basics/multiplication-division/column-multiplication-two-digit.html": "9b6588088205b6194c9ce80be0919a70e8300ab997d80c34dfc6579952b40da3",
  "trainers/oge-basics/multiplication-division/division-with-remainder.html": "de0d00d21f7d0437a8b6181cf1c766d5d8b4e45b81b6785920a2b719545a633c",
  "trainers/oge-basics/multiplication-division/multiplication-ladder.html": "0241ecb25b52c794f8d1ea82939f753c3cb19abc10607b4c58d4e32be7881e14",
  "trainers/oge-basics/multiplication-division/multiplication-meaning.html": "c446d09f2b9daf65d837c771e26e7f1e2a26c5457993dd28224dafd6ebda4565",
  "trainers/oge-basics/multiplication-division/multiplication-mixed.html": "1857bb69d8c3ec5fde402623725f3bab095da9c35e97442e6e0ed49f4d905efc",
  "trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html": "3f0321aaf0c6416c4907eb8c346d9deabc8beebba87d6d37d7f5d550bdc7fe8e",
  "trainers/oge-basics/multiplication-division/multiplication-tricks.html": "af1044919b0c9d98094aba52bfb6d3366a83388f9358e7c896fa7edd0ba73b84",
  "trainers/oge-basics/multiplication-division/tabular-division.html": "db1c26b98a54a38dcd461feb05b27df508d8d3c90f58d357a4bd028b267e6ca3",
  "trainers/oge-basics/negative-add-subtract.html": "544876c7cd3afe09325897a33a856d8bdcab51c1c8479fee9e9e9db780ac5bc6",
  "trainers/oge-basics/negative-number-line.html": "684aafc6f79aa1d2ecf6e5d523ba440eaef41990723835c49e65c401355598ff",
  "trainers/oge-basics/order-of-operations.html": "31809bfb5ec6f25865cc9b5e6f64adec7a43e6b5f15875da688a62cf91708958",
  "trainers/oge-basics/rounding.html": "b55415ff9db22b14147ed725f9fabca9f7196acb3c5946fb923a45ea04d50c23",
  "trainers/oge-basics/units-area.html": "88468737e4f1ed5c06b8ba9363bdb06eada8f5e3380268b96cdc4b0632f00163",
  "trainers/oge-basics/units-length-time.html": "8cfa0c0556040ac07e629010814d0c5e8fc93558c6277e5cc0bad94017cf2a51"
};
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const parse=(source,p)=>new JSDOM(source,{url:'https://mathexam.space/'+p});
const exportsByPage=new Map(JSON.parse(read('downloads/trainers-manifest.json')).trainers
 .filter(entry=>entry.public&&entry.adaptation).map(entry=>[entry.sourceHtml.slice(1),entry]));
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
 const dom=parse(read(p),p),d=dom.window.document,old=parse(execFileSync('git',['show',base+':'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6}),p),od=old.window.document;
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
  const taskSource=taskSources[p]?parse(execFileSync('git',['show',taskSources[p]+':'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6}),p):null;
  const baseline=taskSource?taskSource.window.document:od;
  const actualScripts=scripts(d).map(script=>restoreReviewedDrawing(p,script));
  if(p===tyrePage){
    assert.equal(actualScripts.length,1,p+' one reviewed inline engine');
    actualScripts[0]=restoreTyreHints(p,actualScripts[0]);
  }
  if(p==='trainers/oge-task6-fractions.html'||p==='trainers/drobi-oge-trainer.html'){
    assert.equal(actualScripts.length,1,p+' one reviewed inline engine');
    actualScripts[0]=restoreFractionMultiplicationStep(actualScripts[0]);
  }
  if(p==='trainers/oge-task7-number-line.html'){
    assert.equal(actualScripts.length,1,p+' one reviewed inline engine');
    actualScripts[0]=restoreOge7Input(actualScripts[0]);
  }
  if(p==='trainers/oge-task8-powers-roots.html'){
    const reference=actualScripts.filter(script=>script.includes('window.sqSearch=function'));
    assert.equal(reference.length,1,p+' reviewed reference script');
    actualScripts[actualScripts.indexOf(reference[0])]=restoreRootAcceptance(reference[0],'reference');
    const matches=actualScripts.filter(script=>script.includes('(при a ≥ 0 и натуральном n). Почему?'));
    assert.equal(matches.length,1,p+' reviewed teaching script');
    const index=actualScripts.indexOf(matches[0]);
    actualScripts[index]=restoreRootTeaching(restoreRootAcceptance(matches[0],'learning'));
  }
  if(Object.hasOwn(reviewedSingleScripts,p)){
    assert.equal(actualScripts.length,1,p+' one reviewed inline engine');
    assert.equal(createHash('sha256').update(actualScripts[0]).digest('hex'),reviewedSingleScripts[p],p+' exact reviewed inline engine');
  }else if(p===analogue){
    assert.equal(actualScripts.length,2,p+' one model and one app');
    assert.equal(actualScripts[0],scripts(baseline)[0],p+' task data and grading preserved');
    assert.equal(createHash('sha256').update(actualScripts[1]).digest('hex'),analogueReviewedApp,p+' exact reviewed practice route');
  }else if(Object.hasOwn(foundationAuditScripts,p)){
    assert.equal(createHash('sha256').update(JSON.stringify(scripts(d))).digest('hex'),foundationAuditScripts[p],p+' exact reviewed foundation scripts');
  }else{
    assert.deepEqual(actualScripts,scripts(baseline),p+' inline engines preserved');
  }
  const entry=exportsByPage.get(p);
  const panel=entry?d.querySelector('body > .download-panel[data-trainer-download="'+entry.slug+'"]'):null;
  if(entry){
    assert(panel,p+' one external download panel');
    assert.deepEqual([...panel.querySelectorAll('a[download]')].map(a=>a.getAttribute('href')),
      [entry.downloadHtml,entry.prompt,entry.package]);
    assert.deepEqual([...panel.querySelectorAll('input,select,textarea,button')].map(e=>[e.tagName,e.className]),
      [['TEXTAREA','download-wish'],['BUTTON','download-copy'],['TEXTAREA','download-prompt-text']]);
  }
  const controls=(doc,externalPanel)=>[...doc.querySelectorAll('input,select,textarea,button')]
    .filter(e=>!externalPanel?.contains(e)).map(e=>[e.tagName,e.id,e.getAttribute('name'),e.getAttribute('type')]);
  const oldControls=controls(baseline);
  if(p===analogue){
    const oldCheck=oldControls.findIndex(([,id])=>id==='check-all');
    assert(oldCheck>=0,p+' original check button');
    const [button]=oldControls.splice(oldCheck,1);
    const pagerEnd=oldControls.findIndex(([,id])=>id==='next-task');
    assert(pagerEnd>=0,p+' original task pager');
    oldControls.splice(pagerEnd+1,0,button);
    assert(d.querySelector('#variant-results #check-all'),p+' check button in results');
  }
  assert.deepEqual(controls(d,panel),oldControls,p+' teaching controls preserved');
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
