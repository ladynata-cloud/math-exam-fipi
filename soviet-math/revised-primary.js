(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SovietRevisedPrimary = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var definitions = [
    ['bonds', 'Состав числа', 'Узнаём, сколько карандашей не хватает до нужного количества.'],
    ['compare', 'Сравнение чисел', 'Составляем пары и узнаём, где предметов больше.'],
    ['add-ten', 'Сложение в пределах 10', 'Соединяем две группы кубиков и считаем, сколько стало.'],
    ['subtract-ten', 'Вычитание в пределах 10', 'Убираем часть карандашей и узнаём, сколько осталось.'],
    ['add-twenty', 'Сложение с переходом через 10', 'Заполняем десяток и прибавляем оставшуюся часть.'],
    ['subtract-twenty', 'Вычитание с переходом через 10', 'Сначала оставляем десять, затем вычитаем оставшуюся часть.'],
    ['place-value', 'Десятки, единицы, сотни', 'Считаем палочки в пучках и записываем число.'],
    ['stories', 'Задачи по действиям', 'Решаем задачу о книгах на двух полках.'],
    ['groups', 'Одинаковые группы', 'Считаем яблоки на одинаковых тарелках и знакомимся с умножением.'],
    ['sharing', 'Разделить поровну', 'Раздаём тетради так, чтобы каждому досталось поровну.'],
    ['times-table', 'Таблица умножения', 'Находим произведение и проверяем его по рядам точек.'],
    ['column-add', 'Сложение столбиком', 'Складываем единицы с единицами, десятки с десятками.'],
    ['column-subtract', 'Вычитание столбиком', 'Учимся разменивать десяток на десять единиц при вычитании.'],
    ['column-multiply', 'Умножение столбиком', 'Умножаем число по разрядам и учитываем полученные десятки.'],
    ['order', 'Порядок действий', 'Выбираем первое действие и вычисляем всё выражение.']
  ];
  var topics = definitions.map(function (d, i) {
    return { id: d[0], title: d[1], description: d[2], stage: i < 8 ? 'start' : 'written', source: i < 11 ? 'pchelko' : 'princev' };
  });
  function word(n, forms) { var k = n % 100; return forms[k >= 11 && k <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2]; }
  function pencils(n) { return n + ' ' + word(n, ['карандаш', 'карандаша', 'карандашей']); }
  function cubes(n) { return n + ' ' + word(n, ['кубик', 'кубика', 'кубиков']); }
  function books(n) { return n + ' ' + word(n, ['книга', 'книги', 'книг']); }
  function booksTaken(n) { return n + ' ' + word(n, ['книгу', 'книги', 'книг']); }
  function notebooks(n) { return n + ' ' + word(n, ['тетрадь', 'тетради', 'тетрадей']); }
  function step(prompt, answer, hint, record, helper) { return { prompt: prompt, answer: String(answer), hint: hint, record: record, helper: helper || [] }; }
  function result(id, index, prompt, answer, steps, visual) { return { topicId: id, index: index, prompt: prompt, answer: String(answer), kind: 'standard', steps: steps, visual: visual }; }
  function digits(n) { return [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)]; }
  function recordColumn(expression, value, carry) { return expression + ' = ' + value + (carry ? '; пишем ' + value % 10 + ', переносим ' + Math.floor(value / 10) : ''); }

  function make(id, requestedIndex) {
    if (!topics.some(function (topic) { return topic.id === id; })) throw Error('Неизвестная тема: ' + id);
    var index = requestedIndex === undefined ? 0 : requestedIndex;
    if (!Number.isSafeInteger(index) || index < 0 || index > 1000000) throw Error('Неверный номер упражнения.');
    var variant = index % 12;
    var data, a, b, c, total, first, rest, steps, visual;
    if (id === 'bonds') {
      data = [[5,3],[4,3],[6,2],[3,4],[2,4],[6,3],[4,5],[5,5],[3,6],[2,5],[7,3],[4,4]][variant];
      a = data[0]; b = data[1]; total = a + b;
      steps = [
        step('Сколько карандашей нужно добавить?', b, 'Сосчитай свободные места: их ' + b + '. Проверим: ' + a + ' + ' + b + ' = ' + total + '.', total + ' − ' + a + ' = ' + b + '; ' + a + ' + ' + b + ' = ' + total, ['Всего в коробке должно быть ' + pencils(total) + '.', 'Уже лежат ' + pencils(a) + '. Найди, сколько не хватает.'])
      ];
      return result(id, index, 'В коробке должно быть ' + pencils(total) + '. Пока лежат ' + pencils(a) + '. Сколько карандашей нужно добавить?', b, steps, {kind:'objects', mode:'missing', object:'pencil', a:a, b:b, total:total, states:[{moved:0,shownB:false},{moved:b,shownB:true}]});
    }
    if (id === 'compare') {
      data = [[3,5],[9,6],[3,7],[8,4],[6,10],[7,2],[4,9],[10,3],[2,5],[6,8],[9,7],[5,4]][variant]; a=data[0]; b=data[1]; total=Math.max(a,b);
      return result(id,index,'В одной коробке '+pencils(a)+', в другой — '+pencils(b)+'. В какой коробке больше карандашей? Запиши большее число.',total,[
        step('Запиши большее число: '+a+' или '+b+'.',total,'Составь пары. В коробке с '+total+' карандашами останутся карандаши без пары.',a+(a<b?' < ':' > ')+b,['Соедини карандаши попарно: по одному из каждой коробки.','Где останутся карандаши без пары, там их больше.'])
      ],{kind:'objects',mode:'compare',object:'pencil',a:a,b:b,states:[{pairs:0,shownB:true},{pairs:Math.min(a,b),shownB:true}]});
    }
    if (id === 'add-ten' || id === 'subtract-ten') {
      data = [[3,4],[2,5],[4,3],[5,3],[2,6],[6,2],[3,6],[4,5],[7,2],[5,5],[6,4],[2,4]][variant]; a=data[0]; b=data[1]; total=a+b;
      if (id === 'add-ten') return result(id,index,'На столе '+cubes(a)+'. Положили ещё '+cubes(b)+'. Сколько кубиков стало?',total,[
        step('Сколько всего кубиков на столе?',total,'Соедини обе группы и сосчитай кубики: '+a+' + '+b+' = '+total+'.',a+' + '+b+' = '+total,['Кубики, которые были на столе, остаются.','Добавь к ним новые кубики.'])
      ],{kind:'objects',mode:'add',object:'cube',a:a,b:b,states:[{moved:0,shownB:true},{moved:b,shownB:true}]});
      return result(id,index,'В коробке было '+pencils(total)+'. Взяли '+pencils(b)+'. Сколько карандашей осталось?',a,[
        step('Сколько карандашей осталось в коробке?',a,'Отложи '+pencils(b)+' и сосчитай оставшиеся: '+total+' − '+b+' = '+a+'.',total+' − '+b+' = '+a,['Взятые карандаши отложи в сторону.','Считай только те, что остались в коробке.'])
      ],{kind:'objects',mode:'subtract',object:'pencil',a:total,b:b,states:[{moved:0},{moved:b}]});
    }
    if (id === 'add-twenty' || id === 'subtract-twenty') {
      data=[[8,5],[7,6],[9,4],[6,7],[8,7],[9,6],[7,5],[6,8],[9,8],[5,7],[8,9],[7,9]][variant];a=data[0];b=data[1];total=a+b;
      if (id==='add-twenty') {
        first=10-a;rest=b-first;
        steps=[
          step('Сколько фишек нужно добавить к '+a+', чтобы стало десять?',first,'В рамке десять мест. Свободных мест: 10 − '+a+' = '+first+'.',a+' + '+first+' = 10',['Сначала заполним рамку до десяти.','Сосчитай свободные места.']),
          step('Из '+b+' фишек уже добавили '+first+'. Сколько ещё осталось добавить?',rest,'Вычти использованные фишки: '+b+' − '+first+' = '+rest+'.',b+' = '+first+' + '+rest,['Часть новых фишек уже в рамке.','Сосчитай только те новые фишки, что ещё лежат рядом.']),
          step('В рамке десять фишек. Сколько будет вместе с оставшимися?',total,'К десяти добавь оставшиеся '+rest+': 10 + '+rest+' = '+total+'.',a+' + '+b+' = 10 + '+rest+' = '+total,['Полный десяток считаем сразу как десять.','Добавь к нему фишки, оставшиеся рядом.'])
        ];
        visual={kind:'ten-frame',mode:'add',a:a,b:b,states:[{moved:0},{moved:first},{moved:first},{moved:b}]};
        return result(id,index,'Вычисли: '+a+' + '+b+'. Собери сначала десять фишек.',total,steps,visual);
      }
      first=total-10;rest=b-first;
      steps=[
        step('Сколько фишек уберём сначала, чтобы осталось десять?',first,'Сначала убери фишки вне полного десятка: '+total+' − 10 = '+first+'.',total+' − '+first+' = 10',['Начнём с фишек, которые лежат рядом с полным десятком.']),
        step('Нужно убрать '+b+', а уже убрали '+first+'. Сколько ещё убрать?',rest,'Вычти уже убранные фишки: '+b+' − '+first+' = '+rest+'.',b+' = '+first+' + '+rest,['Убранные фишки лежат отдельно.','Нужно убрать только оставшуюся часть.']),
        step('Убери эту часть из десяти. Сколько фишек останется?',a,'Из десяти вычти оставшиеся '+rest+': 10 − '+rest+' = '+a+'.',total+' − '+b+' = 10 − '+rest+' = '+a,['Продолжи с полного десятка.','Не убирай повторно фишки, которые уже отложены.'])
      ];
      return result(id,index,'Вычисли: '+total+' − '+b+'. Сначала оставь десять фишек.',a,steps,{kind:'ten-frame',mode:'subtract',a:total,b:b,states:[{moved:0},{moved:first},{moved:first},{moved:b}]});
    }
    if (id==='place-value') {
      total=[23,34,42,51,60,70,105,120,204,306,450,608][variant]; a=Math.floor(total/100);b=Math.floor(total/10)%10;c=total%10;first=total-c;
      var parts=[]; if(a)parts.push(a+' '+word(a,['пучок','пучка','пучков'])+' по 100 палочек'); if(b)parts.push(b+' '+word(b,['пучок','пучка','пучков'])+' по 10 палочек'); if(c)parts.push(c+' '+word(c,['палочка','палочки','палочек'])+' отдельно'); var condition='На рисунке '+parts.join(' и ')+'. Сколько всего палочек?';
      steps=[step('Сколько палочек во всех пучках?',first,'В каждом маленьком пучке десять палочек.'+(a?' В каждом большом — сто.':'')+' Вместе в пучках '+first+' палочек.',(a?a+' × 100'+(b?' + '+b+' × 10':''):b+' × 10')+' = '+first,['Сначала посчитай палочки в пучках.','Отдельные палочки пока не учитывай.'])];
      if(c) steps.push(step('Добавь отдельные палочки. Сколько палочек всего?',total,'К '+first+' прибавь '+c+': получится '+total+'.',first+' + '+c+' = '+total,['Палочки в пучках уже посчитаны.','Теперь добавь те, которые лежат отдельно.']));
      visual={kind:'bundles',value:total,states:[{showValue:false},{showValue:!c}]};if(c)visual.states.push({showValue:true});
      return result(id,index,condition,total,steps,visual);
    }
    if(id==='stories') {
      data=[[5,3,0],[6,2,0],[4,5,0],[7,3,0],[8,2,0],[5,4,0],[9,3,8],[6,5,4],[7,4,5],[8,3,6],[4,6,5],[9,2,7]][variant];a=data[0];b=data[1];c=data[2];first=a+b;rest=a+first;total=rest-c;
      var prompt='На первой полке '+books(a)+', на второй — на '+b+' больше. '+(c?'С полок взяли '+booksTaken(c)+'. Сколько книг осталось?':'Сколько книг на двух полках?');
      steps=[
        step('Сколько книг на второй полке?',first,'На '+b+' больше — это столько же, сколько на первой полке, и ещё '+b+'. Получится '+first+'.',a+' + '+b+' = '+first+' (вторая полка)',['На второй полке книг больше, чем на первой.','К числу книг на первой полке прибавь разницу.']),
        step('Сколько книг на двух полках вместе?',rest,'Сложи книги с обеих полок: '+a+' + '+first+' = '+rest+'.',a+' + '+first+' = '+rest+' (всего)',['Число книг на второй полке уже известно.','Объедини книги с обеих полок.'])
      ];
      visual={kind:'shelves',first:a,extra:b,second:first,taken:c,states:[{showSecond:false,taken:0},{showSecond:true,taken:0},{showSecond:true,taken:0}]};
      if(c){steps.push(step('С полок взяли '+booksTaken(c)+'. Сколько книг осталось?',total,'Из общего числа книг вычти взятые: '+rest+' − '+c+' = '+total+'.',rest+' − '+c+' = '+total+' (осталось)',['Общее число книг уже известно.','Убери из него книги, которые взяли.']));visual.states.push({showSecond:true,taken:c});}
      return result(id,index,prompt,total,steps,visual);
    }
    if(id==='groups' || id==='times-table') {
      data=id==='groups'?[[3,2],[2,3],[4,2],[3,3],[2,5],[4,3],[3,4],[5,3],[4,4],[5,4],[3,6],[4,6]][variant]:[[3,4],[4,3],[5,4],[4,6],[6,5],[7,3],[7,6],[8,4],[6,7],[8,6],[9,4],[9,7]][variant];
      if(id==='groups'){a=data[0];b=data[1];}else{b=data[0];a=data[1];}total=a*b;
      var repeat=Array(a).fill(String(b)).join(' + ');
      var groupPrompt='На каждой из '+a+' тарелок по '+b+' '+word(b,['яблоку','яблока','яблок'])+'. Сколько всего яблок?';
      return result(id,index,id==='groups'?groupPrompt:'Вычисли: '+b+' × '+a+'.',total,[
        step(id==='groups'?'Сколько яблок на всех тарелках?':'Чему равно произведение '+b+' × '+a+'?',total,'Возьми по '+b+' '+word(a,['один раз',a+' раза',a+' раз'])+'. Получится '+total+'.',id==='groups'?repeat+' = '+b+' × '+a+' = '+total:b+' × '+a+' = '+total,[(id==='groups'?'На каждой тарелке':'В каждой строке')+' одинаковое количество.','Сложи число '+b+' '+a+' '+word(a,['раз','раза','раз'])+'.'])
      ],{kind:'groups',count:a,each:b,object:id==='groups'?'apple':'dot'});
    }
    if(id==='sharing') {
      data=[[6,2],[8,2],[9,3],[12,3],[12,4],[15,3],[16,4],[18,3],[18,6],[20,4],[24,4],[24,6]][variant];total=data[0];a=data[1];b=total/a;
      return result(id,index,notebooks(total)+' раздали '+a+' ученикам поровну. Сколько тетрадей получил каждый?',b,[
        step('Сколько тетрадей досталось каждому?',b,'Раздай все тетради поровну. У каждого окажется по '+b+' '+word(b,['тетради','тетради','тетрадей'])+'.',total+' : '+a+' = '+b,['Каждому даём одинаковое количество тетрадей.','Раздай все тетради: ни одной не должно остаться.'])
      ],{kind:'sharing',total:total,groups:a,object:'notebook',states:[{rounds:0},{rounds:b}]});
    }
    if(id==='column-add' || id==='column-subtract' || id==='column-multiply') {
      data=id==='column-add'?[[23,14],[28,17],[46,28],[57,36],[123,214],[268,157],[346,285],[478,356],[509,284],[637,185],[756,168],[869,157]][variant]:id==='column-subtract'?[[42,18],[53,27],[64,36],[71,45],[152,28],[231,114],[402,178],[503,286],[704,359],[600,247],[831,465],[920,584]][variant]:[[23,3],[27,3],[34,2],[46,2],[123,3],[138,4],[204,3],[127,6],[236,4],[305,7],[418,3],[176,8]][variant];
      a=data[0];b=data[1];var op=id==='column-add'?'+':id==='column-subtract'?'-':'×';total=op==='+'?a+b:op==='-'?a-b:a*b;
      var da=digits(a),db=digits(b),carry=0,columns=String(a).length,names=['единиц','десятков','сотен'],singular=['единицу','десяток','сотню'];
      var forms=[['единица','единицы','единиц'],['десяток','десятка','десятков'],['сотня','сотни','сотен'],['тысяча','тысячи','тысяч']];
      var accForms=[['единицу','единицы','единиц'],['десяток','десятка','десятков'],['сотню','сотни','сотен']];steps=[];
      for(var position=0;position<columns;position++) {
        var helpers=[],value,expression,previous=carry,hint;
        if(op==='-') {
          helpers.push('Вычитаем '+db[position]+' '+word(db[position],accForms[position])+'.');
          if(da[position]<db[position]) {
            var lender=position+1;while(da[lender]===0)lender++;
            for(var place=lender;place>position;place--){da[place]--;da[place-1]+=10;helpers.push('Разменяем '+singular[place]+' на 10 '+names[place-1]+'.');}
          }
          expression=da[position]+' − '+db[position];value=da[position]-db[position];
          hint=expression+' = '+value+'. Запишем '+value+' в разряд '+names[position]+'.';
          helpers.push('Теперь можно вычислить '+expression+'.');
          steps.push(step('Сколько '+names[position]+' останется?',value,hint,expression+' = '+value+' ('+names[position]+')',helpers));
          da[position]=value;
        } else {
          expression=op==='+'?da[position]+' + '+db[position]:da[position]+' × '+b;
          if(previous)expression+=' + '+previous;
          value=op==='+'?da[position]+db[position]+previous:da[position]*b+previous;
          carry=Math.floor(value/10);
          helpers.push((op==='+'?'Складываем':'Умножаем')+' '+['единицы','десятки','сотни'][position]+'.');
          if(previous)helpers.push('Из '+names[position-1]+' получили ещё '+previous+' '+word(previous,accForms[position])+'. '+(op==='×'?'Прибавь это количество после умножения.':'Прибавь это количество к сумме.'));
          hint=expression+' = '+value+'. '+(carry&&position<columns-1?value+' '+word(value,forms[position])+' — это '+carry+' '+word(carry,forms[position+1])+' и '+value%10+' '+word(value%10,forms[position])+'. '+(position===0?'Десятки':'Сотни')+' прибавим в следующем разряде.':'Запишем полученное число.');
          steps.push(step('Сколько '+names[position]+' '+(op==='+'?'получится при сложении?':'получится после умножения'+(previous?' и прибавления переноса':'')+'?'),value,hint,recordColumn(expression,value,carry>0&&position<columns-1),helpers));
        }
      }
      return result(id,index,(op==='+'?'Сложи':op==='-'?'Вычти':'Умножь')+' столбиком: '+a+' '+(op==='-'?'−':op)+' '+b+'.',total,steps,{kind:'column',a:a,b:b,op:op});
    }
    data=[[3,2,4,0,false],[3,2,4,0,true],[5,3,4,7,true],[6,2,3,0,false],[4,5,2,0,true],[7,3,4,9,true],[8,2,5,0,false],[5,4,3,0,true],[9,3,3,7,true],[6,5,4,0,false],[7,4,5,6,true],[8,3,6,7,true]][variant];
    a=data[0];b=data[1];c=data[2];var d=data[3],brackets=data[4],expression=(brackets?'('+a+' + '+b+')':a+' + '+b)+' × '+c+(d?' − '+d:'');
    first=brackets?a+b:b*c;rest=brackets?first*c:a+first;total=rest-d;
    var afterFirst=brackets?first+' × '+c+(d?' − '+d:''):a+' + '+first;
    steps=[step('Какое действие выполнишь первым? Запиши его результат.',first,brackets?'Сначала сложи числа в скобках: '+a+' + '+b+' = '+first+'.':'Умножение выполняют раньше сложения: '+b+' × '+c+' = '+first+'.',expression+' = '+afterFirst,[brackets?'Начни с действия в скобках.':'Сначала выполняют умножение, затем сложение.','Сохрани остальные числа и знаки.']),
      step('Какой результат получится после следующего действия?',rest,brackets?'Теперь умножь '+first+' на '+c+': получится '+rest+'.':'Теперь сложи '+a+' и '+first+': получится '+rest+'.',afterFirst+' = '+rest+(d?' − '+d:''),['Используй результат первого действия.','Посмотри, какое действие теперь нужно выполнить.'])];
    if(d)steps.push(step('Вычисли оставшееся действие. Чему равно всё выражение?',total,'Осталось вычесть: '+rest+' − '+d+' = '+total+'.',rest+' − '+d+' = '+total,['Умножение уже выполнено.','Закончи вычитанием.']));
    return result(id,index,'Вычисли: '+expression+'.',total,steps);
  }
  return {topics:topics,make:make,examplesPerTopic:12,sourceNote:'Авторские задания по темам указанных учебников. Источники и страницы разделов указаны в sources.js.'};
}));
