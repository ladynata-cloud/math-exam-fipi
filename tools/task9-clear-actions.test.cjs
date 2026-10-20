const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
async function boot(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync(path.resolve(__dirname,'../trainers/oge-task9-equations.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-task9-equations.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));assert.deepEqual(errors,[]);return dom;
}
function setup(w){const d=w.document,card=d.querySelector('#mara-list>.task-card:not([hidden])');const help=[...card.querySelectorAll('button')].find(b=>b.textContent==='Хочешь подсказку?');help.click();const panel=card.querySelector('.minimal-hint-panel'),step=panel.querySelector('.step.active'),lab=step.querySelector('.transfer-lab');return {card,help,panel,step,lab,term:id=>lab.querySelector('[data-term-id="'+id+'"]'),zone:side=>lab.querySelector('[data-side="'+side+'"]')};}
function event(w,node,type,extra={}){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,extra);node.dispatchEvent(e);return e;}
function drag(w,t,id,side){const b=t.term(id);event(w,b,'dragstart',{dataTransfer:{setData(){}}});event(w,t.zone(side),'drop',{dataTransfer:{getData(){return id}}});event(w,b,'dragend');}
function side(t,id){return t.term(id).closest('.transfer-side').dataset.side;}
function progress(w){return w.localStorage.getItem('mathExamCourseProgress.v1');}

test('task9 exact transfers preserve residual, flip only across equality and reverse exactly',async()=>{
 const dom=await boot();try{const w=dom.window;
 const result=w.eval(`(()=>{const source={Lt:[T(F(3,7),1),T(F(-5,11))],Rt:[T(F(8,9)),T(F(-2,3),1)]};const m=createTransferState(source);const residual=()=>{const L=evalTermsABC(m.terms.filter(t=>t.side==='L')),R=evalTermsABC(m.terms.filter(t=>t.side==='R'));return [valStr(fsub(L.B,R.B)),valStr(fsub(L.C,R.C))].join('|');};const start=residual(),snapshot=m.terms.map(t=>t.side+valStr(t.c)).join('|');let checks=0;for(let i=0;i<250;i++){const tm=m.terms[i%m.terms.length],from=tm.side,to=from==='L'?'R':'L',c=tm.c;if(m.move(tm.id,from)!==false)throw Error('same side changed');if(!m.move(tm.id,to)||!feq(tm.c,fneg(c))||residual()!==start)throw Error('invalid transfer');if(!m.move(tm.id,from)||!feq(tm.c,c)||residual()!==start)throw Error('invalid reverse');checks++;}if(m.move('missing','L')||m.move('0','outside'))throw Error('invalid destination');return {checks,unchanged:snapshot===m.terms.map(t=>t.side+valStr(t.c)).join('|'),source:valStr(source.Lt[0].c)};})()`);
 assert.equal(result.checks,250);assert.equal(result.unchanged,true);assert.equal(result.source,'3/7');
 }finally{dom.window.close()}
});

test('task9 current equation has signed draggable terms and clearly labelled empty fields',async()=>{
 const dom=await boot();try{const w=dom.window,t=setup(w);assert.equal(t.lab.querySelectorAll('button.transfer-term[draggable="true"]').length,4);assert.match(t.term('0').textContent,/4x/);assert.match(t.term('1').textContent,/−.*4/);assert.match(t.term('2').textContent,/\+.*16/);assert.match(t.term('3').textContent,/\+.*2x/);const fields=[...t.step.querySelectorAll('.canon-fields input')];assert.equal(fields.length,2);assert.deepEqual(fields.map(n=>n.value),['','']);assert.match(fields[0].getAttribute('aria-label'),/перед x/);assert.match(fields[1].getAttribute('aria-label'),/справа/);assert.equal(t.card.querySelector('input').value,'');assert.equal(t.card.querySelector('input').getAttribute('aria-label'),'Чему равен x?');assert.equal(t.step.querySelector('.transfer-lab').textContent.includes('x = 10'),false);
 }finally{dom.window.close()}
});

test('task9 native drag permits both directions, rejects same-side and cancellation without auto-award',async()=>{
 const dom=await boot();try{const w=dom.window,t=setup(w),before=progress(w),b=t.term('1'),original=b.textContent;
 event(w,b,'dragstart',{dataTransfer:{setData(){}}});event(w,b,'dragend');assert.equal(side(t,'1'),'L');assert.equal(t.term('1').textContent,original);
 drag(w,t,'1','L');assert.equal(t.term('1').textContent,original);assert.equal(w.eval('maraRec(BANK[0].id).hinted'),false);
 drag(w,t,'1','R');assert.equal(side(t,'1'),'R');assert.match(t.term('1').textContent,/\+.*4/);assert.equal(w.eval('maraRec(BANK[0].id).hinted'),true);
 drag(w,t,'1','L');assert.equal(t.term('1').textContent,original);drag(w,t,'3','L');assert.match(t.term('3').textContent,/−.*2x/);drag(w,t,'3','R');assert.match(t.term('3').textContent,/\+.*2x/);
 assert.equal(progress(w),before);assert.equal(t.panel.querySelectorAll('.step').length,1);assert.equal(t.card.classList.contains('solved'),false);assert.deepEqual([...t.step.querySelectorAll('.canon-fields input')].map(n=>n.value),['','']);
 }finally{dom.window.close()}
});

test('task9 touch preview flips sign, outside and pointercancel do not commit, tap and keyboard work',async()=>{
 const dom=await boot();try{const w=dom.window,t=setup(w);const rects=()=>{t.zone('L').getBoundingClientRect=()=>({left:0,right:100,top:0,bottom:100});t.zone('R').getBoundingClientRect=()=>({left:120,right:220,top:0,bottom:100});};rects();
 let b=t.term('1');event(w,b,'pointerdown',{pointerType:'touch',pointerId:1,clientX:30,clientY:30});event(w,b,'pointermove',{pointerType:'touch',pointerId:1,clientX:150,clientY:30});assert.match(t.lab.querySelector('.transfer-ghost').textContent,/\+.*4/);event(w,b,'pointercancel',{pointerId:1});assert.equal(side(t,'1'),'L');assert.equal(t.lab.querySelector('.transfer-ghost'),null);
 w.Date.now=()=>1000;b=t.term('1');event(w,b,'pointerdown',{pointerType:'touch',pointerId:2,clientX:30,clientY:30});event(w,b,'pointermove',{pointerType:'touch',pointerId:2,clientX:150,clientY:30});event(w,b,'pointerup',{pointerType:'touch',pointerId:2,clientX:300,clientY:30});assert.equal(side(t,'1'),'L');
 b=t.term('1');event(w,b,'pointerdown',{pointerType:'touch',pointerId:3,clientX:30,clientY:30});event(w,b,'pointermove',{pointerType:'touch',pointerId:3,clientX:150,clientY:30});event(w,b,'pointerup',{pointerType:'touch',pointerId:3,clientX:150,clientY:30});assert.equal(side(t,'1'),'R');t.term('1').click();assert.equal(side(t,'1'),'R','synthetic click following drag does not reverse it');
 event(w,t.term('1'),'keydown',{key:'ArrowLeft'});assert.equal(side(t,'1'),'L');assert.match(t.term('1').textContent,/−.*4/);w.Date.now=()=>2000;t.term('1').click();assert.equal(side(t,'1'),'R');assert.equal(w.document.activeElement,t.term('1'));
 }finally{dom.window.close()}
});

test('task9 explicit return and help reopen preserve terms, entered coefficients and main answer',async()=>{
 const dom=await boot();try{const w=dom.window,t=setup(w),main=t.card.querySelector('input');main.value='7,5';const fields=t.step.querySelectorAll('.canon-fields input');fields[0].value='23';fields[1].value='41';t.term('1').click();const moved=t.term('1'),board=t.lab.querySelector('.transfer-board');
 [...t.panel.querySelectorAll('button')].find(b=>b.textContent==='Вернуться к задаче').click();assert.equal(t.panel.hidden,true);assert.equal(w.document.activeElement,main);t.help.click();assert.equal(t.panel.hidden,false);assert.equal(t.lab.querySelector('.transfer-board'),board);assert.equal(t.term('1'),moved);assert.equal(side(t,'1'),'R');assert.deepEqual([...fields].map(n=>n.value),['23','41']);assert.equal(main.value,'7,5');
 t.help.click();t.help.click();assert.equal(side(t,'1'),'R');assert.equal(main.value,'7,5');
 }finally{dom.window.close()}
});

test('task9 sorting guides combination without filling answers; grading and assistance remain separate',async()=>{
 const dom=await boot();try{const w=dom.window,t=setup(w),before=progress(w);t.term('1').click();t.term('3').click();assert.match(t.lab.textContent,/Слагаемые на своих местах/);const fields=t.step.querySelectorAll('.canon-fields input');[...t.lab.querySelectorAll('button')].find(b=>b.textContent==='Перейти к сложению').click();assert.equal(w.document.activeElement,fields[0]);assert.equal(fields[0].value,'');assert.equal(progress(w),before);
 fields[0].value='2';fields[1].value='20';[...t.step.querySelectorAll('button')].find(b=>b.textContent==='Проверить').click();assert.equal(t.step.classList.contains('done'),true);assert.equal(t.lab.querySelectorAll('.transfer-term:not([disabled])').length,0);assert.equal(t.panel.querySelectorAll('.step').length,2);assert.equal(progress(w),before);
 const last=t.panel.querySelector('.step.active');last.querySelector('input').value='10';[...last.querySelectorAll('button')].find(b=>b.textContent==='Проверить').click();assert.equal(w.eval('maraRec(BANK[0].id).hinted'),true);assert.equal(w.eval('maraState.clean.has(BANK[0].id)'),false);assert.equal(w.eval('maraState.solved.has(BANK[0].id)'),true);const awarded=progress(w);t.card.querySelector('input').value='10';[...t.card.querySelectorAll('button')].find(b=>b.textContent==='Проверить').click();assert.equal(progress(w),awarded,'final check cannot award twice');
 }finally{dom.window.close()}
});

test('task9 all linear families mount equivalent transfer equations after prerequisite steps; exam stays without help',async()=>{
 const dom=await boot();try{const w=dom.window;
 const result=w.eval(`(()=>{let checked=0;for(const t of BANK.filter(t=>['L','LB','LF','LSQ','PROP'].includes(t.fam))){const st={};for(const factory of taskSteps(t)){const def=factory(st);if(def.transfer){const L=evalTermsABC(def.transfer.Lt),R=evalTermsABC(def.transfer.Rt),d={A:fsub(L.A,R.A),B:fsub(L.B,R.B),C:fsub(L.C,R.C)},root=taskSolve(t).roots[0];if(!fzero(d.A)||fzero(d.B)||!feq(fdiv(fneg(d.C),d.B),root))throw Error(t.id+' transfer equation changed');createTransferState(def.transfer);checked++;}const r=def.check(def.reveal.vals,st);if(!r.ok)throw Error(t.id+' step reveal failed');}}return checked;})()`);assert.ok(result>30,result+' canonical bank steps checked');assert.equal(w.document.querySelectorAll('#pane-quiz .transfer-lab').length,0);
 }finally{dom.window.close()}
});


test('task9 accepted alternative intermediate LF equation is retained in its transfer model',async()=>{
 const dom=await boot();try{const w=dom.window;
 const valid=w.eval(`(()=>{const t=BANK.find(t=>t.fam==='LF'),root=taskSolve(t).roots[0],st={},steps=taskSteps(t);let def=steps[0](st);if(!def.check([String(2*lcmArr(t.p.dens))],st).ok)return false;def=steps[1](st);const value=fmul(F(7),root);if(!def.check(['7x='+valStr(value)],st).ok)return false;const source=steps[2](st).transfer,L=evalTermsABC(source.Lt),R=evalTermsABC(source.Rt);return feq(L.B,F(7))&&fzero(L.C)&&fzero(R.B)&&feq(R.C,value);})()`);assert.equal(valid,true);
 }finally{dom.window.close()}
});
