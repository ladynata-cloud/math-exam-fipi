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
      goal:'По началу и концу вектора находить его координаты, длину и результаты действий с векторами.',
      plan:['Прочитайте координаты или отметьте начало и конец вектора.','Выберите правило для нужного действия с векторами.','Выполните вычисление и проверьте знаки.'],
      prerequisites:['bridge-coordinates','bridge-signs','bridge-roots'],
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
      lessonIds:['applied-percent','applied-loan-linear','applied-loan-equal']}
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
  const api={exams,milestones,trigFoundations};
  root.ProfileCalmData=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
