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
 $('.bh-start-understanding').click();$('.bh-understanding-answer').value='30';$('.bh-understanding-check').click();
 const inverseInput=$('.bh-understanding-answer');bridge.applyState({taskSpec:envelope.taskSpec,state:JSON.parse(baseline),readOnly:false});
 assert.equal($('.bh-understanding-answer'),inverseInput);assert.match($('.bh-understanding-history').textContent,/Первый ответ: 30/);
 $('.bh-understanding-hint').click();inverseInput.value='60';$('.bh-understanding-check').click();
 assert.equal($('.bh-understanding').dataset.bhUnderstandingSolved,'true');assert.equal($('.bh-transfer').dataset.bhTransferSolved,'true');
 assert.equal(JSON.stringify(bridge.getState()),baseline);assert.equal(events.length,eventCount);
 assert.equal($('#lm-answer').value,'working draft');assert.equal(bridge.getState().completed,false);
 const next=contracts.create('oge-basics','percentages/percent-of-number-and-whole',19);
 bridge.applyState({...JSON.parse(JSON.stringify(next)),readOnly:false});assert(!input.isConnected);assert.equal($('.bh-transfer-history'),null);
});
const understandingExpected={'percent-part':18/30*100,'percent-change':24/20*100,'fraction-parts':3*4,'fraction-equivalent':'no','fraction-add':[1,2],proportion:'unit'};
function openUnderstanding(f,id){
 f.start();f.submit(raw(expected[id]));assert.equal(f.$('.bh-transfer').dataset.bhTransferSolved,'true');
 assert(f.$('.bh-start-understanding'));assert(f.$('.bh-understanding').hidden);f.$('.bh-start-understanding').click();assert(!f.$('.bh-understanding').hidden);
}
function answerUnderstanding(f,value){
 const input=f.$('.bh-understanding-answer');if(input)input.value=raw(value);else f.$('[data-understanding-choice="'+value+'"]').click();f.$('.bh-understanding-check').click();
}
test('six optional understanding questions change the structure while preserving the completed transfer',t=>{
 assert.equal(H.understandingFor('count'),null);
 for(const [id,answer]of Object.entries(understandingExpected)){
  const data=H.understandingFor(id);assert(data,id);assert.notEqual(data.question,H.transferFor(id).question);
  if(data.choices)assert.equal(data.answer,answer);else assert(H.acceptsAnswer(data.answer,raw(answer)));
  const f=mount(t,id);openUnderstanding(f,id);
  const forwardHistory=f.$('.bh-transfer-history').textContent,forwardFeedback=f.$('.bh-transfer-feedback').textContent;
  f.$('.bh-understanding-check').click();assert.equal(f.$('.bh-understanding-history').textContent,'');
  answerUnderstanding(f,data.choices?data.choices.find(row=>row[0]!==data.answer)[0]:999);
  assert.equal(f.$('.bh-transfer').dataset.bhTransferSolved,'true');assert(f.$('.bh-transfer-answer').readOnly);
  assert.equal(f.$('.bh-transfer-history').textContent,forwardHistory);assert.equal(f.$('.bh-transfer-feedback').textContent,forwardFeedback);
  assert(!f.$('.bh-understanding').dataset.bhUnderstandingSolved);assert(f.$('.bh-understanding-hint-text').hidden);
  answerUnderstanding(f,answer);assert.equal(f.$('.bh-understanding').dataset.bhUnderstandingSolved,'true');
  assert.match(f.$('.bh-understanding-history').textContent,/Попыток: 2\. Без помощи/);
  assert.match(f.$('.bh-understanding-feedback').textContent,/после исправления без помощи/);
  assert(f.$('.bh-understanding-feedback').textContent.includes(data.why));assert.deepEqual(f.events,['hint']);
  const understandingHistory=f.$('.bh-understanding-history').textContent,check=f.$('.bh-understanding-check');check.onclick();check.click();
  assert.equal(f.$('.bh-understanding-history').textContent,understandingHistory);assert.equal(f.d.querySelector('#main-answer').value,'черновик');
 }
});
test('understanding preserves first answer and its own help through echoes, readonly mode and teardown',t=>{
 const f=mount(t,'percent-part');openUnderstanding(f,'percent-part');
 for(const value of ['', '1/0','abc'])answerUnderstanding(f,value);assert.equal(f.$('.bh-understanding-history').textContent,'');
 answerUnderstanding(f,30);answerUnderstanding(f,18);assert.match(f.$('.bh-understanding-history').textContent,/Первый ответ: 30\. Попыток: 2\. Без помощи/);
 assert(f.$('.bh-understanding-hint-text').hidden);assert.match(f.$('.bh-understanding-feedback').textContent,/Можно открыть намёк/);
 f.$('.bh-understanding-hint').click();assert.match(f.$('.bh-understanding-history').textContent,/Помощь использована/);
 const input=f.$('.bh-understanding-answer');input.value='60';const oldCheck=f.$('.bh-understanding-check');
 f.helper.update({...f.options,disabled:true});oldCheck.onclick();assert(!f.$('.bh-understanding').dataset.bhUnderstandingSolved);
 f.helper.update(f.options);f.helper.open();assert.equal(f.$('.bh-understanding-answer'),input);assert.equal(input.value,'60');
 input.dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.match(f.$('.bh-understanding-feedback').textContent,/Получилось с помощью/);
 assert.equal(f.$('.bh-transfer').dataset.bhTransferSolved,'true');assert.match(f.$('.bh-transfer-history').textContent,/Без намёка/);
 f.helper.update({...f.options,disabled:true});f.helper.update(f.options);assert(oldCheck.disabled);assert(f.$('.bh-understanding-hint').disabled);
 const oldHistory=f.$('.bh-understanding-history'),before=oldHistory.textContent;f.helper.update({...f.options,identity:'another-task'});oldCheck.onclick();assert.equal(oldHistory.textContent,before);assert(!input.isConnected);
});
test('actual prerequisite detour counts as help for unfinished checks, not a mere link offer',t=>{
 const f=mount(t,'percent-part');f.start();f.submit('20');
 const input=f.$('.bh-transfer-answer');input.value='30';assert.match(f.$('.bh-transfer-history').textContent,/Без намёка/);
 f.$('[data-bh-skill="divide"]').click();assert.equal(f.helper.getState().nodeId,'divide');
 f.d.querySelector('.bh-back').click();assert.equal(f.helper.getState().nodeId,'percent-part');assert.equal(f.$('.bh-transfer-answer'),input);assert.equal(input.value,'30');
 assert.match(f.$('.bh-transfer-history').textContent,/Первый ответ: 20\. Попыток: 1\. Разбор простого действия открыт/);
 f.submit('30');assert.match(f.$('.bh-transfer-feedback').textContent,/после разбора простого действия/);assert.doesNotMatch(f.$('.bh-transfer-feedback').textContent,/без намёка/);
 const forwardHistory=f.$('.bh-transfer-history').textContent;f.$('.bh-start-understanding').click();answerUnderstanding(f,18);
 f.$('.bh-understanding-answer').value='60';f.$('[data-bh-skill="divide"]').click();f.d.querySelector('.bh-back').click();
 assert.match(f.$('.bh-understanding-history').textContent,/Первый ответ: 18\. Попыток: 1\. Помощь использована/);
 assert.equal(f.$('.bh-understanding-answer').value,'60');answerUnderstanding(f,60);assert.match(f.$('.bh-understanding-feedback').textContent,/Получилось с помощью/);
 assert.equal(f.$('.bh-transfer-history').textContent,forwardHistory);assert.deepEqual(f.events,['hint']);
});
test('retained transfer and understanding actions cannot mutate a closed panel or detoured frame',t=>{
 const f=mount(t,'percent-part'),start=f.$('.bh-start-transfer');
 f.helper.close(false);start.onclick();assert(f.$('.bh-transfer').hidden);
 f.helper.open();start.click();const transferInput=f.$('.bh-transfer-answer');transferInput.value='30';
 const transferCheck=f.$('.bh-transfer-check'),transferHint=f.$('.bh-transfer-hint');
 f.helper.close(false);transferCheck.onclick();transferHint.onclick();
 assert(!f.$('.bh-transfer').dataset.bhTransferSolved);assert.equal(f.$('.bh-transfer-history').textContent,'');assert(f.$('.bh-transfer-hint-text').hidden);
 f.helper.open();assert.equal(transferInput.value,'30');f.$('[data-bh-skill="divide"]').click();
 const transferHistory=f.$('.bh-transfer-history').textContent;transferCheck.onclick();transferHint.onclick();
 assert(!f.$('.bh-transfer').dataset.bhTransferSolved);assert.equal(f.$('.bh-transfer-history').textContent,transferHistory);assert(f.$('.bh-transfer-hint-text').hidden);
 f.d.querySelector('.bh-back').click();transferCheck.click();assert.equal(f.$('.bh-transfer').dataset.bhTransferSolved,'true');
 const startUnderstanding=f.$('.bh-start-understanding');f.helper.close(false);startUnderstanding.onclick();assert(f.$('.bh-understanding').hidden);
 f.helper.open();startUnderstanding.click();const inverseInput=f.$('.bh-understanding-answer');inverseInput.value='60';
 const inverseCheck=f.$('.bh-understanding-check'),inverseHint=f.$('.bh-understanding-hint');
 f.helper.close(false);inverseCheck.onclick();inverseHint.onclick();assert(!f.$('.bh-understanding').dataset.bhUnderstandingSolved);assert.equal(f.$('.bh-understanding-history').textContent,'');assert(f.$('.bh-understanding-hint-text').hidden);
 f.helper.open();assert.equal(inverseInput.value,'60');f.$('[data-bh-skill="divide"]').click();
 const inverseHistory=f.$('.bh-understanding-history').textContent;inverseCheck.onclick();inverseHint.onclick();assert(!f.$('.bh-understanding').dataset.bhUnderstandingSolved);assert.equal(f.$('.bh-understanding-history').textContent,inverseHistory);
 f.d.querySelector('.bh-back').click();assert.equal(inverseInput.value,'60');inverseCheck.click();assert.equal(f.$('.bh-understanding').dataset.bhUnderstandingSolved,'true');
 assert.equal(f.$('.bh-transfer').dataset.bhTransferSolved,'true');assert.match(f.$('.bh-understanding-feedback').textContent,/Получилось с помощью/);
});
