(function () {
  'use strict';
  const {add, example, task, f} = window.MathExamTopicPractice;
  const question = (prompt, answer, calculation, error, mistakes) => ({
    ...task(prompt, answer, calculation, error), mistakes
  });
  function tiles(values, centers) {
    const width = 38;
    const cells = values.map((value, index) => {
      const x = 12 + index * width;
      const marked = centers.includes(index);
      const outline = marked ? '#6f3c10' : '#376b72';
      return '<g><rect x="' + x + '" y="12" width="32" height="33" rx="4" stroke="' + outline +
        '" stroke-width="' + (marked ? 3 : 1) + '" fill="' + (marked ? '#fff1da' : '#eff9f8') + '"/>' +
        '<text x="' + (x+16) + '" y="34" text-anchor="middle" fill="#18343c" font-size="16">' + value + '</text>' +
        (marked ? '<path d="M' + (x+12) + ' 51l4 -4 4 4" fill="none" stroke="' + outline + '" stroke-width="2"/>' : '') + '</g>';
    }).join('');
    return '<svg viewBox="0 0 ' + (20+width*values.length) + ' 57" role="img" aria-label="Ряд по возрастанию. Средние места отмечены стрелками">' + cells + '</svg>';
  }
  function dots(values) {
    const unique = [...new Set(values)].sort((a,b)=>a-b);
    const left=25, scale=220/(unique.at(-1)-unique[0]);
    const marks=unique.map(value=>{
      const x=left+(value-unique[0])*scale, count=values.filter(n=>n===value).length;
      return '<g><text x="'+x+'" y="88" font-size="14" text-anchor="middle" fill="#18343c">'+value+'</text>'+
        Array.from({length:count},(_,i)=>'<circle cx="'+x+'" cy="'+(61-i*15)+'" r="5.5" fill="#267773"/>').join('')+'</g>';
    }).join('');
    return '<svg viewBox="0 0 273 96" role="img" aria-label="Каждая точка изображает одну попытку. Высота столбика показывает, сколько раз повторился результат"><path d="M15 71H258" fill="none" stroke="#47606b"/>'+marks+'</svg>';
  }
  window.MathExamTopicEdition = {
    trainerId:'makarychev7-2014', storePrefix:'math:makarychev7-2014:v1:', authors:'Макарычев и др. · издание 2014 года',
    grade:()=>'7 класс', unit:'пункт', nextId:lesson=>lesson.book+'-'+(lesson.point+1),
    source:(_book,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000074.pdf#page='+page,
    figure:data=>data.chart==='dots' ? dots(data.measurements) : tiles(data.sorted,data.centers)
  };
  add(95,9,36,'Среднее, размах и мода','Сравни результаты пяти попыток. Какое число чаще всего получалось и насколько различались крайние результаты?',
    'В диаграмме каждая точка — одна попытка. Для среднего учти каждую точку, для размаха найди расстояние между крайними значениями, для моды сравни высоту столбиков.','sec-statistics',s=>{
      const base=5+s, gap=2+s%3, other=base+gap, last=other+gap+1;
      const values=[other,base,other,last,other], sum=values.reduce((total,v)=>total+v,0), range=last-base;
      const data=example('Сколько фишек попало в цель за пять попыток',['Попытка','Попадания'],values.map((v,i)=>[i+1,v]),[
        question('Сколько фишек в среднем попадало в цель за одну попытку?',sum/5,'Всего '+sum+' попаданий за 5 попыток. Среднее равно '+sum+' / 5.',
          'Сосчитай все пять результатов, даже если некоторые совпадают.',[[sum,'Ты нашёл сумму попаданий. Сколько было попыток?'],[sum/3,'Три столбика означают три разных результата. Отдельных попыток было пять.']]),
        question('Чему равен размах числа попаданий?',range,'Расстояние от '+base+' до '+last+' равно '+last+' − '+base+'.',
          'Посмотри на крайние подписанные значения под точками.',[[last,'Это самый большой результат. Из него ещё нужно вычесть самый маленький.'],[3,'Это число разных результатов. Для размаха измерь расстояние между крайними значениями.']]),
        question('Какова мода числа попаданий?',other,'Над отметкой '+other+' стоят три точки, над остальными по одной.',
          'Найди самый высокий столбик и прочитай число под ним.',[[3,'Ты указал частоту. Запиши, какой результат повторился трижды.'],[last,'Самое большое число и самое частое число здесь различаются.']])
      ],'dots');
      data.measurements=values;
      return data;
    });
  add(95,10,42,'Медиана нечётного и чётного ряда','Упорядочь время шести сборок. Сравни середину ряда из пяти результатов и середину ряда после шестой сборки.',
    'Сначала расположи значения по возрастанию. У пяти чисел центральное место одно. У шести чисел центральных мест два, а медиана находится ровно между их значениями.','sec-statistics',s=>{
      const a=3+s, b=a+2, c=b+1, d=c+3, e=d+2, extra=e+4+s%3;
      const first=[e,a,b,d,c], all=[...first,extra], sorted=[a,b,c,d,e,extra], median=(c+d)/2;
      const data=example('Время сборки головоломки. Шестая попытка добавлена последней. На рисунке все шесть времён уже упорядочены.',['Попытка','Время, мин'],all.map((v,i)=>[i+1,v]),[
        question('Какова медиана времени только первых пяти сборок, в минутах?',c,'Без шестой попытки упорядоченный ряд таков: '+[a,b,c,d,e].join(', ')+'. Посередине стоит '+c+'.',
          'Исключи шестую попытку и расположи пять оставшихся времён по порядку.',[[b,'Это третья запись в исходной таблице. Сначала упорядочь времена.'],[median,'Сейчас нужны только первые пять сборок. Закрой последний результат.']]),
        question('Какова медиана после добавления шестой попытки, в минутах?',median,'Третье и четвёртое значения — '+c+' и '+d+'. Их середина равна ('+c+' + '+d+') / 2.',
          'На рисунке стрелки отмечают оба центральных места. Найди среднее этих двух значений.',[[c,'Ты выбрал левое из двух центральных значений. Учти и правое.'],[d,'Ты выбрал правое из двух центральных значений. Учти и левое.'],[c+d,'Это сумма средних двух значений. Найди её половину.']]),
        question('Ещё более медленная шестая сборка заняла бы '+(extra+5)+' минут. Какой тогда была бы медиана всех шести времён?',median,'Шестая попытка остаётся самой долгой. В середине по-прежнему '+c+' и '+d+', поэтому медиана равна '+f(median)+'.',
          'Передвинь только последний результат вправо. Проверь, поменяются ли значения на двух средних местах.',[[median+5,'Изменилось последнее время. Посмотри, могло ли оно стать третьим или четвёртым.'],[c,'У чётного ряда два средних места.']])
      ],'ordered');
      data.sorted=sorted; data.centers=[2,3];
      return data;
    });
})();
