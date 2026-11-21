/* Виленкин и соавт., 2023, 5 класс, часть 2, §25, с. 10. Авторская модель к №5.29. */
(function(root){
  'use strict';
  const lesson={number:'5.29',key:'printed-5-29',part:2,point:25,page:10,title:'Что принадлежит кругу, а что — его окружности?',requires:['v5f-printed-5-1'],related:['v5f-printed-5-2'],
    explanation:'Поставь иглу циркуля в O, раскрой ножки на заданный радиус, проведи окружность. Отметь M и N на её линии, P и Q в круге, R и K снаружи круга. Для одного возможного рисунка помести P и Q строго внутрь. Сравни расстояние от каждой метки до O с радиусом.',
    worked:['Допустим, радиус 5 см. Точка в 5 см от центра лежит и на окружности, и в круге.','Точка в 2 см от центра принадлежит кругу, но до граничной линии не доходит. Точка в 6 см находится снаружи круга.','Сам центр имеет расстояние ноль от себя. Учитывай его, когда перечисляешь все подписанные точки.'],
    misconception:'Если точка не лежит на линии окружности, она обязательно находится снаружи круга.',reflect:'Можно ли выполнить условие «точка в круге», поставив точку на его границу? Проверь это в модели и объясни.'};
  const groups=['На линии окружности','В круге вместе с границей','Строго внутри','Снаружи круга','Не на линии окружности'];
  const alphabetical=list=>list.slice().sort().join('');
  function read(input){
    const chars=String(input).toUpperCase().replace(/[\s,;]+/g,'').split('').map(c=>({М:'M',Н:'N',О:'O',Р:'P',К:'K'}[c]||c));
    if(!chars.length||chars.some(c=>!'KMNOPQR'.includes(c)))return null;
    return alphabetical([...new Set(chars)]);
  }
  function coordinates(radius,rotation=0,onEdge=false){
    const polar=(name,ratio,deg)=>({name,ratio,angle:(deg+rotation)*Math.PI/180});
    return [polar('O',0,0),polar('M',1,155),polar('N',1,35),polar('P',onEdge?1:.56,-55),polar('Q',.5,115),polar('R',1.4,205),polar('K',1.41,-18)];
  }
  const belongs=(r,g)=>[r===1,r<=1,r<1,r>1,r!==1][g];
  function diagram(radius,rotation,onEdge,group=-1){
    const cx=143,cy=108,unit=61;
    const disk=group===1||group===2,selected=coordinates(radius,rotation,onEdge);
    let body='<circle cx="'+cx+'" cy="'+cy+'" r="'+unit+'" fill="'+(disk?'#e4f0d7':'#fff')+'" stroke="'+(group===0?'#994525':'#366267')+'" stroke-width="'+(group===0?3:2)+'"/>';
    for(const {name,ratio,angle} of selected){
      const x=cx+unit*ratio*Math.cos(angle),y=cy-unit*ratio*Math.sin(angle),side=ratio&&Math.cos(angle)<-.15?-1:1;
      const tx=x+side*6,ty=y+(ratio?Math.sin(angle)<-.25?13:-6:14);
      body+='<circle cx="'+x+'" cy="'+y+'" r="'+(belongs(ratio,group)?4.3:3)+'" fill="'+(belongs(ratio,group)?'#a1421d':'#213e45')+'"/><text x="'+tx+'" y="'+ty+'" text-anchor="'+(side<0?'end':'start')+'" font-weight="bold" font-size="12" fill="#17343e" paint-order="stroke" stroke="white" stroke-width="3">'+name+'</text>';
    }
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Круг с центром O и отмеченными точками M, N, P, Q, R, K" viewBox="22 3 240 210" style="width:100%;max-width:23rem;display:block;margin:auto">'+body+'</svg><figcaption>Радиус окружности '+radius+' см. '+(group===-1?'Сверяй метки с граничной линией.':'Выбрано: '+groups[group].toLowerCase()+'.')+'</figcaption></figure>';
  }
  function generate(seed,rand,step){
    const radius=seed?2+seed%6:3,rotation=seed?((seed*17)%61)-30:0,onEdge=!!seed&&seed%3===0;
    const points=coordinates(radius,rotation,onEdge),names=g=>alphabetical(points.filter(p=>belongs(p.ratio,g)).map(p=>p.name));
    const ask=(prompt,answer,why,near,feedback)=>({...step(prompt+' Буквы перечисли в любом порядке.',answer,why,[]),answerFormat:'v5-membership-set',nearSets:near?[{set:near,text:feedback}]:[]});
    return {steps:[
      step('Окружность нужно провести радиусом '+radius+' см. Какое расстояние в сантиметрах отмерить между иглой и грифелем циркуля?',radius,'Ножки раскрывают от центра до точки на окружности.',[{value:2*radius,text:'Это диаметр — два радиуса. Игла стоит в центре.'}]),
      ask('Какие подписанные точки в этом чертеже находятся точно на линии окружности?',names(0),'Ищи точки, для которых расстояние до центра равно одному радиусу.',names(1),'Ты указал весь круг. Сейчас нужен только его край.'),
      ask('Какие подписанные точки расположены строго снаружи круга?',names(3),'От центра до такой точки больше радиуса.',names(4),'Строго внутренние точки тоже не лежат на линии, но они остаются в круге.'),
      ask('Теперь укажи все подписанные точки, которые не лежат на самой линии окружности.',names(4),'Проверь обе стороны линии. Добавь центр O.',names(3),'Это наружные точки. Центр и другие внутренние точки тоже не лежат на линии.')
    ],...ask('Назови все подписанные точки, которые принадлежат кругу вместе с его границей.',names(1),'Собери центр, внутренние и граничные метки.',names(2),'Ты назвал строго внутренние точки. Добавь те, которые лежат на границе.'),
      inputPrompt:'Буквы отмеченных точек',data:{diskMembership:{radius,rotation,onEdge}},conditionKey:'disk/'+[radius,rotation,Number(onEdge)].join('/')};
  }
  function taskDrawing(t){const d=t.data.diskMembership;return diagram(d.radius,d.rotation,d.onEdge);}
  function explore(t,s){
    const d=t.data.diskMembership,g=s.region,edge=!!s.boundary,n=coordinates(d.radius,d.rotation,edge).filter(p=>belongs(p.ratio,g)).length;
    return {title:'Перенеси P к краю и проверь принадлежность',controls:[{key:'boundary',title:'Где поставить P',values:[[0,'Строго внутри'],[1,'На границе']]},{key:'region',title:'Что рассматриваем',values:groups.map((g,i)=>[i,g])}],
      visual:diagram(d.radius,d.rotation,edge,g),question:'Сколько подписанных точек принадлежит выбранной части?',answer:n,why:'Выбранные точки: '+coordinates(d.radius,d.rotation,edge).filter(p=>belongs(p.ratio,g)).map(p=>p.name).join(', ')+'. Всего '+n+'.'};
  }
  const api={lesson,generate,read,taskDrawing,explore,bounds:{boundary:[0,1,0],region:[0,4,0]}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5DiskMembership=api;
})(typeof window!=='undefined'?window:globalThis);
