/* Grade 5, part 1, pp. 31–32. Author's packing, scale and calculation models. */
(function(root) {
  'use strict';
  const descriptions=[
    ['1.159',31,'Найди число маленьких пакетов','Переведи весь заказ в граммы. Вычти массу уже известных пакетов. В остатке находятся только пакеты второго размера.','Из 1000 г отложим два пакета по 200 г. Оставшиеся 600 г — это четыре пакета по 150 г.','Чтобы найти маленькие пакеты, можно разделить на их массу весь заказ.'],
    ['1.160',31,'Собери обе линии фасовки','Найди выпуск всех машин первой линии за минуту. Выполни то же для второй. Обе линии работают одновременно. Их совместный выпуск за минуту покажет, на что делить размер заказа.','Если линии фасуют 24 и 16 пакетов за минуту, вместе они фасуют 40. На 200 пакетов уходит пять минут.','Если две линии работают одновременно, получится сумма времён работы каждой по отдельности.'],
    ['1.161',32,'Измерь рыб по общей шкале','Нос и конец хвоста не обязаны совпадать с нулём. Найди обе отметки и вычти меньшую из большей. Затем переведи разность длин в нужную единицу.','От отметки 20 см до 80 см рыба занимает 60 см. Разница между длинами 90 см и 60 см — это 0,3 м.','Отметка у хвоста всегда равна длине рыбы.'],
    ['1.162',32,'Проверь порядок действий','При последовательном умножении и делении двигайся слева направо. Действия в скобках выполняются до умножения снаружи.','Чтобы посчитать 240 : 6 : 4, сначала получи 40, а затем 10.','При двух делениях подряд можно сначала поделить второй делитель на первый.']
  ];
  const lessons=descriptions.map(([number,page,title,explanation,example,misconception])=>({number,page,title,explanation,worked:[example],misconception,
    key:'printed-'+number.replace('.','-'),part:1,point:5,requires:[number==='1.161'?'v5f-printed-1-155':number==='1.160'?'v5f-printed-1-152':'v5f-printed-1-154'],
    related:['v5f-printed-1-156'],reflect:'Как проверить ответ в тех же единицах, что в вопросе?'}));
  const err=(value,text)=>({value,text});
  function nuts(seed,r,step){
    const given=seed?r(2,6):3,large=seed?r(4,8)*50:250,small=seed?r(2,5)*25:150,missing=seed?r(3,9):5;
    const known=large*given,rest=small*missing,total=known+rest,kg=Math.floor(total/1000),g=total%1000;
    return {prompt:'Сколько пакетов орехов по '+small+' г входит в покупку?',inputPrompt:'Количество таких пакетов',answer:missing,conditionKey:[given,large,small,missing].join('/'),
      data:{pack:{given,large,small,total}},table:{caption:'Вся покупка — '+kg+' кг '+g+' г',headers:['Пакеты','Сколько их'],rows:[['По '+large+' г',given],['По '+small+' г','Нужно узнать']]},
      steps:[step('Сколько граммов во всей покупке?',total,'Переведи килограммы в граммы и прибавь остальные граммы.',[err(kg+g,'Килограммы и граммы пока разные единицы.')]),
        step('Сколько граммов в известных пакетах по '+large+' г?',known,'Умножь массу одного пакета на их количество.'),
        step('Сколько граммов расфасовано в оставшиеся пакеты?',rest,'Из всей покупки вычти массу известных пакетов.',[err(total-large,'Вычтен только один пакет. Все известные пакеты надо учесть.')])],
      errors:[err(total+'/'+small,'В общей массе есть и пакеты другого размера. Сначала отдели их.'),err(rest,'Это граммы в оставшейся части покупки. Сколько пакетов в них помещается?')]};
  }
  function beans(seed,r,step){
    const lines=seed?[[r(3,8),r(8,14)],[r(2,6),r(11,18)]]:[[6,12],[4,15]],rates=lines.map(([n,v])=>n*v),combined=rates[0]+rates[1],time=seed?r(4,15):9,total=combined*time;
    return {prompt:'За сколько минут обе линии расфасуют заказ в '+total+' пакетов?',inputPrompt:'Время в минутах',answer:time,conditionKey:[...lines.flat(),time].join('/'),data:{lines,total},
      table:{caption:'Аппараты работают вместе',headers:['Линия','Аппараты и выпуск каждого за минуту'],rows:[['Первая',lines[0][0]+' шт. по '+lines[0][1]+' пакетов'],['Вторая',lines[1][0]+' шт. по '+lines[1][1]+' пакетов']]},
      steps:[step('Сколько пакетов выдаёт первая линия за минуту?',rates[0],'Умножь два числа для первой линии.',[err(lines[0][1],'Это выпуск одного аппарата первой линии. Сколько их работает?')]),
        step('Сколько пакетов выдаёт вторая линия за минуту?',rates[1],'Умножь число аппаратов второй линии на выпуск одного.'),
        step('Сколько пакетов выдадут обе линии вместе за одну минуту?',combined,'Сложи минутные выпуски линий.')],
      errors:[err(combined,'Это пакеты за минуту. Узнай, сколько таких порций в полном заказе.'),err(total+'/'+lines[0][1],'Заказ обрабатывают аппараты обеих линий, а не один аппарат первой.')]};
  }
  const labels=['Щука','Карась','Окунь','Судак','Язь'];
  const sourceFish=[[0,150],[0,40],[10,110],[30,150],[70,140]];
  const measure=([left,right])=>right-left;
  const pairs=[[0,1],[0,3],[2,4],[0,4]];
  function metres(cm){
    if(cm%100===0)return cm/100;
    let a=cm,b=100;while(b){const next=a%b;a=b;b=next;}
    return {n:cm/a,d:100/a};
  }
  function fish(seed,r,step){
    const small=r(2,4),medium=r(5,7),perch=medium+r(1,3),zander=perch+r(1,2),pike=zander+r(1,3);
    const lengths=seed?[pike,small,perch,zander,medium]:[],measures=seed?lengths.map((len,i)=>{const start=i?r(0,4):0;return [start*10,(start+len)*10];}):sourceFish;
    const cm=measures.map(measure),steps=measures.map(([a,b],i)=>step('а. '+labels[i]+'. Сколько сантиметров от носа до крайней точки хвоста?',cm[i],'Найди на шкале начало и конец. Из правой отметки вычти левую.',a?[err(b,'У хвоста показана координата конца. Вычти отметку, где начинается рыба.')]:[]));
    const questions=['б. На сколько метров щука длиннее карася?','б. На сколько метров щука длиннее судака?','в. На сколько метров язь короче окуня?','в. На сколько метров язь короче щуки?'];
    for(const [k,[i,j]] of pairs.entries()){
      const diff=cm[i]-cm[j];steps.push(step(questions[k],metres(diff),'Сначала сравни обе длины в сантиметрах. Затем раздели разность на 100, чтобы получить метры.',[err(diff,'Это сантиметры. В вопросе просят метры.'),err(String(diff/10),'Одно деление — 10 см. В целом метре десять таких делений, то есть 100 см.')]));
    }
    const last=steps.pop();
    return {prompt:last.prompt,inputPrompt:'Разность в метрах',answer:last.answer,errors:last.errors,steps,conditionKey:measures.map(u=>u.join(':')).join('/'),
      data:{fish:measures},table:{caption:'Один промежуток на шкале равен 10 см',headers:['Рыба','Нос — хвост, см'],rows:measures.map((u,i)=>[labels[i],u.join(' — ')])}};
  }
  function silhouettes(fishList,selected=null){
    const max=Math.max(...fishList.map(row=>row[1])),height=selected===null?187:90,from=14,limit=263;
    const x=n=>from+(limit-from)*n/max,which=selected===null?[0,1,2,3,4]:[selected],axis=height-21;
    const grid=Array.from({length:max/10+1},(_,i)=>'<path d="M'+x(i*10)+' 12V'+(axis+4)+'" stroke="#d1dfdf"/>').join('');
    let items='';for(const [j,i] of which.entries()){
      const [l,r]=fishList[i],a=x(l),w=x(r)-a,y=selected===null?28+j*29:38;
      const pos=f=>a+w*f,col=['#376b60','#a97339','#326e82','#807443','#90634f'][i];
      items+='<g><text x="14" y="'+(y-8)+'" style="font:14px sans-serif;fill:#193f3a">'+labels[i]+'</text><path d="M'+a+' '+y+' Q'+pos(.32)+' '+(y-10)+' '+pos(.82)+' '+(y-2)+' L'+pos(1)+' '+(y-6)+' L'+pos(.97)+' '+y+' L'+pos(1)+' '+(y+6)+' L'+pos(.82)+' '+(y+2)+' Q'+pos(.24)+' '+(y+9)+' '+a+' '+y+'Z" fill="'+col+'"/><circle cx="'+pos(.10)+'" cy="'+(y-1)+'" r="1.6" fill="white"/></g>';
    }
    const tickLabels=[0,...Array.from({length:Math.floor((max-1)/50)},(_,i)=>(i+1)*50).filter(n=>max-n>=30),max];
    const ticks=tickLabels.map(n=>'<text x="'+x(n)+'" y="'+(axis+16)+'" text-anchor="middle" style="font:14px sans-serif;fill:#243e3a">'+n+'</text>').join('');
    return '<svg viewBox="0 0 279 '+height+'" role="img" aria-label="Схема измерения в сантиметрах. '+which.map(i=>labels[i]+': '+fishList[i].join(' — ')).join('; ')+'">'+grid+items+'<path d="M'+from+' '+axis+'H'+limit+'" stroke="#365d58"/>'+ticks+'</svg>';
  }
  function calculations(seed,r,step){
    const rows=seed?[[r(11,60)*3,r(24,84),0],[r(31,150),r(11,39),r(12,29)],[r(100,390),r(200,340),r(8,16),r(12,18)],[r(700,1300),r(260,400),r(400,650),r(24,67)]]:[[102,61,183],[93100,38,25],[378,315,19,35],[2436,218,2314,59]];
    if(seed){rows[0][2]=rows[0][1]*3;rows[1][0]*=rows[1][1]*rows[1][2];}
    const [a,b,c,d]=rows,values=[a[0]*a[1]/a[2],b[0]/b[1]/b[2],c[0]+c[1]-c[2]*c[3],(d[0]+d[1]-d[2])*d[3]],forms=[a[0]+' × '+a[1]+' : '+a[2],b.join(' : '),c[0]+' + '+c[1]+' − '+c[2]+' × '+c[3],'('+d[0]+' + '+d[1]+' − '+d[2]+') × '+d[3]];
    const first=[a[0]*a[1],b[0]/b[1],c[2]*c[3],d[0]+d[1]];
    const steps=values.map((v,i)=>step('абвг'[i]+'. '+forms[i]+'. Каков результат?',v,i===2?'Вычисли произведение, прежде чем вычитать.':i===3?'Закончи оба действия в скобках и лишь затем умножь.':'Умножение и деление выполняй в порядке записи.',[err(first[i],'Ты выполнил первое действие. Закончи оставшиеся действия.')]));
    return {prompt:'Запиши по порядку результаты всех четырёх выражений.',inputPrompt:'Четыре числа через точку с запятой',answer:values,answerFormat:'v5-list',steps,
      conditionKey:forms.join('/'),data:{forms,first,firstForm:[a[0]+' × '+a[1],b[0]+' : '+b[1],c[2]+' × '+c[3],d[0]+' + '+d[1]]},table:{caption:'Все четыре выражения',headers:['Пункт','Выражение'],rows:forms.map((v,i)=>['абвг'[i],v])},errors:[]};
  }
  const menu=(key,title,values)=>({key,title,values:values.map((v,i)=>[i,v])});
  function explore(l,s,t,table){
    const d=t.data;
    if(d.pack){const {given,large,total}=d.pack,k=Math.min(s.known,given);return {title:'Отложи известные упаковки',controls:[menu('known','Сколько известных пакетов отложить',Array.from({length:given+1},(_,i)=>i))],visual:table('Масса покупки',['Всего','Уже отложили'],[[total+' г',k+' шт. по '+large+' г']]),question:'Сколько граммов ещё осталось в покупке?',answer:total-k*large,why:'От общей массы вычитаем только те упаковки, которые действительно отложили.'};}
    if(d.lines){const [n,v]=d.lines[s.line],minutes=s.minutes+1;return {title:'Проверь фасовочную линию',controls:[menu('line','Линия',['Первая','Вторая']),menu('minutes','Сколько минут',[1,2,3,4,5])],visual:table('Аппараты одной линии',['Аппарат','За одну минуту'],Array.from({length:n},(_,i)=>[i+1,v+' пакетов'])),question:'Сколько пакетов вся выбранная линия выпустит за '+minutes+' мин?',answer:n*v*minutes,why:'Учитывай каждый аппарат и каждую минуту.'};}
    if(d.fish){const a=d.fish[s.row];return {title:'Измерь один силуэт',controls:[menu('row','Рыба',labels)],visual:silhouettes(d.fish,s.row),question:'Чему равна длина этой рыбы в сантиметрах?',answer:measure(a),why:'Правая отметка минус левая: '+a[1]+' − '+a[0]+' = '+measure(a)+' см.'};}
    return {title:'Найди первое вычисление',controls:[menu('row','Пункт',[...'абвг'])],visual:table('Выбранное выражение',['Полная запись','Первое действие'],[[d.forms[s.row],d.firstForm[s.row]]]),question:'Что получится после первого действия?',answer:d.first[s.row],why:'Полученное число подставь в исходное выражение и продолжи по порядку действий.'};
  }
  const generators={'1.159':nuts,'1.160':beans,'1.161':fish,'1.162':calculations};
  const bounds={'1.159':{known:[0,6,0]},'1.160':{line:[0,1,0],minutes:[0,4,0]},'1.161':{row:[0,4,0]},'1.162':{row:[0,3,0]}};
  const api={lessons,generators,bounds,explore,silhouettes};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PacksFish=api;
})(typeof window!=='undefined'?window:globalThis);
