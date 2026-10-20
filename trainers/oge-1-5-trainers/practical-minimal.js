/* Progressive disclosure around the original exercise engines. No answer or progress calculation lives here. */
(function(global){
'use strict';
const doc=global.document;
let serial=0, observer=null, scheduled=false;
const one=(s,root=doc)=>root.querySelector(s);
const all=(s,root=doc)=>Array.from(root.querySelectorAll(s));
function fold(node,label){
  if(!node || node.closest('.pm-details')) return null;
  const details=doc.createElement('details');details.className='pm-details';
  const summary=doc.createElement('summary');summary.textContent=label;
  const content=doc.createElement('div');content.className='pm-content';
  node.before(details);details.append(summary,content);content.append(node);
  return details;
}
function foldAll(selector,label){all(selector).forEach(n=>fold(n,label));}
function moveBefore(node,reference){if(node&&reference&&node!==reference&&!node.contains(reference)&&node.nextElementSibling!==reference)reference.before(node);}
function hintButton(button,panel){
  if(!button || !panel)return;
  button.textContent=button.dataset.pdSecondary==='1'?'Показать подсказку к этой задаче':'Хочешь подсказку?';button.classList.add('pm-hint-button');
  if(!panel.id)panel.id='pm-help-'+(++serial);
  button.setAttribute('aria-controls',panel.id);
  const shown=!panel.hidden&&(panel.classList.contains('show')||panel.closest('.hint-open')||panel.id==='feedback');
  button.setAttribute('aria-expanded',shown?'true':'false');
}
function stepList(steps){return steps.map(s=>'<div class="pm-model-step">'+s+'</div>').join('');}
const fraction=(a,b)=>'<span class="pm-fraction"><span>'+a+'</span><span>'+b+'</span></span>';
function modelCopy(kind,type,text){
  if(kind==='roads'){
    const steps={
      1:['Найди в описании отправную деревню. Затем двигайся по названным дорогам.','Соотнеси каждый поворот и соседство с узлами плана. Запиши номера в порядке вопроса.'],
      2:['Выдели только отрезки шоссе, по которым проходит нужный маршрут.','Сложи длины этих отрезков. Проверь единицы ответа.'],
      3:['Найди прямоугольный треугольник: нужная прямая дорога соединяет его вершины.','Определи два катета. Для гипотенузы используй c² = a² + b².'],
      4:['Разбей путь на участки с одинаковой скоростью.','Для каждого участка время = расстояние ÷ скорость. Затем сложи времена. Часы переводятся в минуты умножением на 60.'],
      5:['Раздели каждый маршрут на шоссе и просёлочные участки. Обозначь неизвестный расход на 100 км буквой x.','Бензин на участке = длина · расход на 100 км ÷ 100. Приравняй суммарные расходы двух маршрутов и найди x.']};
    return {steps:steps[type]||steps[1],visual:type===1?'route':type===3?'triangle':'journey'};
  }
  if(kind==='land'){
    if(type==='match')return{steps:['Сопоставь названия объектов с их местом на плане.','Проверь порядок столбцов в вопросе: цифры записываются именно в этом порядке.'],visual:'route'};
    if(type==='percent')return{steps:['Назови площадь, с которой сравнивают: это основа, равная 100%.',/на сколько/i.test(text)?'Найди разность площадей. Изменение в процентах = '+fraction('разность площадей','площадь, с которой сравнивают')+' · 100%. Оно может быть больше 100%.':'Доля в процентах = '+fraction('площадь части','площадь целого')+' · 100%.'],visual:'parts'};
    if(type==='tiles')return{steps:['Сначала выясни, сколько плиток или квадратных метров требуется.','Раздели нужное количество на вместимость упаковки. Неполная последняя упаковка тоже нужна.'],visual:'packs'};
    if(type==='econ' && /покрас|краск|магазин/i.test(text))return{steps:['Для каждого магазина умножь площадь забора на расход краски на квадратный метр.','Раздели нужную массу на массу одной банки и округли количество банок вверх.','Умножь количество банок на цену банки, прибавь доставку и выбери меньшую стоимость.'],visual:'packs'};
    if(type==='econ')return{steps:['Сравни стоимость покупки и установки двух систем: найди разницу начальных расходов.','Для каждой системы найди стоимость одного часа работы: расход за час · цена единицы энергии.','Раздели разницу начальных расходов на экономию за один час. Получится время окупаемости.'],visual:'cost'};
    return{steps:[/расстояние|периметр/i.test(text)?'Считай длину в клетках, затем умножь на сторону клетки.':'Считай площадь в клетках. Площадь одной клетки равна стороне клетки, умноженной на себя.','Если фигура составная, разбей её на знакомые части. Учитывай только то, что спрашивается.'],visual:'grid'};
  }
  if(type==='percent' && /Сколько рублей[\s\S]*2018/i.test(text)){
    const sign=/снизилась/i.test(text)?'−':'+';
    return{steps:['Абонплата в 2018 году — это 100%. После изменения на p% новая плата составляет (100 '+sign+' p)% от прежней.','Чтобы восстановить прежнюю плату, раздели нынешнюю на коэффициент изменения: '+fraction('нынешняя плата','1 '+sign+' p : 100')+'. Подставь процент из условия.'],visual:'percent-base'};
  }
  const map={
    match:['Сверь название величины с условным обозначением линии и шкалой графика.','Для каждого значения из таблицы найди соответствующую точку на нужной линии и прочитай номер месяца.','Запиши номера месяцев в порядке столбцов таблицы. Не смешивай минуты и гигабайты.'],
    bill:['Абонентская плата уже включает пакет услуг.','Доплачивают только за расход сверх пакета. Для неполного дополнительного пакета проверь правило округления в условии.'],
    count:['Проведи взглядом уровень, названный в вопросе.','Отметь каждый месяц, который выполняет условие, затем сосчитай отметки. Равенство учитывай только при нужном знаке.'],
    percent:['Определи, с каким месяцем или значением сравнивают: это основа, равная 100%.','Найди изменение и раздели его на основу сравнения, затем умножь на 100%.'],
    switch:['По каждому тарифу посчитай плату за каждый из 12 месяцев: абонплата плюс доплаты при указанном расходе.','Сложи все 12 месячных платежей. Новый тариф выбирают, только если сумма за год меньше.','В ответ запиши ежемесячную абонплату выбранного тарифа, как требует вопрос.']};
  return{steps:map[type]||map.bill,visual:type==='percent'?'parts':type==='match'||type==='count'?'chart':'cost'};
}
function drawModel(panel,visual){
  const host=doc.createElement('div');host.className='pm-visual';panel.append(host);
  if(visual==='grid'){
    host.innerHTML='<label>Что измеряем? <select aria-label="Что измеряем на плане"><option value="length">Длину</option><option value="area">Площадь</option></select></label><svg viewBox="0 0 330 150" role="img" aria-label="Модель клетки: сторона и площадь"><rect x="45" y="20" width="110" height="110" fill="#ddede2" stroke="#176747" stroke-width="2"/><path d="M45 130H155" stroke="#176747" stroke-width="6"/><text x="180" y="65" font-size="17">Сторона клетки: a</text><text class="pm-grid-label" x="180" y="100" font-size="17">Длина: a</text></svg>';
    one('select',host).addEventListener('change',e=>one('.pm-grid-label',host).textContent=e.target.value==='area'?'Площадь: a · a':'Длина: a');
  }else if(visual==='parts'){
    host.innerHTML='<label>Сравни величины с одной основой: <input type="range" min="0" max="500" step="5" value="25" aria-label="Проценты от основы сравнения в модели"></label><svg viewBox="0 0 360 145" role="img" aria-label="Основа равна 100%, сравниваемая величина может быть больше"><rect x="10" y="15" width="68" height="28" rx="4" fill="#b8d7c4"/><text x="92" y="35" font-size="16">основа — 100%</text><rect class="pm-part" x="10" y="70" width="17" height="28" rx="4" fill="#176747"/><text x="10" y="130" font-size="16">сравниваемая величина</text></svg><output aria-live="polite">В модели величина составляет 25% от основы.</output>';
    one('input',host).addEventListener('input',e=>{one('.pm-part',host).setAttribute('width',.68*Number(e.target.value));one('output',host).textContent='В модели величина составляет '+e.target.value+'% от основы.';});
  }else if(visual==='percent-base'){
    host.innerHTML='<div class="pm-model-step">Прежняя плата → изменение на p% → нынешняя плата</div><div class="pm-model-step">Двигаясь обратно, делим на коэффициент изменения.</div>';
  }else if(visual==='triangle'){
    host.innerHTML='<svg viewBox="0 0 360 185" role="img" aria-label="Прямоугольный треугольник: катеты и гипотенуза"><path d="M55 30V140H285Z" fill="#e7f3eb" stroke="#176747" stroke-width="3"/><path d="M55 120H75V140" fill="none" stroke="#176747"/><text x="30" y="85" font-size="18">a</text><text x="160" y="169" font-size="18">b</text><text x="180" y="70" font-size="18">c</text></svg>';
  }else if(visual==='packs'){
    host.innerHTML='<svg viewBox="0 0 360 110" role="img" aria-label="Две полные упаковки и ещё одна неполная"><rect x="10" y="20" width="95" height="60" fill="#176747"/><rect x="125" y="20" width="95" height="60" fill="#176747"/><rect x="240" y="20" width="95" height="60" fill="#e0ede5" stroke="#176747"/><rect x="240" y="20" width="25" height="60" fill="#176747"/><text x="287" y="105" text-anchor="middle" font-size="14">тоже упаковка</text></svg>';
  }else if(visual==='cost'){
    host.innerHTML='<div class="pm-model-step">Полная плата = постоянная часть + доплаты</div><svg viewBox="0 0 360 85" role="img" aria-label="Стоимость состоит из постоянной части и доплат"><rect x="10" y="10" width="205" height="42" fill="#176747"/><rect x="215" y="10" width="135" height="42" fill="#b8d7c4"/><text x="110" y="76" text-anchor="middle" font-size="16">постоянная часть</text><text x="282" y="76" text-anchor="middle" font-size="16">доплаты</text></svg>';
  }else if(visual==='chart'){
    host.innerHTML='<div class="pm-model-step">Обозначение линии · значение на своей шкале · номер месяца</div>';
  }else{
    host.innerHTML='<svg viewBox="0 0 360 100" role="img" aria-label="Маршрут по отдельным участкам"><path d="M30 50H170H330" stroke="#176747" stroke-width="4"/><circle cx="30" cy="50" r="8" fill="#176747"/><circle cx="170" cy="50" r="8" fill="#176747"/><circle cx="330" cy="50" r="8" fill="#176747"/><text x="100" y="30" text-anchor="middle" font-size="16">участок 1</text><text x="250" y="30" text-anchor="middle" font-size="16">участок 2</text></svg>';
  }
}
function mountHint(host,kind,type,text){
  if(!host)return;
  // The same legend is a given for later tasks, but an explicit answer hint for matching.
  // Restore it before replacing the old help so native drawLegend keeps its original node.
  const landLegend=kind==='land'?one('#legend'):null;
  if(landLegend){const scale=one('.scale-note');if(scale)scale.before(landLegend);}
  const old=host.parentNode.querySelector('.pm-context-hint');if(old)old.remove();
  const wrapper=doc.createElement('div');wrapper.className='pm-context-hint';
  const button=doc.createElement('button');button.type='button';button.className='pm-hint-button';button.textContent='Хочешь подсказку?';
  const panel=doc.createElement('section');panel.className='pm-model';panel.id='pm-context-'+(++serial);panel.hidden=true;panel.setAttribute('aria-label','Подсказка к текущей задаче');
  button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);
  const data=modelCopy(kind,type,text||'');
  if(global.PracticalDiscovery)global.PracticalDiscovery.build(panel,{page:kind,type,text:text||'',steps:data.steps,close:()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus();}});
  else{panel.innerHTML=stepList(data.steps);drawModel(panel,data.visual);}
  button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));});
  wrapper.append(button,panel);host.after(wrapper);
  if(kind==='land'&&type==='match'&&landLegend){
    const clues=doc.createElement('div');clues.className='pd-land-description';
    clues.innerHTML='<p>Найди объекты по описанию и сопоставь их с цифрами на плане.</p><ul><li>Жилой дом — Г-образное здание.</li><li>Огород находится в левом верхнем углу. Внутри него расположена узкая теплица.</li><li>Баня — квадратное здание слева внизу.</li><li>Яблони растут между баней и гаражом.</li><li>Гараж — вытянутое здание справа внизу. Сарай находится в правом верхнем углу.</li></ul>';
    host.append(clues);
    const check=doc.createElement('details');check.className='pm-details pd-land-legend-help';
    const summary=doc.createElement('summary');summary.textContent='Сверить названия с цифрами на плане';
    const content=doc.createElement('div');content.className='pm-content';content.append(landLegend);check.append(summary,content);
    panel.insertBefore(check,panel.querySelector('.pd-return'));
  }
}
function figureZoom(svg){
  if(!svg||svg.closest('.pm-figure-scroll'))return;
  const wrap=doc.createElement('div');wrap.className='pm-figure-scroll';wrap.id='pm-figure-'+(++serial);wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Рисунок с прокруткой');
  svg.before(wrap);wrap.append(svg);
  const button=doc.createElement('button');button.type='button';button.className='pm-zoom-button';button.textContent='Увеличить рисунок';button.setAttribute('aria-controls',wrap.id);button.setAttribute('aria-pressed','false');
  const note=doc.createElement('p');note.className='pm-zoom-note';note.hidden=true;note.textContent='Прокручивай рисунок, чтобы рассмотреть его целиком.';
  wrap.after(button,note);
  button.addEventListener('click',()=>{const large=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(large));button.textContent=large?'Уменьшить рисунок':'Увеличить рисунок';wrap.classList.toggle('pm-figure-large',large);note.hidden=!large;const box=(svg.getAttribute('viewBox')||'0 0 600 400').trim().split(/\s+/).map(Number);svg.style.width=large?Math.max(600,box[2]*1.4)+'px':'';if(!large){wrap.scrollLeft=0;wrap.scrollTop=0;}});
}
function decorate(){
  if(observer)observer.disconnect();
  try{
    const page=doc.body.dataset.practicalPage;
    if(global.PracticalDiscovery)global.PracticalDiscovery.decorate(page);
    if(page==='roads-grid')figureZoom(one('#map'));
    if(page==='apartments')figureZoom(one('#plan'));
    if(page==='tariffs')figureZoom(one('#graph'));
    if(page==='stoves'){const question=one('#task-card .task-question');if(question&&question.innerHTML.includes('карточках печей выше'))question.innerHTML=question.innerHTML.replace('карточках печей выше','карточках печей ниже');}
    all('table').forEach(table=>{if(table.parentElement.classList.contains('pm-table-scroll'))return;const wrap=doc.createElement('div');wrap.className='pm-table-scroll';table.before(wrap);wrap.append(table);});
    const pairs=[['#hint-btn','#hint-box'],['#hintBtn','#hintBox'],['#bHint','#hint'],['#hint','#feedback']];
    pairs.forEach(([a,b])=>hintButton(one(a),one(b)));
    all('.substep-hint-btn').forEach(b=>hintButton(b,b.parentElement.querySelector('.substep-hint')));
    // Optional full solutions remain available, after the student has deliberately opened this disclosure.
    ['#show-btn','#solveBtn','#bSolve','#bSol','#solution-btn','#reveal'].forEach(s=>fold(one(s),'Полный разбор'));
    if(page==='percent-table'){const b=one('#hint-btn'),stack=one('#hint-stack');if(b&&stack)b.setAttribute('aria-expanded',String(stack.children.length>0));}
    if(page==='roads-schema'){
      foldAll('#app .tabs','Выбрать задание');foldAll('#app .progress','Мои результаты');
      foldAll('#app .maptools','Опорные названия на плане');
    }
    if(page==='tires'){
      const card=one('#section-0 .card');
      if(card){
        const legend=one('.dim-legend',card);if(legend){const d=fold(legend,'Хочешь подсказку?');if(d)d.classList.add('pm-wheel-hint');}
        all('#section-0 .figures, #section-0 figure.fig').forEach(n=>fold(n,'Модель колеса'));
      }
    }
  }finally{if(observer)observer.observe(doc.body,{subtree:true,childList:true});}
}
function schedule(){if(scheduled)return;scheduled=true;Promise.resolve().then(()=>{scheduled=false;decorate();});}
function init(){
  const page=doc.body.dataset.practicalPage;if(!page)return;
  doc.body.classList.add('pm-minimal','pm-'+page);
  if(['stoves','paper-sheets','apartments'].includes(page))all('[data-mode]').forEach(b=>{const selected=b.dataset.mode==='practice';b.classList.toggle('active',selected);if(b.classList.contains('pill'))b.classList.toggle('on',selected);if(b.hasAttribute('aria-selected'))b.setAttribute('aria-selected',String(selected));});
  // Existing control nodes are moved, never cloned: event handlers and IDs are retained.
  foldAll('#mode-switch,.modes,.main-nav','Другие режимы');
  if(page==='roads-grid'){
    foldAll('.selector','Выбрать вариант');foldAll('#task-stepper','Выбрать задание');
    const side=one('.sidebar');if(side){const speeds=one('.side-card',side);if(speeds){const main=one('main');main.append(speeds);}fold(side,'Справочник · мои результаты');}
    foldAll('#count-panel','Модель: считаем клетки');
    const story=one('.problem-card'),card=one('#task-card'),map=one('.map-card');moveBefore(story,map);moveBefore(card,story);
  }else if(page==='stoves'){
    foldAll('#group-tabs','Выбрать тему');foldAll('#chip-row','Выбрать задание');foldAll('.sidebar','Справочник · мои результаты');
    moveBefore(one('#task-card'),one('.bath-card'));
  }else if(page==='tires'){
    foldAll('.variant-bar','Выбрать вариант');foldAll('.roadmap','Как устроена тренировка');foldAll('#step-stepper','Выбрать шаг');
    const side=one('.sidebar');if(side)all('.side-card',side).slice(1).forEach(n=>fold(n,'Формулы · результаты · режимы'));
  }else if(page==='paper-sheets'){
    const card=one('#taskCard'),chart=one('#paper');
    if(card&&chart){const chartCard=chart.closest('.card');moveBefore(card,chartCard);fold(chartCard,'Модель листа и таблица форматов');}
    if(card){const condition=doc.createElement('p');condition.className='pm-paper-condition';condition.textContent='Лист А0 имеет площадь 1 м², его размеры — 1189 × 841 мм. Каждый следующий формат получают, разрезая предыдущий пополам параллельно короткой стороне. Все форматы подобны. Размеры в миллиметрах округляют вниз до целого числа.';card.before(condition);}
    const relations=one('#relations');if(relations)fold(relations.closest('.card'),'Как связаны форматы');
    foldAll('#typeChips','Выбрать тип задания');foldAll('.type-header','О типах заданий');foldAll('aside','Формулы · мои результаты');foldAll('.story','О формате бумаги');
  }else if(page==='apartments'){
    const modeName=one('#modeName');if(modeName)modeName.textContent='тренировка';
    foldAll('#tabs','Выбрать тему');foldAll('#planpick','Выбрать план');foldAll('.side','Формулы · мои результаты · режимы');
    const body=one('#taskBody'),plan=one('#plan');if(body&&plan)moveBefore(body.closest('.panel'),plan.closest('.panel'));
  }else if(page==='land-plots'||page==='tariffs'){
    foldAll('.card.progress','Мои результаты');foldAll('#task-tabs','Выбрать задание');foldAll('.foot','Сохранение и сброс прогресса');
    moveBefore(one('.card.task'),one('.card.scen'));
  }else if(page==='roads-schema'){
    foldAll('.wrap>.tabs[aria-label="Режим"]','Другие режимы');foldAll('#varbar','Выбрать вариант');
  }else if(page==='percent-table'){
    foldAll('#view-practice .control-card','Выбрать навык и сложность');foldAll('#view-practice .side-stack','Схема · мои результаты');foldAll('#view-learn .side-stack','Маршрут обучения');
    const hint=one('#hint-btn');if(hint){hint.classList.add('pm-hint-button');hint.setAttribute('aria-controls','hint-stack');hint.setAttribute('aria-expanded','false');}
  }else if(page==='plan-reading'){
    const setup=one('#intro .setup');const choice=fold(setup,'Выбрать комплект');if(choice)one('#workspace').after(choice);
    const again=one('#again');if(again&&choice)again.addEventListener('click',()=>{choice.open=true;});
    foldAll('#workspace .side','Памятка · мои результаты');foldAll('#workspace .progress-card','Ход тренировки');
  }else if(page==='entry-diagnostic-2026'){
    foldAll('.side-col','Ход диагностики');foldAll('#stepper','Перейти к заданию');
    // Keep the explicit start: the learner chooses the variant before the timer begins.
    const intro=one('#intro .intro-grid>div');if(intro)fold(intro,'Как проходит диагностика');
  }else if(page==='routes-checkpoint-2026'){
    const side=one('#workspace .side');if(side){const finish=one('#finish',side);if(finish){const host=one('.nav-actions');host.append(finish);}fold(side,'Задания · памятка');}
  }else if(page==='map'){
    foldAll('.progress-summary','Мои результаты');foldAll('.foot','О прогрессе');
    all('.icon,.num-badge',doc).forEach(n=>{n.setAttribute('aria-hidden','true');n.remove();});
  }
  // Native help engines still decide what is shown and how help affects their progress.
  doc.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(page==='paper-sheets'&&b.matches('#newBtn,#typeChips .step')){const model=one('#paper');const d=model&&model.closest('details');if(d)d.open=false;}
    if(page==='plan-reading'&&b.matches('#next,#start'))one('#visual')?.classList.remove('pm-hint-open');
    if(b.matches('#hint-btn,#hintBtn,#bHint,#hint,.substep-hint-btn')){
      b.setAttribute('aria-expanded','true');
      if(page==='paper-sheets'){const model=one('#paper');if(model){const d=model.closest('details');if(d)d.open=true;}}
      if(page==='roads-grid'){const d=one('#count-panel')?.closest('details');if(d)d.open=true;}
      if(page==='plan-reading'){const v=one('#visual');if(v&&!v.hidden)v.classList.add('pm-hint-open');}
    }
  });
  observer=new MutationObserver(schedule);decorate();
  doc.documentElement.dataset.practicalMinimal='ready';
}
global.PracticalMinimal={mountHint,fold};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>global.setTimeout(init,0));else init();
})(window);
