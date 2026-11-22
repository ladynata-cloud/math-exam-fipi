/* Виленкин и соавторы. 5 класс, часть 2, §27, печатная с. 23, №5.113–5.116. */
(function(root){
  'use strict';
  const units=[
    ['неделя','суток',7,'Сутки','7 суток составляют неделю.'],
    ['час','минут',60,'Минута','В часе 60 минут.'],
    ['метр','миллиметров',1000,'Миллиметр','В метре 10 дм, 100 см или 1000 мм.'],
    ['литр','кубических миллиметров',1000000,'Кубический миллиметр','Литр — это кубический дециметр. В каждом из трёх направлений помещается по 100 миллиметров.'],
    ['високосный год','суток',366,'Сутки','В феврале високосного года 29 дней. В году 366 суток.'],
    ['ар','квадратных метров',100,'Квадратный метр','Квадрат со стороной 10 м имеет площадь 100 м². Это один ар.']
  ];
  const lessons=[
    [113,'Доли единиц времени, длины, площади и объёма','Вырази целое и его часть в одних единицах. Для куба считай маленькие кубики по длине, по ширине и по высоте.','Один сантиметр от дециметра — 1/10. Один квадратный сантиметр от квадратного дециметра — 1/100.','Если ребро стало в десять раз меньше, объём кубика тоже стал в десять раз меньше.'],
    [114,'Какая доля бассейна заполнена?','Представь всю ёмкость как один целый бак. В числитель поставь, сколько налили. В знаменатель — сколько вмещается всего.','Если в бак на 60 л налили 15 л, доля воды равна 15/60 = 1/4.','Число литров и доля объёма всегда записываются одним числом.'],
    [115,'Сторона квадрата как часть периметра','Обведи весь контур и пересчитай его равные стороны. Затем отдельно сосчитай стороны в выделенной части.','Пять равных отрезков обводят границу правильного пятиугольника. Один отрезок даёт 1/5 всего периметра.','Доля стороны в периметре зависит от того, сколько сантиметров в стороне квадрата.'],
    [116,'Пять минут на самостоятельную работу','Возьми за целое длительность своего урока. Сравни занятую часть с этим целым в одинаковых единицах времени.','Если из 40 минут на разминку отвели 8 минут, то она заняла 8/40 = 1/5 урока.','Для выражения части урока в знаменателе всегда должно стоять 60.']
  ].map(([n,title,explanation,worked,misconception])=>({number:'5.'+n,key:'printed-5-'+n,part:2,point:27,page:23,title,explanation,worked:[worked],misconception,requires:['v5f-printed-5-'+(n===113?98:n-1)],related:[],reflect:'Что в этом вопросе принято за целое?'}));
  const fraction=(step,prompt,a,b,why,extra=[])=>({...step(prompt,a+'/'+b,why,[
    {value:b+'/'+a,text:'В ответе доля, которая меньше или равна одному. Проверь местами часть и целое.'},...extra
  ]),answerFormat:'v5-unit-fraction'});
  function pack(qs,data,key){const final=qs.pop();return {...final,steps:qs,inputPrompt:'Ответ',data:{everydayFractions:data},conditionKey:key};}
  function measure(seed,r,step){
    const counts=units.map((u,i)=>seed?r(2,Math.min(9,u[2]-1)):1);
    const qs=units.map(([whole,small,n,one,why],i)=>{
      const v=counts[i],prompt=(i+1)+'. Целое — '+whole+'. Какую долю составляет указанная часть? '+(v===1?one+'.':'Число малых единиц ('+small+'): '+v+'.');
      return fraction(step,prompt,v,n,why,i===3?[{value:v+'/100',text:'Число 100 относится к одному ребру. Сколько маленьких кубиков помещается по трём направлениям?'}]:[]);
    });
    qs.push(step('Сколько кубиков с ребром 1 см заполняют куб с ребром 1 дм? Посчитай слои.',1000,'В одном слое 10 · 10 кубиков. Сколько таких слоёв по высоте?',[{value:100,text:'Это один слой. По высоте помещаются десять таких же слоёв.'}]));
    qs.push(fraction(step,'Какую долю литра занимает такой кубик? Запиши дробью и объясни, почему этот объём называют миллилитром.',1,1000,'В литре 1000 миллилитров и 1000 кубических сантиметров. В обоих случаях это одна тысячная литра.'));
    return pack(qs,{kind:'units',counts},'units113/'+counts.join('/'));
  }
  function water(seed,r,step){
    const slots=seed?r(5,10):5,size=seed?10*r(3,16):100,total=slots*size;
    const indices=seed?Array.from({length:4},(_,i)=>i+1+r(0,slots-5)):[1,2,3,4],volumes=indices.map(k=>k*size);
    const qs=volumes.map((v,i)=>fraction(step,'абвг'[i]+'. Полный бассейн вмещает '+total+' л. Сейчас в нём '+v+' л воды. Какую долю объёма это занимает?',v,total,'Раздели объём налитой воды на вместимость. Допустима любая равная дробь.',[{value:(total-v)+'/'+total,text:'Такую долю занимает свободное место. Нужна доля воды.'}]));
    return pack(qs,{kind:'water',slots,size,volumes},'pool114/'+total+'/'+volumes.join('/'));
  }
  function perimeter(seed,r,step){
    const sides=seed?r(5,8):4,side=seed?r(2,14):1,names={4:'квадрата',5:'правильного пятиугольника',6:'правильного шестиугольника',7:'правильного семиугольника',8:'правильного восьмиугольника'};
    const qs=[1,2,3].map(k=>fraction(step,'Какую часть периметра '+names[sides]+' составляет '+['','одна сторона','сумма длин двух сторон','сумма длин трёх сторон'][k]+'?',k,sides,'Все стороны этой фигуры равны. Весь периметр содержит '+sides+' равных сторон.'));
    return pack(qs,{kind:'perimeter',sides,side},'perimeter115/'+sides+'/'+side);
  }
  function time(seed,r,step){
    const total=seed?[35,40,45,50][r(0,3)]:45,part=seed?r(2,Math.floor(total/2)):5;
    const qs=[step('Сколько минут принять за целое, если урок длится '+total+' мин, а самостоятельная работа — '+part+' мин?',total,'За целое принимаем весь урок.',[{value:60,text:'Час содержит 60 минут. Сейчас целое — один конкретный урок.'}]),fraction(step,'Какую часть урока заняли '+part+' мин самостоятельной работы при общей длительности '+total+' мин?',part,total,'Сравни минуты с минутами: время работы раздели на время урока.',[{value:part+'/60',text:'Ты нашёл долю часа. Урок здесь длится '+total+' минут.'}])];
    return pack(qs,{kind:'time',total,part},'time116/'+total+'/'+part);
  }
  const svg=(title,body)=>'<svg viewBox="0 0 282 118" style="display:block;width:100%;max-width:360px" role="img" aria-label="'+title+'">'+body+'</svg>';
  function bars(total,part,water){
    const w=204,h=58,left=32,top=21,filled=water?h*part/total:w*part/total;
    const block=water?'<rect x="'+left+'" y="'+(top+h-filled)+'" width="'+w+'" height="'+filled+'" fill="#73b6cb"/>':'<rect x="'+left+'" y="'+top+'" width="'+filled+'" height="'+h+'" fill="#83b7a1"/>';
    return svg(water?'Вода в бассейне':'Время работы в пределах урока',block+'<rect x="'+left+'" y="'+top+'" width="'+w+'" height="'+h+'" fill="none" stroke="#34584e" stroke-width="2"/><text x="'+left+'" y="105" style="font:14px system-ui,sans-serif">'+part+' из '+total+(water?' л':' мин')+'</text>');
  }
  function polygon(n,k){
    const pt=i=>[(140+45*Math.sin(2*Math.PI*i/n)).toFixed(2),(56-45*Math.cos(2*Math.PI*i/n)).toFixed(2)].join(',');
    return svg('Выделенные стороны: '+k+' из '+n,'<polygon points="'+Array.from({length:n},(_,i)=>pt(i)).join(' ')+'" fill="#e9f1ed" stroke="#3e6557" stroke-width="2.5"/><polyline points="'+Array.from({length:k+1},(_,i)=>pt(i)).join(' ')+'" fill="none" stroke="#994a23" stroke-width="5" stroke-linejoin="round"/>');
  }
  function volumeGrid(unit){
    const n=unit==='см'?10:100,x=90,y=37,w=57,h=49,dx=23,dy=15;
    let lines='';
    // На каждой грани показаны десять полос. При миллиметровой шкале полоса объединяет десять клеток.
    for(let i=1;i<10;i++){const u=i/10;lines+='<path d="M'+(x+w*u)+' '+y+'v'+h+'M'+x+' '+(y+h*u)+'h'+w+'M'+(x+w*u)+' '+y+'l'+dx+' '+(-dy)+'" stroke="#7ca596" stroke-width=".6"/>';}
    return svg('Куб: '+n+' малых рёбер вдоль каждого направления','<path d="M90 37h57v49H90zM90 37l23-15h57l-23 15zM147 37l23-15v49l-23 15z" fill="#dceee7" stroke="#34594e" stroke-width="1.5"/>'+lines+'<text x="126" y="108" text-anchor="middle" style="font:14px system-ui,sans-serif">'+n+' '+unit+' вдоль ребра</text>');
  }
  function conversion(i){const d=units[i];return (i===3?volumeGrid('мм'):'')+'<p><strong>'+d[0]+'</strong></p><p>'+d[4]+'</p>';}
  function view(d,i){if(d.kind==='units')return conversion(Math.min(i,5));if(d.kind==='water')return bars(d.slots*d.size,d.volumes[i],true);if(d.kind==='perimeter')return polygon(d.sides,i+1);return bars(d.total,d.part,false);}
  function draw(t,s){const d=t.data.everydayFractions,i=s?.mode==='learn'?s.step:t.steps.length;
    const content=d.kind!=='units'?view(d,i):i>=6?volumeGrid('см'):i===3?volumeGrid('мм'):'<p>Целое: '+units[i][0]+'. Шкала для подсчёта: '+units[i][1]+'.</p>';
    return '<figure style="margin:.4em 0"><figcaption>'+({units:'Проверь единицы',water:'Заполнение бассейна',perimeter:'Обойди границу фигуры',time:'Шкала одного урока'})[d.kind]+'</figcaption>'+content+'</figure>';}
  function explore(t,s){
    const d=t.data.everydayFractions,k=s.item;let title,controls,visual,question,answer,why;
    if(d.kind==='units'){const u=units[k];title='Выбери целое';controls=[{key:'item',title:'Единица',values:units.map((u,i)=>[i,u[0]])}];visual=conversion(k);question='Сколько малых единиц содержится в целом? Ответ дай числом.';answer=u[2];why=u[4];}
    else if(d.kind==='water'){const total=d.slots*d.size;title='Налей несколько мерок';controls=[{key:'item',title:'Количество мерок',values:[0,1,2,3,4].map(n=>[n,String(n)])}];visual=bars(total,k*d.size,true);question='Сколько литров осталось долить до полного бассейна?';answer=total-k*d.size;why='Вычти налитую часть из вместимости.';}
    else if(d.kind==='perimeter'){title='Обведи часть периметра';controls=[{key:'item',title:'Сторон выделить',values:[[0,'Одна'],[1,'Две'],[2,'Три']]}];visual=polygon(d.sides,k+1)+'<p>Длина каждой стороны — '+d.side+' см.</p>';question='Какова длина выделенной линии в сантиметрах?';answer=(k+1)*d.side;why='Сложи длины выделенных сторон.';}
    else {const minutes=[d.part,Math.min(d.total-1,d.part+5),Math.max(0,d.part-2)][k];title='Передвинь границу работы';controls=[{key:'item',title:'Расписание',values:[[0,'Из задания'],[1,'На 5 минут дольше'],[2,'На 2 минуты короче']]}];visual=bars(d.total,minutes,false);question='Сколько минут урока осталось на другую работу?';answer=d.total-minutes;why='Сложение занятого и оставшегося времени должно дать продолжительность урока.';}
    return {title,controls,visual,question,answer,why};
  }
  const api={lessons,generators:{'5.113':measure,'5.114':water,'5.115':perimeter,'5.116':time},bounds:{'5.113':{item:[0,5,0]},'5.114':{item:[0,4,0]},'5.115':{item:[0,2,0]},'5.116':{item:[0,2,0]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5UnitWaterAndPerimeter=api;
})(typeof window!=='undefined'?window:globalThis);
