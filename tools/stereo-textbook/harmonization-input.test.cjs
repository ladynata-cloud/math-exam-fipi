'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),runtime=root+'/stereo-course/textbook/assets/engine.js',API=require(runtime),bundle=require(root+'/stereo-course/textbook/data/course.json');
const check=(input,accepted,status)=>assert.equal(API.classifyAnswer(input,accepted).status,status,JSON.stringify({input,accepted}));
// Independent numeric identities and boundary cases, including the published
// wrong-rejection and intermediate-domain regressions.
for(const [input,answer] of [['14/4','7/2'],['50/6','25/3'],['8 1/3','25/3'],['-8 1/3','-25/3'],['sqrt(1344)','8√21'],['8·√21','8sqrt(21)'],['-2^2','-4'],['(-2)^2','4'],['2^3^2','512'],['√0','0'],['.5','.50'],['2*pi','2π'],['36/2;30/2','18;15'],['36/2 см;30/2 см','18 см;15 см'],['90/2 градусов','45°']])check(input,[answer],'correct');
for(const input of ['(1/0)^0','sqrt(-4)^0','1/(1/0)','0*(1/0)','0/0','0^0','0^-1','(-1)^0.5','2/(3-3)','sqrt(4-5)'])check(input,['1'],'domain');
for(const input of ['', '  '])check(input,['25/3'],'empty');
for(const input of ['1/','2+','sqrt(','(1+2'])check(input,['1'],'incomplete');
for(const input of ['alert(1)','1;2','1 2','NaN','Infinity','3 м'])check(input,['3'],'invalid');
check('3.500001',['7/2'],'wrong');check('7/3',['7/2'],'wrong');
check('AB',['AB','BA'],'correct');check('AC',['AB','BA'],'wrong');
const ratio=bundle.lessons.find(lesson=>lesson.id==='ex-main-0074').steps.find(step=>step.id==='step-4').input.accepted;
check('8:18',ratio,'correct');check('8:0',ratio,'domain');check('8:',ratio,'incomplete');
for(const accepted of [['3','три'],['6','шесть']]){check('1/',accepted,'incomplete');check('(1/0)^0',accepted,'domain');check('два',accepted,'wrong');check(accepted[1],accepted,'correct');}
// All authored accepted strings remain accepted; numerical extensions do not
// replace the text contracts of names, theory and multicomponent answers.
let contracts=0,variants=0;
for(const lesson of bundle.lessons){for(const contract of [lesson.answer,...lesson.steps.map(step=>step.input)].filter(x=>x?.accepted)){
 contracts++;for(const answer of contract.accepted){check(answer,contract.accepted,'correct');variants++;}
}}
function boot(saved={}){
 const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/stereo-course/textbook/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,doc=w.document;
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,value);
 w.TaskSceneViewer={mount(node,model,options){node.append(doc.createElement('svg'));return {setView(){},destroy(){node.replaceChildren();},getState(){return options.savedCamera||{yaw:0,pitch:0};}};}};
 w.eval(fs.readFileSync(root+'/stereo-course/assets/math-text.js','utf8'));w.eval(fs.readFileSync(runtime,'utf8'));
 const app=w.StereoTextbook.createApp(doc.getElementById('app'),{...bundle});
 const key=id=>'mathExamTextbook.v1:'+bundle.catalog.book.id+':'+id+':r'+bundle.lessons.find(x=>x.id===id).revision;
 const state=id=>JSON.parse(w.localStorage.getItem(key(id)));
 function submit(text){const input=doc.querySelector('#final-answer');input.value=text;input.dispatchEvent(new w.Event('input',{bubbles:true}));doc.querySelector('[data-final-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));return doc.querySelector('[data-final-feedback]');}
 return {dom,w,doc,app,key,state,submit,close(){app.destroy();dom.window.close();}};
}
{
 const e=boot(),id='ex-main-0028';e.app.open(id);
 for(const input of ['', '   ','1/','(1/0)^0']){
  const result=e.submit(input),saved=e.state(id);assert.doesNotMatch(result.textContent,/25|8\s*1\/3/,'invalid input cannot reveal the final answer');assert.equal(saved.wrongAttempts,0);assert.equal(saved.firstAttempt,null);assert.equal(saved.assisted,false);assert.equal(saved.checked,false);
 }
 e.submit('9');assert.equal(e.state(id).wrongAttempts,1);assert.equal(e.state(id).assisted,false);assert.deepEqual(e.state(id).firstAttempt,{input:'9',status:'wrong'});
 assert.doesNotMatch(e.doc.querySelector('[data-final-feedback]').textContent,/25/);
 assert.match(e.submit('10').textContent,/Хочешь подсказку/);assert.equal(e.state(id).wrongAttempts,2);
 assert.match(e.submit('50/6').textContent,/исправил.*самостоятельно/);assert.equal(e.state(id).checkedWith,'corrected');assert.deepEqual(e.state(id).firstAttempt,{input:'9',status:'wrong'});
 const saved=e.w.localStorage.getItem(e.key(id));e.close();const restored=boot({['mathExamTextbook.v1:atanasyan-2024-10-11:'+id+':r1']:saved});restored.app.open(id);assert.equal(restored.doc.querySelector('#final-answer').value,'50/6');assert.equal(restored.state(id).wrongAttempts,2);assert.equal(restored.state(id).checkedWith,'corrected');restored.close();
}
{
 const e=boot(),id='ex-main-0018-a';e.app.open(id);e.submit('1/');assert.match(e.submit('14/4').textContent,/Решено самостоятельно/);assert.equal(e.state(id).checkedWith,'independent');assert.deepEqual(e.state(id).firstAttempt,{input:'14/4',status:'correct'});e.close();
}
{
 const e=boot(),id='ex-main-0028';e.app.open(id);e.doc.querySelector('[data-main-help]').open=true;e.doc.querySelector('[data-answer-explanation]').click();assert.equal(e.state(id).assisted,true);assert.match(e.doc.querySelector('[data-final-feedback]').textContent,/25/);assert.match(e.submit('50/6').textContent,/после обращения к помощи/);assert.equal(e.state(id).checkedWith,'assisted');e.close();
}
{
 const e=boot(),lesson=bundle.lessons.find(x=>x.answer?.mode==='manual');e.app.open(lesson.id);assert.match(e.submit(' ').textContent,/Сначала запиши/);assert.equal(e.state(lesson.id).checked,false);assert.match(e.submit('Проведём прямую через две заданные точки.').textContent,/обсудить с учителем/);assert.equal(e.state(lesson.id).checked,false);e.close();
}
{
 const id='ex-main-0018-a',key='mathExamTextbook.v1:atanasyan-2024-10-11:'+id+':r1',legacy={draft:'старый черновик',stepDrafts:{},revealed:0,assisted:true,checked:true,camera:{yaw:.5,pitch:.3}};
 const e=boot({[key]:JSON.stringify(legacy)});e.app.open(id);assert.equal(e.doc.querySelector('#final-answer').value,legacy.draft);e.submit('14/4');assert.equal(e.state(id).assisted,true);assert.equal(e.state(id).checkedWith,null,'legacy success is not silently reclassified');e.close();
}
{
 const e=boot(),id='ex-main-0018-a';e.app.open(id);e.submit('3');const newer={...e.state(id),draft:'более свежая работа',wrongAttempts:3};const bytes=JSON.stringify(newer);e.w.localStorage.setItem(e.key(id),bytes);e.submit('14/4');assert.equal(e.w.localStorage.getItem(e.key(id)),bytes);assert.equal(e.doc.querySelector('#final-answer').readOnly,true);e.close();
}
console.log('ATANASYAN_TEXTBOOK_HARMONIZATION_INPUT_OK',JSON.stringify({cards:bundle.lessons.length,contracts,variants,domScenarios:6}));
