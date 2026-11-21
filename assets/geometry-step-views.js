/* Presentation of three released textbook cards. Preserve the source edition,
   coordinates, reviewed proof, public lesson IDs and saved step/view IDs. */
(function (root) {
  'use strict';
  function thales(lesson) {
    const model = lesson.visualization.model, views = model.views, alternate = views['case-1'];
    const c = name => name + '__case1';
    const given = suffix => ['1','2'].map((n,i) => ({a:'A'+n+suffix,b:'A'+(i+2)+suffix,marks:1}));
    const cuts = ['1','2'].map((n,i) => ({a:c('B'+n),b:c('B'+(i+2)),marks:2}));
    const parallel = {...views['step-1'],equalSegments:given('')};
    const general = {...alternate,equalSegments:[...given('__case1'),...alternate.equalSegments]};
    const auxiliary = [c('B1'),c('D')];
    const base = {...alternate,label:'Условие',points:alternate.points.filter(p=>p!==c('C')&&p!==c('D')),
      segments:alternate.segments.filter(pair=>!pair.includes(c('D'))),equalSegments:given('__case1')};
    delete base.availableFromStep;
    const triangle = [[c('B1'),c('D'),c('B3')]];
    const middle = [[c('C'),c('B2')]];
    const stepViews = {...views,neutral:base,'step-1':parallel,
      'step-2':{...general,label:'Через B₁ проведена прямая, параллельная A₁A₃',highlightSegments:[auxiliary]},
      'step-3':{...general,label:'Средняя линия CB₂ треугольника B₁DB₃',polygons:triangle,highlightSegments:middle},
      'step-4':{...general,label:'Равные отрезки на второй прямой',equalSegments:[...general.equalSegments,...cuts]}};
    const steps = lesson.steps.map((step,i) => i===1?{...step,explanation:'Через B₁ проведём прямую, параллельную A₁A₃. Обозначим её пересечения со второй и третьей параллелями через C и D. По первому шагу B₁C = CD.'}:step);
    return {...lesson,steps,visualization:{...lesson.visualization,model:{...model,views:stepViews}}};
  }

  // Project the two sides of an actual square lying in the indicated plane.
  // Underscore-prefixed construction points are intentionally unlabelled.
  function corner(points,vertex,one,two,length) {
    const v=points[vertex];
    const along=name=>{
      const delta=points[name].map((x,k)=>x-v[k]);
      return delta.map(x=>x*length/Math.hypot(...delta));
    };
    const a=along(one),b=along(two),names=['_r'+vertex+'1','_r'+vertex+'2','_r'+vertex+'3'];
    [a,a.map((x,k)=>x+b[k]),b].forEach((offset,i)=>{points[names[i]]=v.map((x,k)=>x+offset[k]);});
    return [[names[0],names[1]],[names[1],names[2]]];
  }

  function commonPerpendicular(lesson) {
    const triangle=lesson.id==='merz-ex-10-032',v=triangle?'A':'B',side=triangle?'BC':'CD',line=triangle?'m':'a';
    const h=v+'H',original=lesson.visualization.model,points={...original.points};
    const foot=corner(points,'H',v,'C',.7),upright=corner(points,v,'H','M',.7);
    const high=[v,'H'],base=side.split('');
    const both=[high,...foot,...upright];
    const views={...original.views,neutral:{label:'Условие'},
      'step-1':{label:h+' — высота к '+side,segments:[high,...foot]},
      'step-2':{label:h+' — общий перпендикуляр',segments:both},
      'step-3':{label:'Основание '+side+' и высота '+h,segments:[base,...both]}};
    const model={...original,points,edges:original.edges.filter(edge=>!edge.includes('H')),views,
      labelNames:original.labelNames.filter(name=>name!=='H'),labels:{...original.labels,M:line}};
    const prompts=triangle?[
      'Опусти из A перпендикуляр на BC. Где находится его основание H?',
      'Почему AH перпендикулярен также прямой m? Какова его длина?',
      'Чему равна площадь ABC с основанием BC и высотой AH?'
    ]:[
      'Опусти из B перпендикуляр на CD. Где находится его основание H?',
      'Почему BH служит общим перпендикуляром прямых a и CD? Как связаны площадь, CD и BH?',
      'Чему равно расстояние между a и CD?'
    ];
    const reasons=triangle?[
      'Проведём AH в плоскости ABC так, что H лежит на BC и AH ⟂ BC.',
      'Прямая m перпендикулярна плоскости ABC и пересекает AH в A. Поэтому AH ⟂ m. Расстояние между m и BC равно длине общего перпендикуляра AH, то есть 8 см.',
      'S = BC · AH / 2 = 10 · 8 / 2 = 40 см².'
    ]:[
      'Проведём BH в плоскости ABCD так, что H лежит на CD и BH ⟂ CD.',
      'Прямая a перпендикулярна плоскости ABCD в B, значит BH ⟂ a. Расстояние между прямыми равно BH. В параллелограмме CD = AB = 6 см, поэтому 72 = 6 · BH.',
      'BH = 72 / 6 = 12 см. Это расстояние между a и CD.'
    ];
    const steps=lesson.steps.map((step,i)=>({...step,view:'step-'+(i+1),prompt:prompts[i],explanation:reasons[i],
      ...(i===0?{justifications:[{kind:'definition',text:'Высота опущена из вершины перпендикулярно прямой основания.'}]}:{})}));
    return {...lesson,steps,visualization:{...lesson.visualization,caption:triangle?'Основание BC = 10 см. Прямая m проходит через A перпендикулярно плоскости ABC.':'AB = 6 см. Прямая a проходит через B перпендикулярно плоскости ABCD.',model},
      statement:{...lesson.statement,text:lesson.statement.text.split(' Найдите ')[0],goal:triangle?'Найдите площадь ABC.':'Найдите расстояние между a и CD.'},
      answer:{...lesson.answer,prompt:'Запиши вычисление и объясни, почему построенный отрезок перпендикулярен обеим прямым.'}};
  }

  function addBookBoardLink() {
    if (!root.document || !/^\/geometry-course\/textbook\/(?:index\.html)?$/.test(root.location.pathname)) return;
    const nav = root.document.querySelector('.course-nav');
    const app = root.document.getElementById('textbook-app');
    if (!nav || !app) return;
    const link = root.document.createElement('a');
    link.id = 'textbook-board-link';
    link.textContent = 'Открыть на общей доске';
    const update = () => {
      link.href = '/trainers/trainer-board.html?trainer=' + encodeURIComponent('/geometry-course/textbook/' + root.location.hash);
    };
    update();
    nav.appendChild(link);
    root.addEventListener('hashchange', update);
    new root.MutationObserver(update).observe(app, { childList: true, subtree: true });
  }
  addBookBoardLink();

  const cards=new Map([['atanasyan-7-9-main-488-part-1',thales],
    ['merz-ex-10-032',commonPerpendicular],['merz-ex-10-033',commonPerpendicular]]);
  root.GeometryStepViews={prepare(bundle){
    return {...bundle,lessons:bundle.lessons.map(lesson=>cards.has(lesson.id)?cards.get(lesson.id)(lesson):lesson)};
  }};
})(typeof window==='undefined'?globalThis:window);
