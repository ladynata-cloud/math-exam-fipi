(function () {
  'use strict';
  const book = window.WorkshopCurriculum.books.find(entry => entry.id === 'source-50');
  // PDF pp. 286–288 carry the printed contents on pp. 285–287.
  const topics = [
    [1,5,'Функция. Область определения и область значений функции','Собери множества аргументов и значений по таблице и отдельным точкам.'],
    [1,14,'Свойства функций','Прочитай нули функции и её возрастание по ломаной.'],
    [2,22,'Квадратный трёхчлен и его корни','Вычисли корни, сопоставь их с графиком и проверь произведение.'],
    [2,27,'Разложение квадратного трёхчлена на множители','Восстанови линейные множители и проверь коэффициенты по таблице произведений.']
  ];
  book.totalPoints = 36;
  book.workshopRoute = '9';
  book.verifiedSource = book.source.source_url;
  book.sourceLabel = 'Открыть издание 2017 года';
  book.note = 'Выбери печатный пункт. В занятии можно изменить модель, разобрать пример и проверить себя на новых данных.';
  book.status = 'Самостоятельная практика по 4 из 36 пунктов';
  book.remaining = 'Остаются пункты 5–36, упражнения на повторение и задания повышенной трудности. Упражнения практикума составлены для MathExam.';
  book.mapping = topics.map(([paragraph,page,title,focus],index)=>{
    const section=index+1, path='/trainers/makarychev9-2017/index.html#lesson/50-'+section;
    const skill=['m9f-domain','m9f-read-graph','m9f-discriminant','m9f-grouping'][index];
    return {paragraph,section,page,title,skill,focus,coverage:'module',externalPath:path,boardPath:path};
  });
})();
