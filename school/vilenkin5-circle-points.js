/* Original figure for §25, Vilenkin grade 5, part 2 (2023), printed page 7. */
(function (root) {
  'use strict';
  const lesson = {
    number:'5.1', key:'printed-5-1', title:'Какие точки принадлежат кругу, дуге и радиусу?',
    part:2, point:25, page:7, requires:['v5f-circle-shapes'], related:['v5f-circle-radius'],
    explanation:'Окружность — линия. Круг включает эту линию и всю область внутри. Чтобы проверить точку на радиусе, проследи сам отрезок от центра до его конца.',
    worked:['Представь круглый циферблат. Метка у цифры 12 лежит на краю, ось стрелок — в центре.',
      'Обе метки принадлежат кругу. Только верхняя метка принадлежит окружности.',
      'От оси до верхней метки идёт радиус. Обе его крайние точки принадлежат отрезку.'],
    misconception:'Центр принадлежит окружности.', reflect:'Как одним движением карандаша показать окружность? А как закрасить весь круг?'
  };
  const groups = ['Окружность','Весь круг','Вне круга','Короткая дуга','Длинная дуга','Радиус'];
  // Boundary positions lie exactly on one circle; the inner radial point is a multiple of its end vector.
  function figure(seed,random) {
    const names = ['B','D','L','E','A','M','K','F'];
    if(seed)for(let i=names.length-1;i>0;i--){const j=random(0,i);[names[i],names[j]]=[names[j],names[i]];}
    const [start,middle,end,along,inside,other,far,outer]=names;
    const otherOutside=seed!==0&&random(0,1)===1;
    const middleShort=seed!==0&&random(0,1)===1;
    const points=[
      [start,0,-70,5,-7],[middle,middleShort?-56:56,-42,middleShort?-18:7,-5],
      [end,-42,56,-16,14],[along,-21,28,7,8],['O',0,0,6,-7],
      [inside,-35,-17,-12,-9],[other,otherOutside?82:34,16,6,13],
      [far,-83,-58,-11,-7],[outer,-86,49,-12,13]
    ];
    const ring=[start,middle,end], short=middleShort?[start,middle,end]:[start,end];
    const long=middleShort?[start,end]:[start,middle,end];
    const radius=['O',along,end], internal=['O',along,inside,...(otherOutside?[]:[other])];
    const external=[far,outer,...(otherOutside?[other]:[])];
    return {points,start,end,ring,short,long,radius,internal,external,disk:[...ring,...internal]};
  }
  function diagram(f,highlight=-1) {
    const stroke='#204760',accent='#a23c16';
    const shortArc='M 0 -70 A 70 70 0 0 0 -42 56';
    const longArc='M 0 -70 A 70 70 0 1 1 -42 56';
    const edge=highlight===0?accent:stroke;
    const extra=highlight===3||highlight===4?'<path d="'+(highlight===3?shortArc:longArc)+'" fill="none" stroke="'+accent+'" stroke-width="5"/>':'';
    const position=f.points.map(([name,x,y])=>name+' ('+x+'; '+(-y)+')').join(', ');
    const dots=f.points.map(([name,x,y,dx,dy])=>'<g><circle cx="'+x+'" cy="'+y+'" r="2.9" fill="#162b3a"/><text x="'+(x+dx)+'" y="'+(y+dy)+'" font-size="13" font-family="sans-serif" font-weight="bold" fill="#162b3a">'+name+'</text></g>').join('');
    return '<svg class="v5q-printed-geometry" role="img" aria-label="Точки у окружности, дуги и радиуса O'+f.end+'" viewBox="0 0 226 181" style="width:100%;max-width:24rem;height:auto;display:block;margin:auto">'+
      '<desc>Положение на сетке. Центр O в начале координат, радиус 70 делений. Вправо и вверх — положительные направления. '+position+'. На рисунке проведён отрезок O'+f.end+'.</desc>'+
      '<rect width="226" height="181" rx="8" fill="'+(highlight===2?'#fae7ce':'#fff')+'"/><g transform="translate(112,95)">'+
      '<circle r="70" fill="'+(highlight===1?'#f8ddb7':'#e7f3f1')+'" stroke="'+edge+'" stroke-width="'+(highlight===0?'4':'2')+'"/>'+extra+
      '<path d="M 0 0 L -42 56" stroke="'+(highlight===5?accent:stroke)+'" stroke-width="'+(highlight===5?'4':'2')+'"/>'+dots+'</g></svg>';
  }
  function names(list){return [...list].sort().join(', ');}
  const aliases={А:'A',В:'B',Д:'D',Е:'E',Ф:'F',К:'K',Л:'L',М:'M',О:'O',Б:'B'};
  function readSet(input) {
    const chars=String(input).toUpperCase().replace(/[\s,;]+/g,'').split('').map(c=>aliases[c]||c);
    if(!chars.length||chars.some(c=>!'ABDEFKLMO'.includes(c)))return null;
    return names([...new Set(chars)]);
  }
  function generate(seed,random,step) {
    const f=figure(seed,random), endpoints=f.start+f.end;
    const format='Названия можно писать в любом порядке, например A, O.';
    function ask(prompt,list,hint,near,feedback) {
      const result=step(prompt+' '+format,names(list),hint);
      result.answerFormat='v5-point-set';
      result.nearSets=near?[{set:names(near),text:feedback}]:[];
      return result;
    }
    const steps=[
      ask('а. Какие точки лежат прямо на линии окружности?',f.ring,'Обведи пальцем только край круга.',f.disk,'Ты включил точки изнутри круга. Веди пальцем вдоль самого края.'),
      ask('б. Какие точки остались вне этой линии? Учти обе стороны границы.',[...f.internal,...f.external],'Собери точки внутри и снаружи. Точки на самой линии пропусти.',f.external,'Ты нашёл наружные точки. Проверь ещё те, что лежат внутри, вдали от линии.'),
      ask('в. Какие точки принадлежат кругу?',f.disk,'Закрашенная область включает и свой край.',f.internal,'Внутренние точки подходят. Добавь точки на самой границе.'),
      ask('г. Какие точки находятся снаружи круга?',f.external,'Посмотри только на незакрашенную область за краем.',[...f.internal,...f.external],'Внутренние точки всё ещё принадлежат кругу. Оставь только наружные.'),
      ask('д. Назови отмеченные точки короткой дуги '+endpoints+', включая её концы.',f.short,'От одной граничной точки к другой пройди вдоль линии кратчайшим путём.',f.long,'Ты прошёл между теми же концами по другой стороне. Попробуй более короткий путь.'),
      ask('д. Теперь пройди по длинной дуге '+endpoints+'. Какие отмеченные точки встретились вместе с концами?',f.long,'У обеих дуг общие концы. Между ними у каждой дуги свой путь.',f.short,'Так выглядит короткий путь. Начни с того же конца и пойди в другую сторону.'),
      ask('е. Какие точки принадлежат отрезку O'+f.end+'?',f.radius,'Начни с центра, двигайся по нарисованному радиусу и включи его конец.',f.radius.slice(1),'Ты пропустил центр. Это начало радиуса и тоже точка отрезка.')
    ];
    const final=ask('ж. Перечисли точки круга, которые остаются, если убрать весь радиус O'+f.end+'.',f.disk.filter(n=>!f.radius.includes(n)),'Сначала выбери весь круг с границей. Затем убери центр, конец радиуса и точки между ними.',f.disk,'Ты назвал весь круг. Вычеркни каждую точку нарисованного отрезка, включая оба конца.');
    return {...final,inputPrompt:'Буквы точек',steps,data:{circle:f},conditionKey:f.points.map(p=>p.slice(0,3).join('/')).join('|')};
  }
  function explore(task,state) {
    const f=task.data.circle, i=state.region;
    return {title:'Проследи выбранную часть рисунка',controls:[{key:'region',title:'Что выделить',values:groups.map((g,j)=>[j,g])}],
      visual:diagram(f,i),question:'Сколько отмеченных точек принадлежит выделенной части?',
      answer:[f.ring,f.disk,f.external,f.short,f.long,f.radius][i].length,
      why:['Считай только на граничной линии.','Закрашенная область включает и свою границу.','Ищи точки за пределами круглой области.',
        'Обрати внимание на оба конца короткой дуги.','Проследи длинную дугу целиком, с обоими концами.','Учитывай начало, конец и точки между ними.'][i]};
  }
  const api={lesson,generate,diagram,explore,readSet};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.Vilenkin5CirclePoints=api;
})(typeof window!=='undefined'?window:globalThis);
