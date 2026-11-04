/* Trusted source adapter; task content and diagrams come from the reviewed bundle. */
(function (root) {
  'use strict';
  const COURSE = 'ichenskaya-grade7-works', BOOK = 'ichenskaya-2018-geometry-7';
  const requireValue = value => { if (!value) throw Error('INVALID_ICHENSKAYA_COURSE'); };
  const withinPrimary = lesson => Number(lesson.source.work) <= (lesson.source.collection === 'sr' ? 10 : 2);
  const workName = source => (source.collection === 'sr' ? 'С-' : 'К-') + Number(source.work);
  const shortName = lesson => workName(lesson.source) + ' · вариант ' + Number(lesson.source.variant) + ' · №' + Number(lesson.source.exercise);
  const pages = value => Array.isArray(value) && value.length > 0 && value.every(page => Number.isSafeInteger(page) && page > 0);
  function validateBundle(bundle) {
    requireValue(bundle?.schemaVersion === 1 && bundle.id === COURSE && bundle.lessons?.length === 110
      && bundle.sections?.length === 23 && bundle.book?.id === BOOK && bundle.catalog?.book?.id === BOOK
      && /^[a-f0-9]{64}$/.test(bundle.source?.sha256) && /^[a-f0-9]{64}$/.test(bundle.source?.bookSha256));
    const lessons = new Map();
    for (const lesson of bundle.lessons) {
      const source = lesson.source;
      const match = /^ichenskaya-7-(sr|kr)-(\d{2})-v([12])-task-(\d{2})$/.exec(lesson.id);
      requireValue(match && !lessons.has(lesson.id) && lesson.kind === 'exercise' && lesson.status === 'reviewed'
        && Number.isSafeInteger(lesson.revision) && lesson.revision > 0 && source?.bookId === BOOK
        && source.collection === match[1] && Number.isSafeInteger(source.work) && Number.isSafeInteger(source.variant)
        && typeof source.exercise === 'string' && /^[1-9]\d?$/.test(source.exercise)
        && Number(source.work) === Number(match[2]) && Number(source.variant) === Number(match[3]) && Number(source.exercise) === Number(match[4])
        && Number(match[2]) >= 1 && Number(match[2]) <= (match[1] === 'sr' ? 17 : 6) && Number(match[4]) >= 1
        && pages(source.printedPages) && pages(source.pdfPages) && source.pdfPages.every(page => page <= 28)
        && lesson.steps?.length > 0 && lesson.visualization?.model?.views?.neutral);
      lessons.set(lesson.id, lesson);
    }
    const seen = new Set(), works = new Set();
    for (const section of bundle.sections) {
      requireValue(Array.isArray(section.lessonIds) && section.lessonIds.length > 0 && pages(section.printedPages)
        && typeof section.withinPrimaryScope === 'boolean');
      const work = new Set(), variants = new Set();
      for (const id of section.lessonIds) {
        const lesson = lessons.get(id);
        requireValue(lesson && !seen.has(id) && section.withinPrimaryScope === withinPrimary(lesson));
        seen.add(id); work.add(lesson.source.collection + ':' + Number(lesson.source.work)); variants.add(Number(lesson.source.variant));
      }
      const key = [...work][0];
      requireValue(work.size === 1 && !works.has(key) && variants.size === 2); works.add(key);
    }
    requireValue(seen.size === 110 && works.size === 23 && bundle.lessons.filter(withinPrimary).length === 54);
    return bundle;
  }
  const definition = Object.freeze({
    id: COURSE, namespace: 'mathExamIchenskayaGrade7Works.v1', legacy: false,
    bundleUrl: '/learning/ichenskaya-grade7-works/course.json', validateBundle, shortName,
    sourceText: (lesson, bundle) => bundle.book.edition + ' · ' + shortName(lesson) + ' · печатная стр. '
      + lesson.source.printedPages.join(', ') + ' · страница PDF ' + lesson.source.pdfPages.join(', '),
    filters: [['all', 'Все работы'], ['sr', 'Самостоятельные'], ['kr', 'Контрольные'],
      ['primary', 'До элементарных построений'], ['later', 'Следующие темы 7 класса'], ['work', 'Мои записи']],
    matchesFilter: (lesson, filter) => filter === 'primary' ? withinPrimary(lesson) : filter === 'later' ? !withinPrimary(lesson)
      : filter === 'sr' || filter === 'kr' ? lesson.source.collection === filter : true,
    matchesSearch(lesson, query, section, statement) {
      const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[–—]/g, '-').replace(/№/g, '');
      const text = normalize(section.title + ' ' + shortName(lesson) + ' ' + lesson.title + ' ' + statement);
      return normalize(query).trim().split(/\s+/).every(word => text.includes(word));
    },
    sectionNote: section => section.withinPrimaryScope ? 'Подходит к основному курсу: от начала до элементарных построений.'
      : 'Следующие темы 7 класса: за пределами основного курса до построений.',
    lessonNote: lesson => withinPrimary(lesson) ? 'Эта работа подходит к основному курсу до элементарных построений.'
      : 'Это следующая тема 7 класса. Она выходит за пределы основного курса до элементарных построений.',
    labels: bundle => ({
      eyebrow: 'САМОСТОЯТЕЛЬНЫЕ И КОНТРОЛЬНЫЕ · 7 КЛАСС', title: bundle.book.title,
      intro: 'Выбирай работу, вариант и задачу из сборника Иченской. Сначала запиши своё решение; затем можно открыть разбор по шагам.',
      scope: '17 самостоятельных · 6 контрольных · по 2 варианта · 110 задач',
      boundaryNote: '54 задачи (С-1–С-10 и К-1–К-2) подходят к основному курсу Атанасяна до построений. Ещё 56 задач посвящены следующим темам 7 класса; они отмечены отдельно.',
      searchPlaceholder: 'Например: С-1, К-2, вариант 2, параллельные', sourceSummary: 'Работа, вариант и издание',
      noResults: 'Подходящих задач нет. Попробуй номер работы, вариант или математическую тему.',
      boundary: 'Эта задача не входит в сборник самостоятельных и контрольных. Выбери работу и вариант из списка.',
      end: 'Это последняя задача контрольных работ сборника. Можно вернуться к нужной работе или к курсу Атанасяна.',
      exportTitle: bundle.book.title, exportFormat: 'mathexam-ichenskaya-grade7-works-work', exportFilename: 'ichenskaya-my-work',
      companionLabel: 'Курс Атанасяна · до элементарных построений', companionHref: '/geometry-course/first-steps/'
    })
  });
  root.IchenskayaGrade7Works = root.LearningGeometryCourseRuntime.createRenderer(definition);
})(typeof window === 'undefined' ? globalThis : window);
