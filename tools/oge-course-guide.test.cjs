'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const NAV='mathexam.oge.course-navigation.v1';
const KEY='mathExamCourseProgress.v1';
function page({seed={},reduce=false,blocked=false}={}){
 const dom=new JSDOM(read('trainers/oge-course/index.html'),{url:'https://mathexam.space/trainers/oge-course/',runScripts:'outside-only'});
 const w=dom.window,d=w.document;
 for(const [k,v] of Object.entries(seed))w.localStorage.setItem(k,JSON.stringify(v));
 const before=JSON.stringify({...w.localStorage});let writes=0;
 w.Storage.prototype.setItem=function(){writes++;throw Error('Guide must not write storage');};
 w.Storage.prototype.removeItem=function(){writes++;throw Error('Guide must not delete storage');};
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('Blocked');}});
 const media={matches:reduce,addEventListener(type,fn){this.onchange=fn;}};
 w.matchMedia=()=>media;
 for(const f of ['oge/registry.js','oge/learning-map.js','oge/learning-map-view.js'])w.eval(read(f));
 let clock=Date.now(),nextId=0;const timers=new Map();
 w.Date.now=()=>clock;
 w.setTimeout=(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:clock+delay});return id;};
 w.clearTimeout=id=>timers.delete(id);
 function tick(ms){const end=clock+ms;for(;;){const first=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!first||first[1].at>end)break;clock=first[1].at;timers.delete(first[0]);first[1].fn();}clock=end;}
 w.eval(read('oge/course-guide.js'));
 const panel=d.querySelector('#course-guide-panel'),primary=d.querySelector('#course-continue');
 const q=s=>d.querySelector(s),action=a=>q('[data-course-guide-action="'+a+'"]').click();
 function open(mode='start'){q('[data-course-guide="'+mode+'"]').click();}
 function unchanged(){assert.equal(writes,0);if(!blocked)assert.equal(JSON.stringify({...w.localStorage}),before);assert.equal(w.location.pathname,'/trainers/oge-course/');}
 return {dom,w,d,q,open,action,panel,primary,tick,timers,media,unchanged};
}
test('help remains optional and hidden without a successfully loaded guide',()=>{
 const dom=new JSDOM(read('trainers/oge-course/index.html'));
 assert(dom.window.document.querySelector('#course-guide-panel').hidden);
 for(const b of dom.window.document.querySelectorAll('[data-course-guide]'))assert(b.hidden);
 assert.equal(dom.window.document.querySelector('#course-continue').getAttribute('href'),'/trainers/oge-task6-fractions.html');
 dom.window.close();
});
test('first visit shows actual topic and start link without creating progress or navigating',()=>{
 const p=page();assert(p.panel.hidden);assert.equal(p.timers.size,0);
 p.open();assert.equal(p.panel.dataset.guideStep,'1');assert(!p.panel.hidden);
 assert(p.q('#course-guide-topic').textContent.includes(p.q('#course-next-title').textContent));
 p.tick(2300);assert.equal(p.panel.dataset.guideStep,'2');assert(p.primary.classList.contains('course-guide-target'));
 assert.match(p.q('#course-guide-message').textContent,/Начать обучение/);
 p.tick(4600);assert.equal(p.panel.dataset.guideState,'finished');assert.equal(p.timers.size,0);
 p.unchanged();p.dom.window.close();
});
test('resume uses real selected topic and describes topic-level continuation',()=>{
 const p=page({seed:{[NAV]:{stepId:'task-11',at:Date.now()}}});
 assert.equal(p.primary.getAttribute('href'),'/trainers/oge-task11-graphs-trainer.html');
 p.open('resume');assert.match(p.q('#course-guide-topic').textContent,/График/i);
 p.tick(4600);assert.match(p.q('#course-guide-message').textContent,/конкретного задания зависит от тренажёра/);
 p.unchanged();p.dom.window.close();
});
test('resume on fresh, corrupt or blocked storage makes no saved-lesson promise',()=>{
 for(const options of [{},{blocked:true},{seed:{[NAV]:{stepId:'invalid',at:1},[KEY]:null}}]){
  const p=page(options);p.open('resume');assert.match(p.q('#course-guide-message').textContent,/Тема для продолжения пока не найдена/);
  p.unchanged();p.dom.window.close();
 }
});
test('pause keeps the step, resume uses remaining time, replay restarts and close cleans up',()=>{
 const p=page();p.open();p.tick(1100);p.action('pause');p.tick(9000);
 assert.equal(p.panel.dataset.guideStep,'1');assert.equal(p.panel.dataset.guideState,'paused');
 p.action('pause');p.tick(1199);assert.equal(p.panel.dataset.guideStep,'1');p.tick(1);assert.equal(p.panel.dataset.guideStep,'2');
 p.action('repeat');assert.equal(p.panel.dataset.guideStep,'1');assert.equal(p.timers.size,1);
 p.action('close');assert(p.panel.hidden);assert.equal(p.timers.size,0);assert(!p.primary.classList.contains('course-guide-target'));
 assert.equal(p.d.activeElement,p.q('[data-course-guide="start"]'));p.unchanged();p.dom.window.close();
});
test('reduced motion uses explicit manual steps and focuses the real link without activating it',()=>{
 const p=page({reduce:true});p.open();assert.equal(p.panel.dataset.guideState,'manual');assert.equal(p.timers.size,0);
 p.tick(10000);assert.equal(p.panel.dataset.guideStep,'1');p.action('next');p.action('next');
 assert.equal(p.panel.dataset.guideStep,'3');assert.equal(p.primary.dataset.guideMotion,'none');
 p.action('next');assert.equal(p.d.activeElement,p.primary);assert.equal(p.panel.dataset.guideState,'finished');
 p.unchanged();p.dom.window.close();
});
test('Escape restores help focus, hidden tabs pause and pagehide stops all motion',()=>{
 const p=page();p.open('resume');
 Object.defineProperty(p.d,'hidden',{get:()=>true,configurable:true});p.d.dispatchEvent(new p.w.Event('visibilitychange'));
 assert.equal(p.panel.dataset.guideState,'paused');assert.equal(p.timers.size,0);
 p.d.dispatchEvent(new p.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 assert(p.panel.hidden);assert.equal(p.d.activeElement,p.q('[data-course-guide="resume"]'));
 p.open();p.w.dispatchEvent(new p.w.Event('pagehide'));assert(p.panel.hidden);assert.equal(p.timers.size,0);
 p.unchanged();p.dom.window.close();
});
test('an open guide follows updated recommendation text and never interprets text as markup',async()=>{
 const p=page({reduce:true});p.open('resume');
 p.q('#course-next-title').textContent='<img src=x onerror=alert(1)> Новая тема';
 p.primary.textContent='Продолжить →';p.primary.setAttribute('href','/trainers/oge-task7-number-line.html');
 await new Promise(resolve=>setImmediate(resolve));
 assert(p.q('#course-guide-topic').textContent.includes('<img'));assert.equal(p.panel.querySelector('img'),null);
 assert.doesNotMatch(p.q('#course-guide-message').textContent,/Тема для продолжения пока не найдена/);
 p.action('next');assert.match(p.q('#course-guide-message').textContent,/Продолжить/);
 p.unchanged();p.dom.window.close();
});
test('changing motion preference stops timers and preserves an operable manual guide',()=>{
 const p=page();p.open();p.tick(2300);p.media.matches=true;p.media.onchange();
 assert.equal(p.timers.size,0);assert.equal(p.panel.dataset.guideState,'manual');assert.equal(p.primary.dataset.guideMotion,'none');
 p.action('next');assert.equal(p.panel.dataset.guideStep,'3');p.unchanged();p.dom.window.close();
});
