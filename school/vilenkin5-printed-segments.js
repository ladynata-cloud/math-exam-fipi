/* Individual constructions and point relations, printed point 3, page 18. */
(function(root){
  'use strict';
  const aliases={А:'A',В:'B',С:'C',Д:'D',Н:'H',К:'K',М:'M',О:'O',Р:'P',Х:'X',П:'P'};
  function letters(value){
    return String(value).toUpperCase().split('').map(c=>aliases[c]||c).join('');
  }
  function canonical(value,kind){
    const s=letters(value).trim();
    if(kind==='v5-equal-segments'){
      const groups=s.split(';').map(line=>line.trim().split(/\s*=\s*/));
      if(groups.length!==2||groups.some(pair=>pair.length!==2))return null;
      const read=groups.map(pair=>canonical(pair.join(' '),'v5-segments'));
      if(read.some(group=>!group||group.split(' ').length!==2)||read[0]===read[1])return null;
      return read.sort().join(';');
    }
    if(kind==='v5-segments'){
      const pairs=s.split(/[\s,;]+/);
      if(!pairs.length||pairs.some(pair=>!/^[A-Z]{2}$/.test(pair)||pair[0]===pair[1]))return null;
      return [...new Set(pairs.map(pair=>[...pair].sort().join('')))].sort().join(' ');
    }
    if(kind==='v5-line-points'){
      const a=s.replace(/[\s,;]+/g,'');
      if(!a||!/^[A-Z]+$/.test(a))return null;
      return [...new Set(a)].sort().join('');
    }
    return null;
  }
  function mistake(input,t){
    const v=canonical(input,t.answerFormat);
    if(!v)return '';
    const found=(t.nearSets||[]).find(item=>canonical(item.set,t.answerFormat)===v);
    if(found)return found.text;
    if(t.answerFormat==='v5-segments'&&v.split(' ').length!==canonical(t.answer,t.answerFormat).split(' ').length)return 'Проверь число различных пар концов. Обратная запись той же пары не создаёт нового отрезка.';
    return '';
  }
  function accepts(input,t){
    const read=canonical(input,t.answerFormat);
    return read!==null&&[t.answer,...t.alternatives||[]].some(value=>canonical(value,t.answerFormat)===read);
  }
  const info=[
    ['1.46','Переносим длину циркулем','Не меняя раствор циркуля между измерениями, посмотри, совпала ли вторая ножка с концом другого отрезка. Направление отрезка не меняет расстояния между концами.',['Предположим, длина первого отрезка равна шести делениям. Отложи эти шесть делений на другой линии.','Если вторая ножка встанет точно на отмеченный конец, длины равны. Если она не дошла или прошла дальше, длины различны.','Для переноса на луч поставь первую ножку в его начало, сохрани раствор и отметь вторую точку.'],'При повороте отрезка его длина обязательно уменьшается.','Что произойдёт с построенной копией, если по дороге раздвинуть циркуль?'],
    ['1.47','Из трёх участков складываем целую длину','Сначала восстанови длину средней части. Длина до второй внутренней точки включает две части. Для последней части надо разделить именно этот составной отрезок на указанное число.',['На прямой идут U, A, B, V. Пусть UA равен 13 см, а AB короче на 2 см. Тогда AB равен 11 см, UB равен 24 см.','Если BV в три раза короче UB, его длина равна 8 см. Вся длина равна 32 см.','Проверка: 13 + 11 + 8 = 32, а 3 × 8 = 24.'],'Слова «на три меньше» и «в три раза меньше» требуют одного и того же действия.','От какой длины в этом задании надо найти третью часть?'],
    ['1.42','Две внутренние точки и три части','Одна внутренняя точка разбивает отрезок на две соседние части. Каждая следующая новая точка внутри одной из частей создаёт ещё одну часть. Название части состоит из двух её концов.',['Если U, A, B и V следуют в таком порядке, части — UA, AB, BV.','Можно записать AU вместо UA: поменялся порядок букв, но концы остались теми же.','UV — весь исходный отрезок. UB охватывает две соседние части.'],'Если поменять буквы в названии отрезка местами, его длина изменится.','Что в твоём списке изменилось бы, если переставить внутренние точки местами?'],
    ['1.43','От координат четырёх точек ко всем шести длинам','Сначала обозначь концы и две внутренние точки. Выбери каждую пару концов ровно один раз. На шкале длина между точками равна разности их отметок.',['Отметки трёх точек равны 0, 3 и 8 см. Из них получаются три отрезка.','От первой до последней 8 см. От второй до последней 8 − 3 = 5 см.','Проверка: два соседних промежутка вместе дают 3 + 5 = 8 см.'],'Если четыре точки расположены в ряд, между ними можно назвать только три отрезка.','Как выписать все пары, не повторив одну пару в обратном порядке?'],
    ['1.44','Принадлежит ли точка выбранному отрезку?','Проведи взглядом от первого указанного конца до второго. Включи сами концы, а также все отмеченные точки на этой части прямой. Продолжение прямой за концом не входит в отрезок.',['Пусть A, K, B и T лежат последовательно на одной прямой.','К отрезку AB принадлежат A, K и B. Точка T уже за его концом.','Точка над прямой тоже не принадлежит AB, даже если её подпись оказалась над отрезком. Ориентируйся на положение точки, а не буквы.'],'Любая точка прямой принадлежит каждому её отрезку.','Как определить, за концом отрезка находится точка или внутри?'],
    ['1.45','Перечисляем точки строго между двумя концами','Сначала найди названные концы. Пройди вдоль отрезка от одного к другому и запиши встреченные внутренние точки. Саму начальную и конечную точку сейчас не записывают.',['Если порядок U, V, W, X, Y, то между U и X находятся V и W.','От X к U встретим те же точки в обратном порядке.','Между V и X окажется только W.'], 'Концы выбранного отрезка обязательно входят в список точек между ними.','Если пройти от второго конца к первому, изменится ли множество внутренних точек?']
  ];
  const lessons=info.sort((a,b)=>Number(a[0].split('.')[1])-Number(b[0].split('.')[1])).map(([number,title,explanation,worked,misconception,reflect])=>({number,key:'printed-'+number.replace('.','-'),part:1,point:3,page:18,title,explanation,worked,misconception,reflect,requires:['v5f-segment-length'],related:['v5f-scale-point']}));
  function ask(step,text,answer,format,why,extra={}){
    return Object.assign(step(text,answer,why),{answerFormat:format},extra);
  }
  function pick(seed,r,original,variants){return seed?variants[r(0,variants.length-1)]:original;}
  function split(seed,r,step){
    const [a,b,c,d]=pick(seed,r,'MNCD',['ABKL','UVCE','KLPQ','EFBD','STKL']).split(''),order=[a,c,d,b];
    const first=r(2,4),second=r(6,8),options=[[a+c,c+d,d+b],[a+d,d+c,c+b]].map(p=>p.join(' '));
    const why='Перечисли соседние пары в том порядке, который выбрал на своём чертеже. Названия можно писать с любого конца.';
    const steps=[step('а. Поставь на отрезке '+a+b+' одну внутреннюю точку '+d+'. Сколько частей образовалось?',2,'У одной внутренней точки есть часть слева и часть справа.',[{value:3,text:'Здесь отмечена только одна внутренняя точка. Вторую добавим следующим шагом.'}]),
      step('Добавь другую внутреннюю точку '+c+'. На сколько частей теперь разбился весь отрезок?',3,'Существующая часть разделилась на две, поэтому количество выросло на одну.'),
      ask(step,'б. Запиши через пробел три отдельные части своего чертежа.',options[0],'v5-segments',why,{alternatives:[options[1]]})];
    return {prompt:'Построй '+a+b+', отметь внутри две разные точки '+c+' и '+d+'. Обе очередности допустимы. Перечисли три соседние части.',inputPrompt:'Три отрезка через пробел',answer:options[0],alternatives:[options[1]],answerFormat:'v5-segments',steps,errors:[],nearSets:[{set:[a+c,c+d,a+b].join(' '),text:'В список попал весь исходный отрезок. Нужны только части между соседними отметками.'}],data:{kind:'split',order,positions:[0,first,second,10],max:10},table:{caption:'Что построить',headers:['Объект','Обозначение'],rows:[['Концы',a+', '+b],['Внутри',c+', '+d]]},conditionKey:order.join('')+'/'+first+'/'+second};
  }
  function lengths(seed,r,step){
    const [a,b,c,d]=pick(seed,r,'RPOQ',['AKLT','ECPK','NMVT','BAFQ','LSTV']).split(''),m=seed?r(2,4):2,n=seed?r(m+2,m+5):5,z=seed?r(n+3,n+8):10,ord=[a,b,c,d],pos=[0,m,n,z];
    const segments=[],values=[];for(let i=0;i<ord.length;i++)for(let j=i+1;j<ord.length;j++){segments.push(ord[i]+ord[j]);values.push(pos[j]-pos[i]);}
    const where='Построй отрезок '+a+d+' длиной '+z+' см. От '+a+' отложи до '+b+' '+m+' см, до '+c+' '+n+' см.';
    const steps=[ask(step,'Выпиши все различные отрезки с концами в этих четырёх точках.',segments.join(' '),'v5-segments','Для первого конца есть три новых пары, для второго две, для третьего одна.')];
    segments.forEach((pair,i)=>steps.push(step('Найди длину '+pair+' в сантиметрах.',values[i],'Вычти меньшую отметку шкалы из большей. Длина положительна при любом направлении измерения.',pos[ord.indexOf(pair[0])]?[{value:pos[ord.indexOf(pair[1])],text:'Ты записал координату правого конца. Отсчёт длины начинается на отметке другого конца.'}]:[])));
    return {prompt:where+' Введи длины по порядку '+segments.join(', ')+'.',inputPrompt:'Шесть длин в сантиметрах, через точку с запятой',answer:values,answerFormat:'v5-list',steps,errors:[],data:{kind:'lengths',order:ord,positions:pos,max:z,pairs:segments,values},table:{caption:'Линейка для собственного чертежа',headers:['Точка','Отметка, см'],rows:ord.map((p,i)=>[p,pos[i]])},conditionKey:ord.join('')+'/'+pos.join('/')};
  }
  function membership(seed,r,step){
    const labels=pick(seed,r,'MNDCBHPXR',['AKSEBFHLT','UPVTAEBCF','NOPQRACDF','SADFKMNTX']).split(''),order=labels.slice(0,5),extra=labels.slice(5),positions=seed?[0,r(1,2),r(3,4),r(6,7),9]:[0,2,4,7,9],left=seed?r(0,1):0,right=seed?r(2,4):3,inside=order.slice(left,right+1),outside=labels.filter(c=>!inside.includes(c));
    const span=order[left]+order[right],missingEnds=inside.slice(1,-1).join(' '),extension=order.filter(p=>!inside.includes(p)),onlyOff=extra.join(' '),insideMistakes=[{set:missingEnds,text:'Ты нашёл точки строго между концами. Оба конца тоже принадлежат отрезку.'}],outsideMistakes=[{set:inside.join(' '),text:'Эти точки принадлежат выделенному отрезку. Требуется записать оставшиеся отметки.'}];
    if(extension.length)outsideMistakes.push({set:onlyOff,text:'Кроме точек в стороне от прямой проверь отметки на прямой за концами отрезка.'});
    const steps=[ask(step,'Какие две точки являются концами '+span+'?',span,'v5-line-points','В названии отрезка уже записаны обе граничные точки.'),
      ask(step,'Какие отмеченные точки принадлежат '+span+'? Включи концы.',inside.join(' '),'v5-line-points','Веди по отмеченной части прямой. Буквы, подписанные рядом, обозначают точки, чьи метки стоят рядом с ними.',{nearSets:insideMistakes}),
      ask(step,'Перечисли все точки вне '+span+'.',outside.join(' '),'v5-line-points','Вне находятся точки сбоку от прямой и точки прямой за границами выбранного участка.',{nearSets:outsideMistakes})];
    return {prompt:'Рассмотри авторский чертёж с теми же отношениями точек. Какие из подписанных точек не принадлежат отрезку '+span+'?',inputPrompt:'Буквы точек вне отрезка',answer:outside.join(' '),answerFormat:'v5-line-points',steps,errors:[],nearSets:outsideMistakes,data:{kind:'membership',order,positions,max:9,extra,left,right},table:{caption:'Как читать рисунок',headers:['Ищем','Обозначение'],rows:[['Отрезок',span],['Метки',labels.join(', ')]]},conditionKey:labels.join('')+'/'+positions.join('/')+'/'+left+right};
  }
  function between(seed,r,step){
    const order=pick(seed,r,'AKSPB',['UMNVT','EBHKS','KLPRV','MUSTV','PERSB']).split(''),positions=seed?[0,r(1,3),r(4,6),r(7,9),10]:[0,2,5,8,10],pairs=[[0,4],[1,4],[0,2],[2,4]];
    const answers=pairs.map(([i,j])=>order.slice(i+1,j).join(' ')),steps=pairs.map(([i,j],k)=>ask(step,['а','б','в','г'][k]+'. Какие точки находятся строго между '+order[i]+' и '+order[j]+'?',answers[k],'v5-line-points','Пройди от первого указанного конца ко второму, пропуская оба конца.',{nearSets:[{set:order.slice(i,j+1).join(' '),text:'В список попали граничные точки. Между ними остаются только внутренние отметки.'}]}));
    return {prompt:'Найди точки между четырьмя парами концов. В последнем вопросе запиши все точки строго между '+order[2]+' и '+order[4]+'.',inputPrompt:'Буквы внутренних точек последней пары',answer:answers[3],answerFormat:'v5-line-points',steps,errors:[],nearSets:steps[3].nearSets,data:{kind:'between',order,positions,max:10,pairs},table:{caption:'Четыре пары для проверки',headers:['№','Концы'],rows:pairs.map(([i,j],k)=>[['а','б','в','г'][k],order[i]+' и '+order[j]])},conditionKey:order.join('')+'/'+positions.join('/')};
  }
  const compassLabels=['AB','CD','MK','EF','PT'];
  function compass(seed,r,step){
    const names=seed?pick(seed,r,'',['UV AK LM TE SR','BA DK LF MN PT','KT UM VA PS FE']).split(' '):compassLabels.slice();
    const base=seed?r(50,67):54,delta=seed?r(6,13):8,o=[base,base+delta,base+2*delta,base+2*delta,base+delta];
    const equality=[names[1]+'='+names[4],names[2]+'='+names[3]].join('; ');
    const eq=ask(step,'а. Запиши обе пары равных отрезков. Для каждой используй знак «=», а между парами поставь точку с запятой.',equality,'v5-equal-segments','Установи концы измерителя на два конца образца, затем сравни его раствор с другими рисунками.');
    const steps=[eq,step('б. В модели перенеси длину '+names[0]+' на новый луч. Сколько раз откладывается его длина, чтобы получить один равный отрезок?',1,'Поставь одну ножку циркуля в начало луча. Не меняя раствор, отметь место второй ножки и соедини отметки.',[{value:2,text:'Два откладывания дадут удвоенную длину. Здесь строят один отрезок, равный образцу.'}])];
    return {prompt:'Сравни пять авторских отрезков. Назови обе пары одинаковой длины, затем перенеси '+names[0]+' в модель на новый луч.',inputPrompt:'Два равенства через точку с запятой',answer:equality,answerFormat:'v5-equal-segments',steps,errors:[],data:{kind:'compass',lengths:o,names},table:{caption:'Измеряемые отрезки',headers:['Метка','Отрезок'],rows:names.map((n,i)=>[i+1,n])},conditionKey:names.join('')+o.join('/')};
  }
  function chain(seed,r,step){
    const labels=seed?pick(seed,r,'',['AKLF','PBTE','KMVR','ASUK']):'MAKN',order=[...labels],first=seed?r(12,37):15,k=seed?r(3,4):3,d=seed?2*first-k*Math.floor((2*first-2)/k):3,middle=first-d,partial=first+middle,last=partial/k,total=partial+last;
    const [m,a,b,n]=order, names=[m+a,a+b,b+n,m+b,m+n],parts=[first,middle,last,partial,total];
    const steps=[step('Найди '+a+b+': он на '+d+' см короче '+m+a+'.',middle,'Из длины первой части вычти заданную разницу.',[{value:first+d,text:'Получилась большая длина. Вторую часть назвали короче первой.'}]),step('Чему равен составной отрезок '+m+b+' в сантиметрах?',partial,'Объедини две соседние части до точки '+b+'.'),step('Узнай длину '+b+n+': она в '+k+' раза меньше '+m+b+'.',last,'Делимое здесь — длина всего отрезка '+m+b+', а не только одной части.',[{value:partial-k,text:'Ты вычел число. Выражение «в несколько раз меньше» требует деления.'}])];
    return {prompt:'Точки расположены '+order.join(' — ')+'. '+m+a+' равен '+first+' см. '+a+b+' на '+d+' см меньше '+m+a+', а '+b+n+' в '+k+' раза короче '+m+b+'. Какова длина '+m+n+'?',inputPrompt:'Длина всего отрезка, см',answer:total,steps,errors:[{value:partial,text:'Это расстояние только до '+b+'. Добавь оставшийся участок до '+n+'.'}],data:{kind:'chain',order,positions:[0,first,partial,total],max:total,parts,names},table:{caption:'Условия для трёх последовательных частей',headers:['Что известно','Связь'],rows:[[m+a,first+' см'],[a+b,'на '+d+' см меньше '+m+a],[b+n,'в '+k+' раза меньше '+m+b]]},conditionKey:labels+'/'+first+'/'+d+'/'+k};
  }
  function compassDrawing(d,state){
    const lenUnit=2,angle=[-.1,.14,-.12,.03,.12];
    // Use a single geometric scale in both directions for every displayed segment.
    const planes=d.names.map((n,i)=>{const x=30,y=28+i*52,span=d.lengths[i]*lenUnit,dx=span*Math.cos(angle[i]),dy=span*Math.sin(angle[i]);return '<line x1="'+x+'" y1="'+y+'" x2="'+(x+dx)+'" y2="'+(y+dy)+'" stroke="'+(state&&state.sample===i?'#9d5427':'#32684f')+'" stroke-width="2.5"/><circle cx="'+x+'" cy="'+y+'" r="3"/><circle cx="'+(x+dx)+'" cy="'+(y+dy)+'" r="3"/><text x="'+(x-8)+'" y="'+(y+4)+'" text-anchor="end">'+n[0]+'</text><text x="'+(x+dx+6)+'" y="'+(y+dy+3)+'">'+n[1]+'</text>';});
    if(state){
      const opened=d.lengths[state.sample],opening=state.delta-2,copy=opened+opening*4,start=30,y=296;
      const pivot=start+copy;
      planes.push('<path d="M'+start+' '+y+'L'+pivot+' '+(y-30)+'L'+(start+copy*2)+' '+y+'" fill="none" stroke="#405e7c" stroke-width="2"/><circle cx="'+pivot+'" cy="'+(y-30)+'" r="3" fill="#405e7c"/><line x1="'+(start+opened*2)+'" y1="'+(y-9)+'" x2="'+(start+opened*2)+'" y2="'+(y+9)+'" stroke="#426353" stroke-dasharray="2 2"/><line x1="20" y1="'+y+'" x2="255" y2="'+y+'" stroke="#8d998e"/><line x1="'+start+'" y1="'+y+'" x2="'+(start+copy*2)+'" y2="'+y+'" stroke="#ae6736" stroke-width="4"/><path d="M'+start+' '+(y-8)+'v16 M'+(start+copy*2)+' '+(y-8)+'v16" stroke="#7c4827"/>');
    }
    return '<svg viewBox="0 0 270 '+(state?312:263)+'" style="display:block;width:100%;max-width:360px" role="img" aria-label="Пять отрезков для переноса общего раствора циркуля"><g font-size="14" fill="#21382c">'+planes.join('')+'</g></svg>';
  }

  function drawing(d,options={}){
    if(d.kind==='compass')return compassDrawing(d,options.measure);
    const W=286,pad=18,y=56,x=t=>pad+t*(W-2*pad)/d.max,order=options.swap?[d.order[0],d.order[2],d.order[1],d.order[3]]:d.order;
    const selected=options.pair,showRuler=d.kind==='lengths',marked=options.mark;
    const line=(x1,y1,x2,y2,style)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" '+style+'/>';
    const dot=(p,x,y,textY,highlight)=>'<circle cx="'+x+'" cy="'+y+'" r="'+(highlight?4.5:3)+'" fill="'+(highlight?'#a34e23':'#233e34')+'"/><text x="'+x+'" y="'+textY+'" font-size="18" fill="#1d3529" text-anchor="middle">'+p+'</text>';
    let art=line(x(0),y,x(d.max),y,'stroke="#567769" stroke-width="2"');
    const focus=selected||d.kind==='membership'&&[d.left,d.right];
    if(focus)art+=line(x(d.positions[focus[0]]),y,x(d.positions[focus[1]]),y,'stroke="#196949" stroke-width="4"');
    if(showRuler){
      art+=line(x(0),82,x(d.max),82,'stroke="#476252"');
      for(let i=0;i<=d.max;i++){art+=line(x(i),82,x(i),i===0||i===d.max?90:87,'stroke="#476252"');}
      art+='<text x="'+x(0)+'" y="103" text-anchor="middle" font-size="12">0</text><text x="'+(x(d.max)-6)+'" y="103" text-anchor="middle" font-size="12">'+d.max+' см</text>';
    }
    order.forEach((p,i)=>{art+=dot(p,x(d.positions[i]),y,y-8,p===marked);});
    if(d.extra){const off=[[.15,23], [.44,84], [.76,23], [.94,84]];d.extra.forEach((p,i)=>{const [portion,h]=off[i];art+=dot(p,pad+portion*(W-2*pad),h,h-6,p===marked);});}
    return '<svg viewBox="0 0 '+W+' '+(showRuler?112:90)+'" role="img" aria-label="'+(d.kind==='split'?'Один возможный чертёж со сменой порядка точек':d.kind==='lengths'?'Четыре отмеченные точки на сантиметровой шкале':d.kind==='membership'?'Отрезок с точками внутри, за концом и в стороне от прямой':'Пять точек в порядке слева направо')+'" style="display:block;width:100%;max-width:420px;margin:0 auto">'+art+'</svg>';
  }
  function explore(l,s,t){
    const d=t.data;
    if(d.kind==='compass'){
      const change=s.delta-2,deltaNames=['Сильно сузить','Немного сузить','Сохранить исходный','Немного расширить','Сильно расширить'];
      return {title:'Перенеси раствор циркуля на луч',controls:[{key:'sample',title:'С какого отрезка снять длину',values:d.names.map((p,i)=>[i,p])},{key:'delta',title:'Раствор перед построением',values:deltaNames.map((v,i)=>[i,v])}],visual:compassDrawing(d,s),question:'Сравни построенную копию с исходным образцом. Введи 1 — короче, 2 — равна, 3 — длиннее.',answer:change<0?1:change>0?3:2,why:change===0?'Раствор сохранён. Вторая засечка находится от начала луча на расстоянии, равном выбранному образцу.':change<0?'Измеритель закрыли, поэтому засечка оказалась ближе.':'Измеритель открыли шире, поэтому новая засечка дальше.'};
    }
    if(d.kind==='chain'){
      const pairs=[[0,1],[1,2],[2,3],[0,2],[0,3]],name=d.names[s.pair];
      return {title:'Проверь состав выбранного отрезка',controls:[{key:'pair',title:'Какую длину найти',values:d.names.map((p,i)=>[i,p])}],visual:drawing(d,{pair:pairs[s.pair]}),question:'Какова длина '+name+' в сантиметрах?',answer:d.parts[s.pair],why:name+' соответствует выделенной части. Её длина равна '+d.parts[s.pair]+' см.'};
    }
    if(d.kind==='split'){
      const order=s.swap?[d.order[0],d.order[2],d.order[1],d.order[3]]:d.order;
      return {title:'Поменяй порядок внутренних точек',controls:[{key:'swap',title:'Порядок слева направо',values:[[0,d.order.join(' — ')],[1,[d.order[0],d.order[2],d.order[1],d.order[3]].join(' — ')]]},{key:'piece',title:'Отмеченный участок',values:[[0,'Первая часть'],[1,'Средняя часть'],[2,'Последняя часть']]}],visual:drawing(d,{swap:s.swap,pair:[s.piece,s.piece+1]}),question:'Какой конец выделенной части справа? Введи его код: '+d.order.map((p,i)=>p+' — '+(i+1)).join(', ')+'.',answer:d.order.indexOf(order[s.piece+1])+1,why:'Выбраны соседние точки '+order[s.piece]+' и '+order[s.piece+1]+'. Справа стоит '+order[s.piece+1]+'.'};
    }
    if(d.kind==='lengths'){
      const pair=d.pairs[s.pair],indices=[...pair].map(p=>d.order.indexOf(p));
      return {title:'Измерь выбранный отрезок',controls:[{key:'pair',title:'Какие концы соединить',values:d.pairs.map((p,i)=>[i,p])}],visual:drawing(d,{pair:indices}),question:'Сколько сантиметров между '+pair[0]+' и '+pair[1]+'?',answer:d.values[s.pair],why:'Отметки '+d.positions[indices[1]]+' и '+d.positions[indices[0]]+' разделяет '+d.values[s.pair]+' см.'};
    }
    if(d.kind==='membership'){
      const all=d.order.concat(d.extra),p=all[s.mark],i=d.order.indexOf(p),inside=i>=d.left&&i<=d.right;
      return {title:'Проверяй по одной отмеченной точке',controls:[{key:'mark',title:'Выделенная точка',values:all.map((v,k)=>[k,v])}],visual:drawing(d,{mark:p}),question:'Принадлежит ли '+p+' выделенному отрезку? Введи 1 для «да», 0 для «нет».',answer:inside?1:0,why:inside?'Точка находится на выделенной части, включая её концы.':i<0?'Метка расположена в стороне от прямой.':'Точка на той же прямой, но за концом выделенного отрезка.'};
    }
    const [i,j]=d.pairs[s.pair],inner=d.order.slice(i+1,j);
    return {title:'Пройди от одного конца до другого',controls:[{key:'pair',title:'Выбранная пара',values:d.pairs.map(([a,b],j)=>[j,d.order[a]+' и '+d.order[b]])}],visual:drawing(d,{pair:[i,j]}),question:'Сколько отмеченных точек строго внутри выделенной части?',answer:inner.length,why:'Между концами отмечены '+inner.join(', ')+'. Оба указанных конца пропускаем.'};
  }
  const bounds={'1.42':{swap:[0,1,0],piece:[0,2,0]},'1.43':{pair:[0,5,0]},'1.44':{mark:[0,8,0]},'1.45':{pair:[0,3,0]},'1.46':{sample:[0,4,0],delta:[0,4,2]},'1.47':{pair:[0,4,0]}};
  const generators={'1.42':split,'1.43':lengths,'1.44':membership,'1.45':between,'1.46':compass,'1.47':chain};
  const api={lessons,generators,bounds,drawing,explore,canonical,accepts,mistake};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedSegments=api;
})(typeof window!=='undefined'?window:globalThis);
