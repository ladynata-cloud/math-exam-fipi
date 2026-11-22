/* Виленкин и соавторы, часть 2, §26, печатная с. 18. */
(function(root) {
  'use strict';
  const math=()=>typeof module!=='undefined'&&module.exports?require('./math.js'):root.WorkshopMath;
  const common={part:2,point:26,page:18};
  const lessons=[
    {...common,number:'5.90',key:'printed-5-90',title:'Измерь диаметр и две хорды',requires:['v5f-printed-5-75'],related:['v5f-printed-5-70'],
      explanation:'Поставь иглу циркуля в центр и проведи окружность. Проведи отрезок через центр от одного края окружности до другого. Отметь третью точку на окружности и соедини её с концами диаметра. Сравни три отрезка с помощью линейки.',
      worked:['Если радиус 3 см, диаметр равен 6 см. Перемещая третью точку, можно менять длины двух боковых отрезков. Диаметр сохраняет длину.'],
      misconception:'При перемещении третьей точки меняется длина диаметра.',reflect:'Как бы ты проверил линейкой, что проведённый отрезок — именно диаметр?'},
    {...common,number:'5.91',key:'printed-5-91',title:'Какую долю площади или объёма занимает одна маленькая единица?',requires:['v5f-printed-5-36'],related:['v5f-printed-5-84'],
      explanation:'Заполни один ряд маленькими единицами длины. Для квадрата нужны такие же ряды, для куба — ещё и слои. Доля одной клетки или одного кубика равна единице, делённой на их общее число.',
      worked:['В стороне 1 см десять миллиметров. В квадрате 1 см² помещаются сто квадратных миллиметров. Один квадратный миллиметр занимает 1/100 этого квадрата.'],
      misconception:'У долей площади и объёма одинаковые знаменатели, если единицы длины одни и те же.',reflect:'Почему у куба в знаменателе появляется ещё один множитель?'}
  ];
  const names=['NB','NK','KB'];
  // The selectable locations stay away from both ends. Rounding a measured length to millimetres is unambiguous.
  const angles=[38,62,90,118,142,218,242,270,298,322];
  function points(radius,position) {
    const a=angles[position]*Math.PI/180;
    return [[-radius,0],[radius,0],[radius*Math.cos(a),radius*Math.sin(a)]];
  }
  function measurement(radius,position,which) {
    const [n,b,k]=points(radius,position), pair=[[n,b],[n,k],[k,b]][which];
    return 10*Math.hypot(pair[0][0]-pair[1][0],pair[0][1]-pair[1][1]);
  }
  function circle(seed,r,step) {
    const radius=seed?r(2,6):4,position=seed?r(0,9):1, lengths=names.map((_,i)=>Math.round(measurement(radius,position,i)));
    const intro='Радиус окружности '+radius+' см. NB — диаметр. Точка K отмечена на окружности. Сравни три отрезка.';
    const steps=names.map((name,i)=>step((i===0?intro+' ':'')+'Отмерь '+name+' на рисунке задания. Сколько это миллиметров? Округли до ближайшего целого миллиметра.',lengths[i],
      i===0?'Диаметр соединяет две точки окружности через центр; он равен двум радиусам.':'Совмести ноль линейки с первым концом и прочитай отметку у второго конца.',
      i===0?[{value:radius*10,text:'Получилась длина от центра до края. У диаметра две такие половины.'}]:[{value:lengths[0],text:'Это длина диаметра NB. Найди на линейке конец выделенной хорды '+name+'.'}]));
    return {steps,prompt:intro+' Как называется самый длинный отрезок?',answer:'NB',answerFormat:'v5-radius-name',inputPrompt:'Две буквы самого длинного отрезка',
      why:'NB проходит через центр и является самой длинной хордой. В тетради можно поставить K в другой точке, отличной от N и B: другие длины изменятся.',
      errors:['NK','KB'].map(value=>({value,text:'Проверь, через какой из трёх отрезков проходит центр окружности.'})),
      data:{chordStudy:{radius,position}},conditionKey:'chord-measure/'+radius+'/'+position};
  }
  const units=[['дм','мм',100],['км','м',1000],['м','см',100],['дм','см',10],['см','мм',10],['м','мм',1000]];
  function fractionalUnits(seed,r,step) {
    const a=seed?r(0,5):0,b=seed?(a+r(1,5))%6:1,pairs=[a,b];
    const rows=[0,1,2,3].map((i)=>{
      const [large,small,count]=units[pairs[Math.floor(i/2)]], dimension=2+i%2, symbol=dimension===2?'²':'³';
      const denominator=count**dimension;
      return step('абвг'[i]+'. Какую часть 1 '+large+symbol+' составляет 1 '+small+symbol+'? Запиши долю.',
        math().q(1,denominator),'Вдоль каждого ребра помещается '+count+' малых единиц. Перемножь '+dimension+' одинаковых множителя. Вся большая единица — целое.',
        [{value:math().q(1,count),text:'Посчитана доля по одному ребру. Теперь учти число рядов'+(dimension===3?' и число слоёв.':'.')},
         {value:denominator,text:'Это количество маленьких единиц в большой. Вопрос о доле одной из них: поставь единицу в числитель.'}]);
    });
    return {...rows[3],steps:rows.slice(0,3),data:{measurePairs:pairs},conditionKey:'measure-powers/'+pairs.join('/')};
  }
  function line(a,b,color,thickness=2) {
    return '<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="'+color+'" stroke-width="'+thickness+'" fill="none"/>';
  }
  function figure(body,caption) {
    return '<figure style="margin:.5em 0"><svg viewBox="0 0 278 198" style="display:block;width:100%;max-width:380px" role="img" aria-label="'+caption+'">'+body+'</svg><figcaption>'+caption+'</figcaption></figure>';
  }
  function chordPicture(radius,position,which) {
    const coordinates=points(1,position), point=([x,y])=>[128+55*x,75-55*y], [n,b,k]=coordinates.map(point);
    let ink='<circle cx="128" cy="75" r="55" fill="#f3f6ef" stroke="#426a68" stroke-width="2"/>';
    [[n,b],[n,k],[k,b]].forEach(([left,right],i)=>ink+=line(left,right,i===which?'#9d4029':'#466d73',i===which?3.3:1.6));
    for(const [i,[x,y]] of [n,b,k,[128,75]].entries()) {
      const [dx,dy]=i===0?[-15,5]:i===1?[9,5]:i===2?[k[0]>=128?7:-13,k[1]<75?-5:14]:[-3,16];
      ink+='<circle cx="'+x+'" cy="'+y+'" r="2.5" fill="#213846"/><text x="'+(x+dx)+'" y="'+(y+dy)+'" font-size="13" font-weight="600" fill="#1c3441">'+'NBKO'[i]+'</text>';
    }
    const mm=2*radius*10,unit=220/mm,x0=25,end=x0+measurement(radius,position,which)*unit;
    ink+='<rect x="20" y="155" width="232" height="34" rx="3" fill="#fff2cf" stroke="#705d42"/>';
    for(let m=0;m<=mm;m++){
      const x=x0+m*unit;ink+=line([x,155],[x,m%10===0?169:m%5===0?165:161],'#4a4539',.9);
      if(m%10===0)ink+='<text x="'+x+'" y="183" text-anchor="middle" font-size="11">'+m/10+'</text>';
    }
    ink+=line([x0,149],[end,149],'#9d4029',2.8)+line([end,145],[end,158],'#9d4029',2);
    return figure(ink,'Отрезок '+names[which]+' перенесён к нулю линейки. Цифры — сантиметры, мелкие деления — миллиметры.');
  }
  function unitPicture(index,dim) {
    const [large,small,count]=units[index],a=[76,58],b=[161,58],c=[161,143],d=[76,143],e=[104,38],f=[189,38],g=[189,123];
    let ink='<path d="M76 58h85v85H76Z" fill="#d1e4db" stroke="#34585a" stroke-width="2"/>';
    for(let i=1;i<10;i++){const p=8.5*i;ink+=line([76+p,58],[76+p,143],'#839991',.7)+line([76,58+p],[161,58+p],'#839991',.7);}
    if(dim===3){ink+='<path d="M76 58l28-20h85l-28 20ZM161 58l28-20v85l-28 20Z" fill="#accbbd" stroke="#34585a" stroke-width="1.4"/>';
      for(let i=1;i<10;i++){const p=8.5*i;ink+=line([76+p,58],[104+p,38],'#78968b',.8)+line([161,58+p],[189,38+p],'#78968b',.8);}}
    ink+=line(d,c,'#944429',3)+line(a,d,'#944429',3);if(dim===3)ink+=line(a,e,'#944429',3);
    const suffix=dim===2?'²':'³';
    return figure(ink,'Одна большая единица — 1 '+large+suffix+'. На каждом ребре '+count+' '+small+'. Сетка показывает направления счёта; число мелких делений на рисунке условное.');
  }
  function draw(t,s) {
    const learn=s?.mode==='learn',step=learn?s.step:t.steps.length;
    if(t.data.chordStudy){const p=t.data.chordStudy;return chordPicture(p.radius,p.position,step<3?step:0);}
    return unitPicture(t.data.measurePairs[Math.floor(step/2)],2+step%2);
  }
  function explore(t,s) {
    if(t.data.chordStudy) {
      const radius=t.data.chordStudy.radius, pos=s.place;
      return {title:'Выбери свою точку K',controls:[
        {key:'place',title:'Где поставить точку K',values:angles.map((_,i)=>[i,(i<5?'Верхняя дуга':'Нижняя дуга')+' · '+(i%5+1)])},
        {key:'edge',title:'Какой отрезок измерить',values:names.map((name,i)=>[i,name])}],
        visual:chordPicture(radius,pos,s.edge),question:'Сколько миллиметров в выбранном отрезке? Округли до ближайшего миллиметра.',
        answer:Math.round(measurement(radius,pos,s.edge)),why:'Начало отрезка совпадает с нулём линейки. Считай мелкие деления до отметки конца.'};
    }
    const index=t.data.measurePairs[s.pair],dim=s.shape?3:2, [large,small,count]=units[index],symbol=dim===2?'²':'³';
    return {title:'От ряда к слою и кубу',controls:[{key:'pair',title:'Единицы длины',values:t.data.measurePairs.map((n,i)=>[i,units[n][0]+' и '+units[n][1]])},
      {key:'shape',title:'Что измеряем',values:[[0,'Площадь'],[1,'Объём']]}],
      visual:unitPicture(index,dim),question:'Сколько единиц по 1 '+small+symbol+' входит в 1 '+large+symbol+'?',answer:count**dim,
      why:'Вдоль каждого из '+dim+' измерений укладывается '+count+' малых единиц длины.'};
  }
  const api={lessons,generators:{'5.90':circle,'5.91':fractionalUnits},bounds:{'5.90':{place:[0,9,1],edge:[0,2,0]},'5.91':{pair:[0,1,0],shape:[0,1,0]}},draw,explore,measurement};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ChordAndUnits=api;
})(typeof window!=='undefined'?window:globalThis);
