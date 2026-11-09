'use strict';
// Synthetic support examples; parent/managed grading must remain entirely separate.
const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const H=require('../trainers/oge-basics/basics-help.js');
const expected={
 'percent-meaning':40,'percent-part':120*25/100,'percent-change':90*20/100,proportion:280/4,
 'fraction-parts':[5,8],'fraction-equivalent':12/3,'fraction-add':[5,6],decimal:[7,100],
 'decimal-add':[7,10],rounding:4,'decimal-shift':8,negative:-4+2,units:5*100,'area-units':4*4,
 order:5+3*4,'first-part':1,compare:9-5,bring:2*10+3,divide:20/4,quotient:Math.floor(38/7),
 'write-digit':37%10,'in-mind':Math.floor(48/10),multiply:5*4,subtract:15-6,add:8+6,count:10
};
const raw=answer=>Array.isArray(answer)?answer.join('/'):String(answer);
function mount(t,id){
 const dom=new JSDOM('<main><p id="main-question">Исходное условие</p><input id="main-answer" value="черновик"><div id="host"></div></main>',{url:'https://example.test/'});t.after(()=>dom.window.close());
 const d=dom.window.document,events=[],helper=H.create();
 const context={kind:({'first-part':'start',bring:'bring',divide:'answer',quotient:'digit','write-digit':'digit','in-mind':'carry',multiply:'product',subtract:'subtract',add:'add'})[id]};
 const contentId=({'fraction-parts':'fraction-meaning','fraction-equivalent':'fraction-common-denominator','fraction-add':'fraction-addition','percent-part':'percentages/percent-of-number-and-whole','percent-change':'percent-change','percent-meaning':'percent-meaning','area-units':'units-area',decimal:'decimal-place','decimal-add':'decimal-add-subtract','decimal-shift':'decimal-shift','in-mind':'column-multiplication','write-digit':'column-multiplication',count:'count',compare:'compare'})[id]||id;
 if(id==='in-mind')context.question={multiplication:{event:'carry',phase:'multiply'}};
 const options={host:d.getElementById('host'),identity:'support-'+id,contentId,context,onUse:()=>events.push('hint')};helper.update(options);helper.open();
 // A test follows the real prerequisite graph if this node isn't the root skill.
 const start=H.skillFor(contentId,context);
 function route(from){if(from===id)return [from];for(const child of H.curriculum[from].children){const rest=route(child);if(rest)return [from,...rest];}return null;}
 let walk=route(start);
 if(!walk){ // Compare and count are genuinely reached from their prerequisite parent.
   const rootId=id==='compare'?'multiplication-division/first-part':'order-of-operations';
   options.contentId=rootId;options.context={};helper.update(options);helper.open();walk=route(H.skillFor(rootId));
 }
 assert(walk,'A real public helper route reaches '+id);
 for(const step of walk)d.querySelector('.bh-frame:not([hidden]) [data-bh-skill="'+step+'"]').click();
 const frame=d.querySelector('.bh-frame:not([hidden])'),$=s=>frame.querySelector(s);
 $('.bh-answer').value=raw(H.curriculum[id].answer);$('.bh-check').click();assert($('.bh-start-transfer')&&!$('.bh-start-transfer').hidden);
 return {dom,d,helper,frame,$,options,events,start(){this.$('.bh-start-transfer').click();},submit(value){this.$('.bh-transfer-answer').value=value;this.$('.bh-transfer-check').click();}};
}
test('every support skill has a distinct new example with an independently computed exact answer',()=>{
 assert.equal(Object.keys(expected).length,26);
 for(const [id,answer]of Object.entries(expected)){
  const next=H.transferFor(id);assert(next,id);assert.notEqual(next.question,H.curriculum[id].question,id);
  assert(H.acceptsAnswer(next.answer,raw(answer)),id);
  assert(!H.acceptsAnswer(next.answer,raw(H.curriculum[id].answer)),id+' must not accept the old revealed answer');
  for(const bad of ['', ' ', 'NaN','Infinity','1/0','0/0','1e2','<script>','1.2.3'])assert(!H.acceptsAnswer(next.answer,bad),id+': '+bad);
 }
 assert.equal(H.transferFor('unknown'),null);
 assert(H.acceptsAnswer([5,6],'10/12'));assert(H.acceptsAnswer([5,6],'-10/-12'));
 assert(!H.acceptsAnswer([5,6],'0.8333333333'));assert(!H.accepts('fraction-parts','0.7499999999'));
 assert(H.acceptsAnswer([7,100],'0,07'));assert(H.acceptsAnswer([7,100],'0.0700'));
});
test('all 26 transfer journeys leave the parent untouched and do not emit check/progress events',t=>{
 for(const id of Object.keys(expected)){
  const f=mount(t,id);assert(f.$('.bh-transfer').hidden);f.start();
  assert.equal(f.d.activeElement,f.$('.bh-transfer-answer'));
  f.submit(raw(expected[id]));assert.equal(f.$('.bh-transfer').dataset.bhTransferSolved,'true',id);
  assert.match(f.$('.bh-transfer-feedback').textContent,/с первой попытки без намёка/);
  assert.equal(f.d.querySelector('#main-answer').value,'черновик');assert.equal(f.d.querySelector('#main-question').textContent,'Исходное условие');
  assert.deepEqual(f.events,['hint']);assert.equal(f.dom.window.localStorage.length,0);
  const history=f.$('.bh-transfer-history').textContent,check=f.$('.bh-transfer-check');
  check.click();check.onclick();f.$('.bh-transfer-answer').dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  assert.equal(f.$('.bh-transfer-history').textContent,history);
 }
});
test('empty/invalid answers do not count; two errors offer help, only disclosure records it',t=>{
 const f=mount(t,'percent-part');f.start();
 for(const value of ['', ' ', '1/0', 'abc'])f.submit(value);
 assert.equal(f.$('.bh-transfer-history').textContent,'');
 f.submit('20');f.submit('25');
 assert.match(f.$('.bh-transfer-history').textContent,/Первый ответ: 20\. Попыток: 2\. Без намёка/);
 assert.match(f.$('.bh-transfer-feedback').textContent,/Можно открыть намёк/);
 assert(f.$('.bh-transfer-hint-text').hidden);assert.equal(f.$('.bh-transfer-hint-text').textContent,'');
 f.$('.bh-transfer-hint').click();assert.match(f.$('.bh-transfer-history').textContent,/Намёк открыт/);
 assert.match(f.$('.bh-transfer-hint-text').textContent,/новое целое на 4/);
 f.submit('30');assert.match(f.$('.bh-transfer-feedback').textContent,/Получилось с намёком/);
 assert.match(f.$('.bh-transfer-history').textContent,/Первый ответ: 20\. Попыток: 3/);
});
test('correction without help, same-task reattachment, read-only and identity replacement preserve boundaries',t=>{
 const f=mount(t,'fraction-add');f.start();f.submit('5/12');
 const input=f.$('.bh-transfer-answer'),history=f.$('.bh-transfer-history');input.value='10/12';
 f.helper.update({...f.options,disabled:true});const before=history.textContent;
 assert(input.disabled);f.$('.bh-transfer-check').onclick();assert.equal(history.textContent,before);
 f.helper.update(f.options);f.helper.open();assert.equal(f.$('.bh-transfer-answer'),input);assert.equal(input.value,'10/12');
 input.dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.match(f.$('.bh-transfer-feedback').textContent,/после исправления без намёка/);
 f.helper.update({...f.options,disabled:true});f.helper.update(f.options);assert(f.$('.bh-transfer-check').disabled);assert(input.readOnly);
 const old=f.$('.bh-transfer-hint');f.helper.update({...f.options,identity:'next-task'});assert(!input.isConnected);old.onclick();assert.equal(history.textContent,'Первый ответ: 5/12. Попыток: 2. Без намёка.');
 f.helper.destroy();assert.equal(f.d.querySelector('.bh-help'),null);
});
test('managed renderer keeps transfer history through server echoes without altering grading or saved answers',t=>{
 const contracts=require('../board-server/learning-contracts'),remediation=require('../trainers/oge-basics/learning-contracts');
 const envelope=contracts.create('oge-basics','percentages/percent-of-number-and-whole',17);
 const dom=new JSDOM('<main id="learning-remediation-root"></main>',{url:'https://example.test/?learning=1',runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 const events=[];let bridge;Object.assign(w,{MathExamRemediationManaged:true,MathExamRemediation:remediation,MathExamBasicsHelp:H,MathExamLearning:{register(value){bridge=value;}}});
 w.eval(fs.readFileSync(path.resolve(__dirname,'../trainers/oge-basics/learning-managed.js'),'utf8'));
 bridge.subscribe(event=>events.push(JSON.parse(JSON.stringify(event))));bridge.applyState({...JSON.parse(JSON.stringify(envelope)),readOnly:false});
 const $=s=>w.document.querySelector(s);$('#lm-answer').value='working draft';$('#lm-answer').dispatchEvent(new w.Event('input'));
 $('.bh-toggle').click();$('[data-bh-skill="percent-part"]').click();$('.bh-frame:not([hidden]) .bh-answer').value='20';$('.bh-frame:not([hidden]) .bh-check').click();$('.bh-start-transfer').click();
 const baseline=JSON.stringify(bridge.getState()),eventCount=events.length,input=$('.bh-transfer-answer');
 input.value='20';$('.bh-transfer-check').click();
 bridge.applyState({taskSpec:envelope.taskSpec,state:JSON.parse(baseline),readOnly:false});
 assert.equal($('.bh-transfer-answer'),input);assert.match($('.bh-transfer-history').textContent,/Первый ответ: 20/);
 $('.bh-transfer-hint').click();input.value='30';$('.bh-transfer-check').click();
 assert.equal(JSON.stringify(bridge.getState()),baseline);assert.equal(events.length,eventCount);
 assert.match($('.bh-transfer-feedback').textContent,/Получилось с намёком/);
 assert.equal($('#lm-answer').value,'working draft');assert.equal(bridge.getState().completed,false);
 const next=contracts.create('oge-basics','percentages/percent-of-number-and-whole',19);
 bridge.applyState({...JSON.parse(JSON.stringify(next)),readOnly:false});assert(!input.isConnected);assert.equal($('.bh-transfer-history'),null);
});
