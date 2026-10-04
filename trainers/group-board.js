/* Group lesson controller. The server owns assignments, permissions and history. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const DEFAULT_SERVER = 'https://mathexam-board-ladynata.amvera.io';
  const TRAINERS = {
    'negative-numbers-line': 'Отрицательные числа на прямой',
    'linear-inequalities-stepwise': 'Линейные неравенства — пошагово'
  };
  let credentials = null, snapshot = null, sheet = 0, selected = null;
  let connected = false, polling = false, sending = false, stopped = false;
  let focusFrame = null, focusKey = '', cardKey = '', historyEvents = null;
  let watchFrame = null, watchKey = '', watchBoard = false;
  let historyWorkspace = null, historyInitial = null, drawing = null, tool = 'pen', outbox = [], rejected = [];
  const cardFrames = new Map(), cardCanvases = new Map();
  const waiters = new Map();
  const timers = new Set();
  const uuid = () => crypto.randomUUID();
  const clone = value => JSON.parse(JSON.stringify(value));
  const teacher = () => snapshot?.role === 'teacher';
  const target = () => selected || (teacher() ? null : snapshot?.seatId);
  const workspace = id => id === 'presentation' ? snapshot?.presentation?.workspace : id === 'common' ? snapshot?.common : snapshot?.students?.find(s => s.id === id)?.workspace;
  const seat = id => snapshot?.students?.find(s => s.id === id);
  const sessionKey = id => 'mathexam.group.session.' + id;
  const queueKey = () => 'mathexam.group.outbox.' + credentials.id;
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

  function serverUrl(raw) {
    const url = new URL(raw);
    if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw Error('Укажите только адрес сервера.');
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw Error('Нужен защищённый адрес сервера.');
    return url.origin;
  }
  function errorText(error) {
    if (error?.name === 'AbortError' || error instanceof TypeError) return 'Нет связи. Несохранённые действия остаются в этой вкладке; отправка продолжится после подключения.';
    const code = error.code || error.message;
    const map = {
      GROUP_STORAGE_NOT_CONFIGURED: 'На сервере ещё не включено постоянное хранение групповых занятий.',
      GROUP_STORAGE_UNAVAILABLE: 'Сервер сейчас не может открыть сохранённые занятия.',
      GROUP_STORAGE_WRITE_FAILED: 'Сервер сейчас не может сохранить работу. Действия остаются в этой вкладке.',
      GROUP_STORE_LIMIT_EXCEEDED: 'Хранилище занятия заполнено. Скачайте запись; новые действия пока не сохранены.',
      GROUP_UNAUTHORIZED: 'Ссылка доступа недействительна. Попросите новую ссылку у преподавателя.',
      GROUP_FORBIDDEN: 'Для этого действия нет доступа.',
      GROUP_ASSIGNMENT_STALE: 'Задание уже изменилось. Прежнее действие не применено; оно доступно в экспорте.',
      GROUP_STATE_CONFLICT: 'Работа обновилась на другом устройстве. Прежнее действие сохранено отдельно для проверки.',
      GROUP_CONTROL_REQUIRED: 'Управление тренажёром передано другому участнику.',
      STORAGE_UNAVAILABLE: 'Сервер сейчас не может сохранить работу. Попробуйте позже.',
      GROUP_NOT_FOUND: 'Занятие не найдено. Проверьте ссылку.',
      UNAUTHORIZED: 'Ссылка доступа недействительна. Попросите новую ссылку у преподавателя.',
      FORBIDDEN: 'Для этого действия нет доступа.',
      STALE_ASSIGNMENT: 'Задание уже изменилось. Прежнее действие не применено; оно доступно в экспорте.',
      VERSION_CONFLICT: 'Работа обновилась на другом устройстве. Прежнее действие сохранено отдельно для проверки.',
      TRAINER_VERSION_CONFLICT: 'Управление или ответ уже изменились. Прежнее действие сохранено отдельно для проверки.'
    };
    return map[code] || (error.status ? 'Действие не сохранено сервером (' + code + '). Его можно скачать вместе с записью.' : String(code || 'Не удалось выполнить действие.'));
  }
  function notice(text, error = false) {
    const node = $(error ? 'errorNotice' : 'notice');
    node.textContent = text;
    node.hidden = !text;
  }
  function saveQueue() {
    try { sessionStorage.setItem(queueKey(), JSON.stringify({outbox, rejected})); }
    catch (_) { notice('Браузер не сохранил резервную копию. Не закрывайте вкладку до отправки действий.', true); }
  }
  async function request(path, options = {}, auth = true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(credentials.server + path, {
        ...options, signal: controller.signal, cache: 'no-store', credentials: 'omit',
        headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(auth ? {Authorization:'Bearer ' + credentials.token} : {}), ...options.headers }
      });
      let data;
      try { data = await res.json(); } catch (_) { throw Object.assign(Error('SERVER_RESPONSE_INVALID'), {status:res.status}); }
      if (!res.ok) throw Object.assign(Error(data.error || 'HTTP_' + res.status), {code:data.error, status:res.status});
      return data;
    } finally { clearTimeout(timeout); }
  }
  function accept(data) {
    if (!data || !Array.isArray(data.students) || data.id !== credentials.id) return;
    if (snapshot && data.revision < snapshot.revision) return;
    if (data.partial) {
      if (!snapshot) return;
      const previous = snapshot;
      snapshot = {...previous, ...data,
        students:data.students.map(student=>({...previous.students.find(s=>s.id===student.id),...student})),
        common:data.common || previous.common, invites:previous.invites};
      if(data.presentation?.target&&data.presentation.target===previous.presentation?.target) {
        snapshot.presentation={...previous.presentation,...data.presentation};
      }
    } else snapshot = data;
    connected = true;
    if (!teacher() && !selected) selected = data.seatId;
    render();
  }
  async function poll() {
    if (!credentials || !snapshot || polling || sending || stopped) return;
    polling = true;
    try { accept(await request('/api/group-lessons/' + credentials.id + '?after=' + snapshot.revision)); }
    catch (error) { connected = false; renderConnection(); if (!outbox.length) notice(errorText(error), true); }
    finally { polling = false; }
    if (outbox.length) pump();
  }
  function enqueue(type, id, payload, options = {}) {
    const ws = workspace(id);
    if (!credentials || !snapshot || !ws && type !== 'assign') return Promise.reject(Error('Нет рабочего места.'));
    const body = {opId:uuid(), target:id, type, payload:clone(payload)};
    if (ws && type !== 'assign' && type !== 'present') body.assignmentId = ws.assignmentId;
    if (options.assignmentId) body.assignmentId = options.assignmentId;
    // Bind edits to the version actually observed when they were made. A lost
    // acknowledgement must never rebase queued student input over a correction.
    if (type === 'trainer') {
      body.expectedVersion = ws.trainerVersion;
      for (const pending of outbox) if (pending.type === 'trainer' && pending.target === id && pending.assignmentId === body.assignmentId && Number.isInteger(pending.expectedVersion)) {
        body.expectedVersion = Math.max(body.expectedVersion, pending.expectedVersion + 1);
      }
    }
    outbox.push(body); saveQueue(); renderConnection();
    const promise = new Promise((resolve,reject) => waiters.set(body.opId,{resolve,reject}));
    pump(); return promise;
  }
  async function pump() {
    if (sending || polling || !outbox.length || stopped) return;
    sending = true;
    const body = outbox[0];
    try {
      const data = await request('/api/group-lessons/' + credentials.id + '/actions', {method:'POST',body:JSON.stringify(body)});
      outbox.shift(); saveQueue(); accept(data);
      waiters.get(body.opId)?.resolve(data); waiters.delete(body.opId);
      if (!outbox.length) notice('', true);
    } catch (error) {
      if (error.status && error.status < 500 && error.status !== 429) {
        outbox.shift(); rejected.push({action:body,error:error.code || error.message,at:new Date().toISOString()});
        const staleTrainer=body.type==='trainer'&&['GROUP_STATE_CONFLICT','GROUP_CONTROL_REQUIRED','GROUP_ASSIGNMENT_STALE'].includes(error.code);
        if(staleTrainer) {
          // Later versions in this queue depend on the rejected edit. Some can
          // numerically match a future server version, but are still stale.
          outbox=outbox.filter(action=>{
            if(action.type!=='trainer'||action.target!==body.target||action.assignmentId!==body.assignmentId)return true;
            rejected.push({action,error:error.code,at:new Date().toISOString()});
            waiters.get(action.opId)?.reject(error);waiters.delete(action.opId);return false;
          });
          connected=false;
        }
        saveQueue(); waiters.get(body.opId)?.reject(error); waiters.delete(body.opId);
        notice(errorText(error), true);
        if(staleTrainer) {
          renderConnection();
          try {accept(await request('/api/group-lessons/'+credentials.id));}
          catch(refreshError){notice(errorText(refreshError),true);}
        }
      } else {
        connected = false; notice(errorText(error), true);
        later(pump,2500);
      }
    } finally {
      sending = false; renderConnection();
      if (outbox.length && connected) later(pump,20);
      else if (!outbox.length) later(poll,20);
    }
  }
  function fire(type,id,payload,options) { enqueue(type,id,payload,options).catch(e => notice(errorText(e),true)); }
  function element(tag,cls,text) { const el=document.createElement(tag); if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el; }
  function button(text,fn,cls='button') { const b=element('button',cls,text);b.type='button';b.addEventListener('click',fn);return b; }
  function cleanFrames() { cardFrames.forEach(frame=>frame.destroy());cardFrames.clear();cardCanvases.clear();$('studentGrid').replaceChildren();cardKey=''; }
  function destroyFocus() { focusFrame?.destroy();focusFrame=null;focusKey='';$('trainerHost').replaceChildren(); }
  function presentationTarget() {
    const queued=outbox.filter(action=>action.type==='present');
    return queued.length?queued[queued.length-1].payload.target:snapshot?.presentation?.target;
  }
  function presentationCaption() {
    const demo=snapshot?.presentation;
    return !demo?.target?'Сейчас объяснение не идёт':demo.target==='common'?'Объяснение на общей доске':'Разбор работы: '+demo.name;
  }
  function destroyWatch() { watchFrame?.destroy();watchFrame=null;watchKey='';$('teacherWatchTrainer').replaceChildren(); }
  function renderTeacherWatch() {
    const active=!teacher()&&target()===snapshot.seatId;
    $('teacherWatch').hidden=!active;
    if(!active||!matchMedia('(min-width:1050px)').matches){destroyWatch();return;}
    const demo=snapshot.presentation,ws=demo?.workspace;
    $('teacherWatchStatus').textContent=presentationCaption()+(connected?'':' · нет связи');
    $('teacherWatchToggle').disabled=!ws;
    $('teacherWatchOpen').disabled=!ws;
    $('teacherWatchToggle').textContent=watchBoard?'Показать тренажёр':'Показать доску';
    $('teacherWatchTrainer').hidden=watchBoard&&!!ws;
    $('teacherWatchCanvas').hidden=!watchBoard||!ws;
    const key=demo?.target&&ws?demo.target+':'+ws.assignmentId+':'+ws.trainerId:'waiting';
    if(key!==watchKey) {
      destroyWatch();watchKey=key;
      if(ws?.trainerId)watchFrame=new GroupTrainerFrame($('teacherWatchTrainer'),{trainerId:ws.trainerId,assignmentId:ws.assignmentId,state:ws.trainerState,readOnly:true,preview:true});
      else $('teacherWatchTrainer').append(element('p','empty-state',ws?'Наталья Михайловна объясняет на доске. Выберите «Показать доску».':'Здесь появится работа, которую Наталья Михайловна объясняет группе. Можно продолжать своё задание.'));
    }else watchFrame?.update({state:ws?.trainerState,readOnly:true});
    if(ws&&watchBoard)drawCanvas($('teacherWatchCanvas'),ws.strokes||[]);
  }
  function pendingTrainer(ws,id) {return outbox.filter(action=>action.type==='trainer'&&action.target===id&&action.assignmentId===ws?.assignmentId);}
  function ownsTrainer(ws,id) {return id==='common'?teacher():teacher()?ws?.controller==='teacher':id===snapshot.seatId&&ws?.controller==='student';}
  function writer(ws,id) {
    const pending=pendingTrainer(ws,id);
    return connected&&!historyEvents&&!!ws?.trainerId&&!outbox.some(action=>action.target===id&&action.type==='control')
      &&(!pending.length||pending[0].expectedVersion===ws.trainerVersion)&&ownsTrainer(ws,id);
  }
  function focusState(ws,id) {
    const pending=pendingTrainer(ws,id);
    // A learner may open the explanation while an input acknowledgement is in
    // flight. Returning must show that input, without rebasing an obsolete edit.
    return !historyEvents&&ownsTrainer(ws,id)&&pending.length&&pending[0].expectedVersion===ws.trainerVersion
      ?pending[pending.length-1].payload.state:ws.trainerState;
  }
  function canDraw() { return connected && !historyEvents && !!target() && (target()==='common'?teacher():teacher()||target()===snapshot.seatId); }
  function renderConnection() {
    if (!snapshot) return;
    $('connectionStatus').textContent=!connected?'Нет связи':outbox.length?'Сохраняю…':'Все изменения сохранены';
    $('connectionStatus').dataset.state=!connected?'offline':outbox.length?'pending':'saved';
    if (focusFrame) focusFrame.update({readOnly:!writer(workspace(target()),target())});
    if(!teacher()&&$('teacherWatchStatus'))$('teacherWatchStatus').textContent=presentationCaption()+(connected?'':' · нет связи');
  }
  function stateSummary(ws) {
    const s=ws?.trainerState;
    if (!s) return ws?.trainerId?'Открывается задание':'Задание ещё не выдано';
    if (ws.trainerId==='linear-inequalities-stepwise') {
      const status=s.done?(/\bok\b/.test(s.feedbackClass)?'ответ верный':/\berr\b/.test(s.feedbackClass)?'ошибка в ответе':'ответ проверен')
        :/\berr\b/.test(s.feedbackClass)?'ошибка в шаге':'ответ не проверен';
      const sign={lt:'<',gt:'>',lte:'≤',gte:'≥'}[s.answerSign]||s.answerSign||'';
      const answer=s.answerValue!==''&&s.answerValue!==undefined?' · ответ: x '+sign+' '+s.answerValue:'';
      return '№ '+s.taskNumber+' · шаг '+s.currentStep+answer+' · '+status;
    }
    return 'Пример '+(s.taskNo||1)+(s.answer!==''&&s.answer!==undefined?' · ответ: '+s.answer:'')+' · '+(s.phase==='done'?'завершён':s.phase==='answer'?'вводит ответ':'работает на прямой');
  }
  function renderRoster() {
    $('roster').replaceChildren(...snapshot.students.map(s=>{
      const b=button(s.name+' · '+(s.help?'нужна помощь':s.online?'на связи':'нет связи'),()=>openSeat(s.id),'roster-chip');
      b.dataset.help=String(s.help);b.setAttribute('aria-pressed',String(selected===s.id));return b;
    }));
  }
  function renderTabs() {
    const tabs=[];
    if (teacher()) for(let i=0;i<Math.ceil(snapshot.students.length/4);i++) {
      const count=snapshot.students.slice(i*4,i*4+4).filter(s=>s.help).length;
      const label='Ученики '+(i*4+1)+'–'+Math.min(i*4+4,snapshot.students.length)+(count?' · помощь '+count:'');
      const b=button(label,()=>showSheet(i),'sheet-tab');b.dataset.sheet=String(i);b.setAttribute('aria-pressed',String(!selected&&sheet===i));tabs.push(b);
    } else {
      const b=button('Моё задание',()=>openSeat(snapshot.seatId),'sheet-tab');b.dataset.sheet='mine';b.setAttribute('aria-pressed',String(selected===snapshot.seatId));tabs.push(b);
    }
    const demoId=teacher()?'common':'presentation';
    const common=button(teacher()?'Общая доска':'Наталья Михайловна объясняет',()=>openSeat(demoId),'sheet-tab');common.dataset.sheet=demoId;common.setAttribute('aria-pressed',String(selected===demoId));tabs.push(common);
    $('sheetTabs').replaceChildren(...tabs);
  }
  function renderOverview() {
    const visible=snapshot.students.slice(sheet*4,sheet*4+4);
    const key=visible.map(s=>s.id+':'+s.workspace.assignmentId).join('|');
    if(key!==cardKey) {
      cleanFrames();cardKey=key;
      visible.forEach(s=>{
        const card=element('article','student-card');card.dataset.seat=s.id;
        const head=element('div','student-card-head');head.append(element('strong','student-name',s.name),element('span','student-status',''));
        const task=element('div','student-task','');
        const preview=element('div','student-preview');const frameHost=element('div','preview-trainer');const canvas=element('canvas','preview-board');canvas.hidden=true;preview.append(frameHost,canvas);
        const open=button('Открыть работу',()=>openSeat(s.id),'preview-open');preview.append(open);
        const foot=element('div','student-card-foot');const summary=element('span','preview-summary','');
        const toggle=button('Показать доску',()=>{const board=canvas.hidden;canvas.hidden=!board;frameHost.hidden=board;toggle.textContent=board?'Показать тренажёр':'Показать доску';drawCanvas(canvas,workspace(s.id)?.strokes||[]);});
        foot.append(summary,toggle);card.append(head,task,preview,foot);$('studentGrid').append(card);
        cardCanvases.set(s.id,canvas);
        if(s.workspace.trainerId) cardFrames.set(s.id,new GroupTrainerFrame(frameHost,{
          trainerId:s.workspace.trainerId,assignmentId:s.workspace.assignmentId,state:s.workspace.trainerState,readOnly:true,preview:true,
          onStatus:text=>{frameHost.dataset.status=text;}
        }));
        else frameHost.append(element('p','empty-state','Выдайте задание или откройте доску для письменного решения.'));
      });
    }
    visible.forEach(s=>{
      const card=$('studentGrid').querySelector('[data-seat="'+s.id+'"]');
      card.querySelector('.student-status').textContent=s.help?'Нужна помощь':s.online?'На связи':'Нет связи';
      card.dataset.help=String(s.help);card.querySelector('.student-task').textContent=TRAINERS[s.workspace.trainerId]||'Личная доска';
      card.querySelector('.preview-summary').textContent=stateSummary(s.workspace);
      cardFrames.get(s.id)?.update({state:s.workspace.trainerState,readOnly:true});
      const canvas=cardCanvases.get(s.id);if(canvas&&!canvas.hidden)drawCanvas(canvas,s.workspace.strokes);
    });
  }
  function renderFocus() {
    const id=target(),live=workspace(id)||{assignmentId:'no-presentation',trainerId:null,strokes:[],controller:'teacher'},ws=historyWorkspace||live;
    $('workspaceName').textContent=id==='presentation'?'Наталья Михайловна объясняет':id==='common'?'Общая доска':teacher()?seat(id)?.name+' · личная работа':'Моё задание';
    $('workspaceMeta').textContent=id==='presentation'?presentationCaption():historyEvents?'Просмотр записи — текущая работа продолжается':snapshot.presentation?.target===id?'Эту работу сейчас видит вся группа':id==='common'?'Общая доска для объяснения':'Доступ: ученик и преподаватель';
    $('backButton').hidden=!teacher();
    $('trainerControlButton').hidden=!teacher()||id==='common'||!ws.trainerId||!!historyEvents;
    $('trainerControlButton').textContent=live.controller==='teacher'?'Вернуть управление ученику':'Подключиться к тренажёру';
    $('trainerControlButton').disabled=!connected||outbox.some(action=>action.target===id&&action.type==='control');
    $('presentButton').hidden=!teacher()||!!historyEvents;
    $('presentButton').disabled=!connected||outbox.some(action=>action.type==='present');
    $('presentButton').textContent=presentationTarget()?'Завершить объяснение':'Объяснять группе';
    $('presentButton').setAttribute('aria-pressed',String(!!presentationTarget()));
    $('helpButton').hidden=teacher()||id==='common'||id==='presentation'||!!historyEvents;
    $('helpButton').textContent=seat(id)?.help?'Помощь больше не нужна':'Нужна помощь';
    $('helpNotice').hidden=id==='common'||id==='presentation'||!seat(id)?.help;
    $('helpNotice').textContent='Ученик просит помощи.';
    $('historyButton').textContent=historyEvents?'Обновить запись':'Запись решения';
    $('historyButton').hidden=id==='presentation';
    $('historyPanel').hidden=!historyEvents;
    $('penButton').disabled=!canDraw();$('eraserButton').disabled=!canDraw();$('undoButton').disabled=!canDraw();
    const newKey=id+':'+ws.assignmentId+':'+ws.trainerId+':'+(historyEvents?'history':'live');
    if(newKey!==focusKey) {
      destroyFocus();focusKey=newKey;
      if(ws.trainerId) focusFrame=new GroupTrainerFrame($('trainerHost'),{
        trainerId:ws.trainerId,assignmentId:ws.assignmentId,state:focusState(ws,id),readOnly:!writer(live,id),
        onState:state=>{
          if(!writer(workspace(id),id)||target()!==id||workspace(id)?.assignmentId!==ws.assignmentId)return;
          fire('trainer',id,{state},{assignmentId:ws.assignmentId});
        },onStatus:text=>{$('trainerStatus').textContent=text;}
      });
      else {$('trainerHost').append(element('p','empty-state',id==='presentation'?(snapshot.presentation?.target?'Объяснение идёт на листе для решения.':'Сейчас объяснение не идёт. Можно вернуться к своему заданию.'):teacher()?'Выберите «Выдать задание». На доске уже можно писать.':'Преподаватель скоро выдаст задание. На доске уже можно писать.'));$('trainerStatus').textContent='';}
    } else if(focusFrame) {
      const pending=outbox.some(action=>action.target===id&&action.type==='trainer');
      focusFrame.update({...(!pending?{state:ws.trainerState}:{}),readOnly:!writer(live,id)});
    }
    drawCanvas($('boardCanvas'),ws.strokes||[],drawing);
  }
  function render() {
    $('setup').hidden=true;$('app').hidden=false;document.body.dataset.role=snapshot.role;
    document.body.dataset.view=!target()?'overview':target()==='presentation'?'presentation':target()==='common'?'common':'personal';
    $('lessonName').textContent=snapshot.title;$('sessionRole').textContent=teacher()?'Преподаватель':'Ученик';
    document.querySelectorAll('.teacher-only').forEach(n=>n.hidden=!teacher());
    document.querySelectorAll('.student-only').forEach(n=>n.hidden=teacher());
    $('presentationStatus').hidden=!teacher()||!snapshot.presentation?.target;
    $('presentationStatus').textContent='Группа видит: '+(snapshot.presentation?.name||'');
    renderConnection();renderRoster();renderTabs();
    const focused=!!target();$('focus').hidden=!focused;$('overview').hidden=focused;
    if(focused){cleanFrames();renderFocus();}else{destroyFocus();renderOverview();}
    renderTeacherWatch();
  }
  function openSeat(id) { const following=teacher()&&!!presentationTarget();historyEvents=null;historyWorkspace=null;drawing=null;selected=id;render();if(following)fire('present','common',{target:id}); }
  function showSheet(value) { const following=teacher()&&!!presentationTarget();historyEvents=null;historyWorkspace=null;drawing=null;selected=null;sheet=value;render();if(following)fire('present','common',{target:null}); }
  function drawCanvas(canvas,strokes,draft=null) {
    if(!canvas||canvas.hidden)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    ctx.lineCap='round';ctx.lineJoin='round';
    [...strokes,...(draft?[draft]:[])].forEach(stroke=>{
      if(!stroke.points?.length)return;ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=stroke.width;
      ctx.beginPath();stroke.points.forEach((p,i)=>{const x=p.x*rect.width,y=p.y*rect.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      if(stroke.points.length===1){ctx.arc(stroke.points[0].x*rect.width,stroke.points[0].y*rect.height,stroke.width/2,0,Math.PI*2);ctx.fill();}else ctx.stroke();
    });
  }
  function canvasPoint(event) { const r=$('boardCanvas').getBoundingClientRect();return{x:Math.min(1,Math.max(0,(event.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(event.clientY-r.top)/r.height))}; }
  function eraseAt(p) {
    const ws=workspace(target()),role=teacher()?'teacher':snapshot.seatId;
    const strokes=[...(ws.strokes||[])].reverse();
    const candidate=strokes.find(s=>(s.actor===role||s.author===role||s.actor?.role===role)&&s.points.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<0.035));
    if(candidate)fire('erase',target(),{strokeId:candidate.id});
    else notice('Ластик удаляет Ваши штрихи. Нажмите рядом с нужной линией.');
  }
  function startDraw(event) {
    if(!canDraw()||event.button!==0)return;
    event.preventDefault();const p=canvasPoint(event);
    if(tool==='eraser'){eraseAt(p);return;}
    drawing={id:uuid(),points:[p],color:$('strokeColor').value,width:Number($('strokeWidth').value)};
    drawing.assignmentId=workspace(target()).assignmentId;drawing.target=target();
    $('boardCanvas').setPointerCapture(event.pointerId);
  }
  function moveDraw(event) {
    if(!drawing)return;event.preventDefault();
    if(drawing.points.length<500)drawing.points.push(canvasPoint(event));
    drawCanvas($('boardCanvas'),workspace(target())?.strokes||[],drawing);
  }
  function endDraw(event) {
    if(!drawing)return;event.preventDefault();const stroke=drawing;drawing=null;
    if($('boardCanvas').hasPointerCapture(event.pointerId))$('boardCanvas').releasePointerCapture(event.pointerId);
    fire('stroke',stroke.target,{id:stroke.id,points:stroke.points,color:stroke.color,width:stroke.width},{assignmentId:stroke.assignmentId});
  }
  function sessionLink(token) {
    const url=new URL(location.pathname,location.origin);
    url.hash=new URLSearchParams({lesson:credentials.id,token,server:credentials.server}).toString();return url.href;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text);notice('Ссылка скопирована.'); }
    catch (_) { notice('Выделите ссылку и скопируйте её сочетанием Ctrl+C.'); }
  }
  function showInvites() {
    if(!teacher())return;
    $('inviteList').replaceChildren(...(snapshot.invites||[]).map(s=>{
      const row=element('div','invite-row');const field=element('input','invite-link');field.type='text';field.readOnly=true;field.value=sessionLink(s.studentToken);field.setAttribute('aria-label','Личная ссылка: '+s.name);
      row.append(element('strong','',s.name),field,button('Копировать',()=>copy(field.value)));return row;
    }));$('inviteDialog').showModal();
  }
  function openAssign() {
    if(!teacher())return;
    $('assignTarget').replaceChildren(...[{id:'all',name:'Всем ученикам'},...snapshot.students,{id:'common',name:'Общая доска'}].map(s=>{const o=element('option','',s.name);o.value=s.id;return o;}));
    $('assignTarget').value=target()||'all';$('assignDialog').showModal();
  }
  async function assign(event) {
    event.preventDefault();const trainerId=$('assignTrainer').value;if(!TRAINERS[trainerId])return;
    $('assignSubmit').disabled=true;let frame,host;
    try {
      if(outbox.length)throw Error('Дождитесь сохранения текущих действий.');
      host=element('div','assignment-preparer');host.style.cssText='position:absolute;width:800px;height:600px;left:-10000px;top:0;visibility:hidden';document.body.append(host);
      frame=new GroupTrainerFrame(host,{trainerId,assignmentId:uuid(),state:null,readOnly:false});
      const initialState=await frame.getState();
      const value=$('assignTarget').value;const targets=value==='all'?snapshot.students.map(s=>s.id):[value];
      await enqueue('assign',targets[0],{targets,trainerId,initialState});
      $('assignDialog').close();notice('Задание выдано. У каждого ученика — отдельное решение.');
    } catch(error) {notice(errorText(error),true);}
    finally{frame?.destroy();host?.remove();$('assignSubmit').disabled=false;}
  }
  async function fetchHistory(id, through) {
    const events=[];let after=0,hasMore=true,initialWorkspace;
    while(hasMore) {
      const path='/api/group-lessons/'+credentials.id+'/history?target='+encodeURIComponent(id)+'&after='+after+'&limit=100'+(through!==undefined?'&through='+through:'');
      let page;
      for(let attempt=0;;attempt++) {
        try {page=await request(path);break;}
        catch(error) {
          if(error.status!==429||attempt>=7)throw error;
          await new Promise(resolve=>setTimeout(resolve,1200+attempt*200));
        }
      }
      if(page.format!=='events-v1'||!Array.isArray(page.events))throw Error('Формат записи не поддерживается.');
      if(through===undefined)through=page.revision;
      if(!initialWorkspace)initialWorkspace=page.initialWorkspace;
      events.push(...page.events);
      if(page.nextAfter<=after&&page.hasMore)throw Error('Не удалось прочитать запись.');
      after=page.nextAfter;hasMore=page.hasMore;
    }
    return {format:'events-v1',target:id,initialWorkspace,events,revision:through};
  }
  function replayWorkspace(index) {
    let work=clone(historyInitial);
    for(let i=0;i<=index;i++) {
      const event=historyEvents[i],payload=event.payload;
      if(event.type==='assign') work={assignmentId:payload.assignmentId,trainerId:payload.trainerId,trainerState:clone(payload.initialState),strokes:[],controller:event.target==='common'?'teacher':'student',trainerVersion:0,revision:event.revision};
      else {
        if(event.type==='trainer'){work.trainerState=clone(payload.state);work.trainerVersion++;}
        if(event.type==='control'){work.controller=payload.controller;work.trainerVersion++;}
        if(event.type==='stroke')work.strokes.push({...clone(payload),author:event.actor,at:event.at});
        if(event.type==='undo'||event.type==='erase')work.strokes=work.strokes.filter(stroke=>stroke.id!==payload.strokeId);
        work.revision=event.revision;
      }
    }
    return work;
  }
  async function showHistory() {
    const id=target();if(!id)return;
    $('historyButton').disabled=true;
    try {
      if(teacher()&&presentationTarget())await enqueue('present','common',{target:null});
      const record=await fetchHistory(id);if(target()!==id)return;
      const events=record.events;
      if(!events.length){notice('В этой работе пока нет записанных действий.');return;}
      historyInitial=record.initialWorkspace;historyEvents=events;$('historyRange').max=String(events.length-1);$('historyRange').value=String(events.length-1);seekHistory();
    } catch(error){notice(errorText(error),true);}finally{$('historyButton').disabled=false;}
  }
  function seekHistory() {
    const event=historyEvents?.[Number($('historyRange').value)];if(!event)return;
    historyWorkspace=replayWorkspace(Number($('historyRange').value));
    const labels={assign:'Выдано задание',trainer:'Действие в тренажёре',stroke:'Запись на доске',undo:'Отмена штриха',erase:'Удаление штриха',help:'Просьба о помощи',control:'Передача управления'};
    $('historyTime').textContent=new Date(event.at).toLocaleTimeString('ru-RU')+' · '+(labels[event.type]||event.type)+' · '+(event.actor==='teacher'?'преподаватель':'ученик');
    renderFocus();
  }
  function download(name,data) {const a=element('a');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  async function exportLesson() {
    $('exportButton').disabled=true;
    try {
      const ids=teacher()?[...snapshot.students.map(s=>s.id),'common']:[snapshot.seatId,'common'];
      const captured=clone(snapshot),history={};for(const id of ids)history[id]=await fetchHistory(id,captured.revision);
      download('mathexam-lesson-'+credentials.id+'.json',{format:'mathexam-group-lesson',version:1,title:captured.title,revision:captured.revision,exportedAt:new Date().toISOString(),students:captured.students.map(({id,name,workspace})=>({id,name,workspace})),common:captured.common,history,unsent:outbox,rejected});
      notice('Запись скачана. Ссылки и ключи доступа в файл не включены.');
    }catch(error){download('mathexam-unsent-work.json',{title:snapshot?.title,unsent:outbox,rejected});notice('Полную запись скачать не удалось. Скачана только резервная копия неотправленных действий. '+errorText(error),true);}
    finally{$('exportButton').disabled=false;}
  }
  function rememberSession() {
    try{sessionStorage.setItem(sessionKey(credentials.id),JSON.stringify(credentials));}
    catch(_){notice('Сохраните личную ссылку: браузер не запомнил доступ к занятию.',true);}
    const url=new URL(location.href);url.hash='';url.search='';url.searchParams.set('lesson',credentials.id);history.replaceState(null,'',url);
  }
  async function startSession(data) {
    accept(data);rememberSession();
    try{const saved=JSON.parse(sessionStorage.getItem(queueKey())||'{}');outbox=Array.isArray(saved.outbox)?saved.outbox:[];rejected=Array.isArray(saved.rejected)?saved.rejected:[];}catch(_){}
    $('strokeColor').value=teacher()?'#15803d':'#172033';render();
    pump();later(async function tick(){await poll();if(!stopped)later(tick,1100);},1100);
  }
  async function checkCapability() {
    if(credentials?.id)return;
    try {
      credentials={server:serverUrl($('serverUrl').value)};
      const status=await request('/api/group-lessons/status',{},false);
      $('createButton').disabled=!status.available;$('setupStatus').textContent=status.available?'Групповые занятия и постоянное сохранение доступны.':'На этом сервере ещё не включено постоянное хранение групповых занятий.';
    }catch(_){$('createButton').disabled=true;$('setupStatus').textContent='Групповая доска пока недоступна на этом сервере. Нужна серверная часть групповых занятий.';}
  }
  async function create(event) {
    event.preventDefault();$('createButton').disabled=true;
    try{
      credentials={server:serverUrl($('serverUrl').value)};
      const names=$('studentNames').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      if(names.length<1||names.length>8)throw Error('Введите от одного до восьми имён, каждое с новой строки.');
      const data=await request('/api/group-lessons',{method:'POST',body:JSON.stringify({title:$('lessonTitle').value.trim(),names})},false);
      credentials.id=data.id;credentials.token=data.teacherToken;
      await startSession(data);showInvites();notice('Сохраните свою ссылку преподавателя и отправьте каждому ученику его личную ссылку.');
    }catch(error){notice(errorText(error),true);$('createButton').disabled=false;}
  }
  async function init() {
    $('serverUrl').value=DEFAULT_SERVER;
    const fragment=new URLSearchParams(location.hash.slice(1)),id=fragment.get('lesson');
    try {
      if(id&&fragment.get('token'))credentials={id,token:fragment.get('token'),server:serverUrl(fragment.get('server')||DEFAULT_SERVER)};
      else {const marker=new URLSearchParams(location.search).get('lesson');if(marker)credentials=JSON.parse(sessionStorage.getItem(sessionKey(marker))||'null');}
      if(credentials?.id) {
        rememberSession();const data=await request('/api/group-lessons/'+encodeURIComponent(credentials.id));await startSession(data);
      }else await checkCapability();
    }catch(error){$('setupStatus').textContent='Не удалось открыть занятие. Обновите страницу или используйте полную личную ссылку.';notice(errorText(error),true);}
  }
  $('createForm').addEventListener('submit',create);$('serverUrl').addEventListener('change',checkCapability);
  $('overviewButton').addEventListener('click',()=>showSheet(sheet));$('backButton').addEventListener('click',()=>showSheet(sheet));
  $('assignButton').addEventListener('click',openAssign);$('assignForm').addEventListener('submit',assign);
  $('inviteButton').addEventListener('click',showInvites);$('exportButton').addEventListener('click',exportLesson);
  $('saveTeacherLinkButton').addEventListener('click',()=>{if(teacher())copy(sessionLink(credentials.token));});
  $('trainerControlButton').addEventListener('click',()=>fire('control',target(),{controller:workspace(target()).controller==='teacher'?'student':'teacher'}));
  $('presentButton').addEventListener('click',()=>fire('present','common',{target:presentationTarget()?null:target()}));
  $('teacherWatchToggle').addEventListener('click',()=>{watchBoard=!watchBoard;renderTeacherWatch();});
  $('teacherWatchOpen').addEventListener('click',()=>openSeat('presentation'));
  $('helpButton').addEventListener('click',()=>fire('help',target(),{active:!seat(target()).help}));
  $('historyButton').addEventListener('click',showHistory);$('historyRange').addEventListener('input',seekHistory);
  $('historyExit').addEventListener('click',()=>{historyEvents=null;historyWorkspace=null;renderFocus();});
  $('penButton').addEventListener('click',()=>{tool='pen';$('penButton').setAttribute('aria-pressed','true');$('eraserButton').setAttribute('aria-pressed','false');});
  $('eraserButton').addEventListener('click',()=>{tool='eraser';$('penButton').setAttribute('aria-pressed','false');$('eraserButton').setAttribute('aria-pressed','true');});
  $('undoButton').addEventListener('click',()=>fire('undo',target(),{}));
  $('boardCanvas').addEventListener('pointerdown',startDraw);$('boardCanvas').addEventListener('pointermove',moveDraw);
  $('boardCanvas').addEventListener('pointerup',endDraw);$('boardCanvas').addEventListener('pointercancel',endDraw);
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.closeDialog).close()));
  const resize=new ResizeObserver(()=>{
    if(target())drawCanvas($('boardCanvas'),(historyWorkspace||workspace(target()))?.strokes||[],drawing);
    if(snapshot&&!teacher()&&watchBoard)drawCanvas($('teacherWatchCanvas'),snapshot.presentation?.workspace?.strokes||[]);
  });resize.observe($('boardCanvas'));
  resize.observe($('teacherWatchCanvas'));
  matchMedia('(min-width:1050px)').addEventListener('change',()=>{if(snapshot)renderTeacherWatch();});
  addEventListener('online',()=>{connected=true;pump();poll();});
  addEventListener('beforeunload',event=>{if(outbox.length){event.preventDefault();event.returnValue='';}});
  init();
})();
