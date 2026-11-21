/* Original guided solutions for part 1, printed p. 10, Vilenkin et al., 2023. */
(function(root){
  'use strict';
  const lessons=[
    {number:'1.3',key:'printed-1-3',page:10,title:'Три кружка в три разных дня',explanation:'Рассматривай по одному варианту первого дня. Каждое выбранное занятие должно проходить в этот день. После выбора убери этот кружок из оставшихся дней.',worked:['Для примера хор работает во вторник или четверг, шахматы — в четверг или пятницу, спорт — во вторник или пятницу.','Выбираем хор во вторник. Спорт теперь остаётся на пятницу, шахматы — на четверг.','Начни во вторник со спорта. Тогда хор придётся на четверг, шахматы — на пятницу. Других вариантов для вторника нет.'],misconception:'Если каждому кружку подошёл день, два одновременных занятия можно оставить вместе.',reflect:'Как объяснить, что найденные расписания исчерпывают все варианты?'},
    {number:'1.4',key:'printed-1-4',page:10,title:'Какие клетки суммы определены однозначно?',explanation:'В каждом столбце два слагаемых и их сумма. Два известных числа определяют третье. Если известно одно число или ни одного, сначала сделай свой допустимый выбор и затем проверь равенство.',worked:['В одном столбце записаны 16 и 9. Их сумма 25. Если даны 16 и сумма 25, второе равно 25 − 16 = 9.','Если известна только сумма 25, подходят, например, 7 + 18 и 13 + 12.','Если записано только первое слагаемое 16, второе выбираешь сам. Для второго 4 понадобится сумма 20.'],misconception:'Любую пустую клетку в этой таблице можно восстановить единственным способом.',reflect:'Почему сумму из двух чисел можно восстановить, а оба слагаемых только по сумме — нет?'},
    {number:'1.5',key:'printed-1-5',page:10,title:'Находим неверные равенства и исправляем их',explanation:'Сначала вычисли левую часть, закрыв записанный результат. Затем сравни со значением справа. Верные равенства оставь, в остальных замени только ошибочный результат.',worked:['Для проверки записи 38 + 24 = 52 сначала складываем 38 + 20 = 58, затем 58 + 4 = 62.','Требуется исправить число справа на 62. Обратная проверка даёт 62 − 24 = 38.','В записи 61 − 26 = 35 менять ничего не нужно, потому что 35 + 26 = 61.'],misconception:'Раз упражнение называется поиском ошибок, надо менять ответ в каждом равенстве.',reflect:'Как обратное действие поможет проверить, исправлять ли результат?'}
  ];
  const perm3=[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]];
  const daySets=[['понедельник','среда','суббота'],['вторник','четверг','пятница'],['понедельник','четверг','воскресенье']];
  const shortDay={понедельник:'пн',вторник:'вт',среда:'ср',четверг:'чт',пятница:'пт',суббота:'сб',воскресенье:'вс'};
  const clubsSets=[['Танцы','Робототехника','Живопись'],['Хор','Шахматы','Плавание'],['Художественная студия','Театр','Теннис']];
  const dateCodes=(forbidden,day)=>[1,2,3].filter(club=>forbidden[club-1]!==day);
  function schedule(seed,random,step){
    const days=daySets[seed?random(0,2):0],clubs=clubsSets[seed?random(0,2):0];
    const forbidden=seed?perm3[random(0,5)]:[3,1,2];
    const plans=perm3.filter(plan=>plan.every((club,day)=>forbidden[club-1]!==day+1));
    const allowed=[1,2,3].filter(day=>day!==forbidden[0]);
    const daily=days.map((day,i)=>[`${i+1}. ${shortDay[day]}`,dateCodes(forbidden,i+1).map(n=>`${n} — ${clubs[n-1]}`).join(', ')]);
    const steps=[step('В какие два дня проходит кружок с кодом 1? Введи номера дней по возрастанию через точку с запятой.',allowed,'Найди в каждой строке код 1. Возьми номера тех дней, в которых он указан.')];
    for(const plan of plans){
      const s=step('На первый день выбран кружок '+plan[0]+' («'+clubs[plan[0]-1]+'»). Запланируй все три дня. Введи три кода в порядке дней через точку с запятой.',plan,'Вычеркни уже назначенный кружок. Найди оставшийся день, для которого есть только один свободный кружок. Последний выбор определится сам.');
      s.answerFormat='v5-triple';s.scheduleRules={forbidden};
      s.clarifications=[{value:plans.find(other=>other!==plan),text:'Этот план тоже подходит для всего задания. В этом шаге первый день уже занят кружком '+plan[0]+'. Продолжи именно эту ветку.'}];steps.push(s);
    }
    steps.push(step('Сколько полных расписаний получено?',plans.length,'Для первого дня есть два выбора. При каждом из них два оставшихся кружка получают свои дни единственным способом.'));
    return {prompt:'Предложи одно расписание. В каждый из трёх дней нужно посетить по одному разному кружку. Все занятия идут одновременно. Запиши три кода через точку с запятой в порядке дней таблицы.',inputPrompt:'Коды кружков по трём дням',answer:plans[0],answerFormat:'v5-triple',alternatives:plans.slice(1),scheduleRules:{forbidden},steps,errors:[],table:{caption:'Дни занятий. '+days.map((day,i)=>(i+1)+' — '+day).join(', '),headers:['День','Доступные кружки и их коды'],rows:daily},data:{days,clubs,forbidden},conditionKey:[...days,...clubs,...forbidden].join('/')};
  }
  function columns(seed,random,step){
    const c=seed?[[random(8,32),random(7,22),null],[null,random(6,18),random(28,45)],[random(7,24),null,random(30,65)],[random(19,45),random(13,37),null],[null,null,random(24,78)],[random(6,39),null,null],[null,random(5,29),null],[null,null,null]]:[[25,11,null],[null,11,30],[14,null,55],[25,28,null],[null,null,63],[15,null,null],[null,22,null],[null,null,null]];
    const steps=c.slice(0,4).map(([a,b,s],i)=>{
      const missing=a===null?'первое слагаемое':b===null?'второе слагаемое':'сумму';
      const answer=a===null?s-b:b===null?s-a:a+b;
      const hint=s===null?'Сложи оба известных слагаемых.':'Из суммы вычти известное слагаемое. Проверь обратным сложением.';
      return step('Столбец '+(i+1)+'. Найди '+missing+'.',answer,hint,[{value:s===null?Math.abs(a-b):s+(a===null?b:a),text:s===null?'Разность отвечает на вопрос «на сколько». Здесь нужны оба слагаемых вместе.':'Прибавление к сумме делает число больше. Неизвестное слагаемое — оставшаяся часть суммы.'}]);
    });
    for(let i=4;i<8;i++){
      const [a,b,s]=c[i],left=a??(s===null?10:Math.floor(s/2)),right=b??(s===null?8:s-left);
      const prompt='Столбец '+(i+1)+'. '+(s!==null?'Сумма известна. Выбери подходящие слагаемые.':a!==null?'Первое слагаемое известно. Выбери второе и найди сумму.':b!==null?'Второе слагаемое известно. Выбери первое и найди сумму.':'Все клетки пустые. Придумай свой пример на сложение.')+' Введи два неотрицательных целых слагаемых и их сумму через точку с запятой.';
      const entry=step(prompt,[left,right,left+right],'Сохрани числа из задания. Впиши свой выбор, затем сложи первые два числа и проверь третье.');entry.answerFormat='v5-triple';entry.columnRules=c[i];steps.push(entry);
    }
    const s=c[4][2],a=Math.floor(s/2);
    return {prompt:'Для столбца 5 придумай два слагаемых с указанной суммой и проверь своё равенство. Введи два неотрицательных целых слагаемых и их сумму через точку с запятой. В разборе можно заполнить все восемь столбцов.',inputPrompt:'Первое слагаемое; второе слагаемое; сумма',answer:[a,s-a,s],answerFormat:'v5-triple',columnRules:c[4],steps,errors:[],table:{caption:'Два слагаемых и сумма. Для телефона каждый столбец учебника показан отдельной строкой',headers:['№','1-е','2-е','Сумма'],rows:c.map((col,i)=>[i+1,...col.map(n=>n??'—')]),columnWidths:[12,25,25,38]},data:{columns:c},conditionKey:JSON.stringify(c)};
  }
  function arithmetic(seed,random,step){
    const rows=seed?Array.from({length:6},(_,i)=>{
      const op=i%2?'−':'+',a=random(42,78),b=random(12,37),v=op==='+'?a+b:a-b;
      return [a,op,b,v];
    }):[[19,'+',27,36],[37,'−',19,16],[27,'+',42,69],[74,'−',56,18],[49,'+',32,71],[49,'−',32,17]];
    if(seed){
      const indices=[0,1,2,3,4,5];for(let i=5;i>0;i--){const j=random(0,i);[indices[i],indices[j]]=[indices[j],indices[i]];}
      for(const i of indices.slice(0,random(2,4)))rows[i][3]+=[-10,-2,2,10][random(0,3)];
    }
    const letters=['а','б','в','г','д','е'],wrong=[];
    const steps=rows.map(([a,op,b,given],i)=>{
      const value=op==='+'?a+b:a-b;if(value!==given)wrong.push(i+1);
      const tens=Math.floor(b/10)*10,ones=b%10,t=op==='+'?a+tens:a-tens;
      return step(letters[i]+'. Закрой правую часть. Вычисли '+a+' '+op+' '+b+' и запиши верное значение.',value,'Сначала '+a+' '+op+' '+tens+' = '+t+'. Теперь выполни '+t+' '+op+' '+ones+'. Сравни с правой частью.',value===given?[]:[{value:given,text:'Это значение справа в исходной записи. Проверь действие по частям: сначала десятки второго числа, потом единицы.'}]);
    });
    return {prompt:'Какие строки нужно исправить? Проверь все шесть равенств и перечисли только номера неверных строк через точку с запятой, в любом порядке.',inputPrompt:'Номера ошибочных равенств',answer:wrong,answerFormat:'unordered',steps,errors:[],table:{caption:'Записи для проверки',headers:['№','Равенство'],rows:rows.map(([a,op,b,g],i)=>[(i+1)+' ('+letters[i]+')',a+' '+op+' '+b+' = '+g])},data:{calculations:rows},conditionKey:JSON.stringify(rows)};
  }
  const generators={'1.3':schedule,'1.4':columns,'1.5':arithmetic};
  const bounds={'1.3':{day0:[0,3,0],day1:[0,3,0],day2:[0,3,0]},'1.4':{column:[0,7,4],left:[0,120,20],right:[0,120,10]},'1.5':{row:[0,5,0]}};
  function fields(input,M){const tokens=String(input).split(';');if(tokens.length!==3)return null;const nums=tokens.map(token=>M.parse(token));if(nums.some(v=>!v||v.d!==1||!Number.isSafeInteger(v.n)))return null;return nums.map(v=>v.n);}
  function columnFits(values,given){return values&&values.every(n=>n>=0)&&values[0]+values[1]===values[2]&&given.every((n,i)=>n===null||n===values[i]);}
  function mistake(input,target,M){
    const values=fields(input,M);if(!values)return '';
    if(target.columnRules){
      if(values.some(n=>n<0))return 'Здесь заполняем таблицу неотрицательными целыми числами. Проверь знаки.';
      if(target.columnRules.some((n,i)=>n!==null&&n!==values[i]))return 'В исходной таблице уже записано число. Сохрани его именно на своём месте.';
      if(values[0]+values[1]!==values[2])return 'Выбранные слагаемые можно оставить. Заново сложи первые два числа и поправь сумму.';
    }
    if(target.scheduleRules){
      if(new Set(values).size!==3)return 'Один кружок назначен дважды. Нужно посетить каждый из трёх по одному разу.';
      if(values.some((n,d)=>n<1||n>3||target.scheduleRules.forbidden[n-1]===d+1))return 'Один из кружков в выбранный день не работает. Проверь коды в строке этого дня.';
    }
    return '';
  }
  function explore(lesson,state,task,table){
    const data=task.data;
    if(lesson.number==='1.3'){
      const picked=[state.day0,state.day1,state.day2],valid=new Set(),notes=[];
      const rows=data.days.map((day,d)=>{const n=picked[d];let note;if(!n)note='ещё не выбран';else if(data.forbidden[n-1]===d+1)note='в этот день не работает';else if(valid.has(n))note='уже был в плане';else {note='подходит';valid.add(n);}notes.push(note);return [shortDay[day],n?data.clubs[n-1]+' — '+note:note];});
      const choices=[[0,'Не выбран'],...data.clubs.map((name,i)=>[i+1,name])];
      return {title:'Проверяем свой план занятий',controls:data.days.map((day,i)=>({key:'day'+i,title:day,values:choices})),visual:table('Твой выбор по дням',['День','План'],rows),question:'Сколько разных кружков из этого плана удастся посетить в подходящие дни?',answer:valid.size,why:'Подходящий день и новый кружок: '+notes.filter(s=>s==='подходит').length+'. Недоступный или повторный выбор не добавляет занятия.'};
    }
    if(lesson.number==='1.4'){
      const col=data.columns[state.column],a=col[0]??state.left,b=col[1]??state.right;
      const controls=[{key:'column',title:'Столбец учебника',values:data.columns.map((_,i)=>[i,i+1])}];
      if(col[0]===null)controls.push({key:'left',title:'Твой выбор первого слагаемого',min:0,max:120,step:1});
      if(col[1]===null)controls.push({key:'right',title:'Твой выбор второго слагаемого',min:0,max:120,step:1});
      return {title:'Проверяем выбранные слагаемые',controls,visual:table('Условия и твой выбор',['Что известно','Число'],[['Первое слагаемое',a],['Второе слагаемое',b],['Сумма из условия',col[2]??'можно вычислить']]),question:'Чему равна сумма выбранных слагаемых?',answer:a+b,why:a+' + '+b+' = '+(a+b)+'. '+(col[2]===null?'Эту сумму можно вписать в пустую клетку.':col[2]===a+b?'Сумма совпала с указанной в условии.':'Чтобы получить заданную сумму '+col[2]+', измени одно из свободных слагаемых.')};
    }
    const [a,op,b,given]=data.calculations[state.row],tens=b-b%10,starter=op==='+'?a+tens:a-tens,value=op==='+'?a+b:a-b;
    return {title:'Проверяем вычисление по разрядам',controls:[{key:'row',title:'Строка',values:data.calculations.map((_,i)=>[i,i+1])}],visual:table('Два действия вместо одного',['Шаг','Действие'],[['Десятки',a+' '+op+' '+tens],['Единицы',starter+' '+op+' '+b%10],['В записи справа',given]]),question:'Какое значение даёт левая часть?',answer:value,why:a+' '+op+' '+b+' = '+value+'. '+(value===given?'Запись верна, исправление не требуется.':'Именно на это число надо заменить '+given+'.')};
  }
  const api={lessons,generators,bounds,fields,columnFits,mistake,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5NumberedTables=api;
})(typeof window!=='undefined'?window:globalThis);
