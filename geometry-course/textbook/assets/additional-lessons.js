/* Keep independently released textbook units available when a new unit cannot load. */
(function (root) {
  'use strict';
  const catalogKeys = ['id', 'revision', 'kind', 'title', 'status', 'source'];

  function append(base, addition) {
    if (addition.bookId !== base.catalog.book.id || !Array.isArray(addition.lessons)) {
      throw new Error('Дополнение относится к другой книге.');
    }
    const known = new Set(base.catalog.entries.map(entry => entry.id));
    const entries = addition.lessons.map(lesson => {
      if (known.has(lesson.id)) throw new Error('Номер задачи уже есть в каталоге.');
      known.add(lesson.id);
      return Object.fromEntries(catalogKeys.map(key => [key, lesson[key]]));
    });
    return {
      ...base,
      catalog: { ...base.catalog, entries: base.catalog.entries.concat(entries) },
      lessons: base.lessons.concat(addition.lessons)
    };
  }

  async function fetchUnit(supplementUrl, fetchFile) {
    const response = await fetchFile(supplementUrl, {cache:'no-cache'});
    if (!response.ok) throw new Error('Не удалось загрузить дополнение задачника.');
    return response.json();
  }

  async function load(base, supplementUrl, fetchFile = root.fetch.bind(root)) {
    return append(base, await fetchUnit(supplementUrl, fetchFile));
  }

  const units = [
      ['/geometry-course/textbook/data/area-lessons.json', '№842–853'],
      ['/geometry-course/textbook/data/area-similarity-lessons.json', '№854–871'],
      ['/geometry-course/textbook/data/midpoint-lessons.json', '№872–899'],
      ['/geometry-course/textbook/data/circle-lessons.json', '№900–925']
  ];

  async function forCourse(base) {
    const results = await Promise.allSettled(units.map(([url]) => fetchUnit(url, root.fetch.bind(root))));
    let combined = base;
    for (const [i, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        combined = append(combined, result.value);
      } else {
        const note = root.document.createElement('p');
        note.setAttribute('role', 'status');
        note.textContent = 'Задачи ' + units[i][1] + ' сейчас не загрузились. Обнови страницу, чтобы попробовать ещё раз.';
        root.document.getElementById('textbook-app').before(note);
      }
    }
    return combined;
  }

  root.GeometryAdditionalLessons = { append, load, forCourse };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {append, load, unitFiles: units.map(([url]) => url)};
  }
})(typeof window === 'undefined' ? globalThis : window);
