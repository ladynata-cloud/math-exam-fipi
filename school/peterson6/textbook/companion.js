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
    const many=/^(013|023)-/.test(part.id),columns=many?[]:decimalColumns(part),nodes=many?operations(part.expression):[],keys=many?nodes.map((_,i)=>'Действие '+(i+1)):columns.map(placeName);
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
  function codewordQuestion(part){
    if(part.id==='022-slovo')return 'Оставь буквы равенств, которые верны именно в записанном виде. Расположи их по возрастанию результатов и прочитай астрономический термин. Для остальных строк запиши исправленные вычисления.';
    const row=codedRows.find(([letter])=>letter===part.label);
    return 'Для буквы '+row[0]+' предложено равенство '+row[1]+' = '+row[2]+'. Проверь его вычислением и введи правильное значение левой части. Для шифра оставь букву только при совпадении.';
  }
  function cipherView(work,interactive){
    const buttons=codedRows.map(([letter,expression,claim])=>{
      const selected=(work.cipherLetters||'').includes(letter);
      return '<li style="margin:.2rem 0">'+(interactive?'<button style="width:100%;text-align:left;white-space:normal" type="button" class="secondary" data-cipher-letter="'+letter+'" aria-pressed="'+selected+'">'+(selected?'✓ ':'')+letter+' · '+expression+' = '+claim+'</button>':letter+' · '+expression+' = '+claim)+'</li>';
    }).join('');
    return '<section data-cipher-host aria-label="Буквы шифра"><h3>Лента букв</h3><p>Касайся строк в нужном порядке. Повторное нажатие убирает букву, следующее ставит её в конец.</p><p data-cipher-draft aria-live="polite">'+(work.cipherLetters||'Лента пока пуста')+'</p><ul style="list-style:none;padding-left:0">'+buttons+'</ul>'+(interactive?'<button class="secondary" type="button" data-cipher-use>Перенести ленту в ответ</button>':'')+'</section>';
  }
  function mountCipher(main,work,save){
    let host=main.querySelector('[data-cipher-host]');if(!host)return;
    function draw(){
      host.outerHTML=cipherView(work,true);host=main.querySelector('[data-cipher-host]');
      for(const button of host.querySelectorAll('[data-cipher-letter]'))button.onclick=()=>{
        const letter=button.dataset.cipherLetter,current=work.cipherLetters||'';work.cipherLetters=current.includes(letter)?current.replace(letter,''):current+letter;
        save();draw();host.querySelector('[data-cipher-letter="'+letter+'"]').focus({preventScroll:true});
      };
      const use=host.querySelector('[data-cipher-use]');use.disabled=!work.cipherLetters;use.onclick=()=>{const input=main.querySelector('#answer');input.value=work.cipherLetters;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};
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
    if(number!==22)return null;
    if(part.id!=='022-slovo'){
      const claim=codedRows.find(([letter])=>letter===part.label)[2],eq=root.PetersonBook.M.equal;
      if(correct)return {ok:true,text:eq(input,claim)?'Вычислено верно. Напечатанное равенство верно, его буква участвует в шифре.':'Вычислено верно. Напечатанный результат был ошибочным, эту букву пропусти при расшифровке.'};
      return {ok:false,text:eq(input,claim)?'Это результат из проверяемой строки. Вычисли левую часть самостоятельно. '+opHint[part.expression.op]:opHint[part.expression.op]};
    }
    const entered=input.toUpperCase().replace(/[\s.]+/g,'');if(!/^[А-ЯЁ]+$/.test(entered))return null;
    const key='АСТЕРОИД',wrong=[...entered].find(c=>!key.includes(c));
    if(wrong)return {ok:false,text:'Для буквы '+wrong+' не записано верное равенство. Проверь её исходную строку до исправления.'};
    if(new Set(entered).size<entered.length)return {ok:false,text:'Одна из букв встречается дважды. Каждая верная исходная строка даёт ровно одну букву.'};
    if([...entered].some((c,i)=>i&&key.indexOf(entered[i-1])>key.indexOf(c)))return {ok:false,text:'Подходящие буквы есть, но результаты должны возрастать. Сопоставь соседним буквам числа и сравни их по разрядам.'};
    if(entered!==key)return {ok:false,text:'Выбранные буквы стоят по возрастанию. Проверь оставшиеся строки: среди них есть ещё верная.'};
    return {ok:true,text:'Получился астрономический термин. Сохрани в черновике исправления ложных равенств для проверки учителем.'};
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
      const offset=(Number(part.id.split('-')[1])+number+(side==='left'?0:1))%options.length;
      return '<label style="display:grid;gap:.2em">'+U.esc(title)+'<select style="max-width:100%;width:100%;min-width:0" data-logic-'+side+'><option value="">Выбери вариант</option>'+options.map((_,j)=>{const i=(j+offset)%options.length;return '<option value="'+(i+1)+'">'+U.esc(options[i])+'</option>';}).join('')+'</select></label>';
    };
    return '<section data-logic-host aria-label="Проверка двух записей"><h3>Проверь две записи</h3>'+(interactive?'<div style="display:grid;gap:.6em">'+group('left',card.leftTitle,card.left)+group('right',card.rightTitle,card.right)+(card.second?'<label>Второе, равносильное отрицание своими словами<textarea maxlength="600" data-logic-other></textarea></label>':'')+'</div><p data-logic-summary aria-live="polite"></p><button type="button" class="secondary" data-logic-use>Перенести выбранную пару в ответ</button>':'')+'<details data-logic-reference><summary>'+(number===20?'Как проверить пару':'Справка для проверки')+'</summary><p>'+U.esc(card.reference)+(card.second?' Например: «'+U.esc(card.alternative)+'»':'')+'</p>'+(card.url?'<a href="'+U.esc(card.url)+'" target="_blank" rel="noopener noreferrer">'+U.esc(card.sourceName)+'</a>':'')+'</details></section>';
  }
  function logicText(card,work){return (card.left[work.logicLeft-1]||'…')+' / '+(card.right[work.logicRight-1]||'…')+(card.second&&work.logicOther?' / Второе отрицание: '+work.logicOther:'');}
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
    if((number<19||number>21)&&number!==26)return null;
    const card=logicCard(number,part);if(input!==logicText(card,work))return null;
    if(work.logicLeft!==card.li+1)return {ok:false,text:number===26?'Сколько объектов достаточно предъявить, чтобы опровергнуть утверждение обо всех? Сохрани условие о предмете разговора.':number===19?'Проверь именно исходное утверждение. В справке есть факт, с которым его можно сопоставить.':card.hint};
    if(work.logicRight!==card.ri+1)return {ok:false,text:card.hint};
    if(number===26)return {ok:true,text:work.logicOther?.trim()?'Такой объект был бы контрпримером. Второе отрицание сохранено вместе с первой формой для проверки. Обоснуй, почему обе формы равносильны.':'Такой объект был бы контрпримером. Добавь вторую формулировку своими словами, затем ещё раз перенеси обе в ответ.'};
    return {ok:true,text:'Пара записей подходит. Добавь своё обоснование. Учитель проверит полное рассуждение.'};
  }

  function openingQuestion(number,part) {
    if(number===25)return 'Замени одинаковые буквы одинаковыми цифрами, а разные буквы — различными. Первая цифра числа не может быть нулём. Найди верную подстановку для '+(part.id==='025-1'?'ЛЕТО + ЛЕТО = ПОЛЁТ.':'ПЧЁЛКА × 7 = ЖЖЖЖЖЖ.')+' Объясни, как проверил результат.';
    if(number===22)return codewordQuestion(part);
    if(number===23)return 'Вычисли всё выражение. Рассмотри действия внутри каждой скобки. Промежуточные значения сохраняй без округления.';
    if(number===24)return 'С первого улья собрали 24,8 кг мёда. Второй дал на 6,4 кг меньше первого. С третьего получили половину совместного сбора первого и второго. Весь мёд поровну разлили в 18 банок. Сколько килограммов мёда в одной банке?';
    if((number>=19&&number<=21)||number===26)return logicCard(number,part).prompt;
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
    if(item.number===22)drawing=part.id==='022-slovo'?cipherView({},false):decimalModel(part);
    if(item.number===23)drawing=decimalModel(part);
    if(item.number===24)drawing=honeySupport();
    if(item.number===25)drawing=puzzleFigure(part,{},false);
    if((item.number>=19&&item.number<=21)||item.number===26)drawing=logicConstruction(item.number,part,false);
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
  root.PetersonCompanion={pane,material,attach,hasCompletePrompt,pageSevenResponse,setTiles,mountDecimal,decimalError,orderResponse,mountFraction,mountPlanets,campResponse,mountLogic,logicResponse,mountCipher,codewordResponse,mountPuzzle,puzzleResponse};
})(globalThis);
