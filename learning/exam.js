/* Persistent 21-question work. Drafts are revision-bound; grading happens only at finish. */
(function (root) {
  'use strict';
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const owners = new Map();
  const copy = value => JSON.parse(JSON.stringify(value));
  const date = value => new Date(value).toLocaleString('ru-RU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  function mount(host, config) {
    const {account, api, navigate, notice} = config;
    const post = (url, body) => api(url, {method:'POST',body:JSON.stringify(body),keepalive:disposed});
    const key = 'mathexam.learning.exam.' + account.id + '.' + (config.id || 'new');
    const owner=Symbol('exam-mount');owners.set(key,owner);
    let run = null, queue = [], draft = null, rejected = [], corruptedCopy = null, disposed = false, draining = false, sending = false, loading = false, retry = null, debounce = null, pollTimer = null, reference = null, lastSaved = null, viewIndex = null, transientError = '', conflicts = false;
    const owned = () => account.role === 'student' && (!run || run.learnerId === account.id);
    const pendingFinish = () => queue.some(op=>op.type==='finish');
    const pending = () => queue.length > 0 || !!draft;
    const errorText = error => error.status === 401 ? 'Войдите в кабинет снова. Неподтверждённые ответы можно скачать.' : error.status === 403 ? 'Эту работу может изменять только её ученик.' : error.status === 429 ? 'Сервер просит немного подождать. Ответы сохранены в этой вкладке.' : 'Нет связи с сервером. Ответы остаются в этой вкладке и будут отправлены после подключения.';
    function persist() {
      if(owners.get(key)!==owner)return;
      try { if(corruptedCopy!==null)return; if (pending() || rejected.length) sessionStorage.setItem(key, JSON.stringify({version:1,runId:config.id,accountId:account.id,queue,draft,rejected,conflicts})); else sessionStorage.removeItem(key); }
      catch (_) { transientError = 'Браузер не разрешил сохранить копию. Оставьте вкладку открытой до подтверждения сервера или скачайте ответы.'; }
    }
    function restoreQueue() {
      let raw=null;
      try {
        raw = sessionStorage.getItem(key); if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.version !== 1 || saved.runId !== config.id || saved.accountId !== account.id || !Array.isArray(saved.queue) || saved.queue.length > 100 || !Array.isArray(saved.rejected)) throw Error();
        const valid = op => op && typeof op.opId === 'string' && Number.isSafeInteger(op.expectedVersion) && ['answer','navigate','finish'].includes(op.type) && op.payload && typeof op.payload === 'object' && (!('answer' in op.payload) || typeof op.payload.answer === 'string' && op.payload.answer.length <= 4000);
        if (!saved.queue.every(valid) || saved.draft && !valid(saved.draft)) throw Error();
        queue = saved.queue; draft = saved.draft; rejected = saved.rejected; conflicts = saved.conflicts === undefined ? rejected.length > 0 : !!saved.conflicts;
      } catch (_) { corruptedCopy=raw; transientError = 'Копия неподтверждённых ответов повреждена. Она оставлена без изменений; показана серверная работа.'; conflicts = true; }
    }
    function effective() {
      if (!run) return null;
      const value = copy(run);
      for (const op of [...queue, ...(draft ? [draft] : [])]) {
        if (op.type === 'answer' && value.questions[op.payload.index]) value.questions[op.payload.index].answer = op.payload.answer;
        if (op.type === 'navigate') value.currentIndex = op.payload.index;
      }
      if(viewIndex!==null)value.currentIndex=viewIndex;
      return value;
    }
    function nextVersion() { return queue.length ? queue[queue.length - 1].expectedVersion + 1 : run.version; }
    function updateSaveStatus() {
      if (disposed) return;
      const el = host.querySelector('#exam-save'); if (!el) return;
      el.textContent = transientError || (pending() ? 'Сохраняем ответы…' : 'Все ответы сохранены' + (lastSaved ? ' · ' + new Date(lastSaved).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'}) : ''));
      el.classList.toggle('exam-save-warning', !!transientError || conflicts);
      const recovery = host.querySelector('#exam-recovery'); if (recovery) recovery.hidden = !rejected.length && !transientError;
      host.querySelectorAll('[data-finish-confirm]').forEach(b => b.disabled = sending || pending() || conflicts);
      const answered = effective()?.questions.filter(q => q.answer.trim()).length;
      const count = host.querySelector('#exam-answered'); if (count && answered !== undefined) count.textContent = answered + ' из 21 с ответом';
      const current = effective()?.currentIndex;
      host.querySelectorAll('[data-question]').forEach(button => { const q = effective().questions[+button.dataset.question]; button.classList.toggle('answered', !!q.answer.trim()); button.setAttribute('aria-label', 'Задание ' + q.position + (q.answer.trim() ? ', ответ записан' : ', без ответа')); button.setAttribute('aria-current', +button.dataset.question === current ? 'step' : 'false'); });
    }
    function flushDraft() { clearTimeout(debounce); debounce = null; if (draft) { queue.push(draft); draft = null; persist(); } }
    function enqueue(type, payload = {}) {
      if (!owned() || run.finishedAt || conflicts || pendingFinish()) return;
      flushDraft(); queue.push({opId:crypto.randomUUID(),expectedVersion:nextVersion(),type,payload}); persist(); updateSaveStatus(); pump();
    }
    function inputAnswer(index, answer) {
      if (!owned() || run.finishedAt || conflicts || pendingFinish()) return;
      if (draft && draft.payload.index !== index) flushDraft();
      if (!draft) draft = {opId:crypto.randomUUID(),expectedVersion:nextVersion(),type:'answer',payload:{index,answer:''}};
      draft.payload.answer = answer.slice(0,4000); persist(); updateSaveStatus(); clearTimeout(debounce); debounce = setTimeout(() => { flushDraft(); pump(); }, 350);
    }
    function download() {
      const value = {runId:run?.id,exportedAt:new Date().toISOString(),questions:effective()?.questions.map(q=>({position:q.position,question:q.taskSpec.task.q,answer:q.answer})),pending:queue,draft,rejected,...(corruptedCopy!==null?{corruptedCopy}:{})};
      const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='MathExam-exam-unsaved.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    async function recoverConflict(error) {
      rejected.push(...queue, ...(draft ? [draft] : [])); queue=[];draft=null;conflicts=true;clearTimeout(debounce);persist();if(!disposed)host.querySelectorAll('#exam-answer,.exam-numbers button,#exam-prev,#exam-next,#exam-finish').forEach(el=>el.disabled=true);
      transientError='Работа изменилась на другом устройстве. Открыта новая серверная версия. Ваши неподтверждённые ответы сохранены отдельно — скачайте их перед продолжением.';
      try { run=await api('/runs/'+encodeURIComponent(config.id)); } catch (_) { /* preserve the last confirmed snapshot */ }
      if(!disposed)notice(transientError,true); renderRun();
    }
    async function pump() {
      if (sending || disposed && !draining || !run || !queue.length || conflicts) return;
      sending=true;const op=queue[0];
      try {
        const result=await post('/runs/'+encodeURIComponent(run.id)+'/actions',op);
        const changed=result.run;if(!changed||changed.id!==run.id)throw Error('INVALID_RUN');
        queue.shift();run=changed;lastSaved=Date.now();transientError='';persist();
        if ((queue.length||draft) && changed.version!==op.expectedVersion+1) { await recoverConflict(); return; }
        if (run.finishedAt) { queue=[];draft=null;persist();renderRun();if(!disposed&&typeof config.onRefresh==='function')Promise.resolve(config.onRefresh()).catch(()=>{}); }
        else updateSaveStatus();
      } catch (error) {
        if (error.status===409) await recoverConflict(error);
        else { transientError=errorText(error);persist();updateSaveStatus();clearTimeout(retry);if(!disposed&&![400,401,403].includes(error.status))retry=setTimeout(pump,error.status===429?2500:1800); }
      } finally {sending=false;updateSaveStatus();if((!disposed||draining)&&queue.length&&!transientError&&!conflicts)pump();}
    }
    async function poll() {
      if(disposed||loading||sending||pending()||!run||run.finishedAt||document.hidden)return;
      loading=true;try{const latest=await api('/runs/'+encodeURIComponent(run.id));if(disposed)return;if(latest.version!==run.version){run=latest;renderRun();}if(!conflicts){transientError='';updateSaveStatus();}}catch(error){transientError=errorText(error);updateSaveStatus();}finally{loading=false;}
    }
    function gotoQuestion(index) { if(index<0||index>20)return;if(!owned())viewIndex=index;else enqueue('navigate',{index});renderRun(); }
    function renderRun() {
      if(disposed||!run)return;reference?.destroy();reference=null;
      const value=effective(), q=value.questions[value.currentIndex], finished=!!value.finishedAt, editable=owned()&&!finished&&!conflicts&&!pendingFinish();
      host.innerHTML=`<section class="exam-workspace"><div class="page-heading"><div><a class="back-link" href="#exam">← Проверочные работы</a><p class="eyebrow">${value.kind==='diagnostic'?'ДИАГНОСТИКА':'ПРОБНАЯ РАБОТА'} · 21 ЗАДАНИЕ</p><h1>${value.result?.cancelled?'Работа остановлена':finished?'Разбор результатов':'Проверь себя целиком'}</h1><p>${value.result?.cancelled?'Прогресс начат заново. Для новой проверки начните другую работу.':finished?'Ответы проверены. Выберите трудность и закрепите её на новом условии.':'Можно переходить между заданиями и продолжить позже на другом устройстве. Ответы проверим после завершения.'}</p></div>${finished&&!value.result.cancelled?`<div class="exam-result-number">${value.result.correct}<span> / 21</span></div>`:''}</div><div class="exam-meta"><span id="exam-answered"></span><span>Начато ${date(value.startedAt)}</span><span id="exam-save" role="status"></span></div><div id="exam-recovery" class="exam-recovery" hidden><button id="exam-download">Скачать неподтверждённые ответы</button>${conflicts?'<button id="exam-resume-server">Продолжить с серверной версии</button>':'<button id="exam-retry">Повторить отправку</button>'}</div>${finished?'<div id="exam-results"></div>':`<nav class="exam-numbers" aria-label="Задания проверочной работы">${value.questions.map(question=>`<button data-question="${question.index}" class="${question.answer.trim()?'answered':''}" ${question.index===value.currentIndex?'aria-current="step"':''}>${question.position}</button>`).join('')}</nav><div class="exam-question-grid"><section class="exam-question"><span class="badge neutral">Задание ${q.position}</span><h2>${E(q.title)}</h2><p class="exam-condition">${E(q.taskSpec.task.q)}</p>${root.PathPracticeView.markup(q.taskSpec.task)}<form id="exam-answer-form"><label for="exam-answer">Ваш ответ</label><input id="exam-answer" type="text" maxlength="4000" autocomplete="off" placeholder="${q.taskSpec.task.answerKind==='match'?'Четыре цифры, например 2413':q.taskSpec.task.answerKind==='multi'?'Номера подходящих вариантов':'Ответ'}" ${editable?'':'disabled'}><p class="exam-answer-note">Сохраняется введённый ответ. Правильность пока не показывается.</p><div class="actions"><button id="exam-prev" type="button" ${value.currentIndex===0||owned()&&!editable?'disabled':''}>← Предыдущее</button><button id="exam-next" type="submit" class="primary" ${value.currentIndex===20||owned()&&!editable?'disabled':''}>Следующее →</button></div></form></section><aside><div id="exam-reference"></div><section class="exam-completion"><h3>Завершение работы</h3><p>Время не прерывает работу автоматически. Незавершённую работу можно продолжить.</p><button id="exam-finish" ${editable?'':'disabled'}>Завершить и проверить</button><div id="exam-finish-review" hidden></div></section></aside></div>`}</section>`;
      host.querySelector('#exam-download').onclick=download;
      host.querySelector('#exam-retry')?.addEventListener('click',()=>{transientError='';flushDraft();pump();});
      host.querySelector('#exam-resume-server')?.addEventListener('click',()=>{if(corruptedCopy!==null){rejected.push({type:'invalid-copy',raw:corruptedCopy});corruptedCopy=null;}conflicts=false;transientError='';notice('');persist();renderRun();});
      if(finished){renderResults(value);updateSaveStatus();return;}
      host.querySelectorAll('[data-question]').forEach(button=>{button.disabled=owned()&&!editable;button.onclick=()=>gotoQuestion(+button.dataset.question);});
      const input=host.querySelector('#exam-answer');input.value=q.answer;input.oninput=()=>inputAnswer(q.index,input.value);
      host.querySelector('#exam-answer-form').onsubmit=e=>{e.preventDefault();if((editable||!owned())&&value.currentIndex<20)gotoQuestion(value.currentIndex+1);};
      host.querySelector('#exam-prev').onclick=()=>gotoQuestion(value.currentIndex-1);
      host.querySelector('#exam-finish').onclick=()=>{
        flushDraft();pump();const empty=effective().questions.filter(question=>!question.answer.trim()).length,panel=host.querySelector('#exam-finish-review');panel.hidden=false;
        panel.innerHTML=`<p>${empty?'Без ответа осталось '+empty+' заданий. Они будут отмечены как нерешённые.':'Ответы записаны во всех 21 заданиях.'} После завершения изменить ответы этой работы нельзя.</p><button data-finish-confirm class="primary">Подтверждаю завершение</button><button id="exam-finish-cancel">Вернуться к решению</button>`;
        panel.querySelector('[data-finish-confirm]').onclick=()=>{if(pending()||sending||conflicts)return;enqueue('finish',{});renderRun();};panel.querySelector('#exam-finish-cancel').onclick=()=>panel.hidden=true;updateSaveStatus();
      };
      reference=root.LearningReferences?.mount(host.querySelector('#exam-reference'),{mode:value.kind});
      updateSaveStatus();
    }
    function renderResults(value) {
      const box=host.querySelector('#exam-results'),rows=value.result.byPosition||[],wrong=rows.filter(row=>!row.correct),seen=value.questions.some(q=>q.previouslySeen);
      if(value.result.cancelled){box.innerHTML='<section class="empty"><h2>Прогресс начат заново</h2><p>Эта работа остановлена. Она не является завершённой проверкой.</p><a class="button" href="#exam">Начать новую работу</a></section>';return;}
      const outcomeLabel={independent:'Решено самостоятельно',practiced:'Решено: знакомое задание',hinted:'Решено с подсказкой',together:'Разобрали вместе',started:'Начато'};
      box.innerHTML=`${value.result.assisted?'<p class="exam-result-context">Во время проверки было открыто обучение или получена помощь. Правильные ответы сохранены с этой отметкой.</p>':''}<p class="exam-result-context">${value.result.answered} ответов из 21.${seen?' Некоторые условия уже встречались: эта работа не считается новой независимой проверкой всех навыков.':''} Результат относится к этому варианту и не означает полного освоения всех типов задач.</p>${wrong.length?`<h2>Что закрепить дальше</h2><p>Начните с одного затруднения. Совместный разбор сохранится отдельно от новой самостоятельной проверки.</p>`:'<h2>Все задания этого варианта решены</h2><p>Попробуйте другие типы и вернитесь к трудным темам позже.</p>'}<div class="exam-results-list">${rows.map(row=>{const question=value.questions[row.index];return `<details class="exam-result ${row.correct?'correct':'incorrect'}"><summary><span class="exam-result-mark">${row.correct?'✓':'↗'}</span><b>№${row.position}. ${E(question.title)}</b><span>${row.correct?E(outcomeLabel[row.outcome]||'Верно'):'Закрепить'}</span></summary><p>${E(question.taskSpec.task.q)}</p>${root.PathPracticeView.markup(question.taskSpec.task)}<p>Ваш ответ: <strong>${E(row.answer||'пропущено')}</strong></p><p>Правильный ответ: <strong>${E(row.expectedText||'Проверяются все условия задачи')}</strong></p>${row.previouslySeen?'<p class="muted">Знакомое условие — повторное упражнение.</p>':''}<ol>${(row.steps||[]).map(step=>`<li><p>${E(step.q)}</p>${step.a!==undefined?`<b>${E(root.PathData.answerText(step))}</b>`:''}<p>${E(step.why)}</p></li>`).join('')}</ol><div class="actions"><button data-practice="${row.index}" class="primary">Новый похожий вариант</button><a class="button" href="#attempt=${encodeURIComponent(row.attemptId)}">Сохранённая работа</a></div></details>`;}).join('')}</div>`;
      box.querySelectorAll('[data-practice]').forEach(button=>{button.disabled=!owned();button.onclick=async()=>{button.disabled=true;const row=rows.find(r=>r.index===+button.dataset.practice),question=value.questions[row.index];try{const result=await post('/attempts',{opId:crypto.randomUUID(),trainerId:question.trainerId,contentId:question.contentId,fresh:true,sourceAttemptId:row.attemptId});navigate('attempt='+result.attempt.id);}catch(error){notice(errorText(error),true);button.disabled=false;}};});
    }
    async function landing() {
      const result=await api('/runs');if(disposed)return;
      const runs=result.runs||[];
      host.innerHTML=`<section class="exam-landing"><p class="eyebrow">БАЗОВЫЙ ЕГЭ · ПОЛНЫЙ ВАРИАНТ</p><h1>21 задание — одна работа</h1><p class="lead">Проверьте, какие знания удаётся применять самостоятельно. Начатая работа сохраняет те же условия и ответы на разных устройствах.</p><div class="exam-start-options"><section><h2>Пробная работа</h2><p>По одному заданию на каждую позицию. Ориентир — 180 минут, без принудительного завершения.</p><button data-start="exam" class="primary" ${account.role==='student'?'':'disabled'}>Начать пробную работу</button></section><section><h2>Диагностика</h2><p>21 задание без ограничения времени. После завершения выберем, с каких трудностей начать обучение.</p><button data-start="diagnostic" ${account.role==='student'?'':'disabled'}>Начать диагностику</button></section></div><p class="exam-limits">Авторские варианты охватывают 21 позицию. Одна работа не проверяет все подтипы экзамена.${account.role!=='student'?' Проверочные работы выполняются из кабинета ученика.':''}</p><h2>Сохранённые работы</h2><div class="exam-run-list">${runs.map(r=>`<a href="#run=${encodeURIComponent(r.id)}" class="exam-run-card"><span>${r.kind==='diagnostic'?'Диагностика':'Пробная работа'}</span><strong>${r.result?.cancelled?'Работа остановлена':r.finishedAt?r.result.correct+' / 21':'Продолжить с задания '+(r.currentIndex+1)}</strong><small>${date(r.startedAt)}${r.result?.cancelled?' · прогресс начат заново':r.finishedAt?' · завершена':' · не завершена'}</small></a>`).join('')||'<p class="empty">Здесь появятся начатые и завершённые работы.</p>'}</div></section>`;
      host.querySelectorAll('[data-start]').forEach(button=>button.onclick=async()=>{if(loading)return;loading=true;button.disabled=true;try{button.dataset.opId=button.dataset.opId||crypto.randomUUID();const result=await post('/runs',{opId:button.dataset.opId,kind:button.dataset.start});if(!disposed)navigate('run='+result.run.id);}catch(error){notice(errorText(error),true);button.disabled=false;}finally{loading=false;}});
    }
    const onOnline=()=>{transientError='';flushDraft();pump();poll();};
    const onLeave=event=>{if(pending()){persist();event.preventDefault();event.returnValue='';}};
    const onVisibility=()=>{if(!document.hidden){flushDraft();pump();poll();}};
    root.addEventListener('online',onOnline);root.addEventListener('beforeunload',onLeave);document.addEventListener('visibilitychange',onVisibility);
    host.innerHTML='<section class="loading-panel"><p>Открываем проверочную работу…</p></section>';
    (async()=>{try{if(config.id){run=await api('/runs/'+encodeURIComponent(config.id));if(disposed)return;restoreQueue();if(run.finishedAt&&pending()){rejected.push(...queue,...(draft?[draft]:[]));queue=[];draft=null;conflicts=true;persist();}renderRun();flushDraft();pump();pollTimer=setInterval(poll,3000);}else await landing();}catch(error){if(disposed)return;notice(errorText(error),true);host.innerHTML='<section class="empty"><h1>Работа временно недоступна</h1><p>Сохранённые условия и ответы остаются на сервере.</p><a class="button" href="#exam">К проверочным работам</a></section>';}})();
    return {destroy(){flushDraft();persist();disposed=true;draining=true;clearTimeout(retry);clearTimeout(debounce);clearInterval(pollTimer);reference?.destroy();root.removeEventListener('online',onOnline);root.removeEventListener('beforeunload',onLeave);document.removeEventListener('visibilitychange',onVisibility);pump();}};
  }
  root.LearningExam=Object.freeze({mount});
})(window);
