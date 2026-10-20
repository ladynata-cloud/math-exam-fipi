const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');

// This oracle evaluates the original equation, including its denominators.
// It deliberately does not call taskNorm, evalTermsABC or the trainer's solver.
let Q,independentAnswer;
before(async()=>{Q=await import('./oge-algebra-contract.lib.mjs');({answer:independentAnswer}=await import('./oge-algebra-contract.t9.mjs'));});
const rational=v=>v&&typeof v==='object'&&'n'in v?Q.R(v.n,v.d):Q.R(v);
const snapshot=v=>JSON.stringify(v,(_key,value)=>typeof value==='bigint'?String(value):value);
function termAt(t,x){
  if(t.atom)return Q.mul(Q.R(t.sign),termAt(t.atom,x));
  if(t.rat){const den=termsAt(t.rat.bot,x);if(Q.isZero(den))throw Error('outside domain');return Q.mul(Q.R(t.neg?-1:1),Q.div(termsAt(t.rat.top,x),den));}
  if(t.fr)return Q.mul(Q.R(t.fr.neg?-1:1),Q.div(termsAt(t.fr.top,x),Q.R(t.fr.bot)));
  if(t.br)return Q.mul(rational(t.br.k),termsAt(t.br.inner,x));
  if(t.sq){const base=t.sq.rev?Q.sub(rational(t.sq.s),x):Q.add(x,rational(t.sq.s));return Q.mul(base,base);}
  if(t.mul)return Q.mul(termsAt(t.mul[0],x),termsAt(t.mul[1],x));
  return Q.mul(rational(t.c),Q.pow(x,t.x||0));
}
function termsAt(ts,x){return ts.reduce((sum,t)=>Q.add(sum,termAt(t,x)),Q.ZERO);}
function quotient(n,d){if(Q.isZero(d))throw Error('outside domain');return Q.div(n,d);}
function originalResidual(t,x){
  const p=t.p;
  switch(t.fam){
    case 'PROP':return Q.sub(quotient(termsAt(p.ln,x),p.ld?termsAt(p.ld,x):Q.ONE),quotient(termsAt(p.rn,x),p.rd?termsAt(p.rd,x):Q.ONE));
    case 'Z':return Q.add(quotient(Q.ONE,Q.add(x,Q.R(p.c1))),quotient(Q.ONE,Q.add(x,Q.R(p.c2))));
    case 'NZ':return quotient(Q.add(Q.add(Q.mul(Q.R(p.qa),Q.mul(x,x)),Q.mul(Q.R(p.qb),x)),Q.R(p.qc)),Q.add(x,Q.R(p.dr)));
    case 'XF':return Q.sub(Q.add(x,quotient(Q.R(p.an),x)),Q.R(p.b));
    case 'S2':return Q.sub(Q.add(quotient(Q.R(p.a),Q.sub(x,Q.R(p.b))),quotient(Q.R(p.c),Q.sub(x,Q.R(p.d)))),Q.R(p.k));
    case 'SB':{const den=Q.sub(x,Q.R(p.k));return Q.add(Q.add(quotient(Q.ONE,Q.mul(den,den)),quotient(Q.R(p.m),den)),Q.R(p.n));}
    default:return Q.sub(termsAt(p.Lt,x),termsAt(p.Rt,x));
  }
}
function domainPoles(t){
  const p=t.p;
  switch(t.fam){
    case 'PROP':return [p.ld,p.rd].filter(Boolean).flatMap(ts=>{const c=termsAt(ts,Q.ZERO),b=Q.sub(termsAt(ts,Q.ONE),c);return Q.isZero(b)?[]:[Q.div(Q.neg(c),b)];});
    case 'Z':return [Q.R(-p.c1),Q.R(-p.c2)];
    case 'NZ':return [Q.R(-p.dr)];
    case 'XF':return [Q.ZERO];
    case 'S2':return [Q.R(p.b),Q.R(p.d)];
    case 'SB':return [Q.R(p.k)];
    default:return [];
  }
}
const poleKey=xs=>[...new Set(Array.from(xs,x=>Q.str(rational(x))))].sort();
function valueOrDomain(f){try{return Q.str(f());}catch(e){if(/outside domain|деление на ноль/.test(e.message))return 'undefined';throw e;}}
const modelResidual=(m,x)=>Q.sub(termsAt(m.terms.filter(t=>t.side==='L'),x),termsAt(m.terms.filter(t=>t.side==='R'),x));
const sourceResidual=(s,x)=>Q.sub(termsAt(s.Lt,x),termsAt(s.Rt,x));
function samplePoints(t){return [Q.R(-17,3),Q.R(-2),Q.R(-1,2),Q.ZERO,Q.R(1,3),Q.ONE,Q.R(2),Q.R(17,5),Q.R(11),...domainPoles(t)];}

async function boot(){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message);});
  const dom=new JSDOM(fs.readFileSync(path.resolve(__dirname,'../trainers/oge-task9-equations.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-task9-equations.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));assert.deepEqual(errors,[]);return dom;
}
function dataset(w){return w.eval(`(()=>{const generated=[];RNG=mkRng(19092026);for(const gid of Object.keys(GENS))for(let i=0;i<25;i++)generated.push(genTask(gid));return {bank:BANK,generated,types:TYPE_IDS,routes:GEN_GROUPS.flatMap(g=>g.items.map(i=>i.gid)),generators:Object.keys(GENS)};})()`);}
function button(node,label){const b=[...node.querySelectorAll('button')].find(n=>n.textContent===label);assert.ok(b,'button '+label);return b;}
function event(w,node,type,extra={}){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,extra);node.dispatchEvent(e);return e;}
function openCard(w,fam='L'){
  const card=w.eval('makeMaraCard(BANK.find(t=>t.fam==='+JSON.stringify(fam)+'),()=>{})');w.document.body.appendChild(card);
  const help=button(card,'Хочешь подсказку?');help.click();return {card,help,panel:card.querySelector('.minimal-hint-panel')};
}
const progress=w=>w.localStorage.getItem('mathExamCourseProgress.v1');

test('initial transfer covers every bank/prototype family and every generator with original residual and domain',async()=>{
  const dom=await boot();try{
    const w=dom.window,data=dataset(w),sourceOf=w.eval('taskTransferSource'),create=w.eval('createTransferState'),stepsOf=w.eval('taskSteps');
    assert.equal(data.bank.length,135);assert.equal(data.bank.filter(t=>t.src==='proto').length,105);
    assert.equal(data.generators.length,15);assert.equal(data.routes.length,14);
    assert.deepEqual([...new Set([...data.bank,...data.generated].map(t=>t.fam))].sort(),Array.from(data.types).sort());
    assert.deepEqual([...new Set(data.generated.map(t=>t.fam))].sort(),Array.from(data.types).sort(),'seed reaches all 16 generated families');
    for(const t of [...data.bank,...data.generated]){
      const source=sourceOf(t),model=create(source),label=t.id||t.gid+' '+t.fam;
      const initialHelp=stepsOf(t)[0]({}).transfer;
      assert.equal(snapshot({Lt:initialHelp.Lt,Rt:initialHelp.Rt}),snapshot({Lt:source.Lt,Rt:source.Rt}),label+' first help uses the original terms');
      assert.deepEqual(poleKey(source.exclusions),poleKey(domainPoles(t)),label+' source domain');
      assert.deepEqual(poleKey(model.exclusions),poleKey(domainPoles(t)),label+' model domain');
      for(const x of samplePoints(t)){
        const expected=valueOrDomain(()=>originalResidual(t,x));
        assert.equal(valueOrDomain(()=>sourceResidual(source,x)),expected,label+' initial source at '+Q.str(x));
        assert.equal(valueOrDomain(()=>modelResidual(model,x)),expected,label+' initial cards at '+Q.str(x));
      }
    }
  }finally{dom.window.close();}
});

test('all initial signed terms move reversibly without changing their contents, source equation or excluded values',async()=>{
  const dom=await boot();try{
    const w=dom.window,data=dataset(w),sourceOf=w.eval('taskTransferSource'),create=w.eval('createTransferState');
    for(const task of [...data.bank,...data.generated]){
      const beforeTask=snapshot(task),source=sourceOf(task),beforeSource=snapshot(source),model=create(source),initial=snapshot(model.terms),poles=snapshot(model.exclusions),points=samplePoints(task);
      const expected=points.map(x=>valueOrDomain(()=>originalResidual(task,x)));
      for(const tm of model.terms){
        const from=tm.side,to=from==='L'?'R':'L',before=snapshot(tm),atom=tm.atom?snapshot(tm.atom):null;
        assert.equal(model.move(tm.id,from),false,'same side is not a move');assert.equal(snapshot(tm),before);
        assert.equal(model.move(tm.id,to),true);
        if(tm.atom){assert.equal(snapshot(tm.atom),atom,'compound contents are not expanded or rewritten');assert.equal(tm.sign,-JSON.parse(before).sign);}
        else assert.equal(Q.str(rational(tm.c)),Q.str(Q.neg(rational(JSON.parse(before).c))));
        points.forEach((x,i)=>assert.equal(valueOrDomain(()=>modelResidual(model,x)),expected[i],task.fam+' after moving at '+Q.str(x)));
        assert.equal(snapshot(model.exclusions),poles);
        assert.equal(model.move(tm.id,from),true);assert.equal(snapshot(tm),before,'reverse restores the exact signed card');
      }
      assert.equal(model.move('missing','L'),false);assert.equal(model.move(model.terms[0].id,'outside'),false);
      assert.equal(snapshot(model.terms),initial);assert.equal(snapshot(source),beforeSource);assert.equal(snapshot(task),beforeTask);
    }
  }finally{dom.window.close();}
});

test('long alternating transfers retain rational signs, quadratic terms and compound structure exactly',async()=>{
  const dom=await boot();try{
    const w=dom.window,data=dataset(w),sourceOf=w.eval('taskTransferSource'),create=w.eval('createTransferState');
    for(const fam of Array.from(data.types)){
      const task=data.bank.find(t=>t.fam===fam),source=sourceOf(task),model=create(source),initial=snapshot(model.terms),points=samplePoints(task),expected=points.map(x=>valueOrDomain(()=>originalResidual(task,x))),moves=[];
      for(let i=0;i<73;i++){const tm=model.terms[(i*7+3)%model.terms.length],from=tm.side;moves.push([tm.id,from]);assert.equal(model.move(tm.id,from==='L'?'R':'L'),true);points.forEach((x,j)=>assert.equal(valueOrDomain(()=>modelResidual(model,x)),expected[j],fam+' move '+i));}
      for(const [id,to] of moves.reverse())assert.equal(model.move(id,to),true);
      assert.equal(snapshot(model.terms),initial,fam+' reversed full sequence');
    }
  }finally{dom.window.close();}
});

test('every family offers its original equation only inside help, without solving or filling an answer',async()=>{
  const dom=await boot();try{
    const w=dom.window,types=Array.from(w.eval('TYPE_IDS'));
    for(const fam of types){
      const card=w.eval('makeMaraCard(BANK.find(t=>t.fam==='+JSON.stringify(fam)+'),()=>{})');w.document.body.appendChild(card);
      const main=card.querySelector('input'),help=button(card,'Хочешь подсказку?'),before=progress(w);main.value='7,5';
      assert.equal(card.querySelector('.transfer-lab'),null,fam+' no model before asking');assert.equal(help.getAttribute('aria-expanded'),'false');
      help.click();const panel=card.querySelector('.minimal-hint-panel'),original=panel.querySelector('.transfer-original');
      assert.ok(original,fam+' original equation present');assert.ok(panel.querySelector('.transfer-lab .transfer-term'),fam+' signed cards present');
      assert.equal(main.value,'7,5');assert.equal(progress(w),before);assert.equal(card.classList.contains('solved'),false);
      button(panel,'Вернуться к задаче').click();assert.equal(panel.hidden,true);assert.equal(w.document.activeElement,main);
      help.click();assert.equal(panel.hidden,false);assert.equal(panel.querySelector('.transfer-original'),original);assert.equal(main.value,'7,5');card.remove();
    }
    assert.equal(w.document.querySelectorAll('#pane-quiz .transfer-lab').length,0,'exam has no help model');
  }finally{dom.window.close();}
});

test('compound cards preserve stacked fractions, brackets and squares across click, cancelled drag and touch preview',async()=>{
  const dom=await boot();try{
    const w=dom.window;
    for(const fam of ['LB','LF','LSQ','QNB','QP','PROP','NZ','XF','S2','SB']){
      const {card,panel}=openCard(w,fam),lab=panel.querySelector('.transfer-lab'),chips=[...lab.querySelectorAll('.transfer-term')],before=progress(w);
      const chip=chips.find(b=>/\(|²|x2/.test(b.textContent)||b.querySelector('.frac'))||chips[0],id=chip.dataset.termId,from=chip.closest('.transfer-side').dataset.side,original=chip.innerHTML;
      const current=()=>lab.querySelector('[data-term-id="'+id+'"]');
      if(['LF','PROP','NZ','XF','S2','SB'].includes(fam))assert.ok(lab.querySelector('.frac'),fam+' visible stacked fraction');
      if(['LB','LSQ','QP'].includes(fam))assert.match(lab.textContent,/\(/,fam+' original brackets');
      if(['LSQ','QNB','SB'].includes(fam))assert.match(lab.textContent,/²/,fam+' original square');
      event(w,chip,'dragstart',{dataTransfer:{setData(){}}});event(w,chip,'dragend');assert.equal(current().innerHTML,original);
      const clock=w.Date.now()+1000;w.Date.now=()=>clock;current().click();assert.notEqual(current().closest('.transfer-side').dataset.side,from);
      current().click();assert.equal(current().innerHTML,original,'whole card restored');assert.equal(progress(w),before);
      const zones=Array.from(lab.querySelectorAll('.transfer-side'));
      zones.forEach(z=>{const left=z.dataset.side==='L'?0:120;z.getBoundingClientRect=()=>({left,right:left+100,top:0,bottom:100});});
      const b=current(),start=from==='L'?20:140,end=from==='L'?140:20;
      event(w,b,'pointerdown',{pointerType:'touch',pointerId:7,clientX:start,clientY:20});event(w,b,'pointermove',{pointerType:'touch',pointerId:7,clientX:end,clientY:20});
      const ghost=lab.querySelector('.transfer-ghost');assert.ok(ghost);assert.notEqual(ghost.querySelector('.transfer-sign').textContent,b.querySelector('.transfer-sign').textContent,'preview changes only the outside sign');
      assert.equal(ghost.querySelectorAll('.frac').length,b.querySelectorAll('.frac').length,'preview retains every fraction bar');
      event(w,b,'pointercancel',{pointerId:7});assert.equal(current().innerHTML,original);assert.equal(lab.querySelector('.transfer-ghost'),null);card.remove();
    }
  }finally{dom.window.close();}
});

test('moving a rational term keeps fraction bars in the notice and separates numerator from denominator for assistive text',async()=>{
  const dom=await boot();try{
    const w=dom.window,{panel}=openCard(w,'Z'),lab=panel.querySelector('.transfer-lab'),chip=lab.querySelector('.transfer-term');
    assert.equal(chip.getAttribute('aria-label'),'Слагаемое +(1)/(x + 7). Перенести вправо');chip.click();
    const notice=lab.querySelector('.transfer-next[aria-live="polite"]');assert.equal(notice.querySelectorAll('.frac').length,2,'both old and new expressions retain a visible fraction bar');
    assert.match(notice.getAttribute('aria-label'),/\+\(1\)\/\(x \+ 7\).*−\(1\)\/\(x \+ 7\)/);
    const simple=openCard(w,'L').panel.querySelector('.transfer-term');assert.equal(simple.getAttribute('aria-label'),'Слагаемое +4x. Перенести вправо');
  }finally{dom.window.close();}
});

test('accepted step keeps cards usable while locking graded fields and counts later exploration as help for an unfinished task',async()=>{
  const dom=await boot();try{
    const w=dom.window,{card,panel}=openCard(w),step=panel.querySelector('.step.active'),lab=step.querySelector('.transfer-lab'),fields=[...step.querySelectorAll('.canon-fields input')],before=progress(w);
    assert.equal(w.eval('maraRec(BANK[0].id).hinted'),false);fields[0].value='2';fields[1].value='20';button(step,'Проверить').click();
    assert.equal(step.classList.contains('done'),true);assert.ok(fields.every(n=>n.disabled));assert.ok(lab.querySelector('.transfer-term:not([disabled])'));
    lab.querySelector('.transfer-term').click();assert.equal(w.eval('maraRec(BANK[0].id).hinted'),true);assert.equal(progress(w),before);assert.equal(card.classList.contains('solved'),false);
    assert.ok([...lab.querySelectorAll('button')].filter(b=>/Перейти/.test(b.textContent)).every(b=>b.hidden||b.disabled),'no focus link to locked fields');
    const last=panel.querySelector('.step.active');last.querySelector('input').value='10';button(last,'Проверить').click();
    assert.equal(w.eval('maraState.solved.has(BANK[0].id)'),true);assert.equal(w.eval('maraState.clean.has(BANK[0].id)'),false);
  }finally{dom.window.close();}
});

test('exploration after a clean final answer cannot retroactively change achievement or award progress twice',async()=>{
  const dom=await boot();try{
    const w=dom.window,{card,panel}=openCard(w),main=card.querySelector('input');main.value='10';button(card,'Проверить').click();
    assert.equal(w.eval('maraState.clean.has(BANK[0].id)'),true);const awarded=progress(w),record=snapshot(w.eval('maraRec(BANK[0].id)'));
    const chip=panel.querySelector('.transfer-lab .transfer-term'),id=chip.dataset.termId,lab=chip.closest('.transfer-lab'),from=chip.closest('.transfer-side').dataset.side;chip.click();
    assert.notEqual(lab.querySelector('[data-term-id="'+id+'"]').closest('.transfer-side').dataset.side,from);
    assert.equal(w.eval('maraState.clean.has(BANK[0].id)'),true);assert.equal(progress(w),awarded);assert.equal(snapshot(w.eval('maraRec(BANK[0].id)')),record,'completed result has no retroactive assistance mutation');
    button(card,'Проверить').click();assert.equal(progress(w),awarded);
  }finally{dom.window.close();}
});

for(const helpAlreadyOpen of [false,true])test('bank final answer seals graders but keeps cards usable when help '+(helpAlreadyOpen?'was already open':'is first opened afterwards'),async()=>{
  const dom=await boot();try{
    const w=dom.window,card=w.eval('makeMaraCard(BANK[0],()=>{})');w.document.body.appendChild(card);
    const main=card.querySelector('input'),help=button(card,'Хочешь подсказку?');let draftField;
    if(helpAlreadyOpen){help.click();draftField=card.querySelector('.canon-fields input');draftField.value='-19';}
    main.value='10';button(card,'Проверить').click();const awarded=progress(w),record=snapshot(w.eval('maraRec(BANK[0].id)'));
    if(!helpAlreadyOpen)help.click();
    const panel=card.querySelector('.minimal-hint-panel'),step=panel.querySelector('.step'),fields=[...step.querySelectorAll('.canon-fields input')],lab=step.querySelector('.transfer-lab');
    assert.equal(fields.length,2);assert.ok(fields.every(n=>n.disabled),'terminal coefficient fields are sealed');assert.equal(panel.querySelector('.step.active'),null,'completed task does not present an active grading step');
    for(const label of ['Проверить','Подсказка','Показать шаг'])assert.equal(button(step,label).disabled,true,label+' is sealed');
    if(helpAlreadyOpen){assert.equal(fields[0],draftField);assert.equal(draftField.value,'-19','existing coefficient draft survives sealing');}
    const chip=lab.querySelector('.transfer-term'),id=chip.dataset.termId,from=chip.closest('.transfer-side').dataset.side;assert.equal(chip.disabled,false);chip.click();
    assert.notEqual(lab.querySelector('[data-term-id="'+id+'"]').closest('.transfer-side').dataset.side,from);assert.equal(progress(w),awarded);assert.equal(snapshot(w.eval('maraRec(BANK[0].id)')),record);assert.equal(w.eval('maraState.clean.has(BANK[0].id)'),true);
    assert.equal(panel.querySelectorAll('.step').length,1,'exploration does not append another grading step');
  }finally{dom.window.close();}
});

test('all 14 visible generator routes start with an answer and optional same-page help that preserves the draft',async()=>{
  const dom=await boot();try{
    const w=dom.window,items=w.eval('GEN_GROUPS.flatMap(g=>g.items)'),render=w.eval('renderGenTask');assert.equal(items.length,14);
    for(const item of items){
      const card=w.document.createElement('div');w.document.body.appendChild(card);render(item,card);
      const main=card.querySelector('.generated-answer'),help=card.querySelector('.generated-help-toggle'),panel=card.querySelector('.generated-help'),before=progress(w);
      assert.ok(main,item.gid+' final answer field');assert.equal(panel.hidden,true);assert.equal(help.getAttribute('aria-expanded'),'false');assert.equal(panel.querySelector('.transfer-lab'),null);
      main.value='13,5';help.click();assert.equal(panel.hidden,false);const lab=panel.querySelector('.transfer-lab');assert.ok(lab,item.gid+' model mounted');assert.ok(panel.querySelector('.transfer-original'));
      assert.equal(progress(w),before);assert.equal(card.dataset.completed,'false');assert.equal(main.value,'13,5');
      button(panel,'Вернуться к задаче').click();assert.equal(panel.hidden,true);assert.equal(w.document.activeElement,main);help.click();assert.equal(panel.querySelector('.transfer-lab'),lab);assert.equal(main.value,'13,5');
      card.querySelector('.generated-next').click();assert.equal(card.querySelector('.generated-help').hidden,true);assert.equal(card.querySelector('.generated-answer').value,'');assert.equal(card.querySelector('.transfer-lab'),null);card.remove();
    }
  }finally{dom.window.close();}
});

test('quadratic method switches retain model and coefficient drafts, and cannot erase a shown step to earn progress',async()=>{
  const dom=await boot();try{
    const w=dom.window,task=w.eval("(()=>{RNG=mkRng(1);const t=genTask('g_qf');RNG=mkRng(1);return t;})()"),answer=independentAnswer(task);
    assert.equal(Q.str(rational(task.p.Lt[0].c)),'1','deterministic fixture supports both methods');assert.ok(!answer.bad);
    const card=w.document.createElement('div');w.document.body.appendChild(card);w.eval('renderGenTask')({gid:'g_qf',method:true},card);
    const before=progress(w);card.querySelector('.generated-help-toggle').click();const panel=card.querySelector('.generated-help'),disc=panel.querySelector('.generated-method[data-method="discriminant"]'),fields=disc.querySelectorAll('.step.active input'),lab=disc.querySelector('.transfer-lab');
    fields[0].value='-31';const chip=lab.querySelector('.transfer-term'),id=chip.dataset.termId;chip.click();const moved=lab.querySelector('[data-term-id="'+id+'"]'),side=moved.closest('.transfer-side').dataset.side;
    button(panel,'По Виета').click();assert.equal(disc.hidden,true);button(panel,'Дискриминант').click();assert.equal(disc.hidden,false);assert.equal(fields[0].value,'-31');assert.equal(lab.querySelector('[data-term-id="'+id+'"]'),moved);assert.equal(moved.closest('.transfer-side').dataset.side,side);assert.equal(progress(w),before);
    button(disc.querySelector('.step.active'),'Показать шаг').click();button(panel,'По Виета').click();button(panel,'Дискриминант').click();assert.ok(disc.querySelector('.step.shown'));
    const main=card.querySelector('.generated-answer');main.value=Q.str(answer.key);card.querySelector('.generated-check').click();
    assert.equal(card.dataset.completed,'true');assert.match(card.querySelector('.generated-feedback').textContent,/показанные шаги/);assert.equal(progress(w),before,'show provenance survives method changes and prevents a solved award');
  }finally{dom.window.close();}
});
