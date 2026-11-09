/* Original MathExam investigations; native task banks and results remain separate. */
(function (root) {
  'use strict';
  const PREFIX = 'mathExam.oge.videoModels.v1.';
  function numberParts(value) {
    const text = String(value).trim().replace(/−/g, '-').replace(',', '.');
    const parse = s => {
      if (!/^[+-]?(?:\d+(?:\.\d{1,9})?|\.\d{1,9})$/.test(s) || s.length > 24) return null;
      const sign = s.startsWith('-') ? -1n : 1n, raw = s.replace(/^[+-]/, ''), a = raw.split('.');
      return [sign * BigInt((a[0] || '0') + (a[1] || '')), 10n ** BigInt((a[1] || '').length)];
    };
    if (!text || text.split('/').length > 2) return null;
    const chunks = text.split('/').map(s => parse(s.trim()));
    if (chunks.some(x => !x)) return null;
    if (chunks.length === 1) return chunks[0];
    if (!chunks[1][0]) return null;
    return [chunks[0][0] * chunks[1][1], chunks[0][1] * chunks[1][0]];
  }
  function correct(value, expected) {
    const a = numberParts(value), b = numberParts(expected);
    return !!(a && b && a[0] * b[1] === b[0] * a[1]);
  }
  function blank(lesson) {
    return { rev: 0, stage: 'prediction', prediction: null, reason: null,
      params: Object.fromEntries(lesson.controls.map(c => [c.key, c.value])),
      variant: 0, answer: '', proof: '', wrong: false, helped: false, checked: false,
      seen: [], results: {}, drafts: {}, visits: {}, feedback: '' };
  }
  function decode(raw, lesson) {
    const state = blank(lesson);
    if (!raw) return state;
    try {
      const x = JSON.parse(raw);
      if (!x || !Number.isSafeInteger(x.rev) || x.rev < 0) return state;
      state.rev = x.rev;
      if (['prediction','experiment','reason','practice'].includes(x.stage)) state.stage = x.stage;
      for (const field of ['prediction','reason']) {
        const q = field === 'prediction' ? lesson.predict : lesson.reason;
        if (Number.isInteger(x[field]) && x[field] >= 0 && x[field] < q.choices.length) state[field] = x[field];
      }
      for (const c of lesson.controls) {
        const v = x.params && x.params[c.key];
        if (typeof v === 'number' && Number.isFinite(v) && v >= c.min && v <= c.max) state.params[c.key] = v;
      }
      if (Number.isInteger(x.variant) && x.variant >= 0 && x.variant < lesson.practices.length) state.variant = x.variant;
      for (const k of ['answer','proof']) if (typeof x[k] === 'string') state[k] = x[k].slice(0,k === 'proof' ? 5000 : 100);
      for (const k of ['wrong','helped','checked']) state[k] = x[k] === true;
      state.seen = Array.isArray(x.seen) ? [...new Set(x.seen.filter(i => Number.isInteger(i) && i >= 0 && i < lesson.practices.length))] : [];
      if (x.results && typeof x.results === 'object') for (let i=0; i<lesson.practices.length; i++) if (['independent','corrected','helped'].includes(x.results[i])) state.results[i] = x.results[i];
      if(x.visits&&typeof x.visits==='object')for(let i=0;i<lesson.practices.length;i++)if(Number.isSafeInteger(x.visits[i])&&x.visits[i]>0&&x.visits[i]<1000000)state.visits[i]=x.visits[i];
      if (x.drafts && typeof x.drafts === 'object') for(let i=0;i<lesson.practices.length;i++) {
        const d=x.drafts[i]; if(!d || typeof d !== 'object') continue;
        state.drafts[i]={answer:typeof d.answer==='string'?d.answer.slice(0,100):'',proof:typeof d.proof==='string'?d.proof.slice(0,5000):'',wrong:d.wrong===true,helped:d.helped===true,checked:d.checked===true};
      }
      if (state.checked && !state.seen.includes(state.variant)) state.checked = false;
      return state;
    } catch (_) { return state; }
  }
  function isolated(w) {
    try {
      if (w.parent !== w || w.MathExamLearning?.managed === true || w.OgeCourseSharedMode) return true;
      const q = new URLSearchParams(w.location.search);
      return ['board','mirror','embedded','managed'].some(k => q.get(k) === '1') || q.get('mode') === 'exam';
    } catch (_) { return true; }
  }
  const api = { PREFIX, numberParts, correct, blank, decode, isolated };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.OgeVideoModels = api;
  if (isolated(root)) return;
  const script = document.querySelector('script[data-oge-video-task]');
  const task = Number(script?.getAttribute('data-oge-video-task'));
  const lessons = [...(root.OgeVideoGraphLessons || []), ...(root.OgeVideoGeometryLessons || [])].filter(l => l.tasks.includes(task));
  if (!lessons.length || document.getElementById('oge-video-models')) return;
  const e = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className=cls; return n; };
  const shell = e('details', null, 'ovm'); shell.id='oge-video-models';
  const summary=e('summary','Разобраться на модели');summary.setAttribute('data-ovm-open','');shell.append(summary);
  const intro=e('p','Предскажи → измени модель → объясни → реши новый пример.','ovm-intro');shell.append(intro);
  const label=e('label','Выбери исследование','ovm-picker-label'), picker=e('select'); picker.setAttribute('data-ovm-picker','');
  for(const l of lessons){const o=e('option',l.title);o.value=l.id;picker.append(o);}label.append(picker);shell.append(label);
  const notice=e('p','','ovm-notice');notice.setAttribute('role','status');shell.append(notice);
  const host=e('section');shell.append(host);
  // Place after the existing task container: native rerenders cannot remove it.
  const anchor=document.querySelector('main') || document.querySelector('body > .wrap') || document.querySelector('#app');
  if(anchor) anchor.insertAdjacentElement('afterend',shell); else document.body.append(shell);
  let lesson=lessons[0],state,storageAvailable=true;
  const versions=new Map(),epochs=new Map(),sessions=new Map(),exposures=new Map();
  function read(l){try{return root.localStorage.getItem(PREFIX+l.id);}catch(_){storageAvailable=false;return undefined;}}
  // A displayed hint or a checked wrong answer cannot be forgotten by a tab update.
  function retainExposure(l,s){
    const flags=exposures.get(l.id)||{};
    for(let i=0;i<l.practices.length;i++){
      const d=s.drafts[i],current=s.variant===i,old=flags[i]||{};
      const persisted={};
      for(const kind of ['helped','wrong'])try{persisted[kind]=root.localStorage.getItem(PREFIX+'exposure.'+l.id+'.'+i+'.'+kind)==='1';}catch(_){storageAvailable=false;}
      const helped=!!(old.helped||persisted.helped||d?.helped||(current&&s.helped)),wrong=!!(old.wrong||persisted.wrong||d?.wrong||(current&&s.wrong));
      if(!helped&&!wrong)continue;
      flags[i]={helped,wrong};
      // Separate append-only booleans are idempotent across tabs, including while a snapshot lock is pending.
      for(const kind of ['helped','wrong'])if(flags[i][kind]&&!persisted[kind])try{root.localStorage.setItem(PREFIX+'exposure.'+l.id+'.'+i+'.'+kind,'1');}catch(_){storageAvailable=false;}
      s.drafts[i]={answer:'',proof:'',checked:false,...d,helped,wrong};
      if(current){s.helped=helped;s.wrong=wrong;}
    }
    exposures.set(l.id,flags);return s;
  }
  function acceptFresh(l,fresh,message){
    const cached=sessions.get(l.id);if(cached)retainExposure(l,cached);
    retainExposure(l,fresh);sessions.set(l.id,fresh);versions.set(l.id,fresh.rev);epochs.set(l.id,(epochs.get(l.id)||0)+1);
    if(lesson.id===l.id){state=fresh;if(message)notice.textContent=message;}
  }
  function load(l){
    lesson=l;const raw=read(l),fresh=decode(raw,l),cached=sessions.get(l.id);
    if(!cached){state=retainExposure(l,fresh);sessions.set(l.id,state);versions.set(l.id,state.rev);}
    else if(raw!==undefined&&fresh.rev!==versions.get(l.id)){acceptFresh(l,fresh,'Работа обновлена из другой вкладки.');}
    else state=retainExposure(l,cached);
    picker.value=l.id;render();
  }
  function save(){
    if(state.stage==='practice')state.drafts[state.variant]={answer:state.answer,proof:state.proof,wrong:state.wrong,helped:state.helped,checked:state.checked};
    retainExposure(lesson,state);sessions.set(lesson.id,state);
    if(!root.navigator?.locks?.request){storageAvailable=false;notice.textContent='Безопасное сохранение между вкладками недоступно. Работа останется на этой странице до её закрытия.';return true;}
    const l=lesson,key=PREFIX+l.id,epoch=epochs.get(l.id)||0;
    if(!versions.has(l.id))versions.set(l.id,state.rev);
    const desired=JSON.parse(JSON.stringify(state));
    let immediate=true;
    root.navigator.locks.request(key,()=>{
      if((epochs.get(l.id)||0)!==epoch)return;
      const fresh=decode(root.localStorage.getItem(key),l);
      if(fresh.rev!==versions.get(l.id)){
        immediate=false;acceptFresh(l,fresh,'В другой вкладке появилась более свежая работа. Здесь показана сохранённая версия; повтори своё действие.');
        if(lesson.id===l.id)render();return;
      }
      retainExposure(l,desired);desired.rev=fresh.rev+1;root.localStorage.setItem(key,JSON.stringify(desired));versions.set(l.id,desired.rev);
      // The session may already contain later keystrokes or another practice variant.
      const cached=sessions.get(l.id);if(cached)cached.rev=desired.rev;
    }).catch(()=>{storageAvailable=false;notice.textContent='Сохранение в этом браузере недоступно. Пока страница открыта, можно продолжать.';});
    return immediate;
  }
  function button(text,action,fn){const b=e('button',text);b.type='button';b.dataset.ovmAction=action;b.addEventListener('click',fn);return b;}
  function change(fn){fn();if(save())render();}
  function choices(q,field,action){
    const fieldset=e('fieldset'),legend=e('legend',q.question);fieldset.append(legend);
    q.choices.forEach((text,index)=>{const l=e('label',null,'ovm-choice'),r=e('input');r.type='radio';r.name='ovm-'+field;r.value=String(index);r.checked=state[field]===index;r.addEventListener('change',()=>{state[field]=index;go.disabled=field==='reason'&&index!==q.answer;save();});l.append(r,e('span',text));fieldset.append(l);});host.append(fieldset);
    host.append(button('Проверить',action,()=>{if(state[field]===null){feedback.textContent='Сначала выбери предположение.';return;}const ok=state[field]===q.answer;feedback.textContent=(ok?'Верно. ':'Пока не так. ')+q.explain;if(field==='prediction'){go.disabled=false;}else if(ok){go.disabled=false;}save();}));
    const feedback=e('p','','ovm-feedback');feedback.setAttribute('data-ovm-feedback','');feedback.setAttribute('role','status');host.append(feedback);
    const nextStage=field==='prediction'?'experiment':'practice';
    const go=button(field==='prediction'?'Проверить на модели':'Решить новый пример',nextStage,()=>{if(field==='reason'&&state.reason!==q.answer)return;change(()=>{state.stage=nextStage;if(nextStage==='practice')state.visits[state.variant]=(state.visits[state.variant]||0)+1;});});
    go.disabled=field==='prediction'?state.prediction===null:state.reason!==q.answer;host.append(go);
  }
  function renderScene(scene,readout){const view=lesson.render(state.params);scene.innerHTML=view.svg;readout.textContent=view.readout;}
  function experiment(){
    host.append(e('p',lesson.goal));
    const scene=e('div',null,'ovm-scene');scene.setAttribute('data-ovm-scene','');const readout=e('p',null,'ovm-readout');readout.setAttribute('aria-live','polite');host.append(scene,readout);renderScene(scene,readout);
    for(const c of lesson.controls){
      const box=e('div',null,'ovm-control'),label=e('label',c.label),number=e('input'),range=e('input');
      number.type='number';range.type='range';for(const input of [number,range]){input.min=String(c.min);input.max=String(c.max);input.step=String(c.step);input.value=String(state.params[c.key]);input.dataset.ovmControl=c.key;input.setAttribute('aria-label',c.label+(input===number?' — точное значение':' — ползунок'));}
      label.append(number);box.append(label,range);host.append(box);
      const update=(input,other)=>{const value=Number(input.value);if(!input.value||!Number.isFinite(value)||value<c.min||value>c.max){input.setAttribute('aria-invalid','true');return;}input.removeAttribute('aria-invalid');state.params[c.key]=value;if(!save())return;other.value=String(value);renderScene(scene,readout);};
      range.addEventListener('input',()=>update(range,number));number.addEventListener('input',()=>update(number,range));
    }
    host.append(button('Почему это работает?','reason',()=>change(()=>{state.stage='reason';})));
  }
  function practice(){
    const p=lesson.practices[state.variant],familiar=state.seen.includes(state.variant)||state.helped||state.wrong||(state.visits[state.variant]||0)>1;
    host.append(e('p',familiar?'Знакомый пример · повторение':`Новое условие ${state.variant+1} из ${lesson.practices.length}`,'ovm-kicker'),e('p',p.prompt,'ovm-problem'));
    const label=e('label','Ответ'),answer=e('input');answer.type='text';answer.inputMode='decimal';answer.maxLength=100;answer.setAttribute('data-ovm-answer','');answer.value=state.answer;answer.disabled=state.checked;label.append(answer);host.append(label);
    answer.addEventListener('input',()=>{state.answer=answer.value;save();});
    if(p.proof){const proofLabel=e('label','Запиши обоснование'),proof=e('textarea');proof.rows=4;proof.maxLength=5000;proof.setAttribute('data-ovm-proof','');proof.value=state.proof;proofLabel.append(proof);host.append(proofLabel,e('p','Числовой ответ проверяется автоматически. Обоснование сохраняется для самостоятельной проверки или обсуждения с преподавателем.','ovm-note'));proof.addEventListener('input',()=>{state.proof=proof.value;save();});}
    const fb=e('p','','ovm-feedback');fb.setAttribute('data-ovm-feedback','');fb.setAttribute('role','status');
    const result=e('p','','ovm-result');result.setAttribute('data-ovm-result','');
    const names={independent:'Самостоятельно',corrected:'После исправления',helped:'С помощью'};
    const resultLabel=value=>(p.proof?'Числовой ответ: ':'')+value+(p.proof?'. Обоснование автоматически не проверено.':'');
    if(state.checked)result.textContent=resultLabel(names[state.results[state.variant]]||'Пример завершён')+'. Можно переходить к следующему условию.';
    const row=e('div',null,'ovm-buttons');
    const check=button('Проверить ответ','check-practice',()=>{
      if(state.checked)return;
      retainExposure(lesson,state);
      if(!numberParts(state.answer)){fb.textContent='Введи число или дробь с ненулевым знаменателем, например 2,5 или 5/2.';return;}
      if(!correct(state.answer,p.answer)){state.wrong=true;if(save())fb.textContent='Пока не совпадает. Проверь условия модели и вычисление; можно открыть подсказку.';return;}
      const wasSeen=state.seen.includes(state.variant);state.checked=true;
      if(!wasSeen){state.seen.push(state.variant);state.results[state.variant]=state.helped?'helped':state.wrong?'corrected':'independent';}
      if(save()){answer.disabled=true;check.disabled=true;result.textContent=wasSeen?'Знакомый повтор. Новый самостоятельный результат не добавлен.':resultLabel(names[state.results[state.variant]])+'. '+(p.proof?'Теперь проверь своё обоснование.':'');updateStats();}
    });check.disabled=state.checked;row.append(check);
    row.append(button('Подсказка','hint',()=>{state.helped=true;if(save())fb.textContent=p.hint;}));
    row.append(button('Разбор','solution',()=>{state.helped=true;if(save())fb.textContent=p.solution+(p.proof?' '+p.proof:'');}));
    host.append(row,fb,result);
    host.append(button('Другое условие','next',()=>change(()=>{const next=(state.variant+1)%lesson.practices.length;state.drafts[state.variant]={answer:state.answer,proof:state.proof,wrong:state.wrong,helped:state.helped,checked:state.checked};
      state.variant=next;state.visits[next]=(state.visits[next]||0)+1;const draft=state.drafts[next];state.answer=draft&&!draft.checked?draft.answer:'';state.proof=draft&&!draft.checked?draft.proof:'';state.wrong=!!draft?.wrong;state.helped=!!draft?.helped;state.checked=false;})));
  }
  function updateStats(){const stats=host.querySelector('[data-ovm-stats]');if(stats)stats.textContent=`Новые примеры: ${Object.values(state.results).filter(x=>x==='independent').length} самостоятельно · ${Object.values(state.results).filter(x=>x==='corrected').length} после исправления · ${Object.values(state.results).filter(x=>x==='helped').length} с помощью.`;}
  function render(){
    const focusInside=host.contains(document.activeElement);host.replaceChildren();host.dataset.ovmLesson=lesson.id;host.dataset.ovmStage=state.stage;const heading=e('h2',lesson.title);heading.tabIndex=-1;host.append(heading);
    if(!storageAvailable)notice.textContent='Сохранение в этом браузере недоступно. Можно работать до закрытия страницы.';
    if(state.stage==='prediction'){if(lesson.preview){const scene=e('div',null,'ovm-scene');scene.dataset.ovmPreview='';const view=lesson.preview(state.params);scene.innerHTML=typeof view==='string'?view:view.svg;host.append(scene);}choices(lesson.predict,'prediction','check-prediction');}
    if(state.stage==='experiment')experiment();
    if(state.stage==='reason')choices(lesson.reason,'reason','check-reason');
    if(state.stage==='practice')practice();
    const stats=e('p','', 'ovm-note');stats.dataset.ovmStats='';host.append(stats);updateStats();
    if(focusInside)heading.focus();
    if(state.stage!=='prediction')host.append(button('Вернуться к исследованию','restart',()=>change(()=>{state.stage='prediction';})));
  }
  picker.addEventListener('change',()=>{try{root.localStorage.setItem(PREFIX+'selection.'+task,picker.value);}catch(_){}load(lessons.find(l=>l.id===picker.value)||lessons[0]);});
  root.addEventListener('storage',ev=>{
    for(const l of lessons){
      if((ev.key!==null&&ev.key!==PREFIX+l.id)||!sessions.has(l.id))continue;
      // A queued event can be older than a commit already observed in this tab.
      const raw=read(l);if(raw===undefined)continue;const fresh=decode(raw,l);if(fresh.rev===versions.get(l.id))continue;
      acceptFresh(l,fresh,'Работа обновлена из другой вкладки.');if(lesson.id===l.id)render();
    }
  });
  try{const selected=root.localStorage.getItem(PREFIX+'selection.'+task);lesson=lessons.find(l=>l.id===selected)||lesson;}catch(_){}
  load(lesson);
})(typeof window !== 'undefined' ? window : globalThis);
