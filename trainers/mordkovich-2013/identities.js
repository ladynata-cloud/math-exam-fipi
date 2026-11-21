(function () {
  'use strict';
  const {add, lessons, example, f} = window.MathExamTopicPractice;
  const rows = [
    ['7-1a','7.1а','Остаток после sin²t','1 − sin²t','cos',1,'В единице уже заключены обе части. Если убрать sin²t, останется cos²t.'],
    ['7-1b','7.1б','Вычитание целого из cos²t','cos²t − 1','sin',-1,'Вычитаешь большее из меньшего. Из cos²t вычти сумму cos²t + sin²t: останется −sin²t.'],
    ['7-1c','7.1в','Остаток после cos²t','1 − cos²t','sin',1,'Сумма квадратов координат равна единице. Удали cos²t из этой суммы и получи sin²t.'],
    ['7-1d','7.1г','Вычитание целого из sin²t','sin²t − 1','cos',-1,'Поменяй порядок вычитания и сохрани минус: sin²t − 1 = −(1 − sin²t) = −cos²t.'],
    ['7-2a','7.2а','Две скобки с синусом','(1 − sin t)(1 + sin t)','cos',1,'При умножении средние слагаемые уничтожаются. Остаётся разность квадратов 1 − sin²t, то есть cos²t.'],
    ['7-2b','7.2б','Два равных слагаемых','cos²t + 1 − sin²t','cos',2,'Объедини 1 − sin²t в скобки. Это ещё один cos²t, поэтому итог равен 2cos²t.'],
    ['7-2c','7.2в','Две скобки с косинусом','(1 − cos t)(1 + cos t)','sin',1,'Произведение суммы и разности равно 1 − cos²t. Оставшаяся часть единицы — sin²t.'],
    ['7-2d','7.2г','Выделить единицу','sin²t + 2cos²t − 1','cos',1,'Отдели один cos²t. Сумма sin²t + cos²t равна 1. После вычитания единицы останется ещё один cos²t.']
  ];
  const triangles = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37],[9,40,41],[28,45,53],[11,60,61],[16,63,65],[33,56,65]];
  const square = v => v*v;
  function practice(row, seed) {
    const [,, ,expression, term, factor] = row;
    const triangle = triangles[(seed-1)%triangles.length];
    const [s,c,r] = seed%2 ? triangle : [triangle[1],triangle[0],triangle[2]];
    const part = term === 'cos' ? c : s, other = term === 'cos' ? s : c;
    const otherName = term === 'cos' ? 'sin' : 'cos';
    const numerator = square(part), denominator = square(r), result = factor*numerator/denominator;
    const changed = 2 + seed%7, total = 2*changed + 1 + seed%3;
    const signedFactor = factor<0 ? '−' : factor===2?'2·':'';
    const data = example('Пусть sin t = '+s+'/'+r+' и cos t = '+c+'/'+r+'. Рассмотри выражение '+expression+'.',
      ['Координата','Числитель','Знаменатель'],[['sin t',s,r],['cos t',c,r]],[
        {prompt:'Запиши '+term+'²t с исходным знаменателем в квадрате. Каков числитель?',
         answer:numerator, calculation:'Возводим в квадрат числитель '+part+': получаем '+numerator+'.',
         error:'Квадрат дроби — это квадрат числителя, делённый на квадрат знаменателя.',
         mistakes:[[part,'Ты сохранил длину проекции. Для площади квадрата умножь '+part+' само на себя.'],[square(other),'Выбрана другая координата. Здесь нужна '+term+' t.']]},
        {prompt:'Подставь координаты в исходное выражение '+expression+'. Чему оно равно?',
         answer:result, calculation:row[6]+' На этих данных получается '+signedFactor+numerator+'/'+denominator+' = '+f(result)+'.',
         error:'Сначала преобразуй выражение, затем возведи выбранную координату в квадрат. Сохрани знак и коэффициент.',
         mistakes:[[factor===2?numerator/denominator:-result,factor===2?'Это только одно слагаемое. После преобразования остаются два одинаковых.':'Модуль результата верен. Проверь порядок вычитания и знак.'],
           [factor*square(other)/denominator,'Взята другая часть единицы. Установи, квадрат какой функции остаётся в конце.']]},
        {prompt:'Для другого угла известно только '+otherName+'²t = '+changed+'/'+total+'. Найди значение того же выражения.',
         answer:factor*(total-changed)/total, calculation:'Целое равно '+total+'/'+total+'. Остаток '+(total-changed)+'/'+total+'. Учитываем коэффициент '+factor+'.',
         error:'Две части по-прежнему дают единицу. Из целой доли вычти указанную и примени своё тождество.',
         mistakes:[[factor*changed/total,'Подставлена данная доля. В выражении осталась дополнительная до единицы доля.']]}
      ],'squares');
    return Object.assign(data,{s,c,r,term,factor,expression});
  }
  function figure(data) {
    const {s,c,r,term,factor} = data, total = square(r), first = Math.round(250*square(c)/total), label=term+'²t';
    return '<svg viewBox="0 0 280 126" role="img" aria-label="Квадраты координат разбивают единицу на две части"><g font-size="13" fill="#233d48">'+
      '<text x="12" y="19">Целое: '+total+'/'+total+' = 1</text>'+
      '<rect x="12" y="32" width="'+first+'" height="20" fill="#377d84"/><rect x="'+(12+first)+'" y="32" width="'+(250-first)+'" height="20" fill="#c9923a"/>'+
      '<rect x="12" y="66" width="11" height="11" fill="#377d84"/><text x="29" y="76">cos²t = '+square(c)+'/'+total+'</text>'+
      '<rect x="12" y="87" width="11" height="11" fill="#c9923a"/><text x="29" y="97">sin²t = '+square(s)+'/'+total+'</text>'+
      '<text x="12" y="119">Коэффициент при '+label+': '+factor+'</text></g></svg>';
  }
  window.MathExamTopicEdition = {trainerId:'mordkovich-2013',storePrefix:'math:mordkovich-2013:v1:',authors:'Мордкович и др. · 14-е издание · 2013',
    grade:()=>'10–11 классы',unit:'упражнение',source:()=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000085.pdf#page=23',figure,
    nextId:lesson=>{const index=rows.findIndex(row=>'21-'+row[0]===lesson.id);return rows[index+1] && '21-'+rows[index+1][0];}};
  for (const row of rows) {
    const [key,printed,title,expression] = row;
    add(21,key,18,title,'Упрости выражение и проверь, остаётся ли оно верным при других координатах.',
      'Координаты точки единичной окружности дают стороны прямоугольного треугольника. По теореме Пифагора сумма их квадратов равна единице.',
      'core-trig-identity',seed=>practice(row,seed));
    Object.assign(lessons.get('21-'+key),{printedReference:'Упражнение №'+printed,
      printedPrompt:'Запиши '+expression+' с помощью квадрата одной функции. Объясни, что произошло со знаком и числом слагаемых.',printedGuide:row[6]});
  }
})();
