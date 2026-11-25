/* Polygon and perimeter constructions, printed part 1, point 3, p. 19. */
(function(root){
  'use strict';
  const info=[
    ['1.60','Дополни рисунок до пятиугольника','Вершина простой границы соединена ровно с двумя соседями. После достройки должен получиться один замкнутый обход без пересечения сторон.',['Если на границе уже есть путь U–V–W, продолжать её можно только из U или W.','Соедини концы с другим незамкнутым путём. Затем проверь, можно ли обойти все вершины и вернуться к началу без пересечения.'],'Любой способ попарно соединить свободные концы даст простой многоугольник.'],
    ['1.61','Найди все отрезки с отмеченными концами','Отдельно просмотри границу и каждую диагональ. Когда на диагонали отмечена внутренняя точка, видны два коротких участка и весь отрезок от одного первоначального конца до другого.',['На отрезке KL отмечена внутренняя точка M. С указанными концами видны KM, ML и KL.','Записи KM и MK называют один отрезок.'], 'Внутренняя отмеченная точка стирает название всего исходного отрезка.'],
    ['1.62','Какую длину ограды купить?','Ограда тянется вдоль четырёх сторон прямоугольника. Одинаковые противоположные стороны повторяются дважды.',['Для прямоугольника 12 м на 8 м нужен путь 12 + 8 + 12 + 8 = 40 м.','Если обойти только две стороны, получится половина необходимой длины.'],'Чтобы купить ограду, надо перемножить длину и ширину участка.'],
    ['1.63','Восстанови длину по ширине','Если ширина в несколько раз меньше длины, длина содержит указанное число одинаковых ширин. После нахождения обеих сторон сложи длины всех четырёх краёв.',['Ширина прямоугольника 9 см, а длина втрое больше. Длина равна 27 см.','Периметр равен 2 × (27 + 9) = 72 см.'],'Если ширина в четыре раза меньше длины, то для нахождения длины ширину надо поделить на четыре.'],
    ['1.64','Три стороны с двумя сравнениями','Запиши известную сторону, затем найди промежуточную. Слова «первая меньше второй» означают, что вторую находят прибавлением к первой. После этого складывай все три стороны.',['Пусть AC равна 14 см, AB на 2 см больше AC, а BC на 5 см больше AB. Получаются 14, 16 и 21 см.','Их сумма равна 51 см. Полезно заранее проверить оба сравнения, а не только сложение.'],'Если AB меньше BC на 6 см, то сторону BC получают вычитанием 6 см из AB.'],
    ['1.65','Четыре равные стороны квадрата','При полном обходе квадрата одну и ту же длину откладывают четыре раза.',['Со стороной 6 см периметр равен 6 + 6 + 6 + 6 = 24 см.','В квадратных сантиметрах считалась бы площадь. Длина границы измеряется в сантиметрах.'],'Периметр квадрата всегда равен произведению длины стороны на неё саму.'],
    ['1.66','Периметр пятиугольника в общих единицах','Переведи сантиметры и миллиметры в миллиметры. Три равные стороны учти по три раза. Затем по отдельности найди более короткую и более длинную стороны.',['Если три стороны по 100 мм, четвёртая короче на 12 мм, а пятая длиннее на 24 мм, суммы частей равны 300, 88 и 124 мм.','Вся граница 512 мм, то есть 51 см 2 мм.'], 'Если у пятиугольника три стороны равны, то для периметра можно одну из них просто умножить на пять.']
  ];
  const lessons=info.map(([number,title,explanation,worked,misconception])=>({number,key:'printed-'+number.replace('.','-'),title,part:1,point:3,page:19,explanation,worked,misconception,reflect:'Как проверить, что в твоём ответе учтена вся граница и ни один участок не продублирован?',requires:['v5f-broken-length'],related:['v5f-length-units']}));
  const nat=(step,p,a,h,e=[])=>Object.assign(step(p,a,h,e),{answerFormat:'v5-natural'});
  const ask=(step,p,a,h,format,extra={})=>Object.assign(step(p,a,h),{answerFormat:format},extra);
  const sum=a=>a.reduce((x,y)=>x+y,0);
  function labelSet(seed,r,original,samples){return seed?samples[r(0,samples.length-1)]:original;}
  function complete(seed,r,step){
    const names=labelSet(seed,r,'SBQHO',['AKLPT','CDBNV','KPRST','UABDF']),[s,b,q,h,o]=names;
    const coords=[[38,12],[16,44],[33,77],[84,78],[101,37]].map(([x,y])=>[x+(seed?r(-4,4):0),y+(seed?r(-4,4):0)]);
    const printed=[s+b,b+q,h+o],good=[q+h,o+s],crossed=[q+o,h+s],edges=[...printed,...good],sides=edges.join(' ');
    const steps=[ask(step,'Какие два новых отрезка замкнут один простой пятиугольник?',good.join(' '),'Пройди по границе через все пять вершин. Верхние свободные концы соедини вверху, нижние — внизу.','v5-segments',{nearSets:[{set:crossed.join(' '),text:'Эти два звена пересекутся. Проверь, где расположены верхние и нижние свободные концы.'}]}),ask(step,'Назови все вершины получившегося пятиугольника.',names,'У каждой вершины сходятся две стороны.','v5-line-points')];
    return {prompt:'Дострой простой пятиугольник и запиши все его стороны. Можно изменить порядок перечисления и букв в каждой паре.',inputPrompt:'Пять сторон через пробел',answer:sides,answerFormat:'v5-segments',steps,errors:[],data:{kind:'complete',names,coords,printed,good,crossed,edges},table:{caption:'Уже нарисованные звенья',headers:['№','Звено'],rows:printed.map((e,i)=>[i+1,e])},conditionKey:names+'/'+coords.join('/')};
  }
  function diagonals(seed,r,step){
    const names=labelSet(seed,r,'ABMNO',['KLTPH','BEKCS','UNVRD','SAKLP']),[a,b,m,n,o]=names,ox=seed?r(18,31):24,oy=seed?r(0,7):4,dx=seed?r(65,85):80,dy=seed?r(45,60):52;
    const coords=[[12,dy+13],[12+ox,13],[12+ox+dx,13+oy],[12+dx,13+oy+dy],[12+(ox+dx)/2,13+(dy+oy)/2]];
    const sides=[a+b,b+m,m+n,n+a],first=[a+o,o+m,a+m],second=[b+o,o+n,b+n],all=[...sides,...first,...second];
    const steps=[ask(step,'Перечисли четыре отрезка на границе фигуры.',sides.join(' '),'Иди по наружному контуру. Внутренняя точка сейчас не участвует.','v5-segments'),ask(step,'Запиши все отрезки на диагонали '+a+m+'.',first.join(' '),'Помимо двух частей существует и вся диагональ.','v5-segments'),ask(step,'Запиши все отрезки на второй диагонали '+b+n+'.',second.join(' '),'У второй диагонали тоже три отрезка с отмеченными концами.','v5-segments')];
    return {prompt:'Запиши все изображённые отрезки с концами в подписанных точках. Каждый отрезок указывай один раз.',inputPrompt:'Полный набор через пробел',answer:all.join(' '),answerFormat:'v5-segments',steps,errors:[],nearSets:[{set:[...sides,a+m,b+n].join(' '),text:'Граница и две диагонали учтены. Внутренняя точка даёт ещё по две части на каждой диагонали.'},{set:[...sides,...first.slice(0,2),...second.slice(0,2)].join(' '),text:'Четыре коротких участка уже есть. Добавь и обе диагонали целиком.'}],data:{kind:'diagonals',names,coords,sides,first,second,edges:[...sides,a+m,b+n]},table:{caption:'Прямые линии внутри границы',headers:['Диагональ','Внутренняя точка'],rows:[[a+m,o],[b+n,o]]},conditionKey:names+'/'+coords.join('/')};
  }
  function perimeter(number,seed,r,step){
    let labels,names,values,unit,prompt,steps,rows,answer,format='v5-natural',errors=[];
    if(number==='1.62'||number==='1.63'){
      const fence=number==='1.62',short=fence?(seed?r(18,39):30):(seed?r(12,36):28),k=seed?r(2,6):4,long=fence?(seed?r(short+8,short+29):45):short*k;
      unit=fence?'м':'см';names='ABCD';labels=['AB','BC','CD','DA'];values=[long,short,long,short];
      steps=[fence?step('Сколько сторон ограждают участок?',4,'Ограда нужна по всем четырём краям.'):step('Какова длина прямоугольника в сантиметрах?',long,'Длина содержит '+k+' одинаковые ширины.',[{value:short+'/'+k,text:'Ширина уже известна. Длинная сторона здесь больше неё.'}]),nat(step,'Чему равна сумма длины и ширины?',long+short,'Сложи две соседние стороны в одинаковых единицах.')];
      prompt=fence?'Прямоугольный участок имеет размеры '+long+' м и '+short+' м. Какова длина необходимого забора?':'Ширина прямоугольника '+short+' см и в '+k+' раза меньше его длины. Найди периметр.';
      rows=fence?[['Длина',long+' м'],['Ширина',short+' м']]:[['Ширина',short+' см'],['Длина','в '+k+' раза больше ширины']];
      errors=[{value:long*short,text:'Так получается площадь участка. Для границы нужно сложить длины сторон.'},{value:long+short,text:'Это только две соседние стороны. Есть ещё две противоположные.'}];
    }else if(number==='1.64'){
      const ac=seed?r(14,33):17,d=seed?r(1,6):3,g=seed?r(3,9):6,ab=ac+d,bc=ab+g;unit='см';names='ABC';labels=['AB','BC','CA'];values=[ab,bc,ac];
      steps=[nat(step,'Найди длину AB в сантиметрах.',ab,'AB длиннее известной AC на '+d+' см.'),nat(step,'Найди длину BC.',bc,'AB меньше BC на '+g+' см, поэтому BC больше AB на столько же.',[{value:ab-g,text:'Получилась сторона меньше AB. По условию BC больше AB.'}])];
      prompt='AC = '+ac+' см. AB на '+d+' см больше AC и на '+g+' см меньше BC. Найди периметр ABC.';rows=[['AC',ac+' см'],['AB','на '+d+' см больше AC'],['BC','на '+g+' см больше AB']];
    }else if(number==='1.65'){
      const side=seed?r(3,22):4;unit='см';names='ABCD';labels=['AB','BC','CD','DA'];values=[side,side,side,side];
      steps=[step('Сколько раз встретится длина данной стороны при полном обходе вокруг квадрата?',4,'У квадрата четыре равные стороны.'),nat(step,'Какова сумма длин двух соседних сторон?',2*side,'Сложи выбранную длину с ней самой.')];
      prompt='Какова длина границы квадрата со стороной '+side+' см?';rows=[['Сторона',side+' см'],['Всего сторон',4]];errors=[{value:2*side,text:'Учтена только половина границы квадрата.'}];
    }else{
      const base=seed?r(10,32)*10:160,d=seed?r(11,29):14,g=seed?r(13,46):39;unit='мм';names='MPKQR';labels=['MP','PK','KQ','QR','RM'];values=[base,base,base,base-d,base+g];
      const cm=n=>Math.floor(n/10)+' см '+n%10+' мм';
      steps=[nat(step,'Сколько миллиметров имеет каждая из трёх равных сторон?',base,'В сантиметре 10 мм.'),nat(step,'Чему равна QR в миллиметрах?',base-d,'QR короче MP. Переведи разницу в миллиметры и вычти.'),nat(step,'Чему равна MR?',base+g,'MR длиннее PK. Переведи прибавку в миллиметры и сложи.'),nat(step,'Сложи все пять сторон. Сколько всего миллиметров?',sum(values),'Три одинаковые длины учти трижды. Затем прибавь обе остальные стороны.')];
      prompt='MP, PK и KQ равны '+(base/10)+' см. QR на '+cm(d)+' короче MP, а MR на '+cm(g)+' длиннее PK. Запиши периметр в сантиметрах и оставшихся миллиметрах.';rows=[['MP, PK, KQ',base/10+' см каждая'],['QR','на '+cm(d)+' короче MP'],['MR','на '+cm(g)+' длиннее PK']];answer=[Math.floor(sum(values)/10),sum(values)%10];format='v5-pair';
    }
    return {prompt,inputPrompt:format==='v5-pair'?'Сантиметры; оставшиеся миллиметры':'Периметр в '+unit,answer:answer||sum(values),answerFormat:format,steps,errors,data:{kind:'perimeter',number,names,labels,values,unit},table:{caption:'Что известно о границе',headers:['Сторона или связь','Измерение'],rows},conditionKey:values.join('/')};
  }
  function perimeterCoordinates(d){
    const [a,b,c]=d.values;
    if(d.values.length===4)return [[0,0],[a,0],[a,b],[0,b]];
    if(d.values.length===3){
      const x=(a*a+c*c-b*b)/(2*c);
      return [[0,0],[x,-Math.sqrt(Math.max(0,a*a-x*x))],[c,0]];
    }
    let lo=Math.max(...d.values)/2,hi=sum(d.values);
    for(let i=0;i<50;i++){
      const mid=(lo+hi)/2,angle=sum(d.values.map(v=>2*Math.asin(v/(2*mid))));
      if(angle>2*Math.PI)lo=mid;else hi=mid;
    }
    const radius=(lo+hi)/2;let phi=-Math.PI*.85;
    return d.values.map(v=>{const xy=[radius*Math.cos(phi),radius*Math.sin(phi)];phi+=2*Math.asin(v/(2*radius));return xy;});
  }
  function graphic(d,selected=[],proposal=[]){
    const raw=d.kind==='perimeter'?perimeterCoordinates(d):d.coords;
    const coords=d.kind==='perimeter'&&d.values.length!==3?raw.map(([x,y])=>[x,-y]):raw;
    const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]),minX=Math.min(...xs),minY=Math.min(...ys),scale=Math.min(232/(Math.max(...xs)-minX),110/(Math.max(...ys)-minY));
    const points=Object.fromEntries([...d.names].map((p,i)=>[p,[24+scale*(coords[i][0]-minX),24+scale*(coords[i][1]-minY)]]));
    const color='#376c52',accent='#a45a31';
    function line(pair,stroke,dashed=false,width=2.4){const [a,b]=[...pair].map(c=>points[c]);return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+stroke+'" stroke-width="'+width+'"'+(dashed?' stroke-dasharray="5 3"':'')+'/>';}
    const edges=d.kind==='complete'?d.printed:d.kind==='diagonals'?d.edges:d.labels;
    const body=edges.map(e=>line(e,color)).join('')+proposal.map(e=>line(e,'#8a623c',true)).join('')+selected.map(e=>line(e,accent,false,4)).join('');
    const marks=Object.entries(points).map(([p,[x,y]])=>'<circle cx="'+x+'" cy="'+y+'" r="3.5" fill="#244332"/><text x="'+x+'" y="'+(y-7)+'" fill="#203e2d" font-size="16" text-anchor="middle">'+p+'</text>').join('');
    return '<svg class="v5q-source-boundary" viewBox="0 0 283 156" role="img" aria-label="'+(d.kind==='complete'?'Две незамкнутые части будущего пятиугольника':d.kind==='diagonals'?'Четырёхугольник с пересечением двух диагоналей':'Граница фигуры с вершинами '+d.names)+'">'+body+marks+'</svg>';
  }
  function explore(l,s,t){
    const d=t.data;
    if(d.kind==='complete'){
      const alternatives=[[],d.good,d.crossed,[d.names[0]+d.names[2]]],good=s.choice===1;
      return {title:'Проверь предложенное замыкание',controls:[{key:'choice',title:'Добавляемые звенья',values:alternatives.map((a,i)=>[i,a.join(' и ')||'Пока ничего не добавлено'])}],visual:graphic(d,[],alternatives[s.choice]),question:'Получилась одна граница из пяти сторон без пересечений? Введи 1 для «да» и 0 для «нет».',answer:good?1:0,why:good?'Каждая вершина теперь имеет двух соседей. Полный обход возвращается в начало.':s.choice===2?'Добавленные отрезки пересекаются. Такой обход не является границей простого пятиугольника.':'Все пять вершин ещё не образовали один замкнутый обход.'};
    }
    if(d.kind==='diagonals'){
      const sets=[d.sides,d.first,d.second,...[d.first[0],d.first[1],d.second[0],d.second[1]].map(p=>[p])];
      const selection=sets[s.view],names=['Граница','Первая диагональ','Вторая диагональ',...sets.slice(3).map(q=>q[0])];
      return {title:'Рассмотри одну прямую за раз',controls:[{key:'view',title:'Что выделить',values:names.map((v,i)=>[i,v])}],visual:graphic(d,selection),question:'Сколько разных отрезков с подписанными концами выделено в этом режиме?',answer:selection.length,why:'Сейчас выделены '+selection.join(', ')+'.'};
    }
    const size=d.values.length,start=s.start%size,count=Math.min(s.count,size),indexes=Array.from({length:count},(_,j)=>(start+j)%size),lengths=indexes.map(i=>d.values[i]);
    return {title:'Обойди часть границы',controls:[{key:'start',title:'С какой стороны начать',values:d.labels.map((p,i)=>[i,p])},{key:'count',title:'Сколько сторон пройти',values:Array.from({length:size},(_,i)=>[i+1,i+1])}],visual:graphic(d,indexes.map(i=>d.labels[i]))+'<p>Путь: '+indexes.map(i=>d.labels[i]).join(' → ')+'.</p>',question:'Какова длина только выделенного пути в '+d.unit+'?',answer:sum(lengths),why:lengths.join(' + ')+' = '+sum(lengths)+' '+d.unit+'.'};
  }
  const generators={'1.60':complete,'1.61':diagonals,...Object.fromEntries(['1.62','1.63','1.64','1.65','1.66'].map(n=>[n,(s,r,t)=>perimeter(n,s,r,t)]))};
  const bounds={'1.60':{choice:[0,3,0]},'1.61':{view:[0,6,0]},...Object.fromEntries([4,4,3,4,5].map((count,i)=>['1.'+(62+i),{start:[0,count-1,0],count:[1,count,1]}]))};
  const api={lessons,generators,bounds,explore,graphic,perimeterCoordinates};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedBoundaries=api;
})(typeof window!=='undefined'?window:globalThis);
