(function () {
  'use strict';
  const C=window.POGORELOV_COURSE, M=window.PogorelovCore, {esc,fmt}=M;
  const main=document.getElementById('main'), storageNote=document.getElementById('storage');
  const tasks=new Map(), units=new Map(C.units.map(u=>[u.id,u])), cache=new Map(), prefix='mathexam:pogorelov:2022:companion:v1:';
  C.units.forEach(u=>u.tasks.forEach(t=>tasks.set(t.id,{u,t})));
  let current=null,filter='all',query='',feedback=null,selectedLine='',dialog=null;
  function record(t){
    if(cache.has(t.id))return cache.get(t.id);
    let raw=null,p=M.fresh(),blocked=false,reason='';
    try{raw=localStorage.getItem(prefix+t.id);if(raw){if(raw.length>35000)throw Error('size');p=M.restore(raw,t);}}
    catch(e){blocked=true;reason='Прежнюю запись не удалось прочитать. Она сохранена без изменений; новые ответы пока остаются только в этой вкладке.';}
    const r={p,expected:raw,blocked,reason};cache.set(t.id,r);return r;
  }
  function save(t){
    const r=record(t);if(r.blocked){storageNote.textContent=r.reason;return false;}
    try{
      const now=localStorage.getItem(prefix+t.id);
      if(now!==r.expected){r.blocked=true;r.reason='В другой вкладке уже сохранена новая работа с этой задачей. Скачай свою запись, затем открой сохранённую версию.';storageNote.textContent=r.reason;return false;}
      const raw=JSON.stringify(r.p);localStorage.setItem(prefix+t.id,raw);r.expected=raw;
      storageNote.textContent='Работа сохраняется в этом браузере. Для переноса на другое устройство скачай записи.';return true;
    }catch(e){storageNote.textContent='Браузер не разрешил сохранить изменения. Записи остаются в этой вкладке; скачай работу перед её закрытием.';return false;}
  }
  function help(t){record(t).p.assisted=true;}
  const ref=(u,t)=>`§ ${u.id} · № ${t.number}${t.part?' ('+t.part+')':''} · с. ${t.page}`;
  const link=t=>`#task/${t.id}`;
  const unitLink=u=>`#section/${u.id}`;
  function source(u,t){return `<div class="source"><strong>Тренажёр к задаче ${esc(ref(u,t))}</strong><p>Прочитай условие в своём учебнике. А. В. Погорелов · 7–9 классы · 2022.</p></div>`;}
  function rules(u){return `<div class="rule-grid">${u.rules.map(([a,b])=>`<article><h3>${esc(a)}</h3><p>${fmt(b)}</p></article>`).join('')}</div><p class="pitfall">${fmt(u.pitfall)}</p>`;}
  function bookNote(){return `<div class="book-note"><strong>Как пользоваться курсом</strong><p>Открой нужный параграф и номер в своём учебнике. Выбери соответствующий тренажёр, попробуй решить самостоятельно или открой разбор по шагам. Каждая новая строка остаётся на экране рядом с предыдущими.</p><p>${esc(C.coverage)} Номер задачи нужно читать вместе с номером параграфа: в книге нумерация начинается заново в каждом §.</p><p>Источник привязок: А. В. Погорелов. «Геометрия. 7–9 классы». 11-е издание, стереотипное. Просвещение, 2022. ISBN 978-5-09-101284-2. Страницы указаны по печатной нумерации; в PDF они на одну больше.</p><p>Самостоятельный материал MathExam для работы вместе с книгой. Объяснения и схемы составлены для этого курса. Учебник и его иллюстрации в комплект не входят; курс не является официальным приложением издательства.</p></div>`;}
  function taskCard(u,t){const s=M.status(record(t).p,t);return `<a class="task-card" href="${link(t)}"><span class="eyebrow">К задаче ${esc(ref(u,t))}</span><strong>${esc(t.title)}</strong><small>${esc(t.goal)}</small>${s?`<span class="badge">${esc(s)}</span>`:''}</a>`;}
  function renderResults(){
    const container=document.getElementById('results');if(!container)return;
    const pool=C.units.filter(u=>filter==='all'||u.grade===Number(filter));
    if(query.trim()){
      const q=query.trim(),qualified=q.match(/^§\s*(\d+)\s*(?:[·,;]\s*)?(?:№\s*(\d+))?(?:\s*\((\d+)\))?$/),number=q.match(/^№?\s*(\d+)(?:\s*\((\d+)\))?$/);
      const words=q.toLowerCase().split(/\s+/).filter(Boolean);
      const matches=(u,t)=>qualified?u.id===Number(qualified[1])&&(!qualified[2]||t.number===Number(qualified[2]))&&(!qualified[3]||t.part===qualified[3]):number?t.number===Number(number[1])&&(!number[2]||t.part===number[2]):words.every(w=>(u.title+' '+t.title).toLowerCase().includes(w));
      const found=pool.flatMap(u=>u.tasks.filter(t=>matches(u,t)).map(t=>({u,t})));
      container.innerHTML=`<p class="muted">Найдено тренажёров: ${found.length}. Проверяй § и номер вместе.</p><div class="task-list">${found.map(({u,t})=>taskCard(u,t)).join('')}</div>${found.length?'':'<p class="empty">Такого номера в этой подборке нет. Попробуй название темы или открой нужный параграф.</p>'}`;
    }else container.innerHTML=`<div class="grid">${pool.map(u=>{
      const n=u.tasks.filter(t=>{const p=record(t).p;return p.checked||p.manual||p.done===t.steps.length;}).length;
      return `<a class="unit-card" href="${unitLink(u)}"><p class="eyebrow">${u.grade} класс · § ${u.id}</p><h2>${esc(u.title)}</h2><span class="count">${u.tasks.length} тренажёров · с. ${u.pages[0]}–${u.pages[1]}${n?` · выполнено ${n}`:''}</span><span class="arrow">К задачам →</span></a>`;
    }).join('')}</div>`;
  }
  function home(){
    current=null;const last=Array.from(tasks.values()).find(({t})=>M.status(record(t).p,t)==='В работе');
    main.innerHTML=`<section class="hero"><p class="eyebrow">Геометрия · 7–9 классы · издание 2022</p><h1>Курс к учебнику<br>А. В. Погорелова<span>Твоя задача. Понятные шаги.</span></h1><p class="intro">Учебник открыт рядом. Здесь — тренажёры к конкретным номерам, собственные объяснения и чертежи, которые помогают увидеть ход решения.</p><div class="ribbon"><span>15 параграфов</span><span>${tasks.size} тренажёра</span><span>92 номера с выбранными подпунктами</span></div><div class="row"><a class="button primary" href="#section/1">Начать с 7 класса →</a>${last?`<a class="button" href="${link(last.t)}">Продолжить ${esc(ref(last.u,last.t))}</a>`:''}</div></section><div class="filters" aria-label="Выбор класса">${['all','7','8','9'].map(g=>`<button type="button" data-grade="${g}" class="${g===filter?'active':''}" aria-pressed="${g===filter}">${g==='all'?'Все классы':g+' класс'}</button>`).join('')}<label class="search"><span class="sr-only">Найти тему или номер задачи</span><input type="search" id="search" placeholder="Тема или номер задачи…" value="${esc(query)}"></label></div><section id="results" aria-label="Разделы курса"></section>${bookNote()}`;
    main.querySelectorAll('[data-grade]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.grade;home();}));
    document.getElementById('search').addEventListener('input',e=>{query=e.target.value;renderResults();});renderResults();
  }
  function section(u){
    current=null;
    main.innerHTML=`<nav class="crumb"><a href="#">Все разделы</a><span>›</span><span>${u.grade} класс · § ${u.id}</span></nav><p class="eyebrow">К учебнику · с. ${u.pages[0]}–${u.pages[1]}</p><h1>${esc(u.title)}</h1><p class="intro">Выбери номер из своего учебника. В этом разделе ${u.tasks.length} тренажёров; выбранные подпункты указаны у каждого.</p><details class="card rules"><summary>Короткая памятка к параграфу</summary>${rules(u)}</details><div class="task-list">${u.tasks.map(t=>taskCard(u,t)).join('')}</div><p class="footer-line">Пройденные задания показывают выполненную работу. Они не означают, что весь параграф уже освоен. Для проверки без помощи выбери ещё не разобранный номер.</p>`;
  }
  function svg(t,phase,full=false){
    const v=t.model,ps=v.points,all=Object.values(ps), xs=all.map(p=>p.x),ys=all.map(p=>p.y);
    (v.circles||[]).forEach(c=>{xs.push(c.x-c.r,c.x+c.r);ys.push(c.y-c.r,c.y+c.r);});
    if(v.axes){xs.push(0);ys.push(0);}
    let minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys);
    if(maxx-minx<1){minx-=1;maxx+=1;}if(maxy-miny<1){miny-=1;maxy+=1;}
    const width=600,height=360,s=Math.min(480/(maxx-minx),250/(maxy-miny));
    const X=x=>300+(x-(minx+maxx)/2)*s,Y=y=>180-(y-(miny+maxy)/2)*s;
    let out='';
    if(v.axes){
      const range=Math.max(maxx-minx,maxy-miny),step=Math.max(1,Math.ceil(range/12));
      for(let x=Math.floor(minx/step)*step;x<=maxx+step;x+=step)out+=`<line class="geo-grid" x1="${X(x)}" y1="35" x2="${X(x)}" y2="325"/><text class="geo-tick" x="${X(x)+3}" y="${Math.min(340,Math.max(35,Y(0)+18))}">${x}</text>`;
      for(let y=Math.floor(miny/step)*step;y<=maxy+step;y+=step)out+=`<line class="geo-grid" x1="35" y1="${Y(y)}" x2="565" y2="${Y(y)}"/>${y===0?'':`<text class="geo-tick" x="${Math.min(560,Math.max(12,X(0)-25))}" y="${Y(y)-3}">${y}</text>`}`;
      out+=`<line class="geo-axis" x1="35" y1="${Y(0)}" x2="565" y2="${Y(0)}"/><line class="geo-axis" x1="${X(0)}" y1="325" x2="${X(0)}" y2="35"/><text class="geo-label" x="572" y="${Y(0)+7}">x</text><text class="geo-label" x="${X(0)+8}" y="28">y</text>`;
    }
    v.circles.filter(c=>(c.stage||0)<=phase).forEach(c=>{out+=`<circle cx="${X(c.x)}" cy="${Y(c.y)}" r="${c.r*s}" class="geo-line ${c.stage?'geo-new':''}"/>`;});
    v.lines.forEach((e,i)=>{
      if((e.stage||0)>phase||ps[e.a].stage>phase||ps[e.b].stage>phase)return;
      const a=ps[e.a],b=ps[e.b],coords=`x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}"`;
      out+=`<g class="${selectedLine===String(i)?'geo-selected':''}" ${full?'':`data-line="${i}" role="button" tabindex="0" aria-label="Подсветить отрезок ${esc(e.a+e.b)}"`}><line ${coords} class="geo-line ${e.stage?'geo-new':''}" ${e.dashed?'stroke-dasharray="7 6"':''}/><line ${coords} class="geo-hit"/>`;
      if(e.arrow){const dx=X(b.x)-X(a.x),dy=Y(b.y)-Y(a.y),ang=Math.atan2(dy,dx),tipx=X(b.x),tipy=Y(b.y);out+=`<path d="M${tipx-12*Math.cos(ang-.4)},${tipy-12*Math.sin(ang-.4)} L${tipx},${tipy} L${tipx-12*Math.cos(ang+.4)},${tipy-12*Math.sin(ang+.4)}" class="geo-line"/>`;}
      out+='</g>';
    });
    v.decorations.forEach(d=>{if(d.kind==='right')out+=`<path d="M${X(d.x+d.size)},${Y(d.y)} L${X(d.x+d.size)},${Y(d.y+d.size)} L${X(d.x)},${Y(d.y+d.size)}" class="geo-line"/>`;});
    Object.entries(ps).forEach(([name,p])=>{if(p.stage>phase)return;const cx=X(p.x),cy=Y(p.y),centerX=300,centerY=180;let ox=cx>=centerX?10:-20,oy=cy>=centerY?24:-12;if(name==='O')ox=10;
      out+=`<circle cx="${cx}" cy="${cy}" r="3.3" class="geo-point"/><text x="${cx+ox}" y="${cy+oy}" class="geo-label">${esc(name)}</text>`;
    });
    v.labels.filter(l=>(l.stage||0)<=phase).forEach(l=>out+=`<text x="${X(l.x)}" y="${Y(l.y)}" class="geo-label">${esc(l.text)}</text>`);
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Авторский чертёж: ${esc(t.title)}"><title>${esc(t.title)}</title>${out}</svg>`;
  }
  const maxPhase=t=>Math.max(0,...t.model.lines.map(e=>e.stage||0),...Object.values(t.model.points).map(p=>p.stage||0),...t.model.circles.map(e=>e.stage||0));
  const phase=(t,p)=>Math.max(p.modelStage,p.mode==='guided'?p.done:0);
  function draw(t,p){
    const el=document.getElementById('drawing');if(el)el.innerHTML=svg(t,phase(t,p));
    el?.querySelectorAll('[data-line]').forEach(g=>{
      const select=()=>{selectedLine=g.dataset.line;draw(t,p);const e=t.model.lines[Number(selectedLine)];document.getElementById('model-tip').textContent='Выбран отрезок '+e.a+e.b+'.';document.querySelector(`[data-line="${selectedLine}"]`)?.focus();};
      g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
    });
  }
  function field(label,value,index,kind){return `<div class="field"><label for="${kind}-${index}">${fmt(label)}</label><input id="${kind}-${index}" data-${kind}="${index}" type="text" autocomplete="off" spellcheck="false" maxlength="180" value="${esc(value||'')}"></div>`;}
  function renderStep(t,p,i){
    const s=t.steps[i],done=i<p.done,hint=p.hints.includes(i),reveal=p.reveals.includes(i);
    if(done)return `<article class="step done"><span class="step-label">Шаг ${i+1} · ${reveal?'показан разбор':'выполнен'}</span><h3>${fmt(s.prompt)}</h3><p>${fmt(s.explain)}</p></article>`;
    return `<article class="step active" id="active-step"><span class="step-label">Шаг ${i+1} из ${t.steps.length}</span><h3 id="step-prompt">${fmt(s.prompt)}</h3>${s.options?`<div class="choices" aria-labelledby="step-prompt">${s.options.map((o,j)=>`<button type="button" data-choice="${j}" class="${p.stepDrafts[i]===o?'chosen':''}">${fmt(o)}</button>`).join('')}</div>`:`<form id="step-form">${field(s.prompt,p.stepDrafts[i],i,'step')}<button class="primary" type="submit">Проверить шаг</button></form>`}<div class="feedback ${feedback?.kind||''}" role="status">${feedback?.area==='step'?esc(feedback.text):''}</div><button class="help-button" type="button" id="hint">${hint?'Скрыть подсказку':'Хочешь подсказку?'}</button>${hint?`<div class="hint"><p>${fmt(s.hint)}</p>${reveal?`<p class="solution-note">${fmt(s.explain)}</p><button type="button" id="advance-shown">Продолжить после разбора →</button>`:'<button type="button" id="reveal">Показать этот шаг</button>'}</div>`:''}</article>`;
  }
  function finalForm(t,p){
    if(t.answers)return `<section class="card" id="final-answer"><h2>${p.mode==='guided'?'Запиши итог задачи':'Решаю самостоятельно'}</h2><form id="answer-form">${t.answers.map((a,j)=>field(a.label,p.drafts[j],j,'answer')).join('')}<button class="primary" type="submit">Проверить ответ</button></form><p class="info">Числа вводи без единиц. Подойдут десятичная запятая, дробь 5/7, sqrt(7), 20*pi. Если требуется округление, точность указана над полем.</p><div class="feedback ${feedback?.kind||''}" role="status">${feedback?.area==='final'?esc(feedback.text):''}</div>${p.checked?`<p class="badge">${esc(M.status(p,t))}</p>`:''}</section>`;
    return `<section class="card manual"><h2>Запись для проверки</h2><p class="info">Доказательство или построение проверяется по смыслу. Запиши рассуждение здесь или выполни чертёж в тетради и отметь это в записи. Эти отметки — самопроверка, а не автоматическая оценка.</p><label for="proof-notes"><strong>Моё доказательство или запись о построении</strong></label><textarea id="proof-notes" maxlength="5000">${esc(p.notes)}</textarea>${t.checks.map((s,j)=>`<label class="check-item"><input type="checkbox" data-selfcheck="${j}" ${p.checks[j]?'checked':''}><span>${esc(s)}</span></label>`).join('')}<button type="button" class="primary" id="save-proof">Сохранить для проверки</button><div class="feedback ${feedback?.kind||''}" role="status">${feedback?.area==='manual'?esc(feedback.text):''}</div>${p.manual?'<p class="badge">Запись сохранена. Обсуди её с преподавателем.</p>':''}</section>`;
  }
  function taskView(u,t){
    current=t.id;const r=record(t),p=r.p;const localIndex=u.tasks.findIndex(x=>x.id===t.id);
    main.innerHTML=`<nav class="crumb"><a href="#">Все разделы</a><span>›</span><a href="${unitLink(u)}">§ ${u.id}. ${esc(u.title)}</a></nav>${source(u,t)}<h1 class="task-heading">${esc(t.title)}</h1><p class="intro">${fmt(t.goal)}</p>${r.blocked?`<div class="alert">${esc(r.reason)} <button id="reload-state" type="button">Открыть сохранённую версию</button></div>`:''}<div class="workspace"><div class="workpane"><div class="mode-switch"><button id="independent" type="button" class="${p.mode==='independent'?'selected':''}">Решаю сам</button><button id="guided" type="button" class="${p.mode==='guided'?'selected':''}">Разобрать по шагам</button></div><details id="theory" class="card rules" ${p.theory?'open':''}><summary>Нужное правило</summary>${rules(u)}</details>${p.mode==='guided'?t.steps.slice(0,Math.min(t.steps.length,p.done+1)).map((_,i)=>renderStep(t,p,i)).join(''):''}${p.mode==='guided'&&p.done===t.steps.length?'<p class="complete">Разбор завершён. Все шаги остались на экране. Теперь запиши итог.</p>':''}${p.mode==='independent'||p.done===t.steps.length?finalForm(t,p):''}</div><aside class="model-card"><figure><div id="drawing"></div><figcaption>${esc(t.model.caption)}</figcaption></figure><div class="model-tools"><button id="enlarge" type="button">Увеличить чертёж</button>${maxPhase(t)>0?`<button id="construction" type="button" ${phase(t,p)>=maxPhase(t)?'disabled':''}>Следующее построение</button>`:''}</div><p class="model-tip" id="model-tip">Нажми на отрезок, чтобы выделить его.</p>${t.notes?`<p class="info">${fmt(t.notes)}</p>`:''}</aside></div><div class="task-footer"><a class="button" href="${unitLink(u)}">Все задачи § ${u.id}</a>${localIndex+1<u.tasks.length?`<a class="button" href="${link(u.tasks[localIndex+1])}">Следующий тренажёр →</a>`:u.id<15?`<a class="button" href="#section/${u.id+1}">Следующий параграф →</a>`:''}</div><p class="footer-line">${p.assisted?'Помощь использована — эта отметка сохранится и после закрытия подсказки.':'Можно сначала решить без помощи, затем проверить ответ.'} Условие задачи находится в учебнике; здесь — авторский учебный разбор MathExam.</p>`;
    draw(t,p);
    const on=(id,event,fn)=>document.getElementById(id)?.addEventListener(event,fn);
    const rerender=()=>{save(t);taskView(u,t);};
    on('independent','click',()=>{p.mode='independent';feedback=null;rerender();});
    on('guided','click',()=>{p.mode='guided';help(t);feedback=null;rerender();});
    const theory=document.getElementById('theory');theory.addEventListener('toggle',()=>{if(current!==t.id||!theory.isConnected)return;if(theory.open===p.theory)return;p.theory=theory.open;if(p.theory)help(t);save(t);const badge=document.querySelector('#final-answer .badge');if(badge)badge.textContent=M.status(p,t);if(p.assisted)document.querySelector('.footer-line').textContent='Помощь использована — эта отметка сохранится и после закрытия подсказки. Условие задачи находится в учебнике; здесь — авторский учебный разбор MathExam.';});
    main.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('input',()=>{p.drafts[Number(el.dataset.answer)]=el.value;p.checked=false;feedback=null;save(t);document.querySelector('#final-answer .badge')?.remove();const message=document.querySelector('#final-answer .feedback');if(message)message.textContent='';}));
    main.querySelectorAll('[data-step]').forEach(el=>el.addEventListener('input',()=>{p.stepDrafts[Number(el.dataset.step)]=el.value;save(t);}));
    function checkStep(value){
      const i=p.done,s=t.steps[i];if(!s)return;p.stepDrafts[i]=value;
      if(M.check(value,s)){p.done++;feedback=null;rerender();document.getElementById('active-step')?.scrollIntoView({block:'nearest'});document.querySelector('#active-step input, #active-step button')?.focus();}
      else{feedback={area:'step',kind:'error',text:s.options?'Пока не подходит. Проверь, какое свойство можно применить именно здесь.':Number.isFinite(M.parse(value))?'Пока не совпало. Проверь действие и данные этого шага. Можно открыть подсказку.':'Введи число или выражение, например 2,5, 5/7 или sqrt(7).'};rerender();document.querySelector('#active-step input')?.focus();}
    }
    on('step-form','submit',e=>{e.preventDefault();checkStep(p.stepDrafts[p.done]||'');});
    main.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('click',()=>checkStep(t.steps[p.done].options[Number(el.dataset.choice)])));
    on('hint','click',()=>{const i=p.done;if(p.hints.includes(i))p.hints=p.hints.filter(j=>j!==i);else{p.hints.push(i);help(t);}feedback=null;rerender();document.getElementById('hint')?.focus();});
    on('reveal','click',()=>{if(!p.reveals.includes(p.done))p.reveals.push(p.done);help(t);rerender();document.getElementById('advance-shown')?.focus();});
    on('advance-shown','click',()=>{if(p.reveals.includes(p.done))p.done++;feedback=null;rerender();});
    on('answer-form','submit',e=>{
      e.preventDefault();const wrong=t.answers.map((a,i)=>M.check(p.drafts[i],a)?-1:i).filter(i=>i>=0);
      p.checked=wrong.length===0;
      feedback=p.checked?{area:'final',kind:'success',text:'Все числовые ответы совпали. Объясни, почему получился такой результат.'}:{area:'final',kind:'error',text:'Проверь: '+wrong.map(i=>t.answers[i].label).join('; ')+'. Ответы сохранились.'};rerender();document.getElementById('final-answer')?.scrollIntoView({block:'nearest'});
    });
    on('proof-notes','input',e=>{p.notes=e.target.value;p.manual=false;feedback=null;document.querySelector('.manual .badge')?.remove();const message=document.querySelector('.manual .feedback');if(message)message.textContent='';save(t);});
    main.querySelectorAll('[data-selfcheck]').forEach(el=>el.addEventListener('change',()=>{p.checks[Number(el.dataset.selfcheck)]=el.checked;save(t);}));
    on('save-proof','click',()=>{p.manual=!!p.notes.trim();feedback={area:'manual',kind:p.manual?'success':'error',text:p.manual?'Запись сохранена для обсуждения с преподавателем.':'Добавь рассуждение или напиши, что построение выполнено в тетради.'};rerender();});
    on('construction','click',()=>{p.modelStage=Math.min(maxPhase(t),phase(t,p)+1);help(t);rerender();});
    on('enlarge','click',()=>{
      dialog=document.createElement('dialog');dialog.innerHTML=`<div class="dialog-top"><h2>${esc(t.title)}</h2><button type="button" id="close-model">Закрыть</button></div>${svg(t,phase(t,p),true)}<p class="info">${esc(t.model.caption)}</p>`;document.body.append(dialog);dialog.showModal();dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();dialog=null;document.getElementById('enlarge')?.focus();});
    });
    on('reload-state','click',()=>{cache.delete(t.id);feedback=null;taskView(u,t);});
  }
  function route(){
    if(dialog)dialog.close();feedback=null;selectedLine='';
    const hash=location.hash.slice(1),m=hash.match(/^task\/(p\d+-n\d+(?:-[a-zа-я0-9-]+)?)$/),s=hash.match(/^section\/(\d+)$/);
    if(m&&tasks.has(m[1])){const {u,t}=tasks.get(m[1]);taskView(u,t);}
    else if(s&&units.has(Number(s[1])))section(units.get(Number(s[1])));
    else if(hash&&hash!=='main'){current=null;main.innerHTML='<h1>Тренажёр не найден</h1><p>В этой подборке такого адреса нет. Выбери номер в оглавлении.</p><a class="button" href="#">Открыть оглавление</a>';}
    else home();
    window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',route);
  document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();main.focus();});
  window.addEventListener('storage',e=>{if(!e.key?.startsWith(prefix))return;const id=e.key.slice(prefix.length),r=cache.get(id);if(!r||e.newValue===r.expected)return;r.blocked=true;r.reason='В другой вкладке изменилась запись этой задачи. Скачай свою работу перед открытием новой версии.';if(current===id){const {u,t}=tasks.get(id);taskView(u,t);}});
  document.getElementById('export').addEventListener('click',()=>{
    const work={course:'Курс к учебнику Погорелова',edition:2022,exportedAt:new Date().toISOString(),storage:'Личные записи, сохранённые в этом браузере',tasks:[]};
    for(const {u,t} of tasks.values()){const p=record(t).p;if(p.notes||p.done||p.checked||p.assisted||p.drafts.some(Boolean)||p.stepDrafts.some(Boolean))work.tasks.push({reference:ref(u,t),id:t.id,status:M.status(p,t),work:p});}
    const url=URL.createObjectURL(new Blob([JSON.stringify(work,null,2)],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Pogorelov_moya_rabota.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);storageNote.textContent='Подготовлена копия твоих записей. Её можно передать преподавателю; на сервер ничего не отправлено.';
  });
  route();
})();
