(function (root) {
  'use strict';
  // The original module remains available for old saved attempts. New learning
  // plans connect each written action with a picture of the same quantities.
  const topics = [
    ['fraction-meaning', 'Что означает дробь', 'fractions', 'Равные части одной полоски и запись дроби.'],
    ['fraction-reduce', 'Сокращение дробей', 'fractions', 'Объединяем мелкие доли, сохраняя ту же часть целого.'],
    ['fraction-add', 'Сложение дробей', 'fractions', 'Делаем доли одинаковыми и соединяем их.'],
    ['fraction-multiply', 'Умножение дробей', 'fractions', 'Находим часть от части на прямоугольнике.'],
    ['fraction-divide', 'Деление дробей', 'fractions', 'Смотрим, сколько раз одна длина содержится в другой.'],
    ['decimal-add', 'Сложение десятичных дробей', 'applications', 'Соединяем целые и одинаковые доли целого.'],
    ['percent-part', 'Найти часть по процентам', 'applications', 'Связываем число книг и проценты с помощью пропорции.'],
    ['percent-whole', 'Найти целое по его части', 'applications', 'По известной части узнаём всё количество.'],
    ['percent-ratio', 'Сколько процентов составляет часть', 'applications', 'Выражаем отношение части к целому в процентах.']
  ].map(([id, title, stage, description]) => ({ id, title, stage, description, source: 'princev' }));
  const ids = new Set(topics.map(t => t.id));
  const data = {
    meaning: [[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[4,5],[1,6],[5,6],[3,8],[7,10]],
    reduce: [[2,4],[3,6],[4,6],[6,8],[6,9],[8,10],[10,15],[12,18],[15,20],[18,24],[21,28],[24,36]],
    add: [[1,2,1,4],[1,3,1,6],[2,5,1,10],[1,4,1,6],[1,2,2,3],[3,8,1,4],[1,6,1,9],[2,3,1,12],[3,10,1,5],[5,12,1,8],[2,7,3,14],[5,6,1,3]],
    multiply: [[1,2,1,3],[2,3,3,4],[3,5,5,6],[2,7,7,8],[3,4,2,9],[5,6,3,10],[4,5,5,8],[5,9,3,5],[7,10,5,14],[3,8,4,9],[5,12,6,7],[7,9,3,14]],
    divide: [[1,2,1,4],[2,3,1,6],[3,4,3,8],[2,5,4,5],[5,6,5,9],[3,7,6,7],[4,9,2,3],[5,8,5,12],[7,10,7,15],[3,5,9,10],[5,12,5,6],[7,8,7,10]],
    decimal: [[120,35],[245,130],[308,270],[456,78],[675,225],[84,190],[730,405],[999,101],[1250,375],[608,92],[1425,86],[1870,245]],
    percent: [[80,25],[120,15],[240,20],[360,35],[500,12],[600,8],[160,75],[420,30],[700,14],[900,18],[1250,16],[2500,7]]
  };
  const gcd = (a,b) => b ? gcd(b,a%b) : a;
  const f = (n,d) => n + '/' + d;
  const reduced = (n,d) => { const g=gcd(n,d); return d/g===1 ? String(n/g) : f(n/g,d/g); };
  const decimal = n => (n/100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  const word = (n, forms) => forms[n%100>=11&&n%100<=14?2:n%10===1?0:n%10>=2&&n%10<=4?1:2];
  const books = n => n+' '+word(n,['книга','книги','книг']);
  const equalParts = n => n+' '+word(n,['равную часть','равные части','равных частей']);
  const parts = d => ({2:'половин',3:'третьих долей',4:'четвертей',5:'пятых долей',6:'шестых долей',8:'восьмых долей',10:'десятых долей',12:'двенадцатых долей'})[d] || 'долей размера 1/' + d;
  function step(prompt,answer,hint,record,helper=[],checkKind) {
    return {prompt,answer:String(answer),hint,record,helper,...(checkKind?{checkKind}:{})};
  }
  function plan(topicId,index,prompt,answer,steps,visual,introduction) {
    if (visual.kind === 'percent') {
      const {whole,part,percent,unknown}=visual;
      steps[0].beforeHelper = unknown==='part'
        ? ['100% — все '+whole+' книг',percent+'% — x книг','Пропорция: x/'+whole+' = '+percent+'/100']
        : unknown==='whole'
          ? ['100% — x книг',percent+'% — '+books(part),'Пропорция: '+part+'/x = '+percent+'/100']
          : ['100% — все '+whole+' книг','x% — '+books(part),'Пропорция: x/100 = '+part+'/'+whole];
    }
    return {topicId,index,revision:2,kind:'standard',prompt,answer:String(answer),steps,visual,introduction};
  }
  function commonSteps(a,b,c,d,common,steps,states) {
    let left={n:a,d:b}, right={n:c,d};
    if(b!==common) {
      const n=a*common/b;
      steps.push(step('Сколько '+parts(common)+' составляет '+f(a,b)+'?',n,
        'Каждую долю первой полоски разделим ещё на '+equalParts(common/b)+'. Закрашенная длина останется прежней.',
        f(a,b)+' = '+f(n,common),['Целые полоски одинаковой длины.','Размер одной новой доли: 1/'+common]));
      left={n,d:common}; states.push({phase:'common',aShown:{...left},bShown:{...right}});
    }
    if(d!==common) {
      const n=c*common/d;
      steps.push(step('Сколько '+parts(common)+' составляет '+f(c,d)+'?',n,
        'Так же разделим доли второй полоски: каждую на '+equalParts(common/d)+'. Число долей изменится, а длина сохранится.',
        f(c,d)+' = '+f(n,common),['У обеих полосок теперь доли одного размера.']));
      right={n,d:common}; states.push({phase:'common',aShown:{...left},bShown:{...right}});
    }
  }
  function make(topicId,index=0) {
    if(!ids.has(topicId)) throw Error('Неизвестная тема дробей и процентов.');
    if(!Number.isSafeInteger(index)||index<0||index>1000000) throw Error('Неверный номер упражнения.');
    const k=index%12;
    if(topicId==='fraction-meaning') {
      const [n,d]=data.meaning[k], answer=f(n,d);
      return plan(topicId,index,'Полоску разделили на равные части. Какая часть полоски закрашена?',answer,[
        step('На сколько равных частей разделена вся полоска?',d,'Посчитай все части полоски: и закрашенные, и незакрашенные.','Всего равных частей: '+d,['Это число записываем в знаменателе.']),
        step('Сколько частей закрашено?',n,'Теперь посчитай только закрашенные части.','Закрашено частей: '+n,['Это число записываем в числителе.']),
        step('Запиши закрашенную часть дробью.',answer,'В числителе будет '+n+', а в знаменателе '+d+'.','Закрашенная часть: '+answer,['Знаменатель показывает, на сколько равных частей разделили целое.','Числитель показывает, сколько таких частей взяли.'])
      ],{kind:'fraction-operation',op:'meaning',a:{n,d},states:[{phase:'given'},{phase:'denominator'},{phase:'counted'},{phase:'result',n,d}]},
      'Вся полоска — одно целое. Дробь помогает назвать несколько её равных частей.');
    }
    if(topicId==='fraction-reduce') {
      const [n,d]=data.reduce[k], g=gcd(n,d), nn=n/g, dd=d/g, answer=reduced(n,d);
      return plan(topicId,index,'На рисунке закрашено '+f(n,d)+' полоски. Запиши ту же часть несократимой дробью.',answer,[
        step('Объедини соседние доли в группы по '+g+'. Сколько крупных частей получится во всей полоске?',dd,
          'Старых долей было '+d+'. В каждую новую часть войдёт '+g+' старых долей, поэтому делим '+d+' на '+g+'.',
          'Частей целого: '+d+' : '+g+' = '+dd,['Длина полоски не меняется.','Границы между мелкими долями объединяем.']),
        step('Какая часть полоски закрашена теперь? Запиши дробь.',answer,
          'Закрашенных мелких долей было '+n+'. Теперь закрашено '+nn+' из '+dd+' крупных частей. Делим числитель и знаменатель на одно число.',
          f(n,d)+' = '+answer,['Закрашенная длина осталась прежней.','Числитель и знаменатель разделили на '+g+'.'],'reduced-fraction')
      ],{kind:'fraction-operation',op:'reduce',a:{n,d},grouping:g,states:[{phase:'given'},{phase:'grouped',n:nn,d:dd},{phase:'result',n:nn,d:dd}]},
      'Сократить дробь — значит назвать ту же часть целого более крупными долями.');
    }
    if(topicId==='fraction-add') {
      const [a,b,c,d]=data.add[k], common=b*d/gcd(b,d), an=a*common/b, cn=c*common/d;
      const n=an+cn, answer=reduced(n,common), expression=f(a,b)+' + '+f(c,d), steps=[],states=[{phase:'given'}];
      commonSteps(a,b,c,d,common,steps,states);
      steps.push(step('Какую часть целого получим вместе? Запиши дробь и сократи её, если можно.',answer,
        'Теперь складываем доли одного размера: '+an+' и '+cn+'. Знаменатель '+common+' сохраняем, потому что размер доли не меняется.',
        f(an,common)+' + '+f(cn,common)+' = '+answer,['Сначала сделали доли одинаковыми.','Теперь соединяем закрашенные части.'],'reduced-fraction'));
      states.push({phase:'result',n,d:common});
      return plan(topicId,index,'Сложи дроби: '+expression+'. Обе полоски обозначают одинаковое целое.',answer,steps,
        {kind:'fraction-operation',op:'add',a:{n:a,d:b},b:{n:c,d},common,states},'Чтобы складывать части, их удобно выразить одинаковыми долями.');
    }
    if(topicId==='fraction-multiply') {
      const [a,b,c,d]=data.multiply[k], n=a*c, den=b*d, answer=reduced(n,den), expression=f(a,b)+' × '+f(c,d);
      return plan(topicId,index,'Найди '+f(a,b)+' от '+f(c,d)+' прямоугольника: '+expression+'.',answer,[
        step('На сколько одинаковых маленьких частей разделился весь прямоугольник?',den,
          'Прямоугольник разделили в одном направлении на '+equalParts(d)+', а в другом — на '+equalParts(b)+'. Всего получилось '+d+' × '+b+' одинаковых клеток.',
          'Всего клеток: '+b+' × '+d+' = '+den,['Сначала выделяем '+f(c,d)+' целого.','Затем берём '+f(a,b)+' от выделенной части.']),
        step('Какая часть целого закрашена дважды? Запиши дробь и сократи её, если можно.',answer,
          'Число дважды закрашенных клеток: '+a+' × '+c+' = '+n+' из '+den+'. Поэтому числители перемножаются, и знаменатели тоже перемножаются.',
          expression+' = '+f(n,den)+(f(n,den)!==answer?' = '+answer:''),['Числитель: количество клеток в пересечении.','Знаменатель: количество клеток во всём прямоугольнике.'],'reduced-fraction')
      ],{kind:'fraction-operation',op:'multiply',a:{n:a,d:b},b:{n:c,d},states:[{phase:'given'},{phase:'grid',n,d:den},{phase:'result',n,d:den}]},
      'Умножить на дробь — значит найти указанную часть. Здесь берём часть уже выделенной части прямоугольника.');
    }
    if(topicId==='fraction-divide') {
      const [a,b,c,d]=data.divide[k], common=b*d/gcd(b,d), an=a*common/b, cn=c*common/d;
      const answer=reduced(a*d,b*c), steps=[],states=[{phase:'given'}], expression=f(a,b)+' : '+f(c,d);
      commonSteps(a,b,c,d,common,steps,states);
      steps.push(step(an%cn===0?'Сколько отрезков длиной '+f(c,d)+' поместится в отрезке длиной '+f(a,b)+'?':
        'Раздели '+f(a,b)+' на '+f(c,d)+'. Если ответ дробный, сократи его.',answer,
        'Обе длины выражены в одинаковых долях: в первой их '+an+', во второй '+cn+'. Находим их отношение: '+an+' : '+cn+'. Это тот же результат, что при умножении на обратную дробь.',
        expression+' = '+f(a,b)+' × '+f(d,c)+' = '+answer,['Обе длины выразили долями одного размера.','Сравниваем первую длину со второй.'],'reduced-fraction'));
      states.push({phase:'result',n:a*d,d:b*c,groups:an/cn});
      return plan(topicId,index,'Выполни деление '+expression+'. Сравним две длины на одинаковых полосках.',answer,steps,
        {kind:'fraction-operation',op:'divide',a:{n:a,d:b},b:{n:c,d},common,states},'Деление показывает, сколько раз вторая длина содержится в первой. Ответ может быть целым или дробным.');
    }
    if(topicId==='decimal-add') {
      const [a,b]=data.decimal[k], af=a%100,bf=b%100, fractional=af+bf, whole=Math.floor(a/100)+Math.floor(b/100), answer=decimal(a+b);
      return plan(topicId,index,'Вычисли: '+decimal(a)+' + '+decimal(b)+'.',answer,[
        step('Сколько сотых получится, если сложить дробные части?',fractional,
          'Одна десятая равна десяти сотым. Число сотых в дробной части первого числа: '+af+', а второго: '+bf+'. Складываем их.',
          decimal(af)+' + '+decimal(bf)+' = '+decimal(fractional),['Целые части пока оставляем на своих местах.','Сотые складываем с сотыми.']),
        step('Соедини целые и найденные сотые. Чему равна вся сумма?',answer,
          'В целых частях вместе '+whole+'. '+(fractional>=100?'Из '+fractional+' сотых выделяем ещё одну целую; остаётся '+(fractional-100)+' сотых.':'К ним прибавляем '+fractional+' сотых.')+' Получается '+answer+'.',
          decimal(a)+' + '+decimal(b)+' = '+answer,['Запятые в записи стоят друг под другом.','Каждые сто сотых образуют одну целую.'])
      ],{kind:'decimal-grid',a,b,scale:100,states:[{phase:'given'},{phase:'fractional-sum',fractionalTotal:fractional},{phase:'result',total:a+b}]},
      'Целые складываем с целыми, десятые с десятыми, сотые с сотыми. На модели одна целая содержит сто маленьких клеток.');
    }
    const [whole,percent]=data.percent[k], part=whole*percent/100;
    const visual={kind:'percent',whole,percent,part,quantity:'книг'};
    if(topicId==='percent-part') {
      return plan(topicId,index,'В библиотеке '+whole+' книг. Книги со сказками составляют '+percent+'%. Сколько книг со сказками в библиотеке?',part,[
        step('По пропорции 100 × x = '+whole+' × '+percent+'. Чему равно произведение справа?',whole*percent,
          'Все '+whole+' книг — это сто процентов. Книг со сказками x, им соответствует '+percent+' процентов. Отношение части к целому равно отношению её процентов к ста.',
          '100 × x = '+whole*percent,['Пропорция: x/'+whole+' = '+percent+'/100.','Произведения крест-накрест равны.']),
        step('Сколько книг со сказками в библиотеке?',part,
          'Чтобы найти x, делим '+whole*percent+' на сто. Получаем '+books(part)+'. Это '+percent+' процентов всех книг.',
          'x = '+whole*percent+' : 100 = '+books(part),['Ответим на вопрос задачи, указав количество книг.'])
      ],{...visual,unknown:'part',proportion:{left:['x',whole],right:[percent,100]},states:[{phase:'given'},{phase:'equation',left:'100 × x',right:whole*percent},{phase:'result'}]},
      'Один процент — одна сотая целого. Всем книгам соответствуют сто процентов. Составим пропорцию, сохраняя одинаковый порядок величин.');
    }
    if(topicId==='percent-whole') {
      return plan(topicId,index,'В библиотеке '+books(part)+' со сказками. Это '+percent+'% всех книг. Сколько всего книг в библиотеке?',whole,[
        step('По пропорции '+percent+' × x = '+part+' × 100. Чему равно произведение справа?',part*100,
          'Обозначим всё количество книг буквой x. Ему соответствуют сто процентов. Известным '+part+' книгам со сказками соответствуют '+percent+' процентов.',
          percent+' × x = '+part*100,['Пропорция: '+part+'/x = '+percent+'/100.','Сравниваем часть со всем количеством.']),
        step('Сколько всего книг в библиотеке?',whole,
          'Делим '+part*100+' на '+percent+' и получаем '+whole+'. Это всё количество книг. Из него '+books(part)+' составляют известные '+percent+' процентов.',
          'x = '+part*100+' : '+percent+' = '+whole+' книг',['Вопрос задачи относится ко всем книгам, а не только к сказкам.'])
      ],{...visual,unknown:'whole',proportion:{left:[part,'x'],right:[percent,100]},states:[{phase:'given'},{phase:'equation',left:percent+' × x',right:part*100},{phase:'result'}]},
      'Часть книг известна, а всё количество нужно найти. В схеме неизвестному целому соответствует сто процентов.');
    }
    return plan(topicId,index,'В библиотеке '+whole+' книг, из них '+books(part)+' со сказками. Сколько процентов составляют книги со сказками?',percent,[
      step('По пропорции '+whole+' × x = '+part+' × 100. Чему равно произведение справа?',part*100,
        'Всем '+whole+' книгам соответствуют сто процентов. Для '+part+' книг со сказками процент пока неизвестен: обозначим его x. Сравниваем часть с целым.',
        whole+' × x = '+part*100,['Пропорция: x/100 = '+part+'/'+whole+'.','Здесь x обозначает число процентов.']),
      step('Сколько процентов составляют книги со сказками?',percent,
        'Делим '+part*100+' на '+whole+'. Получаем '+percent+'. Значит, книги со сказками составляют '+percent+' процентов всего количества.',
        'x = '+part*100+' : '+whole+' = '+percent+'%',['Ответ выражен в процентах, потому что мы искали процент части.'])
    ],{...visual,unknown:'percent',proportion:{left:['x',100],right:[part,whole]},states:[{phase:'given'},{phase:'equation',left:whole+' × x',right:part*100},{phase:'result'}]},
    'Число книг в части и в целом известно. Чтобы узнать процент, выразим это же отношение как долю от ста.');
  }
  const api={topics,make}; root.SovietRevisedAdvanced=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window==='undefined'?globalThis:window);
