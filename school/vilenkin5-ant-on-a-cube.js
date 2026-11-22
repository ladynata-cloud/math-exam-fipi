/* Виленкин и соавторы, 5 класс, часть 2, §27, с. 23, №5.111. */
(function(root){
  'use strict';
  const starts=['передняя','верхняя','левая'],ends=['правая','нижняя','задняя'];
  const allowed=[[0,1],[0,2],[1,2]];
  const lesson={part:2,point:27,page:23,number:'5.111',key:'printed-5-111',title:'Короткая дорожка муравья по кубу',
    explanation:'Муравей может бежать по всей поверхности куба. Мысленно раскрой две соседние грани, как книжку. На плоском прямоугольнике проведи прямой отрезок из одного угла в противоположный. При складывании куба длина отрезка сохраняется.',
    worked:['Положи рядом два квадратных листка. Проведи нить между противоположными углами общего прямоугольника. Если прижать нить к краю соединения выше или ниже его середины, нить образует излом.'],
    misconception:'Раз точки отмечены на кубе, двигаться между ними можно только по рёбрам.',reflect:'Почему после выбора первой грани остаётся ровно два варианта второй?',requires:['v5f-printed-5-110'],related:['v5f-printed-5-99']};
  function generate(seed,r,step){
    const side=seed?2*r(2,19):0,first=seed?r(0,2):0,unit=side?side+' см':'одно ребро';
    const rows=[step('Из вершины M муравей выходит по одной из граней. Сколько граней соприкасаются в M?',3,'Посмотри на переднюю, верхнюю и левую грани куба.',[{value:6,text:'Шесть граней у всего куба. Посчитай только те, которые касаются стартовой вершины.'}]),
      step('Первая грань — '+starts[first]+'. Сколько соседних с ней граней содержат конечную вершину N?',2,'Грань должна иметь с первой общее ребро и содержать N.',[{value:3,text:'Одна из трёх граней при N противоположна первой. Такие грани не имеют общего ребра.'}]),
      step(side?'Ребро равно '+unit+'. В скольких сантиметрах от нижнего конца сгиба прямая дорожка пересечёт сгиб?':'Открой две грани как книжку. Какую долю длины общего ребра нужно пройти от его нижнего конца до пересечения с прямой дорожкой?',side?side/2:'1/2','Сгиб проходит посередине прямоугольника. Диагональ пересекает его ровно на половине высоты.',[{value:side?side:1,text:'Это самый конец ребра. Путь через него на развёртке образует излом.'}])];
    if(!side)rows[2].answerFormat='v5-unit-fraction';
    const final=step('Сколько разных кратчайших дорожек соединяют M и N по поверхности? Каждую считай в направлении от M к N.',6,'Для каждой из трёх первых граней есть две подходящие вторые. Посчитай все пары.',[{value:5,text:'Первые и вторые грани выбирают последовательно. Перечисли варианты продолжения для каждой первой грани.'},{value:12,text:'Одна дорожка из M в N имеет тот же след, если посмотреть на неё в обратную сторону. Считай каждый след один раз.'}]);
    return {...final,steps:rows,inputPrompt:'Количество дорожек',data:{antCube:{side,first}},conditionKey:'cube-ant/'+side+'/'+first};
  }
  function cube(){
    return '<svg role="img" aria-label="Куб, M наверху спереди слева, N внизу сзади справа" viewBox="0 0 254 166" style="width:100%;max-width:285px;display:block"><g stroke="#2d524c" stroke-width="2.2" stroke-linejoin="round"><path d="M36 50h102v97H36z" fill="#e3eee8"/><path d="M36 50l55-35h102l-55 35z" fill="#f4dfba"/><path d="M138 50l55-35v97l-55 35z" fill="#b9d8ce"/><path d="M36 147l55-35h102M91 112V15" fill="none" stroke-dasharray="5 4" stroke-width="1.4"/></g><g fill="#783a1f"><circle cx="36" cy="50" r="4"/><circle cx="193" cy="112" r="4"/></g><g style="font:bold 16px system-ui,sans-serif"><text x="17" y="45">M</text><text x="198" y="119">N</text></g></svg>';
  }
  function net(row,start,end,quarter){
    const x=131,y=105-20*quarter,edge=row.side?row.side+' см':'ребро',valid=allowed[start].includes(end);
    if(!valid)return '<p>Эти грани расположены напротив друг друга. Сгиба между ними нет. Попробуй другую вторую грань.</p>';
    return '<svg role="img" aria-label="Развёртка двух граней. Переход через '+quarter+' четвертей сгиба от его нижнего конца" viewBox="0 0 262 146" style="width:100%;max-width:360px;display:block"><g stroke="#355a51" stroke-width="2"><rect x="51" y="25" width="80" height="80" fill="#e3eee8"/><rect x="131" y="25" width="80" height="80" fill="#f3e1c3"/><path d="M131 25V105" stroke-dasharray="5 3"/><path d="M51 105L'+x+' '+y+'L211 25" stroke="#a04722" stroke-width="3" fill="none"/></g><circle cx="131" cy="'+y+'" r="4" fill="#a04722"/><g style="font:13px system-ui,sans-serif;fill:#1f4038"><text x="35" y="117">M</text><text x="216" y="22">N</text><text x="92" y="130" text-anchor="middle">'+starts[start]+'</text><text x="173" y="130" text-anchor="middle">'+ends[end]+'</text><text x="47" y="70" text-anchor="end">'+edge+'</text></g></svg>';
  }
  function draw(t){return '<figure style="margin:.4em 0">'+cube()+'<figcaption>Начни в M и доберись до N. По поверхности можно пересекать грани.</figcaption></figure>';}
  function explore(t,s){
    const row=t.data.antCube,valid=allowed[s.startFace].includes(s.endFace);
    return {title:'Разверни две грани',controls:[{key:'startFace',title:'Первая грань',values:starts.map((x,i)=>[i,x])},{key:'endFace',title:'Вторая грань',values:ends.map((x,i)=>[i,x])},{key:'quarter',title:'Где перейти сгиб',values:[[0,'Нижний конец'],[1,'Четверть'],[2,'Середина'],[3,'Три четверти'],[4,'Верхний конец']]}],
      visual:net(row,s.startFace,s.endFace,s.quarter),question:valid?'Сколько изломов у красной дорожки между M и N на этой развёртке?':'Сколько общих рёбер у выбранных граней?',answer:valid&&s.quarter!==2?1:0,
      why:valid?'Через середину сгиба отрезок продолжается прямо. При любом другом переходе он меняет направление.':'У противоположных граней нет общего ребра.'};
  }
  const api={lessons:[lesson],generators:{'5.111':generate},bounds:{'5.111':{startFace:[0,2,0],endFace:[0,2,0],quarter:[0,4,2]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5AntOnACube=api;
})(typeof window!=='undefined'?window:globalThis);
