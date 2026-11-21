/* Vilenkin 5, part 1, point 2, p. 13. The source passage is not reproduced. */
(function(root){
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digits.js'):root.Vilenkin5PrintedDigits;
  const format=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const info=[
    ['1.20','Извлекаем числа из текста о планете','Числительное может назвать место по порядку, скорость, расстояние или возраст. Сохрани, о чём говорит каждая величина, затем запиши её цифрами. Предложения своего учебника найдёшь на с. 13.',['В авторском сообщении зонд облетает вторую луну со скоростью три тысячи пятьдесят метров в секунду.','Слово «вторую» обозначает место 2. Значение скорости записывается 3 050 м/с.','Для расстояния «четыре миллиона восемьсот тысяч километров» запись будет 4 800 000 км.'],'Слова, называющие место в ряду, выражают измеренную величину.','Какие данные текста нельзя сравнивать друг с другом без единиц?'],
    ['1.21','Назвать разряд или прочитать цифру?','В одном вопросе дана цифра и требуется найти её место. В другом уже дано место, и нужно прочитать цифру. Чтобы не перепутать, нумеруй места справа с единицы.',['В числе 83 607 цифра 6 стоит на третьем месте справа — в сотнях.','В разряде десятков этого же числа стоит 0. Нулевая цифра тоже занимает место.','Разряд — название места, а 6 или 0 — цифра, которая находится в нём.'],'Номер разряда всегда совпадает с самой цифрой.','Какие два разных вопроса можно задать к одному выделенному месту?'],
    ['1.22','Сколько натуральных чисел строго между двумя числами?','Отметь границы на числовой прямой. Считай только точки правее меньшего и левее большего числа. Если соседние натуральные числа идут подряд, между ними нет ни одного.',['Между 11 и 16 лежат 12, 13, 14 и 15 — четыре числа.','Разность 16 − 11 = 5 считает шаги. Внутренних точек на одну меньше.','Между 19 и 20: 20 − 19 − 1 = 0.'], 'Разность концов отрезка всегда равна числу натуральных чисел строго между ними.', 'Почему из разности вычитают именно единицу?'],
    ['1.23','Приписываем один и тот же блок четыре раза','Приписать означает продолжить запись справа. Умножение числа на четыре даёт другую запись. Сохрани нули, входящие в повторяемый блок, затем прочитай получившееся число.',['Продолжим блок 20 три раза: 20 | 20 | 20.','Получилась запись 202020. Группируем для чтения иначе: 202 020.','Читаем «двести две тысячи двадцать». Число 20 × 3 = 60 отвечает на другой вопрос.'],'Четыре записи числа 30 подряд дают число 120.','Почему границы повторов могут отличаться от границ классов?'],
    ['1.24','Как меняется число при дописывании трёх цифр?','Когда справа приписывают трёхзначный блок, прежняя запись передвигается на три разряда. Один такой шаг равен умножению прежнего числа на тысячу и сложению с новым блоком.',['Если взять блок 108 два раза, получим 108 108.','После третьего дописывания получится 108 108 108: сто восемь миллионов сто восемь тысяч сто восемь.','Четвёртая копия образует класс миллиардов. После каждого шага проверь число блоков.'],'Три подряд записанных числа 108 дают ту же запись, что 108 + 108 + 108.','Когда каждый приписанный блок совпадает с целым классом?']
  ];
  const lessons=info.map(([number,title,explanation,worked,misconception,reflect])=>({number,key:'printed-'+number.replace('.','-'),part:1,point:2,page:13,title,explanation,worked,misconception,reflect,requires:[number==='1.22'?'v5f-natural-between':'v5f-place-value'],related:[number==='1.22'?'v5f-natural-between':'v5f-place-build']}));
  const rankNames=['единицы','десятки','сотни','единицы тысяч','десятки тысяч','сотни тысяч','единицы миллионов','десятки миллионов','сотни миллионов','единицы миллиардов','десятки миллиардов','сотни миллиардов'];
  const numeric=(step,prompt,answer,hint,errors=[])=>Object.assign(step(prompt,answer,hint,errors),{answerFormat:'v5-natural'});
  const reading=(step,n)=>Object.assign(step('Прочитай '+format(n)+' и запиши словами.',D.words(n),'Раздели цифры справа на классы по три. Читай слева и проговаривай названия непустых классов.'),{answerFormat:'v5-reading'});
  const ordinal=['первый','второй','третий','четвёртый','пятый','шестой','седьмой','восьмой','девятый'];
  function passage(seed,random,step){
    const values=seed?[random(2,8),random(10,87)*1000+random(101,933),random(60,185)*1e6+random(1,9)*1e5,random(130,479)*1000+random(1,9)*100,random(2,7)*1e9+random(1,9)*1e8,random(1,6)*1e9+random(1,9)*1e8]:[3,29765,149600000,384400,4600000000,3500000000];
    if(seed&&values[5]>=values[4])values[5]=Math.max(1e8,values[4]-1e8*random(1,9));
    const names=seed?['Место учебного объекта в списке','Скорость аппарата','Расстояние до учебной звезды','Дальность до спутника','Возраст объекта','Возраст изученного вещества']:['Место Земли по удалённости от Солнца','Скорость Земли по орбите','Расстояние от Земли до Солнца','Расстояние от Земли до Луны','Возраст Земли в учебном тексте','Возраст самых древних пород в учебном тексте'];
    const measures=['место','м/с','км','км','лет','лет'];
    const wordRows=values.map((v,i)=>i===0?ordinal[v-1]+' в ряду':D.words(v)+' '+measures[i]);
    const steps=values.map((v,i)=>numeric(step,(i?'Запиши цифрами «'+names[i]+'», единица — '+measures[i]+'.':'Какой номер в ряду обозначает порядковое слово из первой строки?'),v,i?'Раздели словесную запись на классы. Сохрани пустые места справа и проверь единицу.':'Порядковое слово «'+ordinal[v-1]+'» отвечает на вопрос «какой по счёту?».'));
    const selected=seed?random(1,5):2;
    return {prefix:seed?'Вымышленные данные исследовательской игры. ':'Числовые сведения из №1.20 в авторской таблице. ',prompt:'Запиши цифрами величину «'+names[selected]+'». В разборе отдельно проверь порядковый номер и все пять величин. Единицы указаны в таблице.',inputPrompt:names[selected]+', '+measures[selected],answer:values[selected],answerFormat:'v5-natural',steps,errors:[],data:{values},table:{caption:'Читаем каждое число вместе с его смыслом',headers:['Что описано','Данные словами'],rows:wordRows.map((v,i)=>[names[i],v]),columnWidths:[42,58]},conditionKey:values.join('/')+'-'+selected};
  }
  function rank(seed,random,step){
    const permutation=[0,1,2,3,4,5,6,7,8,9];if(seed)for(let i=9;i>1;i--){const j=random(1,i);[permutation[i],permutation[j]]=[permutation[j],permutation[i]];}
    const n=Number('29805674231'.split('').map(v=>permutation[+v]).join('')),reverse=String(n).split('').reverse().map(Number);
    const askedDigits=[6,4,0,8].map(x=>permutation[x]),askedPlaces=[1,10,8,4,2],steps=[reading(step,n)];
    for(const digit of askedDigits){
      const pos=reverse.indexOf(digit)+1;
      steps.push(step('а. На каком месте справа находится цифра '+digit+'? Запиши номер разряда. Номер 1 соответствует единицам.',pos,'Найди нужную цифру, затем отсчитай позиции от правого края. Разряд называется «'+rankNames[pos-1]+'».',digit===pos?[]:[{value:digit,text:'Это цифра из вопроса. Найди номер места, на котором она стоит.'}]));
    }
    for(const pos of askedPlaces)steps.push(step('б. Какая цифра стоит в разряде «'+rankNames[pos-1]+'»?',reverse[pos-1],'Названо место. Найди его в разрядной сетке и прочитай ровно одну цифру.',pos===reverse[pos-1]?[]:[{value:pos,text:'Ты назвал номер позиции. Для ответа прочитай цифру, которая находится на этом месте.'}]));
    const final=askedPlaces.map(p=>reverse[p-1]);
    return {prompt:'Из числа '+format(n)+' выпиши пять цифр по порядку вопросов б: единицы; единицы миллиардов; десятки миллионов; единицы тысяч; десятки. Введи их через точку с запятой.',inputPrompt:'Пять цифр по порядку названных разрядов',answer:final,answerFormat:'v5-list',steps,errors:[],data:{values:[n]},table:{caption:'Разрядные классы читаются слева направо. Единицы стоят справа.',headers:['Класс','Цифры'],rows:format(n).split(' ').map((group,i)=>[['Миллиарды','Миллионы','Тысячи','Единицы'][i],group])},conditionKey:String(n)};
  }
  function between(seed,random,step){
    const pair=()=>{const left=random(9,79);return [left,left+random(1,11)];},pairs=seed?[pair(),pair()]:[[15,21],[34,43]];
    const steps=pairs.map(([a,b],i)=>step((i?'б':'а')+'. Сколько натуральных чисел строго между '+a+' и '+b+'?',b-a-1,'Начни с числа после '+a+' и остановись перед '+b+'. Если границы соседние, между ними нет целого числа.',[{value:b-a,text:'Разность считает шаги от одного конца до другого. Исключи обе граничные точки.'},{value:b-a+1,text:'Сейчас посчитаны и концы. Оба названных числа не относятся к внутренним точкам.'}]));
    return {prompt:'Найди количество натуральных чисел внутри каждого из двух промежутков. Введи ответы а; б.',inputPrompt:'Два количества',answer:steps.map(s=>s.answer),answerFormat:'v5-pair',steps,errors:[],data:{pairs},table:{caption:'Границы не включаются',headers:['Строка','Левая','Правая'],rows:pairs.map(([a,b],i)=>[i?'б':'а',a,b])},conditionKey:JSON.stringify(pairs)};
  }
  const repeat=(block,copies)=>Number(String(block).repeat(copies));
  function repeatBlock(number,seed,random,step){
    const short=number==='1.23',source=short?[seed?random(2,9):4,seed?random(13,88):30]:Array(3).fill(seed?random(101,985):329),times=short?[4,4]:[2,3,4],values=source.map((n,i)=>repeat(n,times[i])),steps=[];
    source.forEach((block,i)=>{
      steps.push(numeric(step,'Строка '+(i+1)+'. Запиши '+block+' подряд '+times[i]+' раза. Какое число получилось?',values[i],'Записывай полный блок справа без промежутков между цифрами. Сохрани каждую его цифру, включая нули.',[{value:block*times[i],text:'Получилось произведение. Здесь требуется дописать справа ещё одну копию блока, а не прибавлять его.'}]),reading(step,values[i]));
    });
    const chosen=seed?random(0,values.length-1):values.length-1;
    return {prompt:'Припиши блок '+source[chosen]+' подряд '+times[chosen]+' раза и введи составленное число. В каждом шаге разбора также прочитай его словами.',inputPrompt:'Получившееся число',answer:values[chosen],answerFormat:'v5-natural',steps,errors:steps[chosen*2].errors,data:{values,source,times},table:{caption:'Какие блоки дописываем',headers:['Строка','Блок','Копий'],rows:source.map((n,i)=>[i+1,n,times[i]])},conditionKey:JSON.stringify([source,times])};
  }
  const generators={'1.20':passage,'1.21':rank,'1.22':between,'1.23':(s,r,t)=>repeatBlock('1.23',s,r,t),'1.24':(s,r,t)=>repeatBlock('1.24',s,r,t)};
  const bounds={'1.20':{row:[0,5,0],place:[0,11,0]},'1.21':{row:[0,0,0],place:[0,11,0]},'1.22':{row:[0,1,0],position:[0,11,0]},'1.23':{row:[0,1,0],copies:[1,4,1]},'1.24':{row:[0,2,0],copies:[1,4,1]}};
  function explore(lesson,state,task,table){
    if(lesson.number==='1.20'||lesson.number==='1.21')return D.explore(lesson,state,task,table);
    if(lesson.number==='1.22'){
      const [a,b]=task.data.pairs[state.row],gap=b-a,position=Math.min(state.position,gap),selected=a+position;
      const controls=[{key:'row',title:'Промежуток',values:[[0,'а'],[1,'б']]},{key:'position',title:'Сколько шагов пробуем пройти. У правой границы останавливаемся',min:0,max:11,step:1}];
      let marks='';for(let i=0;i<=gap;i++){const x=20+230*i/gap,edge=i===0||i===gap;marks+='<circle cx="'+x+'" cy="30" r="'+(edge?5:3.5)+'" fill="'+(edge?'white':i<=position?'#267570':'#a6b4ab')+'" stroke="#22513d"/>';}
      const x=20+230*position/gap;
      const visual='<svg viewBox="0 0 270 56" role="img" aria-label="Числовая прямая от '+a+' до '+b+'. Указатель на числе '+selected+'"><path d="M20 30H250" stroke="#477060" stroke-width="2"/>'+marks+'<path d="M'+(x-4)+' 12h8l-4 8z" fill="#9f551c"/></svg><p>Пустые круги — границы '+a+' и '+b+'. Указатель на числе '+selected+'.</p>';
      const inside=Math.max(0,Math.min(position,gap-1));
      return {title:'Отметь внутренние точки',controls,visual,question:'Сколько внутренних точек уже пройдено, включая точку под указателем, если она внутренняя?',answer:inside,why:'Учитываем только числа строго между '+a+' и '+b+'. До указателя включительно таких точек '+inside+'.'};
    }
    const block=task.data.source[state.row],copies=state.copies,pattern=Array(copies).fill(block);
    return {title:'Припиши блок справа',controls:[{key:'row',title:'Строка задания',values:task.data.source.map((_,i)=>[i,i+1])},{key:'copies',title:'Копий блока на модели',min:1,max:4,step:1}],visual:table('Один шаг — один полностью дописанный блок',['Шаг','Запись после шага'],pattern.map((_,i)=>[i+1,String(block).repeat(i+1)])),question:'Сколько цифр в результате после выбранного числа повторов?',answer:String(block).length*copies,why:'В одной копии '+String(block).length+' цифр. Число цифр равно '+String(block).length+' × '+copies+'. Для чтения получим '+D.words(repeat(block,copies))+'.'};
  }
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedTextNumbers=api;
})(typeof window!=='undefined'?window:globalThis);
