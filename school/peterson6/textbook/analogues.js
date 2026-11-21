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
  function create(number,part,attempt=0){
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
  const states=new Map();
  function record(part){
    const key='mathexam.peterson6.analogue.v1.'+part.id;
    if(!states.has(key)){
      let raw=null,blocked=false;
      if(!document.body.dataset.petersonBoard)try{raw=JSON.parse(localStorage.getItem(key)||'null');}catch(_){blocked=true;}
      const attempt=Number.isSafeInteger(raw?.attempt)&&raw.attempt>=0&&raw.attempt<100000?raw.attempt:0;
      states.set(key,{attempt,raw:raw?.work,blocked});
    }
    return [key,states.get(key)];
  }
  function panel(item,part){
    const initial=create(item.number,part);
    if(!initial)return '';
    const [key,row]=record(part),model=row.attempt?create(item.number,part,row.attempt):initial;
    const work=row.work||E.sanitize(model,row.raw);row.work=work;if(document.body.dataset.petersonBoard)E.assist(work);
    function save(){
      if(document.body.dataset.petersonBoard||row.blocked)return;
      try{localStorage.setItem(key,JSON.stringify({attempt:row.attempt,work:row.work}));}catch(_){row.blocked=true;}
    }
    const box=document.createElement('details');box.className='help-box equivalent-exercise';
    const option=v=>'<option value="'+U.esc(v)+'"'+(v===work.draft?' selected':'')+'>'+U.esc(v)+'</option>';
    const field=model.kind==='choice'?'<select aria-label="Ответ к авторскому примеру"><option value="">Выбери ответ</option>'+model.choices.map(option).join('')+'</select>':'<input aria-label="Ответ к авторскому примеру" value="'+U.esc(work.draft)+'" maxlength="120">';
    const steps=E.steps(model);
    box.innerHTML='<summary>'+ (model.match==='chapter'?'Разминка по теме без учебника':'Авторский пример без учебника')+'</summary><p>Новое условие для тренировки. Решение этого примера учитывается отдельно от номера учебника.</p><p class="problem">'+U.fmt(model.prompt)+'</p>'+(model.expression?'<div class="math-line">'+U.expression(model.expression)+'</div>':'')+U.diagram(model.diagram)+'<form class="analogue-form">'+field+' <button>Проверить пример</button></form><p role="status"></p><details><summary>Подсказка к примеру</summary><p>'+U.fmt(steps[0]?.hint||steps[0]?.prompt||'Сопоставь данные с величиной, которую нужно найти.')+'</p></details><button type="button" class="text-button">Другой пример</button>';
    const form=box.querySelector('form'),input=form.querySelector('input,select'),status=box.querySelector('[role=status]');
    status.textContent=document.body.dataset.petersonBoard&&row.status?row.status:work.correct?U.status(work)+'.':'';
    input.addEventListener('input',()=>{work.draft=input.value;work.correct=false;work.independent=false;save();});
    form.addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();
      if(!input.value.trim()||(model.kind!=='choice'&&!E.M.parse(input.value))){status.textContent='Введи число или выбери ответ.';return;}
      const result=E.submit(model,work,input.value);
      status.textContent=result.ok?U.status(work)+'.':'Попробуй ещё раз. Можно открыть подсказку к примеру.';
      save();
    });
    box.querySelector('details').addEventListener('toggle',event=>{if(event.target.open){E.assist(work);save();}});
    box.querySelector('button[type=button]').onclick=()=>{
      if(row.attempt>=99999)return;
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
    if(!raw) return {attempt:row.attempt,work:root.PetersonVolumeBoard.work(create(item.number,part,row.attempt),row.work),
      open:!!active?.open,hint:!!active?.querySelector('details')?.open,status:root.PetersonVolumeBoard.safeText(active?.querySelector('[role=status]')?.textContent,600)};
    if(!Number.isInteger(raw.attempt)||raw.attempt<0||raw.attempt>99999)throw TypeError('Некорректный вариант');
    return {attempt:raw.attempt,work:root.PetersonVolumeBoard.work(create(item.number,part,raw.attempt),raw.work),open:raw.open===true,hint:raw.hint===true,status:root.PetersonVolumeBoard.safeText(raw.status,600)};
  }
  function restoreShared(part,scene) {
    if(!scene||!document.body.dataset.petersonBoard)return;
    const row=record(part)[1];Object.assign(row,{attempt:scene.attempt,work:scene.work,status:scene.status,open:scene.open,hint:scene.hint});
  }
  function resetShared(){if(document.body.dataset.petersonBoard)states.clear();}
  root.PetersonAnalogues={create,panel,shared,restoreShared,resetShared};
})(globalThis);
