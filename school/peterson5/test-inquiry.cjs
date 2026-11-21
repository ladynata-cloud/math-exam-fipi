'use strict';
// DOM behavior and independent arithmetic expectations; not visual/browser QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
function page(grade,hash='',saved){const dir=path.join(root,'peterson'+grade),dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://mathexam.test/school/peterson'+grade+'/'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.scrollTo=()=>{};if(saved)w.localStorage.setItem(grade===5?'mathexam.peterson5.v1':'mathexam.peterson6.part1.v1',JSON.stringify(saved));for(const f of ['math.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(path.join(dir,f),'utf8'));return {dom,w,d:w.document,api:w.PetersonApp};}
function input(r,key,value){const i=r.d.querySelector('[data-inquiry-input="'+key+'"]');assert(i,key);i.value=value;i.dispatchEvent(new r.w.Event('input',{bubbles:true}));return i;}
function submit(r,key){const i=r.d.querySelector('[data-inquiry-input="'+key+'"]');i.form.dispatchEvent(new r.w.Event('submit',{bubbles:true,cancelable:true}));}
function click(r,sel){const b=r.d.querySelector(sel);assert(b,sel);b.click();}
function nav(r,hash){r.w.history.replaceState(null,'',hash);r.api.route();}
function final(r,answer){const field=r.d.querySelector('#final-answer');if(field){field.value=answer;field.dispatchEvent(new r.w.Event('input',{bubbles:true}));}else{const button=[...r.d.querySelectorAll('.choices button')].find(b=>b.textContent.replace(/\s/g,'')===answer.replace(/\s/g,''));assert(button,'choice');button.click();}r.d.querySelector('#answer-form').dispatchEvent(new r.w.Event('submit',{bubbles:true,cancelable:true}));}
let checks=0;
const cases5={order:['20','55'],balance:['5','6'],trial:['5','4'],gcd:['6','4'],lcm:['36','24'],fraction:['4/6','3/5'],'equivalent-fraction':['4','9'],'fraction-add':['2/3','3/5'],'fraction-multiply':['1/3','3/8'],'fraction-divide':['3','5'],'part-whole':['12','18'],decimal:['3,47','5,06'],rounding:['3,5','3,4'],'decimal-add':['4,16','3,15'],'decimal-divide':['12','11']};
for(const [kind,answers]of Object.entries(cases5)){
 const r=page(5),host=r.d.createElement('div');r.d.body.replaceChildren(host);let saved;const cleanup=r.w.PetersonModels.mount(host,{model:kind},{},{inquiry:true,onChange:s=>saved=s});
 input(r,'draft',answers[0]);submit(r,'draft');assert(r.d.querySelector('[data-inquiry-feedback="draft"]').textContent.startsWith('Верно.'),kind);assert(!saved.iq_open);click(r,'[data-inquiry-open]');assert(!r.d.querySelector('[data-inquiry-model]').hidden);assert.equal(r.d.activeElement.dataset.inquiryInput,'transferDraft');input(r,'transferDraft',answers[1]);submit(r,'transferDraft');assert(r.d.querySelector('[data-inquiry-feedback="transferDraft"]').textContent.startsWith('Верно.'),kind+' transfer');assert.equal(saved.iq_transferFirst,answers[1]);cleanup();r.dom.window.close();checks++;
}
const cases6={p01:['1','3'],p02:['1','3'],p03:['6','8'],p04:['2','6'],p05:['2','6'],p06:['1','3'],p07:['1','3'],p08:['6/20','9/20'],p09:['4','6'],p10:['5','6'],p11:['30','40'],p12:['30','40'],p13:['100','40'],p14:['110','22']};
for(const [id,answers]of Object.entries(cases6)){
 const r=page(6),lesson=r.w.PetersonCourse.lessons.find(l=>l.id===id),host=r.d.createElement('div');r.d.body.replaceChildren(host);let saved;const cleanup=r.w.PetersonModels.mount(host,lesson,{inquiry:true,onChange:s=>saved=s});
 input(r,'draft',answers[0]);submit(r,'draft');assert(r.d.querySelector('[data-inquiry-feedback="draft"]').textContent.startsWith('Верно.'),id);click(r,'[data-inquiry-open]');assert(cleanup.validateBoardState(cleanup.getBoardState()),'unchanged board allowlist');if(lesson.model==='percent'){assert.equal(cleanup.getBoardState().whole,120);assert.equal(cleanup.getBoardState().p,25);}
 input(r,'transferDraft',answers[1]);submit(r,'transferDraft');assert(r.d.querySelector('[data-inquiry-feedback="transferDraft"]').textContent.startsWith('Верно.'),id+' transfer');assert.equal(saved.transferFirst,answers[1]);cleanup();r.dom.window.close();checks++;
}
for(const [grade,id,wrong,right]of [[5,'p25','1/3','2/3'],[6,'p11','20','30']]){
 let r=page(grade,'#lesson/'+id+'/0');const task=r.w.PetersonCourse.lessons.find(l=>l.id===id).tasks[0],tid=task.id;const state=()=>r.api.getState().tasks[tid];
 if (grade === 6) click(r, 'details.inquiry-model > summary');
 submit(r,'draft');assert.equal(state().attempts,0);assert(!state().assisted,'empty inquiry is no help');input(r,'draft',wrong);assert(!state().assisted,'draft prediction is no help');submit(r,'draft');assert(state().assisted,'checking reveals guidance');assert.equal(state().attempts,0,'inquiry does not answer textbook');input(r,'draft',right);submit(r,'draft');submit(r,'draft');const snapshot=r.api.getState(),inquiry=grade===5?state().model:state().inquiry;assert.equal(inquiry[grade===5?'iq_first':'first'],wrong);assert.equal(inquiry[grade===5?'iq_last':'last'],right);assert(!state().correct);r.dom.window.close();
 // Verify sanitizer and real reload through the actual storage key.
 r=page(grade,'#lesson/'+id+'/0');const storageKey=Object.keys(r.w.localStorage).find(k=>k.includes('peterson'));assert(storageKey);r.w.localStorage.setItem(storageKey,JSON.stringify(snapshot));r.dom.window.close();
 r=page(grade,'#lesson/'+id+'/0');const sanitized=r.api.validateState(snapshot);r.dom.window.close();
 const dir=path.join(root,'peterson'+grade),dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://mathexam.test/school/peterson'+grade+'/#lesson/'+id+'/0',runScripts:'outside-only',pretendToBeVisual:true});dom.window.scrollTo=()=>{};dom.window.localStorage.setItem(storageKey,JSON.stringify(sanitized));for(const f of ['math.js','models.js','data.js','app.js'])dom.window.eval(fs.readFileSync(path.join(dir,f),'utf8'));r={dom,w:dom.window,d:dom.window.document,api:dom.window.PetersonApp};assert.equal(r.d.querySelector('[data-inquiry-input="draft"]').value,right);assert(r.d.querySelector('.model-inquiry').textContent.includes('Первая запись: '+wrong));
 final(r, task.answer);
 assert(r.api.getState().tasks[tid].correct);
 assert(!r.api.getState().tasks[tid].independent);
 click(r, '[data-action="independent-check"]');
 nav(r, r.w.location.hash);
 const match = /^#(practice|check)\/([^/]+)\/([123])$/.exec(r.w.location.hash);
 assert(match, 'fresh check route');
 const [, mode, skill, level] = match;
 assert.equal(mode, grade === 6 ? 'check' : 'practice');
 const seed = r.api.getState().practice[skill + ':' + level].seed;
 const newTask = r.w.PetersonMath.generate(skill, seed, Number(level));
 const newTaskId = [mode, skill, level, seed].join(':');
 assert.equal(r.api.getState().tasks[newTaskId].attempts, 0);
 final(r, newTask.answer);
 assert(r.api.getState().tasks[newTaskId].independent, 'fresh answer independently credited');
 assert(!r.api.getState().tasks[tid].independent, 'old assisted result unchanged');
 r.dom.window.close();
 checks++;
 // A draft forecast alone must not turn the textbook answer into assisted work.
 r=page(grade,'#lesson/'+id+'/0');
 if (grade === 6) click(r, 'details.inquiry-model > summary');
 input(r,'draft',wrong);final(r,task.answer);assert(r.api.getState().tasks[tid].independent,'prediction draft alone');r.dom.window.close();checks++;
}
console.log('PETERSON_INQUIRY_OK: '+checks+' family/integration cases; arithmetic, equal fractions, forecast-before-model, first-answer retention, reload, empty/repeat/disclosure boundaries, fresh independent practice and unchanged board state.');
