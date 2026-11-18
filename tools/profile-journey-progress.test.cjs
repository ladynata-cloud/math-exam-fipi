'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{resolvePublicScript}=require('./public-page-script.cjs');
const root=path.resolve(__dirname,'..'),KEY='mathexam.profileStart2027.v1';
function boot(record){
 const file=path.join(root,'ege-profil/start/index.html'),dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/ege-profil/start/index.html#progress',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 if(record)w.localStorage.setItem(KEY,JSON.stringify(record));
 w.localStorage.setItem('unrelated-progress','keep');
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(resolvePublicScript(root,path.dirname(file),script.getAttribute('src')),'utf8'));
 return dom;
}
function snapshot(){return {version:1,records:{},seen:{},sessions:{}};}
function taskLesson(){const dom=boot();const lessons=JSON.parse(JSON.stringify(dom.window.ProfileLessons.map(l=>({id:l.id,title:l.title,tasks:l.tasks.map(t=>({id:t.id,steps:t.steps}))}))));dom.window.close();return lessons;}

test('compact progress retains every topic exactly once under closed groups, with the download reachable',()=>{
 const dom=boot(),w=dom.window,d=w.document;
 assert.equal(d.querySelectorAll('.journey-progress-metric').length,3);
 assert.equal(d.querySelectorAll('[data-progress-topic]').length,w.ProfileLessons.length);
 assert.equal(new Set([...d.querySelectorAll('[data-progress-topic]')].map(e=>e.dataset.progressTopic)).size,w.ProfileLessons.length);
 assert.equal(d.querySelectorAll('[data-progress-group]').length,15,'12 first-part lines, finance, random variables and foundations');
 assert.equal(d.querySelectorAll('.progress-group[open],.progress-unstarted[open]').length,0);
 assert.equal(d.getElementById('export').closest('details'),null,'download requires no undisclosed click');
 assert.equal(w.localStorage.getItem('unrelated-progress'),'keep');
 assert.equal(w.localStorage.getItem(KEY),null,'viewing the page creates no learner record');
 w.close();
});

test('help and familiar recovery remain visible without falsely increasing new independent mastery',()=>{
 const [supported,independent,recovered]=taskLesson(),seed=snapshot();
 seed.records[supported.id]={guided:[supported.tasks[0].id],independent:[],attempts:1};
 seed.records[independent.id]={guided:[],independent:[independent.tasks.at(-1).id],attempts:1};
 seed.records[recovered.id]={guided:[],independent:[],recovered:recovered.tasks.slice(-2).map(t=>t.id),attempts:2};
 const dom=boot(seed),w=dom.window,d=w.document;
 assert.deepEqual([...d.querySelectorAll('.journey-progress-metric strong')].map(e=>e.textContent),['1','1','0 из '+w.ProfileLessons.length]);
 assert.match(d.querySelector('[data-progress-topic="'+recovered.id+'"]').textContent,/Закреплено на знакомых задачах/);
 assert.match(d.querySelector('[data-progress-topic="'+recovered.id+'"]').textContent,/Новые самостоятельно: 0 из 3/);
 assert.match(d.querySelector('[data-progress-topic="'+supported.id+'"]').textContent,/С опорой: 1 разных задач/);
 assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)),seed,'reading summaries preserves saved evidence');
 w.close();
});

test('progress continuation resumes the saved guided draft and mode rather than a fixed entry lesson',async()=>{
 const lessons=taskLesson(),l=lessons.find(x=>x.id==='vec-length'),seed=snapshot(),task=l.tasks[0];
 seed.sessions[l.id+':guided']={taskId:task.id,step:0,wrong:false,assisted:true,familiar:false,done:false,draft:'12/5',answers:[],started:'2026-11-09T10:00:00.000Z',registered:false};
 seed.seen[task.id]=1;
 const dom=boot(seed),w=dom.window,d=w.document;
 assert.equal(d.getElementById('progress-continue').getAttribute('href'),'#practice/'+l.id+'/guided');
 assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)),seed,'recommendation did not open the condition');
 const navigated=new Promise(resolve=>w.addEventListener('hashchange',resolve,{once:true}));d.getElementById('progress-continue').click();await navigated;
 assert.equal(w.location.hash,'#practice/'+l.id+'/guided');
 assert.equal(d.getElementById('answer').value,'12/5');
 assert.equal(JSON.parse(w.localStorage.getItem(KEY)).sessions[l.id+':guided'].taskId,task.id);
 w.close();
});

test('progress export remains the complete report and includes prior work without changing saved state',async()=>{
 const l=taskLesson()[0],seed=snapshot();seed.records[l.id]={guided:[l.tasks[0].id],independent:[l.tasks.at(-1).id],attempts:2};
 const dom=boot(seed),w=dom.window,d=w.document;let blob;
 w.URL.createObjectURL=value=>{blob=value;return 'blob:test';};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=()=>{};
 const before=w.localStorage.getItem(KEY);d.getElementById('export').click();assert(blob);
 const contents=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(blob);});
 const report=JSON.parse(contents);assert.equal(report.kind,'mathexam-profile-full-report');assert.equal(report.course.storage,'local-browser');
 assert.deepEqual(report.course.records[l.id],seed.records[l.id]);assert.equal(w.localStorage.getItem(KEY),before);
 assert.equal(w.localStorage.getItem('unrelated-progress'),'keep');w.close();
});


test('current routes and colliding legacy bookmarks keep the intended themes without changing learning evidence',()=>{
 const seed=snapshot(),dom=boot(seed),w=dom.window,d=w.document;
 function visit(hash){w.history.replaceState(null,'',hash);w.dispatchEvent(new w.HashChangeEvent('hashchange'));}
 function ids(){return [...d.querySelectorAll('section.panel > .readiness-card a[href^="#practice/"]')].map(link=>link.getAttribute('href').split('/')[1]);}
 try{
  visit('#calm');
  assert.deepEqual([...d.querySelectorAll('[data-calm-exam]')].map(node=>Number(node.dataset.calmExam)),Array.from({length:12},(_,i)=>i+1));
  assert.deepEqual([...d.querySelectorAll('[data-course-extra]')].map(node=>Number(node.dataset.courseExtra)),[13,14,15,16,17,18,19]);
  assert.deepEqual([...d.querySelectorAll('[data-extra-topic]')].map(node=>node.dataset.extraTopic),['random-variables','optimization']);
  visit('#fipi/2027/6');assert.match(d.querySelector('h1').textContent,/Уравнения/);assert(ids().includes('eq-linear'));
  visit('#calm/6');assert.match(d.querySelector('h1').textContent,/Случайные величины/);assert.equal(ids().length,3);assert.match(d.querySelector('.eyebrow').textContent,/Дополнительная тема/);
  visit('#fipi/2027/8');assert.deepEqual(ids(),['calc-tangent','calc-sign','calc-graph','calc-integral']);
  visit('#fipi/2027/12');assert.deepEqual(ids(),['calc-extreme']);
  visit('#calm/9');assert.deepEqual(ids(),['calc-tangent','calc-sign','calc-graph','calc-value','calc-special','calc-extreme','calc-integral']);
  visit('#topic/integral');assert.deepEqual(ids(),['calc-integral']);assert.match(d.querySelector('.eyebrow').textContent,/№8/);
  for(const hash of ['#calm/13','#exam/13','#fipi/2027/16']){
   visit(hash);assert.match(d.querySelector('.eyebrow').textContent,/№16/);assert.match(d.querySelector('.course-coverage').textContent,/подготовительные числовые.*письменное решение.*не проверяются/);
   const topicIds=hash==='#exam/13'?[...d.querySelectorAll('.exam-topic .button')].map(link=>link.getAttribute('href').split('/')[1]):ids();
   assert.equal(topicIds.length,16);assert(topicIds.includes('finance-lesson-13-two-stages'));
  }
  visit('#exam/16');assert.match(d.querySelector('h1').textContent,/Неравенства/);assert.match(d.querySelector('.eyebrow').textContent,/№15/);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)),seed,'navigation must not create a success, draft or attempt');
  assert.equal(w.localStorage.getItem('unrelated-progress'),'keep');
 }finally{w.close();}
});
