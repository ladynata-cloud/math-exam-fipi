/* Isolated, optional section in the accepted linear pilot. */
(function ui(){
  'use strict';
  const m=window.MathExamFractionBridge,panel=document.getElementById('fraction-bridge'),host=document.getElementById('fraction-bridge-app');
  if(!m||!panel||!host)return;
  const storageNote=document.getElementById('fraction-bridge-storage');
  let storageOK=true,snapshot;
  try{snapshot=m.decode(sessionStorage.getItem(m.KEY));}catch(_){storageOK=false;snapshot=m.snapshot([],{});}
  let state=m.replay(snapshot.events),localWarning='';
  const el=(tag,text,attrs={})=>{
    const node=document.createElement(tag);if(text!==undefined)node.textContent=text;
    for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;
  };
  function save(persist=true){
    if(storageOK&&persist)try{sessionStorage.setItem(m.KEY,JSON.stringify(snapshot));}catch(_){storageOK=false;}
    storageNote.textContent=storageOK?'Черновик и попытки сохраняются только в этой вкладке до её закрытия. Это не общий журнал освоения.':'Сохранение в этой вкладке недоступно или запись повреждена. Не закрывайте вкладку, пока решаете; старые записи не перезаписываются.';
  }
  function dispatch(type,extra={},focus=true){
    const p=m.current(state);if(!p)return;
    try{const next=m.append(snapshot.events,{type,pair:p.id,...extra});snapshot=m.snapshot(next.events,snapshot.drafts);state=next.state;localWarning='';save();render(focus);}
    catch(_){localWarning='Не удалось выполнить переход. Оставайтесь на этой задаче; прежние попытки сохранены.';const status=host.querySelector('[data-fb-message]');if(status)status.textContent=localWarning;}
  }
  function button(text,action,secondary=false){
    const b=el('button',text,{type:'button'});if(secondary)b.className='secondary';b.addEventListener('click',action);return b;
  }
  const title=(text)=>el('h3',text,{tabindex:'-1','data-fb-heading':''});
  const para=(text,cls)=>el('p',text,cls?{class:cls}:{});
  const status=()=>el('p',localWarning,{role:'status','aria-live':'polite','data-fb-message':'',class:'fb-message'});
  function solution(eq){const box=el('div',undefined,{class:'fb-solution'});box.append(para('Разбор и проверка:'),...m.solution(eq).map(t=>para(t)));return box;}
  function resourceLinks(kind){
    const list=el('ul',undefined,{class:'fb-links'});
    for(const item of m.resources[kind]){
      const li=el('li'),a=el('a',item.label+' (откроется в новой вкладке)',{href:item.href,target:'_blank',rel:'noopener noreferrer','data-fb-resource':item.id});
      // Opening the probe already registers help. A link click records the
      // resource as well, without replacing this task or navigating it away.
      const record=()=>{const p=m.current(state);if(!p||state.phase!=='probe'||state.round.activeProbe!==kind)return;try{
        const next=m.append(snapshot.events,{type:'resource',pair:p.id,probe:kind,id:item.id});snapshot=m.snapshot(next.events,snapshot.drafts);state=next.state;save();
      }catch(_){localWarning='Ссылку можно открыть; запись об обращении к помощи недоступна.';}};
      a.addEventListener('click',record);a.addEventListener('auxclick',event=>{if(event.button===1)record();});
      li.append(a);list.append(li);
    }
    return list;
  }
  function draftFor(key){return snapshot.drafts[key]||{value:'',external:false};}
  function saveDraft(key,value,external){
    let draft={value,external};
    const valid=m.validDraft(key,draft);
    // Never retain stale input or arbitrary text when the new value is rejected.
    // The separately selected help flag is still part of the allowed v1 draft.
    if(!valid)draft={value:'',external};
    if(!m.validDraft(key,draft))return false;
    snapshot.drafts[key]=draft;save();
    return valid;
  }
  function formFor(p,phase,kind,q){
    const key=m.draftKey(p.id,phase,kind),draft=draftFor(key);
    const form=el('form',undefined,{'data-fb-form':phase,novalidate:''});
    let input,external;
    const label=el('label',kind==='balance'?'Выбери действие':'Ответ числом',{for:'fb-answer'});
    if(kind==='balance'){
      input=el('select',undefined,{id:'fb-answer','aria-describedby':'fb-answer-note'});
      input.append(el('option','Выбери вариант',{value:''}),...q.options.map(o=>el('option',o.label,{value:o.id})));
      input.value=draft.value;
    }else{
      input=el('input',undefined,{id:'fb-answer',type:'text',inputmode:'text',maxlength:'24',autocomplete:'off','aria-describedby':'fb-answer-note'});
      input.value=draft.value;
    }
    form.append(label,input,el('p',kind==='balance'?'Выбери действие или нажми «Пока не знаю».':'Впиши целое число. Можно нажать «Пока не знаю».',{id:'fb-answer-note',class:'muted'}));
    if(phase!=='probe'){
      const row=el('label',undefined,{class:'fb-check'});external=el('input',undefined,{type:'checkbox',id:'fb-external'});external.checked=draft.external;
      row.append(external,el('span','Мне помогали, или я уже видел решение именно этой задачи.'));form.append(row);
    }
    const actions=el('div',undefined,{class:'actions'}),submit=el('button','Проверить ответ',{type:'submit'}),message=status();
    function send(unknown){
      const value=unknown?'?':phase==='probe'?m.parseProbe(input.value,kind):m.parseAnswer(input.value);
      if(value===null){message.textContent='Введи целое число или выбери вариант. Если не знаешь, нажми соответствующую кнопку.';input.setAttribute('aria-invalid','true');input.focus();return;}
      if(phase==='probe')dispatch('probe-answer',{probe:kind,value});
      else dispatch(phase==='transfer'?'transfer-answer':'original-answer',{value,external:!!external?.checked});
    }
    form.addEventListener('submit',event=>{event.preventDefault();send(false);});
    const update=()=>{
      if(!saveDraft(key,input.value,!!external?.checked)){
        message.textContent=storageOK
          ?(external?'Этот текст не сохраняется: после обновления поле будет пустым, отметка помощи сохранится.':'Этот текст не сохраняется: после обновления поле будет пустым.')
          :'Этот текст не записывается; сохранение в этой вкладке недоступно.';
      }
    };
    input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');message.textContent='';update();});
    input.addEventListener('change',update);external?.addEventListener('change',update);
    actions.append(submit,button('Пока не знаю',()=>send(true),true));form.append(actions,message);
    return form;
  }
  function model(q){
    const box=el('div',undefined,{class:'fb-model'}),strip=el('div',undefined,{class:'fb-strip',role:'list','aria-label':'Равные части целого'});
    const report=el('p',undefined,{role:'status','aria-live':'polite'});
    let count=1;
    const add=button('Добавить такую же часть',()=>{if(count<q.parts){count++;draw();}});
    function draw(){
      strip.replaceChildren();
      for(let i=0;i<q.parts;i++)strip.append(el('span',i<count?q.part+' см':'ещё часть',{role:'listitem',class:i<count?'fb-piece filled':'fb-piece'}));
      add.disabled=count===q.parts;
      report.textContent=count===q.parts?'Собрали целое: '+q.parts+' × '+q.part+' = '+q.answer+' см.':'Собрано частей: '+count+' из '+q.parts+'.';
    }
    box.append(para('Собери целое из равных частей. Одна часть уже известна.'),strip,report,add,button('Сначала одну часть',()=>{count=1;draw();},true));draw();return box;
  }
  function outcomeText(code,transfer=false){
    return ({
      'first-correct':transfer?'Числовой ответ верен с первой попытки, помощь не отмечена.':'Числовой ответ верен с первой попытки, помощь не отмечена.',
      'correct-with-help':'Числовой ответ верен; помощь или знакомый разбор отмечены.',
      'correct-after-retry':'Числовой ответ верен после исправления, помощь не отмечена. Первая попытка сохранена.',
      'correct-after-retry-with-help':'Числовой ответ верен после исправления с отмеченной помощью. Первая попытка сохранена.',
      'worked-example':'Просмотрен разбор исходной задачи. Это не самостоятельное решение.',
      'not-answered':'Ответ не дан — результат не установлен.',
      'not-correct':'Числовой ответ не совпал. Это не диагноз пробела.',
      'not-checked':'Проверка ещё не выполнена.'
    })[code]||'Результат не установлен.';
  }
  function render(focus=false){
    const p=m.current(state),r=state.round;
    host.replaceChildren();host.dataset.phase=state.phase;host.dataset.pair=p?.id||'done';
    host.append(para(p?'Пара '+(state.index+1)+' из '+m.pairs.length+' · Дроби → равенство → уравнение → перенос':'Все '+m.pairs.length+' пар просмотрены','fb-eyebrow'));
    if(state.phase==='done'){
      host.append(title('Этот набор закончен'),para('Ни один результат не является подтверждением освоения. Если возвращаешься к известным условиям, это повторение.'));
      const list=el('ol',undefined,{class:'fb-history'});
      for(const [i,item] of state.completed.entries()){
        const li=el('li',undefined);li.append(el('strong','Пара '+(i+1)),para('Уравнение: '+outcomeText(item.original)),para('Перенос: '+outcomeText(item.transfer,true)));list.append(li);
      }
      host.append(list,para('Продолжи действующий курс уравнений выше или открой упражнения на дроби.'));return;
    }
    if(state.phase==='original'){
      host.append(title('Исходная задача'),para('Реши на бумаге. Запиши хотя бы одно преобразование и проверь подстановкой. Программа проверяет число, а не доказательство.'),el('p',p.original.equation,{class:'fb-equation','data-fb-original':''}));
      if(r.attempts.length){
        const last=r.attempts.at(-1);
        host.append(para('Первая запись: '+String(r.attempts[0].value)+'. Попыток: '+r.attempts.length+'.','muted'));
        if(!last.correct&&!r.revealed)host.append(para(last.value==='?'?'Ты пока не дал ответ. Можно выбрать, какой шаг проверить.':'Ответ '+last.value+' не подходит. Причина пока неизвестна. Можно проверить один из возможных шагов.','fb-feedback'));
      }
      if(m.solved(state)||r.revealed){
        host.append(para(outcomeText(m.originalOutcome(state)),'fb-feedback'),solution(p.original));
        host.append(button('Новая текстовая задача на перенос',()=>dispatch('transfer')));
      }else{
        if(r.attempts.length<m.MAX_ATTEMPTS)host.append(formFor(p,'original'));
        else host.append(para('Лимит попыток для этой пары достигнут. Выбери проверку основы или разбор, затем попробуй новое условие.'));
        if(r.attempts.length){
          const group=el('div',undefined,{class:'fb-remediation'});
          group.append(el('h4','Что хочется проверить?'),para('Это возможные затруднения, а не установленная причина ошибки. Выбирай любую проверку.'));
          for(const kind of m.PROBES)group.append(button(m.probeNames[kind]+(r.probes[kind]?.answered?' · уже проверяли':''),()=>dispatch('open-probe',{probe:kind}),true));
          group.append(button('Посмотреть разбор исходной задачи',()=>dispatch('reveal'),true));host.append(group);
        }
      }
    }else if(state.phase==='probe'){
      const kind=r.activeProbe,q=m.probeFor(p.id,kind),record=r.probes[kind];
      host.append(title(q.name),para('Исходное уравнение остаётся: '+p.original.equation,'fb-context'),para('Это отдельная короткая проба; она не устанавливает причину ошибки.'),para(q.prompt,'task'));
      if(!record.answered)host.append(formFor(p,'probe',kind,q));
      else{
        host.append(para(record.value==='?'?'Ответ не дан.':record.correct?'Эта проба верна. Причина затруднения всё ещё не установлена.':'Ответ в этой пробе не совпал. Можно потренировать именно этот шаг.','fb-feedback'));
        if(kind==='whole')host.append(model(q));
        else host.append(para(q.explanation,'fb-feedback'));
        host.append(para('Другие объяснения и практика на MathExam:','muted'),resourceLinks(kind),para('Ссылки открываются отдельно. Возвращайся в эту вкладку к тому же уравнению.','muted'));
      }
      host.append(button('Вернуться к исходной задаче',()=>dispatch('return')));
    }else if(state.phase==='transfer'){
      host.append(title('Новая задача: применить тот же смысл'),para('Попробуй без подсказок: сам составь уравнение, реши его и проверь. Ответ один раз; после проверки будет показан разбор.'),para(p.transfer.story,'task'),formFor(p,'transfer'));
    }else if(state.phase==='result'){
      host.append(title('Результат новой задачи'),para(p.transfer.story,'task'),para('Твой ответ: '+r.transfer.value+'.','muted'),para(outcomeText(m.transferOutcome(r.transfer),true),'fb-feedback'),solution(p.transfer),para('Программа проверила число, но не ход рассуждения. Один новый ответ не доказывает освоение или сохранение навыка.','muted'),button(state.index+1===m.pairs.length?'Завершить набор':'Перейти к другой паре',()=>dispatch('next')));
    }
    if(!host.querySelector('[data-fb-message]'))host.append(status());
    if(focus){const heading=host.querySelector('[data-fb-heading]');if(heading){heading.focus({preventScroll:true});heading.scrollIntoView({block:'nearest'});}}
  }
  function openFromHash(){
    if(location.hash==='#fraction-bridge'){
      panel.open=true;
      // Native fragment navigation is retained; opening hidden details on load
      // may occur after the browser's initial scroll.
      requestAnimationFrame(()=>panel.scrollIntoView({block:'start'}));
    }
  }
  window.addEventListener('hashchange',openFromHash);
  if(snapshot.events.length||Object.keys(snapshot.drafts).length)panel.open=true;
  save(false);render();host.hidden=false;document.getElementById('fraction-bridge-fallback').hidden=true;openFromHash();
})();
