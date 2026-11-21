/* Open constructions on the line, Vilenkin (2023), part 1, p. 24. */
(function(root){
  'use strict';
  const lessons=[
    ['1.95','Выбери собственные точки на прямой KL','Отрезок содержит концы и все точки между ними. Прямая на концах отрезка продолжается. Поэтому точка может лежать на прямой и при этом быть вне отрезка.','На шкале с концами 3 и 7 точки 1 и 9 лежат на той же прямой вне отрезка. Подходят оба выбора.','Любая точка прямой KL лежит на отрезке KL.'],
    ['1.96','Дай одной прямой все её имена','Две разные отмеченные точки задают прямую. При чтении обозначения с другого конца получаем ту же прямую. Если просят все возможные записи, у каждой пары есть два порядка.','Прямую через E, F и G можно назвать EF или FE. После этого рассмотрим пары E с G и F с G.','Если написать BM вместо MB, получится другая прямая.'],
    ['1.97','Два отрезка по разные стороны от M','Положи линейку вдоль построенной прямой. От M в одну сторону отложи первый отрезок, в другую второй. Всё построение можно повернуть или прочитать в противоположном направлении. Длинного листа для рассуждения о точке в километре от N не требуется.','Если от общего начала вправо отложили 6 см, а влево 2 см, между крайними точками будет 8 см.','На прямой нет точек дальше края листа.']
  ].map(([number,title,explanation,worked,misconception])=>({number,key:'printed-'+number.replace('.','-'),title,explanation,worked:[worked],misconception,reflect:'Что изменится при обратном направлении взгляда и что останется тем же?',part:1,point:4,page:24,requires:['v5f-segment-length'],related:['v5f-printed-1-92']}));
  const err=(value,text)=>({value,text}), select=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])});
  function orderedNames(input){
    const aliases={'А':'A','В':'B','С':'C','К':'K','М':'M','Н':'H','О':'O','Р':'P','Т':'T','Х':'X'};
    const tokens=String(input).trim().toUpperCase().replace(/[АВСМНОРТХК]/g,c=>aliases[c]).split(/[\s;,]+/);if(tokens.some(x=>!/^[A-Z]{2}$/.test(x)||x[0]===x[1]))return null;
    return [...new Set(tokens)].sort().join(' ');
  }
  function parsePosition(input){const s=String(input).trim();return /^\d+$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;}
  function accepts(input,t){
    if(t.answerFormat==='v5-ordered-line-names')return orderedNames(input)===orderedNames(t.answer);
    const x=parsePosition(input),[a,b,max,inside]=t.position;return x!==null&&x>=0&&x<=max&&((x>=a&&x<=b)===inside);
  }
  function ruler(total,marks,segment=[],far=false){
    const left=16,right=242,at=x=>left+x*(right-left)/total,base=48;
    const groups=new Map();for(const [name,x] of marks){if(!groups.has(x))groups.set(x,[]);groups.get(x).push(name);}
    const labels=[...groups].map(([x,names])=>{
      return '<path d="M'+at(x)+' 45V32" stroke="#304754"/><circle cx="'+at(x)+'" cy="'+base+'" r="2.9" fill="#243e50"/><text x="'+at(x)+'" y="28" text-anchor="middle" style="font-size:12px">'+names.join('=')+'</text>';
    }).join('');
    const ticks=Array.from({length:total+1},(_,i)=>'<path d="M'+at(i)+' 45v8" stroke="#4f6873"/>'+(total<=15||i%2===0?'<text x="'+at(i)+'" y="65" text-anchor="middle" style="font-size:9px">'+i+'</text>':'')).join('');
    return '<svg role="img" viewBox="0 0 258 89" aria-label="Прямая продолжается в обе стороны. Деления: '+marks.map(([n,x])=>n+' — '+x).join(', ')+'."><path d="M4 48H254 M10 44l-6 4 6 4 M248 44l6 4-6 4" fill="none" stroke="#46777a" stroke-width="2"/>'+ (segment.length?'<path d="M'+at(segment[0])+' 48H'+at(segment[1])+'" stroke="#a7511d" stroke-width="4"/>':'')+ticks+labels+'</svg>'+(far?'<p>Оба направления продолжаются за рисунком. Большое расстояние показано словами, шкала относится лишь к видимому участку.</p>':'');
  }
  function first(seed,r,step){
    const a=seed?r(2,5):4,b=seed?r(7,10):8,max=12;
    const group=(inside,txt)=>({...step(txt,inside?a+1:b+1,inside?'Оба конца и всё между ними принадлежат отрезку.':'За каждым из двух концов начинается часть прямой вне отрезка.',
      inside?[err(a-1,'Эта точка уже за K. Отрезок включает K, L и деления между ними.'),err(b+1,'Это деление за L. Для M выбери место на самом отрезке.')]:Array.from({length:b-a+1},(_,i)=>err(a+i,'Выбрано деление самого отрезка KL. Для P пройди за один из его концов.'))),answerFormat:'v5-open-position',position:[a,b,max,inside]});
    return {prefix:seed?'Новая авторская шкала. ':'Построй точки как в подпунктах а и б. ',prompt:'б. Отметив M на отрезке KL, реши: лежит ли эта точка также на прямой KL? Введи да или нет.',inputPrompt:'Да или нет',answer:'да',answerFormat:'v5-check-word',steps:[group(false,'а. Подбери на видимой шкале целое деление для P. Точка должна лежать на прямой KL вне отрезка KL. Введи любое подходящее деление.'),group(true,'б. На каком из видимых делений можно поставить точку M, принадлежащую отрезку KL? Выбери сам.')],
      errors:[err('нет','Точка отрезка лежит также на проходящей через его концы прямой.')],table:{caption:'Два конца отрезка',headers:['Точка','Деление'],rows:[['K',a],['L',b]]},data:{position:{a,b,max}},conditionKey:a+'/'+b};
  }
  function names(seed,r,step){
    const alphabet=seed?Array.from('AEFHTUV'):Array.from('MBC');if(seed)for(let i=alphabet.length-1;i>0;i--){const j=r(0,i);[alphabet[i],alphabet[j]]=[alphabet[j],alphabet[i]];}
    const letters=alphabet.slice(0,3),coords=[2,seed?r(4,7):6,10],all=letters.flatMap(a=>letters.filter(b=>a!==b).map(b=>a+b)),both=all.join(' ');
    const steps=letters.map((a,i)=>({...step('Какие две записи прямой начинаются с '+a+'? Напиши обе пары букв.',all.slice(2*i,2*i+2).join(' '),'После первой буквы ставь по очереди каждую из двух оставшихся точек.'),answerFormat:'v5-ordered-line-names'}));
    return {prefix:'Три точки лежат на одной построенной прямой. ',prompt:'Собери все возможные обозначения прямой с этими тремя точками. Нужны обе записи для каждой пары, например EF и FE. Введи обозначения через пробел.',inputPrompt:'Все обозначения',answer:both,answerFormat:'v5-ordered-line-names',steps,
      errors:[err([letters[0]+letters[1],letters[0]+letters[2],letters[1]+letters[2]].join(' '),'Ты перечислил три пары. Для каждой можно записать буквы также в обратном порядке.')],data:{names:{letters,coords}},table:{caption:'Точки построенной прямой',headers:['Точка','Деление'],rows:letters.map((n,i)=>[n,coords[i]])},conditionKey:letters.join('')+coords.join('/')};
  }
  function opposite(seed,r,step){
    const mn=seed?r(3,8):5,mk=seed?r(2,6):4,km=seed?r(1,4):1;
    const steps=[step('Поставь M в центре рисунка, N справа от неё. На сколько сантиметров от M нужно передвинуться к N?',mn,'Считай промежутки между делениями до N.'),
      {...step('В какую сторону от M надо поставить K: вправо или влево, если N справа?', 'влево','M лежит между K и N. Чтобы попасть к K, иди в противоположную от N сторону.',[err('вправо','Обе точки оказались бы справа от M. Пройди от M в другую сторону.')]),answerFormat:'v5-check-word',words:['влево','налево']},
      step('Сколько сантиметров будет между K и N?',mn+mk,'Полный путь K–M–N состоит из двух отрезков. Сложи обе длины.',[err(Math.abs(mn-mk),'Вычитают при измерении от M в одну сторону. Сейчас M между двумя концами.')]),
      {...step('Есть ли на прямой MK точка на расстоянии '+km+' км от N? Введи да или нет.','да','Прямая продолжается за видимым участком. От N можно пройти заданное расстояние.',[err('нет','Шкала на экране ограничена. Саму прямую можно продолжать за её край.')]),answerFormat:'v5-check-word'}];
    return {prefix:seed?'Новые длины для того же построения. ':'Построй MN длиной 5 см и MK длиной 4 см по разные стороны от M. ',prompt:'Проверь оба направления от N. Сколько различных точек прямой находятся ровно в '+km+' км от N?',inputPrompt:'Число точек',answer:2,steps,errors:[err(1,'Пройди от N заданное расстояние в одну сторону. Что получится, если пройти столько же в другую?')],data:{opposite:{mn,mk,km}},table:{caption:'Длины для построения',headers:['Что отмечаем','Длина'],rows:[['MN',mn+' см'],['MK',mk+' см'],['Дальняя точка от N',km+' км']]},conditionKey:[mn,mk,km].join('/')};
  }
  function diagram(t,scene){
    const d=t.data;
    if(d.position){const {a,b,max}=d.position,marks=[['K',a],['L',b]];for(const [i,n] of ['P','M'].entries()){const x=scene?.answers?.[i];if(x!=null&&parsePosition(x)!==null)marks.push([n,parsePosition(x)]);}return ruler(max,marks,[a,b]);}
    if(d.names)return ruler(12,d.names.letters.map((n,i)=>[n,d.names.coords[i]]));
    const {mn,mk}=d.opposite;return ruler(mn+mk+2,[['K',1],['M',mk+1],['N',mk+mn+1]],[1,mk+mn+1],true);
  }
  function explore(l,s,t){
    if(t.data.position){const {a,b,max}=t.data.position,p=s.p,m=s.m,test=s.which?p>=a&&p<=b:m>=a&&m<=b;
      return {title:'Построй собственные P и M',controls:[{key:'p',title:'Деление для P',min:0,max,step:1},{key:'m',title:'Деление для M',min:0,max,step:1},select('which','Что проверить',['Моя M на отрезке','Моя P вне отрезка'])],visual:ruler(max,[['K',a],['L',b],['P',p],['M',m]],[a,b]),question:s.which?'Выполнила ли точка P условие подпункта а? 1 — да, 0 — нет.':'Выполнила ли точка M условие подпункта б? 1 — да, 0 — нет.',answer:Number(s.which?!test:test),why:'P должна быть за одним из концов. M должна быть между концами или на одном из них.'};
    }
    if(t.data.names){const {letters,coords}=t.data.names,a=letters[s.startLetter],c=letters[s.endLetter],same=a===c;
      return {title:'Проверь выбранное обозначение',controls:[select('startLetter','Первая буква',letters),select('endLetter','Вторая буква',letters)],visual:ruler(12,letters.map((q,i)=>[q,coords[i]]))+'<p>Твоя запись: '+a+c+'.</p>',question:'Можно ли обозначить построенную прямую выбранной парой? 1 — да, 0 — нет.',answer:Number(!same),why:same?'Одна точка не определяет единственную прямую. Выбери другую вторую букву.':'Две разные точки определяют прямую. Обратное название обозначает её же.'};}
    const {mn,mk,km}=t.data.opposite,far=Boolean(s.ask),flip=Boolean(s.flip),length=mn+mk+2,center=flip?mn+1:mk+1,kn=flip?center+mk:center-mk,nn=flip?center-mn:center+mn;
    return {title:'Поверни построение вокруг M',controls:[select('flip','Направление от M к N',['Вправо','Влево']),select('ask','Какую длину проверить',['От K до N, см','На сколько сантиметров удалиться от N'])],visual:ruler(length,[['M',center],['K',kn],['N',nn]],[kn,nn],far),question:far?'Сколько сантиметров нужно пройти от N в выбранную сторону, чтобы преодолеть '+km+' км?':'Сколько сантиметров от K до N по прямой?',answer:far?km*100000:mn+mk,why:far?'Один километр содержит тысячу метров по сто сантиметров.':'Порядок концов изменился, каждая из двух длин осталась прежней.'};
  }
  const api={lessons,generators:{'1.95':first,'1.96':names,'1.97':opposite},bounds:{'1.95':{p:[0,12,0],m:[0,12,5],which:[0,1,0]},'1.96':{startLetter:[0,2,0],endLetter:[0,2,1]},'1.97':{flip:[0,1,0],ask:[0,1,0]}},accepts,orderedNames,parsePosition,explore,diagram};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PointFourBuild=api;
})(typeof window!=='undefined'?window:globalThis);
