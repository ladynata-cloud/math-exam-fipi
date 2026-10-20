'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test'),{JSDOM}=require('jsdom');
const base=path.resolve(__dirname,'../trainers/oge-basics'),sub='multiplication-division/';
const variants=[
 {id:'arithmetic-foundations',hash:'#add-carry',files:['arithmetic-foundations-core.js','arithmetic-foundations.js'],input:'#answer',form:'#answer-form',prompt:'#question',read:w=>JSON.parse(w.sessionStorage.getItem('mathExam.foundations.tab.v1.add-carry')),progress:s=>s.answers.length,assisted:s=>s.help,answer:w=>w.ArithmeticFoundations.make('add-carry',1).steps[0].answer},
 {id:'quotient-estimate',files:['division-lab-core.js','quotient-estimate-core.js','../learning-scaffolds.js','quotient-estimate.js'],input:'#estimate-answer',form:'#estimate-form',prompt:'#estimate-task',read:w=>JSON.parse(w.localStorage.getItem('mathExamBasics.quotientEstimate.v1'))?.state||{answers:[],help:false},progress:s=>s.answers.length,assisted:s=>s.help,answer:w=>w.QuotientEstimate.makeV2(1).steps[0].answer},
 {id:'division-lab',files:['division-lab-core.js','division-lab.js'],input:'#answer',form:'#answer-form',prompt:'#prompt',read:w=>JSON.parse(w.localStorage.getItem(w.DivisionLab.KEY)).session,progress:s=>s.step,assisted:s=>s.hints>0,answer:w=>w.DivisionLab.plan(JSON.parse(w.localStorage.getItem(w.DivisionLab.KEY)).session.task).actions[0].answer},
 {id:'long-division-from-simple-to-decimals',files:['division-lab-core.js','division-guided-core.js','../arithmetic-route.js','decimal-shift.js','multiplication-refresh.js','division-guided.js'],input:'#answer',form:'#answer-form',prompt:'#prompt',read:w=>{const s=w.__divisionGuidedDebug.state();return s.sessions[s.active];},progress:s=>s.answers.length,assisted:s=>s.hints>0,answer:w=>w.__divisionGuidedDebug.plan().actions[0].answer}
];
function open(t,v,late){
 const dom=new JSDOM(fs.readFileSync(path.join(base,sub,v.id+'.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-basics/'+sub+v.id+'.html'+(v.hash||''),runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());
 const w=dom.window,d=w.document;w.structuredClone=structuredClone;w.HTMLElement.prototype.scrollIntoView=()=>{};
 const script=p=>w.eval(fs.readFileSync(path.join(base,p),'utf8'));
 if(!late)script('basics-help.js');v.files.forEach(p=>script(sub+p));
 const input=d.querySelector(v.input);input.value='7';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 if(late)script('basics-help.js');
 return {w,d,$:s=>d.querySelector(s)};
}
for(const v of variants)for(const late of [false,true])test(v.id+' keeps its task and draft through nested help ('+(late?'late':'early')+' helper)',t=>{
 const f=open(t,v,late),initialPrompt=f.$(v.prompt).textContent,initial=f.$(v.input),saved=v.read(f.w),progress=v.progress(saved);
 assert.equal(initial.value,'7');assert.equal(f.$(v.form).hidden,false);assert(f.$('.bh-toggle'));assert.equal(f.$('.bh-panel').hidden,true);
 if(v.id==='division-lab')assert.equal(saved.mode,'practice','first visit must not start a test');
 if(v.id==='quotient-estimate')assert.equal(f.$('#view-practice').hidden,false);
 assert(!v.assisted(saved));f.$('.bh-toggle').click();assert.equal(f.$('.bh-panel').hidden,false);assert(v.assisted(v.read(f.w)));assert.equal(v.progress(v.read(f.w)),progress);
 assert(f.$('.bh-current-hint').textContent.trim().length>10,'original help is available');
 f.$('.bh-frame:not([hidden]) [data-bh-skill]').click();const child=f.$('.bh-frame:not([hidden]) .bh-answer');assert(child);child.value='999';f.$('.bh-frame:not([hidden]) .bh-check').click();assert.match(f.$('.bh-frame:not([hidden]) .bh-feedback').textContent,/Пока не совпало/);
 const skill=f.$('.bh-frame:not([hidden])').dataset.bhNode,correct=f.w.MathExamBasicsHelp.curriculum[skill].answer;child.value=Array.isArray(correct)?correct[0]+'/'+correct[1]:String(correct);f.$('.bh-frame:not([hidden]) .bh-check').click();assert.equal(child.readOnly,true,'the prerequisite can be completed');assert.equal(v.progress(v.read(f.w)),progress,'a child task never advances its parent');
 f.$('.bh-close').click();assert.equal(f.$('.bh-panel').hidden,true);f.$('.bh-toggle').click();assert.equal(f.$('.bh-frame:not([hidden]) .bh-answer'),child);assert.equal(child.readOnly,true);
 f.$('.bh-root').click();assert.equal(f.$(v.input),initial,'opening help does not replace the original input');assert.equal(initial.value,'7');assert.equal(f.$(v.prompt).textContent,initialPrompt);assert.equal(v.progress(v.read(f.w)),progress);
 initial.value=v.answer(f.w);initial.dispatchEvent(new f.w.Event('input',{bubbles:true}));f.$(v.form).dispatchEvent(new f.w.Event('submit',{cancelable:true}));assert.equal(v.progress(v.read(f.w)),progress+1);assert.equal(f.$('.bh-panel')?.hidden??true,true,'accepted or new steps close old help');
 if(v.id==='long-division-from-simple-to-decimals')f.$(v.form).dispatchEvent(new f.w.Event('submit',{cancelable:true}));
 assert(f.$('.bh-toggle'));f.$('.bh-toggle').click();assert.equal(f.$('.bh-panel').hidden,false);assert(f.$('.bh-current-hint').textContent.trim().length>10,'the following step retains its own hint');assert.equal(f.$('.bh-panel').dataset.bhDepth,'0');
});
test('five navigation maps retain every existing link and diagnostic requires an explicit start',t=>{
 for(const p of ['index.html','percentages/index.html',sub+'index.html','arithmetic-route.html',sub+'division-course.html']){
  const dom=new JSDOM(fs.readFileSync(path.join(base,p),'utf8'),{url:'https://mathexam.space/trainers/oge-basics/'+p,runScripts:'outside-only'});t.after(()=>dom.window.close());const d=dom.window.document,links=()=>[...d.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).sort();const before=links();dom.window.eval(fs.readFileSync(path.join(base,'navigation-minimal.js'),'utf8'));d.dispatchEvent(new dom.window.Event('DOMContentLoaded'));assert.deepEqual(links(),before,p);assert(d.body.classList.contains('basics-navigation'));
 }
 const dom=new JSDOM(fs.readFileSync(path.join(base,sub+'division-diagnostic.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-basics/'+sub+'division-diagnostic.html',runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window;w.structuredClone=structuredClone;for(const p of ['division-lab-core.js','division-diagnostic-core.js','division-diagnostic.js'])w.eval(fs.readFileSync(path.join(base,sub+p),'utf8'));assert.match(w.document.querySelector('#diagnostic').textContent,/Начать/);assert.equal(w.document.querySelector('.bh-toggle'),null);assert.equal(w.document.querySelector('input'),null);
});
