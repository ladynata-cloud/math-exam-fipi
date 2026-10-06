/* Managed foundations, adapted from the site's Vilenkin 5/6 work.
 * Every diagram uses the current task's numbers; all answers are exact integers. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,variantsPerMode=120,count=360;
const families=[
 {id:'pre7-place-value',title:'Разряды числа и важные нули',gap:'order',idea:'Разряд задаёт вес цифры. Ноль сохраняет место пустого разряда: его нельзя просто убрать из записи.'},
 {id:'pre7-natural-compare',title:'Сравниваем натуральные числа',gap:'order',idea:'Сначала сравни количество цифр. При одинаковой длине двигайся слева направо до первого различия.'},
 {id:'pre7-add-carry',title:'Сложение с переносом разряда',gap:'order',idea:'Единицы складываем с единицами. Каждые десять единиц разряда заменяем одной единицей следующего разряда.'},
 {id:'pre7-subtract-borrow',title:'Вычитание с разменом через нули',gap:'order',idea:'Если единиц не хватает, размени соседний старший разряд. Через нули размен выполняется последовательно, без изменения самого числа.'},
 {id:'pre7-smart-calculation',title:'Считаем удобным способом',gap:'order',idea:'Можно переставлять и группировать слагаемые, переносить часть между ними или распределять умножение. Значение выражения сохраняется.'},
 {id:'pre7-inverse-components',title:'Находим неизвестный компонент',gap:'equations',idea:'Сначала назови неизвестный компонент действия. Выбери обратное действие и проверь найденное число в исходном равенстве.'},
 {id:'pre7-divisibility',title:'Признаки делимости: замечаем закономерность',gap:'division',idea:'Для 2, 5 и 10 важна последняя цифра. Для 3 и 9 — сумма цифр. Признак проверяем для всего числа.'},
 {id:'pre7-scale-reading',title:'Шкала: деления и отметки',gap:'reading',idea:'Цена деления равна разности подписанных значений, делённой на число промежутков. Считай промежутки, а не риски.'},
 {id:'pre7-comparison-stories',title:'Задачи: на сколько и во сколько',gap:'reading',idea:'«На сколько» сравнивает разностью, «во сколько» — частным. Сначала выясни, какое количество больше и какое требуется найти.'}
];
const ids=new Set(families.map(f=>f.id));
const S=(q,a,why)=>({q,a:String(a),why,strict:true});
function C(q,labels,correct,n,why){
 const shift=n%labels.length,order=labels.map((_,i)=>(i+shift)%labels.length);
 return {...S(q,order.indexOf(correct)+1,why),choices:order.map((v,i)=>({value:String(i+1),label:labels[v]}))};
}
const E=(id,label,description)=>({id,label,description});
function table(headers,rows,elements,rowIds){return {kind:'pre7-lab',diagram:{type:'table',description:'Выделяй части таблицы и сопоставляй их с условием. Подсказка к выбранной части поможет выполнить текущий шаг.',headers,rows:rows.map(row=>row.map(String)),...(rowIds?{rowIds}:{})},elements};}
function columns(a,b,sign){
 const width=Math.max(String(a).length,String(b).length),names=['Тысячи','Сотни','Десятки','Единицы'].slice(-width),rows=[[String(a),...String(a).padStart(width,'0')],[sign+' '+b,...String(b).padStart(width,'0')]];
 return table(['Число',...names],rows,names.map((name,i)=>E('cell-0-'+(i+1),name,'В этом столбце записаны единицы одного разряда. Сопоставь его с тем же столбцом второй строки.')));
}
function numberModel(value){
 const ds=String(value).padStart(4,'0').split(''),names=['Тысячи','Сотни','Десятки','Единицы'];
 return table(['Разряд',...names],[['Цифра',...ds]],names.map((name,i)=>E('cell-0-'+(i+1),name,`Размер этого разряда в обычных единицах: ${10**(3-i)}. Пустой разряд обозначают нулём.`)));
}
function make(q,answer,steps,params,model){
 const final=steps.at(-1),choices=final.choices&&String(final.a)===String(answer)?final.choices.map(c=>({...c})):null;
 return {q,answer,a:String(answer),answerExact:String(answer),steps,params,model,strict:true,...(choices?{choices}:{})};
}
function placeValue(n,mode){
 const thousands=1+n%9,tens=1+Math.floor(n/9)%9,units=Math.floor(n/81)+2;
 const value=1000*thousands+10*tens+units;
 if(mode===0){
  const position=n%4,weights=[1000,100,10,1],digits=[thousands,0,tens,units],names=['тысяч','сотен','десятков','единиц'];
  return make(`Каков вклад цифры в разряде ${names[position]} числа ${value}?`,digits[position]*weights[position],[
   S(`Сколько единиц содержит один разряд ${names[position]}?`,weights[position],'Веса разрядов справа налево: 1, 10, 100, 1000.'),
   S(`Какая цифра стоит в разряде ${names[position]}?`,digits[position],'Найди нужный столбец таблицы. Нулевая цифра тоже занимает место.'),
   S('Чему равен вклад этой цифры в число?',digits[position]*weights[position],'Умножь цифру на вес её разряда. Вклад нулевой цифры равен нулю.')
  ],{mode,value,position},numberModel(value));
 }
 if(mode===1){
  const hundreds=1+Math.floor(n/9)%9,value2=1000*thousands+100*hundreds+units;
  return make(`Запиши число: ${thousands} тыс., ${hundreds} сот., 0 дес. и ${units} ед.`,value2,[
   S('Какой вклад дают тысячи?',thousands*1000,'Количество тысяч умножаем на 1000.'),
   S('Какой вклад дают сотни?',hundreds*100,'Количество сотен умножаем на 100.'),
   S('Какая цифра должна стоять в разряде десятков?',0,'Десятков нет. Ноль удерживает их место, чтобы единицы не стали десятками.'),
   S('Собери и запиши всё число.',value2,'Сложи вклады разрядов или запиши цифры подряд, сохранив ноль.')
  ],{mode,thousands,hundreds,units},table(['Тысячи','Сотни','Десятки','Единицы'],[[thousands,hundreds,0,units]],[E('cell-0-0','Тысячи','Тысяча в десять раз больше сотни.'),E('cell-0-2','Пустые десятки','Отсутствие десятков сохраняется нулём, а не удалением столбца.')]));
 }
 const center=(10+n)*100,previousNumber=center-1,nextNumber=center+1,previousWanted=n%2===0;
 return make(`Найди ${previousWanted?'предыдущее':'следующее'} натуральное число для ${center}.`,previousWanted?previousNumber:nextNumber,[
  S('На сколько отличаются соседние натуральные числа?',1,'У соседей в натуральном ряду между числами нет других натуральных чисел.'),
  S(`Какое число непосредственно перед ${center}?`,previousNumber,'Вычти одну единицу. Если в младших разрядах нули, выполни размен старшего разряда.'),
  S(`Какое число непосредственно после ${center}?`,nextNumber,'Прибавь ровно одну единицу, сохранив остальные разряды.'),
  S('Запиши ответ именно на вопрос условия.',previousWanted?previousNumber:nextNumber,'Ещё раз проверь слово «предыдущее» или «следующее».')
 ],{mode,center,previousWanted},table(['Шаг','Что происходит'],[['Назад на 1','Предыдущее число'],['Вперёд на 1','Следующее число']],[E('back','Назад','Один шаг назад означает вычесть единицу.'),E('forward','Вперёд','Один шаг вперёд означает прибавить единицу.')],['back','forward']));
}
function compare(n,mode){
 let left,right;
 if(mode===0){left=80+n;right=1000+7*n;if(n%2)[left,right]=[right,left];}
 else if(mode===1){const thousands=1+n%8,h=1+Math.floor(n/8)%7,tail=10+n;left=thousands*1000+h*100+tail%100;right=thousands*1000+(h+1)*100+(tail*3)%100;if(n%2)[left,right]=[right,left];}
 else{left=2000+7*n;right=left+(n%3-1);}
 const correct=left<right?0:left>right?1:2,relation=C('Выбери верное сравнение.',[`${left} < ${right}`,`${left} > ${right}`,`${left} = ${right}`],correct,n,'Первый отличающийся старший разряд определяет сравнение. Если все цифры одинаковы, числа равны.');
 const sameLength=String(left).length===String(right).length,steps=[S('Сколько цифр в первом числе?',String(left).length,'Натуральное число записано без ведущих нулей. Считай все его цифры.'),S('Сколько цифр во втором числе?',String(right).length,'Сначала сравниваем длину записи. Большее число разрядов означает большее натуральное число.')];
 if(sameLength){const index=[...String(left)].findIndex((digit,i)=>digit!==String(right)[i]);steps.push(S('На какой позиции слева цифры впервые различаются? Если различий нет, введи 0.',index+1,'Проверяй цифры слева направо. После первого различия младшие разряды уже не меняют результат.'));}
 steps.push(relation);
 return make(`Сравни натуральные числа ${left} и ${right}.`,Number(relation.a),steps,{mode,left,right},columns(left,right,'и'));
}
function addition(n,mode){
 const h=1+Math.floor(n/20),t=1+Math.floor(n/5)%4,u=6+n%4,bU=4+n%6;
 let left=100*h+10*t+u,right=10*(1+n%3)+bU;
 if(mode===1){left=100*h+80+u;right=20+10*(n%5)+bU;}
 if(mode===2){left=800+10*(4+Math.floor(n/10)%5)+u;right=200+10*Math.floor(n/6)+bU;}
 const sumUnits=left%10+right%10,carry1=Math.floor(sumUnits/10),sumTens=Math.floor(left/10)%10+Math.floor(right/10)%10+carry1,carry2=Math.floor(sumTens/10),sumHundreds=Math.floor(left/100)+Math.floor(right/100)+carry2;
 const steps=[S('Найди сумму единиц до переноса.',sumUnits,'Сложи только цифры в столбце единиц.'),S('Сколько десятков нужно перенести из единиц?',carry1,'Каждые десять единиц составляют один десяток.'),S('Какую цифру запишешь в разряде единиц ответа?',sumUnits%10,'После переноса в этом разряде остаётся меньше десяти единиц.'),S('Сколько десятков получится с учётом переноса?',sumTens,'Сложи цифры десятков и обязательно добавь перенесённый десяток.'),S('Сколько сотен переносится из десятков?',carry2,'Десять десятков заменяем одной сотней.'),S('Сколько сотен получится с учётом этого переноса?',sumHundreds,'К сотням обоих слагаемых прибавь перенос. Если сотен десять или больше, появится разряд тысяч.'),S('Запиши полную сумму.',left+right,'Собери все разряды, включая новую тысячу, если она появилась.')];
 return make(`Сложи столбиком: ${left} + ${right}.`,left+right,steps,{mode,left,right},columns(left,right,'+'));
}
function subtraction(n,mode){
 const h=3+Math.floor(n/20),u=n%4,bU=5+n%5;let left,right,steps;
 if(mode===0){const t=4+Math.floor(n/4)%5,bT=1+n%3;left=h*100+t*10+u;right=bT*10+bU;steps=[S('Сколько единиц будет после размена одного десятка?',u+10,'Один десяток превращается в десять единиц. Добавь прежние единицы.'),S('Сколько десятков останется после размена?',t-1,'Один десяток уже перешёл в единицы.'),S('Какую цифру единиц получит разность?',u+10-bU,'Теперь единиц достаточно для вычитания.'),S('Какую цифру десятков получит разность?',t-1-bT,'Вычитай из количества десятков, оставшегося после размена.')];}
 else if(mode===1){const bT=1+Math.floor(n/4)%8;left=h*100+u;right=bT*10+bU;steps=[S('Сколько сотен останется после размена одной сотни?',h-1,'Чтобы получить десятки при нулевом разряде, сначала разменяй одну сотню.'),S('Сколько десятков получится из одной сотни?',10,'Размеры соседних разрядов отличаются в десять раз.'),S('После размена одного из этих десятков в единицы сколько десятков останется?',9,'Один из десяти десятков передали единицам.'),S('Сколько единиц теперь доступно для вычитания?',u+10,'К прежним единицам прибавили десять.'),S('Какую цифру десятков получит разность?',9-bT,'Вычти цифру десятков второго числа из девяти оставшихся десятков.')];}
 else{const thousands=1+Math.floor(n/30),bH=1+Math.floor(n/5)%8,bT=n%5;left=thousands*1000+u;right=bH*100+bT*10+bU;steps=[S('Сколько тысяч останется после размена одной тысячи?',thousands-1,'Из тысячи получаем десять сотен. Если тысяч была одна, слева останется ноль тысяч.'),S('Сколько сотен останется, когда одну сотню передадим десяткам?',9,'Из десяти сотен одну разменяли на десять десятков.'),S('Сколько десятков останется после передачи одного десятка единицам?',9,'Из десяти десятков один стал десятью единицами.'),S('Сколько единиц теперь доступно для вычитания?',u+10,'Прежние единицы не исчезают: к ним прибавляем десять.'),S('Какую цифру сотен получит разность?',9-bH,'Вычитаем сотни из девяти сотен, оставшихся после размена.')];}
 steps.push(S('Запиши разность целиком.',left-right,'Вычитай разряды после размена. Проверка: разность плюс вычитаемое должны восстановить уменьшаемое.'));
 return make(`Вычти столбиком: ${left} − ${right}.`,left-right,steps,{mode,left,right},columns(left,right,'−'));
}
function smart(n,mode){
 const a=11+n%79,b=13+n;let q,answer,steps,rows;
 if(mode===0){const c=100-a;answer=100+b;q=`Вычисли удобным способом: ${a} + ${b} + ${c}.`;const choice=C('Какие два слагаемых дополняют друг друга до 100?',[`${a} и ${c}`,`${a} и ${b}`,`${b} и ${c}`],0,n,'Ищи пару, сумма которой круглая. При сложении слагаемые можно менять местами.');
  // Occasionally another pair also totals 100; omit the ambiguous multiple choice then.
  steps=(a+b===100||b+c===100)?[S(`Сначала сложи первое и третье слагаемые: ${a} + ${c}.`,100,'Слагаемые можно переставлять и объединять в удобные группы.')]:[choice,S('Найди сумму выбранной пары.',100,'Первая и третья величины дополняют друг друга до сотни.')];
  steps.push(S('Прибавь оставшееся слагаемое.',answer,'Теперь осталось сложить круглую сотню и оставшееся число.'));rows=[['Первое',a],['Второе',b],['Третье',c]];
 }
 else if(mode===1){const left=10*(2+n%18)-1,right=20+n;answer=left+right;q=`Вычисли удобно: ${left} + ${right}. Перенеси одну единицу от второго слагаемого к первому.`;steps=[S('Каким станет первое слагаемое?',left+1,'Первое слагаемое увеличится на единицу и станет круглым.'),S('Каким станет второе слагаемое?',right-1,'Сумма сохранится, если второе слагаемое уменьшить на ту же единицу.'),S('Найди сумму новых слагаемых.',answer,'Проверь: одно слагаемое увеличено, другое уменьшено на одно и то же число.')];rows=[['Первое',left],['Второе',right]];}
 else{const factor=2+n%8,near=10*(2+Math.floor(n/8)),delta=n%2?1:-1,right=near+delta;answer=factor*right;q=`Вычисли удобно: ${factor} · ${right}. Представь ${right} как ${near} ${delta===1?'+':'−'} 1.`;steps=[S(`Найди ${factor} · ${near}.`,factor*near,'Сначала умножь на круглое число.'),S(`Найди ${factor} · 1.`,factor,'Множитель перед скобками относится к каждому слагаемому.'),S('Выполни оставшееся сложение или вычитание.',answer,delta===1?'Прибавь произведение на единицу: множитель распределяется на оба слагаемых.':'Вычти произведение на единицу: от произведения на круглое число убирается целая группа.')];rows=[['Множитель',factor],['Круглое число',near],['Поправка',delta]];}
 return make(q,answer,steps,{mode,n},table(['Часть записи','Число'],rows,rows.map((row,i)=>E('part-'+i,row[0],'Выдели эту часть и сопоставь её с исходным выражением. Удобное преобразование должно сохранить значение.')),rows.map((_,i)=>'part-'+i)));
}
function inverse(n,mode){
 const x=11+n,a=2+n%9;let q,steps,role,answer=x,relation,left,right;
 if(mode===0&&n%2===0){q=`Найди x: x + ${a} = ${x+a}.`;role='Слагаемое';relation=`x + ${a} = ${x+a}`;left=x+a;right=a;steps=[C('Как называется неизвестное число?',['Слагаемое','Сумма','Вычитаемое'],0,n,'Числа, которые складывают, — слагаемые; результат — сумма.'),S('Из какого известного числа вычитаем известное слагаемое?',x+a,'Из целой суммы убираем известную часть.'),S('Найди x.',x,'Неизвестное слагаемое равно сумме минус известное слагаемое.')];}
 else if(mode===0){q=`Найди x: ${a} · x = ${a*x}.`;role='Множитель';relation=`${a} · x = ${a*x}`;left=a*x;right=a;steps=[C('Как называется неизвестное число?',['Множитель','Произведение','Делимое'],0,n,'Числа, которые умножают, — множители; результат — произведение.'),S('Какое число нужно разделить на известный множитель?',a*x,'Это произведение, записанное справа.'),S('Найди x.',x,'Неизвестный множитель равен произведению, делённому на известный множитель.')];}
 else if(mode===1&&n%2===0){q=`Найди x: x − ${a} = ${x-a}.`;role='Уменьшаемое';relation=`x − ${a} = ${x-a}`;left=x-a;right=a;steps=[C('Что неизвестно?',['Уменьшаемое','Вычитаемое','Разность'],0,n,'Уменьшаемое — число, из которого вычитают.'),S('Какое действие восстановит уменьшаемое? Выбери.',1,'Уменьшаемое состоит из вычитаемой и оставшейся частей.')];steps[1]=C(steps[1].q,['Сложить разность и вычитаемое','Из разности вычесть вычитаемое'],0,n,steps[1].why);steps.push(S('Найди x.',x,'Сложи известную разность и вычитаемое.'));}
 else if(mode===1){q=`Найди x: ${x+a} − x = ${a}.`;role='Вычитаемое';relation=`${x+a} − x = ${a}`;left=x+a;right=a;steps=[C('Что неизвестно?',['Вычитаемое','Уменьшаемое','Разность'],0,n,'Вычитаемое — та часть, которую убрали из уменьшаемого.'),S('Из какого известного числа нужно вычесть разность?',x+a,'Уменьшаемое равно сумме вычитаемого и разности.'),S('Найди x.',x,'Из уменьшаемого вычти известную разность.')];}
 else if(n%2===0){answer=a*x;q=`Найди x: x : ${a} = ${x}.`;role='Делимое';relation=`x : ${a} = ${x}`;left=a;right=x;steps=[C('Что неизвестно?',['Делимое','Делитель','Частное'],0,n,'Делимое — число, которое делят.'),S('Какое известное частное нужно умножить на делитель?',x,'Деление проверяется умножением частного на делитель.'),S('Найди x.',answer,'Неизвестное делимое равно частному, умноженному на делитель.')];}
 else{q=`Найди x: ${a*x} : x = ${a}.`;role='Делитель';relation=`${a*x} : x = ${a}`;left=a*x;right=a;steps=[C('Что неизвестно?',['Делитель','Делимое','Частное'],0,n,'Делитель — число после знака деления.'),S('Какое известное делимое нужно разделить на частное?',a*x,'Делитель и частное при умножении дают делимое.'),S('Найди x.',x,'Неизвестный делитель равен делимому, делённому на частное.')];}
 const check=mode===0?(n%2?a*x:x+a):mode===1?(n%2?a:x-a):mode===2?(n%2?a:x):0;
 steps.push(S('Подставь найденный x. Чему равна левая часть исходного равенства?',check,'Используй именно исходный знак действия. Левая и правая части должны совпасть.'));
 return make(q,answer,steps,{mode,n,x,a,role},table(['Запись','Что проверить'],[[relation,'Место неизвестного x'],['Проверка','Подставить найденное число']],[E('equation','Исходное равенство','Место x определяет название компонента и обратное действие.'),E('check','Проверка','Сначала найди неизвестное, затем подставь его в первоначальную запись.')],['equation','check']));
}
function divisibility(n,mode){
 const value=120+7*n,digits=String(value).split('').map(Number);let q,answer,steps,params,rows=digits.map((d,i)=>[String(i+1),d]);
 if(mode<2){const divisor=mode===0?[2,5,10][n%3]:[3,9][n%2],sum=digits.reduce((a,b)=>a+b,0),yes=value%divisor===0;
  q=`Делится ли ${value} на ${divisor} без остатка? Используй признак делимости.`;
  const final=C('Выбери вывод.',['Да, делится без остатка','Нет, остаётся ненулевой остаток'],yes?0:1,n,mode===0?(divisor===2?'Для делимости на 2 последняя цифра должна быть 0, 2, 4, 6 или 8.':divisor===5?'Для делимости на 5 последняя цифра должна быть 0 или 5.':'На 10 делятся числа, оканчивающиеся нулём.'):`Число делится на ${divisor}, если сумма его цифр делится на ${divisor}.`);
  steps=mode===0?[S('Какова последняя цифра числа?',value%10,'Для этого признака остальные цифры не влияют на вывод.'),final]:[S('Найди сумму цифр числа.',sum,'Сложи сами цифры, а не значения разрядов.'),S(`Найди остаток от деления суммы цифр на ${divisor}.`,sum%divisor,'Нулевой остаток означает делимость. Признак связывает остаток числа с остатком суммы его цифр.'),final];
  answer=Number(final.a);params={mode,value,divisor};
 }else{
  const prefix=20+n,knownSum=String(prefix).split('').reduce((s,c)=>s+Number(c),0),missing=(9-knownSum%9)%9;
  q=`В записи ${prefix}□ замени квадрат на наименьшую цифру, чтобы число делилось на 9.`;
  answer=missing;steps=[S('Какова сумма уже известных цифр?',knownSum,'Пока пропусти квадрат. Складывай цифры, а не значения разрядов.'),S('Какую наименьшую цифру от 0 до 9 нужно добавить, чтобы сумма делилась на 9?',missing,'Если известная сумма уже делится на 9, наименьшая подходящая цифра — ноль.'),S('Какое полное число получится вместо записи с квадратом?',10*prefix+missing,'Припиши найденную цифру справа: она занимает один разряд единиц.'),S('Ответь на вопрос: какую цифру вставить?',missing,'В ответе требуется цифра, а не всё полученное число.')];params={mode,prefix};rows=[...String(prefix)].map((d,i)=>[String(i+1),d]);rows.push([String(rows.length+1),'□']);
 }
 return make(q,answer,steps,params,table(['Позиция слева','Цифра'],rows,rows.map((row,i)=>E('digit-'+i,`Цифра ${i+1}`,i===rows.length-1?'Это последняя цифра. Для 2, 5 и 10 проверяют её; для 3 и 9 она входит в сумму всех цифр.':'Для признаков 3 и 9 эта цифра входит в сумму. Её разрядный вес не прибавляем.')),rows.map((_,i)=>'digit-'+i)));
}
function scale(n,mode){
 const start=5+3*n,step=2+n%5,intervals=4+n%9,end=start+intervals*step,index=1+n%(intervals-1);let q,answer,steps,points,params;
 if(mode===0){q=`Число равных промежутков на шкале от ${start} до ${end} — ${intervals}. Найди цену одного деления.`;answer=step;steps=[S('Найди разность подписанных значений на концах шкалы.',end-start,'Сначала узнай, какую величину занимает весь показанный отрезок.'),S('Сколько равных промежутков занимает этот отрезок?',intervals,'Между двумя соседними рисками один промежуток. Самих рисок на одну больше.'),S('Найди цену деления.',step,'Раздели разность крайних значений на число промежутков.')];points=[{id:'start',value:start,label:String(start)},{id:'end',value:end,label:String(end)}];params={mode,start,end,intervals};}
 else if(mode===1){const point=start+index*step;q=`Цена деления шкалы ${step}. От отметки ${start} до точки A вправо отсчитали ${index} ${index===1?'промежуток':index<5?'промежутка':'промежутков'}. Найди значение в точке A.`;answer=point;steps=[S('На сколько единиц нужно сдвинуться от начальной отметки?',index*step,'Число промежутков умножь на цену одного деления.'),S('С какой подписанной отметки начинается отсчёт?',start,'Отсчёт начинается с данного числа, а не обязательно с нуля.'),S('Какое значение соответствует точке A?',point,'К начальной отметке прибавь величину сдвига вправо.')];points=[{id:'start',value:start,label:String(start)},{id:'point',value:point,label:'A'},{id:'end',value:end,label:String(end)}];params={mode,start,step,index,end,intervals};}
 else{const length=index*step;q=`На линейке начало A отрезка стоит на ${start} см, конец B — на ${start+length} см. Найди длину отрезка.`;answer=length;steps=[S('Какова отметка начала отрезка?',start,'Нулевая отметка линейки не совпадает с началом этого отрезка.'),S('Какова отметка конца отрезка?',start+length,'Запиши показание у второго конца.'),S('Найди длину отрезка в сантиметрах.',length,'Из отметки конца вычти отметку начала. Положение линейки не меняет длину.')];points=[{id:'start',value:start,label:'A'},{id:'point',value:start+length,label:'B'}];params={mode,start,step,index,end,intervals};}
 const elements=points.map(p=>E(p.id,p.id==='start'?'Начальная отметка':p.id==='end'?'Конечная отметка':mode===2?'Конец B':'Точка A',p.id==='start'?'Определи исходное значение, прежде чем считать промежутки.':'Считай промежутки от начальной отметки и учитывай цену каждого.'));
 return make(q,answer,steps,params,{kind:'pre7-lab',diagram:{type:'line',description:'Выдели начальную и конечную отметки. Считай промежутки между рисками и учитывай цену деления.',min:start,max:end,intervals,points,unit:mode===2?'см':''},elements});
}
function stories(n,mode){
 const smaller=6+n,delta=3+n%19,factor=2+n%6;let q,answer,steps,larger,params;
 if(mode===0){larger=smaller+delta;q=`Количество карточек в первом наборе — ${larger}, во втором — ${smaller}. На сколько карточек в первом наборе больше?`;answer=delta;steps=[C('Какое действие отвечает на вопрос «на сколько больше»?',['Вычитание','Деление','Сложение'],0,n,'Разница — добавочная часть большего количества.'),S('Какое из двух количеств больше?',larger,'Из большего количества будем вычитать меньшее.'),S('На сколько карточек больше?',answer,'Вычти меньшее количество из большего.')];params={mode,smaller,larger};}
 else if(mode===1){larger=smaller*factor;q=`Количество карточек в первом наборе — ${larger}, во втором — ${smaller}. Во сколько раз в первом наборе больше карточек?`;answer=factor;steps=[C('Какое действие отвечает на вопрос «во сколько раз больше»?',['Деление','Вычитание','Сложение'],0,n,'Нужно узнать, сколько равных меньших групп помещается в большем количестве.'),S('Какое число будет делителем?',smaller,'Размер меньшей группы принимаем за одну часть.'),S('Во сколько раз карточек больше?',answer,'Большее количество раздели на меньшее.')];params={mode,smaller,larger};}
 else{larger=smaller+delta;const wantedLarger=n%2===0;q=wantedLarger?`У Лены карточек — ${smaller}. Это на ${delta} меньше, чем у Оли. Сколько карточек у Оли?`:`У Оли карточек — ${larger}. Это на ${delta} больше, чем у Лены. Сколько карточек у Лены?`;answer=wantedLarger?larger:smaller;steps=[C('У кого карточек больше?',['У Оли','У Лены','Поровну'],0,n,'Слова «меньше» относятся к Лене, а «больше» — к Оле. Сначала выясни отношения величин.'),C('Какое действие нужно для ответа?',wantedLarger?['Прибавить разницу к меньшему','Вычесть разницу из меньшего']:['Вычесть разницу из большего','Прибавить разницу к большему'],0,n,wantedLarger?'Ищем большее количество: к меньшему добавляем разницу.':'Ищем меньшее количество: из большего убираем разницу.'),S('Сколько карточек у того, о ком спрашивается?',answer,'Проверь условие: разность большего и меньшего должна равняться указанной разнице.')];params={mode,smaller,larger,delta,wantedLarger};}
 const unknown=mode===2,firstLabel=unknown?'Оля':'Первый набор',secondLabel=unknown?'Лена':'Второй набор';
 // Unknown lengths are schematics: equal unit blocks preserve the comparison,
 // while labels keep the answer hidden until the pupil calculates it.
 const barTotal=mode===1?factor:2,bars=mode===1?[{id:'larger',label:`${firstLabel}: ${larger}`,value:factor,total:barTotal},{id:'smaller',label:`${secondLabel}: ${smaller}`,value:1,total:barTotal}]:[{id:'larger',label:`${firstLabel}: ${unknown&&params.wantedLarger?'?':larger}`,value:2,total:barTotal},{id:'smaller',label:`${secondLabel}: ${unknown&&!params.wantedLarger?'?':smaller}`,value:1,total:barTotal}];
 return make(q,answer,steps,params,{kind:'pre7-lab',diagram:{type:'bars',description:mode===1?'Полоски сравнивают количества равных групп. Одна группа соответствует меньшему количеству.':'Схема сравнения: полоски показывают, какое количество больше. Их длины условны и не задают численный масштаб.',bars,unit:mode===1?'равная группа':'схема сравнения, не масштаб'},elements:[E('larger','Большее количество','В нём содержится всё меньшее количество и добавочная часть.'),E('smaller','Меньшее количество',mode===1?'Сколько таких одинаковых групп поместится в большем?':'Сопоставь это количество с большим. Разница отвечает на вопрос «на сколько».')]});
}
const builders=[placeValue,compare,addition,subtraction,smart,inverse,divisibility,scale,stories];
D.meta.push(...families.map(f=>({...f,pos:null,trainingOnly:true,grade7:true,pre7:true,subject:'foundation',expanded:true})));
D.task=function(id,seed=1){
 if(!ids.has(id))return previous(id,seed);
 const numeric=Number(seed),normalized=Number.isFinite(numeric)?((Math.trunc(numeric)%count)+count)%count:0,mode=Math.floor(normalized/variantsPerMode),n=normalized%variantsPerMode;
 return {...builders[families.findIndex(f=>f.id===id)](n,mode),id,seed,pos:null,trainingOnly:true,grade7:true,pre7:true,subject:'foundation'};
};
D.pre7Arithmetic={families,count,variantsPerMode,modes:3,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);
