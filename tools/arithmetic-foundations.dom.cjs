'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const dir=path.resolve(__dirname,'../trainers/oge-basics/multiplication-division'),C=require(dir+'/arithmetic-foundations-core.js');
function open(id,saved,broken=false){const dom=new JSDOM(fs.readFileSync(dir+'/arithmetic-foundations.html','utf8'),{url:'https://mathexam.space/trainers/oge-basics/multiplication-division/arithmetic-foundations.html#'+id,runScripts:'outside-only'}),w=dom.window,key='mathExam.foundations.tab.v1.'+id;
 if(saved)w.sessionStorage.setItem(key,saved);if(broken)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
 w.localStorage.setItem('managed-sentinel','unchanged');for(const file of ['arithmetic-foundations-core.js','arithmetic-foundations.js'])w.eval(fs.readFileSync(dir+'/'+file,'utf8'));
 return {dom,w,key,$:s=>w.document.querySelector(s),saved:()=>w.sessionStorage.getItem(key)};
}
function submit(f,value){f.$('#answer').value=value;f.$('#answer').dispatchEvent(new f.w.Event('input'));f.$('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));}
for(const stage of C.stages){let f=open(stage.id),t=C.make(stage.id,1);
 submit(f,'');assert.equal(JSON.parse(f.saved()).errors,0);assert.equal(f.$('#feedback').textContent,'Введи целое неотрицательное число.');
 submit(f,'999999');assert(f.$('.feedback.error'));f.$('#hint').click();assert.equal(f.$('.hint').textContent,t.steps[0].hint);
 for(let i=0;i<t.steps.length;i++){assert.equal(f.$('#question').textContent,t.steps[i].prompt);submit(f,t.steps[i].answer);const saved=f.saved();f.dom.window.close();f=open(stage.id,saved);assert.equal(JSON.parse(f.saved()).answers.length,i+1);}
 assert(f.$('#new'));assert.match(f.$('#exercise').textContent,/понадобилась помощь/);assert.equal(f.w.localStorage.getItem('managed-sentinel'),'unchanged');
 f.$('#new').click();assert.equal(JSON.parse(f.saved()).seed,2);assert.equal(JSON.parse(f.saved()).streak,0);
 for(const q of C.make(stage.id,2).steps)submit(f,q.answer);
 assert.match(f.$('#exercise').textContent,/Подряд без ошибок и подсказок: 1/);f.$('#new').click();assert.equal(JSON.parse(f.saved()).streak,1);f.dom.window.close();
}
for(const invalid of ['{bad',JSON.stringify({id:'add-carry',seed:1,answers:['forged'],errors:0,help:false,draft:'',streak:0})]){const f=open('add-carry',invalid);assert.match(f.$('#storage-note').textContent,/не сохраняется/);submit(f,C.make('add-carry',1).steps[0].answer);assert.equal(f.saved(),invalid);f.dom.window.close();}
const blocked=open('sub-zeros',null,true);assert(blocked.$('#answer'));blocked.dom.window.close();
console.log('ARITHMETIC_FOUNDATIONS_DOM_OK: 12 learner journeys, wrong/help/correct, reload each step, fresh example, independent streak, invalid/blocked storage');
