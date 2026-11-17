(function(root){
  'use strict';
  // A presentation map only: no answer keys, altered task banks or relaxed gates.
  const milestones=[
    {id:'supported',title:'С помощью',description:'Откройте короткую подсказку. Выполните одно действие и сохраните найденное на экране.'},
    {id:'guided',title:'Обычные шаги',description:'Пройдите задачу по обычным вопросам. Перед следующим действием проверьте уже найденное.'},
    {id:'independent',title:'Самостоятельно',description:'Решите два разных новых условия с первой попытки без подсказок. Исправленная задача остаётся полезной тренировкой.'},
    {id:'mixed',title:'Смешанная практика',description:'Решайте новые условия разных типов без подсказки названия темы. Сами выбирайте нужный способ решения.'}
  ];
  const specs=[
    {number:1,title:'Планиметрия',entry:'geo-right',
      goal:'Находить нужную длину, угол или площадь по условию и свойствам плоской фигуры.',
      plan:['Отметьте на рисунке данное и искомое.','Выберите свойство, которое их связывает.','Вычислите искомое и проверьте, что ответ относится к нужной величине.'],
      prerequisites:['bridge-roots','bridge-triangle'],
      lessonIds:['geo-angles','geo-right','geo-similarity','geo-area','geo-quadrilaterals','geo-circle']},
    {number:2,title:'Векторы',entry:'vec-coordinates',
      goal:'Прочитай стрелку, выполни действия по чертежу и перейди к координатам, длине и скалярному произведению.',
      plan:['Прочитайте координаты или отметьте начало и конец вектора.','Выберите правило для нужного действия с векторами.','Выполните вычисление и проверьте знаки.'],
      prerequisites:['bridge-coordinates','bridge-signs','bridge-roots'],
      starterIds:['vec-basics-reading','vec-basics-equality','vec-basics-triangle','vec-basics-parallelogram','vec-basics-difference','vec-basics-scale','vec-basics-coordinates','vec-basics-length','vec-basics-dot'],
      lessonIds:['vec-coordinates','vec-length','vec-operations','vec-dot']},
    {number:3,title:'Стереометрия',entry:'stereo-box',
      goal:'Выбирать нужные размеры объёмной фигуры и находить её объём, площадь поверхности или длину.',
      plan:['Назовите тело и найдите на рисунке нужные размеры.','Выберите формулу для величины из вопроса.','Подставьте данные и проверьте единицы ответа.'],
      prerequisites:['geo-right','geo-area','bridge-roots'],
      lessonIds:['stereo-box','stereo-cube','stereo-prism','stereo-pyramid','stereo-cylinder','stereo-cone','stereo-sphere','stereo-compound']},
    {number:4,title:'Простая вероятность',entry:'prob-count',
      goal:'Отличать все возможные исходы от подходящих и находить вероятность нужного события.',
      plan:['Уточните, какие исходы возможны и равновозможны ли они.','Отметьте подходящие исходы или противоположное событие.','Найдите вероятность и проверьте её допустимость.'],
      prerequisites:['bridge-fractions'],
      lessonIds:['prob-count','prob-complement','prob-range']},
    {number:5,title:'Несколько событий',entry:'prob-independent',
      goal:'Разбирать сочетания событий: оба, хотя бы одно, ровно нужное число и событие при новом условии.',
      plan:['Запишите словами, какое сочетание событий требуется.','Проверьте независимость и учтите дополнительное условие.','Сложите вероятности несовместимых путей или перемножьте нужные вероятности.'],
      prerequisites:['prob-count','prob-complement','bridge-fractions'],
      lessonIds:['prob-independent','prob-conditional','prob-exact']},
    {number:6,title:'Случайные величины',entry:'prob-distribution',
      goal:'Читать распределение и находить требуемую вероятность, среднее или меру разброса.',
      plan:['Выпишите значения с вероятностями или границы нужного интервала.','Выберите характеристику, названную в вопросе.','Вычислите её и проверьте смысл результата.'],
      prerequisites:['prob-count','bridge-fractions','bridge-roots'],
      lessonIds:['prob-distribution','prob-variance','prob-continuous']},
    {number:7,title:'Уравнения',entry:'eq-linear',
      goal:'Приводить уравнение к знакомому виду и выбирать ответ с учётом исходных ограничений.',
      plan:['Определите вид уравнения и запишите ограничения.','Выполните преобразование и найдите возможные корни.','Подставьте результат в исходное уравнение и ответьте на вопрос.'],
      prerequisites:['bridge-equations','bridge-fractions','bridge-roots','expr-powers'],
      lessonIds:['algebra-exponential','algebra-logarithmic','eq-linear','eq-rational','eq-quadratic','eq-root']},
    {number:8,title:'Вычисления и выражения',entry:'expr-powers',
      goal:'Выбирать подходящее правило для степеней, корней, дробей, логарифмов и тригонометрических выражений.',
      plan:['Выберите правило для первого преобразования.','Запишите одно преобразование, сохранив знаки и ограничения.','Вычислите итог и проверьте его по исходному выражению.'],
      prerequisites:['bridge-signs','bridge-fractions','bridge-roots','bridge-triangle'],
      lessonIds:['algebra-cosine','algebra-double-angle','expr-powers','expr-roots','expr-fractions','expr-logarithms']},
    {number:9,title:'Производная и первообразная',entry:'calc-tangent',
      goal:'Различать функцию и её производную, читать изменение по графику и находить нужную величину.',
      plan:['Уточните, что дано: функция, производная, касательная или первообразная.','Выберите связь с величиной из вопроса.','Вычислите значение или выберите точку, проверив границы и знаки.'],
      prerequisites:['bridge-coordinates','fn-line','expr-powers'],
      lessonIds:['calc-tangent','calc-sign','calc-graph','calc-value','calc-special','calc-extreme','calc-integral']},
    {number:10,title:'Задачи с формулами',entry:'applied-formula',
      goal:'Подставлять данные в готовую формулу и находить искомую величину с учётом условий.',
      plan:['Сопоставьте данные с буквами формулы и единицами.','Выразите искомую величину или подставьте известные данные.','Вычислите ответ и проверьте ограничение из условия.'],
      prerequisites:['bridge-equations','bridge-fractions'],
      lessonIds:['applied-formula','applied-formula-limit']},
    {number:11,title:'Текстовые задачи',entry:'applied-work',
      goal:'Переводить движение, работу и смеси в понятную запись и проверять ответ по смыслу задачи.',
      plan:['Назовите неизвестное и выпишите связанные величины.','Запишите связь для каждого участника или части смеси.','Решите полученное уравнение и проверьте ответ по условию.'],
      prerequisites:['bridge-fractions','eq-linear','eq-rational'],
      lessonIds:['applied-motion','applied-work','applied-mixture']},
    {number:12,title:'Функции и графики',entry:'fn-line',
      goal:'Связывать график с формулой и восстанавливать неизвестные параметры по отмеченным точкам.',
      plan:['Определите вид графика и прочитайте координаты отмеченной точки.','Подставьте координаты в формулу и найдите параметр.','Используйте найденную формулу и проверьте её по графику.'],
      prerequisites:['bridge-coordinates','bridge-equations','expr-powers'],
      lessonIds:['fn-line','fn-parabola','fn-hyperbola','fn-explog']},
    {number:13,title:'Проценты и финансовые расчёты',entry:'applied-percent',
      goal:'Различать долг, проценты и платёж и составлять расчёт в порядке событий из условия.',
      plan:['Запишите, к какой сумме относятся проценты.','Отметьте порядок изменения суммы или расчёта платежей.','Вычислите искомую сумму и сверьте её с условием.'],
      prerequisites:['bridge-fractions','bridge-equations','applied-formula'],
      lessonIds:['applied-percent','applied-loan-linear','applied-loan-equal',
        'finance-lesson-01-ledger',
        'finance-lesson-02-deposits',
        'finance-lesson-03-interest-progression',
        'finance-lesson-04-first-last-payment',
        'finance-lesson-05-balance-tables',
        'finance-lesson-06-payment-bounds',
        'finance-lesson-07-equal-payments',
        'finance-lesson-08-unknown-in-ledger',
        'finance-lesson-09-rates',
        'finance-lesson-10-inverse-equal-payments',
        'finance-lesson-11-changing-conditions',
        'finance-lesson-12-calendar',
        'finance-lesson-13-two-stages']}
  ];
  const exams=specs.map(exam=>({...exam,milestones:milestones.map(stage=>({...stage}))}));
  const trigFoundations={
    exam:8,
    goal:'Перед преобразованиями понять угол, координаты синуса и косинуса, точные значения и тангенс.',
    entry:'bridge-triangle',
    lessonIds:['trig-angle','trig-coordinates','trig-special','trig-tangent'],
    prerequisites:['bridge-triangle','bridge-fractions','bridge-coordinates','bridge-signs','bridge-roots'],
    nextLessonIds:['algebra-cosine','algebra-double-angle']
  };
  // Legacy numeric groups are stable learning/storage identities. The public
  // exam view is projected through the shared FIPI map; it never renumbers data.
  const examMap=root.ProfileExamMap||(typeof module!=='undefined'&&module.exports?require('../exam-map.js'):null);
  function project(entry){
    if(!entry||entry.source!=='start')return null;
    const legacy=exams.find(exam=>entry.legacyStart!==null?exam.number===entry.legacyStart:entry.lessonIds.some(id=>exam.lessonIds.includes(id)));
    if(!legacy)return null;
    const lessonIds=entry.lessonIds.filter(id=>legacy.lessonIds.includes(id));
    const value={...legacy,...entry,legacyNumber:legacy.number,lessonIds,
      entry:lessonIds.includes(legacy.entry)?legacy.entry:lessonIds[0]};
    if(entry.number===8){
      value.prerequisites=[...new Set([...legacy.prerequisites,...(entry.preparationIds||[])])];
      value.goal='Читать графики функции и производной, находить наклон касательной и связывать первообразную с площадью.';
      value.plan=['Уточните, что дано: функция, производная, касательная или первообразная.','Выберите связь с величиной из вопроса.','Вычислите или прочитайте значение и проверьте его по условию.'];
    }
    if(entry.number===12){
      value.goal='Находить наибольшее и наименьшее значение функции, проверяя критические точки и границы промежутка.';
      value.plan=['Определите область поиска и найдите производную.','Найдите критические точки, которые принадлежат промежутку.','Сравните значения функции в этих точках и на границах.'];
      value.prerequisites=['calc-value','calc-special','calc-sign'];
    }
    if(entry.id==='calculus-legacy')value.aggregate=true;
    if(entry.id==='integral')value.goal='Связывать первообразную, интеграл и площадь под графиком.';
    if(entry.number===16)value.coverage='16 тем · 96 задач на проценты, долг и платежи. Это подготовительные числовые упражнения: полное письменное решение и экзаменационные баллы здесь не проверяются.';
    return value;
  }
  const official=examMap?examMap.entries.filter(entry=>entry.source==='start').map(project):[];
  const extras=examMap?examMap.extras.filter(entry=>entry.source==='start').map(project):[];
  function fromLegacy(number){
    const legacy=exams.find(exam=>exam.number===Number(number));
    if(!legacy)return null;
    // The old calculus bookmark includes derivatives, extrema and integration.
    // Keeping the whole group is necessary even though two official lines now
    // have separate entry points.
    if(legacy.number===9)return {...project(examMap?.fromLegacyStart(9)),aggregate:true};
    return project(examMap?.fromLegacyStart(legacy.number))||legacy;
  }
  function label(entry){return entry?.number?'№'+entry.number:entry?.aggregate?'Общая подготовка к №8 и №12':'Дополнительная тема';}
  function hash(entry){return entry?.aggregate?'#calm/9':examMap?examMap.hash(entry):'#calm/'+entry.number;}
  const api={exams,milestones,trigFoundations,official,extras,project,fromLegacy,label,hash};
  root.ProfileCalmData=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
