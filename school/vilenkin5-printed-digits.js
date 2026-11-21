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
    const tokens=String(value).trim().toLowerCase().replace(/ё/g,'е').replace(/[.,!?]+$/,'').trim().split(/[\s-]+/);
    const classWord=new Set(classes.slice(1).flat());
    return tokens.filter((word,i)=>{
      const atClassStart=i===0||classWord.has(tokens[i-1]);
      const single=word==='одна'&&tokens[i+1]==='тысяча'||word==='один'&&['миллион','миллиард'].includes(tokens[i+1]);
      return !(atClassStart&&single);
    }).join(' ');
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
    {number:'1.16',key:'printed-1-16',title:'Записываем словами названные миллионы и миллиарды',explanation:'Отметь классы миллиардов, миллионов, тысяч и единиц. В каждом классе правее первого должно быть ровно три позиции. Если класс при чтении пропущен, в записи появится 000.',worked:['В словах «два миллиарда семь тысяч девять» нет класса миллионов.','Группы слева направо: 2 | 000 | 007 | 009. Три цифры в каждой внутренней группе сохраняют разряды.','Запись 2 000 007 009 читается точно так же, как исходное число.'],misconception:'При записи числа можно пропускать класс нулей так же, как при чтении вслух.',reflect:'Что изменится, если удалить одну внутреннюю группу 000?'},
    {number:'1.17',key:'printed-1-17',title:'Границы классов в длинной записи',explanation:'Отделяй классы с правого края. Каждая группа правее первой должна содержать ровно три цифры. Внутри класса сохраняются все нули.',worked:['В записи 25006104 сначала отдели справа группу 104.','Снова отсчитай три цифры справа от этой границы. Следующая группа — 006, слева остаётся 25.','Получилась запись 25 006 104. Если убрать пробелы, все восемь цифр снова стоят в исходном порядке.'],misconception:'Классы обязательно отсчитывают тройками с левого края записи.',reflect:'Почему внутреннюю группу 006 нельзя записать как 6?'},
    {number:'1.18',key:'printed-1-18',title:'Читаем числа от сотен до сотен миллиардов',explanation:'Начни со старшего класса. В каждой непустой группе прочитай число от 1 до 999 и добавь название этого класса. Нулевую группу при чтении пропусти.',worked:['В записи 12 000 004 070 слева двенадцать миллиардов.','Группа миллионов равна 000, а в классе тысяч — 004: четыре тысячи. В конце 070 — семьдесят.','Читаем целиком «двенадцать миллиардов четыре тысячи семьдесят».'],misconception:'Каждую группу 000 в длинном числе произносят как «ноль миллионов» или «ноль тысяч».',reflect:'Как прочитать число и не перепутать класс после пропущенной группы 000?'},
    {number:'1.19',key:'printed-1-19',title:'Раскрываем записи с тыс., млн и млрд',explanation:'Сокращение обозначает единицу счёта. Тысяча — это 1 000, миллион — 1 000 000, миллиард — 1 000 000 000 единиц. Переводи части в одну единицу и складывай.',worked:['В авторской записи 19 млн 28 тыс. две величины.','Получаем 19 000 000 и 28 000. Их сумма 19 028 000.','А запись 19 млн 28 заканчивается единицами: 19 000 028. После 28 во второй записи нет сокращения «тыс.».'],misconception:'В записи «19 млн 28» последние две цифры обозначают тысячи.',reflect:'Чем отличаются 16 млрд 405 и 16 млрд 405 тыс.?'}
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
  const sourceClasses=[3042,14670,200418,4290000,1029503731,48000790001,400300987654,505050505050];
  const sourceSpoken=[407,7003,80403,6000730249,41000604000,32072000000,120003040900,79740000600,1000000044,71004000010,1000100321,494274303101];
  function varyDigits(source,random){
    return source.map(n=>Number(String(n).replace(/[1-9]/g,()=>String(random(1,9)))));
  }
  function splitClasses(text){
    const raw=String(text).trim();
    if(!/^[1-9]\d{0,2}(?:(?:\s*\|\s*|[ \u00a0\u202f]+)\d{3})+$/.test(raw))return null;
    return raw.replace(/[\s|]/g,'');
  }
  function partition(seed,random,step){
    const values=seed?varyDigits(sourceClasses,random):sourceClasses.slice();
    const steps=values.map((n,i)=>Object.assign(step('Строка '+(i+1)+'. Раздели '+n+' на классы и введи группы через пробел.',groups(n).join(' '),'Поставь первую границу перед тремя правыми цифрами. Двигайся влево тройками. Только крайняя левая группа может быть короче.'),{answerFormat:'v5-classes'}));
    const chosen=seed?random(0,7):6;
    return {prompt:'Раздели число '+values[chosen]+' на классы, сохраняя все цифры и их порядок. Запиши группы через пробел. В разборе проверь все восемь строк.',inputPrompt:'Классы через пробел',answer:groups(values[chosen]).join(' '),answerFormat:'v5-classes',steps,errors:[],data:{values},table:{caption:'Числа до разбиения на классы',headers:['№','Десятичная запись'],rows:values.map((n,i)=>[i+1,String(n)]),columnWidths:[23,77]},conditionKey:values.join('/')+'-'+chosen};
  }
  function spoken(seed,random,step){
    const values=seed?varyDigits(sourceSpoken,random):sourceSpoken.slice();
    const steps=values.map(n=>readingStep(n,step)),chosen=seed?random(0,11):8;
    return {prompt:'Прочитай число '+groups(values[chosen]).join(' ')+' и запиши его словами. Пропускай пустой класс при чтении, сохраняя название каждого непустого. В разборе есть все двенадцать чисел.',inputPrompt:'Чтение числа словами',answer:words(values[chosen]),answerFormat:'v5-reading',steps,errors:[],data:{values},table:{caption:'Читаем слева направо по классам',headers:['№','Число'],rows:values.map((n,i)=>[i+1,groups(n).join(' ')]),columnWidths:[20,80]},conditionKey:values.join('/')+'-'+chosen};
  }
  function shortUnits(seed,random,step){
    const coefficients=seed?[random(2,9),random(101,907),random(1004,9837),random(11010,98110),random(12,86),random(101,985),random(100,993),random(100,801),random(12,99)]:[4,207,2031,74505,21,209,993,105,27];
    const tailThousand=seed?random(102,985):307,tailUnits=seed?random(102,986):823;
    const values=coefficients.map((n,i)=>n*(i<4?1e3:i===6||i===8?1e9:1e6)+(i===7?tailThousand*1000:i===8?tailUnits:0));
    const strings=coefficients.map((n,i)=>groups(n).join(' ')+(i<4?' тыс.':i===6||i===8?' млрд':' млн')+(i===7?' '+tailThousand+' тыс.':i===8?' '+tailUnits:''));
    const steps=values.map((n,i)=>numericStep('Строка '+(i+1)+'. Преобразуй '+strings[i]+' в запись цифрами.',n,'У тысячи три нуля, у миллиона шесть, у миллиарда девять. Сначала переведи каждую часть записи, затем сложи их.',step,[{value:coefficients[i],text:'Это количество тысяч, миллионов или миллиардов. Теперь переведи его в отдельные единицы и учти остаток, если он указан.'}]));
    const chosen=seed?random(0,8):8;
    return {prompt:'Запиши цифрами: '+strings[chosen]+'. В разборе раскрой сокращения во всех девяти числах.',inputPrompt:'Полная запись цифрами',answer:values[chosen],answerFormat:'v5-natural',steps,errors:steps[chosen].errors,data:{values},table:{caption:'Сокращения классов чисел. Запись без сокращения справа обозначает единицы.',headers:['№','Сокращённая запись'],rows:strings.map((text,i)=>[i+1,text]),columnWidths:[23,77]},conditionKey:values.join('/')+'-'+chosen};
  }
  const generators={'1.14':reading,'1.15':composition,'1.16':dictation,'1.17':partition,'1.18':spoken,'1.19':shortUnits};
  const bounds=Object.fromEntries(Object.keys(generators).map((n,i)=>[n,{row:[0,[8,5,4,7,11,8][i],0],place:[0,11,0]}]));
  function explore(lesson,state,task,table){
    const n=task.data.values[state.row],chunks=groups(n),digits=String(n).split('').reverse(),place=state.place;
    const rows=chunks.map((chunk,i)=>[classLabels[chunks.length-i-1],chunk]);
    const controls=[{key:'row',title:'Исследуемая строка',values:task.data.values.map((_,i)=>[i,['1.15','1.16'].includes(lesson.number)?labels[i]:i+1])},{key:'place',title:'Разряд',values:ranks.map((name,i)=>[i,(i+1)+'. '+name])}];
    const present=place<digits.length,digit=present?Number(digits[place]):null,contribution=present?digit*10**place:0;
    return {title:'Собери классы и исследуй разряд',controls,visual:table('Запись по классам',['Класс','Цифры'],rows)+'<p>Выбран разряд №'+(place+1)+' справа: '+ranks[place]+'.</p>',question:present?'Какой вклад в число вносит цифра этого разряда?':'Есть ли отдельная записанная цифра в выбранном разряде? Введи 1, если есть, или 0, если запись закончилась.',answer:contribution,why:present?'В разряде стоит '+digit+'. Вклад равен '+digit+' × '+groups(10**place).join(' ')+' = '+groups(contribution).join(' ')+'.':'Слева от старшей цифры записанных разрядов нет. Там нет написанного нуля.'};
  }
  const api={lessons,generators,bounds,explore,words,natural,cleanReading,places,splitClasses};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedDigits=api;
})(typeof window!=='undefined'?window:globalThis);
