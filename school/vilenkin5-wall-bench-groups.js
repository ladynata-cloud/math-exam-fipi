/* Виленкин и соавторы, 2023, часть 2, §26, с. 17. */
(function(root){
  'use strict';
  const lessons=[
    [78,'Сколько блоков в защитной стене?','Сопоставь каждое измерение стены с таким же измерением блока. Сначала найди количество блоков в одном ряду. Затем узнай число рядов в слое и число слоёв.','Площадка из трёх рядов по пять блоков содержит 15 блоков в слое. Два таких слоя содержат 30 блоков.','Чтобы вычислить количество блоков, достаточно поделить длину стены на длину блока.'],
    [79,'Как рассадить друзей на скамейке?','Места идут слева направо. После выбора первого человека один друг уже сидит. Для следующего места остаётся на одного кандидата меньше. Число продолжений перемножается.','У Ани, Бори и Веры три выбора для первого места и по два для второго. Третье место занимает оставшийся друг. Получаем 3 · 2 · 1 = 6.','Если поменять местами первого и последнего, получится прежняя рассадка.'],
    [80,'Сколько было в каждой равной группе?','После одинаковой прибавки группы всё ещё равны. Раздели итог на число групп и вычти прибавку к одной группе. Для проверки прибавь её назад и найди общий результат.','В двух коробках было поровну бусин. После добавления четырёх в каждую стало 24. Теперь в одной 12, а раньше было 12 − 4 = 8.','Чтобы узнать начальное количество в одной группе, надо отнять всего одну прибавку от общей суммы и сразу разделить.']
  ].map(([n,title,explanation,example,misconception])=>({number:'5.'+n,key:'printed-5-'+n,part:2,point:26,page:17,title,requires:[n===78?'v5f-printed-5-20':n===79?'v5f-printed-5-27':'v5f-printed-5-62'],related:['v5f-printed-5-27'],explanation,worked:[example],misconception,reflect:n===78?'Что считает произведение первых двух количеств?':n===79?'Почему на последнее место остаётся ровно один выбор?':'Как проверить ответ прямым действием?'}));
  function wall(seed,r,step){
    const block=seed?[r(4,14),r(2,7),r(3,8)]:[12,4,6],counts=seed?[r(30,160),r(4,15),r(3,12)]:[400,12,10];
    const sides=counts.map((v,i)=>v*block[i]),[along,across,high]=counts,layer=along*across,total=layer*high;
    const prompt='Прямоугольная стена для защиты набережной имеет размеры '+sides.join(' × ')+' дм. Её складывают без зазоров из одинаково уложенных блоков размером '+block.join(' × ')+' дм. Размеры даны в порядке: длина, ширина, высота.';
    return {steps:[step(prompt+' Сколько блоков в одном ряду по длине?',along,'Раздели длину стены на длину одного блока.',[]),step('Сколько таких рядов помещается по ширине?',across,'Сравни ширину стены и ширину блока.',[]),step('Сколько блоков в одном полном слое?',layer,'Умножь число блоков в ряду на число рядов.',[{value:along+across,text:'Длины рядов надо сложить столько раз, сколько рядов. Это умножение.'}]),step('Сколько слоёв по высоте?',high,'Сравни высоты стены и одного блока.',[])],prompt:prompt+' Сколько блоков во всей стене?',answer:total,inputPrompt:'Количество блоков',why:layer+' блоков в слое, таких слоёв '+high+'.',errors:[{value:layer,text:'Это только нижний слой. Узнай, сколько таких слоёв по высоте.'},{value:along,text:'Посчитан единственный ряд. Учти также ширину и высоту.'}],data:{wallBenchGroups:{kind:'wall',block,counts,sides}},conditionKey:'wall/'+block.join('-')+'/'+counts.join('-')};
  }
  function factorial(n){let result=1;for(let i=2;i<=n;i++)result*=i;return result;}
  function seating(seed,r,step){
    const n=seed?r(3,8):6,prompt='На скамейке '+n+' мест в один ряд. Друзей столько же, сколько мест. Рассадки различны, если хотя бы на одном месте сидит другой человек.';
    const steps=[step(prompt+' Сколько друзей могут занять первое место?',n,'Пока все друзья свободны.',[]),step('Один друг уже сел. Сколько кандидатов осталось для второго места?',n-1,'Вычти одного занятого человека.',[{value:n,text:'Первого друга уже нельзя посадить второй раз.'}]),step('Сколько разных способов заполнить только первые два места?',n*(n-1),'У каждого первого выбора одинаковое число продолжений.',[{value:2*n-1,text:'Для каждого первого кандидата перебираются все вторые кандидаты. Здесь нужно умножение.'}])];
    return {steps,prompt:prompt+' Сколькими способами могут сесть все друзья?',answer:factorial(n),inputPrompt:'Количество рассадок',why:Array.from({length:n},(_,i)=>n-i).join(' · ')+' = '+factorial(n)+'.',errors:[{value:n,text:'Посчитаны только кандидаты на первое место. Продолжи выбор до последнего места.'}],data:{wallBenchGroups:{kind:'bench',n}},conditionKey:'bench/'+n};
  }
  function groups(seed,r,step){
    const a=seed?r(7,29):14,b=seed?r(17,48):34,incA=seed?r(2,8):3,incB=seed?r(2,9):6,nA=2,nB=3,tA=nA*(a+incA),tB=nB*(b+incB);
    const first='На двух участках смородины было поровну. После посадки ещё '+incA+' кустов на каждом участке общее число кустов стало '+tA+'.';
    const second='В трёх корзинах было поровну яблок. После того как в каждую положили ещё по '+incB+', всего стало '+tB+' яблок.';
    return {steps:[step(first+' Сколько кустов стало на одном участке?',tA/nA,'Оба участка остались равными. Раздели итог надвое.',[]),step('Сколько кустов было вначале на каждом участке?',a,'Убери с каждого участка его прибавку.',[{value:a+incA,text:'Это количество после посадки. Восстанови исходное число кустов.'}]),step(second+' Сколько яблок стало в одной корзине?',tB/nB,'Раздели новый итог на три.',[])],prompt:second+' Сколько яблок было сначала в каждой корзине?',answer:b,inputPrompt:'Яблок в одной корзине до прибавки',why:'В одной корзине стало '+tB/nB+'. Вычти '+incB+' добавленных яблок.',errors:[{value:b+incB,text:'Ты нашёл число после прибавки. В условии спрашивают, сколько было сначала.'},{value:(tB-incB)/nB,text:'Добавляли в каждую из трёх корзин. Всего добавили втрое больше, чем в одну.'}].filter(e=>Number.isInteger(e.value)),data:{wallBenchGroups:{kind:'groups',groups:[[nA,incA,a],[nB,incB,b]]}},conditionKey:'groups/'+[a,b,incA,incB].join('/')};
  }
  function miniWall(p,i,built){
    const [long,wide,high]=p.counts;
    const legend=['По длине: '+p.sides[0]+' дм, один блок '+p.block[0]+' дм.','По ширине: '+p.sides[1]+' дм, один блок '+p.block[1]+' дм.','Один слой состоит из одинаковых рядов.','По высоте: '+p.sides[2]+' дм, один блок '+p.block[2]+' дм.','Каждый слой повторяет нижний.'];
    let diagram='';
    // The long row is cropped deliberately. Dimensions remain printed in the caption.
    const rows=i===0?1:Math.min(3,wide),layers=built!==undefined?Math.min(3,built):i>=3?Math.min(3,high):1;
    if(layers===0)diagram='<path d="M20 88H165l24 -18" stroke="#527480" fill="none" stroke-dasharray="4 3"/>';
    for(let h=0;h<layers;h++)for(let j=rows-1;j>=0;j--)for(let k=0;k<5;k++){
      const x=20+k*28+j*8,y=87-j*6-h*14;
      diagram+='<path d="M'+x+' '+y+'l28 0 8 -6 -28 0z" fill="#c9e3d6" stroke="#294d56"/><path d="M'+x+' '+y+'h28v14h-28z" fill="#96bdaf" stroke="#294d56"/><path d="M'+(x+28)+' '+y+'l8 -6v14l-8 6z" fill="#6f9a91" stroke="#294d56"/>';
    }
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 225 112" role="img" aria-label="Небольшой фрагмент кладки" style="display:block;width:100%;max-width:330px">'+diagram+'<text x="196" y="89" text-anchor="middle" font-size="20">…</text></svg><figcaption>'+(layers===0?'Место для первого слоя.':built>3?'Показаны три слоя из выбранных '+built+'.':'Показан фрагмент стены.')+' '+legend[i]+'</figcaption></figure>';
  }
  function bench(p,fixed){
    const s=Array.from({length:p.n},(_,i)=>'<span style="border:1px solid #58747b;border-bottom:4px solid #58747b;border-radius:4px;padding:.23em .4em;background:'+(i<fixed?'#b4d8c9':'#f7f9f8')+'">'+(i<fixed?'●':'○')+' '+(i+1)+'</span>').join('');
    return '<figure style="margin:.4em 0"><div style="display:flex;flex-wrap:wrap;gap:4px" role="img" aria-label="Заняты '+fixed+' мест из '+p.n+'">'+s+'</div><figcaption>Места пронумерованы слева направо. Закрашенный знак показывает занятое место.</figcaption></figure>';
  }
  function boxes(p,i){
    const [n,add,before]=p.groups[i],after=before+add,label=i?'корзина':'участок';
    return '<figure style="margin:.4em 0"><div style="display:grid;gap:.35em">'+Array.from({length:n},(_,j)=>'<div style="display:flex;align-items:center;gap:.25em"><b>'+label+' '+(j+1)+'</b> <span style="padding:.2em .7em;background:#d5e4f0">Было ?</span> + <span style="padding:.2em .6em;background:#d1e6d5">'+add+'</span></div>').join('')+'</div><figcaption>Всего после прибавки: '+n*after+'.</figcaption></figure>';
  }
  function draw(t,s){const p=t.data.wallBenchGroups,i=s?.mode==='learn'?s.step:t.steps.length;return p.kind==='wall'?miniWall(p,i):p.kind==='bench'?bench(p,i===1?1:0):boxes(p,i<2?0:1);}
  function explore(t,s){const p=t.data.wallBenchGroups;
    if(p.kind==='bench'){const limit=Math.min(p.n,s.count);return {title:'Занимай места по очереди',controls:[{key:'count',title:'Сколько друзей уже сидят',values:Array.from({length:p.n+1},(_,i)=>[i,String(i)])}],visual:bench(p,limit),question:'Сколькими способами можно заполнить оставшиеся места, если сидящих не пересаживать?',answer:factorial(p.n-limit),why:p.n===limit?'Все места уже заняты. Есть один способ завершить эту рассадку — оставить её как есть.':'Перемножь числа кандидатов только для свободных мест.'};}
    if(p.kind==='wall'){const count=Math.min(s.count,p.counts[2]);return {title:'Собери стену по слоям',controls:[{key:'count',title:'Количество собранных слоёв',values:Array.from({length:p.counts[2]+1},(_,i)=>[i,String(i)])}],visual:miniWall(p,count===0?2:4,count)+'<p>Собрано слоёв: '+count+'.</p>',question:'Сколько блоков содержат выбранные полные слои?',answer:p.counts[0]*p.counts[1]*count,why:'Посчитай один полный слой и умножь на число выбранных слоёв.'};}
    const [n,add]=p.groups[s.index];return {title:'Проверь одинаковые прибавки',controls:[{key:'index',title:'Какие группы взять',values:[[0,'Участки с кустами'],[1,'Корзины с яблоками']]}],visual:boxes(p,s.index),question:'Сколько всего добавили во все группы?',answer:n*add,why:'Умножь прибавку к одной группе на число групп.'};
  }
  const api={lessons,generators:{'5.78':wall,'5.79':seating,'5.80':groups},bounds:{'5.78':{count:[0,12,1]},'5.79':{count:[0,8,0]},'5.80':{index:[0,1,0]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5WallBenchGroups=api;
})(typeof window!=='undefined'?window:globalThis);
