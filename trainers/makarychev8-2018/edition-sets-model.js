(function(){
  'use strict';
  const {register,q,sample,range}=window.AdvancedSetsSchool;
  register(16,null,'Несколько процентов одного числа','Найди 1%, 10%, 90% и 120% от 360.',
    'Одна сотая от 360 равна 3,6. Для остальных долей умножь 3,6 на 10, 90 и 120. Получатся 36, 324 и 432. При 120% ответ больше целого.',
    'Сначала определи значение одной сотой. Процент может превышать сто.',s=>{
      const total=240+20*s;
      return sample('Шкала процентов для '+total,[['Целое',total],['Проверяем','1%, 90%, 120%']],[
        q('Чему равен 1%?',total/100,'Раздели на сто.',total/10,'Вы нашли десятую часть, то есть 10%.'),
        q('Чему равны 90%?',0.9*total,'Вычти одну десятую из целого.',0.1*total,'Это оставшаяся десятая часть, а нужны девять десятых.'),
        q('Чему равны 120%?',1.2*total,'К целому прибавь одну пятую.',0.2*total,'Учтены дополнительные 20%, но не исходные 100%.')
      ],'set-percent',{base:total,fractions:[1,90,120]});
    });
  const amounts=[[5,400],[20,75],[50,16],[75,40],[150,240],[7,35]];
  amounts.forEach(([percent,original],i)=>{
    const strategy=['5% — двадцатая часть.','20% — пятая часть.','50% — половина.','75% — три четверти.','150% — полтора исходных числа.','7% — семь сотых.'][i];
    register(17,i,'Доля '+percent+'% от '+original,'Найди '+percent+'% от '+original+'.',
      strategy+' Получаем '+String(original*percent/100).replace('.',',')+'.','Уточни, от какой величины берётся процент, и сохрани эту базу.',s=>{
        const total=original+5*s;
        return sample('Найди '+percent+'% от '+total,[['Целое',total],['Процент',percent]],[
          q('Чему равен 1% этой базы?',total/100,'Раздели целое на сто.',total/10,'Это 10%, для одного процента нужно разделить ещё на 10.'),
          q('Какое число выражает '+percent+'% как часть единицы?',percent/100,'Преобразуй процент в дробь со знаменателем 100.',percent,'Без деления на 100 получается число процентов, а не доля единицы.'),
          q('Чему равна искомая величина?',total*percent/100,'Умножь целое на долю.',total*percent,'Процент ещё надо перевести в долю делением на 100.')
        ],'set-percent',{base:total,fractions:[1,percent,100]});
      });
  });
  register(18,null,'Продажи от исходного запаса и от остатка','В запасе 5 т картофеля. Сначала проданы 30% исходного количества, затем 40% остатка. Сколько тонн осталось?',
    'После первого дня осталось 70% от 5 т, то есть 3,5 т. Во второй день остаётся 60% от 3,5 т, или 2,1 т. Складывать 30% и 40% нельзя: у них разные базы.',
    'После каждого дня подпиши новую базу для следующего вычисления.',s=>{
      const total=4+s,p=20+5*(s%4),r=15+5*(s%5),after=total*(100-p)/100,last=after*(1-r/100);
      return sample('Запас с двумя последовательными продажами',[['Исходный запас, т',total],['Продали сначала, %',p],['Доля остатка во второй день, %',r]],[
        q('Сколько тонн осталось после первого дня?',after,'Умножь исходный запас на оставшуюся долю.',total*p/100,'Вы нашли проданное, а спрашивали оставшееся.'),
        q('Сколько тонн продано именно во второй день?',after*r/100,'База второй продажи — новый остаток.',total*r/100,'Во второй день доля берётся не от первоначального запаса.'),
        q('Сколько тонн осталось в конце?',last,'Из первого остатка вычти вторую продажу.',total*(1-(p+r)/100),'Проценты от разных исходных величин нельзя просто сложить.')
      ],'set-stages',{values:[total,after,last],labels:['сначала','после дня 1','после дня 2']});
    });
  register(19,null,'Начальный вклад и проценты за год','Определи, какой станет сумма 1500 рублей после начисления 16% за один год.',
    'Доход равен 1500 · 16/100 = 240 рублей. Банк возвращает исходные 1500 рублей вместе с доходом. Получаем 1740 рублей.',
    'Различай сумму начисленных процентов и полную сумму после начисления.',s=>{
      const total=1100+100*s,p=6+s,interest=total*p/100;
      return sample('Одно годовое начисление',[['Вклад, руб.',total],['Годовая ставка, %',p]],[
        q('Сколько рублей составит 1% вклада?',total/100,'Раздели вклад на 100.',total/10,'Это одна десятая, а не одна сотая.'),
        q('Каков доход по заданной ставке?',interest,'Умножь один процент на ставку.',total+interest,'В ответ уже включён сам вклад. Сейчас нужен только доход.'),
        q('Какова полная сумма через год?',total+interest,'Сложи вклад и полученный доход.',interest,'Вы посчитали только приращение.')
      ],'set-stages',{values:[total,interest,total+interest],labels:['вклад','доход','итого']});
    });
  const course=window.MathExamTopicEdition,older=course.figure;
  const text=(x,y,v)=>'<text x="'+x+'" y="'+y+'">'+v+'</text>';
  course.figure=function(d){
    if(typeof d.chart!=='string'||!d.chart.startsWith('set-'))return older(d);
    const m=d.model;let body='',title;
    if(d.chart==='set-sieve'){
      title='Кандидаты и отобранные элементы конечного множества';
      const xs=m.universe,y=new Set(m.selected),cols=Math.min(18,xs.length),spacing=cols>1?Math.min(15,242/(cols-1)):1;
      xs.forEach((v,i)=>{const cx=17+(i%cols)*spacing,cy=20+14*Math.floor(i/cols);body+='<circle cx="'+cx+'" cy="'+cy+'" r="4.5" fill="'+(y.has(v)?'#376b50':'#dce7df')+'"/>';});
      body+=text(10,107,'тёмные точки входят в множество');
    }else if(d.chart==='set-groups'){
      title='Значения и признаки принадлежности';
      m.items.forEach((v,i)=>{const x=10+88*i;body+='<rect x="'+x+'" y="30" width="79" height="36" rx="4" fill="#d9e9e0"/>'+text(x+7,52,v)+text(x+4,89,m.labels[i]);});
    }else if(d.chart==='set-polygon'){
      title='Смежные вершины и замыкающая сторона';const n=m.n;
      const points=range(0,n-1).map(i=>[132+75*Math.cos(-Math.PI/2+2*Math.PI*i/n),57+38*Math.sin(-Math.PI/2+2*Math.PI*i/n)]);
      body='<polygon fill="#e8f2eb" stroke="#3c7158" stroke-width="2" points="'+points.map(p=>p.join(',')).join(' ')+'"/>';
      points.forEach(([x,y],i)=>{body+='<circle cx="'+x+'" cy="'+y+'" r="3" fill="#456a58"/>'+text(x+4,y+3,i+m.start);});
    }else if(d.chart==='set-letters'){
      title='Первое и повторное появление каждой буквы';const known=new Set();
      m.chars.forEach((ch,i)=>{const x=9+22*i,repeat=known.has(ch);known.add(ch);body+='<rect x="'+x+'" y="32" width="19" height="27" fill="'+(repeat?'#dfc2c9':'#cae0cf')+'"/>'+text(x+5,50,ch);});
      body+=text(10,87,'зелёный — первое появление буквы');
    }else if(d.chart==='set-digits'){
      title='Число доступных цифр по разрядам';
      for(let i=0;i<m.len;i++){const x=8+88*i;body+='<rect x="'+x+'" y="29" width="78" height="38" fill="#d4e6d9"/>'+text(x+5,51,(i?m.allowed:m.first).join(', '))+text(x+5,88,'разряд '+(i+1));}
    }else{
      const percent=d.chart==='set-percent',values=percent?m.fractions:m.values,labels=percent?m.fractions.map(n=>n+'%'):m.labels;
      title=percent?'Части и целое на общей процентной шкале':'Изменение величины по этапам';
      const max=Math.max(...values,percent?100:1);
      values.forEach((v,i)=>{const y=23+30*i;body+=text(7,y,labels[i])+'<rect x="91" y="'+(y-10)+'" width="'+(125*v/max)+'" height="11" fill="'+(i===1?'#b6808b':'#58806a')+'"/>'+text(222,y,Number(v.toFixed(3)));});
    }
    return '<svg viewBox="0 0 280 116" role="img" aria-label="'+title+'"><g fill="#284637" font-family="sans-serif" font-size="11">'+body+'</g></svg>';
  };
})();
