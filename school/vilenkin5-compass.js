/* Original movable compass and arc drawings, Vilenkin 5, part 2, §25, printed p. 7 (2023). */
(function(root){
  'use strict';
  const source={part:2,point:25,page:7,requires:['v5f-circle-shapes'],related:['v5f-circle-radius']};
  const lessons=[
    {...source,number:'5.2',key:'printed-5-2',title:'Строим окружность и измеряем её радиус',
      explanation:'Поставь иглу циркуля в O. Другой конец оставит на бумаге точки на одном расстоянии от O. Это расстояние можно выбрать самому. Длину измеряют по разности отметок линейки.',
      worked:['Игла стоит в центре. На линейке центр находится над 5 мм, правый край — над 22 мм.','Радиус этой окружности равен 22 − 5 = 17 мм.','От одного края до противоположного через центр помещаются два радиуса. Диаметр равен 34 мм.'],
      misconception:'Длина радиуса равна числу под правым концом отрезка при любом положении линейки.',reflect:'Что изменится после сдвига линейки, если окружность останется на месте?'},
    {...source,number:'5.3',key:'printed-5-3',title:'Два пути по окружности между каждой парой точек',
      explanation:'От одной точки окружности к другой можно пройти вдоль линии в двух направлениях. Три буквы задают дугу точнее. Средняя буква показывает, через какую точку идёт путь.',
      worked:['На круглой дорожке между двумя воротами есть два пути. На одном стоит сосна, на другом — ель.','Если поменять местами начало и конец пути через сосну, получится та же самая дуга.','Чтобы указать другой путь между воротами, выбери дерево с другой стороны.'],
      misconception:'Одних концов всегда достаточно, чтобы отличить две дуги окружности.',reflect:'Какая буква в обозначении дуги помогает выбрать нужный путь?'}
  ];
  const positions=[12,15,18,21,24,27,30,33,36];
  const err=(value,text)=>({value,text});
  function svg(body,label,desc){
    return '<svg class="v5q-printed-geometry" role="img" aria-label="'+label+'" viewBox="0 0 270 188" style="display:block;width:100%;max-width:26rem;height:auto;margin:auto"><desc>'+desc+'</desc><g font-family="sans-serif" font-size="13" fill="#16394c">'+body+'</g></svg>';
  }
  function rulerDetail(origin,radius){
    const max=Math.ceil((origin+radius+2)/10)*10,start=16,unit=234/max;
    let marks='';
    for(let v=0;v<=max;v++){
      const x=start+unit*v;
      marks+='<path d="M '+x+' 29 v '+(v%5?7:13)+'" stroke="#584c2c" stroke-width="'+(v%5?1:1.5)+'"/>';
      if(v%10===0)marks+='<text x="'+x+'" y="59" text-anchor="middle" font-size="16">'+v+'</text>';
    }
    const pointer=(v,label)=>{
      const x=start+unit*v;
      return '<text x="'+x+'" y="19" text-anchor="middle" font-size="15" font-weight="bold">'+label+'</text><path d="M '+x+' 20 v 8 m -3 -5 l 3 5 3 -5" fill="none" stroke="#8c340d" stroke-width="2"/>';
    };
    return '<figure style="margin:.35rem auto .8rem;max-width:26rem"><figcaption>Линейка крупнее · миллиметры</figcaption><svg class="v5q-printed-geometry" viewBox="0 0 270 64" style="display:block;width:100%;height:auto" role="img" aria-label="Крупная шкала под центром и правым краем"><desc>Центр над отметкой '+origin+' мм, край над отметкой '+(origin+radius)+' мм.</desc><g font-family="sans-serif" fill="#16394c"><rect x="7" y="28" width="252" height="35" rx="2" fill="#fff2ca"/>'+marks+pointer(origin,'O')+pointer(origin+radius,'край')+'</g></svg></figure>';
  }
  function compass(radius,origin,stage){
    const scale=2.4,cx=126,cy=88,r=radius*scale;
    const ray='<path d="M '+cx+' '+cy+' h '+r+'" fill="none" stroke="#ac470a" stroke-width="3"/>';
    let body='<rect width="270" height="188" fill="white"/>';
    if(stage>0)body+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#ecf6f5" stroke="#22546c" stroke-width="2"/>';
    if(stage>=2){
      const end=Math.ceil((origin+radius+7)/5)*5,zero=cx-origin*scale;
      body+='<path d="M '+zero+' '+(cy+6)+' h '+end*scale+' v 24 h -'+end*scale+' Z" fill="#fff2ca" stroke="#756137"/>';
      for(let n=0;n<=end;n++){
        const x=zero+n*scale;body+='<path d="M '+x+' '+(cy+6)+' v '+(n%5?4:9)+'" stroke="#5c532c"/>';
        if(n%10===0)body+='<text x="'+x+'" y="'+(cy+29)+'" font-size="10" text-anchor="middle">'+n+'</text>';
      }
      body+='<text x="'+zero+'" y="'+(cy+54)+'" font-size="11">мм</text>'+ray;
      if(stage===3)body+='<path d="M '+(cx-r)+' '+cy+' H '+cx+'" stroke="#ac470a" stroke-width="3"/>';
    }else{
      body+='<path d="M '+cx+' '+cy+' L '+(cx+r/2)+' 25 L '+(cx+r)+' '+cy+'" stroke="#5d7080" stroke-width="4" stroke-linecap="round" fill="none"/>';
    }
    body+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="#16394c"/><text x="'+(cx-7)+'" y="'+(cy-8)+'" text-anchor="end">O</text><circle cx="'+(cx+r)+'" cy="'+cy+'" r="3" fill="#16394c"/>';
    return svg(body,'Циркуль с иглой в O и миллиметровая шкала',stage>=2?'Центр O находится над отметкой '+origin+' мм. Правый край находится над отметкой '+(origin+radius)+' мм.':'Игла циркуля в O, карандаш справа. Раскрытие выбрано в настройке модели.')+(stage>=2?rulerDetail(origin,radius):'');
  }
  function measure(seed,random,step){
    const r=seed?random(12,36):24,origin=seed?random(0,10):5;
    return {constructionIntro:'Для построения можно выбрать свой радиус. Здесь — один пример. ',conditionKey:r+'/'+origin,data:{measurement:{r,origin}},
      prompt:'Найди диаметр показанной окружности в миллиметрах. Используй отметки под центром O и правым краем. В исследовании можно построить свою окружность.',
      answer:2*r,inputPrompt:'Диаметр в мм',errors:[err(r,'Это длина от центра до одного края. Продолжи тот же отрезок через центр в другую сторону.')],
      steps:[step('На какое число миллиметров указывает центр O?',origin,'Найди риску прямо под центром. Подписанные отметки идут через 10 мм, короткие — через 1 мм.'),
        step('Прочитай отметку линейки под правым краем.',origin+r,'Начни с ближайшей подписанной отметки и досчитай оставшиеся маленькие деления.'),
        step('Какое расстояние в миллиметрах между прочитанными отметками?',r,'Вычти начальное показание из конечного.',[err(origin+r,'Это правое показание линейки. Вычти показание под центром.'),err(2*r,'Здесь измеряют только от центра до одного края.')])]};
  }
  const colors=['#1b6284','#a8440c'];
  function arcFigure(seed,random){
    const labels=seed?['A','C','M','P','S','T']:['K','B','D','P','S','T'];
    if(seed)for(let i=2;i>0;i--){const j=random(0,i);[labels[j],labels[i]]=[labels[i],labels[j]];}
    return {letters:[labels[0],labels[3],labels[1],labels[4],labels[2],labels[5]],rotation:seed?random(-28,28):0};
  }
  function pathPoints(f,pair,longWay){
    const first=2*pair,direction=longWay?-1:1,n=longWay?4:2;
    return Array.from({length:n+1},(_,i)=>(first+direction*i+6)%6);
  }
  function arcs(f,pair=null,longWay=0){
    const at=i=>{const t=(60*i+f.rotation-90)*Math.PI/180;return [135+66*Math.cos(t),92+66*Math.sin(t)];};
    let body='<circle cx="135" cy="92" r="66" fill="#f1f6f6" stroke="#28526a" stroke-width="2"/>';
    if(pair!==null){
      const route=pathPoints(f,pair,longWay),a=at(route[0]),b=at(route.at(-1));
      body+='<path d="M '+a.join(' ')+' A 66 66 0 '+Number(Boolean(longWay))+' '+Number(!longWay)+' '+b.join(' ')+'" stroke="'+colors[longWay]+'" stroke-width="5" fill="none"/>';
    }
    for(let i=0;i<6;i++){
      const [x,y]=at(i),lx=135+(x-135)*1.22,ly=92+(y-92)*1.16+4;
      body+='<circle cx="'+x+'" cy="'+y+'" r="'+(i%2?2.5:4)+'" fill="#16394c"/><text x="'+lx+'" y="'+ly+'" font-size="15" font-weight="'+(i%2?'normal':'bold')+'" text-anchor="middle">'+f.letters[i]+'</text>';
    }
    return svg(body,'Три отмеченные точки и три малые метки между ними','По часовой стрелке расположены '+f.letters.join(', ')+'. Крупные точки — '+[0,2,4].map(i=>f.letters[i]).join(', ')+'.');
  }
  const aliases={А:'A',В:'B',Б:'B',Д:'D',К:'K',М:'M',П:'P',Р:'P',С:'C',Т:'T'};
  function readArc(value){return String(value).toUpperCase().replace(/[\s–−-]+/g,'').split('').map(c=>aliases[c]||c).join('');}
  function arcQuestion(f,pair,longWay,step){
    const ids=pathPoints(f,pair,longWay),names=ids.map(i=>f.letters[i]),a=names[0],b=names.at(-1);
    const valid=names.slice(1,-1).flatMap(m=>[a+m+b,b+m+a]);
    const target=step('Между '+a+' и '+b+' назови '+(longWay?'длинную':'короткую')+' дугу тремя буквами. Между буквами концов поставь любую метку с этого пути.',valid[0],
      'Проследи выбранный путь от начала до конца. Средняя буква находится на пути между ними.');
    const other=pathPoints(f,pair,!longWay).slice(1,-1).flatMap(i=>[a+f.letters[i]+b,b+f.letters[i]+a]);
    return {...target,answerFormat:'v5-arc',arcNames:valid,otherArc:other};
  }
  function naming(seed,random,step){
    const f=arcFigure(seed,random),steps=[];
    for(let pair=0;pair<3;pair++)for(let side=0;side<2;side++)steps.push(arcQuestion(f,pair,side,step));
    const end=steps.pop();
    return {...end,constructionIntro:'Три крупные точки заданы в книге. Рисунок и малые метки для записи дуг добавлены в тренажёре. ',steps,inputPrompt:'Три буквы дуги',data:{arcs:f},conditionKey:f.letters.join('')+'/'+f.rotation,
      prompt:end.prompt+' На чертеже три крупные точки и три вспомогательные метки. В разборе пройди по обеим дугам для каждой пары больших точек.'};
  }
  function explore(task,state){
    if(task.data.measurement){
      const r=positions[state.opening],stage=state.stage,origin=task.data.measurement.origin;
      return {title:'Построй окружность своего радиуса',controls:[{key:'opening',title:'На сколько раскрыть циркуль',values:positions.map((n,i)=>[i,n+' мм'])},
        {key:'stage',title:'Что сделать',values:['Установить иглу в O','Провести окружность','Приложить линейку','Провести диаметр'].map((label,i)=>[i,label])}],
        visual:compass(r,origin,stage),question:stage===3?'Сколько миллиметров от края до противоположного края через центр?':'Сколько миллиметров между иглой и следом карандаша?',
        answer:stage===3?2*r:r,why:stage===3?'На прямой через центр два выбранных радиуса по '+r+' мм. Диаметр равен '+(2*r)+' мм.':'Расстояние от иглы до следа карандаша сохраняется при каждом повороте циркуля.'};
    }
    const original=task.data.arcs,f={...original,rotation:original.rotation+state.turn*30},path=pathPoints(f,state.pair,state.side);
    return {title:'Пройди по двум дугам между точками',controls:[{key:'pair',title:'Концы дуги',values:[0,1,2].map(i=>[i,f.letters[2*i]+' и '+f.letters[(2*i+2)%6]])},
      {key:'turn',title:'Повернуть рисунок',values:[0,1,2,3,4,5].map(i=>[i,(i*30)+'°'])},{key:'side',title:'Путь',values:[[0,'Короткий'],[1,'Длинный']]}],visual:arcs(f,state.pair,state.side),
      question:'Сколько подписанных точек находится строго между концами выделенной дуги?',answer:path.length-2,why:'Путь проходит через '+path.map(i=>f.letters[i]).join(' → ')+'. При подсчёте две крайние точки пропускаем.'};
  }
  const api={lessons,generators:{'5.2':measure,'5.3':naming},bounds:{'5.2':{opening:[0,8,4],stage:[0,3,0]},'5.3':{pair:[0,2,0],side:[0,1,0],turn:[0,5,0]}},compass,arcs,explore,readArc};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5Compass=api;
})(typeof window!=='undefined'?window:globalThis);
