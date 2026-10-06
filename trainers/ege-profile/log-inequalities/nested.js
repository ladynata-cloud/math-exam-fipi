/* A fixed worked example: two nested logarithms, six domain conditions.
 * The shared runtime stores only this lesson's work and mirrors its state. */
(function () {
'use strict';
const m = body => '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>'+body+'</mrow></math>';
const x='<mi>x</mi>', n=v=>'<mn>'+v+'</mn>', op=v=>'<mo>'+v+'</mo>';
const row=v=>'<mrow>'+v+'</mrow>', par=v=>row(op('(')+v+op(')'));
const frac=(a,b)=>'<mfrac>'+row(a)+row(b)+'</mfrac>';
const root=v=>'<msqrt>'+v+'</msqrt>', x2='<msup>'+x+n(2)+'</msup>';
const log=(b,a)=>'<msub><mi mathvariant="normal">log</mi>'+row(b)+'</msub>'+par(a);
const f=v=>'<div class="formula">'+m(v)+'</div>';
const sys=rows=>'<div class="formula system"><span class="system-brace" aria-hidden="true">{</span><div class="system-rows" aria-label="Система: все условия одновременно">'+rows.map(m).join('')+'</div></div>';
const outer=x2+op('−')+x, inner=x2+op('+')+x;
const innerLog=log(inner,x), original=log(outer,innerLog)+op('≥')+n(0);
const outerMinus=outer+op('−')+n(1), innerMinus=inner+op('−')+n(1);
const innerPositive=par(innerMinus)+par(x+op('−')+n(1))+op('>')+n(0);
const lower=frac(n(1)+op('−')+root(n(5)),n(2));
const upper=frac(n(1)+op('+')+root(n(5)),n(2));
const innerLower=frac(op('−')+n(1)+op('−')+root(n(5)),n(2));
const innerUpper=frac(op('−')+n(1)+op('+')+root(n(5)),n(2));
const domainRows=[outer+op('>')+n(0),outer+op('≠')+n(1),innerLog+op('>')+n(0),inner+op('>')+n(0),inner+op('≠')+n(1),x+op('>')+n(0)];
const solvedDomain=[x+op('>')+n(1),x+op('≠')+upper];
const workingDomain=[x+op('>')+n(1),outerMinus+op('≠')+n(0)];
const outerProduct=par(outerMinus)+par(innerLog+op('−')+n(1))+op('≥')+n(0);
const innerDifference=x+op('−')+par(inner);
const innerProduct=par(innerMinus)+par(innerDifference);
const fullProduct=par(outerMinus)+innerProduct+op('≥')+n(0);
const interval=(a,b,left='(',right=')')=>op(left)+a+op(';')+b+op(right);
const answer=x+op('∈')+interval(n(1),upper);
const option=(id,html)=>({id,html});
const choice=(id,label,options,correct)=>({id,label,kind:'choice',options,correct});
const number=(id,label,correct)=>({id,label,kind:'number',correct:String(correct)});
const checks=(id,label,options,correct)=>({id,label,kind:'checks',options,correct});
const axis=(id,label,points,correct,labels,refs=[])=>({id,label,kind:'axis',points,correct,labels,refs});
const lo=(1-Math.sqrt(5))/2, hi=(1+Math.sqrt(5))/2;
const ilo=(-1-Math.sqrt(5))/2, ihi=(-1+Math.sqrt(5))/2;
const points=[ilo,-1,lo,0,ihi,1,hi];
const labels=['(−1−√5)/2','−1','(1−√5)/2','0','(−1+√5)/2','1','(1+√5)/2'];
const domainRefs=[
 {label:'1. x² − x > 0',tokens:['s0','s1','s2','s3','s6','s7','p0','p1','p2','p6']},
 {label:'2. x² − x ≠ 1',tokens:['s0','s1','s2','s3','s4','s5','s6','s7','p0','p1','p3','p4','p5']},
 {label:'3. (x² + x − 1)(x − 1) > 0',tokens:['s1','s2','s3','s4','s6','s7','p1','p2','p3','p6']},
 {label:'4. x² + x > 0',tokens:['s0','s1','s4','s5','s6','s7','p0','p4','p5','p6']},
 {label:'5. x² + x ≠ 1',tokens:['s0','s1','s2','s3','s4','s5','s6','s7','p1','p2','p3','p5','p6']},
 {label:'6. x > 0',tokens:['s4','s5','s6','s7','p4','p5','p6']}
];
const steps=[
 {
  title:'Найдём внутренний логарифм',phase:'Разбираемся в записи',
  body:'<p>Внутренний логарифм вычисляется первым. Его значение становится аргументом внешнего логарифма.</p>'+f(log(outer,'<mstyle mathcolor="#a84b13">'+innerLog+'</mstyle>')+op('≥')+n(0)),
  fields:[choice('inner-log','Какой логарифм внутренний?',[
   option('inner',m(innerLog)),option('outer-base',m(outer)),option('whole',m(log(outer,innerLog)))],'inner')],
  hint:'Внутренний логарифм — log с основанием x² + x и аргументом x. Он целиком находится внутри скобок внешнего логарифма.',
  record:'<p>Внутренний логарифм:</p>'+f(innerLog)+'<p>Сначала вычисляется он, затем внешний логарифм берётся от полученного значения.</p>'
 },
 {
  title:'Разберём внутренний логарифм',phase:'Разбираемся в записи',body:f(innerLog)+'<p>Основание написано нижним индексом у знака log. Аргумент — выражение, от которого берётся логарифм.</p>',
  fields:[choice('inner-base','Его основание',[option('plus',m(inner)),option('minus',m(outer))],'plus'),choice('inner-argument','Его аргумент',[option('x',m(x)),option('expression',m(inner))],'x')],
  hint:'У внутреннего логарифма основание x² + x, аргумент x.',record:'<p>Внутренний: основание '+m(inner)+', аргумент '+m(x)+'.</p>'
 },
 {
  title:'Разберём внешний логарифм',phase:'Разбираемся в записи',body:f(original)+'<p>У внешнего логарифма свой знак log и своё основание. Его аргумент — <strong>весь внутренний логарифм</strong>.</p>',
  fields:[choice('outer-base','Основание внешнего логарифма',[option('minus',m(outer)),option('plus',m(inner))],'minus'),choice('outer-argument','Аргумент внешнего логарифма',[option('x',m(x)),option('inner',m(innerLog))],'inner')],
  hint:'Основание внешнего логарифма x² − x. Его аргумент — log с основанием x² + x от x, целиком.',record:'<p>Внешний: основание '+m(outer)+', аргумент '+m(innerLog)+'.</p>'
 },
 {
  title:'Запишем условия для внешнего логарифма',phase:'Собираем ОДЗ',
  body:'<p>Основание должно быть положительным и не равняться 1. Аргумент должен быть положительным. Отметьте три условия.</p>',
  fields:[checks('outer-rules','Три условия внешнего логарифма',[
   option('base-positive',m(domainRows[0])),option('base-nonunit',m(domainRows[1])),option('arg-positive',m(domainRows[2])),option('arg-nonunit',m(innerLog+op('≠')+n(1)))],['base-positive','base-nonunit','arg-positive'])],
  hint:'Условие «не равно 1» относится к основанию. Аргументу равняться 1 можно. Аргумент здесь — весь внутренний логарифм.',
  record:'<p>Внешний логарифм даёт первые три строки:</p>'+sys(domainRows.slice(0,3))
 },
 {
  title:'Добавим условия для внутреннего логарифма',phase:'Собираем ОДЗ',
  body:'<p>Теперь те же три правила применяем к внутреннему логарифму:</p>'+f(innerLog),
  fields:[checks('inner-rules','Три условия внутреннего логарифма',[
   option('base-positive',m(domainRows[3])),option('x-not-one',m(x+op('≠')+n(1))),option('base-nonunit',m(domainRows[4])),option('arg-positive',m(domainRows[5]))],['base-positive','base-nonunit','arg-positive'])],
  hint:'Основание x² + x должно быть положительным и не равняться 1. Аргумент x должен быть положительным. Условие x ≠ 1 из этих правил не следует.',
  record:'<p>Внутренний логарифм даёт ещё три строки:</p>'+sys(domainRows.slice(3))
 },
 {
  title:'Соберём все шесть условий в систему',phase:'Собираем ОДЗ',
  body:'<p>Первые три строки получены из внешнего логарифма, последние три — из внутреннего.</p>'+sys(domainRows)+'<p>Что означает фигурная скобка?</p>',
  fields:[choice('system-meaning','Как должны выполняться эти условия?',[option('all','Все шесть одновременно'),option('one','Достаточно любого одного')],'all')],
  hint:'Для существования исходного выражения должны подходить оба логарифма. Поэтому нужны все шесть условий — потом будем пересекать их решения.',
  record:'<p>Полная система ОДЗ:</p>'+sys(domainRows)+'<p>Решаем каждую строку, затем находим общую часть.</p>'
 },
 {
  title:'Решим x² − x > 0',phase:'Решаем строки ОДЗ',
  body:'<p>Выносим x за скобки:</p>'+f(outer+op('>')+n(0)+op('⇔')+x+par(x+op('−')+n(1))+op('>')+n(0))+'<p>Нули множителей — 0 и 1. Слева от 0 оба множителя отрицательны; правее 1 — положительны. Между 0 и 1 знаки разные.</p>',
  fields:[axis('outer-base-axis','Где произведение положительно?',[0,1],['s0','s2'])],
  hint:'Выберите два луча: левее 0 и правее 1. Точки 0 и 1 не включайте: там произведение равно нулю.',
  record:f(x+op('∈')+interval(op('−∞'),n(0))+op('∪')+interval(n(1),op('+∞')))
 },
 {
  title:'Решим x² + x > 0',phase:'Решаем строки ОДЗ',
  body:'<p>Это четвёртая строка системы. Выносим x за скобки:</p>'+f(inner+op('>')+n(0)+op('⇔')+x+par(x+op('+')+n(1))+op('>')+n(0))+'<p>Нули множителей — −1 и 0. Произведение положительно, когда знаки множителей одинаковы.</p>',
  fields:[axis('inner-base-axis','Отметьте положительные промежутки',[-1,0],['s0','s2'])],
  hint:'Берём левее −1 и правее 0. Между −1 и 0 произведение отрицательно. Оба граничных числа исключаем.',
  record:f(x+op('∈')+interval(op('−∞'),n('−1'))+op('∪')+interval(n(0),op('+∞')))
 },
 {
  title:'Отметим x > 0',phase:'Решаем строки ОДЗ',
  body:'<p>Это шестая строка: аргумент внутреннего логарифма положителен.</p>'+f(x+op('>')+n(0)),
  fields:[axis('x-axis','Какие числа больше нуля?',[0],['s1'])],
  hint:'Нажмите на луч справа от 0. Сам ноль не включается, потому что знак строгий.',record:f(x+op('>')+n(0))
 },
 {
  title:'Когда внешнее основание равно 1?',phase:'Решаем строки ОДЗ',
  body:'<p>Во второй строке нужно исключить значения, при которых основание равно 1. Для этого решим равенство:</p>'+f(outer+op('=')+n(1)+op('⇔')+outerMinus+op('=')+n(0))+'<p>Подставляем коэффициенты 1, −1, −1 в формулу корней:</p>'+f(x+op('=')+frac(op('−')+par(n('−1'))+op('±')+root('<msup>'+par(n('−1'))+n(2)+'</msup>'+op('−')+n(4)+op('·')+n(1)+op('·')+par(n('−1'))),n(2)+op('·')+n(1))),
  fields:[number('outer-discriminant','(−1)² − 4 · 1 · (−1) =',5),choice('outer-roots','Какие два значения исключаем?',[option('outer',m(lower+op(';')+upper)),option('inner',m(innerLower+op(';')+innerUpper))],'outer')],
  hint:'Под корнем: 1 + 4 = 5. Перед знаком ± стоит −(−1) = 1, в знаменателе 2. Исключаем (1 − √5)/2 и (1 + √5)/2.',
  record:f(x+op('≠')+lower+op(',')+x+op('≠')+upper)
 },
 {
  title:'Когда внутреннее основание равно 1?',phase:'Решаем строки ОДЗ',
  body:'<p>Пятая строка исключает значения из равенства:</p>'+f(inner+op('=')+n(1)+op('⇔')+innerMinus+op('=')+n(0))+'<p>Теперь коэффициенты 1, 1, −1. Число под корнем опять 5, но перед знаком ± стоит −1.</p>'+f(x+op('=')+frac(n('−1')+op('±')+root(n(5)),n(2))),
  fields:[choice('inner-roots','Какие значения запрещены пятой строкой?',[option('outer',m(lower+op(';')+upper)),option('inner',m(innerLower+op(';')+innerUpper))],'inner')],
  hint:'Выберите пару с −1 в числителе: (−1 − √5)/2 и (−1 + √5)/2.',record:f(x+op('≠')+innerLower+op(',')+x+op('≠')+innerUpper)
 },
 {
  title:'Осталось условие с внутренним логарифмом',phase:'Решаем строки ОДЗ',
  body:f(innerLog+op('>')+n(0))+'<p>Сохраняем остальные пять условий. При допустимых основании и аргументе знак логарифма совпадает со знаком произведения:</p><p><strong>«Основание минус 1» × «аргумент минус 1».</strong></p><p>Если основание больше 1, знак сохраняется. Если оно между 0 и 1, знак меняется; это и учитывает первый множитель.</p>',
  fields:[choice('inner-positive-product','Какое неравенство получим?',[option('correct',m(innerPositive)),option('wrong-base',m(par(outerMinus)+par(x+op('−')+n(1))+op('>')+n(0))),option('no-minus',m(par(innerMinus)+x+op('>')+n(0)))],'correct')],
  hint:'Внутреннее основание — x² + x, аргумент — x. Вычитаем 1 из каждого и перемножаем. Знак > сохраняем.',
  record:f(innerPositive)+'<p>Это равносильная замена третьей строки при сохранении остальных условий ОДЗ. Значения выражений не обязаны совпадать.</p>'
 },
 {
  title:'Расставим знаки произведения',phase:'Решаем строки ОДЗ',
  body:f(innerPositive)+'<p>Корни первого множителя уже найдены. Второй множитель равен нулю при x = 1. Порядок точек:</p>'+f(innerLower+op('<')+innerUpper+op('<')+n(1))+'<p>Правее 1 все множители после разложения на линейные положительны. При переходе через каждый из трёх разных корней знак меняется.</p>',
  fields:[['left','Левее (−1−√5)/2','minus'],['middle-left','Между двумя корнями с √5','plus'],['middle-right','Между (−1+√5)/2 и 1','minus'],['right','Правее 1','plus']].map(([id,label,correct])=>choice(id,label,[option('plus','+'),option('minus','−')],correct)),
  hint:'Справа плюс. Двигаясь влево, меняйте знак после каждой точки. Слева направо получится: −, +, −, +.',record:'<p>Знаки произведения слева направо: <strong>− &nbsp; + &nbsp; − &nbsp; +</strong>.</p>'
 },
 {
  title:'Выберем положительные промежутки',phase:'Решаем строки ОДЗ',
  body:f(innerPositive)+'<p>Сейчас решаем только полученное произведение. Остальные условия учтём на следующем шаге.</p>',
  fields:[axis('positive-inner-axis','Берём участки со знаком плюс',[ilo,ihi,1],['s1','s3'],['(−1−√5)/2','(−1+√5)/2','1'])],
  hint:'Выберите участок между двумя корнями с √5 и луч правее 1. Все три точки оставьте пустыми: нужен строгий знак >.',
  record:f(x+op('∈')+interval(innerLower,innerUpper)+op('∪')+interval(n(1),op('+∞')))
 },
 {
  title:'Пересечём все шесть решений',phase:'Пересечение условий ОДЗ',
  body:'<p>Третью строку заменили произведением. Все остальные строки сохранены:</p>'+sys([domainRows[0],domainRows[1],innerPositive,domainRows[3],domainRows[4],domainRows[5]])+'<p>На шести верхних осях уже отмечены решения. На нижней оси выберите <strong>общую часть всех шести</strong>. Числа на всех осях расположены одинаково.</p>',
  fields:[axis('domain-axis','Общая часть — ОДЗ',points,['s6','s7'],labels,domainRefs)],
  hint:'Общая часть находится правее 1. Точка (1 + √5)/2 исключена второй строкой, но правее неё ОДЗ продолжается. Нужны два участка справа от 1, без самой точки (1 + √5)/2.',
  record:sys(solvedDomain)+'<p>Это только ОДЗ. Само исходное неравенство ещё не решено.</p>'
 },
 {
  title:'Вернёмся к исходному неравенству',phase:'Решаем само неравенство',
  body:sys(solvedDomain.concat([original]))+'<p>Справа от внешнего логарифма стоит 0. Логарифм от единицы равен нулю. Какой аргумент нужен справа?</p>'+f(n(0)+op('=')+log(outer,'<mtext>?</mtext>')),
  fields:[choice('zero-argument','Аргумент логарифма, равного нулю',[option('one',m(n(1))),option('zero',m(n(0))),option('base',m(outer))],'one')],
  hint:'Логарифм от 1 равен 0 при любом допустимом основании. Логарифм от 0 не определён.',record:f(log(outer,innerLog)+op('≥')+log(outer,n(1)))
 },
 {
  title:'Уберём внешний логарифм',phase:'Решаем само неравенство',
  body:'<p>Как при нахождении ОДЗ, используем произведение «основание минус 1» на «аргумент минус 1».</p><p>Теперь основание — '+m(outer)+', аргумент — '+m(innerLog)+'. Знак исходного неравенства — ≥.</p><p>Запрет из ОДЗ сохраним в исходном виде: основание не равно 1. Переносим 1 влево:</p>'+f(outer+op('≠')+n(1)+op('⇔')+outerMinus+op('≠')+n(0)),
  fields:[choice('outer-product','Какое произведение нужно?',[option('correct',m(outerProduct)),option('wrong-base',m(par(innerMinus)+par(innerLog+op('−')+n(1))+op('≥')+n(0))),option('wrong-sign',m(par(outerMinus)+par(innerLog+op('−')+n(1))+op('≤')+n(0)))],'correct')],
  hint:'Первая скобка x² − x − 1. Вторая — внутренний логарифм минус 1. Сохраняем ≥ 0 и обе строки ОДЗ.',record:sys(workingDomain.concat([outerProduct]))
 },
 {
  title:'Заменим единицу внутренним логарифмом',phase:'Убираем внутренний логарифм',
  body:'<p>Работаем только со второй скобкой:</p>'+f(innerLog+op('−')+n(1))+'<p>Логарифм от своего основания равен 1. Выберите аргумент в записи:</p>'+f(n(1)+op('=')+log(inner,'<mtext>?</mtext>')),
  fields:[choice('one-argument','Какое выражение поставим вместо вопроса?',[option('base',m(inner)),option('x',m(x)),option('one',m(n(1)))],'base')],
  hint:'Основание и аргумент должны совпадать: x² + x. Тогда логарифм равен 1.',record:f(innerLog+op('−')+n(1)+op('=')+innerLog+op('−')+log(inner,inner))
 },
 {
  title:'Вычтем второй аргумент из первого',phase:'Убираем внутренний логарифм',
  body:'<p>У этих двух логарифмов одинаковое основание:</p>'+f(innerLog+op('−')+log(inner,inner))+'<p>Первый аргумент — x. Второй — x² + x. Вычитаем <strong>весь</strong> второй аргумент:</p>'+f(innerDifference+op('=')+x+op('−')+x2+op('−')+x)+'<p>Слагаемые x и −x сокращаются.</p>',
  fields:[number('square-coefficient','Какой коэффициент остаётся при x²?',-1)],
  hint:'Перед скобками минус, поэтому оба знака меняются. Остаётся −x²; его коэффициент −1.',record:f(innerDifference+op('=')+op('−')+x2)
 },
 {
  title:'Учтём основание внутреннего логарифма',phase:'Убираем внутренний логарифм',
  body:'<p>Для разности логарифмов с одним основанием берём:</p><p><strong>«Основание минус 1» × «первый аргумент минус второй».</strong></p><p>Основание здесь x² + x. Разность аргументов мы только что нашли.</p>',
  fields:[choice('inner-difference-product','Выберите выражение того же знака',[option('correct',m(innerProduct)),option('wrong-base',m(par(outerMinus)+par(innerDifference))),option('reversed',m(par(innerMinus)+par(inner+op('−')+x)))],'correct')],
  hint:'Нужны (x² + x − 1) и x − (x² + x). Порядок вычитания аргументов менять нельзя.',
  record:f(innerProduct)+'<p>На ОДЗ оно имеет тот же знак, что разность внутреннего логарифма и единицы. Это замена по знаку, а не равенство значений.</p>'
 },
 {
  title:'Соберём систему без логарифмов',phase:'Упрощаем систему',
  body:'<p>В первой скобке ничего не меняем. Вместо второй подставляем найденное произведение:</p>'+sys(workingDomain.concat([fullProduct]))+'<p>Последняя скобка равна −x². Как теперь записать третью строку?</p>',
  fields:[choice('full-product','Третья строка системы',[option('correct',m(op('−')+x2+par(outerMinus)+par(innerMinus)+op('≥')+n(0))),option('positive-square',m(x2+par(outerMinus)+par(innerMinus)+op('≥')+n(0)))],'correct')],
  hint:'x − (x² + x) = −x². Минус перед x² обязательно остаётся.',record:sys(workingDomain.concat([op('−')+x2+par(outerMinus)+par(innerMinus)+op('≥')+n(0)]))
 },
 {
  title:'Разделим на положительный множитель',phase:'Упрощаем систему',
  body:'<p>Из ОДЗ знаем x > 1. Тогда x² > 1 и x > 1, поэтому</p>'+f(innerMinus+op('>')+n(1)+op('+')+n(1)+op('−')+n(1)+op('=')+n(1))+'<p>Множитель x² + x − 1 положителен. Делим на него третью строку.</p>',
  fields:[choice('positive-division','Какой знак останется?',[option('ge',m(op('−')+x2+par(outerMinus)+op('≥')+n(0))),option('le',m(op('−')+x2+par(outerMinus)+op('≤')+n(0)))],'ge')],
  hint:'При делении на положительное число знак не меняется. Остаётся ≥ 0.',record:sys(workingDomain.concat([op('−')+x2+par(outerMinus)+op('≥')+n(0)]))
 },
 {
  title:'Разделим на отрицательный множитель',phase:'Упрощаем систему',
  body:'<p>При x > 1 квадрат x² положителен, поэтому −x² отрицателен. На него можно делить: нулю он не равен.</p>'+f(op('−')+x2+par(outerMinus)+op('≥')+n(0))+'<p>При делении на отрицательное число знак меняется на противоположный.</p>',
  fields:[choice('negative-division','Что получим после деления?',[option('le',m(outerMinus+op('≤')+n(0))),option('ge',m(outerMinus+op('≥')+n(0)))],'le')],
  hint:'Знак ≥ меняется на ≤. Остальные ограничения системы продолжают действовать.',record:sys(workingDomain.concat([outerMinus+op('≤')+n(0)]))
 },
 {
  title:'Решим квадратное неравенство',phase:'Пересечение и ответ',
  body:f(outerMinus+op('≤')+n(0))+'<p>Корни уже находили, когда исключали внешнее основание, равное 1:</p>'+f(lower+op(';')+upper)+'<p>Коэффициент при x² положителен. Трёхчлен отрицателен между корнями, а в корнях равен нулю. Сейчас решаем только неравенство со знаком ≤.</p>',
  fields:[axis('quadratic-axis','Отметьте промежуток и включите оба корня',[lo,hi],['s1','p0','p1'],['(1−√5)/2','(1+√5)/2'])],
  hint:'Нажмите на участок между корнями, затем на каждое из двух чисел под осью. Для этого отдельного неравенства обе точки закрашены. ОДЗ учтём следующим шагом.',
  record:f(x+op('∈')+interval(lower,upper,'[',']'))+'<p>Это решение третьей строки, пока без пересечения с ОДЗ.</p>'
 },
 {
  title:'Пересечём решение с ОДЗ',phase:'Пересечение и ответ',
  body:'<p>Все три условия должны выполняться одновременно:</p>'+sys([x+op('>')+n(1),x+op('≠')+upper,lower+op('≤')+x+op('≤')+upper])+'<p>На нижней оси оставьте общую часть. Число 1 не подходит первой строке, правый корень — второй.</p>',
  fields:[axis('final-axis','Окончательный ответ',[lo,1,hi],['s2'],['(1−√5)/2','1','(1+√5)/2'],[
   {label:'ОДЗ: x > 1',tokens:['s2','s3','p2']},
   {label:'ОДЗ: x ≠ (1+√5)/2',tokens:['s0','s1','s2','s3','p0','p1']},
   {label:'Решение квадратного неравенства: оба корня включены',tokens:['s1','s2','p0','p1','p2']}
  ])],
  hint:'Берём только промежуток от 1 до (1 + √5)/2. Обе точки пустые: ограничения ОДЗ запрещают их, даже если отдельное квадратное неравенство допускает равенство.',
  record:f(answer)+'<p>Точки 1 и (1 + √5)/2 исключены условиями существования исходного выражения.</p>'
 },
 {
  title:'Проверим, почему концы не включены',phase:'Пересечение и ответ',
  body:f(answer)+'<p>Посмотрим на внешнее основание x² − x в каждой граничной точке. Основание логарифма должно быть положительным и не равняться 1.</p>',
  fields:[number('base-at-one','При x = 1 основание 1² − 1 равно',0),choice('base-at-root','При x = (1+√5)/2 внешнее основание равно',[option('one','1'),option('zero','0'),option('minus-one','−1')],'one')],
  hint:'При x = 1 основание равно 0. Правый корень мы получили из уравнения x² − x = 1, поэтому там основание равно 1. В обоих случаях логарифм не определён.',
  record:'<p>При x = 1 внешнее основание равно 0. При x = (1 + √5)/2 — равно 1. Оба значения запрещены ОДЗ, поэтому концы ответа не включаются.</p>'+f(answer)
 }
];
window.MathExamGuidedLesson={
 steps,
 problemHtml:m(log('<mstyle mathcolor="#2455ba">'+outer+'</mstyle>','<mstyle mathcolor="#a84b13">'+innerLog+'</mstyle>')+op('≥')+n(0)),
 answerHtml:m(answer), solvedDomainHtml:sys(solvedDomain), domainStepIndex:14,
 initialDomainHtml:sys(domainRows),initialDomainStepIndex:5,
 storageKey:'mathExam.logNestedExample.v1',trainerId:'profile-log-nested-example',apiName:'__nestedLogExample',
 title:'Два логарифма · пошаговый разбор',reportName:'nested-logarithm-result.txt',
 reportProblem:'log_(x²−x)(log_(x²+x)x) ≥ 0',reportAnswer:'(1; (1+√5)/2)'
};
})();
