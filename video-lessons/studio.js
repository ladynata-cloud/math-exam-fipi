'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const cheatsheets = window.MathExamCheatsheets || {};
  const tasks = [...new Set(['homework-help', 'linear-equation', 'adjacent-angles', ...Object.keys(cheatsheets).filter(key=>typeof cheatsheets[key].scenes==='function')])];
  const labels = {...Object.fromEntries(Object.entries(cheatsheets).map(([key,value])=>[key,value.title])), 'homework-help':'Как пользоваться помощью','linear-equation':'Линейное уравнение','adjacent-angles':'Смежные и вертикальные углы'};
  const actions = {observe:'Посмотри и подумай',wrong:'Разбираем ошибку',hint:'Подсказка',correct:'Обоснованный шаг',next:'Следующий шаг',final:'Теперь самостоятельно'};
  const esc = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const formula = text => `<div class="formula">${esc(text)}</div>`;
  const scene = (id, title, narration, math, note, action = 'observe', extras = {}) => ({id,title,narration,math,note,action,click:false,duration_hint_ms:Math.max(6500, Math.min(16000, narration.length * 85)),...extras});
  const equations = [
    {problem:'3(x − 2) + 4 = 13',a:3,b:-2,c:4,d:13,expanded:'3x − 6 + 4 = 13',wrong:'3x − 2 + 4 = 13',simplified:'3x − 2 = 13',change:'Прибавим 2 к обеим частям.',operation:'3x − 2 + 2 = 13 + 2',product:'3x = 15',result:5,check:'3 · (5 − 2) + 4 = 13',analogue:'3(y − 1) + 2 = 17'},
    {problem:'2(x + 3) − 5 = 9',a:2,b:3,c:-5,d:9,expanded:'2x + 6 − 5 = 9',wrong:'2x + 3 − 5 = 9',simplified:'2x + 1 = 9',change:'Вычтем 1 из обеих частей.',operation:'2x + 1 − 1 = 9 − 1',product:'2x = 8',result:4,check:'2 · (4 + 3) − 5 = 9',analogue:'2(y + 4) − 3 = 15'},
    {problem:'4(x − 1) + 3 = 15',a:4,b:-1,c:3,d:15,expanded:'4x − 4 + 3 = 15',wrong:'4x − 1 + 3 = 15',simplified:'4x − 1 = 15',change:'Прибавим 1 к обеим частям.',operation:'4x − 1 + 1 = 15 + 1',product:'4x = 16',result:4,check:'4 · (4 − 1) + 3 = 15',analogue:'4(y − 2) + 5 = 17'}
  ];
  function equationScenes(p) {
    return [
      scene('read-condition-1','Что нужно найти?','Найди значение икс, при котором равенство верно.',p.problem,'Начни с условия. Не пытайся угадать ответ.'),
      scene('try-yourself-2','Остановись и попробуй','Как раскрыть скобки? Запиши первый шаг самостоятельно.',`${p.a} · (x ${p.b < 0 ? '−' : '+'} ${Math.abs(p.b)})`,'Пауза перед разбором: в читателе можно остановиться на любом шаге.', 'observe', {click:true,button:'Открыть правило'}),
      scene('recall-rule-3','Множитель относится к каждому слагаемому','Используй распределительное свойство: умножь на число каждое слагаемое в скобках.','a(b + c) = ab + ac','Операция выполняется над обоими слагаемыми.', 'hint'),
      scene('wrong-expansion-4','Заметь типичную ошибку','Это ошибочный шаг: множитель забыли применить ко второму слагаемому.',p.wrong,'Показанная строка НЕ равносильна исходному уравнению.', 'wrong'),
      scene('correct-expansion-5','Исправляем раскрытие скобок',`Умножь ${p.a} и на икс, и на ${p.b < 0 ? 'минус ' : ''}${Math.abs(p.b)}.`,p.expanded,'Теперь распределительное свойство применено к каждому слагаемому.', 'correct'),
      scene('combine-numbers-6','Вычисляем сумму чисел','Объедини числовые слагаемые в левой части.',p.simplified,'Значение левой части не изменилось.', 'next'),
      scene('same-operation-7','Сохраняем равенство',p.change,p.operation,'Одна и та же операция над обеими частями сохраняет равенство.', 'correct'),
      scene('simplify-both-sides-8','Упрощаем обе части','Выполни вычисления слева и справа.',p.product,'Мы получили равносильное уравнение.', 'next'),
      scene('pause-before-answer-9','Как оставить только x?',`На какое ненулевое число нужно разделить обе части?`,p.product,'Сначала ответь сам. Следующий шаг покажет деление.', 'observe', {click:true,button:'Показать следующий шаг'}),
      scene('divide-both-sides-10','Делим обе части',`Раздели обе части на ${p.a}. Получаем: икс равен ${p.result}.`,`x = ${p.result}`,`Делитель ${p.a} не равен нулю: операция допустима.`, 'correct'),
      scene('check-substitution-11','Проверяем в исходном уравнении','Подставь найденное значение в исходное уравнение. Левая и правая части равны.',p.check,'Проверка подтверждает найденный корень.', 'correct'),
      scene('independent-task-12','Новое задание — без готового ответа','Реши новое уравнение самостоятельно. Затем проверь ответ подстановкой.',p.analogue,'Просмотр примера ещё не означает, что ты умеешь решать сам.', 'final')
    ];
  }
  const anglePresets = [{alpha:56,rotation:14,next:68},{alpha:73,rotation:155,next:109},{alpha:118,rotation:204,next:47}];
  function point(angle,radius) { return [240+Math.cos(angle*Math.PI/180)*radius,155-Math.sin(angle*Math.PI/180)*radius]; }
  function arc(start,end,radius) { const a=point(start,radius),b=point(end,radius);return `M ${a[0]} ${a[1]} A ${radius} ${radius} 0 ${end-start>180?1:0} 0 ${b[0]} ${b[1]}`; }
  function angleDiagram(p, stage) {
    const base=p.rotation, alpha=p.alpha;
    const rays=[base,base+180,base+alpha,base+alpha+180];
    const coords=rays.map(v=>point(v,125)), names=['A','B','C','D'];
    const labels=rays.map(v=>point(v,147));
    const angle1=point(base+alpha/2,75), angle2=point(base+(alpha+180)/2,80);
    const giv=stage==='independent'?`${p.next}°`:`${alpha}°`;
    // Independent task uses its own geometry so the shown number matches the drawn angle.
    if(stage==='independent') return angleDiagram({...p,alpha:p.next},'fresh');
    const betaText=['answer','check','vertical'].includes(stage)?`${180-alpha}°`:'?';
    const vertical=stage==='vertical';
    const extra=vertical?`<path d="${arc(base+180,base+alpha+180,45)}" fill="none" stroke="#8857a6" stroke-width="4"/><text x="${point(base+180+alpha/2,76)[0]}" y="${point(base+180+alpha/2,76)[1]+7}" text-anchor="middle" style="fill:#784797">${alpha}°</text>`:'';
    return `<svg class="diagram" viewBox="-20 -30 520 370" role="img" aria-label="Прямые AB и CD пересекаются в точке O. Угол AOC равен ${alpha} градусам. Угол COB ${betaText==='?'?'неизвестен':`равен ${180-alpha} градусам`}.${vertical?' Угол BOD вертикален углу AOC.':''}"><line x1="${coords[0][0]}" y1="${coords[0][1]}" x2="${coords[1][0]}" y2="${coords[1][1]}" stroke="#334e5a" stroke-width="4"/><line x1="${coords[2][0]}" y1="${coords[2][1]}" x2="${coords[3][0]}" y2="${coords[3][1]}" stroke="#334e5a" stroke-width="4"/><path d="${arc(base,base+alpha,39)}" fill="none" stroke="#076e64" stroke-width="4"/><path d="${arc(base+alpha,base+180,54)}" fill="none" stroke="#d58a23" stroke-width="4"/>${extra}${labels.map((xy,i)=>`<text x="${xy[0]}" y="${xy[1]+7}" text-anchor="middle">${names[i]}</text>`).join('')}<circle cx="240" cy="155" r="5" fill="#172d38"/><text x="228" y="180">O</text><text class="angle-label" x="${angle1[0]}" y="${angle1[1]+7}" text-anchor="middle">${giv}</text><text x="${angle2[0]}" y="${angle2[1]+7}" text-anchor="middle" style="fill:#99560e">${betaText}</text></svg>`;
  }
  function angleScenes(p) {
    const b=180-p.alpha;
    return [
      scene('read-diagram-1','Две прямые, четыре угла','Две прямые пересекаются. Найди угол, смежный с известным.',`∠AOC = ${p.alpha}°`,'Поворот рисунка не меняет отношения между углами.'),
      scene('try-yourself-2','Что связывает соседние углы?','Найди общую сторону соседних углов. Что образуют две другие стороны?','∠AOC и ∠COB','Подумай до открытия правила.', 'observe', {click:true,button:'Открыть правило'}),
      scene('adjacency-rule-3','Узнаём смежные углы','Одна сторона у этих углов общая. Две другие образуют прямую. Углы смежные.','∠AOC + ∠COB = 180°','Смежные углы вместе образуют развёрнутый угол.', 'hint'),
      scene('wrong-vertical-4','Рядом — не значит напротив','Ошибочно считать соседние углы на рисунке равными: они смежные, а не вертикальные.',`∠COB = ${p.alpha}° — ошибка`,'У этих углов есть общая сторона OC.', 'wrong'),
      scene('fix-relation-5','Исправляем связь','Сумма смежных углов равна 180 градусам.',`${p.alpha}° + ∠COB = 180°`,'Используем сумму, а не равенство углов.', 'correct'),
      scene('pause-before-answer-6','Как найти неизвестный угол?','Какое действие позволит найти второй угол, если известен первый?',`${p.alpha}° + ? = 180°`,'Остановись и вычисли самостоятельно.', 'observe', {click:true,button:'Показать следующий шаг'}),
      scene('calculate-angle-7','Вычисляем',`Из 180 вычтем ${p.alpha}. Искомый угол равен ${b} градусам.`,`∠COB = 180° − ${p.alpha}° = ${b}°`,'Вычитаем известную часть из целого развёрнутого угла.', 'correct',{diagram:'answer'}),
      scene('check-sum-8','Проверяем сумму','Сложи оба смежных угла. Их сумма должна быть 180 градусов.',`${p.alpha}° + ${b}° = 180°`,'Оба угла положительны и меньше 180°.', 'correct',{diagram:'check'}),
      scene('distinguish-vertical-9','А вот вертикальные углы','Углы напротив друг друга на пересечении прямых — вертикальные. Они равны.',`∠BOD = ∠AOC = ${p.alpha}°`,'У вертикальных углов нет общей стороны.', 'observe',{diagram:'vertical'}),
      scene('independent-task-10','Новый рисунок, новое задание','На новом рисунке найди неизвестный угол самостоятельно. Проверь сумму смежных углов.',`∠AOC = ${p.next}°; ∠COB = ?`,'Не используй ответ предыдущего примера.', 'final',{diagram:'independent'})
    ];
  }
  const helpPresets = [
    {theme:'Уравнение',rule:'К обеим частям уравнения применяют одну и ту же допустимую операцию.',step:'Сначала раскрой скобки, умножив каждое слагаемое.',analogue:'2(y + 1) + 3 = 11',worked:'2y + 2 + 3 = 11 → 2y = 6 → y = 3',fresh:'3(z − 1) + 2 = 17',verify:'Подставь корень в исходное уравнение.'},
    {theme:'Смежные углы',rule:'Сумма смежных углов равна 180°.',step:'Вычти известный угол из 180°.',analogue:'Смежные углы: 64° и β',worked:'β = 180° − 64° = 116°',fresh:'Смежные углы: 71° и γ. Найди γ.',verify:'Сложи оба угла: сумма должна быть 180°.'},
    {theme:'Подобные слагаемые',rule:'У подобных слагаемых одинаковая буквенная часть.',step:'Сложи коэффициенты при одинаковой буквенной части.',analogue:'5a + 2a − 3',worked:'5a + 2a − 3 = 7a − 3',fresh:'6b − 2b + 5. Упрости выражение.',verify:'Проверь равенство выражений при выбранном значении буквы.'}
  ];
  function helpScenes(p) {
    return [
      scene('select-homework-1','Открой своё задание','В настоящем кабинете выбери домашнее задание и прочитай условие. Здесь — только учебный пример.',p.theme,'Показан сценарий помощи, а не подключение к твоему кабинету.', 'observe',{route:0}),
      scene('try-first-2','Начни с собственной попытки','Запиши условие и сделай первый шаг в тетради. Отметь место, где возник вопрос.','Условие → моя попытка','Сначала попробуй самостоятельно. Ошибка помогает найти затруднение.', 'observe',{route:1}),
      scene('recall-rule-3','Вспомни подходящее правило','Первая подсказка напоминает правило, но не выдаёт решение твоего задания.','Подсказка 1 · правило',p.rule, 'hint',{route:2,click:true,button:'Открыть правило'}),
      scene('hint-next-step-4','Уточни следующий шаг','Вторая подсказка предлагает одно действие. Выполни его сам и вернись к задаче.','Подсказка 2 · действие',p.step, 'hint',{route:2,click:true,button:'Открыть следующий шаг'}),
      scene('worked-analogue-5','Разбираем другое задание','Если затруднение осталось, посмотри аналогичный пример с другими числами.',p.analogue,'Это аналог, а не готовый ответ к твоей работе.', 'next',{route:2,click:true,button:'Открыть аналог'}),
      scene('analogue-solution-6','Следи за основанием каждого шага','Прочитай решение аналога. Объясни себе, почему допустим каждый шаг.',p.worked,p.rule, 'correct',{route:2}),
      scene('fresh-independent-7','Закрой помощь и реши сам','Теперь попробуй новое задание самостоятельно. Сначала не открывай подсказки.',p.fresh,'Просмотр аналога не заменяет самостоятельную попытку.', 'next',{route:3,click:true,button:'Перейти к своей попытке'}),
      scene('check-own-work-8','Проверь свою запись','Перед отправкой проверь вычисления и объяснение каждого шага.','Решение + проверка',p.verify, 'correct',{route:3}),
      scene('photo-work-9','Подготовь читаемое фото','В настоящем кабинете приложи фото всей работы: условие, ход решения и проверку.','Условие · шаги · проверка','Эта демонстрация не принимает и не сохраняет фотографии.', 'observe',{route:4}),
      scene('send-for-check-10','Отправь на проверку в своём кабинете','Если в твоём кабинете доступна отправка, передай работу учителю и дождись обратной связи.','Работа → проверка учителем','Эта страница ничего не отправляет и не выставляет оценку.', 'next',{route:4}),
      scene('pilot-boundary-11','Помощь — ещё не освоение','Обсуди с учителем свою самостоятельную работу. Просмотр и число подсказок не определяют твой уровень.','Объясни свой следующий шаг','Пилот проверяет удобство помощи. Усвоение проверяют по самостоятельному решению.', 'observe',{route:4}),
      scene('independent-task-12','Твоя самостоятельная попытка','Вернись к новому заданию. Запиши решение и проверку без открытого примера.',p.fresh,'Ответ намеренно не показан. Если застрял, начни с минимальной подсказки.', 'final',{route:3})
    ];
  }
  let currentTask='linear-equation', currentPreset=1, currentIndex=0, scenes=[], timer=null;
  let motionFrame=null, motionSeek=()=>{}, motionProgress=1;
  for(const task of tasks){if(!Array.from($('task').options).some(o=>o.value===task)){const option=document.createElement('option');option.value=task;option.textContent=labels[task];$('task').append(option);}}
  function normalize(tab) { const raw=String(tab),task=tasks.includes(raw)?raw:raw.startsWith('t')?raw.slice(1):raw; if(!tasks.includes(task)) throw new Error('Unknown pilot task'); return task; }
  function validateType(type) { if(type && type!=='ideal-solution') throw new Error('Pilot supports ideal-solution only'); }
  // Build the visible prefix from the requested scene, never from visited scenes.
  // The renderer can jump backwards, forwards or between presets in any order.
  function historyHTML(entries, heading='Ход решения', empty='Здесь будут оставаться верные шаги.') {
    const visible=entries.filter(entry=>entry.at<=currentIndex);
    return `<section class="solution-record" aria-label="${esc(heading)}"><p class="history-heading">${esc(heading)}</p><ol id="solution-history" class="solution-history">${visible.map((entry,i)=>`<li class="history-line${i===visible.length-1?' is-current':''}" data-scene-id="${esc(scenes[entry.at].id)}"${i===visible.length-1?' aria-current="step"':''}><span class="history-number" aria-hidden="true">${i+1}</span><div><span class="history-math">${esc(entry.math)}</span>${entry.label?`<span class="history-label">${esc(entry.label)}</span>`:''}</div></li>`).join('')}</ol>${visible.length?'':`<p class="history-empty">${esc(empty)}</p>`}</section>`;
  }
  function conditionHTML(s) {
    if(currentTask.startsWith('grade7-g-')) {
      const entries=scenes.map((entry,at)=>({at,math:entry.record,label:entry.recordLabel})).filter(entry=>typeof entry.math==='string'&&entry.math);
      return `<p class="small-label">${s.action==='final'?'Разобранный пример':'Условие'} · вариант ${currentPreset}</p><div class="formula condition-formula">${esc(scenes[0].math)}</div><div class="grade7-geometry-history"><div id="retained-diagram" aria-label="Рисунок разобранного примера"></div>${historyHTML(entries)}</div>`;
    }
    if(currentTask!=='adjacent-angles' && scenes.some(entry=>entry.record)) {
      const entries=scenes.map((entry,at)=>({at,math:entry.record,label:entry.recordLabel})).filter(entry=>typeof entry.math==='string'&&entry.math);
      return `<p class="small-label">${s.action==='final'?'Разобранный пример':'Условие'} · вариант ${currentPreset}</p><div class="formula condition-formula">${esc(scenes[0].math)}</div>${historyHTML(entries)}${s.action==='wrong'?'<p class="history-warning">Ошибка показана отдельно. В ход решения записываем только верные строки.</p>':''}`;
    }
    if(currentTask==='adjacent-angles') {
      const p=anglePresets[currentPreset-1], stage=s.diagram||'question', fresh=stage==='independent';
      const entries=fresh?[]:[{at:2,math:'∠AOC + ∠COB = 180°'},{at:4,math:`${p.alpha}° + ∠COB = 180°`},{at:6,math:`∠COB = 180° − ${p.alpha}° = ${180-p.alpha}°`},{at:7,math:`${p.alpha}° + ${180-p.alpha}° = 180°`,label:'Проверка суммы'},{at:8,math:`∠BOD = ∠AOC = ${p.alpha}°`,label:'Вертикальные углы'}];
      return `<p class="small-label">${fresh?'Новое задание':'Условие'} · AB и CD — прямые</p><div class="geometry-history"><div class="geometry-condition">${angleDiagram(p,stage)}<div class="condition-formula geometry-given">∠AOC = ${fresh?p.next:p.alpha}°</div><p class="geometry-question">Найди ∠COB</p></div>${historyHTML(entries,fresh?'Твоя самостоятельная попытка':'Ход решения',fresh?'Начни новую запись. Ответ предыдущего примера здесь не используется.':'Сначала прочитай рисунок и найди смежные углы.')}</div>`;
    }
    const p=helpPresets[currentPreset-1];
    if(currentIndex<4) {
      const entries=[{at:0,math:'Прочитать условие'},{at:1,math:'Сделать свою попытку'},{at:2,math:'Вспомнить правило'},{at:3,math:'Наметить одно действие'}];
      return `<p class="small-label">Путь к решению · учебный пример</p><div class="formula condition-formula">${esc(p.theme)}</div>${historyHTML(entries,'Что уже показано')}`;
    }
    if(currentIndex<6) {
      const entries=p.worked.split(' → ').map(math=>({at:5,math}));
      return `<p class="small-label">Разбираем другой пример</p><div class="formula condition-formula">${esc(p.analogue)}</div>${historyHTML(entries,'Решение аналога','Сначала прочитай условие аналога. Затем открой его решение.')}`;
    }
    const entries=[{at:6,math:'Решить без открытого примера'},{at:7,math:'Проверить свою запись'},{at:8,math:'Подготовить фото всей работы'},{at:9,math:'Передать работу учителю'},{at:10,math:'Обсудить обратную связь'}];
    return `<p class="small-label">Новое самостоятельное задание</p><div class="formula condition-formula">${esc(p.fresh)}</div>${historyHTML(entries,'Путь самостоятельной работы')}<p class="history-notice">Это инструкция, а не отметки о выполнении.</p>`;
  }
  function stop() { clearTimeout(timer);timer=null;cancelAnimationFrame(motionFrame);motionFrame=null;$('play').textContent='▶ Смотреть шаги';$('play-status').textContent=''; }
  function render(announce=true) {
    const s=scenes[currentIndex];$('scene-title').textContent=s.title;$('lesson-label').textContent=`${labels[currentTask]} · учебный пример`;$('scene-count').textContent=`${currentIndex+1} / ${scenes.length}`;$('progress-fill').style.width=`${(currentIndex+1)/scenes.length*100}%`;
    document.querySelector('.lesson-frame').dataset.task=currentTask;
    $('condition').innerHTML=conditionHTML(s);if($('retained-diagram'))window.MathExamMotion.mount($('retained-diagram'),scenes[0].motion,$('condition'));$('step-panel').className=`step-panel ${s.action==='wrong'?'wrong':''}`;
    $('step-panel').innerHTML=`<span class="action-tag">${actions[s.action]}</span>${s.motion&&s.motion.type!=='geometry'?'<div id="motion-stage" class="motion-stage"></div>':formula(s.math)}<p>${esc(s.narration)}</p><p class="subtle">${esc(s.note)}</p>${s.button?`<span class="demo-button" id="scene-target">→ ${esc(s.button)}</span><p class="demo-label">Иллюстрация действия</p>`:''}`;
    if(s.motion){let stage=$('motion-stage');if(!stage){stage=document.createElement('div');stage.id='motion-stage';stage.className='motion-stage';$('step-panel').append(stage);}motionSeek=window.MathExamMotion.mount(stage,s.motion,$('condition'));}else{motionSeek=()=>{};}motionProgress=1;$('replay-motion').hidden=!s.motion;
    $('previous').disabled=currentIndex===0;$('next').disabled=currentIndex===scenes.length-1;
    if(announce)$('scene-status').textContent=`Шаг ${currentIndex+1}. ${s.title}. ${s.narration}`;
    document.querySelectorAll('#transcript button').forEach((el,i)=>{if(i===currentIndex)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
  }
  function configurePractice() {
    $('answer').value='';$('feedback').textContent='';$('hint-one').open=false;$('hint-two').open=false;
    if(currentTask==='linear-equation') {$('practice-question').textContent='Объясни, как перенести буквенное слагаемое влево, а число — вправо: '+scenes[0].math;$('hint-one-text').textContent='Перенос через знак равенства меняет знак слагаемого. Это короткая запись одинакового действия над обеими частями.';$('hint-two-text').textContent='Переноси всё слагаемое вместе с его знаком. После переноса отдельно приведи подобные слева и вычисли числа справа.';}
    else if(currentTask==='adjacent-angles') {$('practice-question').textContent='Чему равна сумма углов AOC и COB? Запиши число.';$('hint-one-text').textContent='У углов общая сторона OC, а лучи OA и OB образуют прямую.';$('hint-two-text').textContent='Это смежные углы. Вместе они образуют развёрнутый угол.';}
    else if(cheatsheets[currentTask]) {const card=cheatsheets[currentTask];$('practice-question').textContent=`Объясни следующий шаг: ${scenes.at(-1).math}`;$('hint-one-text').textContent=(card.rule||[]).join(' ');$('hint-two-text').textContent=card.practice?.instruction||'Вернись к правилу, затем выполни одно действие самостоятельно.';}
    else {$('practice-question').textContent='Что сделать до открытия первой подсказки? Запиши словами.';$('hint-one-text').textContent='Помощь начинается после собственной попытки, а не вместо неё.';$('hint-two-text').textContent='Запиши условие, сделай первый шаг и отметь своё затруднение.';}
  }
  function prepare(tab,preset,type='ideal-solution') {
    validateType(type);const task=normalize(tab), n=Number(preset==null?1:preset);if(!Number.isInteger(n)||n<1||n>3)throw new Error('Pilot preset must be 1, 2 or 3');stop();currentTask=task;currentPreset=n;currentIndex=0;
    scenes=task==='linear-equation'?equationScenes(equations[n-1]):task==='adjacent-angles'?angleScenes(anglePresets[n-1]):typeof cheatsheets[task]?.scenes==='function'?cheatsheets[task].scenes(n):helpScenes(helpPresets[n-1]);
    scenes=window.MathExamMotionTopics.decorate(task,n,scenes);
    $('task').value=task;$('preset').value=String(n);
    $('transcript').innerHTML=scenes.map((s,i)=>`<li><button type="button" data-index="${i}">${esc(s.title)}</button><p>${esc(s.math)}</p><p>${esc(s.narration)} ${esc(s.note)}</p></li>`).join('');configurePractice();render(false);
    return {format:'mathexam-video-manifest',tab:`t${task}`,videoType:'ideal-solution',scenes:scenes.map(({id,narration,duration_hint_ms,action,click,motion_ms})=>({id,narration,duration_hint_ms,action,click,...(motion_ms?{motion_ms}:{})}))};
  }
  function show(tab,id,type='ideal-solution') {
    validateType(type);if(normalize(tab)!==currentTask)throw new Error('Call prepare for this task first');const i=scenes.findIndex(s=>s.id===id);if(i<0)throw new Error('Unknown scene');stop();currentIndex=i;render(false);
    const target=$('scene-target');const rect=target?.getBoundingClientRect();return {sceneId:id,action:scenes[i].action,click:scenes[i].click,targetY:0,...(rect?{clickTargetX:rect.x+rect.width/2,clickTargetY:rect.y+rect.height/2}:{})};
  }
  function seekMotion(progress){cancelAnimationFrame(motionFrame);motionFrame=null;motionProgress=Math.max(0,Math.min(1,Number(progress)||0));motionSeek(motionProgress);return{sceneId:scenes[currentIndex].id,progress:motionProgress};}
  function animateMotion(){cancelAnimationFrame(motionFrame);const duration=scenes[currentIndex].motion_ms;if(!duration||matchMedia('(prefers-reduced-motion: reduce)').matches){seekMotion(1);return;}const begin=performance.now();motionProgress=0;motionSeek(0);function frame(now){motionProgress=Math.min(1,(now-begin)/duration);motionSeek(motionProgress);if(motionProgress<1)motionFrame=requestAnimationFrame(frame);else{motionFrame=null;if(!timer){$('play').textContent='▶ Смотреть шаги';$('play-status').textContent='Движение завершено.';}}}motionFrame=requestAnimationFrame(frame);}
  $('replay-motion').addEventListener('click',()=>{stop();animateMotion();if(motionFrame){$('play').textContent='Ⅱ Пауза';$('play-status').textContent='Повтор движения без звука.';}});
  function advance(){if(currentIndex<scenes.length-1){currentIndex++;render();animateMotion();timer=setTimeout(advance,scenes[currentIndex].duration_hint_ms);}else{stop();$('play-status').textContent='Пример завершён. Теперь реши новое задание самостоятельно.';}}
  $('play').addEventListener('click',()=>{if(timer||motionFrame){stop();$('play-status').textContent='Пауза';return;}if(currentIndex===scenes.length-1)currentIndex=0;render();animateMotion();$('play').textContent='Ⅱ Пауза';$('play-status').textContent='Без звука. Движение показывает преобразование; можно поставить на паузу.';timer=setTimeout(advance,scenes[currentIndex].duration_hint_ms);});
  $('previous').addEventListener('click',()=>{stop();if(currentIndex>0)currentIndex--;render();});$('next').addEventListener('click',()=>{stop();if(currentIndex<scenes.length-1)currentIndex++;render();});
  $('task').addEventListener('change',()=>prepare($('task').value,$('preset').value));$('preset').addEventListener('change',()=>prepare($('task').value,$('preset').value));$('picker').addEventListener('submit',e=>e.preventDefault());
  $('transcript').addEventListener('click',e=>{const button=e.target.closest('button[data-index]');if(button){stop();currentIndex=Number(button.dataset.index);render();}});
  const normalized = text => text.toLowerCase().replace(/х/g,'x').replace(/[\s°·*]/g,'').replace(/[−–]/g,'-');
  $('practice-form').addEventListener('submit',e=>{e.preventDefault();const answer=$('answer').value.trim();if(!answer){$('feedback').textContent='Сначала запиши свою попытку. Можно открыть минимальную подсказку.';return;}if(currentTask==='linear-equation'){$('feedback').textContent='Сверь объяснение с правилом: через знак равенства переносим с противоположным знаком. Внутри одной части при перестановке знак сохраняем. Это вопрос на объяснение, ответ автоматически не оценивается.';}else if(currentTask==='adjacent-angles'){$('feedback').textContent=normalized(answer)==='180'?'Да, сумма смежных углов равна 180°. Объясни по рисунку, почему эти углы смежные.':'Проверь, какой угол образуют лучи OA и OB. Начни с первой подсказки.';}else if(cheatsheets[currentTask]){$('feedback').textContent='Сверь свой шаг с правилом в первой подсказке. Объясни, почему действие допустимо, и проверь результат. Этот ответ не оценивается автоматически.';}else{$('feedback').textContent='Сверь свою формулировку: сначала прочитать условие и сделать собственную попытку. Этот ответ не оценивается автоматически.';}});
  $('download').addEventListener('click',()=>{const text=`${labels[currentTask]} · вариант ${currentPreset}\nАвторский учебный пример. Просмотр не означает усвоение.\n\n`+scenes.map((s,i)=>`${i+1}. ${s.title}\n${s.math}\n${s.narration}\n${s.note}\n`).join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`${currentTask}-preset-${currentPreset}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  const query=new URLSearchParams(location.search);if(query.get('studio')==='1')document.body.classList.add('studio-mode');
  prepare(tasks.includes(query.get('task'))?query.get('task'):'linear-equation',/^[123]$/.test(query.get('preset')||'')?Number(query.get('preset')):1);
  window.MathExamVideoStudio=Object.freeze({prepare,show,seekMotion});window.__MATH_EXAM_VIDEO_READY__=true;
})();
