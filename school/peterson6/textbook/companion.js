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
  const placeName=power=>({'4':'десятки тысяч','3':'тысячи','2':'сотни','1':'десятки','0':'единицы','-1':'десятые','-2':'сотые','-3':'тысячные','-4':'десятитысячные','-5':'стотысячные','-6':'миллионные'})[power]||'разряд '+power;
  const opHint={
    add:'Совмести запятые. Дополни пустые дробные разряды нулями, затем складывай одинаковые разряды.',
    subtract:'Совмести запятые. Перед вычитанием можешь разменять один старший разряд на десять единиц соседнего младшего.',
    multiply:'Сначала оцени результат. Множитель между нулём и единицей уменьшает первое число, а множитель больше единицы увеличивает его.',
    divide:'При делении на десятичную дробь перенеси запятую в обоих числах одинаково. Если делитель меньше единицы, частное больше делимого.'
  };
  function decimalColumns(part){
    const a=[part.expression.left,part.expression.right].map(v=>String(v).replace(',','.').split('.'));
    const whole=Math.max(...a.map(([x])=>x.length)),fraction=Math.max(...a.map(([,x])=>(x||'').length));
    return Array.from({length:whole+fraction},(_,i)=>whole-1-i);
  }
  function operations(node,result=[]){
    if(node&&typeof node==='object'){operations(node.left,result);operations(node.right,result);result.push(node);}
    return result;
  }
  function decimalModel(part,view=0,interactive=false){
    const many=/^(013|023|038)-/.test(part.id),columns=many?[]:decimalColumns(part),nodes=many?operations(part.expression):[],keys=many?nodes.map((_,i)=>'Действие '+(i+1)):columns.map(placeName);
    const title=many?'Порядок действий':'Разрядная сетка обоих чисел';
    const picker=interactive?'<label>Рассмотреть <select data-decimal-position><option value="0">Всё выражение</option>'+keys.map((label,i)=>'<option value="'+(i+1)+'"'+(view===i+1?' selected':'')+'>'+U.esc(label)+'</option>').join('')+'</select></label>':'';
    let body;
    if(many){
      const chosen=nodes[view-1];body=chosen?'<p>В выбранном действии: '+U.expression(chosen)+'.</p>':'<p>Выбери действие и найди его операнды. Сначала выполняются внутренние операции, в конце — внешняя.</p>';
    }else{
      const band=value=>{
        const [integer,dec='']=String(value).replace(',','.').split('.');
        return '<div style="display:grid;grid-template-columns:repeat('+columns.length+',minmax(0,1fr));margin:.35em 0" aria-label="'+U.esc(String(value))+'">'+columns.map((power,i)=>{
          const actual=power>=0?integer[integer.length-1-power]:dec[-power-1],selected=view===i+1;
          return '<span style="text-align:center;border:1px solid #8da899;padding:.15em 0;'+(power===0?'border-right:3px solid #365e50;':'')+(selected?'background:#d8ecdd;font-weight:bold;':'')+'">'+(actual===undefined?'·':actual)+'</span>';
        }).join('')+'</div>';
      };
      body=band(part.expression.left)+band(part.expression.right)+'<p>Жирная черта стоит после единиц. Точка в пустой ячейке означает отсутствие записанной цифры. '+(view?'Выбраны '+placeName(columns[view-1])+'. ':'')+opHint[part.expression.op]+'</p>';
    }
    return '<figure style="margin:.6em 0" data-decimal-host><figcaption>'+title+'</figcaption>'+picker+body+'</figure>';
  }
  function mountDecimal(main,part,work,save){
    let host=main.querySelector('[data-decimal-host]');if(!host)return;
    function draw(){
      host.outerHTML=decimalModel(part,work.decimalView||0,true);host=main.querySelector('[data-decimal-host]');
      const select=host.querySelector('select');select.onchange=()=>{
        const view=Number(select.value);if(view)work.decimalView=view;else delete work.decimalView;
        save();draw();host.querySelector('select').focus({preventScroll:true});
      };
    }
    draw();
  }
  function decimalError(number,part,input,correct){
    if(correct||number<11||number>13)return null;
    if(number===13)return {ok:false,text:'Проверь оба выражения по сторонам последнего '+(part.expression.op==='add'?'сложения':'вычитания')+'. Внутри каждой цепочки умножение и деление выполняются слева направо.'};
    const M=root.PetersonBook.M,x=part.expression,expected=root.PetersonBook.exact(x),value=M.parse(input);
    if(!value)return null;
    for(const factor of [10,100,1000,'0.1','0.01','0.001'])if(M.equal(value,M.operation('multiply',expected,factor)))return {ok:false,text:'Цифры похожи на результат, но разряд не совпал. '+opHint[x.op]};
    const other={add:'subtract',subtract:'add',multiply:'add',divide:'multiply'}[x.op];
    if(M.equal(value,M.operation(other,x.left,x.right)))return {ok:false,text:'Получился результат другого действия. Посмотри на знак между числами. '+opHint[x.op]};
    return {ok:false,text:opHint[x.op]};
  }

  const orderStems=[
    'У числа 79 399 есть предыдущее натуральное число. Выбери его.',
    'Прочитай запись 12 705 320. Какая цифра занимает разряд десятков тысяч?',
    'В числе 9 876 543 210 найди цифру сотен миллионов.',
    'Рассмотри дробь 0,123456789. Какая цифра записана в разряде миллионных?',
    'У числа 3 2/9 назови знаменатель дробной части.',
    'Какое действие подразумевается между целой и дробной частями смешанного числа?',
    'Запиши числом разрядную сумму 80 000 000 + 3 000 000 + 4 000 + 20.',
    'Какое число равно сумме 3 · 10⁵ + 5 · 10⁴ + 8 · 10² + 7?'
  ];
  const orderClues=[
    'Предыдущее число на единицу меньше данного.','От единиц, двигаясь влево, дойди до пятой позиции.',
    'Разбей запись на классы по три цифры справа. В классе миллионов выбери сотни.',
    'Справа от запятой миллионные занимают шестую позицию.','Знаменатель показывает, на сколько равных частей разделена единица. В записи дроби он стоит под чертой.',
    'Смешанное число состоит из целых единиц и добавленной к ним дробной части.',
    'Оставь нули в тех разрядах, которые не названы.','Расставь коэффициенты по степеням десятки. Если слагаемого для разряда нет, оставь в этом разряде ноль.'
  ];
  const contrast=(part)=>part.prompt.split(/\s+и\s+/).map(s=>s.trim());
  function compareSource(number,part){
    if(number===14)return part.id==='014-itog'?'Восстанови по порядку восемь букв выбранных окончаний из предыдущих подпунктов. Объяснение можно записать отдельно.':orderStems[Number(part.id.slice(4))-1];
    const [a,b]=contrast(part);return number===15?'Сравни числа '+a+' и '+b+'. Выбери знак между ними. Проверь целые части и первый различающийся разряд.':'Сравни дроби '+a+' и '+b+'. Выбери знак. Попробуй объяснить решение через общий знаменатель, сравнение с единицей или расстояние до единицы.';
  }
  function fractionHint(id){
    return {'016-a':'При равных знаменателях сравни числители.','016-b':'При одинаковых положительных числителях большему знаменателю соответствует меньшая доля.','016-v':'Сравни каждую дробь с единицей. У какой числитель больше знаменателя?','016-g':'Приведи обе дроби к общему знаменателю или сравни перекрёстные произведения.','016-d':'Обе дроби близки к единице. Какая из них недобирает меньшую долю?'}[id];
  }
  function sourceSupport(number,part){
    if(number===14){
      if(part.id==='014-itog')return numberTiles(['1','2','3','4','5','6','7','8'],'Одна буква для каждой позиции. Порядок важен.');
      const i=Number(part.id.slice(4))-1,tokens=[['до','79 399','после'],['12','705','320'],['9','876','543','210'],['1','2','3','4','5','6','7','8','9'],['целая часть','числитель','знаменатель'],['три целых','ещё две девятых'],['миллионы','тысячи','единицы'],['10⁵','10⁴','10³','10²','10¹','10⁰']][i];
      return numberTiles(tokens,['Соседи числа','Классы по три цифры','Классы по три цифры','Цифры после запятой, слева направо','Части смешанного числа','Две величины в одной записи','Разрядные классы','Степени десяти'][i]);
    }
    const row=contrast(part);
    if(number===15){
      const pieces=row.map(v=>v.replace(/\s/g,'').split(',')),w=Math.max(...pieces.map(v=>v[0].length)),d=Math.max(...pieces.map(v=>v[1]?.length||0));
      const bands=pieces.map(([a,b=''])=>{const str=a.padStart(w,' ')+b.padEnd(d,'0');return '<div style="display:grid;grid-template-columns:repeat('+str.length+',minmax(0,1fr));margin:.3em 0" aria-label="'+U.esc(a+(b?','+b:''))+'">'+[...str].map((c,i)=>'<span style="text-align:center;background:#edf4ed;border:1px solid #90aa9b;'+(i===w-1&&d?'border-right:3px solid #395b48':'')+'">'+(c===' '?' ':c)+'</span>').join('')+'</div>';}).join('');
      return '<figure style="margin:.5em 0"><figcaption>Одинаковые разряды стоят друг под другом.</figcaption>'+bands+'<p>У десятичной дроби справа можно дописать нули, сохранив значение.</p></figure>';
    }
    return fractionMethods(part);
  }
  function fractionMethods(part,selected=0,interactive=false){
    const [a,b]=contrast(part),[an,ad]=a.split('/').map(Number),[bn,bd]=b.split('/').map(Number);
    let l=ad,r=bd;while(r){const next=l%r;l=r;r=next;}
    const den=ad/l*bd,names=['Исходные дроби','Сравнение с единицей','Общий знаменатель','Дополнение до единицы'];
    const options=interactive?'<label>Способ <select data-fraction-method>'+names.map((v,i)=>'<option value="'+i+'"'+(i===selected?' selected':'')+'>'+v+'</option>').join('')+'</select></label>':'';
    const unit=(n,d)=>n===d?'равна единице':n<d?'меньше единицы':'больше единицы';
    let text;
    if(selected===1)text=a+' '+unit(an,ad)+', '+b+' '+unit(bn,bd)+'. Если обе дроби по одну сторону от 1, нужен ещё один способ.';
    else if(selected===2)text='При знаменателе '+den+' числитель первой дроби равен '+an*(den/ad)+', второй — '+bn*(den/bd)+'. Какой числитель больше?';
    else if(selected===3){const missing=(n,d)=>n===d?'уже равна 1':n<d?'до 1 не хватает '+(d-n)+'/'+d:'превышает 1 на '+(n-d)+'/'+d;
      text='Первая дробь: '+missing(an,ad)+'. Вторая: '+missing(bn,bd)+'. У меньшей правильной дроби недостающая часть больше.';}
    else text='Проверь, что уже одинаково, и выбери подходящий способ.';
    return '<figure data-fraction-host style="margin:.5em 0"><figcaption>Выбери способ сравнения дробей</figcaption><div style="display:flex;gap:1em;align-items:center">'+U.fmt(a)+'<span>?</span>'+U.fmt(b)+'</div>'+options+'<p>'+U.fmt(text)+'</p></figure>';
  }
  function mountFraction(main,part,work,save){
    let host=main.querySelector('[data-fraction-host]');if(!host)return;
    function draw(){
      host.outerHTML=fractionMethods(part,work.fractionView||0,true);host=main.querySelector('[data-fraction-host]');
      const select=host.querySelector('select');select.onchange=()=>{const n=Number(select.value);if(n)work.fractionView=n;else delete work.fractionView;save();draw();host.querySelector('select').focus({preventScroll:true});};
    }
    draw();
  }

  function orderResponse(number,part,input,correct){
    if(number<14||number>16)return null;
    if(part.id==='014-itog'){
      const actual=input.toLowerCase().replace(/[\s,;.)]/g,''),expected='вбабвббб';
      if(!/^[абв]{8}$/.test(actual))return {ok:false,text:'Нужно восемь букв а, б или в по порядку. Разбор останется в твоих записях.'};
      const i=[...actual].findIndex((v,j)=>v!==expected[j]);return i<0?{ok:true,text:'Восемь букв совпали с проверкой. Запись остаётся доступной для просмотра учителем.'}:{ok:false,text:'Проверь ответ '+(i+1)+'. '+orderClues[i]};
    }
    if(correct)return null;
    if(number===14)return {ok:false,text:orderClues[Number(part.id.slice(4))-1]};
    if(number===16)return {ok:false,text:fractionHint(part.id)};
    const [a,b]=contrast(part),parts=[a,b].map(v=>v.replace(/\s/g,'').split(','));
    if(parts[0][0].length!==parts[1][0].length)return {ok:false,text:'Сначала посчитай цифры в целой части. Большее количество цифр у положительного целого означает большее значение.'};
    return {ok:false,text:'Сравнивай слева направо, начиная с наибольшего разряда. Большая длина дробной части сама по себе не определяет большее число.'};
  }

  function campQuestion(number,part){
    if(number===18)return 'Рассмотри восемь планет Солнечной системы. Обозначь их множество C; множество планет, чьё русское название начинается на М, — M; группу планет-гигантов — Г. Изобрази их области и поставь точку Земля. Объясни свой выбор.';
    return part.id==='017-a'?'В лагере три отряда. В первом 25 ребят, во втором в 1,2 раза больше, чем в первом, а в третьем на 7 ребят меньше, чем во втором. Всех ребят поделили поровну на две команды. Сколько человек в каждой команде?':'За 28 дней в лагере израсходована тонна картофеля. Первые 12 дней ежедневно расходовалось 38 кг, а во все оставшиеся дни ежедневный расход был одинаковым. Сколько килограммов расходовалось за день во второй период?';
  }
  const relationNames=['Выбери расположение','Раздельные области','Области пересекаются','M целиком внутри Г','Г целиком внутри M'];
  const planetZones=['Выбери место для Земли','В C вне M и Г','Только в M','Только в Г','В пересечении M и Г','Вне C'];
  function astronomy(work,interactive){
    const relation=work.planetRelation||0,zone=work.earthZone||0;
    const positions=[[],[[82,68,40],[190,68,40]],[[105,68,47],[156,68,47]],[[107,68,22],[131,68,56]],[[132,68,56],[152,68,23]]][relation];
    const options=(labels,key,active)=>'<label>'+key+' <select '+(key==='Области'?'data-planet-relation':'data-planet-zone')+'>'+labels.map((label,i)=>'<option value="'+i+'"'+(i===active?' selected':'')+'>'+label+'</option>').join('')+'</select></label>';
    const shapes=positions.map(([cx,cy,r],i)=>'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+(i?'#9c5435':'#417457')+'" stroke-width="2"/><text x="'+(cx+(i?1:-1)*Math.floor(r*.33))+'" y="'+(cy-r+16)+'" text-anchor="middle">'+(i?'Г':'М')+'</text>').join('');
    const locations=[null,[135,136],relation===3?[105,71]:relation===4?[96,75]:relation===2?[75,72]:[81,70],relation===4?[153,71]:relation===3?[161,71]:relation===2?[188,72]:[191,70],relation===3?[105,71]:relation===4?[152,71]:[130,70],[136,171]];
    const impossible=(zone===4&&relation===1)||(zone===2&&relation===3)||(zone===3&&relation===4);
    const position=(relation||zone===1||zone===5)&&!impossible?locations[zone]:null;
    const earth=position?'<circle cx="'+position[0]+'" cy="'+position[1]+'" r="3" fill="#16476a"/><text x="'+(position[0]+6)+'" y="'+(position[1]+3)+'" style="font-size:11px">Земля</text>':'';
    const description=relationNames[relation]+'. '+(zone?planetZones[zone]:planetZones[0])+'.';
    return '<figure data-planet-host style="margin:.5em 0"><figcaption>Диаграмма множеств планет</figcaption>'+(interactive?'<div style="display:grid;gap:.4em">'+options(relationNames,'Области',relation)+options(planetZones,'Земля',zone)+'</div>':'')+
      '<svg viewBox="0 0 276 185" style="width:100%;max-width:450px;display:block" role="img" aria-label="'+U.esc(description)+'"><rect x="8" y="8" width="260" height="146" rx="20" fill="#f3f7f2" stroke="#34594d" stroke-width="2"/><text x="18" y="29">C</text>'+shapes+earth+'</svg>'+
      (impossible?'<p>При выбранном расположении такой области нет. Измени расположение или место для Земли.</p>':'')+
      (interactive?'<button class="secondary" type="button" data-planet-use>Перенести мой рисунок в ответ</button>':'')+'</figure>';
  }
  function mountPlanets(main,work,save){
    let host=main.querySelector('[data-planet-host]');if(!host)return;
    function draw(){
      host.outerHTML=astronomy(work,true);host=main.querySelector('[data-planet-host]');
      for(const [selector,key] of [['[data-planet-relation]','planetRelation'],['[data-planet-zone]','earthZone']]){
        host.querySelector(selector).onchange=e=>{const n=Number(e.target.value);if(n)work[key]=n;else delete work[key];save();draw();host.querySelector(selector).focus({preventScroll:true});};
      }
      const use=host.querySelector('[data-planet-use]');use.disabled=!work.planetRelation||!work.earthZone;
      use.onclick=()=>{
        const input=main.querySelector('#answer');if(!input)return;
        input.value='Мой рисунок: '+relationNames[work.planetRelation]+'. Земля: '+planetZones[work.earthZone]+'.';
        input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
      };
    }
    draw();
  }
  function campSupport(number,part){
    if(number===18)return astronomy({},false);
    const people=part.id==='017-a';
    const sections=people?[['Первый отряд','25 ребят'],['Второй отряд','в 1,2 раза больше первого'],['Третий отряд','на 7 меньше второго'],['Две равные команды','все три отряда вместе']]:[['Весь запас','1 т = 1000 кг'],['Первая часть смены','12 дней по 38 кг'],['Остальная часть смены','28 − 12 дней'],['Во второй период','одинаковый расход в каждый день']];
    return '<figure style="margin:.5em 0"><figcaption>'+(people?'Как связаны три отряда и команды':'Как разделить срок и запас на две части')+'</figcaption><dl>'+sections.map(([a,b])=>'<dt><strong>'+a+'</strong></dt><dd style="margin-left:.6em">'+b+'</dd>').join('')+'</dl></figure>';
  }
  function campResponse(number,part,input,correct,work){
    if(number===17&&!correct){
      const match=n=>root.PetersonBook.M.equal(input,n);
      if(part.id==='017-a')return {ok:false,text:match(78)?'Это общее число детей во всех отрядах. На сколько равных команд их разделили?':match(30)||match(23)?'Ты нашёл численность одного отряда. В команды входят дети из всех трёх отрядов.':'«В 1,2 раза» требует умножения, а «на 7 меньше» — вычитания. Сначала найди численность каждого отряда.'};
      return {ok:false,text:match(544)?'Это весь оставшийся запас в килограммах. В ответе нужен расход за один день.':match(16)?'Такова длительность второго периода. Раздели оставшийся запас на это число дней.':'Найди, сколько килограммов потратили за 12 дней. Из тонны вычти этот расход и раздели остаток на оставшиеся дни.'};
    }
    if(number!==18||!input.startsWith('Мой рисунок: '))return null;
    const described='Мой рисунок: '+relationNames[work.planetRelation]+'. Земля: '+planetZones[work.earthZone]+'.';if(input!==described)return null;
    if(work.planetRelation!==1)return {ok:false,text:'Назови планеты на М, затем четыре гиганта. Есть ли хотя бы одна планета сразу в обоих списках?'};
    if(work.earthZone!==1)return {ok:false,text:'Земля входит в Солнечную систему, её название начинается с З. Проверь, входит ли она в группу гигантов.'};
    return {ok:true,text:'Расположение областей и Земли совпало. Подпиши, какие планеты входят в каждую группу. Письменное объяснение остаётся для проверки учителем.'};
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

  function letterPuzzle(part){
    return part.id==='025-1'?{letters:'ЛЕТОПЁ',word:'ЛЕТО',output:'ПОЛЁТ',factor:2}:{letters:'ПЧЁЛКАЖ',word:'ПЧЁЛКА',output:'ЖЖЖЖЖЖ',factor:7};
  }
  function puzzleRows(puzzle,work){
    const digits=work.puzzleDigits||'-'.repeat(puzzle.letters.length),replace=word=>Array.from(word,c=>digits[puzzle.letters.indexOf(c)]).join('');
    return {digits,operand:replace(puzzle.word),target:replace(puzzle.output)};
  }
  function letterEquation(puzzle,work){
    const {operand,target}=puzzleRows(puzzle,work);
    return puzzle.factor===2?operand+' + '+operand+' = '+target:operand+' × 7 = '+target;
  }
  function puzzleFigure(part,work,interactive){
    const puzzle=letterPuzzle(part),{digits,operand,target}=puzzleRows(puzzle,work),chars=Array.from(puzzle.letters);
    const field=chars.map((c,i)=>'<label style="display:grid;gap:.2em">'+c+'<select data-puzzle-letter="'+c+'" aria-label="Цифра для буквы '+c+'"><option value="-">?</option>'+Array.from({length:10},(_,d)=>'<option value="'+d+'"'+(digits[i]===String(d)?' selected':'')+'>'+d+'</option>').join('')+'</select></label>').join('');
    const rows=puzzle.factor===2?[['',puzzle.word,operand],['+',puzzle.word,operand],['=',puzzle.output,target]]:[['',puzzle.word,operand],['×','7','7'],['=',puzzle.output,target]];
    const line=([op,word,val])=>'<div style="display:grid;grid-template-columns:1.1em 1fr 1fr;align-items:baseline;text-align:right;font-size:clamp(.86rem,3.8vw,1.1rem)"><span>'+op+'</span><span aria-label="'+word+'">'+word+'</span><strong aria-label="'+val.replaceAll('-','?')+'" style="font-variant-numeric:tabular-nums;letter-spacing:.08em">'+val.replaceAll('-','·')+'</strong></div>';
    return '<section data-puzzle-host aria-label="Подстановка цифр по разрядам"><h3>Буквы и цифры</h3><p>У одной буквы в каждой позиции одна и та же цифра. Е и Ё обозначают разные буквы.</p><div style="max-width:22em;border:1px solid #91a79b;padding:.5em">'+rows.map(line).join('')+'</div>'+(interactive?'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(3.6em,1fr));gap:.45em;margin:.65em 0">'+field+'</div><button type="button" class="secondary" data-puzzle-use>Перенести равенство в ответ</button>':'')+'</section>';
  }
  function mountPuzzle(main,part,work,save){
    const puzzle=letterPuzzle(part);let host=main.querySelector('[data-puzzle-host]');if(!host)return;
    function draw(){
      host.outerHTML=puzzleFigure(part,work,true);host=main.querySelector('[data-puzzle-host]');
      for(const field of host.querySelectorAll('[data-puzzle-letter]'))field.onchange=()=>{
        const digits=[...puzzleRows(puzzle,work).digits],letter=field.dataset.puzzleLetter;digits[puzzle.letters.indexOf(letter)]=field.value;
        work.puzzleDigits=digits.join('');save();draw();host.querySelector('[data-puzzle-letter="'+letter+'"]').focus({preventScroll:true});
      };
      const use=host.querySelector('[data-puzzle-use]');use.disabled=puzzleRows(puzzle,work).digits.includes('-');
      use.onclick=()=>{const input=main.querySelector('#answer');input.value=letterEquation(puzzle,work);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};
    }
    draw();
  }
  function puzzleResponse(number,part,input,work){
    if(number!==25)return null;
    const puzzle=letterPuzzle(part);if(input!==letterEquation(puzzle,work))return null;
    const {digits,operand,target}=puzzleRows(puzzle,work);
    for(let i=0;i<digits.length;i++){
      const previous=digits.indexOf(digits[i]);if(previous<i)return {ok:false,text:'Буквы '+puzzle.letters[previous]+' и '+puzzle.letters[i]+' получили одну цифру '+digits[i]+'. Разным буквам нужны разные цифры.'};
    }
    if(operand[0]==='0'||target[0]==='0')return {ok:false,text:'Проверь старший разряд. Запись многозначного числа не может начинаться с нуля.'};
    const product=String(Number(operand)*puzzle.factor).padStart(target.length,'0'),places=['единиц','десятков','сотен','тысяч','десятков тысяч','сотен тысяч','миллионов'];
    for(let col=0;col<Math.max(product.length,target.length);col++){
      if((product.at(-col-1)||'0')!==(target.at(-col-1)||'0'))return {ok:false,text:'Начни справа. Первая несовпавшая цифра результата — в разряде '+places[col]+'. Проверь произведение и перенос из предыдущего разряда.'};
    }
    return {ok:true,text:'Подстановка даёт верное равенство, разным буквам соответствуют разные цифры. Объясни, как выбирал цифры и учитывал перенос. Запись остаётся для проверки.'};
  }

  const codedRows=[
    ['Р','0,4 + 3','3,4'],['У','6 + 0,12','0,18'],['Н','0,25 + 0,5','0,3'],['О','3,28 + 1,3','4,58'],['Е','2,6 − 0,01','2,59'],
    ['Д','9,1 − 1,05','8,05'],['Г','0,854 − 0,85','0,04'],['Б','0,5 · 3','0,15'],['И','4 · 1,7','6,8'],['Ж','17,2 · 10','1,72'],
    ['А','0,8 · 0,04','0,032'],['К','5 : 1000','0,05'],['Т','3,6 : 9','0,4'],['Я','12,3 : 5','24,6'],['С','0,056 : 0,7','0,08']
  ];
  const divisibilityRows=[
    ['М','4,5 − 2 : 5','4,1'],['О','8 − 4 · 1,4','2,4'],['Р','7 : 2 + 5','1'],['Е','5,6 : 0,7 + 1,2','9,2'],['С','14 · 0,01 : 0,2','0,7'],['Т','0,7 · 0,06 · 10','0,42'],
    ['Д','4,9 : 7 · 30','21'],['А','0,54 : 0,9 : 0,1','0,6'],['К','28 : (0,4 · 0,7)','10'],['И','(8 − 3,2) : 0,6','8'],['Л','0,81 : (2,7 : 30)','9'],['Ь','0,24 : (0,5 + 0,3)','0,3']
  ];
  function codewordQuestion(part){
    if(part.id==='038-termin')return 'Найди исходно верные равенства, расположи их результаты по убыванию и прочитай математический термин. Объясни своими словами его значение. Неверные равенства исправь отдельно.';
    if(part.id==='022-slovo')return 'Оставь буквы равенств, которые верны именно в записанном виде. Расположи их по возрастанию результатов и прочитай астрономический термин. Для остальных строк запиши исправленные вычисления.';
    const rows=part.id.startsWith('038-')?divisibilityRows:codedRows,row=rows.find(([letter])=>letter===part.label);
    return 'Для буквы '+row[0]+' предложено равенство '+row[1]+' = '+row[2]+'. Проверь его вычислением и введи правильное значение левой части. Для шифра оставь букву только при совпадении.';
  }
  function cipherView(work,interactive,number=22){
    const rows=number===38?divisibilityRows:codedRows;
    const buttons=rows.map(([letter,expression,claim])=>{
      const selected=(work.cipherLetters||'').includes(letter);
      return '<li style="margin:.2rem 0">'+(interactive?'<button style="width:100%;text-align:left;white-space:normal" type="button" class="secondary" data-cipher-letter="'+letter+'" aria-pressed="'+selected+'">'+(selected?'✓ ':'')+letter+' · '+expression+' = '+claim+'</button>':letter+' · '+expression+' = '+claim)+'</li>';
    }).join('');
    return '<section data-cipher-host aria-label="Буквы шифра"><h3>Лента букв</h3><p>Касайся строк в нужном порядке. Повторное нажатие убирает букву, следующее ставит её в конец.</p><p data-cipher-draft aria-live="polite">'+(work.cipherLetters||'Лента пока пуста')+'</p><ul style="list-style:none;padding-left:0">'+buttons+'</ul>'+(interactive&&number===38?'<label>Смысл полученного термина своими словами<textarea style="display:block;width:100%;box-sizing:border-box" maxlength="600" data-cipher-meaning>'+U.esc(work.cipherMeaning||'')+'</textarea></label>':'')+(interactive?'<button class="secondary" type="button" data-cipher-use>Перенести ленту в ответ</button>':'')+'</section>';
  }
  function mountCipher(main,work,save,number=22){
    let host=main.querySelector('[data-cipher-host]');if(!host)return;
    function draw(){
      host.outerHTML=cipherView(work,true,number);host=main.querySelector('[data-cipher-host]');
      for(const button of host.querySelectorAll('[data-cipher-letter]'))button.onclick=()=>{
        const letter=button.dataset.cipherLetter,current=work.cipherLetters||'';work.cipherLetters=current.includes(letter)?current.replace(letter,''):current+letter;
        save();draw();host.querySelector('[data-cipher-letter="'+letter+'"]').focus({preventScroll:true});
      };
      const meaning=host.querySelector('[data-cipher-meaning]');if(meaning)meaning.oninput=()=>{work.cipherMeaning=meaning.value.slice(0,600);save();};
      const use=host.querySelector('[data-cipher-use]');use.disabled=!work.cipherLetters;use.onclick=()=>{const input=main.querySelector('#answer');input.value=work.cipherLetters+(number===38&&work.cipherMeaning?' · '+work.cipherMeaning:'');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};
    }
    draw();
  }
  function honeySupport(){
    return '<figure style="margin:.5em 0"><figcaption>От ульев к одной банке</figcaption><ol><li>Первый улей — 24,8 кг.</li><li>Второй — первый сбор без 6,4 кг.</li><li>Третий — половина суммы первых двух сборов.</li><li>Общий сбор заполняет 18 одинаковых банок поровну.</li></ol></figure>';
  }
  function codewordResponse(number,part,input,correct){
    if(number===23&&!correct){
      const eq=n=>root.PetersonBook.M.equal(input,n);
      if(part.id==='023-a')return {ok:false,text:eq('52.52')?'Это значение слева от последнего минуса. Вычисли вторую часть выражения и вычти её.':eq('52.5')?'Это частное справа от последнего минуса. Вычти его из первой части.':'Проверь разность в знаменателе последнего частного. Сохрани сотые до последнего вычитания.'};
      return {ok:false,text:eq('117.53')?'Найдено произведение справа от знака минус. Какое число стоит перед ним?':eq('14.6')?'Это сумма внутри скобок. Остались умножение и вычитание.':'Сначала найди два частных внутри скобок, затем их сумму умножь на 8,05.'};
    }
    if(number===24&&!correct){
      const eq=n=>root.PetersonBook.M.equal(input,n);
      return {ok:false,text:eq('64.8')?'Получена масса всего мёда. Сколько одинаковых банок заполнили этой массой?':eq('21.6')?'Это мёд из третьего улья. Для наполнения банок использовали все три сбора.':eq('43.2')?'Учтены первые два улья. Вычисли половину этой суммы для третьего улья.':'Вычти 6,4 кг из первого сбора. Половину для третьего улья бери от суммы первого и второго.'};
    }
    if(number!==22&&number!==38)return null;
    const descending=number===38;
    if(part.expression){
      const rows=descending?divisibilityRows:codedRows,claim=rows.find(([letter])=>letter===part.label)[2],eq=root.PetersonBook.M.equal;
      if(correct)return {ok:true,text:eq(input,claim)?'Вычислено верно. Напечатанное равенство верно, его буква участвует в шифре.':'Вычислено верно. Напечатанный результат был ошибочным, эту букву пропусти при расшифровке.'};
      return {ok:false,text:eq(input,claim)?'Это результат из проверяемой строки. Вычисли левую часть самостоятельно. '+opHint[part.expression.op]:opHint[part.expression.op]};
    }
    const [letters,...reason]=descending?input.split(' · '):[input],entered=letters.toUpperCase().replace(/[\s.]+/g,'');if(!/^[А-ЯЁ]+$/.test(entered))return null;
    const key=descending?'ДЕЛИМОСТЬ':'АСТЕРОИД',wrong=[...entered].find(c=>!key.includes(c));
    if(wrong)return {ok:false,text:'Для буквы '+wrong+' не записано верное равенство. Проверь её исходную строку до исправления.'};
    if(new Set(entered).size<entered.length)return {ok:false,text:'Одна из букв встречается дважды. Каждая верная исходная строка даёт ровно одну букву.'};
    if([...entered].some((c,i)=>i&&key.indexOf(entered[i-1])>key.indexOf(c)))return {ok:false,text:'Подходящие буквы есть, но результаты должны '+(descending?'убывать':'возрастать')+'. Сопоставь соседним буквам числа и сравни их по разрядам.'};
    if(entered!==key)return {ok:false,text:'Выбранные буквы стоят по '+(descending?'убыванию':'возрастанию')+'. Проверь оставшиеся строки: среди них есть ещё верная.'};
    if(descending)return {ok:true,text:reason.join(' · ').trim()?'Математический термин расшифрован. Объяснение его смысла сохранено для проверки.':'Математический термин расшифрован. Объясни его смысл: какое условие на остаток должно выполняться при делении?'};
    return {ok:true,text:'Получился астрономический термин. Сохрани в черновике исправления ложных равенств для проверки учителем.'};
  }

  const propertyClaims=[
    ['a = 6n, где n — натуральное число, начиная с 1.','Все такие a чётные, составные и делятся на 2, 3 и 6.','Все такие a делятся на 12.','Любое такое a простое.','a = 2 · 3 · n и a ≥ 6.','Достаточно проверить только n = 2.','При n = 1 получается простое число.','Проверь n = 1 на лишний делитель, затем вынеси общие множители в общем виде.'],
    ['b = 4k + 2, где k — натуральное число, начиная с 1.','Все такие b чётные, составные и дают остаток 2 при делении на 4.','Все такие b кратны 4.','Все такие b — простые.','b = 2(2k + 1), а 2k + 1 ≥ 3.','b = 4(k + 2).','Достаточно проверить значение k = 2.','Раздели 4k + 2 на 4 с остатком. Для составности найди разложение на два множителя больше 1.']
  ];
  const translations=[
    ['Число a кратно семи.','a = 7q','7 = aq','a = q + 7','Множитель q может быть различным; число a делится на 7 без остатка.','a надо прибавить к 7.','a обязательно равно 7.','Семь выступает делителем. Произведением нужно представить a.'],
    ['Девять является делителем числа b.','b = 9q','9 = bq','b = 9 + q','Частное b : 9 — целое число q.','Частное 9 : b обязано быть целым.','Число b должно быть делителем девяти.','Проверь порядок слов: делитель — 9, делимое — b.'],
    ['Число c одновременно кратно двум и пяти.','c = 10q','c = 7q','c = 2q или c = 5q','2 и 5 взаимно просты, поэтому общее кратное делится на 10.','Нужно сложить 2 и 5.','Достаточно делимости хотя бы на одно из них.','Обе проверки должны выполняться одновременно. Наименьшее общее положительное кратное чисел 2 и 5 равно 10.'],
    ['Число d чётное.','d = 2q','d = 2q + 1','d = q + 2','При делении d на 2 остаток равен нулю.','При делении d на 2 остаток равен единице.','Чётным бывает только число 2.','Запись должна описывать любое чётное число, а не одно конкретное.'],
    ['Число k не является кратным трём.','k = 3q + 1 или k = 3q + 2','k = 3q + 1','k = 3q','При делении на 3 допустимы остатки 0, 1, 2; здесь исключён только ноль.','Есть только один ненулевой остаток.','У k нет остатка от деления на 3.','Нужны оба ненулевых остатка. Проверь, допускает ли формула числа 1 и 2.'],
    ['При делении числа m на семь остаток равен единице.','m = 7q + 1','m = 7(q + 1)','m = q + 7','Сначала берут полные группы по 7, затем прибавляют остаток 1.','Остаток прибавляют к частному перед умножением.','Остаток всегда равен частному.','Запись делимого: делитель × частное + остаток.']
  ];
  function factorCard(number,part){
    const i=Number(part.id.split('-')[1])-1,data=number===39?propertyClaims[i]:translations[i];
    return {prompt:number===39?'По общей формуле установи свойства числа и докажи их для всех допустимых значений. '+data[0]:'Переведи в формулу: «'+data[0]+'» Объясни обозначения и допустимые значения параметра. Для целых чисел q — целое, для натуральных выбирай те q, при которых результат натуральный.',
      leftTitle:number===39?'Какие свойства следуют всегда?':'Математическая запись',left:data.slice(1,4),li:0,rightTitle:'Обоснование',right:data.slice(4,7),ri:0,hint:data[7],reference:data[7],extra:'Мои обозначения и объяснение'};
  }
  function formulaLab(number,part,work,interactive){
    const i=Number(part.id.split('-')[1])-1,orig=number===39,offset=orig?1:i>=4?0:-3,variable=orig?(i?'k':'n'):'q',chosen=work.formulaInput;
    const theOptions=Array.from({length:14},(_,j)=>j+offset);
    const select='<label>Значение '+variable+' <select data-factor-parameter><option value="">Выбери</option>'+theOptions.map(n=>'<option value="'+n+'"'+(chosen===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label>';
    const remain=number===40&&i===4,r=work.formulaRemainder??1,other=remain?'<label>Остаток при делении на 3 <select data-factor-remainder>'+[0,1,2].map(n=>'<option value="'+n+'"'+(r===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label>':'';
    const coefficients=orig?[6,4]:[7,9,10,2,3,7],constant=orig?(i?2:0):remain?r:i===5?1:0;
    let output='Выбери значение параметра и сопоставь результат со свойством.';
    if(Number.isInteger(chosen)){
      const mult=coefficients[i],value=mult*chosen+constant;output=mult+' · ('+chosen+')'+(constant?' + '+constant:'')+' = '+value+'. ';
      if(orig)output+=i?'Частное при делении на 4: '+chosen+', остаток 2.':'Деление на 2 даёт '+value/2+', на 3 — '+value/3+'.';
      else if(remain)output+=r?'Это число не кратно 3.':'Нулевой остаток не подходит к исходной фразе.';
      else output+='При делении на '+mult+' частное '+chosen+', остаток '+constant+'.';
    }
    return '<section data-factor-host><h3>Подставь значение</h3>'+(interactive?select+other:'')+'<p data-factor-output aria-live="polite">'+U.esc(output)+'</p><p>Подстановка проверяет один случай. Общее доказательство запиши через параметр.</p></section>';
  }
  function mountFormulaLab(main,number,part,work,save){
    let host=main.querySelector('[data-factor-host]');if(!host)return;
    function draw(){host.outerHTML=formulaLab(number,part,work,true);host=main.querySelector('[data-factor-host]');
      for(const [sel,key] of [['[data-factor-parameter]','formulaInput'],['[data-factor-remainder]','formulaRemainder']]){const f=host.querySelector(sel);if(f)f.onchange=()=>{if(f.value!=='')work[key]=Number(f.value);else delete work[key];save();draw();host.querySelector(sel).focus({preventScroll:true});};}
    }draw();
  }
  function factorBasket(work,interactive){
    const flags=work.factorMask||0,product=[2,3,7].reduce((acc,v,i)=>flags&(1<<i)?acc*v:acc,1),values=work.divisorBasket||[];
    const options=[2,3,7].map((d,i)=>'<button type="button" data-factor-bit="'+i+'" class="secondary" aria-pressed="'+Boolean(flags&(1<<i))+'">'+(flags&(1<<i)?'✓ ':'')+d+'</button>').join(' ');
    return '<section data-basket-host><h3>Собери делитель из множителей</h3><p>Каждый из простых множителей 2, 3, 7 можно взять один раз или пропустить. Если пропустить все, произведение равно 1.</p>'+(interactive?'<label>Моё значение a <input data-basket-value inputmode="numeric" maxlength="50" style="display:block;box-sizing:border-box;max-width:100%;width:100%" value="'+U.esc(work.factorValue||'')+'"></label>'+options:'')+'<p data-basket-product>Текущее произведение: '+product+'</p>'+(interactive?'<button data-basket-add type="button" class="secondary">Внести делитель</button>':'')+'<p data-basket-items aria-live="polite">Моё множество: {'+values.join('; ')+'}</p>'+(interactive?'<button data-basket-remove type="button" class="secondary">Убрать текущий делитель</button><button data-basket-use type="button" class="secondary">Перенести множество</button>':'')+'</section>';
  }
  function mountBasket(main,work,save){
    let host=main.querySelector('[data-basket-host]');if(!host)return;
    function draw(){host.outerHTML=factorBasket(work,true);host=main.querySelector('[data-basket-host]');const mask=work.factorMask||0;
      for(const button of host.querySelectorAll('[data-factor-bit]'))button.onclick=()=>{const v=Number(button.dataset.factorBit);work.factorMask=mask^(1<<v);save();draw();host.querySelector('[data-factor-bit="'+v+'"]').focus({preventScroll:true});};
      const product=[2,3,7].reduce((acc,d,i)=>mask&(1<<i)?acc*d:acc,1),vals=new Set(work.divisorBasket||[]);
      for(const [selector,add] of [['[data-basket-add]',true],['[data-basket-remove]',false]]){const b=host.querySelector(selector);b.disabled=add?vals.has(product):!vals.has(product);b.onclick=()=>{if(add)vals.add(product);else vals.delete(product);work.divisorBasket=[...vals].sort((a,b)=>a-b);save();draw();};}
      const use=host.querySelector('[data-basket-use]'),value=host.querySelector('[data-basket-value]'),enable=()=>{use.disabled=!vals.size||!work.factorValue?.trim();};enable();value.oninput=()=>{work.factorValue=value.value.slice(0,50);enable();save();};use.onclick=()=>{const field=main.querySelector('#answer');field.value='a = '+work.factorValue+'; D(a) = {'+work.divisorBasket.join('; ')+'}';field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();};
    }draw();
  }
  function basketResponse(number,input){
    if(number!==41)return null;let t=input.trim().replace(/\.$/,'');const pair=t.match(/^a\s*=\s*([^;]+);\s*D\(a\)\s*=\s*(.+)$/i);if(pair){if(!root.PetersonBook.M.equal(pair[1],42))return {ok:false,text:'Сначала найди значение a. Умножь 2 на 3 и полученный результат на 7.'};t=pair[2];}if(!/^\{\s*\d+(?:\s*;\s*\d+)*\s*\}$/.test(t))return null;const nums=t.slice(1,-1).split(';').map(Number),extra=nums.find(n=>!n||42%n!==0);
    if(extra!==undefined)return {ok:false,text:'Число '+extra+' не делит 42 без остатка. Проверь, из каких множителей оно собрано.'};
    if(new Set(nums).size!==nums.length)return {ok:false,text:'Один делитель записан несколько раз. При перестановке множителей новый делитель не появляется.'};
    if(nums.length!==8)return {ok:false,text:!nums.includes(1)?'Не забудь пустой выбор множителей. Его произведение равно 1.':!nums.includes(42)?'Возьми все три множителя одновременно и проверь получившийся делитель.':'Сверь одиночные множители и все пары. На каждый из трёх множителей приходится два выбора.'};
    return {ok:true,text:'Собраны все восемь различных делителей. Объясни, почему других нет. Работа сохранена для проверки.'};
  }

  function cutoutQuestion(part){
    if(part.id==='037-1')return 'Обозначь длины соседних сторон прямоугольника a и b, периметр обозначь P, площадь S. Запиши обе формулы и объясни смысл каждого действия.';
    if(part.id==='037-2')return 'Сам обозначь сторону квадрата буквой. Запиши формулы периметра и площади через эту сторону и объясни, какие величины получены.';
    return 'Из квадрата со стороной 10,6 см удалили прямоугольники в правом верхнем и левом нижнем углах, как на нашей схеме. AB = 7,5 см, DE = KF = 5,8 см, EF = 8,6 см. Найди периметр и площадь оставшейся фигуры. Площадь укажи точно, а затем округли до десятых.';
  }
  function cutoutDrawing(part,work){
    const mode=work.geometryView||'outline',square=part.id==='037-2',name=work.squareSide||'a';
    const title=mode==='outline'?'Граница фигуры':mode==='cuts'?'Удалённые прямоугольники':'Части площади',stroke=mode==='outline'?'#973c20':'#345b4e',background=mode==='area'?'#c7dfca':'#e8eee8';
    const txt=(x,y,label)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="12" fill="#24392d">'+U.esc(label)+'</text>';
    let shapes;
    if(part.id!=='037-3'){
      const x=square?61:37,y=square?27:51,w=square?164:214,h=square?164:115;
      shapes='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+background+'" stroke="'+stroke+'" stroke-width="'+(mode==='outline'?4:2)+'"/>'+txt(x+w/2,y-8,square?name:'a')+txt(x+w+14,y+h/2,square?name:'b');
      if(mode==='area')shapes+=txt(x+w/2,y+h/2,'площадь внутри');
    }else{
      // Positions reflect the issued dimensions, in centimetres scaled uniformly by 18.
      const x=v=>37+18*v,y=v=>22+18*v,A=[0,0],B=[7.5,0],C=[7.5,4.8],D=[10.6,4.8],E=[10.6,10.6],F=[2,10.6],K=[2,4.8],M=[0,4.8];
      const polygon=[A,B,C,D,E,F,K,M].map(([a,b])=>x(a)+','+y(b)).join(' '),w=18*10.6,h=18*4.8,bottom=18*5.8;
      shapes='<rect x="'+x(0)+'" y="'+y(0)+'" width="'+w+'" height="'+w+'" fill="none" stroke="#647a70" stroke-dasharray="5 4"/>';
      if(mode==='cuts')shapes+='<rect x="'+x(7.5)+'" y="'+y(0)+'" width="'+18*3.1+'" height="'+h+'" fill="#ffe4bf"/><rect x="'+x(0)+'" y="'+y(4.8)+'" width="'+18*2+'" height="'+bottom+'" fill="#ffe4bf"/>';
      shapes+='<polygon points="'+polygon+'" fill="'+background+'" stroke="'+stroke+'" stroke-width="'+(mode==='outline'?3.4:2)+'"/>';
      if(mode==='area')shapes+='<path d="M'+x(2)+' '+y(4.8)+' H'+x(7.5)+'" stroke="#4e6754" stroke-width="2" stroke-dasharray="5 3"/>'+txt(x(3.9),y(2.8),'верхняя часть')+txt(x(6.4),y(8.2),'нижняя часть');
      for(const [point,label,dx,dy] of [[A,'A',-10,-4],[B,'B',5,-6],[C,'C',-8,-5],[D,'D',11,1],[E,'E',9,6],[F,'F',-7,13],[K,'K',8,15],[M,'M',-12,4]])shapes+=txt(x(point[0])+dx,y(point[1])+dy,label);
    }
    return '<svg viewBox="0 0 275 236" style="width:100%;max-width:365px;display:block" role="img" aria-label="'+U.esc(title+(part.id==='037-3'?'. В квадрате удалены противоположные углы; оставшийся контур A, B, C, D, E, F, K, M.':square?'. Квадрат со стороной '+name+'.':'. Прямоугольник со сторонами a и b.'))+'">'+shapes+'</svg>';
  }
  function formulaChoices(part,work){
    const a=part.id==='037-2'?work.squareSide||'a':'a',square=part.id==='037-2';
    return square?[[a+' + '+a, '4 · '+a, a+'²'],['4 · '+a,a+'²',a+' + '+a]]:[['a + b','2(a + b)','a · b'],['2(a + b)','a · b','a + b']];
  }
  function geometryFigure(part,work,interactive){
    const cut=part.id==='037-3',square=part.id==='037-2',mode=work.geometryView||'outline';
    const dropdown=(key,options,v)=>'<select data-geo-'+key+'><option value="">Выбери</option>'+options.map((text,i)=>'<option value="'+(i+1)+'"'+(v===i+1?' selected':'')+'>'+U.esc(text)+'</option>').join('')+'</select>';
    const numbers=['Периметр P, см','Точная площадь S, см²','Площадь до десятых, см²'],variants=formulaChoices(part,work);
    const fields=cut?numbers.map((s,i)=>'<label>'+s+' <input style="display:block;box-sizing:border-box;width:100%;max-width:100%" data-geo-number="'+i+'" inputmode="decimal" maxlength="50" value="'+U.esc(work.geometryNumbers?.[i]||'')+'"></label>').join(''):
      (square?'<label>Буква моей стороны <select data-geo-side>'+['a','b','x','m'].map(c=>'<option value="'+c+'"'+((work.squareSide||'a')===c?' selected':'')+'>'+c+'</option>').join('')+'</select></label>':'')+'<label>Моя формула P '+dropdown('p',variants[0],work.perimeterChoice)+'</label><label>Моя формула S '+dropdown('s',variants[1],work.areaChoice)+'</label>';
    const modes=[['outline','Обойти границу'],['area',cut?'Разбить оставшуюся площадь':'Рассмотреть площадь']];if(cut)modes.push(['cuts','Выделить вырезанные углы']);
    return '<figure data-geometry-host style="margin:.5em 0"><figcaption>Периметр и площадь</figcaption>'+cutoutDrawing(part,work)+(interactive?'<label>На рисунке <select style="display:block;max-width:100%;width:100%" data-geo-mode>'+modes.map(([v,label])=>'<option value="'+v+'"'+(mode===v?' selected':'')+'>'+label+'</option>').join('')+'</select></label><div style="display:grid;grid-template-columns:minmax(0,1fr);gap:.35em">'+fields+'</div><button class="secondary" type="button" data-geo-use>Перенести мои результаты в ответ</button>':'')+'</figure>';
  }
  function geometryText(part,work){
    if(part.id==='037-3'){const v=work.geometryNumbers||[];return 'P = '+v[0]+' см. S = '+v[1]+' см², до десятых '+v[2]+' см².';}
    const choices=formulaChoices(part,work);return 'P = '+choices[0][work.perimeterChoice-1]+'; S = '+choices[1][work.areaChoice-1]+'.';
  }
  function mountGeometry(main,part,work,save){
    let host=main.querySelector('[data-geometry-host]');if(!host)return;
    function draw(){host.outerHTML=geometryFigure(part,work,true);host=main.querySelector('[data-geometry-host]');const use=host.querySelector('[data-geo-use]');
      const enable=()=>{use.disabled=part.id==='037-3'?[0,1,2].some(i=>!work.geometryNumbers?.[i]?.trim()):!work.perimeterChoice||!work.areaChoice;};enable();
      for(const [selector,key] of [['[data-geo-mode]','geometryView'],['[data-geo-side]','squareSide'],['[data-geo-p]','perimeterChoice'],['[data-geo-s]','areaChoice']]){const field=host.querySelector(selector);if(field)field.onchange=()=>{if(field.value)work[key]=key.endsWith('Choice')?Number(field.value):field.value;else delete work[key];save();draw();host.querySelector(selector).focus({preventScroll:true});};}
      for(const field of host.querySelectorAll('[data-geo-number]'))field.oninput=()=>{const values=Array.from({length:3},(_,i)=>work.geometryNumbers?.[i]||'');values[Number(field.dataset.geoNumber)]=field.value.slice(0,50);work.geometryNumbers=values;enable();save();};
      use.onclick=()=>{const el=main.querySelector('#answer');el.value=geometryText(part,work);el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();};
    }draw();
  }
  function geometryResponse(number,part,input,work){
    if(number!==37||input!==geometryText(part,work))return null;
    if(part.id!=='037-3'){
      if(work.perimeterChoice!==2)return {ok:false,text:'Периметр — путь по всей границе. Посчитай все четыре стороны, не пропуская противоположные.'};
      if(work.areaChoice!==2)return {ok:false,text:'Площадь измеряет внутреннюю часть в квадратных единицах. Умножь длину на ширину.'};
      return {ok:true,text:'Обе формулы подходят. Объясни, почему в первой считаются длины, а во второй — квадратные единицы. Формулы и объяснение ждут проверки.'};
    }
    const M=root.PetersonBook.M,[p,area,rounded]=work.geometryNumbers;
    if(!M.equal(p,'42.4'))return {ok:false,text:'Обойди границу. В каждом вырезанном углу два внешних отрезка заменились двумя внутренними тех же длин.'};
    if(!M.equal(area,'85.88'))return {ok:false,text:M.equal(area,'112.36')?'Это площадь полного квадрата. Вычти площади обоих удалённых прямоугольников.':'Верхняя правая выемка имеет высоту 10,6 − 5,8 и ширину 10,6 − 7,5. Для нижней левой выемки найди отдельные размеры.'};
    if(!M.equal(rounded,'85.9'))return {ok:false,text:'Точная площадь подходит. Для округления до десятых проверь цифру сотых, сохрани одну цифру после запятой.'};
    return {ok:true,text:'Периметр, точная и округлённая площадь согласуются. Запиши, как нашёл размеры вырезанных частей; решение ждёт проверки.'};
  }

  const periodTasks={'035-a':'1/3','035-b':'2/11','035-v':'23/90','035-g':'32/33'};
  function periodicRule(number){
    if(number===35)return {prompt:'Всегда ли обыкновенная дробь имеет конечную десятичную запись? Подбери доказательство или контрпример и запиши своё объяснение.',
      leftTitle:'Верно ли «всегда»?',left:['Да','Нет'],li:1,rightTitle:'Чем обосновать?',right:['При делении единицы на 3 ненулевой остаток повторяется.','1/4 = 0,25.','Любой знаменатель уже является степенью десяти.'],ri:0,
      hint:'Одна конечная запись ещё не доказывает, что конечны все. Посмотри на повторяющийся ненулевой остаток при делении.',reference:'После сокращения дроби конечная десятичная запись существует, когда положительный знаменатель не имеет простых делителей кроме 2 и 5. Знаменатель 1 тоже подходит.',extra:'Мой пример и вывод'};
    return {prompt:'У двух конечных десятичных дробей выполнили сложение, вычитание, умножение и деление. Объясни, для каких действий результат всегда имеет конечную запись. Делитель должен быть ненулевым.',
      leftTitle:'Всегда конечный результат',left:['Сумма, разность и произведение','Только сумма и произведение','Все четыре результата'],li:0,rightTitle:'Проверка оставшегося действия',right:['0,1 : 0,3 = 1/3, и десятичная запись продолжается.','0,2 : 0,1 = 2, поэтому любое частное конечно.','Для проверки можно разделить 0,1 на ноль.'],ri:0,
      hint:'Приведи числа к знаменателям — степеням десяти. При делении в знаменателе может остаться иной простой множитель.',reference:'При сложении и вычитании можно выбрать общую степень десяти, при умножении степени десяти перемножаются. Частное требует отдельной проверки.',extra:'Мой пример и вывод'};
  }
  function divisionSource(part){
    return part.expression?root.PetersonBook.exact(part.expression):root.PetersonBook.M.parse(periodTasks[part.id]);
  }
  function divisionLines(part){
    const {n,d}=divisionSource(part),whole=Math.floor(n/d),rows=[],seen=new Map();let rem=n%d,repeat=null;
    for(let i=0;i<8;i++){
      if(seen.has(rem)&&repeat===null)repeat=[seen.get(rem),i];else if(!seen.has(rem))seen.set(rem,i);
      const expanded=rem*10,digit=Math.floor(expanded/d),remainder=expanded%d;rows.push({before:rem,expanded,digit,remainder});rem=remainder;
    }
    return {whole,d,rows,repeat};
  }
  function divisionView(part,work,interactive){
    const {whole,d,rows,repeat}=divisionLines(part),step=work.periodStep||0,row=rows[step],digits=rows.slice(0,step).map(x=>x.digit).join('');
    const header='<thead><tr><th scope="col">Шаг</th><th scope="col">Делим</th><th scope="col">Цифра</th><th scope="col">Остаток</th></tr></thead>';
    const done=rows.slice(0,step).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+r.expanded+' : '+d+'</td><td>'+r.digit+'</td><td>'+r.remainder+'</td></tr>').join('');
    const input=(key,label,value)=>'<label>'+label+' <input style="display:block;width:100%;max-width:100%;box-sizing:border-box" data-period-'+key+' maxlength="60" value="'+U.esc(value||'')+'"></label>';
    const entry=interactive&&row?'<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:.3em"><p>Сносим ноль. Делим '+row.expanded+' на '+d+'.</p>'+input('digit','Цифра частного',work.periodDigit)+input('rem','Новый остаток',work.periodRem)+'<button type="button" class="secondary" data-period-check>Проверить строку деления</button></div>':'';
    const loop=repeat&&step>=repeat[1]?' Остаток уже встречался. Начало периода — позиция '+(repeat[0]+1)+' после запятой. Цифр в периоде: '+(repeat[1]-repeat[0])+'.':'';
    const finish=interactive&&part.id.startsWith('035-')?'<p>Запиши период скобками, например 0,1(6). Затем запиши округление до тысячных.</p>'+input('notation','Моя периодическая запись',work.periodNotation)+input('approx','Моё приближение',work.periodApprox)+'<button type="button" class="secondary" data-period-use>Перенести обе записи в ответ</button>':'';
    return '<section data-period-host><h3>Деление по остаткам</h3><p>Целая часть: '+whole+'. Начальный остаток: '+rows[0].before+'. Делитель: '+d+'.</p><table style="width:100%;table-layout:fixed">'+header+'<tbody>'+done+'</tbody></table><p data-period-tape aria-live="polite">'+whole+','+(digits||'…')+loop+'</p>'+entry+'<p data-period-feedback role="status">'+(work.periodError?U.esc(periodRowReport(part,work).text):'')+'</p>'+finish+'</section>';
  }
  function periodRowReport(part,work){
    const {rows,d}=divisionLines(part),row=rows[work.periodStep||0],x=work.periodDigit??'',r=work.periodRem??'';
    if(!row)return {ok:true,text:'Восемь цифр найдены.'};
    if(!/^\d$/.test(x)||!/^\d+$/.test(r))return {ok:false,text:'Запиши одну цифру частного и целый неотрицательный остаток.'};
    if(Number(r)>=d)return {ok:false,text:'Остаток должен быть меньше делителя '+d+'. Проверь, помещается ли ещё одна группа.'};
    if(Number(x)!==row.digit)return {ok:false,text:'Найди наибольшую цифру, произведение которой на '+d+' не превосходит '+row.expanded+'.'};
    if(Number(r)!==row.remainder)return {ok:false,text:'Цифра верна. Вычти из '+row.expanded+' произведение '+row.digit+' · '+d+' и запиши разность.'};
    return {ok:true,text:'Цифра и остаток верны.'};
  }
  function mountPeriod(main,part,work,save){
    let host=main.querySelector('[data-period-host]');if(!host)return;
    function draw(){host.outerHTML=divisionView(part,work,true);host=main.querySelector('[data-period-host]');
      const use=host.querySelector('[data-period-use]');const enabled=()=>{if(use)use.disabled=!work.periodNotation?.trim()||!work.periodApprox?.trim();};enabled();
      for(const [key,name] of [['digit','periodDigit'],['rem','periodRem'],['notation','periodNotation'],['approx','periodApprox']]){const field=host.querySelector('[data-period-'+key+']');if(field)field.oninput=()=>{work[name]=field.value.slice(0,60);if(key==='digit'||key==='rem'){delete work.periodError;host.querySelector('[data-period-feedback]').textContent='';}enabled();save();};}
      const check=host.querySelector('[data-period-check]');if(check)check.onclick=()=>{const valid=periodRowReport(part,work);if(valid.ok){work.periodStep=(work.periodStep||0)+1;delete work.periodDigit;delete work.periodRem;delete work.periodError;}else{if(!work.periodError&&work.periodDigit&&work.periodRem)work.errors=Math.min(10000,(work.errors||0)+1);work.periodError=true;}save();draw();host.querySelector('[data-period-digit]')?.focus({preventScroll:true});};
      if(use)use.onclick=()=>{const el=main.querySelector('#answer');el.value='Периодическая запись: '+work.periodNotation+'. До тысячных: '+work.periodApprox+'.';el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();};
    }draw();
  }
  function samePeriod(input,target){
    const m=input.trim().match(/^(\d{1,5})[.,](\d{0,16})\((\d{1,16})\)$/);if(!m)return null;
    const power=10n**BigInt(m[2].length),repeat=10n**BigInt(m[3].length)-1n,den=power*repeat,num=(BigInt(m[1])*power+BigInt(m[2]||'0'))*repeat+BigInt(m[3]);
    return num*BigInt(target.d)===BigInt(target.n)*den;
  }
  function periodResponse(number,part,input,correct,work){
    if(number===35&&!part.id.endsWith('pravilo')&&work.periodNotation&&input==='Периодическая запись: '+work.periodNotation+'. До тысячных: '+work.periodApprox+'.'){
      const E=root.PetersonBook,r=divisionSource(part),same=samePeriod(work.periodNotation,r);
      if(same===null)return {ok:false,text:'Отдели целую часть запятой и заключи повторяющиеся цифры в скобки. Укажи все непериодические цифры перед скобками.'};
      if(!same)return {ok:false,text:'Проверь, какой остаток повторился и с какого шага. В скобки должны попасть цифры именно повторяющегося фрагмента.'};
      if(!E.M.equal(work.periodApprox,E.rounded(r,3)))return {ok:false,text:'Период указан верно. Для округления до тысячных оставь три знака после запятой и проверь четвёртый.'};
      return {ok:true,text:'Периодическая запись и округление верны. Сохрани объяснение, как обнаружил повтор остатка, для проверки.'};
    }
    if(number===36&&part.expression&&!correct)return {ok:false,text:'Найди хотя бы пять цифр после запятой. В ответе сохраняются четыре, а пятая решает, надо ли увеличить четвёртую.'};
    return null;
  }

  const roundingNames={'-1':'десятков',0:'единиц',1:'десятых',2:'сотых'};
  function resultQuestion(part){
    return 'Выполни указанное действие точно и только затем округли полученное значение до '+roundingNames[part.rounding.places]+'. В основной ответ введи округлённое число.';
  }
  function roundingDigit(part,input){
    const E=root.PetersonBook,M=E.M,v=M.parse(input);if(!v)return null;
    const places=part.rounding.places,index=places+1,multiplier=10**Math.abs(index),r=M.operation(index>=0?'multiply':'divide',v,multiplier);
    return Number((BigInt(Math.abs(r.n))/BigInt(r.d))%10n);
  }
  function calculationView(part,work,interactive){
    const places=part.rounding.places,discard=({[-1]:'единиц',0:'десятых',1:'сотых',2:'тысячных'})[places];
    const model=interactive?'<label>Мой результат до округления <input style="display:block;box-sizing:border-box;max-width:100%;width:100%" data-calc-exact maxlength="80" inputmode="decimal" value="'+U.esc(work.calcExact||'')+'"></label><label>Первая отбрасываемая цифра <select data-calc-digit><option value="">Выбери цифру</option>'+Array.from({length:10},(_,i)=>'<option value="'+i+'"'+(work.calcDigit===String(i)?' selected':'')+'>'+i+'</option>').join('')+'</select></label><button type="button" class="secondary" data-calc-check>Проверить промежуточную запись</button><p data-calc-feedback role="status">'+(work.calcChecked?U.esc(calcCheck(part,work).text):'')+'</p>':'';
    return '<section data-calc-host><h3>Какой разряд решает?</h3><p>Сохраняем разряд '+roundingNames[places]+'. Смотрим на следующую цифру разряда '+discard+'. Сначала найди точный результат, затем исследуй его запись.</p>'+model+'</section>';
  }
  function calcCheck(part,work){
    const E=root.PetersonBook,M=E.M,raw=M.parse(work.calcExact||'');if(!raw)return {ok:false,text:'Запиши число, которое получилось до округления.'};
    if(!M.equal(raw,E.exact(part.expression)))return {ok:false,text:M.equal(raw,E.finalAnswer(part))?'В поле промежуточного действия записан уже округлённый ответ. Вернись к исходным операндам.':'Сначала проверь само действие. '+opHint[part.expression.op]};
    if(work.calcDigit===undefined)return {ok:false,text:'Точное значение верно. Выбери первую отбрасываемую цифру.'};
    if(Number(work.calcDigit)!==roundingDigit(part,raw))return {ok:false,text:'Само вычисление верно. Начни у цифры сохраняемого разряда и передвинься ровно на один разряд вправо.'};
    return {ok:true,text:'Точное значение и решающая цифра верны. Примени правило округления и запиши число в основной ответ.'};
  }
  function mountCalc(main,part,work,save){
    let host=main.querySelector('[data-calc-host]');if(!host)return;host.outerHTML=calculationView(part,work,true);host=main.querySelector('[data-calc-host]');
    const field=host.querySelector('[data-calc-exact]'),digit=host.querySelector('[data-calc-digit]'),result=host.querySelector('[data-calc-feedback]');
    function reset(){delete work.calcChecked;result.textContent='';save();}
    field.oninput=()=>{work.calcExact=field.value.slice(0,80);reset();};digit.onchange=()=>{if(digit.value==='')delete work.calcDigit;else work.calcDigit=digit.value;reset();};
    host.querySelector('[data-calc-check]').onclick=()=>{const checked=calcCheck(part,work);if(!checked.ok&&!work.calcChecked&&root.PetersonBook.M.parse(work.calcExact||'')&&work.calcDigit!==undefined)work.errors=Math.min(10000,(work.errors||0)+1);work.calcChecked=true;result.textContent=checked.text;save();};
  }
  function calcResponse(number,part,input,correct){
    if(number!==34||correct)return null;
    const E=root.PetersonBook,M=E.M,raw=E.exact(part.expression);
    if(M.equal(input,raw))return {ok:false,text:'Действие выполнено точно. В окончательном ответе округли это число до '+roundingNames[part.rounding.places]+'.'};
    if(M.equal(input,E.rounded(raw,part.rounding.places+1)))return {ok:false,text:'Посмотри на разряд ответа: сохранена лишняя цифра. Требуемая точность — до '+roundingNames[part.rounding.places]+'.'};
    return {ok:false,text:'Раздели работу на два этапа: сначала проверь точное действие, потом выбери первую отбрасываемую цифру.'};
  }

  const precisionUnits=[
    ['сотен','100'],['десятков','10'],['единиц','1'],['десятых','0.1'],['сотых','0.01'],['тысячных','0.001']
  ];
  function roundingBounds(part){
    const i=Number(part.id.split('-')[2])-1,[name,unit]=precisionUnits[i],M=root.PetersonBook.M,target='149.5027',r=M.operation('divide',target,unit),q=Math.floor(r.n/r.d);
    return {name,unit,lower:M.operation('multiply',q,unit),upper:M.operation('multiply',q+1,unit),target};
  }
  function roundingQuestion(part){
    const info=roundingBounds(part);
    return part.id.startsWith('033-1-')?'Число a = 149,5027. Укажи приближённые значения с недостатком и с избытком с точностью до '+info.name+'. Запиши двойное неравенство, поставив a между ближайшими соседними значениями.':'В строке с точностью до '+info.name+' выбери ту из границ, до которой округляется a = 149,5027. Запиши число.';
  }
  function roundingFigure(part,work,interactive){
    const s=roundingBounds(part),M=root.PetersonBook.M,position=M.operation('divide',M.operation('subtract',s.target,s.lower),s.unit);
    const x=27+214*position.n/position.d,mark=work.precisionMark||'',labels=['Левая граница','Правая граница'];
    const input=part.id.startsWith('033-1-')?'<div style="display:grid;gap:.3em"><label>Левая граница <input data-round-low style="display:block;box-sizing:border-box;max-width:100%;width:100%" inputmode="decimal" maxlength="50" value="'+U.esc(work.precisionLow||'')+'"></label><label>Правая граница <input data-round-high style="display:block;box-sizing:border-box;max-width:100%;width:100%" inputmode="decimal" maxlength="50" value="'+U.esc(work.precisionHigh||'')+'"></label></div>':'<label>К какой границе ближе a? <select data-round-mark><option value="">Выбери</option>'+labels.map((v,i)=>'<option value="'+(i?'right':'left')+'"'+(mark===(i?'right':'left')?' selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Моё значение выбранной границы <input data-round-single inputmode="decimal" maxlength="50" style="display:block;box-sizing:border-box;max-width:100%;width:100%" value="'+U.esc(work.precisionRounded||'')+'"></label>';
    return '<figure data-round-host style="margin:.5em 0"><figcaption>Шкала с шагом '+M.decimal(s.unit)+'</figcaption><svg viewBox="0 0 268 85" role="img" aria-label="Один шаг нужного разряда. Центральная штриховая отметка обозначает половину шага, точка a показывает положение внутри." style="width:100%;max-width:440px;display:block"><path d="M27 44 H241 M27 34 V54 M241 34 V54" fill="none" stroke="#285b47" stroke-width="2"/><path d="M134 32 V56" fill="none" stroke="#65766b" stroke-dasharray="3 2"/><circle cx="'+x+'" cy="44" r="4" fill="#943e16"/><text x="'+x+'" y="27" text-anchor="middle">a</text><text x="27" y="74" text-anchor="middle" font-size="12">левая</text><text x="241" y="74" text-anchor="middle" font-size="12">правая</text></svg><p>Расстояние между соседними отметками — '+M.decimal(s.unit)+'. Сначала установи, какие значения соответствуют отметкам; затем сравни расстояния от a.</p>'+(interactive?input+'<button type="button" class="secondary" data-round-use>Перенести в ответ</button>':'')+'</figure>';
  }
  function mountRounding(main,part,work,save){
    const old=main.querySelector('[data-round-host]');if(!old)return;old.outerHTML=roundingFigure(part,work,true);
    const host=main.querySelector('[data-round-host]'),use=host.querySelector('[data-round-use]'),mark=host.querySelector('[data-round-mark]');
    const enabled=()=>{use.disabled=mark?(!work.precisionMark||!work.precisionRounded?.trim()):!work.precisionLow?.trim()||!work.precisionHigh?.trim();};
    if(mark){mark.onchange=()=>{work.precisionMark=mark.value;enabled();save();};const value=host.querySelector('[data-round-single]');value.oninput=()=>{work.precisionRounded=value.value.slice(0,50);enabled();save();};}
    else for(const [selector,key] of [['[data-round-low]','precisionLow'],['[data-round-high]','precisionHigh']]){const f=host.querySelector(selector);f.oninput=()=>{work[key]=f.value.slice(0,50);enabled();save();};}
    enabled();use.onclick=()=>{const field=main.querySelector('#answer');field.value=mark?work.precisionRounded:work.precisionLow+' < a < '+work.precisionHigh;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();};
  }
  function roundingResponse(number,part,input,correct){
    if(number!==33)return null;
    const s=roundingBounds(part),M=root.PetersonBook.M;
    if(part.id.startsWith('033-2-')){
      if(correct)return null;
      if(M.equal(input,s.lower)||M.equal(input,s.upper))return {ok:false,text:'Это соседняя отметка. Посмотри, по какую сторону середины лежит a, или проверь цифру следующего разряда.'};
      return {ok:false,text:'При округлении до '+s.name+' результат должен совпадать с одной из двух соседних отметок шага '+M.decimal(s.unit)+'.'};
    }
    const pair=input.match(/^\s*([+-]?[\d.,]+)\s*<\s*[aа]\s*<\s*([+-]?[\d.,]+)\s*\.?\s*$/i);if(!pair)return null;
    const lo=M.parse(pair[1]),hi=M.parse(pair[2]);if(!lo||!hi)return null;
    if(M.operation('subtract',s.target,lo).n<=0||M.operation('subtract',hi,s.target).n<=0)return {ok:false,text:'Число a должно быть строго между левой и правой границами. Проверь направление обоих сравнений.'};
    if(!M.equal(M.operation('subtract',hi,lo),s.unit))return {ok:false,text:'Число a между отметками, но расстояние между ними должно равняться '+M.decimal(s.unit)+'. Найди соседние отметки нужного разряда.'};
    if(!M.equal(lo,s.lower)||!M.equal(hi,s.upper))return {ok:false,text:'Длина шага выбрана правильно. Начни шкалу с нуля: обе границы должны быть кратны шагу '+M.decimal(s.unit)+'.'};
    return {ok:true,text:'Обе ближайшие границы найдены: первая даёт приближение с недостатком, вторая — с избытком. Запись сохранена для проверки.'};
  }

  const integerIntervals={
    '031-a':[15,18,true,false],'031-b':[3.2,7.6,false,true],'031-v':[1.7,2,true,true],'031-g':[5,5.6,false,false]
  };
  const decimalString=n=>String(n).replace('.',',');
  function integerView(part,work,interactive){
    const [a,b,includeA,includeB]=integerIntervals[part.id],lo=Math.floor(a)-1,hi=Math.ceil(b)+1,x=n=>18+232*(n-lo)/(hi-lo);
    const ticks=Array.from({length:hi-lo+1},(_,i)=>i+lo),picked=work.integerSet||[];
    const endpoint=(value,closed)=>'<circle cx="'+x(value)+'" cy="37" r="4.6" fill="'+(closed?'#2d6151':'white')+'" stroke="#2d6151" stroke-width="2"/>';
    const dots=picked.map(n=>'<circle cx="'+x(n)+'" cy="22" r="3" fill="#974313"/>').join('');
    const svg='<svg viewBox="0 0 268 65" style="display:block;width:100%;max-width:440px" role="img" aria-label="Числовой промежуток между '+decimalString(a)+' и '+decimalString(b)+', левый конец '+(includeA?'включён':'исключён')+', правый '+(includeB?'включён':'исключён')+'"><path d="M8 37 H257" stroke="#66766a"/><path d="M'+x(a)+' 37 H'+x(b)+'" stroke="#59816e" stroke-width="5"/>'+ticks.map(n=>'<path d="M'+x(n)+' 33 V42" stroke="#46594a"/><text x="'+x(n)+'" y="57" text-anchor="middle" font-size="12">'+n+'</text>').join('')+endpoint(a,includeA)+endpoint(b,includeB)+dots+'</svg>';
    const buttons=ticks.filter(n=>n>=1).map(n=>'<button type="button" class="secondary" data-integer-value="'+n+'" aria-pressed="'+picked.includes(n)+'">'+(picked.includes(n)?'✓ ':'')+n+'</button>').join(' ');
    return '<figure data-integer-host style="margin:.5em 0"><figcaption>Натуральные точки на прямой</figcaption>'+svg+'<p>Закрашенная граница входит в промежуток, пустая — исключена. Каждая отметка под осью соответствует целому числу.</p>'+(interactive?'<div style="display:flex;flex-wrap:wrap;gap:.3em">'+buttons+'<button type="button" class="secondary" data-integer-empty aria-pressed="'+Boolean(work.integerEmpty)+'">Нет натуральных решений</button></div><p aria-live="polite">'+(work.integerEmpty?'Выбрано пустое множество':picked.length?'Выбрано: '+picked.join('; '):'Отметь все подходящие целые точки.')+'</p><button type="button" class="secondary" data-integer-use>Перенести множество в ответ</button>':'')+'</figure>';
  }
  function mountInteger(main,part,work,save){
    let host=main.querySelector('[data-integer-host]');if(!host)return;
    function draw(){host.outerHTML=integerView(part,work,true);host=main.querySelector('[data-integer-host]');
      for(const b of host.querySelectorAll('[data-integer-value]'))b.onclick=()=>{const n=Number(b.dataset.integerValue),set=new Set(work.integerSet||[]);if(set.has(n))set.delete(n);else set.add(n);work.integerSet=[...set].sort((a,b)=>a-b);delete work.integerEmpty;save();draw();host.querySelector('[data-integer-value="'+n+'"]').focus({preventScroll:true});};
      host.querySelector('[data-integer-empty]').onclick=()=>{work.integerEmpty=!work.integerEmpty;delete work.integerSet;save();draw();host.querySelector('[data-integer-empty]').focus({preventScroll:true});};
      const use=host.querySelector('[data-integer-use]');use.disabled=!work.integerEmpty&&!work.integerSet?.length;use.onclick=()=>{const answer=main.querySelector('#answer');answer.value=work.integerEmpty?'∅':'{'+work.integerSet.join('; ')+'}';answer.dispatchEvent(new Event('input',{bubbles:true}));answer.focus();};
    }draw();
  }
  function sequenceEnd(count,denominator){return root.PetersonBook.M.operation('add','0.5',(count-1)+'/'+denominator);}
  function intervalSequence(work,interactive){
    const M=root.PetersonBook.M,count=work.intervalCount||1000,d=work.intervalDen||0;
    const last=d?M.decimal(sequenceEnd(count,d)):'…',next=d?M.decimal(M.operation('add','0.5','1/'+d)):'…';
    const select=(key,options,active)=>'<select style="display:block;box-sizing:border-box;max-width:100%;width:100%;min-width:0" data-sequence-'+key+'><option value="">Выбери</option>'+options.map(v=>'<option value="'+v+'"'+(active===v?' selected':'')+'>'+v+'</option>').join('')+'</select>';
    const fields=interactive?'<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:.4em">'+[0,1,2].map((_,i)=>'<label>Моё число '+(i+1)+' <input data-sequence-x="'+i+'" style="display:block;box-sizing:border-box;max-width:100%;width:100%;min-width:0" inputmode="decimal" maxlength="50" value="'+U.esc(work.intervalSamples?.[i]||'')+'"></label>').join('')+'<label>Сколько чисел в ряду '+select('count',[1000,10000],count)+'</label><label>Шаг равен 1 / '+select('den',[100,1000,10000,100000,1000000],d)+'</label></div>':'';
    return '<section data-sequence-host><h3>Ряд с постоянным шагом</h3><p>Начни с 0,5. К каждому следующему числу прибавляй один и тот же положительный шаг. Чисел должно быть столько, сколько ты выбрал.</p>'+fields+'<p data-sequence-tape aria-live="polite">Начало: 0,5; '+next+'; … Последнее число: '+last+'.</p>'+(interactive?'<button type="button" class="secondary" data-sequence-use>Перенести числа и правило в ответ</button>':'')+'</section>';
  }
  function sequenceText(work){
    return 'Три числа: '+(work.intervalSamples||[]).join('; ')+'. Ряд: начинаю с 0,5, прибавляю 1/'+work.intervalDen+', всего '+(work.intervalCount||1000)+' чисел.';
  }
  function mountSequence(main,work,save){
    let host=main.querySelector('[data-sequence-host]');if(!host)return;
    function draw(){host.outerHTML=intervalSequence(work,true);host=main.querySelector('[data-sequence-host]');
      const use=host.querySelector('[data-sequence-use]'),enable=()=>{use.disabled=!work.intervalDen||!(work.intervalSamples||[]).length||[0,1,2].some(i=>!work.intervalSamples?.[i]?.trim());};enable();
      for(const field of host.querySelectorAll('[data-sequence-x]'))field.oninput=()=>{const samples=Array.from({length:3},(_,i)=>work.intervalSamples?.[i]||'');samples[Number(field.dataset.sequenceX)]=field.value.slice(0,50);work.intervalSamples=samples;enable();save();};
      for(const [selector,key] of [['[data-sequence-count]','intervalCount'],['[data-sequence-den]','intervalDen']])host.querySelector(selector).onchange=e=>{const val=Number(e.target.value);if(val)work[key]=val;else delete work[key];save();draw();host.querySelector(selector).focus({preventScroll:true});};
      use.onclick=()=>{const el=main.querySelector('#answer');el.value=sequenceText(work);el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();};
    }draw();
  }
  function intervalResponse(number,part,input,work){
    if(number===32){
      if(input!==sequenceText(work))return null;
      const M=root.PetersonBook.M,samples=(work.intervalSamples||[]).map(M.parse);
      if(samples.length!==3||samples.some(v=>!v))return {ok:false,text:'Для каждого из трёх примеров нужна числовая запись.'};
      const outside=samples.findIndex(v=>M.operation('subtract',v,'0.5').n<0||M.operation('subtract',v,'0.6').n>0);
      if(outside>=0)return {ok:false,text:'Проверь число '+(outside+1)+': каждый пример должен лежать между 0,5 и 0,6 включительно.'};
      if(new Set(samples.map(v=>M.answer(v))).size!==3)return {ok:false,text:'Две записи обозначают одно и то же число. Нужны три различных решения.'};
      if(M.operation('subtract',sequenceEnd(work.intervalCount||1000,work.intervalDen),'0.6').n>0)return {ok:false,text:'Последнее число вышло за 0,6. Возьми меньший шаг — увеличь его знаменатель и снова проверь конец ряда.'};
      return {ok:true,text:'Три числа различны и лежат внутри границ. Положительный шаг даёт разные элементы, последнее число тоже в промежутке. Переключи длину ряда и проверь другой случай. Объяснение ждёт проверки.'};
    }
    if(number!==31)return null;
    const text=input.trim().replace(/\.$/,'');let list;
    if(text.startsWith('{')!==text.endsWith('}'))return {ok:false,text:'Для записи множества нужны обе фигурные скобки. Можно также перечислить числа через точку с запятой.'};
    if(['∅','{}','пустое множество'].includes(text.toLowerCase()))list=[];
    else if(/^\{?\s*\d+(?:\s*;\s*\d+)*\s*\}?$/.test(text))list=text.replace(/[{}]/g,'').split(';').map(Number);
    else return null;
    const [a,b,left,right]=integerIntervals[part.id],valid=n=>Number.isInteger(n)&&n>=1&&(left?n>=a:n>a)&&(right?n<=b:n<b),inside=Array.from({length:Math.ceil(b)-Math.floor(a)+1},(_,k)=>Math.floor(a)+k).filter(valid);
    const extra=list.find(n=>!valid(n));if(extra!==undefined)return {ok:false,text:'Число '+extra+' не подходит. '+((extra===a&&!left)||(extra===b&&!right)?'Его точка на открытой границе: строгий знак исключает равенство.':'Сравни это число с обеими границами.')};
    if(new Set(list).size!==list.length)return {ok:false,text:'Одно число повторяется. В множестве каждый элемент записывают один раз.'};
    const missing=inside.find(n=>!list.includes(n));if(missing!==undefined)return {ok:false,text:'Отмеченные числа подходят. Проверь все целые точки в промежутке, включая закрашенные границы.'};
    return {ok:true,text:inside.length?'Все натуральные точки найдены. Прочитай неравенство вслух и объясни границы; запись ждёт проверки.':'Между указанными границами натуральных чисел нет. Объясни, почему соседние целые не подходят.'};
  }

  const flowInputs=['0,08','0,6','2,9','3','7,2','20,5'];
  function flowSpec(part){
    const [,algorithm,index]=part.id.split('-'),first=algorithm==='1';
    return {first,a:flowInputs[Number(index)-1],op:first?'· 0,1':': 0,1',test:first?'≥ 0,3':'< 30',yes:first?'− 0,09':'+ 5,4',no:first?'+ 0,05':'− 7,2'};
  }
  function flowTable(part,progress){
    const algorithm=part.id.split('-')[1];
    const rows=flowInputs.map((value,i)=>{
      const id='030-'+algorithm+'-'+(i+1),work=progress[id],hasDraft=Boolean(work?.draft?.trim());
      const answer=hasDraft?U.esc(work.draft)+(work.correct?' · проверено':' · черновик'):'—';
      return '<tr><th scope="row"><a href="#n/30/'+id+'"'+(id===part.id?' aria-current="true"':'')+'>'+value+'</a></th><td data-flow-output="'+id+'">'+answer+'</td></tr>';
    });
    return '<section aria-label="Таблица значений алгоритма"><h3>Таблица a и x · алгоритм '+algorithm+'</h3><table style="width:100%;table-layout:fixed"><thead><tr><th scope="col">Вход a</th><th scope="col">Мой выход x</th></tr></thead><tbody>'+rows.join('')+'</tbody></table><p>Чтобы заполнить другую строку, выбери её вход a.</p></section>';
  }
  function flowAnswer(part){
    const spec=flowSpec(part),M=root.PetersonBook.M,v=M.operation(spec.first?'multiply':'divide',spec.a,'0.1'),cmp=M.operation('subtract',v,spec.first?'0.3':'30').n;
    return {value:v,yes:spec.first?cmp>=0:cmp<0,equal:cmp===0};
  }
  function flowQuestion(part){
    const s=flowSpec(part);
    return 'Вход a = '+s.a+'. Сначала выполни '+s.op+' с числом a. Проверь, выполняется ли условие «промежуточное число '+s.test+'». При ответе «да» выполни '+s.yes+', при «нет» — '+s.no+'. Запиши итоговое значение x. Исследуй каждое из шести значений a в отдельной строке.';
  }
  function branchReport(part,work){
    const s=flowSpec(part),m=root.PetersonBook.M,expected=flowAnswer(part),typed=m.parse(work.flowValue||'');
    if(!typed)return {ok:false,text:'Введи числовое значение после первого действия.'};
    if(!m.equal(typed,expected.value))return {ok:false,text:s.first?'При умножении на 0,1 исходное положительное число уменьшается в 10 раз. Перенеси запятую на один разряд влево.':'При делении на 0,1 исходное положительное число увеличивается в 10 раз. Перенеси запятую на один разряд вправо.'};
    if(!work.flowBranch)return {ok:false,text:'Промежуточное число верно. Выбери один из выходов из ромба.'};
    if((work.flowBranch==='yes')!==expected.yes)return {ok:false,text:expected.equal?(s.first?'При равенстве порогу условие «≥» выполнено. Проверь выбор ветви.':'При равенстве порогу строгое условие «<» не выполнено. Проверь выбор ветви.'):'Промежуточное число верно. Сравни его с порогом ромба и выбери «да» или «нет».'};
    return {ok:true,text:'Первое действие и ветвь верны. Выполни последнее действие этой ветви, затем сам введи x в ответ.'};
  }
  function flowFigure(part,work,interactive){
    const s=flowSpec(part),chooses=work.flowBranch||'',active='#e5eee8',ink='#294e44',neutral='#fff';
    const rect=(x,y,w,h,label,fill=neutral)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+fill+'" stroke="'+ink+'"/><text x="'+(x+w/2)+'" y="'+(y+h/2+4)+'" text-anchor="middle">'+label+'</text>';
    const show=(label,x,y)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle">'+label+'</text>';
    const line=d=>'<path d="'+d+'" fill="none" stroke="'+ink+'" stroke-width="1.5"/>';
    const diamond='<path d="M132 64 L182 84 L132 104 L82 84 Z" fill="#f4f6e9" stroke="'+ink+'"/>'+show(U.esc(s.test)+'?',132,88);
    const graphic='<svg viewBox="0 0 264 182" style="display:block;width:100%;max-width:360px" role="img" aria-label="После первого действия проверь '+U.esc(s.test)+'. Да: '+U.esc(s.yes)+'. Нет: '+U.esc(s.no)+'."><g font-size="13" fill="#1c332d">'+line('M132 25 V33 M132 55 V64 M82 84 H49 V116 M182 84 H214 V116 M49 138 V161 H101 M214 138 V161 H163')+rect(98,3,68,22,'a = '+s.a)+rect(98,33,68,22,s.op)+diamond+show('нет',55,78)+show('да',207,78)+rect(16,116,66,22,s.no,chooses==='no'?active:neutral)+rect(181,116,66,22,s.yes,chooses==='yes'?active:neutral)+rect(101,150,62,22,'x')+'</g></svg>';
    const report=work.flowChecked?branchReport(part,work):null;
    return '<figure data-flow-host style="margin:.5em 0"><figcaption>Как пройти по схеме</figcaption>'+graphic+'<p>Входы a для этой таблицы: '+flowInputs.join('; ')+'.</p>'+(interactive?'<label>После первого действия <input data-flow-value inputmode="decimal" maxlength="80" value="'+U.esc(work.flowValue||'')+'"></label><label>Выход из ромба <select data-flow-branch><option value="">Выбери</option><option value="yes"'+(chooses==='yes'?' selected':'')+'>Да</option><option value="no"'+(chooses==='no'?' selected':'')+'>Нет</option></select></label><button type="button" class="secondary" data-flow-check>Проверить ход</button><p data-flow-feedback role="status">'+(report?U.esc(report.text):'')+'</p>':'')+'</figure>';
  }
  function mountFlow(main,part,work,save){
    let host=main.querySelector('[data-flow-host]');if(!host)return;
    function draw(){
      host.outerHTML=flowFigure(part,work,true);host=main.querySelector('[data-flow-host]');
      const input=host.querySelector('[data-flow-value]'),select=host.querySelector('[data-flow-branch]'),feedback=host.querySelector('[data-flow-feedback]');
      input.oninput=()=>{work.flowValue=input.value.slice(0,80);delete work.flowChecked;feedback.textContent='';save();};
      select.onchange=()=>{work.flowBranch=select.value;delete work.flowChecked;save();draw();host.querySelector('[data-flow-branch]').focus({preventScroll:true});};
      host.querySelector('[data-flow-check]').onclick=()=>{const report=branchReport(part,work),hasEntry=root.PetersonBook.M.parse(work.flowValue||'')&&work.flowBranch;if(hasEntry&&!report.ok&&!work.flowChecked)work.errors=Math.min(10000,(work.errors||0)+1);work.flowChecked=true;save();draw();host.querySelector('[data-flow-check]').focus({preventScroll:true});};
    }draw();
  }
  function flowResponse(number,part,input,correct){
    if(number!==30||correct)return null;
    const s=flowSpec(part),m=root.PetersonBook.M,v=flowAnswer(part);
    if(m.equal(input,v.value))return {ok:false,text:'Это промежуточное значение после первого действия, а не выход x. Дойди от ромба до конца выбранной ветви.'};
    const other=s.first?(v.yes?m.operation('add',v.value,'0.05'):m.operation('subtract',v.value,'0.09')):(v.yes?m.operation('subtract',v.value,'7.2'):m.operation('add',v.value,'5.4'));
    if(m.equal(input,other))return {ok:false,text:'Такой ответ даёт противоположная ветвь. '+(v.equal?'Здесь промежуточное число ровно на границе. ':'')+'Проверь условие '+s.test+'.'};
    return {ok:false,text:'Проверь первое действие и сравнение в ромбе. После ветвления выполняется только одно из двух последних действий.'};
  }

  const divisorClaims=[
    ['Всякое натуральное число делится без остатка на себя и на единицу.',0,['Любое n можно записать и как 1 · n, и как n · 1.','У каждого числа обязательно два различных делителя.','Достаточно проверить только 12.'],'При n=1 оба названных делителя совпадают, но делимость сохраняется.'],
    ['Существуют числа ровно с одним натуральным делителем.',1,['У числа 1 ровно один натуральный делитель — оно само.','У каждого простого числа только один делитель.','Примером служит 2 с делителями 1 и 2.'],'Слово «существуют» требует хотя бы одного примера. Посчитай различные делители единицы.'],
    ['Для каждого натурального числа найдутся по крайней мере два различных делителя.',0,['Существует исключение — у числа 1 нет второго делителя.','У 2 ровно два делителя.','У 12 больше двух делителей.'],'Обрати особое внимание на начало натурального ряда. Удачный пример не доказывает утверждения о каждом числе.'],
    ['Всякое простое число меньше каждого составного.',0,['Простое число 7 больше составного числа 4.','Простое число 2 меньше составного числа 4.','Число 1 простое и меньше 4.'],'Сохрани обе роли в паре. Для опровержения нужен пример, в котором простое число не меньше составного.'],
    ['Если два числа взаимно просты, каждое из них — простое число.',0,['Числа 8 и 9 составные, а их единственный общий делитель — 1.','Числа 3 и 5 оба простые.','Общий делитель 8 и 9 равен 2.'],'Взаимная простота относится к общим делителям двух чисел, а простота числа — к его собственным делителям.'],
    ['Именно 12 и 15 взаимно просты.',2,['Оба делятся на 3, поэтому данная пара не взаимно проста.','Оба делятся на 1, поэтому они взаимно просты.','Любые разные числа взаимно просты.'],'Для взаимной простоты единственный общий положительный делитель должен быть равен 1.'],
    ['Делитель натурального числа всегда строго меньше самого числа.',0,['У числа 6 есть делитель 6; он равен самому числу.','У 6 есть делитель 2.','6 больше его делителя 3.'],'Знак «строго меньше» нарушается уже при равенстве.'],
    ['Каждое положительное кратное натурального числа строго больше этого числа.',0,['Среди положительных кратных 5 есть 5 · 1 = 5.','У числа 5 есть кратное 10.','10 больше 5.'],'Проверь первое положительное кратное. Равенство тоже опровергает строгое «больше».'],
    ['Есть число, которое делится на 9 и не оканчивается цифрой 9.',1,['18 = 9 · 2 и последняя цифра — 8.','99 делится на 9 и оканчивается цифрой 9.','19 оканчивается цифрой 9.'],'Один пример должен одновременно выдержать две проверки: делимость и условие на последнюю цифру.'],
    ['Произвольное положительное кратное девяти можно представить как 9n с натуральным n.',0,['По определению положительного кратного частное от деления на 9 — натуральное число.','Достаточно проверить только 18.','В записи 9n множитель n всегда равен 9.'],'Здесь «можно представить» относится к каждому положительному кратному. Выбери множитель как частное от деления на 9.'],
    ['Любое простое число имеет вид 2n + 1 с натуральным n.',0,['Простое число 2 чётно, а каждое 2n + 1 нечётно.','Число 3 получается при n = 1.','Число 5 получается при n = 2.'],'Рассмотри простое число, которое отличается от остальных по чётности.'],
    ['Если число имеет вид 2n + 1 при натуральном n, то число простое.',0,['При n = 4 получается 9 = 3 · 3.','При n = 1 получается простое число 3.','Все нечётные числа простые.'],'Найди нечётное составное. Укажи и n, и делитель полученного числа.']
  ];
  function divisorCard(part){
    const [claim,type,reasons,hint]=divisorClaims[Number(part.id.split('-')[1])-1];
    return {prompt:'Определи вид утверждения, затем докажи истинное. Для ложного общего высказывания приведи контрпример и запиши отрицание. Все делители и кратные в этой карточке положительные. Исходная фраза: '+claim,
      leftTitle:'Как сформулировано утверждение?',left:scopeTypes,li:type,rightTitle:'Как обосновать вывод?',right:reasons,ri:0,hint,reference:'Делитель d числа n даёт целое положительное частное n : d. У простого числа ровно два различных положительных делителя. У взаимно простых чисел единственный общий положительный делитель равен единице.',extra:'Мой пример, доказательство или отрицание'};
  }
  function numberLab(part,work,interactive){
    const i=Number(part.id.split('-')[1]),pair=[4,5,6].includes(i),m=work.divisorM||0,n=work.divisorN||0;
    const factors=a=>Array.from({length:a},(_,j)=>j+1).filter(d=>a%d===0),asList=a=>a.join(', ');
    const select=(letter,value)=>'<label>'+letter+' <select data-divisor-'+letter.toLowerCase()+'><option value="">Выбери число</option>'+Array.from({length:100},(_,j)=>j+1).map(v=>'<option value="'+v+'"'+(v===value?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';
    const descriptor=(key,a)=>{const list=factors(a),kind=a===1?'единица':list.length===2?'простое число':'составное число';return '<p>'+key+' = '+a+' · '+kind+'. Делители: '+asList(list)+'.</p>';};
    let output=m?descriptor('m',m):'<p>Выбери натуральное число, чтобы исследовать его делители.</p>';
    if(pair&&n){output+=descriptor('n',n);if(m)output+='<p>Общие делители: '+asList(factors(m).filter(d=>n%d===0))+'.</p>';}
    if(m&&i===8)output+='<p>Первые кратные m: '+[1,2,3,4].map(j=>m*j).join(', ')+'.</p>';
    if(m&&(i===9||i===10))output+='<p>9 · '+m+' = '+(9*m)+'. Последняя цифра: '+(9*m%10)+'.</p>';
    if(m&&(i===11||i===12)){const x=2*m+1;output+='<p>2 · '+m+' + 1 = '+x+'. Делители результата: '+asList(factors(x))+'.</p>';}
    return '<section data-divisor-host aria-label="Модель делимости"><h3>Исследуй числа</h3>'+(interactive?'<div style="display:flex;gap:.5em;flex-wrap:wrap">'+select('M',m)+(pair?select('N',n):'')+'</div>':'')+'<div data-divisor-results aria-live="polite">'+output+'</div></section>';
  }
  function mountNumberLab(main,part,work,save){
    let host=main.querySelector('[data-divisor-host]');if(!host)return;
    function draw(){host.outerHTML=numberLab(part,work,true);host=main.querySelector('[data-divisor-host]');
      for(const [sel,key] of [['[data-divisor-m]','divisorM'],['[data-divisor-n]','divisorN']]){const field=host.querySelector(sel);if(!field)continue;field.onchange=()=>{if(field.value)work[key]=Number(field.value);else delete work[key];save();draw();host.querySelector(sel).focus({preventScroll:true});};}
    }draw();
  }

  const scopeTypes=['Общее высказывание','О существовании','О конкретном случае'];
  const scopeClaims=[
    ['Для каждой птицы верно, что она умеет плавать.',0,['Есть хотя бы одна птица, не умеющая плавать.','Ни одна птица не умеет плавать.','Некоторые птицы умеют плавать.'],'Для опровержения «все» хватит одной неспособной плавать птицы.','Тёмная крачка (Onychoprion fuscatus) живёт над морем, но не умеет плавать.','https://www.allaboutbirds.org/guide/Sooty_Tern','Корнеллская лаборатория орнитологии'],
    ['У телеги всегда четыре колеса. Рассматривай телегу в её словарном значении четырёхколёсной повозки.',0,['Четыре колеса входят в выбранное определение телеги.','Проверена только одна телега.','Достаточно показать любой двухколёсный транспорт.'],'Проверяй, что контрпример удовлетворяет принятому определению телеги.','Словари определяют телегу как четырёхколёсную повозку. При другом употреблении слова определение надо оговорить.','https://gramota.ru/meta/telega','Метасловарь Грамоты'],
    ['Петя и Саша сидят за одной партой.',2,['Речь именно об этих двух учениках.','Для любой пары учеников это верно.','Сказано лишь, что какая-то пара сидит вместе.'],'Оба человека названы. Заменив имена словами «кто-нибудь», ты получишь другое сообщение.','Имена и конкретная ситуация указывают на единичный случай.'],
    ['Брат в любой семье обязательно старше своей сестры.',0,['Есть брат, который не старше своей сестры.','Все братья старше своих сестёр.','Не существует брата старше сестры.'],'Для опровержения достаточно пары, в которой брат моложе сестры или одного с ней возраста.','Например, в семье сестре 12 лет, а брату 8.'],
    ['У каждой медали есть лицевая и оборотная стороны.',0,['Речь о двух сторонах каждой медали.','Проверено существование только одной медали.','Наличие ребра исключает наличие лицевой и оборотной сторон.'],'Названы лицо и оборот. Проследи, к скольким медалям относится фраза.','Под двумя сторонами понимают лицевую и оборотную стороны одной медали.'],
    ['Среди милиционеров есть женщины. Слово «милиционер» в книге относится к названию профессии своего времени.',1,['Утверждается наличие хотя бы одной женщины среди милиционеров.','Утверждается, что каждый милиционер — женщина.','Описана одна женщина, указанная по имени.'],'«Среди … есть» не требует, чтобы все представители группы обладали свойством.','Слово «некоторые» можно передать выражением «существует хотя бы один».'],
    ['В ту пятницу шёл сильный снег.',2,['Сообщается о погоде в определённый день.','Снег шёл каждую пятницу.','В некоторые пятницы всегда идёт снег.'],'Указан отдельный день, а не правило о всех пятницах.','Имеются в виду конкретная пятница и место наблюдения.'],
    ['Иногда собака дружит с кошкой.',1,['Есть хотя бы один случай такой дружбы.','Любая собака дружит с любой кошкой.','Речь об одной собаке, названной по имени.'],'«Иногда» допускает другие случаи, когда дружбы нет.','Смысл слова «иногда» здесь — «бывают такие случаи».'],
    ['Нет попугаев, не умеющих подражать человеческой речи.',0,['Есть попугай, который не умеет подражать человеческой речи.','Все попугаи молчат.','Есть попугай, умеющий подражать речи.'],'Раскрой «нет таких, которые не…»: получается фраза обо всех. Для отрицания достаточно одного исключения.','Под умением говорить здесь понимают подражание человеческой речи. Это же значение должно оставаться в отрицании.'],
    ['Каждые часы всегда спешат.',0,['Существуют часы, которые хотя бы в один момент не спешат.','Все часы опаздывают всегда.','Одни часы в один момент спешили.'],'Здесь два обобщения: «любые часы» и «всегда». Для опровержения достаточно одних часов и одного момента.','Например, часы можно выставить так, что в этот момент они показывают точное время.'],
    ['У любого арбуза кожура полосатая.',0,['Существует арбуз с неполосатой кожурой.','Не существует ни одного полосатого арбуза.','Некоторые арбузы полосатые.'],'Хотя бы один плод с однотонной кожурой опровергает слово «любой».','У сорта Sugar Baby кожура однотонная, тёмная.','https://yardandgarden.extension.iastate.edu/how-to/growing-watermelon-home-garden','Университет штата Айова'],
    ['Возможен велосипед с квадратными колёсами.',1,['Утверждается возможность хотя бы одной такой конструкции.','Любой велосипед имеет квадратные колёса.','Указан по имени конкретный велосипед.'],'Фраза «может иметь» говорит о возможности, а не о свойстве всех экземпляров.','Для утверждения о существовании достаточно одной допустимой конструкции.']
  ];
  function scopeCard(part){
    const [statement,type,reasons,hint,reference,url,sourceName]=scopeClaims[Number(part.id.split('-')[1])-1];
    return {prompt:'Определи вид высказывания. Для ложного общего высказывания запиши отрицание, в остальных случаях объясни свой выбор. Исходная фраза: '+statement,
      leftTitle:'К кому относится фраза?',left:scopeTypes,li:type,rightTitle:'Что следует записать?',right:reasons,ri:0,hint,reference,url,sourceName,extra:'Моё объяснение или отрицание'};
  }

  const arithmeticClaims=[
    ['Каждое решение двойного неравенства 1 < x ≤ 8 — натуральное число.',false,['1,5 находится в интервале и не является натуральным.','0 не является натуральным.','8 принадлежит интервалу и является натуральным.'],'Контрпример должен выполнить обе границы и нарушить натуральность.','Существует ненатуральное решение 1 < x ≤ 8.'],
    ['Среди решений 2 ≤ x < 3 нет натуральных чисел.',false,['2 — натуральное решение.','3 — натуральное число.','2,5 — решение, которое не является натуральным.'],'Проверь обе границы. Знак слева разрешает значение 2, знак справа исключает 3.','Существует натуральное решение 2 ≤ x < 3.'],
    ['При делении натуральных чисел с остатком остаток всегда меньше делителя.',true,['Если остаток не меньше делителя, из него можно выделить ещё один целый делитель.','Так получилось при делении 17 на 5.','Остаток всегда равен единице.'],'Один пример не доказывает правило для всех. Проверь, можно ли продолжить деление, если остаток ещё велик.','В записи a = bq + r для положительного b имеем 0 ≤ r < b.'],
    ['Любая обыкновенная дробь допускает конечную десятичную запись.',false,['1/3 даёт бесконечную периодическую запись.','1/4 записывается как 0,25.','1/5 записывается как 0,2.'],'Один удачный перевод в конечную запись не опровергает общее правило. Ищи деление, в котором остаток повторится.','Существует обыкновенная дробь без конечной десятичной записи.'],
    ['Всякую конечную десятичную дробь можно записать обыкновенной дробью.',true,['Если после запятой k цифр, знаменателем можно сделать 10 в степени k.','Достаточно проверить запись 0,5.','Знаменатель всегда равен 10, сколько бы цифр ни стояло после запятой.'],'Обоснование должно работать и для сотых, и для тысячных, и для любого числа десятичных знаков.','Например, 0,037 = 37/1000. Правило переноса запятой относится к любому числу знаков.'],
    ['Округление числа всегда даёт меньшее число.',false,['1,8 при округлении до целых даёт 2.','1,2 при округлении до целых даёт 1.','1,8 при округлении до целых даёт 1.'],'Один случай уменьшения не опровергает фразу «всегда уменьшается». Сначала проверь само округление.','Есть число, которое при округлении не уменьшается.'],
    ['Умножение на единицу оставляет любое число прежним.',true,['Для любого a произведение a · 1 равно a.','Только целые числа при умножении на 1 сохраняются.','1,5 · 1 = 1,5, поэтому остальных чисел можно не проверять.'],'Нужно общее свойство единицы, а не удачный пример с одним множителем.','Единица — нейтральный множитель.'],
    ['Сумма двух натуральных чисел больше каждого слагаемого. Натуральный ряд начинается с 1.',true,['Прибавление каждого из двух положительных слагаемых увеличивает другое.','К одному из чисел можно прибавить ноль.','В качестве натурального слагаемого можно взять −1.'],'В этом задании оба слагаемых из ряда 1, 2, 3, … Проверяй условие на оба числа.','Если a и b положительны, то a+b>a и a+b>b.'],
    ['Произведение двух ненулевых чисел больше каждого множителя.',false,['0,5 · 0,5 = 0,25, что меньше каждого множителя.','0 · 10 = 0.','2 · 3 = 6, что больше обоих множителей.'],'Нулевой множитель в условии запрещён. Для двух положительных чисел меньше единицы оцени, как меняется произведение.','Есть ненулевые множители, произведение которых не больше хотя бы одного из них.'],
    ['Частное конечных десятичных дробей всегда имеет конечную десятичную запись. Делитель ненулевой.',false,['0,1 : 0,3 = 1/3, десятичная запись периодическая.','1,2 : 0,3 = 4.','1,2 : 0 не даёт конечной записи.'],'Делить на ноль нельзя. Нужна пара допустимых дробей, у которой получится бесконечная запись.','Существуют конечные десятичные дроби с ненулевым делителем, для которых частное не имеет конечной записи.']
  ];
  function witnessCard(part){
    const [statement,truth,proof,hint,reference]=arithmeticClaims[Number(part.id.split('-')[1])-1];
    return {prompt:'Проверь утверждение. Если оно ложно, запиши отрицание и докажи его истинность. Если истинно — обоснуй общее правило. Исходная фраза: '+statement,
      leftTitle:'Значение исходной фразы',left:['Истинно','Ложно'],li:truth?0:1,rightTitle:'Что обосновывает ответ?',right:proof,ri:0,hint,reference,extra:'Моё объяснение или отрицание'};
  }

  const universalStatements=[
    ['Каждая европейская страна входит в Европейский союз.','европейская страна','не входящая в Европейский союз','входящая в Европейский союз','находящаяся вне Европы','Не все европейские страны входят в Евросоюз.','Сохрани круг стран: рассматриваются именно европейские. Членство в союзе — свойство, которое меняется.'],
    ['Любое европейское государство является республикой.','европейское государство','которое не является республикой','которое является республикой','которое находится за пределами Европы','Не каждое европейское государство является республикой.','Меняется форма правления, а принадлежность государства к Европе сохраняется.'],
    ['В каждом российском городе найдётся памятник истории.','город России','в котором нет ни одного памятника истории','в котором есть памятник истории','в котором один из домов не является памятником','Не в каждом российском городе есть памятник истории.','Одного дома без статуса памятника мало. В городе-контрпримере не должно быть ни одного такого памятника.'],
    ['Все города России расположены в Европе.','город России','расположенный вне Европы','расположенный в Европе','не относящийся к России','Не все города России расположены в Европе.','Для контрпримера нужен именно российский город: меняется только его расположение в Европе.'],
    ['Любая планета имеет форму шара. Одинаково понимай «форму шара» в обеих фразах.','планета','форма которой не соответствует принятому здесь смыслу шара','форма которой соответствует принятому здесь смыслу шара','которая не является планетой','Не всякая планета имеет форму шара.','Выбери один смысл формы шара: точная геометрическая форма или приближённая модель. Используй его в обеих фразах.'],
    ['У любой планеты Солнечной системы есть естественный спутник.','планета Солнечной системы','не имеющая естественных спутников','имеющая хотя бы один естественный спутник','у которой нет искусственных спутников','Не у каждой планеты Солнечной системы есть естественный спутник.','Сохрани слово «естественный». Отсутствие одного конкретного спутника не означает отсутствия всех.'],
    ['Ни одна планета Солнечной системы не окружена кольцами.','планета Солнечной системы','имеющая кольца','не имеющая колец','имеющая естественный спутник','Неверно, что у всех планет Солнечной системы отсутствуют кольца.','Исходная фраза уже содержит отрицание. Для её опровержения нужны именно кольца хотя бы у одной планеты.'],
    ['На всякой планете есть вода.','планета','на которой нет воды','на которой есть вода','на которой нет океана','Не на каждой планете есть вода.','Отсутствие океана ещё допускает воду в другой форме. Сохрани значение слова «вода».'],
    ['Любое высказывание выражается повествовательным предложением.','высказывание','которое не является повествовательным предложением','которое является повествовательным предложением','которое ложно','Не всякое высказывание является повествовательным предложением.','Отрицай форму предложения. Истинность самого высказывания — другое свойство.'],
    ['Ни одно вопросительное предложение не является высказыванием.','вопросительное предложение','которое является высказыванием','которое не является высказыванием','на которое кто-то ответил','Неверно, что ни одно вопросительное предложение не является высказыванием.','В исходном тексте говорится о самом вопросительном предложении, а не о возможном ответе на него.'],
    ['У каждого четырёхугольника диагонали равны.','четырёхугольник','диагонали которого различны по длине','диагонали которого равны','у которого стороны имеют разную длину','Не у всех четырёхугольников равные диагонали.','Сравни длины диагоналей. Разные стороны сами по себе ничего не решают.'],
    ['Всякий угол является либо острым, либо тупым.','угол','который не является ни острым, ни тупым','который не является острым','который не является тупым','Не всякий угол является острым или тупым.','Чтобы отрицать «острый или тупой», исключи одновременно оба вида. Например, проверь угол в 90°.']
  ];
  function universalCard(part){
    const [statement,subject,opposite,unchanged,distractor,alternative,hint]=universalStatements[Number(part.id.split('-')[1])-1];
    return {prompt:'Составь два равносильных отрицания и объясни, почему ровно одно из исходного утверждения и его отрицания верно. Исходная фраза: '+statement,
      reference:'Представь список всех рассматриваемых объектов. Либо у каждого есть нужное свойство, либо найдётся объект без него. Для фразы «ни один» контрпримером будет объект с указанным свойством.',
      leftTitle:'Начало отрицания',left:['Существует хотя бы один такой объект','Любой такой объект','Не существует ни одного такого объекта'],li:0,
      rightTitle:'Какой объект нужен?',right:[subject+', '+opposite,subject+', '+unchanged,subject+', '+distractor],ri:0,hint,alternative,second:true};
  }

  const factChecks=[
    ['Бруно следовал астрономическому учению Птолемея.','Бруно развивал представление Коперника о движении Земли.','Бруно не следовал этому учению Птолемея.','Бруно не занимался астрономией.','Птолемей следовал учению Бруно.','Отрицай именно указанную связь учёного с учением. Занятия астрономией сами по себе её не устанавливают.','https://plato.stanford.edu/entries/bruno/','Стэнфордская энциклопедия философии'],
    ['Рекорд высоты среди деревьев принадлежит пальмам.','Выше всех известных ныне живущих деревьев вырастают вечнозелёные секвойи.','Рекорд высоты среди деревьев не принадлежит пальмам.','Все пальмы низкие.','Ни одно другое дерево не выше пальмы.','Высокое дерево может и не быть рекордсменом. Утверждение о первенстве опровергает более высокий вид.','https://home.nps.gov/articles/000/coast-redwood.htm','Служба национальных парков США'],
    ['По массе в земном воздухе кислорода не меньше, чем азота.','В 100 кг сухого воздуха около 23,1 кг кислорода и 75,5 кг азота.','По массе кислорода меньше, чем азота.','По массе кислорода не больше, чем азота.','По массе кислорода столько же, сколько азота.','При равенстве исходное «не меньше» уже верно. Можно ли оставить равенство в его отрицании?','https://assets.publishing.service.gov.uk/media/5e18b963ed915d3b08797c2e/Volume_10_Meteorology__CFS_version_.pdf','Метеорологический справочник, таблица 1'],
    ['Территория Германии больше территории Франции.','Справочные площади: Германия около 358 тысяч км², Франция более 550 тысяч км².','Территория Германии не больше территории Франции.','Территории этих стран равны.','Германия больше любой другой страны.','Отрицание знака «больше» охватывает сразу два случая: меньше и равно. Верное наблюдение и точное отрицание — разные требования.','https://european-union.europa.eu/principles-countries-history/eu-countries/france_en','Справочник ЕС о странах'],
    ['Год основания Санкт-Петербурга — 1704 или 1705.','Датой основания города считают закладку крепости в 1703 году.','Город не был основан ни в 1704, ни в 1705 году.','Город основан не в 1704 году, зато в 1705.','Город основан не в 1705 году, зато в 1704.','Для отрицания «или» исключи оба года. Если оставить один из них, исходная версия по-прежнему возможна.','https://www.prlib.ru/history/619267','Президентская библиотека'],
    ['Альтернативы в высказывании о кенгуру — жить в Австралии или в Антарктиде. Под «или» здесь понимаем «выполнена хотя бы одна альтернатива».','Рыжий кенгуру обитает в Австралии.','Пропустить при записи ложных высказываний.','Записать как ложное, потому что Антарктида не подходит.','Записать как ложное, потому что нужны оба материка.','Логическое «или» истинно уже при одной верной альтернативе. Исходное задание просит отрицать только ложные высказывания.','https://australian.museum/learn/animals/mammals/red-kangaroo/','Австралийский музей']
  ];
  const relationChecks=[
    ['Число x меньше пяти девятых.',['x < 5/9','x ≤ 5/9','x > 5/9'],['x ≥ 5/9','x > 5/9','x ≤ 5/9'],'Подставь x = 5/9. Слово «меньше» равенства не допускает.'],
    ['Число y не меньше трёх целых четырёх тысячных.',['y ≥ 3,004','y > 3,004','y ≥ 3,04'],['y < 3,004','y ≤ 3,004','y > 3,004'],'Проверь тысячные, затем возьми y = 3,004. Равенство уже входит в исходную фразу.'],
    ['Если из a вычесть b, получится c.',['a − b = c','b − a = c','a + b = c'],['a − b ≠ c','a − b < c','b − a ≠ c'],'Порядок уменьшаемого и вычитаемого сохраняется. Два неравных числа могут стоять в любом порядке.'],
    ['Квадрат числа n отличается от 16.',['n² ≠ 16','n² = 16','2n ≠ 16'],['n² = 16','n² < 16','n = 16'],'Подставь n = −4. Решение должно учитывать и положительные, и отрицательные значения n.'],
    ['Значение x больше квадрата этого же числа.',['x > x²','x ≥ x²','x² > x'],['x ≤ x²','x < x²','x ≥ x²'],'Попробуй x = 0, затем x = 0,5. Ровно одна из двух записей должна выполняться каждый раз.'],
    ['Значение x на единицу меньше квадрата этого же числа.',['x = x² − 1','x < x²','x² = x − 1'],['x ≠ x² − 1','x ≥ x²','x = x² + 1'],'«На единицу» задаёт точную разность. Для отрицания достаточно любой другой разности, в том числе двух.']
  ];
  function logicCard(number,part){
    if(number===26)return universalCard(part);
    if(number===27)return witnessCard(part);
    if(number===28)return scopeCard(part);
    if(number===29)return divisorCard(part);
    if(number===39||number===40)return factorCard(number,part);
    if((number===35||number===36)&&part.id.endsWith('pravilo'))return periodicRule(number);
    const i=Number(part.id.split('-')[1])-1;
    if(number===19){
      const [statement,fact,denial,a,b,hint,url,sourceName]=factChecks[i];
      return {prompt:'Реши, верно ли утверждение. Если оно ложно, вырази его отрицание. Обоснуй своё решение. '+statement,
        reference:fact,url,sourceName,leftTitle:'Оценка утверждения',left:['Истинно','Ложно'],li:i===5?0:1,rightTitle:'Что записать',right:[denial,a,b],ri:0,hint};
    }
    if(number===20){
      const [statement,left,right,hint]=relationChecks[i];
      return {prompt:'Переведи фразу в математическую запись, затем запиши её отрицание. '+statement,
        reference:'Проверка пары: при одном и том же выборе чисел первая запись и её отрицание должны давать противоположные ответы.',leftTitle:'Первая запись',left,li:0,rightTitle:'Её отрицание',right,ri:0,hint};
    }
    return {prompt:'Проверь высказывание «каждая река впадает в Каспийское море». Сформулируй его отрицание и объясни, почему из двух фраз истинна ровно одна.',
      reference:'Волга заканчивает свой путь в Каспийском море, а Нева относится к бассейну Балтийского моря.',url:'https://bigenc.ru/c/vostochno-evropeiskaia-ravnina-e8ecd2',sourceName:'Большая российская энциклопедия',
      leftTitle:'Как звучит отрицание?',left:['Есть река, не впадающая в Каспийское море.','Ни одна река не впадает в Каспийское море.','Есть река, впадающая в Каспийское море.'],li:0,
      rightTitle:'Как проверить исходную фразу?',right:['Указать реку, которая впадает в другое море.','Достаточно найти реку, впадающую в Каспийское море.','Убедиться, что ни одна река не впадает в Каспийское море.'],ri:0,
      hint:'Для опровержения слов «все реки» достаточно одного контрпримера. Отдельная река, впадающая в Каспий, исходную фразу ещё не доказывает.'};
  }
  function logicConstruction(number,part,interactive){
    const card=logicCard(number,part);
    const group=(side,title,options)=>{
      const subpart=Number.parseInt(part.id.split('-')[1],10)||0;
      const offset=(subpart+number+(side==='left'?0:1))%options.length;
      return '<label style="display:grid;gap:.2em">'+U.esc(title)+'<select style="max-width:100%;width:100%;min-width:0" data-logic-'+side+'><option value="">Выбери вариант</option>'+options.map((_,j)=>{const i=(j+offset)%options.length;return '<option value="'+(i+1)+'">'+U.esc(options[i])+'</option>';}).join('')+'</select></label>';
    };
    return '<section data-logic-host aria-label="Проверка двух записей"><h3>Проверь две записи</h3>'+(interactive?'<div style="display:grid;gap:.6em">'+group('left',card.leftTitle,card.left)+group('right',card.rightTitle,card.right)+((card.second||card.extra)?'<label>'+U.esc(card.extra||'Второе, равносильное отрицание своими словами')+'<textarea maxlength="600" data-logic-other></textarea></label>':'')+'</div><p data-logic-summary aria-live="polite"></p><button type="button" class="secondary" data-logic-use>Перенести выбранную пару в ответ</button>':'')+'<details data-logic-reference><summary>'+(number===20?'Как проверить пару':'Справка для проверки')+'</summary><p>'+U.esc(card.reference)+(card.second?' Например: «'+U.esc(card.alternative)+'»':'')+'</p>'+(card.url?'<a href="'+U.esc(card.url)+'" target="_blank" rel="noopener noreferrer">'+U.esc(card.sourceName)+'</a>':'')+'</details></section>';
  }
  function logicText(card,work){return (card.left[work.logicLeft-1]||'…')+' / '+(card.right[work.logicRight-1]||'…')+((card.second||card.extra)&&work.logicOther?' / '+(card.extra||'Второе отрицание')+': '+work.logicOther:'');}
  function mountLogic(main,number,part,work,save){
    const host=main.querySelector('[data-logic-host]');if(!host)return;
    host.outerHTML=logicConstruction(number,part,true);
    const card=logicCard(number,part),left=main.querySelector('[data-logic-left]'),right=main.querySelector('[data-logic-right]'),use=main.querySelector('[data-logic-use]');
    const other=main.querySelector('[data-logic-other]');if(other){other.value=work.logicOther||'';other.oninput=()=>{work.logicOther=other.value.slice(0,600);update();save();};}
    function update(){left.value=work.logicLeft||'';right.value=work.logicRight||'';main.querySelector('[data-logic-summary]').textContent=logicText(card,work);use.disabled=!work.logicLeft||!work.logicRight;}
    for(const [select,key] of [[left,'logicLeft'],[right,'logicRight']])select.onchange=()=>{if(select.value)work[key]=Number(select.value);else delete work[key];update();save();};
    use.onclick=()=>{const field=main.querySelector('#answer');field.value=logicText(card,work);field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();};
    const reference=main.querySelector('[data-logic-reference]');reference.open=Boolean(work.logicReference);
    reference.ontoggle=()=>{if(reference.open===Boolean(work.logicReference))return;work.logicReference=reference.open;if(reference.open)root.PetersonBook.assist(work);save();};
    update();
  }
  function logicResponse(number,part,input,work){
    const periodRule=(number===35||number===36)&&part.id.endsWith('pravilo');
    if((number<19||number>21)&&(number<26||number>29)&&number!==39&&number!==40&&!periodRule)return null;
    const card=logicCard(number,part);if(input!==logicText(card,work))return null;
    if(work.logicLeft!==card.li+1)return {ok:false,text:number===26?'Сколько объектов достаточно предъявить, чтобы опровергнуть утверждение обо всех? Сохрани условие о предмете разговора.':number===19?'Проверь именно исходное утверждение. В справке есть факт, с которым его можно сопоставить.':card.hint};
    if(work.logicRight!==card.ri+1)return {ok:false,text:card.hint};
    if((number>=27&&number<=29)||number===39||number===40||periodRule)return {ok:true,text:work.logicOther?.trim()?'Обоснование для выбранной оценки подходит. Свою формулировку ты сохранил для проверки.':'Обоснование для выбранной оценки подходит. Добавь своё объяснение или отрицание ложной фразы и сохрани ответ.'};
    if(number===26)return {ok:true,text:work.logicOther?.trim()?'Такой объект был бы контрпримером. Второе отрицание сохранено вместе с первой формой для проверки. Обоснуй, почему обе формы равносильны.':'Такой объект был бы контрпримером. Добавь вторую формулировку своими словами, затем ещё раз перенеси обе в ответ.'};
    return {ok:true,text:'Пара записей подходит. Добавь своё обоснование. Учитель проверит полное рассуждение.'};
  }

  function openingQuestion(number,part) {
    if(number===39||number===40)return factorCard(number,part).prompt;
    if(number===41)return 'Число a задано произведением 2 · 3 · 7. Найди a и запиши множество D(a) всех его положительных делителей. Покажи, как убедился в полноте множества.';
    if(number===37)return cutoutQuestion(part);
    if((number===35||number===36)&&part.id.endsWith('pravilo'))return periodicRule(number).prompt;
    if(number===35)return 'Запиши дробь '+periodTasks[part.id]+' как бесконечную периодическую десятичную дробь, затем округли её до тысячных. Для периода используй скобки.';
    if(number===36)return 'Найди частное данных десятичных дробей. Дойди при делении до цифры, позволяющей округлить результат до десятитысячных.';
    if(number===34)return resultQuestion(part);
    if(number===33)return roundingQuestion(part);
    if(number===31)return 'Прочитай неравенство '+part.prompt+' и перечисли все натуральные значения x, удовлетворяющие обеим границам. Если их нет, запиши пустое множество.';
    if(number===32)return 'В промежутке 0,5 ≤ x ≤ 0,6 найди три разных решения. Придумай способ получить 1000 различных решений; проверь, можно ли получить 10 000. Объясни, почему границы не нарушаются.';
    if(number===30)return flowQuestion(part);
    if(number===25)return 'Замени одинаковые буквы одинаковыми цифрами, а разные буквы — различными. Первая цифра числа не может быть нулём. Найди верную подстановку для '+(part.id==='025-1'?'ЛЕТО + ЛЕТО = ПОЛЁТ.':'ПЧЁЛКА × 7 = ЖЖЖЖЖЖ.')+' Объясни, как проверил результат.';
    if(number===22||number===38)return codewordQuestion(part);
    if(number===23)return 'Вычисли всё выражение. Рассмотри действия внутри каждой скобки. Промежуточные значения сохраняй без округления.';
    if(number===24)return 'С первого улья собрали 24,8 кг мёда. Второй дал на 6,4 кг меньше первого. С третьего получили половину совместного сбора первого и второго. Весь мёд поровну разлили в 18 банок. Сколько килограммов мёда в одной банке?';
    if((number>=19&&number<=21)||(number>=26&&number<=29))return logicCard(number,part).prompt;
    if(number===17||number===18)return campQuestion(number,part);
    if(number>=14&&number<=16)return compareSource(number,part);
    if(number>=7&&number<=10)return pageSevenQuestion(number,part);
    if(number>=11&&number<=13)return number===11?'Вычисли устно. Выбери удобный способ: разряды, перенос запятой или проверку обратным действием.':number===12?'Выполни указанное действие с десятичными дробями. Для записи по разрядам или промежуточных вычислений открой черновик.':'Найди значение всего выражения. Выдели внутренние действия и запиши промежуточные результаты перед последним действием.';
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
    if(item.number===22||item.number===38)drawing=part.expression?decimalModel(part):cipherView({},false,item.number);
    if(item.number===23)drawing=decimalModel(part);
    if(item.number===24)drawing=honeySupport();
    if(item.number===30)drawing=flowFigure(part,{},false);
    if(item.number===31)drawing=integerView(part,{},false);
    if(item.number===32)drawing=intervalSequence({},false);
    if(item.number===33)drawing=roundingFigure(part,{},false);
    if(item.number===34)drawing=calculationView(part,{},false);
    if(item.number===37)drawing=geometryFigure(part,{},false);
    if(item.number===39||item.number===40)drawing=logicConstruction(item.number,part,false)+formulaLab(item.number,part,{},false);
    if(item.number===41)drawing=factorBasket({},false);
    if(item.number===35||item.number===36)drawing=part.id.endsWith('pravilo')?logicConstruction(item.number,part,false):divisionView(part,{},false);
    if(item.number===25)drawing=puzzleFigure(part,{},false);
    if((item.number>=19&&item.number<=21)||(item.number>=26&&item.number<=29))drawing=logicConstruction(item.number,part,false)+(item.number===29?numberLab(part,{},false):'');
    if(item.number===17||item.number===18)drawing=campSupport(item.number,part);
    if(item.number>=14&&item.number<=16)drawing=sourceSupport(item.number,part);
    if(item.number>=11&&item.number<=13)drawing=decimalModel(part);
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
  root.PetersonCompanion={pane,material,attach,hasCompletePrompt,pageSevenResponse,setTiles,mountDecimal,decimalError,orderResponse,mountFraction,mountPlanets,campResponse,mountLogic,logicResponse,mountCipher,codewordResponse,mountPuzzle,puzzleResponse,mountNumberLab,mountFlow,flowResponse,flowTable,mountInteger,mountSequence,intervalResponse,mountRounding,roundingResponse,mountCalc,calcResponse,mountPeriod,periodResponse,mountGeometry,geometryResponse,mountFormulaLab,mountBasket,basketResponse};
})(globalThis);
