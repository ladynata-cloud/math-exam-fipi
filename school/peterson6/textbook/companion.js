(function (root) {
  'use strict';
  const U = root.PetersonUI;
  let pdfUrl = '', fileError = '', fileSelection = 0;
  const problemNotes = {
    175: 'Два участника прошли один и тот же маршрут. Велосипедисту понадобилось пять часов, мотоциклисту — два. Разница скоростей составила 23,4 км/ч. Какова длина маршрута?',
    240: 'Оцени углы на схеме или измерь их на бумаге. Упорядочь буквы от самого узкого угла до самого широкого. Как меняется разность соседних углов? Предложи следующий угол и найди половину его величины.',
    293: 'Считай фигуры по размеру. Составная фигура тоже считается, если каждая её сторона проведена полностью.',
    303: 'Навстречу друг другу по пути длиной 385 км одновременно отправились два поезда. Скорость первого в 1,2 раза больше скорости второго. Сколько километров прошёл первый до встречи?',
    305: 'Из одной точки в противоположных направлениях выехали велосипедист и мотоциклист. Через 80 минут расстояние между ними стало 96 км. Мотоциклист едет втрое быстрее. Определи скорости.',
    349: 'Модель весов: одна машинка уравновешивает мяч и два одинаковых кубика. Машинка с ещё одним кубиком уравновешивает два мяча. Скольким кубикам соответствует машинка?',
    363: 'После скидок 5%, 10%, 20% и 30% получились цены 190, 180, 170 и 140 рублей соответственно. У какой из четырёх покупок исходная цена была наибольшей?',
    475: 'У двух книг цены составляют 56% и 64% одной и той же суммы. Если взять сразу обе, не хватает 15 рублей. Сколько стоят две книги вместе?',
    494: 'В трёх районах вместе живут 70 тысяч человек. В первом жителей на 20% больше, чем во втором. В третьем живёт половина населения первого. Найди величину, указанную в подпункте.',
    497: 'Вкладчик вносит 5000 рублей на три года под 8% годовых. Сопоставь две модели: проценты всегда на начальный вклад или ежегодно на выросшую сумму.'
  };
  function diagram(title, content, box) {
    return '<figure class="companion-diagram"><svg role="img" viewBox="'+box+'"><title>'+U.esc(title)+'</title>'+content+'</svg><figcaption>'+U.esc(title)+'</figcaption></figure>';
  }
  function line(x1,y1,x2,y2) {
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>';
  }
  function label(x,y,text) {
    return '<text x="'+x+'" y="'+y+'">'+U.esc(text)+'</text>';
  }
  function angleSet() {
    const angles=[['D',58],['A',22],['K',112],['B',32],['L',134],['F',92],['C',44],['E',74]];
    return diagram('Углы для наблюдения',angles.map(([name,degree],i)=>{
      const x=55+(i%4)*85,y=49+Math.floor(i/4)*65,r=33,t=degree*Math.PI/180;
      return line(x,y,x+r,y)+line(x,y,x+r*Math.cos(t),y-r*Math.sin(t))+label(x-6,y+15,name);
    }).join(''),'0 0 365 140');
  }
  function squares(){
    let drawing='<rect x="10" y="10" width="160" height="160"/>';
    for (const size of [160,80,40]) {
      drawing+=line(10+size/2,10,10+size/2,10+size)+line(10,10+size/2,10+size,10+size/2);
    }
    return diagram('Квадраты разных размеров',drawing,'0 0 180 180');
  }
  function triangles(){
    const points=Array.from({length:6},(_,i)=>{const t=(i*60-90)*Math.PI/180;return [100+Math.cos(t)*86,100+Math.sin(t)*86];});
    let drawing=[0,1].map(start=>'<polygon points="'+[0,2,4].map(k=>points[start+k].join(',')).join(' ')+'"/>').join('');
    const inner=Array.from({length:6},(_,i)=>{const t=(i*60-60)*Math.PI/180;return [100+Math.cos(t)*86/Math.sqrt(3),100+Math.sin(t)*86/Math.sqrt(3)];});
    for (let i=0;i<3;i++) drawing+=line(...inner[i],...inner[i+3]);
    return diagram('Треугольники в шестиконечной звезде',drawing,'0 0 200 200');
  }
  function rays(center, directions) {
    const [cx,cy]=center;
    return Object.entries(directions).map(([name,deg])=>{
      const r=deg*Math.PI/180,dx=Math.cos(r),dy=-Math.sin(r);
      return line(cx,cy,cx+58*dx,cy+58*dy)+label(cx+70*dx-3,cy+70*dy+4,name);
    }).join('')+label(cx-11,cy+13,'O');
  }
  function source241(part) {
    if(part.id==='241-1')return diagram('Лучи OA и OC противоположны. Угол BOC равен 28°, AOD прямой.',rays([90,90],{A:180,C:0,B:28,D:270}),'0 0 180 180');
    if(part.id==='241-2')return diagram('Прямые AD и CM пересекаются в O. Угол AOM равен 28°, луч OB перпендикулярен AD.',rays([90,90],{A:180,D:0,C:28,M:208,B:90}),'0 0 180 180');
    return '';
  }
  function coordinateTriangle(){
    const vertices=[[9,0,'A'],[0,6,'B'],[15,9,'C']],px=x=>28+12*x,py=y=>143-12*y;
    const grid=Array.from({length:17},(_,i)=>line(px(i),py(0),px(i),py(10))).join('')+
      Array.from({length:11},(_,i)=>line(px(0),py(i),px(16),py(i))).join('');
    const polygon='<polygon points="'+vertices.map(([x,y])=>[px(x),py(y)].join(',')).join(' ')+'"/>';
    return diagram('Координатная сетка: одна клетка — единица','<g opacity=".16">'+grid+'</g>'+polygon+
      vertices.map(([x,y,n])=>label(px(x)-3,py(y)-5,n)).join('')+label(8,152,'O'),'0 0 240 160');
  }
  const openingStatements = [
    'Земля имеет естественный спутник — Луну.',
    'В рассматриваемом лесу есть мухоморы.',
    'Гриб мухомор относится к несъедобным.',
    'В реке Москве обитают крокодилы.',
    'Длина Амазонки больше длины Нила.',
    'Высота Джомолунгмы меньше высоты Эвереста.',
    'Число материков Земли равно семи или восьми.',
    'Арбуз входит хотя бы в одну из двух групп: овощи или фрукты.',
    'Расписание на среду включает и математику, и чтение.',
    'В школьный буфет не доставили ни булочки, ни коржики.',
    'Десятичная запись 0,5 и обыкновенная дробь 1/2 обозначают разные числа.',
    'Площадь прямоугольника равна длине, умноженной на ширину.'
  ];
  const disproofs = [
    ['Натуральный ряд содержит ноль.', 'Для этого упражнения натуральный ряд начинается с единицы.'],
    ['Единица входит в множество простых чисел.', 'Сосчитай различные натуральные делители единицы.'],
    ['Ни одно число не лежит строго между 2 и 3.', 'Проверь, куда на оси попадёт середина этого промежутка.'],
    ['Выражение 18 · 947 + 456 делится на 9 без остатка.', 'Первое слагаемое кратно 9. Проверь второе с помощью суммы цифр.'],
    ['Для числа 53 535 353 подходит хотя бы один делитель из двух: 3 или 5.', 'Проверь сумму цифр, затем последнюю цифру.'],
    ['Оба числа, 0 и 4, подходят к уравнению x² + 2 = 18.', 'Подставь каждое число отдельно.'],
    ['Число 8,9 не меньше 9.', 'Представь 9 как 9,0 и сравни целые части.'],
    ['Неправильная положительная дробь меньше 1.', 'Сравни её числитель со знаменателем.']
  ];
  const proposedNegations = [
    ['Все кошки серого цвета.', 'Каждая кошка имеет другой цвет.', 'Представь двух кошек разной окраски.'],
    ['Есть сладкие ягоды.', 'Есть ягоды без сладкого вкуса.', 'Может ли в одной корзине быть ягода каждого вида?'],
    ['Существует месяц длиной 30 дней.', 'Существует месяц длиной не 30 дней.', 'Сравни длительность апреля и января.'],
    ['Каждое утро бывает дождь.', 'Дождя по утрам не бывает никогда.', 'Возьми одно дождливое утро и одно сухое.']
  ];
  const numberSet = ['5/16','0','3/1000','4,8','25 004','5 7/9','1','0,0095'];
  const setQuestions = {
    '008-1-a':'Какие элементы подходят для счёта предметов, начиная с единицы?',
    '008-1-b':'Какие элементы этой записи учебник относит к дробям? Здесь выбираем нецелые числа.',
    '008-2-a':'Какие дроби на карточках записаны только числителем и знаменателем?',
    '008-2-b':'Какая запись сочетает целую часть и обыкновенную дробь?',
    '008-2-v':'Какие элементы записаны с десятичной запятой?'
  };
  const dictation = {
    '010-a':['Шесть миллионов, семьсот две тысячи и пятьдесят восемь единиц.','Собери число из классов. В каждом классе после миллионов оставь три позиции.'],
    '010-b':['Семь целых и четыре пятых единицы.','Представь семь полных полосок и ещё четыре части полоски, разделённой на пять.'],
    '010-v':['Три целых и двенадцать стотысячных.','Стотысячные стоят на пятом месте после запятой. Заполни пустые разряды нулями.']
  };
  function pageSevenQuestion(number,part) {
    if(number===7)return 'Перед тобой начало ряда: '+part.prompt+' Подбери правило, которое работает на каждом переходе. Запиши через точку с запятой ещё два числа в порядке появления. Свой способ можно пояснить в записях.';
    if(number===8&&setQuestions[part.id])return 'На карточках собраны элементы множества A. '+setQuestions[part.id]+' Перечисли нужные записи через точку с запятой, в любом порядке.';
    if(number===9)return 'Собери семизначные натуральные числа из пяти нулей и двух пятёрок. Используй все семь цифр каждый раз. Запиши разные результаты от меньшего к большему через точку с запятой. Прочитай получившиеся числа вслух.';
    if(number===10&&dictation[part.id])return 'Запиши число цифрами. '+dictation[part.id][0];
    return '';
  }
  function numberTiles(values,caption) {
    const tiles=values.map(v=>'<span style="display:inline-block;padding:.2em .5em;border:1px solid #718b82;border-radius:.3em;background:#f0f5ef">'+U.fmt(v)+'</span>');
    return '<figure style="margin:.65em 0"><figcaption>'+U.esc(caption)+'</figcaption><div style="display:flex;align-items:center;gap:.35em;flex-wrap:wrap">'+tiles.join('')+'</div></figure>';
  }
  function pageSevenFigure(number,part) {
    if(number===7)return numberTiles(part.prompt.split(';').map(v=>v.replace(/;?\s*…$/,'').trim()).filter(Boolean).concat(['?','?']),'Два пустых места — два следующих члена ряда.');
    if(number===8)return '<figure><figcaption>Множество A. Выбери карточки для ответа. Повторное нажатие снимает выбор.</figcaption><div style="display:flex;flex-wrap:wrap;gap:.4em">'+numberSet.map(v=>'<button type="button" class="secondary" data-set-number="'+U.esc(v)+'" aria-pressed="false">'+U.fmt(v)+'</button>').join('')+'</div></figure>';
    if(number===9)return numberTiles(['5','5','0','0','0','0','0'],'Цифры для одного числа. Ноль не может занять первое место.');
    if(number===10)return numberTiles(part.id==='010-a'?['миллионы','тысячи','единицы']:part.id==='010-b'?['целые','числитель','знаменатель']:['целые','десятые','сотые','тысячные','десятитысячные','стотысячные'],dictation[part.id][1]);
    return '';
  }
  function normalizeNumber(raw) {
    const s=raw.trim().replace(/\.$/,'').replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ');
    return /^\d{1,3}(?: \d{3})+$/.test(s)?s.replace(/ /g,''):s.replace(/(?<=\d)\.(?=\d)/g,',');
  }
  function setTiles(main,answer){
    const buttons=main.querySelectorAll('[data-set-number]');
    if(!buttons.length||!answer)return;
    const entries=()=>answer.value.split(';').map(s=>s.trim()).filter(Boolean);
    function show(){
      const selected=new Set(entries().map(normalizeNumber));
      for(const b of buttons){const on=selected.has(normalizeNumber(b.dataset.setNumber));b.setAttribute('aria-pressed',String(on));b.style.outline=on?'3px solid #14705b':'';}
    }
    for(const b of buttons)b.onclick=()=>{
      const label=b.dataset.setNumber,key=normalizeNumber(label),values=entries(),others=values.filter(v=>normalizeNumber(v)!==key);
      answer.value=(others.length!==values.length?others:[...values,label]).join('; ');
      answer.dispatchEvent(new Event('input',{bubbles:true}));
    };
    answer.addEventListener('input',show);show();
  }
  function pageSevenResponse(number,part,input,correct) {
    if(number===10 && !correct) return {ok:false,text:dictation[part.id][1]};
    if(number<7||number>9)return null;
    const items=input.split(';').map(normalizeNumber);
    if(items.some(x=>!x||!/^[\d ,/]+$/.test(x)))return {ok:false,text:'Черновик сохранён. Для быстрой самопроверки введи только числа через точку с запятой. Объяснение можно оставить в записях.'};
    const expected=part.answer.split(';').map(normalizeNumber);
    if(number===7){
      const compare=(a,b)=>root.PetersonBook.M.check(a,b);
      const index=items.findIndex((v,i)=>i<2&&!compare(v,expected[i]));
      if(items.length!==2)return {ok:false,text:'Запиши ровно два следующих члена, разделив их точкой с запятой.'};
      if(index<0)return {ok:true,text:'Оба числа продолжают закономерность. Проверь своё правило на предыдущем переходе и запиши, как ты его нашёл.'};
      const clue={'007-a':'Сравни каждое число с удвоенным предыдущим.','007-b':'Посмотри отдельно на изменение числителя и на шаг знаменателя.','007-v':'Целая часть не меняется. Отследи, сколько нулей стоит перед последней ненулевой цифрой.','007-g':'Проследи отдельно целую часть, числитель и знаменатель смешанного числа.'};
      return {ok:false,text:(index===1?'Первый новый член подходит. Проверь переход от него ко второму. ':'Первый новый член расходится с простым правилом этого ряда. ')+clue[part.id]};
    }
    if(number===8){
      const wrong=items.find(x=>!expected.includes(x)),repeated=new Set(items).size!==items.length;
      if(wrong==='0'&&part.id==='008-1-a')return {ok:false,text:'Ты включил ноль. В этом издании натуральный ряд для счёта начинается с единицы.'};
      if(wrong)return {ok:false,text:'Проверь карточку «'+wrong+'». '+setQuestions[part.id]};
      if(repeated)return {ok:false,text:'Один элемент встречается в ответе дважды. В множестве достаточно указать его один раз.'};
      return items.length===expected.length?{ok:true,text:'Ты собрал все нужные элементы множества.'}:{ok:false,text:'Выбранные карточки подходят. Среди оставшихся есть ещё подходящая запись.'};
    }
    const arranged=items.every((v,i)=>i===0||Number(v)>Number(items[i-1]));
    if(items.some(v=>!/^5[05]{6}$/.test(v)||(v.match(/5/g)||[]).length!==2))return {ok:false,text:'Проверь состав каждого числа: семь цифр, первая — пятёрка, а среди оставшихся шести позиций ровно одна занята второй пятёркой.'};
    if(!arranged)return {ok:false,text:'Цифры подходят. Упорядочь числа по разряду второй пятёрки: начни с её самого малого значения.'};
    return items.length===6?{ok:true,text:'Все шесть чисел расположены по возрастанию. Прочитай их вслух, называя миллионы, тысячи и единицы.'}:{ok:false,text:'Порядок верный. Проверь, все ли шесть позиций второй пятёрки использованы.'};
  }

  function openingQuestion(number,part) {
    if(number>=7&&number<=10)return pageSevenQuestion(number,part);
    const index=Number(part.id.split('-')[1])-1;
    if(number===1 && openingStatements[index])return 'Высказывание: «'+openingStatements[index]+'» Сначала начни отрицание со слов «Неверно, что…», затем передай ту же мысль без них. Почему ровно одно из двух высказываний истинно?';
    if(number===2 && disproofs[index]){const [claim,check]=disproofs[index];return 'Опровергни утверждение: «'+claim+'» Запиши его отрицание и обоснуй. '+check;}
    if(number===3 && part.prompt)return 'Исходная запись: '+part.prompt+'. Измени знак отношения так, чтобы новая запись отрицала исходную. Проверь обе записи и объясни, почему истинна ровно одна.';
    if(number===4)return 'Сам выбери свойство прямоугольника и вырази его законченным утверждением. Запиши отрицание и объясни на примере, почему для одного и того же прямоугольника истинна ровно одна из двух фраз.';
    if(number===5 && proposedNegations[index]){const [claim,attempt,check]=proposedNegations[index];return 'Первая фраза: «'+claim+'» Вторая: «'+attempt+'» Покажи на примере, почему вторая не является отрицанием первой. Затем запиши настоящее отрицание. '+check;}
    if(number===6 && part.prompt)return 'Проверь по рисунку запись '+part.prompt+'. Если она ложна, замени её верной записью, отрицающей исходную. Точки с подписями изображают числа. Символ ∈ означает принадлежность, ∩ — пересечение, ∪ — объединение.';
    return '';
  }
  function openingVenn() {
    const outline='<ellipse cx="104" cy="82" rx="84" ry="63"/><ellipse cx="73" cy="94" rx="28" ry="22"/><ellipse cx="186" cy="114" rx="48" ry="30"/>';
    const dot=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="2.8" fill="currentColor" stroke="none"/>';
    const names=label(43,78,'A')+label(140,22,'B')+label(223,97,'C')+label(78,97,'3')+label(125,61,'8,2');
    const description='<desc>Точка 3 в A. Точка 8,2 в B вне A и C. Область A целиком внутри B. Область C пересекает границу B и не пересекает A.</desc>';
    return diagram('Множества A, B и C с точками 3 и 8,2.',description+outline+dot(70,95)+dot(120,63)+names,'0 0 245 156');
  }
  function hasCompletePrompt(item,part){
    if(openingQuestion(item.number,part))return true;
    if(part.kind==='expression')return true;
    if(item.number===241)return part.id==='241-1'||part.id==='241-2';
    if(item.number===282)return part.id==='282-3';
    return [175,240,293,303,305,340,349,363,420,449,475,494,497].includes(item.number);
  }
  function question(item,part) {
    const opening=openingQuestion(item.number,part);
    if(opening)return opening;
    if(item.number===293)return part.prompt+' '+problemNotes[293];

    if(item.number===340&&part.label.includes('%'))return 'Запиши '+part.label.replace(/^.*?\)\s*/, '')+' в виде числа.';
    if(item.number===340)return 'Вырази '+part.label.replace(/^.*?\)\s*/, '')+' в процентах.';
    if(item.number===449)return part.id.endsWith('1')?'Величина a на 150% больше b. На сколько процентов b меньше a?':'Величина x составляет половину y. На сколько процентов y больше x?';
    if(item.number===420){
      const shapes=['прямоугольника со сторонами 4,2 и 3,5 м','трапеции с основаниями 6 и 3 м и высотой 4 м','трапеции с основаниями 8 и 13 м и высотой 6 м'];
      return 'Найди налог с площади '+shapes[Number(part.id.split('-').at(-1))-1]+'. Первые 15 м² оплачиваются по 2 рубля за м², следующие 15 м² — по 4 рубля, остальные — по 20 рублей.';
    }
    return problemNotes[item.number]||part.prompt||(part.expression?'Выполни действия и запиши ответ.':'Прочитай условие этого подпункта в своём учебнике. Запиши ответ, а если нужен разбор, открой первый шаг.');
  }
  function material(item,part) {
    const ref='<p data-book-reference class="source-caption">Дорофеев, Петерсон · часть 1 · с. '+item.page+' · № '+item.number+' · '+U.esc(part.label)+'</p>';
    const prompt=question(item,part);
    let drawing=U.diagram(part.diagram);
    if(item.number===6)drawing=openingVenn();
    if(item.number>=7&&item.number<=10)drawing=pageSevenFigure(item.number,part);
    if(item.number===240) drawing=angleSet();
    if(item.number===241) drawing=source241(part);
    if(part.id==='282-3') drawing=coordinateTriangle();
    if(item.number===293) drawing=part.id==='293-a'?squares():triangles();
    const mode=hasCompletePrompt(item,part)?'Всё условие для этого подпункта приведено здесь.':'Для этого подпункта используй формулировку, таблицу или рисунок из своего учебника.';
    return ref+'<p class="small">'+mode+'</p><p class="problem">'+U.fmt(prompt)+'</p>'+(part.expression?'<div class="math-line" aria-label="Выражение">'+U.expression(part.expression)+'</div>':'')+drawing;
  }
  function pane(item,part) {
    const link=pdfUrl?'<p><a href="'+U.esc(pdfUrl)+'#page='+item.page+'" target="_blank" rel="noopener noreferrer">Открыть с. '+item.page+' в моём PDF ↗</a></p>':'';
    return '<section class="card source-pane" aria-label="Материалы к номеру"><h2>Работа над подпунктом</h2>'+material(item,part)+'<button class="secondary" data-action="zoom">Увеличить материал</button><details class="own-book"'+(pdfUrl||fileError?' open':'')+'><summary>Мой экземпляр учебника</summary><p>Можно пользоваться бумажной книгой или открыть свою PDF-копию издания 2019 года. Файл открывается на этом устройстве.</p>'+link+'<label for="personal-pdf">'+(pdfUrl?'Выбрать другой PDF':'Выбрать PDF')+'</label><input type="file" id="personal-pdf" accept="application/pdf,.pdf"><p role="status">'+U.esc(fileError)+'</p></details></section>';
  }
  async function attach(file) {
    const request=++fileSelection;
    if(!file)return;
    try{
      if(!file.size||file.size>250*1024*1024||(await file.slice(0,5).text())!=='%PDF-')throw Error('Выбери PDF-файл учебника размером до 250 МБ.');
      if(request!==fileSelection)return;
      const next=URL.createObjectURL(new Blob([file],{type:'application/pdf'}));
      if(pdfUrl)URL.revokeObjectURL(pdfUrl);
      pdfUrl=next;fileError='';
    }catch(error){if(request===fileSelection)fileError=error.message;}
  }
  root.PetersonCompanion={pane,material,attach,hasCompletePrompt,pageSevenResponse,setTiles};
})(globalThis);
