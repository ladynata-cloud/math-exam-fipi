/* Printed exercises on length and position, Vilenkin 5 part 1, point 3, p. 19. */
(function(root){
  'use strict';
  const letters=['а','б','в','г'];
  const info=[
    ['1.48','Миллиметры из нескольких единиц','Сначала переведи в миллиметры каждую часть длины. Один сантиметр даёт десять миллиметров, один дециметр сто. Оставшиеся миллиметры прибавляй в конце.',['2 дм 5 см 4 мм = 200 мм + 50 мм + 4 мм = 254 мм.','Если записаны только сантиметры, их всё равно нужно умножить на 10.'],'Один дециметр равен десяти миллиметрам.'],
    ['1.49','Полные сантиметры и оставшиеся миллиметры','Десять миллиметров составляют один полный сантиметр. Частное от деления на 10 указывает число сантиметров, остаток — число миллиметров.',['В 73 мм содержатся 7 см и ещё 3 мм.','Обратный перевод 7 × 10 + 3 возвращает 73 мм.'],'В разложении на сантиметры и миллиметры остаток может равняться 10 мм.'],
    ['1.50','От дециметров и метров к сантиметрам','Для дециметров применяй множитель 10, а для метров 100. Сантиметры, которые уже отдельно указаны, прибавляй к переведённой части.',['7 дм 3 см = 70 см + 3 см = 73 см.','7 м 3 см = 700 см + 3 см = 703 см. Разница получается из-за разных исходных единиц.'],'Один метр и один дециметр дают одинаковое число сантиметров.'],
    ['1.51','Дециметры и остаток сантиметров','В каждом дециметре 10 см. Сначала собери полные десятки сантиметров. Даже если полных дециметров больше девяти, не отбрасывай десятки в их количестве.',['В 306 см содержатся 30 дм и ещё 6 см.','Проверка: 30 × 10 + 6 = 306 см.'],'Если длину разложили на дециметры и сантиметры, дециметров может быть не больше девяти.'],
    ['1.52','Метры при неполной второй тысяче','Переведи каждый километр в тысячу метров. Затем прибавь отдельные метры. Когда их меньше 100, их нельзя записывать как сотни.',['5 км 8 м = 5000 м + 8 м = 5008 м.','5 км 80 м = 5080 м. Посмотри, как изменилось место восьмёрки.'],'В записи 5 км 8 м получается 5800 м.'],
    ['1.53','Полные километры и оставшиеся метры','Тысяча метров образует километр. Раздели на 1000 и запиши сначала целую часть в километрах, затем остаток в метрах.',['В 13 040 м есть 13 полных километров и ещё 40 м.','13 × 1000 + 40 возвращает исходные 13 040 м.'],'В разложении на километры и метры остаток всегда должен иметь три значащие цифры.'],
    ['1.54','Восстанови четыре перехода по шкале единиц','Если переход состоит из нескольких звеньев, перемножь их коэффициенты. Для километра сначала переходят к метрам, затем к сантиметрам.',['Из 1 дм получаются 10 см. Из каждого сантиметра — 10 мм. Значит, 1 дм даёт 100 мм.','1 км = 1000 м. Каждый метр содержит 100 см, поэтому количество сантиметров больше 1000.'],'При составлении цепочки переводов коэффициенты всегда надо складывать.'],
    ['1.55','Две возможные длины на одной прямой','Расстояние от точки до другой точки можно отложить по прямой в двух направлениях. Зафиксируй первую пару, а для третьей точки построй оба расположения.',['Пусть CD = 50 мм, DE = 20 мм. Если E дальше D от C, то CE = 70 мм.','Если E лежит между C и D, то CE = 30 мм. И там, и там DE равно 20 мм.'],'Для трёх точек на одной прямой третье расстояние всегда равно сумме двух данных.']
  ];
  const lessons=info.map(([number,title,explanation,worked,misconception])=>({number,key:'printed-'+number.replace('.','-'),part:1,point:3,page:19,title,explanation,worked,misconception,reflect:number==='1.55'?'Какая информация позволила бы выбрать единственный вариант?':'Как обратный перевод позволит проверить каждую строку?',requires:['v5f-length-units'],related:['v5f-segment-length']}));
  const mm={'мм':1,'см':10,'дм':100,'м':1000,'км':1e6};
  const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const unitText=row=>row.map(([unit,n])=>fmt(n)+' '+unit).join(' ');
  const asNatural=(s)=>Object.assign(s,{answerFormat:'v5-natural'});
  function combine(number,seed,r,step){
    const definitions={
      '1.48':['мм',[[['см',6],['мм',9]],[['дм',1],['см',8],['мм',3]],[['см',9]]]],
      '1.50':['см',[[['дм',3],['см',6]],[['дм',4],['см',1]],[['м',12],['см',7]]]],
      '1.52':['м',[[['км',7],['м',700]],[['км',3],['м',4]],[['км',6],['м',20]]]]
    };
    const [target,original]=definitions[number];
    const rows=original.map((row,i)=>row.map(([u,n],j)=>[u,seed?(number==='1.52'&&j===1?[100*r(1,9),r(1,9),10*r(1,9)][i]:i===2&&number==='1.50'&&j===0?r(10,28):r(1,9)):n]));
    const components=rows.map(row=>row.map(([u,n])=>mm[u]/mm[target]*n)),values=components.map(ns=>ns.reduce((s,n)=>s+n,0));
    const steps=rows.map((row,i)=>asNatural(step(letters[i]+'. Переведи '+unitText(row)+' в '+target+'.',values[i],'В этой строке вклады составляют '+components[i].join(' + ')+' '+target+'. Проверь их сумму.',[{value:row.reduce((s,p)=>s+p[1],0),text:'Ты сложил числовые подписи до перевода. Сначала вырази их в одинаковых единицах.'}])));
    return {prompt:'Сколько '+target+' в каждой строке? Введи все три числа в порядке а; б; в.',inputPrompt:'Три значения в '+target,answer:values,answerFormat:'v5-list',steps,errors:[],data:{kind:'combine',rows,target,components,values},table:{caption:'Длины для перевода',headers:['№','Исходная длина'],rows:rows.map((row,i)=>[letters[i],unitText(row)])},conditionKey:rows.map(unitText).join('|')};
  }
  const reverseDefs={'1.49':['см','мм',[52,308]],'1.51':['дм','см',[27,501,45]],'1.53':['км','м',[9678,6009,24700]]};
  function decompose(number,seed,r,step){
    const [large,small,bases]=reverseDefs[number],factor=mm[large]/mm[small];
    const values=bases.map((n,i)=>seed?factor*r(i===1?10:2,i===1?68:27)+(factor===1000?[r(100,899),r(0,9),100*r(1,9)][i]:r(0,9)):n);
    const pairs=values.map(v=>[Math.floor(v/factor),v%factor]),answers=pairs.map(([a,b])=>a+' '+large+' '+b+' '+small);
    const steps=values.map((v,i)=>{const [whole,left]=pairs[i],errors=whole===left?[]:[{value:[left,whole],text:'Полные крупные единицы и остаток поменялись местами. Первым запиши число полных групп.'}];return Object.assign(step(letters[i]+'. Раздели '+fmt(v)+' '+small+' на полные '+large+' и остаток '+small+'. Введи оба числа через точку с запятой.',pairs[i],
      'Нужен результат деления на '+factor+' с остатком. Проверь: полные единицы × '+factor+' + остаток = '+fmt(v)+'.',errors),{answerFormat:'v5-pair'});});
    return {prompt:'В каждой строке запиши крупные и оставшиеся мелкие единицы. Между ответами поставь точку с запятой.',inputPrompt:'Например: 2 '+large+' 1 '+small+'; 4 '+large+' 3 '+small,answer:answers.join('; '),answerFormat:'v5-length-pairs',steps,errors:[],data:{kind:'decompose',large,small,factor,values,pairs},table:{caption:'Исходные длины',headers:['№','Длина в '+small],rows:values.map((v,i)=>[letters[i],fmt(v)])},conditionKey:values.join('/')};
  }
  function readLengths(input){
    const text=String(input).trim().toLowerCase();
    if(!text)return null;
    const pairs=text.split(';').map(part=>{const m=part.trim().match(/^(\d+(?:[ \u00a0\u202f]\d{3})*)\s*(км|дм|см|мм|м)\s*(\d+(?:[ \u00a0\u202f]\d{3})*)\s*(км|дм|см|мм|м)$/u);return m?[Number(m[1].replace(/\s/g,'')),m[2],Number(m[3].replace(/\s/g,'')),m[4]].join(':'):null;});
    return pairs.every(Boolean)?pairs.join(';'):null;
  }
  function links(seed,r,step){
    const units=[['м','см'],['м','мм'],['дм','мм'],['км','см']],counts=seed?units.map(()=>r(2,9)):[1,1,1,1],factors=units.map(([a,b])=>mm[a]/mm[b]),values=counts.map((n,i)=>n*factors[i]);
    const steps=units.map(([a,b],i)=>asNatural(step(letters[i]+'. '+counts[i]+' '+a+' — сколько это '+b+'?',values[i],'В одной единице '+a+' содержится '+fmt(factors[i])+' '+b+'. При необходимости последовательно пройди через промежуточные единицы.',[{value:counts[i]*10,text:'Проверь, сколько ступеней между этими единицами. Одного умножения на десять здесь недостаточно.'}])));
    return {prompt:'Заполни все четыре пропуска. Введи числовые ответы в порядке а; б; в; г.',inputPrompt:'Четыре числа через точку с запятой',answer:values,answerFormat:'v5-list',steps,errors:[],data:{kind:'links',units,counts,factors,values},table:{caption:'Переходы между единицами',headers:['№','Что дано','Во что перевести'],rows:units.map(([a,b],i)=>[letters[i],counts[i]+' '+a,b])},conditionKey:counts.join('/')};
  }
  function alternatives(seed,r,step){
    const orig=seed?r(48,91):76,shift=seed?r(12,orig-9):34,show=n=>Math.floor(n/10)+' см '+n%10+' мм',small=orig-shift,large=orig+shift;
    const steps=[asNatural(step('Переведи длину MN в миллиметры.',orig,'Сантиметры дают десятки миллиметров. Прибавь отдельные миллиметры.')),asNatural(step('Переведи длину NK в миллиметры.',shift,'Применяй тот же перевод единиц.')),asNatural(step('Случай 1. K между M и N. Какова длина MK в миллиметрах?',small,'От всей длины MN отними участок KN. В сумме MK и KN должны вернуть MN.',[{value:large,text:'Так будет при N посередине. Здесь K находится на участке от M до N.'}])),asNatural(step('Случай 2. N между M и K. Какова длина MK в миллиметрах?',large,'На пути от M до K сначала лежит MN, затем NK.')),step('Сколько различных длин MK допускает условие?',2,'Точка K находится на заданном расстоянии от N влево или вправо.')];
    return {prompt:'На прямой MN = '+show(orig)+', NK = '+show(shift)+'. Запиши обе возможные длины MK в миллиметрах, через точку с запятой, в любом порядке.',inputPrompt:'Две длины MK в миллиметрах',answer:[small,large],answerFormat:'unordered',steps,errors:[],data:{kind:'two',orig,shift,small,large},table:{caption:'Два известных расстояния',headers:['Отрезок','Длина'],rows:[['MN',show(orig)],['NK',show(shift)]]},conditionKey:orig+'/'+shift};
  }
  const generators={'1.48':(s,r,t)=>combine('1.48',s,r,t),'1.49':(s,r,t)=>decompose('1.49',s,r,t),'1.50':(s,r,t)=>combine('1.50',s,r,t),'1.51':(s,r,t)=>decompose('1.51',s,r,t),'1.52':(s,r,t)=>combine('1.52',s,r,t),'1.53':(s,r,t)=>decompose('1.53',s,r,t),'1.54':links,'1.55':alternatives};
  const bounds={'1.48':{row:[0,2,0],view:[0,2,0]},'1.49':{row:[0,1,0],view:[0,2,0]},'1.50':{row:[0,2,0],view:[0,2,0]},'1.51':{row:[0,2,0],view:[0,2,0]},'1.52':{row:[0,2,0],view:[0,2,0]},'1.53':{row:[0,2,0],view:[0,2,0]},'1.54':{row:[0,3,0],view:[0,2,0]},'1.55':{side:[0,1,0]}};
  function distanceDiagram(d,side){
    const scale=220/d.large,m=24,n=m+scale*d.orig,k=m+scale*(side?d.large:d.small),arrows=(x,y,l)=>'<circle cx="'+x+'" cy="'+y+'" r="4" fill="#284b38"/><text x="'+x+'" y="'+(y-10)+'" text-anchor="middle" font-size="16">'+l+'</text>';
    return '<svg class="v5q-distance-line" viewBox="0 0 266 82" role="img" aria-label="Два возможных положения точки K на прямой относительно M и N"><path d="M8 48H260" stroke="#6c7e70"/><path d="M'+m+' 48H'+k+'" stroke="#297950" stroke-width="4"/>'+arrows(m,48,'M')+arrows(n,48,'N')+arrows(k,48,'K')+'<text x="12" y="76" font-size="12">'+(side?'Порядок M — N — K':'Порядок M — K — N')+'</text></svg>';
  }
  function explore(l,s,t,table){
    const d=t.data;
    if(d.kind==='two'){
      return {title:'Отложи NK по другую сторону',controls:[{key:'side',title:'Куда отложить NK от N',values:[[0,'В сторону M'],[1,'От M дальше по прямой']]}],visual:distanceDiagram(d,s.side),question:'Какова длина MK в этом положении в миллиметрах?',answer:s.side?d.large:d.small,why:s.side?d.orig+' + '+d.shift+' = '+d.large+' мм.':d.orig+' − '+d.shift+' = '+d.small+' мм.'};
    }
    const i=s.row,large=d.kind==='decompose'?d.large:d.kind==='links'?d.units[i][0]:d.rows[i][0][0],small=d.kind==='decompose'?d.small:d.kind==='links'?d.units[i][1]:d.target;
    const factor=mm[large]/mm[small],total=d.values[i],whole=Math.floor(total/factor),left=total%factor,parts=[factor,whole,left];
    const title=['Коэффициент перевода','Полные крупные единицы','Осталось мелких единиц'][s.view];
    const rows=[[large,'1',fmt(factor)+' '+small],[large,fmt(whole),fmt(whole*factor)+' '+small],[small,fmt(left),fmt(left)+' '+small]];
    return {title:'Разложи длину на группы и остаток',controls:[{key:'row',title:'Строка задания',values:d.values.map((v,i)=>[i,letters[i]])},{key:'view',title:'Что исследовать',values:[[0,'Одна полная группа'],[1,'Все полные группы'],[2,'Остаток']]}],visual:table('Одна единица и две части общей длины',['Ед.','Сколько','В мелких единицах'],rows)+'<p>Общая длина: '+fmt(total)+' '+small+'.</p>',question:[ 'Сколько '+small+' в одной единице '+large+'?','Сколько полных единиц '+large+' содержится в '+fmt(total)+' '+small+'?','Сколько '+small+' осталось после выделения полных единиц '+large+'?'][s.view],answer:parts[s.view],why:title+'. '+whole+' × '+factor+' + '+left+' = '+fmt(total)+' '+small+'.'};
  }
  const api={lessons,generators,bounds,readLengths,explore,distanceDiagram};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedLengthUnits=api;
})(typeof window!=='undefined'?window:globalThis);
