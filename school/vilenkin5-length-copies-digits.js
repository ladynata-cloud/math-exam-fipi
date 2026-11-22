/* Vilenkin 5, 2023, part one, point 5, printed page 31. */
(function(root){
  'use strict';
  const lessons=[
    ['1.146','Несколько одинаковых отрезков','Можно заменить каждый составной отрезок его длиной в сантиметрах. Умножь эту длину на число отрезков. При обратной записи следи за размером большой единицы: 100 см в метре, 10 см в дециметре.','Два одинаковых отрезка по 1 м 65 см имеют вместе 330 см. Это 3 м 30 см.'],
    ['1.147','Что меняется при дописывании той же цифры','Когда цифра переносится на один разряд влево, её вклад становится в десять раз больше. Дописывая справа такую же цифру, мы добавляем ещё один её экземпляр в единицах. Проследи, сколько таких экземпляров приходится на все разряды.','Пятьдесят пять состоит из пяти десятков и пяти единиц. Значит, 55 = 5 × (10 + 1). Если начать с нуля, одни только нули по-прежнему обозначают ноль.']
  ].map(([number,title,explanation,example])=>({number,title,explanation,worked:[example],part:1,point:5,page:31,key:'printed-'+number.replace('.','-'),misconception:number==='1.146'?'При умножении составной длины на число достаточно умножить только её большую часть.':'Если справа приписали ту же цифру, число всегда увеличилось ровно в десять раз.',reflect:'Как разложить результат и восстановить исходные единицы?',requires:[number==='1.146'?'v5f-printed-1-141':'v5f-printed-1-24'],related:['v5f-printed-1-141']}));
  const err=(value,text)=>({value,text});
  function lengths(seed,r,step){
    const groups=[{unit:'м',base:100,large:seed?r(1,5):2,cm:seed?10*r(1,9):30,count:seed?r(2,5):2},{unit:'дм',base:10,large:seed?r(2,8):2,cm:seed?r(1,9):4,count:seed?r(2,7):4}];
    const steps=[],products=[];
    groups.forEach((g,i)=>{
      const simple=g.large*g.base+g.cm,product=g.count*simple,name='аб'[i]+'. Отрезок '+g.large+' '+g.unit+' '+g.cm+' см. ';
      steps.push(step(name+'Сколько сантиметров в одном таком отрезке?',simple,'Переведи '+g.large+' '+g.unit+' в сантиметры и добавь оставшиеся '+g.cm+' см.',[err(g.large+g.cm,'Пока сложены числа с разными единицами. В одной большой единице '+g.base+' см.')]));
      steps.push(step(name+'Возьми столько одинаковых отрезков: '+g.count+'. Сколько сантиметров они займут вместе?',product,'Умножь полную длину одного отрезка на число копий.',[err(g.count*g.large*g.base+g.cm,'Большие единицы повторены, но кусочек в сантиметрах тоже встречается в каждой копии.'),err(simple+g.count,'Число копий — множитель, а не дополнительная длина.')]));
      steps.push({...step('Запиши '+product+' см снова в виде целых '+g.unit+' и оставшихся сантиметров. Введи два числа.',[Math.floor(product/g.base),product%g.base],'В большой единице '+g.base+' см. Выдели полные группы и найди остаток.'),answerFormat:'v5-pair'});products.push(product);
    });
    return {prefix:'Покажи длины на полосках. ',prompt:'Сколько сантиметров составляют произведения а и б? Сначала запиши общую длину набора а, затем набора б.',inputPrompt:'Две длины в сантиметрах',answer:products,answerFormat:'v5-pair',steps,errors:[],conditionKey:groups.map(g=>[g.large,g.cm,g.count].join('/')).join(':'),data:{lengthCopies:groups},table:{caption:'Длина одной полоски и число копий',headers:['Набор','Полоска × количество'],rows:groups.map((g,i)=>['аб'[i],g.large+' '+g.unit+' '+g.cm+' см × '+g.count])}};
  }
  const multiplier=n=>Number('1'.repeat(n+1));
  function digits(seed,r,step){
    const digit=seed?r(1,9):3,steps=[];
    for(let n=1;n<=3;n++){
      const f=multiplier(n),number=digit*f;
      steps.push(step('Начни с '+digit+'. Справа допиши эту же цифру. Количество дописанных цифр — '+n+'. Какое число получилось?',number,'После дописывания на каждом месте от единиц до старшего разряда стоит '+digit+'.',[err(digit*10**n,'Это получилось бы при дописывании нулей. Сейчас в новых разрядах должна стоять та же цифра.'),err(digit*(n+1),'Цифры не складываются как единицы. Каждое место имеет собственное разрядное значение.')]));
      steps.push(step('Во сколько раз '+number+' больше исходного '+digit+'?',f,'Раздели новое число на исходную ненулевую цифру. Получится сумма разрядных единиц.',[err(number-digit,'Это увеличение на сколько, а не во сколько раз.'),err(10**n,'Такой множитель переносит цифру влево и оставляет нули. Добавь вклады остальных одинаковых цифр.')]));
    }
    steps.push(step('Проверь отдельно цифру 0. Какое число обозначает запись из четырёх нулей?',0,'В каждом разряде ноль. Значение остаётся нулём, и сравнивать делением на исходный ноль нельзя.'));
    return {prefix:'Для исследования возьми цифру '+digit+'. Ноль проверим отдельно. ',prompt:'Запиши три множителя для любой ненулевой исходной цифры: если такую же цифру дописать один раз, два раза, три раза.',inputPrompt:'Три множителя по порядку',answer:[11,111,1111],answerFormat:'v5-list',steps,errors:[err([10,100,1000],'Эти множители верны при дописывании нулей. Здесь каждая новая цифра такая же, как исходная.')],conditionKey:'digit/'+digit,data:{copiedDecimalDigit:digit},table:{caption:'Сколько копий дописать справа',headers:['Пункт','Дописать'],rows:[['а','1 цифру'],['б','2 цифры'],['в','3 цифры']]}};
  }
  function strip(g){
    const fraction=(g.large*g.base)/(g.large*g.base+g.cm),cell=212/g.count;
    const bars=Array.from({length:g.count},(_,i)=>'<rect x="'+(14+i*cell)+'" y="27" width="'+cell+'" height="18" fill="#e1d4a2" stroke="#62715b"/><rect x="'+(14+i*cell)+'" y="27" width="'+(cell*fraction)+'" height="18" fill="#4d8974" stroke="#486b56"/>').join('');
    return '<svg viewBox="0 0 244 66" role="img" aria-label="'+g.count+' одинаковых полосок, каждая по '+g.large+' '+g.unit+' и ещё '+g.cm+' см"><text x="14" y="17" style="font:15px sans-serif">Обе части есть в каждой копии</text>'+bars+'</svg>';
  }
  function explore(l,s,t,table){
    if(t.data.lengthCopies){
      const g=t.data.lengthCopies[s.group],total=g.count*(g.base*g.large+g.cm);
      return {title:'Соедини равные полоски',controls:[{key:'group',title:'Набор',values:[[0,'а'],[1,'б']]},{key:'ask',title:'Что измерить',values:[[0,'Все сантиметры'],[1,'Полные большие единицы'],[2,'Остаток в сантиметрах']]}],visual:strip(g),question:['Сколько сантиметров во всех полосках вместе?','Сколько полных '+g.unit+' помещается в общей длине?','Сколько сантиметров останется после выделения полных '+g.unit+'?'][s.ask],answer:[total,Math.floor(total/g.base),total%g.base][s.ask],why:'За одну полоску возьми '+g.large+' групп по '+g.base+' см и ещё '+g.cm+' см. Повтори полоску '+g.count+' раз.'};
    }
    const initial=t.data.copiedDecimalDigit,digit=s.choice?s.choice-1:initial,extra=s.copies,count=extra+1,number=multiplier(extra)*digit,digits=Array.from({length:count},(_,i)=>[String(10**(count-i-1)),String(digit)]);
    return {title:'Собери запись по разрядам',controls:[{key:'choice',title:'Начальная цифра',values:[[0,'Из задачи: '+initial],...Array.from({length:10},(_,i)=>[i+1,String(i)])]},{key:'copies',title:'Допиши ещё цифр',values:[[1,1],[2,2],[3,3]]},{key:'ask',title:'Что найти',values:[[0,'Значение записи'],[1,'На сколько изменилось']]}],visual:table('Одна и та же цифра на разных местах',['Вес разряда','Цифра'],digits),question:s.ask?'На сколько новое число больше начального? Для одинаковых значений ответь 0.':'Какое число обозначает получившаяся запись?',answer:s.ask?number-digit:number,why:digit?'Умножь цифру на вес каждого разряда и сложи эти вклады. Для изменения вычти начальную цифру.':'Одни только нули обозначают число 0. Значение не меняется.'};
  }
  const generators={'1.146':lengths,'1.147':digits},bounds={'1.146':{group:[0,1,0],ask:[0,2,0]},'1.147':{choice:[0,10,0],copies:[1,3,1],ask:[0,1,0]}};
  const api={lessons,generators,bounds,explore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5LengthCopiesDigits=api;
})(typeof window!=='undefined'?window:globalThis);
