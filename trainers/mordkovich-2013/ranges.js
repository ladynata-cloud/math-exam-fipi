(function () {
  'use strict';
  const {add,lessons,example}=window.MathExamTopicPractice,course=window.MathExamTopicEdition;
  const ranges=[
    {key:'7-11a',letter:'а',expr:'1 − (cos²t − sin²t)',short:'2sin²t',low:0,high:2,open:false,
      guide:'Замени 1 на cos²t + sin²t. Получается 2sin²t. При t = 0 значение равно 0, а при t = π/2 — 2. Минимум 0 и максимум 2 достигаются.'},
    {key:'7-11b',letter:'б',expr:'1 − sin t · cos t · tg t',short:'cos²t',low:0,high:1,open:true,
      guide:'Тангенс требует cos t ≠ 0. Только на этой области исходная запись равна 1 − sin²t = cos²t. Числа сколь угодно близки к 0, но сам 0 невозможен. Наименьшего значения нет. Максимум 1 достигается, например, при t = 0.'},
    {key:'7-11c',letter:'в',expr:'sin t + 3sin²t + 3cos²t',short:'3 + sin t',low:2,high:4,open:false,
      guide:'Тройка умножена на сумму квадратов, то есть на единицу. Остаётся 3 + sin t. Наименьшее значение 2 получается при sin t = −1, наибольшее 4 — при sin t = 1.'},
    {key:'7-11d',letter:'г',expr:'cos²t · tg²t + 5cos²t − 1',short:'4cos²t',low:0,high:4,open:true,
      guide:'Тангенс исключает нулевой косинус. На допустимых углах cos²t · tg²t = sin²t. После замены 1 на сумму квадратов остаётся 4cos²t. Множество значений — (0; 4]. Наименьшего значения нет, максимум 4 достигается при t = 0.'}
  ];
  function sample(row,seed){
    const offset=seed-6,k=(seed%2?1:-1)*(1+seed%4);
    const ends=[offset+k*row.low,offset+k*row.high],lo=Math.min(...ends),hi=Math.max(...ends);
    const openLeft=row.open&&k>0,openRight=row.open&&k<0;
    const count=hi-lo+1-Number(openLeft)-Number(openRight);
    const caption='Пусть E = '+row.expr+'. Рассмотри F = '+offset+(k>0?' + ':' − ')+Math.abs(k)+' · E.';
    const why='На допустимых углах E = '+row.short+'. При умножении на отрицательное число порядок концов меняется.';
    const data=example(caption,['Преобразование','Значение'],[['Сдвиг',offset],['Множитель',k]],[
      {prompt:'Чему равна нижняя граница всех значений F? Введи число, даже если сама граница недостижима.',
       answer:lo,calculation:why+' Подставь оба крайних значения E. Меньший результат равен '+lo+'.',
       error:'Вычисли обе границы до проверки, достигается ли каждая из них.',
       mistakes:[[hi,'Это верхняя граница. Сравни оба числа после умножения и сдвига.'],[lo-1,'Недостижимая точка границы остаётся границей. Не нужно уменьшать её ещё на единицу.']]},
      {prompt:'Чему равна верхняя граница значений F? Введи её даже при выколотом конце интервала.',
       answer:hi,calculation:why+' Больший из двух результатов равен '+hi+'.',
       error:'Учитывай и множитель, и сдвиг. Проверь, не перевернулся ли отрезок.',
       mistakes:[[lo,'Это нижний край после преобразования. Выбери больший из двух концов.'],[hi+1,'Даже если крайняя точка не достигается, её координата не сдвигается.']]},
      {prompt:'Сколько целых чисел действительно принимает F? Проверь оба края по исходной формуле.',
       answer:count,calculation:'От '+lo+' до '+hi+' включительно '+(hi-lo+1)+' целых. '+(row.open?'Один край недостижим из-за исходного тангенса.':'Оба края достигаются.')+' В ответе '+count+'.',
       error:'Вычисли длину между целыми концами, прибавь единицу и вычти число выколотых концов.',
       mistakes:[[row.open?count+1:count-1,row.open?'В счёт попала крайняя точка, которая требует cos t = 0. Тангенс там не существует.':'Обе крайние точки допустимы. Не потеряй первую при подсчёте целых.']]}
    ],'range');
    return Object.assign(data,{lo,hi,openLeft,openRight,offset,k});
  }
  function figure(d){
    const dot=(x,open)=>'<circle cx="'+x+'" cy="57" r="6" stroke="#1f6a61" stroke-width="3" fill="'+(open?'white':'#1f6a61')+'"/>';
    return '<svg viewBox="0 0 280 126" role="img" aria-label="Границы множества значений с открытыми и закрытыми концами"><g font-size="13" fill="#234149">'+
      '<text x="12" y="20">Какие значения принимает F?</text><path d="M13 57H267" stroke="#617e83"/><path d="M52 57H224" stroke="#28877b" stroke-width="4"/>'+
      dot(52,d.openLeft)+dot(224,d.openRight)+'<text x="52" y="84" text-anchor="middle">'+d.lo+'</text><text x="224" y="84" text-anchor="middle">'+d.hi+'</text>'+
      '<text x="12" y="110">○ граница без значения</text><text x="170" y="110">● достигается</text></g></svg>';
  }
  const previousFigure=course.figure,previousNext=course.nextId;
  course.figure=d=>d.chart==='range'?figure(d):previousFigure(d);
  course.nextId=lesson=>{
    const i=ranges.findIndex(row=>'21-'+row.key===lesson.id);
    if(i>=0)return ranges[i+1]?'21-'+ranges[i+1].key:'21-7-12a';
    return previousNext(lesson) || (lesson.id==='21-7-10d'?'21-7-11a':undefined);
  };
  for(const row of ranges){
    add(21,row.key,20,'Границы значений '+row.short,'Выясни, достигаются ли обе границы. Отличай наименьшее значение от нижней границы.',
      'Сначала установи область допустимых углов исходной записи. Затем упрости выражение до функции синуса или косинуса и проверь каждый край подстановкой.',
      'core-trig-graph',seed=>sample(row,seed));
    Object.assign(lessons.get('21-'+row.key),{printedReference:'Упражнение №7.11'+row.letter,
      printedPrompt:'Исследуй '+row.expr+'. Найди достижимые крайние значения и объясни, если какой-то край недостижим.',printedGuide:row.guide});
  }
})();
