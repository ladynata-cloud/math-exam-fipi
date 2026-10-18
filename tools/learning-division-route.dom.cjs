'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const {JSDOM}=require('jsdom');
const repo=path.resolve(__dirname,'..');
const C=require('../trainers/oge-basics/multiplication-division/division-course-core.js');
const P=require('../learning/preparation-map.js');
const read=file=>fs.readFileSync(path.join(repo,file),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(role='student',api=async()=>({progress:[]})){
 const dom=new JSDOM('<main id="host"></main>',{url:'https://example.test/learning/#division-course',runScripts:'outside-only'});
 const w=dom.window,calls=[],reads=[];
 // The cabinet needs only metadata: arithmetic dependencies load inside trainers.
 w.eval(read('learning/division-course-map.js'));
 w.eval(read('learning/division-course.js'));
 const host=w.document.getElementById('host');
 const dispose=w.LearningDivisionCourse.mount(host,{account:{id:'learner',role},attempts:[],api:async url=>{reads.push(url);return api(url);},openContent:async(...args)=>{calls.push(args);}});
 return {dom,w,host,calls,reads,dispose};
}
const progress=(stage,outcome,completed=true,id='saved')=>({trainerId:'oge-basics',contentId:stage.id,completed,latest:{id,contentId:stage.id,trainerId:'oge-basics',outcome}});

test('course metadata loads in cabinet without arithmetic dependencies and retains all 17 ordered steps',async()=>{
 const f=fixture();await flush();
 assert.equal(f.w.DivisionLab,undefined);
 assert.equal(f.w.DivisionCourse.stages.length,17);
 assert.equal(f.w.DivisionCourse.make,undefined,'Cabinet metadata cannot expose tasks or answers');
 assert.deepEqual(JSON.parse(JSON.stringify(f.w.DivisionCourse.stages)),JSON.parse(JSON.stringify(C.stages)),'Navigation metadata must match the trainer core');
 assert.deepEqual([...f.host.querySelectorAll('[data-division-stage]')].map(button=>button.dataset.divisionStage),C.stages.map(stage=>stage.id));
 assert.equal(f.host.querySelectorAll('ol.division-course-list > li').length,17);
 assert.deepEqual(f.reads,['/progress']);assert.equal(f.calls.length,0,'Viewing the course must not create attempts');
 assert.equal(f.host.querySelectorAll('[aria-current="step"]').length,1);
 assert(!f.host.textContent.includes('Тема освоена'));
 f.dispose();f.dom.window.close();
});

test('complete history controls continuation; finished attempts create fresh examples and unfinished ones resume',async()=>{
 const rows=[progress(C.stages[0],'hinted',true,'older-saved'),progress(C.stages[1],'started',false,'in-progress')];
 const f=fixture('student',async()=>({progress:rows}));await flush();
 const buttons=f.host.querySelectorAll('[data-division-stage]');
 assert.equal(buttons[0].textContent,'Новые примеры →');
 assert.match(buttons[0].closest('article').textContent,/Есть решение по шагам/);
 assert.equal(buttons[1].textContent,'Продолжить →');
 assert.equal(buttons[1].closest('li').getAttribute('aria-current'),'step');
 assert.equal(buttons[0].closest('article').querySelector('a').getAttribute('href'),'#attempt=older-saved');
 buttons[0].click();await flush();buttons[1].click();await flush();
 assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[
  ['oge-basics:'+C.stages[0].id,{fresh:true,sourceAttemptId:'older-saved'}],
  ['oge-basics:'+C.stages[1].id,{}]
 ]);
 f.dispose();f.dom.window.close();
});

test('a helped check is not labelled independent, and course completion is not mastery',async()=>{
 const check=C.stages.find(stage=>stage.guidance==='check');
 const f=fixture('student',async()=>({progress:[progress(check,'hinted')]}));await flush();
 let row=[...f.host.querySelectorAll('[data-division-stage]')].find(button=>button.dataset.divisionStage===check.id).closest('article');
 assert.match(row.textContent,/Попробуй новые примеры без подсказок/);
 assert(!row.textContent.includes('Три примера решены без подсказок.'));
 assert.match(f.host.textContent,/Одна законченная работа ещё не означает/);
 f.dispose();f.dom.window.close();
 const independent=fixture('student',async()=>({progress:[progress(check,'independent')]}));await flush();
 row=[...independent.host.querySelectorAll('[data-division-stage]')].find(button=>button.dataset.divisionStage===check.id).closest('article');
 assert.match(row.textContent,/Три примера решены без подсказок/);
 independent.dispose();independent.dom.window.close();
 const repeated=fixture('student',async()=>({progress:C.stages.map(stage=>progress(stage,'repeated'))}));await flush();
 assert.match(repeated.host.textContent,/Три примера решены без подсказок/);
 assert.equal(repeated.host.querySelectorAll('[aria-current="step"]').length,0,'Successful independent retakes do not request the same check again');
 repeated.dispose();repeated.dom.window.close();
});

test('teacher uses existing assignment entry without reading student progress',async()=>{
 const f=fixture('teacher',async()=>{throw Error('Teacher must not call /progress');});await flush();
 const button=f.host.querySelector('[data-division-stage]');assert.match(button.textContent,/Назначить ученику/);button.click();await flush();
 assert.equal(f.reads.length,0);
 assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[['oge-basics:'+C.stages[0].id,{}]]);
 f.dispose();f.dom.window.close();
});

test('unavailable history leaves every step open without inventing a next step; retry is read-only',async()=>{
 let failure=true;const f=fixture('student',async()=>{if(failure)throw Error('offline');return {progress:[]};});await flush();
 assert.equal(f.host.querySelectorAll('[aria-current="step"]').length,0);
 assert.equal(f.host.querySelectorAll('[data-division-stage]:disabled').length,0);
 assert.match(f.host.textContent,/Не удалось загрузить историю/);
 failure=false;f.host.querySelector('[data-division-retry]').click();await flush();
 assert.equal(f.host.querySelectorAll('[aria-current="step"]').length,1);
 assert.equal(f.calls.length,0);assert.deepEqual(f.reads,['/progress','/progress']);
 f.dispose();f.dom.window.close();
});

test('leaving while progress loads cannot redraw a discarded course',async()=>{
 let finish;const f=fixture('student',()=>new Promise(resolve=>{finish=resolve;}));
 f.dispose();f.host.textContent='Другой раздел';finish({progress:[]});await flush();
 assert.equal(f.host.textContent,'Другой раздел');f.dom.window.close();
});

test('preparation map preserves old IDs while new course and wrappers share the ordered metadata',()=>{
 const group=P.groups.find(group=>group.id==='division');
 assert.deepEqual(group.items.filter(item=>item.tier==='core').map(item=>item.managedId),C.stages.map(stage=>'oge-basics:'+stage.id));
 assert(P.get('oge-basics:multiplication-division/long-division-one-digit'));
 assert(P.get('oge-basics:multiplication-division/long-division-from-simple-to-decimals'));
 for(const stage of C.stages){
  const file='trainers/oge-basics/multiplication-division/course-'+stage.slug+'.html';
  const dom=new JSDOM(read(file));
  assert.equal(dom.window.document.body.dataset.courseId,stage.id);
  assert.equal(dom.window.document.querySelector('h1').textContent,stage.title);
  assert(dom.window.document.querySelector('#practice'));
  assert(dom.window.document.querySelector('#view-practice[hidden] #course-local-root'));
  assert.equal(dom.window.document.querySelector('#learning-remediation-root'),null,'Public root must not duplicate the managed loader root');
  for(const node of dom.window.document.querySelectorAll('script[src],link[rel="stylesheet"]')){
   const url=node.getAttribute('src')||node.getAttribute('href');
   assert(fs.existsSync(path.resolve(repo,path.dirname(file),url.split('?')[0])),url);
  }
  dom.window.close();
 }
 for(const file of ['learning/index.html','foundations/index.html']){
  const html=read(file);assert(html.indexOf('division-course-map.js')>=0&&html.indexOf('division-course-map.js')<html.indexOf('preparation-map.js'),file+' loads course metadata before map');
 }
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
 w.eval(read('learning/division-course-map.js'));w.eval(read('learning/route.js'));
 assert.doesNotThrow(()=>w.LearningRoute.prerequisites({id:'oge-basics:fraction-meaning',contentId:'fraction-meaning',family:'remediation'},{get:()=>null}));
 dom.window.close();
});
