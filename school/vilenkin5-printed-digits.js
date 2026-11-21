/* Individual exercises 1.14–1.16, part 1, point 2, printed p. 13 (2023). */
(function(root){
  'use strict';
  const units=['','один','два','три','четыре','пять','шесть','семь','восемь','девять'];
  const teens=['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  const tens=['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  const hundreds=['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];
  const classes=[['','',''],['тысяча','тысячи','тысяч'],['миллион','миллиона','миллионов'],['миллиард','миллиарда','миллиардов']];
  const classLabels=['Единицы','Тысячи','Миллионы','Миллиарды'];
  const ranks=['единицы','десятки','сотни','единицы тысяч','десятки тысяч','сотни тысяч','единицы миллионов','десятки миллионов','сотни миллионов','единицы миллиардов','десятки миллиардов','сотни миллиардов'];
  const countNames=[['единица','единицы','единиц'],['десяток','десятка','десятков'],['сотня','сотни','сотен'],classes[1]];
  const labels=['а','б','в','г','д','е'];
  const ending=n=>n%100>=11&&n%100<=14?2:n%10===1?0:n%10>=2&&n%10<=4?1:2;
  function groups(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ').split(' ');}
  function words(n){
    if(n===0)return 'ноль';
    const chunks=groups(n).reverse(),text=[];
    for(let c=chunks.length-1;c>=0;c--){
      const value=Number(chunks[c]);if(!value)continue;
      const last=value%10,pair=value%100,t=Math.floor(pair/10),one=c===1&&last===1?'одна':c===1&&last===2?'две':units[last];
      text.push(hundreds[Math.floor(value/100)]);
      if(pair>=10&&pair<=19)text.push(teens[pair-10]);else text.push(tens[t],one);
      if(c)text.push(classes[c][ending(value)]);
    }
    return text.filter(Boolean).join(' ');
  }
  function cleanReading(value){
    return String(value).trim().toLowerCase().replace(/ё/g,'е').replace(/[.,!?]+$/,'').replace(/[\s-]+/g,' ').trim()
      .replace(/(^| )одна тысяча(?= |$)/g,'$1тысяча').replace(/(^| )один (миллион|миллиард)(?= |$)/g,'$1$2');
  }
  function natural(input){
    const raw=String(input).trim();
    if(!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:[ \u00a0\u202f]\d{3})+)$/.test(raw))return null;
    const n=Number(raw.replace(/[ \u00a0\u202f]/g,''));
    return Number.isSafeInteger(n)?n:null;
  }
  const readingStep=(n,step)=>Object.assign(step('Запиши словами, как читается '+groups(n).join(' ')+'.',words(n),'Подели запись справа на группы по три цифры. Читай слева, называя непустые классы.'),{answerFormat:'v5-reading'});
  const numericStep=(prompt,answer,hint,step,errors=[])=>Object.assign(step(prompt,answer,hint,errors),{answerFormat:'v5-natural'});
  const lessons=[
    {number:'1.14',key:'printed-1-14',title:'Читаем девять чисел и ищем разряды 7 и 0',explanation:'Отсчитывай разряды справа от единиц. Одна и та же цифра может встречаться в нескольких местах. У маленького числа ведущие пустые места не становятся нулями.',worked:['В числе 7 070 цифра 7 стоит в разрядах тысяч и десятков.','Нули находятся в сотнях и единицах. Слева от тысяч других написанных цифр нет.','Это число читается «семь тысяч семьдесят». Пустое значение сотен отдельно не произносим.'],misconception:'В числе 27 написан ноль в разряде сотен.',reflect:'Чем пустое место слева от числа отличается от нуля внутри числа?'},
    {number:'1.15',key:'printed-1-15',title:'Восстанавливаем число по названиям разрядов',explanation:'Расставляй цифры по названным разрядам. Их могут перечислить в любом порядке. Если в разряде ноль, внутри записи место сохраняется.',worked:['Даны 5 единиц, 2 тысячи, 0 десятков и 4 сотни. Сделай четыре клетки: тысячи, сотни, десятки, единицы.','Получится 2 405. Простая запись перечисленных цифр по порядку дала бы другое число.','Читай «две тысячи четыреста пять». Нулевые десятки не требуют отдельного слова.'],misconception:'Цифры нужно записывать в том порядке, в каком в условии перечислены разряды.',reflect:'Как проверить свою запись, если названия разрядов даны с конца?'},
    {number:'1.16',key:'printed-1-16',title:'Записываем словами названные миллионы и миллиарды',explanation:'Отметь классы миллиардов, миллионов, тысяч и единиц. В каждом классе правее первого должно быть ровно три позиции. Если класс при чтении пропущен, в записи появится 000.',worked:['В словах «два миллиарда семь тысяч девять» нет класса миллионов.','Группы слева направо: 2 | 000 | 007 | 009. Три цифры в каждой внутренней группе сохраняют разряды.','Запись 2 000 007 009 читается точно так же, как исходное число.'],misconception:'При записи числа можно пропускать класс нулей так же, как при чтении вслух.',reflect:'Что изменится, если удалить одну внутреннюю группу 000?'}
  ].map(l=>({...l,part:1,point:2,page:13,requires:['v5f-place-value'],related:['v5f-place-value']}));
  const sourceRead=[27,80,279,701,718,3781,7023,70907,300007];
  const sourceCompose=[507,960,2341,5632,2870,8007],orders=[[2,1,0],[2,1,0],[3,2,1,0],[0,1,2,3],[2,1,0,3],[3,0,2,1]];
  const sourceDictate=[78,5412,10005023,10002064000,117000002030];
  function places(n,digit){const found=String(n).split('').reverse().flatMap((value,i)=>+value===digit?[i+1]:[]);return found.length?found:[0];}
  function valuesLike(numbers,random){
    return numbers.map(n=>Number(String(n).split('').map((v,i)=>v==='0'||v==='7'?v:String(random(i===0?1:0,9))).join('')));
  }
  function reading(seed,random,step){
    const values=seed?valuesLike(sourceRead,random):sourceRead.slice(),steps=[];
    for(const n of values){
      steps.push(readingStep(n,step));
      for(const digit of [7,0]){
        const t=step('В каких разрядах записи '+groups(n).join(' ')+' встречается цифра '+digit+'? Нумеруй разряды справа с 1. Укажи все номера через точку с запятой, а если этой цифры нет, введи 0.',places(n,digit),'Двигайся справа налево только по записанным цифрам. Совпадений может быть несколько или ни одного.');t.answerFormat='unordered';steps.push(t);
      }
    }
    const chosen=seed?random(0,8):7;
    return {prompt:'Запиши словами, как читается '+groups(values[chosen]).join(' ')+'. В разборе прочитай все девять чисел и найди каждую цифру 7 и 0.',inputPrompt:'Число словами',answer:words(values[chosen]),answerFormat:'v5-reading',steps,errors:[],data:{values},table:{caption:'Список для чтения. Разряды нумеруем справа с единицы.',headers:['Строка','Число'],rows:values.map((n,i)=>[i+1,groups(n).join(' ')])},conditionKey:values.join('/')+'-'+chosen};
  }
  function composition(seed,random,step){
    const values=seed?sourceCompose.map(n=>Number(String(n).split('').map(v=>v==='0'?'0':String(random(1,9))).join(''))):sourceCompose.slice();
    const descriptions=values.map((n,i)=>orders[i].map(place=>{
      const value=Math.floor(n/10**place)%10;return value+' '+countNames[place][ending(value)];
    }).join(', '));
    const steps=[];
    values.forEach((n,i)=>{
      const asListed=Number(orders[i].map(place=>Math.floor(n/10**place)%10).join(''));
      const errors=asListed===n?[]:[{value:asListed,text:'Ты записал цифры в порядке описания. Найди значение названия каждого разряда и переставь цифры по местам.'}];
      steps.push(numericStep(labels[i]+'. '+descriptions[i]+'. Запиши число цифрами.',n,'Сначала отметь разряды слева направо. Затем найди, где в условии сказано про каждый разряд.',step,errors),readingStep(n,step));
    });
    const chosen=seed?random(0,5):5;
    return {prompt:'Запиши цифрами число из строки '+labels[chosen]+'. В разборе восстанови и прочитай все шесть записей.',inputPrompt:'Число цифрами',answer:values[chosen],answerFormat:'v5-natural',steps,errors:[],data:{values},table:{caption:'Разряды в порядке, указанном в каждом подпункте',headers:['Строка','Разрядные единицы'],rows:descriptions.map((text,i)=>[labels[i],text])},conditionKey:values.join('/')+'-'+chosen};
  }
  function dictation(seed,random,step){
    const values=seed?[random(13,99),random(2,9)*1000+random(1,9)*100+random(12,89),random(10,89)*1e6+random(1,9)*1000+random(11,99),random(12,40)*1e9+random(1,9)*1e6+random(10,99)*1e3,random(100,340)*1e9+random(1,9)*1e3+random(10,99)]:sourceDictate.slice();
    const steps=values.map((n,i)=>{
      const collapsed=Number(groups(n).map(Number).join(''));
      return numericStep(labels[i]+'. Запиши цифрами: '+words(n)+'.',n,'Впиши цифры каждого класса справа налево. Для отсутствующего внутреннего класса оставь три нулевые цифры.',step,collapsed===n?[]:[{value:collapsed,text:'Проверь длину внутренних классов. Даже группа с одним ненулевым разрядом справа от старшего класса занимает три места.'}]);
    });
    const chosen=seed?random(0,4):4;
    return {prompt:'Запиши цифрами число «'+words(values[chosen])+'». В ходе разбора собери все пять чисел.',inputPrompt:'Десятичная запись',answer:values[chosen],answerFormat:'v5-natural',steps,errors:steps[chosen].errors,data:{values},table:{caption:'Числа, названные словами',headers:['Строка','Число словами'],rows:values.map((n,i)=>[labels[i],words(n)])},conditionKey:values.join('/')+'-'+chosen};
  }
  const generators={'1.14':reading,'1.15':composition,'1.16':dictation};
  const bounds=Object.fromEntries(Object.keys(generators).map((n,i)=>[n,{row:[0,[8,5,4][i],0],place:[0,11,0]}]));
  function explore(lesson,state,task,table){
    const n=task.data.values[state.row],chunks=groups(n),digits=String(n).split('').reverse(),place=state.place;
    const rows=chunks.map((chunk,i)=>[classLabels[chunks.length-i-1],chunk]);
    const controls=[{key:'row',title:'Исследуемая строка',values:task.data.values.map((_,i)=>[i,lesson.number==='1.14'?i+1:labels[i]])},{key:'place',title:'Разряд',values:ranks.map((name,i)=>[i,(i+1)+'. '+name])}];
    const present=place<digits.length,digit=present?Number(digits[place]):null,contribution=present?digit*10**place:0;
    return {title:'Собери классы и исследуй разряд',controls,visual:table('Запись по классам',['Класс','Цифры'],rows)+'<p>Выбран разряд №'+(place+1)+' справа: '+ranks[place]+'.</p>',question:present?'Какой вклад в число вносит цифра этого разряда?':'Есть ли отдельная записанная цифра в выбранном разряде? Введи 1, если есть, или 0, если запись закончилась.',answer:contribution,why:present?'В разряде стоит '+digit+'. Вклад равен '+digit+' × '+groups(10**place).join(' ')+' = '+groups(contribution).join(' ')+'.':'Слева от старшей цифры записанных разрядов нет. Там нет написанного нуля.'};
  }
  const api={lessons,generators,bounds,explore,words,natural,cleanReading,places};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedDigits=api;
})(typeof window!=='undefined'?window:globalThis);
