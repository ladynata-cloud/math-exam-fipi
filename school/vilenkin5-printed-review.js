/* Vilenkin, part 1, point 3. Authored practice for the four review tasks on printed page 20. */
(function(root) {
  'use strict';
  const digits = typeof module !== 'undefined' && module.exports ? require('./vilenkin5-printed-digits.js') : root.Vilenkin5PrintedDigits;
  const labels = ['а', 'б', 'в', 'г', 'д', 'е', 'ж'];
  const info = [
    ['1.67','Прочитай шесть чисел вслух','Отдели группы по три цифры справа. Произноси название непустой группы вместе с названием класса. У итоговой группы единиц отдельное название класса вслух не добавляют.',
      ['Для записи 80 306 сначала произнеси «восемьдесят тысяч».','Справа стоит группа 306. Соедини обе части: «восемьдесят тысяч триста шесть».'], 'В числе 80 306 после тысяч надо произнести «ноль десятков».','Как услышать разницу между 80 306 и 83 006?'],
    ['1.68','Собери семь чисел из названий классов','Отметь места миллиардов, миллионов, тысяч и единиц. Разложи по ним сказанные слова. Внутри числа пустое место класса содержит три нуля.',
      ['«Девять миллиардов две тысячи пять» даёт группы 9 | 000 | 002 | 005.','Запиши всё число: 9 000 002 005. Разбей его заново и прочитай для проверки.'], 'В числе «девять миллиардов две тысячи пять» сразу за девяткой можно записать группу тысяч.','Что произойдёт, если убрать три нуля на месте всех миллионов?'],
    ['1.69','Двадцать коротких вычислений','Сначала прочитай знак. Для сложения и вычитания удобно перейти через десяток. Умножение показывает равные группы, а деление находит размер группы или число групп.',
      ['У 15 − 7 отними сначала 5 до числа 10, затем ещё 2. Останется 8.','Для 54 : 6 проверь обратное действие: 6 × 9 = 54.'], 'При делении натурального числа на несколько равных групп в ответ всегда записывают число всех предметов.','Каким обратным действием ты можешь проверить ответ каждой строки?'],
    ['1.70','Два способа сделать сумму удобной','Можно округлить оба слагаемых вверх, сложить их и снять обе прибавки. Другой путь — перенести из второго слагаемого в первое ровно столько единиц, сколько первому не хватает до круглого числа.',
      ['Для 197 + 68 первый путь даёт 200 + 70 − 3 − 2 = 265.','Если перенести тройку из 68 к 197, получается та же сумма: 200 + 65 = 265.'], 'Если перенести единицы из одного слагаемого в другое, сумма увеличится.','Почему нужно вычесть обе добавки, если оба числа округлили вверх?']
  ];
  const lessons = info.map(([number,title,explanation,worked,misconception,reflect])=>({
    number,key:'printed-'+number.replace('.','-'),part:1,point:3,page:20,title,explanation,worked,misconception,reflect,
    requires:[number==='1.67'||number==='1.68'?'v5f-place-value':'v5f-natural-add'], related:['v5f-place-value']
  }));
  const printedRead = [241,802,50024,490220,700243,9999999];
  const printedWrite = [22003008,28015302,507080000,1010009000,423340600980,52000008012,777000608000];
  const format = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const error = (value,text) => ({value,text});
  const formatStep = (step,kind,prompt,answer,hint,errors=[]) => Object.assign(step(prompt,answer,hint,errors),{answerFormat:kind});
  function readOrWrite(writing,seed,random,step) {
    const source = writing ? printedWrite : printedRead;
    const values = source.map(n => seed ? Number(String(n).replace(/[1-9]/g,()=>random(1,9))) : n);
    const kind = writing ? 'v5-natural' : 'v5-reading';
    const steps = values.map((n,i) => {
      const chunks = format(n).split(' '), compressed = Number(chunks.map(v=>Number(v)).filter(Boolean).join(''));
      const name = writing ? labels[i]+'. ' : (i+1)+'. ';
      const errors = writing ? [error(compressed,'Проверь ширину каждой внутренней группы. Даже маленькое число единиц этого класса занимает три позиции.')].filter(e=>e.value!==n) :
        [error(digits.words(Number(chunks.at(-1))),'Ты прочитал только младшую группу. Начни слева и назови каждую группу вместе с её классом.')].filter(e=>e.value!==digits.words(n));
      return formatStep(step,kind,name+(writing?'Запиши цифрами: '+digits.words(n)+'.':'Прочитай '+format(n)+' и введи услышанное словами.'),
        writing?n:digits.words(n),writing?'Сначала подпиши все классы на черновике. Поставь нули в незанятые разряды.':'Раздели число справа на тройки. Читай с левой группы; группу 000 пропусти.',errors);
    });
    const chosen=seed?random(0,steps.length-1):steps.length-1;
    return {prompt:steps[chosen].prompt+(writing?' В разборе собери все семь чисел.':' В разборе прочитай все шесть чисел.'),
      inputPrompt:writing?'Число цифрами':'Число словами',answer:steps[chosen].answer,answerFormat:kind,steps,errors:steps[chosen].errors,
      data:{values},table:{caption:writing?'Числа для записи':'Числа для чтения',headers:['Строка',writing?'Название':'Запись'],
        rows:values.map((n,i)=>[writing?labels[i]:i+1,writing?digits.words(n):format(n)]),columnWidths:[17,83]},conditionKey:values.join('/')+'-'+chosen};
  }
  const signs=['+','−','×',':'];
  const sourceOps=[[[7,9],[14,8],[28,7],[16,5],[43,0]], [[14,6],[17,9],[13,7],[16,8],[32,0]],
    [[6,7],[9,4],[8,8],[5,9],[9,6]], [[72,9],[48,6],[56,7],[81,9],[40,8]]];
  function setOperations(seed,random,step) {
    const rows=sourceOps.flatMap((group,g)=>group.map(([first,second],i)=>{
      let a=first,b=second;
      if(seed){b=(g<2&&i===4)?0:random(3,9);a=g===3?b*random(3,9):g===2?random(3,9):random(12,34);}
      return {g,a,b,label:labels[g]+(i+1),answer:[a+b,a-b,a*b,a/b][g]};
    }));
    const descriptions=['Сколько предметов в обеих частях вместе?','Сколько останется, если убрать указанную вторую часть?','Сколько точек в нескольких равных рядах?','Сколько точек приходится на каждый из равных рядов?'];
    const hints=['Можно добавить сначала недостающее до десятка, затем остаток.','Раздели вычитаемое на удобные части. Если вычитаешь ноль, количество сохраняется.','Проверь как сумму равных групп.','Проверь найденное число умножением на делитель.'];
    const steps=rows.map(({g,a,b,label,answer})=>{
      const alternate=[a-b,a+b,a+b,a-b][g];
      return formatStep(step,'v5-natural',label+'. Вычисли '+a+' '+signs[g]+' '+b+'.',answer,hints[g],
        alternate!==answer?[error(alternate,'Проверь знак «'+signs[g]+'». '+descriptions[g])]:[]);
    });
    const chosen=seed?random(0,19):19;
    return {prompt:steps[chosen].prompt+' В разборе пройди по пять строк каждого подпункта а–г.',inputPrompt:'Результат',answer:steps[chosen].answer,answerFormat:'v5-natural',steps,errors:steps[chosen].errors,
      data:{operations:rows},table:{caption:'Четыре вида действий',headers:['Строка','Вычисли'],rows:rows.map(r=>[r.label,r.a+' '+signs[r.g]+' '+r.b]),columnWidths:[25,75]},conditionKey:rows.map(r=>r.a+','+r.b).join('/')+'-'+chosen};
  }
  function sums(seed,random,step) {
    const pairs=seed?Array.from({length:3},(_,i)=>[10*random(i?20:3,i?60:9)-random(1,4),10*random(3,i?45:9)-random(1,6)]):[[98,49],[497,445],[338,46]];
    const steps=pairs.map(([a,b],i)=>{
      const upA=Math.ceil(a/10)*10,upB=Math.ceil(b/10)*10;
      return formatStep(step,'v5-natural',labels[i]+'. Найди '+a+' + '+b+' удобным способом.',a+b,
        'Сколько не хватает первому слагаемому до десятка? Добавь столько к первому и вычти столько же из второго.',
        [error(upA+upB,'Это сумма двух округлённых чисел. Найди обе добавки и убери их.'),error(upA+b,'Первое слагаемое выросло. Если переносишь единицы, со второго их надо снять.')]);
    });
    const chosen=seed?random(0,2):2;
    return {prompt:steps[chosen].prompt+' В разборе посчитай все три суммы. В модели можно выбрать каждый из двух способов.',inputPrompt:'Сумма',answer:steps[chosen].answer,answerFormat:'v5-natural',steps,errors:steps[chosen].errors,
      data:{pairs},table:{caption:'Удобное сложение',headers:['Подпункт','Первое число','Второе число'],rows:pairs.map(([a,b],i)=>[labels[i],a,b]),columnWidths:[32,34,34]},conditionKey:pairs.map(p=>p.join(',')).join('/')+'-'+chosen};
  }
  function dots(n,perRow,markFrom,markEnd){
    const rows=Math.ceil(n/perRow);
    const points=Array.from({length:n},(_,i)=>'<circle cx="'+(12+(i%perRow)*15)+'" cy="'+(12+Math.floor(i/perRow)*15)+'" r="4.8" fill="'+(i>=markFrom&&i<markEnd?'#ad440e':'#21685c')+'"/>').join('');
    return '<svg role="img" aria-label="Точки по группам" viewBox="0 0 '+(perRow*15+10)+' '+(rows*15+10)+'" style="width:min(100%,18rem);max-height:13rem">'+points+'</svg>';
  }
  function explore(lesson,state,task,table) {
    const d=task.data;
    if(d.values)return digits.explore(lesson,state,task,table);
    if(d.operations){
      const c=d.operations[state.row],{a,b,g}=c;
      const counted=[a+b,a,a*b,a][g],perRow=g===2?b:g===3?a/b:10;
      const picture=dots(counted,perRow,g===0?a:g===1?a-b:0,g<2?counted:perRow);
      const notes=['К первой группе присоединили вторую, отмеченную оранжевым.','Всего было '+a+'. Оранжевые точки убирают.','В каждом горизонтальном ряду одинаковое число точек.','Все точки разложены по '+b+' равным рядам.'];
      return {title:'Собери действие с точками',controls:[{key:'row',title:'Выбери пример',values:d.operations.map((r,i)=>[i,r.label])}],visual:picture+'<p>'+notes[g]+'</p>',
        question:['Сколько точек в обеих частях вместе?','Сколько точек останется после удаления оранжевых?','Сколько точек на всех рядах?','Сколько точек в одном ряду?'][g],answer:c.answer,why:a+' '+signs[g]+' '+b+' = '+c.answer+'.'};
    }
    const [a,b]=d.pairs[state.row],upA=Math.ceil(a/10)*10,upB=Math.ceil(b/10)*10,addA=upA-a,addB=upB-b;
    const transfer=state.method===1;
    return {title:'Проверь компенсацию',controls:[{key:'row',title:'Подпункт',values:labels.slice(0,3).map((v,i)=>[i,v])},{key:'method',title:'Способ',values:[[0,'Округлить оба'],[1,'Перенести единицы']]}],
      visual:table('Как меняются слагаемые',['Слагаемое','Было','Что делаем'],[['Первое',a,'прибавляем '+addA],['Второе',b,(transfer?'вычитаем '+addA:'прибавляем '+addB)]]),
      question:transfer?'Сколько осталось во втором слагаемом после переноса?':'Сколько лишних единиц оказалось в общей сумме?',
      answer:transfer?b-addA:addA+addB,why:transfer?'Первое стало '+upA+', а второе стало '+(b-addA)+'. Их сумма равна прежней.':'Прибавили '+addA+' и '+addB+'. Из суммы округлённых чисел надо убрать '+(addA+addB)+'.'};
  }
  const generators={'1.67':(s,r,t)=>readOrWrite(false,s,r,t),'1.68':(s,r,t)=>readOrWrite(true,s,r,t),'1.69':setOperations,'1.70':sums};
  const bounds={'1.67':{row:[0,5,0],place:[0,11,0]},'1.68':{row:[0,6,0],place:[0,11,0]},'1.69':{row:[0,19,0]},'1.70':{row:[0,2,0],method:[0,1,0]}};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedReview=api;
})(typeof window!=='undefined'?window:globalThis);
