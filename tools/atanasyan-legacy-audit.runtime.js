/* Personal notebook for retained Atanasyan trainers. No legacy progress writes. */
(function (win, doc) {
  'use strict';
  if (win.Geometry7Native || new URLSearchParams(win.location.search).get('g7-board') === '1') return;
  const config = JSON.parse(doc.getElementById('atanasyan-notebook-config').textContent);
  const key = 'mathExamGeometryNotebook.v1.' + config.id;
  const fields = ['prediction', 'reflection', 'next'];
  const short = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
  const validTime = n => Number.isFinite(n) && n >= 0 ? n : 0;
  const clean = data => ({version: 1, updated: validTime(data?.updated),
    prediction: short(data?.prediction, 4000), reflection: short(data?.reflection, 4000), next: short(data?.next, 1000),
    events: Array.isArray(data?.events) ? data.events.slice(-80).filter(e => e && typeof e.type === 'string').map(e => ({type:short(e.type,40),at:validTime(e.at),task:short(e.task,40)})) : [],
    checkpoints: Array.isArray(data?.checkpoints) ? data.checkpoints.slice(-20).filter(c => c && validTime(c.at)).map(c => ({at:validTime(c.at),due:validTime(c.due),days:c.days===7?7:1,summary:short(c.summary,4000)})) : []});
  let state = clean(null), savedVersion = 0, unavailable = false, conflict = false;
  const recovered = [];
  function read() {
    const raw = win.localStorage.getItem(key);
    if (!raw) return clean(null);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed !== 'object') throw Error('Unrecognized notebook');
    return clean(parsed);
  }
  try { state = read(); savedVersion = state.updated; } catch (_) { unavailable = true; }
  const style = doc.createElement('style');
  style.textContent = '#atanasyan-notebook{max-width:980px;margin:16px auto;padding:12px 16px;border:1px solid #bccac6;border-radius:12px;background:#f8fbfa;color:#203c35;font:15px/1.5 system-ui;text-align:left;box-sizing:border-box}#atanasyan-notebook *{box-sizing:border-box}#atanasyan-notebook summary{cursor:pointer;font-weight:700}#atanasyan-notebook label{display:block;margin-top:12px;font-weight:600}#atanasyan-notebook textarea{display:block;width:100%;min-height:76px;margin-top:6px;padding:8px;font:inherit;border:1px solid #b3c5bf;border-radius:6px;background:#fff;color:#16362a;resize:vertical}#atanasyan-notebook p{margin:8px 0}#atanasyan-notebook button,#atanasyan-notebook select{font:inherit;white-space:normal;margin:6px 6px 0 0;padding:7px 10px;border:1px solid #78978c;border-radius:6px;background:#fff;color:#173e30}#atanasyan-notebook a{color:#165b46;text-decoration:underline;overflow-wrap:anywhere}#atanasyan-notebook .an-note{font-size:13px;color:#48665c}#atanasyan-notebook [role=status]{font-size:13px}#atanasyan-notebook li{margin:4px 0}#atanasyan-notebook .an-warning{color:#8b301c}';
  doc.head.append(style);
  const panel = doc.createElement('details'); panel.id = 'atanasyan-notebook';
  panel.innerHTML = '<summary>Моя попытка, разбор и повторение</summary><p class="an-note">Короткий цикл: попробуй 1–2 минуты сам, обсуди затруднение, затем проверь себя на новом условии.</p><label>До обсуждения: мой ответ или прогноз<textarea data-note="prediction" maxlength="4000"></textarea></label><p class="an-note" data-prompt></p><label>После опыта или ошибки: что изменилось в моём рассуждении?<textarea data-note="reflection" maxlength="4000" placeholder="Я думал(а)… Проверка показала… Теперь я учитываю…"></textarea></label><label>Мой следующий шаг<textarea data-note="next" maxlength="1000" placeholder="Например: проверить, между какими сторонами дан угол; решить новый вариант."></textarea></label><p data-journal class="an-note"></p><details><summary>События этой тетради</summary><ol data-events></ol></details><p class="an-note">Журнал фиксирует сигналы тренажёра с момента появления тетради. Верный шаг, просмотр разбора и старый зачёт не подтверждают самостоятельное освоение. Текст сохранён для обсуждения с учителем и автоматически не оценивается.</p><p><a data-practice>Связанная тема для новой практики →</a></p><p class="an-note">В теме выбери «Самостоятельно»: там будет новый вариант основного типа задач этого урока. Известное условие отмечается как повторение.</p><details><summary>Обсудить в мини-группе</summary><p>Сначала каждый записывает свой ответ. Затем распределите роли: объясни ход; проверь условие и основание; задай вопрос; подведи итог. После обсуждения каждый решает новый вариант лично.</p></details><label>Когда вернуться к теме?<select data-days aria-label="Срок повторения"><option value="1">Через день</option><option value="7">Через неделю</option></select></label><button type="button" data-checkpoint>Зафиксировать итог и повторение</button><p data-review class="an-note"></p><p class="an-note">Дата повторения — твоя отметка для планирования, она не добавляет самостоятельный успех и не создаёт уведомление.</p><button type="button" data-export>Скачать тетрадь</button><button type="button" data-latest hidden>Открыть более свежую запись</button><details data-recovery hidden><summary>Записи прежней вкладки</summary><div data-recovery-notes></div></details><p data-status role="status" aria-live="polite"></p><p class="an-note">Тетрадь хранится в этом браузере. Она сохраняет записи и журнал, но не восстанавливает положение старого тренажёра.</p>';
  doc.body.append(panel);
  const toolbar=doc.querySelector('.bar');
  if(toolbar){toolbar.style.flexWrap='wrap';const open=doc.createElement('button');open.id='atanasyan-notebook-open';open.type='button';open.textContent='Моя попытка';open.setAttribute('aria-controls',panel.id);open.addEventListener('click',()=>{panel.open=true;panel.scrollIntoView({block:'start'});panel.querySelector('[data-note="prediction"]').focus({preventScroll:true});});toolbar.append(open);}
  panel.querySelector('[data-prompt]').textContent = config.prompt;
  panel.querySelector('[data-practice]').setAttribute('href', '../atlas/' + config.unit + '.html');
  const status = panel.querySelector('[data-status]');
  function warn(message) { status.textContent = message; status.className = 'an-warning'; }
  function flagConflict() {
    conflict = true;
    warn('В другой вкладке появилась более свежая запись. Эта тетрадь приостановлена. Скачай свои записи перед открытием свежей версии.');
    fields.forEach(field => { panel.querySelector('[data-note="'+field+'"]').readOnly = true; });
    panel.querySelector('[data-checkpoint]').disabled = true;
    panel.querySelector('[data-latest]').hidden = false;
  }
  function save() {
    if (conflict) return false;
    if (!unavailable) {
      try {
        if (read().updated !== savedVersion) { flagConflict(); return false; }
        state.updated = Math.max(Date.now(), savedVersion + 1);
        win.localStorage.setItem(key, JSON.stringify(state)); savedVersion = state.updated;
      } catch (_) { unavailable = true; }
    }
    if (unavailable) warn('Сохранение браузера недоступно. Записи доступны в этой вкладке: скачай тетрадь перед закрытием.');
    else { status.className=''; status.textContent='Записи сохранены в этом браузере.'; }
    return true;
  }
  const labels = {hint:'Открыта подсказка',solution:'Открыто решение',reveal:'Открыто объяснение',finish:'Завершён цикл тренажёра',solved:'Завершён шаг',answer_ok:'Верный ответ',answer_wrong:'Ошибка в ответе',quiz_ok:'Верный ответ в зачёте',quiz_wrong:'Ошибка в зачёте',opt_ok:'Верный выбор',opt_wrong:'Ошибка выбора',tap_wrong:'Ошибка выбора объекта',distractor:'Выбрано отвлекающее утверждение',step_wrong:'Ошибка шага',step_reject:'Переход пока не обоснован',choice_bad:'Ошибка выбора',choice_ok:'Верный выбор',num_ok:'Верный числовой ответ',task_start:'Открыто задание',start:'Начат тренажёр',reset:'Повтор текущего шага',restart:'Начат повтор',answer:'Ответ проверен',proof_done:'Собрано доказательство с опорой'};
  function renderJournal() {
    const help=state.events.filter(e=>['hint','solution','reveal'].includes(e.type)).length;
    const errors=state.events.filter(e=>/wrong|reject|bad|distractor/.test(e.type)).length;
    panel.querySelector('[data-journal]').textContent='В последних '+state.events.length+' сохранённых событиях: помощь — '+help+', ошибки — '+errors+'.';
    const list=panel.querySelector('[data-events]'); list.replaceChildren();
    for (const event of state.events.slice(-8)) { const li=doc.createElement('li'); li.textContent=(labels[event.type] || 'Событие: '+event.type)+(event.task?' · этап '+event.task:'');list.append(li); }
    if (!list.children.length) { const li=doc.createElement('li');li.textContent='Пока нет событий. Старые результаты не пересчитываются.';list.append(li); }
    const last=state.checkpoints.at(-1);
    panel.querySelector('[data-review]').textContent=last?'Повторить '+new Date(last.due).toLocaleDateString('ru-RU')+' · по твоей отметке от '+new Date(last.at).toLocaleDateString('ru-RU')+'.':'';
  }
  function populate() { for(const field of fields) panel.querySelector('[data-note="'+field+'"]').value=state[field];renderJournal(); }
  for (const field of fields) panel.querySelector('[data-note="'+field+'"]').addEventListener('input',e=>{state[field]=e.target.value.slice(0,field==='next'?1000:4000);save();});
  panel.querySelector('[data-checkpoint]').addEventListener('click',()=>{
    if(conflict)return;
    if(!state.prediction.trim()&&!state.reflection.trim()&&!state.next.trim()){warn('Сначала запиши свой ответ, вывод или следующий шаг.');return;}
    const days=Number(panel.querySelector('[data-days]').value)===7?7:1,now=Date.now(),due=new Date(now);due.setDate(due.getDate()+days);
    state.checkpoints.push({at:now,due:due.getTime(),days,summary:state.reflection||state.next||state.prediction});state.checkpoints=state.checkpoints.slice(-20);save();renderJournal();
  });
  panel.querySelector('[data-export]').addEventListener('click',()=>{
    const blob=new win.Blob([JSON.stringify({trainer:config.id,...state,recovered},null,2)],{type:'application/json'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=config.id+'-notebook.json';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
  });
  panel.querySelector('[data-latest]').addEventListener('click',()=>{
    try { const current=read();
      const snapshot=clean(state);recovered.push(snapshot);
      const recovery=panel.querySelector('[data-recovery]');recovery.hidden=false;
      const group=doc.createElement('div');
      for(const field of fields){if(!snapshot[field])continue;const label=doc.createElement('label');label.textContent=({prediction:'Прежний прогноз',reflection:'Прежнее рассуждение',next:'Прежний следующий шаг'})[field];const area=doc.createElement('textarea');area.readOnly=true;area.value=snapshot[field];label.append(area);group.append(label);}
      recovery.querySelector('[data-recovery-notes]').append(group);
      state=current;savedVersion=current.updated;conflict=false;fields.forEach(field=>panel.querySelector('[data-note="'+field+'"]').readOnly=false);panel.querySelector('[data-checkpoint]').disabled=false;panel.querySelector('[data-latest]').hidden=true;populate();status.className='';status.textContent='Открыта свежая запись. Прежние записи доступны ниже и включены в скачиваемую тетрадь до закрытия вкладки.';} catch(_){warn('Свежую запись прочитать не удалось. Скачай записи этой вкладки.');}
  });
  function capture(type, extra) {
    if(conflict||!Object.hasOwn(labels,type))return;
    let detail=extra||{};
    try {const record=typeof win.lS==='function'?win.lS():null;const recent=record?.events?.at(-1);if(recent?.e===type)detail=recent;}catch(_){}
    let eventType=type;
    if(type==='answer'&&typeof detail.correct==='boolean')eventType=detail.correct?'answer_ok':'answer_wrong';
    const step=detail.task??detail.step??detail.q;
    state.events.push({type:eventType,at:Date.now(),task:['string','number'].includes(typeof step)?String(step).slice(0,40):''});state.events=state.events.slice(-80);save();renderJournal();
  }
  for (const name of ['log','logE']) {
    const original=win[name];if(typeof original!=='function')continue;
    win[name]=function(type,extra){const result=original.apply(this,arguments);capture(type,extra);return result;};
  }
  win.addEventListener('storage',event=>{if(event.key!==key||unavailable||conflict)return;try{if(read().updated!==savedVersion)flagConflict();}catch(_){flagConflict();}});
  populate();if(unavailable)warn('Сохранённую тетрадь прочитать не удалось. Она не перезаписана; новые записи доступны для скачивания в этой вкладке.');
})(window,document);
