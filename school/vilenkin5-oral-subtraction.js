/* All twenty-five calculations and the six independent subtraction columns, 2023, part 1, p. 24. */
(function(root){
  'use strict';
  const tables=typeof module!=='undefined'&&module.exports?require('./vilenkin5-numbered-tables.js'):root.Vilenkin5NumberedTables;
  const lessons=[
    {number:'1.102',key:'printed-1-102',title:'Пять групп устных вычислений',
      explanation:'Сначала назови действие и только потом выбирай приём. Для суммы или разности удобно дойти до круглого десятка. При умножении на нуль результат равен нулю. Для деления проверь, получится ли делимое обратным умножением.',
      worked:['К 46 прибавим 7: сначала 4 до круглого 50, потом ещё 3.','70 разделить на 10 — значит найти число десятков в 70. Проверка: 7 × 10 = 70.'],
      misconception:'Нуль при умножении никак не меняет первый множитель.',reflect:'В какой группе особенно важно различать знак умножения и знак деления?'},
    {number:'1.103',key:'printed-1-103',title:'Шесть столбцов таблицы вычитания',
      explanation:'В каждом столбце уменьшаемое равно сумме вычитаемого и разности. Два заданных числа определяют третье. При одном заданном числе можно подобрать несколько верных столбцов, сохраняя условие вычитания.',
      worked:['Если уменьшаемое 41 и разность 13, вычитаемое равно 28. Проверка: 28 + 13 = 41.','Если дана лишь разность 9, подходят и 20 − 11 = 9, и 14 − 5 = 9.'],
      misconception:'Для любой пустой клетки таблицы есть ровно один возможный ответ.',reflect:'Как изменить два числа в столбце, сохранив разность?'},
    {number:'1.104',key:'printed-1-104',title:'Объясняем устное деление и умножение',explanation:'Разложи число на удобные слагаемые. Если каждое слагаемое делится на одно и то же число без остатка, их сумму можно поделить по частям. При умножении сумму тоже можно умножать по частям.',worked:['У 156 : 12 удобно разложение 120 + 36. Получатся 10 и 3, вместе 13.'],misconception:'Достаточно применить действие только к первой удобной части числа.',reflect:'Как проверить, что при разложении сохранилось всё исходное число?'},
    {number:'1.105',key:'printed-1-105',title:'Когда сумма и разность равны?',explanation:'Чтобы доказать существование пары, достаточно предложить один пример и проверить оба действия. Если второе число положительно, сложение увеличивает первое число, а вычитание его уменьшает.',worked:['У 8 и 2 сумма 10, разность 6. Их различие равно двум вторым числам: 2 + 2.'],misconception:'У любых двух неотрицательных чисел сумма строго больше разности.',reflect:'Какое второе число сохраняет первое число в обоих действиях?'},
    {number:'1.106',key:'printed-1-106',title:'Сколько цифр в частном без деления?',explanation:'Найди две соседние степени десяти, между которыми лежит частное. Для этого умножай делитель на 10, 100, 1000 и сравнивай полученные границы с делимым.',worked:['У 532 : 7 делимое больше 70 и меньше 700. Поэтому частное от 10 до 99 и содержит две цифры.'],misconception:'Частное имеет столько же цифр, сколько делимое.',reflect:'Почему число, равное верхней границе, уже относится к следующему разряду?'}
  ].map(l=>({...l,part:1,point:4,page:24,requires:['v5f-printed-1-4'],related:['v5f-printed-1-5']}));
  const err=(value,text)=>({value,text}),select=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])});
  const source=[[[27,'+',3],[68,'+',2],[71,'+',9],[55,'+',5],[34,'+',26]],[[52,'−',7],[36,'−',9],[40,'−',6],[23,'−',8],[61,'−',4]],
    [[9,'×',8],[8,'×',7],[9,'×',9],[6,'×',8],[7,'×',0]],[[53,'×',10],[60,'÷',10],[80,'×',10],[1000,'÷',1000],[100,'×',100]],[[45,'÷',9],[64,'÷',8],[49,'÷',7],[30,'÷',6],[48,'÷',8]]];
  const calc=([a,op,b])=>op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:a/b;
  const show=([a,op,b])=>a+' '+op+' '+b;
  function createItems(r){
    const add=Array.from({length:5},(_,i)=>{const a=r(1,8)*10+r(1,9),b=10-a%10+(i===4?10*r(1,3):0);return [a,'+',b];});
    const minus=Array.from({length:5},()=>{const a=r(2,8)*10+r(0,5),b=r(a%10+1,9);return [a,'−',b];});
    const times=Array.from({length:5},(_,i)=>[r(3,9),'×',i===4?0:r(4,9)]);
    const power=10**r(2,3),round=[[r(12,69),'×',10],[r(3,15)*10,'÷',10],[r(2,12)*10,'×',10],[power,'÷',power],[10**r(1,2),'×',10**r(1,3)]];
    const divide=Array.from({length:5},()=>{const b=r(3,9);return [b*r(3,9),'÷',b];});
    return [add,minus,times,round,divide];
  }
  const explain={
    '+':'Дополни первое слагаемое до десятка. Если второе больше нужной добавки, прибавь остаток.',
    '−':'Дойди до предыдущего десятка. Вычти оставшуюся часть второго числа.',
    '×':'Проверь произведение по таблице или разложи один множитель на удобные слагаемые.',
    '÷':'Найди такое частное, которое при умножении на делитель даёт делимое.'};
  function concise(a,op,b){if(op==='×'&&!b)return 'Ноль одинаковых групп не содержит ни одного предмета.';if(op==='÷'&&a===b)return 'Сколько раз положительное число помещается само в себе?';return explain[op];}
  function mistakes(a,op,b){
    if(op==='+')return [err(Math.abs(a-b),'Здесь нужно сложить. Значение суммы должно превосходить каждое положительное слагаемое.')];
    if(op==='−')return [err(a+b,'При вычитании положительного числа результат меньше уменьшаемого.')];
    if(op==='×')return [err(a+b,b===0?'Сложение с нулём сохраняет число. Здесь спрашивается произведение.':'Ты сложил множители. Каждый множитель описывает группу или число одинаковых групп.')];
    return [err(a*b,'Проверяй частное обратным умножением. Произведение делимого и делителя не является частным.')];
  }
  function calculations(seed,r,step){
    const items=seed?createItems(r):source.map(col=>col.map(e=>e.slice())),steps=items.flatMap((col,i)=>col.map((e,j)=>step('абвгд'[i]+'. Строка '+(j+1)+'. Вычисли '+show(e)+'.',calc(e),concise(...e),mistakes(...e))));
    return {prefix:seed?'Новые авторские числа для пяти групп. ':'Все 25 выражений печатного номера. ',prompt:'Выпиши ответы последней строки слева направо, от а до д. Раздели пять чисел точкой с запятой.',inputPrompt:'Пять результатов',answer:items.map(col=>calc(col[4])),answerFormat:'v5-list',steps,errors:[],data:{oral:items},
      table:{caption:'Пять групп устного счёта',headers:['Группа','1','2','3','4','5'],rows:items.map((col,i)=>['абвгд'[i],...col.map(show)])},conditionKey:items.flat().map(show).join('/')};
  }
  const names=['Уменьшаемое','Вычитаемое','Разность'];
  function columns(seed,r,step){
    const src=seed?[[r(45,75),r(10,35),null],[r(41,69),null,r(10,33)],[null,r(20,49),r(15,35)],[r(40,78),null,null],[null,null,r(10,40)],[null,r(18,45),null]]:[[46,26,null],[37,null,27],[null,30,25],[63,null,null],[null,null,19],[null,33,null]];
    const steps=src.map((c,i)=>{let [a,b,v]=c;
      if(a==null){if(b==null)b=12;if(v==null)v=20;a=b+v;}else{if(b==null)b=v==null?Math.floor(a/2):a-v;v=a-b;}
      return {...step('Столбец '+(i+1)+'. Введи уменьшаемое, вычитаемое и разность через точку с запятой. Сохрани печатные числа.'+(i>=3?' Подбери свой допустимый вариант.':''),[a,b,v],'Проверь вычитание обратным действием: вычитаемое плюс разность даёт уменьшаемое.'),answerFormat:'v5-triple',subtractionColumn:c};
    });
    return {prefix:'Три строки в исходной таблице образуют в каждом столбце одно равенство. ',prompt:'Сколько из шести столбцов можно восстановить однозначно — без собственного выбора числа?',inputPrompt:'Число однозначных столбцов',answer:3,steps,
      errors:[err(6,'Посмотри на последние три столбца. В каждом дано только одно число, поэтому можно составить разные равенства.')],data:{subtract:src},table:{caption:'Шесть печатных столбцов: уменьшаемое минус вычитаемое равно разности',headers:['№','Равенство'],rows:src.map((col,i)=>[i+1,subtractionRow(col)])},conditionKey:src.flat().join('/')};
  }
  function mental(seed,r,step){
    const entries=seed?(()=>{const p=r(3,9),q=r(11,17),k=r(3,8);return [[p*30,p*10,'÷',p],[q*100,q*r(2,8),'÷',q],[r(2,5)*100,100,'×',r(3,9)],[100*r(3,8),r(2,7),'×',k]];})():[[240,80,'÷',8],[1300,26,'÷',13],[300,100,'×',7],[600,2,'×',6]];
    const steps=entries.flatMap(([a,b,o,d],i)=>[step('абвг'[i]+'. Разложим '+(a+b)+' на '+a+' и '+b+'. Чему равно '+show([a,o,d])+'?',calc([a,o,d]),'Сначала примени действие к первой удобной части.'),
      step('Теперь вычисли '+show([b,o,d])+'.',calc([b,o,d]),'Вторая часть обрабатывается тем же действием с тем же числом.'),
      step('Каков полный результат '+show([a+b,o,d])+'?',calc([a+b,o,d]),'Сложи два частичных результата: действие выполнено для каждой части числа.',[err(calc([a,o,d]),'Это результат только для первой части. Ещё нужно учесть вторую.')])]);
    return {prefix:'Четыре примера с объяснением устного приёма. ',prompt:'Запиши четыре полных результата по порядку а, б, в, г через точку с запятой.',inputPrompt:'Четыре результата',answer:entries.map(([a,b,o,d])=>calc([a+b,o,d])),answerFormat:'v5-list',steps,errors:[],data:{mental:entries},table:{caption:'Удобные части',headers:['№','Пример и разбиение'],rows:entries.map(([a,b,o,d],i)=>['абвг'[i],show([a+b,o,d])+'; '+(a+b)+' = '+a+' + '+b])},conditionKey:entries.flat().join('/')};
  }
  function witness(seed,r,step){
    const a=seed?r(8,25):12,b=seed?r(2,7):3,steps=[step('Для примера возьми '+a+' и '+b+'. Чему равна разность?',a-b,'От первого числа отними второе.'),step('Чему равна сумма этих же чисел?',a+b,'Прибавь второе к первому.'),step('На сколько сумма больше разности в этом примере?',2*b,'От разности верни вычтенное число, а для суммы прибавь его ещё раз.',[err(b,'До первого числа надо вернуть одно вычитаемое, а затем прибавить такое же число.')]),
      {...step('Предложи собственные два неотрицательных целых числа, у которых разность равна сумме. Введи первое и второе через точку с запятой.',[a,0],'При вычитании и сложении одного и того же второго числа результаты совпадут, когда это число ничего не меняет.'),answerFormat:'v5-pair',zeroWitness:true}];
    return {prefix:'Рассмотрим неотрицательные целые числа. ',prompt:'Существуют ли два числа с одинаковыми суммой и разностью? После собственного примера введи да или нет.',inputPrompt:'Да или нет',answer:'да',answerFormat:'v5-check-word',steps,errors:[err('нет','Среди допустимых чисел есть нуль. Проверь его как второе число.')],data:{sumDifference:{a,b}},table:{caption:'Одна пара, два действия',headers:['Числа','Что сравнить'],rows:[[a+' и '+b,'Разность и сумму'],[a+' и 0','Что меняет нуль?']]},conditionKey:a+'/'+b};
  }
  function digitsInQuotient(n,d){let k=1,lower=d;while(lower*10<=n){lower*=10;k++;}return k;}
  function quotient(seed,r,step){
    const entries=seed?Array.from({length:4},()=>{const d=r(3,69),digits=r(2,4),q=r(10**(digits-1),10**digits-1);return [q*d,d];}):[[972,6],[3100,25],[11514,38],[608328,63]];
    const digits=entries.map(([n,d])=>digitsInQuotient(n,d)),steps=entries.flatMap(([n,d],i)=>{const pow=10**(digits[i]-1);return [
      step('абвг'[i]+'. Для '+n+' : '+d+' сравним делимое с круглыми кратными. Чему равно '+d+' × '+pow+'?',d*pow,'Умножение на целую степень десяти добавляет справа соответствующее число нулей.'),
      step('Каково следующее в десять раз большее круглое кратное: '+d+' × '+(10*pow)+'?',10*pow*d,'Это верхняя граница. Сравни с ней делимое.'),
      step('Сколько цифр у целого частного '+n+' : '+d+'? Само частное вычислять не требуется.',digits[i],'Частное не меньше '+pow+' и меньше '+(10*pow)+'. Сосчитай цифры у нижней границы.',digits[i]===String(n).length?[]:[err(String(n).length,'Ты сосчитал цифры делимого. Нужно оценить число цифр у частного.')])];});
    return {prefix:'Оцени разрядность без выполнения деления. ',prompt:'Запиши число цифр в частном для четырёх подпунктов по порядку. Раздели ответы точкой с запятой.',inputPrompt:'Четыре количества цифр',answer:digits,answerFormat:'v5-list',steps,errors:[],data:{quotients:entries},table:{caption:'Четыре деления для оценки',headers:['№','Деление'],rows:entries.map(([n,d],i)=>['абвг'[i],n+' : '+d])},conditionKey:entries.flat().join('/')};
  }
  function exploreReasoning(s,t,table){
    if(t.data.mental){const [a,b,op,d]=t.data.mental[s.item],parts=[a,b,a+b];return {title:'Разбери пример на две части',controls:[select('item','Подпункт',Array.from('абвг')),select('piece','Что вычислить',['Первая часть','Вторая часть','Весь пример'])],visual:table('Раскладываем первое число',['Первое число','Первая часть','Вторая часть'],[[a+b,a,b]]),question:show([parts[s.piece],op,d])+' — сколько?',answer:calc([parts[s.piece],op,d]),why:'Одинаковое действие с обеими частями позволяет сложить их результаты.'};}
    if(t.data.sumDifference){const a=s.left,b=s.right,exceeds=b>a,controls=[{key:'left',title:'Первое число',min:0,max:50,step:1},{key:'right',title:'Второе число',min:0,max:50,step:1},select('ask','Что сравнить',['Сумму','Разность','Разрыв между суммой и разностью'])];
      return {title:'Ищи пару с равными результатами',controls,visual:table('Выбранные числа',['Первое','Второе'],[[a,b]]),question:exceeds?'На сколько второе число превышает первое? Потом подбери первое не меньше второго.':['Чему равна сумма?','Чему равна разность?','На сколько сумма превосходит разность?'][s.ask],answer:exceeds?b-a:[a+b,a-b,2*b][s.ask],why:exceeds?'Такой порядок потребовал бы отрицательной разности.':'Сумма и разность расходятся на удвоенное второе число.'};}
    const [n,d]=t.data.quotients[s.item],pow=10**s.power,lo=d*pow,hi=10*lo,yes=n>=lo&&n<hi;
    return {title:'Подбери две границы частного',controls:[select('item','Подпункт',Array.from('абвг')),select('power','Проверяемый нижний предел',['1','10','100','1000','10 000'])],visual:table('Сравни делимое с границами',['Нижняя','Делимое','Верхняя'],[[lo,n,hi]]),question:'Попало ли делимое в промежуток от нижней границы включительно до верхней не включительно? 1 — да, 0 — нет.',answer:Number(yes),why:yes?'Частное имеет столько же цифр, сколько '+pow+'.':'Проверь соседнюю степень десяти и сравни делимое с двумя новыми границами.'};
  }

  function accepts(raw,t,M){if(t.zeroWitness){const v=String(raw).split(';').map(s=>M.parse(s));return v.length===2&&v.every(x=>x?.d===1&&x.n>=0)&&v[1].n===0;}const v=tables.fields(raw,M);return v&&tables.columnFits([v[1],v[2],v[0]],[t.subtractionColumn[1],t.subtractionColumn[2],t.subtractionColumn[0]]);}
  function mistake(raw,t,M){if(t.zeroWitness)return 'Проверь оба действия на своей паре. Положительное второе число при сложении увеличивает первое, а при вычитании уменьшает его.';const v=tables.fields(raw,M);if(!v)return '';const i=t.subtractionColumn.findIndex((n,i)=>n!==null&&n!==v[i]);if(i>=0)return 'В этом столбце уже дано число в строке «'+names[i]+'». Сохрани его на своём месте.';if(v.some(n=>n<0))return 'Для этой таблицы выбери целые неотрицательные числа.';return 'Сложи своё вычитаемое и разность. Сумма должна совпасть с первым числом.';}
  function subtractionRow(values){const [a,b,d]=values.map(n=>n??'□');return a+' − '+b+' = '+d;}
  function filled(t,scene,table){const cells=t.data.subtract;return table(t.table.caption,t.table.headers,cells.map((c,i)=>{const got=scene?.answers?.[i];return [i+1,subtractionRow(got?got.split(';').map(v=>v.trim()):c)];}));}

  function explore(l,s,t,table){
    if(t.data.mental||t.data.sumDifference||t.data.quotients)return exploreReasoning(s,t,table);
    if(t.data.oral){const e=t.data.oral[s.group][s.item],v=calc(e),sorted=t.data.oral[s.group].map((q,i)=>[i+1,show(q)]);return {title:'Выбери выражение для проверки',controls:[select('group','Группа',Array.from('абвгд')),select('item','Строка',['Первая','Вторая','Третья','Четвёртая','Пятая'])],visual:table('Текущая группа',['№','Выражение'],sorted),question:show(e)+' — чему равно?',answer:v,why:concise(...e)};}
    const col=t.data.subtract[s.col],[knownA,knownB,knownD]=col,entered=s.free;
    const b=knownB??(knownA!==null&&knownD!==null?knownA-knownD:entered),v=knownD??(knownA!==null?knownA-b:entered),a=knownA??b+v,values=[a,b,v],chosen=s.ask;
    const controls=[select('col','Печатный столбец',['Первый','Второй','Третий','Четвёртый','Пятый','Шестой'])];
    if(s.col>=3)controls.push({key:'free',title:s.col===5?'Выбери свою разность':'Выбери своё вычитаемое',min:0,max:80,step:1});
    controls.push(select('ask','Что восстановить',names));
    if(v<0)return {title:'Проверь выбранное вычитаемое',controls,visual:table('Выбранные числа',['Строка','Число'],[[names[0],a],[names[1],b]]),question:'На сколько выбранное вычитаемое превысило уменьшаемое? После проверки подбери меньшую величину.',answer:-v,why:'Чтобы получить неотрицательную разность, выбери вычитаемое от нуля до '+a+'.'};
    return {title:'Собери допустимый столбец',controls,
      visual:table('Равенство вычитания',['Строка','Данные'],names.map((n,i)=>[n,i===chosen?'Найди':values[i]])),question:'Каково число в строке «'+names[chosen]+'»?',answer:values[chosen],why:'Равенство: '+a+' − '+b+' = '+v+'. При заданных числах выполняется обратная проверка '+b+' + '+v+' = '+a+'.'};
  }
  const api={lessons,generators:{'1.102':calculations,'1.103':columns,'1.104':mental,'1.105':witness,'1.106':quotient},bounds:{'1.102':{group:[0,4,0],item:[0,4,0]},'1.103':{col:[0,5,0],free:[0,80,12],ask:[0,2,2]},'1.104':{item:[0,3,0],piece:[0,2,0]},'1.105':{left:[0,50,12],right:[0,50,3],ask:[0,2,0]},'1.106':{item:[0,3,0],power:[0,4,1]}},accepts,mistake,filled,explore,calc,digitsInQuotient};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5OralSubtraction=api;
})(typeof window!=='undefined'?window:globalThis);
