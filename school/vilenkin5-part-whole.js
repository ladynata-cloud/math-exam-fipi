/* Виленкин и соавторы, 5 класс, часть 2, 2023, §26, печатная с. 15. */
(function(root){
  'use strict';
  const q=(typeof module!=='undefined'&&module.exports?require('./math.js'):root.WorkshopMath).q;
  const details=[
    ['Маршрут между посёлками','Сравни пройденную часть с длиной всего маршрута. Знаменатель отвечает за весь путь, числитель — за уже пройденное расстояние.','Если весь путь 11 км и пройдено 4 км, это 4/11 пути. Оставшиеся километры отвечают на другой вопрос.','Чтобы назвать долю пройденного пути, в знаменатель нужно поставить оставшиеся километры.','Почему при одинаковом пройденном расстоянии доли двух маршрутов могут отличаться?'],
    ['Три месяца високосного года','Посмотри, сколько дней в каждом из трёх месяцев. Во всех трёх вопросах целое одно — весь названный год.','В 365-дневном году январь составляет 31/365 года.','Для каждого месяца знаменателем служит число дней в этом месяце.','Почему февраль одного года может занимать иную долю, чем февраль другого?'],
    ['Четыре четверти учебного года','Учебные четверти различаются по продолжительности. Сначала восстанови неизвестное количество недель, потом сравни каждую часть с целым годом.','Если за первые три периода прошло 26 недель из 35, то последний длился 9 недель. Его доля равна 9/35.','Каждая учебная четверть всегда длится ровно четверть учебного года.','Как две разные по продолжительности четверти могут вместе занять ровно полгода?'],
    ['Какая доля земли отдыхает','Поле разделено на два посева и участок без посева. Для свободной площади сначала вычисли, сколько занято обоими посевами.','На 50 га два посева занимают 18 и 12 га. Свободно 20 га, их доля — 20/50.','Нельзя найти долю земли под паром, пока её площадь не дана в условии.','Почему долю участка можно вычислить и без перевода км² в м²?']
  ];
  const lessons=details.map(([title,explanation,example,misconception,reflect],i)=>({number:'5.'+(53+i),key:'printed-5-'+(53+i),part:2,point:26,page:15,title,explanation,worked:[example],misconception,reflect,requires:['v5f-printed-5-46'],related:[]}));
  const monthDays=(year)=>[31,(year%4===0&&year%100!==0||year%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  const months=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
  const ord=['первая','вторая','третья','четвёртая'];
  function generate(num,seed,r,step){
    let whole,parts,names,year=0,indices=[],unit,statement,steps=[],answer,prompt,why,errors=[];
    if(num===53){
      whole=seed?r(9,24):12;parts=[seed?r(2,whole-2):7];parts.push(whole-parts[0]);names=['проехал','осталось'];unit='км';statement='Весь путь между посёлками равен '+whole+' км, велосипедист уже проехал '+parts[0]+' км.';
      steps=[step(statement+' Какую часть всего пути составляет один километр?',q(1,whole),'Раздели весь маршрут на километры одинаковой длины.',[])];
      answer=q(parts[0],whole);prompt=statement+' Какую долю маршрута он уже проехал?';why='Один километр — 1/'+whole+' пути. В пройденной части '+parts[0]+' таких километров.';
      if(parts[0]!==parts[1])errors=[{value:q(parts[1],whole),text:'Это доля оставшегося пути. Посмотри на цветной участок от старта.'}];
    }else if(num===54){
      year=seed?[2023,2024,2025,2028][r(0,3)]:2024;
      const days=monthDays(year),start=seed?r(0,9):1;indices=[start,start+1,start+2];
      parts=indices.map(i=>days[i]);whole=days.reduce((a,b)=>a+b,0);names=indices.map(i=>months[i]);unit='дн.';
      statement=seed?'Для тренировки взят календарь '+year+' года.':'Возьми високосный год с 366 днями. В модели показан високосный 2024 год.';
      steps=[step(statement+' Сколько дней составляет весь год?',whole,'В високосном году в феврале есть день 29, а всего дней 366. В обычном году 365.',[])];
      for(const [i,m] of names.entries()){
        steps.push(step('Месяц — '+m+'. Какую долю всего года он составляет? Укажи обыкновенную дробь.',q(parts[i],whole),'Число дней месяца поставь над чертой, число дней года — под чертой.',[{value:q(1,12),text:'В году 12 месяцев, но у них разное число дней. Сравни именно дни.'}]));
      }
      const last=steps.pop();({prompt,answer,why,errors}=last);
    }else if(num===55){
      const a=seed?r(7,10):9,b=seed?r(6,9):7,c=seed?r(9,12):10,d=seed?r(7,10):8;parts=[a,b,c,d];whole=a+b+c+d;names=ord;unit='нед.';
      statement='В учебном году '+whole+' недель. Первая четверть длилась '+a+' нед., вторая — '+b+', третья — '+c+'.';
      steps=[step(statement+' Сколько недель осталось четвёртой четверти?',d,'Вычти из времени года все три известные продолжительности.',[])];
      for(const [i,v] of parts.entries())steps.push(step('Какую долю года составила '+ord[i]+' четверть? В году '+whole+' недель.',q(v,whole),'Сравни длительность этой четверти со всеми неделями.',4*v!==whole?[{value:q(1,4),text:'Учебные четверти названы по порядку. Найди долю по фактическому числу недель.'}]:[]));
      answer=q(b+c,whole);prompt=statement+' Какую долю всего года составили вторая и третья четверти вместе?';why='Сначала сложи '+b+' и '+c+', затем сравни результат с '+whole+'.';errors=[{value:q(b,whole),text:'Это только вторая четверть. Добавь недели третьей.'}];
    }else{
      whole=seed?10*r(8,19):120;const a=seed?r(21,35):49,b=seed?r(18,35):37;parts=[a,b,whole-a-b];names=['овёс','ячмень','под паром'];unit='км²';
      statement='Всего '+whole+' км². Под овсом '+a+' км², под ячменём '+b+' км², остальные поля в этом году оставили без посева.';
      steps=[step(statement+' Сколько квадратных километров занято обоими посевами?',a+b,'Сложи две засеянные площади.',[]),step('Какова площадь оставленного участка в км²?',parts[2],'Вычти площадь посевов из полной площади.',[{value:a+b,text:'Это засеянная площадь. Нужна земля без посева.'}])];
      answer=q(parts[2],whole);prompt=statement+' Какую долю всей площади оставили под паром?';why='Сравни '+parts[2]+' км² с '+whole+' км²: обе площади уже выражены в одинаковых единицах.';errors=[{value:q(a+b,whole),text:'Эта дробь описывает оба посева. Вопрос о свободной земле.'}];
    }
    return {steps,prompt,answer,why,errors,inputPrompt:'Доля целого',data:{partWhole:{num,whole,parts,names,year,indices,unit,statement}},conditionKey:'part-whole/'+num+'/'+year+'/'+indices+'/'+whole+'/'+parts.join('/')};
  }
  const col=['#26796c','#d1a155','#6491b0','#9d76a0'];
  function diagram(x,which=-1,show=false){
    if(x.num===54){
      const at=which<0?0:which,d=x.parts[at],month=x.indices[at],offset=(new Date(Date.UTC(x.year,month,1)).getUTCDay()+6)%7;
      let cells='';
      for(let i=0;i<offset;i++)cells+='<span aria-hidden="true"></span>';
      for(let i=1;i<=d;i++)cells+='<span style="background:'+(i===d?'#c4e4cf':'#eff4f1')+';text-align:center">'+i+'</span>';
      return '<figure style="margin:.4em 0"><figcaption>'+x.names[at]+' · '+x.year+'. Каждая клетка — один день.</figcaption><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;max-width:16em">'+cells+'</div></figure>';
    }
    const tags=x.names.map((n,i)=>'<span style="display:inline-block;margin:.12em .5em .12em 0"><b style="color:'+col[i]+'">■</b> '+n+'</span>').join('');
    let pos=8,tiles='';for(let i=0;i<x.parts.length;i++){const width=244*x.parts[i]/x.whole;tiles+='<rect x="'+pos+'" y="13" width="'+width+'" height="26" fill="'+col[i]+'" opacity="'+(which<0||i===which?'1':'.36')+'" stroke="#293e40"/>';pos+=width;}
    const fine=x.num===53?Array.from({length:x.whole-1},(_,i)=>'<path d="M'+(8+244*(i+1)/x.whole)+' 33v6" stroke="#203a34"/>').join(''):'';
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Части одной величины, целое '+x.whole+' '+x.unit+'" viewBox="0 0 262 50" style="width:100%;max-width:24rem">'+tiles+fine+'</svg><figcaption>'+tags+'</figcaption></figure>';
  }
  function draw(t,s){
    const x=t.data.partWhole;const i=s?.mode==='learn'?s.step:t.steps.length;
    return diagram(x,x.num===54?Math.min(2,Math.max(0,i-1)):-1);
  }
  function explore(t,s){
    const x=t.data.partWhole,n=x.parts[s.pick],mode=s.modeIndex;
    return {title:x.num===54?'Полистай календарь и сравни длительности':'Выбери участок и сравни с целым',controls:[{key:'pick',title:'Часть',values:x.names.map((v,i)=>[i,v])},{key:'modeIndex',title:'Вопрос',values:[[0,'Доля выбранной части'],[1,'Доля всего остального']]}],visual:diagram(x,s.pick),question:mode?'Какую долю целого занимают все остальные '+(x.num===54?'дни года?':'участки вместе?'):'Какую долю целого составляет выбранная часть?',answer:q(mode?x.whole-n:n,x.whole),why:'Сравни '+(mode?x.whole+' − '+n:n)+' с '+x.whole+' '+x.unit+'.'};
  }
  const bounds={},generators={};for(const [i,count] of [2,3,4,3].entries()){
    const n=53+i;bounds['5.'+n]={pick:[0,count-1,0],modeIndex:[0,1,0]};generators['5.'+n]=(s,r,f)=>generate(n,s,r,f);
  }
  const api={lessons,generators,bounds,draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PartWhole=api;
})(typeof window!=='undefined'?window:globalThis);
