(function () {
  'use strict';
  const {lessons,add,example} = window.MathExamTopicPractice;
  const course = window.MathExamTopicEdition;
  const order = [];
  const names = ['натуральные','целые','рациональные','иррациональные','действительные'];
  const symbols = ['N','Z','Q','R∖Q','R'];
  function register(id, page, title, prompt, guide, rule, make) {
    add(53,id,page,title,prompt,rule,'fraction',make);
    const lesson = lessons.get('53-'+id);
    const printed = id.replace(/[abcde]$/, c => 'абвгд'[c.charCodeAt(0)-97]);
    Object.assign(lesson, {printedReference:'Упражнение №'+printed, printedPrompt:prompt, printedGuide:guide});
    order.push(lesson.id);
  }
  function question(prompt, answer, calc, bad, message) {
    return {prompt,answer,calculation:calc,error:message,mistakes:[[bad,message]]};
  }
  function candidates(seed) {
    const k=seed+2;
    const values=[
      {text:String(k),kind:0,sign:1}, {text:String(-k),kind:1,sign:-1},
      {text:'0',kind:1,sign:0}, {text:(2*k+1)+'/2',kind:2,sign:1},
      {text:'−1/'+k,kind:2,sign:-1}, {text:'√'+(k*k+1),kind:3,sign:1},
      {text:'−√'+(k*k+2),kind:3,sign:-1}, {text:k+'π',kind:3,sign:1}
    ];
    const offset=seed%values.length;
    return [...values.slice(offset),...values.slice(0,offset)];
  }
  function criterion(type,x) {
    switch(type){
      case 'natural': return x.kind===0;
      case 'integer': return x.kind<=1;
      case 'rational': return x.kind<=2;
      case 'negative-irrational': return x.kind===3&&x.sign<0;
      case 'positive': return x.sign>0;
      case 'fraction': return x.kind===2;
      case 'integer-outside-N': return x.kind===1;
      case 'irrational': return x.kind===3;
      default: throw Error('Неизвестное множество');
    }
  }
  const basis='Начни с самых узких множеств. Здесь N начинается с 1. Ноль и отрицательные целые входят в Z. В Q входят все целые и отношения целых с ненулевым знаменателем. Корень из целого между соседними квадратами иррационален.';
  function select(type, target, seed) {
    const values=candidates(seed);
    const fits=values.map((x,i)=>criterion(type,x)?i+1:0).filter(Boolean);
    const rows=values.map((x,i)=>['№'+(i+1),x.text]);
    return Object.assign(example('Найди все подходящие числа', ['Место в списке','Число'], rows, [
      question('Сколько чисел удовлетворяют условию «'+target+'»?',fits.length,
        'Проверяй каждое число один раз и считай подходящие.', fits.length+1,'Проверь отдельно ноль, знак каждого числа и квадрат под корнем.'),
      question('На каком месте стоит первое подходящее число?',fits[0],
        'Начни с №1 и двигайся вниз до первого числа с нужным свойством.',0,'Введи номер строки. Нумерация списка начинается с единицы.'),
      question('На каком месте стоит последнее подходящее число?',fits.at(-1),
        'Проверь список с последней строки к первой.',0,'Нужен номер последней подходящей строки, а не значение самого числа.')
    ],'number-sets'),{m:{values}});
  }
  const printedList='−1, 0, √3, 2,38, π, 1/84, −√7, 100, −3π, √2 + √3, −2/7, 0,001';
  const selections=[
    ['natural','натуральное','Только 100. Натуральный ряд в этой книге начинается с 1.'],
    ['integer','целое','−1, 0 и 100. Ноль целый. У прочих чисел из списка есть дробная часть.'],
    ['rational','рациональное','−1, 0, 2,38, 1/84, 100, −2/7 и 0,001. Конечную десятичную дробь можно записать со знаменателем 10, 100 или 1000.'],
    ['negative-irrational','отрицательное иррациональное','−√7 и −3π. Семь лежит между квадратами 4 и 9. Если бы −3π было рациональным, деление на −3 сделало бы рациональным и π.'],
    ['positive','положительное действительное','√3, 2,38, π, 1/84, 100, √2 + √3 и 0,001. Все действительные числа больше нуля подходят, независимо от возможности записать их дробью.']
  ];
  selections.forEach(([type,target,guide],i)=>register('1'+'abcde'[i],11,'Отбор чисел · '+target,
    'Выбери из списка '+printedList+' все числа со свойством «'+target+'».',guide,basis,seed=>select(type,target,seed)));
  function belongs(kind,group) { return group===4 || (group===3 ? kind===3 : kind<=group); }
  const statements=[
    [0,1,true,'Любое натуральное число целое. Все счётные числа входят в множество целых.'],
    [1,0,false,'Ноль — целое, но счёт натуральных в этой книге начинается с 1. Отрицательные целые тоже дают контрпримеры.'],
    [1,2,true,'Для любого целого z подходит запись z/1. Она показывает принадлежность рациональным.'],
    [3,4,true,'Действительные объединяют рациональные и иррациональные.'],
    [4,2,false,'Например, √2 действительно и иррационально. Одного контрпримера хватает, чтобы опровергнуть общее утверждение.']
  ];
  statements.forEach(([from,to,always,guide],i)=>register('2'+'abcde'[i],12,'Проверяем утверждение · '+symbols[from]+' и '+symbols[to],
    'Проверь утверждение «все числа из '+symbols[from]+' входят в '+symbols[to]+'». Обоснуй его или приведи контрпример.',guide,
    'Для опровержения нужно число из первого множества, которое не входит во второе. Для доказательства используй определение множеств, а не один удачный пример.',seed=>{
      const k=seed+2, yes={text:String(k),kind:0}, negative={text:String(-k),kind:1};
      const cases=[yes,seed%2?negative:yes,seed%2?negative:yes,{text:'√'+(k*k+1),kind:3},seed%2?{text:k+'π',kind:3}:{text:'1/'+k,kind:2}];
      const chosen=cases[i];
      const pass=belongs(chosen.kind,to);
      return Object.assign(example('Число и утверждение о целом множестве',['Что известно','Значение'],[
        ['Проверяемое число',chosen.text],['Исходное множество',symbols[from]],['Целевое множество',symbols[to]]
      ],[
        question('Принадлежит ли это число целевому множеству? Введи 1 для «да», 0 для «нет».',Number(pass),'Определи вид указанного числа.',Number(!pass),'Проверь принадлежность именно целевому множеству из таблицы.'),
        question('Это число опровергает утверждение? 1 — да, 0 — нет.',Number(!pass),'Контрпример принадлежит первому множеству и не принадлежит второму.',Number(pass),'Число из обоих множеств не может служить контрпримером.'),
        question('Утверждение верно для всех чисел исходного множества? 1 — да, 0 — нет.',Number(always),'Воспользуйся включениями N ⊂ Z ⊂ Q ⊂ R и определением иррационального числа.',Number(!always),'Общее утверждение проверяй включением множеств или контрпримером.')
      ],'sets-claim'),{m:{from,to,chosen}});
    }));
  const choices=[
    ['fraction','рациональное дробное','Например, 1/2. Числитель не делится на знаменатель без остатка.'],
    ['integer-outside-N','целое вне N','Подойдут ноль и любое отрицательное целое, например −5.'],
    ['irrational','действительное вне Q','Например, √2. Нет целых p и q ≠ 0, для которых √2 = p/q.'],
    ['rational','действительное, не являющееся иррациональным','Например, 3/5. Рациональные и иррациональные вместе составляют действительные и не имеют общих элементов.']
  ];
  choices.forEach(([type,target,guide],i)=>register('3'+'abcd'[i],12,'Подбираем пример · '+target,
    'Приведи свой пример числа со свойством «'+target+'» и объясни выбор.',guide,basis,seed=>select(type,target,seed)));
  const testRows=[
    ['Проверь записи −10 ∈ Z, −10 ∈ Q, √2 + √3 ∈ R.','Все три верны. Число −10 целое, его можно записать как −10/1. Сумма двух действительных корней действительна.',
      [[1,false],[2,false],[4,false]],s=>[{text:String(-s-1),kind:1},{text:String(-s-1),kind:1},{text:'√'+(s*s+1)+' + √3',kind:3}]],
    ['Проверь записи π/2 ∈ Z, π/2 ∉ Q, π/2 ∈ R.','Первая запись неверна, вторая и третья верны. Если бы π/2 было рационально, то удвоение дало бы рациональное π.',
      [[1,false],[2,true],[4,false]],s=>Array(3).fill({text:'π/'+(s+1),kind:3})],
    ['Проверь записи −1/7 ∈ Z, −1/7 ∉ R, −1/7 ∈ Q.','Верна только третья. Частное двух целых с ненулевым знаменателем рационально и действительно, а −1/7 лежит строго между −1 и 0.',
      [[1,false],[4,true],[2,false]],s=>Array(3).fill({text:'−1/'+(s+2),kind:2})]
  ];
  testRows.forEach(([prompt,guide,groups,generate],i)=>register('4'+'abc'[i],12,'Читаем знаки ∈ и ∉ · группа '+'абв'[i],
    prompt,guide,'Прочитай ∈ как «принадлежит», а ∉ как «не принадлежит». Произнеси утверждение словами перед проверкой.',seed=>{
      const values=generate(seed);
      const rows=groups.map(([group,negative],j)=>['Утверждение '+(j+1),values[j].text+(negative?' ∉ ':' ∈ ')+symbols[group]]);
      const qs=groups.map(([group,negative],j)=>{
        const answer=Number(belongs(values[j].kind,group)!==negative);
        return question('Верна ли запись №'+(j+1)+'? 1 — да, 0 — нет.',answer,'Сначала проверь принадлежность '+symbols[group]+', затем учти знак '+(negative?'∉.':'∈.'),1-answer,'Отдельно проверь вид числа и знак принадлежности в строке '+(j+1)+'.');
      });
      return Object.assign(example('Три утверждения о числах',['Номер','Запись'],rows,qs,'sets-symbols'),{m:{rows}});
    }));
  const previous={next:course.nextId,grade:course.grade,source:course.source};
  course.nextId=l=>l.book===53?order[order.indexOf(l.id)+1]:previous.next(l);
  course.grade=b=>b===53?'9 класс · 2016':previous.grade(b);
  course.source=(b,p)=>b===53?'https://pdf.my-uchebnik.ru/pdf/algebra/00000041.pdf#page='+(p+1):previous.source(b,p);
})();
