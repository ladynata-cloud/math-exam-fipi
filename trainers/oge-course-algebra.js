/* Optional exploration and working notes. Native tasks, graders and progress remain authoritative. */
(function () {
  'use strict';
  const script = document.currentScript;
  const number = Number(script && script.dataset.ogeTask);
  const routes = {
    7: ['#mode-mar.active #marTask', '.taskline'],
    8: ['#view-mar.on #marGrid > .mtask:not([hidden])', '.expr'],
    10: ['#tab-mar.on #mar-root > .card', '.qtext,.task-text,.statement,.task'],
    12: ['#taskArea > .card', '.story'],
    14: ['#page-marathon.active #m-task > .card', '.task-text'],
    20: ['#body .qbox', '.prompt'],
    21: ['#content > .card', '.problem'],
    22: ['.panel:not(.hidden) .mode-host[data-mode="marathon"]', '.statement']
  };
  if (!routes[number] || /[?&]selftest=1(?:&|$)/.test(location.search)) return;
  const d = document, cards = new WeakMap(), buttonStates = new WeakMap();
  let serial = 0, scheduled = false;
  const node = (tag, text, cls) => { const e = d.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const safe = fn => { try { return fn(); } catch (_) { return null; } };
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const fmt = v => String(Number(Number(v).toFixed(6))).replace('.', ',');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id = () => 'oca-' + number + '-' + (++serial);
  function action(text, fn) { const b = node('button', text, 'oca-button'); b.type = 'button'; b.onclick = fn; return b; }
  function details(host, title) {
    const box = node('details', undefined, 'oca-details'), summary = node('summary', title);
    box.append(summary); host.append(box); return box;
  }
  function close(box, button) {
    const b = action('Вернуться к заданию', () => {
      if (button) { box.hidden = true; button.setAttribute('aria-expanded', 'false'); button.textContent = 'Хочешь подсказку?'; button.focus(); }
      else { box.open = false; box.querySelector('summary').focus(); }
    });
    box.append(b);
  }
  function control(host, text, lo, hi, value, step, oninput) {
    const wrap = node('label', undefined, 'oca-control'), caption = node('span', text), input = node('input');
    const output = node('output'); input.type = 'range'; input.min = lo; input.max = hi; input.step = step || 1; input.value = value;
    input.id = id(); output.htmlFor = input.id; output.textContent = fmt(value);
    input.setAttribute('aria-label', text);
    input.oninput = () => { output.textContent = fmt(input.value); oninput(Number(input.value)); };
    wrap.append(caption, input, output); host.append(wrap); return input;
  }
  function fraction(n, den) { return '<span class="oca-fraction" role="math" aria-label="' + esc(n) + ' разделить на ' + esc(den) + '"><span>' + esc(n) + '</span><span>' + esc(den) + '</span></span>'; }
  function svgHost(host, label) {
    const wrap = node('div', undefined, 'oca-figure'); wrap.tabIndex = 0; wrap.setAttribute('aria-label', label + '. На узком экране рисунок можно прокрутить по горизонтали.');
    const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 600 190'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); wrap.append(svg); host.append(wrap,node('p','Рисунок можно прокручивать влево и вправо.','oca-note')); return svg;
  }
  function numberLine(host) {
    host.append(node('p', 'Передвинь точки A и B. Какая точка правее? Какая дальше от нуля? Это отдельный опыт: числа в твоём задании остаются прежними.'));
    let a = -2, b = 1; const controls = node('div'); host.append(controls);
    const svg = svgHost(host, 'Две точки на координатной прямой'), out = node('p', undefined, 'oca-observation'); out.setAttribute('aria-live', 'polite'); host.append(out);
    const x = value => 300 + value * 55;
    function draw() {
      let s = '<path d="M45 112H555M546 106L555 112L546 118" fill="none" stroke="#293d32" stroke-width="2"/>';
      for (let k = -4; k <= 4; k++) s += '<path d="M' + x(k) + ' 106v12" stroke="#293d32"/><text x="' + x(k) + '" y="143" text-anchor="middle" font-size="19">' + k + '</text>';
      s += '<path d="M300 80H' + x(a) + '" stroke="#b56422" stroke-width="5"/><circle cx="' + x(a) + '" cy="112" r="7" fill="#216342"/><text x="' + x(a) + '" y="49" text-anchor="middle" font-size="21">A (' + fmt(a) + ')</text>';
      s += '<circle cx="' + x(b) + '" cy="112" r="6" fill="#265e9d"/><text x="' + x(b) + '" y="174" text-anchor="middle" font-size="21">B (' + fmt(b) + ')</text>';
      svg.innerHTML = s;
      out.textContent = (a === b ? 'Точки совпали: a = b.' : a > b ? 'A правее B: a > b.' : 'B правее A: a < b.') + ' Расстояние от A до нуля равно ' + fmt(Math.abs(a)) + ': |a| = ' + fmt(Math.abs(a)) + '.';
    }
    control(controls, 'Координата A', -4, 4, a, .25, v => { a = v; draw(); });
    control(controls, 'Координата B', -4, 4, b, .25, v => { b = v; draw(); }); draw();
  }
  function powers(host) {
    host.append(node('p', 'Измени показатели. Посчитай одинаковые множители и сравни две записи. Это опыт с отдельными числами.'));
    const modeLabel = node('label', 'Что исследуем? ', 'oca-control'), mode = node('select');
    for (const [value, label] of [['product','Произведение степеней'],['power','Степень степени'],['square','Квадрат и квадратный корень']]) { const option = node('option', label); option.value = value; mode.append(option); }
    modeLabel.append(mode); host.append(modeLabel);
    let n = 2, m = 3; const controls = node('div'); host.append(controls);
    const out = node('div', undefined, 'oca-observation'), visual = node('div', undefined, 'oca-factors'); host.append(out, visual);
    function draw() {
      const factors = k => Array.from({length:k}, () => '<span class="oca-factor">2</span>').join('<span>·</span>');
      if (mode.value === 'product') { out.innerHTML = '2<sup>' + n + '</sup> · 2<sup>' + m + '</sup> = 2<sup>' + (n + m) + '</sup>'; visual.innerHTML = factors(n) + '<b> · </b>' + factors(m); }
      else if (mode.value === 'power') { out.innerHTML = '(2<sup>' + n + '</sup>)<sup>' + m + '</sup> = 2<sup>' + (n*m) + '</sup>'; visual.innerHTML = Array.from({length:m}, () => '<span class="oca-factor-group">' + factors(n) + '</span>').join('<span>·</span>'); }
      else { out.textContent = 'Квадрат со стороной ' + n + ': ' + n + '² = ' + (n*n) + '. Значит, √' + (n*n) + ' = ' + n + '.'; visual.innerHTML = '<div class="oca-square" style="grid-template-columns:repeat(' + n + ',1fr)">' + '<span></span>'.repeat(n*n) + '</div>'; }
    }
    control(controls, 'Первый показатель (в опыте с квадратом — сторона)', 1, 4, n, 1, v => { n = v; draw(); });
    const second = control(controls, 'Второй показатель', 1, 4, m, 1, v => { m = v; draw(); });
    mode.onchange = () => { second.closest('label').hidden = mode.value === 'square'; draw(); }; draw();
  }
  function probability(host) {
    host.append(node('p', 'Каждая карточка — один равновозможный исход. Нажми на подходящие исходы: доля выделенных карточек и есть вероятность события. Числа этого опыта не подставляются в ответ задачи.'));
    const label = node('label', 'Модель исходов ', 'oca-control'), select = node('select');
    [['ten','10 равновозможных карточек'],['dice','Два броска игральной кости']].forEach(([value,text]) => { const o=node('option',text);o.value=value;select.append(o); }); label.append(select);host.append(label);
    const grid=node('div',undefined,'oca-outcomes'), out=node('p',undefined,'oca-observation');out.setAttribute('aria-live','polite');host.append(grid,out);
    let marked=new Set();
    function result(){const total=select.value==='dice'?36:10;out.innerHTML='Подходит '+marked.size+' из '+total+'. P = '+fraction(marked.size,total)+'.';}
    function draw(){marked=new Set();grid.replaceChildren();grid.classList.toggle('oca-dice',select.value==='dice');const total=select.value==='dice'?36:10;
      for(let i=0;i<total;i++){const text=select.value==='dice'?(Math.floor(i/6)+1)+'; '+(i%6+1):String(i+1),b=action(text,()=>{marked.has(i)?marked.delete(i):marked.add(i);b.setAttribute('aria-pressed',String(marked.has(i)));result();});b.setAttribute('aria-label',select.value==='dice'?'Первый бросок '+(Math.floor(i/6)+1)+', второй '+(i%6+1):'Карточка '+text);b.setAttribute('aria-pressed','false');grid.append(b);}result();}
    select.onchange=draw;draw();const more=details(host,'Почему при двух бросках 36 исходов?');more.append(node('p','У каждого из шести результатов первого броска есть шесть возможных результатов второго. Пары (1; 2) и (2; 1) — разные исходы. При выборе предметов без возвращения состав оставшихся предметов меняется: это другой опыт, его разбираем в шагах твоей задачи.'));close(more);
  }
  function formula(host) {
    const task=safe(()=>cur);if(!task||!Array.isArray(task.letters))return;
    host.append(node('p','Найди в последнем предложении вопрос. Нажми на букву величины, которую нужно получить. Затем найди остальные буквы в данной формуле.'));
    const choices=node('div',undefined,'oca-choices'),fb=node('p',undefined,'oca-observation');fb.setAttribute('aria-live','polite');
    for(const letter of task.letters){const label=node('span');label.innerHTML=letter.lab||letter.n;const b=action(letter.n+' — '+clean(label.textContent).replace(/\s*\(это ищем\)/,''),()=>{fb.textContent=letter.n===task.target?'Да, ищем '+task.target+'. Для остальных величин перенеси числа и единицы из условия.':letter.n+' — другая величина. Снова прочитай, что требуется найти.';});choices.append(b);}
    host.append(choices,fb);const table=details(host,'Как аккуратно подставить числа?');table.append(node('p','Сначала выпиши обозначение, затем известное значение вместе с единицей. В одной формуле единицы должны согласовываться. Если нужная буква ещё не выражена, открой шаги решения ниже.'));close(table);
  }
  function sequence(host) {
    const task=safe(()=>window.__M.task);if(task&&task.hint1)host.append(node('p',task.hint1));
    host.append(node('p','Ниже отдельная последовательность. Меняй число членов и следи: между первым и n-м членами всегда n − 1 переходов.'));
    const label=node('label','Тип последовательности ','oca-control'), select=node('select');
    [['ap','Прибавляем одно число'],['gp','Умножаем на одно число']].forEach(([v,t])=>{const o=node('option',t);o.value=v;select.append(o);});select.value=task&&task.gp?'gp':'ap';label.append(select);host.append(label);
    let n=4, start=2, delta=2;const controls=node('div');host.append(controls);const svg=svgHost(host,'Последовательность и переходы между её членами'),out=node('p',undefined,'oca-observation');host.append(out);
    function draw(){const vals=Array.from({length:n},(_,i)=>select.value==='ap'?start+i*delta:start*Math.pow(delta,i));const min=Math.min(0,...vals),max=Math.max(1,...vals),span=max-min||1;let s='';for(let i=0;i<n;i++){const x=50+i*500/6,y=135-(vals[i]-min)/span*75;if(i){const px=50+(i-1)*500/6,py=135-(vals[i-1]-min)/span*75;s+='<path d="M'+px+' '+py+'L'+x+' '+y+'" stroke="#88a593" stroke-width="3"/>'; }s+='<circle cx="'+x+'" cy="'+y+'" r="6" fill="#216342"/><text x="'+x+'" y="'+(y-16)+'" text-anchor="middle" font-size="19">'+fmt(vals[i])+'</text><text x="'+x+'" y="172" text-anchor="middle" font-size="19">№'+(i+1)+'</text>'; }svg.innerHTML=s;out.textContent=n+' членов; '+(n-1)+' переходов. '+(select.value==='ap'?'При каждом переходе прибавляем ':'При каждом переходе умножаем на ')+fmt(delta)+'.';}
    control(controls,'Количество членов n',1,7,n,1,v=>{n=v;draw();});control(controls,'Первый член',1,4,start,1,v=>{start=v;draw();});control(controls,'Число для каждого перехода',1,3,delta,1,v=>{delta=v;draw();});select.onchange=draw;draw();
  }
  function equality(host) {
    host.append(node('p','Отдельный опыт: выполни одно действие с обеими частями равенства 3 + 2 = 5. Равенство сохранится. В своём решении указывай, какое действие выполняешь.'));
    let add=0;const out=node('p',undefined,'oca-observation');control(host,'Прибавить к обеим частям',-5,5,0,1,v=>{add=v;draw();});host.append(out);
    function draw(){out.textContent='(3 + 2) '+(add<0?'− '+Math.abs(add):'+ '+add)+' = 5 '+(add<0?'− '+Math.abs(add):'+ '+add)+'; обе части равны '+(5+add)+'.';}draw();
    const more=details(host,'А что меняется у неравенства?');let factor=-1;const example=node('p',undefined,'oca-observation');control(more,'Умножить обе части 2 < 5 на число',-3,3,-1,1,v=>{factor=v;ineq();});more.append(example);
    function ineq(){example.textContent=factor===0?'При умножении на 0 получаем 0 = 0 и теряем исходное сравнение. Так решать неравенство нельзя.':fmt(2*factor)+(factor<0?' > ':' < ')+fmt(5*factor)+(factor<0?'. Отрицательный множитель меняет знак неравенства.':'. Положительный множитель сохраняет знак.');}ineq();close(more);
  }
  const labs={7:['Как читать точки на прямой?',numberLine],8:['Почему так работают степени и корни?',powers],10:['Что считать подходящими исходами?',probability],12:['Какую букву здесь нужно найти?',formula],14:['Почему переходов на один меньше?',sequence],20:['Что можно делать с обеими частями?',equality]};
  function addLab(panel) {
    if(panel.querySelector(':scope > .oca-exploration'))return;
    const cfg=labs[number];if(!cfg)return;
    const holder=node('div',undefined,'oca-exploration oca-owned'),box=details(holder,cfg[0]);let built=false;
    box.addEventListener('toggle',()=>{if(box.open&&!built){built=true;cfg[1](box);close(box);}});panel.prepend(holder);
  }
  function addReference(panel) {
    if(panel.querySelector(':scope > .oca-reference')||!window.OgeCourseReference)return;
    const lineType=number===7?safe(()=>typeOf(BANK[marIdx])):'';
    const pages=number===7&&String(lineType).includes('root')?[4]:number===8?[3,4]:[14,20,22].includes(number)?[3]:[];if(!pages.length)return;
    const host=node('div',undefined,'oca-reference oca-owned');panel.append(host);window.OgeCourseReference.sheetCards(host,[],{pages});
  }
  function makeReversible(card,button) {
    if(buttonStates.has(button)){button.disabled=false;return buttonStates.get(button).panel;}
    const original=button.onclick;if(typeof original!=='function')return null;
    const panel=node('section',undefined,'oca-help minimal-hint-panel oca-owned');panel.id=id();panel.hidden=true;panel.setAttribute('aria-label','Помощь к текущему заданию');button.after(panel);button.setAttribute('aria-controls',panel.id);
    const info=node('p',number===14?'Сначала можно исследовать последовательность. Для решения этой же задачи открой шаги ниже.':'Сначала исследуй прямую, затем вернись к выбору ответа или открой шаги этой задачи.');panel.append(info);
    let begun=false;
    const start=action('Разобрать эту задачу по шагам',()=>{
      if(begun)return;begun=true;
      original.call(button);button.disabled=false;button.setAttribute('aria-expanded','true');button.textContent='Убрать подсказку';
      const native=number===14?card.querySelector('#m-after > .minimal-hint-panel'):[...card.querySelectorAll('.minimal-hint-panel')].find(n=>n!==panel&&!n.closest('.oca-exploration'));
      if(native)panel.insertBefore(native,back);start.disabled=true;start.textContent='Шаги решения открыты ниже';
      if(number===14){info.textContent='Идём по шагам этой задачи. Введённый основной ответ сохранён; проверка выполняется в шагах. Панель можно закрыть и открыть снова.';}
    });panel.append(start);const back=action('Вернуться к заданию',()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');button.textContent='Хочешь подсказку?';button.focus();});panel.append(back);
    button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));button.textContent=panel.hidden?'Хочешь подсказку?':'Убрать подсказку';};
    buttonStates.set(button,{panel});return panel;
  }
  function helpPanel(card) {
    if(number===7||number===14){const b=card.querySelector(number===14?'#m-solve':'button.minimal-hint');return b?makeReversible(card,b):null;}
    return card.querySelector('.minimal-hint-panel,.minimal-help');
  }
  function inputGuidance(card) {
    const main = number===7?'Выбери один вариант ответа под условием.':number===8?'Вычисли значение выражения и запиши его в поле ответа.':number===10?'Найди вероятность события из вопроса. Запиши число от 0 до 1 или обыкновенную дробь.':number===12?(safe(()=>cur.target)?'Найди '+cur.target+' — величину из вопроса. Единицу ответа возьми из условия.':'Найди величину, которую спрашивают в последнем предложении условия.'):number===14?'Найди величину из вопроса и запиши её в указанных единицах.':number===20?'Запиши ход решения ниже, затем введи ответ в соответствующие поля.':number===21?'Обозначь неизвестное и составь уравнение. Запиши решение ниже, затем введи найденную величину.':'Построй график и обоснуй число общих точек. В ответе укажи все подходящие значения или промежутки параметра.';
    let p=card.querySelector('.oca-instruction');if(!p){p=node('p',main,'oca-instruction oca-owned');const anchor=statementOf(card);if(anchor)anchor.after(p);else card.prepend(p);}else if(p.textContent!==main)p.textContent=main;
    if(!p.id)p.id=id();
    for(const input of card.querySelectorAll('input:not([type=range]):not([type=checkbox]):not([type=radio])')){
      if(input.closest('.oca-owned'))continue;
      const prompt=input.closest('.step,.sstep,.step-card,.stepcard,.step-cur,.scard,.minimal-step-current')?.querySelector('.sq,.step-prompt,.stepq,.prompt,.q,.step-q,.st-q');
      const text=clean(prompt&&prompt.textContent);
      if(text){if(!prompt.id)prompt.id=id();input.setAttribute('aria-describedby',prompt.id);}else if(!input.hasAttribute('aria-describedby'))input.setAttribute('aria-describedby',p.id);
    }
  }
  const noteKey='mathexam.oge.algebra-notes.v1';
  const readNotes=()=>{const value=safe(()=>JSON.parse(localStorage.getItem(noteKey)||'{}'));return value&&typeof value==='object'&&!Array.isArray(value)?value:{};};
  let memory=readNotes();
  function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
  function work(card,statement,key) {
    if(number<20)return;
    const existing=card.querySelector('.oca-work');if(existing&&existing.dataset.problem===key)return;if(existing)existing.remove();
    const question=clean(statement.textContent),storageId=number+':'+hash(key),saved=memory[storageId]&&memory[storageId].questionKey===key?memory[storageId]:{};
    const box=node('section',undefined,'oca-work oca-owned');box.dataset.problem=key;box.setAttribute('aria-label','Моё развёрнутое решение');
    const label=node('label','Моё решение'),textarea=node('textarea');textarea.id=id();textarea.rows=6;textarea.maxLength=20000;textarea.value=saved.text||'';label.htmlFor=textarea.id;
    const prompts=number===20?['Укажи ограничения, если есть знаменатели или корни.','Запиши преобразования по строкам и поясни используемое правило.','Проверь найденные значения в исходном условии.']:number===21?['Обозначь неизвестное и укажи его единицу.','Вырази остальные величины и составь уравнение по условию.','Реши уравнение и проверь смысл найденного значения.']:['Укажи область определения и построй каждую часть графика.','Отметь выколотые точки, вершины и другие важные точки.','Объясни, при каких значениях параметра получается нужное число общих точек.'];
    textarea.placeholder=prompts.join('\n');const note=node('p','Здесь сохраняется твоя запись. Кнопка проверки ответа не оценивает правильность доказательства.','oca-note');const status=node('p',saved.text?'Запись восстановлена.':'','oca-save-status');status.setAttribute('aria-live','polite');box.append(label,textarea,note);
    const plan=details(box,'Что написать в решении?');const list=node('ol');prompts.forEach(t=>list.append(node('li',t)));plan.append(list);close(plan);
    const check=details(box,'Проверить оформление самостоятельно');const checks=prompts.map((_,i)=>{const lab=node('label',undefined,'oca-check'),input=node('input');input.type='checkbox';input.checked=!!saved.checks?.[i];lab.append(input,node('span',['Обозначения и ограничения понятны.','Каждый переход объяснён.','Ответ проверен и соответствует вопросу.'][i]));check.append(lab);return input;});
    const table=number===21?details(box,'Разложить данные задачи в таблицу'):null;const fields=[];
    if(table){table.append(node('p','Впиши свои обозначения. В каждом столбце укажи, что означает число или выражение; единицы запиши рядом.'));
      const scroll=node('div',undefined,'oca-table-scroll'),t=node('table'),head=node('tr');['Величина / участник','Что известно','Как выразить через неизвестное'].forEach(s=>head.append(node('th',s)));t.append(head);
      for(let r=0;r<3;r++){const row=node('tr');for(let c=0;c<3;c++){const td=node('td'),input=node('input');input.type='text';input.maxLength=200;input.setAttribute('aria-label',['Величина или участник','Известное значение и единица','Выражение через неизвестное'][c]+', строка '+(r+1));input.value=saved.fields?.[r*3+c]||'';fields.push(input);td.append(input);row.append(td);}t.append(row);}scroll.append(t);table.append(scroll);close(table);}
    function save(){Object.assign(memory,readNotes());memory[storageId]={question,questionKey:key,text:textarea.value,checks:checks.map(x=>x.checked),fields:fields.map(x=>x.value),updated:Date.now(),number};try{localStorage.setItem(noteKey,JSON.stringify(memory));status.textContent='Запись сохранена.';}catch(_){status.textContent='Запись сохранена на этой странице. Хранилище браузера сейчас недоступно.';}}
    textarea.addEventListener('input',save);checks.forEach(x=>x.addEventListener('change',save));fields.forEach(x=>x.addEventListener('input',save));box.append(status);
    const archive=details(box,'Мои записи к другим задачам');archive.addEventListener('toggle',()=>{if(!archive.open)return;Object.assign(memory,readNotes());archive.querySelectorAll('.oca-saved-entry').forEach(n=>n.remove());const entries=Object.values(memory).filter(x=>x&&x.number===number&&typeof x.question==='string'&&x.questionKey!==key&&(typeof x.text==='string'&&x.text||Array.isArray(x.fields)&&x.fields.some(Boolean))).sort((a,b)=>b.updated-a.updated);if(!entries.length)archive.append(node('p','Пока других записей нет.','oca-saved-entry'));for(const entry of entries){const item=node('details',undefined,'oca-saved-entry');item.append(node('summary',entry.question.slice(0,100)+(entry.question.length>100?'…':'')),node('p',entry.question),node('pre',entry.text||'(Заполнена таблица)'));if(Array.isArray(entry.fields)&&entry.fields.some(Boolean)){const p=node('p');p.textContent=entry.fields.filter(Boolean).join(' · ');item.append(p);}archive.append(item);}});
    const anchor=card.querySelector('.oca-instruction')||statement;anchor.after(box);
  }
  function statementOf(card){let s=card.querySelector(routes[number][1]);if(s)return s;return [...card.children].find(n=>!n.classList.contains('oca-owned')&&!n.matches('details,button,.minimal-hint'))||card.firstElementChild;}
  function scan(){
    scheduled=false;
    for(const card of d.querySelectorAll(routes[number][0])){
      const statement=statementOf(card);if(!statement)continue;const key=clean(statement.innerHTML);if(!key)continue;
      const previous=cards.get(card);if(previous&&previous!==key){card.querySelectorAll('.oca-work,.oca-instruction,.oca-exploration,.oca-reference').forEach(n=>n.remove());}
      cards.set(card,key);inputGuidance(card);work(card,statement,key);
      const panel=helpPanel(card);if(panel){addLab(panel);addReference(panel);if(!panel.querySelector(':scope > .oca-return')&&number!==7&&number!==14){const back=action('Вернуться к заданию',()=>{const toggle=card.querySelector('[aria-controls="'+panel.id+'"]')||card.querySelector('.bs,button.minimal-hint');if(toggle&&toggle.tagName==='BUTTON'){toggle.click();toggle.focus();}else{panel.hidden=true;}});back.classList.add('oca-return');panel.append(back);}}
    }
    if(number>=20)d.querySelectorAll('.minimal-proof-note').forEach(n=>{const text='Проверяется ответ. Развёрнутое решение можно записать выше или в тетради.';if(n.textContent!==text)n.textContent=text;});
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(scan,0);}
  const observer=new MutationObserver(schedule);observer.observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});scan();
  d.documentElement.dataset.ogeAlgebraExperience='ready';
})();
