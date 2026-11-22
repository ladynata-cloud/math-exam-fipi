(function(root){
  'use strict';
  const E=root.PetersonBook,G=root.PetersonPractice,U=root.PetersonUI;
  const numerical=(prompt,answer,step,hint)=>({kind:'numeric',prompt,answer:String(answer),steps:[{kind:'numeric',prompt:step,answer:String(answer),hint}]});
  const choice=(prompt,options,answer,hint)=>({kind:'choice',prompt,choices:options,answer,steps:[{kind:'choice',prompt:'Какой вывод согласуется с данными?',choices:options,answer,hint}]});
  const families={
    code(n){
      const alphabet='АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',word=['ДУГА','ГРАНЬ','ТОЧКА','ЛУЧ','УГОЛ'][n%5];
      const key=Array.from(word).map(c=>alphabet.indexOf(c)+1).join(' · ');
      return choice('Буквы русского алфавита с Ё пронумерованы от 1 до 33. Какое слово задаёт запись '+key+'?',['ДУГА','ГРАНЬ','ТОЧКА','ЛУЧ','УГОЛ'],word,'Найди каждую букву по порядковому номеру. Сохрани порядок букв.');
    },
    digits(n){
      const tens=4+n%5,ones=1+n%3;
      return numerical('В двузначном числе '+tens+' десятков и '+ones+' единиц. На сколько это число больше числа с обратным порядком цифр?',9*(tens-ones),'Вычти из 10a+b число 10b+a. Какая разность получится?','Разложи каждое число по разрядам.');
    },
    ranking(n){
      const position=1+n%4,others=[1,2,3,4].filter(x=>x!==position);
      return numerical('Четыре участника заняли разные места с первого по четвёртое. Места трёх участников — '+others.join(', ')+'. Какое место у четвёртого?',position,'Вычти сумму названных мест из суммы первых четырёх натуральных чисел.','Сумма мест всех участников равна 10.');
    },
    clock(n){
      const minutes=5*(1+n%11);
      return numerical('На сколько градусов повернётся минутная стрелка за '+minutes+' мин? Используй полный оборот в 360°.',minutes*6,'Сколько градусов составляют '+minutes+' шестиградусных делений?', 'За 60 минут стрелка совершает полный оборот.');
    },
    triangle(n){
      const base=6+2*(n%9),height=3+n%7;
      return numerical('Высота треугольника равна '+height+' см, а основание — '+base+' см. Какова площадь в квадратных сантиметрах?',base*height/2,'Умножь основание на высоту и раздели результат на два.','В прямоугольнике с такими же сторонами поместились бы два равновеликих треугольника.');
    },
    midpoint(n){
      const side=6+2*(n%18);
      return numerical('В треугольнике соединили середины двух сторон. Третья сторона равна '+side+' см. Найди длину проведённого отрезка в сантиметрах.',side/2,'Какая длина равна половине третьей стороны?','Средняя линия треугольника параллельна третьей стороне и вдвое короче неё.');
    },
    overlap(n){
      const common=2+n%6,a=common+3+n%4,b=common+6,total=a+b-common;
      return numerical('В кружке '+total+' ребят. Все выбрали хотя бы одно из занятий. Шахматы выбрали '+a+', головоломки — '+b+'. Сколько выбрали оба?',common,'Сложи размеры двух групп и вычти число разных участников.','Участников обеих групп при сложении посчитали дважды.');
    },
    pattern(n){
      const start=3+n%8,delta=2+n%4;
      return numerical('Последовательность начинается числами '+[0,1,2,3].map(i=>start+i*delta).join(', ')+'. Разность соседних членов постоянна. Запиши следующее число.',start+4*delta,'Прибавь очередную постоянную разность к четвёртому члену.','Сначала вычти первое число из второго.');
    }
  };
  const mappings={
    'fraction-to-decimal':[341,389], 'fraction-reduce':[343,396],code:[347,390,422,444,469],
    'compound-growth':[348,411,412,425,448,462,463,464,466,467,472,480,481],equation:[349,394,423,424,426,487],
    overlap:[350], 'percent-change':[387,408,413,447,449,458],triangle:[388,401,402,419,420], 'decimal-divide':[391],
    'variable-value':[392,393,395,397,399,409,415,416,417,443,446,456,471],
    'logic-quantifiers':[398,400,418,470],mean:[403,494],midpoint:[404,452],
    'simple-growth':[406,427,428,429,432,433,434,435,436,437,438,439,440,441,442,450,453,454,455,468,479],
    'percent-part':[410,414,451], 'percent-ratio':[431,457],pattern:[445],clock:[460],ranking:[461],digits:[486]
  };
  const byNumber=new Map(Object.entries(mappings).flatMap(([key,list])=>list.map(n=>[n,key])));
  function seed(value){
    let result=2166136261;
    for(const ch of value)result=Math.imul(result^ch.charCodeAt(0),16777619);
    return result>>>0;
  }
  function family(number,part){
    if(part.skill)return part.skill;
    if(number===465)return part.id.endsWith('a')?'simple-growth':'compound-growth';
    return byNumber.get(number);
  }
  const chapterPractice=[[25,'logic-negation'],[70,'logic-quantifiers'],[119,'variable-value'],[175,'logic-quantifiers'],
    [220,'order-operations'],[256,'river-roundtrip'],[296,'mean'],[307,'order-operations'],[350,'percent-ratio']];
  function repeatNumberWork(number,part,attempt){
    const n=seed(part.id)%11+attempt,shift=n%7;
    const numeric=(prompt,answer,hint)=>({...numerical(prompt,answer,'Проверь свой вывод по правилу этого примера.',hint),mistake:hint});
    const select=(prompt,options,hint)=>{
      const answer=options[0],k=n%options.length,choices=options.slice(k).concat(options.slice(0,k));
      return {...choice(prompt,choices,answer,hint),mistake:hint};
    };
    if(number===7){
      if(part.id==='007-a'){
        const start=3+shift,add=1+n%3,row=[start];for(let i=0;i<4;i++)row.push(row.at(-1)*2+add);
        return numeric('Каждый раз удваивай предыдущее число и прибавляй '+add+'. Начало ряда: '+row.slice(0,4).join('; ')+'. Запиши следующее число.',row[4],'Удвой именно последний записанный член, а затем прибавь указанное число.');
      }
      if(part.id==='007-b'){
        const top=1+n%3,base=4+shift,increment=3+n%5,row=Array.from({length:4},(_,i)=>top*2**i+'/'+(base+increment*i));
        return numeric('В каждой дроби числитель удваивается, знаменатель возрастает на '+increment+'. Дано: '+row.slice(0,3).join('; ')+'. Какова следующая дробь?',row[3],'Смотри на несокращённые записи ряда: отдельно измени числитель, затем знаменатель.');
      }
      if(part.id==='007-v'){
        const whole=2+shift,first=1+n%5,row=Array.from({length:4},(_,i)=>whole+','+'0'.repeat(i+1)+(first+i));
        return numeric('Целая часть остаётся прежней. После запятой каждый раз добавляется ноль перед последней цифрой, а сама последняя цифра увеличивается на 1. Запиши следующий член: '+row.slice(0,3).join('; ')+'; …',row[3],'Проверь и число нулей, и последнюю цифру. Запятая стоит после той же целой части.');
      }
      const first=1+n%5,rows=Array.from({length:4},(_,i)=>Array.from({length:i+1},(_,j)=>first+j).join('')+' '+(first+i+1)+'/'+(first+i+2));
      return numeric('К целой части справа приписывают следующую цифру, а в дробной части числитель и знаменатель увеличивают на 1. Продолжи: '+rows.slice(0,3).join('; ')+'; …',rows[3],'Сравни целые части двух соседних записей и отдельно их дробные части.');
    }
    if(number===8){
      const whole=14+shift,ordinary=(2+n%4)+'/'+(9+n%5),mixed=(2+shift)+' 1/'+(3+n%4),decimal='0,'+(2+shift)+'5';
      const group='На карточках: 0; '+ordinary+'; '+whole+'; '+decimal+'; '+mixed+'; 1. ';
      const lists={
        '008-1-a':['Выбери все натуральные числа.',[whole+'; 1','0; '+whole+'; 1',whole+'; '+decimal],'Счёт предметов начинается с 1. Ноль и нецелые числа не подходят.'],
        '008-1-b':['Выбери все нецелые числа.',[ordinary+'; '+decimal+'; '+mixed,ordinary+'; '+decimal,'0; '+ordinary+'; '+decimal+'; '+mixed],'Проверь и смешанную запись: в ней есть ненулевая дробная часть.'],
        '008-2-a':['Какое из чисел записано обыкновенной дробью без целой части?', [ordinary,mixed,decimal],'Нужна запись с числителем и знаменателем без отдельного целого числа.'],
        '008-2-b':['Какое число записано как смешанное?', [mixed,ordinary,decimal],'Ищи отдельно написанную целую и правильную дробную части.'],
        '008-2-v':['Где число записано десятичной дробью?', [decimal,ordinary,mixed],'В десятичной записи целую и дробную части разделяет запятая.']
      };
      const [prompt,options,hint]=lists[part.id];return select(group+prompt,options,hint);
    }
    if(number===9){
      const digit=2+shift,zeros=2+n%4,place=n%(zeros+1),exponent=place,total=BigInt(digit)*(10n**BigInt(zeros+1)+10n**BigInt(exponent));
      return numeric('Составь числа из двух цифр '+digit+' и '+zeros+' нулей, используя все цифры. Если записать результаты по возрастанию, какое число будет на месте '+(place+1)+'?',String(total),'Первая цифра обязана быть ненулевой. Для получения наименьшего числа поставь вторую такую цифру в единицы, затем передвигай её влево.');
    }
    if(number===10){
      const amounts=[['два миллиона','триста четыре тысячи','семь',2304007],['три миллиона','двести одна тысяча','пятнадцать',3201015],['четыре миллиона','сто восемь тысяч','шестьдесят',4108060],['пять миллионов','четыреста две тысячи','девятнадцать',5402019],['восемь миллионов','пять тысяч','шесть',8005006]];
      const mixed=[['три целых и две седьмых','3 2/7'],['четыре целых и три восьмых','4 3/8'],['восемь целых и пять шестых','8 5/6'],['две целых и семь десятых','2 7/10']];
      const decimal=[['две целых и семнадцать стотысячных','2,00017'],['восемь целых и шесть стотысячных','8,00006'],['четыре целых и двадцать три стотысячных','4,00023'],['одна целая и девять стотысячных','1,00009']];
      if(part.id==='010-a'){const [a,b,c,answer]=amounts[n%amounts.length];return numeric('Запиши цифрами: '+a+' '+b+' '+c+'.',answer,'Размести миллионы, тысячи и единицы в трёх классах; в каждом младшем классе три цифры.');}
      const [words,num]=(part.id==='010-b'?mixed:decimal)[n%4];return numeric('Запиши цифрами: '+words+'.',num,part.id==='010-b'?'Отдели целое число пробелом, затем введи числитель и знаменатель.':'Стотысячные стоят в пятой позиции после запятой. Нули слева от названных долей необходимы.');
    }
    return null;
  }

  function createLegacy(number,part,attempt=0){
    if(number<1||number>497||part.kind==='expression')return null;
    const specific=family(number,part);
    const key=specific||chapterPractice.find(([end])=>number<=end)?.[1];
    if(!key)throw Error('Нет проверенной тренировки для № '+number+' / '+part.id);
    const value=seed(part.id+'|'+attempt);
    let model;
    if(families[key]) model=families[key](value);
    else model=G.generate(key,1+(value%3),value);
    return {...model,id:'analog-'+part.id+'-'+attempt,family:key,match:specific?'skill':'chapter'};
  }
  function create(number,part,attempt=0,savedWork){
    if(number<7||number>10)return createLegacy(number,part,attempt);
    if(savedWork?.signature){
      const legacy=createLegacy(number,part,attempt);
      if(savedWork.signature===E.signature(legacy))return legacy;
    }
    const model=repeatNumberWork(number,part,attempt);
    return {...model,id:'analog-'+part.id+'-'+attempt,family:'page7-'+part.id,match:'skill'};
  }
  const states=new Map();
  function record(part){
    const key='mathexam.peterson6.analogue.v1.'+part.id;
    if(!states.has(key)){
      let raw=null,blocked=false;
      if(!document.body.dataset.petersonBoard)try{raw=JSON.parse(localStorage.getItem(key)||'null');}catch(_){blocked=true;}
      const attempt=Number.isSafeInteger(raw?.attempt)&&raw.attempt>=0&&raw.attempt<100000?raw.attempt:0;
      states.set(key,{attempt,raw:raw?.work,earlier:raw?.earlier,blocked});
    }
    return [key,states.get(key)];
  }
  function panel(item,part){
    const initial=create(item.number,part);
    if(!initial)return '';
    const [key,row]=record(part),model=create(item.number,part,row.attempt,row.work||row.raw);
    const work=row.work||E.sanitize(model,row.raw);row.work=work;if(document.body.dataset.petersonBoard)E.assist(work);
    function save(){
      if(document.body.dataset.petersonBoard||row.blocked)return;
      try{localStorage.setItem(key,JSON.stringify({attempt:row.attempt,work:row.work,...(row.earlier?{earlier:row.earlier}:{})}));}catch(_){row.blocked=true;}
    }
    const box=document.createElement('details');box.className='help-box equivalent-exercise';
    const option=v=>'<option value="'+U.esc(v)+'"'+(v===work.draft?' selected':'')+'>'+U.esc(v)+'</option>';
    const field=model.kind==='choice'?'<select aria-label="Ответ к авторскому примеру"><option value="">Выбери ответ</option>'+model.choices.map(option).join('')+'</select>':'<input aria-label="Ответ к авторскому примеру" value="'+U.esc(work.draft)+'" maxlength="120">';
    const steps=E.steps(model);
    box.innerHTML='<summary>'+ (model.match==='chapter'?'Разминка по теме без учебника':'Авторский пример без учебника')+'</summary><p>Новое условие для тренировки. Решение этого примера учитывается отдельно от номера учебника.</p><p class="problem">'+U.fmt(model.prompt)+'</p>'+(model.expression?'<div class="math-line">'+U.expression(model.expression)+'</div>':'')+U.diagram(model.diagram)+'<form class="analogue-form">'+field+' <button>Проверить пример</button></form><p role="status"></p><details><summary>Подсказка к примеру</summary><p>'+U.fmt(steps[0]?.hint||steps[0]?.prompt||'Сопоставь данные с величиной, которую нужно найти.')+'</p></details><button type="button" class="text-button">Другой пример</button>';
    if(!document.body.dataset.petersonBoard&&item.number>=7&&item.number<=10&&Number.isInteger(row.earlier?.attempt)&&row.earlier.attempt>=0&&row.earlier.attempt<=99999){
      const previous=createLegacy(item.number,part,row.earlier.attempt);
      if(row.earlier.work?.signature===E.signature(previous)){
        const old=E.sanitize(previous,row.earlier.work),saved=document.createElement('details');
        saved.className='earlier-practice';
        saved.innerHTML='<summary>Моя прежняя разминка по теме</summary><p>'+U.fmt(previous.prompt)+'</p><p>Ответ: '+U.esc(old.draft||'пока не записан')+'</p><p>'+U.esc(U.status(old))+'</p>'+(old.note?'<p>'+U.esc(old.note)+'</p>':'');
        box.append(saved);
      }
    }
    const form=box.querySelector('form'),input=form.querySelector('input,select'),status=box.querySelector('[role=status]');
    status.textContent=document.body.dataset.petersonBoard&&row.status?row.status:work.correct?U.status(work)+'.':'';
    input.addEventListener('input',()=>{work.draft=input.value;work.correct=false;work.independent=false;save();});
    form.addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();
      if(!input.value.trim()||(model.kind!=='choice'&&!E.M.parse(input.value))){status.textContent='Введи число или выбери ответ.';return;}
      const result=E.submit(model,work,input.value);
      status.textContent=result.ok?U.status(work)+'.':model.mistake||'Попробуй ещё раз. Можно открыть подсказку к примеру.';
      save();
    });
    box.querySelector('details').addEventListener('toggle',event=>{if(event.target.open){E.assist(work);save();}});
    box.querySelector('button[type=button]').onclick=()=>{
      if(row.attempt>=99999)return;
      if(!document.body.dataset.petersonBoard&&item.number>=7&&item.number<=10&&model.match==='chapter')row.earlier={attempt:row.attempt,work:E.sanitize(model,work)};
      row.status='';row.hint=false;row.open=true;row.attempt++;row.work=E.blank(create(item.number,part,row.attempt));save();
      const next=panel(item,part);next.open=true;box.replaceWith(next);
    };
    if(document.body.dataset.petersonBoard){box.open=row.open===true;box.querySelector('details').open=row.hint===true;}
    return box;
  }
  function shared(item,part,raw) {
    const model=part&&create(item.number,part);
    if(!model)return null;
    const active=document.querySelector('.equivalent-exercise');
    const row=record(part)[1];
    if(!raw) return {attempt:row.attempt,work:root.PetersonVolumeBoard.work(create(item.number,part,row.attempt,row.work||row.raw),row.work||row.raw),
      open:!!active?.open,hint:!!active?.querySelector('details')?.open,status:root.PetersonVolumeBoard.safeText(active?.querySelector('[role=status]')?.textContent,600)};
    if(!Number.isInteger(raw.attempt)||raw.attempt<0||raw.attempt>99999)throw TypeError('Некорректный вариант');
    return {attempt:raw.attempt,work:root.PetersonVolumeBoard.work(create(item.number,part,raw.attempt,raw.work),raw.work),open:raw.open===true,hint:raw.hint===true,status:root.PetersonVolumeBoard.safeText(raw.status,600)};
  }
  function restoreShared(part,scene) {
    if(!scene||!document.body.dataset.petersonBoard)return;
    const row=record(part)[1];Object.assign(row,{attempt:scene.attempt,work:scene.work,status:scene.status,open:scene.open,hint:scene.hint});
  }
  function resetShared(){if(document.body.dataset.petersonBoard)states.clear();}
  root.PetersonAnalogues={create,panel,shared,restoreShared,resetShared};
})(globalThis);
