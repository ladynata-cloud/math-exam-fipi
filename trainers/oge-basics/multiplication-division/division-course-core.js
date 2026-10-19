(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./division-lab-core.js'), require('./quotient-estimate-core.js'));
  else root.DivisionCourse = factory(root.DivisionLab, root.QuotientEstimate);
})(typeof globalThis === 'undefined' ? this : globalThis, function(D, Q) {
  'use strict';
  const prefix = 'multiplication-division/course-';
  const rows = [
    ['multiply-bridge','Умножение помогает делить','Узнать, какую цифру умножили.','Умножь, затем найди эту цифру при делении.','supported'],
    ['digit-choice','Подбираем одну цифру','Выбрать цифру от 0 до 9.','Умножь цифру и проверь следующую.','supported'],
    ['multiply-two-digit','Умножаем на число из двух цифр','Посчитать, например, 4 × 23.','Умножь на 20, затем на 3 и сложи.','supported'],
    ['subtract','Вычитаем по порядку','Уверенно выполнить вычитание.','Сначала справа, затем слева.','supported'],
    ['first-part','С каких цифр начать','Выбрать первое число слева.','Если первой цифры мало, возьми ещё одну справа.','supported'],
    ['bring-digit','Переносим следующую цифру','Продолжить запись после вычитания.','Перенеси ровно одну цифру и прочитай новое число.','supported'],
    ['whole-simple','Собираем всё деление','Пройти весь уголок с небольшим числом справа.','Выбери цифру, умножь, вычти, перенеси следующую.','supported'],
    ['simple-check','Проверяем себя: простое деление','Решить три новых примера самостоятельно.','Реши в тетради и запиши ответы.','check'],
    ['estimate','Округляем и прикидываем','Начать подбор цифры с прикидки.','Округли, прикинь, проверь и поправь цифру.','supported'],
    ['whole-two-digit','Делим на число из двух цифр','Применить прикидку внутри уголка.','На каждом шаге проверь выбранную цифру умножением.','practice'],
    ['zeros','Не пропускаем ноль','Сохранить ноль внутри ответа.','Если после переноса число мало, запиши 0.','supported'],
    ['remainder','Что осталось после деления','Отдельно записать то, что осталось.','Проверь: осталось меньше числа справа.','practice'],
    ['decimal-natural','Запятая в ответе','Делить число с запятой на целое число.','Перешёл через запятую слева — поставь её в ответе.','supported'],
    ['append-zeros','Продолжаем после запятой','Закончить деление, дописывая нули.','Осталось число — допиши 0 и продолжай.','supported'],
    ['decimal-divisor','Убираем запятую справа','Подготовить деление, когда справа есть запятая.','Перенеси запятую в обоих числах одинаково.','supported'],
    ['mixed-guided','Три вида деления по шагам','Выбрать нужные действия в разных примерах.','Пройди три разных уголка.','practice'],
    ['independent-check','Делим самостоятельно','Решить три новых разных примера.','Выполни уголки в тетради. Здесь введи только ответы.','check']
  ];
  const stages = Object.freeze(rows.map((r,i) => Object.freeze({id:prefix+r[0],slug:r[0],title:r[1],goal:r[2],action:r[3],guidance:r[4],support:r[4]==='check'?'Самостоятельная проверка':r[4]==='practice'?'Практика по шагам':'Подробная помощь',order:i+1,prerequisite:i?prefix+rows[i-1][0]:null})));
  const byId = new Map(stages.map(s=>[s.id,s]));
  const has = id => byId.has(id);
  function stageFor(id) { if (!has(id)) throw Error('Неизвестная ступень курса деления.'); return byId.get(id); }
  const stamp = t => t.level+'|'+t.dividend+'|'+t.divisor;
  const mixedSeed = (seed, offset) => (Math.imul(seed+1,1664525)+1013904223+Math.imul(offset+1,69069))>>>0;
  const numericStep = (kind,prompt,answer,hint,record) => ({kind,prompt,answer:String(answer),hint,error:'Пока не получилось. Посмотри на это действие ещё раз. Можно открыть подсказку.',record});
  function lesson(title, lead, html, prompt, answer, hint) {
    return {title,short:title,lead,html,question:{kind:'input',prompt,answer:String(answer),hint,good:'Верно. Можно продолжать.',bad:'Попробуй ещё раз. Подсказка поможет выполнить это действие.'}};
  }
  function fullTask(level, seed, offset=0) { return D.make(level,mixedSeed(seed,offset)||1); }
  function earlyTask(level,seed,offset=0) {
    const k=mixedSeed(seed,offset),d=level==='oneDigit'?2+k%8:12+k%38;
    let q=10*(1+Math.floor(k/8)%9)+1+Math.floor(k/72)%9;
    if(q===11)q=12;
    return {level,dividend:String(d*q),divisor:String(d)};
  }
  function plainPlan(task, brief=false) {
    const p=D.plan(task), d=p.normalizedDivisor;
    const actions=p.actions.map(a=>{
      const cycle=a.cycle===undefined?null:p.cycles[a.cycle];
      let prompt='',hint='',record='';
      switch(a.kind) {
        case 'shift-count': prompt='Сколько цифр после запятой в числе '+task.divisor+'?'; hint='Посчитай цифры справа от запятой: их '+a.answer+'.'; record='В числе '+task.divisor+' после запятой '+a.answer+' цифр.'; break;
        case 'shift-factor': prompt='На сколько нужно умножить оба числа, чтобы убрать запятую справа?'; hint='Одна цифра после запятой — умножаем на 10; две — на 100. Здесь нужно '+a.answer+'.'; record='Умножаем оба числа на '+a.answer+'.'; break;
        case 'shift-divisor': prompt='Измени число справа: '+task.divisor+' × '+10**D.number(task.divisor).places+' = ?'; hint='Перенеси запятую вправо: получится '+a.answer+'.'; record='Справа: '+task.divisor+' → '+a.answer+'.'; break;
        case 'shift-dividend': prompt='Теперь так же измени число слева: '+task.dividend+' × '+10**D.number(task.divisor).places+' = ?'; hint='Перенеси запятую вправо на столько же мест. Получится '+a.answer+'.'; record='Слева: '+task.dividend+' → '+a.answer+'.'; break;
        case 'start': prompt=Number(a.answer)<d?'Всё число до запятой меньше '+d+'. Какое число возьмём до запятой?':'Нужно '+d+' или больше. Бери цифры слева. С какого числа начнём?'; hint='Смотри на '+p.normalizedDividend+'. Начинаем слева. Первое число для работы — '+a.answer+'.'; record='Начинаем с числа '+a.answer+'.'; break;
        case 'digit': prompt='Подбери одну цифру для '+cycle.partial+' : '+d+'.'; hint=cycle.qd===0?'Даже 1 × '+d+' больше '+cycle.partial+'. На этом месте нужна цифра 0.':cycle.qd+' × '+d+' = '+cycle.product+(cycle.product===cycle.partial?' — совпало точно.':cycle.qd===9?' — не больше '+cycle.partial+'. 9 — самая большая цифра.':', а '+(cycle.qd+1)+' × '+d+' = '+(cycle.qd+1)*d+' — уже много.')+' Берём '+cycle.qd+'.'; record='Для '+cycle.partial+' : '+d+' берём цифру '+a.answer+'.'; break;
        case 'product': prompt='Умножь выбранную цифру: '+cycle.qd+' × '+d+' = ?'; hint=cycle.qd+' × '+d+' = '+a.answer+'.'; record=cycle.qd+' × '+d+' = '+a.answer+'.'; break;
        case 'subtract': prompt='Вычти: '+cycle.partial+' − '+cycle.product+' = ?'; hint='Вычитай справа налево. Должно остаться '+a.answer+'. Проверка: '+a.answer+' + '+cycle.product+' = '+cycle.partial+'.'; record=cycle.partial+' − '+cycle.product+' = '+a.answer+'.'; break;
        case 'bring': prompt=a.appended?'Цифры закончились, но деление ещё не закончилось. Какую цифру допишем справа?':'Какую следующую цифру перенесём справа к тому, что осталось?'; hint=a.appended?'После запятой можно дописать 0. Перенеси этот 0.':'Смотри на исходную запись слева. Следующая ещё не использованная цифра — '+a.answer+'.'; record=(a.appended?'Дописали и перенесли ':'Перенесли следующую цифру ')+a.answer+'.'; break;
        case 'partial': prompt='Припиши перенесённую цифру справа к тому, что осталось. Какое число получилось?'; hint='Соедини оставшееся число и одну перенесённую цифру. Получится '+a.answer+'.'; record='Теперь работаем с числом '+a.answer+'.'; break;
        case 'comma': prompt='Запиши уже полученные цифры ответа и поставь после них запятую.'; hint='Перешли через запятую в числе слева. В ответе тоже ставим запятую: '+a.answer; record='В ответе поставили запятую: '+a.answer; break;
        case 'answer': prompt='Прочитай собранные цифры. Запиши '+(task.level==='remainder'?'целую часть ответа.':'весь ответ.'); hint='Прочитай цифры по порядку, сохрани нули и запятую. Получится '+a.answer+'.'; record='Ответ: '+a.answer+'.'; break;
        case 'final-remainder': prompt='Какое число осталось после последнего вычитания?'; hint='Последнее вычитание дало '+a.answer+'. Это меньше '+d+'.'; record='Осталось '+a.answer+'.'; break;
        case 'verify': prompt='Проверь: '+p.quotient+' × '+task.divisor+(task.level==='remainder'?' + '+p.remainder:'')+' = ?'; hint='Должно получиться исходное число слева: '+task.dividend+'.'; record='Проверка: '+p.quotient+' × '+task.divisor+(task.level==='remainder'?' + '+p.remainder:'')+' = '+a.answer+'.'; break;
        default: throw Error('Неизвестное действие деления.');
      }
      if(brief) {
        const shorter={start:'С какого числа слева начнём?',digit:'Какую одну цифру запишем сейчас?',product:'Умножь выбранную цифру на число справа.',subtract:'Вычти. Сколько осталось?',bring:a.appended?'Какую цифру допишем и перенесём?':'Какую следующую цифру перенесём?',partial:'Какое число получилось после переноса?',comma:'Запиши уже полученную часть ответа и поставь запятую.',answer:'Запиши весь ответ.', 'final-remainder':'Сколько осталось в конце?'};
        prompt=shorter[a.kind]||prompt;
      }
      return {...a,...numericStep(a.kind,prompt,a.answer,hint,record)};
    });
    return {plan:p,steps:actions};
  }
  const demos = {
    'multiply-bridge':()=>lesson('Умножение и деление связаны','Вспомни знакомое умножение.','<p>4 × 6 = 24. Поэтому для 24 : 6 берём цифру 4.</p>','3 × 7 = 21. Какую цифру берём для 21 : 7?',3,'Нужна та цифра, которую умножили на 7: это 3.'),
    'digit-choice':()=>lesson('Нужен самый большой подходящий результат','Проверяем цифру умножением.','<p>Для 23 : 6 пробуем 3: 3 × 6 = 18. Следующая цифра 4 даёт 24 — уже много. Берём 3.</p>','Подбери одну цифру для 29 : 7.',4,'4 × 7 = 28. 5 × 7 = 35 — много. Берём 4.'),
    'multiply-two-digit':()=>lesson('Раздели число на две удобные части','23 — это 20 и 3.','<p>4 × 23: сначала 4 × 20 = 80, затем 4 × 3 = 12. Складываем: 80 + 12 = 92.</p>','Вычисли только первый шаг: 3 × 20 = ?',60,'3 × 20 = 60.'),
    'subtract':()=>lesson('Если цифры справа не хватает','83 − 56: справа 3 − 6 не получается.','<p>Берём один десяток слева: справа становится 13, слева остаётся 7. Справа: 13 − 6 = 7. Слева: 7 − 5 = 2. Ответ: 27.</p>','Вычисли правую часть в 72 − 48: 12 − 8 = ?',4,'12 − 8 = 4.'),
    'first-part':()=>lesson('Начинай слева','В 735 : 5 сначала смотрим на 7.','<p>7 уже не меньше 5. Значит, начинаем с 7. В 864 : 36 цифры 8 мало — берём 86.</p>','В 672 : 8 цифры 6 мало. Какое число возьмём слева?',67,'Возьми первые две цифры: 67.'),
    'bring-digit':()=>lesson('Переноси ровно одну цифру','В 735 : 5 начали с 7. После вычитания осталось 2.','<p>Следующая цифра в 735 — это 3. Приписываем её справа к 2. Получается 23.</p>','Осталось 4. Переносим цифру 2. Какое число получилось?',42,'Припиши 2 справа к 4: получится 42.'),
    'whole-simple':()=>lesson('Четыре действия повторяются','Выбери цифру → умножь → вычти → перенеси.','<p>В 84 : 4 начинаем с 8. Берём 2: 2 × 4 = 8. Вычитаем: 8 − 8 = 0. Переносим 4. Берём 1. Ответ 21.</p>','Подбери первую цифру ответа для 96 : 3.',3,'Начинаем с 9. 3 × 3 = 9. Первая цифра — 3.'),
    'simple-check':()=>lesson('Проверяй умножением','Сначала реши пример самостоятельно.','<p>Если 84 : 4 = 21, проверка такая: 21 × 4 = 84. Получилось исходное число.</p>','Какое число должно получиться при проверке ответа к 96 : 3?',96,'При проверке должно вернуться число слева — 96.'),
    'whole-two-digit':()=>lesson('Прикидка помогает выбрать цифру','В 864 : 36 начинаем с 86.','<p>Прикинем: 80 : 40 = 2. Проверяем: 2 × 36 = 72. Вычитаем: 86 − 72 = 14. Переносим 4, получаем 144.</p>','Проверь выбранную цифру: 2 × 36 = ?',72,'2 × 30 + 2 × 6 = 60 + 12 = 72.'),
    'zeros':()=>lesson('Ноль сохраняет своё место','В 1005 : 5 начали с 10 и получили цифру 2.','<p>После вычитания осталось 0. Перенесли следующий 0. Теперь 0 : 5 — пишем 0 в ответе. Затем переносим 5. Полный ответ 201, а не 21.</p>','Внутри уголка после переноса получилось 3. Делим на 5. Какую цифру пишем?',0,'Даже 1 × 5 больше 3. На этом месте пишем 0.'),
    'remainder':()=>lesson('Не всё делится без остатка','23 : 5: берём 4, потому что 4 × 5 = 20.','<p>После вычитания остаётся 3. Ответ: 4, осталось 3. Проверка: 4 × 5 + 3 = 23.</p>','В 29 : 6 берём 4. Что осталось после 29 − 24?',5,'29 − 24 = 5. Это меньше 6.'),
    'decimal-natural':()=>lesson('Запятая появляется и в ответе','12,6 : 3: сначала делим 12 и получаем 4.','<p>Дальше в числе слева стоит запятая. Ставим запятую и в ответе. Переносим 6, получаем ещё цифру 2. Ответ 4,2.</p>','Цифры ответа: 3, затем запятая, затем 5. Запиши ответ.', '3,5','Сохрани запятую между 3 и 5: 3,5.'),
    'append-zeros':()=>lesson('Можно дописать ноль','В 1 : 4 целой единицы не получается. Пишем 0 и запятую.','<p>Записываем 1 как 1,0. Переносим 0: получаем 10. Берём 2, остаётся 2. Дописываем ещё 0: получаем 20. Берём 5. Ответ 0,25.</p>','Осталось 3. Дописали и перенесли 0. Какое число получилось?',30,'Припиши 0 справа к 3: получится 30.'),
    'decimal-divisor':()=>lesson('Одинаково меняем оба числа','8 : 2,5 заменяем на 80 : 25.','<p>У числа справа одна цифра после запятой. Умножаем оба числа на 10. Теперь справа нет запятой, можно делить уголком.</p>','Число справа умножили на 10. На сколько умножаем число слева?',10,'Оба числа меняем одинаково. Слева тоже умножаем на 10.'),
    'mixed-guided':()=>lesson('Сначала посмотри на оба числа','Если справа есть запятая, сначала убери её.','<p>6 : 1,5 → 60 : 15. Если справа целое число, сразу начинай уголок. Нули в середине ответа сохраняй.</p>','Сколько цифр после запятой в числе 1,5?',1,'После запятой стоит одна цифра — 5.'),
    'independent-check':()=>lesson('Реши и проверь самостоятельно','Здесь три новых примера разных видов.','<p>Реши каждый уголок в тетради. Введи полный ответ, сохрани нули и запятую. Подсказка доступна, если застрянешь.</p>','В ответе получилось: 2, потом 0, потом 3. Запиши это число.',203,'Ноль занимает своё место: 203.')
  };
  function micro(slug,seed,variants) {
    const groups=[],steps=[];
    const group=(prompt,makeSteps)=>{
      const taskIndex=groups.length,startIndex=steps.length;
      steps.push(...makeSteps.map(s=>({...s,taskIndex})));
      groups.push({task:null,prompt,startIndex,endIndex:steps.length});
    };
    for(let i=0;i<3;i++) {
      const k=(seed+i)%100000,v=variants&&variants[i];
      if(slug==='multiply-bridge') {
        const a=v?v[0]:2+k%8,b=v?v[1]:2+(Math.floor(k/8)+i)%8,n=a*b;
        group(a+' × '+b+' и '+n+' : '+b,[numericStep('product','Умножь: '+a+' × '+b+' = ?',n,a+' × '+b+' = '+n+'.',a+' × '+b+' = '+n+'.'),numericStep('digit','Какую цифру умножили на '+b+', чтобы получить '+n+'?',a,'В предыдущем действии на '+b+' умножили цифру '+a+'.',n+' : '+b+' — берём '+a+'.')]);
      } else if(slug==='digit-choice') {
        const d=v?v[1]:3+k%7,n=v?v[0]:(2+(Math.floor(k/7)+i)%7)*d+(k+i)%d,q=Math.floor(n/d);
        const help=q===9?'9 × '+d+' = '+q*d+' — не больше '+n+'. 9 — самая большая цифра.':q+' × '+d+' = '+q*d+', а '+(q+1)+' × '+d+' = '+(q+1)*d+' — уже больше '+n+'.';
        const ss=[numericStep('digit','Подбери одну цифру для '+n+' : '+d+'.',q,help,'Для '+n+' : '+d+' пробуем '+q+'.'),numericStep('product','Проверь: '+q+' × '+d+' = ?',q*d,q+' × '+d+' = '+q*d+'.',q+' × '+d+' = '+q*d+'.')];
        if(n!==q*d&&q<9)ss.push(numericStep('product','Проверь следующую цифру: '+(q+1)+' × '+d+' = ?',(q+1)*d,help,(q+1)+' × '+d+' = '+(q+1)*d+' — больше '+n+'.'));
        ss.push(numericStep('digit','Какую одну цифру оставим для '+n+' : '+d+'?',q,help,'Берём '+q+'.'));
        group(n+' : '+d,ss);
      } else if(slug==='multiply-two-digit') {
        const a=v?v[0]:2+k%8,d=v?v[1]:10*(1+(Math.floor(k/8)+i)%4)+1+(k+i)%8,t=d-d%10,u=d%10;
        group(a+' × '+d,[numericStep('product','Сначала умножь: '+a+' × '+t+' = ?',a*t,a+' × '+t+' = '+a*t+'.',a+' × '+t+' = '+a*t+'.'),numericStep('product','Теперь умножь: '+a+' × '+u+' = ?',a*u,a+' × '+u+' = '+a*u+'.',a+' × '+u+' = '+a*u+'.'),numericStep('answer','Сложи два результата: '+a*t+' + '+a*u+' = ?',a*d,a*t+' + '+a*u+' = '+a*d+'.',a+' × '+d+' = '+a*d+'.')]);
      } else if(slug==='subtract') {
        if(i<2) {
          const pairs=i===0?[[86,24],[97,35],[75,43],[68,26]]:[[83,56],[72,48],[64,37],[91,56],[85,58],[73,46],[62,29],[94,67]];
          const [a,b]=v||pairs[k%pairs.length],borrow=a%10<b%10,left=Math.floor(a/10)-(borrow?1:0),right=a%10+(borrow?10:0),ones=right-b%10,tens=left-Math.floor(b/10);
          group(a+' − '+b,[numericStep('digit',(borrow?'Справа '+a%10+' − '+b%10+' не получается. Возьмём 1 десяток слева. ':'Начни справа. ')+'Вычти: '+right+' − '+b%10+' = ?',ones,right+' − '+b%10+' = '+ones+'.','Справа: '+right+' − '+b%10+' = '+ones+'.'),numericStep('digit','Слева '+(borrow?'осталось ':'')+left+' десятков. Вычти: '+left+' − '+Math.floor(b/10)+' = ?',tens,left+' − '+Math.floor(b/10)+' = '+tens+'.','Слева: '+left+' − '+Math.floor(b/10)+' = '+tens+'.'),numericStep('answer','Собери две полученные цифры. Сколько будет '+a+' − '+b+'?',a-b,'Слева '+tens+', справа '+ones+'. Получилось '+(a-b)+'.',a+' − '+b+' = '+(a-b)+'.')]);
        } else {
          const a=v?v[0]:100*(1+seed%8),answer=v?v[0]-v[1]:1+seed%9,b=a-answer,hundreds=a/100-1;
          group(a+' − '+b,[numericStep('product','Справа два нуля. Возьмём 1 сотню слева. Сколько в ней десятков?',10,'В 1 сотне 10 десятков.','Взяли 1 сотню: получили 10 десятков.'),numericStep('digit','Один десяток отдаём вправо. Сколько десятков останется из 10?',9,'10 − 1 = 9.','Посередине осталось 9 десятков, справа стало 10.'),numericStep('digit','Справа теперь 10. Вычти: 10 − '+b%10+' = ?',answer,'10 − '+b%10+' = '+answer+'.','Справа: 10 − '+b%10+' = '+answer+'.'),numericStep('digit','Посередине осталось 9. Вычти: 9 − 9 = ?',0,'9 − 9 = 0.','Посередине получилось 0.'),numericStep('digit','Слева осталось '+hundreds+'. Вычти: '+hundreds+' − '+Math.floor(b/100)+' = ?',0,hundreds+' − '+Math.floor(b/100)+' = 0.','Слева получилось 0.'),numericStep('answer','Собери ответ для '+a+' − '+b+'. Начальные нули не пиши.',answer,'После начальных нулей остаётся цифра '+answer+'. Ответ '+answer+'.',a+' − '+b+' = '+answer+'.')]);
        }
      } else {
        const tasks=[['735','5'],['864','36'],['948','24'],['476','7'],['936','39'],['672','8'],['963','3']], pair=v?v.map(String):tasks[k%tasks.length],task={level:Number(pair[1])<10?'oneDigit':'twoDigit',dividend:pair[0],divisor:pair[1]},p=D.plan(task);
        if(slug==='first-part') {
          const start=p.actions.find(a=>a.kind==='start');
          group(pair.join(' : '),[{...numericStep('start','Нужно '+pair[1]+' или больше. Бери цифры слева. С какого числа начнём?',start.answer,'Начинаем с '+start.answer+'.','Для '+pair.join(' : ')+' начинаем с '+start.answer+'.'),visual:{kind:'first',digits:task.dividend,divisor:task.divisor,sourceIndex:start.sourceIndex}}]);
        } else if(slug==='bring-digit') {
          const index=p.actions.findIndex(a=>a.kind==='bring'),bring=p.actions[index],partial=p.actions[index+1],cycle=p.cycles[0],used=task.dividend.slice(0,bring.sourceIndex);
          const visual={kind:'bring',digits:task.dividend,divisor:task.divisor,sourceIndex:bring.sourceIndex,remainder:cycle.remainder};
          group(pair.join(' : ')+'. Уже вычли '+cycle.partial+' − '+cycle.product+' = '+cycle.remainder+'.',[{...numericStep('bring','В числе '+task.dividend+' уже использовали слева '+used+'. Какую следующую цифру перенесём?',bring.answer,'Следующая цифра — '+bring.answer+'.','Переносим цифру '+bring.answer+'.'),visual:{...visual}},{...numericStep('partial','Осталось '+cycle.remainder+'. Припиши справа перенесённую цифру '+bring.answer+'. Какое число получилось?',partial.answer,'Получилось '+partial.answer+'.','Теперь работаем с '+partial.answer+'.'),visual:{...visual}}]);
        } else throw Error('Неизвестное маленькое действие.');
      }
    }
    return {steps,divisionTasks:groups};
  }
  function independentTasks(seed, simple) {
    const tasks=[],seen=new Set(['84|4','96|3','735|5','864|36','672|8','1005|5','23|5','29|6','12,6|3','1|4','8|2,5','6|1,5']);
    const key=t=>t.dividend+'|'+t.divisor;
    ['oneDigit','twoDigit','zero','remainder','decimalNatural','appendZeros','decimalDivisor'].forEach(level=>seen.add(key(fullTask(level,seed))));
    seen.add(key(earlyTask('oneDigit',seed)));seen.add(key(earlyTask('oneDigit',seed,8)));
    seen.add(key(fullTask('twoDigit',seed,11)));seen.add(key(fullTask('decimalNatural',seed,12)));seen.add(key(fullTask('decimalDivisor',seed,13)));
    if(simple) {
      for(let i=0;tasks.length<3;i++) {
        const task=earlyTask('oneDigit',seed,50+i);
        if(!seen.has(key(task)) && task.dividend!=='84' && task.dividend!=='96') {tasks.push(task);seen.add(key(task));}
      }
    } else {
      const ds=[12,16,24,25,32,36,42,48],d=ds[seed%ds.length],q=(2+seed%7)*100+1+(Math.floor(seed/7)%8);
      tasks.push({level:'twoDigit',dividend:String(d*q),divisor:String(d)});
      for(const [level,start] of [['decimalDivisor',71],['appendZeros',91]]) {
        let offset=start,task=fullTask(level,seed,offset);
        while(seen.has(key(task)))task=fullTask(level,seed,++offset);
        tasks.push(task);seen.add(key(task));
      }
    }
    return tasks;
  }
  function make(contentId,seed) {
    const stage=stageFor(contentId);
    if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Некорректный вариант задания.');
    let source={family:'division',title:stage.title,rule:stage.guidance==='check'?'Реши три новых примера в тетради. Введи полные ответы. Если понадобится помощь, открой подсказку.':stage.action,task:{kind:'input',prompt:stage.goal},lessons:[],steps:[],divisionTask:null,divisionTasks:[]};
    if(stage.slug==='estimate') {
      const estimate=Q.make(seed); return {...source,...estimate,title:stage.title,steps:estimate.steps.map(s=>({...s,error:'Проверь это действие ещё раз. Прикидка и окончательная цифра могут отличаться.'}))};
    }
    source.lessons=[demos[stage.slug]()];
    if(stage.order<=6) {
      const exercises=micro(stage.slug,seed);
      return {...source,...exercises,task:{kind:'input',prompt:exercises.divisionTasks.map(g=>g.prompt).join(' · ')}};
    }
    if(stage.guidance==='check') {
      const tasks=independentTasks(seed,stage.slug==='simple-check');
      tasks.forEach((task,taskIndex)=>{
        const p=D.plan(task),startIndex=source.steps.length;
        source.steps.push({...numericStep('answer','Реши самостоятельно: '+task.dividend+' : '+task.divisor+'. Запиши полный ответ.',p.quotient,'Проверь уголок. Ответ: '+p.quotient+'. После этого проверь его умножением.','Ответ для '+task.dividend+' : '+task.divisor+': '+p.quotient+'.'),taskIndex});
        source.divisionTasks.push({task,prompt:task.dividend+' : '+task.divisor,startIndex,endIndex:source.steps.length});
      });
      source.task.prompt=source.divisionTasks.map(g=>g.prompt).join(' · ');
      return source;
    }
    const levelBySlug={'whole-simple':'oneDigit','whole-two-digit':'twoDigit','zeros':'zero','remainder':'remainder','decimal-natural':'decimalNatural','append-zeros':'appendZeros','decimal-divisor':'decimalDivisor'};
    const tasks=stage.slug==='mixed-guided'?[fullTask('twoDigit',seed,11),fullTask('decimalNatural',seed,12),fullTask('decimalDivisor',seed,13)]:[stage.slug==='whole-simple'||stage.slug==='whole-two-digit'?earlyTask(levelBySlug[stage.slug],seed):fullTask(levelBySlug[stage.slug],seed)];
    if(stage.slug==='whole-simple') {
      let offset=8,second=earlyTask('oneDigit',seed,offset);
      while(stamp(second)===stamp(tasks[0]))second=earlyTask('oneDigit',seed,++offset);
      tasks.push(second);
      source.rule='Первый уголок пройдём с подробными вопросами. Во втором вопросы будут короче. Подсказка остаётся доступной.';
    }
    source.divisionTask=tasks[0];
    source.task.prompt=tasks[0].dividend+' : '+tasks[0].divisor;
    tasks.forEach((task,taskIndex)=>{
      const brief=stage.slug==='whole-two-digit'||stage.slug==='mixed-guided'||(stage.slug==='whole-simple'&&taskIndex>0);
      const startIndex=source.steps.length,steps=plainPlan(task,brief).steps;
      source.steps.push(...steps.map(s=>({...s,taskIndex})));
      source.divisionTasks.push({task,prompt:task.dividend+' : '+task.divisor,startIndex,endIndex:source.steps.length});
    });
    source.task.prompt=source.divisionTasks.map(g=>g.prompt).join(' · ');
    return source;
  }
  // Saved version-1 attempts regenerate make() exactly. Expanded generation is
  // an explicit opt-in, with the same questions, actions and board protocol.
  const microPools=new Map();
  function poolsV2(slug) {
    if(microPools.has(slug))return microPools.get(slug);
    const pools=slug==='subtract'?[[],[],[]]:[[]];
    if(slug==='multiply-bridge') {
      for(let a=2;a<=9;a++)for(let b=2;b<=9;b++)pools[0].push([a,b]);
    } else if(slug==='multiply-two-digit') {
      for(let a=2;a<=9;a++)for(let d=11;d<=49;d++)if(d%10)pools[0].push([a,d]);
    } else if(slug==='digit-choice') {
      for(let d=2;d<=9;d++)for(let n=d;n<10*d;n++)pools[0].push([n,d]);
    } else if(slug==='subtract') {
      for(let a=20;a<=99;a++)for(let b=10;b<a;b++) {
        if(Math.floor(b/10)>=Math.floor(a/10))continue;
        pools[a%10>=b%10?0:1].push([a,b]);
      }
      for(let a=100;a<=900;a+=100)for(let answer=1;answer<=9;answer++)pools[2].push([a,a-answer]);
    } else if(slug==='first-part'||slug==='bring-digit') {
      // Three-digit examples and a two-digit answer: always another digit to
      // bring down, and no new internal-zero skill before its own stage.
      for(let d=2;d<=49;d++)for(let q=12;q<=99;q++) {
        const n=d*q;
        if(q%10&&n>=100&&n<=999)pools[0].push([n,d]);
      }
    } else throw Error('Неизвестное маленькое действие.');
    pools.forEach(pool=>{pool.forEach(Object.freeze);Object.freeze(pool);});
    Object.freeze(pools);microPools.set(slug,pools);return pools;
  }
  function variantsV2(slug,seed) {
    const pools=poolsV2(slug),salt=rows.findIndex(r=>r[0]===slug)*1009;
    // Mixed-radix ranks vary whole exercise sets rather than cycling through
    // a handful of fixed triples. Products stay below Number.MAX_SAFE_INTEGER.
    let rank=seed*104729+salt;
    if(pools.length===3)return pools.map(pool=>{const pair=pool[rank%pool.length];rank=Math.floor(rank/pool.length);return pair;});
    const available=pools[0].slice(),chosen=[];
    for(let i=0;i<3;i++) {
      const index=rank%available.length;rank=Math.floor(rank/available.length);
      chosen.push(available.splice(index,1)[0]);
    }
    return chosen;
  }
  function makeV2(contentId,seed) {
    const source=make(contentId,seed),stage=stageFor(contentId);
    if(stage.slug==='estimate') {
      const estimate=Q.makeV2(seed);
      return {...source,...estimate,title:stage.title,steps:estimate.steps.map(s=>({...s,error:'Проверь это действие ещё раз. Прикидка и окончательная цифра могут отличаться.'}))};
    }
    if(stage.order<=6) {
      const exercises=micro(stage.slug,seed,variantsV2(stage.slug,seed));
      return {...source,...exercises,task:{kind:'input',prompt:exercises.divisionTasks.map(g=>g.prompt).join(' · ')}};
    }
    return source;
  }
  return Object.freeze({stages,has,stageFor,make,makeV2,plainPlan});
});
