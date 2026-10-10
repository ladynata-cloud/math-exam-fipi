(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SovietExtensionPrimary = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const definitions = [
    ['number-neighbors', 'Предыдущее и следующее число', 'Узнаём, какое число стоит перед данным, а какое — после него.'],
    ['zero-actions', 'Действия с нулём', 'Различаем прибавление нуля, вычитание нуля и умножение на ноль.'],
    ['compare-three-digit', 'Сравнение трёхзначных чисел', 'Сравниваем разряды, начиная с сотен.'],
    ['add-round-tens', 'Сложение круглых десятков', 'Сначала складываем десятки, затем записываем ответ.'],
    ['subtract-round-tens', 'Вычитание круглых десятков', 'Вычитаем число десятков и записываем разность.'],
    ['add-two-digit-mental', 'Устное сложение двузначных чисел', 'Прибавляем второе слагаемое по частям: сначала десятки, затем единицы.'],
    ['subtract-two-digit-mental', 'Устное вычитание двузначных чисел', 'Вычитаем по частям: сначала десятки, затем единицы.'],
    ['multiply-by-ten-hundred', 'Умножение на 10 и 100', 'Узнаём, как меняется место каждой цифры при умножении на десять и сто.'],
    ['divide-by-ten-hundred', 'Деление на 10 и 100', 'Узнаём, как меняется место каждой цифры при делении на десять и сто.'],
    ['unknown-addend', 'Неизвестное слагаемое', 'Находим неизвестную часть суммы и проверяем сложением.']
  ];
  const topics = definitions.map(([id, title, description]) => ({ id, title, description, stage: 'more-numbers', source: 'pchelko' }));
  const ids = new Set(topics.map(topic => topic.id));
  const data = {
    neighbors: [9, 19, 28, 39, 49, 58, 69, 89, 99, 109, 199, 299],
    zeros: [[7, 3], [12, 5], [24, 8], [36, 4], [45, 9], [58, 6], [61, 7], [73, 2], [84, 3], [95, 5], [108, 9], [120, 4]],
    compare: [[342, 527], [618, 594], [704, 709], [381, 358], [462, 426], [830, 803], [219, 291], [560, 568], [907, 790], [145, 149], [678, 673], [999, 998]],
    addTens: [[40, 30], [20, 50], [60, 20], [70, 10], [80, 20], [50, 40], [10, 60], [30, 50], [20, 20], [40, 40], [10, 80], [60, 30]],
    subtractTens: [[80, 30], [90, 50], [70, 20], [100, 40], [90, 60], [80, 70], [100, 30], [90, 20], [70, 50], [60, 40], [50, 20], [40, 10]],
    addMental: [[36, 27], [48, 35], [57, 26], [69, 18], [24, 39], [75, 16], [46, 28], [58, 34], [67, 25], [73, 19], [29, 47], [64, 29]],
    subtractMental: [[63, 27], [82, 35], [71, 26], [94, 18], [62, 39], [85, 16], [73, 28], [91, 34], [84, 25], [92, 19], [76, 47], [93, 29]],
    powers: [[23, 10], [14, 100], [37, 10], [46, 100], [58, 10], [62, 100], [79, 10], [83, 100], [95, 10], [26, 100], [41, 10], [68, 100]],
    addend: [[7, 15], [9, 24], [14, 32], [18, 45], [23, 60], [27, 54], [35, 72], [46, 83], [28, 65], [39, 91], [52, 100], [67, 120]]
  };

  function step(prompt, answer, hint, record, helper) {
    return { prompt, answer: String(answer), hint, record, helper };
  }
  function result(topicId, index, prompt, answer, steps, visual) {
    return { topicId, index, prompt, answer: String(answer), steps, kind: 'standard', visual };
  }
  function make(id, requestedIndex = 0) {
    if (!ids.has(id)) throw Error('Неизвестная тема начальной арифметики.');
    if (!Number.isSafeInteger(requestedIndex) || requestedIndex < 0 || requestedIndex > 1000000) throw Error('Неверный номер упражнения.');
    const index = requestedIndex, variant = index % 12;
    if (id === 'number-neighbors') {
      const n = data.neighbors[variant];
      return result(id,index,'Запиши предыдущее и следующее числа для числа '+n+'.',n+1,[
        step('Какое число стоит сразу перед '+n+'?',n-1,'Вычти один: '+n+' − 1 = '+(n-1)+'.',n+' − 1 = '+(n-1),['Предыдущее число ищем шагом назад.']),
        step('Какое число стоит сразу после '+n+'?',n+1,'Прибавь один: '+n+' + 1 = '+(n+1)+'.',n+' + 1 = '+(n+1),['Теперь начни снова с числа в условии.','Следующее число ищем шагом вперёд.'])
      ],{kind:'number-line',center:n,states:[{left:false,right:false},{left:true,right:false},{left:true,right:true}]});
    }
    if(id==='zero-actions') {
      const [a,b]=data.zeros[variant], expression='('+a+' + 0) − '+b+' × 0';
      return result(id,index,'Вычисли: '+expression+'.',a,[
        step('Чему равно выражение в скобках?',a,'Ничего не прибавили, поэтому число осталось прежним: '+a+'.',expression+' = '+a+' − '+b+' × 0',['Сначала выполни действие в скобках.','Ноль означает, что ничего не добавили.']),
        step('Чему равно произведение '+b+' × 0?',0,'Ни разу не взяли по '+b+', поэтому получилось ноль.',a+' − '+b+' × 0 = '+a+' − 0',['Умножение выполняем раньше вычитания.','Взять число ноль раз — не взять ни одного.']),
        step('Ничего не вычли. Какое число осталось?',a,'Вычитание нуля не изменяет число: '+a+' − 0 = '+a+'.',a+' − 0 = '+a,['Из числа ничего не убираем.'])
      ],{kind:'zero-actions',a,b,states:[{phase:0},{phase:1},{phase:2},{phase:3}]});
    }
    if(id==='compare-three-digit') {
      const [a,b]=data.compare[variant],answer=Math.max(a,b),da=String(a),db=String(b);
      const position=Array.from(da).findIndex((digit,i)=>digit!==db[i]);
      const reason=(position===0?'Сначала сравни сотни.':position===1?'Сотен поровну. Сравни десятки.':'Сотен и десятков поровну. Сравни единицы.')+' '+da[position]+' '+(a>b?'>':'<')+' '+db[position]+', поэтому больше '+answer+'.';
      return result(id,index,'Какое число больше: '+a+' или '+b+'?',answer,[
        step('Запиши большее число целиком.',answer,reason,a+(a>b?' > ':' < ')+b,['Сравнивай слева направо: сотни, десятки, единицы.','Первый разряд с разными цифрами решает сравнение.'])
      ],{kind:'place-compare',a,b,decisive:position,states:[{showResult:false},{showResult:true}]});
    }
    if(id==='add-round-tens'||id==='subtract-round-tens') {
      const subtract=id==='subtract-round-tens',[a,b]=(subtract?data.subtractTens:data.addTens)[variant],answer=subtract?a-b:a+b,op=subtract?'−':'+';
      const tens=answer/10;
      return result(id,index,'Вычисли: '+a+' '+op+' '+b+'.',answer,[
        step('Чему '+(subtract?'равна разность':'равна сумма')+' '+a+' '+op+' '+b+'?',answer,'Считай десятками: '+a/10+' '+op+' '+b/10+' = '+tens+'. Получится '+answer+'.',a+' '+op+' '+b+' = '+answer,['В каждом пучке десять палочек.',subtract?'Убери столько пучков, сколько десятков во втором числе.':'Соедини пучки из обеих групп.'])
      ],{kind:'bundles-operation',a,b,op:subtract?'-':'+',states:[{showResult:false},{showResult:true}]});
    }
    if(id==='add-two-digit-mental'||id==='subtract-two-digit-mental') {
      const subtract=id==='subtract-two-digit-mental',[a,b]=(subtract?data.subtractMental:data.addMental)[variant];
      const tens=Math.floor(b/10)*10,units=b%10,intermediate=subtract?a-tens:a+tens,answer=subtract?a-b:a+b,op=subtract?'−':'+';
      return result(id,index,'Вычисли устно: '+a+' '+op+' '+b+'.',answer,[
        step((subtract?'Вычти':'Прибавь')+' сначала десятки. Какое число получится?',intermediate,'Разложим '+b+' на '+tens+' и '+units+'. Сначала '+a+' '+op+' '+tens+' = '+intermediate+'.',a+' '+op+' '+tens+' = '+intermediate,[b+' = '+tens+' + '+units,'Сначала '+(subtract?'вычти':'прибавь')+' полные десятки.']),
        step((subtract?'Вычти':'Прибавь')+' оставшиеся единицы. Каков ответ?',answer,'Теперь '+intermediate+' '+op+' '+units+' = '+answer+'. Всё число '+b+' '+(subtract?'вычтено':'прибавлено')+'.',intermediate+' '+op+' '+units+' = '+answer,['Десятки уже учтены.',(subtract?'Вычти':'Прибавь')+' только '+units+'.'])
      ],{kind:'mental-parts',a,b,op:subtract?'-':'+',states:[{phase:0},{phase:1},{phase:2}]});
    }
    if(id==='multiply-by-ten-hundred'||id==='divide-by-ten-hundred') {
      const divide=id==='divide-by-ten-hundred',[base,factor]=data.powers[variant],value=divide?base*factor:base,answer=divide?base:base*factor,op=divide?':':'×';
      const distance=factor===10?'один разряд':'два разряда';
      return result(id,index,'Вычисли: '+value+' '+op+' '+factor+'.',answer,[
        step('Какое число получится?',answer,'При '+(divide?'делении':'умножении')+' на '+factor+' каждая цифра переходит на '+distance+' '+(divide?'вправо':'влево')+'. Получится '+answer+'.',value+' '+op+' '+factor+' = '+answer,['В таблице у каждого разряда своё место.',divide?'Сотни станут десятками при делении на десять; сотни станут единицами при делении на сто.':'При умножении на десять единицы станут десятками; при умножении на сто — сотнями.'])
      ],{kind:'place-shift',value,factor,op,states:[{showResult:false},{showResult:true}]});
    }
    const [known,sum]=data.addend[variant],unknown=sum-known;
    return result(id,index,'К задуманному числу прибавили '+known+' и получили '+sum+'. Какое число задумали?',unknown,[
      step('Какое число задумали?',unknown,'Из всей суммы вычти известное слагаемое: '+sum+' − '+known+' = '+unknown+'.',sum+' − '+known+' = '+unknown,['Сумма состоит из известной и неизвестной частей.','Убери известную часть из всей суммы.']),
      step('Проверь: чему равна сумма '+unknown+' + '+known+'?',sum,'Подставим найденное число: '+unknown+' + '+known+' = '+sum+'. Получилась нужная сумма.',unknown+' + '+known+' = '+sum+' — проверка',['Прибавь к найденному числу известное слагаемое.','Должна получиться сумма из условия.'])
    ],{kind:'whole-parts',whole:sum,known,states:[{showResult:false},{showResult:true},{showResult:true}]});
  }
  return {topics,make,examplesPerTopic:12};
}));
