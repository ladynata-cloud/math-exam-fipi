(function(root){
 'use strict';
 const modulePath='../trainers/ege-baza/course/';
 const lesson=(id,title,goal,prerequisites=[],skill=null)=>({id,title,goal,prerequisites,status:skill?'prototype':'planned',skill,href:skill?modulePath+'#learn-'+skill:null});
 const modules=[
  {id:'m01',number:'01',title:'Числа, деньги и проценты',description:'От действий с дробями до покупки, в которой нужно всё учесть.',positions:[1,2,6,14,15],status:'prototype',lessons:[
   lesson('m01-decimal','Числа без путаницы','Связать дробь с десятичной записью и выполнить расчёт.',['p-fraction','p-decimal'],'decimal'),
   lesson('m01-division','Деление с запятой','Менять оба числа одинаково и проверять частное.',['m01-decimal'],'division'),
   lesson('m01-rounding','Количество и единицы','Понять, когда округлять вверх, а когда вниз.',['m01-division'],'rounding'),
   lesson('m01-percent','Часть и целое','Выбрать, что искать: часть, целое или процент.',['p-fraction','p-proportion'],'percent'),
   lesson('m01-change','Цена меняется','Вычислить новую цену и восстановить прежнюю.',['m01-percent'],'change'),
   lesson('m01-choice','Выбираем с расчётом','Сравнить полные расходы и объяснить выбор.',['m01-rounding','m01-change'],'choice')
  ]},
  {id:'m02',number:'02',title:'Данные, графики и логика',description:'Читать данные, оценивать случайность и делать обоснованные выводы.',positions:[3,5,7,8],status:'planned',lessons:[
   lesson('m02-data','Таблицы и диаграммы','Найти нужные данные, сравнить и посчитать.',['m01-decimal']),
   lesson('m02-probability','Вероятность','Перечислить исходы и найти долю подходящих.',['p-fraction']),
   lesson('m02-graphs','График рассказывает','Определить значения и описать изменения.',['p-signs','m02-data']),
   lesson('m02-logic','Что следует из условия','Проверить утверждение и найти контрпример.',[])
  ]},
  {id:'m03',number:'03',title:'Выражения и уравнения',description:'Перевести условие на язык формул и найти неизвестное.',positions:[4,16,17,18],status:'planned',lessons:[
   lesson('m03-formulas','Подстановка в формулу','Подставить величины в согласованных единицах.',['p-order','m01-rounding']),
   lesson('m03-powers','Степени и корни','Упростить выражение с учётом свойств и области определения.',['p-signs','p-order']),
   lesson('m03-expressions','Дробные выражения','Сократить, преобразовать и проверить допустимость.',['p-common','m03-powers']),
   lesson('m03-functions','Логарифмы и тригонометрия','Использовать определения и основные значения для вычисления.',['m03-powers']),
   lesson('m03-equations','Уравнения','Решить основные типы и проверить найденные корни.',['m03-expressions','m03-functions']),
   lesson('m03-numberline','Сравнение и неравенства','Сопоставить числа, интервалы и условия.',['p-signs','m03-equations'])
  ]},
  {id:'m04',number:'04',title:'Геометрия на плоскости',description:'Увидеть нужную фигуру, выбрать свойство и обосновать расчёт.',positions:[9,10,12],status:'planned',lessons:[
   lesson('m04-grid','Клетки и площадь','Считать площадь по клеткам и разбиению.',['m01-rounding']),
   lesson('m04-practical','План и реальные размеры','Перейти от рисунка к длине, площади и масштабу.',['p-proportion','m04-grid']),
   lesson('m04-triangle','Треугольники','Использовать углы, высоты, Пифагора и подобие.',['m03-powers']),
   lesson('m04-quadrilateral','Четырёхугольники','Различать свойства и вычислять площади.',['m04-triangle']),
   lesson('m04-circle','Окружность и круг','Работать с радиусом, углами, длиной и площадью.',['m04-triangle'])
  ]},
  {id:'m05',number:'05',title:'Геометрия в пространстве',description:'Представить тело и связать размеры с площадью и объёмом.',positions:[11,13],status:'planned',lessons:[
   lesson('m05-box','Куб и параллелепипед','Вычислить объём и площадь поверхности.',['m01-rounding','m04-quadrilateral']),
   lesson('m05-round','Цилиндр, конус и шар','Выбрать формулу и понять, какие размеры нужны.',['m04-circle','m03-formulas']),
   lesson('m05-pyramid','Призма и пирамида','Найти основание, высоту и объём.',['m04-triangle','m05-box']),
   lesson('m05-scale','Изменение размеров','Сравнить объёмы при масштабировании и разбиении.',['m05-pyramid','m05-round'])
  ]},
  {id:'m06',number:'06',title:'Задачи и рассуждения',description:'Составить схему, организовать перебор и проверить правдоподобность.',positions:[19,20,21],status:'planned',lessons:[
   lesson('m06-integers','Делимость и подбор','Использовать признаки делимости и ограничивать поиск.',['p-order']),
   lesson('m06-motion','Движение и работа','Составить таблицу величин и уравнение.',['m03-equations']),
   lesson('m06-mixtures','Доли и смеси','Выбрать постоянную величину и составить модель.',['m01-change','m03-equations']),
   lesson('m06-reasoning','Перебор и оценка','Найти решение и обосновать полноту рассуждения.',['m02-logic','m06-integers'])
  ]},
  {id:'m07',number:'07',title:'Экзаменационная практика',description:'Собрать навыки вместе, распределить время и разобрать ошибки.',positions:Array.from({length:21},(_,i)=>i+1),status:'planned',lessons:[
   lesson('m07-mixed','Смешанные задания','Самостоятельно выбрать способ решения.',['m02-logic','m03-equations','m04-circle','m05-scale','m06-reasoning']),
   lesson('m07-exam','Пробная работа','Пройти полный вариант и проверить запись ответов.',['m07-mixed']),
   lesson('m07-review','После пробника','Понять причины затруднений и проверить исправление.',['m07-exam'])
  ]}
 ];
 const resource=(id,title,description,path)=>({id,title,description,href:'../trainers/oge-basics/'+path});
 const prerequisites=[
  resource('p-signs','Отрицательные числа','Знак числа и положение на прямой.','negative-number-line.html'),
  resource('p-order','Порядок действий','Скобки и последовательность вычислений.','order-of-operations.html'),
  resource('p-fraction','Смысл дроби','Часть целого и деление.','fraction-meaning.html'),
  resource('p-common','Общий знаменатель','Сложение и вычитание обыкновенных дробей.','fraction-common-denominator.html'),
  resource('p-decimal','Десятичные дроби','Разряды, сложение и вычитание.','decimal-add-subtract.html'),
  resource('p-proportion','Пропорция','Связь величин и поиск неизвестного.','percentages/proportion.html')
 ];
 root.EgeBazaRegistry={version:1,modulePath,modules,prerequisites};
})(globalThis);
