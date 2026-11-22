(function(){
  'use strict';
  const {lessons,add,example}=window.MathExamTopicPractice,order=[];
  const q=(prompt,answer,calculation,bad,error)=>({prompt,answer,calculation,error,mistakes:[[bad,error]]});
  const g=(a,b)=>b?g(b,a%b):Math.abs(a),pair=(n,d=1)=>[n,d],v=([n,d])=>n/d;
  const sign=n=>n<0?-1:n>0?1:0;
  function read(t){if(t.includes('/'))return t.split('/').map(Number);const c=t.replace(',','.'),d=10**(c.split('.')[1]||'').length;return [Math.round(Number(c)*d),d];}
  const reduced=r=>{const k=g(...r);return[r[0]/k,r[1]/k];};
  const fraction=r=>r[1]===1?String(r[0]):r.join('/');
  const sym=c=>c<0?'<':c>0?'>':'=';
  function register(key,ref,page,title,prompt,guide,rule,make){
    add(96,key,page,title,prompt,rule,'fraction',make);
    const l=lessons.get('96-'+key);Object.assign(l,{printedReference:ref,printedGuide:guide,printedPrompt:prompt});order.push(l.id);
  }
  function exampleData(caption,rows,questions,chart,m){return Object.assign(example(caption,['Данные','Значение'],rows,questions,chart),{m});}
  function cross(key,ref,page,orig,extra=''){
    const [a,b]=orig.map(read),l=a[0]*b[1],r=b[0]*a[1],relation=sym(sign(l-r));
    register(key,ref,page,'Сравнение '+orig.join(' и '),'Сравни '+orig.join(' и ')+'.',
      'При положительных знаменателях сравни '+a[0]+' · '+b[1]+' = '+l+' и '+b[0]+' · '+a[1]+' = '+r+'. Получается '+orig[0]+' '+relation+' '+orig[1]+'. '+extra,
      'Вычисли два перекрёстных произведения в одном порядке. Отрицательные числа сравнивай с их знаками.',s=>{
        const A=pair(a[0]+Math.sign(a[0]||1)*s,a[1]+(s%3)),B=pair(b[0]+Math.sign(b[0]||1)*(s%4),b[1]+s%2),x=A[0]*B[1],y=B[0]*A[1],c=sign(x-y);
        return exampleData('Две дроби и общая единица сравнения',[['Первая дробь',fraction(A)],['Вторая дробь',fraction(B)]],[
          q('Чему равно произведение числителя первой дроби на знаменатель второй?',x,'Перемножь '+A[0]+' и '+B[1]+'.',x+B[1],'В первом произведении нужен числитель первой дроби без изменения.'),
          q('Чему равно встречное произведение?',y,'Умножь числитель второй дроби на знаменатель первой.',y-A[1],'Возьми вторую диагональ, сохраняя знак её числителя.'),
          q('Сравни первую дробь со второй. Введи −1 для <, 0 для =, 1 для >.',c,'Сравни два найденных числителя общего знаменателя.',c===0?1:-c,'Проследи порядок: сначала первая дробь, затем вторая.')
        ],'fractions',{values:[A,B]});
      });
  }
  function benchmark(i,A,B,p){
    const a=read(A),b=read(B),t=read(p),ca=sign(v(a)-v(t)),cb=sign(v(b)-v(t));
    register('2'+String.fromCharCode(97+i),'Упражнение №2'+'абвг'[i],8,'Сравнение через '+p+' · '+A+' и '+B,'Сравни '+A+' и '+B+', вставив подходящее промежуточное число.',
      'Выбери '+p+'. Первая дробь '+sym(ca)+' '+p+', вторая '+sym(cb)+' '+p+'. Поэтому '+A+' '+sym(sign(v(a)-v(b)))+' '+B+'.',
      'Промежуточное число должно лежать между дробями. Половина и единица часто позволяют сравнить их устно.',s=>{
        const D=4*(s+2),anchor=t[0]*D/t[1],k=1+s%3,m=1+s%4,flip=s%3===0?-1:1;
        const aa=pair(anchor+ca*k*flip,D),bb=pair(anchor+cb*m*flip,D),sa=sign(v(aa)-v(t)),sb=sign(v(bb)-v(t));
        return exampleData('Сравни с отмеченным ориентиром',[['Первая дробь',fraction(aa)],['Вторая дробь',fraction(bb)],['Ориентир',p]],[
          q('Каков числитель ориентира со знаменателем '+D+'?',anchor,'Умножь '+p+' на '+D+'.',anchor+1,'Сохрани значение ориентира при переходе к общему знаменателю.'),
          q('Где первая дробь относительно ориентира? −1 ниже, 1 выше.',sa,'Сравни первый числитель с числителем ориентира.',-sa,'Первая дробь лежит по другую сторону отмеченного значения.'),
          q('Сравни первую со второй. −1 меньше, 1 больше.',sign(v(aa)-v(bb)),'У дробей противоположные стороны относительно ориентира.',sb,'На этом шаге сравнивай первую дробь со второй слева направо.')
        ],'fractions',{values:[aa,bb,t]});
      });
  }
  function rank(key,ref,page,items,descending=false){
    const original=items.map((t,i)=>({name:t,x:v(read(t)),i})).sort((a,b)=>(descending?-1:1)*(a.x-b.x));
    register(key,ref,page,'Порядок '+items.join(', '),'Упорядочь '+items.join(', ')+' по '+(descending?'убыванию':'возрастанию')+'.',
      'Сравни с одинаковой точностью, а при близких результатах проверь отношения перекрёстным умножением. Получится '+original.map(o=>o.name).join(descending?' > ':' < ')+'.',
      'Сравнивай сами дроби. Округление помогает только тогда, когда промежутки возможных значений не перекрываются.',s=>{
        const vals=items.map((t,i)=>{const z=read(t);return pair(z[0]+(i+1)*s,z[1]+(i%2));});
        // Preserve distinct positions for ranking through exact fractions with a common offset per index.
        const constants=[2,3,5,7],base=12*(s+3),values=vals.map((z,i)=>pair(Math.floor(v(z)*base)*16+constants[i],16*base));
        const sorted=values.map((z,i)=>[v(z),i+1]).sort((a,b)=>(descending?-1:1)*(a[0]-b[0]));
        return exampleData('Сравни пронумерованные дроби',values.map((z,i)=>['Дробь '+(i+1),fraction(z)]),[
          q('Какой номер окажется первым по '+(descending?'убыванию':'возрастанию')+'?',sorted[0][1],'Найди '+(descending?'наибольшее':'наименьшее')+' значение при общем знаменателе.',sorted.at(-1)[1],'Выбран противоположный конец упорядоченного ряда.'),
          q('Какой номер окажется вторым?',sorted[1][1],'Исключи выбранный крайний элемент и продолжай в том же направлении.',sorted[0][1],'Первое место уже занято другим элементом ряда.'),
          q('Какой номер окажется последним?',sorted.at(-1)[1],'Найди оставшееся крайнее значение.',sorted[0][1],'Это первый элемент, а нужно последнее место.')
        ],'fractions',{values});
      });
  }
  cross('intro','Вводный пример',5,['5/7','9/13']);
  cross('ex1','Пример 1',6,['11/26','17/32']);
  cross('ex2','Пример 2',6,['5/8','0,65'],'Также 5/8 = 0,625, что меньше 0,65.');
  rank('ex3','Пример 3',6,['7/12','8/15','0,54']);
  cross('self1','Вопрос 1',7,['11/25','19/45']);
  cross('self2','Вопрос 2',7,['0,35','3/20'],'3/20 = 0,15.');
  cross('self3a','Вопрос 3(1)',7,['8/35','11/49']);
  rank('self3b','Вопрос 3(2)',7,['7/15','20/43','0,466'],true);
  cross('self4a','Вопрос 4 · первая пара',7,['-3,3','0,3']);
  cross('self4b','Вопрос 4 · вторая пара',7,['-1/6','-1/7']);
  const block=(n,items)=>items.forEach((p,i)=>cross(n+String.fromCharCode(97+i),'Упражнение №'+n+'абвг'[i],n<=10?8:9,p));
  block(1,[['5/9','7/11'],['4/21','3/17'],['7/12','9/16'],['5/8','8/13']]);
  [['11/18','10/23','1/2'],['5/28','11/40','1/4'],['49/53','41/40','1'],['9/22','27/50','1/2']].forEach(([a,b,t],i)=>benchmark(i,a,b,t));
  cross('sample2','Образец к №2',8,['25/62','49/80'],'Через половину: 25/62 меньше 1/2, а 49/80 больше 1/2.');
  block(3,[['3/7','11/27'],['31/32','21/22'],['45/98','23/38'],['22/21','21/20']]);
  const tasks=[
    ['Длина шага','У Пети 17 шагов занимают 8 м, у Коли 20 шагов — 11 м. У кого шаг короче?','Сравни 8/17 с 11/20. Произведения 160 и 187 показывают, что шаг Пети короче.',false],
    ['Скорость принтеров','Первый принтер печатает 14 страниц за 3 минуты, второй — 24 за 5. Который быстрее?','Сравни 14/3 и 24/5 страниц в минуту. Первое перекрёстное произведение 70 меньше 72, поэтому быстрее второй принтер.',true]
  ];
  tasks.forEach(([title,prompt,guide,printer],i)=>register('4'+'ab'[i],'Упражнение №4'+'аб'[i],8,title,prompt,guide,'Сравнивай одинаковые единицы: длину одного шага или количество страниц за одну минуту.',s=>{
    const a=s+4,b=s+7,u=s+2,w=s+5,first=printer?pair(3*a+1,a):pair(a,2*a+u),second=printer?pair(3*b+2,b):pair(b,2*b+w),x=v(first),y=v(second),cmp=sign(x-y);
    return exampleData(title,[['Первая пара [итог, число единиц]',first.join(', ')],['Вторая пара',second.join(', ')]],[
      q('Какова величина за одну единицу у первого?',x,'Раздели первый итог на своё число единиц.',1/x,'Перепутаны размерность и обратная ей величина.'),
      q('Какова величина за одну единицу у второго?',y,'Выполни такое же деление для второй пары.',1/y,'Нужен итог на единицу времени или на один шаг.'),
      q('Как первая удельная величина сравнивается со второй? −1 меньше, 0 равна, 1 больше.',cmp,'Сопоставь результаты в одинаковых единицах.',cmp===0?1:-cmp,'Не меняй местами первую и вторую пару при сравнении.')
    ],'fractions',{values:[first,second]});
  }));
  window.DorofeevSchool={register,exampleData,q,read,v,rank,cross,block,order,reduced,g,fraction,sign};
  window.MathExamTopicEdition={trainerId:'dorofeev-algebra-7-9',storePrefix:'math:dorofeev-algebra-7-9:v1:',authors:'Дорофеев, Суворова, Бунимович и соавторы',grade:()=>'7 класс',unit:'Пункт',nextId:l=>order[order.indexOf(l.id)+1],source:(_,p)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000072.pdf#page='+(p+1)};
})();
