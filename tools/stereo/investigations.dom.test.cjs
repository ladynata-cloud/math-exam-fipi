'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..'),I=require(root+'/stereo-course/assets/investigations.js'),errors=[];
function boot(saved,id='sections'){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<button id="home"></button><nav class="toplinks"></nav><button id="export-progress"></button><p id="storage-notice" hidden></p><main id="app"></main>',{url:'https://example.test/stereo-course/#'+id,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.STEREO_COURSE=require(root+'/stereo-course/data/course.json');w.STEREO_PROOFS=require(root+'/stereo-course/data/proofs.json');if(saved)w.localStorage.setItem('mathExamStereo.v1',JSON.stringify(saved));
 w.SpaceViewer={mount(){return{destroy(){}}}};
 for(const f of ['space.js','task-scene-viewer.js','task-scenes.js','task-proof-scenes.js','answer.js','tasks.js','investigations.js','store.js','math-text.js','app.js'])w.eval(fs.readFileSync(root+'/stereo-course/assets/'+f,'utf8'));
 const d=w.document;return {dom,w,d,click(s){const el=d.querySelector(s);assert.ok(el,s);el.click();},input(s,v){const el=d.querySelector(s);assert.ok(el,s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));},state(){return JSON.parse(w.localStorage.getItem('mathExamStereo.v1'));}};
}
let scenarios=0;
for(const [id,kind] of Object.entries(I.topics)){
 let e=boot(null,id);const seed=e.state().units[id].seed;
 e.input('#answer','старый черновик');e.click('[data-stage="1"]');assert.equal(e.d.querySelector('[data-lab-model]'),null,'prediction precedes revealing model');
 e.click('[data-lab-action=reveal]');assert.match(e.d.querySelector('[data-lab-message]').textContent,/Сначала/);
 e.input('[data-lab-prediction]','1');e.click('[data-lab-action=reveal]');assert.ok(e.d.querySelector('[data-lab-model] svg'));assert.equal(e.state().units[id].independent,0);
 e.input('[data-lab-explanation]','Сначала назову геометрическую связь.');e.click('[data-lab-preset="'+I.specs[kind].presets.at(-1)+'"]');assert.ok(!/NaN|Infinity/.test(e.d.querySelector('[data-lab-model] svg').innerHTML));
 const old=e.state();e.dom.window.close();e=boot(old,id);assert.equal(e.d.querySelector('[data-lab-explanation]').value,'Сначала назову геометрическую связь.');assert.equal(e.state().units[id].investigation.prediction,1);assert.ok(e.d.querySelector('[data-lab-model] svg'));
 e.click('[data-lab-action=transfer]');assert.equal(e.d.querySelector('[data-lab-model]'),null,'transfer condition has no model or answer');const state=e.state().units[id].investigation,q=I.questions(kind)[state.question];e.input('[data-lab-answer]',String(q.answer));e.d.querySelector('[data-lab-check]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(e.state().units[id].investigation.independent,1);assert.equal(e.state().units[id].independent,0);e.d.querySelector('[data-lab-check]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));const success=e.state();e.dom.window.close();e=boot(success,id);assert.match(e.d.querySelector('[data-lab-message]').textContent,/с первой попытки/);
 e.click('[data-lab-action=transfer]');e.click('[data-lab-action=hint]');const q2=I.questions(kind)[e.state().units[id].investigation.question];e.input('[data-lab-answer]',String(q2.answer));e.d.querySelector('[data-lab-check]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(e.state().units[id].investigation.independent,1);
 e.click('[data-stage="4"]');assert.equal(e.d.querySelector('#answer').value,'старый черновик');assert.equal(e.state().units[id].seed,seed);e.click('[data-stage="1"]');e.click('[data-lab-action=practice]');assert.equal(e.state().units[id].seed,seed+1);assert.equal(e.state().units[id].assisted,false);assert.equal(e.d.querySelector('#answer').value,'');assert.equal(e.state().units[id].investigation.independent,1);e.dom.window.close();scenarios++;
}
// A stale window must retain its unsaved explanation for recovery without overwriting new work.
const e=boot();e.click('[data-stage="1"]');e.input('[data-lab-prediction]','0');e.click('[data-lab-action=reveal]');e.input('[data-lab-explanation]','Старый текст');const newer=e.state();newer.units.sections.updated+=10;newer.units.sections.investigation.explanation='Текст другой вкладки';e.w.localStorage.setItem('mathExamStereo.v1',JSON.stringify(newer));e.input('[data-lab-explanation]','Последние несохранённые слова');assert.equal(e.state().units.sections.investigation.explanation,'Текст другой вкладки');assert.match(e.d.querySelector('#storage-notice').textContent,/Последние несохранённые слова/);e.dom.window.close();
assert.deepEqual(errors,[]);console.log('STEREO_INVESTIGATIONS_DOM_OK:',scenarios,'mapped topic journeys, restored parameter/prediction/explanation, credit isolation, CAS recovery');
