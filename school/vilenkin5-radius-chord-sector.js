/* Виленкин и соавторы, 5 класс, часть 2, §26, печатная страница 17. */
(function(root){
  'use strict';
  const TAU=Math.PI*2,center=100,radius=64;
  const lessons=[
    {n:69,title:'Что соединяет радиус?',text:'У радиуса есть два конца. Один находится в центре, другой лежит на окружности. Отрезок до внутренней точки короче радиуса.',example:'У колеса со втулкой в центре прямая спица от втулки до обода показывает радиус.',falseIdea:'Любой отрезок внутри круга можно назвать его радиусом.',reflect:'Объясни своими словами, где должны находиться оба конца радиуса.'},
    {n:70,title:'Какие расстояния возможны в круге и на окружности?',text:'Отрезок между двумя точками окружности — хорда. Самая длинная хорда проходит через центр. Ни одна пара точек всего круга тоже не может быть дальше друг от друга, чем концы диаметра.',example:'При диаметре 8 см можно найти точки на расстоянии 3 см. Для расстояния 8 см подойдут концы диаметра. Расстояние 9 см уже не поместится.',falseIdea:'Если обе точки лежат на окружности, расстояние между ними всегда равно диаметру.',reflect:'Как меняется длина хорды, когда две точки на окружности сближаются?'},
    {n:71,title:'Когда сектор занимает ровно половину круга?',text:'Сектор ограничивают два радиуса и дуга между их концами. У полукруга радиусы направлены в противоположные стороны и вместе образуют диаметр.',example:'Если повернуть радиус от начального положения на четверть оборота, он выделит сектор в четверть круга. Половине оборота соответствует полукруг.',falseIdea:'Сектор обязательно должен занимать меньше половины круга.',reflect:'Где у полукруга можно увидеть два радиуса и дугу?'}
  ].map(x=>({number:'5.'+x.n,key:'printed-5-'+x.n,part:2,point:26,page:17,title:x.title,requires:['v5f-printed-5-29'],related:['v5f-printed-5-29'],explanation:x.text,worked:[x.example],misconception:x.falseIdea,reflect:x.reflect}));
  const yesNo=input=>String(input).toLowerCase().trim().replace(/[.!]$/,'').trim();
  const readSegment=input=>String(input).toUpperCase().replace(/[АОСВКМТХР]/g,c=>({'А':'A','О':'O','С':'C','В':'B','К':'K','М':'M','Т':'T','Х':'X','Р':'P'}[c])).replace(/[\s-]/g,'').split('').sort().join('');
  const makeYesNo=(step,question,right,help,wrong)=>({...step(question+' Ответь «да» или «нет».',right?'да':'нет',help,[{value:right?'нет':'да',text:wrong}]),answerFormat:'v5-yes-no',inputPrompt:'Да или нет'});
  const shell=(label,body,note)=>'<figure style="margin:.4em 0"><svg viewBox="0 0 200 185" role="img" aria-label="'+label+'" style="display:block;width:100%;max-width:310px;margin:auto">'+body+'</svg><figcaption>'+note+'</figcaption></figure>';
  const stroke='#274b60',accent='#984329';
  function line(x1,y1,x2,y2,extra=''){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+accent+'" stroke-width="3" '+extra+'/>';}
  function circ(x,y,r,fill,edge=stroke){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+edge+'" stroke-width="2"/>';}
  const text=(x,y,t)=>'<text x="'+x+'" y="'+y+'" fill="#173648" font-size="12" text-anchor="middle">'+t+'</text>';
  function radiusFigure(p,which){
    const {tip,inner,far,turn}=p;
    const a=[center+radius*turn,91],b=[center-radius*turn*.38,68],c=[center-radius*turn,91],o=[center,91];
    const segments=[[o,a],[o,b],[a,c]];
    const visible=which===3?line(...a,...c,'opacity=".55"')+line(...o,...b,'stroke-dasharray="4 3"'):line(...segments[which][0],...segments[which][1]);
    const dots=[[o,'O',16],[a,tip,-9],[b,inner,-9],[c,far,-9]].map(([[x,y],k,dy])=>circ(x,y,2.6,stroke)+text(x,y+dy,k)).join('');
    return shell('Центр O, одна внутренняя и две граничные точки',circ(center,91,radius,'#eaf5f0')+visible+dots,which===3?'Проверь положение обоих концов каждого из трёх отрезков.':'Выделен отрезок '+['O'+tip,'O'+inner,tip+far][which]+'.');
  }
  function radiusLesson(seed,r,step){
    const names=seed?[['K','M','T'],['A','C','B'],['S','P','N'],['N','A','K'],['T','N','C'],['X','B','K'],['M','S','T']][r(0,6)]:['A','B','C'];
    const [tip,inner,far]=names,turn=seed&&r(0,1)?-1:1;
    const info={tip,inner,far,turn},segment='O'+tip;
    const rule='Один конец отрезка — центр O, а другой лежит на окружности.';
    return {steps:[makeYesNo(step,'O — центр. Точка '+tip+' на границе круга. Будет ли O'+tip+' радиусом?',true,rule,'Проверь каждый конец: O — центр, а '+tip+' находится точно на окружности.'),makeYesNo(step,'Точка '+inner+' внутри круга и не на границе. Будет ли O'+inner+' радиусом?',false,rule,'Этот отрезок начинается в центре, но заканчивается раньше, чем достигает окружности.')],prompt:'Закончи фразу «Отрезок является радиусом, если он…» своими словами в поле для рассуждения. Для автоматической проверки назови радиус среди '+[segment,'O'+inner,tip+far].join(', ')+'.',answer:segment,answerFormat:'v5-radius-name',inputPrompt:'Две буквы радиуса',why:rule,errors:[{value:'O'+inner,text:'Второй конец находится внутри. Радиус достигает окружности.'},{value:tip+far,text:'Это диаметр. Он проходит через центр, а у радиуса центр является концом.'}],data:{radiusChord:{kind:'radius',...info}},conditionKey:'radius/'+names.join('')};
  }
  const readable=mm=>mm%10===0?mm/10+' см':mm+' мм';
  function chordFigure(info,boundary,distance){
    const half=radius*distance/info.diameter,inside=distance<=info.diameter,y=inside&&boundary?91-Math.sqrt(Math.max(0,radius*radius-half*half)):91;
    const ends=[center-half,center+half];
    const inset=inside&&distance<info.diameter/10?'<span style="display:block;margin-top:.3em">Отдельно с увеличением <svg viewBox="0 0 120 16" width="92" height="16" role="img" aria-label="Два разных конца короткого отрезка"><path d="M9 8H107" stroke="#984329" stroke-width="3"/><circle cx="9" cy="8" r="4" fill="#274b60"/><circle cx="107" cy="8" r="4" fill="#274b60"/></svg> '+readable(distance)+'</span>':'';
    return shell('Сравнение расстояния с диаметром',circ(center,91,radius,boundary?'none':'#dbefe8')+(inside?'':line(center-radius,99,center+radius,99,'stroke-dasharray="3 3"'))+line(ends[0],y,ends[1],y)+circ(ends[0],y,2.5,'#984329')+circ(ends[1],y,2.5,'#984329'),(boundary?'Нужны две точки на окружности.':'Точки можно брать во всём круге.')+' Диаметр '+readable(info.diameter)+', выбранное расстояние '+readable(distance)+'.'+inset);
  }
  function chords(seed,r,step){
    const diameter=seed?20*r(4,9):120,values=seed?[diameter/2,r(1,5),diameter+20,diameter,r(6,9),10,diameter+10,diameter]:[60,1,140,120,6,10,140,120];
    const info={kind:'chords',diameter,values};
    const tasks=values.map((mm,i)=>{
      const bound=i>=4,possible=mm<=diameter;
      const question=(bound?'На окружности радиуса '+readable(diameter/2):'В круге диаметра '+readable(diameter))+' можно ли выбрать две точки на расстоянии '+readable(mm)+'?';
      return makeYesNo(step,question,possible,mm===diameter?'Подойдут противоположные концы диаметра.':possible?'Выбранное расстояние меньше диаметра и помещается в круге.':'Даже самая длинная хорда имеет длину только '+readable(diameter)+'.',possible?(mm===diameter?'Равенство допустимо. Отметь концы диаметра.':'Посмотри, как расположены концы короткого отрезка. Диаметр — наибольшая возможная длина.'):'Переведи величины в одни единицы. Требуемая длина больше диаметра.');
    });
    return {...tasks.pop(),steps:tasks,data:{radiusChord:info},conditionKey:'distances/'+diameter+'/'+values.join(',')};
  }
  function sectorFigure(angle){
    const rad=angle*TAU/360,x=center+radius*Math.cos(rad),y=91-radius*Math.sin(rad);
    const path='M100 91 L164 91 A64 64 0 '+(angle>180?'1':'0')+' 0 '+x+' '+y+' Z';
    return shell('Выделенный сектор круга',circ(center,91,radius,'#f4f8f7')+'<path d="'+path+'" fill="#83c7ac" stroke="'+stroke+'" stroke-width="2"/>'+line(center,91,164,91)+line(center,91,x,y)+circ(center,91,2.4,stroke),'Поворот радиуса от начального положения равен '+angle+'°.');
  }
  function sectors(seed,r,step){
    const angle=seed?[60,90,120,180,240,270][r(0,5)]:180;
    const tasks=[step('Сколько градусов в половине полного оборота?',180,'Раздели 360 градусов пополам.',[{value:90,text:'90° составляют только четверть полного оборота.'}])];
    const q=seed?'Занимает ли показанный сектор с углом '+angle+'° ровно полкруга?':'Показан полукруг. Можно ли назвать его сектором?';
    return {...makeYesNo(step,q,angle===180,'Полукруг — сектор с углом 180°. Два его радиуса вместе образуют диаметр.','Сверь угол между радиусами с половиной полного оборота.'),steps:tasks,data:{radiusChord:{kind:'sector',angle}},conditionKey:'sector/'+angle};
  }
  function draw(t,s){
    const p=t.data.radiusChord,i=s?.mode==='learn'?s.step:t.steps.length;
    if(p.kind==='radius')return radiusFigure(p,i===0?0:i===1?1:3);
    if(p.kind==='sector')return sectorFigure(p.angle);
    return chordFigure(p,i>=4,p.values[i]);
  }
  function explore(t,s){
    const p=t.data.radiusChord;
    if(p.kind==='radius')return {title:'Где концы отрезка?',controls:[{key:'choice',title:'Выдели отрезок',values:[[0,'O'+p.tip],[1,'O'+p.inner],[2,p.tip+p.far]]}],visual:radiusFigure(p,s.choice),question:'Сколько концов выделенного отрезка лежат на окружности?',answer:[1,0,2][s.choice],why:'Проверь каждую из двух отмеченных точек.'};
    if(p.kind==='sector'){const angles=[60,90,120,180,240,270],a=angles[s.choice];return {title:'Поверни радиус',controls:[{key:'choice',title:'Угол',values:angles.map((v,i)=>[i,v+'°'])}],visual:sectorFigure(a),question:'Сколько градусов занимает остальная часть круга?',answer:360-a,why:'Весь оборот равен 360°.'};}
    return {title:'Подбери две точки',controls:[{key:'choice',title:'Расстояние и место точек',values:p.values.map((v,i)=>[i,(i>=4?'Окружность, ':'Круг, ')+readable(v)])}],visual:chordFigure(p,s.choice>=4,p.values[s.choice]),question:'На сколько миллиметров выбранная длина отличается от диаметра? Если они равны, введи 0.',answer:Math.abs(p.diameter-p.values[s.choice]),why:'Сначала вырази обе длины в миллиметрах и вычти меньшую из большей.'};
  }
  const api={lessons,generators:{'5.69':radiusLesson,'5.70':chords,'5.71':sectors},bounds:{'5.69':{choice:[0,2,0]},'5.70':{choice:[0,7,0]},'5.71':{choice:[0,5,3]}},draw,explore,yesNo,readSegment};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RadiusChordSector=api;
})(typeof window!=='undefined'?window:globalThis);
