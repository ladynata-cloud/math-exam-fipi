/* Виленкин и соавторы, 5 класс, часть 2, 2023, §26, печатные с. 13–14. */
(function(root){
  'use strict';
  const lessons=[
    {number:'5.43',key:'printed-5-43',part:2,point:26,page:13,title:'Узнай единицу измерения по её доле',requires:['v5f-printed-5-18','v5f-printed-5-19'],related:[],explanation:'Сначала назови величину: длина, масса, деньги, время, площадь или объём. Выбери меньшую единицу той же величины. Проверь, сколько таких единиц составляют целую.',
      worked:['В метре десять дециметров, значит, одна десятая метра — дециметр.','Длину, площадь и объём нельзя переводить одним и тем же правилом. Если стороны поделить на 10, клеток получится 10 · 10, а кубиков 10 · 10 · 10.'],
      misconception:'Если маленькая единица встретилась в задаче о площади, можно записать просто её название как для длины.',reflect:'Почему миллионная часть квадратного метра и миллионная часть кубического метра называются по-разному?'},
    {number:'5.44',key:'printed-5-44',part:2,point:26,page:14,title:'Раздели квадрат на четверти несколькими способами',requires:['v5f-printed-5-42'],related:[],explanation:'У квадрата четыре равные доли могут выглядеть по-разному. Можно провести три параллельные линии и получить полосы. Можно провести две перпендикулярные прямые через центр и поворачивать обе вместе. Поворот квадрата на четверть оборота переводит каждую такую часть в следующую.',
      worked:['У квадрата со стороной 4 см площадь 16 см². Одна четверть занимает 4 см².','Две четверти занимают 8 см², три четверти — 12 см². На трёх отдельных рисунках можно показать все эти случаи.'],
      misconception:'Раз у квадрата четыре доли, существует ровно четыре способа разделить его.',reflect:'Как получить ещё один способ, слегка повернув два перпендикуляра вокруг центра?'}
  ];
  const units=[
    {whole:'метра',den:10,label:'дециметр',short:'дм',forms:['дециметр','дециметра','дм'],proof:'В 1 м десять дециметров.',near:['сантиметр','см'],hint:'Сантиметров в метре сто. Нужна более крупная единица.'},
    {whole:'тонны',den:100,label:'10 килограммов',short:'кг',amount:10,forms:['10 килограммов','десять килограммов','10 килограмм','десять килограмм','10 кг','0,1 ц','1/10 центнера'],proof:'1 т = 1000 кг. Сотая часть тонны — 1000 : 100 = 10 кг.',near:['килограмм','кг','центнер','ц'],hint:'Мысленно раздели 1000 килограммов на сто равных групп. В группе больше одного килограмма и меньше центнера.'},
    {whole:'рубля',den:100,label:'копейка',short:'коп.',forms:['копейка','копейки','коп','коп.','к'],proof:'Сто копеек составляют рубль.',near:['рубль','руб'],hint:'Доля рубля меньше целого рубля. Вспомни мелкую денежную единицу.'},
    {whole:'суток',den:24,label:'час',short:'ч',forms:['час','часа','ч'],proof:'В сутках 24 часа.',near:['минута','мин'],hint:'Минут 60 в часе. Посмотри, каких единиц в сутках 24.'},
    {whole:'минуты',den:60,label:'секунда',short:'с',forms:['секунда','секунды','с','сек','сек.'],proof:'60 секунд составляют минуту.',near:['час','ч'],hint:'Нужна единица меньше минуты.'},
    {whole:'квадратного метра',den:1000000,label:'квадратный миллиметр',short:'мм²',forms:['квадратный миллиметр','квадратного миллиметра','мм²','кв мм','кв. мм','миллиметр квадратный'],proof:'Вдоль каждой стороны метра 1000 мм. На квадратном метре 1000 · 1000 = 1 000 000 квадратных миллиметров.',near:['миллиметр','мм','см²'],hint:'Считаются клетки, а не отрезки. Вдоль каждой из двух сторон 1000 миллиметров.'},
    {whole:'кубического метра',den:1000000,label:'кубический сантиметр',short:'см³',forms:['кубический сантиметр','кубического сантиметра','см³','куб см','куб. см','сантиметр кубический','миллилитр','мл'],proof:'На метре 100 см. Куб с ребром 1 м содержит 100 · 100 · 100 = 1 000 000 кубических сантиметров.',near:['сантиметр','см','мм³'],hint:'Считаются кубики. Нужны три множителя, по одному для каждого направления.'},
    {whole:'гектара',den:100,label:'ар (сотка)',short:'а',forms:['ар','ара','а','сотка','сотки','100 м²','сто квадратных метров','100 квадратных метров'],proof:'В гектаре 10 000 м². Сотая часть гектара занимает 100 м². Эта единица называется ар, или сотка.',near:['метр','м²','гектар','га'],hint:'Одна сотая от 10 000 м² — площадка 10 м на 10 м.'}
  ];
  const otherUnits=[
    ['метра',100,'сантиметр',['сантиметр','см'],'1 м = 100 см.','дециметр','Дециметров в метре десять.'],
    ['метра',1000,'миллиметр',['миллиметр','мм'],'1 м = 1000 мм.','сантиметр','Сантиметров в метре сто.'],
    ['тонны',10,'центнер',['центнер','ц','100 кг'],'1 т = 10 ц.','килограмм','В тонне тысяча килограммов и десять центнеров.'],
    ['тонны',1000,'килограмм',['килограмм','кг'],'1 т = 1000 кг.','центнер','Центнеров в тонне десять.'],
    ['килограмма',1000,'грамм',['грамм','г'],'1 кг = 1000 г.','килограмм','Ищем меньшую единицу массы.'],
    ['часа',60,'минута',['минута','мин','мин.'],'1 час = 60 мин.','секунда','В одном часе гораздо больше шестидесяти секунд.'],
    ['гектара',10000,'квадратный метр',['квадратный метр','м²','кв. м'],'1 га = 10 000 м².','ар','Аров в гектаре сто, квадратных метров десять тысяч.'],
    ['кубического метра',1000,'кубический дециметр',['кубический дециметр','дм³','куб. дм','литр','л'],'1 м³ = 10 · 10 · 10 дм³. Один кубический дециметр равен одному литру.','мл','Миллилитров в кубическом метре миллион.']
  ];
  for(const [whole,den,label,forms,proof,near,hint] of otherUnits)units.push({whole,den,label,forms,proof,near:[near],hint});
  const normal=x=>String(x).toLowerCase().replaceAll('ё','е').replace(/м\^?2/gu,'м²').replace(/м\^?3/gu,'м³').replace(/(\d)([а-я])/gu,'$1 $2').replace(/[.]/g,'').replace(/\s+/g,' ').trim();
  function textAnswer(raw,row){const x=normal(raw),u=typeof row==='number'?units[row]:units.find(item=>item.label===row);if(!u)return false;if(x===normal(u.label))return true;return u.forms.some(f=>{const m=normal(f);return x===m||(!u.amount&&!/^\d/.test(m)&&x==='1 '+m);});}
  function rowTask(seed,r,step){
    const order=Array.from({length:8},(_,i)=>i);
    if(seed){
      const extras=Array.from({length:8},(_,i)=>8+i);for(let i=7;i>0;i--){const j=r(0,i);[extras[i],extras[j]]=[extras[j],extras[i]];}
      const count=3+seed%4;for(let i=0;i<count;i++)order[(seed+i)%8]=extras[i];for(let i=7;i>0;i--){const j=r(0,i);[order[i],order[j]]=[order[j],order[i]];}
    }
    const parts=order.map((id,i)=>{const u=units[id];return {...step('абвгдежз'[i]+'. Как называется или как выражается в меньших единицах 1/'+u.den+' '+u.whole+'?'+(u.amount?' Запиши массу в килограммах вместе с единицей.':''),u.label,u.proof,u.near.map(value=>({value,text:u.hint}))),answerFormat:'v5-named-unit',unitRow:id};});
    const final=parts.pop();return {...final,steps:parts,inputPrompt:'Название единицы или величина с единицей',why:units[final.unitRow].proof,data:{namedUnits:order},conditionKey:'unit-names/'+order.join('/')};
  }
  function unitCard(u){
    const count=u.den.toLocaleString('ru-RU');return '<figure style="margin:.4em 0;padding:.6em;background:#eaf3ef;border:1px solid #73928d"><figcaption>Всё целое — '+({часа:'1 час',килограмма:'1 кг',метра:'1 м',тонны:'1 т',рубля:'1 рубль',суток:'одни сутки',минуты:'1 мин',гектара:'1 га','квадратного метра':'1 м²','кубического метра':'1 м³'}[u.whole])+'.</figcaption><p>Его разделили на '+count+' равных частей. Рассматриваем одну такую часть.</p></figure>';
  }
  function quarters(seed,r,step){
    const side=seed?4*r(1,6):8,area=side*side,one=area/4;
    return {steps:[step('Сторона квадрата '+side+' см. Какова площадь квадрата в см²?',area,'Площадь — длина стороны, умноженная на длину стороны.',area!==4*side?[{value:4*side,text:'Это периметр. Посчитай клетки внутри квадрата.'}]:[]),step('а. На первом рисунке отметь одну четверть. Сколько см² занимает отмеченная часть?',one,'Раздели площадь всего квадрата на четыре.',[]),step('б. На втором рисунке отметь половину. Сколько см² займут две из четырёх долей?',2*one,'В половине две четверти.',[{value:one,text:'Такова площадь одной четверти. Для половины возьми две.'}])],
      prompt:'в. На третьем рисунке отметь три четверти квадрата со стороной '+side+' см. Какова их площадь в см²? Испытай несколько способов деления в модели.',answer:3*one,inputPrompt:'Площадь в см²',errors:[{value:one,text:'Это одна четверть. Нужно три такие равные площади.'}],why:area+' : 4 · 3 = '+3*one+' см². Делений бесконечно много: две перпендикулярные прямые через центр можно совместно повернуть на любой угол от 0 до 45°.',data:{quarterPicture:{side}},conditionKey:'quarter-square/'+side};
  }
  function square(side,kind,k,angle){
    const x=12,y=12,size=160,c=92;
    let draw='';
    if(kind===0){for(let i=0;i<4;i++)draw+='<rect x="'+(x+i*40)+'" y="'+y+'" width="40" height="160" fill="'+(i<k?'#8cc9b8':'#fff')+'" stroke="#365255" stroke-width="1.4"/>';}
    else{
      const boundary=deg=>{const v=deg*Math.PI/180,dx=Math.cos(v),dy=Math.sin(v),radius=80/Math.max(Math.abs(dx),Math.abs(dy));return [c+dx*radius,c+dy*radius];};
      for(let i=0;i<4;i++){
        const start=angle+90*i,end=start+90,pts=[[c,c],boundary(start)];
        for(let corner=45;corner<=405;corner+=90)if(corner>start&&corner<end)pts.push(boundary(corner));
        pts.push(boundary(end));draw+='<polygon points="'+pts.map(point=>point.map(x=>x.toFixed(5)).join(',')).join(' ')+'" fill="'+(i<k?'#8cc9b8':'#fff')+'" stroke="#365255" stroke-width="1.6"/>';
      }
    }
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Квадрат со стороной '+side+' см. Закрашено частей из четырёх: '+k+'" viewBox="0 0 184 184" style="width:100%;max-width:15rem;display:block">'+draw+'<rect x="12" y="12" width="160" height="160" fill="none" stroke="#30484c" stroke-width="2"/></svg><figcaption>Сторона '+side+' см; закрашено '+k+' четвертей.</figcaption></figure>';
  }
  function visual(t,s){
    if(t.data.namedUnits){const i=s?.mode==='learn'?s.step:t.steps.length;return unitCard(units[t.data.namedUnits[Math.min(7,i)]]);}
    const n=s?.mode==='learn'?Math.min(s.step,3):3;return square(t.data.quarterPicture.side,n===1?0:1,n,n===3?25:0);
  }
  function explore(t,s){
    if(t.data.namedUnits){const u=units[t.data.namedUnits[s.row]];return {title:'Соедини долю с целой величиной',controls:[{key:'row',title:'Выбери величину',values:t.data.namedUnits.map((id,i)=>[i,'1/'+units[id].den+' '+units[id].whole])}],visual:unitCard(u),question:'Сколько таких одинаковых долей нужно взять, чтобы получить целую величину?',answer:u.den,why:u.proof};}
    const side=t.data.quarterPicture.side;return {title:'Выбери деление и закрась доли',controls:[{key:'kind',title:'Как разделить',values:[[0,'Четыре полосы'],[1,'Две прямые через центр']]},...(s.kind?[{key:'angle',title:'Поворот прямых, градусы',min:0,max:45,step:1}]:[]),{key:'count',title:'Сколько четвертей выделить',values:[[1,'Одну'],[2,'Две'],[3,'Три']]}],visual:square(side,s.kind,s.count,s.kind?s.angle:0),question:'Какова площадь выделенной части в см²?',answer:side*side*s.count/4,why:'Четыре площади равны. Поворот меняет расположение линий, но каждая часть по-прежнему занимает четверть квадрата.'};
  }
  const api={lessons,generators:{'5.43':rowTask,'5.44':quarters},bounds:{'5.43':{row:[0,7,0]},'5.44':{kind:[0,1,1],angle:[0,45,0],count:[1,3,1]}},textAnswer,taskDrawing:visual,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5NamedParts=api;
})(typeof window!=='undefined'?window:globalThis);
