/* Part 1, p. 31. Common origin, hundreds in a class of digits and two distinct offices. */
(function(root){
  'use strict';
  const Digits=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digits.js'):root.Vilenkin5PrintedDigits;
  const entry=[
    ['1.148','Проведи прямые через одну точку','Проведи четыре разные прямые через A. Для экранного чертежа поставь две буквы каждой прямой по разные стороны от A. Первая буква луча всегда задаёт его начало. Число частей плоскости можно найти, обходя окрестность A по кругу.','Две прямые через одну точку дают четыре луча с началом в этой точке. Третья прямая внутри двух противоположных углов разделяет каждый из них на две части.'],
    ['1.149','Прочитай число по цифре и нулям','Запиши цифру, за ней все нужные нули. Затем отделяй по три цифры с правого края и прочитай первый непустой класс. Если в классе пусто, его название пропусти.','Цифра 2 и четыре нуля дают 20 000, то есть двадцать тысяч. Три следующие нулевые цифры сдвинут значение в следующий класс.'],
    ['1.150','Кому достанутся две разные должности?','Сначала выбери председателя. Для каждой кандидатуры составь отдельный список возможных секретарей. Один человек не занимает обе должности, а обмен должностями даёт другой результат.','Из трёх людей каждый может стать председателем. У каждого председателя остаются два разных варианта секретаря: всего шесть назначений.']
  ];
  const lessons=entry.map(([number,title,explanation,example])=>({number,title,explanation,worked:[example],key:'printed-'+number.replace('.','-'),part:1,point:5,page:31,misconception:{'1.148':'Одна прямая через A задаёт только один луч с началом в A.','1.149':'Чтобы прочитать большое число, надо произнести отдельное название для каждого нулевого класса.','1.150':'Выбор двух людей не зависит от того, кто из них председатель.'}[number],reflect:'Как проверить, что ничего не пропущено и ни один вариант не посчитан дважды?',requires:[number==='1.148'?'v5f-printed-1-100':number==='1.149'?'v5f-printed-1-24':'v5f-printed-1-114'],related:['v5f-printed-1-141']}));
  const err=(value,text)=>({value,text});
  const alphabet='BCEFGHKLMNPQRSTUVWXZ';
  function pencils(seed,r,step){
    const count=seed?(seed%2?3:5):4,pool=[...alphabet],letters=seed?Array.from({length:2*count},()=>pool.splice(r(0,pool.length-1),1)[0]):[...'LKCDMNPQ'],pairs=Array.from({length:count},(_,i)=>letters.slice(i*2,i*2+2));
    const steps=pairs.map(p=>({...step('На прямой '+p.join('')+' назови оба луча, которые начинаются в A. Запиши их в любом порядке.',p.map(n=>'A'+n).join(' '),'У этих лучей одно начало, но вторые точки лежат по разные стороны от начала.'),answerFormat:'v5-ray-objects',objectRule:{kind:'pencil',pairs:[p],outer:false,count:2}}));
    steps.push(step('Сколько разных лучей с началом в A получилось на всех показанных прямых?',2*count,'От каждой прямой из A идут два противоположных луча.',[err(count,'Ты посчитал прямые. У каждой из них две стороны от общей точки.')]));
    steps.push({...step('Теперь дополнительный вопрос к нашему чертежу: назови от каждой крайней отмеченной буквы по одному лучу, проходящему через A. Название с другой буквой той же прямой тоже подойдёт.',letters.map(n=>n+'A').join(' '),'Сначала назови начальную точку, затем A или другую отмеченную точку за A на той же прямой.'),answerFormat:'v5-ray-objects',objectRule:{kind:'pencil',pairs,outer:true,count:2*count}});
    return {prefix:'Проведи через общую точку все названные прямые: '+pairs.map(p=>p.join('')).join(', ')+'. На каждой A находится между двумя отмеченными буквами. ',prompt:'На сколько частей все показанные прямые делят плоскость?',inputPrompt:'Число частей',answer:2*count,steps,errors:[err(count,'Пройди вокруг A полный круг. Каждой прямой ты встретишь две стороны.'),err(4*count,'Рассматриваем участки вокруг общей точки A. Пересечения всех прямых совпадают.')],conditionKey:'rays/'+letters.join(''),data:{pencil:pairs},table:{caption:'Три точки каждой прямой по порядку',headers:['Прямая','Расположение'],rows:pairs.map(([a,b])=>[a+b,a+' · A · '+b])}};
  }
  function zeros(seed,r,step){
    const rows=seed?Array.from({length:4},()=>[r(1,9),r(3,9)]):[[1,4],[1,9],[1,6],[5,7]],items=rows.map(([digit,z])=>digit*(10**z));
    const steps=items.map((n,i)=>({...step((i<3?'а':'б')+'. Назови словами число, у которого первая цифра '+rows[i][0]+', а за ней '+rows[i][1]+' нулей.',Digits.words(n),'Отметь классы с правого края. Затем прочитай первый непустой класс вместе с его названием.'),answerFormat:'v5-reading'}));
    return {prefix:'У записей нет цифр после нулей. ',prompt:'Для последней записи из '+rows[3][0]+' и '+rows[3][1]+' нулей укажи, сколько в числе полных миллионов.',inputPrompt:'Количество полных миллионов',answer:Math.floor(items[3]/1000000),steps,errors:[err(items[3],'Записано всё число. Для количества миллионов отдели шесть младших разрядов.')],conditionKey:'zeros/'+rows.map(p=>p.join(',')).join('/'),data:{zeros:rows},table:{caption:'Ненулевая цифра и количество нулей справа',headers:['Пункт','Цифра','Нулей'],rows:rows.map(([d,z],i)=>[i<3?'а'+(i+1):'б',String(d),String(z)])}};
  }
  function offices(seed,r,step){
    const n=seed?r(3,10):6,answer=n*(n-1);
    const steps=[
      step('В правлении '+n+' человек. Сколько есть вариантов выбора председателя?',n,'Каждый участник может быть выбран первым.'),
      step('Одного председателя уже выбрали. Сколько других людей могут стать секретарём?',n-1,'Оставь всех, кроме самого председателя.',[err(n,'Председатель уже занимает первую должность. Вычеркни его из списка секретарей.')]),
      step('Если Анна — председатель, а Борис — секретарь, и затем они обменялись ролями, сколько различных назначений было названо?',2,'Должности различаются, даже если участвуют те же два человека.',[err(1,'Проверь, кто теперь ведёт заседание и кто делает запись. Роли поменялись.')])
    ];
    return {prefix:'Две разные должности занимают два разных участника. ',prompt:'Сколькими способами в правлении из '+n+' человек можно назначить председателя и секретаря?',inputPrompt:'Число назначений',answer,steps,errors:[err(n*n,'Сюда попали пары, где один человек занял обе должности.'),err(answer/2,'Ты считал пары людей без ролей. При обмене должностями назначение меняется.')],conditionKey:'offices/'+n,data:{offices:n},table:{caption:'Порядок назначения',headers:['Сначала','Затем'],rows:[['Председатель','Секретарь из оставшихся участников']]}};
  }
  function sketch(pairs,count=pairs.length){
    const cx=132,cy=83,angles=(pairs.length===5?[8,40,75,108,145]:[9,46,82,131]).map(v=>v*Math.PI/180),lines=[];
    for(let i=0;i<count;i++){
      const dx=Math.cos(angles[i]),dy=Math.sin(angles[i]),[a,b]=pairs[i];
      lines.push('<path d="M'+(cx-86*dx)+' '+(cy-72*dy)+' L'+(cx+86*dx)+' '+(cy+72*dy)+'" stroke="#35756a" stroke-width="2"/>');
      for(const [sign,name] of [[-1,a],[1,b]]){const x=cx+sign*68.8*dx,y=cy+sign*57.6*dy;lines.push('<circle cx="'+x+'" cy="'+y+'" r="2.6" fill="#9d412d"/><text x="'+(cx+sign*99*dx)+'" y="'+(cy+sign*78*dy+4)+'" text-anchor="middle" style="font:15px sans-serif">'+name+'</text>');}
    }
    return '<svg viewBox="0 0 264 168" role="img" aria-label="'+count+' прямых через A; пары букв '+pairs.slice(0,count).map(p=>p.join('')).join(', ')+'">'+lines.join('')+'<circle cx="132" cy="83" r="3.5" fill="#9d412d"/><text x="147" y="80" style="font:15px sans-serif;paint-order:stroke;stroke:white;stroke-width:2px;fill:#253c31">A</text></svg>';
  }
  function explore(l,s,t,table){
    if(t.data.pencil){
      const count=s.lines===0?t.data.pencil.length:Math.min(s.lines,t.data.pencil.length);
      return {title:'Посчитай лучи у общей точки',controls:[{key:'lines',title:'Сколько прямых провести',values:[[0,'Все: '+t.data.pencil.length],...t.data.pencil.map((_,i)=>[i+1,i+1])]}],visual:sketch(t.data.pencil,count),question:'На сколько частей показанные прямые делят плоскость?',answer:2*count,why:'При полном обходе вокруг A каждая прямая встречается дважды. Между соседними лучами лежит одна часть плоскости.'};
    }
    if(t.data.zeros){
      const [digit,z]=t.data.zeros[s.row],raw=String(digit)+'0'.repeat(z),parts=raw.replace(/\B(?=(\d{3})+(?!\d))/g,' ').split(' '),names=['единицы','тысячи','миллионы','миллиарды'];
      return {title:'Разложи запись по классам',controls:[{key:'row',title:'Запись',values:t.data.zeros.map((_,i)=>[i,i<3?'а'+(i+1):'б'])}],visual:table('Цифра '+digit+', нулей '+z+'. Классы числа',['Класс','Цифры'],parts.map((p,i)=>[names[parts.length-1-i],p])),question:'Какое число находится внутри первого непустого класса?',answer:+parts[0],why:'Отделяй группы по три цифры начиная справа. Слева может остаться группа из одной или двух цифр.'};
    }
    const n=t.data.offices,letters='АБВГДЕЖЗИК'.slice(0,n),chair=letters[s.chair%n],others=[...letters].filter(x=>x!==chair);
    return {title:'Закрепи председателя и перебери секретарей',controls:[{key:'chair',title:'Председатель',values:[...letters].map((x,i)=>[i,x])},{key:'ask',title:'Сосчитай',values:[[0,'При этом председателе'],[1,'Для всего правления']]}],visual:table('Допустимые назначения с выбранным председателем',['Председатель','Секретарь'],others.map(x=>[chair,x])),question:s.ask?'Сколько назначений получится для всех кандидатур председателя?':'Сколько секретарей можно назначить при выбранном председателе?',answer:s.ask?n*(n-1):n-1,why:'При каждом из '+n+' разных председателей остаётся по '+(n-1)+' вариантов секретаря.'};
  }
  const generators={'1.148':pencils,'1.149':zeros,'1.150':offices},bounds={'1.148':{lines:[0,5,0]},'1.149':{row:[0,3,0]},'1.150':{chair:[0,9,0],ask:[0,1,0]}};
  const api={lessons,generators,bounds,sketch,explore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5LinesPlacesRoles=api;
})(typeof window!=='undefined'?window:globalThis);
