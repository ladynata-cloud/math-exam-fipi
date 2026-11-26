'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const m=require('../../equations/linear-pilot/fraction-bridge-core.js'),prep=require('../../learning/preparation-map.js');
const root=path.resolve(__dirname,'../..'),p=m.pairs[0],id=p.id;
const ev=(type,extra={},pair=id)=>({type,pair,...extra});
const ans=(type,value,external=false,pair=id)=>ev(type,{value,external},pair);
const wrong=[ans('original-answer',7)];
test('eight unique original and word-transfer conditions, independently checked keys',()=>{
 assert.equal(m.pairs.length,8);
 const expectedOriginal=[20,18,25,16,30,42,24,45],expectedTransfer=[21,20,32,42,22,36,56,21];
 assert.deepEqual(m.pairs.map(p=>p.original.answer),expectedOriginal);
 assert.deepEqual(m.pairs.map(p=>p.transfer.answer),expectedTransfer);
 assert.equal(new Set(m.pairs.flatMap(p=>[p.original.equation,p.transfer.equation])).size,16);
 for(const pair of m.pairs){
   for(const q of [pair.original,pair.transfer]){assert.equal(q.answer/q.d+q.b,q.c);assert(q.d>1&&q.c>q.b);}
   assert.notEqual(pair.original.answer,pair.transfer.answer);
   assert.notEqual(pair.original.d,pair.transfer.d);assert.notEqual(pair.original.b,pair.transfer.b);assert.notEqual(pair.original.c,pair.transfer.c);
   const probe=m.probeFor(pair.id,'whole');assert.equal(probe.answer,probe.parts*probe.part);assert.notEqual(probe.answer,pair.original.answer);
   assert.equal(m.probeFor(pair.id,'balance').options.filter(x=>x.id==='both').length,1);
 }
 assert.throws(()=>{m.pairs[0].original.answer=99;},TypeError);
});
test('no hints or transfer before attempt; wrong answer, probe, resource and exact return',()=>{
 for(const event of [ev('open-probe',{probe:'whole'}),ev('reveal'),ev('transfer')])assert.throws(()=>m.replay([event]));
 const sequence=[...wrong,ev('open-probe',{probe:'whole'}),ev('probe-answer',{probe:'whole',value:'?'}),ev('resource',{probe:'whole',id:'oge-basics:fraction-meaning'}),ev('return')];
 const s=m.replay(sequence);assert.equal(s.phase,'original');assert.equal(m.current(s).id,id);assert.equal(s.round.attempts[0].value,7);
 assert.deepEqual(s.round.helps,['probe:whole','resource:oge-basics:fraction-meaning']);
 assert.throws(()=>m.replay([...sequence,ev('open-probe',{probe:'whole'}),ev('probe-answer',{probe:'whole',value:22})]));
 assert.throws(()=>m.replay([...wrong,ev('open-probe',{probe:'whole'}),ev('resource',{probe:'whole',id:'https://outside.invalid/'})]));
 const corrected=m.replay([...sequence,ans('original-answer',20)]);assert.equal(m.originalOutcome(corrected),'correct-after-retry-with-help');assert.equal(corrected.round.attempts[1].assisted,true);
 assert.equal(m.originalOutcome(m.replay([ans('original-answer',20,true)])),'correct-with-help');
 assert.equal(m.originalOutcome(m.replay([ans('original-answer',20)])),'first-correct');
 assert.equal(m.originalOutcome(m.replay([...wrong,ans('original-answer',20)])),'correct-after-retry');
 const earlierHelp=m.replay([ans('original-answer',7,true),ans('original-answer',20,false)]);
 assert.equal(earlierHelp.round.attempts[1].assisted,true);
 assert.equal(m.originalOutcome(earlierHelp),'correct-after-retry-with-help');
 const laterHelp=m.replay([...wrong,ans('original-answer',20,true)]);
 assert.equal(m.originalOutcome(laterHelp),'correct-after-retry-with-help');
 const completed=m.replay([ans('original-answer',7,true),ans('original-answer',20,false),ev('transfer'),ans('transfer-answer',21),ev('next')]);
 assert.equal(completed.completed[0].original,'correct-after-retry-with-help');
 assert.equal(completed.completed[0].transfer,'first-correct');
});
test('transfer has no inherited help flag, declared help remains distinct, one submission only',()=>{
 const base=[...wrong,ev('reveal'),ev('transfer')];assert.equal(m.originalOutcome(m.replay(base)),'worked-example');
 const correct=[...base,ans('transfer-answer',21)];const s=m.replay(correct);assert.equal(s.phase,'result');assert.equal(m.transferOutcome(s.round.transfer),'first-correct');
 assert.throws(()=>m.replay([...correct,ans('transfer-answer',21)]));
 assert.equal(m.transferOutcome(m.replay([...base,ans('transfer-answer',21,true)]).round.transfer),'correct-with-help');
 assert.equal(m.transferOutcome(m.replay([...base,ans('transfer-answer','?')]).round.transfer),'not-answered');
 assert.equal(m.transferOutcome(m.replay([...base,ans('transfer-answer',1)]).round.transfer),'not-correct');
 assert.throws(()=>m.replay([...base,ev('open-probe',{probe:'whole'})]));
 assert.equal(m.replay([...correct,ev('next')]).index,1);
});
test('bounded data contract, immutable attempts, no private text, no fabricated mastery',()=>{
 for(const [raw,expected] of [['20',20],['20,0',20],['−4',-4],['?', '?'],['',null],['1.5',null],['1e3',null],['NaN',null],['1/2',null]])assert.equal(m.parseAnswer(raw),expected);
 assert.throws(()=>m.replay(Array(1)));assert.throws(()=>m.replay([ans('original-answer',true)]));
 assert.throws(()=>m.replay([ev('original-answer',{value:1,external:false,secret:'unexpected'})]));
 assert.throws(()=>m.replay([ans('original-answer',1,false,'stale-pair')]));
 const drafts={[m.draftKey(id,'original')]:{value:'19',external:false}};
 const snap=m.snapshot(wrong,drafts);assert.deepEqual(m.decode(JSON.stringify(snap)),snap);
 assert.throws(()=>m.decode('{"version":2,"events":[],"drafts":{}}'));
 assert.throws(()=>m.snapshot([],{'other:private':{value:'1',external:false}}));
 assert.throws(()=>m.snapshot([],{[m.draftKey(id,'original')]:{value:'personal name',external:false}}));
 const attempts=Array.from({length:m.MAX_ATTEMPTS},()=>ans('original-answer',1));
 assert.throws(()=>m.replay([...attempts,ans('original-answer',20)]));
 const events=m.pairs.flatMap(x=>[ans('original-answer',x.original.answer,false,x.id),ev('transfer',{},x.id),ans('transfer-answer',x.transfer.answer,false,x.id),ev('next',{},x.id)]);
 const done=m.replay(events);assert.equal(done.phase,'done');assert.equal(done.completed.length,8);
 assert(done.completed.every(x=>x.original==='first-correct'&&x.transfer==='first-correct'));
 assert.throws(()=>m.replay([...events,ev('next',{},m.pairs.at(-1).id)]));
});
test('reuse existing public resources, not a second catalog or old learner storage',()=>{
 for(const item of Object.values(m.resources).flat()){
  const u=new URL(item.href,'https://mathexam.space');assert.equal(u.origin,'https://mathexam.space');
  assert(!u.pathname.startsWith('/learning/'));
  const file=path.join(root,u.pathname.slice(1));assert(fs.statSync(file).isFile());
  if(item.id.startsWith('arzhenikov:')){
   assert(fs.readFileSync(path.join(root,'trainers/oge-basics/multiplication-division/arzhenikov-course-connections.js'),'utf8').includes("id: 'c-quotient'"));
  }else{const r=prep.get(item.id);assert(r,item.id);assert.equal(r.publicUrl||(r.kind==='public'?r.url:null),item.href);}
 }
 const ui=fs.readFileSync(path.join(root,'equations/linear-pilot/fraction-bridge.js'),'utf8');
 assert(!/\b(?:fetch|XMLHttpRequest|localStorage|postMessage)\s*[.(]/.test(ui));
 assert(ui.includes('sessionStorage'));assert(m.KEY==='mathExam.linearFractionBridge.session.v1');
 const html=fs.readFileSync(path.join(root,'equations/linear-pilot/index.html'),'utf8');
 assert.equal((html.match(/id="fraction-bridge"/g)||[]).length,1);
 assert.equal((html.match(/navigator-widget\.js/g)||[]).length,1);
 assert(html.includes('href="#fraction-bridge"'));
});

test('repeated visits and resource clicks do not exhaust the bounded log or erase learning evidence',()=>{
 const resource=ev('resource',{probe:'whole',id:'oge-basics:fraction-meaning'});
 const open=ev('open-probe',{probe:'whole'}),back=ev('return');
 let log=wrong.slice();
 const add=e=>{const result=m.append(log,e);log=result.events;assert.deepEqual(result.state,m.replay(log));return result.state;};
 add(open);add(ev('probe-answer',{probe:'whole',value:22}));add(resource);add(back);
 const initial=log.slice();
 for(let i=0;i<600;i++){
  add(open);add(resource);add(resource);add(back);
 }
 assert.deepEqual(log,initial,'only genuinely redundant visits/clicks compacted');
 assert.throws(()=>m.append(log,resource),'resource outside probe is still rejected');
 add(open);
 const newResource=ev('resource',{probe:'whole',id:'path:pre7-fraction-part-whole'});
 add(newResource);add(back);
 assert(log.some(e=>e.id===newResource.id));
 assert.throws(()=>m.append(log,ev('probe-answer',{probe:'whole',value:22})));
 const before=m.decode(JSON.stringify(m.snapshot(log,{})));
 assert.deepEqual(before.events,log);
 const solved=add(ans('original-answer',20));
 assert.equal(m.originalOutcome(solved),'correct-after-retry-with-help');
 assert.equal(solved.round.probes.whole.value,22);
 add(ev('transfer'));add(ans('transfer-answer',21));add(ev('next'));
 assert.equal(m.replay(log).completed[0].transfer,'first-correct');
 let later=wrong.slice();
 for(const e of [open,back,open,ev('probe-answer',{probe:'whole',value:22}),back])
  later=m.append(later,e).events;
 assert.equal(m.replay(later).round.probes.whole.correct,true);
 assert(later.some(e=>e.type==='probe-answer'));
});
