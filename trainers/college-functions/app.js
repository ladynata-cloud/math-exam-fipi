(function () {
  'use strict';
  const D=window.CollegeFunctionsData, E=window.CollegeFunctionsEngine, P=window.CollegeFunctionsPlot;
  if(!D||!E||!P){document.getElementById('current-step').textContent='Не удалось загрузить тренажёр. Обновите страницу.';return;}
  const $=id=>document.getElementById(id), esc=E.escapeHTML;
  const KEY='mathExam.collegeFunctions.v1';
  // Board isolation is decided before the first access to personal storage.
  const BOARD=window.CollegeFunctionsBoardMode===true || new URLSearchParams(window.location.search).get('board')==='1';
  let feedbackCode='none';
  const titles=['Область определения','Таблица точек','Построение графика','Область значений','Нули функции','Выше и ниже оси Ox','Возрастание и убывание','Чётность'];
  const helpKeys=['domain','points','placepoints','range','zeros','sign','monotonicity','parity'];
  const familyNames={root:'Квадратный корень',sqrt:'Квадратный корень',quadratic:'Парабола',exp:'Показательная',exponential:'Показательная',log:'Логарифм',logarithmic:'Логарифм',piecewise:'По частям'};
  let storageOK=true, store={attempts:{},results:{},seen:{},last:null,diagnostic:null}, mode='learn', task=D.tasks[0], focusedInput=null;
  if(!BOARD)try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&raw.attempts&&raw.seen){store=raw;}}catch(_){storageOK=false;}
  if(!store.attempts||typeof store.attempts!=='object')store.attempts={};
  if(!store.seen||typeof store.seen!=='object')store.seen={};
  if(!store.results||typeof store.results!=='object')store.results=Object.fromEntries(Object.entries(store.attempts).filter(([,a])=>a&&a.completed));
  const familyIds=[...new Set(D.tasks.map(t=>t.family))];
  function familyTitle(id){const f=Array.isArray(D.families)?D.families.find(x=>x.id===id):D.families&&D.families[id];return familyNames[id]||(f&&f.title)||(f&&f.name)||id;}
  function save(){if(BOARD)return;try{localStorage.setItem(KEY,JSON.stringify(store));}catch(_){storageOK=false;}}
  function blank(fresh){return {stage:0,drafts:{},accepted:[],marked:[],helpUsed:false,hintLevel:0,hintOpen:false,errors:0,completed:false,fresh:!BOARD&&!!fresh};}
  function key(){return mode+':'+task.id;}
  function attempt(){let a=store.attempts[key()];if(!a||!Number.isInteger(a.stage)||a.stage<0||a.stage>8||!a.drafts||typeof a.drafts!=='object'||!Array.isArray(a.accepted)||!Array.isArray(a.marked)){a=blank(mode==='test'&&!store.seen[task.id]);store.attempts[key()]=a;}return a;}
  if(store.last&&D.tasks.some(t=>t.id===store.last.id)){task=D.tasks.find(t=>t.id===store.last.id);mode=store.last.mode==='test'?'test':'learn';}
  function selectTask(id,nextMode=mode){const t=D.tasks.find(x=>x.id===id);if(!t)return;feedbackCode='none';if(BOARD&&(id!==task.id||nextMode!==mode))store={attempts:{},results:{},seen:{},last:null,diagnostic:null};if(nextMode==='learn'&&store.attempts['test:'+id]&&!store.attempts['test:'+id].completed)store.attempts['test:'+id].fresh=false;task=t;mode=nextMode;attempt();store.seen[task.id]=true;store.last={id:task.id,mode};save();render();}
  function rich(text){return esc(String(text||'')).replace(/(^|[\s(=;])(-?\d+)\/(\d+)(?=$|[\s);,.])/g,(_,pre,n,d)=>pre+'<span class="frac"><span>'+n+'</span><span>'+d+'</span></span>');}
  function pointLabel(p){return '('+(p.xLabel||E.formatNumber(p.x))+'; '+(p.yLabel||E.formatNumber(p.y))+')';}
  function setText(s){return E.formatSet(s);}
  function intervalText(v){return E.formatIntervals(v||[]);}
  function constIntervals(){return task.constant||task.constants||[];}
  function input(name,label,helper='',placeholder=''){const a=attempt();return '<label class="answer-field">'+label+'<input data-answer="'+name+'" id="answer-'+name+'" type="text" maxlength="200" autocomplete="off" spellcheck="false" value="'+esc(String(a.drafts[name]||'').slice(0,200))+'" placeholder="'+esc(placeholder)+'">'+(helper?'<small>'+helper+'</small>':'')+'</label>';}
  function symbols(){return '<div class="symbol-pad" aria-label="Символы для ответа">'+['ℝ','∅','−','∞','∪','[',']','(',')',';','{','}'].map(s=>'<button type="button" data-symbol="'+s+'" aria-label="Вставить '+s+'">'+s+'</button>').join('')+'</div>';}
  function feedback(message,ok=false){feedbackCode=ok?(attempt().stage===2&&attempt().marked.length?'point-correct':'step-correct'):(attempt().stage===2?'point-wrong':'check-wrong');$('feedback').innerHTML='<div class="status '+(ok?'good':'bad')+'">'+esc(message)+'</div>';}
  function failureMessage(){const a=attempt(),v=a.drafts;
    if(a.stage===0)return 'Проверьте допустимые x и скобку на границе. Если записываете промежуток, разделите его концы точкой с запятой.';
    if(a.stage===1)return 'Проверьте выделенные значения y. Правильные вычисления сохранены.';
    if(a.stage===2)return 'Точка пока не совпала. Сначала найдите x по горизонтали, затем y по вертикали. Для дробей можно ввести координаты в поля.';
    if(a.stage===3)return 'Проверьте именно значения y. Достигается ли каждая граница? Нет ли пропущенных высот при скачке?';
    if(a.stage===4)return 'Запишите значения x, где график пересекает Ox. Для кусочной функции каждый найденный x должен подходить условию своей строки.';
    if(a.stage===5)return (!E.sameSet(v.positive,task.positive)?'Проверьте участок выше оси Ox. ':'')+(!E.sameSet(v.negative,task.negative)?'Проверьте участок ниже оси Ox. ':'')+'Нули не включаются; область определения тоже ограничивает ответ.';
    if(a.stage===6)return (!E.sameIntervals(v.up,task.up,{allowOpenFinite:true})?'Проверьте возрастание. ':'')+(!E.sameIntervals(v.down,task.down,{allowOpenFinite:true})?'Проверьте убывание. ':'')+(!E.sameIntervals(v.constant,constIntervals(),{allowOpenFinite:true})?'Проверьте постоянные участки. ':'')+'При скачке проверьте направление перехода. Не объединяйте участки через скачок вниз.';
    return 'Сначала проверьте симметрию области определения. Ось симметрии x=1 не означает чётность: для чётной функции нужна ось Oy.';
  }
  function renderFeedback(){
    if(feedbackCode==='none'){$('feedback').textContent='';return;}
    const good=feedbackCode==='step-correct'||feedbackCode==='point-correct';
    const message=feedbackCode==='step-correct'?'Верно. Предыдущий шаг сохранён. Перейдём дальше.':feedbackCode==='point-correct'?'Точка отмечена. Теперь следующая.':failureMessage();
    $('feedback').innerHTML='<div class="status '+(good?'good':'bad')+'">'+esc(message)+'</div>';
    if(feedbackCode==='check-wrong'&&attempt().stage===1)task.points.forEach((p,i)=>{const n=E.parseNumber(attempt().drafts['y'+i]),ok=n!==null&&E.near(n,p.y),el=document.querySelector('[data-answer="y'+i+'"]');el.classList.toggle('valid',ok);el.classList.toggle('invalid',!ok);$('row-status-'+i).textContent=ok?'✓ Верно':'Проверьте y';});
  }
  function renderFamilies(){const a=attempt();$('families').innerHTML=familyIds.map(id=>'<button data-family="'+esc(id)+'" class="'+(id===task.family?'active':'')+'" aria-pressed="'+(id===task.family)+'">'+esc(familyTitle(id))+'<span class="family-count">8 задач</span></button>').join('');
    $('task-select').innerHTML=D.tasks.filter(t=>t.family===task.family).map(t=>'<option value="'+t.id+'"'+(t.id===task.id?' selected':'')+'>'+esc(t.id+' · '+t.formulaText)+'</option>').join('');
    $('learn-mode').setAttribute('aria-pressed',String(mode==='learn'));$('test-mode').setAttribute('aria-pressed',String(mode==='test'));
    $('mode-note').textContent=mode==='learn'?'Разбираем по шагам. Подсказка доступна на каждом шаге и сохраняет Вашу работу.':a.fresh?'Новая задача без подсказок. Только решение с первой попытки попадёт в «Самостоятельно».':'Повторная проверка без подсказок. Эта задача уже встречалась и не считается новой самостоятельной работой.';
    document.querySelector('.course-tools>details:last-child').hidden=mode==='test';
    if(BOARD){$('mode-note').textContent=mode==='learn'?'Совместная работа на доске. Задание, ответы и подсказки видны обоим участникам.':'Совместная проверка без подсказок. Личные результаты за эту работу не начисляются.';$('test-mode').textContent='Без подсказок';}
    if(mode==='test')$('course-cheatsheet').open=false;
    if(!storageOK){$('mode-note').textContent+=' Браузер не разрешил сохранение: работа доступна до закрытия страницы.';}
  }
  function renderGraph(){const a=attempt();const points=a.stage>=3?task.points: a.stage===2?a.marked.map(i=>task.points[i]).filter(Boolean):[];
    P.render($('graph'),task,{showCurve:a.stage>=3,points,showGuides:a.stage>=3});$('graph').classList.toggle('place-active',a.stage===2);
    $('graph-caption').textContent=a.stage<2?'График появится по частям. Сначала найдите допустимые x и вычислите значения y.':a.stage===2?'Отметьте вычисленные точки на плоскости. Можно нажимать на график или вводить координаты ниже.':'Синяя линия — график функции. Пунктир показывает асимптоту, если она есть. Пустой кружок исключает точку.';
    if(a.stage===2){const i=a.marked.length,p=task.points[i];$('point-controls').innerHTML=p?'<p class="point-target">Отметьте точку <b>'+rich(pointLabel(p))+'</b> <span class="point-progress">'+(i+1)+' из '+task.points.length+'</span></p><div class="point-row"><label>Координата x<input id="plot-x" data-answer="plotX" value="'+esc(a.drafts.plotX||'')+'" type="text" maxlength="200" inputmode="text" aria-label="Координата x отмечаемой точки"></label><label>Координата y<input id="plot-y" data-answer="plotY" value="'+esc(a.drafts.plotY||'')+'" type="text" maxlength="200" inputmode="text" aria-label="Координата y отмечаемой точки"></label><button id="place-point">Отметить</button></div>':'';}else $('point-controls').innerHTML='';
  }
  function render(){const a=attempt();renderFamilies();$('task-id').textContent=task.id;$('formula').innerHTML=task.formulaHtml;$('step-counter').textContent=a.stage<8?'Шаг '+(a.stage+1)+' из 8':'Задача завершена';$('step-progress').style.width=(a.stage/8*100)+'%';$('assistance').textContent=a.helpUsed?'С подсказкой':a.errors?'Были исправления':'';
    $('feedback').innerHTML='';$('history').innerHTML=a.accepted.map((answer,i)=>'<div class="done-step"><b>✓ '+(i+1)+'. '+titles[i]+'</b><span>'+rich(answer)+'</span></div>').join('');
    renderGraph();renderStep();renderHelp();renderProgress();renderFeedback();
  }
  function renderStep(){const a=attempt(), s=a.stage;let body='';
    if(s===8){renderComplete();return;}
    if(s===0)body='<h2>Какие x разрешены?</h2><p>Запишите область определения функции: все значения x, при которых формула имеет смысл.</p>'+input('domain','Область определения D(f)','Введите промежуток, объединение или R. Например: [4; +∞).')+symbols();
    if(s===1)body='<h2>Вычислим точки графика</h2><p>Для каждого данного x найдите y по формуле. Можно вводить дробь через /.</p><table class="points-table"><thead><tr><th scope="col">Значение x</th><th scope="col">Найдите y</th><th scope="col">Проверка</th></tr></thead><tbody>'+task.points.map((p,i)=>'<tr><td>'+rich(p.xLabel||E.formatNumber(p.x))+'</td><td><input data-answer="y'+i+'" aria-label="Значение y при x = '+esc(p.xLabel||E.formatNumber(p.x))+'" type="text" maxlength="200" autocomplete="off" value="'+esc(String(a.drafts['y'+i]||''))+'"></td><td class="row-status" id="row-status-'+i+'"></td></tr>').join('')+'</tbody></table>';
    if(s===2)body='<h2>Перенесём точки на плоскость</h2><p>Сначала идём по оси x, затем вверх или вниз до значения y. Нажмите в нужном месте на графике. Для точной дробной координаты используйте поля под ним.</p><p class="point-progress">Отмечено: '+a.marked.length+' из '+task.points.length+'</p>';
    if(s===3)body='<h2>Какие y получаются?</h2><p>Посмотрите на высоты, которых достигает график. Открытая граница и линия, к которой график только приближается, не входят в ответ.</p>'+input('range','Область значений E(f)','Введите промежуток, R или объединение. Отдельное число записывайте в фигурных скобках: {3}.')+symbols();
    if(s===4)body='<h2>Где y равен нулю?</h2><p>Найдите пересечения с осью Ox. Запишите значения x, а не координаты точек.</p>'+input('zeros','Нули функции','Несколько чисел разделяйте точкой с запятой. Если пересечений нет, введите «нет».')+symbols();
    if(s===5)body='<h2>Выше или ниже оси Ox?</h2><p>Укажите значения x. Точки с y=0 не входят ни в один из этих промежутков.</p>'+input('positive','При каких x функция положительна: f(x) > 0?','Промежуток, объединение, R или «нет».')+input('negative','При каких x функция отрицательна: f(x) < 0?','Промежуток, объединение, R или «нет».')+symbols();
    if(s===6)body='<h2>Читаем график слева направо</h2><p>Где с увеличением x растёт y? Где y уменьшается? Укажите целиком каждый промежуток монотонности. При скачке проверьте направление перехода: скачок вверх может сохранять возрастание, а скачок вниз — нарушать его.</p>'+input('up','Промежутки возрастания','Для нескольких частей используйте ∪ или «и». Если таких промежутков нет, напишите «нет».')+input('down','Промежутки убывания')+input('constant','Постоянные участки','Если горизонтальных участков нет, напишите «нет».')+symbols();
    if(s===7)body='<h2>Проверим чётность</h2><p>Сначала проверьте, симметрична ли область определения относительно нуля. Затем сравните f(−x) и f(x).</p><label class="answer-field">Какая это функция?<select data-answer="parity" id="answer-parity"><option value="">Выберите результат проверки</option><option value="even">Чётная: f(−x) = f(x)</option><option value="odd">Нечётная: f(−x) = −f(x)</option><option value="neither">Ни чётная, ни нечётная</option></select></label>';
    $('current-step').innerHTML=body;if(s===7)$('answer-parity').value=a.drafts.parity||'';
    $('step-actions').innerHTML=(s===2?'':'<button id="check-step">Проверить шаг</button>')+(mode==='learn'?'<button id="toggle-help" class="secondary">Хочешь подсказку?</button>':'');
  }
  function genericHint(){const hints={domain:'Для корня выражение под корнем должно быть не меньше нуля. Для логарифма его аргумент строго больше нуля. У функции по частям объедините разрешённые промежутки всех строк.',points:'Подставляйте x на его место. Сначала вычислите выражение под корнем, показатель степени или аргумент логарифма. Для функции по частям выберите строку по условию.',range:'Читайте значения по вертикальной оси. Проверьте нижнюю и верхнюю границы: достигается ли значение, или график только приближается к нему?',zeros:'Приравняйте y к нулю. Для логарифма используйте определение; для функции по частям проверьте принадлежность найденного x условию строки.',sign:'Найдите нули, затем разбейте область определения этими точками. На каждом участке посмотрите: график выше или ниже оси Ox?',monotonicity:'Двигайтесь слева направо. Отдельно проверьте вершины, скачки и горизонтальные участки. Два возрастающих куска не всегда дают возрастающую функцию целиком.',parity:'Если x разрешён, должен быть разрешён и −x. Затем проверьте симметрию: относительно Oy — чётная, относительно начала координат — нечётная.'};return hints[helpKeys[attempt().stage]]||hints.points;}
  function renderHelp(){const a=attempt();$('help-area').innerHTML='';if(mode!=='learn'||a.stage>=8||!a.hintOpen)return;
    const k=helpKeys[a.stage], hints=task.stepsHint||{}, explains=task.explanations||{};
    const clue=hints[k]||genericHint();const explanation=explains[k]||genericHint();
    $('help-area').innerHTML='<div class="hint-box"><div class="hint-header"><span>'+(a.hintLevel>1?'Разбор текущего шага':'Небольшая подсказка')+'</span><button id="close-help">Скрыть</button></div><p>'+rich(a.hintLevel>1?explanation:clue)+'</p>'+(a.hintLevel<2?'<button id="more-help">Покажи подробнее</button>':'<p class="muted">Теперь выполните действие сами. Введённые ответы сохранены.</p>')+'</div>';
  }
  function openHint(){const a=attempt();a.helpUsed=true;a.hintOpen=!a.hintOpen;a.hintLevel=Math.max(1,a.hintLevel||0);save();$('assistance').textContent='С подсказкой';renderHelp();}
  function wrong(msg){const a=attempt();a.errors=BOARD?Math.min(100000,a.errors+1):a.errors+1;save();$('assistance').textContent=a.helpUsed?'С подсказкой':'Были исправления';feedback(msg);}
  function success(summary){feedbackCode='none';const a=attempt();a.accepted[a.stage]=summary;a.stage++;a.hintOpen=false;a.hintLevel=0;if(a.stage===8){a.completed=true;if(!BOARD){const old=store.results[key()];if(!old||!(old.fresh&&!old.helpUsed&&!old.errors))store.results[key()]={completed:true,fresh:a.fresh,helpUsed:a.helpUsed,errors:a.errors};}}save();render();if(a.stage<8)feedback('Верно. Предыдущий шаг сохранён. Перейдём дальше.',true);}
  function check(){const a=attempt(), v=a.drafts;
    if(a.stage===0){if(E.sameSet(v.domain,task.domain))success('D(f) = '+setText(task.domain));else wrong('Проверьте допустимые x и скобку на границе. Если записываете промежуток, разделите его концы точкой с запятой.');}
    else if(a.stage===1){let all=true;task.points.forEach((p,i)=>{const num=E.parseNumber(v['y'+i]);const ok=num!==null&&E.near(num,p.y);all=all&&ok;const el=document.querySelector('[data-answer="y'+i+'"]');el.classList.toggle('valid',ok);el.classList.toggle('invalid',!ok);$('row-status-'+i).textContent=ok?'✓ Верно':'Проверьте y';});if(all)success(task.points.map(pointLabel).join('; '));else wrong('Проверьте выделенные значения y. Правильные вычисления сохранены.');}
    else if(a.stage===3){if(E.sameSet(v.range,task.range))success('E(f) = '+setText(task.range));else wrong('Проверьте именно значения y. Достигается ли каждая граница? Нет ли пропущенных высот при скачке?');}
    else if(a.stage===4){if(E.sameZeros(v.zeros,task.zeros))success('Нули: '+(task.zeros.length?task.zeros.map(E.formatNumber).join('; '):'нет'));else wrong('Запишите значения x, где график пересекает Ox. Для кусочной функции каждый найденный x должен подходить условию своей строки.');}
    else if(a.stage===5){const pos=E.sameSet(v.positive,task.positive),neg=E.sameSet(v.negative,task.negative);if(pos&&neg)success('f(x)>0: '+setText(task.positive)+'; f(x)<0: '+setText(task.negative));else wrong((!pos?'Проверьте участок выше оси Ox. ':'')+(!neg?'Проверьте участок ниже оси Ox. ':'')+'Нули не включаются; область определения тоже ограничивает ответ.');}
    else if(a.stage===6){const up=E.sameIntervals(v.up,task.up,{allowOpenFinite:true}),down=E.sameIntervals(v.down,task.down,{allowOpenFinite:true}),constant=E.sameIntervals(v.constant,constIntervals(),{allowOpenFinite:true});if(up&&down&&constant)success('Возрастает: '+intervalText(task.up)+'; убывает: '+intervalText(task.down)+'; постоянна: '+intervalText(constIntervals()));else wrong((!up?'Проверьте возрастание. ':'')+(!down?'Проверьте убывание. ':'')+(!constant?'Проверьте постоянные участки. ':'')+'При скачке проверьте направление перехода. Не объединяйте участки через скачок вниз.');}
    else if(a.stage===7){if(v.parity===task.parity)success({even:'Чётная: f(−x)=f(x).',odd:'Нечётная: f(−x)=−f(x).',neither:'Ни чётная, ни нечётная.'}[task.parity]);else wrong('Сначала проверьте симметрию области определения. Ось симметрии x=1 не означает чётность: для чётной функции нужна ось Oy.');}
  }
  function markPoint(x,y,fromClick=false,event=null){const a=attempt();if(a.stage!==2)return;const p=task.points[a.marked.length];if(!p)return;let ok;
    if(fromClick){const target=P.toScreen(task,p.x,p.y),given=P.toScreen(task,x,y);ok=Math.hypot(target.x-given.x,target.y-given.y)<17;}else ok=x!==null&&y!==null&&E.near(x,p.x)&&E.near(y,p.y);
    if(!ok){wrong('Точка пока не совпала. Сначала найдите x по горизонтали, затем y по вертикали. Для дробей можно ввести координаты в поля.');return;}
    a.marked.push(a.marked.length);a.drafts.plotX='';a.drafts.plotY='';save();if(a.marked.length===task.points.length)success('Все '+task.points.length+' точки отмечены. График построен.');else{renderGraph();renderStep();feedback('Точка отмечена. Теперь следующая.',true);}
  }
  function renderComplete(){const a=attempt();const independent=!BOARD&&mode==='test'&&a.fresh&&!a.helpUsed&&!a.errors;
    $('current-step').innerHTML='<h2>График исследован</h2><p>'+(independent?'Новая задача решена самостоятельно, с первой попытки.':a.helpUsed?'Вы разобрали задачу с подсказкой. Для самостоятельной проверки выберите новую похожую задачу.':a.errors?'Вы нашли и исправили ошибки. Закрепите результат на новой похожей задаче.':'Все восемь шагов пройдены. Проверьте понимание на новой похожей задаче.')+'</p><div class="status good">'+(BOARD?'✓ Совместная работа':independent?'✓ Самостоятельная работа':mode==='test'&&!a.fresh?'✓ Повторная проверка':'✓ Учебная работа')+'</div>';
    $('step-actions').innerHTML='<button id="fresh-check">Новая задача без подсказок</button><button id="repeat-task" class="secondary">Повторить эту</button>';$('help-area').innerHTML='';
  }
  function next(fresh=false){if(BOARD){const family=D.tasks.filter(t=>t.family===task.family),index=family.findIndex(t=>t.id===task.id);selectTask(family[(index+1)%family.length].id,fresh?'test':mode);return;}let pool=D.tasks.filter(t=>t.family===task.family&&t.id!==task.id);let candidate=pool.find(t=>!store.seen[t.id]);if(!candidate)candidate=pool.find(t=>!store.attempts[(fresh?'test':mode)+':'+t.id]?.completed)||pool[0];if(candidate)selectTask(candidate.id,fresh?'test':mode);}
  function renderProgress(){if(BOARD){$('progress-panel').hidden=true;$('progress-count').textContent='';$('progress-detail').textContent='';return;}const done=Object.entries(store.results).filter(([,a])=>a&&a.completed);const independent=done.filter(([k,a])=>k.startsWith('test:')&&a.fresh&&!a.helpUsed&&!a.errors).length;$('progress-count').textContent='· '+independent+' самостоятельно';
    $('progress-detail').innerHTML='<p><b>'+done.length+'</b> завершённых работ; <b>'+independent+'</b> новых задач решено самостоятельно с первой попытки.</p><ul class="progress-list">'+familyIds.map(id=>{const ids=D.tasks.filter(t=>t.family===id).map(t=>t.id);const seen=new Set(done.filter(([k])=>ids.includes(k.split(':')[1])).map(([k])=>k.split(':')[1]));return '<li>'+esc(familyTitle(id))+' <b>'+seen.size+'/8</b></li>';}).join('')+'</ul>'+(store.diagnostic?'<p>Последняя диагностика: '+store.diagnostic.correct+' из 8.</p>':'');}
  let diag=null;
  function diagnosticStart(){diag={index:0,answers:[]};$('diagnostic-dialog').showModal();renderDiagnostic();}
  function renderDiagnostic(){if(!diag)return;const qs=D.diagnostics||[];
    if(diag.index>=qs.length){const right=diag.answers.filter(x=>x.correct).length;const bad=diag.answers.filter(x=>!x.correct);const recommendation=bad.map(x=>x.family).find(x=>familyIds.includes(x))||familyIds[0];if(!BOARD){store.diagnostic={correct:right,date:Date.now()};save();renderProgress();}$('diagnostic-body').innerHTML='<div class="score">'+right+' / '+qs.length+'</div><h3>'+ (right===qs.length?'Основные правила знакомы':'Начнём с небольших шагов')+'</h3><p>'+esc(right===qs.length?'Попробуйте новую задачу в самостоятельном режиме.':'Рекомендуемый раздел: '+familyTitle(recommendation)+'. Откройте первую задачу в режиме «Учимся».')+'</p><ul class="summary-list">'+bad.map(x=>'<li><b>'+esc(x.id)+'</b>'+rich(x.explanation)+'</li>').join('')+'</ul><button id="start-recommended" data-family="'+esc(recommendation)+'">Перейти к практике</button><button id="restart-diagnostic" class="secondary">Пройти ещё раз</button>';return;}
    const q=qs[diag.index];$('diagnostic-body').innerHTML='<p class="diagnostic-count">Вопрос '+(diag.index+1)+' из '+qs.length+'</p><div class="diag-question">'+q.questionHtml+'</div><div class="diagnostic-options">'+q.optionItems.map(o=>'<button data-diag="'+esc(o.id)+'">'+o.labelHtml+'</button>').join('')+'</div>';
  }
  function draftChanged(event){const el=event.target;if(el.dataset.answer){let value=el.value.slice(0,200);if(BOARD)value=value.replace(/[<>\u0000-\u001f\u007f]/g,'');attempt().drafts[el.dataset.answer]=value;el.value=value;feedbackCode='none';$('feedback').textContent='';document.querySelectorAll('.row-status').forEach(x=>x.textContent='');document.querySelectorAll('.points-table input').forEach(x=>x.classList.remove('valid','invalid'));save();}}
  document.addEventListener('input',draftChanged);
  document.addEventListener('change',draftChanged);
  document.addEventListener('focusin',event=>{if(event.target.dataset.answer)focusedInput=event.target;});
  document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;
    if(b.dataset.family&&b.id!=='start-recommended'){const t=D.tasks.find(t=>t.family===b.dataset.family);if(t)selectTask(t.id);}
    if(b.dataset.symbol){const el=focusedInput&&document.contains(focusedInput)?focusedInput:document.querySelector('#current-step input[data-answer]');if(el){const pos=el.selectionStart??el.value.length;el.value=el.value.slice(0,pos)+b.dataset.symbol+el.value.slice(el.selectionEnd??pos);el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();el.setSelectionRange(pos+b.dataset.symbol.length,pos+b.dataset.symbol.length);}return;}
    if(b.id==='check-step')check();if(b.id==='toggle-help')openHint();
    if(b.id==='close-help'){attempt().hintOpen=false;save();renderHelp();}
    if(b.id==='more-help'){attempt().hintLevel=2;save();renderHelp();}
    if(b.id==='place-point')markPoint(E.parseNumber($('plot-x').value),E.parseNumber($('plot-y').value));
    if(b.id==='fresh-check')next(true);
    if(b.id==='repeat-task'){feedbackCode='none';store.attempts[key()]=blank(false);save();render();}
    if(b.dataset.diag&&diag&&diag.index<D.diagnostics.length){const q=D.diagnostics[diag.index];if(!q.optionItems.some(o=>o.id===b.dataset.diag))return;diag.answers.push({choice:b.dataset.diag,id:q.id,correct:b.dataset.diag===String(q.correctId),family:q.recommendFamily,explanation:q.explanation});diag.index++;renderDiagnostic();}
    if(b.id==='start-recommended'){$('diagnostic-dialog').close();const t=D.tasks.find(t=>t.family===b.dataset.family);if(t)selectTask(t.id,'learn');}
    if(b.id==='restart-diagnostic'){diag={index:0,answers:[]};renderDiagnostic();}
  });
  $('graph').addEventListener('click',event=>{if(attempt().stage!==2)return;const p=P.pointFromEvent($('graph'),event,task);if(p)markPoint(p.x,p.y,true,event);});
  $('task-select').addEventListener('change',event=>selectTask(event.target.value));
  $('next-task').addEventListener('click',()=>next());
  $('learn-mode').addEventListener('click',()=>selectTask(task.id,'learn'));
  $('test-mode').addEventListener('click',()=>{if(mode!=='test')next(true);});
  $('diagnose').addEventListener('click',diagnosticStart);
  $('close-diagnostic').addEventListener('click',()=>$('diagnostic-dialog').close());
  $('reset-progress').addEventListener('click',()=>{if(BOARD)return;if(window.confirm('Сбросить все результаты и введённые ответы этого тренажёра в этом браузере?')){store={attempts:{},results:{},seen:{},last:null,diagnostic:null};mode='learn';selectTask(D.tasks[0].id,'learn');}});
  document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('#current-step input[data-answer]')){event.preventDefault();check();}if(event.key==='Enter'&&event.target.matches('#point-controls input')){event.preventDefault();$('place-point').click();}});
  // Test/read-only inspection surface; state mutations remain normal UI actions.
  window.CollegeFunctionsApp={snapshot:()=>JSON.parse(JSON.stringify({taskId:task.id,mode,attempt:attempt(),store,storageOK})),version:1};
  selectTask(task.id,mode);
  if(BOARD){
    document.documentElement.classList.add('college-board-mode');
    document.querySelectorAll('a[href]').forEach(link=>{link.removeAttribute('href');link.removeAttribute('target');link.setAttribute('aria-disabled','true');link.tabIndex=-1;});
    document.addEventListener('click',event=>{if(event.target.closest('a')){event.preventDefault();event.stopImmediatePropagation();}},true);
    if(window.CollegeFunctionsBoardAdapter)window.CollegeFunctionsBoardAdapter.create({read:readBoardState,write:writeBoardState});
  }
  function readBoardState(){const a=attempt(),drafts={};window.CollegeFunctionsBoardAdapter.draftKeys.forEach(k=>{drafts[k]=String(a.drafts[k]||'');});
    return {taskId:task.id,mode,stage:a.stage,drafts,marked:a.marked.length,helpUsed:!!a.helpUsed,hintLevel:a.hintLevel||0,hintOpen:!!a.hintOpen,errors:a.errors||0,feedback:feedbackCode,
      diagnostic:{open:!!diag&&$('diagnostic-dialog').open,index:diag?diag.index:0,answers:diag?diag.answers.map(x=>x.choice):[]},
      panels:{reference:$('answer-reference').open,cheatsheet:mode==='learn'&&$('course-cheatsheet').open}};
  }
  function writeBoardState(state){
    task=D.tasks.find(t=>t.id===state.taskId);mode=state.mode;focusedInput=null;feedbackCode=state.feedback;
    const summaries=['D(f) = '+setText(task.domain),task.points.map(pointLabel).join('; '),'Все '+task.points.length+' точки отмечены. График построен.','E(f) = '+setText(task.range),'Нули: '+(task.zeros.length?task.zeros.map(E.formatNumber).join('; '):'нет'),'f(x)>0: '+setText(task.positive)+'; f(x)<0: '+setText(task.negative),'Возрастает: '+intervalText(task.up)+'; убывает: '+intervalText(task.down)+'; постоянна: '+intervalText(constIntervals()),{even:'Чётная: f(−x)=f(x).',odd:'Нечётная: f(−x)=−f(x).',neither:'Ни чётная, ни нечётная.'}[task.parity]];
    store={attempts:{},results:{},seen:{},last:null,diagnostic:null};
    store.attempts[key()]={stage:state.stage,drafts:{...state.drafts},marked:Array.from({length:state.marked},(_,i)=>i),accepted:summaries.slice(0,state.stage),helpUsed:state.helpUsed,hintLevel:state.hintLevel,hintOpen:state.hintOpen,errors:state.errors,completed:state.stage===8,fresh:false};
    diag={index:state.diagnostic.index,answers:state.diagnostic.answers.map((choice,i)=>{const q=D.diagnostics[i];return {choice,id:q.id,correct:choice===q.correctId,family:q.recommendFamily,explanation:q.explanation};})};
    render();renderDiagnostic();
    $('answer-reference').open=state.panels.reference;$('course-cheatsheet').open=state.panels.cheatsheet;
    const dialog=$('diagnostic-dialog');if(state.diagnostic.open&&!dialog.open)dialog.showModal();if(!state.diagnostic.open&&dialog.open)dialog.close();
  }
})();
