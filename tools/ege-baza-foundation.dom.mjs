// DOM integration checks, not a replacement for the browser/visual gate.
// Requires jsdom (installed outside the repository and exposed via NODE_PATH).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM,VirtualConsole}=createRequire(import.meta.url)('jsdom');
const source=fs.readFileSync('trainers/ege-baza/course/index.html','utf8');
const url='https://example.test/trainers/ege-baza/course/';
const KEY='mathexam.ege-baza.foundation.v1';
let dom, w, checks=0, downloads=[], blobs=[], errors=[];
const ok=(condition,message)=>{assert.ok(condition,message);checks++;};
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
const q=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);return el;};
const text=()=>q('#main').textContent;
function boot(saved={},hash='',blocked=false){
 if(dom)dom.window.close();
 const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
 dom=new JSDOM(source,{url:url+hash,runScripts:'dangerously',virtualConsole:console,beforeParse(window){
  window.scrollTo=()=>{};
  window.HTMLElement.prototype.scrollIntoView=()=>{};
  window.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:synthetic-test';};
  window.URL.revokeObjectURL=()=>{};
  const click=window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push(this.download);else click.call(this);};
  if(blocked){window.Storage.prototype.getItem=()=>{throw new Error('storage disabled');};window.Storage.prototype.setItem=()=>{throw new Error('storage disabled');};}
  else for(const [key,value] of Object.entries(saved))window.localStorage.setItem(key,value);
 }});w=dom.window;
}
function saved(){return Object.fromEntries(Object.keys(w.localStorage).map(key=>[key,w.localStorage.getItem(key)]));}
async function reload(){const items=saved(),hash=w.location.hash;boot(items,hash);await tick();}
async function go(hash){w.location.hash=hash;await tick();}
async function click(selector){q(selector).click();await tick();}
async function answer(value){q('#answer').value=String(value);q('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();}
function state(){return JSON.parse(w.localStorage.getItem(KEY));}
try{
 boot();const tasks=w.MathExamFoundation.TASKS,skills=w.MathExamFoundation.SKILLS;
 ok(q('h1').textContent.includes('Числа, деньги'),'Module starts');
 w.localStorage.setItem('legacy-trainer-progress','keep-me');
 await click('[data-action="start-diagnostic"]');
 for(const [i,t] of tasks.filter(t=>t.phase==='diagnostic').entries()){
  ok(!w.document.querySelector('[data-action="hint"]'),'Assessment has no hints');
  ok(!text().includes('Верный ответ:'),'No early solution');
  if(i===1)await click('[data-action="skip"]');else await answer(i===0?'999':t.answer);
 }
 ok(text().includes('10 / 12'),'Wrong answer and skip scored');
 await go('#map');ok(text().includes('Подтверждено в проверке: 0 из 6'),'Diagnostic does not grant mastery');
 await go('#practice-decimal-0');await answer('1/2');
 ok(!state().practice['decimal-practice-1']?.tries,'Invalid input is not a try');
 await click('[data-action="hint"]');await reload();
 ok(!q('#feedback').hidden&&q('#feedback').textContent.length>5,'Hint persists across reload');
 await answer('0,75');ok(text().includes('Верно — с поддержкой'),'Helped answer not independent');
 for(const s of skills){for(const [i,t] of tasks.filter(t=>t.phase==='practice'&&t.skill===s.id).entries()){
  if(s.id==='decimal'&&i===0)continue;
  await go(`#practice-${s.id}-${i}`);await answer(String(t.answer).replace('.',','));
  ok(text().includes('Верно с первого раза'),'Independent practice: '+t.id);
 }}
 await go('#map');ok(w.document.querySelectorAll('.tag').length===6&&text().match(/Решаю самостоятельно/g).length>=6,'All six practice skills reached');
 await go('#checks');ok(q('[data-action="start-repeat"]').disabled,'Repeat locked before checkpoint');
 await click('[data-action="start-checkpoint"]');
 for(const [i,t] of tasks.filter(t=>t.phase==='checkpoint').entries()){
  await answer(t.answer);if(i===0){await reload();ok(q('h2').textContent==='Задание 2 из 12','Checkpoint resumes after reload');}
 }
 await go('#map');ok(text().includes('Подтверждено в проверке: 6 из 6'),'Checkpoint confirms skills');
 await go('#checks');ok(q('[data-action="start-repeat"]').disabled,'Repeat locked immediately after checkpoint');
 await go('#test-repeat');await tick();ok(w.location.hash==='#checks','Direct repeat URL cannot bypass lock');
 const completed=state().runs.checkpoint.finishedAt;
 w.Date.now=()=>completed+86400000-1;await go('#map');await go('#checks');ok(q('[data-action="start-repeat"]').disabled,'Repeat locked one millisecond before 24 hours');
 w.Date.now=()=>completed+86400000;await go('#map');await go('#checks');ok(!q('[data-action="start-repeat"]').disabled,'Repeat available at 24 hours');
 await click('[data-action="start-repeat"]');
 for(const t of tasks.filter(t=>t.phase==='repeat'))await answer(t.answer);
 await go('#map');ok(text().match(/Подтверждено повторением/g).length===6,'All six repeat skills confirmed');
 await go('#report');const report=q('#report-text').value;
 ok(report.includes('10/12')&&report.includes('12/12')&&report.includes('с первого раза без помощи'),'Report distinguishes activities and support');
 await click('[data-action="download"]');ok(downloads[0]==='mathexam-baza-module-1-report.txt'&&blobs[0].type==='text/plain;charset=utf-8','Report download generated (DOM only)');
 await click('[data-action="reset-ask"]');await click('[data-action="reset-cancel"]');ok(!!state().runs.repeat.finishedAt,'Cancel preserves progress');
 await click('[data-action="reset-ask"]');await click('[data-action="reset-confirm"]');
 ok(w.localStorage.getItem('legacy-trainer-progress')==='keep-me'&&w.localStorage.getItem(KEY)===null,'Reset clears only module');
 await go('#practice-division-0');await answer('999');await reload();await answer('12');ok(text().includes('Верно после исправления'),'Wrong attempt persists');
 await go('#practice-division-1');await click('[data-action="solution"]');await reload();await answer('30');ok(text().includes('Верно — с поддержкой'),'Full solution persists');
 await go('#checks');await click('[data-action="start-checkpoint"]');await go('#learn-percent');await go('#test-checkpoint');
 ok(text().includes('Она будет отмечена как учебная'),'Learning during assessment recorded');
 for(const t of tasks.filter(t=>t.phase==='checkpoint'))await answer(t.answer);
 await go('#map');ok(text().includes('Подтверждено в проверке: 0 из 6'),'Supported checkpoint grants no mastery');
 for(const s of skills){await go('#learn-'+s.id);q('#slider').value=s.id==='division'?'2':s.id==='rounding'?'7':s.id==='choice'?'15':'50';q('#slider').dispatchEvent(new w.Event('input'));ok(q('#model-output').textContent.length>20,'Model updates: '+s.id);}
 await go('#learn-division');q('#example').value='1';q('#example').dispatchEvent(new w.Event('change'));q('#slider').value='2';q('#slider').dispatchEvent(new w.Event('input'));
 ok(q('#model-output').textContent.includes('350 : 7'),'Division shifts both numbers by 100');
 const newState={v:1,practice:{},runs:{}};w.localStorage.setItem(KEY,JSON.stringify(newState));w.dispatchEvent(new w.StorageEvent('storage',{key:KEY}));
 ok(q('#storage-warning').textContent.includes('другой вкладки'),'Cross-tab storage notification');
 w.localStorage.setItem(KEY,'{broken');await reload();ok(!q('#storage-warning').hidden&&text().length>100,'Corrupt storage remains usable');
 boot({},'#practice-decimal-0',true);await answer('.75');ok(!q('#storage-warning').hidden&&text().includes('Верно с первого раза'),'Storage denial remains usable');
 ok(errors.length===0,'No uncaught script errors: '+errors.join('; '));
 console.log(`EGE_BAZA_FOUNDATION_DOM_OK: ${checks} checks; 60-task flow, assistance, reload, 24h boundary, reset and recovery. Browser layout/keyboard/download still require browser gate.`);
}finally{if(dom)dom.window.close();}
