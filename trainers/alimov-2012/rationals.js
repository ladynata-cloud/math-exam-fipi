(function () {
  'use strict';
  const {add, lessons, example} = window.MathExamTopicPractice;
  const order = [];
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  function decimal(numerator, denominator) {
    const n = Math.abs(numerator), seen = new Map(), steps = [];
    let remainder = n % denominator;
    while (remainder && !seen.has(remainder)) {
      seen.set(remainder, steps.length);
      const dividend = 10 * remainder, next = dividend % denominator;
      steps.push({remainder, digit: Math.floor(dividend / denominator), next});
      remainder = next;
    }
    const prefix = remainder ? seen.get(remainder) : steps.length;
    const digits = steps.map(step => step.digit).join('');
    const fractional = digits.slice(0, prefix) + (remainder ? '(' + digits.slice(prefix) + ')' : '');
    const label = (numerator < 0 ? '−' : '') + Math.floor(n / denominator) + (digits ? ',' + fractional : '');
    return {steps, prefix, period: steps.length - prefix, label};
  }
  function question(prompt, answer, calculation, error, wrong, diagnosis) {
    return {prompt, answer, calculation, error, mistakes:[[wrong,diagnosis]]};
  }
  function register(key, reference, title, aim, rule, guide, make) {
    add(19, key, 6, title, aim, rule, 'core-fraction-reduce', make);
    const id = '19-' + key;
    Object.assign(lessons.get(id), {printedReference:'Упражнение №' + reference, printedGuide:guide});
    order.push(id);
  }
  function divisionFigure(sequence, denominator) {
    const length = Math.min(6, sequence.steps.length);
    const height = 54 + 25 * length;
    let parts = '<text x="14" y="20">Делимое : '+denominator+'</text><text x="137" y="20">Цифра</text><text x="207" y="20">Остаток</text>';
    for (const [i, step] of sequence.steps.slice(0, length).entries()) {
      const y=43 + 25*i;
      parts += '<path d="M10 '+(y+5)+'H279" stroke="#d7e6e4"/><text x="22" y="'+y+'">10 · '+step.remainder+'</text><text x="155" y="'+y+'" fill="#086052">'+step.digit+'</text><text x="232" y="'+y+'">'+step.next+'</text>';
    }
    const end = sequence.period ? 'Повтор остатка начинает тот же цикл' : 'Остаток 0 завершает деление';
    return '<svg viewBox="0 0 290 '+height+'" role="img" aria-label="Деление с остатком, по строкам показаны цифры и следующие остатки"><g fill="#1e3944" font-size="14">'+parts+'<text x="12" y="'+(height-4)+'" font-size="12">'+end+'</text></g></svg>';
  }
  function shiftFigure(data) {
    const {scaleA,scaleB,high,low,repeat}=data.shift;
    const row=(y,k,whole)=>'<text x="12" y="'+y+'">'+k+' · |x|</text><text x="108" y="'+y+'">'+whole+',</text><rect x="156" y="'+(y-16)+'" width="105" height="22" rx="3" fill="#d9efeb"/><text x="165" y="'+y+'">'+repeat+repeat+'…</text>';
    return '<svg viewBox="0 0 290 109" role="img" aria-label="Две строки с одинаковым периодическим хвостом"><g font-size="15" fill="#1d3942">'+row(26,scaleA,low)+row(61,scaleB,high)+'<path d="M9 73H275" stroke="#315a64"/><text x="12" y="96" font-size="13">При вычитании одинаковые хвосты исчезают</text></g></svg>';
  }
  window.MathExamTopicEdition = {
    trainerId:'alimov-2012', storePrefix:'math:alimov-2012:v1:', authors:'Алимов и др. · 18-е издание · 2012',
    grade:()=>'10–11 классы', unit:'упражнение', nextId:lesson=>order[order.indexOf(lesson.id)+1],
    source:(_book,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000033.pdf#page='+(page+1),
    figure:data=>data.chart==='shifts'?shiftFigure(data):divisionFigure(data.sequence,data.denominator)
  };
  function divisionPractice(numerator, denominator, context, table) {
    const sequence=decimal(numerator,denominator), sign=Math.sign(numerator), size=Math.abs(numerator);
    const digit=sequence.steps[0]?.digit || 0, firstRemainder=size%denominator;
    const whole=Math.trunc(numerator/denominator);
    const tenths=sign*(10*Math.abs(whole)+digit);
    const data=example(context+' Делим модуль, знак возвращаем к результату. В последнем вопросе у конечной дроби считай длину повторяющегося хвоста равной нулю.',table.headers,table.rows,[
      question('Сколько целых десятых получится, если отбросить цифры правее десятых? Введи целое число со знаком.',tenths,
        'Целая часть модуля '+Math.abs(whole)+', следующая цифра '+digit+'. На знак и целую часть тоже приходится своя доля: получается '+tenths+' десятых.',
        'Например, число −2,37 после отсечения даёт −23 целых десятых.',tenths+sign*10,
        'Добавлена лишняя единица целой части, то есть десять десятых. Возьми целую часть частного и ровно одну следующую цифру.'),
      question('Какой остаток получается после вычисления первой цифры справа от запятой?',10*firstRemainder%denominator,
        'После отделения целой части остаётся '+firstRemainder+'. Следующее делимое '+10*firstRemainder+'. Вычти '+digit+' · '+denominator+' и получи '+(10*firstRemainder%denominator)+'.',
        'Остаток должен быть не меньше нуля и строго меньше делителя.',denominator,
        'Остаток не может равняться делителю. При равенстве можно вычесть делитель ещё один раз.'),
      question('Сколько цифр в кратчайшем повторяющемся периоде? Введи 0 для конечной записи.',sequence.period,
        'Запись результата '+sequence.label+'. '+(sequence.period?'При возвращении прежнего остатка повторятся следующие '+sequence.period+' цифр.':'Нулевой остаток означает, что больше цифр вычислять не нужно.'),
        'Записывай ненулевые остатки до первого повтора. Цифры до начала цикла в длину периода не входят.',sequence.period+1,
        'Строку, в которой прежний остаток встретился снова, не нужно считать началом ещё одного нового шага.')
    ],'division');
    return Object.assign(data,{sequence,denominator});
  }
  const direct=[
    ['1a','1(1)','Период из одной цифры','Для 2/3 раздели 20 на 3: цифра 6 и снова остаток 2. Теперь весь следующий шаг такой же. Ответ 0,(6).',3,[1,2],1],
    ['1b','1(2)','Два разных остатка в цикле','В делении 8 на 11 получается 80=7·11+3, затем 30=2·11+8. Остаток 8 вернулся, поэтому результат 0,(72).',11,[1,2,3,4,5,6,7,8,9,10],1],
    ['1c','1(3)','Нулевой остаток после одной цифры','У 3/5 первая цифра после запятой равна 6: 30=6·5. Остаток нулевой, так что ответ 0,6.',5,[1,2,3,4],1],
    ['1d','1(4)','Конечная дробь со знаком минус','Сначала раздели 3 на 4. Из 30 берутся 7 четвёрок, остаётся 2. Следующие 20 делятся без остатка и дают 5. С минусом выходит −0,75.',4,[1,3],-1],
    ['1e','1(5)','Период дробной части отрицательного смешанного числа','У числа −8 2/7 знак минус относится ко всей величине. Для 2/7 остатки идут 2, 6, 4, 5, 1, 3, снова 2. Получаются цифры 285714, значит ответ −8,(285714).',7,[1,2,3,4,5,6],-1],
    ['1f','1(6)','Деление на 99','Для 13/99 получаем 130=1·99+31 и 310=3·99+13. Повтор исходного остатка 13 даёт ответ 0,(13).',99,[13,14,16,17,19,23,25,26,28,29,31],1]
  ];
  for(const [key,ref,title,guide,denominator,residues,sign] of direct) {
    register(key,ref,title,'Преврати дробь в десятичную запись и объясни, почему деление завершится или войдёт в цикл.',
      'Каждая следующая цифра получается при делении десятикратного остатка. Нуль завершает запись. Одинаковые ненулевые остатки дают одинаковое продолжение.',guide,s=>{
      const whole=s+1, remainder=residues[(s-1)%residues.length],num=sign*(whole*denominator+remainder);
      return divisionPractice(num,denominator,'Запиши новую обыкновенную дробь как десятичную.',{headers:['Числитель','Знаменатель'],rows:[[num,denominator]]});
    });
  }
  const sums=[
    ['2a','2(1)','Сложить дроби со знаменателями 11 и 9','Приведи 2/11 и 1/9 к знаменателю 99: получается (18+11)/99=29/99. При делении возвращается прежний остаток после цифр 2 и 9. Ответ 0,(29).',11,9,'+'],
    ['2b','2(2)','Сложить дроби со знаменателями 13 и 3','Общий знаменатель для 8/13 и 2/3 равен 39. Получаем (24+26)/39=50/39. После целой единицы остаётся 11/39, цикл даёт 282051. Ответ 1,(282051).',13,3,'+'],
    ['2c','2(3)','Прибавить конечную десятичную дробь к трети','Число 1,25 равно 5/4. Сумма 1/3+5/4 равна 19/12. Начало десятичной записи 1,58, дальше остаётся один и тот же остаток, дающий цифру 3. Ответ 1,58(3).',3,100,'+'],
    ['2d','2(4)','Отличить 0,33 от одной трети','Для 1/6+0,33 приведи дроби к знаменателю 300: (50+99)/300=149/300. Цифры после запятой 4, 9, затем снова и снова 6. Получается 0,49(6).',6,100,'+'],
    ['2e','2(5)','Сокращение до умножения','В произведении (3/14)·1,05 замени десятичную дробь на 21/20. Сократи 21 и 14 на 7: получится 9/40=0,225. Остаток в конце равен нулю.',14,100,'×'],
    ['2f','2(6)','Умножение с непериодическим началом','Замени 1,7 на 17/10, умножь на 7/9. Получается 119/90. У остатка после цифры десятых начинается период из двоек, поэтому ответ 1,3(2).',9,10,'×']
  ];
  for(const [key,ref,title,guide,d1,d2,op] of sums) {
    register(key,ref,title,'Выполни операцию точно, затем раздели числитель на знаменатель.',
      'Десятичную дробь с двумя цифрами после запятой можно записать со знаменателем 100. При сложении сначала найди общий знаменатель. При умножении перемножь числители и знаменатели и сократи.',guide,s=>{
      const n1=d1*s+1,n2=key==='2e'?5*(s+1)+1:key==='2d'?11*(s+1):2*s+1;
      const top=op==='+'?n1*d2+n2*d1:n1*n2,bottom=d1*d2,k=gcd(top,bottom);
      return divisionPractice(top/k,bottom/k,'Сначала вычисли ('+n1+'/'+d1+') '+op+' ('+n2+'/'+d2+'). Для вопросов об остатках используй сокращённую дробь.',
        {headers:['Первый числитель','Первый знаменатель','Второй числитель','Второй знаменатель'],rows:[[n1,d1,n2,d2]]});
    });
  }
  const inverse=[
    ['3a','3(1)','Одна цифра периода','При x=0,(6) вычти x из 10x. Получается 9x=6, так что x=2/3.',0,1,1],
    ['3b','3(2)','Целая часть перед периодом','Для x=1,(55) вычитание x из 100x даёт 99x=155−1=154. После сокращения x=14/9.',0,2,1],
    ['3c','3(3)','Одна неповторяющаяся цифра','У x=0,1(2) сначала умножь на 10, чтобы пройти цифру 1. Вычти 10x из 100x: 90x=12−1=11, поэтому x=11/90.',1,1,1],
    ['3d','3(4)','Отрицательная чисто периодическая дробь','Для модуля 0,(8) получается 9|x|=8. Возвращаем минус: x=−8/9.',0,1,-1],
    ['3e','3(5)','Отрицательное число с двумя цифрами периода','Пусть |x|=3,(27). Из 100|x|−|x| получаем 99|x|=327−3=324. Сокращение даёт 36/11, а с исходным знаком ответ −36/11.',0,2,-1],
    ['3f','3(6)','Отрицательное число с предпериодом и периодом','У |x|=2,3(82) сдвиги в 10 и 1000 раз дают одинаковый хвост. Поэтому 990|x|=2382−23=2359. Ответ −2359/990.',1,2,-1]
  ];
  for(const [key,ref,title,guide,prefix,size,sign] of inverse){
    register(key,ref,title,'Удали одинаковую бесконечную часть вычитанием и получи сокращённую обыкновенную дробь.',
      'Первый сдвиг переносит запятую к началу периода. Второй переносит её на целый период дальше. После вычитания одинаковые дробные хвосты исчезают.',guide,s=>{
      const scaleA=10**prefix,scaleB=scaleA*10**size,whole=s+1,pre=prefix?1+s%7:0;
      const repeat=String(size===1?1+s%7:[13,17,26,28,34,37,46,53,58,62,74][s-1]);
      const low=scaleA*whole+pre,high=10**size*low+Number(repeat),num=sign*(high-low),den=scaleB-scaleA,k=gcd(num,den);
      const display=(sign<0?'−':'')+whole+','+(prefix?pre:'')+'('+repeat+')';
      const data=example('Восстанови точную обыкновенную дробь для '+display+'. Схема показывает сдвиги модуля числа.', ['Целая часть модуля','Цифр до периода','Период'],[[whole,prefix,repeat]],[
        question('Каков коэффициент при |x| после вычитания двух сдвинутых равенств?',den,
          'Больший множитель '+scaleB+', меньший '+scaleA+'. Их разность равна '+den+'.','Каждая цифра сдвига умножает число на 10. После этого множители нужно вычесть.',scaleB,'Учтён только более длинный сдвиг. Из него вычитается и первое равенство.'),
        question('Какой числитель со знаком останется до сокращения?',num,
          'Вычти '+low+' из '+high+' и верни исходный знак. Получается '+num+'.','Одинаковые хвосты сократились. Сравни целые части сдвинутых чисел.',-num,'Знак числителя должен совпадать со знаком исходной периодической дроби.'),
        question('Каков положительный знаменатель после полного сокращения?',den/k,
          'Наибольший общий делитель '+Math.abs(num)+' и '+den+' равен '+k+'. Получается '+num/k+'/'+den/k+'.','Раздели обе части дроби на их наибольший общий делитель.',0,'Знаменатель дроби не может равняться нулю. Перед сокращением он равен разности двух различных степеней десяти.')
      ],'shifts');
      return Object.assign(data,{shift:{scaleA,scaleB,high,low,repeat}});
    });
  }
})();
