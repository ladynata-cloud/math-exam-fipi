/* Five individual exercises at the end of point 1, part 1 (2023), printed p. 11. */
(function(root){
  'use strict';
  const source=[
    ['1.9','Четыре занятия без пересечений','Сопоставь каждому дню ровно одно занятие, не повторяя ни одного. Рассмотри все варианты для первого дня. У каждого следующего выбора проверь и расписание, и уже занятые занятия.',['Пусть в первый день доступны хор и шахматы. Раздели поиск на две ветки.','Запиши первое занятие и вычеркни его из оставшихся строк. Ищи день с единственным свободным вариантом.','Вернись к другой ветке. Если оба первых выбора разобраны и всё дальнейшее определилось, других планов нет.'],'Достаточно подобрать доступный кружок для каждого дня, даже если один из них повторится.','Чем доказать, что ни одно подходящее расписание не потерялось?'],
    ['1.10','Какие буквы чаще встречаются в одном тексте?','Для пересчёта в своей книге открой текст №1.20 на с. 13. Здесь считаем также вводную фразу перед цитатой. Разбей текст на части, ставь отметку за каждую нужную букву и складывай частоты одной буквы. На экране есть частичные подсчёты для проверки.',['В авторской строке «Лина шла» две буквы а и две буквы л. Заглавная Л считается так же, как строчная л.','Если добавить строку «Лампа», у а будет ещё две отметки, у л — одна.','Частоты меняются с текстом. Для утверждения обо всех русских текстах одного отрывка мало.'],'Самая частая буква одного отрывка обязательно лидирует в каждой книге.','Как изменится подсчёт, если взять только цитату без вводной фразы?'],
    ['1.11','Сколько зерна привезли за два дня?','За второй день известно, на сколько меньше зерна привезли. Сначала восстанови массу второй партии, а затем сложи обе партии.',['Пусть в понедельник привезли 45 т, а во вторник на 6 т меньше. Второй отрезок короче первого на 6 т.','Во вторник привезли 45 − 6 = 39 т.','Всего 45 + 39 = 84 т. Проверка другим способом: 2 × 45 − 6 = 84 т.'],'Уменьшение во второй день и есть масса второй партии.','Почему из удвоенной первой массы убирают разность только один раз?'],
    ['1.12','Сколько весят четыре овоща?','Масса одного овоща задана через разность с другим. Отдельно найди её и массу трёх одинаковых овощей, а затем сложи результаты.',['Три одинаковых корнеплода весят по 140 г. Овощ другого вида на 25 г легче одного корнеплода, значит, весит 115 г.','Три корнеплода весят 3 × 140 = 420 г.','Вся покупка весит 420 + 115 = 535 г. Получилось чуть меньше 4 × 140 г.'],'Чтобы найти массу покупки, достаточно вычесть разность из массы трёх помидоров.','Как получить тот же ответ, если сначала считать все четыре овоща одинаковыми?'],
    ['1.13','Восемь вычислений с проверкой порядка','Прочитай выражение целиком. Сначала вычисли значение в скобках. Вне скобок умножение и деление выполняй до сложения и вычитания. Для одиночного действия подойдёт обратная проверка.',['В отдельном примере 32 × 15 − 20 сначала получаем 480, затем вычитаем 20 и получаем 460.','В записи (72 + 24) : 12 сначала получаем 96, затем 8.','Проверка последнего деления: 8 × 12 = 96. Это именно результат в скобках.'],'Любое выражение без учёта скобок можно вычислять строго слева направо.','Как заметить случайную ошибку при делении многозначного числа?']
  ];
  const lessons=source.map(([number,title,explanation,worked,misconception,reflect])=>({number,key:'printed-'+number.replace('.','-'),page:11,title,explanation,worked,misconception,reflect}));
  const dayNames=['Пн','Вт','Чт','Сб'],wordDays=['понедельник','вторник','четверг','суббота'];
  function shuffle(values,random){const items=[...values];for(let i=items.length-1;i>0;i--){const j=random(0,i);[items[i],items[j]]=[items[j],items[i]];}return items;}
  function allPlans(available,plan=[]){
    if(plan.length===available.length)return [plan];
    return available[plan.length].filter(n=>!plan.includes(n)).flatMap(n=>allPlans(available,[...plan,n]));
  }
  function timetable(seed,random,step){
    const names=seed?shuffle(['Фотокружок','Театр','Волейбол','Керамика'],random):['Шахматы','Робототехника','Брейк-данс','Плавание'];
    const codes=seed?shuffle([1,2,3,4],random):[1,2,3,4],base=[[0,2],[2,3],[0,1],[1,3]];
    const available=(seed?shuffle(base,random):base).map(pair=>pair.map(i=>codes[i]).sort((a,b)=>a-b));
    const plans=allPlans(available),steps=plans.map(plan=>{
      const t=step('В понедельник выбери занятие '+plan[0]+'. Найди оставшиеся три. Введи коды для Пн, Вт, Чт, Сб через точку с запятой.',plan,'Вычеркни выбранное занятие в остальных днях. В строке с единственным свободным вариантом сделай следующий выбор.');
      t.answerFormat='v5-list';t.weekRules=available;t.clarifications=[{value:plans.find(other=>other!==plan),text:'Это полноценное расписание для другой ветки. Теперь закрепи в понедельник код '+plan[0]+' и дострой второй вариант.'}];return t;
    });
    steps.push(step('Сколько полных вариантов получилось после проверки обоих первых выборов?',plans.length,'Сравни варианты для понедельника и проверь, остаётся ли ещё выбор после него.'));
    return {prompt:'Предложи расписание на всю неделю. Посети все четыре разных занятия по одному разу. Введи четыре кода по строкам дней через точку с запятой.',inputPrompt:'Коды для Пн; Вт; Чт; Сб',answer:plans[0],alternatives:plans.slice(1),answerFormat:'v5-list',weekRules:available,steps,errors:[],data:{available,names},table:{caption:'Каждый день можно выбрать ровно один из показанных кружков',headers:['День','Доступные занятия'],rows:available.map((pair,i)=>[dayNames[i],pair.map(n=>n+' — '+names[n-1]).join(', ')])},conditionKey:JSON.stringify([available,names])};
  }
  const letters=['а','н','ы','ш','л','и'];
  // Rows are independent counts from the supplied page. The original text is not reproduced.
  const bookCounts=[[3,0,0,1,1,4],[9,7,2,1,5,1],[2,4,1,1,5,5],[7,4,3,0,3,6],[7,2,1,1,7,4],[6,5,2,0,7,9]];
  const phrases=['На полке лежали шишки.','У высокой ели выросли ландыши.','Мила искала синие камни.','На льдину упала снежинка.','Шины тихо шуршали.','Лодка качалась на волнах.','На лугу летали шмели.','Ира нашла ключи.','Мы вышли на лужайку.','Лисы оставили следы.','Нина шла по тропе.','Мыши нашли лимон.'];
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const groupedCounts=rows=>letters.map((_,i)=>sum(rows.map(row=>row[i])));
  function letterTask(seed,random,step){
    const texts=seed?shuffle(phrases,random).slice(0,6):null;
    const rows=texts?texts.map(t=>letters.map(c=>[...t.toLowerCase()].filter(x=>x===c).length)):bookCounts.map(row=>[...row]);
    const groups=texts?texts.map((_,i)=>'Строка '+(i+1)):['Вводная фраза','Предложение 1','Предложение 2','Предложение 3','Предложение 4','Предложение 5'];
    const totals=groupedCounts(rows),bodyOnly=groupedCounts(rows.slice(1));
    const steps=letters.map((letter,i)=>{
      const t=step('Сколько раз встретилась буква «'+letter+'» во всех шести частях?',totals[i],'Посчитай каждое вхождение, включая заглавные. Сложи частичные частоты для этой буквы во всех шести строках.');
      if(!seed&&bodyOnly[i]!==totals[i])t.clarifications=[{value:bodyOnly[i],text:'Это верная частота для цитаты. В нашем подсчёте участвует и вводная фраза перед ней. Добавь буквы из первой строки.'}];return t;
    });
    const high=Math.max(...totals),winners=totals.flatMap((v,i)=>v===high?[i+1]:[]);
    const t=step('Коды букв: 1 — а, 2 — н, 3 — ы, 4 — ш, 5 — л, 6 — и. Какие из них встречаются чаще всего? Укажи все коды через точку с запятой.',winners,'Найди наибольшую частоту среди шести букв. Проверь, скольким буквам она принадлежит.');t.answerFormat='unordered';steps.push(t);
    steps.push(step('Можно ли по одному отрывку доказать, что те же буквы самые частые во всех русских текстах? Введи 1 для «можно», 0 для «данных пока недостаточно».',0,'Вывод о частоте пока относится только к исследованным строкам. В другом тексте слова и частоты могут отличаться.',[{value:1,text:'В одном коротком предложении может повторяться другая буква. Для общего вывода понадобятся многие разные тексты.'}]));
    const table=texts?{caption:'Шесть авторских строк для самостоятельного подсчёта',headers:['Строка','Текст'],rows:texts.map((text,i)=>[i+1,text])}:{caption:'Помощь при работе по книге. Частоты в порядке «вводная фраза, затем пять предложений №1.20 на с. 13».',headers:['Буква','Число вхождений по частям'],rows:letters.map((c,i)=>[c,rows.map(row=>row[i]).join(', ')])};
    return {prompt:'Составь частотную таблицу. Введи шесть частот в порядке а; н; ы; ш; л; и. В разборе сравни частоты и проверь, какие выводы позволяет этот текст.',inputPrompt:'Шесть частот в порядке а; н; ы; ш; л; и',answer:totals,answerFormat:'v5-list',steps,errors:[],clarifications:seed?[]:[{value:bodyOnly,text:'Ты правильно посчитал цитату. Для всего задания №1.20 добавь ещё вводную строку перед ней.'}],data:{rows,groups,texts},table,conditionKey:JSON.stringify(rows)};
  }
  function weights(kind,seed,random,step){
    const grain=kind==='1.11',unit=grain?'т':'г';
    const one=seed?(grain?random(48,185):random(13,35)*10):(grain?108:270),less=seed?(grain?random(4,19):random(2,8)*5):(grain?8:20);
    const smaller=one-less,count=grain?1:3,total=one*count+smaller;
    const find=step(grain?'Сколько тонн привезли во второй день?':'Сколько граммов весит один огурец?',smaller,'Из большей массы вычти разность. Проверь, что ответ меньше исходной массы.',[{value:less,text:'Это на сколько меньше. Требуется сама масса, которая остаётся после вычитания.'},{value:one+less,text:'Слово «меньше» указывает, что новая масса должна быть ниже известной.'}]);
    const steps=[find];
    if(!grain)steps.push(step('Сколько граммов весят три помидора?',3*one,'Каждый из трёх помидоров имеет одну и ту же массу. Умножь её на три.',[{value:one+3,text:'Три — количество овощей. Три одинаковые массы берём умножением.'}]));
    const missing=grain?'Второй день':'Огурец',first=grain?'Первый день':'Один помидор';
    steps.push(step(grain?'Сколько тонн составляют обе партии вместе?':'Сколько граммов весят три помидора и один огурец вместе?',total,'Сложи обе найденные массы. Единица у всех слагаемых одна и та же.',[{value:smaller,text:'Это только меньшая масса. Прибавь к ней массу '+(grain?'первого дня.':'трёх помидоров.')},{value:(count+1)*one,text:'Только одна масса отличается от большей. Учти её уменьшение на '+less+' '+unit+'.'}]));
    return {prompt:grain?'Первая партия зерна весила '+one+' т. На следующий день привезли на '+less+' т меньше. Какова масса двух партий вместе?':'Один помидор весит '+one+' г. Огурец легче одного помидора на '+less+' г. Какова масса трёх помидоров и одного огурца?',inputPrompt:grain?'Общая масса в тоннах':'Общая масса в граммах',answer:total,steps,errors:steps.at(-1).errors,table:{caption:'Известные величины и связь',headers:['Что сравниваем','Масса'],rows:[[first,one+' '+unit],[missing,'на '+less+' '+unit+' меньше']]},data:{grain,unit,one,less,count,smaller},conditionKey:[one,less].join('/')};
  }
  function calculations(seed,random,step){
    const a=seed?[random(230,780),random(150,640)]:[745,476],b=seed?[random(430,880),random(110,420)]:[472,398],div=seed?random(4,9):7,q=seed?random(204,508):406;
    const mult=seed?[random(120,420),random(13,35)]:[342,25],m=seed?[random(21,67),random(13,38),random(20,65)]:[47,24,39];
    const den=seed?random(8,16):12,quot=seed?random(30,94):70,extra=seed?random(11,38):15;
    const f=seed?random(13,35):24,sub=seed?random(150,396):276,diff=seed?random(24,83):51;
    const out=seed?random(13,36):25,answer=seed?random(22,49):33,left=seed?random(107,230):247;
    const cases=[
      [a[0]+' + '+a[1],a[0]+a[1],null,'Сложи разрядные единицы, не теряя перенос.'],
      [b[0]+' − '+b[1],b[0]-b[1],null,'Проверь разность сложением с вычитаемым.'],
      [(div*q)+' : '+div,q,null,'Найди частное и проверь умножением на делитель.'],
      [mult[0]+' · '+mult[1],mult[0]*mult[1],null,'Разложи второй множитель на десятки и единицы, затем сложи частичные произведения.'],
      [m[0]+' · '+m[1]+' − '+m[2],m[0]*m[1]-m[2],m[0]*m[1],'Сначала перемножь два числа. Из произведения вычти последнее число.'],
      [(den*quot)+' : '+den+' + '+extra,quot+extra,quot,'Сначала найди частное и только затем добавь слагаемое.'],
      [f+' · ('+(sub+diff)+' − '+sub+')',f*diff,diff,'Сначала вычисли разность в скобках. Умножь на неё первый множитель.'],
      ['('+left+' + '+(out*answer-left)+') : '+out,answer,out*answer,'Сначала сложи числа в скобках. Раздели полученную сумму.']
    ];
    const labels=['а','б','в','г','д','е','ж','з'],steps=cases.map(([expr,result,first,hint],i)=>step(labels[i]+'. Вычисли '+expr+'.',result,hint,first===null?[]:[{value:first,text:'Это верный промежуточный результат. У выражения осталось ещё одно действие.'}]));
    return {prompt:'Вычисли последние два выражения со скобками и введи ответы в порядке ж; з. В разборе отдельно проверь все восемь подпунктов.',inputPrompt:'Ответы ж; з',answer:cases.slice(-2).map(row=>row[1]),answerFormat:'v5-pair',steps,errors:[],table:{caption:'Восемь выражений задания',headers:['Подпункт','Выражение'],rows:cases.map((row,i)=>[labels[i],row[0]])},data:{cases,labels},conditionKey:cases.map(row=>row[0]).join('|')};
  }
  const generators={'1.9':timetable,'1.10':letterTask,'1.11':(seed,r,s)=>weights('1.11',seed,r,s),'1.12':(seed,r,s)=>weights('1.12',seed,r,s),'1.13':calculations};
  const bounds={'1.9':Object.fromEntries([0,1,2,3].map(i=>['day'+i,[0,4,0]])),'1.10':{letter:[0,5,0],parts:[1,6,1]},'1.11':{copies:[0,1,1],addsmall:[0,1,0]},'1.12':{copies:[0,3,1],addsmall:[0,1,0]},'1.13':{row:[0,7,0]}};
  function timetableMistake(input,target,M){
    if(!target.weekRules)return '';
    const cells=String(input).split(';');
    if(cells.length!==4)return 'Укажи по одному коду для каждого из четырёх дней. Разделяй коды точкой с запятой.';
    const values=cells.map(x=>M.parse(x)).map(x=>x?.d===1?x.n:null);
    if(values.some((n,i)=>!target.weekRules[i].includes(n)))return 'Один из выбранных кружков в этот день не работает. Проверь его код в строке дня.';
    if(new Set(values).size<4)return 'Каждый кружок нужно посетить ровно один раз. Один из кодов сейчас повторяется.';
    return '';
  }
  function explore(lesson,state,task,table){
    const d=task.data;
    if(lesson.number==='1.9'){
      const options=[[0,'Пока не решил'],...d.names.map((n,i)=>[i+1,n])],selected=new Set();
      const rows=d.available.map((allowed,i)=>{
        const choice=state['day'+i],ok=allowed.includes(choice)&&!selected.has(choice);
        const verdict=!choice?'не выбран':!allowed.includes(choice)?'в этот день занятия нет':selected.has(choice)?'уже посещён':'подходит';
        if(ok)selected.add(choice);
        return [dayNames[i],choice?d.names[choice-1]+' — '+verdict:verdict];
      });
      return {title:'Собери собственную неделю',controls:dayNames.map((_,i)=>({key:'day'+i,title:wordDays[i],values:options})),visual:table('Выбор по календарю',['День','Проверка'],rows),question:'Сколько разных занятий в выбранном плане стоит в подходящий день?',answer:selected.size,why:'Каждый подходящий день добавляет только ещё не выбранное занятие. В твоём расписании их '+selected.size+'.'};
    }
    if(lesson.number==='1.10'){
      const col=state.letter,n=state.parts,values=d.rows.slice(0,n).map(row=>row[col]);
      return {title:'Собери частоту из нескольких частей',controls:[{key:'letter',title:'Исследуемая буква',values:letters.map((letter,i)=>[i,letter])},{key:'parts',title:'Сколько первых частей объединить',min:1,max:6,step:1}],visual:table('Буква «'+letters[col]+'»',['Часть','Вхождений'],values.map((v,i)=>[d.groups[i],v])),question:'Сколько раз эта буква встретилась в выбранных частях вместе?',answer:sum(values),why:values.join(' + ')+' = '+sum(values)+'. Каждая отметка принадлежит одной части текста.'};
    }
    if(lesson.number==='1.13'){
      const [exp,result,first,hint]=d.cases[state.row],single=first===null;
      return {title:'Выбери выражение и проверь его первый результат',controls:[{key:'row',title:'Подпункт',values:d.labels.map((label,i)=>[i,label])}],visual:table('Твой выбор',['Подпункт','Запись'],[[d.labels[state.row],exp]]),question:single?'Чему равно выражение из одного действия?':'Какое число получится непосредственно после первого действия?',answer:single?result:first,why:hint+' '+(single?'Ответ ': 'Первый результат ')+(single?result:first)+'.'};
    }
    const {unit,one,count,smaller,grain}=d,copies=state.copies,add=state.addsmall,rows=[];
    for(let i=0;i<copies;i++)rows.push({name:grain?'Первый день':'Помидор '+(i+1),amount:one,small:false});
    if(add)rows.push({name:grain?'Второй день':'Огурец',amount:smaller,small:true});
    const controls=[{key:'copies',title:grain?'Включить первую партию':'Число помидоров',min:0,max:count,step:1},{key:'addsmall',title:grain?'Вторая партия':'Огурец',values:[[0,'Пока не включать'],[1,'Включить']]}];
    const bars=rows.map((r,i)=>'<text x="3" y="'+(24+i*36)+'" font-size="15">'+r.name+'</text><rect x="105" y="'+(8+i*36)+'" width="'+(125*r.amount/one)+'" height="20" fill="'+(r.small?'#a45c31':'#32705a')+'"/><text x="238" y="'+(24+i*36)+'" font-size="15">'+r.amount+'</text>').join('');
    const value=copies*one+add*smaller,visual=rows.length?'<svg class="v5q-mass-view" viewBox="0 0 287 '+(rows.length*36+4)+'" role="img" aria-label="Полосы массы: '+rows.map(r=>r.name+' '+r.amount+' '+unit).join(', ')+'">'+bars+'</svg>':'<p>Пока компоненты не выбраны.</p>';
    return {title:'Собери общую массу из отдельных полос',controls,visual:visual+'<p>Масса каждой полосы указана в '+(grain?'тоннах.':'граммах.')+'</p>',question:'Какова масса выбранных частей вместе, '+unit+'?',answer:value,why:(rows.length?rows.map(r=>r.amount).join(' + '):'Нет выбранных частей')+' = '+value+' '+unit+'.'};
  }
  const api={lessons,generators,bounds,explore,mistake:timetableMistake,allPlans};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5FirstPointEnd=api;
})(typeof window!=='undefined'?window:globalThis);
