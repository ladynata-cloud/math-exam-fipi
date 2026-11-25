'use strict';
(() => {
  const {stations, card, rounds} = window.ArzhenikovGarden;
  const ids = stations.map(s => s.id);
  const panel = document.getElementById('garden-play');
  const launch = document.getElementById('garden-start');
  const layout = document.querySelector('.layout');
  const key = 'mathexam.arzhenikov.garden.v1';
  const day = 86400000;
  const empty = () => ({series:{}, book:{}, reviewCount:{}, seen:{}, last:'count', review:null, due:0});
  const newTask = () => ({values:[], events:[], moves:0, tools:{}, correct:false});
  let state;
  try { state = JSON.parse(localStorage.getItem(key)); } catch { /* Fall back to this tab. */ }
  if (!state?.series || !state.book || !state.seen || !state.reviewCount) state = empty();
  function save() {
    try { localStorage.setItem(key,JSON.stringify(state)); }
    catch { document.getElementById('storage').textContent = 'Сохранение в этом браузере недоступно. Можно продолжить в этой вкладке.'; }
  }
  function node(tag,text,cls) {
    const item = document.createElement(tag);
    if (text != null) item.textContent = text;
    if (cls) item.className = cls;
    return item;
  }
  function button(text,fn,cls) {
    const item = node('button',text,cls); item.type = 'button'; item.onclick = fn; return item;
  }
  function link(text,hash,cls) {
    const item = node('a',text,cls); item.href = '#'+hash; return item;
  }
  function session(id) {
    return state.series[id] ||= {round:0,step:0,task:newTask(),done:false};
  }
  const plant = id => stations.find(s => s.id === id);
  const progress = id => state.book[id] ||= {missions:0, independent:0, journal:[]};
  const taskStarted = task => task && (task.moves > 0 || task.correct ||
    task.events?.length || Object.keys(task.tools || {}).length ||
    task.values?.some(value => String(value).trim() !== ''));
  function studiedIds() {
    // Merely opening a plot creates an empty draft. A review card from an older
    // queue is not evidence that its teaching sequence has been visited.
    return ids.filter(id => {
      const run = state.series[id], book = state.book[id];
      return book?.missions > 0 || book?.journal?.some(entry => entry.fingerprint?.startsWith('bed.' + id + '.')) ||
        run && (run.round > 0 || run.step > 0 || run.done || taskStarted(run.task));
    });
  }
  const taskCount = count => count + (count === 1 ? ' задача' : count >= 2 && count <= 4 ? ' задачи' : ' задач');
  const reviewSize = () => Math.min(3, studiedIds().length);
  const stageNames = ['Исследуй','Проверь догадку','Реши самостоятельно'];
  function note(text,cls) { return node('p',text,cls); }
  function updates(status) {
    launch.href = '#garden-'+(ids.includes(state.last) || state.last === 'review' ? state.last : 'count');
    if (Object.keys(state.series).length) launch.textContent = 'Продолжить в оранжерее';
    const dueLink = document.getElementById('garden-repeat');
    dueLink.hidden = !(state.due && Date.now()>=state.due);
    dueLink.textContent = 'Повторить после перерыва · ' + taskCount(reviewSize());
    document.querySelector('.garden-cover').hidden = status;
    panel.hidden = !status;
    const legacy = ids.includes(location.hash.slice(1));
    const workshop = !status && !legacy;
    document.getElementById('workshop').hidden = !workshop;
    document.getElementById('garden').hidden = workshop;
    layout.hidden = !legacy;
    document.querySelector('.intro .meter').hidden = !legacy;
    const current = workshop ? '#workshop' : status ? '#garden-count' : '#count';
    for (const item of document.querySelectorAll('.life-modes a')) {
      if (item.hash === current) item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    }
  }
  function model(parent, m, t) {
    const box = node('div',null,'garden-model'), view = node('div',null,'garden-trays');
    const caption = note('','garden-caption');
    caption.setAttribute('aria-live','polite');
    function tray(size) {
      const strip = node('span',null,'garden-tray');
      for (let i=0;i<size;i++) strip.append(node('i',null,'garden-seed'));
      strip.setAttribute('aria-hidden','true'); return strip;
    }
    const base = m.type === 'partial' ? Math.floor(m.total/10) : m.total;
    const limit = m.type === 'rows' ? m.groups : m.type === 'place' ? 2 : Math.floor(base/m.size);
    const add = button(m.type === 'share' ? 'Раздать по одному' : m.type === 'rows' ? 'Показать ряд' : m.type === 'place' ? 'Разменять разряд' : 'Собрать группу',() => move(1));
    const back = button('Отменить шаг',() => move(-1));
    function draw() {
      view.replaceChildren();
      if (m.type === 'place') {
        const hundreds = Math.floor(m.total/100), tens = Math.floor(m.total/10)%10, units = m.total%10;
        const parts = [hundreds+' сот. · '+tens+' дес. · '+units+' ед.',
          'Каждому по сотне. Осталось '+tens+' дес. и '+units+' ед.',
          'После размена осталось '+(10*tens+units)+' ед. на '+m.size+' теплиц.'];
        caption.textContent = parts[t.moves];
      } else if (m.type === 'share') {
        for(let i=0;i<m.size;i++) view.append(tray(t.moves));
        caption.textContent = 'Лотков: '+m.size+' · В каждом: '+t.moves+' · В запасе: '+(base-m.size*t.moves);
      } else {
        for(let i=0;i<t.moves;i++) view.append(tray(m.size));
        caption.textContent = m.type === 'rows' ? 'Рядов: '+t.moves+' из '+m.groups+' · В каждом: '+m.size :
          (m.type === 'partial' ? 'Считаем десятки. ' : '')+'Полных групп: '+t.moves+' · Осталось: '+(base-m.size*t.moves);
      }
      add.disabled = t.moves >= limit; back.disabled = t.moves <= 0;
    }
    function move(delta) { t.moves = Math.max(0,Math.min(limit,t.moves+delta)); draw(); save(); }
    box.append(view,caption,add,back); parent.append(box); draw();
  }
  function startReview() {
    if (!state.review || state.review.done || !state.review.queue.length) {
      const studied = studiedIds();
      const ranked = [...studied].sort((a,b) => {
        const priority = id => {
          const last = state.book[id]?.journal?.at(-1);
          return (last?.status === 'Самостоятельно' ? 0 : 1) + (state.reviewCount[id] || 0)*-2;
        };
        return priority(b)-priority(a);
      });
      const queue = ranked.slice(0,3);
      state.review = {queue:queue.map(id => ({id,round:(state.reviewCount[id] || 0)%rounds})),
        step:0,task:newTask(),done:false,delayed:Boolean(state.due && Date.now()>=state.due)};
      save();
    }
  }
  function restoreReview() {
    const run = state.review;
    if (!run || run.done) return;
    if (!Array.isArray(run.queue) || !Number.isInteger(run.step) || run.step < 0 || run.step >= run.queue.length || !run.task) {
      if (run.queue?.length === 0) return;
      state.review = null;
      return;
    }
    const studied = new Set(studiedIds());
    // Completed answers keep their original journal and first-attempt evidence.
    // Only the uncompleted tail is filtered; this migration awards nothing.
    const currentDone = run.task.correct === true;
    const pendingAt = run.step + Number(currentDone);
    const completed = run.queue.slice(0,pendingAt);
    const pending = run.queue.slice(pendingAt).filter(item => studied.has(item.id));
    if (completed.length + pending.length === run.queue.length) return;
    const currentRemoved = !currentDone && !studied.has(run.queue[run.step].id);
    if (currentRemoved && taskStarted(run.task)) {
      // Preserve an unfinished legacy attempt even when it should not have
      // appeared in review. It remains readable and never becomes a new pass.
      (state.reviewDrafts ||= []).push({assignment:run.queue[run.step],task:run.task,at:Date.now()});
      state.seen[['mix',run.queue[run.step].id,run.queue[run.step].round,2].join('.')] = true;
    }
    run.queue = [...completed,...pending];
    run.adjusted = true;
    if (currentRemoved) run.task = newTask();
    if (!pending.length && !currentDone) {
      run.done = completed.length > 0;
      run.step = Math.max(0,completed.length-1);
    }
    save();
  }
  function journal(c,t) {
    const log = progress(c.id), fingerprint = [c.review?'mix':'bed',c.id,c.round,c.phase].join('.');
    const correctFirst = t.events.filter(e=>e.kind==='answer').length===1;
    const helped = Object.keys(t.tools).length>0;
    const seen = !!state.seen[fingerprint];
    const independent = c.phase===2 && correctFirst && !helped && !seen;
    const status = helped ? (t.tools.solution?'После разбора':'С опорой') : !correctFirst ? 'После исправления' : seen ? 'Повтор знакомой задачи' : 'Самостоятельно';
    if (independent) log.independent++;
    t.result = {status,independent};
    state.seen[fingerprint] = true;
    log.journal.push({fingerprint,status,independent,at:Date.now(),events:t.events.slice()});
    if (log.journal.length>32) log.journal.shift();
  }
  function gallery(id) {
    const details = node('details',null,'garden-collection');
    const count = ids.filter(k => state.book[k]?.missions).length;
    details.append(node('summary','Моя оранжерея · '+count+' из 8 растений'));
    const grid = node('div',null,'garden-plots');
    stations.forEach(s=>{
      const item = link('', 'garden-'+s.id,'garden-plot');
      if (s.id === id) item.setAttribute('aria-current','step');
      const earned = state.book[s.id]?.missions;
      item.append(node('span',earned ? s.icon : '◌','garden-icon'),node('strong',s.name),node('small',earned ? s.plant+' · '+s.skill : s.skill));
      grid.append(item);
    });
    details.append(grid);
    const countLabel = reviewSize() ? taskCount(reviewSize()) : 'сначала начни участок';
    const mixed = link((state.due && Date.now()>=state.due?'Пора повторить · ':'Смешанная грядка · ')+countLabel,'garden-review','garden-link');
    details.append(mixed); return details;
  }
  function render(shouldFocus=false) {
    const route = location.hash.replace(/^#garden-/,'');
    const active = location.hash.startsWith('#garden-') && (ids.includes(route)||route==='review');
    updates(active);
    if (!active) {
      if (shouldFocus && ids.includes(location.hash.slice(1))) document.getElementById('heading').focus();
      return;
    }
    const review = route === 'review';
    if (review) {
      restoreReview();
      if (!state.review || !state.review.queue.length || (state.review.done && state.due && Date.now()>=state.due)) startReview();
    }
    state.last = route;
    const run = review ? state.review : session(route);
    if (review && !run.queue.length) {
      panel.replaceChildren();
      const title = node('h2','Смешанная грядка'); title.tabIndex = -1;
      panel.append(title,note('Здесь будут задачи только по участкам, где ты уже начал заниматься. Сначала выбери участок и попробуй первое действие.'),
        link('Начать с равных групп','garden-count','garden-go'),gallery(''));
      historyView(panel);
      if (shouldFocus) title.focus();
      save(); return;
    }
    const assignment = review ? run.queue[run.step] : {id:route,round:run.round};
    const station = plant(assignment.id), t = run.task;
    const phase = review ? 2 : run.step;
    const c = card(station.id,assignment.round,phase,review);
    panel.replaceChildren();
    const strip = node('div',null,'garden-strip');
    strip.append(link('К пошаговой карте',station.id),node('span',review ? (run.delayed ? 'Повтор после паузы' : 'Смешанная грядка') : 'Оранжерея равных групп'));
    const title = node('h2',station.name);
    title.tabIndex=-1;
    const heading = node('div',null,'garden-heading');
    const emblem = node('span',station.icon,'garden-emblem'); emblem.setAttribute('aria-hidden','true');
    heading.append(emblem,title);
    panel.append(strip,gallery(station.id),heading);
    if (review && run.adjusted) panel.append(note('В прежней очереди были новые участки. Впереди остались только уже начатые; выполненные ответы и черновики сохранены.','garden-explain'));
    if (!review) {
      const grown = run.done ? 3 : run.step + Number(t.correct);
      const growth = node('div',null,'garden-growth');
      growth.setAttribute('aria-label','Рост растения: '+grown+' из 3 задач');
      for (const [i,symbol] of ['🫘','🌱','🌿',station.icon].entries()) {
        const sprout = node('span',symbol,i<=grown?'sprouted':'');
        sprout.setAttribute('aria-hidden','true');growth.append(sprout);
      }
      growth.append(node('strong',['Семя посажено','Показался росток','Раскрылись листья','Растение выросло'][grown]));
      panel.append(growth);
    }
    if (shouldFocus) title.focus();
    if (run.done) {
      const log = progress(station.id);
      panel.append(note(review?'Смешанная грядка готова! Решено задач: '+run.queue.length+'.':'В коллекции растёт '+station.plant.toLowerCase()+'!','garden-prize'));
      if (!review) panel.append(note('Пройдено миссий на участке: '+log.missions+'. Самостоятельных проверок на новых задачах: '+log.independent+'.'));
      const actions = node('div',null,'actions');
      if (!review) {
        actions.append(link('На следующий участок','garden-'+ids[(ids.indexOf(station.id)+1)%ids.length],'garden-go'));
        actions.append(button('Ещё три задачи здесь',()=>{
          run.round=(run.round+1)%rounds;run.step=0;run.task=newTask();run.done=false;save(); render(true);
        }));
        actions.append(link('Смешанная грядка','garden-review','garden-link'));
      } else {
        actions.append(link('Выбрать участок','garden-'+run.queue[0].id,'garden-go'));
        actions.append(button('Новая смешанная грядка',()=>{startReview();render(true);}));
      }
      panel.append(actions); historyView(panel); return;
    }
    const total = review ? run.queue.length : 3;
    const label = node('p',(review?'Смешанная проверка':stageNames[phase])+' · '+(run.step+1)+' из '+total,'garden-stage');
    const meter = node('div',null,'garden-meter');
    meter.setAttribute('aria-hidden','true');
    for(let i=0;i<total;i++) meter.append(node('i',null,i<=run.step?'filled':''));
    panel.append(label,meter,note(c.prompt,'garden-question'));
    if (t.correct) {
      panel.append(note('Верно! '+t.result.status+'.','garden-prize'),note(c.why,'garden-explain'));
      const next = button(run.step===total-1 ? (review?'Завершить повторение':'Вырастить растение') : 'Следующая задача',()=>{
        if (run.step===total-1) {
          run.done=true;
          if (review) state.due=Date.now()+day;
          else { progress(route).missions++; if (!state.due) state.due=Date.now()+day; }
        } else {run.step++;run.task=newTask();}
        save();render(true);
      },'primary');
      panel.append(next);return;
    }
    const form = node('form'), fields = node('div',null,'fields'), inputs=[];
    const report = note('','feedback'); report.setAttribute('role','status');
    c.fields.forEach((f,i)=>{
      const label=node('label',f.label), input=node(f.options?'select':'input');
      if (f.options) {
        input.append(new Option('Выбери вариант',''));
        for (const [v,title] of f.options) input.append(new Option(title,v));
      } else {input.inputMode='numeric';input.autocomplete='off';input.maxLength=7;}
      input.value=t.values[i]??'';
      const last=t.events.filter(e=>e.kind==='answer').at(-1);
      if(last && last.values[i]===input.value && last.wrong.includes(i)) input.setAttribute('aria-invalid','true');
      input.addEventListener('input',()=>{t.values[i]=input.value;input.removeAttribute('aria-invalid');save();});
      label.append(input);fields.append(label);inputs.push(input);
    });
    form.append(fields);
    const submit=node('button','Проверить ответ','primary');submit.type='submit';
    const actions=node('div',null,'actions');actions.append(submit);form.append(actions);panel.append(form,report);
    const support=node('div',null,'garden-support');
    function help(kind,title,content) {
      const body=node('div');body.hidden=!t.tools[kind];
      const toggle=button(title,()=>{
        if(!t.tools[kind]) {t.tools[kind]=true;t.events.push({kind,at:Date.now()});save();}
        body.hidden=!body.hidden;
        toggle.setAttribute('aria-expanded',String(!body.hidden));
      });
      toggle.setAttribute('aria-expanded',String(!body.hidden));
      content(body);support.append(toggle,body);
    }
    if(c.model) help('model','Попробовать на модели',box=>model(box,c.model,t));
    help('hint','Нужна подсказка',box=>box.append(note(c.hint,'help')));
    help('solution','Посмотреть разбор',box=>box.append(note(c.why,'help')));
    panel.append(support);
    const prerequisite = {count:'count',share:'count',pack:'share',inverse:'count',bridge:'inverse',zero:'bridge',remainder:'pack',transfer:'bridge'};
    function feedback(wrong) {
      report.replaceChildren(document.createTextNode(c.fields[wrong].clue+' '),link('Разобрать шаг на карте',prerequisite[station.id]));
    }
    const prev=t.events.filter(e=>e.kind==='answer').at(-1);
    if(prev?.wrong.length) feedback(prev.wrong[0]);
    form.onsubmit = e=>{
      e.preventDefault();
      if(t.correct) return;
      const values=inputs.map(i=>i.value.trim()), blank=values.indexOf('');
      if(blank!==-1){report.textContent='Заполни поле «'+c.fields[blank].label+'».';inputs[blank].focus();return;}
      const wrong=[];
      c.fields.forEach((f,i)=>{
        const ok=f.options ? [].concat(f.answer).includes(values[i]) : /^\d+$/.test(values[i]) && Number(values[i])===f.answer;
        if(!ok) wrong.push(i);
        inputs[i].setAttribute('aria-invalid',String(!ok));
      });
      t.values=values;
      const ordinal=t.events.filter(e=>e.kind==='answer').length+1;
      t.events.push({kind:'answer',attempt:ordinal,values:[...values],wrong,at:Date.now()});
      if(wrong.length){feedback(wrong[0]);inputs[wrong[0]].focus();save();return;}
      t.correct=true;journal(c,t);
      if(review) state.reviewCount[station.id]=(state.reviewCount[station.id]||0)+1;
      save();render(true);
    };
    save();
  }
  function historyView(parent) {
    const details=node('details',null,'garden-history');details.append(node('summary','Как я решал'));
    const all=Object.values(state.book).flatMap(book=>book.journal).sort((a,b)=>b.at-a.at).slice(0,9);
    all.forEach(j=>{
      const [mode,id,r,p]=j.fingerprint.split('.');
      const c=card(id,Number(r),Number(p),mode==='mix');
      const attempts=j.events.filter(e=>e.kind==='answer');
      const entry=node('details');entry.append(node('summary',plant(id).name+' · '+j.status),note(c.prompt));
      for(const ev of j.events) entry.append(note(ev.kind==='answer'?'Попытка '+ev.attempt+': '+ev.values.map((v,i)=>c.fields[i].options?.find(o=>o[0]===v)?.[1]??v).join(' · ')+(ev.wrong.length?' — исправь: '+ev.wrong.map(i=>c.fields[i].label).join(', '):' — верно') : ({hint:'Открыта подсказка',model:'Открыта модель',solution:'Открыт разбор'}[ev.kind])));
      if(attempts.length) details.append(entry);
    });
    for (const draft of state.reviewDrafts || []) {
      if (!ids.includes(draft.assignment?.id)) continue;
      const c = card(draft.assignment.id,draft.assignment.round,2,true);
      const entry = node('details');
      entry.append(node('summary',plant(draft.assignment.id).name+' · Черновик прежнего повторения'),note(c.prompt),
        note('Это задание ещё не завершено. Оно сохранено отдельно и не даёт отметки за самостоятельное решение.'));
      for (const [index,value] of (draft.task.values || []).entries()) {
        if (c.fields[index] && String(value).trim()) entry.append(note(c.fields[index].label+': '+value));
      }
      for (const event of draft.task.events || []) {
        if (event.kind === 'answer') entry.append(note('Попытка '+event.attempt+': '+event.values.join(' · ')));
        else entry.append(note({hint:'Открыта подсказка',model:'Открыта модель',solution:'Открыт разбор'}[event.kind] || 'Действие сохранено'));
      }
      entry.append(link('Познакомиться с участком','garden-'+draft.assignment.id));
      details.append(entry);
    }
    parent.append(details);
  }
  window.addEventListener('hashchange',()=>render(true));render();
})();
